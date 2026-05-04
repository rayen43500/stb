import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

type CreditRow = {
  _id: string
  status: string
  amount: number
  updatedAt: string
  applicantId?: { email?: string; firstName?: string; lastName?: string }
}

export function DossiersPage() {
  const [rows, setRows] = useState<CreditRow[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<CreditRow[]>('/credits/')
      .then((r) => setRows(r.data))
      .catch(() => setError('Impossible de charger les dossiers'))
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Dossiers crédit</h1>
      <p className="text-slate-400">Liste selon vos droits (client : ses dossiers ; agence : tous).</p>
      {error && <p className="mt-4 text-red-400">{error}</p>}
      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-700">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-900/80 text-slate-400">
            <tr>
              <th className="px-4 py-3">Réf.</th>
              <th className="px-4 py-3">Demandeur</th>
              <th className="px-4 py-3">Montant</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Maj</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row._id} className="border-t border-slate-800 hover:bg-slate-800/40">
                <td className="px-4 py-3 font-mono text-xs">
                  <Link className="text-blue-400 hover:underline" to={`/dossiers/${row._id}`}>
                    {row._id.slice(-8)}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {typeof row.applicantId === 'object' && row.applicantId
                    ? `${row.applicantId.firstName || ''} ${row.applicantId.lastName || ''} (${row.applicantId.email})`
                    : '—'}
                </td>
                <td className="px-4 py-3">{row.amount} €</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs">{row.status}</span>
                </td>
                <td className="px-4 py-3 text-slate-500">{new Date(row.updatedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && !error && (
          <p className="p-6 text-center text-slate-500">Aucun dossier pour le moment.</p>
        )}
      </div>
    </div>
  )
}
