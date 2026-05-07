import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function LoginPage() {
  const { login, token } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard'
  const [email, setEmail] = useState('client@stb.local')
  const [password, setPassword] = useState('ClientSTB!2026')
  const [showPassword, setShowPassword] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  /** Aligné sur backend/src/seed.js (après `npm run seed`). */
  const demoAccounts = [
    { email: 'client@stb.local', password: 'ClientSTB!2026', role: 'CLIENT' },
    { email: 'agent@stb.local', password: 'AgentSTB!2026', role: 'AGENT' },
    { email: 'chef@stb.local', password: 'ChefSTB!2026', role: 'CHEF_AGENCE' },
    { email: 'comite@stb.local', password: 'ComiteSTB!2026', role: 'COMITE' },
    { email: 'admin@stb.local', password: 'AdminSTB!2026', role: 'ADMIN' },
    { email: 'admin.test.2026@stb.local', password: 'AdminTest!8nQ4', role: 'ADMIN (test)' },
  ] as const

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
            <div className="flex items-center justify-between gap-2">
              <label className="stb-label mb-0">Mot de passe</label>
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-xs font-medium text-blue-700 hover:text-blue-600 hover:underline"
              >
                {showPassword ? 'Masquer' : 'Afficher'}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              className="stb-input mt-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="stb-btn-primary w-full py-3">
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
        <details className="mt-6 rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm">
          <summary className="cursor-pointer font-medium text-slate-700">
            Comptes de démonstration (mots de passe — après seed)
          </summary>
          <p className="mt-2 text-xs text-slate-500">
            Créés par <code className="rounded bg-white px-1 py-0.5 text-slate-600">npm run seed</code> dans le dossier
            backend.
          </p>
          <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto text-xs">
            {demoAccounts.map((row) => (
              <li
                key={row.email}
                className="flex flex-col gap-0.5 rounded-md bg-white px-2 py-2 ring-1 ring-slate-100 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-slate-700">
                  <span className="font-mono text-slate-900">{row.email}</span>
                  <span className="ml-2 text-slate-400">({row.role})</span>
                </span>
                <code className="shrink-0 font-mono text-slate-800">{row.password}</code>
              </li>
            ))}
          </ul>
        </details>
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
