import React, { useState, useRef, useEffect } from "react";

const GOLD = "#d4a843";
const B    = "#1c1a14";

const QUICK = [
  "What's included in the wedding film signature package?",
  "How long does editing usually take after a wedding shoot?",
  "What camera equipment do you use for weddings?",
  "Can I book a same-day edit reel for my wedding?",
  "How do drone shots work at indoor venues?",
  "What's the best way to prepare for a pre-wedding shoot?",
];

export default function AIAssistant() {
  const [msgs, setMsgs]     = useState([{
    role:"assistant",
    content:"Hi! I'm GEN-E Mini, The Wedding Unit's AI production assistant.\n\nI can help you with:\n• Understanding our packages and services\n• Booking and availability questions\n• Production process and timelines\n• Tips for your shoot day\n• Editing and delivery details\n\nWhat would you like to know?"
  }]);
  const [input, setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    const updated = [...msgs, { role:"user", content:msg }];
    setMsgs(updated);
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system:`You are GEN-E Mini, the AI production assistant for "The Wedding Unit" — a premium production house based in Coimbatore, India specialising in wedding films, wedding photography, pre-wedding shoots, corporate events, and post-production editing.

Our services and prices:
- Wedding Film: Essential ₹45K (8hr), Premium ₹85K (12hr), Signature ₹1.4L (full day)
- Wedding Photography: Classic ₹35K, Deluxe ₹65K, Elite ₹1.1L
- Pre-Wedding: Story ₹18K, Cinematic ₹35K, Destination ₹75K
- Corporate/Brand Video: Event ₹25K, Brand Film ₹60K, Campaign ₹1.2L
- Editing/Color Grade: Basic ₹8K, Full Grade ₹18K, Premium Post ₹35K

Typical timelines: editing 1-2 weeks, color grade adds 3-5 days, delivery 2-3 weeks post-shoot for weddings.

Equipment: Sony FX3/FX6, DJI Ronin gimbal, DJI Mavic 3 Pro drone, Profoto lighting.

Be warm, professional, and helpful. Answer production questions clearly. If someone asks about booking, direct them to the Book a Shoot page. Keep answers concise and genuinely useful.`,
          messages: updated.map(m=>({ role:m.role, content:m.content }))
        })
      });
      const d = await res.json();
      setMsgs(prev => [...prev, { role:"assistant", content: d.content?.[0]?.text || "Let me check on that for you. Please try again." }]);
    } catch {
      setMsgs(prev => [...prev, { role:"assistant", content:"Connection issue. Please try again." }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", display:"flex", flexDirection:"column", height:"100vh", background:"#0a0805" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .msg{max-width:78%;padding:12px 16px;border-radius:14px;font-size:13.5px;line-height:1.75;white-space:pre-wrap;}
        .msg.user{background:${GOLD};color:#0a0805;border-radius:14px 14px 2px 14px;margin-left:auto;font-weight:500;}
        .msg.assistant{background:#0f0c08;border:1px solid ${B};color:#c8b87a;border-radius:14px 14px 14px 2px;}
        .q-btn{padding:7px 14px;background:#0f0c08;border:1px solid ${B};border-radius:8px;font-size:12px;color:#5a5040;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.14s;text-align:left;}
        .q-btn:hover{border-color:#2a2416;color:#a09060;}
        .send-btn{padding:10px 20px;background:${GOLD};color:#0a0805;border:none;border-radius:10px;font-size:14px;font-weight:800;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;flex-shrink:0;transition:opacity 0.15s;}
        .send-btn:hover{opacity:0.88;}
        .send-btn:disabled{opacity:0.35;cursor:not-allowed;}
        .chat-in{flex:1;padding:11px 16px;background:#0f0c08;border:1px solid ${B};border-radius:10px;color:#c8b87a;font-size:14px;font-family:'Plus Jakarta Sans',sans-serif;outline:none;}
        .chat-in:focus{border-color:${GOLD}50;}
        .chat-in::placeholder{color:#2a2010;}
      `}</style>

      {/* Header */}
      <div style={{ padding:"18px 24px 16px", borderBottom:`1px solid ${B}`, background:"#0f0c08", display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:`${GOLD}18`, border:`1px solid ${GOLD}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, color:GOLD }}>✦</div>
        <div>
          <div style={{ fontWeight:800, fontSize:15, color:"#e8d5a0", letterSpacing:"-0.02em" }}>GEN-E Mini</div>
          <div style={{ fontSize:11.5, color:"#4a4030" }}>Production assistant · The Wedding Unit</div>
        </div>
        <button onClick={()=>setMsgs([{role:"assistant",content:"Chat cleared! How can I help you today?"}])} style={{ marginLeft:"auto", background:"none", border:`1px solid ${B}`, color:"#4a4030", fontSize:12, padding:"5px 12px", borderRadius:7, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
          Clear
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", padding:"24px 24px 12px", display:"flex", flexDirection:"column", gap:14 }}>
        {msgs.map((m,i)=>(
          <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start" }}>
            {m.role==="assistant" && (
              <div style={{ width:28, height:28, borderRadius:8, background:`${GOLD}18`, border:`1px solid ${GOLD}25`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:GOLD, marginRight:8, flexShrink:0, marginTop:2 }}>✦</div>
            )}
            <div className={`msg ${m.role}`}>{m.content}</div>
          </div>
        ))}
        {loading && (
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:8, background:`${GOLD}18`, border:`1px solid ${GOLD}25`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:GOLD }}>✦</div>
            <div style={{ background:"#0f0c08", border:`1px solid ${B}`, borderRadius:14, padding:"12px 16px", display:"flex", gap:5 }}>
              {[0,1,2].map(i=>(<div key={i} style={{ width:6, height:6, borderRadius:"50%", background:GOLD+"50", animation:`bounce 0.9s ${i*0.15}s ease-in-out infinite` }} />))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      {msgs.length===1 && (
        <div style={{ padding:"0 24px 16px" }}>
          <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#3a3020", marginBottom:8 }}>Ask me about</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {QUICK.map(q=>(<button key={q} className="q-btn" onClick={()=>send(q)}>{q}</button>))}
          </div>
        </div>
      )}

      {/* Input */}
      <div style={{ padding:"12px 24px 20px", borderTop:`1px solid ${B}`, background:"#0f0c08", display:"flex", gap:10 }}>
        <input className="chat-in" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} placeholder="Ask about packages, bookings, production process..." />
        <button className="send-btn" onClick={()=>send()} disabled={!input.trim()||loading}>{loading?"...":"Send →"}</button>
      </div>

      <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}`}</style>
    </div>
  );
}
