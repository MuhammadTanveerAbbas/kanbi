"use client";

import React, { useState, type ReactNode } from "react";
import type { Priority } from "@/components/dashboard/types";

export const PRI: Record<Priority, { label: string; color: string; bg: string }> = {
  urgent: { label:"Urgent", color:"var(--ur-text)",  bg:"rgba(249,115,22,0.11)" },
  high:   { label:"High",   color:"var(--rd-text)",  bg:"rgba(239,68,68,0.11)"  },
  medium: { label:"Med",    color:"var(--am-text)",  bg:"rgba(245,158,11,0.11)" },
  low:    { label:"Low",    color:"var(--tx3)", bg:"rgba(255,255,255,0.04)"},
};

/**
 * Priority pill.
 *
 * The label is the priority and the colour is a second signal, never the only
 * one: "Med" is written out in every pill rather than left to the fill colour,
 * because a red and an orange badge are the same shape to a reader who cannot
 * separate those hues. `title` repeats it for the truncated compact form.
 */
export function PriBadge({ p }: { p: Priority }) {
  const c = PRI[p];
  return (
    <span title={`Priority: ${c.label}`} style={{
      fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
      padding: "2px 8px", borderRadius: 99,
      background: c.bg, color: c.color,
      textTransform: "uppercase", whiteSpace: "nowrap",
      fontFamily: "var(--font-mono)",
      border: `1px solid ${c.color}33`,
      flexShrink: 0,
    }}>
      {c.label}
    </span>
  );
}

export function Avt({ name, size = 28, avatarUrl }: { name: string; size?: number; avatarUrl?: string }) {
  const init = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const [imgErr, setImgErr] = useState(false);
  if (avatarUrl && !imgErr) {
    return (
      // next/image is intentionally not used here. The avatar URL comes from the
      // user's own profile record and can point at any host, so allowing it would
      // mean adding a wildcard remotePatterns entry that permits Next's image
      // optimizer to fetch any attacker-chosen URL. These avatars are 28 to 32px
      // and already carry explicit width, height, and referrerPolicy, so the
      // optimizer would not measurably help at this size.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setImgErr(true)}
        style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0,
          boxShadow: "0 0 0 2px var(--bg1), 0 0 0 3px var(--br)" }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg, var(--ac), var(--pu))",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 700, color: "#fff", flexShrink: 0,
      fontFamily: "var(--font-display)",
      boxShadow: "0 0 0 2px var(--bg1), 0 0 0 3px var(--br)",
      letterSpacing: "-0.02em",
    }}>
      {init}
    </div>
  );
}

/**
 * Progress bar.
 *
 * Exposed as a progressbar role so the number is announced. The fill colour
 * is decorative, which is why a label is required: a bar on its own would be
 * an unlabelled graphic.
 */
export function PBar({ value, color = "var(--ac)", h = 4, animated = true, label }: {
  value: number; color?: string; h?: number; animated?: boolean; label: string
}) {
  const pct = Math.min(Math.max(value, 0), 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{ height: h, borderRadius: h, background: "var(--br)", overflow: "hidden", position: "relative" }}
    >
      <div style={{
        height: "100%",
        width: `${pct}%`,
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

/**
 * Settings switch.
 *
 * A real button with `role="switch"` rather than a div with a click handler.
 * The previous div could not be reached by keyboard, could not be announced as
 * on or off, and was 22px tall against a 44px touch target.
 */
export function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      style={{
        width: 44, height: 26, borderRadius: 13,
        background: on ? "var(--ac)" : "var(--bg3)",
        cursor: "pointer", position: "relative",
        transition: "background .22s", flexShrink: 0,
        border: "1px solid var(--br)",
        boxShadow: on ? "0 0 12px rgba(99,102,241,0.3)" : "none",
      }}
    >
      <span style={{
        position: "absolute", top: 3,
        left: on ? 23 : 3, width: 18, height: 18,
        borderRadius: "50%", background: "#fff",
        transition: "left .22s cubic-bezier(.34,1.56,.64,1)",
        boxShadow: "0 1px 4px rgba(0,0,0,.3)",
        pointerEvents: "none",
      }}/>
    </button>
  );
}

export function Skeleton({ w = "100%", h = 16, style }: { w?: string|number; h?: number; style?: React.CSSProperties }) {
  return <div className="skeleton" style={{ width: w, height: h, ...style }}/>;
}

/**
 * Spinner.
 *
 * One component for every async control in the dashboard. The previous copy
 * per button was written out eleven times and had drifted: some had a 10px
 * ring on a grey border, some a 14px ring on a translucent white, so two
 * buttons doing the same thing looked like different features. `tone="light"`
 * is for a spinner sitting on a filled accent button, where a grey track
 * would be invisible.
 */
export function Spinner({ size = 12, tone = "light" }: { size?: number; tone?: "light" | "onFill" }) {
  const track = tone === "onFill" ? "rgba(255,255,255,.3)" : "var(--br)";
  const head = tone === "onFill" ? "#fff" : "var(--ac)";
  return (
    <span
      aria-hidden="true"
      className="spin"
      style={{
        width: size, height: size, borderRadius: "50%",
        border: `2px solid ${track}`, borderTopColor: head,
        display: "inline-block", flexShrink: 0,
      }}
    />
  );
}

/**
 * The dashboard's empty state.
 *
 * Every list and panel that can be empty uses this: a short title, one line of
 * guidance, and a primary action when there is something to do about it. The
 * board, saved, autopilot and settings panels each had their own version with
 * a different icon size, padding and title weight. The chat empty state in
 * `lib/ai/chat-copy.ts` follows the same three part shape.
 */
export function EmptyState({ icon, title, body, action, small }: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
  small?: boolean;
}) {
  return (
    <div className={`empty-state${small ? " empty-state-sm" : ""}`}>
      <span className="empty-state-icon">{icon}</span>
      <p className="empty-state-title">{title}</p>
      <p className="empty-state-body">{body}</p>
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}

/** Text input with a label and the shared focus treatment. */
export function Field({ id, label, hint, children }: {
  id: string; label: string; hint?: string; children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} style={{
        fontSize: 12, fontWeight: 600, color: "var(--tx2)",
        display: "block", marginBottom: 7,
      }}>{label}</label>
      {children}
      {hint && (
        <p id={`${id}-hint`} style={{ fontSize: 11, color: "var(--tx3)", marginTop: 4 }}>{hint}</p>
      )}
    </div>
  );
}

/** One line of text describing a number, used by the stat cards. */
export function StatNote({ children, tone }: { children: ReactNode; tone?: "good" | "warn" }) {
  return (
    <p style={{
      fontSize: 10.5,
      color: tone === "good" ? "var(--gr)" : tone === "warn" ? "var(--am)" : "var(--tx3)",
      fontWeight: tone ? 600 : 400,
    }}>{children}</p>
  );
}
