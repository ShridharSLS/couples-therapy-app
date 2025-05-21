-- Migration: 005_link_guidelines_to_steps
-- Description: Links sample guidelines to specific exercise steps
-- Created: 2025-05-20

-- This migration will link:
-- 1. "Soothing" guideline to the first step (order_index = 0)
-- 2. "Observation" guideline to the second step (order_index = 1)
-- 3. "Feelings" guideline to the fourth step (order_index = 3)

-- Helper function to link guidelines to steps
DO $$
DECLARE
    step1_id UUID;
    step2_id UUID;
    step4_id UUID;
    soothing_id UUID;
    observation_id UUID;
    feelings_id UUID;
BEGIN
    -- Get step IDs
    SELECT id INTO step1_id FROM public.exercise_steps WHERE order_index = 0 LIMIT 1;
    SELECT id INTO step2_id FROM public.exercise_steps WHERE order_index = 1 LIMIT 1;
    SELECT id INTO step4_id FROM public.exercise_steps WHERE order_index = 3 LIMIT 1;
    
    -- Get guideline IDs
    SELECT id INTO soothing_id FROM public.guidelines WHERE title = 'Soothing' LIMIT 1;
    SELECT id INTO observation_id FROM public.guidelines WHERE title = 'Observation' LIMIT 1;
    SELECT id INTO feelings_id FROM public.guidelines WHERE title = 'Feelings' LIMIT 1;
    
    -- Create associations if all IDs are found
    IF step1_id IS NOT NULL AND soothing_id IS NOT NULL THEN
        INSERT INTO public.step_guidelines (step_id, guideline_id, display_order)
        VALUES (step1_id, soothing_id, 0)
        ON CONFLICT (step_id, guideline_id) DO NOTHING;
    END IF;
    
    IF step2_id IS NOT NULL AND observation_id IS NOT NULL THEN
        INSERT INTO public.step_guidelines (step_id, guideline_id, display_order)
        VALUES (step2_id, observation_id, 0)
        ON CONFLICT (step_id, guideline_id) DO NOTHING;
    END IF;
    
    IF step4_id IS NOT NULL AND feelings_id IS NOT NULL THEN
        INSERT INTO public.step_guidelines (step_id, guideline_id, display_order)
        VALUES (step4_id, feelings_id, 0)
        ON CONFLICT (step_id, guideline_id) DO NOTHING;
    END IF;
END
$$;

-- Insert this migration into the schema_migrations table
INSERT INTO public.schema_migrations (name) 
VALUES ('005_link_guidelines_to_steps')
ON CONFLICT (name) DO NOTHING;
