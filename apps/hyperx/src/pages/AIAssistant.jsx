/**
 * HyperX — AI Assistant
 * Fixed: routes through backend /api/mini-chat (product: "hyperx")
 * Color palette matches NuGens system
 */
import React, { useState, useRef, useEffect } from "react";
import { supabase } from "../lib/supabase";

const PINK   = "#e8185d";
const TEXT   = "#111827";
const MUTED  = "#6b7280";
const LIGHT  = "#f8f9fb";
const CARD   = "#ffffff";
const BORDER = "#e8eaed";
const API    = import.meta.env.VITE_GEN_E_API_URL || "https://nugens-platform.onrender.com";

const QUICK = [
  "Which course should I take to become a product manager?",
  "How do I negotiate a salary raise?",
  "What soft skills do I need to get promoted faster?",
  "How do I improve my communication skills at work?",
  "What is the best way to build my personal brand?",
  "Give me a 30-day learning plan for leadership skills",
];

async function getToken() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch { return null; }
}

export default function AIAssistant({ profile }) {
  const [msgs,    setMsgs]    = useState([{
    role: "assistant",
    content: "Hi! I'm the HyperX AI Learning Assistant.\n\nI can help you with:\n• Course recommendations and learning paths\n• Career skill development strategies\n• Workplace communication and leadership tips\n• Interview and promotion preparation\n\nWhat would you like to learn today?",
  }]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");
    const history = msgs.filter(m => m.role !== "system");
    const updated = [...history, { role: "user", content: msg }];
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
          history: history.slice(-8).map(m => ({ role: m.role, content: m.content })),
          product: "hyperx",
          userType: profile?.user_type || "individual",
          goal: "learn_skills",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Server error");

      setMsgs(prev => [...prev, { role: "assistant", content: data.reply || "Let me look that up for you…" }]);
    } catch (e) {
      console.error("HyperX AI error:", e);
      setMsgs(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I couldn't connect right now. Please try again in a moment.",
      }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", display: "flex", flexDirection: "column", height: "100vh", background: LIGHT }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .hx-msg{max-width:80%;padding:12px 16px;border-radius:14px;font-size:13.5px;line-height:1.7;white-space:pre-wrap;word-break:break-word;}
        .hx-user{background:${PINK};color:#fff;border-radius:14px 14px 2px 14px;margin-left:auto;font-weight:500;}
        .hx-bot{background:${CARD};border:1px solid ${BORDER};color:${TEXT};border-radius:14px 14px 14px 2px;}
        .hx-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#ddd;animation:hx-b 1.1s infinite ease-in-out;}
        .hx-dot:nth-child(2){animation-delay:.15s}.hx-dot:nth-child(3){animation-delay:.3s}
        @keyframes hx-b{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}
      `}</style>

      {/* Header */}
      <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${BORDER}`, background: CARD, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: `${PINK}10`, border: `1px solid ${PINK}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: PINK }}>▶</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: TEXT, letterSpacing: "-0.03em" }}>HyperX AI</div>
            <div style={{ fontSize: 11, color: MUTED, fontWeight: 500 }}>Learning & Skill Assistant</div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: MUTED, background: LIGHT, border: `1px solid ${BORDER}`, borderRadius: 6, padding: "4px 10px" }}>
          Powered by NuGens AI
        </div>
      </div>

      {/* Quick prompts */}
      {msgs.length <= 1 && (
        <div style={{ padding: "14px 20px 0", display: "flex", flexWrap: "wrap", gap: 8 }}>
          {QUICK.map((q, i) => (
            <button
              key={i}
              onClick={() => send(q)}
              style={{ padding: "7px 13px", background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 12, color: MUTED, cursor: "pointer", fontFamily: "inherit", transition: "all 0.14s" }}
              onMouseEnter={e => { e.target.style.borderColor = PINK + "40"; e.target.style.color = PINK; }}
              onMouseLeave={e => { e.target.style.borderColor = BORDER; e.target.style.color = MUTED; }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {msgs.map((m, i) => (
          <div key={i} className={`hx-msg ${m.role === "user" ? "hx-user" : "hx-bot"}`}>{m.content}</div>
        ))}
        {loading && (
          <div className="hx-msg hx-bot" style={{ display: "flex", gap: 5, alignItems: "center" }}>
            <span className="hx-dot" /><span className="hx-dot" /><span className="hx-dot" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "14px 20px", borderTop: `1px solid ${BORDER}`, background: CARD, display: "flex", gap: 10, alignItems: "flex-end" }}>
        <textarea
          rows={1}
          placeholder="Ask about courses, skills, career growth…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          style={{ flex: 1, padding: "10px 14px", border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "none", maxHeight: 90, overflowY: "auto", color: TEXT, background: LIGHT }}
          onFocus={e => e.target.style.borderColor = PINK + "60"}
          onBlur={e => e.target.style.borderColor = BORDER}
        />
        <button
          disabled={!input.trim() || loading}
          onClick={() => send()}
          style={{ padding: "10px 20px", background: loading ? `${PINK}60` : PINK, color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", flexShrink: 0 }}
        >
          {loading ? "…" : "Send →"}
        </button>
      </div>
    </div>
  );
}
