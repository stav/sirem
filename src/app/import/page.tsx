'use client'

import React, { useState } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { importIntegrityData } from '@/lib/integrity-import'
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
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    success: boolean
    message: string
  } | null>(null)
  const [preview, setPreview] = useState<{
    totalLeads: number
    sampleLeads: Array<{
      firstName: string
      lastName: string
      status: string
      tags: string[]
    }>
  } | null>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setImportResult(null)

    // Preview the file
    try {
      const text = await selectedFile.text()
      const data = JSON.parse(text)

      if (data.result && Array.isArray(data.result)) {
        const sampleLeads = data.result.slice(0, 5).map((lead: IntegrityLeadPreview) => ({
          firstName: lead.firstName,
          lastName: lead.lastName,
          status: lead.statusName,
          tags: lead.leadTags?.map((tag: { tag: { tagLabel: string } }) => tag.tag.tagLabel) || [],
        }))

        setPreview({
          totalLeads: data.result.length,
          sampleLeads,
        })
      }
    } catch (error) {
      console.error('Error previewing file:', error)
      setPreview(null)
    }
  }

  const handleImport = async () => {
    if (!file) return

    setIsImporting(true)
    setImportResult(null)

    try {
      const text = await file.text()
      const result = await importIntegrityData(text)
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
    <div className="min-h-screen bg-background">
      <Navigation pageTitle="Import" />

      <div className="p-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-foreground">Import Integrity Data</h1>
            <p className="text-muted-foreground">
              Upload your Integrity export file to import leads, contacts, reminders, and tags into your CRM.
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
                  <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 text-center">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                      disabled={isImporting}
                    />
                    <label htmlFor="file-upload" className="flex cursor-pointer flex-col items-center">
                      <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">
                        {file ? file.name : 'Click to select JSON file'}
                      </span>
                      <span className="mt-1 text-xs text-muted-foreground">
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
                            <Upload className="mr-2 h-4 w-4" />
                            Import Data
                          </>
                        )}
                      </Button>

                      {importResult && (
                        <Alert
                          className={importResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}
                        >
                          {importResult.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                          <AlertDescription className={importResult.success ? 'text-green-800' : 'text-red-800'}>
                            {importResult.message}
                          </AlertDescription>
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
                    <div className="rounded-lg bg-muted/50 p-4">
                      <div className="text-sm font-medium text-foreground">
                        Total Leads: {preview.totalLeads.toLocaleString()}
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-2 text-sm font-medium text-foreground">Sample Leads:</h4>
                      <div className="space-y-2">
                        {preview.sampleLeads.map((lead, index) => (
                          <div key={index} className="rounded-lg border bg-card p-3">
                            <div className="text-sm font-medium">
                              {lead.firstName} {lead.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground">Status: {lead.status}</div>
                            {lead.tags.length > 0 && (
                              <div className="mt-1 text-xs text-muted-foreground">Tags: {lead.tags.join(', ')}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <FileText className="mx-auto mb-4 h-12 w-12 opacity-50" />
                    <p>Select a file to see preview</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Instructions */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Import Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm text-muted-foreground">
                <div>
                  <h4 className="mb-2 font-medium text-foreground">What will be imported:</h4>
                  <ul className="ml-4 list-inside list-disc space-y-1">
                    <li>Contact information (names, addresses, phones, emails)</li>
                    <li>Medicare-specific data (Part A/B status, beneficiary ID, etc.)</li>
                    <li>Reminders and tasks</li>
                    <li>Tags and tag categories</li>
                    <li>Lead statuses</li>
                    <li>Notes and additional metadata</li>
                  </ul>
                </div>

                <div>
                  <h4 className="mb-2 font-medium text-foreground">Important notes:</h4>
                  <ul className="ml-4 list-inside list-disc space-y-1">
                    <li>Existing data with the same IDs will be updated</li>
                    <li>The import process may take several minutes for large files</li>
                    <li>Make sure your database schema is up to date before importing</li>
                    <li>Backup your current data before running large imports</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
