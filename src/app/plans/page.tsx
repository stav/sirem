'use client'

import React, { useMemo, useRef, useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'
import { usePlans } from '@/hooks/usePlans'
import { calculateCmsId } from '@/lib/plan-utils'
import { buildMetadata, extractMetadataForForm } from '@/lib/plan-metadata-utils'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { TYPE_NETWORKS_LIST, TYPE_EXTENSIONS_LIST, TYPE_SNPS_LIST, TYPE_PROGRAMS_LIST, CARRIERS, type TypeNetwork, type TypeExtension, type TypeSnp, type TypeProgram, type Carrier } from '@/lib/plan-constants'
import { AgGridReact } from 'ag-grid-react'
import { AllCommunityModule, ColDef, GridReadyEvent, ICellRendererParams, ModuleRegistry, Theme, themeQuartz, colorSchemeDark } from 'ag-grid-community'
import type { Database } from '@/lib/supabase'
import { Pencil, Trash2, Scale, Copy, Plus } from 'lucide-react'
import ModalForm from '@/components/ui/modal-form'
import PlanComparisonModal from '@/components/PlanComparisonModal'
import { useTheme } from '@/contexts/ThemeContext'
import { useToast } from '@/hooks/use-toast'

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule])

// Use centralized constants instead of hardcoded arrays
const carrierOptions = CARRIERS
const typeNetworkOptions = TYPE_NETWORKS_LIST
const typeExtensionOptions = TYPE_EXTENSIONS_LIST
const typeSnpOptions = TYPE_SNPS_LIST
const typeProgramOptions = TYPE_PROGRAMS_LIST

