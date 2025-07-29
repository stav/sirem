'use client'

import React, { useState } from 'react'
import Navigation from '@/components/Navigation'
import { CampaignList } from '../../components/CampaignList'
import { useEmailCampaigns } from '../../hooks/useEmailCampaigns'
import { useToast } from '../../hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Mail, BarChart3, Users, TrendingUp } from 'lucide-react'
import type { CampaignForm } from '../../hooks/useEmailCampaigns'

interface CampaignStats {
  total: number
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  totalOpens: number
  totalClicks: number
  openRate: number
  clickRate: number
  bounceRate: number
}

export default function CampaignsPage() {
  const {
    campaigns,
    loading,
    sendingCampaign,
    sendProgress,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    sendCampaign,
    getCampaignStats,
  } = useEmailCampaigns()

  const { toast } = useToast()
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const [campaignStats, setCampaignStats] = useState<CampaignStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  const handleCreateCampaign = async (data: CampaignForm) => {
    const success = await createCampaign(data)
    if (success) {
      toast({
        title: 'Campaign Created',
        description: 'Your email campaign has been created successfully.',
      })
    } else {
      toast({
        title: 'Error',
        description: 'Failed to create campaign. Please try again.',
        variant: 'destructive',
      })
    }
    return success
  }

  const handleUpdateCampaign = async (id: string, data: Partial<CampaignForm>) => {
    const success = await updateCampaign(id, data)
    if (success) {
      toast({
        title: 'Campaign Updated',
        description: 'Your email campaign has been updated successfully.',
      })
    } else {
      toast({
        title: 'Error',
        description: 'Failed to update campaign. Please try again.',
        variant: 'destructive',
      })
    }
    return success
  }

  const handleDeleteCampaign = async (id: string) => {
    const success = await deleteCampaign(id)
    if (success) {
      toast({
        title: 'Campaign Deleted',
        description: 'Your email campaign has been deleted successfully.',
      })
    } else {
      toast({
        title: 'Error',
        description: 'Failed to delete campaign. Please try again.',
        variant: 'destructive',
      })
    }
    return success
  }

  const handleSendCampaign = async (id: string) => {
    const success = await sendCampaign(id)
    if (success) {
      const campaign = campaigns.find((c) => c.id === id)
      toast({
        title: 'Campaign Prepared Successfully! 🎉',
        description: `"${campaign?.name}" has been prepared and a broadcast created in ConvertKit. You'll need to add content manually in ConvertKit before sending.`,
      })
    } else {
      toast({
        title: 'Error',
        description: 'Failed to prepare campaign. Please try again.',
        variant: 'destructive',
      })
    }
    return success
  }

  const handleViewStats = async (campaignId: string) => {
    setSelectedCampaignId(campaignId)
    setStatsLoading(true)
    try {
      const stats = await getCampaignStats(campaignId)
      setCampaignStats(stats)
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load campaign statistics.',
        variant: 'destructive',
      })
    } finally {
      setStatsLoading(false)
    }
  }

  // Calculate overall metrics
  const totalCampaigns = campaigns.length
  const draftCampaigns = campaigns.filter((c) => c.status === 'draft').length
  const sentCampaigns = campaigns.filter((c) => c.status === 'sent').length
  const scheduledCampaigns = campaigns.filter((c) => c.status === 'scheduled').length

  return (
    <div className="min-h-screen bg-background">
      <Navigation pageTitle="Campaigns" />

      <div className="p-6">
        <div className="mx-auto max-w-7xl">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Email Campaigns</h1>
              <p className="text-muted-foreground">
                Create and manage email marketing campaigns with ConvertKit integration
              </p>
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCampaigns}</div>
                <p className="text-xs text-muted-foreground">All campaigns created</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Draft Campaigns</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{draftCampaigns}</div>
                <p className="text-xs text-muted-foreground">Ready to send</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sent Campaigns</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sentCampaigns}</div>
                <p className="text-xs text-muted-foreground">Successfully delivered</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scheduledCampaigns}</div>
                <p className="text-xs text-muted-foreground">Future campaigns</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="campaigns" className="space-y-4">
            <TabsList>
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              {selectedCampaignId && campaignStats && <TabsTrigger value="stats">Campaign Stats</TabsTrigger>}
            </TabsList>

            <TabsContent value="campaigns" className="space-y-4">
              <CampaignList
                campaigns={campaigns}
                loading={loading}
                error={null}
                sendingCampaign={sendingCampaign}
                sendProgress={sendProgress}
                onCreateCampaign={handleCreateCampaign}
                onUpdateCampaign={handleUpdateCampaign}
                onDeleteCampaign={handleDeleteCampaign}
                onSendCampaign={handleSendCampaign}
                onViewStats={handleViewStats}
              />
            </TabsContent>

            {selectedCampaignId && campaignStats && (
              <TabsContent value="stats" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Campaign Performance</CardTitle>
                    <CardDescription>Detailed statistics for your email campaign</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {statsLoading ? (
                      <div className="flex items-center justify-center p-8">
                        <div className="text-center">
                          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
                          <p className="mt-2 text-sm text-gray-600">Loading statistics...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-lg border p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">{campaignStats.total}</div>
                          <div className="text-sm text-muted-foreground">Total Recipients</div>
                        </div>

                        <div className="rounded-lg border p-4 text-center">
                          <div className="text-2xl font-bold text-green-600">{campaignStats.sent}</div>
                          <div className="text-sm text-muted-foreground">Sent</div>
                        </div>

                        <div className="rounded-lg border p-4 text-center">
                          <div className="text-2xl font-bold text-purple-600">{campaignStats.opened}</div>
                          <div className="text-sm text-muted-foreground">Opened</div>
                          <div className="text-xs text-muted-foreground">{campaignStats.openRate.toFixed(1)}% rate</div>
                        </div>

                        <div className="rounded-lg border p-4 text-center">
                          <div className="text-2xl font-bold text-orange-600">{campaignStats.clicked}</div>
                          <div className="text-sm text-muted-foreground">Clicked</div>
                          <div className="text-xs text-muted-foreground">
                            {campaignStats.clickRate.toFixed(1)}% rate
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  )
}
