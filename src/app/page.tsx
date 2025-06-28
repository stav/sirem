'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { 
  Users, 
  Bell, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Calendar,
  Phone,
  Mail,
  Plus,
  ArrowRight,
  Table
} from 'lucide-react'
import type { Database } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Contact = Database['public']['Tables']['contacts']['Row']
type Reminder = Database['public']['Tables']['reminders']['Row']

export default function Home() {
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
        supabase.from('reminders').select('*').order('due_date', { ascending: true })
      ])
      
      if (contactsResponse.data) setContacts(contactsResponse.data)
      if (remindersResponse.data) setReminders(remindersResponse.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate metrics
  const totalContacts = contacts.length
  const totalReminders = reminders.length
  const completedReminders = reminders.filter(r => r.completed).length
  const pendingReminders = totalReminders - completedReminders
  const overdueReminders = reminders.filter(r => !r.completed && new Date(r.due_date) < new Date()).length
  const todayReminders = reminders.filter(r => {
    const today = new Date()
    const reminderDate = new Date(r.due_date)
    return !r.completed && 
           reminderDate.getDate() === today.getDate() &&
           reminderDate.getMonth() === today.getMonth() &&
           reminderDate.getFullYear() === today.getFullYear()
  }).length

  // Get recent contacts
  const recentContacts = contacts.slice(0, 5)
  
  // Get upcoming reminders
  const upcomingReminders = reminders
    .filter(r => !r.completed && new Date(r.due_date) >= new Date())
    .slice(0, 5)

  // Get priority distribution
  const priorityStats = {
    high: reminders.filter(r => r.priority === 'high' && !r.completed).length,
    medium: reminders.filter(r => r.priority === 'medium' && !r.completed).length,
    low: reminders.filter(r => r.priority === 'low' && !r.completed).length
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  function formatTime(dateString: string) {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
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
            {/* Recent Contacts */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Contacts</CardTitle>
                    <Link 
                      href="/manage" 
                      className="text-sm text-primary hover:text-primary/80 flex items-center"
                    >
                      View all <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {recentContacts.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No contacts yet</p>
                      <Link 
                        href="/manage" 
                        className="inline-flex items-center mt-2 text-primary hover:text-primary/80"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add your first contact
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentContacts.map((contact) => (
                        <div key={contact.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-primary font-semibold">
                                {contact.first_name[0]}{contact.last_name[0]}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {contact.first_name} {contact.last_name}
                              </p>
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                {contact.email && (
                                  <span className="flex items-center">
                                    <Mail className="h-3 w-3 mr-1" />
                                    {contact.email}
                                  </span>
                                )}
                                {contact.phone && (
                                  <span className="flex items-center">
                                    <Phone className="h-3 w-3 mr-1" />
                                    {contact.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(contact.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Reminders */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Today&apos;s Reminders</CardTitle>
                    <Badge variant="secondary">{todayReminders}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {upcomingReminders.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No upcoming reminders</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingReminders.map((reminder) => (
                        <div key={reminder.id} className="p-4 bg-muted/50 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-foreground">{reminder.title}</h3>
                              {reminder.description && (
                                <p className="text-sm text-muted-foreground mt-1">{reminder.description}</p>
                              )}
                              <div className="flex items-center mt-2 space-x-2">
                                <Badge variant={reminder.priority === 'high' ? 'destructive' : reminder.priority === 'medium' ? 'default' : 'secondary'}>
                                  {reminder.priority}
                                </Badge>
                                <span className="text-xs text-muted-foreground flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {formatDate(reminder.due_date)} at {formatTime(reminder.due_date)}
                                </span>
                              </div>
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
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-destructive rounded-full mr-3"></div>
                        <span className="text-sm text-muted-foreground">High Priority</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">{priorityStats.high}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-primary rounded-full mr-3"></div>
                        <span className="text-sm text-muted-foreground">Medium Priority</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">{priorityStats.medium}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-secondary rounded-full mr-3"></div>
                        <span className="text-sm text-muted-foreground">Low Priority</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">{priorityStats.low}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link 
                    href="/manage" 
                    className="flex items-center p-4 bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors"
                  >
                    <Plus className="h-6 w-6 text-primary mr-3" />
                    <div>
                      <p className="font-medium text-primary">Add New Contact</p>
                      <p className="text-sm text-primary/70">Create a new contact record</p>
                    </div>
                  </Link>
                  <Link 
                    href="/sheets" 
                    className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Table className="h-6 w-6 text-blue-600 mr-3" />
                    <div>
                      <p className="font-medium text-blue-900">Edit in Sheets</p>
                      <p className="text-sm text-blue-700">Spreadsheet view for contacts</p>
                    </div>
                  </Link>
                  <Link 
                    href="/manage" 
                    className="flex items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                  >
                    <Bell className="h-6 w-6 text-orange-600 mr-3" />
                    <div>
                      <p className="font-medium text-orange-900">Create Reminder</p>
                      <p className="text-sm text-orange-700">Set a new reminder</p>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
