-- Migration to add email campaign functionality with ConvertKit integration
-- Run this in your Supabase SQL editor

-- Create email campaigns table
CREATE TABLE email_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Campaign details
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL, -- HTML content
  plain_text_content TEXT, -- Plain text version
  
  -- ConvertKit integration
  convertkit_campaign_id INTEGER, -- ConvertKit campaign ID
  convertkit_form_id INTEGER, -- ConvertKit form ID for signups
  
  -- Campaign settings
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Targeting
  target_tags TEXT[], -- Array of tag names to target
  target_t65_days INTEGER, -- Target contacts turning 65 within X days
  target_lead_statuses UUID[], -- Array of lead status IDs to target
  
  -- Metadata
  metadata JSONB,
  created_by TEXT DEFAULT 'system'
);

-- Create campaign subscribers table (tracks who was sent each campaign)
CREATE TABLE campaign_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Relationships
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  
  -- ConvertKit subscriber info
  convertkit_subscriber_id INTEGER,
  convertkit_email TEXT NOT NULL,
  
  -- Campaign status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  
  -- Tracking
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  bounce_reason TEXT,
  
  -- Metadata
  metadata JSONB,
  
  UNIQUE(campaign_id, contact_id)
);

-- Create ConvertKit subscribers table (syncs with ConvertKit)
CREATE TABLE convertkit_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- ConvertKit data
  convertkit_id INTEGER UNIQUE NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  
  -- Local contact relationship
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  
  -- Subscription status
  state TEXT DEFAULT 'active' CHECK (state IN ('active', 'inactive', 'unsubscribed')),
  subscribed_at TIMESTAMP WITH TIME ZONE,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  
  -- ConvertKit tags
  convertkit_tags TEXT[],
  
  -- Metadata
  metadata JSONB,
  
  UNIQUE(email)
);

-- Create indexes for better performance
CREATE INDEX idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX idx_email_campaigns_scheduled_at ON email_campaigns(scheduled_at);
CREATE INDEX idx_email_campaigns_sent_at ON email_campaigns(sent_at);
CREATE INDEX idx_campaign_subscribers_campaign_id ON campaign_subscribers(campaign_id);
CREATE INDEX idx_campaign_subscribers_contact_id ON campaign_subscribers(contact_id);
CREATE INDEX idx_campaign_subscribers_status ON campaign_subscribers(status);
CREATE INDEX idx_convertkit_subscribers_email ON convertkit_subscribers(email);
CREATE INDEX idx_convertkit_subscribers_contact_id ON convertkit_subscribers(contact_id);
CREATE INDEX idx_convertkit_subscribers_state ON convertkit_subscribers(state);

-- Enable Row Level Security
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE convertkit_subscribers ENABLE ROW LEVEL SECURITY;

-- Create security policies
CREATE POLICY "Allow public read access to email_campaigns" ON email_campaigns FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to email_campaigns" ON email_campaigns FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to email_campaigns" ON email_campaigns FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to campaign_subscribers" ON campaign_subscribers FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to campaign_subscribers" ON campaign_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to campaign_subscribers" ON campaign_subscribers FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to convertkit_subscribers" ON convertkit_subscribers FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to convertkit_subscribers" ON convertkit_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to convertkit_subscribers" ON convertkit_subscribers FOR UPDATE USING (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_email_campaigns_updated_at BEFORE UPDATE ON email_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_convertkit_subscribers_updated_at BEFORE UPDATE ON convertkit_subscribers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample campaign for testing
INSERT INTO email_campaigns (name, subject, content, plain_text_content, status, target_tags) VALUES (
  'Medicare Advantage Welcome',
  'Welcome to Medicare Advantage - Your Guide to Better Coverage',
  '<h1>Welcome to Medicare Advantage!</h1><p>We''re excited to help you navigate your Medicare options.</p>',
  'Welcome to Medicare Advantage! We''re excited to help you navigate your Medicare options.',
  'draft',
  ARRAY['medicare', 'welcome']
); 
