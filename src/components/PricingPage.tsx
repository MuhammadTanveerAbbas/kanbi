"use client";
import { useTheme as useSiteTheme } from '@/lib/theme';
import { useState, useEffect, useRef, createContext, useContext } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { TECH_STACK } from "./brand-icons";

type Theme = "dark" | "light";
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({ theme: "light", toggle: () => {} });
const useTheme = () => useContext(ThemeCtx);

/**
 * Page level styles only. The palette comes from the document head, so this
 * element no longer carries a copy of it. Before this, the server emitted the
 * light palette here and the client corrected it after hydration.
 */
function Styles() {
  return <style>{`
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

    /* ── The plan comparison table ──
       It used to be a three column CSS grid with a fixed 2fr/1fr/1fr split and
       a wrapping feature label. At 375px the label column collapsed to about
       100px, so every feature name broke across four or five lines while the
       two "Yes" cells sat next to it, and the table ended up taller than the
       rest of the page combined.

       A real <table> with a scrollable wrapper is the right structure here: the
       browser already knows how to align a row of cells, and the wrapper keeps
       the horizontal overflow inside the table instead of letting it push the
       page sideways. The min-width is what stops the columns crushing; below
       560px the table scrolls within its own card. */
    .cmp-scroll{
      overflow-x:auto;
      -webkit-overflow-scrolling:touch;
      /* A visible edge when there is more to see, so the scroll is discoverable
         rather than looking like a clipped layout. */
      background:
        linear-gradient(to right, var(--bg1) 30%, transparent),
        linear-gradient(to left, var(--bg1) 30%, transparent) 100% 0,
        radial-gradient(farthest-side at 0 50%, var(--brh), transparent),
        radial-gradient(farthest-side at 100% 50%, var(--brh), transparent) 100% 0;
      background-repeat:no-repeat;
      background-size:40px 100%,40px 100%,14px 100%,14px 100%;
      background-attachment:local,local,scroll,scroll;
    }
    .cmp-table{
      width:100%;
      min-width:520px;
      border-collapse:collapse;
      font-size:13px;
    }
    .cmp-table th,.cmp-table td{
      padding:14px 20px;
      text-align:center;
      border-bottom:1px solid var(--br);
    }
    .cmp-table thead th{
      background:var(--bg2);
      font-size:12px;
      font-weight:700;
      color:var(--tx3);
      text-transform:uppercase;
      letter-spacing:0.06em;
      white-space:nowrap;
    }
    .cmp-table thead th:first-child,
    .cmp-table tbody th{
      text-align:left;
      /* The left cell is the only one that wraps. Aligning the other two to the
         top rather than the middle keeps a short "Yes" next to the first line
         of its feature name instead of floating in the vertical centre. */
      vertical-align:top;
    }
    .cmp-table tbody th{
      font-weight:500;
      color:var(--tx);
    }
    .cmp-table td{
      color:var(--tx2);
      border-left:1px solid var(--br);
    }
    .cmp-table thead th + th,
    .cmp-table th + td,
    .cmp-table td + td{ border-left:1px solid var(--br) }
    .cmp-table .is-pro{ background:var(--as); color:var(--tx); font-weight:500 }
    .cmp-table thead .is-pro{ color:var(--ac) }
    .cmp-table tbody tr:last-child th,
    .cmp-table tbody tr:last-child td{ border-bottom:none }
  `}</style>;
}

function useScrollP() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const fn = () => { const d = document.documentElement; setP(d.scrollTop / (d.scrollHeight - d.clientHeight) || 0); };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return p;
}

