import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { api } from '../lib/api'
import { formatTnd } from '../lib/money'
import { statusBadgeClass, statusLabelFr } from '../lib/creditStatusStyle'
import { useAuth } from '../context/AuthContext'
import { roleLabelFr } from '../lib/roleLabels'
import { creditTypeLabel } from '../lib/creditTypeLabels'
import type { Role } from '../types'

type CreditRow = {
  _id: string
  status: string
  amount: number
  durationMonths: number
  annualRatePercent: number
  creditType?: string
  updatedAt: string
  scoring?: { score?: number; category?: string }
  applicantId?: { email?: string; firstName?: string; lastName?: string }
  comments?: Array<{ role: string; text: string }>
}

function dernierAvisChef(comments?: CreditRow['comments']): string {
  if (!comments?.length) return '—'
  const chefs = comments.filter((c) => c.role === 'CHEF_AGENCE')
  const last = chefs[chefs.length - 1]
  const t = last?.text?.trim()
  if (!t) return '—'
  return t.length > 80 ? `${t.slice(0, 77)}…` : t
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

type SortKey = 'ref' | 'amount' | 'creditType' | 'status' | 'updatedAt'

function TableSortIcon({
  column,
  activeKey,
  dir,
}: {
  column: SortKey
  activeKey: SortKey
  dir: 'asc' | 'desc'
}) {
  if (activeKey !== column) return <ArrowUpDown className="inline h-3.5 w-3.5 opacity-40" aria-hidden />
  return dir === 'asc' ? (
    <ArrowUp className="inline h-3.5 w-3.5 text-blue-700" aria-hidden />
  ) : (
    <ArrowDown className="inline h-3.5 w-3.5 text-blue-700" aria-hidden />
  )
}

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
  const [creditTypeFilter, setCreditTypeFilter] = useState<string>('all')
  const [riskFilter, setRiskFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [montantMin, setMontantMin] = useState('')
  const [montantMax, setMontantMax] = useState('')
  const [scoreMin, setScoreMin] = useState('')
  const [scoreMax, setScoreMax] = useState('')
  const [highAmountOnly, setHighAmountOnly] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

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
    const minAmt = montantMin.trim() !== '' ? Number(montantMin) : null
    const maxAmt = montantMax.trim() !== '' ? Number(montantMax) : null
    const minScore = scoreMin.trim() !== '' ? Number(scoreMin) : null
    const maxScore = scoreMax.trim() !== '' ? Number(scoreMax) : null
    let start: Date | null = null
    let end: Date | null = null
    if (dateFrom) {
      start = new Date(dateFrom)
      start.setHours(0, 0, 0, 0)
    }
    if (dateTo) {
      end = new Date(dateTo)
      end.setHours(23, 59, 59, 999)
    }

    return rows.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false
      if (creditTypeFilter !== 'all' && row.creditType !== creditTypeFilter) return false
      if (riskFilter !== 'all' && (row.scoring?.category || '') !== riskFilter) return false
      if (highAmountOnly && row.amount < 50_000) return false
      if (minAmt != null && !Number.isNaN(minAmt) && row.amount < minAmt) return false
      if (maxAmt != null && !Number.isNaN(maxAmt) && row.amount > maxAmt) return false
      const sc = row.scoring?.score
      if (minScore != null && !Number.isNaN(minScore) && (sc == null || sc < minScore)) return false
      if (maxScore != null && !Number.isNaN(maxScore) && (sc == null || sc > maxScore)) return false
      const upd = new Date(row.updatedAt)
      if (start && upd < start) return false
      if (end && upd > end) return false
      if (!q) return true
      const ref = row._id.slice(-8).toLowerCase()
      const fullRef = row._id.toLowerCase()
      const applicant = row.applicantId
      const name =
        typeof applicant === 'object' && applicant
          ? `${applicant.firstName || ''} ${applicant.lastName || ''} ${applicant.email || ''}`.toLowerCase()
          : ''
      return ref.includes(q) || fullRef.includes(q) || name.includes(q)
    })
  }, [
    rows,
    statusFilter,
    creditTypeFilter,
    riskFilter,
    search,
    dateFrom,
    dateTo,
    montantMin,
    montantMax,
    scoreMin,
    scoreMax,
    highAmountOnly,
  ])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'updatedAt' || key === 'amount' ? 'desc' : 'asc')
    }
  }

  const sortedFiltered = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'ref':
          cmp = a._id.localeCompare(b._id)
          break
        case 'amount':
          cmp = a.amount - b.amount
          break
        case 'creditType':
          cmp = (a.creditType || '').localeCompare(b.creditType || '')
          break
        case 'status':
          cmp = a.status.localeCompare(b.status)
          break
        case 'updatedAt':
          cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          break
        default:
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [filtered, sortKey, sortDir])

  const intro = user ? roleDossiersIntro(user.role) : { title: 'Dossiers crédit', lead: '' }
  const isClient = user?.role === 'CLIENT'
  const showApplicant = Boolean(user && !isClient)
  /** Colonnes score / risque : tout le personnel banque (pas le client). */
  const showRiskScoreCols = Boolean(user && !isClient)
  /** Tableau simplifié pour l’agent (cahier des charges). */
  const agentCompactCols = user?.role === 'AGENT_BANCAIRE'
  const showChefAvisCol = user?.role === 'COMITE_CREDIT'

  return (
    <div className="stb-page stb-stack-tight">
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

      {rows.length > 0 && !isClient && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-3">
            <select
              className="stb-input max-w-xs"
              value={creditTypeFilter}
              onChange={(e) => setCreditTypeFilter(e.target.value)}
            >
              <option value="all">Tous les types de crédit</option>
              <option value="CONSO">Consommation</option>
              <option value="IMMOBILIER">Immobilier</option>
              <option value="VEHICULE">Véhicule</option>
              <option value="AUTRE">Autre</option>
            </select>
            {showRiskScoreCols && (
              <select
                className="stb-input max-w-xs"
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
              >
                <option value="all">Tous les risques</option>
                <option value="FAIBLE">Risque faible</option>
                <option value="MOYEN">Risque moyen</option>
                <option value="ELEVE">Risque élevé</option>
              </select>
            )}
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-xs font-medium text-slate-600">
              Du
              <input
                type="date"
                className="stb-input mt-1 block w-[11rem]"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </label>
            <label className="text-xs font-medium text-slate-600">
              Au
              <input
                type="date"
                className="stb-input mt-1 block w-[11rem]"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </label>
            <label className="text-xs font-medium text-slate-600">
              Montant min (TND)
              <input
                type="number"
                min={0}
                className="stb-input mt-1 block w-[8rem] tabular-nums"
                value={montantMin}
                onChange={(e) => setMontantMin(e.target.value)}
                placeholder="0"
              />
            </label>
            <label className="text-xs font-medium text-slate-600">
              Montant max (TND)
              <input
                type="number"
                min={0}
                className="stb-input mt-1 block w-[8rem] tabular-nums"
                value={montantMax}
                onChange={(e) => setMontantMax(e.target.value)}
                placeholder="∞"
              />
            </label>
            {showRiskScoreCols && (
              <>
                <label className="text-xs font-medium text-slate-600">
                  Score min
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="stb-input mt-1 block w-[5.5rem] tabular-nums"
                    value={scoreMin}
                    onChange={(e) => setScoreMin(e.target.value)}
                  />
                </label>
                <label className="text-xs font-medium text-slate-600">
                  Score max
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="stb-input mt-1 block w-[5.5rem] tabular-nums"
                    value={scoreMax}
                    onChange={(e) => setScoreMax(e.target.value)}
                  />
                </label>
              </>
            )}
            {user?.role === 'COMITE_CREDIT' && (
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={highAmountOnly}
                  onChange={(e) => setHighAmountOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-700"
                />
                Montants élevés (≥ 50&nbsp;000 TND)
              </label>
            )}
          </div>
        </div>
      )}

      <div className="stb-table-shell">
        <div className="overflow-x-auto">
          <table
            className={`w-full text-left text-sm ${agentCompactCols ? 'min-w-[720px]' : 'min-w-[920px]'}`}
          >
            <thead className="stb-table-head">
              <tr>
                <th className="px-4 py-3.5">
                  <button
                    type="button"
                    onClick={() => toggleSort('ref')}
                    className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-blue-700"
                  >
                    Référence <TableSortIcon column="ref" activeKey={sortKey} dir={sortDir} />
                  </button>
                </th>
                {showApplicant && (
                  <th className="px-4 py-3.5">{agentCompactCols ? 'Client' : 'Demandeur'}</th>
                )}
                {agentCompactCols ? (
                  <>
                    <th className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => toggleSort('creditType')}
                        className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-blue-700"
                      >
                        Crédit <TableSortIcon column="creditType" activeKey={sortKey} dir={sortDir} />
                      </button>
                    </th>
                    <th className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => toggleSort('amount')}
                        className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-blue-700"
                      >
                        Montant <TableSortIcon column="amount" activeKey={sortKey} dir={sortDir} />
                      </button>
                    </th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => toggleSort('amount')}
                        className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-blue-700"
                      >
                        Montant <TableSortIcon column="amount" activeKey={sortKey} dir={sortDir} />
                      </button>
                    </th>
                    <th className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => toggleSort('creditType')}
                        className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-blue-700"
                      >
                        Crédit <TableSortIcon column="creditType" activeKey={sortKey} dir={sortDir} />
                      </button>
                    </th>
                    <th className="px-4 py-3.5">Durée</th>
                    <th className="px-4 py-3.5">Taux</th>
                    {showRiskScoreCols && <th className="px-4 py-3.5">Indicateur</th>}
                    {showRiskScoreCols && <th className="px-4 py-3.5">Risque</th>}
                  </>
                )}
                {showChefAvisCol && <th className="max-w-[200px] px-4 py-3.5">Avis chef</th>}
                <th className="px-4 py-3.5">
                  <button
                    type="button"
                    onClick={() => toggleSort('status')}
                    className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-blue-700"
                  >
                    Statut <TableSortIcon column="status" activeKey={sortKey} dir={sortDir} />
                  </button>
                </th>
                <th className="px-4 py-3.5">
                  <button
                    type="button"
                    onClick={() => toggleSort('updatedAt')}
                    className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-blue-700"
                  >
                    Dernière mise à jour <TableSortIcon column="updatedAt" activeKey={sortKey} dir={sortDir} />
                  </button>
                </th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedFiltered.map((row) => (
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
                  {agentCompactCols ? (
                    <>
                      <td className="px-4 py-3.5 text-slate-700">{creditTypeLabel(row.creditType)}</td>
                      <td className="px-4 py-3.5 tabular-nums font-medium text-slate-900">{formatTnd(row.amount)}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3.5 tabular-nums font-medium text-slate-900">{formatTnd(row.amount)}</td>
                      <td className="px-4 py-3.5 text-slate-700">{creditTypeLabel(row.creditType)}</td>
                      <td className="px-4 py-3.5 tabular-nums text-slate-600">{row.durationMonths} mois</td>
                      <td className="px-4 py-3.5 tabular-nums text-slate-600">{row.annualRatePercent}%</td>
                    </>
                  )}
                  {showRiskScoreCols && !agentCompactCols && (
                    <td className="px-4 py-3.5 tabular-nums text-slate-800">
                      {row.scoring?.score != null ? `${row.scoring.score}/100` : '—'}
                    </td>
                  )}
                  {showRiskScoreCols && !agentCompactCols && (
                    <td className="px-4 py-3.5 text-slate-700">{row.scoring?.category || '—'}</td>
                  )}
                  {showChefAvisCol && (
                    <td className="max-w-[220px] px-4 py-3.5 text-xs text-slate-700">
                      {dernierAvisChef(row.comments)}
                    </td>
                  )}
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
