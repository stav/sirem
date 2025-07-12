import React from 'react'
import { Label } from '@/components/ui/label'
import { Shield } from 'lucide-react'
import { formatMBI, formatSSN } from '@/lib/contact-utils'
import type { Database } from '@/lib/supabase'

type Contact = Database['public']['Tables']['contacts']['Row']

interface ContactMedicareInfoProps {
  contact: Contact
}

export default function ContactMedicareInfo({ contact }: ContactMedicareInfoProps) {
  const hasMedicareInfo =
    contact.medicare_beneficiary_id ||
    contact.ssn ||
    contact.part_a_status ||
    contact.part_b_status ||
    contact.subsidy_level

  if (!hasMedicareInfo) {
    return null
  }

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-muted-foreground">Medicare Information</Label>
      <div className="space-y-2">
        {contact.medicare_beneficiary_id && (
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">MBI:</span>
            <span className="text-sm">{formatMBI(contact.medicare_beneficiary_id)}</span>
          </div>
        )}
        {contact.ssn && (
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">SSN:</span>
            <span className="text-sm">{formatSSN(contact.ssn)}</span>
          </div>
        )}
        {contact.part_a_status && (
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Part A Status:</span>
            <span className="text-sm">{contact.part_a_status}</span>
          </div>
        )}
        {contact.part_b_status && (
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Part B Status:</span>
            <span className="text-sm">{contact.part_b_status}</span>
          </div>
        )}
        {contact.subsidy_level && (
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Subsidy Level:</span>
            <span className="text-sm">{contact.subsidy_level}</span>
          </div>
        )}
      </div>
    </div>
  )
}
