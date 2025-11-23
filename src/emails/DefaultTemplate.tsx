import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
} from '@react-email/components'
import * as React from 'react'

interface DefaultTemplateProps {
  heading?: string;
  content?: string;
  ctaText?: string;
  ctaUrl?: string;
  recipientEmail?: string;
  baseUrl?: string;
  companyName?: string;
  companyAddress?: string;
  companyContactEmail?: string;
  privacyPolicyUrl?: string;
  unsubscribeUrl?: string;
}

export const DefaultTemplate = ({
  heading = 'Hello there',
  content = 'We have some news for you.',
  ctaText,
  ctaUrl,
  recipientEmail,
  baseUrl,
  companyName,
  companyAddress,
  companyContactEmail,
  privacyPolicyUrl,
  unsubscribeUrl,
}: DefaultTemplateProps) => {
  // Convert line breaks to <br /> tags for HTML rendering
  const htmlContent = content.replace(/\n/g, '<br />')

  // Generate unsubscribe URL if recipient email is provided
  // baseUrl comes from the request origin (localhost, preview, staging, production)
  const finalBaseUrl = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com'
  const finalUnsubscribeUrl = unsubscribeUrl || (recipientEmail 
    ? `${finalBaseUrl}/api/unsubscribe?email=${encodeURIComponent(recipientEmail)}`
    : `${finalBaseUrl}/api/unsubscribe`)

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
              {privacyPolicyUrl && (
                <>
                  <Link href={privacyPolicyUrl} style={footerLink}>
                    Privacy Policy
                  </Link>
                  {' | '}
                </>
              )}
              {companyContactEmail && (
                <Link href={`mailto:${companyContactEmail}`} style={footerLink}>
                  Contact Us
                </Link>
              )}
            </Text>
            
            {companyName && (
              <Text style={footerText}>
                <strong>{companyName}</strong>
              </Text>
            )}
            
            {companyAddress && (
              <Text style={footerText}>
                {companyAddress}
              </Text>
            )}
            
            <Text style={footerDisclaimer}>
              You received this email because you are subscribed to our mailing list.
              If you no longer wish to receive these emails, please{' '}
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
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
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

