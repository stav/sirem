import React from 'react'
import { Edit, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { Database } from '@/lib/supabase'
import {
  formatLocalDate,
  formatPhoneNumber,
  formatMBI,
  getStatusBadge,
  calculateAge,
  getDaysPast65,
} from '@/lib/contact-utils'

type Contact = Database['public']['Tables']['contacts']['Row']

interface ContactCardProps {
  contact: Contact
  isSelected: boolean
  isSingleView: boolean
  onSelect: (contact: Contact) => void
  onEdit: (contact: Contact) => void
  onDelete: (contactId: string) => void
  onView: (contact: Contact) => void
}

export default function ContactCard({
  contact,
  isSelected,
  isSingleView,
  onSelect,
  onEdit,
  onDelete,
  onView,
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
      {/* Header: Name/Status (left), Action Buttons (right) */}
      <div className="mb-3 flex items-start justify-between">
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

        {/* Action Buttons (header right) */}
        <div className="flex items-center space-x-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onView(contact)
                }}
                className="h-8 w-8 cursor-pointer p-0 hover:bg-gray-50 hover:text-gray-600"
                aria-label="View contact"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>View contact</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(contact)
                }}
                className="h-8 w-8 cursor-pointer p-0 hover:bg-blue-50 hover:text-blue-600"
                aria-label="Edit contact"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit contact</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(contact.id)
                }}
                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                aria-label="Delete contact"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete contact</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Main Content */}
      <div>
        <div className="flex items-center space-x-4">
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
              <span className="text-sm text-muted-foreground">
                {formatLocalDate(contact.birthdate)}
                {(() => {
                  const age = calculateAge(contact.birthdate)
                  const daysPast65 = getDaysPast65(contact.birthdate)
                  return age !== null ? ` (${age})${daysPast65 !== null ? ` ${daysPast65}` : ''}` : ''
                })()}
              </span>
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
    </div>
  )
}
