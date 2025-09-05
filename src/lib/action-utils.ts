import type { Database } from '@/lib/supabase'

type Action = Database['public']['Tables']['actions']['Row']

/**
 * Get the display date for an action based on priority:
 * 1. completed_date - When the action was actually completed
 * 2. end_date - When the action is due
 * 3. created_at - When the action was created (fallback)
 */
export function getDisplayDate(action: Action): string {
  if (action.end_date) {
    return action.end_date // When it ended
  } else if (action.start_date) {
    return action.start_date // When it started
  } else if (action.completed_date) {
    return action.completed_date // When it was completed
  }
  return action.created_at // Fallback
}

/**
 * Get the effective status for an action, including overdue detection
 */
export function getEffectiveStatus(action: Action): string {
  if (action.status === 'completed') return 'completed'
  if (action.status === 'cancelled') return 'cancelled'
  if (action.status === 'in_progress') return 'in_progress'

  // For planned actions, check if overdue
  if (action.status === 'planned' && action.start_date && new Date(action.start_date) < new Date()) {
    return 'overdue'
  }

  return 'planned'
}
