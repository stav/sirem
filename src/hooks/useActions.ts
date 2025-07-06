import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Action = Database['public']['Tables']['actions']['Row']
type ActionInsert = Database['public']['Tables']['actions']['Insert']

// Use the generated types for form data
type ActionForm = Omit<ActionInsert, 'id' | 'created_at' | 'updated_at' | 'contact_id' | 'source' | 'metadata'>

export function useActions() {
  const [actions, setActions] = useState<Action[]>([])
  const [loading, setLoading] = useState(true)

  const fetchActions = async () => {
    try {
      const { data, error } = await supabase.from('actions').select('*').order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching actions:', error)
        return
      }

      setActions(data || [])
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
      const completedDate = newStatus === 'completed' ? new Date().toISOString() : null

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

  // Helper functions for filtering
  const getPlannedActions = () =>
    actions.filter((action) => action.status && ['planned', 'overdue'].includes(action.status))
  const getCompletedActions = () => actions.filter((action) => action.status === 'completed')
  const getOverdueActions = () =>
    actions.filter(
      (action) => action.status === 'planned' && action.start_date && new Date(action.start_date) < new Date()
    )

  // Helper function to get display date
  const getDisplayDate = (action: Action) => {
    if (action.completed_date) {
      return action.completed_date // When it happened
    } else if (action.start_date) {
      return action.start_date // When it's planned
    }
    return action.created_at // Fallback
  }

  // Helper function to get effective status
  const getEffectiveStatus = (action: Action) => {
    if (action.status === 'completed') return 'completed'
    if (action.status === 'cancelled') return 'cancelled'
    if (action.status === 'in_progress') return 'in_progress'

    // For planned actions, check if overdue
    if (action.status === 'planned' && action.start_date && new Date(action.start_date) < new Date()) {
      return 'overdue'
    }

    return 'planned'
  }

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
    getPlannedActions,
    getCompletedActions,
    getOverdueActions,
    getDisplayDate,
    getEffectiveStatus,
  }
}
