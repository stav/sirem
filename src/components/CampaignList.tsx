import React, { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import {
  Mail,
  Calendar,
  Users,
  Edit,
  Trash2,
  Send,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import type { Database } from '../lib/supabase-types'
import { CampaignForm } from './CampaignForm'
import type { CampaignForm as CampaignFormType } from '../hooks/useEmailCampaigns'

type EmailCampaign = Database['public']['Tables']['email_campaigns']['Row']

interface CampaignListProps {
  campaigns: EmailCampaign[]
  loading: boolean
  error: string | null
  sendingCampaign?: string | null
  sendProgress?: string
  onCreateCampaign: (data: CampaignFormType) => Promise<boolean>
  onUpdateCampaign: (id: string, data: Partial<CampaignFormType>) => Promise<boolean>
  onDeleteCampaign: (id: string) => Promise<boolean>
  onSendCampaign: (id: string) => Promise<boolean>
  onViewStats: (id: string) => void
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'draft':
      return <Clock className="h-4 w-4" />
    case 'scheduled':
      return <Calendar className="h-4 w-4" />
    case 'sending':
      return <Send className="h-4 w-4" />
    case 'prepared':
      return <CheckCircle className="h-4 w-4" />
    case 'sent':
      return <CheckCircle className="h-4 w-4" />
    case 'cancelled':
      return <XCircle className="h-4 w-4" />
    default:
      return <AlertCircle className="h-4 w-4" />
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-800'
    case 'scheduled':
      return 'bg-blue-100 text-blue-800'
    case 'sending':
      return 'bg-yellow-100 text-yellow-800'
    case 'prepared':
      return 'bg-green-100 text-green-800'
    case 'sent':
      return 'bg-green-100 text-green-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function CampaignList({
  campaigns,
  loading,
  error,
  sendingCampaign,
  sendProgress,
  onCreateCampaign,
  onUpdateCampaign,
  onDeleteCampaign,
  onSendCampaign,
  onViewStats,
}: CampaignListProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  const handleCreateCampaign = async (data: CampaignFormType) => {
    setFormLoading(true)
    try {
      const success = await onCreateCampaign(data)
      if (success) {
        setShowForm(false)
      }
      return success
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateCampaign = async (data: CampaignFormType) => {
    if (!editingCampaign) return false

    setFormLoading(true)
    try {
      const success = await onUpdateCampaign(editingCampaign.id, data)
      if (success) {
        setEditingCampaign(null)
      }
      return success
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteCampaign = async (campaignId: string) => {
    if (confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      await onDeleteCampaign(campaignId)
    }
  }

  const handleSendCampaign = async (campaignId: string) => {
    if (confirm('Are you sure you want to send this campaign? This action cannot be undone.')) {
      await onSendCampaign(campaignId)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
          <p className="mt-2 text-sm text-gray-600">Loading campaigns...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Campaigns</h2>
          <p className="text-muted-foreground">Manage your email marketing campaigns</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Create Campaign
        </Button>
      </div>

      {/* Campaigns Grid */}
      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No campaigns yet</h3>
            <p className="mb-4 text-center text-muted-foreground">
              Create your first email campaign to start reaching your contacts
            </p>
            <Button onClick={() => setShowForm(true)}>Create Your First Campaign</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{campaign.name}</CardTitle>
                    <CardDescription className="mt-1">{campaign.subject}</CardDescription>
                  </div>
                  <Badge className={`${getStatusColor(campaign.status)} flex items-center gap-1`}>
                    {getStatusIcon(campaign.status)}
                    {campaign.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Campaign Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Created {format(new Date(campaign.created_at), 'MMM d, yyyy')}</span>
                  </div>

                  {campaign.scheduled_at && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Scheduled for {format(new Date(campaign.scheduled_at), 'MMM d, yyyy HH:mm')}</span>
                    </div>
                  )}

                  {campaign.sent_at && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Send className="h-4 w-4" />
                      <span>Sent {format(new Date(campaign.sent_at), 'MMM d, yyyy HH:mm')}</span>
                    </div>
                  )}
                </div>

                {/* Targeting Info */}
                <div className="space-y-2">
                  {(campaign.target_tags?.length || 0) > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Tags:</span>
                      <div className="flex flex-wrap gap-1">
                        {campaign.target_tags?.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {(campaign.target_tags?.length || 0) > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{(campaign.target_tags?.length || 0) - 2} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {campaign.target_t65_days && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">T65: {campaign.target_t65_days} days</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    {campaign.status === 'draft' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingCampaign(campaign)}
                          className="flex-1"
                          disabled={sendingCampaign === campaign.id}
                        >
                          <Edit className="mr-1 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSendCampaign(campaign.id)}
                          className="flex-1"
                          disabled={sendingCampaign === campaign.id}
                        >
                          {sendingCampaign === campaign.id ? (
                            <>
                              <div className="mr-1 h-4 w-4 animate-spin rounded-full border-b-2 border-current"></div>
                              Creating...
                            </>
                          ) : (
                            <>
                              <Send className="mr-1 h-4 w-4" />
                              Create Broadcast
                            </>
                          )}
                        </Button>
                      </>
                    )}

                    {(campaign.status === 'sent' || campaign.status === 'prepared') && (
                      <Button size="sm" variant="outline" onClick={() => onViewStats(campaign.id)} className="flex-1">
                        <BarChart3 className="mr-1 h-4 w-4" />
                        {campaign.status === 'prepared' ? 'View Details' : 'Stats'}
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteCampaign(campaign.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Progress Indicator */}
                  {sendingCampaign === campaign.id && sendProgress && (
                    <div className="flex items-center gap-2 text-xs text-blue-600">
                      <div className="h-3 w-3 animate-spin rounded-full border-b-2 border-blue-600"></div>
                      {sendProgress}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Campaign Form Modal */}
      {showForm && (
        <CampaignForm onSubmit={handleCreateCampaign} onCancel={() => setShowForm(false)} loading={formLoading} />
      )}

      {editingCampaign && (
        <CampaignForm
          initialData={{
            name: editingCampaign.name,
            subject: editingCampaign.subject,
            content: editingCampaign.content,
            plain_text_content: editingCampaign.plain_text_content || undefined,
            target_tags: editingCampaign.target_tags || undefined,
            target_t65_days: editingCampaign.target_t65_days || undefined,
            target_lead_statuses: editingCampaign.target_lead_statuses || undefined,
            scheduled_at: editingCampaign.scheduled_at || undefined,
            selected_contacts:
              (
                editingCampaign.metadata as {
                  selected_contacts?: Array<{ id: string; first_name: string; last_name: string; email: string | null }>
                }
              )?.selected_contacts || [],
            selected_subscribers:
              (
                editingCampaign.metadata as {
                  selected_subscribers?: Array<{
                    id: number
                    email_address: string
                    first_name?: string
                    last_name?: string
                  }>
                }
              )?.selected_subscribers?.map((s) => ({
                ...s,
                state: 'active' as const,
                tags: [],
              })) || [],
          }}
          onSubmit={handleUpdateCampaign}
          onCancel={() => setEditingCampaign(null)}
          loading={formLoading}
        />
      )}
    </div>
  )
}
