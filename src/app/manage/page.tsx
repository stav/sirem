'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Edit, Trash2, Check, X } from 'lucide-react'
import Navigation from '@/components/Navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import type { Database } from '@/lib/supabase'
import { logger } from '@/lib/logger'

type Contact = Database['public']['Tables']['contacts']['Row']
type Reminder = Database['public']['Tables']['reminders']['Row']

interface ContactForm {
  first_name: string
  last_name: string
  notes: string
}

interface ReminderForm {
  title: string
  description: string
  reminder_date: string
  priority: 'low' | 'medium' | 'high'
}

export default function ManagePage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [showContactForm, setShowContactForm] = useState(false)
  const [showReminderForm, setShowReminderForm] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)

  const [contactForm, setContactForm] = useState<ContactForm>({
    first_name: '',
    last_name: '',
    notes: ''
  })

  const [reminderForm, setReminderForm] = useState<ReminderForm>({
    title: '',
    description: '',
    reminder_date: '',
    priority: 'medium'
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [contactsResponse, remindersResponse] = await Promise.all([
        supabase.from('contacts').select('*').order('created_at', { ascending: false }),
        supabase.from('reminders').select('*').order('reminder_date', { ascending: true })
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
        // Update existing contact
        const { error } = await supabase
          .from('contacts')
          .update({
            first_name: contactForm.first_name,
            last_name: contactForm.last_name,
            notes: contactForm.notes
          })
          .eq('id', editingContact.id)

        if (error) {
          console.error('Error updating contact:', error)
          return
        }

        logger.contactUpdated(`${contactForm.first_name} ${contactForm.last_name}`)
      } else {
        // Create new contact
        const { error } = await supabase
          .from('contacts')
          .insert({
            first_name: contactForm.first_name,
            last_name: contactForm.last_name,
            notes: contactForm.notes
          })

        if (error) {
          console.error('Error creating contact:', error)
          return
        }

        logger.contactCreated(`${contactForm.first_name} ${contactForm.last_name}`)
      }

      // Reset form and refresh data
      setContactForm({ first_name: '', last_name: '', notes: '' })
      setShowContactForm(false)
      setEditingContact(null)
      fetchData()
    } catch (error) {
      console.error('Error saving contact:', error)
    }
  }

  async function handleReminderSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!selectedContact) return

    try {
      if (editingReminder) {
        // Update existing reminder
        const { error } = await supabase
          .from('reminders')
          .update({
            title: reminderForm.title,
            description: reminderForm.description,
            reminder_date: reminderForm.reminder_date,
            priority: reminderForm.priority
          })
          .eq('id', editingReminder.id)

        if (error) {
          console.error('Error updating reminder:', error)
          return
        }
      } else {
        // Create new reminder
        const { error } = await supabase
          .from('reminders')
          .insert({
            contact_id: selectedContact.id,
            title: reminderForm.title,
            description: reminderForm.description,
            reminder_date: reminderForm.reminder_date,
            priority: reminderForm.priority
          })

        if (error) {
          console.error('Error creating reminder:', error)
          return
        }
      }

      // Reset form and refresh data
      setReminderForm({ title: '', description: '', reminder_date: '', priority: 'medium' })
      setShowReminderForm(false)
      setEditingReminder(null)
      fetchData()
    } catch (error) {
      console.error('Error saving reminder:', error)
    }
  }

  async function handleDeleteContact(contactId: string) {
    if (!confirm('Are you sure you want to delete this contact?')) return

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId)

      if (error) {
        console.error('Error deleting contact:', error)
        return
      }

      fetchData()
    } catch (error) {
      console.error('Error deleting contact:', error)
    }
  }

  async function handleDeleteReminder(reminderId: string) {
    if (!confirm('Are you sure you want to delete this reminder?')) return

    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', reminderId)

      if (error) {
        console.error('Error deleting reminder:', error)
        return
      }

      fetchData()
    } catch (error) {
      console.error('Error deleting reminder:', error)
    }
  }

  async function handleToggleReminderComplete(reminder: Reminder) {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({ 
          is_complete: !reminder.is_complete,
          completed_date: !reminder.is_complete ? new Date().toISOString() : null
        })
        .eq('id', reminder.id)

      if (error) {
        console.error('Error updating reminder:', error)
        return
      }

      fetchData()
    } catch (error) {
      console.error('Error updating reminder:', error)
    }
  }

  function handleEditContact(contact: Contact) {
    setEditingContact(contact)
    setContactForm({
      first_name: contact.first_name,
      last_name: contact.last_name,
      notes: contact.notes || ''
    })
    setShowContactForm(true)
  }

  function handleEditReminder(reminder: Reminder) {
    setEditingReminder(reminder)
    setReminderForm({
      title: reminder.title,
      description: reminder.description || '',
      reminder_date: reminder.reminder_date.split('T')[0],
      priority: reminder.priority
    })
    setShowReminderForm(true)
  }

  function resetForms() {
    setContactForm({ first_name: '', last_name: '', notes: '' })
    setReminderForm({ title: '', description: '', reminder_date: '', priority: 'medium' })
    setShowContactForm(false)
    setShowReminderForm(false)
    setEditingContact(null)
    setEditingReminder(null)
  }

  // Get reminders for selected contact
  const contactReminders = reminders.filter(r => r.contact_id === selectedContact?.id)

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation pageTitle="Manage" />
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-1/4 mb-8"></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="h-96 bg-muted rounded"></div>
                <div className="h-96 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation pageTitle="Manage" />
      
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">Manage Contacts & Reminders</h1>
            <p className="text-muted-foreground mt-2">
              Add, edit, and manage your contacts and their reminders.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contacts Section */}
            <div>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Contacts</CardTitle>
                    <Button 
                      onClick={() => setShowContactForm(true)}
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Contact
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {contacts.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No contacts yet</p>
                      <Button 
                        onClick={() => setShowContactForm(true)}
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add your first contact
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {contacts.map((contact) => (
                        <div 
                          key={contact.id} 
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedContact?.id === contact.id 
                              ? 'border-primary bg-primary/5' 
                              : 'hover:bg-muted/50'
                          }`}
                          onClick={() => setSelectedContact(contact)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium">
                                {contact.first_name} {contact.last_name}
                              </h3>
                              {contact.notes && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {contact.notes}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditContact(contact)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteContact(contact.id)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Reminders Section */}
            <div>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      Reminders
                      {selectedContact && (
                        <span className="text-sm font-normal text-muted-foreground ml-2">
                          for {selectedContact.first_name} {selectedContact.last_name}
                        </span>
                      )}
                    </CardTitle>
                    {selectedContact && (
                      <Button 
                        onClick={() => setShowReminderForm(true)}
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Reminder
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {!selectedContact ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Select a contact to view their reminders</p>
                    </div>
                  ) : contactReminders.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No reminders for this contact</p>
                      <Button 
                        onClick={() => setShowReminderForm(true)}
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add reminder
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {contactReminders.map((reminder) => (
                        <div key={reminder.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h4 className={`font-medium ${reminder.is_complete ? 'line-through text-muted-foreground' : ''}`}>
                                  {reminder.title}
                                </h4>
                                <Badge 
                                  variant={reminder.priority === 'high' ? 'destructive' : 
                                          reminder.priority === 'medium' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {reminder.priority}
                                </Badge>
                              </div>
                              {reminder.description && (
                                <p className={`text-sm mt-1 ${reminder.is_complete ? 'text-muted-foreground' : ''}`}>
                                  {reminder.description}
                                </p>
                              )}
                              <div className="flex items-center mt-2 space-x-4 text-xs text-muted-foreground">
                                <span>Due: {new Date(reminder.reminder_date).toLocaleDateString()}</span>
                                {reminder.is_complete && reminder.completed_date && (
                                  <span>Completed: {new Date(reminder.completed_date).toLocaleDateString()}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleReminderComplete(reminder)}
                              >
                                {reminder.is_complete ? (
                                  <X className="h-4 w-4" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditReminder(reminder)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteReminder(reminder.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Contact Form Modal */}
          {showContactForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle>
                    {editingContact ? 'Edit Contact' : 'Add New Contact'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        value={contactForm.first_name}
                        onChange={(e) => setContactForm({...contactForm, first_name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        value={contactForm.last_name}
                        onChange={(e) => setContactForm({...contactForm, last_name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={contactForm.notes}
                        onChange={(e) => setContactForm({...contactForm, notes: e.target.value})}
                        rows={3}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button type="submit" className="flex-1">
                        {editingContact ? 'Update' : 'Create'}
                      </Button>
                      <Button type="button" variant="outline" onClick={resetForms}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Reminder Form Modal */}
          {showReminderForm && selectedContact && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle>
                    {editingReminder ? 'Edit Reminder' : 'Add New Reminder'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleReminderSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={reminderForm.title}
                        onChange={(e) => setReminderForm({...reminderForm, title: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={reminderForm.description}
                        onChange={(e) => setReminderForm({...reminderForm, description: e.target.value})}
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="reminder_date">Due Date</Label>
                      <Input
                        id="reminder_date"
                        type="date"
                        value={reminderForm.reminder_date}
                        onChange={(e) => setReminderForm({...reminderForm, reminder_date: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={reminderForm.priority}
                        onValueChange={(value: 'low' | 'medium' | 'high') => 
                          setReminderForm({...reminderForm, priority: value})
                        }
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
                    <div className="flex space-x-2">
                      <Button type="submit" className="flex-1">
                        {editingReminder ? 'Update' : 'Create'}
                      </Button>
                      <Button type="button" variant="outline" onClick={resetForms}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
