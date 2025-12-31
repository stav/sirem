import type { Database } from './supabase'
import { getDisplayDate as getActionDisplayDate } from './action-utils'

// Optimized type for dashboard contacts
export type DashboardContact = Pick<
  Database['public']['Tables']['contacts']['Row'],
  'id' | 'first_name' | 'last_name' | 'birthdate' | 'phone' | 'email' | 'status' | 'created_at' | 'updated_at'
> & {
  addresses?: Pick<Database['public']['Tables']['addresses']['Row'], 'address1' | 'city' | 'address_type'>[]
}

export type Action = Database['public']['Tables']['actions']['Row'] & {
  contact: {
    id: string
    first_name: string
    last_name: string
  } | null
}

export interface ContactWithBirthday extends DashboardContact {
  daysUntilBirthday: number
}

export interface DashboardData {
  totalContacts: number
  totalActions: number
  completedActions: number
  pendingActions: number
  overdueActions: number
  upcomingActions: Action[]
  highPriorityActions: Action[]
  mediumPriorityActions: Action[]
  upcoming65: ContactWithBirthday[]
  recent65: ContactWithBirthday[]
  upcomingBirthdays: ContactWithBirthday[]
  pastBirthdays: ContactWithBirthday[]
}

export function getDaysUntilBirthday(birthdate: string): number {
  if (!birthdate) return Infinity

  const today = new Date()
  const birthDate = new Date(birthdate)

  // Use UTC methods for consistency
  const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
  const birthDateUTC = new Date(Date.UTC(birthDate.getUTCFullYear(), birthDate.getUTCMonth(), birthDate.getUTCDate()))

  // Create this year's birthday in UTC
  const thisYearBirthday = new Date(
    Date.UTC(todayUTC.getUTCFullYear(), birthDateUTC.getUTCMonth(), birthDateUTC.getUTCDate())
  )

  // If this year's birthday has passed, calculate for next year
  if (thisYearBirthday < todayUTC) {
    thisYearBirthday.setUTCFullYear(todayUTC.getUTCFullYear() + 1)
  }

  const diffTime = thisYearBirthday.getTime() - todayUTC.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

export function getUpcomingBirthdays(contacts: DashboardContact[], daysRange: number = 100): ContactWithBirthday[] {
  return contacts
    .filter((contact) => contact.birthdate)
    .map((contact) => ({
      ...contact,
      daysUntilBirthday: getDaysUntilBirthday(contact.birthdate!),
    }))
    .filter((contact) => contact.daysUntilBirthday <= daysRange)
    .sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday)
}

export function getPastBirthdays(contacts: DashboardContact[], daysRange: number = 60): ContactWithBirthday[] {
  return contacts
    .filter((contact) => contact.birthdate)
    .map((contact) => {
      const daysUntilBirthday = getDaysUntilBirthday(contact.birthdate!)
      // For past birthdays, we want days that are negative (birthday has passed)
      const daysSinceBirthday = daysUntilBirthday > 0 ? 365 - daysUntilBirthday : Math.abs(daysUntilBirthday)
      return {
        ...contact,
        daysUntilBirthday: -daysSinceBirthday, // Negative to indicate past
      }
    })
    .filter((contact) => contact.daysUntilBirthday >= -daysRange && contact.daysUntilBirthday < 0)
    .sort((a, b) => b.daysUntilBirthday - a.daysUntilBirthday) // Sort by most recent first
}

export function getDaysUntil65(birthdate: string): number {
  if (!birthdate) return Infinity

  const today = new Date()
  const birthDate = new Date(birthdate)

  // Use UTC methods for consistency
  const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
  const birthDateUTC = new Date(Date.UTC(birthDate.getUTCFullYear(), birthDate.getUTCMonth(), birthDate.getUTCDate()))

  // Calculate the date when they turn 65 in UTC
  const turning65Date = new Date(
    Date.UTC(birthDateUTC.getUTCFullYear() + 65, birthDateUTC.getUTCMonth(), birthDateUTC.getUTCDate())
  )

  // If they've already turned 65, calculate how many days ago
  if (turning65Date < todayUTC) {
    const diffTime = todayUTC.getTime() - turning65Date.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return -diffDays // Negative to indicate past
  }

  // If they haven't turned 65 yet, calculate days until they do
  const diffTime = turning65Date.getTime() - todayUTC.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

export function getUpcoming65(contacts: DashboardContact[], daysRange: number = 150): ContactWithBirthday[] {
  return contacts
    .filter((contact) => contact.birthdate)
    .map((contact) => ({
      ...contact,
      daysUntilBirthday: getDaysUntil65(contact.birthdate!),
    }))
    .filter((contact) => contact.daysUntilBirthday >= 0 && contact.daysUntilBirthday <= daysRange)
    .sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday)
}

