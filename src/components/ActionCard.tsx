// NOTE: This system uses datetime inputs in the client UI (e.g., YYYY-MM-DDTHH:MM strings from <input type="datetime-local">),
// and stores them as ISO datetime strings in the database. All times are handled in the user's local timezone without
// timezone conversion to keep the implementation simple. The database uses timestamp with time zone fields but we treat
// all times as local time.

import React, { useMemo } from 'react'
import {
  Edit,
  Trash2,
  Check,
  Clock,
  Calendar,
  User,
  Tag,
  HelpCircle,
  Activity,
  AlertTriangle,
  Minus,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

import type { Database } from '@/lib/supabase'
import { getDisplayDate } from '@/lib/action-utils'
import { formatDateTime } from '@/lib/utils'

// Helper to format datetime string for display
function formatDateTimeString(dateString: string | null | undefined) {
  return formatDateTime(dateString)
}

type Action = Database['public']['Tables']['actions']['Row']

interface ActionCardProps {
  action: Action
  contactName: string
  index: number
  onToggleComplete: (action: Action) => void
  onEdit: (action: Action) => void
  onView: (action: Action) => void
  onDelete: (actionId: string) => void
  onSelectContact?: (contactId: string) => void
}

function getStatusIndicator(action: Action) {
  const now = new Date()
  const displayDate = new Date(getDisplayDate(action))
  const status = action.status

  const getDaysDifference = () => {
    // Get the date components (ignoring time) for both dates
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const displayDateOnly = new Date(displayDate.getFullYear(), displayDate.getMonth(), displayDate.getDate())

    const diffTime = displayDateOnly.getTime() - nowDate.getTime()
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }
  const daysDiff = getDaysDifference()

  // If completed, always gray
  const isCompleted = !!action.completed_date
  let overdueLevel: 'future' | 'orange' | 'red' | 'gray' | 'today' = 'future'
  if (isCompleted) overdueLevel = 'gray'
  else if (daysDiff === 0) overdueLevel = 'today'
  else if (daysDiff < 0 && daysDiff >= -6) overdueLevel = 'orange'
  else if (daysDiff <= -7) overdueLevel = 'red'

  const isPending = daysDiff >= 0

  return {
    icon: HelpCircle,
    className: 'text-accent border-blue-200 dark:border-blue-800',
    text: status || 'No Status',
    daysDiff,
    isPending,
    overdueLevel,
  }
}

function getPriorityColor(priority: string | null) {
  switch (priority) {
    case 'high':
      return 'bg-destructive text-destructive-foreground border-destructive/50 dark:border-destructive/30'
    case 'medium':
      return 'bg-accent text-accent-foreground border-accent/50 dark:border-accent/30'
    case 'low':
      return 'bg-secondary text-secondary-foreground border-secondary/50 dark:border-secondary/30'
    default:
      return 'bg-muted text-muted-foreground border-border'
  }
}

const ActionCard = React.memo(function ActionCard({
  action,
  contactName,
  index,
  onToggleComplete,
  onEdit,
  onView,
  onDelete,
  onSelectContact,
}: ActionCardProps) {
  // Memoize expensive status calculations to prevent re-computation on every render
  const statusIndicator = useMemo(() => getStatusIndicator(action), [action])

  const daysDiffText = useMemo(() => {
    if (statusIndicator.daysDiff === 0) return 'Today'
    if (statusIndicator.daysDiff === -1) return 'yesterday'
    if (statusIndicator.daysDiff > 0) {
      return `in ${statusIndicator.daysDiff} day${statusIndicator.daysDiff === 1 ? '' : 's'}`
    }
    return `${Math.abs(statusIndicator.daysDiff)} day${Math.abs(statusIndicator.daysDiff) === 1 ? '' : 's'} ago`
  }, [statusIndicator.daysDiff])

  // Memoize priority color calculation
  const priorityColor = useMemo(() => getPriorityColor(action.priority), [action.priority])

  // Memoize display date to avoid repeated calls to getDisplayDate
  const displayDate = useMemo(() => getDisplayDate(action), [action])

  return (
    <Card
      className={`border-l-4 ${statusIndicator.className} transition-all
      ${statusIndicator.overdueLevel === 'future' ? 'bg-primary/10 hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30' : ''}
      ${statusIndicator.overdueLevel === 'today' ? 'bg-accent/50 hover:bg-accent/70 dark:bg-accent/30 dark:hover:bg-accent/50' : ''}
      ${statusIndicator.overdueLevel === 'orange' ? 'bg-accent/50 hover:bg-accent/70 dark:bg-accent/30 dark:hover:bg-accent/50' : ''}
      ${statusIndicator.overdueLevel === 'red' ? 'bg-destructive/10 hover:bg-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30' : ''}
      ${statusIndicator.overdueLevel === 'gray' ? 'bg-muted/50 hover:bg-muted/70' : ''}
      ${!['future', 'today', 'orange', 'red', 'gray'].includes(statusIndicator.overdueLevel) ? 'bg-card' : ''}
    `}
    >
      <CardContent className="p-4">
        {/* Top Row: Contact (left), Badges (right) */}
        <div className="mb-2 flex items-start justify-between">
          {/* Contact (top left) */}
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            {onSelectContact ? (
              <button onClick={() => onSelectContact(action.contact_id)} className="cursor-pointer hover:underline">
                {contactName}
              </button>
            ) : (
              <span>{contactName}</span>
            )}
          </div>
          {/* Badges (top right) */}
          <div className="flex items-center space-x-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help text-xs text-muted-foreground">{daysDiffText}</span>
              </TooltipTrigger>
              <TooltipContent>{formatDateTimeString(displayDate)}</TooltipContent>
            </Tooltip>
            {action.status && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className={`${statusIndicator.className} cursor-help hover:bg-opacity-100`}>
                    <Activity className="mr-1 inline h-3 w-3" />
                    {statusIndicator.text}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>Status</TooltipContent>
              </Tooltip>
            )}
            {action.priority && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className={`${priorityColor} cursor-help hover:bg-opacity-100`}>
                    <AlertTriangle className="mr-1 inline h-3 w-3" />
                    {action.priority}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>Priority</TooltipContent>
              </Tooltip>
            )}
            <span className="text-xs text-muted-foreground">#{index}</span>
          </div>
        </div>

        {/* Main Content: Title & Description */}
        <div className="mt-2">
          <h4 className={`text-base font-semibold leading-tight text-foreground`}>{action.title}</h4>
          {action.description && <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>}
        </div>

        {/* Dates */}
        <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-2">
          {action.start_date && (
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span className="font-medium">Start:</span>
              <span>{formatDateTimeString(action.start_date)}</span>
            </div>
          )}
          {action.completed_date && (
            <div className="flex items-center space-x-1">
              <Check className="h-3 w-3" />
              <span className="font-medium">Completed:</span>
              <span>{formatDateTimeString(action.completed_date)}</span>
            </div>
          )}
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span className="font-medium">Created:</span>
            <span>{formatDateTimeString(action.created_at)}</span>
          </div>
          {action.updated_at !== action.created_at && (
            <div className="flex items-center space-x-1 sm:col-span-2">
              <Clock className="h-3 w-3" />
              <span className="font-medium">Updated:</span>
              <span>{formatDateTimeString(action.updated_at)}</span>
            </div>
          )}
          {action.end_date && (
            <div className="flex items-center space-x-1 sm:col-span-2">
              <Calendar className="h-3 w-3" />
              <span className="font-medium">End:</span>
              <span>{formatDateTimeString(action.end_date)}</span>
            </div>
          )}
        </div>

        {/* Outcome */}
        {action.outcome && (
          <div className="mt-2 rounded-md bg-primary/10 p-2 dark:bg-primary/20">
            <p className="text-sm text-primary dark:text-primary">
              <span className="font-medium">Outcome:</span> {action.outcome}
            </p>
          </div>
        )}

        {/* Bottom Row: Tags (left), Action Buttons (right) */}
        <div className="mt-4 flex items-end justify-between">
          {/* Tags (bottom left) */}
          <div className="flex flex-wrap gap-1">
            {action.tags &&
              action.tags.split(' ').map((tag, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  <Tag className="mr-1 h-3 w-3" />
                  {tag}
                </Badge>
              ))}
          </div>
          {/* Action buttons (bottom right) */}
          <div className="flex items-center space-x-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleComplete(action)}
                  className={`h-8 w-8 cursor-pointer p-0 text-foreground/70 dark:text-foreground/80 ${
                    action.completed_date
                      ? 'hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/20 dark:hover:text-destructive'
                      : 'hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-primary'
                  }`}
                  aria-label={action.completed_date ? 'Mark as incomplete' : 'Mark as complete'}
                >
                  {action.completed_date ? <Minus className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{action.completed_date ? 'Mark as incomplete' : 'Mark as complete'}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onView(action)}
                  className="h-8 w-8 cursor-pointer p-0 text-foreground/70 hover:bg-muted hover:text-foreground dark:text-foreground/80"
                  aria-label="View action"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View action</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(action)}
                  className="h-8 w-8 cursor-pointer p-0 text-foreground/70 hover:bg-primary/10 hover:text-primary dark:text-foreground/80 dark:hover:bg-primary/20 dark:hover:text-primary"
                  aria-label="Edit action"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit action</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(action.id)}
                  className="h-8 w-8 p-0 text-foreground/70 hover:bg-destructive/10 hover:text-destructive dark:text-foreground/80 dark:hover:bg-destructive/20 dark:hover:text-destructive"
                  aria-label="Delete action"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete action</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

export default ActionCard
