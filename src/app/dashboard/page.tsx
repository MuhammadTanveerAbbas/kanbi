"use client";


import {
  useState, useEffect, useRef, useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/lib/theme";
import {
  AppCtx, useApp,
  type Page, type Priority, type TaskStatus, type Theme, type InputMode, type BoardView,
  type Task, type SavedBoard, type ChatMsg, type Briefing, type BurnoutAlert, type AuthUser, type AppState,
} from "@/components/dashboard/types";
import {
  Icons, StarIcon, BoardStarIcon, SavedStarIcon, ChatStarIcon, ChatBotIcon, PilotStarIcon, SettingsStarIcon,
} from "@/components/dashboard/icons";
import { PriBadge, Avt, PBar, Toggle, Skeleton, Spinner, EmptyState, Field, StatNote } from "@/components/dashboard/ui";
import { HealthRing } from "@/components/dashboard/charts";
import { useBoardExport } from "@/components/dashboard/use-board-export";
import { normalizeBriefingResponse } from "@/lib/autopilot/normalize";
import { BOARD_TEMPLATES } from "@/lib/templates";
import { ChatBubble } from "@/components/dashboard/chat-bubble";
import { QUICK_ACTIONS, CHAT_ERRORS, CHAT_EMPTY_STATE, type QuickActionId } from "@/lib/ai/chat-copy";
import { normalizeChatReply } from "@/lib/text/normalize";
import {
  computeBoardHealthScore, healthBand, healthMessage, type HealthBand,
} from "@/lib/workload/health-score";

const HEALTH_BAND_LABELS: Record<HealthBand, string> = {
  healthy: "Healthy",
  moderate: "Moderate",
  overloaded: "Overloaded",
};

const HEALTH_BAND_BG: Record<HealthBand, string> = {
  healthy: "rgba(16,185,129,0.1)",
  moderate: "rgba(245,158,11,0.1)",
  overloaded: "rgba(239,68,68,0.1)",
};

const HEALTH_BAND_FG: Record<HealthBand, string> = {
  healthy: "var(--gr)",
  moderate: "var(--am)",
  overloaded: "var(--rd)",
};

const HEALTH_BAND_BORDER: Record<HealthBand, string> = {
  healthy: "rgba(16,185,129,0.25)",
  moderate: "rgba(245,158,11,0.25)",
  overloaded: "rgba(239,68,68,0.25)",
};

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

function formatChatTime(value?: string): string {
  if (!value) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Dashboard-only styles.
 *
 * The palette is not repeated here. It is emitted once into the document head by
 * the root layout, which is what lets the blocking theme script set the correct
 * theme before the first paint. This element used to interpolate
 * `appThemeVars(theme)` from React state, so the server always emitted the light
 * palette, the browser painted it, and hydration corrected it a frame later.
 */
function GlobalStyles() {
  return (
<style>{`
      *,*::before,*::after { box-sizing:border-box; margin:0; padding:0 }

      /* ── Scales ──────────────────────────────────────────────────────────
         One radius scale, one gap scale, one inset scale. Every card, panel
         and grid in the dashboard reads from these instead of restating
         11px or 13px, which is how four slightly different card paddings and
         seven gap values ended up on the same screen. */
      :root {
        --radius-sm:8px; --radius-md:12px; --radius-lg:16px; --radius-xl:22px;
        --ur:#f97316;
        --sidebar-w:236px;
        --content-max:1140px;
        --chat-max:960px;
        --gap-1:8px; --gap-2:12px; --gap-3:16px; --gap-4:24px;
        --pad-1:10px; --pad-2:14px; --pad-3:20px; --pad-4:26px;
        /* The mobile nav sits on top of the page, so every page that scrolls
           has to reserve its height plus the iOS home indicator inset. */
        --bottom-nav-h:64px;
        --bottom-nav-safe:calc(var(--bottom-nav-h) + env(safe-area-inset-bottom));
      }

      body {
        background:
          radial-gradient(circle at top left, var(--dash-glow-a), transparent 32%),
          radial-gradient(circle at top right, var(--dash-glow-b), transparent 28%),
          var(--bg);
        color: var(--tx);
        -moz-osx-font-smoothing: grayscale;
        overflow: hidden;
        height: 100vh;
      }
      [data-theme='dark'] body { --dash-glow-a: rgba(99,102,241,0.10); --dash-glow-b: rgba(168,85,247,0.08); }
      [data-theme='light'] body { --dash-glow-a: rgba(99,102,241,0.07); --dash-glow-b: rgba(168,85,247,0.05); }

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
      @keyframes pulse     { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(.5)} }
      @keyframes spin      { from{transform:rotate(0)} to{transform:rotate(360deg)} }
      @keyframes slideR    { from{transform:translateX(-12px);opacity:0} to{transform:translateX(0);opacity:1} }
      @keyframes shimmer   { from{background-position:-200% 0} to{background-position:200% 0} }
      @keyframes countUp   { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }

      /* ── Utility classes ── */
      .fade-up   { animation: fadeUp .36s cubic-bezier(.22,1,.36,1) both }
      .fade-in   { animation: fadeIn .26s ease both }
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

      /* ── Panels ──────────────────────────────────────────────────────────
         The single card container. Anything that used to repeat
         border + background + a hand picked radius and padding is one of
         these now. */
      .panel {
        background: var(--bg1);
        border: 1px solid var(--br);
        border-radius: var(--radius-lg);
        padding: var(--pad-2);
        min-width: 0;
      }
      .panel-sm { padding: var(--pad-1); border-radius: var(--radius-md); }
      .panel-lg { padding: var(--pad-3); }
      .panel-xl { padding: var(--pad-4); }

      .panel-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--gap-1);
        margin-bottom: var(--gap-2);
        min-width: 0;
      }
      .panel-title {
        font-size: 12px;
        font-weight: 700;
        color: var(--tx);
        font-family: var(--font-display);
        letter-spacing: -0.02em;
        min-width: 0;
      }

      /* Page shell. The inline padding each page used to carry is here once. */
      .page-pad {
        height: 100%;
        overflow-y: auto;
        overflow-x: hidden;
        padding: var(--pad-2) var(--pad-3);
        display: flex;
        flex-direction: column;
        gap: var(--gap-3);
      }
      .page-title {
        font-size: 22px;
        font-weight: 800;
        letter-spacing: -0.035em;
        color: var(--tx);
        font-family: var(--font-display);
        margin-bottom: 3px;
      }
      .page-sub { font-size: 13px; color: var(--tx2) }

      /* The menu button only exists below 1024px, where the sidebar is a
         drawer rather than a column. */
      .mob-menu-btn { display:none !important; background:transparent; border:none; padding:0; cursor:pointer }

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
        min-width: 0;
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
      /* The glow layer needs overflow hidden, but clipping the card also clips
         the focus ring of anything focusable inside it. */
      .card:focus-within { overflow: visible }

      /* ── Task cards ── */
      .task-card { transition: border-color .15s, background .15s, transform .15s, box-shadow .15s }
      .task-card:hover { border-color:rgba(99,102,241,0.3) !important; background:var(--bg2) !important; transform:translateX(2px); box-shadow:0 2px 12px rgba(0,0,0,0.2) }

      /* ── Buttons ─────────────────────────────────────────────────────────
         One primary, one ghost, one danger, one icon only. Height, radius,
         padding, disabled state and focus treatment are defined once here
         instead of on every inline style. */
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        height: 38px;
        padding: 0 14px;
        border-radius: var(--radius-sm);
        border: 1px solid transparent;
        font-size: 13px;
        font-weight: 600;
        white-space: nowrap;
        flex-shrink: 0;
        transition: background .15s, color .15s, border-color .15s, filter .15s,
                    transform .1s, box-shadow .15s, opacity .15s;
      }
      .btn:disabled { opacity: .5; cursor: not-allowed; pointer-events: none }
      .btn-sm { height: 30px; padding: 0 10px; font-size: 12px; gap: 5px }
      .btn-icon { width: 32px; height: 32px; padding: 0; border-radius: var(--radius-sm) }

      .btn-primary { background: var(--ac); color: #fff; box-shadow: 0 2px 12px rgba(99,102,241,0.28) }
      .btn-primary:hover:not(:disabled) { filter: brightness(1.08); box-shadow: 0 14px 34px rgba(99,102,241,0.28); transform: translateY(-1px) }
      .btn-primary:active:not(:disabled) { transform: scale(.97) }

      .btn-ghost {
        background: transparent;
        border-color: var(--br);
        color: var(--tx2);
      }
      .btn-ghost:hover:not(:disabled) {
        background: rgba(99,102,241,0.07);
        border-color: rgba(99,102,241,0.2);
        color: var(--tx);
      }
      .btn-quiet { background: var(--bg2); border-color: var(--br); color: var(--tx) }
      .btn-quiet:hover:not(:disabled) { background: var(--bg3); border-color: var(--brh) }
      .btn-danger { background: transparent; border-color: rgba(239,68,68,0.28); color: var(--rd) }
      .btn-danger:hover:not(:disabled) { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.45) }

      /* Any element that was a one off ghost button before now uses these.
         The hover rules live here so no inline onMouseOver is needed. */
      .ghost {
        transition: background .15s, color .15s, border-color .15s, transform .1s, box-shadow .15s;
      }
      .ghost:hover {
        background:rgba(99,102,241,0.07) !important;
        border-color:rgba(99,102,241,0.20) !important;
        box-shadow:0 8px 20px rgba(0,0,0,0.06);
      }

      /* ── Inputs ── */
      .input-focus { transition: border-color .15s, box-shadow .15s; outline: none }
      .input-focus:focus { border-color: var(--ac) !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.14) }

      /* The composer used to set outline none and box shadow none on focus,
         which left the primary input on the page with no focus indicator at
         all. It now uses the same ring as every other input. */
      .chat-input { transition: border-color .15s, box-shadow .15s }
      .chat-input:focus {
        outline: none !important;
        border-color: var(--br) !important;
        box-shadow: none !important;
      }

      /* ── Skeleton ── */
      .skeleton {
        background: linear-gradient(90deg, var(--bg2) 25%, var(--bg3) 50%, var(--bg2) 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: var(--radius-sm);
      }

      /* ── Empty state ───────────────────────────────────────────────────── */
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        gap: 6px;
        padding: var(--pad-4) var(--pad-2);
      }
      .empty-state-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 46px;
        height: 46px;
        border-radius: var(--radius-md);
        background: var(--bg2);
        border: 1px solid var(--br);
        color: var(--tx3);
        margin-bottom: 6px;
        flex-shrink: 0;
      }
      .empty-state-title { font-size: 13.5px; font-weight: 600; color: var(--tx) }
      .empty-state-body {
        font-size: 12px;
        line-height: 1.6;
        color: var(--tx3);
        max-width: 320px;
      }
      .empty-state-sm { padding: var(--pad-3) var(--pad-2) }
      .empty-state-sm .empty-state-icon { width: 36px; height: 36px; border-radius: var(--radius-sm) }
      .empty-state-sm .empty-state-title { font-size: 12.5px }
      .empty-state-sm .empty-state-body { font-size: 11.5px }

      /* ── Autopilot cards ───────────────────────────────────────────────
         Small stat pill for the live-sync and burnout rows, and a timeline
         row for the generated schedule. */
      .autopilot-stat-chip {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 5px 10px;
        border-radius: 100px;
        font-size: 10.5px;
        font-weight: 700;
        font-family: var(--font-mono);
        background: var(--bg2);
        border: 1px solid var(--br);
        color: var(--tx2);
        white-space: nowrap;
      }

      .autopilot-timeline-row {
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 9px 12px;
        border-radius: 9px;
        background: var(--bg2);
        border: 1px solid var(--br);
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
        padding: 10px 14px;
        box-shadow: 0 14px 40px rgba(0,0,0,0.10);
      }
      .quick-ai-header {
        display: flex;
        align-items: center;
        gap: 9px;
        margin-bottom: 8px;
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
      .quick-ai-btn:hover:not(:disabled) { filter: brightness(1.1); box-shadow: 0 4px 18px rgba(99,102,241,0.42) }
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

      /* ── Breakpoints ─────────────────────────────────────────────────────
         Three, and only three: tablet, phone, narrow phone. */
      @media(max-width:1024px) {
        .xl-hide { display:none !important }
        .main-grid-3 { grid-template-columns:1fr 1fr !important }
        .main-wrap { margin-left:0 !important }
        .bottom-nav { display:flex !important; height:var(--bottom-nav-h); align-items:stretch }
        .sidebar { display:none !important }

        /* dvh rather than vh: on a phone vh is the full screen height including
           the area behind the browser chrome, so the page reserved more than it
           could show and left a gap under the last row. */
        .root-layout { height:auto !important; min-height:100dvh; overflow:visible !important }
        body { overflow:auto; height:auto }
        /* The page scrolls under a fixed nav, so the last row of every page
           needs the nav height plus the home indicator, not a guess. */
        .page-pad { padding-bottom:calc(var(--bottom-nav-safe) + var(--gap-2)) !important }
        /* The chat page replaces the topbar with its own header, so it owns
           everything below the nav. The old calc used vh and forgot the iOS
           inset, which put the composer behind the home indicator. */
        .chat-page { height:calc(100dvh - var(--bottom-nav-safe)) !important; min-height:0 !important }
        .chat-btn-label { display:none !important }

        /* ── Mobile navigation drawer ──
           The menu button and the sidebar were both hidden below 1024px while
           the bottom nav carried every page, so the theme toggle and sign out
           had no reachable control on a tablet. The sidebar becomes a drawer
           that the menu button opens instead of disappearing. */

      }
      @media(min-width:1025px) {
        .sidebar-backdrop { display: none }
        .bottom-nav { display:none !important }
      }

      /* Coarse pointers get a 44px target. Every icon only control in the
         dashboard is 30 to 32px on a desktop sized grid, which is under the
         minimum and impossible to hit with a thumb. */
      @media(pointer:coarse) {
        .btn-icon { width:44px; height:44px }
        .btn-sm { height:38px; padding:0 12px; font-size:13px }
        .bottom-nav-item { min-height:44px }
      }

      @media(max-width:768px) {
        .topbar-wrap { padding:0 14px !important }
        .topbar-live { display:none !important }
        .main-grid-2 { grid-template-columns:1fr !important }
        .main-grid-3 { grid-template-columns:1fr !important }
        .main-grid-4 { grid-template-columns:1fr 1fr !important }
        .page-pad { padding:var(--pad-2) 14px calc(var(--bottom-nav-safe) + var(--gap-2)) !important }
        .kanban-grid { grid-template-columns:1fr !important; min-width:0 !important; gap:var(--gap-3) !important }
        .board-kanban-header { flex-direction:column !important; align-items:stretch !important; padding:12px 14px !important; gap:10px !important }
        .board-kanban-title { flex-wrap:wrap !important }
        .board-kanban-actions { width:100% !important; justify-content:space-between !important }
        .board-kanban-pad { padding:14px !important }
        .chat-sidebar { display:none !important }
        .chat-header { height:46px !important; padding:0 12px !important }
        .chat-header-title { font-size:13px !important }
        .chat-header-sub { display:none !important }
        .chat-messages { padding:12px 14px !important }
        .chat-quick-actions { padding:0 14px 10px !important }
        .chat-input-bar { padding:10px 14px !important }
        .chat-input-hint { display:none !important }
        .settings-grid { gap:10px !important }
        /* Six tabs in two rows of three, with a real touch target, rather
           than four per row with a 10px label and a 4px inset. */
        .settings-tabs { grid-template-columns:repeat(3,1fr) !important; gap:6px !important }
        .settings-tabs button { font-size:11.5px !important; padding:12px 6px !important; min-height:44px !important }
        .settings-tabs button span:first-child { font-size:14px !important }
        .settings-panel { padding:var(--pad-3) !important; border-radius:var(--radius-md) !important }
        .settings-appearance-row { flex-direction:column !important; align-items:flex-start !important; gap:10px !important }
        .settings-appearance-row button { width:100% !important }
        .settings-billing-row { flex-direction:column !important; align-items:flex-start !important; gap:10px !important }
        .settings-billing-row button { width:100% !important }
        .saved-grid { grid-template-columns:1fr 1fr !important }
        .autopilot-grid { grid-template-columns:1fr !important }
        .autopilot-sync-bar { flex-wrap:wrap !important; row-gap:8px !important }
        .autopilot-sync-chips { flex-wrap:wrap !important }
        .overview-quick-actions { grid-template-columns:1fr 1fr !important }
        .quick-ai-sub { display:none }
        .quick-ai-badge { display:none }
        .topbar-sub { display:none }
        .stat-value { font-size:20px !important }
        /* The card action row cannot hold five controls across two columns at
           375px, so it wraps and each button keeps a full target. */
        .card-actions > .btn-icon { flex: 0 0 auto }
        .board-input-grid { grid-template-columns:1fr !important }
      }
      @media(max-width:480px) {
        .main-grid-4 { grid-template-columns:1fr !important }
        .saved-grid { grid-template-columns:1fr !important }
        .page-pad { padding:var(--pad-1) 12px calc(var(--bottom-nav-safe) + var(--gap-2)) !important }
        .quick-ai-row { flex-wrap:wrap }
        .quick-ai-input { flex:1 1 100% }
        .quick-ai-btn { width:100%; justify-content:center }
        .topbar-title { font-size:13px !important }
        .topbar-icon { width:28px !important; height:28px !important; border-radius:8px !important }
        .chat-prompts { grid-template-columns:1fr !important; max-width:100% !important }
        .settings-tabs { grid-template-columns:repeat(2,1fr) !important; gap:5px !important }
        .settings-tabs button { font-size:11px !important; padding:12px 6px !important }
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
    <article className="task-card panel panel-sm" style={{ marginBottom: 8 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:9,
        marginBottom: compact ? 0 : 9 }}>
        {/* minWidth 0 keeps a long title from widening the kanban column
            instead of wrapping inside it. */}
        <p style={{ fontSize: compact ? 11.5 : 13, color:"var(--tx)", fontWeight:500,
          lineHeight:1.5, flex:1, minWidth:0, letterSpacing:"-0.01em",
          overflowWrap:"anywhere" }}>{task.title}</p>
        <PriBadge p={task.priority}/>
      </div>
      {!compact && (
        <div style={{ display:"flex", alignItems:"center", gap:5, flexWrap:"wrap", marginBottom:10 }}>
          <span style={{ fontSize:10, padding:"2px 8px", borderRadius:99, background:"var(--as)",
            color:"var(--ac-text)", fontWeight:600, fontFamily:"var(--font-mono)", border:"1px solid var(--ag)" }}>{task.label}</span>
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
      {!compact && onStatusChange && task.status !== "done" && (
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          <button
            onClick={() => onStatusChange(task.id, task.status === "todo" ? "wip" : "done")}
            className="btn btn-ghost btn-sm"
          >
            <Icons.Check size={10}/> {task.status === "todo" ? "Start" : "Done"}
          </button>
        </div>
      )}
    </article>
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
  const healthScore = computeBoardHealthScore(tasks);
  const band = healthBand(healthScore);

  const [quickInput, setQuickInput] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const timeOfDay: "morning" | "afternoon" | "evening" = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

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
  const boardsLimit   = user?.boards_today_limit ?? 10;
  const aiLimit       = user?.ai_month_limit ?? 300;

  const statCards = [
    { label:"Boards Today",  value:`${boardsToday}/${boardsLimit}`, sub:`${Math.max(boardsLimit - boardsToday, 0)} remaining`, icon:<Icons.Board size={13}/>, prog: boardsToday / boardsLimit * 100 },
    { label:"AI This Month", value:`${aiUsesMonth}/${aiLimit}`, sub:`${Math.max(aiLimit - aiUsesMonth, 0)} remaining`, icon:<Icons.Autopilot size={13}/>, color:"var(--pu-text)" },
    { label:"Tasks Total",   value:String(total), sub:`${done} done · ${wip} in progress`, icon:<Icons.Target size={13}/>, color: done === total && total > 0 ? "var(--gr)" : undefined },
    { label:"Plan",          value: user?.plan === "pro" ? "Pro" : "Free", icon:<Icons.Crown size={13}/>, color:"var(--am-text)" },
  ];

  const QUICK_NAV: { label: string; icon: ReactNode; page: Page; color: string }[] = [
    { label:"New Task",    icon:<Icons.Plus size={15}/>,     page:"board",     color:"var(--ac-text)" },
    { label:"View Board",  icon:<Icons.Layers size={15}/>,   page:"board",     color:"var(--pu-text)" },
    { label:"Assistant",   icon:<Icons.Zap size={15}/>,      page:"chat",      color:"var(--am-text)" },
    { label:"Settings",    icon:<Icons.Settings size={15}/>, page:"settings",  color:"var(--gr-text)" },
  ];

  return (
    <div className="fade-up page-pad">

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8 }}>
        <div>
          {isLoading
            ? <><Skeleton w={220} h={24} style={{ marginBottom:6 }}/><Skeleton w={160} h={14}/></>
            : <>
                {/* The topbar owns the page's h1. This greeting is the first
                    thing under it, so it is an h2. */}
                <h2 style={{ fontSize:20, fontWeight:800, letterSpacing:"-0.035em", color:"var(--tx)",
                  marginBottom:2, fontFamily:"var(--font-display)", display:"flex", alignItems:"center", gap:8 }}>
                  {greeting}, {displayName}
                  <TimeOfDayIcon tod={timeOfDay} />
                </h2>
                <p className="page-sub">Here&rsquo;s your workload snapshot</p>
              </>
          }
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span aria-hidden="true" className="pulse" style={{ width:6, height:6, borderRadius:"50%", background:"var(--gr)", flexShrink:0 }}/>
          <span style={{ fontSize:12, color:"var(--gr-text)", fontWeight:600 }}>All systems active</span>
        </div>
      </div>

      {/* Quick AI input */}
      <div className="quick-ai-bar">
        <div className="quick-ai-header">
          <div className="quick-ai-icon"><Icons.Zap size={13}/></div>
          <span className="quick-ai-title">Quick AI Extract</span>
          <span className="quick-ai-sub">Paste any text and it becomes tasks on your board</span>

        </div>
        <div className="quick-ai-row">
          <input
            value={quickInput}
            onChange={e => setQuickInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleQuickInput()}
            placeholder="Paste a task, email, or note to turn into board items..."
            aria-label="Text to turn into board tasks"
            className="quick-ai-input"
          />
          <button
            onClick={handleQuickInput}
            disabled={!quickInput.trim() || addLoading}
            className="quick-ai-btn"
          >
            {addLoading ? <Spinner size={12}/> : <Icons.Zap size={12}/>}
            Extract
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <nav aria-label="Quick navigation" className="overview-quick-actions"
        style={{ display:"grid", gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:10 }}>
        {QUICK_NAV.map(a => (
          <button key={a.label}
            onClick={() => navigate(a.page)}
            className="ghost"
            style={{
              display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:7,
              padding:"12px 10px", borderRadius:"var(--radius-md)", background:"var(--bg1)",
              border:"1px solid var(--br)", color:"var(--tx2)", fontSize:12, fontWeight:600,
            }}>
            <span aria-hidden="true" style={{ color:a.color, display:"flex", alignItems:"center", justifyContent:"center" }}>
              {a.icon}
            </span>
            {a.label}
          </button>
        ))}
      </nav>

      <div className="main-grid-4 stagger" style={{ display:"grid", gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:12 }}>
        {statCards.map(s => (
          <div key={s.label} className="card panel fade-up">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:6, marginBottom:7 }}>
              <span style={{ fontSize:11, color:"var(--tx2)", fontWeight:600, letterSpacing:"0.01em" }}>{s.label}</span>
              <span aria-hidden="true" style={{ color:"var(--tx3)", flexShrink:0 }}>{s.icon}</span>
            </div>
            {isLoading
              ? <Skeleton w="60%" h={28} style={{ marginBottom:6 }}/>
              : <div className="stat-value" style={{ fontSize:25, fontWeight:800, letterSpacing:"-0.045em",
                  color: s.color ?? "var(--tx)", lineHeight:1, marginBottom:4,
                  fontFamily:"var(--font-display)", animation:"countUp .5s ease both" }}>
                  {s.value}
                </div>
            }
            <StatNote>
              {/* The plan card is a link to billing, so its note is a real
                  button. The previous version put an icon inside a plain text
                  string, which React rendered as the literal markup. */}
              {s.label === "Plan"
                ? user?.plan === "pro"
                  ? "All features unlocked"
                  : <button onClick={() => navigate("settings")}
                      className="ghost"
                      style={{ color:"var(--ac-text)", fontSize:10.5, fontWeight:600, display:"inline-flex",
                        alignItems:"center", gap:3, padding:0, background:"transparent", border:"none" }}>
                      $9/mo for Pro <Icons.ArrowRight size={10}/>
                    </button>
                : s.sub}
            </StatNote>
            {"prog" in s && s.prog !== undefined && (
              <div style={{ marginTop:10 }}>
                <PBar value={s.prog} h={3} color="var(--ac)" label={`${s.label} usage`}/>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Health + Goals + Priority */}
      <div className="main-grid-3" style={{ display:"grid", gridTemplateColumns:"repeat(3,minmax(0,1fr))", gap:12, alignItems:"stretch" }}>

        {/* Workload Health */}
        <section className="card panel" style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div className="panel-head" style={{ marginBottom:0 }}>
            <h3 className="panel-title">Workload Health</h3>
            <span style={{ fontSize:10, padding:"2px 8px", borderRadius:99, fontWeight:700, fontFamily:"var(--font-mono)",
              background: HEALTH_BAND_BG[band],
              color: HEALTH_BAND_FG[band],
              border: `1px solid ${HEALTH_BAND_BORDER[band]}`,
            }}>{HEALTH_BAND_LABELS[band]}</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <HealthRing score={healthScore}/>
            <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}>
              {[
                { l:"Total",       v:String(total),                                    c:"var(--tx)" },
                { l:"Done",        v:String(done),                                     c:"var(--gr)" },
                { l:"In Progress", v:String(tasks.filter(t=>t.status==="wip").length), c:"var(--am)" },
              ].map(s => (
                <div key={s.l} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                  padding:"4px 8px", borderRadius:7, background:"var(--bg2)" }}>
                  <span style={{ fontSize:11, color:"var(--tx3)" }}>{s.l}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:s.c, fontFamily:"var(--font-mono)" }}>{s.v}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding:"8px 11px", borderRadius:8, marginTop:"auto",
            background: HEALTH_BAND_BG[band],
            border: `1px solid ${HEALTH_BAND_BORDER[band]}` }}>
            <p style={{ fontSize:11, lineHeight:1.5, color: HEALTH_BAND_FG[band] }}>
              {healthMessage(healthScore)}
            </p>
          </div>
        </section>

        {/* Goals */}
        <section className="card panel" style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div className="panel-head" style={{ marginBottom:0 }}>
            <h3 className="panel-title">Your Goals</h3>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8, flex:1 }}>
            {[
              { label:"Daily Tasks",     current:done,       goal:dailyGoal,  color:"var(--ac-text)" },
              { label:"Weekly Tasks",    current:weeklyDone, goal:weeklyGoal, color:"var(--gr-text)" },
              { label:"Completion Rate", current:total > 0 ? Math.round((done/total)*100) : 0, goal:100, color:"var(--pu-text)", suffix:"%" },
            ].map(g => (
              <div key={g.label} style={{ padding:"9px 11px", borderRadius:9, background:"var(--bg2)", border:"1px solid var(--br)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:7 }}>
                  <span style={{ fontSize:11.5, color:"var(--tx2)" }}>{g.label}</span>
                  <span style={{ fontSize:12, fontWeight:800, color:g.color, fontFamily:"var(--font-mono)" }}>
                    {g.current}<span style={{ fontSize:10, fontWeight:500, color:"var(--tx3)" }}>/{g.goal}{(g as any).suffix ?? ""}</span>
                  </span>
                </div>
                <PBar value={(g.current / g.goal) * 100} color={g.color} h={5} label={`${g.label} progress`}/>
              </div>
            ))}
          </div>
        </section>

        {/* Priority Breakdown. Each row names its priority in words as well as
            carrying the colour, so the meaning survives without hue. */}
        <section className="card panel" style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div className="panel-head" style={{ marginBottom:0 }}>
            <h3 className="panel-title">Priority Breakdown</h3>
            <span style={{ fontSize:10, color:"var(--tx3)", fontFamily:"var(--font-mono)", flexShrink:0 }}>{total} total</span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:7, flex:1 }}>
            {[
              { label:"Urgent", count:urgentCount, color:"var(--am-text)", bg:"rgba(249,115,22,0.08)",  border:"rgba(249,115,22,0.2)"  },
              { label:"High",   count:highCount,   color:"var(--rd-text)", bg:"rgba(239,68,68,0.08)",   border:"rgba(239,68,68,0.2)"   },
              { label:"Medium", count:mediumCount, color:"var(--am-text)", bg:"rgba(245,158,11,0.08)",  border:"rgba(245,158,11,0.2)"  },
              { label:"Low",    count:lowCount,    color:"var(--tx3)", bg:"var(--bg2)",            border:"var(--br)"             },
            ].map(p => (
              <div key={p.label} style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"9px 11px", borderRadius:9, background:p.bg, border:`1px solid ${p.border}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:0 }}>
                  <span aria-hidden="true" style={{ width:7, height:7, borderRadius:"50%", background:p.color, flexShrink:0,
                    boxShadow:`0 0 6px ${p.color}` }}/>
                  <span style={{ fontSize:12, color:"var(--tx2)", fontWeight:500 }}>{p.label}</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                  <span style={{ fontSize:13, fontWeight:800, color:p.color, fontFamily:"var(--font-mono)" }}>{p.count}</span>
                  {total > 0 && <span style={{ fontSize:10, color:"var(--tx3)", fontFamily:"var(--font-mono)" }}>{Math.round((p.count/total)*100)}%</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── Recent Boards ── */}
      {savedBoards.length > 0 ? (
        <section className="fade-up" style={{ animationDelay: ".25s" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
            marginBottom:12, gap:10, flexWrap:"wrap" }}>
            <div>
              <h3 style={{ fontSize:16, fontWeight:800, color:"var(--tx)", fontFamily:"var(--font-display)",
                letterSpacing:"-0.03em", marginBottom:3 }}>Recent Boards</h3>
              <p style={{ fontSize:11.5, color:"var(--tx3)" }}>Jump back into your latest work</p>
            </div>
            <button onClick={() => navigate("saved")} className="btn btn-ghost btn-sm"
              style={{ color:"var(--ac-text)" }}>
              View all <Icons.ChevronRight size={12}/>
            </button>
          </div>

          <div className="saved-grid"
            style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:12 }}>
            {savedBoards.slice(0, 4).map((b, idx) => {
              const ACCENTS = ["var(--ac)","var(--pu)","var(--gr)","var(--am)"] as const;
              const BGSOF  = ["rgba(99,102,241,0.08)","rgba(167,139,250,0.08)","rgba(16,185,129,0.08)","rgba(245,158,11,0.08)"] as const;
              const BORDER = ["rgba(99,102,241,0.22)","rgba(167,139,250,0.22)","rgba(16,185,129,0.22)","rgba(245,158,11,0.22)"] as const;
              const accent = ACCENTS[idx % 4];
              const donePct = b.tasks.length > 0
                ? Math.round((b.tasks.filter(t => t.status === "done").length / b.tasks.length) * 100)
                : 0;
              return (
                /* A button, not a div with a click handler. The card is the
                   primary action for the whole board, so it has to be
                   reachable by keyboard and announce what it opens. */
                <button key={b.id}
                  onClick={() => { setTasks(b.tasks); setBoardView("kanban"); navigate("board"); }}
                  className="card panel"
                  style={{ textAlign:"left", position:"relative", display:"block" }}>

                  {/* Top accent bar */}
                  <span aria-hidden="true" style={{
                    position:"absolute", top:0, left:0, right:0, height:3,
                    background:`linear-gradient(90deg, ${accent}, transparent 80%)`,
                    borderRadius:"var(--radius-lg) var(--radius-lg) 0 0",
                    pointerEvents:"none",
                  }}/>

                  {/* Icon + folder badge */}
                  <span style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
                    marginBottom:12, gap:8 }}>
                    <span aria-hidden="true" style={{
                      width:42, height:42, borderRadius:"var(--radius-md)",
                      background:BGSOF[idx % 4], border:`1px solid ${BORDER[idx % 4]}`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      color:accent, flexShrink:0,
                    }}>
                      <Icons.Layers size={17}/>
                    </span>
                    <span style={{
                      fontSize:10, padding:"3px 9px", borderRadius:100,
                      background:"var(--bg2)", border:"1px solid var(--br)",
                      color:"var(--tx3)", fontFamily:"var(--font-mono)", fontWeight:600,
                      minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                    }}>{b.folder}</span>
                  </span>

                  {/* Board name */}
                  <span style={{
                    display:"block", fontSize:14, fontWeight:700, color:"var(--tx)", marginBottom:6,
                    fontFamily:"var(--font-display)", letterSpacing:"-0.02em",
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                  }}>{b.name}</span>

                  {/* Meta row */}
                  <span style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10, flexWrap:"wrap" }}>
                    <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color:"var(--tx3)" }}>
                      <span aria-hidden="true" style={{ width:5, height:5, borderRadius:"50%", background:accent, flexShrink:0 }}/>
                      {b.taskCount} tasks
                    </span>
                    <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color:"var(--tx3)" }}>
                      <Icons.Clock size={10}/>{b.lastEdited}
                    </span>
                  </span>

                  {/* Progress */}
                  <span style={{ display:"block", marginBottom:10 }}>
                    <span style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                      <span style={{ fontSize:10.5, color:"var(--tx3)" }}>Completion</span>
                      <span style={{ fontSize:10.5, fontWeight:700, color:accent, fontFamily:"var(--font-mono)" }}>{donePct}%</span>
                    </span>
                    <PBar value={donePct} h={4} color={accent} label={`${b.name} completion`}/>
                  </span>

                  {/* CTA */}
                  <span style={{
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
                      Open <Icons.ChevronRight size={11}/>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : (
        /* An empty board list still needs somewhere to start, so the empty
           state carries the action rather than a sentence telling the user to
           go and find it elsewhere. */
        <section className="fade-up panel" style={{ padding:0 }}>
          <EmptyState
            small
            icon={<Icons.Saved size={20}/>}
            title="No boards saved yet"
            body="Save the board you are working on and it will show up here to reopen in one click."
            action={
              <button onClick={() => navigate("board")} className="btn btn-primary btn-sm">
                <Icons.Plus size={12}/> Go to the board
              </button>
            }
          />
        </section>
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
  const [urlInput, setUrlInput] = useState("");
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
    { key:"url"      as InputMode, label:"URL",       icon:<Icons.Link size={12}/>  },
    { key:"pdf"      as InputMode, label:"PDF",       icon:<Icons.Pdf size={12}/>   },
    { key:"template" as InputMode, label:"Templates", icon:<Icons.Template size={12}/> },
  ];

  /**
   * Fetches a public web page server side and turns its readable text into
   * tasks. The URL is never fetched from the browser, so the server side SSRF
   * protections apply and the page's address is not leaked to third parties.
   */
  const handleUrlExtract = async () => {
    const url = urlInput.trim();
    if (!url) return;
    setExtracting(true);
    setExtractError("");
    try {
      const res = await fetch('/api/parse-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setExtractError(data.error ?? 'Could not read that page. Try a different URL.');
        return;
      }
      if (!Array.isArray(data.tasks) || data.tasks.length === 0) {
        setExtractError('No actionable tasks were found on that page.');
        return;
      }
      // The endpoint returns extracted tasks but does not persist them, so the
      // board is populated from the response rather than by reloading.
      const loaded = data.tasks.map((t: Record<string, string>, i: number) => ({
        id: t.id ?? `url-${Date.now()}-${i}`,
        title: t.task ?? t.title ?? 'Untitled task',
        priority: (t.priority ?? 'medium').toLowerCase(),
        label: 'From URL',
        status: 'todo' as TaskStatus,
        dueDate: t.deadline,
        estimate: t.estimate,
      }));
      setTasks(loaded);
      setUrlInput("");
      setBoardView('kanban');
    } catch {
      setExtractError('Network error. Check your connection and try again.');
    } finally {
      setExtracting(false);
    }
  };

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
          <Icons.AlertTri size={13} style={{ color:"var(--rd-text)", flexShrink:0 }}/>
          <span style={{ fontSize:12, color:"var(--rd-text)", fontWeight:500 }}>
            Autopilot warning: High task load detected. Consider completing or deferring tasks before adding more.
          </span>
        </div>
      )}

      {boardView === "input" ? (
        /* ── Input view ── */
        <div className="page-pad" style={{ flex:1 }}>
          <div style={{ maxWidth:"var(--content-max)", margin:"0 auto", width:"100%" }}>
            <div style={{ textAlign:"center", marginBottom:28 }}>
              <span style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"5px 14px",
                borderRadius:100, background:"var(--as)", border:"1px solid var(--ag)",
                marginBottom:16, color:"var(--ac-text)", fontSize:11.5, fontWeight:600 }}>
                <Icons.Sparkle size={11}/> AI-Powered Extraction
              </span>
              {/* h2, not h1: the topbar above already owns the page heading. */}
              <h2 style={{ fontSize:26, fontWeight:800, letterSpacing:"-0.04em", color:"var(--tx)",
                marginBottom:8, fontFamily:"var(--font-display)" }}>
                Transform Notes Into Action
              </h2>
              <p style={{ fontSize:13.5, color:"var(--tx2)" }}>
                Paste your messy notes and let Kanbi AI organize them into tasks
              </p>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"minmax(0,1fr) 260px", gap:18 }}
              className="main-grid-2 board-input-grid">
              {/* Input card */}
              <div className="panel panel-lg">
                {/* Mode tabs */}
                <div role="tablist" aria-label="Source of tasks to extract"
                  style={{ display:"flex", gap:3, marginBottom:16, background:"var(--bg2)",
                    borderRadius:"var(--radius-md)", padding:4 }}>
                  {inputModes.map(m => (
                    <button key={m.key} onClick={() => setInputMode(m.key)}
                      role="tab"
                      aria-selected={inputMode === m.key}
                      aria-controls="extract-panel"
                      style={{ flex:1, minWidth:0, padding:"8px 6px", borderRadius:"var(--radius-sm)", border:"none",
                        background: inputMode === m.key ? "var(--bg1)" : "transparent",
                        color: inputMode === m.key ? "var(--tx)" : "var(--tx3)",
                        fontSize:11.5, fontWeight:inputMode === m.key ? 600 : 400,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        gap:5, transition:"all .15s", whiteSpace:"nowrap",
                        boxShadow: inputMode === m.key ? "0 1px 4px rgba(0,0,0,.2)" : "none" }}>
                      {m.icon}{m.label}
                    </button>
                  ))}
                </div>

                <div id="extract-panel" role="tabpanel" aria-label="Task source">
                {inputMode === "paste" && (
                  <>
                    <p style={{ fontSize:11, color:"var(--tx3)", marginBottom:8 }}>
                      Paste emails, Slack messages, notes kanbi anything works
                    </p>
                    <textarea
                      value={inputText} onChange={e => setInputText(e.target.value)} rows={9}
                      placeholder={"What's on your mind?\n\n- Fix login bug\n- Review copy\n- Call John\n- Send invoice to Acme"}
                      aria-label="Notes to turn into tasks"
                      className="input-focus"
                      style={{ width:"100%", background:"var(--inp)", border:"1px solid var(--br)",
                        borderRadius:"var(--radius-md)", padding:"12px 14px", fontSize:13, color:"var(--tx)",
                        resize:"none", lineHeight:1.65, height:220, minHeight:220, maxHeight:220,
                        overflowY:"auto", boxSizing:"border-box" }}/>
                    <p style={{ fontSize:10, color:"var(--tx3)", marginTop:8 }}>
                      AI-powered extraction · Smart deadline detection · Privacy first
                    </p>
                  </>
                )}
                {inputMode === "url" && (
                  <>
                    <p style={{ fontSize:11, color:"var(--tx3)", marginBottom:8 }}>
                      Paste a public page link and Kanbi will pull out the action items.
                    </p>
                    {/* Wraps below 480px. At 375px the input and a fixed width
                        button in a single row left the input about 150px wide. */}
                    <div className="url-extract-row"
                      style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      <input
                        type="url"
                        value={urlInput}
                        onChange={e => setUrlInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") handleUrlExtract(); }}
                        placeholder="https://example.com/meeting-notes"
                        aria-label="Page URL to extract tasks from"
                        className="input-focus"
                        style={{ flex:"1 1 220px", minWidth:0, background:"var(--inp)", border:"1px solid var(--br)",
                          borderRadius:"var(--radius-md)", padding:"12px 14px", fontSize:13, color:"var(--tx)",
                          height:44, boxSizing:"border-box" }}/>
                      <button onClick={handleUrlExtract}
                        disabled={!urlInput.trim() || extracting}
                        className="btn btn-primary"
                        style={{ flex:"0 1 auto", minWidth:100 }}>
                        {extracting ? "Reading…" : "Extract"}
                      </button>
                    </div>
                    <p style={{ fontSize:10, color:"var(--tx3)", marginTop:8 }}>
                      The page is fetched on the server. Private and internal addresses are refused.
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
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(min(200px,100%),1fr))", gap:9 }}>
                    {BOARD_TEMPLATES.map(t => (
                      <button key={t.id} type="button"
                        onClick={() => { setInputText(t.build()); setInputMode("paste"); }}
                        className="ghost"
                        style={{ padding:"13px", borderRadius:"var(--radius-sm)", border:"1px solid var(--br)",
                          background:"var(--bg2)", color:"var(--tx2)", fontSize:12, fontWeight:600,
                          textAlign:"left", transition:"all .15s", minWidth:0 }}>
                        <span style={{ display:"block", marginBottom:3 }}>{t.label}</span>
                        <span style={{ display:"block", fontSize:10.5, fontWeight:400, color:"var(--tx3)",
                          lineHeight:1.45 }}>{t.blurb}</span>
                      </button>

                    ))}
                  </div>
                )}

                {(inputMode === "paste" || inputMode === "pdf") && (
                  <button onClick={handleExtract} disabled={!inputText.trim() || extracting}
                    className="btn btn-primary" style={{ width:"100%", marginTop:16 }}>
                    {extracting
                      ? <><Spinner size={14}/> Extracting tasks...</>
                      : <><Icons.Autopilot size={14}/> Turn This Into Tasks</>
                    }
                  </button>
                )}
                {extractError && (
                  <p role="alert" style={{ fontSize:12, color:"var(--rd-text)", marginTop:10, lineHeight:1.5 }}>
                    {extractError}
                  </p>
                )}
                </div>
                </div>

              {/* Progress panel */}
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div className="panel">
                  <div className="panel-head">
                    <h3 className="panel-title">
                      <span aria-hidden="true" style={{ display:"inline-flex", verticalAlign:"-2px", marginRight:6 }}>
                        <Icons.Target size={13} style={{ color:"var(--ac-text)" }}/>
                      </span>
                      Progress
                    </h3>
                  </div>
                  <div style={{ marginBottom:13 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                      <span style={{ fontSize:11, color:"var(--tx2)" }}>Completion</span>
                      <span style={{ fontSize:11, fontWeight:700, color:"var(--tx)", fontFamily:"var(--font-mono)" }}>
                        {tasks.length > 0 ? Math.round((tasks.filter(t=>t.status==="done").length / tasks.length)*100) : 0}%
                      </span>
                    </div>
                    <PBar value={tasks.length > 0 ? (tasks.filter(t=>t.status==="done").length/tasks.length)*100 : 0} h={5} label="Board completion"/>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,minmax(0,1fr))", gap:8 }}>
                    {[
                      { l:"To Do",   v:tasks.filter(t=>t.status==="todo").length  },
                      { l:"Working", v:tasks.filter(t=>t.status==="wip").length   },
                      { l:"Done",    v:tasks.filter(t=>t.status==="done").length  },
                    ].map(s => (
                      <div key={s.l} style={{ textAlign:"center", padding:"10px 5px", borderRadius:8,
                        background:"var(--bg2)", border:"1px solid var(--br)", minWidth:0 }}>
                        <p style={{ fontSize:18, fontWeight:800, color:"var(--tx)", fontFamily:"var(--font-display)" }}>{s.v}</p>
                        <p style={{ fontSize:9.5, color:"var(--tx3)", marginTop:2 }}>{s.l}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <button className="btn btn-ghost" onClick={() => setInputMode("pdf")}>
                  <Icons.Pdf size={14}/> Import Tasks
                </button>
                {tasks.length > 0 && (
                  <button onClick={() => setBoardView("kanban")} className="btn btn-primary">
                    <Icons.Board size={14}/> View Board ({tasks.length} tasks)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── Kanban view ── */
        <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
          <div className="board-kanban-header" style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"14px 26px", borderBottom:"1px solid var(--br)", flexWrap:"wrap", gap:9 }}>
            <div className="board-kanban-title" style={{ display:"flex", alignItems:"center", gap:11, minWidth:0 }}>
              <button onClick={() => setBoardView("input")} className="btn btn-ghost btn-sm">
                <Icons.ArrowLeft size={13}/> Back
              </button>
              <h2 style={{ fontSize:13, fontWeight:700, color:"var(--tx)", fontFamily:"var(--font-display)",
                minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>My Board</h2>
              <span style={{ fontSize:10, padding:"2px 8px", borderRadius:5, background:"var(--br)",
                color:"var(--tx3)", fontFamily:"var(--font-mono)", flexShrink:0 }}>{tasks.length} tasks</span>
            </div>
            <div className="board-kanban-actions" style={{ display:"flex", alignItems:"center", gap:9, flexWrap:"wrap" }}>
              <div style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 11px",
                borderRadius:8, background:"var(--as)", border:"1px solid var(--ag)" }}>
                <span aria-hidden="true" className="pulse" style={{ width:5, height:5, borderRadius:"50%", background:"var(--ac)", flexShrink:0 }}/>
                <span style={{ fontSize:10.5, color:"var(--ac-text)", fontWeight:600 }}>
                  AI extracted {tasks.length} tasks
                </span>
              </div>
              <button onClick={handleSaveBoard} className="btn btn-primary btn-sm">
                Save Board
              </button>
            </div>
          </div>

          <div className="board-kanban-pad" style={{ flex:1, overflow:"auto", padding:"20px 26px" }}>
            {/* minmax(0,1fr) on every track. The columns hold task cards whose
                titles wrap, and a bare 1fr track sizes to its content, so one
                long title widened the whole board past the viewport. */}
            <div className="kanban-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,minmax(0,1fr))", gap:16 }}>
              {cols.map(([key, label, color]) => (
                <section key={key} aria-label={`${label} column`} style={{ minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:12, padding:"0 2px" }}>
                    <span aria-hidden="true" style={{ width:9, height:9, borderRadius:"50%", background:color,
                      boxShadow:`0 0 8px ${color}`, flexShrink:0 }}/>
                    <h3 style={{ fontSize:10.5, fontWeight:700, letterSpacing:"0.07em",
                      textTransform:"uppercase", color:"var(--tx3)", fontFamily:"var(--font-display)",
                      minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{label}</h3>
                    <span style={{ fontSize:10, padding:"1px 6px", borderRadius:4, background:"var(--br)",
                      color:"var(--tx3)", fontFamily:"var(--font-mono)", flexShrink:0 }}>
                      {kanbanTasks(key).length}
                    </span>
                    <button className="btn btn-ghost btn-icon ghost"
                      style={{ marginLeft:"auto" }}
                      aria-label={`Add a task to ${label}`}
                      title={`Add a task to ${label}`}
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
                      }}>
                      <Icons.Plus size={12}/>
                    </button>
                  </div>
                  <div>
                    {kanbanTasks(key).length === 0 ? (
                      <EmptyState
                        small
                        icon={<Icons.Overview size={18}/>}
                        title={`Nothing in ${label.toLowerCase()}`}
                        body="Move a task here, or add one with the plus button."
                      />
                    ) : (
                      kanbanTasks(key).map(t => (
                        <TaskCard key={t.id} task={t} onStatusChange={updateTaskStatus}/>
                      ))
                    )}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}

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

  const pushMessage = useCallback((role: "user" | "ai", content: string) => {
    setChatMessages(prev => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, role, content, ts: ts() },
    ]);
  }, [setChatMessages]);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    pushMessage("user", text.trim());
    setInput("");
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          tasks: tasks.map(t => ({ id: t.id, title: t.title, priority: t.priority, status: t.status })),
          // The same function the board uses, so the chat and the board never
          // report different health numbers for the same board.
          workloadHealth: computeBoardHealthScore(tasks),
          completedToday: tasks.filter(t => t.status === "done").length,
          estimatedHours: Math.round((tasks.filter(t => t.status !== "done").length * 0.75) * 10) / 10,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        pushMessage("ai", data?.error ?? CHAT_ERRORS.rateLimited);
        return;
      }
      const reply = normalizeChatReply(data.response ?? data.reply ?? "", 600);
      pushMessage("ai", reply || CHAT_ERRORS.empty);
    } catch {
      pushMessage("ai", CHAT_ERRORS.offline);
    } finally {
      setLoading(false);
    }
  }, [tasks, loading, pushMessage]);

  /** Runs a quick action, which is computed on the server and needs no model. */
  const runQuickAction = useCallback(async (action: QuickActionId) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quickAction: action,
          tasks: tasks.map(t => ({ id: t.id, title: t.title, priority: t.priority, status: t.status })),
          workloadHealth: computeBoardHealthScore(tasks),
          completedToday: tasks.filter(t => t.status === "done").length,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        pushMessage("ai", data?.error ?? CHAT_ERRORS.rateLimited);
        return;
      }
      pushMessage("ai", normalizeChatReply(data.response ?? "", 600) || CHAT_ERRORS.empty);
    } catch {
      pushMessage("ai", CHAT_ERRORS.offline);
    } finally {
      setLoading(false);
    }
  }, [tasks, loading, pushMessage]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [chatMessages]);

  return (
    <div className="chat-page" style={{ height:"100%", display:"flex", overflow:"hidden" }}>
      {/* Main chat */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>
        {/* Unified chat header (replaces global Topbar on this page, so it is
            the page heading rather than a second level one) */}
        <div className="chat-header" style={{
          height:56, borderBottom:"1px solid var(--br)",
          background:"var(--bg1)", display:"flex", alignItems:"center",
          justifyContent:"space-between", padding:"0 20px", flexShrink:0, gap:10,
          boxShadow:"0 1px 12px rgba(0,0,0,0.12)",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
            <div aria-hidden="true" style={{
              width:34, height:34, borderRadius:10, flexShrink:0,
              background:"linear-gradient(135deg,#6366f1,#ec4899)",
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow:"0 2px 10px rgba(99,102,241,0.35)",
            }}>
              <ChatBotIcon size={16} color="#fff"/>
            </div>
            <div style={{ minWidth:0 }}>
              <h1 className="chat-header-title" style={{
                fontSize:15, fontWeight:700, color:"var(--tx)",
                fontFamily:"var(--font-display)", lineHeight:1.2,
                letterSpacing:"-0.03em", whiteSpace:"nowrap",
                overflow:"hidden", textOverflow:"ellipsis",
              }}>Assistant</h1>
              <p className="chat-header-sub" style={{
                fontSize:11, color:"var(--tx3)", lineHeight:1, marginTop:2,
                whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
              }}>Has context from your board ({tasks.length} tasks)</p>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
            <button type="button" onClick={startNewChat} disabled={loading || clearing}
              className="btn btn-ghost btn-sm"
              aria-label="Start a new chat">
              {clearing ? <Spinner size={10}/> : <Icons.Plus size={12}/>}
              <span className="chat-btn-label">New Chat</span>
            </button>
            <button type="button" onClick={() => setShowMiniBoard(v => !v)}
              className="btn btn-ghost btn-sm"
              aria-expanded={showMiniBoard}
              aria-controls="chat-board-panel"
              aria-label={showMiniBoard ? "Hide the task board" : "Show the task board"}
              style={showMiniBoard
                ? { borderColor:"var(--ac)", background:"var(--as)", color:"var(--ac-text)" }
                : undefined}>
              <Icons.Board size={12}/>
              <span className="chat-btn-label">{showMiniBoard ? "Hide Board" : "Show Board"}</span>
            </button>
            <Avt name={user?.full_name ?? "User"} size={32} avatarUrl={user?.avatar_url}/>
          </div>
        </div>

        {/* Messages. role="log" plus aria-live means a new reply is announced
            without stealing focus from the composer. */}
        <div className="chat-messages" role="log" aria-live="polite" aria-relevant="additions"
          aria-label="Conversation with the Assistant"
          style={{ flex:1, overflowY:"auto", padding:"20px 28px" }}>
          {chatMessages.length === 0 ? (
            <div className="fade-in" style={{ display:"flex", flexDirection:"column", alignItems:"center",
              justifyContent:"center", minHeight:"100%", padding:"24px", maxWidth:"var(--chat-max)", margin:"0 auto", width:"100%" }}>
              <div aria-hidden="true" style={{ width:64, height:64, borderRadius:18,
                background:"linear-gradient(135deg, #6366f1, #a78bfa)",
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow:"0 4px 24px rgba(99,102,241,0.45), 0 0 0 1px rgba(99,102,241,0.2)",
                marginBottom:18, position:"relative", flexShrink:0 }}>
                <div style={{ position:"absolute", inset:-4, borderRadius:22,
                  border:"1px solid rgba(99,102,241,0.25)", pointerEvents:"none" }}/>
                <ChatBotIcon size={32} color="#fff"/>
              </div>
              {/* Copy comes from the shared chat copy so the empty state and the
                  model prompt cannot describe the assistant differently. */}
              <p style={{ fontSize:15, fontWeight:700, color:"var(--tx)", marginBottom:8,
                fontFamily:"var(--font-display)", textAlign:"center" }}>{CHAT_EMPTY_STATE.title}</p>
              <p style={{ fontSize:12.5, color:"var(--tx3)", lineHeight:1.65, textAlign:"center", marginBottom:18 }}>
                {CHAT_EMPTY_STATE.body}
              </p>
              <div className="chat-prompts" style={{ display:"grid", gridTemplateColumns:"repeat(2, minmax(0, 1fr))", gap:8, width:"100%", maxWidth:480 }}>
                {CHAT_EMPTY_STATE.examples.map(prompt => (
                  <button key={prompt} type="button" onClick={() => send(prompt)} disabled={loading}
                    className="ghost"
                    style={{ padding:"12px 14px", borderRadius:"var(--radius-md)", border:"1px solid var(--br)",
                      background:"var(--bg1)", color:"var(--tx2)", fontSize:12.5, fontWeight:500,
                      textAlign:"left", lineHeight:1.45 }}>
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* role="list" pairs with the listitem on each bubble, so a screen
               reader announces the thread as a conversation rather than as a
               run of unlabelled divs. */
            <div role="list" style={{ display:"flex", flexDirection:"column", gap:14,
              maxWidth:"var(--chat-max)", margin:"0 auto", width:"100%" }}>
              {chatMessages.map((m) => (
                <ChatBubble
                  key={m.id}
                  role={m.role === "ai" ? "ai" : "user"}
                  content={m.content}
                  timestamp={m.ts}
                />
              ))}

              {loading && (
                <div
                  className="fade-in"
                  role="status"
                  aria-live="polite"
                  aria-label="Assistant is typing"
                  style={{ display:"flex", gap:10, alignItems:"center" }}
                >
                  <ChatBotIcon size={30} color="#fff"/>
                  <div style={{ padding:"13px 15px", borderRadius:"4px 14px 14px 14px",
                    background:"var(--bg1)", border:"1px solid var(--br)", display:"flex", gap:5, alignItems:"center" }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} className="pulse" style={{ width:6, height:6, borderRadius:"50%",
                        background:"var(--ac)", animationDelay:`${i * 0.15}s` }}/>
                    ))}
                    <span style={{ fontSize:11, color:"var(--tx3)", marginLeft:6 }}>Thinking</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef}/>
            </div>
          )}
        </div>

        {/* Quick actions. Each one is computed on the server from the board, so
            none of them waits on a model. */}
        <div className="chat-quick-actions"
          style={{ padding:"0 28px 10px", flexShrink:0, maxWidth:"var(--chat-max)", margin:"0 auto", width:"100%" }}>
          <div role="group" aria-label="Assistant shortcuts"
            style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
            {QUICK_ACTIONS.map(action => (
              <button
                key={action.id}
                type="button"
                onClick={() => runQuickAction(action.id)}
                disabled={loading}
                title={action.hint}
                className="ghost"
                style={{ padding:"6px 11px", borderRadius:999, border:"1px solid var(--br)",
                  background:"var(--bg1)", color:"var(--tx2)", fontSize:11, fontWeight:600,
                  transition:"all .15s", whiteSpace:"nowrap" }}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input bar */}
        <div className="chat-input-bar" style={{ padding:"14px 28px", borderTop:"1px solid var(--br)", flexShrink:0,
          background:"linear-gradient(180deg, transparent, rgba(99,102,241,0.03))" }}>
          <div style={{ display:"flex", gap:9, alignItems:"flex-end", maxWidth:"var(--chat-max)", margin:"0 auto", width:"100%" }}>
            <textarea
              value={input} onChange={e => setInput(e.target.value)} rows={1}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); send(input); } }}
              placeholder="Ask me anything about your tasks..."
              aria-label="Message the Assistant"
              className="chat-input"
              /* minWidth 0 so the composer keeps its 42px send button at 375px
                 instead of being squeezed to nothing by a long placeholder. */
              style={{ flex:1, minWidth:0, background:"var(--inp)", border:"1px solid var(--br)",
                borderRadius:"var(--radius-md)", padding:"11px 14px", fontSize:13, color:"var(--tx)",
                resize:"none", lineHeight:1.5, maxHeight:120 }}/>
            <button onClick={() => send(input)} disabled={!input.trim() || loading}
              className="btn btn-primary btn-icon"
              aria-label="Send message"
              style={{ width:42, height:42, borderRadius:"var(--radius-md)" }}>
              {loading ? <Spinner size={14}/> : <Icons.Send size={15}/>}
            </button>
          </div>

        </div>
      </div>

      {/* Mini task board sidebar */}
      {showMiniBoard && (
        <aside id="chat-board-panel" aria-label="Task board"
          className="chat-sidebar xl-hide" style={{ width:260, flexShrink:0,
            borderLeft:"1px solid var(--br)",
            display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div className="panel-head" style={{ padding:"13px 16px", marginBottom:0,
            borderBottom:"1px solid var(--br)" }}>
            <h2 className="panel-title" style={{ fontSize:12 }}>Task Board</h2>
            <span style={{ fontSize:10, padding:"1px 6px", borderRadius:4, background:"var(--br)",
              color:"var(--tx3)", fontFamily:"var(--font-mono)", flexShrink:0 }}>{tasks.length}</span>
            <button onClick={() => setShowMiniBoard(false)} className="btn btn-ghost btn-icon"
              aria-label="Hide the task board"
              style={{ marginLeft:"auto" }}>
              <Icons.X size={12}/>
            </button>
          </div>
          <div style={{ flex:1, overflowY:"auto", padding:10 }}>
            {tasks.length === 0 ? (
              <EmptyState
                small
                icon={<Icons.Board size={18}/>}
                title="No tasks yet"
                body="Add tasks on the Board page and they will show up here beside the conversation."
              />
            ) : (
              (["todo","wip","done"] as TaskStatus[]).map(s => {
                const colTasks = tasks.filter(t => t.status === s);
                if (colTasks.length === 0) return null;
                const colors: Record<string,string> = { todo:"var(--ac)", wip:"var(--am)", done:"var(--gr)" };
                const labels: Record<string,string> = { todo:"To Do", wip:"In Progress", done:"Done" };
                return (
                  <section key={s} aria-label={labels[s] ?? s} style={{ marginBottom:13, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:7 }}>
                      <span aria-hidden="true" style={{ width:6, height:6, borderRadius:"50%", background:colors[s],
                        boxShadow:`0 0 6px ${colors[s]}`, flexShrink:0 }}/>
                      <h3 style={{ fontSize:9.5, fontWeight:700, letterSpacing:"0.07em",
                        textTransform:"uppercase", color:"var(--tx3)", fontFamily:"var(--font-display)",
                        minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {labels[s]}
                      </h3>
                      <span style={{ fontSize:9, padding:"0 5px", borderRadius:3, background:"var(--br)",
                        color:"var(--tx3)", fontFamily:"var(--font-mono)", flexShrink:0 }}>{colTasks.length}</span>
                    </div>
                    {colTasks.map(t => <TaskCard key={t.id} task={t} compact/>)}
                  </section>
                );
              })
            )}
          </div>
        </aside>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE: AUTOPILOT
═══════════════════════════════════════════════════════════════════════════ */
function PageAutopilot() {
  const { tasks, setTasks, briefings, setBriefings, burnoutAlerts, user, navigate } = useApp();
  const isPro = user?.plan === "pro";
  const [genLoading, setGenLoading] = useState(false);
  const [settings, setSettings] = useState({
    scheduling:true, burnout:true, learning:false, autoPrioritize:false,
  });

  const pendingTasks = tasks.filter(t => t.status !== "done");
  const healthScore  = computeBoardHealthScore(tasks);
  const pilotBand    = healthBand(healthScore);

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
      if (!res.ok) {
        setBriefingError(data?.error ?? "Could not generate a briefing. Please try again.");
        return;
      }

      const view = normalizeBriefingResponse(data, {
        pendingCount: pendingTasks.length,
        healthNote:
          pilotBand === "healthy"
            ? "No warnings. Your workload looks balanced."
            : "Your board is carrying more than one high priority task.",
      });

      const nb: Briefing = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
        }),
        summary: view.summary,
        schedule: view.schedule,
        healthNote: view.healthNote,
        quote: view.quote,
        priorities: view.priorities,
        warnings: view.warnings,
      };
      setBriefings(prev => [nb, ...prev]);

      // Persist briefing as a saved board so it survives a page reload.
      fetch('/api/boards/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Autopilot · ${nb.date}`,
          tasks: view.schedule.map((s, i) => ({
            id: `SCH-${nb.id}-${i}`,
            title: s.task,
            priority: 'medium',
            label: 'Autopilot',
            status: 'todo',
            estimate: s.duration,
          })),
          category: 'autopilot',
          icon: 'autopilot',
        }),
      }).catch(() => {});
    } catch {
      setBriefingError("Network error. Check your connection and try again.");
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
    <div className="fade-up page-pad">

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
        <div>
          {/* h2, not h1: the topbar above already owns the page heading. */}
          <h2 className="page-title">AI Autopilot</h2>
          <p className="page-sub">Autonomous workload management and morning briefings</p>
        </div>
        <button onClick={handleGenerate} disabled={genLoading} className="btn btn-primary">
          {genLoading
            ? <><Spinner size={14}/> Generating...</>
            : <><Icons.Autopilot size={14}/> Generate Briefing</>
          }
        </button>
      </div>

      {briefingError && (
        <div role="alert" style={{ display:"flex", alignItems:"center", gap:9, padding:"10px 14px",
          borderRadius:"var(--radius-md)", background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.2)" }}>
          <Icons.AlertTri size={13} style={{ color:"var(--rd-text)", flexShrink:0 }}/>
          <span style={{ fontSize:12, color:"var(--rd-text)", flex:1, minWidth:0 }}>{briefingError}</span>
          <button onClick={() => setBriefingError("")} aria-label="Dismiss the error"
            className="btn btn-ghost btn-icon"
            style={{ borderColor:"rgba(239,68,68,0.3)", color:"var(--rd-text)" }}>
            <Icons.X size={12}/>
          </button>
        </div>
      )}

      {/* Live sync status */}
      <div className="autopilot-sync-bar" style={{ display:"flex", alignItems:"center", gap:11, padding:"12px 16px",
        borderRadius:"var(--radius-md)", background:"var(--as)", border:"1px solid var(--ag)" }}>
        <span aria-hidden="true" className="pulse" style={{ width:7, height:7, borderRadius:"50%", background:"var(--ac)", flexShrink:0 }}/>
        <span style={{ fontSize:12, color:"var(--ac-text)", fontWeight:600, flexShrink:0 }}>Live sync with board</span>
        <div className="autopilot-sync-chips" style={{ display:"flex", gap:7, minWidth:0 }}>
          <span className="autopilot-stat-chip">{pendingTasks.length} pending</span>
          <span className="autopilot-stat-chip">Health {healthScore}/100</span>
          <span className="autopilot-stat-chip">{pendingTasks.filter(t=>t.priority==="urgent").length} urgent</span>
        </div>
      </div>

      <div className="autopilot-grid" style={{ display:"grid", gridTemplateColumns:"repeat(2,minmax(0,1fr))", gap:16, alignItems:"stretch" }}>
        {/* Morning Briefing */}
        <section className="panel panel-lg" style={{ display:"flex", flexDirection:"column" }}>
          <div className="panel-head">
            <h3 className="panel-title" style={{ fontSize:13 }}>Morning Briefing</h3>
            {briefings.length > 0 && (
              <span style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                <span style={{ fontSize:10, color:"var(--tx3)", fontFamily:"var(--font-mono)", fontWeight:600 }}>
                  {briefings[0]!.date}
                </span>
                <span style={{ fontSize:10, padding:"2px 9px", borderRadius:100,
                  background:"rgba(16,185,129,0.1)", color:"var(--gr-text)", border:"1px solid rgba(16,185,129,0.2)", fontWeight:700 }}>
                  Latest
                </span>
              </span>
            )}
          </div>
          {briefings.length === 0 ? (
            <EmptyState
              icon={<Icons.Autopilot size={22}/>}
              title="No briefing yet"
              body="Generate a briefing for a summary of today, your top priorities, and anything worth knowing."
            />
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
              <p style={{ fontSize:12.5, color:"var(--tx2)", lineHeight:1.7 }}>{briefings[0]!.summary}</p>

              {(briefings[0]!.priorities?.length ?? 0) > 0 && (
                <div style={{ marginTop:4 }}>
                  <p style={{ fontSize:10, color:"var(--tx3)", fontWeight:700, letterSpacing:"0.06em",
                    textTransform:"uppercase", marginBottom:9 }}>Top priorities</p>
                  <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
                    {briefings[0]!.priorities!.map((p, i) => {
                      const rankColor = i === 0 ? "var(--rd-text)" : i === 1 ? "var(--am-text)" : "var(--ac-text)";
                      const rankBg = i === 0 ? "rgba(239,68,68,0.1)" : i === 1 ? "rgba(245,158,11,0.1)" : "var(--as)";
                      return (
                        <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                          <span aria-hidden="true" style={{ fontSize:10.5, fontWeight:800, color:rankColor,
                            background:rankBg, flexShrink:0, width:20, height:20, borderRadius:"50%",
                            display:"flex", alignItems:"center", justifyContent:"center",
                            fontFamily:"var(--font-mono)" }}>{i + 1}</span>
                          <div style={{ minWidth:0, paddingTop:1 }}>
                            <p style={{ fontSize:12, color:"var(--tx)", fontWeight:500, marginBottom:1 }}>{p.task}</p>
                            <p style={{ fontSize:10.5, color:"var(--tx3)", lineHeight:1.5 }}>{p.reason}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {(briefings[0]!.warnings?.length ?? 0) > 0 && (
                <div style={{ padding:"10px 13px", borderRadius:9,
                  background:"rgba(245,158,11,0.07)", border:"1px solid rgba(245,158,11,0.22)" }}>
                  <p style={{ display:"flex", alignItems:"center", gap:6, fontSize:10, color:"var(--am-text)", fontWeight:700,
                    letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:6 }}>
                    <Icons.AlertTri size={11}/> Worth knowing
                  </p>
                  <ul style={{ margin:0, padding:0, listStyle:"none", display:"flex", flexDirection:"column", gap:5 }}>
                    {briefings[0]!.warnings!.map((w, i) => (
                      <li key={i} style={{ fontSize:11, color:"var(--tx2)", lineHeight:1.55 }}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {briefings[0]!.quote && (
                <p style={{ fontSize:11.5, color:"var(--tx3)", fontStyle:"italic", marginTop:2,
                  lineHeight:1.6, paddingTop:11, borderTop:"1px solid var(--br)" }}>
                  "{briefings[0]!.quote}"
                </p>
              )}
            </div>
          )}
        </section>

        {/* AI Schedule */}
        <section className="panel panel-lg" style={{ display:"flex", flexDirection:"column" }}>
          <div className="panel-head">
            <h3 className="panel-title" style={{ fontSize:13 }}>AI Daily Schedule</h3>
            {briefings.length > 0 && briefings[0]!.schedule.length > 0 && (
              <button onClick={createScheduleOnBoard} className="btn btn-primary btn-sm">
                <Icons.ArrowRight size={13}/> Add to Board
              </button>
            )}
          </div>
          {briefings.length === 0 ? (
            <EmptyState
              icon={<Icons.Clock size={22}/>}
              title="No schedule yet"
              body="Generate a briefing and the day is broken into timeboxed blocks here."
            />
          ) : briefings[0]!.schedule.length === 0 ? (
            <EmptyState
              small
              icon={<Icons.Clock size={18}/>}
              title="Nothing fits into your working hours"
              body="Add a shorter estimate to a task, or widen your working hours in autopilot settings."
            />
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {briefings[0]!.schedule.map((s, i) => (
                <div key={i} className="autopilot-timeline-row">
                  <span style={{ fontSize:10, fontWeight:700, color:"var(--ac-text)", fontFamily:"var(--font-mono)",
                    flexShrink:0, minWidth:78, background:"var(--as)", padding:"3px 7px", borderRadius:6,
                    textAlign:"center" }}>{s.time}</span>
                  <span style={{ fontSize:12, color:"var(--tx)", flex:1, minWidth:0, overflow:"hidden",
                    textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.task}</span>
                  <span style={{ fontSize:10, color:"var(--tx3)", fontWeight:600, flexShrink:0,
                    background:"var(--bg3)", padding:"3px 8px", borderRadius:100,
                    fontFamily:"var(--font-mono)" }}>{s.duration}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Burnout Panel */}
        <section className="panel panel-lg" style={{ display:"flex", flexDirection:"column" }}>
          <div className="panel-head">
            <h3 className="panel-title" style={{ fontSize:13 }}>Burnout Alert Panel</h3>
          </div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, padding:"4px 0 14px" }}>
            <HealthRing score={healthScore}/>
            <span style={{ fontSize:11, fontWeight:700, letterSpacing:"0.04em", textTransform:"uppercase",
              color: pilotBand === "healthy" ? "var(--gr)" : "var(--rd)" }}>
              {pilotBand === "healthy" ? "Healthy" : pilotBand === "moderate" ? "At risk" : "Critical"}
            </span>
          </div>
          <div style={{ display:"flex", gap:7, justifyContent:"center", flexWrap:"wrap", marginBottom:14 }}>
            <span className="autopilot-stat-chip">{pendingTasks.length} pending</span>
            <span className="autopilot-stat-chip">
              {pendingTasks.filter(t=>t.priority==="urgent"||t.priority==="high").length} high priority
            </span>
            <span className="autopilot-stat-chip">{tasks.filter(t=>t.status==="done").length} done</span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
            {burnoutAlerts.length === 0 ? (
              <EmptyState
                small
                icon={<Icons.Party size={18}/>}
                title="All clear"
                body="Nothing has pushed your workload over the limit recently."
              />
            ) : (
              burnoutAlerts.map(a => {
                const severe = a.score < 40;
                return (
                  <div key={a.id} style={{ padding:"9px 11px", borderRadius:9,
                    background: severe ? "rgba(239,68,68,0.06)" : "rgba(245,158,11,0.06)",
                    border:`1px solid ${severe ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)"}` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                      <span style={{ fontSize:11, color: severe ? "var(--rd-text)" : "var(--am-text)", fontWeight:700 }}>
                        Score: {a.score}/100
                      </span>
                      <span style={{ fontSize:10, color:"var(--tx3)", fontFamily:"var(--font-mono)" }}>{a.date}</span>
                    </div>
                    <p style={{ fontSize:11.5, color:"var(--tx2)" }}>{a.message}</p>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Settings */}
        <section className="panel panel-lg" style={{ display:"flex", flexDirection:"column" }}>
          <div className="panel-head">
            <h3 className="panel-title" style={{ fontSize:13 }}>Autopilot Settings</h3>
          </div>
          <div style={{ display:"flex", flexDirection:"column" }}>
            {[
              { key:"scheduling"     as const, label:"Smart Scheduling",    desc:"AI plans your day based on priorities", icon:<Icons.Zap size={14}/>, pro:false },
              { key:"burnout"        as const, label:"Burnout Detection",   desc:"Monitor workload & alert on overload",  icon:<Icons.Shield size={14}/>, pro:false },
              { key:"learning"       as const, label:"Pattern Learning",    desc:"Learn your productivity habits",        icon:<Icons.Brain size={14}/>, pro:true },
              { key:"autoPrioritize" as const, label:"Auto-Prioritization", desc:"Re-rank tasks when new ones arrive",    icon:<Icons.Target size={14}/>, pro:true },
            ].map((s, i) => {
              const locked = s.pro && !isPro;
              return (
                <div key={s.key} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:14,
                  padding:"13px 0", borderTop: i === 0 ? "none" : "1px solid var(--br)" }}>
                  <span aria-hidden="true" style={{ width:30, height:30, borderRadius:9, flexShrink:0,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    background:"var(--bg2)", border:"1px solid var(--br)", color:"var(--ac-text)" }}>{s.icon}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ display:"flex", alignItems:"center", gap:7, fontSize:13, fontWeight:500, color:"var(--tx)", marginBottom:2 }}>
                      {s.label}
                      {s.pro && (
                        <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:9, fontWeight:700,
                          padding:"1px 6px", borderRadius:100, background:"rgba(245,158,11,0.12)",
                          color:"var(--am-text)", border:"1px solid rgba(245,158,11,0.25)" }}>
                          <Icons.Lock size={8}/> PRO
                        </span>
                      )}
                    </p>
                    <p style={{ fontSize:11.5, color:"var(--tx3)" }}>{s.desc}</p>
                  </div>
                  {locked ? (
                    <button onClick={() => navigate("settings")} className="btn btn-ghost btn-sm" style={{ flexShrink:0 }}>
                      <Icons.Lock size={11}/> Upgrade
                    </button>
                  ) : (
                    <Toggle
                      on={settings[s.key]}
                      onToggle={() => setSettings(prev => ({ ...prev, [s.key]:!prev[s.key] }))}
                      label={s.label}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Briefing history */}
      {briefings.length > 1 && (
        <section className="panel panel-lg">
          <div className="panel-head">
            <h3 className="panel-title" style={{ fontSize:13 }}>Briefing History</h3>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:0, maxHeight:260, overflowY:"auto" }}>
            {briefings.slice(1).map((b, i) => (
              <div key={b.id} style={{ display:"flex", gap:12, padding:"9px 2px" }}>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0, width:13 }}>
                  <span aria-hidden="true" style={{ width:7, height:7, borderRadius:"50%", background:"var(--ac)", flexShrink:0, marginTop:4 }}/>
                  {i < briefings.length - 2 && <span aria-hidden="true" style={{ width:1, flex:1, background:"var(--br)", marginTop:4 }}/>}
                </div>
                <div style={{ flex:1, minWidth:0, paddingBottom:4 }}>
                  <p style={{ fontSize:12, fontWeight:600, color:"var(--tx)" }}>{b.date}</p>
                  <p style={{ fontSize:11, color:"var(--tx3)", overflow:"hidden", textOverflow:"ellipsis",
                    whiteSpace:"nowrap" }}>{b.summary}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
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
  const [exportMenuId, setExportMenuId] = useState<string|null>(null);
  const { exportBoard, exportingId, error: exportError, setError: setExportError } = useBoardExport();

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
    <div className="fade-up page-pad">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
        <div>
          {/* h2: the topbar above owns the h1. */}
          <h2 className="page-title">Saved Boards</h2>
          <p className="page-sub">{savedBoards.length} boards · {folders.length-1} folders</p>
        </div>
        <button onClick={() => navigate("board")} className="btn btn-primary">
          <Icons.Plus size={13}/> New Board
        </button>
      </div>

      {/* Toolbar */}
      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
        <div style={{ flex:"1 1 200px", minWidth:0, position:"relative" }}>
          <Icons.Search size={13} style={{ position:"absolute", left:12, top:"50%",
            transform:"translateY(-50%)", color:"var(--tx3)", pointerEvents:"none" }}/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search boards..."
            aria-label="Search saved boards"
            className="input-focus"
            style={{ width:"100%", background:"var(--bg1)", border:"1px solid var(--br)", borderRadius:"var(--radius-sm)",
              padding:"8px 12px 8px 34px", fontSize:13, color:"var(--tx)" }}/>
        </div>
        <div role="group" aria-label="Layout"
          style={{ display:"flex", gap:3, background:"var(--bg1)", border:"1px solid var(--br)",
            borderRadius:"var(--radius-sm)", padding:4 }}>
          {(["grid","list"] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              aria-pressed={view === v}
              aria-label={v === "grid" ? "Grid layout" : "List layout"}
              className="btn btn-icon btn-sm"
              style={{ borderColor:"transparent",
                background: view === v ? "var(--bg2)" : "transparent",
                color: view === v ? "var(--tx)" : "var(--tx3)" }}>
              {v === "grid" ? <Icons.Overview size={13}/> : <Icons.Board size={13}/>}
            </button>
          ))}
        </div>
      </div>

      {/* Folder tabs */}
      <div role="group" aria-label="Filter by folder"
        style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {folders.map(f => (
          <button key={f} onClick={() => setActiveFolder(f)}
            aria-pressed={activeFolder === f}
            className="btn btn-sm"
            style={{
              borderColor: activeFolder === f ? "var(--ac)" : "var(--br)",
              background: activeFolder === f ? "var(--as)" : "transparent",
              color: activeFolder === f ? "var(--ac)" : "var(--tx2)",
              fontWeight: activeFolder === f ? 700 : 400,
            }}>
            {f !== "All" && <Icons.Folder size={11}/>}{f}
            <span style={{ fontSize:10, color: activeFolder === f ? "var(--ac)" : "var(--tx3)",
              fontFamily:"var(--font-mono)" }}>
              {f === "All" ? savedBoards.length : savedBoards.filter(b => b.folder === f).length}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        /* One empty state, and it names which of the two ways the list came
           out empty so the guidance is actionable either way. */
        <div className="panel" style={{ padding:0 }}>
          <EmptyState
            icon={<Icons.Saved size={22}/>}
            title={savedBoards.length === 0 ? "No saved boards yet" : "No boards match that"}
            body={savedBoards.length === 0
              ? "Save the board you are working on and it will appear here to reopen in one click."
              : "Clear the search or pick a different folder to see your other boards."}
            action={savedBoards.length === 0
              ? <button onClick={() => navigate("board")} className="btn btn-primary btn-sm">
                  <Icons.Plus size={12}/> New Board
                </button>
              : <button onClick={() => { setSearch(""); setActiveFolder("All"); }}
                  className="btn btn-ghost btn-sm">
                  Clear filters
                </button>}
          />
        </div>
      )}

      {exportError && (
        <div role="alert"
          style={{ padding:"10px 13px", borderRadius:"var(--radius-md)", display:"flex",
            alignItems:"center", gap:9, fontSize:12.5,
            background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", color:"var(--rd-text)" }}>
          <Icons.Alert size={13} style={{ flexShrink:0 }}/>
          <span style={{ flex:1, minWidth:0 }}>{exportError}</span>
          <button onClick={() => setExportError(null)} aria-label="Dismiss export error"
            className="btn btn-ghost btn-icon"
            style={{ borderColor:"rgba(239,68,68,0.3)", color:"var(--rd-text)" }}>
            <Icons.X size={13}/>
          </button>
        </div>
      )}

      {view === "grid" ? (
        <div className="saved-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(min(235px,100%),1fr))", gap:13 }}>
          {filtered.map(b => (
            <div key={b.id} className="card panel panel-lg">
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:13, gap:8 }}>
                <span aria-hidden="true" style={{ width:36, height:36, borderRadius:"var(--radius-sm)", background:"var(--as)",
                  display:"flex", alignItems:"center", justifyContent:"center", color:"var(--ac-text)", flexShrink:0 }}>
                  <Icons.Layers size={15}/>
                </span>
                <span style={{ fontSize:10, padding:"2px 9px", borderRadius:100,
                  background:"var(--bg2)", border:"1px solid var(--br)", color:"var(--tx3)",
                  minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{b.folder}</span>
              </div>
              {renamingId === b.id ? (
                <input value={renameVal} onChange={e => setRenameVal(e.target.value)} autoFocus
                  aria-label={`Rename ${b.name}`}
                  onKeyDown={e => { if(e.key==="Enter") renameBoard(b.id); if(e.key==="Escape"){setRenamingId(null);setRenameVal("");} }}
                  onBlur={() => renameBoard(b.id)}
                  className="input-focus"
                  style={{ width:"100%", background:"var(--inp)", border:"1px solid var(--ac)",
                    borderRadius:"var(--radius-sm)", padding:"6px 9px", fontSize:13, color:"var(--tx)", marginBottom:4 }}/>
              ) : (
                <p style={{ fontSize:13.5, fontWeight:700, color:"var(--tx)", marginBottom:4,
                  lineHeight:1.35, fontFamily:"var(--font-display)", overflowWrap:"anywhere" }}>{b.name}</p>
              )}
              <p style={{ fontSize:11, color:"var(--tx3)", marginBottom:16, fontFamily:"var(--font-mono)" }}>
                {b.taskCount} tasks · {b.lastEdited}
              </p>
              {movingId === b.id && (
                <div style={{ marginBottom:11, padding:"9px", borderRadius:"var(--radius-sm)",
                  background:"var(--bg2)", border:"1px solid var(--br)" }}>
                  <p id={`move-label-${b.id}`} style={{ fontSize:10.5, color:"var(--tx3)", marginBottom:7, fontWeight:600 }}>Move to folder:</p>
                  {folders.filter(f => f !== "All" && f !== b.folder).map(f => (
                    <button key={f} onClick={() => moveBoard(b.id, f)}
                      className="btn btn-quiet btn-sm"
                      style={{ display:"flex", width:"100%", marginBottom:2, justifyContent:"flex-start" }}>
                      {f}
                    </button>
                  ))}
                </div>
              )}
              {/* Five controls in one row. On a 375px screen the Open button
                  was left with about 40px, so the row wraps and each control
                  keeps a full target. */}
              <div className="card-actions" style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
                <button onClick={() => openBoard(b)} className="btn btn-ghost btn-sm" style={{ flex:"1 1 90px" }}>
                  Open
                </button>
                <button
                  onClick={() => setExportMenuId(exportMenuId === b.id ? null : b.id)}
                  disabled={exportingId === b.id}
                  aria-expanded={exportMenuId === b.id}
                  aria-haspopup="menu"
                  className="btn btn-ghost btn-icon btn-sm"
                  aria-label={`Export ${b.name}`}>
                  {exportingId === b.id ? <Spinner size={11}/> : <Icons.Download size={12}/>}
                </button>
                {[
                  { icon:<Icons.Edit size={12}/>, label:`Rename ${b.name}`,
                    onClick:()=>{setRenamingId(b.id);setRenameVal(b.name);} },
                  { icon:<Icons.MoveFolder size={12}/>, label:`Move ${b.name} to another folder`,
                    onClick:()=>setMovingId(movingId===b.id?null:b.id) },
                  { icon:<Icons.Trash size={12}/>, label:`Delete ${b.name}`, danger:true,
                    onClick:()=>deleteBoard(b.id) },
                ].map((btn, i) => (
                  <button key={i} onClick={btn.onClick}
                    aria-label={btn.label}
                    className={`btn btn-icon btn-sm ${btn.danger ? "btn-danger" : "btn-ghost"}`}>
                    {btn.icon}
                  </button>
                ))}
              </div>
              {exportMenuId === b.id && (
                <div role="menu" aria-label={`Export format for ${b.name}`}
                  style={{ marginTop:9, padding:"5px", borderRadius:"var(--radius-sm)",
                    background:"var(--bg2)", border:"1px solid var(--br)" }}>
                  {(["docx","pdf"] as const).map(f => (
                    <button key={f} role="menuitem"
                      onClick={() => { setExportMenuId(null); exportBoard(b.id, f); }}
                      className="btn btn-quiet btn-sm"
                      style={{ display:"flex", width:"100%", justifyContent:"flex-start" }}>
                      {f === "docx" ? "Word document (.docx)" : "PDF document (.pdf)"}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          {filtered.map(b => (
            <div key={b.id} className="saved-row" style={{ display:"flex", alignItems:"center", gap:13,
              padding:"12px 14px", minWidth:0 }}>
              <span aria-hidden="true" style={{ width:32, height:32, borderRadius:"var(--radius-sm)", background:"var(--as)",
                display:"flex", alignItems:"center", justifyContent:"center", color:"var(--ac-text)", flexShrink:0 }}>
                <Icons.Layers size={13}/>
              </span>
              {renamingId === b.id ? (
                <input value={renameVal} onChange={e => setRenameVal(e.target.value)} autoFocus
                  aria-label={`Rename ${b.name}`}
                  onKeyDown={e => { if(e.key==="Enter") renameBoard(b.id); if(e.key==="Escape"){setRenamingId(null);setRenameVal("");} }}
                  onBlur={() => renameBoard(b.id)} className="input-focus"
                  style={{ flex:1, minWidth:0, background:"var(--inp)", border:"1px solid var(--ac)",
                    borderRadius:"var(--radius-sm)", padding:"5px 9px", fontSize:13, color:"var(--tx)" }}/>
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
                <button onClick={() => openBoard(b)} className="btn btn-ghost btn-sm">
                  Open
                </button>
                <button onClick={() => { setRenamingId(b.id); setRenameVal(b.name); }}
                  aria-label={`Rename ${b.name}`}
                  className="btn btn-ghost btn-icon btn-sm">
                  <Icons.Edit size={12}/>
                </button>
                <button onClick={() => deleteBoard(b.id)}
                  aria-label={`Delete ${b.name}`}
                  className="btn btn-danger btn-icon btn-sm">
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
  const { user, savedBoards } = useApp();
  const { exportBoard: exportFromSettings, exportingId, error: settingsExportError } = useBoardExport();
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
        {/* Tabs. A real tablist, so the active tab is announced and the arrow
            keys mean what they say. The previous grid had four columns for six
            tabs, which overflowed below 768px and dropped the last tab out of
            the row entirely. */}
        <div className="settings-tabs" role="tablist" aria-label="Settings sections"
          style={{ display:"grid", gridTemplateColumns:"repeat(6,minmax(0,1fr))", gap:8 }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className="nav-btn"
              role="tab"
              id={`settings-tab-${t.key}`}
              aria-selected={tab === t.key}
              aria-controls="settings-panel"
              tabIndex={tab === t.key ? 0 : -1}
              style={{ padding:"12px 8px", borderRadius:"var(--radius-md)", minWidth:0,
                border: `1.5px solid ${tab === t.key ? "var(--ac)" : "var(--br)"}`,
                background: tab === t.key ? "rgba(99,102,241,0.08)" : "var(--bg2)",
                color: tab === t.key ? "var(--ac)" : "var(--tx2)",
                fontSize:12, fontWeight: tab === t.key ? 700 : 500,
                display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6,
                whiteSpace:"nowrap", transition:"all 0.2s ease", position:"relative" }}>
              <span aria-hidden="true" style={{ color: tab === t.key ? "var(--ac)" : "var(--tx3)", display:"flex", alignItems:"center", justifyContent:"center" }}>{t.icon}</span>
              <span style={{ fontSize:11, lineHeight:1.2, textAlign:"center", overflow:"hidden",
                textOverflow:"ellipsis", maxWidth:"100%" }}>{t.label}</span>
              {(t.key === "data") && (
                <span style={{
                  fontSize:9, fontWeight:700, color:"var(--am-text)", background:"rgba(245,158,11,0.15)",
                  border:"1px solid rgba(245,158,11,0.3)", padding:"1px 5px", borderRadius:99,
                  letterSpacing:"0.05em", textTransform:"uppercase", marginTop:2
                }}>Soon</span>
              )}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className="settings-panel" id="settings-panel" role="tabpanel"
          aria-labelledby={`settings-tab-${tab}`} tabIndex={-1}
          style={{ borderRadius:"var(--radius-lg)", border:"1px solid var(--br)", background:"var(--bg1)", padding:26 }}>
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
                    marginTop:4, background:"var(--as)", color:"var(--ac-text)", fontWeight:700 }}>
                    {user?.plan === "pro" ? "Pro Plan" : "Free Plan"}
                  </p>
                </div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                <Field id="profile-name" label="Full Name">
                  <input id="profile-name" value={profileName} onChange={e => setProfileName(e.target.value)}
                    className="input-focus"
                    style={{ width:"100%", background:"var(--inp)", border:"1px solid var(--br)",
                      borderRadius:"var(--radius-sm)", padding:"10px 13px", fontSize:13, color:"var(--tx)" }}/>
                </Field>
                <Field id="profile-email" label="Email" hint="Email cannot be changed">
                  <input id="profile-email" defaultValue={user?.email} type="email" readOnly
                    aria-describedby="profile-email-hint"
                    className="input-focus"
                    style={{ width:"100%", background:"var(--inp)", border:"1px solid var(--br)",
                      borderRadius:"var(--radius-sm)", padding:"10px 13px", fontSize:13, color:"var(--tx2)", opacity:.7 }}/>
                </Field>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                  <button onClick={handleSaveProfile} disabled={saving} className="btn btn-primary"
                    style={{ flex:"1 1 140px" }}>
                    {saving ? <><Spinner size={12}/> Saving...</> : "Save Changes"}
                  </button>
                  <button onClick={handleSignOut} className="btn btn-danger"
                    style={{ flex:"1 1 140px" }}>
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
                  { id:"new-password", label:"New Password", value:newPassword, onChange:setNewPassword },
                  { id:"confirm-password", label:"Confirm Password", value:confirmPassword, onChange:setConfirmPassword },
                ].map(f => (
                  <Field key={f.id} id={f.id} label={f.label}>
                    <input id={f.id} type="password" value={f.value} onChange={e => f.onChange(e.target.value)}
                      autoComplete={f.id === "new-password" ? "new-password" : "new-password"}
                      className="input-focus"
                      style={{ width:"100%", background:"var(--inp)", border:"1px solid var(--br)",
                        borderRadius:"var(--radius-sm)", padding:"10px 13px", fontSize:13, color:"var(--tx)" }}/>
                  </Field>
                ))}
                {/* Announced on change, so the result of the submit is not a
                    silent colour change in the corner of the panel. */}
                {pwError && <p role="alert" style={{ fontSize:12, color:"var(--rd-text)" }}>{pwError}</p>}
                {pwSuccess && <p role="status" style={{ fontSize:12, color:"var(--gr-text)" }}>Password updated successfully.</p>}
                <button onClick={handleChangePassword} disabled={pwSaving} className="btn btn-primary"
                  style={{ alignSelf:"flex-start" }}>
                  {pwSaving ? <><Spinner size={12}/> Saving...</> : "Change Password"}
                </button>
              </div>
            </div>
          )}

          {tab === "billing" && (
            <div>
              <h3 style={{ fontSize:15, fontWeight:800, color:"var(--tx)", marginBottom:4, fontFamily:"var(--font-display)" }}>Billing</h3>
              <p style={{ fontSize:12.5, color:"var(--tx2)", marginBottom:22 }}>Manage your subscription</p>
              <div className="settings-billing-row" style={{ borderRadius:"var(--radius-md)", border:"1px solid var(--br)", padding:"18px",
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
                  <button className="btn btn-primary btn-sm" onClick={async () => {
                    const res = await fetch('/api/stripe/checkout', { method: 'POST' });
                    const data = await res.json();
                    if (data.url) window.location.href = data.url;
                  }}>
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
                borderRadius:"var(--radius-md)", border:"1px solid var(--br)", background:"var(--bg2)", gap:12 }}>
                <div>
                  <p style={{ fontSize:13.5, fontWeight:500, color:"var(--tx)", marginBottom:3 }}>Theme</p>
                  {/* theme is read from the store only to label this control.
                      The colours themselves come from CSS, which is what keeps
                      the toggle from repainting the page on the first render. */}
                  <p style={{ fontSize:11.5, color:"var(--tx3)" }}>{theme === "dark" ? "Dark mode" : "Light mode"} · auto-detects system</p>
                </div>
                <button onClick={toggleTheme} className="btn btn-quiet"
                  aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
                  {theme === "dark" ? <><Icons.Sun size={14}/> Light</> : <><Icons.Moon size={14}/> Dark</>}
                </button>
              </div>
            </div>
          )}

          {tab === "danger" && (
            <div>
              <h3 style={{ fontSize:15, fontWeight:800, color:"var(--rd-text)", marginBottom:4, fontFamily:"var(--font-display)" }}>Danger Zone</h3>
              <p style={{ fontSize:12.5, color:"var(--tx2)", marginBottom:22 }}>These actions are permanent and cannot be undone.</p>
              <div style={{ borderRadius:"var(--radius-md)", border:"1px solid rgba(239,68,68,0.22)",
                background:"rgba(239,68,68,0.04)", padding:"20px 22px" }}>
                <p style={{ fontSize:13.5, fontWeight:700, color:"var(--rd-text)", marginBottom:6 }}>Delete Account</p>
                <p style={{ fontSize:12.5, color:"var(--tx2)", marginBottom:16, lineHeight:1.65 }}>
                  Permanently deletes your account, all boards, and all data. Type <strong>DELETE</strong> to confirm.
                </p>
                <Field id="delete-confirm" label="Type DELETE to confirm">
                  <input id="delete-confirm" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
                    className="input-focus"
                    style={{ width:"100%", background:"var(--inp)", border:"1px solid rgba(239,68,68,0.3)",
                      borderRadius:"var(--radius-sm)", padding:"10px 13px", fontSize:13, color:"var(--tx)", marginBottom:14 }}/>
                </Field>
                <button onClick={handleDeleteAccount}
                  disabled={deleteConfirm !== "DELETE" || deleting}
                  className="btn btn-danger">
                  {deleting
                    ? <><Spinner size={12} tone="onFill"/> Deleting...</>
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

              {savedBoards.length === 0 ? (
                <div style={{ borderRadius:"var(--radius-md)", border:"1px solid var(--br)", background:"var(--bg2)", padding:0 }}>
                  <EmptyState
                    icon={<Icons.Download size={22}/>}
                    title="No saved boards yet"
                    body="Save a board from the Board page, then export it here as DOCX or PDF."
                  />
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {settingsExportError && (
                    <div role="alert"
                      style={{ padding:"9px 12px", borderRadius:"var(--radius-sm)", display:"flex", alignItems:"center", gap:8,
                        fontSize:12, background:"rgba(239,68,68,0.08)",
                        border:"1px solid rgba(239,68,68,0.25)", color:"var(--rd-text)" }}>
                      <Icons.Alert size={12} style={{ flexShrink:0 }}/>
                      <span style={{ flex:1, minWidth:0 }}>{settingsExportError}</span>
                    </div>
                  )}
                  {savedBoards.map(b => (
                    <div key={b.id}
                      style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 13px",
                        borderRadius:"var(--radius-sm)", border:"1px solid var(--br)", background:"var(--bg2)", flexWrap:"wrap" }}>
                      <div style={{ flex:"1 1 140px", minWidth:0 }}>
                        <p style={{ fontSize:13, fontWeight:600, color:"var(--tx)", marginBottom:2,
                          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{b.name}</p>
                        <p style={{ fontSize:11, color:"var(--tx3)", fontFamily:"var(--font-mono)" }}>{b.taskCount} tasks</p>
                      </div>
                      <button onClick={() => exportFromSettings(b.id, "docx")}
                        disabled={exportingId === b.id}
                        className="btn btn-ghost btn-sm"
                        aria-label={`Export ${b.name} as a Word document`}>
                        {exportingId === b.id ? <Spinner size={11}/> : "DOCX"}
                      </button>
                      <button onClick={() => exportFromSettings(b.id, "pdf")}
                        disabled={exportingId === b.id}
                        className="btn btn-ghost btn-sm"
                        aria-label={`Export ${b.name} as a PDF`}>
                        {exportingId === b.id ? <Spinner size={11}/> : "PDF"}
                      </button>
                    </div>
                  ))}
                  <p style={{ fontSize:11.5, color:"var(--tx3)", marginTop:4, lineHeight:1.55 }}>
                    Each board exports as a single document grouped by column, with priority, label,
                    estimate, and due date for every task.
                  </p>
                </div>
              )}
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
/**
 * Defined at module scope rather than inside Sidebar. Defining it during render
 * makes React treat every render as producing a new component type, which
 * discards the subtree state and remounts the nav on each parent render.
 */
function NavBtn({ page, k, label, icon, badge, setPage, onNavigate }: {
  page: Page; k: Page; label: string; icon: ReactNode; badge?: string;
  setPage: (p: Page) => void; onNavigate?: () => void;
}) {
  const active = page === k;
  return (
    <button onClick={() => { setPage(k); onNavigate?.(); }} className="nav-btn"
      aria-current={active ? "page" : undefined}
      style={{
        width:"100%", padding:"7px 10px 7px 8px", borderRadius:"var(--radius-md)", border:"none",
        background: active ? "rgba(99,102,241,0.1)" : "transparent",
        color: active ? "var(--ac)" : "var(--tx2)",
        fontSize:13, fontWeight: active ? 600 : 400,
        cursor:"pointer", display:"flex", alignItems:"center", gap:9,
        textAlign:"left", marginBottom:2, position:"relative",
        transition:"all .15s", letterSpacing:"-0.01em",
      }}>

      {/* Icon container */}
      <span style={{
        width:26, height:26, borderRadius:7, flexShrink:0,
        display:"flex", alignItems:"center", justifyContent:"center",
        transition:"all .18s",
      }}>{icon}</span>
      <span style={{ flex:1, minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{label}</span>
      {badge && (
        <span style={{
          fontSize:9, padding:"2px 7px", borderRadius:99, flexShrink:0,
          background: badge === "AI" ? "var(--as)" : "rgba(167,139,250,0.12)",
          color: badge === "AI" ? "var(--ac)" : "var(--pu)",
          fontWeight:700, fontFamily:"var(--font-mono)", letterSpacing:"0.04em",
          border: `1px solid ${badge === "AI" ? "var(--ag)" : "rgba(167,139,250,0.2)"}`,
        }}>{badge}</span>
      )}
    </button>
  );
}

function Sidebar({ page, setPage, theme, toggleTheme }: {
  page: Page; setPage: (p: Page) => void; theme: Theme; toggleTheme: () => void;
}) {
  const { user } = useApp();

  const mainNav: [Page, string, ReactNode][] = [
    ["overview",  "Overview",     <StarIcon key="overview" size={26}/>        ],
    ["board",     "Board",        <BoardStarIcon key="board" size={26}/>   ],
    ["saved",     "Saved Boards", <SavedStarIcon key="saved" size={26}/>   ],
  ];
  const aiNav: [Page, string, ReactNode, string?][] = [
    ["chat",      "Assistant",      <ChatStarIcon key="chat" size={26}/>,    "AI"   ],
    ["autopilot", "Autopilot",    <PilotStarIcon key="autopilot" size={26}/>,   "AUTO" ],
  ];

  const boardsUsed  = user?.boards_used_today ?? 0;
  const boardsLimit = user?.boards_today_limit ?? 10;
  const usagePct    = Math.min((boardsUsed / boardsLimit) * 100, 100);
  const usageColor  = usagePct >= 90 ? "var(--rd)" : usagePct >= 70 ? "var(--am)" : "var(--ac)";

  return (
    <aside id="dash-sidebar" aria-label="Navigation" className="sidebar"
      tabIndex={-1}
      style={{
      /* dvh, not vh: 100vh on iOS is taller than the visible area, which cut
         the sign out control off the bottom of the drawer. */
      width: "var(--sidebar-w)", height:"100dvh", position:"fixed", left:0, top:0, zIndex:50,
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
      <nav aria-label="Main" style={{ flex:1, padding:"10px 10px 0", overflowY:"auto" }}>
        <div className="nav-section-label">Workspace</div>
        {mainNav.map(([k, l, i]) => <NavBtn key={k} page={page} k={k} label={l} icon={i} setPage={setPage}/>)}

        <div className="nav-section-label" style={{ marginTop:18 }}>AI Features</div>
        {aiNav.map(([k, l, i, b]) => <NavBtn key={k} page={page} k={k} label={l} icon={i} badge={b} setPage={setPage}/>)}

        <div className="nav-section-label" style={{ marginTop:18 }}>Account</div>
        <NavBtn page={page} k="settings" label="Settings" icon={<SettingsStarIcon size={26}/>} setPage={setPage}/>
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
          <PBar value={usagePct} h={3} color={usageColor} label="Daily board usage"/>
        </div>


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
          <button onClick={toggleTheme} className="btn btn-ghost btn-icon"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
            <span aria-hidden="true">{theme === "dark" ? <Icons.Sun size={13}/> : <Icons.Moon size={13}/>}</span>
          </button>
          <button className="btn btn-ghost btn-icon" aria-label="Sign out"
            onClick={async () => { const s = createClient(); await s.auth.signOut(); window.location.href = "/"; }}>
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
function BottomNav({ page, setPage, onNavigate }: { page: Page; setPage: (p: Page) => void; onNavigate?: () => void }) {
  const items: [Page, string, ReactNode][] = [
    ["overview",  "Home",     <StarIcon key="overview" size={19}/>        ],
    ["board",     "Board",    <BoardStarIcon key="board" size={19}/>   ],
    ["chat",      "Chat",     <ChatStarIcon key="chat" size={19}/>    ],
    ["autopilot", "Pilot",    <PilotStarIcon key="autopilot" size={19}/>   ],
    ["saved",     "Saved",    <SavedStarIcon key="saved" size={19}/>   ],
    ["settings",  "Settings", <SettingsStarIcon key="settings" size={19}/>],
  ];
  return (
    <nav className="bottom-nav" aria-label="Main" style={{
      position:"fixed", bottom:0, left:0, right:0, zIndex:100,
      background:"var(--sb)", borderTop:"1px solid var(--br)",
      display:"none", alignItems:"center",
      paddingBottom:"env(safe-area-inset-bottom)",
      backdropFilter:"blur(12px)",
    }}>
      {items.map(([k, l, icon]) => (
        <button key={k} onClick={() => { setPage(k); onNavigate?.(); }}
          className="bottom-nav-item"
          aria-current={page === k ? "page" : undefined}
          style={{ flex:1, minWidth:0, padding:"8px 2px", background:"transparent", border:"none",
            color: page === k ? "var(--ac)" : "var(--tx3)",
            display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2,
            transition:"color .15s" }}>
          <span aria-hidden="true">{icon}</span>
          <span style={{ fontSize:9, fontWeight: page === k ? 700 : 400, maxWidth:"100%",
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{l}</span>
        </button>
      ))}
    </nav>
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
        <rect x="2" y="3" width="6" height="18" rx="1.5"/>
        <rect x="9" y="3" width="6" height="18" rx="1.5"/>
        <rect x="16" y="3" width="6" height="18" rx="1.5"/>
        <rect x="3" y="5" width="4" height="3" rx="0.5" fill="#fff" stroke="none" opacity="0.5"/>
        <rect x="3" y="10" width="4" height="3" rx="0.5" fill="#fff" stroke="none" opacity="0.5"/>
        <rect x="10" y="5" width="4" height="3" rx="0.5" fill="#fff" stroke="none" opacity="0.5"/>
        <rect x="10" y="10" width="4" height="3" rx="0.5" fill="#fff" stroke="none" opacity="0.5"/>
        <rect x="17" y="5" width="4" height="3" rx="0.5" fill="#fff" stroke="none" opacity="0.5"/>
      </svg>
    ),
  },
  chat:      {
    title:"Assistant", sub:"Your board-aware coach",
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

function Topbar({ page }: {
  page: Page;
}) {
  const { user } = useApp();
  const meta = PAGE_META[page];
  return (
    <header className="topbar-wrap" style={{
      height:56, borderBottom:"1px solid var(--br)",
      background:"var(--bg1)", display:"flex", alignItems:"center",
      justifyContent:"space-between", padding:"0 20px", flexShrink:0,
      boxShadow:"0 1px 12px rgba(0,0,0,0.12)",
    }}>
      {/* Left: menu + icon + title */}
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
          {/* The one h1 for this page. Every page below the topbar is an h2
              or lower, so the outline runs top to bottom in one chain. */}
          <h1 className="topbar-title" style={{
            fontSize:15, fontWeight:700, color:"var(--tx)",
            fontFamily:"var(--font-display)", lineHeight:1.2,
            letterSpacing:"-0.03em", whiteSpace:"nowrap",
            overflow:"hidden", textOverflow:"ellipsis",
          }}>
            {meta.title}
          </h1>
          <p className="topbar-sub" style={{
            fontSize:11, color:"var(--tx3)", lineHeight:1, marginTop:2,
            whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
          }}>
            {meta.sub}
          </p>
        </div>
      </div>

      {/* Right: avatar */}
      <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
        <Avt name={user?.full_name ?? "User"} size={32} avatarUrl={user?.avatar_url}/>
      </div>
    </header>
  );
}

/* ─── 3-D time-of-day greeting icon ──────────────────────────────────────── */
function TimeOfDayIcon({ tod }: { tod: "morning" | "afternoon" | "evening" }) {
  if (tod === "morning") {
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ flexShrink: 0 }}>
        <defs>
          <radialGradient id="sun-core" cx="50%" cy="38%" r="52%">
            <stop offset="0%" stopColor="#fff7a1"/>
            <stop offset="45%" stopColor="#ffd93d"/>
            <stop offset="100%" stopColor="#ff9500"/>
          </radialGradient>
          <radialGradient id="sun-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffe066" stopOpacity="0.55"/>
            <stop offset="100%" stopColor="#ff9500" stopOpacity="0"/>
          </radialGradient>
          <filter id="sun-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#ff9500" floodOpacity="0.45"/>
          </filter>
        </defs>
        {/* glow halo */}
        <circle cx="14" cy="14" r="13" fill="url(#sun-glow)"/>
        {/* rays */}
        {[0,45,90,135,180,225,270,315].map((deg, i) => {
          const r = Math.PI * deg / 180;
          const x1 = 14 + Math.cos(r) * 9.5, y1 = 14 + Math.sin(r) * 9.5;
          const x2 = 14 + Math.cos(r) * 12.8, y2 = 14 + Math.sin(r) * 12.8;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ffb800" strokeWidth={deg % 90 === 0 ? "1.8" : "1.2"} strokeLinecap="round" opacity={deg % 90 === 0 ? 1 : 0.7}/>
        })}
        {/* core sphere */}
        <circle cx="14" cy="14" r="7.2" fill="url(#sun-core)" filter="url(#sun-shadow)"/>
        {/* specular highlight */}
        <ellipse cx="11.8" cy="11.4" rx="2.2" ry="1.4" fill="white" opacity="0.45" transform="rotate(-20 11.8 11.4)"/>
      </svg>
    );
  }
  if (tod === "afternoon") {
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ flexShrink: 0 }}>
        <defs>
          <radialGradient id="sun2-core" cx="50%" cy="35%" r="52%">
            <stop offset="0%" stopColor="#fff3c4"/>
            <stop offset="40%" stopColor="#ffcc00"/>
            <stop offset="100%" stopColor="#ff6a00"/>
          </radialGradient>
          <radialGradient id="sun2-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffdd57" stopOpacity="0.5"/>
            <stop offset="100%" stopColor="#ff6a00" stopOpacity="0"/>
          </radialGradient>
          <filter id="sun2-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#ff6a00" floodOpacity="0.5"/>
          </filter>
        </defs>
        <circle cx="14" cy="14" r="13" fill="url(#sun2-glow)"/>
        {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg, i) => {
          const r = Math.PI * deg / 180;
          const x1 = 14 + Math.cos(r) * 9.8, y1 = 14 + Math.sin(r) * 9.8;
          const x2 = 14 + Math.cos(r) * 13, y2 = 14 + Math.sin(r) * 13;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ffa500" strokeWidth={deg % 90 === 0 ? "2" : "1.1"} strokeLinecap="round" opacity={deg % 90 === 0 ? 1 : 0.6}/>
        })}
        <circle cx="14" cy="14" r="7.8" fill="url(#sun2-core)" filter="url(#sun2-shadow)"/>
        <ellipse cx="11.5" cy="11" rx="2.5" ry="1.5" fill="white" opacity="0.4" transform="rotate(-25 11.5 11)"/>
      </svg>
    );
  }
  // evening
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ flexShrink: 0 }}>
      <defs>
        <radialGradient id="moon-body" cx="38%" cy="32%" r="60%">
          <stop offset="0%" stopColor="#e8eaff"/>
          <stop offset="50%" stopColor="#b8bfff"/>
          <stop offset="100%" stopColor="#7c85e0"/>
        </radialGradient>
        <radialGradient id="moon-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.4"/>
          <stop offset="100%" stopColor="#7c85e0" stopOpacity="0"/>
        </radialGradient>
        <filter id="moon-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#7c3aed" floodOpacity="0.4"/>
        </filter>
      </defs>
      {/* glow */}
      <circle cx="13" cy="15" r="12" fill="url(#moon-glow)"/>
      {/* stars */}
      <circle cx="22" cy="5" r="1.1" fill="#e0e7ff" opacity="0.9"/>
      <circle cx="25" cy="11" r="0.7" fill="#c7d2fe" opacity="0.8"/>
      <circle cx="20" cy="3" r="0.6" fill="#e0e7ff" opacity="0.7"/>
      <circle cx="24" cy="7" r="0.5" fill="#a5b4fc" opacity="0.6"/>
      {/* crescent moon */}
      <path d="M13.5 5.5 A8.5 8.5 0 1 0 13.5 24.5 A6 6 0 1 1 13.5 5.5 Z" fill="url(#moon-body)" filter="url(#moon-shadow)"/>
      {/* specular */}
      <ellipse cx="11" cy="9" rx="2" ry="1.2" fill="white" opacity="0.35" transform="rotate(-30 11 9)"/>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ROOT kanbi Dashboard
═══════════════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const [page, setPage]   = useState<Page>("overview");
  const { theme, toggle: toggleTheme } = useTheme();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Runs once on mount. isLoading already starts as true, so there is no need to
  // set it again here before the fetches resolve.
  useEffect(() => {
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
        // Limits come from the server, which reads them from USAGE_LIMITS. The
        // interface must not restate them or it will drift from what is enforced.
        boards_today_limit:  usage.boardsTodayLimit ?? 10,
        boards_month_limit: usage.boardsMonthLimit ?? 300,
        ai_today_limit:      usage.aiTodayLimit ?? 10,
        ai_month_limit:      usage.aiMonthLimit ?? 300,
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
          content: normalizeChatReply(m.message ?? '', 600),
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
      <GlobalStyles />
      <div className="root-layout" style={{ display:"flex", height:"100vh", background:"var(--bg)", overflow:"hidden" }}>
        <Sidebar
          page={page} setPage={setPage} theme={theme} toggleTheme={toggleTheme}
        />
        <div className="main-wrap" style={{ marginLeft:"var(--sidebar-w)", flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>
          {page !== "chat" && <Topbar page={page}/>}
          <div style={{ flex:1, overflow:"hidden", minWidth:0 }}>
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
