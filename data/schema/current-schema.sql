-- Current Database Schema Snapshot
-- This file represents the current state of the database after all migrations
-- Generated: 2025-07-03

-- =====================================================
-- TAG CATEGORIES TABLE
-- =====================================================
CREATE TABLE tag_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#A9A9A9',
  is_active BOOLEAN DEFAULT true NOT NULL,
  parent_category_id UUID REFERENCES tag_categories(id)
);

-- =====================================================
-- TAGS TABLE
-- =====================================================
CREATE TABLE tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  label TEXT NOT NULL,
  category_id UUID REFERENCES tag_categories(id) NOT NULL,
  icon_url TEXT,
  metadata JSONB,
  is_active BOOLEAN DEFAULT true NOT NULL
);

-- =====================================================
-- LEAD STATUSES TABLE
-- =====================================================
CREATE TABLE lead_statuses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#6B7280'
);

-- =====================================================
-- CONTACTS TABLE (ENHANCED)
-- =====================================================
CREATE TABLE contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Basic contact info
  prefix TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  middle_name TEXT,
  suffix TEXT,
  phone TEXT,  -- Added in migration 02
  email TEXT,  -- Added in migration 02
  
  -- Medicare-specific fields
  medicare_beneficiary_id TEXT,
  part_a_status TEXT,
  part_b_status TEXT,
  height TEXT,
  weight TEXT,
  gender TEXT,
  marital_status TEXT,
  has_medicaid BOOLEAN,
  is_tobacco_user BOOLEAN,
  birthdate DATE,
  primary_communication TEXT DEFAULT 'phone',
  
  -- Business fields
  lead_source TEXT DEFAULT 'Manual',
  contact_record_type TEXT DEFAULT 'Prospect',
  inactive BOOLEAN DEFAULT false,
  notes TEXT,
  
  -- Policy counts
  life_policy_count INTEGER DEFAULT 0,
  health_policy_count INTEGER DEFAULT 0,
  subsidy_level TEXT,
  
  -- Status
  lead_status_id UUID REFERENCES lead_statuses(id),
  status TEXT  -- Added in migration 03
);

-- =====================================================
-- ADDRESSES TABLE
-- =====================================================
CREATE TABLE addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  address1 TEXT,
  address2 TEXT,
  city TEXT,
  state_code TEXT,
  postal_code TEXT,
  county TEXT,
  county_fips TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8)
);

-- =====================================================
-- PHONES TABLE
-- =====================================================
CREATE TABLE phones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  phone_number TEXT NOT NULL,
  phone_label TEXT,
  inactive BOOLEAN DEFAULT false,
  is_sms_compatible BOOLEAN DEFAULT false
);

-- =====================================================
-- EMAILS TABLE
-- =====================================================
CREATE TABLE emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  email_address TEXT NOT NULL,
  email_label TEXT,
  inactive BOOLEAN DEFAULT false
);

-- =====================================================
-- CONTACT TAGS JUNCTION TABLE
-- =====================================================
CREATE TABLE contact_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  metadata JSONB,
  interaction_url TEXT,
  interaction_url_label TEXT,
  UNIQUE(contact_id, tag_id)
);

-- =====================================================
-- REMINDERS TABLE (ENHANCED)
-- =====================================================
CREATE TABLE reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
  reminder_source TEXT DEFAULT 'Manual',
  reminder_type TEXT,
  is_complete BOOLEAN DEFAULT false NOT NULL,
  completed_date TIMESTAMP WITH TIME ZONE,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium' NOT NULL
);

-- =====================================================
-- ACTIVITIES TABLE
-- =====================================================
CREATE TABLE activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  activity_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER,
  outcome TEXT,
  metadata JSONB
);

-- =====================================================
-- INDEXES FOR BETTER PERFORMANCE
-- =====================================================
CREATE INDEX idx_contacts_lead_status ON contacts(lead_status_id);
CREATE INDEX idx_contacts_inactive ON contacts(inactive);
CREATE INDEX idx_contacts_created_at ON contacts(created_at);
CREATE INDEX idx_contacts_status ON contacts(status);  -- Added in migration 03
CREATE INDEX idx_reminders_contact_id ON reminders(contact_id);
CREATE INDEX idx_reminders_date ON reminders(reminder_date);
CREATE INDEX idx_reminders_complete ON reminders(is_complete);
CREATE INDEX idx_phones_contact_id ON phones(contact_id);
CREATE INDEX idx_emails_contact_id ON emails(contact_id);
CREATE INDEX idx_addresses_contact_id ON addresses(contact_id);
CREATE INDEX idx_contact_tags_contact_id ON contact_tags(contact_id);
CREATE INDEX idx_contact_tags_tag_id ON contact_tags(tag_id);
CREATE INDEX idx_activities_contact_id ON activities(contact_id);
CREATE INDEX idx_activities_date ON activities(activity_date);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE tag_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE phones ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SECURITY POLICIES (PUBLIC ACCESS)
-- =====================================================
-- Tag Categories Policies
CREATE POLICY "Allow public read access to tag_categories" ON tag_categories FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to tag_categories" ON tag_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to tag_categories" ON tag_categories FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to tag_categories" ON tag_categories FOR DELETE USING (true);

-- Tags Policies
CREATE POLICY "Allow public read access to tags" ON tags FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to tags" ON tags FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to tags" ON tags FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to tags" ON tags FOR DELETE USING (true);

-- Lead Statuses Policies
CREATE POLICY "Allow public read access to lead_statuses" ON lead_statuses FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to lead_statuses" ON lead_statuses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to lead_statuses" ON lead_statuses FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to lead_statuses" ON lead_statuses FOR DELETE USING (true);

-- Contacts Policies
CREATE POLICY "Allow public read access to contacts" ON contacts FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to contacts" ON contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to contacts" ON contacts FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to contacts" ON contacts FOR DELETE USING (true);

-- Addresses Policies
CREATE POLICY "Allow public read access to addresses" ON addresses FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to addresses" ON addresses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to addresses" ON addresses FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to addresses" ON addresses FOR DELETE USING (true);

-- Phones Policies
CREATE POLICY "Allow public read access to phones" ON phones FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to phones" ON phones FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to phones" ON phones FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to phones" ON phones FOR DELETE USING (true);

-- Emails Policies
CREATE POLICY "Allow public read access to emails" ON emails FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to emails" ON emails FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to emails" ON emails FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to emails" ON emails FOR DELETE USING (true);

-- Contact Tags Policies
CREATE POLICY "Allow public read access to contact_tags" ON contact_tags FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to contact_tags" ON contact_tags FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to contact_tags" ON contact_tags FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to contact_tags" ON contact_tags FOR DELETE USING (true);

-- Reminders Policies
CREATE POLICY "Allow public read access to reminders" ON reminders FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to reminders" ON reminders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to reminders" ON reminders FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to reminders" ON reminders FOR DELETE USING (true);

-- Activities Policies
CREATE POLICY "Allow public read access to activities" ON activities FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to activities" ON activities FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to activities" ON activities FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to activities" ON activities FOR DELETE USING (true);

-- =====================================================
-- SCHEMA VERSION INFO
-- =====================================================
-- Current Version: 1.2
-- Last Updated: 2025-07-03
-- Migration History:
--   v1.0: Initial schema with core tables
--   v1.1: Added phone/email fields to contacts
--   v1.2: Added status field with lead status integration 
