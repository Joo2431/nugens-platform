import React, { useState } from "react";

const BLUE = "#0284c7";
const BG   = "#06101a";
const CARD = "#0a1628";
const B    = "#1a2030";
const API  = "https://nugens-platform.onrender.com";

const SIZES    = ["1:1 Square (1024×1024)","16:9 Landscape (1792×1024)","9:16 Portrait (1024×1792)","4:3 Standard (1344×1024)","3:4 Portrait (1024×1344)"];
const STYLES   = ["Photorealistic","Digital Art","3D Render","Flat Illustration","Watercolor","Minimal & Clean","Dark & Dramatic","Cyberpunk/Neon","Vintage/Retro","Corporate Professional"];
const PURPOSES = ["Social Media Post","Marketing Poster","Product Showcase","Brand Banner","Event Promo","Job Hiring Post","Business Offer","Store Announcement"];

export default function ImageGenerator({ profile }) {
  const [prompt,    setPrompt]    = useState("");
  const [size,      setSize]      = useState("1:1 Square (1024×1024)");
  const [style,     setStyle]     = useState("Digital Art");
  const [purpose,   setPurpose]   = useState("Social Media Post");
  const [loading,   setLoading]   = useState(false);
  const [imgUrl,    setImgUrl]    = useState(null);
  const [error,     setError]     = useState("");
  const [history,   setHistory]   = useState([]);
  const [enhancing, setEnhancing] = useState(false);
  const [enhanced,  setEnhanced]  = useState("");

  const plan  = profile?.plan || "free";
  const canGen = plan !== "free" || history.length < 3;

  const enhancePrompt = async () => {
    if (!prompt.trim()) return;
    setEnhancing(true);
    try {
      const res = await fetch(`${API}/api/mini-chat`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          message:`Enhance this image generation prompt for an AI image generator. Make it detailed and visual: "${prompt}". Style: ${style}. Purpose: ${purpose}. Return ONLY the enhanced prompt, nothing else.`,
          userType: profile?.user_type || "individual",
          product:"digihub"
        })
      });
      const d = await res.json();
      const txt = d?.reply || d?.message || prompt;
      setEnhanced(txt);
      setPrompt(txt);
    } catch(e){}
    setEnhancing(false);
  };

  const generate = async () => {
    if (!prompt.trim() || !canGen) return;
    setLoading(true);
    setError("");
    setImgUrl(null);
    try {
      const res = await fetch(`${API}/api/digihub/generate-image`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ prompt: `${style} style. ${purpose}. ${prompt}`, size, style })
      });
      if (!res.ok) throw new Error("Generation failed");
      const d = await res.json();
      const url = d?.url || d?.image_url;
      if (!url) throw new Error("No image returned");
      setImgUrl(url);
      setHistory(h => [{ url, prompt: prompt.slice(0,60), style, time: new Date().toLocaleTimeString() }, ...h.slice(0,7)]);
    } catch(e) {
      setError("Image generation is available on Pro plan. Upgrade to access DALL-E poster generation.");
    }
    setLoading(false);
  };

  const S = {
    page: { minHeight:"100vh", background:BG, padding:"32px 40px", fontFamily:"'Plus Jakarta Sans',sans-serif" },
    h1: { fontSize:26, fontWeight:800, color:"#fff", letterSpacing:"-0.04em", marginBottom:4 },
    sub: { fontSize:13, color:"#445", marginBottom:32 },
    grid: { display:"grid", gridTemplateColumns:"360px 1fr", gap:28 },
    card: { background:CARD, border:`1px solid ${B}`, borderRadius:14, padding:24 },
    label: { fontSize:11, fontWeight:700, color:"#445", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6, display:"block" },
    sel: { width:"100%", background:"#0d1624", border:`1px solid ${B}`, borderRadius:8, padding:"9px 12px", color:"#ccc", fontSize:13, marginBottom:16, fontFamily:"inherit", outline:"none", boxSizing:"border-box" },
    textarea: { width:"100%", background:"#0d1624", border:`1px solid ${B}`, borderRadius:8, padding:"10px 12px", color:"#ccc", fontSize:13, marginBottom:12, fontFamily:"inherit", outline:"none", resize:"vertical", minHeight:100, boxSizing:"border-box" },
    btn: { padding:"11px 24px", background:BLUE, color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" },
    btnSm: { padding:"7px 14px", background:"none", color:BLUE, border:`1px solid ${BLUE}30`, borderRadius:7, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" },
    canvas: { background:"#0d1624", border:`1px solid ${B}`, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", minHeight:400 },
    histThumb: { width:72, height:72, borderRadius:8, objectFit:"cover", border:`1px solid ${B}`, cursor:"pointer" },
  };

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>
      <div style={S.h1}>⬡ AI Image Generator</div>
      <div style={S.sub}>Generate stunning posters, banners, and social media images with AI</div>

      {/* Usage bar for free plan */}
      {plan === "free" && (
        <div style={{ background:CARD, border:`1px solid ${BLUE}20`, borderRadius:10, padding:"12px 18px", marginBottom:24, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <span style={{ fontSize:12, color:"#ccc" }}>Free plan: </span>
            <span style={{ fontSize:12, color:BLUE, fontWeight:700 }}>{Math.max(0,3-history.length)} generations remaining</span>
          </div>
          <a href="/pricing" style={{ fontSize:12, color:"#e8185d", fontWeight:700, textDecoration:"none" }}>Upgrade for unlimited →</a>
        </div>
      )}

      <div style={S.grid}>
        {/* Controls */}
        <div style={S.card}>
          <div style={{ fontSize:14, fontWeight:700, color:"#fff", marginBottom:18 }}>Image Settings</div>

          <label style={S.label}>Purpose</label>
          <select value={purpose} onChange={e=>setPurpose(e.target.value)} style={S.sel}>
            {PURPOSES.map(p=><option key={p}>{p}</option>)}
          </select>

          <label style={S.label}>Art Style</label>
          <select value={style} onChange={e=>setStyle(e.target.value)} style={S.sel}>
            {STYLES.map(s=><option key={s}>{s}</option>)}
          </select>

          <label style={S.label}>Output Size</label>
          <select value={size} onChange={e=>setSize(e.target.value)} style={S.sel}>
            {SIZES.map(s=><option key={s}>{s}</option>)}
          </select>

          <label style={S.label}>Describe your image *</label>
          <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="e.g. A summer sale poster for a clothing brand with vibrant orange and yellow colors, floating clothes items, bold 50% OFF text..." style={S.textarea} />

          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            <button onClick={enhancePrompt} disabled={enhancing||!prompt.trim()} style={{ ...S.btnSm, flex:1, opacity:(enhancing||!prompt.trim())?0.5:1 }}>
              {enhancing?"Enhancing...":"✦ Enhance Prompt"}
            </button>
          </div>

          <button onClick={generate} disabled={loading || !prompt.trim() || !canGen} style={{ ...S.btn, width:"100%", opacity:(loading||!prompt.trim()||!canGen)?0.5:1 }}>
            {loading ? "⬡ Generating..." : canGen ? "⬡ Generate Image" : "Upgrade to Generate"}
          </button>

          {/* History */}
          {history.length > 0 && (
            <div style={{ marginTop:20 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#334", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Recent Generations</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {history.map((h,i) => (
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
                <div style={{ fontSize:32, marginBottom:12, animation:"spin 1.5s linear infinite" }}>⬡</div>
                <div style={{ fontSize:13, color:"#445" }}>Generating your image...</div>
                <div style={{ fontSize:11, color:"#334", marginTop:4 }}>This may take 10-20 seconds</div>
              </div>
            ) : imgUrl ? (
              <div style={{ width:"100%", position:"relative" }}>
                <img src={imgUrl} alt="Generated" style={{ width:"100%", borderRadius:12, display:"block" }} />
                <div style={{ position:"absolute", top:12, right:12, display:"flex", gap:8 }}>
                  <a href={imgUrl} download="digihub-poster.png" style={{ ...S.btnSm, textDecoration:"none" }}>⬇ Download</a>
                </div>
              </div>
            ) : error ? (
              <div style={{ textAlign:"center", padding:32 }}>
                <div style={{ fontSize:28, marginBottom:12 }}>⬡</div>
                <div style={{ fontSize:13, color:"#556", marginBottom:16 }}>{error}</div>
                <a href="/pricing" style={{ ...S.btn, textDecoration:"none" }}>View Plans →</a>
              </div>
            ) : (
              <div style={{ textAlign:"center", padding:40 }}>
                <div style={{ fontSize:48, marginBottom:16, opacity:0.2 }}>⬡</div>
                <div style={{ fontSize:14, color:"#334", fontWeight:500 }}>Your generated poster will appear here</div>
                <div style={{ fontSize:12, color:"#334", marginTop:6 }}>Fill in the settings and click Generate</div>
              </div>
            )}
          </div>

          {/* Tips */}
          <div style={{ ...S.card, marginTop:20 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#445", marginBottom:12 }}>💡 Pro Tips for Better Results</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {[
                "Include brand colors in hex format",
                "Mention specific fonts or typography style",
                "Describe the mood/emotion you want",
                "Specify text to include on the poster",
                "Add lighting details (golden hour, neon)",
                "Mention the target audience"
              ].map((t,i) => (
                <div key={i} style={{ fontSize:12, color:"#445", display:"flex", gap:6 }}>
                  <span style={{ color:BLUE, flexShrink:0 }}>→</span>{t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
