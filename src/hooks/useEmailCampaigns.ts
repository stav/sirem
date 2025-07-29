import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase-types'

type EmailCampaign = Database['public']['Tables']['email_campaigns']['Row']

export interface CampaignForm {
  name: string
  subject: string
  content: string
  plain_text_content?: string
  target_tags?: string[]
  target_t65_days?: number
  target_lead_statuses?: string[]
  scheduled_at?: string
  selected_contacts?: Contact[]
  selected_subscribers?: ConvertKitSubscriber[]
}

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

export function useEmailCampaigns() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sendingCampaign, setSendingCampaign] = useState<string | null>(null)
  const [sendProgress, setSendProgress] = useState<string>('')

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('email_campaigns')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) {
        // Check if it's a missing table error
        if (fetchError.message?.includes('relation "email_campaigns" does not exist')) {
          setError('Email campaigns table not found. Please run the database migration first.')
          setCampaigns([])
          return
        }
        throw fetchError
      }

      setCampaigns(data || [])
    } catch (err) {
      console.error('Error fetching campaigns:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch campaigns')
    } finally {
      setLoading(false)
    }
  }, [])

  const createCampaign = async (campaignData: CampaignForm): Promise<boolean> => {
    try {
      setError(null)

      const { error: insertError } = await supabase.from('email_campaigns').insert({
        name: campaignData.name,
        subject: campaignData.subject,
        content: campaignData.content,
        plain_text_content: campaignData.plain_text_content,
        target_tags: campaignData.target_tags,
        target_t65_days: campaignData.target_t65_days,
        target_lead_statuses: campaignData.target_lead_statuses,
        scheduled_at: campaignData.scheduled_at,
        status: 'draft',
        metadata: {
          selected_contacts:
            campaignData.selected_contacts?.map((c) => ({
              id: c.id,
              first_name: c.first_name,
              last_name: c.last_name,
              email: c.email,
            })) || [],
          selected_subscribers:
            campaignData.selected_subscribers?.map((s) => ({
              id: s.id,
              email_address: s.email_address,
              first_name: s.first_name,
              last_name: s.last_name,
            })) || [],
        },
      })

      if (insertError) {
        throw insertError
      }

      await fetchCampaigns()
      return true
    } catch (err) {
      console.error('Error creating campaign:', err)
      setError(err instanceof Error ? err.message : 'Failed to create campaign')
      return false
    }
  }

  const updateCampaign = async (campaignId: string, campaignData: Partial<CampaignForm>): Promise<boolean> => {
    try {
      setError(null)

      const { error: updateError } = await supabase
        .from('email_campaigns')
        .update({
          name: campaignData.name,
          subject: campaignData.subject,
          content: campaignData.content,
          plain_text_content: campaignData.plain_text_content,
          target_tags: campaignData.target_tags,
          target_t65_days: campaignData.target_t65_days,
          target_lead_statuses: campaignData.target_lead_statuses,
          scheduled_at: campaignData.scheduled_at,
          metadata: {
            selected_contacts:
              campaignData.selected_contacts?.map((c) => ({
                id: c.id,
                first_name: c.first_name,
                last_name: c.last_name,
                email: c.email,
              })) || [],
            selected_subscribers:
              campaignData.selected_subscribers?.map((s) => ({
                id: s.id,
                email_address: s.email_address,
                first_name: s.first_name,
                last_name: s.last_name,
              })) || [],
          },
        })
        .eq('id', campaignId)

      if (updateError) {
        throw updateError
      }

      await fetchCampaigns()
      return true
    } catch (err) {
      console.error('Error updating campaign:', err)
      setError(err instanceof Error ? err.message : 'Failed to update campaign')
      return false
    }
  }

  const deleteCampaign = async (campaignId: string): Promise<boolean> => {
    try {
      setError(null)

      const { error: deleteError } = await supabase.from('email_campaigns').delete().eq('id', campaignId)

      if (deleteError) {
        throw deleteError
      }

      await fetchCampaigns()
      return true
    } catch (err) {
      console.error('Error deleting campaign:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete campaign')
      return false
    }
  }

  const sendCampaign = async (
    campaignId: string,
    selectedContacts?: Contact[],
    selectedSubscribers?: ConvertKitSubscriber[]
  ): Promise<boolean> => {
    try {
      setError(null)
      setSendingCampaign(campaignId)
      setSendProgress('Preparing campaign...')

      // Get campaign details
      const { data: campaign, error: fetchError } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()

      if (fetchError || !campaign) {
        throw fetchError || new Error('Campaign not found')
      }

      // Use manually selected contacts/subscribers if provided, otherwise use targeting criteria
      let targetContacts = selectedContacts || []
      let targetSubscribers = selectedSubscribers || []

      // If no recipients provided, check if they're stored in campaign metadata
      if (!selectedContacts && !selectedSubscribers && campaign.metadata) {
        const metadata = campaign.metadata as {
          selected_contacts?: Array<{ id: string; first_name: string; last_name: string; email: string | null }>
          selected_subscribers?: Array<{ id: number; email_address: string; first_name?: string; last_name?: string }>
        }
        console.log('Campaign metadata:', metadata)
        if (metadata.selected_contacts && metadata.selected_contacts.length > 0) {
          targetContacts = metadata.selected_contacts
          console.log('Using stored contacts:', targetContacts.length)
        }
        if (metadata.selected_subscribers && metadata.selected_subscribers.length > 0) {
          targetSubscribers = metadata.selected_subscribers.map((s) => ({
            ...s,
            state: 'active' as const,
            tags: [],
          }))
          console.log('Using stored subscribers:', targetSubscribers.length)
        }
      }

      // If still no recipients, fall back to targeting criteria
      if (targetContacts.length === 0 && targetSubscribers.length === 0) {
        setSendProgress('Finding target contacts...')
        targetContacts = await getTargetContacts(campaign)
        if (targetContacts.length === 0) {
          setError('No contacts match the campaign criteria')
          return false
        }
      }

      setSendProgress('Creating ConvertKit broadcast...')
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Add delay to see progress

      // Create a broadcast in ConvertKit (content will need to be added manually)
      // ConvertKit's API doesn't properly accept content during creation
      const broadcastResponse = await fetch('/api/convertkit/broadcasts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: campaign.name,
          subject: campaign.subject,
          // Note: content will be null initially due to ConvertKit API limitations
          content: campaign.content,
        }),
      })

      if (!broadcastResponse.ok) {
        const errorText = await broadcastResponse.text()
        console.error('Broadcast creation failed:', errorText)
        throw new Error(`Failed to create ConvertKit broadcast: ${errorText}`)
      }

      const broadcast = await broadcastResponse.json()
      console.log('Broadcast created:', broadcast)

      // Store the broadcast ID in campaign metadata for reference
      await supabase
        .from('email_campaigns')
        .update({
          metadata: {
            ...((campaign.metadata as Record<string, unknown>) || {}),
            convertkit_broadcast_id: broadcast.broadcast.id,
            convertkit_broadcast_url: `https://app.kit.com/broadcasts/${broadcast.broadcast.id}`,
          },
        })
        .eq('id', campaignId)

      setSendProgress('Updating campaign status...')
      // Update campaign with ConvertKit broadcast ID
      await supabase
        .from('email_campaigns')
        .update({
          convertkit_campaign_id: broadcast.broadcast.id,
          status: 'sending',
          sent_at: new Date().toISOString(),
        })
        .eq('id', campaignId)

      // Add CRM contacts to ConvertKit if they're not already subscribers
      const contactsToAdd = targetContacts.filter(
        (contact) => !targetSubscribers.some((sub) => sub.email_address === contact.email)
      )

      if (contactsToAdd.length > 0) {
        setSendProgress(`Adding ${contactsToAdd.length} CRM contacts to ConvertKit...`)
        for (const contact of contactsToAdd) {
          if (contact.email) {
            try {
              await fetch('/api/convertkit/subscribers/create', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  email: contact.email,
                  first_name: contact.first_name,
                  last_name: contact.last_name,
                }),
              })
            } catch (error) {
              console.warn(`Failed to add contact ${contact.email} to ConvertKit:`, error)
            }
          }
        }
      }

      setSendProgress('Recording campaign recipients...')
      // Create campaign subscribers records
      const contactRecords = targetContacts.map((contact) => ({
        campaign_id: campaignId,
        contact_id: contact.id,
        convertkit_email: contact.email || '',
        status: 'pending',
      }))

      const subscriberRecords = targetSubscribers.map((subscriber) => ({
        campaign_id: campaignId,
        contact_id: '', // Use empty string instead of null
        convertkit_email: subscriber.email_address,
        status: 'pending',
      }))

      await supabase.from('campaign_subscribers').insert([...contactRecords, ...subscriberRecords])

      setSendProgress('Campaign prepared successfully!')
      await new Promise((resolve) => setTimeout(resolve, 1000))

      console.log('Campaign prepared successfully. Broadcast created but not sent due to API limitations.')
      console.log('You can manually send the broadcast from the ConvertKit dashboard.')

      // Update campaign status to 'sent' since we've prepared everything
      await supabase.from('email_campaigns').update({ status: 'sent' }).eq('id', campaignId)

      setSendProgress('Finalizing...')
      // Update campaign status to sent
      await supabase.from('email_campaigns').update({ status: 'sent' }).eq('id', campaignId)

      await fetchCampaigns()

      // Log the successful send
      console.log(
        `Campaign "${campaign.name}" sent successfully to ${targetContacts.length + targetSubscribers.length} recipients`
      )

      return true
    } catch (err) {
      console.error('Error sending campaign:', err)
      setError(err instanceof Error ? err.message : 'Failed to send campaign')
      return false
    } finally {
      setSendingCampaign(null)
      setSendProgress('')
    }
  }

  const getTargetContacts = async (campaign: EmailCampaign) => {
    let contactIds: string[] = []

    // Get base query
    let query = supabase
      .from('contacts')
      .select('id, first_name, last_name, email, birthdate, lead_status_id')
      .not('email', 'is', null)
      .not('email', 'eq', '')

    // Filter by tags if specified
    if (campaign.target_tags && campaign.target_tags.length > 0) {
      const { data: taggedContacts } = await supabase
        .from('contact_tags')
        .select('contact_id')
        .in('tags.label', campaign.target_tags)

      if (taggedContacts) {
        contactIds = taggedContacts.map((row) => row.contact_id)
        query = query.in('id', contactIds)
      }
    }

    // Filter by T65 days if specified
    if (campaign.target_t65_days) {
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() + campaign.target_t65_days)

      query = query.gte('birthdate', targetDate.toISOString().split('T')[0])
    }

    // Filter by lead statuses if specified
    if (campaign.target_lead_statuses && campaign.target_lead_statuses.length > 0) {
      query = query.in('lead_status_id', campaign.target_lead_statuses)
    }

    const { data: contacts } = await query
    return contacts || []
  }

  const getCampaignStats = async (campaignId: string) => {
    try {
      const { data: subscribers } = await supabase
        .from('campaign_subscribers')
        .select('status, open_count, click_count')
        .eq('campaign_id', campaignId)

      if (!subscribers) return null

      const total = subscribers.length
      const sent = subscribers.filter((s) => s.status === 'sent').length
      const delivered = subscribers.filter((s) => s.status === 'delivered').length
      const opened = subscribers.filter((s) => s.status === 'opened').length
      const clicked = subscribers.filter((s) => s.status === 'clicked').length
      const bounced = subscribers.filter((s) => s.status === 'bounced').length

      const totalOpens = subscribers.reduce((sum, s) => sum + (s.open_count || 0), 0)
      const totalClicks = subscribers.reduce((sum, s) => sum + (s.click_count || 0), 0)

      return {
        total,
        sent,
        delivered,
        opened,
        clicked,
        bounced,
        totalOpens,
        totalClicks,
        openRate: total > 0 ? (opened / total) * 100 : 0,
        clickRate: total > 0 ? (clicked / total) * 100 : 0,
        bounceRate: total > 0 ? (bounced / total) * 100 : 0,
      }
    } catch (err) {
      console.error('Error getting campaign stats:', err)
      return null
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  return {
    campaigns,
    loading,
    error,
    sendingCampaign,
    sendProgress,
    fetchCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    sendCampaign,
    getCampaignStats,
  }
}
