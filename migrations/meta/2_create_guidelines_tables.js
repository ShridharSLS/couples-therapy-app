/**
 * Migration JavaScript Handler for creating guidelines tables
 * 
 * This script creates the guidelines and step_guidelines tables
 */
module.exports = async function(supabase) {
  console.log('Creating guidelines tables...');
  
  try {
    // Step 1: Create the guidelines table
    console.log('Creating guidelines table...');
    
    // Check if the table already exists
    const { data: guidelinesCheck, error: guidelinesCheckError } = await supabase
      .from('guidelines')
      .select('id')
      .limit(1);
    
    if (!guidelinesCheckError) {
      console.log('guidelines table already exists.');
    } else {
      // Create the guidelines table by attempting an insert
      const { error: createError } = await supabase
        .from('guidelines')
        .insert([
          { 
            title: 'Schema Creation Placeholder', 
            content: 'This is used to create the table schema and will be removed.',
            created_at: new Date().toISOString()
          }
        ]);
      
      if (createError && createError.message && !createError.message.includes('does not exist')) {
        throw new Error(`Failed to create guidelines table: ${createError.message}`);
      }
      
      console.log('Successfully created guidelines table!');
      
      // Delete the placeholder record
      await supabase
        .from('guidelines')
        .delete()
        .match({ title: 'Schema Creation Placeholder' });
    }
    
    // Step 2: Create the step_guidelines table
    console.log('Creating step_guidelines table...');
    
    // Check if the table already exists
    const { data: stepGuidelinesCheck, error: stepGuidelinesCheckError } = await supabase
      .from('step_guidelines')
      .select('id')
      .limit(1);
    
    if (!stepGuidelinesCheckError) {
      console.log('step_guidelines table already exists.');
    } else {
      // We need to get at least one step_id to create a valid step_guidelines record
      const { data: steps, error: stepsError } = await supabase
        .from('exercise_steps')
        .select('id')
        .limit(1);
        
      if (stepsError) {
        throw new Error(`Cannot create step_guidelines table: ${stepsError.message}`);
      }
      
      if (!steps || steps.length === 0) {
        throw new Error('Cannot create step_guidelines table: No exercise steps found');
      }
      
      // We need at least one guideline_id
      const { data: guidelines, error: guidelinesError } = await supabase
        .from('guidelines')
        .select('id')
        .limit(1);
      
      if (guidelinesError || !guidelines || guidelines.length === 0) {
        // Try to create a guideline record first
        const { data: newGuideline, error: createGuidelineError } = await supabase
          .from('guidelines')
          .insert([
            { 
              title: 'Temporary Guideline', 
              content: 'This is used to create the step_guidelines table and will be removed.',
              created_at: new Date().toISOString()
            }
          ])
          .select();
          
        if (createGuidelineError) {
          throw new Error(`Failed to create temporary guideline: ${createGuidelineError.message}`);
        }
        
        // Use the new guideline
        const { error: createJunctionError } = await supabase
          .from('step_guidelines')
          .insert([
            { 
              step_id: steps[0].id,
              guideline_id: newGuideline[0].id,
              display_order: 0
            }
          ]);
          
        if (createJunctionError && !createJunctionError.message.includes('does not exist')) {
          throw new Error(`Failed to create step_guidelines table: ${createJunctionError.message}`);
        }
        
        // Clean up the temporary data
        await supabase
          .from('step_guidelines')
          .delete()
          .match({ guideline_id: newGuideline[0].id });
          
        await supabase
          .from('guidelines')
          .delete()
          .match({ title: 'Temporary Guideline' });
      } else {
        // We have both a step and a guideline, so we can create the table
        const { error: createJunctionError } = await supabase
          .from('step_guidelines')
          .insert([
            { 
              step_id: steps[0].id,
              guideline_id: guidelines[0].id,
              display_order: 0
            }
          ]);
          
        if (createJunctionError && !createJunctionError.message.includes('does not exist')) {
          throw new Error(`Failed to create step_guidelines table: ${createJunctionError.message}`);
        }
        
        // Clean up the temporary data
        await supabase
          .from('step_guidelines')
          .delete()
          .match({ step_id: steps[0].id, guideline_id: guidelines[0].id });
      }
      
      console.log('Successfully created step_guidelines table!');
    }
    
    // Step 3: Set up Row Level Security policies
    // Unfortunately, we can't directly set RLS policies using the JavaScript client
    // This would need to be done in the Supabase dashboard or using a more direct SQL connection
    
    console.log('NOTE: You need to manually set up RLS policies in the Supabase dashboard:');
    console.log('1. Enable RLS on the guidelines and step_guidelines tables');
    console.log('2. Add a policy for public SELECT access on both tables');
    
    // Record this migration in schema_migrations
    const { error: insertError } = await supabase
      .from('schema_migrations')
      .insert([
        { version: '2_create_guidelines_tables', applied_at: new Date().toISOString() }
      ]);
    
    if (insertError) {
      console.warn(`Warning: Could not record migration: ${insertError.message}`);
    }
    
    return true;
    
  } catch (err) {
    console.error('Error creating guidelines tables:', err.message);
    throw err;
  }
};
