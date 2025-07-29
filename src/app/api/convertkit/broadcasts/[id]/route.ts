import { NextRequest, NextResponse } from 'next/server'

const CONVERTKIT_API_KEY = process.env.CONVERTKIT_API_KEY
const CONVERTKIT_API_SECRET = process.env.CONVERTKIT_API_SECRET
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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: broadcastId } = await params

    const response = await makeConvertKitRequest(`/broadcasts/${broadcastId}`)
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching ConvertKit broadcast:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch broadcast' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: broadcastId } = await params
    const body = await request.json()

    console.log('Updating broadcast:', broadcastId, 'with:', body)

    const response = await makeConvertKitRequest(`/broadcasts/${broadcastId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })

    console.log('Broadcast updated:', response)
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating ConvertKit broadcast:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update broadcast' },
      { status: 500 }
    )
  }
}
