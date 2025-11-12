'use client'

import React, { useState } from 'react'
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  Activity,
  Tag,
  ClipboardList,
  CheckSquare,
} from 'lucide-react'
import {
  importIntegrityData,
  importActivitiesData,
  importTagsData,
} from '@/lib/integrity-import'
import { importPlansCsv } from '@/lib/plans-import'
import { importActionsCsv, parseKitTextFormat, isKitTextFormat } from '@/lib/actions-import'
import { parseCsv, normalizeHeader } from '@/lib/csv-utils'
import Navigation from '@/components/Navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import DateTimeInput from '@/components/ui/datetime-input'

type ImportType = 'full' | 'activities' | 'tags' | 'plans' | 'contact-actions'

interface IntegrityLeadPreview {
  firstName: string
  lastName: string
  statusName: string
  leadTags: Array<{
    tag: {
      tagLabel: string
    }
  }>
  activities: Array<{
    activitySubject: string
    activityTypeName: string
    activityNote: string | null
  }>
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importType, setImportType] = useState<ImportType>('full')
  const handleImportTypeChange = async (value: ImportType) => {
    const currentFile = file
    setImportType(value)
    setPreview(null)
    setImportResult(null)
    
    // If a file was already selected, re-process it with the new import type
    if (currentFile) {
      // Re-process the file with the new import type
      const syntheticEvent = {
        target: {
          files: [currentFile],
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>
      // Pass the new import type directly to avoid closure issues
      await handleFileSelect(syntheticEvent, value)
    }
  }
  const [importResult, setImportResult] = useState<{
    success: boolean
    message: string
    stats?: {
      total: number
      imported: number
      skipped: number
      errors: number
    }
  } | null>(null)
  const [actionTemplate, setActionTemplate] = useState<{
    title: string
    description: string
    tags: string
    status: string
    priority: 'none' | 'low' | 'medium' | 'high'
    start_date: string
    completed_date: string
    source: string
  }>({
    title: 'Kit Email Blast',
    description: 'Sent bulk email via Kit.com',
    tags: 'kit email-blast',
    status: 'completed',
    priority: 'medium',
    start_date: '',
    completed_date: new Date().toISOString(),
    source: 'Kit Import',
  })
  const [preview, setPreview] = useState<{
    totalLeads?: number
    totalActivities?: number
    totalTags?: number
    sampleLeads?: Array<{
      firstName: string
      lastName: string
      status: string
      tags: string[]
      activities: Array<{
        subject: string
        type: string
        note: string | null
      }>
    }>
    // Plans CSV preview
    totalPlans?: number
    samplePlans?: Array<{
      name: string
      carrier: string
      type: string
      premium: string
      year: string
    }>
    // Actions CSV preview
    totalContacts?: number
    sampleContacts?: Array<{
      name: string
      email: string
      status?: string
    }>
  } | null>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, overrideImportType?: ImportType) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) {
      console.log('No file selected')
      return
    }

    const currentImportType = overrideImportType ?? importType
    console.log('File selected:', selectedFile.name, 'Import type:', currentImportType)
    setFile(selectedFile)
    setImportResult(null)

    // Preview the file
    if (currentImportType === 'plans') {
      // CSV preview for plans
      try {
        const text = await selectedFile.text()
        const lines = text.split('\n').filter((line) => line.trim())
        const headers = lines[0].split(',')
        const dataRows = lines.slice(1).filter((line) => line.trim() && !line.startsWith(',,,'))

        // Find column indices
        const nameIdx = headers.findIndex((h) => h.toLowerCase().includes('name'))
        const carrierIdx = headers.findIndex((h) => h.toLowerCase().includes('carrier'))
        const typeIdx = headers.findIndex((h) => h.toLowerCase().includes('type'))
        const premiumIdx = headers.findIndex((h) => h.toLowerCase().includes('premium'))
        const descIdx = headers.findIndex((h) => h.toLowerCase().includes('description'))

        const samplePlans = dataRows.slice(0, 5).map((line) => {
          const cols = line.split(',')
          // Extract year from description if present
          const desc = descIdx >= 0 ? cols[descIdx] : ''
          const yearMatch = desc?.match(/^(\d{4})\s/)
          const year = yearMatch ? yearMatch[1] : ''

          return {
            name: nameIdx >= 0 ? cols[nameIdx] : '',
            carrier: carrierIdx >= 0 ? cols[carrierIdx] : '',
            type: typeIdx >= 0 ? cols[typeIdx] : '',
            premium: premiumIdx >= 0 ? cols[premiumIdx] : '',
            year: year,
          }
        })

        setPreview({
          totalPlans: dataRows.length,
          samplePlans,
        })
      } catch (error) {
        console.error('Error previewing CSV:', error)
        setPreview(null)
      }
    } else if (currentImportType === 'contact-actions') {
      try {
        console.log('Processing contact-actions file preview')
        const text = await selectedFile.text()
        console.log('File text length:', text.length, 'First 200 chars:', text.substring(0, 200))
        
        const uniqueContacts = new Map<
          string,
          {
            name: string
            email: string
            status?: string
          }
        >()

        // Detect format and parse accordingly
        if (isKitTextFormat(text)) {
          console.log('Detected Kit.com text format')
          const kitContacts = parseKitTextFormat(text)
          kitContacts.forEach((contact) => {
            if (contact.email && !uniqueContacts.has(contact.email)) {
              const name = contact.fullName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || '(no name)'
              uniqueContacts.set(contact.email, {
                name,
                email: contact.email,
                status: undefined, // Kit format doesn't include status
              })
            }
          })
        } else {
          console.log('Detected CSV format')
          const rows = parseCsv(text)
          console.log('Parsed rows:', rows.length)
          if (rows.length === 0) {
            console.log('No rows found in CSV')
            setPreview(null)
            return
          }

          const header = rows[0].map(normalizeHeader)
          console.log('CSV headers:', header)
          const emailIdx = header.findIndex((h) => h === 'email')
          console.log('Email column index:', emailIdx)
          if (emailIdx === -1) {
            console.log('No email column found. Available headers:', header)
            setPreview(null)
            return
          }

          const firstNameIdx = header.findIndex((h) => h === 'first name')
          const lastNameIdx = header.findIndex((h) => h === 'last name')
          const fullNameIdx = header.findIndex((h) => h === 'full name')
          const statusIdx = header.findIndex((h) => h === 'status')

          const dataRows = rows.slice(1).filter((line) => line.some((cell) => cell && cell.trim() !== ''))

          dataRows.forEach((cols) => {
            const emailRaw = cols[emailIdx]?.trim().toLowerCase()
            if (!emailRaw) return
            if (uniqueContacts.has(emailRaw)) return

            const firstName = firstNameIdx >= 0 ? cols[firstNameIdx]?.trim() : ''
            const lastName = lastNameIdx >= 0 ? cols[lastNameIdx]?.trim() : ''
            const fullName = fullNameIdx >= 0 ? cols[fullNameIdx]?.trim() : ''
            const name = fullName || `${firstName} ${lastName}`.trim() || '(no name)'
            const status = statusIdx >= 0 ? cols[statusIdx]?.trim() : undefined

            uniqueContacts.set(emailRaw, {
              name,
              email: cols[emailIdx]?.trim() ?? '',
              status,
            })
          })
        }

        const previewData = {
          totalContacts: uniqueContacts.size,
          sampleContacts: Array.from(uniqueContacts.values()).slice(0, 5),
        }
        console.log('Setting preview with', previewData.totalContacts, 'contacts')
        setPreview(previewData)
      } catch (error) {
        console.error('Error previewing contact-actions CSV:', error)
        setPreview(null)
      }
    } else {
      // JSON preview for other import types
      try {
        const text = await selectedFile.text()
        const data = JSON.parse(text)

        if (data.result && Array.isArray(data.result)) {
          const totalActivities = data.result.reduce(
            (sum: number, lead: { activities?: Array<{ activitySubject: string }> }) =>
              sum + (lead.activities?.length || 0),
            0
          )

          const totalTags = data.result.reduce(
            (sum: number, lead: { leadTags?: Array<{ tag: { tagLabel: string } }> }) =>
              sum + (lead.leadTags?.length || 0),
            0
          )

          const sampleLeads = data.result.slice(0, 5).map((lead: IntegrityLeadPreview) => ({
            firstName: lead.firstName,
            lastName: lead.lastName,
            status: lead.statusName,
            tags: lead.leadTags?.map((tag: { tag: { tagLabel: string } }) => tag.tag.tagLabel) || [],
            activities:
              lead.activities?.map(
                (activity: { activitySubject: string; activityTypeName: string; activityNote: string | null }) => ({
                  subject: activity.activitySubject,
                  type: activity.activityTypeName,
                  note: activity.activityNote,
                })
              ) || [],
          }))

          setPreview({
            totalLeads: data.result.length,
            totalActivities,
            totalTags,
            sampleLeads,
          })
        }
      } catch (error) {
        console.error('Error previewing file:', error)
        setPreview(null)
      }
    }
  }

  const handleImport = async () => {
    if (!file) return

    if (importType === 'contact-actions' && !actionTemplate.title.trim()) {
      setImportResult({
        success: false,
        message: 'Action title is required before creating actions.',
      })
      return
    }

    setIsImporting(true)
    setImportResult(null)

    try {
      const text = await file.text()
      let result
      if (importType === 'activities') {
        result = await importActivitiesData(text)
      } else if (importType === 'tags') {
        result = await importTagsData(text)
      } else if (importType === 'plans') {
        result = await importPlansCsv(text)
      } else if (importType === 'contact-actions') {
        result = await importActionsCsv(text, {
          title: actionTemplate.title.trim(),
          description: actionTemplate.description,
          tags: actionTemplate.tags,
          status: actionTemplate.status,
          priority: actionTemplate.priority === 'none' ? undefined : actionTemplate.priority,
          start_date: actionTemplate.start_date || null,
          completed_date: actionTemplate.completed_date || null,
          source: actionTemplate.source,
        })
      } else {
        result = await importIntegrityData(text)
      }
      setImportResult(result)
    } catch (error) {
      setImportResult({
        success: false,
        message: `Import failed: ${error}`,
      })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="bg-background min-h-screen">
      <Navigation pageTitle="Import" />

      <div className="p-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-foreground mb-2 text-3xl font-bold">Import Integrity Data</h1>
            <p className="text-muted-foreground">
              Upload your Integrity export file to import leads, contacts, and activities into your CRM.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="mr-2 h-5 w-5" />
                  Upload File
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Import Type Selection */}
                  <div className="space-y-2">
                    <label className="text-foreground text-sm font-medium">Import Type:</label>
                    <div className="flex flex-col space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="full"
                          checked={importType === 'full'}
                          onChange={(e) => handleImportTypeChange(e.target.value as ImportType)}
                          className="text-primary"
                        />
                        <span className="text-sm">Full Import (Leads + Activities)</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="activities"
                          checked={importType === 'activities'}
                          onChange={(e) => handleImportTypeChange(e.target.value as ImportType)}
                          className="text-primary"
                        />
                        <span className="text-sm">Activities Only</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="tags"
                          checked={importType === 'tags'}
                          onChange={(e) => handleImportTypeChange(e.target.value as ImportType)}
                          className="text-primary"
                        />
                        <span className="text-sm">Tags Only</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="plans"
                          checked={importType === 'plans'}
                          onChange={(e) => handleImportTypeChange(e.target.value as ImportType)}
                          className="text-primary"
                        />
                        <span className="text-sm">Plans (CSV)</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="contact-actions"
                          checked={importType === 'contact-actions'}
                          onChange={(e) =>
                            handleImportTypeChange(e.target.value as ImportType)
                          }
                          className="text-primary"
                        />
                        <span className="text-sm">Contact Actions (CSV)</span>
                      </label>
                    </div>
                  </div>

                  <div className="border-muted-foreground/25 rounded-lg border-2 border-dashed p-6 text-center">
                    <input
                      type="file"
                      accept={importType === 'plans' ? '.csv' : importType === 'contact-actions' ? '.csv,.txt' : '.json'}
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                      disabled={isImporting}
                    />
                    <label htmlFor="file-upload" className="flex cursor-pointer flex-col items-center">
                      <FileText className="text-muted-foreground mb-4 h-12 w-12" />
                      <span className="text-foreground text-sm font-medium">
                        {file
                          ? file.name
                          : `Click to select ${
                              importType === 'plans'
                                ? 'CSV'
                                : importType === 'contact-actions'
                                  ? 'CSV or text'
                                  : 'JSON'
                            } file`}
                      </span>
                      <span className="text-muted-foreground mt-1 text-xs">
                        {file
                          ? 'Click to change file'
                          : `Supports ${
                              importType === 'plans'
                                ? '.csv'
                                : importType === 'contact-actions'
                                  ? '.csv or .txt (Kit.com format)'
                                  : '.json'
                            } files only`}
                      </span>
                    </label>
                  </div>

                  {importType === 'contact-actions' && (
                    <div className="space-y-4 rounded-lg border p-4">
                      <div>
                        <Label htmlFor="action-title">Action Title</Label>
                        <Input
                          id="action-title"
                          value={actionTemplate.title}
                          onChange={(e) => setActionTemplate((prev) => ({ ...prev, title: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="action-description">Description</Label>
                        <Textarea
                          id="action-description"
                          value={actionTemplate.description}
                          onChange={(e) => setActionTemplate((prev) => ({ ...prev, description: e.target.value }))}
                          rows={3}
                        />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label htmlFor="action-tags">Tags (space separated)</Label>
                          <Input
                            id="action-tags"
                            value={actionTemplate.tags}
                            onChange={(e) => setActionTemplate((prev) => ({ ...prev, tags: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="action-source">Source</Label>
                          <Input
                            id="action-source"
                            value={actionTemplate.source}
                            onChange={(e) => setActionTemplate((prev) => ({ ...prev, source: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label htmlFor="action-status">Status</Label>
                          <Select
                            value={actionTemplate.status}
                            onValueChange={(value) =>
                              setActionTemplate((prev) => ({
                                ...prev,
                                status: value,
                              }))
                            }
                          >
                            <SelectTrigger id="action-status">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="planned">Planned</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="action-priority">Priority</Label>
                          <Select
                            value={actionTemplate.priority}
                            onValueChange={(value: 'none' | 'low' | 'medium' | 'high') =>
                              setActionTemplate((prev) => ({
                                ...prev,
                                priority: value,
                              }))
                            }
                          >
                            <SelectTrigger id="action-priority">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <DateTimeInput
                          id="action-start-date"
                          label="Start Date (optional)"
                          value={actionTemplate.start_date}
                          onChange={(value) => setActionTemplate((prev) => ({ ...prev, start_date: value || '' }))}
                        />
                        <DateTimeInput
                          id="action-completed-date"
                          label="Completed Date"
                          value={actionTemplate.completed_date}
                          onChange={(value) => setActionTemplate((prev) => ({ ...prev, completed_date: value || '' }))}
                        />
                      </div>
                    </div>
                  )}

                  {file && (
                    <div className="space-y-4">
                      <Button onClick={handleImport} disabled={isImporting} className="w-full">
                        {isImporting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          <>
                            {importType === 'activities' ? (
                              <Activity className="mr-2 h-4 w-4" />
                            ) : importType === 'tags' ? (
                              <Tag className="mr-2 h-4 w-4" />
                            ) : importType === 'plans' ? (
                              <ClipboardList className="mr-2 h-4 w-4" />
                            ) : importType === 'contact-actions' ? (
                              <CheckSquare className="mr-2 h-4 w-4" />
                            ) : (
                              <Upload className="mr-2 h-4 w-4" />
                            )}
                            {importType === 'activities'
                              ? 'Import Activities'
                              : importType === 'tags'
                                ? 'Import Tags'
                                : importType === 'plans'
                                  ? 'Import Plans'
                                  : importType === 'contact-actions'
                                    ? 'Create Actions'
                                  : 'Import Data'}
                          </>
                        )}
                      </Button>

                      {importResult && (
                        <Alert
                          className={
                            importResult.success
                              ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/50'
                              : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/50'
                          }
                        >
                          {importResult.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                          )}
                          <AlertDescription
                            className={
                              importResult.success
                                ? 'text-green-800 dark:text-green-400'
                                : 'text-red-800 dark:text-red-400'
                            }
                          >
                            {importResult.message}
                          </AlertDescription>
                          {importResult.stats && (
                            <div className="mt-2 text-xs text-green-700 dark:text-green-400">
                              <div>Total: {importResult.stats.total}</div>
                              <div>Imported: {importResult.stats.imported}</div>
                              <div>Skipped: {importResult.stats.skipped}</div>
                              <div>Errors: {importResult.stats.errors}</div>
                            </div>
                          )}
                        </Alert>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Preview Section */}
            <Card>
              <CardHeader>
                <CardTitle>File Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {preview ? (
                  <div className="space-y-4">
                    {/* Plans Preview */}
                    {preview.totalPlans !== undefined && (
                      <>
                        <div className="bg-muted/50 rounded-lg p-4">
                          <div className="text-foreground text-sm font-medium">
                            Total Plans: {preview.totalPlans.toLocaleString()}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-foreground mb-2 text-sm font-medium">Sample Plans:</h4>
                          <div className="space-y-2">
                            {preview.samplePlans?.map((plan, index) => (
                              <div key={index} className="bg-card rounded-lg border p-3">
                                <div className="text-sm font-medium">{plan.name}</div>
                                <div className="text-muted-foreground text-xs">
                                  {plan.carrier} • {plan.type}
                                  {plan.year && ` • ${plan.year}`}
                                </div>
                                {plan.premium && (
                                  <div className="text-muted-foreground mt-1 text-xs">Premium: {plan.premium}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Leads Preview */}
                    {preview.totalLeads !== undefined && (
                      <>
                        <div className="bg-muted/50 rounded-lg p-4">
                          <div className="text-foreground text-sm font-medium">
                            Total Leads: {preview.totalLeads.toLocaleString()}
                          </div>
                          <div className="text-muted-foreground text-sm">
                            Total Activities: {preview.totalActivities?.toLocaleString()}
                          </div>
                          <div className="text-muted-foreground text-sm">
                            Total Tags: {preview.totalTags?.toLocaleString()}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-foreground mb-2 text-sm font-medium">Sample Leads:</h4>
                          <div className="space-y-2">
                            {preview.sampleLeads?.map((lead, index) => (
                              <div key={index} className="bg-card rounded-lg border p-3">
                                <div className="text-sm font-medium">
                                  {lead.firstName} {lead.lastName}
                                </div>
                                <div className="text-muted-foreground text-xs">Status: {lead.status}</div>
                                {lead.tags.length > 0 && (
                                  <div className="text-muted-foreground mt-1 text-xs">Tags: {lead.tags.join(', ')}</div>
                                )}
                                {lead.activities.length > 0 && (
                                  <div className="text-muted-foreground mt-1 text-xs">
                                    Activities: {lead.activities.length} (
                                    {lead.activities
                                      .slice(0, 2)
                                      .map((a) => a.subject)
                                      .join(', ')}
                                    )
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Actions Preview */}
                    {preview.totalContacts !== undefined && (
                      <>
                        <div className="bg-muted/50 rounded-lg p-4">
                          <div className="text-foreground text-sm font-medium">
                            Total Contacts: {preview.totalContacts.toLocaleString()}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-foreground mb-2 text-sm font-medium">Sample Contacts:</h4>
                          <div className="space-y-2">
                            {preview.sampleContacts?.map((contact, index) => (
                              <div key={`${contact.email}-${index}`} className="bg-card rounded-lg border p-3">
                                <div className="text-sm font-medium">{contact.name}</div>
                                <div className="text-muted-foreground text-xs">{contact.email}</div>
                                {contact.status && (
                                  <div className="text-muted-foreground mt-1 text-xs">Status: {contact.status}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-center">
                    <FileText className="mx-auto mb-4 h-12 w-12 opacity-50" />
                    <p className="text-sm">Select a file to preview its contents</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
