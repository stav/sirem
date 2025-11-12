'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Users, Bell, Plus, ArrowRight, Phone, Mail, MapPin } from 'lucide-react'
import type { Database } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getStatusBadge, formatLocalDateWithWeekday } from '@/lib/contact-utils'
import { formatDateTimeWithWeekday } from '@/lib/utils'
import { fetchAllRecords } from '@/lib/database'
import { getDisplayDate as getActionDisplayDate } from '@/lib/action-utils'

// Optimized type for dashboard contacts
type DashboardContact = Pick<
  Database['public']['Tables']['contacts']['Row'],
  'id' | 'first_name' | 'last_name' | 'birthdate' | 'phone' | 'email' | 'status' | 'created_at' | 'updated_at'
> & {
  addresses?: Pick<Database['public']['Tables']['addresses']['Row'], 'address1' | 'city' | 'address_type'>[]
}

type Action = Database['public']['Tables']['actions']['Row'] & {
  contact: {
    id: string
    first_name: string
    last_name: string
  } | null
}

interface ContactWithBirthday extends DashboardContact {
  daysUntilBirthday: number
}

function getDaysUntilBirthday(birthdate: string): number {
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

function getUpcomingBirthdays(contacts: DashboardContact[], daysRange: number = 100): ContactWithBirthday[] {
  return contacts
    .filter((contact) => contact.birthdate)
    .map((contact) => ({
      ...contact,
      daysUntilBirthday: getDaysUntilBirthday(contact.birthdate!),
    }))
    .filter((contact) => contact.daysUntilBirthday <= daysRange)
    .sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday)
}

