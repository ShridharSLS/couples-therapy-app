import { useRouter } from 'next/router'
import Link from 'next/link'
import { useEffect, useState } from 'react'

// Import exercise data
import exerciseData from '../../../data/exercises.json'

export default function SessionPage() {
  const router = useRouter()
  const { sessionId } = router.query as { sessionId: string }
  const [exercises, setExercises] = useState<any[]>([])
  
  useEffect(() => {
    // Load exercises from the imported JSON file
    setExercises(exerciseData)
  }, [])
  
  return (
    <div className="py-8">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary-700">
          Therapy Session: {sessionId}
        </h1>
        
        <Link 
          href="/"
          className="text-sm text-neutral-600 hover:text-primary-600 transition-colors"
        >
          Leave Session
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
            
            <Link
              href={`/session/${sessionId}/exercise/${exercise.id}`}
              className="inline-flex items-center px-4 py-2 bg-primary-50 text-primary-700 rounded-md hover:bg-primary-100 transition-colors"
            >
              Start Exercise
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
