// Resend is used in the API route, not directly in this service

export interface EmailRecipient {
  email: string
  firstName?: string | null
  lastName?: string | null
  middleName?: string | null
  prefix?: string | null
  suffix?: string | null
  phone?: string | null
  // Address fields (using primary address if multiple exist)
  address1?: string | null
  address2?: string | null
  city?: string | null
  state?: string | null
  postalCode?: string | null
  county?: string | null
  // Full address string (formatted)
  fullAddress?: string | null
}

export interface EmailTemplate {
  subject: string
  htmlContent?: string
  textContent?: string
  templateName?: string
  templateProps?: Record<string, unknown>
}

export interface SendEmailOptions {
  to: EmailRecipient[]
  subject: string
  htmlContent?: string
  textContent?: string
  templateName?: string
  templateProps?: Record<string, unknown>
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
    const payload: Record<string, unknown> = {
      to: options.to.map(recipient => recipient.email),
      subject: options.subject,
      html: options.htmlContent,
      text: options.textContent,
      templateName: options.templateName,
      templateProps: options.templateProps,
    }
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const result = await response.json()

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to send email'
      }
    }

    return {
      success: true,
      messageId: result.messageId
    }
  } catch (error) {
    console.error('Email sending error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

export interface EmailResult {
  email: string
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send bulk emails with rate limiting and personalization
 */
export async function sendBulkEmails(
  recipients: EmailRecipient[],
  template: EmailTemplate,
  batchSize: number = 10,
  delayMs: number = 1000
): Promise<{ success: number; failed: number; errors: string[]; results: EmailResult[] }> {
  let successCount = 0
  let failedCount = 0
  const errors: string[] = []
  const results: EmailResult[] = []

  // Process recipients individually for personalization
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize)
    
    // Send each email individually with personalization
    for (const recipient of batch) {
      // Personalize the content for this recipient
      let personalizedHtmlContent = template.htmlContent
      let personalizedTextContent = template.textContent
      let personalizedSubject = template.subject
      let personalizedProps = template.templateProps

      // Handle string template replacement
      if (template.htmlContent) {
         personalizedHtmlContent = createPersonalizedTemplate(
          template.htmlContent,
          recipient
        )
      }

      if (template.textContent || template.htmlContent) {
        personalizedTextContent = createPersonalizedTemplate(
          template.textContent || template.htmlContent || '',
          recipient
        )
      }

      personalizedSubject = createPersonalizedTemplate(
        template.subject,
        recipient
      )
      
      // Handle React Email props replacement (basic string replacement in values)
      if (template.templateProps) {
        personalizedProps = JSON.parse(
          createPersonalizedTemplate(JSON.stringify(template.templateProps), recipient)
        )
      }
      
      // Send single personalized email
      console.log('Sending campaign email', {
        to: recipient.email,
        template: template.templateName || 'custom-html'
      })
      const result = await sendEmail({
        to: [recipient],
        subject: personalizedSubject,
        htmlContent: personalizedHtmlContent,
        textContent: personalizedTextContent,
        templateName: template.templateName,
        templateProps: personalizedProps
      })

      const emailResult: EmailResult = {
        email: recipient.email,
        success: result.success,
        messageId: result.messageId,
        error: result.error
      }
      results.push(emailResult)

      if (result.success) {
        successCount += 1
      } else {
        failedCount += 1
        errors.push(`${recipient.email}: ${result.error}`)
      }
    }

    // Add delay between batches to respect rate limits
    if (i + batchSize < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  return { success: successCount, failed: failedCount, errors, results }
}

/**
 * Create a personalized email template with contact data
 */
export function createPersonalizedTemplate(
  template: string,
  contact: EmailRecipient
): string {
  let personalizedTemplate = template

  // Build full name with all components
  const nameParts: string[] = []
  if (contact.prefix) nameParts.push(contact.prefix)
  if (contact.firstName) nameParts.push(contact.firstName)
  if (contact.middleName) nameParts.push(contact.middleName)
  if (contact.lastName) nameParts.push(contact.lastName)
  if (contact.suffix) nameParts.push(contact.suffix)
  const fullName = nameParts.join(' ').trim()
  const firstNameLastName = `${contact.firstName || ''} ${contact.lastName || ''}`.trim()

  // Build full address string if address components exist
  const addressParts: string[] = []
  if (contact.address1) addressParts.push(contact.address1)
  if (contact.address2) addressParts.push(contact.address2)
  const streetAddress = addressParts.join(', ').trim()
  
  const cityStateZipParts: string[] = []
  if (contact.city) cityStateZipParts.push(contact.city)
  if (contact.state) cityStateZipParts.push(contact.state)
  if (contact.postalCode) cityStateZipParts.push(contact.postalCode)
  const cityStateZip = cityStateZipParts.join(', ').trim()
  
  const fullAddress = [streetAddress, cityStateZip].filter(Boolean).join('\n').trim() || contact.fullAddress || ''

  // Replace common placeholders
  const replacements: Record<string, string> = {
    // Name fields
    '{{firstName}}': contact.firstName || '',
    '{{lastName}}': contact.lastName || '',
    '{{middleName}}': contact.middleName || '',
    '{{prefix}}': contact.prefix || '',
    '{{suffix}}': contact.suffix || '',
    '{{fullName}}': fullName || firstNameLastName,
    // Contact fields
    '{{email}}': contact.email || '',
    '{{phone}}': contact.phone || '',
    // Address fields
    '{{address1}}': contact.address1 || '',
    '{{address2}}': contact.address2 || '',
    '{{streetAddress}}': streetAddress,
    '{{city}}': contact.city || '',
    '{{state}}': contact.state || '',
    '{{postalCode}}': contact.postalCode || '',
    '{{zipCode}}': contact.postalCode || '', // Alias for postalCode
    '{{county}}': contact.county || '',
    '{{fullAddress}}': fullAddress,
    // Fallback variants
    '{{firstName|fallback}}': contact.firstName || 'Valued Customer',
    '{{lastName|fallback}}': contact.lastName || '',
    '{{fullName|fallback}}': fullName || firstNameLastName || 'Valued Customer',
  }

  // Apply replacements (escape special regex characters in placeholders)
  Object.entries(replacements).forEach(([placeholder, value]) => {
    const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    personalizedTemplate = personalizedTemplate.replace(new RegExp(escapedPlaceholder, 'g'), value)
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
export function extractEmailAddresses(contacts: Array<{
  email?: string | null
  first_name?: string | null
  last_name?: string | null
  emails?: Array<{
    email_address?: string
    inactive?: boolean
  }>
}>): EmailRecipient[] {
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
      contact.emails.forEach((emailRecord) => {
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
