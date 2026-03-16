import React, { useState } from "react";
import { miniChat } from "../lib/apiClient";

const PINK   = "#e8185d";
const TEXT   = "#111827";
const MUTED  = "#6b7280";
const LIGHT  = "#f8f9fb";
const CARD   = "#ffffff";
const BORDER = "#e8eaed";

const CATEGORIES = ["Social Media Post","Logo Concept","Banner/Ad","Poster","Product Mockup","Brand Identity","Email Header","Story/Reel Cover","Infographic","UI Design"];
const PLATFORMS  = ["Instagram","LinkedIn","Twitter/X","Facebook","YouTube","Pinterest","WhatsApp"];
const STYLES     = ["Modern & Minimal","Bold & Energetic","Elegant & Luxury","Playful & Fun","Corporate & Clean","Retro/Vintage","Tech & Futuristic"];

const SEED_POSTS = [
  { id:1, user:"Priya K.", plan:"premium", category:"Social Media Post", platform:"Instagram", prompt:"A vibrant Instagram carousel for a D2C skincare brand targeting Gen-Z women. Soft pastels — blush pink, sage green, warm ivory. Clean sans-serif typography, airy whitespace. Feature 3 product bottles with glowing skin texture. Aesthetic, editorial, skincare-luxury feel. Ratio 1:1.", time:"2h ago", likes:24 },
  { id:2, user:"Arjun M.", plan:"starter",  category:"Banner/Ad",        platform:"LinkedIn",  prompt:"Professional LinkedIn banner for a B2B SaaS startup in HR-tech. Dark navy background, electric blue accents. Abstract data visualisation — graphs and people icons. Headline: 'Hire Smarter, Grow Faster'. Modern corporate aesthetic. 1584×396px.", time:"5h ago", likes:18 },
  { id:3, user:"Divya S.", plan:"premium", category:"Logo Concept",      platform:"Instagram", prompt:"Minimal logo for a cloud kitchen called 'Spice Route'. Combine a flame icon with a road/path. Colours: deep saffron #FF6B35, warm white. Bold geometric style. Works on dark and light backgrounds. SVG output.", time:"1d ago", likes:41 },
];

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
  const [error,     setError]     = useState("");
  const [feed,      setFeed]      = useState(SEED_POSTS);

  const generatePrompt = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setGenerated("");
    setError("");
    try {
      const data = await miniChat(
        `Generate a detailed, professional AI image generation prompt for:\n- Category: ${category}\n- Platform: ${platform}\n- Visual Style: ${style}\n- Topic/Subject: ${topic}\n${brand ? `- Brand Name: ${brand}\n` : ""}- Preferred Colours: ${colors || "Not specified"}\n\nThe prompt should be specific, detailed, and ready to use with Midjourney, DALL-E, or Stable Diffusion. Include: composition, colours, typography style, mood, lighting, and technical specs. Make it 4–6 sentences. Return ONLY the prompt text.`,
        "digihub",
        profile?.user_type || "business"
      );
      setGenerated(data?.reply || data?.message || "");
    } catch (e) {
      setError(e.message?.includes("401")
        ? "Session expired — please refresh the page."
        : "Unable to generate right now. Please try again."
      );
    }
    setLoading(false);
  };

  const postToFeed = () => {
    if (!generated) return;
    const post = { id:Date.now(), user:(profile?.full_name||"You").split(" ")[0], plan:profile?.plan||"free", category, platform, prompt:generated, time:"Just now", likes:0 };
    setFeed(f=>[post,...f]);
    setPosted(true);
    setTimeout(()=>setPosted(false), 3000);
  };

  const S = {
    page:   { minHeight:"100vh", background:LIGHT, padding:"32px 40px", fontFamily:"'Plus Jakarta Sans',sans-serif" },
    card:   { background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:24, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" },
    label:  { fontSize:11, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6, display:"block" },
    sel:    { width:"100%", background:"#fafafa", border:`1px solid ${BORDER}`, borderRadius:8, padding:"9px 12px", color:TEXT, fontSize:13, marginBottom:16, fontFamily:"inherit", outline:"none", boxSizing:"border-box" },
    inp:    { width:"100%", background:"#fafafa", border:`1px solid ${BORDER}`, borderRadius:8, padding:"9px 12px", color:TEXT, fontSize:13, marginBottom:16, fontFamily:"inherit", outline:"none", boxSizing:"border-box" },
    ta:     { width:"100%", background:"#fafafa", border:`1px solid ${BORDER}`, borderRadius:8, padding:"9px 12px", color:TEXT, fontSize:13, marginBottom:16, fontFamily:"inherit", outline:"none", resize:"vertical", minHeight:80, boxSizing:"border-box" },
    btn:    { padding:"11px 24px", background:PINK, color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" },
    btnGhost:{ padding:"8px 16px", background:"none", color:PINK, border:`1px solid ${PINK}30`, borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" },
    tag:    { display:"inline-block", padding:"3px 8px", background:"#f3f4f6", border:`1px solid ${BORDER}`, borderRadius:5, fontSize:10, color:MUTED, fontWeight:600 },
    postCard:{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, padding:18, marginBottom:14, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" },
    promptText:{ fontSize:13, color:TEXT, lineHeight:1.7, fontStyle:"italic", marginTop:8 },
  };

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      <div style={{ fontSize:22, fontWeight:800, color:TEXT, letterSpacing:"-0.04em", marginBottom:4 }}>✦ Prompt Space</div>
      <div style={{ fontSize:13, color:MUTED, marginBottom:28 }}>Generate AI design prompts and share with the DigiHub community</div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:28 }}>
        {/* Generator */}
        <div>
          <div style={S.card}>
            <div style={{ fontSize:14, fontWeight:700, color:TEXT, marginBottom:18 }}>Generate Design Prompt</div>
            <label style={S.label}>Design Category</label>
            <select value={category} onChange={e=>setCategory(e.target.value)} style={S.sel}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select>
            <label style={S.label}>Target Platform</label>
            <select value={platform} onChange={e=>setPlatform(e.target.value)} style={S.sel}>{PLATFORMS.map(p=><option key={p}>{p}</option>)}</select>
            <label style={S.label}>Visual Style</label>
            <select value={style} onChange={e=>setStyle(e.target.value)} style={S.sel}>{STYLES.map(s=><option key={s}>{s}</option>)}</select>
            <label style={S.label}>Topic / Subject *</label>
            <textarea value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. Summer sale for a streetwear brand targeting college students..." style={S.ta} />
            <label style={S.label}>Brand Name (optional)</label>
            <input value={brand} onChange={e=>setBrand(e.target.value)} placeholder="e.g. UrbanDrop" style={S.inp} />
            <label style={S.label}>Preferred Colours (optional)</label>
            <input value={colors} onChange={e=>setColors(e.target.value)} placeholder="e.g. Navy blue, gold, white" style={S.inp} />
            {error && <div style={{ background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:8, padding:"10px 14px", marginBottom:14, fontSize:12, color:"#dc2626" }}>{error}</div>}
            <button onClick={generatePrompt} disabled={loading||!topic.trim()} style={{ ...S.btn, width:"100%", opacity:(loading||!topic.trim())?0.5:1 }}>
              {loading ? "✦ Generating..." : "✦ Generate Prompt"}
            </button>
          </div>

          {generated && (
            <div style={{ ...S.card, marginTop:14, border:`1px solid ${PINK}30` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <div style={{ fontSize:11, fontWeight:700, color:PINK, textTransform:"uppercase", letterSpacing:"0.08em" }}>Generated Prompt</div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={()=>navigator.clipboard.writeText(generated)} style={S.btnGhost}>Copy</button>
                  <button onClick={postToFeed} style={S.btn}>{posted?"✓ Posted!":"Post to Feed"}</button>
                </div>
              </div>
              <div style={S.promptText}>{generated}</div>
              <div style={{ marginTop:12, display:"flex", gap:6, flexWrap:"wrap" }}>
                <span style={S.tag}>{category}</span><span style={S.tag}>{platform}</span><span style={S.tag}>{style}</span>
              </div>
            </div>
          )}
        </div>

        {/* Community Feed */}
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:TEXT, marginBottom:14 }}>Community Prompts</div>
          {feed.map(p=>(
            <div key={p.id} style={S.postCard}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:32, height:32, borderRadius:"50%", background:`${PINK}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:PINK }}>
                    {p.user.slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:TEXT }}>{p.user}</div>
                    <div style={{ fontSize:10, color:MUTED }}>{p.time}</div>
                  </div>
                </div>
                <div style={{ display:"flex", gap:5 }}>
                  <span style={S.tag}>{p.category}</span>
                  <span style={S.tag}>{p.platform}</span>
                </div>
              </div>
              <div style={S.promptText}>{p.prompt.slice(0,200)}{p.prompt.length>200?"...":""}</div>
              <div style={{ marginTop:10, display:"flex", gap:16 }}>
                <button onClick={()=>setFeed(f=>f.map(x=>x.id===p.id?{...x,likes:x.likes+1}:x))} style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, color:MUTED, fontFamily:"inherit", padding:0 }}>
                  ♥ {p.likes}
                </button>
                <button onClick={()=>navigator.clipboard.writeText(p.prompt)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, color:PINK, fontWeight:600, fontFamily:"inherit", padding:0 }}>
                  ⊕ Copy Prompt
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
