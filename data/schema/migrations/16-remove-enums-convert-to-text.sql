-- Migration to remove database enums and convert to TEXT columns
-- This eliminates the need to maintain enums in multiple places
-- Run this in your Supabase SQL editor

-- Convert plan_type enum column to TEXT
ALTER TABLE plans ALTER COLUMN plan_type TYPE TEXT;

-- Convert carrier enum column to TEXT  
ALTER TABLE plans ALTER COLUMN carrier TYPE TEXT;

-- Convert enrollment_status enum column to TEXT
ALTER TABLE enrollments ALTER COLUMN enrollment_status TYPE TEXT;

-- Drop the enum types (they're no longer needed)
DROP TYPE IF EXISTS plan_type CASCADE;
DROP TYPE IF EXISTS carrier CASCADE;
DROP TYPE IF EXISTS enrollment_status CASCADE;
