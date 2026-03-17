import React, { useState } from "react";

const PINK  = "#e8185d";
const TEXT  = "#111827";
const MUTED = "#6b7280";
const LIGHT = "#f8f9fb";
const CARD  = "#ffffff";
const BORDER= "#e8eaed";

const POST_TYPES = ["Brand Reel","Behind the Scenes","Product Showcase","Campaign Launch","Brand Update","Team Story","Client Win","Creative Process"];

const MOCK_POSTS = [
  {
    id:1, user:"KraftBrews Co.", avatar:"KB", verified:true, type:"Brand Reel", time:"1h ago",
    content:"Just dropped our new brand reel for the summer season launch 🎬\n\nWe worked with @TheUnits for the entire production — scripting, shoot, edit, and delivery in 7 days. The result was beyond what we imagined.\n\nIf you haven't seen what NuGens Units can do for your brand, now is the time to book.",
    media:{ type:"reel", placeholder:"Brand reel — KraftBrews Summer 2026", color:"#fef2f2" },
    likes:89, comments:23, shares:12, liked:false
  },
  {
    id:2, user:"Meera Designs", avatar:"MD", verified:false, type:"Behind the Scenes", time:"4h ago",
    content:"BTS from our packaging photoshoot last week 📦✨\n\nWanted to show the process — we use AI for content strategy planning (via NuGens DigiHub) and then execute with The Units team for the actual production. The combo is powerful.",
    media:null,
    likes:54, comments:11, shares:7, liked:false
  },
  {
    id:3, user:"TechPulse Media", avatar:"TP", verified:true, type:"Campaign Launch",  time:"1d ago",
    content:"Our Q1 2026 product launch campaign is LIVE 🚀\n\nNumbers after 24 hours:\n• 2.4M impressions\n• 48K video views\n• 3.2% CTR on paid\n\nEntire campaign was scripted, shot, and edited by @TheUnits team. Highly recommend their Content Creation service for any product launch.",
    media:null,
    likes:212, comments:67, shares:44, liked:false
  },
  {
    id:4, user:"Asha Handmade", avatar:"AH", verified:false, type:"Client Win", time:"2d ago",
    content:"Just got featured in @BusinessInsiderIndia thanks to our brand story video 🎉\n\nFrom a small handmade business to being featured nationally — NuGens helped us tell our story the right way. This is what happens when you invest in your content.",
    media:null,
    likes:341, comments:88, shares:61, liked:false
  },
];

