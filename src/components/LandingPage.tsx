"use client";
// KANBI LANDING PAGE v3
// Updates: (1) Hero mock matches new dashboard (sidebar+health ring+progress bars)
//          (2) NEW tabbed Product Showcase   Dashboard, Board, Assistant
import { useTheme as useSiteTheme } from '@/lib/theme';
import { useState, useEffect, useRef, createContext, useContext, useCallback, type ComponentType } from "react";
import { createClient } from '@/lib/supabase/client';
import { BarChart3, CalendarDays, CircleGauge, ClipboardList, Layers3, MessageSquareText, Workflow, ShieldCheck, Eye, ArrowRight, CheckCircle2, TimerReset, PanelTop, FileDown, BrainCircuit, Boxes, Target, ListTodo, TrendingUp, BadgeCheck, Flame, Orbit, LaptopMinimal, PanelRightOpen, Stars, GitBranch, Gauge, Clock3, Route, BadgeInfo, SquareKanban, SplitSquareVertical, ArrowUpRight, BookOpenText, Sparkles, MoveRight, Info, FileText, Tag, CalendarClock, Trash2, Lock, CreditCard } from "lucide-react";
import Link from "next/link";

type Theme = "dark" | "light";
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({ theme: "dark", toggle: () => { } });
const useTheme = () => useContext(ThemeCtx);


/**
 * Page level styles only. The palette and the font stack are not repeated here:
 * they are emitted once into the document head by the root layout, which is what
 * lets the blocking theme script resolve the correct theme before first paint.
 */
