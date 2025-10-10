import { Database } from './supabase-types'

type Plan = Database['public']['Tables']['plans']['Row']

/**
 * Calculate CMS ID from contract and plan numbers
 * Returns the concatenated CMS ID or null if both are missing
 */
export function calculateCmsId(plan: Pick<Plan, 'cms_contract_number' | 'cms_plan_number'>): string | null {
  const contract = plan.cms_contract_number
  const planNumber = plan.cms_plan_number
  
  if (!contract && !planNumber) return null
  
  const parts = [contract, planNumber].filter(Boolean)
  return parts.length > 0 ? parts.join('-') : null
}

/**
 * Format plan display name with CMS ID
 */
export function formatPlanDisplayName(plan: Pick<Plan, 'carrier' | 'name' | 'cms_contract_number' | 'cms_plan_number'>): string {
  const parts = [plan.carrier, plan.name]
  const cmsId = calculateCmsId(plan)
  if (cmsId) {
    parts.push(`(${cmsId})`)
  }
  return parts.filter(Boolean).join(' ')
}
