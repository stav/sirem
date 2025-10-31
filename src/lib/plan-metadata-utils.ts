import { Database } from './supabase-types'
import { plansMetadataSchema } from '@/schema/plans-metadata-schema'

// Base plan type from database
export type Plan = Database['public']['Tables']['plans']['Row']
export type PlanInsert = Database['public']['Tables']['plans']['Insert']
export type PlanUpdate = Database['public']['Tables']['plans']['Update']

/**
 * Property type from schema sections
 */
type SchemaProperty = {
  key: string
  type: string
  format?: string
  label?: string
  description?: string
  enum?: readonly string[]
  minimum?: number
  maximum?: number
}

/**
 * Section type from schema
 */
type SchemaSection = {
  title: string
  description: string
  properties?: SchemaProperty[]
}

/**
 * Extract all properties from all sections into a flat object
 */
export function getAllProperties(): Record<string, SchemaProperty> {
  const properties: Record<string, SchemaProperty> = {}

  if (plansMetadataSchema.sections && Array.isArray(plansMetadataSchema.sections)) {
    // Type assertion needed because schema uses 'as const' which creates very specific literal types
    const sections = plansMetadataSchema.sections as unknown as SchemaSection[]
    sections.forEach((section: SchemaSection) => {
      if (section.properties && Array.isArray(section.properties)) {
        section.properties.forEach((prop: SchemaProperty) => {
          if (prop.key) {
            properties[prop.key] = prop
          }
        })
      }
    })
  }

  return properties
}

/**
 * PlanMetadata interface - dynamically generated from schema
 *
 * This interface is automatically generated from the JSON Schema properties.
 * Since properties are now nested within sections, we use a Record type
 * that allows any string keys with appropriate value types.
 *
 * 🔄 DYNAMIC: New fields added to the schema automatically appear in this interface.
 * ✅ SINGLE SOURCE OF TRUTH: Schema drives both runtime validation and compile-time types.
 */
export type PlanMetadata = {
  [key: string]: string | number | null | undefined
}

// Helper type for plan with typed metadata
export interface PlanWithMetadata extends Omit<Plan, 'metadata'> {
  metadata: PlanMetadata | null
}

// Helper functions for safe metadata access
export function getMetadataValue(plan: Plan, key: string): unknown {
  if (!plan.metadata || typeof plan.metadata !== 'object') return null
  const metadata = plan.metadata as Record<string, unknown>
  return metadata[key] ?? null
}

export function getMetadataNumber(plan: Plan, key: string): number | null {
  const value = getMetadataValue(plan, key)
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? null : parsed
  }
  return null
}

export function getMetadataString(plan: Plan, key: string): string | null {
  const value = getMetadataValue(plan, key)
  return typeof value === 'string' ? value : null
}

export function getMetadataDate(plan: Plan, key: string): string | null {
  const value = getMetadataValue(plan, key)
  return typeof value === 'string' ? value : null
}

/**
 * Dynamically generate getter functions from schema
 * This eliminates hardcoded field definitions by using the schema as the source of truth
 */
export const getPlanMetadata = (() => {
  const getters: Record<string, (plan: Plan) => unknown> = {}
  const properties = getAllProperties()

  // Generate getters for all schema properties
  Object.entries(properties).forEach(([fieldName, fieldSchema]) => {
    const fieldType = fieldSchema.type

    // Choose appropriate getter based on field type
    if (fieldType === 'string' && 'format' in fieldSchema && fieldSchema.format === 'date') {
      getters[fieldName] = (plan: Plan) => getMetadataDate(plan, fieldName)
    } else if (fieldType === 'number') {
      getters[fieldName] = (plan: Plan) => getMetadataNumber(plan, fieldName)
    } else {
      getters[fieldName] = (plan: Plan) => getMetadataString(plan, fieldName)
    }
  })

  return getters
})() as Record<string, (plan: Plan) => number | string | null>

/**
 * Get default/empty metadata form data - dynamically generated from schema
 * This function creates a form object with only metadata fields set to empty values
 * Core database fields are handled separately in the form state
 */
