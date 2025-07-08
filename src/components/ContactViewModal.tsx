import React, { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import ModalForm from '@/components/ui/modal-form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  Heart,
  Shield,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
} from 'lucide-react'
import type { Database } from '@/lib/supabase'
import { formatLocalDate, formatPhoneNumber, formatMBI, getStatusBadge } from '@/lib/contact-utils'
import { supabase } from '@/lib/supabase'

type Contact = Database['public']['Tables']['contacts']['Row']
type Address = Database['public']['Tables']['addresses']['Row']

interface ContactViewModalProps {
  isOpen: boolean
  onClose: () => void
  contact: Contact | null
  onEdit?: (contact: Contact) => void
}

// Helper to format YYYY-MM-DD as YYYY-MM-DD (strip time if present)
function formatDateString(dateString: string | null | undefined) {
  if (!dateString) return 'Not set'
  return dateString.split('T')[0]
}

function getBooleanDisplay(value: boolean | null) {
  if (value === null) return { text: 'Not specified', className: 'text-gray-400 bg-gray-100 border-gray-200' }
  if (value) {
    return { text: 'Yes', className: 'text-green-600 bg-green-50 border-green-200' }
  } else {
    return { text: 'No', className: 'text-red-600 bg-red-50 border-red-200' }
  }
}

function getCommunicationDisplay(method: string | null) {
  switch (method) {
    case 'phone':
      return { text: 'Phone', icon: Phone, className: 'text-blue-600 bg-blue-50 border-blue-200' }
    case 'email':
      return { text: 'Email', icon: Mail, className: 'text-green-600 bg-green-50 border-green-200' }
    case 'text':
      return { text: 'Text', icon: Phone, className: 'text-purple-600 bg-purple-50 border-purple-200' }
    default:
      return {
        text: method || 'Not specified',
        icon: AlertCircle,
        className: 'text-gray-600 bg-gray-50 border-gray-200',
      }
  }
}

function getRecordTypeDisplay(type: string | null) {
  switch (type) {
    case 'Prospect':
      return { text: 'Prospect', className: 'text-blue-600 bg-blue-50 border-blue-200' }
    case 'Customer':
      return { text: 'Customer', className: 'text-green-600 bg-green-50 border-green-200' }
    case 'Lead':
      return { text: 'Lead', className: 'text-yellow-600 bg-yellow-50 border-yellow-200' }
    default:
      return { text: type || 'Not specified', className: 'text-gray-600 bg-gray-50 border-gray-200' }
  }
}

