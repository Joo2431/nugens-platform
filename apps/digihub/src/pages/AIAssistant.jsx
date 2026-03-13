import React, { useState, useRef, useEffect } from "react";

const BLUE = "#0284c7";
const B    = "#1a2030";

const QUICK_PROMPTS = [
  "Write a 30-day Instagram content calendar for a fitness brand",
  "Create a meta ads strategy for a D2C food brand with ₹20K budget",
  "Suggest 10 viral reel ideas for a fashion brand",
  "Write a LinkedIn post about digital marketing trends",
  "Create an email sequence for a new product launch",
  "How do I improve my brand's SEO in 90 days?",
];

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    { role:"assistant", content:"Hi! I'm your DigiHub AI assistant, powered by Gen-E. I specialize in digital marketing strategy, content ideas, campaign planning, brand building, and everything in between.\n\nWhat can I help you with today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    const updated = [...messages, { role:"user", content:msg }];
    setMessages(updated);
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system:`You are DigiHub AI, an expert digital marketing strategist assistant built into the DigiHub platform. You help brands grow through social media, content marketing, paid ads, SEO, brand strategy, and community building. You are concise, actionable, and creative. Format your responses clearly with bullet points and headers where helpful. Always give practical, implementable advice tailored to Indian SMBs and startups.`,
          messages: updated.map(m => ({ role:m.role, content:m.content }))
        })
      });
      const d = await res.json();
      const reply = d.content?.[0]?.text || "Sorry, I couldn't generate a response. Please try again.";
      setMessages(prev => [...prev, { role:"assistant", content:reply }]);
    } catch {
      setMessages(prev => [...prev, { role:"assistant", content:"Connection error. Please try again." }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", display:"flex", flexDirection:"column", height:"100vh", background:"#06101a" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .msg { max-width:78%; padding:12px 16px; border-radius:14px; font-size:13.5px; line-height:1.72; white-space:pre-wrap; }
        .msg.user { background:${BLUE}; color:#fff; border-radius:14px 14px 2px 14px; margin-left:auto; }
        .msg.assistant { background:#080f1a; border:1px solid ${B}; color:#ccc; border-radius:14px 14px 14px 2px; }
        .quick-btn { padding:7px 14px; background:#080f1a; border:1px solid ${B}; border-radius:8px; font-size:12px; color:#667; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.14s; text-align:left; }
        .quick-btn:hover { border-color:#243040; color:#aaa; }
        .send-btn { padding:10px 20px; background:${BLUE}; color:#fff; border:none; border-radius:10px; font-size:14px; font-weight:700; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; transition:opacity 0.15s; flex-shrink:0; }
        .send-btn:hover { opacity:0.88; }
        .send-btn:disabled { opacity:0.4; cursor:not-allowed; }
        .chat-input { flex:1; padding:11px 16px; background:#080f1a; border:1px solid ${B}; border-radius:10px; color:#ddd; font-size:14px; font-family:'Plus Jakarta Sans',sans-serif; outline:none; }
        .chat-input:focus { border-color:${BLUE}60; }
        .chat-input::placeholder { color:#334; }
      `}</style>

      {/* Header */}
      <div style={{ padding:"20px 24px 18px", borderBottom:`1px solid ${B}`, background:"#080f1a", display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:`${BLUE}20`, border:`1px solid ${BLUE}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, color:BLUE }}>✦</div>
        <div>
          <div style={{ fontWeight:800, fontSize:15, color:"#fff", letterSpacing:"-0.02em" }}>DigiHub AI</div>
          <div style={{ fontSize:11.5, color:"#445" }}>Marketing strategy · Content · Campaigns · Brand growth</div>
        </div>
        <button onClick={() => setMessages([{ role:"assistant", content:"Chat cleared! What can I help you with?" }])} style={{ marginLeft:"auto", background:"none", border:`1px solid ${B}`, color:"#445", fontSize:12, padding:"5px 12px", borderRadius:7, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
          Clear chat
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", padding:"24px 24px 12px", display:"flex", flexDirection:"column", gap:14 }}>
        {messages.map((m,i) => (
          <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start" }}>
            {m.role==="assistant" && (
              <div style={{ width:28, height:28, borderRadius:8, background:`${BLUE}20`, border:`1px solid ${BLUE}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:BLUE, marginRight:8, flexShrink:0, marginTop:2 }}>✦</div>
            )}
            <div className={`msg ${m.role}`}>{m.content}</div>
          </div>
        ))}
        {loading && (
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:8, background:`${BLUE}20`, border:`1px solid ${BLUE}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:BLUE }}>✦</div>
            <div style={{ background:"#080f1a", border:`1px solid ${B}`, borderRadius:14, padding:"12px 16px", display:"flex", gap:5 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:BLUE+"60", animation:`bounce 0.9s ${i*0.15}s ease-in-out infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts — only show if first message */}
      {messages.length === 1 && (
        <div style={{ padding:"0 24px 16px" }}>
          <div style={{ fontSize:11.5, fontWeight:600, color:"#334", marginBottom:8 }}>QUICK PROMPTS</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {QUICK_PROMPTS.map(p => (
              <button key={p} className="quick-btn" onClick={() => send(p)}>{p}</button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div style={{ padding:"12px 24px 20px", borderTop:`1px solid ${B}`, background:"#080f1a", display:"flex", gap:10 }}>
        <input
          className="chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key==="Enter" && !e.shiftKey && send()}
          placeholder="Ask about content strategy, campaigns, brand growth..."
        />
        <button className="send-btn" onClick={() => send()} disabled={!input.trim() || loading}>
          {loading ? "..." : "Send →"}
        </button>
      </div>

      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }`}</style>
    </div>
  );
}
