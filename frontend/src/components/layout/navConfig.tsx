import type { LucideIcon } from 'lucide-react'
import {
  Bell,
  Calculator,
  FilePlus2,
  FileText,
  FolderKanban,
  History,
  Home,
  LayoutDashboard,
  MessageSquare,
  Shield,
  User,
} from 'lucide-react'
import type { Role } from '../../types'

export type SidebarLink = {
  to: string
  label: string
  Icon: LucideIcon
  end?: boolean
}

/** Navigation principale application — workflow-first, dense. */
export function getSidebarLinks(role: Role): SidebarLink[] {
  const core: SidebarLink[] = [
    { to: '/', label: 'Accueil', Icon: Home, end: true },
    { to: '/dashboard', label: 'Tableau de bord', Icon: LayoutDashboard },
  ]

  if (role === 'CLIENT') {
    return [
      ...core,
      { to: '/demande', label: 'Nouvelle demande', Icon: FilePlus2 },
      { to: '/dossiers', label: 'Mes dossiers', Icon: FolderKanban },
      { to: '/documents', label: 'Documents', Icon: FileText },
      { to: '/historique', label: 'Historique', Icon: History },
      { to: '/notifications', label: 'Notifications', Icon: Bell },
      { to: '/simulation', label: 'Simulation', Icon: Calculator },
      { to: '/assistant', label: 'Assistant', Icon: MessageSquare },
      { to: '/compte', label: 'Paramètres', Icon: User },
    ]
  }

  const staffRest: SidebarLink[] = [
    { to: '/dossiers', label: 'Dossiers', Icon: FolderKanban },
    { to: '/documents', label: 'Documents', Icon: FileText },
    { to: '/historique', label: 'Historique', Icon: History },
    { to: '/notifications', label: 'Notifications', Icon: Bell },
    { to: '/simulation', label: 'Simulation', Icon: Calculator },
    { to: '/assistant', label: 'Assistant', Icon: MessageSquare },
    { to: '/compte', label: 'Paramètres', Icon: User },
  ]

  if (role === 'ADMIN') {
    return [
      ...core,
      { to: '/dossiers', label: 'Dossiers', Icon: FolderKanban },
      { to: '/documents', label: 'Documents', Icon: FileText },
      { to: '/historique', label: 'Historique', Icon: History },
      { to: '/notifications', label: 'Notifications', Icon: Bell },
      { to: '/admin', label: 'Administration', Icon: Shield },
      { to: '/simulation', label: 'Simulation', Icon: Calculator },
      { to: '/assistant', label: 'Assistant', Icon: MessageSquare },
      { to: '/compte', label: 'Paramètres', Icon: User },
    ]
  }

  return [...core, ...staffRest]
}
