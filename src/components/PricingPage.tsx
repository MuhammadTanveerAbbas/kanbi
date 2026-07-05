"use client";
import { useState, useEffect, useRef, createContext, useContext } from "react";
import { createClient } from "@/lib/supabase/client";

type Theme = "dark" | "light";
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({ theme: "dark", toggle: () => {} });
const useTheme = () => useContext(ThemeCtx);
const DV = `--bg:#07070b;--bg1:#0d0d13;--bg2:#111119;--bg3:#16161f;--br:rgba(255,255,255,0.07);--brh:rgba(255,255,255,0.13);--tx:#e0e0ea;--tx2:#787896;--tx3:#3e3e55;--inv:#fff;--inv2:#07070b;--nb:rgba(7,7,11,0.88);`;
const LV = `--bg:#f2f3fb;--bg1:#ffffff;--bg2:#eaebf8;--bg3:#e0e2f5;--br:rgba(0,0,0,0.07);--brh:rgba(0,0,0,0.14);--tx:#0a0a18;--tx2:#4a4a72;--tx3:#9898b8;--inv:#0a0a18;--inv2:#fff;--nb:rgba(242,243,251,0.92);`;

function Styles({ theme }: { theme: Theme }) {
  return <style suppressHydrationWarning>{`
    @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}
    :root{${theme==="dark"?DV:LV}--ac:#5e6fe8;--ach:#6e7ff8;--as:rgba(94,111,232,0.12);--ag:rgba(94,111,232,0.22);--gr:#22c55e;--am:#f59e0b;--rd:#ef4444;--pu:#a78bfa;}
    body{font-family:'Geist',-apple-system,sans-serif;background:var(--bg);color:var(--tx);-webkit-font-smoothing:antialiased;overflow-x:hidden;transition:background .2s,color .2s}
    a{text-decoration:none;color:inherit}button{font-family:inherit;cursor:pointer}
    ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:var(--bg)}::-webkit-scrollbar-thumb{background:var(--br);border-radius:3px}
    @keyframes shimmer{from{background-position:-300% center}to{background-position:300% center}}
    @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.55)}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    .shimmer{background:linear-gradient(90deg,var(--ac),var(--pu) 40%,var(--ac) 70%,var(--pu));background-size:300% auto;-webkit-background-clip:text;background-clip:text;color:transparent;animation:shimmer 4s linear infinite}
    .pulse{animation:pulse 2.2s ease-in-out infinite}
    .na:hover{color:var(--tx)!important}
    .fu{animation:fadeUp .5s cubic-bezier(.22,1,.36,1) both}
    @media(max-width:768px){.nl{display:none!important}.ms{display:flex!important}.g2{grid-template-columns:1fr!important}.cr{flex-direction:column!important;align-items:stretch!important}.cr a,.cr button{justify-content:center!important}}
    @media(max-width:480px){.g3{grid-template-columns:1fr!important}}
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
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const o = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setV(true); o.disconnect(); } }, { threshold: thr });
    o.observe(el); return () => o.disconnect();
  }, []);
  return v;
}

const S = (d: string | string[], sw = "1.8") => ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
  </svg>
);
const IC = {
  Zap: S("M13 2L3 14h9l-1 8 10-12h-9l1-8z", "2.2"),
  Spark: S("M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z"),
  Check: S("M20 6L9 17l-5-5", "2.5"),
  X: S("M18 6L6 18M6 6l12 12", "2"),
  Arrow: S("M5 12h14M12 5l7 7-7 7", "2.2"),
  ChevD: S("M6 9l6 6 6-6", "2"),
  Sun: S("M12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7zm0-4v2M12 19v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"),
  Moon: S("M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"),
  Menu: S("M4 6h16M4 12h16M4 18h16", "2"),
  Shield: S("M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"),
  Brain: S("M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"),
  Cal: S(["M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z", "M16 2v4M8 2v4M3 10h18"]),
  Export: S(["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M17 8l-5-5-5 5", "M12 3v12"]),
  Board: S(["M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"]),
  Chart: S("M18 20V10M12 20V4M6 20v-6"),
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
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--ac)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 0 18px var(--ag)" }}><IC.Zap size={13} /></div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--tx)", letterSpacing: "-0.025em" }}>Kanbi</span>
        </a>
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
const FREE_FEATURES = [
  { t: "10 AI task extractions / day", ok: true },
  { t: "300 board uses / month", ok: true },
  { t: "Full Kanban board", ok: true },
  { t: "Priority levels & due dates", ok: true },
  { t: "Board templates (5 presets)", ok: true },
  { t: "PDF import", ok: false },
  { t: "AI Chat Coach", ok: false },
  { t: "Burnout alerts & health score", ok: false },
  { t: "DOCX & PDF export", ok: false },
  { t: "Autopilot briefings", ok: false },
];

const PRO_FEATURES = [
  { t: "50 AI task extractions / day", highlight: false },
  { t: "Unlimited board uses", highlight: false },
  { t: "PDF import & URL extraction", highlight: false },
  { t: "AI Chat Coach (board-aware)", highlight: true },
  { t: "Burnout prevention & health scoring", highlight: true },
  { t: "DOCX & PDF export", highlight: false },
  { t: "Autopilot scheduling & briefings", highlight: true },
  { t: "Priority email support (24h)", highlight: false },
  { t: "Everything in Free", highlight: false },
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
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ac)" }}>Pro</p>
                <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 100, background: "var(--as)", border: "1px solid var(--ag)", color: "var(--ac)", fontWeight: 600 }}>Most Popular</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 52, fontWeight: 800, letterSpacing: "-0.05em", color: "var(--tx)", lineHeight: 1 }}>${billing === "yearly" ? yearlyPrice : monthlyPrice}</span>
                <span style={{ fontSize: 13, color: "var(--tx3)", marginBottom: 9 }}>/month</span>
                {billing === "yearly" && <span style={{ fontSize: 11, color: "var(--tx3)", marginBottom: 9, marginLeft: 4, textDecoration: "line-through" }}>${monthlyPrice}</span>}
              </div>
              {billing === "yearly"
                ? <p style={{ fontSize: 13, color: "var(--gr)", marginBottom: 28, fontWeight: 500 }}>Billed ${yearlyPrice * 12}/year · Save ${(monthlyPrice - yearlyPrice) * 12}/year</p>
                : <p style={{ fontSize: 13, color: "var(--tx3)", marginBottom: 28 }}>For serious freelancers. Cancel anytime.</p>
              }
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12, marginBottom: 32, flex: 1 }}>
                {PRO_FEATURES.map(f => (
                  <li key={f.t} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: f.highlight ? "var(--tx)" : "var(--tx2)" }}>
                    <span style={{ color: "var(--ac)", flexShrink: 0, marginTop: 1 }}><IC.Check size={14} /></span>
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
  { f: "AI task extractions", free: "10 / day", pro: "50 / day" },
  { f: "Board uses", free: "300 / month", pro: "Unlimited" },
  { f: "Kanban board", free: "✓", pro: "✓" },
  { f: "Board templates", free: "✓", pro: "✓" },
  { f: "PDF import", free: "kanbi", pro: "✓" },
  { f: "URL extraction", free: "kanbi", pro: "✓" },
  { f: "AI Chat Coach", free: "kanbi", pro: "✓" },
  { f: "Burnout prevention", free: "kanbi", pro: "✓" },
  { f: "Health score", free: "kanbi", pro: "✓" },
  { f: "DOCX & PDF export", free: "kanbi", pro: "✓" },
  { f: "Autopilot briefings", free: "kanbi", pro: "✓" },
  { f: "Priority support", free: "kanbi", pro: "24h email" },
];

function ComparisonTable() {
  const ref = useRef<HTMLDivElement>(null);
  const v = useInView(ref as React.RefObject<HTMLElement>);
  return (
    <section style={{ padding: "0 0 96px", borderTop: "1px solid var(--br)" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "64px 24px 0" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ac)", marginBottom: 12 }}>Compare</p>
          <h2 style={{ fontSize: "clamp(24px,4vw,40px)", fontWeight: 700, letterSpacing: "-0.035em", color: "var(--tx)" }}>Free vs Pro, side by side</h2>
        </div>
        <div ref={ref} style={{ borderRadius: 14, border: "1px solid var(--br)", background: "var(--bg1)", overflow: "hidden", opacity: v ? 1 : 0, transform: v ? "translateY(0)" : "translateY(20px)", transition: "opacity .5s ease,transform .5s ease" }}>
          {/* header */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", background: "var(--bg2)", borderBottom: "1px solid var(--br)" }}>
            <div style={{ padding: "14px 20px", fontSize: 12, fontWeight: 700, color: "var(--tx3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Feature</div>
            <div style={{ padding: "14px 20px", fontSize: 12, fontWeight: 700, color: "var(--tx3)", textTransform: "uppercase", letterSpacing: "0.06em", borderLeft: "1px solid var(--br)", textAlign: "center" }}>Free</div>
            <div style={{ padding: "14px 20px", fontSize: 12, fontWeight: 700, color: "var(--ac)", textTransform: "uppercase", letterSpacing: "0.06em", borderLeft: "1px solid var(--br)", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><IC.Zap size={12} />Pro</div>
          </div>
          {CMP_ROWS.map((row, i) => (
            <div key={row.f} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", borderBottom: i < CMP_ROWS.length - 1 ? "1px solid var(--br)" : "none" }}>
              <div style={{ padding: "14px 20px", fontSize: 13, color: "var(--tx)", fontWeight: 500 }}>{row.f}</div>
              <div style={{ padding: "14px 20px", fontSize: 13, color: row.free === "kanbi" ? "var(--tx3)" : "var(--tx2)", borderLeft: "1px solid var(--br)", textAlign: "center" }}>{row.free}</div>
              <div style={{ padding: "14px 20px", fontSize: 13, color: row.pro === "kanbi" ? "var(--tx3)" : "var(--tx)", fontWeight: row.pro !== "kanbi" ? 500 : 400, borderLeft: "1px solid var(--br)", textAlign: "center", background: "var(--as)" }}>{row.pro}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── SOCIAL PROOF ──────────────────────────────────────────────────────────
const TESTIMONIALS = [
  { name: "Alex R.", role: "Freelance Designer", avatar: "AR", text: "I paste my Monday morning emails and my board is ready in 10 seconds. Kanbi paid for itself on day one." },
  { name: "Priya M.", role: "Indie Developer", avatar: "PM", text: "The burnout alerts are real. It flagged I was overloaded before I even felt it. That alone is worth $9." },
  { name: "James T.", role: "Consultant", avatar: "JT", text: "Autopilot generates my daily schedule from my board. I stopped spending 45 minutes planning every morning." },
];

function SocialProof() {
  const ref = useRef<HTMLDivElement>(null);
  const v = useInView(ref as React.RefObject<HTMLElement>);
  return (
    <section style={{ padding: "0 0 96px", borderTop: "1px solid var(--br)" }}>
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "64px 24px 0" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ac)", marginBottom: 12 }}>What users say</p>
          <h2 style={{ fontSize: "clamp(24px,4vw,40px)", fontWeight: 700, letterSpacing: "-0.035em", color: "var(--tx)" }}>Real results, real freelancers</h2>
        </div>
        <div ref={ref} className="g3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={t.name} style={{ borderRadius: 14, border: "1px solid var(--br)", background: "var(--bg1)", padding: 24, opacity: v ? 1 : 0, transform: v ? "translateY(0)" : "translateY(20px)", transition: `opacity .5s ease ${i * 0.1}s,transform .5s ease ${i * 0.1}s` }}>
              <p style={{ fontSize: 14, color: "var(--tx)", lineHeight: 1.65, marginBottom: 20, fontStyle: "italic" }}>"{t.text}"</p>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--as)", border: "1px solid var(--ag)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--ac)", flexShrink: 0 }}>{t.avatar}</div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--tx)" }}>{t.name}</p>
                  <p style={{ fontSize: 12, color: "var(--tx3)" }}>{t.role}</p>
                </div>
              </div>
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
  { q: "What happens if I hit the free plan limits?", a: "You'll see a friendly prompt to upgrade. Your existing boards and tasks are never deleted. You can upgrade to Pro at any time to instantly unlock higher limits." },
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
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ac)", marginBottom: 12 }}>FAQ</p>
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
            <h2 style={{ fontSize: "clamp(28px,5vw,52px)", fontWeight: 700, letterSpacing: "-0.038em", color: "var(--tx)", marginBottom: 16 }}>Ready to save 2 hours daily?</h2>
            <p style={{ fontSize: 15, color: "var(--tx2)", maxWidth: 440, margin: "0 auto 34px", lineHeight: 1.65 }}>Start free. Upgrade to Pro for AI superpowers. Cancel anytime.</p>
            <div className="cr" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <a href="/sign-up" style={{ height: 48, padding: "0 28px", borderRadius: 10, background: "var(--inv)", color: "var(--inv2)", fontSize: 14, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 9, transition: "opacity .15s" }} onMouseOver={e => (e.currentTarget.style.opacity = ".88")} onMouseOut={e => (e.currentTarget.style.opacity = "1")}>
                Start Free · No Card Needed <IC.Arrow size={15} />
              </a>
              <a href="#faq" style={{ height: 48, padding: "0 22px", borderRadius: 10, border: "1px solid var(--brh)", fontSize: 14, color: "var(--tx2)", display: "inline-flex", alignItems: "center", transition: "all .15s" }} onMouseOver={e => { e.currentTarget.style.borderColor = "var(--ag)"; e.currentTarget.style.color = "var(--tx)"; }} onMouseOut={e => { e.currentTarget.style.borderColor = "var(--brh)"; e.currentTarget.style.color = "var(--tx2)"; }}>
                See FAQ →
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
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 7, background: "var(--ac)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}><IC.Zap size={11} /></div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--tx)", letterSpacing: "-0.025em" }}>Kanbi</span>
        </a>
        <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          {[["Home", "/"], ["Pricing", "/pricing"], ["Sign In", "/sign-in"], ["Sign Up", "/sign-up"]].map(([l, h]) => (
            <a key={l} href={h} className="na" style={{ fontSize: 12, color: "var(--tx3)", transition: "color .15s" }}>{l}</a>
          ))}
          <a href="mailto:themvpguy.contact@gmail.com" className="na" style={{ fontSize: 12, color: "var(--tx3)", transition: "color .15s" }}>Contact</a>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: "var(--tx3)" }}>© 2025 Kanbi</span>
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
  const [theme, setTheme] = useState<Theme>("dark");
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  useEffect(() => {
    const saved = localStorage.getItem("kanbi-theme") as Theme | null;
    if (saved) setTheme(saved);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("kanbi-theme", next);
  };

  return (
    <ThemeCtx.Provider value={{ theme, toggle }}>
      <Styles theme={theme} />
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <Navbar />
        {/* HERO with billing toggle */}
        <section style={{ padding: "148px 0 64px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(var(--br) 1px,transparent 1px),linear-gradient(90deg,var(--br) 1px,transparent 1px)", backgroundSize: "72px 72px" }} />
          <div style={{ position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)", width: 700, height: 420, background: "radial-gradient(ellipse,var(--ag) 0%,transparent 68%)", pointerEvents: "none" }} />
          <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 24px", textAlign: "center", position: "relative" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px 5px 10px", borderRadius: 100, border: "1px solid var(--ag)", background: "var(--as)", marginBottom: 28 }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, background: "var(--as)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ac)" }}><IC.Spark size={13} /></div>
              <span style={{ fontSize: 12, color: "var(--ac)", fontWeight: 500 }}>Simple, honest pricing kanbi no hidden fees</span>
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
                  {b === "yearly" && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 100, background: "var(--as)", border: "1px solid var(--ag)", color: "var(--ac)" }}>Save 33%</span>}
                </button>
              ))}
            </div>
            {billing === "yearly" && <p style={{ fontSize: 12, color: "var(--gr)" }}>Billed annually · 4 months free</p>}
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
