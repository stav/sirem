'use client'

import React, { useState } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle, Loader2, Activity, Tag, ClipboardList } from 'lucide-react'
import { importIntegrityData, importActivitiesData, importTagsData } from '@/lib/integrity-import'
import { importPlansCsv } from '@/lib/plans-import'
import Navigation from '@/components/Navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

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
  const [importType, setImportType] = useState<'full' | 'activities' | 'tags' | 'plans'>('full')
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
  } | null>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setImportResult(null)

    // Preview the file
    if (importType === 'plans') {
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
                          onChange={(e) => setImportType(e.target.value as 'full' | 'activities' | 'tags' | 'plans')}
                          className="text-primary"
                        />
                        <span className="text-sm">Full Import (Leads + Activities)</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="activities"
                          checked={importType === 'activities'}
                          onChange={(e) => setImportType(e.target.value as 'full' | 'activities' | 'tags' | 'plans')}
                          className="text-primary"
                        />
                        <span className="text-sm">Activities Only</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="tags"
                          checked={importType === 'tags'}
                          onChange={(e) => setImportType(e.target.value as 'full' | 'activities' | 'tags' | 'plans')}
                          className="text-primary"
                        />
                        <span className="text-sm">Tags Only</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="plans"
                          checked={importType === 'plans'}
                          onChange={(e) => setImportType(e.target.value as 'full' | 'activities' | 'tags' | 'plans')}
                          className="text-primary"
                        />
                        <span className="text-sm">Plans (CSV)</span>
                      </label>
                    </div>
                  </div>

                  <div className="border-muted-foreground/25 rounded-lg border-2 border-dashed p-6 text-center">
                    <input
                      type="file"
                      accept={importType === 'plans' ? '.csv' : '.json'}
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                      disabled={isImporting}
                    />
                    <label htmlFor="file-upload" className="flex cursor-pointer flex-col items-center">
                      <FileText className="text-muted-foreground mb-4 h-12 w-12" />
                      <span className="text-foreground text-sm font-medium">
                        {file ? file.name : 'Click to select JSON file'}
                      </span>
                      <span className="text-muted-foreground mt-1 text-xs">
                        {file ? 'Click to change file' : 'Supports .json files only'}
                      </span>
                    </label>
                  </div>

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
                            ) : (
                              <Upload className="mr-2 h-4 w-4" />
                            )}
                            {importType === 'activities'
                              ? 'Import Activities'
                              : importType === 'tags'
                                ? 'Import Tags'
                                : importType === 'plans'
                                  ? 'Import Plans'
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
