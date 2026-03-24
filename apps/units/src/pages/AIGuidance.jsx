import React, { useState, useRef, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { miniChat } from "../lib/apiClient";

const PINK  = "#e8185d";
const TEXT  = "#111827";
const MUTED = "#6b7280";
const LIGHT = "#f8f9fb";
const CARD  = "#ffffff";
const BORDER= "#e8eaed";

const QUICK = [
  "How do I create a content strategy for my brand?",
  "What type of videos work best on Instagram Reels?",
  "Give me a 30-day content calendar idea",
  "How do I write a brand story script?",
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
  const [sessLoad,    setSessLoad]    = useState(true);
  const bottomRef  = useRef(null);
  const saveTimer  = useRef(null);

  useEffect(() => {
    if (!profile?.id) { setSessLoad(false); return; }
    supabase.from("units_guidance_sessions")
      .select("id,title,updated_at").eq("user_id",profile.id)
      .order("updated_at",{ascending:false}).limit(20)
      .then(({data}) => { setSessions(data||[]); setSessLoad(false); });
  }, [profile?.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages]);

  const saveSession = async (msgs) => {
    if (!profile?.id || msgs.length < 2) return;
    const title = msgs.find(m=>m.role==="user")?.text?.slice(0,55) || "AI Guidance";
    if (activeId) {
      await supabase.from("units_guidance_sessions")
        .update({messages:msgs, title, updated_at:new Date().toISOString()}).eq("id",activeId);
      setSessions(ss=>ss.map(s=>s.id===activeId?{...s,title,updated_at:new Date().toISOString()}:s));
    } else {
      const {data} = await supabase.from("units_guidance_sessions")
        .insert({user_id:profile.id, title, topic:"", messages:msgs})
        .select("id,title,updated_at").single();
      if (data) { setActiveId(data.id); setSessions(ss=>[data,...ss]); }
    }
  };

  const loadSession = async (id) => {
    const {data} = await supabase.from("units_guidance_sessions").select("*").eq("id",id).single();
    if (data) { setActiveId(data.id); setMessages(Array.isArray(data.messages)?data.messages:[{role:"assistant",text:WELCOME}]); setHandoff(false); }
  };

  const newSession = () => { setActiveId(null); setMessages([{role:"assistant",text:WELCOME}]); setHandoff(false); setInput(""); };

  const deleteSession = async (id, e) => {
    e.stopPropagation();
    await supabase.from("units_guidance_sessions").delete().eq("id",id);
    setSessions(ss=>ss.filter(s=>s.id!==id));
    if (activeId===id) newSession();
  };

  const send = async (text) => {
    const msg = text||input.trim();
    if (!msg||loading) return;
    setInput("");
    const newMsgs = [...messages, {role:"user",text:msg}];
    setMessages(newMsgs); setLoading(true);
    try {
      const ctx = messages.slice(-6).map(m=>m.role==="user"?`User: ${m.text}`:`Guide: ${m.text}`).join("\n");
      const data = await miniChat(
        `You are a professional content creation strategist at NuGens Units. Help with content strategy, video production, scripting, brand storytelling. Be specific and actionable for Indian and global markets.\n\nContext:\n${ctx}\n\nQuestion: ${msg}`,
        "units", profile?.user_type||"business"
      );
      const reply = data?.reply||data?.message||"Let me connect you with our team.";
      const needsTeam = reply.length<60||reply.toLowerCase().includes("i don't know");
      const final = [...newMsgs, {role:"assistant",text:reply,showHandoff:needsTeam}];
      setMessages(final);
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(()=>saveSession(final), 1000);
    } catch(e) {
      const final = [...newMsgs, {role:"assistant",text:e.message?.includes("401")?"Session expired. Refresh.":"Connecting error. Try again.",showHandoff:true}];
      setMessages(final); saveSession(final);
    }
    setLoading(false);
  };

  const requestHandoff = () => {
    setHandoff(true);
    const final = [...messages, {role:"system",text:"✓ Our content team has been notified. They'll reach out within 2 business hours at hello@nugens.in"}];
    setMessages(final); saveSession(final);
  };

  const ago = (ts) => {
    const s=Math.floor((Date.now()-new Date(ts))/1000);
    if(s<3600) return `${Math.floor(s/60)}m ago`;
    if(s<86400) return `${Math.floor(s/3600)}h ago`;
    return `${Math.floor(s/86400)}d ago`;
  };

  const msgStyle = (role) => ({
    maxWidth:"80%", alignSelf:role==="user"?"flex-end":"flex-start",
    background:role==="user"?PINK:role==="system"?"#f0fdf4":CARD,
    color:role==="user"?"#fff":TEXT,
    border:role==="user"?"none":role==="system"?"1px solid #bbf7d0":`1px solid ${BORDER}`,
    borderRadius:role==="user"?"16px 16px 3px 16px":"16px 16px 16px 3px",
    padding:"11px 14px", fontSize:13.5, lineHeight:1.7, whiteSpace:"pre-wrap",
    boxShadow:role!=="user"?"0 1px 3px rgba(0,0,0,0.05)":"none",
  });

  return (
    <div style={{height:"100vh",display:"flex",flexDirection:"column",fontFamily:"'Plus Jakarta Sans',sans-serif",overflow:"hidden"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'); .ss:hover{background:#fef2f2!important} .tc:hover{border-color:${PINK}40!important} @keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}`}</style>

      {/* Top bar */}
      <div style={{background:CARD,borderBottom:`1px solid ${BORDER}`,padding:"12px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div>
          <div style={{fontSize:18,fontWeight:800,color:TEXT,letterSpacing:"-0.03em"}}>✦ AI Content Guidance</div>
          <div style={{fontSize:11,color:MUTED,marginTop:1}}>Expert content strategy — AI-powered, team backup when needed</div>
        </div>
        <button onClick={newSession} style={{padding:"7px 14px",background:`${PINK}10`,border:`1px solid ${PINK}25`,borderRadius:8,color:PINK,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
          + New Session
        </button>
      </div>

      {/* Main grid */}
      <div style={{flex:1,display:"grid",gridTemplateColumns:"200px 1fr 240px",overflow:"hidden",minHeight:0}}>

        {/* Left: Sessions */}
        <div style={{borderRight:`1px solid ${BORDER}`,background:CARD,overflowY:"auto",padding:"12px 10px"}}>
          <div style={{fontSize:10,fontWeight:700,color:MUTED,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10,paddingLeft:4}}>Past Sessions</div>
          {sessLoad&&<div style={{fontSize:12,color:MUTED,paddingLeft:4}}>Loading…</div>}
          {!sessLoad&&sessions.length===0&&(
            <div style={{fontSize:11,color:MUTED,paddingLeft:4,lineHeight:1.6}}>No sessions yet. Start chatting — saved automatically.</div>
          )}
          {sessions.map(s=>(
            <div key={s.id} className="ss" onClick={()=>loadSession(s.id)}
              style={{padding:"8px 9px",borderRadius:8,cursor:"pointer",marginBottom:3,
                background:activeId===s.id?`${PINK}08`:"transparent",
                border:`1px solid ${activeId===s.id?`${PINK}25`:"transparent"}`,
                position:"relative",transition:"background 0.12s"}}>
              <div style={{fontSize:11.5,fontWeight:activeId===s.id?700:500,color:activeId===s.id?PINK:TEXT,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",paddingRight:16}}>
                {s.title}
              </div>
              <div style={{fontSize:10,color:MUTED,marginTop:1}}>{ago(s.updated_at)}</div>
              <button onClick={(e)=>deleteSession(s.id,e)} title="Delete"
                style={{position:"absolute",top:7,right:6,background:"none",border:"none",color:"#ccc",cursor:"pointer",fontSize:11,lineHeight:1}}>✕</button>
            </div>
          ))}
        </div>

        {/* Center: Chat */}
        <div style={{display:"flex",flexDirection:"column",overflow:"hidden",minHeight:0}}>

          {/* Messages */}
          <div style={{flex:1,overflowY:"auto",padding:"20px 28px",display:"flex",flexDirection:"column",gap:14}}>
            {messages.map((m,i)=>(
              <div key={i} style={{display:"flex",flexDirection:"column",gap:5,alignItems:m.role==="user"?"flex-end":"flex-start"}}>
                {m.role!=="user"&&(
                  <div style={{fontSize:9.5,fontWeight:700,color:m.role==="system"?"#16a34a":PINK,letterSpacing:"0.07em",textTransform:"uppercase",marginLeft:3}}>
                    {m.role==="system"?"🤝 NuGens Team":"✦ AI Guide"}
                  </div>
                )}
                <div style={msgStyle(m.role)}>{m.text}</div>
                {m.showHandoff&&!handoff&&(
                  <button onClick={requestHandoff}
                    style={{alignSelf:"flex-start",background:"none",border:`1px solid ${PINK}`,color:PINK,borderRadius:7,padding:"5px 12px",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                    🤝 Connect with the team
                  </button>
                )}
              </div>
            ))}
            {loading&&(
              <div style={{alignSelf:"flex-start",display:"flex",flexDirection:"column",gap:5}}>
                <div style={{fontSize:9.5,fontWeight:700,color:PINK,letterSpacing:"0.07em",textTransform:"uppercase",marginLeft:3}}>✦ AI Guide</div>
                <div style={{...msgStyle("assistant"),padding:"10px 14px"}}>
                  <div style={{display:"flex",gap:4,alignItems:"center"}}>
                    {[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:PINK,opacity:0.5,animation:`bounce 1.2s ${i*0.2}s infinite`}}/>)}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Quick prompts */}
          <div style={{borderTop:`1px solid ${BORDER}`,padding:"8px 28px",display:"flex",gap:6,flexWrap:"wrap",background:CARD}}>
            {QUICK.map(q=>(
              <button key={q} onClick={()=>send(q)}
                style={{background:LIGHT,border:`1px solid ${BORDER}`,borderRadius:20,padding:"4px 11px",fontSize:10.5,color:MUTED,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
                {q.length>42?q.slice(0,40)+"…":q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{borderTop:`1px solid ${BORDER}`,padding:"12px 28px 16px",background:CARD}}>
            <div style={{display:"flex",gap:8,background:LIGHT,border:`1.5px solid ${BORDER}`,borderRadius:12,padding:"8px 10px 8px 14px"}}
              onFocusCapture={e=>{e.currentTarget.style.borderColor=`${PINK}60`;}}
              onBlurCapture={e=>{e.currentTarget.style.borderColor=BORDER;}}>
              <textarea value={input} onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
                placeholder="Ask anything about content creation, strategy, scripting, or brand building…"
                style={{flex:1,border:"none",background:"transparent",fontSize:13,color:TEXT,fontFamily:"inherit",resize:"none",minHeight:40,maxHeight:100,outline:"none",lineHeight:1.6}}/>
              <button onClick={()=>send()} disabled={loading||!input.trim()}
                style={{padding:"8px 18px",background:(loading||!input.trim())?`${PINK}50`:PINK,color:"#fff",border:"none",borderRadius:9,fontSize:13,fontWeight:700,cursor:(loading||!input.trim())?"not-allowed":"pointer",fontFamily:"inherit",alignSelf:"flex-end"}}>
                Send
              </button>
            </div>
            <div style={{fontSize:10,color:MUTED,marginTop:5}}>Enter to send · Shift+Enter for new line · Auto-saved to your account</div>
          </div>
        </div>

        {/* Right: Topics + Team */}
        <div style={{borderLeft:`1px solid ${BORDER}`,background:CARD,overflowY:"auto",padding:"16px 14px"}}>
          <div style={{fontSize:12,fontWeight:700,color:TEXT,marginBottom:12}}>Content Topics</div>
          {TOPICS.map(t=>(
            <div key={t.label} className="tc" onClick={()=>send(t.prompt)}
              style={{background:LIGHT,border:`1px solid ${BORDER}`,borderRadius:10,padding:"10px 12px",marginBottom:8,cursor:"pointer",display:"flex",gap:10,alignItems:"center",transition:"border-color 0.13s"}}>
              <div style={{width:32,height:32,borderRadius:8,background:`${PINK}10`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{t.icon}</div>
              <div>
                <div style={{fontSize:12,fontWeight:600,color:TEXT}}>{t.label}</div>
                <div style={{fontSize:10,color:MUTED}}>Click to explore</div>
              </div>
            </div>
          ))}
          <div style={{background:"#fef2f2",border:`1px solid ${PINK}20`,borderRadius:11,padding:14,marginTop:8}}>
            <div style={{fontSize:12,fontWeight:700,color:TEXT,marginBottom:5}}>Talk to our team</div>
            <div style={{fontSize:11,color:MUTED,marginBottom:10,lineHeight:1.55}}>If AI can't answer, our creative team steps in. Always free.</div>
            {!handoff?(
              <button onClick={requestHandoff}
                style={{width:"100%",padding:"8px 0",background:PINK,color:"#fff",border:"none",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                🤝 Connect with our team
              </button>
            ):(
              <div style={{fontSize:11,color:"#16a34a",fontWeight:600}}>✓ Team notified — within 2 hours</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}