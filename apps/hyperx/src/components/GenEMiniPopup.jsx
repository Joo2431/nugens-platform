import React, { useState, useRef, useEffect } from "react";

const PINK = "#e8185d";
const B    = "#1e1e1e";

const QUICK_PROMPTS = [
  "How do I ask for a raise?",
  "Handle a micromanaging boss",
  "Best way to build LinkedIn",
  "Answer 'What is your weakness?'",
];

const SYSTEM_PROMPT = `You are GEN-E Mini, HyperX's career assistant. Give direct, practical, no-fluff advice about workplace situations, career growth, salary negotiation, interviews, and professional development. Be concise — 3-5 sentences max unless the user asks for more. Use Indian workplace context when relevant.`;

export default function GenEMiniPopup() {
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([
    { role:"assistant", content:"Hi! I'm GEN-E Mini — your HyperX career coach. Ask me anything about workplace situations, salary, or interviews." }
  ]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [unread,  setUnread]  = useState(0);
  const bottomRef   = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:"smooth" }), 50);
    }
  }, [open, messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    const next = [...messages, { role:"user", content:msg }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:600,
          system: SYSTEM_PROMPT,
          messages: next.map(m=>({ role:m.role, content:m.content })),
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "Sorry, couldn't get a response.";
      setMessages(p=>[...p,{ role:"assistant", content:reply }]);
      if (!open) setUnread(u=>u+1);
    } catch {
      setMessages(p=>[...p,{ role:"assistant", content:"Connection error. Try again." }]);
    }
    setLoading(false);
  };

  return (
    <>
      <style>{`
        @keyframes popIn{from{opacity:0;transform:scale(0.92) translateY(12px)}to{opacity:1;transform:none}}
        @keyframes dotP{0%,80%,100%{opacity:0.3;transform:scale(0.8)}40%{opacity:1;transform:scale(1)}}
        .gm-dot{width:5px;height:5px;border-radius:50%;background:${PINK};display:inline-block;animation:dotP 1.2s ease-in-out infinite}
        .gm-msg{padding:10px 14px;border-radius:11px;font-size:13px;line-height:1.65;max-width:240px;white-space:pre-wrap;font-family:'Plus Jakarta Sans',sans-serif}
        .gm-user{background:${PINK}20;border:1px solid ${PINK}30;color:#e0e0e0;margin-left:auto}
        .gm-ai{background:#1a1a1a;border:1px solid ${B};color:#ccc}
        .gm-quick{padding:5px 10px;background:#1a1a1a;border:1px solid ${B};border-radius:7px;color:#666;font-size:11.5px;cursor:pointer;text-align:left;transition:all 0.13s;font-family:'Plus Jakarta Sans',sans-serif}
        .gm-quick:hover{border-color:${PINK}50;color:#ccc}
        .gm-input{width:100%;background:transparent;border:none;color:#fff;font-size:13px;font-family:'Plus Jakarta Sans',sans-serif;resize:none;outline:none;line-height:1.55;max-height:80px}
        .gm-input::placeholder{color:#444}
      `}</style>

      {/* Floating button */}
      <div style={{position:"fixed",bottom:24,right:24,zIndex:1000}}>
        {/* Popup */}
        {open && (
          <div style={{
            position:"absolute",bottom:60,right:0,
            width:300,height:440,
            background:"#111",border:`1px solid ${B}`,
            borderRadius:16,boxShadow:"0 20px 60px rgba(0,0,0,0.6)",
            display:"flex",flexDirection:"column",
            animation:"popIn 0.2s ease",overflow:"hidden",
          }}>
            {/* Header */}
            <div style={{background:"#0a0a0a",borderBottom:`1px solid ${B}`,padding:"12px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:`${PINK}20`,border:`1px solid ${PINK}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:PINK}}>✦</div>
                <div>
                  <div style={{fontSize:12.5,fontWeight:800,color:"#fff",lineHeight:1}}>GEN-E Mini</div>
                  <div style={{fontSize:10,color:"#444",marginTop:1}}>Career AI · HyperX</div>
                </div>
              </div>
              <button onClick={()=>setOpen(false)} style={{background:"none",border:"none",cursor:"pointer",color:"#444",fontSize:16,lineHeight:1,padding:2}}>✕</button>
            </div>

            {/* Messages */}
            <div style={{flex:1,overflowY:"auto",padding:"12px 12px 8px",display:"flex",flexDirection:"column",gap:10}}>
              {messages.length===1 && (
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:4}}>
                  {QUICK_PROMPTS.map(p=>(
                    <button key={p} className="gm-quick" onClick={()=>send(p)}>{p}</button>
                  ))}
                </div>
              )}
              {messages.map((m,i)=>(
                <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",alignItems:"flex-end",gap:6}}>
                  {m.role==="assistant" && <div style={{width:22,height:22,borderRadius:"50%",background:`${PINK}20`,border:`1px solid ${PINK}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:PINK,flexShrink:0}}>✦</div>}
                  <div className={`gm-msg ${m.role==="user"?"gm-user":"gm-ai"}`}>{m.content}</div>
                </div>
              ))}
              {loading && (
                <div style={{display:"flex",alignItems:"flex-end",gap:6}}>
                  <div style={{width:22,height:22,borderRadius:"50%",background:`${PINK}20`,border:`1px solid ${PINK}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:PINK}}>✦</div>
                  <div className="gm-ai gm-msg" style={{display:"flex",gap:3,alignItems:"center",padding:"10px 12px"}}>
                    {[0,0.2,0.4].map((d,i)=><span key={i} className="gm-dot" style={{animationDelay:`${d}s`}}/>)}
                  </div>
                </div>
              )}
              <div ref={bottomRef}/>
            </div>

            {/* Input */}
            <div style={{padding:"8px 10px 10px",flexShrink:0,borderTop:`1px solid ${B}`}}>
              <div style={{background:"#0a0a0a",border:`1px solid ${B}`,borderRadius:10,padding:"8px 10px"}}
                onFocusCapture={e=>e.currentTarget.style.borderColor=PINK+"60"}
                onBlurCapture={e=>e.currentTarget.style.borderColor=B}>
                <textarea ref={textareaRef} className="gm-input" rows={2}
                  placeholder="Ask about salary, career, interviews…"
                  value={input} onChange={e=>setInput(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}/>
                <div style={{display:"flex",justifyContent:"flex-end",marginTop:4}}>
                  <button onClick={()=>send()} disabled={!input.trim()||loading}
                    style={{padding:"5px 14px",borderRadius:7,border:"none",background:input.trim()&&!loading?PINK:"#1a1a1a",color:input.trim()&&!loading?"#fff":"#333",fontSize:11.5,fontWeight:700,cursor:input.trim()&&!loading?"pointer":"not-allowed",fontFamily:"inherit"}}>
                    Send →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trigger button */}
        <button onClick={()=>setOpen(o=>!o)} style={{
          width:48,height:48,borderRadius:"50%",
          background:open?"#1a1a1a":PINK,
          border:`1px solid ${open?B:PINK}`,
          boxShadow:open?"none":`0 4px 20px ${PINK}50`,
          cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:20,color:"#fff",transition:"all 0.2s",position:"relative",
        }}>
          {open ? "✕" : "✦"}
          {unread > 0 && !open && (
            <div style={{position:"absolute",top:-2,right:-2,width:16,height:16,borderRadius:"50%",background:"#fff",color:PINK,fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{unread}</div>
          )}
        </button>
      </div>
    </>
  );
}
