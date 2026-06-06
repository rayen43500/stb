import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'


export function LoginPage() {
  const { login, token } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/'
  //const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard'
  const [email, setEmail] = useState('client@stb.local')
  const [password, setPassword] = useState('ClientSTB!2026')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  

  const demoAccounts = [
    { email: 'client@stb.local', password: 'ClientSTB!2026', role: 'CLIENT' },
    { email: 'agent@stb.local', password: 'AgentSTB!2026', role: 'AGENT' },
    { email: 'chef@stb.local', password: 'ChefSTB!2026', role: 'CHEF_AGENCE' },
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
    <div style={{
      minHeight: '100vh',
      background: '#EFF6FF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        border: '0.5px solid #DBEAFE',
        padding: '36px 32px',
        width: '100%',
        maxWidth: '380px',
        boxShadow: '0 4px 24px rgba(30, 58, 138, 0.08)',
      }}>

        {/* Logo STB */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
          <img
            src="/stb-logo.png"
            alt="STB Bank"
            style={{ height: '52px', objectFit: 'contain' }}
          />
        </div>

        {/* Titre */}
        <h1 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: '#0F172A',
          textAlign: 'center',
          marginBottom: '24px',
        }}>
          Connexion
        </h1>

        {/* Formulaire */}
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: '500',
              color: '#64748B',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '6px',
            }}>
              Email
            </label>
            <input
              className="stb-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              style={{ marginTop: '0' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{
                fontSize: '11px',
                fontWeight: '500',
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}>
                Mot de passe
              </label>
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  fontSize: '12px',
                  color: '#1D4ED8',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0',
                }}
              >
                {showPassword ? 'Masquer' : 'Afficher'}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              className="stb-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              style={{ marginTop: '0' }}
            />
          </div>

          {error && (
            <p style={{ fontSize: '13px', color: '#DC2626', textAlign: 'center' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: '#1D4ED8',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginTop: '4px',
            }}
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        {/* Comptes demo */}
        <details style={{ marginTop: '20px' }}>
          <summary style={{
            fontSize: '12px',
            color: '#64748B',
            cursor: 'pointer',
            padding: '8px 12px',
            background: '#F8FAFC',
            borderRadius: '8px',
            border: '0.5px solid #E2E8F0',
          }}>
            Comptes de démonstration
          </summary>
          <ul style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {demoAccounts.map((row) => (
              <li
                key={row.email}
                style={{
                  fontSize: '12px',
                  padding: '8px 10px',
                  background: '#F8FAFC',
                  borderRadius: '8px',
                  border: '0.5px solid #E2E8F0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
                onClick={() => setEmail(row.email)}
              >
                <span style={{ color: '#0F172A', fontFamily: 'monospace' }}>{row.email}</span>
                <span style={{
                  fontSize: '11px',
                  background: '#EFF6FF',
                  color: '#1D4ED8',
                  padding: '2px 8px',
                  borderRadius: '6px',
                }}>
                  {row.role}
                </span>
              </li>
            ))}
          </ul>
        </details>

        {/* Lien inscription */}
        <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: '#64748B' }}>
          Pas de compte ?{' '}
          <Link to="/register" style={{ color: '#1D4ED8', fontWeight: '500' }}>
            Créer un profil client
          </Link>
        </p>

      </div>
    </div>
  )
}