import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * Verify webhook signature from Resend
 * Resend signs webhooks with a secret key
 */
function verifyResendSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(payload)
    const expectedSignature = hmac.digest('hex')
    
    // Resend may send signature in different formats, handle both
    return (
      crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      ) || signature === expectedSignature
    )
  } catch (error) {
    console.error('Error verifying signature:', error)
    return false
  }
}

/**
 * Handle Resend webhook events
 * 
 * Only handles email.complained events (spam complaints) which trigger unsubscribe.
 * 
 * Note: There is NO email.unsubscribed event in Resend. Unsubscribes are handled via:
 * - Manual unsubscribe links (your /api/unsubscribe endpoint)
 * - email.complained events (spam complaints - handled here)
 */
export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const rawBody = await request.text()
    const body = JSON.parse(rawBody)

    // Verify webhook signature (if secret is configured)
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
    if (webhookSecret) {
      const signature = request.headers.get('resend-signature') || 
                       request.headers.get('x-resend-signature') || 
                       ''
      
      if (!signature || !verifyResendSignature(rawBody, signature, webhookSecret)) {
        console.error('Invalid webhook signature')
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    } else {
      console.warn('RESEND_WEBHOOK_SECRET not configured - skipping signature verification')
    }

    // Extract event type and data
    const eventType = body.type || body.event
    const eventData = body.data || body

    // Only handle spam complaints (unsubscribe)
    if (eventType === 'email.complained') {
      await handleComplaintEvent(eventData)
    } else {
      // Ignore all other events
      console.log('Ignoring webhook event:', eventType)
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    // Return 200 to prevent Resend from retrying
    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 200 }
    )
  }
}

/**
 * Extract email address from webhook event data
 */
function extractEmailFromEvent(data: {
  email?: string
  recipient?: string
  to?: string
  [key: string]: unknown
}): string | null {
  const email = (data.email || data.recipient || data.to || '').toString().toLowerCase().trim()
  return email && email.includes('@') ? email : null
}

/**
 * Handle spam complaint event - should trigger unsubscribe
 * When someone marks an email as spam, we should unsubscribe them
 */
async function handleComplaintEvent(data: {
  email?: string
  recipient?: string
  to?: string
  created_at?: string
  [key: string]: unknown
}) {
  const email = extractEmailFromEvent(data)
  
  if (!email) {
    console.error('Invalid email in complaint event:', data)
    return
  }

  console.log('Processing spam complaint (unsubscribe) for:', email)

  // Use the same unsubscribe logic
  await unsubscribeEmail(email, 'webhook_complaint')
}

/**
 * Unsubscribe an email address (shared logic for complaints and other events)
 */
async function unsubscribeEmail(email: string, source: string) {
  // Check if already unsubscribed (idempotent)
  const { data: existingUnsubscribe } = await supabase
    .from('email_unsubscribes')
    .select('id')
    .eq('email_address', email)
    .limit(1)
    .single()

  if (existingUnsubscribe) {
    console.log('Email already unsubscribed:', email)
    return
  }

  // Find contact by email
  const { data: contactData } = await supabase
    .from('contacts')
    .select('id, email')
    .eq('email', email)
    .single()

  let contactId = contactData?.id

  // Also check emails table
  if (!contactId) {
    const { data: emailData } = await supabase
      .from('emails')
      .select('contact_id')
      .eq('email_address', email)
      .limit(1)
      .single()
    
    contactId = emailData?.contact_id
  }

  // Record unsubscribe
  const { error: unsubscribeError } = await supabase
    .from('email_unsubscribes')
    .insert({
      email_address: email,
      contact_id: contactId || null,
      source, // 'webhook_complaint' or other source
      ip_address: null, // Not available from webhook
      user_agent: null, // Not available from webhook
    })

  if (unsubscribeError) {
    console.error('Error recording unsubscribe from webhook:', unsubscribeError)
    throw unsubscribeError
  }

  // Mark email/contact as inactive (same logic as manual unsubscribe)
  if (contactId) {
    if (contactData?.email?.toLowerCase().trim() === email) {
      await supabase
        .from('contacts')
        .update({ inactive: true })
        .eq('id', contactId)
        .eq('email', email)
    }

    await supabase
      .from('emails')
      .update({ inactive: true })
      .eq('contact_id', contactId)
      .eq('email_address', email)
  }

  console.log('Successfully processed unsubscribe for:', email, 'source:', source)
}


