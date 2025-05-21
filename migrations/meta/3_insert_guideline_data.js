/**
 * Post-migration script for 3_insert_guideline_data.sql
 * This script links guidelines to specific exercise steps
 */
module.exports = async function(supabase) {
  console.log('Running post-migration for 3_insert_guideline_data...');
  
  try {
    // Fetch exercise steps
    const { data: steps, error: stepsError } = await supabase
      .from('exercise_steps')
      .select('id, order_index')
      .order('order_index', { ascending: true });
      
    if (stepsError) {
      throw new Error(`Failed to fetch exercise steps: ${stepsError.message}`);
    }
    
    if (!steps || steps.length === 0) {
      throw new Error('No exercise steps found in the database.');
    }
    
    console.log(`Found ${steps.length} exercise steps.`);
    
    // Get steps by index (or as many as we have)
    const step1 = steps[0]; // First step
    const step2 = steps.length > 1 ? steps[1] : null; // Second step
    const step4 = steps.length > 3 ? steps[3] : null; // Fourth step
    
    // Fetch guidelines
    const { data: guidelines, error: fetchError } = await supabase
      .from('guidelines')
      .select('id, title');
      
    if (fetchError) {
      throw new Error(`Failed to fetch guidelines: ${fetchError.message}`);
    }
    
    // Find specific guidelines by title
    const soothingGuideline = guidelines.find(g => g.title === 'Soothing');
    const observationGuideline = guidelines.find(g => g.title === 'Observation');
    const feelingsGuideline = guidelines.find(g => g.title === 'Feelings');
    
    if (!soothingGuideline || !observationGuideline || !feelingsGuideline) {
      throw new Error('Could not find all guideline pages.');
    }
    
    // Create the associations between steps and guidelines
    const stepGuidelinesData = [];
    
    if (step1) {
      stepGuidelinesData.push({
        step_id: step1.id,
        guideline_id: soothingGuideline.id,
        display_order: 0
      });
    }
    
    if (step2) {
      stepGuidelinesData.push({
        step_id: step2.id,
        guideline_id: observationGuideline.id,
        display_order: 0
      });
    }
    
    if (step4) {
      stepGuidelinesData.push({
        step_id: step4.id,
        guideline_id: feelingsGuideline.id,
        display_order: 0
      });
    }
    
    // Insert the step-guideline relationships
    const { data: inserted, error: insertError } = await supabase
      .from('step_guidelines')
      .upsert(stepGuidelinesData, { onConflict: ['step_id', 'guideline_id'] })
      .select();
      
    if (insertError) {
      throw new Error(`Failed to create step-guideline associations: ${insertError.message}`);
    }
    
    console.log(`Created ${inserted.length} step-guideline associations.`);
    return true;
    
  } catch (err) {
    console.error('Error in post-migration script:', err.message);
    throw err;
  }
};
