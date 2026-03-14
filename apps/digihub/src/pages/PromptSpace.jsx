import React, { useState } from "react";
import { supabase } from "../lib/supabase";

const BLUE = "#0284c7";
const BG   = "#06101a";
const CARD = "#0a1628";
const B    = "#1a2030";
const API  = "https://nugens-platform.onrender.com";

const CATEGORIES = ["Social Media Post","Logo Concept","Banner/Ad","Poster","Product Mockup","Brand Identity","Email Header","Story/Reel Cover","Infographic","UI Design"];
const PLATFORMS  = ["Instagram","LinkedIn","Twitter/X","Facebook","YouTube","Pinterest","WhatsApp"];
const STYLES     = ["Modern & Minimal","Bold & Energetic","Elegant & Luxury","Playful & Fun","Corporate & Clean","Retro/Vintage","Tech & Futuristic"];

export default function PromptSpace({ profile }) {
  const [category,  setCategory]  = useState("Social Media Post");
  const [platform,  setPlatform]  = useState("Instagram");
  const [style,     setStyle]     = useState("Modern & Minimal");
  const [topic,     setTopic]     = useState("");
  const [brand,     setBrand]     = useState("");
  const [colors,    setColors]    = useState("");
  const [generated, setGenerated] = useState("");
  const [loading,   setLoading]   = useState(false);
  const [posted,    setPosted]    = useState(false);
  const [feed,      setFeed]      = useState([
    { id:1, user:"Priya K.", plan:"premium", category:"Social Media Post", platform:"Instagram", prompt:"A vibrant Instagram carousel post for a D2C skincare brand targeting Gen-Z women. Use soft pastels — blush pink, sage green, and warm ivory. Clean sans-serif typography with airy whitespace. Feature 3 product bottles with glowing skin texture. Style: Aesthetic, editorial, skincare-luxury feel.", time:"2h ago", likes:24 },
    { id:2, user:"Arjun M.", plan:"starter", category:"Banner/Ad", platform:"LinkedIn", prompt:"Professional LinkedIn banner for a B2B SaaS startup in the HR-tech space. Dark navy background with electric blue accents. Show abstract data visualization — graphs and people icons. Headline: 'Hire Smarter, Grow Faster'. Modern corporate aesthetic.", time:"5h ago", likes:18 },
    { id:3, user:"Divya S.", plan:"premium", category:"Logo Concept", platform:"Instagram", prompt:"Minimal logo concept for a cloud kitchen brand called 'Spice Route'. Combine a flame icon and a road/path element. Colors: Deep saffron (#FF6B35), warm white. Bold geometric style. Works on both dark and light backgrounds.", time:"1d ago", likes:41 },
  ]);

  const isBusiness = profile?.user_type === "business";

  const generatePrompt = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setGenerated("");
    try {
      const res = await fetch(`${API}/api/mini-chat`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          message: `Generate a detailed, professional design prompt for:\n- Category: ${category}\n- Platform: ${platform}\n- Visual Style: ${style}\n- Topic/Subject: ${topic}\n- Brand Name: ${brand || "Not specified"}\n- Preferred Colors: ${colors || "Not specified"}\n\nThe prompt should be specific, detailed, and ready to use with AI image generators like Midjourney, DALL-E, or Stable Diffusion. Include: composition, colors, typography style, mood, and technical specs. Make it 4-6 sentences.`,
          userType: profile?.user_type || "individual",
          product: "digihub"
        })
      });
      const data = await res.json();
      const text = data?.reply || data?.message || "";
      setGenerated(text);
    } catch (e) {
      setGenerated("Unable to generate. Please try again.");
    }
    setLoading(false);
  };

  const postToFeed = () => {
    if (!generated) return;
    const newPost = {
      id: Date.now(),
      user: (profile?.full_name || "You").split(" ")[0],
      plan: profile?.plan || "free",
      category,
      platform,
      prompt: generated,
      time: "Just now",
      likes: 0,
    };
    setFeed(f => [newPost, ...f]);
    setPosted(true);
    setTimeout(() => setPosted(false), 3000);
  };

  const S = {
    page: { minHeight:"100vh", background:BG, padding:"32px 40px", fontFamily:"'Plus Jakarta Sans',sans-serif" },
    h1: { fontSize:26, fontWeight:800, color:"#fff", letterSpacing:"-0.04em", marginBottom:4 },
    sub: { fontSize:13, color:"#445", marginBottom:32 },
    grid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:32 },
    card: { background:CARD, border:`1px solid ${B}`, borderRadius:14, padding:24 },
    label: { fontSize:11, fontWeight:700, color:"#445", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6, display:"block" },
    sel: { width:"100%", background:"#0d1624", border:`1px solid ${B}`, borderRadius:8, padding:"9px 12px", color:"#ccc", fontSize:13, marginBottom:16, fontFamily:"inherit", outline:"none" },
    inp: { width:"100%", background:"#0d1624", border:`1px solid ${B}`, borderRadius:8, padding:"9px 12px", color:"#ccc", fontSize:13, marginBottom:16, fontFamily:"inherit", outline:"none", boxSizing:"border-box" },
    textarea: { width:"100%", background:"#0d1624", border:`1px solid ${B}`, borderRadius:8, padding:"9px 12px", color:"#ccc", fontSize:13, marginBottom:16, fontFamily:"inherit", outline:"none", resize:"vertical", minHeight:80, boxSizing:"border-box" },
    btn: { padding:"11px 24px", background:BLUE, color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" },
    btnGhost: { padding:"10px 20px", background:"none", color:BLUE, border:`1px solid ${BLUE}30`, borderRadius:9, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" },
    tag: { display:"inline-block", padding:"3px 8px", background:"#0d1624", border:`1px solid ${B}`, borderRadius:5, fontSize:10, color:"#445", fontWeight:600 },
    postCard: { background:CARD, border:`1px solid ${B}`, borderRadius:12, padding:20, marginBottom:16 },
    promptText: { fontSize:13, color:"#aaa", lineHeight:1.7, fontStyle:"italic", marginTop:8 },
  };

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>
      <div style={S.h1}>✦ Prompt Space</div>
      <div style={S.sub}>Generate AI design prompts & share with the DigiHub community</div>

      <div style={S.grid}>
        {/* Generator Panel */}
        <div>
          <div style={S.card}>
            <div style={{ fontSize:14, fontWeight:700, color:"#fff", marginBottom:20 }}>Generate Design Prompt</div>

            <label style={S.label}>Design Category</label>
            <select value={category} onChange={e=>setCategory(e.target.value)} style={S.sel}>
              {CATEGORIES.map(c=><option key={c}>{c}</option>)}
            </select>

            <label style={S.label}>Target Platform</label>
            <select value={platform} onChange={e=>setPlatform(e.target.value)} style={S.sel}>
              {PLATFORMS.map(p=><option key={p}>{p}</option>)}
            </select>

            <label style={S.label}>Visual Style</label>
            <select value={style} onChange={e=>setStyle(e.target.value)} style={S.sel}>
              {STYLES.map(s=><option key={s}>{s}</option>)}
            </select>

            <label style={S.label}>Topic / Subject *</label>
            <textarea value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. Summer sale campaign for a streetwear brand targeting college students..." style={S.textarea} />

            <label style={S.label}>Brand Name (optional)</label>
            <input value={brand} onChange={e=>setBrand(e.target.value)} placeholder="e.g. UrbanDrop" style={S.inp} />

            <label style={S.label}>Preferred Colors (optional)</label>
            <input value={colors} onChange={e=>setColors(e.target.value)} placeholder="e.g. Navy blue, gold, white" style={S.inp} />

            <button onClick={generatePrompt} disabled={loading || !topic.trim()} style={{ ...S.btn, width:"100%", opacity:(loading||!topic.trim())?0.5:1 }}>
              {loading ? "✦ Generating..." : "✦ Generate Prompt"}
            </button>
          </div>

          {/* Generated Output */}
          {generated && (
            <div style={{ ...S.card, marginTop:16, border:`1px solid ${BLUE}30` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <div style={{ fontSize:12, fontWeight:700, color:BLUE, textTransform:"uppercase", letterSpacing:"0.08em" }}>Generated Prompt</div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={()=>navigator.clipboard.writeText(generated)} style={S.btnGhost}>Copy</button>
                  <button onClick={postToFeed} style={S.btn}>{posted?"✓ Posted!":"Post to Feed"}</button>
                </div>
              </div>
              <div style={S.promptText}>{generated}</div>
              <div style={{ marginTop:12, display:"flex", gap:6, flexWrap:"wrap" }}>
                <span style={S.tag}>{category}</span>
                <span style={S.tag}>{platform}</span>
                <span style={S.tag}>{style}</span>
              </div>
            </div>
          )}
        </div>

        {/* Community Feed */}
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:"#fff", marginBottom:16 }}>Community Prompts</div>
          {feed.map(p => (
            <div key={p.id} style={S.postCard}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:32, height:32, borderRadius:"50%", background:`${BLUE}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:BLUE }}>
                    {p.user.slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:"#ccc" }}>{p.user}</div>
                    <div style={{ fontSize:10, color:"#334" }}>{p.time}</div>
                  </div>
                </div>
                <span style={{ ...S.tag, color:BLUE, borderColor:`${BLUE}40` }}>{p.plan}</span>
              </div>
              <div style={{ display:"flex", gap:6, marginBottom:8 }}>
                <span style={S.tag}>{p.category}</span>
                <span style={S.tag}>{p.platform}</span>
              </div>
              <div style={S.promptText}>{p.prompt.slice(0,200)}{p.prompt.length>200?"...":""}</div>
              <div style={{ marginTop:12, display:"flex", gap:16 }}>
                <button onClick={()=>setFeed(f=>f.map(x=>x.id===p.id?{...x,likes:x.likes+1}:x))} style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, color:"#445", fontFamily:"inherit", padding:0 }}>
                  ♥ {p.likes}
                </button>
                <button onClick={()=>navigator.clipboard.writeText(p.prompt)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, color:"#445", fontFamily:"inherit", padding:0 }}>
                  ⊕ Copy
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
