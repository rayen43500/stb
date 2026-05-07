/** Couleurs cohérentes avec le workflow crédit (badges, filtres). */
export function statusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    BROUILLON: 'bg-slate-100 text-slate-800 ring-slate-200',
    SOUMIS: 'bg-sky-50 text-sky-900 ring-sky-200',
    EN_ANALYSE: 'bg-amber-50 text-amber-900 ring-amber-200',
    EN_VALIDATION_CHEF: 'bg-indigo-50 text-indigo-900 ring-indigo-200',
    EN_VALIDATION_COMITE: 'bg-violet-50 text-violet-900 ring-violet-200',
    APPROUVÉ: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
    REFUSÉ: 'bg-red-50 text-red-900 ring-red-200',
    À_MODIFIER: 'bg-orange-50 text-orange-900 ring-orange-200',
  }
  return map[status] || 'bg-slate-100 text-slate-700 ring-slate-200'
}

export const STATUS_LABELS_FR: Record<string, string> = {
  BROUILLON: 'Brouillon',
  SOUMIS: 'Soumis',
  EN_ANALYSE: 'En analyse',
  EN_VALIDATION_CHEF: 'Validation chef',
  EN_VALIDATION_COMITE: 'Validation comité',
  APPROUVÉ: 'Approuvé',
  REFUSÉ: 'Refusé',
  À_MODIFIER: 'À modifier',
}

export function statusLabelFr(status: string): string {
  return STATUS_LABELS_FR[status] || status
}
