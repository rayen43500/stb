import type { Role } from '../types'

export const roleLabelFr: Record<Role, string> = {
  CLIENT: 'Espace client',
  AGENT_BANCAIRE: 'Agent bancaire',
  CHEF_AGENCE: "Chef d'agence",
  ADMIN: 'Administrateur',
}

export const roleMission: Record<Role, string> = {
  CLIENT: 'Gérez vos demandes de crédit, pièces jointes et suivi de statut.',
  AGENT_BANCAIRE: 'Traitez les dossiers, enregistrez vos analyses et faites avancer le workflow.',
  CHEF_AGENCE: "Validez les dossiers au niveau agence avant l'étape comité.",
  ADMIN: "Supervisez les utilisateurs, l'activité et l'ensemble des dossiers.",
}
