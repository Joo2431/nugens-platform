/**
 * DigiHub — AI Assistant
 * Fixed: routes through backend /api/mini-chat (product: "digihub")
 * Color palette now matches Nugens system-wide design
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
  "Give me 5 Instagram post ideas for a clothing brand",
  "Write a compelling caption for a product launch",
  "How do I grow my brand on LinkedIn?",
  "Create a content calendar for the next week",
  "What's the best time to post on Instagram in India?",
  "Help me write a cold outreach message for partnerships",
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
    content: "Hi! I'm the DigiHub AI Marketing Assistant.\n\nI can help you with:\n• Content ideas and captions for any platform\n• Marketing strategy and campaign planning\n• Brand building and growth tactics\n• SEO, social media, and email marketing tips\n\nWhat do you need help with today?",
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
          product: "digihub",
          userType: profile?.user_type || "individual",
          goal: "build_brand",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Server error");

      setMsgs(prev => [...prev, { role: "assistant", content: data.reply || "Let me think about that…" }]);
    } catch (e) {
      console.error("DigiHub AI error:", e);
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
        .dh-ai-msg{max-width:80%;padding:12px 16px;border-radius:14px;font-size:13.5px;line-height:1.7;white-space:pre-wrap;word-break:break-word;}
        .dh-ai-user{background:${PINK};color:#fff;border-radius:14px 14px 2px 14px;margin-left:auto;font-weight:500;}
        .dh-ai-bot{background:${CARD};border:1px solid ${BORDER};color:${TEXT};border-radius:14px 14px 14px 2px;}
        .dh-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#ddd;animation:dh-b 1.1s infinite ease-in-out;}
        .dh-dot:nth-child(2){animation-delay:.15s}.dh-dot:nth-child(3){animation-delay:.3s}
        @keyframes dh-b{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}
      `}</style>

      {/* Header */}
      <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${BORDER}`, background: CARD, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: `${PINK}10`, border: `1px solid ${PINK}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: PINK }}>✦</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: TEXT, letterSpacing: "-0.03em" }}>DigiHub AI</div>
            <div style={{ fontSize: 11, color: MUTED, fontWeight: 500 }}>Marketing & Content Assistant</div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: MUTED, background: LIGHT, border: `1px solid ${BORDER}`, borderRadius: 6, padding: "4px 10px" }}>
          Powered by Nugens AI
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
          <div key={i} className={`dh-ai-msg ${m.role === "user" ? "dh-ai-user" : "dh-ai-bot"}`}>{m.content}</div>
        ))}
        {loading && (
          <div className="dh-ai-msg dh-ai-bot" style={{ display: "flex", gap: 5, alignItems: "center" }}>
            <span className="dh-dot" /><span className="dh-dot" /><span className="dh-dot" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "14px 20px", borderTop: `1px solid ${BORDER}`, background: CARD, display: "flex", gap: 10, alignItems: "flex-end" }}>
        <textarea
          rows={1}
          placeholder="Ask about marketing, content, campaigns…"
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
