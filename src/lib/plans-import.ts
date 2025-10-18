import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'
import type { Json } from '@/lib/supabase-types'
import { parseLegacyPlanType, mapCarrier } from '@/lib/plan-constants'

type PlanInsert = Database['public']['Tables']['plans']['Insert']

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
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let current: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const next = text[i + 1]
    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        field += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        current.push(field)
        field = ''
      } else if (char === '\n') {
        current.push(field)
        rows.push(current)
        current = []
        field = ''
      } else if (char === '\r') {
        // skip
      } else {
        field += char
      }
    }
  }
  // push last
  current.push(field)
  rows.push(current)
  return rows
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase()
}

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
      
      // Core plan benefits
      if (col.premium >= 0) metadata.premium_monthly = toNumber(r[col.premium])
      if (col.giveback >= 0) metadata.giveback_monthly = toNumber(r[col.giveback])
      if (col.otc >= 0) metadata.otc_benefit_quarterly = toNumber(r[col.otc])
      if (col.dental >= 0) metadata.dental_benefit_yearly = toNumber(r[col.dental])
      if (col.vision >= 0) metadata.vision_benefit_yearly = toNumber(r[col.vision])
      if (col.hearing >= 0) metadata.hearing_benefit_yearly = toNumber(r[col.hearing])
      if (col.pcp >= 0) metadata.primary_care_copay = toNumber(r[col.pcp])
      if (col.spc >= 0) metadata.specialist_copay = toNumber(r[col.spc])
      if (col.ambulance >= 0) metadata.ambulance_copay = toNumber(r[col.ambulance])
      if (col.er >= 0) metadata.emergency_room_copay = toNumber(r[col.er])
      if (col.urgent >= 0) metadata.urgent_care_copay = toNumber(r[col.urgent])
      if (col.moop >= 0) metadata.moop_annual = toNumber(r[col.moop])
      if (col.hospPerDay >= 0) metadata.hospital_inpatient_per_day_copay = toNumber(r[col.hospPerDay])
      if (days !== null) metadata.hospital_inpatient_days = days
      if (col.rxCostShare >= 0 && r[col.rxCostShare]) metadata.pharmacy_benefit = r[col.rxCostShare]
      if (r[col.description]) metadata.notes = r[col.description]
      
      // Additional benefits
      if (col.card >= 0 && r[col.card]) metadata.card_benefit = r[col.card]
      if (col.fitness >= 0 && r[col.fitness]) metadata.fitness_benefit = r[col.fitness]
      if (col.trans >= 0 && r[col.trans]) metadata.transportation_benefit = r[col.trans]
      if (col.medDeduct >= 0 && r[col.medDeduct]) metadata.medical_deductible = r[col.medDeduct]
      if (col.rxDeduct >= 0 && r[col.rxDeduct]) metadata.rx_deductible_tier345 = r[col.rxDeduct]
      if (col.medicaid >= 0 && r[col.medicaid]) metadata.medicaid_eligibility = r[col.medicaid]
      if (col.transitioned >= 0 && r[col.transitioned]) metadata.transitioned_from = r[col.transitioned]
      if (col.rxCostShare >= 0 && r[col.rxCostShare]) metadata.rx_cost_share = r[col.rxCostShare]
      if (col.summary >= 0 && r[col.summary]) metadata.summary = r[col.summary]

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
            metadata: Object.keys(metadata).length > 0 ? metadata as Json : null,
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
    const { error: deleteError } = await supabase
      .from('plans')
      .delete()
      .eq('plan_year', 2026)
    
    if (deleteError) {
      console.log('Delete warning (non-fatal):', deleteError)
    }
    
    // Now insert the new plans
    const { error } = await supabase
      .from('plans')
      .insert(batch)
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
