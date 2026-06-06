import type { LucideIcon } from 'lucide-react'
import {
  Bell,
  Calculator,
  FilePlus2,
  FileText,
  FolderKanban,
  History,
  Home,
  MessageSquare,
  Shield,
} from 'lucide-react'
import type { Role } from '../../types'

export type SidebarLink = {
  to: string
  label: string
  Icon: LucideIcon
  end?: boolean
}

const staffRest: SidebarLink[] = [
  { to: '/historique', label: 'Historique', Icon: History },
  { to: '/notifications', label: 'Notifications', Icon: Bell },
  { to: '/assistant', label: 'Assistant', Icon: MessageSquare },
]

export function getSidebarLinks(role: Role): SidebarLink[] {
  const core: SidebarLink[] = [
    { to: '/', label: 'Accueil', Icon: Home, end: true },
  ]

  if (role === 'CLIENT') {
    return [
      ...core,
      { to: '/demande', label: 'Nouvelle demande', Icon: FilePlus2 },
      { to: '/dossiers', label: 'Mes dossiers', Icon: FolderKanban },
      { to: '/documents', label: 'Documents', Icon: FileText },
      { to: '/simulation', label: 'Simulation', Icon: Calculator },
      ...staffRest,
    ]
  }

  if (role === 'CHEF_AGENCE') {
    return [
      ...core,
      { to: '/dossiers', label: 'Dossiers', Icon: FolderKanban },
      { to: '/chef/comptes', label: 'Gestion agence', Icon: Shield },
      { to: '/documents', label: 'Documents', Icon: FileText },
      ...staffRest,
    ]
  }

  if (role === 'ADMIN') {
    return [
      ...core,
      { to: '/dossiers', label: 'Tous les dossiers', Icon: FolderKanban },
      { to: '/chef/comptes', label: 'Administration', Icon: Shield },
      { to: '/documents', label: 'Documents', Icon: FileText },
      ...staffRest,
    ]
  }

  // AGENT_BANCAIRE
  return [
    ...core,
    { to: '/dossiers', label: 'Dossiers', Icon: FolderKanban },
    //{ to: '/documents', label: 'Vérification', Icon: FileText },
    ...staffRest,
  ]
}
