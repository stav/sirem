import React from 'react'
import { Label } from '@/components/ui/label'
import ModalForm from '@/components/ui/modal-form'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  Clock,
  User,
  Tag,
  Activity,
  AlertTriangle,
  Check,
  Database as DatabaseIcon,
  ExternalLink,
} from 'lucide-react'
import type { Database } from '@/lib/supabase'
import { formatDateTime } from '@/lib/utils'

type Action = Database['public']['Tables']['actions']['Row']

interface ActionViewModalProps {
  isOpen: boolean
  onClose: () => void
  action: Action | null
  contactName: string
}

// Helper to format datetime string for display
function formatDateTimeString(dateString: string | null | undefined) {
  if (!dateString) return 'Not set'
  return formatDateTime(dateString)
}

function getStatusDisplay(status: string | null) {
  switch (status) {
    case 'in_progress':
      return {
        text: 'In Progress',
        className:
          'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800',
      }
    case 'cancelled':
      return { text: 'Cancelled', className: 'text-muted-foreground bg-muted border-border' }
    case 'completed':
      return {
        text: 'Completed',
        className:
          'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800',
      }
    default:
      return { text: status || 'No Status', className: 'text-muted-foreground bg-muted/50 border-border' }
  }
}

function getPriorityDisplay(priority: string | null) {
  switch (priority) {
    case 'high':
      return {
        text: 'High',
        className: 'bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800',
      }
    case 'medium':
      return {
        text: 'Medium',
        className:
          'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
      }
    case 'low':
      return {
        text: 'Low',
        className:
          'bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800',
      }
    default:
      return { text: 'None', className: 'bg-muted text-muted-foreground border-border' }
  }
}

export default function ActionViewModal({ isOpen, onClose, action, contactName }: ActionViewModalProps) {
  if (!action) return null

  const statusDisplay = getStatusDisplay(action.status)
  const priorityDisplay = getPriorityDisplay(action.priority)

  return (
    <ModalForm
      isOpen={isOpen}
      onCancel={onClose}
      onSubmit={(e) => {
        e.preventDefault()
        onClose()
      }}
      title="View Action"
      submitText=""
      isLoading={false}
    >
      <div className="space-y-4">
        {/* Title */}
        <div>
          <Label className="text-muted-foreground text-sm font-medium">Title</Label>
          <p className="mt-1 text-base font-semibold">{action.title}</p>
        </div>

        {/* Description */}
        <div>
          <Label className="text-muted-foreground text-sm font-medium">Description</Label>
          <p className="mt-1 text-sm whitespace-pre-wrap">{action.description || 'No description'}</p>
        </div>

        {/* Outcome */}
        <div>
          <Label className="text-muted-foreground text-sm font-medium">Outcome</Label>
          <p className="mt-1 text-sm whitespace-pre-wrap">{action.outcome || 'No outcome'}</p>
        </div>

        {/* Contact */}
        <div>
          <Label className="text-muted-foreground text-sm font-medium">Contact</Label>
          <div className="mt-1 flex items-center space-x-2">
            <User className="text-muted-foreground h-4 w-4" />
            <span className="text-sm">{contactName}</span>
          </div>
        </div>

        {/* Status and Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground text-sm font-medium">Status</Label>
            <div className="mt-1">
              <Badge className={`${statusDisplay.className}`}>
                <Activity className="mr-1 h-3 w-3" />
                {statusDisplay.text}
              </Badge>
            </div>
          </div>
          <div>
            <Label className="text-muted-foreground text-sm font-medium">Priority</Label>
            <div className="mt-1">
              <Badge className={`${priorityDisplay.className}`}>
                <AlertTriangle className="mr-1 h-3 w-3" />
                {priorityDisplay.text}
              </Badge>
            </div>
          </div>
        </div>

        {/* Duration */}
        <div>
          <Label className="text-muted-foreground text-sm font-medium">Duration</Label>
          <p className="mt-1 text-sm">{action.duration ? `${action.duration} hours` : 'No duration set'}</p>
        </div>

        {/* Dates */}
        <div className="space-y-3">
          <Label className="text-muted-foreground text-sm font-medium">Dates</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Calendar className="text-muted-foreground h-4 w-4" />
              <span className="text-sm font-medium">Start:</span>
              <span className="text-sm">{formatDateTimeString(action.start_date)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="text-muted-foreground h-4 w-4" />
              <span className="text-sm font-medium">End:</span>
              <span className="text-sm">{formatDateTimeString(action.end_date)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="text-muted-foreground h-4 w-4" />
              <span className="text-sm font-medium">Completed:</span>
              <span className="text-sm">{formatDateTimeString(action.completed_date)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="text-muted-foreground h-4 w-4" />
              <span className="text-sm font-medium">Created:</span>
              <span className="text-sm">{formatDateTimeString(action.created_at)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="text-muted-foreground h-4 w-4" />
              <span className="text-sm font-medium">Updated:</span>
              <span className="text-sm">{formatDateTimeString(action.updated_at)}</span>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div>
          <Label className="text-muted-foreground text-sm font-medium">Tags</Label>
          <div className="mt-2 flex flex-wrap gap-1">
            {action.tags ? (
              action.tags.split(' ').map((tag: string, i: number) => (
                <Badge key={i} variant="outline" className="text-xs">
                  <Tag className="mr-1 h-3 w-3" />
                  {tag}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground text-sm">No tags</span>
            )}
          </div>
        </div>

        {/* Source */}
        <div>
          <Label className="text-muted-foreground text-sm font-medium">Source</Label>
          <div className="mt-1 flex items-center space-x-2">
            <ExternalLink className="text-muted-foreground h-4 w-4" />
            <span className="text-sm">{action.source || 'No source'}</span>
          </div>
        </div>

        {/* Metadata */}
        <div>
          <Label className="text-muted-foreground text-sm font-medium">Metadata</Label>
          <div className="mt-1 flex items-center space-x-2">
            <DatabaseIcon className="text-muted-foreground h-4 w-4" />
            <pre className="text-muted-foreground max-h-32 overflow-auto text-xs">
              {action.metadata ? JSON.stringify(action.metadata, null, 2) : 'No metadata'}
            </pre>
          </div>
        </div>

        {/* ID */}
        <div>
          <Label className="text-muted-foreground text-sm font-medium">Action ID</Label>
          <p className="text-muted-foreground mt-1 font-mono text-sm">{action.id}</p>
        </div>
      </div>
    </ModalForm>
  )
}
