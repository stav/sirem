import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
