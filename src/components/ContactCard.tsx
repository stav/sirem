import React from 'react'
import { Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Database } from '@/lib/supabase'
import { formatLocalDate, formatPhoneNumber, formatMBI, getStatusBadge } from '@/lib/contact-utils'

type Contact = Database['public']['Tables']['contacts']['Row']

interface ContactCardProps {
  contact: Contact
  isSelected: boolean
  isSingleView: boolean
  onSelect: (contact: Contact) => void
  onEdit: (contact: Contact) => void
  onDelete: (contactId: string) => void
}

export default function ContactCard({
  contact,
  isSelected,
  isSingleView,
  onSelect,
  onEdit,
  onDelete,
}: ContactCardProps) {
  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        isSelected ? 'border-primary bg-primary/5' : isSingleView ? '' : 'cursor-pointer hover:bg-muted/50'
      }`}
      onClick={() => {
        if (!isSingleView) {
          onSelect(contact)
        }
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="flex items-center space-x-2 font-medium">
            {(() => {
              const statusBadge = getStatusBadge(contact.status)
              if (!statusBadge) return null

              if (statusBadge.variant) {
                return (
                  <Badge variant={statusBadge.variant} className={statusBadge.className}>
                    {statusBadge.text}
                  </Badge>
                )
              } else {
                return <span className={statusBadge.className}>{statusBadge.text}</span>
              }
            })()}
            <span>
              {contact.first_name} {contact.last_name}
            </span>
          </h3>
          <div className="mt-2 flex items-center space-x-4">
            {contact.phone && (
              <div className="flex items-center space-x-1">
                <span className="text-sm text-muted-foreground">📞</span>
                <span className="text-sm text-muted-foreground">{formatPhoneNumber(contact.phone)}</span>
              </div>
            )}
            {contact.email && (
              <div className="flex items-center space-x-1">
                <span className="text-sm text-muted-foreground">✉️</span>
                <span className="text-sm text-muted-foreground">{contact.email}</span>
              </div>
            )}
            {contact.birthdate && (
              <div className="flex items-center space-x-1">
                <span className="text-sm text-muted-foreground">🎂</span>
                <span className="text-sm text-muted-foreground">{formatLocalDate(contact.birthdate)}</span>
              </div>
            )}
            {contact.medicare_beneficiary_id && (
              <div className="flex items-center space-x-1">
                <span className="text-sm text-muted-foreground">🏥</span>
                <span className="text-sm text-muted-foreground">MBI: {formatMBI(contact.medicare_beneficiary_id)}</span>
              </div>
            )}
          </div>
          {contact.notes && <p className="mt-2 text-sm text-muted-foreground">{contact.notes}</p>}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(contact)
            }}
            className="cursor-pointer"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(contact.id)
            }}
            className="cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
