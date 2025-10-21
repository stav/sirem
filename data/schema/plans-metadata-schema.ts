/**
 * Plans Metadata Schema
 * 
 * This file exports the schema data for the plans metadata fields.
 * It serves as a TypeScript module that can be imported by components.
 */

export const plansMetadataSchema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://sirem.app/schemas/plans-metadata.json",
  "title": "Plans Metadata Schema",
  "description": "Schema definition for the metadata JSONB field in the plans table. ⚠️ IMPORTANT: This TypeScript Schema must be kept in sync with the TypeScript interface in src/lib/plan-metadata-utils.ts. 🔄 DYNAMIC: New fields may be added, changed, or removed at any time as business requirements evolve.",
  "type": "object",
  "additionalProperties": true,
  "sections": {
    "dates": {
      "title": "Plan Dates",
      "description": "Plan effective dates and periods",
      "order": 1
    },
    "monthly_financials": {
      "title": "Monthly Financials",
      "description": "Monthly premiums, givebacks, and benefits",
      "order": 2
    },
    "quarterly_benefits": {
      "title": "Quarterly Benefits",
      "description": "Quarterly benefits and allowances",
      "order": 3
    },
    "yearly_benefits": {
      "title": "Yearly Benefits",
      "description": "Annual benefits for dental, hearing, and vision",
      "order": 4
    },
    "medical_copays": {
      "title": "Medical Copays",
      "description": "Copays for medical services and visits",
      "order": 5
    },
    "deductibles": {
      "title": "Deductibles",
      "description": "Medical and prescription drug deductibles",
      "order": 6
    },
    "annual_limits": {
      "title": "Annual Limits",
      "description": "Maximum out-of-pocket and annual limits",
      "order": 7
    },
    "additional_benefits": {
      "title": "Additional Benefits",
      "description": "Card, fitness, and transportation benefits",
      "order": 8
    },
    "plan_information": {
      "title": "Plan Information",
      "description": "General plan details and descriptions",
      "order": 9
    }
  },
  "properties": {
    "effective_start": {
      "type": "string",
      "format": "date",
      "label": "Effective Start Date",
      "section": "dates",
      "description": "Plan effective start date in YYYY-MM-DD format"
    },
    "effective_end": {
      "type": "string",
      "format": "date",
      "label": "Effective End Date",
      "section": "dates",
      "description": "Plan effective end date in YYYY-MM-DD format"
    },
    "premium_monthly": {
      "type": "number",
      "minimum": 0,
      "label": "Premium (monthly)",
      "section": "monthly_financials",
      "description": "Monthly premium amount in dollars"
    },
    "premium_monthly_with_extra_help": {
      "type": "number",
      "minimum": 0,
      "label": "Premium (monthly, with Extra Help)",
      "section": "monthly_financials",
      "description": "Monthly premium for LIS/Extra Help recipients (typically $0)"
    },
    "giveback_monthly": {
      "type": "number",
      "minimum": 0,
      "label": "Giveback (monthly)",
      "section": "monthly_financials",
      "description": "Monthly giveback/rebate amount in dollars"
    },
    "otc_benefit_quarterly": {
      "type": "number",
      "minimum": 0,
      "label": "OTC Benefit (quarterly)",
      "section": "quarterly_benefits",
      "description": "Quarterly OTC (Over-the-Counter) benefit amount in dollars"
    },
    "dental_benefit_yearly": {
      "type": "number",
      "minimum": 0,
      "label": "Dental (yearly)",
      "section": "yearly_benefits",
      "description": "Annual dental benefit amount in dollars"
    },
    "hearing_benefit_yearly": {
      "type": "number",
      "minimum": 0,
      "label": "Hearing (yearly)",
      "section": "yearly_benefits",
      "description": "Annual hearing benefit amount in dollars"
    },
    "vision_benefit_yearly": {
      "type": "number",
      "minimum": 0,
      "label": "Vision (yearly)",
      "section": "yearly_benefits",
      "description": "Annual vision benefit amount in dollars"
    },
    "primary_care_copay": {
      "type": "number",
      "minimum": 0,
      "label": "PCP Copay",
      "section": "medical_copays",
      "description": "Primary care physician copay amount in dollars"
    },
    "specialist_copay": {
      "type": "number",
      "minimum": 0,
      "label": "Specialist Copay",
      "section": "medical_copays",
      "description": "Specialist physician copay amount in dollars"
    },
    "hospital_inpatient_per_day_copay": {
      "type": "number",
      "minimum": 0,
      "label": "Hospital Copay (daily)",
      "section": "medical_copays",
      "description": "Daily hospital inpatient copay amount in dollars"
    },
    "hospital_inpatient_days": {
      "type": "integer",
      "minimum": 0,
      "label": "Hospital Days",
      "section": "medical_copays",
      "description": "Number of covered hospital inpatient days"
    },
    "hospital_inpatient_with_assistance_per_stay_copay": {
      "type": "number",
      "minimum": 0,
      "label": "Hospital Copay (with assistance, per stay)",
      "section": "medical_copays",
      "description": "Hospital inpatient per stay copay amount with assistance in dollars"
    },
    "hospital_inpatient_without_assistance_per_stay_copay": {
      "type": "number",
      "minimum": 0,
      "label": "Hospital Copay (without assistance, per stay)",
      "section": "medical_copays",
      "description": "Hospital inpatient per stay copay amount without assistance in dollars"
    },
    "moop_annual": {
      "type": "number",
      "minimum": 0,
      "label": "MOOP (annual)",
      "section": "annual_limits",
      "description": "Maximum Out-of-Pocket annual limit in dollars"
    },
    "ambulance_copay": {
      "type": "number",
      "minimum": 0,
      "label": "Ambulance Copay",
      "section": "medical_copays",
      "description": "Ambulance service copay amount in dollars"
    },
    "ambulance_with_assistance_copay": {
      "type": "number",
      "minimum": 0,
      "label": "Ambulance Copay (with assistance)",
      "section": "medical_copays",
      "description": "Ambulance service copay amount with assistance in dollars"
    },
    "emergency_room_copay": {
      "type": "number",
      "minimum": 0,
      "label": "ER Copay",
      "section": "medical_copays",
      "description": "Emergency room visit copay amount in dollars"
    },
    "emergency_with_assistance_copay": {
      "type": "number",
      "minimum": 0,
      "label": "ER Copay (with assistance)",
      "section": "medical_copays",
      "description": "Emergency room visit copay amount with assistance in dollars"
    },
    "urgent_care_copay": {
      "type": "number",
      "minimum": 0,
      "label": "Urgent Care Copay",
      "section": "medical_copays",
      "description": "Urgent care visit copay amount in dollars"
    },
    "skilled_nursing_per_day_copay": {
      "type": "number",
      "minimum": 0,
      "label": "Skilled Nursing (per day)",
      "section": "medical_copays",
      "description": "Skilled nursing per day copay amount in dollars"
    },
    "skilled_nursing_with_assistance_per_stay_copay": {
      "type": "number",
      "minimum": 0,
      "label": "Skilled Nursing (with assistance, per stay)",
      "section": "medical_copays",
      "description": "Skilled nursing per stay copay amount with assistance in dollars"
    },
    "medical_deductible": {
      "type": "number",
      "minimum": 0,
      "label": "Medical Deductible",
      "section": "deductibles",
      "description": "Standard medical deductible amount in dollars"
    },
    "medical_deductible_with_medicaid": {
      "type": "number",
      "minimum": 0,
      "label": "Medical Deductible (with Medicaid)",
      "section": "deductibles",
      "description": "Medical deductible for Medicaid cost-sharing recipients (typically $0)"
    },
    "rx_deductible_tier345": {
      "type": "number",
      "minimum": 0,
      "label": "RX Deductible (Tiers 3-5)",
      "section": "deductibles",
      "description": "Prescription drug deductible for tiers 3, 4, and 5 in dollars"
    },
    "rx_cost_share": {
      "type": "string",
      "label": "RX Cost Share",
      "section": "plan_information",
      "description": "Prescription drug cost sharing details (e.g., '20% after deductible')"
    },
    "pharmacy_benefit": {
      "type": "string",
      "label": "Pharmacy Benefit",
      "section": "plan_information",
      "description": "Pharmacy benefit description"
    },
    "service_area": {
      "type": "string",
      "label": "Service Area",
      "section": "plan_information",
      "description": "Service area description (e.g., 'Statewide', 'Multi-state')"
    },
    "summary": {
      "type": "string",
      "label": "Summary",
      "section": "plan_information",
      "description": "Plan summary or overview"
    },
    "notes": {
      "type": "string",
      "label": "Notes",
      "section": "plan_information",
      "description": "General plan notes and additional information"
    },
    "card_benefit": {
      "type": "number",
      "minimum": 0,
      "label": "Card Benefit",
      "section": "additional_benefits",
      "description": "Prepaid debit card benefit amount in dollars"
    },
    "fitness_benefit": {
      "type": "string",
      "label": "Fitness Benefit",
      "section": "additional_benefits",
      "description": "Fitness/gym membership benefit description"
    },
    "transportation_benefit": {
      "type": "number",
      "minimum": 0,
      "label": "Transportation Benefit",
      "section": "additional_benefits",
      "description": "Transportation/rides benefit amount in dollars"
    },
    "medicaid_eligibility": {
      "type": "string",
      "enum": ["Required", "Not Required", "Optional"],
      "label": "Medicaid Eligibility",
      "section": "plan_information",
      "description": "Medicaid eligibility requirements"
    },
    "transitioned_from": {
      "type": "string",
      "label": "Transitioned From",
      "section": "plan_information",
      "description": "Information about plan transitions or predecessor plans"
    }
  },
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
