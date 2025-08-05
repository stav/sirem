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
      return { text: 'In Progress', className: 'text-blue-600 bg-blue-50 border-blue-200' }
    case 'cancelled':
      return { text: 'Cancelled', className: 'text-gray-400 bg-gray-100 border-gray-200' }
    case 'completed':
      return { text: 'Completed', className: 'text-green-600 bg-green-50 border-green-200' }
    default:
      return { text: status || 'No Status', className: 'text-gray-600 bg-gray-50 border-gray-200' }
  }
}

function getPriorityDisplay(priority: string | null) {
  switch (priority) {
    case 'high':
      return { text: 'High', className: 'bg-red-100 text-red-800 border-red-200' }
    case 'medium':
      return { text: 'Medium', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
    case 'low':
      return { text: 'Low', className: 'bg-green-100 text-green-800 border-green-200' }
    default:
      return { text: 'None', className: 'bg-gray-100 text-gray-800 border-gray-200' }
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
          <Label className="text-sm font-medium text-muted-foreground">Title</Label>
          <p className="mt-1 text-base font-semibold">{action.title}</p>
        </div>

        {/* Description */}
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Description</Label>
          <p className="mt-1 whitespace-pre-wrap text-sm">{action.description || 'No description'}</p>
        </div>

        {/* Outcome */}
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Outcome</Label>
          <p className="mt-1 whitespace-pre-wrap text-sm">{action.outcome || 'No outcome'}</p>
        </div>

        {/* Contact */}
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Contact</Label>
          <div className="mt-1 flex items-center space-x-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{contactName}</span>
          </div>
        </div>

        {/* Status and Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Status</Label>
            <div className="mt-1">
              <Badge className={`${statusDisplay.className}`}>
                <Activity className="mr-1 h-3 w-3" />
                {statusDisplay.text}
              </Badge>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Priority</Label>
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
          <Label className="text-sm font-medium text-muted-foreground">Duration</Label>
          <p className="mt-1 text-sm">{action.duration ? `${action.duration} hours` : 'No duration set'}</p>
        </div>

        {/* Dates */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-muted-foreground">Dates</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Start:</span>
              <span className="text-sm">{formatDateTimeString(action.start_date)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">End:</span>
              <span className="text-sm">{formatDateTimeString(action.end_date)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Completed:</span>
              <span className="text-sm">{formatDateTimeString(action.completed_date)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Created:</span>
              <span className="text-sm">{formatDateTimeString(action.created_at)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Updated:</span>
              <span className="text-sm">{formatDateTimeString(action.updated_at)}</span>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Tags</Label>
          <div className="mt-2 flex flex-wrap gap-1">
            {action.tags ? (
              action.tags.split(' ').map((tag: string, i: number) => (
                <Badge key={i} variant="outline" className="text-xs">
                  <Tag className="mr-1 h-3 w-3" />
                  {tag}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">No tags</span>
            )}
          </div>
        </div>

        {/* Source */}
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Source</Label>
          <div className="mt-1 flex items-center space-x-2">
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{action.source || 'No source'}</span>
          </div>
        </div>

        {/* Metadata */}
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Metadata</Label>
          <div className="mt-1 flex items-center space-x-2">
            <DatabaseIcon className="h-4 w-4 text-muted-foreground" />
            <pre className="max-h-32 overflow-auto text-xs text-muted-foreground">
              {action.metadata ? JSON.stringify(action.metadata, null, 2) : 'No metadata'}
            </pre>
          </div>
        </div>

        {/* ID */}
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Action ID</Label>
          <p className="mt-1 font-mono text-sm text-muted-foreground">{action.id}</p>
        </div>
      </div>
    </ModalForm>
  )
}
