"use client";

import type { ReactNode } from "react";

/**
 * Inline error notice.
 *
 * Used wherever a form needs to say something went wrong. It replaces six
 * separate hand written banners, each of which had grown a slightly different
 * markup and used a warning emoji as its icon.
 *
 * The icon is a real SVG, so it inherits colour and size and is not rendered
 * differently depending on which platform the emoji font happens to be.
 * It is marked decorative because the message text beside it already carries
 * the meaning, so a screen reader should not announce the icon twice.
 */

export interface ErrorNoticeProps {
  children: ReactNode;
  /** Applies the softer style used for a field level hint. */
  variant?: 'block' | 'inline';
  id?: string;
}

export function ErrorNotice({ children, variant = 'block', id }: ErrorNoticeProps) {
  const inline = variant === 'inline';

  return (
    <div
      id={id}
      role="alert"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: inline ? 6 : 8,
        padding: inline ? "5px 8px" : "9px 12px",
        borderRadius: inline ? 7 : 9,
        fontSize: inline ? 11.5 : 12.5,
        lineHeight: 1.55,
        background: "rgba(239,68,68,0.08)",
        border: "1px solid rgba(239,68,68,0.24)",
        color: "#fca5a5",
      }}
    >
      <WarningIcon size={inline ? 12 : 14} style={{ color: "#f87171", flexShrink: 0, marginTop: 1 }} />
      <span style={{ minWidth: 0 }}>{children}</span>
    </div>
  );
}

/**
 * Filled warning triangle, drawn rather than typed.
 *
 * Kept local so the auth screens do not need to import the dashboard icon set.
 */
export function WarningIcon({
  size = 14,
  style,
}: {
  size?: number;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M10.3 3.9 1.9 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path
        d="M12 9.2v4.4"
        stroke="#1a1010"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="17" r="1.1" fill="#1a1010" />
    </svg>
  );
}
