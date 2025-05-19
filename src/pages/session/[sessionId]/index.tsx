import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

// Import exercise data
import exerciseData from '../../../data/exercises.json'

const SessionPage = () => {
  const router = useRouter()
  const { sessionId } = router.query
  const [exercises, setExercises] = useState<any[]>([])
  
  useEffect(() => {
    // Only load exercises when sessionId is available (after hydration)
    if (sessionId) {
      // Load exercises from the imported JSON file
      setExercises(exerciseData)
    }
  }, [sessionId])
  
  if (!sessionId) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading session...</p>
      </div>
    )
  }
  
  return (
    <div className="py-8">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary-700">
          Therapy Session: {sessionId as string}
        </h1>
        
        <Link href="/">
          <a className="text-sm text-neutral-600 hover:text-primary-600 transition-colors">
            Leave Session
          </a>
        </Link>
      </div>
      
      <div className="mb-6">
        <p className="text-neutral-600">
          Select an exercise below to begin your therapy session. You can return to this page at any time.
        </p>
      </div>
      
      <div className="grid gap-6 mt-8">
        {exercises.map((exercise) => (
          <div 
            key={exercise.id}
            className="bg-white border border-neutral-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
          >
            <h2 className="text-xl font-semibold text-primary-700 mb-2">
              {exercise.title}
            </h2>
            
            <p className="text-neutral-600 mb-4">
              {exercise.description}
            </p>
            
            <Link href={`/session/${sessionId}/exercise/${exercise.id}`}>
              <a className="inline-flex items-center px-4 py-2 bg-primary-50 text-primary-700 rounded-md hover:bg-primary-100 transition-colors">
                Start Exercise
              </a>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SessionPage
