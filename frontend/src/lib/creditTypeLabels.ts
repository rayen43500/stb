export const CREDIT_TYPE_LABELS: Record<string, string> = {
  CONSO: 'Consommation',
  IMMOBILIER: 'Immobilier',
  VEHICULE: 'Véhicule',
  AUTRE: 'Autre',
}

export function creditTypeLabel(code?: string): string {
  if (!code) return '—'
  return CREDIT_TYPE_LABELS[code] || code
}