function Styles() {
  return <style>{`
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0} html{scroll-behavior:smooth}
  .lp{font-family:inherit;background:var(--bg);color:var(--tx);-webkit-font-smoothing:antialiased;overflow-x:hidden;transition:background .2s,color .2s}
  .lp a{text-decoration:none;color:inherit} .lp button{font-family:inherit;cursor:pointer}
  .lp ::-webkit-scrollbar{display:none;width:0;height:0} .lp ::-webkit-scrollbar-track{display:none} .lp ::-webkit-scrollbar-thumb{display:none} .lp{scrollbar-width:none;-ms-overflow-style:none}
  @keyframes shimmer{from{background-position:-300% center}to{background-position:300% center}}
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.55)}}
  @keyframes badgeFadeUp{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
  .shimmer{background:linear-gradient(90deg,var(--ac),var(--pu) 40%,var(--ac) 70%,var(--pu));background-size:300% auto;-webkit-background-clip:text;background-clip:text;color:transparent;animation:shimmer 4s linear infinite}
  .pulse{animation:pulse 2.2s ease-in-out infinite}
  .wavy{stroke-dasharray:380;stroke-dashoffset:380;transition:stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1) .2s}
  .wavy.drawn{stroke-dashoffset:0}
  .na:hover{color:var(--tx)!important;background:var(--bg2)!important}
  .fc{transition:background .18s,border-color .18s,transform .18s} .fc:hover{background:var(--bg2)!important;border-color:var(--brh)!important;transform:translateY(-2px)}
  .sh:hover{border-color:var(--ac)!important}
  .fi{transition:border-color .18s}
  .tb{transition:all .15s;min-width:0}
  .cmp-mobile{display:none;flex-direction:column;gap:12px}
  .cmp-card{border-radius:14px;border:1px solid var(--br);background:var(--bg1);overflow:hidden}
  .cmp-card-head{padding:14px 16px;border-bottom:1px solid var(--br);display:flex;align-items:center;gap:10px;font-size:13.5px;font-weight:600;color:var(--tx)}
  .cmp-card-row{display:grid;grid-template-columns:72px 1fr;gap:10px;padding:11px 16px;border-bottom:1px solid var(--br);align-items:center}
  .cmp-card-row:last-child{border-bottom:none}
  .cmp-card-row.kanbi{background:var(--as)}
  .cmp-card-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--tx3)}
  .cmp-card-row.kanbi .cmp-card-label{color:var(--ac)}
  .cmp-card-val{font-size:12.5px;color:var(--tx2);line-height:1.45}
  .cmp-card-row.kanbi .cmp-card-val{color:var(--tx);font-weight:500}
  .lp-wrap{max-width:1140px;margin:0 auto;padding:0 clamp(16px,4vw,24px);width:100%}
  .lp-section{padding:clamp(56px,8vw,96px) 0;scroll-margin-top:64px}
  /* One heading shape for every section, so the page reads as a single system
     rather than as ten separately styled blocks. */
  .lp-kicker{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--ac-text);margin:0 0 14px}
  .lp-h2{font-family:var(--font-display);font-size:clamp(28px,4vw,44px);font-weight:700;letter-spacing:-0.04em;line-height:1.1;color:var(--tx);margin:0 0 14px}
  .lp-lede{font-size:16px;line-height:1.65;color:var(--tx2);margin:0}

  /* Proof band. Four figures on a hairline row, then three plain-language
     promises, then one honest paragraph about what the model does. */
  .proof-stats{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid var(--br);border-radius:16px;overflow:hidden;background:var(--bg1)}
  /* min-width:0 lets a long sub line wrap inside its cell instead of
     stretching the grid track. */
  .proof-stat{padding:26px 24px;border-right:1px solid var(--br);min-width:0}
  .proof-stat:last-child{border-right:none}
  .proof-num{font-family:var(--font-display);font-size:clamp(26px,3.2vw,42px);font-weight:700;letter-spacing:-0.045em;line-height:1;color:var(--tx);font-variant-numeric:tabular-nums}
  .proof-label{font-size:13px;color:var(--tx);font-weight:600;margin-top:10px;text-wrap:balance}
  .proof-sub{font-size:12px;color:var(--tx3);margin-top:4px;line-height:1.5}
  .proof-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:14px}
  .proof-card{border:1px solid var(--br);border-radius:14px;background:var(--bg1);padding:20px;min-width:0}
  .proof-card-ico{width:32px;height:32px;border-radius:9px;background:var(--as);border:1px solid var(--ag);color:var(--ac-text);display:flex;align-items:center;justify-content:center;margin-bottom:12px}
  .proof-card-t{font-size:13.5px;font-weight:600;color:var(--tx);margin-bottom:6px}
  .proof-card-d{font-size:12.5px;line-height:1.65;color:var(--tx2)}
  .proof-note{display:flex;gap:14px;align-items:flex-start;margin-top:14px;padding:20px 22px;border-radius:14px;border:1px solid var(--br);background:var(--bg2)}
  .proof-note-b{font-size:13px;line-height:1.7;color:var(--tx2);margin:0}
  .proof-note-b b{color:var(--tx);font-weight:600}

  /* Compare. Three layouts, one dataset, so no copy is duplicated between
     them. Desktop is a real table so the browser owns column alignment. A
     tablet gets one panel per feature, which reads better than six columns
     squeezed to 700px. A phone gets one card per product. */
  .vs-shell{border:1px solid var(--br);border-radius:16px;background:var(--bg1);overflow:hidden}
  .vs-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
  .vs-table{width:100%;min-width:680px;border-collapse:collapse;font-size:13px}
  .vs-table th,.vs-table td{padding:14px 18px;border-bottom:1px solid var(--br);vertical-align:middle}
  .vs-table thead th{font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--tx3);background:var(--bg2);white-space:nowrap;text-align:left}
  .vs-table thead th:first-child,.vs-table tbody th{text-align:left;vertical-align:middle}
  /* Large screens: row header left, every competitor value left aligned too, and
     every row vertically centered so a row reads as one line across products. */
  .vs-table td{text-align:left}
  /* Brand icon next to each top-row column name, icon left, text centered vertically */
  .vs-col-head{display:inline-flex;align-items:center;gap:7px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--tx3);white-space:nowrap}
  .vs-col-head-ico{width:20px;height:20px;flex-shrink:0;border-radius:6px;background:var(--bg2);border:1px solid var(--br);color:var(--ac-text);display:flex;align-items:center;justify-content:center}
  /* The row header is the only cell that wraps, so it carries the icon that
     says what the row is about before the words do. */
  .vs-rowhead{display:flex;align-items:center;gap:9px;font-weight:500;color:var(--tx);text-align:left;white-space:normal}
  .vs-rowhead-ico{width:28px;height:28px;flex-shrink:0;border-radius:8px;background:var(--bg2);border:1px solid var(--br);color:var(--ac-text);display:flex;align-items:center;justify-content:center}
  .vs-table td{color:var(--tx2)}
  .vs-table .is-kanbi{background:var(--as);color:var(--tx);font-weight:500}
  .vs-table thead th.is-kanbi{color:var(--ac-text)}
  .vs-table tbody tr:last-child th,.vs-table tbody tr:last-child td{border-bottom:none}
  .vs-yes{display:inline-flex;align-items:center;justify-content:center;gap:7px}
  .vs-yes svg{color:var(--gr-text);flex-shrink:0}
  /* Non-Kanbi competitor cell: small dash icon left of the value */
  .vs-no{display:inline-flex;align-items:center;gap:7px;justify-content:center}
  .vs-no-ico{width:13px;height:13px;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:var(--tx3);font-size:10px;font-weight:700}

  /* Tablet: one panel per feature. The panel lists all four products, with the
     Kanbi row filled in so the eye lands on it first. */
  .vs-tablet{display:none;grid-template-columns:1fr 1fr;gap:14px}
  .vs-panel{border:1px solid var(--br);border-radius:14px;background:var(--bg1);padding:20px;min-width:0}
  .vs-panel-head{display:flex;align-items:center;gap:10px;padding-bottom:14px;margin-bottom:6px;border-bottom:1px solid var(--br)}
  .vs-panel-t{font-size:14px;font-weight:600;color:var(--tx);letter-spacing:-0.02em}
  .vs-panel-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid var(--br);font-size:12.5px}
  .vs-panel-row:last-child{border-bottom:none}
  .vs-panel-row.is-kanbi{margin:0 -20px;padding:10px 20px;background:var(--as)}
  .vs-panel-name{display:inline-flex;align-items:center;gap:7px;color:var(--tx3);font-weight:600;white-space:nowrap}
  .vs-panel-row.is-kanbi .vs-panel-name{color:var(--ac-text)}
  .vs-panel-val{color:var(--tx2);text-align:right;line-height:1.45}
  .vs-panel-row.is-kanbi .vs-panel-val{color:var(--tx);font-weight:500}

  /* Phone: one card per product. Four columns at 360px is four unreadable
     columns, so the rows become label and value pairs instead. The row is
     space-between, and the label column is narrow enough that a long answer
     still reaches the right edge, so labels sit left and values sit right
     instead of the whole block drifting left. */
  .vs-mobile{display:none;flex-direction:column;gap:20px}
  .vs-card{border:1px solid var(--br);border-radius:14px;background:var(--bg1);overflow:hidden}
  .vs-card.is-kanbi{border-color:var(--ag);box-shadow:0 0 0 1px var(--ag)}
  .vs-card-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 16px;border-bottom:1px solid var(--br);font-size:13.5px;font-weight:600;color:var(--tx)}
  .vs-card-head-label{display:inline-flex;align-items:center;gap:7px;color:var(--tx);font-weight:600;white-space:nowrap}
  .vs-card-head-ico{width:16px;height:16px;flex-shrink:0;border-radius:6px;background:var(--bg2);border:1px solid var(--br);color:var(--ac-text);display:flex;align-items:center;justify-content:center}
  .vs-card-row{display:grid;grid-template-columns:minmax(0,140px) minmax(0,1fr);gap:10px;padding:12px 16px;border-bottom:1px solid var(--br);align-items:center;font-size:12.5px;line-height:1.5}
  .vs-card-row:last-child{border-bottom:none}
  .vs-card-row.is-kanbi{background:var(--as)}
  .vs-card-k{display:inline-flex;align-items:center;gap:6px;color:var(--tx3);font-size:11.5px;white-space:nowrap}
  .vs-card-k svg{flex-shrink:0;color:var(--ac-text)}
  .vs-card-row.is-kanbi .vs-card-k{color:var(--ac-text)}
  /* Keep every answer on one line, flush right to the card edge, so values
     read as a column and never break mid-phrase. The label column is kept
     narrow so long answers (like Trello's) have room and are never cut off. */
  .vs-card-v{color:var(--tx2);text-align:right;justify-self:end;max-width:100%;white-space:nowrap;overflow:visible}
  .vs-card-row.is-kanbi .vs-card-v{color:var(--tx);font-weight:500}

  /* Who it is for. Three roles, one shape, no invented customer quotes. */
  .who-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
  .who-card{border:1px solid var(--br);border-radius:14px;background:var(--bg1);padding:24px;min-width:0;transition:border-color .18s,transform .18s}
  .who-card:hover{border-color:var(--brh);transform:translateY(-2px)}
  .who-card-t{font-size:15px;font-weight:600;color:var(--tx);margin-bottom:8px;letter-spacing:-0.02em}
  .who-card-d{font-size:13px;line-height:1.65;color:var(--tx2);margin-bottom:16px}
  .who-card-tag{display:inline-flex;padding:4px 10px;border-radius:6px;background:var(--bg2);border:1px solid var(--br);font-size:11px;color:var(--tx3)}

  /* Closing CTA. The only full bleed block on the page, so it reads as an end
     marker rather than as another section with a heading. The accent is a wash
     and a soft radial, never a hard rule: a line under the buttons would read
     as a divider between the ask and the reassurance that supports it. */
  .cta-banner{position:relative;border-radius:22px;border:1px solid var(--br);background:linear-gradient(180deg,rgba(94,111,232,0.08),rgba(94,111,232,0.015));padding:clamp(30px,5vw,56px) clamp(18px,4vw,40px);overflow:hidden;text-align:center}
  .cta-banner-grid{position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(var(--br) 1px,transparent 1px),linear-gradient(90deg,var(--br) 1px,transparent 1px);background-size:64px 64px;opacity:.5}
  .cta-banner-glow{position:absolute;top:-45%;left:50%;transform:translateX(-50%);width:130%;height:95%;background:radial-gradient(ellipse,var(--ag) 0%,transparent 64%);pointer-events:none}
  .cta-banner-inner{position:relative;z-index:1;max-width:640px;margin:0 auto}
  .cta-actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:30px}
  .cta-stats{display:flex;justify-content:center;align-items:stretch;flex-wrap:wrap;gap:10px;margin-top:28px}
  /* Each reassurance is a chip with an icon in its own accent tinted square, so
     the three read as one row of equal claims instead of a sentence with icons
     dropped into it. The tint follows the same accent wash the rest of the page
     uses, which keeps the closing panel quiet instead of introducing a second
     accent colour at the moment of asking for the click. */
  .cta-stat{display:inline-flex;align-items:center;gap:9px;padding:9px 14px;border-radius:11px;border:1px solid var(--br);background:var(--bg1);font-size:12.5px;color:var(--tx2);text-align:left;transition:border-color .18s}
  .cta-stat:hover{border-color:var(--brh)}
  .cta-stat-ico{width:26px;height:26px;flex-shrink:0;border-radius:8px;background:var(--as);border:1px solid var(--ag);color:var(--ac-text);display:flex;align-items:center;justify-content:center}
  /* Both plan cards end on the same shaped block, so the two columns stay
     aligned whether the block is a link, a button, or a quiet label. The
     .lp prefix beats the .lp a colour reset for the same reason the footer
     rules do. */
  .plan-cta{display:flex;align-items:center;justify-content:center;width:100%;min-height:42px;padding:0 16px;margin-top:auto;border-radius:9px;font-size:13px;font-weight:600;text-align:center;line-height:1.4;transition:background .15s,border-color .15s,color .15s}
  .lp .plan-cta{text-decoration:none}
  .lp a.plan-cta:hover{filter:brightness(1.08)}
  .lp-nav{position:fixed;top:0;left:0;right:0;z-index:200;height:64px;display:flex;align-items:center;transition:background .3s,border-color .3s}
  .nav-inner{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px;max-width:none;padding:0 clamp(20px,3vw,48px);width:100%}
  .nav-actions{display:flex;gap:8px;align-items:center;flex-shrink:0;justify-content:flex-end}
  .nav-cta-desktop{display:inline-flex}
  .ms{display:none;background:none;border:none;color:var(--tx2);padding:4px;align-items:center;justify-content:center;width:36px;height:36px;border-radius:8px;transition:background .15s,color .15s}
  .ms:hover{background:var(--bg2);color:var(--tx)}
  .hero-cta-secondary{background:var(--bg2)!important;border:1px solid var(--brh)!important;color:var(--tx2)!important}
  @keyframes mobMenuIn{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes mobLinkIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
  .hero-section{padding:148px 0 80px}
  .hero-mock-grid{display:grid;grid-template-columns:220px 1fr;min-height:520px}
  .hero-kanban{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
  .hero-charts{display:grid;grid-template-columns:1.05fr .95fr;gap:12px}
  .hero-mock-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
  .cta-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:26px;align-items:center}
  .g3{display:grid;grid-template-columns:repeat(3,1fr)}
  .fc-item{border-right:1px solid var(--br);border-bottom:1px solid var(--br)}
  .g3 .fc-item:nth-child(3n){border-right:none}
  /* Six items sit on two rows of three, so the second row is the one that ends
     the grid. It used to be a nine item grid, hence the old n+7 rule. */
  .g3 .fc-item:nth-child(n+4){border-bottom:none}
  @media(max-width:1024px){
    .hero-section{padding:128px 0 64px!important}
    .hero-mock-grid{grid-template-columns:1fr!important;min-height:auto!important}
    .hero-charts{grid-template-columns:1fr!important}
    .cta-grid{grid-template-columns:1fr!important}
    .g2{grid-template-columns:1fr!important}
    .g3{grid-template-columns:repeat(2,1fr)!important}
    .proof-stats{grid-template-columns:1fr 1fr!important}
    .proof-stat{padding:20px 18px!important;border-bottom:1px solid var(--br)!important}
    .proof-stat:nth-child(2n){border-right:none!important}
    /* Two rows of two, so the bottom row is the one that ends the grid. Without
       this the last pair keeps a bottom edge inside the rounded container and
       the border looks doubled against the container's own border. */
    .proof-stat:nth-child(n+3){border-bottom:none!important}
    .proof-cards{grid-template-columns:1fr!important}
    .who-cards{grid-template-columns:1fr!important}
    /* A six column table at 1024px is where the cells start wrapping mid word,
       which is the width where the per feature panels take over. */
    .vs-desktop{display:none!important}
    .vs-tablet{display:grid!important}
    .g3 .fc-item{border-right:1px solid var(--br)!important;border-bottom:1px solid var(--br)!important}
    .g3 .fc-item:nth-child(3n){border-right:1px solid var(--br)!important}
    .g3 .fc-item:nth-child(2n){border-right:none!important}
    .g3 .fc-item:nth-child(n+4){border-bottom:1px solid var(--br)!important}
    .g3 .fc-item:nth-child(n+5){border-bottom:none!important}
    .fg{grid-template-columns:1fr 1fr!important;gap:32px!important}
    .hero-kanban{grid-template-columns:1fr!important}
    .nl{gap:2px!important}
    .nl a{font-size:12.5px!important;padding:5px 9px!important}
  }
  @media(max-width:900px){
    .nl{display:none!important}
    .ms{display:flex!important}
    .nav-cta-desktop{display:none!important}
    .nav-theme-btn{display:none!important}
    .nav-inner{grid-template-columns:auto 1fr auto!important}
    .nav-actions{justify-content:flex-end!important}
    .lp-nav-open{background:var(--nb)!important;border-bottom:1px solid var(--br)!important;backdrop-filter:blur(24px)!important;-webkit-backdrop-filter:blur(24px)!important}
    .mob-menu{position:fixed;inset:0;z-index:210;display:flex;flex-direction:column;background:var(--bg);animation:mobMenuIn .26s cubic-bezier(.22,1,.36,1);overflow:hidden}
    .mob-menu-grid{position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(var(--br) 1px,transparent 1px),linear-gradient(90deg,var(--br) 1px,transparent 1px);background-size:64px 64px;opacity:.45}
    .mob-menu-glow{position:absolute;top:-20%;left:50%;transform:translateX(-50%);width:120%;height:45%;background:radial-gradient(ellipse,var(--ag) 0%,transparent 68%);pointer-events:none;opacity:.7}
    .mob-menu-head{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;padding:14px clamp(16px,4vw,24px);border-bottom:1px solid var(--br);background:var(--nb);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);flex-shrink:0}
    .mob-menu-body{position:relative;z-index:2;flex:1;min-height:0;overflow-y:auto;padding:20px clamp(16px,4vw,24px) 16px;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:14px;-webkit-overflow-scrolling:touch}
    .mob-menu-intro{width:100%;max-width:400px}
    .mob-menu-kicker{font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--ac);margin-bottom:6px}
    .mob-menu-desc{font-size:13px;color:var(--tx2);line-height:1.5}
    .mob-nav-panel{width:100%;max-width:400px;border:1px solid var(--br);border-radius:16px;background:linear-gradient(180deg,var(--bg1),rgba(255,255,255,.01));overflow:hidden;box-shadow:0 16px 48px rgba(0,0,0,.18),inset 0 1px 0 rgba(255,255,255,.04)}
    .mob-link{display:flex;align-items:center;gap:12px;padding:13px 14px;border-bottom:1px solid var(--br);font-size:15px;font-weight:600;color:var(--tx);letter-spacing:-0.02em;transition:background .15s;animation:mobLinkIn .32s cubic-bezier(.22,1,.36,1) both}
    .mob-link:last-child{border-bottom:none}
    .mob-link:nth-child(1){animation-delay:.04s}
    .mob-link:nth-child(2){animation-delay:.07s}
    .mob-link:nth-child(3){animation-delay:.10s}
    .mob-link:nth-child(4){animation-delay:.13s}
    .mob-link:nth-child(5){animation-delay:.16s}
    .mob-link:hover,.mob-link:active{background:var(--bg2)}
    .mob-link-num{width:30px;height:30px;border-radius:9px;background:var(--as);border:1px solid var(--ag);color:var(--ac);font-size:11px;font-weight:800;font-variant-numeric:tabular-nums;display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .mob-link-text{flex:1;min-width:0}
    .mob-link-arrow{width:30px;height:30px;border-radius:9px;background:var(--bg3);border:1px solid var(--br);color:var(--tx3);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .15s,border-color .15s,color .15s,transform .15s}
    .mob-link:hover .mob-link-arrow,.mob-link:active .mob-link-arrow{background:var(--as);border-color:var(--ag);color:var(--ac);transform:translateX(2px)}
    .mob-signin{width:100%;max-width:400px;text-align:center;font-size:12.5px;color:var(--tx3);padding:4px 0 2px;transition:color .15s}
    .mob-signin:hover{color:var(--ac)}
    .mob-menu-foot{position:relative;z-index:2;flex-shrink:0;padding:16px clamp(16px,4vw,24px) max(24px,env(safe-area-inset-bottom));border-top:1px solid var(--br);background:var(--nb);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);display:flex;justify-content:center}
    .mob-foot-panel{width:100%;max-width:400px;display:flex;flex-direction:column;gap:10px}
    .mob-theme-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border-radius:14px;border:1px solid var(--br);background:linear-gradient(180deg,var(--bg1),var(--bg2))}
    .mob-theme-info{display:flex;align-items:center;gap:10px;min-width:0}
    .mob-theme-icon{width:34px;height:34px;border-radius:10px;background:var(--as);border:1px solid var(--ag);color:var(--ac);display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .mob-theme-copy{display:flex;flex-direction:column;gap:1px;min-width:0}
    .mob-theme-label{font-size:13px;font-weight:600;color:var(--tx);letter-spacing:-0.01em}
    .mob-theme-value{font-size:11px;color:var(--tx3)}
    .mob-theme-toggle{height:34px;padding:0 12px;border-radius:9px;border:1px solid var(--br);background:var(--bg3);color:var(--tx2);font-size:12px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:6px;flex-shrink:0;transition:all .15s;white-space:nowrap}
    .mob-theme-toggle:hover{border-color:var(--brh);color:var(--tx);background:var(--bg2)}
    .mob-cta{height:50px;border-radius:14px;background:linear-gradient(135deg,var(--ac),#7c83ff);color:#fff;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 12px 36px var(--ag);border:1px solid rgba(255,255,255,.12);transition:opacity .15s,transform .12s,box-shadow .15s;position:relative;z-index:1}
    .mob-cta:hover{box-shadow:0 16px 40px var(--ag);opacity:.96}
    .mob-cta:active{transform:scale(.98);opacity:.92}
    .mob-menu-close{width:38px;height:38px;border-radius:10px;border:1px solid var(--br);background:var(--bg1);color:var(--tx2);display:flex;align-items:center;justify-content:center;transition:all .15s}
    .mob-menu-close:hover{border-color:var(--brh);color:var(--tx);background:var(--bg2)}
    .msb{border-right:none!important;border-bottom:1px solid var(--br)!important;padding:12px 14px!important;display:flex!important;align-items:center!important;justify-content:space-between!important}
    .msb-brand{padding:0!important;margin-bottom:0!important;border-bottom:none!important}
    .msb-nav{display:flex!important;flex-direction:row!important;gap:6px!important;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:0!important}
    .msb-nav-item{flex-shrink:0!important;margin:0!important;padding:8px 11px!important;font-size:11px!important;white-space:nowrap}
  }
  @media(max-width:768px){
    .hh{font-size:clamp(36px,8vw,56px)!important}
    .hero-section{padding:112px 0 48px!important}
    /* The stat numbers used to hold a 30px floor from clamp, so on a phone
       they stayed desktop sized inside a cell a third of the width and pushed
       the labels to three lines. Fixed sizes per tier so they actually shrink. */
    .proof-stat{padding:16px 14px!important}
    .proof-num{font-size:26px!important}
    .proof-label{font-size:12px!important;margin-top:7px!important}
    .proof-sub{font-size:11px!important;margin-top:3px!important}
    .proof-card{padding:16px!important}
    .proof-card-d{font-size:12px!important}
    .msb-nav-item .msb-nav-label{display:none}
    .msb-nav-item{padding:8px 10px!important;gap:0!important}
    /* On narrow screens the 3-col kanban stacks to 2 cols so cards are readable
       without being tiny; below 480 it becomes 1 col. */
    .hero-kanban{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;padding:10px!important}
    .hero-kanban > div{padding:9px!important}
    .hero-kanban .task-title{font-size:10.5px!important}
    .hero-kanban .task-tag{font-size:8px!important}
    .hero-kanban .task-prog{height:3px!important}
    .hero-charts{grid-template-columns:1fr!important;gap:8px!important}
    .hero-charts > div{padding:10px!important}
    .hero-charts .bar-chart-wrap{height:60px!important}
    .hero-charts .bar-item{font-size:7px!important}
    .hero-mock-head{align-items:flex-start!important}
    .cr{flex-direction:column!important;align-items:stretch!important}
    .cr a,.cr button{justify-content:center!important}
    .g3{grid-template-columns:1fr!important}
    .g3 .fc-item{border-right:none!important}
    .g3 .fc-item{border-bottom:1px solid var(--br)!important}
    .g3 .fc-item:last-child{border-bottom:none!important}
    .fg{grid-template-columns:1fr 1fr!important}
    .tsc{display:grid!important;grid-template-columns:1fr 1fr;gap:6px;overflow:visible;padding:6px!important}
    .tb{flex:none!important;font-size:11.5px!important;padding:10px 8px!important;white-space:normal!important;line-height:1.25;text-align:center}
    .showcase-mock{height:auto!important;min-height:320px;max-height:none!important}
    .mock-board-cols,.mock-overview-stats{grid-template-columns:1fr!important}
    .mock-overview-charts,.mock-chat-layout,.mock-footer-actions{grid-template-columns:1fr!important}
    .hero-badge{padding:5px 10px!important}
    .badge-text{font-size:10px!important;white-space:normal!important;text-align:center!important;line-height:1.3!important}
    .cmp-desktop{display:none!important}
    .cmp-mobile{display:flex!important}
    .vs-tablet{grid-template-columns:1fr!important}
    .vs-desktop{display:none!important}
    /* The mobile layout owns everything below 768px. Sharing the 768px
       breakpoint with the tablet query meant both layouts matched at exactly
       768px, so the section rendered twice on tablets in portrait. */
    .vs-mobile{display:none!important}
    /* The chips go full width and stack, so each claim gets a full line instead
       of three cramped columns. */
    .cta-actions{flex-direction:column!important;align-items:stretch!important}
    .cta-actions a{justify-content:center!important;width:100%!important}
    .cta-stats{flex-direction:column!important;align-items:stretch!important}
    .cta-stat{width:100%!important}
    .hero-mock-wrap{display:none!important}
    .hero-mock-head{padding:10px 12px!important}
    .hero-kanban{padding:10px!important}
    .hero-sub{font-size:15px!important;padding:0 4px!important}
    .hero-workload-bar{gap:8px!important;padding:8px 10px!important;font-size:10px!important}
    .hero-workload-bar > div:first-child{min-width:76px!important}
    .hero-workload-bar span{font-size:10px!important}
    .cta-banner-inner{padding:24px 18px!important;border-radius:18px!important}
    .cta-stats{gap:14px!important}
    .cmp-testimonial{padding:20px 18px!important;margin-top:28px!important}
    .faq-btn{font-size:13px!important;padding:14px 15px!important}
  }
  @media(max-width:767px){
    /* Below 768px the per product cards take over from the per feature
       panels. This query sits under the 768px one on purpose: at exactly
       768px the tablet layout is the one that should be on screen. */
    .vs-tablet{display:none!important}
    .vs-mobile{display:flex!important}
  }
  @media(max-width:480px){
    /* Single column kanban, smaller padding, tighter text on very narrow screens */
    .hero-kanban{grid-template-columns:1fr!important;gap:7px!important;padding:8px!important}
    /* The stat row stays two columns on a phone because four full width tiles
       would push the section taller than the hero it sits under. Sizes come
       down instead so each tile stays two lines. */
    .proof-stat{padding:13px 12px!important}
    .proof-num{font-size:22px!important}
    .proof-label{font-size:11px!important;margin-top:6px!important}
    .proof-sub{font-size:10.5px!important;line-height:1.45!important}
    .hero-kanban > div{padding:8px!important;border-radius:10px!important}
    .hero-charts{gap:7px!important;padding:0 8px 8px!important}
    .hero-charts > div{padding:9px!important;border-radius:10px!important}
    /* Workload bar: condense the label so it fits in one line */
    .hero-workload-bar{flex-wrap:nowrap!important;font-size:9.5px!important;padding:6px 8px!important}
    .hero-mock-head{padding:9px 10px!important}
    /* Shrink the whole mock's internal font baseline */
    .hero-mock-grid{font-size:10px}
  }

  /* ── Footer ──
     The footer is the last thing on the page, so it is the first thing a
     visitor sees wrong at an awkward width. Every rule here is a consequence of
     a specific measured failure, not a guess.

     min-width: 0 on the grid children is the one that matters most: the brand
     column contains a paragraph and a row of icons, and without it the grid
     track is sized by the content's max-content width, which is wider than the
     viewport on a phone. That is the classic cause of a footer that scrolls the
     whole page sideways. */
  .lp-footer{border-top:1px solid var(--br);padding:clamp(40px,6vw,64px) 0 28px;margin-top:auto}
  /* Footer icons sit at 13 to 15px, where the 1.8 default stroke reads thin
     against small text. One rule lifts every icon inside the footer so they
     stay visually consistent with each other. */
  .lp-footer svg{stroke-width:2.2}
  /* Two grid items live here: .footer-brand and the <nav> that itself lays
     out the 4 link columns. A 5-track definition (1 brand + 4 link tracks)
     was being applied to those 2 items, so the extra tracks went unused and
     .footer-nav was squeezed into a single minmax(90px,1fr) track far too
     narrow for its own 4-column grid on large screens. */
  .footer-grid{display:grid;grid-template-columns:minmax(220px,1fr) minmax(0,2.2fr);gap:clamp(24px,3vw,44px);align-items:start}
  .footer-brand{min-width:0}
  .footer-logo{display:flex;align-items:center;gap:9px;margin-bottom:14px}
  .footer-logo-mark{width:30px;height:30px;border-radius:9px;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:#fff;background:linear-gradient(135deg,var(--ac),var(--pu));box-shadow:0 0 16px var(--ag)}
  .footer-logo-text{font-family:var(--font-display);font-size:15px;font-weight:700;letter-spacing:-0.025em;color:var(--tx)}
  .footer-blurb{font-size:13px;line-height:1.65;color:var(--tx2);max-width:34ch;margin:0 0 20px;text-wrap:pretty}
  /* These two are prefixed with .lp on purpose. The rule .lp a{color:inherit}
     has one class plus one type, which outranks a bare class, so the button
     text and the link colour were both being reset to the inherited near
     black instead of the values set here. */
  .lp .footer-cta{
    display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 18px;
    border-radius:10px;background:var(--ac-solid);color:#fff;font-size:13px;font-weight:600;
    text-decoration:none;box-shadow:0 8px 24px var(--ag);
    transition:background .15s,transform .15s,box-shadow .15s;
  }
  .lp .footer-cta:hover{background:var(--ac-solid-h);color:#fff;transform:translateY(-1px);box-shadow:0 12px 30px var(--ag)}
  .footer-social{list-style:none;display:flex;gap:8px;flex-wrap:wrap;margin:18px 0 0;padding:0}
  .footer-social-link{
    display:flex;align-items:center;justify-content:center;width:40px;height:40px;
    border-radius:9px;border:1px solid var(--br);background:var(--bg1);color:var(--tx2);
    transition:border-color .15s,color .15s,background .15s;
  }
  .footer-social-link:hover{border-color:var(--brh);color:var(--tx);background:var(--bg2)}

  .footer-nav{display:grid;grid-template-columns:repeat(4,1fr);gap:clamp(16px,2vw,28px);min-width:0}
  .footer-col{min-width:0}
  /* The h6 scale from globals.css is the right one here: a small uppercase
     label, not a section heading. The previous markup used a <p> at 10px in
     one column and 11px in the others. */
  .footer-col-heading{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--tx3);margin:0 0 14px}
  .footer-col-list{list-style:none;display:flex;flex-direction:column;gap:10px;margin:0;padding:0}
  /* Same reason as the CTA above: .lp a outranks a bare class. */
  .lp .footer-link{
    display:inline-block;/* the padding would otherwise not be part of the target */
    font-size:13px;color:var(--tx2);text-decoration:none;
    padding:2px 0;transition:color .15s;
  }
  .lp .footer-link:hover{color:var(--tx)}

  /* Copyright hard left, credit hard right, on any screen with room for it.
     Below that they centre in a stack, which reads better than two items
     fighting over one narrow row. */
  .footer-bottom{margin-top:clamp(32px,4vw,48px);padding-top:20px;border-top:1px solid var(--br);display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;text-align:left}
  .footer-bottom p{margin:0;font-size:12px;color:var(--tx3)}
  .footer-made-by{margin-left:auto}
  /* On wide screens give the credit link some horizontal padding so it is not
     pinned hard against the edge. */
  @media(min-width:761px){
    .footer-made-by{padding:4px 16px}
  }
  @media(max-width:760px){
    .footer-bottom{justify-content:center;text-align:center}
  }
  .footer-bottom-links{list-style:none;display:flex;gap:18px;margin:0;padding:0;align-items:center}
  .footer-bottom-links a{font-size:12px;color:var(--tx3);transition:color .15s;display:inline-flex;align-items:center;gap:5px}
  .footer-bottom-links a:hover{color:var(--tx)}
  /* nowrap matters here: right aligned in a row, the anchor had just enough
     width for the icon on one line and the words on the next. flex-shrink:0
     keeps the whole credit from being squeezed onto a second line on any
     screen width. */
  .footer-made-by{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;flex-shrink:0}
  /* Stacked and centred once the row runs out of width. The credit used to be
     hidden outright below 640px, which dropped the attribution from the page
     entirely rather than just reflowing it. */
  @media(max-width:760px){.footer-bottom{flex-direction:column;gap:10px}}
  /* Hide the credit on a phone. This has to sit here, after the base
     .footer-made-by rule above, because a bare class in a media query still
     loses to a bare class that comes later in the sheet. The .lp prefix is
     required as well: the markup puts footer-made-by and footer-link on the
     same anchor, and .lp .footer-link sets display too, so a single class
     would never win. */
  @media(max-width:760px){
    .lp .footer-made-by{display:none}
  }

  /* One focus treatment for every footer control. Without this, keyboard users
     get the browser default on a dark surface and it is easy to lose. */
  .lp-footer a:focus-visible{outline:2px solid var(--ac);outline-offset:3px;border-radius:4px}

  @media(max-width:1024px){
    /* Tablet keeps the desktop shape: the brand column stays on the left and the
       link columns stay on the right. Only the link columns reflow, into two rows
       of two. Four link columns beside a 220px brand track leave about 120px per
       column, which wraps "How it works" onto two lines and makes the footer
       twice as tall as its content needs. */
    .footer-grid{gap:clamp(24px,3.5vw,36px)}
    /* No max-width here: two link columns fill the whole nav track, so the links
       reach the right edge of the footer on a tablet the same way the four
       columns do on a desktop. A cap here left a dead strip on the right. */
    .footer-nav{grid-template-columns:repeat(2,1fr);gap:28px 24px}
  }
  @media(max-width:760px){
    /* Phone is the width where the brand column and the link columns cannot sit
       side by side at all, so only here does the grid stack. */
    .footer-grid{grid-template-columns:1fr;gap:36px}
  }
  @media(max-width:640px){
    .lp-footer{padding-top:36px}
    .footer-blurb{max-width:none}
  }
  @media(max-width:480px){
    .fg,.sg{grid-template-columns:1fr!important}
    .hero-section{padding:100px 0 40px!important}
    /* Two panels side by side leaves each one narrow enough for the product
       names to wrap, so a phone gets one panel per row. */
    .vs-tablet{grid-template-columns:1fr!important}
    .vs-card-row{grid-template-columns:88px 1fr;padding:10px 14px}
    .tsc{grid-template-columns:1fr 1fr;gap:5px}
    .tb{font-size:11px!important;padding:9px 6px!important}
    .cmp-card-row{grid-template-columns:64px 1fr;padding:10px 14px}
    .board-kanban-pad{padding:14px 12px!important}
    .footer-nav{gap:24px 16px}
    .footer-cta{width:100%;justify-content:center}
    .cr{flex-direction:column!important;width:100%!important}
    .cr button,.cr a{width:100%!important;justify-content:center!important;height:44px!important;font-size:13px!important}
    .hero-sub{font-size:16px!important;padding:0 8px!important}
  }
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
  // Same order as the sections themselves. The old list ran Features, How It
  // Works, Product while the page ran Product, Features, How It Works, so every
  // jump landed out of order.
  const links = [["Product", "#showcase"], ["How It Works", "#how-it-works"], ["Features", "#features"], ["Compare", "#compare"], ["Pricing", "#pricing"], ["FAQ", "#faq"]];
  return (<>
    <nav className={`lp-nav${mob ? " lp-nav-open" : ""}`} style={{ borderBottom: `1px solid ${scrolled || mob ? "var(--br)" : "transparent"}`, background: scrolled || mob ? "var(--nb)" : "transparent", backdropFilter: scrolled || mob ? "blur(24px)" : "none", WebkitBackdropFilter: scrolled || mob ? "blur(24px)" : "none" }}>
      <div style={{ position: "absolute", bottom: -1, left: 0, height: 1, background: "linear-gradient(90deg,var(--ac),var(--pu))", width: `${prog * 100}%`, transition: "width .1s linear", opacity: mob ? 0 : 1 }} />
      <div className="lp-wrap nav-inner" style={{ width: "100%", maxWidth: "none" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }} onClick={closeMob}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--ac)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 0 18px var(--ag)" }}><IC.Zap size={13} /></div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--tx)", letterSpacing: "-0.025em" }}>Kanbi</span>
        </Link>
        <div className="nl" style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "center" }}>
          {links.map(([l, h]) => <a key={l} href={h} className="na" style={{ fontSize: 13.5, fontWeight: 500, color: "var(--tx2)", transition: "color .15s", whiteSpace: "nowrap", padding: "6px 12px", borderRadius: 8 }}>{l}</a>)}
        </div>
        <div className="nav-actions">
          <button className="nav-theme-btn" onClick={toggle} aria-label="Toggle theme" style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid var(--br)", background: "var(--bg1)", color: "var(--tx2)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s", flexShrink: 0 }} onMouseOver={e => { e.currentTarget.style.borderColor = "var(--brh)"; e.currentTarget.style.color = "var(--tx)" }} onMouseOut={e => { e.currentTarget.style.borderColor = "var(--br)"; e.currentTarget.style.color = "var(--tx2)" }}>
            {theme === "dark" ? <IC.Sun size={14} /> : <IC.Moon size={14} />}
          </button>
          {user
            ? <a href="/dashboard" className="nav-cta-desktop" style={{ height: 34, padding: "0 15px", borderRadius: 8, background: "var(--inv)", color: "var(--inv2)", fontSize: 13, fontWeight: 600, alignItems: "center", transition: "opacity .15s", textDecoration: "none", whiteSpace: "nowrap" }} onMouseOver={e => (e.currentTarget.style.opacity = ".88")} onMouseOut={e => (e.currentTarget.style.opacity = "1")}>Dashboard</a>
            : <button onClick={handleGetStarted} className="nav-cta-desktop" style={{ height: 34, padding: "0 15px", borderRadius: 8, background: "var(--ac)", color: "#fff", fontSize: 13, fontWeight: 600, alignItems: "center", transition: "opacity .15s", border: "none", whiteSpace: "nowrap" }} onMouseOver={e => (e.currentTarget.style.opacity = ".88")} onMouseOut={e => (e.currentTarget.style.opacity = "1")}>Get Started Free</button>
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
    <div className="hero-workload-bar" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, border: "1px solid var(--br)", background: "var(--bg2)", flexWrap: "wrap" }}>
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

const BADGE_WORDS = [
  { pre: "Paste notes.", hi: "Get a board instantly." },
  { pre: "AI extracts tasks.", hi: "You stay in control." },
  { pre: "Plan your week.", hi: "Autopilot does the math." },
  { pre: "Built for solo work.", hi: "No team required." },
];
function HeroBadge() {
  const [i, setI] = useState(0);
  const [vis, setVis] = useState(true);
  useEffect(() => {
    const id = setInterval(() => {
      setVis(false);
      setTimeout(() => { setI(p => (p + 1) % BADGE_WORDS.length); setVis(true); }, 220);
    }, 2600);
    return () => clearInterval(id);
  }, []);
  const w = BADGE_WORDS[i]!;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 13px 5px 6px", borderRadius: 100, border: "1px solid var(--ag)", background: "var(--as)", marginBottom: 28 }}>
      <span style={{ width: 18, height: 18, borderRadius: "50%", background: "linear-gradient(135deg,var(--ac),var(--pu))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 7px var(--ag)" }}><IC.Spark size={10} /></span>
      <span style={{ fontSize: 12, fontWeight: 500, color: "var(--tx2)", animation: vis ? "badgeFadeUp .22s ease both" : "none", opacity: vis ? 1 : 0, whiteSpace: "nowrap", letterSpacing: "-0.01em" }}>
        {w.pre} <span style={{ fontWeight: 800, color: "var(--tx)" }}>{w.hi}</span>
      </span>
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
<HeroBadge />
        <h1 className="hh" style={{ fontSize: "clamp(52px,7vw,96px)", fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 1.03, color: "var(--tx)", marginBottom: 28 }}>
          Turn hours of task{" "}
          <span style={{ position: "relative", display: "inline-block" }}><Wavy /><span style={{ color: "var(--ac-text)", fontWeight: 800 }}>planning</span></span>
          {" "}into{" "}<span style={{ color: "var(--ac-text)", fontWeight: 800 }}>a real task board</span>
        </h1>
        <p className="hero-sub" style={{ fontSize: 19, color: "var(--tx2)", maxWidth: 580, margin: "0 auto 44px", lineHeight: 1.65 }}>Paste Your Docs. Kanbi extracts tasks, sets priorities, and builds your Kanban board in seconds. Built for freelancers and solo operators.</p>
        <div className="cr" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={handleGetStarted} style={{ height: 48, padding: "0 26px", borderRadius: 10, background: "var(--ac)", color: "#fff", fontSize: 14, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 9, boxShadow: "0 0 0 1px var(--ag),0 10px 38px var(--ag)", transition: "opacity .15s", border: "none" }} onMouseOver={e => (e.currentTarget.style.opacity = ".88")} onMouseOut={e => (e.currentTarget.style.opacity = "1")}>Start for Free <IC.Arrow size={15} /></button>
          <a href="#showcase" className="hero-cta-secondary" style={{ height: 48, padding: "0 22px", borderRadius: 10, fontSize: 14, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 8 }}><Eye size={15} />See product</a>
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
                  { label: "Assistant", icon: ICONS.chat },
                  { label: "Autopilot", icon: ICONS.autopilot },
                  { label: "Saved", icon: FileDown },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="msb-nav-item" style={{ padding: "10px 10px", margin: "4px 0", borderRadius: 10, background: item.active ? "var(--as)" : "transparent", fontSize: 12, color: item.active ? "var(--ac)" : "var(--tx2)", fontWeight: item.active ? 600 : 500, border: "1px solid", borderColor: item.active ? "var(--ag)" : "transparent", display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 24, height: 24, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: item.active ? "rgba(94,111,232,0.18)" : "var(--bg2)", color: item.active ? "var(--ac)" : "var(--tx3)" }}><Icon size={13} /></span>
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
                    <div className="pulse" style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--ac)" }} />
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
                            <p className="task-title" style={{ fontSize: 11.5, color: col.col === "Done" ? "var(--tx3)" : "var(--tx)", fontWeight: 600, lineHeight: 1.45, textDecoration: col.col === "Done" ? "line-through" : "none" }}>{t.t}</p>
                            <div className="task-tag" style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 6, padding: "2px 7px", borderRadius: 999, background: "var(--bg2)", fontSize: 9, color: "var(--tx3)" }}>
                              <BadgeInfo size={10} />{t.tag}
                            </div>
                          </div>
                          <span style={{ fontSize: 9, fontWeight: 700, color: t.p === "high" ? "var(--rd)" : "var(--am)", flexShrink: 0, marginTop: 3, textTransform: "uppercase" }}>{t.p}</span>
                        </div>
                        {"prog" in t && t.prog !== undefined && (
                          <div className="task-prog" style={{ height: 4, borderRadius: 999, background: "var(--bg2)", overflow: "hidden" }}>
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
                    <div className="bar-chart-wrap" style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6, alignItems: "end", height: 84 }}>
                      {[3, 5, 2, 6, 4, 7, 5].map((n, i) => (
                        <div key={i} className="bar-item" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
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
/* ── Proof: the numbers, the promises, and one honest paragraph ─────────────
   The figures come from src/lib/constants.ts (USAGE_LIMITS) so the page cannot
   drift away from the limits the API actually enforces. */
const PROOF_STATS = [
  { n: 10, label: "AI extractions a day", sub: "Free plan daily limit" },
  { n: 300, label: "Board saves a month", sub: "Free plan monthly limit" },
  { n: 4, label: "Views in one workspace", sub: "Dashboard, Board, Assistant" },
  { n: 0, pre: "$", label: "To start", sub: "No card, no trial period" },
];

const PROOF_CARDS = [
  { I: IC.Shield, t: "Your rows are yours", d: "Every table sits behind row level security, so only your account can read your boards. Nobody else sees them." },
  { I: IC.Brain, t: "The model is optional", d: "If the model runtime is unreachable, extraction falls back to parsing bullet points and the assistant falls back to a board aware reply." },
  { I: IC.Check, t: "Delete and go", d: "Remove your account and every board from Settings, without emailing anyone." },
];

function ProofStat({ n, pre, label, sub, active }: { n: number; pre?: string; label: string; sub: string; active: boolean }) {
  const v = useCountUp(n, active, 1400);
  return (
    <div className="proof-stat">
      {/* The prefix sits outside the animated figure so the count up never
          produces "$" on its own for a frame while it climbs to zero. */}
      <p className="proof-num">{pre}{v}</p>
      <p className="proof-label">{label}</p>
      <p className="proof-sub">{sub}</p>
    </div>
  );
}

function Proof() {
  const ref = useRef<HTMLDivElement>(null);
  const v = useInView(ref as React.RefObject<HTMLElement>);
  return (
    <section id="proof" className="lp-section" style={{ paddingTop: 0 }}>
      <div className="lp-wrap" ref={ref}>
        <div className="proof-stats">
          {PROOF_STATS.map(s => <ProofStat key={s.label} {...s} active={v} />)}
        </div>
        <div className="proof-cards">
          {PROOF_CARDS.map(c => (
            <div key={c.t} className="proof-card">
              <div className="proof-card-ico"><c.I size={15} /></div>
              <p className="proof-card-t">{c.t}</p>
              <p className="proof-card-d">{c.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const TABS = [
  { key: "overview", label: "Dashboard", desc: "See workload health, usage limits, and recent activity in one place. Know when you're overloaded before the week runs away.", features: ["Health score from your active tasks", "Weekly completion chart", "Usage counters for AI and boards", "Quick jump to any workspace"] },
  { key: "board", label: "Kanban Board", desc: "Drag tasks across To Do, In Progress, and Done. Each card shows priority, label, and progress where it matters.", features: ["Three-column Kanban layout", "Priority tags on every card", "Progress bars on active work", "Save and export when you're ready"] },
  { key: "chat", label: "Assistant", desc: "Ask what to tackle first, add tasks in plain English, or reprioritize without leaving the board. The assistant reads your current tasks.", features: ["Board-aware answers", "Create tasks from chat", "Suggest next actions", "Stays in sync with your board"] },
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
              {[["AI today", "7/10", "var(--ac)", "70%"], ["Boards", "3/10", "var(--pu)", "30%"], ["Done rate", "68%", "var(--gr)", "68%"]].map(([l, v, c, w]) => (
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
                <span style={{ fontSize: 9, fontWeight: 800, color: "var(--ac-text)", fontFamily: "var(--font-mono)", flexShrink: 0 }}>{s[0]}</span>
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
          <h2 style={{ fontSize: "clamp(30px,4vw,48px)", fontWeight: 700, letterSpacing: "-0.04em", color: "var(--tx)", marginBottom: 14 }}>Four views, one workflow</h2>
          <p style={{ fontSize: 16, color: "var(--tx2)", maxWidth: 480, margin: "0 auto" }}>From raw notes to a planned day, without switching tools.</p>
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
            <a href="/sign-up" style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 22, height: 40, padding: "0 18px", borderRadius: 9, background: "var(--ac)", color: "#fff", fontSize: 13, fontWeight: 600, transition: "background .15s" }} onMouseOver={e => (e.currentTarget.style.background = "var(--ach)")} onMouseOut={e => (e.currentTarget.style.background = "var(--ac)")}>
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
  { I: IC.Spark, t: "AI task extraction", d: "Paste notes, drop a PDF, or give a URL. The model reads the content and returns tasks with priorities in seconds." },
  { I: IC.Shield, t: "Workload health score", d: "Kanbi flags overload before you commit to too much. One score, computed from what is already on your board." },
  { I: IC.Brain, t: "Board-aware assistant", d: "Ask what to do next, add tasks in plain language, or reprioritize. The assistant reads your current board." },
  { I: IC.Cal, t: "Autopilot scheduling", d: "A morning briefing and suggested time blocks built from your tasks. Push the plan onto the board when it looks right." },
  { I: IC.Export, t: "DOCX and PDF export", d: "Hand a board to a client as a formatted Word document or PDF. No copy paste reformatting." },
  { I: IC.Zap, t: "Templates and saved boards", d: "Start from Daily, Sprint, Meeting, or Project templates. Save finished boards and reload them later." },
];

function Features() {
  return (
    <section id="features" className="lp-section" style={{ borderTop: "1px solid var(--br)" }}>
      <div className="lp-wrap">
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <p className="lp-kicker">Features</p>
          <h2 className="lp-h2">Built for solo operators</h2>
          <p className="lp-lede" style={{ maxWidth: 440, margin: "0 auto" }}>Everything you need to plan a week, nothing you do not need.</p>
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
    { n: "02", t: "AI reads and extracts", d: "The model pulls out action items, assigns priority, and estimates time where it can.", tag: "Open-weight models", I: IC.Spark },
    { n: "03", t: "Plan and ship", d: "Tasks land on your board. Autopilot suggests a day. Export when a client needs a doc.", tag: "Board, Autopilot, Export", I: IC.Zap },
  ];
  return (
    <section id="how-it-works" className="lp-section" style={{ borderTop: "1px solid var(--br)" }}>
      <div className="lp-wrap">
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ac-text)", marginBottom: 14 }}>How It Works</p>
          <h2 style={{ fontSize: "clamp(30px,4vw,48px)", fontWeight: 700, letterSpacing: "-0.04em", color: "var(--tx)" }}>From chaos to clarity in 3 steps</h2>
        </div>
        <div className="g3 sg" style={{ gap: 16 }}>
          {steps.map(s => (
            <div key={s.n} className="sh" style={{ borderRadius: 12, border: "1px solid var(--br)", background: "var(--bg1)", padding: 24, transition: "border-color .18s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--as)", border: "1px solid var(--ag)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ac-text)" }}><s.I size={17} /></div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "var(--tx3)" }}>{s.n}</span>
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


/* The free column and the Pro column list the same features on purpose. The
   paid plan does not unlock anything, it raises the ceilings, so the tables
   must not imply a feature wall that does not exist. The two lists are also
   kept in the same order, so a reader can scan down them side by side. */
const PLAN_FREE = ["10 AI extractions a day", "300 board saves a month", "Full Kanban board", "Priority levels and due dates", "Board templates", "Text, PDF and URL import", "Kanbi assistant", "Workload health score and burnout warnings", "DOCX and PDF export", "Autopilot briefings and time blocks"];
const PLAN_PRO = ["100 AI extractions a day", "1,500 board saves a month", "Full Kanban board", "Priority levels and due dates", "Board templates", "Text, PDF and URL import", "Kanbi assistant", "Workload health score and burnout warnings", "DOCX and PDF export", "Autopilot briefings and time blocks"];

function Pricing() {
  return (
    <section id="pricing" className="lp-section" style={{ borderTop: "1px solid var(--br)" }}>
      <div className="lp-wrap">
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <p className="lp-kicker">Pricing</p>
          <h2 className="lp-h2">One feature list, two limits</h2>
          <p className="lp-lede" style={{ maxWidth: 460, margin: "0 auto" }}>Every capability is on the free plan. Pro raises the daily and monthly ceilings and nothing else.</p>
        </div>
        <div className="g2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, maxWidth: 860, margin: "0 auto" }}>
          <div style={{ borderRadius: 16, border: "1px solid var(--ag)", background: "var(--bg1)", padding: 28, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <p style={{ fontSize: 13, color: "var(--tx)", fontWeight: 600 }}>Free</p>
                <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 100, background: "var(--as)", border: "1px solid var(--ag)", color: "var(--ac-text)", fontWeight: 600 }}>Start here</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 8 }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 46, fontWeight: 700, letterSpacing: "-0.045em", color: "var(--tx)", lineHeight: 1 }}>$0</span>
                <span style={{ fontSize: 13, color: "var(--tx3)", marginBottom: 7 }}>forever</span>
              </div>
              <p style={{ fontSize: 12.5, color: "var(--tx3)", marginBottom: 24, lineHeight: 1.6 }}>No card, no trial, no expiry. Delete your account whenever you like.</p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 11, marginBottom: 28 }}>
                {PLAN_FREE.map(f => <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 13, color: "var(--tx2)" }}><span style={{ color: "var(--ac-text)", flexShrink: 0, marginTop: 1 }}><IC.Check size={14} /></span>{f}</li>)}
              </ul>
              <a href="/sign-up" className="plan-cta plan-cta-primary" style={{ background: "var(--ac-solid)", color: "#fff", border: "1px solid transparent" }}>Create a free account</a>
            </div>
          </div>

          <div style={{ borderRadius: 16, border: "1px solid var(--br)", background: "var(--bg1)", padding: 28, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <p style={{ fontSize: 13, color: "var(--tx2)", fontWeight: 600 }}>Pro</p>
              <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 100, background: "var(--bg2)", border: "1px solid var(--br)", color: "var(--tx3)", fontWeight: 600 }}>Coming soon</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 8 }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 46, fontWeight: 700, letterSpacing: "-0.045em", color: "var(--tx)", lineHeight: 1 }}>$9</span>
              <span style={{ fontSize: 13, color: "var(--tx3)", marginBottom: 7 }}>/month</span>
            </div>
            <p style={{ fontSize: 12.5, color: "var(--tx3)", marginBottom: 24, lineHeight: 1.6 }}>
              Checkout opens when Pro launches. Until then your free account already covers everything above, so there is nothing to wait for.
            </p>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 11, marginBottom: 28 }}>
              {PLAN_PRO.map(f => <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 13, color: "var(--tx2)" }}><span style={{ color: "var(--tx3)", flexShrink: 0, marginTop: 1 }}><IC.Check size={14} /></span>{f}</li>)}
            </ul>
            <p className="plan-cta" style={{ border: "1px dashed var(--brh)", color: "var(--tx3)", background: "transparent" }}>Billing is not switched on yet</p>
          </div>
        </div>
        <p style={{ textAlign: "center", fontSize: 12, color: "var(--tx3)", marginTop: 18 }}>No contracts. Questions? <a href="https://muhammadtanveerabbas.vercel.app" target="_blank" rel="noreferrer noopener" style={{ color: "var(--ac-text)" }}>Contact us</a></p>
      </div>
    </section>
  );
}

/* ── Compare ───────────────────────────────────────────────────────────────
   The rows are chosen so every cell is checkable by the reader in one glance:
   each competitor column says how you get the result, not a verdict. */
const VS_COLS = [
  { name: "What matters", I: ListTodo },
  { name: "Kanbi", I: CheckCircle2 },
  { name: "A notes app", I: FileText },
  { name: "Notion", I: BookOpenText },
  { name: "Trello", I: SquareKanban },
];
/* The four products, without the row label. VS_ROWS.v is indexed by this list,
   so anything that reads a cell by column has to use this and not VS_COLS.
   Indexing VS_COLS instead shifts every value one column left and leaves the
   last product with no value at all. */
const VS_PRODUCTS = VS_COLS.slice(1);
/* One icon per row, chosen for the thing being compared rather than for the
   product, so the same icon means the same thing in all three layouts. */
const VS_ROWS = [
  { I: ClipboardList, f: "Notes to a board", v: ["From any paste, PDF or URL", "You retype every task", "You retype every task", "You retype every task"] },
  { I: Gauge, f: "Workload health score", v: ["Built in", "None", "Extra setup", "Extra setup"] },
  { I: CalendarClock, f: "Daily autopilot plan", v: ["Built in", "None", "None", "None"] },
  { I: FileDown, f: "Client handoff", v: ["DOCX and PDF export", "Copy and paste", "Export by hand", "Export by hand"] },
  { I: IC.Zap, f: "Setup for one person", v: ["Under a minute", "None", "Build a template", "Build a board"] },
  { I: Tag, f: "Cost to try", v: ["Free, no card", "Free", "Free tier", "Free tier"] },
];

function Compare() {
  return (
    <section id="compare" className="lp-section" style={{ borderTop: "1px solid var(--br)" }}>
      <div className="lp-wrap">
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <p className="lp-kicker">Compare</p>
          <h2 className="lp-h2">What you do instead</h2>
          <p className="lp-lede" style={{ maxWidth: 480, margin: "0 auto" }}>
            Every tool below can hold a task. These are the six differences that matter when nobody else is on the board with you.
          </p>
        </div>

        {/* Desktop: a real table, so column widths are the browser's problem and
            not ours. A caption names it for a reader who has lost the layout. */}
        <div className="vs-desktop vs-shell">
          <div className="vs-scroll">
            <table className="vs-table">
              <caption className="sr-only">Kanbi compared with a notes app, Notion, and Trello</caption>
              <thead>
                <tr>
                  {VS_COLS.map(c => (
                    <th key={c.name} scope="col" className={c.name === "Kanbi" ? "is-kanbi" : undefined}>
                      <span className="vs-col-head">
                        <span className="vs-col-head-ico"><c.I size={11} /></span>
                        {c.name}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {VS_ROWS.map(r => (
                  <tr key={r.f}>
                    <th scope="row">
                      <span className="vs-rowhead">
                        <span className="vs-rowhead-ico"><r.I size={14} /></span>
                        {r.f}
                      </span>
                    </th>
                    {r.v.map((cell, i) => (
                      <td key={i} className={i === 0 ? "is-kanbi" : undefined}>
                        {i === 0
                          ? <span className="vs-yes"><IC.Check size={13} />{cell}</span>
                          : <span className="vs-no"><span className="vs-no-ico" aria-hidden="true">-</span>{cell}</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tablet: one panel per feature. Each panel lists all four products, with
            the Kanbi row filled in so the eye lands on it first. */}
        <div className="vs-tablet">
          {VS_ROWS.map(r => (
            <div key={r.f} className="vs-panel">
              <div className="vs-panel-head">
                <span className="vs-rowhead-ico"><r.I size={14} /></span>
                <span className="vs-panel-t">{r.f}</span>
              </div>
              {VS_PRODUCTS.map((c, ci) => (
                <div key={c.name} className={`vs-panel-row${ci === 0 ? " is-kanbi" : ""}`}>
                  <span className="vs-panel-name">{c.name}</span>
                  <span className="vs-panel-val">{r.v[ci]}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Phone: one card per product. Four columns at 360px is four unreadable
            columns, so the rows become label and value pairs. */}
        <div className="vs-mobile">
          {VS_PRODUCTS.map((c, ci) => (
            <div key={c.name} className={`vs-card${ci === 0 ? " is-kanbi" : ""}`}>
              <div className="vs-card-head">
                <span className="vs-card-head-label">
                  <span className="vs-card-head-ico"><c.I size={11} /></span>
                  {c.name}
                </span>
                {ci === 0 ? (
                  <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 9px", borderRadius: 100, background: "var(--as)", border: "1px solid var(--ag)", color: "var(--ac-text)" }}>This one</span>
                ) : (
                  <span className="vs-card-head-ico"><c.I size={11} /></span>
                )}
              </div>
              {VS_ROWS.map(r => (
                <div key={r.f} className={`vs-card-row${ci === 0 ? " is-kanbi" : ""}`}>
                  <span className="vs-card-k"><r.I size={12} />{r.f}</span>
                  <span className="vs-card-v">{r.v[ci]}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Who it is for ──────────────────────────────────────────────────────────
   Roles rather than testimonials. A made up quote from a made up person is
   the one thing on a landing page that cannot be earned back later. */
const WHO = [
  { I: IC.Board, t: "Freelance developers", d: "Client tickets, standup notes, and a spec you were emailed. All three land on one board without a template.", tag: "Board, export" },
  { I: IC.Spark, t: "Designers and studios", d: "Feedback threads and revision lists become prioritised tasks, and the finished board goes to the client as a PDF.", tag: "PDF export" },
  { I: IC.Cal, t: "Consultants and coaches", d: "A week of sessions becomes a planned week with a capacity you can actually keep, not one you promise on Monday.", tag: "Autopilot, health" },
];

function WhoFor() {
  return (
    <section id="who" className="lp-section" style={{ borderTop: "1px solid var(--br)" }}>
      <div className="lp-wrap">
        {/* Centred like the other section headers on the page. The 520px cap
            keeps the lede to a readable measure, so it is centred rather than
            stretched across the wrap. */}
        <div style={{ marginBottom: 44, maxWidth: 520, marginInline: "auto", textAlign: "center" }}>
          <p className="lp-kicker">Who it is for</p>
          <h2 className="lp-h2">Made for one person, not a team</h2>
          <p className="lp-lede">Kanbi assumes you are the whole company. That is why there is no invite flow and no seat count.</p>
        </div>
        <div className="who-cards">
          {WHO.map(w => (
            <div key={w.t} className="who-card">
              <div className="proof-card-ico"><w.I size={15} /></div>
              <p className="who-card-t">{w.t}</p>
              <p className="who-card-d">{w.d}</p>
              <span className="who-card-tag">{w.tag}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Final CTA ─────────────────────────────────────────────────────────────
   The only full bleed block on the page. Everything above it is a heading with
   content under it, so a closing panel with no heading of its own reads as the
   end of the page rather than as one more section to skim past. */
function CTABanner() {
  return (
    <section className="lp-section" style={{ paddingTop: 0 }}>
      <div className="lp-wrap">
        <div className="cta-banner">
          <div className="cta-banner-grid" aria-hidden="true" />
          <div className="cta-banner-glow" aria-hidden="true" />
          <div className="cta-banner-inner">
            <h2 className="lp-h2" style={{ marginBottom: 12 }}>Start with the notes you already have</h2>
            <p className="lp-lede" style={{ maxWidth: 460, margin: "0 auto" }}>
              Paste a standup transcript or upload a PDF. You will have a board with priorities before you finish reading this sentence.
            </p>
            <div className="cta-actions">
              <a href="/sign-up" style={{ height: 48, padding: "0 26px", borderRadius: 10, background: "var(--ac-solid)", color: "#fff", fontSize: 14, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 9, boxShadow: "0 10px 38px var(--ag)", transition: "background .15s" }}>
                Create your free board <IC.Arrow size={15} />
              </a>
              <a href="#showcase" style={{ height: 48, padding: "0 22px", borderRadius: 10, fontSize: 14, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 8, background: "var(--bg2)", border: "1px solid var(--brh)", color: "var(--tx2)", transition: "color .15s,border-color .15s" }}>
                <Eye size={15} />Look inside first
              </a>
            </div>
            <div className="cta-stats">
              {[
                { I: CreditCard, t: "No card required" },
                { I: Lock, t: "Row level security" },
                { I: Trash2, t: "Delete your data" },
              ].map(s => (
                <span key={s.t} className="cta-stat">
                  <span className="cta-stat-ico"><s.I size={13} /></span>
                  {s.t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const faqs = [
    { q: "How accurate is the AI task extraction?", a: 'The model behind extraction is selected per request from whatever open-weight runtime this deployment runs, so the available model can change without the product changing. It works best on structured notes and emails with clear action items. You can edit any task before saving. Nothing is locked in automatically.' },
    { q: "Is my data private and secure?", a: "Boards and tasks are stored in Supabase with row-level security, so only your account can read them. We don't sell your data. You can delete your account and data from Settings." },
    { q: "How does task parsing work?", a: "Paste text or upload a PDF. The model reads the content, extracts action items, assigns a priority, and optionally estimates time. It handles casual phrasing like follow up on or due Friday without templates." },
    { q: "Does Kanbi integrate with other tools?", a: "You can export boards as DOCX or PDF for client handoffs and import tasks from URLs. More integrations are on the roadmap." },
    { q: "Is there a free plan?", a: "Yes. Free includes 10 AI extractions a day and 300 board saves a month, with no credit card. Pro is planned at $9 a month and raises those ceilings to 100 a day and 1,500 a month. Every capability is on the free plan already, so the paid plan raises limits rather than unlocking features." },
    { q: "Can I pay for Pro today?", a: "Not yet. The price shown on this page is what Pro will cost when checkout opens. Nothing sits behind it in the meantime, so a free account gives you the full product." },
    { q: "How is Kanbi different from Asana or Notion?", a: "Team tools assume you will create every task by hand. Kanbi starts from messy input like notes, emails, and PDFs, and builds the board for you. Health scoring and autopilot are built in for solo planning." },
  ];
  return (
    <section id="faq" className="lp-section" style={{ borderTop: "1px solid var(--br)" }}>
      <div className="lp-wrap" style={{ maxWidth: 720 }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p className="lp-kicker">FAQ</p>
          <h2 className="lp-h2" style={{ marginBottom: 0 }}>Common questions</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {faqs.map((f, i) => (
            <div key={f.q} className="fi" style={{ border: `1px solid ${open === i ? "var(--ag)" : "var(--br)"}`, borderRadius: 10, overflow: "hidden" }}>
              <button className="faq-btn" id={`faq-btn-${i}`} aria-expanded={open === i} aria-controls={`faq-panel-${i}`} onClick={() => setOpen(open === i ? null : i)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 17px", background: "transparent", border: "none", color: "var(--tx)", fontSize: 13.5, fontWeight: 500, textAlign: "left", gap: 12, cursor: "pointer" }}>
                <span>{f.q}</span>
                <span style={{ color: "var(--tx3)", flexShrink: 0, transform: open === i ? "rotate(180deg)" : "none", transition: "transform .2s" }}><IC.ChevD size={14} /></span>
              </button>
              {open === i && <div id={`faq-panel-${i}`} role="region" aria-labelledby={`faq-btn-${i}`} style={{ padding: "0 17px 15px", fontSize: 13, color: "var(--tx2)", lineHeight: 1.7 }}>{f.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FOOTER_COLUMNS: Array<{
  heading: string
  icon: React.ReactNode
  links: Array<{ label: string; href: string; external?: boolean; icon?: React.ReactNode }>
}> = [
  {
    heading: 'Product',
    icon: <IC.Board size={12} />,
    links: [
      { label: 'Features', href: '#features', icon: <IC.Spark size={11} /> },
      { label: 'How it works', href: '#how-it-works', icon: <IC.Chart size={11} /> },
      { label: 'Compare', href: '#compare', icon: <IC.Board size={11} /> },
      { label: 'Pricing', href: '/pricing', icon: <IC.Shield size={11} /> },
      { label: 'Changelog', href: '/changelog', icon: <IC.Cal size={11} /> },
    ],
  },
  {
    heading: 'Account',
    icon: <IC.Shield size={12} />,
    links: [
      { label: 'Sign up', href: '/sign-up', icon: <IC.Arrow size={11} /> },
      { label: 'Sign in', href: '/sign-in', icon: <IC.Check size={11} /> },
      { label: 'Reset password', href: '/reset-password', icon: <IC.Moon size={11} /> },
    ],
  },
  {
    heading: 'Resources',
    icon: <IC.Chat size={12} />,
    links: [
      { label: 'FAQ', href: '#faq', icon: <IC.Brain size={11} /> },
      { label: 'Who it is for', href: '#who', icon: <IC.Cal size={11} /> },
      { label: 'Source on GitHub', href: 'https://github.com/MuhammadTanveerAbbas/kanbi', external: true, icon: <IC.Export size={11} /> },
      { label: 'Report an issue', href: 'https://github.com/MuhammadTanveerAbbas/kanbi/issues', external: true, icon: <IC.Spark size={11} /> },
    ],
  },
  {
    heading: 'Legal',
    icon: <IC.Shield size={12} />,
    links: [
      { label: 'Privacy', href: '/privacy', icon: <IC.Shield size={11} /> },
      { label: 'Terms', href: '/terms', icon: <IC.Check size={11} /> },
    ],
  },
]

function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-wrap">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="footer-logo-mark" aria-hidden="true">
                <IC.Zap size={13} />
              </span>
              <span className="footer-logo-text">Kanbi</span>
            </div>
            <p className="footer-blurb">
              Task management for people who work alone. Paste notes, get a
              board, plan your day.
            </p>
            <Link href="/sign-up" className="footer-cta">
              Start free
              <IC.Arrow size={14} />
            </Link>

          </div>

          <nav className="footer-nav" aria-label="Footer">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.heading} className="footer-col">
                <h2 className="footer-col-heading" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span aria-hidden="true" style={{ opacity: 0.7 }}>{col.icon}</span>
                  {col.heading}
                </h2>
                <ul className="footer-col-list">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="footer-link"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        {...(link.external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
                      >
                        {link.icon && <span aria-hidden="true" style={{ opacity: 0.55, flexShrink: 0 }}>{link.icon}</span>}
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Kanbi. All rights reserved.</p>
          <a href="https://muhammadtanveerabbas.vercel.app" target="_blank" rel="noreferrer noopener"
            className="footer-made-by footer-link" style={{ fontSize: 12, color: "var(--tx3)" }}>
            Made by Tanveer
          </a>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  // The store is the single source of truth. Painting is CSS driven from the
  // document head, so this hook exists only to label the toggle correctly.
  const { theme, toggle } = useSiteTheme();
  return (
    <ThemeCtx.Provider value={{ theme, toggle }}>
      <Styles />
      <div className="lp" style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--tx)" }}>
        <Navbar />
        {/* Ten sections. The order is the argument: what it is, what it costs to
            trust, what it does, how it does it, who it is for, what you do
            instead, what it charges, what people ask, then the ask itself. */}
        <main><Hero /><Proof /><Showcase /><HowItWorks /><Features /><WhoFor /><Compare /><Pricing /><FAQ /><CTABanner /></main>
        <Footer />
      </div>
    </ThemeCtx.Provider>
  );
}
