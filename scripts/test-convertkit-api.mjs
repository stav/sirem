#!/usr/bin/env node

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env.local') })

class ConvertKitTester {
  constructor() {
    this.apiKey = process.env.CONVERTKIT_API_KEY
    this.apiSecret = process.env.CONVERTKIT_API_SECRET
    this.baseUrl = 'https://api.convertkit.com/v3'
  }

  async makeRequest(endpoint, options = {}) {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('ConvertKit API credentials not configured')
    }

    // Add API key to query string for ConvertKit
    const separator = endpoint.includes('?') ? '&' : '?'
    const url = `${this.baseUrl}${endpoint}${separator}api_key=${this.apiKey}`

    const response = await fetch(url, {
      ...options,
      headers: {
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

  async makeRequestWithSecret(endpoint, options = {}) {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('ConvertKit API credentials not configured')
    }

    // Add both API key and secret to query string for endpoints that require it
    const separator = endpoint.includes('?') ? '&' : '?'
    const url = `${this.baseUrl}${endpoint}${separator}api_key=${this.apiKey}&api_secret=${this.apiSecret}`

    const response = await fetch(url, {
      ...options,
      headers: {
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

  async testConnection() {
    console.log('🔍 Testing ConvertKit API connection...')

    try {
      // Test 1: Get account information
      console.log('\n📊 Test 1: Getting account information...')
      const account = await this.makeRequestWithSecret('/account')
      console.log('✅ Account info retrieved successfully')
      console.log(`   Account Name: ${account.account?.name || 'N/A'}`)
      console.log(`   Account ID: ${account.account?.id || 'N/A'}`)
      console.log(`   Primary Email: ${account.account?.primary_email_address || 'N/A'}`)

      return true
    } catch (error) {
      console.error('❌ Failed to get account information:', error.message)
      return false
    }
  }

  async testSubscribers() {
    console.log('\n👥 Test 2: Testing subscriber retrieval...')

    try {
      const response = await this.makeRequestWithSecret('/subscribers?page=1&limit=5')
      console.log('✅ Subscribers retrieved successfully')
      console.log(`   Total subscribers: ${response.total_subscribers || 'Unknown'}`)
      console.log(`   Subscribers on this page: ${response.subscribers?.length || 0}`)

      if (response.subscribers && response.subscribers.length > 0) {
        console.log('   Sample subscriber:')
        const sample = response.subscribers[0]
        console.log(`     - ID: ${sample.id}`)
        console.log(`     - Email: ${sample.email_address}`)
        console.log(`     - Status: ${sample.state}`)
      }

      return true
    } catch (error) {
      console.error('❌ Failed to retrieve subscribers:', error.message)
      return false
    }
  }

  async testTags() {
    console.log('\n🏷️ Test 3: Testing tag retrieval...')

    try {
      const response = await this.makeRequest('/tags')
      console.log('✅ Tags retrieved successfully')
      console.log(`   Total tags: ${response.tags?.length || 0}`)

      if (response.tags && response.tags.length > 0) {
        console.log('   Available tags:')
        response.tags.slice(0, 5).forEach((tag) => {
          console.log(`     - ${tag.name} (ID: ${tag.id})`)
        })
        if (response.tags.length > 5) {
          console.log(`     ... and ${response.tags.length - 5} more`)
        }
      }

      return true
    } catch (error) {
      console.error('❌ Failed to retrieve tags:', error.message)
      return false
    }
  }

  async testForms() {
    console.log('\n📝 Test 4: Testing form retrieval...')

    try {
      const response = await this.makeRequest('/forms')
      console.log('✅ Forms retrieved successfully')
      console.log(`   Total forms: ${response.forms?.length || 0}`)

      if (response.forms && response.forms.length > 0) {
        console.log('   Available forms:')
        response.forms.forEach((form) => {
          console.log(`     - ${form.name} (ID: ${form.id}, Type: ${form.type})`)
        })
      }

      return true
    } catch (error) {
      console.error('❌ Failed to retrieve forms:', error.message)
      return false
    }
  }

  async testCampaigns() {
    console.log('\n📧 Test 5: Testing broadcast retrieval...')

    try {
      const response = await this.makeRequestWithSecret('/broadcasts')
      console.log('✅ Broadcasts retrieved successfully')
      console.log(`   Total broadcasts: ${response.broadcasts?.length || 0}`)

      if (response.broadcasts && response.broadcasts.length > 0) {
        console.log('   Available broadcasts:')
        response.broadcasts.slice(0, 3).forEach((campaign) => {
          console.log(`     - ${campaign.name} (ID: ${campaign.id}, Status: ${campaign.status})`)
        })
        if (response.broadcasts.length > 3) {
          console.log(`     ... and ${response.broadcasts.length - 3} more`)
        }
      }

      return true
    } catch (error) {
      console.error('❌ Failed to retrieve broadcasts:', error.message)
      return false
    }
  }

  async runAllTests() {
    console.log('🚀 Starting ConvertKit API Tests\n')
    console.log('='.repeat(50))

    // Check if credentials are configured
    if (!this.apiKey || !this.apiSecret) {
      console.error('❌ ConvertKit API credentials not found!')
      console.log('\nPlease add the following to your .env.local file:')
      console.log('CONVERTKIT_API_KEY=your-api-key')
      console.log('CONVERTKIT_API_SECRET=your-api-secret')
      return
    }

    console.log('✅ API credentials found')
    console.log(`   API Key: ${this.apiKey.substring(0, 8)}...`)
    console.log(`   API Secret: ${this.apiSecret.substring(0, 8)}...`)

    const tests = [
      this.testConnection(),
      this.testSubscribers(),
      this.testTags(),
      this.testForms(),
      this.testCampaigns(),
    ]

    const results = await Promise.allSettled(tests)

    console.log('\n' + '='.repeat(50))
    console.log('📋 Test Results Summary:')

    const passed = results.filter((r) => r.status === 'fulfilled' && r.value).length
    const failed = results.length - passed

    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)

    if (failed === 0) {
      console.log('\n🎉 All tests passed! Your ConvertKit API is working correctly.')
    } else {
      console.log('\n⚠️  Some tests failed. Please check your API credentials and permissions.')
    }
  }
}

// Run the tests
const tester = new ConvertKitTester()
tester.runAllTests().catch(console.error)
