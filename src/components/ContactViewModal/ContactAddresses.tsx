import React from 'react'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { MapPin } from 'lucide-react'
import type { Database } from '@/lib/supabase'

type Address = Database['public']['Tables']['addresses']['Row']

interface ContactAddressesProps {
  addresses: Address[]
  addressesLoading: boolean
}

export default function ContactAddresses({ addresses, addressesLoading }: ContactAddressesProps) {
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
    <div className="space-y-3">
      <Label className="text-muted-foreground text-sm font-medium">Addresses</Label>
      {addressesLoading ? (
        <div className="text-muted-foreground text-sm">Loading addresses...</div>
      ) : addresses.length > 0 ? (
        <div className="space-y-3">
          {addresses.map((address) => (
            <div key={address.id} className="rounded-lg border border-gray-200 p-3">
              <div className="mb-2 flex items-center space-x-2">
                <MapPin className="text-muted-foreground h-4 w-4" />
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
                    <div key={key} className="flex justify-between border-b border-gray-100 pb-1 last:border-b-0">
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
      )}
    </div>
  )
}
