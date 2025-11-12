'use client'

import React, { useMemo, useRef, useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'
import { usePlans, type PlanForm } from '@/hooks/usePlans'
import { calculateCmsId } from '@/lib/plan-utils'
import { populateFormFromPlan, buildPlanDataFromForm, getDefaultMetadataFormData } from '@/lib/plan-metadata-utils'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  TYPE_NETWORKS_LIST,
  TYPE_EXTENSIONS_LIST,
  TYPE_SNPS_LIST,
  TYPE_PROGRAMS_LIST,
  CARRIERS,
  type TypeNetwork,
  type TypeExtension,
  type TypeSnp,
  type TypeProgram,
  type Carrier,
} from '@/lib/plan-constants'
import { AgGridReact } from 'ag-grid-react'
import {
  AllCommunityModule,
  ColDef,
  GridReadyEvent,
  ICellRendererParams,
  ModuleRegistry,
  Theme,
  themeQuartz,
  colorSchemeDark,
} from 'ag-grid-community'
import type { Database } from '@/lib/supabase'
import { Pencil, Trash2, Scale, Copy, Plus, RefreshCw, Filter } from 'lucide-react'
import ModalForm from '@/components/ui/modal-form'
import PlanComparisonModal from '@/components/PlanComparisonModal'
import dynamic from 'next/dynamic'

