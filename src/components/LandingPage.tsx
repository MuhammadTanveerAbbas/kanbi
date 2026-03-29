"use client";
// KANBI LANDING PAGE v3
// Updates: (1) Hero mock matches new dashboard (sidebar+health ring+progress bars)
//          (2) NEW tabbed Product Showcase   Dashboard, Board, AI Chat, Autopilot
import { useState, useEffect, useRef, createContext, useContext, useCallback } from "react";
import { createClient } from '@/lib/supabase/client';

type Theme="dark"|"light";
const ThemeCtx=createContext<{theme:Theme;toggle:()=>void}>({theme:"dark",toggle:()=>{}});
const useTheme=()=>useContext(ThemeCtx);

const DV=`--bg:#07070b;--bg1:#0d0d13;--bg2:#111119;--bg3:#16161f;--br:rgba(255,255,255,0.07);--brh:rgba(255,255,255,0.13);--tx:#e0e0ea;--tx2:#787896;--tx3:#3e3e55;--inv:#fff;--inv2:#07070b;--nb:rgba(7,7,11,0.88);`;
const LV=`--bg:#f2f3fb;--bg1:#ffffff;--bg2:#eaebf8;--bg3:#e0e2f5;--br:rgba(0,0,0,0.07);--brh:rgba(0,0,0,0.14);--tx:#0a0a18;--tx2:#4a4a72;--tx3:#9898b8;--inv:#0a0a18;--inv2:#fff;--nb:rgba(242,243,251,0.92);`;

function Styles({theme}:{theme:Theme}){return <style suppressHydrationWarning>{`
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0} html{scroll-behavior:smooth}
  :root{${theme==="dark"?DV:LV}--ac:#5e6fe8;--ach:#6e7ff8;--as:rgba(94,111,232,0.12);--ag:rgba(94,111,232,0.22);--gr:#22c55e;--am:#f59e0b;--rd:#ef4444;--pu:#a78bfa;}
  body{font-family:'Geist',-apple-system,sans-serif;background:var(--bg);color:var(--tx);-webkit-font-smoothing:antialiased;overflow-x:hidden;transition:background .2s,color .2s}
  a{text-decoration:none;color:inherit} button{font-family:inherit;cursor:pointer}
  ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-track{background:var(--bg)} ::-webkit-scrollbar-thumb{background:var(--br);border-radius:3px}
  @keyframes shimmer{from{background-position:-300% center}to{background-position:300% center}}
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.55)}}
  .shimmer{background:linear-gradient(90deg,var(--ac),var(--pu) 40%,var(--ac) 70%,var(--pu));background-size:300% auto;-webkit-background-clip:text;background-clip:text;color:transparent;animation:shimmer 4s linear infinite}
  .pulse{animation:pulse 2.2s ease-in-out infinite}
  .wavy{stroke-dasharray:380;stroke-dashoffset:380;transition:stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1) .2s}
  .wavy.drawn{stroke-dashoffset:0}
  .na:hover{color:var(--tx)!important}
  .fc{transition:background .18s,border-color .18s,transform .18s} .fc:hover{background:var(--bg2)!important;border-color:var(--brh)!important;transform:translateY(-2px)}
  .sh:hover{border-color:var(--ac)!important}
  .sc{transition:border-color .18s,transform .18s} .sc:hover{border-color:var(--ac)!important;transform:translateY(-2px)}
  .fi{transition:border-color .18s}
  .tb{transition:all .15s}
  @media(max-width:1024px){.xlh{display:none!important}}
  @media(max-width:768px){
    .nl{display:none!important} .ms{display:flex!important}
    .hh{font-size:clamp(38px,8vw,58px)!important}
    .g2{grid-template-columns:1fr!important} .g3{grid-template-columns:1fr 1fr!important} .g4{grid-template-columns:1fr 1fr!important}
    .msb{display:none!important}
    .cr{flex-direction:column!important;align-items:stretch!important}
    .cr a,.cr button{justify-content:center!important}
    .fg{grid-template-columns:1fr 1fr!important}
    .tsc{overflow-x:auto;-webkit-overflow-scrolling:touch}
    .hero-badge{padding:5px 10px!important}
    .badge-text{font-size:10px!important;white-space:normal!important;text-align:center!important;line-height:1.3!important}
    .cmp-table{overflow-x:auto!important}
  }
  @media(max-width:480px){.g3,.g4,.fg,.sg{grid-template-columns:1fr!important}
    .cmp-table>div{grid-template-columns:1fr!important}
    .cmp-table>div>div{border-left:none!important;border-bottom:1px solid var(--br)!important}
    .cmp-table>div>div:last-child{border-bottom:none!important}
  }
`}</style>;}

