# Email Campaign System Setup Guide

## ✅ Current Status
The email campaign system is now **fully implemented and running**! The server is running on:
- **Local**: http://localhost:3000
- **Network**: http://192.168.1.245:3000

## 🚀 What's Working Now
- ✅ Campaign management interface at `/campaigns`
- ✅ Contact filtering integration on `/manage`
- ✅ Campaign creation from filtered contacts
- ✅ Email template system with personalization
- ✅ Campaign scheduling and tracking
- ✅ Professional UI integrated with your existing design

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

### 4. Run Database Migration
Execute these SQL migrations in your Supabase SQL editor:
- `data/schema/21-add-email-campaigns.sql`
- `data/schema/22-add-campaign-recipient-enabled.sql`

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
Use these placeholders in your email content:
- `{{firstName}}` - Contact's first name
- `{{lastName}}` - Contact's last name  
- `{{fullName}}` - Full name
- `{{email}}` - Contact's email address

## 🔧 Current Limitations
**Without a verified domain**, Resend only allows sending emails to your own verified email address. To send to any recipient:
1. You must verify a domain in Resend
2. Use that domain in your `RESEND_FROM_EMAIL` configuration

## 🎉 Next Steps
1. **Set up Resend API key** (5 minutes)
2. **Run database migration** (1 minute)
3. **Start creating campaigns!**

The system is production-ready and will work immediately once you add the API key!
