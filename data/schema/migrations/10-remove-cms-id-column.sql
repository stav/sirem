-- Migration to remove redundant cms_id column
-- The cms_id was a generated column that concatenated cms_contract_number and cms_plan_number
-- We'll handle this concatenation in the UI instead

-- Drop the index first
DROP INDEX IF EXISTS idx_plans_cms_id;

-- Drop the generated column
ALTER TABLE plans DROP COLUMN IF EXISTS cms_id;
