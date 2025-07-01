-- Migration to add status field to contacts table and populate from lead_statuses
-- Run this in your Supabase SQL editor

-- Add status column to contacts table
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS status TEXT;

-- Create an index on the status field for better performance
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);

-- Populate status from lead_statuses.name using the lead_status_id foreign key
UPDATE contacts 
SET status = (
  SELECT name 
  FROM lead_statuses 
  WHERE lead_statuses.id = contacts.lead_status_id
)
WHERE contacts.lead_status_id IS NOT NULL;

-- Set default status for contacts that don't have a lead_status_id
UPDATE contacts 
SET status = 'New' 
WHERE status IS NULL;

-- -- Optional: Create a trigger to keep status in sync with lead_statuses
-- -- This will automatically update status when lead_status_id changes
-- CREATE OR REPLACE FUNCTION update_contact_status()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   IF NEW.lead_status_id IS NOT NULL THEN
--     SELECT name INTO NEW.status 
--     FROM lead_statuses 
--     WHERE id = NEW.lead_status_id;
--   ELSE
--     NEW.status := 'New';
--   END IF;
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- -- Create the trigger
-- DROP TRIGGER IF EXISTS trigger_update_contact_status ON contacts;
-- CREATE TRIGGER trigger_update_contact_status
--   BEFORE INSERT OR UPDATE ON contacts
--   FOR EACH ROW
--   EXECUTE FUNCTION update_contact_status(); 
