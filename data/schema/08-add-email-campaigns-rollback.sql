-- Rollback script for 08-add-email-campaigns.sql
-- Run this in your Supabase SQL editor to undo the email campaigns migration

-- Drop triggers first
DROP TRIGGER IF EXISTS update_convertkit_subscribers_updated_at ON convertkit_subscribers;
DROP TRIGGER IF EXISTS update_email_campaigns_updated_at ON email_campaigns;

-- Drop the function (only if no other triggers use it)
-- DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS campaign_subscribers CASCADE;
DROP TABLE IF EXISTS convertkit_subscribers CASCADE;
DROP TABLE IF EXISTS email_campaigns CASCADE;

-- Drop indexes (they should be dropped with the tables, but just in case)
DROP INDEX IF EXISTS idx_campaign_subscribers_campaign_id;
DROP INDEX IF EXISTS idx_campaign_subscribers_contact_id;
DROP INDEX IF EXISTS idx_campaign_subscribers_status;
DROP INDEX IF EXISTS idx_convertkit_subscribers_email;
DROP INDEX IF EXISTS idx_convertkit_subscribers_contact_id;
DROP INDEX IF EXISTS idx_convertkit_subscribers_state;
DROP INDEX IF EXISTS idx_email_campaigns_status;
DROP INDEX IF EXISTS idx_email_campaigns_scheduled_at;
DROP INDEX IF EXISTS idx_email_campaigns_sent_at;

-- Note: RLS policies are automatically dropped when tables are dropped 
