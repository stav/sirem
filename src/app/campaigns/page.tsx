'use client'

import { useState } from 'react'
import Navigation from '@/components/Navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Mail, BarChart3 } from 'lucide-react'
import { useCampaigns, Campaign } from '@/hooks/useCampaigns'
import { useContactFilter } from '@/contexts/ContactFilterContext'
import CampaignList from '@/components/CampaignList'
import CampaignForm from '@/components/CampaignForm'
import { useToast } from '@/hooks/use-toast'

export default function CampaignsPage() {
  const [activeTab, setActiveTab] = useState('list')
  const [showCreateForm, setShowCreateForm] = useState(false)
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

  const handleCreateCampaign = async (campaignData: any) => {
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
        setShowCreateForm(false)
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

  const handleUpdateCampaign = async (campaignData: any) => {
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
    setShowCreateForm(false)
    setEditingCampaign(null)
    setActiveTab('list')
  }

  return (
    <div className="bg-background min-h-screen">
      <Navigation pageTitle="Campaigns" />
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
                setShowCreateForm(true)
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

// Placeholder component for campaign analytics
function CampaignAnalytics({ campaign }: { campaign: Campaign }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaign Analytics</CardTitle>
        <CardDescription>{campaign.name}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Coming Soon</h3>
          <p className="text-gray-500">
            Detailed campaign analytics and recipient tracking will be available soon.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
