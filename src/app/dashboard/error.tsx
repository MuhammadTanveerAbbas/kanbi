'use client'

import { useEffect } from 'react'

/**
 * Dashboard error boundary.
 *
 * Deliberately never shows the raw error. `error.message` on the client is a
 * production bundle line reference at best and, for a route that reads the
 * user's boards and profile, an invitation to surface internals. The message
 * is logged, where it belongs, and the user gets one sentence plus a retry.
 */
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
      minHeight: '100dvh', gap: 16, padding: 24, textAlign: 'center',
      background: 'var(--bg)', color: 'var(--tx)',
      // dvh rather than vh, so the retry button is never below the fold on a
      // phone with browser chrome showing.
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 'var(--radius-lg, 16px)',
        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="var(--rd, #ef4444)"
          strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7.5v5" />
          <path d="M12 16h.01" />
        </svg>
      </div>

      {/* h1, because this replaces the whole page and nothing else is mounted
          to carry the top level heading. */}
      <h1 style={{
        fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em', margin: 0,
        fontFamily: 'var(--font-display, inherit)',
      }}>
        Something went wrong
      </h1>
      <p style={{ fontSize: 13, color: 'var(--tx2)', maxWidth: 380, margin: 0, lineHeight: 1.6 }}>
        The dashboard could not load. Your boards are safe. Try again, and if it keeps
        happening, sign out and back in.
      </p>
      <button
        onClick={reset}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          height: 40, marginTop: 4, padding: '0 20px',
          borderRadius: 'var(--radius-sm, 8px)', border: 'none',
          background: 'var(--ac, #6366f1)', color: '#fff', fontSize: 13, fontWeight: 700,
          cursor: 'pointer', transition: 'filter .15s, transform .1s',
        }}
        onMouseOver={e => e.currentTarget.style.filter = 'brightness(1.08)'}
        onMouseOut={e => e.currentTarget.style.filter = 'none'}
      >
        Try again
      </button>
      {error.digest && (
        <p style={{ fontSize: 10.5, color: 'var(--tx3)', fontFamily: 'var(--font-mono, monospace)', margin: 0 }}>
          Reference: {error.digest}
        </p>
      )}
    </div>
  )
}