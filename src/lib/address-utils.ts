import type { Database } from '@/lib/supabase'

type Address = Database['public']['Tables']['addresses']['Row']

export function formatAddress(address: Address): string {
  const parts = [address.address1, address.address2, address.city, address.state_code, address.postal_code].filter(
    Boolean
  )

  return parts.join(', ')
}

export function formatAddressMultiLine(address: Address): string {
  const lines = []

  if (address.address1) lines.push(address.address1)
  if (address.address2) lines.push(address.address2)

  const cityStateZip = [address.city, address.state_code, address.postal_code].filter(Boolean).join(', ')
  if (cityStateZip) lines.push(cityStateZip)

  if (address.county) lines.push(address.county)

  return lines.join('\n')
}

export function getAddressType(): string {
  // You can add logic here to determine address type based on various criteria
  // For now, we'll return a simple type
  return 'Primary'
}

export function validateAddress(address: Partial<Address>): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!address.address1?.trim()) {
    errors.push('Address line 1 is required')
  }

  if (!address.city?.trim()) {
    errors.push('City is required')
  }

  if (!address.state_code?.trim()) {
    errors.push('State is required')
  }

  if (!address.postal_code?.trim()) {
    errors.push('Postal code is required')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
