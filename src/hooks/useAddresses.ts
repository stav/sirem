import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'
import { AddressType } from '@/lib/address-types'

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
  address_type?: AddressType
  source?: string
}

// Cache for storing addresses by contact ID
const addressCache = new Map<string, { addresses: Address[]; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useAddresses(contactId?: string) {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchAddresses = useCallback(async (id: string, forceRefresh = false) => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = addressCache.get(id)
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setAddresses(cached.addresses)
        setError(null)
        return
      }
    }

    setLoading(true)
    setError(null)

    try {
      abortControllerRef.current = new AbortController()

      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('contact_id', id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Update cache
      addressCache.set(id, { addresses: data || [], timestamp: Date.now() })

      setAddresses(data || [])
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, ignore
        return
      }
      console.error('Error fetching addresses:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch addresses')
    } finally {
      setLoading(false)
      abortControllerRef.current = null
    }
  }, [])

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
        address_type: addressData.address_type || AddressType.PRIMARY,
        source: addressData.source || null,
      })

      if (error) throw error

      // Invalidate cache for this contact
      addressCache.delete(contactId)

      // Refresh addresses
      await fetchAddresses(contactId, true)
      return true
    } catch (error) {
      console.error('Error creating address:', error)
      setError(error instanceof Error ? error.message : 'Failed to create address')
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
          address_type: addressData.address_type || AddressType.PRIMARY,
          source: addressData.source || null,
        })
        .eq('id', addressId)

      if (error) throw error

      // Invalidate cache for this contact
      const contactId = addresses.find((addr) => addr.id === addressId)?.contact_id
      if (contactId) {
        addressCache.delete(contactId)
        await fetchAddresses(contactId, true)
      }

      return true
    } catch (error) {
      console.error('Error updating address:', error)
      setError(error instanceof Error ? error.message : 'Failed to update address')
      return false
    }
  }

  const deleteAddress = async (addressId: string) => {
    try {
      const contactId = addresses.find((addr) => addr.id === addressId)?.contact_id

      const { error } = await supabase.from('addresses').delete().eq('id', addressId)
      if (error) throw error

      // Invalidate cache for this contact
      if (contactId) {
        addressCache.delete(contactId)
        await fetchAddresses(contactId, true)
      }

      return true
    } catch (error) {
      console.error('Error deleting address:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete address')
      return false
    }
  }

  const clearCache = useCallback(() => {
    addressCache.clear()
  }, [])

  const getAddressesByContact = useCallback((contactId: string) => {
    return addressCache.get(contactId)?.addresses || []
  }, [])

  useEffect(() => {
    if (contactId) {
      fetchAddresses(contactId)
    } else {
      setAddresses([])
      setError(null)
    }

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [contactId, fetchAddresses])

  return {
    addresses,
    loading,
    error,
    fetchAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    clearCache,
    getAddressesByContact,
  }
}
