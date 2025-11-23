'use client'

import { useState, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Mail, Users, Filter, ArrowRight, X } from 'lucide-react'
import { useCampaigns } from '@/hooks/useCampaigns'
import { useToast } from '@/hooks/use-toast'
import type { Database } from '@/lib/supabase'

type Contact = Database['public']['Tables']['contacts']['Row']

interface CampaignFromFilterProps {
  filteredContacts: Contact[]
  onClose: () => void
}

export default function CampaignFromFilter({ 
  filteredContacts, 
  onClose 
}: CampaignFromFilterProps) {
  const [step, setStep] = useState<'preview' | 'form'>('preview')
  const [campaignData, setCampaignData] = useState({
    name: '',
    subject: '',
    content: '',
    html_content: '',
    scheduled_at: ''
  })
  const [templateType, setTemplateType] = useState<string>('custom')
  const [defaultTemplateProps, setDefaultTemplateProps] = useState({
    heading: '',
    ctaText: '',
    ctaUrl: ''
  })
  const [showHtmlEditor, setShowHtmlEditor] = useState(false)
  const [removedRecipients, setRemovedRecipients] = useState<Set<string>>(new Set())

  const { createCampaign } = useCampaigns()
  const { toast } = useToast()

  // Extract email addresses from filtered contacts - memoized to prevent recalculation on every render
  const emailRecipients = useMemo(() => {
    return filteredContacts
      .filter(contact => contact.email && !removedRecipients.has(contact.email.toLowerCase())) // Only include contacts with email that haven't been removed
      .map(contact => ({
        email: contact.email!,
        firstName: contact.first_name || undefined,
        lastName: contact.last_name || undefined,
        contact
      }))
  }, [filteredContacts, removedRecipients])

  const handleRemoveRecipient = useCallback((email: string) => {
    setRemovedRecipients(prev => {
      const next = new Set(prev)
      next.add(email.toLowerCase())
      return next
    })
  }, [])

  const handleRestoreRecipient = useCallback((email: string) => {
    setRemovedRecipients(prev => {
      const next = new Set(prev)
      next.delete(email.toLowerCase())
      return next
    })
  }, [])

  const handleCreateCampaign = useCallback(async () => {
    try {
      const submissionData = {
        ...campaignData,
        metadata: templateType === 'default-template' ? {
          templateName: 'DefaultTemplate',
          templateProps: {
            heading: defaultTemplateProps.heading,
            content: campaignData.content, // Include the body text content
            ctaText: defaultTemplateProps.ctaText,
            ctaUrl: defaultTemplateProps.ctaUrl,
          }
        } : undefined
      }

      // Filter out removed recipients when creating the campaign
      const contactsToUse = filteredContacts.filter(
        contact => contact.email && !removedRecipients.has(contact.email.toLowerCase())
      )
      
      const result = await createCampaign(submissionData, contactsToUse)
      
      if (result) {
        toast({
          title: "Campaign Created",
          description: `Email campaign created for ${emailRecipients.length} recipients.`,
        })
        onClose()
      } else {
        toast({
          title: "Error",
          description: "Failed to create campaign. Please try again.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error creating campaign:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      })
    }
  }, [campaignData, templateType, defaultTemplateProps, createCampaign, filteredContacts, removedRecipients, emailRecipients.length, toast, onClose])

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

          <div className="border-t my-4"></div>

          {/* Email Recipients Preview */}
          <div className="space-y-3">
            <h4 className="font-medium">Email Recipients</h4>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {emailRecipients.map((recipient, index) => (
                <div key={`${recipient.email}-${index}`} className="flex items-center justify-between p-2 bg-muted rounded hover:bg-muted/80 transition-colors">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">
                      {recipient.firstName} {recipient.lastName}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {recipient.email}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0 ml-2"
                    onClick={() => handleRemoveRecipient(recipient.email)}
                    title="Remove recipient"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {removedRecipients.size > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Removed recipients ({removedRecipients.size}):</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {filteredContacts
                      .filter(contact => contact.email && removedRecipients.has(contact.email.toLowerCase()))
                      .map((contact, index) => (
                        <div key={`removed-${contact.email}-${index}`} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/20 rounded text-sm">
                          <div className="flex-1 min-w-0">
                            <span className="font-medium opacity-75">
                              {contact.first_name} {contact.last_name}
                            </span>
                            <span className="text-muted-foreground ml-2 opacity-75">
                              {contact.email}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 flex-shrink-0 ml-2"
                            onClick={() => handleRestoreRecipient(contact.email!)}
                            title="Restore recipient"
                          >
                            <X className="h-3 w-3 rotate-45" />
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {emailRecipients.length === 0 && (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Email Addresses</h3>
              <p className="text-muted-foreground">
                None of the filtered contacts have email addresses. 
                Please adjust your filter or add email addresses to your contacts.
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Campaign Name</Label>
            <Input
              id="name"
              value={campaignData.name}
              onChange={(e) => setCampaignData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter campaign name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Email Subject</Label>
            <Input
              id="subject"
              value={campaignData.subject}
              onChange={(e) => setCampaignData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Enter email subject"
              required
            />
          </div>
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

        {templateType === 'custom' ? (
          <>
            <div className="space-y-2">
              <Label>Email Content Type</Label>
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

            <div className="space-y-2">
              <Label>Email Content</Label>
              <Textarea
                value={showHtmlEditor ? campaignData.html_content : campaignData.content}
                onChange={(e) => setCampaignData(prev => ({ 
                  ...prev, 
                  [showHtmlEditor ? 'html_content' : 'content']: e.target.value 
                }))}
                placeholder={showHtmlEditor ? "Enter HTML..." : "Enter your email content. Use {{firstName}} for personalization..."}
                className="min-h-[200px]"
                required
              />
              {!showHtmlEditor && (
                <div className="mt-2 p-3 bg-muted/50 border border-dashed rounded-md">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">💡 Available personalization variables:</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <div><strong>Name:</strong> <code className="text-xs">{'{{firstName}}'}</code>, <code className="text-xs">{'{{lastName}}'}</code>, <code className="text-xs">{'{{middleName}}'}</code>, <code className="text-xs">{'{{fullName}}'}</code></div>
                    <div><strong>Title:</strong> <code className="text-xs">{'{{prefix}}'}</code>, <code className="text-xs">{'{{suffix}}'}</code></div>
                    <div><strong>Contact:</strong> <code className="text-xs">{'{{email}}'}</code>, <code className="text-xs">{'{{phone}}'}</code></div>
                    <div><strong>Address:</strong> <code className="text-xs">{'{{address1}}'}</code>, <code className="text-xs">{'{{address2}}'}</code>, <code className="text-xs">{'{{city}}'}</code></div>
                    <div><strong>Location:</strong> <code className="text-xs">{'{{state}}'}</code>, <code className="text-xs">{'{{postalCode}}'}</code>, <code className="text-xs">{'{{zipCode}}'}</code>, <code className="text-xs">{'{{county}}'}</code></div>
                    <div><strong>Combined:</strong> <code className="text-xs">{'{{streetAddress}}'}</code>, <code className="text-xs">{'{{fullAddress}}'}</code></div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Default Template Fields */
          <div className="space-y-4 border p-4 rounded-lg bg-muted/50">
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
                value={campaignData.content}
                onChange={(e) => setCampaignData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter the main content of your email..."
                className="min-h-[150px]"
                required
              />
              <div className="mt-2 p-3 bg-muted/50 border border-dashed rounded-md">
                <p className="text-xs font-semibold text-muted-foreground mb-2">💡 Available personalization variables:</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <div><strong>Name:</strong> <code className="text-xs">{'{{firstName}}'}</code>, <code className="text-xs">{'{{lastName}}'}</code>, <code className="text-xs">{'{{middleName}}'}</code>, <code className="text-xs">{'{{fullName}}'}</code></div>
                  <div><strong>Title:</strong> <code className="text-xs">{'{{prefix}}'}</code>, <code className="text-xs">{'{{suffix}}'}</code></div>
                  <div><strong>Contact:</strong> <code className="text-xs">{'{{email}}'}</code>, <code className="text-xs">{'{{phone}}'}</code></div>
                  <div><strong>Address:</strong> <code className="text-xs">{'{{address1}}'}</code>, <code className="text-xs">{'{{address2}}'}</code>, <code className="text-xs">{'{{city}}'}</code></div>
                  <div><strong>Location:</strong> <code className="text-xs">{'{{state}}'}</code>, <code className="text-xs">{'{{postalCode}}'}</code>, <code className="text-xs">{'{{zipCode}}'}</code>, <code className="text-xs">{'{{county}}'}</code></div>
                  <div><strong>Combined:</strong> <code className="text-xs">{'{{streetAddress}}'}</code>, <code className="text-xs">{'{{fullAddress}}'}</code></div>
                </div>
              </div>
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

        {/* Recipients Summary */}
        <div className="bg-muted p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="font-medium">Recipients</span>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            This campaign will be sent to <strong>{emailRecipients.length}</strong> contacts with email addresses.
            {removedRecipients.size > 0 && (
              <span className="ml-2 text-muted-foreground">
                ({removedRecipients.size} removed)
              </span>
            )}
          </p>
          {emailRecipients.length > 0 && (
            <div className="max-h-60 overflow-y-auto space-y-2 mt-3">
              {emailRecipients.map((recipient, index) => (
                <div key={`${recipient.email}-${index}`} className="flex items-center justify-between p-2 bg-background rounded border hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">
                      {recipient.firstName} {recipient.lastName}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {recipient.email}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0 ml-2"
                    onClick={() => handleRemoveRecipient(recipient.email)}
                    title="Remove recipient"
                  >
                    <X className="h-4 w-4" />
                  </Button>
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
