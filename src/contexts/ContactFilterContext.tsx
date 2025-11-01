'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import type { Database } from '@/lib/supabase'

type Contact = Database['public']['Tables']['contacts']['Row']

interface ContactFilterContextType {
  filteredContacts: Contact[]
  setFilteredContacts: (contacts: Contact[]) => void
  clearFilteredContacts: () => void
}

const ContactFilterContext = createContext<ContactFilterContextType | undefined>(undefined)

export function ContactFilterProvider({ children }: { children: ReactNode }) {
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([])

  const clearFilteredContacts = () => {
    setFilteredContacts([])
  }

  return (
    <ContactFilterContext.Provider value={{
      filteredContacts,
      setFilteredContacts,
      clearFilteredContacts
    }}>
      {children}
    </ContactFilterContext.Provider>
  )
}

export function useContactFilter() {
  const context = useContext(ContactFilterContext)
  if (context === undefined) {
    // Return default values instead of throwing error to prevent hydration issues
    return {
      filteredContacts: [],
      setFilteredContacts: () => {},
      clearFilteredContacts: () => {}
    }
  }
  return context
}
