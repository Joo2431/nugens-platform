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

function ago(ts) {
  const s=Math.floor((Date.now()-new Date(ts))/1000);
  if(s<60) return "Just now";
  if(s<3600) return `${Math.floor(s/60)}m ago`;
  if(s<86400) return `${Math.floor(s/3600)}h ago`;
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

  useEffect(() => { loadPosts(); }, [filter]);

  const loadPosts = async () => {
    setLoading(true); setError(null);
    try {
      let q = supabase.from("units_feed_posts").select("*")
        .order("created_at",{ascending:false}).limit(50);
      if (filter!=="All") q = q.eq("post_type",filter);
      const {data,error:err} = await q;
      if (err) throw err;
      setPosts(data||[]);
      const [{count:tot},{count:wk}] = await Promise.all([
        supabase.from("units_feed_posts").select("*",{count:"exact",head:true}),
        supabase.from("units_feed_posts").select("*",{count:"exact",head:true})
          .gte("created_at",new Date(Date.now()-7*86400000).toISOString()),
      ]);
      setTotalCount(tot||0); setWeekCount(wk||0);
      if (profile?.id) {
        const {data:lk} = await supabase.from("units_feed_likes").select("post_id").eq("user_id",profile.id);
        setLikedPosts(new Set((lk||[]).map(l=>l.post_id)));
      }
    } catch(e) { console.error(e); setError("Could not load feed."); }
    setLoading(false);
  };

  const submit = async () => {
    if (!newText.trim()||!profile?.id||submitting) return;
    setSubmitting(true);
    try {
      // Only send columns that exist in the table
      const row = {
        user_id:   profile.id,
        user_name: profile.full_name || profile.email?.split("@")[0] || "User",
        user_plan: profile.plan || "free",
        post_type: postType,
        content:   newText.trim(),
      };
      const {data,error:err} = await supabase.from("units_feed_posts").insert(row).select().single();
      if (err) throw err;
      setPosts(ps=>[data,...ps]); setNewText("");
      setTotalCount(c=>c+1); setWeekCount(c=>c+1);
    } catch(e) {
      console.error("Post error:",e);
      alert("Could not post: "+e.message+"\n\nRun fix_units_columns.sql in Supabase first.");
    }
    setSubmitting(false);
  };

  const toggleLike = async (postId) => {
    if (!profile?.id) return;
    const isLiked = likedPosts.has(postId);
    setLikedPosts(prev=>{const n=new Set(prev);isLiked?n.delete(postId):n.add(postId);return n;});
    setPosts(prev=>prev.map(p=>p.id===postId?{...p,likes_count:Math.max(0,(p.likes_count||0)+(isLiked?-1:1))}:p));
    try {
      if (isLiked) {
        await supabase.from("units_feed_likes").delete().eq("post_id",postId).eq("user_id",profile.id);
        await supabase.rpc("decrement_feed_likes",{p_post_id:postId});
      } else {
        await supabase.from("units_feed_likes").insert({post_id:postId,user_id:profile.id});
        await supabase.rpc("increment_feed_likes",{p_post_id:postId});
      }
    } catch(e) {
      setLikedPosts(prev=>{const n=new Set(prev);isLiked?n.add(postId):n.delete(postId);return n;});
      setPosts(prev=>prev.map(p=>p.id===postId?{...p,likes_count:Math.max(0,(p.likes_count||0)+(isLiked?1:-1))}:p));
    }
  };

  const deletePost = async (id) => {
    if (!confirm("Delete this post?")) return;
    const {error:err} = await supabase.from("units_feed_posts").delete().eq("id",id);
    if (!err) { setPosts(ps=>ps.filter(p=>p.id!==id)); setTotalCount(c=>Math.max(0,c-1)); }
  };

  const av=(size=36)=>({width:size,height:size,borderRadius:"50%",background:`${PINK}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size>32?12:11,fontWeight:800,color:PINK,flexShrink:0});
  const typeTag={display:"inline-block",padding:"2px 9px",background:`${PINK}10`,border:`1px solid ${PINK}20`,borderRadius:20,fontSize:9.5,fontWeight:700,color:PINK};

  return (
    <div style={{minHeight:"100vh",background:LIGHT,padding:"24px 32px",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'); textarea:focus{border-color:${PINK}60!important;outline:none}`}</style>

      <div style={{display:"grid",gridTemplateColumns:"1fr 260px",gap:20,maxWidth:1100}}>
        {/* Main */}
        <div>
          <div style={{fontSize:20,fontWeight:800,color:TEXT,letterSpacing:"-0.04em",marginBottom:3}}>◉ Content Feed</div>
          <div style={{fontSize:12,color:MUTED,marginBottom:20}}>Share your brand's content journey with the community</div>

          {/* Composer */}
          <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:14,padding:18,marginBottom:16,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
            <div style={{display:"flex",gap:10,marginBottom:10}}>
              <div style={av()}>{(profile?.full_name||"YO").slice(0,2).toUpperCase()}</div>
              <textarea value={newText} onChange={e=>setNewText(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&e.ctrlKey)submit();}}
                placeholder="Share a brand reel, campaign launch, BTS shot, or creative process…"
                style={{flex:1,border:`1px solid ${BORDER}`,borderRadius:10,padding:"10px 12px",fontSize:13,color:TEXT,fontFamily:"inherit",resize:"none",minHeight:80,lineHeight:1.6,background:"#fafafa"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:11,color:MUTED}}>Type:</span>
                <select value={postType} onChange={e=>setPostType(e.target.value)}
                  style={{border:`1px solid ${BORDER}`,borderRadius:7,padding:"5px 9px",fontSize:12,color:TEXT,fontFamily:"inherit",outline:"none",background:"#fafafa"}}>
                  {POST_TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
                <span style={{fontSize:10,color:MUTED}}>Ctrl+Enter</span>
              </div>
              <button onClick={submit} disabled={!newText.trim()||submitting}
                style={{padding:"8px 20px",background:(!newText.trim()||submitting)?`${PINK}50`:PINK,color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:(!newText.trim()||submitting)?"not-allowed":"pointer",fontFamily:"inherit"}}>
                {submitting?"Posting…":"Post"}
              </button>
            </div>
          </div>

          {/* Filters */}
          <div style={{display:"flex",gap:7,marginBottom:16,flexWrap:"wrap"}}>
            {["All",...POST_TYPES.slice(0,5)].map(f=>(
              <button key={f} onClick={()=>setFilter(f)}
                style={{padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:600,cursor:"pointer",border:"none",fontFamily:"inherit",
                  background:filter===f?PINK:"#fff",color:filter===f?"#fff":MUTED,
                  boxShadow:filter===f?"none":`0 0 0 1px ${BORDER}`}}>
                {f}
              </button>
            ))}
          </div>

          {/* Error */}
          {error&&(
            <div style={{padding:"10px 14px",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,color:"#dc2626",fontSize:12,marginBottom:14}}>
              {error} <button onClick={loadPosts} style={{background:"none",border:"none",color:"#dc2626",cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>Retry</button>
            </div>
          )}

          {loading&&<div style={{textAlign:"center",padding:"32px 0",color:MUTED,fontSize:13}}>Loading feed…</div>}

          {!loading&&!error&&posts.length===0&&(
            <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:14,padding:"36px 24px",textAlign:"center",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
              <div style={{fontSize:24,marginBottom:10}}>◉</div>
              <div style={{fontSize:14,fontWeight:700,color:TEXT,marginBottom:5}}>Be the first to post</div>
              <div style={{fontSize:12,color:MUTED}}>Share your brand content journey with the community.</div>
            </div>
          )}

          {!loading&&posts.map(post=>{
            const isOwn=post.user_id===profile?.id;
            const isLiked=likedPosts.has(post.id);
            const initials=(post.user_name||"??").slice(0,2).toUpperCase();
            return (
              <div key={post.id} style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:14,padding:18,marginBottom:14,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                  <div style={{display:"flex",gap:9,alignItems:"center"}}>
                    <div style={av()}>{initials}</div>
                    <div>
                      <div style={{display:"flex",alignItems:"center",gap:5}}>
                        <span style={{fontSize:13,fontWeight:700,color:TEXT}}>{post.user_name||"Community Member"}</span>
                        {post.user_plan&&post.user_plan!=="free"&&<span style={{fontSize:9,color:PINK}}>✓</span>}
                      </div>
                      <div style={{fontSize:10,color:MUTED}}>{ago(post.created_at)}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    <span style={typeTag}>{post.post_type}</span>
                    {isOwn&&<button onClick={()=>deletePost(post.id)} style={{background:"none",border:"none",color:"#ddd",cursor:"pointer",fontSize:12,lineHeight:1}} title="Delete">✕</button>}
                  </div>
                </div>

                <div style={{fontSize:13.5,color:TEXT,lineHeight:1.72,whiteSpace:"pre-wrap",marginBottom:12}}>
                  {expanded[post.id]?post.content:post.content.slice(0,280)}
                  {post.content.length>280&&(
                    <button onClick={()=>setExpanded(e=>({...e,[post.id]:!e[post.id]}))}
                      style={{background:"none",border:"none",color:PINK,cursor:"pointer",fontSize:12,fontFamily:"inherit",fontWeight:600}}>
                      {expanded[post.id]?" Less":" …More"}
                    </button>
                  )}
                </div>

                {post.media_url&&(
                  <div style={{background:"#fef2f2",border:`1px solid ${BORDER}`,borderRadius:10,padding:"24px",textAlign:"center",marginBottom:12}}>
                    <div style={{fontSize:28,marginBottom:6}}>▶</div>
                    <div style={{fontSize:12,color:MUTED}}>{post.media_url}</div>
                  </div>
                )}

                <div style={{borderTop:`1px solid #f3f4f6`,paddingTop:10,display:"flex",gap:18,alignItems:"center"}}>
                  <button onClick={()=>toggleLike(post.id)}
                    style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:isLiked?PINK:MUTED,fontFamily:"inherit",fontWeight:isLiked?700:400,display:"flex",alignItems:"center",gap:4}}>
                    {isLiked?"♥":"♡"} {post.likes_count||0}
                  </button>
                  <button style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:MUTED,fontFamily:"inherit",display:"flex",alignItems:"center",gap:4}}>
                    ◎ {post.comments_count||0}
                  </button>
                  <button onClick={()=>nav("/book")}
                    style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:PINK,fontFamily:"inherit",fontWeight:600,marginLeft:"auto"}}>
                    Book Units →
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar */}
        <div>
          <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:14,padding:18,marginBottom:12,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
            <div style={{fontSize:12,fontWeight:700,color:TEXT,marginBottom:12}}>Community Stats</div>
            {[
              {l:"Total Posts",     v:totalCount>0?totalCount.toLocaleString():"—"},
              {l:"Posts this week", v:weekCount>0?weekCount.toLocaleString():"—"},
              {l:"Active now",      v:"Live"},
              {l:"Avg engagements", v:"—"},
            ].map(s=>(
              <div key={s.l} style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontSize:11,color:MUTED}}>{s.l}</span>
                <span style={{fontSize:11,fontWeight:700,color:TEXT}}>{s.v}</span>
              </div>
            ))}
          </div>

          <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:14,padding:18,marginBottom:12,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
            <div style={{fontSize:12,fontWeight:700,color:TEXT,marginBottom:10}}>🎬 Need content?</div>
            <div style={{fontSize:11,color:MUTED,lineHeight:1.6,marginBottom:12}}>
              NuGens Units handles end-to-end content creation — scripting, shooting, editing, strategy, and more.
            </div>
            <a href="/book" style={{display:"block",width:"100%",padding:"9px 0",background:PINK,color:"#fff",borderRadius:8,textAlign:"center",textDecoration:"none",fontSize:12,fontWeight:700,boxSizing:"border-box"}}>
              Book Our Team →
            </a>
          </div>

          <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:14,padding:18,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
            <div style={{fontSize:12,fontWeight:700,color:TEXT,marginBottom:10}}>Post Guidelines</div>
            {["Share your brand's real work","Tag the type of content clearly","Celebrate collaborations & wins","Inspire with process & BTS content","No spam or unrelated promotions"].map((g,i)=>(
              <div key={i} style={{fontSize:11,color:MUTED,marginBottom:7,display:"flex",gap:5}}>
                <span style={{color:PINK,flexShrink:0}}>→</span>{g}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}