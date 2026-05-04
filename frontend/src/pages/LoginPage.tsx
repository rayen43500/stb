import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function LoginPage() {
  const { login, token } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard'
  const [email, setEmail] = useState('client@stb.local')
  const [password, setPassword] = useState('ClientSTB!2026')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (token) return <Navigate to={from} replace />

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
    } catch {
      setError('Identifiants invalides')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="stb-card">
        <h1 className="stb-h1">Connexion</h1>
        <p className="stb-lead">Accès sécurisé par JWT — session STB.</p>
        <form className="mt-8 space-y-5" onSubmit={submit}>
          <div>
            <label className="stb-label">Email</label>
            <input
              className="stb-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div>
            <label className="stb-label">Mot de passe</label>
            <input
              type="password"
              className="stb-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={loading} className="stb-btn-primary w-full py-3">
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Pas de compte ?{' '}
          <Link className="stb-link" to="/register">
            Créer un profil client
          </Link>
        </p>
      </div>
    </div>
  )
}
