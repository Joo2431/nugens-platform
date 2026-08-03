/**
 * DigiHub — AI Hashtag Generator
 * Generates 30 categorised hashtags for any post/topic with estimated reach.
 */
import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { loadBrandVoice, buildBrandContext } from "./BrandVoiceSetup";

const BLUE   = "#0284c7";
const BG     = "#f8f9fb";
const CARD   = "#ffffff";
const B      = "#1a2030";
const MUTED  = "#6b7280";
const TEXT   = "#111827";
const API    = import.meta.env.VITE_GEN_E_API_URL || "https://nugens-platform-production.up.railway.app";

const PLATFORMS = ["Instagram","LinkedIn","Twitter/X","Facebook","Pinterest","YouTube"];
const NICHES    = ["Fashion","Food & Beverage","Tech & SaaS","Real Estate","Fitness","Travel","Business","Education","Photography","Beauty","Finance","Motivational"];

export default function HashtagGenerator({ profile }) {
  const [topic,      setTopic]    = useState("");
  const [platform,   setPlatform] = useState("Instagram");
  const [niche,      setNiche]    = useState(profile?.industry || "");
  const [loading,    setLoading]  = useState(false);
  const [result,     setResult]   = useState(null);
  const [copied,     setCopied]   = useState(null);
  const [error,      setError]    = useState(null);

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true); setResult(null); setError(null);

    try {
      const { data:{ session } } = await supabase.auth.getSession();
      const voice = loadBrandVoice();
      const brandCtx = buildBrandContext(voice);

      const prompt = `${brandCtx}Generate a modern, platform-optimised hashtag strategy for a ${platform} post about: "${topic}"${niche ? ` in the ${niche} niche` : ""}.

IMPORTANT CONTEXT (2025-2026 best practices):
- Instagram: 5-8 targeted hashtags now outperform 30-tag spamming. Focus on relevance over volume. Mix 2-3 broad + 3-5 niche.
- LinkedIn: 3-5 hashtags maximum. Industry-specific + skill-based tags work best. No spam tags.
- TikTok/Reels: 3-5 hashtags max, weighted toward trending sounds/challenges. Keywords in captions matter more.
- Twitter/X: 1-3 hashtags max, inline with the tweet. Topic hashtags + one branded if applicable.
- YouTube: Tags are secondary to title/description keywords.

Return ONLY a JSON object (no markdown, no extra text):
{
  "primary": ["#tag1","#tag2","#tag3"],
  "niche_targeted": ["#tag1","#tag2","#tag3","#tag4","#tag5"],
  "trending_now": ["#tag1","#tag2","#tag3"],
  "avoid": ["#tag1","#tag2"],
  "recommended_count": 5,
  "strategy_tip": "One actionable tip for this specific ${platform} post",
  "caption_keywords": ["keyword1","keyword2","keyword3"]
}

Rules:
- Include # in all hashtags
- primary = high-relevance, moderate competition
- niche_targeted = <50K posts, highly specific to the topic — these drive discovery
- trending_now = currently popular on ${platform} in July 2026
- avoid = overused/spammy tags that hurt reach
- caption_keywords = SEO terms to weave into the caption naturally (no #)
- Mix English and relevant regional/Indian hashtags where the audience calls for it`;

      const { data:{ session: _sess } } = await supabase.auth.getSession();
      const token = _sess?.access_token;
      const res = await fetch(`${API}/api/digihub-generate`, {
        method:"POST",
        headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},
        body: JSON.stringify({ message:prompt, max_tokens:2000 }),
        signal: AbortSignal.timeout(35000),
      });
      if (!res.ok) throw new Error("Server error " + res.status);
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      const raw = (d.reply || "{}").replace(/```json|```/g,"").trim();
      const parsed = JSON.parse(raw);
      setResult(parsed);
    } catch(e) {
      setError("Generation failed. Please try again.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const copyGroup = (group, tags) => {
    navigator.clipboard.writeText(tags.join(" "));
    setCopied(group);
    setTimeout(() => setCopied(null), 2000);
  };

  const copyAll = () => {
    if (!result) return;
    const all = [
      ...(result.primary || []), ...(result.niche_targeted || []),
      ...(result.trending_now || [])
    ].join(" ");
    navigator.clipboard.writeText(all);
    setCopied("all");
    setTimeout(() => setCopied(null), 2000);
  };

  const groups = result ? [
    { key:"primary",        label:"🎯 Primary Tags",     color:"#dc2626", bg:"#fef2f2", tags:result.primary,        desc:`Use these ${result.recommended_count || 5} first` },
    { key:"niche_targeted", label:"📈 Niche Discovery",   color:BLUE,      bg:"#eff6ff", tags:result.niche_targeted, desc:"Low competition · High discovery" },
    { key:"trending_now",   label:"⚡ Trending Now",      color:"#16a34a", bg:"#f0fdf4", tags:result.trending_now,   desc:"Currently popular" },
    ...(result.avoid?.length ? [{ key:"avoid", label:"🚫 Avoid These", color:"#9ca3af", bg:"#f9fafb", tags:result.avoid, desc:"Spammy or reach-killing" }] : []),
    ...(result.caption_keywords?.length ? [{ key:"keywords", label:"🔑 Caption Keywords", color:"#7c3aed", bg:"#f5f3ff", tags:result.caption_keywords.map(k=>""+k), desc:"Weave into your caption (no #)" }] : []),
  ] : [];

  return (
    <div style={{ minHeight:"100vh", background:BG, padding:"32px 36px", fontFamily:"'Plus Jakarta Sans',sans-serif", color:TEXT }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'); input:focus,select:focus{border-color:${BLUE}!important;outline:none}`}</style>

      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"3px 10px", borderRadius:5, background:`${BLUE}15`, border:`1px solid ${BLUE}30`, marginBottom:12 }}>
          <span style={{ fontSize:10, fontWeight:700, color:BLUE, textTransform:"uppercase", letterSpacing:"0.08em" }}># Hashtag Generator</span>
        </div>
        <h1 style={{ fontWeight:800, fontSize:"clamp(20px,2.5vw,26px)", color:TEXT, letterSpacing:"-0.03em", marginBottom:6 }}>AI Hashtag Generator</h1>
        <p style={{ fontSize:13.5, color:MUTED }}>Modern, platform-specific hashtag strategy — fewer, smarter tags that actually drive discovery.</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:result?"1fr 1.4fr":"1fr", gap:24, maxWidth:result?1100:580 }}>

        {/* Controls */}
        <div style={{ background:CARD, border:`1px solid ${B}`, borderRadius:14, padding:24, display:"flex", flexDirection:"column", gap:16, alignSelf:"start" }}>

          <div>
            <label style={{ fontSize:11, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Post Topic or Caption *</label>
            <textarea value={topic} onChange={e=>setTopic(e.target.value)} rows={3}
              placeholder="e.g. New product launch for our handmade jewellery collection this Diwali"
              style={{ width:"100%", padding:"10px 13px", background:"#f3f4f6", border:`1.5px solid ${B}`, borderRadius:9, color:"#111827", fontSize:13, fontFamily:"inherit", resize:"none", outline:"none", boxSizing:"border-box" }}
              onFocus={e=>e.target.style.borderColor=BLUE} onBlur={e=>e.target.style.borderColor=B}
              onKeyDown={e=>{ if(e.key==="Enter"&&e.ctrlKey) generate(); }}/>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Platform</label>
              <select value={platform} onChange={e=>setPlatform(e.target.value)}
                style={{ width:"100%", padding:"9px 12px", background:"#f3f4f6", border:`1.5px solid ${B}`, borderRadius:9, color:"#111827", fontSize:13, fontFamily:"inherit", cursor:"pointer", outline:"none" }}>
                {PLATFORMS.map(p=><option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Niche (optional)</label>
              <select value={niche} onChange={e=>setNiche(e.target.value)}
                style={{ width:"100%", padding:"9px 12px", background:"#f3f4f6", border:`1.5px solid ${B}`, borderRadius:9, color:"#111827", fontSize:13, fontFamily:"inherit", cursor:"pointer", outline:"none" }}>
                <option value="">Any niche</option>
                {NICHES.map(n=><option key={n}>{n}</option>)}
              </select>
            </div>
          </div>

          <button onClick={generate} disabled={!topic.trim()||loading}
            style={{ padding:"12px 0", borderRadius:10, border:"none", background:loading?`${BLUE}60`:BLUE, color:"#fff", fontSize:14, fontWeight:700, cursor:loading?"not-allowed":"pointer", fontFamily:"inherit", transition:"all 0.15s" }}>
            {loading ? "Generating hashtags…" : "# Generate 30 Hashtags →"}
          </button>

          {error && <div style={{ padding:"10px 14px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:9, color:"#dc2626", fontSize:12 }}>{error}</div>}

          {result?.tip && (
            <div style={{ padding:"10px 14px", background:`${BLUE}10`, border:`1px solid ${BLUE}25`, borderRadius:9 }}>
              <div style={{ fontSize:11, fontWeight:700, color:BLUE, marginBottom:4 }}>💡 PRO TIP</div>
              <div style={{ fontSize:12.5, color:TEXT, lineHeight:1.6 }}>{result.tip}</div>
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

            {/* Copy all */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontSize:13, fontWeight:700, color:TEXT }}>30 hashtags ready</div>
              <button onClick={copyAll}
                style={{ padding:"7px 16px", background:copied==="all"?"#16a34a":BLUE, border:"none", borderRadius:8, color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", transition:"background 0.2s" }}>
                {copied==="all" ? "✓ Copied All!" : "Copy All 30"}
              </button>
            </div>

            {groups.map(g => (
              <div key={g.key} style={{ background:CARD, border:`1px solid ${B}`, borderRadius:12, padding:"16px 18px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:TEXT }}>{g.label}</div>
                    <div style={{ fontSize:11, color:MUTED, marginTop:2 }}>{g.desc}</div>
                  </div>
                  <button onClick={()=>copyGroup(g.key, g.tags)}
                    style={{ padding:"5px 12px", background:copied===g.key?`${g.color}20`:`${g.color}10`, border:`1px solid ${g.color}30`, borderRadius:7, color:g.color, fontSize:11.5, fontWeight:700, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s" }}>
                    {copied===g.key ? "✓ Copied!" : "Copy"}
                  </button>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {(g.tags||[]).map(tag => (
                    <span key={tag}
                      onClick={() => { navigator.clipboard.writeText(tag); }}
                      style={{ padding:"4px 10px", background:`${g.color}12`, border:`1px solid ${g.color}25`, borderRadius:20, fontSize:12, color:g.color, cursor:"pointer", transition:"all 0.13s", fontWeight:500 }}
                      title="Click to copy single hashtag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            <div style={{ padding:"10px 14px", background:`${B}80`, borderRadius:9, fontSize:11.5, color:MUTED, lineHeight:1.6 }}>
              Best practice: Use 3–5 high reach + 10–12 medium + 5–8 niche for Instagram. LinkedIn: max 5 hashtags. Twitter: max 2.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}