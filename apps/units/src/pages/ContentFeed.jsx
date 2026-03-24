import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

const PINK  = "#e8185d";
const TEXT  = "#111827";
const MUTED = "#6b7280";
const LIGHT = "#f8f9fb";
const CARD  = "#ffffff";
const BORDER= "#e8eaed";

const POST_TYPES = ["Brand Reel","Behind the Scenes","Product Showcase","Campaign Launch","Brand Update","Team Story","Client Win","Creative Process"];

function timeAgo(ts) {
  const s = Math.floor((Date.now()-new Date(ts))/1000);
  if (s<60) return "Just now";
  if (s<3600) return `${Math.floor(s/60)}m ago`;
  if (s<86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

export default function ContentFeed({ profile }) {
  const nav = useNavigate();
  const [posts,      setPosts]      = useState([]);
  const [newText,    setNewText]    = useState("");
  const [postType,   setPostType]   = useState("Brand Update");
  const [filter,     setFilter]     = useState("All");
  const [expanded,   setExpanded]   = useState({});
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [totalCount, setTotalCount] = useState(0);
  const [weekCount,  setWeekCount]  = useState(0);
  const [error,      setError]      = useState(null);

  // Load posts from Supabase
  useEffect(() => {
    loadPosts();
  }, [filter]);

  const loadPosts = async () => {
    setLoading(true); setError(null);
    try {
      let q = supabase.from("units_feed_posts").select("*")
        .order("created_at", { ascending:false }).limit(50);
      if (filter !== "All") q = q.eq("post_type", filter);

      const { data, error:err } = await q;
      if (err) throw err;
      setPosts(data || []);

      // Stats
      const [{ count:total }, { count:week }] = await Promise.all([
        supabase.from("units_feed_posts").select("*",{count:"exact",head:true}),
        supabase.from("units_feed_posts").select("*",{count:"exact",head:true})
          .gte("created_at", new Date(Date.now()-7*86400000).toISOString()),
      ]);
      setTotalCount(total||0); setWeekCount(week||0);

      // Load user's likes
      if (profile?.id) {
        const { data:likes } = await supabase.from("units_feed_likes")
          .select("post_id").eq("user_id", profile.id);
        setLikedPosts(new Set((likes||[]).map(l=>l.post_id)));
      }
    } catch(e) {
      console.error("Feed load error:", e); setError("Could not load posts.");
    }
    setLoading(false);
  };

  // Submit new post
  const submit = async () => {
    if (!newText.trim() || !profile?.id || submitting) return;
    setSubmitting(true);
    try {
      const { data, error:err } = await supabase.from("units_feed_posts")
        .insert({ user_id:profile.id, user_name:profile.full_name||(profile.email?.split("@")[0])||"User",
          user_plan:profile.plan||"free", post_type:postType, content:newText.trim() })
        .select().single();
      if (err) throw err;
      setPosts(ps => [data, ...ps]);
      setNewText(""); setTotalCount(c=>c+1); setWeekCount(c=>c+1);
    } catch(e) {
      console.error("Post submit error:", e);
      alert("Could not post: " + e.message + "\n\nRun units_tables.sql in Supabase first.");
    }
    setSubmitting(false);
  };

  // Toggle like
  const toggleLike = async (postId) => {
    if (!profile?.id) return;
    const isLiked = likedPosts.has(postId);
    // Optimistic
    setLikedPosts(prev => { const n=new Set(prev); isLiked?n.delete(postId):n.add(postId); return n; });
    setPosts(prev => prev.map(p => p.id===postId ? {...p, likes_count:Math.max(0,p.likes_count+(isLiked?-1:1))} : p));
    try {
      if (isLiked) {
        await supabase.from("units_feed_likes").delete().eq("post_id",postId).eq("user_id",profile.id);
        await supabase.rpc("decrement_feed_likes",{p_post_id:postId});
      } else {
        await supabase.from("units_feed_likes").insert({post_id:postId,user_id:profile.id});
        await supabase.rpc("increment_feed_likes",{p_post_id:postId});
      }
    } catch(e) {
      // Revert
      setLikedPosts(prev=>{const n=new Set(prev); isLiked?n.add(postId):n.delete(postId); return n;});
      setPosts(prev=>prev.map(p=>p.id===postId?{...p,likes_count:Math.max(0,p.likes_count+(isLiked?1:-1))}:p));
    }
  };

  // Delete own post
  const deletePost = async (id) => {
    if (!confirm("Delete this post?")) return;
    const { error:err } = await supabase.from("units_feed_posts").delete().eq("id",id);
    if (!err) { setPosts(ps=>ps.filter(p=>p.id!==id)); setTotalCount(c=>Math.max(0,c-1)); }
  };

  const S = {
    page:   { minHeight:"100vh", background:LIGHT, padding:"36px 44px", fontFamily:"'Plus Jakarta Sans',sans-serif" },
    card:   { background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:22, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" },
    btn:    { padding:"10px 22px", background:PINK, color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" },
    pill:   { padding:"5px 14px", borderRadius:20, fontSize:11, fontWeight:600, cursor:"pointer", border:"none", fontFamily:"inherit" },
    typeTag:{ display:"inline-block", padding:"3px 10px", background:`${PINK}10`, border:`1px solid ${PINK}20`, borderRadius:20, fontSize:10, fontWeight:700, color:PINK },
    avatar: (size=38) => ({ width:size, height:size, borderRadius:"50%", background:`${PINK}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size>34?13:11, fontWeight:800, color:PINK, flexShrink:0 }),
  };

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 290px", gap:24 }}>
        {/* Main */}
        <div>
          <div style={{ fontSize:22, fontWeight:800, color:TEXT, letterSpacing:"-0.04em", marginBottom:4 }}>◉ Content Feed</div>
          <div style={{ fontSize:13, color:MUTED, marginBottom:24 }}>Share your brand's content journey with the community</div>

          {/* Composer */}
          <div style={{ ...S.card, marginBottom:20 }}>
            <div style={{ display:"flex", gap:12, marginBottom:12 }}>
              <div style={S.avatar()}>{(profile?.full_name||"YO").slice(0,2).toUpperCase()}</div>
              <textarea value={newText} onChange={e=>setNewText(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter"&&e.ctrlKey) submit(); }}
                placeholder="Share a brand reel, campaign launch, BTS shot, or creative process with the community..."
                style={{ flex:1, border:`1px solid ${BORDER}`, borderRadius:12, padding:"12px 14px", fontSize:13, color:TEXT, fontFamily:"inherit", resize:"none", minHeight:90, outline:"none", lineHeight:1.65, background:"#fafafa" }}
                onFocus={e=>e.target.style.borderColor=`${PINK}50`}
                onBlur={e=>e.target.style.borderColor=BORDER}/>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:12, color:MUTED }}>Type:</span>
                <select value={postType} onChange={e=>setPostType(e.target.value)}
                  style={{ border:`1px solid ${BORDER}`, borderRadius:8, padding:"6px 10px", fontSize:12, color:TEXT, fontFamily:"inherit", outline:"none", background:"#fafafa" }}>
                  {POST_TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
                <span style={{ fontSize:11, color:MUTED }}>Ctrl+Enter to post</span>
              </div>
              <button onClick={submit} disabled={!newText.trim()||submitting}
                style={{ ...S.btn, opacity:(!newText.trim()||submitting)?0.4:1 }}>
                {submitting?"Posting…":"Post"}
              </button>
            </div>
          </div>

          {/* Filters */}
          <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
            {["All", ...POST_TYPES.slice(0,5)].map(f=>(
              <button key={f} onClick={()=>setFilter(f)}
                style={{ ...S.pill, background:filter===f?PINK:"#fff", color:filter===f?"#fff":MUTED, border:filter===f?"none":`1px solid ${BORDER}` }}>
                {f}
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
          {loading && <div style={{ textAlign:"center", padding:"40px 0", color:MUTED, fontSize:13 }}>Loading feed…</div>}

          {/* Empty */}
          {!loading && !error && posts.length===0 && (
            <div style={{ ...S.card, textAlign:"center", padding:"40px 24px" }}>
              <div style={{ fontSize:28, marginBottom:12 }}>◉</div>
              <div style={{ fontSize:15, fontWeight:700, color:TEXT, marginBottom:6 }}>Be the first to post</div>
              <div style={{ fontSize:13, color:MUTED }}>Share your brand content journey with the community.</div>
            </div>
          )}

          {/* Posts */}
          {!loading && posts.map(post => {
            const isOwn  = post.user_id===profile?.id;
            const isLiked= likedPosts.has(post.id);
            const initials=(post.user_name||"??").slice(0,2).toUpperCase();
            return (
              <div key={post.id} style={{ ...S.card, marginBottom:16 }}>
                {/* Header */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                  <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                    <div style={S.avatar()}>{initials}</div>
                    <div>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <span style={{ fontSize:14, fontWeight:700, color:TEXT }}>{post.user_name||"Community Member"}</span>
                        {post.user_plan!=="free"&&<span style={{ fontSize:10, color:PINK }}>✓</span>}
                      </div>
                      <div style={{ fontSize:11, color:MUTED }}>{timeAgo(post.created_at)}</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={S.typeTag}>{post.post_type}</span>
                    {isOwn && (
                      <button onClick={()=>deletePost(post.id)}
                        style={{ background:"none",border:"none",color:"#ddd",cursor:"pointer",fontSize:14,lineHeight:1 }} title="Delete">✕</button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div style={{ fontSize:14, color:TEXT, lineHeight:1.75, whiteSpace:"pre-wrap", marginBottom:14 }}>
                  {expanded[post.id]?post.content:post.content.slice(0,300)}
                  {post.content.length>300 && (
                    <button onClick={()=>setExpanded(e=>({...e,[post.id]:!e[post.id]}))}
                      style={{ background:"none",border:"none",color:PINK,cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:600 }}>
                      {expanded[post.id]?" Less":" ...More"}
                    </button>
                  )}
                </div>

                {/* Media */}
                {post.media_url && (
                  <div style={{ background:"#fef2f2", border:`1px solid ${BORDER}`, borderRadius:12, padding:"32px 24px", textAlign:"center", marginBottom:14 }}>
                    <div style={{ fontSize:32, marginBottom:8 }}>▶</div>
                    <div style={{ fontSize:13, color:MUTED }}>{post.media_url}</div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ borderTop:`1px solid #f3f4f6`, paddingTop:12, display:"flex", gap:20 }}>
                  <button onClick={()=>toggleLike(post.id)}
                    style={{ background:"none",border:"none",cursor:"pointer",fontSize:13,color:isLiked?PINK:MUTED,fontFamily:"inherit",fontWeight:isLiked?700:400,display:"flex",alignItems:"center",gap:5,transition:"color 0.13s" }}>
                    {isLiked?"♥":"♡"} {post.likes_count}
                  </button>
                  <button style={{ background:"none",border:"none",cursor:"pointer",fontSize:13,color:MUTED,fontFamily:"inherit",display:"flex",alignItems:"center",gap:5 }}>
                    ◎ {post.comments_count}
                  </button>
                  <button style={{ background:"none",border:"none",cursor:"pointer",fontSize:13,color:MUTED,fontFamily:"inherit",display:"flex",alignItems:"center",gap:5 }}>
                    ⊕ {post.shares_count}
                  </button>
                  <button onClick={()=>nav("/book")}
                    style={{ background:"none",border:"none",cursor:"pointer",fontSize:13,color:PINK,fontFamily:"inherit",fontWeight:600,marginLeft:"auto" }}>
                    Book Units →
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar */}
        <div>
          <div style={{ ...S.card, marginBottom:14 }}>
            <div style={{ fontSize:13, fontWeight:700, color:TEXT, marginBottom:14 }}>Community Stats</div>
            {[
              {l:"Total Posts",     v:totalCount>0?totalCount.toLocaleString():"—"},
              {l:"Posts this week", v:weekCount>0?weekCount.toLocaleString():"—"},
              {l:"Active now",      v:"Live"},
              {l:"Avg engagements", v:"—"},
            ].map(s=>(
              <div key={s.l} style={{ display:"flex",justifyContent:"space-between",marginBottom:10 }}>
                <span style={{ fontSize:12,color:MUTED }}>{s.l}</span>
                <span style={{ fontSize:12,fontWeight:700,color:TEXT }}>{s.v}</span>
              </div>
            ))}
          </div>

          <div style={{ ...S.card, marginBottom:14 }}>
            <div style={{ fontSize:13,fontWeight:700,color:TEXT,marginBottom:12 }}>🎬 Need content?</div>
            <div style={{ fontSize:12,color:MUTED,lineHeight:1.65,marginBottom:14 }}>
              NuGens Units handles end-to-end content creation — scripting, shooting, editing, strategy, and more.
            </div>
            <a href="/book" style={{ display:"block",width:"100%",padding:"10px 0",background:PINK,color:"#fff",borderRadius:9,textAlign:"center",textDecoration:"none",fontSize:13,fontWeight:700 }}>
              Book Our Team →
            </a>
          </div>

          <div style={S.card}>
            <div style={{ fontSize:13,fontWeight:700,color:TEXT,marginBottom:12 }}>Post Guidelines</div>
            {["Share your brand's real work","Tag the type of content clearly","Celebrate collaborations & wins","Inspire with process & BTS content","No spam or unrelated promotions"].map((g,i)=>(
              <div key={i} style={{ fontSize:11,color:MUTED,marginBottom:8,display:"flex",gap:6 }}>
                <span style={{ color:PINK,flexShrink:0 }}>→</span>{g}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}