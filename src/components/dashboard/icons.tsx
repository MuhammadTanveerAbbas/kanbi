"use client";

type IC = { size?: number; style?: React.CSSProperties; color?: string };

/* ── Shared wrapper ── */
function S({ size = 16, style, children, vb = "0 0 24 24" }: IC & { children: React.ReactNode; vb?: string }) {
  return (
    <svg width={size} height={size} viewBox={vb} fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}>
      {children}
    </svg>
  );
}

/* ── 3D icon: coloured square bg + white stroke icon ── */
export function Icon3D({
  size = 28, bg, shadow, children, style,
}: {
  size?: number; bg: string; shadow: string; children: React.ReactNode; style?: React.CSSProperties;
}) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: size, height: size, borderRadius: Math.round(size * 0.32),
      background: bg,
      boxShadow: `0 2px 0 ${shadow}, 0 4px 12px ${shadow}55`,
      flexShrink: 0,
      ...style,
    }}>
      {children}
    </span>
  );
}

export const Icons = {
  Overview: ({ size = 16, style }: IC) => (
    <S size={size} style={style}>
      <rect x="3" y="3" width="7" height="7" rx="1.2"/><rect x="14" y="3" width="7" height="7" rx="1.2"/>
      <rect x="3" y="14" width="7" height="7" rx="1.2"/><rect x="14" y="14" width="7" height="7" rx="1.2"/>
    </S>
  ),
  Board: ({ size = 16, style }: IC) => (
    <S size={size} style={style}>
      {/* 3 equal columns */}
      <rect x="2" y="3" width="6" height="18" rx="1.5"/>
      <rect x="9" y="3" width="6" height="18" rx="1.5"/>
      <rect x="16" y="3" width="6" height="18" rx="1.5"/>
      {/* cards inside col 1 */}
      <rect x="3.5" y="5" width="3" height="3.5" rx="0.7" fill="currentColor" stroke="none" style={{opacity:0.35}}/>
      <rect x="3.5" y="10" width="3" height="3.5" rx="0.7" fill="currentColor" stroke="none" style={{opacity:0.35}}/>
      {/* cards inside col 2 */}
      <rect x="10.5" y="5" width="3" height="3.5" rx="0.7" fill="currentColor" stroke="none" style={{opacity:0.35}}/>
      {/* cards inside col 3 */}
      <rect x="17.5" y="5" width="3" height="3.5" rx="0.7" fill="currentColor" stroke="none" style={{opacity:0.35}}/>
      <rect x="17.5" y="10" width="3" height="3.5" rx="0.7" fill="currentColor" stroke="none" style={{opacity:0.35}}/>
    </S>
  ),
  Chat: ({ size = 16, style }: IC) => (
    <S size={size} style={style}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </S>
  ),
  Autopilot: ({ size = 16, style }: IC) => (
    <S size={size} style={style}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z"/>
    </S>
  ),
  Saved: ({ size = 16, style }: IC) => (
    <S size={size} style={style}>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </S>
  ),
  Settings: ({ size = 16, style }: IC) => (
    <S size={size} style={style}>
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </S>
  ),
  Zap: ({ size = 16, style }: IC) => (
    <S size={size} style={style}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></S>
  ),
  Send: ({ size = 16, style }: IC) => (
    <S size={size} style={style}><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></S>
  ),
  Plus: ({ size = 16, style }: IC) => (
    <S size={size} style={style}><path d="M12 5v14M5 12h14"/></S>
  ),
  Check: ({ size = 16, style }: IC) => (
    <S size={size} style={style}><path d="M20 6L9 17l-5-5"/></S>
  ),
  ChevD: ({ size = 16, style }: IC) => (
    <S size={size} style={style}><path d="M6 9l6 6 6-6"/></S>
  ),
  ChevR: ({ size = 16, style }: IC) => (
    <S size={size} style={style}><path d="M9 18l6-6-6-6"/></S>
  ),
  X: ({ size = 16, style }: IC) => (
    <S size={size} style={style}><path d="M18 6L6 18M6 6l12 12"/></S>
  ),
  Search: ({ size = 16, style }: IC) => (
    <S size={size} style={style}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></S>
  ),
  Folder: ({ size = 16, style }: IC) => (
    <S size={size} style={style}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></S>
  ),
  Calendar: ({ size = 16, style }: IC) => (
    <S size={size} style={style}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></S>
  ),
  Clock: ({ size = 16, style }: IC) => (
    <S size={size} style={style}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></S>
  ),
  Sun: ({ size = 16, style }: IC) => (
    <S size={size} style={style}>
      <circle cx="12" cy="12" r="5"/>
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </S>
  ),
  Moon: ({ size = 16, style }: IC) => (
    <S size={size} style={style}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></S>
  ),
  Trash: ({ size = 16, style }: IC) => (
    <S size={size} style={style}>
      <path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/>
    </S>
  ),
  Crown: ({ size = 16, style }: IC) => (
    <S size={size} style={style}>
      <path d="M2 19h20v2H2zM3 9l4 5 5-7 5 7 4-5v10H3z"/>
    </S>
  ),
  Logout: ({ size = 16, style }: IC) => (
    <S size={size} style={style}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
    </S>
  ),
  Shield: ({ size = 16, style }: IC) => (
    <S size={size} style={style}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></S>
  ),
  Card: ({ size = 16, style }: IC) => (
    <S size={size} style={style}><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 9h22"/></S>
  ),
  Download: ({ size = 16, style }: IC) => (
    <S size={size} style={style}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></S>
  ),
  Pdf: ({ size = 16, style }: IC) => (
    <S size={size} style={style}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></S>
  ),
  Paste: ({ size = 16, style }: IC) => (
    <S size={size} style={style}>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1"/>
    </S>
  ),
  Template: ({ size = 16, style }: IC) => (
    <S size={size} style={style}>
      <rect x="3" y="3" width="18" height="4" rx="1"/><rect x="3" y="11" width="7" height="10" rx="1"/><rect x="14" y="11" width="7" height="10" rx="1"/>
    </S>
  ),
  Target: ({ size = 16, style }: IC) => (
    <S size={size} style={style}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></S>
  ),
  Upload: ({ size = 16, style }: IC) => (
    <S size={size} style={style}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></S>
  ),

  Edit: ({ size = 16, style }: IC) => (
    <S size={size} style={style}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/>
    </S>
  ),
  AlertTri: ({ size = 16, style }: IC) => (
    <S size={size} style={style}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <path d="M12 9v4M12 17h.01"/>
    </S>
  ),
  Copy: ({ size = 16, style }: IC) => (
    <S size={size} style={style}>
      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </S>
  ),
  MoveFolder: ({ size = 16, style }: IC) => (
    <S size={size} style={style}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      <path d="M12 11v6M9 14l3 3 3-3"/>
    </S>
  ),
  Sparkle: ({ size = 16, style }: IC) => (
    <S size={size} style={style}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z"/>
    </S>
  ),
  ChevronRight: ({ size = 16, style }: IC) => (
    <S size={size} style={style} vb="0 0 24 24"><path d="M9 6l6 6-6 6" strokeWidth="2"/></S>
  ),
  Layers: ({ size = 16, style }: IC) => (
    <S size={size} style={style}><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></S>
  ),
  Activity: ({ size = 16, style }: IC) => (
    <S size={size} style={style}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></S>
  ),
  LayoutGrid: ({ size = 16, style }: IC) => (
    <S size={size} style={style}>
      <rect x="3" y="3" width="7" height="7" rx="1.2"/><rect x="14" y="3" width="7" height="7" rx="1.2"/>
      <rect x="3" y="14" width="7" height="7" rx="1.2"/><rect x="14" y="14" width="7" height="7" rx="1.2"/>
    </S>
  ),
  Trending: ({ size = 16, style }: IC) => (
    <S size={size} style={style}><path d="M23 6l-9.5 9.5-5-5L1 18"/></S>
  ),
  Lock: ({ size = 16, style }: IC) => (
    <S size={size} style={style}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></S>
  ),
  Google: ({ size = 16, style }: IC) => (
    <S size={size} style={style}><path d="M21.35 11.1h-9.2v3h5.3c-.5 2.4-2.6 4-5.3 4a6 6 0 1 1 0-12c1.6 0 3 .6 4.1 1.5l2.2-2.2A9.9 9.9 0 0 0 12 3a10 10 0 1 0 0 20c5.5 0 9.7-3.9 9.7-9.5 0-.6-.1-1.3-.35-2.4z"/></S>
  ),
  Brain: ({ size = 16, style }: IC) => (
    <S size={size} style={style}><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/></S>
  ),
};

