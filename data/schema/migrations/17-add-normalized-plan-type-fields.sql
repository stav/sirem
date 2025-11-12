-- Migration to add normalized plan type fields
-- This replaces the compound plan_type string with logical components
-- Run this in your Supabase SQL editor

-- Add new normalized plan type fields to plans table
ALTER TABLE plans ADD COLUMN type_network TEXT;
ALTER TABLE plans ADD COLUMN type_extension TEXT;
ALTER TABLE plans ADD COLUMN type_snp TEXT;
ALTER TABLE plans ADD COLUMN type_program TEXT;

-- No check constraints - validation is handled in src/lib/plan-constants.ts

-- Add comments to document the new fields
COMMENT ON COLUMN plans.type_network IS 'Plan network type (HMO, PPO, PFFS, MSA) - values defined in src/lib/plan-constants.ts';
COMMENT ON COLUMN plans.type_extension IS 'Plan extension type (POS or null) - values defined in src/lib/plan-constants.ts';
COMMENT ON COLUMN plans.type_snp IS 'SNP type (D, C, I or null) - values defined in src/lib/plan-constants.ts';
COMMENT ON COLUMN plans.type_program IS 'Program type (SNP, MA, MAPD, PDP, Supplement, Ancillary) - values defined in src/lib/plan-constants.ts';

-- Create indexes for the new fields for better query performance
CREATE INDEX IF NOT EXISTS idx_plans_type_network ON plans(type_network);
CREATE INDEX IF NOT EXISTS idx_plans_type_extension ON plans(type_extension);
CREATE INDEX IF NOT EXISTS idx_plans_type_snp ON plans(type_snp);
CREATE INDEX IF NOT EXISTS idx_plans_type_program ON plans(type_program);

-- Create a composite index for common queries
CREATE INDEX IF NOT EXISTS idx_plans_type_composite ON plans(type_network, type_extension, type_snp, type_program);
