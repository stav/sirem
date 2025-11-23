import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { DefaultTemplate } from '@/emails/DefaultTemplate'
import { render } from '@react-email/render'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, text, templateName, templateProps } = await request.json()
    const baseUrl = request.nextUrl.origin

    let htmlContent = html
    let textContent = text

    // If a template is requested, render it
    if (templateName === 'DefaultTemplate') {
        // Get recipient email (handle both array and single string)
        const recipientEmail = Array.isArray(to) && to.length > 0 ? to[0] : (typeof to === 'string' ? to : '')
        
        // Pass recipient email and baseUrl to template (company info is hardcoded in template)
        const finalTemplateProps = {
          ...templateProps,
          recipientEmail,
          baseUrl,
        }
        const emailElement = DefaultTemplate(finalTemplateProps)
        htmlContent = await render(emailElement)
        textContent = await render(emailElement, { plainText: true })
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Email service not configured' },
        { status: 500 }
      )
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
      templateName: templateName || 'raw'
    })

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html: htmlContent,
      text: textContent,
      replyTo,
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
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
