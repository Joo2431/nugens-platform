import React, { useState, useRef, useEffect } from "react";
import { supabase } from "../lib/supabase";

const BACKEND = "https://nugens-platform.onrender.com";
const PINK    = "#e8185d";

const PRODUCT_CONFIG = {
  nugens:  { color:PINK,      label:"Nugens",     icon:"✦", title:"Gen-E Mini" },
  gene:    { color:"#7c3aed", label:"Gen-E",       icon:"◎", title:"Gen-E Mini" },
  hyperx:  { color:PINK,      label:"HyperX",      icon:"⬡", title:"HyperX AI"  },
  digihub: { color:PINK,      label:"DigiHub",     icon:"◈", title:"DigiHub AI" },
  units:   { color:PINK,      label:"The Units",   icon:"◇", title:"Units AI"   },
};

const QUICK_PROMPTS = {
  individual: {
    nugens:  ["How does Nugens work?", "What products do you offer?", "Gen-E pricing", "Get started"],
    gene:    ["Improve my resume", "Career advice", "Interview tips", "Skill gap"],
    hyperx:  ["Recommend a course", "Study tips", "What certs can I get?", "Course roadmap"],
    digihub: ["Content strategy tips", "Best posting times", "Grow my brand", "Campaign ideas"],
    units:   ["Brand story ideas", "Content for business", "Entrepreneur advice", "Start a brand"],
  },
  business: {
    nugens:  ["Business plan options", "Train my team", "Brand growth", "What's DigiHub?"],
    gene:    ["Write a job description", "Hiring strategy", "Team skill gaps", "Salary benchmark"],
    hyperx:  ["Train my team", "Business courses", "Track team progress", "Bulk access"],
    digihub: ["Grow my brand", "Find talent", "Marketing tools", "Content planning"],
    units:   ["Corporate events", "Brand content packages", "Book a team", "Turnaround times"],
  },
};

// ── Always get a fresh token — never use stale state ──────────────────────
async function getFreshToken() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch {
    return null;
  }
}

