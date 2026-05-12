import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Bell,
  CheckCircle2,
  ClipboardList,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Loader2,
  TrendingUp,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { roleLabelFr, roleMission } from '../lib/roleLabels'
import {
  CLIENT_WORKFLOW_STEPS,
  aggregateClientKpis,
  pickFocusCredit,
  workflowStageFromStatus,
  type CreditLite,
} from '../lib/homeDashboard'
import { formatTnd } from '../lib/money'
import { statusBadgeClass, statusLabelFr } from '../lib/creditStatusStyle'
import { creditTypeLabel } from '../lib/creditTypeLabels'
import type { Role } from '../types'
import type { SafeUser } from '../types'

const PAGE_SIZE = 6

type NotifRow = {
  _id: string
  title: string
  message: string
  createdAt?: string
}

type WorkspacePayload = {
  role: Role
  kpis: Record<string, number>
  recent: Array<{
    _id: string
    status: string
    amount: number
    creditType?: string
    updatedAt: string
    applicantId?: { firstName?: string; lastName?: string }
  }>
}

const shellCard =
  'rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm transition duration-150 hover:shadow-md sm:p-5'
const btnPrimary =
  'inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-[#1D4ED8] px-4 text-sm font-semibold text-white shadow-sm transition duration-150 hover:bg-[#1E40AF]'
const btnSecondary =
  'inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-[#E2E8F0] bg-white px-4 text-sm font-medium text-[#0F172A] transition duration-150 hover:bg-[#F8FAFC]'

