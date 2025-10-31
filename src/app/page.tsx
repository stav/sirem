'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Users, Bell, CheckCircle, AlertTriangle, Plus, ArrowRight, Phone, Mail, MapPin } from 'lucide-react'
import type { Database } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getStatusBadge } from '@/lib/contact-utils'

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

function formatLocalDate(dateString: string) {
  if (!dateString) return ''
  const [year, month, day] = dateString.split('T')[0].split('-')
  return `${month}/${day}/${year}`
}

function getDaysUntilBirthday(birthdate: string): number {
  if (!birthdate) return Infinity

  const today = new Date()
  const birthDate = new Date(birthdate)

  // Create this year's birthday
  const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())

  // If this year's birthday has passed, calculate for next year
  if (thisYearBirthday < today) {
    thisYearBirthday.setFullYear(today.getFullYear() + 1)
  }

  const diffTime = thisYearBirthday.getTime() - today.getTime()
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

  // Calculate the date when they turn 65
  const turning65Date = new Date(birthDate.getFullYear() + 65, birthDate.getMonth(), birthDate.getDate())

  // If they've already turned 65, calculate how many days ago
  if (turning65Date < today) {
    const diffTime = today.getTime() - turning65Date.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return -diffDays // Negative to indicate past
  }

  // If they haven't turned 65 yet, calculate days until they do
  const diffTime = turning65Date.getTime() - today.getTime()
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

// Helper function to render contact row
function renderContactRow(
  contact: ContactWithBirthday,
  router: ReturnType<typeof useRouter>,
  showDate: boolean = true,
  badgeVariant: 'secondary' | 'outline' = 'secondary'
) {
  const getBadgeText = () => {
    if (contact.daysUntilBirthday === 0) return 'Today!'
    if (contact.daysUntilBirthday === 1) return 'Tomorrow'
    if (contact.daysUntilBirthday > 0) return `${contact.daysUntilBirthday} days`
    if (Math.abs(contact.daysUntilBirthday) === 1) return 'Yesterday'
    return `${Math.abs(contact.daysUntilBirthday)} days ago`
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
          <span className="text-muted-foreground text-xs">{formatLocalDate(contact.birthdate!)}</span>
          <Badge variant={badgeVariant} className="text-xs">
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
      const [contactsResponse, actionsResponse] = await Promise.all([
        // Optimized contacts query - only fetch essential fields for dashboard
        supabase
          .from('contacts')
          .select(
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
            addresses!inner(
              address1,
              city,
              address_type
            )
          `
          )
          .order('created_at', { ascending: false }),
        supabase
          .from('actions')
          .select(
            `
          *,
          contact:contacts (
            id,
            first_name,
            last_name
          )
        `
          )
          .order('start_date', { ascending: true }),
      ])

      if (contactsResponse.data) setContacts(contactsResponse.data)
      if (actionsResponse.data) {
        setActions(actionsResponse.data)
      }
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
    const overdueActions = actions.filter(
      (a) => !a.completed_date && a.start_date && new Date(a.start_date) < new Date()
    ).length

    // Get upcoming actions
    const upcomingActions = actions
      .filter((a) => {
        if (a.completed_date) return false
        if (!a.start_date) return false
        const actionDate = new Date(a.start_date)
        const today = new Date()
        actionDate.setHours(0, 0, 0, 0)
        today.setHours(0, 0, 0, 0)
        return actionDate >= today
      })
      .slice(0, 5)

    // Get priority distribution
    const priorityStats = {
      high: actions.filter((a) => a.priority === 'high' && !a.completed_date).length,
      medium: actions.filter((a) => a.priority === 'medium' && !a.completed_date).length,
      low: actions.filter((a) => a.priority === 'low' && !a.completed_date).length,
    }

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
      priorityStats,
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
    totalContacts,
    pendingActions,
    overdueActions,
    completedActions,
    upcomingActions,
    priorityStats,
    upcoming65,
    recent65,
    upcomingBirthdays,
    pastBirthdays,
  } = dashboardData

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
            <>
              {/* Metrics Cards */}
              <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="rounded-lg bg-blue-100 p-2">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-muted-foreground text-sm font-medium">Total Contacts</p>
                        <p className="text-foreground text-2xl font-bold">{totalContacts}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="rounded-lg bg-orange-100 p-2">
                        <Bell className="h-6 w-6 text-orange-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-muted-foreground text-sm font-medium">Pending Actions</p>
                        <p className="text-foreground text-2xl font-bold">{pendingActions}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="rounded-lg bg-red-100 p-2">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-muted-foreground text-sm font-medium">Overdue</p>
                        <p className="text-foreground text-2xl font-bold">{overdueActions}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="rounded-lg bg-green-100 p-2">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-muted-foreground text-sm font-medium">Completed</p>
                        <p className="text-foreground text-2xl font-bold">{completedActions}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Turning 65 */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Turning 65</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {/* Upcoming 65 */}
                        <div className="md:after:bg-border relative md:after:absolute md:after:top-0 md:after:right-[-12px] md:after:bottom-0 md:after:w-px">
                          <h4 className="text-muted-foreground mb-3 text-sm font-medium">Upcoming</h4>
                          {upcoming65.length === 0 ? (
                            <div className="py-4 text-center">
                              <p className="text-muted-foreground text-sm">No upcoming 65th birthdays</p>
                            </div>
                          ) : (
                            <div className="max-h-48 space-y-1 overflow-y-auto">
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
                            <div className="max-h-48 space-y-1 overflow-y-auto">
                              {recent65.map((contact) => renderContactRow(contact, router, true, 'outline'))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Birthdays Card */}
                  <Card className="mt-8">
                    <CardHeader>
                      <CardTitle>Birthdays</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {/* Upcoming Birthdays */}
                        <div className="md:after:bg-border relative md:after:absolute md:after:top-0 md:after:right-[-12px] md:after:bottom-0 md:after:w-px">
                          <h4 className="text-muted-foreground mb-3 text-sm font-medium">Upcoming</h4>
                          {upcomingBirthdays.length === 0 ? (
                            <div className="py-4 text-center">
                              <p className="text-muted-foreground text-sm">No upcoming birthdays</p>
                            </div>
                          ) : (
                            <div className="max-h-48 space-y-1 overflow-y-auto">
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
                            <div className="max-h-48 space-y-1 overflow-y-auto">
                              {pastBirthdays.map((contact) => renderContactRow(contact, router, true, 'outline'))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Upcoming Actions */}
                <div>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Upcoming Actions</CardTitle>
                        <Link href="/manage" className="text-primary hover:text-primary/80 flex items-center text-sm">
                          View all <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                      </div>
                    </CardHeader>
                    <CardContent>
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
                          {upcomingActions.map((action) => (
                            <div
                              key={action.id}
                              className="bg-muted/50 hover:bg-muted/70 cursor-pointer rounded-lg p-2 transition-colors"
                              onClick={() => {
                                // Navigate to manage page with action selected
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
                                    {action.start_date && (
                                      <span className="text-muted-foreground ml-2 text-xs">
                                        {formatLocalDate(action.start_date)}
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
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Priority Distribution */}
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Priority Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">High Priority</span>
                          <Badge variant="destructive">{priorityStats.high}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Medium Priority</span>
                          <Badge variant="default">{priorityStats.medium}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Low Priority</span>
                          <Badge variant="secondary">{priorityStats.low}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
