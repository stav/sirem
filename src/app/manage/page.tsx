'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Phone, Mail, Calendar, CheckCircle, Circle, Edit, Trash2 } from 'lucide-react'
import type { Database } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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

  function getContactName(contactId: string) {
    const contact = contacts.find((c: Contact) => c.id === contactId)
    return contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown Contact'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your CRM...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation pageTitle="Manage" />

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-border">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('contacts')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'contacts'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                Contacts ({contacts.length})
              </button>
              <button
                onClick={() => setActiveTab('reminders')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reminders'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
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
              <h2 className="text-xl font-semibold text-foreground">Contacts</h2>
              <Button
                onClick={() => setShowContactForm(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Contact
              </Button>
            </div>

            {/* Contact Form */}
            {showContactForm && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>
                    {editingContact ? 'Edit Contact' : 'Add New Contact'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">First Name</Label>
                        <Input
                          id="first_name"
                          type="text"
                          required
                          value={contactForm.first_name}
                          onChange={(e) => setContactForm({...contactForm, first_name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input
                          id="last_name"
                          type="text"
                          required
                          value={contactForm.last_name}
                          onChange={(e) => setContactForm({...contactForm, last_name: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={contactForm.email}
                          onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={contactForm.phone}
                          onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={contactForm.notes}
                        onChange={(e) => setContactForm({...contactForm, notes: e.target.value})}
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button type="submit">
                        {editingContact ? 'Update Contact' : 'Add Contact'}
                      </Button>
                      <Button type="button" variant="outline" onClick={resetContactForm}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Contacts List */}
            <Card>
              {contacts.length === 0 ? (
                <CardContent className="p-8 text-center text-muted-foreground">
                  <p>No contacts yet. Add your first contact to get started!</p>
                </CardContent>
              ) : (
                <div className="divide-y divide-border">
                  {contacts.map((contact) => (
                    <CardContent key={contact.id} className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-foreground">
                            {contact.first_name} {contact.last_name}
                          </h3>
                          <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                            {contact.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                <a href={`mailto:${contact.email}`} className="hover:text-foreground">
                                  {contact.email}
                                </a>
                              </div>
                            )}
                            {contact.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-4 h-4" />
                                <a href={`tel:${contact.phone}`} className="hover:text-foreground">
                                  {contact.phone}
                                </a>
                              </div>
                            )}
                          </div>
                          {contact.notes && (
                            <p className="mt-2 text-sm text-muted-foreground">{contact.notes}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => editContact(contact)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteContact(contact)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  ))}
                </div>
              )}
            </Card>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-foreground">Reminders</h2>
              <Button
                onClick={() => setShowReminderForm(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Reminder
              </Button>
            </div>

            {/* Reminder Form */}
            {showReminderForm && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>
                    {editingReminder ? 'Edit Reminder' : 'Add New Reminder'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleReminderSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact">Contact</Label>
                      <Select
                        value={reminderForm.contact_id}
                        onValueChange={(value) => setReminderForm({...reminderForm, contact_id: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a contact" />
                        </SelectTrigger>
                        <SelectContent>
                          {contacts.map((contact) => (
                            <SelectItem key={contact.id} value={contact.id}>
                              {contact.first_name} {contact.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        type="text"
                        required
                        value={reminderForm.title}
                        onChange={(e) => setReminderForm({...reminderForm, title: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={reminderForm.description}
                        onChange={(e) => setReminderForm({...reminderForm, description: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="due_date">Due Date</Label>
                        <Input
                          id="due_date"
                          type="datetime-local"
                          required
                          value={reminderForm.due_date}
                          onChange={(e) => setReminderForm({...reminderForm, due_date: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select
                          value={reminderForm.priority}
                          onValueChange={(value: 'low' | 'medium' | 'high') => setReminderForm({...reminderForm, priority: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button type="submit">
                        {editingReminder ? 'Update Reminder' : 'Add Reminder'}
                      </Button>
                      <Button type="button" variant="outline" onClick={resetReminderForm}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Reminders List */}
            <Card>
              {reminders.length === 0 ? (
                <CardContent className="p-8 text-center text-muted-foreground">
                  <p>No reminders yet. Add your first reminder to get started!</p>
                </CardContent>
              ) : (
                <div className="divide-y divide-border">
                  {reminders.map((reminder) => (
                    <CardContent key={reminder.id} className="p-6">
                      <div className="flex items-start gap-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleReminderComplete(reminder)}
                        >
                          {reminder.completed ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <Circle className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                          )}
                        </Button>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className={`text-lg font-medium ${reminder.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                              {reminder.title}
                            </h3>
                            <Badge variant={reminder.priority === 'high' ? 'destructive' : reminder.priority === 'medium' ? 'default' : 'secondary'}>
                              {reminder.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Contact: {getContactName(reminder.contact_id)}
                          </p>
                          {reminder.description && (
                            <p className={`text-sm mt-2 ${reminder.completed ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                              {reminder.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>Due: {new Date(reminder.due_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => editReminder(reminder)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteReminder(reminder)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  )
} 
