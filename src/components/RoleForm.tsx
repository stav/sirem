import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import ModalForm from '@/components/ui/modal-form'
import { RoleType, RoleField, RoleData } from '@/types/roles'
import { getRoleConfig, roleIconMap, getAllRoleTypes } from '@/lib/role-config'

interface RoleFormData {
  role_type: RoleType
  role_data: RoleData
  is_primary: boolean
}

interface RoleFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  editingRole: ContactRole | PendingRole | null
  formData: RoleFormData
  setFormData: (data: RoleFormData) => void
  isSubmitting: boolean
}

// Types for role data
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

// Field rendering function
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
        <Textarea
          id={fieldId}
          value={String(value || '')}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
          rows={3}
        />
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

export default function RoleForm({
  isOpen,
  onClose,
  onSubmit,
  editingRole,
  formData,
  setFormData,
  isSubmitting,
}: RoleFormProps) {
  const isEditing = !!editingRole
  const config = getRoleConfig(formData.role_type)

  const title = isEditing ? `Edit ${config.label} Role` : `Add New Role`

  return (
    <ModalForm
      isOpen={isOpen}
      onCancel={onClose}
      onSubmit={onSubmit}
      title={title}
      isLoading={isSubmitting}
      zIndex={80}
    >
      <div className="space-y-4">
        {/* Role Type Selection (only for new roles) */}
        {!isEditing && (
          <div>
            <Label htmlFor="role_type">Role Type</Label>
            <Select
              value={formData.role_type}
              onValueChange={(value: RoleType) => setFormData({ ...formData, role_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role type" />
              </SelectTrigger>
              <SelectContent>
                {getAllRoleTypes().map((roleType) => {
                  const roleConfig = getRoleConfig(roleType)
                  const RoleIcon = roleIconMap[roleType]
                  return (
                    <SelectItem key={roleType} value={roleType}>
                      <div className="flex items-center space-x-2">
                        <RoleIcon className="h-4 w-4" />
                        <span>{roleConfig.label}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Primary Role Toggle */}
        <div className="flex items-center space-x-2">
          <Switch
            id="is_primary"
            checked={formData.is_primary}
            onCheckedChange={(checked) => setFormData({ ...formData, is_primary: checked })}
          />
          <Label htmlFor="is_primary">Primary Role</Label>
        </div>

        {/* Role-specific Fields */}
        {config.fields.map((field) => (
          <div key={field.key}>
            <Label htmlFor={field.key}>{field.label}</Label>
            {renderField(
              field,
              (formData.role_data as Record<string, unknown>)[field.key] as string | boolean | number | undefined,
              (value) => {
                setFormData({
                  ...formData,
                  role_data: {
                    ...formData.role_data,
                    [field.key]: value,
                  },
                })
              },
              false
            )}
          </div>
        ))}
      </div>
    </ModalForm>
  )
}
