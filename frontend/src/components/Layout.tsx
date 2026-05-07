import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { useProfileAvatarSrc } from '../hooks/useProfileAvatarSrc'
import { roleLabelFr } from '../lib/roleLabels'
import type { Role } from '../types'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-xl px-3 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-blue-50 text-blue-800 shadow-sm ring-1 ring-blue-200'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`

function linksForRole(role: Role | undefined) {
  if (!role) {
    return [
      { to: '/', label: 'Accueil' },
      { to: '/login', label: 'Connexion' },
      { to: '/register', label: 'Inscription' },
      { to: '/simulation', label: 'Simulation' },
      { to: '/assistant', label: 'Assistant' },
    ]
  }
  const tail = [
    { to: '/simulation', label: 'Simulation' },
    { to: '/assistant', label: 'Assistant' },
    { to: '/compte', label: 'Compte & profil' },
  ]
  const core = [{ to: '/', label: 'Accueil' }, { to: '/dashboard', label: 'Mon espace' }]
  if (role === 'CLIENT') {
    return [
      ...core,
      { to: '/demande', label: 'Nouvelle demande' },
      { to: '/dossiers', label: 'Mes dossiers' },
      ...tail,
    ]
  }
  if (role === 'ADMIN') {
    return [...core, { to: '/dossiers', label: 'Tous les dossiers' }, { to: '/admin', label: 'Administration' }, ...tail]
  }
  return [...core, { to: '/dossiers', label: 'Dossiers' }, ...tail]
}

export function Layout() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const [notifCount, setNotifCount] = useState(0)
  const avatarSrc = useProfileAvatarSrc(user?.hasAvatar, token, user?.updatedAt ?? null)

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
    <div className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(29,78,216,0.12),transparent)]">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_85%_75%,rgba(6,182,212,0.12),transparent_45%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 opacity-60 [background-image:linear-gradient(rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:120px_120px]"
        aria-hidden
      />
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3.5">
          <Link to="/" className="group flex items-center gap-3">
            <span className="flex h-10 items-center rounded-2xl bg-white px-2 shadow-sm ring-1 ring-slate-200">
              <img src="/image.png" alt="STB" className="h-7 w-auto" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-[15px] font-semibold tracking-tight text-slate-900">STB Crédits</span>
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
              <span className="ml-1 inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
                {notifCount} notification{notifCount > 1 ? 's' : ''}
              </span>
            )}
          </nav>
          <div className="flex items-center gap-3">
            {user && (
              <Link
                to="/compte"
                className="hidden items-center gap-2.5 rounded-2xl py-1 pl-1 pr-3 ring-1 ring-slate-200/90 transition hover:bg-slate-50 sm:flex"
              >
                <span className="relative h-9 w-9 overflow-hidden rounded-xl bg-gradient-to-br from-blue-700 to-blue-600 shadow-sm ring-1 ring-white/30">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
                      {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                    </span>
                  )}
                </span>
                <span className="max-w-[11rem] text-left text-sm leading-tight">
                  <span className="block truncate font-medium text-slate-900">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="block truncate text-[11px] font-medium text-blue-700">{roleLabelFr[user.role]}</span>
                </span>
              </Link>
            )}
            {token ? (
              <button
                type="button"
                className="stb-btn-secondary text-xs sm:text-sm"
                onClick={() => {
                  logout()
                  navigate('/login')
                }}
              >
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
