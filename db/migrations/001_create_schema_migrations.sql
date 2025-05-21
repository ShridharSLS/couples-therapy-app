-- Migration: 001_create_schema_migrations
-- Description: Creates the schema_migrations table to track which migrations have been applied
-- Created: 2025-05-20

-- Create the schema_migrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.schema_migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert this migration into the schema_migrations table
INSERT INTO public.schema_migrations (name) 
VALUES ('001_create_schema_migrations')
ON CONFLICT (name) DO NOTHING;
