import React, { useState, useEffect, useMemo, useRef } from 'react'
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
  filteredContacts?: Contact[] // New prop for filtered contacts
  onAddAction: () => void
  onToggleComplete: (action: Action) => void
  onCompleteWithCreatedDate: (action: Action) => void
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
  filteredContacts,
  onAddAction,
  onToggleComplete,
  onCompleteWithCreatedDate,
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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

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

  // Helper function to check if a date is within 30 days of today
  const isWithinWeekRange = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    return date >= thirtyDaysAgo && date <= thirtyDaysFromNow
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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Show loading spinner when changing to large page sizes
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    const isLargePageSize = newItemsPerPage >= 100 || newItemsPerPage === displayActions.length
    if (isLargePageSize && displayActions.length > 50) {
      setIsRendering(true)
      // Use setTimeout to allow the spinner to show before the heavy rendering
      timeoutRef.current = setTimeout(() => {
        setItemsPerPage(newItemsPerPage)
        setIsRendering(false)
        timeoutRef.current = null
      }, 50)
    } else {
      setItemsPerPage(newItemsPerPage)
    }
  }

  // Calculate total actions for the selected contact (before any filtering)
  const totalActionsForContact = useMemo(() => {
    if (!selectedContact) return 0
    return actions.filter((a) => String(a.contact_id) === String(selectedContact.id)).length
  }, [actions, selectedContact])

  // Memoize filtered and sorted actions to prevent expensive re-computations
  const displayActions = useMemo(() => {
    let filteredActions = actions

    if (selectedContact) {
      // When a specific contact is selected, show only that contact's actions
      filteredActions = filteredActions.filter((a) => String(a.contact_id) === String(selectedContact.id))
    } else if (filteredContacts && filteredContacts.length > 0) {
      // When no contact is selected but we have filtered contacts, show only actions for those contacts
      const filteredContactIds = new Set(filteredContacts.map((c) => c.id))
      filteredActions = filteredActions.filter((a) => filteredContactIds.has(a.contact_id))
    }
    // If no contact is selected and no filtered contacts, show all actions (original behavior)

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
  }, [actions, selectedContact, filteredContacts, showCompletedActions, showWeekRange])

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
            {!isCollapsed && (
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
                            ±30 days
                          </label>
                        )}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Show actions within 30 days of today.</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {!isCollapsed && (
              <span className="text-muted-foreground text-sm">
                {displayActions.length} / {selectedContact ? actions.filter(action => action.contact_id === selectedContact.id).length : actions.length}
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
      {isCollapsed && (
        <CardContent>
          <div className="py-8 text-center">
            <p className="text-muted-foreground">
              {displayActions.length} cards rolled up, use arrow above to roll down.
            </p>
          </div>
        </CardContent>
      )}
      {!isCollapsed && (
        <CardContent>
          {!selectedContact && displayActions.length === 0 ? (
            <div className="py-8 text-center">
              {totalActionsForContact > 0 ? (
                <>
                  <p className="text-muted-foreground">
                    {totalActionsForContact} cards not displayed, maybe try a different filter.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground">No actions yet</p>
                  <Button onClick={onAddAction} className="mt-2 cursor-pointer">
                    <Plus className="mr-2 h-4 w-4" />
                    Add your first action
                  </Button>
                </>
              )}
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
                  onCompleteWithCreatedDate={onCompleteWithCreatedDate}
                  onEdit={onEditAction}
                  onView={onViewAction}
                  onDelete={onDeleteAction}
                  onSelectContact={onSelectContact}
                />
              ))}
            </div>
          ) : displayActions.length === 0 ? (
            <div className="py-8 text-center">
              {totalActionsForContact > 0 ? (
                <>
                  <p className="text-muted-foreground">
                    {totalActionsForContact} cards not displayed, maybe try a different filter.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground">No actions yet</p>
                  <Button onClick={onAddAction} className="mt-2 cursor-pointer">
                    <Plus className="mr-2 h-4 w-4" />
                    Add your first action
                  </Button>
                </>
              )}
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
                    onCompleteWithCreatedDate={onCompleteWithCreatedDate}
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
