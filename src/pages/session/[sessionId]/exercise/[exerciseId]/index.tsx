import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

// Import Supabase client for exercise data only
import { supabase } from '../../../../../lib/supabaseClient'
// Import sessionStorage utilities for user responses
import { saveStepResponse, getAllExerciseResponses } from '../../../../../utils/sessionStorage'
// Import guideline components
import GuidelineLinks, { Guideline } from '../../../../../components/GuidelineLinks'
import GuidelineModal from '../../../../../components/GuidelineModal'

// Define types for our exercise and response data
type InputType = 'text' | 'checkbox' | '';

type ExerciseStep = {
  id: string;
  exercise_id: string;
  activity: string;
  order_index: number;
  partner1_input_type: InputType;
  partner2_input_type: InputType;
  both_partners_input_type: InputType;
  description?: string;
  how_much?: string;
  language?: string;
  [key: string]: any;
};

type Exercise = {
  id: string;
  title: string;
  description?: string;
  steps: ExerciseStep[];
};

type PartnerResponse = {
  // Text inputs
  partner1Text?: string;
  partner2Text?: string;
  
  // Checkbox inputs
  partner1Checkbox?: boolean;
  partner2Checkbox?: boolean;
  
  // Completion status
  finished: boolean;
};

const ExercisePage = () => {
  const router = useRouter()
  const { sessionId, exerciseId } = router.query
  
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [partnerInputs, setPartnerInputs] = useState<{[key: string]: PartnerResponse}>({})  
  const [historyExpanded, setHistoryExpanded] = useState(true) // Default to expanded on desktop
  const [isLargeScreen, setIsLargeScreen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Guidelines state
  const [stepGuidelines, setStepGuidelines] = useState<{[key: number]: Guideline[]}>({})  
  const [selectedGuideline, setSelectedGuideline] = useState<Guideline | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  useEffect(() => {
    // Check for window size on client-side only
    if (typeof window !== 'undefined') {
      setIsLargeScreen(window.innerWidth >= 1024)
      
      const handleResize = () => {
        setIsLargeScreen(window.innerWidth >= 1024)
      }
      
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [])
  
  useEffect(() => {
    // Only fetch the exercise when both exerciseId and sessionId are available (after hydration)
    if (exerciseId && sessionId) {
      const fetchExerciseAndResponses = async () => {
        try {
          setLoading(true)
          
          // Fetch exercise with the matching ID from Supabase
          const { data: exerciseData, error: exerciseError } = await supabase
            .from('exercises')
            .select('*')
            .eq('id', exerciseId)
            .single()
          
          if (exerciseError) {
            throw exerciseError
          }
          
          if (!exerciseData) {
            throw new Error('Exercise not found')
          }
          
          // Fetch steps for this exercise
          const { data: stepsData, error: stepsError } = await supabase
            .from('exercise_steps')
            .select('*')
            .eq('exercise_id', exerciseId)
            .order('order_index', { ascending: true })
          
          console.log('Exercise ID:', exerciseId)
          console.log('Steps data:', stepsData)
          
          // Log the first step for debugging
          if (stepsData && stepsData.length > 0) {
            console.log('First step properties:', Object.keys(stepsData[0]))
            console.log('First step:', stepsData[0])
          }
          
          if (stepsError) {
            console.error('Steps error:', stepsError)
            throw stepsError
          }
          
          // Fetch guidelines for each step
          const stepIds = stepsData?.map(step => step.id) || [];
          console.log('Step IDs for guideline fetch:', stepIds);
          
          // Improved query to correctly get guidelines
          const { data: stepGuidelinesData, error: guidelinesError } = await supabase
            .from('step_guidelines')
            .select(`
              step_id,
              display_order,
              guidelines:guideline_id(id, title, content)
            `)
            .in('step_id', stepIds)
            .order('display_order', { ascending: true });
            
          console.log('Raw Step IDs:', stepIds);
          console.log('Raw Step Guidelines Data:', stepGuidelinesData);
            
          console.log('Step guidelines data:', stepGuidelinesData);
            
          if (guidelinesError) {
            console.error('Guidelines error:', guidelinesError);
            // Non-fatal error, continue without guidelines
          } 

          // Organize guidelines by step index
          const processedGuidelinesByStep: {[key: number]: Guideline[]} = {};
            
          // Initialize guidelinesByStep with empty arrays for all step indexes
          if (stepsData) {
            stepsData.forEach((step, idx) => {
              processedGuidelinesByStep[idx] = [];
            });
          }
            
          // Debug: Log all steps and guidelines data
          console.log('All steps:', stepsData?.map(s => ({ id: s.id, order_index: s.order_index, idx: stepsData.findIndex(st => st.id === s.id) })));
          console.log('All step-guideline entries:', stepGuidelinesData);
            
          // First check if any data is missing
          if (!stepGuidelinesData || stepGuidelinesData.length === 0) {
            console.warn('No step guidelines data found!');
          }
            
          if (!stepsData || stepsData.length === 0) {
            console.warn('No steps data found!');
          }
            
          // Process the guideline data
          if (stepGuidelinesData) {
            for (const sg_item of stepGuidelinesData) { // Use for...of to allow await inside
              const stepDBId = sg_item.step_id; // The ID of the step this guideline belongs to
              // Ensure guidelineDataFromJoin is treated as a single object
              const guidelineDataFromJoin = Array.isArray(sg_item.guidelines) ? sg_item.guidelines[0] : sg_item.guidelines;

              const stepArrayIndex = stepsData?.findIndex(step => step.id === stepDBId);

              if (stepArrayIndex === undefined || stepArrayIndex === -1) {
                console.warn(`[GuidelineProcessing] Guideline's step_id ${stepDBId} not found in fetched stepsData. Skipping this guideline. Item:`, sg_item);
                continue; // Use continue with for...of
              }

              // Specific logging for step 0
              if (stepArrayIndex === 0) {
                console.log(`[GuidelineProcessing_Step0] Attempting to process item for step 0 (step_id: ${stepDBId}). Joined guideline data:`, guidelineDataFromJoin, "Full item:", sg_item);
              }

              if (guidelineDataFromJoin && guidelineDataFromJoin.id) { // Ensure the joined guideline has an ID at least
                let finalContent = guidelineDataFromJoin.content || '';
                
                // Check if content is a filename (e.g., ends with .html)
                if (typeof finalContent === 'string' && finalContent.endsWith('.html')) {
                  try {
                    const response = await fetch(`/guidelines/${finalContent}`); // Path relative to public folder
                    if (response.ok) {
                      finalContent = await response.text();
                    } else {
                      console.error(`Error fetching HTML file ${finalContent}: ${response.statusText}`);
                      finalContent = `<p>Error loading guideline content from file: ${finalContent}. Status: ${response.statusText}</p>`; // Fallback content
                    }
                  } catch (fetchError) {
                    console.error(`Network error fetching HTML file ${finalContent}:`, fetchError);
                    finalContent = `<p>Network error loading guideline content from file: ${finalContent}</p>`; // Fallback content
                  }
                }

                const actualGuideline: Guideline = {
                  id: guidelineDataFromJoin.id,
                  title: guidelineDataFromJoin.title || `Guideline (ID: ${guidelineDataFromJoin.id})`, // Default title if null
                  content: finalContent
                };

                if (!processedGuidelinesByStep[stepArrayIndex]) { // This should be pre-initialized
                  console.error(`[GuidelineProcessing] stepArrayIndex ${stepArrayIndex} was not pre-initialized in processedGuidelinesByStep! This is a bug.`);
                  processedGuidelinesByStep[stepArrayIndex] = [];
                }
                processedGuidelinesByStep[stepArrayIndex].push(actualGuideline);

                if (stepArrayIndex === 0) {
                  console.log(`[GuidelineProcessing_Step0] Added guideline for step 0:`, actualGuideline);
                } else {
                  // console.log(`[GuidelineProcessing] Added guideline for step ${stepArrayIndex}:`, actualGuideline);
                }
              } else {
                // Handle cases where guidelineDataFromJoin or its id is missing, especially for step 0 debugging
                if (stepArrayIndex === 0) {
                  console.log(`[GuidelineProcessing_Step0] Joined guideline data missing or invalid for step 0. Item:`, sg_item);
                }
                // console.warn(`[GuidelineProcessing] Joined guideline data missing or invalid. Item:`, sg_item);
              }
            }
          }
          setStepGuidelines(processedGuidelinesByStep);

          // Load responses from sessionStorage
          // Retrieve any existing responses from sessionStorage
          if (typeof window !== 'undefined') { // Check if we're in the browser
            try {
              const savedResponses = getAllExerciseResponses(sessionId as string, exerciseId as string)
              
              // If we have saved responses, populate the inputs
              if (Object.keys(savedResponses).length > 0) {
                Object.entries(savedResponses).forEach(([indexStr, response]) => {
                  const index = parseInt(indexStr, 10)
                  if (!isNaN(index) && initialInputs[index]) {
                    initialInputs[index] = response
                  }
                })
              }
            } catch (responseErr) {
              // Just log error but continue - this isn't fatal
              console.warn('Could not load previous responses:', responseErr)
            }
          }
          
          // Combine exercise with its steps
          const fullExercise = {
            ...exerciseData,
            steps: stepsData || []
          } as Exercise
          setExercise(fullExercise)
          
          // Create initial inputs object with empty responses for each step
          const initialInputs: {[key: string]: PartnerResponse} = {}
          fullExercise.steps.forEach((step: ExerciseStep, index: number) => {
            initialInputs[index] = {
              // Initialize with empty values based on the input types
              partner1Text: step.partner1_input_type === 'text' ? '' : undefined,
              partner2Text: step.partner2_input_type === 'text' ? '' : undefined,
              partner1Checkbox: step.partner1_input_type === 'checkbox' || step.both_partners_input_type === 'checkbox' ? false : undefined,
              partner2Checkbox: step.partner2_input_type === 'checkbox' || step.both_partners_input_type === 'checkbox' ? false : undefined,
              finished: false
            }
          })
          
          setPartnerInputs(initialInputs)
        } catch (err: any) {
          console.error('Error fetching exercise:', err)
          setError(err.message || 'Failed to load exercise')
        } finally {
          setLoading(false)
        }
      }
      
      fetchExerciseAndResponses()
    }
  }, [exerciseId, sessionId]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading exercise...</p>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }
  
  if (!exercise) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Exercise not found</p>
      </div>
    )
  }
  
  const currentStep = exercise?.steps?.[currentStepIndex]
  console.log('Current step:', currentStep)
  
  // Handle text input changes for partners
  const handleTextInputChange = (partner: 'partner1' | 'partner2', value: string) => {
    const updatedInputs = { ...partnerInputs };
    const currentInput = updatedInputs[currentStepIndex] || { finished: false };
    
    const field = `${partner}Text`;
    
    updatedInputs[currentStepIndex] = {
      ...currentInput,
      [field]: value
    };
    
    setPartnerInputs(updatedInputs);
    
    // Save the response to sessionStorage
    if (sessionId && exerciseId) {
      saveStepResponse(
        sessionId as string,
        exerciseId as string,
        currentStepIndex,
        updatedInputs[currentStepIndex]
      );
    }
  };
  
  // Handle checkbox changes for partners
  const handlePartnerCheckboxChange = (partner: 'partner1' | 'partner2', checked: boolean) => {
    const updatedInputs = { ...partnerInputs };
    const currentInput = updatedInputs[currentStepIndex] || { finished: false };
    
    const field = `${partner}Checkbox`;
    
    updatedInputs[currentStepIndex] = {
      ...currentInput,
      [field]: checked
    };
    
    setPartnerInputs(updatedInputs);
    
    // Save the checkbox state to sessionStorage
    if (sessionId && exerciseId) {
      saveStepResponse(
        sessionId as string,
        exerciseId as string,
        currentStepIndex,
        updatedInputs[currentStepIndex]
      );
    }
  };
  
  // Handle completion checkbox changes
  const handleCompletionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    const updatedInputs = { ...partnerInputs };
    const currentInput = updatedInputs[currentStepIndex] || { finished: false };
    
    updatedInputs[currentStepIndex] = {
      ...currentInput,
      finished: checked
    };
    
    setPartnerInputs(updatedInputs);
    
    // Save the checkbox state to sessionStorage
    if (sessionId && exerciseId) {
      saveStepResponse(
        sessionId as string,
        exerciseId as string,
        currentStepIndex,
        updatedInputs[currentStepIndex]
      );
    }
  };
  
  const goToNextStep = () => {
    if (currentStepIndex < (exercise?.steps?.length || 0) - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
    }
  }
  
  // Handle guideline link click
  const handleGuidelineClick = (guideline: Guideline) => {
    setSelectedGuideline(guideline);
    setIsModalOpen(true);
  }
  
  // Close the guideline modal
  const closeGuidelineModal = () => {
    setIsModalOpen(false);
  }
  
  // Define a type for history items
  type HistoryItem = {
    stepIndex: number;
    activity: string;
    partner1Text: string | null;
    partner2Text: string | null;
    partner1Checkbox: boolean | null;
    partner2Checkbox: boolean | null;
  };
  
  // Function to get conversation history for display in the sidebar
  const getStepHistory = (): HistoryItem[] => {
    return Object.entries(partnerInputs)
      .map(([index, inputs]) => {
        const stepIndex = parseInt(index);
        // Only include entries from completed steps (before current step)
        if (stepIndex < currentStepIndex && exercise?.steps?.[stepIndex]) {
          const step = exercise.steps[stepIndex];
          
          // Only include if either partner has provided a non-empty response
          const hasTextResponse = (inputs.partner1Text?.trim() || inputs.partner2Text?.trim());
          const hasCheckboxResponse = (inputs.partner1Checkbox !== undefined || inputs.partner2Checkbox !== undefined);
          
          if (hasTextResponse || hasCheckboxResponse) {
            return {
              stepIndex,
              activity: step.activity,
              partner1Text: inputs.partner1Text?.trim() || null,
              partner2Text: inputs.partner2Text?.trim() || null,
              partner1Checkbox: inputs.partner1Checkbox ?? null,
              partner2Checkbox: inputs.partner2Checkbox ?? null
            };
          }
        }
        return null;
      })
      .filter((item): item is HistoryItem => item !== null);
  };

  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1)
    }
  }
  
  return (
    <div className="py-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary-700">
          {exercise.title}
        </h1>
        
        <Link href={`/session/${sessionId}`}>
          <a className="px-4 py-2 text-sm border border-neutral-300 rounded-md hover:bg-neutral-50">
            Back to Exercises
          </a>
        </Link>
      </div>
      
      {/* Main content layout - split into two columns on desktop */}
      <div className="flex flex-col lg:flex-row lg:space-x-6">
      
      {/* Left column - Exercise step */}
      <div className="lg:w-[60%]">
        {currentStep && (
          <div className="bg-white border border-neutral-200 rounded-lg shadow p-6 mb-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-primary-600 mb-2">
              {currentStep?.activity || 'Loading activity...'}
            </h2>
            <p className="text-neutral-600 mb-4">{currentStep?.description || 'Loading description...'}</p>
            
            {/* Simple guidelines rendering with better debug */}
            {console.log('Current step index:', currentStepIndex)}
            {console.log('Step guidelines keys:', Object.keys(stepGuidelines))}
            {console.log('Guidelines for step 0:', stepGuidelines[0])}
            {console.log('Guidelines for current step:', stepGuidelines[currentStepIndex])}
            
            {/* Show guidelines if they exist for this step index */}
            {Array.isArray(stepGuidelines[currentStepIndex]) && stepGuidelines[currentStepIndex].length > 0 && (
              <GuidelineLinks 
                guidelines={stepGuidelines[currentStepIndex]} 
                onGuidelineClick={handleGuidelineClick} 
              />
            )}
            
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <span className="bg-neutral-100 px-2 py-1 rounded">{currentStep?.how_much || ''}</span>
              <span>•</span>
              <span className="italic">{currentStep?.language || ''}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6 mb-6">
            {/* Partner 1 inputs */}
            {(currentStep.partner1_input_type === 'text' || currentStep.both_partners_input_type === 'text') && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Partner 1 - Text Response
                </label>
                <textarea
                  className="w-full p-3 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  value={partnerInputs[currentStepIndex]?.partner1Text || ''}
                  onChange={(e) => handleTextInputChange('partner1', e.target.value)}
                  placeholder="Enter your response..."
                />
              </div>
            )}
            
            {(currentStep.partner1_input_type === 'checkbox' || currentStep.both_partners_input_type === 'checkbox') && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="partner1Checkbox"
                  checked={partnerInputs[currentStepIndex]?.partner1Checkbox || false}
                  onChange={(e) => handlePartnerCheckboxChange('partner1', e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                />
                <label htmlFor="partner1Checkbox" className="ml-2 block text-sm text-neutral-700">
                  Partner 1 Confirmation
                </label>
              </div>
            )}
            
            {/* Partner 2 inputs */}
            {(currentStep.partner2_input_type === 'text' || currentStep.both_partners_input_type === 'text') && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Partner 2 - Text Response
                </label>
                <textarea
                  className="w-full p-3 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  value={partnerInputs[currentStepIndex]?.partner2Text || ''}
                  onChange={(e) => handleTextInputChange('partner2', e.target.value)}
                  placeholder="Enter your response..."
                />
              </div>
            )}
            
            {(currentStep.partner2_input_type === 'checkbox' || currentStep.both_partners_input_type === 'checkbox') && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="partner2Checkbox"
                  checked={partnerInputs[currentStepIndex]?.partner2Checkbox || false}
                  onChange={(e) => handlePartnerCheckboxChange('partner2', e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                />
                <label htmlFor="partner2Checkbox" className="ml-2 block text-sm text-neutral-700">
                  Partner 2 Confirmation
                </label>
              </div>
            )}
          </div>
          
          {/* Completion checkbox removed */}
          </div>
        )}
        
        <div className="flex justify-between mt-6">
          <button
            onClick={goToPreviousStep}
            disabled={currentStepIndex === 0}
            className="px-4 py-2 border border-neutral-300 rounded-md hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous Step
          </button>
          
          <div className="text-neutral-500 text-sm flex items-center">
            Step {currentStepIndex + 1} of {exercise.steps?.length || 0}
          </div>
          
          <button
            onClick={goToNextStep}
            disabled={currentStepIndex === (exercise.steps?.length || 0) - 1}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next Step
          </button>
        </div>
      </div>
      

      {/* Right column - Conversation History Section */}
      {currentStepIndex > 0 && (
        <div className="lg:w-[40%] mt-8 lg:mt-0">
          <div className="sticky top-4">
            <div className="mb-3 flex justify-between items-center">
              <h2 className="font-bold text-primary-700">Conversation History</h2>
              
              <button 
                onClick={() => setHistoryExpanded(!historyExpanded)}
                className="lg:hidden flex items-center text-primary-600 hover:text-primary-700 focus:outline-none text-sm"
                aria-expanded={historyExpanded}
              >
                {historyExpanded ? 'Hide' : 'View'}
                {getStepHistory().length > 0 && (
                  <span className="ml-2 bg-primary-100 text-primary-700 text-xs px-2 py-1 rounded-full">
                    {getStepHistory().length}
                  </span>
                )}
              </button>
            </div>
            
            {(historyExpanded || isLargeScreen) && (
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 overflow-y-auto" style={{maxHeight: 'calc(100vh - 220px)'}}>
                {getStepHistory().length === 0 ? (
                  <p className="text-neutral-500 text-center py-4">No conversation history yet</p>
                ) : (
                  getStepHistory().map((item) => (
                    <div key={item.stepIndex} className="mb-4 pb-4 border-b border-neutral-100 last:border-b-0">
                      <h3 className="font-medium text-neutral-700">{item.activity}</h3>
                      
                      {/* Partner 1's text response if it exists */}
                      {item.partner1Text && (
                        <div className="mt-2">
                          <div className="text-xs font-semibold text-primary-600">Partner 1 - Text</div>
                          <div className="text-neutral-700 bg-white p-2 rounded border border-neutral-100">{item.partner1Text}</div>
                        </div>
                      )}
                      
                      {/* Partner 1's checkbox response if it exists */}
                      {item.partner1Checkbox !== null && (
                        <div className="mt-2">
                          <div className="text-xs font-semibold text-primary-600">Partner 1 - Confirmation</div>
                          <div className="text-neutral-700 bg-white p-2 rounded border border-neutral-100">
                            {item.partner1Checkbox ? '✅ Confirmed' : '❌ Not confirmed'}
                          </div>
                        </div>
                      )}
                      
                      {/* Partner 2's text response if it exists */}
                      {item.partner2Text && (
                        <div className="mt-2">
                          <div className="text-xs font-semibold text-primary-600">Partner 2 - Text</div>
                          <div className="text-neutral-700 bg-white p-2 rounded border border-neutral-100">{item.partner2Text}</div>
                        </div>
                      )}
                      
                      {/* Partner 2's checkbox response if it exists */}
                      {item.partner2Checkbox !== null && (
                        <div className="mt-2">
                          <div className="text-xs font-semibold text-primary-600">Partner 2 - Confirmation</div>
                          <div className="text-neutral-700 bg-white p-2 rounded border border-neutral-100">
                            {item.partner2Checkbox ? '✅ Confirmed' : '❌ Not confirmed'}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
      </div>
      
      {/* Guideline Modal */}
      {selectedGuideline && (
        <GuidelineModal
          isOpen={isModalOpen}
          onClose={closeGuidelineModal}
          title={selectedGuideline.title}
          content={selectedGuideline.content}
        />
      )}
    </div>
  )
}

export default ExercisePage
