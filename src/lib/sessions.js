import { supabase } from './supabaseClient'

/**
 * Create a new therapy session
 */
export async function createSession(sessionCode) {
  const { data, error } = await supabase
    .from('sessions')
    .insert({ session_code: sessionCode })
    .select()
    
  if (error) {
    console.error('Error creating session:', error)
    return null
  }
  
  return data?.[0] || null
}

/**
 * Save a response from one of the partners
 */
export async function saveSessionResponse(sessionId, exerciseId, stepIndex, partner, value) {
  if (!sessionId || !exerciseId || stepIndex === undefined) return null
  
  // Check if a response already exists for this session, exercise, and step
  const { data: existing } = await supabase
    .from('session_responses')
    .select('*')
    .eq('session_id', sessionId)
    .eq('exercise_id', exerciseId)
    .eq('step_index', stepIndex)
    .maybeSingle()
    
  if (existing) {
    // Update existing response
    const updateData = {}
    if (partner === 'partner1') {
      updateData.partner1_response = value
    } else if (partner === 'partner2') {
      updateData.partner2_response = value
    }
    
    const { data, error } = await supabase
      .from('session_responses')
      .update(updateData)
      .eq('id', existing.id)
      .select()
      
    if (error) {
      console.error('Error updating response:', error)
      return null
    }
    
    return data?.[0] || null
  } else {
    // Create new response
    const insertData = {
      session_id: sessionId,
      exercise_id: exerciseId,
      step_index: stepIndex
    }
    
    if (partner === 'partner1') {
      insertData.partner1_response = value
    } else if (partner === 'partner2') {
      insertData.partner2_response = value
    }
    
    const { data, error } = await supabase
      .from('session_responses')
      .insert(insertData)
      .select()
      
    if (error) {
      console.error('Error creating response:', error)
      return null
    }
    
    return data?.[0] || null
  }
}

/**
 * Get all responses for a session and exercise
 */
export async function getSessionResponses(sessionId, exerciseId) {
  if (!sessionId || !exerciseId) return []
  
  const { data, error } = await supabase
    .from('session_responses')
    .select('*')
    .eq('session_id', sessionId)
    .eq('exercise_id', exerciseId)
    .order('step_index', { ascending: true })
    
  if (error) {
    console.error('Error fetching responses:', error)
    return []
  }
  
  return data || []
}
