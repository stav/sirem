# Email Subscription/Unsubscription System - Current State Documentation

## Overview

This document details how the email campaign subscription and unsubscription system currently works, including all database tables, fields, components, and logic involved.

## Database Schema

### 1. `email_unsubscribes` Table
**Purpose**: Primary tracking table for unsubscribed email addresses. This is the **main filter** used to exclude emails from campaigns.

**Fields**:
- `id` (UUID, Primary Key)
- `created_at` (TIMESTAMP WITH TIME ZONE) - When the unsubscribe occurred
- `email_address` (TEXT, NOT NULL) - The unsubscribed email address (indexed)
- `contact_id` (UUID, nullable) - Reference to contacts table if email matches a contact
- `reason` (TEXT, nullable) - Optional reason for unsubscribing
- `source` (TEXT, default 'link') - How unsubscribe was initiated: 'link', 'webhook_complaint', 'manual', etc.
- `ip_address` (TEXT, nullable) - IP address for audit trail
- `user_agent` (TEXT, nullable) - User agent for audit trail
- `metadata` (JSONB) - Additional metadata

**Indexes**:
- `idx_email_unsubscribes_email` - Fast lookup by email address
- `idx_email_unsubscribes_contact_id` - Fast lookup by contact
- `idx_email_unsubscribes_created_at` - For time-based queries

**Key Point**: This table is the **PRIMARY FILTER** - if an email exists here, it's excluded from all campaigns.

### 2. `contacts` Table
**Relevant Fields**:
- `id` (UUID, Primary Key)
- `email` (TEXT, nullable) - Primary email address
- `inactive` (BOOLEAN, default false) - General contact inactive flag

**Usage**: When someone unsubscribes and their email matches `contacts.email`, the contact's `inactive` field is set to `true`. However, this is a **general inactive flag**, not email-specific.

**Limitation**: The `contacts` table only has one `inactive` boolean. If a contact has multiple email addresses, marking the contact inactive affects all emails, not just the unsubscribed one.

### 3. `emails` Table
**Relevant Fields**:
- `id` (UUID, Primary Key)
- `contact_id` (UUID, Foreign Key to contacts)
- `email_address` (TEXT, NOT NULL) - Additional email addresses for a contact
- `inactive` (BOOLEAN, default false) - Email-specific inactive flag

**Usage**: When someone unsubscribes, if the email exists in the `emails` table, that specific email record's `inactive` field is set to `true`. This allows per-email subscription control.

**Key Point**: This table supports multiple email addresses per contact, each with its own inactive status.

### 4. `campaign_recipients` Table
**Relevant Fields**:
- `id` (UUID, Primary Key)
- `campaign_id` (UUID, Foreign Key to campaigns)
- `contact_id` (UUID, Foreign Key to contacts)
- `email_address` (TEXT, NOT NULL) - The email address for this recipient
- `enabled` (BOOLEAN, default true) - Per-campaign enable/disable flag

**Usage**: This is a **per-campaign** flag that allows users to manually enable/disable recipients before sending. This is **NOT related to global subscription status** - it's only for campaign-specific control.

**Key Point**: `enabled` is campaign-specific, not a global subscription status.

## Unsubscribe Flow

### When Someone Unsubscribes

1. **User clicks unsubscribe link** or email client shows unsubscribe button (via List-Unsubscribe header)
2. **Request goes to** `/api/unsubscribe?email=user@example.com`
3. **Unsubscribe endpoint** (`src/app/api/unsubscribe/route.ts`):
   - Checks if email already exists in `email_unsubscribes` (idempotent)
   - Finds contact by email (checks `contacts.email` first, then `emails.email_address`)
   - **Records unsubscribe** in `email_unsubscribes` table with:
     - Email address
     - Contact ID (if found)
     - Source: 'link'
     - IP address and user agent (for audit trail)
   - **Marks contact/email as inactive**:
     - If email matches `contacts.email`, sets `contacts.inactive = true`
     - If email exists in `emails` table, sets `emails.inactive = true` for that specific email
   - Returns success page

### Webhook Unsubscribe (Spam Complaints)

1. **Resend webhook** receives `email.complained` event (spam complaint)
2. **Webhook handler** (`src/app/api/webhooks/resend/route.ts`):
   - Extracts email from webhook data
   - Calls `unsubscribeEmail()` function with source: 'webhook_complaint'
   - Same logic as manual unsubscribe, but source is 'webhook_complaint'

## Campaign Filtering Logic

### When Creating a Campaign

**Function**: `extractEmailAddresses()` in `src/lib/email-service.ts`

**Filtering Steps** (in order):
1. **Skip inactive contacts**: If `contact.inactive === true`, exclude entire contact
2. **Check main email field** (`contacts.email`):
   - Must be valid email format
   - Must not be in `email_unsubscribes` table
   - Must not be duplicate (deduplication)
3. **Check emails table** (`emails.email_address`):
   - Must be valid email format
   - Must have `inactive = false`
   - Must not be in `email_unsubscribes` table
   - Must not be duplicate

**Key Point**: The `email_unsubscribes` table is checked **first** and is the primary filter. Even if a contact is active and email is valid, if it's in `email_unsubscribes`, it's excluded.

### When Sending a Campaign

**Function**: `sendCampaign()` in `src/hooks/useCampaigns.ts`

**Additional Filtering**:
1. **Filter by enabled status**: Only recipients where `campaign_recipients.enabled !== false`
2. **Filter by unsubscribe status**: Check `email_unsubscribes` table again (in case someone unsubscribed after campaign was created)

**Key Point**: Even if a recipient was added to a campaign, if they unsubscribe before sending, they're filtered out.

## Components and Code Locations

### API Endpoints

