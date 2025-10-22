-- Migration to fix type_program field population
-- The previous migration didn't correctly identify MAPD plans
-- This migration fixes the type_program field based on the actual plan types

DO $$
DECLARE
  plans_updated INTEGER := 0;
BEGIN
  -- Update type_program field with correct logic
  UPDATE plans
  SET type_program =
    CASE
      -- SNP plans (these already have SNP in the name)
      WHEN plan_type ILIKE '%SNP%' THEN 'SNP'
      -- PDP plans
      WHEN plan_type = 'PDP' THEN 'PDP'
      -- Supplement plans
      WHEN plan_type = 'Supplement' THEN 'Supplement'
      -- Ancillary plans
      WHEN plan_type = 'Ancillary' THEN 'Ancillary'
      -- All other plans (HMO, PPO, HMO-POS, etc.) are MAPD plans
      WHEN plan_type IN ('HMO', 'PPO', 'HMO-POS', 'HMO-D-SNP', 'PPO-D-SNP') THEN 'MAPD'
      ELSE NULL
    END
  WHERE type_program IS NULL AND plan_type IS NOT NULL;
  
  GET DIAGNOSTICS plans_updated = ROW_COUNT;
  RAISE NOTICE 'Updated % plans for type_program field.', plans_updated;
  
  -- Show summary of current state
  RAISE NOTICE 'Current plan type distribution:';
  FOR rec IN 
    SELECT plan_type, COUNT(*) as count
    FROM plans 
    WHERE plan_type IS NOT NULL
    GROUP BY plan_type
    ORDER BY plan_type
  LOOP
    RAISE NOTICE '  %: % plans', rec.plan_type, rec.count;
  END LOOP;
  
  -- Show normalized field distribution
  RAISE NOTICE 'Normalized field distribution:';
  FOR rec IN 
    SELECT 
      type_network,
      type_extension,
      type_snp,
      type_program,
      COUNT(*) as count
    FROM plans 
    WHERE type_network IS NOT NULL OR type_extension IS NOT NULL OR type_snp IS NOT NULL OR type_program IS NOT NULL
    GROUP BY type_network, type_extension, type_snp, type_program
    ORDER BY count DESC
    LIMIT 10
  LOOP
    RAISE NOTICE '  Network:%, Extension:%, SNP:%, Program:% -> % plans', 
      COALESCE(rec.type_network, 'null'),
      COALESCE(rec.type_extension, 'null'),
      COALESCE(rec.type_snp, 'null'),
      COALESCE(rec.type_program, 'null'),
      rec.count;
  END LOOP;
END $$;
