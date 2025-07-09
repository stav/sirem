export function formatLocalDate(dateString: string) {
  if (!dateString) return ''
  const [year, month, day] = dateString.split('T')[0].split('-')
  return `${month}/${day}/${year}`
}

export function calculateAge(birthdate: string | null | undefined): number | null {
  if (!birthdate) return null

  const birthDate = new Date(birthdate)
  const today = new Date()

  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}

export function getDaysPast65(birthdate: string | null | undefined): string | null {
  if (!birthdate) return null

  const birthDate = new Date(birthdate)
  const today = new Date()

  // Calculate 65th birthday
  const sixtyFifthBirthday = new Date(birthDate)
  sixtyFifthBirthday.setFullYear(birthDate.getFullYear() + 65)

  // Calculate days difference (can be negative if not yet 65)
  const timeDiff = today.getTime() - sixtyFifthBirthday.getTime()
  const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24))

  // If they haven't turned 65 yet, show negative days
  if (daysDiff < 0) {
    if (daysDiff >= -60) {
      if (daysDiff === -1) return '-1d'
      return `${daysDiff}d`
    } else {
      const monthsDiff = Math.floor(Math.abs(daysDiff) / 30)
      if (monthsDiff >= 12) {
        const yearsDiff = Math.floor(monthsDiff / 12)
        const remainingMonths = monthsDiff % 12
        if (remainingMonths === 0) {
          return yearsDiff === 1 ? '-1y' : `-${yearsDiff}y`
        } else {
          return yearsDiff === 1 ? `-1y${remainingMonths}m` : `-${yearsDiff}y${remainingMonths}m`
        }
      } else {
        return monthsDiff === 1 ? '-1m' : `-${monthsDiff}m`
      }
    }
  }

  // If they have turned 65
  if (daysDiff === 0) return 'today'
  if (daysDiff === 1) return '+1d'

  // For periods longer than 60 days, show months and years
  if (daysDiff > 60) {
    const monthsDiff = Math.floor(daysDiff / 30)
    if (monthsDiff >= 12) {
      const yearsDiff = Math.floor(monthsDiff / 12)
      const remainingMonths = monthsDiff % 12
      if (remainingMonths === 0) {
        return yearsDiff === 1 ? '+1y' : `+${yearsDiff}y`
      } else {
        return yearsDiff === 1 ? `+1y${remainingMonths}m` : `+${yearsDiff}y${remainingMonths}m`
      }
    } else {
      return monthsDiff === 1 ? '+1m' : `+${monthsDiff}m`
    }
  }

  return `+${daysDiff}d`
}

/**
 * Returns the raw number of days past 65th birthday (T65 days)
 * Positive number = days past 65th birthday
 * Negative number = days until 65th birthday
 * Returns null if no birthdate
 */
export function getT65Days(birthdate: string | null | undefined): number | null {
  if (!birthdate) return null

  const birthDate = new Date(birthdate)
  const today = new Date()

  // Calculate 65th birthday
  const sixtyFifthBirthday = new Date(birthDate)
  sixtyFifthBirthday.setFullYear(birthDate.getFullYear() + 65)

  // Calculate days difference (can be negative if not yet 65)
  const timeDiff = today.getTime() - sixtyFifthBirthday.getTime()
  const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24))

  return daysDiff
}

export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return ''
  const cleaned = ('' + phone).replace(/\D/g, '')
  if (cleaned.length !== 10) return phone
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`
  }
  return phone
}

export function formatMBI(mbi: string | null | undefined): string {
  if (!mbi) return ''
  // Remove any non-alphanumeric characters and format as XXXX-XXXX-XXXX
  const cleaned = mbi.replace(/[^A-Z0-9]/gi, '')
  if (cleaned.length !== 11) return mbi
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8, 11)}`
}

export function getStatusBadge(status: string | null) {
  if (!status) return null

  switch (status) {
    case 'Client':
      return {
        className: 'px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 border border-green-200',
        text: status,
      }
    case 'New':
      return {
        className: 'px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-800 border border-gray-300',
        text: status,
      }
    case 'Contacted':
      return {
        className: 'px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-800 border border-yellow-400',
        text: status,
      }
    case 'Engaged':
      return {
        className: 'px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 border border-blue-400',
        text: status,
      }
    default:
      return {
        className: 'text-xs',
        text: status,
        variant: 'outline' as const,
      }
  }
}
