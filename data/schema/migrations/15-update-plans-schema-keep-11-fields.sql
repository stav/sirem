-- Schema Update: Keep only 12 core fields in plans table
-- This script drops all columns except the 12 core fields specified in the documentation
-- Run this AFTER running the migration script (14-migrate-plans-fields-to-metadata.sql)

-- The 12 fields to keep:
-- 1. id (UUID primary key)
-- 2. created_at (timestamp)
-- 3. updated_at (timestamp)
-- 4. name (text - required)
-- 5. plan_type (enum)
-- 6. carrier (enum)
-- 7. plan_year (integer)
-- 8. cms_contract_number (text)
-- 9. cms_plan_number (text)
-- 10. cms_geo_segment (text)
-- 11. counties (TEXT[] array)
-- 12. metadata (jsonb)

-- Drop columns that will be moved to metadata
ALTER TABLE plans DROP COLUMN IF EXISTS effective_start;
ALTER TABLE plans DROP COLUMN IF EXISTS effective_end;
ALTER TABLE plans DROP COLUMN IF EXISTS premium_monthly;
ALTER TABLE plans DROP COLUMN IF EXISTS giveback_monthly;
ALTER TABLE plans DROP COLUMN IF EXISTS otc_benefit_quarterly;
ALTER TABLE plans DROP COLUMN IF EXISTS dental_benefit_yearly;
ALTER TABLE plans DROP COLUMN IF EXISTS hearing_benefit_yearly;
ALTER TABLE plans DROP COLUMN IF EXISTS vision_benefit_yearly;
ALTER TABLE plans DROP COLUMN IF EXISTS primary_care_copay;
ALTER TABLE plans DROP COLUMN IF EXISTS specialist_copay;
ALTER TABLE plans DROP COLUMN IF EXISTS hospital_inpatient_per_day_copay;
ALTER TABLE plans DROP COLUMN IF EXISTS hospital_inpatient_days;
ALTER TABLE plans DROP COLUMN IF EXISTS moop_annual;
ALTER TABLE plans DROP COLUMN IF EXISTS ambulance_copay;
ALTER TABLE plans DROP COLUMN IF EXISTS emergency_room_copay;
ALTER TABLE plans DROP COLUMN IF EXISTS urgent_care_copay;
ALTER TABLE plans DROP COLUMN IF EXISTS pharmacy_benefit;
ALTER TABLE plans DROP COLUMN IF EXISTS service_area;
ALTER TABLE plans DROP COLUMN IF EXISTS notes;

-- -- Update the timezone handling to use UTC instead of America/New_York
-- -- This aligns with the memory about using UTC for all datetime handling
-- UPDATE plans SET 
--     created_at = created_at AT TIME ZONE 'America/New_York' AT TIME ZONE 'UTC',
--     updated_at = updated_at AT TIME ZONE 'America/New_York' AT TIME ZONE 'UTC'
-- WHERE created_at IS NOT NULL OR updated_at IS NOT NULL;

-- Update the default timezone for the updated_at trigger
-- Note: This would need to be done in the trigger function as well
-- The trigger function update_updated_at_column() currently uses 'America/New_York'
-- This should be updated to use 'UTC' to match the memory requirement

-- -- Verify the final schema
-- SELECT 
--     column_name, 
--     data_type, 
--     is_nullable,
--     column_default
-- FROM information_schema.columns 
-- WHERE table_name = 'plans' 
--     AND table_schema = 'public'
-- ORDER BY ordinal_position;

-- -- Verify data integrity after migration
-- SELECT 
--     COUNT(*) as total_plans,
--     COUNT(CASE WHEN metadata ? 'premium_monthly' THEN 1 END) as plans_with_premium_in_metadata,
--     COUNT(CASE WHEN metadata ? 'notes' THEN 1 END) as plans_with_notes_in_metadata,
--     COUNT(CASE WHEN metadata ? 'giveback_monthly' THEN 1 END) as plans_with_giveback_in_metadata
-- FROM plans;
