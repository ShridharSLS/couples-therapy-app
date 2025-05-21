-- Migration: 002_create_guidelines_table
-- Description: Creates the guidelines table for storing guideline content
-- Created: 2025-05-20

-- Create the guidelines table
CREATE TABLE IF NOT EXISTS public.guidelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.guidelines ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE schemaname = 'public' 
    AND tablename = 'guidelines' 
    AND policyname = 'Guidelines are viewable by everyone'
  ) THEN
    CREATE POLICY "Guidelines are viewable by everyone" 
      ON public.guidelines FOR SELECT USING (true);
  END IF;
END
$$;

-- Insert this migration into the schema_migrations table
INSERT INTO public.schema_migrations (name) 
VALUES ('002_create_guidelines_table')
ON CONFLICT (name) DO NOTHING;
