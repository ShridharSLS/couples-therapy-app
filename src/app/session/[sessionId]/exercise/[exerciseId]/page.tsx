import { useRouter } from 'next/router'
import Link from 'next/link'
import { useState, useEffect } from 'react'

// Import exercise data
import exerciseData from '../../../../../data/exercises.json'

export default function ExercisePage() {
  const router = useRouter()
  const { sessionId, exerciseId } = router.query as { sessionId: string; exerciseId: string }
  
  const [exercise, setExercise] = useState<any>(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [partnerInputs, setPartnerInputs] = useState<{[key: string]: {partner1: string, partner2: string, finished: boolean}}>({})
  
  useEffect(() => {
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
  }, [exerciseId])
  
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
  
  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1)
    }
  }
  
  if (!exercise) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading exercise...</p>
      </div>
    )
  }
  
  return (
    <div className="py-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary-700">
          {exercise.title}
        </h1>
        
        <Link 
          href={`/session/${sessionId}`}
          className="px-4 py-2 text-sm border border-neutral-300 rounded-md hover:bg-neutral-50"
        >
          Back to Exercises
        </Link>
      </div>
      
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
  )
}
