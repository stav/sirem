import type { Database } from '@/lib/supabase'
import type { Json } from '@/lib/supabase-types'
import { supabase } from '@/lib/supabase'
import { parseCsv, normalizeHeader } from '@/lib/csv-utils'
import { parseLegacyPlanType, mapCarrier } from '@/lib/plan-constants'
import { getAllProperties } from '@/lib/plan-metadata-utils'

type PlanInsert = Database['public']['Tables']['plans']['Insert']

/**
 * Configuration mapping CSV column names to metadata field names
 * This eliminates hardcoded field mappings by centralizing the configuration
 */
const CSV_TO_METADATA_MAPPING = {
  // Monthly financials
  premium: 'premium_monthly',
  giveback: 'giveback_monthly',

  // Quarterly benefits
  otc: 'otc_benefit_quarterly',

  // Yearly benefits
  dental: 'dental_benefit_yearly',
  vision: 'vision_benefit_yearly',
  hearing: 'hearing_benefit_yearly',

  // Medical copays
  pcp: 'primary_care_copay',
  spc: 'specialist_copay',
  ambulance: 'ambulance_copay',
  er: 'emergency_room_copay',
  urgent: 'urgent_care_copay',
  hospPerDay: 'hospital_inpatient_per_day_copay',
  hospDays: 'hospital_inpatient_days',

  // Annual limits
  moop: 'moop_annual',

  // Additional information
  rxCostShare: 'pharmacy_benefit',
  description: 'notes',

  // Extended benefits
  card: 'card_benefit',
  fitness: 'fitness_benefit',
  trans: 'transportation_benefit',
  medDeduct: 'medical_deductible',
  rxDeduct: 'rx_deductible_tier345',
  medicaid: 'medicaid_eligibility',
  transitioned: 'transitioned_from',
  summary: 'summary',
} as const

function toNumber(value: string | null | undefined): number | null {
  if (!value) return null
  const cleaned = value.replace(/\$/g, '').replace(/,/g, '').trim()
  if (cleaned === '' || cleaned === '-') return null
  const num = Number(cleaned)
  if (Number.isNaN(num)) return null
  return Math.abs(num)
}

function parseCmsId(id: string | null | undefined): { contract: string | null; plan: string | null } {
  if (!id) return { contract: null, plan: null }
  const parts = id.trim().split('-')
  if (parts.length === 0) return { contract: null, plan: null }
  const contract = parts[0] || null
  const plan = parts.length > 1 ? parts[1] || null : null
  return { contract, plan }
}

