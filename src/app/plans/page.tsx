'use client'

import React, { useMemo, useRef, useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'
import { usePlans } from '@/hooks/usePlans'
import { calculateCmsId } from '@/lib/plan-utils'
import { buildMetadata, extractMetadataForForm } from '@/lib/plan-metadata-utils'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Enums } from '@/lib/supabase-types'
import { AgGridReact } from 'ag-grid-react'
import { AllCommunityModule, ColDef, GridReadyEvent, ICellRendererParams, ModuleRegistry, Theme, themeQuartz, colorSchemeDark } from 'ag-grid-community'
import type { Database } from '@/lib/supabase'
import { Pencil, Trash2, Scale, Copy } from 'lucide-react'
import ModalForm from '@/components/ui/modal-form'
import PlanComparisonModal from '@/components/PlanComparisonModal'
import { useTheme } from '@/contexts/ThemeContext'

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule])

type Carrier = Enums<'carrier'>
type PlanType = Enums<'plan_type'>

const carrierOptions: Carrier[] = [
  'Aetna',
  'Anthem',
  'CareSource',
  'Devoted',
  'GTL',
  'Heartland',
  'Humana',
  'Medico',
  'MedMutual',
  'SummaCare',
  'United',
  'Zing',
  'Other',
]

const planTypeOptions: PlanType[] = [
  'Ancillary',
  'C-SNP',
  'D-SNP',
  'HMO-D-SNP',
  'HMO-POS-C-SNP',
  'HMO-POS-D-SNP',
  'HMO-POS',
  'HMO',
  'PDP',
  'PPO',
  'Supplement',
]

