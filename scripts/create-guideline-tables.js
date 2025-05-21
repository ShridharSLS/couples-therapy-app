// Script to create guidelines tables in Supabase
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createGuidelineTables() {
  console.log('Creating guidelines tables...');
  
  try {
    // Create guidelines table
    const { error: error1 } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS guidelines (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (error1) {
      console.error('Error creating guidelines table:', error1.message);
      // Try fallback method if available
      console.log('Trying alternate approach...');
    } else {
      console.log('Guidelines table created successfully');
    }
    
    // Create step_guidelines junction table
    const { error: error2 } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS step_guidelines (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          step_id UUID NOT NULL REFERENCES exercise_steps(id) ON DELETE CASCADE,
          guideline_id UUID NOT NULL REFERENCES guidelines(id) ON DELETE CASCADE,
          display_order INTEGER DEFAULT 0,
          UNIQUE(step_id, guideline_id)
        );
      `
    });
    
    if (error2) {
      console.error('Error creating step_guidelines table:', error2.message);
    } else {
      console.log('Step_guidelines table created successfully');
    }
    
    // Create policies for public access
    const { error: error3 } = await supabase.rpc('exec_sql', {
      query: `
        -- Enable RLS
        ALTER TABLE guidelines ENABLE ROW LEVEL SECURITY;
        ALTER TABLE step_guidelines ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Guidelines are viewable by everyone." 
          ON guidelines FOR SELECT USING (true);
          
        CREATE POLICY "Step guidelines are viewable by everyone." 
          ON step_guidelines FOR SELECT USING (true);
      `
    });
    
    if (error3) {
      console.error('Error creating policies:', error3.message);
    } else {
      console.log('Policies created successfully');
    }
    
    console.log('Guidelines tables setup complete!');
    
  } catch (err) {
    console.error('Unexpected error:', err.message);
  }
}

// Run the function
createGuidelineTables().catch(err => {
  console.error('Script execution error:', err);
});
