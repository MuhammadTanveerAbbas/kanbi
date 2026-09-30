"use client";
// KANBI LANDING PAGE v3
// Updates: (1) Hero mock matches new dashboard (sidebar+health ring+progress bars)
//          (2) NEW tabbed Product Showcase   Dashboard, Board, AI Chat, Autopilot
import { startThemeWatch, themeVars, useTheme as useSiteTheme } from '@/lib/theme';
import { useState, useEffect, useRef, createContext, useContext, useCallback, type ComponentType } from "react";
import { createClient } from '@/lib/supabase/client';
import { BarChart3, CalendarDays, CircleGauge, ClipboardList, Layers3, MessageSquareText, Workflow, ShieldCheck, Eye, ArrowRight, CheckCircle2, TimerReset, PanelTop, FileDown, BrainCircuit, Boxes, Target, ListTodo, TrendingUp, BadgeCheck, Flame, Orbit, LaptopMinimal, PanelRightOpen, Stars, GitBranch, Gauge, Clock3, Route, BadgeInfo, SquareKanban, SplitSquareVertical, ArrowUpRight, BookOpenText, Sparkles, MoveRight } from "lucide-react";
import Link from "next/link";
import { SOCIAL_LINKS, TECH_STACK } from "./brand-icons";

type Theme = "dark" | "light";
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({ theme: "dark", toggle: () => { } });
const useTheme = () => useContext(ThemeCtx);


function Styles({ theme }: { theme: Theme }) {
  return <style suppressHydrationWarning>{`
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{${themeVars(theme)}
`}</style>;
}

