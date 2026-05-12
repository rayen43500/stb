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
  addressLine1?: string
  addressLine2?: string
  city?: string
  postalCode?: string
  country?: string
  nationalId?: string
  staffProfile?: { agencyName?: string }
  hasAvatar?: boolean
  updatedAt?: string
  clientProfile?: {
    monthlyIncome?: number
    monthlyCharges?: number
    contractType?: string
    seniorityMonths?: number
    priorDefaults?: number
    bankingIncidents?: number
  }
}
