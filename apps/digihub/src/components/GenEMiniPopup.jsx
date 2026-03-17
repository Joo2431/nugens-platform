import React, { useState, useRef, useEffect } from "react";
import { supabase } from "../lib/supabase";

const BACKEND = "https://nugens-platform.onrender.com";

// Per-product config
const PRODUCT_CONFIG = {
  nugens:  { color:"#e8185d", label:"NuGens",           icon:"✦", bg:"#09090a" },
  hyperx:  { color:"#e8185d", label:"HyperX",           icon:"⬡", bg:"#09090a" },
  digihub: { color:"#0284c7", label:"DigiHub",          icon:"◈", bg:"#06101a" },
  units:   { color:"#d4a843", label:"The Wedding Unit", icon:"◇", bg:"#0a0805" },
  gene:    { color:"#7c3aed", label:"Gen-E",            icon:"◎", bg:"#09090a" },
};

// Quick prompts per user type per product
const QUICK_PROMPTS = {
  individual: {
    nugens:  ["How do I choose the right product?", "What's included in free plan?", "How does Gen-E help my career?", "Tell me about HyperX courses"],
    hyperx:  ["Best courses to get promoted?", "How to negotiate salary?", "What skills should I learn?", "How do learning paths work?"],
    digihub: ["How to build my personal brand?", "Best LinkedIn strategy for job seekers", "What is the DigiHub talent network?", "How to grow my online presence?"],
    units:   ["What photography services are available?", "How do I book a shoot?", "What's included in wedding packages?", "How does the production process work?"],
  },
  business: {
    nugens:  ["What's the business plan?", "How can HyperX train my team?", "How does DigiHub help my brand?", "What production services are available?"],
    hyperx:  ["How to train my team with HyperX?", "Can I get bulk licenses?", "What business skills courses are available?", "How do I track team progress?"],
    digihub: ["How to grow my brand with DigiHub?", "How do I find talent for my business?", "What marketing tools are available?", "How does content planning work?"],
    units:   ["Do you handle corporate events?", "What's included in brand content packages?", "How do I book a team for an event?", "What's the turnaround time?"],
  },
};

