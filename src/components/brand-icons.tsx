"use client";

import type { CSSProperties } from "react";

/**
 * Brand marks.
 *
 * These are filled, single path versions of each brand's own logo geometry
 * rather than generic line icons, so a visitor recognises the platform at a
 * glance. Each is drawn on a 24 by 24 grid and uses currentColor, so it
 * inherits the surrounding text colour and needs no colour handling of its own.
 *
 * Every icon takes a size and an optional style, matching the shape used by the
 * rest of the icon set in this project.
 */

export interface BrandIconProps {
  size?: number;
  style?: CSSProperties;
  /** Accessible name. When omitted the icon is treated as decorative. */
  title?: string;
}

function Svg({
  size = 16,
  style,
  title,
  children,
  viewBox = '0 0 24 24',
}: BrandIconProps & { children: React.ReactNode; viewBox?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function GitHubIcon({ size = 16, style, title }: BrandIconProps) {
  return (
    <Svg size={size} style={style} title={title}>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.34-1.28-1.7-1.28-1.7-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.4-5.25 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </Svg>
  );
}

export function XIcon({ size = 16, style, title }: BrandIconProps) {
  return (
    <Svg size={size} style={style} title={title}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </Svg>
  );
}

export function LinkedInIcon({ size = 16, style, title }: BrandIconProps) {
  return (
    <Svg size={size} style={style} title={title}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14Zm1.78 13.02H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z" />
    </Svg>
  );
}

export function NextIcon({ size = 16, style, title }: BrandIconProps) {
  return (
    <Svg size={size} style={style} title={title} viewBox="0 0 24 24">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12c2.7 0 5.2-.9 7.1-2.4L11 2.6C11.3 2.5 11.7 2.4 12 2.4c5.2 0 9.6 4.4 9.6 9.6S17.2 21.6 12 21.6 2.4 17.2 2.4 12 6.8 2.4 12 2.4v17.2l11.1-11.1C24.6 7.2 24 5.2 24 3.2 21.8 1.3 19 0 15.8 0h-3.8Z" opacity=".9" />
    </Svg>
  );
}

export function ReactIcon({ size = 16, style, title }: BrandIconProps) {
  return (
    <Svg size={size} style={style} title={title}>
      <circle cx="12" cy="12" r="2.05" />
      <g stroke="currentColor" strokeWidth="1" fill="none">
        <ellipse cx="12" cy="12" rx="10" ry="4.2" />
        <ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(120 12 12)" />
      </g>
    </Svg>
  );
}

export function TypeScriptIcon({ size = 16, style, title }: BrandIconProps) {
  return (
    <Svg size={size} style={style} title={title}>
      <path d="M3 3h18v18H3V3Zm2.6 12.3c.3.5.8.9 1.5.9.6 0 1-.3 1-.7 0-.5-.4-.7-1.3-.9l-.4-.1c-1.4-.3-2.3-1-2.3-2.3 0-1.2 1-2.2 2.5-2.2 1 0 1.8.4 2.4 1.1l-1.3.8c-.3-.4-.6-.6-1.1-.6-.5 0-.9.3-.9.7 0 .4.3.6 1.1.8l.4.1c1.5.3 2.4.9 2.4 2.3 0 1.4-1.1 2.4-2.7 2.4-1.4 0-2.4-.6-3-1.6l1.3-.7Zm6.4-4.3h-2.1V9.7h5.7v1.3h-2.1v5.7h-1.5V11Z" />
    </Svg>
  );
}

export function TailwindIcon({ size = 16, style, title }: BrandIconProps) {
  return (
    <Svg size={size} style={style} title={title} viewBox="0 0 24 24">
      <path d="M12 6c-2.67 0-4.33 1.33-5 4 1-1.33 2.17-1.83 3.5-1.5.76.19 1.3.74 1.9 1.35.98 1 2.1 2.15 4.6 2.15 2.67 0 4.33-1.33 5-4-1 1.33-2.17 1.83-3.5 1.5-.76-.19-1.3-.74-1.9-1.35-.98-1-2.1-2.15-4.6-2.15Zm-5 6c-2.67 0-4.33 1.33-5 4 1-1.33 2.17-1.83 3.5-1.5.76.19 1.3.74 1.9 1.35.98 1 2.1 2.15 4.6 2.15 2.67 0 4.33-1.33 5-4-1 1.33-2.17 1.83-3.5 1.5-.76-.19-1.3-.74-1.9-1.35C11.72 12.53 10.6 11.38 8.1 11.38H7Z" />
    </Svg>
  );
}

export function SupabaseIcon({ size = 16, style, title }: BrandIconProps) {
  return (
    <Svg size={size} style={style} title={title} viewBox="0 0 24 24">
      <path d="M21.36 12.1c-.1-1.68-.72-3.28-1.8-4.4A5.6 5.6 0 0 0 15.44 5.7c-1.56-.05-3.06.58-4.15 1.75a6.3 6.3 0 0 0-1.63 3.14 5.1 5.1 0 0 0-.72 3.03c.1 1.7.72 3.3 1.8 4.4a5.6 5.6 0 0 0 4.12 2c1.57.05 3.07-.58 4.16-1.75a6.3 6.3 0 0 0 1.63-3.14 5.1 5.1 0 0 0 .71-3.03ZM8.6 18.5a3.9 3.9 0 0 1-2.5-1.4 4.1 4.1 0 0 1-1.17-3.05c.03-.4.12-.8.25-1.16.05-.13.16-.14.23-.04.5.66 1.2 1.22 2.04 1.63.13.06.07.21-.04.27-.42.24-.8.55-1.13.92-.06.07-.12.16-.05.24.6.7 1.43 1.14 2.33 1.2.1 0 .19.08.19.18v.82c0 .1-.08.2-.2.2Zm7.94-1.87a3.9 3.9 0 0 1-2.5 1.4 3.9 3.9 0 0 1-2.5-1.3 4.1 4.1 0 0 1-1.17-3.05c0-2.8 2.23-5.07 4.97-5.07 1.34 0 2.42.46 3.2 1.3.78.83 1.2 2.2 1.17 3.05.03.85-.38 2.2-1.17 3.05a3.9 3.9 0 0 1-1.3 1.3 3.9 3.9 0 0 1-2.5 1.3Zm.9-3.3c0-1.6-1.2-2.9-2.66-2.9-1.47 0-2.66 1.3-2.66 2.9 0 1.6 1.2 2.9 2.66 2.9 1.47 0 2.66-1.3 2.66-2.9Zm-1.5.3a1.2 1.2 0 0 1-1.16 1.2c-.64 0-1.16-.54-1.16-1.2 0-.67.52-1.2 1.16-1.2.64 0 1.16.53 1.16 1.2Z" />
    </Svg>
  );
}

export function StripeIcon({ size = 16, style, title }: BrandIconProps) {
  return (
    <Svg size={size} style={style} title={title} viewBox="0 0 24 24">
      <path d="M13.53 10.24c0-.8-.66-1.11-1.72-1.37-1.06-.27-2.3-.49-2.3-1.6 0-.72.58-1.18 1.5-1.18 1.04 0 1.98.36 2.72.99l1.6-2.13c-.96-.85-2.24-1.33-3.68-1.33-.86 0-1.87.16-2.53.5a3.7 3.7 0 0 0-1.7 1.5 3.7 3.7 0 0 0-.4 1.9c0 1.9 1.83 2.44 3.5 2.9 1.6.44 1.7.85 1.7 1.2 0 .7-.7 1-1.4 1-1.25 0-2.24-.57-3-1.4l-1.7 2.2c1 1 2.4 1.6 4.03 1.6 1 0 2.2-.16 3-.57a3.7 3.7 0 0 0 1.7-1.7c.4-.7.6-1.5.6-2.5.2-.5.2-1.1.16-1.54h-.02v-.03ZM16.9 20.4h2.6V9.4h-2.6v11ZM3.1 20.4h2.6V9.4H3.1v11Z" />
    </Svg>
  );
}

export function VercelIcon({ size = 16, style, title }: BrandIconProps) {
  return (
    <Svg size={size} style={style} title={title}>
      <path d="M12 2 0 21.5h24L12 2Z" />
    </Svg>
  );
}

export function GroqIcon({ size = 16, style, title }: BrandIconProps) {
  return (
    <Svg size={size} style={style} title={title}>
      <path d="M12 1.5 2.5 6.7v10.6L12 22.5l9.5-5.2V6.7L12 1.5Zm0 2.3 7.3 4v8.4l-7.3 4-7.3-4V7.8l7.3-4Z" />
    </Svg>
  );
}

export function PlaywrightIcon({ size = 16, style, title }: BrandIconProps) {
  return (
    <Svg size={size} style={style} title={title} viewBox="0 0 24 24">
      <path d="M3 4.5h18a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Zm6.5 3a.9.9 0 0 0-.9.9v3.2a.9.9 0 1 0 1.8 0V9.5l3.4 2.6a.9.9 0 0 0 1.1-1.4l-3.4-2.6a.9.9 0 0 0-2 .8Z" />
      <path d="M2 17h20v1.6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V17Z" />
    </Svg>
  );
}

/** The tech stack, used in the footer and on the pricing page. */
export const TECH_STACK = [
  { name: 'Next.js', Icon: NextIcon },
  { name: 'React', Icon: ReactIcon },
  { name: 'TypeScript', Icon: TypeScriptIcon },
  { name: 'Tailwind CSS', Icon: TailwindIcon },
  { name: 'Supabase', Icon: SupabaseIcon },
  { name: 'Groq', Icon: GroqIcon },
  { name: 'Stripe', Icon: StripeIcon },
  { name: 'Vercel', Icon: VercelIcon },
] as const;

/** Social links shown in the footer. */
export const SOCIAL_LINKS = [
  { name: 'GitHub', href: 'https://github.com/MuhammadTanveerAbbas', Icon: GitHubIcon },
  { name: 'X', href: 'https://x.com/m_tanveerabbas', Icon: XIcon },
  { name: 'LinkedIn', href: 'https://linkedin.com/in/MuhammadTanveerAbbas', Icon: LinkedInIcon },
] as const;
