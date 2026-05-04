import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import type { Role } from '../types'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-xl px-3 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-white/10 text-white shadow-inner shadow-black/20 ring-1 ring-white/10'
      : 'text-slate-400 hover:bg-white/5 hover:text-white'
  }`

function linksForRole(role: Role | undefined) {
  const common = [
    { to: '/dashboard', label: 'Tableau de bord' },
    { to: '/simulation', label: 'Simulation' },
    { to: '/assistant', label: 'Assistant' },
  ]
  if (!role) {
    return [
      { to: '/login', label: 'Connexion' },
      { to: '/register', label: 'Inscription' },
      { to: '/simulation', label: 'Simulation' },
      { to: '/assistant', label: 'Assistant' },
    ]
  }
  if (role === 'CLIENT') {
    return [
      ...common,
      { to: '/demande', label: 'Demande crédit' },
      { to: '/dossiers', label: 'Mes dossiers' },
    ]
  }
  if (role === 'ADMIN') {
    return [...common, { to: '/dossiers', label: 'Tous les dossiers' }, { to: '/admin', label: 'Administration' }]
  }
  return [...common, { to: '/dossiers', label: 'Dossiers' }]
}

export function Layout() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const [notifCount, setNotifCount] = useState(0)

  useEffect(() => {
    if (!token) {
      setNotifCount(0)
      return
    }
    api
      .get<Array<{ read: boolean }>>('/notifications')
      .then((r) => setNotifCount(r.data.filter((n) => !n.read).length))
      .catch(() => {})
  }, [token, user?.id])

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(59,130,246,0.18),transparent)]">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(99,102,241,0.08),transparent_40%)]"
        aria-hidden
      />
      <header className="sticky top-0 z-30 border-b border-white/5 bg-slate-950/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3.5">
          <Link to="/" className="group flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-lg font-bold text-white shadow-lg shadow-blue-900/40">
              S
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-[15px] font-semibold tracking-tight text-white">STB Crédits</span>
              <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
                Banque & workflow
              </span>
            </span>
          </Link>
          <nav className="order-3 flex w-full flex-wrap items-center gap-1 sm:order-none sm:w-auto">
            {linksForRole(user?.role).map((l) => (
              <NavLink key={l.to} to={l.to} className={navClass} end={l.to === '/dashboard'}>
                {l.label}
              </NavLink>
            ))}
            {token && notifCount > 0 && (
              <span className="ml-1 inline-flex items-center rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-200 ring-1 ring-amber-500/30">
                {notifCount} notification{notifCount > 1 ? 's' : ''}
              </span>
            )}
          </nav>
          <div className="flex items-center gap-3">
            {user && (
              <span className="hidden max-w-[14rem] truncate text-right text-sm text-slate-400 sm:block">
                <span className="text-slate-200">
                  {user.firstName} {user.lastName}
                </span>
                <span className="block text-xs text-slate-500">{user.role}</span>
              </span>
            )}
            {token ? (
              <button type="button" className="stb-btn-secondary text-xs sm:text-sm" onClick={() => {
                logout()
                navigate('/login')
              }}>
                Déconnexion
              </button>
            ) : (
              <Link to="/login" className="stb-btn-primary px-4 py-2 text-xs sm:text-sm">
                Connexion
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="relative mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <Outlet />
      </main>
    </div>
  )
}
