-- Migration to add 'prepared' status to email_campaigns
-- Run this in your Supabase SQL editor

-- Drop the existing check constraint
ALTER TABLE email_campaigns DROP CONSTRAINT email_campaigns_status_check;

-- Add the new check constraint with 'prepared' status
ALTER TABLE email_campaigns ADD CONSTRAINT email_campaigns_status_check 
  CHECK (status IN ('draft', 'scheduled', 'sending', 'prepared', 'sent', 'cancelled'));

-- Update existing campaigns stuck in 'sending' status to 'prepared'
UPDATE email_campaigns 
SET status = 'prepared' 
WHERE status = 'sending'; 
