import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const BLUE = "#0284c7";
const BG   = "#06101a";
const CARD = "#0a1628";
const B    = "#1a2030";

const POST_TYPES_BIZ = ["General Update","Hiring Now","Business Offer","New Product","Event","Achievement","Industry Insight","Partnership","Team Update"];
const POST_TYPES_IND = ["Looking for Work","Portfolio Share","Career Update","Achievement","Learning Share","Seeking Advice","Networking","Project Showcase","Freelance Available"];

const MOCK_BIZ_POSTS = [
  { id:1, user:"TechNova Solutions", type:"Hiring Now", avatar:"TN", plan:"premium", content:"🚀 We're hiring! Looking for a Senior React Developer to join our remote team.\n\n📍 Remote (India-based)\n💰 ₹18-26 LPA\n🎯 3+ years experience\n\nSkills: React, Node.js, PostgreSQL, AWS\n\nDM us or comment below to apply!", likes:47, comments:23, time:"2h ago", tags:["#hiring","#react","#techJobs"] },
  { id:2, user:"GreenLeaf Organics", type:"Business Offer", avatar:"GL", plan:"starter", content:"🌿 Exclusive DigiHub Offer!\n\n30% off on our entire organic food range this week only! Use code: DIGIHUB30 at checkout.\n\n✅ Free delivery on orders above ₹499\n✅ 100% certified organic\n✅ Ships pan-India\n\nLink: greenleaf.in", likes:89, comments:12, time:"4h ago", tags:["#organic","#offer","#food"] },
  { id:3, user:"DesignCraft Studio", type:"Industry Insight", avatar:"DC", plan:"premium", content:"💡 Insight of the week:\n\nBrands that maintain consistent visual identity across platforms see 3.5x better brand recall.\n\nKey elements of visual consistency:\n• Color palette (max 3 primary colors)\n• Typography (2-3 fonts max)\n• Photography style\n• Logo usage rules\n\nAre you consistent across your platforms? Drop a 🎨 below!", likes:134, comments:56, time:"1d ago", tags:["#design","#branding","#marketing"] },
];

const MOCK_IND_POSTS = [
  { id:1, user:"Priya Sharma", type:"Portfolio Share", avatar:"PS", plan:"monthly", content:"🎨 Just launched my new design portfolio!\n\nAfter 2 months of work, I've compiled my best UI/UX projects — fintech apps, e-commerce dashboards, and brand identity work.\n\nFeedback welcome! Link in bio 👆\n\n#uidesign #ux #portfolio #designer", likes:63, comments:31, time:"3h ago", tags:["#design","#portfolio","#uidesign"] },
  { id:2, user:"Rahul Dev", type:"Looking for Work", avatar:"RD", plan:"free", content:"🔍 Open to opportunities!\n\nI'm a Full Stack Developer (2.5 years exp) currently seeking new roles.\n\nStack: React, Node.js, MongoDB, Docker\n📍 Open to remote or Bangalore-based\n💼 Notice period: 30 days\n\nIf you know of any openings, please tag or DM! Would appreciate the help 🙏", likes:28, comments:15, time:"5h ago", tags:["#opentowork","#fullstack","#developer"] },
  { id:3, user:"Meera Krishnan", type:"Achievement", avatar:"MK", plan:"yearly", content:"🎉 Milestone alert!\n\nJust crossed ₹5L in freelance earnings this year as a content writer and social media strategist!\n\nStarted from ₹0 clients to now working with 8 brands regularly. Here's what worked:\n\n1. Niching down (B2B SaaS content)\n2. Consistency over perfection\n3. Networking genuinely\n\nHappy to help anyone starting their freelance journey! 💪", likes:201, comments:88, time:"2d ago", tags:["#freelance","#milestone","#contentwriting"] },
];

