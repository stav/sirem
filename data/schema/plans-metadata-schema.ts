/**
 * Plans Metadata Schema
 *
 * This module defines the schema data for plan metadata fields.
 * It provides helper factories that ensure characteristics are declared
 * using the same enumerations the forthcoming field builder UI will expose.
 *
 * Key updates:
 * - Variants are stored as ordered arrays so the UI can render them reliably.
 * - Characteristics explicitly support eligibility tokens (including Medicaid levels),
 *   frequency options, and monetary units ($ / %).
 * - Builder options are exported for reuse in tooling/UX layers.
 */

const FIELD_TYPES = ['string', 'number'] as const
const UNIT_OPTIONS = ['$', '%'] as const
const FREQUENCY_OPTIONS = ['daily', 'monthly', 'quarterly', 'yearly', 'per_stay'] as const
const BASE_ELIGIBILITY_OPTIONS = ['medicare', 'lis', 'medicaid'] as const
const MEDICAID_LEVEL_OPTIONS = ['qdwi', 'qi', 'slmb', 'slmb+', 'qmb', 'qmb+', 'fbde'] as const
const ELIGIBILITY_OPTIONS = [...BASE_ELIGIBILITY_OPTIONS, ...MEDICAID_LEVEL_OPTIONS] as const

type FieldType = (typeof FIELD_TYPES)[number]
type UnitOption = (typeof UNIT_OPTIONS)[number]
type FrequencyOption = (typeof FREQUENCY_OPTIONS)[number]
type EligibilityOption = (typeof ELIGIBILITY_OPTIONS)[number]
type FieldDirection = 'credit' | 'debit'

interface CharacteristicInput {
  concept?: string
  type?: string
  frequency?: FrequencyOption
  eligibility?: EligibilityOption | readonly EligibilityOption[]
  unit?: UnitOption
  modifier?: string
  direction?: FieldDirection
}

interface VariantInput {
  key: string
  label: string
  description?: string
  tags?: readonly string[]
  characteristics?: CharacteristicInput
}

interface FieldInput {
  key: string
  type: FieldType
  label: string
  description?: string
  tags?: readonly string[]
  characteristics?: CharacteristicInput
  variants?: readonly VariantInput[]
  validation?: {
    minimum?: number
    maximum?: number
    enum?: readonly string[]
    required?: boolean
  }
  format?: 'date'
}

function assertEligibilityToken(token: EligibilityOption): string {
  if (ELIGIBILITY_OPTIONS.includes(token)) {
    return token
  }
  throw new Error(`Unsupported eligibility token: ${token}`)
}

function normalizeEligibilityInput(
  eligibility: CharacteristicInput['eligibility']
): string | string[] | undefined {
  if (!eligibility) return undefined

  if (Array.isArray(eligibility)) {
    if (eligibility.length === 0) return undefined
    return eligibility.map((token) => assertEligibilityToken(token as EligibilityOption))
  }

  return assertEligibilityToken(eligibility as EligibilityOption)
}

function buildCharacteristics(input?: CharacteristicInput): Record<string, unknown> | undefined {
  if (!input) return undefined

  const characteristics: Record<string, unknown> = {}

  if (input.concept) characteristics.concept = input.concept
  if (input.type) characteristics.type = input.type
  if (input.modifier) characteristics.modifier = input.modifier
  if (input.direction) characteristics.direction = input.direction

  if (input.frequency) {
    if (!FREQUENCY_OPTIONS.includes(input.frequency)) {
      throw new Error(`Unsupported frequency token: ${input.frequency}`)
    }
    characteristics.frequency = input.frequency
  }

  if (input.unit) {
    if (!UNIT_OPTIONS.includes(input.unit)) {
      throw new Error(`Unsupported unit token: ${input.unit}`)
    }
    characteristics.unit = input.unit
  }

  const eligibility = normalizeEligibilityInput(input.eligibility)
  if (eligibility) {
    characteristics.eligibility = eligibility
  }

  return Object.keys(characteristics).length > 0 ? characteristics : undefined
}

