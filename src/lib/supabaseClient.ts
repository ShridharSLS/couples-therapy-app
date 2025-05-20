import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to get all exercises
export const getAllExercises = async () => {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .order('title')
  
  if (error) {
    console.error('Error fetching exercises:', error)
    throw error
  }
  
  return data || []
}

// Helper function to get a single exercise with its steps
export const getExerciseWithSteps = async (exerciseId: string) => {
  // Get the exercise
  const { data: exerciseData, error: exerciseError } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', exerciseId)
    .single()
  
  if (exerciseError) {
    console.error('Error fetching exercise:', exerciseError)
    throw exerciseError
  }
  
  // Get the steps for this exercise
  const { data: stepsData, error: stepsError } = await supabase
    .from('exercise_steps')
    .select('*')
    .eq('exercise_id', exerciseId)
    .order('order_index', { ascending: true })
  
  if (stepsError) {
    console.error('Error fetching steps:', stepsError)
    throw stepsError
  }
  
  // Combine exercise with its steps
  return {
    ...exerciseData,
    steps: stepsData || []
  }
}

// Helper function to save session response
export const saveSessionResponse = async (sessionId: string, exerciseId: string, stepIndex: number, response: any) => {
  const { data, error } = await supabase
    .from('session_responses')
    .upsert({
      session_id: sessionId,
      exercise_id: exerciseId,
      step_index: stepIndex,
      partner1_response: response.partner1,
      partner2_response: response.partner2,
      completed: response.finished || false,
      updated_at: new Date()
    }, { onConflict: 'session_id,exercise_id,step_index' })
  
  if (error) {
    console.error('Error saving session response:', error)
    throw error
  }
  
  return data
}

// Helper function to get session responses for an exercise
export const getSessionResponses = async (sessionId: string, exerciseId: string) => {
  const { data, error } = await supabase
    .from('session_responses')
    .select('*')
    .eq('session_id', sessionId)
    .eq('exercise_id', exerciseId)
    .order('step_index', { ascending: true })
  
  if (error) {
    console.error('Error fetching session responses:', error)
    throw error
  }
  
  return data || []
}
