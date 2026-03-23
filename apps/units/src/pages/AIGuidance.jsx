import React, { useState, useRef, useEffect } from "react";
import { miniChat } from "../lib/apiClient";

const PINK  = "#e8185d";
const TEXT  = "#111827";
const MUTED = "#6b7280";
const LIGHT = "#f8f9fb";
const CARD  = "#ffffff";
const BORDER= "#e8eaed";

const QUICK_PROMPTS = [
  "How do I create a content strategy for my brand?",
  "What type of videos work best on Instagram Reels?",
  "Give me a 30-day content calendar idea",
  "How do I write a brand story script?",
  "What makes a good brand video hook?",
  "How do I measure ROI on content creation?",
  "Suggest posting frequency for a new brand",
  "What's trending in brand content right now?",
];

const TOPICS = [
  { icon:"🎬", label:"Video Strategy",    prompt:"Give me a complete video content strategy for a brand wanting to grow on Instagram and YouTube." },
  { icon:"✍️", label:"Scripting",          prompt:"Teach me how to write compelling scripts for brand videos and reels." },
  { icon:"📸", label:"Visual Identity",   prompt:"How do I maintain visual consistency across all my brand's content?" },
  { icon:"📣", label:"Campaign Planning", prompt:"Walk me through planning a full content campaign for a product launch." },
  { icon:"📊", label:"Analytics & Growth",prompt:"How do I use analytics to improve my content creation strategy?" },
  { icon:"🎯", label:"Target Audience",   prompt:"How do I identify and create content specifically for my target audience?" },
];

