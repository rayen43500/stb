import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { creditTypeLabel } from '../../lib/creditTypeLabels'
import { statusLabelFr } from '../../lib/creditStatusStyle'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#64748b' } },
    y: { beginAtZero: true, ticks: { precision: 0, color: '#64748b' }, grid: { color: '#e2e8f0' } },
  },
}

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '68%',
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: { color: '#475569', boxWidth: 10, boxHeight: 10, padding: 16 },
    },
  },
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-[#0F172A]">{title}</h2>
      <p className="mt-1 text-xs text-[#64748B]">{subtitle}</p>
      <div className="mt-5 h-64">{children}</div>
    </div>
  )
}

export function PortfolioCharts({
  statusMap,
  byCreditType,
}: {
  statusMap: Record<string, number>
  byCreditType: Record<string, number>
}) {
  const statuses = Object.entries(statusMap).filter(([, value]) => value > 0)
  const types = Object.entries(byCreditType).filter(([, value]) => value > 0)

  return (
    <section className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
      <ChartCard title="Répartition des dossiers" subtitle="Nombre de dossiers présents dans chaque étape.">
        <Bar
          data={{
            labels: statuses.map(([status]) => statusLabelFr(status)),
            datasets: [{ data: statuses.map(([, value]) => value), backgroundColor: '#2563EB', borderRadius: 7, maxBarThickness: 48 }],
          }}
          options={barOptions}
        />
      </ChartCard>
      <ChartCard title="Types de crédit" subtitle="Composition du portefeuille traité.">
        <Doughnut
          data={{
            labels: types.map(([type]) => creditTypeLabel(type)),
            datasets: [{ data: types.map(([, value]) => value), backgroundColor: ['#1D4ED8', '#06B6D4', '#8B5CF6', '#F59E0B', '#64748B'], borderColor: '#FFFFFF', borderWidth: 3 }],
          }}
          options={doughnutOptions}
        />
      </ChartCard>
    </section>
  )
}

type AgentPerformance = {
  id: string
  firstName?: string
  lastName?: string
  dossiersTraitesMois: number
}

export function ManagementCharts({
  agents,
  report,
}: {
  agents: AgentPerformance[]
  report: { totalDossiers: number; approuves: number; refuses: number }
}) {
  const undecided = Math.max(0, report.totalDossiers - report.approuves - report.refuses)

  return (
    <section className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
      <ChartCard title="Activité mensuelle des agents" subtitle="Actions de traitement enregistrées durant le mois.">
        <Bar
          data={{
            labels: agents.map((agent) => `${agent.firstName || ''} ${agent.lastName || ''}`.trim() || 'Agent'),
            datasets: [{ data: agents.map((agent) => agent.dossiersTraitesMois), backgroundColor: '#0F766E', borderRadius: 7, maxBarThickness: 48 }],
          }}
          options={barOptions}
        />
      </ChartCard>
      <ChartCard title="Décisions du mois" subtitle="Situation des dossiers mis à jour ce mois-ci.">
        <Doughnut
          data={{
            labels: ['Approuvés', 'Refusés', 'En cours'],
            datasets: [{ data: [report.approuves, report.refuses, undecided], backgroundColor: ['#10B981', '#EF4444', '#CBD5E1'], borderColor: '#FFFFFF', borderWidth: 3 }],
          }}
          options={doughnutOptions}
        />
      </ChartCard>
    </section>
  )
}
