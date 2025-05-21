-- Migration: 004_insert_sample_guidelines
-- Description: Inserts sample guideline data
-- Created: 2025-05-20

-- Insert sample guideline data if it doesn't already exist
INSERT INTO public.guidelines (title, content)
VALUES 
  ('Soothing', 'test1'),
  ('Observation', 'test2'),
  ('Feelings', 'test3')
ON CONFLICT (title) DO NOTHING;

-- Insert this migration into the schema_migrations table
INSERT INTO public.schema_migrations (name) 
VALUES ('004_insert_sample_guidelines')
ON CONFLICT (name) DO NOTHING;