function getPastBirthdays(contacts: DashboardContact[], daysRange: number = 60): ContactWithBirthday[] {
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

function getDaysUntil65(birthdate: string): number {
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

function getUpcoming65(contacts: DashboardContact[], daysRange: number = 150): ContactWithBirthday[] {
  return contacts
    .filter((contact) => contact.birthdate)
    .map((contact) => ({
      ...contact,
      daysUntilBirthday: getDaysUntil65(contact.birthdate!),
    }))
    .filter((contact) => contact.daysUntilBirthday >= 0 && contact.daysUntilBirthday <= daysRange)
    .sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday)
}

function getRecent65(contacts: DashboardContact[], daysRange: number = 60): ContactWithBirthday[] {
  return contacts
    .filter((contact) => contact.birthdate)
    .map((contact) => ({
      ...contact,
      daysUntilBirthday: getDaysUntil65(contact.birthdate!),
    }))
    .filter((contact) => contact.daysUntilBirthday < 0 && contact.daysUntilBirthday >= -daysRange)
    .sort((a, b) => b.daysUntilBirthday - a.daysUntilBirthday) // Sort by most recent first
}

// Helper function to render status badge
function renderStatusBadge(status: string | null) {
  const statusBadge = getStatusBadge(status)
  if (!statusBadge) return null

  if (statusBadge.variant) {
    return (
      <Badge variant={statusBadge.variant} className={statusBadge.className}>
        {statusBadge.text}
      </Badge>
    )
  } else {
    return <span className={statusBadge.className}>{statusBadge.text}</span>
  }
}

// Helper function to render contact info with icons
function renderContactInfo(contact: DashboardContact) {
  // Check if contact has a valid mailing address (address1 and city)
  const hasValidAddress =
    contact.addresses &&
    contact.addresses.length > 0 &&
    contact.addresses[0] &&
    contact.addresses[0].address1 &&
    contact.addresses[0].city

  return (
    <div className="flex items-center space-x-2">
      <span className="text-foreground text-sm">
        {contact.first_name} {contact.last_name}
      </span>
      {renderStatusBadge(contact.status)}
      {contact.phone && <Phone className="text-muted-foreground h-3 w-3" />}
      {contact.email && <Mail className="text-muted-foreground h-3 w-3" />}
      {hasValidAddress && <MapPin className="text-muted-foreground h-3 w-3" />}
    </div>
  )
}

// Helper function to render action row
function renderActionRow(action: Action, router: ReturnType<typeof useRouter>) {
  const formatSignedDayDiff = (dateString: string | null) => {
    if (!dateString) return ''
    const target = new Date(dateString)
    const targetUTC = new Date(
      Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate())
    )
    const now = new Date()
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const diffDays = Math.round((targetUTC.getTime() - todayUTC.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return '0d'
    return diffDays > 0 ? `+${diffDays}d` : `${diffDays}d`
  }

  const displayDateString = getActionDisplayDate(action)
  const dayDiffLabel = displayDateString ? formatSignedDayDiff(displayDateString) : ''
  return (
    <div
      key={action.id}
      className="bg-muted/50 hover:bg-muted/70 cursor-pointer rounded-lg p-2 transition-colors"
      onClick={() => {
        router.push(`/manage?action=${action.id}`)
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="text-foreground font-medium">{action.title}</h4>
          <div className="mt-1 flex items-center space-x-2">
            {action.priority && (
              <Badge
                variant={
                  action.priority === 'high'
                    ? 'destructive'
                    : action.priority === 'medium'
                      ? 'default'
                      : 'secondary'
                }
                className="text-xs"
              >
                {action.priority}
              </Badge>
            )}
            {displayDateString && (
              <span
                className="text-muted-foreground ml-2 text-xs"
                title={formatDateTimeWithWeekday(displayDateString)}
              >
                {dayDiffLabel}
              </span>
            )}
            <span className="text-muted-foreground ml-2 flex items-center text-xs">
              <Users className="mr-1 h-3 w-3" />
              {action.contact?.first_name} {action.contact?.last_name}
            </span>
          </div>
          {action.description && (
            <p className="text-muted-foreground mt-1 text-sm">{action.description}</p>
          )}
        </div>
        <div className="ml-2">
          <ArrowRight className="text-muted-foreground h-4 w-4" />
        </div>
      </div>
    </div>
  )
}

// Helper function to render contact row
function renderContactRow(
  contact: ContactWithBirthday,
  router: ReturnType<typeof useRouter>,
  showDate: boolean = true,
  badgeVariant: 'secondary' | 'outline' = 'secondary'
) {
  const getBadgeText = () => {
    const d = contact.daysUntilBirthday
    if (d === 0) return '0d'
    if (d > 0) return `+${d}d`
    return `${d}d`
  }

  return (
    <div
      key={contact.id}
      className="hover:bg-muted/70 flex cursor-pointer items-center justify-between py-1 transition-colors"
      onClick={() => {
        router.push(`/manage?contact=${contact.id}`)
      }}
    >
      {renderContactInfo(contact)}
      {showDate && (
        <div className="flex items-center space-x-2">
          <Badge
            variant={badgeVariant}
            className="text-xs"
            title={formatLocalDateWithWeekday(contact.birthdate!)}
          >
            {getBadgeText()}
          </Badge>
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const router = useRouter()
  const [contacts, setContacts] = useState<DashboardContact[]>([])
  const [actions, setActions] = useState<Action[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      // Fetch contacts and actions in parallel (both will be paginated)
      const [allContacts] = await Promise.all([
        // Optimized contacts query - only fetch essential fields for dashboard
        fetchAllRecords<DashboardContact>(
          'contacts',
          `
            id,
            first_name,
            last_name,
            birthdate,
            phone,
            email,
            status,
            created_at,
            updated_at,
            addresses(
              address1,
              city,
              address_type
            )
          `,
          'created_at',
          false
        ),
      ])

      // Fetch all actions with pagination to overcome 1000 row limit
      const allActions = await fetchAllRecords<Action>(
        'actions',
        `
          *,
          contact:contacts (
            id,
            first_name,
            last_name
          )
        `,
        'start_date',
        true
      )

      setContacts(allContacts)
      setActions(allActions)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Memoize expensive calculations
  const dashboardData = useMemo(() => {
    if (loading) return null

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
  }, [contacts, actions, loading])

  // Early return if still loading or no data
  if (loading || !dashboardData) {
    return (
      <div className="bg-background min-h-screen">
        <Navigation pageTitle="Dashboard" />
        <div className="p-6">
          <div className="mx-auto max-w-7xl">
            {loading ? (
              <div className="animate-pulse">
                <div className="bg-muted mb-8 h-8 w-1/4 rounded"></div>
                <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-card rounded-lg p-6 shadow">
                      <div className="bg-muted mb-2 h-4 w-1/2 rounded"></div>
                      <div className="bg-muted h-8 w-1/3 rounded"></div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                  <div className="space-y-8 lg:col-span-2">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="bg-card rounded-lg p-6 shadow">
                        <div className="bg-muted mb-4 h-6 w-1/3 rounded"></div>
                        <div className="space-y-3">
                          {[...Array(4)].map((_, j) => (
                            <div key={j} className="bg-muted h-4 rounded"></div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-6">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="bg-card rounded-lg p-6 shadow">
                        <div className="bg-muted mb-4 h-6 w-1/2 rounded"></div>
                        <div className="space-y-3">
                          {[...Array(3)].map((_, j) => (
                            <div key={j} className="bg-muted h-4 rounded"></div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">Loading dashboard data...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const {
    upcomingActions,
    highPriorityActions,
    mediumPriorityActions,
    upcoming65,
    recent65,
    upcomingBirthdays,
    pastBirthdays,
  } = dashboardData

  return (
    <div className="bg-background min-h-screen">
      <Navigation pageTitle="Dashboard" />

      <div className="p-6">
        <div className="mx-auto">
          {loading ? (
            <div className="animate-pulse">
              <div className="bg-muted mb-8 h-8 w-1/4 rounded"></div>
              <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-card rounded-lg p-6 shadow">
                    <div className="bg-muted mb-2 h-4 w-1/2 rounded"></div>
                    <div className="bg-muted h-8 w-1/3 rounded"></div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="space-y-8 lg:col-span-2">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="bg-card rounded-lg p-6 shadow">
                      <div className="bg-muted mb-4 h-6 w-1/3 rounded"></div>
                      <div className="space-y-3">
                        {[...Array(4)].map((_, j) => (
                          <div key={j} className="bg-muted h-4 rounded"></div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-6">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="bg-card rounded-lg p-6 shadow">
                      <div className="bg-muted mb-4 h-6 w-1/2 rounded"></div>
                      <div className="space-y-3">
                        {[...Array(3)].map((_, j) => (
                          <div key={j} className="bg-muted h-4 rounded"></div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Top status cards removed */}
              {/* Action Columns - Three columns side by side */}
              <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                {/* Upcoming Actions */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Upcoming Actions</CardTitle>
                      <Link href="/manage" className="text-primary hover:text-primary/80 flex items-center text-sm">
                        View all <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 max-h-[50vh] overflow-auto scrollbar-hide">
                    {upcomingActions.length === 0 ? (
                      <div className="py-8 text-center">
                        <Bell className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                        <p className="text-muted-foreground">No upcoming actions</p>
                        <Link
                          href="/manage"
                          className="text-primary hover:text-primary/80 mt-2 inline-flex items-center"
                        >
                          <Plus className="mr-1 h-4 w-4" />
                          Add an action
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {upcomingActions.map((action) => renderActionRow(action, router))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* High Priority Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>High Priority</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 max-h-[50vh] overflow-auto scrollbar-hide">
                    {highPriorityActions.length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="text-muted-foreground">No high priority actions</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {highPriorityActions.map((action) => renderActionRow(action, router))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Medium Priority Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Medium Priority</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 max-h-[50vh] overflow-auto scrollbar-hide">
                    {mediumPriorityActions.length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="text-muted-foreground">No medium priority actions</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {mediumPriorityActions.map((action) => renderActionRow(action, router))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Turning 65 and Birthdays - Below the action columns */}
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Turning 65 */}
                <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle>Turning 65</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="scrollbar-hide max-h-[35vh] overflow-x-auto overflow-y-auto">
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 min-w-max">
                      {/* Upcoming 65 */}
                      <div className="md:after:bg-border relative md:after:absolute md:after:top-0 md:after:right-[-12px] md:after:bottom-0 md:after:w-px">
                        <h4 className="text-muted-foreground mb-3 text-sm font-medium">Upcoming</h4>
                        {upcoming65.length === 0 ? (
                          <div className="py-4 text-center">
                            <p className="text-muted-foreground text-sm">No upcoming 65th birthdays</p>
                          </div>
                        ) : (
                            <div className="space-y-1">
                            {upcoming65.map((contact) => renderContactRow(contact, router))}
                          </div>
                        )}
                      </div>

                      {/* Recent 65 */}
                      <div className="relative">
                        <h4 className="text-muted-foreground mb-3 text-sm font-medium">Recent</h4>
                        {recent65.length === 0 ? (
                          <div className="py-4 text-center">
                            <p className="text-muted-foreground text-sm">No recent 65th birthdays</p>
                          </div>
                        ) : (
                            <div className="space-y-1">
                            {recent65.map((contact) => renderContactRow(contact, router, true, 'outline'))}
                          </div>
                        )}
                      </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Birthdays Card */}
                <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle>Birthdays</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="scrollbar-hide max-h-[35vh] overflow-x-auto overflow-y-auto">
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 min-w-max">
                      {/* Upcoming Birthdays */}
                      <div className="md:after:bg-border relative md:after:absolute md:after:top-0 md:after:right-[-12px] md:after:bottom-0 md:after:w-px">
                        <h4 className="text-muted-foreground mb-3 text-sm font-medium">Upcoming</h4>
                        {upcomingBirthdays.length === 0 ? (
                          <div className="py-4 text-center">
                            <p className="text-muted-foreground text-sm">No upcoming birthdays</p>
                          </div>
                        ) : (
                            <div className="space-y-1">
                            {upcomingBirthdays.map((contact) => renderContactRow(contact, router))}
                          </div>
                        )}
                      </div>

                      {/* Recent Birthdays */}
                      <div className="relative">
                        <h4 className="text-muted-foreground mb-3 text-sm font-medium">Recent</h4>
                        {pastBirthdays.length === 0 ? (
                          <div className="py-4 text-center">
                            <p className="text-muted-foreground text-sm">No recent birthdays</p>
                          </div>
                        ) : (
                            <div className="space-y-1">
                            {pastBirthdays.map((contact) => renderContactRow(contact, router, true, 'outline'))}
                          </div>
                        )}
                      </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
