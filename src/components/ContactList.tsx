import React, { useState, useEffect } from 'react'
import { Plus, ArrowLeft, ChevronDown, ChevronUp, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import ContactCard from './ContactCard'
import type { Database } from '@/lib/supabase'

type Contact = Database['public']['Tables']['contacts']['Row'] & {
  addresses?: Database['public']['Tables']['addresses']['Row'][]
}

interface ContactListProps {
  contacts: Contact[]
  selectedContact: Contact | null
  singleContactView: boolean
  onAddContact: () => void
  onSelectContact: (contact: Contact) => void
  onEditContact: (contact: Contact) => void
  onDeleteContact: (contactId: string) => void
  onViewContact: (contact: Contact) => void
  onBackToAll: () => void
}

export default function ContactList({
  contacts,
  selectedContact,
  singleContactView,
  onAddContact,
  onSelectContact,
  onEditContact,
  onDeleteContact,
  onViewContact,
  onBackToAll,
}: ContactListProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [filter, setFilter] = useState('')

  // Load collapsed state from localStorage on component mount
  useEffect(() => {
    const savedState = localStorage.getItem('contactListCollapsed')
    if (savedState !== null) {
      setIsCollapsed(JSON.parse(savedState))
    }
  }, [])

  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    // Save to localStorage
    localStorage.setItem('contactListCollapsed', JSON.stringify(newState))
  }

  // Filter contacts by first or last name (case-insensitive)
  const filteredContacts =
    filter.trim() === ''
      ? contacts
      : contacts.filter(
          (c) =>
            c.first_name?.toLowerCase().includes(filter.toLowerCase()) ||
            c.last_name?.toLowerCase().includes(filter.toLowerCase())
        )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {singleContactView && selectedContact && (
              <Button variant="ghost" size="sm" onClick={onBackToAll} className="cursor-pointer px-2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Show all contacts
              </Button>
            )}
            <CardTitle>{singleContactView && selectedContact ? <span>Contact Details</span> : 'Contacts'}</CardTitle>
            <Button variant="ghost" size="sm" onClick={toggleCollapse} className="ml-2 cursor-pointer px-2">
              {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
            {/* Show filter only when not in single contact view */}
            {!singleContactView && (
              <div className="ml-2 flex items-center space-x-2">
                <div className="relative">
                  <input
                    type="text"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="Filter contacts..."
                    className="rounded border px-2 py-1 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    style={{ minWidth: 0, width: '160px' }}
                  />
                  {filter && (
                    <button
                      onClick={() => setFilter('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {filteredContacts.length}/{contacts.length}
                </span>
              </div>
            )}
          </div>
          {!singleContactView && (
            <Button onClick={onAddContact} size="sm" className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          )}
        </div>
      </CardHeader>
      {!isCollapsed && (
        <CardContent>
          {contacts.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No contacts yet</p>
              <Button onClick={onAddContact} className="mt-2 cursor-pointer">
                <Plus className="mr-2 h-4 w-4" />
                Add your first contact
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {(singleContactView && selectedContact ? [selectedContact] : filteredContacts).map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  isSelected={selectedContact?.id === contact.id}
                  isSingleView={singleContactView}
                  onSelect={onSelectContact}
                  onEdit={onEditContact}
                  onDelete={onDeleteContact}
                  onView={onViewContact}
                />
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
