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
import { formatTimeDelta } from '@/lib/utils'
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
    low: { variant: 'secondary' as const, icon: Calendar, className: 'bg-green-100 text-green-800 border-green-200' },
  }

  const config = variants[priority as keyof typeof variants] || variants.medium
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className={`border px-2 py-1 text-xs font-medium ${config.className}`}>
      <Icon className="mr-1 h-3 w-3" />
      {priority}
    </Badge>
  )
}

function ymdNumberUTC(date: Date) {
  return date.getUTCFullYear() * 10000 + (date.getUTCMonth() + 1) * 100 + date.getUTCDate()
}

function getStatusIndicator(reminder: Reminder) {
  const now = new Date()
  const reminderDate = new Date(reminder.reminder_date)

  const dueNum = ymdNumberUTC(reminderDate)
  const todayNum = ymdNumberUTC(now)

  const isOverdue = !reminder.is_complete && dueNum < todayNum
  const isToday = dueNum === todayNum
  const isUpcoming = dueNum > todayNum && dueNum - todayNum === 1

  // Calculate days difference for all reminders
  const getDaysDifference = () => {
    const diffTime = reminderDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysDiff = getDaysDifference()

  if (reminder.is_complete) {
    // Calculate days since completion
    const completedDate = reminder.completed_date ? new Date(reminder.completed_date) : now
    const completedDiffTime = now.getTime() - completedDate.getTime()
    const completedDiffDays = Math.ceil(completedDiffTime / (1000 * 60 * 60 * 24))

    return {
      icon: Check,
      className:
        'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800',
      text: 'Completed',
      daysDiff: completedDiffDays,
    }
  }

  if (isOverdue) {
    return {
      icon: AlertCircle,
      className: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800',
      text: 'Overdue',
      daysDiff,
    }
  }

  if (isToday) {
    return {
      icon: Clock,
      className:
        'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800',
      text: 'Due Today',
      daysDiff: 0,
    }
  }

  if (isUpcoming) {
    return {
      icon: Clock,
      className: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800',
      text: 'Due Soon',
      daysDiff,
    }
  }

  return {
    icon: Calendar,
    className: 'text-muted-foreground bg-muted/50 border-border',
    text: 'Upcoming',
    daysDiff,
  }
}

export default function ReminderCard({
  reminder,
  contactName,
  index,
  onToggleComplete,
  onEdit,
  onDelete,
  onSelectContact,
}: ReminderCardProps) {
  const statusIndicator = getStatusIndicator(reminder)
  const StatusIcon = statusIndicator.icon

  return (
    <Card
      className={`transition-all duration-200 hover:shadow-md ${reminder.is_complete ? 'bg-muted/50 opacity-75' : ''}`}
    >
      <CardContent className="p-4">
        {/* Header with contact info and status */}
        <div className="mb-3 flex items-start justify-between">
          <div className="text-muted-foreground flex items-center space-x-1 text-sm">
            <User className="h-3 w-3" />
            {onSelectContact ? (
              <button
                onClick={() => onSelectContact(reminder.contact_id)}
                className="hover:text-primary cursor-pointer font-medium transition-colors hover:underline"
                aria-label={`Select contact ${contactName}`}
              >
                {contactName}
              </button>
            ) : (
              <span className="font-medium">{contactName}</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {statusIndicator.daysDiff !== null && (
              <span className="text-muted-foreground text-xs font-bold">
                {formatTimeDelta(statusIndicator.daysDiff, reminder.is_complete)}
              </span>
            )}
            <Badge variant="outline" className={`border px-2 py-1 text-xs ${statusIndicator.className}`}>
              <StatusIcon className="mr-1 h-3 w-3" />
              {statusIndicator.text}
            </Badge>
            {getPriorityBadge(reminder.priority)}
            <span className="text-muted-foreground text-xs font-medium">#{index}</span>
          </div>
        </div>

        {/* Main content */}
        <div className="space-y-3">
          {/* Title and description */}
          <div>
            <h4
              className={`text-base leading-tight font-semibold ${
                reminder.is_complete ? 'text-muted-foreground line-through' : 'text-foreground'
              }`}
            >
              {reminder.title}
            </h4>
            {reminder.description && (
              <p
                className={`mt-1 text-sm leading-relaxed ${
                  reminder.is_complete ? 'text-muted-foreground' : 'text-muted-foreground'
                }`}
              >
                {reminder.description}
              </p>
            )}
          </div>

          {/* Date information */}
          <div className="text-muted-foreground grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
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
        <div className="mt-4 flex items-center justify-between border-t pt-3">
          {/* Badges on the left */}
          <div className="flex items-center space-x-1">
            {reminder.reminder_type &&
              reminder.reminder_type
                .split(' ')
                .filter(Boolean)
                .map((badge, badgeIndex) => (
                  <Badge
                    key={badgeIndex}
                    variant="outline"
                    className="border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-400"
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
                  className="h-8 w-8 cursor-pointer p-0 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950/50 dark:hover:text-green-400"
                  aria-label={reminder.is_complete ? 'Mark as incomplete' : 'Mark as complete'}
                >
                  {reminder.is_complete ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{reminder.is_complete ? 'Mark as incomplete' : 'Mark as complete'}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(reminder)}
                  className="h-8 w-8 cursor-pointer p-0 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/50 dark:hover:text-blue-400"
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
                  className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400"
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
