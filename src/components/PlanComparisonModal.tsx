'use client'

import React, { useState, useEffect } from 'react'
import { X, TrendingUp, TrendingDown, Calculator } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Database } from '@/lib/supabase'
import { calculateCmsId } from '@/lib/plan-utils'
import { getPlanMetadata } from '@/lib/plan-metadata-utils'

type Plan = Database['public']['Tables']['plans']['Row']

interface PlanComparisonModalProps {
  isOpen: boolean
  onClose: () => void
  plans: Plan[]
}

interface UsageInputs {
  primaryCareVisits: number
  specialistVisits: number
  emergencyRoomVisits: number
  urgentCareVisits: number
  hospitalStays: number
  ambulanceUses: number
}

export default function PlanComparisonModal({ isOpen, onClose, plans }: PlanComparisonModalProps) {
  const [usageInputs, setUsageInputs] = useState<UsageInputs>({
    primaryCareVisits: 4,
    specialistVisits: 2,
    emergencyRoomVisits: 0,
    urgentCareVisits: 1,
    hospitalStays: 0,
    ambulanceUses: 0,
  })

  const [showCalculator, setShowCalculator] = useState(false)

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

  // Helper to format numbers
  const formatNumber = (value: number | null | undefined): string => {
    if (value == null) return '—'
    return String(value)
  }

  // Helper to format dates
  const formatDate = (value: string | null | undefined): string => {
    if (!value) return '—'
    try {
      return new Date(value).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        timeZone: 'UTC'
      })
    } catch {
      return '—'
    }
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

  // Collect all unique metadata keys across all plans
  const getAllMetadataKeys = (): string[] => {
    const keysSet = new Set<string>()
    plans.forEach(plan => {
      if (plan.metadata && typeof plan.metadata === 'object') {
        Object.keys(plan.metadata as Record<string, unknown>).forEach(key => keysSet.add(key))
      }
    })
    return Array.from(keysSet).sort()
  }

  // Categorize metadata keys
  const categorizeMetadataKeys = () => {
    const allKeys = getAllMetadataKeys()
    const categories: Record<string, string[]> = {
      'Deductibles & Cost Sharing': [],
      'Additional Benefits': [],
      'Copays & Coinsurance': [],
      'Prescription Drug Details': [],
      'Service Details': [],
      'Optional Packages': [],
      'Document Information': [],
      'Other': []
    }

    allKeys.forEach(key => {
      const lowerKey = key.toLowerCase()
      
      // Categorize based on key patterns
      if (lowerKey.includes('deductible')) {
        categories['Deductibles & Cost Sharing'].push(key)
      } else if (lowerKey.includes('benefit') || lowerKey.includes('card_benefit') || 
                 lowerKey.includes('fitness') || lowerKey.includes('transportation') ||
                 lowerKey.includes('meals') || lowerKey.includes('telehealth') ||
                 lowerKey.includes('livehealth') || lowerKey.includes('nurseline') ||
                 lowerKey.includes('worldwide')) {
        categories['Additional Benefits'].push(key)
      } else if (lowerKey.includes('copay') || lowerKey.includes('coinsurance') ||
                 lowerKey.includes('ambulance') || lowerKey.includes('emergency') ||
                 lowerKey.includes('therapy') || lowerKey.includes('xray') ||
                 lowerKey.includes('radiology') || lowerKey.includes('surgical') ||
                 lowerKey.includes('lab') || lowerKey.includes('dme') ||
                 lowerKey.includes('diabetic') || lowerKey.includes('hearing_exam') ||
                 lowerKey.includes('podiatry') || lowerKey.includes('dialysis') ||
                 lowerKey.includes('acupuncture') || lowerKey.includes('chiropractic')) {
        categories['Copays & Coinsurance'].push(key)
      } else if (lowerKey.includes('tier') || lowerKey.includes('insulin') ||
                 lowerKey.includes('catastrophic') || lowerKey.includes('part_d') ||
                 lowerKey.includes('rx') || lowerKey.includes('pharmacy')) {
        categories['Prescription Drug Details'].push(key)
      } else if (lowerKey.includes('inpatient') || lowerKey.includes('hospital') ||
                 lowerKey.includes('mental_health') || lowerKey.includes('skilled_nursing') ||
                 lowerKey.includes('home_health') || lowerKey.includes('cardiac') ||
                 lowerKey.includes('pulmonary')) {
        categories['Service Details'].push(key)
      } else if (lowerKey.includes('osb') || lowerKey.includes('package') ||
                 lowerKey.includes('supplemental')) {
        categories['Optional Packages'].push(key)
      } else if (lowerKey.includes('document') || lowerKey.includes('source') ||
                 lowerKey.includes('star_rating') || lowerKey.includes('updated') ||
                 lowerKey.includes('code') || lowerKey.includes('transitioned') ||
                 lowerKey.includes('medicaid_eligibility')) {
        categories['Document Information'].push(key)
      } else {
        categories['Other'].push(key)
      }
    })

    // Remove empty categories
    return Object.entries(categories).filter(([, keys]) => keys.length > 0)
  }

  // Format metadata value for display
  const formatMetadataValue = (value: string | number | null): string => {
    if (value == null) return '—'
    if (typeof value === 'number') return String(value)
    if (value === 'n/a' || value === 'N/A') return '—'
    return value
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
    const premium = (getPlanMetadata.premiumMonthly(plan) ?? 0) * 12
    const giveback = (getPlanMetadata.givebackMonthly(plan) ?? 0) * 12
    
    const primaryCareCosts = (getPlanMetadata.primaryCareCopay(plan) ?? 0) * usageInputs.primaryCareVisits
    const specialistCosts = (getPlanMetadata.specialistCopay(plan) ?? 0) * usageInputs.specialistVisits
    const erCosts = (getPlanMetadata.emergencyRoomCopay(plan) ?? 0) * usageInputs.emergencyRoomVisits
    const urgentCareCosts = (getPlanMetadata.urgentCareCopay(plan) ?? 0) * usageInputs.urgentCareVisits
    // Hospital cost = daily copay * days covered per stay * number of stays
    const daysPerStay = getPlanMetadata.hospitalInpatientDays(plan) ?? 0
    const hospitalCosts = (getPlanMetadata.hospitalInpatientPerDayCopay(plan) ?? 0) * daysPerStay * usageInputs.hospitalStays
    const ambulanceCosts = (getPlanMetadata.ambulanceCopay(plan) ?? 0) * usageInputs.ambulanceUses

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
    <tr className="border-b border-border">
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-background border border-border rounded-lg shadow-xl w-[95vw] max-w-7xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-semibold">Compare Plans ({plans.length})</h2>
          <div className="flex items-center gap-2">
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
                <th className="py-3 px-3 text-left font-semibold text-sm bg-muted/50 sticky top-0">Field</th>
                {plans.map((plan, idx) => (
                  <th key={idx} className="py-3 px-3 text-center font-semibold text-sm bg-muted/50 sticky top-0 max-w-48">
                    <div className="font-bold">{plan.name}</div>
                    <div className="text-xs font-normal text-muted-foreground">
                      {plan.carrier} • {plan.plan_type}
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
              <tr className="bg-muted/50">
                <th className="py-2 px-3 font-semibold text-sm text-right">
                  Basic Information
                </th>
                <td colSpan={plans.length}></td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 px-3 font-medium text-sm bg-muted/30">CMS ID (Full)</td>
                {plans.map((plan, idx) => (
                  <td key={idx} className="py-2 px-3 text-center text-sm max-w-48">
                    {calculateCmsId(plan) || '—'}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 px-3 font-medium text-sm bg-muted/30">CMS Contract Number</td>
                {plans.map((plan, idx) => (
                  <td key={idx} className="py-2 px-3 text-center text-sm max-w-48">
                    {formatText(plan.cms_contract_number)}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 px-3 font-medium text-sm bg-muted/30">CMS Plan Number</td>
                {plans.map((plan, idx) => (
                  <td key={idx} className="py-2 px-3 text-center text-sm max-w-48">
                    {formatText(plan.cms_plan_number)}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 px-3 font-medium text-sm bg-muted/30">CMS Geo Segment</td>
                {plans.map((plan, idx) => (
                  <td key={idx} className="py-2 px-3 text-center text-sm max-w-48">
                    {formatText(plan.cms_geo_segment)}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 px-3 font-medium text-sm bg-muted/30">Effective Start</td>
                {plans.map((plan, idx) => (
                  <td key={idx} className="py-2 px-3 text-center text-sm max-w-48">
                    {formatDate(getPlanMetadata.effectiveStart(plan))}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 px-3 font-medium text-sm bg-muted/30">Effective End</td>
                {plans.map((plan, idx) => (
                  <td key={idx} className="py-2 px-3 text-center text-sm max-w-48">
                    {formatDate(getPlanMetadata.effectiveEnd(plan))}
                  </td>
                ))}
              </tr>

              {/* Monthly Costs */}
              <tr className="bg-muted/50">
                <th className="py-2 px-3 font-semibold text-sm text-right">
                  Monthly Costs
                </th>
                <td colSpan={plans.length}></td>
              </tr>
              <ComparisonField
                label="Premium (Monthly)"
                values={plans.map(p => getPlanMetadata.premiumMonthly(p))}
                lowerIsBetter={true}
              />
              <ComparisonField
                label="Giveback (Monthly)"
                values={plans.map(p => getPlanMetadata.givebackMonthly(p))}
                lowerIsBetter={false}
              />
              <ComparisonField
                label="Net Monthly Cost"
                values={plans.map(p => (getPlanMetadata.premiumMonthly(p) ?? 0) - (getPlanMetadata.givebackMonthly(p) ?? 0))}
                lowerIsBetter={true}
              />

              {/* Benefits */}
              <tr className="bg-muted/50">
                <th className="py-2 px-3 font-semibold text-sm text-right">
                  Supplemental Benefits
                </th>
                <td colSpan={plans.length}></td>
              </tr>
              <ComparisonField
                label="OTC Benefit (Quarterly)"
                values={plans.map(p => getPlanMetadata.otcBenefitQuarterly(p))}
                lowerIsBetter={false}
              />
              <ComparisonField
                label="Dental Benefit (Yearly)"
                values={plans.map(p => getPlanMetadata.dentalBenefitYearly(p))}
                lowerIsBetter={false}
              />
              <ComparisonField
                label="Hearing Benefit (Yearly)"
                values={plans.map(p => getPlanMetadata.hearingBenefitYearly(p))}
                lowerIsBetter={false}
              />
              <ComparisonField
                label="Vision Benefit (Yearly)"
                values={plans.map(p => getPlanMetadata.visionBenefitYearly(p))}
                lowerIsBetter={false}
              />

              {/* Dynamic Metadata Sections */}
              {categorizeMetadataKeys().map(([categoryName, keys]) => (
                <React.Fragment key={categoryName}>
                  <tr className="bg-muted/50">
                    <th className="py-2 px-3 font-semibold text-sm text-right">
                      {categoryName}
                    </th>
                    <td colSpan={plans.length}></td>
                  </tr>
                  {keys.map(key => {
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
                        <tr key={key} className="border-b border-border">
                          <td className="py-2 px-3 font-medium text-sm bg-muted/30">
                            {formatLabel(key)}
                          </td>
                          {plans.map((plan, idx) => {
                            const hasDiscrep = false // No discrepancy checking needed with new schema
                            return (
                              <td 
                                key={idx} 
                                className={`py-2 px-3 text-center text-xs max-w-48 ${hasDiscrep ? 'bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-500' : ''}`}
                                title={hasDiscrep ? `⚠️ Discrepancy: Metadata value differs from main field` : undefined}
                              >
                                {formatMetadataValue(getMetadata(plan, key))}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    }
                  })}
                </React.Fragment>
              ))}

              {/* Medical Copays */}
              <tr className="bg-muted/50">
                <th className="py-2 px-3 font-semibold text-sm text-right">
                  Medical Copays
                </th>
                <td colSpan={plans.length}></td>
              </tr>
              <ComparisonField
                label="Primary Care Copay"
                values={plans.map(p => getPlanMetadata.primaryCareCopay(p))}
                lowerIsBetter={true}
              />
              <ComparisonField
                label="Specialist Copay"
                values={plans.map(p => getPlanMetadata.specialistCopay(p))}
                lowerIsBetter={true}
              />
              <ComparisonField
                label="Emergency Room Copay"
                values={plans.map(p => getPlanMetadata.emergencyRoomCopay(p))}
                lowerIsBetter={true}
              />
              <ComparisonField
                label="Urgent Care Copay"
                values={plans.map(p => getPlanMetadata.urgentCareCopay(p))}
                lowerIsBetter={true}
              />
              <ComparisonField
                label="Ambulance Copay"
                values={plans.map(p => getPlanMetadata.ambulanceCopay(p))}
                lowerIsBetter={true}
              />

              {/* Hospital */}
              <tr className="bg-muted/50">
                <th className="py-2 px-3 font-semibold text-sm text-right">
                  Hospital Coverage
                </th>
                <td colSpan={plans.length}></td>
              </tr>
              <ComparisonField
                label="Inpatient Copay (Per Day)"
                values={plans.map(p => getPlanMetadata.hospitalInpatientPerDayCopay(p))}
                lowerIsBetter={true}
              />
              <ComparisonField
                label="Inpatient Days Covered"
                values={plans.map(p => getPlanMetadata.hospitalInpatientDays(p))}
                lowerIsBetter={false}
                formatter={formatNumber}
              />
              <ComparisonField
                label="Total Copay Per Stay"
                values={plans.map(p => 
                  (getPlanMetadata.hospitalInpatientPerDayCopay(p) ?? 0) * (getPlanMetadata.hospitalInpatientDays(p) ?? 0) || null
                )}
                lowerIsBetter={true}
              />
              <ComparisonField
                label="MOOP (Annual)"
                values={plans.map(p => getPlanMetadata.moopAnnual(p))}
                lowerIsBetter={true}
              />


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

              {/* Service Area & Notes */}
              <tr className="bg-muted/50">
                <th className="py-2 px-3 font-semibold text-sm text-right">
                  Service Area & Notes
                </th>
                <td colSpan={plans.length}></td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 px-3 font-medium text-sm bg-muted/30">Service Area</td>
                {plans.map((plan, idx) => (
                  <td key={idx} className="py-2 px-3 text-center text-sm max-w-48">
                    {getPlanMetadata.serviceArea(plan) || '—'}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 px-3 font-medium text-sm bg-muted/30">Counties</td>
                {plans.map((plan, idx) => (
                  <td key={idx} className="py-2 px-3 text-center text-xs max-w-48 overflow-hidden">
                    <div className="line-clamp-3" title={plan.counties?.join(', ')}>
                      {plan.counties?.join(', ') || '—'}
                    </div>
                  </td>
                ))}
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 px-3 font-medium text-sm bg-muted/30">Notes</td>
                {plans.map((plan, idx) => (
                  <td key={idx} className="py-2 px-3 text-center text-xs max-w-48 overflow-hidden">
                    <div className="line-clamp-3" title={getPlanMetadata.notes(plan) || undefined}>
                      {getPlanMetadata.notes(plan) || '—'}
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



