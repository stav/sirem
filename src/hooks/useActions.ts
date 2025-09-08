import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'
import { getDisplayDate, getEffectiveStatus } from '@/lib/action-utils'

// Helper function to get local time as UTC (treating local time as if it's UTC)
function getLocalTimeAsUTC(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  const datetimeLocal = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`

  // Convert to ISO string (UTC) by treating local time as UTC
  const utcDate = new Date(datetimeLocal + 'Z')
  return utcDate.toISOString()
}

type Action = Database['public']['Tables']['actions']['Row']
type ActionInsert = Database['public']['Tables']['actions']['Insert']

// Use the generated types for form data
type ActionForm = Omit<ActionInsert, 'id' | 'created_at' | 'updated_at' | 'contact_id' | 'source' | 'metadata'>

export function useActions() {
  const [actions, setActions] = useState<Action[]>([])
  const [loading, setLoading] = useState(true)

  const fetchActions = async () => {
    try {
      // Fetch all actions by making multiple requests to overcome the 1000 row limit
      let allActions: Action[] = []
      let offset = 0
      const limit = 1000
      let hasMore = true

      while (hasMore) {
        const { data, error } = await supabase
          .from('actions')
          .select('*')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)

        if (error) {
          console.error('Error fetching actions:', error)
          break
        }

        if (data && data.length > 0) {
          allActions = [...allActions, ...data]
          offset += limit

          // If we got less than the limit, we've reached the end
          if (data.length < limit) {
            hasMore = false
          }
        } else {
          hasMore = false
        }
      }

      setActions(allActions)
    } catch (error) {
      console.error('Error fetching actions:', error)
    } finally {
      setLoading(false)
    }
  }

  const createAction = async (contactId: string, actionData: ActionForm) => {
    try {
      const { error } = await supabase.from('actions').insert({
        contact_id: contactId,
        title: actionData.title,
        description: actionData.description,
        tags: actionData.tags,
        start_date: actionData.start_date,
        end_date: actionData.end_date,
        completed_date: actionData.completed_date,
        status: actionData.status,
        priority: actionData.priority,
        duration: actionData.duration,
        outcome: actionData.outcome,
        source: 'Manual',
      })

      if (error) {
        console.error('Error creating action:', error)
        return false
      }

      await fetchActions()
      return true
    } catch (error) {
      console.error('Error creating action:', error)
      return false
    }
  }

  const updateAction = async (actionId: string, actionData: ActionForm) => {
    try {
      // Prepare update data with proper type handling
      const updateData: Database['public']['Tables']['actions']['Update'] = {
        title: actionData.title,
        description: actionData.description || null,
        tags: actionData.tags || null,
        start_date: actionData.start_date || null,
        end_date: actionData.end_date || null,
        completed_date: actionData.completed_date || null,
        status: actionData.status || null,
        priority: actionData.priority || null,
        duration: actionData.duration || null,
        outcome: actionData.outcome || null,
      }

      const { error } = await supabase.from('actions').update(updateData).eq('id', actionId)

      if (error) {
        console.error('Error updating action:', error)
        return false
      }

      await fetchActions()
      return true
    } catch (error) {
      console.error('Error updating action:', error)
      return false
    }
  }

  const deleteAction = async (actionId: string) => {
    try {
      const { error } = await supabase.from('actions').delete().eq('id', actionId)

      if (error) {
        console.error('Error deleting action:', error)
        return false
      }

      await fetchActions()
      return true
    } catch (error) {
      console.error('Error deleting action:', error)
      return false
    }
  }

  const toggleActionComplete = async (action: Action) => {
    try {
      const newStatus = action.status === 'completed' ? 'planned' : 'completed'
      const completedDate = newStatus === 'completed' ? getLocalTimeAsUTC() : null

      const { error } = await supabase
        .from('actions')
        .update({
          status: newStatus,
          completed_date: completedDate,
        })
        .eq('id', action.id)

      if (error) {
        console.error('Error updating action:', error)
        return false
      }

      await fetchActions()
      return true
    } catch (error) {
      console.error('Error updating action:', error)
      return false
    }
  }

  const completeActionWithCreatedDate = async (action: Action) => {
    try {
      // Use the created_at date as the completed_date
      const completedDate = action.created_at

      const { error } = await supabase
        .from('actions')
        .update({
          status: 'completed',
          completed_date: completedDate,
        })
        .eq('id', action.id)

      if (error) {
        console.error('Error updating action:', error)
        return false
      }

      await fetchActions()
      return true
    } catch (error) {
      console.error('Error updating action:', error)
      return false
    }
  }

  // Helper functions for filtering
  const getPlannedActions = () =>
    actions.filter((action) => action.status && ['planned', 'overdue'].includes(action.status))
  const getCompletedActions = () => actions.filter((action) => action.status === 'completed')
  const getOverdueActions = () =>
    actions.filter(
      (action) => action.status === 'planned' && action.start_date && new Date(action.start_date) < new Date()
    )

  useEffect(() => {
    fetchActions()
  }, [])

  return {
    actions,
    loading,
    fetchActions,
    createAction,
    updateAction,
    deleteAction,
    toggleActionComplete,
    completeActionWithCreatedDate,
    getPlannedActions,
    getCompletedActions,
    getOverdueActions,
    getDisplayDate,
    getEffectiveStatus,
  }
}
