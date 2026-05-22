'use client'

import { useEffect } from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100vh', gap: 20, padding: 24, textAlign: 'center',
      background: 'var(--bg)', color: 'var(--tx)',
    }}>
      <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="var(--rd)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>Something went wrong</h2>
      <p style={{ fontSize: 13, color: 'var(--tx2)', maxWidth: 360 }}>
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        style={{
          padding: '10px 24px', borderRadius: 10, border: 'none',
          background: 'var(--ac)', color: '#fff', fontSize: 13, fontWeight: 600,
          cursor: 'pointer', transition: 'filter .15s',
        }}
        onMouseOver={e => e.currentTarget.style.filter = 'brightness(1.1)'}
        onMouseOut={e => e.currentTarget.style.filter = 'none'}
      >
        Try again
      </button>
    </div>
  )
}
