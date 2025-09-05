import { RoleType, RoleField } from '@/types/roles'
import { getRoleConfig, roleConfig } from './role-config'

/**
 * Validates role data against the role configuration
 */
export const validateRoleData = (
  roleType: RoleType,
  data: Record<string, unknown>
): { isValid: boolean; errors: string[] } => {
  const config = getRoleConfig(roleType)
  const errors: string[] = []

  // Check required fields (you can add required field logic here if needed)
  // For now, all fields are optional based on the current implementation

  // Validate field types
  config.fields.forEach((field) => {
    const value = data[field.key]
    if (value !== undefined && value !== null && value !== '') {
      switch (field.type) {
        case 'checkbox':
          if (typeof value !== 'boolean') {
            errors.push(`${field.label} must be a boolean value`)
          }
          break
        case 'select':
          if (field.options && !field.options.includes(String(value))) {
            errors.push(`${field.label} must be one of: ${field.options.join(', ')}`)
          }
          break
        case 'date':
          if (typeof value === 'string' && isNaN(Date.parse(value))) {
            errors.push(`${field.label} must be a valid date`)
          }
          break
      }
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Formats role data for display
 */
export const formatRoleData = (roleType: RoleType, data: Record<string, unknown>): Record<string, string> => {
  const config = getRoleConfig(roleType)
  const formatted: Record<string, string> = {}

  config.fields.forEach((field) => {
    const value = data[field.key]
    if (value !== undefined && value !== null && value !== '') {
      switch (field.type) {
        case 'checkbox':
          formatted[field.label] = value ? 'Yes' : 'No'
          break
        case 'date':
          if (typeof value === 'string') {
            try {
              formatted[field.label] = new Date(value).toLocaleDateString()
            } catch {
              formatted[field.label] = value
            }
          } else {
            formatted[field.label] = String(value)
          }
          break
        default:
          formatted[field.label] = String(value)
      }
    }
  })

  return formatted
}

/**
 * Gets the primary role for a contact (if any)
 */
export const getPrimaryRole = (roles: Array<{ role_type: RoleType; is_primary?: boolean }>): RoleType | null => {
  const primaryRole = roles.find((role) => role.is_primary)
  return primaryRole ? primaryRole.role_type : null
}

/**
 * Sorts roles by priority (primary first, then by creation order)
 */
export const sortRolesByPriority = <T extends { is_primary?: boolean; created_at?: string }>(roles: T[]): T[] => {
  return [...roles].sort((a, b) => {
    // Primary role first
    if (a.is_primary && !b.is_primary) return -1
    if (!a.is_primary && b.is_primary) return 1

    // Then by creation date (newest first)
    if (a.created_at && b.created_at) {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }

    return 0
  })
}

/**
 * Checks if a role type has specific fields
 */
export const hasRoleField = (roleType: RoleType, fieldKey: string): boolean => {
  const config = getRoleConfig(roleType)
  return config.fields.some((field) => field.key === fieldKey)
}

/**
 * Gets all unique field keys across all role types
 */
export const getAllFieldKeys = (): string[] => {
  const allKeys = new Set<string>()
  Object.values(roleConfig).forEach((config) => {
    config.fields.forEach((field: RoleField) => allKeys.add(field.key))
  })
  return Array.from(allKeys)
}
