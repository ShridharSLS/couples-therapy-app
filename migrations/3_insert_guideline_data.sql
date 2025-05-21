-- Migration: 3_insert_guideline_data
-- Description: Inserts initial guideline data and links them to exercise steps
-- Date: 2025-05-20

-- Insert sample guideline data
INSERT INTO guidelines (title, content)
VALUES 
  ('Soothing', 'test1'),
  ('Observation', 'test2'),
  ('Feelings', 'test3')
ON CONFLICT (title) DO NOTHING;

-- Link guidelines to steps (will be executed by the migration runner with JavaScript)

-- Record this migration
INSERT INTO schema_migrations (version) VALUES ('3_insert_guideline_data');
