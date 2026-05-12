/** Logique métier — vue d’ensemble client (KPI + étape workflow). */

export type CreditLite = {
  _id: string
  status: string
  amount: number
  creditType?: string
  updatedAt: string
}

/** Étapes affichées à l’accueil (parcours crédit). */
export const CLIENT_WORKFLOW_STEPS = [
  { step: 1, key: 'SIM', label: 'Simulation', desc: 'Estimer mensualité' },
  { step: 2, key: 'ASK', label: 'Demande', desc: 'Créer & soumettre' },
  { step: 3, key: 'DOC', label: 'Documents', desc: 'Pièces & compléments' },
  { step: 4, key: 'VAL', label: 'Validation', desc: 'Banque & analyse' },
  { step: 5, key: 'OUT', label: 'Décision', desc: 'Accord ou suite' },
] as const

/** Déduit l’étape par défaut du workflow à partir du statut dossier. */
export function workflowStageFromStatus(status: string): number {
  switch (status) {
    case 'BROUILLON':
      return 2
    case 'À_MODIFIER':
      return 3
    case 'SOUMIS':
      return 3
    case 'EN_ANALYSE':
      return 4
    case 'EN_VALIDATION_CHEF':
    case 'EN_VALIDATION_COMITE':
      return 4
    case 'APPROUVÉ':
    case 'REFUSÉ':
      return 5
    default:
      return 2
  }
}

export type ClientKpis = {
  total: number
  enCircuit: number
  approuves: number
  actionsRequises: number
  brouillons: number
  cetteSemaine: number
}

export function aggregateClientKpis(credits: CreditLite[]): ClientKpis {
  const now = Date.now()
  const weekMs = 7 * 24 * 60 * 60 * 1000
  let enCircuit = 0
  let approuves = 0
  let actionsRequises = 0
  let brouillons = 0
  let cetteSemaine = 0

  for (const c of credits) {
    if (c.status !== 'APPROUVÉ' && c.status !== 'REFUSÉ') enCircuit += 1
    if (c.status === 'APPROUVÉ') approuves += 1
    if (c.status === 'À_MODIFIER') actionsRequises += 1
    if (c.status === 'BROUILLON') brouillons += 1
    const t = new Date(c.updatedAt).getTime()
    if (now - t <= weekMs) cetteSemaine += 1
  }

  return {
    total: credits.length,
    enCircuit,
    approuves,
    actionsRequises,
    brouillons,
    cetteSemaine,
  }
}

/** Dossier prioritaire pour l’indicateur d’étape : le plus récent hors brouillon, sinon le plus récent. */
export function pickFocusCredit(credits: CreditLite[]): CreditLite | null {
  if (!credits.length) return null
  const sorted = [...credits].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  const nonDraft = sorted.find((c) => c.status !== 'BROUILLON')
  return nonDraft ?? sorted[0]
}