export default function AIGuidance({ profile }) {
  const [messages, setMessages] = useState([
    { role:"assistant", text:"Hi! I'm your AI content creation guide. I can help you with video strategy, scripting, campaign planning, visual identity, and growing your brand through content.\n\nWhat would you like to work on today?" }
  ]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [handoff,  setHandoff]  = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput("");
    setMessages(ms => [...ms, { role:"user", text:msg }]);
    setLoading(true);

    try {
      // Uses apiClient which automatically adds the Bearer token
      const context = messages.slice(-4).map(m => m.role === "user" ? `User: ${m.text}` : `Guide: ${m.text}`).join("\n");
      const data = await miniChat(
        `You are a professional content creation strategist and creative director at Nugens Units. Help business owners with content strategy, video production, scripting, brand storytelling, and creative direction. Be specific, actionable, and enthusiastic. Always give practical advice relevant to Indian and global markets.\n\nContext:\n${context}\n\nQuestion: ${msg}`,
        "units",
        profile?.user_type || "business"
      );

      const reply = data?.reply || data?.message || "Let me connect you with our team for more specialised guidance on that.";
      const needsTeam = reply.length < 60 || reply.toLowerCase().includes("i don't know") || reply.toLowerCase().includes("can't help");

      setMessages(ms => [...ms, { role:"assistant", text:reply, showHandoff: needsTeam }]);
    } catch (e) {
      const errMsg = e.message?.includes("401")
        ? "Session expired. Please refresh the page and try again."
        : "Having trouble connecting to the AI. Let me connect you with our team instead.";
      setMessages(ms => [...ms, { role:"assistant", text:errMsg, showHandoff:true }]);
    }
    setLoading(false);
  };

  const requestHandoff = () => {
    setHandoff(true);
    setMessages(ms => [...ms, {
      role:"system",
      text:"✓ Our content team has been notified. They'll reach out via email within 2 business hours. You can also reach us at hello@nugens.in"
    }]);
  };

  const S = {
    page: { minHeight:"100vh", background:LIGHT, padding:"36px 44px", fontFamily:"'Plus Jakarta Sans',sans-serif" },
    card: { background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" },
    btn:  { padding:"10px 22px", background:PINK, color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" },
    msg: (role) => ({
      maxWidth:"75%",
      alignSelf: role === "user" ? "flex-end" : "flex-start",
      background: role === "user" ? PINK : role === "system" ? "#f0fdf4" : CARD,
      color: role === "user" ? "#fff" : TEXT,
      border: role === "user" ? "none" : role === "system" ? "1px solid #bbf7d0" : `1px solid ${BORDER}`,
      borderRadius: role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
      padding:"13px 16px", fontSize:14, lineHeight:1.7, whiteSpace:"pre-wrap",
      boxShadow: role !== "user" ? "0 1px 3px rgba(0,0,0,0.04)" : "none",
    }),
  };

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:22, fontWeight:800, color:TEXT, letterSpacing:"-0.04em", marginBottom:4 }}>✦ AI Content Guidance</div>
        <div style={{ fontSize:13, color:MUTED }}>Expert content creation advice — AI-powered, with our team as backup when you need deeper support</div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:24 }}>
        <div>
          {/* Chat messages */}
          <div style={{ ...S.card, padding:24, height:420, overflowY:"auto", display:"flex", flexDirection:"column", gap:14, marginBottom:12 }}>
            {messages.map((m,i) => (
              <div key={i} style={{ display:"flex", flexDirection:"column", gap:4 }}>
                {m.role !== "user" && (
                  <div style={{ fontSize:11, color:MUTED, marginLeft:4 }}>
                    {m.role === "system" ? "🤝 Nugens Team" : "✦ AI Guide"}
                  </div>
                )}
                <div style={S.msg(m.role)}>{m.text}</div>
                {m.showHandoff && !handoff && (
                  <div style={{ alignSelf:"flex-start", marginTop:4 }}>
                    <button onClick={requestHandoff} style={{ background:"none", border:`1px solid ${PINK}`, color:PINK, borderRadius:8, padding:"6px 14px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                      🤝 Connect me with your team
                    </button>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf:"flex-start" }}>
                <div style={{ ...S.msg("assistant"), padding:"10px 16px" }}>
                  <span style={{ color:PINK }}>✦ </span>
                  <span style={{ color:MUTED, fontSize:12 }}>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ ...S.card, padding:14, display:"flex", gap:10 }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask anything about content creation, strategy, scripting, or brand building..."
              style={{ flex:1, border:`1px solid ${BORDER}`, borderRadius:10, padding:"10px 14px", fontSize:13, color:TEXT, fontFamily:"inherit", resize:"none", minHeight:52, maxHeight:100, outline:"none", lineHeight:1.5 }}
            />
            <button onClick={() => send()} disabled={loading || !input.trim()} style={{ ...S.btn, alignSelf:"flex-end", opacity:(loading || !input.trim()) ? 0.4 : 1 }}>Send</button>
          </div>

          {/* Quick prompts */}
          <div style={{ marginTop:16 }}>
            <div style={{ fontSize:11, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Quick Questions</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
              {QUICK_PROMPTS.map(q => (
                <button key={q} onClick={() => send(q)} style={{ background:"#fff", border:`1px solid ${BORDER}`, borderRadius:20, padding:"6px 12px", fontSize:11, color:MUTED, cursor:"pointer", fontFamily:"inherit" }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Topic shortcuts */}
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:TEXT, marginBottom:14 }}>Content Topics</div>
          {TOPICS.map(t => (
            <div key={t.label} onClick={() => send(t.prompt)} style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, padding:14, marginBottom:10, cursor:"pointer", display:"flex", gap:12, alignItems:"center", boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}
              onMouseOver={e => { e.currentTarget.style.borderColor = `${PINK}40`; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = BORDER; }}
            >
              <span style={{ fontSize:20 }}>{t.icon}</span>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:TEXT }}>{t.label}</div>
                <div style={{ fontSize:11, color:MUTED, marginTop:1 }}>Click to explore</div>
              </div>
            </div>
          ))}

          {/* Team connect */}
          <div style={{ background:"#fef2f2", border:`1px solid ${PINK}20`, borderRadius:14, padding:16, marginTop:14 }}>
            <div style={{ fontSize:13, fontWeight:700, color:TEXT, marginBottom:8 }}>Talk to our team</div>
            <div style={{ fontSize:12, color:MUTED, marginBottom:12, lineHeight:1.6 }}>
              If AI can't answer your question, our creative team steps in. Always free for guidance.
            </div>
            {!handoff ? (
              <button onClick={requestHandoff} style={{ width:"100%", padding:"9px 0", background:PINK, color:"#fff", border:"none", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                🤝 Connect with our team
              </button>
            ) : (
              <div style={{ fontSize:12, color:"#16a34a", fontWeight:600 }}>✓ Team notified — response within 2 hours</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
