-- Migration to remove the legacy plan_type field
-- This migration should be run AFTER all plans have been normalized
-- and the application has been updated to use the new normalized fields

-- First, let's verify that all plans have normalized fields
DO $$
DECLARE
  plans_without_normalization INTEGER;
  total_plans INTEGER;
BEGIN
  -- Count plans that have legacy plan_type but no normalized fields
  SELECT COUNT(*) INTO plans_without_normalization
  FROM plans 
  WHERE plan_type IS NOT NULL 
    AND type_network IS NULL 
    AND type_extension IS NULL 
    AND type_snp IS NULL 
    AND type_program IS NULL;
  
  -- Count total plans
  SELECT COUNT(*) INTO total_plans FROM plans;
  
  RAISE NOTICE 'Total plans: %', total_plans;
  RAISE NOTICE 'Plans without normalization: %', plans_without_normalization;
  
  -- Only proceed if all plans are normalized
  IF plans_without_normalization > 0 THEN
    RAISE EXCEPTION 'Cannot remove plan_type field: % plans still need normalization. Run the normalization migration first.', plans_without_normalization;
  END IF;
  
  RAISE NOTICE 'All plans are normalized. Proceeding with plan_type field removal...';
END $$;

-- Remove the legacy plan_type column
ALTER TABLE plans DROP COLUMN IF EXISTS plan_type;

-- Remove the index on the old plan_type field (if it exists)
DROP INDEX IF EXISTS idx_plans_plan_type;

-- Add a comment to document the change
COMMENT ON TABLE plans IS 'Plans table with normalized plan type structure (type_network, type_extension, type_snp, type_program) - legacy plan_type field removed in migration 20';

-- Show final summary
DO $$
DECLARE
  remaining_plans INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_plans FROM plans;
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Remaining plans: %', remaining_plans;
  RAISE NOTICE 'Legacy plan_type field has been removed.';
  RAISE NOTICE 'All plan type information is now stored in normalized fields.';
END $$;
