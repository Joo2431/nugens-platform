import React, { useState, useEffect, useRef } from "react";
import { apiGet, apiPost, apiDelete } from "../lib/apiClient";

const BLUE   = "#0284c7";
const BG     = "#f8f9fb";
const CARD   = "#ffffff";
const BORDER = "#e8eaed";
const TEXT   = "#0a0a0a";
const MUTED  = "#6b7280";
const FAINT  = "#9ca3af";

const POST_TYPES_BIZ = ["General Update","Hiring Now","Business Offer","New Product","Event","Achievement","Industry Insight","Partnership","Team Update"];
const POST_TYPES_IND = ["Looking for Work","Portfolio Share","Career Update","Achievement","Learning Share","Seeking Advice","Networking","Project Showcase","Freelance Available"];

function ShareMenu({ post, onClose }) {
  const ref = useRef(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [onClose]);

  const shareUrl = `https://digihub.nugens.in.net/community/post/${post.id}`;
  const shareText = post.content.slice(0, 120);

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(shareUrl); } catch {}
    setCopied(true);
    setTimeout(() => { setCopied(false); onClose(); }, 900);
  };

  const opts = [
    { label: copied ? "Link copied ✓" : "Copy link", icon: "🔗", action: copyLink },
    { label: "Share to LinkedIn", icon: "in", action: () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, "_blank") },
    { label: "Share to X / Twitter", icon: "𝕏", action: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, "_blank") },
    { label: "Share via WhatsApp", icon: "💬", action: () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`, "_blank") },
  ];

  return (
    <div ref={ref} style={{
      position:"absolute", bottom:"calc(100% + 8px)", left:0, zIndex:30,
      background:CARD, border:`1px solid ${BORDER}`, borderRadius:10,
      boxShadow:"0 8px 28px rgba(0,0,0,0.12)", width:200, overflow:"hidden",
    }}>
      {opts.map(o => (
        <button key={o.label} onClick={o.action} style={{
          width:"100%", display:"flex", alignItems:"center", gap:10,
          padding:"10px 14px", background:"none", border:"none", cursor:"pointer",
          textAlign:"left", fontSize:13, fontWeight:600, color:TEXT,
          fontFamily:"'Plus Jakarta Sans',sans-serif",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "#f3f4f6"}
        onMouseLeave={e => e.currentTarget.style.background = "none"}>
          <span style={{ fontSize:13, width:18, textAlign:"center", color:MUTED }}>{o.icon}</span>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function Community({ profile }) {
  const isBusiness = profile?.user_type === "business";
  const [posts,    setPosts]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [loadError,setLoadError]= useState("");
  const [newPost,  setNewPost]  = useState("");
  const [postType, setPostType] = useState("General Update");
  const [posting,  setPosting]  = useState(false);
  const [postErr,  setPostErr]  = useState("");
  const [filter,   setFilter]   = useState("all");
  const [expanded, setExpanded] = useState({});
  const [shareOpenId, setShareOpenId] = useState(null);

  const types = isBusiness ? POST_TYPES_BIZ : POST_TYPES_IND;

  const load = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const { posts: data } = await apiGet("/api/digihub/community/posts");
      setPosts(data || []);
    } catch (e) {
      setLoadError(e.message || "Couldn't load the community feed.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const submitPost = async () => {
    if (!newPost.trim()) return;
    setPosting(true);
    setPostErr("");
    try {
      await apiPost("/api/digihub/community/posts", { content: newPost, postType, tags: [] });
      setNewPost("");
      load();
    } catch (e) {
      setPostErr(e.message || "Couldn't post. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (post) => {
    setPosts(ps => ps.map(p => p.id===post.id ? {...p, liked:!p.liked, likes:p.liked?p.likes-1:p.likes+1} : p)); // optimistic
    try {
      if (post.liked) await apiDelete(`/api/digihub/community/posts/${post.id}/like`);
      else await apiPost(`/api/digihub/community/posts/${post.id}/like`);
    } catch { load(); }
  };

  const filtered = filter === "all" ? posts : posts.filter(p => p.post_type === filter);

  const S = {
    page: { minHeight:"100vh", background:BG, padding:"32px 40px", fontFamily:"'Plus Jakarta Sans',sans-serif" },
    h1: { fontSize:26, fontWeight:800, color:TEXT, letterSpacing:"-0.04em", marginBottom:4 },
    sub: { fontSize:13, color:MUTED, marginBottom:28 },
    layout: { display:"grid", gridTemplateColumns:"1fr 280px", gap:28 },
    card: { background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:20 },
    postCard: { background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:20, marginBottom:14, position:"relative" },
    avatar: (color) => ({ width:40, height:40, borderRadius:"50%", background:`${color}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color, flexShrink:0 }),
    typeTag: (t) => {
      const colors = { "Hiring Now":"#22c55e", "Business Offer":"#e8185d", "Industry Insight":BLUE, "Achievement":"#f59e0b", "Looking for Work":"#8b5cf6", "Portfolio Share":BLUE };
      const c = colors[t] || MUTED;
      return { display:"inline-block", padding:"3px 9px", background:`${c}12`, border:`1px solid ${c}30`, borderRadius:5, fontSize:10, fontWeight:700, color:c };
    },
    btn: { padding:"10px 22px", background:BLUE, color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" },
    pill: { padding:"5px 12px", borderRadius:20, fontSize:11, fontWeight:600, cursor:"pointer", border:"none", fontFamily:"inherit" },
  };

  const planColors = { admin:"#e8185d", pro:"#e8185d", premium:BLUE, monthly:BLUE, yearly:"#22c55e", starter:MUTED, free:FAINT };

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'); .dh-comm-layout{display:grid;grid-template-columns:1fr 280px;gap:28px} @media(max-width:760px){.dh-comm-layout{grid-template-columns:1fr!important}}`}</style>
      <div style={S.h1}>◉ Community</div>
      <div style={S.sub}>{isBusiness ? "Connect with businesses — share updates, hiring posts, offers & insights" : "Connect with professionals — share your journey, find opportunities"}</div>

      {loadError && (
        <div style={{ background:"#dc262610", border:"1px solid #dc262630", borderRadius:10, padding:"12px 16px", marginBottom:16, color:"#dc2626", fontSize:13, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          {loadError}
          <button onClick={load} style={{ background:"none", border:"none", color:"#dc2626", fontWeight:700, cursor:"pointer", fontSize:13 }}>Retry</button>
        </div>
      )}

      <div className="dh-comm-layout">
        {/* Main Feed */}
        <div>
          {/* Post composer */}
          <div style={{ ...S.card, marginBottom:20 }}>
            <div style={{ display:"flex", gap:12, marginBottom:12 }}>
              <div style={S.avatar(BLUE)}>
                {(profile?.full_name||"YO").slice(0,2).toUpperCase()}
              </div>
              <textarea
                value={newPost}
                onChange={e=>setNewPost(e.target.value.slice(0,2000))}
                placeholder={isBusiness ? "Share a business update, job opening, or offer with the community..." : "Share your career update, showcase work, or connect with others..."}
                style={{ flex:1, background:BG, border:`1px solid ${BORDER}`, borderRadius:10, padding:12, color:TEXT, fontSize:13, fontFamily:"inherit", resize:"none", minHeight:80, outline:"none" }}
              />
            </div>
            {postErr && <div style={{ fontSize:12, color:"#dc2626", marginBottom:10 }}>{postErr}</div>}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <select value={postType} onChange={e=>setPostType(e.target.value)} style={{ background:BG, border:`1px solid ${BORDER}`, borderRadius:7, padding:"6px 10px", color:TEXT, fontSize:12, fontFamily:"inherit", outline:"none" }}>
                {types.map(t=><option key={t}>{t}</option>)}
              </select>
              <button onClick={submitPost} disabled={!newPost.trim()||posting} style={{ ...S.btn, opacity:(!newPost.trim()||posting)?0.5:1 }}>{posting?"Posting…":"Post"}</button>
            </div>
          </div>

          {/* Filter pills */}
          <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
            {["all", ...(isBusiness ? POST_TYPES_BIZ.slice(0,4) : POST_TYPES_IND.slice(0,4))].map(f => (
              <button key={f} onClick={()=>setFilter(f)} style={{ ...S.pill, background:filter===f?BLUE:CARD, color:filter===f?"#fff":MUTED, border:filter===f?"none":`1px solid ${BORDER}` }}>
                {f === "all" ? "All Posts" : f}
              </button>
            ))}
          </div>

          {/* Posts */}
          {loading ? (
            <div style={{ textAlign:"center", padding:"60px 0", color:FAINT, fontSize:13 }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ ...S.card, textAlign:"center", padding:48 }}>
              <div style={{ fontSize:32, marginBottom:12, opacity:0.25 }}>◉</div>
              <div style={{ fontSize:14, color:FAINT }}>No posts yet — be the first to share something.</div>
            </div>
          ) : filtered.map(post => (
            <div key={post.id} style={S.postCard}>
              {/* Header */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                  <div style={S.avatar(BLUE)}>
                    {(post.author||"A").slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:14, fontWeight:700, color:TEXT }}>{post.author}</span>
                      {post.plan && <span style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:planColors[post.plan]||MUTED }}>{post.plan}</span>}
                    </div>
                    <div style={{ fontSize:11, color:FAINT }}>{new Date(post.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <span style={S.typeTag(post.post_type)}>{post.post_type}</span>
              </div>

              {/* Content */}
              <div style={{ fontSize:14, color:"#374151", lineHeight:1.75, whiteSpace:"pre-wrap" }}>
                {expanded[post.id] ? post.content : post.content.slice(0,280)}
                {post.content.length > 280 && (
                  <button onClick={()=>setExpanded(e=>({...e,[post.id]:!e[post.id]}))} style={{ background:"none", border:"none", color:BLUE, cursor:"pointer", fontSize:13, fontFamily:"inherit", marginLeft:4 }}>
                    {expanded[post.id] ? "See less" : "...See more"}
                  </button>
                )}
              </div>

              {/* Actions */}
              <div style={{ marginTop:14, paddingTop:12, borderTop:`1px solid ${BORDER}`, display:"flex", gap:20, position:"relative" }}>
                <button onClick={()=>toggleLike(post)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, color:post.liked?BLUE:MUTED, fontFamily:"inherit", padding:0, fontWeight:post.liked?700:400 }}>
                  ♥ {post.likes} {post.liked?"Liked":"Like"}
                </button>
                <button onClick={()=>setShareOpenId(id => id===post.id ? null : post.id)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, color:shareOpenId===post.id?BLUE:MUTED, fontFamily:"inherit", padding:0 }}>
                  ⊕ Share
                </button>
                {shareOpenId === post.id && (
                  <ShareMenu post={post} onClose={() => setShareOpenId(null)} />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div>
          <div style={S.card}>
            <div style={{ fontSize:13, fontWeight:700, color:TEXT, marginBottom:14 }}>Community</div>
            {[
              { label:"Total posts", value: String(posts.length) },
              { label: isBusiness ? "Hiring posts" : "Open to work", value: String(posts.filter(p=>p.post_type==="Hiring Now"||p.post_type==="Looking for Work").length) },
            ].map(s => (
              <div key={s.label} style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                <span style={{ fontSize:12, color:MUTED }}>{s.label}</span>
                <span style={{ fontSize:12, fontWeight:700, color:TEXT }}>{s.value}</span>
              </div>
            ))}
          </div>

          <div style={{ ...S.card, marginTop:14 }}>
            <div style={{ fontSize:13, fontWeight:700, color:TEXT, marginBottom:12 }}>Community Guidelines</div>
            {["Be professional and respectful","No spam or self-promotion only posts","Hiring posts: include salary range","Offers: include validity period"].map((g,i) => (
              <div key={i} style={{ fontSize:11, color:MUTED, marginBottom:7, display:"flex", gap:7 }}>
                <span style={{ color:BLUE }}>→</span>{g}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
