"use client";

import { useState, useEffect, useCallback } from "react";

const DARK_VARS = `--bg:#07070b;--bg1:#0d0d13;--bg2:#111119;--bg3:#16161f;--br:rgba(255,255,255,0.07);--brh:rgba(255,255,255,0.13);--tx:#e0e0ea;--tx2:#787896;--tx3:#3e3e55;--inp:#111119;--card:#0d0d13;`;
const LIGHT_VARS = `--bg:#f2f3fb;--bg1:#ffffff;--bg2:#eaebf8;--bg3:#e0e2f5;--br:rgba(0,0,0,0.07);--brh:rgba(0,0,0,0.14);--tx:#0a0a18;--tx2:#4a4a72;--tx3:#9898b8;--inp:#eaebf8;--card:#ffffff;`;

const AUTH_CSS = (theme: "dark" | "light") => `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }
  :root {
    ${theme === "dark" ? DARK_VARS : LIGHT_VARS}
    --ac:#5e6fe8; --ach:#6e7ff8; --as:rgba(94,111,232,0.12); --ag:rgba(94,111,232,0.22);
    --gr:#22c55e; --rd:#ef4444; --am:#f59e0b; --pu:#a78bfa;
  }
  body {
    font-family: 'Geist', -apple-system, sans-serif;
    background: var(--bg); color: var(--tx);
    -webkit-font-smoothing: antialiased;
    min-height: 100vh;
    transition: background .2s, color .2s;
  }
  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
  .fade-up { animation: fadeUp .38s cubic-bezier(.22,1,.36,1) both; }
  .spin { animation: spin .7s linear infinite; }
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
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("kanbi-theme") as "dark" | "light" | null;
    if (stored) { setTheme(stored); setMounted(true); return; }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setTheme(mq.matches ? "dark" : "light");
    setMounted(true);
    const fn = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("kanbi-theme")) setTheme(e.matches ? "dark" : "light");
    };
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(t => { const n = t === "dark" ? "light" : "dark"; localStorage.setItem("kanbi-theme", n); return n; });
  }, []);

  // Use dark as the consistent SSR default; client will update after mount
  const t = mounted ? theme : "dark";

  return (
    <>
      <style suppressHydrationWarning>{AUTH_CSS(t)}</style>
      <div suppressHydrationWarning style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "24px 16px",
        background: t === "dark"
          ? "radial-gradient(ellipse at 50% -20%, rgba(94,111,232,0.12) 0%, transparent 60%), #07070b"
          : "radial-gradient(ellipse at 50% -20%, rgba(94,111,232,0.08) 0%, transparent 60%), #f2f3fb",
      }}>
        <div style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
          backgroundImage: "linear-gradient(var(--br) 1px, transparent 1px), linear-gradient(90deg, var(--br) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }} />

        <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 10, padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--ac)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 0 18px var(--ag)" }}>
              {I.zap(13)}
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--tx)", letterSpacing: "-0.025em" }}>Kanbi</span>
          </a>
          <button
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

        <div className="fade-up" style={{
          position: "relative", zIndex: 1,
          width: "100%", maxWidth: 420,
          borderRadius: 18, border: "1px solid var(--br)",
          background: "var(--card)",
          boxShadow: t === "dark"
            ? "0 0 0 1px rgba(255,255,255,0.04), 0 24px 80px rgba(0,0,0,0.7)"
            : "0 24px 80px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}>
          {children}
        </div>

        <p style={{ position: "relative", zIndex: 1, marginTop: 24, fontSize: 12, color: "var(--tx3)", textAlign: "center" }}>
          Protected by Supabase Auth · <span style={{ color: "var(--ac)" }}>kanbi.app</span>
        </p>
      </div>
    </>
  );
}
