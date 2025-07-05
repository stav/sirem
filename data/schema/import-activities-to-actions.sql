-- Migrate existing activities to actions table
INSERT INTO actions (
  id, 
  created_at, 
  updated_at, 
  contact_id, 
  title, 
  description, 
  tags,
  completed_date, 
--   status, 
  duration, 
  outcome, 
  source
)
SELECT 
  id, 
  created_at, 
  updated_at, 
  contact_id, 
  title, 
  description,
  activity_type as tags, -- Use activity_type as tags
  activity_date as completed_date, -- Use activity_date as completed_date
--   'completed' as status, -- Mark all imported activities as completed
  duration_minutes / 60.0 as duration, -- Convert minutes to hours
  outcome,
  'Import' as source -- Mark the source as Import
FROM activities
WHERE id NOT IN (SELECT id FROM actions); -- Avoid duplicates if running multiple times
