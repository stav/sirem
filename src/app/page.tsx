'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  Users, 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Plus,
  ArrowRight,
  Phone,
  Mail,
} from 'lucide-react'
import type { Database } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getStatusBadge } from '@/lib/contact-utils'

type Contact = Database['public']['Tables']['contacts']['Row']
type Reminder = Database['public']['Tables']['reminders']['Row'] & {
  contact: {
    id: string
    first_name: string
    last_name: string
  } | null
}

interface ContactWithBirthday extends Contact {
  daysUntilBirthday: number;
}

function formatLocalDate(dateString: string) {
  if (!dateString) return ''
  const [year, month, day] = dateString.split('T')[0].split('-')
  return `${month}/${day}/${year}`
}

function getDaysUntilBirthday(birthdate: string): number {
  if (!birthdate) return Infinity;
  
  const today = new Date();
  const birthDate = new Date(birthdate);
  
  // Create this year's birthday
  const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  
  // If this year's birthday has passed, calculate for next year
  if (thisYearBirthday < today) {
    thisYearBirthday.setFullYear(today.getFullYear() + 1);
  }
  
  const diffTime = thisYearBirthday.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

function getUpcomingBirthdays(contacts: Contact[], daysRange: number = 100): ContactWithBirthday[] {
  return contacts
    .filter(contact => contact.birthdate)
    .map(contact => ({
      ...contact,
      daysUntilBirthday: getDaysUntilBirthday(contact.birthdate!)
    }))
    .filter(contact => contact.daysUntilBirthday <= daysRange)
    .sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday);
}

function getPastBirthdays(contacts: Contact[], daysRange: number = 60): ContactWithBirthday[] {
  return contacts
    .filter(contact => contact.birthdate)
    .map(contact => {
      const daysUntilBirthday = getDaysUntilBirthday(contact.birthdate!);
      // For past birthdays, we want days that are negative (birthday has passed)
      const daysSinceBirthday = daysUntilBirthday > 0 ? 365 - daysUntilBirthday : Math.abs(daysUntilBirthday);
      return {
        ...contact,
        daysUntilBirthday: -daysSinceBirthday // Negative to indicate past
      };
    })
    .filter(contact => contact.daysUntilBirthday >= -daysRange && contact.daysUntilBirthday < 0)
    .sort((a, b) => b.daysUntilBirthday - a.daysUntilBirthday); // Sort by most recent first
}

function getDaysUntil65(birthdate: string): number {
  if (!birthdate) return Infinity;
  
  const today = new Date();
  const birthDate = new Date(birthdate);
  
  // Calculate the date when they turn 65
  const turning65Date = new Date(birthDate.getFullYear() + 65, birthDate.getMonth(), birthDate.getDate());
  
  // If they've already turned 65, calculate how many days ago
  if (turning65Date < today) {
    const diffTime = today.getTime() - turning65Date.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return -diffDays; // Negative to indicate past
  }
  
  // If they haven't turned 65 yet, calculate days until they do
  const diffTime = turning65Date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

function getUpcoming65(contacts: Contact[], daysRange: number = 150): ContactWithBirthday[] {
  return contacts
    .filter(contact => contact.birthdate)
    .map(contact => ({
      ...contact,
      daysUntilBirthday: getDaysUntil65(contact.birthdate!)
    }))
    .filter(contact => contact.daysUntilBirthday >= 0 && contact.daysUntilBirthday <= daysRange)
    .sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday);
}

function getRecent65(contacts: Contact[], daysRange: number = 60): ContactWithBirthday[] {
  return contacts
    .filter(contact => contact.birthdate)
    .map(contact => ({
      ...contact,
      daysUntilBirthday: getDaysUntil65(contact.birthdate!)
    }))
    .filter(contact => contact.daysUntilBirthday < 0 && contact.daysUntilBirthday >= -daysRange)
    .sort((a, b) => b.daysUntilBirthday - a.daysUntilBirthday); // Sort by most recent first
}

// Helper function to render status badge
function renderStatusBadge(status: string | null) {
  const statusBadge = getStatusBadge(status)
  if (!statusBadge) return null
  
  if (statusBadge.variant) {
    return <Badge variant={statusBadge.variant} className={statusBadge.className}>{statusBadge.text}</Badge>
  } else {
    return <span className={statusBadge.className}>{statusBadge.text}</span>
  }
}

