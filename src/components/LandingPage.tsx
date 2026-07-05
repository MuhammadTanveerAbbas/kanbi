"use client";
// KANBI LANDING PAGE v3
// Updates: (1) Hero mock matches new dashboard (sidebar+health ring+progress bars)
//          (2) NEW tabbed Product Showcase   Dashboard, Board, AI Chat, Autopilot
import { useState, useEffect, useRef, createContext, useContext, useCallback, type ComponentType } from "react";
import { createClient } from '@/lib/supabase/client';
import { BarChart3, CalendarDays, CircleGauge, ClipboardList, Layers3, MessageSquareText, WandSparkles, Workflow, ShieldCheck, Eye, MoveRight, ArrowRight, Sparkles, CheckCircle2, TimerReset, PanelTop, FileDown, BrainCircuit, Boxes, Target, ListTodo, TrendingUp, BadgeCheck, Flame, Orbit, LaptopMinimal, PanelRightOpen, Stars, GitBranch, Gauge, Clock3, Route, BadgeInfo, SquareKanban, SplitSquareVertical, ArrowUpRight, BookOpenText } from "lucide-react";

type Theme="dark"|"light";
const ThemeCtx=createContext<{theme:Theme;toggle:()=>void}>({theme:"dark",toggle:()=>{}});
const useTheme=()=>useContext(ThemeCtx);

const DV=`--bg:#07070b;--bg1:#0d0d13;--bg2:#111119;--bg3:#16161f;--br:rgba(255,255,255,0.07);--brh:rgba(255,255,255,0.13);--tx:#e0e0ea;--tx2:#787896;--tx3:#3e3e55;--inv:#fff;--inv2:#07070b;--nb:rgba(7,7,11,0.88);`;
const LV=`--bg:#f2f3fb;--bg1:#ffffff;--bg2:#eaebf8;--bg3:#e0e2f5;--br:rgba(0,0,0,0.07);--brh:rgba(0,0,0,0.14);--tx:#0a0a18;--tx2:#4a4a72;--tx3:#9898b8;--inv:#0a0a18;--inv2:#fff;--nb:rgba(242,243,251,0.92);`;

function Styles({theme}:{theme:Theme}){return <style suppressHydrationWarning>{`
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0} html{scroll-behavior:smooth}
  :root{${theme==="dark"?DV:LV}--ac:#5e6fe8;--ach:#6e7ff8;--as:rgba(94,111,232,0.12);--ag:rgba(94,111,232,0.22);--gr:#22c55e;--am:#f59e0b;--rd:#ef4444;--pu:#a78bfa;}
  .lp{font-family:var(--font-geist),-apple-system,BlinkMacSystemFont,sans-serif;background:var(--bg);color:var(--tx);-webkit-font-smoothing:antialiased;overflow-x:hidden;transition:background .2s,color .2s}
  .lp a{text-decoration:none;color:inherit} .lp button{font-family:inherit;cursor:pointer}
  .lp ::-webkit-scrollbar{width:3px} .lp ::-webkit-scrollbar-track{background:var(--bg)} .lp ::-webkit-scrollbar-thumb{background:var(--br);border-radius:3px}
  @keyframes shimmer{from{background-position:-300% center}to{background-position:300% center}}
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.55)}}
  .shimmer{background:linear-gradient(90deg,var(--ac),var(--pu) 40%,var(--ac) 70%,var(--pu));background-size:300% auto;-webkit-background-clip:text;background-clip:text;color:transparent;animation:shimmer 4s linear infinite}
  .pulse{animation:pulse 2.2s ease-in-out infinite}
  .wavy{stroke-dasharray:380;stroke-dashoffset:380;transition:stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1) .2s}
  .wavy.drawn{stroke-dashoffset:0}
  .na:hover{color:var(--tx)!important}
  .fc{transition:background .18s,border-color .18s,transform .18s} .fc:hover{background:var(--bg2)!important;border-color:var(--brh)!important;transform:translateY(-2px)}
  .sh:hover{border-color:var(--ac)!important}
  .fi{transition:border-color .18s}
  .tb{transition:all .15s;min-width:0}
  .hero-section{padding:148px 0 80px}
  .hero-mock-grid{display:grid;grid-template-columns:220px 1fr;min-height:520px}
  .hero-kanban{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
  .hero-charts{display:grid;grid-template-columns:1.05fr .95fr;gap:12px}
  .hero-mock-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
  .cta-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:26px;align-items:center}
  @media(max-width:1024px){
    .hero-section{padding:128px 0 64px!important}
    .hero-mock-grid{grid-template-columns:1fr!important;min-height:auto!important}
    .hero-charts{grid-template-columns:1fr!important}
    .cta-grid{grid-template-columns:1fr!important}
    .g2{grid-template-columns:1fr!important}
  }
  @media(max-width:768px){
    .nl{display:none!important} .ms{display:flex!important}
    .hh{font-size:clamp(34px,8vw,52px)!important}
    .hero-section{padding:112px 0 48px!important}
    .msb{display:none!important}
    .hero-kanban{grid-template-columns:1fr!important}
    .hero-mock-head{align-items:flex-start!important}
    .cr{flex-direction:column!important;align-items:stretch!important}
    .cr a,.cr button{justify-content:center!important}
    .g3{grid-template-columns:1fr!important}
    .fg{grid-template-columns:1fr 1fr!important}
    .tsc{overflow-x:auto;-webkit-overflow-scrolling:touch}
    .hero-badge{padding:5px 10px!important}
    .badge-text{font-size:10px!important;white-space:normal!important;text-align:center!important;line-height:1.3!important}
    .cmp-table{overflow-x:auto!important}
    .hero-mock-wrap{margin-top:40px!important;border-radius:18px!important}
  }
  @media(max-width:480px){
    .fg,.sg{grid-template-columns:1fr!important}
    .hero-section{padding:100px 0 40px!important}
    .cmp-table>div{grid-template-columns:1fr!important}
    .cmp-table>div>div{border-left:none!important;border-bottom:1px solid var(--br)!important}
    .cmp-table>div>div:last-child{border-bottom:none!important}
  }
`}</style>;}

function useInView(ref:React.RefObject<HTMLElement|null>,thr=0.12){
  const [v,setV]=useState(false);
  useEffect(()=>{const el=ref.current;if(!el)return;const o=new IntersectionObserver(([e])=>{if(e?.isIntersecting){setV(true);o.disconnect();}},{threshold:thr});o.observe(el);return()=>o.disconnect();},[]);
  return v;
}
function useCountUp(target:number,active:boolean,dur=1600){
  const [n,setN]=useState(0);
  useEffect(()=>{if(!active)return;let r:number;const t0=performance.now();const tick=(now:number)=>{const p=Math.min((now-t0)/dur,1),e=1-Math.pow(1-p,3);setN(Math.round(e*target));if(p<1)r=requestAnimationFrame(tick);};r=requestAnimationFrame(tick);return()=>cancelAnimationFrame(r);},[active,target,dur]);
  return n;
}
function useScrollP(){
  const [p,setP]=useState(0);
  useEffect(()=>{const fn=()=>{const d=document.documentElement;setP(d.scrollTop/(d.scrollHeight-d.clientHeight)||0);};window.addEventListener("scroll",fn,{passive:true});return()=>window.removeEventListener("scroll",fn);},[]);
  return p;
}

function ST({text,delay=0,style:s,playOnMount=false}:{text:string;delay?:number;style?:React.CSSProperties;playOnMount?:boolean}){
  const ref=useRef<HTMLSpanElement>(null);
  const inView=useInView(ref as React.RefObject<HTMLElement>,0.08);
  const [ready,setReady]=useState(false);
  useEffect(()=>{if(playOnMount){const t=requestAnimationFrame(()=>setReady(true));return()=>cancelAnimationFrame(t);}},[playOnMount]);
  const v=playOnMount?ready:inView;
  return <span ref={ref} style={{display:"inline",...s}}>{text.split("").map((ch,i)=><span key={i} style={{display:"inline-block",opacity:v?1:0,transform:v?"translateY(0) scale(1)":"translateY(13px) scale(.93)",transition:`opacity .26s ease ${delay+i*.018}s,transform .36s cubic-bezier(.22,1,.36,1) ${delay+i*.018}s`,whiteSpace:ch===" "?"pre":undefined}}>{ch===" "?"\u00a0":ch}</span>)}</span>;
}

function Wavy({playOnMount=false}:{playOnMount?:boolean}){
  const ref=useRef<HTMLSpanElement>(null);
  const inView=useInView(ref as React.RefObject<HTMLElement>,0.08);
  const [ready,setReady]=useState(false);
  useEffect(()=>{if(playOnMount){const t=requestAnimationFrame(()=>setReady(true));return()=>cancelAnimationFrame(t);}},[playOnMount]);
  const v=playOnMount?ready:inView;
  return <span ref={ref} style={{position:"relative",display:"inline-block"}}>
    <svg viewBox="0 0 290 13" preserveAspectRatio="none" style={{position:"absolute",bottom:-10,left:0,width:"100%",height:13,overflow:"visible",pointerEvents:"none"}}>
      <defs><linearGradient id="wg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="var(--ac)"/><stop offset="55%" stopColor="var(--pu)"/><stop offset="100%" stopColor="var(--ac)"/></linearGradient></defs>
      <path className={`wavy${v?" drawn":""}`} d="M3 8 C25 2,50 13,75 7 C100 1,125 13,150 7 C175 1,200 13,225 7 C250 1,268 11,287 7" fill="none" stroke="url(#wg)" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  </span>;
}

