import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { to, from, subject, html, text } = await request.json()

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Email service not configured' },
        { status: 500 }
      )
    }

    // Use the configured from email if not provided
    // For testing, use Resend's test domain if medstar.agency is not verified
    const configuredFrom = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
    const fromEmail = from || (configuredFrom.includes('medstar.agency') ? 'onboarding@resend.dev' : configuredFrom)

    // For testing with Resend's test domain, redirect all emails to the verified address
    const testRecipients = to.map(email => 
      email === 'medstar.agency@gmail.com' ? email : 'medstar.agency@gmail.com'
    )

    console.log('Sending email:', {
      from: fromEmail,
      to: testRecipients,
      subject,
      hasHtml: !!html,
      hasText: !!text,
      originalRecipients: to
    })

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: testRecipients,
      subject,
      html,
      text,
    })

    if (error) {
      console.error('Resend API error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      messageId: data?.id
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
