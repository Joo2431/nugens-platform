import React, { useState, useRef, useEffect } from "react";

const PINK  = "#e8185d";
const TEXT  = "#111827";
const MUTED = "#6b7280";
const LIGHT = "#f8f9fb";
const CARD  = "#ffffff";
const BORDER= "#e8eaed";
const API   = "https://nugens-platform.onrender.com";

const BRAND_SCENARIOS = [
  { id:"launch",  icon:"🚀", title:"Brand Launch",        desc:"Experience launching a brand from scratch — naming, positioning, identity" },
  { id:"content", icon:"📱", title:"Content Creation",    desc:"Work on real content strategy for a D2C brand" },
  { id:"reels",   icon:"🎬", title:"Reels & Video",       desc:"Write scripts and direct a brand reel end-to-end" },
  { id:"social",  icon:"📣", title:"Social Media",        desc:"Build and execute a social media strategy" },
  { id:"pitch",   icon:"💼", title:"Pitch a Client",      desc:"Practice pitching a brand strategy to a client" },
  { id:"crisis",  icon:"⚠️", title:"Brand Crisis",        desc:"Handle a real-world brand PR situation" },
];

const TEAM_MEMBERS = [
  { name:"Rahul K.",    role:"Creative Director",    avatar:"RK", online:true  },
  { name:"Priya M.",    role:"Brand Strategist",     avatar:"PM", online:true  },
  { name:"Dev S.",      role:"Content Producer",     avatar:"DS", online:false },
  { name:"AI Guide",    role:"Always Available",     avatar:"AI", online:true, isAI:true },
];

