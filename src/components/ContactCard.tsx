import React from 'react'
import Link from 'next/link'
import { Edit, Trash2, Eye, FileText, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { Database } from '@/lib/supabase'
import {
  formatLocalDate,
  formatPhoneNumber,
  getStatusBadge,
  calculateAge,
  getDaysPast65,
  getT65Days,
} from '@/lib/contact-utils'
import { getPrimaryAddress } from '@/lib/address-utils'
import LazyContactPlans from './LazyContactPlans'

import { getRoleDisplayInfo, roleIconMap } from '@/lib/role-config'
import {
  RoleType,
  ReferralPartnerData,
  PresentationPartnerData,
  TireShopData,
  DentistData,
  OtherRoleData,
} from '@/types/roles'

// Utility function to extract organization name from role data
const getOrganizationName = (
  roleType: string,
  roleData: Database['public']['Tables']['contact_roles']['Row']['role_data']
): string | null => {
  if (!roleData || typeof roleData !== 'object') return null

  switch (roleType) {
    case 'referral_partner':
      return (roleData as ReferralPartnerData)?.company || null
    case 'presentation_partner':
      return (roleData as PresentationPartnerData)?.organization_name || null
    case 'tire_shop':
      return (roleData as TireShopData)?.shop_name || null
    case 'dentist':
      return (roleData as DentistData)?.practice_name || null
    case 'other':
      return (roleData as OtherRoleData)?.role_description || null
    default:
      return null
  }
}

// Utility function to format organization name for display
const formatOrgNameForDisplay = (orgName: string, maxLength: number = 20): string => {
  if (orgName.length <= maxLength) return orgName
  return `${orgName.substring(0, maxLength)}...`
}

// Types moved to LazyContactPlans component

type Contact = Database['public']['Tables']['contacts']['Row'] & {
  addresses?: Database['public']['Tables']['addresses']['Row'][]
  contact_roles?: Database['public']['Tables']['contact_roles']['Row'][]
}

interface ContactCardProps {
  contact: Contact
  isSelected: boolean
  isSingleView: boolean
  onSelect: (contact: Contact) => void
  onEdit: (contact: Contact) => void
  onDelete: (contactId: string) => void
  onView: (contact: Contact) => void
  onEditNotes: (contact: Contact) => void
  onFilterActions?: (contact: Contact) => void
  refreshTimestamp?: number
}

export default function ContactCard({
  contact,
  isSelected,
  isSingleView,
  onSelect,
  onEdit,
  onDelete,
  onView,
  onEditNotes,
  onFilterActions,
  refreshTimestamp, // eslint-disable-line @typescript-eslint/no-unused-vars
}: ContactCardProps) {
  // Removed usePlanEnrollments to prevent excessive API calls
  // Enrollment data is shown in ContactPlansDisplay when viewing a contact

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        isSelected ? 'border-primary bg-primary/5' : isSingleView ? '' : 'hover:bg-muted/50 cursor-pointer'
      }`}
      onClick={() => {
        if (!isSingleView) {
          onSelect(contact)
        }
      }}
    >
      {/* Header: Name/Status (left), Action Buttons (right) */}
      <div className="flex items-start justify-between">
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
            {!isSingleView ? (
              <Link
                href={`/manage?contact=${contact.id}`}
                className="hover:underline"
                onClick={(e) => {
                  e.stopPropagation()
                }}
              >
                {contact.first_name} {contact.last_name}
              </Link>
            ) : (
              <span>
                {contact.first_name} {contact.last_name}
              </span>
            )}

            {/* Role Badges - inline with name */}
            {contact.contact_roles && contact.contact_roles.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {contact.contact_roles.map((role) => {
                  const config = getRoleDisplayInfo(role.role_type as RoleType)
                  const IconComponent = roleIconMap[role.role_type as RoleType] || roleIconMap.other
                  const orgName = getOrganizationName(role.role_type, role.role_data)

                  return (
                    <Tooltip key={role.id}>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className={`text-xs ${config.color.split(' ')[1]}`}>
                          <IconComponent className="mr-1 h-3 w-3" />
                          <span className="hidden xl:inline">
                            {orgName ? formatOrgNameForDisplay(orgName, 30) : config.label}
                          </span>
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {config.label} {orgName ? `at ${orgName}` : ''}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            )}
          </h3>
        </div>

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
                className="hover:bg-muted hover:text-muted-foreground h-8 w-8 cursor-pointer p-0"
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
                  onEditNotes(contact)
                }}
                className="h-8 w-8 cursor-pointer p-0 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950/50 dark:hover:text-green-400"
                aria-label="Edit notes"
              >
                <FileText className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit notes</TooltipContent>
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
                className="h-8 w-8 cursor-pointer p-0 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/50 dark:hover:text-blue-400"
                aria-label="Edit contact"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit contact</TooltipContent>
          </Tooltip>
          {onFilterActions && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onFilterActions(contact)
                  }}
                  className="h-8 w-8 cursor-pointer p-0 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/50 dark:hover:text-blue-400"
                  aria-label="Filter actions for this contact"
                >
                  <List className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Show only actions for this contact</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(contact.id)
                }}
                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400"
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
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {/* Birthdate display */}
          {contact.birthdate && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center space-x-1 whitespace-nowrap">
                  <span className="text-muted-foreground text-sm">🎂</span>
                  <span className="text-muted-foreground text-sm">
                    {formatLocalDate(contact.birthdate)}
                    {(() => {
                      const age = calculateAge(contact.birthdate)
                      const daysPast65 = getDaysPast65(contact.birthdate)
                      return age !== null ? ` (${age})${daysPast65 !== null ? ` ${daysPast65}` : ''}` : ''
                    })()}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {(() => {
                  const t65Days = getT65Days(contact.birthdate)
                  if (t65Days === null) return 'T65 days: N/A'
                  if (t65Days > 0) return `${t65Days} days past 65th birthday`
                  if (t65Days === 0) return 'Turning 65 today, happy birthday!'
                  return `${Math.abs(t65Days)} days until 65th birthday`
                })()}
              </TooltipContent>
            </Tooltip>
          )}
          {/* Phone number display */}
          {contact.phone && (
            <div className="flex items-center space-x-1 whitespace-nowrap">
              <span className="text-muted-foreground text-sm">📞</span>
              <span className="text-muted-foreground text-sm">{formatPhoneNumber(contact.phone)}</span>
            </div>
          )}
          {/* Email display */}
          {contact.email && (
            <div className="flex items-center space-x-1 whitespace-nowrap">
              <span className="text-muted-foreground text-sm">✉️</span>
              <span className="text-muted-foreground text-sm">{contact.email}</span>
            </div>
          )}
          {/* Address display */}
          {(() => {
            // Use getPrimaryAddress utility to find the best address to display
            const address = contact.addresses ? getPrimaryAddress(contact.addresses) : null
            if (!address) return null

            const parts = []
            if (address.address1) parts.push(address.address1)
            if (address.city) parts.push(address.city)
            if (address.postal_code) parts.push(address.postal_code)

            if (parts.length === 0) return null

            return (
              <div className="flex items-center space-x-1 whitespace-nowrap">
                <span className="text-muted-foreground text-sm">📍</span>
                <span className="text-muted-foreground text-sm">{parts.join(', ')}</span>
              </div>
            )
          })()}
        </div>

        {/* Enrollments - Lazy loaded with caching */}
        <LazyContactPlans contactId={contact.id} />

        {/* Notes display */}
        {contact.notes && <p className="text-muted-foreground mt-2 text-sm">{contact.notes}</p>}
      </div>
    </div>
  )
}