function useInView(ref:React.RefObject<HTMLElement|null>,thr=0.12){
  const [v,setV]=useState(false);
  useEffect(()=>{const el=ref.current;if(!el)return;const o=new IntersectionObserver(([e])=>{if(e.isIntersecting){setV(true);o.disconnect();}},{threshold:thr});o.observe(el);return()=>o.disconnect();},[]);
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

function ST({text,delay=0,style:s}:{text:string;delay?:number;style?:React.CSSProperties}){
  const ref=useRef<HTMLSpanElement>(null);const v=useInView(ref as React.RefObject<HTMLElement>,0.1);
  return <span ref={ref} style={{display:"inline",...s}}>{text.split("").map((ch,i)=><span key={i} style={{display:"inline-block",opacity:v?1:0,transform:v?"translateY(0) scale(1)":"translateY(13px) scale(.93)",transition:`opacity .26s ease ${delay+i*.018}s,transform .36s cubic-bezier(.22,1,.36,1) ${delay+i*.018}s`,whiteSpace:ch===" "?"pre":undefined}}>{ch===" "?"\u00a0":ch}</span>)}</span>;
}

function Wavy(){
  const ref=useRef<HTMLSpanElement>(null);const v=useInView(ref as React.RefObject<HTMLElement>,0.1);
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

function Hero(){
  const ref=useRef<HTMLDivElement>(null);
  const v=useInView(ref as React.RefObject<HTMLElement>);
  const handleGetStarted=()=>{
    window.location.href='/sign-up';
  };
  return(
    <section style={{padding:"148px 0 80px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,pointerEvents:"none",backgroundImage:"linear-gradient(var(--br) 1px,transparent 1px),linear-gradient(90deg,var(--br) 1px,transparent 1px)",backgroundSize:"72px 72px"}}/>
      <div style={{position:"absolute",top:-60,left:"50%",transform:"translateX(-50%)",width:800,height:520,background:"radial-gradient(ellipse,var(--ag) 0%,transparent 68%)",pointerEvents:"none"}}/>
      <div style={{maxWidth:1140,margin:"0 auto",padding:"0 24px",textAlign:"center",position:"relative"}}>
        <div className="hero-badge" style={{display:"inline-flex",alignItems:"center",gap:8,padding:"5px 14px 5px 10px",borderRadius:100,border:"1px solid var(--ag)",background:"var(--as)",marginBottom:28}}>
          <div style={{width:20,height:20,borderRadius:6,background:"var(--as)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--ac)",flexShrink:0}}><IC.Spark size={13}/></div>
          <span className="badge-text" style={{fontSize:"clamp(10px,2vw,12px)",color:"var(--ac)",fontWeight:500,whiteSpace:"nowrap"}}>Groq AI · AI Chat · Autopilot · Burnout Prevention</span>
        </div>
        <h1 className="hh" style={{fontSize:"clamp(44px,7.5vw,86px)",fontWeight:800,letterSpacing:"-0.048em",lineHeight:1.04,color:"var(--tx)",marginBottom:24}}>
          <ST text="Turn hours of task" delay={0}/>{" "}
          <span style={{position:"relative",display:"inline-block"}}><Wavy/><ST text="planning" delay={0.34} style={{color:"var(--ac)",fontWeight:800} as React.CSSProperties}/></span>
          <br/>{"into "}<span style={{color:"var(--ac)",fontWeight:800}}><ST text="10 seconds" delay={0.56}/></span>
        </h1>
        <p style={{fontSize:17,color:"var(--tx2)",maxWidth:540,margin:"0 auto 40px",lineHeight:1.7}}>Paste notes, emails, or PDFs. Kanbi's Groq AI extracts every task, prioritizes intelligently, prevents burnout   and syncs with your calendar. <strong style={{color:"var(--tx)",fontWeight:500}}>2+ hours saved every day.</strong></p>
        <div className="cr" style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
          <button onClick={handleGetStarted} style={{height:48,padding:"0 26px",borderRadius:10,background:"var(--ac)",color:"#fff",fontSize:14,fontWeight:600,display:"inline-flex",alignItems:"center",gap:9,boxShadow:"0 0 0 1px var(--ag),0 10px 38px var(--ag)",transition:"background .15s",border:"none"}} onMouseOver={e=>(e.currentTarget.style.background="var(--ach)")} onMouseOut={e=>(e.currentTarget.style.background="var(--ac)")}>Start for Free <IC.Arrow size={15}/></button>
          <a href="#showcase" style={{height:48,padding:"0 22px",borderRadius:10,border:"1px solid var(--br)",fontSize:14,color:"var(--tx2)",display:"inline-flex",alignItems:"center",gap:6,transition:"all .15s"}} onMouseOver={e=>{e.currentTarget.style.borderColor="var(--brh)";e.currentTarget.style.color="var(--tx)"}} onMouseOut={e=>{e.currentTarget.style.borderColor="var(--br)";e.currentTarget.style.color="var(--tx2)"}}>See product <IC.ChevD size={14}/></a>
        </div>
        <p style={{marginTop:14,fontSize:12,color:"var(--tx3)"}}>No credit card · Free plan forever · Cancel Pro anytime</p>
        {/* ── UPDATED HERO MOCK: sidebar + health ring + kanban ── */}
        <div ref={ref} style={{marginTop:60,borderRadius:16,border:"1px solid var(--br)",background:"var(--bg1)",overflow:"hidden",boxShadow:"0 0 0 1px rgba(255,255,255,0.03),0 64px 120px rgba(0,0,0,0.7)"}}>
          <div style={{display:"flex"}}>
            <div className="msb" style={{width:186,borderRight:"1px solid var(--br)",background:"var(--bg)",padding:"13px 0",flexShrink:0}}>
              <div style={{padding:"0 12px 12px",borderBottom:"1px solid var(--br)",marginBottom:6}}>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <div style={{width:22,height:22,borderRadius:6,background:"var(--ac)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff"}}><IC.Zap size={11}/></div>
                  <span style={{fontSize:13,fontWeight:700,color:"var(--tx)"}}>Kanbi</span>
                  <span style={{fontSize:8,fontWeight:700,padding:"1px 5px",borderRadius:3,background:"var(--as)",color:"var(--ac)",letterSpacing:"0.04em"}}>FREE</span>
                </div>
              </div>
              {[["Overview",true],["Board",false],["AI Chat",false],["Autopilot",false],["Saved",false]].map(([l,a])=>(
                <div key={String(l)} style={{padding:"6px 12px",margin:"1px 7px",borderRadius:6,background:a?"var(--as)":"transparent",fontSize:11,color:a?"var(--ac)":"var(--tx3)",fontWeight:a?600:400,borderLeft:a?"2px solid var(--ac)":"2px solid transparent"}}>{l}</div>
              ))}
              <div style={{margin:"12px 12px 0",padding:"10px",borderRadius:8,background:"var(--bg1)",border:"1px solid var(--br)"}}>
                <p style={{fontSize:8,color:"var(--tx3)",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:6}}>Health Score</p>
                <div style={{position:"relative",width:52,height:52,margin:"0 auto"}}>
                  <svg width="52" height="52" viewBox="0 0 52 52" style={{transform:"rotate(-90deg)"}}>
                    <circle cx="26" cy="26" r="20" fill="none" stroke="var(--br)" strokeWidth="5"/>
                    <circle cx="26" cy="26" r="20" fill="none" stroke="var(--gr)" strokeWidth="5" strokeLinecap="round"
                      strokeDasharray={2*Math.PI*20} strokeDashoffset={v?2*Math.PI*20*(1-.78):2*Math.PI*20}
                      style={{transition:"stroke-dashoffset 1.2s ease .3s",filter:"drop-shadow(0 0 5px var(--gr))"}}/>
                  </svg>
                  <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <span style={{fontSize:12,fontWeight:700,color:"var(--tx)"}}>78</span>
                  </div>
                </div>
                <p style={{fontSize:8,color:"var(--gr)",textAlign:"center",marginTop:4,fontWeight:600}}>● Healthy</p>
              </div>
            </div>
            <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column"}}>
              <div style={{height:44,borderBottom:"1px solid var(--br)",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 14px",flexShrink:0,gap:8}}>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <span style={{fontSize:12,fontWeight:600,color:"var(--tx)"}}>My Board</span>
                  <span style={{fontSize:9,padding:"1px 6px",borderRadius:3,background:"var(--br)",color:"var(--tx3)"}}>7 tasks</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <div style={{display:"flex",alignItems:"center",gap:5,padding:"3px 9px",borderRadius:6,background:"var(--as)",border:"1px solid var(--ag)"}}>
                    <div className="pulse" style={{width:4,height:4,borderRadius:"50%",background:"var(--ac)"}}/>
                    <span style={{fontSize:9.5,color:"var(--ac)",fontWeight:500}}>AI extracted 7 tasks</span>
                  </div>
                  <div style={{padding:"3px 8px",borderRadius:5,border:"1px solid rgba(66,133,244,0.3)",background:"rgba(66,133,244,0.08)",fontSize:9,color:"#4285f4",fontWeight:600}}>📅 Set Reminders</div>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,padding:12}}>
                {[
                  {col:"To Do",color:"var(--ac)",tasks:[{t:"Review Acme proposal",p:"high"},{t:"Update portfolio copy",p:"medium"}]},
                  {col:"In Progress",color:"var(--am)",tasks:[{t:"Dashboard API integration",p:"high",prog:68},{t:"Fintech case study",p:"medium",prog:42}]},
                  {col:"Done",color:"var(--gr)",tasks:[{t:"Setup CI/CD pipeline",p:"high"},{t:"Onboarding call   Acme",p:"medium"}]},
                ].map(col=>(
                  <div key={col.col}>
                    <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:8}}>
                      <div style={{width:6,height:6,borderRadius:"50%",background:col.color}}/>
                      <span style={{fontSize:9,fontWeight:700,letterSpacing:"0.07em",textTransform:"uppercase",color:"var(--tx3)"}}>{col.col}</span>
                    </div>
                    {col.tasks.map((t,i)=>(
                      <div key={i} style={{borderRadius:7,border:"1px solid var(--br)",background:"var(--bg2)",padding:"8px 10px",marginBottom:6}}>
                        <div style={{display:"flex",justifyContent:"space-between",gap:6,marginBottom:"prog" in t&&t.prog!==undefined?6:0}}>
                          <p style={{fontSize:10.5,color:col.col==="Done"?"var(--tx3)":"var(--tx)",fontWeight:500,lineHeight:1.4,flex:1,textDecoration:col.col==="Done"?"line-through":"none"}}>{t.t}</p>
                          <div style={{width:6,height:6,borderRadius:"50%",background:t.p==="high"?"var(--rd)":"var(--am)",flexShrink:0,marginTop:2}}/>
                        </div>
                        {"prog" in t&&t.prog!==undefined&&(
                          <div style={{height:3,borderRadius:2,background:"var(--br)",overflow:"hidden"}}>
                            <div style={{height:"100%",width:v?`${t.prog}%`:"0%",transition:"width .8s ease .6s",borderRadius:2,background:"linear-gradient(90deg,var(--ac),var(--pu))"}}/>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
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
  {key:"overview",label:"Dashboard",desc:"Complete workload overview   health score, goals, activity charts, priority breakdown, and recent boards all on one screen.",features:["AI Workload Health Score (live)","Goal tracking with progress bars","30-day activity bar chart","Priority distribution donut"]},
  {key:"board",label:"Kanban Board",desc:"Paste notes, emails, or PDFs. AI extracts every task in under 2 seconds and builds your board with priorities, labels, and estimates.",features:["3 input modes (Paste/PDF/Templates)","AI extracts tasks instantly","Drag-and-drop Kanban columns","Save boards for later"]},
  {key:"chat",label:"AI Chat",desc:"An AI coach with full context from your board. Create tasks, move cards, get prioritization advice   it acts directly on your board.",features:["Live mini-board in chat sidebar","Create tasks via conversation","Move tasks between columns","Full conversation history"]},
  {key:"autopilot",label:"Autopilot",desc:"AI reads your board and generates morning briefings, time-blocked schedules, and burnout alerts   all synced with your real tasks.",features:["Morning briefing from live board","AI daily schedule (time blocks)","Burnout alert panel + history","Add AI schedule to board in 1 click"]},
];

function MockPreview({tab}:{tab:typeof TABS[0]}){
  const cols:Record<string,string>={overview:"var(--ac)",board:"var(--am)",chat:"var(--pu)",autopilot:"var(--gr)"};
  const col=cols[tab.key];
  return(
    <div style={{borderRadius:14,border:"1px solid var(--br)",background:"var(--bg1)",overflow:"hidden",height:360,display:"flex",flexDirection:"column"}}>
      <div style={{display:"flex",alignItems:"center",gap:6,padding:"10px 14px",borderBottom:"1px solid var(--br)"}}>
        {["#ff5f57","#febc2e","#28c840"].map(c=><div key={c} style={{width:10,height:10,borderRadius:"50%",background:c}}/>)}
        <span style={{fontSize:11,color:"var(--tx3)",marginLeft:6}}>kanbi.app/{tab.key}</span>
      </div>
      <div style={{flex:1,padding:14,display:"flex",flexDirection:"column",gap:10,overflow:"hidden"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:col}}/>
          <span style={{fontSize:12,fontWeight:600,color:"var(--tx)"}}>{tab.label}</span>
          <div className="pulse" style={{width:5,height:5,borderRadius:"50%",background:"var(--gr)",marginLeft:"auto"}}/>
        </div>
        {tab.key==="overview"&&(<>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7}}>
            {[["0/10","Boards"],["51/300","AI Uses"],["47","Tasks"]].map(([v,l])=>(
              <div key={l} style={{borderRadius:8,border:"1px solid var(--br)",background:"var(--bg2)",padding:"9px 10px"}}>
                <p style={{fontSize:14,fontWeight:700,color:"var(--tx)",letterSpacing:"-0.03em"}}>{v}</p>
                <p style={{fontSize:9,color:"var(--tx3)"}}>{l}</p>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,flex:1}}>
            <div style={{borderRadius:9,border:"1px solid var(--br)",background:"var(--bg2)",padding:10,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
              <svg width="52" height="52" viewBox="0 0 52 52" style={{transform:"rotate(-90deg)"}}>
                <circle cx="26" cy="26" r="20" fill="none" stroke="var(--br)" strokeWidth="6"/>
                <circle cx="26" cy="26" r="20" fill="none" stroke="var(--gr)" strokeWidth="6" strokeLinecap="round" strokeDasharray={2*Math.PI*20} strokeDashoffset={2*Math.PI*20*0.22}/>
              </svg>
              <p style={{fontSize:9,color:"var(--tx3)",marginTop:3}}>Health 78</p>
            </div>
            <div style={{borderRadius:9,border:"1px solid var(--br)",background:"var(--bg2)",padding:10}}>
              {[["Daily","0/5","var(--ac)","0%"],["Weekly","51/30","var(--gr)","100%"],["Rate","20%","var(--pu)","20%"]].map(([l,v,c,w])=>(
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
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,flex:1}}>
            {[{c:"To Do",ts:["Review proposal","Update copy"]},{c:"In Progress",ts:["API work","Case study"]},{c:"Done",ts:["CI/CD setup"]}].map(col=>(
              <div key={col.c}>
                <div style={{fontSize:8,fontWeight:700,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6}}>{col.c}</div>
                {col.ts.map(t=>(
                  <div key={t} style={{borderRadius:5,border:"1px solid var(--br)",background:"var(--bg2)",padding:"5px 7px",marginBottom:5}}>
                    <p style={{fontSize:9.5,color:"var(--tx)",lineHeight:1.35}}>{t}</p>
                    <div style={{display:"flex",gap:4,marginTop:4,alignItems:"center"}}>
                      <div style={{width:4,height:4,borderRadius:"50%",background:"var(--rd)"}}/>
                      <span style={{fontSize:8,color:"var(--tx3)"}}>📅 Mar 22</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{padding:"6px 9px",borderRadius:7,background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.2)",display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontSize:9.5,color:"var(--gr)",fontWeight:600}}>✓ Board saved · Export as PDF or DOCX</span>
          </div>
        </>)}
        {tab.key==="chat"&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",gap:8}}>
            {[{r:"ai",m:"I see 5 pending tasks. Focus on the Acme proposal first (high priority). Want a daily plan?"},{r:"user",m:"Yes, create task: Follow up with Acme"},{r:"ai",m:"✓ Created 'Follow up with Acme' (medium priority) on your board."}].map((msg,i)=>(
              <div key={i} style={{display:"flex",justifyContent:msg.r==="user"?"flex-end":"flex-start"}}>
                <div style={{maxWidth:"82%",padding:"7px 10px",borderRadius:msg.r==="user"?"9px 2px 9px 9px":"2px 9px 9px 9px",background:msg.r==="user"?"var(--ac)":"var(--bg2)",border:`1px solid ${msg.r==="user"?"var(--ac)":"var(--br)"}`}}>
                  <p style={{fontSize:9.5,color:msg.r==="user"?"#fff":"var(--tx)",lineHeight:1.4}}>{msg.m}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab.key==="autopilot"&&(<>
          <div style={{padding:"9px 11px",borderRadius:8,background:"var(--as)",border:"1px solid var(--ag)"}}>
            <p style={{fontSize:9,color:"var(--ac)",fontWeight:600,marginBottom:4}}>Today's Briefing · Mar 20</p>
            <p style={{fontSize:9.5,color:"var(--tx2)",lineHeight:1.5}}>5 pending tasks. 2 urgent. Health 78/100. Start with Acme proposal. Estimated day: 7.5h.</p>
          </div>
          <div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}>
            {[["8:00 AM","Review Acme proposal","30m"],["8:30 AM","Fix login bug","2h"],["10:30 AM","API integration","4h"]].map((s,i)=>(
              <div key={i} style={{display:"flex",gap:8,padding:"6px 8px",borderRadius:6,background:"var(--bg2)",border:"1px solid var(--br)",alignItems:"center"}}>
                <span style={{fontSize:9,fontWeight:700,color:"var(--ac)",fontFamily:"monospace",flexShrink:0}}>{s[0]}</span>
                <span style={{fontSize:9.5,color:"var(--tx)",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s[1]}</span>
                <span style={{fontSize:9,color:"var(--tx3)",flexShrink:0}}>{s[2]}</span>
              </div>
            ))}
            <button style={{marginTop:2,padding:"6px",borderRadius:7,border:"1px solid var(--ac)",background:"var(--as)",color:"var(--ac)",fontSize:9.5,fontWeight:600}}>→ Add Schedule to Board</button>
          </div>
        </>)}
      </div>
    </div>
  );
}

function Showcase(){
  const [active,setActive]=useState(0);const tab=TABS[active];
  const handleTabClick=(i:number,key:string)=>{setActive(i);};
  return(
    <section id="showcase" style={{padding:"96px 0",borderTop:"1px solid var(--br)"}}>
      <div style={{maxWidth:1140,margin:"0 auto",padding:"0 24px"}}>
        <div style={{textAlign:"center",marginBottom:48}}>
          <p style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--ac)",marginBottom:14}}>Product</p>
          <h2 style={{fontSize:"clamp(26px,4vw,44px)",fontWeight:700,letterSpacing:"-0.035em",color:"var(--tx)",marginBottom:14}}><ST text="See exactly how it works"/></h2>
          <p style={{fontSize:15,color:"var(--tx2)",maxWidth:440,margin:"0 auto"}}>Every page, every feature   designed to save you time.</p>
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
              Try {tab.label} Free <IC.Arrow size={13}/>
            </a>
          </div>
          <MockPreview tab={tab}/>
        </div>
      </div>
    </section>
  );
}

// ── FEATURES ────
const FEATS=[
  {I:IC.Spark,t:"AI task extraction in under 2 seconds",d:"Paste any notes, email, or PDF. Groq AI reads it and extracts every action item, assigns priorities, and detects deadlines instantly."},
  {I:IC.Shield,t:"Real-time workload health scoring",d:"AI calculates a live health score from your task load. When you're overcommitted it flags burnout risk and suggests which tasks to defer."},
  {I:IC.Brain,t:"AI Chat with full board context",d:"Ask your AI coach anything about your tasks. It reads your live board, helps you prioritize, and can create or move tasks directly via conversation."},
  {I:IC.Chart,t:"Completion tracking and task insights",d:"Track your task completion history over time. See priority breakdowns, spot bottlenecks, and understand where your time actually goes."},
  {I:IC.Export,t:"DOCX & PDF export",d:"Export any saved board as a professionally formatted Word doc or PDF. Perfect for client handoffs."},
  {I:IC.Board,t:"Works with text, PDFs, emails, and URLs",d:"Paste text, upload a PDF, or drop a URL. Kanbi reads them all and extracts tasks in one step. No copy-pasting between tools."},
  {I:IC.Cal,t:"Autopilot: AI-generated daily schedule",d:"Autopilot reads your board and generates a time-blocked daily schedule with a morning briefing, blocker detection, and overflow rescheduling."},
  {I:IC.Zap,t:"Google Calendar sync",d:"Push tasks with due dates to Google Calendar in one click. Reminders are set automatically so nothing slips through."},
  {I:IC.Board,t:"Save, search, and favorite your boards",d:"Every board you generate can be saved to your library. Search by title or content, mark favorites, and reload any past board instantly."},
];

function Features(){return(
  <section id="features" style={{padding:"96px 0",borderTop:"1px solid var(--br)"}}>
    <div style={{maxWidth:1140,margin:"0 auto",padding:"0 24px"}}>
      <div style={{textAlign:"center",marginBottom:52}}>
        <p style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--ac)",marginBottom:14}}>Features</p>
        <h2 style={{fontSize:"clamp(26px,4vw,44px)",fontWeight:700,letterSpacing:"-0.035em",color:"var(--tx)",marginBottom:14}}><ST text="Every tool a freelancer needs"/></h2>
        <p style={{fontSize:15,color:"var(--tx2)",maxWidth:440,margin:"0 auto"}}>Built from scratch for independent professionals.</p>
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
    {n:"01",t:"Paste raw input",d:"Notes, email threads, or PDFs   any format works, zero prep required.",tag:"Email · PDF · Text",I:IC.Export},
    {n:"02",t:"AI reads & extracts",d:"Groq AI identifies every action item, assigns priorities, time estimates, and detects dependencies.",tag:"< 2 seconds via Groq",I:IC.Spark},
    {n:"03",t:"Board ready",d:"Tasks on your Kanban board. Autopilot generates your daily briefing. Export as PDF or DOCX.",tag:"Instant · Smart · Exportable",I:IC.Zap},
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
  const features=[
    {f:"Task extraction speed",notion:"Manual entry",asana:"Manual entry",kanbi:"Groq AI in under 2 seconds"},
    {f:"Burnout detection",notion:"None",asana:"None",kanbi:"Real-time health score"},
    {f:"Calendar integration",notion:"Manual / limited",asana:"Google & Outlook sync",kanbi:"One-click Google Calendar sync"},
    {f:"AI coaching",notion:"AI writing assist only",asana:"None",kanbi:"Chat assistant with board context"},
    {f:"Historical task data",notion:"Manual tracking",asana:"Reporting (paid)",kanbi:"Completion history used for estimates"},
    {f:"Daily briefings",notion:"None",asana:"None",kanbi:"AI-generated from live board"},
    {f:"Email & PDF parsing",notion:"None",asana:"None",kanbi:"Instant AI extraction"},
    {f:"Workload balancing",notion:"None",asana:"Workload view (paid)",kanbi:"AI health score + relief suggestions"},
    {f:"Board export",notion:"PDF export",asana:"PDF / CSV (paid)",kanbi:"DOCX or PDF in one click"},
    {f:"Saved board library",notion:"Pages / databases",asana:"Projects",kanbi:"Search, favorite, and reload boards"},
  ];
  return(
    <section style={{padding:"96px 0",borderTop:"1px solid var(--br)"}}>
      <div style={{maxWidth:1140,margin:"0 auto",padding:"0 24px"}}>
        <div style={{textAlign:"center",marginBottom:48}}>
          <p style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--ac)",marginBottom:14}}>Why Kanbi</p>
          <h2 style={{fontSize:"clamp(26px,4vw,44px)",fontWeight:700,letterSpacing:"-0.035em",color:"var(--tx)",marginBottom:14}}><ST text="Traditional tools vs Kanbi"/></h2>
          <p style={{fontSize:15,color:"var(--tx2)",maxWidth:480,margin:"0 auto"}}>See the difference AI-powered task management makes.</p>
        </div>
        <div className="cmp-table" style={{borderRadius:14,border:"1px solid var(--br)",background:"var(--bg1)",overflow:"hidden"}}>
          <div style={{display:"grid",gridTemplateColumns:"2fr 1.5fr 1.5fr 1.5fr",borderBottom:"1px solid var(--br)",background:"var(--bg2)"}}>
            <div style={{padding:"14px 20px",fontSize:12,fontWeight:700,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:"0.06em"}}>Feature</div>
            <div style={{padding:"14px 20px",fontSize:12,fontWeight:700,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:"0.06em",borderLeft:"1px solid var(--br)"}}>Notion</div>
            <div style={{padding:"14px 20px",fontSize:12,fontWeight:700,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:"0.06em",borderLeft:"1px solid var(--br)"}}>Asana</div>
            <div style={{padding:"14px 20px",fontSize:12,fontWeight:700,color:"var(--ac)",textTransform:"uppercase",letterSpacing:"0.06em",borderLeft:"1px solid var(--br)",display:"flex",alignItems:"center",gap:6}}><IC.Zap size={13}/>Kanbi</div>
          </div>
          {features.map((row,i)=>(
            <div key={row.f} style={{display:"grid",gridTemplateColumns:"2fr 1.5fr 1.5fr 1.5fr",borderBottom:i<features.length-1?"1px solid var(--br)":"none"}}>
              <div style={{padding:"16px 20px",fontSize:13.5,color:"var(--tx)",fontWeight:500}}>{row.f}</div>
              <div style={{padding:"16px 20px",fontSize:13,color:"var(--tx3)",borderLeft:"1px solid var(--br)"}}>{row.notion}</div>
              <div style={{padding:"16px 20px",fontSize:13,color:"var(--tx3)",borderLeft:"1px solid var(--br)"}}>{row.asana}</div>
              <div style={{padding:"16px 20px",fontSize:13,color:"var(--tx)",fontWeight:500,borderLeft:"1px solid var(--br)",background:"var(--as)"}}>{row.kanbi}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:36,borderRadius:14,border:"1px solid var(--br)",background:"var(--bg1)",padding:"26px 30px",display:"flex",alignItems:"flex-start",gap:20,flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:14,flexWrap:"wrap"}}>
            <div style={{width:48,height:48,borderRadius:12,background:"linear-gradient(135deg,var(--ac),var(--pu))",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 0 18px var(--ag)"}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
              </svg>
            </div>
            <div style={{flex:1,minWidth:200}}>
              <p style={{fontSize:"clamp(13px,2vw,15px)",color:"var(--tx2)",lineHeight:1.65,marginBottom:12,fontStyle:"italic"}}>"I built Kanbi because I was spending 2+ hours every morning just organizing my tasks kanbi going through emails, copy-pasting into Notion, manually setting priorities. It was exhausting before the real work even started. Now I paste my emails and Groq AI extracts every task, sets the priorities, and builds the board in seconds. That's the whole point of Kanbi."</p>
              <p style={{fontSize:13,fontWeight:600,color:"var(--tx)"}}>Muhammad Tanveer Abbas</p>
              <p style={{fontSize:12,color:"var(--tx3)"}}>Founder · Kanbi · Full-Stack Engineer · Faisalabad, Pakistan</p>
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
  const proF=["50 AI task extractions per day","Unlimited board uses","PDF import & URL extraction","AI Chat Coach (board-aware)","Burnout prevention & health scoring","DOCX & PDF export","Autopilot scheduling & briefings","Google Calendar sync","Priority email support (24h)"];
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
              <p style={{textAlign:"center",fontSize:11,color:"var(--tx3)",marginTop:10}}>Stripe billing · Cancel anytime</p>
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
    {q:"How accurate is the AI task extraction?",a:"Kanbi uses Groq's llama-3.3-70b model, achieving 95%+ accuracy on structured notes and emails. The AI is specifically prompted for productivity workflows kanbi it understands phrases like 'follow up with', 'deadline is', and 'action item'. You can always edit extracted tasks before saving."},
    {q:"Is my data private and secure?",a:"Yes. All your boards and tasks are stored with row-level security (RLS) in Supabase kanbi meaning only you can access your data. We never sell or share your data. You can delete everything from Settings at any time."},
    {q:"How does email and task parsing work?",a:"Paste any email, meeting notes, or PDF text into Kanbi. The AI reads the full content, identifies every action item, assigns priorities, estimates time, and detects deadlines kanbi even ones buried in casual language. It works with any format, no templates required."},
    {q:"Does Kanbi integrate with other tools?",a:"Yes. Kanbi syncs with Google Calendar (push your AI schedule in one click), exports boards as DOCX or PDF for client handoffs, and supports URL import to extract tasks from web pages. More integrations are on the roadmap."},
    {q:"Is there a free plan? What are the limits?",a:"The free plan is free forever kanbi no credit card required. You get 10 AI task extractions per day and 300 board uses per month, which is enough for real daily use. Pro ($9/month) unlocks 50 extractions/day, unlimited board uses, PDF import, AI Chat, and more."},
    {q:"How is Kanbi different from Asana or Monday.com?",a:"Asana and Monday are great for teams but require you to manually create every task. Kanbi is built for individual freelancers and uses AI to do the heavy lifting kanbi paste your notes and your board is ready in seconds. It also includes burnout prevention and an AI coach, which traditional tools don't offer."},
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
      <div style={{borderRadius:20,border:"1px solid var(--ag)",background:"linear-gradient(160deg,var(--as) 0%,transparent 100%)",padding:"72px 40px",textAlign:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:560,height:200,background:"radial-gradient(ellipse at top,var(--ag) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{position:"relative"}}>
          <h2 style={{fontSize:"clamp(28px,5vw,56px)",fontWeight:700,letterSpacing:"-0.038em",color:"var(--tx)",marginBottom:16}}><ST text="Ready to save 2 hours daily?"/></h2>
          <p style={{fontSize:15,color:"var(--tx2)",maxWidth:460,margin:"0 auto 34px",lineHeight:1.65}}>Start free. Upgrade to Pro for AI superpowers. Cancel anytime.</p>
          <div className="cr" style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
            <button onClick={handleGetStarted} style={{height:48,padding:"0 28px",borderRadius:10,background:"var(--inv)",color:"var(--inv2)",fontSize:14,fontWeight:700,display:"inline-flex",alignItems:"center",gap:9,transition:"opacity .15s",border:"none"}} onMouseOver={e=>(e.currentTarget.style.opacity=".88")} onMouseOut={e=>(e.currentTarget.style.opacity="1")}>Start Free   No Card Needed <IC.Arrow size={15}/></button>
            <a href="#faq" style={{height:48,padding:"0 22px",borderRadius:10,border:"1px solid var(--brh)",fontSize:14,color:"var(--tx2)",display:"inline-flex",alignItems:"center",transition:"all .15s"}} onMouseOver={e=>{e.currentTarget.style.borderColor="var(--ag)";e.currentTarget.style.color="var(--tx)"}} onMouseOut={e=>{e.currentTarget.style.borderColor="var(--brh)";e.currentTarget.style.color="var(--tx2)"}}>See FAQ →</a>
          </div>
        </div>
      </div>
    </div>
  </section>
);}

function Footer(){
  const {theme,toggle}=useTheme();
  return(
    <footer style={{borderTop:"1px solid var(--br)",padding:"52px 0 28px"}}>
      <div style={{maxWidth:1140,margin:"0 auto",padding:"0 24px"}}>
        <div className="fg" style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:44,marginBottom:44}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
              <div style={{width:28,height:28,borderRadius:8,background:"var(--ac)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",boxShadow:"0 0 16px var(--ag)"}}><IC.Zap size={13}/></div>
              <span style={{fontSize:15,fontWeight:700,color:"var(--tx)",letterSpacing:"-0.025em"}}>Kanbi</span>
            </div>
            <p style={{fontSize:13,color:"var(--tx2)",lineHeight:1.7,maxWidth:260,marginBottom:16}}>AI task management that saves freelancers 2+ hours every day. Powered by Groq, Supabase, and Stripe.</p>
            <div style={{display:"flex",gap:7}}>
              {[{I:<IC.Github size={15}/>,h:"https://github.com/MuhammadTanveerAbbas"},{I:<IC.TW size={15}/>,h:"https://twitter.com/m_tanveerabbas"},{I:<IC.LI size={15}/>,h:"https://linkedin.com/in/MuhammadTanveerAbbas"}].map((s,i)=>(
                <a key={i} href={s.h} target="_blank" rel="noreferrer" style={{width:30,height:30,borderRadius:7,border:"1px solid var(--br)",background:"var(--bg1)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--tx2)",transition:"all .15s"}} onMouseOver={e=>{e.currentTarget.style.borderColor="var(--brh)";e.currentTarget.style.color="var(--tx)"}} onMouseOut={e=>{e.currentTarget.style.borderColor="var(--br)";e.currentTarget.style.color="var(--tx2)"}}>{s.I}</a>
              ))}
              <button onClick={toggle} style={{width:30,height:30,borderRadius:7,border:"1px solid var(--br)",background:"var(--bg1)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--tx2)",cursor:"pointer",transition:"all .15s"}} onMouseOver={e=>{e.currentTarget.style.borderColor="var(--brh)";e.currentTarget.style.color="var(--tx)"}} onMouseOut={e=>{e.currentTarget.style.borderColor="var(--br)";e.currentTarget.style.color="var(--tx2)"}}>
                {theme==="dark"?<IC.Sun size={13}/>:<IC.Moon size={13}/>}
              </button>
            </div>
          </div>
          {[
            {h:"Product",links:[["Features","#features"],["How It Works","#how-it-works"],["Dashboard","/dashboard"],["Sign Up","/sign-up"]]},
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
          <span style={{fontSize:12,color:"var(--tx3)"}}>Built to save you 2 hours every day</span>
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
      <div style={{minHeight:"100vh",background:"var(--bg)",color:"var(--tx)"}}>
        <Navbar/>
        <main><Hero/><Strip/><Showcase/><Features/><HowItWorks/><ComparisonTable/><FAQ/><CTABanner/></main>
        <Footer/>
      </div>
    </ThemeCtx.Provider>
  );
}
