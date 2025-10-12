import React, { useState, useEffect, useCallback } from 'react'
import ModalForm from '@/components/ui/modal-form'
import { Button } from '@/components/ui/button'
import { Edit } from 'lucide-react'
import type { Database } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import {
  ContactBasicInfo,
  ContactAddresses,
  ContactPersonalInfo,
  ContactMedicareInfo,
  ContactStatusFlags,
  ContactAdditionalInfo,
  ContactPlansDisplay,
} from './ContactViewModal/index'
import ContactRolesDisplay from './ContactViewModal/ContactRolesDisplay'

type Contact = Database['public']['Tables']['contacts']['Row']
type Address = Database['public']['Tables']['addresses']['Row']

type ContactTagQueryResult = {
  tag_id: string
  tags: {
    id: string
    label: string
    category_id: string
    tag_categories: {
      id: string
      name: string
      color: string | null
    }
  }
}

type TagWithCategory = {
  id: string
  label: string
  category_id: string
  tag_categories: {
    id: string
    name: string
    color: string | null
  }
}

interface ContactViewModalProps {
  isOpen: boolean
  onClose: () => void
  contact: Contact | null
  onEdit?: (contact: Contact) => void
  roleRefreshTrigger?: number
}

export default function ContactViewModal({
  isOpen,
  onClose,
  contact,
  onEdit,
  roleRefreshTrigger,
}: ContactViewModalProps) {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [addressesLoading, setAddressesLoading] = useState(false)
  const [tags, setTags] = useState<TagWithCategory[]>([])
  const [tagsLoading, setTagsLoading] = useState(false)

  const fetchTags = useCallback(async () => {
    if (!contact) return
    
    setTagsLoading(true)
    try {
      const { data, error } = await supabase
        .from('contact_tags')
        .select(
          `
          tag_id,
          tags!inner(
            id,
            label,
            category_id,
            tag_categories!inner(
              id,
              name,
              color
            )
          )
        `
        )
        .eq('contact_id', contact.id)

      if (error) {
        console.error('Error fetching tags:', error)
        return
      }

      // Transform the data to flatten the structure
      const transformedTags =
        (data as ContactTagQueryResult[])?.map((item) => ({
          id: item.tags.id,
          label: item.tags.label,
          category_id: item.tags.category_id,
          tag_categories: item.tags.tag_categories,
        })) || []

      setTags(transformedTags)
    } catch (error) {
      console.error('Error fetching tags:', error)
    } finally {
      setTagsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contact?.id]) // #SMA Intentionally excluding contact to prevent infinite loops

  useEffect(() => {
    if (!contact || !isOpen) return

    const fetchAddresses = async () => {
      setAddressesLoading(true)
      try {
        const { data, error } = await supabase
          .from('addresses')
          .select('*')
          .eq('contact_id', contact.id)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching addresses:', error)
          return
        }

        setAddresses(data || [])
      } catch (error) {
        console.error('Error fetching addresses:', error)
      } finally {
        setAddressesLoading(false)
      }
    }

    fetchAddresses()
    fetchTags()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contact?.id, isOpen]) // #SMA Intentionally excluding fetchTags to prevent infinite loops

  if (!contact) return null

  return (
    <ModalForm
      isOpen={isOpen}
      onCancel={onClose}
      onSubmit={(e) => {
        e.preventDefault()
        onClose()
      }}
      title={
        <div className="flex flex-row items-center gap-2">
          <span>View Contact</span>
          {onEdit && contact && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onEdit(contact)}
              className="flex items-center space-x-1"
            >
              <Edit className="h-3 w-3" />
              <span>Edit</span>
            </Button>
          )}
        </div>
      }
      submitText=""
      isLoading={false}
    >
      <div className="space-y-4">
        <ContactBasicInfo contact={contact} tags={tags} tagsLoading={tagsLoading} onTagsUpdated={fetchTags} />
        <ContactRolesDisplay contact={contact} refreshTrigger={roleRefreshTrigger} />
        <ContactAddresses addresses={addresses} addressesLoading={addressesLoading} />
        <ContactPersonalInfo contact={contact} />
        <ContactMedicareInfo contact={contact} />
        <ContactStatusFlags contact={contact} />
        <ContactAdditionalInfo contact={contact} />
        <ContactPlansDisplay contact={contact} />
      </div>
    </ModalForm>
  )
}
