import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

const BLUE = "#0284c7";
const BG   = "#06101a";
const CARD = "#0a1628";
const B    = "#1a2030";

const POST_TYPES_BIZ = ["General Update","Hiring Now","Business Offer","New Product","Event","Achievement","Industry Insight","Partnership","Team Update"];
const POST_TYPES_IND = ["Looking for Work","Portfolio Share","Career Update","Achievement","Learning Share","Seeking Advice","Networking","Project Showcase","Freelance Available"];

function timeAgo(ts) {
  const secs = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (secs < 60)   return "Just now";
  if (secs < 3600) return `${Math.floor(secs/60)}m ago`;
  if (secs < 86400)return `${Math.floor(secs/3600)}h ago`;
  return `${Math.floor(secs/86400)}d ago`;
}

function extractTags(text) {
  return (text.match(/#[a-zA-Z0-9_]+/g) || []).slice(0, 6);
}

export default function Community({ profile }) {
  const isBusiness = profile?.user_type === "business";

  const [posts,      setPosts]      = useState([]);
  const [newPost,    setNewPost]    = useState("");
  const [postType,   setPostType]   = useState("General Update");
  const [filter,     setFilter]     = useState("all");
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [expanded,   setExpanded]   = useState({});
  const [totalCount, setTotalCount] = useState(0);
  const [weekCount,  setWeekCount]  = useState(0);
  const [error,      setError]      = useState(null);

  const types = isBusiness ? POST_TYPES_BIZ : POST_TYPES_IND;

  // ── Load posts from Supabase ──────────────────────────────────────────────
  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let q = supabase
        .from("dh_community_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (filter !== "all") q = q.eq("post_type", filter);

      const { data, error: err } = await q;
      if (err) throw err;
      setPosts(data || []);

      // Load total count + this week count
      const [{ count: total }, { count: week }] = await Promise.all([
        supabase.from("dh_community_posts").select("*", { count:"exact", head:true }),
        supabase.from("dh_community_posts").select("*", { count:"exact", head:true })
          .gte("created_at", new Date(Date.now() - 7*24*60*60*1000).toISOString()),
      ]);
      setTotalCount(total || 0);
      setWeekCount(week || 0);

      // Load user's liked post IDs
      if (profile?.id) {
        const { data: likes } = await supabase
          .from("dh_post_likes")
          .select("post_id")
          .eq("user_id", profile.id);
        setLikedPosts(new Set((likes || []).map(l => l.post_id)));
      }
    } catch (e) {
      console.error("Community load error:", e.message);
      setError("Could not load posts. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [filter, profile?.id]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  // ── Submit new post ───────────────────────────────────────────────────────
  const submitPost = async () => {
    if (!newPost.trim() || !profile?.id || submitting) return;
    setSubmitting(true);
    try {
      const tags = extractTags(newPost);
      const { data, error: err } = await supabase
        .from("dh_community_posts")
        .insert({
          user_id:    profile.id,
          user_name:  profile.full_name || profile.email?.split("@")[0] || "User",
          user_plan:  profile.plan || "free",
          user_type:  profile.user_type || "individual",
          post_type:  postType,
          content:    newPost.trim(),
          tags,
          likes_count:    0,
          comments_count: 0,
        })
        .select()
        .single();

      if (err) throw err;
      setPosts(prev => [data, ...prev]);
      setNewPost("");
      setTotalCount(c => c + 1);
      setWeekCount(c => c + 1);
    } catch (e) {
      console.error("Post submit error:", e.message);
      alert("Could not post. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Toggle like ───────────────────────────────────────────────────────────
  const toggleLike = async (postId) => {
    if (!profile?.id) return;
    const isLiked = likedPosts.has(postId);

    // Optimistic UI update
    setLikedPosts(prev => {
      const n = new Set(prev);
      isLiked ? n.delete(postId) : n.add(postId);
      return n;
    });
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, likes_count: Math.max(0, p.likes_count + (isLiked ? -1 : 1)) } : p
    ));

    try {
      if (isLiked) {
        await supabase.from("dh_post_likes").delete().eq("post_id", postId).eq("user_id", profile.id);
        await supabase.rpc("decrement_post_likes", { post_id: postId });
      } else {
        await supabase.from("dh_post_likes").insert({ post_id: postId, user_id: profile.id });
        await supabase.rpc("increment_post_likes", { post_id: postId });
      }
    } catch (e) {
      // Revert on error
      setLikedPosts(prev => { const n = new Set(prev); isLiked ? n.add(postId) : n.delete(postId); return n; });
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, likes_count: Math.max(0, p.likes_count + (isLiked ? 1 : -1)) } : p
      ));
    }
  };

  // ── Delete own post ───────────────────────────────────────────────────────
  const deletePost = async (postId) => {
    if (!confirm("Delete this post?")) return;
    const { error: err } = await supabase.from("dh_community_posts").delete().eq("id", postId);
    if (!err) {
      setPosts(prev => prev.filter(p => p.id !== postId));
      setTotalCount(c => Math.max(0, c - 1));
    }
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const S = {
    page:     { minHeight:"100vh", background:BG, padding:"32px 40px", fontFamily:"'Plus Jakarta Sans',sans-serif" },
    h1:       { fontSize:26, fontWeight:800, color:"#fff", letterSpacing:"-0.04em", marginBottom:4 },
    sub:      { fontSize:13, color:"#445", marginBottom:28 },
    layout:   { display:"grid", gridTemplateColumns:"1fr 280px", gap:28 },
    card:     { background:CARD, border:`1px solid ${B}`, borderRadius:14, padding:20 },
    postCard: { background:CARD, border:`1px solid ${B}`, borderRadius:14, padding:20, marginBottom:14 },
    avatar:   (color="#0284c7") => ({ width:40, height:40, borderRadius:"50%", background:`${color}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color, flexShrink:0 }),
    typeTag:  (t) => {
      const colors = { "Hiring Now":"#22c55e","Business Offer":"#e8185d","Industry Insight":BLUE,"Achievement":"#f59e0b","Looking for Work":"#8b5cf6","Portfolio Share":BLUE,"New Product":"#0ea5e9" };
      const c = colors[t] || "#445";
      return { display:"inline-block", padding:"3px 9px", background:`${c}15`, border:`1px solid ${c}30`, borderRadius:5, fontSize:10, fontWeight:700, color:c };
    },
    btn:  { padding:"10px 22px", background:BLUE, color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" },
    pill: { padding:"5px 12px", borderRadius:20, fontSize:11, fontWeight:600, cursor:"pointer", border:"none", fontFamily:"inherit" },
  };

  const planColors = { admin:"#e8185d", pro:"#e8185d", premium:BLUE, monthly:BLUE, yearly:"#22c55e", starter:"#445", free:"#334" };

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>
      <div style={S.h1}>◉ Community</div>
      <div style={S.sub}>{isBusiness ? "Connect with businesses — share updates, hiring posts, offers & insights" : "Connect with professionals — share your journey, find opportunities"}</div>

      <div style={S.layout}>
        {/* ── Main Feed ── */}
        <div>

          {/* Post composer */}
          <div style={{ ...S.card, marginBottom:20 }}>
            <div style={{ display:"flex", gap:12, marginBottom:12 }}>
              <div style={S.avatar()}>
                {(profile?.full_name||"YO").slice(0,2).toUpperCase()}
              </div>
              <textarea
                value={newPost}
                onChange={e=>setNewPost(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter"&&e.ctrlKey) submitPost(); }}
                placeholder={isBusiness ? "Share a business update, job opening, or offer with the community..." : "Share your career update, showcase work, or connect with others..."}
                style={{ flex:1, background:"#0d1624", border:`1px solid ${B}`, borderRadius:10, padding:12, color:"#ccc", fontSize:13, fontFamily:"inherit", resize:"none", minHeight:80, outline:"none" }}
              />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <select value={postType} onChange={e=>setPostType(e.target.value)}
                  style={{ background:"#0d1624", border:`1px solid ${B}`, borderRadius:7, padding:"6px 10px", color:"#ccc", fontSize:12, fontFamily:"inherit", outline:"none" }}>
                  {types.map(t=><option key={t}>{t}</option>)}
                </select>
                <span style={{ fontSize:11, color:"#334" }}>Ctrl+Enter to post</span>
              </div>
              <button onClick={submitPost} disabled={!newPost.trim()||submitting}
                style={{ ...S.btn, opacity:(!newPost.trim()||submitting)?0.5:1 }}>
                {submitting ? "Posting…" : "Post"}
              </button>
            </div>
          </div>

          {/* Filter pills */}
          <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
            {["all", ...(isBusiness ? POST_TYPES_BIZ.slice(0,4) : POST_TYPES_IND.slice(0,4))].map(f => (
              <button key={f} onClick={()=>setFilter(f)}
                style={{ ...S.pill, background:filter===f?BLUE:"#0d1624", color:filter===f?"#fff":"#445", border:filter===f?"none":`1px solid ${B}` }}>
                {f === "all" ? "All Posts" : f}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding:"12px 16px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, color:"#dc2626", fontSize:13, marginBottom:16 }}>
              {error} <button onClick={loadPosts} style={{ background:"none",border:"none",color:"#dc2626",cursor:"pointer",fontWeight:700,fontFamily:"inherit" }}>Retry</button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ textAlign:"center", padding:"48px 0", color:"#334" }}>
              <div style={{ fontSize:20, marginBottom:8 }}>◉</div>
              <div style={{ fontSize:13 }}>Loading posts…</div>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && posts.length === 0 && (
            <div style={{ ...S.card, textAlign:"center", padding:"48px 24px" }}>
              <div style={{ fontSize:24, marginBottom:12 }}>✦</div>
              <div style={{ fontSize:15, fontWeight:700, color:"#fff", marginBottom:6 }}>Be the first to post</div>
              <div style={{ fontSize:13, color:"#334" }}>Share an update, a job opening, or something useful with the community.</div>
            </div>
          )}

          {/* Posts */}
          {!loading && posts.map(post => {
            const isOwn   = post.user_id === profile?.id;
            const isLiked = likedPosts.has(post.id);
            const initials= (post.user_name||"??").slice(0,2).toUpperCase();
            const isLong  = post.content.length > 280;
            return (
              <div key={post.id} style={S.postCard}>
                {/* Header */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                  <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                    <div style={S.avatar(BLUE)}>{initials}</div>
                    <div>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:14, fontWeight:700, color:"#fff" }}>{post.user_name || "Community Member"}</span>
                        {post.user_plan && post.user_plan !== "free" && (
                          <span style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:planColors[post.user_plan]||"#334" }}>
                            {post.user_plan}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize:11, color:"#334" }}>{timeAgo(post.created_at)}</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={S.typeTag(post.post_type)}>{post.post_type}</span>
                    {isOwn && (
                      <button onClick={()=>deletePost(post.id)}
                        style={{ background:"none",border:"none",cursor:"pointer",color:"#334",fontSize:14,lineHeight:1,padding:"2px 4px" }}
                        title="Delete post">✕</button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div style={{ fontSize:14, color:"#bbb", lineHeight:1.75, whiteSpace:"pre-wrap" }}>
                  {expanded[post.id] || !isLong ? post.content : post.content.slice(0,280)}
                  {isLong && (
                    <button onClick={()=>setExpanded(e=>({...e,[post.id]:!e[post.id]}))}
                      style={{ background:"none",border:"none",color:BLUE,cursor:"pointer",fontSize:13,fontFamily:"inherit",marginLeft:4 }}>
                      {expanded[post.id] ? "See less" : "...See more"}
                    </button>
                  )}
                </div>

                {/* Tags */}
                {post.tags?.length > 0 && (
                  <div style={{ marginTop:10, display:"flex", gap:6, flexWrap:"wrap" }}>
                    {post.tags.map(t => <span key={t} style={{ fontSize:12, color:`${BLUE}90` }}>{t}</span>)}
                  </div>
                )}

                {/* Actions */}
                <div style={{ marginTop:14, paddingTop:12, borderTop:`1px solid ${B}`, display:"flex", gap:20 }}>
                  <button onClick={()=>toggleLike(post.id)}
                    style={{ background:"none",border:"none",cursor:"pointer",fontSize:13,color:isLiked?BLUE:"#445",fontFamily:"inherit",padding:0,fontWeight:isLiked?700:400,transition:"color 0.13s" }}>
                    ♥ {post.likes_count} {isLiked ? "Liked" : "Like"}
                  </button>
                  <button style={{ background:"none",border:"none",cursor:"pointer",fontSize:13,color:"#445",fontFamily:"inherit",padding:0 }}>
                    ◎ {post.comments_count} Comments
                  </button>
                  <button onClick={()=>{navigator.clipboard?.writeText(post.content);}}
                    style={{ background:"none",border:"none",cursor:"pointer",fontSize:13,color:"#445",fontFamily:"inherit",padding:0 }}>
                    ⊕ Share
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Sidebar ── */}
        <div>
          {/* Live community stats */}
          <div style={S.card}>
            <div style={{ fontSize:13, fontWeight:700, color:"#fff", marginBottom:14 }}>Community</div>
            {[
              { label:"Total Posts",       value: totalCount > 0 ? totalCount.toLocaleString() : "—" },
              { label:"Posts this week",   value: weekCount  > 0 ? weekCount.toLocaleString()  : "—" },
              { label:"Members",           value: "Growing" },
              { label:"Active now",        value: "Live" },
            ].map(s => (
              <div key={s.label} style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                <span style={{ fontSize:12, color:"#445" }}>{s.label}</span>
                <span style={{ fontSize:12, fontWeight:700, color:"#ccc" }}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Trending tags — extracted from recent posts */}
          <div style={{ ...S.card, marginTop:14 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#fff", marginBottom:14 }}>Trending Tags</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
              {Array.from(new Set(posts.flatMap(p => p.tags||[]))).slice(0,10).map(t => (
                <span key={t} style={{ fontSize:11, color:BLUE, background:`${BLUE}10`, border:`1px solid ${BLUE}20`, borderRadius:5, padding:"3px 8px", cursor:"pointer" }}>{t}</span>
              ))}
              {posts.length === 0 && (isBusiness ? ["#hiring","#startup","#branding","#b2b","#offer","#marketing","#saas"] : ["#opentowork","#portfolio","#freelance","#designer","#developer","#career"]).map(t=>(
                <span key={t} style={{ fontSize:11, color:BLUE, background:`${BLUE}10`, border:`1px solid ${BLUE}20`, borderRadius:5, padding:"3px 8px" }}>{t}</span>
              ))}
            </div>
          </div>

          {/* Guidelines */}
          <div style={{ ...S.card, marginTop:14 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#fff", marginBottom:12 }}>Community Guidelines</div>
            {["Be professional and respectful","No spam or self-promotion only posts","Add relevant tags to help discovery","Hiring posts: include salary range","Offers: include validity period"].map((g,i) => (
              <div key={i} style={{ fontSize:11, color:"#445", marginBottom:7, display:"flex", gap:7 }}>
                <span style={{ color:BLUE }}>→</span>{g}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}