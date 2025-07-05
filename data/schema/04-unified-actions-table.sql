-- Migration to create unified actions table
-- This replaces both reminders and activities tables with a single, more flexible approach
-- Run this in your Supabase SQL editor

-- Create the unified actions table
CREATE TABLE actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  
  -- Core action info
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT, -- Space-separated tags like "high-priority medicare consultation"
  
  -- Time tracking
  start_date TIMESTAMP WITH TIME ZONE, -- When action is planned/due (can be null)
  end_date TIMESTAMP WITH TIME ZONE, -- Optional end time for scheduled actions
  completed_date TIMESTAMP WITH TIME ZONE, -- When action was actually completed
  
  -- Status and metadata
  status TEXT CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled', 'overdue')) DEFAULT 'planned',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  duration DECIMAL(4,2), -- Hours (e.g., 1.5 for 1 hour 30 minutes)
  outcome TEXT, -- Result/outcome of the action
  
  -- Metadata
  source TEXT DEFAULT 'Manual',
  metadata JSONB
);

-- Create indexes for better performance
CREATE INDEX idx_actions_contact_id ON actions(contact_id);
CREATE INDEX idx_actions_start_date ON actions(start_date);
CREATE INDEX idx_actions_completed_date ON actions(completed_date);
CREATE INDEX idx_actions_status ON actions(status);
CREATE INDEX idx_actions_tags ON actions USING GIN(to_tsvector('english', tags));

-- Enable Row Level Security
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;

-- Create security policies
CREATE POLICY "Allow public read access to actions" ON actions FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to actions" ON actions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to actions" ON actions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to actions" ON actions FOR DELETE USING (true);

-- Migrate existing reminders to actions
INSERT INTO actions (
  id, created_at, updated_at, contact_id, title, description, tags,
  start_date, completed_date, status, priority, source
)
SELECT 
  id, created_at, updated_at, contact_id, title, description,
  CASE 
    WHEN reminder_type IS NOT NULL THEN CONCAT('reminder ', reminder_type)
    ELSE 'reminder'
  END as tags,
  reminder_date as start_date,
  completed_date,
  CASE 
    WHEN is_complete THEN 'completed'
    WHEN reminder_date < NOW() THEN 'overdue'
    ELSE 'planned'
  END as status,
  priority,
  reminder_source as source
FROM reminders;

-- Migrate existing activities to actions (if any exist)
INSERT INTO actions (
  id, created_at, updated_at, contact_id, title, description, tags,
  completed_date, status, duration, outcome, source
)
SELECT 
  id, created_at, updated_at, contact_id, title, description,
  activity_type as tags,
  activity_date as completed_date,
  'completed' as status,
  duration_minutes / 60.0 as duration, -- Convert minutes to hours
  outcome,
  'Manual' as source
FROM activities;

-- Note: Don't drop the old tables yet - keep them for backup until migration is verified
-- DROP TABLE reminders;
-- DROP TABLE activities; 
