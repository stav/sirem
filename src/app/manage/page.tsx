'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Plus, Phone, Mail, Calendar, CheckCircle, Circle, Edit, Trash2, BarChart3 } from 'lucide-react'
import type { Database } from '@/lib/supabase'

type Contact = Database['public']['Tables']['contacts']['Row']
type Reminder = Database['public']['Tables']['reminders']['Row']

export default function Manage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'contacts' | 'reminders'>('contacts')
  
  // Form states
  const [showContactForm, setShowContactForm] = useState(false)
  const [showReminderForm, setShowReminderForm] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)
  
  // Contact form
  const [contactForm, setContactForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    notes: ''
  })
  
  // Reminder form
  const [reminderForm, setReminderForm] = useState({
    contact_id: '',
    title: '',
    description: '',
    due_date: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  })

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

  async function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      if (editingContact) {
        const { error } = await supabase
          .from('contacts')
          .update(contactForm)
          .eq('id', editingContact.id)
        
        if (error) {
          console.error('Supabase error:', error)
          throw error
        }
      } else {
        const { error } = await supabase
          .from('contacts')
          .insert([contactForm])
        
        if (error) {
          console.error('Supabase error:', error)
          throw error
        }
      }
      
      resetContactForm()
      fetchData()
    } catch (error) {
      console.error('Error saving contact:', error)
      alert('Error saving contact. Please check your database setup and try again.')
    }
  }

  async function handleReminderSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      if (editingReminder) {
        const { error } = await supabase
          .from('reminders')
          .update(reminderForm)
          .eq('id', editingReminder.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('reminders')
          .insert([reminderForm])
        
        if (error) throw error
      }
      
      resetReminderForm()
      fetchData()
    } catch (error) {
      console.error('Error saving reminder:', error)
    }
  }

  async function toggleReminderComplete(reminder: Reminder) {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({ completed: !reminder.completed })
        .eq('id', reminder.id)
      
      if (error) throw error
      fetchData()
    } catch (error) {
      console.error('Error updating reminder:', error)
    }
  }

  async function deleteContact(contact: Contact) {
    if (!confirm('Are you sure you want to delete this contact?')) return
    
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contact.id)
      
      if (error) throw error
      fetchData()
    } catch (error) {
      console.error('Error deleting contact:', error)
    }
  }

  async function deleteReminder(reminder: Reminder) {
    if (!confirm('Are you sure you want to delete this reminder?')) return
    
    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', reminder.id)
      
      if (error) throw error
      fetchData()
    } catch (error) {
      console.error('Error deleting reminder:', error)
    }
  }

  function resetContactForm() {
    setContactForm({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      notes: ''
    })
    setEditingContact(null)
    setShowContactForm(false)
  }

  function resetReminderForm() {
    setReminderForm({
      contact_id: '',
      title: '',
      description: '',
      due_date: '',
      priority: 'medium'
    })
    setEditingReminder(null)
    setShowReminderForm(false)
  }

  function editContact(contact: Contact) {
    setContactForm({
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email || '',
      phone: contact.phone || '',
      notes: contact.notes || ''
    })
    setEditingContact(contact)
    setShowContactForm(true)
  }

  function editReminder(reminder: Reminder) {
    setReminderForm({
      contact_id: reminder.contact_id,
      title: reminder.title,
      description: reminder.description || '',
      due_date: reminder.due_date.split('T')[0],
      priority: reminder.priority
    })
    setEditingReminder(reminder)
    setShowReminderForm(true)
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  function getContactName(contactId: string) {
    const contact = contacts.find((c: Contact) => c.id === contactId)
    return contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown Contact'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your CRM...</p>
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
                href="/"
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Contact Management</h2>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              View Dashboard
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('contacts')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'contacts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Contacts ({contacts.length})
              </button>
              <button
                onClick={() => setActiveTab('reminders')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reminders'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Reminders ({reminders.filter(r => !r.completed).length})
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'contacts' ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Contacts</h2>
              <button
                onClick={() => setShowContactForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Contact
              </button>
            </div>

            {/* Contact Form */}
            {showContactForm && (
              <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                <h3 className="text-lg font-medium mb-4">
                  {editingContact ? 'Edit Contact' : 'Add New Contact'}
                </h3>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">First Name</label>
                      <input
                        type="text"
                        required
                        value={contactForm.first_name}
                        onChange={(e) => setContactForm({...contactForm, first_name: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Name</label>
                      <input
                        type="text"
                        required
                        value={contactForm.last_name}
                        onChange={(e) => setContactForm({...contactForm, last_name: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <input
                        type="tel"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                      value={contactForm.notes}
                      onChange={(e) => setContactForm({...contactForm, notes: e.target.value})}
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      {editingContact ? 'Update Contact' : 'Add Contact'}
                    </button>
                    <button
                      type="button"
                      onClick={resetContactForm}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Contacts List */}
            <div className="bg-white shadow-sm rounded-lg border">
              {contacts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>No contacts yet. Add your first contact to get started!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">
                            {contact.first_name} {contact.last_name}
                          </h3>
                          <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                            {contact.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                <a href={`mailto:${contact.email}`} className="hover:text-blue-600">
                                  {contact.email}
                                </a>
                              </div>
                            )}
                            {contact.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-4 h-4" />
                                <a href={`tel:${contact.phone}`} className="hover:text-blue-600">
                                  {contact.phone}
                                </a>
                              </div>
                            )}
                          </div>
                          {contact.notes && (
                            <p className="mt-2 text-sm text-gray-600">{contact.notes}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => editContact(contact)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteContact(contact)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Reminders</h2>
              <button
                onClick={() => setShowReminderForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Reminder
              </button>
            </div>

            {/* Reminder Form */}
            {showReminderForm && (
              <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                <h3 className="text-lg font-medium mb-4">
                  {editingReminder ? 'Edit Reminder' : 'Add New Reminder'}
                </h3>
                <form onSubmit={handleReminderSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact</label>
                    <select
                      required
                      value={reminderForm.contact_id}
                      onChange={(e) => setReminderForm({...reminderForm, contact_id: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a contact</option>
                      {contacts.map((contact) => (
                        <option key={contact.id} value={contact.id}>
                          {contact.first_name} {contact.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <input
                      type="text"
                      required
                      value={reminderForm.title}
                      onChange={(e) => setReminderForm({...reminderForm, title: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={reminderForm.description}
                      onChange={(e) => setReminderForm({...reminderForm, description: e.target.value})}
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Due Date</label>
                      <input
                        type="date"
                        required
                        value={reminderForm.due_date}
                        onChange={(e) => setReminderForm({...reminderForm, due_date: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Priority</label>
                      <select
                        value={reminderForm.priority}
                        onChange={(e) => setReminderForm({...reminderForm, priority: e.target.value as 'low' | 'medium' | 'high'})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      {editingReminder ? 'Update Reminder' : 'Add Reminder'}
                    </button>
                    <button
                      type="button"
                      onClick={resetReminderForm}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Reminders List */}
            <div className="bg-white shadow-sm rounded-lg border">
              {reminders.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>No reminders yet. Add your first reminder to get started!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {reminders.map((reminder) => (
                    <div key={reminder.id} className="p-6">
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => toggleReminderComplete(reminder)}
                          className="mt-1"
                        >
                          {reminder.completed ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className={`text-lg font-medium ${reminder.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                              {reminder.title}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(reminder.priority)}`}>
                              {reminder.priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Contact: {getContactName(reminder.contact_id)}
                          </p>
                          {reminder.description && (
                            <p className={`text-sm mt-2 ${reminder.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                              {reminder.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span>Due: {new Date(reminder.due_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => editReminder(reminder)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteReminder(reminder)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 