const S=(d:string|string[],sw="1.8")=>({size=16}:{size?:number})=>(
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {(Array.isArray(d)?d:[d]).map((p,i)=><path key={i} d={p}/>)}
  </svg>
);
const IC={
  Zap:S("M13 2L3 14h9l-1 8 10-12h-9l1-8z","2.2"),
  Spark:S("M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z"),
  Shield:S("M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"),
  Brain:S("M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"),
  Cal:S(["M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z","M16 2v4M8 2v4M3 10h18"]),
  Chart:S("M18 20V10M12 20V4M6 20v-6"),
  Chat:S("M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"),
  Export:S(["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4","M17 8l-5-5-5 5","M12 3v12"]),

  Board:S(["M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"]),
  Check:S("M20 6L9 17l-5-5","2.5"),
  Arrow:S("M5 12h14M12 5l7 7-7 7","2.2"),
  ChevD:S("M6 9l6 6 6-6","2"),
  Sun:S("M12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7zm0-4v2M12 19v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"),
  Moon:S("M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"),
  Menu:S("M4 6h16M4 12h16M4 18h16","2"),
  X:S("M18 6L6 18M6 6l12 12","2"),
  Github:S("M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"),
  TW:S("M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"),
  LI:S(["M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z","M2 9h4v12H2z","M4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"]),
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

function Navbar(){
  const {theme,toggle}=useTheme();
  const [mob,setMob]=useState(false);
  const [scrolled,setScrolled]=useState(false);
  const [user,setUser]=useState<{id:string}|null>(null);
  const prog=useScrollP();
  const handleGetStarted=()=>{
    window.location.href='/sign-up';
  };
  useEffect(()=>{const fn=()=>setScrolled(window.scrollY>24);window.addEventListener("scroll",fn,{passive:true});return()=>window.removeEventListener("scroll",fn);},[]);
  useEffect(()=>{
    const supabase=createClient();
    supabase.auth.getUser().then(({data})=>setUser(data.user));
  },[]);
  const links=[["Features","#features"],["How It Works","#how-it-works"],["Product","#showcase"],["Pricing","/pricing"],["FAQ","#faq"]];
  return(<>
    <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:200,height:56,display:"flex",alignItems:"center",borderBottom:`1px solid ${scrolled?"var(--br)":"transparent"}`,background:scrolled?"var(--nb)":"transparent",backdropFilter:scrolled?"blur(24px)":"none",WebkitBackdropFilter:scrolled?"blur(24px)":"none",transition:"background .3s,border-color .3s"}}>
      <div style={{position:"absolute",bottom:-1,left:0,height:1,background:"linear-gradient(90deg,var(--ac),var(--pu))",width:`${prog*100}%`,transition:"width .1s linear"}}/>
      <div style={{maxWidth:1140,margin:"0 auto",padding:"0 24px",width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <a href="/" style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:28,height:28,borderRadius:8,background:"var(--ac)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",boxShadow:"0 0 18px var(--ag)"}}><IC.Zap size={13}/></div>
          <span style={{fontSize:15,fontWeight:700,color:"var(--tx)",letterSpacing:"-0.025em"}}>Kanbi</span>
        </a>
        <div className="nl" style={{display:"flex",gap:26,alignItems:"center"}}>
          {links.map(([l,h])=><a key={l} href={h} className="na" style={{fontSize:13,color:"var(--tx2)",transition:"color .15s"}}>{l}</a>)}
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={toggle} style={{width:34,height:34,borderRadius:8,border:"1px solid var(--br)",background:"var(--bg1)",color:"var(--tx2)",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}} onMouseOver={e=>{e.currentTarget.style.borderColor="var(--brh)";e.currentTarget.style.color="var(--tx)"}} onMouseOut={e=>{e.currentTarget.style.borderColor="var(--br)";e.currentTarget.style.color="var(--tx2)"}}>
            {theme==="dark"?<IC.Sun size={14}/>:<IC.Moon size={14}/>}
          </button>
          {user
            ? <a href="/dashboard" style={{height:34,padding:"0 15px",borderRadius:8,background:"var(--inv)",color:"var(--inv2)",fontSize:13,fontWeight:600,display:"inline-flex",alignItems:"center",transition:"opacity .15s",textDecoration:"none"}} onMouseOver={e=>(e.currentTarget.style.opacity=".88")} onMouseOut={e=>(e.currentTarget.style.opacity="1")}>Dashboard</a>
            : <button onClick={handleGetStarted} style={{height:34,padding:"0 15px",borderRadius:8,background:"var(--inv)",color:"var(--inv2)",fontSize:13,fontWeight:600,display:"inline-flex",alignItems:"center",transition:"opacity .15s",border:"none"}} onMouseOver={e=>(e.currentTarget.style.opacity=".88")} onMouseOut={e=>(e.currentTarget.style.opacity="1")}>Get Started Free</button>
          }
          <button className="ms" onClick={()=>setMob(!mob)} style={{display:"none",background:"none",border:"none",color:"var(--tx2)",padding:4}}>{mob?<IC.X/>:<IC.Menu/>}</button>
        </div>
      </div>
    </nav>
    {mob&&<div style={{position:"fixed",top:56,left:0,right:0,zIndex:199,background:"var(--bg1)",borderBottom:"1px solid var(--br)",padding:"20px 24px",display:"flex",flexDirection:"column",gap:16}}>
      {links.map(([l,h])=><a key={l} href={h} onClick={()=>setMob(false)} style={{fontSize:14,color:"var(--tx2)"}}>{l}</a>)}
      {user
        ? <a href="/dashboard" onClick={()=>setMob(false)} style={{height:42,borderRadius:9,background:"var(--ac)",color:"#fff",fontSize:13,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center"}}>Dashboard</a>
        : <a href="/sign-up" onClick={()=>setMob(false)} style={{height:42,borderRadius:9,background:"var(--ac)",color:"#fff",fontSize:13,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center"}}>Get Started Free</a>
      }
    </div>}
  </>);
}

function HeroWorkloadBar({active,score=82}:{active:boolean;score?:number}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:12,border:"1px solid var(--br)",background:"var(--bg2)",flexWrap:"wrap"}}>
      <div style={{display:"flex",alignItems:"center",gap:6,minWidth:88}}>
        <ShieldCheck size={14} style={{color:"var(--gr)",flexShrink:0}}/>
        <span style={{fontSize:11,fontWeight:600,color:"var(--tx)"}}>Workload</span>
      </div>
      <div style={{flex:"1 1 120px",height:7,borderRadius:999,background:"var(--bg3)",overflow:"hidden"}}>
        <div style={{height:"100%",width:active?`${score}%`:"0%",borderRadius:999,background:"linear-gradient(90deg,var(--gr),#4ade80)",transition:"width 1s cubic-bezier(.22,1,.36,1) .35s"}}/>
      </div>
      <span style={{fontSize:13,fontWeight:700,color:"var(--tx)",fontVariantNumeric:"tabular-nums",whiteSpace:"nowrap"}}>{score}<span style={{color:"var(--tx3)",fontWeight:500,fontSize:11}}> / 100</span></span>
      <span style={{fontSize:10,fontWeight:600,color:"var(--gr)",padding:"4px 9px",borderRadius:999,background:"rgba(34,197,94,0.12)",border:"1px solid rgba(34,197,94,0.2)",whiteSpace:"nowrap"}}>Balanced</span>
    </div>
  );
}

