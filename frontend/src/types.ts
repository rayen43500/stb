export type Role =
  | 'CLIENT'
  | 'AGENT_BANCAIRE'
  | 'CHEF_AGENCE'
  | 'COMITE_CREDIT'
  | 'ADMIN'

export type SafeUser = {
  id: string
  email: string
  role: Role
  firstName?: string
  lastName?: string
  phone?: string
  clientProfile?: {
    monthlyIncome?: number
    monthlyCharges?: number
    contractType?: string
    seniorityMonths?: number
    priorDefaults?: number
    bankingIncidents?: number
  }
}
