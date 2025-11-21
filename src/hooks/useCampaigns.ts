import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { sendBulkEmails, extractEmailAddresses } from '@/lib/email-service'
import type { Database } from '@/lib/supabase'
import type { Json } from '@/lib/supabase-types'

type Contact = Database['public']['Tables']['contacts']['Row']

export interface Campaign {
  id: string
  created_at: string
  updated_at: string
  name: string
  subject: string
  content: string
  html_content?: string | null
  status: string | null
  created_by?: string | null
  scheduled_at?: string | null
  sent_at?: string | null
  total_recipients: number | null
  sent_count: number | null
  delivered_count: number | null
  opened_count: number | null
  clicked_count: number | null
  bounce_count: number | null
  metadata?: Json
}

export interface CampaignRecipient {
  id: string
  created_at: string
  updated_at: string
  campaign_id: string
  contact_id: string
  email_address: string
  enabled: boolean | null
  first_name: string | null
  last_name: string | null
  status: string | null
  sent_at: string | null
  delivered_at: string | null
  opened_at: string | null
  clicked_at: string | null
  bounced_at: string | null
  error_message: string | null
  resend_message_id: string | null
  metadata: Json | null
}

export interface CampaignForm {
  name: string
  subject: string
  content: string
  html_content?: string
  scheduled_at?: string
  metadata?: Record<string, unknown>
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

  const createCampaign = async (campaignData: CampaignForm, contacts: Contact[]) => {
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
          status: campaignData.scheduled_at ? 'scheduled' : 'draft',
          metadata: campaignData.metadata || null
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
        contact_id: contacts.find(c => c.email === recipient.email)?.id || '',
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

      // Get recipients - include both pending and sent (for resend capability)
      const { data: recipients, error: recipientsError } = await supabase
        .from('campaign_recipients')
        .select('*')
        .eq('campaign_id', campaignId)
        .in('status', ['pending', 'sent'])

      if (recipientsError || !recipients) {
        throw new Error('Failed to fetch recipients')
      }

      // Filter to only enabled recipients
      const enabledRecipients = recipients.filter(r => r.enabled !== false)

      // Prepare email data
      const emailRecipients = enabledRecipients.map(r => ({
        email: r.email_address,
        firstName: r.first_name,
        lastName: r.last_name
      }))

      // Extract template info from metadata if available
      const metadata = campaign.metadata as Record<string, unknown> | null
      const templateName = metadata?.templateName as string | undefined
      const templateProps = metadata?.templateProps as Record<string, unknown> | undefined

      // Send emails
      const result = await sendBulkEmails(
        emailRecipients,
        {
          subject: campaign.subject,
          htmlContent: campaign.html_content ?? campaign.content,
          textContent: campaign.content,
          templateName,
          templateProps
        },
        5, // batch size
        1000 // delay between batches
      )

      // Update recipient statuses individually with API response data FIRST
      // This ensures we capture all results even if all emails fail
      if (result.results && result.results.length > 0) {
        const updates = result.results.map(emailResult => {
          const recipient = enabledRecipients.find(r => r.email_address === emailResult.email)
          if (!recipient) return null

          const updateData: Record<string, unknown> = {
            status: emailResult.success ? 'sent' : 'failed',
            sent_at: new Date().toISOString()
          }

          if (emailResult.messageId) {
            updateData.resend_message_id = emailResult.messageId
          }

          if (emailResult.error) {
            updateData.error_message = emailResult.error
          }

          return supabase
            .from('campaign_recipients')
            .update(updateData)
            .eq('id', recipient.id)
        }).filter(Boolean)

        await Promise.all(updates)
      } else if (result.success > 0) {
        // Fallback: update all enabled recipients as sent if no individual results
        const enabledRecipientIds = enabledRecipients.map(r => r.id)
        await supabase
          .from('campaign_recipients')
          .update({ 
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('campaign_id', campaignId)
          .in('id', enabledRecipientIds)
      }

      // Update campaign status based on results
      if (result.success === 0 && result.failed > 0) {
        // All emails failed
        await supabase
          .from('campaigns')
          .update({ status: 'cancelled' })
          .eq('id', campaignId)
        
        await fetchCampaigns()
        return { 
          success: false, 
          error: `All emails failed to send. ${result.errors.join('; ')}`,
          sent: result.success,
          failed: result.failed
        }
      }

      // Some or all emails succeeded
      await supabase
        .from('campaigns')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString(),
          sent_count: result.success
        })
        .eq('id', campaignId)

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
      // Prepare update data - convert empty strings to null for optional fields
      const updateData: {
        name?: string
        subject?: string
        content?: string
        html_content?: string | null
        scheduled_at?: string | null
        metadata?: Json
      } = {
        ...updates,
        scheduled_at: updates.scheduled_at === '' || updates.scheduled_at === undefined ? null : updates.scheduled_at,
        html_content: updates.html_content === '' || updates.html_content === undefined ? null : updates.html_content,
        metadata: updates.metadata
      }

      const { error } = await supabase
        .from('campaigns')
        .update(updateData)
        .eq('id', campaignId)

      if (error) {
        console.error('Error updating campaign:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          error,
        })
        return false
      }

      await fetchCampaigns()
      return true
    } catch (error) {
      console.error('Error updating campaign (catch):', error)
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

  const updateRecipientStatus = async (recipientId: string, status: CampaignRecipient['status'], metadata?: Record<string, unknown>) => {
    try {
      const updateData: Record<string, unknown> = { status }
      
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId])

  return {
    recipients,
    loading,
    fetchRecipients,
    updateRecipientStatus
  }
}
