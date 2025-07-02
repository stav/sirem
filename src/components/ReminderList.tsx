import React from 'react'
import { Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import ReminderCard from './ReminderCard'
import type { Database } from '@/lib/supabase'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type Contact = Database['public']['Tables']['contacts']['Row']
type Reminder = Database['public']['Tables']['reminders']['Row']

interface ReminderListProps {
  reminders: Reminder[]
  contacts: Contact[]
  selectedContact: Contact | null
  onAddReminder: () => void
  onToggleComplete: (reminder: Reminder) => void
  onEditReminder: (reminder: Reminder) => void
  onDeleteReminder: (reminderId: string) => void
  showCompletedReminders: boolean
  onToggleShowCompleted: () => void
  onSelectContact?: (contactId: string) => void
}

export default function ReminderList({
  reminders,
  contacts,
  selectedContact,
  onAddReminder,
  onToggleComplete,
  onEditReminder,
  onDeleteReminder,
  showCompletedReminders,
  onToggleShowCompleted,
  onSelectContact
}: ReminderListProps) {
  // Always filter reminders based on toggle, for both main and contact views
  let displayReminders = reminders;
  if (selectedContact) {
    displayReminders = displayReminders.filter(r => String(r.contact_id) === String(selectedContact.id));
  }
  if (!showCompletedReminders) {
    displayReminders = displayReminders.filter(r => !Boolean(r.is_complete));
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-h-9">
            <CardTitle>
              Reminders
              {selectedContact && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  for {selectedContact.first_name} {selectedContact.last_name}
                </span>
              )}
            </CardTitle>
            <div className="flex items-center space-x-2 ml-2 cursor-pointer">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center space-x-2">
                    <Switch
                      checked={showCompletedReminders}
                      onCheckedChange={onToggleShowCompleted}
                      id="show-completed-switch"
                    />
                    {showCompletedReminders && (
                      <label htmlFor="show-completed-switch" className="text-sm cursor-pointer">
                        Show all
                      </label>
                    )}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  Show all reminders.
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
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
        {(!selectedContact && displayReminders.length === 0) ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No displayReminders yet</p>
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
            {displayReminders
              .slice()
              .sort((a, b) => new Date(a.reminder_date).getTime() - new Date(b.reminder_date).getTime())
              .map((reminder, index) => (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  contactName={`${contacts.find(c => c.id === reminder.contact_id)?.first_name} ${contacts.find(c => c.id === reminder.contact_id)?.last_name}`}
                  index={index + 1}
                  onToggleComplete={onToggleComplete}
                  onEdit={onEditReminder}
                  onDelete={onDeleteReminder}
                  onSelectContact={onSelectContact}
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
            {displayReminders.map((reminder, index) => {
              let contactName = 'Unknown Contact';
              if (contacts && contacts.length > 0) {
                const found = contacts.find(c => String(c.id).trim() === String(reminder.contact_id).trim());
                if (found) {
                  contactName = `${found.first_name} ${found.last_name}`;
                }
              }
              return (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  contactName={contactName}
                  index={index + 1}
                  onToggleComplete={onToggleComplete}
                  onEdit={onEditReminder}
                  onDelete={onDeleteReminder}
                  onSelectContact={onSelectContact}
                />
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 
