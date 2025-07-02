// NOTE: This system uses date-only, timezone-less dates in the client UI (e.g., YYYY-MM-DD strings from <input type="date">),
// but the database tables currently use date-time fields (with timezone). This means that care must be taken to avoid
// time zone conversion issues when displaying or storing dates. All date displays in this component use the raw date string
// (YYYY-MM-DD) to ensure consistency with user input and avoid time zone shifts.

import React from 'react'
import { Edit, Trash2, Check, X, Clock, AlertCircle, Calendar, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { Database } from '@/lib/supabase'

// Helper to format YYYY-MM-DD as YYYY-MM-DD (strip time if present)
function formatDateString(dateString: string | null | undefined) {
  if (!dateString) return ''
  return dateString.split('T')[0]
}

type Reminder = Database['public']['Tables']['reminders']['Row']

interface ReminderCardProps {
  reminder: Reminder
  contactName: string
  index: number
  onToggleComplete: (reminder: Reminder) => void
  onEdit: (reminder: Reminder) => void
  onDelete: (reminderId: string) => void
  onSelectContact?: (contactId: string) => void
}

function getPriorityBadge(priority: string) {
  const variants = {
    high: { variant: 'destructive' as const, icon: AlertCircle, className: 'bg-red-100 text-red-800 border-red-200' },
    medium: { variant: 'default' as const, icon: Clock, className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    low: { variant: 'secondary' as const, icon: Calendar, className: 'bg-green-100 text-green-800 border-green-200' }
  }
  
  const config = variants[priority as keyof typeof variants] || variants.medium
  const Icon = config.icon
  
  return (
    <Badge 
      variant={config.variant} 
      className={`text-xs font-medium px-2 py-1 border ${config.className}`}
    >
      <Icon className="h-3 w-3 mr-1" />
      {priority}
    </Badge>
  )
}

function ymdNumberUTC(date: Date) {
  return date.getUTCFullYear() * 10000 + (date.getUTCMonth() + 1) * 100 + date.getUTCDate();
}

function getStatusIndicator(reminder: Reminder) {
  const now = new Date();
  const reminderDate = new Date(reminder.reminder_date);

  const dueNum = ymdNumberUTC(reminderDate);
  const todayNum = ymdNumberUTC(now);

  const isOverdue = !reminder.is_complete && dueNum < todayNum;
  const isToday = dueNum === todayNum;
  const isUpcoming = dueNum > todayNum && dueNum - todayNum === 1;

  if (reminder.is_complete) {
    return {
      icon: Check,
      className: 'text-green-600 bg-green-50 border-green-200',
      text: 'Completed'
    }
  }

  if (isOverdue) {
    return {
      icon: AlertCircle,
      className: 'text-red-600 bg-red-50 border-red-200',
      text: 'Overdue'
    }
  }

  if (isToday) {
    return {
      icon: Clock,
      className: 'text-orange-600 bg-orange-50 border-orange-200',
      text: 'Due Today'
    }
  }

  if (isUpcoming) {
    return {
      icon: Clock,
      className: 'text-blue-600 bg-blue-50 border-blue-200',
      text: 'Due Soon'
    }
  }

  return {
    icon: Calendar,
    className: 'text-gray-600 bg-gray-50 border-gray-200',
    text: 'Upcoming'
  }
}

export default function ReminderCard({
  reminder,
  contactName,
  index,
  onToggleComplete,
  onEdit,
  onDelete,
  onSelectContact
}: ReminderCardProps) {
  const statusIndicator = getStatusIndicator(reminder)
  const StatusIcon = statusIndicator.icon

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${
      reminder.is_complete ? 'opacity-75 bg-gray-50' : ''
    }`}>
      <CardContent className="p-4">
        {/* Header with contact info and status */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <User className="h-3 w-3" />
            {onSelectContact ? (
              <button
                onClick={() => onSelectContact(reminder.contact_id)}
                className="font-medium hover:text-primary hover:underline cursor-pointer transition-colors"
                aria-label={`Select contact ${contactName}`}
              >
                {contactName}
              </button>
            ) : (
              <span className="font-medium">{contactName}</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Badge 
              variant="outline" 
              className={`text-xs px-2 py-1 border ${statusIndicator.className}`}
            >
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusIndicator.text}
            </Badge>
            {getPriorityBadge(reminder.priority)}
            <span className="text-xs text-muted-foreground font-medium">#{index}</span>
          </div>
        </div>

        {/* Main content */}
        <div className="space-y-3">
          {/* Title and description */}
          <div>
            <h4 className={`font-semibold text-base leading-tight ${
              reminder.is_complete ? 'line-through text-muted-foreground' : 'text-foreground'
            }`}>
              {reminder.title}
            </h4>
            {reminder.description && (
              <p className={`text-sm mt-1 leading-relaxed ${
                reminder.is_complete ? 'text-muted-foreground' : 'text-muted-foreground'
              }`}>
                {reminder.description}
              </p>
            )}
          </div>

          {/* Date information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span className="font-medium">Due:</span>
              <span>{formatDateString(reminder.reminder_date)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span className="font-medium">Created:</span>
              <span>{formatDateString(reminder.created_at)}</span>
            </div>
            {reminder.updated_at !== reminder.created_at && (
              <div className="flex items-center space-x-1 sm:col-span-2">
                <Clock className="h-3 w-3" />
                <span className="font-medium">Updated:</span>
                <span>{formatDateString(reminder.updated_at)}</span>
              </div>
            )}
            {reminder.completed_date && (
              <div className="flex items-center space-x-1 sm:col-span-2">
                <Check className="h-3 w-3" />
                <span className="font-medium">Completed:</span>
                <span>{formatDateString(reminder.completed_date)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer with badges and action buttons */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          {/* Badges on the left */}
          <div className="flex items-center space-x-1">
            {reminder.reminder_type && reminder.reminder_type.split(' ').filter(Boolean).map((badge, badgeIndex) => (
              <Badge 
                key={badgeIndex}
                variant="outline" 
                className="text-xs px-2 py-1 border bg-blue-50 text-blue-700 border-blue-200"
              >
                {badge}
              </Badge>
            ))}
          </div>
          
          {/* Action buttons on the right */}
          <div className="flex items-center space-x-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleComplete(reminder)}
                  className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
                  aria-label={reminder.is_complete ? 'Mark as incomplete' : 'Mark as complete'}
                >
                  {reminder.is_complete ? (
                    <X className="h-4 w-4" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {reminder.is_complete ? 'Mark as incomplete' : 'Mark as complete'}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(reminder)}
                  className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                  aria-label="Edit reminder"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit reminder</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(reminder.id)}
                  className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                  aria-label="Delete reminder"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete reminder</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 
