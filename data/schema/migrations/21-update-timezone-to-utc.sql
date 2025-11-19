-- Migration to update all created_at and updated_at defaults to use real UTC
-- This implements proper timezone handling: store UTC in database, convert to EST in frontend
-- Run this in your Supabase SQL editor

-- The trigger function already uses UTC (from migration 09), so we just need to update table defaults

-- Update all table defaults for created_at and updated_at columns to use UTC

-- Actions table
ALTER TABLE public.actions
  ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now()),
  ALTER COLUMN updated_at SET DEFAULT timezone('utc'::text, now());

-- Activities table (if it exists)
ALTER TABLE public.activities
  ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now()),
  ALTER COLUMN updated_at SET DEFAULT timezone('utc'::text, now());

-- Addresses table
ALTER TABLE public.addresses
  ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now()),
  ALTER COLUMN updated_at SET DEFAULT timezone('utc'::text, now());

-- Contacts table
ALTER TABLE public.contacts
  ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now()),
  ALTER COLUMN updated_at SET DEFAULT timezone('utc'::text, now());

-- Emails table
ALTER TABLE public.emails
  ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now());

-- Phones table
ALTER TABLE public.phones
  ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now());

-- Reminders table
ALTER TABLE public.reminders
  ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now()),
  ALTER COLUMN updated_at SET DEFAULT timezone('utc'::text, now());

-- Plans table
ALTER TABLE public.plans
  ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now()),
  ALTER COLUMN updated_at SET DEFAULT timezone('utc'::text, now());

-- Enrollments table
ALTER TABLE public.enrollments
  ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now()),
  ALTER COLUMN updated_at SET DEFAULT timezone('utc'::text, now());

-- Tags table
ALTER TABLE public.tags
  ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now());

-- Tag categories table
ALTER TABLE public.tag_categories
  ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now());

-- Lead statuses table
ALTER TABLE public.lead_statuses
  ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now());

-- Contact tags table
ALTER TABLE public.contact_tags
  ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now());

-- Note: This migration updates the defaults for future inserts to use real UTC.
-- The trigger function (from migration 09) already uses UTC for updated_at.
-- The frontend now properly converts between UTC (storage) and EST (display/input).

