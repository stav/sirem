import type { Database } from '@/lib/supabase'
import { AddressType, isValidAddressType, getAddressTypeLabel } from '@/lib/address-types'

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

export function getAddressType(address: Address): string {
  return address.address_type || AddressType.PRIMARY
}

export function getAddressTypeDisplay(address: Address): string {
  const type = getAddressType(address)
  return getAddressTypeLabel(type)
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

  // Validate address type
  if (address.address_type && !isValidAddressType(address.address_type)) {
    errors.push('Invalid address type')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function hasValidMailingAddress(addresses: Address[]): boolean {
  return addresses.some((address) => address.address1 && address.city && address.state_code && address.postal_code)
}

export function getPrimaryAddress(addresses: Address[]): Address | null {
  // First try to find a primary address
  const primary = addresses.find((addr) => addr.address_type === AddressType.PRIMARY)
  if (primary) return primary

  // Fallback to first address with valid data
  return addresses.find((addr) => addr.address1 && addr.city) || null
}

export function getAddressesByType(addresses: Address[], type: string): Address[] {
  return addresses.filter((addr) => addr.address_type === type)
}

export function isDuplicateAddress(newAddress: Partial<Address>, existingAddresses: Address[]): boolean {
  return existingAddresses.some(
    (existing) =>
      existing.address1?.toLowerCase().trim() === newAddress.address1?.toLowerCase().trim() &&
      existing.city?.toLowerCase().trim() === newAddress.city?.toLowerCase().trim() &&
      existing.postal_code?.toLowerCase().trim() === newAddress.postal_code?.toLowerCase().trim()
  )
}