function defineVariant(input: VariantInput): Record<string, unknown> {
  const variant: Record<string, unknown> = {
    key: input.key,
    label: input.label,
  }

  if (input.description) {
    variant.description = input.description
  }

  if (input.tags && input.tags.length > 0) {
    variant.tags = [...input.tags]
  }

  const characteristics = buildCharacteristics(input.characteristics)
  if (characteristics) {
    variant.characteristics = characteristics
  }

  return variant
}

function defineField(input: FieldInput): Record<string, unknown> {
  const field: Record<string, unknown> = {
    key: input.key,
    type: input.type,
    label: input.label,
    description: input.description,
  }

  if (input.format) {
    field.format = input.format
  }

  if (input.tags && input.tags.length > 0) {
    field.tags = [...input.tags]
  }

  const characteristics = buildCharacteristics(input.characteristics)
  if (characteristics) {
    field.characteristics = characteristics
  }

  if (input.variants && input.variants.length > 0) {
    field.variants = input.variants.map((variant) => defineVariant(variant))
  }

  if (input.validation) {
    if (input.validation.minimum !== undefined) {
      field.minimum = input.validation.minimum
    }
    if (input.validation.maximum !== undefined) {
      field.maximum = input.validation.maximum
    }
    if (input.validation.enum && input.validation.enum.length > 0) {
      field.enum = [...input.validation.enum]
    }
    if (input.validation.required !== undefined) {
      field.required = input.validation.required
    }
  }

  return field
}

function defineSection(title: string, description: string, properties: readonly FieldInput[]) {
  return {
    title,
    description,
    properties: properties.map((property) => defineField(property)),
  }
}

export const planMetadataCharacteristicOptions = {
  fieldTypes: FIELD_TYPES,
  units: UNIT_OPTIONS,
  frequency: FREQUENCY_OPTIONS,
  eligibility: ELIGIBILITY_OPTIONS,
  medicaidLevels: MEDICAID_LEVEL_OPTIONS,
} as const

