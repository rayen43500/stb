import type { ReactNode } from 'react'
import type { Role, SafeUser } from '../../types'
import { AppSidebar } from './AppSidebar'
import { AppTopbar } from './AppTopbar'
import { pageTitleForPath } from './routeTitles'
import { useLocation } from 'react-router-dom'

type Props = {
  user: SafeUser
  role: Role
  avatarSrc: string | null
  notifCount: number
  collapsed: boolean
  onToggleSidebar: () => void
  mobileNavOpen: boolean
  onMobileNavOpen: () => void
  onMobileNavClose: () => void
  onLogout: () => void
  children: ReactNode
}

export function AppShell({
  user,
  role,
  avatarSrc,
  notifCount,
  collapsed,
  onToggleSidebar,
  mobileNavOpen,
  onMobileNavOpen,
  onMobileNavClose,
  onLogout,
  children,
}: Props) {
  const location = useLocation()
  const title = pageTitleForPath(location.pathname)

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <AppSidebar
        role={role}
        collapsed={collapsed}
        onToggleCollapse={onToggleSidebar}
        mobileOpen={mobileNavOpen}
        onCloseMobile={onMobileNavClose}
      />

      <div
        className={[
          'flex min-h-screen flex-col transition-[margin] duration-200 ease-out',
          collapsed ? 'lg:ml-20' : 'lg:ml-[260px]',
        ].join(' ')}
      >
        <AppTopbar
          title={title}
          user={user}
          avatarSrc={avatarSrc}
          notifCount={notifCount}
          onOpenMobileNav={onMobileNavOpen}
          onLogout={onLogout}
        />
        <div className="flex-1 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8 lg:py-6">{children}</div>
      </div>
    </div>
  )
}
