# Email Campaign System Setup Guide

## ✅ Current Status
The email campaign system is now **fully implemented and running**! The system includes:
- Campaign management interface at `/campaigns`
- Contact filtering integration on `/manage`
- Email template system with personalization
- Automatic unsubscribe handling
- List-Unsubscribe headers for email client compliance
- Campaign scheduling and tracking
- Professional UI integrated with your existing design

## 🚀 Features

### Campaign Management
- Create campaigns from filtered contacts
- Schedule campaigns for future delivery
- Track campaign status (draft, scheduled, sending, sent, cancelled)
- View and manage campaign recipients
- Enable/disable individual recipients before sending

### Email Templates
- **Default Template**: Pre-designed responsive template with heading, content, and CTA button
- **Custom HTML/Text**: Full control over email content
- **Personalization**: Dynamic content using placeholders

### Unsubscribe System
- Automatic filtering of unsubscribed emails
- Unsubscribe links in all emails
- List-Unsubscribe headers for email client compliance
- Audit trail of unsubscribe requests
- Automatic contact/email deactivation

## 📧 To Enable Email Sending

### 1. Get Resend API Key
1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Navigate to API Keys section
4. Create a new API key (starts with `re_`)

### 2. Configure Environment Variables
Add to your `.env.local` file:
```bash
# Email Service Configuration
RESEND_API_KEY=re_your-actual-api-key-here
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_REPLY_TO_EMAIL=support@yourdomain.com
```

### 3. Configure Domain (Required for Production)
Resend's production API requires a verified domain:
1. Go to [resend.com/domains](https://resend.com/domains)
2. Add and verify your domain
3. Update your `.env.local` to use your verified domain:
   ```bash
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   ```

**Note:** Without a verified domain, Resend only allows sending test emails to your own verified email address (configured in your Resend account).

### 4. Run Database Migrations
Execute these SQL migrations in your Supabase SQL editor (in order):
- `data/schema/21-add-email-campaigns.sql` - Creates campaigns and campaign_recipients tables
- `data/schema/22-add-campaign-recipient-enabled.sql` - Adds enabled flag to recipients
- `data/schema/23-add-email-unsubscribes.sql` - Creates unsubscribe tracking table

**Important**: All three migrations must be run for the system to work properly.

## 🎯 How to Use

### Create Campaigns from Filtered Contacts
1. Go to **Manage** page (`/manage`)
2. **Filter your contacts** (e.g., `t:priority`, `s:active`, `30` for T65)
3. **Click the email icon** (📧) that appears
4. **Create your campaign** with personalized content
5. **Send immediately** or schedule for later

### Use the Campaigns Page
1. Go to **Campaigns** page (`/campaigns`)
2. Click **"Create Campaign"**
3. Design your email with personalization
4. Schedule or send immediately

### Email Personalization
Use these placeholders in your email content (both HTML and text):

**Name Fields:**
- `{{firstName}}` - Contact's first name
- `{{lastName}}` - Contact's last name
- `{{middleName}}` - Contact's middle name
- `{{fullName}}` - Full name (prefix + first + middle + last + suffix)
- `{{prefix}}` - Name prefix (Mr., Mrs., Dr., etc.)
- `{{suffix}}` - Name suffix (Jr., Sr., III, etc.)

**Contact Fields:**
- `{{email}}` - Contact's email address
- `{{phone}}` - Contact's phone number

**Address Fields:**
- `{{address1}}` - Street address line 1
- `{{address2}}` - Street address line 2
- `{{streetAddress}}` - Combined address1 and address2
- `{{city}}` - City
- `{{state}}` - State code
- `{{postalCode}}` or `{{zipCode}}` - Postal/ZIP code
- `{{county}}` - County
- `{{fullAddress}}` - Formatted full address

**Fallback Variants:**
- `{{firstName|fallback}}` - First name or "Valued Customer"
- `{{fullName|fallback}}` - Full name or "Valued Customer"

## 📧 Unsubscribe System

### How It Works

The system automatically handles unsubscribes to ensure compliance with email regulations:

1. **Unsubscribe Links**: Every email includes unsubscribe links in the footer
2. **List-Unsubscribe Headers**: All emails include RFC 2369 compliant headers that allow email clients (Gmail, Outlook, etc.) to show an "Unsubscribe" button
3. **Automatic Filtering**: When creating campaigns, unsubscribed emails are automatically excluded
4. **Database Tracking**: All unsubscribe requests are recorded in the `email_unsubscribes` table with:
   - Email address
   - Associated contact (if found)
   - Source (link, webhook, manual, etc.)
   - IP address and user agent (for audit trail)
   - Timestamp

### Unsubscribe Endpoint

Users can unsubscribe via:
- **Direct link**: `/api/unsubscribe?email=user@example.com`
- **Email client button**: When email clients detect the `List-Unsubscribe` header, they show an unsubscribe button that links to this endpoint
- **Manual entry**: If no email is provided, users can enter their email address on the unsubscribe page

### What Happens When Someone Unsubscribes

1. Unsubscribe request is recorded in `email_unsubscribes` table
2. If the email matches a contact:
   - The contact's primary email is marked as inactive (if it matches)
   - The specific email address is marked as inactive in the `emails` table
3. Future campaigns automatically exclude this email address
4. User sees a confirmation page

### Filtering Logic

When creating or sending campaigns, the system automatically:
- Excludes inactive contacts
- Excludes inactive email addresses
- Excludes all emails in the `email_unsubscribes` table
- Only includes enabled recipients (if recipient is disabled in campaign)

This ensures compliance and prevents sending to unsubscribed users.

## 🔧 Current Limitations

**Without a verified domain**, Resend only allows sending emails to your own verified email address. To send to any recipient:
1. You must verify a domain in Resend
2. Use that domain in your `RESEND_FROM_EMAIL` configuration

**Rate Limits**: Resend has a rate limit of 2 requests per second. The system automatically adds delays between emails (600ms) to stay under this limit.

## 🎉 Next Steps

1. **Set up Resend API key** (5 minutes)
2. **Run all database migrations** (2 minutes)
3. **Verify your domain** (if sending to external recipients)
4. **Start creating campaigns!**

The system is production-ready and will work immediately once you add the API key and run the migrations!

## 📚 Technical Details

### Email Sending
- Uses Resend's transactional email API
- Sends emails individually for personalization
- Includes both HTML and plain text versions
- Rate limited to 2 requests/second (600ms delay between emails)

### Templates
- Default template uses React Email components
- Supports custom HTML/text content
- All templates include unsubscribe links and compliance footer

### Database Schema
- `campaigns`: Stores campaign metadata and status
- `campaign_recipients`: Tracks individual recipient status and delivery
- `email_unsubscribes`: Tracks all unsubscribe requests for compliance
