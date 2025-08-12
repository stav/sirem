import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

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

function mapCarrier(value: string | null | undefined): Database['public']['Enums']['carrier'] | null {
  if (!value) return null
  const v = value.trim()
  const carriers: Record<string, Database['public']['Enums']['carrier']> = {
    United: 'United',
    Humana: 'Humana',
    Devoted: 'Devoted',
    Anthem: 'Anthem',
    MedMutual: 'MedMutual',
    Aetna: 'Aetna',
    GTL: 'GTL',
    Medico: 'Medico',
    CareSource: 'CareSource',
    SummaCare: 'SummaCare',
    Cigna: 'Cigna',
    Heartland: 'Heartland',
    Other: 'Other',
  }
  return carriers[v] ?? 'Other'
}

function mapPlanType(value: string | null | undefined): Database['public']['Enums']['plan_type'] | null {
  if (!value) return null
  const v = value.trim().toUpperCase()
  if (v.includes('HMO-POS') && v.includes('D-SNP')) return 'HMO-POS-D-SNP'
  if (v.includes('HMO-POS') && v.includes('C-SNP')) return 'HMO-POS-C-SNP'
  if (v.includes('HMO-POS')) return 'HMO-POS'
  if (v.includes('PPO')) return 'PPO'
  if (v.includes('D-SNP')) return 'D-SNP'
  if (v.includes('C-SNP')) return 'C-SNP'
  if (v.includes('PDP')) return 'PDP'
  if (v.includes('SUPPLEMENT')) return 'Supplement'
  if (v.includes('ANCILLARY')) return 'Ancillary'
  if (v.includes('HMO')) return 'HMO'
  return null
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
    moop: idx('moop'),
    hospPerDay: header.findIndex((h) => h.startsWith('hospital /day')),
    hospDays: header.findIndex((h) => h.startsWith('hospital days')),
    hospStay: header.findIndex((h) => h.startsWith('hospital stays')),
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
      const hospitalStayCopay = toNumber(r[col.hospStay])
      const perDay = toNumber(r[col.hospPerDay])
      const days = toNumber(r[col.hospDays])
      const computedStay = perDay != null && days != null ? perDay * days : null

      const record: PlanInsert = {
        name: r[col.name] || 'Unnamed Plan',
        plan_type: mapPlanType(r[col.type]),
        carrier: mapCarrier(r[col.carrier]),
        plan_year: toNumber(r[col.year]) ?? new Date().getUTCFullYear(),
        cms_contract_number: contract,
        cms_plan_number: plan,
        premium_monthly: toNumber(r[col.premium]),
        giveback_monthly: toNumber(r[col.giveback]),
        otc_benefit_quarterly: toNumber(r[col.otc]),
        dental_benefit_yearly: toNumber(r[col.dental]),
        vision_benefit_yearly: toNumber(r[col.vision]),
        hearing_benefit_yearly: toNumber(r[col.hearing]),
        primary_care_copay: toNumber(r[col.pcp]),
        specialist_copay: toNumber(r[col.spc]),
        ambulance_copay: toNumber(r[col.ambulance]),
        emergency_room_copay: toNumber(r[col.er]),
        urgent_care_copay: toNumber(r[col.urgent]),
        moop_annual: toNumber(r[col.moop]),
        hospital_inpatient_per_stay_copay: hospitalStayCopay ?? computedStay,
        hospital_inpatient_days: days,
        pharmacy_benefit: null,
        service_area: null,
        counties: null,
        notes: r[col.description] || null,
        metadata: null,
        effective_start: null,
        effective_end: null,
      }

      const key = `${record.cms_contract_number ?? ''}|${record.cms_plan_number ?? ''}|${record.plan_year ?? ''}`
      dedup.set(key, record)
      imported++
    } catch {
      // Count as skipped if essential fields missing
      skipped++
    }
  }

  const batch = Array.from(dedup.values())
  if (batch.length > 0) {
    const { error } = await supabase
      .from('plans')
      .upsert(batch, { onConflict: 'cms_contract_number,cms_plan_number,plan_year' })
    if (error) {
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
