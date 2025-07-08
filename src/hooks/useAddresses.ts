import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Address = Database['public']['Tables']['addresses']['Row']

interface AddressForm {
  address1: string
  address2?: string
  city: string
  state_code: string
  postal_code: string
  county?: string
  county_fips?: string
  latitude?: number
  longitude?: number
}

export function useAddresses() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAddresses = async (contactId?: string) => {
    try {
      let query = supabase.from('addresses').select('*').order('created_at', { ascending: false })

      if (contactId) {
        query = query.eq('contact_id', contactId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching addresses:', error)
        return
      }

      setAddresses(data || [])
    } catch (error) {
      console.error('Error fetching addresses:', error)
    } finally {
      setLoading(false)
    }
  }

  const createAddress = async (contactId: string, addressData: AddressForm) => {
    try {
      const { error } = await supabase.from('addresses').insert({
        contact_id: contactId,
        address1: addressData.address1,
        address2: addressData.address2 || null,
        city: addressData.city,
        state_code: addressData.state_code,
        postal_code: addressData.postal_code,
        county: addressData.county || null,
        county_fips: addressData.county_fips || null,
        latitude: addressData.latitude || null,
        longitude: addressData.longitude || null,
      })

      if (error) {
        console.error('Error creating address:', error)
        return false
      }

      await fetchAddresses(contactId)
      return true
    } catch (error) {
      console.error('Error creating address:', error)
      return false
    }
  }

  const updateAddress = async (addressId: string, addressData: AddressForm) => {
    try {
      const { error } = await supabase
        .from('addresses')
        .update({
          address1: addressData.address1,
          address2: addressData.address2 || null,
          city: addressData.city,
          state_code: addressData.state_code,
          postal_code: addressData.postal_code,
          county: addressData.county || null,
          county_fips: addressData.county_fips || null,
          latitude: addressData.latitude || null,
          longitude: addressData.longitude || null,
        })
        .eq('id', addressId)

      if (error) {
        console.error('Error updating address:', error)
        return false
      }

      await fetchAddresses()
      return true
    } catch (error) {
      console.error('Error updating address:', error)
      return false
    }
  }

  const deleteAddress = async (addressId: string, contactId?: string) => {
    try {
      const { error } = await supabase.from('addresses').delete().eq('id', addressId)

      if (error) {
        console.error('Error deleting address:', error)
        return false
      }

      await fetchAddresses(contactId)
      return true
    } catch (error) {
      console.error('Error deleting address:', error)
      return false
    }
  }

  const getAddressesByContact = (contactId: string) => {
    return addresses.filter((address) => address.contact_id === contactId)
  }

  useEffect(() => {
    fetchAddresses()
  }, [])

  return {
    addresses,
    loading,
    fetchAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    getAddressesByContact,
  }
}
