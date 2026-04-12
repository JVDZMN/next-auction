'use client'

import { useEffect } from 'react'
import Link from 'next/link'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * App Router segment error boundary.
 * Catches any unhandled render or async error thrown inside the app tree
 * (but not inside layout.tsx — that is handled by global-error.tsx).
 */
export default function Error({ error, reset }: Props) {
  useEffect(() => {
    console.error('[AppError]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-gray-600 mb-6 text-sm">
          {error.message || 'An unexpected error occurred. Our team has been notified.'}
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 mb-6 font-mono">Error ID: {error.digest}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-6 py-2 bg-gray-100 text-gray-700 font-semibold rounded hover:bg-gray-200 transition-colors"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  )
}
