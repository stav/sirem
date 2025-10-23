import { Resend } from 'resend'

// Initialize Resend with API key from environment variables
// Use a fallback key to prevent errors during development
const resend = new Resend(process.env.RESEND_API_KEY || 're_fallback_key_for_development')

export interface EmailRecipient {
  email: string
  firstName?: string
  lastName?: string
}

export interface EmailTemplate {
  subject: string
  htmlContent: string
  textContent: string
}

export interface SendEmailOptions {
  to: EmailRecipient[]
  from: string
  subject: string
  htmlContent: string
  textContent?: string
  replyTo?: string
  tags?: Array<{ name: string; value: string }>
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send a single email using Resend API
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  try {
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_fallback_key_for_development') {
      console.warn('RESEND_API_KEY not configured. Email sending is disabled.')
      return {
        success: false,
        error: 'Email service not configured. Please set RESEND_API_KEY environment variable.'
      }
    }

    const { data, error } = await resend.emails.send({
      from: options.from,
      to: options.to.map(recipient => recipient.email),
      subject: options.subject,
      html: options.htmlContent,
      text: options.textContent,
      reply_to: options.replyTo,
      tags: options.tags,
    })

    if (error) {
      console.error('Resend API error:', error)
      return {
        success: false,
        error: error.message || 'Failed to send email'
      }
    }

    return {
      success: true,
      messageId: data?.id
    }
  } catch (error) {
    console.error('Email sending error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Send bulk emails with rate limiting to avoid hitting API limits
 */
export async function sendBulkEmails(
  recipients: EmailRecipient[],
  template: EmailTemplate,
  from: string,
  batchSize: number = 10,
  delayMs: number = 1000
): Promise<{ success: number; failed: number; errors: string[] }> {
  // Check if API key is configured
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_fallback_key_for_development') {
    console.warn('RESEND_API_KEY not configured. Bulk email sending is disabled.')
    return {
      success: 0,
      failed: recipients.length,
      errors: ['Email service not configured. Please set RESEND_API_KEY environment variable.']
    }
  }

  let successCount = 0
  let failedCount = 0
  const errors: string[] = []

  // Process recipients in batches
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize)
    
    // Send batch
    const result = await sendEmail({
      to: batch,
      from,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent
    })

    if (result.success) {
      successCount += batch.length
    } else {
      failedCount += batch.length
      errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${result.error}`)
    }

    // Add delay between batches to respect rate limits
    if (i + batchSize < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  return { success: successCount, failed: failedCount, errors }
}

/**
 * Create a personalized email template with contact data
 */
export function createPersonalizedTemplate(
  template: string,
  contact: {
    firstName?: string
    lastName?: string
    email?: string
    [key: string]: any
  }
): string {
  let personalizedTemplate = template

  // Replace common placeholders
  const replacements: Record<string, string> = {
    '{{firstName}}': contact.firstName || '',
    '{{lastName}}': contact.lastName || '',
    '{{fullName}}': `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
    '{{email}}': contact.email || '',
    '{{firstName|fallback}}': contact.firstName || 'Valued Customer',
    '{{lastName|fallback}}': contact.lastName || '',
  }

  // Apply replacements
  Object.entries(replacements).forEach(([placeholder, value]) => {
    personalizedTemplate = personalizedTemplate.replace(new RegExp(placeholder, 'g'), value)
  })

  return personalizedTemplate
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Extract email addresses from contact data
 */
export function extractEmailAddresses(contacts: any[]): EmailRecipient[] {
  const recipients: EmailRecipient[] = []
  const seenEmails = new Set<string>()

  contacts.forEach(contact => {
    // Check main email field
    if (contact.email && isValidEmail(contact.email) && !seenEmails.has(contact.email)) {
      recipients.push({
        email: contact.email,
        firstName: contact.first_name,
        lastName: contact.last_name
      })
      seenEmails.add(contact.email)
    }

    // Check emails from related emails table
    if (contact.emails && Array.isArray(contact.emails)) {
      contact.emails.forEach((emailRecord: any) => {
        if (emailRecord.email_address && 
            isValidEmail(emailRecord.email_address) && 
            !emailRecord.inactive &&
            !seenEmails.has(emailRecord.email_address)) {
          recipients.push({
            email: emailRecord.email_address,
            firstName: contact.first_name,
            lastName: contact.last_name
          })
          seenEmails.add(emailRecord.email_address)
        }
      })
    }
  })

  return recipients
}

/**
 * Get default email configuration
 */
export function getDefaultEmailConfig() {
  return {
    from: process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com',
    replyTo: process.env.RESEND_REPLY_TO_EMAIL || 'support@yourdomain.com'
  }
}
