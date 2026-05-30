import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, downloadBlob } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { formatTnd } from '../lib/money'
import { statusBadgeClass, statusLabelFr } from '../lib/creditStatusStyle'
import { creditTypeLabel } from '../lib/creditTypeLabels'
import type { Role } from '../types'

function axiosMessage(err: unknown): string | null {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const m = (err as { response?: { data?: { message?: string } } }).response?.data?.message
    if (m) return String(m)
  }
  return null
}

type ApplicantInfo = {
  _id?: string
  email?: string
  firstName?: string
  lastName?: string
  phone?: string
  nationalId?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  postalCode?: string
  country?: string
  clientProfile?: {
    monthlyIncome?: number
    monthlyCharges?: number
    contractType?: string
    seniorityMonths?: number
    priorDefaults?: number
    bankingIncidents?: number
  }
}

type CreditDoc = {
  _id: string
  status: string
  amount: number
  durationMonths: number
  annualRatePercent: number
  creditType?: string
  creditPurpose?: string
  monthlyPayment?: number
  debtRatioPercent?: number | null
  documentVerification?: {
    cin?: boolean
    payslip?: boolean
    contract?: boolean
    bankStatement?: boolean
  }
  scoring?: {
    score?: number
    category?: string
    decision?: string
    decisionLabelFr?: string
    justification?: string
    topFactors?: string[]
    weakPoints?: string[]
    recommendedActions?: string[]
  }
  comments?: Array<{ _id?: string; text: string; role: string; action: string; createdAt?: string }>
  applicantId?: ApplicantInfo | string
}

type DocMeta = {
  _id: string
  originalName: string
  createdAt: string
}

const WORKFLOW_STEPS: { status: string; label: string }[] = [
  { status: 'BROUILLON', label: 'Brouillon' },
  { status: 'SOUMIS', label: 'Soumis' },
  { status: 'EN_ANALYSE', label: 'Analyse de risque' },
  { status: 'EN_VALIDATION_CHEF', label: 'Validation chef' },
  { status: 'EN_VALIDATION_COMITE', label: 'Comité' },
  { status: 'APPROUVÉ', label: 'Approuvé' },
]

const DOC_CHECKS: { key: keyof NonNullable<CreditDoc['documentVerification']>; label: string }[] = [
  { key: 'cin', label: 'CIN / identité' },
  { key: 'payslip', label: 'Fiche de paie' },
  { key: 'contract', label: 'Contrat de travail' },
  { key: 'bankStatement', label: 'Relevé bancaire' },
]

const CREDIT_TYPES = ['CONSO', 'IMMOBILIER', 'VEHICULE', 'AUTRE'] as const

