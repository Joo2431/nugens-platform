/**
 * BusinessChat — Dedicated AI workspace for Business users
 * Completely separate from GenEChat (individual UI)
 * Dark theme, workforce branding, 6 business tools only
 */
import ReactMarkdown from "react-markdown";
import remarkGfm    from "remark-gfm";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { NG_LOGO }  from "../lib/logo";
import { buildContextString } from "./MyCareerProfile";

const API  = import.meta.env.VITE_GEN_E_API_URL || "https://nugens-platform.onrender.com";
const PINK = "#e8185d";
const PURP = "#7c3aed";
const BG   = "#09090b";
const CARD = "#111113";
const BORD = "#1e1e22";
const MUTE = "#555";
const TEXT = "#e8e8e8";

const PAID_PLANS = new Set([
  "monthly","yearly","admin",
  "hx_biz_starter","hx_biz_premium","hx_biz_pro","hx_biz_yearly",
  "hx_ind_starter","hx_ind_premium","hx_ind_pro","hx_ind_yearly",
]);

// ── Business tools ────────────────────────────────────────────
const BIZ_TOOLS = [
  { key:"jd",        icon:"▤", color:"#7c3aed", label:"JD Generator",    short:"JD",       body:"Generate a comprehensive job description. Ask me: role title, company type, and experience level required." },
  { key:"hiring",    icon:"◎", color:PINK,      label:"Hiring AI",       short:"Hiring",   body:"Give me full hiring intelligence for a role I need to fill. Ask me the role title, industry, and company stage." },
  { key:"team",      icon:"◈", color:"#0284c7", label:"Team Skill Map",  short:"Skills",   body:"Map my team's skills and find the gaps. Ask me about my team members, their roles, and our company goals." },
  { key:"workforce", icon:"⬡", color:"#d97706", label:"Workforce Plan",  short:"Workforce",body:"Create a workforce planning roadmap. Ask me: company stage, current team, and 12-month growth goals." },
  { key:"salary",    icon:"₹", color:"#16a34a", label:"Salary Benchmark",short:"Salary",   body:"Provide salary benchmarks for Indian market. Ask me: role, experience level, city, and industry." },
  { key:"interview", icon:"◷", color:"#0284c7", label:"Interview AI",    short:"Interview",body:"Generate a role-specific interview kit with questions and scoring rubric. Ask me: role, experience level, and company type." },
];

const TOOL_MAP = Object.fromEntries(BIZ_TOOLS.map(t => [t.key, t]));

const APPS = [
  { label:"Gen-E",    url:"https://gene.nugens.in.net",    icon:"◎", color:"#7c3aed", active:true  },
  { label:"HyperX",  url:"https://hyperx.nugens.in.net",  icon:"⬡", color:PINK,      active:false },
  { label:"DigiHub", url:"https://digihub.nugens.in.net", icon:"◈", color:"#0284c7", active:false },
  { label:"The Units",url:"https://units.nugens.in.net",  icon:"◇", color:"#d97706", active:false },
];

