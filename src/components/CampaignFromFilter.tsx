'use client'

import { useState, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Mail, Users, Filter, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { useCampaigns } from '@/hooks/useCampaigns'
import { useToast } from '@/hooks/use-toast'
import type { Database } from '@/lib/supabase'

type Contact = Database['public']['Tables']['contacts']['Row']

interface CampaignFromFilterProps {
  filteredContacts: Contact[]
  onClose: () => void
}

export default function CampaignFromFilter({ filteredContacts, onClose }: CampaignFromFilterProps) {
  const [step, setStep] = useState<'preview' | 'form'>('preview')
  const [campaignData, setCampaignData] = useState({
    name: '',
    subject: '',
    content: '',
    html_content: '',
    scheduled_at: '',
  })
  const [templateType, setTemplateType] = useState<string>('custom')
  const [defaultTemplateProps, setDefaultTemplateProps] = useState({
    heading: '',
    ctaText: '',
    ctaUrl: '',
  })
  const [showHtmlEditor, setShowHtmlEditor] = useState(false)
  const [disabledRecipients, setDisabledRecipients] = useState<Set<string>>(new Set())

  const { createCampaign } = useCampaigns()
  const { toast } = useToast()

  // Extract email addresses from filtered contacts - memoized to prevent recalculation on every render
  const emailRecipients = useMemo(() => {
    return filteredContacts
      .filter((contact) => contact.email) // Only include contacts with email
      .map((contact) => ({
        email: contact.email!,
        firstName: contact.first_name || undefined,
        lastName: contact.last_name || undefined,
        contact,
        disabled: disabledRecipients.has(contact.email!.toLowerCase()),
      }))
  }, [filteredContacts, disabledRecipients])

  const handleToggleRecipient = useCallback((email: string, enabled: boolean) => {
    setDisabledRecipients((prev) => {
      const next = new Set(prev)
      if (enabled) {
        next.delete(email.toLowerCase())
      } else {
        next.add(email.toLowerCase())
      }
      return next
    })
  }, [])

  const handleCreateCampaign = useCallback(async () => {
    try {
      const submissionData = {
        ...campaignData,
        metadata:
          templateType === 'default-template'
            ? {
                templateName: 'DefaultTemplate',
                templateProps: {
                  heading: defaultTemplateProps.heading,
                  content: campaignData.content, // Include the body text content
                  ctaText: defaultTemplateProps.ctaText,
                  ctaUrl: defaultTemplateProps.ctaUrl,
                },
              }
            : undefined,
      }

      // Include all contacts, but pass disabled emails list
      const disabledEmails = Array.from(disabledRecipients)
      const result = await createCampaign(submissionData, filteredContacts, disabledEmails)

      if (result) {
        toast({
          title: 'Campaign Created',
          description: `Email campaign created for ${emailRecipients.length} recipients.`,
        })
        onClose()
      } else {
        toast({
          title: 'Error',
          description: 'Failed to create campaign. Please try again.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error creating campaign:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    }
  }, [
    campaignData,
    templateType,
    defaultTemplateProps,
    createCampaign,
    filteredContacts,
    disabledRecipients,
    emailRecipients.length,
    toast,
    onClose,
  ])

  if (step === 'preview') {
    return (
      <div className="space-y-6">
        {/* Filter Summary */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-blue-600" />
            <span className="font-medium">Filtered Contacts</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-green-600" />
            <span className="text-sm text-gray-600">
              <strong>{filteredContacts.length}</strong> total contacts
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-purple-600" />
            <span className="text-sm text-gray-600">
              <strong>{emailRecipients.length}</strong> contacts with email addresses
            </span>
          </div>
        </div>

        <div className="my-4 border-t"></div>

        {/* Email Recipients Preview */}
        <div className="space-y-3">
          <h4 className="font-medium">Email Recipients</h4>
          <div className="max-h-60 space-y-2 overflow-y-auto">
            {emailRecipients.map((recipient, index) => (
              <div
                key={`${recipient.email}-${index}`}
                className={`hover:bg-muted/80 flex items-center justify-between rounded p-2 transition-colors ${recipient.disabled ? 'bg-muted/50 opacity-60' : 'bg-muted'}`}
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <Checkbox
                    checked={!recipient.disabled}
                    onCheckedChange={(checked) => {
                      handleToggleRecipient(recipient.email, checked === true)
                    }}
                    className="flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="font-medium">
                      {recipient.firstName} {recipient.lastName}
                    </span>
                    <span className="text-muted-foreground ml-2 text-sm">{recipient.email}</span>
                  </div>
                  {!recipient.disabled && <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {emailRecipients.length === 0 && (
          <div className="py-8 text-center">
            <Mail className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">No Email Addresses</h3>
            <p className="text-muted-foreground">
              None of the filtered contacts have email addresses. Please adjust your filter or add email addresses to
              your contacts.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => setStep('form')}
            disabled={emailRecipients.length === 0}
            className="flex items-center gap-2"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Campaign Form Fields */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Campaign Name</Label>
          <Input
            id="name"
            value={campaignData.name}
            onChange={(e) => setCampaignData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Enter campaign name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subject">Email Subject</Label>
          <Input
            id="subject"
            value={campaignData.subject}
            onChange={(e) => setCampaignData((prev) => ({ ...prev, subject: e.target.value }))}
            placeholder="Enter email subject"
            required
          />
        </div>
      </div>

      {/* Template Selection */}
      <div className="space-y-2">
        <Label>Email Template</Label>
        <Select value={templateType} onValueChange={(value) => setTemplateType(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select a template" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="custom">Custom HTML / Text</SelectItem>
            <SelectItem value="default-template">Standard Template (React Email)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-sm">
          {templateType === 'custom'
            ? 'Write your own content or paste HTML.'
            : 'Use a pre-designed responsive template with heading, text, and a button.'}
        </p>
      </div>

      {templateType === 'custom' ? (
        <>
          <div className="space-y-2">
            <Label>Email Content Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={!showHtmlEditor ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowHtmlEditor(false)}
              >
                Plain Text
              </Button>
              <Button
                type="button"
                variant={showHtmlEditor ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowHtmlEditor(true)}
              >
                HTML
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email Content</Label>
            <Textarea
              value={showHtmlEditor ? campaignData.html_content : campaignData.content}
              onChange={(e) =>
                setCampaignData((prev) => ({
                  ...prev,
                  [showHtmlEditor ? 'html_content' : 'content']: e.target.value,
                }))
              }
              placeholder={
                showHtmlEditor ? 'Enter HTML...' : 'Enter your email content. Use {{firstName}} for personalization...'
              }
              className="min-h-[200px]"
              required
            />
            {!showHtmlEditor && (
              <div className="bg-muted/50 mt-2 rounded-md border border-dashed p-3">
                <p className="text-muted-foreground mb-2 text-xs font-semibold">
                  💡 Available personalization variables:
                </p>
                <div className="text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div>
                    <strong>Name:</strong> <code className="text-xs">{'{{firstName}}'}</code>,{' '}
                    <code className="text-xs">{'{{lastName}}'}</code>,{' '}
                    <code className="text-xs">{'{{middleName}}'}</code>,{' '}
                    <code className="text-xs">{'{{fullName}}'}</code>
                  </div>
                  <div>
                    <strong>Title:</strong> <code className="text-xs">{'{{prefix}}'}</code>,{' '}
                    <code className="text-xs">{'{{suffix}}'}</code>
                  </div>
                  <div>
                    <strong>Contact:</strong> <code className="text-xs">{'{{email}}'}</code>,{' '}
                    <code className="text-xs">{'{{phone}}'}</code>
                  </div>
                  <div>
                    <strong>Address:</strong> <code className="text-xs">{'{{address1}}'}</code>,{' '}
                    <code className="text-xs">{'{{address2}}'}</code>, <code className="text-xs">{'{{city}}'}</code>
                  </div>
                  <div>
                    <strong>Location:</strong> <code className="text-xs">{'{{state}}'}</code>,{' '}
                    <code className="text-xs">{'{{postalCode}}'}</code>,{' '}
                    <code className="text-xs">{'{{zipCode}}'}</code>, <code className="text-xs">{'{{county}}'}</code>
                  </div>
                  <div>
                    <strong>Combined:</strong> <code className="text-xs">{'{{streetAddress}}'}</code>,{' '}
                    <code className="text-xs">{'{{fullAddress}}'}</code>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Default Template Fields */
        <div className="bg-muted/50 space-y-4 rounded-lg border p-4">
          <h3 className="mb-2 font-medium">Template Settings</h3>

          <div className="space-y-2">
            <Label htmlFor="heading">Heading</Label>
            <Input
              id="heading"
              value={defaultTemplateProps.heading}
              onChange={(e) => setDefaultTemplateProps((prev) => ({ ...prev, heading: e.target.value }))}
              placeholder="e.g. Welcome to Sirem!"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Body Text</Label>
            <Textarea
              id="content"
              value={campaignData.content}
              onChange={(e) => setCampaignData((prev) => ({ ...prev, content: e.target.value }))}
              placeholder="Enter the main content of your email..."
              className="min-h-[150px]"
              required
            />
            <div className="bg-muted/50 mt-2 rounded-md border border-dashed p-3">
              <p className="text-muted-foreground mb-2 text-xs font-semibold">
                💡 Available personalization variables:
              </p>
              <div className="text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div>
                  <strong>Name:</strong> <code className="text-xs">{'{{firstName}}'}</code>,{' '}
                  <code className="text-xs">{'{{lastName}}'}</code>, <code className="text-xs">{'{{middleName}}'}</code>
                  , <code className="text-xs">{'{{fullName}}'}</code>
                </div>
                <div>
                  <strong>Title:</strong> <code className="text-xs">{'{{prefix}}'}</code>,{' '}
                  <code className="text-xs">{'{{suffix}}'}</code>
                </div>
                <div>
                  <strong>Contact:</strong> <code className="text-xs">{'{{email}}'}</code>,{' '}
                  <code className="text-xs">{'{{phone}}'}</code>
                </div>
                <div>
                  <strong>Address:</strong> <code className="text-xs">{'{{address1}}'}</code>,{' '}
                  <code className="text-xs">{'{{address2}}'}</code>, <code className="text-xs">{'{{city}}'}</code>
                </div>
                <div>
                  <strong>Location:</strong> <code className="text-xs">{'{{state}}'}</code>,{' '}
                  <code className="text-xs">{'{{postalCode}}'}</code>, <code className="text-xs">{'{{zipCode}}'}</code>,{' '}
                  <code className="text-xs">{'{{county}}'}</code>
                </div>
                <div>
                  <strong>Combined:</strong> <code className="text-xs">{'{{streetAddress}}'}</code>,{' '}
                  <code className="text-xs">{'{{fullAddress}}'}</code>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ctaText">Button Text</Label>
              <Input
                id="ctaText"
                value={defaultTemplateProps.ctaText}
                onChange={(e) => setDefaultTemplateProps((prev) => ({ ...prev, ctaText: e.target.value }))}
                placeholder="e.g. Get Started"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ctaUrl">Button URL</Label>
              <Input
                id="ctaUrl"
                value={defaultTemplateProps.ctaUrl}
                onChange={(e) => setDefaultTemplateProps((prev) => ({ ...prev, ctaUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Recipients Summary */}
      <div className="bg-muted rounded-lg p-4">
        <div className="mb-2 flex items-center gap-2">
          <Users className="text-primary h-4 w-4" />
          <span className="font-medium">Recipients</span>
        </div>
        <p className="text-muted-foreground mb-3 text-sm">
          This campaign will be sent to <strong>{emailRecipients.filter((r) => !r.disabled).length}</strong> of{' '}
          <strong>{emailRecipients.length}</strong> contacts.
          {disabledRecipients.size > 0 && (
            <span className="text-muted-foreground ml-2">({disabledRecipients.size} disabled)</span>
          )}
        </p>
        {emailRecipients.length > 0 && (
          <div className="mt-3 max-h-60 space-y-2 overflow-y-auto">
            {emailRecipients.map((recipient, index) => (
              <div
                key={`${recipient.email}-${index}`}
                className={`hover:bg-muted/50 flex items-center justify-between rounded border p-2 transition-colors ${recipient.disabled ? 'bg-muted/50 border-muted opacity-60' : 'bg-background'}`}
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <Checkbox
                    checked={!recipient.disabled}
                    onCheckedChange={(checked) => {
                      handleToggleRecipient(recipient.email, checked === true)
                    }}
                    className="flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="font-medium">
                      {recipient.firstName} {recipient.lastName}
                    </span>
                    <span className="text-muted-foreground ml-2 text-sm">{recipient.email}</span>
                  </div>
                  {!recipient.disabled && <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setStep('preview')}>
          Back
        </Button>
        <Button
          onClick={handleCreateCampaign}
          disabled={!campaignData.name || !campaignData.subject || !campaignData.content}
          className="flex items-center gap-2"
        >
          <Mail className="h-4 w-4" />
          Create Campaign
        </Button>
      </div>
    </div>
  )
}
