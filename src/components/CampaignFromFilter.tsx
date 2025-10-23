'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mail, Users, Filter, ArrowRight } from 'lucide-react'
import { useCampaigns } from '@/hooks/useCampaigns'
import { useToast } from '@/hooks/use-toast'

interface CampaignFromFilterProps {
  filteredContacts: any[]
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

  const { createCampaign } = useCampaigns()
  const { toast } = useToast()

  // Extract email addresses from filtered contacts
  const emailRecipients = filteredContacts
    .filter(contact => {
      // Check main email field
      if (contact.email) return true
      // Check emails from related emails table
      if (contact.emails && contact.emails.length > 0) {
        return contact.emails.some((email: any) => !email.inactive)
      }
      return false
    })
    .map(contact => ({
      email: contact.email || contact.emails?.find((e: any) => !e.inactive)?.email_address,
      firstName: contact.first_name,
      lastName: contact.last_name,
      contact
    }))

  const handleCreateCampaign = async () => {
    try {
      const result = await createCampaign(campaignData, filteredContacts)
      
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
  }

  if (step === 'preview') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Create Email Campaign
          </CardTitle>
          <CardDescription>
            Create an email campaign for your filtered contacts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
            <div className="max-h-40 overflow-y-auto space-y-2">
              {emailRecipients.slice(0, 10).map((recipient, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">
                      {recipient.firstName} {recipient.lastName}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">
                      {recipient.email}
                    </span>
                  </div>
                </div>
              ))}
              {emailRecipients.length > 10 && (
                <div className="text-sm text-gray-500 text-center py-2">
                  ... and {emailRecipients.length - 10} more recipients
                </div>
              )}
            </div>
          </div>

          {emailRecipients.length === 0 && (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Email Addresses</h3>
              <p className="text-gray-500">
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
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Campaign Details
        </CardTitle>
        <CardDescription>
          Configure your email campaign for {emailRecipients.length} recipients
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Campaign Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Campaign Name</label>
            <input
              type="text"
              value={campaignData.name}
              onChange={(e) => setCampaignData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter campaign name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Subject</label>
            <input
              type="text"
              value={campaignData.subject}
              onChange={(e) => setCampaignData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Enter email subject"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Email Content</label>
          <textarea
            value={campaignData.content}
            onChange={(e) => setCampaignData(prev => ({ ...prev, content: e.target.value }))}
            placeholder="Enter your email content. Use {{firstName}} for personalization..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
            required
          />
          <p className="text-sm text-gray-500">
            Use <code>{'{{firstName}}'}</code>, <code>{'{{lastName}}'}</code>, or <code>{'{{fullName}}'}</code> for personalization
          </p>
        </div>

        {/* Recipients Summary */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-900">Recipients</span>
          </div>
          <p className="text-sm text-blue-700">
            This campaign will be sent to <strong>{emailRecipients.length}</strong> contacts with email addresses.
          </p>
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
      </CardContent>
    </Card>
  )
}