export function CreditDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [credit, setCredit] = useState<CreditDoc | null>(null)
  const [allowed, setAllowed] = useState<string[]>([])
  const [nextStatus, setNextStatus] = useState('')
  const [comment, setComment] = useState('')
  const [docs, setDocs] = useState<DocMeta[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [docError, setDocError] = useState<string | null>(null)
  const [metaError, setMetaError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [incidents, setIncidents] = useState({ priorDefaults: 0, bankingIncidents: 0 })

  const loadDocuments = useCallback(async () => {
    if (!id) return
    setDocError(null)
    try {
      const d = await api.get<DocMeta[]>(`/documents/credit/${id}`)
      setDocs(d.data)
    } catch (err: unknown) {
      setDocs([])
      setDocError(axiosMessage(err) || 'Impossible de charger la liste des documents')
    }
  }, [id])

  const refresh = useCallback(async () => {
    if (!id) return
    const [{ data: c }, { data: a }] = await Promise.all([
      api.get<CreditDoc>(`/credits/${id}`),
      api.get<{ current: string; allowedNext: string[] }>(`/credits/${id}/allowed-next`),
    ])
    setCredit(c)
    setAllowed(a.allowedNext)
    setNextStatus((prev) => (a.allowedNext.length && !a.allowedNext.includes(prev) ? a.allowedNext[0] : prev))
    const app = c.applicantId && typeof c.applicantId === 'object' ? c.applicantId : null
    if (app?.clientProfile) {
      setIncidents({
        priorDefaults: app.clientProfile.priorDefaults ?? 0,
        bankingIncidents: app.clientProfile.bankingIncidents ?? 0,
      })
    }
    await loadDocuments()
  }, [id, loadDocuments])

  useEffect(() => {
    if (!id) return
    refresh().catch(() => setError('Chargement impossible'))
  }, [id, refresh])

  async function applyTransition(e: React.FormEvent) {
    e.preventDefault()
    if (!id || !nextStatus) return
    setLoading(true)
    setError(null)
    try {
      await api.patch(`/credits/${id}/status`, { nextStatus, comment: comment.trim() })
      setComment('')
      await refresh()
    } catch (err: unknown) {
      setError(axiosMessage(err) || 'Transition refusée')
    } finally {
      setLoading(false)
    }
  }

  async function uploadDoc(e: React.FormEvent) {
    e.preventDefault()
    if (!id || !file) return
    const fd = new FormData()
    fd.append('file', file)
    setLoading(true)
    setDocError(null)
    try {
      await api.post(`/documents/credit/${id}`, fd)
      setFile(null)
      await loadDocuments()
    } catch (err: unknown) {
      setDocError(axiosMessage(err) || 'Upload échoué')
    } finally {
      setLoading(false)
    }
  }

  async function patchMeta(partial: {
    creditType?: string
    documentVerification?: Partial<CreditDoc['documentVerification']>
    bankingIncidents?: number
    priorDefaults?: number
  }) {
    if (!id) return
    setLoading(true)
    setMetaError(null)
    try {
      await api.patch(`/credits/${id}/meta`, partial)
      await refresh()
    } catch (err: unknown) {
      setMetaError(axiosMessage(err) || 'Mise à jour impossible')
    } finally {
      setLoading(false)
    }
  }

  async function dlPdf() {
    if (!id) return
    await downloadBlob(`/credits/${id}/amortissement.pdf`, `amortissement-${id}.pdf`)
  }

  async function dlContrat() {
    if (!id) return
    await downloadBlob(`/credits/${id}/contrat.pdf`, `contrat-${id}.pdf`)
  }

  async function dlDecision() {
    if (!id) return
    await downloadBlob(`/credits/${id}/decision.pdf`, `decision-${id}.pdf`)
  }

  async function quickTransition(target: string, defaultComment: string) {
    if (!id) return
    const c = comment.trim() || defaultComment
    setLoading(true)
    setError(null)
    try {
      await api.patch(`/credits/${id}/status`, { nextStatus: target, comment: c })
      setComment('')
      await refresh()
    } catch (err: unknown) {
      setError(axiosMessage(err) || 'Transition refusée')
    } finally {
      setLoading(false)
    }
  }

  async function dlDocument(docId: string, name: string) {
    await downloadBlob(`/documents/${docId}/download`, name)
  }

  const sortedComments = useMemo(() => {
    const list = [...(credit?.comments || [])]
    list.sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return tb - ta
    })
    return list
  }, [credit?.comments])

  const timelineAsc = useMemo(() => {
    const list = [...(credit?.comments || [])]
    list.sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return ta - tb
    })
    return list
  }, [credit?.comments])

  const applicant = credit?.applicantId && typeof credit.applicantId === 'object' ? credit.applicantId : null

  const chefAvis = useMemo(() => {
    const chefs = (credit?.comments || []).filter((c) => c.role === 'CHEF_AGENCE')
    const last = chefs[chefs.length - 1]
    return last?.text
  }, [credit?.comments])

  const role = user?.role as Role | undefined
  const isClient = role === 'CLIENT'
  const canVerifyDocs = role === 'ADMIN' || role === 'AGENT_BANCAIRE'
  const canEditMetaType = ['ADMIN', 'AGENT_BANCAIRE', 'CHEF_AGENCE', 'COMITE_CREDIT'].includes(role || '')

  const activeStepIndex = useMemo(() => {
    if (!credit) return -1
    const order = [
      'BROUILLON',
      'SOUMIS',
      'EN_ANALYSE',
      'EN_VALIDATION_CHEF',
      'EN_VALIDATION_COMITE',
      'APPROUVÉ',
      'REFUSÉ',
      'À_MODIFIER',
    ]
    const idx = order.indexOf(credit.status)
    if (credit.status === 'REFUSÉ') return 5
    if (credit.status === 'À_MODIFIER') return 1
    return idx >= 0 ? Math.min(idx, WORKFLOW_STEPS.length - 1) : 0
  }, [credit])

  if (!credit) {
    return <div className="text-slate-600">{error || 'Chargement…'}</div>
  }

  const dv = credit.documentVerification || {}

  return (
    <div className="stb-page stb-stack-tight">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/dossiers" className="text-sm text-blue-700 hover:underline">
            ← Retour liste
          </Link>
          <h1 className="stb-h1 mt-2">Dossier {credit._id.slice(-8)}</h1>
          <p className="text-slate-600">
            Statut :{' '}
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${statusBadgeClass(credit.status)}`}
            >
              {statusLabelFr(credit.status)}
            </span>{' '}
            · {formatTnd(credit.amount)} / {credit.durationMonths} mois @ {credit.annualRatePercent}% ·{' '}
            <span className="font-medium text-slate-800">{creditTypeLabel(credit.creditType)}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => dlPdf()}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Tableau d&apos;amortissement
        </button>
        {credit.status === 'APPROUVÉ' && (
          <>
            <button type="button" onClick={() => dlContrat()} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm text-white hover:bg-emerald-600">
              Contrat PDF
            </button>
            <button type="button" onClick={() => dlDecision()} className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">
              Fiche décision
            </button>
          </>
        )}
      </div>

      {credit.status === 'À_MODIFIER' && isClient && (
        <section className="stb-panel border-amber-300 bg-amber-50">
          <h2 className="stb-h2 text-amber-950">Modification demandée</h2>
          <p className="mt-2 text-sm text-amber-900">
            L&apos;agence a demandé des corrections. Consultez les commentaires ci-dessous, mettez à jour vos pièces
            puis resoumettez le dossier via « Action métier ».
          </p>
        </section>
      )}

      <section className="stb-panel-accent">
        <h2 className="stb-h2">Parcours du dossier</h2>
        <p className="stb-caption mt-2 max-w-prose sm:text-sm">
          Soumis → Vérification agent → Analyse de risque → Validation chef → Comité → Décision finale
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {WORKFLOW_STEPS.map((step, i) => {
            const reached = activeStepIndex >= i || credit.status === step.status
            const current = credit.status === step.status
            return (
              <div key={step.status} className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                    current
                      ? 'bg-blue-700 text-white ring-blue-800'
                      : reached
                        ? 'bg-emerald-50 text-emerald-900 ring-emerald-200'
                        : 'bg-slate-100 text-slate-500 ring-slate-200'
                  }`}
                >
                  {step.label}
                </span>
                {i < WORKFLOW_STEPS.length - 1 && <span className="text-slate-300">→</span>}
              </div>
            )
          })}
        </div>
      </section>

      {applicant && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="stb-panel">
            <h2 className="stb-h2">Informations client</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4 border-b border-slate-100 py-2">
                <dt className="text-slate-500">Nom</dt>
                <dd className="font-medium text-slate-900">
                  {applicant.firstName} {applicant.lastName}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-100 py-2">
                <dt className="text-slate-500">E-mail</dt>
                <dd className="text-slate-800">{applicant.email}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-100 py-2">
                <dt className="text-slate-500">CIN</dt>
                <dd className="font-mono text-slate-800">{applicant.nationalId || '—'}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-100 py-2">
                <dt className="text-slate-500">Téléphone</dt>
                <dd className="text-slate-800">{applicant.phone || '—'}</dd>
              </div>
              <div className="flex justify-between gap-4 py-2">
                <dt className="text-slate-500">Adresse</dt>
                <dd className="max-w-[60%] text-right text-slate-800">
                  {[applicant.addressLine1, applicant.addressLine2, applicant.postalCode, applicant.city, applicant.country]
                    .filter(Boolean)
                    .join(', ') || '—'}
                </dd>
              </div>
            </dl>
          </section>

          <section className="stb-panel">
            <h2 className="stb-h2">Informations financières</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4 border-b border-slate-100 py-2">
                <dt className="text-slate-500">Revenus nets (TND)</dt>
                <dd className="tabular-nums font-medium">
                  {applicant.clientProfile?.monthlyIncome != null
                    ? formatTnd(applicant.clientProfile.monthlyIncome)
                    : '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-100 py-2">
                <dt className="text-slate-500">Charges (TND)</dt>
                <dd className="tabular-nums">
                  {applicant.clientProfile?.monthlyCharges != null
                    ? formatTnd(applicant.clientProfile.monthlyCharges)
                    : '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-100 py-2">
                <dt className="text-slate-500">Contrat / ancienneté</dt>
                <dd className="text-slate-800">
                  {applicant.clientProfile?.contractType || '—'}{' '}
                  {applicant.clientProfile?.seniorityMonths != null
                    ? `· ${applicant.clientProfile.seniorityMonths} mois`
                    : ''}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-2">
                <dt className="text-slate-500">Endettement après prêt</dt>
                <dd className="tabular-nums font-semibold text-slate-900">
                  {credit.debtRatioPercent != null ? `${credit.debtRatioPercent} %` : '—'}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      )}

      <section className="stb-panel">
        <h2 className="stb-h2">Crédit demandé</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Montant</dt>
            <dd className="font-semibold text-slate-900">{formatTnd(credit.amount)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Durée</dt>
            <dd>{credit.durationMonths} mois</dd>
          </div>
          <div>
            <dt className="text-slate-500">Taux annuel</dt>
            <dd>{credit.annualRatePercent}%</dd>
          </div>
          <div>
            <dt className="text-slate-500">Mensualité (simulation)</dt>
            <dd className="tabular-nums">{credit.monthlyPayment != null ? formatTnd(credit.monthlyPayment) : '—'}</dd>
          </div>
          {credit.creditPurpose && (
            <div className="sm:col-span-2">
              <dt className="text-slate-500">Objet du crédit</dt>
              <dd>{credit.creditPurpose}</dd>
            </div>
          )}
        </dl>

        {canEditMetaType && (
          <div className="mt-6 flex flex-wrap items-end gap-4 border-t border-slate-100 pt-6">
            <label className="text-sm text-slate-600">
              Type de crédit
              <select
                className="mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800"
                value={credit.creditType || 'CONSO'}
                onChange={(e) => patchMeta({ creditType: e.target.value })}
                disabled={loading}
              >
                {CREDIT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {creditTypeLabel(t)}
                  </option>
                ))}
              </select>
            </label>
            {metaError && <p className="text-sm text-red-600">{metaError}</p>}
          </div>
        )}
      </section>

      {role === 'COMITE_CREDIT' && chefAvis && (
        <section className="stb-panel border-indigo-200 bg-indigo-50/50">
          <h2 className="stb-h2 text-indigo-950">Avis chef d&apos;agence</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-indigo-900">{chefAvis}</p>
        </section>
      )}

      {credit.scoring?.score != null && (
        <section className="stb-panel">
          <h2 className="stb-h2">Analyse de risque</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-2 text-slate-500">Revenus (profil)</td>
                  <td className="py-2 font-medium tabular-nums">
                    {applicant?.clientProfile?.monthlyIncome != null
                      ? formatTnd(applicant.clientProfile.monthlyIncome)
                      : '—'}
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 text-slate-500">Charges</td>
                  <td className="py-2 font-medium tabular-nums">
                    {applicant?.clientProfile?.monthlyCharges != null
                      ? formatTnd(applicant.clientProfile.monthlyCharges)
                      : '—'}
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 text-slate-500">Endettement</td>
                  <td className="py-2 font-semibold tabular-nums">
                    {credit.debtRatioPercent != null ? `${credit.debtRatioPercent} %` : '—'}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-500">Indicateur / niveau de risque</td>
                  <td className="py-2">
                    <span className="font-bold text-slate-900">{credit.scoring.score}/100</span>
                    {' — '}
                    <span className="text-amber-800">{credit.scoring.category}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-slate-600">
            Orientation indicative : <strong>{credit.scoring.decision}</strong>
            {credit.scoring.decisionLabelFr && (
              <>
                {' '}
                — {credit.scoring.decisionLabelFr}
              </>
            )}
          </p>
          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">Synthèse d&apos;analyse</p>
          <p className="mt-2 text-sm text-slate-600">{credit.scoring.justification}</p>
          {credit.scoring.recommendedActions && credit.scoring.recommendedActions.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-sm text-emerald-700">
              {credit.scoring.recommendedActions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          )}
          {credit.scoring.weakPoints && credit.scoring.weakPoints.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-sm text-amber-700">
              {credit.scoring.weakPoints.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      {canVerifyDocs && (
        <section className="stb-panel border-amber-200 bg-amber-50/40">
          <h2 className="stb-h2">Vérification des pièces (agent)</h2>
          <p className="mt-1 text-sm text-slate-600">
            Cochez les pièces conformes après contrôle (CIN, fiche de paie, contrat, relevé).
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {DOC_CHECKS.map(({ key, label }) => {
              const checked = Boolean(dv[key])
              const tone = checked ? 'ring-emerald-300 bg-emerald-50' : 'ring-orange-300 bg-orange-50'
              return (
              <li key={key} className={`flex items-center gap-3 rounded-lg px-4 py-3 ring-1 ${tone}`}>
                <input
                  type="checkbox"
                  id={key}
                  checked={checked}
                  onChange={(e) =>
                    patchMeta({
                      documentVerification: { ...dv, [key]: e.target.checked },
                    })
                  }
                  disabled={loading}
                  className="h-4 w-4 rounded border-slate-300 text-blue-700"
                />
                <label htmlFor={key} className="text-sm font-medium text-slate-800">
                  {label} {checked ? '✓' : '— à vérifier'}
                </label>
              </li>
            )})}
          </ul>

          <h3 className="mt-6 text-sm font-semibold text-slate-800">Incidents de paiement (alimente le scoring IA)</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-slate-600">
              Retards / défauts antérieurs
              <input
                type="number"
                min={0}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
                value={incidents.priorDefaults}
                onChange={(e) => setIncidents((i) => ({ ...i, priorDefaults: Number(e.target.value) }))}
              />
            </label>
            <label className="text-sm text-slate-600">
              Incidents bancaires (rejets chèque, etc.)
              <input
                type="number"
                min={0}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
                value={incidents.bankingIncidents}
                onChange={(e) => setIncidents((i) => ({ ...i, bankingIncidents: Number(e.target.value) }))}
              />
            </label>
          </div>
          <button
            type="button"
            disabled={loading}
            className="mt-3 rounded-lg bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-700"
            onClick={() => patchMeta(incidents)}
          >
            Enregistrer incidents
          </button>

          {role === 'AGENT_BANCAIRE' && credit.status === 'EN_ANALYSE' && (
            <div className="mt-6 flex flex-wrap gap-3 border-t border-amber-200 pt-4">
              <button
                type="button"
                disabled={loading}
                className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
                onClick={() => quickTransition('EN_VALIDATION_CHEF', 'Dossier complet et vérifié — transmission au chef.')}
              >
                Transmettre au chef
              </button>
              <button
                type="button"
                disabled={loading}
                className="rounded-lg border border-amber-600 px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
                onClick={() => quickTransition('À_MODIFIER', 'Documents manquants ou incomplets — renvoi au client.')}
              >
                Renvoyer au client
              </button>
            </div>
          )}
          {metaError && <p className="mt-3 text-sm text-red-600">{metaError}</p>}
        </section>
      )}

      {allowed.length > 0 && (
        <section className="stb-panel">
          <h2 className="stb-h2">Action métier</h2>
          <p className="text-sm text-slate-600">
            Transitions autorisées pour votre rôle ({user?.role}). Commentaire obligatoire pour traçabilité.
          </p>
          <form className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end" onSubmit={applyTransition}>
            <label className="text-sm text-slate-600">
              Prochain statut
              <select
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-700"
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value)}
              >
                {allowed.map((s) => (
                  <option key={s} value={s}>
                    {statusLabelFr(s)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex-1 text-sm text-slate-600">
              Commentaire obligatoire
              <input
                required
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-700"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Ex. Document manquant : relevé des 3 derniers mois."
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-600 disabled:opacity-60"
            >
              Valider
            </button>
          </form>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </section>
      )}

      <section className="stb-panel">
        <h2 className="stb-h2">Documents justificatifs</h2>
        {isClient && (
          <form className="mt-4 flex flex-wrap items-end gap-4" onSubmit={uploadDoc}>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <button
              type="submit"
              disabled={!file || loading}
              className="rounded-lg bg-blue-700 px-4 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-50"
            >
              Envoyer
            </button>
          </form>
        )}
        {!isClient && (
          <p className="mt-2 text-sm text-slate-600">Téléchargement des pièces déposées par le client.</p>
        )}
        {docError && <p className="mt-3 text-sm text-red-600">{docError}</p>}
        <ul className="mt-4 space-y-2 text-sm">
          {docs.map((d) => (
            <li key={d._id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
              <span className="text-slate-700">{d.originalName}</span>
              <button
                type="button"
                className="text-blue-700 hover:underline"
                onClick={() => dlDocument(d._id, d.originalName)}
              >
                Télécharger
              </button>
            </li>
          ))}
          {docs.length === 0 && <li className="text-slate-500">Aucun fichier.</li>}
        </ul>
      </section>

      <section className="stb-panel">
        <h2 className="stb-h2">Historique & traçabilité</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2 pr-4">Action</th>
                <th className="py-2 pr-4">Rôle</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2">Détail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {timelineAsc.map((c, i) => (
                <tr key={c._id || i}>
                  <td className="py-3 font-medium text-slate-800">{c.action}</td>
                  <td className="py-3 text-slate-600">{c.role}</td>
                  <td className="py-3 whitespace-nowrap text-slate-500">
                    {c.createdAt ? new Date(c.createdAt).toLocaleString('fr-TN') : '—'}
                  </td>
                  <td className="py-3 whitespace-pre-wrap text-slate-700">{c.text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {timelineAsc.length === 0 && (
          <p className="mt-4 text-sm text-slate-500">Aucun événement enregistré pour ce dossier.</p>
        )}
      </section>

      <section className="stb-panel bg-slate-50/90">
        <h2 className="stb-h2">Commentaires récents</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {sortedComments.map((c, i) => (
            <li key={c._id || i} className="rounded-lg bg-white px-4 py-3 ring-1 ring-slate-200">
              <div className="text-xs text-slate-500">
                {c.role} · {c.action}
                {c.createdAt ? ` · ${new Date(c.createdAt).toLocaleString('fr-TN')}` : ''}
              </div>
              <div className="mt-1 whitespace-pre-wrap text-slate-700">{c.text}</div>
            </li>
          ))}
        </ul>
        {sortedComments.length === 0 && (
          <p className="mt-4 text-sm text-slate-500">Aucun commentaire pour le moment.</p>
        )}
      </section>
    </div>
  )
}
