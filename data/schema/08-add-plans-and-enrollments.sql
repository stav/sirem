-- Migration to add Medicare plans and contact enrollments
-- Run this in your Supabase SQL editor

-- === Enums ===
-- Plan types
DO $$ BEGIN
  CREATE TYPE plan_type AS ENUM (
    'Ancillary',
    'C-SNP',
    'D-SNP',
    'HMO',
    'HMO-D-SNP',
    'HMO-POS',
    'HMO-POS-C-SNP',
    'HMO-POS-D-SNP',
    'PDP',
    'PPO',
    'PPO-D-SNP',
    'Supplement',
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Carrier list (extend as needed)
DO $$ BEGIN
  CREATE TYPE carrier AS ENUM (
    'United',
    'Humana',
    'Devoted',
    'Anthem',
    'MedMutual',
    'Aetna',
    'GTL',
    'Medico',
    'CareSource',
    'SummaCare',
    'Cigna',
    'Heartland',
    'Other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Enrollment status
DO $$ BEGIN
  CREATE TYPE enrollment_status AS ENUM ('pending', 'active', 'cancelled', 'terminated', 'declined');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Plans master table: catalog of plan offerings
CREATE TABLE IF NOT EXISTS plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Core identifiers
  name TEXT NOT NULL,
  plan_type plan_type, -- HMO/PPO/D-SNP/etc
  carrier carrier, -- e.g., UnitedHealthcare, Humana, etc
  plan_year INTEGER, -- e.g., 2025

  -- CMS identifiers
  cms_contract_number TEXT, -- e.g., H1234
  cms_plan_number TEXT, -- e.g., 001
  cms_id TEXT GENERATED ALWAYS AS (COALESCE(cms_contract_number, '') || '-' || COALESCE(cms_plan_number, '')) STORED,

  -- Plan period (if applicable)
  effective_start TIMESTAMP WITH TIME ZONE,
  effective_end TIMESTAMP WITH TIME ZONE,

  -- Financials/benefits (common fields)
  premium_monthly NUMERIC(10,2),
  giveback_monthly NUMERIC(10,2),
  otc_benefit_quarterly NUMERIC(10,2),
  dental_benefit_yearly NUMERIC(10,2),
  hearing_benefit_yearly NUMERIC(10,2),
  vision_benefit_yearly NUMERIC(10,2),
  primary_care_copay NUMERIC(10,2),
  specialist_copay NUMERIC(10,2),
  hospital_inpatient_per_stay_copay NUMERIC(10,2),
  hospital_inpatient_days INTEGER,
  moop_annual NUMERIC(10,2),
  ambulance_copay NUMERIC(10,2),
  emergency_room_copay NUMERIC(10,2),
  urgent_care_copay NUMERIC(10,2),
  pharmacy_benefit TEXT,
  service_area TEXT,
  counties TEXT[], -- array of county names or FIPS strings

  -- Free-form
  notes TEXT,
  metadata JSONB
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_plans_carrier ON plans(carrier);
CREATE INDEX IF NOT EXISTS idx_plans_plan_type ON plans(plan_type);
CREATE INDEX IF NOT EXISTS idx_plans_plan_year ON plans(plan_year);
CREATE INDEX IF NOT EXISTS idx_plans_cms_id ON plans(cms_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_plans_cms_unique ON plans(cms_contract_number, cms_plan_number, plan_year);

-- Enable RLS and permissive policies (adjust in production)
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Allow public read access to plans" ON plans FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow public insert access to plans" ON plans FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow public update access to plans" ON plans FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow public delete access to plans" ON plans FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- Enrollments: links contacts to plans with enrollment details
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES plans(id) ON DELETE RESTRICT NOT NULL,

  -- Enrollment lifecycle
  enrollment_status enrollment_status, -- e.g., pending, active, cancelled, terminated
  application_id TEXT,
  signed_up_at TIMESTAMP WITH TIME ZONE, -- when client signed up with me
  coverage_effective_date TIMESTAMP WITH TIME ZONE, -- coverage start for the member
  coverage_end_date TIMESTAMP WITH TIME ZONE, -- coverage end/termination

  -- Member-specific financials/notes at time of enrollment
  premium_monthly_at_enrollment NUMERIC(10,2),
  pcp_name TEXT,
  pcp_id TEXT,
  agent_notes TEXT,
  disenrollment_reason TEXT,

  metadata JSONB
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_contact_id ON enrollments(contact_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_plan_id ON enrollments(plan_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(enrollment_status);
CREATE INDEX IF NOT EXISTS idx_enrollments_effective ON enrollments(coverage_effective_date);

-- Optional: prevent duplicate active enrollments per contact per effective period
-- (Commented out to avoid overly restrictive constraint by default)
-- CREATE UNIQUE INDEX IF NOT EXISTS uq_active_enrollment_per_contact
--   ON enrollments(contact_id, plan_id)
--   WHERE enrollment_status = 'active';

-- Enable RLS and permissive policies (adjust in production)
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Allow public read access to enrollments" ON enrollments FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow public insert access to enrollments" ON enrollments FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow public update access to enrollments" ON enrollments FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow public delete access to enrollments" ON enrollments FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