function useInView(ref: React.RefObject<HTMLElement | null>, thr = 0.1) {
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

/** Builds a named icon component so React can identify it in DevTools. */
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
  Check: S('Check', "M20 6L9 17l-5-5", "2.5"),
  X: S('X', "M18 6L6 18M6 6l12 12", "2"),
  Arrow: S('Arrow', "M5 12h14M12 5l7 7-7 7", "2.2"),
  ChevD: S('ChevD', "M6 9l6 6 6-6", "2"),
  Sun: S('Sun', "M12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7zm0-4v2M12 19v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"),
  Moon: S('Moon', "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"),
  Menu: S('Menu', "M4 6h16M4 12h16M4 18h16", "2"),
  Shield: S('Shield', "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"),
  Brain: S('Brain', "M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"),
  Cal: S('Cal', ["M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z", "M16 2v4M8 2v4M3 10h18"]),
  Export: S('Export', ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M17 8l-5-5-5 5", "M12 3v12"]),
  Board: S('Board', ["M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"]),
  Chart: S('Chart', "M18 20V10M12 20V4M6 20v-6"),
};

function Navbar() {
  const { theme, toggle } = useTheme();
  const [mob, setMob] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const prog = useScrollP();
  useEffect(() => { const fn = () => setScrolled(window.scrollY > 24); window.addEventListener("scroll", fn, { passive: true }); return () => window.removeEventListener("scroll", fn); }, []);
  useEffect(() => { const sb = createClient(); sb.auth.getUser().then(({ data }) => setUser(data.user)); }, []);
  const links: [string, string][] = [["Features", "/#features"], ["How It Works", "/#how-it-works"], ["Product", "/#showcase"], ["Pricing", "/pricing"]];
  return (<>
    <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 200, height: 56, display: "flex", alignItems: "center", borderBottom: `1px solid ${scrolled ? "var(--br)" : "transparent"}`, background: scrolled ? "var(--nb)" : "transparent", backdropFilter: scrolled ? "blur(24px)" : "none", WebkitBackdropFilter: scrolled ? "blur(24px)" : "none", transition: "background .3s,border-color .3s" }}>
      <div style={{ position: "absolute", bottom: -1, left: 0, height: 1, background: "linear-gradient(90deg,var(--ac),var(--pu))", width: `${prog * 100}%`, transition: "width .1s linear" }} />
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 24px", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--ac)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 0 18px var(--ag)" }}><IC.Zap size={13} /></div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--tx)", letterSpacing: "-0.025em" }}>Kanbi</span>
        </Link>
        <div className="nl" style={{ display: "flex", gap: 26, alignItems: "center" }}>
          {links.map(([l, h]) => <a key={l} href={h} className="na" style={{ fontSize: 13, color: l === "Pricing" ? "var(--ac)" : "var(--tx2)", fontWeight: l === "Pricing" ? 600 : 400, transition: "color .15s" }}>{l}</a>)}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={toggle} style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid var(--br)", background: "var(--bg1)", color: "var(--tx2)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }} onMouseOver={e => { e.currentTarget.style.borderColor = "var(--brh)"; e.currentTarget.style.color = "var(--tx)"; }} onMouseOut={e => { e.currentTarget.style.borderColor = "var(--br)"; e.currentTarget.style.color = "var(--tx2)"; }}>
            {theme === "dark" ? <IC.Sun size={14} /> : <IC.Moon size={14} />}
          </button>
          {user
            ? <a href="/dashboard" style={{ height: 34, padding: "0 15px", borderRadius: 8, background: "var(--inv)", color: "var(--inv2)", fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", transition: "opacity .15s" }} onMouseOver={e => (e.currentTarget.style.opacity = ".88")} onMouseOut={e => (e.currentTarget.style.opacity = "1")}>Dashboard</a>
            : <a href="/sign-up" style={{ height: 34, padding: "0 15px", borderRadius: 8, background: "var(--inv)", color: "var(--inv2)", fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", transition: "opacity .15s" }} onMouseOver={e => (e.currentTarget.style.opacity = ".88")} onMouseOut={e => (e.currentTarget.style.opacity = "1")}>Get Started Free</a>
          }
          <button className="ms" onClick={() => setMob(!mob)} style={{ display: "none", background: "none", border: "none", color: "var(--tx2)", padding: 4 }}>{mob ? <IC.X /> : <IC.Menu />}</button>
        </div>
      </div>
    </nav>
    {mob && <div style={{ position: "fixed", top: 56, left: 0, right: 0, zIndex: 199, background: "var(--bg1)", borderBottom: "1px solid var(--br)", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
      {links.map(([l, h]) => <a key={l} href={h} onClick={() => setMob(false)} style={{ fontSize: 14, color: "var(--tx2)" }}>{l}</a>)}
      {user
        ? <a href="/dashboard" onClick={() => setMob(false)} style={{ height: 42, borderRadius: 9, background: "var(--ac)", color: "#fff", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>Dashboard</a>
        : <a href="/sign-up" onClick={() => setMob(false)} style={{ height: 42, borderRadius: 9, background: "var(--ac)", color: "#fff", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>Get Started Free</a>
      }
    </div>}
  </>);
}

// ── PRICING CARDS ─────────────────────────────────────────────────────────
// Every feature below is available on both plans today. The paid plan raises
// usage limits, it does not unlock functionality. This is stated plainly rather
// than showing a comparison table of locks that the product does not implement.
const FREE_FEATURES = [
  { t: "10 AI requests / day", ok: true },
  { t: "300 board saves / month", ok: true },
  { t: "Full Kanban board", ok: true },
  { t: "Priority levels & due dates", ok: true },
  { t: "Board templates (5 presets)", ok: true },
  { t: "Text, PDF & URL import", ok: true },
  { t: "Kanbi Assistant", ok: true },
  { t: "Burnout alerts & health score", ok: true },
  { t: "DOCX & PDF export", ok: true },
  { t: "Autopilot briefings", ok: true },
];

const PRO_FEATURES = [
  { t: "100 AI requests / day", highlight: false },
  { t: "1,500 board saves / month", highlight: false },
  { t: "Everything in Free", highlight: false },
  { t: "Text, PDF & URL import", highlight: false },
  { t: "Kanbi Assistant (board-aware)", highlight: true },
  { t: "Burnout prevention & health scoring", highlight: true },
  { t: "DOCX & PDF export", highlight: false },
  { t: "Autopilot scheduling & briefings", highlight: true },
  { t: "Priority email support (24h)", highlight: false },
];

function PricingCards({ billing }: { billing: "monthly" | "yearly" }) {
  const monthlyPrice = 9;
  const yearlyPrice = Math.round(monthlyPrice * 12 * 0.67 / 12);

  const handleProClick = async () => {
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ billing }) });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else window.location.href = "/sign-up";
    } catch { window.location.href = "/sign-up"; }
  };

  return (
    <section style={{ padding: "0 0 96px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px" }}>
        <div className="g2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

          {/* FREE */}
          <div style={{ borderRadius: 16, border: "1px solid var(--br)", background: "var(--bg1)", padding: 32, display: "flex", flexDirection: "column" }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--tx3)", marginBottom: 16 }}>Free</p>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 6 }}>
              <span style={{ fontSize: 52, fontWeight: 800, letterSpacing: "-0.05em", color: "var(--tx)", lineHeight: 1 }}>$0</span>
              <span style={{ fontSize: 13, color: "var(--tx3)", marginBottom: 9 }}>/month</span>
            </div>
            <p style={{ fontSize: 13, color: "var(--tx3)", marginBottom: 28 }}>Perfect for getting started. No card needed.</p>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12, marginBottom: 32, flex: 1 }}>
              {FREE_FEATURES.map(f => (
                <li key={f.t} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: f.ok ? "var(--tx2)" : "var(--tx3)" }}>
                  <span style={{ color: f.ok ? "var(--ac)" : "var(--tx3)", flexShrink: 0, marginTop: 1 }}>
                    {f.ok ? <IC.Check size={14} /> : <IC.X size={14} />}
                  </span>
                  {f.t}
                </li>
              ))}
            </ul>
            <a href="/sign-up" style={{ display: "block", height: 42, borderRadius: 9, border: "1px solid var(--br)", fontSize: 13, fontWeight: 500, color: "var(--tx)", textAlign: "center", lineHeight: "42px", transition: "background .15s" }} onMouseOver={e => (e.currentTarget.style.background = "var(--bg2)")} onMouseOut={e => (e.currentTarget.style.background = "transparent")}>
              Get Started Free
            </a>
          </div>

          {/* PRO */}
          <div style={{ borderRadius: 16, border: "1px solid var(--ag)", background: "var(--bg1)", padding: 32, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 380, height: 160, background: "radial-gradient(ellipse at top,var(--ag) 0%,transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "relative", display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ac-text)" }}>Pro</p>
                <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 100, background: "var(--as)", border: "1px solid var(--ag)", color: "var(--ac-text)", fontWeight: 600 }}>Most Popular</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 52, fontWeight: 800, letterSpacing: "-0.05em", color: "var(--tx)", lineHeight: 1 }}>${billing === "yearly" ? yearlyPrice : monthlyPrice}</span>
                <span style={{ fontSize: 13, color: "var(--tx3)", marginBottom: 9 }}>/month</span>
                {billing === "yearly" && <span style={{ fontSize: 11, color: "var(--tx3)", marginBottom: 9, marginLeft: 4, textDecoration: "line-through" }}>${monthlyPrice}</span>}
              </div>
              {billing === "yearly"
                ? <p style={{ fontSize: 13, color: "var(--gr-text)", marginBottom: 28, fontWeight: 500 }}>Billed ${yearlyPrice * 12}/year · Save ${(monthlyPrice - yearlyPrice) * 12}/year</p>
                : <p style={{ fontSize: 13, color: "var(--tx3)", marginBottom: 28 }}>For serious freelancers. Cancel anytime.</p>
              }
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12, marginBottom: 32, flex: 1 }}>
                {PRO_FEATURES.map(f => (
                  <li key={f.t} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: f.highlight ? "var(--tx)" : "var(--tx2)" }}>
                    <span style={{ color: "var(--ac-text)", flexShrink: 0, marginTop: 1 }}><IC.Check size={14} /></span>
                    {f.highlight ? <strong style={{ fontWeight: 500 }}>{f.t}</strong> : f.t}
                  </li>
                ))}
              </ul>
              <button onClick={handleProClick} style={{ display: "block", width: "100%", height: 42, borderRadius: 9, background: "var(--ac)", fontSize: 13, fontWeight: 600, color: "#fff", border: "none", boxShadow: "0 4px 24px var(--ag)", transition: "background .15s" }} onMouseOver={e => (e.currentTarget.style.background = "var(--ach)")} onMouseOut={e => (e.currentTarget.style.background = "var(--ac)")}>
                Start Pro · ${billing === "yearly" ? yearlyPrice : monthlyPrice}/mo
              </button>
              <p style={{ textAlign: "center", fontSize: 11, color: "var(--tx3)", marginTop: 10 }}>Stripe billing · Cancel anytime</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

