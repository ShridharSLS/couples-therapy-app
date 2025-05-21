/**
 * Migration: 004-link-guidelines-to-steps
 * Description: Links sample guidelines to specific exercise steps
 */
module.exports = {
  name: '004-link-guidelines-to-steps',
  
  async up(supabase) {
    try {
      console.log('Linking guidelines to exercise steps...');
      
      // Get the exercise steps (we'll link guidelines to steps 1, 2, and 4)
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
      
      // Find specific steps by index
      const step1 = steps.find(s => s.order_index === 0);
      const step2 = steps.find(s => s.order_index === 1);
      const step4 = steps.length > 3 ? steps.find(s => s.order_index === 3) : null;
      
      if (!step1) {
        console.warn('Warning: Could not find first exercise step.');
        return true;
      }
      
      // Get the guidelines
      const { data: guidelines, error: guidelinesError } = await supabase
        .from('guidelines')
        .select('id, title');
        
      if (guidelinesError) {
        throw new Error(`Failed to fetch guidelines: ${guidelinesError.message}`);
      }
      
      // Find specific guidelines
      const soothingGuideline = guidelines.find(g => g.title === 'Soothing');
      const observationGuideline = guidelines.find(g => g.title === 'Observation');
      const feelingsGuideline = guidelines.find(g => g.title === 'Feelings');
      
      if (!soothingGuideline || !observationGuideline || !feelingsGuideline) {
        console.warn('Warning: Could not find all guideline types.');
        return true;
      }
      
      // Create the step-guideline associations
      const stepGuidelinesData = [];
      
      if (step1 && soothingGuideline) {
        stepGuidelinesData.push({
          step_id: step1.id,
          guideline_id: soothingGuideline.id,
          display_order: 0
        });
      }
      
      if (step2 && observationGuideline) {
        stepGuidelinesData.push({
          step_id: step2.id,
          guideline_id: observationGuideline.id,
          display_order: 0
        });
      }
      
      if (step4 && feelingsGuideline) {
        stepGuidelinesData.push({
          step_id: step4.id,
          guideline_id: feelingsGuideline.id,
          display_order: 0
        });
      }
      
      if (stepGuidelinesData.length === 0) {
        console.warn('Warning: No valid step-guideline associations to create.');
        return true;
      }
      
      // Insert the associations
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
      console.error('Migration failed:', err.message);
      throw err;
    }
  },
  
  async down(supabase) {
    try {
      // Get the guidelines we want to unlink
      const { data: guidelines } = await supabase
        .from('guidelines')
        .select('id')
        .in('title', ['Soothing', 'Observation', 'Feelings']);
        
      if (!guidelines || guidelines.length === 0) {
        return true;
      }
      
      const guidelineIds = guidelines.map(g => g.id);
      
      // Remove links
      const { error } = await supabase
        .from('step_guidelines')
        .delete()
        .in('guideline_id', guidelineIds);
        
      if (error) {
        throw new Error(`Failed to remove step-guideline associations: ${error.message}`);
      }
      
      return true;
    } catch (err) {
      console.error('Down migration failed:', err.message);
      throw err;
    }
  }
};
