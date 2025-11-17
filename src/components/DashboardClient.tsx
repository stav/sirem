'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Users, Bell, Plus, ArrowRight, Phone, Mail, MapPin } from 'lucide-react'
import Navigation from '@/components/Navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getStatusBadge, formatLocalDateWithWeekday } from '@/lib/contact-utils'
import { formatDateTimeWithWeekday } from '@/lib/utils'
import { getDisplayDate as getActionDisplayDate } from '@/lib/action-utils'
import type {
  DashboardContact,
  Action,
  ContactWithBirthday,
  DashboardData,
} from '@/lib/dashboard-utils'

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
          <h4 className="text-foreground font-medium line-clamp-2">{action.title}</h4>
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
            <p className="text-muted-foreground mt-1 text-sm line-clamp-2">{action.description}</p>
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

interface DashboardClientProps {
  data: DashboardData
}

export default function DashboardClient({ data }: DashboardClientProps) {
  const router = useRouter()

  const {
    upcomingActions,
    highPriorityActions,
    mediumPriorityActions,
    upcoming65,
    recent65,
    upcomingBirthdays,
    pastBirthdays,
  } = data

  return (
    <div className="bg-background min-h-screen">
      <Navigation />

      <div className="p-6">
        <div className="mx-auto">
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
        </div>
      </div>
    </div>
  )
}


