import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type { Database } from '@/lib/supabase'

type Contact = Database['public']['Tables']['contacts']['Row']

interface ContactForm {
  first_name: string
  last_name: string
  phone: string
  email: string
  notes: string
  birthdate: string
  status: string
}

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
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
      const { error } = await supabase
        .from('contacts')
        .insert({
          first_name: contactData.first_name,
          last_name: contactData.last_name,
          phone: contactData.phone,
          email: contactData.email,
          notes: contactData.notes,
          birthdate: contactData.birthdate || null,
          status: contactData.status
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
      const { error } = await supabase
        .from('contacts')
        .update({
          first_name: contactData.first_name,
          last_name: contactData.last_name,
          phone: contactData.phone,
          email: contactData.email,
          notes: contactData.notes,
          birthdate: contactData.birthdate || null,
          status: contactData.status
        })
        .eq('id', contactId)

      if (error) {
        console.error('Error updating contact:', error)
        return false
      }

      logger.contactUpdated(`${contactData.first_name} ${contactData.last_name}`)
      await fetchContacts()
      return true
    } catch (error) {
      console.error('Error updating contact:', error)
      return false
    }
  }

  const deleteContact = async (contactId: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId)

      if (error) {
        console.error('Error deleting contact:', error)
        return false
      }

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
    deleteContact
  }
} 
