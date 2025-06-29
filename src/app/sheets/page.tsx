'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, GridReadyEvent, CellValueChangedEvent, ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import type { Database } from '@/lib/supabase'
import { logger } from '@/lib/logger'

// Import ag-grid styles
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule])

type Contact = Database['public']['Tables']['contacts']['Row']

export default function SheetsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)

  // Column definitions for ag-grid
  const columnDefs: ColDef[] = useMemo(() => [
    {
      field: 'first_name',
      headerName: 'First Name',
      editable: true,
      sortable: true,
      filter: true,
      width: 150
    },
    {
      field: 'last_name',
      headerName: 'Last Name',
      editable: true,
      sortable: true,
      filter: true,
      width: 150
    },
    {
      field: 'email',
      headerName: 'Email',
      editable: true,
      sortable: true,
      filter: true,
      width: 200
    },
    {
      field: 'phone',
      headerName: 'Phone',
      editable: true,
      sortable: true,
      filter: true,
      width: 150,
      valueFormatter: (params) => formatPhoneNumber(params.value)
    },
    {
      field: 'notes',
      headerName: 'Notes',
      editable: true,
      sortable: true,
      filter: true,
      width: 300
    },
    {
      field: 'created_at',
      headerName: 'Created At',
      sortable: true,
      filter: true,
      width: 150,
      valueFormatter: (params) => formatTimeDeltaFromToday(params.value),
      tooltipValueGetter: (params) => {
        if (params.value) {
          return new Date(params.value).toLocaleString();
        }
        return '';
      }
    }
  ], [])

  // Default column definition
  const defaultColDef = useMemo(() => ({
    resizable: true,
    minWidth: 100,
    flex: 1
  }), [])

  useEffect(() => {
    fetchContacts()
  }, [])

  async function fetchContacts() {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching contacts:', error)
        return
      }

      setContacts(data || [])
    } catch (error) {
      console.error('Error fetching contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCellValueChanged(event: CellValueChangedEvent) {
    const { data, colDef, newValue } = event
    const contactId = data.id
    const field = colDef.field

    if (!field) return

    try {
      const { error } = await supabase
        .from('contacts')
        .update({ [field]: newValue })
        .eq('id', contactId)

      if (error) {
        console.error('Error updating contact:', error)
        logger.error(`Failed to update contact: ${error.message}`, 'contact_update_error')
        // Revert the change in the grid
        event.api.refreshCells({ force: true })
      } else {
        // Log successful update
        const contactName = `${data.first_name} ${data.last_name}`
        logger.contactUpdated(contactName)
      }
    } catch (error) {
      console.error('Error updating contact:', error)
      logger.error('Failed to update contact', 'contact_update_error')
      // Revert the change in the grid
      event.api.refreshCells({ force: true })
    }
  }

  function onGridReady(params: GridReadyEvent) {
    params.api.sizeColumnsToFit()
  }

  function formatPhoneNumber(phone: string | null | undefined): string {
    if (!phone) return '';
    const cleaned = ('' + phone).replace(/\D/g, '');
    if (cleaned.length !== 10) return phone;
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
  }

  function formatTimeDeltaFromToday(dateString: string | null | undefined): string {
    if (!dateString) return '';
    const created = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 31) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'}`;
    }
    const diffMonths = Math.floor(diffDays / 30.44);
    if (diffMonths < 24) {
      return `${diffMonths} month${diffMonths === 1 ? '' : 's'}`;
    }
    const diffYears = Math.floor(diffMonths / 12);
    return `${diffYears} year${diffYears === 1 ? '' : 's'}`;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation pageTitle="Sheets" />
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-1/4 mb-8"></div>
              <div className="h-96 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation pageTitle="Sheets" />
      
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">Contacts Sheet</h1>
            <p className="text-muted-foreground mt-2">
              Edit your contacts directly in this spreadsheet view. Click column headers to sort.
            </p>
          </div>

          <div className="ag-theme-alpine w-full" style={{ height: '80vh' }}>
            <AgGridReact
              rowData={contacts}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              onGridReady={onGridReady}
              onCellValueChanged={handleCellValueChanged}
              pagination={true}
              paginationPageSize={200}
              animateRows={true}
              enableCellTextSelection={true}
              suppressRowClickSelection={true}
              enableBrowserTooltips={true}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 