function useInView(ref: React.RefObject<HTMLElement | null>, thr = 0.12) {
  const [v, setV] = useState(false);
  // Fires once per mounted element. ref.current is null until the element
  // exists, so ref and threshold are intentionally not dependencies.
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const o = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setV(true); o.disconnect(); } }, { threshold: thr });
    o.observe(el); return () => o.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return v;
}
function useCountUp(target: number, active: boolean, dur = 1600) {
  const [n, setN] = useState(0);
  useEffect(() => { if (!active) return; let r: number; const t0 = performance.now(); const tick = (now: number) => { const p = Math.min((now - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3); setN(Math.round(e * target)); if (p < 1) r = requestAnimationFrame(tick); }; r = requestAnimationFrame(tick); return () => cancelAnimationFrame(r); }, [active, target, dur]);
  return n;
}
function useScrollP() {
  const [p, setP] = useState(0);
  useEffect(() => { const fn = () => { const d = document.documentElement; setP(d.scrollTop / (d.scrollHeight - d.clientHeight) || 0); }; window.addEventListener("scroll", fn, { passive: true }); return () => window.removeEventListener("scroll", fn); }, []);
  return p;
}

function ST({ text, style: s }: { text: string; delay?: number; style?: React.CSSProperties; playOnMount?: boolean }) {
  return <span style={{ display: "inline", ...s }}>{text}</span>;
}

function Wavy() {
  return <span style={{ position: "relative", display: "inline-block" }}>
    <svg viewBox="0 0 290 13" preserveAspectRatio="none" style={{ position: "absolute", bottom: -10, left: 0, width: "100%", height: 13, overflow: "visible", pointerEvents: "none" }}>
      <defs><linearGradient id="wg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="var(--ac)" /><stop offset="55%" stopColor="var(--pu)" /><stop offset="100%" stopColor="var(--ac)" /></linearGradient></defs>
      <path className="wavy drawn" d="M3 8 C25 2,50 13,75 7 C100 1,125 13,150 7 C175 1,200 13,225 7 C250 1,268 11,287 7" fill="none" stroke="url(#wg)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  </span>;
}

/**
 * Builds a named icon component from SVG path data. A named function is used
 * rather than an anonymous arrow returned from a factory so React DevTools and
 * the react/display-name rule can identify each icon.
 */
const S = (name: string, d: string | string[], sw = "1.8") => {
  const Icon = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
  Icon.displayName = name;
  return Icon;
};
const IC = {
  ArrowRight: ({ size = 16, style }: { size?: number; style?: React.CSSProperties }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true" focusable="false">
      <path d="M4 12h15"/><path d="m13 6 6 6-6 6"/>
    </svg>
  ),
  Zap: S('Zap', "M13 2L3 14h9l-1 8 10-12h-9l1-8z", "2.2"),
  Spark: S('Spark', "M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z"),
  Shield: S('Shield', "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"),
  Brain: S('Brain', "M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"),
  Cal: S('Cal', ["M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z", "M16 2v4M8 2v4M3 10h18"]),
  Chart: S('Chart', "M18 20V10M12 20V4M6 20v-6"),
  Chat: S('Chat', "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"),
  Export: S('Export', ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M17 8l-5-5-5 5", "M12 3v12"]),

  Board: S('Board', ["M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"]),
  Check: S('Check', "M20 6L9 17l-5-5", "2.5"),
  Arrow: S('Arrow', "M5 12h14M12 5l7 7-7 7", "2.2"),
  ChevD: S('ChevD', "M6 9l6 6 6-6", "2"),
  Sun: S('Sun', "M12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7zm0-4v2M12 19v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"),
  Moon: S('Moon', "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"),
  Menu: S('Menu', "M4 6h16M4 12h16M4 18h16", "2"),
  X: S('X', "M18 6L6 18M6 6l12 12", "2"),
};

const ICONS = {
  dashboard: CircleGauge,
  board: SquareKanban,
  chat: MessageSquareText,
  autopilot: Workflow,
  health: ShieldCheck,
  parsing: ClipboardList,
  planning: CalendarDays,
  export: FileDown,
  analytics: BarChart3,
  speed: Gauge,
  focus: Target,
  flow: SplitSquareVertical,
};

function Navbar() {
  const { theme, toggle } = useTheme();
  const [mob, setMob] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const prog = useScrollP();
  const handleGetStarted = () => {
    window.location.href = '/sign-up';
  };
  const closeMob = useCallback(() => setMob(false), []);
  useEffect(() => { const fn = () => setScrolled(window.scrollY > 24); window.addEventListener("scroll", fn, { passive: true }); return () => window.removeEventListener("scroll", fn); }, []);
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);
  useEffect(() => {
    if (!mob) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeMob(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [mob, closeMob]);
  const links = [["Features", "#features"], ["How It Works", "#how-it-works"], ["Product", "#showcase"], ["Pricing", "/pricing"], ["FAQ", "#faq"]];
  return (<>
    <nav className={`lp-nav${mob ? " lp-nav-open" : ""}`} style={{ borderBottom: `1px solid ${scrolled || mob ? "var(--br)" : "transparent"}`, background: scrolled || mob ? "var(--nb)" : "transparent", backdropFilter: scrolled || mob ? "blur(24px)" : "none", WebkitBackdropFilter: scrolled || mob ? "blur(24px)" : "none" }}>
      <div style={{ position: "absolute", bottom: -1, left: 0, height: 1, background: "linear-gradient(90deg,var(--ac),var(--pu))", width: `${prog * 100}%`, transition: "width .1s linear", opacity: mob ? 0 : 1 }} />
      <div className="lp-wrap nav-inner">
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }} onClick={closeMob}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--ac-solid)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 0 18px var(--ag)" }}><IC.Zap size={13} /></div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--tx)", letterSpacing: "-0.025em" }}>Kanbi</span>
        </Link>
        <div className="nl" style={{ display: "flex", gap: 26, alignItems: "center", flex: 1, justifyContent: "center" }}>
          {links.map(([l, h]) => <a key={l} href={h} className="na" style={{ fontSize: 13, color: "var(--tx2)", transition: "color .15s", whiteSpace: "nowrap" }}>{l}</a>)}
        </div>
        <div className="nav-actions">
          <button className="nav-theme-btn" onClick={toggle} aria-label="Toggle theme" style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid var(--br)", background: "var(--bg1)", color: "var(--tx2)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s", flexShrink: 0 }} onMouseOver={e => { e.currentTarget.style.borderColor = "var(--brh)"; e.currentTarget.style.color = "var(--tx)" }} onMouseOut={e => { e.currentTarget.style.borderColor = "var(--br)"; e.currentTarget.style.color = "var(--tx2)" }}>
            {theme === "dark" ? <IC.Sun size={14} /> : <IC.Moon size={14} />}
          </button>
          {user
            ? <a href="/dashboard" className="nav-cta-desktop" style={{ height: 34, padding: "0 15px", borderRadius: 8, background: "var(--inv)", color: "var(--inv2)", fontSize: 13, fontWeight: 600, alignItems: "center", transition: "opacity .15s", textDecoration: "none", whiteSpace: "nowrap" }} onMouseOver={e => (e.currentTarget.style.opacity = ".88")} onMouseOut={e => (e.currentTarget.style.opacity = "1")}>Dashboard</a>
            : <button onClick={handleGetStarted} className="nav-cta-desktop" style={{ height: 34, padding: "0 15px", borderRadius: 8, background: "var(--ac-solid)", color: "#fff", fontSize: 13, fontWeight: 600, alignItems: "center", transition: "opacity .15s", border: "none", whiteSpace: "nowrap" }} onMouseOver={e => (e.currentTarget.style.opacity = ".88")} onMouseOut={e => (e.currentTarget.style.opacity = "1")}>Get Started Free</button>
          }
          <button className="ms" onClick={() => setMob(!mob)} aria-label={mob ? "Close menu" : "Open menu"} aria-expanded={mob}>{mob ? <IC.X size={18} /> : <IC.Menu size={18} />}</button>
        </div>
      </div>
    </nav>
    {mob && (
      <div className="mob-menu" role="dialog" aria-modal="true" aria-label="Navigation menu">
        <div className="mob-menu-grid" />
        <div className="mob-menu-glow" />
        <div className="mob-menu-head">
          <Link href="/" onClick={closeMob} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,var(--ac),var(--pu))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 0 16px var(--ag)" }}><IC.Zap size={14} /></div>
            <span style={{ fontSize: 16, fontWeight: 700, color: "var(--tx)", letterSpacing: "-0.03em" }}>Kanbi</span>
          </Link>
          <button type="button" className="mob-menu-close" onClick={closeMob} aria-label="Close menu"><IC.X size={16} /></button>
        </div>
        <nav className="mob-menu-body">
          <div className="mob-menu-intro">
            <p className="mob-menu-kicker">Navigation</p>
            <p className="mob-menu-desc">AI task planning built for freelancers and solo operators.</p>
          </div>
          <div className="mob-nav-panel">
            {links.map(([l, h], i) => (
              <a key={l} href={h} className="mob-link" onClick={closeMob}>
                <span className="mob-link-num">{String(i + 1).padStart(2, "0")}</span>
                <span className="mob-link-text">{l}</span>
                <span className="mob-link-arrow"><IC.Arrow size={13} /></span>
              </a>
            ))}
          </div>
          {user
            ? <a href="/dashboard" className="mob-signin" onClick={closeMob}>Go to your dashboard <IC.ArrowRight size={13} style={{ display: "inline-block", verticalAlign: "-2px", marginLeft: 4 }}/></a>
            : <a href="/sign-in" className="mob-signin" onClick={closeMob}>Already have an account? Sign in</a>
          }
        </nav>
        <div className="mob-menu-foot">
          <div className="mob-foot-panel">
            <div className="mob-theme-row">
              <div className="mob-theme-info">
                <span className="mob-theme-icon">{theme === "dark" ? <IC.Moon size={15} /> : <IC.Sun size={15} />}</span>
                <div className="mob-theme-copy">
                  <span className="mob-theme-label">Appearance</span>
                  <span className="mob-theme-value">{theme === "dark" ? "Dark mode on" : "Light mode on"}</span>
                </div>
              </div>
              <button type="button" className="mob-theme-toggle" onClick={toggle} aria-label="Toggle theme">
                {theme === "dark" ? <><IC.Sun size={13} /> Light</> : <><IC.Moon size={13} /> Dark</>}
              </button>
            </div>
            {user
              ? <a href="/dashboard" onClick={closeMob} className="mob-cta">Go to Dashboard <IC.Arrow size={15} /></a>
              : <a href="/sign-up" onClick={closeMob} className="mob-cta">Get Started Free <IC.Arrow size={15} /></a>
            }
          </div>
        </div>
      </div>
    )}
  </>);
}

