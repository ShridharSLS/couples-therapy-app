/**
 * Session Storage Utilities
 * 
 * This file contains utilities for storing session data in the browser's sessionStorage.
 * Data is automatically cleared when the browser tab or window is closed.
 */

// Define types for our response data
type InputResponse = string | boolean;

// Define types for more complex step responses
type PartnerResponses = {
  // Text inputs
  partner1Text?: string;
  partner2Text?: string;
  
  // Checkbox inputs
  partner1Checkbox?: boolean;
  partner2Checkbox?: boolean;
  
  // Shared checkbox for completion
  finished: boolean;
};

/**
 * Generate a consistent key for storing step responses
 */
const getStepKey = (sessionId: string, exerciseId: string, stepIndex: number): string => {
  return `therapy_session_${sessionId}_exercise_${exerciseId}_step_${stepIndex}`;
};

/**
 * Save a response to sessionStorage
 */
export const saveStepResponse = (
  sessionId: string,
  exerciseId: string,
  stepIndex: number,
  response: PartnerResponses
): void => {
  try {
    // Only proceed if sessionStorage is available (i.e., in a browser environment)
    if (typeof sessionStorage !== 'undefined') {
      const key = getStepKey(sessionId, exerciseId, stepIndex);
      sessionStorage.setItem(key, JSON.stringify(response));
    }
  } catch (error) {
    console.error('Error saving to sessionStorage:', error);
  }
};

/**
 * Get a response from sessionStorage
 */
export const getStepResponse = (
  sessionId: string,
  exerciseId: string,
  stepIndex: number
): PartnerResponses | null => {
  try {
    // Only proceed if sessionStorage is available
    if (typeof sessionStorage !== 'undefined') {
      const key = getStepKey(sessionId, exerciseId, stepIndex);
      const storedData = sessionStorage.getItem(key);
      
      if (storedData) {
        return JSON.parse(storedData);
      }
    }
    return null;
  } catch (error) {
    console.error('Error reading from sessionStorage:', error);
    return null;
  }
};

/**
 * Get all responses for a session/exercise combination
 */
export const getAllExerciseResponses = (sessionId: string, exerciseId: string): Record<number, PartnerResponses> => {
  try {
    const responses: Record<number, PartnerResponses> = {};
    
    // Only proceed if sessionStorage is available
    if (typeof sessionStorage !== 'undefined') {
      const prefix = `therapy_session_${sessionId}_exercise_${exerciseId}_step_`;
      
      // Iterate through all sessionStorage items
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        
        if (key && key.startsWith(prefix)) {
          // Extract step index from key
          const stepIndex = parseInt(key.replace(prefix, ''), 10);
          const storedData = sessionStorage.getItem(key);
          
          if (!isNaN(stepIndex) && storedData) {
            responses[stepIndex] = JSON.parse(storedData);
          }
        }
      }
    }
    
    return responses;
  } catch (error) {
    console.error('Error getting all responses from sessionStorage:', error);
    return {};
  }
};

/**
 * Clear all responses for a session
 */
export const clearSessionResponses = (sessionId: string): void => {
  try {
    // Only proceed if sessionStorage is available
    if (typeof sessionStorage !== 'undefined') {
      const prefix = `therapy_session_${sessionId}`;
      
      // Collect keys to remove
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }
      
      // Remove collected keys
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
    }
  } catch (error) {
    console.error('Error clearing session data:', error);
  }
};
