import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type { Database } from '@/lib/supabase'
import { RoleData, RoleType } from '@/types/roles'
import type { Json } from '@/lib/supabase-types'

type Contact = Database['public']['Tables']['contacts']['Row'] & {
  addresses?: Database['public']['Tables']['addresses']['Row'][]
  contact_tags?: {
    tags: {
      id: string
      label: string
      tag_categories: {
        id: string
        name: string
      }
    }
  }[]
  contact_roles?: Database['public']['Tables']['contact_roles']['Row'][]
}

interface ContactForm {
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

interface PendingRole {
  id: string
  role_type: RoleType
  role_data: RoleData
  is_primary: boolean
}

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select(
          `
          *,
          addresses (
            id,
            address1,
            address2,
            city,
            state_code,
            postal_code,
            county,
            county_fips,
            latitude,
            longitude,
            contact_id,
            address_type,
            source,
            created_at,
            updated_at
          ),
          contact_tags (
            tags (
              id,
              label,
              tag_categories (
                id,
                name
              )
            )
          ),
          contact_roles (
            id,
            contact_id,
            role_type,
            role_data,
            is_active,
            is_primary,
            created_at,
            updated_at
          )
        `
        )
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching contacts:', error)
        return
      }

      setContacts(data || [])
    } catch (error) {
      console.error('Error fetching contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  const createContact = async (contactData: ContactForm, pendingRoles: PendingRole[] = []) => {
    try {
      // First, create the contact
      const { data: contactResult, error: contactError } = await supabase
        .from('contacts')
        .insert({
          first_name: contactData.first_name,
          last_name: contactData.last_name,
          phone: contactData.phone,
          email: contactData.email,
          notes: contactData.notes,
          birthdate: contactData.birthdate || null,
          status: contactData.status,
          medicare_beneficiary_id: contactData.medicare_beneficiary_id || null,
          ssn: contactData.ssn || null,
        })
        .select()

      if (contactError) {
        console.error('Error creating contact:', contactError)
        return false
      }

      const newContact = contactResult[0]

      // Then, create the roles if any
      if (pendingRoles.length > 0) {
        const rolesToInsert = pendingRoles.map((role) => ({
          contact_id: newContact.id,
          role_type: role.role_type,
          role_data: role.role_data as Json, // Cast to Json type for Supabase
          is_primary: role.is_primary,
          is_active: true,
        }))

        const { error: rolesError } = await supabase.from('contact_roles').insert(rolesToInsert)

        if (rolesError) {
          console.error('Error creating contact roles:', rolesError)
          // Contact was created but roles failed - we could rollback here if needed
        }
      }

      logger.contactCreated(`${contactData.first_name} ${contactData.last_name}`, newContact.id)
      await fetchContacts()
      return newContact
    } catch (error) {
      console.error('Error creating contact:', error)
      return false
    }
  }

  const updateContact = async (contactId: string, contactData: ContactForm): Promise<Contact | false> => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .update({
          first_name: contactData.first_name,
          last_name: contactData.last_name,
          phone: contactData.phone,
          email: contactData.email,
          notes: contactData.notes,
          birthdate: contactData.birthdate || null,
          status: contactData.status,
          medicare_beneficiary_id: contactData.medicare_beneficiary_id || null,
          ssn: contactData.ssn || null,
        })
        .eq('id', contactId)
        .select()

      if (error) {
        console.error('Error updating contact:', error)
        return false
      }

      logger.contactUpdated(`${contactData.first_name} ${contactData.last_name}`, contactId)

      // Update the local state immediately with the returned data
      if (data && data.length > 0) {
        setContacts((prevContacts) => prevContacts.map((contact) => (contact.id === contactId ? data[0] : contact)))
        return data[0] // Return the updated contact data
      } else {
        // Fallback to fetching all contacts
        await fetchContacts()
        return false
      }
    } catch (error) {
      console.error('Error updating contact:', error)
      return false
    }
  }

  const deleteContact = async (contactId: string) => {
    try {
      // Find the contact before deleting to get the name for logging
      const contactToDelete = contacts.find((c) => c.id === contactId)
      const contactName = contactToDelete
        ? `${contactToDelete.first_name} ${contactToDelete.last_name}`
        : 'Unknown Contact'

      const { error } = await supabase.from('contacts').delete().eq('id', contactId)

      if (error) {
        console.error('Error deleting contact:', error)
        return false
      }

      logger.contactDeleted(contactName, contactId)
      await fetchContacts()
      return true
    } catch (error) {
      console.error('Error deleting contact:', error)
      return false
    }
  }

  useEffect(() => {
    fetchContacts()
  }, [])

  return {
    contacts,
    loading,
    fetchContacts,
    createContact,
    updateContact,
    deleteContact,
  }
}
