import React, { useState, useEffect } from 'react'
import { Plus, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import ContactCard from './ContactCard'
import type { Database } from '@/lib/supabase'

type Contact = Database['public']['Tables']['contacts']['Row']

interface ContactListProps {
  contacts: Contact[]
  selectedContact: Contact | null
  singleContactView: boolean
  onAddContact: () => void
  onSelectContact: (contact: Contact) => void
  onEditContact: (contact: Contact) => void
  onDeleteContact: (contactId: string) => void
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
  onBackToAll
}: ContactListProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {singleContactView && selectedContact && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackToAll}
                className="px-2 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Show all contacts
              </Button>
            )}
            <CardTitle>
              {singleContactView && selectedContact ? (
                <span>Contact Details</span>
              ) : (
                "Contacts"
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCollapse}
              className="px-2 ml-2 cursor-pointer"
            >
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          </div>
          {!singleContactView && (
            <Button 
              onClick={onAddContact}
              size="sm"
              className="cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          )}
        </div>
      </CardHeader>
      {!isCollapsed && (
        <CardContent>
          {contacts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No contacts yet</p>
              <Button 
                onClick={onAddContact}
                className="mt-2 cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add your first contact
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {(singleContactView && selectedContact ? [selectedContact] : contacts).map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  isSelected={selectedContact?.id === contact.id}
                  isSingleView={singleContactView}
                  onSelect={onSelectContact}
                  onEdit={onEditContact}
                  onDelete={onDeleteContact}
                />
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
} 
