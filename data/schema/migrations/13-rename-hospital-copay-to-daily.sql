-- Migration: Rename hospital_inpatient_per_stay_copay to hospital_inpatient_per_day_copay
-- This clarifies that the field stores the DAILY copay amount, not the total per stay
-- The total per stay can be calculated on the client: daily_copay * hospital_inpatient_days

ALTER TABLE plans 
  RENAME COLUMN hospital_inpatient_per_stay_copay TO hospital_inpatient_per_day_copay;

-- Update column comment for clarity
COMMENT ON COLUMN plans.hospital_inpatient_per_day_copay IS 'Daily copay amount for hospital inpatient stays. Total per stay = daily_copay * hospital_inpatient_days';

