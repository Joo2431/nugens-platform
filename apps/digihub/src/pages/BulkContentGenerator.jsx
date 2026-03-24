import React, { useState } from "react";
import { supabase } from "../lib/supabase";

// ── Nugens light theme ──────────────────────────────────────
const PINK   = "#e8185d";
const BLUE   = "#0284c7";
const BG     = "#f8f9fb";
const CARD   = "#ffffff";
const BORDER = "#e8eaed";
const TEXT   = "#111827";
const MUTED  = "#6b7280";
const API    = import.meta.env.VITE_GEN_E_API_URL || "https://nugens-platform.onrender.com";

const CAMPAIGN_TYPES = ["Product Launch","Festival / Seasonal Sale","Brand Awareness","Customer Testimonials","Behind the Scenes","Educational Series","Flash Sale","New Collection","Service Highlight","Company Milestone"];
const DURATIONS = ["1 week (7 posts)","2 weeks (14 posts)","1 month (20 posts)"];

export default function BulkContentGenerator({ profile }) {
  const [theme,      setTheme]    = useState("");
  const [campType,   setCampType] = useState("Product Launch");
  const [duration,   setDuration] = useState("2 weeks (14 posts)");
  const [platforms,  setPlatforms]= useState(["Instagram"]);
  const [loading,    setLoading]  = useState(false);
  const [result,     setResult]   = useState(null);
  const [error,      setError]    = useState(null);
  const [copied,     setCopied]   = useState(null);
  const [expanded,   setExpanded] = useState(new Set([0]));

  const togglePlatform = (p) => setPlatforms(ps => ps.includes(p) ? ps.filter(x=>x!==p) : [...ps,p]);

  const generate = async () => {
    if (!theme.trim()) return;
    setLoading(true); setResult(null); setError(null);
    try {
      const { data:{ session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const postCount = duration.includes("7") ? 7 : duration.includes("14") ? 14 : 20;

      const prompt = `Create a complete ${duration} social media campaign.
Campaign Type: ${campType}
Theme / Topic: ${theme}
Target Platforms: ${platforms.join(", ")}

Return ONLY valid JSON (no markdown, no extra text) with this exact structure:
{
  "campaign_title": "catchy campaign name",
  "campaign_goal": "one sentence goal",
  "posts": [
    {
      "day": 1,
      "date_label": "Day 1 - Monday",
      "platform": "Instagram",
      "type": "Post",
      "hook": "attention-grabbing opening line",
      "caption": "full caption with emojis",
      "hashtags": "#tag1 #tag2 #tag3",
      "cta": "clear call to action",
      "visual_note": "what the visual should show"
    }
  ],
  "reel_concepts": [
    { "title": "reel name", "concept": "30-second video concept", "hook": "first 3 seconds" }
  ],
  "story_ideas": ["story idea 1", "story idea 2", "story idea 3"],
  "campaign_tip": "one key strategy tip"
}
Generate exactly ${postCount} posts.`;

      const res = await fetch(`${API}/api/mini-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: prompt,
          product: "digihub",
          userType: profile?.user_type || "business",
          max_tokens: 3000,   // ← key fix: request enough tokens for full campaign
        }),
        signal: AbortSignal.timeout(60000),
      });

      const d = await res.json();
      if (!res.ok || d.error) throw new Error(d.error || `Server error ${res.status}`);

      const txt = (d.reply || d.message || "").replace(/```json|```/g, "").trim();

      // Find JSON object in response (handles any prefix text)
      const jsonStart = txt.indexOf("{");
      const jsonEnd   = txt.lastIndexOf("}");
      if (jsonStart === -1 || jsonEnd === -1) throw new Error("No valid JSON in response");

      const parsed = JSON.parse(txt.slice(jsonStart, jsonEnd + 1));
      if (!parsed.posts?.length) throw new Error("No posts in response");

      setResult(parsed);
      setExpanded(new Set([0]));
    } catch(e) {
      console.error("Bulk gen error:", e);
      setError(`Generation failed: ${e.message}. Please try again.`);
    } finally { setLoading(false); }
  };

  const copyPost = (idx, post) => {
    navigator.clipboard.writeText(`${post.caption}\n\n${post.hashtags}\n\n${post.cta}`);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  const copyAll = () => {
    if (!result) return;
    const all = result.posts.map(p => `--- Day ${p.day} | ${p.type} ---\n${p.caption}\n\n${p.hashtags}\n\n${p.cta}`).join("\n\n\n");
    navigator.clipboard.writeText(all);
    setCopied("all");
    setTimeout(() => setCopied(null), 2000);
  };

  const typeColors = { Reel:"#e8185d", Carousel:"#7c3aed", Story:"#0284c7", Post:"#16a34a" };

  const pillStyle = (active) => ({
    padding:"7px 14px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer",
    border:`1px solid ${active?PINK:BORDER}`,
    background: active?`${PINK}10`:"transparent",
    color: active?PINK:MUTED, fontFamily:"inherit", transition:"all 0.13s",
  });

  return (
    <div style={{ minHeight:"100vh", background:BG, padding:"32px 36px", fontFamily:"'Plus Jakarta Sans',sans-serif", color:TEXT }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'); input:focus,select:focus,textarea:focus{border-color:${PINK}!important;outline:none}`}</style>

      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"3px 12px", background:`${PINK}10`, border:`1px solid ${PINK}25`, borderRadius:20, marginBottom:12 }}>
          <span style={{ fontSize:10, fontWeight:700, color:PINK, textTransform:"uppercase", letterSpacing:"0.08em" }}>⚡ Bulk Generator</span>
        </div>
        <h1 style={{ fontWeight:800, fontSize:"clamp(20px,2.5vw,26px)", color:TEXT, letterSpacing:"-0.03em", margin:0, marginBottom:6 }}>Bulk Content Generator</h1>
        <p style={{ fontSize:13.5, color:MUTED, margin:0 }}>One campaign theme → a full week or month of ready-to-post content.</p>
      </div>

      {!result ? (
        /* ── Setup form ── */
        <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:28, maxWidth:600, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            <div>
              <label style={{ fontSize:11, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Campaign Theme *</label>
              <textarea value={theme} onChange={e=>setTheme(e.target.value)} rows={3}
                placeholder="e.g. Diwali sale for our handmade jewellery — 20% off all gold sets, free gift wrapping"
                style={{ width:"100%", padding:"10px 14px", background:BG, border:`1.5px solid ${BORDER}`, borderRadius:9, color:TEXT, fontSize:13, fontFamily:"inherit", resize:"vertical", outline:"none", boxSizing:"border-box" }}/>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Campaign Type</label>
                <select value={campType} onChange={e=>setCampType(e.target.value)}
                  style={{ width:"100%", padding:"9px 12px", background:BG, border:`1.5px solid ${BORDER}`, borderRadius:9, color:TEXT, fontSize:13, fontFamily:"inherit", cursor:"pointer", outline:"none" }}>
                  {CAMPAIGN_TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Duration</label>
                <select value={duration} onChange={e=>setDuration(e.target.value)}
                  style={{ width:"100%", padding:"9px 12px", background:BG, border:`1.5px solid ${BORDER}`, borderRadius:9, color:TEXT, fontSize:13, fontFamily:"inherit", cursor:"pointer", outline:"none" }}>
                  {DURATIONS.map(d=><option key={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize:11, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:8 }}>Platforms</label>
              <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                {["Instagram","LinkedIn","Facebook","Twitter/X","YouTube"].map(p=>(
                  <button key={p} onClick={()=>togglePlatform(p)} style={pillStyle(platforms.includes(p))}>{p}</button>
                ))}
              </div>
            </div>

            {error && (
              <div style={{ padding:"10px 14px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:9, color:"#dc2626", fontSize:12 }}>{error}</div>
            )}

            <button onClick={generate} disabled={!theme.trim()||loading}
              style={{ padding:"13px 0", borderRadius:10, border:"none", background:loading?`${PINK}60`:PINK, color:"#fff", fontSize:14, fontWeight:700, cursor:loading?"not-allowed":"pointer", fontFamily:"inherit", transition:"all 0.15s" }}>
              {loading ? "⚡ Building your campaign… (20–40s)" : "⚡ Generate Full Campaign →"}
            </button>
          </div>
        </div>
      ) : (
        /* ── Results ── */
        <div style={{ maxWidth:900 }}>

          {/* Campaign header */}
          <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:"20px 24px", marginBottom:20, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:PINK, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>Campaign Ready</div>
                <h2 style={{ fontSize:20, fontWeight:800, color:TEXT, letterSpacing:"-0.02em", margin:"0 0 4px" }}>{result.campaign_title}</h2>
                <p style={{ fontSize:13, color:MUTED, margin:0 }}>{result.campaign_goal}</p>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={()=>setResult(null)}
                  style={{ padding:"8px 16px", background:"transparent", border:`1px solid ${BORDER}`, borderRadius:9, color:MUTED, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                  ← New Campaign
                </button>
                <button onClick={copyAll}
                  style={{ padding:"8px 16px", background:copied==="all"?"#16a34a":PINK, border:"none", borderRadius:9, color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", transition:"background 0.2s" }}>
                  {copied==="all" ? "✓ Copied All!" : `Copy All ${result.posts?.length} Posts`}
                </button>
              </div>
            </div>
            {result.campaign_tip && (
              <div style={{ marginTop:14, padding:"10px 14px", background:`${BLUE}08`, border:`1px solid ${BLUE}20`, borderRadius:9, fontSize:12.5, color:TEXT }}>
                💡 {result.campaign_tip}
              </div>
            )}
          </div>

          {/* Posts */}
          <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
            {(result.posts||[]).map((post, idx) => {
              const isOpen = expanded.has(idx);
              const tc = typeColors[post.type] || PINK;
              return (
                <div key={idx} style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, overflow:"hidden", boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
                  <div onClick={()=>setExpanded(e=>{ const n=new Set(e); n.has(idx)?n.delete(idx):n.add(idx); return n; })}
                    style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 18px", cursor:"pointer" }}>
                    <div style={{ width:32, height:32, borderRadius:8, background:`${tc}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:tc, flexShrink:0 }}>{post.day}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                        <span style={{ fontSize:10, fontWeight:700, color:tc, background:`${tc}12`, padding:"2px 8px", borderRadius:5 }}>{post.type}</span>
                        <span style={{ fontSize:11, color:MUTED }}>{post.date_label}</span>
                        {post.platform&&<span style={{ fontSize:10, color:MUTED }}>· {post.platform}</span>}
                      </div>
                      <div style={{ fontSize:13, fontWeight:500, color:TEXT, marginTop:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{post.hook}</div>
                    </div>
                    <span style={{ fontSize:11, color:MUTED }}>{isOpen?"▲":"▼"}</span>
                  </div>
                  {isOpen && (
                    <div style={{ borderTop:`1px solid ${BORDER}`, padding:"16px 18px" }}>
                      {post.visual_note&&<div style={{ padding:"8px 12px", background:BG, borderRadius:8, fontSize:12, color:MUTED, marginBottom:12 }}>🖼️ {post.visual_note}</div>}
                      <div style={{ fontSize:13.5, color:TEXT, lineHeight:1.75, marginBottom:10, whiteSpace:"pre-wrap" }}>{post.caption}</div>
                      <div style={{ fontSize:12, color:BLUE, marginBottom:10 }}>{post.hashtags}</div>
                      <div style={{ fontSize:12.5, fontWeight:600, color:"#16a34a", marginBottom:14 }}>→ {post.cta}</div>
                      <button onClick={()=>copyPost(idx, post)}
                        style={{ padding:"6px 14px", background:copied===idx?"#16a34a10":`${PINK}08`, border:`1px solid ${copied===idx?"#86efac":`${PINK}25`}`, borderRadius:8, color:copied===idx?"#16a34a":PINK, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                        {copied===idx?"✓ Copied!":"Copy Post"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Reel concepts */}
          {result.reel_concepts?.length>0&&(
            <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:20, marginBottom:14, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
              <div style={{ fontWeight:700, fontSize:14, color:PINK, marginBottom:14 }}>🎬 Reel Concepts</div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {result.reel_concepts.map((r,i)=>(
                  <div key={i} style={{ padding:"12px 14px", background:BG, borderRadius:10 }}>
                    <div style={{ fontWeight:700, fontSize:13, color:TEXT, marginBottom:4 }}>{r.title}</div>
                    <div style={{ fontSize:12.5, color:MUTED, marginBottom:4 }}>{r.concept}</div>
                    <div style={{ fontSize:12, color:PINK }}>Hook: "{r.hook}"</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Story ideas */}
          {result.story_ideas?.length>0&&(
            <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:20, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
              <div style={{ fontWeight:700, fontSize:14, color:BLUE, marginBottom:12 }}>📲 Story Ideas</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {result.story_ideas.map((s,i)=>(
                  <div key={i} style={{ padding:"8px 14px", background:`${BLUE}08`, border:`1px solid ${BLUE}20`, borderRadius:9, fontSize:12.5, color:TEXT }}>{s}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}