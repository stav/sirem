-- Migration to add email campaign functionality
-- Run this in your Supabase SQL editor

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  html_content TEXT, -- Optional HTML version
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled')),
  created_by UUID, -- Could reference a users table if you have one
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  bounce_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create campaign_recipients table
CREATE TABLE IF NOT EXISTS campaign_recipients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  email_address TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  bounced_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  resend_message_id TEXT, -- Store Resend message ID for tracking
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign_id ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_contact_id ON campaign_recipients(contact_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_status ON campaign_recipients(status);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_sent_at ON campaign_recipients(sent_at);

-- Add comments for documentation
COMMENT ON TABLE campaigns IS 'Email marketing campaigns with tracking and analytics';
COMMENT ON TABLE campaign_recipients IS 'Individual recipients for each campaign with delivery tracking';

COMMENT ON COLUMN campaigns.status IS 'Campaign status: draft, scheduled, sending, sent, paused, cancelled';
COMMENT ON COLUMN campaigns.total_recipients IS 'Total number of recipients when campaign was created';
COMMENT ON COLUMN campaigns.sent_count IS 'Number of emails successfully sent';
COMMENT ON COLUMN campaigns.delivered_count IS 'Number of emails delivered to inbox';
COMMENT ON COLUMN campaigns.opened_count IS 'Number of emails opened by recipients';
COMMENT ON COLUMN campaigns.clicked_count IS 'Number of emails with link clicks';
COMMENT ON COLUMN campaigns.bounce_count IS 'Number of bounced emails';

COMMENT ON COLUMN campaign_recipients.status IS 'Recipient status: pending, sent, delivered, opened, clicked, bounced, failed';
COMMENT ON COLUMN campaign_recipients.resend_message_id IS 'Resend API message ID for webhook tracking';

-- Create function to update campaign statistics
CREATE OR REPLACE FUNCTION update_campaign_stats(campaign_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE campaigns SET
    sent_count = (
      SELECT COUNT(*) FROM campaign_recipients 
      WHERE campaign_id = campaign_uuid AND status IN ('sent', 'delivered', 'opened', 'clicked')
    ),
    delivered_count = (
      SELECT COUNT(*) FROM campaign_recipients 
      WHERE campaign_id = campaign_uuid AND status IN ('delivered', 'opened', 'clicked')
    ),
    opened_count = (
      SELECT COUNT(*) FROM campaign_recipients 
      WHERE campaign_id = campaign_uuid AND status IN ('opened', 'clicked')
    ),
    clicked_count = (
      SELECT COUNT(*) FROM campaign_recipients 
      WHERE campaign_id = campaign_uuid AND status = 'clicked'
    ),
    bounce_count = (
      SELECT COUNT(*) FROM campaign_recipients 
      WHERE campaign_id = campaign_uuid AND status = 'bounced'
    ),
    updated_at = now()
  WHERE id = campaign_uuid;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update campaign stats when recipients change
CREATE OR REPLACE FUNCTION trigger_update_campaign_stats()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_campaign_stats(COALESCE(NEW.campaign_id, OLD.campaign_id));
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaign_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON campaign_recipients
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_campaign_stats();
