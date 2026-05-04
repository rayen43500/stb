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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

type Stats = {
  totalCredits: number
  totalUsers: number
  byStatus: Record<string, number>
  acceptanceRate: number | null
}

const staffRoles = ['ADMIN', 'AGENT_BANCAIRE', 'CHEF_AGENCE', 'COMITE_CREDIT']

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

  return (
    <div className="stb-page space-y-10">
      <div>
        <h1 className="stb-h1">Tableau de bord</h1>
        <p className="stb-lead">
          Bienvenue{user?.firstName ? `, ${user.firstName}` : ''}. Rôle :{' '}
          <span className="font-medium text-slate-200">{user?.role}</span>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link
          to="/simulation"
          className="stb-card-muted transition hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-900/20"
        >
          <div className="text-sm text-slate-400">Simulation</div>
          <div className="mt-1 font-medium text-white">Calculer une mensualité</div>
        </Link>
        {user?.role === 'CLIENT' && (
          <>
            <Link
              to="/demande"
              className="stb-card-muted transition hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-900/20"
            >
              <div className="text-sm text-slate-400">Demande</div>
              <div className="mt-1 font-medium text-white">Nouvelle demande de crédit</div>
            </Link>
            <Link
              to="/dossiers"
              className="rounded-xl border border-slate-700 bg-slate-900/50 p-5 transition hover:border-blue-500/50"
            >
              <div className="text-sm text-slate-400">Suivi</div>
              <div className="mt-1 font-medium text-white">Voir mes dossiers</div>
            </Link>
          </>
        )}
        {user && staffRoles.includes(user.role) && (
          <Link
            to="/dossiers"
            className="rounded-xl border border-slate-700 bg-slate-900/50 p-5 transition hover:border-blue-500/50"
          >
            <div className="text-sm text-slate-400">Traitement</div>
            <div className="mt-1 font-medium text-white">File des dossiers</div>
          </Link>
        )}
        {user?.role === 'ADMIN' && (
          <Link
            to="/admin"
            className="rounded-xl border border-amber-900/50 bg-amber-950/30 p-5 transition hover:border-amber-600/50"
          >
            <div className="text-sm text-amber-200/80">Administration</div>
            <div className="mt-1 font-medium text-amber-100">Utilisateurs & audit</div>
          </Link>
        )}
      </div>

      {staffRoles.includes(user?.role || '') && (
        <section className="rounded-2xl border border-slate-700 bg-slate-900/40 p-6">
          <h2 className="text-lg font-medium text-white">Indicateurs</h2>
          {err && <p className="mt-2 text-sm text-amber-400">{err}</p>}
          {stats && (
            <>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-slate-950/60 p-4">
                  <div className="text-xs text-slate-500">Dossiers</div>
                  <div className="text-2xl font-semibold text-white">{stats.totalCredits}</div>
                </div>
                <div className="rounded-lg bg-slate-950/60 p-4">
                  <div className="text-xs text-slate-500">Utilisateurs</div>
                  <div className="text-2xl font-semibold text-white">{stats.totalUsers}</div>
                </div>
                <div className="rounded-lg bg-slate-950/60 p-4">
                  <div className="text-xs text-slate-500">Taux acceptation (décisions)</div>
                  <div className="text-2xl font-semibold text-white">
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
                      plugins: { legend: { labels: { color: '#94a3b8' } } },
                      scales: {
                        x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
                        y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
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