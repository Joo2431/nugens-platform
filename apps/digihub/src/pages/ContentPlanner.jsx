import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const PINK   = "#e8185d";
const BLUE   = "#0284c7";
const BG     = "#f8f9fb";
const CARD   = "#ffffff";
const BORDER = "#e8eaed";
const TEXT   = "#111827";
const MUTED  = "#6b7280";
const API    = import.meta.env.VITE_GEN_E_API_URL || "https://nugens-platform.onrender.com";

const PLATFORMS = ["Instagram","LinkedIn","Twitter/X","Facebook","YouTube","Pinterest"];
const TONES     = ["Professional","Casual & Fun","Inspirational","Educational","Promotional","Storytelling"];
const MONTHS    = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS      = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

const TODAY = new Date();
function getDaysInMonth(y,m){ return new Date(y,m+1,0).getDate(); }
function getFirstDay(y,m){ return (new Date(y,m,1).getDay()+6)%7; }

function weekDayToDate(year, month, week, dayName) {
  const dayMap = { Monday:1,Tuesday:2,Wednesday:3,Thursday:4,Friday:5,Saturday:6,Sunday:7,
                   Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6,Sun:7 };
  const targetDay = dayMap[dayName] || 1;
  const startDay  = (week-1)*7 + 1;
  const daysInMo  = getDaysInMonth(year,month);
  for (let d = startDay; d <= Math.min(startDay+6, daysInMo); d++) {
    const dow = new Date(year, month, d).getDay();
    const adj = dow===0?7:dow;
    if (adj === targetDay) return d;
  }
  return Math.min(startDay, daysInMo);
}

