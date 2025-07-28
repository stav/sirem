import { supabase } from './supabase'

// ConvertKit API types
export interface ConvertKitSubscriber {
  id: number
  email_address: string
  first_name?: string
  last_name?: string
  state: 'active' | 'inactive' | 'unsubscribed'
  created_at: string
  fields?: Record<string, string | number | boolean>
  tags?: ConvertKitTag[]
}

export interface ConvertKitTag {
  id: number
  name: string
  created_at: string
}

export interface ConvertKitForm {
  id: number
  name: string
  type: string
  created_at: string
}

export interface ConvertKitCampaign {
  id: number
  name: string
  subject: string
  content: string
  status: string
  created_at: string
}

export interface ConvertKitBroadcast {
  id: number
  name: string
  subject: string
  content: string
  status: string
  created_at: string
  published_at?: string
  sent_count: number
  open_rate: number
  click_rate: number
}

export interface ConvertKitSubscriberStats {
  subscriber_id: number
  email_address: string
  status: string
  sent_count: number
  open_count: number
  click_count: number
  last_sent_at?: string
  last_opened_at?: string
  last_clicked_at?: string
}

class ConvertKitService {
  private apiKey: string
  private apiSecret: string
  private baseUrl = 'https://api.convertkit.com/v3'

  constructor() {
    this.apiKey = process.env.CONVERTKIT_API_KEY || ''
    this.apiSecret = process.env.CONVERTKIT_API_SECRET || ''

    if (!this.apiKey || !this.apiSecret) {
      console.warn('ConvertKit API credentials not configured')
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('ConvertKit API credentials not configured')
    }

    const url = `${this.baseUrl}${endpoint}`
    const auth = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64')

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`ConvertKit API error: ${response.status} ${errorText}`)
    }

    return response.json()
  }

  // Subscriber management
  async getSubscribers(page = 1, limit = 50): Promise<{ subscribers: ConvertKitSubscriber[]; total_pages: number }> {
    const response = await this.makeRequest(`/subscribers?page=${page}&limit=${limit}`)
    return response
  }

  async getSubscriber(subscriberId: number): Promise<ConvertKitSubscriber> {
    const response = await this.makeRequest(`/subscribers/${subscriberId}`)
    return response.subscriber
  }

  async createSubscriber(
    email: string,
    firstName?: string,
    lastName?: string,
    tags?: number[]
  ): Promise<ConvertKitSubscriber> {
    const formId = process.env.CONVERTKIT_FORM_ID
    if (!formId) {
      throw new Error('ConvertKit form ID not configured')
    }

    const response = await this.makeRequest(`/forms/${formId}/subscribe`, {
      method: 'POST',
      body: JSON.stringify({
        email_address: email,
        first_name: firstName,
        last_name: lastName,
        tags: tags || [],
      }),
    })

    return response.subscription.subscriber
  }

  async updateSubscriber(subscriberId: number, data: Partial<ConvertKitSubscriber>): Promise<ConvertKitSubscriber> {
    const response = await this.makeRequest(`/subscribers/${subscriberId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })

    return response.subscriber
  }

  async addTagToSubscriber(subscriberId: number, tagId: number): Promise<void> {
    await this.makeRequest(`/subscribers/${subscriberId}/tags`, {
      method: 'POST',
      body: JSON.stringify({ tag_id: tagId }),
    })
  }

  async removeTagFromSubscriber(subscriberId: number, tagId: number): Promise<void> {
    await this.makeRequest(`/subscribers/${subscriberId}/tags/${tagId}`, {
      method: 'DELETE',
    })
  }

  // Tag management
  async getTags(): Promise<ConvertKitTag[]> {
    const response = await this.makeRequest('/tags')
    return response.tags
  }

  async createTag(name: string): Promise<ConvertKitTag> {
    const response = await this.makeRequest('/tags', {
      method: 'POST',
      body: JSON.stringify({ tag: { name } }),
    })

    return response.tag
  }

  // Form management
  async getForms(): Promise<ConvertKitForm[]> {
    const response = await this.makeRequest('/forms')
    return response.forms
  }

  // Campaign management
  async getCampaigns(): Promise<ConvertKitCampaign[]> {
    const response = await this.makeRequest('/campaigns')
    return response.campaigns
  }

  async createCampaign(name: string, subject: string, content: string): Promise<ConvertKitCampaign> {
    const response = await this.makeRequest('/campaigns', {
      method: 'POST',
      body: JSON.stringify({
        campaign: {
          name,
          subject,
          content,
        },
      }),
    })

    return response.campaign
  }

  // Broadcast management
  async getBroadcasts(): Promise<ConvertKitBroadcast[]> {
    const response = await this.makeRequest('/broadcasts')
    return response.broadcasts
  }

  async createBroadcast(name: string, subject: string, content: string, tags?: number[]): Promise<ConvertKitBroadcast> {
    const response = await this.makeRequest('/broadcasts', {
      method: 'POST',
      body: JSON.stringify({
        broadcast: {
          name,
          subject,
          content,
          tag_ids: tags || [],
        },
      }),
    })

    return response.broadcast
  }

  async sendBroadcast(broadcastId: number): Promise<void> {
    await this.makeRequest(`/broadcasts/${broadcastId}/send`, {
      method: 'POST',
    })
  }

  // Analytics and tracking
  async getSubscriberStats(subscriberId: number): Promise<ConvertKitSubscriberStats> {
    const response = await this.makeRequest(`/subscribers/${subscriberId}/stats`)
    return response.stats
  }

  // Local database sync methods
  async syncSubscribersToDatabase(): Promise<{ synced: number; errors: number }> {
    let synced = 0
    let errors = 0
    let page = 1
    let hasMore = true

    while (hasMore) {
      try {
        const { subscribers, total_pages } = await this.getSubscribers(page)

        for (const subscriber of subscribers) {
          try {
            // Check if subscriber already exists
            const { data: existing } = await supabase
              .from('convertkit_subscribers')
              .select('id')
              .eq('convertkit_id', subscriber.id)
              .single()

            if (existing) {
              // Update existing subscriber
              await supabase
                .from('convertkit_subscribers')
                .update({
                  email: subscriber.email_address,
                  first_name: subscriber.first_name,
                  last_name: subscriber.last_name,
                  state: subscriber.state,
                  convertkit_tags: subscriber.tags?.map((tag) => tag.name) || [],
                  updated_at: new Date().toISOString(),
                })
                .eq('convertkit_id', subscriber.id)
            } else {
              // Create new subscriber
              await supabase.from('convertkit_subscribers').insert({
                convertkit_id: subscriber.id,
                email: subscriber.email_address,
                first_name: subscriber.first_name,
                last_name: subscriber.last_name,
                state: subscriber.state,
                convertkit_tags: subscriber.tags?.map((tag) => tag.name) || [],
                subscribed_at: subscriber.created_at,
              })
            }

            synced++
          } catch (error) {
            console.error(`Error syncing subscriber ${subscriber.id}:`, error)
            errors++
          }
        }

        hasMore = page < total_pages
        page++
      } catch (error) {
        console.error(`Error fetching subscribers page ${page}:`, error)
        errors++
        break
      }
    }

    return { synced, errors }
  }

  async syncContactsToConvertKit(): Promise<{ synced: number; errors: number }> {
    let synced = 0
    let errors = 0

    try {
      // Get contacts with email addresses that aren't in ConvertKit
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email')
        .not('email', 'is', null)
        .not('email', 'eq', '')

      if (!contacts) return { synced, errors }

      for (const contact of contacts) {
        try {
          // Check if contact is already in ConvertKit
          const { data: existingSubscriber } = await supabase
            .from('convertkit_subscribers')
            .select('convertkit_id')
            .eq('email', contact.email!)
            .single()

          if (existingSubscriber) {
            // Update contact relationship
            await supabase
              .from('convertkit_subscribers')
              .update({ contact_id: contact.id })
              .eq('convertkit_id', existingSubscriber.convertkit_id)
          } else {
            // Create new ConvertKit subscriber
            const subscriber = await this.createSubscriber(contact.email!, contact.first_name, contact.last_name)

            // Store in local database
            await supabase.from('convertkit_subscribers').insert({
              convertkit_id: subscriber.id,
              email: subscriber.email_address,
              first_name: subscriber.first_name,
              last_name: subscriber.last_name,
              contact_id: contact.id,
              state: subscriber.state,
              subscribed_at: subscriber.created_at,
            })
          }

          synced++
        } catch (error) {
          console.error(`Error syncing contact ${contact.id}:`, error)
          errors++
        }
      }
    } catch (error) {
      console.error('Error syncing contacts to ConvertKit:', error)
      errors++
    }

    return { synced, errors }
  }
}

export const convertkit = new ConvertKitService()
