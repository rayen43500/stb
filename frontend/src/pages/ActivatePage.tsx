import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthBrandHeader } from '../components/auth/AuthBrandHeader'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

export function ActivatePage() {
  const { activate, token } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    const qEmail = searchParams.get('email')
    const qCode = searchParams.get('code')
    if (qEmail) setEmail(qEmail)
    if (qCode) setCode(qCode)
  }, [searchParams])

  if (token) return <Navigate to="/" replace />

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
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

  async function resendEmail() {
    if (!email.trim()) {
      setError('Saisissez votre email pour renvoyer le lien')
      return
    }
    setResending(true)
    setError(null)
    setInfo(null)
    try {
      const { data } = await api.post<{ message?: string }>('/auth/resend-activation', { email: email.trim() })
      setInfo(data.message || 'Email renvoyé si le compte existe.')
    } catch (err: unknown) {
      let msg = 'Envoi impossible'
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const data = (err as { response?: { data?: { message?: string } } }).response?.data?.message
        if (data) msg = String(data)
      }
      setError(msg)
    } finally {
      setResending(false)
    }
  }

  const fromLink = Boolean(searchParams.get('code'))

  return (
    <div style={{ minHeight: '100vh', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ background: 'white', borderRadius: '16px', border: '0.5px solid #DBEAFE', padding: '36px 32px', width: '100%', maxWidth: '420px', boxShadow: '0 4px 24px rgba(30, 58, 138, 0.08)' }}>
        <AuthBrandHeader title="Activer mon compte" />
        <p className="stb-lead" style={{ marginTop: 0 }}>
          {fromLink
            ? 'Lien de vérification détecté. Définissez votre mot de passe pour finaliser l\'activation.'
            : 'Saisissez le code reçu par email ou ouvrez directement le lien de vérification.'}
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
          {info && <p className="text-sm text-emerald-700">{info}</p>}
          <button type="submit" disabled={loading} className="stb-btn-primary w-full py-3">
            {loading ? 'Activation…' : 'Activer et se connecter'}
          </button>
        </form>
        <div className="mt-6 border-t border-slate-200 pt-4 text-center">
          <button
            type="button"
            disabled={resending}
            onClick={resendEmail}
            className="text-sm font-semibold text-[#1D4ED8] hover:underline disabled:opacity-50"
          >
            {resending ? 'Envoi…' : 'Renvoyer l\'email de vérification'}
          </button>
        </div>
        <p className="mt-4 text-center text-sm text-slate-500">
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

