// A simplified migration script for Supabase
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('URL:', supabaseUrl);
console.log('Key (first 5 chars):', serviceRoleKey.substring(0, 5));

// Simple Supabase client
const supabase = createClient(supabaseUrl, serviceRoleKey);

// Load our exercise data
const exercisesPath = path.join(__dirname, '../src/data/exercises.json');
const exercises = JSON.parse(fs.readFileSync(exercisesPath, 'utf8'));

// Simple function to add an exercise
async function addExercise(exercise) {
  console.log(`Trying to add exercise: ${exercise.title}`);
  
  try {
    // First insert the exercise
    const { data: exerciseData, error: exerciseError } = await supabase
      .from('exercises')
      .insert({
        title: exercise.title,
        description: exercise.description || ''
      })
      .select();
    
    if (exerciseError) {
      console.error('Error adding exercise:', exerciseError);
      return;
    }
    
    console.log('Success! Exercise added with ID:', exerciseData[0].id);
    return exerciseData[0].id;
  } catch (err) {
    console.error('Exception:', err);
  }
}

// Run a simple test
async function run() {
  try {
    // Test a simple select query first
    console.log('Testing simple query...');
    const { data, error } = await supabase.from('exercises').select('*').limit(1);
    
    if (error) {
      console.error('Error with test query:', error);
      return;
    }
    
    console.log('Test query successful! Current data count:', data.length);
    
    // Try adding the first exercise
    const firstExercise = exercises[0];
    const id = await addExercise(firstExercise);
    
    if (id) {
      console.log('Migration successful for first exercise!');
    }
  } catch (err) {
    console.error('Top level error:', err);
  }
}

// Run our migration
run();
