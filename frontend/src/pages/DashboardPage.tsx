import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { roleLabelFr, roleMission } from '../lib/roleLabels'
import { roleTransitionHints } from '../lib/roleWorkflowHints'
import type { Role } from '../types'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

type Stats = {
  totalCredits: number
  totalUsers: number
  byStatus: Record<string, number>
  acceptanceRate: number | null
}

const staffRoles: Role[] = ['ADMIN', 'AGENT_BANCAIRE', 'CHEF_AGENCE', 'COMITE_CREDIT']

function heroForRole(role: Role) {
  const map: Record<Role, { bar: string; chip: string }> = {
    CLIENT: {
      bar: 'from-[#1e3a8a] via-[#1d4ed8] to-[#2563eb]',
      chip: 'bg-white/15 text-white ring-white/25',
    },
    AGENT_BANCAIRE: {
      bar: 'from-slate-800 via-cyan-900 to-slate-800',
      chip: 'bg-cyan-400/20 text-cyan-50 ring-cyan-300/30',
    },
    CHEF_AGENCE: {
      bar: 'from-indigo-950 via-indigo-800 to-indigo-950',
      chip: 'bg-indigo-300/15 text-indigo-50 ring-indigo-200/25',
    },
    COMITE_CREDIT: {
      bar: 'from-violet-950 via-violet-800 to-violet-950',
      chip: 'bg-violet-300/15 text-violet-50 ring-violet-200/25',
    },
    ADMIN: {
      bar: 'from-amber-900 via-amber-800 to-amber-950',
      chip: 'bg-amber-300/15 text-amber-50 ring-amber-200/25',
    },
  }
  return map[role]
}