const planMetadataSections = [
  defineSection('Financials', 'Monthly premiums, givebacks, and maximum out-of-pocket limits', [
    {
      key: 'premium_monthly',
      type: 'number',
      label: 'Premium (monthly)',
      characteristics: {
        concept: 'premium',
        frequency: 'monthly',
        eligibility: 'medicare',
        direction: 'debit',
        unit: '%',
      },
      tags: ['financial', 'cost-sharing'],
      validation: {
        minimum: 0,
      },
      variants: [
        {
          key: 'premium_monthly_with_extra_help',
          label: 'with Extra Help',
          characteristics: {
            eligibility: 'lis',
            frequency: 'monthly',
            unit: '$',
          },
        },
        {
          key: 'premium_monthly_medicaid_qmb',
          label: 'with Medicaid',
          characteristics: {
            eligibility: 'qmb',
            frequency: 'monthly',
            unit: '$',
          },
        },
      ],
    },
    {
      key: 'giveback_monthly',
      type: 'number',
      label: 'Giveback (monthly)',
      characteristics: {
        concept: 'giveback',
        frequency: 'monthly',
        eligibility: 'medicare',
        direction: 'credit',
        unit: '$',
      },
      tags: ['financial'],
      validation: {
        minimum: 0,
      },
    },
    {
      key: 'moop_annual',
      type: 'number',
      label: 'MOOP (annual)',
      description: 'Maximum Out-of-Pocket annual limit in dollars',
      characteristics: {
        concept: 'moop',
        frequency: 'yearly',
        eligibility: 'medicare',
        direction: 'debit',
        unit: '$',
      },
      tags: ['financial', 'cost-sharing'],
      validation: {
        minimum: 0,
      },
    },
  ]),
  defineSection('Deductibles', 'Medical and prescription drug deductibles', [
    {
      key: 'medical_deductible',
      type: 'number',
      label: 'Medical Deductible',
      characteristics: {
        concept: 'deductible',
        type: 'medical',
        frequency: 'yearly',
        eligibility: 'medicare',
        direction: 'debit',
        unit: '$',
      },
      tags: ['cost-sharing'],
      validation: {
        minimum: 0,
      },
      variants: [
        {
          key: 'medical_deductible_with_medicaid',
          label: 'with Medicaid',
          characteristics: {
            eligibility: 'qmb',
            modifier: 'with_assistance',
            frequency: 'yearly',
            unit: '$',
          },
        },
      ],
    },
    {
      key: 'rx_deductible_tier345',
      type: 'number',
      label: 'RX Deductible (Tiers 3-5)',
      characteristics: {
        concept: 'deductible',
        type: 'prescription',
        eligibility: 'medicare',
        direction: 'debit',
        modifier: 'tier345',
        unit: '$',
      },
      tags: ['cost-sharing'],
      validation: {
        minimum: 0,
      },
      variants: [
        {
          key: 'rx_deductible_tier345_with_medicaid',
          label: 'with Medicaid',
          characteristics: {
            eligibility: 'qmb',
            modifier: 'tier345',
            frequency: 'yearly',
            unit: '$',
          },
        },
      ],
    },
  ]),
  defineSection('Benefits', 'Benefits and allowances', [
    {
      key: 'otc_benefit_quarterly',
      type: 'number',
      label: 'OTC Benefit (quarterly)',
      characteristics: {
        concept: 'benefit',
        type: 'otc',
        frequency: 'quarterly',
        eligibility: 'medicare',
        direction: 'credit',
        unit: '$',
      },
      tags: ['benefit'],
      validation: {
        minimum: 0,
      },
    },
    {
      key: 'card_benefit',
      type: 'number',
      label: 'Card Benefit (monthly)',
      characteristics: {
        concept: 'benefit',
        type: 'card',
        frequency: 'monthly',
        eligibility: 'medicare',
        direction: 'credit',
        unit: '$',
      },
      tags: ['benefit'],
      validation: {
        minimum: 0,
      },
    },
    {
      key: 'dental_benefit_yearly',
      type: 'number',
      label: 'Dental (yearly)',
      characteristics: {
        concept: 'benefit',
        type: 'dental',
        frequency: 'yearly',
        eligibility: 'medicare',
        direction: 'credit',
        unit: '$',
      },
      tags: ['benefit'],
      validation: {
        minimum: 0,
      },
    },
    {
      key: 'vision_benefit_yearly',
      type: 'number',
      label: 'Vision (yearly)',
      characteristics: {
        concept: 'benefit',
        type: 'vision',
        frequency: 'yearly',
        eligibility: 'medicare',
        direction: 'credit',
        unit: '$',
      },
      tags: ['benefit'],
      validation: {
        minimum: 0,
      },
    },
    {
      key: 'hearing_benefit_yearly',
      type: 'number',
      label: 'Hearing (yearly)',
      characteristics: {
        concept: 'benefit',
        type: 'hearing',
        frequency: 'yearly',
        eligibility: 'medicare',
        direction: 'credit',
        unit: '$',
      },
      tags: ['benefit'],
      validation: {
        minimum: 0,
      },
    },
  ]),
  defineSection('Doctor Copays', 'Copays for doctor visits and attendance', [
    {
      key: 'primary_care_copay',
      type: 'number',
      label: 'PCP Copay',
      description: 'Primary care physician copay amount in dollars',
      characteristics: {
        concept: 'copay',
        type: 'primary_care',
        eligibility: 'medicare',
        direction: 'debit',
        unit: '$',
      },
      tags: ['cost-sharing'],
      validation: {
        minimum: 0,
      },
    },
    {
      key: 'specialist_copay',
      type: 'number',
      label: 'Specialist Copay',
      description: 'Specialist physician copay amount in dollars',
      characteristics: {
        concept: 'copay',
        type: 'specialist',
        eligibility: 'medicare',
        direction: 'debit',
        unit: '$',
      },
      tags: ['cost-sharing'],
      validation: {
        minimum: 0,
      },
    },
  ]),
  defineSection('Hospital Copays', 'Copays for hospital stays and visits', [
    {
      key: 'hospital_inpatient_days',
      type: 'number',
      label: 'Hospital Days',
      description: 'Days hospital inpatient copay required, after which the copay is zero',
      characteristics: {
        concept: 'coverage_limit',
        type: 'hospital_inpatient',
        eligibility: 'medicare',
      },
      tags: ['cost-sharing'],
      validation: {
        minimum: 0,
      },
    },
    {
      key: 'hospital_inpatient_per_day_copay',
      type: 'number',
      label: 'Hospital Copay (daily)',
      description: 'Daily hospital inpatient copay amount in dollars',
      characteristics: {
        concept: 'copay',
        type: 'hospital_inpatient',
        eligibility: 'medicare',
        direction: 'debit',
        frequency: 'daily',
        unit: '$',
      },
      tags: ['cost-sharing'],
      validation: {
        minimum: 0,
      },
      variants: [
        {
          key: 'hospital_inpatient_with_assistance_per_stay_copay',
          label: 'with assistance, per stay',
          description: '-',
          characteristics: {
            eligibility: 'qmb+',
            unit: '$',
            frequency: 'per_stay',
            modifier: 'with_assistance',
          },
        },
        {
          key: 'hospital_inpatient_without_assistance_per_stay_copay',
          label: 'without assistance, per stay',
          description: '-',
          characteristics: {
            unit: '$',
            frequency: 'per_stay',
            modifier: 'without_assistance',
          },
        },
      ],
    },
    {
      key: 'skilled_nursing_per_day_copay',
      type: 'number',
      label: 'Skilled Nursing (per day)',
      description: 'Skilled nursing per day copay amount in dollars',
      characteristics: {
        concept: 'copay',
        type: 'skilled_nursing',
        eligibility: 'medicare',
        direction: 'debit',
        frequency: 'daily',
        unit: '$',
      },
      tags: ['cost-sharing'],
      validation: {
        minimum: 0,
      },
      variants: [
        {
          key: 'skilled_nursing_with_assistance_per_stay_copay',
          label: 'with assistance, per stay',
          description: '-',
          characteristics: {
            eligibility: 'slmb+',
            unit: '$',
            frequency: 'per_stay',
            modifier: 'with_assistance',
          },
        },
      ],
    },
  ]),
  defineSection('Emergency Copays', 'Copays for emergency services', [
    {
      key: 'emergency_room_copay',
      type: 'number',
      label: 'ER Copay',
      description: 'Emergency room visit copay amount in dollars',
      characteristics: {
        concept: 'copay',
        type: 'emergency_room',
        eligibility: 'medicare',
        direction: 'debit',
        unit: '$',
      },
      tags: ['cost-sharing'],
      validation: {
        minimum: 0,
      },
      variants: [
        {
          key: 'emergency_with_assistance_copay',
          label: 'ER Copay (with assistance)',
          description: 'Emergency room visit copay amount with assistance in dollars',
          characteristics: {
            eligibility: ['medicaid', 'fbde'],
            modifier: 'with_assistance',
            unit: '$',
          },
        },
      ],
    },
    {
      key: 'urgent_care_copay',
      type: 'number',
      label: 'Urgent Care Copay',
      description: 'Urgent care visit copay amount in dollars',
      characteristics: {
        concept: 'copay',
        type: 'urgent_care',
        eligibility: 'medicare',
        direction: 'debit',
        unit: '$',
      },
      tags: ['cost-sharing'],
      validation: {
        minimum: 0,
      },
    },
    {
      key: 'ambulance_copay',
      type: 'number',
      label: 'Ambulance Copay',
      description: 'Ambulance service ground or air',
      characteristics: {
        concept: 'copay',
        type: 'ambulance',
        eligibility: 'medicare',
        direction: 'debit',
        unit: '$',
      },
      tags: ['cost-sharing'],
      validation: {
        minimum: 0,
      },
      variants: [
        {
          key: 'ambulance_with_assistance_copay',
          label: 'Ambulance Copay (with assistance)',
          description: 'Ambulance service copay amount with assistance in dollars',
          characteristics: {
            eligibility: ['medicaid', 'qdwi'],
            modifier: 'with_assistance',
            unit: '$',
          },
        },
      ],
    },
  ]),
  defineSection('Additional Benefits', 'Card, fitness, and transportation benefits', [
    {
      key: 'fitness_benefit',
      type: 'string',
      label: 'Fitness Benefit',
      description: 'Fitness/gym membership benefit description',
      characteristics: {
        concept: 'benefit',
        type: 'fitness',
        eligibility: 'medicare',
        direction: 'credit',
      },
      tags: ['benefit'],
    },
    {
      key: 'transportation_benefit',
      type: 'number',
      label: 'Transportation Benefit',
      description: 'Transportation/rides benefit amount in dollars',
      characteristics: {
        concept: 'benefit',
        type: 'transportation',
        eligibility: 'medicare',
        direction: 'credit',
        unit: '$',
      },
      tags: ['benefit'],
      validation: {
        minimum: 0,
      },
    },
  ]),
  defineSection('Plan Information', 'General plan details and descriptions', [
    {
      key: 'rx_cost_share',
      type: 'string',
      label: 'RX Cost Share',
      description: "Prescription drug cost sharing details (e.g., '20% after deductible')",
    },
    {
      key: 'pharmacy_benefit',
      type: 'string',
      label: 'Pharmacy Benefit',
      description: 'Pharmacy benefit description',
    },
    {
      key: 'service_area',
      type: 'string',
      label: 'Service Area',
      description: "Service area description (e.g., 'Statewide', 'Multi-state')",
    },
    {
      key: 'summary',
      type: 'string',
      label: 'Summary',
      description: 'Plan summary or overview',
    },
    {
      key: 'notes',
      type: 'string',
      label: 'Notes',
      description: 'General plan notes and additional information',
    },
    {
      key: 'medicaid_eligibility',
      type: 'string',
      label: 'Medicaid Eligibility',
      description: 'Medicaid eligibility requirements',
    },
    {
      key: 'transitioned_from',
      type: 'string',
      label: 'Transitioned From',
      description: 'Information about plan transitions or predecessor plans',
    },
  ]),
  defineSection('Plan Dates', 'Plan effective dates and periods', [
    {
      key: 'effective_start',
      type: 'string',
      label: 'Effective Start Date',
      description: 'Plan effective start date in YYYY-MM-DD format',
      format: 'date',
    },
    {
      key: 'effective_end',
      type: 'string',
      label: 'Effective End Date',
      description: 'Plan effective end date in YYYY-MM-DD format',
      format: 'date',
    },
  ]),
]

