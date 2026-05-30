import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

const STEPS = [
  'Informations personnelles',
  'Informations professionnelles',
  'Informations financières',
  'Informations sur le crédit',
  'Confirmation',
] as const

type CreditType = 'CONSO' | 'IMMOBILIER' | 'VEHICULE' | 'AUTRE'

export function DemandePage() {
  const { user, refreshMe } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [createdId, setCreatedId] = useState<string | null>(null)

  const cp = user?.clientProfile || {}

  const [personal, setPersonal] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    nationalId: user?.nationalId || '',
    dateOfBirth: user?.dateOfBirth || '',
    addressLine1: user?.addressLine1 || '',
    city: user?.city || '',
    phone: user?.phone || '',
    email: user?.email || '',
    maritalStatus: cp.maritalStatus || '',
  })

  const [professional, setProfessional] = useState({
    profession: cp.profession || '',
    employerName: cp.employerName || '',
    contractType: cp.contractType || 'CDI',
    seniorityMonths: cp.seniorityMonths ?? 0,
  })

  const [financial, setFinancial] = useState({
    monthlyIncome: cp.monthlyIncome ?? 0,
    monthlyCharges: cp.monthlyCharges ?? 0,
    existingCredits: cp.existingCredits ?? 0,
    additionalIncome: cp.additionalIncome ?? 0,
  })

  const [credit, setCredit] = useState({
    creditType: 'CONSO' as CreditType,
    amount: 20000,
    durationMonths: 36,
    annualRatePercent: 5.2,
    creditPurpose: '',
  })

  async function saveProfile() {
    await api.patch('/profile/', {
      firstName: personal.firstName,
      lastName: personal.lastName,
      nationalId: personal.nationalId,
      phone: personal.phone,
      addressLine1: personal.addressLine1,
      city: personal.city,
      dateOfBirth: personal.dateOfBirth || undefined,
    })
    await api.patch('/clients/me', {
      firstName: personal.firstName,
      lastName: personal.lastName,
      phone: personal.phone,
      maritalStatus: personal.maritalStatus,
      profession: professional.profession,
      employerName: professional.employerName,
      contractType: professional.contractType,
      seniorityMonths: Number(professional.seniorityMonths),
      monthlyIncome: Number(financial.monthlyIncome),
      monthlyCharges: Number(financial.monthlyCharges),
      existingCredits: Number(financial.existingCredits),
      additionalIncome: Number(financial.additionalIncome),
    })
    await refreshMe()
  }

  async function nextStep() {
    setError(null)
    setLoading(true)
    try {
      if (step <= 2) await saveProfile()
      if (step === 3) {
        const { data } = await api.post<{ _id: string }>('/credits/', credit)
        setCreatedId(data._id)
      }
      setStep((s) => Math.min(s + 1, STEPS.length - 1))
    } catch (err: unknown) {
      let msg = 'Erreur à l\'enregistrement'
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
    <div className="stb-page mx-auto max-w-2xl">
      <div className="stb-card">
        <h1 className="stb-h1">Demande de crédit</h1>
        <p className="stb-lead">Formulaire en {STEPS.length} étapes — complétez chaque section avant soumission.</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {STEPS.map((label, i) => (
            <span
              key={label}
              className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                i === step
                  ? 'bg-blue-700 text-white ring-blue-800'
                  : i < step
                    ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
                    : 'bg-slate-100 text-slate-500 ring-slate-200'
              }`}
            >
              {i + 1}. {label}
            </span>
          ))}
        </div>

        <div className="mt-8 space-y-5">
          {step === 0 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="stb-label">Prénom</label>
                  <input className="stb-input" value={personal.firstName} onChange={(e) => setPersonal((p) => ({ ...p, firstName: e.target.value }))} />
                </div>
                <div>
                  <label className="stb-label">Nom</label>
                  <input className="stb-input" value={personal.lastName} onChange={(e) => setPersonal((p) => ({ ...p, lastName: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="stb-label">CIN</label>
                <input className="stb-input" value={personal.nationalId} onChange={(e) => setPersonal((p) => ({ ...p, nationalId: e.target.value }))} />
              </div>
              <div>
                <label className="stb-label">Date de naissance</label>
                <input type="date" className="stb-input" value={personal.dateOfBirth} onChange={(e) => setPersonal((p) => ({ ...p, dateOfBirth: e.target.value }))} />
              </div>
              <div>
                <label className="stb-label">Adresse</label>
                <input className="stb-input" value={personal.addressLine1} onChange={(e) => setPersonal((p) => ({ ...p, addressLine1: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="stb-label">Ville</label>
                  <input className="stb-input" value={personal.city} onChange={(e) => setPersonal((p) => ({ ...p, city: e.target.value }))} />
                </div>
                <div>
                  <label className="stb-label">Téléphone</label>
                  <input className="stb-input" value={personal.phone} onChange={(e) => setPersonal((p) => ({ ...p, phone: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="stb-label">Email</label>
                <input className="stb-input" disabled value={personal.email} />
              </div>
              <div>
                <label className="stb-label">Situation familiale</label>
                <select className="stb-input" value={personal.maritalStatus} onChange={(e) => setPersonal((p) => ({ ...p, maritalStatus: e.target.value }))}>
                  <option value="">—</option>
                  <option value="Célibataire">Célibataire</option>
                  <option value="Marié(e)">Marié(e)</option>
                  <option value="Divorcé(e)">Divorcé(e)</option>
                  <option value="Veuf(ve)">Veuf(ve)</option>
                </select>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div>
                <label className="stb-label">Profession</label>
                <input className="stb-input" value={professional.profession} onChange={(e) => setProfessional((p) => ({ ...p, profession: e.target.value }))} />
              </div>
              <div>
                <label className="stb-label">Employeur</label>
                <input className="stb-input" value={professional.employerName} onChange={(e) => setProfessional((p) => ({ ...p, employerName: e.target.value }))} />
              </div>
              <div>
                <label className="stb-label">Type de contrat</label>
                <select className="stb-input" value={professional.contractType} onChange={(e) => setProfessional((p) => ({ ...p, contractType: e.target.value }))}>
                  <option value="CDI">CDI</option>
                  <option value="CDD">CDD</option>
                  <option value="FONCTIONNAIRE">Fonctionnaire</option>
                  <option value="INDEPENDANT">Indépendant</option>
                  <option value="AUTRE">Autre</option>
                </select>
              </div>
              <div>
                <label className="stb-label">Ancienneté (mois)</label>
                <input type="number" className="stb-input" value={professional.seniorityMonths} onChange={(e) => setProfessional((p) => ({ ...p, seniorityMonths: Number(e.target.value) }))} />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="stb-label">Revenus mensuels nets (TND)</label>
                <input type="number" className="stb-input" value={financial.monthlyIncome} onChange={(e) => setFinancial((f) => ({ ...f, monthlyIncome: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="stb-label">Charges mensuelles fixes (TND)</label>
                <input type="number" className="stb-input" value={financial.monthlyCharges} onChange={(e) => setFinancial((f) => ({ ...f, monthlyCharges: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="stb-label">Crédits en cours (mensualités TND)</label>
                <input type="number" className="stb-input" value={financial.existingCredits} onChange={(e) => setFinancial((f) => ({ ...f, existingCredits: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="stb-label">Revenus supplémentaires (optionnel)</label>
                <input type="number" className="stb-input" value={financial.additionalIncome} onChange={(e) => setFinancial((f) => ({ ...f, additionalIncome: Number(e.target.value) }))} />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <label className="stb-label">Type de crédit</label>
                <select className="stb-input" value={credit.creditType} onChange={(e) => setCredit((c) => ({ ...c, creditType: e.target.value as CreditType }))}>
                  <option value="CONSO">Consommation</option>
                  <option value="IMMOBILIER">Immobilier</option>
                  <option value="VEHICULE">Auto / Véhicule</option>
                  <option value="AUTRE">Autre</option>
                </select>
              </div>
              <div>
                <label className="stb-label">Montant demandé (TND)</label>
                <input type="number" className="stb-input" value={credit.amount} onChange={(e) => setCredit((c) => ({ ...c, amount: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="stb-label">Durée (mois)</label>
                <input type="number" className="stb-input" value={credit.durationMonths} onChange={(e) => setCredit((c) => ({ ...c, durationMonths: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="stb-label">Taux d&apos;intérêt annuel (%)</label>
                <input type="number" step="0.01" className="stb-input" value={credit.annualRatePercent} onChange={(e) => setCredit((c) => ({ ...c, annualRatePercent: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="stb-label">Objet du crédit</label>
                <textarea className="stb-input min-h-[80px]" value={credit.creditPurpose} onChange={(e) => setCredit((c) => ({ ...c, creditPurpose: e.target.value }))} />
              </div>
            </>
          )}

          {step === 4 && createdId && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <p className="font-semibold">Brouillon créé avec succès.</p>
              <p className="mt-2">
                Étape suivante : déposez vos pièces justificatives (CIN, bulletins de salaire, relevés bancaires) puis
                soumettez le dossier.
              </p>
              <Link to={`/dossiers/${createdId}`} className="mt-4 inline-block font-semibold text-blue-700 hover:underline">
                Ouvrir le dossier et uploader les documents →
              </Link>
            </div>
          )}
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-8 flex justify-between gap-4">
          <button
            type="button"
            disabled={step === 0 || loading}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm disabled:opacity-40"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Précédent
          </button>
          {step < 3 && (
            <button type="button" disabled={loading} className="stb-btn-primary px-6 py-2" onClick={nextStep}>
              {loading ? 'Enregistrement…' : 'Suivant'}
            </button>
          )}
          {step === 3 && (
            <button type="button" disabled={loading} className="stb-btn-primary px-6 py-2" onClick={nextStep}>
              {loading ? 'Création…' : 'Créer le brouillon'}
            </button>
          )}
          {step === 4 && createdId && (
            <button type="button" className="stb-btn-primary px-6 py-2" onClick={() => navigate(`/dossiers/${createdId}`)}>
              Aller au dossier
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