// ── FEATURE COMPARISON TABLE ──────────────────────────────────────────────
const CMP_ROWS = [
  { f: "AI requests", free: "10 / day", pro: "100 / day" },
  { f: "AI requests per month", free: "300", pro: "1,500" },
  { f: "Board saves", free: "300 / month", pro: "1,500 / month" },
  { f: "Kanban board", free: "Yes", pro: "Yes" },
  { f: "Board templates", free: "Yes", pro: "Yes" },
  { f: "Text import", free: "Yes", pro: "Yes" },
  { f: "PDF import", free: "Yes", pro: "Yes" },
  { f: "URL extraction", free: "Yes", pro: "Yes" },
  { f: "Kanbi Assistant", free: "Yes", pro: "Yes" },
  { f: "Burnout prevention", free: "Yes", pro: "Yes" },
  { f: "Health score", free: "Yes", pro: "Yes" },
  { f: "DOCX & PDF export", free: "Yes", pro: "Yes" },
  { f: "Autopilot briefings", free: "Yes", pro: "Yes" },
  { f: "Priority support", free: "Email", pro: "24h email" },
];

function ComparisonTable() {
  const ref = useRef<HTMLDivElement>(null);
  const v = useInView(ref as React.RefObject<HTMLElement>);
  return (
    <section style={{ padding: "0 0 96px", borderTop: "1px solid var(--br)" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "64px 24px 0" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ac-text)", marginBottom: 12 }}>Compare</p>
          <h2 style={{ fontSize: "clamp(24px,4vw,40px)", fontWeight: 700, letterSpacing: "-0.035em", color: "var(--tx)" }}>Free vs Pro, side by side</h2>
        </div>
        <div ref={ref} style={{ borderRadius: 14, border: "1px solid var(--br)", background: "var(--bg1)", overflow: "hidden", opacity: v ? 1 : 0, transform: v ? "translateY(0)" : "translateY(20px)", transition: "opacity .5s ease,transform .5s ease" }}>
          {/* A real table, inside its own scroll container. The caption names it
              for a screen reader, since "Free vs Pro" as a visual heading is
              not enough context for a reader who has lost the page layout. */}
          <div className="cmp-scroll">
            <table className="cmp-table">
              <caption className="sr-only">
                Feature comparison between the free and the Pro plan
              </caption>
              <thead>
                <tr>
                  <th scope="col">Feature</th>
                  <th scope="col">Free</th>
                  <th scope="col" className="is-pro">
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <IC.Zap size={12} />
                      Pro
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {CMP_ROWS.map((row) => (
                  <tr key={row.f}>
                    <th scope="row">{row.f}</th>
                    <td>{row.free}</td>
                    <td className="is-pro">{row.pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── WHAT IT ACTUALLY DOES ─────────────────────────────────────────────────
// This replaces a testimonial block that used invented names, roles, and
// results. Unverifiable customer quotes are not published here.
const CAPABILITIES = [
  {
    title: "Deterministic workload math",
    body: "Health score, burnout risk, deadline clustering, and time estimates are ordinary TypeScript with no model involved. The same board always produces the same number.",
  },
  {
    title: "A model only where it helps",
    body: "A language model reads your notes and decides which sentences are tasks. It never does the arithmetic, so the numbers on your board do not change between refreshes.",
  },
  {
    title: "Works when the model does not",
    body: "If the model runtime is unreachable, extraction falls back to parsing bullet points and the assistant falls back to a board-aware reply, rather than showing an error page. Workload scoring and the autopilot briefing need no model at all.",
  },
];

function SocialProof() {
  const ref = useRef<HTMLDivElement>(null);
  const v = useInView(ref as React.RefObject<HTMLElement>);
  return (
    <section style={{ padding: "0 0 96px", borderTop: "1px solid var(--br)" }}>
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "64px 24px 0" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ac-text)", marginBottom: 12 }}>How it works</p>
          <h2 style={{ fontSize: "clamp(24px,4vw,40px)", fontWeight: 700, letterSpacing: "-0.035em", color: "var(--tx)" }}>What the software actually does</h2>
        </div>
        <div ref={ref} className="g3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          {CAPABILITIES.map((c, i) => (
            <div key={c.title} style={{ borderRadius: 14, border: "1px solid var(--br)", background: "var(--bg1)", padding: 24, opacity: v ? 1 : 0, transform: v ? "translateY(0)" : "translateY(20px)", transition: `opacity .5s ease ${i * 0.1}s,transform .5s ease ${i * 0.1}s` }}>
              <p style={{ fontSize: 14, color: "var(--tx)", lineHeight: 1.5, marginBottom: 10, fontWeight: 600 }}>{c.title}</p>
              <p style={{ fontSize: 13, color: "var(--tx2)", lineHeight: 1.65 }}>{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────
const FAQS = [
  { q: "Is the free plan really free forever?", a: "Yes. No credit card required, no trial period. The free plan is yours to keep with 10 AI extractions/day and 300 board uses/month kanbi enough for real daily use." },
  { q: "What happens if I hit the free plan limits?", a: "You will see a prompt to upgrade. Your existing boards and tasks are never deleted. Upgrading raises your limits straight away." },
  { q: "Can I cancel Pro anytime?", a: "Absolutely. Cancel from your dashboard settings in one click. You keep Pro access until the end of your billing period, then drop back to the free plan kanbi no data loss." },
  { q: "Is there a yearly discount?", a: "Yes kanbi pay yearly and get 4 months free (33% off). That's $72/year instead of $108. You can switch between monthly and yearly from your billing settings." },
  { q: "What payment methods do you accept?", a: "All major credit and debit cards via Stripe. Stripe is PCI-DSS compliant kanbi we never store your card details." },
  { q: "Do you offer refunds?", a: "If you're not happy in the first 7 days, email us and we'll refund you, no questions asked." },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section style={{ padding: "0 0 96px", borderTop: "1px solid var(--br)" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "64px 24px 0" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ac-text)", marginBottom: 12 }}>FAQ</p>
          <h2 style={{ fontSize: "clamp(24px,4vw,40px)", fontWeight: 700, letterSpacing: "-0.035em", color: "var(--tx)" }}>Pricing questions answered</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {FAQS.map((f, i) => (
            <div key={f.q} style={{ border: `1px solid ${open === i ? "var(--ag)" : "var(--br)"}`, borderRadius: 10, overflow: "hidden", transition: "border-color .18s" }}>
              <button onClick={() => setOpen(open === i ? null : i)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 17px", background: "transparent", border: "none", color: "var(--tx)", fontSize: 13.5, fontWeight: 500, textAlign: "left", gap: 12, cursor: "pointer" }}>
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

// ── CTA BANNER ────────────────────────────────────────────────────────────
function CTABanner() {
  return (
    <section style={{ padding: "0 0 96px", borderTop: "1px solid var(--br)" }}>
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "64px 24px 0" }}>
        <div style={{ borderRadius: 20, border: "1px solid var(--ag)", background: "linear-gradient(160deg,var(--as) 0%,transparent 100%)", padding: "72px 40px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 560, height: 200, background: "radial-gradient(ellipse at top,var(--ag) 0%,transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            <h2 style={{ fontSize: "clamp(28px,5vw,52px)", fontWeight: 700, letterSpacing: "-0.038em", color: "var(--tx)", marginBottom: 16 }}>Ready to get your notes onto a board?</h2>
            <p style={{ fontSize: 15, color: "var(--tx2)", maxWidth: 440, margin: "0 auto 34px", lineHeight: 1.65 }}>Start free. Every feature is on both plans. Upgrade when you need higher limits.</p>
            <div className="cr" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <a href="/sign-up" style={{ height: 48, padding: "0 28px", borderRadius: 10, background: "var(--inv)", color: "var(--inv2)", fontSize: 14, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 9, transition: "opacity .15s" }} onMouseOver={e => (e.currentTarget.style.opacity = ".88")} onMouseOut={e => (e.currentTarget.style.opacity = "1")}>
                Start Free · No Card Needed <IC.Arrow size={15} />
              </a>
              <a href="#faq" style={{ height: 48, padding: "0 22px", borderRadius: 10, border: "1px solid var(--brh)", fontSize: 14, color: "var(--tx2)", display: "inline-flex", alignItems: "center", transition: "all .15s" }} onMouseOver={e => { e.currentTarget.style.borderColor = "var(--ag)"; e.currentTarget.style.color = "var(--tx)"; }} onMouseOut={e => { e.currentTarget.style.borderColor = "var(--brh)"; e.currentTarget.style.color = "var(--tx2)"; }}>
                See FAQ <IC.ArrowRight size={13} style={{ display: "inline-block", verticalAlign: "-2px", marginLeft: 4 }}/>
              </a>
            </div>
            <p style={{ marginTop: 18, fontSize: 12, color: "var(--tx3)" }}>No contracts · Free plan forever · Cancel Pro anytime</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── FOOTER ────────────────────────────────────────────────────────────────
function Footer() {
  const { theme, toggle } = useTheme();
  return (
    <footer style={{ borderTop: "1px solid var(--br)", padding: "40px 0 28px" }}>
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 7, background: "var(--ac)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}><IC.Zap size={11} /></div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--tx)", letterSpacing: "-0.025em" }}>Kanbi</span>
        </Link>
        <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          {[
            ["Home", "/"],
            ["Pricing", "/pricing"],
            ["Changelog", "/changelog"],
            ["Sign In", "/sign-in"],
            ["Sign Up", "/sign-up"],
            ["Privacy", "/privacy"],
            ["Terms", "/terms"],
          ].map(([l, h]) => (
            <Link key={l} href={h!} className="na" style={{ fontSize: 12, color: "var(--tx3)", transition: "color .15s" }}>{l}</Link>
          ))}
          <a href="mailto:support@kanbi.app" className="na" style={{ fontSize: 12, color: "var(--tx3)", transition: "color .15s" }}>Contact</a>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {TECH_STACK.slice(0, 6).map(({ name, Icon }) => (
            <span key={name} title={name} aria-label={name}
              style={{ display: "inline-flex", alignItems: "center", color: "var(--tx3)" }}>
              <Icon size={14}/>
            </span>
          ))}
          {/* Rendered from the current year so it cannot go stale. */}
          <span style={{ fontSize: 12, color: "var(--tx3)" }}>© {new Date().getFullYear()} Kanbi</span>
          <button onClick={toggle} style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid var(--br)", background: "var(--bg1)", color: "var(--tx3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {theme === "dark" ? <IC.Sun size={13} /> : <IC.Moon size={13} />}
          </button>
        </div>
      </div>
    </footer>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────
export default function PricingPage() {
  // Read the stored theme on first client render rather than in an effect, which
  // avoids a cascading render and a flash of the wrong theme.
  // This page used to read the stored theme and nothing else, so a visitor on a
  // light system with no stored preference got light on the landing page and
  // dark here. The shared store applies one rule everywhere.
  const { theme, toggle } = useSiteTheme();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  return (
    <ThemeCtx.Provider value={{ theme, toggle }}>
      <Styles />
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <Navbar />
        {/* HERO with billing toggle */}
        <section style={{ padding: "148px 0 64px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(var(--br) 1px,transparent 1px),linear-gradient(90deg,var(--br) 1px,transparent 1px)", backgroundSize: "72px 72px" }} />
          <div style={{ position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)", width: 700, height: 420, background: "radial-gradient(ellipse,var(--ag) 0%,transparent 68%)", pointerEvents: "none" }} />
          <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 24px", textAlign: "center", position: "relative" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px 5px 10px", borderRadius: 100, border: "1px solid var(--ag)", background: "var(--as)", marginBottom: 28 }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, background: "var(--as)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ac-text)" }}><IC.Spark size={13} /></div>
              <span style={{ fontSize: 12, color: "var(--ac-text)", fontWeight: 500 }}>Simple, honest pricing kanbi no hidden fees</span>
            </div>
            <h1 style={{ fontSize: "clamp(40px,6.5vw,76px)", fontWeight: 800, letterSpacing: "-0.048em", lineHeight: 1.06, color: "var(--tx)", marginBottom: 20 }}>
              Start free.{" "}<span className="shimmer">Upgrade when ready.</span>
            </h1>
            <p style={{ fontSize: 17, color: "var(--tx2)", maxWidth: 480, margin: "0 auto 36px", lineHeight: 1.7 }}>
              Every plan includes the full Kanban board. Pro unlocks AI superpowers kanbi and pays for itself in the first hour you save.
            </p>
            {/* billing toggle */}
            <div style={{ display: "inline-flex", alignItems: "center", borderRadius: 10, border: "1px solid var(--br)", background: "var(--bg1)", padding: 4, marginBottom: 8 }}>
              {(["monthly", "yearly"] as const).map(b => (
                <button key={b} onClick={() => setBilling(b)} style={{ padding: "8px 20px", borderRadius: 7, border: "none", background: billing === b ? "var(--bg2)" : "transparent", color: billing === b ? "var(--tx)" : "var(--tx2)", fontSize: 13, fontWeight: billing === b ? 600 : 400, boxShadow: billing === b ? "0 1px 4px rgba(0,0,0,.2)" : "none", transition: "all .15s", display: "flex", alignItems: "center", gap: 6 }}>
                  {b === "monthly" ? "Monthly" : "Yearly"}
                  {b === "yearly" && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 100, background: "var(--as)", border: "1px solid var(--ag)", color: "var(--ac-text)" }}>Save 33%</span>}
                </button>
              ))}
            </div>
            {billing === "yearly" && <p style={{ fontSize: 12, color: "var(--gr-text)" }}>Billed annually · 4 months free</p>}
          </div>
        </section>

        <PricingCards billing={billing} />


        <FAQ />
        <CTABanner />
        <Footer />
      </div>
    </ThemeCtx.Provider>
  );
}
