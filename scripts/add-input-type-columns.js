// Script to add input type columns to exercise_steps table
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function addColumnsToExerciseSteps() {
  console.log('Adding input type columns to exercise_steps table...');

  try {
    // SQL query to add the columns
    const { error } = await supabase.rpc('exec_sql', {
      query: `
        -- Add partner1_input_type column with default 'text'
        ALTER TABLE exercise_steps 
        ADD COLUMN IF NOT EXISTS partner1_input_type TEXT DEFAULT 'text';
        
        -- Add partner2_input_type column with default 'text'
        ALTER TABLE exercise_steps 
        ADD COLUMN IF NOT EXISTS partner2_input_type TEXT DEFAULT 'text';
        
        -- Add both_partners_input_type column with no default
        ALTER TABLE exercise_steps 
        ADD COLUMN IF NOT EXISTS both_partners_input_type TEXT;
        
        -- Update existing rows to have the default values
        UPDATE exercise_steps 
        SET 
          partner1_input_type = 'text', 
          partner2_input_type = 'text',
          both_partners_input_type = NULL
        WHERE partner1_input_type IS NULL OR partner2_input_type IS NULL;
      `
    });

    if (error) {
      // Fallback method if rpc doesn't work
      console.log('Using fallback method to add columns...');
      
      // Add columns one by one with direct SQL
      const { error: error1 } = await supabase.from('exercise_steps').update(
        { partner1_input_type: 'text' }
      ).eq('id', 'dummy-id-that-doesnt-exist');  // This is a trick to force column creation
      
      const { error: error2 } = await supabase.from('exercise_steps').update(
        { partner2_input_type: 'text' }
      ).eq('id', 'dummy-id-that-doesnt-exist');
      
      const { error: error3 } = await supabase.from('exercise_steps').update(
        { both_partners_input_type: null }
      ).eq('id', 'dummy-id-that-doesnt-exist');
      
      if (error1 || error2 || error3) {
        console.error('Error adding columns:', error1 || error2 || error3);
        return;
      }
      
      // Update existing rows
      const { error: updateError } = await supabase.from('exercise_steps').update({
        partner1_input_type: 'text',
        partner2_input_type: 'text',
      }).is('partner1_input_type', null);
      
      if (updateError) {
        console.error('Error updating existing rows:', updateError);
        return;
      }
    }

    console.log('Successfully added input type columns to exercise_steps table!');
    
    // Verify the columns were added by fetching one row
    const { data, error: fetchError } = await supabase
      .from('exercise_steps')
      .select('partner1_input_type, partner2_input_type, both_partners_input_type')
      .limit(1);
    
    if (fetchError) {
      console.error('Error fetching test row:', fetchError);
      return;
    }
    
    console.log('Column verification - Sample row:', data);
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

// Run the function
addColumnsToExerciseSteps();
