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
  const [submittedEmail, setSubmittedEmail] = useState('')

  if (token) return <Navigate to="/" replace />

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await register({ email, firstName, lastName, nationalId, phone, dateOfBirth })
      setSubmittedEmail(email)
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
          <h1 className="stb-h1">Vérifiez votre email</h1>
          <p className="stb-lead mt-4">
            Un lien d&apos;activation a été envoyé à <strong>{submittedEmail}</strong>. Cliquez sur le lien pour
            vérifier votre compte et définir votre mot de passe.
          </p>
          <p className="mt-3 text-sm text-slate-600">
            Pensez à vérifier vos spams. Le lien est valable 48 heures.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Link to={`/activate?email=${encodeURIComponent(submittedEmail)}`} className="stb-btn-primary py-3 text-center">
              Ouvrir la page d&apos;activation
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
          Renseignez vos informations. Vous recevrez un email avec un lien de vérification pour activer votre compte.
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
            {loading ? 'Envoi…' : 'Créer mon compte'}
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
