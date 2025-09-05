'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Navigation from '@/components/Navigation'
import ContactList from '@/components/ContactList'
import ActionList from '@/components/ActionList'
import ActionForm from '@/components/ActionForm'
import ActionViewModal from '@/components/ActionViewModal'
import ContactViewModal from '@/components/ContactViewModal'
import ContactForm from '@/components/ContactForm'
import { useContacts } from '@/hooks/useContacts'
import { useActions } from '@/hooks/useActions'
import type { Database } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { logger } from '@/lib/logger'
import { RoleData, RoleType } from '@/types/roles'

type Contact = Database['public']['Tables']['contacts']['Row'] & {
  addresses?: Database['public']['Tables']['addresses']['Row'][]
  contact_roles?: Database['public']['Tables']['contact_roles']['Row'][]
}
type Action = Database['public']['Tables']['actions']['Row']

// Type for a role that hasn't been saved to the database yet
type PendingRole = {
  id: string // temporary ID for React key
  role_type: RoleType
  role_data: RoleData
  is_primary: boolean
}

interface ContactFormData {
  first_name: string
  last_name: string
  phone: string
  email: string
  notes: string
  birthdate: string
  status: string
  medicare_beneficiary_id: string
  ssn: string
}

interface ActionFormData {
  title: string
  description: string
  tags: string
  start_date: string | null
  end_date: string | null
  completed_date: string | null
  status: string | null
  priority: string | null
  duration: number | null
  outcome: string | null
}

