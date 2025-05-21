// Script to set up guideline tables and insert initial data
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupGuidelines() {
  console.log('Setting up guidelines feature...');
  
  try {
    // Step 1: Check if tables exist first
    console.log('Checking if guidelines table exists...');
    const { data: tablesData, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.error('Error checking tables:', tablesError.message);
      return;
    }
    
    const tableNames = tablesData.map(t => t.table_name);
    const hasGuidelinesTable = tableNames.includes('guidelines');
    const hasStepGuidelinesTable = tableNames.includes('step_guidelines');
    
    console.log('Tables in database:', tableNames);
    console.log('Guidelines table exists:', hasGuidelinesTable);
    console.log('Step guidelines table exists:', hasStepGuidelinesTable);
    
    // Step 2: If tables don't exist, we need to create them via Supabase dashboard
    if (!hasGuidelinesTable || !hasStepGuidelinesTable) {
      console.log('\nPlease create the following tables in your Supabase dashboard:');
      console.log('\n1. guidelines table:');
      console.log('   - id: uuid, primary key, default: uuid_generate_v4()');
      console.log('   - title: text, not null');
      console.log('   - content: text, not null');
      console.log('   - created_at: timestamp with time zone, default: now()');
      
      console.log('\n2. step_guidelines table:');
      console.log('   - id: uuid, primary key, default: uuid_generate_v4()');
      console.log('   - step_id: uuid, not null, references exercise_steps(id) on delete cascade');
      console.log('   - guideline_id: uuid, not null, references guidelines(id) on delete cascade');
      console.log('   - display_order: integer, default: 0');
      console.log('   - Add a unique constraint on (step_id, guideline_id)');
      
      console.log('\nThen enable Row Level Security (RLS) on both tables and add select policies to allow public access.');
      console.log('After creating the tables, run this script again to add the sample data.');
      return;
    }
    
    // Step 3: Insert sample guideline data
    console.log('\nInserting sample guidelines...');
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
    
    const { data: guidelinesInserted, error: guidelinesError } = await supabase
      .from('guidelines')
      .upsert(guidelinesData, { onConflict: 'title' })
      .select();
    
    if (guidelinesError) {
      console.error('Error inserting guidelines:', guidelinesError.message);
      return;
    }
    
    console.log(`Inserted ${guidelinesInserted.length} guidelines:`, guidelinesInserted);
    
    // Step 4: Get the exercise steps
    console.log('\nFetching exercise steps...');
    const { data: steps, error: stepsError } = await supabase
      .from('exercise_steps')
      .select('id, exercise_id, order_index')
      .order('order_index', { ascending: true });
    
    if (stepsError) {
      console.error('Error fetching steps:', stepsError.message);
      return;
    }
    
    if (!steps || steps.length === 0) {
      console.error('No exercise steps found in database');
      return;
    }
    
    console.log(`Found ${steps.length} exercise steps`);
    
    // Get first 4 steps (or as many as we have)
    const step1 = steps[0];
    const step2 = steps.length > 1 ? steps[1] : null;
    const step4 = steps.length > 3 ? steps[3] : null;
    
    if (!step1) {
      console.error('Not enough steps available');
      return;
    }
    
    // Step 5: Get the guideline IDs
    console.log('\nFetching guidelines...');
    const { data: guidelines, error: fetchError } = await supabase
      .from('guidelines')
      .select('id, title');
    
    if (fetchError) {
      console.error('Error fetching guidelines:', fetchError.message);
      return;
    }
    
    const soothingGuideline = guidelines.find(g => g.title === 'Soothing');
    const observationGuideline = guidelines.find(g => g.title === 'Observation');
    const feelingsGuideline = guidelines.find(g => g.title === 'Feelings');
    
    if (!soothingGuideline || !observationGuideline || !feelingsGuideline) {
      console.error('Could not find all guideline pages');
      return;
    }
    
    // Step 6: Create the associations
    console.log('\nCreating step-guideline associations...');
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
    
    if (stepGuidelinesData.length === 0) {
      console.error('No step-guideline associations to create');
      return;
    }
    
    const { data: relationshipsInserted, error: relationshipsError } = await supabase
      .from('step_guidelines')
      .upsert(stepGuidelinesData, { onConflict: ['step_id', 'guideline_id'] })
      .select();
    
    if (relationshipsError) {
      console.error('Error creating associations:', relationshipsError.message);
      return;
    }
    
    console.log(`Created ${relationshipsInserted.length} step-guideline associations:`, relationshipsInserted);
    console.log('\nGuidelines setup complete!');
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the function
setupGuidelines().catch(err => {
  console.error('Script execution error:', err);
});
