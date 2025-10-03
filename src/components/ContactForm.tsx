import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import ModalForm from '@/components/ui/modal-form'
import AddressForm from '@/components/AddressForm'
import { useAddresses } from '@/hooks/useAddresses'
import { MapPin, Plus, Edit, Trash2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { Database } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import type { Json } from '@/lib/supabase-types'
import { AddressType } from '@/lib/address-types'
import ContactRoleManager from './ContactRoleManager'
import RoleForm from './RoleForm'
import ContactPlansManager from './ContactPlansManager'

type Contact = Database['public']['Tables']['contacts']['Row']
type Address = Database['public']['Tables']['addresses']['Row']

import { RoleData, RoleType } from '@/types/roles'

// Type for a role that hasn't been saved to the database yet
type PendingRole = {
  id: string // temporary ID for React key
  role_type: RoleType
  role_data: RoleData
  is_primary: boolean
}

// Type for a role from the database
type ContactRole = {
  id: string
  contact_id: string
  role_type: RoleType
  role_data: Record<string, unknown>
  is_primary: boolean
  created_at: string
  updated_at: string
}

interface ContactFormData {
  first_name: string
  last_name: string
  phone: string
  email: string
  notes: string
  birthdate: string
  status: string
  medicare_beneficiary_id: string
  ssn: string
}

interface AddressFormData {
  address1: string
  address2: string
  city: string
  state_code: string
  postal_code: string
  county: string
  address_type: AddressType
  source: string
}

interface ContactFormProps {
  isOpen: boolean
  editingContact: Contact | null
  formData: ContactFormData
  onFormDataChange: (data: ContactFormData) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  isLoading?: boolean
  onRefreshContact?: () => void
  onPendingRolesChange?: (roles: PendingRole[]) => void
  roleRefreshTrigger?: number
}

export default function ContactForm({
  isOpen,
  editingContact,
  formData,
  onFormDataChange,
  onSubmit,
  onCancel,
  isLoading = false,
  onRefreshContact,
  onPendingRolesChange,
  roleRefreshTrigger: parentRoleRefreshTrigger,
}: ContactFormProps) {
  // Address management state
  const [addresses, setAddresses] = useState<Address[]>([])
  const [addressFormOpen, setAddressFormOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [addressFormData, setAddressFormData] = useState<AddressFormData>({
    address1: '',
    address2: '',
    city: '',
    state_code: '',
    postal_code: '',
    county: '',
    address_type: AddressType.PRIMARY,
    source: '',
  })
  const [addressSubmitting, setAddressSubmitting] = useState(false)
  const [pendingRoles, setPendingRoles] = useState<PendingRole[]>([])

  // Role form state
  const [roleFormOpen, setRoleFormOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<ContactRole | PendingRole | null>(null)
  const [roleFormData, setRoleFormData] = useState<{
    role_type: RoleType
    role_data: RoleData
    is_primary: boolean
  }>({
    role_type: 'medicare_client',
    role_data: {},
    is_primary: false,
  })
  const [roleSubmitting, setRoleSubmitting] = useState(false)

  const { createAddress, updateAddress, deleteAddress } = useAddresses()

  const title = editingContact ? `${editingContact.first_name} ${editingContact.last_name}` : 'Add New Contact'
  const submitText = editingContact ? 'Update' : 'Create'

  const editingInfo = editingContact && (
    <div className="text-muted-foreground mb-4 text-xs">
      Last updated: {new Date(editingContact.updated_at).toLocaleString()}
    </div>
  )

  const fetchAddresses = React.useCallback(async () => {
    if (!editingContact) return

    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('contact_id', editingContact.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching addresses:', error)
        return
      }

      setAddresses(data || [])
    } catch (error) {
      console.error('Error fetching addresses:', error)
    }
  }, [editingContact])

  // Clear all state when opening modal for new contact
  useEffect(() => {
    if (isOpen && !editingContact) {
      // Clear all role-related state for new contact
      setPendingRoles([])

      // Clear address-related state
      setAddresses([])
      setAddressFormOpen(false)
      setEditingAddress(null)
      setAddressFormData({
        address1: '',
        address2: '',
        city: '',
        state_code: '',
        postal_code: '',
        county: '',
        address_type: AddressType.PRIMARY,
        source: '',
      })
      setAddressSubmitting(false)
    }
  }, [isOpen, editingContact])

  // Fetch addresses when editing a contact
  useEffect(() => {
    if (editingContact && isOpen) {
      fetchAddresses()
    }
  }, [editingContact, isOpen, fetchAddresses])

  // Clear state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      // Close any open sub-modals
      setAddressFormOpen(false)
    }
  }, [isOpen])

  const handleAddAddress = () => {
    setEditingAddress(null)
    setAddressFormData({
      address1: '',
      address2: '',
      city: '',
      state_code: '',
      postal_code: '',
      county: '',
      address_type: AddressType.PRIMARY,
      source: '',
    })
    setAddressFormOpen(true)
  }

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address)
    setAddressFormData({
      address1: address.address1 || '',
      address2: address.address2 || '',
      city: address.city || '',
      state_code: address.state_code || '',
      postal_code: address.postal_code || '',
      county: address.county || '',
      address_type: (address.address_type as AddressType) || AddressType.PRIMARY,
      source: address.source || '',
    })
    setAddressFormOpen(true)
  }

  const handleDeleteAddress = async (addressId: string) => {
    if (!editingContact) return

    if (confirm('Are you sure you want to delete this address?')) {
      try {
        await deleteAddress(addressId)
        await fetchAddresses()
        // Refresh the main contacts list to update the contact card
        if (onRefreshContact) {
          await onRefreshContact()
        }
      } catch (error) {
        console.error('Error deleting address:', error)
      }
    }
  }

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingContact) return

    setAddressSubmitting(true)
    try {
      if (editingAddress) {
        await updateAddress(editingAddress.id, addressFormData)
      } else {
        await createAddress(editingContact.id, addressFormData)
      }
      setAddressFormOpen(false)
      await fetchAddresses()
      // Refresh the main contacts list to update the contact card
      if (onRefreshContact) {
        await onRefreshContact()
      }
    } catch (error) {
      console.error('Error saving address:', error)
    } finally {
      setAddressSubmitting(false)
    }
  }

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setRoleSubmitting(true)
    try {
      if (editingRole && 'contact_id' in editingRole) {
        // Update existing role in database
        const { error } = await supabase
          .from('contact_roles')
          .update({
            role_type: roleFormData.role_type,
            role_data: roleFormData.role_data as Json,
            is_primary: roleFormData.is_primary,
          })
          .eq('id', editingRole.id)

        if (error) {
          console.error('Error updating role:', error)
          return
        }

        onRefreshContact?.()
      } else {
        // Add new role to pending roles (for new contacts) or database (for existing contacts)
        if (editingContact) {
          // Existing contact - save to database
          const { error } = await supabase.from('contact_roles').insert({
            contact_id: editingContact.id,
            role_type: roleFormData.role_type,
            role_data: roleFormData.role_data as Json,
            is_primary: roleFormData.is_primary,
          })

          if (error) {
            console.error('Error creating role:', error)
            return
          }

          onRefreshContact?.()
        } else {
          // New contact - add to pending roles
          const newRole: PendingRole = {
            id: `temp-${Date.now()}`,
            role_type: roleFormData.role_type,
            role_data: roleFormData.role_data,
            is_primary: roleFormData.is_primary,
          }

          const updatedRoles = [...pendingRoles, newRole]
          setPendingRoles(updatedRoles)
          onPendingRolesChange?.(updatedRoles)
        }
      }

      setRoleFormOpen(false)
    } catch (error) {
      console.error('Error saving role:', error)
    } finally {
      setRoleSubmitting(false)
    }
  }

  // Field labels for address display
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

  const excludeFields = ['id', 'contact_id', 'created_at', 'updated_at']

  return (
    <>
      <ModalForm
        isOpen={isOpen}
        title={title}
        onSubmit={onSubmit}
        onCancel={onCancel}
        isLoading={isLoading}
        submitText={submitText}
        editingInfo={editingInfo}
        zIndex={60}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              value={formData.first_name}
              onChange={(e) => onFormDataChange({ ...formData, first_name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              value={formData.last_name}
              onChange={(e) => onFormDataChange({ ...formData, last_name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => onFormDataChange({ ...formData, phone: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => onFormDataChange({ ...formData, email: e.target.value })}
            />
          </div>

          {/* Contact Roles Management */}
          <ContactRoleManager
            editingContact={editingContact}
            onRefreshContact={onRefreshContact}
            pendingRoles={pendingRoles}
            onPendingRolesChange={onPendingRolesChange}
            onRoleFormOpenChange={setRoleFormOpen}
            onEditingRoleChange={setEditingRole}
            onRoleFormDataChange={setRoleFormData}
            refreshTrigger={parentRoleRefreshTrigger}
          />

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => onFormDataChange({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="New">🆕 New</SelectItem>
                <SelectItem value="Contacted">📞 Contacted</SelectItem>
                <SelectItem value="Engaged">🤝 Engaged</SelectItem>
                <SelectItem value="Client">✅ Client</SelectItem>
                <SelectItem value="No-response">❌ No response</SelectItem>
                <SelectItem value="Already-enrolled">🎓 Already enrolled</SelectItem>
                <SelectItem value="Too-expensive">💰 Too expensive</SelectItem>
                <SelectItem value="Not-interested">😐 Not interested</SelectItem>
                <SelectItem value="Not-eligible">🚫 Not eligible</SelectItem>
                <SelectItem value="Brandon">🚫 Brandon&apos;s client</SelectItem>
                <SelectItem value="Retained">🔄 Retained</SelectItem>
                <SelectItem value="Loyal">💎 Loyal</SelectItem>
                <SelectItem value="Other">📝 Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => onFormDataChange({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>
          <div className="text-muted-foreground my-8">
            <hr />
          </div>
          <div>
            <Label htmlFor="medicare_beneficiary_id">Medicare Beneficiary ID (MBI)</Label>
            <Input
              id="medicare_beneficiary_id"
              value={formData.medicare_beneficiary_id}
              onChange={(e) => {
                // Only allow alphanumeric characters and hyphens
                const value = e.target.value.replace(/[^A-Z0-9-]/gi, '')
                onFormDataChange({ ...formData, medicare_beneficiary_id: value })
              }}
              maxLength={13}
            />
          </div>
          <div>
            <Label htmlFor="ssn">Social Security Number (SSN)</Label>
            <Input
              id="ssn"
              value={formData.ssn}
              onChange={(e) => {
                // Remove all non-numeric characters
                const cleaned = e.target.value.replace(/\D/g, '')

                // Format as XXX-XX-XXXX while typing
                let formatted = ''
                if (cleaned.length > 0) {
                  formatted = cleaned.substring(0, 3)
                  if (cleaned.length > 3) {
                    formatted += '-' + cleaned.substring(3, 5)
                    if (cleaned.length > 5) {
                      formatted += '-' + cleaned.substring(5, 9)
                    }
                  }
                }

                onFormDataChange({ ...formData, ssn: formatted })
              }}
              maxLength={11}
            />
          </div>
          <div>
            <Label htmlFor="birthdate">Birthday</Label>
            <Input
              id="birthdate"
              type="date"
              value={formData.birthdate}
              onChange={(e) => onFormDataChange({ ...formData, birthdate: e.target.value })}
            />
          </div>

          {/* Address Management Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Addresses</Label>
              {editingContact && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddAddress}
                      className="flex cursor-pointer items-center"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Add address</TooltipContent>
                </Tooltip>
              )}
            </div>

            {editingContact ? (
              addresses.length > 0 ? (
                <div className="space-y-2">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className="rounded-lg border border-l-4 border-gray-200 border-l-blue-500 p-3"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <MapPin className="text-muted-foreground h-4 w-4" />
                          <span className="text-sm font-medium">Address</span>
                          {address.address_type && (
                            <Badge variant="outline" className="text-xs">
                              {address.address_type}
                            </Badge>
                          )}
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditAddress(address)}
                            className="h-6 w-6 cursor-pointer p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAddress(address.id)}
                            className="h-6 w-6 cursor-pointer p-0 text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm">
                        {Object.entries(address)
                          .filter(([key, value]) => !excludeFields.includes(key) && value && key !== 'address_type')
                          .map(([key, value]) => (
                            <div
                              key={key}
                              className="flex justify-between border-b border-gray-100 pb-1 last:border-b-0"
                            >
                              <span className="font-medium">{value}</span>
                              <span className="text-muted-foreground">{fieldLabels[key] || key}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">No addresses found</div>
              )
            ) : (
              <div className="text-muted-foreground text-sm">Addresses can be added after the contact is created.</div>
            )}
          </div>

          {/* Plans Management Section */}
          {editingContact && (
            <ContactPlansManager contact={editingContact} onRefresh={onRefreshContact} />
          )}
        </div>
      </ModalForm>

      {/* Address Form Modal */}
      <AddressForm
        isOpen={addressFormOpen}
        onClose={() => setAddressFormOpen(false)}
        onSubmit={handleAddressSubmit}
        address={editingAddress}
        formData={addressFormData}
        setFormData={setAddressFormData}
        isSubmitting={addressSubmitting}
      />

      {/* Role Form Modal */}
      <RoleForm
        isOpen={roleFormOpen}
        onClose={() => setRoleFormOpen(false)}
        onSubmit={handleRoleSubmit}
        editingRole={editingRole}
        formData={roleFormData}
        setFormData={setRoleFormData}
        isSubmitting={roleSubmitting}
      />
    </>
  )
}
