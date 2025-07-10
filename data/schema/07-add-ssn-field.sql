-- Migration: Add SSN field to contacts table
-- Date: 2024-01-XX

-- Add SSN field to contacts table
ALTER TABLE public.contacts 
ADD COLUMN ssn text;

-- Add comment to document the SSN field
COMMENT ON COLUMN public.contacts.ssn IS 'Social Security Number (stored as text to preserve formatting)';

-- -- Add index for SSN queries (with partial index for non-null values only)
-- CREATE INDEX idx_contacts_ssn ON public.contacts(ssn) WHERE ssn IS NOT NULL; 
