/**
 * BusinessChat — Business AI workspace for Gen-E
 * Nugens brand light theme: white cards, pink accent, clean layout
 */
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

const API   = import.meta.env.VITE_GEN_E_API_URL || "https://nugens-platform.onrender.com";
const PINK  = "#e8185d";
const PURP  = "#7c3aed";
const BG    = "#f8f9fb";
const CARD  = "#ffffff";
const BORD  = "#e8eaed";
const TEXT  = "#111827";
const MUTED = "#6b7280";

const PAID_PLANS = new Set([
  "monthly","yearly","admin",
  "hx_biz_starter","hx_biz_premium","hx_biz_pro","hx_biz_yearly",
  "hx_ind_starter","hx_ind_premium","hx_ind_pro","hx_ind_yearly",
]);

const BIZ_TOOLS = [
  { key:"jd",        icon:"▤", color:PURP,      label:"JD Generator",    short:"JD",       body:"Generate a comprehensive job description. Ask me: role title, company type, and experience level required." },
  { key:"hiring",    icon:"◎", color:PINK,      label:"Hiring AI",       short:"Hiring",   body:"Give me full hiring intelligence for a role I need to fill. Ask me: role title, industry, and company stage." },
  { key:"team",      icon:"◈", color:"#0284c7", label:"Team Skill Map",  short:"Skills",   body:"Map my team's skills and find the gaps. Ask me about my team members, roles, and company goals." },
  { key:"workforce", icon:"⬡", color:"#d97706", label:"Workforce Plan",  short:"Workforce",body:"Create a workforce planning roadmap. Ask me: company stage, current team size, and 12-month growth goals." },
  { key:"salary",    icon:"₹", color:"#16a34a", label:"Salary Benchmark",short:"Salary",   body:"Provide salary benchmarks for the Indian market. Ask me: role, experience level, city, and industry." },
  { key:"interview", icon:"◷", color:"#0284c7", label:"Interview AI",    short:"Interview",body:"Generate a role-specific interview kit with questions and scoring rubric. Ask me: role, experience level, and company type." },
];

const TOOL_MAP = {};
BIZ_TOOLS.forEach(t => { TOOL_MAP[t.key] = t; });

const STARTERS = {
  jd:        ["Frontend Engineer, Series B startup","Senior Data Scientist, fintech, 5+ years","Product Manager, Bangalore, early stage"],
  hiring:    ["Hiring a CTO for a 20-person startup","Need a senior backend engineer in Chennai","Building a sales team from scratch"],
  team:      ["Team of 4 engineers, 1 designer, SaaS product","Sales team of 8 targeting enterprise","10-person startup scaling fast"],
  workforce: ["Pre-seed, 4 people, raising in 6 months","Series A, 15 employees, scaling to 40","Bootstrapped, 8 people, profitable"],
  salary:    ["Senior React developer, Bangalore","VP of Marketing, 10+ years, Mumbai","Data Analyst, entry level, remote"],
  interview: ["Senior engineer, system design focus","Sales manager, enterprise B2B","Junior designer, portfolio review"],
};

