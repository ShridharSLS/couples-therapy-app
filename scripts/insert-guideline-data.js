// Script to insert initial guideline data
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function insertGuidelineData() {
  console.log('Inserting guideline data...');
  
  try {
    // Step 1: Insert the guideline pages
    const guidelinesData = [
      {
        title: 'Soothing',
        content: 'test1'
      },
      {
        title: 'Observation',
        content: 'test2'
      },
      {
        title: 'Feelings',
        content: 'test3'
      }
    ];
    
    console.log('Adding guideline pages...');
    const { data: guidelinesInserted, error: guidelinesError } = await supabase
      .from('guidelines')
      .upsert(guidelinesData, { onConflict: 'title' })
      .select();
    
    if (guidelinesError) {
      throw guidelinesError;
    }
    
    console.log(`Added ${guidelinesInserted.length} guideline pages successfully.`);
    
    // Step 2: Get the IDs of the inserted guidelines
    const { data: guidelines, error: fetchError } = await supabase
      .from('guidelines')
      .select('id, title');
    
    if (fetchError) {
      throw fetchError;
    }
    
    // Step 3: Get the step IDs for steps 1, 2, and 4
    const { data: steps, error: stepsError } = await supabase
      .from('exercise_steps')
      .select('id, order_index')
      .order('order_index', { ascending: true });
    
    if (stepsError) {
      throw stepsError;
    }
    
    if (!steps || steps.length < 4) {
      throw new Error('Not enough exercise steps found. Need at least 4 steps.');
    }
    
    // Find steps with order_index 0, 1, and 3 (steps 1, 2, and 4)
    const step1 = steps.find(s => s.order_index === 0);
    const step2 = steps.find(s => s.order_index === 1);
    const step4 = steps.find(s => s.order_index === 3);
    
    if (!step1 || !step2 || !step4) {
      throw new Error('Could not find steps with order_index 0, 1, and 3');
    }
    
    // Find guideline IDs
    const soothingGuideline = guidelines.find(g => g.title === 'Soothing');
    const observationGuideline = guidelines.find(g => g.title === 'Observation');
    const feelingsGuideline = guidelines.find(g => g.title === 'Feelings');
    
    if (!soothingGuideline || !observationGuideline || !feelingsGuideline) {
      throw new Error('Could not find all guideline pages');
    }
    
    // Step 4: Create the relationships between steps and guidelines
    const stepGuidelinesData = [
      {
        step_id: step1.id,
        guideline_id: soothingGuideline.id,
        display_order: 0
      },
      {
        step_id: step2.id,
        guideline_id: observationGuideline.id,
        display_order: 0
      },
      {
        step_id: step4.id,
        guideline_id: feelingsGuideline.id,
        display_order: 0
      }
    ];
    
    console.log('Creating step-guideline relationships...');
    const { data: relationshipsInserted, error: relationshipsError } = await supabase
      .from('step_guidelines')
      .upsert(stepGuidelinesData, { onConflict: ['step_id', 'guideline_id'] })
      .select();
    
    if (relationshipsError) {
      throw relationshipsError;
    }
    
    console.log(`Created ${relationshipsInserted.length} step-guideline relationships successfully.`);
    console.log('Guideline data inserted successfully!');
    
  } catch (err) {
    console.error('Error inserting guideline data:', err.message);
  }
}

// Run the function
insertGuidelineData().catch(err => {
  console.error('Script execution error:', err);
});
