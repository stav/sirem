import React, { useState, useEffect } from 'react'
import { Plus, ArrowLeft, ChevronDown, ChevronUp, X, List } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import ContactCard from './ContactCard'
import { getT65Days, formatLocalDate, calculateAge, getDaysPast65 } from '@/lib/contact-utils'
import { getPrimaryAddress } from '@/lib/address-utils'
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
  const [showListModal, setShowListModal] = useState(false)
  const [isCSVFormat, setIsCSVFormat] = useState(false)

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

  // Enhanced multi-filter: parse space-separated terms with different behaviors
  const filteredContacts = (() => {
    if (filter.trim() === '') {
      return contacts
    }

    // Parse filter terms separated by spaces
    const terms = filter.trim().split(/\s+/)
    const matchingContactIds = new Set<string>()

    terms.forEach((term) => {
      const trimmedTerm = term.trim()
      if (!trimmedTerm) return

      // Check filter type and apply appropriate logic
      if (trimmedTerm.startsWith('t:')) {
        // Tag filtering: t:tagname
        const tagQuery = trimmedTerm.substring(2).toLowerCase()
        if (tagQuery) {
          contacts.forEach((contact) => {
            const contactTags = contact.contact_tags?.map((ct) => ct.tags.label.toLowerCase()) || []
            if (contactTags.some((tag) => tag.includes(tagQuery))) {
              matchingContactIds.add(contact.id)
            }
          })
        }
      } else if (trimmedTerm.startsWith('s:')) {
        // Status filtering: s:statusname
        const statusQuery = trimmedTerm.substring(2).toLowerCase()
        if (statusQuery) {
          contacts.forEach((contact) => {
            if (contact.status?.toLowerCase().includes(statusQuery)) {
              matchingContactIds.add(contact.id)
            }
          })
        }
      } else {
        const numericValue = parseInt(trimmedTerm, 10)
        if (!isNaN(numericValue) && numericValue > 0 && numericValue.toString() === trimmedTerm) {
          // T65 days filtering: numeric values (both before and after 65th birthday)
          contacts.forEach((contact) => {
            const t65Days = getT65Days(contact.birthdate)
            if (t65Days !== null && Math.abs(t65Days) <= numericValue) {
              matchingContactIds.add(contact.id)
            }
          })
        } else {
          // Name filtering: alphabetic terms
          const lowerTerm = trimmedTerm.toLowerCase()
          contacts.forEach((contact) => {
            if (
              contact.first_name?.toLowerCase().includes(lowerTerm) ||
              contact.last_name?.toLowerCase().includes(lowerTerm)
            ) {
              matchingContactIds.add(contact.id)
            }
          })
        }
      }
    })

    // Filter contacts that match any of the terms (OR logic)
    const filtered = contacts.filter((contact) => matchingContactIds.has(contact.id))

    // Apply T65 sorting whenever we have any T65 filters
    const hasT65Filter = terms.some((term) => {
      const numericValue = parseInt(term.trim(), 10)
      return !isNaN(numericValue) && numericValue > 0 && numericValue.toString() === term.trim()
    })

    if (hasT65Filter) {
      return filtered.sort((a, b) => {
        // Sort by T65 days closest to zero first (newest/most recent 65th birthdays)
        const aT65Days = getT65Days(a.birthdate) || Infinity
        const bT65Days = getT65Days(b.birthdate) || Infinity
        return Math.abs(aT65Days) - Math.abs(bT65Days)
      })
    }

    return filtered
  })()

  // Format contacts for printing/copying
  const formatContactsForPrint = () => {
    if (isCSVFormat) {
      return formatContactsAsCSV()
    }

    return filteredContacts
      .map((contact) => {
        const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
        const status = contact.status ? ` (${contact.status.toLowerCase()})` : ''
        const nameWithStatus = `${fullName}${status}`

        let dateInfo = ''
        if (contact.birthdate) {
          const formattedDate = formatLocalDate(contact.birthdate)
          const age = calculateAge(contact.birthdate)
          const t65Display = getDaysPast65(contact.birthdate)
          dateInfo = `${formattedDate}${age ? ` (${age})` : ''}${t65Display ? ` ${t65Display}` : ''}`
        } else {
          dateInfo = 'No birthdate'
        }

        // Get primary address (same logic as ContactCard)
        let addressInfo = 'No address'
        if (contact.addresses && contact.addresses.length > 0) {
          const primaryAddress = getPrimaryAddress(contact.addresses)
          if (primaryAddress) {
            const addressParts = [
              primaryAddress.address1,
              primaryAddress.city,
              primaryAddress.state_code,
              primaryAddress.postal_code,
            ].filter(Boolean)
            addressInfo = addressParts.join(', ')
          }
        }

        return `${nameWithStatus}: ${dateInfo}; ${addressInfo}`
      })
      .join('\n')
  }

  // Format contacts as CSV
  const formatContactsAsCSV = () => {
    const headers = [
      'First Name',
      'Last Name',
      'Full Name',
      'Status',
      'Birthdate',
      'Age',
      'T65 Days',
      'Address1',
      'City',
      'State',
      'Postal Code',
      'Phone',
      'Email',
    ].join(',')

    const rows = filteredContacts.map((contact) => {
      const age = contact.birthdate ? calculateAge(contact.birthdate) : ''
      const t65Days = contact.birthdate ? getDaysPast65(contact.birthdate) : ''
      const formattedDate = contact.birthdate ? formatLocalDate(contact.birthdate) : ''

      // Get primary address
      let address1 = ''
      let city = ''
      let state = ''
      let postalCode = ''

      if (contact.addresses && contact.addresses.length > 0) {
        const primaryAddress = getPrimaryAddress(contact.addresses)
        if (primaryAddress) {
          address1 = primaryAddress.address1 || ''
          city = primaryAddress.city || ''
          state = primaryAddress.state_code || ''
          postalCode = primaryAddress.postal_code || ''
        }
      }

      const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim()

      const row = [
        contact.first_name || '',
        contact.last_name || '',
        fullName,
        contact.status || '',
        formattedDate,
        age,
        t65Days,
        address1,
        city,
        state,
        postalCode,
        contact.phone || '',
        contact.email || '',
      ].map((field) => `"${String(field).replace(/"/g, '""')}"`) // Escape quotes in CSV

      return row.join(',')
    })

    return [headers, ...rows].join('\n')
  }

  return (
    <>
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
                      placeholder="Multi-filter: name, T65 days, t:tag, s:status (e.g., john 180 t:n2m s:client)..."
                      className="rounded border px-2 py-1 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      style={{ minWidth: 0, width: '280px' }}
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
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">
                      {filteredContacts.length}/{contacts.length}
                    </span>
                    {filter && (
                      <span className="text-xs text-blue-600">
                        {(() => {
                          const terms = filter.trim().split(/\s+/)
                          const filterTypes = []

                          let hasT65 = false
                          let hasName = false
                          let hasTag = false
                          let hasStatus = false

                          terms.forEach((term) => {
                            const trimmedTerm = term.trim()
                            if (trimmedTerm.startsWith('t:')) {
                              hasTag = true
                            } else if (trimmedTerm.startsWith('s:')) {
                              hasStatus = true
                            } else {
                              const numericValue = parseInt(trimmedTerm, 10)
                              if (!isNaN(numericValue) && numericValue > 0 && numericValue.toString() === trimmedTerm) {
                                hasT65 = true
                              } else {
                                hasName = true
                              }
                            }
                          })

                          if (hasT65) filterTypes.push('T65')
                          if (hasName) filterTypes.push('Name')
                          if (hasTag) filterTypes.push('Tag')
                          if (hasStatus) filterTypes.push('Status')

                          return filterTypes.join(' + ') + ' filter'
                        })()}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
            {!singleContactView && (
              <div className="flex space-x-2">
                {contacts.length > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => setShowListModal(true)}
                          size="sm"
                          variant="outline"
                          className="cursor-pointer"
                        >
                          <List className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Copy contact list for printing</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={onAddContact} size="sm" className="cursor-pointer">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" align="end" sideOffset={5}>
                      <p>Add Contact</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
        </CardHeader>
        {!isCollapsed && (
          <CardContent>
            {contacts.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No contacts yet</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={onAddContact} className="mt-2 cursor-pointer">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add your first contact</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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

      {/* Contact List Modal for Printing */}
      {showListModal && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/50 p-4"
          style={{ zIndex: 50 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowListModal(false)
            }
          }}
        >
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-lg">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-lg font-semibold">Contact List for Printing</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium">Format:</label>
                  <select
                    value={isCSVFormat ? 'csv' : 'text'}
                    onChange={(e) => setIsCSVFormat(e.target.value === 'csv')}
                    className="rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="text">Formatted Text</option>
                    <option value="csv">CSV</option>
                  </select>
                </div>
                <Button variant="ghost" size="sm" className="cursor-pointer" onClick={() => setShowListModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="mb-4 text-sm text-gray-600">
                Copy the {isCSVFormat ? 'CSV data' : 'formatted text'} below and paste it into your document for
                printing:
              </div>
              <textarea
                readOnly
                value={formatContactsForPrint()}
                className="h-64 w-full resize-none rounded-md border p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              />
              <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                <span>{filteredContacts.length} contacts listed</span>
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(formatContactsForPrint())
                    // Simple feedback - could add a toast here
                  }}
                  className="cursor-pointer"
                >
                  Copy to Clipboard
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