const uid       = () => `b-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
const freshChat = (tool) => ({ id:uid(), title:"New Chat", tool:tool||"jd", messages:[], history:[] });

let _warmed = false, _wakeP = null;
async function wakeServer() {
  if (_warmed) return;
  if (_wakeP) return _wakeP;
  _wakeP = (async () => {
    const end = Date.now() + 90000;
    while (Date.now() < end) {
      try { const r = await fetch(`${API}/health`,{signal:AbortSignal.timeout(8000)}); if(r.ok){_warmed=true;_wakeP=null;return;} } catch {}
      await new Promise(r=>setTimeout(r,4000));
    }
    _wakeP = null;
  })();
  return _wakeP;
}
wakeServer().catch(()=>{});

// ── Markdown renderer ─────────────────────────────────────────
function MsgBody({ text }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
      p:    ({children})=><p style={{margin:"0 0 8px",lineHeight:1.75}}>{children}</p>,
      ul:   ({children})=><ul style={{paddingLeft:20,margin:"0 0 8px"}}>{children}</ul>,
      ol:   ({children})=><ol style={{paddingLeft:20,margin:"0 0 8px"}}>{children}</ol>,
      li:   ({children})=><li style={{marginBottom:4,lineHeight:1.65}}>{children}</li>,
      h1:   ({children})=><h1 style={{fontSize:17,fontWeight:800,color:"#fff",margin:"12px 0 6px"}}>{children}</h1>,
      h2:   ({children})=><h2 style={{fontSize:15,fontWeight:700,color:"#e0e0e0",margin:"10px 0 5px"}}>{children}</h2>,
      h3:   ({children})=><h3 style={{fontSize:14,fontWeight:700,color:"#ccc",margin:"8px 0 4px"}}>{children}</h3>,
      strong:({children})=><strong style={{color:"#fff",fontWeight:700}}>{children}</strong>,
      code: ({inline,children})=>inline
        ? <code style={{background:"#222",border:"1px solid #333",borderRadius:5,padding:"1px 5px",fontSize:12,color:"#a5f3fc",fontFamily:"monospace"}}>{children}</code>
        : <pre style={{background:"#0d0d0f",border:"1px solid #222",borderRadius:9,padding:12,overflowX:"auto",margin:"8px 0"}}><code style={{fontSize:12,color:"#a5f3fc",fontFamily:"monospace"}}>{children}</code></pre>,
      hr: ()=><hr style={{border:"none",borderTop:"1px solid #222",margin:"10px 0"}}/>,
    }}>
      {text}
    </ReactMarkdown>
  );
}

// ════════════════════════════════════════════════════════════════
export default function BusinessChat() {
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [user,        setUser]       = useState(null);
  const [profile,     setProfile]    = useState(null);
  const [chats,       setChats]      = useState([]);
  const [activeId,    setActiveId]   = useState(null);
  const [activeTool,  setActiveTool] = useState("jd");
  const [input,       setInput]      = useState("");
  const [busy,        setBusy]       = useState(false);
  const [loading,     setLoading]    = useState(true);
  const [sideOpen,    setSideOpen]   = useState(false);

  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const saveTimer  = useRef(null);
  const pendingKey = useRef(null);
  const active     = chats.find(c => c.id === activeId);

  const canSend = () => {
    if (!profile) return false;
    if (PAID_PLANS.has(profile.plan)) return true;
    return (profile.questions_used || 0) < 20;
  };

  const getToken = async () => {
    const { data:{ session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  };

  // Load
  useEffect(() => {
    const toolParam = searchParams.get("t");
    if (toolParam && TOOL_MAP[toolParam]) pendingKey.current = toolParam;

    supabase.auth.getSession().then(async ({ data:{ session } }) => {
      if (!session) { nav("/auth"); return; }
      setUser(session.user);
      const [{ data: prof }, { data: sessions }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", session.user.id).single(),
        supabase.from("chat_sessions").select("*").eq("user_id", session.user.id)
          .order("updated_at",{ascending:false}).limit(30),
      ]);
      if (prof) setProfile(prof);
      const parseArr = v => Array.isArray(v)?v:typeof v==="string"?JSON.parse(v)||[]:[];
      if (sessions?.length) {
        const loaded = sessions.map(r=>({ id:r.id, title:r.title, tool:r.mode||"jd", messages:parseArr(r.messages), history:parseArr(r.history) }));
        setChats(loaded); setActiveId(loaded[0].id); setActiveTool(loaded[0].tool||"jd");
      } else {
        const f = freshChat("jd"); setChats([f]); setActiveId(f.id);
      }
      setLoading(false);
    });
    const { data:{ subscription } } = supabase.auth.onAuthStateChange(async(ev,session)=>{
      if (!session) { nav("/auth"); return; }
    });
    return () => subscription.unsubscribe();
  }, [nav]);

  // Auto-trigger tool from URL param
  useEffect(() => {
    if (!loading && pendingKey.current) {
      const key = pendingKey.current; pendingKey.current = null;
      const tool = TOOL_MAP[key]; if (!tool) return;
      setSearchParams({}, { replace:true });
      startTool(tool);
    }
  }, [loading]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [active?.messages, busy]);

  const save = useCallback((chat, uid) => {
    if (!uid||!chat) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async()=>{
      await supabase.from("chat_sessions").upsert(
        { id:chat.id, user_id:uid, title:chat.title, mode:chat.tool, messages:chat.messages, history:chat.history },
        { onConflict:"id" }
      );
    }, 800);
  }, []);

  const patch = useCallback((id, fn) => {
    setChats(prev => {
      const next = prev.map(c => c.id===id ? fn(c) : c);
      const u = next.find(c=>c.id===id);
      if (u && user) save(u, user.id);
      return next;
    });
  }, [user, save]);

  const startTool = (tool) => {
    const c = freshChat(tool.key);
    c.title = tool.label;
    setChats(p => [c,...p]); setActiveId(c.id); setActiveTool(tool.key);
    setSideOpen(false);
    setTimeout(() => send(tool.body, c.id, tool.key), 80);
  };

  const newChat = (toolKey="jd") => {
    const c = freshChat(toolKey);
    setChats(p => [c,...p]); setActiveId(c.id); setActiveTool(toolKey);
    setInput(""); setSideOpen(false);
    setTimeout(() => inputRef.current?.focus(), 60);
  };

  const deleteChat = async (id) => {
    await supabase.from("chat_sessions").delete().eq("id",id);
    setChats(prev => {
      const rest = prev.filter(c=>c.id!==id);
      if (!rest.length) { const f=freshChat(activeTool); setActiveId(f.id); return [f]; }
      if (id===activeId) { setActiveId(rest[0].id); setActiveTool(rest[0].tool||"jd"); }
      return rest;
    });
  };

  // ── SEND ─────────────────────────────────────────────────────
  const send = async (txt=input, chatId=activeId, chatTool=activeTool) => {
    const msg = txt.trim();
    if (!msg||busy||!canSend()) return;
    setInput("");

    const hist = chats.find(c=>c.id===chatId)?.history||[];
    const isFirst = !(chats.find(c=>c.id===chatId)?.messages||[]).some(m=>m.role==="user");
    if (isFirst) patch(chatId, c=>({...c,title:msg.slice(0,44)+(msg.length>44?"…":"")}));
    patch(chatId, c=>({...c,messages:[...c.messages,{role:"user",text:msg}],history:[...c.history,{role:"user",content:msg}]}));
    setBusy(true);

    try {
      const token = await getToken(); await wakeServer();
      patch(chatId, c=>({...c,messages:[...c.messages,{role:"assistant",text:"",streaming:true}]}));

      // Always send [MODE:BUSINESS] so server uses business context
      const res = await fetch(`${API}/api/chat`, {
        method:"POST",
        headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},
        body: JSON.stringify({
          message: `[MODE:BUSINESS] [TOOL:${chatTool}] ${buildContextString?buildContextString(profile)||"":""} ${msg}`,
          history: hist,
          session_id: chatId,
          mode: "CAREER",
          userType: "business",
        }),
      });

      if (!res.ok || !res.body) throw new Error("Server error " + res.status);
      const reader = res.body.getReader(), decoder = new TextDecoder();
      let fullText = "";
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        const lines = decoder.decode(value,{stream:true}).split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const p = JSON.parse(line.slice(6));
            if (p.chunk) { fullText+=p.chunk; patch(chatId,c=>({...c,messages:c.messages.map(m=>m.streaming?{...m,text:fullText}:m)})); }
            if (p.error) fullText = p.error;
          } catch {}
        }
      }
      patch(chatId, c=>({...c,
        messages: c.messages.map(m=>m.streaming?{role:"assistant",text:fullText||"No response."}:m),
        history:  [...c.history,{role:"assistant",content:fullText}],
      }));
    } catch(err) {
      patch(chatId, c=>({...c,messages:c.messages.filter(m=>!m.streaming).concat([{role:"assistant",text:"⚠️ Could not reach server. Please try again."}])}));
    } finally { setBusy(false); }
  };

  const handleKey = e => { if (e.key==="Enter"&&!e.shiftKey&&!e.ctrlKey) { e.preventDefault(); send(); } };
  const currentTool = TOOL_MAP[activeTool] || BIZ_TOOLS[0];
  const plan  = profile?.plan || "free";
  const name  = profile?.full_name?.split(" ")[0] || "there";

  // ── Sidebar list with chat grouped by date ────────────────────
  const todayChats = chats.filter(c => {
    const ts = parseInt(c.id.split("-")[1]||0);
    return Date.now()-ts < 86400000;
  });
  const olderChats = chats.filter(c => {
    const ts = parseInt(c.id.split("-")[1]||0);
    return Date.now()-ts >= 86400000;
  });

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:BG}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:44,height:44,borderRadius:13,background:`linear-gradient(135deg,${PURP},#4f1fa5)`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14,color:"#fff",margin:"0 auto 12px",boxShadow:`0 8px 24px ${PURP}40`}}>WF</div>
        <div style={{color:"#444",fontSize:13,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Loading…</div>
      </div>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:BG,fontFamily:"'Plus Jakarta Sans',sans-serif",color:TEXT,overflow:"hidden"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'); * { box-sizing:border-box; } ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:#222;border-radius:4px}`}</style>

      {/* ── Top Bar ── */}
      <div style={{height:46,background:"#0c0c0e",borderBottom:`1px solid ${BORD}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",flexShrink:0,zIndex:30}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>setSideOpen(o=>!o)} style={{background:"none",border:"none",color:"#555",cursor:"pointer",fontSize:16,lineHeight:1,padding:"4px 6px"}}>☰</button>
          <a href="https://nugens.in.net" style={{display:"flex",alignItems:"center",gap:6,textDecoration:"none"}}>
            <img src={NG_LOGO} style={{width:20,height:20,borderRadius:5,objectFit:"cover"}} alt="NG"/>
            <span style={{fontWeight:800,fontSize:13,color:"#e8e8e8",letterSpacing:"-0.03em"}}>Nu<span style={{color:PINK}}>Gens</span></span>
          </a>
        </div>

        {/* App switcher */}
        <div style={{display:"flex",alignItems:"center",gap:3}}>
          {APPS.map(app=>(
            <a key={app.label} href={app.url} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:18,textDecoration:"none",fontSize:11.5,fontWeight:600,
              background:app.active?`${app.color}15`:"none",color:app.active?app.color:"#444",border:`1px solid ${app.active?app.color+"30":"transparent"}`,transition:"all 0.13s"}}
              onMouseEnter={e=>{if(!app.active){e.currentTarget.style.color=app.color;e.currentTarget.style.background=`${app.color}10`;}}}
              onMouseLeave={e=>{if(!app.active){e.currentTarget.style.color="#444";e.currentTarget.style.background="none";}}}>
              <span style={{fontSize:10}}>{app.icon}</span>{app.label}
              {app.active&&<span style={{width:4,height:4,borderRadius:"50%",background:app.color}}/>}
            </a>
          ))}
        </div>

        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <a href="/business" style={{fontSize:11,color:"#444",textDecoration:"none",padding:"4px 10px",border:`1px solid ${BORD}`,borderRadius:7,transition:"all 0.13s"}}
            onMouseEnter={e=>{e.currentTarget.style.color=PINK;e.currentTarget.style.borderColor=`${PINK}40`;}}
            onMouseLeave={e=>{e.currentTarget.style.color="#444";e.currentTarget.style.borderColor=BORD;}}>
            Dashboard
          </a>
          <div style={{fontSize:10,fontWeight:700,color:plan==="admin"?PURP:PINK,background:plan==="admin"?`${PURP}20`:`${PINK}18`,padding:"3px 9px",borderRadius:6,border:`1px solid ${plan==="admin"?PURP+"30":PINK+"25"}`}}>
            {plan==="admin"?"Admin ✦":"Business Pro"}
          </div>
        </div>
      </div>

      <div style={{display:"flex",flex:1,overflow:"hidden"}}>

        {/* ── Left Sidebar ── */}
        <div style={{width:sideOpen?240:0,flexShrink:0,transition:"width 0.2s ease",overflow:"hidden",background:"#0c0c0e",borderRight:`1px solid ${BORD}`,display:"flex",flexDirection:"column"}}>
          <div style={{padding:"14px 10px 10px",display:"flex",flexDirection:"column",gap:3,flexShrink:0}}>
            <div style={{fontSize:9.5,fontWeight:700,color:"#333",textTransform:"uppercase",letterSpacing:"0.09em",padding:"2px 8px 8px"}}>Workforce Tools</div>
            {BIZ_TOOLS.map(t=>(
              <button key={t.key} onClick={()=>startTool(t)}
                style={{display:"flex",alignItems:"center",gap:9,padding:"8px 10px",borderRadius:8,border:"none",background:activeTool===t.key?`${t.color}15`:"none",cursor:"pointer",textAlign:"left",transition:"background 0.13s",width:"100%"}}>
                <div style={{width:24,height:24,borderRadius:6,background:`${t.color}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:t.color,flexShrink:0}}>{t.icon}</div>
                <span style={{fontSize:12,fontWeight:activeTool===t.key?700:500,color:activeTool===t.key?t.color:"#666"}}>{t.label}</span>
              </button>
            ))}
          </div>

          <div style={{flex:1,overflow:"auto",padding:"0 10px"}}>
            <div style={{fontSize:9.5,fontWeight:700,color:"#333",textTransform:"uppercase",letterSpacing:"0.09em",padding:"12px 8px 6px"}}>Recents</div>
            {todayChats.length>0&&<div style={{fontSize:9,color:"#2a2a2a",padding:"2px 8px 4px",fontWeight:600}}>Today</div>}
            {todayChats.map(c=>(
              <div key={c.id} onClick={()=>{setActiveId(c.id);setActiveTool(c.tool||"jd");setSideOpen(false);}}
                style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 8px",borderRadius:7,cursor:"pointer",
                  background:activeId===c.id?`${PINK}12`:"none",marginBottom:2,transition:"background 0.12s",group:true}}>
                <span style={{fontSize:11.5,color:activeId===c.id?"#e8e8e8":"#555",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{c.title}</span>
                <button onClick={e=>{e.stopPropagation();deleteChat(c.id);}} style={{background:"none",border:"none",color:"#333",cursor:"pointer",fontSize:11,padding:"0 0 0 4px",flexShrink:0}}>✕</button>
              </div>
            ))}
            {olderChats.length>0&&<div style={{fontSize:9,color:"#2a2a2a",padding:"8px 8px 4px",fontWeight:600}}>Earlier</div>}
            {olderChats.map(c=>(
              <div key={c.id} onClick={()=>{setActiveId(c.id);setActiveTool(c.tool||"jd");setSideOpen(false);}}
                style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 8px",borderRadius:7,cursor:"pointer",
                  background:activeId===c.id?`${PINK}12`:"none",marginBottom:2,transition:"background 0.12s"}}>
                <span style={{fontSize:11.5,color:activeId===c.id?"#e8e8e8":"#555",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{c.title}</span>
                <button onClick={e=>{e.stopPropagation();deleteChat(c.id);}} style={{background:"none",border:"none",color:"#333",cursor:"pointer",fontSize:11,padding:"0 0 0 4px",flexShrink:0}}>✕</button>
              </div>
            ))}
          </div>

          {/* User section */}
          <div style={{padding:"12px 14px",borderTop:`1px solid ${BORD}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:`${PURP}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:PURP}}>
                {name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{fontSize:11.5,fontWeight:600,color:"#888"}}>{name}</div>
                <div style={{fontSize:9.5,color:"#444"}}>Business</div>
              </div>
            </div>
            <button onClick={async()=>{await supabase.auth.signOut();window.location.href="https://nugens.in.net/auth";}}
              style={{background:"none",border:"none",color:"#333",cursor:"pointer",fontSize:11,padding:0}}>Out</button>
          </div>
        </div>

        {/* ── Center: Chat ── */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>

          {/* Tool header */}
          <div style={{background:"#0c0c0e",borderBottom:`1px solid ${BORD}`,padding:"0 24px",height:48,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:28,height:28,borderRadius:7,background:`${currentTool.color}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:currentTool.color}}>{currentTool.icon}</div>
              <span style={{fontSize:13,fontWeight:700,color:"#c8c8c8"}}>{currentTool.label}</span>
            </div>
            <div style={{display:"flex",gap:6}}>
              {BIZ_TOOLS.map(t=>(
                <button key={t.key} onClick={()=>startTool(t)}
                  style={{padding:"4px 12px",borderRadius:18,border:`1px solid ${activeTool===t.key?t.color+"50":BORD}`,background:activeTool===t.key?`${t.color}15`:"none",
                    color:activeTool===t.key?t.color:"#444",fontSize:11,fontWeight:activeTool===t.key?700:500,cursor:"pointer",transition:"all 0.13s",fontFamily:"inherit"}}>
                  {t.short}
                </button>
              ))}
              <button onClick={()=>newChat(activeTool)}
                style={{padding:"4px 12px",borderRadius:18,border:`1px solid ${BORD}`,background:"none",color:"#444",fontSize:11,cursor:"pointer",fontFamily:"inherit",marginLeft:4}}>
                + New
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{flex:1,overflowY:"auto",padding:"24px 32px",display:"flex",flexDirection:"column",gap:16}}>
            {(!active?.messages||active.messages.length===0) && (
              <div style={{margin:"auto",textAlign:"center",maxWidth:520,padding:"40px 20px"}}>
                <div style={{width:56,height:56,borderRadius:16,background:`${currentTool.color}20`,border:`1px solid ${currentTool.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:currentTool.color,margin:"0 auto 20px"}}>{currentTool.icon}</div>
                <h2 style={{fontSize:20,fontWeight:800,color:"#e8e8e8",letterSpacing:"-0.03em",marginBottom:8}}>{currentTool.label}</h2>
                <p style={{fontSize:13.5,color:"#555",lineHeight:1.7,marginBottom:28}}>{
                  {jd:"Generate complete, market-aligned job descriptions for any role in seconds.",
                   hiring:"Get full hiring intelligence — skills, salary, sourcing strategy, and evaluation framework.",
                   team:"Upload your team data and get a skill gap analysis with training recommendations.",
                   workforce:"Build a phase-by-phase hiring roadmap tailored to your company stage and goals.",
                   salary:"Real Indian market salary data by role, city, experience, and industry.",
                   interview:"Generate role-specific interview question kits with scoring rubrics."}[currentTool.key]
                }</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,textAlign:"left"}}>
                  {({
                    jd:["Frontend Engineer, Series B startup","Senior Data Scientist, fintech, 5+ years","Product Manager, early stage, Bangalore"],
                    hiring:["Hiring a CTO for a 20-person startup","Need a senior backend engineer in Chennai","Building a sales team from scratch"],
                    team:["My team has 3 engineers and 1 designer","Team of 5, building a SaaS product","Sales team of 8, targeting enterprise clients"],
                    workforce:["Pre-seed, 4 people, raising in 6 months","Series A, 15 employees, scaling to 40","Bootstrapped, 8 people, profitable"],
                    salary:["Senior React developer, Bangalore","VP of Marketing, 10+ years, Mumbai","Data Analyst, entry level, remote"],
                    interview:["Senior engineer, system design focus","Sales manager, enterprise B2B","Junior designer, portfolio review"],
                  }[currentTool.key]||[]).map((q,i)=>(
                    <button key={i} onClick={()=>send(q)}
                      style={{padding:"10px 12px",background:"#111115",border:`1px solid ${BORD}`,borderRadius:9,color:"#888",fontSize:12,cursor:"pointer",textAlign:"left",lineHeight:1.5,fontFamily:"inherit",transition:"all 0.13s"}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=`${currentTool.color}40`;e.currentTarget.style.color="#ccc";}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=BORD;e.currentTarget.style.color="#888";}}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {active?.messages?.map((m,i)=>(
              <div key={i} style={{display:"flex",flexDirection:"column",alignItems:m.role==="user"?"flex-end":"flex-start",gap:4}}>
                {m.role!=="user"&&(
                  <div style={{display:"flex",alignItems:"center",gap:6,marginLeft:4}}>
                    <div style={{width:18,height:18,borderRadius:5,background:`${currentTool.color}25`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:currentTool.color}}>{currentTool.icon}</div>
                    <span style={{fontSize:10,fontWeight:700,color:currentTool.color,textTransform:"uppercase",letterSpacing:"0.06em"}}>{currentTool.label}</span>
                  </div>
                )}
                <div style={{maxWidth:"78%",
                  background:m.role==="user"?`linear-gradient(135deg,${PURP},#4f1fa5)`:"#111115",
                  color:m.role==="user"?"#fff":TEXT,
                  border:m.role==="user"?"none":`1px solid ${BORD}`,
                  borderRadius:m.role==="user"?"16px 16px 3px 16px":"16px 16px 16px 3px",
                  padding:"12px 16px",fontSize:14,lineHeight:1.7,
                  boxShadow:m.role!=="user"?"0 1px 3px rgba(0,0,0,0.3)":"none",
                }}>
                  {m.streaming
                    ? <span>{m.text||""}<span style={{display:"inline-block",width:8,height:14,background:currentTool.color,borderRadius:2,marginLeft:2,animation:"blink 0.9s steps(2,start) infinite",verticalAlign:"middle"}}><style>{"@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}"}</style></span></span>
                    : m.role==="user"
                      ? <span style={{whiteSpace:"pre-wrap"}}>{m.text}</span>
                      : <MsgBody text={m.text||""}/>
                  }
                </div>
                {m.role==="assistant"&&!m.streaming&&m.text&&(
                  <button onClick={()=>navigator.clipboard?.writeText(m.text)}
                    style={{background:"none",border:"none",color:"#2a2a2a",cursor:"pointer",fontSize:10.5,padding:"2px 6px",marginLeft:4,fontFamily:"inherit",transition:"color 0.13s"}}
                    onMouseEnter={e=>e.currentTarget.style.color="#666"}
                    onMouseLeave={e=>e.currentTarget.style.color="#2a2a2a"}>
                    Copy
                  </button>
                )}
              </div>
            ))}

            {busy&&(
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:4}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginLeft:4}}>
                  <div style={{width:18,height:18,borderRadius:5,background:`${currentTool.color}25`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:currentTool.color}}>{currentTool.icon}</div>
                  <span style={{fontSize:10,fontWeight:700,color:currentTool.color,textTransform:"uppercase",letterSpacing:"0.06em"}}>{currentTool.label}</span>
                </div>
                <div style={{background:"#111115",border:`1px solid ${BORD}`,borderRadius:"16px 16px 16px 3px",padding:"12px 16px"}}>
                  <div style={{display:"flex",gap:4,alignItems:"center"}}>
                    {[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:currentTool.color,opacity:0.6,animation:`bounce 1.2s ${i*0.2}s infinite`}}/>)}
                    <style>{"@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}"}</style>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Input */}
          <div style={{borderTop:`1px solid ${BORD}`,padding:"14px 24px 18px",flexShrink:0,background:"#0c0c0e"}}>
            <div style={{display:"flex",gap:10,background:"#111115",border:`1.5px solid ${BORD}`,borderRadius:14,padding:"10px 12px 10px 18px",transition:"border 0.15s"}}
              onFocusCapture={e=>e.currentTarget.style.borderColor=`${currentTool.color}50`}
              onBlurCapture={e=>e.currentTarget.style.borderColor=BORD}>
              <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={`Ask ${currentTool.label}…`}
                rows={1}
                style={{flex:1,border:"none",background:"transparent",color:TEXT,fontSize:13.5,fontFamily:"inherit",resize:"none",outline:"none",lineHeight:1.6,minHeight:44,maxHeight:140}}
                onInput={e=>{e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,140)+"px";}}
              />
              <button onClick={()=>send()} disabled={busy||!input.trim()}
                style={{padding:"10px 20px",background:busy||!input.trim()?`${currentTool.color}40`:currentTool.color,color:"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:700,cursor:busy||!input.trim()?"not-allowed":"pointer",fontFamily:"inherit",alignSelf:"flex-end",transition:"background 0.15s",flexShrink:0}}>
                Send
              </button>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:7}}>
              <span style={{fontSize:10,color:"#2a2a2a"}}>Enter to send · Shift+Enter for new line</span>
              <span style={{fontSize:10,color:"#2a2a2a"}}>Business Workforce AI · {name}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
