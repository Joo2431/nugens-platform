import React, { useState } from "react";

const BLUE = "#0284c7";
const BG   = "#06101a";
const CARD = "#0a1628";
const B    = "#1a2030";

const PLATFORMS = ["Instagram","LinkedIn","Twitter/X","Facebook","YouTube","Pinterest","WhatsApp Business"];
const STATUS    = { scheduled:"#0284c7", published:"#22c55e", draft:"#445", failed:"#ef4444" };

const MOCK_POSTS = [
  { id:1, platform:"Instagram", caption:"Summer collection drop 🌊 Our new beachwear line is here! Limited pieces available — grab yours before they're gone. Link in bio.", image:null, scheduledFor:"2026-03-16 10:00", status:"scheduled", hashtags:"#summer #fashion #beachwear" },
  { id:2, platform:"LinkedIn", caption:"Excited to announce our Series A funding round! 🚀 This milestone enables us to scale our team and product. Grateful to our investors and the entire team for making this possible.", image:null, scheduledFor:"2026-03-17 09:30", status:"scheduled", hashtags:"#startup #funding #growth" },
  { id:3, platform:"Instagram", caption:"Behind the scenes of our new product shoot 📸 Every detail matters when you're building a brand people love.", image:null, scheduledFor:"2026-03-15 18:00", status:"published", hashtags:"#bts #brand #photography" },
  { id:4, platform:"Facebook", caption:"Big sale this weekend! Up to 40% off on all products. Visit our store or shop online at the link below.", image:null, scheduledFor:"2026-03-14 12:00", status:"published", hashtags:"#sale #offer #discount" },
];

