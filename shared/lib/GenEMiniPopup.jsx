/**
 * GenEMiniPopup — Fixed version
 * KEY CHANGE: Now uses apiClient which injects the Bearer token automatically.
 * Previously called /api/mini-chat without auth → 401 errors on all apps.
 */
import React, { useState, useRef, useEffect } from "react";
import { miniChat } from "../lib/apiClient";
import { NG_LOGO } from "../lib/logo";

const PINK = "#e8185d";

const PRODUCT_CONFIG = {
  nugens:  { accent: PINK,      title:"Gen-E Mini", prompts:["How does NuGens work?","What products do you offer?","Pricing overview","How to get started"] },
  gene:    { accent: PINK,      title:"Gen-E Mini", prompts:["Improve my resume","Career advice","Interview tips","Skill gap analysis"] },
  hyperx:  { accent: PINK,      title:"HyperX AI",  prompts:["Recommend a course","Study tips","What certifications can I get?","Course roadmap"] },
  digihub: { accent: PINK,      title:"DigiHub AI", prompts:["Content strategy tips","Best posting times","Grow my brand","Campaign ideas"] },
  units:   { accent: PINK,      title:"Units AI",   prompts:["Brand story ideas","Content for my business","Entrepreneur advice","How to start a brand"] },
};

export default function GenEMiniPopup({ product = "nugens", profile }) {
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const bottomRef = useRef(null);

  const config   = PRODUCT_CONFIG[product] || PRODUCT_CONFIG.nugens;
  const userType = profile?.user_type || "individual";

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  const handleOpen = () => {
    if (!open && messages.length === 0) {
      setMessages([{ role:"assistant", text:`Hi! I'm ${config.title} — your AI assistant for ${product === "nugens" ? "the NuGens platform" : product}. How can I help you today?` }]);
    }
    setOpen(o => !o);
  };

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput("");
    setMessages(ms => [...ms, { role:"user", text:msg }]);
    setLoading(true);

    try {
      // apiClient auto-adds Bearer token — no more 401 errors
      const data = await miniChat(msg, product, userType);
      const reply = data?.reply || data?.message || "I'm having trouble right now. Please try again shortly.";
      setMessages(ms => [...ms, { role:"assistant", text:reply }]);
    } catch (e) {
      const errText = e.message?.includes("401")
        ? "Your session expired. Please refresh the page and try again."
        : "I'm having trouble connecting. Please try again in a moment.";
      setMessages(ms => [...ms, { role:"assistant", text:errText }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={handleOpen}
        style={{
          position:"fixed", bottom:24, right:24, width:48, height:48,
          borderRadius:"50%", background:PINK, border:"none", cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow:`0 4px 20px ${PINK}60`, zIndex:1000, transition:"transform 0.2s",
          fontFamily:"'Plus Jakarta Sans',sans-serif",
        }}
        onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"}
        onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
      >
        {open ? <span style={{ color:"#fff", fontSize:16 }}>✕</span> : <span style={{ color:"#fff", fontSize:18, fontWeight:800 }}>✦</span>}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position:"fixed", bottom:84, right:24, width:340, height:480,
          background:"#fff", borderRadius:18, boxShadow:"0 8px 48px rgba(0,0,0,0.18)",
          display:"flex", flexDirection:"column", zIndex:999, overflow:"hidden",
          border:"1px solid #f0f0f0",
          fontFamily:"'Plus Jakarta Sans',sans-serif",
        }}>
          <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>

          {/* Header */}
          <div style={{ background:`linear-gradient(135deg,${PINK},#c4134e)`, padding:"14px 18px", display:"flex", alignItems:"center", gap:10 }}>
            <img src={NG_LOGO} style={{ width:24, height:24, borderRadius:6, objectFit:"cover" }} alt="NG"/>
            <div>
              <div style={{ fontSize:13, fontWeight:800, color:"#fff" }}>{config.title}</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.7)" }}>NuGens AI · Always on</div>
            </div>
            <div style={{ marginLeft:"auto", width:8, height:8, borderRadius:"50%", background:"#4ade80" }}/>
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:"auto", padding:"14px 14px 8px", display:"flex", flexDirection:"column", gap:10 }}>
            {messages.map((m,i) => (
              <div key={i} style={{
                alignSelf: m.role==="user" ? "flex-end" : "flex-start",
                maxWidth:"82%",
                background: m.role==="user" ? PINK : "#f8f9fb",
                color: m.role==="user" ? "#fff" : "#111",
                borderRadius: m.role==="user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                padding:"10px 13px", fontSize:13, lineHeight:1.65, whiteSpace:"pre-wrap",
              }}>
                {m.text}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf:"flex-start", background:"#f8f9fb", borderRadius:"16px 16px 16px 4px", padding:"10px 13px" }}>
                <span style={{ color:PINK }}>✦ </span><span style={{ color:"#aaa", fontSize:12 }}>Thinking...</span>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Quick prompts */}
          {messages.length <= 1 && (
            <div style={{ padding:"4px 14px 8px", display:"flex", flexWrap:"wrap", gap:5 }}>
              {config.prompts.map(q => (
                <button key={q} onClick={()=>send(q)} style={{ background:"#f3f4f6", border:"none", borderRadius:12, padding:"5px 10px", fontSize:11, color:"#555", cursor:"pointer", fontFamily:"inherit" }}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding:"10px 12px 14px", borderTop:"1px solid #f0f0f0", display:"flex", gap:8 }}>
            <input
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); send(); } }}
              placeholder="Ask anything..."
              style={{ flex:1, border:"1px solid #f0f0f0", borderRadius:10, padding:"9px 12px", fontSize:13, fontFamily:"inherit", outline:"none", background:"#fafafa" }}
            />
            <button onClick={()=>send()} disabled={loading||!input.trim()} style={{ padding:"9px 14px", background:PINK, color:"#fff", border:"none", borderRadius:10, fontSize:12, fontWeight:700, cursor:"pointer", opacity:(loading||!input.trim())?0.4:1, fontFamily:"inherit" }}>
              →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
