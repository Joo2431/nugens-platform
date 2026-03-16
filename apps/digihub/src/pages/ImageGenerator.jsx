import React, { useState } from "react";
import { supabase } from "../lib/supabase";

const PINK   = "#e8185d";
const TEXT   = "#111827";
const MUTED  = "#6b7280";
const LIGHT  = "#f8f9fb";
const CARD   = "#ffffff";
const BORDER = "#e8eaed";

const SIZES = [
  { label:"1:1 Square (1024×1024)",     w:1024, h:1024 },
  { label:"16:9 Landscape (1792×1024)", w:1792, h:1024 },
  { label:"9:16 Portrait (1024×1792)",  w:1024, h:1792 },
  { label:"4:3 Standard (1344×1024)",   w:1344, h:1024 },
];

const STYLES   = ["Digital Art","Photorealistic","3D Render","Flat Illustration","Watercolor","Minimal & Clean","Dark & Dramatic","Retro/Vintage","Corporate Professional","Cyberpunk/Neon"];
const PURPOSES = ["Social Media Post","Marketing Poster","Product Showcase","Brand Banner","Event Promo","Hiring Post","Business Offer","Store Announcement","Logo Concept","Infographic"];

function buildPollinationsUrl(prompt, w, h) {
  const full = `${prompt}. High quality, professional design, sharp details.`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(full)}?width=${w}&height=${h}&model=flux&nologo=true&enhance=true&seed=${Math.floor(Math.random()*99999)}`;
}

async function callEnhance(prompt, style, purpose) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const res = await fetch("https://nugens-platform.onrender.com/api/mini-chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        message: `Enhance this image generation prompt to be highly specific for AI image generators. Style: ${style}. Purpose: ${purpose}. Original: "${prompt}". Return ONLY the enhanced prompt, nothing else.`,
        product: "digihub",
        userType: "individual",
      }),
    });
    const d = await res.json();
    return (d?.reply || d?.message || prompt).trim();
  } catch {
    return prompt;
  }
}

export default function ImageGenerator({ profile }) {
  const [prompt,    setPrompt]    = useState("");
  const [sizeIdx,   setSizeIdx]   = useState(0);
  const [style,     setStyle]     = useState("Digital Art");
  const [purpose,   setPurpose]   = useState("Social Media Post");
  const [loading,   setLoading]   = useState(false);
  const [imgUrl,    setImgUrl]    = useState(null);
  const [imgFailed, setImgFailed] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [history,   setHistory]   = useState([]);

  const size = SIZES[sizeIdx];

  const enhance = async () => {
    if (!prompt.trim()) return;
    setEnhancing(true);
    const enhanced = await callEnhance(prompt, style, purpose);
    setPrompt(enhanced);
    setEnhancing(false);
  };

  const generate = () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setImgUrl(null);
    setImgFailed(false);

    const url = buildPollinationsUrl(`${style} style. ${purpose}. ${prompt}`, size.w, size.h);

    const img = new Image();
    img.onload = () => {
      setImgUrl(url);
      setHistory(h => [{ url, label: prompt.slice(0, 40) }, ...h.slice(0, 7)]);
      setLoading(false);
    };
    img.onerror = () => {
      setImgFailed(true);
      setLoading(false);
    };
    img.src = url;
  };

  const S = {
    page:  { minHeight:"100vh", background:LIGHT, padding:"32px 40px", fontFamily:"'Plus Jakarta Sans',sans-serif" },
    card:  { background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:24, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" },
    label: { fontSize:11, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6, display:"block" },
    sel:   { width:"100%", background:"#fafafa", border:`1px solid ${BORDER}`, borderRadius:8, padding:"9px 12px", color:TEXT, fontSize:13, marginBottom:16, fontFamily:"inherit", outline:"none", boxSizing:"border-box" },
    ta:    { width:"100%", background:"#fafafa", border:`1px solid ${BORDER}`, borderRadius:8, padding:"10px 12px", color:TEXT, fontSize:13, marginBottom:12, fontFamily:"inherit", outline:"none", resize:"vertical", minHeight:100, boxSizing:"border-box" },
    btn:   { padding:"11px 0", background:PINK, color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", width:"100%" },
    btnSm: { padding:"9px 0", background:"#fff", color:PINK, border:`1px solid ${PINK}30`, borderRadius:9, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit", width:"100%", marginBottom:10 },
    canvas:{ background:"#f3f4f6", border:`1px solid ${BORDER}`, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", minHeight:420, overflow:"hidden", position:"relative" },
  };

  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
      `}</style>

      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:24, fontWeight:800, color:TEXT, letterSpacing:"-0.04em", marginBottom:4 }}>⬡ AI Image Generator</div>
        <div style={{ fontSize:13, color:MUTED }}>
          Generate posters, banners, and social media visuals —
          powered by <strong style={{color:PINK}}>Pollinations.ai</strong> · free for everyone · no plan needed
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"340px 1fr", gap:24 }}>

        {/* Left panel */}
        <div style={S.card}>
          <div style={{ fontSize:14, fontWeight:700, color:TEXT, marginBottom:18 }}>Image Settings</div>

          <label style={S.label}>Purpose</label>
          <select value={purpose} onChange={e=>setPurpose(e.target.value)} style={S.sel}>
            {PURPOSES.map(p=><option key={p}>{p}</option>)}
          </select>

          <label style={S.label}>Art Style</label>
          <select value={style} onChange={e=>setStyle(e.target.value)} style={S.sel}>
            {STYLES.map(s=><option key={s}>{s}</option>)}
          </select>

          <label style={S.label}>Output Size</label>
          <select value={sizeIdx} onChange={e=>setSizeIdx(Number(e.target.value))} style={S.sel}>
            {SIZES.map((s,i)=><option key={i} value={i}>{s.label}</option>)}
          </select>

          <label style={S.label}>Describe your image *</label>
          <textarea
            value={prompt}
            onChange={e=>setPrompt(e.target.value)}
            placeholder="e.g. A summer sale poster for a streetwear brand with bold orange and yellow tones, floating sneakers, 50% OFF text..."
            style={S.ta}
          />

          <button onClick={enhance} disabled={enhancing||!prompt.trim()} style={{ ...S.btnSm, opacity:(enhancing||!prompt.trim())?0.5:1 }}>
            {enhancing ? "Enhancing..." : "✦ Enhance with AI"}
          </button>

          <button onClick={generate} disabled={loading||!prompt.trim()} style={{ ...S.btn, opacity:(loading||!prompt.trim())?0.5:1 }}>
            {loading ? "Generating..." : "⬡ Generate Image"}
          </button>

          <div style={{ fontSize:11, color:MUTED, textAlign:"center", marginTop:10 }}>Free for all users</div>

          {history.length > 0 && (
            <div style={{ marginTop:20 }}>
              <div style={{ fontSize:11, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:10 }}>Recent</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {history.map((h,i)=>(
                  <img key={i} src={h.url} alt={h.label} title={h.label} onClick={()=>setImgUrl(h.url)}
                    style={{ width:64, height:64, borderRadius:8, objectFit:"cover", border:`2px solid ${BORDER}`, cursor:"pointer" }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right canvas */}
        <div>
          <div style={S.canvas}>
            {loading ? (
              <div style={{ textAlign:"center", padding:40 }}>
                <div style={{ fontSize:48, color:PINK, marginBottom:14, display:"inline-block", animation:"spin 1.2s linear infinite" }}>⬡</div>
                <div style={{ fontSize:15, fontWeight:600, color:TEXT, marginBottom:6 }}>Generating your image...</div>
                <div style={{ fontSize:12, color:MUTED }}>Powered by Pollinations.ai · Usually 5–20 seconds</div>
              </div>
            ) : imgUrl ? (
              <>
                <img src={imgUrl} alt="Generated" style={{ width:"100%", borderRadius:12, display:"block" }}
                  onError={()=>{ setImgFailed(true); setImgUrl(null); }} />
                <div style={{ position:"absolute", top:14, right:14, display:"flex", gap:8 }}>
                  <a href={imgUrl} download="digihub-image.png" target="_blank" rel="noreferrer"
                    style={{ padding:"7px 14px", background:"rgba(255,255,255,0.95)", border:`1px solid ${BORDER}`, borderRadius:8, textDecoration:"none", fontSize:12, color:TEXT, fontWeight:600 }}>
                    ⬇ Download
                  </a>
                  <button onClick={()=>navigator.clipboard.writeText(imgUrl)}
                    style={{ padding:"7px 14px", background:"rgba(255,255,255,0.95)", border:`1px solid ${BORDER}`, borderRadius:8, fontSize:12, color:TEXT, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                    ⊕ Copy URL
                  </button>
                  <button onClick={generate}
                    style={{ padding:"7px 14px", background:PINK, border:"none", borderRadius:8, fontSize:12, color:"#fff", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                    ↻ Regenerate
                  </button>
                </div>
              </>
            ) : imgFailed ? (
              <div style={{ textAlign:"center", padding:40 }}>
                <div style={{ fontSize:32, marginBottom:12, opacity:0.3 }}>⬡</div>
                <div style={{ fontSize:13, color:"#dc2626", marginBottom:16 }}>
                  Image generation timed out. Pollinations.ai can be slow on first request — please try again.
                </div>
                <button onClick={generate} style={{ ...S.btn, width:"auto", padding:"10px 24px" }}>Try Again</button>
              </div>
            ) : (
              <div style={{ textAlign:"center", padding:48 }}>
                <div style={{ fontSize:56, marginBottom:16, opacity:0.12 }}>⬡</div>
                <div style={{ fontSize:15, color:MUTED, fontWeight:500, marginBottom:6 }}>Your image will appear here</div>
                <div style={{ fontSize:12, color:"#d1d5db" }}>Fill in the settings on the left and click Generate</div>
              </div>
            )}
          </div>

          <div style={{ ...S.card, marginTop:18 }}>
            <div style={{ fontSize:12, fontWeight:700, color:TEXT, marginBottom:12 }}>💡 Tips for better results</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {["Include brand colours as hex codes (e.g. #FF5733)","Specify typography — 'bold sans-serif', 'elegant serif'",
                "Describe the mood — warm, energetic, luxury, minimal","Mention any text to display in the design",
                "Add lighting details — 'golden hour', 'studio light', 'neon glow'","Reference a style — Apple-like, Bauhaus, editorial"].map((t,i)=>(
                <div key={i} style={{ fontSize:12, color:MUTED, display:"flex", gap:7, lineHeight:1.55 }}>
                  <span style={{color:PINK,flexShrink:0}}>→</span>{t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}