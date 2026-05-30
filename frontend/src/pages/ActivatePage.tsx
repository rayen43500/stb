import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ActivatePage() {
  const { activate, token } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (token) return <Navigate to="/" replace />

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    if (password.length < 8) {
      setError('Mot de passe : 8 caractères minimum')
      return
    }
    setLoading(true)
    try {
      await activate(email, code, password)
      navigate('/')
    } catch (err: unknown) {
      let msg = 'Activation impossible'
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
        <h1 className="stb-h1">Activer mon compte</h1>
        <p className="stb-lead">
          Saisissez le code reçu par email après validation de votre inscription, puis définissez votre mot de passe.
        </p>
        <form className="mt-8 space-y-5" onSubmit={submit}>
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
            <label className="stb-label">Code d&apos;activation</label>
            <input
              required
              className="stb-input font-mono tracking-widest"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
            />
          </div>
          <div>
            <label className="stb-label">Nouveau mot de passe</label>
            <input
              type="password"
              required
              minLength={8}
              className="stb-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="stb-label">Confirmer le mot de passe</label>
            <input
              type="password"
              required
              className="stb-input"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="stb-btn-primary w-full py-3">
            {loading ? 'Activation…' : 'Activer et se connecter'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          <Link className="stb-link" to="/register">
            Pas encore inscrit ?
          </Link>
          {' · '}
          <Link className="stb-link" to="/login">
            Connexion
          </Link>
        </p>
      </div>
    </div>
  )
}
