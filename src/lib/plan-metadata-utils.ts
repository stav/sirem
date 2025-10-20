import { Database } from './supabase-types'

// Base plan type from database
export type Plan = Database['public']['Tables']['plans']['Row']
export type PlanInsert = Database['public']['Tables']['plans']['Insert']
export type PlanUpdate = Database['public']['Tables']['plans']['Update']

// Metadata fields that are now stored in JSONB
export interface PlanMetadata {
  // Dates
  effective_start?: string
  effective_end?: string

  // Monthly financials
  premium_monthly?: number
  premium_monthly_with_extra_help?: number // $0 with LIS
  giveback_monthly?: number

  // Yearly financials
  moop_annual?: number
  medical_deductible?: number
  medical_deductible_with_medicaid?: number // $0 when Medicaid pays
  rx_deductible_tier345?: number
  rx_cost_share?: string

  // Yearly benefits
  dental_benefit_yearly?: number
  hearing_benefit_yearly?: number
  vision_benefit_yearly?: number

  // Medical copays
  primary_care_copay?: number
  specialist_copay?: number
  hospital_inpatient_per_day_copay?: number
  hospital_inpatient_days?: number
  ambulance_copay?: number
  emergency_room_copay?: number
  urgent_care_copay?: number

  // Additional information
  pharmacy_benefit?: string
  service_area?: string
  summary?: string
  notes?: string

  // Extended benefits
  otc_benefit_quarterly?: number
  card_benefit?: number
  fitness_benefit?: string
  transportation_benefit?: number
  medicaid_eligibility?: string
  transitioned_from?: string

