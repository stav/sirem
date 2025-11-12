-- Migration to populate normalized plan type fields from existing plan_type data
-- This converts legacy plan_type strings into the new normalized structure
-- Run this in your Supabase SQL editor

-- Update type_network field
UPDATE plans SET type_network = 
  CASE 
    WHEN plan_type ILIKE 'HMO%' THEN 'HMO'
    WHEN plan_type ILIKE 'PPO%' THEN 'PPO'
    WHEN plan_type ILIKE 'PFFS%' THEN 'PFFS'
    WHEN plan_type ILIKE 'MSA%' THEN 'MSA'
    ELSE NULL
  END
WHERE type_network IS NULL;

-- Update type_extension field
UPDATE plans SET type_extension = 
  CASE 
    WHEN plan_type ILIKE '%POS%' THEN 'POS'
    ELSE NULL
  END
WHERE type_extension IS NULL;

-- Update type_snp field
UPDATE plans SET type_snp = 
  CASE 
    WHEN plan_type ILIKE '%D-SNP%' OR plan_type ILIKE '%DSNP%' THEN 'D'
    WHEN plan_type ILIKE '%C-SNP%' OR plan_type ILIKE '%CSNP%' THEN 'C'
    WHEN plan_type ILIKE '%I-SNP%' OR plan_type ILIKE '%ISNP%' THEN 'I'
    ELSE NULL
  END
WHERE type_snp IS NULL;

-- Update type_program field
UPDATE plans SET type_program = 
  CASE 
    WHEN plan_type ILIKE '%SNP%' THEN 'SNP'
    WHEN plan_type ILIKE '%MA%' THEN 'MA'
    WHEN plan_type ILIKE '%MAPD%' THEN 'MAPD'
    WHEN plan_type ILIKE '%PDP%' THEN 'PDP'
    WHEN plan_type ILIKE '%Supplement%' THEN 'Supplement'
    WHEN plan_type ILIKE '%Ancillary%' THEN 'Ancillary'
    ELSE NULL
  END
WHERE type_program IS NULL;

-- Show summary of what was updated
SELECT 
  'Updated ' || COUNT(*) || ' plans with normalized type fields' as summary
FROM plans 
WHERE type_network IS NOT NULL 
   OR type_extension IS NOT NULL 
   OR type_snp IS NOT NULL 
   OR type_program IS NOT NULL;
