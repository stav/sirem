-- Migration to add phone and email fields to contacts table
-- Run this in your Supabase SQL editor

-- Add phone column to contacts table
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add email column to contacts table
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS email TEXT;

-- Update existing contacts with phone numbers from the phones table
UPDATE contacts 
SET phone = (
  SELECT phone_number 
  FROM phones 
  WHERE phones.contact_id = contacts.id 
  ORDER BY phones.created_at ASC 
  LIMIT 1
)
WHERE phone IS NULL;

-- Update existing contacts with email addresses from the emails table
UPDATE contacts 
SET email = (
  SELECT email_address 
  FROM emails 
  WHERE emails.contact_id = contacts.id 
  ORDER BY emails.created_at ASC 
  LIMIT 1
)
WHERE email IS NULL; 
