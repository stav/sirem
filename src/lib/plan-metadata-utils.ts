import { Database } from './supabase-types'
import { plansMetadataSchema } from '@/schema/plans-metadata-schema'
import { resolvePlanValue, type EligibilityContext, type ResolutionResult } from './plan-field-resolution'

// Base plan type from database
export type Plan = Database['public']['Tables']['plans']['Row']
export type PlanInsert = Database['public']['Tables']['plans']['Insert']
export type PlanUpdate = Database['public']['Tables']['plans']['Update']

const CORE_FORM_FIELDS = [
  'name',
  'type_network',
  'type_extension',
  'type_snp',
  'type_program',
  'carrier',
  'plan_year',
  'cms_contract_number',
  'cms_plan_number',
  'cms_geo_segment',
  'counties',
] as const

/**
 * Property type from schema sections
 */
type FieldCharacteristics = {
  concept?: string
  type?: string
  frequency?: string
  eligibility?: string | string[]
  unit?: string
  modifier?: string
  direction?: 'credit' | 'debit'
}

type FieldVariant = {
  key: string
  label: string
  description?: string
  tags?: string[]
  characteristics?: FieldCharacteristics
}

type SchemaProperty = {
  key: string
  type: string
  format?: string
  label?: string
  description?: string
  enum?: readonly string[]
  minimum?: number
  maximum?: number
  tags?: string[]
  characteristics?: FieldCharacteristics
  variants?: FieldVariant[]
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
 * Get all field keys expected by the schema (base fields + variants)
 */
export function getAllExpectedFieldKeys(): Set<string> {
  const keys = new Set<string>()
  const properties = getAllProperties()

  Object.values(properties).forEach((prop) => {
    keys.add(prop.key)
    if (prop.variants) {
      prop.variants.forEach((variant) => {
        keys.add(variant.key)
      })
    }
  })

  return keys
}

/**
 * Identify metadata fields that are not defined in the schema (legacy/custom fields)
 */
export function getLegacyFields(plan: Plan): Record<string, unknown> {
  if (!plan.metadata || typeof plan.metadata !== 'object') {
    return {}
  }

  const metadata = plan.metadata as Record<string, unknown>
  const expectedKeys = getAllExpectedFieldKeys()
  const legacyFields: Record<string, unknown> = {}

  Object.keys(metadata).forEach((key) => {
    if (!expectedKeys.has(key)) {
      legacyFields[key] = metadata[key]
    }
  })

  return legacyFields
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

export type ResolverInput = EligibilityContext | string | string[] | undefined

function normalizeResolverInput(context?: ResolverInput): EligibilityContext | undefined {
  if (!context) return undefined
  if (typeof context === 'string' || Array.isArray(context)) {
    return { eligibility: context }
  }
  if (typeof context === 'object') {
    return context
  }
  return undefined
}

// Helper functions for safe metadata access using resolver
export function getMetadataResolution(plan: Plan, key: string, context?: ResolverInput): ResolutionResult {
  const normalizedContext = normalizeResolverInput(context)
  return resolvePlanValue(plan, key, normalizedContext)
}

export function getMetadataValue(plan: Plan, key: string, context?: ResolverInput): unknown {
  const result = getMetadataResolution(plan, key, context)
  return result.value ?? null
}

export function getMetadataNumber(plan: Plan, key: string, context?: ResolverInput): number | null {
  const value = getMetadataValue(plan, key, context)
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? null : parsed
  }
  return null
}

export function getMetadataString(plan: Plan, key: string, context?: ResolverInput): string | null {
  const value = getMetadataValue(plan, key, context)
  return typeof value === 'string' ? value : null
}

export function getMetadataDate(plan: Plan, key: string, context?: ResolverInput): string | null {
  const value = getMetadataValue(plan, key, context)
  return typeof value === 'string' ? value : null
}

/**
 * Dynamically generate getter functions from schema
 * This eliminates hardcoded field definitions by using the schema as the source of truth
 */
export const getPlanMetadata = (() => {
  const getters: Record<string, (plan: Plan, context?: ResolverInput) => unknown> = {}
  const properties = getAllProperties()

  // Generate getters for all schema properties
  Object.entries(properties).forEach(([fieldName, fieldSchema]) => {
    const fieldType = fieldSchema.type

    // Choose appropriate getter based on field type
    if (fieldType === 'string' && 'format' in fieldSchema && fieldSchema.format === 'date') {
      getters[fieldName] = (plan: Plan, context?: ResolverInput) => getMetadataDate(plan, fieldName, context)
    } else if (fieldType === 'number') {
      getters[fieldName] = (plan: Plan, context?: ResolverInput) => getMetadataNumber(plan, fieldName, context)
    } else {
      getters[fieldName] = (plan: Plan, context?: ResolverInput) => getMetadataString(plan, fieldName, context)
    }

    // Generate getters for variant fields (inherit base type)
    if (fieldSchema.variants) {
      fieldSchema.variants.forEach((variant) => {
        if (fieldType === 'string' && fieldSchema.format === 'date') {
          getters[variant.key] = (plan: Plan, context?: ResolverInput) =>
            getMetadataDate(plan, variant.key, context)
        } else if (fieldType === 'number') {
          getters[variant.key] = (plan: Plan, context?: ResolverInput) =>
            getMetadataNumber(plan, variant.key, context)
        } else {
          getters[variant.key] = (plan: Plan, context?: ResolverInput) =>
            getMetadataString(plan, variant.key, context)
        }
      })
    }
  })

  return getters
})() as Record<string, (plan: Plan, context?: ResolverInput) => number | string | null>

/**
 * Get default/empty metadata form data - dynamically generated from schema
 * This function creates a form object with only metadata fields set to empty values
 * Core database fields are handled separately in the form state
 */
export function getDefaultMetadataFormData(): Record<string, unknown> {
  const formData: Record<string, unknown> = {}
  const metadataFields = Array.from(getAllExpectedFieldKeys())

  metadataFields.forEach((fieldName) => {
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

  // Initialize metadata fields to empty values
  const metadataFields = Array.from(getAllExpectedFieldKeys())
  metadataFields.forEach((field) => {
    formData[field] = ''
  })

  if (plan.metadata) {
    const metadata = plan.metadata as Record<string, unknown>
    const metadataFieldSet = new Set(metadataFields)

    metadataFields.forEach((field) => {
      if (metadata[field] !== undefined && metadata[field] !== null) {
        formData[field] = String(metadata[field])
      }
    })

    Object.keys(metadata).forEach((key) => {
      if (!metadataFieldSet.has(key)) {
        formData[key] = metadata[key]
      }
    })
  }

  return formData
}

function parseCommaSeparatedValues(value: unknown): string[] | null {
  if (typeof value !== 'string') return null
  const parts = value
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v.length > 0)
  return parts.length > 0 ? parts : null
}

export function buildPlanDataFromForm(formData: Record<string, unknown>): PlanInsert {
  const metadata = buildMetadata(formData)

  // Build core database fields
  return {
    name: String(formData.name || ''),
    carrier: (formData.carrier as string) || null,
    plan_year: parseInt(String(formData.plan_year || new Date().getUTCFullYear()), 10),
    type_network: (formData.type_network as string) || null,
    type_extension: (formData.type_extension as string) || null,
    type_snp: (formData.type_snp as string) || null,
    type_program: (formData.type_program as string) || null,
    cms_contract_number: (formData.cms_contract_number as string) || null,
    cms_plan_number: (formData.cms_plan_number as string) || null,
    cms_geo_segment: (formData.cms_geo_segment as string) || null,
    counties: typeof formData.counties === 'string' ? parseCommaSeparatedValues(formData.counties) : null,
    metadata,
  }
}

export function buildMetadata(data: Record<string, unknown>): PlanMetadata {
  const metadata: PlanMetadata = {}
  const properties = getAllProperties()
  const expectedKeys = getAllExpectedFieldKeys()

  // Process base schema properties
  Object.keys(properties).forEach((key) => {
    const value = data[key]
    if (value !== undefined && value !== null && value !== '') {
      if (typeof value === 'number') {
        metadata[key] = value
      } else if (typeof value === 'string' && value.trim() !== '') {
        metadata[key] = value
      } else {
        metadata[key] = JSON.stringify(value)
      }
    }
  })

  // Process variant fields (those in expectedKeys but not base properties)
  expectedKeys.forEach((key) => {
    if (properties[key]) return

    const value = data[key]
    if (value !== null && value !== undefined && value !== '') {
      if (typeof value === 'string' || typeof value === 'number') {
        metadata[key] = value
      } else {
        metadata[key] = JSON.stringify(value)
      }
    }
  })

  const coreFieldSet = new Set<string>(CORE_FORM_FIELDS)

  // Include any remaining custom/legacy fields that were present in the form data
  Object.keys(data).forEach((key) => {
    if (properties[key] || expectedKeys.has(key) || coreFieldSet.has(key)) return

    const value = data[key]
    if (value !== null && value !== undefined && value !== '') {
      if (typeof value === 'string' || typeof value === 'number') {
        metadata[key] = value
      } else {
        metadata[key] = JSON.stringify(value)
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

export function getResolvedMetadata(
  plan: Plan,
  keys: string[],
  context?: ResolverInput
): Record<string, ResolutionResult> {
  const normalizedContext = normalizeResolverInput(context)
  return keys.reduce<Record<string, ResolutionResult>>((acc, key) => {
    acc[key] = resolvePlanValue(plan, key, normalizedContext)
    return acc
  }, {})
}

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? null : parsed
  }
  return null
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
    const context = hasExtraHelp ? { eligibility: 'lis' } : undefined
    const resolved = resolvePlanValue(plan, 'premium_monthly', context)
    return parseNumber(resolved.value) ?? 0
  },

  /**
   * Get the premium range for display purposes
   * @param plan - The plan object
   * @returns Object with min and max premium values
   */
  getPremiumRange: (plan: Plan): { min: number | null; max: number | null } => {
    const standard = parseNumber(resolvePlanValue(plan, 'premium_monthly').value)
    const lis = parseNumber(resolvePlanValue(plan, 'premium_monthly', { eligibility: 'lis' }).value)

    return {
      min: lis ?? standard ?? null,
      max: standard,
    }
  },

  /**
   * Calculate the effective medical deductible based on Medicaid status
   * @param plan - The plan object
   * @param hasMedicaidCostSharing - Whether the beneficiary has Medicaid cost-sharing assistance
   * @returns The effective medical deductible amount
   */
  getEffectiveMedicalDeductible: (plan: Plan, hasMedicaidCostSharing: boolean = false): number | null => {
    const context = hasMedicaidCostSharing ? { eligibility: 'medicaid' } : undefined
    const resolved = resolvePlanValue(plan, 'medical_deductible', context)
    return parseNumber(resolved.value) ?? 0
  },

  /**
   * Get the medical deductible range for display purposes
   * @param plan - The plan object
   * @returns Object with min and max deductible values
   */
  getMedicalDeductibleRange: (plan: Plan): { min: number | null; max: number | null } => {
    const standard = parseNumber(resolvePlanValue(plan, 'medical_deductible').value)
    const medicaid = parseNumber(resolvePlanValue(plan, 'medical_deductible', { eligibility: 'medicaid' }).value)

    return {
      min: medicaid ?? standard ?? null,
      max: standard,
    }
  },
}
