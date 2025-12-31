'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navigation from '@/components/Navigation'
import ContactList from '@/components/ContactList'
import ActionList from '@/components/ActionList'
import ActionForm from '@/components/ActionForm'
import ActionViewModal from '@/components/ActionViewModal'
import ContactViewModal from '@/components/ContactViewModal'
import ContactForm from '@/components/ContactForm'
import ContactNotesModal from '@/components/ContactNotesModal'
import CampaignFromFilter from '@/components/CampaignFromFilter'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Mail } from 'lucide-react'
import { useContacts, PendingRole } from '@/hooks/useContacts'
import { useActions } from '@/hooks/useActions'
import { useToast } from '@/hooks/use-toast'
import { logger } from '@/lib/logger'
import { getLocalTimeAsUTC } from '@/lib/utils'
import type { ManageContact, ManageAction } from '@/types/manage'

type Contact = ManageContact
type Action = ManageAction

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

interface ManageClientProps {
  initialContacts: Contact[]
  initialActions: Action[]
}

export default function ManageClient({ initialContacts, initialActions }: ManageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const {
    contacts,
    loading: contactsLoading,
    fetchContacts: originalFetchContacts,
    createContact,
    updateContact,
    deleteContact,
  } = useContacts({
    initialContacts,
    autoFetch: false,
  })

  const fetchContacts = async (isRefresh = false) => {
    await originalFetchContacts(isRefresh)
    setRefreshTimestamp(Date.now())
  }

  const {
    actions,
    loading: actionsLoading,
    createAction,
    updateAction,
    deleteAction,
    toggleActionComplete,
    completeActionWithCreatedDate,
  } = useActions({
    initialActions,
    autoFetch: false,
  })

  const { toast } = useToast()

  const [showContactForm, setShowContactForm] = useState(false)
  const [showActionForm, setShowActionForm] = useState(false)
  const [showActionViewModal, setShowActionViewModal] = useState(false)
  const [showContactViewModal, setShowContactViewModal] = useState(false)
  const [showContactNotesModal, setShowContactNotesModal] = useState(false)
  const [viewingAction, setViewingAction] = useState<Action | null>(null)
  const [viewingContact, setViewingContact] = useState<Contact | null>(null)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [editingContactForNotes, setEditingContactForNotes] = useState<Contact | null>(null)
  const [editingAction, setEditingAction] = useState<Action | null>(null)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [singleContactView, setSingleContactView] = useState(false)
  const [isSubmittingContact, setIsSubmittingContact] = useState(false)
  const [isSubmittingAction, setIsSubmittingAction] = useState(false)
  const [refreshTimestamp, setRefreshTimestamp] = useState<number>(Date.now())
  const [roleRefreshTrigger, setRoleRefreshTrigger] = useState<number>(0)
  const [pendingRoles, setPendingRoles] = useState<PendingRole[]>([])
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([])
  const [filteredContactForActions, setFilteredContactForActions] = useState<Contact | null>(null)
  const [isQuickFilterHelperOpen, setIsQuickFilterHelperOpen] = useState(false)
  const [isExportListModalOpen, setIsExportListModalOpen] = useState(false)
  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const handleFilteredContactsChange = useCallback((contacts: Contact[]) => {
    setFilteredContacts(contacts)
  }, [])

  const isAnyModalOpen = useMemo(
    () =>
      showContactForm ||
      showActionForm ||
      showActionViewModal ||
      showContactViewModal ||
      showContactNotesModal ||
      isExportListModalOpen ||
      showCampaignModal,
    [
      showContactForm,
      showActionForm,
      showActionViewModal,
      showContactViewModal,
      showContactNotesModal,
      isExportListModalOpen,
      showCampaignModal,
    ]
  )

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return
      if (selectedContact) return
      if (isAnyModalOpen) return
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (!event.key || event.key.toLowerCase() !== 'f') return
      if (event.repeat) return

      const target = event.target as HTMLElement | null
      const tagName = target?.tagName
      const isTypingTarget =
        target && (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || target.isContentEditable)
      if (isTypingTarget) return

      event.preventDefault()
      setIsQuickFilterHelperOpen((prev) => !prev)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedContact, isAnyModalOpen])

  useEffect(() => {
    if (selectedContact && contacts.length > 0) {
      const updatedContact = contacts.find((c) => c.id === selectedContact.id)
      if (updatedContact) {
        setSelectedContact(updatedContact)
      }
    }
  }, [contacts, selectedContact])

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

  const [showCompletedActions, setShowCompletedActions] = useState(false)

  useEffect(() => {
    const actionId = searchParams.get('action')
    const contactId = searchParams.get('contact')

    if (contactsLoading || actionsLoading) {
      return
    }

    if (actionId && actions.length > 0) {
      const action = actions.find((a) => a.id === actionId)
      if (action) {
        const contact = contacts.find((c) => c.id === action.contact_id)
        if (contact) {
          setSelectedContact(contact)
          setSingleContactView(true)
        }
        handleViewAction(action)
      }
    } else if (contactId) {
      const contact = contacts.find((c) => c.id === contactId)
      if (contact && (!selectedContact || selectedContact.id !== contact.id)) {
        setSelectedContact(contact)
        setSingleContactView(true)
        const contactName = `${contact.first_name} ${contact.last_name}`
        logger.contactSelected(contactName, contact.id)
      } else if (contact) {
        setSelectedContact(contact)
        setSingleContactView(true)
      } else {
        logger.error(`Contact not found: ${contactId}`, 'contact_not_found', contactId)
        router.replace('/manage')
      }
    } else if (!actionId && !contactId) {
      setSelectedContact(null)
      setSingleContactView(false)
    }
  }, [searchParams, actions, contacts, contactsLoading, actionsLoading, router])

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

        if (editingContact && selectedContact && editingContact.id === selectedContact.id) {
          if (typeof result === 'object') {
            setSelectedContact(result)
          } else {
            setSelectedContact({
              ...selectedContact,
              ...contactForm,
            })
          }
        }

        if (editingContact && viewingContact && editingContact.id === viewingContact.id) {
          if (typeof result === 'object') {
            setViewingContact(result)
          }
        }

        // No need to call fetchContacts() - the hook handles it with optimistic updates
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

  const handleAddAction = () => {
    const contactToUse = selectedContact || filteredContactForActions
    if (!contactToUse) return
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

  const handleEditNotes = (contact: Contact) => {
    setEditingContactForNotes(contact)
    setShowContactNotesModal(true)
  }

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingAction(true)

    try {
      if (editingAction) {
        const success = await updateAction(editingAction.id, actionForm)

        if (success) {
          const contact = contacts.find((c) => c.id === editingAction.contact_id)
          const contactName = contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown Contact'

          toast({
            title: 'Action updated',
            description: `"${actionForm.title}" for ${contactName} was successfully updated.`,
          })
          logger.info(
            `Action updated: ${actionForm.title} for ${contactName}`,
            'action_update',
            editingAction.contact_id
          )
          closeActionForm()
        } else {
          toast({
            title: 'Error',
            description: 'Failed to update action. Please try again.',
            variant: 'destructive',
          })
        }
      } else {
        const contactToUse = selectedContact || filteredContactForActions
        if (!contactToUse) {
          setIsSubmittingAction(false)
          return
        }

        const success = await createAction(contactToUse.id, actionForm)

        if (success) {
          const contactName = contactToUse ? `${contactToUse.first_name} ${contactToUse.last_name}` : 'Unknown Contact'
          toast({
            title: 'Action created',
            description: `"${actionForm.title}" for ${contactName} was successfully created.`,
          })
          logger.info(`Action created: ${actionForm.title}`, 'action_create', contactToUse.id)
          closeActionForm()
        } else {
          toast({
            title: 'Error',
            description: 'Failed to create action. Please try again.',
            variant: 'destructive',
          })
        }
      }
    } finally {
      setIsSubmittingAction(false)
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
      logger.info(`Action deleted: ${action.title} for ${contactName}`, 'action_delete', action.contact_id)
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
      logger.info(`Action ${actionText}: ${action.title} for ${contactName}`, 'action_toggle', action.contact_id)
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
      logger.info(
        `Action completed with created date: ${action.title} for ${contactName}`,
        'action_complete_created',
        action.contact_id
      )
    }
  }

  const handleCreateVoicemailAction = async () => {
    const contactToUse = selectedContact || filteredContactForActions
    if (!contactToUse) return

    const currentDateTime = getLocalTimeAsUTC()
    const voicemailActionData: ActionFormData = {
      title: 'Voicemail',
      description: '',
      tags: '',
      start_date: currentDateTime,
      end_date: null,
      completed_date: currentDateTime,
      status: 'completed',
      priority: null,
      duration: null,
      outcome: null,
    }

    const success = await createAction(contactToUse.id, voicemailActionData)

    if (success) {
      const contactName = `${contactToUse.first_name} ${contactToUse.last_name}`
      toast({
        title: 'Action created',
        description: `"Voicemail" for ${contactName} was successfully created.`,
      })
      logger.info(`Voicemail action created for ${contactName}`, 'action_create', contactToUse.id)
      closeActionForm()
    } else {
      toast({
        title: 'Error',
        description: 'Failed to create voicemail action. Please try again.',
        variant: 'destructive',
      })
    }
  }

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

  const closeContactNotesModal = () => {
    setShowContactNotesModal(false)
    setEditingContactForNotes(null)
  }

  const handleBackToAll = () => {
    setSingleContactView(false)
    setSelectedContact(null)
    const url = new URL(window.location.href)
    url.searchParams.delete('contact')
    url.searchParams.delete('action')
    window.history.replaceState({}, '', url.toString())
  }

  const handleFilterActions = (contact: Contact) => {
    setFilteredContactForActions(contact)
  }

  const handleClearActionFilter = () => {
    setFilteredContactForActions(null)
  }

  const actionFormContactName = useMemo(() => {
    if (editingAction) {
      const contact = contacts.find((c) => c.id === editingAction.contact_id)
      return contact ? `${contact.first_name} ${contact.last_name}` : undefined
    }
    const contactToUse = selectedContact || filteredContactForActions
    return contactToUse ? `${contactToUse.first_name} ${contactToUse.last_name}` : undefined
  }, [editingAction, contacts, selectedContact, filteredContactForActions])

  const actionViewContactName = useMemo(() => {
    if (!viewingAction) return ''
    const contact = contacts.find((c) => c.id === viewingAction.contact_id)
    return contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown Contact'
  }, [viewingAction, contacts])

  const loading = contactsLoading || actionsLoading

  if (loading) {
    return (
      <div className="bg-background min-h-screen">
        <Navigation />
        <div className="p-6">
          <div className="mx-auto max-w-7xl">
            <div className="animate-pulse">
              <div className="bg-muted mb-8 h-8 w-1/4 rounded"></div>
              <div className="flex h-[calc(100vh-8rem)] flex-col gap-8 lg:flex-row">
                <div className="min-w-0 flex-1 lg:flex-1">
                  <div className="bg-muted h-full rounded"></div>
                </div>
                <div className="min-w-0 flex-1 lg:flex-1">
                  <div className="bg-muted h-full rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen">
      <Navigation />

      <div className="p-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex h-[calc(100vh-8rem)] flex-col gap-8 lg:flex-row">
            <div className="min-w-0 flex-1 lg:flex-1">
              <div className="flex h-full flex-col">
                <ContactList
                  contacts={contacts}
                  selectedContact={selectedContact}
                  singleContactView={singleContactView}
                  onAddContact={handleAddContact}
                  onSelectContact={(contact) => {
                    router.push(`/manage?contact=${contact.id}`)
                  }}
                  onEditContact={handleEditContact}
                  onDeleteContact={handleDeleteContact}
                  onViewContact={handleViewContact}
                  onEditNotes={handleEditNotes}
                  onFilterActions={handleFilterActions}
                  onBackToAll={handleBackToAll}
                  refreshTimestamp={refreshTimestamp}
                  onFilteredContactsChange={handleFilteredContactsChange}
                  onRefresh={fetchContacts}
                  actions={actions}
                  showFilterHelper={isQuickFilterHelperOpen}
                  onShowFilterHelperChange={setIsQuickFilterHelperOpen}
                  onExportListModalChange={setIsExportListModalOpen}
                  onCreateCampaign={() => setShowCampaignModal(true)}
                />
              </div>
            </div>

            <div className="min-w-0 flex-1 lg:flex-1">
              <div className="flex h-full flex-col">
                <ActionList
                  actions={actions}
                  contacts={contacts}
                  selectedContact={selectedContact}
                  filteredContacts={filteredContacts}
                  filteredContactForActions={filteredContactForActions}
                  onClearActionFilter={handleClearActionFilter}
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
                    if (contact && (!selectedContact || selectedContact.id !== contact.id)) {
                      const contactName = `${contact.first_name} ${contact.last_name}`
                      logger.contactSelected(contactName, contact.id)
                    }
                    router.push(`/manage?contact=${contactId}`)
                  }}
                />
              </div>
            </div>
          </div>

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

          <ActionForm
            isOpen={showActionForm}
            onClose={closeActionForm}
            onSubmit={handleActionSubmit}
            action={editingAction}
            formData={actionForm}
            setFormData={setActionForm}
            isSubmitting={isSubmittingAction}
            contactName={actionFormContactName}
            onCreateVoicemailAction={!editingAction ? handleCreateVoicemailAction : undefined}
          />

          <ActionViewModal
            isOpen={showActionViewModal}
            onClose={closeActionViewModal}
            action={viewingAction}
            contactName={actionViewContactName}
          />

          <ContactViewModal
            isOpen={showContactViewModal}
            onClose={closeContactViewModal}
            contact={viewingContact}
            onEdit={(contact) => {
              handleEditContact(contact)
            }}
            roleRefreshTrigger={roleRefreshTrigger}
            onContactUpdated={() => fetchContacts(true)} // Pass true to indicate refresh, not initial load
          />

          <ContactNotesModal
            isOpen={showContactNotesModal}
            onClose={closeContactNotesModal}
            contact={editingContactForNotes}
            updateContact={updateContact} // Pass the updateContact function from the hook
            onContactUpdated={() => fetchContacts(true)} // Pass true to indicate refresh, not initial load
          />

          {/* Campaign Modal */}
          <Dialog open={showCampaignModal} onOpenChange={setShowCampaignModal}>
            <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Create Email Campaign
                </DialogTitle>
              </DialogHeader>
              <CampaignFromFilter filteredContacts={filteredContacts} onClose={() => setShowCampaignModal(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
