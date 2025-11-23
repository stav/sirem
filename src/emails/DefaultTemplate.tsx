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
}

export const DefaultTemplate = ({
  heading = 'Hello there',
  content = 'We have some news for you.',
  ctaText,
  ctaUrl,
}: DefaultTemplateProps) => {
  // Convert line breaks to <br /> tags for HTML rendering
  const htmlContent = content.replace(/\n/g, '<br />')

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
          
          <Text style={footer}>
            If you didn&apos;t request this email, you can ignore it.
          </Text>
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

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '22px',
  marginTop: '48px',
}

