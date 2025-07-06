// NOTE: This system uses date-only, timezone-less dates in the client UI (e.g., YYYY-MM-DD strings from <input type="date">),
// but the database tables currently use date-time fields (with timezone). This means that care must be taken to avoid
// time zone conversion issues when displaying or storing dates. All date displays in this component use the raw date string
// (YYYY-MM-DD) to ensure consistency with user input and avoid time zone shifts.

import React from 'react'
import {
  Edit,
  Trash2,
  Check,
  X,
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

// Helper to format YYYY-MM-DD as YYYY-MM-DD (strip time if present)
function formatDateString(dateString: string | null | undefined) {
  if (!dateString) return ''
  return dateString.split('T')[0]
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

// Helper function to get display date for an action
function getDisplayDate(action: Action) {
  if (action.completed_date) {
    return action.completed_date // When it happened
  } else if (action.end_date) {
    return action.end_date // When it's due
  }
  return action.created_at // Fallback
}

function getStatusIndicator(action: Action) {
  const now = new Date()
  const displayDate = new Date(getDisplayDate(action))
  const status = action.status

  const getDaysDifference = () => {
    const diffTime = displayDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }
  const daysDiff = getDaysDifference()

  if (status === '' || status === null) {
    return {
      icon: HelpCircle,
      className: 'text-gray-600 bg-gray-50 border-gray-200',
      text: 'No Status',
      daysDiff,
    }
  }
  if (status === 'in_progress') {
    return {
      icon: Clock,
      className: 'text-blue-600 bg-blue-50 border-blue-200',
      text: 'In Progress',
      daysDiff,
    }
  }
  if (status === 'cancelled') {
    return {
      icon: X,
      className: 'text-gray-400 bg-gray-100 border-gray-200',
      text: 'Cancelled',
      daysDiff,
    }
  }
  // fallback for any other status
  return {
    icon: HelpCircle,
    className: 'text-gray-600 bg-gray-50 border-gray-200',
    text: 'No Status',
    daysDiff,
  }
}

function getPriorityColor(priority: string | null) {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export default function ActionCard({
  action,
  contactName,
  index,
  onToggleComplete,
  onEdit,
  onView,
  onDelete,
  onSelectContact,
}: ActionCardProps) {
  const statusIndicator = getStatusIndicator(action)
  const daysDiffText =
    statusIndicator.daysDiff === 0
      ? 'Today'
      : statusIndicator.daysDiff === -1
        ? 'yesterday'
        : statusIndicator.daysDiff > 0
          ? `in ${statusIndicator.daysDiff} day${statusIndicator.daysDiff === 1 ? '' : 's'}`
          : `${Math.abs(statusIndicator.daysDiff)} day${Math.abs(statusIndicator.daysDiff) === 1 ? '' : 's'} ago`

  return (
    <Card className={`border-l-4 ${statusIndicator.className} transition-all`}>
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
              <TooltipContent>Relative time from action date to today</TooltipContent>
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
                  <Badge className={`${getPriorityColor(action.priority)} cursor-help hover:bg-opacity-100`}>
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
              <span>{formatDateString(action.start_date)}</span>
            </div>
          )}
          {action.completed_date && (
            <div className="flex items-center space-x-1">
              <Check className="h-3 w-3" />
              <span className="font-medium">Completed:</span>
              <span>{formatDateString(action.completed_date)}</span>
            </div>
          )}
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span className="font-medium">Created:</span>
            <span>{formatDateString(action.created_at)}</span>
          </div>
          {action.updated_at !== action.created_at && (
            <div className="flex items-center space-x-1 sm:col-span-2">
              <Clock className="h-3 w-3" />
              <span className="font-medium">Updated:</span>
              <span>{formatDateString(action.updated_at)}</span>
            </div>
          )}
          {action.end_date && (
            <div className="flex items-center space-x-1 sm:col-span-2">
              <Calendar className="h-3 w-3" />
              <span className="font-medium">End:</span>
              <span>{formatDateString(action.end_date)}</span>
            </div>
          )}
        </div>

        {/* Outcome */}
        {action.outcome && (
          <div className="mt-2 rounded-md bg-blue-50 p-2">
            <p className="text-sm text-blue-800">
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
                  className={`h-8 w-8 cursor-pointer p-0 ${
                    action.completed_date
                      ? 'hover:bg-red-50 hover:text-red-600'
                      : 'hover:bg-green-50 hover:text-green-600'
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
                  className="h-8 w-8 cursor-pointer p-0 hover:bg-gray-50 hover:text-gray-600"
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
                  className="h-8 w-8 cursor-pointer p-0 hover:bg-blue-50 hover:text-blue-600"
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
                  className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
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
}
