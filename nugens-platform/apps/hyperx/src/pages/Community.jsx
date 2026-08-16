import React, { useState, useEffect } from "react";
import { apiGet, apiPost, apiDelete } from "../lib/apiClient";

const PURPLE = "#7c3aed";
const PINK   = "#e8185d";
const BG     = "#f8f9fb";
const CARD   = "#ffffff";
const BORDER = "#e8eaed";
const TEXT   = "#0a0a0a";
const MUTED  = "#6b7280";
const FAINT  = "#9ca3af";

const TAGS = ["All", "Career Advice", "Interview Prep", "Salary", "Office Culture", "Personal Brand", "Communication"];

export default function Community({ profile }) {
  const [activeTag, setActiveTag] = useState("All");
  const [posts,     setPosts]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showNew,   setShowNew]   = useState(false);
  const [newTitle,  setNewTitle]  = useState("");
  const [newBody,   setNewBody]   = useState("");
  const [newTag,    setNewTag]    = useState("Career Advice");
  const [posting,   setPosting]   = useState(false);
  const [postErr,   setPostErr]   = useState("");

  const load = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const { posts: data } = await apiGet("/api/hyperx/community/posts");
      setPosts(data || []);
    } catch (e) {
      setLoadError(e.message || "Couldn't load the community feed.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const filtered = posts.filter(p => activeTag === "All" || p.tag === activeTag);

  const toggleLike = async (post) => {
    setPosts(ps => ps.map(p => p.id===post.id ? { ...p, liked:!p.liked, likes: p.liked ? p.likes-1 : p.likes+1 } : p)); // optimistic
    try {
      if (post.liked) await apiDelete(`/api/hyperx/community/posts/${post.id}/like`);
      else await apiPost(`/api/hyperx/community/posts/${post.id}/like`);
    } catch { load(); }
  };

  const submitPost = async () => {
    if (!newTitle.trim()) { setPostErr("Give your post a title."); return; }
    setPosting(true);
    setPostErr("");
    try {
      await apiPost("/api/hyperx/community/posts", { tag: newTag, title: newTitle, body: newBody });
      setShowNew(false);
      setNewTitle(""); setNewBody(""); setNewTag("Career Advice");
      load();
    } catch (e) {
      setPostErr(e.message || "Couldn't post. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", padding: "32px 28px 80px", background: BG, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .post-card { background: ${CARD}; border: 1px solid ${BORDER}; border-radius: 12px; padding: 18px 20px; transition: all 0.15s; }
        .post-card:hover { border-color: ${PURPLE}40; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.04); }
        .tag-pill { padding: 5px 13px; border-radius: 7px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid ${BORDER}; background: ${CARD}; color: ${MUTED}; transition: all 0.13s; white-space: nowrap; }
        .tag-pill.on { background: ${TEXT}; color: #fff; border-color: ${TEXT}; }
        @media (max-width: 700px) { .comm-layout { flex-direction: column !important; } .comm-side { width: 100% !important; } }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: "clamp(20px,2.5vw,26px)", letterSpacing: "-0.03em", color: TEXT, marginBottom: 4 }}>Community</h1>
          <p style={{ fontSize: 13.5, color: MUTED }}>Real questions. Real answers. From people actually in the workplace.</p>
        </div>
        <button onClick={() => setShowNew(true)} style={{ padding: "9px 20px", background: PURPLE, border: "none", borderRadius: 9, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily:"inherit" }}>
          + Post a question
        </button>
      </div>

      {loadError && (
        <div style={{ background:"#dc262610", border:"1px solid #dc262630", borderRadius:10, padding:"12px 16px", marginBottom:16, color:"#dc2626", fontSize:13, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          {loadError}
          <button onClick={load} style={{ background:"none", border:"none", color:"#dc2626", fontWeight:700, cursor:"pointer", fontSize:13 }}>Retry</button>
        </div>
      )}

      <div className="comm-layout" style={{ display: "flex", gap: 20 }}>
        {/* Main feed */}
        <div style={{ flex: 1 }}>
          {/* Tags */}
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 20 }}>
            {TAGS.map(tag => (
              <button key={tag} className={`tag-pill ${activeTag === tag ? "on" : ""}`} onClick={() => setActiveTag(tag)}>{tag}</button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign:"center", padding:"60px 0", color:FAINT, fontSize:13 }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="post-card" style={{ textAlign:"center", padding:48 }}>
              <div style={{ fontSize:32, marginBottom:12, opacity:0.25 }}>◎</div>
              <div style={{ fontSize:14, color:FAINT }}>No posts yet — be the first to ask something.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map(post => (
                <div key={post.id} className="post-card">
                  {post.pinned && (
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: "#d97706", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>📌 Pinned</div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: PURPLE+"15", border: `1px solid ${PURPLE}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: PURPLE, flexShrink: 0 }}>
                      {(post.author||"A")[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{post.author}</div>
                      <div style={{ fontSize: 11, color: FAINT }}>{new Date(post.created_at).toLocaleDateString()}</div>
                    </div>
                    <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 10.5, fontWeight: 600, color: PURPLE, background: PURPLE + "12", padding: "2px 8px", borderRadius: 5 }}>{post.tag}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: TEXT, lineHeight: 1.45, marginBottom: post.body ? 6 : 14 }}>{post.title}</div>
                  {post.body && <div style={{ fontSize:13, color:"#374151", lineHeight:1.6, marginBottom:14 }}>{post.body}</div>}
                  <div style={{ display: "flex", gap: 16 }}>
                    <button onClick={()=>toggleLike(post)} style={{ background: "none", border: "none", cursor: "pointer", color: post.liked?PINK:MUTED, fontWeight: post.liked?700:400, fontSize: 12, display: "flex", alignItems: "center", gap: 5, fontFamily:"inherit" }}>
                      <span>♥</span> <span>{post.likes}</span>
                    </button>
                    <button style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: 12, display: "flex", alignItems: "center", gap: 5, fontFamily:"inherit" }}>
                      <span>◎</span> <span>{post.replies} replies</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="comm-side" style={{ width: 240, flexShrink: 0 }}>
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "18px", marginBottom: 14 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: FAINT, marginBottom: 14 }}>Community</div>
            {[
              { label: "Total posts", value: String(posts.length) },
              { label: "Members",     value: "2,400+" },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${BG}`, fontSize: 12.5 }}>
                <span style={{ color: MUTED }}>{s.label}</span>
                <span style={{ color: TEXT, fontWeight: 700 }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New post modal */}
      {showNew && (
        <div style={{ position:"fixed", inset:0, background:"rgba(10,10,10,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100 }}>
          <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:18, padding:32, width:480, boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize:16, fontWeight:800, color:TEXT, marginBottom:16 }}>Post a question</div>

            <select value={newTag} onChange={e=>setNewTag(e.target.value)} style={{ width:"100%", background:BG, border:`1px solid ${BORDER}`, borderRadius:8, padding:"9px 12px", color:TEXT, fontSize:13, marginBottom:12, fontFamily:"inherit" }}>
              {TAGS.filter(t=>t!=="All").map(t=><option key={t}>{t}</option>)}
            </select>
            <input value={newTitle} onChange={e=>setNewTitle(e.target.value.slice(0,200))} placeholder="What's your question?" style={{ width:"100%", background:BG, border:`1px solid ${BORDER}`, borderRadius:8, padding:"9px 12px", color:TEXT, fontSize:13, marginBottom:12, fontFamily:"inherit", boxSizing:"border-box" }} />
            <textarea value={newBody} onChange={e=>setNewBody(e.target.value.slice(0,2000))} placeholder="Add more detail (optional)" style={{ width:"100%", background:BG, border:`1px solid ${BORDER}`, borderRadius:8, padding:"9px 12px", color:TEXT, fontSize:13, minHeight:90, marginBottom:6, fontFamily:"inherit", resize:"vertical", boxSizing:"border-box" }} />
            <div style={{ textAlign:"right", fontSize:11, color:FAINT, marginBottom:14 }}>{newBody.length}/2000</div>

            {postErr && <div style={{ fontSize:12, color:"#dc2626", marginBottom:14 }}>{postErr}</div>}

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={submitPost} disabled={posting} style={{ flex:1, padding:"10px 0", background:PURPLE, color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", opacity:posting?0.7:1 }}>{posting?"Posting…":"Post"}</button>
              <button onClick={()=>setShowNew(false)} style={{ flex:1, background:"none", border:`1px solid ${BORDER}`, color:MUTED, borderRadius:9, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
