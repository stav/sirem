import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { DefaultTemplate } from '@/emails/DefaultTemplate'
import { render } from '@react-email/render'
import { getUnsubscribeUrl } from '@/lib/email-service'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, text, templateName, templateProps } = await request.json()

    let htmlContent = html
    let textContent = text

    // If a template is requested, render it
    if (templateName === 'DefaultTemplate') {
      // Get recipient email (handle both array and single string)
      const recipientEmail = Array.isArray(to) && to.length > 0 ? to[0] : typeof to === 'string' ? to : ''

      // Pass recipient email to template (baseUrl no longer needed - uses hardcoded production domain)
      const finalTemplateProps = {
        ...templateProps,
        recipientEmail,
      }
      const emailElement = DefaultTemplate(finalTemplateProps)
      htmlContent = await render(emailElement)
      textContent = await render(emailElement, { plainText: true })
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ success: false, error: 'Email service not configured' }, { status: 500 })
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL
    const replyTo = process.env.RESEND_REPLY_TO_EMAIL

    if (!fromEmail) {
      return NextResponse.json(
        { success: false, error: 'Sender email not configured. Set RESEND_FROM_EMAIL in .env.local.' },
        { status: 500 }
      )
    }

    console.log('Sending email:', {
      from: fromEmail,
      to,
      subject,
      hasHtml: !!htmlContent,
      hasText: !!textContent,
      recipientsCount: to.length,
      templateName: templateName || 'raw',
    })

    // Build List-Unsubscribe header for email client unsubscribe button
    // RFC 2369: List-Unsubscribe header allows email clients to show unsubscribe button
    // Uses hardcoded production domain so links work regardless of where campaign was created
    const toArray = Array.isArray(to) ? to : [to]

    // For multiple recipients, we'll use a generic unsubscribe URL
    // (Email clients will show the button, but clicking goes to our page)
    // For single recipient, we can personalize it
    const unsubscribeUrl = getUnsubscribeUrl(toArray.length === 1 ? toArray[0] : null)

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html: htmlContent,
      text: textContent,
      replyTo,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click', // RFC 8058: One-click unsubscribe
      },
    })

    if (error) {
      console.error('Resend API error:', error)
      const errorMessage = error.message || JSON.stringify(error)
      return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      messageId: data?.id,
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 })
  }
}
