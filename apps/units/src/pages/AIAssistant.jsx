/**
 * Units — AI Assistant (Production House)
 * Fixed: routes through backend /api/mini-chat instead of calling Anthropic directly
 * This fixes the "server error" since the API key lives on the backend, not the browser
 */
import React, { useState, useRef, useEffect } from "react";
import { supabase } from "../lib/supabase";

const GOLD  = "#d4a843";
const DARK  = "#0a0805";
const CARD  = "#0f0c08";
const BORD  = "#1c1a14";
const API   = import.meta.env.VITE_GEN_E_API_URL || "https://nugens-platform.onrender.com";

const QUICK = [
  "What's included in the wedding film signature package?",
  "How long does editing take after a wedding shoot?",
  "What equipment do you use for weddings?",
  "Can I book a same-day edit reel for my wedding?",
  "How do drone shots work at indoor venues?",
  "What's the best way to prepare for a pre-wedding shoot?",
];

async function getToken() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch { return null; }
}

export default function AIAssistant() {
  const [msgs,    setMsgs]    = useState([{
    role: "assistant",
    content: "Hi! I'm the Units AI production assistant.\n\nI can help with:\n• Understanding our packages and services\n• Booking and availability questions\n• Production process and timelines\n• Tips for your shoot day\n• Editing and delivery details\n\nWhat would you like to know?",
  }]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");
    const updated = [...msgs, { role: "user", content: msg }];
    setMsgs(updated);
    setLoading(true);

    try {
      const token = await getToken();
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API}/api/mini-chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: msg,
          history: msgs.slice(-8).map(m => ({ role: m.role, content: m.content })),
          product: "units",
          userType: "individual",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Server error");

      setMsgs(prev => [...prev, { role: "assistant", content: data.reply || "Let me check on that for you." }]);
    } catch (e) {
      console.error("Units AI error:", e);
      setMsgs(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I couldn't connect right now. Please try again in a moment, or contact us directly.",
      }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", display: "flex", flexDirection: "column", height: "100vh", background: DARK }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .msg{max-width:78%;padding:12px 16px;border-radius:14px;font-size:13.5px;line-height:1.75;white-space:pre-wrap;word-break:break-word;}
        .msg.user{background:${GOLD};color:${DARK};border-radius:14px 14px 2px 14px;margin-left:auto;font-weight:500;}
        .msg.assistant{background:${CARD};border:1px solid ${BORD};color:#c8b87a;border-radius:14px 14px 14px 2px;}
        .q-btn{padding:7px 14px;background:${CARD};border:1px solid ${BORD};border-radius:8px;font-size:12px;color:#5a5040;
          cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.14s;text-align:left;}
        .q-btn:hover{border-color:#2a2416;color:#a09060;}
        .send-btn{padding:10px 22px;background:${GOLD};color:${DARK};border:none;border-radius:10px;
          font-size:14px;font-weight:800;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;
          flex-shrink:0;transition:opacity 0.15s;}
        .send-btn:hover{opacity:0.88;}
        .send-btn:disabled{opacity:0.35;cursor:not-allowed;}
        .chat-in{flex:1;padding:11px 16px;background:${CARD};border:1px solid ${BORD};border-radius:10px;
          color:#c8b87a;font-size:14px;font-family:'Plus Jakarta Sans',sans-serif;outline:none;resize:none;}
        .chat-in:focus{border-color:${GOLD}50;}
        .chat-in::placeholder{color:#2a2010;}
        .dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:${GOLD}80;
          animation:bounce 1.1s infinite ease-in-out;}
        .dot:nth-child(2){animation-delay:0.15s}.dot:nth-child(3){animation-delay:0.3s}
        @keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}
      `}</style>

      {/* Header */}
      <div style={{ padding:"20px 24px 18px", borderBottom:`1px solid ${BORD}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:38, height:38, borderRadius:11, background:`${GOLD}20`, border:`1px solid ${GOLD}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>✦</div>
          <div>
            <div style={{ fontWeight:800, fontSize:15, color:GOLD, letterSpacing:"-0.03em" }}>Units AI</div>
            <div style={{ fontSize:11, color:"#5a5040", fontWeight:500 }}>Production Assistant</div>
          </div>
        </div>
        <div style={{ fontSize:11, color:"#3a3020", background:`${GOLD}10`, border:`1px solid ${GOLD}20`, borderRadius:6, padding:"4px 10px" }}>
          Powered by Nugens AI
        </div>
      </div>

      {/* Quick prompts */}
      {msgs.length <= 1 && (
        <div style={{ padding:"14px 18px 0", display:"flex", flexWrap:"wrap", gap:8 }}>
          {QUICK.map((q, i) => (
            <button key={i} className="q-btn" onClick={() => send(q)}>{q}</button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", padding:"18px 20px", display:"flex", flexDirection:"column", gap:12 }}>
        {msgs.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>{m.content}</div>
        ))}
        {loading && (
          <div className="msg assistant" style={{ display:"flex", gap:5, alignItems:"center" }}>
            <span className="dot" /><span className="dot" /><span className="dot" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding:"14px 18px", borderTop:`1px solid ${BORD}`, display:"flex", gap:10, alignItems:"flex-end" }}>
        <textarea
          className="chat-in"
          rows={1}
          placeholder="Ask about packages, bookings, production…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          style={{ maxHeight:90, overflowY:"auto" }}
        />
        <button className="send-btn" disabled={!input.trim() || loading} onClick={() => send()}>
          {loading ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}
