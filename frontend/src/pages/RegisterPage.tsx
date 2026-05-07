import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function RegisterPage() {
  const { register, token } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (token) return <Navigate to="/dashboard" replace />

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await register({ email, password, firstName, lastName })
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

  return (
    <div className="mx-auto max-w-md">
      <div className="stb-card">
        <h1 className="stb-h1">Inscription client</h1>
        <p className="stb-lead">Création de compte avec le rôle CLIENT par défaut.</p>
        <form className="mt-8 space-y-5" onSubmit={submit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="stb-label">Prénom</label>
              <input className="stb-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div>
              <label className="stb-label">Nom</label>
              <input className="stb-input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="stb-label">Email</label>
            <input
              type="email"
              required
              className="stb-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="stb-label">Mot de passe</label>
            <input
              type="password"
              required
              minLength={6}
              className="stb-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="stb-btn-primary w-full py-3">
            {loading ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          <Link className="stb-link" to="/login">
            Déjà inscrit ? Connexion
          </Link>
        </p>
      </div>
    </div>
  )
}
