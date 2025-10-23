'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  Mail, 
  Send, 
  MoreHorizontal, 
  Trash2, 
  Edit, 
  Eye, 
  Clock,
  CheckCircle,
  XCircle,
  Pause,
  Play
} from 'lucide-react'
import { format } from 'date-fns'
import { Campaign } from '@/hooks/useCampaigns'

interface CampaignListProps {
  campaigns: Campaign[]
  loading: boolean
  onSendCampaign: (campaignId: string) => void
  onDeleteCampaign: (campaignId: string) => void
  onEditCampaign: (campaign: Campaign) => void
  onViewCampaign: (campaign: Campaign) => void
}

export default function CampaignList({
  campaigns,
  loading,
  onSendCampaign,
  onDeleteCampaign,
  onEditCampaign,
  onViewCampaign
}: CampaignListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null)

  const getStatusBadge = (status: Campaign['status']) => {
    const statusConfig = {
      draft: { variant: 'secondary' as const, icon: Edit, label: 'Draft' },
      scheduled: { variant: 'outline' as const, icon: Clock, label: 'Scheduled' },
      sending: { variant: 'default' as const, icon: Send, label: 'Sending' },
      sent: { variant: 'default' as const, icon: CheckCircle, label: 'Sent' },
      paused: { variant: 'secondary' as const, icon: Pause, label: 'Paused' },
      cancelled: { variant: 'destructive' as const, icon: XCircle, label: 'Cancelled' }
    }

    const config = statusConfig[status]
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getStatusColor = (status: Campaign['status']) => {
    const colors = {
      draft: 'text-gray-600',
      scheduled: 'text-blue-600',
      sending: 'text-yellow-600',
      sent: 'text-green-600',
      paused: 'text-orange-600',
      cancelled: 'text-red-600'
    }
    return colors[status]
  }

  const canSend = (campaign: Campaign) => {
    return campaign.status === 'draft' || campaign.status === 'scheduled'
  }

  const handleDeleteClick = (campaignId: string) => {
    setCampaignToDelete(campaignId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (campaignToDelete) {
      onDeleteCampaign(campaignToDelete)
      setDeleteDialogOpen(false)
      setCampaignToDelete(null)
    }
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy \'at\' h:mm a')
  }

  const getDeliveryStats = (campaign: Campaign) => {
    const { total_recipients, sent_count, delivered_count, opened_count, clicked_count, bounce_count } = campaign
    
    return {
      total: total_recipients,
      sent: sent_count,
      delivered: delivered_count,
      opened: opened_count,
      clicked: clicked_count,
      bounced: bounce_count,
      deliveryRate: total_recipients > 0 ? Math.round((delivered_count / total_recipients) * 100) : 0,
      openRate: delivered_count > 0 ? Math.round((opened_count / delivered_count) * 100) : 0,
      clickRate: delivered_count > 0 ? Math.round((clicked_count / delivered_count) * 100) : 0
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (campaigns.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Mail className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No campaigns yet</h3>
          <p className="text-gray-500 text-center max-w-md">
            Create your first email campaign to start reaching out to your contacts.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {campaigns.map((campaign) => {
          const stats = getDeliveryStats(campaign)
          
          return (
            <Card key={campaign.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{campaign.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {campaign.subject}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(campaign.status)}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewCampaign(campaign)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditCampaign(campaign)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {canSend(campaign) && (
                          <DropdownMenuItem onClick={() => onSendCampaign(campaign.id)}>
                            <Send className="mr-2 h-4 w-4" />
                            Send Now
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(campaign.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Recipients</div>
                    <div className="font-semibold">{stats.total}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Sent</div>
                    <div className="font-semibold">{stats.sent}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Delivered</div>
                    <div className="font-semibold">{stats.delivered}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Opened</div>
                    <div className="font-semibold">{stats.opened}</div>
                  </div>
                </div>

                {campaign.status === 'sent' && stats.delivered > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Delivery Rate</div>
                      <div className="font-semibold text-green-600">{stats.deliveryRate}%</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Open Rate</div>
                      <div className="font-semibold text-blue-600">{stats.openRate}%</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Click Rate</div>
                      <div className="font-semibold text-purple-600">{stats.clickRate}%</div>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                  <div>
                    Created {formatDate(campaign.created_at)}
                  </div>
                  {campaign.sent_at && (
                    <div>
                      Sent {formatDate(campaign.sent_at)}
                    </div>
                  )}
                  {campaign.scheduled_at && campaign.status === 'scheduled' && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Scheduled for {formatDate(campaign.scheduled_at)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this campaign? This action cannot be undone.
              All campaign data and recipient information will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete Campaign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
