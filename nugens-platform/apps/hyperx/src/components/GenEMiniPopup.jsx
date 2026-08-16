import React, { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import genEVideo from "../assets/gen-e.mp4";

const BACKEND = "https://nugens-platform-production.up.railway.app";
const PINK    = "#e8185d";

const PRODUCT_CONFIG = {
  nugens:  { color:PINK,      label:"Nugens",    icon:"✦", title:"Gen-E Mini" },
  gene:    { color:"#7c3aed", label:"Gen-E",      icon:"◎", title:"Gen-E Mini" },
  hyperx:  { color:PINK,      label:"HyperX",     icon:"⬡", title:"HyperX AI"  },
  digihub: { color:PINK,      label:"DigiHub",    icon:"◈", title:"DigiHub AI" },
  units:   { color:PINK,      label:"The Units",  icon:"◇", title:"Units AI"   },
};

/** Small animated mascot — friendly blinking face with a twinkling spark,
 *  used on the floating launcher button instead of a static glyph. */
function GenEMascot({ color, size = 30 }) {
  return (
    <svg className="gm-mascot" width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="26" r="15" fill="#fff" fillOpacity="0.96" />
      <ellipse className="gm-mascot-eye"  cx="18.5" cy="26" rx="2.3" ry="3" fill={color} />
      <ellipse className="gm-mascot-eye2" cx="29.5" cy="26" rx="2.3" ry="3" fill={color} />
      <path d="M19 32c1.6 1.4 3.4 2 5 2s3.4-0.6 5-2" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
      <g className="gm-mascot-spark">
        <path d="M24 4l1.4 4.6L30 10l-4.6 1.4L24 16l-1.4-4.6L18 10l4.6-1.4L24 4z" fill="#fff" />
      </g>
    </svg>
  );
}

const MASCOT_EMOTIONS = [
  { cue:"Hi!", className:"gm-character--happy" },
  { cue:"Need help?", className:"gm-character--curious" },
  { cue:"Thinking...", className:"gm-character--thinking" },
  { cue:"Let's go", className:"gm-character--excited" },
];

const MASCOT_SPOTS = [
  { bottom:16, right:16 },
];  /* pinned — random mid-screen spots removed (widget overlapped content) */

const QUICK_PROMPTS = {
  individual: {
    nugens:  ["How does Nugens work?","What products do you offer?","Gen-E pricing","Get started"],
    gene:    ["Improve my resume","Career advice","Interview tips","Skill gap"],
    hyperx:  ["Recommend a course","Study tips","What certs can I get?","Course roadmap"],
    digihub: ["Content strategy tips","Best posting times","Grow my brand","Campaign ideas"],
    units:   ["Brand story ideas","Content for business","Entrepreneur advice","Start a brand"],
  },
  business: {
    nugens:  ["Business plan options","Train my team","Brand growth","What's DigiHub?"],
    gene:    ["Write a job description","Hiring strategy","Team skill gaps","Salary benchmark"],
    hyperx:  ["Train my team","Business courses","Track team progress","Bulk access"],
    digihub: ["Grow my brand","Find talent","Marketing tools","Content planning"],
    units:   ["Corporate events","Brand content packages","Book a team","Turnaround times"],
  },
};

async function getFreshToken() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch { return null; }
}

// Wake the server silently — call this as early as possible
let _serverUp = false;
async function pingServer() {
  if (_serverUp) return true;
  try {
    const r = await fetch(`${BACKEND}/health`, { signal: AbortSignal.timeout(10000) });
    if (r.ok) { _serverUp = true; return true; }
    return false;
  } catch { return false; }
}

