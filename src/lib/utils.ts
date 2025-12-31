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
      random = ((timestamp + random) % 16) | 0
      timestamp = Math.floor(timestamp / 16)
    } else {
      random = ((perfTime + random) % 16) | 0
      perfTime = Math.floor(perfTime / 16)
    }
    if (char === 'x') {
      return random.toString(16)
    }
    return ((random & 0x3) | 0x8).toString(16)
  })
}

/**
 * Timezone constant for the application (Eastern Time)
 */
const APP_TIMEZONE = 'America/New_York'

/**
 * Convert UTC datetime string to EST components for display
 * @param utcDateString - ISO datetime string in UTC
 * @returns Object with EST date/time components
 */
function utcToEST(utcDateString: string): {
  year: number
  month: number
  day: number
  hours: number
  minutes: number
  seconds: number
} {
  const utcDate = new Date(utcDateString)

  // Use Intl.DateTimeFormat to get EST components
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(utcDate)
  const getPart = (type: string) => {
    const part = parts.find((p) => p.type === type)
    return part ? parseInt(part.value, 10) : 0
  }

  return {
    year: getPart('year'),
    month: getPart('month'),
    day: getPart('day'),
    hours: getPart('hour'),
    minutes: getPart('minute'),
    seconds: getPart('second'),
  }
}

/**
 * Convert EST datetime-local string to UTC ISO string for storage
 * @param estDateTimeLocal - datetime-local string (YYYY-MM-DDTHH:MM) in EST
 * @returns ISO string in UTC
 */
export function estDateTimeLocalToUTC(estDateTimeLocal: string): string {
  // Parse the datetime-local string
  const [datePart, timePart] = estDateTimeLocal.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hours, minutes] = timePart.split(':').map(Number)

  // Create a date string in ISO format for this EST time
  const estDateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`

  // Strategy: We need to find a UTC time that, when converted to EST, equals our target EST time
  // Use iterative adjustment: start with a guess and adjust

  // Start with UTC date using the same components
  const testUtcDate = new Date(`${estDateString}Z`)
  const testEst = utcToEST(testUtcDate.toISOString())

  // Calculate the difference between target and actual EST times
  const targetEstDate = new Date(year, month - 1, day, hours, minutes, 0)
  const actualEstDate = new Date(testEst.year, testEst.month - 1, testEst.day, testEst.hours, testEst.minutes, 0)
  const diffMs = targetEstDate.getTime() - actualEstDate.getTime()

  // Adjust the UTC date by the difference
  // Note: diffMs is in local time, but we need to account for timezone offset
  // The difference tells us how much to adjust the UTC time
  const adjustedUtcDate = new Date(testUtcDate.getTime() + diffMs)

  // Verify the result (one iteration should be enough, but we can refine if needed)
  const finalEst = utcToEST(adjustedUtcDate.toISOString())
  if (
    finalEst.year === year &&
    finalEst.month === month &&
    finalEst.day === day &&
    finalEst.hours === hours &&
    finalEst.minutes === minutes
  ) {
    return adjustedUtcDate.toISOString()
  }

  // If not exact, do one more adjustment
  const finalEstDate = new Date(finalEst.year, finalEst.month - 1, finalEst.day, finalEst.hours, finalEst.minutes, 0)
  const finalDiffMs = targetEstDate.getTime() - finalEstDate.getTime()
  return new Date(adjustedUtcDate.getTime() + finalDiffMs).toISOString()
}

/**
 * Format a datetime string for display (YYYY-MM-DD HH:MM) in EST
 * @param dateString - ISO datetime string or PostgreSQL timestamp (UTC)
 * @returns Formatted datetime string in EST or empty string if invalid
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

    const utcDate = new Date(normalizedDateString)
    if (isNaN(utcDate.getTime())) return ''

    // Convert UTC to EST for display
    const est = utcToEST(normalizedDateString)

    const year = est.year
    const month = String(est.month).padStart(2, '0')
    const day = String(est.day).padStart(2, '0')
    const hours = String(est.hours).padStart(2, '0')
    const minutes = String(est.minutes).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
  } catch {
    return ''
  }
}

export const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tues', 'Wed', 'Thur', 'Fri', 'Sat'] as const

/**
 * Format a datetime string for display with weekday (e.g., Thursday, 2025-11-06 14:36) in EST
 * @param dateString - ISO datetime string or PostgreSQL timestamp (UTC)
 * @returns Formatted datetime string with weekday in EST or empty string if invalid
 */
export function formatDateTimeWithWeekday(dateString: string | null | undefined): string {
  const formatted = formatDateTime(dateString)
  if (!formatted || !dateString) return formatted

  try {
    let normalizedDateString = dateString

    if (dateString.includes(' ') && !dateString.includes('T')) {
      normalizedDateString = dateString.replace(' ', 'T')
      if (normalizedDateString.endsWith('+00')) {
        normalizedDateString = normalizedDateString.replace('+00', 'Z')
      }
    }

    const utcDate = new Date(normalizedDateString)
    if (isNaN(utcDate.getTime())) return formatted

    // Convert UTC to EST for weekday calculation
    const est = utcToEST(normalizedDateString)
    const estDate = new Date(est.year, est.month - 1, est.day, est.hours, est.minutes)
    const weekday = WEEKDAY_NAMES[estDate.getDay()]
    return `${weekday}, ${formatted}`
  } catch {
    return formatted
  }
}

/**
 * Format a datetime string for HTML datetime-local input (YYYY-MM-DDTHH:MM) in EST
 * @param dateString - ISO datetime string or PostgreSQL timestamp (UTC)
 * @returns Formatted datetime string for input in EST or empty string if invalid
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

    const utcDate = new Date(normalizedDateString)
    if (isNaN(utcDate.getTime())) return ''

    // Convert UTC to EST for input display
    const est = utcToEST(normalizedDateString)

    const year = est.year
    const month = String(est.month).padStart(2, '0')
    const day = String(est.day).padStart(2, '0')
    const hours = String(est.hours).padStart(2, '0')
    const minutes = String(est.minutes).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  } catch {
    return ''
  }
}

/**
 * Get current EST time as UTC ISO string for storage
 * This properly converts the current EST time to UTC for database storage
 * @returns ISO string in UTC format representing current EST time
 */
export function getLocalTimeAsUTC(): string {
  const now = new Date()

  // Get current time components in EST
  const est = utcToEST(now.toISOString())

  // Create a date representing this EST time
  const estDateString = `${est.year}-${String(est.month).padStart(2, '0')}-${String(est.day).padStart(2, '0')}T${String(est.hours).padStart(2, '0')}:${String(est.minutes).padStart(2, '0')}:${String(est.seconds).padStart(2, '0')}`

  // Use the helper function to convert EST datetime-local to UTC
  return estDateTimeLocalToUTC(estDateString.replace(' ', 'T').substring(0, 16))
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
