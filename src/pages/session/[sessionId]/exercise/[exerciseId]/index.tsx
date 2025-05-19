import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

// Import exercise data
import exerciseData from '../../../../../data/exercises.json'

const ExercisePage = () => {
  const router = useRouter()
  const { sessionId, exerciseId } = router.query
  
  const [exercise, setExercise] = useState<any>(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [partnerInputs, setPartnerInputs] = useState<{[key: string]: {partner1: string, partner2: string, finished: boolean}}>({})
  const [historyExpanded, setHistoryExpanded] = useState(true) // Default to expanded on desktop
  const [isLargeScreen, setIsLargeScreen] = useState(false)
  
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
    // Only find the exercise when exerciseId is available (after hydration)
    if (exerciseId) {
      // Find the exercise with the matching ID from the loaded data
      const foundExercise = exerciseData.find(ex => ex.id === exerciseId);
      
      if (foundExercise) {
        setExercise(foundExercise);
        
        // Initialize partner inputs for each step
        const initialInputs: {[key: string]: {partner1: string, partner2: string, finished: boolean}} = {};
        
        foundExercise.steps.forEach((step, index) => {
          initialInputs[index] = {
            partner1: step["Partner 1 text input"] || '',
            partner2: step["Partner 2 text input"] || '',
            finished: step["Finished (checkbox)?"]
          };
        });
        
        setPartnerInputs(initialInputs);
      }
    }
  }, [exerciseId])
  
  if (!exercise || !sessionId) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading exercise...</p>
      </div>
    )
  }
  
  const currentStep = exercise?.steps?.[currentStepIndex]
  
  const handleInputChange = (partner: 'partner1' | 'partner2', value: string) => {
    setPartnerInputs({
      ...partnerInputs,
      [currentStepIndex]: {
        ...partnerInputs[currentStepIndex],
        [partner]: value
      }
    })
  }
  
  const handleCheckboxChange = () => {
    setPartnerInputs({
      ...partnerInputs,
      [currentStepIndex]: {
        ...partnerInputs[currentStepIndex],
        finished: !partnerInputs[currentStepIndex]?.finished
      }
    })
  }
  
  const goToNextStep = () => {
    if (currentStepIndex < (exercise?.steps?.length || 0) - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
    }
  }
  
  // Define a type for history items
  type HistoryItem = {
    stepIndex: number;
    activity: string;
    partner1: string | null;
    partner2: string | null;
  };
  
  // Filter function to get non-empty history items
  const getFilteredHistory = (): HistoryItem[] => {
    // Only include steps before the current step
    return Object.entries(partnerInputs)
      .map(([index, inputs]) => {
        const stepIndex = parseInt(index);
        // Only include entries from completed steps (before current step)
        if (stepIndex < currentStepIndex && exercise?.steps?.[stepIndex]) {
          const step = exercise.steps[stepIndex];
          
          // Only include if either partner has provided a non-empty response
          if (inputs.partner1?.trim() || inputs.partner2?.trim()) {
            return {
              stepIndex,
              activity: step.Activity,
              partner1: inputs.partner1?.trim() || null,
              partner2: inputs.partner2?.trim() || null
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
              {currentStep.Activity}
            </h2>
            <p className="text-neutral-600 mb-4">{currentStep.Description}</p>
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <span className="bg-neutral-100 px-2 py-1 rounded">{currentStep["How much?"]}</span>
              <span>•</span>
              <span className="italic">{currentStep.Language}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Partner 1
              </label>
              <textarea
                className="w-full p-3 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={3}
                value={partnerInputs[currentStepIndex]?.partner1 || ''}
                onChange={(e) => handleInputChange('partner1', e.target.value)}
                placeholder="Enter your response..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Partner 2
              </label>
              <textarea
                className="w-full p-3 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={3}
                value={partnerInputs[currentStepIndex]?.partner2 || ''}
                onChange={(e) => handleInputChange('partner2', e.target.value)}
                placeholder="Enter your response..."
              />
            </div>
          </div>
          
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="finished"
              checked={partnerInputs[currentStepIndex]?.finished || false}
              onChange={handleCheckboxChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
            />
            <label htmlFor="finished" className="ml-2 block text-sm text-neutral-700">
              Mark as completed
            </label>
          </div>
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
                {getFilteredHistory().length > 0 && (
                  <span className="ml-2 bg-primary-100 text-primary-700 text-xs px-2 py-1 rounded-full">
                    {getFilteredHistory().length}
                  </span>
                )}
              </button>
            </div>
            
            {(historyExpanded || isLargeScreen) && (
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 overflow-y-auto" style={{maxHeight: 'calc(100vh - 220px)'}}>
                {getFilteredHistory().length === 0 ? (
                  <p className="text-neutral-500 text-center py-4">No conversation history yet</p>
                ) : (
                  getFilteredHistory().map((item) => (
                    <div key={item.stepIndex} className="mb-4 pb-4 border-b border-neutral-100 last:border-b-0">
                      <h3 className="font-medium text-neutral-700">{item.activity}</h3>
                      
                      {/* Only show Partner 1's response if it exists */}
                      {item.partner1 && (
                        <div className="mt-2">
                          <div className="text-xs font-semibold text-primary-600">Partner 1</div>
                          <div className="text-neutral-700 bg-white p-2 rounded border border-neutral-100">{item.partner1}</div>
                        </div>
                      )}
                      
                      {/* Only show Partner 2's response if it exists */}
                      {item.partner2 && (
                        <div className="mt-2">
                          <div className="text-xs font-semibold text-secondary-600">Partner 2</div>
                          <div className="text-neutral-700 bg-white p-2 rounded border border-neutral-100">{item.partner2}</div>
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
    </div>
  )
}

export default ExercisePage
