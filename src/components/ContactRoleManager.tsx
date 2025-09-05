'use client'

import React, { useState, useEffect, memo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Edit, Trash2, Plus } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { RoleType, RoleData } from '@/types/roles'
import { getRoleConfig, roleIconMap } from '@/lib/role-config'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

// Types for both modes
type Contact = Database['public']['Tables']['contacts']['Row']

type ContactRole = {
  id: string
  contact_id: string
  role_type: RoleType
  role_data: Record<string, unknown>
  is_primary: boolean
  created_at: string
  updated_at: string
}

type PendingRole = {
  id: string
  role_type: RoleType
  role_data: RoleData
  is_primary: boolean
}

interface ContactRoleManagerProps {
  // For existing contacts
  editingContact?: Contact | null
  onRefreshContact?: () => void
  // For new contacts
  pendingRoles?: PendingRole[]
  onPendingRolesChange?: (roles: PendingRole[]) => void
  // Modal state and handlers (to be managed by parent)
  onRoleFormOpenChange?: (open: boolean) => void
  onEditingRoleChange?: (role: ContactRole | PendingRole | null) => void
  onRoleFormDataChange?: (data: { role_type: RoleType; role_data: RoleData; is_primary: boolean }) => void
  // Refresh trigger
  refreshTrigger?: number
}

function ContactRoleManager({
  editingContact,
  onRefreshContact,
  pendingRoles = [],
  onPendingRolesChange,
  onRoleFormOpenChange,
  onEditingRoleChange,
  onRoleFormDataChange,
  refreshTrigger,
}: ContactRoleManagerProps) {
  // State for existing roles (only for editing contacts)
  const [existingRoles, setExistingRoles] = useState<ContactRole[]>([])
  const [rolesLoading, setRolesLoading] = useState(false)

  // Fetch roles for existing contacts
  const fetchRoles = React.useCallback(async () => {
    if (!editingContact) return

    setRolesLoading(true)
    try {
      const { data, error } = await supabase
        .from('contact_roles')
        .select('*')
        .eq('contact_id', editingContact.id)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching roles:', error)
        return
      }

      setExistingRoles((data as ContactRole[]) || [])
    } catch (error) {
      console.error('Error fetching roles:', error)
    } finally {
      setRolesLoading(false)
    }
  }, [editingContact])

  useEffect(() => {
    if (editingContact) {
      fetchRoles()
    } else {
      // Clear existing roles when not editing a contact
      setExistingRoles([])
    }
  }, [fetchRoles, editingContact])

  // Refresh roles when refreshTrigger changes
  useEffect(() => {
    if (editingContact && refreshTrigger !== undefined) {
      fetchRoles()
    }
  }, [refreshTrigger, editingContact, fetchRoles])

  // Role management functions
  const handleAddRole = () => {
    onEditingRoleChange?.(null)
    onRoleFormDataChange?.({
      role_type: 'medicare_client',
      role_data: {},
      is_primary: false,
    })
    onRoleFormOpenChange?.(true)
  }

  const handleEditRole = (role: ContactRole | PendingRole) => {
    onEditingRoleChange?.(role)
    onRoleFormDataChange?.({
      role_type: role.role_type,
      role_data: role.role_data as RoleData,
      is_primary: role.is_primary,
    })
    onRoleFormOpenChange?.(true)
  }

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return

    try {
      // Check if it's an existing role (has contact_id) or a pending role
      const existingRole = existingRoles.find((role) => role.id === roleId)

      if (existingRole && editingContact) {
        // Delete from database
        const { error } = await supabase.from('contact_roles').delete().eq('id', roleId)

        if (error) {
          console.error('Error deleting role:', error)
          return
        }

        await fetchRoles()
        onRefreshContact?.()
      } else {
        // Delete from pending roles
        const updatedRoles = pendingRoles.filter((role) => role.id !== roleId)
        onPendingRolesChange?.(updatedRoles)
      }
    } catch (error) {
      console.error('Error deleting role:', error)
    }
  }

  // Role display rendering - combines best of both approaches
  const renderRoleDisplay = (role: ContactRole | PendingRole, isPending = false) => {
    const config = getRoleConfig(role.role_type)
    const IconComponent = roleIconMap[role.role_type]

    return (
      <Card key={role.id} className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <IconComponent className="h-4 w-4" />
              <span>{config.label}</span>
              {role.is_primary && (
                <Badge variant="outline" className="text-xs">
                  Primary
                </Badge>
              )}
              {isPending && (
                <Badge variant="secondary" className="text-xs">
                  New
                </Badge>
              )}
            </div>
            <div className="flex space-x-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleEditRole(role)}
                className="h-6 w-6 cursor-pointer p-0"
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteRole(role.id)}
                className="h-6 w-6 cursor-pointer p-0 text-red-600 hover:text-red-800"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-1 text-sm">
            {Object.entries(role.role_data as Record<string, unknown>)
              .filter(([, value]) => value !== '' && value !== null && value !== undefined)
              .map(([key, value]) => (
                <div key={key} className="flex justify-between border-b border-gray-100 pb-1 last:border-b-0">
                  <span className="font-medium">{String(value)}</span>
                  <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const hasRoles = existingRoles.length > 0 || pendingRoles.length > 0

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Roles</Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddRole}
              className="flex cursor-pointer items-center hover:border-black hover:bg-black hover:text-white"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add role</TooltipContent>
        </Tooltip>
      </div>

      {rolesLoading ? (
        <div className="text-muted-foreground text-sm">Loading roles...</div>
      ) : hasRoles ? (
        <div className="space-y-2">
          {/* Existing roles */}
          {existingRoles.map((role) => renderRoleDisplay(role, false))}

          {/* Pending roles */}
          {pendingRoles.map((role) => renderRoleDisplay(role, true))}
        </div>
      ) : (
        <div className="text-muted-foreground text-sm">No roles assigned</div>
      )}
    </div>
  )
}

// Memoize the component to prevent unnecessary re-renders
export default memo(ContactRoleManager)
