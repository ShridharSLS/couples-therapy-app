-- Migration: 2_create_guidelines_tables
-- Description: Creates guidelines and step_guidelines tables
-- Date: 2025-05-20

-- Create guidelines table
CREATE TABLE IF NOT EXISTS guidelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create step_guidelines junction table
CREATE TABLE IF NOT EXISTS step_guidelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  step_id UUID NOT NULL REFERENCES exercise_steps(id) ON DELETE CASCADE,
  guideline_id UUID NOT NULL REFERENCES guidelines(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  UNIQUE(step_id, guideline_id)
);

-- Enable Row Level Security
ALTER TABLE guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE step_guidelines ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Guidelines are viewable by everyone" 
  ON guidelines FOR SELECT USING (true);
  
CREATE POLICY "Step guidelines are viewable by everyone" 
  ON step_guidelines FOR SELECT USING (true);

-- Record this migration
INSERT INTO schema_migrations (version) VALUES ('2_create_guidelines_tables');
