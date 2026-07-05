"use client";

import { useState, useEffect } from "react";

export function BarChart({ data }: { data: { label: string; value: number; color?: string }[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  const isEmpty = data.length === 0 || data.every(d => d.value === 0);
  const max = Math.max(...data.map(d => d.value), 1);
  const W = 100, H = 80;

  if (isEmpty) {
    return (
      <div style={{ height:120, display:"flex", flexDirection:"column", alignItems:"center",
        justifyContent:"center", gap:10 }}>
        <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="var(--tx3)"
          strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span style={{ fontSize:11.5, color:"var(--tx3)", fontWeight:500, textAlign:"center" }}>
          Complete tasks to see activity
        </span>
      </div>
    );
  }

  const pts = data.map((d, i) => {
    const x = data.length === 1 ? 50 : (i / (data.length - 1)) * 96 + 2;
    const y = H - (d.value / max) * (H - 8) - 4;
    return { x, y, ...d };
  });
  const polyline = pts.map(p => `${p.x},${p.y}`).join(" ");
  const area = `M${pts[0]!.x},${H} ` + pts.map(p => `L${p.x},${p.y}`).join(" ") + ` L${pts[pts.length-1]!.x},${H} Z`;

  const total = data.reduce((s, d) => s + d.value, 0);
  const hoveredPt = hovered !== null ? pts[hovered] : null;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ position:"relative", width:"100%", paddingBottom:"52%" }}>
        <svg viewBox={`0 0 100 ${H}`} preserveAspectRatio="none"
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", overflow:"visible" }}>
          <defs>
            <linearGradient id="lineArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--ac)" stopOpacity="0.22"/>
              <stop offset="100%" stopColor="var(--ac)" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="lineStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--pu)"/>
              <stop offset="100%" stopColor="var(--ac)"/>
            </linearGradient>
            <filter id="lineglow">
              <feGaussianBlur stdDeviation="1.2" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {[0.25, 0.5, 0.75, 1].map(f => (
            <line key={f}
              x1="0" y1={H - f * (H - 8) - 4}
              x2="100" y2={H - f * (H - 8) - 4}
              stroke="var(--br)" strokeWidth="0.4" strokeDasharray="2,3"/>
          ))}

          <path d={area} fill="url(#lineArea)"
            style={{ transition: mounted ? "opacity .6s" : "none", opacity: mounted ? 1 : 0 }}/>

          {hoveredPt && (
            <line x1={hoveredPt.x} y1={4} x2={hoveredPt.x} y2={H}
              stroke="var(--ac)" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.6"/>
          )}

          <polyline points={polyline} fill="none" stroke="url(#lineStroke)"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
            filter="url(#lineglow)"
            style={{
              strokeDasharray: mounted ? "none" : "200",
              strokeDashoffset: mounted ? "0" : "200",
              transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)",
            }}/>

          {pts.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="3.5" fill="transparent"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor:"crosshair" }}/>
              <circle cx={p.x} cy={p.y}
                r={hovered === i ? 3 : (p.value > 0 ? 1.8 : 1)}
                fill={hovered === i ? "#fff" : "var(--ac)"}
                stroke={hovered === i ? "var(--ac)" : "none"}
                strokeWidth="1.5"
                style={{ transition:"r .15s, fill .15s", pointerEvents:"none",
                  filter: hovered === i ? "drop-shadow(0 0 4px var(--ac))" : "none" }}/>
            </g>
          ))}

          {hoveredPt && (() => {
            const tx = hoveredPt.x > 80 ? hoveredPt.x - 22 : hoveredPt.x + 2;
            const ty = hoveredPt.y > 20 ? hoveredPt.y - 14 : hoveredPt.y + 6;
            return (
              <g style={{ pointerEvents:"none" }}>
                <rect x={tx - 1} y={ty - 7} width={24} height={14} rx="3"
                  fill="var(--bg3)" stroke="var(--brh)" strokeWidth="0.5"/>
                <text x={tx + 11} y={ty + 2.5} textAnchor="middle"
                  fill="var(--tx)" fontSize="5.5" fontWeight="700" fontFamily="var(--font-mono)">
                  {hoveredPt.value}
                </text>
                <text x={tx + 11} y={ty + 8.5} textAnchor="middle"
                  fill="var(--tx3)" fontSize="4.5" fontFamily="var(--font-mono)">
                  {hoveredPt.label}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
        paddingTop:8, borderTop:"1px solid var(--br)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <div style={{ width:20, height:2, borderRadius:1,
            background:"linear-gradient(90deg, var(--pu), var(--ac))" }}/>
          <span style={{ fontSize:10.5, color:"var(--tx3)" }}>Completed tasks</span>
        </div>
        <div style={{ display:"flex", gap:14 }}>
          <span style={{ fontSize:10.5, color:"var(--tx3)" }}>
            Peak <span style={{ color:"var(--tx)", fontWeight:700, fontFamily:"var(--font-mono)" }}>{max}</span>
          </span>
          <span style={{ fontSize:10.5, color:"var(--tx3)" }}>
            Total <span style={{ color:"var(--ac)", fontWeight:700, fontFamily:"var(--font-mono)" }}>{total}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export function DonutChart({ segs, size = 110 }: { segs: { value: number; color: string; label: string }[]; size?: number }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

  const rawTotal = segs.reduce((a, s) => a + s.value, 0);
  const hasData = rawTotal > 0;
  const total = rawTotal || 1;
  const r = size * 0.34, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const sw = size * 0.1;
  const rHover = r + sw * 0.18;

  let cum = 0;
  const arcs = segs.map((s, i) => {
    const pct = s.value / total;
    const startAngle = cum * 2 * Math.PI - Math.PI / 2;
    const endAngle = (cum + pct) * 2 * Math.PI - Math.PI / 2;
    cum += pct;
    const midAngle = (startAngle + endAngle) / 2;
    const tx = cx + (r + sw * 1.1) * Math.cos(midAngle);
    const ty = cy + (r + sw * 1.1) * Math.sin(midAngle);
    return { ...s, pct, startAngle, endAngle, midAngle, tx, ty, idx: i };
  });

  const hovSeg = hovered !== null ? arcs[hovered] : null;
  const centerLabel = hovSeg
    ? { val: hovSeg.value, lbl: hovSeg.label, col: hovSeg.color }
    : hasData
    ? (() => { const d = [...arcs].sort((a,b) => b.value - a.value)[0]!; return { val: d.value, lbl: d.label, col: d.color }; })()
    : null;

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16 }}>
      <div style={{ position:"relative", flexShrink:0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
          style={{ overflow:"visible" }}>
          <defs>
            {segs.map((s, i) => (
              <filter key={i} id={`dseg${i}`}>
                <feGaussianBlur stdDeviation="2" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            ))}
          </defs>

          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--br)" strokeWidth={sw}/>

          {hasData ? arcs.map((arc, i) => {
            if (arc.value === 0) return null;
            const isHov = hovered === i;
            const curR = isHov ? rHover : r;
            const curCirc = 2 * Math.PI * curR;
            const gap = arcs.filter(a => a.value > 0).length > 1 ? (isHov ? 2 : 3) : 0;
            const dash = arc.pct * (mounted ? curCirc : 0) - gap;
            const off = -(arc.startAngle + Math.PI / 2) / (2 * Math.PI) * curCirc;
            return (
              <circle key={i} cx={cx} cy={cy} r={curR} fill="none"
                stroke={arc.color} strokeWidth={isHov ? sw * 1.22 : sw}
                strokeLinecap="round"
                strokeDasharray={`${Math.max(dash, 0)} ${curCirc}`}
                strokeDashoffset={off}
                filter={isHov ? `url(#dseg${i})` : undefined}
                style={{
                  transition: "r .2s, stroke-width .2s, stroke-dasharray .9s cubic-bezier(.4,0,.2,1)",
                  cursor:"pointer",
                  transformOrigin:`${cx}px ${cy}px`,
                }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}/>
            );
          }) : null}
        </svg>

        <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", pointerEvents:"none",
          transition:"all .2s" }}>
          {centerLabel ? (
            <>
              <span style={{ fontSize: size * 0.17, fontWeight:800, color: hovered !== null ? centerLabel.col : "var(--tx)",
                letterSpacing:"-0.04em", fontFamily:"var(--font-display)", lineHeight:1,
                transition:"color .2s" }}>
                {centerLabel.val}%
              </span>
              <span style={{ fontSize: size * 0.082, fontWeight:600,
                marginTop:2, letterSpacing:"0.01em", transition:"color .2s",
                color: hovered !== null ? centerLabel.col : "var(--tx3)" } as React.CSSProperties}>
                {centerLabel.lbl}
              </span>
            </>
          ) : (
            <span style={{ fontSize: size * 0.13, color:"var(--tx3)", fontWeight:700 }}></span>
          )}
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px 16px", width:"100%" }}>
        {segs.map((s, i) => (
          <div key={s.label}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{ display:"flex", alignItems:"center", gap:7, cursor:"default",
              opacity: hovered !== null && hovered !== i ? 0.4 : 1,
              transition:"opacity .2s" }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:s.color, flexShrink:0,
              boxShadow: hovered === i ? `0 0 8px ${s.color}` : s.value > 0 ? `0 0 4px ${s.color}66` : "none",
              transition:"box-shadow .2s", opacity: s.value > 0 ? 1 : 0.3 }}/>
            <span style={{ fontSize:10.5, color:"var(--tx3)", flex:1, overflow:"hidden",
              textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.label}</span>
            <span style={{ fontSize:10.5, fontWeight:700, fontFamily:"var(--font-mono)",
              color: s.value > 0 ? "var(--tx)" : "var(--tx3)" }}>{s.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CompletionChart({ done, wip, todo, total }: { done: number; wip: number; todo: number; total: number }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 100); return () => clearTimeout(t); }, []);

  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const isComplete = done === total && total > 0;
  const ringColor = isComplete ? "var(--gr)" : pct >= 60 ? "var(--ac)" : pct >= 30 ? "var(--am)" : "var(--rd)";
  const size = 120;
  const r = 44, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const dashOffset = circ * (1 - (mounted ? pct / 100 : 0));

  const stats = [
    { key:"done",  label:"Done",        value:done, color:"var(--gr)" },
    { key:"wip",   label:"In Progress", value:wip,  color:"var(--ac)" },
    { key:"todo",  label:"To Do",       value:todo, color:"var(--tx3)" },
    { key:"total", label:"Total",       value:total,color:"var(--tx)"  },
  ];

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:16 }}>
      <div style={{ position:"relative", width:size, height:size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
          style={{ transform:"rotate(-90deg)", overflow:"visible" }}>
          <defs>
            <filter id="ringGlow">
              <feGaussianBlur stdDeviation="2.5" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--br)" strokeWidth="8"/>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={ringColor} strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={dashOffset}
            filter="url(#ringGlow)"
            style={{ transition:"stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1), stroke .3s" }}/>
        </svg>
        <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center" }}>
          <span style={{ fontSize:26, fontWeight:800, color: ringColor, fontFamily:"var(--font-display)",
            letterSpacing:"-0.04em", lineHeight:1, transition:"color .3s" }}>
            {pct}%
          </span>
          <span style={{ fontSize:9, color:"var(--tx3)", fontWeight:600, marginTop:2,
            fontFamily:"var(--font-mono)" }}>
            done
          </span>
        </div>
      </div>

      <div style={{ display:"flex", flexWrap:"wrap", gap:"6px 14px", justifyContent:"center" }}>
        {stats.map(s => (
          <div key={s.key} style={{ display:"flex", alignItems:"center", gap:6 }}
            onMouseEnter={() => setHovered(s.key)}
            onMouseLeave={() => setHovered(null)}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:s.color, flexShrink:0,
              transition:"all .15s",
              boxShadow: hovered === s.key ? `0 0 8px ${s.color}` : "none",
              opacity: hovered && hovered !== s.key ? 0.3 : 1 }}/>
            <span style={{ fontSize:11, color: hovered === s.key ? "var(--tx)" : "var(--tx3)",
              fontWeight: hovered === s.key ? 700 : 500, fontFamily:"var(--font-mono)",
              transition:"all .15s" }}>
              {s.label} <span style={{ color:"var(--tx)" }}>{s.value}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HealthRing({ score, size = 120 }: { score: number; size?: number }) {
  const color = score >= 70 ? "var(--gr)" : score >= 40 ? "var(--am)" : "var(--rd)";
  const pct = score;
  const r = 44, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 120); return () => clearTimeout(t); }, []);

  return (
    <div style={{ position:"relative", width:size, height:size, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
        style={{ transform:"rotate(-90deg)", position:"absolute" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--br)" strokeWidth="8"/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - (mounted ? pct / 100 : 0))}
          filter="url(#ringGlow)"
          style={{ transition:"stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1), stroke .3s" }}/>
      </svg>
      <div style={{ textAlign:"center", zIndex:1 }}>
        <div style={{ fontSize:28, fontWeight:800, color, fontFamily:"var(--font-display)",
          letterSpacing:"-0.04em", lineHeight:1, transition:"color .3s" }}>{score}</div>
        <div style={{ fontSize:8.5, color:"var(--tx3)", fontWeight:600, marginTop:1, letterSpacing:"0.05em" }}>
          HEALTH
        </div>
      </div>
    </div>
  );
}
