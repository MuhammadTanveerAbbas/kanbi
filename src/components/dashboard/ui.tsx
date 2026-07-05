"use client";

import type { Priority } from "@/components/dashboard/types";

export const PRI: Record<Priority, { label: string; color: string; bg: string }> = {
  urgent: { label:"Urgent", color:"var(--ur)",  bg:"rgba(249,115,22,0.11)" },
  high:   { label:"High",   color:"var(--rd)",  bg:"rgba(239,68,68,0.11)"  },
  medium: { label:"Med",    color:"var(--am)",  bg:"rgba(245,158,11,0.11)" },
  low:    { label:"Low",    color:"var(--tx3)", bg:"rgba(255,255,255,0.04)"},
};

export function PriBadge({ p }: { p: Priority }) {
  const c = PRI[p];
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
      padding: "2px 8px", borderRadius: 99,
      background: c.bg, color: c.color,
      textTransform: "uppercase", whiteSpace: "nowrap",
      fontFamily: "var(--font-mono)",
      border: `1px solid ${c.color}22`,
    }}>
      {c.label}
    </span>
  );
}

export function Avt({ name, size = 28, avatarUrl }: { name: string; size?: number; avatarUrl?: string }) {
  const init = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  if (avatarUrl) {
    return (
      <img src={avatarUrl} alt={name} width={size} height={size}
        style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0,
          boxShadow: "0 0 0 2px var(--bg1), 0 0 0 3px var(--br)" }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg, var(--ac), var(--pu))",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.34, fontWeight: 700, color: "#fff", flexShrink: 0,
      fontFamily: "var(--font-display)",
      boxShadow: "0 0 0 2px var(--bg1), 0 0 0 3px var(--br), 0 2px 8px rgba(99,102,241,0.3)",
      letterSpacing: "-0.02em",
    }}>
      {init}
    </div>
  );
}

export function PBar({ value, color = "var(--ac)", h = 4, animated = true }: {
  value: number; color?: string; h?: number; animated?: boolean
}) {
  return (
    <div style={{ height: h, borderRadius: h, background: "var(--br)", overflow: "hidden", position: "relative" }}>
      <div style={{
        height: "100%",
        width: `${Math.min(value, 100)}%`,
        background: color,
        borderRadius: h,
        transition: animated ? "width .9s cubic-bezier(.4,0,.2,1)" : "none",
        position: "relative",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
          borderRadius: "inherit",
        }}/>
      </div>
    </div>
  );
}

export function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div onClick={onToggle} style={{
      width: 40, height: 22, borderRadius: 11,
      background: on ? "var(--ac)" : "var(--bg3)",
      cursor: "pointer", position: "relative",
      transition: "background .22s", flexShrink: 0,
      boxShadow: on ? "0 0 12px rgba(99,102,241,0.3)" : "none",
    }}>
      <div style={{
        position: "absolute", top: 3,
        left: on ? 21 : 3, width: 16, height: 16,
        borderRadius: "50%", background: "#fff",
        transition: "left .22s cubic-bezier(.34,1.56,.64,1)",
        boxShadow: "0 1px 4px rgba(0,0,0,.3)",
      }}/>
    </div>
  );
}

export function Skeleton({ w = "100%", h = 16, style }: { w?: string|number; h?: number; style?: React.CSSProperties }) {
  return <div className="skeleton" style={{ width: w, height: h, ...style }}/>;
}
