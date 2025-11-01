import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { sendBulkEmails, extractEmailAddresses, createPersonalizedTemplate, getDefaultEmailConfig } from '@/lib/email-service'

export interface Campaign {
  id: string
  created_at: string
  updated_at: string
  name: string
  subject: string
  content: string
  html_content?: string
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled'
  created_by?: string
  scheduled_at?: string
  sent_at?: string
  total_recipients: number
  sent_count: number
  delivered_count: number
  opened_count: number
  clicked_count: number
  bounce_count: number
  metadata?: any
}

export interface CampaignRecipient {
  id: string
  created_at: string
  updated_at: string
  campaign_id: string
  contact_id: string
  email_address: string
  first_name?: string
  last_name?: string
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed'
  sent_at?: string
  delivered_at?: string
  opened_at?: string
  clicked_at?: string
  bounced_at?: string
  error_message?: string
  resend_message_id?: string
  metadata?: any
}

export interface CampaignForm {
  name: string
  subject: string
  content: string
  html_content?: string
  scheduled_at?: string
}

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching campaigns:', error)
        return
      }

      setCampaigns(data || [])
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const createCampaign = async (campaignData: CampaignForm, contacts: any[]) => {
    try {
      // Extract email addresses from contacts
      const recipients = extractEmailAddresses(contacts)
      
      if (recipients.length === 0) {
        throw new Error('No valid email addresses found in the selected contacts')
      }

      // Create campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          name: campaignData.name,
          subject: campaignData.subject,
          content: campaignData.content,
          html_content: campaignData.html_content,
          total_recipients: recipients.length,
          scheduled_at: campaignData.scheduled_at || null,
          status: campaignData.scheduled_at ? 'scheduled' : 'draft'
        })
        .select()
        .single()

      if (campaignError) {
        console.error('Error creating campaign:', campaignError)
        return null
      }

      // Create campaign recipients
      const recipientData = recipients.map(recipient => ({
        campaign_id: campaign.id,
        contact_id: contacts.find(c => c.email === recipient.email || 
          c.emails?.some((e: any) => e.email_address === recipient.email))?.id || '',
        email_address: recipient.email,
        first_name: recipient.firstName,
        last_name: recipient.lastName,
        enabled: true  // All new recipients are enabled by default
      }))

      const { error: recipientsError } = await supabase
        .from('campaign_recipients')
        .insert(recipientData)

      if (recipientsError) {
        console.error('Error creating campaign recipients:', recipientsError)
        // Clean up campaign if recipients creation failed
        await supabase.from('campaigns').delete().eq('id', campaign.id)
        return null
      }

      await fetchCampaigns()
      return campaign
    } catch (error) {
      console.error('Error creating campaign:', error)
      return null
    }
  }

  const sendCampaign = async (campaignId: string) => {
    try {
      // Update campaign status to sending
      await supabase
        .from('campaigns')
        .update({ status: 'sending' })
        .eq('id', campaignId)

      // Get campaign details
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()

      if (campaignError || !campaign) {
        throw new Error('Campaign not found')
      }

      // Get recipients - only those that are enabled
      const { data: recipients, error: recipientsError } = await supabase
        .from('campaign_recipients')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('status', 'pending')

      if (recipientsError || !recipients) {
        throw new Error('Failed to fetch recipients')
      }

      // Filter to only enabled recipients
      const enabledRecipients = recipients.filter(r => r.enabled !== false)

      // Prepare email data
      const emailConfig = getDefaultEmailConfig()
      const emailRecipients = enabledRecipients.map(r => ({
        email: r.email_address,
        firstName: r.first_name,
        lastName: r.last_name
      }))

      // Send emails
      const result = await sendBulkEmails(
        emailRecipients,
        {
          subject: campaign.subject,
          htmlContent: campaign.html_content || campaign.content,
          textContent: campaign.content
        },
        emailConfig.from,
        5, // batch size
        1000 // delay between batches
      )

      // Update campaign status
      await supabase
        .from('campaigns')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString(),
          sent_count: result.success
        })
        .eq('id', campaignId)

      // Update recipient statuses - only for enabled recipients that were sent
      if (result.success > 0) {
        const enabledRecipientIds = enabledRecipients.map(r => r.id)
        await supabase
          .from('campaign_recipients')
          .update({ 
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('campaign_id', campaignId)
          .eq('status', 'pending')
          .in('id', enabledRecipientIds)
      }

      await fetchCampaigns()
      return { success: true, sent: result.success, failed: result.failed }
    } catch (error) {
      console.error('Error sending campaign:', error)
      
      // Update campaign status to failed
      await supabase
        .from('campaigns')
        .update({ status: 'cancelled' })
        .eq('id', campaignId)

      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  const deleteCampaign = async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId)

      if (error) {
        console.error('Error deleting campaign:', error)
        return false
      }

      await fetchCampaigns()
      return true
    } catch (error) {
      console.error('Error deleting campaign:', error)
      return false
    }
  }

  const updateCampaign = async (campaignId: string, updates: Partial<CampaignForm>) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update(updates)
        .eq('id', campaignId)

      if (error) {
        console.error('Error updating campaign:', error)
        return false
      }

      await fetchCampaigns()
      return true
    } catch (error) {
      console.error('Error updating campaign:', error)
      return false
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [])

  return {
    campaigns,
    loading,
    fetchCampaigns,
    createCampaign,
    sendCampaign,
    deleteCampaign,
    updateCampaign
  }
}

export function useCampaignRecipients(campaignId: string) {
  const [recipients, setRecipients] = useState<CampaignRecipient[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRecipients = async () => {
    try {
      const { data, error } = await supabase
        .from('campaign_recipients')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching campaign recipients:', error)
        return
      }

      setRecipients(data || [])
    } catch (error) {
      console.error('Error fetching campaign recipients:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateRecipientStatus = async (recipientId: string, status: CampaignRecipient['status'], metadata?: any) => {
    try {
      const updateData: any = { status }
      
      if (status === 'sent') {
        updateData.sent_at = new Date().toISOString()
      } else if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString()
      } else if (status === 'opened') {
        updateData.opened_at = new Date().toISOString()
      } else if (status === 'clicked') {
        updateData.clicked_at = new Date().toISOString()
      } else if (status === 'bounced') {
        updateData.bounced_at = new Date().toISOString()
      }

      if (metadata) {
        updateData.metadata = metadata
      }

      const { error } = await supabase
        .from('campaign_recipients')
        .update(updateData)
        .eq('id', recipientId)

      if (error) {
        console.error('Error updating recipient status:', error)
        return false
      }

      await fetchRecipients()
      return true
    } catch (error) {
      console.error('Error updating recipient status:', error)
      return false
    }
  }

  useEffect(() => {
    if (campaignId) {
      fetchRecipients()
    }
  }, [campaignId])

  return {
    recipients,
    loading,
    fetchRecipients,
    updateRecipientStatus
  }
}
