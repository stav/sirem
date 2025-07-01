'use client'

import React, { useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'
import ContactList from '@/components/ContactList'
import ReminderList from '@/components/ReminderList'
import ContactForm from '@/components/ContactForm'
import ReminderForm from '@/components/ReminderForm'
import { useContacts } from '@/hooks/useContacts'
import { useReminders } from '@/hooks/useReminders'
import type { Database } from '@/lib/supabase'

type Contact = Database['public']['Tables']['contacts']['Row']
type Reminder = Database['public']['Tables']['reminders']['Row']

interface ContactFormData {
  first_name: string
  last_name: string
  phone: string
  email: string
  notes: string
  birthdate: string
  status: string
}

interface ReminderFormData {
  title: string
  description: string
  reminder_date: string
  priority: 'low' | 'medium' | 'high'
}

export default function ManagePage() {
  // Custom hooks for data management
  const { contacts, loading: contactsLoading, createContact, updateContact, deleteContact } = useContacts()
  const { reminders, loading: remindersLoading, createReminder, updateReminder, deleteReminder, toggleReminderComplete } = useReminders()

  // UI state
  const [showContactForm, setShowContactForm] = useState(false)
  const [showReminderForm, setShowReminderForm] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [singleContactView, setSingleContactView] = useState(false)

  // Form data
  const [contactForm, setContactForm] = useState<ContactFormData>({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    notes: '',
    birthdate: '',
    status: 'New'
  })

  const [reminderForm, setReminderForm] = useState<ReminderFormData>({
    title: '',
    description: '',
    reminder_date: '',
    priority: 'medium'
  })

  // Handle URL parameters for direct reminder editing
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const reminderId = urlParams.get('reminder')
    
    if (reminderId && reminders.length > 0) {
      const reminder = reminders.find(r => r.id === reminderId)
      if (reminder) {
        // Find the contact for this reminder
        const contact = contacts.find(c => c.id === reminder.contact_id)
        if (contact) {
          setSelectedContact(contact)
          setSingleContactView(true)
          // Open the reminder for editing
          handleEditReminder(reminder)
        }
      }
    }
  }, [reminders, contacts])

  // Contact handlers
  const handleAddContact = () => {
    setEditingContact(null)
    setContactForm({ first_name: '', last_name: '', phone: '', email: '', notes: '', birthdate: '', status: 'New' })
    setShowContactForm(true)
  }

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact)
    setContactForm({
      first_name: contact.first_name,
      last_name: contact.last_name,
      phone: contact.phone || '',
      email: contact.email || '',
      notes: contact.notes || '',
      birthdate: contact.birthdate || '',
      status: contact.status || 'New'
    })
    setShowContactForm(true)
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const success = editingContact 
      ? await updateContact(editingContact.id, contactForm)
      : await createContact(contactForm)

    if (success) {
      resetForms()
    }
  }

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return
    await deleteContact(contactId)
  }

  // Reminder handlers
  const handleAddReminder = () => {
    if (!selectedContact) return
    setEditingReminder(null)
    setReminderForm({ title: '', description: '', reminder_date: '', priority: 'medium' })
    setShowReminderForm(true)
  }

  const handleEditReminder = (reminder: Reminder) => {
    setEditingReminder(reminder)
    setReminderForm({
      title: reminder.title,
      description: reminder.description || '',
      reminder_date: reminder.reminder_date.split('T')[0],
      priority: reminder.priority
    })
    setShowReminderForm(true)
  }

  const handleReminderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedContact) return

    const success = editingReminder 
      ? await updateReminder(editingReminder.id, reminderForm)
      : await createReminder(selectedContact.id, reminderForm)

    if (success) {
      resetForms()
    }
  }

  const handleDeleteReminder = async (reminderId: string) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return
    await deleteReminder(reminderId)
  }

  const handleToggleReminderComplete = async (reminder: Reminder) => {
    await toggleReminderComplete(reminder)
  }

  // Utility functions
  const resetForms = () => {
    setContactForm({ first_name: '', last_name: '', phone: '', email: '', notes: '', birthdate: '', status: 'New' })
    setReminderForm({ title: '', description: '', reminder_date: '', priority: 'medium' })
    setShowContactForm(false)
    setShowReminderForm(false)
    setEditingContact(null)
    setEditingReminder(null)
  }

  const handleBackToAll = () => {
    setSingleContactView(false)
    setSelectedContact(null)
  }

  const loading = contactsLoading || remindersLoading

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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contacts Section */}
            <ContactList
              contacts={contacts}
              selectedContact={selectedContact}
              singleContactView={singleContactView}
              onAddContact={handleAddContact}
              onSelectContact={(contact) => {
                setSelectedContact(contact)
                setSingleContactView(true)
              }}
              onEditContact={handleEditContact}
              onDeleteContact={handleDeleteContact}
              onBackToAll={handleBackToAll}
            />

            {/* Reminders Section */}
            <ReminderList
              reminders={reminders}
              selectedContact={selectedContact}
              onAddReminder={handleAddReminder}
              onToggleComplete={handleToggleReminderComplete}
              onEditReminder={handleEditReminder}
              onDeleteReminder={handleDeleteReminder}
            />
          </div>

          {/* Contact Form Modal */}
          <ContactForm
            isOpen={showContactForm}
            editingContact={editingContact}
            formData={contactForm}
            onFormDataChange={setContactForm}
            onSubmit={handleContactSubmit}
            onCancel={resetForms}
          />

          {/* Reminder Form Modal */}
          <ReminderForm
            isOpen={showReminderForm}
            editingReminder={editingReminder}
            formData={reminderForm}
            onFormDataChange={setReminderForm}
            onSubmit={handleReminderSubmit}
            onCancel={resetForms}
          />
        </div>
      </div>
    </div>
  )
} 
