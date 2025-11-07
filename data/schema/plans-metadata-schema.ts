/**
 * Plans Metadata Schema
 *
 * This file exports the schema data for the plans metadata fields.
 * It serves as a TypeScript module that can be imported by components.
 *
 * Schema Structure:
 * - Hierarchical sections array containing ordered property arrays
 * - Each section has: title, description, and properties array
 * - Each property in the properties array must have a "key" field
 *
 * 🔑 KEY PROPERTY REQUIREMENT:
 * The "key" property is essential because properties are stored in arrays (not objects).
 * The key serves as:
 * - The database property name in plan.metadata JSONB (e.g., metadata.premium_monthly)
 * - The field identifier for form data binding
 * - The lookup key for property indexing in getAllProperties()
 * - The unique identifier in FieldDefinition objects
 *
 * Without the key, we cannot map schema definitions to actual database storage.
 *
 * 🧭 CHARACTERISTICS + TAGS:
 * Each property can optionally describe its dimensional characteristics (concept, frequency,
 * eligibility, direction, etc.). Eligibility-specific values are represented through variants.
 * Tags are optional and only used for grouping/presentation purposes (e.g., 'financial',
 * 'cost-sharing'); they do not control eligibility.
 */

export const plansMetadataSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'https://sirem.app/schemas/plans-metadata.json',
  title: 'Plans Metadata Schema',
  description:
    "Schema definition for the metadata JSONB field in the plans table. ⚠️ IMPORTANT: This is the single source of truth for metadata field definitions. The schema uses a hierarchical structure with sections containing ordered property arrays. Runtime extraction in src/lib/plan-metadata-utils.ts uses getAllProperties() to automatically extract all properties from all sections, ensuring automatic synchronization. 🔄 DYNAMIC: New fields may be added, changed, or removed at any time as business requirements evolve - simply add them to the appropriate section's properties array.",
  type: 'object',
  additionalProperties: true,
  sections: [
    {
      title: 'Plan Dates',
      description: 'Plan effective dates and periods',
      properties: [
        {
          key: 'effective_start',
          type: 'string',
          format: 'date',
          label: 'Effective Start Date',
          description: 'Plan effective start date in YYYY-MM-DD format',
        },
        {
          key: 'effective_end',
          type: 'string',
          format: 'date',
          label: 'Effective End Date',
          description: 'Plan effective end date in YYYY-MM-DD format',
        },
      ],
    },
    {
      title: 'Financials',
      description: 'Monthly premiums, givebacks, and maximum out-of-pocket limits',
      properties: [
        {
          key: 'premium_monthly',
          type: 'number',
          minimum: 0,
          label: 'Premium (monthly)',
          description: 'Monthly premium amount in dollars',
          characteristics: {
            concept: 'premium',
            frequency: 'monthly',
            eligibility: 'medicare',
            direction: 'debit',
          },
          tags: ['financial', 'cost-sharing'],
          variants: {
            lis: {
              key: 'premium_monthly_with_extra_help',
              label: 'Premium (monthly, with Extra Help)',
              description: 'Monthly premium for LIS/Extra Help recipients (typically $0)',
              characteristics: {
                eligibility: 'lis',
              },
            },
          },
        },
        {
          key: 'giveback_monthly',
          type: 'number',
          minimum: 0,
          label: 'Giveback (monthly)',
          description: 'Monthly giveback/rebate amount in dollars',
          characteristics: {
            concept: 'giveback',
            frequency: 'monthly',
            eligibility: 'medicare',
            direction: 'credit',
          },
          tags: ['financial'],
        },
        {
          key: 'moop_annual',
          type: 'number',
          minimum: 0,
          label: 'MOOP (annual)',
          description: 'Maximum Out-of-Pocket annual limit in dollars',
          characteristics: {
            concept: 'moop',
            frequency: 'annual',
            eligibility: 'medicare',
            direction: 'debit',
          },
          tags: ['financial', 'cost-sharing'],
        },
      ],
    },
    {
      title: 'Deductibles',
      description: 'Medical and prescription drug deductibles',
      properties: [
        {
          key: 'medical_deductible',
          type: 'number',
          minimum: 0,
          label: 'Medical Deductible',
          description: 'Standard medical deductible amount in dollars',
          characteristics: {
            concept: 'deductible',
            type: 'medical',
            eligibility: 'medicare',
            direction: 'debit',
          },
          tags: ['cost-sharing'],
          variants: {
            medicaid: {
              key: 'medical_deductible_with_medicaid',
              label: 'Medical Deductible (with Medicaid)',
              description: 'Medical deductible for Medicaid cost-sharing recipients (typically $0)',
              characteristics: {
                eligibility: 'medicaid',
                modifier: 'with_assistance',
              },
            },
          },
        },
        {
          key: 'rx_deductible_tier345',
          type: 'number',
          minimum: 0,
          label: 'RX Deductible (Tiers 3-5)',
          description: 'Prescription drug deductible for tiers 3, 4, and 5 in dollars',
          characteristics: {
            concept: 'deductible',
            type: 'prescription',
            eligibility: 'medicare',
            direction: 'debit',
            modifier: 'tier345',
          },
          tags: ['cost-sharing'],
        },
      ],
    },
    {
      title: 'Benefits',
      description: 'Benefits and allowances',
      properties: [
        {
          key: 'otc_benefit_quarterly',
          type: 'number',
          minimum: 0,
          label: 'OTC Benefit (quarterly)',
          description: 'Quarterly OTC (Over-the-Counter) benefit amount in dollars',
          characteristics: {
            concept: 'benefit',
            type: 'otc',
            frequency: 'quarterly',
            eligibility: 'medicare',
            direction: 'credit',
          },
          tags: ['benefit'],
        },
        {
          key: 'card_benefit',
          type: 'number',
          minimum: 0,
          label: 'Card Benefit',
          description: 'Prepaid debit card benefit amount in dollars',
          characteristics: {
            concept: 'benefit',
            type: 'card',
            frequency: 'monthly',
            eligibility: 'medicare',
            direction: 'credit',
          },
          tags: ['benefit'],
        },
        {
          key: 'dental_benefit_yearly',
          type: 'number',
          minimum: 0,
          label: 'Dental (yearly)',
          description: 'Annual dental benefit amount in dollars',
          characteristics: {
            concept: 'benefit',
            type: 'dental',
            frequency: 'yearly',
            eligibility: 'medicare',
            direction: 'credit',
          },
          tags: ['benefit'],
        },
        {
          key: 'vision_benefit_yearly',
          type: 'number',
          minimum: 0,
          label: 'Vision (yearly)',
          description: 'Annual vision benefit amount in dollars',
          characteristics: {
            concept: 'benefit',
            type: 'vision',
            frequency: 'yearly',
            eligibility: 'medicare',
            direction: 'credit',
          },
          tags: ['benefit'],
        },
        {
          key: 'hearing_benefit_yearly',
          type: 'number',
          minimum: 0,
          label: 'Hearing (yearly)',
          description: 'Annual hearing benefit amount in dollars',
          characteristics: {
            concept: 'benefit',
            type: 'hearing',
            frequency: 'yearly',
            eligibility: 'medicare',
            direction: 'credit',
          },
          tags: ['benefit'],
        },
      ],
    },
    {
      title: 'Doctor Copays',
      description: 'Copays for doctor visits and attendance',
      properties: [
        {
          key: 'primary_care_copay',
          type: 'number',
          minimum: 0,
          label: 'PCP Copay',
          description: 'Primary care physician copay amount in dollars',
          characteristics: {
            concept: 'copay',
            type: 'primary_care',
            eligibility: 'medicare',
            direction: 'debit',
          },
          tags: ['cost-sharing'],
        },
        {
          key: 'specialist_copay',
          type: 'number',
          minimum: 0,
          label: 'Specialist Copay',
          description: 'Specialist physician copay amount in dollars',
          characteristics: {
            concept: 'copay',
            type: 'specialist',
            eligibility: 'medicare',
            direction: 'debit',
          },
          tags: ['cost-sharing'],
        },
      ],
    },
    {
      title: 'Hospital Copays',
      description: 'Copays for hospital stays and visits',
      properties: [
        {
          key: 'hospital_inpatient_per_day_copay',
          type: 'number',
          minimum: 0,
          label: 'Hospital Copay (daily)',
          description: 'Daily hospital inpatient copay amount in dollars',
          characteristics: {
            concept: 'copay',
            type: 'hospital_inpatient',
            eligibility: 'medicare',
            direction: 'debit',
            unit: 'per_day',
          },
          tags: ['cost-sharing'],
          variants: {
            medicaid_with: {
              key: 'hospital_inpatient_with_assistance_per_stay_copay',
              label: 'Hospital Copay (with assistance, per stay)',
              description: 'Hospital inpatient per stay copay amount with assistance in dollars',
              characteristics: {
                eligibility: 'medicaid',
                unit: 'per_stay',
                modifier: 'with_assistance',
              },
            },
            medicaid_without: {
              key: 'hospital_inpatient_without_assistance_per_stay_copay',
              label: 'Hospital Copay (without assistance, per stay)',
              description: 'Hospital inpatient per stay copay amount without assistance in dollars',
              characteristics: {
                eligibility: 'medicaid',
                unit: 'per_stay',
                modifier: 'without_assistance',
              },
            },
          },
        },
        {
          key: 'hospital_inpatient_days',
          type: 'integer',
          minimum: 0,
          label: 'Hospital Days',
          description: 'Number of covered hospital inpatient days',
          characteristics: {
            concept: 'coverage_limit',
            type: 'hospital_inpatient',
            eligibility: 'medicare',
          },
          tags: ['cost-sharing'],
        },
        {
          key: 'skilled_nursing_per_day_copay',
          type: 'number',
          minimum: 0,
          label: 'Skilled Nursing (per day)',
          description: 'Skilled nursing per day copay amount in dollars',
          characteristics: {
            concept: 'copay',
            type: 'skilled_nursing',
            eligibility: 'medicare',
            direction: 'debit',
            unit: 'per_day',
          },
          tags: ['cost-sharing'],
          variants: {
            medicaid: {
              key: 'skilled_nursing_with_assistance_per_stay_copay',
              label: 'Skilled Nursing (with assistance, per stay)',
              description: 'Skilled nursing per stay copay amount with assistance in dollars',
              characteristics: {
                eligibility: 'medicaid',
                unit: 'per_stay',
                modifier: 'with_assistance',
              },
            },
          },
        },
      ],
    },
    {
      title: 'Emergency Copays',
      description: 'Copays for emergency services',
      properties: [
        {
          key: 'ambulance_copay',
          type: 'number',
          minimum: 0,
          label: 'Ambulance Copay',
          description: 'Ambulance service copay amount in dollars',
          characteristics: {
            concept: 'copay',
            type: 'ambulance',
            eligibility: 'medicare',
            direction: 'debit',
          },
          tags: ['cost-sharing'],
          variants: {
            medicaid: {
              key: 'ambulance_with_assistance_copay',
              label: 'Ambulance Copay (with assistance)',
              description: 'Ambulance service copay amount with assistance in dollars',
              characteristics: {
                eligibility: 'medicaid',
                modifier: 'with_assistance',
              },
            },
          },
        },
        {
          key: 'emergency_room_copay',
          type: 'number',
          minimum: 0,
          label: 'ER Copay',
          description: 'Emergency room visit copay amount in dollars',
          characteristics: {
            concept: 'copay',
            type: 'emergency_room',
            eligibility: 'medicare',
            direction: 'debit',
          },
          tags: ['cost-sharing'],
          variants: {
            medicaid: {
              key: 'emergency_with_assistance_copay',
              label: 'ER Copay (with assistance)',
              description: 'Emergency room visit copay amount with assistance in dollars',
              characteristics: {
                eligibility: 'medicaid',
                modifier: 'with_assistance',
              },
            },
          },
        },
        {
          key: 'urgent_care_copay',
          type: 'number',
          minimum: 0,
          label: 'Urgent Care Copay',
          description: 'Urgent care visit copay amount in dollars',
          characteristics: {
            concept: 'copay',
            type: 'urgent_care',
            eligibility: 'medicare',
            direction: 'debit',
          },
          tags: ['cost-sharing'],
        },
      ],
    },
    {
      title: 'Additional Benefits',
      description: 'Card, fitness, and transportation benefits',
      properties: [
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
          minimum: 0,
          label: 'Transportation Benefit',
          description: 'Transportation/rides benefit amount in dollars',
          characteristics: {
            concept: 'benefit',
            type: 'transportation',
            eligibility: 'medicare',
            direction: 'credit',
          },
          tags: ['benefit'],
        },
      ],
    },
    {
      title: 'Plan Information',
      description: 'General plan details and descriptions',
      properties: [
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
          enum: ['Required', 'Not Required', 'Optional'],
          label: 'Medicaid Eligibility',
          description: 'Medicaid eligibility requirements',
        },
        {
          key: 'transitioned_from',
          type: 'string',
          label: 'Transitioned From',
          description: 'Information about plan transitions or predecessor plans',
        },
      ],
    },
  ],
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
