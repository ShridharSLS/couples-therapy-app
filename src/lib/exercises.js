import { supabase } from './supabaseClient'

/**
 * Get all exercises from the database
 */
export async function getAllExercises() {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .order('created_at', { ascending: false })
    
  if (error) {
    console.error('Error fetching exercises:', error)
    return []
  }
  
  return data || []
}

/**
 * Get a specific exercise by ID with its steps
 */
export async function getExerciseById(id) {
  if (!id) return null
  
  // Get exercise details
  const { data: exercise, error: exerciseError } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', id)
    .single()
    
  if (exerciseError) {
    console.error('Error fetching exercise:', exerciseError)
    return null
  }
  
  // Get steps for this exercise
  const { data: steps, error: stepsError } = await supabase
    .from('exercise_steps')
    .select('*')
    .eq('exercise_id', id)
    .order('order_index', { ascending: true })
    
  if (stepsError) {
    console.error('Error fetching exercise steps:', stepsError)
    return null
  }
  
  // Return exercise with its steps in the format expected by the app
  return {
    ...exercise,
    steps: steps || []
  }
}
