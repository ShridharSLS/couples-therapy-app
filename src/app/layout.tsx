import React from 'react'
import '../styles/globals.css'

function MyApp({ Component, pageProps }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <Component {...pageProps} />
      </main>
    </div>
  )
}

export default MyApp