export default function ContactViewModal({ isOpen, onClose, contact, onEdit }: ContactViewModalProps) {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [addressesLoading, setAddressesLoading] = useState(false)

  useEffect(() => {
    if (contact && isOpen) {
      fetchAddresses()
    }
  }, [contact, isOpen])

  const fetchAddresses = async () => {
    if (!contact) return

    setAddressesLoading(true)
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('contact_id', contact.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching addresses:', error)
        return
      }

      setAddresses(data || [])
    } catch (error) {
      console.error('Error fetching addresses:', error)
    } finally {
      setAddressesLoading(false)
    }
  }

  if (!contact) return null

  const statusDisplay = getStatusBadge(contact.status)
  const medicaidDisplay = getBooleanDisplay(contact.has_medicaid)
  const tobaccoDisplay = getBooleanDisplay(contact.is_tobacco_user)
  const inactiveDisplay = getBooleanDisplay(contact.inactive)
  const communicationDisplay = getCommunicationDisplay(contact.primary_communication)
  const recordTypeDisplay = getRecordTypeDisplay(contact.contact_record_type)

  const CommunicationIcon = communicationDisplay.icon

  return (
    <ModalForm
      isOpen={isOpen}
      onCancel={onClose}
      onSubmit={(e) => {
        e.preventDefault()
        onClose()
      }}
      title={
        <div className="flex flex-row items-center gap-2">
          <span>View Contact</span>
          {onEdit && contact && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onEdit(contact)}
              className="flex items-center space-x-1"
            >
              <Edit className="h-3 w-3" />
              <span>Edit</span>
            </Button>
          )}
        </div>
      }
      submitText=""
      isLoading={false}
    >
      <div className="space-y-4">
        {/* Name */}
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
          <div className="mt-1 flex items-center space-x-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <p className="text-base font-semibold">
              {[contact.prefix, contact.first_name, contact.middle_name, contact.last_name, contact.suffix]
                .filter(Boolean)
                .join(' ')}
            </p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-muted-foreground">Contact Information</Label>
          <div className="space-y-2">
            {contact.phone && (
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Phone:</span>
                <span className="text-sm">{formatPhoneNumber(contact.phone)}</span>
              </div>
            )}
            {contact.email && (
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Email:</span>
                <span className="text-sm">{contact.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Addresses */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-muted-foreground">Addresses</Label>
          {addressesLoading ? (
            <div className="text-sm text-muted-foreground">Loading addresses...</div>
          ) : addresses.length > 0 ? (
            <div className="space-y-3">
              {addresses.map((address) => {
                // Map of field labels
                const fieldLabels: Record<string, string> = {
                  address1: 'Address Line 1',
                  address2: 'Address Line 2',
                  city: 'City',
                  state_code: 'State',
                  postal_code: 'ZIP Code',
                  county: 'County',
                  county_fips: 'County FIPS',
                  latitude: 'Latitude',
                  longitude: 'Longitude',
                  address_type: 'Type',
                }
                // Fields to exclude
                const excludeFields = ['id', 'contact_id', 'created_at', 'updated_at']
                return (
                  <div key={address.id} className="rounded-lg border border-gray-200 p-3">
                    <div className="mb-2 flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Address</span>
                      {address.address_type && (
                        <Badge variant="outline" className="text-xs">
                          {address.address_type}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1 text-sm">
                      {Object.entries(address)
                        .filter(([key, value]) => !excludeFields.includes(key) && value && key !== 'address_type')
                        .map(([key, value]) => (
                          <div key={key}>
                            <span className="font-medium">{fieldLabels[key] || key}:</span> {value}
                          </div>
                        ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No addresses found</div>
          )}
        </div>

        {/* Personal Information */}
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

        {/* Medicare Information */}
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

        {/* Status and Flags */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Status</Label>
            <div className="mt-1">
              {statusDisplay ? (
                <Badge className={statusDisplay.className}>
                  <AlertCircle className="mr-1 h-3 w-3" />
                  {statusDisplay.text}
                </Badge>
              ) : (
                <span className="text-sm text-muted-foreground">No status</span>
              )}
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Record Type</Label>
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
            <Label className="text-sm font-medium text-muted-foreground">Has Medicaid</Label>
            <div className="mt-1">
              <Badge className={medicaidDisplay.className}>
                {contact.has_medicaid ? <CheckCircle className="mr-1 h-3 w-3" /> : <XCircle className="mr-1 h-3 w-3" />}
                {medicaidDisplay.text}
              </Badge>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Tobacco User</Label>
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
          <Label className="text-sm font-medium text-muted-foreground">Primary Communication</Label>
          <div className="mt-1">
            <Badge className={communicationDisplay.className}>
              <CommunicationIcon className="mr-1 h-3 w-3" />
              {communicationDisplay.text}
            </Badge>
          </div>
        </div>

        {/* Policy Counts */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Life Policies</Label>
            <p className="mt-1 text-sm">{contact.life_policy_count || 0}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Health Policies</Label>
            <p className="mt-1 text-sm">{contact.health_policy_count || 0}</p>
          </div>
        </div>

        {/* Lead Information */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-muted-foreground">Lead Information</Label>
          <div className="space-y-2">
            {contact.lead_source && (
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Source:</span>
                <span className="text-sm">{contact.lead_source}</span>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
          <p className="mt-1 whitespace-pre-wrap text-sm">{contact.notes || 'No notes'}</p>
        </div>

        {/* Dates */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-muted-foreground">Dates</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Created:</span>
              <span className="text-sm">{formatDateString(contact.created_at)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Updated:</span>
              <span className="text-sm">{formatDateString(contact.updated_at)}</span>
            </div>
          </div>
        </div>

        {/* Active Status */}
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Active Status</Label>
          <div className="mt-1">
            <Badge className={inactiveDisplay.className}>
              {contact.inactive ? <XCircle className="mr-1 h-3 w-3" /> : <CheckCircle className="mr-1 h-3 w-3" />}
              {inactiveDisplay.text}
            </Badge>
          </div>
        </div>
      </div>
    </ModalForm>
  )
}
