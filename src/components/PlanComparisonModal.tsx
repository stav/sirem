'use client'

import React, { useState, useEffect } from 'react'
import { X, TrendingUp, TrendingDown, Calculator, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Database } from '@/lib/supabase'
import { calculateCmsId } from '@/lib/plan-utils'
import { getPlanMetadata } from '@/lib/plan-metadata-utils'
import { plansMetadataSchema } from '@/schema/plans-metadata-schema'
import { parseSchema } from '@/lib/schema-parser'

type Plan = Database['public']['Tables']['plans']['Row']

interface PlanComparisonModalProps {
  isOpen: boolean
  onClose: () => void
  plans: Plan[]
  onRefresh?: () => void
}

interface UsageInputs {
  primaryCareVisits: number
  specialistVisits: number
  emergencyRoomVisits: number
  urgentCareVisits: number
  hospitalStays: number
  ambulanceUses: number
}

export default function PlanComparisonModal({ isOpen, onClose, plans, onRefresh }: PlanComparisonModalProps) {
  const [usageInputs, setUsageInputs] = useState<UsageInputs>({
    primaryCareVisits: 4,
    specialistVisits: 2,
    emergencyRoomVisits: 0,
    urgentCareVisits: 1,
    hospitalStays: 0,
    ambulanceUses: 0,
  })

  const [showCalculator, setShowCalculator] = useState(false)


  // Parse schema and get ordered sections and fields
  // Parse schema on every render to ensure it's always up-to-date
  const parsedSchema = parseSchema(plansMetadataSchema)

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Helper to format currency (hide .00 cents only)
  const formatCurrency = (value: number | null | undefined): string => {
    if (value == null) return '—'
    // Show cents only if they're non-zero
    const hasCents = value % 1 !== 0
    return hasCents ? `$${value.toFixed(2)}` : `$${value.toFixed(0)}`
  }


  // Helper to format text values
  const formatText = (value: string | null | undefined): string => {
    return value || '—'
  }

  // Helper to get metadata field
  const getMetadata = (plan: Plan, key: string): string | number | null => {
    if (!plan.metadata || typeof plan.metadata !== 'object') return null
    const metadata = plan.metadata as Record<string, unknown>
    const value = metadata[key]
    if (typeof value === 'string' || typeof value === 'number') {
      return value
    }
    return null
  }

  // Get schema-ordered metadata sections with fields that exist in the plans
  const getSchemaOrderedMetadataSections = () => {
    const sectionsWithFields: Array<{section: {key: string, title: string, description: string, order: number}, fields: string[]}> = []
    
    // Go through schema sections in order
    parsedSchema.sections.forEach(section => {
      const sectionFields = parsedSchema.fieldsBySection[section.key] || []
      
      // Filter to only include fields that exist in at least one plan's metadata
      const existingFields = sectionFields.filter(field => {
        return plans.some(plan => 
          plan.metadata && 
          typeof plan.metadata === 'object' && 
          field.key in (plan.metadata as Record<string, unknown>)
        )
      })
      
      // Include sections that have existing fields OR show all fields for debugging
      if (existingFields.length > 0) {
        sectionsWithFields.push({
          section,
          fields: existingFields.map(field => field.key)
        })
      } else {
        // Show section even if no fields exist (for debugging/development)
        sectionsWithFields.push({
          section,
          fields: sectionFields.map(field => field.key)
        })
      }
    })
    
    return sectionsWithFields
  }

  // Format metadata value for display
  const formatMetadataValue = (value: string | number | null): string => {
    if (value == null) return '—'
    if (typeof value === 'number') return String(value)
    if (value === 'n/a' || value === 'N/A') return '—'
    return value
  }

  // Check if a field should be treated as long text that needs truncation
  const isLongTextField = (key: string, value: string | number | null): boolean => {
    // Always treat these known long text fields as long text
    const knownLongTextFields = [
      'pharmacy_benefit',
      'service_area', 
      'fitness_benefit',
      'rx_cost_share',
      'medicaid_eligibility',
      'transitioned_from',
      'summary',
      'pdf_text_sample'
    ]
    
    if (knownLongTextFields.includes(key)) {
      return true
    }
    
    // Also treat any text field longer than 100 characters as long text
    if (typeof value === 'string' && value.length > 100) {
      return true
    }
    
    return false
  }

  // Parse metadata value to number (for comparison)
  const parseMetadataNumber = (value: string | number | null): number | null => {
    if (value == null) return null
    if (typeof value === 'number') return value
    if (value === 'n/a' || value === 'N/A' || value === '') return null
    
    // Try to parse numeric values from strings
    const cleaned = String(value).replace(/[$,%]/g, '').trim()
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? null : parsed
  }

  // Check if a metadata field should be treated as numeric
  const isNumericField = (key: string, values: (string | number | null)[]): boolean => {
    // Check if key suggests it's numeric
    const numericKeywords = ['copay', 'coinsurance', 'deductible', 'benefit', 'premium', 
                            'cost', 'max', 'limit', 'allowance', 'moop']
    const lowerKey = key.toLowerCase()
    const hasNumericKeyword = numericKeywords.some(keyword => lowerKey.includes(keyword))
    
    // Check if values are mostly numeric
    const numericValues = values.map(v => parseMetadataNumber(v)).filter(v => v !== null)
    const hasNumericValues = numericValues.length > 0
    
    return hasNumericKeyword && hasNumericValues
  }

  // Determine if higher or lower is better for a field
  const isLowerBetter = (key: string): boolean => {
    const lowerBetterKeywords = ['copay', 'coinsurance', 'deductible', 'premium', 'cost']
    const higherBetterKeywords = ['benefit', 'allowance', 'max', 'limit', 'giveback']
    
    const lowerKey = key.toLowerCase()
    
    if (higherBetterKeywords.some(kw => lowerKey.includes(kw))) return false
    if (lowerBetterKeywords.some(kw => lowerKey.includes(kw))) return true
    
    // Default to lower is better for safety
    return true
  }

  // Format label from snake_case
  const formatLabel = (key: string): string => {
    return key
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Calculate estimated annual costs
  const calculateAnnualCost = (plan: Plan): number => {
    const premium = (Number(getPlanMetadata.premium_monthly(plan)) || 0) * 12
    const giveback = (Number(getPlanMetadata.giveback_monthly(plan)) || 0) * 12
    
    const primaryCareCosts = (Number(getPlanMetadata.primary_care_copay(plan)) || 0) * usageInputs.primaryCareVisits
    const specialistCosts = (Number(getPlanMetadata.specialist_copay(plan)) || 0) * usageInputs.specialistVisits
    const erCosts = (Number(getPlanMetadata.emergency_room_copay(plan)) || 0) * usageInputs.emergencyRoomVisits
    const urgentCareCosts = (Number(getPlanMetadata.urgent_care_copay(plan)) || 0) * usageInputs.urgentCareVisits
    // Hospital cost = daily copay * days covered per stay * number of stays
    const daysPerStay = Number(getPlanMetadata.hospital_inpatient_days(plan)) || 0
    const hospitalCosts = (Number(getPlanMetadata.hospital_inpatient_per_day_copay(plan)) || 0) * daysPerStay * usageInputs.hospitalStays
    const ambulanceCosts = (Number(getPlanMetadata.ambulance_copay(plan)) || 0) * usageInputs.ambulanceUses

    const totalCopays = primaryCareCosts + specialistCosts + erCosts + urgentCareCosts + hospitalCosts + ambulanceCosts

    return premium - giveback + totalCopays
  }

  // Compare two values and return indicator
  const getComparisonIndicator = (current: number | null, others: (number | null)[], lowerIsBetter: boolean = true) => {
    if (current == null) return null
    const validOthers = others.filter(v => v != null) as number[]
    if (validOthers.length === 0) return null

    const currentValue = current
    const avgOthers = validOthers.reduce((a, b) => a + b, 0) / validOthers.length

    // Only show indicators when there's a meaningful difference (no dash for equal values)
    if (Math.abs(currentValue - avgOthers) < 0.01) {
      return null
    }

    const isHigher = currentValue > avgOthers
    const isBetter = lowerIsBetter ? currentValue < avgOthers : currentValue > avgOthers
    
    // For inbound (benefits): higher = green up, lower = red down
    // For outbound (expenses): lower = green down, higher = red up
    if (isBetter && isHigher) {
      // Higher and it's good (benefits)
      return <span title="Better than average"><TrendingUp className="h-4 w-4 text-green-600 inline ml-1" /></span>
    } else if (isBetter && !isHigher) {
      // Lower and it's good (expenses)
      return <span title="Better than average"><TrendingDown className="h-4 w-4 text-green-600 inline ml-1" /></span>
    } else if (!isBetter && isHigher) {
      // Higher and it's bad (expenses)
      return <span title="Worse than average"><TrendingUp className="h-4 w-4 text-red-600 inline ml-1" /></span>
    } else {
      // Lower and it's bad (benefits)
      return <span title="Worse than average"><TrendingDown className="h-4 w-4 text-red-600 inline ml-1" /></span>
    }
  }

  // Comparison field component
  const ComparisonField = ({ 
    label, 
    values, 
    lowerIsBetter = true,
    formatter = formatCurrency
  }: { 
    label: string
    values: (number | null)[]
    lowerIsBetter?: boolean
    formatter?: (v: number | null) => string
  }) => (
    <tr className="border-b border-border hover:bg-blue-500/20 transition-colors">
      <td className="py-2 px-3 font-medium text-sm bg-muted/30">{label}</td>
      {values.map((value, idx) => {
        const others = values.filter((_, i) => i !== idx)
        const hasDiscrep = false // No discrepancy checking needed with new schema
        return (
          <td 
            key={idx} 
            className={`py-2 px-3 text-center text-sm max-w-48 ${hasDiscrep ? 'bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-500' : ''}`}
            title={hasDiscrep ? `⚠️ Discrepancy: Metadata value differs from main field` : undefined}
          >
            {formatter(value)}
            {getComparisonIndicator(value, others, lowerIsBetter)}
          </td>
        )
      })}
    </tr>
  )

  const annualCosts = plans.map(calculateAnnualCost)
  const lowestCost = Math.min(...annualCosts)

  // Dynamic max-width based on number of plans
  const getMaxWidthClass = (planCount: number): string => {
    const maxWidthMap: Record<number, string> = {
      1: 'max-w-xl',
      2: 'max-w-2xl',
      3: 'max-w-3xl',
      4: 'max-w-4xl',
      5: 'max-w-5xl',
      6: 'max-w-6xl',
      7: 'max-w-7xl',
    }
    // For 8+ plans, no max-width constraint
    return maxWidthMap[planCount] || ''
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={onClose}>
      <div
        className={`bg-background border border-border rounded-lg shadow-xl w-[95vw] ${getMaxWidthClass(plans.length)} max-h-[90vh] overflow-hidden flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-semibold">Compare Plans ({plans.length})</h2>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRefresh}
                title="Refresh plans data"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            )}
            <Button
              size="sm"
              variant={showCalculator ? 'default' : 'outline'}
              onClick={() => setShowCalculator(!showCalculator)}
            >
              <Calculator className="h-4 w-4 mr-2" />
              Cost Calculator
            </Button>
            <Button size="icon" variant="ghost" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Cost Calculator Panel */}
        {showCalculator && (
          <div className="p-4 bg-muted/30 border-b border-border">
            <h3 className="text-sm font-semibold mb-3">Estimate Annual Usage</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <Label className="text-xs">Primary Care Visits</Label>
                <Input
                  type="number"
                  min="0"
                  value={usageInputs.primaryCareVisits}
                  onChange={(e) => setUsageInputs({ ...usageInputs, primaryCareVisits: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Specialist Visits</Label>
                <Input
                  type="number"
                  min="0"
                  value={usageInputs.specialistVisits}
                  onChange={(e) => setUsageInputs({ ...usageInputs, specialistVisits: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">ER Visits</Label>
                <Input
                  type="number"
                  min="0"
                  value={usageInputs.emergencyRoomVisits}
                  onChange={(e) => setUsageInputs({ ...usageInputs, emergencyRoomVisits: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Urgent Care Visits</Label>
                <Input
                  type="number"
                  min="0"
                  value={usageInputs.urgentCareVisits}
                  onChange={(e) => setUsageInputs({ ...usageInputs, urgentCareVisits: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Hospital Stays</Label>
                <Input
                  type="number"
                  min="0"
                  value={usageInputs.hospitalStays}
                  onChange={(e) => setUsageInputs({ ...usageInputs, hospitalStays: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Ambulance Uses</Label>
                <Input
                  type="number"
                  min="0"
                  value={usageInputs.ambulanceUses}
                  onChange={(e) => setUsageInputs({ ...usageInputs, ambulanceUses: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Comparison Table */}
        <div className="flex-1 overflow-auto p-4">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="py-3 px-3 text-left font-semibold text-sm bg-muted sticky top-0"></th>
                {plans.map((plan, idx) => (
                  <th key={idx} className="py-3 px-3 text-center font-semibold text-sm bg-muted sticky top-0 max-w-48">
                    <div className="font-bold">{plan.name}</div>
                    <div className="text-xs font-normal text-muted-foreground">
                      {plan.carrier} • {(() => {
                        // Build the plan type string from normalized fields
                        const parts = []
                        if (plan.type_network) parts.push(plan.type_network)
                        if (plan.type_extension) parts.push(plan.type_extension)
                        if (plan.type_snp) parts.push(`${plan.type_snp}-SNP`)
                        // Don't add type_program if it's already included in the SNP part
                        if (plan.type_program && plan.type_program !== 'MA' && plan.type_program !== 'SNP') parts.push(plan.type_program)
                        return parts.length > 0 ? parts.join('-') : '—'
                      })()}
                    </div>
                    {plan.plan_year && (
                      <div className="text-xs font-normal text-muted-foreground">{plan.plan_year}</div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Basic Information */}
              <tr className="border-b border-border hover:bg-blue-500/20 transition-colors">
                <td className="py-2 px-3 font-medium text-sm bg-muted/30">CMS ID (Full)</td>
                {plans.map((plan, idx) => (
                  <td key={idx} className="py-2 px-3 text-center text-sm max-w-48">
                    {calculateCmsId(plan) || '—'}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-border hover:bg-blue-500/20 transition-colors">
                <td className="py-2 px-3 font-medium text-sm bg-muted/30">CMS Contract Number</td>
                {plans.map((plan, idx) => (
                  <td key={idx} className="py-2 px-3 text-center text-sm max-w-48">
                    {formatText(plan.cms_contract_number)}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-border hover:bg-blue-500/20 transition-colors">
                <td className="py-2 px-3 font-medium text-sm bg-muted/30">CMS Plan Number</td>
                {plans.map((plan, idx) => (
                  <td key={idx} className="py-2 px-3 text-center text-sm max-w-48">
                    {formatText(plan.cms_plan_number)}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-border hover:bg-blue-500/20 transition-colors">
                <td className="py-2 px-3 font-medium text-sm bg-muted/30">CMS Geo Segment</td>
                {plans.map((plan, idx) => (
                  <td key={idx} className="py-2 px-3 text-center text-sm max-w-48">
                    {formatText(plan.cms_geo_segment)}
                  </td>
                ))}
              </tr>

              {/* Schema-Ordered Metadata Sections */}
              {getSchemaOrderedMetadataSections().map(({section, fields}) => (
                <React.Fragment key={section.key}>
                  <tr className="bg-muted/50">
                    <th className="py-2 px-3 font-semibold text-sm text-right">
                      {section.title}
                    </th>
                    <td colSpan={plans.length}></td>
                  </tr>
                  {fields.map(key => {
                    const values = plans.map(p => getMetadata(p, key))
                    const isNumeric = isNumericField(key, values)
                    
                    if (isNumeric) {
                      // Render as numeric comparison field
                      return (
                        <ComparisonField
                          key={key}
                          label={formatLabel(key)}
                          values={plans.map(p => parseMetadataNumber(getMetadata(p, key)))}
                          lowerIsBetter={isLowerBetter(key)}
                          formatter={(v) => {
                            if (v == null) return '—'
                            // Format based on key type
                            if (key.toLowerCase().includes('coinsurance') || key.toLowerCase().includes('%')) {
                              return `${v}%`
                            }
                            return formatCurrency(v)
                          }}
                        />
                      )
                    } else {
                      // Render as text field
                      return (
                        <tr key={key} className="border-b border-border hover:bg-blue-500/20 transition-colors">
                          <td className="py-2 px-3 font-medium text-sm bg-muted/30">
                            {formatLabel(key)}
                          </td>
                          {plans.map((plan, idx) => {
                            const hasDiscrep = false // No discrepancy checking needed with new schema
                            const value = getMetadata(plan, key)
                            const displayValue = formatMetadataValue(value)
                            const isLongText = isLongTextField(key, value)
                            
                            if (isLongText && typeof value === 'string' && value.length > 0) {
                              // Render long text fields with truncation and tooltip like counties/notes
                              return (
                                <td 
                                  key={idx} 
                                  className={`py-2 px-3 text-center text-xs max-w-48 overflow-hidden ${hasDiscrep ? 'bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-500' : ''}`}
                                  title={hasDiscrep ? `⚠️ Discrepancy: Metadata value differs from main field` : value}
                                >
                                  <div className="line-clamp-3">
                                    {displayValue}
                                  </div>
                                </td>
                              )
                            } else {
                              // Render regular text fields
                              return (
                                <td 
                                  key={idx} 
                                  className={`py-2 px-3 text-center text-xs max-w-48 ${hasDiscrep ? 'bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-500' : ''}`}
                                  title={hasDiscrep ? `⚠️ Discrepancy: Metadata value differs from main field` : undefined}
                                >
                                  {displayValue}
                                </td>
                              )
                            }
                          })}
                        </tr>
                      )
                    }
                  })}
                </React.Fragment>
              ))}



              {/* Estimated Annual Cost */}
              {showCalculator && (
                <>
                  <tr className="bg-muted/50">
                    <th className="py-2 px-3 font-semibold text-sm text-right">
                      Estimated Annual Cost
                    </th>
                    <td colSpan={plans.length}></td>
                  </tr>
                  <tr className="border-b-2 border-border bg-blue-50 dark:bg-blue-950/30">
                    <td className="py-3 px-3 font-bold text-sm">Total Estimated Annual Cost</td>
                    {annualCosts.map((cost, idx) => (
                      <td key={idx} className={`py-3 px-3 text-center font-bold text-sm ${cost === lowestCost ? 'text-green-600' : ''}`}>
                        {formatCurrency(cost)}
                        {cost === lowestCost && ' ★'}
                      </td>
                    ))}
                  </tr>
                </>
              )}

              {/* Additional Database Fields */}
              <tr className="border-b border-border hover:bg-blue-500/20 transition-colors">
                <td className="py-2 px-3 font-medium text-sm bg-muted/30">Counties</td>
                {plans.map((plan, idx) => (
                  <td key={idx} className="py-2 px-3 text-center text-xs max-w-48 overflow-hidden">
                    <div className="line-clamp-3" title={plan.counties?.join(', ')}>
                      {plan.counties?.join(', ') || '—'}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="p-4 border-t border-border bg-muted/30">
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span>Better than average</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span>Worse than average</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block w-4 h-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-500 rounded"></span>
              <span>⚠️ Discrepancy with main field</span>
            </div>
            {showCalculator && (
              <div className="ml-auto font-semibold">
                ★ = Lowest estimated annual cost
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}



