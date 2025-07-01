import React from 'react'
import { Edit, Trash2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Database } from '@/lib/supabase'
import { formatLocalDate } from '@/lib/contact-utils'

type Reminder = Database['public']['Tables']['reminders']['Row']

interface ReminderCardProps {
  reminder: Reminder
  contactName: string
  index: number
  onToggleComplete: (reminder: Reminder) => void
  onEdit: (reminder: Reminder) => void
  onDelete: (reminderId: string) => void
}

function getPriorityBadge(priority: string) {
  const variant = priority === 'high' ? 'destructive' : 
                  priority === 'medium' ? 'default' : 'secondary'
  
  return (
    <Badge variant={variant} className="text-xs">
      {priority}
    </Badge>
  )
}

export default function ReminderCard({
  reminder,
  contactName,
  index,
  onToggleComplete,
  onEdit,
  onDelete
}: ReminderCardProps) {
  return (
    <div className="p-4 border rounded-lg">
      <div className="text-xs text-muted-foreground mb-1">
        <span className="text-sm font-medium">{index}.</span> {contactName}
      </div>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h4 className={`font-medium ${reminder.is_complete ? 'line-through text-muted-foreground' : ''}`}>
              {reminder.title}
            </h4>
            {getPriorityBadge(reminder.priority)}
          </div>
          {reminder.description && (
            <p className={`text-sm mt-1 ${reminder.is_complete ? 'text-muted-foreground' : ''}`}>
              {reminder.description}
            </p>
          )}
          <div className="mt-2 space-y-1">
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Due:</span> {formatLocalDate(reminder.reminder_date)}
            </div>
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Created:</span> {new Date(reminder.created_at).toLocaleDateString()} at {new Date(reminder.created_at).toLocaleTimeString()}
            </div>
            {reminder.updated_at !== reminder.created_at && (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Updated:</span> {new Date(reminder.updated_at).toLocaleDateString()} at {new Date(reminder.updated_at).toLocaleTimeString()}
              </div>
            )}
            {reminder.completed_date && (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Completed:</span> {new Date(reminder.completed_date).toLocaleDateString()} at {new Date(reminder.completed_date).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleComplete(reminder)}
          >
            {reminder.is_complete ? (
              <X className="h-4 w-4" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(reminder)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(reminder.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
} 
