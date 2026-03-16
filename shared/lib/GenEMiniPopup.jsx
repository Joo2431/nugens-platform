/**
 * GenEMiniPopup — Shared AI assistant popup for all NuGens platforms
 * Uses the backend /api/mini-chat endpoint (OpenAI GPT-4o-mini via backend)
 * Fully working with auth token from Supabase session
 */
import React, { useState, useRef, useEffect } from "react";
import { supabase } from "../lib/supabase";

const PINK = "#e8185d";
const API  = import.meta.env.VITE_GEN_E_API_URL || "https://nugens-platform.onrender.com";

async function getToken() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch { return null; }
}

async function miniChat(message, history, product, profile) {
  const token = await getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API}/api/mini-chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      message,
      history: history.slice(-8),
      product: product || "nugens",
      userType: profile?.user_type || "individual",
      goal: profile?.goal || null,
      businessNeed: profile?.business_need || null,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Server error ${res.status}`);
  }

  const data = await res.json();
  return data.reply || "I'm here to help! What would you like to know?";
}

export default function GenEMiniPopup({ product = "nugens", profile }) {
  const [open,    setOpen]    = useState(false);
  const [msgs,    setMsgs]    = useState([]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const PRODUCT_LABELS = {
    nugens:  "NuGens AI",
    gene:    "Gen-E Mini",
    hyperx:  "HyperX AI",
    digihub: "DigiHub AI",
    units:   "Units AI",
  };
  const label = PRODUCT_LABELS[product] || "NuGens AI";

  const GREETINGS = {
    nugens:  "Hi! I'm the NuGens AI assistant. I can help with Gen-E, HyperX, DigiHub, and Units. What do you need?",
    gene:    "Hey! I'm Gen-E Mini. Ask me anything about career guidance, skills, or jobs on this platform.",
    hyperx:  "Hi! I'm the HyperX AI. Ask me about courses, learning paths, and skill development.",
    digihub: "Hi! I'm the DigiHub AI. I can help with marketing tools, content ideas, and business growth.",
    units:   "Hi! I'm the Units AI. Ask me about production services, bookings, and content creation.",
  };

  useEffect(() => {
    if (open && msgs.length === 0) {
      setMsgs([{ role: "assistant", content: GREETINGS[product] || GREETINGS.nugens }]);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");
    const history = msgs.filter(m => m.role !== "system");
    const updated = [...history, { role: "user", content: msg }];
    setMsgs(updated);
    setLoading(true);
    try {
      const reply = await miniChat(msg, history, product, profile);
      setMsgs(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setMsgs(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I couldn't connect right now. Please try again in a moment.",
      }]);
    }
    setLoading(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .gm-popup{position:fixed;bottom:76px;right:20px;width:340px;max-height:480px;background:#fff;border-radius:18px;
          box-shadow:0 8px 48px rgba(232,24,93,0.18),0 2px 16px rgba(0,0,0,0.1);display:flex;flex-direction:column;
          z-index:1000;overflow:hidden;font-family:'Plus Jakarta Sans',sans-serif;animation:gm-in 0.22s ease;}
        @keyframes gm-in{from{opacity:0;transform:translateY(12px) scale(0.97)}to{opacity:1;transform:none}}
        .gm-msgs{flex:1;overflow-y:auto;padding:14px 14px 8px;display:flex;flex-direction:column;gap:10px;}
        .gm-msgs::-webkit-scrollbar{width:4px}.gm-msgs::-webkit-scrollbar-thumb{background:#f0d0da;border-radius:4px}
        .gm-bubble{max-width:88%;padding:10px 14px;border-radius:14px;font-size:13px;line-height:1.65;white-space:pre-wrap;word-break:break-word;}
        .gm-user{background:${PINK};color:#fff;border-radius:14px 14px 2px 14px;align-self:flex-end;font-weight:500;}
        .gm-bot{background:#fafafa;border:1px solid #f0f0f0;color:#111;border-radius:14px 14px 14px 2px;align-self:flex-start;}
        .gm-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#ddd;animation:gm-bounce 1.1s infinite ease-in-out;}
        .gm-dot:nth-child(2){animation-delay:0.15s}.gm-dot:nth-child(3){animation-delay:0.3s}
        @keyframes gm-bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}
        .gm-fab{position:fixed;bottom:20px;right:20px;width:52px;height:52px;border-radius:50%;background:${PINK};
          border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;
          box-shadow:0 4px 20px ${PINK}50;z-index:999;transition:transform 0.18s,box-shadow 0.18s;
          font-size:22px;color:#fff;}
        .gm-fab:hover{transform:scale(1.08);box-shadow:0 6px 28px ${PINK}60;}
        .gm-input-row{padding:10px 12px;border-top:1px solid #f5f5f5;display:flex;gap:8px;align-items:center;}
        .gm-input{flex:1;border:1px solid #f0f0f0;border-radius:10px;padding:9px 12px;font-size:13px;
          font-family:'Plus Jakarta Sans',sans-serif;outline:none;color:#111;background:#fafafa;resize:none;}
        .gm-input:focus{border-color:${PINK}40;background:#fff;}
        .gm-send{background:${PINK};border:none;border-radius:9px;width:34px;height:34px;cursor:pointer;
          display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;flex-shrink:0;
          transition:opacity 0.15s;}
        .gm-send:disabled{opacity:0.35;cursor:not-allowed;}
      `}</style>

      <button className="gm-fab" onClick={() => setOpen(o => !o)} title={label} aria-label={label}>
        {open ? "✕" : "✦"}
      </button>

      {open && (
        <div className="gm-popup">
          {/* Header */}
          <div style={{ padding:"13px 16px 11px", borderBottom:"1px solid #f5f5f5", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <div style={{ width:30, height:30, borderRadius:9, background:`${PINK}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:PINK }}>✦</div>
              <div>
                <div style={{ fontWeight:800, fontSize:13, color:"#111", letterSpacing:"-0.02em" }}>{label}</div>
                <div style={{ fontSize:10, color:"#bbb", fontWeight:500 }}>by NuGens</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"#ccc", fontSize:16, lineHeight:1 }}>✕</button>
          </div>

          {/* Messages */}
          <div className="gm-msgs">
            {msgs.map((m, i) => (
              <div key={i} className={`gm-bubble ${m.role === "user" ? "gm-user" : "gm-bot"}`}>
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="gm-bubble gm-bot" style={{ display:"flex", gap:4, alignItems:"center" }}>
                <span className="gm-dot" /><span className="gm-dot" /><span className="gm-dot" />
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="gm-input-row">
            <textarea
              className="gm-input"
              rows={1}
              placeholder="Ask me anything…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              style={{ maxHeight:80, overflowY:"auto" }}
            />
            <button className="gm-send" disabled={!input.trim() || loading} onClick={() => send()}>→</button>
          </div>
        </div>
      )}
    </>
  );
}