export const plansMetadataSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'https://sirem.app/schemas/plans-metadata.json',
  title: 'Plans Metadata Schema',
  description:
    "Schema definition for the metadata JSONB field in the plans table. ⚠️ IMPORTANT: This is the single source of truth for metadata field definitions. The schema uses a hierarchical structure with sections containing ordered property arrays. Runtime extraction in src/lib/plan-metadata-utils.ts uses getAllProperties() to automatically extract all properties from all sections, ensuring automatic synchronization. 🔄 DYNAMIC: New fields may be added, changed, or removed at any time as business requirements evolve - simply add them to the appropriate section's properties array.",
  type: 'object',
  additionalProperties: true,
  sections: planMetadataSections,
  examples: [
    {
      premium_monthly: 45.5,
      premium_monthly_with_extra_help: 0,
      giveback_monthly: 25.0,
      otc_benefit_quarterly: 100.0,
      dental_benefit_yearly: 1500.0,
      hearing_benefit_yearly: 500.0,
      vision_benefit_yearly: 200.0,
      primary_care_copay: 0,
      specialist_copay: 45,
      hospital_inpatient_per_day_copay: 350,
      hospital_inpatient_days: 5,
      moop_annual: 8500,
      ambulance_copay: 200,
      emergency_room_copay: 110,
      urgent_care_copay: 25,
      medical_deductible: 0,
      medical_deductible_with_medicaid: 0,
      pharmacy_benefit: 'Tier 1: $0, Tier 2: $5, Tier 3: $47',
      service_area: 'Statewide',
      medicaid_eligibility: 'Not Required',
    },
  ],
} as const


