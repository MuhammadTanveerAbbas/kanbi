/**
 * Dashboard route fallback.
 *
 * Shaped like the dashboard rather than a bare centred spinner, so the layout
 * does not jump when the real page mounts.
 *
 * Self contained on purpose. The dashboard page stylesheet, which defines
 * `.skeleton`, is mounted by the page component and therefore does not exist
 * yet while this fallback renders. The old version solved that by declaring
 * its own `@keyframes spin` inline, which collided with the identical rule the
 * page declares, so two names for one animation could disagree. The keyframe
 * here is scoped and named for this file instead.
 */
const LOAD_STYLE = {
  "--load-a": "var(--bg2)",
  "--load-b": "var(--bg3)",
} as React.CSSProperties;

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
          border-radius: var(--radius-sm, 8px);
        }
      `}</style>

      {/* Content placeholder. The grid tracks carry minmax(0, 1fr) for the
          same reason the page does: a bare 1fr track sizes to its content. */}
      <div
        aria-hidden="true"
        style={{
          flex: 1,
          minWidth: 0,
          padding: "28px 30px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          ...LOAD_STYLE,
        }}
      >
        <div className="kanbi-load-block" style={{ width: 240, height: 26 }} />
        <div className="kanbi-load-block" style={{ width: 180, height: 14 }} />
        <div className="kanbi-load-block" style={{ height: 78 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="kanbi-load-block" style={{ height: 92 }} />
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