import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import ModalForm from '@/components/ui/modal-form'
import type { Database } from '@/lib/supabase'

type Address = Database['public']['Tables']['addresses']['Row']

interface AddressFormData {
  address1: string
  address2: string
  city: string
  state_code: string
  postal_code: string
  county: string
  address_type: string
}

interface AddressFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  address: Address | null
  formData: AddressFormData
  setFormData: (data: AddressFormData) => void
  isSubmitting: boolean
}

const addressTypes = [
  { value: 'primary', label: 'Primary' },
  { value: 'mailing', label: 'Mailing' },
  { value: 'billing', label: 'Billing' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'work', label: 'Work' },
  { value: 'home', label: 'Home' },
  { value: 'other', label: 'Other' },
]

const states = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
]

export default function AddressForm({
  isOpen,
  onClose,
  onSubmit,
  address,
  formData,
  setFormData,
  isSubmitting,
}: AddressFormProps) {
  const isEditing = !!address

  return (
    <ModalForm
      isOpen={isOpen}
      onCancel={onClose}
      onSubmit={onSubmit}
      title={isEditing ? 'Edit Address' : 'Add Address'}
      isLoading={isSubmitting}
      zIndex={70}
    >
      <div className="space-y-4">
        {/* Address Type */}
        <div>
          <Label htmlFor="address_type">Address Type</Label>
          <Select
            value={formData.address_type}
            onValueChange={(value) => setFormData({ ...formData, address_type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select address type" />
            </SelectTrigger>
            <SelectContent>
              {addressTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Address Line 1 */}
        <div>
          <Label htmlFor="address1">Address Line 1 *</Label>
          <Input
            id="address1"
            value={formData.address1}
            onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
            placeholder="123 Main St"
            required
          />
        </div>

        {/* Address Line 2 */}
        <div>
          <Label htmlFor="address2">Address Line 2</Label>
          <Input
            id="address2"
            value={formData.address2}
            onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
            placeholder="Apt 4B"
          />
        </div>

        {/* City */}
        <div>
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="New York"
            required
          />
        </div>

        {/* State and ZIP */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="state_code">State</Label>
            <Select
              value={formData.state_code}
              onValueChange={(value) => setFormData({ ...formData, state_code: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {states.map((state) => (
                  <SelectItem key={state.value} value={state.value}>
                    {state.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="postal_code">ZIP Code</Label>
            <Input
              id="postal_code"
              value={formData.postal_code}
              onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
              placeholder="12345"
            />
          </div>
        </div>

        {/* County */}
        <div>
          <Label htmlFor="county">County</Label>
          <Input
            id="county"
            value={formData.county}
            onChange={(e) => setFormData({ ...formData, county: e.target.value })}
            placeholder="County name"
          />
        </div>
      </div>
    </ModalForm>
  )
}
