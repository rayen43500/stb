import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Banknote,
  Calculator,
  Car,
  Home,
  Info,
  RefreshCw,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { api } from '../lib/api'
import { formatTnd } from '../lib/money'

type CreditType = 'IMMOBILIER' | 'VEHICULE' | 'CONSO'

type SimResult = {
  monthlyPayment: number
  totalCostInterest: number
  totalRepaid: number
  debtRatioPercent?: number | null
  simulationRiskLabel?: string
  recommendations?: string[]
}

const TABS: {
  id: CreditType
  label: string
  shortLabel: string
  Icon: typeof Home
  defaultRate: number
  hint: string
}[] = [
  {
    id: 'IMMOBILIER',
    label: 'Crédit immobilier',
    shortLabel: 'Immobilier',
    Icon: Home,
    defaultRate: 6.5,
    hint: 'Achat, construction ou aménagement',
  },
  {
    id: 'VEHICULE',
    label: 'Crédit automobile',
    shortLabel: 'Auto',
    Icon: Car,
    defaultRate: 8.0,
    hint: 'Véhicule neuf ou d\'occasion',
  },
  {
    id: 'CONSO',
    label: 'Crédit consommation',
    shortLabel: 'Consommation',
    Icon: Banknote,
    defaultRate: 9.5,
    hint: 'Projets personnels et équipements',
  },
]

function riskStyle(label?: string) {
  switch (label) {
    case 'ACCEPTABLE':
      return { badge: 'bg-emerald-50 text-emerald-800 ring-emerald-200', text: 'Acceptable' }
    case 'MODERE':
      return { badge: 'bg-amber-50 text-amber-800 ring-amber-200', text: 'Modéré' }
    case 'ELEVE':
      return { badge: 'bg-red-50 text-red-800 ring-red-200', text: 'Élevé' }
    default:
      return { badge: 'bg-slate-100 text-slate-600 ring-slate-200', text: 'À compléter' }
  }
}

