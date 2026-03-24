import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const PINK   = "#e8185d";
const BLUE   = "#0284c7";
const BG     = "#f8f9fb";
const CARD   = "#ffffff";
const BORDER = "#e8eaed";
const TEXT   = "#111827";
const MUTED  = "#6b7280";

const PLATFORMS    = ["Instagram","LinkedIn","Twitter/X","Facebook","YouTube","Pinterest","WhatsApp Business"];
const STATUS_COLOR = { scheduled:"#0284c7", published:"#16a34a", draft:"#6b7280", failed:"#ef4444" };

function fmtDate(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleString("en-IN",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});
}

const PLATFORM_ICON = {Instagram:"📸",LinkedIn:"💼","Twitter/X":"🐦",Facebook:"📘",YouTube:"▶️",Pinterest:"📌","WhatsApp Business":"💬"};

export default function ContentScheduler({ profile }) {
  const [posts,      setPosts]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter,     setFilter]     = useState("all");
  const [editId,     setEditId]     = useState(null);
  const [form,       setForm]       = useState({ platform:"Instagram", caption:"", scheduled_at:"", hashtags:"", status:"scheduled" });

  useEffect(() => {
    if (!profile?.id){ setLoading(false); return; }
    supabase.from("dh_scheduled_posts").select("*")
      .eq("user_id",profile.id).order("scheduled_at",{ascending:true})
      .then(({data})=>{ setPosts(data||[]); setLoading(false); });
  },[profile?.id]);

  const savePost = async () => {
    if (!form.caption.trim()||!form.scheduled_at||!profile?.id) return;
    setSubmitting(true);
    try {
      if (editId) {
        const {data:u} = await supabase.from("dh_scheduled_posts")
          .update({platform:form.platform,content:form.caption,hashtags:form.hashtags,scheduled_at:form.scheduled_at,status:form.status})
          .eq("id",editId).eq("user_id",profile.id).select().single();
        if (u) setPosts(ps=>ps.map(p=>p.id===editId?u:p));
        setEditId(null);
      } else {
        const {data:s, error:schErr} = await supabase.from("dh_scheduled_posts")
          .insert({user_id:profile.id,platform:form.platform,content:form.caption,hashtags:form.hashtags,scheduled_at:new Date(form.scheduled_at).toISOString(),status:form.status})
          .select().single();
        if (schErr) { console.error("Scheduler insert error:", schErr); throw new Error(schErr.message); }
        if (s) setPosts(ps=>[s,...ps]);
        supabase.from("dh_analytics_events").insert({user_id:profile.id,event_type:"post_scheduled",platform:form.platform}).then(()=>{});
      }
      setForm({platform:"Instagram",caption:"",scheduled_at:"",hashtags:"",status:"scheduled"});
      setShowForm(false);
    } catch(e){ console.error("Save error:", e); alert("Could not save: " + e.message + "\n\nRun the SQL fix in Supabase if tables are missing."); }
    setSubmitting(false);
  };

  const deletePost = async (id) => {
    await supabase.from("dh_scheduled_posts").delete().eq("id",id);
    setPosts(ps=>ps.filter(p=>p.id!==id));
  };

  const updateStatus = async (id, status) => {
    await supabase.from("dh_scheduled_posts").update({status}).eq("id",id);
    setPosts(ps=>ps.map(p=>p.id===id?{...p,status}:p));
  };

  const startEdit = (post) => {
    setEditId(post.id);
    setForm({platform:post.platform,caption:post.content||"",scheduled_at:post.scheduled_at?.slice(0,16)||"",hashtags:post.hashtags||"",status:post.status});
    setShowForm(true);
  };

  const filtered = filter==="all" ? posts : posts.filter(p=>p.status===filter||p.platform?.toLowerCase()===filter.toLowerCase());
  const stats = { total:posts.length, scheduled:posts.filter(p=>p.status==="scheduled").length, published:posts.filter(p=>p.status==="published").length, draft:posts.filter(p=>p.status==="draft").length };

  const inp = { width:"100%", background:BG, border:`1.5px solid ${BORDER}`, borderRadius:8, padding:"9px 12px", color:TEXT, fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" };
  const lbl = { fontSize:11, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:6, display:"block" };

  return (
    <div style={{minHeight:"100vh",background:BG,padding:"32px 36px",fontFamily:"'Plus Jakarta Sans',sans-serif",color:TEXT}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'); input:focus,select:focus,textarea:focus{border-color:${PINK}!important;outline:none}`}</style>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28}}>
        <div>
          <h1 style={{fontWeight:800,fontSize:22,color:TEXT,letterSpacing:"-0.04em",margin:0}}>⊞ Content Scheduler</h1>
          <p style={{color:MUTED,fontSize:13,marginTop:5}}>Schedule posts across platforms. All saved to your account.</p>
        </div>
        <button onClick={()=>{setEditId(null);setForm({platform:"Instagram",caption:"",scheduled_at:"",hashtags:"",status:"scheduled"});setShowForm(v=>!v);}}
          style={{padding:"10px 20px",background:PINK,color:"#fff",border:"none",borderRadius:9,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
          {showForm?"✕ Cancel":"+ Schedule Post"}
        </button>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>
        {[{label:"Total",value:stats.total,color:TEXT},{label:"Scheduled",value:stats.scheduled,color:BLUE},{label:"Published",value:stats.published,color:"#16a34a"},{label:"Drafts",value:stats.draft,color:MUTED}].map(s=>(
          <div key={s.label} style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:12,padding:"14px 18px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)",textAlign:"center"}}>
            <div style={{fontSize:22,fontWeight:800,color:s.color}}>{s.value}</div>
            <div style={{fontSize:11,color:MUTED,marginTop:3}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm&&(
        <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:14,padding:24,marginBottom:24,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
          <div style={{fontWeight:700,fontSize:14,color:TEXT,marginBottom:16}}>{editId?"✏️ Edit Post":"📅 New Scheduled Post"}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:14}}>
            <div><label style={lbl}>Platform</label>
              <select value={form.platform} onChange={e=>setForm(f=>({...f,platform:e.target.value}))} style={inp}>
                {PLATFORMS.map(p=><option key={p}>{p}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Date & Time</label>
              <input type="datetime-local" value={form.scheduled_at} onChange={e=>setForm(f=>({...f,scheduled_at:e.target.value}))} style={inp}/>
            </div>
            <div><label style={lbl}>Status</label>
              <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} style={inp}>
                <option value="scheduled">Scheduled</option><option value="draft">Draft</option>
              </select>
            </div>
          </div>
          <div style={{marginBottom:12}}>
            <label style={lbl}>Caption</label>
            <textarea value={form.caption} onChange={e=>setForm(f=>({...f,caption:e.target.value}))} rows={4}
              placeholder="Write your post caption…" style={{...inp,resize:"vertical",minHeight:90}}/>
          </div>
          <div style={{marginBottom:16}}>
            <label style={lbl}>Hashtags</label>
            <input value={form.hashtags} onChange={e=>setForm(f=>({...f,hashtags:e.target.value}))} placeholder="#brand #marketing" style={inp}/>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
            <button onClick={()=>setShowForm(false)}
              style={{padding:"9px 20px",background:"transparent",border:`1px solid ${BORDER}`,borderRadius:8,color:MUTED,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
            <button onClick={savePost} disabled={!form.caption.trim()||!form.scheduled_at||submitting}
              style={{padding:"9px 24px",background:submitting?`${PINK}60`:PINK,color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:700,cursor:submitting?"not-allowed":"pointer",fontFamily:"inherit"}}>
              {submitting?"Saving…":editId?"Update Post":"Schedule Post"}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
        {["all","scheduled","published","draft","Instagram","LinkedIn","Facebook"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            style={{padding:"5px 13px",borderRadius:20,fontSize:11,fontWeight:600,cursor:"pointer",border:"none",fontFamily:"inherit",
              background:filter===f?PINK:`${BORDER}`,color:filter===f?"#fff":MUTED,transition:"all 0.13s"}}>
            {f==="all"?"All Posts":f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
      </div>

      {/* Posts */}
      {loading&&<div style={{color:MUTED,fontSize:13,textAlign:"center",padding:"32px 0"}}>Loading…</div>}
      {!loading&&filtered.length===0&&(
        <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:14,padding:"40px 24px",textAlign:"center",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
          <div style={{fontSize:22,marginBottom:12}}>📅</div>
          <div style={{fontSize:15,fontWeight:700,color:TEXT,marginBottom:6}}>{filter==="all"?"No posts scheduled yet":`No ${filter} posts`}</div>
          <div style={{fontSize:13,color:MUTED}}>Click "+ Schedule Post" to add your first post.</div>
        </div>
      )}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {filtered.map(post=>(
          <div key={post.id} style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:12,padding:"16px 20px",display:"grid",gridTemplateColumns:"auto 1fr auto",gap:16,alignItems:"start",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,minWidth:60}}>
              <div style={{width:36,height:36,borderRadius:9,background:`${BLUE}10`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>
                {PLATFORM_ICON[post.platform]||"📱"}
              </div>
              <span style={{fontSize:9.5,color:MUTED,fontWeight:600,textAlign:"center"}}>{post.platform}</span>
            </div>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <span style={{fontSize:10,fontWeight:700,color:STATUS_COLOR[post.status]||MUTED,background:`${STATUS_COLOR[post.status]||MUTED}12`,padding:"2px 8px",borderRadius:5,textTransform:"uppercase",letterSpacing:"0.05em"}}>
                  {post.status}
                </span>
                <span style={{fontSize:11,color:MUTED}}>📅 {fmtDate(post.scheduled_at)}</span>
              </div>
              <div style={{fontSize:13.5,color:TEXT,lineHeight:1.65,marginBottom:post.hashtags?5:0}}>
                {(post.content||"").length>200?(post.content||"").slice(0,200)+"…":(post.content||"")}
              </div>
              {post.hashtags&&<div style={{fontSize:11.5,color:BLUE}}>{post.hashtags}</div>}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}>
              {post.status==="scheduled"&&(
                <button onClick={()=>updateStatus(post.id,"published")}
                  style={{padding:"5px 12px",background:"#f0fdf4",border:"1px solid #86efac",borderRadius:7,color:"#16a34a",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>✓ Published</button>
              )}
              {post.status==="draft"&&(
                <button onClick={()=>updateStatus(post.id,"scheduled")}
                  style={{padding:"5px 12px",background:`${BLUE}10`,border:`1px solid ${BLUE}30`,borderRadius:7,color:BLUE,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Schedule</button>
              )}
              <button onClick={()=>startEdit(post)}
                style={{padding:"5px 12px",background:"transparent",border:`1px solid ${BORDER}`,borderRadius:7,color:MUTED,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>✏️ Edit</button>
              <button onClick={()=>deletePost(post.id)}
                style={{padding:"5px 12px",background:"transparent",border:"1px solid #fecaca",borderRadius:7,color:"#ef4444",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}