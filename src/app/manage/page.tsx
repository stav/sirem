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
import { useToast } from '@/hooks/use-toast'
import { logger } from '@/lib/logger'

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
  medicare_beneficiary_id: string
}

interface ReminderFormData {
  title: string
  description: string
  reminder_date: string
  priority: 'low' | 'medium' | 'high'
  reminder_type: string
  completed_date: string
}

export default function ManagePage() {
  // Custom hooks for data management
  const { contacts, loading: contactsLoading, createContact, updateContact, deleteContact } = useContacts()
  const { reminders, loading: remindersLoading, createReminder, updateReminder, deleteReminder, toggleReminderComplete } = useReminders()
  const { toast } = useToast()

  // UI state
  const [showContactForm, setShowContactForm] = useState(false)
  const [showReminderForm, setShowReminderForm] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [singleContactView, setSingleContactView] = useState(false)
  const [isSubmittingContact, setIsSubmittingContact] = useState(false)

  // Form data
  const [contactForm, setContactForm] = useState<ContactFormData>({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    notes: '',
    birthdate: '',
    status: 'New',
    medicare_beneficiary_id: ''
  })

  const [reminderForm, setReminderForm] = useState<ReminderFormData>({
    title: '',
    description: '',
    reminder_date: '',
    priority: 'medium',
    reminder_type: '',
    completed_date: ''
  })

  // Show/hide completed reminders
  const [showCompletedReminders, setShowCompletedReminders] = useState(false)

  // Handle URL parameters for direct reminder editing and contact selection
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const reminderId = urlParams.get('reminder')
    const contactId = urlParams.get('contact')
    
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
    } else if (contactId && contacts.length > 0) {
      const contact = contacts.find(c => c.id === contactId)
      if (contact) {
        setSelectedContact(contact)
        setSingleContactView(true)
      }
    }
  }, [reminders, contacts])

  // Contact handlers
  const handleAddContact = () => {
    setEditingContact(null)
    setContactForm({ first_name: '', last_name: '', phone: '', email: '', notes: '', birthdate: '', status: 'New', medicare_beneficiary_id: '' })
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
      status: contact.status || 'New',
      medicare_beneficiary_id: contact.medicare_beneficiary_id || ''
    })
    setShowContactForm(true)
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingContact(true)
    
    try {
      const success = editingContact 
        ? await updateContact(editingContact.id, contactForm)
        : await createContact(contactForm)

      if (success) {
        const contactName = `${contactForm.first_name} ${contactForm.last_name}`
        const action = editingContact ? 'updated' : 'created'
        
        // Update selectedContact if we're editing the currently selected contact
        if (editingContact && selectedContact && editingContact.id === selectedContact.id) {
          setSelectedContact({
            ...selectedContact,
            ...contactForm
          })
        }
        
        toast({
          title: `Contact ${action}`,
          description: `${contactName} was successfully ${action}.`,
        })
        resetForms()
      } else {
        toast({
          title: 'Error',
          description: `Failed to ${editingContact ? 'update' : 'create'} contact. Please try again.`,
          variant: 'destructive',
        })
      }
    } finally {
      setIsSubmittingContact(false)
    }
  }

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return
    
    const contact = contacts.find(c => c.id === contactId)
    const contactName = contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown Contact'
    
    const success = await deleteContact(contactId)
    
    if (success) {
      toast({
        title: 'Contact deleted',
        description: `${contactName} was successfully deleted.`,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Error',
        description: `Failed to delete ${contactName}. Please try again.`,
        variant: 'destructive',
      })
    }
  }

  // Reminder handlers
  const handleAddReminder = () => {
    if (!selectedContact) return
    setEditingReminder(null)
    setReminderForm({ title: '', description: '', reminder_date: '', priority: 'medium', reminder_type: '', completed_date: '' })
    setShowReminderForm(true)
  }

  const handleEditReminder = (reminder: Reminder) => {
    setEditingReminder(reminder)
    setReminderForm({
      title: reminder.title,
      description: reminder.description || '',
      reminder_date: reminder.reminder_date.split('T')[0],
      priority: reminder.priority,
      reminder_type: reminder.reminder_type || '',
      completed_date: reminder.completed_date ? reminder.completed_date.split('T')[0] : ''
    })
    setShowReminderForm(true)
  }

  const handleReminderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingReminder) {
      // Update existing reminder - doesn't need selectedContact
      const success = await updateReminder(editingReminder.id, reminderForm)
      
      if (success) {
        // Find the contact for this reminder
        const contact = contacts.find(c => c.id === editingReminder.contact_id)
        const contactName = contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown Contact'
        
        toast({
          title: 'Reminder updated',
          description: `"${reminderForm.title}" for ${contactName} was successfully updated.`,
        })
        logger.info(`Reminder updated: ${reminderForm.title} for ${contactName}`, 'reminder_update')
        resetForms()
      }
    } else {
      // Create new reminder - needs selectedContact
      if (!selectedContact) return
      
      const success = await createReminder(selectedContact.id, reminderForm)
      
      if (success) {
        toast({
          title: 'Reminder created',
          description: `"${reminderForm.title}" was successfully created.`,
        })
        logger.info(`Reminder created: ${reminderForm.title}`, 'reminder_create')
        resetForms()
      }
    }
  }

  const handleDeleteReminder = async (reminderId: string) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return
    const reminder = reminders.find(r => r.id === reminderId)
    const contact = reminder ? contacts.find(c => c.id === reminder.contact_id) : undefined
    await deleteReminder(reminderId)
    if (reminder) {
      const contactName = contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown Contact'
      toast({
        title: 'Reminder deleted',
        description: `"${reminder.title}" for ${contactName} was deleted.`,
        variant: 'destructive',
      })
      logger.info(`Reminder deleted: ${reminder.title} for ${contactName}`, 'reminder_delete')
    }
  }

  const handleToggleReminderComplete = async (reminder: Reminder) => {
    const success = await toggleReminderComplete(reminder)
    if (success) {
      const contact = contacts.find(c => c.id === reminder.contact_id)
      const contactName = contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown Contact'
      const action = reminder.is_complete ? 'marked as incomplete' : 'marked as complete'
      
      toast({
        title: 'Reminder updated',
        description: `"${reminder.title}" for ${contactName} was ${action}.`,
      })
      logger.info(`Reminder ${action}: ${reminder.title} for ${contactName}`, 'reminder_toggle')
    }
  }

  // Utility functions
  const resetForms = () => {
    setContactForm({ first_name: '', last_name: '', phone: '', email: '', notes: '', birthdate: '', status: 'New', medicare_beneficiary_id: '' })
    setReminderForm({ title: '', description: '', reminder_date: '', priority: 'medium', reminder_type: '', completed_date: '' })
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
              contacts={contacts}
              selectedContact={selectedContact}
              onAddReminder={handleAddReminder}
              onToggleComplete={handleToggleReminderComplete}
              onEditReminder={handleEditReminder}
              onDeleteReminder={handleDeleteReminder}
              showCompletedReminders={showCompletedReminders}
              onToggleShowCompleted={() => setShowCompletedReminders((v) => !v)}
              onSelectContact={(contactId) => {
                const contact = contacts.find(c => c.id === contactId)
                if (contact) {
                  setSelectedContact(contact)
                  setSingleContactView(true)
                }
              }}
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
            isLoading={isSubmittingContact}
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
