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

    // Find contact by email
    const { data: contactData } = await supabase
      .from('contacts')
      .select('id')
      .eq('email', email)
      .single()

    // Also check emails table
    let contactId = contactData?.id
    if (!contactId) {
      const { data: emailData } = await supabase
        .from('emails')
        .select('contact_id')
        .eq('email_address', email)
        .eq('inactive', false)
        .limit(1)
        .single()
      
      contactId = emailData?.contact_id
    }

    // Get client IP and user agent for audit trail
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Record unsubscribe
    const { error: unsubscribeError } = await supabase
      .from('email_unsubscribes')
      .insert({
        email_address: email,
        contact_id: contactId || null,
        source: 'link',
        ip_address: ipAddress,
        user_agent: userAgent,
      })

    if (unsubscribeError) {
      console.error('Error recording unsubscribe:', unsubscribeError)
    }

    // Mark email as inactive in emails table if contact found
    if (contactId) {
      // Mark in main contact email
      await supabase
        .from('contacts')
        .update({ inactive: true })
        .eq('id', contactId)
        .eq('email', email)

      // Mark in emails table
      await supabase
        .from('emails')
        .update({ inactive: true })
        .eq('contact_id', contactId)
        .eq('email_address', email)
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