function HeroWorkloadBar({ active, score = 82 }: { active: boolean; score?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, border: "1px solid var(--br)", background: "var(--bg2)", flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 88 }}>
        <ShieldCheck size={14} style={{ color: "var(--gr-text)", flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--tx)" }}>Workload</span>
      </div>
      <div style={{ flex: "1 1 120px", height: 7, borderRadius: 999, background: "var(--bg3)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: active ? `${score}%` : "0%", borderRadius: 999, background: "linear-gradient(90deg,var(--gr),#4ade80)", transition: "width 1s cubic-bezier(.22,1,.36,1) .35s" }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--tx)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{score}<span style={{ color: "var(--tx3)", fontWeight: 500, fontSize: 11 }}> / 100</span></span>
      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--gr-text)", padding: "4px 9px", borderRadius: 999, background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)", whiteSpace: "nowrap" }}>Balanced</span>
    </div>
  );
}

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const v = useInView(ref as React.RefObject<HTMLElement>);
  const handleGetStarted = () => {
    window.location.href = '/sign-up';
  };
  return (
    <section className="hero-section" style={{ position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(var(--br) 1px,transparent 1px),linear-gradient(90deg,var(--br) 1px,transparent 1px)", backgroundSize: "72px 72px" }} />
      <div style={{ position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)", width: 800, height: 520, background: "radial-gradient(ellipse,var(--ag) 0%,transparent 68%)", pointerEvents: "none" }} />
      <div className="lp-wrap" style={{ textAlign: "center", position: "relative" }}>
        <div className="hero-badge" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px 5px 10px", borderRadius: 100, border: "1px solid var(--ag)", background: "var(--as)", marginBottom: 28 }}>
          <div style={{ width: 20, height: 20, borderRadius: 6, background: "var(--as)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ac-text)", flexShrink: 0 }}><IC.Spark size={13} /></div>
          <span className="badge-text" style={{ fontSize: "clamp(10px,2vw,12px)", color: "var(--ac-text)", fontWeight: 500, whiteSpace: "nowrap" }}>Groq AI, Kanban, workload health, Autopilot</span>
        </div>
        <h1 className="hh" style={{ fontSize: "clamp(44px,7.5vw,86px)", fontWeight: 800, letterSpacing: "-0.048em", lineHeight: 1.04, color: "var(--tx)", marginBottom: 24 }}>
          Turn hours of task{" "}
          <span style={{ position: "relative", display: "inline-block" }}><Wavy /><span style={{ color: "var(--ac-text)", fontWeight: 800 }}>planning</span></span>
          <br />into <span style={{ color: "var(--ac-text)", fontWeight: 800 }}>a real task board</span>
        </h1>
        <p className="hero-sub" style={{ fontSize: 17, color: "var(--tx2)", maxWidth: 560, margin: "0 auto 40px", lineHeight: 1.7 }}>Paste Your Docs. Kanbi extracts tasks, sets priorities, and builds your Kanban board in seconds. Built for freelancers and solo operators.</p>
        <div className="cr" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={handleGetStarted} style={{ height: 48, padding: "0 26px", borderRadius: 10, background: "var(--ac-solid)", color: "#fff", fontSize: 14, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 9, boxShadow: "0 0 0 1px var(--ag),0 10px 38px var(--ag)", transition: "opacity .15s", border: "none" }} onMouseOver={e => (e.currentTarget.style.opacity = ".88")} onMouseOut={e => (e.currentTarget.style.opacity = "1")}>Start for Free <IC.Arrow size={15} /></button>
          <a href="#showcase" className="hero-cta-secondary" style={{ height: 48, padding: "0 22px", borderRadius: 10, fontSize: 14, color: "var(--tx)", display: "inline-flex", alignItems: "center", gap: 6, transition: "all .15s" }}>See product <IC.ChevD size={14} /></a>
        </div>
        <p style={{ marginTop: 14, fontSize: 12, color: "var(--tx3)" }}>Free plan, 10 AI requests per day, no card required</p>
        <div ref={ref} className="hero-mock-wrap" style={{ marginTop: 60, borderRadius: 24, border: "1px solid var(--br)", background: "linear-gradient(180deg,rgba(255,255,255,0.03),transparent 28%),var(--bg1)", overflow: "hidden", boxShadow: "0 0 0 1px rgba(255,255,255,0.03),0 42px 120px rgba(0,0,0,0.62)" }}>
          <div className="hero-mock-grid">
            <div className="msb" style={{ borderRight: "1px solid var(--br)", background: "linear-gradient(180deg,var(--bg),var(--bg1))", padding: "18px 14px", flexShrink: 0 }}>
              <div className="msb-brand" style={{ padding: "0 4px 14px", borderBottom: "1px solid var(--br)", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,var(--ac),var(--pu))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 0 18px var(--ag)" }}><IC.Zap size={13} /></div>
                    <div>
                      <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--tx)" }}>Kanbi</span>
                      <span style={{ fontSize: 9, color: "var(--tx3)" }}>Overview</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="msb-nav">
                {[
                  { label: "Overview", icon: ICONS.dashboard, active: true },
                  { label: "Board", icon: ICONS.board },
                  { label: "AI Chat", icon: ICONS.chat },
                  { label: "Autopilot", icon: ICONS.autopilot },
                  { label: "Saved", icon: FileDown },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="msb-nav-item" style={{ padding: "10px 10px", margin: "4px 0", borderRadius: 10, background: item.active ? "var(--as)" : "transparent", fontSize: 12, color: item.active ? "var(--ac-text)" : "var(--tx2)", fontWeight: item.active ? 600 : 500, border: "1px solid", borderColor: item.active ? "var(--ag)" : "transparent", display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 24, height: 24, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: item.active ? "rgba(94,111,232,0.18)" : "var(--bg2)", color: item.active ? "var(--ac-text)" : "var(--tx3)" }}><Icon size={13} /></span>
                      <span className="msb-nav-label">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ minWidth: 0, display: "flex", flexDirection: "column", background: "radial-gradient(circle at top right,rgba(167,139,250,0.08),transparent 34%),var(--bg1)" }}>
              <div className="hero-mock-head" style={{ borderBottom: "1px solid var(--br)", padding: "14px 18px", flexShrink: 0 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--tx)" }}>Client sprint</span>
                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, background: "var(--bg2)", color: "var(--tx3)" }}>6 tasks</span>
                  </div>
                  <p style={{ fontSize: 11, color: "var(--tx3)" }}>From Friday standup notes</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 999, background: "var(--as)", border: "1px solid var(--ag)" }}>
                    <div className="pulse" style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--ac-solid)" }} />
                    <span style={{ fontSize: 10, color: "var(--ac-text)", fontWeight: 600 }}>6 tasks added</span>
                  </div>
                </div>
              </div>
              <div style={{ padding: "12px 18px 0" }}>
                <HeroWorkloadBar active={v} score={82} />
              </div>
              <div className="hero-kanban" style={{ padding: 16, alignItems: "start" }}>
                {[
                  { col: "To Do", color: "var(--ac-text)", tasks: [{ t: "Send revised quote to Meridian", p: "high", tag: "Client" }, { t: "Update case study draft", p: "medium", tag: "Marketing" }] },
                  { col: "In Progress", color: "var(--am-text)", tasks: [{ t: "Stripe webhook fix", p: "high", prog: 55, tag: "Dev" }, { t: "Landing page copy pass", p: "medium", prog: 30, tag: "Design" }] },
                  { col: "Done", color: "var(--gr-text)", tasks: [{ t: "Deploy staging build", p: "high", tag: "Ops" }, { t: "Invoice for March retainer", p: "medium", tag: "Admin" }] },
                ].map(col => (
                  <div key={col.col} style={{ borderRadius: 16, border: "1px solid var(--br)", background: "linear-gradient(180deg,var(--bg2),var(--bg1))", padding: 12, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: col.color, boxShadow: `0 0 0 4px color-mix(in srgb, ${col.color} 12%, transparent)` }} />
                        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--tx3)" }}>{col.col}</span>
                      </div>
                      <span style={{ fontSize: 10, color: "var(--tx3)" }}>{col.tasks.length}</span>
                    </div>
                    {col.tasks.map((t, i) => (
                      <div key={i} style={{ borderRadius: 12, border: "1px solid var(--br)", background: "rgba(255,255,255,0.02)", padding: 10, marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: "prog" in t && t.prog !== undefined ? 8 : 4 }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 11.5, color: col.col === "Done" ? "var(--tx3)" : "var(--tx)", fontWeight: 600, lineHeight: 1.45, textDecoration: col.col === "Done" ? "line-through" : "none" }}>{t.t}</p>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 6, padding: "2px 7px", borderRadius: 999, background: "var(--bg2)", fontSize: 9, color: "var(--tx3)" }}>
                              <BadgeInfo size={10} />{t.tag}
                            </div>
                          </div>
                          <span style={{ fontSize: 9, fontWeight: 700, color: t.p === "high" ? "var(--rd-text)" : "var(--am-text)", flexShrink: 0, marginTop: 3, textTransform: "uppercase" }}>{t.p}</span>
                        </div>
                        {"prog" in t && t.prog !== undefined && (
                          <div style={{ height: 4, borderRadius: 999, background: "var(--bg2)", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: v ? `${t.prog}%` : "0%", transition: "width .8s ease .6s", borderRadius: 999, background: "linear-gradient(90deg,var(--ac),var(--pu))" }} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div style={{ padding: "0 16px 16px" }}>
                <div className="hero-charts">
                  <div style={{ borderRadius: 16, border: "1px solid var(--br)", background: "linear-gradient(180deg,rgba(94,111,232,0.1),rgba(94,111,232,0.03))", padding: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <ICONS.analytics size={16} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--tx)" }}>Completed this week</span>
                      </div>
                      <span style={{ fontSize: 10, color: "var(--tx3)" }}>Last 7 days</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6, alignItems: "end", height: 84 }}>
                      {[3, 5, 2, 6, 4, 7, 5].map((n, i) => (
                        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                          <div style={{ width: "100%", height: 84, display: "flex", alignItems: "end" }}>
                            <div style={{ width: "100%", height: v ? `${Math.min(n * 12, 84)}%` : "0%", borderRadius: "8px 8px 4px 4px", background: i === 6 ? "linear-gradient(180deg,var(--ac),var(--pu))" : "linear-gradient(180deg,var(--bg3),var(--brh))", transition: `height .8s ease ${0.15 + i * 0.08}s` }} />
                          </div>
                          <span style={{ fontSize: 8, color: "var(--tx3)" }}>{["M", "T", "W", "T", "F", "S", "S"][i]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ borderRadius: 16, border: "1px solid var(--br)", background: "linear-gradient(180deg,var(--bg2),var(--bg1))", padding: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <ICONS.flow size={16} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--tx)" }}>Today&apos;s mix</span>
                    </div>
                    {[
                      { l: "Client work", v: 45, c: "var(--ac)" },
                      { l: "Deep work", v: 35, c: "var(--pu)" },
                      { l: "Admin", v: 20, c: "var(--am)" },
                    ].map(item => (
                      <div key={item.l} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 10, color: "var(--tx3)" }}>{item.l}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: item.c }}>{item.v}%</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 999, background: "var(--bg2)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: v ? `${item.v}%` : "0%", borderRadius: 999, background: item.c, transition: "width .9s ease .6s" }} />
                        </div>
                      </div>
                    ))}
                    <div style={{ marginTop: 12, padding: 10, borderRadius: 12, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.18)", display: "flex", alignItems: "center", gap: 7 }}>
                      <BadgeCheck size={14} style={{ color: "var(--gr-text)" }} />
                      <span style={{ fontSize: 10.5, color: "var(--gr-text)", fontWeight: 600 }}>Workload within your daily capacity.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}



// ── PRODUCT SHOWCASE (new section with 4 tabs) ──────────────────────────
const TABS = [
  { key: "overview", label: "Dashboard", desc: "See workload health, usage limits, and recent activity in one place. Know when you're overloaded before the week runs away.", features: ["Health score from your active tasks", "Weekly completion chart", "Usage counters for AI and boards", "Quick jump to any workspace"] },
  { key: "board", label: "Kanban Board", desc: "Drag tasks across To Do, In Progress, and Done. Each card shows priority, label, and progress where it matters.", features: ["Three-column Kanban layout", "Priority tags on every card", "Progress bars on active work", "Save and export when you're ready"] },
  { key: "chat", label: "AI Chat", desc: "Ask what to tackle first, add tasks in plain English, or reprioritize without leaving the board. The assistant reads your current tasks.", features: ["Board-aware answers", "Create tasks from chat", "Suggest next actions", "Stays in sync with your board"] },
  { key: "autopilot", label: "Autopilot", desc: "Get a morning briefing and a time-blocked plan based on what's on your board. Adjust, then push blocks back as tasks.", features: ["Daily briefing summary", "Suggested time blocks", "Capacity-aware scheduling", "Add plan to your board"] },
];

function MockPreview({ tab }: { tab: typeof TABS[0] }) {
  const cols: Record<string, string> = { overview: "var(--ac)", board: "var(--am)", chat: "var(--pu)", autopilot: "var(--gr)" };
  const col = cols[tab.key];
  return (
    <div className="showcase-mock" style={{ borderRadius: 20, border: "1px solid var(--br)", background: "linear-gradient(180deg,rgba(255,255,255,0.03),transparent 28%),var(--bg1)", overflow: "hidden", height: 440, display: "flex", flexDirection: "column", boxShadow: "0 18px 60px rgba(0,0,0,0.18)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 16px", borderBottom: "1px solid var(--br)", background: "var(--bg)" }}>
        {["#ff5f57", "#febc2e", "#28c840"].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
        <span style={{ fontSize: 11, color: "var(--tx3)", marginLeft: 6 }}>app.kanbi / {tab.key}</span>
        <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--tx3)" }}>Sample data</span>
      </div>
      <div style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 12, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: col, boxShadow: `0 0 0 5px color-mix(in srgb, ${col} 14%, transparent)` }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--tx)" }}>{tab.label}</span>
          <div className="pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gr)", marginLeft: "auto" }} />
        </div>
        {tab.key === "overview" && (<>
          {(() => {
            const overviewCards: Array<{ v: string; l: string; I: ComponentType<{ size?: number }> }> = [
              { v: "3/10", l: "Boards today", I: ICONS.dashboard },
              { v: "7/10", l: "AI uses today", I: ICONS.speed },
              { v: "18", l: "Open tasks", I: ICONS.focus },
            ];
            return (
              <div className="mock-overview-stats" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                {overviewCards.map(({ v, l, I }) => {
                  const Icon = I;
                  return (
                    <div key={l as string} style={{ borderRadius: 14, border: "1px solid var(--br)", background: "linear-gradient(180deg,var(--bg2),var(--bg1))", padding: "12px 12px 11px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 9, background: "var(--as)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ac-text)" }}><Icon size={14} /></div>
                        <span style={{ fontSize: 9, color: "var(--tx3)" }}>{l}</span>
                      </div>
                      <p style={{ fontSize: 17, fontWeight: 800, color: "var(--tx)", letterSpacing: "-0.04em" }}>{v}</p>
                      <p style={{ fontSize: 9.5, color: "var(--tx3)", marginTop: 2 }}>Free plan</p>
                    </div>
                  );
                })}
              </div>
            );
          })()}
          <div className="mock-overview-charts" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, flex: 1 }}>
            <div style={{ borderRadius: 16, border: "1px solid var(--br)", background: "linear-gradient(180deg,var(--bg2),var(--bg1))", padding: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <ICONS.health size={15} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--tx)" }}>Health</span>
              </div>
              <svg width="62" height="62" viewBox="0 0 62 62" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="31" cy="31" r="23" fill="none" stroke="var(--br)" strokeWidth="7" />
                <circle cx="31" cy="31" r="23" fill="none" stroke="var(--gr)" strokeWidth="7" strokeLinecap="round" strokeDasharray={2 * Math.PI * 23} strokeDashoffset={2 * Math.PI * 23 * 0.22} />
              </svg>
              <p style={{ fontSize: 10, color: "var(--tx3)", marginTop: 8 }}>Score 82, balanced</p>
            </div>
            <div style={{ borderRadius: 16, border: "1px solid var(--br)", background: "linear-gradient(180deg,var(--bg2),var(--bg1))", padding: 12 }}>
              {[["AI today", "7/10", "var(--ac-text)", "70%"], ["Boards", "3/10", "var(--pu-text)", "30%"], ["Done rate", "68%", "var(--gr-text)", "68%"]].map(([l, v, c, w]) => (
                <div key={l} style={{ marginBottom: 7 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 9, color: "var(--tx3)" }}>{l}</span>
                    <span style={{ fontSize: 9, fontWeight: 600, color: c }}>{v}</span>
                  </div>
                  <div style={{ height: 3, borderRadius: 2, background: "var(--br)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: w, background: c, borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>)}
        {tab.key === "board" && (<>
          <div className="mock-board-cols" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, flex: 1 }}>
            {[{ c: "To Do", ts: [["Send quote to Meridian", "Client", "var(--ac)"], ["Refresh portfolio page", "Marketing", "var(--pu)"]] }, { c: "In Progress", ts: [["Webhook retry logic", "Dev", "var(--am)"], ["Blog outline", "Content", "var(--pu)"]] }, { c: "Done", ts: [["Ship v1.2 patch", "Ops", "var(--gr)"]] }].map(col => (
              <div key={col.c} style={{ borderRadius: 14, border: "1px solid var(--br)", background: "linear-gradient(180deg,var(--bg2),var(--bg1))", padding: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 8.5, fontWeight: 800, color: "var(--tx3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{col.c}</span>
                  <span style={{ fontSize: 9, color: "var(--tx3)" }}>{col.ts.length}</span>
                </div>
                {col.ts.map(([t, tag, c]) => (
                  <div key={t} style={{ borderRadius: 10, border: "1px solid var(--br)", background: "rgba(255,255,255,0.02)", padding: "8px 9px", marginBottom: 7 }}>
                    <p style={{ fontSize: 9.5, color: "var(--tx)", lineHeight: 1.4, fontWeight: 600 }}>{t}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 8.5, color: "var(--tx3)", display: "inline-flex", alignItems: "center", gap: 4 }}><BadgeInfo size={10} />{tag}</span>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c as string }} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="mock-footer-actions" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ padding: "9px 10px", borderRadius: 12, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", gap: 6 }}>
              <CheckCircle2 size={14} style={{ color: "var(--gr-text)" }} />
              <span style={{ fontSize: 9.5, color: "var(--gr-text)", fontWeight: 600 }}>Board saved</span>
            </div>
            <div style={{ padding: "9px 10px", borderRadius: 12, background: "var(--bg2)", border: "1px solid var(--br)", display: "flex", alignItems: "center", gap: 6 }}>
              <FileDown size={14} style={{ color: "var(--tx3)" }} />
              <span style={{ fontSize: 9.5, color: "var(--tx2)", fontWeight: 600 }}>Export PDF or DOCX</span>
            </div>
          </div>
        </>)}
        {tab.key === "chat" && (
          <div className="mock-chat-layout" style={{ flex: 1, display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[{ r: "ai", m: "You have 4 open tasks. Meridian quote is highest priority. Want me to block 45 minutes this morning?" }, { r: "user", m: "Yes, and add: follow up on invoice" }, { r: "ai", m: "Added \"Follow up on invoice\" to To Do (medium). Scheduled quote review for 9:00 AM." }].map((msg, i) => (
                <div key={i} style={{ display: "flex", justifyContent: msg.r === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{ maxWidth: "82%", padding: "7px 10px", borderRadius: msg.r === "user" ? "9px 2px 9px 9px" : "2px 9px 9px 9px", background: msg.r === "user" ? "var(--ac)" : "var(--bg2)", border: `1px solid ${msg.r === "user" ? "var(--ac)" : "var(--br)"}` }}>
                    <p style={{ fontSize: 9.5, color: msg.r === "user" ? "#fff" : "var(--tx)", lineHeight: 1.4 }}>{msg.m}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ borderRadius: 14, border: "1px solid var(--br)", background: "linear-gradient(180deg,var(--bg2),var(--bg1))", padding: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                <BrainCircuit size={15} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--tx)" }}>Board context</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {[["Pending", "4 tasks"], ["Due soon", "1 task"], ["Focus", "Meridian quote"]].map(([a, b]) => (
                  <div key={a} style={{ display: "flex", justifyContent: "space-between", padding: "7px 8px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid var(--br)" }}>
                    <span style={{ fontSize: 9.5, color: "var(--tx2)" }}>{a}</span>
                    <span style={{ fontSize: 9.5, fontWeight: 600, color: "var(--tx)" }}>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {tab.key === "autopilot" && (<>
          <div style={{ padding: "10px 12px", borderRadius: 14, background: "var(--as)", border: "1px solid var(--ag)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <p style={{ fontSize: 9, color: "var(--ac-text)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>Morning briefing</p>
              <span style={{ fontSize: 9, color: "var(--ac-text)", display: "inline-flex", alignItems: "center", gap: 4 }}><Clock3 size={11} />Today</span>
            </div>
            <p style={{ fontSize: 10, color: "var(--tx2)", lineHeight: 1.5 }}>4 tasks open, 1 urgent. Start with the Meridian quote, then the webhook fix. About 5 hours of focused work.</p>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            {[["9:00 AM", "Meridian quote review", "45m"], ["10:00 AM", "Webhook retry logic", "2h"], ["1:30 PM", "Portfolio copy edits", "1h"]].map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 8, padding: "8px 10px", borderRadius: 12, background: "linear-gradient(180deg,var(--bg2),var(--bg1))", border: "1px solid var(--br)", alignItems: "center" }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: "var(--ac-text)", fontFamily: "var(--font-geist-mono)", flexShrink: 0 }}>{s[0]}</span>
                <span style={{ fontSize: 9.5, color: "var(--tx)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s[1]}</span>
                <span style={{ fontSize: 9, color: "var(--tx3)", flexShrink: 0 }}>{s[2]}</span>
              </div>
            ))}
            <button style={{ marginTop: 2, padding: "8px", borderRadius: 12, border: "1px solid var(--ac)", background: "var(--as)", color: "var(--ac-text)", fontSize: 9.5, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              Add to board <ArrowUpRight size={12} />
            </button>
          </div>
        </>)}
      </div>
    </div>
  );
}

function Showcase() {
  const [active, setActive] = useState(0); const tab = TABS[active]!;
  const handleTabClick = (i: number, key: string) => { setActive(i); };
  return (
    <section id="showcase" className="lp-section" style={{ borderTop: "1px solid var(--br)" }}>
      <div className="lp-wrap">
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ac-text)", marginBottom: 14 }}>Product</p>
          <h2 style={{ fontSize: "clamp(26px,4vw,44px)", fontWeight: 700, letterSpacing: "-0.035em", color: "var(--tx)", marginBottom: 14 }}>Four views, one workflow</h2>
          <p style={{ fontSize: 15, color: "var(--tx2)", maxWidth: 480, margin: "0 auto" }}>From raw notes to a planned day, without switching tools.</p>
        </div>
        <div className="tsc" style={{ display: "flex", gap: 4, marginBottom: 28, background: "var(--bg1)", border: "1px solid var(--br)", borderRadius: 12, padding: 4 }}>
          {TABS.map((t, i) => (
            <button key={t.key} onClick={() => handleTabClick(i, t.key)} className="tb" style={{ flex: 1, padding: "9px 12px", borderRadius: 9, border: "none", background: active === i ? "var(--bg2)" : "transparent", color: active === i ? "var(--tx)" : "var(--tx2)", fontSize: 13, fontWeight: active === i ? 600 : 400, cursor: "pointer", boxShadow: active === i ? "0 1px 4px rgba(0,0,0,.2)" : "none", whiteSpace: "nowrap" }}>{t.label}</button>
          ))}
        </div>
        <div className="g2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "center" }}>
          <div>
            <h3 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--tx)", marginBottom: 12 }}>{tab.label}</h3>
            <p style={{ fontSize: 14.5, color: "var(--tx2)", lineHeight: 1.7, marginBottom: 20 }}>{tab.desc}</p>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
              {tab.features.map(f => (
                <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13.5, color: "var(--tx2)" }}>
                  <span style={{ color: "var(--ac-text)", marginTop: 1, flexShrink: 0 }}><IC.Check size={14} /></span>{f}
                </li>
              ))}
            </ul>
            <a href="/sign-up" style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 22, height: 40, padding: "0 18px", borderRadius: 9, background: "var(--ac-solid)", color: "#fff", fontSize: 13, fontWeight: 600, transition: "background .15s" }} onMouseOver={e => (e.currentTarget.style.background = "var(--ach)")} onMouseOut={e => (e.currentTarget.style.background = "var(--ac)")}>
              Try it free <IC.Arrow size={13} />
            </a>
          </div>
          <MockPreview tab={tab!} />
        </div>
      </div>
    </section>
  );
}

// ── FEATURES ────
const FEATS = [
  { I: IC.Spark, t: "AI task extraction", d: "Paste notes, emails, or PDF text. Groq reads the content and returns actionable tasks with priorities in seconds." },
  { I: IC.Shield, t: "Workload health score", d: "Kanbi flags overload before you commit to too much. See a simple score based on what's already on your board." },
  { I: IC.Brain, t: "Board-aware AI chat", d: "Ask what to do next, add tasks in plain language, or reprioritize. The assistant sees your current board." },
  { I: IC.Chart, t: "Completion tracking", d: "Track what you finish over time. Spot which priorities pile up and where your week actually goes." },
  { I: IC.Export, t: "DOCX and PDF export", d: "Hand off a board to a client as a formatted Word doc or PDF. No copy paste reformatting." },
  { I: IC.Board, t: "Text, PDF, and URL input", d: "Paste text, upload a PDF, or drop a URL. One extraction flow for the inputs you already have." },
  { I: IC.Cal, t: "Autopilot scheduling", d: "Get a morning briefing and suggested time blocks from your tasks. Push the plan onto your board when it looks right." },
  { I: IC.Zap, t: "Board templates", d: "Start from Daily, Sprint, Meeting, or Project templates instead of an empty board." },
  { I: IC.Chart, t: "Saved boards library", d: "Save boards, search by title, and reload past work without rebuilding from scratch." },
];

function Features() {
  return (
    <section id="features" className="lp-section" style={{ borderTop: "1px solid var(--br)" }}>
      <div className="lp-wrap">
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ac-text)", marginBottom: 14 }}>Features</p>
          <h2 style={{ fontSize: "clamp(26px,4vw,44px)", fontWeight: 700, letterSpacing: "-0.035em", color: "var(--tx)", marginBottom: 14 }}>Built for solo operators</h2>
          <p style={{ fontSize: 15, color: "var(--tx2)", maxWidth: 440, margin: "0 auto" }}>Everything you need to plan a week, nothing you do not need.</p>
        </div>
        <div className="g3" style={{ border: "1px solid var(--br)", borderRadius: 16, overflow: "hidden" }}>
          {FEATS.map((f) => (
            <div key={f.t} className="fc fc-item" style={{ padding: "24px 22px", background: "var(--bg)", cursor: "default" }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--as)", border: "1px solid var(--ag)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ac-text)", marginBottom: 14 }}><f.I size={15} /></div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--tx)", marginBottom: 7 }}>{f.t}</div>
              <div style={{ fontSize: 12.5, color: "var(--tx2)", lineHeight: 1.65 }}>{f.d}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", t: "Paste raw input", d: "Meeting notes, email threads, or PDF exports. No templates or cleanup required.", tag: "Text, PDF, URL", I: IC.Export },
    { n: "02", t: "AI reads and extracts", d: "Groq pulls out action items, assigns priority, and estimates time where it can.", tag: "Powered by Groq", I: IC.Spark },
    { n: "03", t: "Plan and ship", d: "Tasks land on your board. Autopilot suggests a day. Export when a client needs a doc.", tag: "Board, Autopilot, Export", I: IC.Zap },
  ];
  return (
    <section id="how-it-works" className="lp-section" style={{ borderTop: "1px solid var(--br)" }}>
      <div className="lp-wrap">
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ac-text)", marginBottom: 14 }}>How It Works</p>
          <h2 style={{ fontSize: "clamp(26px,4vw,44px)", fontWeight: 700, letterSpacing: "-0.035em", color: "var(--tx)" }}>From chaos to clarity in 3 steps</h2>
        </div>
        <div className="g3 sg" style={{ gap: 16 }}>
          {steps.map(s => (
            <div key={s.n} className="sh" style={{ borderRadius: 12, border: "1px solid var(--br)", background: "var(--bg1)", padding: 24, transition: "border-color .18s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--as)", border: "1px solid var(--ag)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ac-text)" }}><s.I size={17} /></div>
                <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, fontWeight: 700, color: "var(--tx3)" }}>{s.n}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--tx)", marginBottom: 8 }}>{s.t}</div>
              <div style={{ fontSize: 12.5, color: "var(--tx2)", lineHeight: 1.65, marginBottom: 16 }}>{s.d}</div>
              <div style={{ display: "inline-flex", padding: "4px 10px", borderRadius: 6, background: "var(--bg2)", border: "1px solid var(--br)", fontSize: 11, color: "var(--tx3)" }}>{s.tag}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


function Pricing() {
  const handleProClick = async () => {
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else window.location.href = '/sign-up';
    } catch { window.location.href = '/sign-up'; }
  };
  const freeF = [{ t: "10 AI requests per day", ok: true }, { t: "300 board saves per month", ok: true }, { t: "Full Kanban board", ok: true }, { t: "Priority levels & due dates", ok: true }, { t: "Text, PDF & URL import", ok: false }, { t: "AI Chat Coach", ok: false }, { t: "Burnout alerts", ok: false }];
  const proF = ["100 AI requests per day", "1,500 board saves per month", "Text, PDF & URL import", "AI Chat Coach (board-aware)", "Burnout prevention & health scoring", "DOCX & PDF export", "Autopilot scheduling & briefings", "Priority email support (24h)"];
  return (
    <section id="pricing" className="lp-section" style={{ borderTop: "1px solid var(--br)" }}>
      <div className="lp-wrap">
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ac-text)", marginBottom: 14 }}>Pricing</p>
          <h2 style={{ fontSize: "clamp(26px,4vw,44px)", fontWeight: 700, letterSpacing: "-0.035em", color: "var(--tx)", marginBottom: 14 }}>Simple, honest pricing</h2>
          <p style={{ fontSize: 15, color: "var(--tx2)" }}>Start free. Upgrade when you&rsquo;re ready.</p>
        </div>
        <div className="g2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, maxWidth: 860, margin: "0 auto" }}>
          <div style={{ borderRadius: 14, border: "1px solid var(--br)", background: "var(--bg1)", padding: 28 }}>
            <p style={{ fontSize: 13, color: "var(--tx2)", fontWeight: 500, marginBottom: 6 }}>Free</p>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 6 }}>
              <span style={{ fontSize: 46, fontWeight: 700, letterSpacing: "-0.04em", color: "var(--tx)", lineHeight: 1 }}>$0</span>
              <span style={{ fontSize: 13, color: "var(--tx3)", marginBottom: 7 }}>/month</span>
            </div>
            <p style={{ fontSize: 12.5, color: "var(--tx3)", marginBottom: 24 }}>Perfect for getting started.</p>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 11, marginBottom: 26 }}>
              {freeF.map(f => <li key={f.t} style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 13, color: f.ok ? "var(--tx2)" : "var(--tx3)" }}><span style={{ color: f.ok ? "var(--ac)" : "var(--tx3)", flexShrink: 0, marginTop: 1 }}><IC.Check size={14} /></span>{f.t}</li>)}
            </ul>
            <a href="/sign-up" style={{ display: "block", height: 38, borderRadius: 8, border: "1px solid var(--br)", fontSize: 13, fontWeight: 500, color: "var(--tx)", textAlign: "center", lineHeight: "38px", transition: "background .15s" }} onMouseOver={e => (e.currentTarget.style.background = "var(--bg2)")} onMouseOut={e => (e.currentTarget.style.background = "transparent")}>Get Started Free</a>
          </div>
          <div style={{ borderRadius: 14, border: "1px solid var(--ag)", background: "var(--bg1)", padding: 28, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 340, height: 130, background: "radial-gradient(ellipse at top,var(--ag) 0%,transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <p style={{ fontSize: 13, color: "var(--tx2)", fontWeight: 500 }}>Pro</p>
                <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 100, background: "var(--as)", border: "1px solid var(--ag)", color: "var(--ac-text)", fontWeight: 600 }}>Most Popular</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 6 }}>
                <span style={{ fontSize: 46, fontWeight: 700, letterSpacing: "-0.04em", color: "var(--tx)", lineHeight: 1 }}>$9</span>
                <span style={{ fontSize: 13, color: "var(--tx3)", marginBottom: 7 }}>/month</span>
              </div>
              <p style={{ fontSize: 12.5, color: "var(--tx3)", marginBottom: 24 }}>For serious freelancers.</p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 11, marginBottom: 26 }}>
                {proF.map(f => <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 13, color: "var(--tx2)" }}><span style={{ color: "var(--ac-text)", flexShrink: 0, marginTop: 1 }}><IC.Check size={14} /></span>{f}</li>)}
              </ul>
              <button onClick={handleProClick} style={{ display: "block", width: "100%", height: 38, borderRadius: 8, background: "var(--ac-solid)", fontSize: 13, fontWeight: 600, color: "#fff", textAlign: "center", lineHeight: "38px", boxShadow: "0 4px 20px var(--ag)", transition: "background .15s", border: "none" }} onMouseOver={e => (e.currentTarget.style.background = "var(--ach)")} onMouseOut={e => (e.currentTarget.style.background = "var(--ac)")}>Start Pro   $9/mo</button>
              <p style={{ textAlign: "center", fontSize: 11, color: "var(--tx3)", marginTop: 10 }}>Stripe billing. Cancel anytime.</p>
            </div>
          </div>
        </div>
        <p style={{ textAlign: "center", fontSize: 12, color: "var(--tx3)", marginTop: 18 }}>No contracts. Questions? <a href="mailto:themvpguy.contact@gmail.com" style={{ color: "var(--ac-text)" }}>themvpguy.contact@gmail.com</a></p>
      </div>
    </section>
  );
}

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const faqs = [
    { q: "How accurate is the AI task extraction?", a: "Kanbi uses Groq's llama-3.3-70b model. It works best on structured notes and emails with clear action items. You can edit any task before saving. Nothing is locked in automatically." },
    { q: "Is my data private and secure?", a: "Boards and tasks are stored in Supabase with row-level security, so only your account can read them. We don't sell your data. You can delete your account and data from Settings." },
    { q: "How does task parsing work?", a: "Paste text or upload a PDF. The model reads the content, extracts action items, assigns a priority, and optionally estimates time. It handles casual phrasing like follow up on or due Friday without templates." },
    { q: "Does Kanbi integrate with other tools?", a: "You can export boards as DOCX or PDF for client handoffs and import tasks from URLs. More integrations are on the roadmap." },
    { q: "Is there a free plan?", a: "Yes. Free includes 10 AI requests per day and 300 board saves per month, no credit card. Pro ($9/month) raises those limits to 100 a day and 1,500 a month. Every feature is available on both plans today; the paid plan raises limits rather than unlocking features." },
    { q: "How is Kanbi different from Asana or Notion?", a: "Team tools assume you will create every task by hand. Kanbi starts from messy input like notes, emails, and PDFs, and builds the board for you. Health scoring and autopilot are built in for solo planning." },
  ];
  return (
    <section id="faq" className="lp-section" style={{ borderTop: "1px solid var(--br)" }}>
      <div className="lp-wrap" style={{ maxWidth: 720 }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ac-text)", marginBottom: 14 }}>FAQ</p>
          <h2 style={{ fontSize: "clamp(26px,4vw,44px)", fontWeight: 700, letterSpacing: "-0.035em", color: "var(--tx)" }}>Common questions</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {faqs.map((f, i) => (
            <div key={f.q} className="fi" style={{ border: `1px solid ${open === i ? "var(--ag)" : "var(--br)"}`, borderRadius: 10, overflow: "hidden" }}>
              <button className="faq-btn" onClick={() => setOpen(open === i ? null : i)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 17px", background: "transparent", border: "none", color: "var(--tx)", fontSize: 13.5, fontWeight: 500, textAlign: "left", gap: 12, cursor: "pointer" }}>
                <span>{f.q}</span>
                <span style={{ color: "var(--tx3)", flexShrink: 0, transform: open === i ? "rotate(180deg)" : "none", transition: "transform .2s" }}><IC.ChevD size={14} /></span>
              </button>
              {open === i && <div style={{ padding: "0 17px 15px", fontSize: 13, color: "var(--tx2)", lineHeight: 1.7 }}>{f.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--br)", padding: "48px 0 32px" }}>
      <div className="lp-wrap">
        <div className="fg" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 44, marginBottom: 40 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,var(--ac),var(--pu))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 0 16px var(--ag)" }}><IC.Zap size={13} /></div>
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--tx)", letterSpacing: "-0.025em" }}>Kanbi</span>
            </div>
            <p style={{ fontSize: 13, color: "var(--tx2)", lineHeight: 1.7, maxWidth: 280, marginBottom: 20 }}>AI task management for freelancers. Paste notes, get a board, plan your day.</p>
            <a href="/sign-up" style={{ height: 40, padding: "0 16px", borderRadius: 10, background: "var(--ac-solid)", color: "#fff", fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 8px 24px var(--ag)" }}>Start free <IC.Arrow size={14} /></a>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 16 }}>
              {SOCIAL_LINKS.map(({ name, href, Icon }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={name}
                  title={name}
                  style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid var(--br)", background: "var(--bg1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--tx2)", transition: "all .15s" }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = "var(--brh)"; e.currentTarget.style.color = "var(--tx)" }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = "var(--br)"; e.currentTarget.style.color = "var(--tx2)" }}
                >
                  <Icon size={15}/>
                </a>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 34, paddingTop: 24, borderTop: "1px solid var(--br)" }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--tx3)", marginBottom: 14 }}>
              Built with
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {TECH_STACK.map(({ name, Icon }) => (
                <span
                  key={name}
                  title={name}
                  style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 11px", borderRadius: 9, border: "1px solid var(--br)", background: "var(--bg1)", color: "var(--tx3)", fontSize: 11.5, fontWeight: 600, cursor: "default", transition: "all .15s" }}
                  onMouseOver={e => { e.currentTarget.style.color = "var(--tx2)"; e.currentTarget.style.borderColor = "var(--brh)"; }}
                  onMouseOut={e => { e.currentTarget.style.color = "var(--tx3)"; e.currentTarget.style.borderColor = "var(--br)"; }}
                >
                  <Icon size={14}/>
                  {name}
                </span>
              ))}
            </div>
          </div>
          {[
            { h: "Product", links: [["Features", "#features"], ["How It Works", "#how-it-works"], ["Pricing", "#pricing"], ["Sign Up", "/sign-up"]] },
            { h: "Resources", links: [["Changelog", "/changelog"], ["Privacy", "/privacy"], ["Terms", "/terms"], ["Sign In", "/sign-in"], ["Support", "mailto:themvpguy.contact@gmail.com"]] },
            { h: "Connect", links: [["Email", "mailto:themvpguy.contact@gmail.com"], ["GitHub", "https://github.com/MuhammadTanveerAbbas"], ["LinkedIn", "https://linkedin.com/in/MuhammadTanveerAbbas"], ["Twitter", "https://twitter.com/m_tanveerabbas"]] },
          ].map(col => (
            <div key={col.h}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--tx3)", marginBottom: 14 }}>{col.h}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {col.links.map(([l, h]) => <a key={l} href={h} className="na" style={{ fontSize: 13, color: "var(--tx2)", transition: "color .15s" }}>{l}</a>)}
              </div>
            </div>
          ))}
        </div>
        <div className="footer-bottom" style={{ borderTop: "1px solid var(--br)", paddingTop: 20, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <span style={{ fontSize: 12, color: "var(--tx3)" }}>© 2026 Kanbi. All rights reserved.</span>
          <a href="https://themvpguy.vercel.app" target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "var(--tx3)", transition: "color .15s" }} onMouseOver={e => (e.currentTarget.style.color = "var(--ac)")} onMouseOut={e => (e.currentTarget.style.color = "var(--tx3)")}>Made by The MVP Guy</a>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  // Read the persisted/system theme on first client render so there is no flash
  // of the wrong theme and no cascading setState inside an effect.
  const { theme, toggle } = useSiteTheme();
  // One listener, owned by the shared store, covers the system preference and
  // other open tabs. This page used to carry its own copy of that logic.
  useEffect(() => startThemeWatch(), []);
  return (
    <ThemeCtx.Provider value={{ theme, toggle }}>
      <Styles theme={theme} />
      <div className="lp" style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--tx)" }}>
        <Navbar />
        <main><Hero /><Showcase /><Features /><HowItWorks /><Pricing /><FAQ /></main>
        <Footer />
      </div>
    </ThemeCtx.Provider>
  );
}
