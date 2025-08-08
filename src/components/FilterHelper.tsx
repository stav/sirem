import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

interface FilterHelperProps {
  isOpen: boolean
  onAddFilter: (filterText: string) => void
}

export default function FilterHelper({ isOpen, onAddFilter }: FilterHelperProps) {
  const [statuses, setStatuses] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch unique statuses from the database
  useEffect(() => {
    if (isOpen) {
      fetchUniqueStatuses()
    }
  }, [isOpen])

  const fetchUniqueStatuses = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('status')
        .not('status', 'is', null)
        .not('status', 'eq', '')

      if (error) {
        console.error('Error fetching statuses:', error)
        return
      }

      // Extract unique statuses and sort them
      const uniqueStatuses = [
        ...new Set(data.map((item) => item.status).filter((status): status is string => status !== null)),
      ].sort()
      setStatuses(uniqueStatuses)
    } catch (error) {
      console.error('Error fetching statuses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusClick = (status: string) => {
    onAddFilter(`s:${status.toLowerCase()}`)
  }

  if (!isOpen) return null

  return (
    <div className="mt-2 rounded-md border bg-gray-50 p-3">
      <div className="mb-2 text-sm font-medium text-gray-700">Quick Status Filters:</div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading statuses...</div>
      ) : statuses.length === 0 ? (
        <div className="text-sm text-gray-500">No statuses found</div>
      ) : (
        <div className="flex flex-wrap gap-1">
          {statuses.map((status) => (
            <Button
              key={status}
              variant="outline"
              size="sm"
              onClick={() => handleStatusClick(status)}
              className="cursor-pointer text-xs"
            >
              {status}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
