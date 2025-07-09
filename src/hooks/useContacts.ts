import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type { Database } from '@/lib/supabase'

type Contact = Database['public']['Tables']['contacts']['Row'] & {
  addresses?: Database['public']['Tables']['addresses']['Row'][]
  contact_tags?: {
    tags: {
      id: string
      label: string
    }
  }[]
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
            created_at,
            updated_at
          ),
          contact_tags (
            tags (
              id,
              label
            )
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

  const createContact = async (contactData: ContactForm) => {
    try {
      const { error } = await supabase.from('contacts').insert({
        first_name: contactData.first_name,
        last_name: contactData.last_name,
        phone: contactData.phone,
        email: contactData.email,
        notes: contactData.notes,
        birthdate: contactData.birthdate || null,
        status: contactData.status,
        medicare_beneficiary_id: contactData.medicare_beneficiary_id || null,
      })

      if (error) {
        console.error('Error creating contact:', error)
        return false
      }

      logger.contactCreated(`${contactData.first_name} ${contactData.last_name}`)
      await fetchContacts()
      return true
    } catch (error) {
      console.error('Error creating contact:', error)
      return false
    }
  }

  const updateContact = async (contactId: string, contactData: ContactForm) => {
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
        })
        .eq('id', contactId)
        .select()

      if (error) {
        console.error('Error updating contact:', error)
        return false
      }

      logger.contactUpdated(`${contactData.first_name} ${contactData.last_name}`)

      // Update the local state immediately with the returned data
      if (data && data.length > 0) {
        setContacts((prevContacts) => prevContacts.map((contact) => (contact.id === contactId ? data[0] : contact)))
      } else {
        // Fallback to fetching all contacts
        await fetchContacts()
      }

      return true
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

      logger.contactDeleted(contactName)
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