1. **`/api/unsubscribe`** (`src/app/api/unsubscribe/route.ts`)
   - Handles manual unsubscribe requests
   - Records in `email_unsubscribes`
   - Marks contacts/emails as inactive
   - Returns HTML confirmation page

2. **`/api/webhooks/resend`** (`src/app/api/webhooks/resend/route.ts`)
   - Handles Resend webhook events
   - Processes spam complaints as unsubscribes
   - Uses same `unsubscribeEmail()` logic

3. **`/api/send-email`** (`src/app/api/send-email/route.ts`)
   - Sends individual emails via Resend
   - Adds `List-Unsubscribe` headers for email client compliance
   - Includes unsubscribe links in email templates

### Core Functions

1. **`getUnsubscribedEmails()`** (`src/lib/email-service.ts`)
   - Fetches all email addresses from `email_unsubscribes` table
   - Returns as a Set for fast lookups
   - Used by filtering logic

2. **`extractEmailAddresses()`** (`src/lib/email-service.ts`)
   - Main filtering function for campaign creation
   - Filters out inactive contacts, inactive emails, and unsubscribed emails
   - Returns array of valid `EmailRecipient` objects

3. **`getUnsubscribeUrl()`** (`src/lib/email-service.ts`)
   - Generates unsubscribe URL for email templates
   - Uses hardcoded production domain

### UI Components

1. **Campaign Creation** (`src/components/CampaignFromFilter.tsx`)
   - Shows filtered contacts
   - Currently shows all contacts with emails (doesn't pre-filter)
   - Actual filtering happens in `extractEmailAddresses()` during campaign creation

2. **Campaign Management** (`src/app/campaigns/page.tsx`)
   - Shows campaign recipients
   - Allows toggling `campaign_recipients.enabled` per recipient
   - Shows campaign statistics

3. **Email Templates** (`src/emails/DefaultTemplate.tsx`)
   - Includes unsubscribe links in footer
   - Uses `getUnsubscribeUrl()` for links

## Current Issues and Limitations

### 1. Multiple Sources of Truth
The system uses **three separate mechanisms** to track subscription status:
- `email_unsubscribes` table (PRIMARY - checked first)
- `contacts.inactive` (general flag, not email-specific)
- `emails.inactive` (email-specific, but only for emails in emails table)

**Problem**: This creates confusion about which field controls subscription status.

### 2. Contact Inactive Flag is Too Broad
When someone unsubscribes via their primary email (`contacts.email`), the entire contact is marked inactive. This affects:
- All email addresses for that contact
- Other contact-related functionality (not just email campaigns)

**Problem**: Unsubscribing from emails shouldn't make the entire contact inactive.

### 3. No Easy Resubscribe Mechanism
To resubscribe someone, you need to:
1. Delete from `email_unsubscribes` table
2. Set `contacts.inactive = false` (if it was set)
3. Set `emails.inactive = false` (if it was set)

**Problem**: No UI or simple function to resubscribe. Requires manual SQL or multiple operations.

### 4. UI Doesn't Show Filtering Status
The campaign creation UI shows all contacts with emails, but doesn't indicate which will be filtered out. Users see 3 recipients but only 1 makes it to the campaign.

**Problem**: No visibility into why recipients are excluded.

### 5. `campaign_recipients.enabled` Confusion
This field is per-campaign and unrelated to global subscription status, but the naming suggests it might be related.

**Problem**: Potential confusion about what "enabled" means.

## Do We Need `email_unsubscribes` Table?

### Arguments FOR Keeping It:

1. **Audit Trail**: Provides historical record of when someone unsubscribed, from what IP, using what user agent
2. **Compliance**: Legal/compliance requirements may require keeping unsubscribe records
3. **Source Tracking**: Tracks HOW someone unsubscribed (link, webhook, manual)
4. **Timestamp**: Knows exactly when unsubscribe occurred
5. **Email-Only Tracking**: Can track unsubscribes for emails that don't match any contact
6. **Multiple Unsubscribes**: Can track if someone unsubscribes multiple times (though currently idempotent)

### Arguments AGAINST (Using Only Contact/Email Records):

1. **Simplicity**: Fewer tables to manage
2. **Single Source of Truth**: Just check `contacts.inactive` or `emails.inactive`
3. **Less Code**: No need to query separate table
4. **Direct Updates**: Can update contact/email directly without managing separate table

### Recommendation:

**Keep the `email_unsubscribes` table** for these reasons:
- Compliance and audit trail requirements
- Ability to track unsubscribes for emails not in contacts table
- Historical tracking (when, how, from where)
- Legal protection (proof of unsubscribe requests)

However, **simplify the system** by:
- Making `email_unsubscribes` the ONLY source of truth for subscription status
- Remove the need to update `contacts.inactive` and `emails.inactive` for unsubscribes
- Use `contacts.inactive` and `emails.inactive` only for other business logic (not email subscriptions)
- Add a simple resubscribe function that just deletes from `email_unsubscribes`

## Summary

### Current Flow:
1. User unsubscribes → Recorded in `email_unsubscribes` + `contacts.inactive`/`emails.inactive` set
2. Campaign creation → Filters by `email_unsubscribes` table (PRIMARY) + inactive flags
3. Campaign sending → Filters by `email_unsubscribes` table again + `campaign_recipients.enabled`

### Key Tables:
- **`email_unsubscribes`**: PRIMARY filter for subscription status
- **`contacts.inactive`**: General contact flag (too broad for email subscriptions)
- **`emails.inactive`**: Email-specific flag (only for emails table entries)
- **`campaign_recipients.enabled`**: Per-campaign flag (not related to subscription)

### Main Problem:
Too many sources of truth, making it confusing and difficult to resubscribe someone.