// Helper function to render contact info with icons
function renderContactInfo(contact: Contact) {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-foreground">
        {contact.first_name} {contact.last_name}
      </span>
      {renderStatusBadge(contact.status)}
      {contact.phone && (
        <Phone className="h-3 w-3 text-muted-foreground" />
      )}
      {contact.email && (
        <Mail className="h-3 w-3 text-muted-foreground" />
      )}
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
      className="flex items-center justify-between py-1 hover:bg-muted/70 transition-colors cursor-pointer"
      onClick={() => {
        router.push(`/manage?contact=${contact.id}`)
      }}
    >
      {renderContactInfo(contact)}
      {showDate && (
        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted-foreground">
            {formatLocalDate(contact.birthdate!)}
          </span>
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
  const [contacts, setContacts] = useState<Contact[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [contactsResponse, remindersResponse] = await Promise.all([
        supabase.from('contacts').select('*').order('created_at', { ascending: false }),
        supabase.from('reminders').select(`
          *,
          contact:contacts (
            id,
            first_name,
            last_name
          )
        `).order('reminder_date', { ascending: true })
      ])
      
      if (contactsResponse.data) setContacts(contactsResponse.data)
      if (remindersResponse.data) {
        setReminders(remindersResponse.data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate metrics
  const totalContacts = contacts.length
  const totalReminders = reminders.length
  const completedReminders = reminders.filter(r => r.is_complete).length
  const pendingReminders = totalReminders - completedReminders
  const overdueReminders = reminders.filter(r => !r.is_complete && new Date(r.reminder_date) < new Date()).length

  // Get upcoming reminders
  const upcomingReminders = reminders
    .filter(r => {
      if (r.is_complete) return false;
      const reminderDate = new Date(r.reminder_date);
      const today = new Date();
      reminderDate.setHours(0,0,0,0);
      today.setHours(0,0,0,0);
      return reminderDate >= today;
    })
    .slice(0, 5)

  // Get priority distribution
  const priorityStats = {
    high: reminders.filter(r => r.priority === 'high' && !r.is_complete).length,
    medium: reminders.filter(r => r.priority === 'medium' && !r.is_complete).length,
    low: reminders.filter(r => r.priority === 'low' && !r.is_complete).length
  }



  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-card p-6 rounded-lg shadow">
                  <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation pageTitle="Dashboard" />

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Contacts</p>
                    <p className="text-2xl font-bold text-foreground">{totalContacts}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Bell className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Pending Reminders</p>
                    <p className="text-2xl font-bold text-foreground">{pendingReminders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                    <p className="text-2xl font-bold text-foreground">{overdueReminders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold text-foreground">{completedReminders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Turning 65 */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Turning 65</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Upcoming 65 */}
                    <div className="relative md:after:absolute md:after:right-[-12px] md:after:top-0 md:after:bottom-0 md:after:w-px md:after:bg-border">
                      <h4 className="font-medium text-sm text-muted-foreground mb-3">Upcoming</h4>
                      {(() => {
                        const upcoming65 = getUpcoming65(contacts);
                        return upcoming65.length === 0 ? (
                          <div className="text-center py-4">
                            <p className="text-muted-foreground text-sm">No upcoming 65th birthdays</p>
                          </div>
                        ) : (
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {upcoming65.map((contact) => 
                              renderContactRow(contact, router)
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Recent 65 */}
                    <div className="relative">
                      <h4 className="font-medium text-sm text-muted-foreground mb-3">Recent</h4>
                      {(() => {
                        const recent65 = getRecent65(contacts);
                        return recent65.length === 0 ? (
                          <div className="text-center py-4">
                            <p className="text-muted-foreground text-sm">No recent 65th birthdays</p>
                          </div>
                        ) : (
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {recent65.map((contact) => 
                              renderContactRow(contact, router, true, 'outline')
                            )}
                          </div>
                        );
                      })()}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Upcoming Birthdays */}
                    <div className="relative md:after:absolute md:after:right-[-12px] md:after:top-0 md:after:bottom-0 md:after:w-px md:after:bg-border">
                      <h4 className="font-medium text-sm text-muted-foreground mb-3">Upcoming</h4>
                      {(() => {
                        const upcomingBirthdays = getUpcomingBirthdays(contacts);
                        return upcomingBirthdays.length === 0 ? (
                          <div className="text-center py-4">
                            <p className="text-muted-foreground text-sm">No upcoming birthdays</p>
                          </div>
                        ) : (
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {upcomingBirthdays.map((contact) => 
                              renderContactRow(contact, router)
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Recent Birthdays */}
                    <div className="relative">
                      <h4 className="font-medium text-sm text-muted-foreground mb-3">Recent</h4>
                      {(() => {
                        const pastBirthdays = getPastBirthdays(contacts);
                        return pastBirthdays.length === 0 ? (
                          <div className="text-center py-4">
                            <p className="text-muted-foreground text-sm">No recent birthdays</p>
                          </div>
                        ) : (
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {pastBirthdays.map((contact) => 
                              renderContactRow(contact, router, true, 'outline')
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Reminders */}
            <div>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Upcoming Reminders</CardTitle>
                    <Link 
                      href="/manage" 
                      className="text-sm text-primary hover:text-primary/80 flex items-center"
                    >
                      View all <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {upcomingReminders.length === 0 ? (
                    <div className="text-center py-8">
                      <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No upcoming reminders</p>
                      <Link 
                        href="/manage" 
                        className="inline-flex items-center mt-2 text-primary hover:text-primary/80"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add a reminder
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {upcomingReminders.map((reminder) => (
                        <div 
                          key={reminder.id} 
                          className="p-2 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
                          onClick={() => {
                            // Navigate to manage page with reminder selected
                            router.push(`/manage?reminder=${reminder.id}`)
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-foreground">{reminder.title}</h4>
                              <div className="flex items-center mt-1 space-x-2">
                                <Badge 
                                  variant={reminder.priority === 'high' ? 'destructive' : 
                                          reminder.priority === 'medium' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {reminder.priority}
                                </Badge>
                                <span className="ml-2 text-xs text-muted-foreground">{formatLocalDate(reminder.reminder_date)}</span>
                                <span className="flex items-center ml-2 text-xs text-muted-foreground"><Users className="h-3 w-3 mr-1" />{reminder.contact?.first_name} {reminder.contact?.last_name}</span>
                              </div>
                              {reminder.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {reminder.description}
                                </p>
                              )}
                            </div>
                            <div className="ml-2">
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
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
        </div>
      </div>
    </div>
  )
}
