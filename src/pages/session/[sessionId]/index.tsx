import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

// Import Supabase client
import { supabase } from '../../../lib/supabaseClient'
// Import sessionStorage utility for clearing session data
import { clearSessionResponses } from '../../../utils/sessionStorage'

const SessionPage = () => {
  const router = useRouter()
  const { sessionId } = router.query
  const [exercises, setExercises] = useState<any[]>([])
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clearingSession, setClearingSession] = useState(false)

  useEffect(() => {
    // Only fetch exercises when sessionId is available (after hydration)
    if (sessionId) {
      const fetchExercises = async () => {
        try {
          setLoading(true)
          
          // Fetch exercises from Supabase
          const { data, error } = await supabase
            .from('exercises')
            .select('*')
            .order('title')
          
          if (error) {
            throw error
          }
          
          setExercises(data || [])
        } catch (err: any) {
          console.error('Error fetching exercises:', err)
          setError(err.message || 'Failed to load exercises')
        } finally {
          setLoading(false)
        }
      }
      
      fetchExercises()
    }
  }, [sessionId])
  
  if (!sessionId) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading session...</p>
      </div>
    )
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading exercises...</p>
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
  
  return (
    <div className="py-8">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary-700">
          Session {sessionId}
        </h1>
        
        <div className="flex space-x-3">
          <button 
            onClick={() => {
              if (window.confirm('End this session? All your responses will be deleted.')) {
                setClearingSession(true);
                clearSessionResponses(sessionId as string);
                // Redirect to home after clearing
                router.push('/');
              }
            }}
            className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
            disabled={clearingSession}
          >
            {clearingSession ? 'Ending Session...' : 'End Session'}
          </button>
          
          <Link href="/">
            <a className="px-4 py-2 text-sm border border-neutral-300 rounded-md hover:bg-neutral-50">
              Back to Home
            </a>
          </Link>
        </div>
      </div>
      
      <div className="mb-6">
        <p className="text-neutral-600">
          Select an exercise below to begin your therapy session. You can return to this page at any time.
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {exercises.map((exercise) => (
          <div key={exercise.id} className="bg-white border border-neutral-200 rounded-lg shadow-sm hover:shadow transition-shadow p-6">
            <h2 className="text-xl font-semibold text-primary-600 mb-3">{exercise.title}</h2>
            <p className="text-neutral-600 mb-4">{exercise.description}</p>
            <Link href={`/session/${sessionId}/exercise/${exercise.id}`}>
              <a className="inline-block px-4 py-2 bg-primary-50 text-primary-700 rounded-md hover:bg-primary-100 transition-colors">
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
