import { useState } from 'react'
import { api } from '../lib/api'
import { formatTnd } from '../lib/money'

type CreditType = 'IMMOBILIER' | 'VEHICULE' | 'CONSO'

type SimResult = {
  monthlyPayment: number
  totalCostInterest: number
  totalRepaid: number
}

const TABS: { id: CreditType; label: string; icon: string; defaultRate: number }[] = [
  { id: 'IMMOBILIER', label: 'Crédit Immobilier', icon: '🏠', defaultRate: 6.5 },
  { id: 'VEHICULE',   label: 'Crédit Auto',       icon: '🚗', defaultRate: 8.0 },
  { id: 'CONSO',      label: 'Crédit Consommation', icon: '💳', defaultRate: 9.5 },
]

const inputStyle = {
  width: '100%', padding: '10px 14px',
  border: '1px solid #CBD5E1', borderRadius: '8px',
  fontSize: '14px', color: '#0F172A',
  background: '#F8FAFC', outline: 'none',
}

const labelStyle = {
  display: 'block', fontSize: '13px',
  fontWeight: 500, color: '#374151', marginBottom: '6px',
} as const

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

  const annualRatePercent =
    activeTab === 'IMMOBILIER' ? 6.5 :
    activeTab === 'VEHICULE'   ? 8.0 : 9.5

  function handleTabChange(tab: typeof TABS[0]) {
    setActiveTab(tab.id)
    setSim(null)
    setError(null)
    setRevenuBrut(0)
    setAutresFinancements(0)
    if (tab.id === 'IMMOBILIER') { setAmount(100000); setDurationMonths(180); setApportPropre(20000) }
    if (tab.id === 'VEHICULE')   { setAmount(30000);  setDurationMonths(60);  setApportPropre(6000)  }
    if (tab.id === 'CONSO')      { setAmount(10000);  setDurationMonths(36) }
  }

  async function run() {
    setError(null)
    if (activeTab !== 'CONSO') {
      const minApport = amount * 0.2
      if (apportPropre < minApport) {
        setError(`L'apport propre minimum est de 20% du montant soit ${formatTnd(minApport)}`)
        return
      }
    }
    setLoading(true)
    try {
      const montantFinance = activeTab !== 'CONSO' ? amount - apportPropre : amount
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
    setSim(null)
    setError(null)
    setRevenuBrut(0)
    setAutresFinancements(0)
    if (activeTab === 'IMMOBILIER') { setAmount(100000); setDurationMonths(180); setApportPropre(20000) }
    if (activeTab === 'VEHICULE')   { setAmount(30000);  setDurationMonths(60);  setApportPropre(6000)  }
    if (activeTab === 'CONSO')      { setAmount(10000);  setDurationMonths(36) }
  }

  const durationYears = Math.round(durationMonths / 12)
  const needsApport = activeTab !== 'CONSO'
  //const montantFinance = needsApport ? amount - apportPropre : amount

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '32px 16px', fontFamily: "'Segoe UI', sans-serif" }}>

      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#0A2463', marginBottom: '8px' }}>
          Simulateur de Crédit
        </h1>
        <p style={{ fontSize: '14px', color: '#64748B' }}>
          Estimez votre mensualité selon le type de crédit souhaité
        </p>
      </div>

      {/* ONGLETS */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {TABS.map((tab) => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab)}
              style={{
                flex: 1, maxWidth: '200px', padding: '16px 12px',
                background: active ? '#1D4ED8' : 'white',
                color: active ? 'white' : '#475569',
                border: `1px solid ${active ? '#1D4ED8' : '#E2E8F0'}`,
                borderRadius: '10px 10px 0 0',
                cursor: 'pointer', fontSize: '13px',
                fontWeight: active ? 600 : 400,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '6px',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: '28px' }}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* FORMULAIRE */}
      <div style={{
        background: 'white', border: '1px solid #E2E8F0',
        borderTop: 'none', borderRadius: '0 0 12px 12px',
        padding: '32px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

          <div>
            <label style={labelStyle}>Montant demandé (TND) <span style={{ color: '#EF4444' }}>*</span></label>
            <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Revenu Brut (TND) <span style={{ color: '#EF4444' }}>*</span></label>
            <input type="number" value={revenuBrut || ''} onChange={(e) => setRevenuBrut(Number(e.target.value))} placeholder="Ex. 3000" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Mensualités autres financements (TND)</label>
            <input type="number" value={autresFinancements || ''} onChange={(e) => setAutresFinancements(Number(e.target.value))} placeholder="Ex. 500" style={inputStyle} />
          </div>

          {needsApport && (
            <div>
              <label style={labelStyle}>
                Apport Propre <span style={{ color: '#64748B', fontSize: '11px' }}>(Minimum 20%)</span>{' '}
                <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="number"
                value={apportPropre || ''}
                onChange={(e) => setApportPropre(Number(e.target.value))}
                placeholder={`Min. ${formatTnd(amount * 0.2)}`}
                style={inputStyle}
              />
              {apportPropre > 0 && apportPropre < amount * 0.2 && (
                <p style={{ fontSize: '11px', color: '#EF4444', marginTop: '4px' }}>
                  Minimum requis : {formatTnd(amount * 0.2)}
                </p>
              )}
            </div>
          )}

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>
              Durée de remboursement :{' '}
              <strong style={{ color: '#1D4ED8' }}>{durationYears} ans ({durationMonths} mois)</strong>
            </label>
            <input
              type="range"
              min={activeTab === 'IMMOBILIER' ? 60 : activeTab === 'VEHICULE' ? 12 : 6}
              max={activeTab === 'IMMOBILIER' ? 300 : activeTab === 'VEHICULE' ? 84 : 60}
              step={12}
              value={durationMonths}
              onChange={(e) => setDurationMonths(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#1D4ED8', height: '6px', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
              <span>{activeTab === 'IMMOBILIER' ? '5 ans' : activeTab === 'VEHICULE' ? '1 an' : '6 mois'}</span>
              <span>{activeTab === 'IMMOBILIER' ? '25 ans' : activeTab === 'VEHICULE' ? '7 ans' : '5 ans'}</span>
            </div>
          </div>

          

        </div>

        {error && (
          <p style={{ marginTop: '16px', fontSize: '13px', color: '#DC2626', padding: '10px 14px', background: '#FEF2F2', borderRadius: '8px', border: '1px solid #FECACA' }}>
            ⚠️ {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={reset} style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #CBD5E1', background: 'white', color: '#475569', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
            EFFACER
          </button>
          <button type="button" onClick={run} disabled={loading} style={{ padding: '10px 32px', borderRadius: '8px', background: loading ? '#93C5FD' : '#1D4ED8', color: 'white', fontSize: '14px', fontWeight: 600, border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Calcul…' : 'SIMULER ›'}
          </button>
        </div>
      </div>

      {/* RÉSULTATS */}
      {sim && (
        <div style={{ marginTop: '24px', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ background: '#1D4ED8', padding: '14px 24px' }}>
            <h3 style={{ color: 'white', fontSize: '15px', fontWeight: 600, textAlign: 'center' }}>Résultats</h3>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
            <tbody>
              {[
                { label: 'Mensualité',         value: formatTnd(sim.monthlyPayment),    highlight: true  },
                { label: 'Total des intérêts', value: formatTnd(sim.totalCostInterest), highlight: false },
                { label: 'Total remboursé',    value: formatTnd(sim.totalRepaid),       highlight: false },
                { label: 'Durée',              value: `${durationYears} ans (${durationMonths} mois)`, highlight: false },
                ...(needsApport ? [{ label: 'Apport propre', value: formatTnd(apportPropre), highlight: false }] : []),
              ].map((row, i) => (
                <tr key={row.label} style={{ background: i % 2 === 0 ? '#F8FAFC' : 'white' }}>
                  <td style={{ padding: '14px 24px', fontSize: '14px', color: '#374151', fontWeight: row.highlight ? 600 : 400, borderBottom: '1px solid #F1F5F9' }}>
                    {row.label}
                  </td>
                  <td style={{ padding: '14px 24px', fontSize: '15px', color: row.highlight ? '#1D4ED8' : '#0F172A', fontWeight: row.highlight ? 700 : 500, textAlign: 'right', borderBottom: '1px solid #F1F5F9' }}>
                    {row.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ background: '#EFF6FF', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>💡</span>
            <p style={{ fontSize: '13px', color: '#1E40AF' }}>
              Cette simulation est indicative. Pour soumettre une demande officielle,{' '}
              <a href="/demande" style={{ fontWeight: 600, color: '#1D4ED8' }}>créez un dossier ici</a>.
            </p>
          </div>
        </div>
      )}

    </div>
  )
}