export default function ContentPlanner({ profile }) {
  const [viewMonth,  setViewMonth]  = useState(TODAY.getMonth());
  const [viewYear,   setViewYear]   = useState(TODAY.getFullYear());
  const [topic,      setTopic]      = useState("");
  const [platform,   setPlatform]   = useState("Instagram");
  const [tone,       setTone]       = useState("Professional");
  const [industry,   setIndustry]   = useState(profile?.industry||"");
  const [loading,    setLoading]    = useState(false);
  const [plan,       setPlan]       = useState(null);
  const [scheduled,  setScheduled]  = useState({});
  const [selected,   setSelected]   = useState(null);
  const [addModal,   setAddModal]   = useState(false);
  const [newPostText,setNewPostText]= useState("");
  const [calLoading, setCalLoading] = useState(true);
  const [saving,     setSaving]     = useState(false);

  const daysInMonth = getDaysInMonth(viewYear,viewMonth);
  const firstDay    = getFirstDay(viewYear,viewMonth);

  useEffect(() => {
    if (!profile?.id){ setCalLoading(false); return; }
    const monthStr = `${viewYear}-${viewMonth+1}`;
    supabase.from("dh_calendar_posts").select("*")
      .eq("user_id",profile.id).like("calendar_key",`${monthStr}-%`)
      .order("created_at",{ascending:true})
      .then(({data})=>{
        const g = {};
        (data||[]).forEach(p=>{ if(!g[p.calendar_key])g[p.calendar_key]=[]; g[p.calendar_key].push(p); });
        setScheduled(g); setCalLoading(false);
      });
  },[profile?.id,viewMonth,viewYear]);

  const clearCalendar = async () => {
    if (!profile?.id) return;
    const monthStr = viewYear + "-" + String(viewMonth+1).padStart(2,"0");
    if (!window.confirm("Clear all posts for this month? This cannot be undone.")) return;
    await supabase.from("dh_calendar_posts").delete()
      .eq("user_id", profile.id)
      .like("calendar_key", monthStr + "-%");
    setScheduled({});
    setPlan([]);
  };

  const generatePlan = async () => {
    if (!topic.trim()) return;
    setLoading(true); setPlan(null);
    try {
      const { data:{ session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(`${API}/api/mini-chat`,{
        method:"POST",
        headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},
        body:JSON.stringify({
          message:`Create a 4-week content calendar for ${platform} for a ${industry||"business"} brand.\nTone: ${tone}\nTheme/Topic: ${topic}\n\nReturn exactly 12 post ideas as a JSON array only (no extra text):\n[{"week":1,"day":"Monday","type":"post type","caption":"full caption text","hashtags":"#tag1 #tag2","tip":"posting tip"}]\nInclude 3 posts per week, spread across different days of the week.`,
          product:"digihub", userType:profile?.user_type||"individual", max_tokens:1800,
        }),
      });
      const d = await res.json();
      if (!res.ok||d.error) throw new Error(d.error||"Failed");
      const txt = (d?.reply||d?.message||"[]").replace(/```json|```/g,"").trim();
      const arrStart = txt.indexOf("["); const arrEnd = txt.lastIndexOf("]");
      const posts = arrStart>-1 ? JSON.parse(txt.slice(arrStart,arrEnd+1)) : [];
      setPlan(posts);

      if (posts.length > 0 && profile?.id) {
        const toInsert = posts.map(p => {
          const day  = weekDayToDate(viewYear, viewMonth, p.week||1, p.day||"Monday");
          const key  = `${viewYear}-${viewMonth+1}-${day}`;
          return { user_id:profile.id, calendar_key:key, post_type:p.type||"Post",
                   caption:p.caption, hashtags:p.hashtags||"", platform,
                   tip:p.tip||"", week_num:p.week||1, day_name:p.day||"" };
        });
        const { data:saved, error:insErr } = await supabase.from("dh_calendar_posts").insert(toInsert).select();
        if (insErr) throw new Error(insErr.message);
        if (saved?.length) {
          const grouped = {...scheduled};
          saved.forEach(p=>{ if(!grouped[p.calendar_key])grouped[p.calendar_key]=[]; grouped[p.calendar_key].push(p); });
          setScheduled(grouped);
        }
      }
    } catch(e) {
      console.error("Planner error:", e);
      alert("Generation failed: " + e.message);
      setPlan([]);
    }
    setLoading(false);
  };

  const removeFromCalendar = async (key, postId) => {
    await supabase.from("dh_calendar_posts").delete().eq("id",postId);
    setScheduled(s=>({...s,[key]:(s[key]||[]).filter(p=>p.id!==postId)}));
  };

  const addManualPost = async () => {
    if (!newPostText.trim()||!selected||!profile?.id) return;
    setSaving(true);
    const key = `${viewYear}-${viewMonth+1}-${selected}`;
    const {data:saved, error:manErr} = await supabase.from("dh_calendar_posts")
      .insert({user_id:profile.id,calendar_key:key,post_type:"Manual",caption:newPostText.trim(),platform,hashtags:""})
      .select().single();
    if (manErr) { alert("Save failed: " + manErr.message); setSaving(false); return; }
    if (saved) setScheduled(s=>({...s,[key]:[...(s[key]||[]),saved]}));
    setNewPostText(""); setAddModal(false); setSaving(false);
  };

  return (
    <div style={{minHeight:"100vh",background:BG,padding:"32px 36px",fontFamily:"'Plus Jakarta Sans',sans-serif",color:TEXT}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'); input:focus,select:focus,textarea:focus{border-color:${PINK}!important;outline:none}`}</style>

      <div style={{marginBottom:28}}>
        <h1 style={{fontWeight:800,fontSize:22,color:TEXT,letterSpacing:"-0.04em",margin:0}}>◈ Content Planner</h1>
        <p style={{color:MUTED,fontSize:13,marginTop:5}}>Generate AI content plans — auto-placed on your calendar and saved to your account.</p>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:24}}>

        {/* Calendar */}
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <button onClick={()=>{if(viewMonth===0){setViewMonth(11);setViewYear(y=>y-1);}else setViewMonth(m=>m-1);}}
              style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:8,color:TEXT,fontSize:14,padding:"6px 14px",cursor:"pointer",fontFamily:"inherit"}}>←</button>
            <div style={{fontSize:16,fontWeight:700,color:TEXT}}>{MONTHS[viewMonth]} {viewYear}</div>
            <button onClick={()=>{if(viewMonth===11){setViewMonth(0);setViewYear(y=>y+1);}else setViewMonth(m=>m+1);}}
              style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:8,color:TEXT,fontSize:14,padding:"6px 14px",cursor:"pointer",fontFamily:"inherit"}}>→</button>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:4}}>
            {DAYS.map(d=><div key={d} style={{textAlign:"center",fontSize:10,fontWeight:700,color:MUTED,padding:"4px 0"}}>{d}</div>)}
          </div>

          {calLoading ? (
            <div style={{textAlign:"center",padding:40,color:MUTED,fontSize:13}}>Loading calendar…</div>
          ) : (
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
              {Array(firstDay).fill(null).map((_,i)=><div key={`e${i}`}/>)}
              {Array(daysInMonth).fill(null).map((_,i)=>{
                const day = i+1;
                const key = `${viewYear}-${viewMonth+1}-${day}`;
                const dayPosts = scheduled[key]||[];
                const isToday = day===TODAY.getDate()&&viewMonth===TODAY.getMonth()&&viewYear===TODAY.getFullYear();
                return (
                  <div key={day} onClick={()=>setSelected(day)}
                    style={{background:dayPosts.length>0?`${BLUE}08`:CARD,border:isToday?`2px solid ${BLUE}`:`1px solid ${BORDER}`,borderRadius:8,minHeight:68,padding:4,cursor:"pointer",position:"relative",transition:"all 0.13s"}}>
                    <div style={{fontSize:10,fontWeight:700,color:isToday?BLUE:MUTED,marginBottom:3,padding:"1px 3px"}}>{day}</div>
                    {dayPosts.slice(0,2).map((p,pi)=>(
                      <div key={pi} style={{fontSize:9,background:`${PINK}12`,color:PINK,borderRadius:4,padding:"1px 4px",marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                        {p.caption?.slice(0,16)||p.post_type}
                      </div>
                    ))}
                    {dayPosts.length>2&&<div style={{fontSize:9,color:MUTED}}>+{dayPosts.length-2}</div>}
                  </div>
                );
              })}
            </div>
          )}

          {selected && (
            <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:14,padding:20,marginTop:16,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{fontSize:14,fontWeight:700,color:TEXT}}>
                  {MONTHS[viewMonth]} {selected}
                  <span style={{fontSize:11,color:MUTED,fontWeight:400,marginLeft:8}}>({(scheduled[`${viewYear}-${viewMonth+1}-${selected}`]||[]).length} posts)</span>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>setAddModal(true)}
                    style={{padding:"6px 14px",background:`${BLUE}10`,border:`1px solid ${BLUE}30`,borderRadius:7,color:BLUE,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ Add Post</button>
                  <button onClick={()=>setSelected(null)}
                    style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:7,color:MUTED,fontSize:12,cursor:"pointer",padding:"6px 10px",fontFamily:"inherit"}}>✕</button>
                </div>
              </div>
              {(scheduled[`${viewYear}-${viewMonth+1}-${selected}`]||[]).length===0 ? (
                <div style={{fontSize:12,color:MUTED,textAlign:"center",padding:"12px 0"}}>No posts on this day. Generate a plan or add manually.</div>
              ) : (
                (scheduled[`${viewYear}-${viewMonth+1}-${selected}`]||[]).map(p=>(
                  <div key={p.id} style={{background:BG,borderRadius:10,padding:"10px 14px",marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",gap:6,marginBottom:5}}>
                          <span style={{fontSize:9,fontWeight:700,color:BLUE,background:`${BLUE}15`,padding:"2px 7px",borderRadius:4}}>{p.post_type||"Post"}</span>
                          {p.platform&&<span style={{fontSize:9,color:MUTED,background:BORDER,padding:"2px 7px",borderRadius:4}}>{p.platform}</span>}
                        </div>
                        <div style={{fontSize:13,color:TEXT,lineHeight:1.6}}>{p.caption}</div>
                        {p.hashtags&&<div style={{fontSize:11,color:BLUE,marginTop:4}}>{p.hashtags}</div>}
                        {p.tip&&<div style={{fontSize:11,color:MUTED,marginTop:4,fontStyle:"italic"}}>💡 {p.tip}</div>}
                      </div>
                      <button onClick={()=>removeFromCalendar(`${viewYear}-${viewMonth+1}-${selected}`,p.id)}
                        style={{background:"none",border:"none",color:"#ef4444",fontSize:14,cursor:"pointer",marginLeft:8}}>✕</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {addModal && (
            <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:900,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
              onClick={e=>{if(e.target===e.currentTarget)setAddModal(false);}}>
              <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:16,padding:24,width:"100%",maxWidth:440,boxShadow:"0 16px 48px rgba(0,0,0,0.15)"}}>
                <div style={{fontSize:15,fontWeight:700,color:TEXT,marginBottom:16}}>Add post to {MONTHS[viewMonth]} {selected}</div>
                <textarea value={newPostText} onChange={e=>setNewPostText(e.target.value)} rows={4}
                  placeholder="Write your post caption…"
                  style={{width:"100%",padding:"10px 14px",background:BG,border:`1.5px solid ${BORDER}`,borderRadius:9,color:TEXT,fontSize:13,fontFamily:"inherit",resize:"vertical",outline:"none",boxSizing:"border-box",marginBottom:16}}/>
                <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
                  <button onClick={()=>setAddModal(false)}
                    style={{padding:"9px 18px",background:"transparent",border:`1px solid ${BORDER}`,borderRadius:8,color:MUTED,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
                  <button onClick={addManualPost} disabled={!newPostText.trim()||saving}
                    style={{padding:"9px 22px",background:PINK,border:"none",borderRadius:8,color:"#fff",fontSize:13,fontWeight:700,cursor:saving?"not-allowed":"pointer",fontFamily:"inherit"}}>
                    {saving?"Saving…":"Add to Calendar"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AI Generator Panel */}
        <div>
          <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:14,padding:24,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
            <div style={{fontWeight:700,fontSize:14,color:TEXT,marginBottom:16}}>⚡ Generate AI Plan</div>

            <label style={{fontSize:11,fontWeight:700,color:MUTED,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6,display:"block"}}>Platform</label>
            <select value={platform} onChange={e=>setPlatform(e.target.value)}
              style={{width:"100%",background:BG,border:`1.5px solid ${BORDER}`,borderRadius:8,padding:"9px 12px",color:TEXT,fontSize:13,marginBottom:14,fontFamily:"inherit",outline:"none"}}>
              {PLATFORMS.map(p=><option key={p}>{p}</option>)}
            </select>

            <label style={{fontSize:11,fontWeight:700,color:MUTED,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6,display:"block"}}>Tone</label>
            <select value={tone} onChange={e=>setTone(e.target.value)}
              style={{width:"100%",background:BG,border:`1.5px solid ${BORDER}`,borderRadius:8,padding:"9px 12px",color:TEXT,fontSize:13,marginBottom:14,fontFamily:"inherit",outline:"none"}}>
              {TONES.map(t=><option key={t}>{t}</option>)}
            </select>

            <label style={{fontSize:11,fontWeight:700,color:MUTED,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6,display:"block"}}>Industry</label>
            <input value={industry} onChange={e=>setIndustry(e.target.value)} placeholder="e.g. Fashion, Food, Tech…"
              style={{width:"100%",background:BG,border:`1.5px solid ${BORDER}`,borderRadius:8,padding:"9px 12px",color:TEXT,fontSize:13,marginBottom:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>

            <label style={{fontSize:11,fontWeight:700,color:MUTED,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6,display:"block"}}>Theme / Topic *</label>
            <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. Diwali sale, New product launch…"
              style={{width:"100%",background:BG,border:`1.5px solid ${BORDER}`,borderRadius:8,padding:"9px 12px",color:TEXT,fontSize:13,marginBottom:16,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>

            <div style={{display:"flex",gap:8,marginBottom:0}}>
              <button onClick={clearCalendar}
                style={{padding:"10px 14px",background:"none",border:"1px solid #e8eaed",borderRadius:9,fontSize:12,fontWeight:600,color:"#6b7280",cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>
                🗑 Clear Month
              </button>
              <button onClick={generatePlan} disabled={!topic.trim()||loading}
                style={{flex:1,padding:"12px 0",background:loading?`${PINK}60`:PINK,color:"#fff",border:"none",borderRadius:9,fontSize:13,fontWeight:700,cursor:loading?"not-allowed":"pointer",fontFamily:"inherit"}}>
                {loading?"Generating…":"⚡ Generate & Auto-Place"}
              </button>
            </div>

            {loading&&<div style={{fontSize:11,color:MUTED,textAlign:"center",marginTop:8}}>Generating and placing on calendar…</div>}
          </div>

          {plan&&plan.length>0&&(
            <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:14,padding:16,marginTop:16,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
              <div style={{fontWeight:700,fontSize:13,color:TEXT,marginBottom:10}}>
                ✓ {plan.length} posts generated & placed on calendar
              </div>
              <div style={{fontSize:12,color:MUTED,lineHeight:1.6}}>
                Click any day on the calendar to see and manage the posts.
              </div>
            </div>
          )}
          {plan&&plan.length===0&&(
            <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,padding:14,marginTop:14,fontSize:12,color:"#dc2626"}}>
              Generation failed. Please try again.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}