import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Reminder = Database['public']['Tables']['reminders']['Row']

interface ReminderForm {
  title: string
  description: string
  reminder_date: string
  priority: 'low' | 'medium' | 'high'
}

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)

  const fetchReminders = async () => {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .order('reminder_date', { ascending: true })
      
      if (error) {
        console.error('Error fetching reminders:', error)
        return
      }
      
      setReminders(data || [])
    } catch (error) {
      console.error('Error fetching reminders:', error)
    } finally {
      setLoading(false)
    }
  }

  const createReminder = async (contactId: string, reminderData: ReminderForm) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .insert({
          contact_id: contactId,
          title: reminderData.title,
          description: reminderData.description,
          reminder_date: reminderData.reminder_date,
          priority: reminderData.priority
        })

      if (error) {
        console.error('Error creating reminder:', error)
        return false
      }

      await fetchReminders()
      return true
    } catch (error) {
      console.error('Error creating reminder:', error)
      return false
    }
  }

  const updateReminder = async (reminderId: string, reminderData: ReminderForm) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({
          title: reminderData.title,
          description: reminderData.description,
          reminder_date: reminderData.reminder_date,
          priority: reminderData.priority
        })
        .eq('id', reminderId)

      if (error) {
        console.error('Error updating reminder:', error)
        return false
      }

      await fetchReminders()
      return true
    } catch (error) {
      console.error('Error updating reminder:', error)
      return false
    }
  }

  const deleteReminder = async (reminderId: string) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', reminderId)

      if (error) {
        console.error('Error deleting reminder:', error)
        return false
      }

      await fetchReminders()
      return true
    } catch (error) {
      console.error('Error deleting reminder:', error)
      return false
    }
  }

  const toggleReminderComplete = async (reminder: Reminder) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({ 
          is_complete: !reminder.is_complete,
          completed_date: !reminder.is_complete ? new Date().toISOString() : null
        })
        .eq('id', reminder.id)

      if (error) {
        console.error('Error updating reminder:', error)
        return false
      }

      await fetchReminders()
      return true
    } catch (error) {
      console.error('Error updating reminder:', error)
      return false
    }
  }

  useEffect(() => {
    fetchReminders()
  }, [])

  return {
    reminders,
    loading,
    fetchReminders,
    createReminder,
    updateReminder,
    deleteReminder,
    toggleReminderComplete
  }
} 
