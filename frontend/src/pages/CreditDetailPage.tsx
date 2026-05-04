import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, downloadBlob } from '../lib/api'
import { useAuth } from '../context/AuthContext'

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
  const [loading, setLoading] = useState(false)

  async function refresh() {
    if (!id) return
    const [{ data: c }, { data: a }] = await Promise.all([
      api.get<CreditDoc>(`/credits/${id}`),
      api.get<{ allowedNext: string[] }>(`/credits/${id}/allowed-next`),
    ])
    setCredit(c)
    setAllowed(a.allowedNext)
    if (a.allowedNext.length && !a.allowedNext.includes(nextStatus)) {
      setNextStatus(a.allowedNext[0])
    }
    try {
      const d = await api.get<DocMeta[]>(`/documents/credit/${id}`)
      setDocs(d.data)
    } catch {
      setDocs([])
    }
  }

  useEffect(() => {
    if (!id) return
    refresh().catch(() => setError('Chargement impossible'))
  }, [id])

  async function applyTransition(e: React.FormEvent) {
    e.preventDefault()
    if (!id || !nextStatus) return
    setLoading(true)
    setError(null)
    try {
      await api.patch(`/credits/${id}/status`, { nextStatus, comment })
      setComment('')
      await refresh()
    } catch (err: unknown) {
      let msg = 'Transition refusée'
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const m = (err as { response?: { data?: { message?: string } } }).response?.data?.message
        if (m) msg = String(m)
      }
      setError(msg)
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
    try {
      await api.post(`/documents/credit/${id}`, fd)
      setFile(null)
      await refresh()
    } catch {
      setError('Upload échoué')
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

  if (!credit) {
    return <div className="text-slate-400">{error || 'Chargement…'}</div>
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/dossiers" className="text-sm text-blue-400 hover:underline">
            ← Retour liste
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-white">Dossier {credit._id.slice(-8)}</h1>
          <p className="text-slate-400">
            Statut : <span className="text-white">{credit.status}</span> · {credit.amount} € / {credit.durationMonths}{' '}
            mois @ {credit.annualRatePercent}%
          </p>
        </div>
        <button
          type="button"
          onClick={() => dlPdf()}
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-white hover:bg-slate-800"
        >
          Télécharger tableau d&apos;amortissement (PDF)
        </button>
      </div>

      {credit.scoring?.score != null && (
        <section className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
          <h2 className="text-lg font-medium text-white">Scoring</h2>
          <p className="mt-2 text-slate-300">
            Score {credit.scoring.score}/100 — risque {credit.scoring.category}
            {credit.scoring.decision && (
              <>
                {' '}
                — décision indicative :{' '}
                <span className="font-medium text-white">{credit.scoring.decision}</span>
                {credit.scoring.decision === 'ACCEPTE' && ' (≥ 80)'}
                {credit.scoring.decision === 'A_ANALYSER' && ' (50–79)'}
                {credit.scoring.decision === 'REFUS' && ' (< 50)'}
              </>
            )}
          </p>
          {credit.scoring.decisionLabelFr && (
            <p className="mt-1 text-sm text-slate-400">{credit.scoring.decisionLabelFr}</p>
          )}
          <p className="mt-2 text-sm text-slate-400">{credit.scoring.justification}</p>
          {credit.scoring.recommendedActions && credit.scoring.recommendedActions.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-sm text-emerald-200/90">
              {credit.scoring.recommendedActions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          )}
          {credit.scoring.weakPoints && credit.scoring.weakPoints.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-sm text-amber-200">
              {credit.scoring.weakPoints.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      {allowed.length > 0 && (
        <section className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
          <h2 className="text-lg font-medium text-white">Action métier</h2>
          <p className="text-sm text-slate-400">Transitions autorisées pour votre rôle ({user?.role}).</p>
          <form className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end" onSubmit={applyTransition}>
            <label className="text-sm text-slate-400">
              Prochain statut
              <select
                className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white"
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
            <label className="flex-1 text-sm text-slate-400">
              Commentaire obligatoire
              <input
                required
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Motif / analyse…"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500 disabled:opacity-60"
            >
              Valider
            </button>
          </form>
          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        </section>
      )}

      <section className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
        <h2 className="text-lg font-medium text-white">Documents justificatifs</h2>
        <form className="mt-4 flex flex-wrap items-end gap-4" onSubmit={uploadDoc}>
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <button
            type="submit"
            disabled={!file || loading}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-600 disabled:opacity-50"
          >
            Envoyer
          </button>
        </form>
        <ul className="mt-4 space-y-2 text-sm">
          {docs.map((d) => (
            <li key={d._id} className="flex items-center justify-between gap-2">
              <span className="text-slate-300">{d.originalName}</span>
              <button
                type="button"
                className="text-blue-400 hover:underline"
                onClick={() => dlDocument(d._id, d.originalName)}
              >
                Télécharger
              </button>
            </li>
          ))}
          {docs.length === 0 && <li className="text-slate-500">Aucun fichier.</li>}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
        <h2 className="text-lg font-medium text-white">Historique & commentaires</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {(credit.comments || []).map((c, i) => (
            <li key={c._id || i} className="rounded-lg bg-slate-950/60 px-4 py-3">
              <div className="text-xs text-slate-500">
                {c.role} · {c.action} ·{' '}
                {c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}
              </div>
              <div className="mt-1 text-slate-200">{c.text}</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
