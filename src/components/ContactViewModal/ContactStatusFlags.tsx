import React from 'react'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, FileText, CheckCircle, XCircle, MapPin } from 'lucide-react'
import { getStatusBadge } from '@/lib/contact-utils'
import type { Database } from '@/lib/supabase'

type Contact = Database['public']['Tables']['contacts']['Row']

interface ContactStatusFlagsProps {
  contact: Contact
}

// Helper functions (these would ideally be moved to contact-utils.ts)
const getBooleanDisplay = (value: boolean | null) => {
  if (value === null) return { text: 'Not specified', className: 'bg-gray-100 text-gray-700' }
  return value
    ? { text: 'Yes', className: 'bg-green-100 text-green-700' }
    : { text: 'No', className: 'bg-red-100 text-red-700' }
}

const getCommunicationDisplay = (value: string | null) => {
  switch (value) {
    case 'Email':
      return { text: 'Email', className: 'bg-blue-100 text-blue-700', icon: MapPin }
    case 'Phone':
      return { text: 'Phone', className: 'bg-green-100 text-green-700', icon: MapPin }
    case 'Text':
      return { text: 'Text', className: 'bg-purple-100 text-purple-700', icon: MapPin }
    case 'Mail':
      return { text: 'Mail', className: 'bg-orange-100 text-orange-700', icon: MapPin }
    default:
      return { text: 'Not specified', className: 'bg-gray-100 text-gray-700', icon: MapPin }
  }
}

const getRecordTypeDisplay = (value: string | null) => {
  switch (value) {
    case 'Lead':
      return { text: 'Lead', className: 'bg-yellow-100 text-yellow-700' }
    case 'Client':
      return { text: 'Client', className: 'bg-green-100 text-green-700' }
    case 'Prospect':
      return { text: 'Prospect', className: 'bg-blue-100 text-blue-700' }
    default:
      return { text: 'Not specified', className: 'bg-gray-100 text-gray-700' }
  }
}

export default function ContactStatusFlags({ contact }: ContactStatusFlagsProps) {
  const statusDisplay = getStatusBadge(contact.status)
  const medicaidDisplay = getBooleanDisplay(contact.has_medicaid)
  const tobaccoDisplay = getBooleanDisplay(contact.is_tobacco_user)
  const communicationDisplay = getCommunicationDisplay(contact.primary_communication)
  const recordTypeDisplay = getRecordTypeDisplay(contact.contact_record_type)

  const CommunicationIcon = communicationDisplay.icon

  return (
    <div className="space-y-4">
      {/* Status and Flags */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-muted-foreground text-sm font-medium">Status</Label>
          <div className="mt-1">
            {statusDisplay ? (
              <Badge className={statusDisplay.className}>
                <AlertCircle className="mr-1 h-3 w-3" />
                {statusDisplay.text}
              </Badge>
            ) : (
              <span className="text-muted-foreground text-sm">No status</span>
            )}
          </div>
        </div>
        <div>
          <Label className="text-muted-foreground text-sm font-medium">Record Type</Label>
          <div className="mt-1">
            <Badge className={recordTypeDisplay.className}>
              <FileText className="mr-1 h-3 w-3" />
              {recordTypeDisplay.text}
            </Badge>
          </div>
        </div>
      </div>

      {/* Health Flags */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-muted-foreground text-sm font-medium">Has Medicaid</Label>
          <div className="mt-1">
            <Badge className={medicaidDisplay.className}>
              {contact.has_medicaid ? <CheckCircle className="mr-1 h-3 w-3" /> : <XCircle className="mr-1 h-3 w-3" />}
              {medicaidDisplay.text}
            </Badge>
          </div>
        </div>
        <div>
          <Label className="text-muted-foreground text-sm font-medium">Tobacco User</Label>
          <div className="mt-1">
            <Badge className={tobaccoDisplay.className}>
              {contact.is_tobacco_user ? (
                <XCircle className="mr-1 h-3 w-3" />
              ) : (
                <CheckCircle className="mr-1 h-3 w-3" />
              )}
              {tobaccoDisplay.text}
            </Badge>
          </div>
        </div>
      </div>

      {/* Communication Preferences */}
      <div>
        <Label className="text-muted-foreground text-sm font-medium">Primary Communication</Label>
        <div className="mt-1">
          <Badge className={communicationDisplay.className}>
            <CommunicationIcon className="mr-1 h-3 w-3" />
            {communicationDisplay.text}
          </Badge>
        </div>
      </div>
    </div>
  )
}
