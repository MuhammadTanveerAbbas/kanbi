/**
 * Dashboard route fallback.
 */
export default function DashboardLoading() {
  return (
    <div
      role="status"
      aria-label="Loading your dashboard"
      style={{
        display: "flex",
        height: "100dvh",
        background: "var(--bg)",
        color: "var(--tx)",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes kanbiLoadShimmer {
          from { background-position: -200% 0 }
          to   { background-position: 200% 0 }
        }
        .kanbi-load-block {
          background: linear-gradient(90deg, var(--bg2) 25%, var(--bg3) 50%, var(--bg2) 75%);
          background-size: 200% 100%;
          animation: kanbiLoadShimmer 1.5s infinite;
          border-radius: 8px;
        }
      `}</style>

      {/* Sidebar skeleton */}
      <div
        aria-hidden="true"
        style={{
          width: 240,
          flexShrink: 0,
          borderRight: "1px solid var(--br)",
          background: "var(--bg1)",
          padding: "16px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div className="kanbi-load-block" style={{ width: 120, height: 28, marginBottom: 8 }} />
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="kanbi-load-block" style={{ height: 32 }} />
        ))}
      </div>

      {/* Content */}
      <div
        aria-hidden="true"
        style={{
          flex: 1,
          minWidth: 0,
          padding: "14px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div className="kanbi-load-block" style={{ width: 200, height: 24 }} />
        <div className="kanbi-load-block" style={{ width: 160, height: 14 }} />
        <div className="kanbi-load-block" style={{ height: 72 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="kanbi-load-block" style={{ height: 88 }} />
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12, flex: 1 }}>
          {[0, 1, 2].map(i => (
            <div key={i} className="kanbi-load-block" style={{ height: "100%" }} />
          ))}
        </div>
      </div>
    </div>
  );
}