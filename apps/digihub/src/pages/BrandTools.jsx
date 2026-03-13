import React, { useState } from "react";

const BLUE = "#0284c7";
const PINK = "#e8185d";
const B    = "#1a2030";

const TOOLS = [
  { icon:"⬡", title:"Poster Generator",    desc:"Create social media posters with your brand colors and logo in seconds.",           badge:"AI",     color:BLUE    },
  { icon:"◎", title:"Logo Variations",     desc:"Generate icon versions, dark/light variants of your uploaded logo.",               badge:"AI",     color:"#7c3aed"},
  { icon:"◈", title:"Caption Writer",       desc:"Write scroll-stopping captions for Instagram, LinkedIn, Twitter.",                 badge:"AI",     color:PINK    },
  { icon:"◑", title:"Color Palette",        desc:"Extract or generate a brand color palette from your logo or reference image.",     badge:"Tool",   color:"#d97706"},
  { icon:"⬟", title:"Font Pairer",          desc:"Find the perfect font combination for your brand's personality.",                  badge:"Tool",   color:"#16a34a"},
  { icon:"◇", title:"Ad Copy Generator",   desc:"Write high-converting Facebook, Google, and Instagram ad copy.",                  badge:"AI",     color:BLUE    },
];

const SIZES = ["Instagram Post (1:1)","Instagram Story (9:16)","LinkedIn Banner (4:1)","Twitter Header (3:1)","Facebook Cover (2.7:1)","YouTube Thumb (16:9)"];

export default function BrandTools() {
  const [active, setActive]       = useState(null);
  const [prompt, setPrompt]       = useState("");
  const [brandName, setBrandName] = useState("");
  const [tagline, setTagline]     = useState("");
  const [color, setColor]         = useState("#0284c7");
  const [size, setSize]           = useState(SIZES[0]);
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);

  const generate = async () => {
    if (!prompt && !brandName) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          messages:[{
            role:"user",
            content:`You are a professional brand strategist. Generate output for: ${active?.title}.
Brand name: ${brandName || "N/A"}
Tagline: ${tagline || "N/A"}
Brand color: ${color}
Format/Size: ${size}
Additional brief: ${prompt}

For Poster Generator: describe a detailed poster layout with visual hierarchy, what text goes where, background style, design elements.
For Caption Writer: write 3 caption options with hashtags.
For Ad Copy Generator: write 3 ad variations (headline + body + CTA).
For other tools: give actionable creative output.
Be specific, creative, and professional.`
          }]
        })
      });
      const d = await res.json();
      setResult(d.content?.[0]?.text || "No output generated.");
    } catch {
      setResult("Error generating. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", padding:"32px 28px 80px", background:"#06101a", minHeight:"100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .tool-card { background:#080f1a; border:1px solid ${B}; border-radius:12px; padding:22px; cursor:pointer; transition:all 0.18s; }
        .tool-card:hover { border-color:#243040; transform:translateY(-1px); }
        .tool-card.sel { border-color:${BLUE}60; background:#0a1628; }
        .dh-input { width:100%; padding:10px 14px; background:#0d1624; border:1px solid ${B}; border-radius:8px; color:#ddd; font-size:13.5px; font-family:'Plus Jakarta Sans',sans-serif; outline:none; resize:vertical; }
        .dh-input:focus { border-color:${BLUE}60; }
        .dh-input::placeholder { color:#334; }
        .gen-btn { padding:11px 24px; background:${BLUE}; color:#fff; border:none; border-radius:9px; font-size:14px; font-weight:700; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; transition:opacity 0.15s; }
        .gen-btn:hover { opacity:0.88; }
        .gen-btn:disabled { opacity:0.4; cursor:not-allowed; }
        .badge { display:inline-block; padding:2px 8px; border-radius:5px; font-size:10px; font-weight:700; }
        @media (max-width:700px) { .tools-g { grid-template-columns:1fr 1fr !important; } }
      `}</style>

      <div style={{ marginBottom:32 }}>
        <h1 style={{ fontWeight:800, fontSize:"clamp(20px,2.5vw,26px)", letterSpacing:"-0.03em", color:"#fff", marginBottom:4 }}>Brand Tools</h1>
        <p style={{ fontSize:13.5, color:"#445" }}>AI-powered tools to create, design, and write for your brand.</p>
      </div>

      {/* Tool grid */}
      <div className="tools-g" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:32 }}>
        {TOOLS.map(t => (
          <div key={t.title} className={`tool-card${active?.title===t.title?" sel":""}`} onClick={() => { setActive(t); setResult(null); }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
              <span style={{ fontSize:22, color:t.color }}>{t.icon}</span>
              <span className="badge" style={{ background:t.badge==="AI" ? BLUE+"20":B, color:t.badge==="AI" ? BLUE:"#445" }}>{t.badge}</span>
            </div>
            <h3 style={{ fontWeight:700, fontSize:14, color:"#ddd", marginBottom:6, letterSpacing:"-0.01em" }}>{t.title}</h3>
            <p style={{ fontSize:12.5, color:"#445", lineHeight:1.6 }}>{t.desc}</p>
          </div>
        ))}
      </div>

      {/* Generator panel */}
      {active && (
        <div style={{ background:"#080f1a", border:`1px solid ${B}`, borderRadius:14, padding:28 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:24 }}>
            <span style={{ fontSize:22, color:active.color }}>{active.icon}</span>
            <h2 style={{ fontWeight:700, fontSize:16, color:"#fff", letterSpacing:"-0.02em" }}>{active.title}</h2>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#445", display:"block", marginBottom:6 }}>Brand Name</label>
              <input className="dh-input" value={brandName} onChange={e=>setBrandName(e.target.value)} placeholder="e.g. Zara Fitness" />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#445", display:"block", marginBottom:6 }}>Tagline</label>
              <input className="dh-input" value={tagline} onChange={e=>setTagline(e.target.value)} placeholder="e.g. Stronger every day" />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#445", display:"block", marginBottom:6 }}>Brand Color</label>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <input type="color" value={color} onChange={e=>setColor(e.target.value)} style={{ width:40, height:36, border:"none", background:"none", cursor:"pointer" }} />
                <span style={{ fontSize:13, color:"#445" }}>{color}</span>
              </div>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#445", display:"block", marginBottom:6 }}>Format/Size</label>
              <select className="dh-input" value={size} onChange={e=>setSize(e.target.value)} style={{ cursor:"pointer" }}>
                {SIZES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom:18 }}>
            <label style={{ fontSize:12, fontWeight:600, color:"#445", display:"block", marginBottom:6 }}>Additional brief</label>
            <textarea className="dh-input" rows={3} value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder={`Describe what you need from the ${active.title}...`} />
          </div>

          <button className="gen-btn" onClick={generate} disabled={loading || (!prompt && !brandName)}>
            {loading ? "Generating..." : `Generate with AI →`}
          </button>

          {result && (
            <div style={{ marginTop:24, background:"#0d1624", border:`1px solid ${BLUE}30`, borderRadius:10, padding:20 }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:BLUE, marginBottom:12 }}>Generated Output</div>
              <pre style={{ fontSize:13.5, color:"#ccc", lineHeight:1.75, whiteSpace:"pre-wrap", fontFamily:"'Plus Jakarta Sans',sans-serif", margin:0 }}>{result}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
