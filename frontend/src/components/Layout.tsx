import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { useProfileAvatarSrc } from '../hooks/useProfileAvatarSrc'
import { AppShell } from './layout/AppShell'
import { PublicChrome } from './layout/PublicChrome'
import { useSidebarCollapsed } from './layout/useSidebarCollapsed'

export function Layout() {
  const { user, token, logout, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [notifCount, setNotifCount] = useState(0)
  const [mobileNav, setMobileNav] = useState(false)
  const { collapsed, toggle } = useSidebarCollapsed()
  const avatarSrc = useProfileAvatarSrc(user?.hasAvatar, token, user?.updatedAt ?? null)

  useEffect(() => {
    setMobileNav(false)
  }, [location.pathname])

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

  if (loading && token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-[#E2E8F0] border-t-[#1D4ED8]"
          role="status"
          aria-label="Chargement"
        />
      </div>
    )
  }

  if (token && user) {
    return (
      <AppShell
        user={user}
        role={user.role}
        avatarSrc={avatarSrc}
        notifCount={notifCount}
        collapsed={collapsed}
        onToggleSidebar={toggle}
        mobileNavOpen={mobileNav}
        onMobileNavOpen={() => setMobileNav(true)}
        onMobileNavClose={() => setMobileNav(false)}
        onLogout={() => {
          logout()
          navigate('/login')
        }}
      >
        <Outlet />
      </AppShell>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <PublicChrome />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:pb-20">
        <Outlet />
      </main>
    </div>
  )
}