export default function PlansPage() {
  const { plans, loading, error, createPlan, updatePlan, deletePlan, deletePlans } = usePlans()
  const { theme } = useTheme()

  // Create theme object for AG Grid v34+ Theming API (client-side only)
  const [agGridTheme, setAgGridTheme] = useState<Theme | undefined>(undefined)
  
  useEffect(() => {
    const isDark = theme === 'dark' || (theme === 'system' && 
      window.matchMedia('(prefers-color-scheme: dark)').matches)
    
    // Use modern AG Grid v34+ Theming API
    setAgGridTheme(isDark ? themeQuartz.withPart(colorSchemeDark) : themeQuartz)
  }, [theme])

  const [isAdding, setIsAdding] = useState(false)
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([])
  const [showComparison, setShowComparison] = useState(false)
  const [form, setForm] = useState({
    name: '',
    plan_type: '' as PlanType | '',
    carrier: '' as Carrier | '',
    plan_year: new Date().getUTCFullYear().toString(),
    cms_contract_number: '',
    cms_plan_number: '',
    cms_geo_segment: '',
    effective_start: '',
    effective_end: '',
    premium_monthly: '',
    giveback_monthly: '',
    otc_benefit_quarterly: '',
    dental_benefit_yearly: '',
    hearing_benefit_yearly: '',
    vision_benefit_yearly: '',
    primary_care_copay: '',
    specialist_copay: '',
    hospital_inpatient_per_day_copay: '',
    hospital_inpatient_days: '',
    moop_annual: '',
    ambulance_copay: '',
    emergency_room_copay: '',
    urgent_care_copay: '',
    pharmacy_benefit: '',
    service_area: '',
    counties: '', // comma-separated
    notes: '',
    // Metadata fields
    card_benefit: '',
    fitness_benefit: '',
    transportation_benefit: '',
    medical_deductible: '',
    rx_deductible_tier345: '',
    rx_cost_share: '',
    medicaid_eligibility: '',
    transitioned_from: '',
    summary: '',
  })

  const gridRef = useRef<AgGridReact>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    plan_type: '' as PlanType | '',
    carrier: '' as Carrier | '',
    plan_year: new Date().getUTCFullYear().toString(),
    cms_contract_number: '',
    cms_plan_number: '',
    cms_geo_segment: '',
    effective_start: '',
    effective_end: '',
    premium_monthly: '',
    giveback_monthly: '',
    otc_benefit_quarterly: '',
    dental_benefit_yearly: '',
    hearing_benefit_yearly: '',
    vision_benefit_yearly: '',
    primary_care_copay: '',
    specialist_copay: '',
    hospital_inpatient_per_day_copay: '',
    hospital_inpatient_days: '',
    moop_annual: '',
    ambulance_copay: '',
    emergency_room_copay: '',
    urgent_care_copay: '',
    pharmacy_benefit: '',
    service_area: '',
    counties: '',
    notes: '',
    // Metadata fields
    card_benefit: '',
    fitness_benefit: '',
    transportation_benefit: '',
    medical_deductible: '',
    rx_deductible_tier345: '',
    rx_cost_share: '',
    medicaid_eligibility: '',
    transitioned_from: '',
    summary: '',
  })

  const sortedPlans = useMemo(() => {
    return [...plans].sort((a, b) => {
      const ay = a.plan_year ?? 0
      const by = b.plan_year ?? 0
      if (ay !== by) return by - ay
      const ac = (a.carrier ?? '').toString().toLowerCase()
      const bc = (b.carrier ?? '').toString().toLowerCase()
      const c = ac.localeCompare(bc)
      if (c !== 0) return c
      return a.name.localeCompare(b.name)
    })
  }, [plans])

  const onSelectionChanged = () => {
    if (!gridRef.current) return
    
    const selectedNodes = gridRef.current.api.getSelectedNodes()
    const selectedIds = selectedNodes.map(node => node.data?.id).filter(Boolean) as string[]
    setSelectedPlanIds(selectedIds)
  }

  const selectedPlans = useMemo(() => {
    return plans.filter((p) => selectedPlanIds.includes(p.id))
  }, [plans, selectedPlanIds])

  const columnDefs: ColDef[] = useMemo(
    () => [
      {
        headerName: '',
        field: 'select',
        minWidth: 50,
        maxWidth: 50,
        checkboxSelection: true,
        headerCheckboxSelection: true,
        headerCheckboxSelectionFilteredOnly: true,
        pinned: 'left',
      },
      {
        field: 'name',
        headerName: 'Plan',
        sortable: true,
        filter: true,
        minWidth: 220,
        flex: 2,
      },
      {
        field: 'carrier',
        headerName: 'Carrier',
        sortable: true,
        filter: true,
        minWidth: 140,
      },
      {
        field: 'plan_type',
        headerName: 'Type',
        sortable: true,
        filter: true,
        minWidth: 120,
      },
      {
        field: 'plan_year',
        headerName: 'Year',
        sortable: true,
        filter: 'agNumberColumnFilter',
        minWidth: 110,
        valueFormatter: (p) => (p.value == null ? '—' : String(p.value)),
      },
      {
        headerName: 'CMS ID',
        minWidth: 150,
        valueGetter: (p) => {
          return calculateCmsId(p.data) || '—'
        },
        sortable: true, // Selecting a row has the side-effect of resetting sort
        filter: true,
      },
      {
        headerName: 'Actions',
        minWidth: 150,
        maxWidth: 170,
        cellRenderer: (p: ICellRendererParams<Database['public']['Tables']['plans']['Row']>) => {
          const planId: string | undefined = p.data?.id
          if (!planId) return ''
          const openEdit = () => {
            const plan = p.data
            if (!plan) return
            setEditingId(plan.id)
            
            // Extract all form data from plan using the helper function
            const formData = extractMetadataForForm(plan)
            
            setEditForm({
              name: String(formData.name ?? ''),
              plan_type: (formData.plan_type as PlanType) ?? '',
              carrier: (formData.carrier as Carrier) ?? '',
              plan_year: formData.plan_year != null ? String(formData.plan_year) : '',
              cms_contract_number: String(formData.cms_contract_number ?? ''),
              cms_plan_number: String(formData.cms_plan_number ?? ''),
              cms_geo_segment: String(formData.cms_geo_segment ?? ''),
              effective_start: String(formData.effective_start ?? ''),
              effective_end: String(formData.effective_end ?? ''),
              premium_monthly: formData.premium_monthly != null ? String(formData.premium_monthly) : '',
              giveback_monthly: formData.giveback_monthly != null ? String(formData.giveback_monthly) : '',
              otc_benefit_quarterly: formData.otc_benefit_quarterly != null ? String(formData.otc_benefit_quarterly) : '',
              dental_benefit_yearly: formData.dental_benefit_yearly != null ? String(formData.dental_benefit_yearly) : '',
              hearing_benefit_yearly: formData.hearing_benefit_yearly != null ? String(formData.hearing_benefit_yearly) : '',
              vision_benefit_yearly: formData.vision_benefit_yearly != null ? String(formData.vision_benefit_yearly) : '',
              primary_care_copay: formData.primary_care_copay != null ? String(formData.primary_care_copay) : '',
              specialist_copay: formData.specialist_copay != null ? String(formData.specialist_copay) : '',
              hospital_inpatient_per_day_copay: formData.hospital_inpatient_per_day_copay != null ? String(formData.hospital_inpatient_per_day_copay) : '',
              hospital_inpatient_days: formData.hospital_inpatient_days != null ? String(formData.hospital_inpatient_days) : '',
              moop_annual: formData.moop_annual != null ? String(formData.moop_annual) : '',
              ambulance_copay: formData.ambulance_copay != null ? String(formData.ambulance_copay) : '',
              emergency_room_copay: formData.emergency_room_copay != null ? String(formData.emergency_room_copay) : '',
              urgent_care_copay: formData.urgent_care_copay != null ? String(formData.urgent_care_copay) : '',
              pharmacy_benefit: String(formData.pharmacy_benefit ?? ''),
              service_area: String(formData.service_area ?? ''),
              counties: Array.isArray(formData.counties) ? formData.counties.join(', ') : String(formData.counties ?? ''),
              notes: String(formData.notes ?? ''),
              // Extended metadata fields
              card_benefit: formData.card_benefit != null ? String(formData.card_benefit) : '',
              fitness_benefit: formData.fitness_benefit != null ? String(formData.fitness_benefit) : '',
              transportation_benefit: formData.transportation_benefit != null ? String(formData.transportation_benefit) : '',
              medical_deductible: formData.medical_deductible != null ? String(formData.medical_deductible) : '',
              rx_deductible_tier345: formData.rx_deductible_tier345 != null ? String(formData.rx_deductible_tier345) : '',
              rx_cost_share: String(formData.rx_cost_share ?? ''),
              medicaid_eligibility: String(formData.medicaid_eligibility ?? ''),
              transitioned_from: String(formData.transitioned_from ?? ''),
              summary: String(formData.summary ?? ''),
            })
            setIsEditing(true)
          }
          const handleDelete = async () => {
            if (confirm('Delete this plan?')) {
              await deletePlan(planId)
            }
          }
          const handleCopy = () => {
            const plan = p.data
            if (!plan) return
            
            // Extract all form data from plan using the helper function
            const formData = extractMetadataForForm(plan)
            
            // Populate the add plan form with the plan data
            setForm({
              name: String(formData.name ?? ''),
              plan_type: (formData.plan_type as PlanType) ?? '',
              carrier: (formData.carrier as Carrier) ?? '',
              plan_year: formData.plan_year != null ? String(Number(formData.plan_year) + 1) : new Date().getUTCFullYear().toString(),
              cms_contract_number: String(formData.cms_contract_number ?? ''),
              cms_plan_number: String(formData.cms_plan_number ?? ''),
              cms_geo_segment: String(formData.cms_geo_segment ?? ''),
              effective_start: String(formData.effective_start ?? ''),
              effective_end: String(formData.effective_end ?? ''),
              premium_monthly: formData.premium_monthly != null ? String(formData.premium_monthly) : '',
              giveback_monthly: formData.giveback_monthly != null ? String(formData.giveback_monthly) : '',
              otc_benefit_quarterly: formData.otc_benefit_quarterly != null ? String(formData.otc_benefit_quarterly) : '',
              dental_benefit_yearly: formData.dental_benefit_yearly != null ? String(formData.dental_benefit_yearly) : '',
              hearing_benefit_yearly: formData.hearing_benefit_yearly != null ? String(formData.hearing_benefit_yearly) : '',
              vision_benefit_yearly: formData.vision_benefit_yearly != null ? String(formData.vision_benefit_yearly) : '',
              primary_care_copay: formData.primary_care_copay != null ? String(formData.primary_care_copay) : '',
              specialist_copay: formData.specialist_copay != null ? String(formData.specialist_copay) : '',
              hospital_inpatient_per_day_copay: formData.hospital_inpatient_per_day_copay != null ? String(formData.hospital_inpatient_per_day_copay) : '',
              hospital_inpatient_days: formData.hospital_inpatient_days != null ? String(formData.hospital_inpatient_days) : '',
              moop_annual: formData.moop_annual != null ? String(formData.moop_annual) : '',
              ambulance_copay: formData.ambulance_copay != null ? String(formData.ambulance_copay) : '',
              emergency_room_copay: formData.emergency_room_copay != null ? String(formData.emergency_room_copay) : '',
              urgent_care_copay: formData.urgent_care_copay != null ? String(formData.urgent_care_copay) : '',
              pharmacy_benefit: String(formData.pharmacy_benefit ?? ''),
              service_area: String(formData.service_area ?? ''),
              counties: Array.isArray(formData.counties) ? formData.counties.join(', ') : String(formData.counties ?? ''),
              notes: String(formData.notes ?? ''),
              // Extended metadata fields
              card_benefit: formData.card_benefit != null ? String(formData.card_benefit) : '',
              fitness_benefit: formData.fitness_benefit != null ? String(formData.fitness_benefit) : '',
              transportation_benefit: formData.transportation_benefit != null ? String(formData.transportation_benefit) : '',
              medical_deductible: formData.medical_deductible != null ? String(formData.medical_deductible) : '',
              rx_deductible_tier345: formData.rx_deductible_tier345 != null ? String(formData.rx_deductible_tier345) : '',
              rx_cost_share: String(formData.rx_cost_share ?? ''),
              medicaid_eligibility: String(formData.medicaid_eligibility ?? ''),
              transitioned_from: String(formData.transitioned_from ?? ''),
              summary: String(formData.summary ?? ''),
            })
            // Open the add plan form
            setIsAdding(true)
          }
          return (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button size="icon" variant="ghost" aria-label="Copy plan" title="Copy to next year" onClick={handleCopy}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" aria-label="Edit plan" title="Edit" onClick={openEdit}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" aria-label="Delete plan" title="Delete" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )
        },
        pinned: 'right',
      },
    ],
        [deletePlan]
  )

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      flex: 1,
      sortable: true,
    }),
    []
  )

  function onGridReady(params: GridReadyEvent) {
    params.api.sizeColumnsToFit()
  }

  const handleCreate = async () => {
    if (!form.name) return
    
    // Build metadata object from form fields using the helper function
    const metadata = buildMetadata(form)
    
    const data = {
      name: form.name,
      plan_type: (form.plan_type as PlanType) || null,
      carrier: (form.carrier as Carrier) || null,
      plan_year: form.plan_year ? Number(form.plan_year) : null,
      cms_contract_number: form.cms_contract_number || null,
      cms_plan_number: form.cms_plan_number || null,
      cms_geo_segment: form.cms_geo_segment || null,
      counties: form.counties
        ? form.counties
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : null,
      metadata: Object.keys(metadata).length > 0 ? (metadata as Database['public']['Tables']['plans']['Insert']['metadata']) : null,
    }

    const ok = await createPlan(data)
    if (ok) {
      setIsAdding(false)
      setForm({
        name: '',
        plan_type: '',
        carrier: '',
        plan_year: new Date().getUTCFullYear().toString(),
        cms_contract_number: '',
        cms_plan_number: '',
        cms_geo_segment: '',
        effective_start: '',
        effective_end: '',
        premium_monthly: '',
        giveback_monthly: '',
        otc_benefit_quarterly: '',
        dental_benefit_yearly: '',
        hearing_benefit_yearly: '',
        vision_benefit_yearly: '',
        primary_care_copay: '',
        specialist_copay: '',
        hospital_inpatient_per_day_copay: '',
        hospital_inpatient_days: '',
        moop_annual: '',
        ambulance_copay: '',
        emergency_room_copay: '',
        urgent_care_copay: '',
        pharmacy_benefit: '',
        service_area: '',
        counties: '',
        notes: '',
        card_benefit: '',
        fitness_benefit: '',
        transportation_benefit: '',
        medical_deductible: '',
        rx_deductible_tier345: '',
        rx_cost_share: '',
        medicaid_eligibility: '',
        transitioned_from: '',
        summary: '',
      })
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return
    
    // Build metadata object from form fields using the helper function
    const metadata = buildMetadata(editForm)
    
    const data = {
      name: editForm.name,
      plan_type: (editForm.plan_type as PlanType) || null,
      carrier: (editForm.carrier as Carrier) || null,
      plan_year: editForm.plan_year ? Number(editForm.plan_year) : null,
      cms_contract_number: editForm.cms_contract_number || null,
      cms_plan_number: editForm.cms_plan_number || null,
      cms_geo_segment: editForm.cms_geo_segment || null,
      counties: editForm.counties
        ? editForm.counties
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : null,
      metadata: Object.keys(metadata).length > 0 ? (metadata as Database['public']['Tables']['plans']['Insert']['metadata']) : null,
    }
    const ok = await updatePlan(editingId, data)
    if (ok) {
      setIsEditing(false)
      setEditingId(null)
    }
  }

  return (
    <div className="bg-background min-h-screen">
      <Navigation pageTitle="Plans" />

      <div className="p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Plans Catalog</h2>
            <div className="flex items-center gap-2">
              {selectedPlanIds.length >= 2 && (
                <Button size="sm" variant="outline" onClick={() => setShowComparison(true)}>
                  <Scale className="h-4 w-4 mr-2" />
                  Compare ({selectedPlanIds.length})
                </Button>
              )}
            {selectedPlanIds.length > 1 && (
              <Button
                size="sm"
                variant="destructive"
                onClick={async () => {
                  if (!confirm(`Delete ${selectedPlanIds.length} selected plans?`)) return
                  const ok = await deletePlans(selectedPlanIds)
                  if (ok) {
                    setSelectedPlanIds([])
                    if (gridRef.current) gridRef.current.api.deselectAll()
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete ({selectedPlanIds.length})
              </Button>
            )}
              {!isAdding && (
                <Button size="sm" onClick={() => setIsAdding(true)}>
                  Add Plan
                </Button>
              )}
            </div>
          </div>

          {isAdding && (
            <div className="rounded border p-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">Name</Label>
                  <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Plan Type</Label>
                  <select
                    className="bg-background w-full rounded border p-2 text-sm"
                    value={form.plan_type}
                    onChange={(e) => setForm((f) => ({ ...f, plan_type: e.target.value as PlanType }))}
                  >
                    <option value="">—</option>
                    {planTypeOptions.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Carrier</Label>
                  <select
                    className="bg-background w-full rounded border p-2 text-sm"
                    value={form.carrier}
                    onChange={(e) => setForm((f) => ({ ...f, carrier: e.target.value as Carrier }))}
                  >
                    <option value="">—</option>
                    {carrierOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Year</Label>
                  <Input
                    type="number"
                    value={form.plan_year}
                    onChange={(e) => setForm((f) => ({ ...f, plan_year: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">CMS Contract</Label>
                  <Input
                    value={form.cms_contract_number}
                    onChange={(e) => setForm((f) => ({ ...f, cms_contract_number: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">CMS Plan</Label>
                  <Input
                    value={form.cms_plan_number}
                    onChange={(e) => setForm((f) => ({ ...f, cms_plan_number: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">CMS Geo Segment</Label>
                  <Input
                    value={form.cms_geo_segment}
                    onChange={(e) => setForm((f) => ({ ...f, cms_geo_segment: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Premium (monthly)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.premium_monthly}
                    onChange={(e) => setForm((f) => ({ ...f, premium_monthly: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Giveback (monthly)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.giveback_monthly}
                    onChange={(e) => setForm((f) => ({ ...f, giveback_monthly: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">OTC (quarterly)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.otc_benefit_quarterly}
                    onChange={(e) => setForm((f) => ({ ...f, otc_benefit_quarterly: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Dental (yearly)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.dental_benefit_yearly}
                    onChange={(e) => setForm((f) => ({ ...f, dental_benefit_yearly: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Hearing (yearly)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.hearing_benefit_yearly}
                    onChange={(e) => setForm((f) => ({ ...f, hearing_benefit_yearly: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Vision (yearly)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.vision_benefit_yearly}
                    onChange={(e) => setForm((f) => ({ ...f, vision_benefit_yearly: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">PCP Copay</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.primary_care_copay}
                    onChange={(e) => setForm((f) => ({ ...f, primary_care_copay: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Specialist Copay</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.specialist_copay}
                    onChange={(e) => setForm((f) => ({ ...f, specialist_copay: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Hospital Copay (daily)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.hospital_inpatient_per_day_copay}
                    onChange={(e) => setForm((f) => ({ ...f, hospital_inpatient_per_day_copay: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Hospital Days</Label>
                  <Input
                    type="number"
                    value={form.hospital_inpatient_days}
                    onChange={(e) => setForm((f) => ({ ...f, hospital_inpatient_days: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">MOOP (annual)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.moop_annual}
                    onChange={(e) => setForm((f) => ({ ...f, moop_annual: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Ambulance Copay</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.ambulance_copay}
                    onChange={(e) => setForm((f) => ({ ...f, ambulance_copay: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">ER Copay</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.emergency_room_copay}
                    onChange={(e) => setForm((f) => ({ ...f, emergency_room_copay: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Urgent Care Copay</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.urgent_care_copay}
                    onChange={(e) => setForm((f) => ({ ...f, urgent_care_copay: e.target.value }))}
                  />
                </div>

                <div className="space-y-1 md:col-span-3">
                  <Label className="text-xs">Pharmacy Benefit</Label>
                  <Input
                    value={form.pharmacy_benefit}
                    onChange={(e) => setForm((f) => ({ ...f, pharmacy_benefit: e.target.value }))}
                  />
                </div>

                <div className="space-y-1 md:col-span-3">
                  <Label className="text-xs">Service Area</Label>
                  <Input
                    value={form.service_area}
                    onChange={(e) => setForm((f) => ({ ...f, service_area: e.target.value }))}
                  />
                </div>

                <div className="space-y-1 md:col-span-3">
                  <Label className="text-xs">Counties (comma-separated)</Label>
                  <Input value={form.counties} onChange={(e) => setForm((f) => ({ ...f, counties: e.target.value }))} />
                </div>

                <div className="space-y-1 md:col-span-3">
                  <Label className="text-xs">Notes</Label>
                  <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Button size="sm" onClick={handleCreate} disabled={!form.name}>
                  Save Plan
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsAdding(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Plans list (AG Grid) */}
          <div className="rounded border">
            {loading && <div className="text-muted-foreground p-3 text-sm">Loading plans…</div>}
            {!loading && sortedPlans.length === 0 && (
              <div className="text-muted-foreground p-3 text-sm">No plans found</div>
            )}
            <div className="w-full" style={{ height: '70vh' }}>
              <AgGridReact
                ref={gridRef}
                theme={agGridTheme}
                rowData={sortedPlans}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                onGridReady={onGridReady}
                pagination={true}
                paginationPageSize={100}
                animateRows={true}
                enableCellTextSelection={true}
                enableBrowserTooltips={true}
                rowSelection="multiple"
                onSelectionChanged={onSelectionChanged}
              />
            </div>
          </div>

          {/* Edit Modal */}
          <ModalForm
            isOpen={isEditing}
            title={
              <div className="flex items-center gap-2">
                <Pencil className="h-4 w-4" />
                <span>Edit Plan</span>
              </div>
            }
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
            submitText="Save Changes"
          >
            <div className="space-y-6">
              {/* Main Database Fields Section */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-1 md:col-span-3">
                  <Label className="text-xs">Plan Name</Label>
                  <Input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Plan Type</Label>
                  <select
                    className="bg-background w-full rounded border p-2 text-sm"
                    value={editForm.plan_type}
                    onChange={(e) => setEditForm((f) => ({ ...f, plan_type: e.target.value as PlanType }))}
                  >
                    <option value="">—</option>
                    {planTypeOptions.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Carrier</Label>
                  <select
                    className="bg-background w-full rounded border p-2 text-sm"
                    value={editForm.carrier}
                    onChange={(e) => setEditForm((f) => ({ ...f, carrier: e.target.value as Carrier }))}
                  >
                    <option value="">—</option>
                    {carrierOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Plan Year</Label>
                  <Input
                    type="number"
                    value={editForm.plan_year}
                    onChange={(e) => setEditForm((f) => ({ ...f, plan_year: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">CMS Contract</Label>
                  <Input
                    value={editForm.cms_contract_number}
                    onChange={(e) => setEditForm((f) => ({ ...f, cms_contract_number: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">CMS Plan Number</Label>
                  <Input
                    value={editForm.cms_plan_number}
                    onChange={(e) => setEditForm((f) => ({ ...f, cms_plan_number: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">CMS Geo Segment</Label>
                  <Input
                    value={editForm.cms_geo_segment}
                    onChange={(e) => setEditForm((f) => ({ ...f, cms_geo_segment: e.target.value }))}
                  />
                </div>

                <div className="space-y-1 md:col-span-3">
                  <Label className="text-xs">Counties (comma-separated)</Label>
                  <Input
                    value={editForm.counties}
                    onChange={(e) => setEditForm((f) => ({ ...f, counties: e.target.value }))}
                  />
                </div>
              </div>

              {/* Separator */}
              <div className="border-t border-gray-200 dark:border-gray-700"></div>

              {/* Metadata Section */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Plan Benefits & Details (Metadata)</h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {/* Dates */}
                  <div className="space-y-1">
                    <Label className="text-xs">Effective Start</Label>
                    <Input
                      type="date"
                      value={editForm.effective_start}
                      onChange={(e) => setEditForm((f) => ({ ...f, effective_start: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Effective End</Label>
                    <Input
                      type="date"
                      value={editForm.effective_end}
                      onChange={(e) => setEditForm((f) => ({ ...f, effective_end: e.target.value }))}
                    />
                  </div>

                  {/* Financial Benefits */}
                  <div className="space-y-1">
                    <Label className="text-xs">Premium (monthly)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editForm.premium_monthly}
                      onChange={(e) => setEditForm((f) => ({ ...f, premium_monthly: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Giveback (monthly)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editForm.giveback_monthly}
                      onChange={(e) => setEditForm((f) => ({ ...f, giveback_monthly: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">OTC (quarterly)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editForm.otc_benefit_quarterly}
                      onChange={(e) => setEditForm((f) => ({ ...f, otc_benefit_quarterly: e.target.value }))}
                    />
                  </div>

                  {/* Yearly Benefits */}
                  <div className="space-y-1">
                    <Label className="text-xs">Dental (yearly)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editForm.dental_benefit_yearly}
                      onChange={(e) => setEditForm((f) => ({ ...f, dental_benefit_yearly: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Hearing (yearly)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editForm.hearing_benefit_yearly}
                      onChange={(e) => setEditForm((f) => ({ ...f, hearing_benefit_yearly: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Vision (yearly)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editForm.vision_benefit_yearly}
                      onChange={(e) => setEditForm((f) => ({ ...f, vision_benefit_yearly: e.target.value }))}
                    />
                  </div>

                  {/* Medical Copays */}
                  <div className="space-y-1">
                    <Label className="text-xs">PCP Copay</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editForm.primary_care_copay}
                      onChange={(e) => setEditForm((f) => ({ ...f, primary_care_copay: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Specialist Copay</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editForm.specialist_copay}
                      onChange={(e) => setEditForm((f) => ({ ...f, specialist_copay: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Hospital Copay (daily)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editForm.hospital_inpatient_per_day_copay}
                      onChange={(e) => setEditForm((f) => ({ ...f, hospital_inpatient_per_day_copay: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Hospital Days</Label>
                    <Input
                      type="number"
                      value={editForm.hospital_inpatient_days}
                      onChange={(e) => setEditForm((f) => ({ ...f, hospital_inpatient_days: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">MOOP (annual)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editForm.moop_annual}
                      onChange={(e) => setEditForm((f) => ({ ...f, moop_annual: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Ambulance Copay</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editForm.ambulance_copay}
                      onChange={(e) => setEditForm((f) => ({ ...f, ambulance_copay: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">ER Copay</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editForm.emergency_room_copay}
                      onChange={(e) => setEditForm((f) => ({ ...f, emergency_room_copay: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Urgent Care Copay</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editForm.urgent_care_copay}
                      onChange={(e) => setEditForm((f) => ({ ...f, urgent_care_copay: e.target.value }))}
                    />
                  </div>

                  {/* Additional Information */}
                  <div className="space-y-1 md:col-span-3">
                    <Label className="text-xs">Pharmacy Benefit</Label>
                    <Input
                      value={editForm.pharmacy_benefit}
                      onChange={(e) => setEditForm((f) => ({ ...f, pharmacy_benefit: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-1 md:col-span-3">
                    <Label className="text-xs">Service Area</Label>
                    <Input
                      value={editForm.service_area}
                      onChange={(e) => setEditForm((f) => ({ ...f, service_area: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-1 md:col-span-3">
                    <Label className="text-xs">Notes</Label>
                    <Input value={editForm.notes} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} />
                  </div>

                  {/* Extended Benefits */}
                  <div className="space-y-1">
                    <Label className="text-xs">Card Benefit</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editForm.card_benefit}
                      onChange={(e) => setEditForm((f) => ({ ...f, card_benefit: e.target.value }))}
                      placeholder="$0"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Fitness Benefit</Label>
                    <Input
                      type="text"
                      value={editForm.fitness_benefit}
                      onChange={(e) => setEditForm((f) => ({ ...f, fitness_benefit: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Transportation Rides</Label>
                    <Input
                      type="number"
                      value={editForm.transportation_benefit}
                      onChange={(e) => setEditForm((f) => ({ ...f, transportation_benefit: e.target.value }))}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Medical Deductible</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editForm.medical_deductible}
                      onChange={(e) => setEditForm((f) => ({ ...f, medical_deductible: e.target.value }))}
                      placeholder="$0"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">RX Deductible (T345)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editForm.rx_deductible_tier345}
                      onChange={(e) => setEditForm((f) => ({ ...f, rx_deductible_tier345: e.target.value }))}
                      placeholder="$0"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">RX Cost Share</Label>
                    <Input
                      value={editForm.rx_cost_share}
                      onChange={(e) => setEditForm((f) => ({ ...f, rx_cost_share: e.target.value }))}
                      placeholder="e.g., $0 Tier 1, $10 Tier 2"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Medicaid Eligibility</Label>
                    <Input
                      value={editForm.medicaid_eligibility}
                      onChange={(e) => setEditForm((f) => ({ ...f, medicaid_eligibility: e.target.value }))}
                      placeholder="e.g., Required, Not Required"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Transitioned From</Label>
                    <Input
                      value={editForm.transitioned_from}
                      onChange={(e) => setEditForm((f) => ({ ...f, transitioned_from: e.target.value }))}
                      placeholder="Previous plan name"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Summary</Label>
                    <Input
                      value={editForm.summary}
                      onChange={(e) => setEditForm((f) => ({ ...f, summary: e.target.value }))}
                      placeholder="Plan summary or highlights"
                    />
                  </div>
                </div>
              </div>
            </div>
          </ModalForm>

          {error && <div className="text-destructive text-sm">{error}</div>}
        </div>
      </div>

      {/* Plan Comparison Modal */}
      <PlanComparisonModal isOpen={showComparison} onClose={() => setShowComparison(false)} plans={selectedPlans} />
    </div>
  )
}