export default function GenEMiniPopup({ product = "nugens" }) {
  const cfg     = PRODUCT_CONFIG[product] || PRODUCT_CONFIG.nugens;
  const ACCENT  = cfg.color;
  const B       = "#1e1e1e";

  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [unread,   setUnread]   = useState(0);
  const [profile,  setProfile]  = useState(null);
  const [token,    setToken]    = useState(null);
  const bottomRef   = useRef(null);

  // Load user profile + token on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      setToken(session.access_token);
      supabase.from("profiles").select("user_type,goal,business_need,full_name,plan")
        .eq("id", session.user.id).single()
        .then(({ data }) => {
          setProfile(data);
          // Personalized greeting based on user type
          const name   = (data?.full_name || "").split(" ")[0] || "there";
          const uType  = data?.user_type || "individual";
          const greet  = uType === "business"
            ? `Hi ${name}! I'm GEN-E Mini — your ${cfg.label} assistant. Ask me about ${product === "hyperx" ? "team training, courses and skills" : product === "digihub" ? "brand growth, marketing and talent" : product === "units" ? "event production and bookings" : "NuGens products and business tools"}.`
            : `Hi ${name}! I'm GEN-E Mini — your ${cfg.label} assistant. Ask me about ${product === "hyperx" ? "courses, career skills and learning paths" : product === "digihub" ? "personal branding and career tools" : product === "units" ? "photography and production services" : "NuGens products and your career"}.`;
          setMessages([{ role:"assistant", content: greet }]);
        });
    });
  }, []);

  useEffect(() => {
    if (open) { setUnread(0); setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:"smooth" }), 50); }
  }, [open, messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading || !token) return;
    setInput("");
    const next = [...messages, { role:"user", content:msg }];
    setMessages(next);
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND}/api/mini-chat`, {
        method: "POST",
        headers: { "Content-Type":"application/json", "Authorization":`Bearer ${token}` },
        body: JSON.stringify({
          message: msg,
          history: messages,
          product,
          userType:    profile?.user_type    || "individual",
          goal:        profile?.goal         || null,
          businessNeed:profile?.business_need|| null,
        }),
      });
      const data = await res.json();
      const reply = data.reply || "Sorry, couldn't get a response.";
      setMessages(p => [...p, { role:"assistant", content:reply }]);
      if (!open) setUnread(u => u + 1);
    } catch {
      setMessages(p => [...p, { role:"assistant", content:"Connection error. Please try again." }]);
    }
    setLoading(false);
  };

  const userType = profile?.user_type || "individual";
  const prompts  = (QUICK_PROMPTS[userType] || QUICK_PROMPTS.individual)[product] || QUICK_PROMPTS.individual.nugens;

  if (!token) return null; // Only show when logged in

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes gm-in{from{opacity:0;transform:scale(0.92) translateY(12px)}to{opacity:1;transform:none}}
        @keyframes gm-dot{0%,80%,100%{opacity:0.3;transform:scale(0.8)}40%{opacity:1;transform:scale(1)}}
        .gm-dot{width:5px;height:5px;border-radius:50%;background:${ACCENT};display:inline-block;animation:gm-dot 1.2s ease-in-out infinite}
        .gm-user{padding:10px 14px;border-radius:12px 12px 4px 12px;font-size:13px;line-height:1.65;max-width:240px;background:${ACCENT}22;border:1px solid ${ACCENT}35;color:#e0e0e0;margin-left:auto;white-space:pre-wrap;font-family:'Plus Jakarta Sans',sans-serif}
        .gm-ai{padding:10px 14px;border-radius:4px 12px 12px 12px;font-size:13px;line-height:1.65;max-width:245px;background:#1a1a1a;border:1px solid ${B};color:#ccc;white-space:pre-wrap;font-family:'Plus Jakarta Sans',sans-serif}
        .gm-quick{padding:5px 10px;background:#1a1a1a;border:1px solid ${B};border-radius:7px;color:#666;font-size:11px;cursor:pointer;text-align:left;transition:all 0.13s;font-family:'Plus Jakarta Sans',sans-serif;line-height:1.4}
        .gm-quick:hover{border-color:${ACCENT}50;color:#ccc}
        .gm-ta{width:100%;background:transparent;border:none;color:#fff;font-size:13px;font-family:'Plus Jakarta Sans',sans-serif;resize:none;outline:none;line-height:1.55;max-height:80px}
        .gm-ta::placeholder{color:#444}
        .gm-badge{position:absolute;top:-2px;right:-2px;width:16px;height:16px;border-radius:50%;background:${ACCENT};color:#fff;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center}
      `}</style>

      <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
        {open && (
          <div style={{position:"absolute",bottom:62,right:0,width:308,height:460,background:"#111",border:`1px solid ${B}`,borderRadius:18,boxShadow:"0 24px 64px rgba(0,0,0,0.7)",display:"flex",flexDirection:"column",animation:"gm-in 0.2s ease",overflow:"hidden"}}>

            {/* Header */}
            <div style={{background:"#0a0a0a",borderBottom:`1px solid ${B}`,padding:"11px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
              <div style={{display:"flex",alignItems:"center",gap:9}}>
                <div style={{width:30,height:30,borderRadius:"50%",background:`${ACCENT}20`,border:`1.5px solid ${ACCENT}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:ACCENT}}>{cfg.icon}</div>
                <div>
                  <div style={{fontSize:13,fontWeight:800,color:"#fff",letterSpacing:"-0.02em",lineHeight:1.1}}>
                    GEN-E Mini
                    <span style={{fontSize:9.5,fontWeight:600,color:ACCENT,background:`${ACCENT}18`,padding:"1px 6px",borderRadius:4,marginLeft:5,verticalAlign:"middle"}}>{cfg.label}</span>
                  </div>
                  <div style={{fontSize:10,color:"#444",marginTop:1}}>
                    {userType === "business" ? "Business AI · NuGens" : "Career AI · NuGens"}
                  </div>
                </div>
              </div>
              <button onClick={()=>setOpen(false)} style={{background:"none",border:"none",cursor:"pointer",color:"#444",fontSize:16,lineHeight:1,padding:4}}>✕</button>
            </div>

            {/* Messages */}
            <div style={{flex:1,overflowY:"auto",padding:"12px 12px 8px",display:"flex",flexDirection:"column",gap:10}}>
              {messages.length <= 1 && (
                <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:4}}>
                  {prompts.map(p=>(
                    <button key={p} className="gm-quick" onClick={()=>send(p)}>{p}</button>
                  ))}
                </div>
              )}
              {messages.map((m,i)=>(
                <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",alignItems:"flex-end",gap:6}}>
                  {m.role==="assistant" && (
                    <div style={{width:22,height:22,borderRadius:"50%",background:`${ACCENT}20`,border:`1px solid ${ACCENT}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:ACCENT,flexShrink:0}}>{cfg.icon}</div>
                  )}
                  <div className={m.role==="user"?"gm-user":"gm-ai"}>{m.content}</div>
                </div>
              ))}
              {loading && (
                <div style={{display:"flex",alignItems:"flex-end",gap:6}}>
                  <div style={{width:22,height:22,borderRadius:"50%",background:`${ACCENT}20`,border:`1px solid ${ACCENT}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:ACCENT}}>✦</div>
                  <div className="gm-ai" style={{display:"flex",gap:3,alignItems:"center",padding:"10px 12px"}}>
                    {[0,0.2,0.4].map((d,i)=><span key={i} className="gm-dot" style={{animationDelay:`${d}s`}}/>)}
                  </div>
                </div>
              )}
              <div ref={bottomRef}/>
            </div>

            {/* Input */}
            <div style={{padding:"8px 10px 10px",flexShrink:0,borderTop:`1px solid ${B}`}}>
              <div style={{background:"#0a0a0a",border:`1px solid ${B}`,borderRadius:10,padding:"8px 10px",transition:"border-color 0.15s"}}
                onFocusCapture={e=>e.currentTarget.style.borderColor=ACCENT+"60"}
                onBlurCapture={e=>e.currentTarget.style.borderColor=B}>
                <textarea className="gm-ta" rows={2}
                  placeholder={userType==="business"?"Ask about team training, marketing, production…":"Ask about courses, career, skills…"}
                  value={input} onChange={e=>setInput(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}/>
                <div style={{display:"flex",justifyContent:"flex-end",marginTop:4}}>
                  <button onClick={()=>send()} disabled={!input.trim()||loading}
                    style={{padding:"5px 14px",borderRadius:7,border:"none",background:input.trim()&&!loading?ACCENT:"#1a1a1a",color:input.trim()&&!loading?"#fff":"#333",fontSize:11.5,fontWeight:700,cursor:input.trim()&&!loading?"pointer":"not-allowed",fontFamily:"inherit",transition:"all 0.14s"}}>
                    Send →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trigger button */}
        <button onClick={()=>setOpen(o=>!o)}
          style={{width:50,height:50,borderRadius:"50%",background:open?"#1a1a1a":ACCENT,border:`2px solid ${open?B:ACCENT}`,boxShadow:open?"none":`0 4px 20px ${ACCENT}55`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:open?16:20,color:"#fff",transition:"all 0.2s",position:"relative"}}>
          {open ? "✕" : "✦"}
          {unread>0&&!open && <div className="gm-badge">{unread}</div>}
        </button>
      </div>
    </>
  );
}
