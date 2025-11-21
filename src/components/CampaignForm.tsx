'use client'

import { useState, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarIcon, Mail, Users, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface CampaignFormProps {
  onSubmit: (data: {
    name: string
    subject: string
    content: string
    html_content?: string
    scheduled_at?: string
    metadata?: Record<string, unknown>
  }) => void
  onCancel: () => void
  loading?: boolean
  recipientCount?: number
  initialData?: {
    name: string
    subject: string
    content: string
    html_content?: string | null
    scheduled_at?: string | null
    metadata?: Record<string, unknown>
  }
}

export default function CampaignForm({ 
  onSubmit, 
  onCancel, 
  loading = false, 
  recipientCount = 0,
  initialData 
}: CampaignFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    subject: initialData?.subject || '',
    content: initialData?.content || '',
    html_content: initialData?.html_content || '',
    scheduled_at: initialData?.scheduled_at || ''
  })

  const [showHtmlEditor, setShowHtmlEditor] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    initialData?.scheduled_at ? new Date(initialData.scheduled_at) : undefined
  )
  
  const initialMetadata = initialData?.metadata as Record<string, unknown> | undefined
  const templateProps = initialMetadata?.templateProps as Record<string, unknown> | undefined
  const [templateType, setTemplateType] = useState<string>(initialMetadata?.templateName ? 'default-template' : 'custom')
  
  // Default Template Props
  const [defaultTemplateProps, setDefaultTemplateProps] = useState({
    heading: (templateProps?.heading as string) || '',
    ctaText: (templateProps?.ctaText as string) || '',
    ctaUrl: (templateProps?.ctaUrl as string) || ''
  })

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    
    const submissionData = {
      ...formData,
      metadata: templateType === 'default-template' ? {
        templateName: 'DefaultTemplate',
        templateProps: {
          heading: defaultTemplateProps.heading,
          ctaText: defaultTemplateProps.ctaText,
          ctaUrl: defaultTemplateProps.ctaUrl,
        }
      } : undefined
    }
    
    onSubmit(submissionData)
  }, [formData, templateType, defaultTemplateProps, onSubmit])

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleDateSelect = useCallback((date: Date | undefined) => {
    setSelectedDate(date)
    setFormData(prev => ({ 
      ...prev, 
      scheduled_at: date ? date.toISOString() : '' 
    }))
    setDatePickerOpen(false)
  }, [])

  const isFormValid = useMemo(() => 
    formData.name.trim() && formData.subject.trim() && formData.content.trim(),
    [formData.name, formData.subject, formData.content]
  )

  // Memoize formatted date strings to avoid recalculating on every render
  const formattedDate = useMemo(() => 
    selectedDate ? format(selectedDate, "PPP") : null,
    [selectedDate]
  )

  const formattedDateWithTime = useMemo(() => 
    selectedDate ? format(selectedDate, "PPP 'at' p") : null,
    [selectedDate]
  )

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          {initialData ? 'Edit Campaign' : 'Create Email Campaign'}
        </CardTitle>
        <CardDescription>
          {initialData ? 'Update your email campaign details' : 'Design and schedule your email campaign'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campaign Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Campaign Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter campaign name"
              required
            />
          </div>

          {/* Email Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Email Subject</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder="Enter email subject line"
              required
            />
          </div>

          {/* Template Selection */}
          <div className="space-y-2">
            <Label>Email Template</Label>
            <Select
              value={templateType}
              onValueChange={(value) => setTemplateType(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom HTML / Text</SelectItem>
                <SelectItem value="default-template">Standard Template (React Email)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {templateType === 'custom' 
                ? "Write your own content or paste HTML." 
                : "Use a pre-designed responsive template with heading, text, and a button."}
            </p>
          </div>

          {/* Recipient Count Display */}
          {recipientCount > 0 && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                <strong>{recipientCount}</strong> recipients will receive this email
              </span>
            </div>
          )}

          {/* Scheduling */}
          <div className="space-y-2">
            <Label>Schedule Campaign (Optional)</Label>
            <div className="flex items-center gap-2">
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formattedDate || "Select date and time"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(date: Date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {selectedDate && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedDate(undefined)
                    handleInputChange('scheduled_at', '')
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
            {formattedDateWithTime && (
              <p className="text-sm text-muted-foreground">
                Campaign will be sent on {formattedDateWithTime}
              </p>
            )}
          </div>

          {/* Conditional Rendering based on Template */}
          {templateType === 'custom' ? (
            <>
              {/* Content Type Toggle */}
              <div className="space-y-2">
                <Label>Email Content</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={!showHtmlEditor ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowHtmlEditor(false)}
                  >
                    Plain Text
                  </Button>
                  <Button
                    type="button"
                    variant={showHtmlEditor ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowHtmlEditor(true)}
                  >
                    HTML
                  </Button>
                </div>
              </div>

              {/* Email Content */}
              <div className="space-y-2">
                <Label htmlFor="content">
                  {showHtmlEditor ? 'HTML Content' : 'Email Content'}
                </Label>
                <Textarea
                  id="content"
                  value={showHtmlEditor ? formData.html_content : formData.content}
                  onChange={(e) => handleInputChange(
                    showHtmlEditor ? 'html_content' : 'content', 
                    e.target.value
                  )}
                  placeholder={
                    showHtmlEditor 
                      ? "Enter HTML content for your email..."
                      : "Enter your email content. Use {{firstName}} for personalization..."
                  }
                  className="min-h-[200px]"
                  required
                />
                {!showHtmlEditor && (
                  <p className="text-sm text-muted-foreground">
                    Use <code>{'{{firstName}}'}</code>, <code>{'{{lastName}}'}</code>, or <code>{'{{fullName}}'}</code> for personalization
                  </p>
                )}
              </div>
            </>
          ) : (
            /* Default Template Fields */
            <div className="space-y-4 border p-4 rounded-lg bg-gray-50">
              <h3 className="font-medium mb-2">Template Settings</h3>
              
              <div className="space-y-2">
                <Label htmlFor="heading">Heading</Label>
                <Input
                  id="heading"
                  value={defaultTemplateProps.heading}
                  onChange={(e) => setDefaultTemplateProps(prev => ({ ...prev, heading: e.target.value }))}
                  placeholder="e.g. Welcome to Sirem!"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Body Text</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  placeholder="Enter the main content of your email..."
                  className="min-h-[150px]"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Use <code>{'{{firstName}}'}</code>, <code>{'{{lastName}}'}</code>, or <code>{'{{fullName}}'}</code> for personalization
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ctaText">Button Text</Label>
                  <Input
                    id="ctaText"
                    value={defaultTemplateProps.ctaText}
                    onChange={(e) => setDefaultTemplateProps(prev => ({ ...prev, ctaText: e.target.value }))}
                    placeholder="e.g. Get Started"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ctaUrl">Button URL</Label>
                  <Input
                    id="ctaUrl"
                    value={defaultTemplateProps.ctaUrl}
                    onChange={(e) => setDefaultTemplateProps(prev => ({ ...prev, ctaUrl: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Preview Section */}
          {(formData.content || formData.html_content) && (
            <div className="space-y-2">
              <Label>Preview (Content Only)</Label>
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="text-sm text-gray-600 mb-2">
                  <strong>Subject:</strong> {formData.subject}
                </div>
                <div className="text-sm">
                  {templateType === 'custom' && showHtmlEditor && formData.html_content ? (
                    <div 
                      dangerouslySetInnerHTML={{ __html: formData.html_content }}
                      className="prose prose-sm max-w-none"
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans text-sm">
                      {formData.content}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!isFormValid || loading}
              className="min-w-[120px]"
            >
              {loading ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  {initialData ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                initialData ? 'Update Campaign' : 'Create Campaign'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