function RoleHints({ role }: { role: Role }) {
  const hints: Record<Role, string[]> = {
    CLIENT: [
      'Créez un brouillon, ajoutez vos pièces puis soumettez pour lancer l’analyse.',
      'Consultez le scoring et l’historique des commentaires sur chaque dossier.',
      'Complétez votre profil financier dans Compte & profil pour des simulations plus précises.',
    ],
    AGENT_BANCAIRE: [
      'Traitez la file des dossiers : statuts, transitions et commentaires obligatoires.',
      'Utilisez la simulation pour répondre aux clients et l’assistant pour le FAQ métier.',
    ],
    CHEF_AGENCE: [
      'Validez les dossiers en « validation chef » avant l’envoi au comité.',
      'Supervisez l’activité de l’agence via la liste centralisée des dossiers.',
    ],
    COMITE_CREDIT: [
      'Examinez les dossiers en « validation comité » et enregistrez vos décisions tracées.',
      'Les statistiques globales aident à suivre le volume et les décisions.',
    ],
    ADMIN: [
      'Gérez les rôles utilisateurs, consultez l’audit et l’ensemble des dossiers.',
      'Surveillez les indicateurs agrégés (dossiers, taux d’acceptation).',
    ],
  }
  return (
    <ul className="mt-4 space-y-2 text-sm text-white/90">
      {hints[role].map((line) => (
        <li key={line} className="flex gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/70" aria-hidden />
          <span>{line}</span>
        </li>
      ))}
    </ul>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !staffRoles.includes(user.role)) return
    api
      .get<Stats>('/stats/dashboard')
      .then((r) => setStats(r.data))
      .catch(() => setErr('Statistiques non disponibles'))
  }, [user])

  const chartData =
    stats &&
    {
      labels: Object.keys(stats.byStatus),
      datasets: [
        {
          label: 'Dossiers par statut',
          data: Object.values(stats.byStatus),
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
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

  const hero = heroForRole(user.role)

  return (
    <div className="stb-page space-y-10">
      <section
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br p-8 text-white shadow-[0_24px_70px_-24px_rgba(30,58,138,0.45)] ${hero.bar}`}
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${hero.chip}`}>
            {roleLabelFr[user.role]}
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
            Bienvenue{user.firstName ? `, ${user.firstName}` : ''}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/85">{roleMission[user.role]}</p>
          <RoleHints role={user.role} />
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/compte"
              className="inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-blue-900 shadow-sm transition hover:bg-blue-50"
            >
              Compte & profil
            </Link>
            {user.role === 'CLIENT' && (
              <>
                <Link
                  to="/demande"
                  className="inline-flex rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 transition hover:bg-white/15"
                >
                  Nouvelle demande
                </Link>
                <Link
                  to="/dossiers"
                  className="inline-flex rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 transition hover:bg-white/15"
                >
                  Mes dossiers
                </Link>
              </>
            )}
            {user.role !== 'CLIENT' && (
              <Link
                to="/dossiers"
                className="inline-flex rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 transition hover:bg-white/15"
              >
                Ouvrir les dossiers
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="stb-card border-slate-200/90 bg-gradient-to-br from-slate-50 to-white">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
          Votre rôle — actions dans le workflow
        </h2>
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
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Accès rapides</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            to="/simulation"
            className="stb-card-muted transition hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-200/50"
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
            <div className="mt-2 font-medium text-slate-900">FAQ & scoring conversationnel</div>
            <p className="mt-1 text-sm text-slate-600">Questions métier et simulation guidée.</p>
          </Link>
          {user.role === 'CLIENT' && (
            <>
              <Link
                to="/demande"
                className="stb-card-muted transition hover:border-emerald-400/45 hover:shadow-lg hover:shadow-emerald-200/40"
              >
                <div className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Demande</div>
                <div className="mt-2 font-medium text-slate-900">Nouveau dossier crédit</div>
                <p className="mt-1 text-sm text-slate-600">Brouillon puis soumission avec pièces jointes.</p>
              </Link>
              <Link
                to="/dossiers"
                className="stb-card-muted transition hover:border-amber-400/45 hover:shadow-lg hover:shadow-amber-200/40"
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
              className="stb-card-muted transition hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-200/50"
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">Dossiers</div>
              <div className="mt-2 font-medium text-slate-900">
                {user.role === 'ADMIN' ? 'Vue globale' : 'File de traitement'}
              </div>
              <p className="mt-1 text-sm text-slate-600">Liste selon vos droits et transitions autorisées.</p>
            </Link>
          )}
          {user.role === 'ADMIN' && (
            <Link
              to="/admin"
              className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 transition hover:border-amber-300 hover:shadow-md"
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-amber-800">Administration</div>
              <div className="mt-2 font-medium text-amber-950">Utilisateurs & rôles</div>
              <p className="mt-1 text-sm text-amber-900/80">Gestion des comptes et audit.</p>
            </Link>
          )}
          <Link
            to="/compte"
            className="stb-card-muted transition hover:border-slate-400/60 hover:shadow-md"
          >
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">Profil</div>
            <div className="mt-2 font-medium text-slate-900">Adresse, téléphone, photo</div>
            <p className="mt-1 text-sm text-slate-600">Mettez à jour vos informations personnelles.</p>
          </Link>
        </div>
      </div>

      {staffRoles.includes(user.role) && (
        <section className="stb-card">
          <h2 className="text-lg font-medium text-slate-900">Indicateurs — vue {roleLabelFr[user.role]}</h2>
          <p className="mt-1 text-sm text-slate-600">Synthèse des dossiers et utilisateurs (données agrégées).</p>
          {err && <p className="mt-2 text-sm text-amber-600">{err}</p>}
          {stats && (
            <>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="text-xs text-slate-500">Dossiers</div>
                  <div className="text-2xl font-semibold tabular-nums text-slate-900">{stats.totalCredits}</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="text-xs text-slate-500">Utilisateurs</div>
                  <div className="text-2xl font-semibold tabular-nums text-slate-900">{stats.totalUsers}</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="text-xs text-slate-500">Taux acceptation (décisions)</div>
                  <div className="text-2xl font-semibold tabular-nums text-slate-900">
                    {stats.acceptanceRate != null ? `${stats.acceptanceRate} %` : '—'}
                  </div>
                </div>
              </div>
              {chartData && (
                <div className="mt-8 max-h-80">
                  <Bar
                    data={chartData}
                    options={{
                      responsive: true,
                      plugins: { legend: { labels: { color: '#475569' } } },
                      scales: {
                        x: { ticks: { color: '#64748b' }, grid: { color: '#e2e8f0' } },
                        y: { ticks: { color: '#64748b' }, grid: { color: '#e2e8f0' } },
                      },
                    }}
                  />
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  )
}
