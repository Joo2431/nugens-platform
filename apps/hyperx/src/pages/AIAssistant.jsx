import React, { useState, useRef, useEffect } from "react";

const PURPLE = "#7c3aed";
const PINK   = "#e8185d";
const B      = "#1e1e2e";

const QUICK_PROMPTS = [
  "How do I ask for a raise without risking my job?",
  "What should I say in my first week at a new job?",
  "How do I handle a manager who micromanages?",
  "Write me a professional email declining a meeting",
  "How do I answer 'What is your weakness?' in an interview?",
  "What's the best way to build my LinkedIn profile?",
];

const SYSTEM_PROMPT = `You are GEN-E Mini, HyperX's career assistant. You help professionals with:
- Workplace communication, politics, and culture
- Career strategy, salary negotiation, promotions
- Interview prep and job searching
- Professional growth and personal branding

You give direct, practical, no-fluff advice grounded in real workplace experience. Be concise, confident, and specific. Use bullet points when listing steps. Always relate advice to Indian workplace context when relevant. Never be vague.`;

export default function AIAssistant({ profile }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm GEN-E Mini — your HyperX career coach. Ask me anything about workplace situations, career growth, salary, or interviews. I'll give you direct, practical advice." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const plan = profile?.plan || "free";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");

    const newMessages = [...messages, { role: "user", content: msg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: apiMessages,
        }),
      });

      const data = await response.json();
      const reply = data.content?.[0]?.text || "Sorry, I couldn't get a response. Please try again.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#080814", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .msg-bubble { padding: 12px 16px; border-radius: 12px; font-size: 13.5px; line-height: 1.7; max-width: 680px; white-space: pre-wrap; }
        .msg-user { background: ${PURPLE}25; border: 1px solid ${PURPLE}30; color: #ddd; margin-left: auto; }
        .msg-ai { background: #0d0d1a; border: 1px solid ${B}; color: #ccc; }
        .quick-btn { padding: 7px 14px; background: #0d0d1a; border: 1px solid ${B}; border-radius: 8px; color: #666; font-size: 12px; cursor: pointer; text-align: left; transition: all 0.13s; font-family: inherit; }
        .quick-btn:hover { border-color: ${PURPLE}50; color: #ccc; background: #111124; }
        .chat-textarea { width: 100%; background: transparent; border: none; color: #fff; font-size: 14px; font-family: inherit; resize: none; outline: none; line-height: 1.6; max-height: 120px; }
        @keyframes dotPulse { 0%,80%,100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }
        .dot { width: 6px; height: 6px; border-radius: 50%; background: ${PURPLE}; animation: dotPulse 1.2s ease-in-out infinite; display: inline-block; }
      `}</style>

      {/* Header */}
      <div style={{ background: "#0d0d1a", borderBottom: `1px solid ${B}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: PURPLE + "20", border: `1px solid ${PURPLE}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: PURPLE }}>✦</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>GEN-E Mini <span style={{ fontSize: 10, fontWeight: 600, color: PURPLE, background: PURPLE + "18", padding: "1px 7px", borderRadius: 4, verticalAlign: "middle", marginLeft: 4 }}>HyperX</span></div>
          <div style={{ fontSize: 11.5, color: "#444" }}>Your AI career coach · Always on</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 24px 12px", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Quick prompts — shown only at start */}
        {messages.length === 1 && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#444", marginBottom: 12 }}>Quick questions</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {QUICK_PROMPTS.map(p => (
                <button key={p} className="quick-btn" onClick={() => sendMessage(p)}>{p}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            {msg.role === "assistant" && (
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: PURPLE + "20", border: `1px solid ${PURPLE}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: PURPLE, flexShrink: 0, marginRight: 10, marginTop: 2 }}>✦</div>
            )}
            <div className={`msg-bubble ${msg.role === "user" ? "msg-user" : "msg-ai"}`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: PURPLE + "20", border: `1px solid ${PURPLE}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: PURPLE }}>✦</div>
            <div style={{ display: "flex", gap: 4, alignItems: "center", background: "#0d0d1a", border: `1px solid ${B}`, borderRadius: 10, padding: "12px 16px" }}>
              {[0, 0.2, 0.4].map((d, i) => <span key={i} className="dot" style={{ animationDelay: `${d}s` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Usage note for free plan */}
      {plan === "free" && messages.length > 6 && (
        <div style={{ background: PINK + "12", borderTop: `1px solid ${PINK}25`, padding: "10px 24px", fontSize: 12.5, color: "#888", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>Free plan: limited AI messages.</span>
          <a href="/pricing" style={{ color: PINK, fontWeight: 700, textDecoration: "none", fontSize: 12 }}>Upgrade for unlimited →</a>
        </div>
      )}

      {/* Input */}
      <div style={{ padding: "12px 20px 20px", flexShrink: 0, background: "#080814" }}>
        <div style={{
          background: "#0d0d1a", border: `1px solid ${B}`, borderRadius: 14,
          padding: "12px 14px 10px", transition: "border-color 0.15s",
        }}
          onFocusCapture={e => e.currentTarget.style.borderColor = PURPLE + "70"}
          onBlurCapture={e => e.currentTarget.style.borderColor = B}
        >
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            rows={2}
            placeholder="Ask anything about your career, workplace, or next interview…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <span style={{ fontSize: 11, color: "#333" }}>Enter to send · Shift+Enter for new line</span>
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              style={{
                padding: "7px 18px", borderRadius: 8, border: "none",
                background: input.trim() && !loading ? PURPLE : "#1a1a2a",
                color: input.trim() && !loading ? "#fff" : "#333",
                fontSize: 12.5, fontWeight: 700, cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                transition: "all 0.15s",
              }}
            >
              Send →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
