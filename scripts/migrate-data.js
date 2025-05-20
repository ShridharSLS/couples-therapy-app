// Script to migrate exercise data from JSON to Supabase
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Helper function to generate UUIDs compatible with older Node versions
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Initialize Supabase client with service role key (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials. Check your .env.local file.');
  console.error('Make sure to add your SUPABASE_SERVICE_ROLE_KEY to the .env.local file.');
  process.exit(1);
}

// Log configuration info (masking key for security)
const maskedKey = serviceRoleKey ? serviceRoleKey.substring(0, 10) + '...' : 'Not configured';
console.log(`Using Supabase URL: ${supabaseUrl}`);
console.log(`Service role key: ${maskedKey}`);

// Create client with the correct options
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// Test the connection
console.log('Testing Supabase connection...');
supabase.from('exercises').select('count').limit(1)
  .then(() => {
    console.log('Supabase connection successful!');
  })
  .catch(err => {
    console.error('Error connecting to Supabase:', err.message);
    console.error('Please check your URL and API key.');
    process.exit(1);
  });

async function migrateData() {
  try {
    // Read the JSON data
    const exercisesPath = path.join(__dirname, '../src/data/exercises.json');
    const exercisesData = JSON.parse(fs.readFileSync(exercisesPath, 'utf8'));
    
    console.log(`Found ${exercisesData.length} exercises to migrate...`);
    
    // Migrate each exercise
    for (const exercise of exercisesData) {
      console.log(`Migrating exercise: ${exercise.title || 'Unnamed exercise'}`);
      
      // Let's simplify and just let Supabase generate UUIDs automatically
      console.log(`  Inserting exercise: ${exercise.title}`);
      
      const { data: exerciseData, error: exerciseError } = await supabase
        .from('exercises')
        .insert({
          // Don't specify the ID and let Supabase generate one automatically
          title: exercise.title || 'Untitled Exercise',
          description: exercise.description || '',
          category: exercise.category || 'communication', // Default category
          difficulty: exercise.difficulty || 'medium', // Default difficulty
          estimated_time: exercise.estimatedTime || 20 // Default time in minutes
        })
        .select()
        .single();
      
      if (exerciseError) {
        console.error('Error inserting exercise:', exerciseError);
        continue;
      }
      
      // Insert the steps for this exercise
      if (Array.isArray(exercise.steps)) {
        console.log(`  Processing ${exercise.steps.length} steps...`);
        
        const stepsToInsert = exercise.steps.map((step, index) => ({
          exercise_id: exerciseData.id,
          activity: step.Activity || '',
          description: step.Description || '',
          how_much: step['How much?'] || '',
          language: step.Language || '',
          order_index: index
        }));
        
        // Insert steps in batches to avoid potential size limits
        const batchSize = 20;
        for (let i = 0; i < stepsToInsert.length; i += batchSize) {
          const batch = stepsToInsert.slice(i, i + batchSize);
          const { error: stepsError } = await supabase
            .from('exercise_steps')
            .insert(batch);
          
          if (stepsError) {
            console.error(`Error inserting steps batch ${i/batchSize + 1}:`, stepsError);
          } else {
            console.log(`  Added batch ${i/batchSize + 1} (${batch.length} steps)`);
          }
        }
      }
      
      console.log(`  Completed migration for: ${exercise.title}`);
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    console.error(error.stack);
  }
}

// Run the migration
migrateData();