export default function LiveExperience({ profile }) {
  const [scenario,  setScenario]  = useState(null);
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [teamMode,  setTeamMode]  = useState(false);
  const [sessions,  setSessions]  = useState([
    { id:1, scenario:"Content Creation", date:"Mar 12, 2026", completed:true },
  ]);
  const bottomRef = useRef(null);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[messages]);

  const startScenario = (s) => {
    setScenario(s);
    const intro = {
      "launch":   `Welcome to the Brand Launch experience! 🚀\n\nYou're the founder of a new sustainable fashion brand targeting Gen-Z in India. You have ₹50,000 for your first month.\n\nI'm your creative director. Let's build this brand together.\n\n**Your first task:** What's your brand name idea and why? Think about what you want it to say to your audience.`,
      "content":  `Let's work on content creation for a real brand! 📱\n\nThe brand: "BoldSip" — a premium cold brew coffee brand targeting professionals aged 25-35.\n\n**Challenge:** Create a 2-week Instagram content calendar. Start by telling me: What's the core feeling you want customers to feel when they see BoldSip content?`,
      "reels":    `Time to direct a brand reel! 🎬\n\nClient: A homegrown streetwear brand called "Grunge Theory"\nBudget: ₹15,000\nDeadline: 3 days\n\nYour job: Write the script, describe the shoot, choose the music direction.\n\n**Start here:** In one line, what's the emotional hook of this reel?`,
      "social":   `Social media strategy time! 📣\n\nYou're handling social for a new plant-based food startup called "Greens & Co." launching in Bangalore.\nGoals: 10K Instagram followers in 3 months.\n\n**Task 1:** What platforms will you focus on and why? What does your content mix look like?`,
      "pitch":    `You're in a client pitch! 💼\n\n**Client:** A 5-year-old traditional jewellery brand wanting to go digital. Annual revenue ₹2Cr. No social presence yet.\n**Your brief:** Present a 6-month digital transformation strategy.\n\nStart your pitch. Introduce yourself and your understanding of their situation.`,
      "crisis":   `Brand crisis scenario! ⚠️\n\n**Situation:** A popular food blogger posted that they found a plastic piece in your organic snack product. The post has 50K likes and rising.\n\nYou're the brand manager. It's 9 PM. You have 30 minutes before it goes mainstream.\n\n**What's your first move?**`,
    };
    setMessages([{ role:"mentor", text:intro[s.id], name:"Rahul K." }]);
  };

  const send = async () => {
    const msg = input.trim();
    if (!msg || !scenario) return;
    setInput("");
    setMessages(ms => [...ms, { role:"user", text:msg }]);
    setLoading(true);

    try {
      const context = messages.slice(-6).map(m=>m.role==="user"?`User: ${m.text}`:`Mentor: ${m.text}`).join("\n");
      const res = await fetch(`${API}/api/mini-chat`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          message: `You are a senior creative director at Nugens, a content creation studio. You're running a live brand mentorship session for an aspiring entrepreneur. Scenario: "${scenario.title}". Stay in character — be challenging, specific, and teach through doing. Give feedback, push deeper thinking, ask follow-up questions to guide their learning. Previous context:\n${context}\n\nUser's latest response: ${msg}`,
          userType:"individual",
          product:"units"
        })
      });
      const d = await res.json();
      const reply = d?.reply || d?.message || "Great thinking! Let me hand you over to one of our team members for a deeper dive.";
      const needsTeam = reply.length < 60 || reply.toLowerCase().includes("i can't");

      setMessages(ms=>[...ms,{ role:"mentor", text:reply, name:"AI Guide", needsTeam }]);
    } catch(e) {
      setMessages(ms=>[...ms,{ role:"mentor", text:"Technical hiccup — let me connect you with a team member.", name:"AI Guide", needsTeam:true }]);
    }
    setLoading(false);
  };

  const requestTeam = () => {
    setTeamMode(true);
    setMessages(ms=>[...ms,{ role:"system", text:"🤝 Priya M. (Brand Strategist) has joined the session. She'll take over from here. Expect a response within 10 minutes during business hours." }]);
  };

  const S = {
    page: { minHeight:"100vh", background:LIGHT, padding:"36px 44px", fontFamily:"'Plus Jakarta Sans',sans-serif" },
    card: { background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" },
    btn:  { padding:"10px 22px", background:PINK, color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" },
    msg:  (role) => ({
      maxWidth:"78%",
      alignSelf: role==="user" ? "flex-end" : "flex-start",
      background: role==="user" ? PINK : role==="system" ? "#f0fdf4" : CARD,
      color: role==="user" ? "#fff" : TEXT,
      border: role==="user" ? "none" : role==="system" ? "1px solid #bbf7d0" : `1px solid ${BORDER}`,
      borderRadius: role==="user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
      padding:"13px 16px",
      fontSize:14,
      lineHeight:1.75,
      whiteSpace:"pre-wrap",
      boxShadow: role!=="user" ? "0 1px 3px rgba(0,0,0,0.04)" : "none",
    }),
  };

  if (!scenario) return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>
      <div style={{ fontSize:22, fontWeight:800, color:TEXT, letterSpacing:"-0.04em", marginBottom:4 }}>⬡ Live Brand Experience</div>
      <div style={{ fontSize:13, color:MUTED, marginBottom:32 }}>Work on real brand challenges with our AI mentors and creative team — completely free</div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:24 }}>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:TEXT, marginBottom:16 }}>Choose a Scenario</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:14 }}>
            {BRAND_SCENARIOS.map(s => (
              <div key={s.id} onClick={()=>startScenario(s)} style={{ ...S.card, padding:22, cursor:"pointer", transition:"all 0.2s" }}
                onMouseOver={e=>{e.currentTarget.style.borderColor=PINK+"50";e.currentTarget.style.boxShadow="0 4px 16px rgba(232,24,93,0.08)";}}
                onMouseOut={e=>{e.currentTarget.style.borderColor=BORDER;e.currentTarget.style.boxShadow="0 1px 3px rgba(0,0,0,0.04)";}}
              >
                <div style={{ fontSize:28, marginBottom:10 }}>{s.icon}</div>
                <div style={{ fontSize:14, fontWeight:700, color:TEXT, marginBottom:5 }}>{s.title}</div>
                <div style={{ fontSize:12, color:MUTED, lineHeight:1.55, marginBottom:14 }}>{s.desc}</div>
                <div style={{ fontSize:12, color:PINK, fontWeight:600 }}>Start session →</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ ...S.card, padding:20, marginBottom:14 }}>
            <div style={{ fontSize:13, fontWeight:700, color:TEXT, marginBottom:14 }}>Your Team</div>
            {TEAM_MEMBERS.map(m=>(
              <div key={m.name} style={{ display:"flex", gap:10, alignItems:"center", marginBottom:12 }}>
                <div style={{ width:34, height:34, borderRadius:"50%", background:m.isAI?PINK+"15":"#f3f4f6", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:m.isAI?PINK:TEXT, flexShrink:0, position:"relative" }}>
                  {m.avatar}
                  <div style={{ position:"absolute", bottom:0, right:0, width:9, height:9, borderRadius:"50%", background:m.online?"#22c55e":"#d1d5db", border:"2px solid #fff" }}/>
                </div>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:TEXT }}>{m.name}</div>
                  <div style={{ fontSize:10, color:MUTED }}>{m.role}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ ...S.card, padding:18 }}>
            <div style={{ fontSize:13, fontWeight:700, color:TEXT, marginBottom:12 }}>Past Sessions</div>
            {sessions.map(s=>(
              <div key={s.id} style={{ background:"#f8f9fb", borderRadius:8, padding:"10px 12px" }}>
                <div style={{ fontSize:12, fontWeight:600, color:TEXT }}>{s.scenario}</div>
                <div style={{ fontSize:11, color:MUTED, marginTop:2 }}>{s.date} · {s.completed?"Completed":"In progress"}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:20 }}>{scenario.icon}</span>
            <div style={{ fontSize:18, fontWeight:800, color:TEXT }}>{scenario.title} — Live Session</div>
            <div style={{ width:8, height:8, borderRadius:"50%", background:"#22c55e", flexShrink:0 }}/>
          </div>
          <div style={{ fontSize:12, color:MUTED, marginTop:2 }}>Working with AI mentor — team available if needed</div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          {!teamMode && <button onClick={requestTeam} style={{ padding:"8px 16px", background:"#fff", border:`1px solid ${BORDER}`, color:TEXT, borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>🤝 Get Team Help</button>}
          <button onClick={()=>{setScenario(null);setMessages([]);setTeamMode(false);}} style={{ padding:"8px 16px", background:"#fff", border:`1px solid ${BORDER}`, color:MUTED, borderRadius:8, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>← Scenarios</button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 240px", gap:20 }}>
        <div>
          <div style={{ ...S.card, padding:24, height:440, overflowY:"auto", display:"flex", flexDirection:"column", gap:14, marginBottom:12 }}>
            {messages.map((m,i)=>(
              <div key={i} style={{ display:"flex", flexDirection:"column", gap:4 }}>
                {m.role!=="user" && <div style={{ fontSize:11, color:MUTED, marginLeft:4 }}>{m.name||"Mentor"} {m.role==="system"?"·":"✦"}</div>}
                <div style={S.msg(m.role)}>{m.text}</div>
                {m.needsTeam && !teamMode && (
                  <button onClick={requestTeam} style={{ alignSelf:"flex-start", background:"none", border:`1px solid ${PINK}`, color:PINK, borderRadius:8, padding:"5px 12px", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                    🤝 Connect with a real mentor
                  </button>
                )}
              </div>
            ))}
            {loading && <div style={{ ...S.msg("mentor"), alignSelf:"flex-start" }}><span style={{color:PINK}}>✦ </span><span style={{color:MUTED,fontSize:12}}>Thinking...</span></div>}
            <div ref={bottomRef}/>
          </div>

          <div style={{ ...S.card, padding:12, display:"flex", gap:10 }}>
            <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} placeholder="Type your response..." style={{ flex:1, border:`1px solid ${BORDER}`, borderRadius:10, padding:"10px 13px", fontSize:13, color:TEXT, fontFamily:"inherit", resize:"none", minHeight:50, outline:"none", background:"#fafafa" }} />
            <button onClick={send} disabled={loading||!input.trim()} style={{ ...S.btn, alignSelf:"flex-end", opacity:(loading||!input.trim())?0.4:1 }}>Send</button>
          </div>
        </div>

        <div>
          <div style={{ ...S.card, padding:16, marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Scenario</div>
            <div style={{ fontSize:22, marginBottom:4 }}>{scenario.icon}</div>
            <div style={{ fontSize:13, fontWeight:700, color:TEXT }}>{scenario.title}</div>
            <div style={{ fontSize:12, color:MUTED, marginTop:4, lineHeight:1.5 }}>{scenario.desc}</div>
          </div>

          <div style={{ ...S.card, padding:16, marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Learning Goals</div>
            {["Apply brand strategy in real-time","Get feedback from professionals","Build a portfolio case study","Learn by doing, not just watching"].map((g,i)=>(
              <div key={i} style={{ fontSize:11, color:MUTED, marginBottom:7, display:"flex", gap:6 }}>
                <span style={{color:PINK,flexShrink:0}}>→</span>{g}
              </div>
            ))}
          </div>

          <div style={{ background:"#fef2f2", border:`1px solid ${PINK}20`, borderRadius:12, padding:14 }}>
            <div style={{ fontSize:12, fontWeight:700, color:TEXT, marginBottom:6 }}>Free to use</div>
            <div style={{ fontSize:11, color:MUTED, lineHeight:1.55, marginBottom:10 }}>All sessions are free. Premium 1-on-1 consultation available if you want deeper guidance.</div>
            <a href="/book" style={{ display:"block", textAlign:"center", padding:"8px 0", background:PINK, color:"#fff", borderRadius:7, textDecoration:"none", fontSize:12, fontWeight:700 }}>Book Premium Session</a>
          </div>
        </div>
      </div>
    </div>
  );
}
