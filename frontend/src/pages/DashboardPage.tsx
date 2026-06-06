import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { roleLabelFr, roleMission } from '../lib/roleLabels'
import { roleTransitionHints } from '../lib/roleWorkflowHints'
import type { Role } from '../types'
import { formatTnd } from '../lib/money'
import { statusLabelFr } from '../lib/creditStatusStyle'
import { creditTypeLabel } from '../lib/creditTypeLabels'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

type WorkspacePayload = {
  role: Role
  kpis: Record<string, number>
  statusMap: Record<string, number>
  byRisk: Record<string, number>
  byCreditType: Record<string, number>
  acceptanceRate: number | null
  recent: Array<{
    _id: string
    status: string
    amount: number
    creditType?: string
    updatedAt: string
    scoring?: { score?: number; category?: string }
    applicantId?: { firstName?: string; lastName?: string; email?: string }
  }>
}

type NotifRow = {
  _id: string
  title: string
  message: string
  read?: boolean
  link?: string
  createdAt?: string
}

const staffRoles: Role[] = ['AGENT_BANCAIRE', 'CHEF_AGENCE', 'ADMIN']

function workflowHints(role: Role): string[] {
  const hints: Partial<Record<Role, string[]>> = {
    CLIENT: [
      'Créez un brouillon, ajoutez vos pièces puis soumettez pour lancer l\'analyse.',
      'Consultez l\'analyse de risque et l\'historique des commentaires sur chaque dossier.',
      'Complétez votre profil financier dans Paramètres pour des simulations plus précises.',
    ],
    AGENT_BANCAIRE: [
      'Traitez la file des dossiers : statuts, transitions et commentaires obligatoires.',
      'Utilisez la simulation pour répondre aux clients et l\'assistant pour le FAQ métier.',
    ],
    CHEF_AGENCE: [
      'Validez les dossiers en « validation chef » avant envoi pour décision.',
      'Supervisez l\'activité de l\'agence via la liste centralisée des dossiers.',
    ],
    ADMIN: [
      "Supervisez l'activité globale et la répartition des dossiers.",
      'Consultez les indicateurs de gestion et les comptes internes.',
    ],
  }
  return hints[role] ?? []
}

