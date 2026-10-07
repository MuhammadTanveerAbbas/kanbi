"use client";

import Link from "next/link";
import { useTheme } from "@/lib/theme";

/**
 * Sign in, sign up, and password screens.
 *
 * The theme is applied entirely through CSS. This component previously read the
 * theme from React state and interpolated the whole palette into a `<style>`
 * element, and it also hard-coded the page background as a ternary in JSX:
 *
 *   background: t === "dark" ? "...#07070b" : "...#f2f3fb"
 *
 * Both are the theme flash by another route. The server has no way to know the
 * stored preference, so it sent the light background, the browser painted it,
 * and hydration swapped it. The background and the shadow now resolve from
 * `[data-theme]` in CSS, which the blocking head script has already set before
 * the first paint.
 */
const AUTH_CSS = `
  html, body { height: 100%; }
  body { background: var(--bg); color: var(--tx); }

  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
  .fade-up { animation: fadeUp .38s cubic-bezier(.22,1,.36,1) both; }
  .spin { animation: spin .7s linear infinite; }

  /* Page shell: the card is centred with auto margins so it never gets
     clipped at the top when the form is taller than the screen */
  .auth-shell {
    min-height: 100vh;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 76px 16px calc(24px + env(safe-area-inset-bottom, 0px));
    position: relative;
    isolation: isolate;
    background:
      radial-gradient(ellipse at 50% -20%, var(--auth-glow) 0%, transparent 60%),
      var(--bg);
  }
  [data-theme='dark'] .auth-shell { --auth-glow: rgba(94,111,232,0.12); }
  [data-theme='light'] .auth-shell { --auth-glow: rgba(94,111,232,0.08); }

  .auth-card-shell {
    width: 100%;
    max-width: 420px;
    margin: auto;
    border-radius: 18px;
    overflow: hidden;
    background: var(--card);
    border: 1px solid var(--br);
    box-shadow: var(--auth-card-shadow);
  }
  [data-theme='dark'] .auth-card-shell { --auth-card-shadow: 0 0 0 1px rgba(255,255,255,0.04), 0 24px 80px rgba(0,0,0,0.7); }
  [data-theme='light'] .auth-card-shell { --auth-card-shadow: 0 24px 80px rgba(0,0,0,0.08); }

  .auth-accent {
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--ac) 35%, var(--pu) 65%, transparent);
    opacity: .85;
  }

  /* One padding scale shared by every login screen */
  .auth-card { padding: 32px 28px; }

  /* The top bar is a real header with the brand and the theme control, not a
     fixed overlay. Fixing it meant the card had to be pushed down by hand on
     every screen, which is why the two drifted out of alignment. */
  .auth-topbar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 10;
    padding: 14px clamp(14px, 4vw, 24px);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .auth-theme-btn {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    border: 1px solid var(--br);
    background: var(--bg1);
    color: var(--tx2);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: border-color .15s, color .15s;
  }
  .auth-theme-btn:hover { border-color: var(--brh); color: var(--tx); }

  .auth-check { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
  .auth-check:focus-visible + .auth-box { border-color: var(--ac) !important; box-shadow: 0 0 0 3px var(--as); }

  @media (max-width: 480px) {
    .auth-shell { padding: 68px 14px calc(20px + env(safe-area-inset-bottom, 0px)); }
    .auth-card { padding: 22px 18px; }
    .auth-card-shell { border-radius: 16px; }
  }
  @media (max-width: 380px) {
    .auth-card { padding: 20px 14px; }
  }
  @media (max-height: 720px) {
    .auth-card { padding: 24px 22px; }
  }
`;

const I = {
  zap: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>,
  sun: (s = 15) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>,
  moon: (s = 15) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>,
};

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const { theme, toggle } = useTheme();

  return (
    <>
      <style>{AUTH_CSS}</style>
      <div className="auth-shell">
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 0,
            backgroundImage:
              "linear-gradient(var(--br) 1px, transparent 1px), linear-gradient(90deg, var(--br) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />

        <header className="auth-topbar">
          <Link
            href="/"
            aria-label="Kanbi home"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "var(--tx)",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "var(--ac)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                boxShadow: "0 0 18px var(--ag)",
              }}
            >
              {I.zap(13)}
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.025em" }}>
              Kanbi
            </span>
          </Link>
          <button
            type="button"
            className="auth-theme-btn"
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            onClick={toggle}
          >
            {theme === "dark" ? I.sun() : I.moon()}
          </button>
        </header>

        <div className="fade-up auth-card-shell">{children}</div>
      </div>
    </>
  );
}
