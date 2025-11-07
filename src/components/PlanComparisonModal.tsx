'use client'

import React, { useState, useEffect } from 'react'
import { X, TrendingUp, TrendingDown, Calculator, RefreshCw, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Database } from '@/lib/supabase'
import { calculateCmsId } from '@/lib/plan-utils'
import { plansMetadataSchema } from '@/schema/plans-metadata-schema'
import { parseSchema, type FieldDefinition } from '@/lib/schema-parser'
import { Badge } from '@/components/ui/badge'
import { getResolvedMetadata } from '@/lib/plan-metadata-utils'
import type { ResolutionResult } from '@/lib/plan-field-resolution'

const MISSING_RESOLUTION: ResolutionResult = { source: 'missing', key: null, value: undefined }

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
  const [sourcePlanId, setSourcePlanId] = useState<string | null>(null)
  const [highlightedRows, setHighlightedRows] = useState<Set<string>>(new Set())
  const [eligibilityFilters, setEligibilityFilters] = useState<string[]>([])

  // Parse schema and get ordered sections and fields
  const parsedSchema = React.useMemo(() => parseSchema(plansMetadataSchema), [])
  const fieldDefinitionMap = React.useMemo(() => {
    const map = new Map<string, FieldDefinition>()
    parsedSchema.fields.forEach((field) => {
      map.set(field.key, field)
    })
    return map
  }, [parsedSchema])
  const eligibilityContext = React.useMemo(
    () => (eligibilityFilters.length ? { eligibility: eligibilityFilters } : undefined),
    [eligibilityFilters]
  )
  const allFieldKeys = React.useMemo(() => {
    const keys = new Set<string>()
    parsedSchema.fields.forEach((field) => {
      keys.add(field.key)
    })
    return Array.from(keys)
  }, [parsedSchema.fields])
  const resolvedMetadataByPlan = React.useMemo(() => {
    const map = new Map<string, Record<string, ResolutionResult>>()
    plans.forEach((plan) => {
      map.set(plan.id, getResolvedMetadata(plan, allFieldKeys, eligibilityContext))
    })
    return map
  }, [plans, allFieldKeys, eligibilityContext])
  const getPlanResolution = React.useCallback(
    (planId: string, key: string): ResolutionResult => {
      const resolved = resolvedMetadataByPlan.get(planId)
      if (resolved && resolved[key]) {
        return resolved[key]
      }
      return MISSING_RESOLUTION
    },
    [resolvedMetadataByPlan]
  )
  const eligibilityOptions = React.useMemo(
    () => [
      { label: 'Medicaid', value: 'medicaid' },
      { label: 'LIS / Extra Help', value: 'lis' },
    ],
    []
  )
  const toggleEligibility = (value: string) => {
    setEligibilityFilters((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value)
      }
      return [...prev, value]
    })
  }

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

  const getSourceBadge = (result: ResolutionResult | undefined, requestedDefinition?: FieldDefinition) => {
    if (!result || result.source === 'missing') return null

    if (result.source === 'variant') {
      const eligibility = result.definition?.characteristics?.eligibility
      const label = Array.isArray(eligibility)
        ? eligibility.join(' / ').toUpperCase()
        : typeof eligibility === 'string'
          ? eligibility.toUpperCase()
          : 'VARIANT'

      return (
        <Badge className="border-blue-200 bg-blue-100 text-blue-900 dark:border-blue-800/70 dark:bg-blue-900/40 dark:text-blue-100">
          {label}
        </Badge>
      )
    }

    if (requestedDefinition?.baseKey) {
      return (
        <Badge variant="outline" className="border-border/60 text-muted-foreground">
          Base fallback
        </Badge>
      )
    }

    return null
  }

  // Helper to generate unique row IDs for highlighting
  const getRowId = (label: string, section?: string): string => {
    return section ? `${section}-${label}` : label
  }

  // Helper to toggle row highlighting
  const toggleRowHighlight = (rowId: string) => {
    setHighlightedRows((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(rowId)) {
        newSet.delete(rowId)
      } else {
        newSet.add(rowId)
      }
      return newSet
    })
  }

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

  const extractPrimitiveValue = (value: unknown): string | number | null => {
    if (value === null || value === undefined) return null
    if (typeof value === 'number' || typeof value === 'string') return value
    if (Array.isArray(value)) {
      return value.join(', ')
    }
    return String(value)
  }

  // Get schema-ordered metadata sections with fields that exist in the plans
  const getSchemaOrderedMetadataSections = () => {
    const sectionsWithFields: Array<{
      section: { key: string; title: string; description: string }
      fields: string[]
    }> = []

    // Go through schema sections in order
    parsedSchema.sections.forEach((section) => {
      const sectionFields = parsedSchema.fieldsBySection[section.key] || []

      // Filter to only include fields that exist in at least one plan's metadata
      const existingFields = sectionFields.filter((field) => {
        return plans.some((plan) => {
          const resolution = getPlanResolution(plan.id, field.key)
          const primitive = extractPrimitiveValue(resolution.value)
          if (primitive === null || primitive === '') return false
          return resolution.source !== 'missing'
        })
      })

      // Include sections that have existing fields OR show all fields for debugging
      if (existingFields.length > 0) {
        sectionsWithFields.push({
          section,
          fields: existingFields.map((field) => field.key),
        })
      } else {
        // Show section even if no fields exist (for debugging/development)
        sectionsWithFields.push({
          section,
          fields: sectionFields.map((field) => field.key),
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
      'pdf_text_sample',
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
  const parseMetadataNumber = (value: unknown): number | null => {
    if (value == null) return null
    if (typeof value === 'number') return value
    if (typeof value !== 'string') return null
    if (value === 'n/a' || value === 'N/A' || value === '') return null

    // Try to parse numeric values from strings
    const cleaned = value.replace(/[$,%]/g, '').trim()
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? null : parsed
  }

  // Check if a metadata field should be treated as numeric
  const isNumericField = (key: string, values: unknown[]): boolean => {
    // Check if key suggests it's numeric
    const numericKeywords = [
      'copay',
      'coinsurance',
      'deductible',
      'benefit',
      'premium',
      'cost',
      'max',
      'limit',
      'allowance',
      'moop',
    ]
    const lowerKey = key.toLowerCase()
    const hasNumericKeyword = numericKeywords.some((keyword) => lowerKey.includes(keyword))

    // Check if values are mostly numeric
    const numericValues = values.map((v) => parseMetadataNumber(v)).filter((v) => v !== null)
    const hasNumericValues = numericValues.length > 0

    return hasNumericKeyword && hasNumericValues
  }

  // Determine if higher or lower is better for a field
  const isLowerBetter = (key: string): boolean => {
    const lowerBetterKeywords = ['copay', 'coinsurance', 'deductible', 'premium', 'cost']
    const higherBetterKeywords = ['benefit', 'allowance', 'max', 'limit', 'giveback']

    const lowerKey = key.toLowerCase()

    if (higherBetterKeywords.some((kw) => lowerKey.includes(kw))) return false
    if (lowerBetterKeywords.some((kw) => lowerKey.includes(kw))) return true

    // Default to lower is better for safety
    return true
  }

  // Format label from snake_case
  const formatLabel = (key: string): string => {
    return key
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Calculate estimated annual costs
  const calculateAnnualCost = (plan: Plan): number => {
    const resolveNumericValue = (fieldKey: string): number =>
      parseMetadataNumber(getPlanResolution(plan.id, fieldKey).value) ?? 0

    const premium = resolveNumericValue('premium_monthly') * 12
    const giveback = resolveNumericValue('giveback_monthly') * 12

    const primaryCareCosts = resolveNumericValue('primary_care_copay') * usageInputs.primaryCareVisits
    const specialistCosts = resolveNumericValue('specialist_copay') * usageInputs.specialistVisits
    const erCosts = resolveNumericValue('emergency_room_copay') * usageInputs.emergencyRoomVisits
    const urgentCareCosts = resolveNumericValue('urgent_care_copay') * usageInputs.urgentCareVisits
    const daysPerStay = resolveNumericValue('hospital_inpatient_days')
    const hospitalDailyCopay = resolveNumericValue('hospital_inpatient_per_day_copay')
    const hospitalCosts = hospitalDailyCopay * daysPerStay * usageInputs.hospitalStays
    const ambulanceCosts = resolveNumericValue('ambulance_copay') * usageInputs.ambulanceUses

    const totalCopays =
      primaryCareCosts + specialistCosts + erCosts + urgentCareCosts + hospitalCosts + ambulanceCosts

    return premium - giveback + totalCopays
  }

  // Compare two values and return indicator (compares against source plan or average)
  const getComparisonIndicator = (current: number | null, others: (number | null)[], lowerIsBetter: boolean = true) => {
    if (current == null) return null

    // If we have a source plan, compare against it
    if (sourcePlanId) {
      const sourcePlan = plans.find((p) => p.id === sourcePlanId)
      const sourceValue = sourcePlan ? others[plans.indexOf(sourcePlan)] : null
      if (sourceValue != null) {
        return compareAgainstSource(current, sourceValue, lowerIsBetter)
      }
    }

    // Fall back to average comparison when no source plan is selected
    const validOthers = others.filter((v) => v != null) as number[]
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
      return (
        <span title="Better than average">
          <TrendingUp className="ml-1 inline h-4 w-4 text-green-600" />
        </span>
      )
    } else if (isBetter && !isHigher) {
      // Lower and it's good (expenses)
      return (
        <span title="Better than average">
          <TrendingDown className="ml-1 inline h-4 w-4 text-green-600" />
        </span>
      )
    } else if (!isBetter && isHigher) {
      // Higher and it's bad (expenses)
      return (
        <span title="Worse than average">
          <TrendingUp className="ml-1 inline h-4 w-4 text-red-600" />
        </span>
      )
    } else {
      // Lower and it's bad (benefits)
      return (
        <span title="Worse than average">
          <TrendingDown className="ml-1 inline h-4 w-4 text-red-600" />
        </span>
      )
    }
  }

  // Helper function to compare against source plan
  const compareAgainstSource = (current: number | null, sourceValue: number | null, lowerIsBetter: boolean = true) => {
    if (current == null || sourceValue == null) return null

    const currentValue = current
    const source = sourceValue

    // Only show indicators when there's a meaningful difference (no dash for equal values)
    if (Math.abs(currentValue - source) < 0.01) {
      return null
    }

    const isHigher = currentValue > source
    const isBetter = lowerIsBetter ? currentValue < source : currentValue > source

    // For inbound (benefits): higher = green up, lower = red down
    // For outbound (expenses): lower = green down, higher = red up
    if (isBetter && isHigher) {
      // Higher and it's good (benefits)
      return (
        <span title="Better than source plan">
          <TrendingUp className="ml-1 inline h-4 w-4 text-green-600" />
        </span>
      )
    } else if (isBetter && !isHigher) {
      // Lower and it's good (expenses)
      return (
        <span title="Better than source plan">
          <TrendingDown className="ml-1 inline h-4 w-4 text-green-600" />
        </span>
      )
    } else if (!isBetter && isHigher) {
      // Higher and it's bad (expenses)
      return (
        <span title="Worse than source plan">
          <TrendingUp className="ml-1 inline h-4 w-4 text-red-600" />
        </span>
      )
    } else {
      // Lower and it's bad (benefits)
      return (
        <span title="Worse than source plan">
          <TrendingDown className="ml-1 inline h-4 w-4 text-red-600" />
        </span>
      )
    }
  }

  // Comparison field component
  const ComparisonField = ({
    label,
    values,
    results,
    lowerIsBetter = true,
    formatter = formatCurrency,
    rowId,
    requestedDefinition,
  }: {
    label: string
    values: (number | null)[]
    results: ResolutionResult[]
    lowerIsBetter?: boolean
    formatter?: (v: number | null) => string
    rowId: string
    requestedDefinition?: FieldDefinition
  }) => {
    const isHighlighted = highlightedRows.has(rowId)

    return (
      <tr
        className={`border-border cursor-pointer border-b transition-colors hover:bg-blue-500/20 ${isHighlighted ? 'bg-yellow-50 dark:bg-yellow-900/30' : ''}`}
        onClick={() => toggleRowHighlight(rowId)}
        title="Click to highlight/unhighlight this row"
      >
        <td className="bg-muted sticky left-0 z-10 min-w-48 px-3 py-2 text-sm font-medium">{label}</td>
        {values.map((value, idx) => {
          const hasDiscrep = false // No discrepancy checking needed with new schema
          const isSourcePlan = plans[idx].id === sourcePlanId
          const result = results[idx]
          const badge = getSourceBadge(result, requestedDefinition)
          return (
            <td
              key={idx}
              className={`max-w-48 px-3 py-2 text-center text-sm ${hasDiscrep ? 'border-2 border-yellow-500 bg-yellow-100 dark:bg-yellow-900/30' : ''} ${isSourcePlan ? 'border-l-4 border-l-blue-500 bg-blue-100/50 dark:bg-blue-900/30' : ''}`}
              title={
                hasDiscrep
                  ? `⚠️ Discrepancy: Metadata value differs from main field`
                  : isSourcePlan
                    ? 'Current Plan (Source)'
                    : undefined
              }
            >
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1">
                  <span>{formatter(value)}</span>
                  {!isSourcePlan && getComparisonIndicator(value, values, lowerIsBetter)}
                </div>
                {badge}
              </div>
            </td>
          )
        })}
      </tr>
    )
  }

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
        className={`bg-background border-border w-[95vw] rounded-lg border shadow-xl ${getMaxWidthClass(plans.length)} flex max-h-[90vh] flex-col overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-border flex flex-wrap items-start justify-between gap-3 border-b p-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold">Compare Plans ({plans.length})</h2>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground text-xs uppercase tracking-wide">Eligibility</span>
              {eligibilityOptions.map(({ label, value }) => {
                const isActive = eligibilityFilters.includes(value)
                return (
                  <Button
                    key={value}
                    size="sm"
                    variant={isActive ? 'default' : 'outline'}
                    onClick={() => toggleEligibility(value)}
                    className="h-7 text-xs uppercase tracking-wide"
                    aria-pressed={isActive}
                  >
                    {label}
                  </Button>
                )
              })}
              {eligibilityFilters.length === 0 && (
                <Badge variant="outline" className="border-dashed border-border/60 text-muted-foreground">
                  Medicare baseline
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button size="sm" variant="outline" onClick={onRefresh} title="Refresh plans data">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            )}
            <Button
              size="sm"
              variant={showCalculator ? 'default' : 'outline'}
              onClick={() => setShowCalculator(!showCalculator)}
            >
              <Calculator className="mr-2 h-4 w-4" />
              Cost Calculator
            </Button>
            <Button size="icon" variant="ghost" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Cost Calculator Panel */}
        {showCalculator && (
          <div className="bg-muted/30 border-border border-b p-4">
            <h3 className="mb-3 text-sm font-semibold">Estimate Annual Usage</h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
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
              <tr className="border-border border-b-2">
                <th className="bg-muted sticky top-0 left-0 z-10 min-w-48 px-3 py-3 text-left text-sm font-semibold"></th>
                {plans.map((plan, idx) => {
                  const isSourcePlan = plan.id === sourcePlanId
                  return (
                    <th
                      key={idx}
                      className={`bg-muted sticky top-0 max-w-48 px-3 py-3 text-center text-sm font-semibold ${isSourcePlan ? 'border-l-4 border-l-blue-500' : ''} hover:bg-muted/80 cursor-pointer transition-colors`}
                      onClick={() => setSourcePlanId(isSourcePlan ? null : plan.id)}
                      title={isSourcePlan ? 'Source Plan (click to deselect)' : 'Click to set as source plan'}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <div className="font-bold">{plan.name}</div>
                        {isSourcePlan && <Star className="h-4 w-4 text-blue-500" />}
                      </div>
                      <div className="text-muted-foreground text-xs font-normal">
                        {plan.carrier} •{' '}
                        {(() => {
                          // Build the plan type string from normalized fields
                          const parts = []
                          if (plan.type_network) parts.push(plan.type_network)
                          if (plan.type_extension) parts.push(plan.type_extension)
                          if (plan.type_snp) parts.push(`${plan.type_snp}-SNP`)
                          // Don't add type_program if it's already included in the SNP part
                          if (plan.type_program && plan.type_program !== 'MA' && plan.type_program !== 'SNP')
                            parts.push(plan.type_program)
                          return parts.length > 0 ? parts.join('-') : '—'
                        })()}
                      </div>
                      {plan.plan_year && (
                        <div className="text-muted-foreground text-xs font-normal">{plan.plan_year}</div>
                      )}
                      {isSourcePlan && <div className="mt-1 text-xs font-semibold text-blue-500">Source Plan</div>}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {/* Basic Information */}
              <tr
                className={`border-border cursor-pointer border-b transition-colors hover:bg-blue-500/20 ${highlightedRows.has('cms-id-full') ? 'bg-yellow-50 dark:bg-yellow-900/30' : ''}`}
                onClick={() => toggleRowHighlight('cms-id-full')}
                title="Click to highlight/unhighlight this row"
              >
                <td className="bg-muted sticky left-0 z-10 min-w-48 px-3 py-2 text-sm font-medium">CMS ID (Full)</td>
                {plans.map((plan, idx) => {
                  const isSourcePlan = plan.id === sourcePlanId
                  return (
                    <td
                      key={idx}
                      className={`max-w-48 px-3 py-2 text-center text-sm ${isSourcePlan ? 'border-l-4 border-l-blue-500 bg-blue-100/50 dark:bg-blue-900/30' : ''}`}
                    >
                      {calculateCmsId(plan) || '—'}
                    </td>
                  )
                })}
              </tr>
              <tr
                className={`border-border cursor-pointer border-b transition-colors hover:bg-blue-500/20 ${highlightedRows.has('cms-contract-number') ? 'bg-yellow-50 dark:bg-yellow-900/30' : ''}`}
                onClick={() => toggleRowHighlight('cms-contract-number')}
                title="Click to highlight/unhighlight this row"
              >
                <td className="bg-muted sticky left-0 z-10 min-w-48 px-3 py-2 text-sm font-medium">
                  CMS Contract Number
                </td>
                {plans.map((plan, idx) => {
                  const isSourcePlan = plan.id === sourcePlanId
                  return (
                    <td
                      key={idx}
                      className={`max-w-48 px-3 py-2 text-center text-sm ${isSourcePlan ? 'border-l-4 border-l-blue-500 bg-blue-100/50 dark:bg-blue-900/30' : ''}`}
                    >
                      {formatText(plan.cms_contract_number)}
                    </td>
                  )
                })}
              </tr>
              <tr
                className={`border-border cursor-pointer border-b transition-colors hover:bg-blue-500/20 ${highlightedRows.has('cms-plan-number') ? 'bg-yellow-50 dark:bg-yellow-900/30' : ''}`}
                onClick={() => toggleRowHighlight('cms-plan-number')}
                title="Click to highlight/unhighlight this row"
              >
                <td className="bg-muted sticky left-0 z-10 min-w-48 px-3 py-2 text-sm font-medium">CMS Plan Number</td>
                {plans.map((plan, idx) => {
                  const isSourcePlan = plan.id === sourcePlanId
                  return (
                    <td
                      key={idx}
                      className={`max-w-48 px-3 py-2 text-center text-sm ${isSourcePlan ? 'border-l-4 border-l-blue-500 bg-blue-100/50 dark:bg-blue-900/30' : ''}`}
                    >
                      {formatText(plan.cms_plan_number)}
                    </td>
                  )
                })}
              </tr>
              <tr
                className={`border-border cursor-pointer border-b transition-colors hover:bg-blue-500/20 ${highlightedRows.has('cms-geo-segment') ? 'bg-yellow-50 dark:bg-yellow-900/30' : ''}`}
                onClick={() => toggleRowHighlight('cms-geo-segment')}
                title="Click to highlight/unhighlight this row"
              >
                <td className="bg-muted sticky left-0 z-10 min-w-48 px-3 py-2 text-sm font-medium">CMS Geo Segment</td>
                {plans.map((plan, idx) => {
                  const isSourcePlan = plan.id === sourcePlanId
                  return (
                    <td
                      key={idx}
                      className={`max-w-48 px-3 py-2 text-center text-sm ${isSourcePlan ? 'border-l-4 border-l-blue-500 bg-blue-100/50 dark:bg-blue-900/30' : ''}`}
                    >
                      {formatText(plan.cms_geo_segment)}
                    </td>
                  )
                })}
              </tr>

              {/* Schema-Ordered Metadata Sections */}
              {getSchemaOrderedMetadataSections().map(({ section, fields }) => (
                <React.Fragment key={section.key}>
                  <tr className="bg-muted/50">
                    <th className="bg-muted sticky left-0 z-10 min-w-48 px-3 py-2 text-right text-sm font-semibold">
                      {section.title}
                    </th>
                    <td colSpan={plans.length}></td>
                  </tr>
                  {fields.map((key) => {
                    const requestedDefinition = fieldDefinitionMap.get(key)
                    const results = plans.map((plan) => getPlanResolution(plan.id, key))
                    const primitiveValues = results.map((result) => extractPrimitiveValue(result.value))
                    const isNumeric = isNumericField(key, primitiveValues)

                    if (isNumeric) {
                      const numericValues = results.map((result) => parseMetadataNumber(result.value))
                      return (
                        <ComparisonField
                          key={key}
                          label={formatLabel(key)}
                          values={numericValues}
                          results={results}
                          lowerIsBetter={isLowerBetter(key)}
                          formatter={(v) => {
                            if (v == null) return '—'
                            const lowerKey = key.toLowerCase()
                            if (lowerKey.includes('coinsurance') || lowerKey.includes('%')) {
                              return `${v}%`
                            }
                            if (lowerKey.includes('transportation_benefit')) {
                              return `${v} rides`
                            }
                            return formatCurrency(v)
                          }}
                          rowId={getRowId(key, section.key)}
                          requestedDefinition={requestedDefinition}
                        />
                      )
                    }

                    return (
                      <tr
                        key={key}
                        className={`border-border cursor-pointer border-b transition-colors hover:bg-blue-500/20 ${highlightedRows.has(getRowId(key, section.key)) ? 'bg-yellow-50 dark:bg-yellow-900/30' : ''}`}
                        onClick={() => toggleRowHighlight(getRowId(key, section.key))}
                        title="Click to highlight/unhighlight this row"
                      >
                        <td className="bg-muted sticky left-0 z-10 min-w-48 px-3 py-2 text-sm font-medium">
                          {formatLabel(key)}
                        </td>
                        {plans.map((plan, idx) => {
                          const hasDiscrep = false // No discrepancy checking needed with new schema
                          const isSourcePlan = plan.id === sourcePlanId
                          const result = results[idx]
                          const rawValue = primitiveValues[idx]
                          const displayValue = formatMetadataValue(rawValue)
                          const isLongText = isLongTextField(key, rawValue)
                          const badge = getSourceBadge(result, requestedDefinition)

                          const titleValue =
                            typeof rawValue === 'string'
                              ? rawValue
                              : typeof rawValue === 'number'
                                ? String(rawValue)
                                : undefined

                          if (isLongText && typeof rawValue === 'string' && rawValue.length > 0) {
                            return (
                              <td
                                key={idx}
                                className={`max-w-48 overflow-hidden px-3 py-2 text-center text-xs ${hasDiscrep ? 'border-2 border-yellow-500 bg-yellow-100 dark:bg-yellow-900/30' : ''} ${isSourcePlan ? 'border-l-4 border-l-blue-500 bg-blue-100/50 dark:bg-blue-900/30' : ''}`}
                                title={hasDiscrep ? `⚠️ Discrepancy: Metadata value differs from main field` : titleValue}
                              >
                                <div className="flex flex-col items-center gap-1">
                                  <div className="line-clamp-3">{displayValue}</div>
                                  {badge}
                                </div>
                              </td>
                            )
                          }

                          return (
                            <td
                              key={idx}
                              className={`max-w-48 px-3 py-2 text-center text-xs ${hasDiscrep ? 'border-2 border-yellow-500 bg-yellow-100 dark:bg-yellow-900/30' : ''} ${isSourcePlan ? 'border-l-4 border-l-blue-500 bg-blue-100/50 dark:bg-blue-900/30' : ''}`}
                              title={hasDiscrep ? `⚠️ Discrepancy: Metadata value differs from main field` : titleValue}
                            >
                              <div className="flex flex-col items-center gap-1">
                                <span>{displayValue}</span>
                                {badge}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </React.Fragment>
              ))}

              {/* Estimated Annual Cost */}
              {showCalculator && (
                <>
                  <tr className="bg-muted/50">
                    <th className="bg-muted sticky left-0 z-10 min-w-48 px-3 py-2 text-right text-sm font-semibold">
                      Estimated Annual Cost
                    </th>
                    <td colSpan={plans.length}></td>
                  </tr>
                  <tr
                    className={`border-border cursor-pointer border-b-2 bg-blue-50 dark:bg-blue-950/30 ${highlightedRows.has('annual-cost') ? 'bg-yellow-50 dark:bg-yellow-900/30' : ''}`}
                    onClick={() => toggleRowHighlight('annual-cost')}
                    title="Click to highlight/unhighlight this row"
                  >
                    <td className="bg-muted sticky left-0 z-10 min-w-48 px-3 py-3 text-sm font-bold">
                      Total Estimated Annual Cost
                    </td>
                    {annualCosts.map((cost, idx) => {
                      const isSourcePlan = plans[idx].id === sourcePlanId
                      return (
                        <td
                          key={idx}
                          className={`px-3 py-3 text-center text-sm font-bold ${cost === lowestCost ? 'text-green-600' : ''} ${isSourcePlan ? 'border-l-4 border-l-blue-500 bg-blue-100/50 dark:bg-blue-900/30' : ''}`}
                        >
                          {formatCurrency(cost)}
                          {cost === lowestCost && ' ★'}
                        </td>
                      )
                    })}
                  </tr>
                </>
              )}

              {/* Additional Database Fields */}
              <tr
                className={`border-border cursor-pointer border-b transition-colors hover:bg-blue-500/20 ${highlightedRows.has('counties') ? 'bg-yellow-50 dark:bg-yellow-900/30' : ''}`}
                onClick={() => toggleRowHighlight('counties')}
                title="Click to highlight/unhighlight this row"
              >
                <td className="bg-muted sticky left-0 z-10 min-w-48 px-3 py-2 text-sm font-medium">Counties</td>
                {plans.map((plan, idx) => {
                  const isSourcePlan = plan.id === sourcePlanId
                  return (
                    <td
                      key={idx}
                      className={`max-w-48 overflow-hidden px-3 py-2 text-center text-xs ${isSourcePlan ? 'border-l-4 border-l-blue-500 bg-blue-100/50 dark:bg-blue-900/30' : ''}`}
                    >
                      <div className="line-clamp-3" title={plan.counties?.join(', ')}>
                        {plan.counties?.join(', ') || '—'}
                      </div>
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="border-border bg-muted/30 border-t p-4">
          <div className="text-muted-foreground flex items-center gap-6 text-xs">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span>Better than {sourcePlanId ? 'source plan' : 'average'}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span>Worse than {sourcePlanId ? 'source plan' : 'average'}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block h-4 w-4 rounded border border-yellow-500 bg-yellow-100 dark:bg-yellow-900/30"></span>
              <span>⚠️ Discrepancy with main field</span>
            </div>
            {sourcePlanId && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-blue-500" />
                <span>Source plan (click column header to change)</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <span className="inline-block h-4 w-4 rounded border border-yellow-400 bg-yellow-50 dark:bg-yellow-900/30"></span>
              <span>Click row to highlight (multiple rows)</span>
            </div>
            {showCalculator && <div className="ml-auto font-semibold">★ = Lowest estimated annual cost</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
