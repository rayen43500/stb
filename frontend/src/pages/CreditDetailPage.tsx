import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, downloadBlob } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { formatTnd } from '../lib/money'
import { statusBadgeClass, statusLabelFr } from '../lib/creditStatusStyle'

function axiosMessage(err: unknown): string | null {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const m = (err as { response?: { data?: { message?: string } } }).response?.data?.message
    if (m) return String(m)
  }
  return null
}

type CreditDoc = {
  _id: string
  status: string
  amount: number
  durationMonths: number
  annualRatePercent: number
  monthlyPayment?: number
  debtRatioPercent?: number | null
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
}

type DocMeta = {
  _id: string
  originalName: string
  createdAt: string
}

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
  const [loading, setLoading] = useState(false)

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
      api.get<{ allowedNext: string[] }>(`/credits/${id}/allowed-next`),
    ])
    setCredit(c)
    setAllowed(a.allowedNext)
    setNextStatus((prev) => (a.allowedNext.length && !a.allowedNext.includes(prev) ? a.allowedNext[0] : prev))
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

  async function dlPdf() {
    if (!id) return
    await downloadBlob(`/credits/${id}/amortissement.pdf`, `amortissement-${id}.pdf`)
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

  if (!credit) {
    return <div className="text-slate-600">{error || 'Chargement…'}</div>
  }

  return (
    <div className="stb-page space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/dossiers" className="text-sm text-blue-700 hover:underline">
            ← Retour liste
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Dossier {credit._id.slice(-8)}</h1>
          <p className="text-slate-600">
            Statut :{' '}
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${statusBadgeClass(credit.status)}`}
            >
              {statusLabelFr(credit.status)}
            </span>{' '}
            · {formatTnd(credit.amount)} /{' '}
            {credit.durationMonths} mois @ {credit.annualRatePercent}%
          </p>
        </div>
        <button
          type="button"
          onClick={() => dlPdf()}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Télécharger tableau d&apos;amortissement (PDF)
        </button>
      </div>

      {credit.scoring?.score != null && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900">Scoring</h2>
          <p className="mt-2 text-slate-600">
            Score {credit.scoring.score}/100 — risque {credit.scoring.category}
            {credit.scoring.decision && (
              <>
                {' '}
                — décision indicative :{' '}
                <span className="font-medium text-slate-900">{credit.scoring.decision}</span>
                {credit.scoring.decision === 'ACCEPTE' && ' (≥ 80)'}
                {credit.scoring.decision === 'A_ANALYSER' && ' (50–79)'}
                {credit.scoring.decision === 'REFUS' && ' (< 50)'}
              </>
            )}
          </p>
          {credit.scoring.decisionLabelFr && (
            <p className="mt-1 text-sm text-slate-600">{credit.scoring.decisionLabelFr}</p>
          )}
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

      {allowed.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900">Action métier</h2>
          <p className="text-sm text-slate-600">Transitions autorisées pour votre rôle ({user?.role}).</p>
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
                    {s}
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
                placeholder="Motif / analyse…"
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

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900">Documents justificatifs</h2>
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
        {docError && <p className="mt-3 text-sm text-red-600">{docError}</p>}
        <ul className="mt-4 space-y-2 text-sm">
          {docs.map((d) => (
            <li key={d._id} className="flex items-center justify-between gap-2">
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

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900">Historique & commentaires</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {sortedComments.map((c, i) => (
            <li key={c._id || i} className="rounded-lg bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
              <div className="text-xs text-slate-500">
                {c.role} · {c.action}
                {c.createdAt ? ` · ${new Date(c.createdAt).toLocaleString('fr-TN')}` : ''}
              </div>
              <div className="mt-1 whitespace-pre-wrap text-slate-700">{c.text}</div>
            </li>
          ))}
        </ul>
        {sortedComments.length === 0 && (
          <p className="mt-4 text-sm text-slate-500">Aucun événement ou commentaire enregistré pour ce dossier.</p>
        )}
      </section>
    </div>
  )
}