export default function Community({ profile }) {
  const isBusiness = profile?.user_type === "business";
  const [posts,    setPosts]    = useState(isBusiness ? MOCK_BIZ_POSTS : MOCK_IND_POSTS);
  const [newPost,  setNewPost]  = useState("");
  const [postType, setPostType] = useState(isBusiness ? "General Update" : "General Update");
  const [filter,   setFilter]   = useState("all");
  const [loading,  setLoading]  = useState(false);
  const [expanded, setExpanded] = useState({});

  const types = isBusiness ? POST_TYPES_BIZ : POST_TYPES_IND;

  const submitPost = () => {
    if (!newPost.trim()) return;
    const post = {
      id: Date.now(),
      user: profile?.full_name || "You",
      type: postType,
      avatar: (profile?.full_name||"YO").slice(0,2).toUpperCase(),
      plan: profile?.plan || "free",
      content: newPost,
      likes: 0,
      comments: 0,
      time: "Just now",
      tags: [],
    };
    setPosts(ps => [post, ...ps]);
    setNewPost("");
  };

  const toggleLike = (id) => setPosts(ps => ps.map(p => p.id===id ? {...p, likes:p.liked?p.likes-1:p.likes+1, liked:!p.liked} : p));

  const filtered = filter === "all" ? posts : posts.filter(p => p.type === filter);

  const S = {
    page: { minHeight:"100vh", background:BG, padding:"32px 40px", fontFamily:"'Plus Jakarta Sans',sans-serif" },
    h1: { fontSize:26, fontWeight:800, color:"#fff", letterSpacing:"-0.04em", marginBottom:4 },
    sub: { fontSize:13, color:"#445", marginBottom:28 },
    layout: { display:"grid", gridTemplateColumns:"1fr 280px", gap:28 },
    card: { background:CARD, border:`1px solid ${B}`, borderRadius:14, padding:20 },
    postCard: { background:CARD, border:`1px solid ${B}`, borderRadius:14, padding:20, marginBottom:14 },
    avatar: (color) => ({ width:40, height:40, borderRadius:"50%", background:`${color}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color, flexShrink:0 }),
    typeTag: (t) => {
      const colors = { "Hiring Now":"#22c55e", "Business Offer":"#e8185d", "Industry Insight":BLUE, "Achievement":"#f59e0b", "Looking for Work":"#8b5cf6", "Portfolio Share":BLUE };
      const c = colors[t] || "#445";
      return { display:"inline-block", padding:"3px 9px", background:`${c}15`, border:`1px solid ${c}30`, borderRadius:5, fontSize:10, fontWeight:700, color:c };
    },
    btn: { padding:"10px 22px", background:BLUE, color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" },
    pill: { padding:"5px 12px", borderRadius:20, fontSize:11, fontWeight:600, cursor:"pointer", border:"none", fontFamily:"inherit" },
  };

  const planColors = { admin:"#e8185d", pro:"#e8185d", premium:BLUE, monthly:BLUE, yearly:"#22c55e", starter:"#445", free:"#334" };

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>
      <div style={S.h1}>◉ Community</div>
      <div style={S.sub}>{isBusiness ? "Connect with businesses — share updates, hiring posts, offers & insights" : "Connect with professionals — share your journey, find opportunities"}</div>

      <div style={S.layout}>
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
                onChange={e=>setNewPost(e.target.value)}
                placeholder={isBusiness ? "Share a business update, job opening, or offer with the community..." : "Share your career update, showcase work, or connect with others..."}
                style={{ flex:1, background:"#0d1624", border:`1px solid ${B}`, borderRadius:10, padding:12, color:"#ccc", fontSize:13, fontFamily:"inherit", resize:"none", minHeight:80, outline:"none" }}
              />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <select value={postType} onChange={e=>setPostType(e.target.value)} style={{ background:"#0d1624", border:`1px solid ${B}`, borderRadius:7, padding:"6px 10px", color:"#ccc", fontSize:12, fontFamily:"inherit", outline:"none" }}>
                {types.map(t=><option key={t}>{t}</option>)}
              </select>
              <button onClick={submitPost} disabled={!newPost.trim()} style={{ ...S.btn, opacity:!newPost.trim()?0.5:1 }}>Post</button>
            </div>
          </div>

          {/* Filter pills */}
          <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
            {["all", ...(isBusiness ? POST_TYPES_BIZ.slice(0,4) : POST_TYPES_IND.slice(0,4))].map(f => (
              <button key={f} onClick={()=>setFilter(f)} style={{ ...S.pill, background:filter===f?BLUE:"#0d1624", color:filter===f?"#fff":"#445", border:filter===f?"none":`1px solid ${B}` }}>
                {f === "all" ? "All Posts" : f}
              </button>
            ))}
          </div>

          {/* Posts */}
          {filtered.map(post => (
            <div key={post.id} style={S.postCard}>
              {/* Header */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                  <div style={S.avatar(BLUE)}>
                    {post.avatar}
                  </div>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:14, fontWeight:700, color:"#fff" }}>{post.user}</span>
                      {post.plan && <span style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:planColors[post.plan]||"#334" }}>{post.plan}</span>}
                    </div>
                    <div style={{ fontSize:11, color:"#334" }}>{post.time}</div>
                  </div>
                </div>
                <span style={S.typeTag(post.type)}>{post.type}</span>
              </div>

              {/* Content */}
              <div style={{ fontSize:14, color:"#bbb", lineHeight:1.75, whiteSpace:"pre-wrap" }}>
                {expanded[post.id] ? post.content : post.content.slice(0,280)}
                {post.content.length > 280 && (
                  <button onClick={()=>setExpanded(e=>({...e,[post.id]:!e[post.id]}))} style={{ background:"none", border:"none", color:BLUE, cursor:"pointer", fontSize:13, fontFamily:"inherit", marginLeft:4 }}>
                    {expanded[post.id] ? "See less" : "...See more"}
                  </button>
                )}
              </div>

              {/* Tags */}
              {post.tags?.length > 0 && (
                <div style={{ marginTop:10, display:"flex", gap:6, flexWrap:"wrap" }}>
                  {post.tags.map(t=><span key={t} style={{ fontSize:12, color:`${BLUE}90` }}>{t}</span>)}
                </div>
              )}

              {/* Actions */}
              <div style={{ marginTop:14, paddingTop:12, borderTop:`1px solid ${B}`, display:"flex", gap:20 }}>
                <button onClick={()=>toggleLike(post.id)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, color:post.liked?BLUE:"#445", fontFamily:"inherit", padding:0, fontWeight:post.liked?700:400 }}>
                  ♥ {post.likes} {post.liked?"Liked":"Like"}
                </button>
                <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, color:"#445", fontFamily:"inherit", padding:0 }}>
                  ◎ {post.comments} Comments
                </button>
                <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, color:"#445", fontFamily:"inherit", padding:0 }}>
                  ⊕ Share
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div>
          {/* Community stats */}
          <div style={S.card}>
            <div style={{ fontSize:13, fontWeight:700, color:"#fff", marginBottom:14 }}>Community</div>
            {[
              { label:"Members", value:"2,840" },
              { label:"Posts this week", value:"342" },
              { label: isBusiness ? "Job Listings" : "Opportunities", value: isBusiness ? "89" : "124" },
              { label:"Active now", value:"47" },
            ].map(s => (
              <div key={s.label} style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                <span style={{ fontSize:12, color:"#445" }}>{s.label}</span>
                <span style={{ fontSize:12, fontWeight:700, color:"#ccc" }}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Trending tags */}
          <div style={{ ...S.card, marginTop:14 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#fff", marginBottom:14 }}>Trending Tags</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
              {(isBusiness ? ["#hiring","#startup","#branding","#b2b","#offer","#marketing","#saas"] : ["#opentowork","#portfolio","#freelance","#designer","#developer","#career","#skills"]).map(t => (
                <span key={t} onClick={()=>setFilter("all")} style={{ fontSize:11, color:BLUE, background:`${BLUE}10`, border:`1px solid ${BLUE}20`, borderRadius:5, padding:"3px 8px", cursor:"pointer" }}>{t}</span>
              ))}
            </div>
          </div>

          {/* Post guidelines */}
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
