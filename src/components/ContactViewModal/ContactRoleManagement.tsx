import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Trash2, Save, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'
import { getRoleConfig, getAllRoleTypes } from '@/lib/role-config'
import { RoleType, RoleField } from '@/types/roles'

type Contact = Database['public']['Tables']['contacts']['Row']
type ContactRole = Database['public']['Tables']['contact_roles']['Row']

interface ContactRoleManagementProps {
  contact: Contact
  onRoleChange?: () => void
}

export default function ContactRoleManagement({ contact, onRoleChange }: ContactRoleManagementProps) {
  const [roles, setRoles] = useState<ContactRole[]>([])
  const [loading, setLoading] = useState(false)
  const [editingRole, setEditingRole] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newRoleType, setNewRoleType] = useState<RoleType>('medicare_client')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [roleData, setRoleData] = useState<Record<string, any>>({})

  const fetchRoles = React.useCallback(async () => {
    if (!contact) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('contact_roles')
        .select('*')
        .eq('contact_id', contact.id)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching roles:', error)
        return
      }

      setRoles(data || [])
    } catch (error) {
      console.error('Error fetching roles:', error)
    } finally {
      setLoading(false)
    }
  }, [contact])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  const handleAddRole = async (e?: React.MouseEvent) => {
    e?.preventDefault()
    if (!contact) return

    try {
      const { error } = await supabase.from('contact_roles').insert({
        contact_id: contact.id,
        role_type: newRoleType,
        role_data: roleData,
      })

      if (error) {
        console.error('Error adding role:', error)
        return
      }

      setShowAddForm(false)
      setRoleData({})
      setNewRoleType('medicare_client')
      fetchRoles()
      onRoleChange?.()
    } catch (error) {
      console.error('Error adding role:', error)
    }
  }

  const handleUpdateRole = async (roleId: string, e?: React.MouseEvent) => {
    e?.preventDefault()
    try {
      const { error } = await supabase.from('contact_roles').update({ role_data: roleData }).eq('id', roleId)

      if (error) {
        console.error('Error updating role:', error)
        return
      }

      setEditingRole(null)
      setRoleData({})
      fetchRoles()
      onRoleChange?.()
    } catch (error) {
      console.error('Error updating role:', error)
    }
  }

  const handleDeleteRole = async (roleId: string, e?: React.MouseEvent) => {
    e?.preventDefault()
    if (!confirm('Are you sure you want to delete this role?')) return

    try {
      const { error } = await supabase.from('contact_roles').delete().eq('id', roleId)

      if (error) {
        console.error('Error deleting role:', error)
        return
      }

      fetchRoles()
      onRoleChange?.()
    } catch (error) {
      console.error('Error deleting role:', error)
    }
  }

  const startEditing = (role: ContactRole, e?: React.MouseEvent) => {
    e?.preventDefault()
    setEditingRole(role.id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setRoleData((role.role_data as Record<string, any>) || {})
  }

  const cancelEditing = (e?: React.MouseEvent) => {
    e?.preventDefault()
    setEditingRole(null)
    setRoleData({})
  }

  const renderField = (
    field: { key: string; label: string; type: string; options?: string[] },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onChange: (key: string, value: any) => void
  ) => {
    const fieldKey = field.key
    const fieldValue = value || ''

    switch (field.type) {
      case 'select':
        return (
          <select
            value={fieldValue}
            onChange={(e) => onChange(fieldKey, e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((option: string) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )
      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={!!fieldValue}
            onChange={(e) => onChange(fieldKey, e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        )
      case 'textarea':
        return (
          <textarea
            value={fieldValue}
            onChange={(e) => onChange(fieldKey, e.target.value)}
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        )
      case 'date':
        return (
          <input
            type="date"
            value={fieldValue}
            onChange={(e) => onChange(fieldKey, e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        )
      default:
        return (
          <input
            type="text"
            value={fieldValue}
            onChange={(e) => onChange(fieldKey, e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        )
    }
  }

  if (loading) {
    return <div className="p-4">Loading roles...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Contact Roles</h3>
        <Button type="button" onClick={() => setShowAddForm(true)} size="sm" className="flex items-center space-x-1">
          <Plus className="h-4 w-4" />
          <span>Add Role</span>
        </Button>
      </div>

      {/* Add Role Form */}
      {showAddForm && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="font-medium">Add New Role</h4>
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                setShowAddForm(false)
                setRoleData({})
                setNewRoleType('medicare_client')
              }}
              variant="ghost"
              size="sm"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Role Type</label>
              <select
                value={newRoleType}
                onChange={(e) => setNewRoleType(e.target.value as RoleType)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {getAllRoleTypes().map((roleType) => {
                  const config = getRoleConfig(roleType)
                  return (
                    <option key={roleType} value={roleType}>
                      {config.icon} {config.label}
                    </option>
                  )
                })}
              </select>
            </div>

            <div className="space-y-3">
              {getRoleConfig(newRoleType).fields.map((field: RoleField) => (
                <div key={field.key}>
                  <label className="mb-1 block text-sm font-medium text-gray-700">{field.label}</label>
                  {renderField(field, roleData[field.key], (key, value) => {
                    setRoleData((prev) => ({ ...prev, [key]: value }))
                  })}
                </div>
              ))}
            </div>

            <div className="flex space-x-2">
              <Button type="button" onClick={handleAddRole} size="sm">
                <Save className="mr-1 h-4 w-4" />
                Add Role
              </Button>
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  setShowAddForm(false)
                  setRoleData({})
                  setNewRoleType('medicare_client')
                }}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Existing Roles */}
      <div className="space-y-3">
        {roles.map((role) => {
          const config = getRoleConfig(role.role_type as RoleType)
          const isEditing = editingRole === role.id

          return (
            <div key={role.id} className="rounded-lg border border-gray-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{config.icon}</span>
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${config.color}`}>{config.label}</span>
                </div>
                <div className="flex space-x-1">
                  {isEditing ? (
                    <>
                      <Button type="button" onClick={(e) => handleUpdateRole(role.id, e)} size="sm" variant="outline">
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button type="button" onClick={(e) => cancelEditing(e)} size="sm" variant="outline">
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button type="button" onClick={(e) => startEditing(role, e)} size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        onClick={(e) => handleDeleteRole(role.id, e)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  {config.fields.map((field: RoleField) => (
                    <div key={field.key}>
                      <label className="mb-1 block text-sm font-medium text-gray-700">{field.label}</label>
                      {renderField(field, roleData[field.key], (key, value) => {
                        setRoleData((prev) => ({ ...prev, [key]: value }))
                      })}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {config.fields.map((field: RoleField) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const value = (role.role_data as Record<string, any>)?.[field.key]
                    if (!value && field.type !== 'checkbox') return null

                    return (
                      <div key={field.key} className="flex justify-between">
                        <span className="text-sm text-gray-600">{field.label}:</span>
                        <span className="text-sm font-medium">
                          {field.type === 'checkbox' ? (value ? 'Yes' : 'No') : String(value || 'N/A')}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {roles.length === 0 && !showAddForm && (
        <div className="py-8 text-center text-gray-500">
          <p>No roles assigned to this contact.</p>
          <p className="text-sm">Click &quot;Add Role&quot; to get started.</p>
        </div>
      )}
    </div>
  )
}
