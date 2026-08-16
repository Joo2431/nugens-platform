import React, { useState, useEffect } from "react";
import { apiGet, apiPost, apiPatch, apiDelete } from "../lib/apiClient";

const BLUE   = "#0284c7";
const BG     = "#f8f9fb";
const CARD   = "#ffffff";
const BORDER = "#e8eaed";
const TEXT   = "#0a0a0a";
const MUTED  = "#6b7280";
const FAINT  = "#9ca3af";

const PLATFORMS = ["Instagram","LinkedIn","Twitter/X","Facebook","YouTube","Pinterest","WhatsApp Business"];
const STATUS    = { scheduled:BLUE, published:"#16a34a", draft:MUTED, failed:"#dc2626" };

export default function ContentScheduler({ profile }) {
  const [posts,     setPosts]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showNew,   setShowNew]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [saveErr,   setSaveErr]   = useState("");
  const [filter,    setFilter]    = useState("all");
  const [newPost,   setNewPost]   = useState({ platform:"Instagram", caption:"", scheduledFor:"", hashtags:"", status:"scheduled" });

  const load = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const { posts: data } = await apiGet("/api/digihub/scheduled-posts");
      setPosts(data || []);
    } catch (e) {
      setLoadError(e.message || "Couldn't load scheduled posts.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const filtered = filter === "all" ? posts : posts.filter(p => p.status === filter || p.platform.toLowerCase() === filter.toLowerCase());

  const savePost = async () => {
    if (!newPost.caption.trim() || !newPost.scheduledFor) { setSaveErr("Caption and schedule date/time are required."); return; }
    setSaving(true);
    setSaveErr("");
    try {
      await apiPost("/api/digihub/scheduled-posts", {
        platform: newPost.platform,
        caption: newPost.caption,
        hashtags: newPost.hashtags,
        scheduled_for: new Date(newPost.scheduledFor).toISOString(),
        status: newPost.status,
      });
      setNewPost({ platform:"Instagram", caption:"", scheduledFor:"", hashtags:"", status:"scheduled" });
      setShowNew(false);
      load();
    } catch (e) {
      setSaveErr(e.message || "Couldn't save the post. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const deletePost = async (id) => {
    setPosts(ps => ps.filter(p => p.id !== id)); // optimistic
    try { await apiDelete(`/api/digihub/scheduled-posts/${id}`); } catch { load(); }
  };

  const toggleStatus = async (post) => {
    const next = post.status === "scheduled" ? "published" : post.status === "draft" ? "scheduled" : "draft";
    setPosts(ps => ps.map(p => p.id === post.id ? { ...p, status: next } : p)); // optimistic
    try { await apiPatch(`/api/digihub/scheduled-posts/${post.id}`, { status: next }); } catch { load(); }
  };

  const S = {
    page: { minHeight:"100vh", background:BG, padding:"32px 40px", fontFamily:"'Plus Jakarta Sans',sans-serif" },
    h1: { fontSize:26, fontWeight:800, color:TEXT, letterSpacing:"-0.04em", marginBottom:4 },
    sub: { fontSize:13, color:MUTED, marginBottom:28 },
    card: { background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:20 },
    label: { fontSize:11, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6, display:"block" },
    inp: { width:"100%", background:BG, border:`1px solid ${BORDER}`, borderRadius:8, padding:"9px 12px", color:TEXT, fontSize:13, marginBottom:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box" },
    sel: { width:"100%", background:BG, border:`1px solid ${BORDER}`, borderRadius:8, padding:"9px 12px", color:TEXT, fontSize:13, marginBottom:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box" },
    ta: { width:"100%", background:BG, border:`1px solid ${BORDER}`, borderRadius:8, padding:"9px 12px", color:TEXT, fontSize:13, marginBottom:14, fontFamily:"inherit", outline:"none", resize:"vertical", minHeight:80, boxSizing:"border-box" },
    btn: { padding:"10px 22px", background:BLUE, color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" },
    pill: { padding:"4px 12px", borderRadius:20, fontSize:11, fontWeight:600, cursor:"pointer", border:"none", fontFamily:"inherit" },
    postRow: { background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, padding:16, marginBottom:10, display:"grid", gridTemplateColumns:"1fr auto", gap:12, alignItems:"start" },
    statDot: (s) => ({ display:"inline-flex", alignItems:"center", gap:5, fontSize:11, fontWeight:600, color:STATUS[s]||MUTED }),
  };

  const PlatformIcon = ({p}) => {
    const icons = { Instagram:"📸", LinkedIn:"💼", "Twitter/X":"🐦", Facebook:"👤", YouTube:"▶", Pinterest:"📌", "WhatsApp Business":"💬" };
    return <span>{icons[p]||"📱"}</span>;
  };

  // Only LinkedIn and Twitter/X actually support prefilled web compose
  // links — Instagram, Facebook, and WhatsApp Business don't offer a
  // public "open composer with this text" URL, so for those we only
  // offer "Copy caption" and let the person paste it in the app themselves.
  const composeUrl = (platform, caption) => {
    const text = encodeURIComponent(caption);
    if (platform === "LinkedIn")   return `https://www.linkedin.com/feed/?shareActive=true&text=${text}`;
    if (platform === "Twitter/X")  return `https://twitter.com/intent/tweet?text=${text}`;
    return null;
  };

  return (
    <div className="dh-page-pad" style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .dh-cs-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:28px; }
        @media (max-width:640px) { .dh-cs-stats { grid-template-columns:repeat(2,1fr); } .dh-page-pad { padding:20px 16px !important; } }
      `}</style>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
        <div>
          <div style={S.h1}>⊞ Content Calendar</div>
          <div style={S.sub}>Plan captions and dates here, then post them yourself — the "Open" and "Copy caption" buttons below make that quick. This does not auto-publish to your accounts yet.</div>
        </div>
        <button onClick={()=>setShowNew(true)} style={S.btn}>+ New Post</button>
      </div>

      {loadError && (
        <div style={{ background:"#dc262610", border:"1px solid #dc262630", borderRadius:10, padding:"12px 16px", marginBottom:16, color:"#dc2626", fontSize:13, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          {loadError}
          <button onClick={load} style={{ background:"none", border:"none", color:"#dc2626", fontWeight:700, cursor:"pointer", fontSize:13 }}>Retry</button>
        </div>
      )}

      {/* Stats row */}
      <div className="dh-cs-stats">
        {[
          { label:"Total Scheduled", value: posts.filter(p=>p.status==="scheduled").length, color:BLUE },
          { label:"Published", value: posts.filter(p=>p.status==="published").length, color:"#16a34a" },
          { label:"Drafts", value: posts.filter(p=>p.status==="draft").length, color:MUTED },
          { label:"Total Posts", value: posts.length, color:"#e8185d" },
        ].map(s=>(
          <div key={s.label} style={S.card}>
            <div style={{ fontSize:22, fontWeight:800, color:s.color, letterSpacing:"-0.04em" }}>{s.value}</div>
            <div style={{ fontSize:11, color:FAINT, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
        {["all","scheduled","published","draft","Instagram","LinkedIn","Facebook"].map(f => (
          <button key={f} onClick={()=>setFilter(f)} style={{ ...S.pill, background: filter===f ? BLUE : BG, color: filter===f ? "#fff" : MUTED, border: filter===f ? "none" : `1px solid ${BORDER}` }}>
            {f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
      </div>

      {/* Posts list */}
      {loading ? (
        <div style={{ textAlign:"center", padding:"60px 0", color:FAINT, fontSize:13 }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:"60px 0", color:FAINT }}>
          <div style={{ fontSize:32, marginBottom:12, opacity:0.3 }}>⊞</div>
          <div style={{ fontSize:14, marginBottom:8 }}>No posts found</div>
          <button onClick={()=>setShowNew(true)} style={S.btn}>Schedule your first post</button>
        </div>
      ) : (
        filtered.map(post => (
          <div key={post.id} style={S.postRow}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8, flexWrap:"wrap" }}>
                <PlatformIcon p={post.platform} />
                <span style={{ fontSize:12, fontWeight:700, color:TEXT }}>{post.platform}</span>
                <div style={S.statDot(post.status)}>
                  <span style={{ width:6, height:6, borderRadius:"50%", background:STATUS[post.status], display:"inline-block" }}/>
                  {post.status}
                </div>
                <span style={{ fontSize:11, color:FAINT }}>🕐 {new Date(post.scheduled_for).toLocaleString()}</span>
              </div>
              <div style={{ fontSize:13, color:"#374151", lineHeight:1.6, marginBottom:6 }}>{post.caption.slice(0,180)}{post.caption.length>180?"...":""}</div>
              {post.hashtags && <div style={{ fontSize:11, color:BLUE }}>{post.hashtags}</div>}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6, alignItems:"flex-end" }}>
              {composeUrl(post.platform, post.caption + (post.hashtags ? "\n\n" + post.hashtags : "")) && (
                <a href={composeUrl(post.platform, post.caption + (post.hashtags ? "\n\n" + post.hashtags : ""))} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize:11, color:"#16a34a", background:"none", border:"1px solid #16a34a40", borderRadius:6, padding:"4px 10px", textDecoration:"none", fontFamily:"inherit" }}>
                  Open on {post.platform} ↗
                </a>
              )}
              <button onClick={() => { navigator.clipboard.writeText(post.caption + (post.hashtags ? "\n\n" + post.hashtags : "")); }}
                style={{ fontSize:11, color:MUTED, background:"none", border:`1px solid ${BORDER}`, borderRadius:6, padding:"4px 10px", cursor:"pointer", fontFamily:"inherit" }}>
                Copy caption
              </button>
              <button onClick={()=>toggleStatus(post)} style={{ fontSize:11, color:BLUE, background:"none", border:`1px solid ${BLUE}40`, borderRadius:6, padding:"4px 10px", cursor:"pointer", fontFamily:"inherit" }}>
                Mark {post.status==="scheduled"?"Published":post.status==="draft"?"Scheduled":"Draft"}
              </button>
              <button onClick={()=>deletePost(post.id)} style={{ fontSize:11, color:"#dc2626", background:"none", border:"1px solid #dc262630", borderRadius:6, padding:"4px 10px", cursor:"pointer", fontFamily:"inherit" }}>
                Delete
              </button>
            </div>
          </div>
        ))
      )}

      {/* New Post Modal */}
      {showNew && (
        <div style={{ position:"fixed", inset:0, background:"rgba(10,10,10,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100 }}>
          <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:18, padding:32, width:480, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize:16, fontWeight:800, color:TEXT, marginBottom:20 }}>Schedule New Post</div>

            <label style={S.label}>Platform</label>
            <select value={newPost.platform} onChange={e=>setNewPost(p=>({...p,platform:e.target.value}))} style={S.sel}>
              {PLATFORMS.map(p=><option key={p}>{p}</option>)}
            </select>

            <label style={S.label}>Caption *</label>
            <textarea value={newPost.caption} onChange={e=>setNewPost(p=>({...p,caption:e.target.value.slice(0,2200)}))} maxLength={2200} placeholder="Write your post caption..." style={S.ta} />
            <div style={{ textAlign:"right", fontSize:11, color:FAINT, marginTop:-10, marginBottom:14 }}>{newPost.caption.length}/2200</div>

            <label style={S.label}>Hashtags</label>
            <input value={newPost.hashtags} onChange={e=>setNewPost(p=>({...p,hashtags:e.target.value}))} placeholder="#hashtag1 #hashtag2 #hashtag3" style={S.inp} />

            <label style={S.label}>Schedule Date & Time *</label>
            <input type="datetime-local" value={newPost.scheduledFor} onChange={e=>setNewPost(p=>({...p,scheduledFor:e.target.value}))} style={S.inp} />

            <label style={S.label}>Status</label>
            <select value={newPost.status} onChange={e=>setNewPost(p=>({...p,status:e.target.value}))} style={S.sel}>
              <option value="scheduled">Scheduled</option>
              <option value="draft">Draft</option>
            </select>

            {saveErr && <div style={{ fontSize:12, color:"#dc2626", marginBottom:14 }}>{saveErr}</div>}

            <div style={{ display:"flex", gap:10, marginTop:4 }}>
              <button onClick={savePost} disabled={saving} style={{ ...S.btn, flex:1, opacity:saving?0.7:1 }}>{saving?"Saving…":"Save Post"}</button>
              <button onClick={()=>setShowNew(false)} style={{ flex:1, background:"none", border:`1px solid ${BORDER}`, color:MUTED, borderRadius:9, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
