import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

export function DemandePage() {
  const [amount, setAmount] = useState(20000)
  const [durationMonths, setDurationMonths] = useState(36)
  const [annualRatePercent, setAnnualRatePercent] = useState(5.2)
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { data } = await api.post<{ _id: string }>('/credits/', {
        amount,
        durationMonths,
        annualRatePercent,
      })
      setCreatedId(data._id)
    } catch (err: unknown) {
      let msg = 'Erreur à la création'
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const m = (err as { response?: { data?: { message?: string } } }).response?.data?.message
        if (m) msg = String(m)
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="stb-page mx-auto max-w-lg">
      <div className="stb-card">
        <h1 className="stb-h1">Nouvelle demande</h1>
        <p className="stb-lead">
          Crée un dossier en statut <strong className="text-slate-700">BROUILLON</strong>. Complétez ensuite la fiche
          pour soumission.
        </p>
        <form className="mt-8 space-y-5" onSubmit={submit}>
          <div>
            <label className="stb-label">Montant (TND)</label>
            <input
              type="number"
              required
              className="stb-input"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="stb-label">Durée (mois)</label>
            <input
              type="number"
              required
              className="stb-input"
              value={durationMonths}
              onChange={(e) => setDurationMonths(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="stb-label">Taux annuel (%)</label>
            <input
              type="number"
              step="0.01"
              required
              className="stb-input"
              value={annualRatePercent}
              onChange={(e) => setAnnualRatePercent(Number(e.target.value))}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="stb-btn-primary w-full py-3">
            {loading ? 'Création…' : 'Créer le brouillon'}
          </button>
        </form>
        {createdId && (
          <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            Dossier créé.{' '}
            <Link className="stb-link font-semibold" to={`/dossiers/${createdId}`}>
              Ouvrir le dossier →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
