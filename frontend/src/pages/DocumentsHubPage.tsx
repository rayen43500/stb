import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileStack, Loader2 } from 'lucide-react'
import { api, downloadBlob } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { formatTnd } from '../lib/money'
import { statusBadgeClass, statusLabelFr } from '../lib/creditStatusStyle'
import { creditTypeLabel } from '../lib/creditTypeLabels'

type Row = {
  _id: string
  status: string
  amount: number
  creditType?: string
  updatedAt: string
  documentVerification?: {
    cin?: boolean
    payslip?: boolean
    contract?: boolean
    bankStatement?: boolean
  }
}

function piecesScore(dv?: Row['documentVerification']): { ok: number; total: number } {
  if (!dv) return { ok: 0, total: 4 }
  const vals = [dv.cin, dv.payslip, dv.contract, dv.bankStatement]
  return { ok: vals.filter(Boolean).length, total: 4 }
}

export function DocumentsHubPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<Row[]>('/credits/')
      .then((r) => {
        setRows(r.data)
        setErr(null)
      })
      .catch(() => setErr('Impossible de charger les dossiers.'))
      .finally(() => setLoading(false))
  }, [])

  const approved = rows.filter((r) => r.status === 'APPROUVÉ')
  const others = rows.filter((r) => r.status !== 'APPROUVÉ')

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="border-b border-[#E2E8F0] pb-4">
        <div className="flex items-center gap-2 text-[#64748B]">
          <FileStack className="h-5 w-5" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wide">Documents</span>
        </div>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-[#0F172A]">Espace documents</h1>
        <p className="mt-1 max-w-2xl text-sm text-[#64748B]">
          Pièces justificatives par dossier et documents générés après approbation (contrat, fiche de décision,
          tableau d&apos;amortissement).
        </p>
      </header>

      {err && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</div>}

      {loading ? (
        <div className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-6 py-12 text-sm text-[#64748B] shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-[#1D4ED8]" aria-hidden />
          Chargement…
        </div>
      ) : (
        <>
          {user?.role === 'CLIENT' && approved.length > 0 && (
            <section className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-emerald-950">Documents générés — dossiers approuvés</h2>
              <ul className="mt-4 space-y-4">
                {approved.map((row) => (
                  <li key={row._id} className="rounded-lg bg-white p-4 ring-1 ring-emerald-100">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-semibold text-[#1D4ED8]">…{row._id.slice(-8)}</span>
                        <span className="ml-2 text-sm text-slate-700">
                          {creditTypeLabel(row.creditType)} — {formatTnd(row.amount)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600"
                          onClick={() => downloadBlob(`/credits/${row._id}/contrat.pdf`, `contrat-${row._id.slice(-8)}.pdf`)}
                        >
                          Contrat PDF
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"
                          onClick={() => downloadBlob(`/credits/${row._id}/decision.pdf`, `decision-${row._id.slice(-8)}.pdf`)}
                        >
                          Fiche décision
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"
                          onClick={() => downloadBlob(`/credits/${row._id}/amortissement.pdf`, `amortissement-${row._id.slice(-8)}.pdf`)}
                        >
                          Amortissement
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
            <div className="border-b border-[#E2E8F0] px-4 py-3">
              <h2 className="text-sm font-semibold text-[#0F172A]">Pièces justificatives par dossier</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[800px] w-full text-left text-sm">
                <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                  <tr>
                    <th className="px-4 py-3">Référence</th>
                    <th className="px-4 py-3">Type crédit</th>
                    <th className="px-4 py-3">Montant</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3">Contrôle pièces</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {(user?.role === 'CLIENT' ? rows : others.length ? others : rows).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-[#64748B]">
                        Aucun dossier —{' '}
                        <Link to="/demande" className="font-semibold text-[#1D4ED8] hover:underline">
                          créer une demande
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    (user?.role === 'CLIENT' ? rows : others.length ? others : rows).map((row) => {
                      const { ok, total } = piecesScore(row.documentVerification)
                      return (
                        <tr key={row._id} className="transition hover:bg-[#F8FAFC]">
                          <td className="px-4 py-3 font-mono text-xs font-semibold text-[#1D4ED8]">…{row._id.slice(-8)}</td>
                          <td className="px-4 py-3">{creditTypeLabel(row.creditType)}</td>
                          <td className="px-4 py-3 tabular-nums font-medium">{formatTnd(row.amount)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${statusBadgeClass(row.status)}`}>
                              {statusLabelFr(row.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs">
                            <span className="font-semibold">{ok}/{total}</span> pièces contrôlées
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link to={`/dossiers/${row._id}`} className="text-xs font-semibold text-[#1D4ED8] hover:underline">
                              Pièces & détail
                            </Link>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
