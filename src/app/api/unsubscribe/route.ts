import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get('email')

    if (!email) {
      return new NextResponse(
        `<!DOCTYPE html>
<html>
<head>
  <title>Unsubscribe</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
    .error { color: #dc2626; }
    .success { color: #16a34a; }
    form { margin-top: 20px; }
    input[type="email"] { width: 100%; padding: 8px; margin: 10px 0; }
    button { background: #000; color: white; padding: 10px 20px; border: none; cursor: pointer; }
  </style>
</head>
<body>
  <h1>Unsubscribe from Emails</h1>
  <p class="error">Email address is required.</p>
  <form method="GET">
    <label>Email Address:</label>
    <input type="email" name="email" required />
    <button type="submit">Unsubscribe</button>
  </form>
</body>
</html>`,
        { status: 400, headers: { 'Content-Type': 'text/html' } }
      )
    }

    const emailLower = email.toLowerCase().trim()

    // Check if already unsubscribed
    const { data: existingUnsubscribe } = await supabase
      .from('email_unsubscribes')
      .select('id')
      .eq('email_address', emailLower)
      .limit(1)
      .single()

    // If already unsubscribed, still return success (idempotent)
    if (existingUnsubscribe) {
      return new NextResponse(
        `<!DOCTYPE html>
<html>
<head>
  <title>Unsubscribed</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
    .success { color: #16a34a; }
    .info { color: #6b7280; margin-top: 20px; font-size: 14px; }
  </style>
</head>
<body>
  <h1>Already Unsubscribed</h1>
  <p class="success">This email address is already unsubscribed from our mailing list.</p>
  <p>You will not receive marketing emails from us.</p>
  <p class="info">If you have any questions or concerns, please contact us at support@medstar.agency.</p>
</body>
</html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      )
    }

    // Find contact by email (check main email field)
    const { data: contactData } = await supabase
      .from('contacts')
      .select('id, email')
      .eq('email', emailLower)
      .single()

    const contactId = contactData?.id || null

    // Get client IP and user agent for audit trail
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Record unsubscribe (only if not already exists)
    const { error: unsubscribeError } = await supabase
      .from('email_unsubscribes')
      .insert({
        email_address: emailLower,
        contact_id: contactId,
        source: 'link',
        ip_address: ipAddress,
        user_agent: userAgent,
      })

    if (unsubscribeError) {
      console.error('Error recording unsubscribe:', unsubscribeError)
      throw unsubscribeError
    }

    // Return success page
    return new NextResponse(
      `<!DOCTYPE html>
<html>
<head>
  <title>Unsubscribed</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
    .success { color: #16a34a; }
    .info { color: #6b7280; margin-top: 20px; font-size: 14px; }
  </style>
</head>
<body>
  <h1>Successfully Unsubscribed</h1>
  <p class="success">You have been unsubscribed from our email list.</p>
  <p>We're sorry to see you go. You will no longer receive marketing emails from us.</p>
  <p class="info">If you have any questions or concerns, please contact us at support@medstar.agency.</p>
</body>
</html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    )
  } catch (error) {
    console.error('Unsubscribe error:', error)
    return new NextResponse(
      `<!DOCTYPE html>
<html>
<head>
  <title>Error</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
    .error { color: #dc2626; }
  </style>
</head>
<body>
  <h1>Error</h1>
  <p class="error">An error occurred while processing your unsubscribe request. Please try again later or contact us directly.</p>
</body>
</html>`,
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    )
  }
}