export default function GenEMiniPopup({ product = "nugens" }) {
  const cfg    = PRODUCT_CONFIG[product] || PRODUCT_CONFIG.nugens;
  const ACCENT = cfg.color;

  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [unread,   setUnread]   = useState(0);
  const [profile,  setProfile]  = useState(null);
  const [ready,    setReady]    = useState(false); // show popup once session checked
  const bottomRef = useRef(null);

  // Load profile on mount — but don't block rendering on it
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setReady(true); // always show popup regardless of auth state
      if (!session?.user) return;

      supabase
        .from("profiles")
        .select("user_type, goal, business_need, full_name, plan")
        .eq("id", session.user.id)
        .single()
        .then(({ data }) => {
          if (!data) return;
          setProfile(data);
          const name  = (data.full_name || "").split(" ")[0] || "there";
          const uType = data.user_type || "individual";
          const greet = uType === "business"
            ? `Hi ${name}! I'm ${cfg.title} — your ${cfg.label} assistant. How can I help your business today?`
            : `Hi ${name}! I'm ${cfg.title} — your ${cfg.label} assistant. Ask me anything!`;
          setMessages([{ role:"assistant", content:greet }]);
        });
    });

    // Also subscribe to auth changes (handles token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, session) => {
      if (session?.user && messages.length === 0) {
        const { data } = await supabase
          .from("profiles")
          .select("user_type, goal, business_need, full_name, plan")
          .eq("id", session.user.id)
          .single();
        if (data) setProfile(data);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:"smooth" }), 60);
    }
  }, [open, messages]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");

    // Add user message immediately
    setMessages(prev => [...prev, { role:"user", content:msg }]);
    setLoading(true);

    try {
      // ─── KEY FIX: always fetch a fresh token at send time ───────────────
      // Never rely on stale token state — expired tokens cause silent 401 failures
      const token = await getFreshToken();

      const res = await fetch(`${BACKEND}/api/mini-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message:      msg,
          product,
          userType:     profile?.user_type     || "individual",
          goal:         profile?.goal          || null,
          businessNeed: profile?.business_need || null,
        }),
      });

      if (!res.ok) {
        // Provide a helpful error instead of generic failure
        const status = res.status;
        let errMsg = "Having trouble connecting. Please try again.";
        if (status === 401) errMsg = "Session expired — please refresh the page and try again.";
        if (status === 429) errMsg = "Too many requests. Please wait a moment and try again.";
        if (status >= 500) errMsg = "Server is starting up (it sleeps when idle). Please wait 30 seconds and try again.";
        setMessages(prev => [...prev, { role:"assistant", content:errMsg }]);
        setLoading(false);
        return;
      }

      const data  = await res.json();
      const reply = data?.reply || data?.message || "I couldn't get a response. Please try again.";
      setMessages(prev => [...prev, { role:"assistant", content:reply }]);
      if (!open) setUnread(u => u + 1);

    } catch (err) {
      const isAbort  = err.name === "AbortError";
      const isOffline = !navigator.onLine;
      setMessages(prev => [...prev, {
        role:"assistant",
        content: isOffline
          ? "You appear to be offline. Please check your connection."
          : isAbort
          ? "Request timed out. The server may be waking up — please try again."
          : "Connection error. Please try again in a moment.",
      }]);
    }

    setLoading(false);
  };

  const userType = profile?.user_type || "individual";
  const prompts  = (QUICK_PROMPTS[userType] || QUICK_PROMPTS.individual)[product]
                || QUICK_PROMPTS.individual.nugens;

  if (!ready) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes gm-in { from{opacity:0;transform:scale(0.92) translateY(12px)} to{opacity:1;transform:none} }
        @keyframes gm-dot { 0%,80%,100%{opacity:0.3;transform:scale(0.8)} 40%{opacity:1;transform:scale(1)} }
        .gm-dot { width:6px;height:6px;border-radius:50%;background:#d1d5db;display:inline-block;animation:gm-dot 1.2s infinite; }
        .gm-ta { width:100%;background:transparent;border:none;resize:none;font-size:13px;line-height:1.55;color:#111;outline:none;font-family:'Plus Jakarta Sans',sans-serif;max-height:80px;overflow-y:auto; }
        .gm-ta::placeholder { color:#9ca3af; }
        .gm-user { max-width:80%;background:${ACCENT};color:#fff;padding:10px 13px;border-radius:16px 16px 4px 16px;font-size:13px;line-height:1.65;word-break:break-word; }
        .gm-ai   { max-width:85%;background:#f8f9fb;border:1px solid #e8eaed;color:#111;padding:10px 13px;border-radius:16px 16px 16px 4px;font-size:13px;line-height:1.65;word-break:break-word; }
        .gm-quick { padding:5px 10px;border-radius:20px;border:1px solid #e8eaed;background:#fff;font-size:11px;font-weight:500;color:#6b7280;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.13s; }
        .gm-quick:hover { background:#fef2f2;border-color:${ACCENT}40;color:${ACCENT}; }
        .gm-scroll::-webkit-scrollbar { width:3px; }
        .gm-scroll::-webkit-scrollbar-thumb { background:#e5e7eb;border-radius:4px; }
        .gm-badge { position:absolute;top:-4px;right:-4px;width:18px;height:18px;background:#ef4444;border-radius:50%;font-size:10px;font-weight:700;color:#fff;display:flex;align-items:center;justify-content:center;border:2px solid #fff; }
      `}</style>

      <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>

        {/* Chat panel */}
        {open && (
          <div style={{
            position:"absolute", bottom:62, right:0,
            width:320, height:460,
            background:"#fff", border:"1px solid #e8eaed",
            borderRadius:18, boxShadow:"0 8px 48px rgba(0,0,0,0.16)",
            display:"flex", flexDirection:"column",
            animation:"gm-in 0.2s ease", overflow:"hidden",
          }}>

            {/* Header */}
            <div style={{ background:`linear-gradient(135deg,${ACCENT},${ACCENT}cc)`, padding:"13px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, color:"#fff" }}>
                  {cfg.icon}
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:800, color:"#fff", lineHeight:1.1 }}>
                    {cfg.title}
                    <span style={{ fontSize:9, fontWeight:600, color:"rgba(255,255,255,0.8)", background:"rgba(255,255,255,0.2)", padding:"1px 7px", borderRadius:4, marginLeft:6, verticalAlign:"middle" }}>
                      {cfg.label}
                    </span>
                  </div>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,0.7)", marginTop:1 }}>
                    {userType === "business" ? "Business AI · Nugens" : "Career AI · Nugens"}
                  </div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} style={{ background:"rgba(255,255,255,0.15)", border:"none", cursor:"pointer", color:"#fff", fontSize:14, lineHeight:1, padding:"5px 7px", borderRadius:7 }}>
                ✕
              </button>
            </div>

            {/* Messages */}
            <div className="gm-scroll" style={{ flex:1, overflowY:"auto", padding:"14px 13px 8px", display:"flex", flexDirection:"column", gap:10, background:"#fafbfc" }}>

              {/* Quick prompts — only on first open */}
              {messages.length <= 1 && (
                <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:4 }}>
                  {prompts.map(p => (
                    <button key={p} className="gm-quick" onClick={() => send(p)}>{p}</button>
                  ))}
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start", alignItems:"flex-end", gap:7 }}>
                  {m.role === "assistant" && (
                    <div style={{ width:24, height:24, borderRadius:"50%", background:`${ACCENT}15`, border:`1px solid ${ACCENT}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:ACCENT, flexShrink:0 }}>
                      {cfg.icon}
                    </div>
                  )}
                  <div className={m.role === "user" ? "gm-user" : "gm-ai"}>
                    {m.content}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div style={{ display:"flex", alignItems:"flex-end", gap:7 }}>
                  <div style={{ width:24, height:24, borderRadius:"50%", background:`${ACCENT}15`, border:`1px solid ${ACCENT}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:ACCENT, flexShrink:0 }}>
                    {cfg.icon}
                  </div>
                  <div className="gm-ai" style={{ display:"flex", gap:4, alignItems:"center", padding:"12px 14px" }}>
                    {[0, 0.2, 0.4].map((d, i) => (
                      <span key={i} className="gm-dot" style={{ animationDelay:`${d}s` }}/>
                    ))}
                  </div>
                </div>
              )}

              <div ref={bottomRef}/>
            </div>

            {/* Input */}
            <div style={{ padding:"10px 12px 14px", flexShrink:0, borderTop:"1px solid #f0f0f0", background:"#fff" }}>
              <div style={{ background:"#f8f9fb", border:"1.5px solid #e8eaed", borderRadius:12, padding:"9px 12px", transition:"border-color 0.15s" }}
                onFocusCapture={e => e.currentTarget.style.borderColor = `${ACCENT}60`}
                onBlurCapture={e  => e.currentTarget.style.borderColor = "#e8eaed"}>
                <textarea
                  className="gm-ta"
                  rows={2}
                  placeholder="Ask anything…"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                />
                <div style={{ display:"flex", justifyContent:"flex-end", marginTop:4 }}>
                  <button
                    onClick={() => send()}
                    disabled={!input.trim() || loading}
                    style={{ padding:"5px 16px", borderRadius:8, border:"none", background:input.trim()&&!loading ? ACCENT : "#e5e7eb", color:input.trim()&&!loading ? "#fff" : "#9ca3af", fontSize:12, fontWeight:700, cursor:input.trim()&&!loading ? "pointer" : "not-allowed", fontFamily:"inherit", transition:"all 0.14s" }}
                  >
                    Send →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating trigger button */}
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            width:50, height:50, borderRadius:"50%",
            background:open ? "#fff" : ACCENT,
            border: open ? `2px solid #e8eaed` : `2px solid ${ACCENT}`,
            boxShadow: open ? "0 2px 8px rgba(0,0,0,0.1)" : `0 4px 20px ${ACCENT}55`,
            cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:open ? 16 : 20, color:open ? ACCENT : "#fff",
            transition:"all 0.2s", position:"relative",
          }}
        >
          {open ? "✕" : "✦"}
          {unread > 0 && !open && (
            <div className="gm-badge">{unread}</div>
          )}
        </button>
      </div>
    </>
  );
}