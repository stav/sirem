import React from 'react'
import { Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import ReminderCard from './ReminderCard'
import type { Database } from '@/lib/supabase'

type Contact = Database['public']['Tables']['contacts']['Row']
type Reminder = Database['public']['Tables']['reminders']['Row']

interface ReminderListProps {
  reminders: Reminder[]
  selectedContact: Contact | null
  onAddReminder: () => void
  onToggleComplete: (reminder: Reminder) => void
  onEditReminder: (reminder: Reminder) => void
  onDeleteReminder: (reminderId: string) => void
}

export default function ReminderList({
  reminders,
  selectedContact,
  onAddReminder,
  onToggleComplete,
  onEditReminder,
  onDeleteReminder
}: ReminderListProps) {
  // Get reminders for selected contact or all reminders if no contact selected
  const displayReminders = selectedContact 
    ? reminders.filter(r => r.contact_id === selectedContact.id)
    : reminders

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            Reminders
            {selectedContact && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                for {selectedContact.first_name} {selectedContact.last_name}
              </span>
            )}
          </CardTitle>
          {selectedContact && (
            <Button 
              onClick={onAddReminder}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Reminder
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {(!selectedContact && reminders.length === 0) ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No reminders yet</p>
            <Button 
              onClick={onAddReminder}
              className="mt-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add your first reminder
            </Button>
          </div>
        ) : !selectedContact ? (
          <div className="space-y-3">
            {reminders
              .slice()
              .sort((a, b) => new Date(a.reminder_date).getTime() - new Date(b.reminder_date).getTime())
              .map((reminder) => (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  onToggleComplete={onToggleComplete}
                  onEdit={onEditReminder}
                  onDelete={onDeleteReminder}
                />
              ))}
          </div>
        ) : displayReminders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No reminders for this contact</p>
            <Button 
              onClick={onAddReminder}
              className="mt-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add reminder
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {displayReminders.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onToggleComplete={onToggleComplete}
                onEdit={onEditReminder}
                onDelete={onDeleteReminder}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 
