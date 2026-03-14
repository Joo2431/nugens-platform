import React, { useState } from "react";

const BLUE = "#0284c7";
const BG   = "#06101a";
const CARD = "#0a1628";
const B    = "#1a2030";
const API  = "https://nugens-platform.onrender.com";

const PLATFORMS = ["Instagram","LinkedIn","Twitter/X","Facebook","YouTube","Pinterest"];
const TONES     = ["Professional","Casual & Fun","Inspirational","Educational","Promotional","Storytelling"];
const MONTHS    = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS      = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

const TODAY = new Date();
const THIS_MONTH = TODAY.getMonth();
const THIS_YEAR  = TODAY.getFullYear();

function getDaysInMonth(y, m) { return new Date(y, m+1, 0).getDate(); }
function getFirstDay(y, m) { return (new Date(y, m, 1).getDay() + 6) % 7; }

export default function ContentPlanner({ profile }) {
  const [viewMonth,  setViewMonth]  = useState(THIS_MONTH);
  const [viewYear,   setViewYear]   = useState(THIS_YEAR);
  const [topic,      setTopic]      = useState("");
  const [platform,   setPlatform]   = useState("Instagram");
  const [tone,       setTone]       = useState("Professional");
  const [industry,   setIndustry]   = useState(profile?.industry || "");
  const [loading,    setLoading]    = useState(false);
  const [plan,       setPlan]       = useState(null);
  const [scheduled,  setScheduled]  = useState({});
  const [selected,   setSelected]   = useState(null);
  const [addModal,   setAddModal]   = useState(false);
  const [newPostText,setNewPostText]= useState("");

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay    = getFirstDay(viewYear, viewMonth);

  const generatePlan = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setPlan(null);
    try {
      const res = await fetch(`${API}/api/mini-chat`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          message:`Create a 4-week content calendar for ${platform} for a ${industry||"business"} brand.\nTone: ${tone}\nTheme/Topic: ${topic}\n\nReturn exactly 12 post ideas in this JSON format (array only, no extra text):\n[{"week":1,"day":"Monday","type":"post type","caption":"full caption text","hashtags":"#tag1 #tag2","tip":"posting tip"}]\nInclude 3 posts per week across different days.`,
          userType: profile?.user_type || "individual",
          product:"digihub"
        })
      });
      const d = await res.json();
      const txt = d?.reply || d?.message || "[]";
      const clean = txt.replace(/```json|```/g,"").trim();
      try {
        const posts = JSON.parse(clean);
        setPlan(posts);
      } catch(e) {
        setPlan([{week:1,day:"Monday",type:"Brand Post",caption:txt.slice(0,300),hashtags:"#business",tip:"Post at 9am for best reach"}]);
      }
    } catch(e) {
      setPlan([]);
    }
    setLoading(false);
  };

  const addToCalendar = (post, day) => {
    const key = `${viewYear}-${viewMonth+1}-${day}`;
    setScheduled(s => ({ ...s, [key]: [...(s[key]||[]), { ...post, id: Date.now() }] }));
  };

  const S = {
    page: { minHeight:"100vh", background:BG, padding:"32px 40px", fontFamily:"'Plus Jakarta Sans',sans-serif" },
    h1: { fontSize:26, fontWeight:800, color:"#fff", letterSpacing:"-0.04em", marginBottom:4 },
    sub: { fontSize:13, color:"#445", marginBottom:32 },
    grid: { display:"grid", gridTemplateColumns:"1fr 380px", gap:28 },
    card: { background:CARD, border:`1px solid ${B}`, borderRadius:14, padding:24 },
    label: { fontSize:11, fontWeight:700, color:"#445", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6, display:"block" },
    sel: { width:"100%", background:"#0d1624", border:`1px solid ${B}`, borderRadius:8, padding:"9px 12px", color:"#ccc", fontSize:13, marginBottom:16, fontFamily:"inherit", outline:"none", boxSizing:"border-box" },
    inp: { width:"100%", background:"#0d1624", border:`1px solid ${B}`, borderRadius:8, padding:"9px 12px", color:"#ccc", fontSize:13, marginBottom:16, fontFamily:"inherit", outline:"none", boxSizing:"border-box" },
    btn: { padding:"11px 24px", background:BLUE, color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" },
    calCell: { borderRadius:8, padding:"6px 8px", minHeight:80, border:`1px solid ${B}`, position:"relative", cursor:"pointer", transition:"border-color 0.15s" },
    postItem: { background:`${BLUE}15`, border:`1px solid ${BLUE}30`, borderRadius:5, padding:"3px 6px", marginTop:3, fontSize:10, color:BLUE, cursor:"pointer" },
  };

  const cells = [];
  for (let i=0; i<firstDay; i++) cells.push(null);
  for (let d=1; d<=daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>
      <div style={S.h1}>◈ Content Planner</div>
      <div style={S.sub}>AI-powered content calendar for your brand's social media presence</div>

      <div style={S.grid}>
        {/* Calendar */}
        <div>
          {/* Month Nav */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <button onClick={()=>{ if(viewMonth===0){setViewMonth(11);setViewYear(y=>y-1);}else setViewMonth(m=>m-1); }} style={{ background:"none", border:`1px solid ${B}`, color:"#ccc", borderRadius:7, padding:"6px 14px", cursor:"pointer", fontFamily:"inherit", fontSize:13 }}>←</button>
            <div style={{ fontSize:15, fontWeight:700, color:"#fff" }}>{MONTHS[viewMonth]} {viewYear}</div>
            <button onClick={()=>{ if(viewMonth===11){setViewMonth(0);setViewYear(y=>y+1);}else setViewMonth(m=>m+1); }} style={{ background:"none", border:`1px solid ${B}`, color:"#ccc", borderRadius:7, padding:"6px 14px", cursor:"pointer", fontFamily:"inherit", fontSize:13 }}>→</button>
          </div>

          {/* Day headers */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, marginBottom:4 }}>
            {DAYS.map(d => <div key={d} style={{ fontSize:10, fontWeight:700, color:"#334", textAlign:"center", padding:"4px 0", textTransform:"uppercase", letterSpacing:"0.06em" }}>{d}</div>)}
          </div>

          {/* Calendar grid */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 }}>
            {cells.map((day, i) => {
              const key = day ? `${viewYear}-${viewMonth+1}-${day}` : null;
              const posts = key ? (scheduled[key]||[]) : [];
              const isToday = day===TODAY.getDate() && viewMonth===THIS_MONTH && viewYear===THIS_YEAR;
              return (
                <div key={i} style={{ ...S.calCell, background: day ? "#0a1628" : "transparent", border: day ? (isToday ? `1px solid ${BLUE}60` : `1px solid ${B}`) : "none" }}
                  onClick={()=>{ if(day){ setSelected({day,key}); setAddModal(true); } }}>
                  {day && (
                    <>
                      <div style={{ fontSize:11, fontWeight:isToday?700:500, color:isToday?BLUE:"#445" }}>{day}</div>
                      {posts.map((p,pi) => (
                        <div key={pi} style={S.postItem} title={p.caption}>{p.type||"Post"}</div>
                      ))}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ marginTop:16, display:"flex", gap:16, flexWrap:"wrap" }}>
            {[{c:BLUE,l:"Scheduled Post"},{c:"#e8185d",l:"Campaign"},{c:"#22c55e",l:"Published"}].map(x=>(
              <div key={x.l} style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"#445" }}>
                <div style={{ width:8, height:8, borderRadius:2, background:x.c }}/>
                {x.l}
              </div>
            ))}
          </div>
        </div>

        {/* AI Generator */}
        <div>
          <div style={S.card}>
            <div style={{ fontSize:14, fontWeight:700, color:"#fff", marginBottom:18 }}>✦ AI Content Generator</div>

            <label style={S.label}>Platform</label>
            <select value={platform} onChange={e=>setPlatform(e.target.value)} style={S.sel}>
              {PLATFORMS.map(p=><option key={p}>{p}</option>)}
            </select>

            <label style={S.label}>Content Tone</label>
            <select value={tone} onChange={e=>setTone(e.target.value)} style={S.sel}>
              {TONES.map(t=><option key={t}>{t}</option>)}
            </select>

            <label style={S.label}>Industry/Niche</label>
            <input value={industry} onChange={e=>setIndustry(e.target.value)} placeholder="e.g. Fashion, Tech, Food, Fitness..." style={S.inp} />

            <label style={S.label}>Monthly Theme / Campaign Topic *</label>
            <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. Diwali sale, product launch, brand awareness..." style={S.inp} />

            <button onClick={generatePlan} disabled={loading||!topic.trim()} style={{ ...S.btn, width:"100%", opacity:(loading||!topic.trim())?0.5:1 }}>
              {loading?"◈ Generating Plan...":"◈ Generate 4-Week Plan"}
            </button>
          </div>

          {/* Generated Plan */}
          {plan && plan.length > 0 && (
            <div style={{ marginTop:16 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#fff", marginBottom:12 }}>Generated Content Plan</div>
              {plan.map((p,i) => (
                <div key={i} style={{ ...S.card, marginBottom:10, padding:16 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                    <div>
                      <span style={{ fontSize:10, fontWeight:700, color:BLUE, textTransform:"uppercase" }}>Week {p.week}</span>
                      <span style={{ fontSize:10, color:"#334", marginLeft:8 }}>{p.day}</span>
                    </div>
                    <button onClick={()=>{ const d=Math.min(daysInMonth, i*2+2); addToCalendar(p,d); }} style={{ fontSize:10, color:BLUE, background:"none", border:`1px solid ${BLUE}40`, borderRadius:5, padding:"3px 8px", cursor:"pointer", fontFamily:"inherit" }}>
                      + Add to Calendar
                    </button>
                  </div>
                  <div style={{ fontSize:11, fontWeight:700, color:"#ccc", marginBottom:4 }}>{p.type}</div>
                  <div style={{ fontSize:12, color:"#445", lineHeight:1.6, marginBottom:6 }}>{p.caption?.slice(0,120)}...</div>
                  <div style={{ fontSize:11, color:`${BLUE}90` }}>{p.hashtags}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add to calendar modal */}
      {addModal && selected && (
        <div style={{ position:"fixed", inset:0, background:"#000a", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100 }}>
          <div style={{ background:"#0a1628", border:`1px solid ${B}`, borderRadius:16, padding:28, width:400 }}>
            <div style={{ fontSize:15, fontWeight:700, color:"#fff", marginBottom:16 }}>Add Post — {MONTHS[viewMonth]} {selected.day}</div>
            <textarea value={newPostText} onChange={e=>setNewPostText(e.target.value)} placeholder="Write your post caption..." style={{ width:"100%", background:"#0d1624", border:`1px solid ${B}`, borderRadius:8, padding:12, color:"#ccc", fontSize:13, fontFamily:"inherit", minHeight:100, outline:"none", resize:"vertical", boxSizing:"border-box", marginBottom:16 }} />
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>{ addToCalendar({type:"Post",caption:newPostText},selected.day); setAddModal(false); setNewPostText(""); }} style={{ ...S.btn, flex:1 }}>Save to Calendar</button>
              <button onClick={()=>setAddModal(false)} style={{ flex:1, background:"none", border:`1px solid ${B}`, color:"#556", borderRadius:9, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
