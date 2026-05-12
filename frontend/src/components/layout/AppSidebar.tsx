import { Link, NavLink } from 'react-router-dom'
import { PanelLeftClose, PanelLeft } from 'lucide-react'
import { getSidebarLinks } from './navConfig'
import type { Role } from '../../types'

type Props = {
  role: Role
  collapsed: boolean
  onToggleCollapse: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function AppSidebar({ role, collapsed, onToggleCollapse, mobileOpen, onCloseMobile }: Props) {
  const links = getSidebarLinks(role)

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'group flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm font-medium transition-colors duration-150',
      collapsed ? 'justify-center px-2' : '',
      isActive
        ? 'bg-blue-600 text-white shadow-sm'
        : 'text-slate-400 hover:bg-slate-800/80 hover:text-white',
    ].join(' ')

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-[2px] transition-opacity lg:hidden"
          aria-label="Fermer le menu"
          onClick={onCloseMobile}
        />
      ) : null}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-800 bg-slate-950 shadow-xl transition-[transform,width] duration-200 ease-out lg:shadow-none',
          collapsed ? 'w-[80px]' : 'w-[260px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
        aria-label="Navigation application"
      >
        <div className={`flex h-14 shrink-0 items-center border-b border-slate-800/90 px-3 ${collapsed ? 'justify-center' : 'gap-3 px-4'}`}>
          <Link to="/" className="flex min-w-0 items-center gap-2.5" onClick={onCloseMobile}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/10 ring-1 ring-white/10">
              <img src="/image.png" alt="STB" className="h-6 w-auto opacity-95" />
            </span>
            {!collapsed && (
              <span className="truncate font-semibold tracking-tight text-white">STB</span>
            )}
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {links.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={linkClass}
              onClick={onCloseMobile}
              title={collapsed ? label : undefined}
            >
              <Icon className="h-[18px] w-[18px] shrink-0 opacity-95" aria-hidden />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="hidden shrink-0 border-t border-slate-800 p-3 lg:block">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex w-full items-center justify-center gap-2 rounded-[10px] px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            title={collapsed ? 'Développer le menu' : 'Réduire le menu'}
          >
            {collapsed ? (
              <PanelLeft className="h-[18px] w-[18px]" aria-hidden />
            ) : (
              <>
                <PanelLeftClose className="h-[18px] w-[18px]" aria-hidden />
                <span className="text-xs font-medium">Réduire</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  )
}
