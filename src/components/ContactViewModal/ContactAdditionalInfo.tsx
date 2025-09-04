import React from 'react'
import { Label } from '@/components/ui/label'
import { MapPin, Clock } from 'lucide-react'
import type { Database } from '@/lib/supabase'

type Contact = Database['public']['Tables']['contacts']['Row']

interface ContactAdditionalInfoProps {
  contact: Contact
}

// Helper function to format date strings
const formatDateString = (dateString: string | null) => {
  if (!dateString) return 'Not available'
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return 'Invalid date'
  }
}

export default function ContactAdditionalInfo({ contact }: ContactAdditionalInfoProps) {
  return (
    <div className="space-y-4">
      {/* Policy Counts */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-muted-foreground text-sm font-medium">Life Policies</Label>
          <p className="mt-1 text-sm">{contact.life_policy_count || 0}</p>
        </div>
        <div>
          <Label className="text-muted-foreground text-sm font-medium">Health Policies</Label>
          <p className="mt-1 text-sm">{contact.health_policy_count || 0}</p>
        </div>
      </div>

      {/* Lead Information */}
      {contact.lead_source && (
        <div className="space-y-3">
          <Label className="text-muted-foreground text-sm font-medium">Lead Information</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <MapPin className="text-muted-foreground h-4 w-4" />
              <span className="text-sm font-medium">Source:</span>
              <span className="text-sm">{contact.lead_source}</span>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <Label className="text-muted-foreground text-sm font-medium">Notes</Label>
        <p className="mt-1 text-sm whitespace-pre-wrap">{contact.notes || 'No notes'}</p>
      </div>

      {/* Dates */}
      <div className="space-y-3">
        <Label className="text-muted-foreground text-sm font-medium">Dates</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Clock className="text-muted-foreground h-4 w-4" />
            <span className="text-sm font-medium">Created:</span>
            <span className="text-sm">{formatDateString(contact.created_at)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="text-muted-foreground h-4 w-4" />
            <span className="text-sm font-medium">Updated:</span>
            <span className="text-sm">{formatDateString(contact.updated_at)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
