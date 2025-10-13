-- Migration to add cms_geo_segment field to plans table
-- This field stores the three-digit county identifier (e.g., "001")

-- Add the new column
ALTER TABLE plans ADD COLUMN IF NOT EXISTS cms_geo_segment TEXT;

-- Add comment to document the field
COMMENT ON COLUMN plans.cms_geo_segment IS 'Three-digit county identifier (e.g., "001") used in CMS ID construction';
