import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileStack, Loader2 } from 'lucide-react'
import { api } from '../lib/api'
import { formatTnd } from '../lib/money'
import { statusBadgeClass, statusLabelFr } from '../lib/creditStatusStyle'
import { creditTypeLabel } from '../lib/creditTypeLabels'

type DocMeta = {
  cin?: boolean
  payslip?: boolean
  contract?: boolean
  bankStatement?: boolean
}

type Row = {
  _id: string
  status: string
  amount: number
  creditType?: string
  updatedAt: string
  documentVerification?: DocMeta
}

function piecesScore(dv?: DocMeta): { ok: number; total: number } {
  if (!dv) return { ok: 0, total: 4 }
  const vals = [dv.cin, dv.payslip, dv.contract, dv.bankStatement]
  const ok = vals.filter(Boolean).length
  return { ok, total: 4 }
}

export function DocumentsHubPage() {
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

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="border-b border-[#E2E8F0] pb-4">
        <div className="flex items-center gap-2 text-[#64748B]">
          <FileStack className="h-5 w-5" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wide">Pièces justificatives</span>
        </div>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-[#0F172A]">Documents par dossier</h1>
        <p className="mt-1 max-w-2xl text-sm text-[#64748B]">
          Accédez au détail pour déposer ou consulter les pièces (CIN, fiche de paie, contrat, relevé). Le contrôle de
          conformité est effectué par l&apos;agence ; les coches ci-dessous reflètent l&apos;état de vérification enregistré.
        </p>
      </header>

      {err && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</div>}

      {loading ? (
        <div className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-6 py-12 text-sm text-[#64748B] shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-[#1D4ED8]" aria-hidden />
          Chargement…
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[800px] w-full text-left text-sm">
              <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                <tr>
                  <th className="px-4 py-3">Référence</th>
                  <th className="px-4 py-3">Type crédit</th>
                  <th className="px-4 py-3">Montant</th>
                  <th className="px-4 py-3">Statut dossier</th>
                  <th className="px-4 py-3">Contrôle pièces</th>
                  <th className="px-4 py-3">Mise à jour</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-[#64748B]">
                      Aucun dossier —{' '}
                      <Link to="/demande" className="font-semibold text-[#1D4ED8] hover:underline">
                        créer une demande
                      </Link>
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const { ok, total } = piecesScore(row.documentVerification)
                    return (
                      <tr key={row._id} className="transition hover:bg-[#F8FAFC]">
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-[#1D4ED8]">
                          …{row._id.slice(-8)}
                        </td>
                        <td className="px-4 py-3 text-[#334155]">{creditTypeLabel(row.creditType)}</td>
                        <td className="px-4 py-3 tabular-nums font-medium text-[#0F172A]">{formatTnd(row.amount)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${statusBadgeClass(row.status)}`}
                          >
                            {statusLabelFr(row.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#475569]">
                          <span className="tabular-nums font-semibold text-[#0F172A]">
                            {ok}/{total}
                          </span>{' '}
                          pièces contrôlées
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-[#64748B]">
                          {new Date(row.updatedAt).toLocaleString('fr-TN', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            to={`/dossiers/${row._id}`}
                            className="text-xs font-semibold text-[#1D4ED8] hover:underline"
                          >
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
        </div>
      )}
    </div>
  )
}
