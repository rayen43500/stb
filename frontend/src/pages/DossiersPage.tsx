import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { formatTnd } from '../lib/money'
import { statusBadgeClass, statusLabelFr } from '../lib/creditStatusStyle'
import { useAuth } from '../context/AuthContext'
import { roleLabelFr } from '../lib/roleLabels'
import type { Role } from '../types'

type CreditRow = {
  _id: string
  status: string
  amount: number
  durationMonths: number
  annualRatePercent: number
  updatedAt: string
  applicantId?: { email?: string; firstName?: string; lastName?: string }
}

const ALL_STATUSES = [
  'BROUILLON',
  'SOUMIS',
  'EN_ANALYSE',
  'EN_VALIDATION_CHEF',
  'EN_VALIDATION_COMITE',
  'APPROUVÉ',
  'REFUSÉ',
  'À_MODIFIER',
] as const

function roleDossiersIntro(role: Role): { title: string; lead: string } {
  switch (role) {
    case 'CLIENT':
      return {
        title: 'Mes dossiers crédit',
        lead: 'Suivez chaque étape : brouillon, soumission, analyse et décision. Ouvrez un dossier pour commentaires, pièces et tableau d’amortissement.',
      }
    case 'AGENT_BANCAIRE':
      return {
        title: 'File des dossiers — agent',
        lead: 'Passez les dossiers soumis en analyse, puis en validation chef ou retour client. Chaque action est tracée avec commentaire.',
      }
    case 'CHEF_AGENCE':
      return {
        title: 'Dossiers — validation agence',
        lead: 'Dossiers en attente de validation chef : orientez vers le comité, une décision ou une demande de modification.',
      }
    case 'COMITE_CREDIT':
      return {
        title: 'Dossiers — comité crédit',
        lead: 'Traitez les dossiers en validation comité : approbation, refus ou renvoi pour compléments.',
      }
    case 'ADMIN':
      return {
        title: 'Tous les dossiers',
        lead: 'Vue exhaustive pour supervision et support. Les transitions restent soumises aux règles métier selon le rôle utilisé.',
      }
    default:
      return { title: 'Dossiers crédit', lead: '' }
  }
}

export function DossiersPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState<CreditRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    api
      .get<CreditRow[]>('/credits/')
      .then((r) => setRows(r.data))
      .catch(() => setError('Impossible de charger les dossiers'))
  }, [])

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const s of ALL_STATUSES) c[s] = 0
    for (const r of rows) {
      c[r.status] = (c[r.status] || 0) + 1
    }
    return c
  }, [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false
      if (!q) return true
      const ref = row._id.slice(-8).toLowerCase()
      const applicant = row.applicantId
      const name =
        typeof applicant === 'object' && applicant
          ? `${applicant.firstName || ''} ${applicant.lastName || ''} ${applicant.email || ''}`.toLowerCase()
          : ''
      return ref.includes(q) || name.includes(q)
    })
  }, [rows, statusFilter, search])

  const intro = user ? roleDossiersIntro(user.role) : { title: 'Dossiers crédit', lead: '' }
  const isClient = user?.role === 'CLIENT'
  const showApplicant = Boolean(user && !isClient)

  return (
    <div className="stb-page space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            {user?.role ? roleLabelFr[user.role] : 'Chargement…'}
          </p>
          <h1 className="stb-h1 mt-1">{intro.title}</h1>
          <p className="stb-lead max-w-3xl">{intro.lead}</p>
        </div>
        {isClient && (
          <div className="flex flex-wrap gap-3">
            <Link to="/demande" className="stb-btn-primary px-4 py-2.5 text-sm">
              + Nouvelle demande
            </Link>
            <Link to="/simulation" className="stb-btn-secondary px-4 py-2.5 text-sm">
              Simulation
            </Link>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      {rows.length > 0 && (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === 'all'
                  ? 'bg-blue-700 text-white shadow-sm'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              Tous ({rows.length})
            </button>
            {ALL_STATUSES.map((s) =>
              (counts[s] || 0) > 0 ? (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    statusFilter === s
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {statusLabelFr(s)} ({counts[s]})
                </button>
              ) : null,
            )}
          </div>
          <label className="block w-full shrink-0 lg:w-72">
            <span className="sr-only">Rechercher</span>
            <input
              type="search"
              placeholder="Réf., nom ou e-mail…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="stb-input"
            />
          </label>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_20px_50px_-24px_rgba(15,23,42,0.2)]">
        <div className="overflow-x-auto">
          <table className="min-w-[800px] w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/95 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3.5">Référence</th>
                {showApplicant && <th className="px-4 py-3.5">Demandeur</th>}
                <th className="px-4 py-3.5">Montant</th>
                <th className="px-4 py-3.5">Durée</th>
                <th className="px-4 py-3.5">Taux</th>
                <th className="px-4 py-3.5">Statut</th>
                <th className="px-4 py-3.5">Mise à jour</th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((row) => (
                <tr key={row._id} className="transition hover:bg-blue-50/40">
                  <td className="px-4 py-3.5">
                    <Link
                      className="font-mono text-xs font-semibold text-blue-700 hover:text-blue-600 hover:underline"
                      to={`/dossiers/${row._id}`}
                    >
                      {row._id.slice(-8)}
                    </Link>
                  </td>
                  {showApplicant && (
                    <td className="max-w-[220px] truncate px-4 py-3.5 text-slate-700">
                      {typeof row.applicantId === 'object' && row.applicantId ? (
                        <>
                          <span className="font-medium text-slate-900">
                            {row.applicantId.firstName} {row.applicantId.lastName}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-slate-500">{row.applicantId.email}</span>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3.5 tabular-nums font-medium text-slate-900">{formatTnd(row.amount)}</td>
                  <td className="px-4 py-3.5 tabular-nums text-slate-600">{row.durationMonths} mois</td>
                  <td className="px-4 py-3.5 tabular-nums text-slate-600">{row.annualRatePercent}%</td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusBadgeClass(row.status)}`}
                    >
                      {statusLabelFr(row.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-500">
                    {new Date(row.updatedAt).toLocaleString('fr-TN', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link
                      to={`/dossiers/${row._id}`}
                      className="inline-flex rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600"
                    >
                      Ouvrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && !error && (
          <div className="px-6 py-14 text-center">
            <p className="text-slate-600">Aucun dossier pour le moment.</p>
            {isClient && (
              <Link to="/demande" className="stb-btn-primary mt-4 inline-flex">
                Créer mon premier dossier
              </Link>
            )}
          </div>
        )}
        {rows.length > 0 && filtered.length === 0 && (
          <p className="p-8 text-center text-sm text-slate-500">Aucun dossier ne correspond aux filtres.</p>
        )}
      </div>
    </div>
  )
}
