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
    existingCredits?: number
    additionalIncome?: number
    maritalStatus?: string
    profession?: string
    employerName?: string
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
  size?: number
}

const WORKFLOW_STEPS: { status: string; label: string }[] = [
  { status: 'BROUILLON', label: 'Brouillon' },
  { status: 'SOUMIS', label: 'Soumis' },
  { status: 'EN_ANALYSE', label: 'Analyse' },
  { status: 'EN_VALIDATION_CHEF', label: 'Validation chef' },
  { status: 'EN_VALIDATION_COMITE', label: 'Comité' },
  { status: 'APPROUVÉ', label: 'Approuvé' },
]

const DOC_CHECKS: { key: keyof NonNullable<CreditDoc['documentVerification']>; label: string; cat: string }[] = [
  { key: 'cin', label: 'CIN.pdf', cat: 'Identité' },
  { key: 'payslip', label: 'FichePaie.pdf', cat: 'Salaire' },
  { key: 'contract', label: 'Contrat_Travail.pdf', cat: 'Travail' },
  { key: 'bankStatement', label: 'Releve_Bancaire.pdf', cat: 'Banque' },
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
  const role = user?.role as Role | undefined
  const isClient = role === 'CLIENT'
  const isAgent = role === 'AGENT_BANCAIRE'
  const canVerifyDocs = isAgent
  const canEditMetaType = ['AGENT_BANCAIRE', 'CHEF_AGENCE'].includes(role || '')

  const activeStepIndex = useMemo(() => {
    if (!credit) return -1
    const order = ['BROUILLON', 'SOUMIS', 'EN_ANALYSE', 'EN_VALIDATION_CHEF', 'EN_VALIDATION_COMITE', 'APPROUVÉ', 'REFUSÉ', 'À_MODIFIER']
    const idx = order.indexOf(credit.status)
    if (credit.status === 'REFUSÉ') return 5
    if (credit.status === 'À_MODIFIER') return 1
    return idx >= 0 ? Math.min(idx, WORKFLOW_STEPS.length - 1) : 0
  }, [credit])

  if (!credit) {
    return <div className="text-slate-600">{error || 'Chargement…'}</div>
  }

  const dv = credit.documentVerification || {}

  // Calcul taux endettement
  const income = applicant?.clientProfile?.monthlyIncome
  const debtRatio = credit.debtRatioPercent
  const debtOk = debtRatio != null && debtRatio <= 33

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">

      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/dossiers" className="text-sm text-blue-700 hover:underline">← Retour liste</Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold text-[#0F172A]">
              DOS-{new Date().getFullYear()}-{credit._id.slice(-4).toUpperCase()} · {applicant ? `${applicant.firstName} ${applicant.lastName}` : '—'}
            </h1>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusBadgeClass(credit.status)}`}>
              {statusLabelFr(credit.status)}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => dlPdf()} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
            Amortissement PDF
          </button>
          {credit.status === 'APPROUVÉ' && (
            <>
              <button type="button" onClick={() => dlContrat()} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm text-white hover:bg-emerald-600">Contrat PDF</button>
              <button type="button" onClick={() => dlDecision()} className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">Fiche décision</button>
            </>
          )}
        </div>
      </div>

      {/* Parcours */}
      <section className="rounded-xl border border-blue-200/70 bg-gradient-to-br from-blue-50/95 to-white p-5">
        <h2 className="text-sm font-semibold text-[#0F172A]">Parcours du dossier</h2>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {WORKFLOW_STEPS.map((step, i) => {
            const reached = activeStepIndex >= i
            const current = credit.status === step.status
            return (
              <div key={step.status} className="flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                  current ? 'bg-blue-700 text-white ring-blue-800'
                  : reached ? 'bg-emerald-50 text-emerald-900 ring-emerald-200'
                  : 'bg-slate-100 text-slate-500 ring-slate-200'
                }`}>
                  {step.label}
                </span>
                {i < WORKFLOW_STEPS.length - 1 && <span className="text-slate-300">→</span>}
              </div>
            )
          })}
        </div>
      </section>

      {/* Bloc principal : infos + crédit */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Informations client */}
        <section className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-[#0F172A]">Informations client</h2>
          {applicant ? (
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-[#64748B]">Nom complet</dt>
                <dd className="font-medium text-[#0F172A]">{applicant.firstName} {applicant.lastName}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#64748B]">E-mail</dt>
                <dd className="text-[#0F172A]">{applicant.email || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#64748B]">CIN</dt>
                <dd className="font-mono text-[#0F172A]">{applicant.nationalId || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#64748B]">Téléphone</dt>
                <dd className="text-[#0F172A]">{applicant.phone || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#64748B]">Adresse</dt>
                <dd className="text-[#0F172A]">
                  {[applicant.addressLine1, applicant.city, applicant.postalCode, applicant.country].filter(Boolean).join(', ') || '—'}
                </dd>
              </div>
              {applicant.clientProfile?.maritalStatus && (
                <div>
                  <dt className="text-xs text-[#64748B]">Situation familiale</dt>
                  <dd className="text-[#0F172A]">{applicant.clientProfile.maritalStatus}</dd>
                </div>
              )}
              {applicant.clientProfile?.profession && (
                <div>
                  <dt className="text-xs text-[#64748B]">Profession</dt>
                  <dd className="text-[#0F172A]">{applicant.clientProfile.profession}</dd>
                </div>
              )}
              {applicant.clientProfile?.employerName && (
                <div>
                  <dt className="text-xs text-[#64748B]">Employeur</dt>
                  <dd className="text-[#0F172A]">{applicant.clientProfile.employerName}</dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="text-sm text-slate-500">Informations non disponibles</p>
          )}
        </section>

        {/* Informations financières */}
        <section className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-[#0F172A]">Informations financières</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-[#64748B]">Revenus mensuels nets</dt>
              <dd className="font-semibold text-[#0F172A]">
                {applicant?.clientProfile?.monthlyIncome != null ? formatTnd(applicant.clientProfile.monthlyIncome) : '—'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#64748B]">Charges mensuelles</dt>
              <dd className="text-[#0F172A]">
                {applicant?.clientProfile?.monthlyCharges != null ? formatTnd(applicant.clientProfile.monthlyCharges) : '—'}
              </dd>
            </div>
            {applicant?.clientProfile?.existingCredits != null && (
              <div className="flex justify-between">
                <dt className="text-[#64748B]">Crédits en cours</dt>
                <dd className="text-[#0F172A]">{formatTnd(applicant.clientProfile.existingCredits)}/mois</dd>
              </div>
            )}
            {applicant?.clientProfile?.additionalIncome != null && applicant.clientProfile.additionalIncome > 0 && (
              <div className="flex justify-between">
                <dt className="text-[#64748B]">Revenus supplémentaires</dt>
                <dd className="text-[#0F172A]">{formatTnd(applicant.clientProfile.additionalIncome)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-100 pt-2">
              <dt className="text-[#64748B]">Taux d'endettement</dt>
              <dd className="flex items-center gap-2 font-semibold">
                <span className={debtRatio != null ? (debtOk ? 'text-emerald-600' : 'text-red-600') : 'text-slate-400'}>
                  {debtRatio != null ? `${debtRatio} %` : '—'}
                </span>
                {debtRatio != null && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${debtOk ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {debtOk ? 'OK' : 'ÉLEVÉ'}
                  </span>
                )}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#64748B]">Type de contrat</dt>
              <dd className="text-[#0F172A]">{applicant?.clientProfile?.contractType || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#64748B]">Ancienneté</dt>
              <dd className="text-[#0F172A]">
                {applicant?.clientProfile?.seniorityMonths != null
                  ? `${Math.floor(applicant.clientProfile.seniorityMonths / 12)} ans`
                  : '—'}
              </dd>
            </div>
          </dl>
        </section>

        {/* Crédit demandé */}
        <section className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-[#0F172A]">Crédit demandé</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-[#64748B]">Montant</dt>
              <dd className="font-bold text-[#1D4ED8]">{formatTnd(credit.amount)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#64748B]">Durée</dt>
              <dd className="text-[#0F172A]">{credit.durationMonths} mois ({Math.round(credit.durationMonths / 12)} ans)</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#64748B]">Taux annuel</dt>
              <dd className="text-[#0F172A]">{credit.annualRatePercent} %</dd>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2">
              <dt className="text-[#64748B]">Mensualité</dt>
              <dd className="font-semibold text-[#0F172A]">
                {credit.monthlyPayment != null ? formatTnd(credit.monthlyPayment) : '—'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#64748B]">Type de crédit</dt>
              <dd className="text-[#0F172A]">{creditTypeLabel(credit.creditType)}</dd>
            </div>
            {credit.creditPurpose && (
              <div>
                <dt className="text-[#64748B]">Objet</dt>
                <dd className="mt-1 text-[#0F172A]">{credit.creditPurpose}</dd>
              </div>
            )}
          </dl>
          {canEditMetaType && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <label className="text-xs text-slate-600">
                Modifier le type
                <select
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                  value={credit.creditType || 'CONSO'}
                  onChange={(e) => patchMeta({ creditType: e.target.value })}
                  disabled={loading}
                >
                  {CREDIT_TYPES.map((t) => (
                    <option key={t} value={t}>{creditTypeLabel(t)}</option>
                  ))}
                </select>
              </label>
              {metaError && <p className="mt-2 text-xs text-red-600">{metaError}</p>}
            </div>
          )}
        </section>
      </div>

      {/* Scoring IA */}
      {credit.scoring?.score != null && (
        <section className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-[#0F172A]">Analyse de risque IA</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-slate-50 p-4 text-center">
              <p className="text-xs text-[#64748B]">Score</p>
              <p className="mt-1 text-3xl font-bold text-[#1D4ED8]">{credit.scoring.score}<span className="text-sm text-slate-400">/100</span></p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4 text-center">
              <p className="text-xs text-[#64748B]">Niveau de risque</p>
              <p className={`mt-1 text-lg font-bold ${
                credit.scoring.category === 'FAIBLE' ? 'text-emerald-600'
                : credit.scoring.category === 'MOYEN' ? 'text-amber-600'
                : 'text-red-600'
              }`}>{credit.scoring.category || '—'}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4 text-center">
              <p className="text-xs text-[#64748B]">Orientation</p>
              <p className={`mt-1 text-lg font-bold ${
                credit.scoring.decision === 'ACCEPTE' ? 'text-emerald-600'
                : credit.scoring.decision === 'REFUS' ? 'text-red-600'
                : 'text-amber-600'
              }`}>{credit.scoring.decisionLabelFr || credit.scoring.decision || '—'}</p>
            </div>
          </div>
          {credit.scoring.justification && (
            <p className="mt-4 text-sm text-slate-600">{credit.scoring.justification}</p>
          )}
          {credit.scoring.weakPoints && credit.scoring.weakPoints.length > 0 && (
            <ul className="mt-3 list-inside list-disc text-sm text-amber-700">
              {credit.scoring.weakPoints.map((w) => <li key={w}>{w}</li>)}
            </ul>
          )}
          {credit.scoring.recommendedActions && credit.scoring.recommendedActions.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-sm text-emerald-700">
              {credit.scoring.recommendedActions.map((a) => <li key={a}>{a}</li>)}
            </ul>
          )}
        </section>
      )}

      {/* Pièces justificatives */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-[#0F172A]">Pièces justificatives</h2>

          {/* Upload client */}
          {isClient && (
            <form className="mb-4 flex flex-wrap items-end gap-3" onSubmit={uploadDoc}>
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <button type="submit" disabled={!file || loading} className="rounded-lg bg-blue-700 px-4 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-50">
                Envoyer
              </button>
            </form>
          )}

          {/* Liste documents */}
          <ul className="space-y-2">
            {docs.map((d) => {
              const docCheck = DOC_CHECKS.find(dc =>
                d.originalName.toLowerCase().includes(dc.key === 'cin' ? 'cin' :
                  dc.key === 'payslip' ? 'paie' :
                  dc.key === 'contract' ? 'contrat' : 'releve')
              )
              const isValidated = docCheck ? Boolean(dv[docCheck.key]) : false
              return (
                <li key={d._id} className="flex items-center justify-between gap-3 rounded-lg border border-[#E2E8F0] px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 text-xs font-bold">PDF</div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#0F172A]">{d.originalName}</p>
                      <p className="text-xs text-[#64748B]">
                        {new Date(d.createdAt).toLocaleDateString('fr-TN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isAgent && (
                      <span className={`text-xs font-medium ${isValidated ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {isValidated ? '✓ Validé' : '⚠ À vérifier'}
                      </span>
                    )}
                    <button type="button" onClick={() => dlDocument(d._id, d.originalName)} className="text-blue-700 hover:text-blue-600" title="Télécharger">
                      ↓
                    </button>
                  </div>
                </li>
              )
            })}
            {docs.length === 0 && <li className="text-sm text-slate-500">Aucun fichier déposé.</li>}
          </ul>
          {docError && <p className="mt-2 text-sm text-red-600">{docError}</p>}
        </section>

        {/* Historique */}
        <section className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-[#0F172A]">Historique du dossier</h2>
          {timelineAsc.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun événement enregistré.</p>
          ) : (
            <ol className="relative border-l border-[#E2E8F0] pl-5 space-y-4">
              {timelineAsc.map((c, i) => (
                <li key={c._id || i} className="ml-1">
                  <span className="absolute -left-[7px] mt-1 h-3 w-3 rounded-full border-2 border-white bg-[#1D4ED8]" />
                  <p className="text-xs text-[#94A3B8]">
                    {c.createdAt ? new Date(c.createdAt).toLocaleString('fr-TN', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                  </p>
                  <p className="text-sm font-medium text-[#0F172A]">{c.action}</p>
                  <p className="text-xs text-[#64748B]">{c.role}</p>
                  {c.text && <p className="mt-1 text-xs text-slate-600">{c.text}</p>}
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {/* Vérification agent */}
      {canVerifyDocs && (
        <section className="rounded-xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-[#0F172A]">Vérification des pièces</h2>
          <p className="mb-4 text-sm text-slate-600">Cochez les pièces conformes après contrôle.</p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {DOC_CHECKS.map(({ key, label, cat }) => {
              const checked = Boolean(dv[key])
              return (
                <label key={key} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition ${checked ? 'border-emerald-200 bg-emerald-50' : 'border-orange-200 bg-orange-50'}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => patchMeta({ documentVerification: { ...dv, [key]: e.target.checked } })}
                    disabled={loading}
                    className="h-4 w-4 rounded border-slate-300 text-blue-700"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{label}</p>
                    <p className="text-xs text-slate-500">{cat} · {checked ? '✓ Validé' : 'À vérifier'}</p>
                  </div>
                </label>
              )
            })}
          </div>

          {/* Incidents */}
          <div className="mt-5">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Incidents de paiement</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="flex items-center gap-3 rounded-lg border border-[#E2E8F0] bg-white px-4 py-3">
                <input
                  type="checkbox"
                  checked={incidents.priorDefaults > 0}
                  onChange={(e) => setIncidents(i => ({ ...i, priorDefaults: e.target.checked ? 1 : 0 }))}
                  className="h-4 w-4"
                />
                <span className="text-sm text-slate-700">Retards de remboursement</span>
              </label>
              <label className="flex items-center gap-3 rounded-lg border border-[#E2E8F0] bg-white px-4 py-3">
                <input
                  type="checkbox"
                  checked={incidents.bankingIncidents > 0}
                  onChange={(e) => setIncidents(i => ({ ...i, bankingIncidents: e.target.checked ? 1 : 0 }))}
                  className="h-4 w-4"
                />
                <span className="text-sm text-slate-700">Rejets de chèque</span>
              </label>
              <label className="flex items-center gap-3 rounded-lg border border-[#E2E8F0] bg-white px-4 py-3">
                <input
                  type="checkbox"
                  checked={incidents.bankingIncidents > 1}
                  onChange={(e) => setIncidents(i => ({ ...i, bankingIncidents: e.target.checked ? 2 : Math.min(1, i.bankingIncidents) }))}
                  className="h-4 w-4"
                />
                <span className="text-sm text-slate-700">Incidents bancaires</span>
              </label>
            </div>
            <p className="mt-2 text-xs text-slate-500">Ces données alimentent le scoring IA et mettent à jour le niveau de risque.</p>
            <button
              type="button"
              disabled={loading}
              className="mt-3 rounded-lg bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-700"
              onClick={() => patchMeta(incidents)}
            >
              Enregistrer incidents
            </button>
          </div>

          {/* Actions agent */}
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Commentaire (obligatoire)</h3>
            <textarea
              className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Documents complets et vérifiés. Endettement maîtrisé, transmis au scoring."
            />
            <div className="mt-3 flex flex-wrap gap-3">
              {credit.status === 'SOUMIS' && (
                <button
                  type="button"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg bg-[#1D4ED8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1E40AF]"
                  onClick={() => quickTransition('EN_ANALYSE', comment.trim() || 'Dossier pris en charge — analyse en cours.')}
                >
                  → Lancer l'analyse
                </button>
              )}
              {credit.status === 'EN_ANALYSE' && (
                <button
                  type="button"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg bg-[#1D4ED8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1E40AF]"
                  onClick={() => quickTransition('EN_VALIDATION_CHEF', comment.trim() || 'Dossier complet et vérifié — transmission au chef.')}
                >
                  → Transmettre au chef
                </button>
              )}
              {(credit.status === 'SOUMIS' || credit.status === 'EN_ANALYSE') && (
                <button
                  type="button"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg border border-amber-400 bg-amber-400 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-500"
                  onClick={() => quickTransition('À_MODIFIER', comment.trim() || 'Documents manquants ou incomplets — renvoi au client.')}
                >
                  ↺ Renvoyer au client
                </button>
              )}
            </div>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            {metaError && <p className="mt-2 text-sm text-red-600">{metaError}</p>}
          </div>
        </section>
      )}

      {/* Action métier (autres rôles) */}
      {allowed.length > 0 && !isAgent && (
        <section className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-[#0F172A]">Action métier</h2>
          <p className="mb-4 text-sm text-slate-600">Transitions autorisées pour votre rôle ({user?.role}).</p>
          <form className="flex flex-col gap-4 sm:flex-row sm:items-end" onSubmit={applyTransition}>
            <label className="text-sm text-slate-600">
              Prochain statut
              <select
                className="mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-700"
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value)}
              >
                {allowed.map((s) => (
                  <option key={s} value={s}>{statusLabelFr(s)}</option>
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
            <button type="submit" disabled={loading} className="rounded-lg bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-600 disabled:opacity-60">
              Valider
            </button>
          </form>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </section>
      )}

      {/* Upload client */}
      {isClient && (
        <section className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-[#0F172A]">Ajouter un document</h2>
          {credit.status === 'À_MODIFIER' && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              L'agence a demandé des corrections. Mettez à jour vos pièces puis resoumettez.
            </div>
          )}
          <form className="flex flex-wrap items-end gap-3" onSubmit={uploadDoc}>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <button type="submit" disabled={!file || loading} className="rounded-lg bg-blue-700 px-4 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-50">
              Envoyer
            </button>
          </form>
          {docError && <p className="mt-2 text-sm text-red-600">{docError}</p>}
        </section>
      )}

      {/* Action métier client */}
      {isClient && allowed.length > 0 && (
        <section className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-[#0F172A]">Soumettre le dossier</h2>
          <form className="flex flex-col gap-4 sm:flex-row sm:items-end" onSubmit={applyTransition}>
            <label className="text-sm text-slate-600">
              Action
              <select
                className="mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-700"
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value)}
              >
                {allowed.map((s) => (
                  <option key={s} value={s}>{statusLabelFr(s)}</option>
                ))}
              </select>
            </label>
            <label className="flex-1 text-sm text-slate-600">
              Commentaire
              <input
                required
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-700"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Message pour l'agence…"
              />
            </label>
            <button type="submit" disabled={loading} className="rounded-lg bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-600 disabled:opacity-60">
              Valider
            </button>
          </form>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </section>
      )}

    </div>
  )
}
