"use client";

type IC = { size?: number; style?: React.CSSProperties };
const Ic = (d: string | string[], s = 16, sw = "1.75", fill = "none") => {
  return ({ size = s, style }: IC) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}>
      {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
};

export const Icons = {
  LayoutGrid: Ic(["M3 3h7v7H3z","M14 3h7v7h-7z","M3 14h7v7H3z","M14 14h7v7h-7z"]),
  Overview:   Ic(["M3 3h7v7H3z","M14 3h7v7h-7z","M3 14h7v7H3z","M14 14h7v7h-7z"]),
  Board:      Ic(["M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"]),
  Chat:       Ic("M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"),
  Autopilot:  Ic("M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z"),
  Saved:      Ic("M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"),
  Settings:   Ic(["M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z","M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"]),
  Zap:        Ic("M13 2L3 14h9l-1 8 10-12h-9l1-8z", 14, "2.2"),
  Send:       Ic("M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"),
  Plus:       Ic("M12 5v14M5 12h14", 14, "2.2"),
  Check:      Ic("M20 6L9 17l-5-5", 13, "2.5"),
  ChevD:      Ic("M6 9l6 6 6-6", 14, "2"),
  ChevR:      Ic("M9 18l6-6-6-6", 12, "2"),
  X:          Ic("M18 6L6 18M6 6l12 12", 14, "2.2"),
  Search:     Ic(["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z","M21 21l-4.35-4.35"]),
  Folder:     Ic("M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"),
  Calendar:   Ic(["M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z","M16 2v4M8 2v4M3 10h18"]),
  Clock:      Ic(["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z","M12 6v6l4 2"]),
  Sun:        Ic("M12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7zm0-4v2M12 19v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"),
  Moon:       Ic("M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"),
  Trash:      Ic(["M3 6h18","M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6","M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"]),
  Crown:      Ic("M2 20h20M5 20V9l7-5 7 5v11"),
  Logout:     Ic(["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4","M16 17l5-5-5-5","M21 12H9"]),
  Shield:     Ic("M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"),
  Card:       Ic(["M1 4h22v16H1z","M1 9h22"]),
  Lock:       Ic("M12 1a5 5 0 0 0-5 5v4H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-2V6a5 5 0 0 0-5-5zm0 2a3 3 0 0 1 3 3v4H9V6a3 3 0 0 1 3-3zm1 10a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"),
  Download:   Ic(["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4","M7 10l5 5 5-5","M12 15V3"]),
  Pdf:        Ic(["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z","M14 2v6h6"]),
  Paste:      Ic(["M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2","M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z"]),
  Template:   Ic(["M4 3h16a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z","M4 11h6v10H4z","M14 11h6v10h-6z"]),
  Target:     Ic(["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z","M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z","M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"]),
  Trending:   Ic("M23 6l-9.5 9.5-5-5L1 18"),
  Upload:     Ic(["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4","M17 8l-5-5-5 5","M12 3v12"]),
  Bell:       Ic(["M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9","M13.73 21a2 2 0 0 1-3.46 0"]),
  Google:     Ic("M21.35 11.1h-9.2v3h5.3c-.5 2.4-2.6 4-5.3 4a6 6 0 1 1 0-12c1.6 0 3 .6 4.1 1.5l2.2-2.2A9.9 9.9 0 0 0 12 3a10 10 0 1 0 0 20c5.5 0 9.7-3.9 9.7-9.5 0-.6-.1-1.3-.35-2.4z"),
  Edit:       Ic(["M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7","M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"]),
  Brain:      Ic("M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"),
  AlertTri:  Ic(["M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z","M12 9v4M12 17h.01"]),
  Copy:       Ic(["M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2z","M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"]),
  MoveFolder: Ic(["M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z","M12 11v6M9 14l3 3 3-3"]),
  Sparkle:    Ic(["M5 3l.5 2L8 5.5 5.5 6 5 8l-.5-2L2 5.5 4.5 5z","M12 2l1 4 4 1-4 1-1 4-1-4-4-1 4-1z","M19 13l.5 2 2 .5-2 .5-.5 2-.5-2-2-.5 2-.5z"]),
  ArrowR:     Ic("M5 12h14M12 5l7 7-7 7"),
  Layers:     Ic(["M12 2L2 7l10 5 10-5-10-5z","M2 17l10 5 10-5","M2 12l10 5 10-5"]),
  Activity:   Ic("M22 12h-4l-3 9L9 3l-3 9H2"),
};

export function StarIcon({ size = 16, style }: IC) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
    </svg>
  );
}

export function BoardStarIcon({ size = 16, style }: IC) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <rect x="3" y="3" width="5" height="18" rx="1.5"/>
      <rect x="10" y="3" width="5" height="12" rx="1.5"/>
      <rect x="17" y="3" width="4" height="8" rx="1.5"/>
      <path d="M19 16l.6 1.8H22l-1.5 1.1.6 1.8L19 19.7l-1.5 1 .6-1.8L16.5 17.8h1.9z" fill="#a78bfa" stroke="none"/>
    </svg>
  );
}

export function SavedStarIcon({ size = 16, style }: IC) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      <path d="M12 7l.8 2.4H15l-1.9 1.4.7 2.2L12 11.8l-1.8 1.2.7-2.2L9 9.4h2.2z" fill="#a78bfa" stroke="none"/>
    </svg>
  );
}

export function ChatStarIcon({ size = 16, style }: IC) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
    </svg>
  );
}

/** Chat bubble icon for in-app AI assistant UI */
export function ChatBotIcon({ size = 16, color = "#fff", style }: IC & { color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
      <circle cx="9" cy="11.5" r="1" fill={color} stroke="none"/>
      <circle cx="12" cy="11.5" r="1" fill={color} stroke="none"/>
      <circle cx="15" cy="11.5" r="1" fill={color} stroke="none"/>
    </svg>
  );
}

export function PilotStarIcon({ size = 16, style }: IC) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5z"/>
      <path d="M5 17l.6 1.8H7.5l-1.5 1.1.5 1.8L5 20.5l-1.5 1 .5-1.8L2.5 18.6H4.4z" fill="#a78bfa" stroke="none"/>
      <path d="M19 14l.5 1.4H21l-1.2.9.4 1.4L19 16.8l-1.2.9.4-1.4-1.2-.9h1.5z" fill="#a78bfa" stroke="none"/>
    </svg>
  );
}

export function SettingsStarIcon({ size = 16, style }: IC) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      <path d="M12 10.5l.5 1.5H14l-1.2.9.4 1.4L12 13.3l-1.2.9.4-1.4L10 12h1.5z" fill="#a78bfa" stroke="none"/>
    </svg>
  );
}
