import React, { useState, useEffect, useMemo } from 'react'
import { Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import ActionCard from './ActionCard'
import type { Database } from '@/lib/supabase'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import Pagination from '@/components/ui/pagination'
import { getDisplayDate } from '@/lib/action-utils'

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
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50) // Configurable page size
  const [isRendering, setIsRendering] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Load week range state from localStorage on component mount
  useEffect(() => {
    const savedState = localStorage.getItem('actionListWeekRange')
    if (savedState !== null) {
      setShowWeekRange(JSON.parse(savedState))
    }
  }, [])

  // Load collapsed state from localStorage on component mount
  useEffect(() => {
    const savedState = localStorage.getItem('actionListCollapsed')
    if (savedState !== null) {
      setIsCollapsed(JSON.parse(savedState))
    }
  }, [])

  const toggleWeekRange = () => {
    const newState = !showWeekRange
    setShowWeekRange(newState)
    // Save to localStorage
    localStorage.setItem('actionListWeekRange', JSON.stringify(newState))
  }

  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    // Save to localStorage
    localStorage.setItem('actionListCollapsed', JSON.stringify(newState))
  }

  // Helper function to check if a date is within 1 week of today
  const isWithinWeekRange = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    return date >= oneWeekAgo && date <= oneWeekFromNow
  }

  // Memoize contact lookup map for efficient contact name resolution
  const contactMap = useMemo(() => {
    const map = new Map()
    contacts.forEach((contact) => {
      map.set(contact.id, contact)
    })
    return map
  }, [contacts])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedContact, showCompletedActions, showWeekRange, itemsPerPage])

  // Show loading spinner when changing to large page sizes
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    const isLargePageSize = newItemsPerPage >= 100 || newItemsPerPage === displayActions.length
    if (isLargePageSize && displayActions.length > 50) {
      setIsRendering(true)
      // Use setTimeout to allow the spinner to show before the heavy rendering
      setTimeout(() => {
        setItemsPerPage(newItemsPerPage)
        setIsRendering(false)
      }, 50)
    } else {
      setItemsPerPage(newItemsPerPage)
    }
  }

  // Memoize filtered and sorted actions to prevent expensive re-computations
  const displayActions = useMemo(() => {
    let filteredActions = actions

    if (selectedContact) {
      filteredActions = filteredActions.filter((a) => String(a.contact_id) === String(selectedContact.id))
    }
    if (!showCompletedActions) {
      filteredActions = filteredActions.filter((a) => {
        // Check if action is completed based on status or completed_date
        const isCompleted = (a.status as string) === 'completed' || a.completed_date !== null
        return !isCompleted
      })
    }
    if (showWeekRange) {
      filteredActions = filteredActions.filter((a) => {
        const displayDate = getDisplayDate(a)
        return isWithinWeekRange(displayDate)
      })
    }

    // Sort actions by display date
    return filteredActions.slice().sort((a, b) => {
      const dateA = getDisplayDate(a)
      const dateB = getDisplayDate(b)
      return new Date(dateA).getTime() - new Date(dateB).getTime()
    })
  }, [actions, selectedContact, showCompletedActions, showWeekRange])

  // Pagination logic
  const totalPages = Math.ceil(displayActions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedActions = displayActions.slice(startIndex, endIndex)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex min-h-9 items-center space-x-3">
            <CardTitle>
              Actions
              {selectedContact && (
                <span className="text-muted-foreground ml-2 text-sm font-normal">
                  for {selectedContact.first_name} {selectedContact.last_name}
                </span>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={toggleCollapse} className="ml-2 cursor-pointer px-2">
              {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
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
          <div className="flex items-center space-x-2">
            <span className="text-muted-foreground text-sm">
              {displayActions.length} / {actions.length}
            </span>
            {totalPages > 1 && (
              <span className="text-muted-foreground text-sm">
                (Page {currentPage} of {totalPages})
              </span>
            )}
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

        {/* Top Pagination Controls */}
        {!isCollapsed && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={displayActions.length}
            itemsPerPage={itemsPerPage}
            startIndex={startIndex}
            endIndex={endIndex}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={handleItemsPerPageChange}
            isLoading={isRendering}
          />
        )}
      </CardHeader>
      {!isCollapsed && (
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
              {paginatedActions.map((action, index) => (
                <ActionCard
                  key={action.id}
                  action={action}
                  contactName={(() => {
                    const contact = contactMap.get(action.contact_id)
                    return contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown Contact'
                  })()}
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
              {paginatedActions.map((action, index) => {
                const contact = contactMap.get(action.contact_id)
                const contactName = contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown Contact'
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

          {/* Bottom Pagination Controls */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={displayActions.length}
            itemsPerPage={itemsPerPage}
            startIndex={startIndex}
            endIndex={endIndex}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={handleItemsPerPageChange}
            className="mt-6"
            isLoading={isRendering}
          />
        </CardContent>
      )}
    </Card>
  )
}