export default function ContentScheduler({ profile }) {
  const [posts,     setPosts]     = useState(MOCK_POSTS);
  const [showNew,   setShowNew]   = useState(false);
  const [filter,    setFilter]    = useState("all");
  const [newPost,   setNewPost]   = useState({ platform:"Instagram", caption:"", scheduledFor:"", hashtags:"", status:"scheduled" });
  const [view,      setView]      = useState("list"); // list | calendar

  const filtered = filter === "all" ? posts : posts.filter(p => p.status === filter || p.platform.toLowerCase() === filter.toLowerCase());

  const savePost = () => {
    if (!newPost.caption.trim() || !newPost.scheduledFor) return;
    setPosts(ps => [{ ...newPost, id: Date.now() }, ...ps]);
    setNewPost({ platform:"Instagram", caption:"", scheduledFor:"", hashtags:"", status:"scheduled" });
    setShowNew(false);
  };

  const deletePost = (id) => setPosts(ps => ps.filter(p => p.id !== id));
  const toggleStatus = (id) => setPosts(ps => ps.map(p => p.id===id ? { ...p, status: p.status==="scheduled"?"published":p.status==="draft"?"scheduled":"draft" } : p));

  const S = {
    page: { minHeight:"100vh", background:BG, padding:"32px 40px", fontFamily:"'Plus Jakarta Sans',sans-serif" },
    h1: { fontSize:26, fontWeight:800, color:"#fff", letterSpacing:"-0.04em", marginBottom:4 },
    sub: { fontSize:13, color:"#445", marginBottom:28 },
    card: { background:CARD, border:`1px solid ${B}`, borderRadius:14, padding:20 },
    label: { fontSize:11, fontWeight:700, color:"#445", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6, display:"block" },
    inp: { width:"100%", background:"#0d1624", border:`1px solid ${B}`, borderRadius:8, padding:"9px 12px", color:"#ccc", fontSize:13, marginBottom:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box" },
    sel: { width:"100%", background:"#0d1624", border:`1px solid ${B}`, borderRadius:8, padding:"9px 12px", color:"#ccc", fontSize:13, marginBottom:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box" },
    ta: { width:"100%", background:"#0d1624", border:`1px solid ${B}`, borderRadius:8, padding:"9px 12px", color:"#ccc", fontSize:13, marginBottom:14, fontFamily:"inherit", outline:"none", resize:"vertical", minHeight:80, boxSizing:"border-box" },
    btn: { padding:"10px 22px", background:BLUE, color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" },
    pill: { padding:"4px 12px", borderRadius:20, fontSize:11, fontWeight:600, cursor:"pointer", border:"none", fontFamily:"inherit" },
    postRow: { background:CARD, border:`1px solid ${B}`, borderRadius:12, padding:16, marginBottom:10, display:"grid", gridTemplateColumns:"1fr auto", gap:12, alignItems:"start" },
    statDot: (s) => ({ display:"inline-flex", alignItems:"center", gap:5, fontSize:11, fontWeight:600, color:STATUS[s]||"#445" }),
  };

  const PlatformIcon = ({p}) => {
    const icons = { Instagram:"📸", LinkedIn:"💼", "Twitter/X":"🐦", Facebook:"👤", YouTube:"▶", Pinterest:"📌", "WhatsApp Business":"💬" };
    return <span>{icons[p]||"📱"}</span>;
  };

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
        <div>
          <div style={S.h1}>⊞ Content Scheduler</div>
          <div style={S.sub}>Schedule and manage posts across all your platforms</div>
        </div>
        <button onClick={()=>setShowNew(true)} style={S.btn}>+ New Post</button>
      </div>

      {/* Stats row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:28 }}>
        {[
          { label:"Total Scheduled", value: posts.filter(p=>p.status==="scheduled").length, color:BLUE },
          { label:"Published", value: posts.filter(p=>p.status==="published").length, color:"#22c55e" },
          { label:"Drafts", value: posts.filter(p=>p.status==="draft").length, color:"#445" },
          { label:"This Week", value: posts.length, color:"#e8185d" },
        ].map(s=>(
          <div key={s.label} style={S.card}>
            <div style={{ fontSize:22, fontWeight:800, color:s.color, letterSpacing:"-0.04em" }}>{s.value}</div>
            <div style={{ fontSize:11, color:"#334", marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
        {["all","scheduled","published","draft","Instagram","LinkedIn","Facebook"].map(f => (
          <button key={f} onClick={()=>setFilter(f)} style={{ ...S.pill, background: filter===f ? BLUE : "#0d1624", color: filter===f ? "#fff" : "#445", border: filter===f ? "none" : `1px solid ${B}` }}>
            {f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
      </div>

      {/* Posts list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:"60px 0", color:"#334" }}>
          <div style={{ fontSize:32, marginBottom:12 }}>⊞</div>
          <div style={{ fontSize:14, marginBottom:8 }}>No posts found</div>
          <button onClick={()=>setShowNew(true)} style={S.btn}>Schedule your first post</button>
        </div>
      ) : (
        filtered.map(post => (
          <div key={post.id} style={S.postRow}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                <PlatformIcon p={post.platform} />
                <span style={{ fontSize:12, fontWeight:700, color:"#ccc" }}>{post.platform}</span>
                <div style={S.statDot(post.status)}>
                  <span style={{ width:6, height:6, borderRadius:"50%", background:STATUS[post.status], display:"inline-block" }}/>
                  {post.status}
                </div>
                <span style={{ fontSize:11, color:"#334" }}>🕐 {post.scheduledFor}</span>
              </div>
              <div style={{ fontSize:13, color:"#aaa", lineHeight:1.6, marginBottom:6 }}>{post.caption.slice(0,180)}{post.caption.length>180?"...":""}</div>
              {post.hashtags && <div style={{ fontSize:11, color:`${BLUE}90` }}>{post.hashtags}</div>}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6, alignItems:"flex-end" }}>
              <button onClick={()=>toggleStatus(post.id)} style={{ fontSize:11, color:BLUE, background:"none", border:`1px solid ${BLUE}30`, borderRadius:6, padding:"4px 10px", cursor:"pointer", fontFamily:"inherit" }}>
                Mark {post.status==="scheduled"?"Published":post.status==="draft"?"Scheduled":"Draft"}
              </button>
              <button onClick={()=>deletePost(post.id)} style={{ fontSize:11, color:"#ef4444", background:"none", border:"1px solid #ef444430", borderRadius:6, padding:"4px 10px", cursor:"pointer", fontFamily:"inherit" }}>
                Delete
              </button>
            </div>
          </div>
        ))
      )}

      {/* New Post Modal */}
      {showNew && (
        <div style={{ position:"fixed", inset:0, background:"#000b", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100 }}>
          <div style={{ background:"#0a1628", border:`1px solid ${B}`, borderRadius:18, padding:32, width:480, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ fontSize:16, fontWeight:800, color:"#fff", marginBottom:20 }}>Schedule New Post</div>

            <label style={S.label}>Platform</label>
            <select value={newPost.platform} onChange={e=>setNewPost(p=>({...p,platform:e.target.value}))} style={S.sel}>
              {PLATFORMS.map(p=><option key={p}>{p}</option>)}
            </select>

            <label style={S.label}>Caption *</label>
            <textarea value={newPost.caption} onChange={e=>setNewPost(p=>({...p,caption:e.target.value}))} placeholder="Write your post caption..." style={S.ta} />

            <label style={S.label}>Hashtags</label>
            <input value={newPost.hashtags} onChange={e=>setNewPost(p=>({...p,hashtags:e.target.value}))} placeholder="#hashtag1 #hashtag2 #hashtag3" style={S.inp} />

            <label style={S.label}>Schedule Date & Time *</label>
            <input type="datetime-local" value={newPost.scheduledFor} onChange={e=>setNewPost(p=>({...p,scheduledFor:e.target.value}))} style={S.inp} />

            <label style={S.label}>Status</label>
            <select value={newPost.status} onChange={e=>setNewPost(p=>({...p,status:e.target.value}))} style={S.sel}>
              <option value="scheduled">Scheduled</option>
              <option value="draft">Draft</option>
            </select>

            <div style={{ display:"flex", gap:10, marginTop:4 }}>
              <button onClick={savePost} style={{ ...S.btn, flex:1 }}>Save Post</button>
              <button onClick={()=>setShowNew(false)} style={{ flex:1, background:"none", border:`1px solid ${B}`, color:"#556", borderRadius:9, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
