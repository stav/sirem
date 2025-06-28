-- Medicare CRM Database Setup
-- Run these commands in your Supabase SQL editor

-- Create contacts table
CREATE TABLE contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  notes TEXT
);

-- Create reminders table
CREATE TABLE reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  completed BOOLEAN DEFAULT false NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium' NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (you can modify these later for authentication)
CREATE POLICY "Allow public read access to contacts" ON contacts FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to contacts" ON contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to contacts" ON contacts FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to contacts" ON contacts FOR DELETE USING (true);

CREATE POLICY "Allow public read access to reminders" ON reminders FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to reminders" ON reminders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to reminders" ON reminders FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to reminders" ON reminders FOR DELETE USING (true);

-- Insert sample data (optional)
INSERT INTO contacts (first_name, last_name, email, phone, notes) VALUES
('John', 'Smith', 'john.smith@email.com', '(555) 123-4567', 'Interested in Medicare Advantage'),
('Mary', 'Johnson', 'mary.johnson@email.com', '(555) 234-5678', 'Needs Part D coverage'),
('Robert', 'Williams', 'robert.williams@email.com', '(555) 345-6789', 'Turning 65 next month'),
('Sarah', 'Brown', 'sarah.brown@email.com', '(555) 456-7890', 'Current client - annual review needed');

-- Insert sample reminders
INSERT INTO reminders (contact_id, title, description, due_date, priority) VALUES
((SELECT id FROM contacts WHERE first_name = 'John' LIMIT 1), 'Follow up on Medicare Advantage', 'Call to discuss plan options and answer questions', NOW() + INTERVAL '2 days', 'high'),
((SELECT id FROM contacts WHERE first_name = 'Mary' LIMIT 1), 'Part D enrollment reminder', 'Help with Part D prescription drug plan selection', NOW() + INTERVAL '1 week', 'medium'),
((SELECT id FROM contacts WHERE first_name = 'Robert' LIMIT 1), 'Initial Medicare consultation', 'First meeting to discuss Medicare options', NOW() + INTERVAL '3 days', 'high'),
((SELECT id FROM contacts WHERE first_name = 'Sarah' LIMIT 1), 'Annual policy review', 'Review current coverage and discuss any changes needed', NOW() + INTERVAL '2 weeks', 'low'); 
