import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a RFC 4122 v4 UUID with broad runtime compatibility.
 * Prefers native implementations when available, falls back to
 * crypto.getRandomValues(), then to a Math.random() variant.
 */
export function generateUUID(): string {
  const globalCrypto = typeof globalThis !== 'undefined' ? (globalThis as { crypto?: Crypto }).crypto : undefined

  if (globalCrypto && typeof globalCrypto.randomUUID === 'function') {
    return globalCrypto.randomUUID()
  }

  if (globalCrypto && typeof globalCrypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16)
    globalCrypto.getRandomValues(bytes)
    // RFC 4122 version 4
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80

    const byteToHex: string[] = []
    for (let i = 0; i < 256; i++) {
      byteToHex[i] = (i + 0x100).toString(16).substring(1)
    }

    return (
      byteToHex[bytes[0]] +
      byteToHex[bytes[1]] +
      byteToHex[bytes[2]] +
      byteToHex[bytes[3]] +
      '-' +
      byteToHex[bytes[4]] +
      byteToHex[bytes[5]] +
      '-' +
      byteToHex[bytes[6]] +
      byteToHex[bytes[7]] +
      '-' +
      byteToHex[bytes[8]] +
      byteToHex[bytes[9]] +
      '-' +
      byteToHex[bytes[10]] +
      byteToHex[bytes[11]] +
      byteToHex[bytes[12]] +
      byteToHex[bytes[13]] +
      byteToHex[bytes[14]] +
      byteToHex[bytes[15]]
    )
  }

  // Non-crypto fallback
  let timestamp = new Date().getTime()
  let perfTime = 0
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    perfTime = performance.now()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    let random = Math.random() * 16
    if (timestamp > 0) {
      random = (timestamp + random) % 16 | 0
      timestamp = Math.floor(timestamp / 16)
    } else {
      random = (perfTime + random) % 16 | 0
      perfTime = Math.floor(perfTime / 16)
    }
    if (char === 'x') {
      return random.toString(16)
    }
    return ((random & 0x3) | 0x8).toString(16)
  })
}

/**
 * Format a datetime string for display (YYYY-MM-DD HH:MM)
 * @param dateString - ISO datetime string or PostgreSQL timestamp (UTC)
 * @returns Formatted datetime string or empty string if invalid
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return ''
  try {
    // Handle both ISO format ("2025-08-05T17:11:00.000Z") and PostgreSQL format ("2025-08-05 17:11:00+00")
    let normalizedDateString = dateString

    // Convert PostgreSQL format to ISO format if needed
    if (dateString.includes(' ') && !dateString.includes('T')) {
      // Replace space with T and handle timezone
      normalizedDateString = dateString.replace(' ', 'T')
      // If it ends with +00, replace with Z for proper UTC format
      if (normalizedDateString.endsWith('+00')) {
        normalizedDateString = normalizedDateString.replace('+00', 'Z')
      }
    }

    const date = new Date(normalizedDateString)
    if (isNaN(date.getTime())) return ''

    // Display UTC time components (no timezone conversion)
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    const hours = String(date.getUTCHours()).padStart(2, '0')
    const minutes = String(date.getUTCMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
  } catch {
    return ''
  }
}

/**
 * Format a datetime string for HTML datetime-local input (YYYY-MM-DDTHH:MM)
 * @param dateString - ISO datetime string or PostgreSQL timestamp (UTC)
 * @returns Formatted datetime string for input or empty string if invalid
 */
export function formatDateTimeForInput(dateString: string | null | undefined): string {
  if (!dateString) return ''
  try {
    // Handle both ISO format ("2025-08-05T17:11:00.000Z") and PostgreSQL format ("2025-08-05 17:11:00+00")
    let normalizedDateString = dateString

    // Convert PostgreSQL format to ISO format if needed
    if (dateString.includes(' ') && !dateString.includes('T')) {
      // Replace space with T and handle timezone
      normalizedDateString = dateString.replace(' ', 'T')
      // If it ends with +00, replace with Z for proper UTC format
      if (normalizedDateString.endsWith('+00')) {
        normalizedDateString = normalizedDateString.replace('+00', 'Z')
      }
    }

    const date = new Date(normalizedDateString)
    if (isNaN(date.getTime())) return ''

    // Get UTC time components (no timezone conversion)
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    const hours = String(date.getUTCHours()).padStart(2, '0')
    const minutes = String(date.getUTCMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  } catch {
    return ''
  }
}

/**
 * Formats a time difference into a human-readable string with years, months, and days
 * @param daysDiff - Number of days difference (positive for future, negative for past)
 * @param isCompleted - Whether this is for a completed item (affects the suffix)
 * @returns Formatted string like "1y 3m 2d ago" or "+1y 3m 2d"
 */
export function formatTimeDelta(daysDiff: number, isCompleted: boolean = false): string {
  const absDays = Math.abs(daysDiff)

  if (absDays === 0) {
    return isCompleted ? '0d ago' : '0d'
  }

  const years = Math.floor(absDays / 365)
  const months = Math.floor((absDays % 365) / 30)
  const days = absDays % 30

  const parts: string[] = []

  if (years > 0) {
    parts.push(`${years}y`)
  }
  if (months > 0) {
    parts.push(`${months}m`)
  }
  if (days > 0 || parts.length === 0) {
    parts.push(`${days}d`)
  }

  const formatted = parts.join(' ')

  if (isCompleted) {
    return `${formatted} ago`
  } else {
    return daysDiff > 0 ? `+${formatted}` : `-${formatted}`
  }
}
