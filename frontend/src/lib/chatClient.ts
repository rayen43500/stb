import { api } from './api'

export type ChatLink = { label: string; path: string }
export type Suggestion = { label: string; query: string }

export type ChatResponse = {
  reply: string
  suggestions?: Suggestion[]
  links?: ChatLink[]
  meta?: {
    scoring?: { score?: number; decision?: string; category?: string }
    simulation?: { monthlyPayment?: number; debtRatioPercent?: number | null }
  }
}

export function fallbackChatReply(text: string): ChatResponse {
  const t = text.toLowerCase()
  if (t.includes('simul')) {
    return {
      reply: 'Ouvrez la page Simulation : montant, durée, taux, revenus et charges.',
      links: [{ label: 'Simulateur', path: '/simulation' }],
    }
  }
  if (t.includes('dossier') || t.includes('suivi')) {
    return {
      reply: 'Connectez-vous puis ouvrez Mes dossiers pour suivre les statuts.',
      links: [{ label: 'Dossiers', path: '/dossiers' }],
    }
  }
  if (t.includes('score') || t.includes('risque')) {
    return {
      reply:
        'Le scoring combine endettement, contrat et historique. Donnez un exemple chiffré (montant, durée, revenus) pour un calcul automatique.',
      suggestions: [
        { label: 'Exemple 20k / 5 ans', query: 'crédit de 20000 sur 5 ans revenus 3200 charges 900' },
      ],
      links: [{ label: 'Aide', path: '/assistant' }],
    }
  }
  return {
    reply:
      'Indiquez un sujet (simulation, dossier) ou une phrase avec montant, durée et revenus pour lancer simulation + scoring.',
    suggestions: [
      { label: 'Test scoring', query: 'crédit de 20000 sur 5 ans revenus 3200 charges 900' },
      { label: 'FAQ cycle', query: 'cycle du dossier' },
    ],
    links: [{ label: 'Simulation', path: '/simulation' }],
  }
}

/** Appelle POST /api/chat/message (réponse brute ; l’UI peut formater badges / pied de page). */
export async function postChatMessage(text: string): Promise<ChatResponse> {
  const { data } = await api.post<ChatResponse>('/chat/message', { text })
  return data
}
