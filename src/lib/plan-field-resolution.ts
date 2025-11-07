import { plansMetadataSchema } from '@/schema/plans-metadata-schema'
import { parseSchema, type FieldDefinition } from '@/lib/schema-parser'
import type { Database } from './supabase-types'

export type Plan = Database['public']['Tables']['plans']['Row']

export type EligibilityContext = {
  eligibility?: string | string[]
}

export type ResolutionSource = 'variant' | 'base' | 'missing'

export interface ResolutionResult {
  source: ResolutionSource
  key: string | null
  value: unknown
  definition?: FieldDefinition
}

const parsedSchema = parseSchema(plansMetadataSchema)
const fieldDefinitions = new Map<string, FieldDefinition>()
const variantsByBase = new Map<string, FieldDefinition[]>()

parsedSchema.fields.forEach((field) => {
  fieldDefinitions.set(field.key, field)
})

parsedSchema.fields.forEach((field) => {
  if (!field.baseKey && field.variants) {
    const orderedVariants: FieldDefinition[] = []
    Object.values(field.variants).forEach((variant) => {
      const variantDefinition = fieldDefinitions.get(variant.key)
      if (variantDefinition) {
        orderedVariants.push(variantDefinition)
      }
    })
    if (orderedVariants.length) {
      variantsByBase.set(field.key, orderedVariants)
    }
  }
})

function normalizeEligibility(context?: EligibilityContext): string[] {
  if (!context || !context.eligibility) return []
  const value = context.eligibility
  if (Array.isArray(value)) {
    return value.map((item) => item.toLowerCase())
  }
  return [value.toLowerCase()]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  return true
}

export function resolveMetadataValue(
  metadata: Record<string, unknown> | null | undefined,
  fieldKey: string,
  context?: EligibilityContext
): ResolutionResult {
  const fieldDefinition = fieldDefinitions.get(fieldKey)
  if (!fieldDefinition) {
    return { key: null, value: undefined, source: 'missing' }
  }

  const record = isRecord(metadata) ? metadata : undefined
  const eligibility = normalizeEligibility(context)

  // If the caller already references a variant directly, return it (with base fallback)
  if (fieldDefinition.baseKey) {
    const variantValue = record ? record[fieldDefinition.key] : undefined
    if (hasValue(variantValue)) {
      return { key: fieldDefinition.key, value: variantValue, source: 'variant', definition: fieldDefinition }
    }

    const baseDefinition = fieldDefinitions.get(fieldDefinition.baseKey)
    const baseValue = baseDefinition && record ? record[baseDefinition.key] : undefined
    if (baseDefinition && hasValue(baseValue)) {
      return { key: baseDefinition.key, value: baseValue, source: 'base', definition: baseDefinition }
    }

    return { key: null, value: undefined, source: 'missing' }
  }

  const baseValue = record ? record[fieldDefinition.key] : undefined

  if (eligibility.length > 0) {
    const candidateVariants = variantsByBase.get(fieldDefinition.key) || []
    for (const variantDefinition of candidateVariants) {
      const variantEligibility = variantDefinition.characteristics?.eligibility?.toLowerCase()
      if (variantEligibility && eligibility.includes(variantEligibility)) {
        const variantValue = record ? record[variantDefinition.key] : undefined
        if (hasValue(variantValue)) {
          return {
            key: variantDefinition.key,
            value: variantValue,
            source: 'variant',
            definition: variantDefinition,
          }
        }
      }
    }
  }

  if (hasValue(baseValue)) {
    return { key: fieldDefinition.key, value: baseValue, source: 'base', definition: fieldDefinition }
  }

  return { key: null, value: undefined, source: 'missing' }
}

export function resolvePlanValue(plan: Plan, fieldKey: string, context?: EligibilityContext): ResolutionResult {
  return resolveMetadataValue((plan.metadata as Record<string, unknown> | null | undefined) ?? undefined, fieldKey, context)
}
