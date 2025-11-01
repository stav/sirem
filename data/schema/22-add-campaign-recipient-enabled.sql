-- Migration to add enabled field to campaign_recipients
-- This allows users to selectively enable/disable recipients before sending

-- Add enabled column with default true
ALTER TABLE campaign_recipients ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true;

-- Add index for better performance when filtering by enabled status
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_enabled ON campaign_recipients(campaign_id, enabled) WHERE enabled = true;

-- Add comment for documentation
COMMENT ON COLUMN campaign_recipients.enabled IS 'Whether this recipient should receive the campaign (can be toggled before sending)';

