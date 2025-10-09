-- Migration to update the CMS unique index to include geo segment
-- This ensures uniqueness across contract, plan, geo segment, and year

-- Drop the old unique index
DROP INDEX IF EXISTS idx_plans_cms_unique;

-- Create the new unique index with geo segment
CREATE UNIQUE INDEX idx_plans_cms_unique ON plans(plan_year, cms_contract_number, cms_plan_number, cms_geo_segment);
