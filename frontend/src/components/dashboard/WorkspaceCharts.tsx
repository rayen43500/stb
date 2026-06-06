import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Tooltip } from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { creditTypeLabel } from '../../lib/creditTypeLabels'
import { statusLabelFr } from '../../lib/creditStatusStyle'
import { formatTnd } from '../../lib/money'
import type { Role } from '../../types'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, LineElement, PointElement, Tooltip, Legend)

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#64748b', maxRotation: 45 } },
    y: { beginAtZero: true, ticks: { precision: 0, color: '#64748b' }, grid: { color: '#e2e8f0' } },
  },
}

const lineOptions = {
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

const RISK_COLORS: Record<string, string> = {
  FAIBLE: '#10B981',
  MOYEN: '#F59E0B',
  ELEVE: '#EF4444',
  ÉLEVÉ: '#EF4444',
}

const TYPE_COLORS = ['#1D4ED8', '#06B6D4', '#8B5CF6', '#F59E0B', '#64748B']

function ChartCard({
  title,
  subtitle,
  children,
  className = '',
}: {
  title: string
  subtitle: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm ${className}`}>
      <h2 className="text-base font-semibold text-[#0F172A]">{title}</h2>
      <p className="mt-1 text-xs text-[#64748B]">{subtitle}</p>
      <div className="mt-5 h-64">{children}</div>
    </div>
  )
}

function filterPositive(entries: [string, number][]) {
  return entries.filter(([, value]) => value > 0)
}

function formatMonthLabel(key: string) {
  const [y, m] = key.split('-')
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
  return `${months[Number(m) - 1] || m} ${y?.slice(2) || ''}`
}

export type ChartBundle = {
  statusMap?: Record<string, number>
  byCreditType?: Record<string, number>
  byRisk?: Record<string, number>
  byMonth?: Record<string, number>
  amountByMonth?: Record<string, number>
  scoreDistribution?: Record<string, number>
  acceptanceRate?: number | null
}

export function PortfolioCharts({ statusMap, byCreditType }: { statusMap: Record<string, number>; byCreditType: Record<string, number> }) {
  const statuses = filterPositive(Object.entries(statusMap))
  const types = filterPositive(Object.entries(byCreditType))

  return (
    <section className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
      <ChartCard title="Répartition des dossiers" subtitle="Nombre de dossiers par étape du workflow.">
        <Bar
          data={{
            labels: statuses.map(([status]) => statusLabelFr(status)),
            datasets: [{ data: statuses.map(([, value]) => value), backgroundColor: '#2563EB', borderRadius: 7, maxBarThickness: 48 }],
          }}
          options={barOptions}
        />
      </ChartCard>
      <ChartCard title="Types de crédit" subtitle="Composition du portefeuille.">
        <Doughnut
          data={{
            labels: types.map(([type]) => creditTypeLabel(type)),
            datasets: [{ data: types.map(([, value]) => value), backgroundColor: TYPE_COLORS, borderColor: '#FFFFFF', borderWidth: 3 }],
          }}
          options={doughnutOptions}
        />
      </ChartCard>
    </section>
  )
}

export function RiskCharts({ byRisk }: { byRisk: Record<string, number> }) {
  const risks = filterPositive(Object.entries(byRisk))
  if (risks.length === 0) return null

  return (
    <ChartCard title="Niveaux de risque" subtitle="Répartition des dossiers scorés par catégorie IA.">
      <Doughnut
        data={{
          labels: risks.map(([k]) => k),
          datasets: [{
            data: risks.map(([, v]) => v),
            backgroundColor: risks.map(([k]) => RISK_COLORS[k] || '#94A3B8'),
            borderColor: '#FFFFFF',
            borderWidth: 3,
          }],
        }}
        options={doughnutOptions}
      />
    </ChartCard>
  )
}

export function ScoreDistributionChart({ scoreDistribution }: { scoreDistribution: Record<string, number> }) {
  const rows = filterPositive(Object.entries(scoreDistribution))
  if (rows.length === 0) return null

  return (
    <ChartCard title="Distribution des scores" subtitle="Tranches de score IA sur les dossiers analysés.">
      <Bar
        data={{
          labels: rows.map(([k]) => k),
          datasets: [{ data: rows.map(([, v]) => v), backgroundColor: ['#EF4444', '#F59E0B', '#10B981'], borderRadius: 7, maxBarThickness: 48 }],
        }}
        options={barOptions}
      />
    </ChartCard>
  )
}

export function MonthlyActivityChart({ byMonth }: { byMonth: Record<string, number> }) {
  const rows = Object.entries(byMonth)
  if (rows.every(([, v]) => v === 0)) return null

  return (
    <ChartCard title="Activité mensuelle" subtitle="Dossiers mis à jour sur les 6 derniers mois.">
      <Line
        data={{
          labels: rows.map(([k]) => formatMonthLabel(k)),
          datasets: [{
            data: rows.map(([, v]) => v),
            borderColor: '#1D4ED8',
            backgroundColor: 'rgba(29, 78, 216, 0.12)',
            fill: true,
            tension: 0.35,
            pointRadius: 4,
          }],
        }}
        options={lineOptions}
      />
    </ChartCard>
  )
}

export function ApprovedAmountChart({ amountByMonth }: { amountByMonth: Record<string, number> }) {
  const rows = Object.entries(amountByMonth)
  if (rows.every(([, v]) => v === 0)) return null

  return (
    <ChartCard title="Montants approuvés" subtitle="Volume des crédits approuvés par mois (TND).">
      <Bar
        data={{
          labels: rows.map(([k]) => formatMonthLabel(k)),
          datasets: [{
            data: rows.map(([, v]) => v),
            backgroundColor: '#10B981',
            borderRadius: 7,
            maxBarThickness: 40,
          }],
        }}
        options={{
          ...barOptions,
          scales: {
            ...barOptions.scales,
            y: {
              ...barOptions.scales.y,
              ticks: {
                ...barOptions.scales.y.ticks,
                callback: (v: string | number) => `${Math.round(Number(v) / 1000)}k`,
              },
            },
          },
        }}
      />
    </ChartCard>
  )
}

export function AcceptanceRateCard({ rate }: { rate: number | null }) {
  if (rate == null) return null
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-sm">
      <p className="text-xs font-medium text-emerald-800">Taux d&apos;acceptation</p>
      <p className="mt-3 text-4xl font-bold tabular-nums text-emerald-700">{rate} %</p>
      <p className="mt-2 text-xs text-emerald-700/80">Dossiers approuvés / décisions rendues</p>
    </div>
  )
}

export function ClientDashboardCharts({ data }: { data: ChartBundle }) {
  return (
    <div className="space-y-5">
      <PortfolioCharts statusMap={data.statusMap || {}} byCreditType={data.byCreditType || {}} />
      <section className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <RiskCharts byRisk={data.byRisk || {}} />
        <ScoreDistributionChart scoreDistribution={data.scoreDistribution || {}} />
        <AcceptanceRateCard rate={data.acceptanceRate ?? null} />
      </section>
      <section className="grid gap-5 lg:grid-cols-2">
        <MonthlyActivityChart byMonth={data.byMonth || {}} />
        <ApprovedAmountChart amountByMonth={data.amountByMonth || {}} />
      </section>
    </div>
  )
}

export function StaffDashboardCharts({ data, role }: { data: ChartBundle; role?: Role }) {
  const statusSource = data.statusMap || {}
  const titleSuffix =
    role === 'AGENT_BANCAIRE' ? ' — file analyse' : role === 'CHEF_AGENCE' ? ' — validation' : ''

  return (
    <div className="space-y-5">
      <PortfolioCharts statusMap={statusSource} byCreditType={data.byCreditType || {}} />
      <section className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
        <RiskCharts byRisk={data.byRisk || {}} />
        <ScoreDistributionChart scoreDistribution={data.scoreDistribution || {}} />
        <MonthlyActivityChart byMonth={data.byMonth || {}} />
        <ApprovedAmountChart amountByMonth={data.amountByMonth || {}} />
      </section>
      {data.acceptanceRate != null && (
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <AcceptanceRateCard rate={data.acceptanceRate} />
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm sm:col-span-1 lg:col-span-3">
            <p className="text-xs font-medium text-[#64748B]">Synthèse{titleSuffix}</p>
            <p className="mt-2 text-sm text-[#334155]">
              {Object.values(statusSource).reduce((a, b) => a + b, 0)} dossiers suivis ·{' '}
              {formatTnd(Object.values(data.amountByMonth || {}).reduce((a, b) => a + b, 0))} approuvés sur 6 mois
            </p>
          </div>
        </section>
      )}
    </div>
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