export default function ContentFeed({ profile }) {
  const [posts,    setPosts]    = useState(MOCK_POSTS);
  const [newText,  setNewText]  = useState("");
  const [postType, setPostType] = useState("Brand Update");
  const [filter,   setFilter]   = useState("All");
  const [expanded, setExpanded] = useState({});
  const [commenting, setCommenting] = useState(null);
  const [commentText, setCommentText] = useState("");

  const submit = () => {
    if (!newText.trim()) return;
    setPosts(ps => [{
      id: Date.now(),
      user: profile?.full_name || "You",
      avatar: (profile?.full_name||"YO").slice(0,2).toUpperCase(),
      verified: profile?.plan !== "free",
      type: postType,
      time: "Just now",
      content: newText,
      media: null,
      likes: 0, comments: 0, shares: 0, liked: false
    }, ...ps]);
    setNewText("");
  };

  const toggleLike = (id) => setPosts(ps => ps.map(p => p.id===id ? { ...p, likes:p.liked?p.likes-1:p.likes+1, liked:!p.liked } : p));

  const filtered = filter === "All" ? posts : posts.filter(p => p.type === filter);

  const S = {
    page:   { minHeight:"100vh", background:LIGHT, padding:"36px 44px", fontFamily:"'Plus Jakarta Sans',sans-serif" },
    card:   { background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:22, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" },
    btn:    { padding:"10px 22px", background:PINK, color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" },
    pill:   { padding:"5px 14px", borderRadius:20, fontSize:11, fontWeight:600, cursor:"pointer", border:"none", fontFamily:"inherit" },
    typeTag:(t) => ({ display:"inline-block", padding:"3px 10px", background:`${PINK}10`, border:`1px solid ${PINK}20`, borderRadius:20, fontSize:10, fontWeight:700, color:PINK }),
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
              <div style={S.avatar()}>
                {(profile?.full_name||"YO").slice(0,2).toUpperCase()}
              </div>
              <textarea
                value={newText}
                onChange={e=>setNewText(e.target.value)}
                placeholder="Share a brand reel, campaign launch, BTS shot, or creative process with the community..."
                style={{ flex:1, border:`1px solid ${BORDER}`, borderRadius:12, padding:"12px 14px", fontSize:13, color:TEXT, fontFamily:"inherit", resize:"none", minHeight:90, outline:"none", lineHeight:1.65, background:"#fafafa" }}
              />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:12, color:MUTED }}>Type:</span>
                <select value={postType} onChange={e=>setPostType(e.target.value)} style={{ border:`1px solid ${BORDER}`, borderRadius:8, padding:"6px 10px", fontSize:12, color:TEXT, fontFamily:"inherit", outline:"none", background:"#fafafa" }}>
                  {POST_TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <button onClick={submit} disabled={!newText.trim()} style={{ ...S.btn, opacity:!newText.trim()?0.4:1 }}>Post</button>
            </div>
          </div>

          {/* Filters */}
          <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
            {["All", ...POST_TYPES.slice(0,5)].map(f => (
              <button key={f} onClick={()=>setFilter(f)} style={{ ...S.pill, background:filter===f?PINK:"#fff", color:filter===f?"#fff":MUTED, border:filter===f?"none":`1px solid ${BORDER}` }}>{f}</button>
            ))}
          </div>

          {/* Posts */}
          {filtered.map(post => (
            <div key={post.id} style={{ ...S.card, marginBottom:16 }}>
              {/* Header */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                  <div style={S.avatar()}>
                    {post.avatar}
                  </div>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontSize:14, fontWeight:700, color:TEXT }}>{post.user}</span>
                      {post.verified && <span style={{ fontSize:10, color:PINK }}>✓</span>}
                    </div>
                    <div style={{ fontSize:11, color:MUTED }}>{post.time}</div>
                  </div>
                </div>
                <span style={S.typeTag(post.type)}>{post.type}</span>
              </div>

              {/* Content */}
              <div style={{ fontSize:14, color:TEXT, lineHeight:1.75, whiteSpace:"pre-wrap", marginBottom:14 }}>
                {expanded[post.id] ? post.content : post.content.slice(0,300)}
                {post.content.length>300 && (
                  <button onClick={()=>setExpanded(e=>({...e,[post.id]:!e[post.id]}))} style={{ background:"none", border:"none", color:PINK, cursor:"pointer", fontSize:13, fontFamily:"inherit", fontWeight:600 }}>
                    {expanded[post.id]?" Less":" ...More"}
                  </button>
                )}
              </div>

              {/* Media placeholder */}
              {post.media && (
                <div style={{ background:post.media.color||"#f8f9fb", border:`1px solid ${BORDER}`, borderRadius:12, padding:"32px 24px", textAlign:"center", marginBottom:14 }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>▶</div>
                  <div style={{ fontSize:13, color:MUTED }}>{post.media.placeholder}</div>
                </div>
              )}

              {/* Actions */}
              <div style={{ borderTop:`1px solid #f3f4f6`, paddingTop:12, display:"flex", gap:20 }}>
                <button onClick={()=>toggleLike(post.id)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, color:post.liked?PINK:MUTED, fontFamily:"inherit", fontWeight:post.liked?700:400, display:"flex", alignItems:"center", gap:5 }}>
                  {post.liked?"♥":"♡"} {post.likes}
                </button>
                <button onClick={()=>setCommenting(commenting===post.id?null:post.id)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, color:MUTED, fontFamily:"inherit", display:"flex", alignItems:"center", gap:5 }}>
                  ◎ {post.comments}
                </button>
                <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, color:MUTED, fontFamily:"inherit", display:"flex", alignItems:"center", gap:5 }}>
                  ⊕ {post.shares}
                </button>
                <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, color:PINK, fontFamily:"inherit", fontWeight:600, marginLeft:"auto" }}>
                  Book Units →
                </button>
              </div>

              {/* Comment box */}
              {commenting===post.id && (
                <div style={{ marginTop:12, display:"flex", gap:10 }}>
                  <input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Add a comment..." style={{ flex:1, border:`1px solid ${BORDER}`, borderRadius:8, padding:"8px 12px", fontSize:13, color:TEXT, fontFamily:"inherit", outline:"none" }} />
                  <button onClick={()=>{setPosts(ps=>ps.map(p=>p.id===post.id?{...p,comments:p.comments+1}:p));setCommentText("");setCommenting(null);}} style={{ padding:"8px 16px", background:PINK, color:"#fff", border:"none", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Post</button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div>
          <div style={{ ...S.card, marginBottom:14 }}>
            <div style={{ fontSize:13, fontWeight:700, color:TEXT, marginBottom:14 }}>Community Stats</div>
            {[{l:"Businesses",v:"1,240"},{l:"Posts this week",v:"89"},{l:"Active now",v:"34"},{l:"Avg engagements",v:"4.2%"}].map(s=>(
              <div key={s.l} style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                <span style={{ fontSize:12, color:MUTED }}>{s.l}</span>
                <span style={{ fontSize:12, fontWeight:700, color:TEXT }}>{s.v}</span>
              </div>
            ))}
          </div>

          <div style={{ ...S.card, marginBottom:14 }}>
            <div style={{ fontSize:13, fontWeight:700, color:TEXT, marginBottom:12 }}>🎬 Need content?</div>
            <div style={{ fontSize:12, color:MUTED, lineHeight:1.65, marginBottom:14 }}>
              NuGens Units handles end-to-end content creation — scripting, shooting, editing, strategy, and more.
            </div>
            <a href="/book" style={{ display:"block", width:"100%", padding:"10px 0", background:PINK, color:"#fff", borderRadius:9, textAlign:"center", textDecoration:"none", fontSize:13, fontWeight:700 }}>Book Our Team →</a>
          </div>

          <div style={S.card}>
            <div style={{ fontSize:13, fontWeight:700, color:TEXT, marginBottom:12 }}>Post Guidelines</div>
            {["Share your brand's real work","Tag the type of content clearly","Celebrate collaborations & wins","Inspire with process & BTS content","No spam or unrelated promotions"].map((g,i)=>(
              <div key={i} style={{ fontSize:11, color:MUTED, marginBottom:8, display:"flex", gap:6 }}>
                <span style={{ color:PINK, flexShrink:0 }}>→</span>{g}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
