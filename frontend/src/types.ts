export type Role =
  | 'CLIENT'
  | 'AGENT_BANCAIRE'
  | 'CHEF_AGENCE'
  

export type SafeUser = {
  id: string
  email: string
  role: Role
  accountStatus?: 'PENDING' | 'ACTIVE' | 'REJECTED'
  dateOfBirth?: string
  matricule?: string
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
    maritalStatus?: string
    profession?: string
    employerName?: string
    monthlyIncome?: number
    monthlyCharges?: number
    existingCredits?: number
    additionalIncome?: number
    contractType?: string
    seniorityMonths?: number
    priorDefaults?: number
    bankingIncidents?: number
  }
}
