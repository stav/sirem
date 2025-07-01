'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, GridReadyEvent, CellValueChangedEvent, ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { Input } from '@/components/ui/input'
import type { Database } from '@/lib/supabase'
import { logger } from '@/lib/logger'

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule])

type Contact = Database['public']['Tables']['contacts']['Row'] & {
  address?: Database['public']['Tables']['addresses']['Row'][] | null
}



export default function SheetsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const gridRef = useRef<AgGridReact>(null)

  // Filter contacts based on search term
  const filteredContacts = useMemo(() => {
    if (!searchTerm.trim()) {
      return contacts
    }
    
    const term = searchTerm.toLowerCase()
    return contacts.filter(contact => 
      contact.first_name?.toLowerCase().includes(term) ||
      contact.last_name?.toLowerCase().includes(term) ||
      contact.email?.toLowerCase().includes(term) ||
      contact.phone?.toLowerCase().includes(term) ||
      contact.notes?.toLowerCase().includes(term) ||
      contact.status?.toLowerCase().includes(term) ||
      (contact.birthdate && new Date(contact.birthdate).toLocaleDateString().toLowerCase().includes(term)) ||
      contact.address?.some(addr => 
        addr.address1?.toLowerCase().includes(term) ||
        addr.address2?.toLowerCase().includes(term) ||
        addr.city?.toLowerCase().includes(term) ||
        addr.state_code?.toLowerCase().includes(term) ||
        addr.postal_code?.toLowerCase().includes(term)
      )
    )
  }, [contacts, searchTerm])

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
      field: 'status',
      headerName: 'Status',
      editable: true,
      sortable: true,
      filter: true,
      width: 120,
    },
    {
      field: 'birthdate',
      headerName: 'Birthday',
      editable: true,
      sortable: true,
      filter: true,
      width: 120,
      valueFormatter: (params) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleDateString();
      },
      tooltipValueGetter: (params) => {
        if (!params.value) return '';
        const date = new Date(params.value);
        const today = new Date();
        const nextBirthday = new Date(today.getFullYear(), date.getMonth(), date.getDate());
        if (nextBirthday < today) {
          nextBirthday.setFullYear(today.getFullYear() + 1);
        }
        const daysUntil = Math.ceil((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return `${date.toLocaleDateString()} (${daysUntil} days until next birthday)`;
      }
    },
    {
      field: 'address',
      headerName: 'Address',
      sortable: true,
      filter: true,
      width: 300,
      valueGetter: (params) => {
        const addresses = params.data.address
        if (!addresses || addresses.length === 0) return ''
        
        // Take the first address
        const address = addresses[0]
        const parts = [
          address.address1,
          address.address2,
          address.city,
          address.state_code,
          address.postal_code
        ].filter(Boolean)
        
        return parts.join(', ')
      },
      tooltipValueGetter: (params) => {
        const addresses = params.data.address
        if (!addresses || addresses.length === 0) return ''
        
        // Take the first address
        const address = addresses[0]
        const parts = [
          address.address1,
          address.address2,
          address.city,
          address.state_code,
          address.postal_code
        ].filter(Boolean)
        
        return parts.join('\n')
      }
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
        .select(`
          *,
          address:addresses(
            address1,
            address2,
            city,
            state_code,
            postal_code
          )
        `)
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
          <div className="w-full" style={{ height: '80vh' }}>
            <AgGridReact
              ref={gridRef}
              rowData={filteredContacts}
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
            {/* Custom Status Bar with Search */}
            <div className="flex items-center justify-between w-full px-4 py-2 bg-muted border-t text-sm">
              <div className="flex items-center space-x-4">
                <span className="text-muted-foreground">
                  Total: {contacts.length} contacts
                </span>
                {searchTerm && (
                  <span className="text-muted-foreground">
                    Showing: {filteredContacts.length} results
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-48 h-7 text-sm"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
