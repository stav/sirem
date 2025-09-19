import { RoleConfigs, RoleType, RoleConfig } from '@/types/roles'
import { Shield, User, Stethoscope, Wrench, Presentation } from 'lucide-react'

export const roleConfig: RoleConfigs = {
  medicare_client: {
    label: 'Medicare Client',
    iconComponent: Shield,
    color: 'bg-blue-100 text-blue-800',
    fields: [
      {
        key: 'gender',
        label: 'Gender',
        type: 'select',
        options: ['male', 'female'],
      },
      {
        key: 'medicare_beneficiary_id',
        label: 'Medicare Beneficiary ID',
        type: 'text',
      },
      { key: 'part_a_effective', label: 'Part A Effective', type: 'date' },
      { key: 'part_b_effective', label: 'Part B Effective', type: 'date' },
      { key: 'height', label: 'Height', type: 'text' },
      { key: 'weight', label: 'Weight', type: 'text' },
      {
        key: 'has_medicaid',
        label: 'Has Medicaid',
        type: 'select',
        options: ['Yes', 'No'],
      },
      {
        key: 'subsidy_level',
        label: 'Subsidy Level',
        type: 'select',
        options: ['Yes', 'No', 'LIS', 'LIS-1', 'LIS-2', 'LIS-3'],
      },
      {
        key: 'marital_status',
        label: 'Marital Status',
        type: 'select',
        options: ['Single', 'Married', 'Divorced', 'Widowed', 'Unknown'],
      },
      {
        key: 'is_tobacco_user',
        label: 'Tobacco User',
        type: 'select',
        options: ['Yes', 'No'],
      },
    ],
  },
  referral_partner: {
    label: 'Referral Partner',
    iconComponent: User,
    color: 'bg-green-100 text-green-800',
    fields: [
      { key: 'company', label: 'Company', type: 'text', placeholder: 'Enter company name' },
      {
        key: 'referral_type',
        label: 'Referral Type',
        type: 'select',
        options: ['Library', 'Healthcare', 'Community', 'Other'],
        placeholder: 'Select Referral Type',
      },
      { key: 'commission_rate', label: 'Commission Rate', type: 'text', placeholder: 'Enter commission rate' },
      { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Enter notes' },
    ],
  },
  presentation_partner: {
    label: 'Presentation Partner',
    iconComponent: Presentation,
    color: 'bg-indigo-100 text-indigo-800',
    fields: [
      { key: 'organization_name', label: 'Organization Name', type: 'text', placeholder: 'Enter organization name' },
      {
        key: 'presentation_type',
        label: 'Presentation Type',
        type: 'select',
        options: ['Educational', 'Marketing', 'Informational', 'Training', 'Other'],
        placeholder: 'Select Presentation Type',
      },
      { key: 'contact_person', label: 'Contact Person', type: 'text', placeholder: 'Enter contact person' },
      {
        key: 'presentation_topics',
        label: 'Presentation Topics',
        type: 'textarea',
        placeholder: 'Enter presentation topics',
      },
      {
        key: 'audience_size',
        label: 'Audience Size',
        type: 'select',
        options: ['Small (1-10)', 'Medium (11-50)', 'Large (51-100)', 'Very Large (100+)'],
        placeholder: 'Select Audience Size',
      },
      { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Enter notes' },
    ],
  },
  tire_shop: {
    label: 'Tire Shop',
    iconComponent: Wrench,
    color: 'bg-orange-100 text-orange-800',
    fields: [
      { key: 'shop_name', label: 'Shop Name', type: 'text', placeholder: 'Enter shop name' },
      { key: 'location', label: 'Location', type: 'text', placeholder: 'Enter location' },
      { key: 'services', label: 'Services', type: 'textarea', placeholder: 'Enter services offered' },
      { key: 'contact_person', label: 'Contact Person', type: 'text', placeholder: 'Enter contact person' },
    ],
  },
  dentist: {
    label: 'Dentist',
    iconComponent: Stethoscope,
    color: 'bg-purple-100 text-purple-800',
    fields: [
      { key: 'practice_name', label: 'Practice Name', type: 'text', placeholder: 'Enter practice name' },
      { key: 'specialty', label: 'Specialty', type: 'text', placeholder: 'Enter specialty' },
      {
        key: 'accepts_medicaid',
        label: 'Accepts Medicaid',
        type: 'select',
        options: ['Yes', 'No'],
        placeholder: 'Select Medicaid Acceptance',
      },
      { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Enter notes' },
    ],
  },
  other: {
    label: 'Other',
    iconComponent: User,
    color: 'bg-gray-100 text-gray-800',
    fields: [
      { key: 'role_description', label: 'Role Description', type: 'text', placeholder: 'Enter role description' },
      { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Enter notes' },
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
    color: config.color,
  }
}

export const getRoleFields = (roleType: RoleType) => {
  return getRoleConfig(roleType).fields
}

export const isValidRoleType = (roleType: string): roleType is RoleType => {
  return roleType in roleConfig
}

// Get icon component for a role type
export const getRoleIcon = (roleType: RoleType): React.ComponentType<{ className?: string }> => {
  return getRoleConfig(roleType).iconComponent
}

// Icon mapping for role types (extracted from roleConfig for convenience)
export const roleIconMap: Record<RoleType, React.ComponentType<{ className?: string }>> = {
  medicare_client: getRoleIcon('medicare_client'),
  referral_partner: getRoleIcon('referral_partner'),
  tire_shop: getRoleIcon('tire_shop'),
  dentist: getRoleIcon('dentist'),
  presentation_partner: getRoleIcon('presentation_partner'),
  other: getRoleIcon('other'),
}