/* ── 3D Nav Icons for sidebar ── */
const NAV_ICONS = {
  overview:  { bg: "linear-gradient(145deg,#818cf8 0%,#6366f1 50%,#4f46e5 100%)", sh: "#3730a3", hi: "rgba(255,255,255,0.22)" },
  board:     { bg: "linear-gradient(145deg,#34d399 0%,#10b981 50%,#059669 100%)", sh: "#047857", hi: "rgba(255,255,255,0.2)"  },
  saved:     { bg: "linear-gradient(145deg,#60a5fa 0%,#3b82f6 50%,#2563eb 100%)", sh: "#1d4ed8", hi: "rgba(255,255,255,0.2)"  },
  chat:      { bg: "linear-gradient(145deg,#f472b6 0%,#ec4899 50%,#db2777 100%)", sh: "#be185d", hi: "rgba(255,255,255,0.2)"  },
  autopilot: { bg: "linear-gradient(145deg,#fbbf24 0%,#f59e0b 50%,#d97706 100%)", sh: "#b45309", hi: "rgba(255,255,255,0.22)" },
  settings:  { bg: "linear-gradient(145deg,#94a3b8 0%,#64748b 50%,#475569 100%)", sh: "#334155", hi: "rgba(255,255,255,0.18)" },
};

