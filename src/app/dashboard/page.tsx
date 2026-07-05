"use client";


import {
  useState, useEffect, useRef, useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ReactMarkdown from "react-markdown";
import {
  AppCtx, useApp,
  type Page, type Priority, type TaskStatus, type Theme, type InputMode, type BoardView,
  type Task, type SavedBoard, type ChatMsg, type Briefing, type BurnoutAlert, type AuthUser, type AppState,
} from "@/components/dashboard/types";
import {
  Icons, StarIcon, BoardStarIcon, SavedStarIcon, ChatStarIcon, ChatBotIcon, PilotStarIcon, SettingsStarIcon,
} from "@/components/dashboard/icons";
import { PriBadge, Avt, PBar, Toggle, Skeleton } from "@/components/dashboard/ui";
import { BarChart, DonutChart, CompletionChart, HealthRing } from "@/components/dashboard/charts";
import { sanitizeChatText, truncateChatResponse } from "@/lib/chat-text";

const DARK_VARS = `
  --bg:#07070e; --bg1:#0e0e18; --bg2:#13131f; --bg3:#18182a;
  --br:rgba(255,255,255,0.07); --brh:rgba(255,255,255,0.14);
  --tx:#eaeaf8; --tx2:#6e6e9a; --tx3:#35354e;
  --nb:rgba(7,7,14,0.93); --sb:#0a0a15;
  --sh:rgba(0,0,0,0.6); --inp:#13131f;
  --card-glow:rgba(99,102,241,0.05);
  --sidebar-border:rgba(255,255,255,0.055);
`;
const LIGHT_VARS = `
  --bg:#f4f5fd; --bg1:#ffffff; --bg2:#eceef9; --bg3:#e2e4f5;
  --br:rgba(0,0,0,0.07); --brh:rgba(0,0,0,0.14);
  --tx:#0a0a1a; --tx2:#44447a; --tx3:#9494bc;
  --nb:rgba(244,245,253,0.95); --sb:#ffffff;
  --sh:rgba(0,0,0,0.08); --inp:#eceef9;
  --card-glow:rgba(99,102,241,0.04);
  --sidebar-border:rgba(0,0,0,0.07);
`;

type ApiTaskRow = {
  id: string;
  title: string;
  priority?: string;
  label?: string;
  status?: string;
  estimate?: string;
  due_date?: string;
};

function mapApiTask(t: ApiTaskRow): Task {
  return {
    id: t.id,
    title: t.title,
    priority: (['urgent', 'high', 'medium', 'low'].includes(t.priority ?? '') ? t.priority : 'medium') as Priority,
    label: t.label ?? 'General',
    status: (['todo', 'wip', 'done'].includes(t.status ?? '') ? t.status : 'todo') as TaskStatus,
    estimate: t.estimate,
    dueDate: t.due_date,
  };
}

async function loadTasksFromApi(): Promise<Task[]> {
  const res = await fetch('/api/boards');
  if (!res.ok) return [];
  const d = await res.json();
  return (d.tasks ?? []).map(mapApiTask);
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy copy */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function formatChatTime(value?: string): string {
  if (!value) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function GlobalStyles({ theme }: { theme: "dark" | "light" }) {
  return (
    <style suppressHydrationWarning>{`
      @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&display=swap');

      *,*::before,*::after { box-sizing:border-box; margin:0; padding:0 }
      html { font-size:16px }

      :root {
        ${theme === "dark" ? DARK_VARS : LIGHT_VARS}
        --ac:#6366f1; --ach:#818cf8; --as:rgba(99,102,241,0.10); --ag:rgba(99,102,241,0.22);
        --gr:#10b981; --am:#f59e0b; --rd:#ef4444; --pu:#a78bfa; --ur:#f97316;
        --inv:${theme==="dark"?"#fff":"#07070e"}; --inv2:${theme==="dark"?"#07070e":"#fff"};
        --radius-sm:8px; --radius-md:12px; --radius-lg:16px; --radius-xl:22px;
        --font-display:'Geist',-apple-system,sans-serif;
        --font-body:'Geist',-apple-system,sans-serif;
        --font-mono:'Geist',-apple-system,monospace;
        --sidebar-w:236px;
        --content-max:1140px;
        --chat-max:960px;
      }

      body {
        font-family: var(--font-body);
        background:
          radial-gradient(circle at top left, rgba(99,102,241,0.10), transparent 32%),
          radial-gradient(circle at top right, rgba(168,85,247,0.08), transparent 28%),
          var(--bg);
        color: var(--tx);
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        overflow: hidden;
        height: 100vh;
        transition: background .25s, color .25s;
        letter-spacing: -0.01em;
      }

      a { text-decoration:none; color:inherit }
      button { font-family:var(--font-body); cursor:pointer; letter-spacing:-0.01em }
      textarea,input,select { font-family:var(--font-body); letter-spacing:-0.01em }

      ::-webkit-scrollbar { width:3px; height:3px }
      ::-webkit-scrollbar-track { background:transparent }
      ::-webkit-scrollbar-thumb { background:var(--br); border-radius:99px }
      ::-webkit-scrollbar-thumb:hover { background:var(--brh) }

      /* ── Keyframes ── */
      @keyframes fadeUp    { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
      @keyframes scaleIn   { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
      @keyframes pulse     { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(.5)} }
      @keyframes spin      { from{transform:rotate(0)} to{transform:rotate(360deg)} }
      @keyframes slideR    { from{transform:translateX(-12px);opacity:0} to{transform:translateX(0);opacity:1} }
      @keyframes modalIn   { from{opacity:0;transform:scale(.96) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
      @keyframes shimmer   { from{background-position:-200% 0} to{background-position:200% 0} }
      @keyframes countUp   { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }

      /* ── Utility classes ── */
      .fade-up   { animation: fadeUp .36s cubic-bezier(.22,1,.36,1) both }
      .fade-in   { animation: fadeIn .26s ease both }
      .scale-in  { animation: scaleIn .3s cubic-bezier(.22,1,.36,1) both }
      .pulse     { animation: pulse 2.4s ease-in-out infinite }
      .spin      { animation: spin .7s linear infinite }
      .slide-r   { animation: slideR .28s cubic-bezier(.22,1,.36,1) both }

      /* Stagger delays */
      .stagger > *:nth-child(1) { animation-delay:.04s }
      .stagger > *:nth-child(2) { animation-delay:.09s }
      .stagger > *:nth-child(3) { animation-delay:.14s }
      .stagger > *:nth-child(4) { animation-delay:.19s }
      .stagger > *:nth-child(5) { animation-delay:.24s }
      .stagger > *:nth-child(6) { animation-delay:.29s }

      /* ── Nav buttons ── */
      .nav-btn {
        transition: background .15s, color .15s, transform .1s, border-color .15s, box-shadow .15s;
      }
      .nav-btn:hover {
        background:rgba(99,102,241,0.08) !important;
        color:var(--tx) !important;
        border-color:rgba(99,102,241,0.18) !important;
        box-shadow:0 8px 24px rgba(0,0,0,0.08);
      }
      .nav-btn:active { transform: scale(.97) }

      /* ── Cards ── */
      .card {
        transition: border-color .18s, transform .2s, box-shadow .2s;
        position: relative;
        overflow: hidden;
      }
      .card::after {
        content:'';
        position:absolute;
        inset:0;
        background: linear-gradient(135deg, var(--card-glow), transparent 60%);
        opacity:0;
        transition:opacity .22s;
        pointer-events:none;
        border-radius:inherit;
      }
      .card:hover { border-color:var(--brh) !important; transform:translateY(-1px); box-shadow:0 12px 36px var(--sh) }
      .card:hover::after { opacity:1 }

      /* ── Task cards ── */
      .task-card { transition: border-color .15s, background .15s, transform .15s, box-shadow .15s }
      .task-card:hover { border-color:rgba(99,102,241,0.3) !important; background:var(--bg2) !important; transform:translateX(2px); box-shadow:0 2px 12px rgba(0,0,0,0.2) }

      /* ── Ghost buttons ── */
      .ghost {
        transition: background .15s, color .15s, border-color .15s, transform .1s, box-shadow .15s;
      }
      .ghost:hover {
        background:rgba(99,102,241,0.07) !important;
        border-color:rgba(99,102,241,0.20) !important;
        box-shadow:0 8px 20px rgba(0,0,0,0.06);
      }

      /* ── Primary buttons ── */
      .btn-primary {
        transition: filter .15s, transform .1s, box-shadow .15s, background .15s;
      }
      .btn-primary:hover {
        filter:brightness(1.08);
        box-shadow:0 14px 34px rgba(99,102,241,0.28);
        transform:translateY(-1px);
      }
      .btn-primary:active { transform:scale(.97) }

      /* ── Inputs ── */
      .input-focus { transition: border-color .15s, box-shadow .15s; outline: none }
      .input-focus:focus { border-color: var(--ac) !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.14) }

      .chat-input {
        outline: none !important;
        transition: border-color .15s;
      }
      .chat-input:focus,
      .chat-input:focus-visible {
        outline: none !important;
        box-shadow: none !important;
        border-color: var(--brh) !important;
      }

      /* ── Skeleton ── */
      .skeleton {
        background: linear-gradient(90deg, var(--bg2) 25%, var(--bg3) 50%, var(--bg2) 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: var(--radius-sm);
      }

      /* ── Responsive ── */
      @media(max-width:1024px) {
        .xl-hide { display:none !important }
        .main-grid-3 { grid-template-columns:1fr 1fr !important }
      }
      @media(max-width:768px) {
        .sidebar { display:none !important }
        .main-wrap { margin-left:0 !important; overflow:auto !important }
        .root-layout { height:auto !important; min-height:100vh; overflow:visible !important }
        .bottom-nav { display:flex !important }
        body { overflow:auto; height:auto }
        .main-grid-2 { grid-template-columns:1fr !important }
        .main-grid-3 { grid-template-columns:1fr !important }
        .main-grid-4 { grid-template-columns:1fr 1fr !important }
        .page-pad { padding:16px 14px 80px !important }
        .kanban-grid { overflow-x:auto; grid-template-columns:repeat(3,minmax(260px,1fr)) !important }
        .chat-sidebar { display:none !important }
        .chat-page { height:calc(100vh - 56px - 64px) !important; min-height:0 !important }
        .settings-grid { gap:10px !important }
        .settings-tabs { grid-template-columns:repeat(3,1fr) !important; gap:6px !important }
        .settings-tabs button { font-size:10.5px !important; padding:10px 6px !important }
        .settings-tabs button span:first-child { font-size:14px !important }
        .settings-panel { padding:16px !important; border-radius:11px !important }
        .settings-appearance-row { flex-direction:column !important; align-items:flex-start !important; gap:10px !important }
        .settings-appearance-row button { width:100% !important; justify-content:center !important }
        .settings-billing-row { flex-direction:column !important; align-items:flex-start !important; gap:10px !important }
        .settings-billing-row button { width:100% !important; justify-content:center !important }
        .integration-card { flex-direction:column !important; align-items:flex-start !important; gap:12px !important }
        .integration-card > div:first-child { align-self:center }
        .integration-card > div:nth-child(2) { text-align:center; width:100% }
        .integration-card button { width:100% !important; justify-content:center !important }
        .saved-grid { grid-template-columns:1fr 1fr !important }
        .autopilot-grid { grid-template-columns:1fr !important }
        .quick-ai-sub { display:none }
        .quick-ai-badge { display:none }
        .topbar-sub { display:none }
        .bottom-nav-item { min-height:52px }
        .stat-value { font-size:20px !important }
        .modal-inner { padding:16px !important; margin:12px !important; max-height:calc(100vh - 24px) !important }
        .board-input-grid { grid-template-columns:1fr !important }
      }
      @media(max-width:480px) {
        .main-grid-4 { grid-template-columns:1fr !important }
        .saved-grid { grid-template-columns:1fr !important }
        .autopilot-grid { grid-template-columns:1fr !important }
        .page-pad { padding:12px 12px 80px !important }
        .quick-ai-row { flex-wrap:wrap }
        .quick-ai-btn { width:100%; justify-content:center }
        .topbar-title { font-size:13px !important }
        .topbar-icon { width:28px !important; height:28px !important; border-radius:8px !important }
        .chat-prompts { grid-template-columns:1fr !important }
        .kanban-grid { grid-template-columns:repeat(3,minmax(240px,1fr)) !important }
        .settings-tabs { grid-template-columns:repeat(2,1fr) !important; gap:5px !important }
        .settings-tabs button { font-size:10px !important; padding:8px 4px !important }
        .settings-tabs button span:nth-child(2) { font-size:10px !important }
        .settings-panel { padding:12px !important }
        .integration-card { padding:12px 14px !important }
        .integration-card p { font-size:12px !important }
        .integration-card button { font-size:11px !important; height:30px !important }
      }

      /* ── Focus visible ── */
      :focus-visible {
        outline: 2px solid var(--ac);
        outline-offset: 2px;
        border-radius: var(--radius-sm);
      }

      /* ── Quick AI Bar ── */
      .quick-ai-bar {
        border-radius: var(--radius-md);
        border: 1px solid var(--br);
        background: linear-gradient(180deg, rgba(255,255,255,0.03), transparent 30%), var(--bg1);
        padding: 15px 18px;
        box-shadow: 0 14px 40px rgba(0,0,0,0.10);
      }
      .quick-ai-header {
        display: flex;
        align-items: center;
        gap: 9px;
        margin-bottom: 11px;
      }
      .quick-ai-icon {
        width: 28px;
        height: 28px;
        border-radius: 8px;
        background: linear-gradient(135deg, var(--ac), var(--pu));
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        flex-shrink: 0;
        box-shadow: 0 2px 8px rgba(99,102,241,0.35);
      }
      .quick-ai-title {
        font-size: 13px;
        font-weight: 700;
        color: var(--tx);
        font-family: var(--font-display);
        flex-shrink: 0;
        letter-spacing: -0.02em;
      }
      .quick-ai-sub { font-size: 11px; color: var(--tx3) }
      .quick-ai-badge {
        margin-left: auto;
        font-size: 10px;
        color: var(--ac);
        padding: 2px 9px;
        border-radius: 99px;
        background: var(--as);
        border: 1px solid var(--ag);
        font-weight: 600;
        flex-shrink: 0;
        font-family: var(--font-mono);
      }
      .quick-ai-row { display: flex; align-items: center; gap: 8px }
      .quick-ai-input {
        flex: 1;
        min-width: 0;
        height: 42px;
        background: var(--inp);
        border: 1px solid var(--br);
        border-radius: var(--radius-sm);
        padding: 0 14px;
        font-size: 13.5px;
        color: var(--tx);
        font-family: var(--font-body);
        outline: none;
        transition: border-color .15s, box-shadow .15s;
        letter-spacing: -0.01em;
      }
      .quick-ai-input:focus {
        border-color: var(--ac);
        box-shadow: 0 0 0 3px rgba(99,102,241,0.14);
      }
      .quick-ai-input::placeholder { color: var(--tx3) }
      .quick-ai-btn {
        height: 42px;
        padding: 0 20px;
        border-radius: var(--radius-sm);
        border: none;
        background: linear-gradient(135deg, var(--ac), var(--pu));
        color: #fff;
        font-size: 13px;
        font-weight: 700;
        font-family: var(--font-display);
        display: flex;
        align-items: center;
        gap: 7px;
        flex-shrink: 0;
        cursor: pointer;
        transition: filter .15s, box-shadow .15s;
        letter-spacing: -0.01em;
        box-shadow: 0 2px 12px rgba(99,102,241,0.3);
      }
      .quick-ai-btn:hover { filter: brightness(1.1); box-shadow: 0 4px 18px rgba(99,102,241,0.42) }
      .quick-ai-btn:disabled { cursor: not-allowed; opacity: .5 }

      /* ── Section labels ── */
      .nav-section-label {
        font-size: 9.5px;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--tx3);
        padding: 0 12px;
        margin: 14px 0 5px;
        font-family: var(--font-mono);
      }
    `}</style>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TASK CARD
═══════════════════════════════════════════════════════════════════════════ */
function TaskCard({
  task, onStatusChange, compact = false,
}: {
  task: Task;
  onStatusChange?: (id: string, s: TaskStatus) => void;
  compact?: boolean;
}) {
  return (
    <div className="task-card" style={{
      borderRadius: 12, border: "1px solid var(--br)", background: "var(--bg1)",
      padding: compact ? "8px 11px" : "13px 15px", marginBottom: 8, cursor: "pointer",
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:9,
        marginBottom: compact ? 0 : 9 }}>
        <p style={{ fontSize: compact ? 11.5 : 13, color:"var(--tx)", fontWeight:500,
          lineHeight:1.5, flex:1, letterSpacing:"-0.01em" }}>{task.title}</p>
        <PriBadge p={task.priority}/>
      </div>
      {!compact && (
        <div style={{ display:"flex", alignItems:"center", gap:5, flexWrap:"wrap", marginBottom:10 }}>
          <span style={{ fontSize:10, padding:"2px 8px", borderRadius:99, background:"var(--as)",
            color:"var(--ac)", fontWeight:600, fontFamily:"var(--font-mono)", border:"1px solid var(--ag)" }}>{task.label}</span>
          {task.dueDate && (
            <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:10.5, color:"var(--tx3)" }}>
              <Icons.Calendar size={9}/>{task.dueDate}
            </span>
          )}
          {task.estimate && (
            <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:10.5, color:"var(--tx3)" }}>
              <Icons.Clock size={9}/>{task.estimate}
            </span>
          )}
        </div>
      )}
      {!compact && (
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          {onStatusChange && task.status !== "done" && (
            <button
              onClick={e => { e.stopPropagation(); onStatusChange(task.id, task.status === "todo" ? "wip" : "done"); }}
              className="ghost"
              style={{ fontSize:10.5, padding:"3px 10px", borderRadius:99, border:"1px solid var(--br)",
                background:"transparent", color:"var(--tx3)", display:"flex", alignItems:"center", gap:4 }}>
              <Icons.Check size={10}/> {task.status === "todo" ? "Start" : "Done"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE: OVERVIEW
═══════════════════════════════════════════════════════════════════════════ */
function PageOverview() {
  const { tasks, setTasks, savedBoards, navigate, dailyGoal, weeklyGoal, user, isLoading, setBoardView } = useApp();
  const done  = tasks.filter(t => t.status === "done").length;
  const total = tasks.length;
  const wip   = tasks.filter(t => t.status === "wip").length;
  const healthScore = total === 0 ? 100 :
    Math.round(Math.max(0, 100 - (tasks.filter(t => t.priority === "urgent" || t.priority === "high").length / Math.max(total, 1)) * 42));

  const [quickInput, setQuickInput] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  })();

  const displayName = user?.full_name?.split(" ")[0] ?? "there";

  const handleQuickInput = async () => {
    if (!quickInput.trim()) return;
    setAddLoading(true);
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: quickInput.trim() }),
      });
      if (!res.ok) return;
      const loaded = await loadTasksFromApi();
      if (loaded.length > 0) setTasks(loaded);
      fetch('/api/sync-task-stats', { method: 'POST' }).catch(() => {});
      setQuickInput('');
      setBoardView('kanban');
      navigate('board');
    } catch {
      /* allow retry */
    } finally {
      setAddLoading(false);
    }
  };

  const [weeklyDone, setWeeklyDone] = useState(0);
  useEffect(() => {
    fetch("/api/task-activity").then(r => r.json()).then(d => {
      if (Array.isArray(d) && d.length > 0) {
        setWeeklyDone(d.slice(-7).reduce((s: number, i: { value: number }) => s + i.value, 0));
      }
    }).catch(() => {});
  }, []);

  const urgentCount  = tasks.filter(t => t.priority === "urgent").length;
  const highCount    = tasks.filter(t => t.priority === "high").length;
  const mediumCount  = tasks.filter(t => t.priority === "medium").length;
  const lowCount     = tasks.filter(t => t.priority === "low").length;

  const boardsToday   = user?.boards_used_today ?? 0;
  const aiUsesMonth   = user?.ai_uses_this_month ?? 0;
  const boardsLimit   = user?.plan === "pro" ? 50 : 10;
  const aiLimit       = user?.plan === "pro" ? 1500 : 300;

  const statCards = [
    { label:"Boards Today",  value:`${boardsToday}/${boardsLimit}`, sub:`${boardsLimit - boardsToday} remaining`, icon:<Icons.Board size={13}/>, prog: boardsToday / boardsLimit * 100 },
    { label:"AI This Month", value:`${aiUsesMonth}/${aiLimit}`, sub:`${aiLimit - aiUsesMonth} remaining`, icon:<Icons.Autopilot size={13}/>, color:"var(--pu)" },
    { label:"Tasks Total",   value:String(total), sub:`${done} done · ${wip} in progress`, icon:<Icons.Target size={13}/>, color: done === total && total > 0 ? "var(--gr)" : undefined },
    { label:"Plan",          value: user?.plan === "pro" ? "Pro" : "Free", sub: user?.plan === "pro" ? "All features unlocked" : "$9/mo → Pro", icon:<Icons.Crown size={13}/>, color:"var(--am)" },
  ];

  return (
    <div className="fade-up page-pad" style={{ padding:"28px 36px", overflowY:"auto", height:"100%",
      display:"flex", flexDirection:"column", gap:22, maxWidth:"calc(var(--content-max) + 80px)", margin:"0 auto", width:"100%" }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
        <div>
          {isLoading
            ? <><Skeleton w={220} h={24} style={{ marginBottom:8 }}/><Skeleton w={160} h={14}/></>
            : <>
                <h1 style={{ fontSize:22, fontWeight:800, letterSpacing:"-0.035em", color:"var(--tx)",
                  marginBottom:4, fontFamily:"var(--font-display)" }}>
                  {greeting}, {displayName} 👋
                </h1>
                <p style={{ fontSize:13, color:"var(--tx2)" }}>Here's your workload snapshot</p>
              </>
          }
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div className="pulse" style={{ width:6, height:6, borderRadius:"50%", background:"var(--gr)" }}/>
          <span style={{ fontSize:12, color:"var(--gr)", fontWeight:600 }}>All systems active</span>
        </div>
      </div>

      {/* Quick AI input */}
      <div className="quick-ai-bar">
        <div className="quick-ai-header">
          <div className="quick-ai-icon"><Icons.Zap size={13}/></div>
          <span className="quick-ai-title">Quick AI Extract</span>
          <span className="quick-ai-sub">kanbi paste any text, AI extracts tasks instantly</span>
          <span className="quick-ai-badge">→ Board</span>
        </div>
        <div className="quick-ai-row">
          <input
            value={quickInput}
            onChange={e => setQuickInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleQuickInput()}
            placeholder="Paste a task, email, or note to extract instantly..."
            className="quick-ai-input"
          />
          <button
            onClick={handleQuickInput}
            disabled={!quickInput.trim() || addLoading}
            className="quick-ai-btn"
            style={{ opacity: !quickInput.trim() ? .45 : 1 }}
          >
            {addLoading
              ? <div className="spin" style={{ width:12, height:12, borderRadius:"50%", border:"2px solid rgba(255,255,255,.3)", borderTopColor:"#fff" }}/>
              : <Icons.Zap size={12}/>
            }
            Extract
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        {[
          { label:"New Task", icon:<Icons.Plus size={16}/>, action:"board", color:"var(--ac)" },
          { label:"View Board", icon:<Icons.Layers size={16}/>, action:"board", color:"var(--pu)" },
          { label:"AI Chat", icon:<Icons.Zap size={16}/>, action:"chat", color:"var(--am)" },
          { label:"Settings", icon:<Icons.Settings size={16}/>, action:"settings", color:"var(--gr)" },
        ].map(a => (
          <button key={a.label}
            onClick={() => navigate(a.action as any)}
            style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10,
              padding:"18px 16px", borderRadius:13, background:"var(--bg1)", border:"1px solid var(--br)",
              color:"var(--tx2)", fontSize:12, fontWeight:600, cursor:"pointer",
              transition:"all .2s ease" }}
            onMouseOver={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = (a as any).color;
              (e.currentTarget as HTMLButtonElement).style.background = "var(--bg2)";
              (e.currentTarget as HTMLButtonElement).style.color = (a as any).color;
            }}
            onMouseOut={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--br)";
              (e.currentTarget as HTMLButtonElement).style.background = "var(--bg1)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--tx2)";
            }}>
            <div style={{ color:(a as any).color, display:"flex", alignItems:"center", justifyContent:"center" }}>
              {a.icon}
            </div>
            {a.label}
          </button>
        ))}
      </div>


      <div className="main-grid-4 stagger" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        {statCards.map((s, i) => (
          <div key={s.label} className="card fade-up"
            style={{ borderRadius:13, border:"1px solid var(--br)", background:"var(--bg1)", padding:"16px 18px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:11 }}>
              <span style={{ fontSize:11, color:"var(--tx2)", fontWeight:600, letterSpacing:"0.01em" }}>{s.label}</span>
              <span style={{ color:"var(--tx3)" }}>{s.icon}</span>
            </div>
            {isLoading
              ? <Skeleton w="60%" h={28} style={{ marginBottom:6 }}/>
              : <div className="stat-value" style={{ fontSize:25, fontWeight:800, letterSpacing:"-0.045em",
                  color: s.color ?? "var(--tx)", lineHeight:1, marginBottom:4,
                  fontFamily:"var(--font-display)", animation:"countUp .5s ease both" }}>
                  {s.value}
                </div>
            }
            <p style={{ fontSize:10.5, color:"var(--tx3)" }}>{s.sub}</p>
            {(s as { trend?: string }).trend && <p style={{ fontSize:10.5, color:"var(--gr)", marginTop:3, fontWeight:600 }}>{(s as { trend?: string }).trend}</p>}
            {s.prog !== undefined && (
              <div style={{ marginTop:10 }}>
                <PBar value={s.prog} h={3} color="var(--ac)"/>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Health + Goals + Quick Stats */}
      <div className="main-grid-3" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
        {/* Workload Health */}
        <div className="card" style={{ borderRadius:13, border:"1px solid var(--br)", background:"var(--bg1)", padding:20 }}>
          <h3 style={{ fontSize:13, fontWeight:600, color:"var(--tx2)", marginBottom:18,
            fontFamily:"var(--font-display)", letterSpacing:"0.01em" }}>Workload Health</h3>

          <div style={{ display:"flex", alignItems:"center", gap:20, marginBottom:18 }}>
            <HealthRing score={healthScore}/>
            <div style={{ flex:1, display:"flex", flexDirection:"column", gap:12 }}>
              {[
                { l:"Total",     v:String(total) },
                { l:"Done",      v:String(done) },
                { l:"In Progress", v:String(tasks.filter(t=>t.status==="wip").length) },
              ].map(s => (
                <div key={s.l} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:11, color:"var(--tx3)" }}>{s.l}</span>
                  <span style={{ fontSize:12, fontWeight:600, color:"var(--tx)", fontFamily:"var(--font-mono)" }}>{s.v}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ height:1, background:"var(--br)", marginBottom:12 }}/>
          <p style={{ fontSize:11, color:"var(--tx3)", lineHeight:1.6 }}>
            {healthScore >= 75
              ? "Workload is balanced."
              : healthScore >= 50
              ? "Some high-priority tasks need attention."
              : "Overloaded  consider deferring low-priority tasks."}
          </p>
        </div>

        {/* Goals */}
        <div className="card" style={{ borderRadius:13, border:"1px solid var(--br)", background:"var(--bg1)", padding:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <h3 style={{ fontSize:13, fontWeight:700, color:"var(--tx)", fontFamily:"var(--font-display)" }}>Your Goals</h3>
            <button className="ghost" style={{ fontSize:11, color:"var(--tx2)", background:"transparent",
              border:"none", padding:"3px 8px", borderRadius:6 }}>Edit</button>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {[
              { label:"Daily Tasks",       current:done,  goal:dailyGoal,  color:"var(--ac)" },
              { label:"Weekly Tasks",      current:weeklyDone,    goal:weeklyGoal, color:"var(--gr)" },
              { label:"Completion Rate",   current:total > 0 ? Math.round((done/total)*100) : 0, goal:100, color:"var(--pu)", suffix:"%" },
            ].map(g => (
              <div key={g.label}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ fontSize:12, color:"var(--tx2)" }}>{g.label}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:g.color, fontFamily:"var(--font-mono)" }}>
                    {g.current}/{g.goal}{(g as any).suffix ?? ""}
                  </span>
                </div>
                <PBar value={(g.current / g.goal) * 100} color={g.color} h={5}/>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Overview */}
        <div className="card" style={{ borderRadius:13, border:"1px solid var(--br)", background:"var(--bg1)", padding:20 }}>
          <h3 style={{ fontSize:13, fontWeight:700, color:"var(--tx)", fontFamily:"var(--font-display)",
            marginBottom:16 }}>Priority Breakdown</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {[
              { label:"Urgent", count:urgentCount, color:"var(--ur)" },
              { label:"High", count:highCount, color:"var(--rd)" },
              { label:"Medium", count:mediumCount, color:"var(--am)" },
              { label:"Low", count:lowCount, color:"var(--tx3)" },
            ].map(p => (
              <div key={p.label} style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:p.color }}/>
                  <span style={{ fontSize:12, color:"var(--tx2)" }}>{p.label}</span>
                </div>
                <span style={{ fontSize:12, fontWeight:700, color:p.color, fontFamily:"var(--font-mono)" }}>{p.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent Boards ── */}
      {savedBoards.length > 0 && (
        <div className="fade-up" style={{ animationDelay: ".25s" }}>
          {/* Section header */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div>
              <h2 style={{ fontSize:16, fontWeight:800, color:"var(--tx)", fontFamily:"var(--font-display)",
                letterSpacing:"-0.03em", marginBottom:3 }}>Recent Boards</h2>
              <p style={{ fontSize:11.5, color:"var(--tx3)" }}>Jump back into your latest work</p>
            </div>
            <button onClick={() => navigate("saved")} className="ghost"
              style={{ fontSize:12, color:"var(--ac)", background:"var(--as)", border:"1px solid var(--ag)",
                padding:"6px 14px", borderRadius:8, display:"flex", alignItems:"center", gap:6,
                fontWeight:600, transition:"all .2s" }}
              onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(99,102,241,0.18)"; }}
              onMouseOut={e  => { (e.currentTarget as HTMLButtonElement).style.background = "var(--as)"; }}>
              View all <Icons.ArrowR size={12}/>
            </button>
          </div>

          {/* Board cards grid */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14 }}
            className="saved-grid">
            {savedBoards.slice(0, 4).map((b, idx) => {
              const ACCENTS = ["var(--ac)","var(--pu)","var(--gr)","var(--am)"] as const;
              const BGSOF  = ["rgba(99,102,241,0.08)","rgba(167,139,250,0.08)","rgba(16,185,129,0.08)","rgba(245,158,11,0.08)"] as const;
              const BORDER = ["rgba(99,102,241,0.22)","rgba(167,139,250,0.22)","rgba(16,185,129,0.22)","rgba(245,158,11,0.22)"] as const;
              const accent = ACCENTS[idx % 4];
              const donePct = b.tasks.length > 0
                ? Math.round((b.tasks.filter(t => t.status === "done").length / b.tasks.length) * 100)
                : 0;
              return (
                <div key={b.id}
                  onClick={() => { setTasks(b.tasks); setBoardView("kanban"); navigate("board"); }}
                  style={{
                    borderRadius:16, border:"1px solid var(--br)", background:"var(--bg1)",
                    padding:20, cursor:"pointer", position:"relative", overflow:"hidden",
                    transition:"border-color .2s, transform .2s, box-shadow .2s",
                  }}
                  onMouseOver={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.borderColor = BORDER[idx % 4] ?? '';
                    el.style.transform = "translateY(-2px)";
                    el.style.boxShadow = `0 8px 32px rgba(0,0,0,0.18)`;
                  }}
                  onMouseOut={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.borderColor = "var(--br)";
                    el.style.transform = "translateY(0)";
                    el.style.boxShadow = "none";
                  }}>

                  {/* Top accent bar */}
                  <div style={{
                    position:"absolute", top:0, left:0, right:0, height:3,
                    background:`linear-gradient(90deg, ${accent}, transparent 80%)`,
                    borderRadius:"16px 16px 0 0",
                  }}/>

                  {/* Icon + folder badge */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                    <div style={{
                      width:42, height:42, borderRadius:11,
                      background:BGSOF[idx % 4], border:`1px solid ${BORDER[idx % 4]}`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      color:accent, flexShrink:0,
                    }}>
                      <Icons.Layers size={17}/>
                    </div>
                    <span style={{
                      fontSize:10, padding:"3px 9px", borderRadius:100,
                      background:"var(--bg2)", border:"1px solid var(--br)",
                      color:"var(--tx3)", fontFamily:"var(--font-mono)", fontWeight:600,
                    }}>{b.folder}</span>
                  </div>

                  {/* Board name */}
                  <p style={{
                    fontSize:14, fontWeight:700, color:"var(--tx)", marginBottom:6,
                    fontFamily:"var(--font-display)", letterSpacing:"-0.02em",
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                  }}>{b.name}</p>

                  {/* Meta row */}
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                    <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color:"var(--tx3)" }}>
                      <div style={{ width:5, height:5, borderRadius:"50%", background:accent }}/>
                      {b.taskCount} tasks
                    </span>
                    <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color:"var(--tx3)" }}>
                      <Icons.Clock size={10}/>{b.lastEdited}
                    </span>
                  </div>

                  {/* Progress */}
                  <div style={{ marginBottom:14 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                      <span style={{ fontSize:10.5, color:"var(--tx3)" }}>Completion</span>
                      <span style={{ fontSize:10.5, fontWeight:700, color:accent, fontFamily:"var(--font-mono)" }}>{donePct}%</span>
                    </div>
                    <PBar value={donePct} h={4} color={accent}/>
                  </div>

                  {/* CTA */}
                  <div style={{
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    paddingTop:12, borderTop:"1px solid var(--br)",
                  }}>
                    <span style={{ fontSize:11, color:"var(--tx3)" }}>
                      {b.tasks.filter(t => t.status === "done").length}/{b.taskCount} done
                    </span>
                    <span style={{
                      fontSize:11.5, fontWeight:700, color:accent,
                      display:"flex", alignItems:"center", gap:4,
                    }}>
                      Open <Icons.ArrowR size={11}/>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE: BOARD
═══════════════════════════════════════════════════════════════════════════ */
function PageBoard() {
  const { tasks, setTasks, savedBoards, setSavedBoards, boardView, setBoardView } = useApp();
  const [inputMode, setInputMode] = useState<InputMode>("paste");
  const [inputText, setInputText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const overloaded = tasks.filter(t => t.status !== "done" && (t.priority === "urgent" || t.priority === "high")).length >= 5;

  const syncTaskStats = async () => {
    try {
      await fetch('/api/sync-task-stats', { method: 'POST' });
    } catch {
      // Fire-and-forget: sync errors don't block UI
    }
  };

  const handlePdfUpload = async (file: File) => {
    if (!file) return;
    setExtracting(true);
    setExtractError("");
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/parse-pdf', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) {
        setExtractError(data.error ?? 'Failed to parse PDF. Please try again.');
        return;
      }
      const parsed = (data.tasks ?? []) as { task?: string; title?: string; priority?: string; estimate?: string; deadline?: string }[];
      const titles = parsed.map(t => (t.title ?? t.task ?? '').trim()).filter(t => t.length > 2);
      if (titles.length === 0) {
        setExtractError('No tasks found in this PDF.');
        return;
      }
      const extractRes = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: titles.map(t => `- ${t}`).join('\n') }),
      });
      if (!extractRes.ok) {
        const err = await extractRes.json().catch(() => ({}));
        setExtractError(err.error ?? 'Failed to save extracted tasks.');
        return;
      }
      const loaded = await loadTasksFromApi();
      if (loaded.length > 0) setTasks(loaded);
      syncTaskStats();
      setBoardView('kanban');
    } catch {
      setExtractError('Network error while processing PDF.');
    } finally {
      setExtracting(false);
    }
  };

  const inputModes = [
    { key:"paste"    as InputMode, label:"Paste",     icon:<Icons.Paste size={12}/> },
    { key:"pdf"      as InputMode, label:"PDF",       icon:<Icons.Pdf size={12}/>   },
    { key:"template" as InputMode, label:"Templates", icon:<Icons.Template size={12}/> },
  ];

  const handleExtract = async () => {
    if (!inputText.trim()) return;
    setExtracting(true);
    setExtractError("");
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setExtractError(data.error ?? 'Failed to extract tasks. Please try again.');
        return;
      }
      const loaded = await loadTasksFromApi();
      if (loaded.length > 0) setTasks(loaded);
      syncTaskStats();
      setInputText('');
      setBoardView('kanban');
    } catch {
      setExtractError('Network error. Check your connection and try again.');
    } finally {
      setExtracting(false);
    }
  };

  const updateTaskStatus = async (id: string, s: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: s } : t));
    try {
      await fetch(`/api/boards/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: s }),
      });
    } catch { /* non-blocking */ }
    syncTaskStats();
  };

  const handleSaveBoard = async () => {
    if (tasks.length === 0) return;
    const name = `Board · ${new Date().toLocaleDateString()}`;
    try {
      const res = await fetch('/api/boards/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: name, tasks, category: 'personal', icon: 'board' }),
      });
      const data = await res.json();
      if (res.ok) {
        const nb: SavedBoard = {
          id: data.id ?? Date.now().toString(),
          name, taskCount: tasks.length, folder: "Personal",
          lastEdited: "Just now", tasks: [...tasks],
        };
        setSavedBoards(prev => [nb, ...prev]);
      }
    } catch {
      // fallback: save locally
      const nb: SavedBoard = {
        id: Date.now().toString(), name,
        taskCount: tasks.length, folder: "Personal",
        lastEdited: "Just now", tasks: [...tasks],
      };
      setSavedBoards(prev => [nb, ...prev]);
    }
  };

  const cols: [TaskStatus, string, string][] = [
    ["todo", "To Do",       "var(--ac)"],
    ["wip",  "In Progress", "var(--am)"],
    ["done", "Done",        "var(--gr)"],
  ];
  const kanbanTasks = (s: TaskStatus) => tasks.filter(t => t.status === s);

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
      {/* Overload warning bar */}
      {overloaded && boardView === "kanban" && (
        <div className="slide-r" style={{ display:"flex", alignItems:"center", gap:9, padding:"9px 26px",
          background:"rgba(239,68,68,0.07)", borderBottom:"1px solid rgba(239,68,68,0.18)" }}>
          <Icons.AlertTri size={13} style={{ color:"var(--rd)", flexShrink:0 }}/>
          <span style={{ fontSize:12, color:"var(--rd)", fontWeight:500 }}>
            Autopilot warning: High task load detected. Consider completing or deferring tasks before adding more.
          </span>
        </div>
      )}

      {boardView === "input" ? (
        /* ── Input view ── */
        <div className="page-pad" style={{ padding:"28px 30px", overflowY:"auto", flex:1 }}>
          <div style={{ maxWidth:"var(--content-max)", margin:"0 auto", width:"100%" }}>
            <div style={{ textAlign:"center", marginBottom:28 }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"5px 14px",
                borderRadius:100, background:"var(--as)", border:"1px solid var(--ag)",
                marginBottom:16, color:"var(--ac)", fontSize:11.5, fontWeight:600 }}>
                <Icons.Sparkle size={11}/> AI-Powered Extraction
              </div>
              <h1 style={{ fontSize:26, fontWeight:800, letterSpacing:"-0.04em", color:"var(--tx)",
                marginBottom:8, fontFamily:"var(--font-display)" }}>
                Transform Notes Into Action
              </h1>
              <p style={{ fontSize:13.5, color:"var(--tx2)" }}>
                Paste your messy notes and let Kanbi AI organize them into tasks
              </p>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 260px", gap:18 }} className="main-grid-2 board-input-grid">
              {/* Input card */}
              <div style={{ borderRadius:14, border:"1px solid var(--br)", background:"var(--bg1)", padding:20 }}>
                {/* Mode tabs */}
                <div style={{ display:"flex", gap:3, marginBottom:16, background:"var(--bg2)",
                  borderRadius:10, padding:4 }}>
                  {inputModes.map(m => (
                    <button key={m.key} onClick={() => setInputMode(m.key)}
                      style={{ flex:1, padding:"7px 6px", borderRadius:8, border:"none",
                        background: inputMode === m.key ? "var(--bg1)" : "transparent",
                        color: inputMode === m.key ? "var(--tx)" : "var(--tx3)",
                        fontSize:11.5, fontWeight:inputMode === m.key ? 600 : 400,
                        cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                        gap:5, transition:"all .15s",
                        boxShadow: inputMode === m.key ? "0 1px 4px rgba(0,0,0,.2)" : "none" }}>
                      {m.icon}{m.label}
                    </button>
                  ))}
                </div>

                {inputMode === "paste" && (
                  <>
                    <p style={{ fontSize:11, color:"var(--tx3)", marginBottom:8 }}>
                      Paste emails, Slack messages, notes kanbi anything works
                    </p>
                    <textarea
                      value={inputText} onChange={e => setInputText(e.target.value)} rows={9}
                      placeholder={"What's on your mind?\n\n- Fix login bug\n- Review copy\n- Call John\n- Send invoice to Acme"}
                      className="input-focus"
                      style={{ width:"100%", background:"var(--inp)", border:"1px solid var(--br)",
                        borderRadius:10, padding:"12px 14px", fontSize:13, color:"var(--tx)",
                        resize:"none", lineHeight:1.65, height:220, minHeight:220, maxHeight:220,
                        overflowY:"auto", boxSizing:"border-box" }}/>
                    <p style={{ fontSize:10, color:"var(--tx3)", marginTop:8 }}>
                      AI-powered extraction · Smart deadline detection · Privacy first
                    </p>
                  </>
                )}
                {inputMode === "pdf" && (
                  <div style={{ border:"2px dashed var(--br)", borderRadius:12, padding:"50px 24px",
                    textAlign:"center", cursor:"pointer", transition:"all .15s" }}
                    onClick={() => pdfInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLDivElement).style.borderColor = "var(--ac)"; (e.currentTarget as HTMLDivElement).style.background = "var(--as)"; }}
                    onDragLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--br)"; (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                    onDrop={e => { e.preventDefault(); (e.currentTarget as HTMLDivElement).style.borderColor = "var(--br)"; (e.currentTarget as HTMLDivElement).style.background = "transparent"; const f = e.dataTransfer.files[0]; if (f) handlePdfUpload(f); }}
                    onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--ac)"; (e.currentTarget as HTMLDivElement).style.background = "var(--as)"; }}
                    onMouseOut={e =>  { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--br)"; (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}>
                    <input ref={pdfInputRef} type="file" accept="application/pdf" style={{ display:"none" }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) handlePdfUpload(f); e.target.value = ""; }}/>
                    <Icons.Upload size={30} style={{ color:"var(--tx3)", display:"block", margin:"0 auto 14px" }}/>
                    <p style={{ fontSize:13.5, color:"var(--tx2)", marginBottom:4, fontWeight:500 }}>Drop your PDF or click to browse</p>
                    <p style={{ fontSize:11, color:"var(--tx3)" }}>PDF up to 5MB</p>
                  </div>
                )}
                {inputMode === "template" && (
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9 }}>
                    {[
                      {
                        label: "Daily Standup",
                        text: `# Daily Standup – ${new Date().toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'})}\n\n## Yesterday\n- Finished API integration for user auth\n- Reviewed PR #42 and left comments\n- Fixed bug in payment flow\n\n## Today\n- Implement dashboard analytics charts\n- Write unit tests for auth module\n- Sync with design team on new UI mockups\n- Deploy staging build\n\n## Blockers\n- Waiting on backend team for API docs\n- Need design approval before starting new feature`,
                      },
                      {
                        label: "Sprint Planning",
                        text: `# Sprint Planning – Sprint 14\n\n## Sprint Goal\nShip user onboarding flow and fix critical billing bugs\n\n## Backlog Items\n- Build onboarding wizard (3 steps: profile, preferences, first board)\n- Fix Stripe webhook not firing on subscription renewal\n- Add email verification resend button\n- Improve mobile responsiveness on dashboard\n- Write API documentation for v2 endpoints\n- Set up error monitoring with Sentry\n- Performance audit and lazy-load heavy components\n- Add CSV export for board data`,
                      },
                      {
                        label: "Client Project",
                        text: `# Client Project – Website Redesign\n\n## Discovery Phase\n- Conduct stakeholder interviews (CEO, Marketing, Sales)\n- Audit existing site: performance, SEO, conversion rates\n- Competitor analysis – review 5 competitor sites\n- Define target audience personas\n\n## Design Phase\n- Create wireframes for homepage and key landing pages\n- Design component library in Figma\n- Get client approval on design direction\n- Build interactive prototype for user testing\n\n## Development Phase\n- Set up Next.js project with CMS integration\n- Implement responsive design across all breakpoints\n- Integrate analytics and heatmap tracking\n- QA testing across browsers and devices\n- Client review and feedback round\n- Final launch and handoff`,
                      },
                      {
                        label: "Content Calendar",
                        text: `# Content Calendar – Q1 Campaign\n\n## Blog Posts\n- Write "10 productivity hacks for remote teams" (due Friday)\n- Draft case study: how Acme Corp saved 20hrs/week\n- Update SEO meta for top 5 landing pages\n- Research keywords for new product category\n\n## Social Media\n- Create 3 LinkedIn posts about product launch\n- Design 5 Instagram carousel graphics\n- Schedule Twitter thread on industry trends\n- Respond to all comments from last week's posts\n\n## Email\n- Write monthly newsletter (500 subscribers)\n- Set up drip campaign for new signups (5 emails)\n- A/B test subject lines for re-engagement campaign\n\n## Video\n- Record product demo walkthrough (5 min)\n- Edit and caption YouTube tutorial`,
                      },
                      {
                        label: "Bug Tracker",
                        text: `# Bug Tracker – Release v2.4\n\n## Critical (P0)\n- App crashes on iOS 17 when opening notifications\n- Payment fails silently when card is declined – no error shown\n- Data loss: board state not saved after browser refresh\n\n## High Priority (P1)\n- Login with Google fails for users with 2FA enabled\n- Dashboard charts show wrong date range on first load\n- File upload hangs at 99% for files over 10MB\n\n## Medium Priority (P2)\n- Dark mode toggle resets on page navigation\n- Search results don't update when filters change\n- Email notifications sent twice for same event\n- Tooltip overlaps button on mobile screens\n\n## Low Priority (P3)\n- Typo in onboarding step 2 copy\n- Footer links open in same tab instead of new tab`,
                      },
                      {
                        label: "Meeting Notes",
                        text: `# Meeting Notes – Product Review\nDate: ${new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}\nAttendees: Product, Engineering, Design, Marketing\n\n## Decisions Made\n- Launch date confirmed for March 15th\n- Drop feature X from v1 scope, move to v1.1\n- Pricing: keep free tier at 10 uses/day\n\n## Action Items\n- PM: Update roadmap and share with stakeholders by EOD\n- Engineering: Finalize API contracts and share docs\n- Design: Deliver final assets to dev by Wednesday\n- Marketing: Prepare launch announcement email draft\n- All: Review and sign off on QA checklist before Thursday\n\n## Open Questions\n- Do we need legal review for new data retention policy?\n- Who owns customer support during launch week?`,
                      },
                    ].map(t => (
                      <button key={t.label}
                        onClick={() => { setInputText(t.text); setInputMode("paste"); }}
                        className="ghost"
                        style={{ padding:"14px 13px", borderRadius:9, border:"1px solid var(--br)",
                          background:"var(--bg2)", color:"var(--tx2)", fontSize:12, fontWeight:500,
                          textAlign:"left", cursor:"pointer", transition:"all .15s" }}
                        onMouseOver={e => { (e.currentTarget).style.borderColor = "var(--ac)"; (e.currentTarget).style.color = "var(--tx)"; }}
                        onMouseOut={e =>  { (e.currentTarget).style.borderColor = "var(--br)";  (e.currentTarget).style.color = "var(--tx2)"; }}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                )}

                {(inputMode === "paste" || inputMode === "pdf") && (
                  <button onClick={handleExtract} disabled={!inputText.trim() || extracting}
                    className="btn-primary"
                    style={{ width:"100%", height:42, marginTop:14, borderRadius:10,
                      background: inputText.trim() ? "var(--ac)" : "var(--bg3)",
                      border: `1px solid ${inputText.trim() ? "var(--ac)" : "var(--br)"}`,
                      color: inputText.trim() ? "#fff" : "var(--tx3)",
                      fontSize:13, fontWeight:700, display:"flex", alignItems:"center",
                      justifyContent:"center", gap:8,
                      cursor: inputText.trim() ? "pointer" : "not-allowed" }}>
                    {extracting
                      ? <><div className="spin" style={{ width:14, height:14, borderRadius:"50%",
                          border:"2px solid rgba(255,255,255,.3)", borderTopColor:"#fff" }}/> Extracting tasks...</>
                      : <><Icons.Autopilot size={14}/> Turn This Into Tasks</>
                    }
                  </button>
                )}
                {extractError && (
                  <p style={{ fontSize:12, color:"var(--rd)", marginTop:10, lineHeight:1.5 }}>
                    {extractError}
                  </p>
                )}
              </div>

              {/* Progress panel */}
              <div style={{ display:"flex", flexDirection:"column", gap:11 }}>
                <div style={{ borderRadius:12, border:"1px solid var(--br)", background:"var(--bg1)", padding:17 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                    <Icons.Target size={13} style={{ color:"var(--ac)" }}/>
                    <span style={{ fontSize:13, fontWeight:700, color:"var(--tx)", fontFamily:"var(--font-display)" }}>Progress</span>
                  </div>
                  <div style={{ marginBottom:13 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                      <span style={{ fontSize:11, color:"var(--tx2)" }}>Completion</span>
                      <span style={{ fontSize:11, fontWeight:700, color:"var(--tx)", fontFamily:"var(--font-mono)" }}>
                        {tasks.length > 0 ? Math.round((tasks.filter(t=>t.status==="done").length / tasks.length)*100) : 0}%
                      </span>
                    </div>
                    <PBar value={tasks.length > 0 ? (tasks.filter(t=>t.status==="done").length/tasks.length)*100 : 0} h={5}/>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                    {[
                      { l:"To Do",   v:tasks.filter(t=>t.status==="todo").length  },
                      { l:"Working", v:tasks.filter(t=>t.status==="wip").length   },
                      { l:"Done",    v:tasks.filter(t=>t.status==="done").length  },
                    ].map(s => (
                      <div key={s.l} style={{ textAlign:"center", padding:"10px 5px", borderRadius:8,
                        background:"var(--bg2)", border:"1px solid var(--br)" }}>
                        <p style={{ fontSize:18, fontWeight:800, color:"var(--tx)", fontFamily:"var(--font-display)" }}>{s.v}</p>
                        <p style={{ fontSize:9.5, color:"var(--tx3)", marginTop:2 }}>{s.l}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <button className="ghost" onClick={() => setInputMode("pdf")}
                  style={{ padding:"11px", borderRadius:10, border:"1px solid var(--br)",
                    background:"transparent", color:"var(--tx2)", fontSize:12, fontWeight:500 }}>
                  Import Tasks
                </button>
                {tasks.length > 0 && (
                  <button onClick={() => setBoardView("kanban")} className="btn-primary"
                    style={{ padding:"11px", borderRadius:10, border:"1px solid var(--ac)",
                      background:"var(--as)", color:"var(--ac)", fontSize:12, fontWeight:700 }}>
                    View Board ({tasks.length} tasks)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── Kanban view ── */
        <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"14px 26px", borderBottom:"1px solid var(--br)", flexWrap:"wrap", gap:9 }}>
            <div style={{ display:"flex", alignItems:"center", gap:11 }}>
              <button onClick={() => setBoardView("input")} className="ghost"
                style={{ padding:"5px 11px", borderRadius:8, border:"1px solid var(--br)",
                  background:"transparent", color:"var(--tx2)", fontSize:12, cursor:"pointer",
                  display:"flex", alignItems:"center", gap:5 }}>
                ← Back
              </button>
              <span style={{ fontSize:13, fontWeight:700, color:"var(--tx)", fontFamily:"var(--font-display)" }}>My Board</span>
              <span style={{ fontSize:10, padding:"2px 8px", borderRadius:5, background:"var(--br)",
                color:"var(--tx3)", fontFamily:"var(--font-mono)" }}>{tasks.length} tasks</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:9, flexWrap:"wrap" }}>
              <div style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 11px",
                borderRadius:8, background:"var(--as)", border:"1px solid var(--ag)" }}>
                <div className="pulse" style={{ width:5, height:5, borderRadius:"50%", background:"var(--ac)" }}/>
                <span style={{ fontSize:10.5, color:"var(--ac)", fontWeight:600 }}>
                  AI extracted {tasks.length} tasks
                </span>
              </div>
              <button onClick={handleSaveBoard} className="btn-primary"
                style={{ height:33, padding:"0 13px", borderRadius:8, background:"var(--ac)",
                  border:"none", color:"#fff", fontSize:12, fontWeight:700 }}>
                Save Board
              </button>
            </div>
          </div>

          <div style={{ flex:1, overflow:"auto", padding:"20px 26px" }}>
            <div className="kanban-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, minWidth:600 }}>
              {cols.map(([key, label, color]) => (
                <div key={key}>
                  <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:12, padding:"0 2px" }}>
                    <div style={{ width:9, height:9, borderRadius:"50%", background:color,
                      boxShadow:`0 0 8px ${color}` }}/>
                    <span style={{ fontSize:10.5, fontWeight:700, letterSpacing:"0.07em",
                      textTransform:"uppercase", color:"var(--tx3)", fontFamily:"var(--font-display)" }}>{label}</span>
                    <span style={{ fontSize:10, padding:"1px 6px", borderRadius:4, background:"var(--br)",
                      color:"var(--tx3)", fontFamily:"var(--font-mono)" }}>
                      {kanbanTasks(key).length}
                    </span>
                    <button className="ghost"
                      onClick={async () => {
                        const title = window.prompt(`Add task to ${label}:`);
                        if (!title?.trim()) return;
                        const res = await fetch('/api/boards', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ title: title.trim(), priority: 'medium', label: 'General', status: key }),
                        });
                        const data = await res.json();
                        setTasks(prev => [...prev, {
                          id: data.id ?? `KB-${Date.now()}`,
                          title: data.title ?? title.trim(),
                          priority: data.priority ?? 'medium',
                          label: data.label ?? 'General',
                          status: key,
                        }]);
                        syncTaskStats();
                      }}
                      style={{ marginLeft:"auto", background:"transparent", border:"none",
                        color:"var(--tx3)", padding:3, borderRadius:5, display:"flex" }}>
                      <Icons.Plus size={11}/>
                    </button>
                  </div>
                  <div>
                    {kanbanTasks(key).map(t => (
                      <TaskCard key={t.id} task={t} onStatusChange={updateTaskStatus}/>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CHAT AVATAR
═══════════════════════════════════════════════════════════════════════════ */
function ChatAvatar({ size = 30, icon = 14 }: { size?: number; icon?: number }) {
  return (
    <div style={{ width:size, height:size, borderRadius:8, flexShrink:0,
      background:"linear-gradient(135deg, #6366f1, #a78bfa)",
      boxShadow:"0 2px 8px rgba(99,102,241,0.35)",
      display:"flex", alignItems:"center", justifyContent:"center" }}>
      <ChatBotIcon size={icon} color="#fff"/>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CHAT MESSAGE  (extracted to fix useState-in-map hook violation)
═══════════════════════════════════════════════════════════════════════════ */
function ChatMessage({ m }: { m: ChatMsg }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = await copyTextToClipboard(m.content);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  return (
    <div className="fade-up"
      style={{ display:"flex", gap:10, alignItems:"flex-start",
        flexDirection: m.role === "user" ? "row-reverse" : "row",
        position:"relative" }}>
      {m.role === "ai" && <ChatAvatar size={30} icon={14}/>}
      <div style={{
        maxWidth:"82%", padding: m.role === "ai" ? "11px 15px 36px" : "11px 15px",
        borderRadius: m.role === "user" ? "14px 4px 14px 14px" : "4px 14px 14px 14px",
        background: m.role === "user" ? "var(--ac)" : "var(--bg1)",
        border: m.role === "user" ? "none" : "1px solid var(--br)",
        color: m.role === "user" ? "#fff" : "var(--tx)",
        position:"relative",
        boxShadow: m.role === "ai" ? "0 8px 24px rgba(0,0,0,0.08)" : undefined,
      }}>
        {m.role === "ai" && (
          <button type="button" onClick={handleCopy}
            style={{ position:"absolute", bottom:8, right:8,
              background: copied ? "rgba(16,185,129,0.15)" : "var(--bg2)",
              border:`1px solid ${copied ? "rgba(16,185,129,0.35)" : "var(--br)"}`,
              borderRadius:7, padding:"5px 8px", cursor:"pointer",
              display:"flex", alignItems:"center", gap:5,
              color: copied ? "var(--gr)" : "var(--tx2)", fontSize:11, fontWeight:600,
              transition:"all .15s", zIndex:2 }}
            title={copied ? "Copied!" : "Copy message"}>
            {copied ? <Icons.Check size={12}/> : <Icons.Copy size={12}/>}
            {copied ? "Copied" : "Copy"}
          </button>
        )}
        {m.role === "ai" ? (
          <div style={{ fontSize:13, lineHeight:1.6 }}>
            <ReactMarkdown
              components={{
                p: ({node, ...props}) => <p style={{ margin:"0 0 8px 0" }} {...props} />,
                ul: ({node, ...props}) => <ul style={{ margin:"8px 0", paddingLeft:"20px" }} {...props} />,
                ol: ({node, ...props}) => <ol style={{ margin:"8px 0", paddingLeft:"20px" }} {...props} />,
                li: ({node, ...props}) => <li style={{ margin:"4px 0" }} {...props} />,
                strong: ({node, ...props}) => <strong style={{ fontWeight:600 }} {...props} />,
                em: ({node, ...props}) => <em style={{ fontStyle:"italic" }} {...props} />,
                code: ({node, ...props}) => <code style={{ background:"rgba(0,0,0,0.1)", padding:"2px 6px", borderRadius:"4px", fontFamily:"var(--font-mono)", fontSize:"0.9em" }} {...props} />,
              }}
            >{m.content}</ReactMarkdown>
          </div>
        ) : (
          <p style={{ fontSize:13, lineHeight:1.6, whiteSpace:"pre-wrap" }}>{m.content}</p>
        )}
        <p style={{ fontSize:9.5, opacity:.55, marginTop:5,
          textAlign: m.role === "user" ? "right" : "left",
          fontFamily:"var(--font-mono)" }}>{m.ts}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE: AI CHAT
═══════════════════════════════════════════════════════════════════════════ */
function PageChat() {
  const { tasks, chatMessages, setChatMessages, user } = useApp();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showMiniBoard, setShowMiniBoard] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const ts = () => new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });

  const startNewChat = async () => {
    if (loading || clearing) return;
    setClearing(true);
    try {
      await fetch('/api/ai/chat', { method: 'DELETE' });
    } catch {
      /* clear locally even if API fails */
    }
    setChatMessages([]);
    setInput("");
    setClearing(false);
  };

  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    const uid = Date.now().toString();
    setChatMessages(prev => [...prev, { id:uid, role:"user", content:text, ts:ts() }]);
    setInput(""); setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          tasks: tasks.map(t => ({ id: t.id, title: t.title, priority: t.priority, status: t.status })),
          workloadHealth: Math.round(Math.max(0, 100 - (tasks.filter(t => t.priority === "urgent" || t.priority === "high").length / Math.max(tasks.length, 1)) * 42)),
          completedToday: tasks.filter(t => t.status === "done").length,
          estimatedHours: tasks.filter(t => t.status !== "done").length,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errMsg = data.error ?? data.message ?? 'Something went wrong. Please try again.';
        setChatMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "ai", content: `Sorry, ${errMsg}`, ts: ts() }]);
        return;
      }
      const reply = truncateChatResponse(data.response ?? data.reply ?? "Sorry, I couldn't get a response.");
      setChatMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "ai", content: reply, ts: ts() }]);
    } catch {
      setChatMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "ai", content: "Sorry, I couldn't connect to the AI. Please try again.", ts: ts() }]);
    } finally {
      setLoading(false);
    }
  }, [tasks, setChatMessages, loading]);

  const chatPrompts = [
    "What should I work on first today?",
    "Help me prioritize my urgent tasks",
    "Break down my biggest task into steps",
    "Am I at risk of burnout this week?",
  ];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [chatMessages]);

  return (
    <div className="chat-page" style={{ height:"100%", display:"flex", overflow:"hidden" }}>
      {/* Main chat */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Unified chat header (replaces global Topbar on this page) */}
        <div style={{
          height:56, borderBottom:"1px solid var(--br)",
          background:"var(--bg1)", display:"flex", alignItems:"center",
          justifyContent:"space-between", padding:"0 20px", flexShrink:0,
          boxShadow:"0 1px 12px rgba(0,0,0,0.12)",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
            <div style={{
              width:34, height:34, borderRadius:10, flexShrink:0,
              background:"linear-gradient(135deg,#6366f1,#ec4899)",
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow:"0 2px 10px rgba(99,102,241,0.35)",
            }}>
              <ChatBotIcon size={16} color="#fff"/>
            </div>
            <div style={{ minWidth:0 }}>
              <h2 style={{
                fontSize:15, fontWeight:700, color:"var(--tx)",
                fontFamily:"var(--font-display)", lineHeight:1.2,
                letterSpacing:"-0.03em", whiteSpace:"nowrap",
                overflow:"hidden", textOverflow:"ellipsis",
              }}>AI Chat</h2>
              <p style={{
                fontSize:11, color:"var(--tx3)", lineHeight:1, marginTop:2,
                whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
              }}>Has context from your board ({tasks.length} tasks)</p>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
            <button type="button" onClick={startNewChat} disabled={loading || clearing}
              className="ghost"
              style={{ fontSize:11, padding:"5px 10px", borderRadius:7, border:"1px solid var(--br)",
                background:"transparent", color:"var(--tx2)", cursor:"pointer",
                display:"flex", alignItems:"center", gap:5 }}>
              {clearing
                ? <div className="spin" style={{ width:10, height:10, borderRadius:"50%", border:"2px solid var(--br)", borderTopColor:"var(--ac)" }}/>
                : <Icons.Plus size={11}/>}
              New Chat
            </button>
            <button type="button" onClick={() => setShowMiniBoard(v => !v)} className="ghost"
              style={{
                fontSize:11, padding:"5px 10px", borderRadius:7, cursor:"pointer",
                display:"flex", alignItems:"center", gap:5,
                border: showMiniBoard ? "1px solid var(--ac)" : "1px solid var(--br)",
                background: showMiniBoard ? "var(--as)" : "transparent",
                color: showMiniBoard ? "var(--ac)" : "var(--tx2)",
                fontWeight: showMiniBoard ? 600 : 500,
              }}>
              <Icons.Board size={11}/>
              {showMiniBoard ? "Hide Board" : "Show Board"}
            </button>
            <div style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 11px",
              borderRadius:99, background:"var(--as)", border:"1px solid var(--ag)" }}>
              <div className="pulse" style={{ width:5, height:5, borderRadius:"50%", background:"var(--gr)" }}/>
              <span style={{ fontSize:10.5, color:"var(--ac)", fontWeight:600, fontFamily:"var(--font-mono)" }}>Live</span>
            </div>
            <Avt name={user?.full_name ?? "User"} size={32} avatarUrl={user?.avatar_url}/>
          </div>
        </div>

        {/* Messages area */}
        <div style={{ flex:1, overflowY:"auto", padding:"20px 28px" }}>
          {chatMessages.length === 0 ? (
            <div className="fade-in" style={{ display:"flex", flexDirection:"column", alignItems:"center",
              justifyContent:"center", minHeight:"100%", padding:"24px", maxWidth:"var(--chat-max)", margin:"0 auto", width:"100%" }}>
              <div style={{ width:64, height:64, borderRadius:18,
                background:"linear-gradient(135deg, #6366f1, #a78bfa)",
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow:"0 4px 24px rgba(99,102,241,0.45), 0 0 0 1px rgba(99,102,241,0.2)",
                marginBottom:18, position:"relative" }}>
                <div style={{ position:"absolute", inset:-4, borderRadius:22,
                  border:"1px solid rgba(99,102,241,0.25)", pointerEvents:"none" }}/>
                <ChatBotIcon size={32} color="#fff"/>
              </div>
              <p style={{ fontSize:15, fontWeight:700, color:"var(--tx)", marginBottom:8,
                fontFamily:"var(--font-display)", textAlign:"center" }}>What can I help you with?</p>
              <p style={{ fontSize:12.5, color:"var(--tx3)", lineHeight:1.65, textAlign:"center", marginBottom:18 }}>
                I can prioritize tasks, create new items, plan your day, and more.
              </p>
              <div className="chat-prompts" style={{ display:"grid", gridTemplateColumns:"repeat(2, minmax(0, 1fr))", gap:10, width:"100%" }}>
                {chatPrompts.map(prompt => (
                  <button key={prompt} type="button" onClick={() => send(prompt)} disabled={loading}
                    className="ghost"
                    style={{ padding:"12px 14px", borderRadius:11, border:"1px solid var(--br)",
                      background:"var(--bg1)", color:"var(--tx2)", fontSize:12.5, fontWeight:500,
                      textAlign:"left", lineHeight:1.45, cursor:"pointer" }}>
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:14, maxWidth:"var(--chat-max)", margin:"0 auto", width:"100%" }}>
              {chatMessages.map((m) => (
                <ChatMessage key={m.id} m={m}/>
              ))}

              {loading && (
                <div className="fade-in" style={{ display:"flex", gap:10, alignItems:"center" }}>
                  <ChatAvatar size={30} icon={14}/>
                  <div style={{ padding:"11px 15px", borderRadius:"4px 14px 14px 14px",
                    background:"var(--bg1)", border:"1px solid var(--br)", display:"flex", gap:5, alignItems:"center" }}>
                    {[0,1,2].map(i => (
                      <div key={i} className="pulse" style={{ width:6, height:6, borderRadius:"50%",
                        background:"var(--ac)", animationDelay:`${i*.15}s` }}/>
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef}/>
            </div>
          )}
        </div>

        {/* Input bar */}
        <div style={{ padding:"14px 28px", borderTop:"1px solid var(--br)", flexShrink:0,
          background:"linear-gradient(180deg, transparent, rgba(99,102,241,0.03))" }}>
          <div style={{ display:"flex", gap:9, alignItems:"flex-end", maxWidth:"var(--chat-max)", margin:"0 auto", width:"100%" }}>
            <textarea
              value={input} onChange={e => setInput(e.target.value)} rows={1}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
              placeholder="Ask me anything about your tasks..."
              className="chat-input"
              style={{ flex:1, background:"var(--inp)", border:"1px solid var(--br)",
                borderRadius:12, padding:"11px 14px", fontSize:13, color:"var(--tx)",
                resize:"none", lineHeight:1.5, maxHeight:120, outline:"none" }}/>
            <button onClick={() => send(input)} disabled={!input.trim() || loading} className="btn-primary"
              style={{ width:42, height:42, borderRadius:12, background:"var(--ac)", border:"none",
                color:"#fff", display:"flex", alignItems:"center", justifyContent:"center",
                opacity: !input.trim() ? .5 : 1, flexShrink:0 }}>
              {loading ? <div className="spin" style={{ width:14, height:14, borderRadius:"50%",
                border:"2px solid rgba(255,255,255,.3)", borderTopColor:"#fff" }}/> : <Icons.Send size={14}/>}
            </button>
          </div>
          <p style={{ fontSize:10, color:"var(--tx3)", marginTop:6, textAlign:"center" }}>
            Shift+Enter for new line · Enter to send
          </p>
        </div>
      </div>

      {/* Mini task board sidebar */}
      {showMiniBoard && (
        <div className="chat-sidebar xl-hide" style={{ width:260, borderLeft:"1px solid var(--br)",
          display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={{ padding:"13px 16px", borderBottom:"1px solid var(--br)",
            display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:12, fontWeight:700, color:"var(--tx)", fontFamily:"var(--font-display)" }}>Task Board</span>
            <span style={{ fontSize:10, padding:"1px 6px", borderRadius:4, background:"var(--br)",
              color:"var(--tx3)", fontFamily:"var(--font-mono)" }}>{tasks.length}</span>
            <button onClick={() => setShowMiniBoard(false)} className="ghost"
              style={{ marginLeft:"auto", background:"transparent", border:"none", color:"var(--tx3)",
                padding:3, borderRadius:4, display:"flex" }}>
              <Icons.X size={11}/>
            </button>
          </div>
          <div style={{ flex:1, overflowY:"auto", padding:10 }}>
            {tasks.length === 0 ? (
              <p style={{ fontSize:12, color:"var(--tx3)", textAlign:"center", paddingTop:20 }}>
                No tasks yet. Add tasks on the Board page.
              </p>
            ) : (
              (["todo","wip","done"] as TaskStatus[]).map(s => {
                const colTasks = tasks.filter(t => t.status === s);
                if (colTasks.length === 0) return null;
                const colors: Record<string,string> = { todo:"var(--ac)", wip:"var(--am)", done:"var(--gr)" };
                const labels: Record<string,string> = { todo:"To Do", wip:"In Progress", done:"Done" };
                return (
                  <div key={s} style={{ marginBottom:13 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:7 }}>
                      <div style={{ width:6, height:6, borderRadius:"50%", background:colors[s],
                        boxShadow:`0 0 6px ${colors[s]}` }}/>
                      <span style={{ fontSize:9.5, fontWeight:700, letterSpacing:"0.07em",
                        textTransform:"uppercase", color:"var(--tx3)", fontFamily:"var(--font-display)" }}>
                        {labels[s]}
                      </span>
                      <span style={{ fontSize:9, padding:"0 5px", borderRadius:3, background:"var(--br)",
                        color:"var(--tx3)", fontFamily:"var(--font-mono)" }}>{colTasks.length}</span>
                    </div>
                    {colTasks.map(t => <TaskCard key={t.id} task={t} compact/>)}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE: AUTOPILOT
═══════════════════════════════════════════════════════════════════════════ */
function PageAutopilot() {
  const { tasks, setTasks, briefings, setBriefings, burnoutAlerts } = useApp();
  const [genLoading, setGenLoading] = useState(false);
  const [settings, setSettings] = useState({
    scheduling:true, burnout:true, learning:false, autoPrioritize:false,
  });

  const pendingTasks = tasks.filter(t => t.status !== "done");
  const healthScore  = tasks.length === 0 ? 100 :
    Math.round(Math.max(0, 100 - (tasks.filter(t=>t.priority==="urgent"||t.priority==="high").length / Math.max(tasks.length,1)) * 42));

  const [briefingError, setBriefingError] = useState("");

  const handleGenerate = async () => {
    setGenLoading(true);
    setBriefingError("");
    try {
      const res = await fetch('/api/autopilot/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: pendingTasks.map(t => ({ id: t.id, title: t.title, priority: t.priority, estimate: t.estimate })),
          workloadHealth: healthScore,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setBriefingError(data.error ?? "Failed to generate briefing. Please try again."); return; }
      const nb: Briefing = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
        summary: data.briefing?.summary ?? data.summary ?? `You have ${pendingTasks.length} pending tasks today.`,
        schedule: (data.briefing?.schedule ?? data.schedule ?? []).map((s: { time?: string; task?: string; task_title?: string; duration?: string; estimated_duration?: string }) => ({
          time: s.time ?? s.task_title ?? '',
          task: s.task ?? s.task_title ?? '',
          duration: s.duration ?? s.estimated_duration ?? '30m',
        })),
        healthNote: data.briefing?.warnings?.[0] ?? data.healthNote ?? (healthScore >= 75
          ? "✓ Workload looks healthy."
          : "⚠ High load detected."),
      };
      setBriefings(prev => [nb, ...prev]);
    } catch {
      setBriefingError("Network error. Please check your connection and try again.");
    } finally {
      setGenLoading(false);
    }
  };

  const createScheduleOnBoard = () => {
    if (!briefings[0]) return;
    const scheduleTasks: Task[] = briefings[0].schedule.map((s, i) => ({
      id: `SCH-${Date.now()}-${i}`, title: s.task, priority:"medium",
      label:"Schedule", estimate:s.duration, status:"todo" as TaskStatus,
    }));
    setTasks(prev => [...prev, ...scheduleTasks]);
  };

  return (
    <div className="fade-up page-pad" style={{ padding:"28px 30px", height:"100%", overflowY:"auto",
      display:"flex", flexDirection:"column", gap:18 }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, letterSpacing:"-0.035em", color:"var(--tx)",
            marginBottom:4, fontFamily:"var(--font-display)" }}>AI Autopilot</h1>
          <p style={{ fontSize:13, color:"var(--tx2)" }}>Autonomous workload management & morning briefings</p>
        </div>
        <button onClick={handleGenerate} disabled={genLoading} className="btn-primary"
          style={{ height:40, padding:"0 18px", borderRadius:10, background:"var(--ac)",
            border:"none", color:"#fff", fontSize:13, fontWeight:700,
            display:"flex", alignItems:"center", gap:8 }}>
          {genLoading
            ? <><div className="spin" style={{ width:14, height:14, borderRadius:"50%",
                border:"2px solid rgba(255,255,255,.3)", borderTopColor:"#fff" }}/> Generating...</>
            : <><Icons.Autopilot size={14}/> Generate Briefing</>
          }
        </button>
      </div>

      {briefingError && (
        <div style={{ display:"flex", alignItems:"center", gap:9, padding:"10px 14px",
          borderRadius:10, background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.2)" }}>
          <Icons.AlertTri size={13} style={{ color:"var(--rd)", flexShrink:0 }}/>
          <span style={{ fontSize:12, color:"var(--rd)", flex:1 }}>{briefingError}</span>
          <button onClick={() => setBriefingError("")} style={{ background:"transparent",
            border:"none", color:"var(--rd)", cursor:"pointer", padding:2, display:"flex" }}>
            <Icons.X size={11}/>
          </button>
        </div>
      )}

      {/* Live sync status */}
      <div style={{ display:"flex", alignItems:"center", gap:11, padding:"12px 16px",
        borderRadius:11, background:"var(--as)", border:"1px solid var(--ag)" }}>
        <div className="pulse" style={{ width:7, height:7, borderRadius:"50%", background:"var(--ac)", flexShrink:0 }}/>
        <span style={{ fontSize:12, color:"var(--ac)", fontWeight:600 }}>
          Live sync with board: {pendingTasks.length} pending tasks · Health {healthScore}/100 · {pendingTasks.filter(t=>t.priority==="urgent").length} urgent
        </span>
      </div>

      <div className="autopilot-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        {/* Morning Briefing */}
        <div style={{ borderRadius:13, border:"1px solid var(--br)", background:"var(--bg1)", padding:22 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:17 }}>
            <h3 style={{ fontSize:13, fontWeight:700, color:"var(--tx)", fontFamily:"var(--font-display)" }}>Morning Briefing</h3>
            {briefings.length > 0 && (
              <span style={{ fontSize:10, padding:"2px 9px", borderRadius:100,
                background:"rgba(16,185,129,0.1)", color:"var(--gr)", border:"1px solid rgba(16,185,129,0.2)", fontWeight:700 }}>
                Latest
              </span>
            )}
          </div>
          {briefings.length === 0 ? (
            <div style={{ textAlign:"center", padding:"32px 18px" }}>
              <div style={{ width:48, height:48, borderRadius:13, background:"var(--as)",
                display:"flex", alignItems:"center", justifyContent:"center",
                color:"var(--ac)", margin:"0 auto 14px" }}>
                <Icons.Autopilot size={22}/>
              </div>
              <p style={{ fontSize:13.5, color:"var(--tx2)", marginBottom:8, fontWeight:500 }}>No briefing yet</p>
              <p style={{ fontSize:11.5, color:"var(--tx3)", lineHeight:1.65 }}>
                Generate your first AI briefing to see a smart summary of today's tasks.
              </p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
              <p style={{ fontSize:11, color:"var(--tx3)", fontWeight:700, fontFamily:"var(--font-mono)" }}>{briefings[0]!.date}</p>
              <p style={{ fontSize:12.5, color:"var(--tx2)", lineHeight:1.7 }}>{briefings[0]!.summary}</p>
              <div style={{ padding:"10px 13px", borderRadius:9, background:"var(--as)", border:"1px solid var(--ag)" }}>
                <p style={{ fontSize:11.5, color:"var(--ac)" }}>{briefings[0]!.healthNote}</p>
              </div>
            </div>
          )}
        </div>

        {/* AI Schedule */}
        <div style={{ borderRadius:13, border:"1px solid var(--br)", background:"var(--bg1)", padding:22 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:17 }}>
            <h3 style={{ fontSize:13, fontWeight:700, color:"var(--tx)", fontFamily:"var(--font-display)" }}>AI Daily Schedule</h3>
            {briefings.length > 0 && (
              <button onClick={createScheduleOnBoard} className="btn-primary"
                style={{ fontSize:10.5, padding:"4px 10px", borderRadius:7, border:"1px solid var(--ac)",
                  background:"var(--as)", color:"var(--ac)", cursor:"pointer", fontWeight:700 }}>
                → Add to Board
              </button>
            )}
          </div>
          {briefings.length === 0 ? (
            <div style={{ textAlign:"center", padding:"32px 18px" }}>
              <Icons.Clock size={30} style={{ color:"var(--tx3)", display:"block", margin:"0 auto 13px" }}/>
              <p style={{ fontSize:12, color:"var(--tx3)" }}>Generate a briefing first to see your AI schedule</p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {briefings[0]!.schedule.map((s, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:11, padding:"9px 12px",
                  borderRadius:9, background:"var(--bg2)", border:"1px solid var(--br)" }}>
                  <span style={{ fontSize:10, fontWeight:700, color:"var(--ac)", fontFamily:"var(--font-mono)",
                    flexShrink:0, minWidth:56 }}>{s.time}</span>
                  <span style={{ fontSize:12, color:"var(--tx)", flex:1, overflow:"hidden",
                    textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.task}</span>
                  <span style={{ fontSize:10, color:"var(--tx3)", flexShrink:0,
                    fontFamily:"var(--font-mono)" }}>{s.duration}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Burnout Panel */}
        <div style={{ borderRadius:13, border:"1px solid var(--br)", background:"var(--bg1)", padding:22 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:17 }}>
            <h3 style={{ fontSize:13, fontWeight:700, color:"var(--tx)", fontFamily:"var(--font-display)" }}>Burnout Alert Panel</h3>
            <HealthRing score={healthScore}/>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:11 }}>
            <div style={{ padding:"11px 13px", borderRadius:9,
              background: healthScore >= 75 ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)",
              border:`1px solid ${healthScore >= 75 ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}` }}>
              <p style={{ fontSize:12, fontWeight:700, color: healthScore >= 75 ? "var(--gr)" : "var(--rd)", marginBottom:3 }}>
                {healthScore >= 75 ? "✓ No burnout risk detected" : "⚠ Elevated burnout risk"}
              </p>
              <p style={{ fontSize:11.5, color:"var(--tx2)" }}>
                {pendingTasks.length} pending · {pendingTasks.filter(t=>t.priority==="urgent"||t.priority==="high").length} high priority
              </p>
            </div>
            {burnoutAlerts.length === 0 ? (
              <p style={{ fontSize:11.5, color:"var(--tx3)", textAlign:"center", padding:"12px 0" }}>
                No burnout alerts in history. Great work! 🎉
              </p>
            ) : (
              burnoutAlerts.map(a => (
                <div key={a.id} style={{ padding:"9px 11px", borderRadius:9,
                  background:"var(--bg2)", border:"1px solid var(--br)" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                    <span style={{ fontSize:11, color:"var(--rd)", fontWeight:700 }}>Score: {a.score}/100</span>
                    <span style={{ fontSize:10, color:"var(--tx3)", fontFamily:"var(--font-mono)" }}>{a.date}</span>
                  </div>
                  <p style={{ fontSize:11.5, color:"var(--tx2)" }}>{a.message}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Settings */}
        <div style={{ borderRadius:13, border:"1px solid var(--br)", background:"var(--bg1)", padding:22 }}>
          <h3 style={{ fontSize:13, fontWeight:700, color:"var(--tx)", marginBottom:18, fontFamily:"var(--font-display)" }}>
            Autopilot Settings
          </h3>
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {[
              { key:"scheduling"     as const, label:"Smart Scheduling",    desc:"AI plans your day based on priorities" },
              { key:"burnout"        as const, label:"Burnout Detection",   desc:"Monitor workload & alert on overload" },
              { key:"learning"       as const, label:"Pattern Learning",    desc:"Learn your productivity habits (Pro)" },
              { key:"autoPrioritize" as const, label:"Auto-Prioritization", desc:"Re-rank tasks when new ones arrive (Pro)" },
            ].map(s => (
              <div key={s.key} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:14 }}>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:13, fontWeight:500, color:"var(--tx)", marginBottom:2 }}>{s.label}</p>
                  <p style={{ fontSize:11.5, color:"var(--tx3)" }}>{s.desc}</p>
                </div>
                <Toggle on={settings[s.key]} onToggle={() => setSettings(prev => ({ ...prev, [s.key]:!prev[s.key] }))}/>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Briefing history */}
      {briefings.length > 1 && (
        <div style={{ borderRadius:13, border:"1px solid var(--br)", background:"var(--bg1)", padding:22 }}>
          <h3 style={{ fontSize:13, fontWeight:700, color:"var(--tx)", marginBottom:15, fontFamily:"var(--font-display)" }}>
            Briefing History
          </h3>
          <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
            {briefings.slice(1).map(b => (
              <div key={b.id} style={{ display:"flex", alignItems:"center", gap:13, padding:"10px 13px",
                borderRadius:9, background:"var(--bg2)", border:"1px solid var(--br)" }}>
                <Icons.Calendar size={13} style={{ color:"var(--tx3)", flexShrink:0 }}/>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:12, fontWeight:600, color:"var(--tx)" }}>{b.date}</p>
                  <p style={{ fontSize:11, color:"var(--tx3)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{b.summary}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE: SAVED BOARDS
═══════════════════════════════════════════════════════════════════════════ */
function PageSaved() {
  const { savedBoards, setSavedBoards, setTasks, setBoardView, navigate } = useApp();
  const [view, setView] = useState<"grid"|"list">("grid");
  const [search, setSearch] = useState("");
  const [activeFolder, setActiveFolder] = useState("All");
  const [renamingId, setRenamingId] = useState<string|null>(null);
  const [renameVal, setRenameVal] = useState("");
  const [movingId, setMovingId] = useState<string|null>(null);

  const folders = ["All","Clients","Personal","Dev","Content"];
  const filtered = savedBoards.filter(b =>
    (activeFolder === "All" || b.folder === activeFolder) &&
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  const openBoard   = (b: SavedBoard) => { setTasks(b.tasks); setBoardView("kanban"); navigate("board"); };
  const deleteBoard = (id: string) => {
    setSavedBoards(prev => prev.filter(b => b.id !== id));
    fetch(`/api/saved/${id}`, { method: 'DELETE' }).catch(() => {});
  };
  const renameBoard = (id: string) => {
    if (renameVal.trim()) {
      setSavedBoards(prev => prev.map(b => b.id === id ? { ...b, name: renameVal.trim() } : b));
      fetch(`/api/saved/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: renameVal.trim() }),
      }).catch(() => {});
    }
    setRenamingId(null); setRenameVal("");
  };
  const moveBoard = (id: string, folder: string) => {
    setSavedBoards(prev => prev.map(b => b.id === id ? { ...b, folder } : b));
    setMovingId(null);
  };

  return (
    <div className="fade-up page-pad" style={{ padding:"28px 30px", height:"100%", overflowY:"auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, letterSpacing:"-0.035em", color:"var(--tx)",
            marginBottom:4, fontFamily:"var(--font-display)" }}>Saved Boards</h1>
          <p style={{ fontSize:13, color:"var(--tx2)" }}>{savedBoards.length} boards · {folders.length-1} folders</p>
        </div>
        <button onClick={() => navigate("board")} className="btn-primary"
          style={{ height:38, padding:"0 16px", borderRadius:10, background:"var(--ac)",
            border:"none", color:"#fff", fontSize:13, fontWeight:700, display:"flex", alignItems:"center", gap:7 }}>
          <Icons.Plus size={13}/> New Board
        </button>
      </div>

      {/* Toolbar */}
      <div style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap" }}>
        <div style={{ flex:1, minWidth:200, position:"relative" }}>
          <Icons.Search size={13} style={{ position:"absolute", left:12, top:"50%",
            transform:"translateY(-50%)", color:"var(--tx3)" }}/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search boards..."
            className="input-focus"
            style={{ width:"100%", background:"var(--bg1)", border:"1px solid var(--br)", borderRadius:9,
              padding:"8px 12px 8px 34px", fontSize:13, color:"var(--tx)" }}/>
        </div>
        <div style={{ display:"flex", gap:3, background:"var(--bg1)", border:"1px solid var(--br)",
          borderRadius:9, padding:4 }}>
          {(["grid","list"] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{ width:32, height:32, borderRadius:7, border:"none",
                background: view === v ? "var(--bg2)" : "transparent",
                color: view === v ? "var(--tx)" : "var(--tx3)",
                cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                transition:"all .15s" }}>
              {v === "grid" ? <Icons.Overview size={13}/> : <Icons.Board size={13}/>}
            </button>
          ))}
        </div>
      </div>

      {/* Folder tabs */}
      <div style={{ display:"flex", gap:6, marginBottom:22, flexWrap:"wrap" }}>
        {folders.map(f => (
          <button key={f} onClick={() => setActiveFolder(f)}
            style={{ padding:"5px 14px", borderRadius:8,
              border:`1px solid ${activeFolder === f ? "var(--ac)" : "var(--br)"}`,
              background: activeFolder === f ? "var(--as)" : "transparent",
              color: activeFolder === f ? "var(--ac)" : "var(--tx2)",
              fontSize:12, fontWeight: activeFolder === f ? 700 : 400,
              cursor:"pointer", display:"flex", alignItems:"center", gap:6, transition:"all .15s" }}>
            {f !== "All" && <Icons.Folder size={11}/>}{f}
            <span style={{ fontSize:10, color: activeFolder === f ? "var(--ac)" : "var(--tx3)",
              fontFamily:"var(--font-mono)" }}>
              {f === "All" ? savedBoards.length : savedBoards.filter(b => b.folder === f).length}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign:"center", padding:"60px 24px" }}>
          <Icons.Saved size={30} style={{ color:"var(--tx3)", display:"block", margin:"0 auto 14px" }}/>
          <p style={{ fontSize:14, color:"var(--tx2)", marginBottom:6, fontWeight:600 }}>No boards found</p>
          <p style={{ fontSize:12, color:"var(--tx3)" }}>Save a board from the Board page, or create a new one.</p>
        </div>
      )}

      {view === "grid" ? (
        <div className="saved-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(235px,1fr))", gap:13 }}>
          {filtered.map(b => (
            <div key={b.id} className="card"
              style={{ borderRadius:14, border:"1px solid var(--br)", background:"var(--bg1)", padding:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:13 }}>
                <div style={{ width:36, height:36, borderRadius:9, background:"var(--as)",
                  display:"flex", alignItems:"center", justifyContent:"center", color:"var(--ac)" }}>
                  <Icons.Layers size={15}/>
                </div>
                <span style={{ fontSize:10, padding:"2px 9px", borderRadius:100,
                  background:"var(--bg2)", border:"1px solid var(--br)", color:"var(--tx3)" }}>{b.folder}</span>
              </div>
              {renamingId === b.id ? (
                <input value={renameVal} onChange={e => setRenameVal(e.target.value)} autoFocus
                  onKeyDown={e => { if(e.key==="Enter") renameBoard(b.id); if(e.key==="Escape"){setRenamingId(null);setRenameVal("");} }}
                  onBlur={() => renameBoard(b.id)}
                  className="input-focus"
                  style={{ width:"100%", background:"var(--inp)", border:"1px solid var(--ac)",
                    borderRadius:7, padding:"6px 9px", fontSize:13, color:"var(--tx)", marginBottom:4 }}/>
              ) : (
                <p style={{ fontSize:13.5, fontWeight:700, color:"var(--tx)", marginBottom:4,
                  lineHeight:1.35, fontFamily:"var(--font-display)" }}>{b.name}</p>
              )}
              <p style={{ fontSize:11, color:"var(--tx3)", marginBottom:16, fontFamily:"var(--font-mono)" }}>
                {b.taskCount} tasks · {b.lastEdited}
              </p>
              {movingId === b.id && (
                <div style={{ marginBottom:11, padding:"9px", borderRadius:9,
                  background:"var(--bg2)", border:"1px solid var(--br)" }}>
                  <p style={{ fontSize:10.5, color:"var(--tx3)", marginBottom:7, fontWeight:600 }}>Move to folder:</p>
                  {folders.filter(f => f !== "All" && f !== b.folder).map(f => (
                    <button key={f} onClick={() => moveBoard(b.id, f)}
                      style={{ display:"block", width:"100%", padding:"5px 9px", borderRadius:6,
                        border:"none", background:"transparent", color:"var(--tx2)", fontSize:12,
                        textAlign:"left", cursor:"pointer", marginBottom:2, transition:"all .12s" }}
                      onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--bg3)"; }}
                      onMouseOut={e =>  { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                      {f}
                    </button>
                  ))}
                </div>
              )}
              <div style={{ display:"flex", gap:7 }}>
                <button onClick={() => openBoard(b)}
                  style={{ flex:1, padding:"8px", borderRadius:8, border:"1px solid var(--br)",
                    background:"transparent", color:"var(--tx2)", fontSize:11.5, cursor:"pointer",
                    fontWeight:500, transition:"all .15s" }}
                  onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--ac)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--ac)"; }}
                  onMouseOut={e  => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--br)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--tx2)"; }}>
                  Open
                </button>
                {[
                  { icon:<Icons.Edit size={12}/>, onClick:()=>{setRenamingId(b.id);setRenameVal(b.name);} },
                  { icon:<Icons.MoveFolder size={12}/>, onClick:()=>setMovingId(movingId===b.id?null:b.id) },
                  { icon:<Icons.Trash size={12}/>, onClick:()=>deleteBoard(b.id), danger:true },
                ].map((btn, i) => (
                  <button key={i} onClick={btn.onClick}
                    style={{ width:32, borderRadius:8,
                      border:`1px solid ${btn.danger ? "rgba(239,68,68,0.2)" : "var(--br)"}`,
                      background:"transparent", color: btn.danger ? "var(--rd)" : "var(--tx3)",
                      cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                      transition:"all .15s" }}>
                    {btn.icon}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          {filtered.map(b => (
            <div key={b.id} style={{ display:"flex", alignItems:"center", gap:13, padding:"12px 14px",
              borderRadius:10, border:"1px solid transparent", cursor:"pointer", transition:"all .15s" }}
              onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.background = "var(--bg1)"; (e.currentTarget as HTMLDivElement).style.borderColor = "var(--br)"; }}
              onMouseOut={e =>  { (e.currentTarget as HTMLDivElement).style.background = "transparent"; (e.currentTarget as HTMLDivElement).style.borderColor = "transparent"; }}>
              <div style={{ width:32, height:32, borderRadius:8, background:"var(--as)",
                display:"flex", alignItems:"center", justifyContent:"center", color:"var(--ac)", flexShrink:0 }}>
                <Icons.Layers size={13}/>
              </div>
              {renamingId === b.id ? (
                <input value={renameVal} onChange={e => setRenameVal(e.target.value)} autoFocus
                  onKeyDown={e => { if(e.key==="Enter") renameBoard(b.id); if(e.key==="Escape"){setRenamingId(null);setRenameVal("");} }}
                  onBlur={() => renameBoard(b.id)} className="input-focus"
                  style={{ flex:1, background:"var(--inp)", border:"1px solid var(--ac)",
                    borderRadius:6, padding:"5px 9px", fontSize:13, color:"var(--tx)" }}/>
              ) : (
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:13, fontWeight:600, color:"var(--tx)", overflow:"hidden",
                    textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{b.name}</p>
                  <p style={{ fontSize:10.5, color:"var(--tx3)", fontFamily:"var(--font-mono)" }}>
                    {b.taskCount} tasks · {b.folder} · {b.lastEdited}
                  </p>
                </div>
              )}
              <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                <button onClick={() => openBoard(b)}
                  style={{ fontSize:11.5, padding:"4px 10px", borderRadius:7, border:"1px solid var(--br)",
                    background:"transparent", color:"var(--tx2)", cursor:"pointer", transition:"all .15s" }}
                  onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--ac)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--ac)"; }}
                  onMouseOut={e  => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--br)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--tx2)"; }}>
                  Open
                </button>
                <button onClick={() => { setRenamingId(b.id); setRenameVal(b.name); }}
                  style={{ width:30, height:30, borderRadius:7, border:"1px solid var(--br)",
                    background:"transparent", color:"var(--tx3)", cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Icons.Edit size={12}/>
                </button>
                <button onClick={() => deleteBoard(b.id)}
                  style={{ width:30, height:30, borderRadius:7, border:"1px solid rgba(239,68,68,0.2)",
                    background:"transparent", color:"var(--rd)", cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Icons.Trash size={12}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE: SETTINGS
═══════════════════════════════════════════════════════════════════════════ */
function PageSettings({ theme, toggleTheme }: { theme: Theme; toggleTheme: () => void }) {
  const { user } = useApp();
  const [tab, setTab] = useState("profile");
  const [profileName, setProfileName] = useState(user?.full_name ?? "");
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 8) { setPwError("Password must be at least 8 characters"); return; }
    if (newPassword !== confirmPassword) { setPwError("Passwords do not match"); return; }
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setPwError(error.message);
    else { setPwSuccess(true); setNewPassword(""); setConfirmPassword(""); }
    setPwSaving(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    try {
      await fetch('/api/profile', { method: 'DELETE' });
      await supabase.auth.signOut();
      router.push('/');
    } catch { setDeleting(false); }
  };

  const tabs = [
    { key:"profile",        label:"Profile",       icon:<Icons.Settings size={16}/>  },
    { key:"security",       label:"Security",      icon:<Icons.Shield size={16}/>    },
    { key:"billing",        label:"Billing",       icon:<Icons.Card size={16}/>      },
    { key:"appearance",     label:"Appearance",    icon:<Icons.Sun size={16}/>       },
    { key:"data",           label:"Data & Export", icon:<Icons.Download size={16}/>  },
    { key:"danger",         label:"Danger Zone",   icon:<Icons.Trash size={16}/>     },
  ];

  const handleSaveProfile = async () => {
    if (!profileName.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: profileName.trim() }),
      });
    } catch { /* non-blocking */ }
    setSaving(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="fade-up page-pad" style={{ padding:"28px 30px", height:"100%", overflowY:"auto" }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:800, letterSpacing:"-0.035em", color:"var(--tx)",
          marginBottom:4, fontFamily:"var(--font-display)" }}>Settings</h1>
        <p style={{ fontSize:13, color:"var(--tx2)" }}>Manage your account and preferences</p>
      </div>

      <div className="settings-grid" style={{ display:"grid", gridTemplateColumns:"1fr", gap:12 }}>
        {/* Tabs */}
        <div className="settings-tabs" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className="nav-btn"
              data-active={tab === t.key ? "true" : "false"}
              style={{ padding:"12px 10px", borderRadius:12, border: tab === t.key ? "2px solid var(--ac)" : "1.5px solid var(--br)",
                background: tab === t.key ? "rgba(99,102,241,0.08)" : "var(--bg2)",
                color: tab === t.key ? "var(--ac)" : "var(--tx2)",
                fontSize:12, fontWeight: tab === t.key ? 700 : 500,
                cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6,
                whiteSpace:"nowrap", transition:"all 0.2s ease", position:"relative" }}>
              <span style={{ color: tab === t.key ? "var(--ac)" : "var(--tx3)", display:"flex", alignItems:"center", justifyContent:"center" }}>{t.icon}</span>
              <span style={{ fontSize:11, lineHeight:1.2, textAlign:"center" }}>{t.label}</span>
              {(t.key === "data") && (
                <span style={{
                  fontSize:8, fontWeight:700, color:"var(--am)", background:"rgba(245,158,11,0.15)",
                  border:"0.5px solid rgba(245,158,11,0.3)", padding:"1px 5px", borderRadius:99,
                  letterSpacing:"0.05em", textTransform:"uppercase", marginTop:2
                }}>Soon</span>
              )}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className="settings-panel" style={{ borderRadius:14, border:"1px solid var(--br)", background:"var(--bg1)", padding:26 }}>
          {tab === "profile" && (
            <div>
              <h3 style={{ fontSize:15, fontWeight:800, color:"var(--tx)", marginBottom:4, fontFamily:"var(--font-display)" }}>Profile</h3>
              <p style={{ fontSize:12.5, color:"var(--tx2)", marginBottom:22 }}>Update your personal information</p>
              <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:24,
                padding:"16px", borderRadius:12, background:"var(--bg2)", border:"1px solid var(--br)", flexWrap:"wrap" }}>
                <Avt name={user?.full_name ?? "User"} size={48}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:14, fontWeight:700, color:"var(--tx)", fontFamily:"var(--font-display)", wordBreak:"break-word" }}>
                    {user?.full_name ?? "User"}
                  </p>
                  <p style={{ fontSize:11.5, color:"var(--tx3)", wordBreak:"break-all" }}>{user?.email}</p>
                  <p style={{ fontSize:10.5, padding:"2px 8px", borderRadius:100, display:"inline-block",
                    marginTop:4, background:"var(--as)", color:"var(--ac)", fontWeight:700 }}>
                    {user?.plan === "pro" ? "Pro Plan" : "Free Plan"}
                  </p>
                </div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:"var(--tx2)", display:"block", marginBottom:7 }}>Full Name</label>
                  <input value={profileName} onChange={e => setProfileName(e.target.value)}
                    className="input-focus"
                    style={{ width:"100%", background:"var(--inp)", border:"1px solid var(--br)",
                      borderRadius:9, padding:"10px 13px", fontSize:13, color:"var(--tx)" }}/>
                </div>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:"var(--tx2)", display:"block", marginBottom:7 }}>Email</label>
                  <input defaultValue={user?.email} type="email" readOnly
                    style={{ width:"100%", background:"var(--inp)", border:"1px solid var(--br)",
                      borderRadius:9, padding:"10px 13px", fontSize:13, color:"var(--tx2)", opacity:.7 }}/>
                  <p style={{ fontSize:11, color:"var(--tx3)", marginTop:4 }}>Email cannot be changed</p>
                </div>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                  <button onClick={handleSaveProfile} disabled={saving} className="btn-primary"
                    style={{ flex:"1 1 auto", minWidth:"140px", height:38, padding:"0 18px", borderRadius:9,
                      background:"var(--ac)", border:"none", color:"#fff", fontSize:13, fontWeight:700,
                      display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                    {saving
                      ? <><div className="spin" style={{ width:12, height:12, borderRadius:"50%",
                          border:"2px solid rgba(255,255,255,.3)", borderTopColor:"#fff" }}/> Saving...</>
                      : "Save Changes"
                    }
                  </button>
                  <button onClick={handleSignOut}
                    style={{ flex:"1 1 auto", minWidth:"140px", height:38, padding:"0 18px", borderRadius:9,
                      border:"1px solid var(--br)", background:"transparent",
                      color:"var(--tx2)", fontSize:13, fontWeight:600, cursor:"pointer",
                      display:"flex", alignItems:"center", justifyContent:"center", gap:8, transition:"background .15s, color .15s" }}
                    onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.07)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--rd)"; }}
                    onMouseOut={e =>  { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "var(--tx2)"; }}>
                    <Icons.Logout size={13}/> Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === "security" && (
            <div>
              <h3 style={{ fontSize:15, fontWeight:800, color:"var(--tx)", marginBottom:4, fontFamily:"var(--font-display)" }}>Security</h3>
              <p style={{ fontSize:12.5, color:"var(--tx2)", marginBottom:22 }}>Update your password</p>
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                {[
                  { label:"New Password", value:newPassword, onChange:(v:string)=>setNewPassword(v) },
                  { label:"Confirm Password", value:confirmPassword, onChange:(v:string)=>setConfirmPassword(v) },
                ].map(f => (
                  <div key={f.label}>
                    <label style={{ fontSize:12, fontWeight:600, color:"var(--tx2)", display:"block", marginBottom:7 }}>{f.label}</label>
                    <input type="password" value={f.value} onChange={e => f.onChange(e.target.value)}
                      placeholder={`Enter ${f.label.toLowerCase()}`} className="input-focus"
                      style={{ width:"100%", background:"var(--inp)", border:"1px solid var(--br)",
                        borderRadius:9, padding:"10px 13px", fontSize:13, color:"var(--tx)" }}/>
                  </div>
                ))}
                {pwError && <p style={{ fontSize:12, color:"var(--rd)" }}>{pwError}</p>}
                {pwSuccess && <p style={{ fontSize:12, color:"var(--gr)" }}>Password updated successfully.</p>}
                <button onClick={handleChangePassword} disabled={pwSaving} className="btn-primary"
                  style={{ alignSelf:"flex-start", height:38, padding:"0 18px", borderRadius:9,
                    background:"var(--ac)", border:"none", color:"#fff", fontSize:13, fontWeight:700,
                    display:"flex", alignItems:"center", gap:8 }}>
                  {pwSaving
                    ? <><div className="spin" style={{ width:12, height:12, borderRadius:"50%", border:"2px solid rgba(255,255,255,.3)", borderTopColor:"#fff" }}/> Saving...</>
                    : "Change Password"
                  }
                </button>
              </div>
            </div>
          )}

          {tab === "billing" && (
            <div>
              <h3 style={{ fontSize:15, fontWeight:800, color:"var(--tx)", marginBottom:4, fontFamily:"var(--font-display)" }}>Billing</h3>
              <p style={{ fontSize:12.5, color:"var(--tx2)", marginBottom:22 }}>Manage your subscription</p>
              <div className="settings-billing-row" style={{ borderRadius:12, border:"1px solid var(--br)", padding:"18px", marginBottom:16,
                display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:14, fontWeight:700, color:"var(--tx)", fontFamily:"var(--font-display)" }}>
                    {user?.plan === "pro" ? "Pro Plan" : "Free Plan"}
                  </p>
                  <p style={{ fontSize:12, color:"var(--tx3)", wordBreak:"break-word" }}>
                    {user?.plan === "pro" ? "50 boards/day · 1500 AI uses/month" : "10 boards/day · 300 AI uses/month"}
                  </p>
                </div>
                {user?.plan !== "pro" && (
                  <button className="btn-primary" onClick={async () => {
                    const res = await fetch('/api/stripe/checkout', { method: 'POST' });
                    const data = await res.json();
                    if (data.url) window.location.href = data.url;
                  }}
                    style={{ height:36, padding:"0 16px", borderRadius:9, background:"var(--ac)",
                      border:"none", color:"#fff", fontSize:12, fontWeight:700, flexShrink:0, whiteSpace:"nowrap" }}>
                    Upgrade to Pro · $9/mo
                  </button>
                )}
              </div>
            </div>
          )}

          {tab === "appearance" && (
            <div>
              <h3 style={{ fontSize:15, fontWeight:800, color:"var(--tx)", marginBottom:4, fontFamily:"var(--font-display)" }}>Appearance</h3>
              <p style={{ fontSize:12.5, color:"var(--tx2)", marginBottom:22 }}>Customize how Kanbi looks</p>
              <div className="settings-appearance-row" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 18px",
                borderRadius:11, border:"1px solid var(--br)", background:"var(--bg2)" }}>
                <div>
                  <p style={{ fontSize:13.5, fontWeight:500, color:"var(--tx)", marginBottom:3 }}>Theme</p>
                  <p style={{ fontSize:11.5, color:"var(--tx3)" }}>{theme === "dark" ? "Dark mode" : "Light mode"} · auto-detects system</p>
                </div>
                <button onClick={toggleTheme} className="ghost"
                  style={{ height:36, padding:"0 16px", borderRadius:9, border:"1px solid var(--br)",
                    background:"var(--bg3)", color:"var(--tx)", fontSize:13, cursor:"pointer",
                    display:"flex", alignItems:"center", gap:8 }}>
                  {theme === "dark" ? <><Icons.Sun size={14}/> Light</> : <><Icons.Moon size={14}/> Dark</>}
                </button>
              </div>
            </div>
          )}

          {tab === "danger" && (
            <div>
              <h3 style={{ fontSize:15, fontWeight:800, color:"var(--rd)", marginBottom:4, fontFamily:"var(--font-display)" }}>Danger Zone</h3>
              <p style={{ fontSize:12.5, color:"var(--tx2)", marginBottom:22 }}>These actions are permanent and cannot be undone.</p>
              <div style={{ borderRadius:11, border:"1px solid rgba(239,68,68,0.22)",
                background:"rgba(239,68,68,0.04)", padding:"20px 22px" }}>
                <p style={{ fontSize:13.5, fontWeight:700, color:"var(--rd)", marginBottom:6 }}>Delete Account</p>
                <p style={{ fontSize:12.5, color:"var(--tx2)", marginBottom:16, lineHeight:1.65 }}>
                  Permanently deletes your account, all boards, and all data. Type <strong>DELETE</strong> to confirm.
                </p>
                <input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
                  placeholder='Type DELETE to confirm' className="input-focus"
                  style={{ width:"100%", background:"var(--inp)", border:"1px solid rgba(239,68,68,0.3)",
                    borderRadius:9, padding:"10px 13px", fontSize:13, color:"var(--tx)", marginBottom:14 }}/>
                <button onClick={handleDeleteAccount}
                  disabled={deleteConfirm !== "DELETE" || deleting}
                  style={{ height:36, padding:"0 16px", borderRadius:9,
                    border:"1px solid var(--rd)", background: deleteConfirm === "DELETE" ? "rgba(239,68,68,0.12)" : "transparent",
                    color:"var(--rd)", fontSize:13, fontWeight:700, cursor: deleteConfirm === "DELETE" ? "pointer" : "not-allowed",
                    opacity: deleteConfirm === "DELETE" ? 1 : 0.5, transition:"all .15s",
                    display:"flex", alignItems:"center", gap:8 }}>
                  {deleting
                    ? <><div className="spin" style={{ width:12, height:12, borderRadius:"50%", border:"2px solid rgba(239,68,68,.3)", borderTopColor:"var(--rd)" }}/> Deleting...</>
                    : "Delete My Account"
                  }
                </button>
              </div>
            </div>
          )}

          {tab === "data" && (
            <div>
              <h3 style={{ fontSize:15, fontWeight:800, color:"var(--tx)", marginBottom:4, fontFamily:"var(--font-display)" }}>Data & Export</h3>
              <p style={{ fontSize:12.5, color:"var(--tx2)", marginBottom:22 }}>Export and manage your data</p>
              <div style={{ borderRadius:12, border:"1px solid var(--br)", background:"var(--bg2)", padding:"20px", textAlign:"center" }}>
                <div style={{ fontSize:40, marginBottom:12, display:"flex", justifyContent:"center" }}><Icons.Download size={32} style={{ color:"var(--tx3)" }}/></div>
                <p style={{ fontSize:13.5, fontWeight:600, color:"var(--tx)", marginBottom:6 }}>Coming Soon</p>
                <p style={{ fontSize:12, color:"var(--tx3)" }}>Export your boards, tasks, and data in multiple formats coming soon.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════════════════════════════════════ */
function Sidebar({ page, setPage, theme, toggleTheme }: {
  page: Page; setPage: (p: Page) => void; theme: Theme; toggleTheme: () => void;
}) {
  const { user } = useApp();

  const mainNav: [Page, string, ReactNode][] = [
    ["overview",  "Overview",     <StarIcon size={15}/>        ],
    ["board",     "Board",        <BoardStarIcon size={15}/>   ],
    ["saved",     "Saved Boards", <SavedStarIcon size={15}/>   ],
  ];
  const aiNav: [Page, string, ReactNode, string?][] = [
    ["chat",      "AI Chat",      <ChatStarIcon size={15}/>,    "AI"   ],
    ["autopilot", "Autopilot",    <PilotStarIcon size={15}/>,   "AUTO" ],
  ];

  const boardsUsed  = user?.boards_used_today ?? 0;
  const boardsLimit = user?.plan === "pro" ? 50 : 10;
  const usagePct    = Math.min((boardsUsed / boardsLimit) * 100, 100);
  const usageColor  = usagePct >= 90 ? "var(--rd)" : usagePct >= 70 ? "var(--am)" : "var(--ac)";

  const NavBtn = ({ k, label, icon, badge }: { k: Page; label: string; icon: ReactNode; badge?: string }) => {
    const active = page === k;
    return (
      <button onClick={() => setPage(k)} className="nav-btn"
        style={{
          width:"100%", padding:"7px 10px 7px 8px", borderRadius:10, border:"none",
          background: active ? "rgba(99,102,241,0.1)" : "transparent",
          color: active ? "var(--ac)" : "var(--tx2)",
          fontSize:13, fontWeight: active ? 600 : 400,
          cursor:"pointer", display:"flex", alignItems:"center", gap:9,
          textAlign:"left", marginBottom:2, position:"relative",
          transition:"all .15s", letterSpacing:"-0.01em",
        }}>
        {/* Active left accent bar */}
        {active && (
          <span style={{
            position:"absolute", left:0, top:"20%", bottom:"20%",
            width:3, borderRadius:99,
            background:"linear-gradient(180deg, var(--ac), var(--pu))",
            boxShadow:"0 0 8px rgba(99,102,241,0.6)",
          }}/>
        )}
        {/* Icon container */}
        <span style={{
          width:32, height:32, borderRadius:9, flexShrink:0,
          display:"flex", alignItems:"center", justifyContent:"center",
          background: active
            ? "linear-gradient(135deg, rgba(99,102,241,0.22), rgba(167,139,250,0.14))"
            : "rgba(255,255,255,0.03)",
          border: active ? "1px solid rgba(99,102,241,0.25)" : "1px solid transparent",
          boxShadow: active ? "0 2px 10px rgba(99,102,241,0.25), inset 0 1px 0 rgba(255,255,255,0.08)" : "none",
          transition:"all .18s",
        }}>{icon}</span>
        <span style={{ flex:1 }}>{label}</span>
        {badge && (
          <span style={{
            fontSize:9, padding:"2px 7px", borderRadius:99,
            background: badge === "AI" ? "var(--as)" : "rgba(167,139,250,0.12)",
            color: badge === "AI" ? "var(--ac)" : "var(--pu)",
            fontWeight:700, fontFamily:"var(--font-mono)", letterSpacing:"0.04em",
            border: `1px solid ${badge === "AI" ? "var(--ag)" : "rgba(167,139,250,0.2)"}`,
          }}>{badge}</span>
        )}
      </button>
    );
  };

  return (
    <aside className="sidebar" style={{
      width: "var(--sidebar-w)", height:"100vh", position:"fixed", left:0, top:0, zIndex:50,
      background:"var(--sb)", borderRight:"1px solid var(--sidebar-border)",
      display:"flex", flexDirection:"column",
    }}>
      {/* Logo */}
      <div style={{ padding:"18px 16px 16px", borderBottom:"1px solid var(--sidebar-border)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{
            width:34, height:34, borderRadius:10,
            background:"linear-gradient(135deg, var(--ac), var(--pu))",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 2px 12px rgba(99,102,241,0.35)", flexShrink:0,
          }}>
            <Icons.Zap size={15} style={{ color:"#fff" }}/>
          </div>
          <div>
            <span style={{ fontSize:15, fontWeight:800, color:"var(--tx)", letterSpacing:"-0.04em",
              fontFamily:"var(--font-display)", display:"block", lineHeight:1.1 }}>KANBI</span>
            <span style={{ fontSize:9.5, fontWeight:600, letterSpacing:"0.02em",
              color: user?.plan === "pro" ? "var(--gr)" : "var(--ac)",
              fontFamily:"var(--font-mono)" }}>
              {user?.plan === "pro" ? "PRO PLAN" : "FREE PLAN"}
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:"10px 10px 0", overflowY:"auto" }}>
        <div className="nav-section-label">Workspace</div>
        {mainNav.map(([k, l, i]) => <NavBtn key={k} k={k} label={l} icon={i}/>)}

        <div className="nav-section-label" style={{ marginTop:18 }}>AI Features</div>
        {aiNav.map(([k, l, i, b]) => <NavBtn key={k} k={k} label={l} icon={i} badge={b}/>)}

        <div className="nav-section-label" style={{ marginTop:18 }}>Account</div>
        <NavBtn k="settings" label="Settings" icon={<SettingsStarIcon size={15}/>}/>
      </nav>

      {/* Bottom */}
      <div style={{ padding:"12px 10px 16px", borderTop:"1px solid var(--sidebar-border)", display:"flex", flexDirection:"column", gap:10 }}>
        {/* Usage */}
        <div style={{ padding:"11px 13px", borderRadius:12, background:"var(--bg2)", border:"1px solid var(--br)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:7 }}>
            <span style={{ fontSize:11, color:"var(--tx3)", fontWeight:500 }}>Boards today</span>
            <span style={{ fontSize:11, fontWeight:700, color: usagePct >= 90 ? "var(--rd)" : "var(--tx)", fontFamily:"var(--font-mono)" }}>
              {boardsUsed}<span style={{ color:"var(--tx3)", fontWeight:400 }}>/{boardsLimit}</span>
            </span>
          </div>
          <PBar value={usagePct} h={3} color={usageColor}/>
        </div>

        {/* Upgrade */}
        {user?.plan !== "pro" && (
          <button onClick={async () => {
            const res = await fetch('/api/stripe/checkout', { method: 'POST' });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
          }}
            style={{
              width:"100%", padding:"10px 13px", borderRadius:12,
              border:"1px solid rgba(245,158,11,0.2)",
              background:"linear-gradient(135deg, rgba(245,158,11,0.07), rgba(249,115,22,0.04))",
              color:"var(--am)", fontSize:12, fontWeight:700, cursor:"pointer",
              display:"flex", alignItems:"center", gap:8, transition:"all .15s",
              letterSpacing:"-0.01em",
            }}
            onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(135deg, rgba(245,158,11,0.13), rgba(249,115,22,0.08))"; }}
            onMouseOut={e =>  { (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(135deg, rgba(245,158,11,0.07), rgba(249,115,22,0.04))"; }}>
            <span style={{ width:22, height:22, borderRadius:6, background:"rgba(245,158,11,0.15)",
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Icons.Crown size={11}/>
            </span>
            Upgrade to Pro · $9/mo
          </button>
        )}

        {/* User row */}
        <div style={{ display:"flex", alignItems:"center", gap:9, padding:"6px 4px" }}>
          <Avt name={user?.full_name ?? "User"} size={32} avatarUrl={user?.avatar_url}/>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:12.5, fontWeight:600, color:"var(--tx)", overflow:"hidden",
              textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:"var(--font-display)",
              letterSpacing:"-0.02em" }}>
              {(user?.full_name ?? "User").split(" ")[0]}
            </p>
          </div>
          <button onClick={toggleTheme} className="ghost"
            style={{ width:30, height:30, borderRadius:8, border:"1px solid var(--br)",
              background:"transparent", color:"var(--tx3)", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            {theme === "dark" ? <Icons.Sun size={13}/> : <Icons.Moon size={13}/>}
          </button>
          <button className="ghost" onClick={async () => { const s = createClient(); await s.auth.signOut(); window.location.href = "/"; }}
            style={{ width:30, height:30, borderRadius:8, border:"1px solid var(--br)",
              background:"transparent", color:"var(--tx3)", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Icons.Logout size={13}/>
          </button>
        </div>
      </div>
    </aside>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   BOTTOM NAV (mobile)
═══════════════════════════════════════════════════════════════════════════ */
function BottomNav({ page, setPage }: { page: Page; setPage: (p: Page) => void }) {
  const items: [Page, string, ReactNode][] = [
    ["overview",  "Home",     <StarIcon size={19}/>        ],
    ["board",     "Board",    <BoardStarIcon size={19}/>   ],
    ["chat",      "Chat",     <ChatStarIcon size={19}/>    ],
    ["autopilot", "Pilot",    <PilotStarIcon size={19}/>   ],
    ["saved",     "Saved",    <SavedStarIcon size={19}/>   ],
    ["settings",  "Settings", <SettingsStarIcon size={19}/>],
  ];
  return (
    <div className="bottom-nav" style={{
      position:"fixed", bottom:0, left:0, right:0, zIndex:100,
      background:"var(--sb)", borderTop:"1px solid var(--br)",
      display:"none", alignItems:"center",
      paddingBottom:"env(safe-area-inset-bottom)",
      backdropFilter:"blur(12px)",
    }}>
      {items.map(([k, l, icon]) => (
        <button key={k} onClick={() => setPage(k)}
          className="bottom-nav-item"
          style={{ flex:1, padding:"8px 4px", background:"transparent", border:"none",
            color: page === k ? "var(--ac)" : "var(--tx3)",
            cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2,
            transition:"color .15s" }}>
          {icon}
          <span style={{ fontSize:9, fontWeight: page === k ? 700 : 400 }}>{l}</span>
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TOPBAR
═══════════════════════════════════════════════════════════════════════════ */
const PAGE_META: Record<Page, { title: string; sub: string; icon: React.ReactNode; gradient: string }> = {
  overview:  {
    title:"Dashboard", sub:"Your workload at a glance",
    gradient:"linear-gradient(135deg,#6366f1,#a78bfa)",
    icon:(
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  board:     {
    title:"Kanban Board", sub:"Extract and manage tasks",
    gradient:"linear-gradient(135deg,#6366f1,#06b6d4)",
    icon:(
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="5" height="18" rx="1.5"/><rect x="10" y="3" width="5" height="12" rx="1.5"/><rect x="17" y="3" width="4" height="8" rx="1.5"/>
      </svg>
    ),
  },
  chat:      {
    title:"AI Chat", sub:"Your productivity coach",
    gradient:"linear-gradient(135deg,#6366f1,#ec4899)",
    icon:(
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
      </svg>
    ),
  },
  autopilot: {
    title:"AI Autopilot", sub:"Autonomous workload management",
    gradient:"linear-gradient(135deg,#f59e0b,#6366f1)",
    icon:(
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z"/>
      </svg>
    ),
  },
  saved:     {
    title:"Saved Boards", sub:"All your boards and projects",
    gradient:"linear-gradient(135deg,#10b981,#6366f1)",
    icon:(
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  settings:  {
    title:"Settings", sub:"Account preferences",
    gradient:"linear-gradient(135deg,#64748b,#6366f1)",
    icon:(
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
};

function Topbar({ page }: { page: Page }) {
  const { user } = useApp();
  const meta = PAGE_META[page];
  return (
    <div style={{
      height:56, borderBottom:"1px solid var(--br)",
      background:"var(--bg1)", display:"flex", alignItems:"center",
      justifyContent:"space-between", padding:"0 20px", flexShrink:0,
      boxShadow:"0 1px 12px rgba(0,0,0,0.12)",
    }}>
      {/* Left: icon + title */}
      <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
        <div className="topbar-icon" style={{
          width:34, height:34, borderRadius:10, flexShrink:0,
          background:meta.gradient,
          display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow:"0 2px 10px rgba(99,102,241,0.35)",
        }}>
          {meta.icon}
        </div>
        <div style={{ minWidth:0 }}>
          <h2 className="topbar-title" style={{
            fontSize:15, fontWeight:700, color:"var(--tx)",
            fontFamily:"var(--font-display)", lineHeight:1.2,
            letterSpacing:"-0.03em", whiteSpace:"nowrap",
            overflow:"hidden", textOverflow:"ellipsis",
          }}>
            {meta.title}
          </h2>
          <p className="topbar-sub" style={{
            fontSize:11, color:"var(--tx3)", lineHeight:1, marginTop:2,
            whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
          }}>
            {meta.sub}
          </p>
        </div>
      </div>

      {/* Right: live badge + avatar */}
      <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 11px",
          borderRadius:99, background:"var(--as)", border:"1px solid var(--ag)" }}>
          <div className="pulse" style={{ width:5, height:5, borderRadius:"50%", background:"var(--gr)" }}/>
          <span style={{ fontSize:10.5, color:"var(--ac)", fontWeight:600, fontFamily:"var(--font-mono)" }}>Live</span>
        </div>
        <Avt name={user?.full_name ?? "User"} size={32} avatarUrl={user?.avatar_url}/>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ROOT kanbi Dashboard
═══════════════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const [page, setPage]   = useState<Page>("overview");
  const [theme, setTheme] = useState<Theme>("dark");

  /* ── Theme persist ── */
  useEffect(() => {
    const stored = localStorage.getItem("kanbi-theme") as Theme | null;
    if (stored) { setTheme(stored); return; }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setTheme(mq.matches ? "dark" : "light");
    const fn = (e: MediaQueryListEvent) => { if (!localStorage.getItem("kanbi-theme")) setTheme(e.matches ? "dark" : "light"); };
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(t => { const n = t === "dark" ? "light" : "dark"; localStorage.setItem("kanbi-theme", n); return n; });
  }, []);

  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetch("/api/profile").then(r => r.json()).catch(() => ({})),
      fetch("/api/usage").then(r => r.json()).catch(() => ({})),
    ]).then(([profile, usage]) => {
      setUser({
        id:                 profile.id ?? "",
        email:              profile.email ?? "",
        full_name:          profile.full_name ?? undefined,
        avatar_url:         profile.avatar_url ?? undefined,
        plan:               usage.plan === "premium" ? "pro" : "free",
        boards_used_today:  usage.boardsUsedToday ?? 0,
        ai_uses_this_month: usage.aiUsedMonth ?? 0,
      });
    }).finally(() => setIsLoading(false));
  }, []);

  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    loadTasksFromApi()
      .then(loaded => { if (loaded.length > 0) setTasks(loaded); })
      .catch(() => {});
  }, [user?.id]);

  const [savedBoards, setSavedBoards] = useState<SavedBoard[]>([]);
  useEffect(() => {
    fetch("/api/saved").then(r => r.json()).then(d => {
      if (Array.isArray(d)) setSavedBoards(d.map((b: { id: string; title?: string; content?: string; created_at?: string; updated_at?: string }) => ({
        id: b.id,
        name: b.title ?? "Untitled Board",
        taskCount: (() => { try { return JSON.parse(b.content ?? "[]").length; } catch { return 0; } })(),
        folder: "Personal",
        lastEdited: b.updated_at ? new Date(b.updated_at).toLocaleDateString() : "Unknown",
        tasks: (() => { try { return JSON.parse(b.content ?? "[]"); } catch { return []; } })(),
      })));
    }).catch(() => {});
  }, []);

  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  useEffect(() => {
    fetch('/api/ai/chat')
      .then(r => r.json())
      .then(d => {
        if (!Array.isArray(d.messages) || d.messages.length === 0) return;
        setChatMessages(d.messages.map((m: { role?: string; message?: string; timestamp?: string }, i: number) => ({
          id: `hist-${i}-${m.timestamp ?? i}`,
          role: m.role === 'assistant' ? 'ai' as const : 'user' as const,
          content: sanitizeChatText(m.message ?? ''),
          ts: formatChatTime(m.timestamp),
        })));
      })
      .catch(() => {});
  }, [user?.id]);
  const [briefings, setBriefings]       = useState<Briefing[]>([]);
  const [burnoutAlerts]                 = useState<BurnoutAlert[]>([]);
  const [boardView, setBoardView]       = useState<BoardView>("input");
  const navigate = useCallback((p: Page) => setPage(p), []);

  const appState: AppState = {
    tasks, setTasks, savedBoards, setSavedBoards,
    chatMessages, setChatMessages, briefings, setBriefings,
    burnoutAlerts,
    dailyGoal: 5, weeklyGoal: 30,
    boardView, setBoardView, navigate,
    user, isLoading,
  };

  return (
    <AppCtx.Provider value={appState}>
      <GlobalStyles theme={theme}/>
      <div className="root-layout" style={{ display:"flex", height:"100vh", background:"var(--bg)", overflow:"hidden" }}>
        <Sidebar page={page} setPage={setPage} theme={theme} toggleTheme={toggleTheme}/>
        <div className="main-wrap" style={{ marginLeft:"var(--sidebar-w)", flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          {page !== "chat" && <Topbar page={page}/>}
          <div style={{ flex:1, overflow:"hidden" }}>
            {page === "overview"  && <PageOverview/>}
            {page === "board"     && <PageBoard/>}
            {page === "chat"      && <PageChat/>}
            {page === "autopilot" && <PageAutopilot/>}
            {page === "saved"     && <PageSaved/>}
            {page === "settings"  && <PageSettings theme={theme} toggleTheme={toggleTheme}/>}
          </div>
        </div>
        <BottomNav page={page} setPage={setPage}/>
      </div>
    </AppCtx.Provider>
  );
}