export function getDefaultMetadataFormData(): Record<string, unknown> {
  const formData: Record<string, unknown> = {}
  const properties = getAllProperties()

  // Dynamically generate metadata fields from schema
  Object.keys(properties).forEach((fieldName) => {
    formData[fieldName] = ''
  })

  return formData
}

/**
 * Get default/empty form data (DEPRECATED - use getDefaultMetadataFormData instead)
 * This function creates a form object with all fields set to empty values
 */
export function getDefaultFormData(): Record<string, unknown> {
  const formData: Record<string, unknown> = {}

  // Core database fields with default values
  formData.name = ''
  formData.type_network = ''
  formData.type_extension = ''
  formData.type_snp = ''
  formData.type_program = ''
  formData.carrier = ''
  formData.plan_year = new Date().getUTCFullYear().toString()
  formData.cms_contract_number = ''
  formData.cms_plan_number = ''
  formData.cms_geo_segment = ''
  formData.counties = ''

  // Add metadata fields
  const metadataData = getDefaultMetadataFormData()
  Object.assign(formData, metadataData)

  return formData
}

/**
 * Dynamically populate form data from plan object
 * This function uses the schema to determine which fields to populate
 */
export function populateFormFromPlan(plan: Plan): Record<string, unknown> {
  const formData: Record<string, unknown> = {}

  // Core database fields (always present)
  formData.name = String(plan.name ?? '')
  formData.type_network = plan.type_network ?? ''
  formData.type_extension = plan.type_extension ?? ''
  formData.type_snp = plan.type_snp ?? ''
  formData.type_program = plan.type_program ?? ''
  formData.carrier = plan.carrier ?? ''
  formData.plan_year = plan.plan_year != null ? String(plan.plan_year) : ''
  formData.cms_contract_number = String(plan.cms_contract_number ?? '')
  formData.cms_plan_number = String(plan.cms_plan_number ?? '')
  formData.cms_geo_segment = String(plan.cms_geo_segment ?? '')
  formData.counties = Array.isArray(plan.counties) ? plan.counties.join(', ') : String(plan.counties ?? '')

  // Metadata fields - dynamically populate based on what's in the metadata
  if (plan.metadata) {
    const metadata = plan.metadata as Record<string, unknown>
    const properties = getAllProperties()

    // Get all possible metadata fields from the schema
    const metadataFields = Object.keys(properties)

    // Populate each field if it exists in the metadata
    metadataFields.forEach((field) => {
      if (metadata[field] !== undefined && metadata[field] !== null) {
        formData[field] = String(metadata[field])
      } else {
        formData[field] = ''
      }
    })
  }

  return formData
}

/**
 * Build complete plan data object from form data
 * This function builds both core database fields and metadata
 */
export function buildPlanDataFromForm(formData: Record<string, unknown>): {
  name: string
  type_network: string | null
  type_extension: string | null
  type_snp: string | null
  type_program: string | null
  carrier: string | null
  plan_year: number | null
  cms_contract_number: string | null
  cms_plan_number: string | null
  cms_geo_segment: string | null
  counties: string[] | null
  metadata: PlanMetadata | null
} {
  // Build metadata object from form fields
  const metadata = buildMetadata(formData)

  // Build core database fields
  return {
    name: String(formData.name || ''),
    type_network: (formData.type_network as string) || null,
    type_extension: (formData.type_extension as string) || null,
    type_snp: (formData.type_snp as string) || null,
    type_program: (formData.type_program as string) || null,
    carrier: (formData.carrier as string) || null,
    plan_year: formData.plan_year ? Number(formData.plan_year) : null,
    cms_contract_number: (formData.cms_contract_number as string) || null,
    cms_plan_number: (formData.cms_plan_number as string) || null,
    cms_geo_segment: (formData.cms_geo_segment as string) || null,
    counties: formData.counties
      ? String(formData.counties)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : null,
    metadata: Object.keys(metadata).length > 0 ? metadata : null,
  }
}

/**
 * Build metadata object from form data - dynamically generated from schema
 * This function eliminates hardcoded field mappings by using the schema as the source of truth
 */
