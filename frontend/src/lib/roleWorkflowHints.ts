import type { Role } from '../types'

/** Rappel des transitions possibles (aligné sur le backend workflow). */
export function roleTransitionHints(role: Role): string[] {
  switch (role) {
    case 'CLIENT':
      return [
        'Depuis BROUILLON ou À_MODIFIER : vous pouvez soumettre le dossier (SOUMIS).',
        'Ajoutez des pièces et un commentaire à chaque étape importante.',
      ]
    case 'AGENT_BANCAIRE':
      return [
        'SOUMIS → EN_ANALYSE (démarrer l’analyse et le scoring)',
        'EN_ANALYSE → EN_VALIDATION_CHEF ou À_MODIFIER (transmission au chef uniquement après analyse)',
      ]
    case 'CHEF_AGENCE':
      return [
        'EN_VALIDATION_CHEF → EN_VALIDATION_COMITE, APPROUVÉ, REFUSÉ ou À_MODIFIER',
      ]
    case 'ADMIN':
      return ['Tous les changements de statut sont autorisés (supervision et démo).']
    default:
      return []
  }
}