export function getRecent65(contacts: DashboardContact[], daysRange: number = 60): ContactWithBirthday[] {
  return contacts
    .filter((contact) => contact.birthdate)
    .map((contact) => ({
      ...contact,
      daysUntilBirthday: getDaysUntil65(contact.birthdate!),
    }))
    .filter((contact) => contact.daysUntilBirthday < 0 && contact.daysUntilBirthday >= -daysRange)
    .sort((a, b) => b.daysUntilBirthday - a.daysUntilBirthday) // Sort by most recent first
}

export function calculateDashboardData(contacts: DashboardContact[], actions: Action[]): DashboardData {
  // Calculate metrics
  const totalContacts = contacts.length
  const totalActions = actions.length
  const completedActions = actions.filter((a) => a.completed_date).length
  const pendingActions = totalActions - completedActions

  // Use UTC for overdue comparison
  const todayUTC = new Date()
  const todayDateUTC = new Date(Date.UTC(todayUTC.getUTCFullYear(), todayUTC.getUTCMonth(), todayUTC.getUTCDate()))
  const overdueActions = actions.filter((a) => {
    if (a.completed_date) return false
    if (!a.start_date) return false
    const actionDate = new Date(a.start_date)
    const actionDateUTC = new Date(
      Date.UTC(actionDate.getUTCFullYear(), actionDate.getUTCMonth(), actionDate.getUTCDate())
    )
    return actionDateUTC < todayDateUTC
  }).length

  // Get upcoming actions (using UTC for date comparisons), sorted by date ascending (earliest first)
  const upcomingActions = actions
    .filter((a) => {
      if (a.completed_date) return false
      if (a.priority === 'high') return false
      const displayDateString = getActionDisplayDate(a)
      if (!displayDateString) return false
      const displayDate = new Date(displayDateString)
      if (Number.isNaN(displayDate.getTime())) return false
      const displayDateUTC = new Date(
        Date.UTC(displayDate.getUTCFullYear(), displayDate.getUTCMonth(), displayDate.getUTCDate())
      )
      const today = new Date()
      const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
      const thirtyDaysAgoUTC = new Date(todayUTC)
      thirtyDaysAgoUTC.setUTCDate(thirtyDaysAgoUTC.getUTCDate() - 30)
      return displayDateUTC >= thirtyDaysAgoUTC
    })
    .map((action) => {
      const displayDateString = getActionDisplayDate(action)
      const displayDate = new Date(displayDateString)
      const displayTime = Number.isNaN(displayDate.getTime()) ? Infinity : displayDate.getTime()
      return { action, displayTime }
    })
    .sort((a, b) => a.displayTime - b.displayTime)
    .map(({ action }) => action)
    .slice(0, 5)

  // Get high priority actions, sorted by date ascending (earliest first)
  const highPriorityActions = actions
    .filter((a) => {
      if (a.completed_date) return false
      return a.priority === 'high'
    })
    .map((action) => {
      const displayDateString = getActionDisplayDate(action)
      const displayDate = new Date(displayDateString)
      const displayTime = Number.isNaN(displayDate.getTime()) ? Infinity : displayDate.getTime()
      return { action, displayTime }
    })
    .sort((a, b) => a.displayTime - b.displayTime)
    .map(({ action }) => action)

  // Get medium priority actions, sorted by date ascending (earliest first)
  const mediumPriorityActions = actions
    .filter((a) => {
      if (a.completed_date) return false
      return a.priority === 'medium'
    })
    .map((action) => {
      const displayDateString = getActionDisplayDate(action)
      const displayDate = new Date(displayDateString)
      const displayTime = Number.isNaN(displayDate.getTime()) ? Infinity : displayDate.getTime()
      return { action, displayTime }
    })
    .sort((a, b) => a.displayTime - b.displayTime)
    .map(({ action }) => action)

  // Calculate birthday data
  const upcoming65 = getUpcoming65(contacts)
  const recent65 = getRecent65(contacts)
  const upcomingBirthdays = getUpcomingBirthdays(contacts)
  const pastBirthdays = getPastBirthdays(contacts)

  return {
    totalContacts,
    totalActions,
    completedActions,
    pendingActions,
    overdueActions,
    upcomingActions,
    highPriorityActions,
    mediumPriorityActions,
    upcoming65,
    recent65,
    upcomingBirthdays,
    pastBirthdays,
  }
}
