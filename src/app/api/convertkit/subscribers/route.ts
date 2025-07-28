import { NextRequest, NextResponse } from 'next/server'

const CONVERTKIT_API_KEY = process.env.CONVERTKIT_API_KEY
const CONVERTKIT_API_SECRET = process.env.CONVERTKIT_API_SECRET
const BASE_URL = 'https://api.convertkit.com/v3'

async function makeConvertKitRequest(endpoint: string, options: RequestInit = {}) {
  if (!CONVERTKIT_API_KEY || !CONVERTKIT_API_SECRET) {
    throw new Error('ConvertKit API credentials not configured')
  }

  // ConvertKit API requires both api_key and api_secret as query parameters
  // This is their documented authentication method, though not ideal for security
  // The API secret is only sent server-to-server, so it's more secure than client-side
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '50'

    const response = await makeConvertKitRequest(`/subscribers?page=${page}&limit=${limit}`)

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching ConvertKit subscribers:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch subscribers' },
      { status: 500 }
    )
  }
}
