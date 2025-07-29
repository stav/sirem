import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { X, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { CampaignForm } from '../hooks/useEmailCampaigns'
import { SubscriberSyncModal } from './SubscriberSyncModal'

interface Contact {
  id: string
  first_name: string
  last_name: string
  email: string | null
  lead_status_id?: string | null
  tags?: string[]
}

interface ConvertKitSubscriber {
  id: number
  email_address: string
  first_name?: string
  last_name?: string
  state: 'active' | 'inactive' | 'unsubscribed'
  tags?: { id: number; name: string }[]
}

interface CampaignFormProps {
  initialData?: Partial<CampaignForm>
  onSubmit: (data: CampaignForm) => Promise<boolean>
  onCancel: () => void
  loading?: boolean
}

interface Tag {
  id: string
  label: string
  category: {
    name: string
  }
}

interface LeadStatus {
  id: string
  name: string
}

export function CampaignForm({ initialData, onSubmit, onCancel, loading }: CampaignFormProps) {
  const [formData, setFormData] = useState<CampaignForm>({
    name: initialData?.name || '',
    subject: initialData?.subject || '',
    content: initialData?.content || '',
    plain_text_content: initialData?.plain_text_content || '',
    target_tags: initialData?.target_tags || [],
    target_t65_days: initialData?.target_t65_days,
    target_lead_statuses: initialData?.target_lead_statuses || [],
    scheduled_at: initialData?.scheduled_at,
  })

  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [availableLeadStatuses, setAvailableLeadStatuses] = useState<LeadStatus[]>([])
  const [showSubscriberSync, setShowSubscriberSync] = useState(false)
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>(initialData?.selected_contacts || [])
  const [selectedSubscribers, setSelectedSubscribers] = useState<ConvertKitSubscriber[]>(
    initialData?.selected_subscribers || []
  )

  useEffect(() => {
    fetchTags()
    fetchLeadStatuses()
  }, [])

  const fetchTags = async () => {
    try {
      const { data } = await supabase
        .from('tags')
        .select(
          `
          id,
          label,
          category:tag_categories(name)
        `
        )
        .eq('is_active', true)
        .order('label')

      if (data) {
        setAvailableTags(data)
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
    }
  }

  const fetchLeadStatuses = async () => {
    try {
      const { data } = await supabase.from('lead_statuses').select('id, name').order('name')

      if (data) {
        setAvailableLeadStatuses(data)
      }
    } catch (error) {
      console.error('Error fetching lead statuses:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await onSubmit({
      ...formData,
      selected_contacts: selectedContacts,
      selected_subscribers: selectedSubscribers,
    })
    if (success) {
      onCancel()
    }
  }

  const addTag = (tagId: string) => {
    const tag = availableTags.find((t) => t.id === tagId)
    if (tag && !formData.target_tags?.includes(tag.label)) {
      setFormData((prev) => ({
        ...prev,
        target_tags: [...(prev.target_tags || []), tag.label],
      }))
    }
  }

  const removeTag = (tagLabel: string) => {
    setFormData((prev) => ({
      ...prev,
      target_tags: prev.target_tags?.filter((tag) => tag !== tagLabel) || [],
    }))
  }

  const addLeadStatus = (statusId: string) => {
    if (!formData.target_lead_statuses?.includes(statusId)) {
      setFormData((prev) => ({
        ...prev,
        target_lead_statuses: [...(prev.target_lead_statuses || []), statusId],
      }))
    }
  }

  const removeLeadStatus = (statusId: string) => {
    setFormData((prev) => ({
      ...prev,
      target_lead_statuses: prev.target_lead_statuses?.filter((status) => status !== statusId) || [],
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="max-h-[90vh] w-full max-w-4xl overflow-y-auto">
        <CardHeader>
          <CardTitle>{initialData ? 'Edit Campaign' : 'Create New Campaign'}</CardTitle>
          <CardDescription>Create an email campaign to send to your contacts</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Campaign Info */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter campaign name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                  placeholder="Enter email subject"
                  required
                />
              </div>
            </div>

            {/* Email Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Email Content (HTML)</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="Enter your email content in HTML format"
                rows={8}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plain_text_content">Plain Text Version (Optional)</Label>
              <Textarea
                id="plain_text_content"
                value={formData.plain_text_content}
                onChange={(e) => setFormData((prev) => ({ ...prev, plain_text_content: e.target.value }))}
                placeholder="Enter plain text version of your email"
                rows={4}
              />
            </div>

            {/* Targeting Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Targeting Options</h3>

              {/* T65 Days */}
              <div className="space-y-2">
                <Label htmlFor="t65_days">Target T65 Days</Label>
                <Input
                  id="t65_days"
                  type="number"
                  value={formData.target_t65_days || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      target_t65_days: e.target.value ? parseInt(e.target.value) : undefined,
                    }))
                  }
                  placeholder="Days until 65th birthday (e.g., 180)"
                />
                <p className="text-sm text-muted-foreground">
                  Target contacts turning 65 within the specified number of days
                </p>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Target Tags</Label>
                <div className="mb-2 flex flex-wrap gap-2">
                  {formData.target_tags?.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                    </Badge>
                  ))}
                </div>
                <Select onValueChange={addTag}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add a tag to target" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTags.map((tag) => (
                      <SelectItem key={tag.id} value={tag.id}>
                        {tag.label} ({tag.category.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Lead Statuses */}
              <div className="space-y-2">
                <Label>Target Lead Statuses</Label>
                <div className="mb-2 flex flex-wrap gap-2">
                  {formData.target_lead_statuses?.map((statusId) => {
                    const status = availableLeadStatuses.find((s) => s.id === statusId)
                    return status ? (
                      <Badge key={statusId} variant="secondary" className="flex items-center gap-1">
                        {status.name}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeLeadStatus(statusId)} />
                      </Badge>
                    ) : null
                  })}
                </div>
                <Select onValueChange={addLeadStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add a lead status to target" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLeadStatuses.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Schedule */}
              <div className="space-y-2">
                <Label htmlFor="scheduled_at">Schedule Campaign (Optional)</Label>
                <Input
                  id="scheduled_at"
                  type="datetime-local"
                  value={formData.scheduled_at || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, scheduled_at: e.target.value }))}
                />
                <p className="text-sm text-muted-foreground">Leave empty to send immediately when ready</p>
              </div>

              {/* Subscriber Sync */}
              <div className="space-y-2">
                <Label>Campaign Recipients</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowSubscriberSync(true)}
                    className="flex items-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Sync Subscribers
                  </Button>
                  {(selectedContacts.length > 0 || selectedSubscribers.length > 0) && (
                    <div className="text-sm text-muted-foreground">
                      {selectedContacts.length} CRM contacts + {selectedSubscribers.length} ConvertKit subscribers
                      selected
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Manually select which contacts and subscribers should receive this campaign
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : initialData ? 'Update Campaign' : 'Create Campaign'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Subscriber Sync Modal */}
      <SubscriberSyncModal
        isOpen={showSubscriberSync}
        onClose={() => setShowSubscriberSync(false)}
        onConfirm={(contacts, subscribers) => {
          setSelectedContacts(contacts)
          setSelectedSubscribers(subscribers)
          setShowSubscriberSync(false)
        }}
      />
    </div>
  )
}