export function DashboardPage() {
  const { user } = useAuth()
  const [workspace, setWorkspace] = useState<WorkspacePayload | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [notifs, setNotifs] = useState<NotifRow[]>([])
  const [notifsErr, setNotifsErr] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !staffRoles.includes(user.role)) return
    api
      .get<WorkspacePayload>('/stats/workspace')
      .then((r) => {
        setWorkspace(r.data)
        setErr(null)
      })
      .catch(() => setErr('Statistiques métier non disponibles'))
  }, [user])

  useEffect(() => {
    if (!user || !staffRoles.includes(user.role)) return
    api
      .get<NotifRow[]>('/notifications')
      .then((r) => setNotifs(r.data.slice(0, 8)))
      .catch(() => setNotifsErr('Notifications non disponibles'))
  }, [user])

  const chartData =
    workspace &&
    {
      labels: Object.keys(workspace.statusMap).map((s) => statusLabelFr(s)),
      datasets: [
        {
          label: 'Dossiers par statut',
          data: Object.values(workspace.statusMap),
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
        },
      ],
    }

  const riskChart =
    workspace &&
    Object.keys(workspace.byRisk).length > 0 && {
      labels: Object.keys(workspace.byRisk),
      datasets: [
        {
          data: Object.values(workspace.byRisk),
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
          borderWidth: 0,
        },
      ],
    }

  const typeChart =
    workspace &&
    Object.keys(workspace.byCreditType).length > 0 && {
      labels: Object.keys(workspace.byCreditType).map((k) => creditTypeLabel(k)),
      datasets: [
        {
          data: Object.values(workspace.byCreditType),
          backgroundColor: ['#1d4ed8', '#06b6d4', '#8b5cf6', '#64748b'],
          borderWidth: 0,
        },
      ],
    }

  if (!user) {
    return (
      <div className="stb-page text-slate-600">
        <Link to="/login" className="stb-link">
          Connectez-vous
        </Link>{' '}
        pour accéder à votre espace.
      </div>
    )
  }

  return (
    <div className="stb-page stb-stack-page">
      <section className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">{roleLabelFr[user.role]}</p>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-[#0F172A] sm:text-2xl">
              Bienvenue{user.firstName ? `, ${user.firstName}` : ''}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#64748B]">{roleMission[user.role]}</p>
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {workflowHints(user.role).map((line) => (
                <li key={line} className="flex gap-2 text-sm text-[#475569]">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#1D4ED8]" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              to="/compte"
              className="inline-flex items-center justify-center rounded-[10px] border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-medium text-[#0F172A] shadow-sm transition hover:bg-[#F8FAFC]"
            >
              Paramètres
            </Link>
            {user.role === 'CLIENT' && (
              <>
                <Link
                  to="/demande"
                  className="inline-flex items-center justify-center rounded-[10px] bg-[#1D4ED8] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1E40AF]"
                >
                  Nouvelle demande
                </Link>
                <Link
                  to="/dossiers"
                  className="inline-flex items-center justify-center rounded-[10px] border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-[#0F172A] hover:bg-[#F8FAFC]"
                >
                  Mes dossiers
                </Link>
              </>
            )}
            {user.role !== 'CLIENT' && (
              <Link
                to="/dossiers"
                className="inline-flex items-center justify-center rounded-[10px] bg-[#1D4ED8] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1E40AF]"
              >
                Ouvrir les dossiers
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-6 shadow-sm">
        <h2 className="stb-section-title text-slate-600">Votre rôle — actions dans le workflow</h2>
        <ul className="mt-4 space-y-2.5 text-sm text-slate-700">
          {roleTransitionHints(user.role).map((line) => (
            <li key={line} className="flex gap-2">
              <span className="font-mono text-blue-600" aria-hidden>
                →
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      <div>
        <h2 className="stb-section-title">Accès rapides</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            to="/simulation"
            className="stb-card-muted transition hover:border-[#1D4ED8]/35 hover:bg-[#F8FAFC]"
          >
            <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">Simulation</div>
            <div className="mt-2 font-medium text-slate-900">Mensualité & endettement</div>
            <p className="mt-1 text-sm text-slate-600">Calcul en TND avec profil client si renseigné.</p>
          </Link>
          <Link
            to="/assistant"
            className="stb-card-muted transition hover:border-cyan-400/40 hover:shadow-lg hover:shadow-cyan-200/40"
          >
            <div className="text-xs font-semibold uppercase tracking-wide text-cyan-800">Assistant</div>
            <div className="mt-2 font-medium text-slate-900">FAQ & aide métier</div>
            <p className="mt-1 text-sm text-slate-600">Questions fréquentes et simulation guidée.</p>
          </Link>
          {user.role === 'CLIENT' && (
            <>
              <Link
                to="/demande"
                className="stb-card-muted transition hover:border-[#10B981]/40 hover:bg-[#F8FAFC]"
              >
                <div className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Demande</div>
                <div className="mt-2 font-medium text-slate-900">Nouveau dossier crédit</div>
                <p className="mt-1 text-sm text-slate-600">Brouillon puis soumission avec pièces jointes.</p>
              </Link>
              <Link
                to="/dossiers"
                className="stb-card-muted transition hover:border-[#F59E0B]/45 hover:bg-[#FFFBEB]"
              >
                <div className="text-xs font-semibold uppercase tracking-wide text-amber-800">Mes dossiers</div>
                <div className="mt-2 font-medium text-slate-900">Suivi & PDF</div>
                <p className="mt-1 text-sm text-slate-600">Statuts, commentaires et amortissement.</p>
              </Link>
            </>
          )}
          {user.role !== 'CLIENT' && (
            <Link
              to="/dossiers"
              className="stb-card-muted transition hover:border-[#1D4ED8]/35 hover:bg-[#F8FAFC]"
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">Dossiers</div>
              <div className="mt-2 font-medium text-slate-900">
                
              </div>
              <p className="mt-1 text-sm text-slate-600">Liste selon vos droits et transitions autorisées.</p>
            </Link>
          )}
          
          <Link
            to="/compte"
            className="stb-card-muted transition hover:border-[#94A3B8]/50 hover:bg-[#F8FAFC]"
          >
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">Profil</div>
            <div className="mt-2 font-medium text-slate-900">Adresse, téléphone, photo</div>
            <p className="mt-1 text-sm text-slate-600">Mettez à jour vos informations personnelles.</p>
          </Link>
        </div>
      </div>

      {staffRoles.includes(user.role) && (
        <section className="stb-card space-y-8">
          <div>
            <h2 className="stb-h2">Tableau de bord — {roleLabelFr[user.role]}</h2>
            <p className="mt-1 text-sm text-slate-600">
              Indicateurs métier, derniers dossiers et répartitions (niveau de risque, type de crédit).
            </p>
            {err && <p className="mt-2 text-sm text-amber-600">{err}</p>}
          </div>

          {workspace && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Object.entries(workspace.kpis).map(([key, val]) => {
                  const label =
                    {
                      dossiersRecus: 'Dossiers reçus',
                      dossiersEnAttente: 'En attente de traitement',
                      dossiersEnvoyesScoring: 'En analyse risque',
                      enAttente: 'En attente',
                      enAttenteAgent: 'En attente',
                      enAttenteTraitement: 'En attente traitement',
                      envoyesScoring: 'En analyse risque',
                      retournesClient: 'Retours client',
                      attenteValidationChef: 'Attente validation chef',
                      attenteDecisionFinale: 'Attente décision comité',
                      attenteComite: 'Attente comité',
                      dossiersApprouves: 'Approuvés',
                      dossiersRefuses: 'Refusés',
                      montantTotalAccorde: 'Montant total accordé',
                    }[key] || key
                  const isMoney = key.toLowerCase().includes('montant')
                  return (
                    <div key={key} className="stb-kpi-card">
                      <div className="stb-kpi-label">{label}</div>
                      <div className="stb-kpi-value">{isMoney ? formatTnd(Number(val)) : val}</div>
                    </div>
                  )
                })}
              </div>

              <div className="stb-panel border-slate-200/90 bg-slate-50/60 p-5">
                <h3 className="stb-section-title text-slate-700">Notifications</h3>
                {notifsErr && <p className="mt-2 text-xs text-amber-700">{notifsErr}</p>}
                {!notifsErr && notifs.length === 0 && (
                  <p className="mt-2 text-sm text-slate-600">
                    Aucune notification pour le moment. Les alertes liées au traitement des dossiers apparaîtront ici.
                  </p>
                )}
                {notifs.length > 0 && (
                  <ul className="mt-3 divide-y divide-slate-200">
                    {notifs.map((n) => (
                      <li key={n._id} className="py-2.5 first:pt-0">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="font-medium text-slate-900">{n.title}</span>
                          {n.createdAt && (
                            <span className="text-xs text-slate-500">
                              {new Date(n.createdAt).toLocaleString('fr-TN', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{n.message}</p>
                        {n.link && (
                          <Link
                            to={n.link.startsWith('/') ? n.link : `/${n.link}`}
                            className="mt-1 inline-block text-xs font-semibold text-blue-700 hover:underline"
                          >
                            Ouvrir
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {workspace.acceptanceRate != null && (
                <p className="stb-caption text-slate-600 sm:text-sm">
                  Taux d&apos;acceptation (sur dossiers décidés) :{' '}
                  <strong className="text-slate-900">{workspace.acceptanceRate} %</strong>
                </p>
              )}

              <div className="grid gap-10 lg:grid-cols-2">
                {chartData && (
                  <div className="max-h-72">
                    <h3 className="mb-4 stb-section-title text-slate-700">Dossiers par statut</h3>
                    <Bar
                      data={chartData}
                      options={{
                        responsive: true,
                        plugins: { legend: { display: false } },
                        scales: {
                          x: { ticks: { color: '#64748b' }, grid: { color: '#e2e8f0' } },
                          y: { ticks: { color: '#64748b' }, grid: { color: '#e2e8f0' } },
                        },
                      }}
                    />
                  </div>
                )}
                {riskChart && (
                  <div className="max-h-72">
                    <h3 className="mb-4 stb-section-title text-slate-700">Répartition des niveaux de risque</h3>
                    <Doughnut
                      data={riskChart}
                      options={{
                        responsive: true,
                        plugins: { legend: { position: 'bottom', labels: { color: '#475569' } } },
                      }}
                    />
                  </div>
                )}
              </div>

              {typeChart && (
                <div className="max-h-64">
                  <h3 className="mb-4 stb-section-title text-slate-700">Crédits par type</h3>
                  <Doughnut
                    data={typeChart}
                    options={{
                      responsive: true,
                      plugins: { legend: { position: 'bottom', labels: { color: '#475569' } } },
                    }}
                  />
                </div>
              )}

              <div>
                <h3 className="stb-section-title text-slate-700">Derniers dossiers</h3>
                <div className="stb-table-shell mt-4">
                  <table className="min-w-full text-left text-sm">
                    <thead className="stb-table-head">
                      <tr>
                        <th className="px-3 py-2">Client</th>
                        <th className="px-3 py-2">Montant</th>
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2">Indicateur</th>
                        <th className="px-3 py-2">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {workspace.recent.map((r) => (
                        <tr key={r._id} className="hover:bg-slate-50">
                          <td className="px-3 py-2">
                            <Link className="font-medium text-blue-700 hover:underline" to={`/dossiers/${r._id}`}>
                              {typeof r.applicantId === 'object' && r.applicantId
                                ? `${r.applicantId.firstName || ''} ${r.applicantId.lastName || ''}`.trim() ||
                                  r.applicantId.email
                                : '—'}
                            </Link>
                          </td>
                          <td className="px-3 py-2 tabular-nums">{formatTnd(r.amount)}</td>
                          <td className="px-3 py-2">{creditTypeLabel(r.creditType)}</td>
                          <td className="px-3 py-2 tabular-nums">
                            {r.scoring?.score != null ? `${r.scoring.score}/100` : '—'}
                          </td>
                          <td className="px-3 py-2">
                            <span className="text-xs font-medium text-slate-700">{statusLabelFr(r.status)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  )
}
