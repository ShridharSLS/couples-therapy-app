/**
 * Guideline Tables Setup Script
 * 
 * This script creates the guideline tables and inserts sample data in one go.
 * It uses Supabase's JavaScript client without relying on SQL execution.
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Supabase client setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Missing Supabase environment variables.');
  console.error('Make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY defined in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample guideline data
const sampleGuidelines = [
  { title: 'Soothing', content: 'test1' },
  { title: 'Observation', content: 'test2' },
  { title: 'Feelings', content: 'test3' }
];

/**
 * Setup for the guideline tables
 */
async function setupGuidelineTables() {
  console.log('===== Setting up Guideline Tables =====');
  
  try {
    // 1. Create or confirm the guidelines table exists
    console.log('\nSetting up guidelines table...');
    await ensureTable('guidelines', { 
      title: 'Temporary Title',
      content: 'Temporary content for table creation',
      created_at: new Date().toISOString()
    });
    
    // 2. Insert sample guideline data
    console.log('\nInserting sample guidelines...');
    const { data: guidelinesData, error: insertError } = await supabase
      .from('guidelines')
      .upsert(sampleGuidelines, { onConflict: 'title' })
      .select();
      
    if (insertError) {
      console.error('Error inserting guidelines:', insertError.message);
    } else {
      console.log(`✓ Inserted ${guidelinesData.length} guidelines.`);
      
      // Log the inserted data for confirmation
      guidelinesData.forEach(g => {
        console.log(`  - ${g.title}: ${g.id}`);
      });
    }
    
    // 3. Create or confirm the step_guidelines table exists
    console.log('\nSetting up step_guidelines table...');
    
    // Get a step ID and guideline ID for creating the junction table
    const { data: steps } = await supabase
      .from('exercise_steps')
      .select('id')
      .limit(1);
      
    if (!steps || steps.length === 0) {
      console.error('Error: No exercise steps found in the database.');
      console.error('Please create exercise steps first before setting up guideline tables.');
      return;
    }
    
    const stepId = steps[0].id;
    
    if (!guidelinesData || guidelinesData.length === 0) {
      // Try to get existing guidelines if insert failed
      const { data: existingGuidelines } = await supabase
        .from('guidelines')
        .select('id')
        .limit(1);
        
      if (!existingGuidelines || existingGuidelines.length === 0) {
        console.error('Error: Could not find or create any guidelines.');
        return;
      }
      
      guidelineId = existingGuidelines[0].id;
    } else {
      guidelineId = guidelinesData[0].id;
    }
    
    // Create the junction table
    await ensureTable('step_guidelines', {
      step_id: stepId,
      guideline_id: guidelineId,
      display_order: 0
    });
    
    // 4. Link sample guidelines to specific steps
    console.log('\nLinking guidelines to exercise steps...');
    await linkGuidelinesToSteps();
    
    // 5. Give instructions for RLS policies
    console.log('\nIMPORTANT: You need to set up Row Level Security (RLS) policies in the Supabase dashboard:');
    console.log('1. Enable RLS on the guidelines and step_guidelines tables');
    console.log('2. Add policies for public SELECT access on both tables');
    
    console.log('\n===== Setup Complete =====');
    
  } catch (err) {
    console.error('Setup failed:', err.message || err);
    process.exit(1);
  }
}

/**
 * Ensures a table exists by attempting an insert with placeholder data
 */
async function ensureTable(tableName, sampleData) {
  try {
    // First check if table already exists
    const { error: checkError } = await supabase
      .from(tableName)
      .select('id')
      .limit(1);
      
    if (!checkError) {
      console.log(`✓ Table '${tableName}' already exists.`);
      return true;
    }
    
    // If we get here, table probably doesn't exist, so try to create it with an insert
    console.log(`Creating '${tableName}' table...`);
    
    const { error: createError } = await supabase
      .from(tableName)
      .insert([sampleData]);
      
    if (createError) {
      if (createError.message && createError.message.includes('does not exist')) {
        console.log(`Table '${tableName}' does not exist and could not be auto-created.`);
        console.log(`You may need to create it manually with the following structure:`);
        
        if (tableName === 'guidelines') {
          console.log(`
  guidelines:
    - id: uuid PRIMARY KEY DEFAULT uuid_generate_v4()
    - title: text NOT NULL
    - content: text NOT NULL
    - created_at: timestamp with time zone DEFAULT NOW()
          `);
        } else if (tableName === 'step_guidelines') {
          console.log(`
  step_guidelines:
    - id: uuid PRIMARY KEY DEFAULT uuid_generate_v4()
    - step_id: uuid NOT NULL REFERENCES exercise_steps(id) ON DELETE CASCADE
    - guideline_id: uuid NOT NULL REFERENCES guidelines(id) ON DELETE CASCADE
    - display_order: integer DEFAULT 0
    - UNIQUE(step_id, guideline_id)
          `);
        }
        
        return false;
      } else {
        throw new Error(`Failed to create ${tableName} table: ${createError.message}`);
      }
    }
    
    console.log(`✓ Successfully created '${tableName}' table.`);
    
    // Clean up temporary data
    await supabase
      .from(tableName)
      .delete()
      .match(tableName === 'guidelines' ? { title: sampleData.title } : { step_id: sampleData.step_id });
      
    return true;
  } catch (err) {
    console.error(`Error ensuring table ${tableName}:`, err.message || err);
    return false;
  }
}

/**
 * Link sample guidelines to specific exercise steps
 */
async function linkGuidelinesToSteps() {
  try {
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
      return;
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
      return;
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
      return;
    }
    
    // Insert the associations
    const { data: inserted, error: insertError } = await supabase
      .from('step_guidelines')
      .upsert(stepGuidelinesData, { onConflict: ['step_id', 'guideline_id'] })
      .select();
      
    if (insertError) {
      throw new Error(`Failed to create step-guideline associations: ${insertError.message}`);
    }
    
    console.log(`✓ Created ${inserted.length} step-guideline associations.`);
    
    // Log the created associations
    inserted.forEach(link => {
      const guideline = guidelines.find(g => g.id === link.guideline_id);
      const step = steps.find(s => s.id === link.step_id);
      console.log(`  - Linked "${guideline?.title}" to step ${step?.order_index + 1}`);
    });
    
  } catch (err) {
    console.error('Error linking guidelines to steps:', err.message || err);
  }
}

// Run the setup
setupGuidelineTables().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