// Lazy load the DynamicPlanForm to improve initial render performance
const DynamicPlanForm = dynamic(() => import('@/components/DynamicPlanForm'), {
  loading: () => (
    <div className="animate-pulse space-y-4">
      <div className="bg-muted h-4 w-1/4 rounded"></div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="bg-muted h-3 w-1/2 rounded"></div>
            <div className="bg-muted h-10 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  ),
  ssr: false,
})
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

  const [isAdding, setIsAdding] = useState(false)
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([])
  const [showComparison, setShowComparison] = useState(false)
  const [activeFilters, setActiveFilters] = useState<Record<string, { filter?: unknown }>>({})
  const [showQuickFilters, setShowQuickFilters] = useState(true)
  const [savedSelections, setSavedSelections] = useState<
    Array<{ name: string; selection: string[]; filters: Record<string, unknown> }>
  >([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveSelectionName, setSaveSelectionName] = useState('')
  const [selectionPanelPosition, setSelectionPanelPosition] = useState({ x: 16, y: 16 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showSelectionPanel, setShowSelectionPanel] = useState(false)

  useEffect(() => {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

    // Use modern AG Grid v34+ Theming API
    setAgGridTheme(isDark ? themeQuartz.withPart(colorSchemeDark) : themeQuartz)
  }, [theme])

  // Load saved selections from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('ag-grid-saved-selections')
    if (saved) {
      try {
        setSavedSelections(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to parse saved selections:', error)
      }
    }

    // Load panel position
    const savedPosition = localStorage.getItem('ag-grid-panel-position')
    if (savedPosition) {
      try {
        const position = JSON.parse(savedPosition)
        setSelectionPanelPosition(position)
      } catch (error) {
        console.error('Failed to parse panel position:', error)
      }
    }
  }, [])

  // Save selections to localStorage whenever savedSelections changes
  useEffect(() => {
    localStorage.setItem('ag-grid-saved-selections', JSON.stringify(savedSelections))
  }, [savedSelections])

  // Save panel position to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('ag-grid-panel-position', JSON.stringify(selectionPanelPosition))
  }, [selectionPanelPosition])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
      if (restoreTimeoutRef.current) {
        clearTimeout(restoreTimeoutRef.current)
      }
    }
  }, [])
  const isRefreshingRef = useRef(false)
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const restoreTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  // Helper function to get default core fields - type inferred from implementation
  const getDefaultCoreFields = () => ({
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
    counties: '',
  })

  // Type inferred from the function implementation
  type CoreFormFields = ReturnType<typeof getDefaultCoreFields>

  // Combined form type (core fields + dynamic metadata fields)
  type FormData = CoreFormFields & Record<string, unknown>

  const [form, setForm] = useState<FormData>(() => ({
    // Core database fields with default values
    ...getDefaultCoreFields(),
    // Dynamic metadata fields
    ...getDefaultMetadataFormData(),
  }))

  const gridRef = useRef<AgGridReact>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const editingPlan = useMemo(() => {
    if (!editingId) return undefined
    return plans.find((plan) => plan.id === editingId)
  }, [editingId, plans])
  const [editForm, setEditForm] = useState<FormData>(() => ({
    // Core database fields with default values
    ...getDefaultCoreFields(),
    // Dynamic metadata fields
    ...getDefaultMetadataFormData(),
  }))

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

  // County quick filter state
  const [countyFilter, setCountyFilter] = useState<string>('')
  const [selectedCountyButtons, setSelectedCountyButtons] = useState<Set<string>>(new Set())

  // Precompute a normalized county Set for each plan for efficient lookups
  const planIdToCountySet = useMemo(() => {
    const normalize = (s: string) => s.trim().toLowerCase()
    const map = new Map<string, Set<string>>()
    for (const p of plans) {
      const values: string[] = []
      // Prefer core column if present
      if (Array.isArray(p.counties) && p.counties.length > 0) {
        for (const c of p.counties) {
          if (typeof c === 'string' && c.trim()) values.push(c)
        }
      }
      map.set(String(p.id), new Set(values.map(normalize)))
    }
    return map
  }, [plans])

  // Apply county filter: include plans with no counties; otherwise require match
  const countyFilteredPlans = useMemo(() => {
    // Build the set of target counties from buttons and the text box (OR logic)
    const targets = new Set<string>()
    for (const c of selectedCountyButtons) targets.add(c)
    const query = countyFilter.trim().toLowerCase()
    if (query) targets.add(query)

    if (targets.size === 0) return sortedPlans
    return sortedPlans.filter((p) => {
      const set = planIdToCountySet.get(String(p.id))
      // Include when there are no counties defined
      if (!set || set.size === 0) return true
      // OR logic: any target county present passes
      for (const t of targets) {
        if (set.has(t)) return true
      }
      return false
    })
  }, [sortedPlans, countyFilter, selectedCountyButtons, planIdToCountySet])

  const toggleCountyButton = (name: string) => {
    const key = name.toLowerCase()
    setSelectedCountyButtons((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const onSelectionChanged = () => {
    if (!gridRef.current || isRefreshingRef.current) return

    const selectedNodes = gridRef.current.api.getSelectedNodes()
    const selectedIds = selectedNodes.map((node) => node.data?.id).filter(Boolean) as string[]
    setSelectedPlanIds(selectedIds)
  }

  const onFilterChanged = () => {
    if (!gridRef.current) return

    const filterModel = gridRef.current.api.getFilterModel()
    setActiveFilters(filterModel)
  }

  const applyQuickFilter = (field: string, value: string) => {
    if (!gridRef.current) return

    const api = gridRef.current.api

    // Check if this filter is already active
    const currentFilter = activeFilters[field]
    const isActive = field === 'plan_year' ? currentFilter?.filter === parseInt(value) : currentFilter?.filter === value

    if (isActive) {
      // Remove this filter
      const newFilters = { ...activeFilters }
      delete newFilters[field]
      api.setFilterModel(newFilters)
    } else {
      // Set the filter value with appropriate filter type
      const filterConfig =
        field === 'plan_year'
          ? {
              type: 'equals',
              filter: parseInt(value),
              filterType: 'number',
            }
          : {
              type: 'contains',
              filter: value,
              filterType: 'text',
            }

      api.setFilterModel({
        ...activeFilters,
        [field]: filterConfig,
      })
    }
  }

  const clearAllFilters = () => {
    if (!gridRef.current) return

    gridRef.current.api.setFilterModel({})
    setActiveFilters({})
  }

  // Save current selection and filters
  const saveCurrentSelection = () => {
    if (selectedPlanIds.length === 0 && Object.keys(activeFilters).length === 0) {
      toast({
        title: 'Nothing to save',
        description: 'Please select some plans or apply filters before saving.',
        variant: 'destructive',
      })
      return
    }

    const newSelection = {
      name: saveSelectionName.trim() || `Selection ${savedSelections.length + 1}`,
      selection: selectedPlanIds,
      filters: activeFilters,
    }

    setSavedSelections((prev) => [...prev, newSelection])
    setSaveSelectionName('')
    setShowSaveDialog(false)

    toast({
      title: 'Selection saved',
      description: `Saved "${newSelection.name}" with ${selectedPlanIds.length} plans and ${Object.keys(activeFilters).length} filters.`,
    })
  }

  // Restore a saved selection
  const restoreSelection = (savedSelection: {
    name: string
    selection: string[]
    filters: Record<string, unknown>
  }) => {
    if (!gridRef.current) return

    // Clear any existing restore timeout
    if (restoreTimeoutRef.current) {
      clearTimeout(restoreTimeoutRef.current)
    }

    // Apply filters first
    gridRef.current.api.setFilterModel(savedSelection.filters)
    setActiveFilters(savedSelection.filters as Record<string, { filter?: unknown }>)

    // Then restore selection
    restoreTimeoutRef.current = setTimeout(() => {
      if (gridRef.current) {
        // Clear current selection
        gridRef.current.api.deselectAll()

        // Use getRowNode with the plan ID now that we have getRowId configured
        savedSelection.selection.forEach((planId) => {
          const rowNode = gridRef.current?.api.getRowNode(planId)
          if (rowNode) {
            rowNode.setSelected(true)
          }
        })
      }
      restoreTimeoutRef.current = null
    }, 300) // Increased timeout to allow filters to apply

    toast({
      title: 'Selection restored',
      description: `Restored "${savedSelection.name}" with ${savedSelection.selection.length} plans.`,
    })
  }

  // Delete a saved selection
  const deleteSavedSelection = (index: number) => {
    setSavedSelections((prev) => prev.filter((_, i) => i !== index))
    toast({
      title: 'Selection deleted',
      description: 'Saved selection has been removed.',
    })
  }

  // Drag handlers for the selection panel
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({
      x: e.clientX - selectionPanelPosition.x,
      y: e.clientY - selectionPanelPosition.y,
    })
  }

  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return

      const newX = e.clientX - dragStart.x
      const newY = e.clientY - dragStart.y

      // Keep panel within viewport bounds
      const maxX = window.innerWidth - 320 // Panel width is ~300px
      const maxY = window.innerHeight - 200 // Panel height is ~200px

      setSelectionPanelPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      })
    },
    [isDragging, dragStart]
  )

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false)
  }, [])

  // Add global mouse event listeners when dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Custom header component for Actions column
  const ActionsHeaderComponent = React.useCallback(() => {
    return (
      <div className="flex w-full items-center justify-between">
        <span>Actions</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowQuickFilters(!showQuickFilters)}
          className="h-6 w-6 p-0"
          title="Toggle Quick Filters"
        >
          <Filter className="h-3 w-3" />
        </Button>
      </div>
    )
  }, [showQuickFilters])

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
        selectedPlanIds.forEach((planId) => {
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
          if (plan.type_program && plan.type_program !== 'MA' && plan.type_program !== 'SNP')
            parts.push(plan.type_program)

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
        valueFormatter: (p) => (p.value ? `${p.value}-SNP` : '—'),
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
        headerComponent: ActionsHeaderComponent,
        minWidth: 150,
        maxWidth: 170,
        cellRenderer: (p: ICellRendererParams<Database['public']['Tables']['plans']['Row']>) => {
          const planId: string | undefined = p.data?.id
          if (!planId) return ''
          const openEdit = () => {
            const plan = p.data
            if (!plan) return
            setEditingId(plan.id)

            // Dynamically populate form data from plan using the helper function
            const formData = populateFormFromPlan(plan)
            setEditForm(formData as typeof editForm)
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
                  variant: 'destructive',
                })
              } else if (typeof result === 'object' && result.success === false) {
                // Enrollment blocking case - the error is already logged to history
                const { enrollments } = result
                if (enrollments && enrollments.length > 0) {
                  const contactNames = enrollments
                    .map((e) => (e.contacts ? `${e.contacts.first_name} ${e.contacts.last_name}` : 'Unknown'))
                    .slice(0, 3)
                    .join(', ')

                  toast({
                    title: 'Cannot delete plan',
                    description: `This plan has ${enrollments.length} enrollment(s) with contact(s): ${contactNames}${enrollments.length > 3 ? '...' : ''}. Please remove all enrollments first.`,
                    variant: 'destructive',
                  })
                }
              }
              // If result === true, deletion was successful (no toast needed)
            }
          }
          const handleCopy = () => {
            const plan = p.data
            if (!plan) return

            // Dynamically populate form data from plan using the helper function
            const formData = populateFormFromPlan(plan)

            // Increment the plan year for copying to next year
            if (formData.plan_year) {
              formData.plan_year = String(Number(formData.plan_year) + 1)
            } else {
              formData.plan_year = new Date().getUTCFullYear().toString()
            }

            setForm(formData as typeof form)
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
    [deletePlan, toast, ActionsHeaderComponent]
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

    // Build complete plan data from form using the helper function
    const data = buildPlanDataFromForm(form)

    const ok = await createPlan(data as PlanForm)
    if (ok) {
      setIsAdding(false)
      setForm({
        // Core database fields with default values
        ...getDefaultCoreFields(),
        // Dynamic metadata fields
        ...getDefaultMetadataFormData(),
      })
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return

    // Build complete plan data from form using the helper function
    const data = buildPlanDataFromForm(editForm)
    
    // Log pretty-printed metadata JSON with sorted keys
    if (data.metadata && typeof data.metadata === 'object' && !Array.isArray(data.metadata)) {
      const metadataRecord = data.metadata as Record<string, unknown>
      const sortedMetadata = Object.keys(metadataRecord)
        .sort()
        .reduce((acc, key) => {
          acc[key] = metadataRecord[key]
          return acc
        }, {} as Record<string, unknown>)
      const fieldCount = Object.keys(sortedMetadata).length
      console.log(`Plan metadata (saving) - ${fieldCount} fields:`, JSON.stringify(sortedMetadata, null, 2))
    }
    
    const ok = await updatePlan(editingId, data as PlanForm)
    if (ok) {
      setIsEditing(false)
      setEditingId(null)
    }
  }

  return (
    <div className="bg-background min-h-screen">
      <Navigation pageTitle="Plans" />

      <div className="flex h-[calc(100vh-4rem)] flex-col">
        <div className="flex flex-1 flex-col">
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

                {/* Dynamic Metadata Form */}
                <div className="md:col-span-3">
                  <DynamicPlanForm
                    formData={form}
                    onChange={(field, value) => setForm((f) => ({ ...f, [field]: value }))}
                    mode="create"
                    className="space-y-4"
                  />
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

          {/* Quick Filter Buttons */}
          {showQuickFilters && (
            <div className="bg-muted/20 border-b p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1">
                  {/* County text filter */}
                  <div className="flex items-center gap-2">
                    <Input
                      id="county-filter"
                      placeholder="County"
                      className="h-8 w-[80px] text-xs"
                      value={countyFilter}
                      onChange={(e) => setCountyFilter(e.target.value)}
                    />
                  </div>

                  {/* County quick buttons (OR logic with text box) */}
                  <div className="flex flex-wrap gap-1">
                    {['Butler', 'Cuyahoga', 'Lake', 'Lorain'].map((c) => {
                      const key = c.toLowerCase()
                      const isActive = selectedCountyButtons.has(key)
                      return (
                        <Button
                          key={c}
                          variant={isActive ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleCountyButton(c)}
                          className="cursor-pointer text-xs"
                        >
                          {c}
                        </Button>
                      )
                    })}
                  </div>
                </div>
                {/* Carrier Filters */}
                <div className="flex flex-wrap gap-1">
                  {carrierOptions.map((carrier) => (
                    <Button
                      key={carrier}
                      variant={activeFilters.carrier?.filter === carrier ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => applyQuickFilter('carrier', carrier)}
                      className="cursor-pointer text-xs"
                    >
                      {carrier}
                    </Button>
                  ))}
                </div>

                {/* Year Filters */}
                <div className="flex flex-wrap gap-1">
                  {[2025, 2026].map((year) => (
                    <Button
                      key={year}
                      variant={activeFilters.plan_year?.filter === year ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => applyQuickFilter('plan_year', year.toString())}
                      className="cursor-pointer text-xs"
                    >
                      {year}
                    </Button>
                  ))}
                </div>

                {/* Clear All Filters */}
                {(Object.keys(activeFilters).length > 0 || countyFilter || selectedCountyButtons.size > 0) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      clearAllFilters()
                      setCountyFilter('')
                      setSelectedCountyButtons(new Set())
                    }}
                    className="text-muted-foreground hover:text-foreground cursor-pointer text-xs"
                    title="Clear all filters"
                  >
                    ✕
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Plans list (AG Grid) */}
          <div className="flex flex-1 flex-col">
            {!loading && sortedPlans.length === 0 && (
              <div className="text-muted-foreground p-3 text-sm">No plans found</div>
            )}
            <div className="w-full flex-1">
              <AgGridReact
                ref={gridRef}
                theme={agGridTheme}
                rowData={countyFilteredPlans}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                getRowId={(params) => params.data.id}
                onGridReady={onGridReady}
                onFilterChanged={onFilterChanged}
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
            <div className="bg-muted/30 flex items-center border-t px-4 py-2 text-sm">
              <div className="flex flex-1 items-center">
                {loading && <div className="text-muted-foreground text-sm">Loading plans…</div>}
              </div>
              <div className="flex items-center gap-2">
                {/* Save Selection Button */}
                {(selectedPlanIds.length > 0 || Object.keys(activeFilters).length > 0) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowSaveDialog(true)}
                    title="Save current selection and filters"
                  >
                    💾 Save Selection
                  </Button>
                )}

                {/* Saved Selections Toggle */}
                {savedSelections.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowSelectionPanel(!showSelectionPanel)}
                    title={showSelectionPanel ? 'Hide saved selections' : 'Show saved selections'}
                  >
                    📁 Saved ({savedSelections.length})
                  </Button>
                )}

                {selectedPlanIds.length >= 2 && (
                  <Button size="sm" variant="outline" onClick={() => setShowComparison(true)}>
                    <Scale className="mr-2 h-4 w-4" />
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
                          variant: 'destructive',
                        })
                      } else if (typeof result === 'object' && result.success === false) {
                        // Enrollment blocking case - the error is already logged to history
                        toast({
                          title: 'Cannot delete plans',
                          description:
                            'Some plans cannot be deleted because they have existing enrollments. Please remove all enrollments first.',
                          variant: 'destructive',
                        })
                      }
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete ({selectedPlanIds.length})
                  </Button>
                )}
                {!isAdding && (
                  <>
                    <Button size="sm" onClick={() => setIsAdding(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Plan
                    </Button>
                    <Button size="sm" variant="outline" onClick={fetchPlans}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh
                    </Button>
                  </>
                )}
              </div>
              <div className="flex-1"></div>
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
                <div className="bg-muted/50 rounded-lg border p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm font-medium">{editingId}</span>
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

              {/* Dynamic Metadata Form */}
              <div>
                <DynamicPlanForm
                  formData={editForm}
                  onChange={(field, value) => setEditForm((f) => ({ ...f, [field]: value }))}
                  mode="edit"
                  className="space-y-4"
                  plan={editingPlan}
                />
              </div>
            </div>
          </ModalForm>

          {error && <div className="text-destructive text-sm">{error}</div>}
        </div>

        {/* Plan Comparison Modal */}
        <PlanComparisonModal
          key={`comparison-${selectedPlanIds.join('-')}`}
          isOpen={showComparison}
          onClose={() => setShowComparison(false)}
          plans={selectedPlans}
          onRefresh={refreshPlansWithSelection}
        />

        {/* Save Selection Dialog */}
        {showSaveDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-background border-border w-96 max-w-[90vw] rounded-lg border p-6 shadow-xl">
              <h3 className="mb-4 text-lg font-semibold">Save Selection</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="selection-name">Selection Name</Label>
                  <Input
                    id="selection-name"
                    value={saveSelectionName}
                    onChange={(e) => setSaveSelectionName(e.target.value)}
                    placeholder="Enter a name for this selection..."
                    className="mt-1"
                  />
                </div>
                <div className="text-muted-foreground text-sm">
                  <p>This will save:</p>
                  <ul className="mt-1 list-inside list-disc space-y-1">
                    <li>{selectedPlanIds.length} selected plans</li>
                    <li>{Object.keys(activeFilters).length} active filters</li>
                  </ul>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowSaveDialog(false)
                      setSaveSelectionName('')
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={saveCurrentSelection}>Save Selection</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Saved Selections Management */}
        {savedSelections.length > 0 && showSelectionPanel && (
          <div
            className="fixed z-40"
            style={{
              left: `${selectionPanelPosition.x}px`,
              top: `${selectionPanelPosition.y}px`,
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
          >
            <div className="bg-background border-border max-w-sm rounded-lg border p-4 shadow-lg">
              <div
                className="mb-2 flex cursor-grab items-center justify-between select-none active:cursor-grabbing"
                onMouseDown={handleMouseDown}
              >
                <h4 className="text-sm font-semibold">Saved Selections</h4>
                <div className="flex items-center gap-2">
                  <div className="text-muted-foreground text-xs">⋮⋮</div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowSelectionPanel(false)}
                    className="h-6 w-6 p-0"
                    title="Close panel"
                  >
                    ✕
                  </Button>
                </div>
              </div>
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {savedSelections.map((selection, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{selection.name}</div>
                      <div className="text-muted-foreground text-xs">
                        {selection.selection.length} plans, {Object.keys(selection.filters).length} filters
                      </div>
                    </div>
                    <div className="ml-2 flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => restoreSelection(selection)}
                        className="h-6 w-6 p-0"
                        title="Load this selection"
                      >
                        📁
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteSavedSelection(index)}
                        className="text-destructive hover:text-destructive h-6 w-6 p-0"
                        title="Delete this selection"
                      >
                        🗑️
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
