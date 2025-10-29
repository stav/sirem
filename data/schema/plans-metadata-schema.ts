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
 */

export const plansMetadataSchema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://sirem.app/schemas/plans-metadata.json",
  "title": "Plans Metadata Schema",
  "description": "Schema definition for the metadata JSONB field in the plans table. ⚠️ IMPORTANT: This is the single source of truth for metadata field definitions. The schema uses a hierarchical structure with sections containing ordered property arrays. Runtime extraction in src/lib/plan-metadata-utils.ts uses getAllProperties() to automatically extract all properties from all sections, ensuring automatic synchronization. 🔄 DYNAMIC: New fields may be added, changed, or removed at any time as business requirements evolve - simply add them to the appropriate section's properties array.",
  "type": "object",
  "additionalProperties": true,
  "sections": [
    {
      "title": "Plan Dates",
      "description": "Plan effective dates and periods",
      "properties": [
        {
          "key": "effective_start",
          "type": "string",
          "format": "date",
          "label": "Effective Start Date",
          "description": "Plan effective start date in YYYY-MM-DD format"
        },
        {
          "key": "effective_end",
          "type": "string",
          "format": "date",
          "label": "Effective End Date",
          "description": "Plan effective end date in YYYY-MM-DD format"
        }
      ]
    },
    {
      "title": "Financials",
      "description": "Monthly premiums, givebacks, and maximum out-of-pocket limits",
      "properties": [
        {
          "key": "premium_monthly",
          "type": "number",
          "minimum": 0,
          "label": "Premium (monthly)",
          "description": "Monthly premium amount in dollars"
        },
        {
          "key": "premium_monthly_with_extra_help",
          "type": "number",
          "minimum": 0,
          "label": "Premium (monthly, with Extra Help)",
          "description": "Monthly premium for LIS/Extra Help recipients (typically $0)"
        },
        {
          "key": "giveback_monthly",
          "type": "number",
          "minimum": 0,
          "label": "Giveback (monthly)",
          "description": "Monthly giveback/rebate amount in dollars"
        },
        {
          "key": "moop_annual",
          "type": "number",
          "minimum": 0,
          "label": "MOOP (annual)",
          "description": "Maximum Out-of-Pocket annual limit in dollars"
        }
      ]
    },
    {
      "title": "Deductibles",
      "description": "Medical and prescription drug deductibles",
      "properties": [
        {
          "key": "medical_deductible",
          "type": "number",
          "minimum": 0,
          "label": "Medical Deductible",
          "description": "Standard medical deductible amount in dollars"
        },
        {
          "key": "medical_deductible_with_medicaid",
          "type": "number",
          "minimum": 0,
          "label": "Medical Deductible (with Medicaid)",
          "description": "Medical deductible for Medicaid cost-sharing recipients (typically $0)"
        },
        {
          "key": "rx_deductible_tier345",
          "type": "number",
          "minimum": 0,
          "label": "RX Deductible (Tiers 3-5)",
          "description": "Prescription drug deductible for tiers 3, 4, and 5 in dollars"
        }
      ]
    },
    {
      "title": "Benefits",
      "description": "Benefits and allowances",
      "properties": [
        {
          "key": "otc_benefit_quarterly",
          "type": "number",
          "minimum": 0,
          "label": "OTC Benefit (quarterly)",
          "description": "Quarterly OTC (Over-the-Counter) benefit amount in dollars"
        },
        {
          "key": "card_benefit",
          "type": "number",
          "minimum": 0,
          "label": "Card Benefit",
          "description": "Prepaid debit card benefit amount in dollars"
        },
        {
          "key": "dental_benefit_yearly",
          "type": "number",
          "minimum": 0,
          "label": "Dental (yearly)",
          "description": "Annual dental benefit amount in dollars"
        },
        {
          "key": "vision_benefit_yearly",
          "type": "number",
          "minimum": 0,
          "label": "Vision (yearly)",
          "description": "Annual vision benefit amount in dollars"
        },
        {
          "key": "hearing_benefit_yearly",
          "type": "number",
          "minimum": 0,
          "label": "Hearing (yearly)",
          "description": "Annual hearing benefit amount in dollars"
        }
      ]
    },
    {
      "title": "Doctor Copays",
      "description": "Copays for doctor visits and attendance",
      "properties": [
        {
          "key": "primary_care_copay",
          "type": "number",
          "minimum": 0,
          "label": "PCP Copay",
          "description": "Primary care physician copay amount in dollars"
        },
        {
          "key": "specialist_copay",
          "type": "number",
          "minimum": 0,
          "label": "Specialist Copay",
          "description": "Specialist physician copay amount in dollars"
        }
      ]
    },
    {
      "title": "Hospital Copays",
      "description": "Copays for hospital stays and visits",
      "properties": [

        {
          "key": "hospital_inpatient_per_day_copay",
          "type": "number",
          "minimum": 0,
          "label": "Hospital Copay (daily)",
          "description": "Daily hospital inpatient copay amount in dollars"
        },
        {
          "key": "hospital_inpatient_days",
          "type": "integer",
          "minimum": 0,
          "label": "Hospital Days",
          "description": "Number of covered hospital inpatient days"
        },
        {
          "key": "hospital_inpatient_with_assistance_per_stay_copay",
          "type": "number",
          "minimum": 0,
          "label": "Hospital Copay (with assistance, per stay)",
          "description": "Hospital inpatient per stay copay amount with assistance in dollars"
        },
        {
          "key": "hospital_inpatient_without_assistance_per_stay_copay",
          "type": "number",
          "minimum": 0,
          "label": "Hospital Copay (without assistance, per stay)",
          "description": "Hospital inpatient per stay copay amount without assistance in dollars"
        },
        {
          "key": "skilled_nursing_per_day_copay",
          "type": "number",
          "minimum": 0,
          "label": "Skilled Nursing (per day)",
          "description": "Skilled nursing per day copay amount in dollars"
        },
        {
          "key": "skilled_nursing_with_assistance_per_stay_copay",
          "type": "number",
          "minimum": 0,
          "label": "Skilled Nursing (with assistance, per stay)",
          "description": "Skilled nursing per stay copay amount with assistance in dollars"
        }
      ]
    },
    {
      "title": "Emergency Copays",
      "description": "Copays for emergency services",
      "properties": [
        {
          "key": "ambulance_copay",
          "type": "number",
          "minimum": 0,
          "label": "Ambulance Copay",
          "description": "Ambulance service copay amount in dollars"
        },
        {
          "key": "ambulance_with_assistance_copay",
          "type": "number",
          "minimum": 0,
          "label": "Ambulance Copay (with assistance)",
          "description": "Ambulance service copay amount with assistance in dollars"
        },
        {
          "key": "emergency_room_copay",
          "type": "number",
          "minimum": 0,
          "label": "ER Copay",
          "description": "Emergency room visit copay amount in dollars"
        },
        {
          "key": "emergency_with_assistance_copay",
          "type": "number",
          "minimum": 0,
          "label": "ER Copay (with assistance)",
          "description": "Emergency room visit copay amount with assistance in dollars"
        },
        {
          "key": "urgent_care_copay",
          "type": "number",
          "minimum": 0,
          "label": "Urgent Care Copay",
          "description": "Urgent care visit copay amount in dollars"
        }
      ]
    },
    {
      "title": "Additional Benefits",
      "description": "Card, fitness, and transportation benefits",
      "properties": [
        {
          "key": "fitness_benefit",
          "type": "string",
          "label": "Fitness Benefit",
          "description": "Fitness/gym membership benefit description"
        },
        {
          "key": "transportation_benefit",
          "type": "number",
          "minimum": 0,
          "label": "Transportation Benefit",
          "description": "Transportation/rides benefit amount in dollars"
        }
      ]
    },
    {
      "title": "Plan Information",
      "description": "General plan details and descriptions",
      "properties": [
        {
          "key": "rx_cost_share",
          "type": "string",
          "label": "RX Cost Share",
          "description": "Prescription drug cost sharing details (e.g., '20% after deductible')"
        },
        {
          "key": "pharmacy_benefit",
          "type": "string",
          "label": "Pharmacy Benefit",
          "description": "Pharmacy benefit description"
        },
        {
          "key": "service_area",
          "type": "string",
          "label": "Service Area",
          "description": "Service area description (e.g., 'Statewide', 'Multi-state')"
        },
        {
          "key": "summary",
          "type": "string",
          "label": "Summary",
          "description": "Plan summary or overview"
        },
        {
          "key": "notes",
          "type": "string",
          "label": "Notes",
          "description": "General plan notes and additional information"
        },
        {
          "key": "medicaid_eligibility",
          "type": "string",
          "enum": ["Required", "Not Required", "Optional"],
          "label": "Medicaid Eligibility",
          "description": "Medicaid eligibility requirements"
        },
        {
          "key": "transitioned_from",
          "type": "string",
          "label": "Transitioned From",
          "description": "Information about plan transitions or predecessor plans"
        }
      ]
    }
  ],
  "examples": [
    {
      "premium_monthly": 45.50,
      "premium_monthly_with_extra_help": 0,
      "giveback_monthly": 25.00,
      "otc_benefit_quarterly": 100.00,
      "dental_benefit_yearly": 1500.00,
      "hearing_benefit_yearly": 500.00,
      "vision_benefit_yearly": 200.00,
      "primary_care_copay": 0,
      "specialist_copay": 45,
      "hospital_inpatient_per_day_copay": 350,
      "hospital_inpatient_days": 5,
      "moop_annual": 8500,
      "ambulance_copay": 200,
      "emergency_room_copay": 110,
      "urgent_care_copay": 25,
      "medical_deductible": 0,
      "medical_deductible_with_medicaid": 0,
      "pharmacy_benefit": "Tier 1: $0, Tier 2: $5, Tier 3: $47",
      "service_area": "Statewide",
      "medicaid_eligibility": "Not Required"
    }
  ]
} as const
