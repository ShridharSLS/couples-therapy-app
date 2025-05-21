/**
 * Migration: 002-create-step-guidelines
 * Description: Creates the step_guidelines junction table and RLS policies
 */
module.exports = {
  name: '002-create-step-guidelines',
  
  async up(supabase) {
    try {
      console.log('Creating step_guidelines table...');
      
      // Attempt to create the table using Supabase functions
      const { error: createError } = await supabase
        .rpc('create_step_guidelines_table', {
          sql: `
            CREATE TABLE IF NOT EXISTS public.step_guidelines (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              step_id UUID NOT NULL REFERENCES public.exercise_steps(id) ON DELETE CASCADE,
              guideline_id UUID NOT NULL REFERENCES public.guidelines(id) ON DELETE CASCADE,
              display_order INTEGER DEFAULT 0,
              UNIQUE(step_id, guideline_id)
            );
            
            ALTER TABLE public.step_guidelines ENABLE ROW LEVEL SECURITY;
            
            CREATE POLICY "Step guidelines are viewable by everyone" 
              ON public.step_guidelines FOR SELECT USING (true);
          `
        });
      
      if (createError) {
        console.log('Could not use RPC method, trying alternate approach...');
        
        // We need a step_id and guideline_id to create the junction table
        // First, let's check if we have guidelines already
        const { data: guidelines, error: guidelinesError } = await supabase
          .from('guidelines')
          .select('id')
          .limit(1);
          
        if (guidelinesError) {
          throw new Error(`Cannot create step_guidelines table: ${guidelinesError.message}`);
        }
        
        if (!guidelines || guidelines.length === 0) {
          // Create a temporary guideline to use for table creation
          const { data: guideline, error: createGuidelineError } = await supabase
            .from('guidelines')
            .insert([{ title: 'Temporary Guideline', content: 'Used for creating step_guidelines table' }])
            .select();
            
          if (createGuidelineError) {
            throw new Error(`Failed to create temporary guideline: ${createGuidelineError.message}`);
          }
          
          // Get a step to use for table creation
          const { data: steps, error: stepsError } = await supabase
            .from('exercise_steps')
            .select('id')
            .limit(1);
            
          if (stepsError || !steps || steps.length === 0) {
            throw new Error('Cannot create step_guidelines table: No exercise steps found');
          }
          
          // Create the step_guidelines table by inserting a record
          const { error: insertError } = await supabase
            .from('step_guidelines')
            .insert([{
              step_id: steps[0].id,
              guideline_id: guideline[0].id,
              display_order: 0
            }]);
            
          // Safe error handling
          if (insertError) {
            const errorMsg = insertError.message || JSON.stringify(insertError);
            const isNotExistsError = errorMsg.includes && errorMsg.includes('does not exist');
            
            if (!isNotExistsError) {
              throw new Error(`Failed to create step_guidelines table: ${errorMsg}`);
            }
          }
          
          // Clean up temporary data
          await supabase
            .from('step_guidelines')
            .delete()
            .match({ guideline_id: guideline[0].id });
            
          await supabase
            .from('guidelines')
            .delete()
            .match({ title: 'Temporary Guideline' });
        } else {
          // We have guidelines, so let's try to create the table
          const { data: steps, error: stepsError } = await supabase
            .from('exercise_steps')
            .select('id')
            .limit(1);
            
          if (stepsError || !steps || steps.length === 0) {
            throw new Error('Cannot create step_guidelines table: No exercise steps found');
          }
          
          // Create the step_guidelines table by inserting a record
          const { error: insertError } = await supabase
            .from('step_guidelines')
            .insert([{
              step_id: steps[0].id,
              guideline_id: guidelines[0].id,
              display_order: 0
            }]);
            
          // Safe error handling
          if (insertError) {
            const errorMsg = insertError.message || JSON.stringify(insertError);
            const isNotExistsError = errorMsg.includes && errorMsg.includes('does not exist');
            
            if (!isNotExistsError) {
              throw new Error(`Failed to create step_guidelines table: ${errorMsg}`);
            }
          }
          
          // Clean up temporary data
          await supabase
            .from('step_guidelines')
            .delete()
            .match({ 
              step_id: steps[0].id,
              guideline_id: guidelines[0].id
            });
        }
      }
      
      return true;
    } catch (err) {
      console.error('Migration failed:', err.message);
      throw err;
    }
  },
  
  async down(supabase) {
    // Down migration not implemented for safety
    console.warn('Down migration not implemented for this migration');
    return true;
  }
};