export function buildMetadata(data: Record<string, unknown>): PlanMetadata {
  const metadata: PlanMetadata = {}
  const properties = getAllProperties()

  // Dynamically process all schema properties
  Object.keys(properties).forEach((fieldName) => {
    const value = data[fieldName]
    if (value !== null && value !== undefined && value !== '') {
      // Ensure value is assignable to PlanMetadata type
      if (typeof value === 'string' || typeof value === 'number') {
        metadata[fieldName] = value
      } else if (typeof value === 'object') {
        // Skip objects - they shouldn't be in metadata based on schema
        return
      } else {
        // Convert other types to string
        metadata[fieldName] = String(value)
      }
    }
  })

  return metadata
}

// Helper to extract metadata for form display
export function extractMetadataForForm(plan: Plan): Record<string, unknown> {
  const formData: Record<string, unknown> = {}

  // Core fields (these stay as columns)
  formData.name = plan.name
  formData.carrier = plan.carrier
  formData.plan_year = plan.plan_year
  formData.cms_contract_number = plan.cms_contract_number
  formData.cms_plan_number = plan.cms_plan_number
  formData.cms_geo_segment = plan.cms_geo_segment
  formData.counties = plan.counties

  // Normalized plan type fields
  formData.type_network = plan.type_network
  formData.type_extension = plan.type_extension
  formData.type_snp = plan.type_snp
  formData.type_program = plan.type_program

  // Metadata fields
  if (plan.metadata) {
    const metadata = plan.metadata as Record<string, unknown>
    Object.entries(metadata).forEach(([key, value]) => {
      formData[key] = value
    })
  }

  return formData
}

// Premium calculation utilities for LIS scenarios
export const premiumCalculations = {
  /**
   * Calculate the effective monthly premium based on LIS status
   * @param plan - The plan object
   * @param hasExtraHelp - Whether the beneficiary has LIS
   * @returns The effective monthly premium amount
   */
  getEffectivePremium: (plan: Plan, hasExtraHelp: boolean = false): number | null => {
    if (hasExtraHelp) {
      // If they have Extra Help, use the reduced premium (typically $0)
      return Number(getPlanMetadata.premium_monthly_with_extra_help(plan)) || 0
    } else {
      // Standard premium - use the regular monthly premium
      return Number(getPlanMetadata.premium_monthly(plan)) || 0
    }
  },

  /**
   * Get the premium range for display purposes
   * @param plan - The plan object
   * @returns Object with min and max premium values
   */
  getPremiumRange: (plan: Plan): { min: number | null; max: number | null } => {
    const standardPremium = Number(getPlanMetadata.premium_monthly(plan)) || 0
    const extraHelpPremium = Number(getPlanMetadata.premium_monthly_with_extra_help(plan)) || 0

    return {
      min: extraHelpPremium ?? 0,
      max: standardPremium,
    }
  },

  /**
   * Calculate the effective medical deductible based on Medicaid status
   * @param plan - The plan object
   * @param hasMedicaidCostSharing - Whether the beneficiary has Medicaid cost-sharing assistance
   * @returns The effective medical deductible amount
   */
  getEffectiveMedicalDeductible: (plan: Plan, hasMedicaidCostSharing: boolean = false): number | null => {
    if (hasMedicaidCostSharing) {
      // If they have Medicaid cost-sharing, use the reduced deductible (typically $0)
      return Number(getPlanMetadata.medical_deductible_with_medicaid(plan)) || 0
    } else {
      // Standard deductible - use the regular medical deductible
      return Number(getPlanMetadata.medical_deductible(plan)) || 0
    }
  },

  /**
   * Get the medical deductible range for display purposes
   * @param plan - The plan object
   * @returns Object with min and max deductible values
   */
  getMedicalDeductibleRange: (plan: Plan): { min: number | null; max: number | null } => {
    const standardDeductible = Number(getPlanMetadata.medical_deductible(plan)) || 0
    const medicaidDeductible = Number(getPlanMetadata.medical_deductible_with_medicaid(plan)) || 0

    return {
      min: medicaidDeductible ?? 0,
      max: standardDeductible,
    }
  },
}
