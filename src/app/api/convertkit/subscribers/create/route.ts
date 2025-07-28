import { NextRequest, NextResponse } from 'next/server'

const CONVERTKIT_API_KEY = process.env.CONVERTKIT_API_KEY
const CONVERTKIT_API_SECRET = process.env.CONVERTKIT_API_SECRET
const CONVERTKIT_FORM_ID = process.env.CONVERTKIT_FORM_ID
const BASE_URL = 'https://api.convertkit.com/v3'

async function makeConvertKitRequest(endpoint: string, options: RequestInit = {}) {
  if (!CONVERTKIT_API_KEY || !CONVERTKIT_API_SECRET) {
    throw new Error('ConvertKit API credentials not configured')
  }

  // Add API key and secret to query string for ConvertKit
  const separator = endpoint.includes('?') ? '&' : '?'
  const url = `${BASE_URL}${endpoint}${separator}api_key=${CONVERTKIT_API_KEY}&api_secret=${CONVERTKIT_API_SECRET}`

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, first_name, last_name, tags } = body

    if (!CONVERTKIT_FORM_ID) {
      throw new Error('ConvertKit form ID not configured')
    }

    const response = await makeConvertKitRequest(`/forms/${CONVERTKIT_FORM_ID}/subscribe`, {
      method: 'POST',
      body: JSON.stringify({
        email_address: email,
        first_name: first_name || '',
        last_name: last_name || '',
        tags: tags || [],
      }),
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error creating ConvertKit subscriber:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create subscriber' },
      { status: 500 }
    )
  }
}
