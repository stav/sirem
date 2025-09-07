import { RoleConfigs, RoleType, RoleConfig } from '@/types/roles'

export const roleConfig: RoleConfigs = {
  medicare_client: {
    label: 'Medicare Client',
    icon: '🏥',
    color: 'bg-blue-100 text-blue-800',
    fields: [
      { key: 'gender', label: 'Gender', type: 'select', options: ['male', 'female', 'other'] },
      { key: 'height', label: 'Height', type: 'text' },
      { key: 'weight', label: 'Weight', type: 'text' },
      { key: 'has_medicaid', label: 'Has Medicaid', type: 'checkbox' },
      { key: 'part_a_effective', label: 'Part A Effective', type: 'date' },
      { key: 'part_b_effective', label: 'Part B Effective', type: 'date' },
      {
        key: 'subsidy_level',
        label: 'Subsidy Level',
        type: 'select',
        options: ['Yes', 'No', 'Not Answered', "I Don't Know"],
      },
      {
        key: 'marital_status',
        label: 'Marital Status',
        type: 'select',
        options: ['Single', 'Married', 'Divorced', 'Widowed', 'Unknown'],
      },
      { key: 'is_tobacco_user', label: 'Tobacco User', type: 'checkbox' },
      { key: 'medicare_beneficiary_id', label: 'Medicare Beneficiary ID', type: 'text' },
    ],
  },
  referral_partner: {
    label: 'Referral Partner',
    icon: '🤝',
    color: 'bg-green-100 text-green-800',
    fields: [
      { key: 'company', label: 'Company', type: 'text' },
      {
        key: 'referral_type',
        label: 'Referral Type',
        type: 'select',
        options: ['Library', 'Healthcare', 'Community', 'Other'],
      },
      { key: 'commission_rate', label: 'Commission Rate', type: 'text' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  tire_shop: {
    label: 'Tire Shop',
    icon: '🚗',
    color: 'bg-orange-100 text-orange-800',
    fields: [
      { key: 'shop_name', label: 'Shop Name', type: 'text' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'services', label: 'Services', type: 'textarea' },
      { key: 'contact_person', label: 'Contact Person', type: 'text' },
    ],
  },
  dentist: {
    label: 'Dentist',
    icon: '🦷',
    color: 'bg-purple-100 text-purple-800',
    fields: [
      { key: 'practice_name', label: 'Practice Name', type: 'text' },
      { key: 'specialty', label: 'Specialty', type: 'text' },
      { key: 'accepts_medicaid', label: 'Accepts Medicaid', type: 'checkbox' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  other: {
    label: 'Other',
    icon: '👤',
    color: 'bg-gray-100 text-gray-800',
    fields: [
      { key: 'role_description', label: 'Role Description', type: 'text' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
}

// Utility functions for role management
export const getRoleConfig = (roleType: RoleType): RoleConfig => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (roleConfig as any)[roleType] || (roleConfig as any).other
}

export const getAllRoleTypes = (): RoleType[] => {
  return Object.keys(roleConfig) as RoleType[]
}

export const getRoleDisplayInfo = (roleType: RoleType) => {
  const config = getRoleConfig(roleType)
  return {
    label: config.label,
    icon: config.icon,
    color: config.color,
  }
}

export const getRoleFields = (roleType: RoleType) => {
  return getRoleConfig(roleType).fields
}

export const isValidRoleType = (roleType: string): roleType is RoleType => {
  return roleType in roleConfig
}
