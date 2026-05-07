/** Affichage des montants en dinar tunisien (TND), 3 décimales (millimes). */
export function formatTnd(value: number | null | undefined, fractionDigits = 3): string {
  if (value == null || Number.isNaN(Number(value))) return '—'
  const n = Number(value)
  try {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(n)
  } catch {
    return `${n.toFixed(fractionDigits)} TND`
  }
}
