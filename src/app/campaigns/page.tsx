'use client'

import { useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Mail, BarChart3 } from 'lucide-react'
import { useCampaigns, Campaign } from '@/hooks/useCampaigns'
import { useContactFilter } from '@/contexts/ContactFilterContext'
import CampaignList from '@/components/CampaignList'
import CampaignForm from '@/components/CampaignForm'
import { useToast } from '@/hooks/use-toast'
import type { Database } from '@/lib/supabase'

type CampaignRecipientRow = Database['public']['Tables']['campaign_recipients']['Row']

export default function CampaignsPage() {
  const [activeTab, setActiveTab] = useState('list')
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [viewingCampaign, setViewingCampaign] = useState<Campaign | null>(null)
  
  const { toast } = useToast()
  const { filteredContacts } = useContactFilter()
  const {
    campaigns,
    loading,
    createCampaign,
    sendCampaign,
    deleteCampaign,
    updateCampaign
  } = useCampaigns()

  const handleCreateCampaign = async (campaignData: { name: string; subject: string; content: string; html_content?: string; scheduled_at?: string }) => {
    try {
      // Use filtered contacts from the context
      if (filteredContacts.length === 0) {
        toast({
          title: "No Contacts Selected",
          description: "Please go to the Manage page to filter contacts before creating a campaign.",
          variant: "destructive"
        })
        return
      }
      
      const result = await createCampaign(campaignData, filteredContacts)
      
      if (result) {
        toast({
          title: "Campaign Created",
          description: "Your email campaign has been created successfully.",
        })
        setActiveTab('list')
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

  const handleSendCampaign = async (campaignId: string) => {
    try {
      const result = await sendCampaign(campaignId)
      
      if (result?.success) {
        toast({
          title: "Campaign Sent",
          description: `Campaign sent successfully to ${result.sent} recipients.`,
        })
      } else {
        toast({
          title: "Error",
          description: result?.error || "Failed to send campaign. Please try again.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error sending campaign:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      const success = await deleteCampaign(campaignId)
      
      if (success) {
        toast({
          title: "Campaign Deleted",
          description: "The campaign has been deleted successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to delete campaign. Please try again.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting campaign:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleEditCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign)
    setActiveTab('create')
  }

  const handleViewCampaign = (campaign: Campaign) => {
    setViewingCampaign(campaign)
    setActiveTab('analytics')
  }

  const handleUpdateCampaign = async (campaignData: { name: string; subject: string; content: string; html_content?: string; scheduled_at?: string }) => {
    if (!editingCampaign) return

    try {
      const success = await updateCampaign(editingCampaign.id, campaignData)
      
      if (success) {
        toast({
          title: "Campaign Updated",
          description: "Your campaign has been updated successfully.",
        })
        setEditingCampaign(null)
        setActiveTab('list')
      } else {
        toast({
          title: "Error",
          description: "Failed to update campaign. Please try again.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error updating campaign:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleCancelForm = () => {
    setEditingCampaign(null)
    setActiveTab('list')
  }

  return (
    <div className="bg-background min-h-screen">
      <Navigation />
      <div className="p-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Email Campaigns</h1>
              <p className="text-muted-foreground">
                Create and manage email marketing campaigns for your contacts
              </p>
            </div>
            <Button 
              onClick={() => {
                setActiveTab('create')
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Campaign
            </Button>
          </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {editingCampaign ? 'Edit Campaign' : 'Create Campaign'}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          <CampaignList
            campaigns={campaigns}
            loading={loading}
            onSendCampaign={handleSendCampaign}
            onDeleteCampaign={handleDeleteCampaign}
            onEditCampaign={handleEditCampaign}
            onViewCampaign={handleViewCampaign}
          />
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          {filteredContacts.length === 0 && !editingCampaign ? (
            <Card className="p-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <Mail className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">No Contacts Selected</h3>
                  <p className="text-muted-foreground">
                    To create an email campaign, you need to select contacts first.
                  </p>
                </div>
                <Button asChild>
                  <a href="/manage">
                    Go to Manage Contacts
                  </a>
                </Button>
              </div>
            </Card>
          ) : (
            <CampaignForm
              onSubmit={editingCampaign ? handleUpdateCampaign : handleCreateCampaign}
              onCancel={handleCancelForm}
              loading={loading}
              initialData={editingCampaign ? {
                name: editingCampaign.name,
                subject: editingCampaign.subject,
                content: editingCampaign.content,
                html_content: editingCampaign.html_content,
                scheduled_at: editingCampaign.scheduled_at
              } : undefined}
            />
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {viewingCampaign ? (
            <CampaignAnalytics campaign={viewingCampaign} />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BarChart3 className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Campaign</h3>
                <p className="text-gray-500 text-center max-w-md">
                  Choose a campaign from the list to view detailed analytics and performance metrics.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
        </div>
      </div>
    </div>
  )
}

// Campaign analytics component with recipients list
function CampaignAnalytics({ campaign }: { campaign: Campaign }) {
  const [recipients, setRecipients] = useState<CampaignRecipientRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const fetchRecipients = async () => {
    setLoading(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase
        .from('campaign_recipients')
        .select('*')
        .eq('campaign_id', campaign.id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setRecipients(data)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecipients()
  }, [campaign.id])

  const handleToggleEnabled = async (recipientId: string, enabled: boolean) => {
    setSaving(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      const { error } = await supabase
        .from('campaign_recipients')
        .update({ enabled })
        .eq('id', recipientId)

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to update recipient',
          variant: 'destructive'
        })
      } else {
        // Update local state
        setRecipients(prev => prev.map(r => r.id === recipientId ? { ...r, enabled } : r))
      }
    } finally {
      setSaving(false)
    }
  }

  const handleToggleAll = async (enabled: boolean) => {
    setSaving(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      const { error } = await supabase
        .from('campaign_recipients')
        .update({ enabled })
        .eq('campaign_id', campaign.id)

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to update recipients',
          variant: 'destructive'
        })
      } else {
        // Update local state
        setRecipients(prev => prev.map(r => ({ ...r, enabled })))
        toast({
          title: 'Success',
          description: `${enabled ? 'Enabled' : 'Disabled'} all recipients`
        })
      }
    } finally {
      setSaving(false)
    }
  }

  const enabledCount = recipients.filter(r => r.enabled !== false).length
  const allEnabled = recipients.length > 0 && enabledCount === recipients.length
  const canEdit = campaign.status === 'draft' || campaign.status === 'scheduled'

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Campaign Statistics</CardTitle>
          <CardDescription>{campaign.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Total Recipients</div>
              <div className="text-2xl font-bold">{campaign.total_recipients}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Enabled</div>
              <div className="text-2xl font-bold">{enabledCount}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Sent</div>
              <div className="text-2xl font-bold">{campaign.sent_count}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Delivered</div>
              <div className="text-2xl font-bold">{campaign.delivered_count}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {canEdit && recipients.length > 0 && (
                <Checkbox
                  checked={allEnabled}
                  onCheckedChange={(checked: boolean | "indeterminate" | undefined) => {
                    if (typeof checked === 'boolean') {
                      handleToggleAll(checked)
                    }
                  }}
                  disabled={saving}
                />
              )}
              <CardTitle>Recipients ({recipients.length})</CardTitle>
            </div>
            {canEdit && (
              <div className="text-sm text-muted-foreground">
                {enabledCount} enabled
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading recipients...</div>
          ) : recipients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No recipients found</div>
          ) : (
            <div className="space-y-2">
              {recipients.map((recipient) => (
                <div key={recipient.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-3 flex-1">
                    {canEdit && (
                      <Checkbox
                        checked={recipient.enabled !== false}
                        onCheckedChange={(checked: boolean | "indeterminate" | undefined) => {
                          if (typeof checked === 'boolean') {
                            handleToggleEnabled(recipient.id, checked)
                          }
                        }}
                        disabled={saving}
                      />
                    )}
                    <div className={canEdit && recipient.enabled === false ? 'opacity-50' : ''}>
                      <div className="font-medium">
                        {recipient.first_name} {recipient.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">{recipient.email_address}</div>
                      {recipient.error_message && (
                        <div className="text-xs text-red-600 mt-1">{recipient.error_message}</div>
                      )}
                      {recipient.resend_message_id && (
                        <div className="text-xs text-muted-foreground mt-1">ID: {recipient.resend_message_id}</div>
                      )}
                    </div>
                  </div>
                  <Badge variant={
                    recipient.enabled === false ? 'destructive' :
                    recipient.status === 'sent' ? 'default' : 
                    recipient.status === 'failed' ? 'destructive' :
                    'secondary'
                  }>
                    {recipient.enabled === false ? 'disabled' : recipient.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
