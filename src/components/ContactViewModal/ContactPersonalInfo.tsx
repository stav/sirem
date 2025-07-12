import React from 'react'
import { Label } from '@/components/ui/label'
import { Calendar, User, Heart } from 'lucide-react'
import { formatLocalDate } from '@/lib/contact-utils'
import type { Database } from '@/lib/supabase'

type Contact = Database['public']['Tables']['contacts']['Row']

interface ContactPersonalInfoProps {
  contact: Contact
}

export default function ContactPersonalInfo({ contact }: ContactPersonalInfoProps) {
  const hasPersonalInfo =
    contact.birthdate || contact.gender || contact.marital_status || contact.height || contact.weight

  if (!hasPersonalInfo) {
    return null
  }

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-muted-foreground">Personal Information</Label>
      <div className="space-y-2">
        {contact.birthdate && (
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Birthdate:</span>
            <span className="text-sm">{formatLocalDate(contact.birthdate)}</span>
          </div>
        )}
        {contact.gender && (
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Gender:</span>
            <span className="text-sm">{contact.gender}</span>
          </div>
        )}
        {contact.marital_status && (
          <div className="flex items-center space-x-2">
            <Heart className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Marital Status:</span>
            <span className="text-sm">{contact.marital_status}</span>
          </div>
        )}
        {contact.height && (
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Height:</span>
            <span className="text-sm">{contact.height}</span>
          </div>
        )}
        {contact.weight && (
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Weight:</span>
            <span className="text-sm">{contact.weight}</span>
          </div>
        )}
      </div>
    </div>
  )
}
