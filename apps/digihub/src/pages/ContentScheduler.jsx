import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const BLUE = "#0284c7";
const BG   = "#06101a";
const CARD = "#0a1628";
const B    = "#1a2030";
const PINK = "#e8185d";

const PLATFORMS = ["Instagram","LinkedIn","Twitter/X","Facebook","YouTube","Pinterest","WhatsApp Business"];
const STATUS_COLORS = { scheduled:"#0284c7", published:"#22c55e", draft:"#6b7280", failed:"#ef4444" };

function formatDate(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleString("en-IN", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" });
}

export default function ContentScheduler({ profile }) {
  const [posts,     setPosts]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showNew,   setShowNew]   = useState(false);
  const [submitting,setSubmitting]= useState(false);
  const [filter,    setFilter]    = useState("all");
  const [newPost,   setNewPost]   = useState({ platform:"Instagram", caption:"", scheduled_at:"", hashtags:"", status:"scheduled" });
  const [editId,    setEditId]    = useState(null);

  // Load from Supabase
  useEffect(() => {
    if (!profile?.id) { setLoading(false); return; }
    supabase
      .from("dh_scheduled_posts")
      .select("*")
      .eq("user_id", profile.id)
      .order("scheduled_at", { ascending: true })
      .then(({ data }) => { setPosts(data || []); setLoading(false); });
  }, [profile?.id]);

  const savePost = async () => {
    if (!newPost.caption.trim() || !newPost.scheduled_at || !profile?.id) return;
    setSubmitting(true);
    try {
      if (editId) {
        // Update existing
        const { data: updated } = await supabase
          .from("dh_scheduled_posts")
          .update({ platform:newPost.platform, content:newPost.caption, hashtags:newPost.hashtags, scheduled_at:newPost.scheduled_at, status:newPost.status })
          .eq("id", editId).eq("user_id", profile.id)
          .select().single();
        if (updated) setPosts(ps => ps.map(p => p.id===editId ? updated : p));
        setEditId(null);
      } else {
        // Insert new
        const { data: saved } = await supabase
          .from("dh_scheduled_posts")
          .insert({ user_id:profile.id, platform:newPost.platform, content:newPost.caption, hashtags:newPost.hashtags, scheduled_at:newPost.scheduled_at, status:newPost.status })
          .select().single();
        if (saved) setPosts(ps => [saved, ...ps]);
        // Track analytics
        supabase.from("dh_analytics_events").insert({ user_id:profile.id, event_type:"post_scheduled", platform:newPost.platform }).then(()=>{});
      }
      setNewPost({ platform:"Instagram", caption:"", scheduled_at:"", hashtags:"", status:"scheduled" });
      setShowNew(false);
    } catch(e) { console.error("Schedule save error:", e.message); alert("Could not save. Please try again."); }
    finally { setSubmitting(false); }
  };

  const deletePost = async (id) => {
    await supabase.from("dh_scheduled_posts").delete().eq("id", id);
    setPosts(ps => ps.filter(p => p.id !== id));
  };

  const updateStatus = async (id, status) => {
    await supabase.from("dh_scheduled_posts").update({ status }).eq("id", id);
    setPosts(ps => ps.map(p => p.id===id ? { ...p, status } : p));
    if (status === "published" && profile?.id) {
      supabase.from("dh_analytics_events").insert({ user_id:profile.id, event_type:"post_published", platform: posts.find(p=>p.id===id)?.platform }).then(()=>{});
    }
  };

  const startEdit = (post) => {
    setEditId(post.id);
    setNewPost({ platform:post.platform, caption:post.content||"", scheduled_at:post.scheduled_at?.slice(0,16)||"", hashtags:post.hashtags||"", status:post.status });
    setShowNew(true);
    window.scrollTo({ top:0, behavior:"smooth" });
  };

  const filtered = filter==="all" ? posts : posts.filter(p => p.status===filter || p.platform?.toLowerCase()===filter.toLowerCase());

  const stats = {
    total:     posts.length,
    scheduled: posts.filter(p=>p.status==="scheduled").length,
    published: posts.filter(p=>p.status==="published").length,
    draft:     posts.filter(p=>p.status==="draft").length,
  };

  const S = {
    page: { minHeight:"100vh", background:BG, padding:"32px 40px", fontFamily:"'Plus Jakarta Sans',sans-serif" },
    card: { background:CARD, border:`1px solid ${B}`, borderRadius:14, padding:20 },
    inp:  { width:"100%", background:"#0d1624", border:`1px solid ${B}`, borderRadius:8, padding:"9px 12px", color:"#ccc", fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" },
    sel:  { width:"100%", background:"#0d1624", border:`1px solid ${B}`, borderRadius:8, padding:"9px 12px", color:"#ccc", fontSize:13, fontFamily:"inherit", outline:"none" },
    label:{ fontSize:11, fontWeight:700, color:"#445", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:5, display:"block" },
  };

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28 }}>
        <div>
          <div style={{ fontSize:26, fontWeight:800, color:"#fff", letterSpacing:"-0.04em", marginBottom:4 }}>⊞ Content Scheduler</div>
          <div style={{ fontSize:13, color:"#445" }}>Schedule posts across platforms. All posts are saved to your account.</div>
        </div>
        <button onClick={()=>{ setEditId(null); setNewPost({ platform:"Instagram", caption:"", scheduled_at:"", hashtags:"", status:"scheduled" }); setShowNew(v=>!v); }}
          style={{ padding:"10px 20px", background:BLUE, color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
          {showNew ? "✕ Cancel" : "+ Schedule Post"}
        </button>
      </div>

      {/* Stats bar */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
        {[
          { label:"Total",     value:stats.total,     color:"#ccc"     },
          { label:"Scheduled", value:stats.scheduled, color:BLUE       },
          { label:"Published", value:stats.published, color:"#22c55e"  },
          { label:"Drafts",    value:stats.draft,     color:"#6b7280"  },
        ].map(s=>(
          <div key={s.label} style={{ ...S.card, textAlign:"center", padding:"14px" }}>
            <div style={{ fontSize:24, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:"#445", marginTop:3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* New/Edit post form */}
      {showNew && (
        <div style={{ ...S.card, marginBottom:24 }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#fff", marginBottom:16 }}>
            {editId ? "✏️ Edit Post" : "📅 New Scheduled Post"}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:12 }}>
            <div><label style={S.label}>Platform</label>
              <select value={newPost.platform} onChange={e=>setNewPost(p=>({...p,platform:e.target.value}))} style={S.sel}>
                {PLATFORMS.map(pl=><option key={pl}>{pl}</option>)}
              </select>
            </div>
            <div><label style={S.label}>Schedule Date & Time</label>
              <input type="datetime-local" value={newPost.scheduled_at} onChange={e=>setNewPost(p=>({...p,scheduled_at:e.target.value}))} style={S.inp}/>
            </div>
            <div><label style={S.label}>Status</label>
              <select value={newPost.status} onChange={e=>setNewPost(p=>({...p,status:e.target.value}))} style={S.sel}>
                <option value="scheduled">Scheduled</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={S.label}>Caption</label>
            <textarea value={newPost.caption} onChange={e=>setNewPost(p=>({...p,caption:e.target.value}))} rows={4}
              placeholder="Write your post caption here…"
              style={{ ...S.inp, resize:"vertical", minHeight:90 }}/>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={S.label}>Hashtags</label>
            <input value={newPost.hashtags} onChange={e=>setNewPost(p=>({...p,hashtags:e.target.value}))}
              placeholder="#brand #marketing #post"
              style={S.inp}/>
          </div>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:10 }}>
            <button onClick={()=>{ setShowNew(false); setEditId(null); }}
              style={{ padding:"9px 20px", background:"transparent", border:`1px solid ${B}`, borderRadius:8, color:"#445", fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
              Cancel
            </button>
            <button onClick={savePost} disabled={!newPost.caption.trim()||!newPost.scheduled_at||submitting}
              style={{ padding:"9px 24px", background:submitting?`${BLUE}60`:BLUE, color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:700, cursor:submitting?"not-allowed":"pointer", fontFamily:"inherit" }}>
              {submitting ? "Saving…" : editId ? "Update Post" : "Schedule Post"}
            </button>
          </div>
        </div>
      )}

      {/* Filter pills */}
      <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
        {["all","scheduled","published","draft",...PLATFORMS.slice(0,4)].map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            style={{ padding:"5px 13px", borderRadius:20, fontSize:11, fontWeight:600, cursor:"pointer", border:"none", fontFamily:"inherit",
              background:filter===f?BLUE:"#0d1624", color:filter===f?"#fff":"#445" }}>
            {f === "all" ? "All" : f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
      </div>

      {/* Posts list */}
      {loading && <div style={{ color:"#445", fontSize:13, padding:"32px 0", textAlign:"center" }}>Loading scheduled posts…</div>}

      {!loading && filtered.length === 0 && (
        <div style={{ ...S.card, textAlign:"center", padding:"40px 24px" }}>
          <div style={{ fontSize:24, marginBottom:12 }}>📅</div>
          <div style={{ fontSize:15, fontWeight:700, color:"#fff", marginBottom:6 }}>
            {filter==="all" ? "No posts scheduled yet" : `No ${filter} posts`}
          </div>
          <div style={{ fontSize:13, color:"#445" }}>Click "+ Schedule Post" to add your first post.</div>
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {filtered.map(post=>(
          <div key={post.id} style={{ ...S.card, display:"grid", gridTemplateColumns:"auto 1fr auto", gap:16, alignItems:"start" }}>
            {/* Platform badge */}
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, minWidth:70 }}>
              <div style={{ width:38, height:38, borderRadius:10, background:`${BLUE}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>
                {{"Instagram":"📸","LinkedIn":"💼","Twitter/X":"🐦","Facebook":"📘","YouTube":"▶️","Pinterest":"📌","WhatsApp Business":"💬"}[post.platform]||"📱"}
              </div>
              <span style={{ fontSize:10, color:"#445", fontWeight:600, textAlign:"center" }}>{post.platform}</span>
            </div>

            {/* Content */}
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                <span style={{ fontSize:11, fontWeight:700, color:STATUS_COLORS[post.status]||"#445", background:`${STATUS_COLORS[post.status]||"#445"}15`, padding:"2px 8px", borderRadius:5, textTransform:"uppercase", letterSpacing:"0.05em" }}>
                  {post.status}
                </span>
                <span style={{ fontSize:11, color:"#445" }}>📅 {formatDate(post.scheduled_at)}</span>
              </div>
              <div style={{ fontSize:13.5, color:"#bbb", lineHeight:1.65, marginBottom:post.hashtags?6:0 }}>
                {(post.content||"").length > 200 ? (post.content||"").slice(0,200)+"…" : (post.content||"")}
              </div>
              {post.hashtags && (
                <div style={{ fontSize:12, color:`${BLUE}90` }}>{post.hashtags}</div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display:"flex", flexDirection:"column", gap:6, alignItems:"flex-end" }}>
              {post.status === "scheduled" && (
                <button onClick={()=>updateStatus(post.id,"published")}
                  style={{ padding:"5px 12px", background:"#22c55e20", border:"1px solid #22c55e40", borderRadius:7, color:"#22c55e", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
                  ✓ Mark Published
                </button>
              )}
              {post.status === "draft" && (
                <button onClick={()=>updateStatus(post.id,"scheduled")}
                  style={{ padding:"5px 12px", background:`${BLUE}20`, border:`1px solid ${BLUE}40`, borderRadius:7, color:BLUE, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                  Schedule
                </button>
              )}
              <button onClick={()=>startEdit(post)}
                style={{ padding:"5px 12px", background:"transparent", border:`1px solid ${B}`, borderRadius:7, color:"#445", fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>
                ✏️ Edit
              </button>
              <button onClick={()=>deletePost(post.id)}
                style={{ padding:"5px 12px", background:"transparent", border:"1px solid #ef444430", borderRadius:7, color:"#ef4444", fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}