function NavIcon3D({ type, size = 26 }: { type: keyof typeof NAV_ICONS; size?: number }) {
  const c = NAV_ICONS[type];
  const r = Math.round(size * 0.34);
  const iconSize = Math.round(size * 0.5);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: size, height: size, borderRadius: r,
      background: c.bg,
      boxShadow: `0 2px 0 ${c.sh}, 0 1px 0 ${c.hi} inset, 0 6px 14px ${c.sh}55`,
      flexShrink: 0, position: "relative",
    }}>
      {type === "overview"  && <Icons.Overview  size={iconSize} style={{ color:"#fff", strokeWidth:2.2 }}/>}
      {type === "board"     && <Icons.Board     size={iconSize} style={{ color:"#fff", strokeWidth:2.2 }}/>}
      {type === "saved"     && <Icons.Saved     size={iconSize} style={{ color:"#fff", strokeWidth:2.2 }}/>}
      {type === "chat"      && <Icons.Chat      size={iconSize} style={{ color:"#fff", strokeWidth:2.2 }}/>}
      {type === "autopilot" && <Icons.Autopilot size={iconSize} style={{ color:"#fff", strokeWidth:2.2 }}/>}
      {type === "settings"  && <Icons.Settings  size={iconSize} style={{ color:"#fff", strokeWidth:2.2 }}/>}
    </span>
  );
}

export function StarIcon({ size = 16 }: IC)         { return <NavIcon3D type="overview"  size={size}/>; }
export function BoardStarIcon({ size = 16 }: IC)    { return <NavIcon3D type="board"     size={size}/>; }
export function SavedStarIcon({ size = 16 }: IC)    { return <NavIcon3D type="saved"     size={size}/>; }
export function ChatStarIcon({ size = 16 }: IC)     { return <NavIcon3D type="chat"      size={size}/>; }
export function PilotStarIcon({ size = 16 }: IC)    { return <NavIcon3D type="autopilot" size={size}/>; }
export function SettingsStarIcon({ size = 16 }: IC) { return <NavIcon3D type="settings"  size={size}/>; }

export function ChatBotIcon({ size = 16, color = "#fff", style }: IC & { color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      <circle cx="9" cy="10" r="1" fill={color} stroke="none"/>
      <circle cx="12" cy="10" r="1" fill={color} stroke="none"/>
      <circle cx="15" cy="10" r="1" fill={color} stroke="none"/>
    </svg>
  );
}
