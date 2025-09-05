export type RoleType =
  | 'medicare_client'
  | 'referral_partner'
  | 'tire_shop'
  | 'dentist'
  | 'presentation_partner'
  | 'other'

export interface RoleField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'date' | 'email' | 'number'
  options?: string[]
  placeholder?: string
  required?: boolean
}

export interface RoleConfig {
  label: string
  iconComponent: React.ComponentType<{ className?: string }>
  color: string
  fields: RoleField[]
}

export type RoleConfigs = {
  [K in RoleType]: RoleConfig
}

// Role data interfaces for type safety
export interface MedicareClientData {
  gender?: string
  height?: string
  weight?: string
  has_medicaid?: string
  part_a_effective?: string
  part_b_effective?: string
  subsidy_level?: string
  marital_status?: string
  is_tobacco_user?: string
  medicare_beneficiary_id?: string
}

export interface ReferralPartnerData {
  company?: string
  referral_type?: string
  commission_rate?: string
  notes?: string
}

export interface TireShopData {
  shop_name?: string
  location?: string
  services?: string
  contact_person?: string
}

export interface DentistData {
  practice_name?: string
  specialty?: string
  accepts_medicaid?: string
  notes?: string
}

export interface PresentationPartnerData {
  organization_name?: string
  presentation_type?: string
  contact_person?: string
  presentation_topics?: string
  audience_size?: string
  notes?: string
}

export interface OtherRoleData {
  role_description?: string
  notes?: string
}

export type RoleData =
  | MedicareClientData
  | ReferralPartnerData
  | TireShopData
  | DentistData
  | PresentationPartnerData
  | OtherRoleData
