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
    const configuredFrom = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
    const fromEmail = from || configuredFrom

    console.log('Sending email:', {
      from: fromEmail,
      to,
      subject,
      hasHtml: !!html,
      hasText: !!text,
      recipientsCount: to.length
    })

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
      text,
    })

    if (error) {
      console.error('Resend API error:', error)
      const errorMessage = error.message || JSON.stringify(error)
      return NextResponse.json(
        { success: false, error: errorMessage },
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
