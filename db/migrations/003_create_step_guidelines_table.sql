-- Migration: 003_create_step_guidelines_table
-- Description: Creates the step_guidelines junction table to link exercise steps to guidelines
-- Created: 2025-05-20

-- Create the step_guidelines junction table
CREATE TABLE IF NOT EXISTS public.step_guidelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  step_id UUID NOT NULL REFERENCES public.exercise_steps(id) ON DELETE CASCADE,
  guideline_id UUID NOT NULL REFERENCES public.guidelines(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  UNIQUE(step_id, guideline_id)
);

-- Enable Row Level Security
ALTER TABLE public.step_guidelines ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE schemaname = 'public' 
    AND tablename = 'step_guidelines' 
    AND policyname = 'Step guidelines are viewable by everyone'
  ) THEN
    CREATE POLICY "Step guidelines are viewable by everyone" 
      ON public.step_guidelines FOR SELECT USING (true);
  END IF;
END
$$;

-- Insert this migration into the schema_migrations table
INSERT INTO public.schema_migrations (name) 
VALUES ('003_create_step_guidelines_table')
ON CONFLICT (name) DO NOTHING;