// Minimal CSV parser that handles quotes and commas
export async function importPlansCsv(text: string): Promise<{
  success: boolean
  message: string
  stats: { total: number; imported: number; skipped: number; errors: number }
}> {
  const rows = parseCsv(text)
  if (rows.length === 0) {
    return { success: false, message: 'Empty CSV', stats: { total: 0, imported: 0, skipped: 0, errors: 0 } }
  }

  const header = rows[0].map(normalizeHeader)
  const dataRows = rows.slice(1).filter((r) => r.some((c) => c && c.trim() !== ''))

  const idx = (name: string) => header.findIndex((h) => h === name.toLowerCase())
  const col = {
    year: idx('year'),
    carrier: idx('carrier'),
    name: idx('name'),
    type: idx('type'),
    id: header.findIndex((h) => h === 'id' || h.includes('id')), // handle 'ID'
    description: idx('description'),
    premium: idx('premium'),
    giveback: idx('giveback'),
    otc: idx('otc'),
    dental: idx('dental'),
    vision: idx('vision'),
    hearing: idx('hearing'),
    pcp: idx('pcp copay'),
    spc: idx('spc copay'),
    ambulance: idx('ambulance'),
    er: idx('er'),
    urgent: idx('urgent'),
    moop: header.findIndex((h) => h.includes('moop')),
    hospPerDay: header.findIndex((h) => h.startsWith('hospital /day')),
    hospDays: header.findIndex((h) => h.startsWith('hospital days')),
    counties: idx('counties'),
    // New fields from 2026 CSV (benefits is calculated, not imported)
    card: idx('card'),
    fitness: idx('fitness'),
    trans: idx('trans'),
    medDeduct: idx('med deduct'),
    rxDeduct: idx('rx deduct tier345'),
    medicaid: idx('medicaid'),
    transitioned: idx('transitioned'),
    rxCostShare: idx('rx cost share'),
    summary: idx('summary'),
  }

  let imported = 0
  let skipped = 0
  let errors = 0

  // Deduplicate within the CSV on the conflict key to avoid
  // "ON CONFLICT DO UPDATE command cannot affect row a second time"
  const dedup = new Map<string, PlanInsert>()

  for (const r of dataRows) {
    try {
      const { contract, plan } = parseCmsId(r[col.id] || null)
      const days = toNumber(r[col.hospDays])

      // Parse counties if available
      const countiesStr = col.counties >= 0 ? r[col.counties] : null
      const counties = countiesStr
        ? countiesStr
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean)
        : null

      // Extract year from description if not in year column (e.g., "2026 Aetna...")
      let planYear = toNumber(r[col.year])
      if (!planYear && col.description >= 0) {
        const desc = r[col.description]
        const yearMatch = desc?.match(/^(\d{4})\s/)
        if (yearMatch) {
          planYear = Number(yearMatch[1])
        }
      }
      if (!planYear) {
        planYear = new Date().getUTCFullYear()
      }

      // Build metadata object with all plan fields
      const metadata: Record<string, unknown> = {}

      // Dynamically map CSV columns to metadata fields using configuration
      Object.entries(CSV_TO_METADATA_MAPPING).forEach(([csvColumn, metadataField]) => {
        const columnIndex = col[csvColumn as keyof typeof col]

        if (columnIndex >= 0) {
          const value = r[columnIndex]

          // Handle special cases
          if (csvColumn === 'hospDays' && days !== null) {
            metadata[metadataField] = days
          } else if (value && value.trim() !== '') {
            // Determine if this should be a number or string based on schema
            // Use getAllProperties helper to get field schema from hierarchical structure
            const allProperties = getAllProperties()
            const fieldSchema = allProperties[metadataField]
            if (fieldSchema && fieldSchema.type === 'number') {
              const numValue = toNumber(value)
              if (numValue !== null) {
                metadata[metadataField] = numValue
              }
            } else {
              metadata[metadataField] = value
            }
          }
        }
      })

      // Parse the legacy plan type into normalized structure
      const planTypeStructure = parseLegacyPlanType(r[col.type])

      const record: PlanInsert = {
        name: r[col.name] || 'Unnamed Plan',
        type_network: planTypeStructure?.type_network || null,
        type_extension: planTypeStructure?.type_extension || null,
        type_snp: planTypeStructure?.type_snp || null,
        type_program: planTypeStructure?.type_program || null,
        carrier: mapCarrier(r[col.carrier]),
        plan_year: planYear,
        cms_contract_number: contract,
        cms_plan_number: plan,
        cms_geo_segment: '', // Default to empty string for CSV imports
        counties: counties,
        metadata: Object.keys(metadata).length > 0 ? (metadata as Json) : null,
      }

      const key = `${record.cms_contract_number ?? ''}|${record.cms_plan_number ?? ''}|${record.cms_geo_segment ?? ''}|${record.plan_year ?? ''}`
      dedup.set(key, record)
      imported++
    } catch {
      // Count as skipped if essential fields missing
      skipped++
    }
  }

  const batch = Array.from(dedup.values())
  if (batch.length > 0) {
    // Try inserting one record first to debug the issue
    console.log('Sample record:', JSON.stringify(batch[0], null, 2))

    // Clear all existing plans for the year 2026 to avoid conflicts
    const { error: deleteError } = await supabase.from('plans').delete().eq('plan_year', 2026)

    if (deleteError) {
      console.log('Delete warning (non-fatal):', deleteError)
    }

    // Now insert the new plans
    const { error } = await supabase.from('plans').insert(batch)
    if (error) {
      console.error('Upsert error:', error)
      errors = batch.length
      return {
        success: false,
        message: `Failed to import plans: ${error.message}`,
        stats: { total: dataRows.length, imported: 0, skipped, errors },
      }
    }
  }

  return {
    success: true,
    message: `Imported ${imported} plans (${skipped} skipped).`,
    stats: { total: dataRows.length, imported, skipped, errors },
  }
}
