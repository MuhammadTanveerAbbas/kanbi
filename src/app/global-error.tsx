'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100vh', gap: 20, padding: 24,
        textAlign: 'center', fontFamily: 'system-ui, sans-serif',
        background: '#07070e', color: '#eaeaf8',
      }}>
        <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Application Error</h2>
        <p style={{ fontSize: 14, color: '#6e6e9a', maxWidth: 360 }}>
          A critical error occurred. Please refresh to try again.
        </p>
        <button
          onClick={reset}
          style={{
            padding: '10px 24px', borderRadius: 10, border: 'none',
            background: '#6366f1', color: '#fff', fontSize: 13, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Refresh
        </button>
      </body>
    </html>
  )
}
