-- Migration to add email unsubscribe tracking
-- Run this in your Supabase SQL editor

-- Create email_unsubscribes table for tracking opt-outs
CREATE TABLE IF NOT EXISTS email_unsubscribes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  email_address TEXT NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  reason TEXT,
  source TEXT DEFAULT 'link', -- 'link', 'reply', 'manual', etc.
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_email_unsubscribes_email ON email_unsubscribes(email_address);
CREATE INDEX IF NOT EXISTS idx_email_unsubscribes_contact_id ON email_unsubscribes(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_unsubscribes_created_at ON email_unsubscribes(created_at);

-- Add comment for documentation
COMMENT ON TABLE email_unsubscribes IS 'Tracks email unsubscribe requests for compliance and audit purposes';
COMMENT ON COLUMN email_unsubscribes.email_address IS 'Email address that unsubscribed';
COMMENT ON COLUMN email_unsubscribes.contact_id IS 'Associated contact if email matches a contact';
COMMENT ON COLUMN email_unsubscribes.source IS 'How the unsubscribe was initiated: link, reply, manual, etc.';


