import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Trash2, Save, X } from 'lucide-react'
import { getRoleConfig, getAllRoleTypes, roleIconMap } from '@/lib/role-config'
import { RoleType, RoleField, RoleData } from '@/types/roles'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Type for a role that hasn't been saved to the database yet
type PendingRole = {
  id: string // temporary ID for React key
  role_type: RoleType
  role_data: RoleData
  is_primary: boolean
}

interface ContactRoleManagementNewProps {
  roles: PendingRole[]
  onRolesChange: (roles: PendingRole[]) => void
}

export default function ContactRoleManagementNew({ roles, onRolesChange }: ContactRoleManagementNewProps) {
  const [editingRole, setEditingRole] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newRoleType, setNewRoleType] = useState<RoleType>('medicare_client')
  const [roleData, setRoleData] = useState<RoleData>({})
  const [isPrimary, setIsPrimary] = useState(false)

  const handleAddRole = (e?: React.MouseEvent) => {
    e?.preventDefault()

    const newRole: PendingRole = {
      id: `temp-${Date.now()}-${Math.random()}`, // temporary ID
      role_type: newRoleType,
      role_data: roleData,
      is_primary: isPrimary,
    }

    // If this is being set as primary, unset other primary roles
    const updatedRoles = isPrimary ? roles.map((role) => ({ ...role, is_primary: false })) : roles

    onRolesChange([...updatedRoles, newRole])

    setShowAddForm(false)
    setRoleData({})
    setNewRoleType('medicare_client')
    setIsPrimary(false)
  }

  const handleUpdateRole = (roleId: string, e?: React.MouseEvent) => {
    e?.preventDefault()

    const updatedRoles = roles.map((role) => {
      if (role.id === roleId) {
        return {
          ...role,
          role_data: roleData,
          is_primary: isPrimary,
        }
      }
      return role
    })

    // If this is being set as primary, unset other primary roles
    const finalRoles = isPrimary
      ? updatedRoles.map((role) => (role.id === roleId ? role : { ...role, is_primary: false }))
      : updatedRoles

    onRolesChange(finalRoles)
    setEditingRole(null)
    setRoleData({})
    setIsPrimary(false)
  }

  const handleDeleteRole = (roleId: string, e?: React.MouseEvent) => {
    e?.preventDefault()
    if (!confirm('Are you sure you want to delete this role?')) return

    onRolesChange(roles.filter((role) => role.id !== roleId))
  }

  const startEditing = (role: PendingRole, e?: React.MouseEvent) => {
    e?.preventDefault()
    setEditingRole(role.id)
    setRoleData(role.role_data || {})
    setIsPrimary(role.is_primary)
  }

  const cancelEditing = (e?: React.MouseEvent) => {
    e?.preventDefault()
    setEditingRole(null)
    setRoleData({})
    setIsPrimary(false)
  }

  const renderField = (
    field: RoleField,
    value: string | boolean | number | undefined,
    onChange: (value: string | boolean | number) => void,
    disabled = false
  ) => {
    const fieldId = `role-${field.key}`

    switch (field.type) {
      case 'text':
        return (
          <Input
            id={fieldId}
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
          />
        )
      case 'email':
        return (
          <Input
            id={fieldId}
            type="email"
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
          />
        )
      case 'number':
        return (
          <Input
            id={fieldId}
            type="number"
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
          />
        )
      case 'date':
        return (
          <Input
            id={fieldId}
            type="date"
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          />
        )
      case 'select':
        return (
          <Select value={String(value || '')} onValueChange={(val) => onChange(val)} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option, index) => (
                <SelectItem key={`${option}-${index}`} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case 'textarea':
        return (
          <textarea
            id={fieldId}
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
        )
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={fieldId}
              checked={Boolean(value)}
              onCheckedChange={(checked) => onChange(checked)}
              disabled={disabled}
            />
            <Label htmlFor={fieldId} className="text-sm">
              {value ? 'Yes' : 'No'}
            </Label>
          </div>
        )
      default:
        return (
          <Input
            id={fieldId}
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
          />
        )
    }
  }

  const renderRoleForm = (roleType: RoleType, isEditing = false) => {
    const config = getRoleConfig(roleType)
    const IconComponent = roleIconMap[roleType]

    return (
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center space-x-2 text-sm">
            <IconComponent className="h-4 w-4" />
            <span>
              {isEditing ? 'Edit' : 'Add'} {config.label}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2">
            <Switch id="is-primary" checked={isPrimary} onCheckedChange={setIsPrimary} />
            <Label htmlFor="is-primary" className="text-sm">
              Primary Role
            </Label>
          </div>

          {config.fields.map((field) => (
            <div key={field.key}>
              <Label htmlFor={`role-${field.key}`} className="text-sm">
                {field.label}
                {field.required && <span className="ml-1 text-red-500">*</span>}
              </Label>
              {renderField(
                field,
                (roleData as Record<string, unknown>)[field.key] as string | boolean | number | undefined,
                (value) => setRoleData({ ...roleData, [field.key]: value } as RoleData),
                false
              )}
            </div>
          ))}

          <div className="flex space-x-2 pt-2">
            <Button
              type="button"
              size="sm"
              onClick={isEditing ? (e) => handleUpdateRole(editingRole!, e) : handleAddRole}
              className="flex items-center space-x-1"
            >
              <Save className="h-3 w-3" />
              <span>{isEditing ? 'Update' : 'Add'} Role</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={isEditing ? cancelEditing : () => setShowAddForm(false)}
              className="flex items-center space-x-1"
            >
              <X className="h-3 w-3" />
              <span>Cancel</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-muted-foreground text-sm font-medium">Roles</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-1"
        >
          <Plus className="h-3 w-3" />
          <span>Add Role</span>
        </Button>
      </div>

      {/* Show add form */}
      {showAddForm && (
        <div className="space-y-3">
          <div>
            <Label htmlFor="role-type" className="text-sm">
              Role Type
            </Label>
            <Select value={newRoleType} onValueChange={(value) => setNewRoleType(value as RoleType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getAllRoleTypes().map((roleType, index) => {
                  const config = getRoleConfig(roleType)
                  const IconComponent = roleIconMap[roleType]
                  return (
                    <SelectItem key={`${roleType}-${index}`} value={roleType}>
                      <div className="flex items-center space-x-2">
                        <IconComponent className="h-4 w-4" />
                        <span>{config.label}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
          {renderRoleForm(newRoleType)}
        </div>
      )}

      {/* Show existing roles */}
      {roles.length > 0 && (
        <div className="space-y-3">
          {roles.map((role) => {
            const config = getRoleConfig(role.role_type)
            const IconComponent = roleIconMap[role.role_type]

            if (editingRole === role.id) {
              return <div key={role.id}>{renderRoleForm(role.role_type, true)}</div>
            }

            return (
              <Card key={role.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <IconComponent className="h-4 w-4" />
                      <span>{config.label}</span>
                      {role.is_primary && (
                        <Badge variant="secondary" className="text-xs">
                          Primary
                        </Badge>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => startEditing(role, e)}
                        className="h-6 w-6 cursor-pointer p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteRole(role.id, e)}
                        className="h-6 w-6 cursor-pointer p-0 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {Object.entries(role.role_data || {}).map(([key, value]) => {
                      if (value === null || value === undefined || value === '') return null
                      return (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="font-medium">
                            {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}:
                          </span>
                          <span>{String(value)}</span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {roles.length === 0 && !showAddForm && (
        <div className="text-muted-foreground text-sm italic">No roles assigned</div>
      )}
    </div>
  )
}
