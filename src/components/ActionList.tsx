import React, { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import ActionCard from './ActionCard'
import type { Database } from '@/lib/supabase'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type Contact = Database['public']['Tables']['contacts']['Row']
type Action = Database['public']['Tables']['actions']['Row']

interface ActionListProps {
  actions: Action[]
  contacts: Contact[]
  selectedContact: Contact | null
  onAddAction: () => void
  onToggleComplete: (action: Action) => void
  onEditAction: (action: Action) => void
  onViewAction: (action: Action) => void
  onDeleteAction: (actionId: string) => void
  showCompletedActions: boolean
  onToggleShowCompleted: () => void
  onSelectContact?: (contactId: string) => void
}

export default function ActionList({
  actions,
  contacts,
  selectedContact,
  onAddAction,
  onToggleComplete,
  onEditAction,
  onViewAction,
  onDeleteAction,
  showCompletedActions,
  onToggleShowCompleted,
  onSelectContact,
}: ActionListProps) {
  const [showWeekRange, setShowWeekRange] = useState(false)

  // Load week range state from localStorage on component mount
  useEffect(() => {
    const savedState = localStorage.getItem('actionListWeekRange')
    if (savedState !== null) {
      setShowWeekRange(JSON.parse(savedState))
    }
  }, [])

  const toggleWeekRange = () => {
    const newState = !showWeekRange
    setShowWeekRange(newState)
    // Save to localStorage
    localStorage.setItem('actionListWeekRange', JSON.stringify(newState))
  }

  // Helper function to check if a date is within 1 week of today
  const isWithinWeekRange = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    return date >= oneWeekAgo && date <= oneWeekFromNow
  }

  // Helper function to get display date for an action
  const getDisplayDate = (action: Action) => {
    if (action.completed_date) {
      return action.completed_date // When it happened
    } else if (action.end_date) {
      return action.end_date // When it's due
    }
    return action.created_at // Fallback
  }

  // Always filter actions based on toggles, for both main and contact views
  let displayActions = actions
  if (selectedContact) {
    displayActions = displayActions.filter((a) => String(a.contact_id) === String(selectedContact.id))
  }
  if (!showCompletedActions) {
    displayActions = displayActions.filter((a) => {
      // Check if action is completed based on status or completed_date
      const isCompleted = (a.status as string) === 'completed' || a.completed_date !== null
      return !isCompleted
    })
  }
  if (showWeekRange) {
    displayActions = displayActions.filter((a) => {
      const displayDate = getDisplayDate(a)
      return isWithinWeekRange(displayDate)
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex min-h-9 items-center space-x-3">
            <CardTitle>
              Actions
              {selectedContact && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  for {selectedContact.first_name} {selectedContact.last_name}
                </span>
              )}
            </CardTitle>
            <div className="ml-2 flex items-center space-x-4">
              <div className="flex cursor-pointer items-center space-x-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="m-0 flex items-center space-x-2">
                      <Switch
                        checked={showCompletedActions}
                        onCheckedChange={onToggleShowCompleted}
                        id="show-completed-switch"
                      />
                      {showCompletedActions && (
                        <label htmlFor="show-completed-switch" className="cursor-pointer text-sm">
                          Show completed
                        </label>
                      )}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Show all the completed actions as well.</TooltipContent>
                </Tooltip>
              </div>
              <div className="flex cursor-pointer items-center space-x-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center space-x-2">
                      <Switch checked={showWeekRange} onCheckedChange={toggleWeekRange} id="show-week-range-switch" />
                      {showWeekRange && (
                        <label htmlFor="show-week-range-switch" className="cursor-pointer text-sm">
                          ±1 week
                        </label>
                      )}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Show actions within 1 week of today.</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <span className="mr-2 text-sm text-muted-foreground">
              {displayActions.length} / {actions.length}
            </span>
            {selectedContact && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={onAddAction} size="sm" className="cursor-pointer">
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add new Action</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!selectedContact && displayActions.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">No actions yet</p>
            <Button onClick={onAddAction} className="mt-2 cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              Add your first action
            </Button>
          </div>
        ) : !selectedContact ? (
          <div className="space-y-3">
            {displayActions
              .slice()
              .sort((a, b) => {
                const dateA = getDisplayDate(a)
                const dateB = getDisplayDate(b)
                return new Date(dateA).getTime() - new Date(dateB).getTime()
              })
              .map((action, index) => (
                <ActionCard
                  key={action.id}
                  action={action}
                  contactName={`${contacts.find((c) => c.id === action.contact_id)?.first_name} ${contacts.find((c) => c.id === action.contact_id)?.last_name}`}
                  index={index + 1}
                  onToggleComplete={onToggleComplete}
                  onEdit={onEditAction}
                  onView={onViewAction}
                  onDelete={onDeleteAction}
                  onSelectContact={onSelectContact}
                />
              ))}
          </div>
        ) : displayActions.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">No actions for this contact</p>
            <Button onClick={onAddAction} className="mt-2 cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              Add action
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {displayActions
              .slice()
              .sort((a, b) => {
                const dateA = getDisplayDate(a)
                const dateB = getDisplayDate(b)
                return new Date(dateA).getTime() - new Date(dateB).getTime()
              })
              .map((action, index) => {
                let contactName = 'Unknown Contact'
                if (contacts && contacts.length > 0) {
                  const found = contacts.find((c) => String(c.id).trim() === String(action.contact_id).trim())
                  if (found) {
                    contactName = `${found.first_name} ${found.last_name}`
                  }
                }
                return (
                  <ActionCard
                    key={action.id}
                    action={action}
                    contactName={contactName}
                    index={index + 1}
                    onToggleComplete={onToggleComplete}
                    onEdit={onEditAction}
                    onView={onViewAction}
                    onDelete={onDeleteAction}
                    onSelectContact={!selectedContact ? onSelectContact : undefined}
                  />
                )
              })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