  // Allow any additional fields for future flexibility
  [key: string]: unknown
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

// Specific getters for common metadata fields
export const getPlanMetadata = {
  effectiveStart: (plan: Plan) => getMetadataDate(plan, 'effective_start'),
  effectiveEnd: (plan: Plan) => getMetadataDate(plan, 'effective_end'),

  premiumMonthly: (plan: Plan) => getMetadataNumber(plan, 'premium_monthly'),
  premiumMonthlyWithExtraHelp: (plan: Plan) => getMetadataNumber(plan, 'premium_monthly_with_extra_help'),
  givebackMonthly: (plan: Plan) => getMetadataNumber(plan, 'giveback_monthly'),
  otcBenefitQuarterly: (plan: Plan) => getMetadataNumber(plan, 'otc_benefit_quarterly'),

  dentalBenefitYearly: (plan: Plan) => getMetadataNumber(plan, 'dental_benefit_yearly'),
  hearingBenefitYearly: (plan: Plan) => getMetadataNumber(plan, 'hearing_benefit_yearly'),
  visionBenefitYearly: (plan: Plan) => getMetadataNumber(plan, 'vision_benefit_yearly'),

  primaryCareCopay: (plan: Plan) => getMetadataNumber(plan, 'primary_care_copay'),
  specialistCopay: (plan: Plan) => getMetadataNumber(plan, 'specialist_copay'),
  hospitalInpatientPerDayCopay: (plan: Plan) => getMetadataNumber(plan, 'hospital_inpatient_per_day_copay'),
  hospitalInpatientDays: (plan: Plan) => getMetadataNumber(plan, 'hospital_inpatient_days'),
  moopAnnual: (plan: Plan) => getMetadataNumber(plan, 'moop_annual'),
  ambulanceCopay: (plan: Plan) => getMetadataNumber(plan, 'ambulance_copay'),
  emergencyRoomCopay: (plan: Plan) => getMetadataNumber(plan, 'emergency_room_copay'),
  urgentCareCopay: (plan: Plan) => getMetadataNumber(plan, 'urgent_care_copay'),

  medicalDeductible: (plan: Plan) => getMetadataNumber(plan, 'medical_deductible'),
  medicalDeductibleWithMedicaid: (plan: Plan) => getMetadataNumber(plan, 'medical_deductible_with_medicaid'),

  pharmacyBenefit: (plan: Plan) => getMetadataString(plan, 'pharmacy_benefit'),
  serviceArea: (plan: Plan) => getMetadataString(plan, 'service_area'),
  notes: (plan: Plan) => getMetadataString(plan, 'notes'),

  cardBenefit: (plan: Plan) => getMetadataNumber(plan, 'card_benefit'),
  fitnessBenefit: (plan: Plan) => getMetadataString(plan, 'fitness_benefit'),
  transportationBenefit: (plan: Plan) => getMetadataNumber(plan, 'transportation_benefit'),
  rxDeductibleTier345: (plan: Plan) => getMetadataNumber(plan, 'rx_deductible_tier345'),
  rxCostShare: (plan: Plan) => getMetadataString(plan, 'rx_cost_share'),
  medicaidEligibility: (plan: Plan) => getMetadataString(plan, 'medicaid_eligibility'),
  transitionedFrom: (plan: Plan) => getMetadataString(plan, 'transitioned_from'),
  summary: (plan: Plan) => getMetadataString(plan, 'summary'),
}

// Helper to build metadata object from form data
export function buildMetadata(data: Record<string, unknown>): PlanMetadata {
  const metadata: PlanMetadata = {}

  // Map form fields to metadata keys
  const fieldMapping: Record<string, string> = {
    effective_start: 'effective_start',
    effective_end: 'effective_end',
    premium_monthly: 'premium_monthly',
    premium_monthly_with_extra_help: 'premium_monthly_with_extra_help',
    giveback_monthly: 'giveback_monthly',
    otc_benefit_quarterly: 'otc_benefit_quarterly',
    dental_benefit_yearly: 'dental_benefit_yearly',
    hearing_benefit_yearly: 'hearing_benefit_yearly',
    vision_benefit_yearly: 'vision_benefit_yearly',
    primary_care_copay: 'primary_care_copay',
    specialist_copay: 'specialist_copay',
    hospital_inpatient_per_day_copay: 'hospital_inpatient_per_day_copay',
    hospital_inpatient_days: 'hospital_inpatient_days',
    moop_annual: 'moop_annual',
    ambulance_copay: 'ambulance_copay',
    emergency_room_copay: 'emergency_room_copay',
    urgent_care_copay: 'urgent_care_copay',
    medical_deductible: 'medical_deductible',
    medical_deductible_with_medicaid: 'medical_deductible_with_medicaid',
    pharmacy_benefit: 'pharmacy_benefit',
    service_area: 'service_area',
    notes: 'notes',
    card_benefit: 'card_benefit',
    fitness_benefit: 'fitness_benefit',
    transportation_benefit: 'transportation_benefit',
    rx_deductible_tier345: 'rx_deductible_tier345',
    rx_cost_share: 'rx_cost_share',
    medicaid_eligibility: 'medicaid_eligibility',
    transitioned_from: 'transitioned_from',
    summary: 'summary',
  }

  // Only include non-null/non-empty values
  Object.entries(fieldMapping).forEach(([formKey, metadataKey]) => {
    const value = data[formKey]
    if (value !== null && value !== undefined && value !== '') {
      metadata[metadataKey] = value
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
      return getPlanMetadata.premiumMonthlyWithExtraHelp(plan) ?? 0
    } else {
      // Standard premium - use the regular monthly premium
      return getPlanMetadata.premiumMonthly(plan)
    }
  },

  /**
   * Get the premium range for display purposes
   * @param plan - The plan object
   * @returns Object with min and max premium values
   */
  getPremiumRange: (plan: Plan): { min: number | null; max: number | null } => {
    const standardPremium = getPlanMetadata.premiumMonthly(plan)
    const extraHelpPremium = getPlanMetadata.premiumMonthlyWithExtraHelp(plan)

    return {
      min: extraHelpPremium ?? 0,
      max: standardPremium
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
      return getPlanMetadata.medicalDeductibleWithMedicaid(plan) ?? 0
    } else {
      // Standard deductible - use the regular medical deductible
      return getPlanMetadata.medicalDeductible(plan)
    }
  },

  /**
   * Get the medical deductible range for display purposes
   * @param plan - The plan object
   * @returns Object with min and max deductible values
   */
  getMedicalDeductibleRange: (plan: Plan): { min: number | null; max: number | null } => {
    const standardDeductible = getPlanMetadata.medicalDeductible(plan)
    const medicaidDeductible = getPlanMetadata.medicalDeductibleWithMedicaid(plan)

    return {
      min: medicaidDeductible ?? 0,
      max: standardDeductible
    }
  },

}
