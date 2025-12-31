import { Body, Container, Head, Heading, Html, Link, Preview, Text, Section } from '@react-email/components'
import * as React from 'react'
import { getUnsubscribeUrl } from '@/lib/email-service'

interface DefaultTemplateProps {
  heading?: string
  content?: string
  ctaText?: string
  ctaUrl?: string
  recipientEmail?: string
}

// Company information - hardcoded for email footer compliance
const COMPANY_NAME = 'Medstar Senior Benefits'
const COMPANY_ADDRESS = '7387 Pine Ridge Court, Cleveland, Ohio'
const COMPANY_CONTACT_EMAIL = 'support@medstar.agency'
const PRIVACY_POLICY_URL = 'https://medstar.agency/privacy'

export const DefaultTemplate = ({
  heading = 'Hello there',
  content = 'We have some news for you.',
  ctaText,
  ctaUrl,
  recipientEmail,
}: DefaultTemplateProps) => {
  // Convert line breaks to <br /> tags for HTML rendering
  const htmlContent = content.replace(/\n/g, '<br />')

  // Generate unsubscribe URL using shared utility (uses hardcoded production domain)
  const finalUnsubscribeUrl = getUnsubscribeUrl(recipientEmail)

  return (
    <Html>
      <Head />
      <Preview>{heading}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{heading}</Heading>
          {/* Use Text component with dangerouslySetInnerHTML to render HTML content */}
          {/* This is safe here because content comes from admin-controlled campaign creation */}
          <Text style={text} dangerouslySetInnerHTML={{ __html: htmlContent }} />

          {ctaText && ctaUrl && (
            <Section style={btnContainer}>
              <Link href={ctaUrl} style={button}>
                {ctaText}
              </Link>
            </Section>
          )}

          {/* Compliant Email Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>
              <Link href={finalUnsubscribeUrl} style={unsubscribeLink}>
                Unsubscribe
              </Link>
              {' | '}
              <Link href={PRIVACY_POLICY_URL} style={footerLink}>
                Privacy Policy
              </Link>
              {' | '}
              <Link href={`mailto:${COMPANY_CONTACT_EMAIL}`} style={footerLink}>
                Contact Us
              </Link>
            </Text>

            <Text style={footerText}>
              <strong>{COMPANY_NAME}</strong>
            </Text>

            <Text style={footerText}>{COMPANY_ADDRESS}</Text>

            <Text style={footerDisclaimer}>
              You received this email because you are subscribed to our mailing list. If you no longer wish to receive
              these emails, please{' '}
              <Link href={finalUnsubscribeUrl} style={unsubscribeLink}>
                unsubscribe here
              </Link>
              .
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default DefaultTemplate

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
}

const h1 = {
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  lineHeight: '1.25',
}

const text = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
}

const btnContainer = {
  textAlign: 'center' as const,
  margin: '26px 0',
}

const button = {
  backgroundColor: '#000000',
  borderRadius: '4px',
  color: '#ffffff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '12px 0',
}

const footerSection = {
  marginTop: '48px',
  paddingTop: '24px',
  borderTop: '1px solid #e2e8f0',
}

const footerText = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '8px 0',
  textAlign: 'center' as const,
}

const footerLink = {
  color: '#4299e1',
  textDecoration: 'underline',
}

const unsubscribeLink = {
  color: '#4299e1',
  textDecoration: 'underline',
  fontWeight: 'bold',
}

const footerDisclaimer = {
  color: '#8898aa',
  fontSize: '11px',
  lineHeight: '16px',
  margin: '16px 0 0',
  textAlign: 'center' as const,
  fontStyle: 'italic',
}