export default function ManagePage() {
  // Custom hooks for data management
  const {
    contacts,
    loading: contactsLoading,
    fetchContacts: originalFetchContacts,
    createContact,
    updateContact,
    deleteContact,
  } = useContacts()

  // Wrap fetchContacts to add debugging
  const fetchContacts = async () => {
    await originalFetchContacts()
    setRefreshTimestamp(Date.now())
  }
  // UI state
  const [showContactForm, setShowContactForm] = useState(false)
  const [showActionForm, setShowActionForm] = useState(false)
  const [showActionViewModal, setShowActionViewModal] = useState(false)
  const [showContactViewModal, setShowContactViewModal] = useState(false)
  const [viewingAction, setViewingAction] = useState<Action | null>(null)
  const [viewingContact, setViewingContact] = useState<Contact | null>(null)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [editingAction, setEditingAction] = useState<Action | null>(null)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [singleContactView, setSingleContactView] = useState(false)
  const [isSubmittingContact, setIsSubmittingContact] = useState(false)
  const [refreshTimestamp, setRefreshTimestamp] = useState<number>(Date.now())
  const [roleRefreshTrigger, setRoleRefreshTrigger] = useState<number>(0)
  const [pendingRoles, setPendingRoles] = useState<PendingRole[]>([])
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([])

  // Memoize the callback to prevent infinite re-renders
  const handleFilteredContactsChange = useCallback((contacts: Contact[]) => {
    setFilteredContacts(contacts)
  }, [])

  // Update selectedContact when contacts list changes
  useEffect(() => {
    if (selectedContact && contacts.length > 0) {
      const updatedContact = contacts.find((c) => c.id === selectedContact.id)
      if (updatedContact) {
        setSelectedContact(updatedContact)
      }
    }
  }, [contacts, selectedContact])
  const {
    actions,
    loading: actionsLoading,
    createAction,
    updateAction,
    deleteAction,
    toggleActionComplete,
    completeActionWithCreatedDate,
  } = useActions()
  const { toast } = useToast()

  // Form data
  const [contactForm, setContactForm] = useState<ContactFormData>({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    notes: '',
    birthdate: '',
    status: 'New',
    medicare_beneficiary_id: '',
    ssn: '',
  })

  const [actionForm, setActionForm] = useState<ActionFormData>({
    title: '',
    description: '',
    tags: '',
    start_date: null,
    end_date: null,
    completed_date: null,
    status: null,
    priority: null,
    duration: null,
    outcome: null,
  })

  // Show/hide completed actions
  const [showCompletedActions, setShowCompletedActions] = useState(false)

  // Handle URL parameters for direct action editing and contact selection
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const actionId = urlParams.get('action')
    const contactId = urlParams.get('contact')

    if (actionId && actions.length > 0) {
      const action = actions.find((a) => a.id === actionId)
      if (action) {
        // Find the contact for this action
        const contact = contacts.find((c) => c.id === action.contact_id)
        if (contact) {
          setSelectedContact(contact)
          setSingleContactView(true)
          // Open the action for editing
          handleEditAction(action)
        }
      }
    } else if (contactId && contacts.length > 0) {
      const contact = contacts.find((c) => c.id === contactId)
      if (contact) {
        setSelectedContact(contact)
        setSingleContactView(true)
      }
    }
  }, [actions, contacts])

  // Contact handlers
  const handleAddContact = () => {
    setEditingContact(null)
    setContactForm({
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      notes: '',
      birthdate: '',
      status: 'New',
      medicare_beneficiary_id: '',
      ssn: '',
    })
    setPendingRoles([])
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
      medicare_beneficiary_id: contact.medicare_beneficiary_id || '',
      ssn: contact.ssn || '',
    })
    setShowContactForm(true)
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingContact(true)

    try {
      const result = editingContact
        ? await updateContact(editingContact.id, contactForm)
        : await createContact(contactForm, pendingRoles)

      if (result) {
        const contactName = `${contactForm.first_name} ${contactForm.last_name}`
        const action = editingContact ? 'updated' : 'created'

        // Update selectedContact if we're editing the currently selected contact
        if (editingContact && selectedContact && editingContact.id === selectedContact.id) {
          if (typeof result === 'object') {
            // result is the updated contact data
            setSelectedContact(result)
          } else {
            // result is true (for create), update with form data
            setSelectedContact({
              ...selectedContact,
              ...contactForm,
            })
          }
        }

        // Update viewingContact if we're editing the contact being viewed
        if (editingContact && viewingContact && editingContact.id === viewingContact.id) {
          if (typeof result === 'object') {
            // result is the updated contact data
            setViewingContact(result)
          }
        }

        // Refresh the contacts list to get updated data
        await fetchContacts()

        toast({
          title: `Contact ${action}`,
          description: `${contactName} was successfully ${action}.`,
        })
        closeContactForm()
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

    const contact = contacts.find((c) => c.id === contactId)
    const contactName = contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown Contact'

    const success = await deleteContact(contactId)

    if (success) {
      // If the deleted contact was the selected contact, navigate back to full list
      if (selectedContact && selectedContact.id === contactId) {
        setSingleContactView(false)
        setSelectedContact(null)
      }

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

  // Action handlers
  const handleAddAction = () => {
    if (!selectedContact) return
    setEditingAction(null)
    setActionForm({
      title: '',
      description: '',
      tags: '',
      start_date: null,
      end_date: null,
      completed_date: null,
      status: null,
      priority: null,
      duration: null,
      outcome: null,
    })
    setShowActionForm(true)
  }

  const handleEditAction = (action: Action) => {
    setEditingAction(action)
    setActionForm({
      title: action.title,
      description: action.description || '',
      tags: action.tags || '',
      start_date: action.start_date || null,
      end_date: action.end_date || null,
      completed_date: action.completed_date || null,
      status: action.status,
      priority: action.priority,
      duration: action.duration,
      outcome: action.outcome,
    })
    setShowActionForm(true)
  }

  const handleViewAction = (action: Action) => {
    setViewingAction(action)
    setShowActionViewModal(true)
  }

  const handleViewContact = (contact: Contact) => {
    setViewingContact(contact)
    setShowContactViewModal(true)
  }

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (editingAction) {
      // Update existing action - doesn't need selectedContact
      const success = await updateAction(editingAction.id, actionForm)

      if (success) {
        // Find the contact for this action
        const contact = contacts.find((c) => c.id === editingAction.contact_id)
        const contactName = contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown Contact'

        toast({
          title: 'Action updated',
          description: `"${actionForm.title}" for ${contactName} was successfully updated.`,
        })
        logger.info(`Action updated: ${actionForm.title} for ${contactName}`, 'action_update')
        closeActionForm()
      }
    } else {
      // Create new action - needs selectedContact
      if (!selectedContact) return

      const success = await createAction(selectedContact.id, actionForm)

      if (success) {
        toast({
          title: 'Action created',
          description: `"${actionForm.title}" was successfully created.`,
        })
        logger.info(`Action created: ${actionForm.title}`, 'action_create')
        closeActionForm()
      }
    }
  }

  const handleDeleteAction = async (actionId: string) => {
    if (!confirm('Are you sure you want to delete this action?')) return
    const action = actions.find((a) => a.id === actionId)
    const contact = action ? contacts.find((c) => c.id === action.contact_id) : undefined
    await deleteAction(actionId)
    if (action) {
      const contactName = contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown Contact'
      toast({
        title: 'Action deleted',
        description: `"${action.title}" for ${contactName} was deleted.`,
        variant: 'destructive',
      })
      logger.info(`Action deleted: ${action.title} for ${contactName}`, 'action_delete')
    }
  }

  const handleToggleActionComplete = async (action: Action) => {
    const success = await toggleActionComplete(action)
    if (success) {
      const contact = contacts.find((c) => c.id === action.contact_id)
      const contactName = contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown Contact'
      const actionText = action.status === 'completed' ? 'marked as incomplete' : 'marked as complete'

      toast({
        title: 'Action updated',
        description: `"${action.title}" for ${contactName} was ${actionText}.`,
      })
      logger.info(`Action ${actionText}: ${action.title} for ${contactName}`, 'action_toggle')
    }
  }

  const handleCompleteActionWithCreatedDate = async (action: Action) => {
    const success = await completeActionWithCreatedDate(action)
    if (success) {
      const contact = contacts.find((c) => c.id === action.contact_id)
      const contactName = contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown Contact'

      toast({
        title: 'Action completed',
        description: `"${action.title}" for ${contactName} was marked as complete using the created date.`,
      })
      logger.info(`Action completed with created date: ${action.title} for ${contactName}`, 'action_complete_created')
    }
  }

  // Individual modal close handlers
  const closeContactForm = () => {
    setShowContactForm(false)
    setEditingContact(null)
    setContactForm({
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      notes: '',
      birthdate: '',
      status: 'New',
      medicare_beneficiary_id: '',
      ssn: '',
    })
    setPendingRoles([])
  }

  const closeActionForm = () => {
    setShowActionForm(false)
    setEditingAction(null)
    setActionForm({
      title: '',
      description: '',
      tags: '',
      start_date: null,
      end_date: null,
      completed_date: null,
      status: null,
      priority: null,
      duration: null,
      outcome: null,
    })
  }

  const closeActionViewModal = () => {
    setShowActionViewModal(false)
    setViewingAction(null)
  }

  const closeContactViewModal = () => {
    setShowContactViewModal(false)
    setViewingContact(null)
  }

  const handleBackToAll = () => {
    setSingleContactView(false)
    setSelectedContact(null)
    // Clear the query string without causing a full page navigation
    const url = new URL(window.location.href)
    url.searchParams.delete('contact')
    url.searchParams.delete('action')
    window.history.replaceState({}, '', url.toString())
  }

  const loading = contactsLoading || actionsLoading

  if (loading) {
    return (
      <div className="bg-background min-h-screen">
        <Navigation pageTitle="Manage" />
        <div className="p-6">
          <div className="mx-auto max-w-7xl">
            <div className="animate-pulse">
              <div className="bg-muted mb-8 h-8 w-1/4 rounded"></div>
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <div className="bg-muted h-96 rounded"></div>
                <div className="bg-muted h-96 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen">
      <Navigation pageTitle="Manage" />

      <div className="p-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
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
              onViewContact={handleViewContact}
              onBackToAll={handleBackToAll}
              refreshTimestamp={refreshTimestamp}
              onFilteredContactsChange={handleFilteredContactsChange}
            />

            {/* Actions Section */}
            <ActionList
              actions={actions}
              contacts={contacts}
              selectedContact={selectedContact}
              filteredContacts={filteredContacts}
              onAddAction={handleAddAction}
              onToggleComplete={handleToggleActionComplete}
              onCompleteWithCreatedDate={handleCompleteActionWithCreatedDate}
              onEditAction={handleEditAction}
              onViewAction={handleViewAction}
              onDeleteAction={handleDeleteAction}
              showCompletedActions={showCompletedActions}
              onToggleShowCompleted={() => setShowCompletedActions((v) => !v)}
              onSelectContact={(contactId) => {
                const contact = contacts.find((c) => c.id === contactId)
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
            onCancel={closeContactForm}
            isLoading={isSubmittingContact}
            onRefreshContact={() => {
              fetchContacts()
              setRoleRefreshTrigger(Date.now())
            }}
            onPendingRolesChange={setPendingRoles}
            roleRefreshTrigger={roleRefreshTrigger}
          />

          {/* Action Form Modal */}
          <ActionForm
            isOpen={showActionForm}
            onClose={closeActionForm}
            onSubmit={handleActionSubmit}
            action={editingAction}
            formData={actionForm}
            setFormData={setActionForm}
            isSubmitting={false}
          />

          {/* Action View Modal */}
          <ActionViewModal
            isOpen={showActionViewModal}
            onClose={closeActionViewModal}
            action={viewingAction}
            contactName={
              viewingAction
                ? contacts.find((c) => c.id === viewingAction.contact_id)
                  ? `${contacts.find((c) => c.id === viewingAction.contact_id)?.first_name} ${contacts.find((c) => c.id === viewingAction.contact_id)?.last_name}`
                  : 'Unknown Contact'
                : ''
            }
          />

          {/* Contact View Modal */}
          <ContactViewModal
            isOpen={showContactViewModal}
            onClose={closeContactViewModal}
            contact={viewingContact}
            onEdit={(contact) => {
              // Keep view modal open and open edit modal on top
              handleEditContact(contact)
            }}
            onRefresh={fetchContacts}
            roleRefreshTrigger={roleRefreshTrigger}
          />
        </div>
      </div>
    </div>
  )
}
