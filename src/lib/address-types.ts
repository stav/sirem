export enum AddressType {
  PRIMARY = 'primary',
  MAILING = 'mailing',
  BILLING = 'billing',
  SHIPPING = 'shipping',
  WORK = 'work',
  HOME = 'home',
  OTHER = 'other',
}

export const ADDRESS_TYPE_LABELS: Record<AddressType, string> = {
  [AddressType.PRIMARY]: 'Primary',
  [AddressType.MAILING]: 'Mailing',
  [AddressType.BILLING]: 'Billing',
  [AddressType.SHIPPING]: 'Shipping',
  [AddressType.WORK]: 'Work',
  [AddressType.HOME]: 'Home',
  [AddressType.OTHER]: 'Other',
}

export const ADDRESS_TYPE_COLORS: Record<AddressType, string> = {
  [AddressType.PRIMARY]: 'bg-blue-100 text-blue-800 border-blue-200',
  [AddressType.MAILING]: 'bg-green-100 text-green-800 border-green-200',
  [AddressType.BILLING]: 'bg-purple-100 text-purple-800 border-purple-200',
  [AddressType.SHIPPING]: 'bg-orange-100 text-orange-800 border-orange-200',
  [AddressType.WORK]: 'bg-gray-100 text-gray-800 border-gray-200',
  [AddressType.HOME]: 'bg-pink-100 text-pink-800 border-pink-200',
  [AddressType.OTHER]: 'bg-gray-100 text-gray-800 border-gray-200',
}

export interface AddressTypeOption {
  value: AddressType
  label: string
}

export const ADDRESS_TYPE_OPTIONS: AddressTypeOption[] = Object.values(AddressType).map((type) => ({
  value: type,
  label: ADDRESS_TYPE_LABELS[type],
}))

/**
 * Get all valid address type values as an array
 */
export const getValidAddressTypes = (): string[] => Object.values(AddressType)

/**
 * Check if a string is a valid address type
 */
export const isValidAddressType = (type: string): type is AddressType => {
  return Object.values(AddressType).includes(type as AddressType)
}

/**
 * Get the display label for an address type
 */
export const getAddressTypeLabel = (type: string): string => {
  if (isValidAddressType(type)) {
    return ADDRESS_TYPE_LABELS[type]
  }
  return type.charAt(0).toUpperCase() + type.slice(1)
}

/**
 * Get the color classes for an address type
 */
export const getAddressTypeColor = (type: string): string => {
  if (isValidAddressType(type)) {
    return ADDRESS_TYPE_COLORS[type]
  }
  return ADDRESS_TYPE_COLORS[AddressType.OTHER]
}