export default function PlansPage() {
  const { plans, loading, error, fetchPlans, createPlan, updatePlan, deletePlan, deletePlans } = usePlans()
  const { theme } = useTheme()
  const { toast } = useToast()

  // Create theme object for AG Grid v34+ Theming API (client-side only)
  const [agGridTheme, setAgGridTheme] = useState<Theme | undefined>(undefined)
  
  useEffect(() => {
    const isDark = theme === 'dark' || (theme === 'system' && 
      window.matchMedia('(prefers-color-scheme: dark)').matches)
    
    // Use modern AG Grid v34+ Theming API
    setAgGridTheme(isDark ? themeQuartz.withPart(colorSchemeDark) : themeQuartz)
  }, [theme])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [])

  const [isAdding, setIsAdding] = useState(false)
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([])
  const [showComparison, setShowComparison] = useState(false)
  const isRefreshingRef = useRef(false)
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [form, setForm] = useState({
    name: '',
    type_network: '' as TypeNetwork | '',
    type_extension: '' as TypeExtension | '',
    type_snp: '' as TypeSnp | '',
    type_program: '' as TypeProgram | '',
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
    type_network: '' as TypeNetwork | '',
    type_extension: '' as TypeExtension | '',
    type_snp: '' as TypeSnp | '',
    type_program: '' as TypeProgram | '',
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
    if (!gridRef.current || isRefreshingRef.current) return
    
    const selectedNodes = gridRef.current.api.getSelectedNodes()
    const selectedIds = selectedNodes.map(node => node.data?.id).filter(Boolean) as string[]
    setSelectedPlanIds(selectedIds)
  }

  const selectedPlans = useMemo(() => {
    if (selectedPlanIds.length === 0) return []
    return plans.filter((p) => selectedPlanIds.includes(p.id))
  }, [plans, selectedPlanIds])

  // Custom refresh function that preserves selection
  const refreshPlansWithSelection = async () => {
    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }
    
    isRefreshingRef.current = true
    await fetchPlans()
    
    // Wait for the grid to update with new data, then restore selection
    refreshTimeoutRef.current = setTimeout(() => {
      if (gridRef.current && selectedPlanIds.length > 0) {
        selectedPlanIds.forEach(planId => {
          const rowNode = gridRef.current?.api.getRowNode(planId)
          if (rowNode) {
            rowNode.setSelected(true)
          }
        })
      }
      isRefreshingRef.current = false
      refreshTimeoutRef.current = null
    }, 200)
  }

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
        headerName: 'Type',
        minWidth: 120,
        valueGetter: (p) => {
          const plan = p.data
          if (!plan) return '—'
          
          // Build the plan type string from normalized fields
          const parts = []
          if (plan.type_network) parts.push(plan.type_network)
          if (plan.type_extension) parts.push(plan.type_extension)
          if (plan.type_snp) parts.push(`${plan.type_snp}-SNP`)
          // Don't add type_program if it's already included in the SNP part
          if (plan.type_program && plan.type_program !== 'MA' && plan.type_program !== 'SNP') parts.push(plan.type_program)
          
          return parts.length > 0 ? parts.join('-') : '—'
        },
        sortable: true,
        filter: true,
      },
      {
        field: 'type_network',
        headerName: 'Network',
        sortable: true,
        filter: true,
        minWidth: 100,
        valueFormatter: (p) => p.value || '—',
      },
      {
        field: 'type_extension',
        headerName: 'Extension',
        sortable: true,
        filter: true,
        minWidth: 100,
        valueFormatter: (p) => p.value || '—',
      },
      {
        field: 'type_snp',
        headerName: 'SNP',
        sortable: true,
        filter: true,
        minWidth: 80,
        valueFormatter: (p) => p.value ? `${p.value}-SNP` : '—',
      },
      {
        field: 'type_program',
        headerName: 'Program',
        sortable: true,
        filter: true,
        minWidth: 100,
        valueFormatter: (p) => p.value || '—',
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
              type_network: (formData.type_network as TypeNetwork) ?? '',
              type_extension: (formData.type_extension as TypeExtension) ?? '',
              type_snp: (formData.type_snp as TypeSnp) ?? '',
              type_program: (formData.type_program as TypeProgram) ?? '',
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
              const result = await deletePlan(planId)
              if (result === false) {
                // Generic error case
                toast({
                  title: 'Failed to delete plan',
                  description: 'An unexpected error occurred while deleting the plan.',
                  variant: 'destructive'
                })
              } else if (typeof result === 'object' && result.success === false) {
                // Enrollment blocking case - the error is already logged to history
                const { enrollments } = result
                if (enrollments && enrollments.length > 0) {
                  const contactNames = enrollments
                    .map(e => e.contacts ? `${e.contacts.first_name} ${e.contacts.last_name}` : 'Unknown')
                    .slice(0, 3)
                    .join(', ')
                  
                  toast({
                    title: 'Cannot delete plan',
                    description: `This plan has ${enrollments.length} enrollment(s) with contact(s): ${contactNames}${enrollments.length > 3 ? '...' : ''}. Please remove all enrollments first.`,
                    variant: 'destructive'
                  })
                }
              }
              // If result === true, deletion was successful (no toast needed)
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
              type_network: (formData.type_network as TypeNetwork) ?? '',
              type_extension: (formData.type_extension as TypeExtension) ?? '',
              type_snp: (formData.type_snp as TypeSnp) ?? '',
              type_program: (formData.type_program as TypeProgram) ?? '',
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
        [deletePlan, toast]
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
      type_network: (form.type_network as TypeNetwork) || null,
      type_extension: (form.type_extension as TypeExtension) || null,
      type_snp: (form.type_snp as TypeSnp) || null,
      type_program: (form.type_program as TypeProgram) || null,
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
        type_network: '' as TypeNetwork | '',
        type_extension: '' as TypeExtension | '',
        type_snp: '' as TypeSnp | '',
        type_program: '' as TypeProgram | '',
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
      type_network: (editForm.type_network as TypeNetwork) || null,
      type_extension: (editForm.type_extension as TypeExtension) || null,
      type_snp: (editForm.type_snp as TypeSnp) || null,
      type_program: (editForm.type_program as TypeProgram) || null,
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

      <div className="h-[calc(100vh-4rem)] flex flex-col">
        <div className="flex-1 flex flex-col">

          {isAdding && (
            <div className="rounded border p-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">Name</Label>
                  <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Network Type</Label>
                  <select
                    className="bg-background w-full rounded border p-2 text-sm"
                    value={form.type_network}
                    onChange={(e) => setForm((f) => ({ ...f, type_network: e.target.value as TypeNetwork }))}
                  >
                    <option value="">—</option>
                    {typeNetworkOptions.map((network) => (
                      <option key={network} value={network}>
                        {network}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Extension</Label>
                  <select
                    className="bg-background w-full rounded border p-2 text-sm"
                    value={form.type_extension || ''}
                    onChange={(e) => setForm((f) => ({ ...f, type_extension: e.target.value as TypeExtension }))}
                  >
                    <option value="">—</option>
                    {typeExtensionOptions.map((extension) => (
                      <option key={extension || 'null'} value={extension || ''}>
                        {extension || 'None'}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">SNP Type</Label>
                  <select
                    className="bg-background w-full rounded border p-2 text-sm"
                    value={form.type_snp || ''}
                    onChange={(e) => setForm((f) => ({ ...f, type_snp: e.target.value as TypeSnp }))}
                  >
                    <option value="">—</option>
                    {typeSnpOptions.map((snp) => (
                      <option key={snp || 'null'} value={snp || ''}>
                        {snp ? `${snp}-SNP` : 'None'}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Program Type</Label>
                  <select
                    className="bg-background w-full rounded border p-2 text-sm"
                    value={form.type_program}
                    onChange={(e) => setForm((f) => ({ ...f, type_program: e.target.value as TypeProgram }))}
                  >
                    <option value="">—</option>
                    {typeProgramOptions.map((program) => (
                      <option key={program} value={program}>
                        {program}
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
          <div className="flex-1 flex flex-col">
            {loading && <div className="text-muted-foreground p-3 text-sm">Loading plans…</div>}
            {!loading && sortedPlans.length === 0 && (
              <div className="text-muted-foreground p-3 text-sm">No plans found</div>
            )}
            <div className="flex-1 w-full">
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
            
            {/* Custom Footer */}
            <div className="flex items-center justify-center px-4 py-2 border-t bg-muted/30 text-sm">
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
                      const result = await deletePlans(selectedPlanIds)
                      if (result === true) {
                        setSelectedPlanIds([])
                        if (gridRef.current) gridRef.current.api.deselectAll()
                      } else if (result === false) {
                        toast({
                          title: 'Failed to delete plans',
                          description: 'An unexpected error occurred while deleting the plans.',
                          variant: 'destructive'
                        })
                      } else if (typeof result === 'object' && result.success === false) {
                        // Enrollment blocking case - the error is already logged to history
                        toast({
                          title: 'Cannot delete plans',
                          description: 'Some plans cannot be deleted because they have existing enrollments. Please remove all enrollments first.',
                          variant: 'destructive'
                        })
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete ({selectedPlanIds.length})
                  </Button>
                )}
                {!isAdding && (
                  <Button size="sm" onClick={() => setIsAdding(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Plan
                  </Button>
                )}
              </div>
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
              {/* Plan ID Display */}
              {editingId && (
                <div className="bg-muted/50 rounded-lg p-4 border">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      {editingId}
                    </span>
                  </div>
                </div>
              )}

              {/* Main Database Fields Section */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-1 md:col-span-3">
                  <Label className="text-xs">Plan Name</Label>
                  <Input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Network Type</Label>
                  <select
                    className="bg-background w-full rounded border p-2 text-sm"
                    value={editForm.type_network}
                    onChange={(e) => setEditForm((f) => ({ ...f, type_network: e.target.value as TypeNetwork }))}
                  >
                    <option value="">—</option>
                    {typeNetworkOptions.map((network) => (
                      <option key={network} value={network}>
                        {network}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Extension</Label>
                  <select
                    className="bg-background w-full rounded border p-2 text-sm"
                    value={editForm.type_extension || ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, type_extension: e.target.value as TypeExtension }))}
                  >
                    <option value="">—</option>
                    {typeExtensionOptions.map((extension) => (
                      <option key={extension || 'null'} value={extension || ''}>
                        {extension || 'None'}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">SNP Type</Label>
                  <select
                    className="bg-background w-full rounded border p-2 text-sm"
                    value={editForm.type_snp || ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, type_snp: e.target.value as TypeSnp }))}
                  >
                    <option value="">—</option>
                    {typeSnpOptions.map((snp) => (
                      <option key={snp || 'null'} value={snp || ''}>
                        {snp ? `${snp}-SNP` : 'None'}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Program Type</Label>
                  <select
                    className="bg-background w-full rounded border p-2 text-sm"
                    value={editForm.type_program}
                    onChange={(e) => setEditForm((f) => ({ ...f, type_program: e.target.value as TypeProgram }))}
                  >
                    <option value="">—</option>
                    {typeProgramOptions.map((program) => (
                      <option key={program} value={program}>
                        {program}
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

        {/* Plan Comparison Modal */}
        <PlanComparisonModal isOpen={showComparison} onClose={() => setShowComparison(false)} plans={selectedPlans} onRefresh={refreshPlansWithSelection} />
      </div>
    </div>
  )
}
