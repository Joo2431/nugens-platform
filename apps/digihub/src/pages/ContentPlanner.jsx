import React, { useState } from "react";

const BLUE = "#0284c7";
const PINK = "#e8185d";
const B    = "#1a2030";

const DAYS  = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const HOURS = ["9 AM","11 AM","1 PM","3 PM","5 PM","7 PM"];

const PLATFORMS = ["Instagram","LinkedIn","Twitter","Facebook","YouTube"];
const TYPES     = ["Reel/Video","Static Post","Carousel","Story","Article","Thread"];

const SAMPLE_POSTS = [
  { id:1, brand:"Zara Fitness",    platform:"Instagram", type:"Reel/Video",  day:"Mon", time:"9 AM",  status:"Scheduled", caption:"Morning workout motivation 💪 #fitness", color:BLUE    },
  { id:2, brand:"VedaKitchen",     platform:"Facebook",  type:"Static Post", day:"Mon", time:"1 PM",  status:"Draft",     caption:"Recipe of the week: Masala Chai",         color:"#16a34a"},
  { id:3, brand:"ThinkBox",        platform:"LinkedIn",  type:"Article",     day:"Wed", time:"11 AM", status:"Scheduled", caption:"5 productivity hacks for remote teams",   color:"#d97706"},
  { id:4, brand:"NovaTech",        platform:"Twitter",   type:"Thread",      day:"Thu", time:"3 PM",  status:"Draft",     caption:"Why AI won't replace engineers (thread)", color:PINK    },
  { id:5, brand:"Zara Fitness",    platform:"Instagram", type:"Carousel",    day:"Fri", time:"5 PM",  status:"Scheduled", caption:"Weekly progress transformation 🔥",        color:BLUE    },
  { id:6, brand:"VedaKitchen",     platform:"YouTube",   type:"Reel/Video",  day:"Sat", time:"7 PM",  status:"Published", caption:"How to make Rasam in 10 minutes",         color:"#16a34a"},
];

