import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function RegisterPage() {
  const { register, token } = useAuth()
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [nationalId, setNationalId] = useState('')
  const [phone, setPhone] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  if (token) return <Navigate to="/" replace />

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await register({ email, firstName, lastName, nationalId, phone, dateOfBirth })
      setSubmitted(true)
    } catch (err: unknown) {
      let msg = 'Inscription impossible'
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const data = (err as { response?: { data?: { message?: string } } }).response?.data?.message
        if (data) msg = String(data)
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-md">
        <div className="stb-card text-center">
          <h1 className="stb-h1">Demande enregistrée</h1>
          <p className="stb-lead mt-4">
            Votre inscription a été transmise au chef d&apos;agence pour validation. Une fois approuvée, vous recevrez un
            code d&apos;activation par email.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Link to="/activate" className="stb-btn-primary py-3 text-center">
              J&apos;ai reçu mon code — Activer mon compte
            </Link>
            <Link to="/login" className="stb-link text-sm">
              Retour connexion
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="stb-card">
        <h1 className="stb-h1">Inscription client</h1>
        <p className="stb-lead">
          Renseignez vos informations. Après validation par le chef d&apos;agence, vous recevrez un code pour activer
          votre compte et définir votre mot de passe.
        </p>
        <form className="mt-8 space-y-5" onSubmit={submit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="stb-label">Prénom *</label>
              <input className="stb-input" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div>
              <label className="stb-label">Nom *</label>
              <input className="stb-input" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="stb-label">CIN *</label>
            <input className="stb-input" required value={nationalId} onChange={(e) => setNationalId(e.target.value)} />
          </div>
          <div>
            <label className="stb-label">Email *</label>
            <input
              type="email"
              required
              className="stb-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="stb-label">Téléphone</label>
            <input className="stb-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="stb-label">Date de naissance</label>
            <input
              type="date"
              className="stb-input"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="stb-btn-primary w-full py-3">
            {loading ? 'Envoi…' : 'Soumettre mon inscription'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          <Link className="stb-link" to="/login">
            Déjà inscrit ? Connexion
          </Link>
          {' · '}
          <Link className="stb-link" to="/activate">
            Activer mon compte
          </Link>
        </p>
      </div>
    </div>
  )
}
