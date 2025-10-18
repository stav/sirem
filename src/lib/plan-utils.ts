import { Database } from './supabase-types'

type Plan = Database['public']['Tables']['plans']['Row']

/**
 * Calculate CMS ID from contract and plan numbers
 * Returns the concatenated CMS ID or null if both are missing
 */
export function calculateCmsId(plan: Pick<Plan, 'cms_contract_number' | 'cms_plan_number' | 'cms_geo_segment'>): string | null {
  const contract = plan.cms_contract_number
  const planNumber = plan.cms_plan_number
  const geoSegment = plan.cms_geo_segment
  
  if (!contract && !planNumber && !geoSegment) return null
  
  const parts = [contract, planNumber, geoSegment].filter(Boolean)
  return parts.length > 0 ? parts.join('-') : null
}

/**
 * Build plan type string from normalized fields
 * Combines type_network, type_extension, type_snp, and type_program into a readable string
 */
export function buildPlanTypeString(plan: Pick<Plan, 'type_network' | 'type_extension' | 'type_snp' | 'type_program'>): string {
  const parts = []
  
  // Add network type (HMO, PPO, PFFS, MSA)
  if (plan.type_network) {
    parts.push(plan.type_network)
  }
  
  // Add extension type (POS)
  if (plan.type_extension) {
    parts.push(plan.type_extension)
  }
  
  // Add SNP type (D-SNP, C-SNP, I-SNP)
  if (plan.type_snp) {
    parts.push(`${plan.type_snp}-SNP`)
  }
  
  // Add program type (only if it's not already included in SNP or is not MA)
  if (plan.type_program && plan.type_program !== 'MA' && plan.type_program !== 'SNP') {
    parts.push(plan.type_program)
  }
  
  return parts.join('-') || ''
}

/**
 * Format plan display name with CMS ID
 */
export function formatPlanDisplayName(plan: Pick<Plan, 'carrier' | 'name' | 'cms_contract_number' | 'cms_plan_number' | 'cms_geo_segment'>): string {
  const parts = [plan.carrier, plan.name]
  const cmsId = calculateCmsId(plan)
  if (cmsId) {
    parts.push(`(${cmsId})`)
  }
  return parts.filter(Boolean).join(' ')
}
