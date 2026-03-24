import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const BLUE = "#0284c7";
const BG   = "#06101a";
const CARD = "#0a1628";
const B    = "#1a2030";
const API  = import.meta.env.VITE_GEN_E_API_URL || "https://nugens-platform.onrender.com";

const PLATFORMS = ["Instagram","LinkedIn","Twitter/X","Facebook","YouTube","Pinterest"];
const TONES     = ["Professional","Casual & Fun","Inspirational","Educational","Promotional","Storytelling"];
const MONTHS    = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS      = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

const TODAY      = new Date();
const THIS_MONTH = TODAY.getMonth();
const THIS_YEAR  = TODAY.getFullYear();

function getDaysInMonth(y, m) { return new Date(y, m+1, 0).getDate(); }
function getFirstDay(y, m)    { return (new Date(y, m, 1).getDay() + 6) % 7; }

export default function ContentPlanner({ profile }) {
  const [viewMonth,  setViewMonth]  = useState(THIS_MONTH);
  const [viewYear,   setViewYear]   = useState(THIS_YEAR);
  const [topic,      setTopic]      = useState("");
  const [platform,   setPlatform]   = useState("Instagram");
  const [tone,       setTone]       = useState("Professional");
  const [industry,   setIndustry]   = useState(profile?.industry || "");
  const [loading,    setLoading]    = useState(false);
  const [plan,       setPlan]       = useState(null);
  const [scheduled,  setScheduled]  = useState({});  // { "YYYY-M-D": [posts] }
  const [selected,   setSelected]   = useState(null);
  const [addModal,   setAddModal]   = useState(false);
  const [newPostText,setNewPostText]= useState("");
  const [calLoading, setCalLoading] = useState(true);
  const [saving,     setSaving]     = useState(false);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay    = getFirstDay(viewYear, viewMonth);

  // ── Load calendar posts for current user from Supabase ───────
  useEffect(() => {
    if (!profile?.id) { setCalLoading(false); return; }
    const monthStr = `${viewYear}-${viewMonth+1}`;
    supabase
      .from("dh_calendar_posts")
      .select("*")
      .eq("user_id", profile.id)
      .like("calendar_key", `${monthStr}-%`)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        const grouped = {};
        (data||[]).forEach(p => {
          if (!grouped[p.calendar_key]) grouped[p.calendar_key] = [];
          grouped[p.calendar_key].push(p);
        });
        setScheduled(grouped);
        setCalLoading(false);
      });
  }, [profile?.id, viewMonth, viewYear]);

  const generatePlan = async () => {
    if (!topic.trim()) return;
    setLoading(true); setPlan(null);
    try {
      const res = await fetch(`${API}/api/mini-chat`, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          message:`Create a 4-week content calendar for ${platform} for a ${industry||"business"} brand.\nTone: ${tone}\nTheme/Topic: ${topic}\n\nReturn exactly 12 post ideas in this JSON format (array only, no extra text):\n[{"week":1,"day":"Monday","type":"post type","caption":"full caption text","hashtags":"#tag1 #tag2","tip":"posting tip"}]\nInclude 3 posts per week across different days.`,
          userType: profile?.user_type || "individual",
          product: "digihub"
        })
      });
      const d = await res.json();
      const txt = (d?.reply || d?.message || "[]").replace(/```json|```/g,"").trim();
      try { setPlan(JSON.parse(txt)); }
      catch { setPlan([{ week:1, day:"Monday", type:"Brand Post", caption:txt.slice(0,300), hashtags:"#business", tip:"Post at 9am" }]); }
    } catch { setPlan([]); }
    setLoading(false);
  };

  // ── Save a post to a calendar day ───────────────────────────
  const addToCalendar = async (post, day) => {
    if (!profile?.id) return;
    const key = `${viewYear}-${viewMonth+1}-${day}`;
    setSaving(true);
    const { data: saved } = await supabase
      .from("dh_calendar_posts")
      .insert({
        user_id:      profile.id,
        calendar_key: key,
        post_type:    post.type   || "Post",
        caption:      post.caption,
        hashtags:     post.hashtags || "",
        platform:     post.platform || platform,
        tip:          post.tip     || "",
        week_num:     post.week    || 1,
        day_name:     post.day     || "",
      })
      .select().single();
    if (saved) {
      setScheduled(s => ({ ...s, [key]: [...(s[key]||[]), saved] }));
    }
    setSaving(false);
  };

  // ── Remove post from calendar ────────────────────────────────
  const removeFromCalendar = async (key, postId) => {
    await supabase.from("dh_calendar_posts").delete().eq("id", postId);
    setScheduled(s => ({ ...s, [key]: (s[key]||[]).filter(p => p.id !== postId) }));
  };

  // ── Add manual post to selected day ─────────────────────────
  const addManualPost = async () => {
    if (!newPostText.trim() || !selected || !profile?.id) return;
    const key = `${viewYear}-${viewMonth+1}-${selected}`;
    setSaving(true);
    const { data: saved } = await supabase
      .from("dh_calendar_posts")
      .insert({ user_id:profile.id, calendar_key:key, post_type:"Manual", caption:newPostText.trim(), platform, hashtags:"" })
      .select().single();
    if (saved) setScheduled(s => ({ ...s, [key]: [...(s[key]||[]), saved] }));
    setNewPostText(""); setAddModal(false);
    setSaving(false);
  };

  const S = {
    page:  { minHeight:"100vh", background:BG, padding:"32px 40px", fontFamily:"'Plus Jakarta Sans',sans-serif" },
    h1:    { fontSize:26, fontWeight:800, color:"#fff", letterSpacing:"-0.04em", marginBottom:4 },
    sub:   { fontSize:13, color:"#445", marginBottom:32 },
    grid:  { display:"grid", gridTemplateColumns:"1fr 380px", gap:28 },
    card:  { background:CARD, border:`1px solid ${B}`, borderRadius:14, padding:24 },
    label: { fontSize:11, fontWeight:700, color:"#445", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6, display:"block" },
    sel:   { width:"100%", background:"#0d1624", border:`1px solid ${B}`, borderRadius:8, padding:"9px 12px", color:"#ccc", fontSize:13, marginBottom:16, fontFamily:"inherit", outline:"none", boxSizing:"border-box" },
    inp:   { width:"100%", background:"#0d1624", border:`1px solid ${B}`, borderRadius:8, padding:"9px 12px", color:"#ccc", fontSize:13, marginBottom:16, fontFamily:"inherit", outline:"none", boxSizing:"border-box" },
    dayCell: (hasPost, isToday) => ({
      background: hasPost ? `${BLUE}18` : "#0d1624",
      border: isToday ? `1.5px solid ${BLUE}` : `1px solid ${B}`,
      borderRadius:8, minHeight:68, padding:4, cursor:"pointer", position:"relative", transition:"all 0.13s"
    }),
  };

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>
      <div style={S.h1}>◈ Content Planner</div>
      <div style={S.sub}>Generate AI content plans and schedule posts to your calendar. All posts are saved to your account.</div>

      <div style={S.grid}>
        {/* ── Calendar ── */}
        <div>
          {/* Month navigation */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <button onClick={()=>{ if(viewMonth===0){setViewMonth(11);setViewYear(y=>y-1);}else setViewMonth(m=>m-1); }}
              style={{ background:"#0d1624", border:`1px solid ${B}`, borderRadius:8, color:"#ccc", fontSize:14, padding:"6px 14px", cursor:"pointer", fontFamily:"inherit" }}>←</button>
            <div style={{ fontSize:16, fontWeight:700, color:"#fff" }}>{MONTHS[viewMonth]} {viewYear}</div>
            <button onClick={()=>{ if(viewMonth===11){setViewMonth(0);setViewYear(y=>y+1);}else setViewMonth(m=>m+1); }}
              style={{ background:"#0d1624", border:`1px solid ${B}`, borderRadius:8, color:"#ccc", fontSize:14, padding:"6px 14px", cursor:"pointer", fontFamily:"inherit" }}>→</button>
          </div>

          {/* Day headers */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, marginBottom:4 }}>
            {DAYS.map(d=><div key={d} style={{ textAlign:"center", fontSize:10, fontWeight:700, color:"#445", padding:"4px 0" }}>{d}</div>)}
          </div>

          {/* Calendar grid */}
          {calLoading ? (
            <div style={{ textAlign:"center", padding:40, color:"#445", fontSize:13 }}>Loading calendar…</div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 }}>
              {Array(firstDay).fill(null).map((_,i)=><div key={`e${i}`}/>)}
              {Array(daysInMonth).fill(null).map((_,i)=>{
                const day = i+1;
                const key = `${viewYear}-${viewMonth+1}-${day}`;
                const dayPosts = scheduled[key] || [];
                const isToday = day===TODAY.getDate() && viewMonth===TODAY.getMonth() && viewYear===TODAY.getFullYear();
                return (
                  <div key={day} style={S.dayCell(dayPosts.length>0, isToday)}
                    onClick={()=>setSelected(day)}>
                    <div style={{ fontSize:10, fontWeight:700, color:isToday?BLUE:"#445", marginBottom:3, padding:"1px 3px" }}>{day}</div>
                    {dayPosts.slice(0,2).map((p,pi)=>(
                      <div key={pi} style={{ fontSize:9, background:`${BLUE}25`, color:BLUE, borderRadius:4, padding:"1px 4px", marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {p.caption?.slice(0,18)||p.post_type}
                      </div>
                    ))}
                    {dayPosts.length>2&&<div style={{ fontSize:9, color:"#445" }}>+{dayPosts.length-2} more</div>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Selected day detail */}
          {selected && (
            <div style={{ ...S.card, marginTop:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <div style={{ fontSize:14, fontWeight:700, color:"#fff" }}>
                  {MONTHS[viewMonth]} {selected}, {viewYear}
                  <span style={{ fontSize:11, color:"#445", fontWeight:400, marginLeft:8 }}>
                    ({(scheduled[`${viewYear}-${viewMonth+1}-${selected}`]||[]).length} posts)
                  </span>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={()=>setAddModal(true)}
                    style={{ padding:"6px 14px", background:`${BLUE}20`, border:`1px solid ${BLUE}40`, borderRadius:7, color:BLUE, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                    + Add Post
                  </button>
                  <button onClick={()=>setSelected(null)}
                    style={{ background:"none", border:`1px solid ${B}`, borderRadius:7, color:"#445", fontSize:12, cursor:"pointer", padding:"6px 10px", fontFamily:"inherit" }}>
                    ✕
                  </button>
                </div>
              </div>
              {(scheduled[`${viewYear}-${viewMonth+1}-${selected}`]||[]).length === 0 ? (
                <div style={{ fontSize:12, color:"#334", textAlign:"center", padding:"16px 0" }}>
                  No posts on this day. Add one or generate a plan and click a post to schedule it.
                </div>
              ) : (
                (scheduled[`${viewYear}-${viewMonth+1}-${selected}`]||[]).map(p=>(
                  <div key={p.id} style={{ background:"#0d1624", borderRadius:10, padding:"10px 14px", marginBottom:8 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", gap:6, marginBottom:5 }}>
                          <span style={{ fontSize:9, fontWeight:700, color:BLUE, background:`${BLUE}20`, padding:"2px 7px", borderRadius:4 }}>{p.post_type||"Post"}</span>
                          {p.platform&&<span style={{ fontSize:9, color:"#445", background:"#0a1628", padding:"2px 7px", borderRadius:4 }}>{p.platform}</span>}
                        </div>
                        <div style={{ fontSize:13, color:"#bbb", lineHeight:1.6 }}>{p.caption}</div>
                        {p.hashtags&&<div style={{ fontSize:11, color:`${BLUE}80`, marginTop:4 }}>{p.hashtags}</div>}
                        {p.tip&&<div style={{ fontSize:11, color:"#334", marginTop:4, fontStyle:"italic" }}>💡 {p.tip}</div>}
                      </div>
                      <button onClick={()=>removeFromCalendar(`${viewYear}-${viewMonth+1}-${selected}`, p.id)}
                        style={{ background:"none", border:"none", color:"#ef4444", fontSize:14, cursor:"pointer", marginLeft:8, lineHeight:1 }}>✕</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Add manual post modal */}
          {addModal && (
            <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:900, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
              onClick={e=>{ if(e.target===e.currentTarget) setAddModal(false); }}>
              <div style={{ background:CARD, border:`1px solid ${B}`, borderRadius:16, padding:24, width:"100%", maxWidth:440 }}>
                <div style={{ fontSize:15, fontWeight:700, color:"#fff", marginBottom:16 }}>
                  Add post to {MONTHS[viewMonth]} {selected}
                </div>
                <textarea value={newPostText} onChange={e=>setNewPostText(e.target.value)} rows={4}
                  placeholder="Write your post caption…"
                  style={{ ...S.inp, resize:"vertical", minHeight:90 }}/>
                <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                  <button onClick={()=>setAddModal(false)}
                    style={{ padding:"9px 18px", background:"transparent", border:`1px solid ${B}`, borderRadius:8, color:"#445", fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
                  <button onClick={addManualPost} disabled={!newPostText.trim()||saving}
                    style={{ padding:"9px 22px", background:BLUE, border:"none", borderRadius:8, color:"#fff", fontSize:13, fontWeight:700, cursor:saving?"not-allowed":"pointer", fontFamily:"inherit" }}>
                    {saving?"Saving…":"Add to Calendar"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── AI Generator Panel ── */}
        <div>
          <div style={S.card}>
            <div style={{ fontSize:14, fontWeight:700, color:"#fff", marginBottom:16 }}>⚡ Generate AI Plan</div>
            <label style={S.label}>Platform</label>
            <select value={platform} onChange={e=>setPlatform(e.target.value)} style={S.sel}>
              {PLATFORMS.map(p=><option key={p}>{p}</option>)}
            </select>
            <label style={S.label}>Tone</label>
            <select value={tone} onChange={e=>setTone(e.target.value)} style={S.sel}>
              {TONES.map(t=><option key={t}>{t}</option>)}
            </select>
            <label style={S.label}>Industry</label>
            <input value={industry} onChange={e=>setIndustry(e.target.value)} placeholder="e.g. Fashion, Food, Tech…" style={S.inp}/>
            <label style={S.label}>Theme / Topic *</label>
            <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. Diwali sale, New product launch…" style={{ ...S.inp, marginBottom:16 }}/>
            <button onClick={generatePlan} disabled={!topic.trim()||loading}
              style={{ width:"100%", padding:"12px 0", background:loading?`${BLUE}60`:BLUE, color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:loading?"not-allowed":"pointer", fontFamily:"inherit" }}>
              {loading?"Generating…":"⚡ Generate 12 Posts"}
            </button>
          </div>

          {/* Generated plan */}
          {plan && plan.length > 0 && (
            <div style={{ marginTop:16 }}>
              <div style={{ fontSize:12, color:"#445", marginBottom:10 }}>
                Click any post to add it to the currently selected day {selected ? `(${MONTHS[viewMonth]} ${selected})` : "(select a day first)"}.
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:500, overflowY:"auto" }}>
                {plan.map((p,i)=>(
                  <div key={i} onClick={()=>selected ? addToCalendar(p, selected) : alert("Click a day on the calendar first")}
                    style={{ ...S.card, cursor:"pointer", borderColor:saving?B:`${BLUE}40`, transition:"all 0.13s", padding:14 }}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=BLUE}
                    onMouseLeave={e=>e.currentTarget.style.borderColor=`${BLUE}40`}>
                    <div style={{ display:"flex", gap:7, marginBottom:6 }}>
                      <span style={{ fontSize:9, fontWeight:700, color:BLUE, background:`${BLUE}20`, padding:"2px 7px", borderRadius:4 }}>Week {p.week}</span>
                      <span style={{ fontSize:9, color:"#445", background:"#0d1624", padding:"2px 7px", borderRadius:4 }}>{p.day}</span>
                      <span style={{ fontSize:9, color:"#445", background:"#0d1624", padding:"2px 7px", borderRadius:4 }}>{p.type}</span>
                    </div>
                    <div style={{ fontSize:12, color:"#bbb", lineHeight:1.6 }}>{p.caption?.slice(0,120)}{p.caption?.length>120?"…":""}</div>
                    <div style={{ fontSize:11, color:`${BLUE}80`, marginTop:4 }}>{p.hashtags}</div>
                    {p.tip&&<div style={{ fontSize:10, color:"#334", marginTop:4, fontStyle:"italic" }}>💡 {p.tip}</div>}
                    <div style={{ fontSize:10, color:BLUE, fontWeight:600, marginTop:6 }}>
                      {selected ? `+ Add to ${MONTHS[viewMonth]} ${selected}` : "Select a day to add →"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}