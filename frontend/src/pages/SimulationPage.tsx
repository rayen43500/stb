import { useState } from 'react'
import { api } from '../lib/api'
import { formatTnd } from '../lib/money'

type SimResult = {
  monthlyPayment: number
  totalCostInterest: number
  totalRepaid: number
  debtRatioPercent: number | null
  simulationRiskLabel: string
  recommendations: string[]
}

function riskFr(label: string) {
  if (label === 'ACCEPTABLE') return 'Acceptable'
  if (label === 'MODERE') return 'Modéré'
  if (label === 'ELEVE') return 'Élevé'
  return label
}

function riskBadge(label: string) {
  const fr = riskFr(label)
  const cls =
    label === 'ACCEPTABLE'
      ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
      : label === 'MODERE'
        ? 'bg-amber-50 text-amber-800 ring-amber-200'
        : 'bg-red-50 text-red-800 ring-red-200'
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${cls}`}>{fr}</span>
  )
}

export function SimulationPage() {
  const [amount, setAmount] = useState(25000)
  const [durationMonths, setDurationMonths] = useState(48)
  const [annualRatePercent, setAnnualRatePercent] = useState(5.5)
  const [monthlyIncome, setMonthlyIncome] = useState(3500)
  const [monthlyCharges, setMonthlyCharges] = useState(900)
  const [sim, setSim] = useState<SimResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function run() {
    setError(null)
    setLoading(true)
    try {
      const { data } = await api.post<SimResult>('/credits/simulate', {
        amount,
        durationMonths,
        annualRatePercent,
        monthlyIncome,
        monthlyCharges,
      })
      setSim(data)
    } catch {
      setError('Impossible de calculer — vérifiez que l’API est démarrée.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="stb-page stb-stack-tight">
      <div className="max-w-2xl">
        <h1 className="stb-h1">Simulation de crédit</h1>
        <p className="stb-lead">
          Calcul de la mensualité, du coût des intérêts et du taux d&apos;endettement après prêt (indicateur utilisé en
          banque).
        </p>
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <section className="stb-card">
          <h2 className="stb-h2">Paramètres</h2>
          <p className="mt-1 text-sm text-slate-600">Tous les champs sont pris en compte pour l&apos;endettement.</p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="stb-label">Montant (TND)</span>
              <input
                type="number"
                className="stb-input"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </label>
            <label className="block">
              <span className="stb-label">Durée (mois)</span>
              <input
                type="number"
                className="stb-input"
                value={durationMonths}
                onChange={(e) => setDurationMonths(Number(e.target.value))}
              />
            </label>
            <label className="block">
              <span className="stb-label">Taux annuel (%)</span>
              <input
                type="number"
                step="0.01"
                className="stb-input"
                value={annualRatePercent}
                onChange={(e) => setAnnualRatePercent(Number(e.target.value))}
              />
            </label>
            <label className="block">
              <span className="stb-label">Revenus mensuels nets (TND)</span>
              <input
                type="number"
                className="stb-input"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(Number(e.target.value))}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="stb-label">Charges mensuelles (TND)</span>
              <input
                type="number"
                className="stb-input"
                value={monthlyCharges}
                onChange={(e) => setMonthlyCharges(Number(e.target.value))}
              />
            </label>
          </div>
          <button type="button" onClick={run} disabled={loading} className="stb-btn-primary mt-8 w-full sm:w-auto">
            {loading ? 'Calcul en cours…' : 'Calculer'}
          </button>
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </section>

        <section className="stb-card border-blue-200 bg-gradient-to-b from-white to-slate-50">
          <h2 className="stb-h2">Résultats</h2>
          {!sim && (
            <p className="mt-6 text-sm leading-relaxed text-slate-600">
              Cliquez sur « Calculer » pour afficher la mensualité, les intérêts totaux et une première grille de risque
              liée à l&apos;endettement.
            </p>
          )}
          {sim && (
            <dl className="mt-6 space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <dt className="text-slate-500">Mensualité</dt>
                <dd className="text-lg font-semibold tabular-nums text-slate-900">{formatTnd(sim.monthlyPayment)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Intérêts totaux</dt>
                <dd className="tabular-nums text-slate-700">{formatTnd(sim.totalCostInterest)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Total remboursé</dt>
                <dd className="tabular-nums text-slate-700">{formatTnd(sim.totalRepaid)}</dd>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <dt className="text-slate-500">Endettement après prêt</dt>
                <dd className="tabular-nums text-slate-700">
                  {sim.debtRatioPercent != null ? `${sim.debtRatioPercent} %` : 'N/A'}
                </dd>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <dt className="text-slate-500">Risque (simulation)</dt>
                <dd>{riskBadge(sim.simulationRiskLabel)}</dd>
              </div>
              {sim.recommendations.length > 0 && (
                <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Recommandations</div>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">
                    {sim.recommendations.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </dl>
          )}
        </section>
      </div>
    </div>
  )
}