export function SimulationPage() {
  const [activeTab, setActiveTab] = useState<CreditType>('IMMOBILIER')
  const [amount, setAmount] = useState(100000)
  const [revenuBrut, setRevenuBrut] = useState(0)
  const [autresFinancements, setAutresFinancements] = useState(0)
  const [apportPropre, setApportPropre] = useState(20000)
  const [durationMonths, setDurationMonths] = useState(180)
  const [sim, setSim] = useState<SimResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const tabMeta = TABS.find((t) => t.id === activeTab)!
  const annualRatePercent = tabMeta.defaultRate
  const needsApport = activeTab !== 'CONSO'
  const durationYears = Math.round(durationMonths / 12)
  const montantFinance = needsApport ? Math.max(0, amount - apportPropre) : amount
  const minApport = amount * 0.2
  const apportInvalid = needsApport && apportPropre > 0 && apportPropre < minApport

  const durationBounds = useMemo(() => {
    if (activeTab === 'IMMOBILIER') return { min: 60, max: 300, minLabel: '5 ans', maxLabel: '25 ans' }
    if (activeTab === 'VEHICULE') return { min: 12, max: 84, minLabel: '1 an', maxLabel: '7 ans' }
    return { min: 6, max: 60, minLabel: '6 mois', maxLabel: '5 ans' }
  }, [activeTab])

  function handleTabChange(tab: (typeof TABS)[0]) {
    setActiveTab(tab.id)
    setSim(null)
    setError(null)
    setRevenuBrut(0)
    setAutresFinancements(0)
    if (tab.id === 'IMMOBILIER') {
      setAmount(100000)
      setDurationMonths(180)
      setApportPropre(20000)
    }
    if (tab.id === 'VEHICULE') {
      setAmount(30000)
      setDurationMonths(60)
      setApportPropre(6000)
    }
    if (tab.id === 'CONSO') {
      setAmount(10000)
      setDurationMonths(36)
      setApportPropre(0)
    }
  }

  async function run() {
    setError(null)
    if (needsApport && apportPropre < minApport) {
      setError(`L'apport propre minimum est de 20 % du montant, soit ${formatTnd(minApport)}.`)
      return
    }
    if (!revenuBrut || revenuBrut <= 0) {
      setError('Veuillez renseigner votre revenu brut mensuel.')
      return
    }
    setLoading(true)
    try {
      const { data } = await api.post<SimResult>('/credits/simulate', {
        amount: montantFinance,
        durationMonths,
        annualRatePercent,
        monthlyIncome: revenuBrut,
        monthlyCharges: autresFinancements,
      })
      setSim(data)
    } catch {
      setError('Impossible de calculer — vérifiez que le serveur est démarré.')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    handleTabChange(tabMeta)
  }

  const risk = riskStyle(sim?.simulationRiskLabel)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      {/* En-tête */}
      <header className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-[#071D49] via-[#0A2463] to-[#1D4ED8] px-6 py-10 text-white shadow-lg sm:px-10">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-20 left-1/4 h-40 w-40 rounded-full bg-blue-300/15 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-blue-100">
              <Calculator className="h-3.5 w-3.5" />
              Outil indicatif STB
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Simulateur de crédit</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-blue-100/90">
              Estimez votre mensualité, le coût total du financement et votre taux d&apos;endettement selon le type de crédit.
            </p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm backdrop-blur-sm">
            <p className="text-blue-100/80">Taux indicatif</p>
            <p className="text-2xl font-bold tabular-nums">{annualRatePercent} %</p>
            <p className="text-xs text-blue-100/70">par an — {tabMeta.shortLabel}</p>
          </div>
        </div>
      </header>

      {/* Sélecteur type de crédit */}
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {TABS.map((tab) => {
          const active = activeTab === tab.id
          const Icon = tab.Icon
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab)}
              className={`group flex flex-col items-start rounded-xl border p-4 text-left transition duration-200 ${
                active
                  ? 'border-[#1D4ED8] bg-blue-50 shadow-md shadow-blue-100 ring-2 ring-[#1D4ED8]/20'
                  : 'border-[#E2E8F0] bg-white hover:border-blue-200 hover:bg-slate-50'
              }`}
            >
              <span
                className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${
                  active ? 'bg-[#1D4ED8] text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700'
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className={`text-sm font-semibold ${active ? 'text-[#0F172A]' : 'text-slate-700'}`}>
                {tab.label}
              </span>
              <span className="mt-1 text-xs text-slate-500">{tab.hint}</span>
            </button>
          )
        })}
      </div>

      {/* Formulaire */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
        <div className="border-b border-[#E2E8F0] bg-[#F8FAFC] px-6 py-4">
          <h2 className="text-base font-semibold text-[#0F172A]">Paramètres de simulation</h2>
          <p className="mt-0.5 text-sm text-[#64748B]">Renseignez les montants en dinars tunisiens (TND).</p>
        </div>

        <div className="grid gap-5 p-6 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-[#334155]">
              <Wallet className="h-4 w-4 text-[#64748B]" />
              Montant demandé <span className="text-red-500">*</span>
            </span>
            <input
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="stb-input tabular-nums"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-[#334155]">
              <TrendingUp className="h-4 w-4 text-[#64748B]" />
              Revenu brut mensuel <span className="text-red-500">*</span>
            </span>
            <input
              type="number"
              min={0}
              value={revenuBrut || ''}
              onChange={(e) => setRevenuBrut(Number(e.target.value))}
              placeholder="Ex. 3 000"
              className="stb-input tabular-nums"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[#334155]">
              Mensualités autres financements
            </span>
            <input
              type="number"
              min={0}
              value={autresFinancements || ''}
              onChange={(e) => setAutresFinancements(Number(e.target.value))}
              placeholder="Ex. 500"
              className="stb-input tabular-nums"
            />
          </label>

          {needsApport && (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-[#334155]">
                Apport propre <span className="font-normal text-[#64748B]">(min. 20 %)</span>{' '}
                <span className="text-red-500">*</span>
              </span>
              <input
                type="number"
                min={0}
                value={apportPropre || ''}
                onChange={(e) => setApportPropre(Number(e.target.value))}
                placeholder={`Min. ${formatTnd(minApport)}`}
                className={`stb-input tabular-nums ${apportInvalid ? 'border-red-300 ring-red-100' : ''}`}
              />
              {apportInvalid && (
                <p className="mt-1.5 text-xs text-red-600">Minimum requis : {formatTnd(minApport)}</p>
              )}
            </label>
          )}

          <div className={`${needsApport ? 'sm:col-span-2' : 'sm:col-span-2'} rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4`}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-[#334155]">Durée de remboursement</span>
              <span className="rounded-full bg-[#1D4ED8] px-3 py-1 text-xs font-semibold text-white tabular-nums">
                {durationYears} ans · {durationMonths} mois
              </span>
            </div>
            <input
              type="range"
              min={durationBounds.min}
              max={durationBounds.max}
              step={activeTab === 'CONSO' ? 6 : 12}
              value={durationMonths}
              onChange={(e) => setDurationMonths(Number(e.target.value))}
              className="h-2 w-full cursor-pointer accent-[#1D4ED8]"
            />
            <div className="mt-2 flex justify-between text-xs text-[#94A3B8]">
              <span>{durationBounds.minLabel}</span>
              <span>{durationBounds.maxLabel}</span>
            </div>
          </div>

          {needsApport && montantFinance > 0 && (
            <div className="sm:col-span-2 flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-blue-900">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <p>
                Montant financé après apport :{' '}
                <strong className="tabular-nums">{formatTnd(montantFinance)}</strong>
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="mx-6 mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-[#E2E8F0] bg-[#F8FAFC] px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-5 text-sm font-medium text-[#475569] transition hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Réinitialiser
          </button>
          <button
            type="button"
            onClick={run}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1E40AF] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Calcul en cours…' : 'Lancer la simulation'}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </section>

      {/* Résultats */}
      {sim && (
        <section className="mt-8 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-[#1D4ED8]/20 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm lg:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Mensualité estimée</p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-[#1D4ED8]">{formatTnd(sim.monthlyPayment)}</p>
              <p className="mt-1 text-sm text-[#64748B]">Taux {annualRatePercent} % · {durationMonths} mois</p>
            </div>
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Total intérêts</p>
              <p className="mt-2 text-xl font-bold tabular-nums text-[#0F172A]">{formatTnd(sim.totalCostInterest)}</p>
            </div>
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Total remboursé</p>
              <p className="mt-2 text-xl font-bold tabular-nums text-[#0F172A]">{formatTnd(sim.totalRepaid)}</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-[#0F172A]">Synthèse du dossier simulé</p>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                  <dt className="text-[#64748B]">Type de crédit</dt>
                  <dd className="font-medium text-[#0F172A]">{tabMeta.label}</dd>
                </div>
                {needsApport && (
                  <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                    <dt className="text-[#64748B]">Apport propre</dt>
                    <dd className="font-medium tabular-nums text-[#0F172A]">{formatTnd(apportPropre)}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                  <dt className="text-[#64748B]">Capital financé</dt>
                  <dd className="font-medium tabular-nums text-[#0F172A]">{formatTnd(montantFinance)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#64748B]">Durée</dt>
                  <dd className="font-medium text-[#0F172A]">
                    {durationYears} ans ({durationMonths} mois)
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[#0F172A]">Taux d&apos;endettement après prêt</p>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${risk.badge}`}>
                  Risque {risk.text}
                </span>
              </div>
              <p className="mt-3 text-3xl font-bold tabular-nums text-[#0F172A]">
                {sim.debtRatioPercent != null ? `${sim.debtRatioPercent} %` : '—'}
              </p>
              {sim.recommendations && sim.recommendations.length > 0 && (
                <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                  {sim.recommendations.map((rec) => (
                    <li key={rec} className="flex gap-2 text-sm text-[#475569]">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1D4ED8]" />
                      {rec}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-blue-100 bg-blue-50/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-relaxed text-blue-900">
              Cette simulation est indicative et ne constitue pas une offre de crédit. Pour une demande officielle,
              créez votre dossier en ligne.
            </p>
            <Link
              to="/demande"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1E40AF]"
            >
              Créer une demande
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