function KpiTile({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: typeof FolderOpen
  label: string
  value: string | number
  hint?: string
  tone?: 'default' | 'amber' | 'emerald'
}) {
  const ring =
    tone === 'amber'
      ? 'text-amber-600 bg-amber-50 ring-amber-100'
      : tone === 'emerald'
        ? 'text-emerald-600 bg-emerald-50 ring-emerald-100'
        : 'text-[#1D4ED8] bg-blue-50 ring-blue-100'
  return (
    <div className={shellCard}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[#64748B]">{label}</p>
          <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-[#0F172A]">{value}</p>
          {hint ? <p className="mt-1 text-xs text-[#64748B]">{hint}</p> : null}
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ring-1 ${ring}`}>
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      </div>
    </div>
  )
}

/** Visiteurs — entrée produit compacte, sans hero marketing. */
function PublicHome() {
  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Portail STB</p>
            <h1 className="mt-1 text-[1.75rem] font-bold leading-tight tracking-tight text-[#0F172A]">
              Crédit — simulation et suivi de dossiers
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#64748B]">
              Accès professionnels et clients : même plateforme, workflow et décisions tracées.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link to="/register" className={btnPrimary}>
                Créer un compte
              </Link>
              <Link to="/simulation" className={btnSecondary}>
                Simulation
              </Link>
              <Link to="/login" className={`${btnSecondary} text-[#1D4ED8]`}>
                Connexion
              </Link>
            </div>
          </div>
          <div className="grid w-full max-w-md gap-2 sm:grid-cols-3 lg:max-w-lg">
            <Link
              to="/simulation"
              className="rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-3 text-center text-sm font-medium text-[#0F172A] transition hover:bg-white"
            >
              1 · Simuler
            </Link>
            <Link
              to="/register"
              className="rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-3 text-center text-sm font-medium text-[#0F172A] transition hover:bg-white"
            >
              2 · Compte
            </Link>
            <Link
              to="/login"
              className="rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-3 text-center text-sm font-medium text-[#0F172A] transition hover:bg-white"
            >
              3 · Suivi
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <div className={shellCard}>
          <FileText className="h-5 w-5 text-[#1D4ED8]" aria-hidden />
          <h2 className="mt-3 text-sm font-semibold text-[#0F172A]">Grille & analyse</h2>
          <p className="mt-1 text-sm text-[#64748B]">Indicateurs et étapes visibles sur chaque dossier.</p>
        </div>
        <div className={shellCard}>
          <ClipboardList className="h-5 w-5 text-[#1D4ED8]" aria-hidden />
          <h2 className="mt-3 text-sm font-semibold text-[#0F172A]">Workflow tracé</h2>
          <p className="mt-1 text-sm text-[#64748B]">Commentaires et statuts à chaque transition.</p>
        </div>
        <div className={shellCard}>
          <Bell className="h-5 w-5 text-[#1D4ED8]" aria-hidden />
          <h2 className="mt-3 text-sm font-semibold text-[#0F172A]">Notifications</h2>
          <p className="mt-1 text-sm text-[#64748B]">Alertes sur les mises à jour de vos demandes.</p>
        </div>
      </div>
    </div>
  )
}

/** Tableau de bord client — données réelles, workflow, activité, tableau. */
function ClientHome({ user }: { user: SafeUser }) {
  const [credits, setCredits] = useState<CreditLite[]>([])
  const [notifs, setNotifs] = useState<NotifRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    setLoading(true)
    Promise.all([api.get<CreditLite[]>('/credits/'), api.get<NotifRow[]>('/notifications')])
      .then(([cr, nt]) => {
        setCredits(cr.data)
        setNotifs(nt.data.slice(0, 12))
        setLoadErr(null)
      })
      .catch(() => setLoadErr('Données temporairement indisponibles'))
      .finally(() => setLoading(false))
  }, [])

  const kpis = useMemo(() => aggregateClientKpis(credits), [credits])
  const focus = useMemo(() => pickFocusCredit(credits), [credits])
  const stage = focus ? workflowStageFromStatus(focus.status) : credits.length === 0 ? 1 : 2

  const feed = useMemo(() => {
    const rows: { id: string; t: number; title: string; sub: string }[] = []
    for (const n of notifs) {
      rows.push({
        id: n._id,
        t: n.createdAt ? new Date(n.createdAt).getTime() : 0,
        title: n.title,
        sub: n.message,
      })
    }
    for (const c of credits.slice(0, 8)) {
      rows.push({
        id: `c-${c._id}`,
        t: new Date(c.updatedAt).getTime(),
        title: `Dossier …${c._id.slice(-8)}`,
        sub: statusLabelFr(c.status),
      })
    }
    rows.sort((a, b) => b.t - a.t)
    const seen = new Set<string>()
    const out: typeof rows = []
    for (const r of rows) {
      if (seen.has(r.title + r.sub)) continue
      seen.add(r.title + r.sub)
      out.push(r)
      if (out.length >= 10) break
    }
    return out
  }, [notifs, credits])

  const sortedCredits = useMemo(
    () => [...credits].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [credits],
  )
  const totalPages = Math.max(1, Math.ceil(sortedCredits.length / PAGE_SIZE))
  const pageSafe = Math.min(page, totalPages)
  const slice = sortedCredits.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE)

  return (
    <div className="flex flex-col gap-6">
      {/* En-tête compact */}
      <section className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-[#0F172A] sm:text-2xl">
              Bonjour{user.firstName ? `, ${user.firstName}` : ''}
            </h1>
            <p className="mt-1 text-sm text-[#64748B]">
              Voici un aperçu de vos dossiers et de l’activité récente. Poursuivez votre parcours depuis les accès
              rapides.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/demande" className={btnPrimary}>
              Nouvelle demande
            </Link>
            <Link to="/simulation" className={btnSecondary}>
              Simuler un crédit
            </Link>
            <Link to="/dossiers" className={btnSecondary}>
              Voir dossiers
            </Link>
          </div>
        </div>
      </section>

      {loadErr && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">{loadErr}</p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-8 text-sm text-[#64748B] shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-[#1D4ED8]" aria-hidden />
          Chargement du tableau de bord…
        </div>
      ) : (
        <>
          {/* KPI */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiTile
              icon={FolderOpen}
              label="Dossiers en cours"
              value={kpis.enCircuit}
              hint={
                kpis.cetteSemaine > 0
                  ? `${kpis.cetteSemaine} mise${kpis.cetteSemaine > 1 ? 's' : ''} à jour cette semaine`
                  : 'Aucune mise à jour cette semaine'
              }
            />
            <KpiTile icon={CheckCircle2} label="Crédits accordés" value={kpis.approuves} tone="emerald" />
            <KpiTile
              icon={AlertCircle}
              label="Actions requises"
              value={kpis.actionsRequises}
              hint={kpis.actionsRequises ? 'Compléments demandés par l’agence' : 'Aucune action en attente'}
              tone="amber"
            />
            <KpiTile icon={LayoutDashboard} label="Total dossiers" value={kpis.total} hint={`${kpis.brouillons} brouillon(s)`} />
          </section>

          {/* Workflow */}
          <section className={shellCard}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-[#0F172A]">Progression du parcours crédit</h2>
              {focus ? (
                <span className="text-xs text-[#64748B]">
                  Dossier ref. <span className="font-mono font-medium text-[#0F172A]">{focus._id.slice(-8)}</span>
                </span>
              ) : null}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {CLIENT_WORKFLOW_STEPS.map((s, i) => {
                const done = stage > s.step
                const current = stage === s.step
                return (
                  <div key={s.key} className="flex items-center gap-2">
                    <div
                      className={[
                        'flex items-center gap-2 rounded-[10px] border px-3 py-2 text-xs font-medium transition duration-150',
                        current
                          ? 'border-[#1D4ED8] bg-[#EFF6FF] text-[#1D4ED8]'
                          : done
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]',
                      ].join(' ')}
                    >
                      <span className="tabular-nums font-semibold">{s.step}</span>
                      <span>{s.label}</span>
                    </div>
                    {i < CLIENT_WORKFLOW_STEPS.length - 1 && (
                      <ArrowRight className="hidden h-4 w-4 text-[#CBD5E1] sm:block" aria-hidden />
                    )}
                  </div>
                )
              })}
            </div>
            <p className="mt-3 text-xs text-[#64748B]">
              Étape indicative basée sur votre dossier le plus récent. Détail et pièces :{' '}
              <Link to="/dossiers" className="font-medium text-[#1D4ED8] hover:underline">
                Mes dossiers
              </Link>
              .
            </p>
          </section>

          <div className="grid gap-6 lg:grid-cols-5">
            {/* Activité */}
            <section className={`lg:col-span-2 ${shellCard}`}>
              <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
                <TrendingUp className="h-4 w-4 text-[#64748B]" aria-hidden />
                <h2 className="text-sm font-semibold text-[#0F172A]">Activité récente</h2>
              </div>
              <ul className="divide-y divide-[#F1F5F9]">
                {feed.length === 0 ? (
                  <li className="py-6 text-center text-sm text-[#64748B]">Aucune activité récente.</li>
                ) : (
                  feed.map((row) => (
                    <li key={row.id} className="flex gap-3 py-3">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1D4ED8]" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[#0F172A]">{row.title}</p>
                        <p className="line-clamp-2 text-xs text-[#64748B]">{row.sub}</p>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </section>

            {/* Notifications / actions */}
            <section className={`lg:col-span-3 ${shellCard}`}>
              <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
                <Bell className="h-4 w-4 text-[#64748B]" aria-hidden />
                <h2 className="text-sm font-semibold text-[#0F172A]">À traiter</h2>
              </div>
              {kpis.actionsRequises > 0 ? (
                <div className="mt-4 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                  <strong>{kpis.actionsRequises}</strong> dossier(s) nécessitent un complément de votre part.
                  <Link to="/dossiers" className="mt-2 block font-semibold text-[#1D4ED8] hover:underline">
                    Compléter les dossiers →
                  </Link>
                </div>
              ) : (
                <p className="mt-4 text-sm text-[#64748B]">Aucune action obligatoire pour le moment.</p>
              )}
              {notifs.length === 0 && kpis.actionsRequises === 0 ? (
                <p className="mt-2 text-xs text-[#94A3B8]">
                  Les notifications de l’agence apparaîtront ici et dans l’icône du bandeau supérieur.
                </p>
              ) : null}
            </section>
          </div>

          {/* Tableau dossiers */}
          <section className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] px-4 py-3 sm:px-5">
              <h2 className="text-sm font-semibold text-[#0F172A]">Vos dossiers</h2>
              <Link to="/dossiers" className="text-xs font-semibold text-[#1D4ED8] hover:underline">
                Vue complète
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[720px] w-full text-left text-sm">
                <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                  <tr>
                    <th className="px-4 py-3">Référence</th>
                    <th className="px-4 py-3">Type crédit</th>
                    <th className="px-4 py-3">Montant</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {slice.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-[#64748B]">
                        Aucun dossier —{' '}
                        <Link to="/demande" className="font-medium text-[#1D4ED8] hover:underline">
                          créer une demande
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    slice.map((row) => (
                      <tr key={row._id} className="transition duration-150 hover:bg-[#F8FAFC]">
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-[#1D4ED8]">
                          <Link to={`/dossiers/${row._id}`} className="hover:underline">
                            {row._id.slice(-8)}
                          </Link>
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
                            Ouvrir
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {sortedCredits.length > PAGE_SIZE ? (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0] px-4 py-3 text-xs text-[#64748B]">
                <span>
                  Page {pageSafe} / {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={pageSafe <= 1}
                    className="rounded-[10px] border border-[#E2E8F0] px-3 py-1.5 font-medium text-[#0F172A] transition disabled:opacity-40 hover:bg-[#F8FAFC]"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Précédent
                  </button>
                  <button
                    type="button"
                    disabled={pageSafe >= totalPages}
                    className="rounded-[10px] border border-[#E2E8F0] px-3 py-1.5 font-medium text-[#0F172A] transition disabled:opacity-40 hover:bg-[#F8FAFC]"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Suivant
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        </>
      )}
    </div>
  )
}

/** Accueil staff — synthèse métier alignée sur /stats/workspace. */
function StaffHome({ user }: { user: SafeUser }) {
  const [ws, setWs] = useState<WorkspacePayload | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<WorkspacePayload>('/stats/workspace')
      .then((r) => {
        setWs(r.data)
        setErr(null)
      })
      .catch(() => setErr('Indicateurs non disponibles'))
      .finally(() => setLoading(false))
  }, [])

  const steps = [
    { n: 1, label: 'Réception', desc: 'Dossiers entrants' },
    { n: 2, label: 'Analyse risque', desc: 'Grille & scoring' },
    { n: 3, label: 'Validation', desc: 'Chef / comité' },
    { n: 4, label: 'Décision', desc: 'Accord ou refus' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">{roleLabelFr[user.role]}</p>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-[#0F172A] sm:text-2xl">Vue d’ensemble opérationnelle</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#64748B]">{roleMission[user.role]}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link to="/dashboard" className={btnPrimary}>
            <LayoutDashboard className="h-4 w-4" />
            Tableau de bord détaillé
          </Link>
          <Link to="/dossiers" className={btnSecondary}>
            Dossiers
          </Link>
          {user.role === 'ADMIN' && (
            <Link
              to="/admin"
              className="inline-flex h-10 items-center justify-center rounded-[10px] border border-amber-200 bg-amber-50 px-4 text-sm font-medium text-amber-950 hover:bg-amber-100"
            >
              Administration
            </Link>
          )}
        </div>
      </section>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-[#64748B]">
          <Loader2 className="h-5 w-5 animate-spin text-[#1D4ED8]" aria-hidden />
          Chargement des indicateurs…
        </div>
      ) : err ? (
        <p className="text-sm text-amber-800">{err}</p>
      ) : ws ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(ws.kpis).map(([key, val]) => (
              <div key={key} className={shellCard}>
                <p className="text-xs font-medium uppercase tracking-wide text-[#64748B]">{formatKpiLabel(key)}</p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-[#0F172A]">
                  {key.toLowerCase().includes('montant') ? formatTnd(Number(val)) : val}
                </p>
              </div>
            ))}
          </section>

          <section className={shellCard}>
            <h2 className="text-sm font-semibold text-[#0F172A]">Traitement des dossiers</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {steps.map((s) => (
                <div
                  key={s.n}
                  className="min-w-[140px] flex-1 rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-center"
                >
                  <div className="text-xs font-bold text-[#1D4ED8]">{s.n}</div>
                  <div className="text-sm font-semibold text-[#0F172A]">{s.label}</div>
                  <div className="text-[11px] text-[#64748B]">{s.desc}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
            <div className="border-b border-[#E2E8F0] px-4 py-3 sm:px-5">
              <h2 className="text-sm font-semibold text-[#0F172A]">Derniers dossiers</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[640px] w-full text-left text-sm">
                <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs font-semibold uppercase text-[#64748B]">
                  <tr>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Montant</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {ws.recent.slice(0, 8).map((r) => (
                    <tr key={r._id} className="hover:bg-[#F8FAFC]">
                      <td className="px-4 py-3 font-medium text-[#0F172A]">
                        {typeof r.applicantId === 'object' && r.applicantId
                          ? `${r.applicantId.firstName || ''} ${r.applicantId.lastName || ''}`.trim() || '—'
                          : '—'}
                      </td>
                      <td className="px-4 py-3 tabular-nums">{formatTnd(r.amount)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${statusBadgeClass(r.status)}`}
                        >
                          {statusLabelFr(r.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link to={`/dossiers/${r._id}`} className="text-xs font-semibold text-[#1D4ED8] hover:underline">
                          Ouvrir
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}

function formatKpiLabel(key: string): string {
  const map: Record<string, string> = {
    dossiersRecus: 'Dossiers reçus',
    dossiersEnAttente: 'En attente traitement',
    dossiersEnvoyesScoring: 'En analyse risque',
    retournesClient: 'Retours client',
    attenteValidationChef: 'Attente validation chef',
    attenteDecisionFinale: 'Attente décision comité',
    dossiersApprouves: 'Approuvés',
    dossiersRefuses: 'Refusés',
    montantTotalAccorde: 'Montant accordé',
    enAttente: 'En attente',
    envoyesScoring: 'En analyse risque',
    attenteComite: 'Attente comité',
  }
  return map[key] || key
}

export function HomePage() {
  const { user, token } = useAuth()

  if (token && user?.role === 'CLIENT') {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <ClientHome user={user} />
      </div>
    )
  }

  if (token && user) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <StaffHome user={user} />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PublicHome />
    </div>
  )
}
