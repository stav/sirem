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
  TrendingUp, 
  Calendar,
  Phone,
  Mail,
  Plus,
  ArrowRight
} from 'lucide-react'
import type { Database } from '@/lib/supabase'

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

  function getPriorityColor(priority: string) {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
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
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Header */}
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">Sirem CRM</h1>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  href="/manage"
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Manage Contacts
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white p-6 rounded-lg shadow">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Sirem CRM</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/manage"
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                <Users className="h-4 w-4 mr-2" />
                Manage Contacts
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome to your CRM overview</p>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Contacts</p>
                  <p className="text-2xl font-bold text-gray-900">{totalContacts}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Bell className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Reminders</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingReminders}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-gray-900">{overdueReminders}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{completedReminders}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Contacts */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Contacts</h2>
                    <Link 
                      href="/manage" 
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      View all <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                </div>
                <div className="p-6">
                  {recentContacts.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No contacts yet</p>
                      <Link 
                        href="/manage" 
                        className="inline-flex items-center mt-2 text-blue-600 hover:text-blue-800"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add your first contact
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentContacts.map((contact) => (
                        <div key={contact.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-semibold">
                                {contact.first_name[0]}{contact.last_name[0]}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {contact.first_name} {contact.last_name}
                              </p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
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
                          <div className="text-sm text-gray-500">
                            {new Date(contact.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Upcoming Reminders */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Today&apos;s Reminders</h2>
                    <span className="text-sm text-gray-500">{todayReminders}</span>
                  </div>
                </div>
                <div className="p-6">
                  {upcomingReminders.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No upcoming reminders</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingReminders.map((reminder) => (
                        <div key={reminder.id} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">{reminder.title}</h3>
                              {reminder.description && (
                                <p className="text-sm text-gray-600 mt-1">{reminder.description}</p>
                              )}
                              <div className="flex items-center mt-2 space-x-2">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(reminder.priority)}`}>
                                  {reminder.priority}
                                </span>
                                <span className="text-xs text-gray-500 flex items-center">
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
                </div>
              </div>

              {/* Priority Distribution */}
              <div className="bg-white rounded-lg shadow-sm border mt-6">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Priority Distribution</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                        <span className="text-sm text-gray-600">High Priority</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{priorityStats.high}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                        <span className="text-sm text-gray-600">Medium Priority</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{priorityStats.medium}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                        <span className="text-sm text-gray-600">Low Priority</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{priorityStats.low}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link 
                    href="/manage" 
                    className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Plus className="h-6 w-6 text-blue-600 mr-3" />
                    <div>
                      <p className="font-medium text-blue-900">Add New Contact</p>
                      <p className="text-sm text-blue-700">Create a new contact record</p>
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
                  <Link 
                    href="/manage" 
                    className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <TrendingUp className="h-6 w-6 text-green-600 mr-3" />
                    <div>
                      <p className="font-medium text-green-900">View Reports</p>
                      <p className="text-sm text-green-700">See your CRM analytics</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
