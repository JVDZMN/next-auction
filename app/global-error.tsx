'use client'

import { useEffect } from 'react'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Root-level error boundary.
 * Catches errors thrown inside the root layout.tsx (e.g. SessionProvider crash,
 * font load failure). Must render its own <html> and <body> because the root
 * layout is what failed and is not available.
 */
export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#f9fafb' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              maxWidth: 420,
              width: '100%',
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
              padding: '2.5rem',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚨</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
              Critical error
            </h1>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              {error.message || 'The application failed to load. Please refresh the page.'}
            </p>
            {error.digest && (
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '1.5rem', fontFamily: 'monospace' }}>
                Error ID: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              style={{
                padding: '0.5rem 1.5rem',
                background: '#2563eb',
                color: '#fff',
                fontWeight: 600,
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              Reload
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
