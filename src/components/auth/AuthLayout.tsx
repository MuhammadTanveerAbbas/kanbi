"use client";

import { useEffect } from "react";
import Link from "next/link";
import { appThemeVars, startThemeWatch, useTheme } from "@/lib/theme";

const AUTH_CSS = (theme: "dark" | "light") => `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }
  :root {
    ${appThemeVars(theme)}
    --ac:#5e6fe8; --ach:#6e7ff8; --as:rgba(94,111,232,0.12); --ag:rgba(94,111,232,0.22);
    --gr:#22c55e; --rd:#ef4444; --am:#f59e0b; --pu:#a78bfa;
  }
  body {
    font-family: var(--font-geist), -apple-system, sans-serif;
    background: var(--bg); color: var(--tx);
    -webkit-font-smoothing: antialiased;
    min-height: 100vh;
    transition: background .2s, color .2s;
  }
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
  }
  .auth-card-shell {
    width: 100%;
    max-width: 420px;
    margin: auto;
    border-radius: 18px;
    overflow: hidden;
  }
  .auth-accent {
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--ac) 35%, var(--pu) 65%, transparent);
    opacity: .85;
  }

  /* One padding scale shared by every login screen */
  .auth-card { padding: 32px 28px; }

  .auth-theme-btn:focus-visible { border-color: var(--brh) !important; color: var(--tx) !important; }
  .auth-check { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
  .auth-check:focus-visible + .auth-box { border-color: var(--ac-text) !important; box-shadow: 0 0 0 3px var(--as); }

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
  zap: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>,
  sun: (s = 15) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>,
  moon: (s = 15) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>,
};

interface AuthLayoutProps {
  children: React.ReactNode;
}


export default function AuthLayout({ children }: AuthLayoutProps) {
  const { theme: t, toggle: toggleTheme } = useTheme();
  // The sign in screens previously carried their own copy of the theme store.
  // It worked, but it did not follow changes made in another tab and it had its
  // own idea of which grey was muted, which is how the two drifted apart.
  useEffect(() => startThemeWatch(), []);

  return (
    <>
      <style suppressHydrationWarning>{AUTH_CSS(t)}</style>
      <div suppressHydrationWarning className="auth-shell" style={{
        background: t === "dark"
          ? "radial-gradient(ellipse at 50% -20%, rgba(94,111,232,0.12) 0%, transparent 60%), #07070b"
          : "radial-gradient(ellipse at 50% -20%, rgba(94,111,232,0.08) 0%, transparent 60%), #f2f3fb",
      }}>
        <div aria-hidden="true" style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
          backgroundImage: "linear-gradient(var(--br) 1px, transparent 1px), linear-gradient(90deg, var(--br) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }} />

        <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 10, padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" aria-label="Kanbi home" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--ac-solid)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 0 18px var(--ag)" }}>
              {I.zap(13)}
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--tx)", letterSpacing: "-0.025em" }}>Kanbi</span>
          </Link>
          <button
            type="button"
            className="auth-theme-btn"
            aria-label={t === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            title="Toggle theme"
            onClick={toggleTheme}
            style={{
              width: 34, height: 34, borderRadius: 8,
              border: "1px solid var(--br)", background: "var(--bg1)",
              color: "var(--tx2)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "border-color .15s, color .15s"
            }}
            onMouseOver={e => { e.currentTarget.style.borderColor = "var(--brh)"; e.currentTarget.style.color = "var(--tx)"; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = "var(--br)"; e.currentTarget.style.color = "var(--tx2)"; }}
          >
            {t === "dark" ? I.sun() : I.moon()}
          </button>
        </div>

        <div className="fade-up auth-card-shell" style={{
          border: "1px solid var(--br)",
          background: "var(--card)",
          boxShadow: t === "dark"
            ? "0 0 0 1px rgba(255,255,255,0.04), 0 24px 80px rgba(0,0,0,0.7)"
            : "0 24px 80px rgba(0,0,0,0.08)",
        }}>
          {children}
        </div>
      </div>
    </>
  );
}