const uid       = () => `b-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
const freshChat = (tool) => ({ id:uid(), title:"New Chat", tool:tool||"jd", messages:[], history:[] });

const APPS = [
  { label:"Gen-E",    url:"https://gene.nugens.in.net",    color:PURP,      active:true  },
  { label:"HyperX",  url:"https://hyperx.nugens.in.net",  color:PINK,      active:false },
  { label:"DigiHub", url:"https://digihub.nugens.in.net", color:"#0284c7", active:false },
  { label:"The Units",url:"https://units.nugens.in.net",  color:"#d97706", active:false },
];

let _warmed = false, _wakeP = null;
function wakeServer() {
  if (_warmed) return Promise.resolve();
  if (_wakeP)  return _wakeP;
  _wakeP = (async () => {
    const end = Date.now() + 90000;
    while (Date.now() < end) {
      try {
        const r = await fetch(`${API}/health`, { signal: AbortSignal.timeout(8000) });
        if (r.ok) { _warmed = true; _wakeP = null; return; }
      } catch {}
      await new Promise(r => setTimeout(r, 4000));
    }
    _wakeP = null;
  })();
  return _wakeP;
}
wakeServer().catch(() => {});

export default function BusinessChat() {
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [user,       setUser]       = useState(null);
  const [profile,    setProfile]    = useState(null);
  const [chats,      setChats]      = useState([]);
  const [activeId,   setActiveId]   = useState(null);
  const [activeTool, setActiveTool] = useState("jd");
  const [input,      setInput]      = useState("");
  const [busy,       setBusy]       = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [sideOpen,   setSideOpen]   = useState(true);

  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const saveTimer  = useRef(null);
  const pendingKey = useRef(null);

  const active      = chats.find(c => c.id === activeId);
  const currentTool = TOOL_MAP[activeTool] || BIZ_TOOLS[0];

  useEffect(() => {
    const toolParam = searchParams.get("t");
    if (toolParam && TOOL_MAP[toolParam]) pendingKey.current = toolParam;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { nav("/auth"); return; }
      setUser(session.user);
      const [{ data: prof }, { data: sessions }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", session.user.id).single(),
        supabase.from("chat_sessions").select("*").eq("user_id", session.user.id)
          .order("updated_at", { ascending: false }).limit(30),
      ]);
      if (prof) setProfile(prof);
      const parseArr = v => {
        if (Array.isArray(v)) return v;
        if (typeof v === "string") { try { return JSON.parse(v); } catch { return []; } }
        return [];
      };
      if (sessions?.length) {
        const loaded = sessions.map(r => ({ id:r.id, title:r.title, tool:r.mode||"jd", messages:parseArr(r.messages), history:parseArr(r.history) }));
        setChats(loaded); setActiveId(loaded[0].id); setActiveTool(loaded[0].tool||"jd");
      } else {
        const f = freshChat("jd"); setChats([f]); setActiveId(f.id);
      }
      setLoading(false);
    }).catch(() => { nav("/auth"); });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, session) => {
      if (!session) nav("/auth");
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && pendingKey.current) {
      const key = pendingKey.current; pendingKey.current = null;
      const tool = TOOL_MAP[key]; if (!tool) return;
      setSearchParams({}, { replace: true });
      startTool(tool);
    }
  }, [loading]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [active?.messages, busy]);

  const save = useCallback((chat, uid) => {
    if (!uid || !chat) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await supabase.from("chat_sessions").upsert(
        { id:chat.id, user_id:uid, title:chat.title, mode:chat.tool, messages:chat.messages, history:chat.history },
        { onConflict:"id" }
      );
    }, 800);
  }, []);

  const patch = useCallback((id, fn) => {
    setChats(prev => {
      const next = prev.map(c => c.id === id ? fn(c) : c);
      const u = next.find(c => c.id === id);
      if (u && user) save(u, user.id);
      return next;
    });
  }, [user, save]);

  const startTool = (tool) => {
    const c = freshChat(tool.key); c.title = tool.label;
    setChats(p => [c, ...p]); setActiveId(c.id); setActiveTool(tool.key);
    setTimeout(() => sendMsg(tool.body, c.id, tool.key), 100);
  };

  const newChat = () => {
    const c = freshChat(activeTool);
    setChats(p => [c, ...p]); setActiveId(c.id);
    setInput(""); setTimeout(() => inputRef.current?.focus(), 60);
  };

  const deleteChat = async (id) => {
    await supabase.from("chat_sessions").delete().eq("id", id);
    setChats(prev => {
      const rest = prev.filter(c => c.id !== id);
      if (!rest.length) { const f = freshChat(activeTool); setActiveId(f.id); return [f]; }
      if (id === activeId) { setActiveId(rest[0].id); setActiveTool(rest[0].tool||"jd"); }
      return rest;
    });
  };

  const sendMsg = async (txt, chatId, chatTool) => {
    const cId   = chatId   || activeId;
    const cTool = chatTool || activeTool;
    const msg   = (txt || input).trim();
    if (!msg || busy) return;
    setInput("");

    const hist    = chats.find(c => c.id === cId)?.history || [];
    const isFirst = !(chats.find(c => c.id === cId)?.messages || []).some(m => m.role === "user");
    if (isFirst) patch(cId, c => ({ ...c, title: msg.slice(0, 44) + (msg.length > 44 ? "…" : "") }));
    patch(cId, c => ({
      ...c,
      messages: [...c.messages, { role:"user", text:msg }],
      history:  [...c.history,  { role:"user", content:msg }],
    }));
    setBusy(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || null;
      await wakeServer();
      // Small delay so user message state settles before streaming bubble appears
      await new Promise(r => setTimeout(r, 50));
      patch(cId, c => {
        // Only add streaming bubble if one doesn't already exist
        const hasStreaming = c.messages.some(m => m.streaming);
        if (hasStreaming) return c;
        return { ...c, messages: [...c.messages, { role:"assistant", text:"", streaming:true }] };
      });

      const res = await fetch(`${API}/api/chat`, {
        method:"POST",
        headers:{ "Content-Type":"application/json", ...(token ? { Authorization:`Bearer ${token}` } : {}) },
        body: JSON.stringify({
          message:    `[MODE:BUSINESS] [TOOL:${cTool}] ${msg}`,
          history:    hist,
          session_id: cId,
          mode:       "CAREER",
          userType:   "business",
        }),
      });

      if (!res.ok || !res.body) throw new Error("Server error " + res.status);
      const reader = res.body.getReader(), decoder = new TextDecoder();
      let fullText = "";
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        for (const line of decoder.decode(value, { stream:true }).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const p = JSON.parse(line.slice(6));
            if (p.chunk) { fullText += p.chunk; patch(cId, c => ({ ...c, messages: c.messages.map(m => m.streaming ? { ...m, text:fullText } : m) })); }
            if (p.error) fullText = p.error;
          } catch {}
        }
      }
      const finalText = fullText || "Sorry, I could not generate a response. Please try again.";
      patch(cId, c => ({
        ...c,
        messages: c.messages.map(m => m.streaming ? { role:"assistant", text:finalText } : m),
        history:  [...c.history, { role:"assistant", content:finalText }],
      }));
    } catch (err) {
      patch(cId, c => ({
        ...c,
        messages: c.messages.filter(m => !m.streaming).concat([{ role:"assistant", text:"⚠️ Could not reach server. Please try again." }]),
      }));
    } finally { setBusy(false); }
  };

  const firstName = profile?.full_name?.split(" ")[0] || "there";
  const plan      = profile?.plan || "free";

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:BG, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:44, height:44, borderRadius:12, background:`linear-gradient(135deg,${PINK},#c4134e)`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:13, color:"#fff", margin:"0 auto 12px", boxShadow:`0 8px 24px ${PINK}40` }}>GE</div>
        <div style={{ color:MUTED, fontSize:13 }}>Loading Workforce AI…</div>
      </div>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:BG, fontFamily:"'Plus Jakarta Sans',sans-serif", color:TEXT, overflow:"hidden" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'); *{box-sizing:border-box} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#ddd;border-radius:4px} @keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}} @keyframes blink{0%,100%{opacity:1}50%{opacity:0}} .tool-btn:hover{background:#f8f9fb!important} .chat-item:hover{background:#f3f4f6!important} .starter:hover{background:#f0f0f3!important;border-color:${PINK}30!important}`}</style>

      {/* ── Top bar ── */}
      <div style={{ height:52, background:CARD, borderBottom:`1px solid ${BORD}`, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", flexShrink:0, boxShadow:"0 1px 0 #f0f0f0" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <button onClick={() => setSideOpen(o => !o)}
            style={{ background:"none", border:`1px solid ${BORD}`, color:MUTED, cursor:"pointer", fontSize:14, lineHeight:1, padding:"5px 8px", borderRadius:7 }}>☰</button>
          <a href="https://nugens.in.net" style={{ fontWeight:800, fontSize:15, color:TEXT, letterSpacing:"-0.03em", textDecoration:"none" }}>
            Nu<span style={{ color:PINK }}>Gens</span>
          </a>
          <div style={{ display:"flex", alignItems:"center", gap:4, padding:"3px 10px", background:`${PINK}10`, border:`1px solid ${PINK}25`, borderRadius:20 }}>
            <span style={{ fontSize:9, fontWeight:800, color:PINK, textTransform:"uppercase", letterSpacing:"0.08em" }}>🏢 Business Mode</span>
          </div>
        </div>

        {/* App switcher */}
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          {APPS.map(app => (
            <a key={app.label} href={app.url}
              style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 12px", borderRadius:20, textDecoration:"none", fontSize:12, fontWeight:600,
                background: app.active ? `${app.color}10` : "none",
                color:      app.active ? app.color : MUTED,
                border:     `1px solid ${app.active ? app.color + "30" : "transparent"}`,
              }}>
              {app.label}
              {app.active && <span style={{ width:5, height:5, borderRadius:"50%", background:app.color, display:"inline-block" }} />}
            </a>
          ))}
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <a href="/business" style={{ fontSize:11.5, color:MUTED, textDecoration:"none", padding:"5px 12px", border:`1px solid ${BORD}`, borderRadius:7, fontWeight:500, transition:"all 0.13s" }}>
            ← Dashboard
          </a>
          <div style={{ fontSize:10, fontWeight:700, color:plan==="admin"?PURP:PINK, background:plan==="admin"?`${PURP}12`:`${PINK}12`, padding:"4px 10px", borderRadius:20, border:`1px solid ${plan==="admin"?PURP+"25":PINK+"25"}` }}>
            {plan === "admin" ? "Admin ✦" : "Business"}
          </div>
        </div>
      </div>

      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

        {/* ── Sidebar ── */}
        {sideOpen && (
          <div style={{ width:220, flexShrink:0, background:CARD, borderRight:`1px solid ${BORD}`, display:"flex", flexDirection:"column", overflowY:"auto" }}>

            {/* Tools */}
            <div style={{ padding:"16px 12px 8px" }}>
              <div style={{ fontSize:10, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10, paddingLeft:4 }}>Workforce Tools</div>
              {BIZ_TOOLS.map(t => (
                <button key={t.key} className="tool-btn" onClick={() => startTool(t)}
                  style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 10px", borderRadius:9, border:"none",
                    background: activeTool === t.key ? `${t.color}10` : "none",
                    cursor:"pointer", width:"100%", textAlign:"left", marginBottom:2, transition:"background 0.13s" }}>
                  <div style={{ width:28, height:28, borderRadius:7, background:`${t.color}12`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, color:t.color, flexShrink:0 }}>{t.icon}</div>
                  <span style={{ fontSize:13, fontWeight: activeTool === t.key ? 700 : 500, color: activeTool === t.key ? t.color : TEXT }}>{t.label}</span>
                </button>
              ))}
            </div>

            {/* Recent chats */}
            <div style={{ flex:1, overflow:"auto", padding:"0 12px", borderTop:`1px solid ${BORD}` }}>
              <div style={{ fontSize:10, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em", padding:"12px 4px 8px" }}>Recent Chats</div>
              {chats.map(c => {
                const toolColor = TOOL_MAP[c.tool]?.color || PINK;
                return (
                  <div key={c.id} className="chat-item" onClick={() => { setActiveId(c.id); setActiveTool(c.tool||"jd"); }}
                    style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"7px 8px", borderRadius:8, cursor:"pointer",
                      background: activeId === c.id ? `${toolColor}08` : "none",
                      border:`1px solid ${activeId === c.id ? toolColor+"20" : "transparent"}`,
                      marginBottom:2, transition:"all 0.12s" }}>
                    <span style={{ fontSize:12, color: activeId === c.id ? TEXT : MUTED, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1, fontWeight: activeId===c.id?600:400 }}>
                      {c.title}
                    </span>
                    <button onClick={e => { e.stopPropagation(); deleteChat(c.id); }}
                      style={{ background:"none", border:"none", color:"#ccc", cursor:"pointer", fontSize:11, padding:"0 0 0 4px", flexShrink:0 }}>✕</button>
                  </div>
                );
              })}
            </div>

            {/* User */}
            <div style={{ padding:"12px 16px", borderTop:`1px solid ${BORD}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:30, height:30, borderRadius:"50%", background:`${PINK}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:PINK }}>
                  {firstName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:TEXT }}>{firstName}</div>
                  <div style={{ fontSize:10, color:MUTED }}>Business</div>
                </div>
              </div>
              <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "https://nugens.in.net/auth"; }}
                style={{ background:"none", border:`1px solid ${BORD}`, color:MUTED, cursor:"pointer", fontSize:11, padding:"4px 8px", borderRadius:6, fontFamily:"inherit" }}>
                Out
              </button>
            </div>
          </div>
        )}

        {/* ── Chat area ── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>

          {/* Tool tab bar */}
          <div style={{ background:CARD, borderBottom:`1px solid ${BORD}`, padding:"0 24px", height:50, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:30, height:30, borderRadius:8, background:`${currentTool.color}12`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, color:currentTool.color }}>{currentTool.icon}</div>
              <span style={{ fontSize:14, fontWeight:700, color:TEXT }}>{currentTool.label}</span>
              <span style={{ fontSize:11, color:MUTED, background:"#f3f4f6", padding:"2px 9px", borderRadius:12 }}>Business AI</span>
            </div>
            <div style={{ display:"flex", gap:6 }}>
              {BIZ_TOOLS.map(t => (
                <button key={t.key} onClick={() => startTool(t)}
                  style={{ padding:"5px 13px", borderRadius:20,
                    border:`1px solid ${activeTool === t.key ? t.color + "40" : BORD}`,
                    background: activeTool === t.key ? `${t.color}10` : "none",
                    color: activeTool === t.key ? t.color : MUTED,
                    fontSize:11.5, fontWeight: activeTool === t.key ? 700 : 500,
                    cursor:"pointer", fontFamily:"inherit", transition:"all 0.13s" }}>
                  {t.short}
                </button>
              ))}
              <button onClick={newChat}
                style={{ padding:"5px 13px", borderRadius:20, border:`1px solid ${BORD}`, background:"none", color:PINK, fontSize:11.5, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                + New
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:"auto", padding:"28px 40px", display:"flex", flexDirection:"column", gap:18, maxWidth:900, width:"100%", margin:"0 auto", alignSelf:"center", boxSizing:"border-box" }}>

            {/* Empty state */}
            {(!active?.messages || active.messages.length === 0) && (
              <div style={{ margin:"auto", textAlign:"center", maxWidth:480, padding:"48px 20px" }}>
                <div style={{ width:60, height:60, borderRadius:18, background:`${currentTool.color}12`, border:`1px solid ${currentTool.color}25`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, color:currentTool.color, margin:"0 auto 20px" }}>
                  {currentTool.icon}
                </div>
                <h2 style={{ fontSize:20, fontWeight:800, color:TEXT, letterSpacing:"-0.03em", marginBottom:8 }}>{currentTool.label}</h2>
                <p style={{ fontSize:13.5, color:MUTED, lineHeight:1.75, marginBottom:28 }}>
                  {{ jd:"Generate complete, market-aligned job descriptions for any role in seconds.", hiring:"Full hiring intelligence — skills, salary, sourcing strategy, and evaluation framework.", team:"Analyse your team's skills and identify gaps with a training roadmap.", workforce:"Phase-by-phase hiring roadmap tailored to your company stage and goals.", salary:"Real Indian market salary data by role, city, experience, and industry.", interview:"Role-specific interview kits with scoring rubrics for any position." }[currentTool.key] || ""}
                </p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, textAlign:"left" }}>
                  {(STARTERS[currentTool.key] || []).map((q, i) => (
                    <button key={i} className="starter" onClick={() => sendMsg(q)}
                      style={{ padding:"11px 14px", background:CARD, border:`1px solid ${BORD}`, borderRadius:10, color:MUTED, fontSize:12.5, cursor:"pointer", textAlign:"left", lineHeight:1.55, fontFamily:"inherit", boxShadow:"0 1px 3px rgba(0,0,0,0.04)", transition:"all 0.13s" }}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {(active?.messages || []).map((m, i) => (
              <div key={i} style={{ display:"flex", flexDirection:"column", alignItems: m.role === "user" ? "flex-end" : "flex-start", gap:5 }}>
                {m.role !== "user" && (
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginLeft:2 }}>
                    <div style={{ width:20, height:20, borderRadius:6, background:`${currentTool.color}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:currentTool.color }}>{currentTool.icon}</div>
                    <span style={{ fontSize:10.5, fontWeight:700, color:currentTool.color, textTransform:"uppercase", letterSpacing:"0.06em" }}>{currentTool.label}</span>
                  </div>
                )}
                <div style={{
                  maxWidth:"80%",
                  background: m.role === "user" ? PINK : CARD,
                  color:      m.role === "user" ? "#fff" : TEXT,
                  border:     m.role === "user" ? "none" : `1px solid ${BORD}`,
                  borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  padding:"13px 17px", fontSize:14, lineHeight:1.75, whiteSpace:"pre-wrap",
                  boxShadow: m.role !== "user" ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
                }}>
                  {m.streaming
                    ? <span>{m.text || ""}<span style={{ display:"inline-block", width:7, height:14, background:currentTool.color, borderRadius:2, marginLeft:2, animation:"blink 0.9s steps(2,start) infinite", verticalAlign:"middle" }}/></span>
                    : m.text
                  }
                </div>
                {m.role === "assistant" && !m.streaming && m.text && (
                  <button onClick={() => navigator.clipboard?.writeText(m.text)}
                    style={{ background:"none", border:"none", color:"#ccc", cursor:"pointer", fontSize:11, padding:"2px 6px", marginLeft:4, fontFamily:"inherit", transition:"color 0.13s" }}
                    onMouseEnter={e=>e.currentTarget.style.color=MUTED}
                    onMouseLeave={e=>e.currentTarget.style.color="#ccc"}>
                    Copy
                  </button>
                )}
              </div>
            ))}

            {busy && (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-start", gap:5 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginLeft:2 }}>
                  <div style={{ width:20, height:20, borderRadius:6, background:`${currentTool.color}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:currentTool.color }}>{currentTool.icon}</div>
                  <span style={{ fontSize:10.5, fontWeight:700, color:currentTool.color, textTransform:"uppercase", letterSpacing:"0.06em" }}>{currentTool.label}</span>
                </div>
                <div style={{ background:CARD, border:`1px solid ${BORD}`, borderRadius:"18px 18px 18px 4px", padding:"13px 17px", boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
                  <div style={{ display:"flex", gap:5, alignItems:"center" }}>
                    {[0,1,2].map(i => <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:currentTool.color, opacity:0.5, animation:`bounce 1.2s ${i*0.2}s infinite` }} />)}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ borderTop:`1px solid ${BORD}`, padding:"14px 40px 20px", flexShrink:0, background:CARD }}>
            <div style={{ display:"flex", gap:10, background:BG, border:`1.5px solid ${BORD}`, borderRadius:14, padding:"10px 12px 10px 18px", maxWidth:860, margin:"0 auto", transition:"border 0.15s" }}
              onFocusCapture={e => e.currentTarget.style.borderColor = `${currentTool.color}60`}
              onBlurCapture={e => e.currentTarget.style.borderColor = BORD}>
              <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) { e.preventDefault(); sendMsg(); } }}
                placeholder={`Ask ${currentTool.label}…`}
                rows={1}
                style={{ flex:1, border:"none", background:"transparent", color:TEXT, fontSize:13.5, fontFamily:"inherit", resize:"none", outline:"none", lineHeight:1.6, minHeight:44, maxHeight:140 }}
                onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px"; }}
              />
              <button onClick={() => sendMsg()} disabled={busy || !input.trim()}
                style={{ padding:"10px 22px", background: (busy || !input.trim()) ? `${PINK}50` : PINK, color:"#fff", border:"none", borderRadius:10, fontSize:13, fontWeight:700, cursor: (busy || !input.trim()) ? "not-allowed" : "pointer", fontFamily:"inherit", alignSelf:"flex-end", flexShrink:0, transition:"background 0.15s" }}>
                Send
              </button>
            </div>
            <div style={{ display:"flex", justifyContent:"center", marginTop:7 }}>
              <span style={{ fontSize:10.5, color:"#ccc" }}>Enter to send · Shift+Enter for new line · Business Workforce AI</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}