function Hero(){
  const ref=useRef<HTMLDivElement>(null);
  const v=useInView(ref as React.RefObject<HTMLElement>);
  const handleGetStarted=()=>{
    window.location.href='/sign-up';
  };
  return(
    <section className="hero-section" style={{position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,pointerEvents:"none",backgroundImage:"linear-gradient(var(--br) 1px,transparent 1px),linear-gradient(90deg,var(--br) 1px,transparent 1px)",backgroundSize:"72px 72px"}}/>
      <div style={{position:"absolute",top:-60,left:"50%",transform:"translateX(-50%)",width:800,height:520,background:"radial-gradient(ellipse,var(--ag) 0%,transparent 68%)",pointerEvents:"none"}}/>
      <div style={{maxWidth:1140,margin:"0 auto",padding:"0 24px",textAlign:"center",position:"relative"}}>
        <div className="hero-badge" style={{display:"inline-flex",alignItems:"center",gap:8,padding:"5px 14px 5px 10px",borderRadius:100,border:"1px solid var(--ag)",background:"var(--as)",marginBottom:28}}>
          <div style={{width:20,height:20,borderRadius:6,background:"var(--as)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--ac)",flexShrink:0}}><IC.Spark size={13}/></div>
          <span className="badge-text" style={{fontSize:"clamp(10px,2vw,12px)",color:"var(--ac)",fontWeight:500,whiteSpace:"nowrap"}}>Groq AI, Kanban, workload health, Autopilot</span>
        </div>
        <h1 className="hh" style={{fontSize:"clamp(44px,7.5vw,86px)",fontWeight:800,letterSpacing:"-0.048em",lineHeight:1.04,color:"var(--tx)",marginBottom:24}}>
          <ST text="Turn hours of task" delay={0} playOnMount/>{" "}
          <span style={{position:"relative",display:"inline-block"}}><Wavy playOnMount/><ST text="planning" delay={0.34} playOnMount style={{color:"var(--ac)",fontWeight:800} as React.CSSProperties}/></span>
          <br/>{"into "}<span style={{color:"var(--ac)",fontWeight:800}}><ST text="10 seconds" delay={0.56} playOnMount/></span>
        </h1>
        <p style={{fontSize:17,color:"var(--tx2)",maxWidth:560,margin:"0 auto 40px",lineHeight:1.7}}>Paste notes, emails, or PDFs. Kanbi extracts tasks, sets priorities, and builds your Kanban board in seconds. Built for freelancers and solo operators.</p>
        <div className="cr" style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
          <button onClick={handleGetStarted} style={{height:48,padding:"0 26px",borderRadius:10,background:"var(--ac)",color:"#fff",fontSize:14,fontWeight:600,display:"inline-flex",alignItems:"center",gap:9,boxShadow:"0 0 0 1px var(--ag),0 10px 38px var(--ag)",transition:"background .15s",border:"none"}} onMouseOver={e=>(e.currentTarget.style.background="var(--ach)")} onMouseOut={e=>(e.currentTarget.style.background="var(--ac)")}>Start for Free <IC.Arrow size={15}/></button>
          <a href="#showcase" style={{height:48,padding:"0 22px",borderRadius:10,border:"1px solid var(--br)",fontSize:14,color:"var(--tx2)",display:"inline-flex",alignItems:"center",gap:6,transition:"all .15s"}} onMouseOver={e=>{e.currentTarget.style.borderColor="var(--brh)";e.currentTarget.style.color="var(--tx)"}} onMouseOut={e=>{e.currentTarget.style.borderColor="var(--br)";e.currentTarget.style.color="var(--tx2)"}}>See product <IC.ChevD size={14}/></a>
        </div>
        <p style={{marginTop:14,fontSize:12,color:"var(--tx3)"}}>Free plan, 10 AI extractions per day, no card required</p>
        <div ref={ref} className="hero-mock-wrap" style={{marginTop:60,borderRadius:24,border:"1px solid var(--br)",background:"linear-gradient(180deg,rgba(255,255,255,0.03),transparent 28%),var(--bg1)",overflow:"hidden",boxShadow:"0 0 0 1px rgba(255,255,255,0.03),0 42px 120px rgba(0,0,0,0.62)"}}>
          <div className="hero-mock-grid">
            <div className="msb" style={{borderRight:"1px solid var(--br)",background:"linear-gradient(180deg,var(--bg),var(--bg1))",padding:"18px 14px",flexShrink:0}}>
              <div style={{padding:"0 4px 14px",borderBottom:"1px solid var(--br)",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:28,height:28,borderRadius:8,background:"linear-gradient(135deg,var(--ac),var(--pu))",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",boxShadow:"0 0 18px var(--ag)"}}><IC.Zap size={13}/></div>
                    <div>
                      <span style={{display:"block",fontSize:13,fontWeight:700,color:"var(--tx)"}}>Kanbi</span>
                      <span style={{fontSize:9,color:"var(--tx3)"}}>Overview</span>
                    </div>
                  </div>
                </div>
              </div>
              {[
                {label:"Overview",icon:ICONS.dashboard,active:true},
                {label:"Board",icon:ICONS.board},
                {label:"AI Chat",icon:ICONS.chat},
                {label:"Autopilot",icon:ICONS.autopilot},
                {label:"Saved",icon:FileDown},
              ].map(item=>{
                const Icon = item.icon;
                return (
                  <div key={item.label} style={{padding:"10px 10px",margin:"4px 0",borderRadius:10,background:item.active?"var(--as)":"transparent",fontSize:12,color:item.active?"var(--ac)":"var(--tx2)",fontWeight:item.active?600:500,border:"1px solid",borderColor:item.active?"var(--ag)":"transparent",display:"flex",alignItems:"center",gap:10}}>
                    <span style={{width:24,height:24,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",background:item.active?"rgba(94,111,232,0.18)":"var(--bg2)",color:item.active?"var(--ac)":"var(--tx3)"}}><Icon size={13}/></span>
                    {item.label}
                  </div>
                );
              })}
            </div>
            <div style={{minWidth:0,display:"flex",flexDirection:"column",background:"radial-gradient(circle at top right,rgba(167,139,250,0.08),transparent 34%),var(--bg1)"}}>
              <div className="hero-mock-head" style={{borderBottom:"1px solid var(--br)",padding:"14px 18px",flexShrink:0}}>
                <div style={{minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                    <span style={{fontSize:13,fontWeight:700,color:"var(--tx)"}}>Client sprint</span>
                    <span style={{fontSize:10,padding:"2px 7px",borderRadius:999,background:"var(--bg2)",color:"var(--tx3)"}}>6 tasks</span>
                  </div>
                  <p style={{fontSize:11,color:"var(--tx3)"}}>From Friday standup notes</p>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",borderRadius:999,background:"var(--as)",border:"1px solid var(--ag)"}}>
                    <div className="pulse" style={{width:5,height:5,borderRadius:"50%",background:"var(--ac)"}}/>
                    <span style={{fontSize:10,color:"var(--ac)",fontWeight:600}}>6 tasks added</span>
                  </div>
                </div>
              </div>
              <div style={{padding:"12px 18px 0"}}>
                <HeroWorkloadBar active={v} score={82}/>
              </div>
              <div className="hero-kanban" style={{padding:16,alignItems:"start"}}>
                {[
                  {col:"To Do",color:"var(--ac)",tasks:[{t:"Send revised quote to Meridian",p:"high",tag:"Client"},{t:"Update case study draft",p:"medium",tag:"Marketing"}]},
                  {col:"In Progress",color:"var(--am)",tasks:[{t:"Stripe webhook fix",p:"high",prog:55,tag:"Dev"},{t:"Landing page copy pass",p:"medium",prog:30,tag:"Design"}]},
                  {col:"Done",color:"var(--gr)",tasks:[{t:"Deploy staging build",p:"high",tag:"Ops"},{t:"Invoice for March retainer",p:"medium",tag:"Admin"}]},
                ].map(col=>(
                  <div key={col.col} style={{borderRadius:16,border:"1px solid var(--br)",background:"linear-gradient(180deg,var(--bg2),var(--bg1))",padding:12,boxShadow:"inset 0 1px 0 rgba(255,255,255,0.02)"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                      <div style={{display:"flex",alignItems:"center",gap:7}}>
                        <div style={{width:8,height:8,borderRadius:"50%",background:col.color,boxShadow:`0 0 0 4px color-mix(in srgb, ${col.color} 12%, transparent)`}}/>
                        <span style={{fontSize:10,fontWeight:800,letterSpacing:"0.08em",textTransform:"uppercase",color:"var(--tx3)"}}>{col.col}</span>
                      </div>
                      <span style={{fontSize:10,color:"var(--tx3)"}}>{col.tasks.length}</span>
                    </div>
                    {col.tasks.map((t,i)=>(
                      <div key={i} style={{borderRadius:12,border:"1px solid var(--br)",background:"rgba(255,255,255,0.02)",padding:10,marginBottom:8}}>
                        <div style={{display:"flex",justifyContent:"space-between",gap:8,marginBottom:"prog" in t&&t.prog!==undefined?8:4}}>
                          <div style={{flex:1}}>
                            <p style={{fontSize:11.5,color:col.col==="Done"?"var(--tx3)":"var(--tx)",fontWeight:600,lineHeight:1.45,textDecoration:col.col==="Done"?"line-through":"none"}}>{t.t}</p>
                            <div style={{display:"inline-flex",alignItems:"center",gap:5,marginTop:6,padding:"2px 7px",borderRadius:999,background:"var(--bg2)",fontSize:9,color:"var(--tx3)"}}>
                              <BadgeInfo size={10}/>{t.tag}
                            </div>
                          </div>
                          <span style={{fontSize:9,fontWeight:700,color:t.p==="high"?"var(--rd)":"var(--am)",flexShrink:0,marginTop:3,textTransform:"uppercase"}}>{t.p}</span>
                        </div>
                        {"prog" in t&&t.prog!==undefined&&(
                          <div style={{height:4,borderRadius:999,background:"var(--bg2)",overflow:"hidden"}}>
                            <div style={{height:"100%",width:v?`${t.prog}%`:"0%",transition:"width .8s ease .6s",borderRadius:999,background:"linear-gradient(90deg,var(--ac),var(--pu))"}}/>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div style={{padding:"0 16px 16px"}}>
                <div className="hero-charts">
                  <div style={{borderRadius:16,border:"1px solid var(--br)",background:"linear-gradient(180deg,rgba(94,111,232,0.1),rgba(94,111,232,0.03))",padding:14}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <ICONS.analytics size={16} />
                        <span style={{fontSize:12,fontWeight:700,color:"var(--tx)"}}>Completed this week</span>
                      </div>
                      <span style={{fontSize:10,color:"var(--tx3)"}}>Last 7 days</span>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6,alignItems:"end",height:84}}>
                      {[3,5,2,6,4,7,5].map((n,i)=>(
                        <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                          <div style={{width:"100%",height:84,display:"flex",alignItems:"end"}}>
                            <div style={{width:"100%",height:v?`${Math.min(n*12,84)}%`:"0%",borderRadius:"8px 8px 4px 4px",background:i===6?"linear-gradient(180deg,var(--ac),var(--pu))":"linear-gradient(180deg,var(--bg3),var(--brh))",transition:`height .8s ease ${0.15 + i*0.08}s`}}/>
                          </div>
                          <span style={{fontSize:8,color:"var(--tx3)"}}>{["M","T","W","T","F","S","S"][i]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{borderRadius:16,border:"1px solid var(--br)",background:"linear-gradient(180deg,var(--bg2),var(--bg1))",padding:14}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                      <ICONS.flow size={16}/>
                      <span style={{fontSize:12,fontWeight:700,color:"var(--tx)"}}>Today&apos;s mix</span>
                    </div>
                    {[
                      {l:"Client work",v:45,c:"var(--ac)"},
                      {l:"Deep work",v:35,c:"var(--pu)"},
                      {l:"Admin",v:20,c:"var(--am)"},
                    ].map(item=>(
                      <div key={item.l} style={{marginBottom:10}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                          <span style={{fontSize:10,color:"var(--tx3)"}}>{item.l}</span>
                          <span style={{fontSize:10,fontWeight:700,color:item.c}}>{item.v}%</span>
                        </div>
                        <div style={{height:6,borderRadius:999,background:"var(--bg2)",overflow:"hidden"}}>
                          <div style={{height:"100%",width:v?`${item.v}%`:"0%",borderRadius:999,background:item.c,transition:"width .9s ease .6s"}}/>
                        </div>
                      </div>
                    ))}
                    <div style={{marginTop:12,padding:10,borderRadius:12,background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.18)",display:"flex",alignItems:"center",gap:7}}>
                      <BadgeCheck size={14} style={{color:"var(--gr)"}}/>
                      <span style={{fontSize:10.5,color:"var(--gr)",fontWeight:600}}>Workload within your daily capacity.</span>
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

function Strip(){return(
  <div style={{borderTop:"1px solid var(--br)",borderBottom:"1px solid var(--br)",padding:"14px 0"}}>
    <div style={{maxWidth:1140,margin:"0 auto",padding:"0 24px",display:"flex",alignItems:"center",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
      <span style={{fontSize:11,color:"var(--tx3)",marginRight:6}}>Works with</span>
      {["PDF Upload","URL Import","DOCX Export","Groq AI","Supabase"].map(t=>(
        <span key={t} style={{padding:"4px 11px",borderRadius:6,border:"1px solid var(--br)",background:"var(--bg1)",fontSize:11,color:"var(--tx3)",fontWeight:500}}>{t}</span>
      ))}
    </div>
  </div>
);}

// ── PRODUCT SHOWCASE (new section with 4 tabs) ──────────────────────────
const TABS=[
  {key:"overview",label:"Dashboard",desc:"See workload health, usage limits, and recent activity in one place. Know when you're overloaded before the week runs away.",features:["Health score from your active tasks","Weekly completion chart","Usage counters for AI and boards","Quick jump to any workspace"]},
  {key:"board",label:"Kanban Board",desc:"Drag tasks across To Do, In Progress, and Done. Each card shows priority, label, and progress where it matters.",features:["Three-column Kanban layout","Priority tags on every card","Progress bars on active work","Save and export when you're ready"]},
  {key:"chat",label:"AI Chat",desc:"Ask what to tackle first, add tasks in plain English, or reprioritize without leaving the board. The assistant reads your current tasks.",features:["Board-aware answers","Create tasks from chat","Suggest next actions","Stays in sync with your board"]},
  {key:"autopilot",label:"Autopilot",desc:"Get a morning briefing and a time-blocked plan based on what's on your board. Adjust, then push blocks back as tasks.",features:["Daily briefing summary","Suggested time blocks","Capacity-aware scheduling","Add plan to your board"]},
];

function MockPreview({tab}:{tab:typeof TABS[0]}){
  const cols:Record<string,string>={overview:"var(--ac)",board:"var(--am)",chat:"var(--pu)",autopilot:"var(--gr)"};
  const col=cols[tab.key];
  return(
    <div style={{borderRadius:20,border:"1px solid var(--br)",background:"linear-gradient(180deg,rgba(255,255,255,0.03),transparent 28%),var(--bg1)",overflow:"hidden",height:440,display:"flex",flexDirection:"column",boxShadow:"0 18px 60px rgba(0,0,0,0.18)"}}>
      <div style={{display:"flex",alignItems:"center",gap:6,padding:"12px 16px",borderBottom:"1px solid var(--br)",background:"var(--bg)"}}>
        {["#ff5f57","#febc2e","#28c840"].map(c=><div key={c} style={{width:10,height:10,borderRadius:"50%",background:c}}/>)}
        <span style={{fontSize:11,color:"var(--tx3)",marginLeft:6}}>app.kanbi / {tab.key}</span>
        <span style={{marginLeft:"auto",fontSize:10,color:"var(--tx3)"}}>Sample data</span>
      </div>
      <div style={{flex:1,padding:16,display:"flex",flexDirection:"column",gap:12,overflow:"hidden"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:col,boxShadow:`0 0 0 5px color-mix(in srgb, ${col} 14%, transparent)`}}/>
          <span style={{fontSize:12,fontWeight:700,color:"var(--tx)"}}>{tab.label}</span>
          <div className="pulse" style={{width:6,height:6,borderRadius:"50%",background:"var(--gr)",marginLeft:"auto"}}/>
        </div>
        {tab.key==="overview"&&(<>
          {(() => {
            const overviewCards: Array<{ v: string; l: string; I: ComponentType<{ size?: number }> }> = [
              { v: "3/10", l: "Boards today", I: ICONS.dashboard },
              { v: "7/10", l: "AI uses today", I: ICONS.speed },
              { v: "18", l: "Open tasks", I: ICONS.focus },
            ];
            return (
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {overviewCards.map(({ v, l, I }) => {
              const Icon = I;
              return (
              <div key={l as string} style={{borderRadius:14,border:"1px solid var(--br)",background:"linear-gradient(180deg,var(--bg2),var(--bg1))",padding:"12px 12px 11px"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                  <div style={{width:28,height:28,borderRadius:9,background:"var(--as)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--ac)"}}><Icon size={14}/></div>
                  <span style={{fontSize:9,color:"var(--tx3)"}}>{l}</span>
                </div>
                <p style={{fontSize:17,fontWeight:800,color:"var(--tx)",letterSpacing:"-0.04em"}}>{v}</p>
                <p style={{fontSize:9.5,color:"var(--tx3)",marginTop:2}}>Free plan</p>
              </div>
              );
            })}
          </div>
            );
          })()}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,flex:1}}>
            <div style={{borderRadius:16,border:"1px solid var(--br)",background:"linear-gradient(180deg,var(--bg2),var(--bg1))",padding:12,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <ICONS.health size={15}/>
                <span style={{fontSize:11,fontWeight:700,color:"var(--tx)"}}>Health</span>
              </div>
              <svg width="62" height="62" viewBox="0 0 62 62" style={{transform:"rotate(-90deg)"}}>
                <circle cx="31" cy="31" r="23" fill="none" stroke="var(--br)" strokeWidth="7"/>
                <circle cx="31" cy="31" r="23" fill="none" stroke="var(--gr)" strokeWidth="7" strokeLinecap="round" strokeDasharray={2*Math.PI*23} strokeDashoffset={2*Math.PI*23*0.22}/>
              </svg>
              <p style={{fontSize:10,color:"var(--tx3)",marginTop:8}}>Score 82, balanced</p>
            </div>
            <div style={{borderRadius:16,border:"1px solid var(--br)",background:"linear-gradient(180deg,var(--bg2),var(--bg1))",padding:12}}>
              {[["AI today","7/10","var(--ac)","70%"],["Boards","3/10","var(--pu)","30%"],["Done rate","68%","var(--gr)","68%"]].map(([l,v,c,w])=>(
                <div key={l} style={{marginBottom:7}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontSize:9,color:"var(--tx3)"}}>{l}</span>
                    <span style={{fontSize:9,fontWeight:600,color:c}}>{v}</span>
                  </div>
                  <div style={{height:3,borderRadius:2,background:"var(--br)",overflow:"hidden"}}>
                    <div style={{height:"100%",width:w,background:c,borderRadius:2}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>)}
        {tab.key==="board"&&(<>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,flex:1}}>
            {[{c:"To Do",ts:[["Send quote to Meridian","Client", "var(--ac)"],["Refresh portfolio page","Marketing","var(--pu)"]]},{c:"In Progress",ts:[["Webhook retry logic","Dev","var(--am)"],["Blog outline","Content","var(--pu)"]]},{c:"Done",ts:[["Ship v1.2 patch","Ops","var(--gr)"]]}].map(col=>(
              <div key={col.c} style={{borderRadius:14,border:"1px solid var(--br)",background:"linear-gradient(180deg,var(--bg2),var(--bg1))",padding:10}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                  <span style={{fontSize:8.5,fontWeight:800,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:"0.08em"}}>{col.c}</span>
                  <span style={{fontSize:9,color:"var(--tx3)"}}>{col.ts.length}</span>
                </div>
                {col.ts.map(([t,tag,c])=>(
                  <div key={t} style={{borderRadius:10,border:"1px solid var(--br)",background:"rgba(255,255,255,0.02)",padding:"8px 9px",marginBottom:7}}>
                    <p style={{fontSize:9.5,color:"var(--tx)",lineHeight:1.4,fontWeight:600}}>{t}</p>
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:6,alignItems:"center",gap:6}}>
                      <span style={{fontSize:8.5,color:"var(--tx3)",display:"inline-flex",alignItems:"center",gap:4}}><BadgeInfo size={10}/>{tag}</span>
                      <span style={{width:6,height:6,borderRadius:"50%",background:c as string}}/>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div style={{padding:"9px 10px",borderRadius:12,background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.2)",display:"flex",alignItems:"center",gap:6}}>
              <CheckCircle2 size={14} style={{color:"var(--gr)"}}/>
              <span style={{fontSize:9.5,color:"var(--gr)",fontWeight:600}}>Board saved</span>
            </div>
            <div style={{padding:"9px 10px",borderRadius:12,background:"var(--bg2)",border:"1px solid var(--br)",display:"flex",alignItems:"center",gap:6}}>
              <FileDown size={14} style={{color:"var(--tx3)"}}/>
              <span style={{fontSize:9.5,color:"var(--tx2)",fontWeight:600}}>Export PDF or DOCX</span>
            </div>
          </div>
        </>)}
        {tab.key==="chat"&&(
          <div style={{flex:1,display:"grid",gridTemplateColumns:"1.2fr .8fr",gap:10}}>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[{r:"ai",m:"You have 4 open tasks. Meridian quote is highest priority. Want me to block 45 minutes this morning?"},{r:"user",m:"Yes, and add: follow up on invoice"},{r:"ai",m:"Added \"Follow up on invoice\" to To Do (medium). Scheduled quote review for 9:00 AM."}].map((msg,i)=>(
              <div key={i} style={{display:"flex",justifyContent:msg.r==="user"?"flex-end":"flex-start"}}>
                <div style={{maxWidth:"82%",padding:"7px 10px",borderRadius:msg.r==="user"?"9px 2px 9px 9px":"2px 9px 9px 9px",background:msg.r==="user"?"var(--ac)":"var(--bg2)",border:`1px solid ${msg.r==="user"?"var(--ac)":"var(--br)"}`}}>
                  <p style={{fontSize:9.5,color:msg.r==="user"?"#fff":"var(--tx)",lineHeight:1.4}}>{msg.m}</p>
                </div>
              </div>
            ))}
            </div>
            <div style={{borderRadius:14,border:"1px solid var(--br)",background:"linear-gradient(180deg,var(--bg2),var(--bg1))",padding:10}}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:8}}>
                <BrainCircuit size={15} />
                <span style={{fontSize:11,fontWeight:700,color:"var(--tx)"}}>Board context</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {[["Pending","4 tasks"],["Due soon","1 task"],["Focus","Meridian quote"]].map(([a,b])=>(
                  <div key={a} style={{display:"flex",justifyContent:"space-between",padding:"7px 8px",borderRadius:10,background:"rgba(255,255,255,0.02)",border:"1px solid var(--br)"}}>
                    <span style={{fontSize:9.5,color:"var(--tx2)"}}>{a}</span>
                    <span style={{fontSize:9.5,fontWeight:600,color:"var(--tx)"}}>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {tab.key==="autopilot"&&(<>
          <div style={{padding:"10px 12px",borderRadius:14,background:"var(--as)",border:"1px solid var(--ag)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
              <p style={{fontSize:9,color:"var(--ac)",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase"}}>Morning briefing</p>
              <span style={{fontSize:9,color:"var(--ac)",display:"inline-flex",alignItems:"center",gap:4}}><Clock3 size={11}/>Today</span>
            </div>
            <p style={{fontSize:10,color:"var(--tx2)",lineHeight:1.5}}>4 tasks open, 1 urgent. Start with the Meridian quote, then the webhook fix. About 5 hours of focused work.</p>
          </div>
          <div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>
            {[["9:00 AM","Meridian quote review","45m"],["10:00 AM","Webhook retry logic","2h"],["1:30 PM","Portfolio copy edits","1h"]].map((s,i)=>(
              <div key={i} style={{display:"flex",gap:8,padding:"8px 10px",borderRadius:12,background:"linear-gradient(180deg,var(--bg2),var(--bg1))",border:"1px solid var(--br)",alignItems:"center"}}>
                <span style={{fontSize:9,fontWeight:800,color:"var(--ac)",fontFamily:"monospace",flexShrink:0}}>{s[0]}</span>
                <span style={{fontSize:9.5,color:"var(--tx)",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s[1]}</span>
                <span style={{fontSize:9,color:"var(--tx3)",flexShrink:0}}>{s[2]}</span>
              </div>
            ))}
            <button style={{marginTop:2,padding:"8px",borderRadius:12,border:"1px solid var(--ac)",background:"var(--as)",color:"var(--ac)",fontSize:9.5,fontWeight:700,display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6}}>
              Add to board <ArrowUpRight size={12}/>
            </button>
          </div>
        </>)}
      </div>
    </div>
  );
}

function Showcase(){
  const [active,setActive]=useState(0);const tab=TABS[active]!;
  const handleTabClick=(i:number,key:string)=>{setActive(i);};
  return(
    <section id="showcase" style={{padding:"96px 0",borderTop:"1px solid var(--br)"}}>
      <div style={{maxWidth:1140,margin:"0 auto",padding:"0 24px"}}>
        <div style={{textAlign:"center",marginBottom:48}}>
          <p style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--ac)",marginBottom:14}}>Product</p>
          <h2 style={{fontSize:"clamp(26px,4vw,44px)",fontWeight:700,letterSpacing:"-0.035em",color:"var(--tx)",marginBottom:14}}><ST text="Four views, one workflow"/></h2>
          <p style={{fontSize:15,color:"var(--tx2)",maxWidth:480,margin:"0 auto"}}>From raw notes to a planned day, without switching tools.</p>
        </div>
        <div className="tsc" style={{display:"flex",gap:4,marginBottom:28,background:"var(--bg1)",border:"1px solid var(--br)",borderRadius:12,padding:4}}>
          {TABS.map((t,i)=>(
            <button key={t.key} onClick={()=>handleTabClick(i,t.key)} className="tb" style={{flex:1,padding:"9px 12px",borderRadius:9,border:"none",background:active===i?"var(--bg2)":"transparent",color:active===i?"var(--tx)":"var(--tx2)",fontSize:13,fontWeight:active===i?600:400,cursor:"pointer",boxShadow:active===i?"0 1px 4px rgba(0,0,0,.2)":"none",whiteSpace:"nowrap"}}>{t.label}</button>
          ))}
        </div>
        <div className="g2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:32,alignItems:"center"}}>
          <div>
            <h3 style={{fontSize:22,fontWeight:700,letterSpacing:"-0.03em",color:"var(--tx)",marginBottom:12}}>{tab.label}</h3>
            <p style={{fontSize:14.5,color:"var(--tx2)",lineHeight:1.7,marginBottom:20}}>{tab.desc}</p>
            <ul style={{listStyle:"none",display:"flex",flexDirection:"column",gap:10}}>
              {tab.features.map(f=>(
                <li key={f} style={{display:"flex",alignItems:"flex-start",gap:10,fontSize:13.5,color:"var(--tx2)"}}>
                  <span style={{color:"var(--ac)",marginTop:1,flexShrink:0}}><IC.Check size={14}/></span>{f}
                </li>
              ))}
            </ul>
            <a href="/sign-up" style={{display:"inline-flex",alignItems:"center",gap:7,marginTop:22,height:40,padding:"0 18px",borderRadius:9,background:"var(--ac)",color:"#fff",fontSize:13,fontWeight:600,transition:"background .15s"}} onMouseOver={e=>(e.currentTarget.style.background="var(--ach)")} onMouseOut={e=>(e.currentTarget.style.background="var(--ac)")}>
              Try it free <IC.Arrow size={13}/>
            </a>
          </div>
          <MockPreview tab={tab!}/>
        </div>
      </div>
    </section>
  );
}

// ── FEATURES ────
const FEATS=[
  {I:IC.Spark,t:"AI task extraction",d:"Paste notes, emails, or PDF text. Groq reads the content and returns actionable tasks with priorities in seconds."},
  {I:IC.Shield,t:"Workload health score",d:"Kanbi flags overload before you commit to too much. See a simple score based on what's already on your board."},
  {I:IC.Brain,t:"Board-aware AI chat",d:"Ask what to do next, add tasks in plain language, or reprioritize. The assistant sees your current board."},
  {I:IC.Chart,t:"Completion tracking",d:"Track what you finish over time. Spot which priorities pile up and where your week actually goes."},
  {I:IC.Export,t:"DOCX and PDF export",d:"Hand off a board to a client as a formatted Word doc or PDF. No copy paste reformatting."},
  {I:IC.Board,t:"Text, PDF, and URL input",d:"Paste text, upload a PDF, or drop a URL. One extraction flow for the inputs you already have."},
  {I:IC.Cal,t:"Autopilot scheduling",d:"Get a morning briefing and suggested time blocks from your tasks. Push the plan onto your board when it looks right."},
  {I:IC.Zap,t:"Board templates",d:"Start from Daily, Sprint, Meeting, or Project templates instead of an empty board."},
  {I:IC.Chart,t:"Saved boards library",d:"Save boards, search by title, and reload past work without rebuilding from scratch."},
];

function Features(){return(
  <section id="features" style={{padding:"96px 0",borderTop:"1px solid var(--br)"}}>
    <div style={{maxWidth:1140,margin:"0 auto",padding:"0 24px"}}>
      <div style={{textAlign:"center",marginBottom:52}}>
        <p style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--ac)",marginBottom:14}}>Features</p>
        <h2 style={{fontSize:"clamp(26px,4vw,44px)",fontWeight:700,letterSpacing:"-0.035em",color:"var(--tx)",marginBottom:14}}><ST text="Built for solo operators"/></h2>
        <p style={{fontSize:15,color:"var(--tx2)",maxWidth:440,margin:"0 auto"}}>Everything you need to plan a week, nothing you do not need.</p>
      </div>
      <div className="g3" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",border:"1px solid var(--br)",borderRadius:16,overflow:"hidden"}}>
        {FEATS.map((f,i)=>(
          <div key={f.t} className="fc" style={{padding:"24px 22px",borderRight:(i+1)%3!==0?"1px solid var(--br)":"none",borderBottom:i<6?"1px solid var(--br)":"none",background:"var(--bg)",cursor:"default"}}>
            <div style={{width:36,height:36,borderRadius:9,background:"var(--as)",border:"1px solid var(--ag)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--ac)",marginBottom:14}}><f.I size={15}/></div>
            <div style={{fontSize:13.5,fontWeight:600,color:"var(--tx)",marginBottom:7}}>{f.t}</div>
            <div style={{fontSize:12.5,color:"var(--tx2)",lineHeight:1.65}}>{f.d}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);}

function HowItWorks(){
  const steps=[
    {n:"01",t:"Paste raw input",d:"Meeting notes, email threads, or PDF exports. No templates or cleanup required.",tag:"Text, PDF, URL",I:IC.Export},
    {n:"02",t:"AI reads and extracts",d:"Groq pulls out action items, assigns priority, and estimates time where it can.",tag:"Powered by Groq",I:IC.Spark},
    {n:"03",t:"Plan and ship",d:"Tasks land on your board. Autopilot suggests a day. Export when a client needs a doc.",tag:"Board, Autopilot, Export",I:IC.Zap},
  ];
  return(
    <section id="how-it-works" style={{padding:"96px 0",borderTop:"1px solid var(--br)"}}>
      <div style={{maxWidth:1140,margin:"0 auto",padding:"0 24px"}}>
        <div style={{textAlign:"center",marginBottom:52}}>
          <p style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--ac)",marginBottom:14}}>How It Works</p>
          <h2 style={{fontSize:"clamp(26px,4vw,44px)",fontWeight:700,letterSpacing:"-0.035em",color:"var(--tx)"}}><ST text="From chaos to clarity in 3 steps"/></h2>
        </div>
        <div className="g3" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
          {steps.map(s=>(
            <div key={s.n} className="sh" style={{borderRadius:12,border:"1px solid var(--br)",background:"var(--bg1)",padding:24,transition:"border-color .18s"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
                <div style={{width:40,height:40,borderRadius:10,background:"var(--as)",border:"1px solid var(--ag)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--ac)"}}><s.I size={17}/></div>
                <span style={{fontFamily:"monospace",fontSize:11,fontWeight:700,color:"var(--tx3)"}}>{s.n}</span>
              </div>
              <div style={{fontSize:14,fontWeight:600,color:"var(--tx)",marginBottom:8}}>{s.t}</div>
              <div style={{fontSize:12.5,color:"var(--tx2)",lineHeight:1.65,marginBottom:16}}>{s.d}</div>
              <div style={{display:"inline-flex",padding:"4px 10px",borderRadius:6,background:"var(--bg2)",border:"1px solid var(--br)",fontSize:11,color:"var(--tx3)"}}>{s.tag}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ComparisonTable(){
  return(
    <section style={{padding:"96px 0",borderTop:"1px solid var(--br)"}}>
      <div style={{maxWidth:1140,margin:"0 auto",padding:"0 24px"}}>
        <div style={{textAlign:"center",marginBottom:48}}>
          <p style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--ac)",marginBottom:14}}>Why Kanbi</p>
          <h2 style={{fontSize:"clamp(26px,4vw,44px)",fontWeight:700,letterSpacing:"-0.035em",color:"var(--tx)",marginBottom:14}}><ST text="Traditional tools vs Kanbi"/></h2>
          <p style={{fontSize:15,color:"var(--tx2)",maxWidth:480,margin:"0 auto"}}>Manual boards vs. AI-first planning for one person.</p>
        </div>
        <div className="cmp-table" style={{borderRadius:18,border:"1px solid var(--br)",background:"var(--bg1)",overflow:"hidden",boxShadow:"0 16px 60px rgba(0,0,0,0.12)"}}>
          <div style={{display:"grid",gridTemplateColumns:"2fr 1.5fr 1.5fr 1.5fr",borderBottom:"1px solid var(--br)",background:"var(--bg2)"}}>
            <div style={{padding:"14px 20px",fontSize:12,fontWeight:700,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:"0.06em"}}>Feature</div>
            <div style={{padding:"14px 20px",fontSize:12,fontWeight:700,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:"0.06em",borderLeft:"1px solid var(--br)"}}>Notion</div>
            <div style={{padding:"14px 20px",fontSize:12,fontWeight:700,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:"0.06em",borderLeft:"1px solid var(--br)"}}>Asana</div>
            <div style={{padding:"14px 20px",fontSize:12,fontWeight:700,color:"var(--ac)",textTransform:"uppercase",letterSpacing:"0.06em",borderLeft:"1px solid var(--br)",display:"flex",alignItems:"center",gap:6}}><IC.Zap size={13}/>Kanbi</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"2fr 1.5fr 1.5fr 1.5fr"}}>
            <div style={{padding:"16px 20px",fontSize:13.5,color:"var(--tx)",fontWeight:500,display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid var(--br)"}}>
              <span style={{width:28,height:28,borderRadius:9,background:"var(--as)",border:"1px solid var(--ag)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--ac)",flexShrink:0}}>1</span>
              Task extraction speed
            </div>
            <div style={{padding:"16px 20px",fontSize:13,color:"var(--tx3)",borderLeft:"1px solid var(--br)",borderBottom:"1px solid var(--br)"}}>Manual entry</div>
            <div style={{padding:"16px 20px",fontSize:13,color:"var(--tx3)",borderLeft:"1px solid var(--br)",borderBottom:"1px solid var(--br)"}}>Manual entry</div>
            <div style={{padding:"16px 20px",fontSize:13,color:"var(--tx)",fontWeight:500,borderLeft:"1px solid var(--br)",background:"var(--as)",borderBottom:"1px solid var(--br)"}}>Groq AI in under 2 seconds</div>
            <div style={{padding:"16px 20px",fontSize:13.5,color:"var(--tx)",fontWeight:500,display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid var(--br)"}}>
              <span style={{width:28,height:28,borderRadius:9,background:"var(--as)",border:"1px solid var(--ag)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--ac)",flexShrink:0}}>2</span>
              Burnout detection
            </div>
            <div style={{padding:"16px 20px",fontSize:13,color:"var(--tx3)",borderLeft:"1px solid var(--br)",borderBottom:"1px solid var(--br)"}}>None</div>
            <div style={{padding:"16px 20px",fontSize:13,color:"var(--tx3)",borderLeft:"1px solid var(--br)",borderBottom:"1px solid var(--br)"}}>None</div>
            <div style={{padding:"16px 20px",fontSize:13,color:"var(--tx)",fontWeight:500,borderLeft:"1px solid var(--br)",background:"var(--as)",borderBottom:"1px solid var(--br)"}}>Real-time health score</div>
            <div style={{padding:"16px 20px",fontSize:13.5,color:"var(--tx)",fontWeight:500,display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid var(--br)"}}>
              <span style={{width:28,height:28,borderRadius:9,background:"var(--as)",border:"1px solid var(--ag)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--ac)",flexShrink:0}}>3</span>
              AI coaching
            </div>
            <div style={{padding:"16px 20px",fontSize:13,color:"var(--tx3)",borderLeft:"1px solid var(--br)",borderBottom:"1px solid var(--br)"}}>AI writing assist only</div>
            <div style={{padding:"16px 20px",fontSize:13,color:"var(--tx3)",borderLeft:"1px solid var(--br)",borderBottom:"1px solid var(--br)"}}>None</div>
            <div style={{padding:"16px 20px",fontSize:13,color:"var(--tx)",fontWeight:500,borderLeft:"1px solid var(--br)",background:"var(--as)",borderBottom:"1px solid var(--br)"}}>Chat assistant with board context</div>
            <div style={{padding:"16px 20px",fontSize:13.5,color:"var(--tx)",fontWeight:500,display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid var(--br)"}}>
              <span style={{width:28,height:28,borderRadius:9,background:"var(--as)",border:"1px solid var(--ag)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--ac)",flexShrink:0}}>4</span>
              Board export
            </div>
            <div style={{padding:"16px 20px",fontSize:13,color:"var(--tx3)",borderLeft:"1px solid var(--br)",borderBottom:"1px solid var(--br)"}}>PDF export</div>
            <div style={{padding:"16px 20px",fontSize:13,color:"var(--tx3)",borderLeft:"1px solid var(--br)",borderBottom:"1px solid var(--br)"}}>PDF / CSV (paid)</div>
            <div style={{padding:"16px 20px",fontSize:13,color:"var(--tx)",fontWeight:500,borderLeft:"1px solid var(--br)",background:"var(--as)",borderBottom:"1px solid var(--br)"}}>DOCX or PDF in one click</div>
          </div>
        </div>
        <div style={{marginTop:36,borderRadius:20,border:"1px solid var(--br)",background:"linear-gradient(180deg,var(--bg1),var(--bg2))",padding:"28px 30px",display:"flex",alignItems:"flex-start",gap:20,flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:14,flexWrap:"wrap"}}>
            <div style={{width:52,height:52,borderRadius:16,background:"linear-gradient(135deg,var(--ac),var(--pu))",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 0 18px var(--ag)"}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
              </svg>
            </div>
            <div style={{flex:1,minWidth:200}}>
              <p style={{fontSize:"clamp(13px,2vw,15px)",color:"var(--tx2)",lineHeight:1.65,marginBottom:12,fontStyle:"italic"}}>&ldquo;I was copying tasks from emails into Notion every morning before real work started. Kanbi extracts them in one paste and gives me a board I can actually plan from.&rdquo;</p>
              <p style={{fontSize:13,fontWeight:600,color:"var(--tx)"}}>Muhammad Tanveer Abbas</p>
              <p style={{fontSize:12,color:"var(--tx3)"}}>Founder, Kanbi</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Pricing(){
  const handleProClick=async()=>{
    try{
      const res=await fetch('/api/stripe/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({})});
      const data=await res.json();
      if(data.url)window.location.href=data.url;
      else window.location.href='/sign-up';
    }catch{window.location.href='/sign-up';}
  };
  const freeF=[{t:"10 AI task extractions per day",ok:true},{t:"300 board uses per month",ok:true},{t:"Full Kanban board",ok:true},{t:"Priority levels & due dates",ok:true},{t:"PDF import",ok:false},{t:"AI Chat Coach",ok:false},{t:"Burnout alerts",ok:false}];
  const proF=["50 AI task extractions per day","Unlimited board uses","PDF import & URL extraction","AI Chat Coach (board-aware)","Burnout prevention & health scoring","DOCX & PDF export","Autopilot scheduling & briefings","Priority email support (24h)"];
  return(
    <section id="pricing" style={{padding:"96px 0",borderTop:"1px solid var(--br)"}}>
      <div style={{maxWidth:1140,margin:"0 auto",padding:"0 24px"}}>
        <div style={{textAlign:"center",marginBottom:52}}>
          <p style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--ac)",marginBottom:14}}>Pricing</p>
          <h2 style={{fontSize:"clamp(26px,4vw,44px)",fontWeight:700,letterSpacing:"-0.035em",color:"var(--tx)",marginBottom:14}}><ST text="Simple, honest pricing"/></h2>
          <p style={{fontSize:15,color:"var(--tx2)"}}>Start free. Upgrade when you're ready.</p>
        </div>
        <div className="g2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,maxWidth:860,margin:"0 auto"}}>
          <div style={{borderRadius:14,border:"1px solid var(--br)",background:"var(--bg1)",padding:28}}>
            <p style={{fontSize:13,color:"var(--tx2)",fontWeight:500,marginBottom:6}}>Free</p>
            <div style={{display:"flex",alignItems:"flex-end",gap:4,marginBottom:6}}>
              <span style={{fontSize:46,fontWeight:700,letterSpacing:"-0.04em",color:"var(--tx)",lineHeight:1}}>$0</span>
              <span style={{fontSize:13,color:"var(--tx3)",marginBottom:7}}>/month</span>
            </div>
            <p style={{fontSize:12.5,color:"var(--tx3)",marginBottom:24}}>Perfect for getting started.</p>
            <ul style={{listStyle:"none",display:"flex",flexDirection:"column",gap:11,marginBottom:26}}>
              {freeF.map(f=><li key={f.t} style={{display:"flex",alignItems:"flex-start",gap:9,fontSize:13,color:f.ok?"var(--tx2)":"var(--tx3)"}}><span style={{color:f.ok?"var(--ac)":"var(--tx3)",flexShrink:0,marginTop:1}}><IC.Check size={14}/></span>{f.t}</li>)}
            </ul>
            <a href="/sign-up" style={{display:"block",height:38,borderRadius:8,border:"1px solid var(--br)",fontSize:13,fontWeight:500,color:"var(--tx)",textAlign:"center",lineHeight:"38px",transition:"background .15s"}} onMouseOver={e=>(e.currentTarget.style.background="var(--bg2)")} onMouseOut={e=>(e.currentTarget.style.background="transparent")}>Get Started Free</a>
          </div>
          <div style={{borderRadius:14,border:"1px solid var(--ag)",background:"var(--bg1)",padding:28,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:340,height:130,background:"radial-gradient(ellipse at top,var(--ag) 0%,transparent 70%)",pointerEvents:"none"}}/>
            <div style={{position:"relative"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <p style={{fontSize:13,color:"var(--tx2)",fontWeight:500}}>Pro</p>
                <span style={{fontSize:11,padding:"3px 9px",borderRadius:100,background:"var(--as)",border:"1px solid var(--ag)",color:"var(--ac)",fontWeight:600}}>Most Popular</span>
              </div>
              <div style={{display:"flex",alignItems:"flex-end",gap:4,marginBottom:6}}>
                <span style={{fontSize:46,fontWeight:700,letterSpacing:"-0.04em",color:"var(--tx)",lineHeight:1}}>$9</span>
                <span style={{fontSize:13,color:"var(--tx3)",marginBottom:7}}>/month</span>
              </div>
              <p style={{fontSize:12.5,color:"var(--tx3)",marginBottom:24}}>For serious freelancers.</p>
              <ul style={{listStyle:"none",display:"flex",flexDirection:"column",gap:11,marginBottom:26}}>
                {proF.map(f=><li key={f} style={{display:"flex",alignItems:"flex-start",gap:9,fontSize:13,color:"var(--tx2)"}}><span style={{color:"var(--ac)",flexShrink:0,marginTop:1}}><IC.Check size={14}/></span>{f}</li>)}
              </ul>
              <button onClick={handleProClick} style={{display:"block",width:"100%",height:38,borderRadius:8,background:"var(--ac)",fontSize:13,fontWeight:600,color:"#fff",textAlign:"center",lineHeight:"38px",boxShadow:"0 4px 20px var(--ag)",transition:"background .15s",border:"none"}} onMouseOver={e=>(e.currentTarget.style.background="var(--ach)")} onMouseOut={e=>(e.currentTarget.style.background="var(--ac)")}>Start Pro   $9/mo</button>
              <p style={{textAlign:"center",fontSize:11,color:"var(--tx3)",marginTop:10}}>Stripe billing. Cancel anytime.</p>
            </div>
          </div>
        </div>
        <p style={{textAlign:"center",fontSize:12,color:"var(--tx3)",marginTop:18}}>No contracts. Questions? <a href="mailto:themvpguy.contact@gmail.com" style={{color:"var(--ac)"}}>themvpguy.contact@gmail.com</a></p>
      </div>
    </section>
  );
}

function FAQ(){
  const [open,setOpen]=useState<number|null>(null);
  const faqs=[
    {q:"How accurate is the AI task extraction?",a:"Kanbi uses Groq's llama-3.3-70b model. It works best on structured notes and emails with clear action items. You can edit any task before saving. Nothing is locked in automatically."},
    {q:"Is my data private and secure?",a:"Boards and tasks are stored in Supabase with row-level security, so only your account can read them. We don't sell your data. You can delete your account and data from Settings."},
    {q:"How does task parsing work?",a:"Paste text or upload a PDF. The model reads the content, extracts action items, assigns a priority, and optionally estimates time. It handles casual phrasing like follow up on or due Friday without templates."},
    {q:"Does Kanbi integrate with other tools?",a:"You can export boards as DOCX or PDF for client handoffs and import tasks from URLs. More integrations are on the roadmap."},
    {q:"Is there a free plan?",a:"Yes. Free includes 10 AI extractions per day and 300 board uses per month, no credit card. Pro ($9/month) raises limits and unlocks PDF import, AI chat, burnout alerts, and export."},
    {q:"How is Kanbi different from Asana or Notion?",a:"Team tools assume you will create every task by hand. Kanbi starts from messy input like notes, emails, and PDFs, and builds the board for you. Health scoring and autopilot are built in for solo planning."},
  ];
  return(
    <section id="faq" style={{padding:"96px 0",borderTop:"1px solid var(--br)"}}>
      <div style={{maxWidth:720,margin:"0 auto",padding:"0 24px"}}>
        <div style={{textAlign:"center",marginBottom:48}}>
          <p style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--ac)",marginBottom:14}}>FAQ</p>
          <h2 style={{fontSize:"clamp(26px,4vw,44px)",fontWeight:700,letterSpacing:"-0.035em",color:"var(--tx)"}}><ST text="Common questions"/></h2>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          {faqs.map((f,i)=>(
            <div key={f.q} className="fi" style={{border:`1px solid ${open===i?"var(--ag)":"var(--br)"}`,borderRadius:10,overflow:"hidden"}}>
              <button onClick={()=>setOpen(open===i?null:i)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"15px 17px",background:"transparent",border:"none",color:"var(--tx)",fontSize:13.5,fontWeight:500,textAlign:"left",gap:12,cursor:"pointer"}}>
                <span>{f.q}</span>
                <span style={{color:"var(--tx3)",flexShrink:0,transform:open===i?"rotate(180deg)":"none",transition:"transform .2s"}}><IC.ChevD size={14}/></span>
              </button>
              {open===i&&<div style={{padding:"0 17px 15px",fontSize:13,color:"var(--tx2)",lineHeight:1.7}}>{f.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTABanner(){
  const handleGetStarted=()=>{
    window.location.href='/sign-up';
  };
  return(
  <section style={{padding:"96px 0",borderTop:"1px solid var(--br)"}}>
    <div style={{maxWidth:1140,margin:"0 auto",padding:"0 24px"}}>
      <div style={{borderRadius:24,border:"1px solid var(--ag)",background:"radial-gradient(circle at top,rgba(94,111,232,0.18),transparent 42%),linear-gradient(180deg,var(--bg1),var(--bg2))",padding:"38px",position:"relative",overflow:"hidden",boxShadow:"0 30px 120px rgba(0,0,0,0.22)"}}>
        <div style={{position:"absolute",inset:0,pointerEvents:"none",backgroundImage:"linear-gradient(var(--br) 1px,transparent 1px),linear-gradient(90deg,var(--br) 1px,transparent 1px)",backgroundSize:"64px 64px",maskImage:"radial-gradient(circle at center, black 30%, transparent 85%)",opacity:.35}}/>
        <div style={{position:"relative",display:"grid",gridTemplateColumns:"1.05fr .95fr",gap:26,alignItems:"center"}} className="cta-grid">
          <div style={{textAlign:"left"}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:999,border:"1px solid var(--ag)",background:"var(--as)",marginBottom:18}}>
              <Sparkles size={14} style={{color:"var(--ac)"}}/>
              <span style={{fontSize:11,fontWeight:700,color:"var(--ac)",letterSpacing:"0.06em",textTransform:"uppercase"}}>Get started</span>
            </div>
            <h2 style={{fontSize:"clamp(30px,5vw,56px)",fontWeight:800,letterSpacing:"-0.04em",color:"var(--tx)",marginBottom:14,lineHeight:1.02}}><ST text="Your next board is one paste away"/></h2>
            <p style={{fontSize:15,color:"var(--tx2)",maxWidth:520,margin:"0 0 28px",lineHeight:1.7}}>Create a free account, paste your notes, and see tasks on a board in seconds. Upgrade to Pro when you need more extractions and exports.</p>
            <div className="cr" style={{display:"flex",gap:12,justifyContent:"flex-start",flexWrap:"wrap"}}>
              <button onClick={handleGetStarted} style={{height:50,padding:"0 26px",borderRadius:14,background:"linear-gradient(135deg,var(--ac),#7c83ff)",color:"#fff",fontSize:14,fontWeight:800,display:"inline-flex",alignItems:"center",gap:10,transition:"transform .15s,opacity .15s",border:"none",boxShadow:"0 14px 36px var(--ag)"}} onMouseOver={e=>{e.currentTarget.style.transform="translateY(-1px)"}} onMouseOut={e=>{e.currentTarget.style.transform="translateY(0)"}}>Create free account <ArrowRight size={16}/></button>
              <a href="#pricing" style={{height:50,padding:"0 20px",borderRadius:14,border:"1px solid var(--brh)",fontSize:14,color:"var(--tx2)",display:"inline-flex",alignItems:"center",gap:8,transition:"all .15s",background:"rgba(255,255,255,0.02)"}} onMouseOver={e=>{e.currentTarget.style.borderColor="var(--ag)";e.currentTarget.style.color="var(--tx)";e.currentTarget.style.transform="translateY(-1px)"}} onMouseOut={e=>{e.currentTarget.style.borderColor="var(--brh)";e.currentTarget.style.color="var(--tx2)";e.currentTarget.style.transform="translateY(0)"}}>View pricing <MoveRight size={16}/></a>
            </div>
            <div style={{display:"flex",gap:18,flexWrap:"wrap",marginTop:24}}>
              {[
                ["10/day","free AI extractions"],
                ["$0","to start"],
                ["$9/mo","Pro when ready"],
              ].map(([v,l])=>(
                <div key={v} style={{display:"flex",flexDirection:"column",gap:2}}>
                  <span style={{fontSize:24,fontWeight:800,letterSpacing:"-0.04em",color:"var(--tx)"}}>{v}</span>
                  <span style={{fontSize:11,color:"var(--tx3)"}}>{l}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{borderRadius:20,border:"1px solid var(--br)",background:"linear-gradient(180deg,var(--bg),var(--bg1))",padding:18}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:12,height:12,borderRadius:"50%",background:"var(--gr)",boxShadow:"0 0 0 6px rgba(34,197,94,0.12)"}}/>
                <span style={{fontSize:12,fontWeight:700,color:"var(--tx)"}}>Board readiness</span>
              </div>
              <span style={{fontSize:11,color:"var(--tx3)"}}>Live</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
              {[
                {icon:ICONS.parsing,label:"Parse input",meta:"PDF / URL / notes"},
                {icon:ICONS.planning,label:"Plan work",meta:"Priorities / estimates"},
                {icon:ICONS.analytics,label:"Track health",meta:"Load / focus / pace"},
                {icon:ICONS.export,label:"Export cleanly",meta:"DOCX / PDF"},
              ].map(item=>{
                const Icon=item.icon;
                return (
                  <div key={item.label} style={{padding:12,borderRadius:14,border:"1px solid var(--br)",background:"rgba(255,255,255,0.02)"}}>
                    <div style={{width:34,height:34,borderRadius:11,background:"var(--as)",color:"var(--ac)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:10}}>
                      <Icon size={16}/>
                    </div>
                    <div style={{fontSize:12.5,fontWeight:700,color:"var(--tx)",marginBottom:4}}>{item.label}</div>
                    <div style={{fontSize:10.5,color:"var(--tx3)",lineHeight:1.5}}>{item.meta}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);}

function Footer(){
  return(
    <footer style={{borderTop:"1px solid var(--br)",padding:"48px 0 32px",background:"var(--bg1)"}}>
      <div style={{maxWidth:1140,margin:"0 auto",padding:"0 24px"}}>
        <div className="fg" style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:44,marginBottom:40}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
              <div style={{width:30,height:30,borderRadius:9,background:"linear-gradient(135deg,var(--ac),var(--pu))",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",boxShadow:"0 0 16px var(--ag)"}}><IC.Zap size={13}/></div>
              <span style={{fontSize:15,fontWeight:700,color:"var(--tx)",letterSpacing:"-0.025em"}}>Kanbi</span>
            </div>
            <p style={{fontSize:13,color:"var(--tx2)",lineHeight:1.7,maxWidth:280,marginBottom:20}}>AI task management for freelancers. Paste notes, get a board, plan your day.</p>
            <a href="/sign-up" style={{height:40,padding:"0 16px",borderRadius:10,background:"var(--ac)",color:"#fff",fontSize:13,fontWeight:600,display:"inline-flex",alignItems:"center",gap:8,boxShadow:"0 8px 24px var(--ag)"}}>Start free <IC.Arrow size={14}/></a>
            <div style={{display:"flex",gap:7,flexWrap:"wrap",marginTop:16}}>
              {[{I:<IC.Github size={15}/>,h:"https://github.com/MuhammadTanveerAbbas"},{I:<IC.TW size={15}/>,h:"https://twitter.com/m_tanveerabbas"},{I:<IC.LI size={15}/>,h:"https://linkedin.com/in/MuhammadTanveerAbbas"}].map((s,i)=>(
                <a key={i} href={s.h} target="_blank" rel="noreferrer" style={{width:34,height:34,borderRadius:9,border:"1px solid var(--br)",background:"var(--bg1)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--tx2)",transition:"all .15s"}} onMouseOver={e=>{e.currentTarget.style.borderColor="var(--brh)";e.currentTarget.style.color="var(--tx)"}} onMouseOut={e=>{e.currentTarget.style.borderColor="var(--br)";e.currentTarget.style.color="var(--tx2)"}}>{s.I}</a>
              ))}
            </div>
          </div>
          {[
            {h:"Product",links:[["Features","#features"],["How It Works","#how-it-works"],["Pricing","#pricing"],["Sign Up","/sign-up"]]},
            {h:"Resources",links:[["Privacy","/privacy"],["Terms","/terms"],["Sign In","/sign-in"],["Support","mailto:themvpguy.contact@gmail.com"]]},
            {h:"Connect",links:[["Email","mailto:themvpguy.contact@gmail.com"],["GitHub","https://github.com/MuhammadTanveerAbbas"],["LinkedIn","https://linkedin.com/in/MuhammadTanveerAbbas"],["Twitter","https://twitter.com/m_tanveerabbas"]]},
          ].map(col=>(
            <div key={col.h}>
              <p style={{fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:"var(--tx3)",marginBottom:14}}>{col.h}</p>
              <div style={{display:"flex",flexDirection:"column",gap:11}}>
                {col.links.map(([l,h])=><a key={l} href={h} className="na" style={{fontSize:13,color:"var(--tx2)",transition:"color .15s"}}>{l}</a>)}
              </div>
            </div>
          ))}
        </div>
        <div style={{borderTop:"1px solid var(--br)",paddingTop:20,display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
          <span style={{fontSize:12,color:"var(--tx3)"}}>© 2026 Kanbi. All rights reserved.</span>
          <a href="/pricing" style={{fontSize:12,color:"var(--tx3)",transition:"color .15s"}} onMouseOver={e=>(e.currentTarget.style.color="var(--ac)")} onMouseOut={e=>(e.currentTarget.style.color="var(--tx3)")}>Pricing</a>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage(){
  const [theme,setTheme]=useState<Theme>("dark");
  useEffect(()=>{
    const stored=localStorage.getItem("kanbi-theme") as Theme|null;
    if(stored){setTheme(stored);return;}
    const mq=window.matchMedia("(prefers-color-scheme: dark)");
    setTheme(mq.matches?"dark":"light");
    const fn=(e:MediaQueryListEvent)=>{if(!localStorage.getItem("kanbi-theme"))setTheme(e.matches?"dark":"light");};
    mq.addEventListener("change",fn);return()=>mq.removeEventListener("change",fn);
  },[]);

  const toggle=useCallback(()=>{setTheme(t=>{const n=t==="dark"?"light":"dark";localStorage.setItem("kanbi-theme",n);return n;});},[]);
  return(
    <ThemeCtx.Provider value={{theme,toggle}}>
      <Styles theme={theme}/>
      <div className="lp" style={{minHeight:"100vh",background:"var(--bg)",color:"var(--tx)"}}>
        <Navbar/>
        <main><Hero/><Strip/><Showcase/><Features/><HowItWorks/><ComparisonTable/><Pricing/><FAQ/><CTABanner/></main>
        <Footer/>
      </div>
    </ThemeCtx.Provider>
  );
}
