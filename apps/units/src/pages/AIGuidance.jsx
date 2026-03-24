import React, { useState, useRef, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { miniChat } from "../lib/apiClient";

const PINK  = "#e8185d";
const TEXT  = "#111827";
const MUTED = "#6b7280";
const LIGHT = "#f8f9fb";
const CARD  = "#ffffff";
const BORDER= "#e8eaed";

const QUICK_PROMPTS = [
  "How do I create a content strategy for my brand?",
  "What type of videos work best on Instagram Reels?",
  "Give me a 30-day content calendar idea",
  "How do I write a brand story script?",
  "What makes a good brand video hook?",
  "How do I measure ROI on content creation?",
  "Suggest posting frequency for a new brand",
  "What's trending in brand content right now?",
];

const TOPICS = [
  { icon:"🎬", label:"Video Strategy",    prompt:"Give me a complete video content strategy for a brand wanting to grow on Instagram and YouTube." },
  { icon:"✍️", label:"Scripting",          prompt:"Teach me how to write compelling scripts for brand videos and reels." },
  { icon:"📸", label:"Visual Identity",    prompt:"How do I maintain visual consistency across all my brand's content?" },
  { icon:"📣", label:"Campaign Planning",  prompt:"Walk me through planning a full content campaign for a product launch." },
  { icon:"📊", label:"Analytics & Growth", prompt:"How do I use analytics to improve my content creation strategy?" },
  { icon:"🎯", label:"Target Audience",    prompt:"How do I identify and create content specifically for my target audience?" },
];

const WELCOME = "Hi! I'm your AI content creation guide. I can help you with video strategy, scripting, campaign planning, visual identity, and growing your brand through content.\n\nWhat would you like to work on today?";

export default function AIGuidance({ profile }) {
  const [sessions,    setSessions]    = useState([]);
  const [activeId,    setActiveId]    = useState(null);
  const [messages,    setMessages]    = useState([{ role:"assistant", text:WELCOME }]);
  const [input,       setInput]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [handoff,     setHandoff]     = useState(false);
  const [sessLoading, setSessLoading] = useState(true);
  const [saving,      setSaving]      = useState(false);
  const bottomRef = useRef(null);
  const saveTimer = useRef(null);

  // Load past sessions
  useEffect(() => {
    if (!profile?.id) { setSessLoading(false); return; }
    supabase.from("units_guidance_sessions")
      .select("id, title, topic, updated_at")
      .eq("user_id", profile.id)
      .order("updated_at", { ascending: false })
      .limit(20)
      .then(({ data }) => { setSessions(data || []); setSessLoading(false); });
  }, [profile?.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  // Auto-save current conversation after each AI reply
  const saveSession = async (msgs) => {
    if (!profile?.id || msgs.length < 2) return;
    const title = msgs.find(m=>m.role==="user")?.text?.slice(0,60) || "AI Guidance Session";
    const topic = msgs.find(m=>m.role==="user")?.text?.slice(0,30) || "";

    if (activeId) {
      // Update existing
      const { error } = await supabase.from("units_guidance_sessions")
        .update({ messages: msgs, title, updated_at: new Date().toISOString() })
        .eq("id", activeId);
      if (!error) setSessions(ss => ss.map(s => s.id===activeId ? { ...s, title, updated_at:new Date().toISOString() } : s));
    } else {
      // Create new
      const { data } = await supabase.from("units_guidance_sessions")
        .insert({ user_id:profile.id, title, topic, messages: msgs })
        .select("id, title, topic, updated_at")
        .single();
      if (data) { setActiveId(data.id); setSessions(ss => [data, ...ss]); }
    }
  };

  const loadSession = async (id) => {
    const { data } = await supabase.from("units_guidance_sessions")
      .select("*").eq("id", id).single();
    if (data) {
      setActiveId(data.id);
      setMessages(Array.isArray(data.messages) ? data.messages : [{ role:"assistant", text:WELCOME }]);
      setHandoff(false);
    }
  };

  const newSession = () => {
    setActiveId(null);
    setMessages([{ role:"assistant", text:WELCOME }]);
    setHandoff(false);
    setInput("");
  };

  const deleteSession = async (id, e) => {
    e.stopPropagation();
    await supabase.from("units_guidance_sessions").delete().eq("id", id);
    setSessions(ss => ss.filter(s => s.id !== id));
    if (activeId === id) newSession();
  };

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    const newMsgs = [...messages, { role:"user", text:msg }];
    setMessages(newMsgs);
    setLoading(true);

    try {
      const context = messages.slice(-6).map(m => m.role==="user" ? `User: ${m.text}` : `Guide: ${m.text}`).join("\n");
      const data = await miniChat(
        `You are a professional content creation strategist and creative director at NuGens Units. Help business owners with content strategy, video production, scripting, brand storytelling, and creative direction. Be specific, actionable, enthusiastic. Always give practical advice relevant to Indian and global markets.\n\nContext:\n${context}\n\nQuestion: ${msg}`,
        "units",
        profile?.user_type || "business"
      );
      const reply = data?.reply || data?.message || "Let me connect you with our team for more specialised guidance on that.";
      const needsTeam = reply.length < 60 || reply.toLowerCase().includes("i don't know") || reply.toLowerCase().includes("can't help");
      const finalMsgs = [...newMsgs, { role:"assistant", text:reply, showHandoff:needsTeam }];
      setMessages(finalMsgs);
      // Debounced save
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => saveSession(finalMsgs), 1000);
    } catch(e) {
      const errMsg = e.message?.includes("401") ? "Session expired. Please refresh." : "Having trouble connecting. Let me connect you with our team.";
      const finalMsgs = [...newMsgs, { role:"assistant", text:errMsg, showHandoff:true }];
      setMessages(finalMsgs);
      saveSession(finalMsgs);
    }
    setLoading(false);
  };

  const requestHandoff = () => {
    setHandoff(true);
    const finalMsgs = [...messages, { role:"system", text:"✓ Our content team has been notified. They'll reach out via email within 2 business hours. You can also reach us at hello@nugens.in" }];
    setMessages(finalMsgs);
    saveSession(finalMsgs);
  };

  function timeAgo(ts) {
    const s = Math.floor((Date.now()-new Date(ts))/1000);
    if (s<3600) return `${Math.floor(s/60)}m ago`;
    if (s<86400) return `${Math.floor(s/3600)}h ago`;
    return `${Math.floor(s/86400)}d ago`;
  }

  const msg = (role) => ({
    maxWidth:"78%", alignSelf:role==="user"?"flex-end":"flex-start",
    background:role==="user"?PINK:role==="system"?"#f0fdf4":CARD,
    color:role==="user"?"#fff":TEXT,
    border:role==="user"?"none":role==="system"?"1px solid #bbf7d0":`1px solid ${BORDER}`,
    borderRadius:role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",
    padding:"13px 16px", fontSize:14, lineHeight:1.75, whiteSpace:"pre-wrap",
    boxShadow:role!=="user"?"0 1px 3px rgba(0,0,0,0.04)":"none",
    fontFamily:"'Plus Jakarta Sans',sans-serif",
  });

  return (
    <div style={{ minHeight:"100vh", background:LIGHT, fontFamily:"'Plus Jakarta Sans',sans-serif", display:"flex", flexDirection:"column" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'); .sess-item:hover{background:#fef2f2!important} .topic-card:hover{border-color:${PINK}40!important;background:#fef9fb!important}`}</style>

      {/* ── Top bar ── */}
      <div style={{ background:CARD, borderBottom:`1px solid ${BORDER}`, padding:"16px 32px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, color:TEXT, letterSpacing:"-0.03em" }}>✦ AI Content Guidance</div>
          <div style={{ fontSize:12, color:MUTED, marginTop:2 }}>Expert content strategy — AI-powered, team backup when you need it</div>
        </div>
        <button onClick={newSession}
          style={{ padding:"9px 18px", background:`${PINK}10`, border:`1px solid ${PINK}30`, borderRadius:9, color:PINK, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
          + New Session
        </button>
      </div>

      {/* ── Three-column layout ── */}
      <div style={{ flex:1, display:"grid", gridTemplateColumns:"220px 1fr 260px", overflow:"hidden" }}>

        {/* ── Left: Session history ── */}
        <div style={{ borderRight:`1px solid ${BORDER}`, background:CARD, overflow:"auto", padding:"16px 12px" }}>
          <div style={{ fontSize:11, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12, paddingLeft:4 }}>
            Past Sessions
          </div>
          {sessLoading && <div style={{ fontSize:12, color:MUTED, paddingLeft:4 }}>Loading…</div>}
          {!sessLoading && sessions.length===0 && (
            <div style={{ fontSize:12, color:MUTED, paddingLeft:4, lineHeight:1.6 }}>No sessions yet. Start chatting — your conversations are saved automatically.</div>
          )}
          {sessions.map(s => (
            <div key={s.id} className="sess-item"
              onClick={() => loadSession(s.id)}
              style={{ padding:"9px 10px", borderRadius:9, cursor:"pointer", marginBottom:4,
                background:activeId===s.id?`${PINK}08`:"transparent",
                border:`1px solid ${activeId===s.id?`${PINK}25`:"transparent"}`,
                position:"relative", transition:"all 0.12s" }}>
              <div style={{ fontSize:12, fontWeight:activeId===s.id?700:500, color:activeId===s.id?PINK:TEXT, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:18 }}>
                {s.title}
              </div>
              <div style={{ fontSize:10, color:MUTED, marginTop:2 }}>{timeAgo(s.updated_at)}</div>
              <button onClick={(e)=>deleteSession(s.id,e)} title="Delete"
                style={{ position:"absolute", top:8, right:8, background:"none", border:"none", color:"#ddd", cursor:"pointer", fontSize:12, lineHeight:1 }}>✕</button>
            </div>
          ))}
        </div>

        {/* ── Center: Chat ── */}
        <div style={{ display:"flex", flexDirection:"column", overflow:"hidden" }}>

          {/* Messages */}
          <div style={{ flex:1, overflowY:"auto", padding:"24px 32px", display:"flex", flexDirection:"column", gap:16 }}>
            {messages.map((m,i) => (
              <div key={i} style={{ display:"flex", flexDirection:"column", gap:6, alignItems:m.role==="user"?"flex-end":"flex-start" }}>
                {m.role!=="user" && (
                  <div style={{ fontSize:10, fontWeight:700, color:m.role==="system"?"#16a34a":PINK, letterSpacing:"0.06em", textTransform:"uppercase", marginLeft:4 }}>
                    {m.role==="system"?"🤝 NuGens Team":"✦ AI Guide"}
                  </div>
                )}
                <div style={msg(m.role)}>{m.text}</div>
                {m.showHandoff && !handoff && (
                  <button onClick={requestHandoff}
                    style={{ alignSelf:"flex-start", background:"none", border:`1px solid ${PINK}`, color:PINK, borderRadius:8, padding:"6px 14px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit", marginTop:2 }}>
                    🤝 Connect me with the team
                  </button>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf:"flex-start", display:"flex", flexDirection:"column", gap:6 }}>
                <div style={{ fontSize:10, fontWeight:700, color:PINK, letterSpacing:"0.06em", textTransform:"uppercase", marginLeft:4 }}>✦ AI GUIDE</div>
                <div style={{ ...msg("assistant"), padding:"12px 16px" }}>
                  <div style={{ display:"flex", gap:5, alignItems:"center" }}>
                    {[0,1,2].map(i=><div key={i} style={{ width:6,height:6,borderRadius:"50%",background:PINK,opacity:0.5,animation:`bounce 1.2s ${i*0.2}s infinite` }}/>)}
                    <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}`}</style>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Quick prompts */}
          <div style={{ borderTop:`1px solid ${BORDER}`, padding:"10px 32px", display:"flex", gap:7, flexWrap:"wrap", background:CARD }}>
            {QUICK_PROMPTS.slice(0,4).map(q=>(
              <button key={q} onClick={()=>send(q)}
                style={{ background:LIGHT, border:`1px solid ${BORDER}`, borderRadius:20, padding:"5px 12px", fontSize:11, color:MUTED, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
                {q.length>40?q.slice(0,38)+"…":q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{ borderTop:`1px solid ${BORDER}`, padding:"14px 32px 20px", background:CARD }}>
            <div style={{ display:"flex", gap:10, background:LIGHT, border:`1.5px solid ${BORDER}`, borderRadius:14, padding:"10px 12px 10px 16px",
              transition:"border 0.15s" }}
              onFocusCapture={e=>{e.currentTarget.style.borderColor=`${PINK}50`;}}
              onBlurCapture={e=>{e.currentTarget.style.borderColor=BORDER;}}>
              <textarea value={input} onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();} }}
                placeholder="Ask anything about content creation, strategy, scripting, or brand building…"
                style={{ flex:1, border:"none", background:"transparent", fontSize:13.5, color:TEXT, fontFamily:"inherit", resize:"none", minHeight:46, maxHeight:120, outline:"none", lineHeight:1.6 }}/>
              <button onClick={()=>send()} disabled={loading||!input.trim()}
                style={{ padding:"10px 20px", background:(loading||!input.trim())?`${PINK}50`:PINK, color:"#fff", border:"none", borderRadius:10, fontSize:13, fontWeight:700, cursor:(loading||!input.trim())?"not-allowed":"pointer", fontFamily:"inherit", alignSelf:"flex-end", transition:"background 0.15s" }}>
                Send
              </button>
            </div>
            <div style={{ fontSize:11, color:MUTED, marginTop:6 }}>Enter to send · Shift+Enter for new line · Auto-saved to your account</div>
          </div>
        </div>

        {/* ── Right: Topics + Team ── */}
        <div style={{ borderLeft:`1px solid ${BORDER}`, background:CARD, overflow:"auto", padding:"20px 16px" }}>
          <div style={{ fontSize:12, fontWeight:700, color:TEXT, marginBottom:14 }}>Content Topics</div>
          {TOPICS.map(t => (
            <div key={t.label} className="topic-card" onClick={()=>send(t.prompt)}
              style={{ background:LIGHT, border:`1px solid ${BORDER}`, borderRadius:11, padding:"12px 14px", marginBottom:10, cursor:"pointer", display:"flex", gap:11, alignItems:"center", transition:"all 0.13s" }}>
              <div style={{ width:36, height:36, borderRadius:10, background:`${PINK}10`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{t.icon}</div>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:TEXT }}>{t.label}</div>
                <div style={{ fontSize:10, color:MUTED, marginTop:1 }}>Click to explore</div>
              </div>
            </div>
          ))}

          {/* Team connect */}
          <div style={{ background:"#fef2f2", border:`1px solid ${PINK}20`, borderRadius:12, padding:16, marginTop:6 }}>
            <div style={{ fontSize:13, fontWeight:700, color:TEXT, marginBottom:6 }}>Talk to our team</div>
            <div style={{ fontSize:12, color:MUTED, marginBottom:12, lineHeight:1.6 }}>
              If AI can't answer your question, our creative team steps in. Always free for guidance.
            </div>
            {!handoff ? (
              <button onClick={requestHandoff}
                style={{ width:"100%", padding:"9px 0", background:PINK, color:"#fff", border:"none", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                🤝 Connect with our team
              </button>
            ) : (
              <div style={{ fontSize:12, color:"#16a34a", fontWeight:600 }}>✓ Team notified — response within 2 hours</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}