export default function ContentPlanner() {
  const [view, setView]           = useState("calendar"); // calendar | queue
  const [showNew, setShowNew]     = useState(false);
  const [caption, setCaption]     = useState("");
  const [brand, setBrand]         = useState("");
  const [platform, setPlatform]   = useState("Instagram");
  const [type, setType]           = useState("Static Post");
  const [day, setDay]             = useState("Mon");
  const [time, setTime]           = useState("9 AM");
  const [posts, setPosts]         = useState(SAMPLE_POSTS);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCaption, setAiCaption] = useState("");

  const addPost = () => {
    if (!brand || !caption) return;
    setPosts(p => [...p, { id: Date.now(), brand, platform, type, day, time, status:"Draft", caption, color:BLUE }]);
    setBrand(""); setCaption(""); setAiCaption(""); setShowNew(false);
  };

  const genCaption = async () => {
    if (!brand) return;
    setAiLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          messages:[{ role:"user", content:`Write 3 engaging ${platform} captions for brand "${brand}" for a ${type} post. Include relevant hashtags. Keep each caption punchy and scroll-stopping. Number them 1, 2, 3.` }]
        })
      });
      const d = await res.json();
      setAiCaption(d.content?.[0]?.text || "");
    } catch { setAiCaption("Error generating caption."); }
    setAiLoading(false);
  };

  const calendarPosts = (d) => posts.filter(p => p.day === d);

  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", padding:"32px 28px 80px", background:"#06101a", minHeight:"100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .dh-input { width:100%; padding:9px 12px; background:#0d1624; border:1px solid ${B}; border-radius:8px; color:#ddd; font-size:13px; font-family:'Plus Jakarta Sans',sans-serif; outline:none; }
        .dh-input:focus { border-color:${BLUE}60; }
        .dh-input::placeholder { color:#334; }
        .post-chip { padding:4px 8px; border-radius:6px; font-size:11px; font-weight:600; white-space:nowrap; }
        .vtab { padding:7px 16px; border-radius:7px; font-size:13px; font-weight:600; cursor:pointer; border:none; font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.13s; }
        .vtab.on { background:${BLUE}; color:#fff; }
        .vtab.off { background:transparent; color:#445; }
        .vtab.off:hover { color:#aaa; }
        .tag { display:inline-block; padding:2px 7px; border-radius:4px; font-size:10.5px; font-weight:600; }
      `}</style>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28, flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontWeight:800, fontSize:"clamp(20px,2.5vw,26px)", letterSpacing:"-0.03em", color:"#fff", marginBottom:4 }}>Content Planner</h1>
          <p style={{ fontSize:13.5, color:"#445" }}>Schedule and manage content across all your brand accounts.</p>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <div style={{ display:"flex", background:"#080f1a", border:`1px solid ${B}`, borderRadius:9, padding:3, gap:2 }}>
            <button className={`vtab ${view==="calendar"?"on":"off"}`} onClick={() => setView("calendar")}>Calendar</button>
            <button className={`vtab ${view==="queue"?"on":"off"}`} onClick={() => setView("queue")}>Queue</button>
          </div>
          <button onClick={() => setShowNew(true)} style={{ padding:"9px 18px", background:BLUE, color:"#fff", border:"none", borderRadius:9, fontSize:13.5, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            + New post
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:28 }}>
        {[
          { label:"Scheduled",  value: posts.filter(p=>p.status==="Scheduled").length,  color:BLUE     },
          { label:"Drafts",     value: posts.filter(p=>p.status==="Draft").length,       color:"#d97706"},
          { label:"Published",  value: posts.filter(p=>p.status==="Published").length,   color:"#16a34a"},
          { label:"This week",  value: posts.length,                                     color:PINK     },
        ].map(s => (
          <div key={s.label} style={{ background:"#080f1a", border:`1px solid ${B}`, borderRadius:10, padding:"14px 16px" }}>
            <div style={{ fontSize:22, fontWeight:800, color:s.color, letterSpacing:"-0.04em" }}>{s.value}</div>
            <div style={{ fontSize:11.5, color:"#445", marginTop:3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Calendar view */}
      {view === "calendar" && (
        <div style={{ background:"#080f1a", border:`1px solid ${B}`, borderRadius:14, overflow:"hidden" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", borderBottom:`1px solid ${B}` }}>
            {DAYS.map(d => (
              <div key={d} style={{ padding:"12px 0", textAlign:"center", fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:"#445", borderRight:`1px solid ${B}` }}>{d}</div>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", minHeight:400 }}>
            {DAYS.map(d => (
              <div key={d} style={{ borderRight:`1px solid ${B}`, padding:10, minHeight:380, display:"flex", flexDirection:"column", gap:6 }}>
                {calendarPosts(d).map(p => (
                  <div key={p.id} style={{ background:p.color+"18", border:`1px solid ${p.color}30`, borderRadius:7, padding:"6px 8px", cursor:"pointer" }}>
                    <div style={{ fontSize:10, fontWeight:700, color:p.color, marginBottom:2 }}>{p.time} · {p.platform}</div>
                    <div style={{ fontSize:11, color:"#aaa", lineHeight:1.4, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{p.caption}</div>
                    <div style={{ fontSize:10, color:"#445", marginTop:3 }}>{p.brand}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Queue view */}
      {view === "queue" && (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {posts.map(p => (
            <div key={p.id} style={{ background:"#080f1a", border:`1px solid ${B}`, borderRadius:12, padding:"16px 18px", display:"flex", alignItems:"center", gap:16 }}>
              <div style={{ width:4, height:44, borderRadius:99, background:p.color, flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13.5, fontWeight:700, color:"#ddd", marginBottom:4 }}>{p.caption}</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  <span className="tag" style={{ background:`${p.color}20`, color:p.color }}>{p.platform}</span>
                  <span className="tag" style={{ background:"#1a2030", color:"#556" }}>{p.type}</span>
                  <span className="tag" style={{ background:"#1a2030", color:"#556" }}>{p.brand}</span>
                </div>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{ fontSize:12, color:"#445", marginBottom:4 }}>{p.day} · {p.time}</div>
                <span className="tag" style={{ background: p.status==="Published"?"#16a34a20":p.status==="Scheduled"?`${BLUE}20`:"#d97706"+"20", color: p.status==="Published"?"#16a34a":p.status==="Scheduled"?BLUE:"#d97706" }}>{p.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New post modal */}
      {showNew && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999, padding:20 }}>
          <div style={{ background:"#080f1a", border:`1px solid ${B}`, borderRadius:16, padding:28, width:"100%", maxWidth:560, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
              <h2 style={{ fontWeight:700, fontSize:17, color:"#fff", letterSpacing:"-0.02em" }}>Schedule new post</h2>
              <button onClick={() => setShowNew(false)} style={{ background:"none", border:"none", color:"#445", fontSize:18, cursor:"pointer" }}>✕</button>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
              <div>
                <label style={{ fontSize:11.5, fontWeight:600, color:"#445", display:"block", marginBottom:5 }}>Brand</label>
                <input className="dh-input" value={brand} onChange={e=>setBrand(e.target.value)} placeholder="Brand name" />
              </div>
              <div>
                <label style={{ fontSize:11.5, fontWeight:600, color:"#445", display:"block", marginBottom:5 }}>Platform</label>
                <select className="dh-input" value={platform} onChange={e=>setPlatform(e.target.value)} style={{ cursor:"pointer" }}>
                  {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:11.5, fontWeight:600, color:"#445", display:"block", marginBottom:5 }}>Content Type</label>
                <select className="dh-input" value={type} onChange={e=>setType(e.target.value)} style={{ cursor:"pointer" }}>
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                <div>
                  <label style={{ fontSize:11.5, fontWeight:600, color:"#445", display:"block", marginBottom:5 }}>Day</label>
                  <select className="dh-input" value={day} onChange={e=>setDay(e.target.value)} style={{ cursor:"pointer" }}>
                    {DAYS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:11.5, fontWeight:600, color:"#445", display:"block", marginBottom:5 }}>Time</label>
                  <select className="dh-input" value={time} onChange={e=>setTime(e.target.value)} style={{ cursor:"pointer" }}>
                    {HOURS.map(h => <option key={h}>{h}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div style={{ marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                <label style={{ fontSize:11.5, fontWeight:600, color:"#445" }}>Caption</label>
                <button onClick={genCaption} disabled={!brand || aiLoading} style={{ fontSize:11.5, color:BLUE, fontWeight:600, background:"none", border:"none", cursor:"pointer", padding:0 }}>
                  {aiLoading ? "Generating..." : "✦ AI generate"}
                </button>
              </div>
              <textarea className="dh-input" rows={3} value={caption} onChange={e=>setCaption(e.target.value)} placeholder="Write your caption or use AI generate..." style={{ resize:"vertical" }} />
            </div>

            {aiCaption && (
              <div style={{ background:"#0d1624", border:`1px solid ${BLUE}25`, borderRadius:8, padding:14, marginBottom:16 }}>
                <div style={{ fontSize:11, fontWeight:700, color:BLUE, marginBottom:8 }}>AI SUGGESTIONS — click to use</div>
                {aiCaption.split(/\n\n|\n(?=\d\.)/).filter(l=>l.trim()).map((c,i) => (
                  <div key={i} onClick={() => setCaption(c.replace(/^\d\.\s*/,"").trim())} style={{ padding:"8px 10px", background:"#080f1a", border:`1px solid ${B}`, borderRadius:7, fontSize:12.5, color:"#bbb", lineHeight:1.55, cursor:"pointer", marginBottom:6 }}>
                    {c.replace(/^\d\.\s*/,"").trim()}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={addPost} style={{ flex:1, padding:"11px 0", background:BLUE, color:"#fff", border:"none", borderRadius:9, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                Save as Draft
              </button>
              <button onClick={() => setShowNew(false)} style={{ padding:"11px 18px", background:"transparent", color:"#556", border:`1px solid ${B}`, borderRadius:9, fontSize:14, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
