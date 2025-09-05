import React, { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, User, Building, Stethoscope, Wrench } from 'lucide-react'
import { formatMBI } from '@/lib/contact-utils'
import type { Database } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'

// Helper function to format date as YYYY-MM
function formatYearMonth(dateString: string): string {
  try {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  } catch {
    return dateString // Return original if parsing fails
  }
}

type Contact = Database['public']['Tables']['contacts']['Row']
type ContactRole = Database['public']['Tables']['contact_roles']['Row']

// Type for Medicare client role data
type MedicareClientRoleData = {
  medicare_beneficiary_id?: string | null
  part_a_effective?: string | null
  part_b_effective?: string | null
  subsidy_level?: string | null
  has_medicaid?: boolean | null
  is_tobacco_user?: boolean | null
  height?: string | null
  weight?: string | null
  gender?: string | null
  marital_status?: string | null
}

// Type for generic role data (any key-value pairs)
type GenericRoleData = Record<string, unknown>

interface ContactRolesDisplayProps {
  contact: Contact
}

// Role-specific icons and colors
const roleConfig = {
  medicare_client: {
    icon: Shield,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    label: 'Medicare Client',
  },
  referral_partner: {
    icon: User,
    color: 'bg-green-100 text-green-800 border-green-200',
    label: 'Referral Partner',
  },
  tire_shop: {
    icon: Wrench,
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    label: 'Tire Shop',
  },
  dentist: {
    icon: Stethoscope,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    label: 'Dentist',
  },
  doctor: {
    icon: Stethoscope,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    label: 'Doctor',
  },
  business_contact: {
    icon: Building,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    label: 'Business Contact',
  },
}

// Helper component for displaying a single field
function FieldDisplay({
  label,
  value,
  icon: Icon = Shield,
}: {
  label: string
  value: string | number | boolean
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex items-center space-x-2">
      <Icon className="text-muted-foreground h-4 w-4" />
      <span className="text-sm font-medium">{label}:</span>
      <span className="text-sm">{String(value)}</span>
    </div>
  )
}

// Medicare-specific data display component
function MedicareClientRoleDisplay({ roleData }: { roleData: MedicareClientRoleData }) {
  const fields = [
    {
      key: 'medicare_beneficiary_id',
      label: 'MBI',
      value: roleData.medicare_beneficiary_id,
      formatter: (val: string) => formatMBI(val),
    },
    {
      key: 'part_a_effective',
      label: 'Part A Effective',
      value: roleData.part_a_effective,
      formatter: (val: string) => formatYearMonth(val),
    },
    {
      key: 'part_b_effective',
      label: 'Part B Effective',
      value: roleData.part_b_effective,
      formatter: (val: string) => formatYearMonth(val),
    },
    {
      key: 'subsidy_level',
      label: 'Subsidy Level',
      value: roleData.subsidy_level,
    },
    {
      key: 'has_medicaid',
      label: 'Has Medicaid',
      value: roleData.has_medicaid,
      formatter: (val: boolean) => (val ? 'Yes' : 'No'),
    },
    {
      key: 'is_tobacco_user',
      label: 'Tobacco User',
      value: roleData.is_tobacco_user,
      formatter: (val: boolean) => (val ? 'Yes' : 'No'),
    },
    {
      key: 'height',
      label: 'Height',
      value: roleData.height,
    },
    {
      key: 'weight',
      label: 'Weight',
      value: roleData.weight,
    },
    {
      key: 'gender',
      label: 'Gender',
      value: roleData.gender,
    },
    {
      key: 'marital_status',
      label: 'Marital Status',
      value: roleData.marital_status,
    },
  ]

  return (
    <div className="space-y-2">
      {fields.map(({ key, label, value, formatter }) => {
        if (value === null || value === undefined || value === '') return null

        const displayValue = formatter ? formatter(value as never) : String(value)

        return <FieldDisplay key={key} label={label} value={displayValue} />
      })}
    </div>
  )
}

// Generic role data display for non-Medicare roles
function GenericRoleDisplay({ roleData }: { roleData: GenericRoleData }) {
  const hasData = Object.keys(roleData).length > 0

  if (!hasData) {
    return <div className="text-muted-foreground text-sm italic">No additional data available</div>
  }

  return (
    <div className="space-y-2">
      {Object.entries(roleData).map(([key, value]) => {
        if (value === null || value === undefined || value === '') return null

        const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())

        return <FieldDisplay key={key} label={displayKey} value={String(value)} />
      })}
    </div>
  )
}

export default function ContactRolesDisplay({ contact }: ContactRolesDisplayProps) {
  const [roles, setRoles] = useState<ContactRole[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!contact?.id) return

    const fetchRoles = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('contact_roles')
          .select('*')
          .eq('contact_id', contact.id)
          .eq('is_active', true)
          .order('is_primary', { ascending: false })
          .order('created_at', { ascending: true })

        if (error) {
          console.error('Error fetching contact roles:', error)
          return
        }

        setRoles(data || [])
      } catch (error) {
        console.error('Error fetching contact roles:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRoles()
  }, [contact?.id])

  if (loading) {
    return (
      <div className="space-y-3">
        <Label className="text-muted-foreground text-sm font-medium">Roles</Label>
        <div className="text-muted-foreground text-sm">Loading roles...</div>
      </div>
    )
  }

  if (roles.length === 0) {
    return (
      <div className="space-y-3">
        <Label className="text-muted-foreground text-sm font-medium">Roles</Label>
        <div className="text-muted-foreground text-sm italic">No roles assigned</div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Label className="text-muted-foreground text-sm font-medium">Roles</Label>
      <div className="space-y-3">
        {roles.map((role) => {
          const config = roleConfig[role.role_type as keyof typeof roleConfig] || {
            icon: User,
            color: 'bg-gray-100 text-gray-800 border-gray-200',
            label: role.role_type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          }

          const IconComponent = config.icon
          const roleData = (role.role_data as Record<string, unknown>) || {}

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
                  <Badge className={`text-xs ${config.color}`}>{role.role_type}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {role.role_type === 'medicare_client' ? (
                  <MedicareClientRoleDisplay roleData={roleData as MedicareClientRoleData} />
                ) : (
                  <GenericRoleDisplay roleData={roleData} />
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
