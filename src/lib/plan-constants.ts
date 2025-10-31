/**
 * Centralized constants for plan types and carriers
 * This is the SINGLE SOURCE OF TRUTH for plan-related types
 *
 * 🎯 NORMALIZED STRUCTURE: Plan types broken down into logical components
 *
 * When adding new plan types or carriers:
 * 1. Add to the appropriate array below ⭐ **ONLY THIS FILE**
 * 2. Run `npm run dump-types` to regenerate TypeScript types
 * 3. Update documentation to reference this file
 */

// Normalized plan type structure - logical breakdown
const TYPE_NETWORKS = ['HMO', 'PPO', 'PFFS', 'MSA'] as const

const TYPE_EXTENSIONS = ['POS', null] as const

const TYPE_SNPS = ['D', 'C', 'I', null] as const

const TYPE_PROGRAMS = ['SNP', 'MA', 'MAPD', 'PDP', 'Supplement', 'Ancillary'] as const

const CARRIERS_ARRAY = [
  'Aetna',
  'Anthem',
  'CareSource',
  'Devoted',
  'GTL',
  'Heartland',
  'Humana',
  'Medico',
  'MedMutual',
  'SummaCare',
  'United',
  'Zing',
  'Other',
] as const

const ENROLLMENT_STATUSES_ARRAY = ['pending', 'active', 'cancelled', 'terminated', 'declined', 'ended'] as const

// Infer types from the arrays
export type TypeNetwork = (typeof TYPE_NETWORKS)[number]
export type TypeExtension = (typeof TYPE_EXTENSIONS)[number]
export type TypeSnp = (typeof TYPE_SNPS)[number]
export type TypeProgram = (typeof TYPE_PROGRAMS)[number]
export type Carrier = (typeof CARRIERS_ARRAY)[number]
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES_ARRAY)[number]

// Normalized plan type structure
export interface PlanTypeStructure {
  type_network: TypeNetwork
  type_extension: TypeExtension
  type_snp: TypeSnp
  type_program: TypeProgram
}

// Export the arrays for runtime use
export const TYPE_NETWORKS_LIST: TypeNetwork[] = [...TYPE_NETWORKS]
export const TYPE_EXTENSIONS_LIST: TypeExtension[] = [...TYPE_EXTENSIONS]
export const TYPE_SNPS_LIST: TypeSnp[] = [...TYPE_SNPS]
export const TYPE_PROGRAMS_LIST: TypeProgram[] = [...TYPE_PROGRAMS]
export const CARRIERS: Carrier[] = [...CARRIERS_ARRAY]
export const ENROLLMENT_STATUSES: EnrollmentStatus[] = [...ENROLLMENT_STATUSES_ARRAY]

// Legacy compatibility - generate compound plan types from structure
export function generateLegacyPlanType(structure: PlanTypeStructure): string {
  const parts: string[] = []

  // Add network
  parts.push(structure.type_network)

  // Add extension if present
  if (structure.type_extension) {
    parts.push(structure.type_extension)
  }

  // Add SNP if present
  if (structure.type_snp) {
    parts.push(`${structure.type_snp}-SNP`)
  }

  return parts.join('-')
}

// Parse legacy plan type strings into normalized structure
export function parseLegacyPlanType(legacyType: string): PlanTypeStructure | null {
  if (!legacyType) return null

  const upper = legacyType.toUpperCase()

  // Handle special programs first
  if (upper.includes('PDP')) return { type_network: 'HMO', type_extension: null, type_snp: null, type_program: 'PDP' }
  if (upper.includes('SUPPLEMENT'))
    return { type_network: 'HMO', type_extension: null, type_snp: null, type_program: 'Supplement' }
  if (upper.includes('ANCILLARY'))
    return { type_network: 'HMO', type_extension: null, type_snp: null, type_program: 'Ancillary' }

  // Determine network
  let type_network: TypeNetwork = 'HMO' // default
  if (upper.includes('PPO')) type_network = 'PPO'
  else if (upper.includes('PFFS')) type_network = 'PFFS'
  else if (upper.includes('MSA')) type_network = 'MSA'

  // Determine extension
  let type_extension: TypeExtension = null
  if (upper.includes('POS')) type_extension = 'POS'

  // Determine SNP
  let type_snp: TypeSnp = null
  if (upper.includes('D-SNP') || upper.includes('DSNP')) type_snp = 'D'
  else if (upper.includes('C-SNP') || upper.includes('CSNP')) type_snp = 'C'
  else if (upper.includes('I-SNP') || upper.includes('ISNP')) type_snp = 'I'

  // Determine program
  let type_program: TypeProgram = 'MA' // default
  if (type_snp) type_program = 'SNP'
  else if (upper.includes('MAPD')) type_program = 'MAPD'

  return {
    type_network,
    type_extension,
    type_snp,
    type_program,
  }
}

/**
 * Maps carrier strings to standardized carriers
 * Simplified version that uses the CARRIERS array directly
 */
export function mapCarrier(value: string | null | undefined): Carrier | null {
  if (!value) return null

  const normalized = value.trim()
  // Case-insensitive lookup
  const found = CARRIERS.find((carrier) => carrier.toLowerCase() === normalized.toLowerCase())
  return found || 'Other'
}
