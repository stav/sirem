import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'
import { getDisplayDate, getEffectiveStatus } from '@/lib/action-utils'
import { fetchAllRecords } from '@/lib/database'
import { getLocalTimeAsUTC } from '@/lib/utils'

export type Action = Database['public']['Tables']['actions']['Row']
type ActionInsert = Database['public']['Tables']['actions']['Insert']

// Use the generated types for form data
type ActionForm = Omit<ActionInsert, 'id' | 'created_at' | 'updated_at' | 'contact_id' | 'source' | 'metadata'>

interface UseActionsOptions {
  initialActions?: Action[]
  autoFetch?: boolean
}

export function useActions(options?: UseActionsOptions) {
  const [actions, setActions] = useState<Action[]>(options?.initialActions ?? [])
  const [loading, setLoading] = useState(!options?.initialActions)
  const [refreshing, setRefreshing] = useState(false)
  const shouldAutoFetch = options?.autoFetch ?? true

  const fetchActions = async (isRefresh = false) => {
    try {
      // Only set loading to true on initial fetch, not on refreshes
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      // Fetch all actions by making multiple requests to overcome the 1000 row limit
      const allActions = await fetchAllRecords<Action>('actions', '*', 'created_at', false)

      setActions(allActions)
    } catch (error) {
      console.error('Error fetching actions:', error)
    } finally {
      if (isRefresh) {
        setRefreshing(false)
      } else {
        setLoading(false)
      }
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

      await fetchActions(true) // Pass true to indicate this is a refresh, not initial load
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

      // Optimistically update local state first
      setActions((prevActions) =>
        prevActions.map((action) => (action.id === actionId ? { ...action, ...updateData } : action))
      )

      // Then refresh in background without showing loading state
      await fetchActions(true) // Pass true to indicate this is a refresh, not initial load
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

      // Optimistically remove from local state
      setActions((prevActions) => prevActions.filter((action) => action.id !== actionId))

      // Then refresh in background without showing loading state
      await fetchActions(true) // Pass true to indicate this is a refresh, not initial load
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

      // Optimistically update local state first
      setActions((prevActions) =>
        prevActions.map((a) =>
          a.id === action.id
            ? { ...a, status: newStatus as Action['status'], completed_date: completedDate }
            : a
        )
      )

      const { error } = await supabase
        .from('actions')
        .update({
          status: newStatus,
          completed_date: completedDate,
        })
        .eq('id', action.id)

      if (error) {
        console.error('Error updating action:', error)
        // Revert optimistic update on error
        await fetchActions(true)
        return false
      }

      // Then refresh in background without showing loading state
      await fetchActions(true) // Pass true to indicate this is a refresh, not initial load
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

      // Optimistically update local state first
      setActions((prevActions) =>
        prevActions.map((a) =>
          a.id === action.id
            ? { ...a, status: 'completed' as Action['status'], completed_date: completedDate }
            : a
        )
      )

      const { error } = await supabase
        .from('actions')
        .update({
          status: 'completed',
          completed_date: completedDate,
        })
        .eq('id', action.id)

      if (error) {
        console.error('Error updating action:', error)
        // Revert optimistic update on error
        await fetchActions(true)
        return false
      }

      // Then refresh in background without showing loading state
      await fetchActions(true) // Pass true to indicate this is a refresh, not initial load
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
    if (options?.initialActions) {
      setActions(options.initialActions)
      setLoading(false)
    }
  }, [options?.initialActions])

  useEffect(() => {
    if (options?.initialActions || !shouldAutoFetch) {
      return
    }
    fetchActions()
  }, [shouldAutoFetch])

  return {
    actions,
    loading,
    refreshing,
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
