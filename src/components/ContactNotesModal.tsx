import React, { useState, useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import ModalForm from '@/components/ui/modal-form'
import type { Database } from '@/lib/supabase'
import { useContacts } from '@/hooks/useContacts'
import { useToast } from '@/hooks/use-toast'

type Contact = Database['public']['Tables']['contacts']['Row'] & {
  addresses?: Database['public']['Tables']['addresses']['Row'][]
  contact_roles?: Database['public']['Tables']['contact_roles']['Row'][]
}

interface ContactNotesModalProps {
  isOpen: boolean
  onClose: () => void
  contact: Contact | null
  onContactUpdated?: () => void
}

export default function ContactNotesModal({ isOpen, onClose, contact, onContactUpdated }: ContactNotesModalProps) {
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { updateContact } = useContacts()
  const { toast } = useToast()

  // Update notes when contact changes
  useEffect(() => {
    if (contact) {
      setNotes(contact.notes || '')
    }
  }, [contact])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contact) return

    setIsSubmitting(true)
    try {
      const updatedContact = await updateContact(contact.id, {
        first_name: contact.first_name,
        last_name: contact.last_name,
        phone: contact.phone || '',
        email: contact.email || '',
        notes: notes.trim() || '',
        birthdate: contact.birthdate || '',
        status: contact.status || '',
        medicare_beneficiary_id: contact.medicare_beneficiary_id || '',
        ssn: contact.ssn || '',
      })

      if (updatedContact) {
        toast({
          title: 'Success',
          description: 'Notes updated successfully',
        })
        onContactUpdated?.()
        onClose()
      } else {
        throw new Error('Failed to update notes')
      }
    } catch (error) {
      console.error('Error updating notes:', error)
      toast({
        title: 'Error',
        description: 'Failed to update notes. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    // Reset to original notes
    if (contact) {
      setNotes(contact.notes || '')
    }
    onClose()
  }

  if (!contact) return null

  return (
    <ModalForm
      isOpen={isOpen}
      onCancel={handleCancel}
      onSubmit={handleSubmit}
      title={`Edit Notes - ${contact.first_name} ${contact.last_name}`}
      isLoading={isSubmitting}
      submitText="Save Notes"
      allowBackdropClose={false}
      zIndex={60}
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter notes about this contact..."
            className="min-h-[60vh] resize-y"
          />
        </div>
      </div>
    </ModalForm>
  )
}
