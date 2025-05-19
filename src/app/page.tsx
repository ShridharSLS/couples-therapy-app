import { useRouter } from 'next/router'
import Image from 'next/image'
import { useState } from 'react'

export default function Home() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  // Function to generate a random session ID
  const generateSessionId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }
  
  // Handle create session button click
  const handleCreateSession = () => {
    setIsLoading(true)
    const sessionId = generateSessionId()
    // Navigate to the session page
    router.push(`/session/${sessionId}`)
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center py-12">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight text-primary-700 sm:text-5xl mb-6">
          Couples Therapy Exercises
        </h1>
        
        <p className="mt-6 text-lg leading-8 text-neutral-600 mb-10">
          Welcome to a safe space for couples to work through therapeutic exercises together. 
          Create a new session to begin your journey of understanding and connection.
        </p>
        
        <div className="mt-10">
          <button
            onClick={handleCreateSession}
            disabled={isLoading}
            className="rounded-md bg-primary-600 px-8 py-4 text-lg font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition-all duration-200 disabled:opacity-70"
          >
            {isLoading ? 'Creating...' : 'Create New Session'}
          </button>
        </div>
        
        <p className="mt-8 text-sm text-neutral-500">
          No data is saved after your session. Your privacy is important to us.
        </p>
      </div>
    </div>
  )
}