export default function GenEMiniPopup({ product = "nugens" }) {
  const cfg    = PRODUCT_CONFIG[product] || PRODUCT_CONFIG.nugens;
  const ACCENT = cfg.color;

  const [open,        setOpen]        = useState(false);
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [unread,      setUnread]      = useState(0);
  const [profile,     setProfile]     = useState(null);
  const [serverReady, setServerReady] = useState(_serverUp);
  const [waking,      setWaking]      = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const [mascotVisible, setMascotVisible] = useState(true);
  const [mascotEmotion, setMascotEmotion] = useState(MASCOT_EMOTIONS[0]);
  const [mascotSpot, setMascotSpot] = useState(MASCOT_SPOTS[0]);
  const retryTimerRef = useRef(null);
  const bottomRef     = useRef(null);
  const abortRef      = useRef(null); // cancel in-flight fetch when panel closes or component unmounts

  useEffect(() => {
    if (open) {
      setMascotVisible(true);
      return;
    }

    let showTimer;
    let hideTimer;
    const pickNextPop = () => {
      showTimer = setTimeout(() => {
        setMascotEmotion(MASCOT_EMOTIONS[Math.floor(Math.random() * MASCOT_EMOTIONS.length)]);
        setMascotSpot(MASCOT_SPOTS[Math.floor(Math.random() * MASCOT_SPOTS.length)]);
        setMascotVisible(true);
        hideTimer = setTimeout(() => {
          setMascotVisible(false);
          pickNextPop();
        }, 9000 + Math.random() * 5000);
      }, 5000 + Math.random() * 9000);
    };

    hideTimer = setTimeout(() => {
      setMascotVisible(false);
      pickNextPop();
    }, 12000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [open]);

  // Load profile silently on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      supabase.from("profiles")
        .select("user_type,goal,business_need,full_name,plan")
        .eq("id", session.user.id).single()
        .then(({ data }) => {
          if (!data) return;
          setProfile(data);
          const name  = (data.full_name || "").split(" ")[0] || "there";
          const uType = data.user_type || "individual";
          const greet = uType === "business"
            ? `Hi ${name}! I'm ${cfg.title}. Ask me about ${
                product === "hyperx"  ? "team training and business courses" :
                product === "digihub" ? "brand growth and marketing tools"   :
                product === "units"   ? "production services and bookings"   :
                "Nugens products and business tools"}.`
            : `Hi ${name}! I'm ${cfg.title}. Ask me anything about ${
                product === "hyperx"  ? "courses, certs and learning paths"  :
                product === "digihub" ? "content creation and personal brand":
                product === "units"   ? "brand guidance and idea validation" :
                "Nugens products and your career"}.`;
          setMessages([{ role:"assistant", content:greet }]);
        });
    });
  }, []);

  // Wake server as soon as popup opens
  useEffect(() => {
    if (!open || _serverUp) return;
    setWaking(true);
    pingServer().then(up => {
      setServerReady(up);
      setWaking(false);
    });
  }, [open]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:"smooth" }), 60);
    }
  }, [open, messages]);

  // Cleanup retry timer on unmount
  useEffect(() => () => clearInterval(retryTimerRef.current), []);

  // Cancel any in-flight streaming request when the component unmounts
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  // Cancel in-flight request when panel is closed mid-stream (prevents "Premature close" on server)
  useEffect(() => {
    if (!open && loading) {
      abortRef.current?.abort();
      abortRef.current = null;
      setLoading(false);
    }
  }, [open, loading]);

  const startRetryCountdown = useCallback((seconds, pendingMsg) => {
    setRetryCountdown(seconds);
    clearInterval(retryTimerRef.current);
    retryTimerRef.current = setInterval(() => {
      setRetryCountdown(prev => {
        if (prev <= 1) {
          clearInterval(retryTimerRef.current);
          // Auto-retry the message
          if (pendingMsg) doSend(pendingMsg, true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const doSend = useCallback(async (msg, isRetry = false) => {
    if (!msg || loading) return;
    setLoading(true);
    if (!isRetry) setRetryCountdown(0);

    // Cancel any previous in-flight request before starting a new one
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timeoutId = window.setTimeout(() => controller.abort("timeout"), 25000);

    try {
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
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const status = res.status;
        if (status >= 500) {
          // Server cold-starting — auto-retry after countdown
          _serverUp = false;
          setServerReady(false);
          const wait = status === 503 ? 35 : 25;
          setMessages(prev => {
            // Replace last loading state or add new message
            const withoutLoading = prev.filter(m => !m._loading);
            return [...withoutLoading, {
              role:"assistant",
              content:`__WAKING__`,
              _waking: true,
              _retryMsg: msg,
              _wait: wait,
            }];
          });
          setLoading(false);
          startRetryCountdown(wait, msg);
          return;
        }
        if (status === 401) {
          setMessages(prev => [...prev, { role:"assistant", content:"Session expired — please refresh the page." }]);
          setLoading(false);
          return;
        }
        if (status === 429) {
          setMessages(prev => [...prev, { role:"assistant", content:"Too many requests. Please wait a moment." }]);
          setLoading(false);
          return;
        }
      }

      _serverUp = true;
      setServerReady(true);

      if (!res.body) {
        // Fallback for environments without streaming support
        const data  = await res.json();
        const reply = data?.reply || data?.message || "No response. Please try again.";
        setMessages(prev => {
          const clean = prev.filter(m => !m._waking);
          return [...clean, { role:"assistant", content:reply }];
        });
        if (!open) setUnread(u => u + 1);
        setLoading(false);
        return;
      }

      // Add a live bubble that fills in as chunks arrive
      setMessages(prev => {
        const clean = prev.filter(m => !m._waking);
        return [...clean, { role:"assistant", content:"", _streaming:true }];
      });

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText  = "";
      let streamErr = null;
      let firstChunk = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value, { stream:true }).split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const p = JSON.parse(line.slice(6));
            if (p.chunk) {
              if (firstChunk) { firstChunk = false; setLoading(false); } // swap typing dots for live text
              fullText += p.chunk;
              setMessages(prev => prev.map(m => m._streaming ? { ...m, content: fullText } : m));
            }
            if (p.error) streamErr = p.error;
          } catch {}
        }
      }

      setMessages(prev => prev.map(m => m._streaming
        ? { role:"assistant", content: streamErr || fullText || "No response. Please try again." }
        : m));
      if (!open) setUnread(u => u + 1);
      abortRef.current = null;

    } catch (err) {
      const isTimeoutAbort = controller.signal.reason === "timeout";
      // Intentional cancellation (user closed panel or sent new message) — don't show error
      if (err.name === "AbortError" && !isTimeoutAbort) {
        setMessages(prev => prev.filter(m => !m._streaming));
        setLoading(false);
        return;
      }

      const msg503 = isTimeoutAbort
        ? "The server took too long to respond. Please try again."
        : err.name === "TimeoutError"
        ? "Server is waking up — retrying in 30 seconds…"
        : !navigator.onLine
        ? "You appear to be offline. Check your connection."
        : "Connection error. Please try again.";

      if (isTimeoutAbort || err.name === "TimeoutError") {
        setMessages(prev => {
          const clean = prev.filter(m => !m._waking);
          return [...clean, { role:"assistant", content:"__WAKING__", _waking:true, _retryMsg:msg, _wait:30 }];
        });
        setLoading(false);
        startRetryCountdown(30, msg);
        return;
      }

      setMessages(prev => [...prev, { role:"assistant", content:msg503 }]);
    } finally {
      clearTimeout(timeoutId);
    }
    setLoading(false);
  }, [loading, profile, product, open, startRetryCountdown]);

  const send = useCallback((text) => {
    const msg = (text || input).trim();
    if (!msg) return;
    setInput("");
    setMessages(prev => [...prev, { role:"user", content:msg }]);
    doSend(msg);
  }, [input, doSend]);

  const userType = profile?.user_type || "individual";
  const prompts  = (QUICK_PROMPTS[userType] || QUICK_PROMPTS.individual)[product]
                || QUICK_PROMPTS.individual.nugens;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes gm-in  { from{opacity:0;transform:scale(0.92) translateY(12px)} to{opacity:1;transform:none} }
        @keyframes gm-dot { 0%,80%,100%{opacity:0.3;transform:scale(0.8)} 40%{opacity:1;transform:scale(1)} }
        @keyframes gm-spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes gm-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .gm-dot  { width:6px;height:6px;border-radius:50%;background:#d1d5db;display:inline-block;animation:gm-dot 1.2s infinite; }
        .gm-spin { animation:gm-spin 1.2s linear infinite; display:inline-block; }
        .gm-ta   { width:100%;background:transparent;border:none;resize:none;font-size:13px;line-height:1.55;color:#111;outline:none;font-family:'Plus Jakarta Sans',sans-serif;max-height:80px;overflow-y:auto; }
        .gm-ta::placeholder { color:#9ca3af; }
        .gm-user { max-width:82%;background:${ACCENT};color:#fff;padding:10px 13px;border-radius:16px 16px 4px 16px;font-size:13px;line-height:1.65;word-break:break-word; }
        .gm-ai   { max-width:87%;background:#f8f9fb;border:1px solid #e8eaed;color:#111;padding:10px 13px;border-radius:16px 16px 16px 4px;font-size:13px;line-height:1.65;word-break:break-word; }
        .gm-wake { max-width:87%;background:#fff7ed;border:1px solid #fed7aa;color:#92400e;padding:12px 14px;border-radius:16px 16px 16px 4px;font-size:12px;line-height:1.7; }
        .gm-quick { padding:5px 10px;border-radius:20px;border:1px solid #e8eaed;background:#fff;font-size:11px;font-weight:500;color:#6b7280;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.13s; }
        .gm-quick:hover { background:#fef2f2;border-color:${ACCENT}40;color:${ACCENT}; }
        .gm-retry { margin-top:8px;padding:6px 14px;background:${ACCENT};color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif; }
        .gm-retry:hover { opacity:0.9; }
        .gm-scroll::-webkit-scrollbar { width:3px; }
        .gm-scroll::-webkit-scrollbar-thumb { background:#e5e7eb;border-radius:4px; }
        .gm-badge { position:absolute;top:-4px;right:-4px;width:18px;height:18px;background:#ef4444;border-radius:50%;font-size:10px;font-weight:700;color:#fff;display:flex;align-items:center;justify-content:center;border:2px solid #fff; }
        @keyframes gm-bob       { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        @keyframes gm-blink     { 0%,90%,100%{transform:scaleY(1)} 95%{transform:scaleY(0.12)} }
        @keyframes gm-twinkle   { 0%,100%{opacity:1;transform:scale(1) rotate(0deg)} 50%{opacity:0.55;transform:scale(0.82) rotate(20deg)} }
        @keyframes gm-wave      { 0%,100%{transform:rotate(0deg)} 25%{transform:rotate(-12deg)} 75%{transform:rotate(12deg)} }
        .gm-mascot       { animation: gm-bob 2.6s ease-in-out infinite; }
        .gm-mascot:hover .gm-mascot-spark { animation: gm-wave 0.6s ease-in-out; }
        .gm-mascot-eye   { animation: gm-blink 4.2s ease-in-out infinite; transform-origin: center; }
        .gm-mascot-eye2  { animation: gm-blink 4.2s ease-in-out infinite; animation-delay: 0.05s; transform-origin: center; }
        .gm-mascot-spark { animation: gm-twinkle 2.4s ease-in-out infinite; transform-origin: center; }
        @keyframes gm-character-pop { from{opacity:0;transform:translateY(18px) scale(0.82)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes gm-character-happy { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-7px) rotate(2deg)} }
        @keyframes gm-character-curious { 0%,100%{transform:rotate(-2deg)} 50%{transform:rotate(5deg)} }
        @keyframes gm-character-thinking { 0%,100%{transform:translateX(0)} 50%{transform:translateX(5px)} }
        @keyframes gm-character-excited { 0%,100%{transform:scale(1)} 50%{transform:scale(1.07)} }
        .gm-character {
          width:54px;
          height:54px;
          border:none;
          border-radius:50%;
          padding:0;
          background:transparent;
          box-shadow:none;
          cursor:pointer;
          position:relative;
          overflow:visible;
          animation:gm-character-pop 0.3s ease both;
        }        .gm-character:hover { filter: drop-shadow(0 20px 34px rgba(14,165,233,0.32)); }
        .gm-character__video {
          width:100%;
          height:100%;
          object-fit:cover;
          object-position:center;
          border-radius:50%;
          display:block;
          background:transparent;
          
          mix-blend-mode:screen;
          filter:drop-shadow(0 14px 24px rgba(15,23,42,0.22));
        }        .gm-character__cue {
          position:absolute;
          right:calc(100% + 8px);
          top:50%;
          transform:translateY(-50%);
          max-width:104px;
          background:#fff;
          color:#0f172a;
          border:1px solid #e8eaed;
          border-radius:14px;
          padding:7px 10px;
          font-size:11px;
          font-weight:800;
          line-height:1.2;
          white-space:nowrap;
          box-shadow:0 10px 26px rgba(15,23,42,0.12);
        }
        .gm-character__mood {
          position:absolute;
          right:2px;
          top:2px;
          width:22px;
          height:22px;
          border-radius:50%;
          background:${ACCENT};
          border:3px solid #fff;
          box-shadow:0 6px 14px ${ACCENT}55;
        }
        .gm-character--happy .gm-character__video { animation:gm-character-happy 2.2s ease-in-out infinite; filter:saturate(1.08) brightness(1.04); }
        .gm-character--curious .gm-character__video { animation:gm-character-curious 2.6s ease-in-out infinite; filter:saturate(1.04); }
        .gm-character--thinking .gm-character__video { animation:gm-character-thinking 2.8s ease-in-out infinite; filter:saturate(0.94) contrast(1.04); }
        .gm-character--excited .gm-character__video { animation:gm-character-excited 1.15s ease-in-out infinite; filter:saturate(1.2) brightness(1.06); }
        @media(max-width:768px){
          .gm-chat{width:min(calc(100vw - 24px), 340px)!important;right:12px!important;height:min(58vh, 440px)!important;max-height:440px!important;}
          .gm-character{width:48px!important;height:48px!important;}
          .gm-character__cue{display:none!important;}
        }
      `}</style>

      <div style={{
        position:"fixed",
        zIndex:9999,
        fontFamily:"'Plus Jakarta Sans',sans-serif",
        ...(open ? { bottom:16, right:16 } : mascotSpot),
        pointerEvents: open || mascotVisible ? "auto" : "none",
      }}>

        {/* Chat panel */}
        {open && (
          <div className="gm-chat" style={{
            position:"absolute", bottom:62, right:0,
            width:300, height:420,
            background:"#fff", border:"1px solid #e8eaed",
            borderRadius:18, boxShadow:"0 8px 48px rgba(0,0,0,0.16)",
            display:"flex", flexDirection:"column",
            animation:"gm-in 0.2s ease", overflow:"hidden",
          }}>

            {/* Header */}
            <div style={{ background:`linear-gradient(135deg,${ACCENT},${ACCENT}cc)`, padding:"13px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, color:"#fff" }}>
                  {waking ? <span className="gm-spin" style={{fontSize:14}}>⟳</span> : <GenEMascot color={ACCENT} size={22} />}
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:800, color:"#fff", lineHeight:1.1 }}>
                    {cfg.title}
                    <span style={{ fontSize:9, fontWeight:600, color:"rgba(255,255,255,0.8)", background:"rgba(255,255,255,0.2)", padding:"1px 7px", borderRadius:4, marginLeft:6, verticalAlign:"middle" }}>
                      {cfg.label}
                    </span>
                  </div>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,0.75)", marginTop:1 }}>
                    {waking ? "Waking server…" : serverReady ? "Online · Nugens" : `${userType === "business" ? "Business" : "Career"} AI · Nugens`}
                  </div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} style={{ background:"rgba(255,255,255,0.15)", border:"none", cursor:"pointer", color:"#fff", fontSize:14, lineHeight:1, padding:"5px 7px", borderRadius:7 }}>
                ✕
              </button>
            </div>

            {/* Server waking banner — shown when cold-starting */}
            {waking && (
              <div style={{ background:"#fff7ed", borderBottom:"1px solid #fed7aa", padding:"9px 14px", display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                <span className="gm-spin" style={{ color:"#d97706", fontSize:14 }}>⟳</span>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:"#92400e" }}>Server waking up…</div>
                  <div style={{ fontSize:10, color:"#b45309" }}>Usually ready in 15–30 seconds. You can type while waiting.</div>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="gm-scroll" style={{ flex:1, overflowY:"auto", padding:"14px 13px 8px", display:"flex", flexDirection:"column", gap:10, background:"#fafbfc" }}>

              {/* Quick prompts on first open */}
              {messages.length <= 1 && (
                <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:4 }}>
                  {prompts.map(p => (
                    <button key={p} className="gm-quick" onClick={() => send(p)}>{p}</button>
                  ))}
                </div>
              )}

              {messages.map((m, i) => {
                // Waking / retry message — special UI
                if (m._waking) {
                  return (
                    <div key={i} style={{ display:"flex", justifyContent:"flex-start", alignItems:"flex-end", gap:7 }}>
                      <div style={{ width:24, height:24, borderRadius:"50%", background:`${ACCENT}15`, border:`1px solid ${ACCENT}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:ACCENT, flexShrink:0 }}>
                        {cfg.icon}
                      </div>
                      <div className="gm-wake">
                        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                          <span className="gm-spin" style={{ color:"#d97706", fontSize:13 }}>⟳</span>
                          <span style={{ fontWeight:700, fontSize:12 }}>Server is waking up</span>
                        </div>
                        <div style={{ fontSize:11, marginBottom:8 }}>
                          The server sleeps after inactivity. Auto-retrying in{" "}
                          <strong style={{ color:"#d97706" }}>{retryCountdown}s</strong>…
                        </div>
                        <button
                          className="gm-retry"
                          onClick={() => {
                            clearInterval(retryTimerRef.current);
                            setRetryCountdown(0);
                            setMessages(prev => prev.filter(x => !x._waking));
                            doSend(m._retryMsg, true);
                          }}
                        >
                          Retry now →
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
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
                );
              })}

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
              <div
                style={{ background:"#f8f9fb", border:"1.5px solid #e8eaed", borderRadius:12, padding:"9px 12px", transition:"border-color 0.15s" }}
                onFocusCapture={e => e.currentTarget.style.borderColor = `${ACCENT}60`}
                onBlurCapture={e  => e.currentTarget.style.borderColor = "#e8eaed"}
              >
                <textarea
                  className="gm-ta"
                  rows={2}
                  placeholder="Ask anything…"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                />
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:4 }}>
                  {retryCountdown > 0 && (
                    <span style={{ fontSize:10, color:"#d97706" }}>Retrying in {retryCountdown}s…</span>
                  )}
                  <div style={{ marginLeft:"auto" }}>
                    <button
                      onClick={() => send()}
                      disabled={!input.trim() || loading}
                      style={{ padding:"5px 16px", borderRadius:8, border:"none", background:input.trim()&&!loading ? ACCENT : "#e5e7eb", color:input.trim()&&!loading ? "#fff" : "#9ca3af", fontSize:12, fontWeight:700, cursor:input.trim()&&!loading ? "pointer" : "not-allowed", fontFamily:"inherit", transition:"all 0.14s" }}
                    >
                      {loading ? "…" : "Send →"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Random Gen-E character trigger */}
        {(open || mascotVisible) && (
          <button
            className={`gm-character ${mascotEmotion.className}`}
            onClick={() => setOpen(o => !o)}
            aria-label={open ? "Close Gen-E Mini" : "Open Gen-E Mini"}
          >
            {open ? (
              <span style={{ fontSize:22, fontWeight:900, color:ACCENT }}>x</span>
            ) : (
              <>
                <video className="gm-character__video" src={genEVideo} autoPlay loop muted playsInline aria-hidden="true" />
                <span className="gm-character__cue">{mascotEmotion.cue}</span>
                <span className="gm-character__mood" />
                {unread > 0 && <div className="gm-badge">{unread}</div>}
              </>
            )}
          </button>
        )}      </div>
    </>
  );
}
