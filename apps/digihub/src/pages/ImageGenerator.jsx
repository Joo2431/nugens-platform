import React, { useState } from "react";
import { generateImage, miniChat } from "../lib/apiClient";

const PINK   = "#e8185d";
const TEXT   = "#111827";
const MUTED  = "#6b7280";
const LIGHT  = "#f8f9fb";
const CARD   = "#ffffff";
const BORDER = "#e8eaed";

const SIZES    = [
  { label:"1:1 Square",        w:1024, h:1024 },
  { label:"16:9 Landscape",    w:1792, h:1024 },
  { label:"9:16 Portrait",     w:1024, h:1792 },
  { label:"4:3 Standard",      w:1344, h:1024 },
];
const STYLES   = ["Photorealistic","Digital Art","3D Render","Flat Illustration","Watercolor","Minimal & Clean","Dark & Dramatic","Retro/Vintage","Corporate Professional"];
const PURPOSES = ["Social Media Post","Marketing Poster","Product Showcase","Brand Banner","Event Promo","Hiring Post","Business Offer","Store Announcement"];

export default function ImageGenerator({ profile }) {
  const [prompt,    setPrompt]    = useState("");
  const [sizeIdx,   setSizeIdx]   = useState(0);
  const [style,     setStyle]     = useState("Digital Art");
  const [purpose,   setPurpose]   = useState("Social Media Post");
  const [loading,   setLoading]   = useState(false);
  const [imgUrl,    setImgUrl]    = useState(null);
  const [error,     setError]     = useState("");
  const [history,   setHistory]   = useState([]);
  const [enhancing, setEnhancing] = useState(false);

  const plan     = profile?.plan || "free";
  const freeLeft = Math.max(0, 3 - history.length);
  const canGen   = plan !== "free" || freeLeft > 0;
  const size     = SIZES[sizeIdx];

  const enhance = async () => {
    if (!prompt.trim()) return;
    setEnhancing(true);
    try {
      const data = await miniChat(
        `Enhance this image generation prompt to be highly detailed and effective for AI image generators. Purpose: ${purpose}. Style: ${style}. Original: "${prompt}". Return ONLY the enhanced prompt, no explanations.`,
        "digihub",
        profile?.user_type || "business"
      );
      const enhanced = data?.reply || data?.message || prompt;
      setPrompt(enhanced.trim());
    } catch {}
    setEnhancing(false);
  };

  const generate = async () => {
    if (!prompt.trim() || !canGen) return;
    setLoading(true);
    setError("");
    setImgUrl(null);
    try {
      const fullPrompt = `${style} style. ${purpose}. ${prompt}`;
      const url = await generateImage(fullPrompt, { width: size.w, height: size.h });
      setImgUrl(url);
      setHistory(h => [{ url, prompt: prompt.slice(0, 55), style, time: new Date().toLocaleTimeString() }, ...h.slice(0, 7)]);
    } catch (e) {
      setError(e.message?.includes("401")
        ? "Session expired — please refresh the page."
        : "Image generation failed. Please try again or use a different prompt."
      );
    }
    setLoading(false);
  };

  const S = {
    page: { minHeight:"100vh", background:LIGHT, padding:"32px 40px", fontFamily:"'Plus Jakarta Sans',sans-serif" },
    card: { background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:24, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" },
    label:{ fontSize:11, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6, display:"block" },
    sel:  { width:"100%", background:"#fafafa", border:`1px solid ${BORDER}`, borderRadius:8, padding:"9px 12px", color:TEXT, fontSize:13, marginBottom:16, fontFamily:"inherit", outline:"none", boxSizing:"border-box" },
    ta:   { width:"100%", background:"#fafafa", border:`1px solid ${BORDER}`, borderRadius:8, padding:"10px 12px", color:TEXT, fontSize:13, marginBottom:12, fontFamily:"inherit", outline:"none", resize:"vertical", minHeight:100, boxSizing:"border-box" },
    btn:  { padding:"11px 24px", background:PINK, color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" },
    btnSm:{ padding:"7px 14px", background:"none", color:PINK, border:`1px solid ${PINK}30`, borderRadius:7, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" },
    canvas:{ background:"#f3f4f6", border:`1px solid ${BORDER}`, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", minHeight:400, overflow:"hidden" },
    histThumb:{ width:68, height:68, borderRadius:8, objectFit:"cover", border:`1px solid ${BORDER}`, cursor:"pointer" },
  };

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      <div style={{ fontSize:22, fontWeight:800, color:TEXT, letterSpacing:"-0.04em", marginBottom:4 }}>⬡ AI Image Generator</div>
      <div style={{ fontSize:13, color:MUTED, marginBottom:24 }}>Generate stunning posters, banners, and social media images with AI — powered by Pollinations.ai (free)</div>

      {plan === "free" && (
        <div style={{ background:CARD, border:`1px solid ${PINK}20`, borderRadius:10, padding:"12px 18px", marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:12, color:TEXT }}>Free plan: <strong style={{color:PINK}}>{freeLeft} generation{freeLeft!==1?"s":""} remaining</strong></span>
          <a href="/pricing" style={{ fontSize:12, color:PINK, fontWeight:700, textDecoration:"none" }}>Upgrade for unlimited →</a>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"340px 1fr", gap:24 }}>
        {/* Controls */}
        <div style={S.card}>
          <div style={{ fontSize:14, fontWeight:700, color:TEXT, marginBottom:18 }}>Settings</div>
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
            {SIZES.map((s,i)=><option key={i} value={i}>{s.label} ({s.w}×{s.h})</option>)}
          </select>
          <label style={S.label}>Describe your image *</label>
          <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="e.g. A summer sale poster for a fashion brand, vibrant orange and yellow tones, bold 50% OFF text..." style={S.ta} />
          <button onClick={enhance} disabled={enhancing||!prompt.trim()} style={{ ...S.btnSm, width:"100%", marginBottom:12, opacity:(enhancing||!prompt.trim())?0.5:1 }}>
            {enhancing?"Enhancing prompt...":"✦ Enhance with AI"}
          </button>
          <button onClick={generate} disabled={loading||!prompt.trim()||!canGen} style={{ ...S.btn, width:"100%", opacity:(loading||!prompt.trim()||!canGen)?0.5:1 }}>
            {loading ? "⬡ Generating..." : !canGen ? "Upgrade to Generate" : "⬡ Generate Image"}
          </button>

          {history.length > 0 && (
            <div style={{ marginTop:20 }}>
              <div style={{ fontSize:11, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Recent</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {history.map((h,i)=>(
                  <img key={i} src={h.url} alt={h.prompt} style={S.histThumb} onClick={()=>setImgUrl(h.url)} title={h.prompt} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div>
          <div style={S.canvas}>
            {loading ? (
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:36, marginBottom:12, color:PINK }}>⬡</div>
                <div style={{ fontSize:14, fontWeight:600, color:TEXT, marginBottom:4 }}>Generating your image...</div>
                <div style={{ fontSize:12, color:MUTED }}>Powered by Pollinations.ai · Usually takes 5–15 seconds</div>
              </div>
            ) : imgUrl ? (
              <div style={{ width:"100%", position:"relative" }}>
                <img src={imgUrl} alt="Generated" style={{ width:"100%", borderRadius:12, display:"block" }} onError={()=>setError("Image failed to load — try regenerating")} />
                <div style={{ position:"absolute", top:12, right:12, display:"flex", gap:8 }}>
                  <a href={imgUrl} download="digihub-image.png" target="_blank" rel="noreferrer" style={{ padding:"7px 14px", background:CARD, border:`1px solid ${BORDER}`, borderRadius:7, textDecoration:"none", fontSize:11, color:TEXT, fontWeight:600 }}>⬇ Download</a>
                  <button onClick={()=>navigator.clipboard.writeText(imgUrl)} style={{ padding:"7px 14px", background:CARD, border:`1px solid ${BORDER}`, borderRadius:7, fontSize:11, color:TEXT, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>⊕ Copy URL</button>
                </div>
              </div>
            ) : error ? (
              <div style={{ textAlign:"center", padding:32 }}>
                <div style={{ fontSize:28, marginBottom:12, opacity:0.3 }}>⬡</div>
                <div style={{ fontSize:13, color:"#dc2626", marginBottom:16 }}>{error}</div>
                <button onClick={()=>setError("")} style={S.btn}>Try Again</button>
              </div>
            ) : (
              <div style={{ textAlign:"center", padding:40 }}>
                <div style={{ fontSize:48, marginBottom:16, opacity:0.15 }}>⬡</div>
                <div style={{ fontSize:14, color:MUTED, fontWeight:500 }}>Your generated image will appear here</div>
                <div style={{ fontSize:12, color:"#d1d5db", marginTop:6 }}>Fill in the settings and click Generate</div>
              </div>
            )}
          </div>

          {/* Tips */}
          <div style={{ ...S.card, marginTop:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:MUTED, marginBottom:12 }}>💡 Tips for better results</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {["Include brand colours (hex codes work great)","Specify typography style (bold, minimal, elegant)","Describe the mood — warm, energetic, luxury","Mention text to include on the design","Add lighting details (golden hour, studio, neon)","Reference a visual style (Bauhaus, Apple, Canva)"].map((t,i)=>(
                <div key={i} style={{ fontSize:12, color:MUTED, display:"flex", gap:6 }}>
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
