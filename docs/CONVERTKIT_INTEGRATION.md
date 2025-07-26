# ConvertKit Email Campaign Integration

This document outlines the ConvertKit email marketing integration for the Sirem CRM system.

## Overview

The ConvertKit integration allows you to create and manage email campaigns directly from your CRM, targeting contacts based on various criteria including tags, T65 days, and lead statuses.

## Features

### Email Campaign Management

- **Create Campaigns**: Build email campaigns with HTML content and targeting options
- **Target Contacts**: Filter recipients by tags, T65 days, and lead statuses
- **Schedule Campaigns**: Set future send dates for automated delivery
- **Track Performance**: Monitor open rates, click rates, and delivery status

### Contact Integration

- **Automatic Sync**: Contacts with email addresses are automatically synced to ConvertKit
- **Tag Management**: Apply ConvertKit tags to contacts for targeted campaigns
- **Subscriber Management**: Track subscription status and engagement

### Campaign Analytics

- **Real-time Stats**: View campaign performance metrics
- **Engagement Tracking**: Monitor opens, clicks, and bounces
- **Contact-level Data**: Track individual subscriber behavior

## Setup

### 1. ConvertKit Account Setup

1. Create a ConvertKit account at [convertkit.com](https://convertkit.com)
2. Get your API credentials from the ConvertKit dashboard
3. Create a form for collecting subscribers (optional)

### 2. Environment Configuration

Add the following environment variables to your `.env.local` file:

```bash
# ConvertKit Email Marketing Integration
CONVERTKIT_API_KEY=your-convertkit-api-key
CONVERTKIT_API_SECRET=your-convertkit-api-secret
CONVERTKIT_FORM_ID=your-default-form-id
CONVERTKIT_TAG_ID=your-default-tag-id
```

### 3. Database Migration

Run the email campaigns migration to create the necessary tables:

```sql
-- Run this in your Supabase SQL editor
-- See: data/schema/08-add-email-campaigns.sql
```

### 4. Install Dependencies

Install the required dependencies:

```bash
npm install @radix-ui/react-tabs
```

## Usage

### Creating a Campaign

1. Navigate to the **Campaigns** page in your CRM
2. Click **Create Campaign**
3. Fill in the campaign details:
   - **Name**: Campaign identifier
   - **Subject**: Email subject line
   - **Content**: HTML email content
   - **Plain Text**: Plain text version (optional)

### Targeting Options

#### T65 Days Targeting

- Target contacts turning 65 within a specified number of days
- Useful for Medicare-related campaigns
- Example: Set to 180 to target contacts turning 65 within 6 months

#### Tag-based Targeting

- Select specific tags to target contacts
- Multiple tags can be selected
- Contacts with any of the selected tags will be included

#### Lead Status Targeting

- Target contacts by their lead status
- Useful for different stages of the sales funnel
- Example: Target only "Hot Leads" or "New Prospects"

### Sending Campaigns

1. **Draft Mode**: Create and edit campaigns without sending
2. **Immediate Send**: Send campaigns right away
3. **Scheduled Send**: Set a future date and time for automatic delivery

### Monitoring Performance

After sending a campaign, you can view detailed statistics:

- **Total Recipients**: Number of contacts targeted
- **Sent**: Successfully delivered emails
- **Opened**: Emails that were opened
- **Clicked**: Links that were clicked
- **Bounced**: Failed deliveries

## Database Schema

### Email Campaigns Table

```sql
CREATE TABLE email_campaigns (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  plain_text_content TEXT,
  convertkit_campaign_id INTEGER,
  status TEXT DEFAULT 'draft',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  target_tags TEXT[],
  target_t65_days INTEGER,
  target_lead_statuses UUID[],
  -- ... other fields
);
```

### Campaign Subscribers Table

```sql
CREATE TABLE campaign_subscribers (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES email_campaigns(id),
  contact_id UUID REFERENCES contacts(id),
  convertkit_subscriber_id INTEGER,
  convertkit_email TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  -- ... other fields
);
```

### ConvertKit Subscribers Table

```sql
CREATE TABLE convertkit_subscribers (
  id UUID PRIMARY KEY,
  convertkit_id INTEGER UNIQUE NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  contact_id UUID REFERENCES contacts(id),
  state TEXT DEFAULT 'active',
  convertkit_tags TEXT[],
  -- ... other fields
);
```

## API Integration

### ConvertKit Service

The integration uses a custom ConvertKit service (`src/lib/convertkit.ts`) that provides:

- **Subscriber Management**: Create, update, and manage subscribers
- **Campaign Creation**: Create broadcasts and campaigns
- **Tag Management**: Apply and remove tags from subscribers
- **Analytics**: Retrieve campaign and subscriber statistics

### Key Methods

```typescript
// Create a subscriber
await convertkit.createSubscriber(email, firstName, lastName)

// Create a broadcast
await convertkit.createBroadcast(name, subject, content, tags)

// Send a broadcast
await convertkit.sendBroadcast(broadcastId)

// Sync contacts to ConvertKit
await convertkit.syncContactsToConvertKit()
```

## Best Practices

### Email Content

- Use responsive HTML templates
- Include plain text versions for better deliverability
- Keep subject lines under 50 characters
- Test campaigns before sending to large lists

### Targeting

- Use specific targeting to improve engagement
- Avoid sending to inactive contacts
- Segment campaigns by lead status and tags
- Consider T65 timing for Medicare-related content

### Compliance

- Ensure all contacts have opted in to email communications
- Include unsubscribe links in all emails
- Follow CAN-SPAM and GDPR requirements
- Maintain accurate subscriber lists

## Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Verify ConvertKit API credentials
   - Check network connectivity
   - Ensure API rate limits aren't exceeded

2. **Campaign Not Sending**
   - Verify campaign status is "draft"
   - Check that target contacts have valid email addresses
   - Ensure ConvertKit form ID is configured

3. **Low Engagement**
   - Review targeting criteria
   - Check email content quality
   - Verify sender reputation
   - Test with smaller segments first

### Support

For technical issues with the ConvertKit integration:

1. Check the browser console for error messages
2. Verify environment variables are set correctly
3. Ensure database tables are created properly
4. Test API connectivity using the ConvertKit dashboard

## Future Enhancements

Planned improvements for the ConvertKit integration:

- **A/B Testing**: Test different subject lines and content
- **Automation Workflows**: Create automated email sequences
- **Advanced Analytics**: More detailed reporting and insights
- **Template Library**: Pre-built email templates
- **Webhook Integration**: Real-time event tracking
- **Advanced Segmentation**: More sophisticated targeting options
