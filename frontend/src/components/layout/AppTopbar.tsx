import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, LogOut, Menu, Search, User } from 'lucide-react'
import { api } from '../../lib/api'
import { roleLabelFr } from '../../lib/roleLabels'
import type { SafeUser } from '../../types'

type NotifRow = {
  _id: string
  title: string
  message: string
  link?: string
  createdAt?: string
  read?: boolean
}

type Props = {
  title: string
  user: SafeUser
  avatarSrc: string | null
  notifCount: number
  onOpenMobileNav: () => void
  onLogout: () => void
}

export function AppTopbar({ title, user, avatarSrc, notifCount, onOpenMobileNav, onLogout }: Props) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [notifs, setNotifs] = useState<NotifRow[]>([])
  const menuRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function close(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  useEffect(() => {
    if (!bellOpen) return
    api
      .get<NotifRow[]>('/notifications')
      .then((r) => setNotifs(r.data.slice(0, 6)))
      .catch(() => setNotifs([]))
  }, [bellOpen])

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-4 border-b border-[#E2E8F0] bg-white/95 px-4 backdrop-blur-md sm:px-6">
      <button
        type="button"
        className="app-btn-ghost rounded-[10px] p-2 text-slate-600 lg:hidden"
        aria-label="Ouvrir la navigation"
        onClick={onOpenMobileNav}
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold tracking-tight text-[#0F172A] sm:text-[17px]">{title}</h1>
        <p className="hidden truncate text-xs text-[#64748B] sm:block">{roleLabelFr[user.role]}</p>
      </div>

      <div className="hidden max-w-xs flex-1 md:block lg:max-w-md">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" aria-hidden />
          <input
            type="search"
            placeholder="Rechercher dossiers, référence…"
            className="app-input-search w-full rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] py-2 pl-9 pr-3 text-sm text-[#0F172A] outline-none transition placeholder:text-[#64748B] focus:border-[#1D4ED8] focus:bg-white focus:ring-2 focus:ring-[#1D4ED8]/20"
            onKeyDown={(e) => {
              if (e.key === 'Enter') navigate('/dossiers')
            }}
          />
        </label>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <div className="relative" ref={bellRef}>
          <button
            type="button"
            className="app-btn-ghost relative rounded-[10px] p-2 text-[#64748B] hover:text-[#0F172A]"
            aria-expanded={bellOpen}
            aria-haspopup="dialog"
            title="Notifications"
            onClick={() => setBellOpen((v) => !v)}
          >
            <Bell className="h-5 w-5" />
            {notifCount > 0 ? (
              <span className="absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[#F59E0B] px-1 text-[10px] font-bold text-white">
                {notifCount > 9 ? '9+' : notifCount}
              </span>
            ) : null}
          </button>
          {bellOpen ? (
            <div
              className="absolute right-0 top-full z-50 mt-2 w-[min(calc(100vw-2rem),22rem)] rounded-xl border border-[#E2E8F0] bg-white py-2 shadow-lg shadow-slate-900/10"
              role="dialog"
              aria-label="Notifications récentes"
            >
              <div className="border-b border-[#E2E8F0] px-3 pb-2 pt-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Notifications</p>
              </div>
              <ul className="max-h-72 overflow-y-auto">
                {notifs.length === 0 ? (
                  <li className="px-4 py-6 text-center text-sm text-[#64748B]">Aucune notification récente.</li>
                ) : (
                  notifs.map((n) => (
                    <li key={n._id} className="border-b border-slate-50 last:border-0">
                      {n.link ? (
                        <Link
                          to={n.link.startsWith('/') ? n.link : `/${n.link}`}
                          className="block px-4 py-3 text-left hover:bg-[#F8FAFC]"
                          onClick={() => setBellOpen(false)}
                        >
                          <span className="block text-sm font-medium text-[#0F172A]">{n.title}</span>
                          <span className="mt-0.5 line-clamp-2 text-xs text-[#64748B]">{n.message}</span>
                        </Link>
                      ) : (
                        <div className="px-4 py-3">
                          <span className="block text-sm font-medium text-[#0F172A]">{n.title}</span>
                          <span className="mt-0.5 text-xs text-[#64748B]">{n.message}</span>
                        </div>
                      )}
                    </li>
                  ))
                )}
              </ul>
              <div className="border-t border-[#E2E8F0] px-3 py-2">
                <Link
                  to="/dashboard"
                  className="block text-center text-xs font-semibold text-[#1D4ED8] hover:underline"
                  onClick={() => setBellOpen(false)}
                >
                  Vers le tableau de bord
                </Link>
              </div>
            </div>
          ) : null}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="flex items-center gap-2 rounded-[10px] py-1.5 pl-1.5 pr-2 text-left transition hover:bg-[#F8FAFC]"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-[#1D4ED8] text-xs font-bold text-white">
              {avatarSrc ? (
                <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
              ) : (
                (user.firstName?.[0] || user.email[0]).toUpperCase()
              )}
            </span>
            <span className="hidden max-w-[9rem] truncate text-sm font-medium text-[#0F172A] lg:block">
              {user.firstName || user.email.split('@')[0]}
            </span>
            <ChevronDown className="hidden h-4 w-4 text-[#64748B] lg:block" aria-hidden />
          </button>
          {menuOpen ? (
            <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-[#E2E8F0] bg-white py-1 shadow-lg shadow-slate-900/10">
              <Link
                to="/compte"
                className="flex items-center gap-2 px-3 py-2 text-sm text-[#0F172A] hover:bg-[#F8FAFC]"
                onClick={() => setMenuOpen(false)}
              >
                <User className="h-4 w-4 text-[#64748B]" />
                Mon profil
              </Link>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#EF4444] hover:bg-red-50"
                onClick={() => {
                  setMenuOpen(false)
                  onLogout()
                }}
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
