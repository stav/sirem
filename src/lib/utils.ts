import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
