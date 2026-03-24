import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const PINK   = "#e8185d";
const BLUE   = "#0284c7";
const TEXT   = "#111827";
const MUTED  = "#6b7280";
const LIGHT  = "#f8f9fb";
const CARD   = "#ffffff";
const BORDER = "#e8eaed";
const API    = import.meta.env.VITE_GEN_E_API_URL || "https://nugens-platform.onrender.com";

const CATEGORIES = ["Social Media Post","Marketing Poster","Product Showcase","Brand Banner","Event Promo","Email Header","Website Hero","Ad Creative","Story/Reel","Infographic"];
const PLATFORMS  = ["Instagram","LinkedIn","Twitter/X","Facebook","Pinterest","General"];
const STYLES     = ["Modern & Minimal","Bold & Vibrant","Elegant & Luxury","Playful & Fun","Professional & Corporate","Dark & Dramatic","Pastel & Soft","Retro & Vintage"];

async function miniChat(message, product, userType) {
  const { data:{ session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const res = await fetch(`${API}/api/mini-chat`, {
    method:"POST",
    headers:{ "Content-Type":"application/json", ...(token?{ Authorization:`Bearer ${token}` }:{}) },
    body: JSON.stringify({ message, product, userType }),
  });
  return res.json();
}

export default function PromptSpace({ profile }) {
  const [category,  setCategory]  = useState("Social Media Post");
  const [platform,  setPlatform]  = useState("Instagram");
  const [style,     setStyle]     = useState("Modern & Minimal");
  const [topic,     setTopic]     = useState("");
  const [brand,     setBrand]     = useState("");
  const [colors,    setColors]    = useState("");
  const [generated, setGenerated] = useState("");
  const [loading,   setLoading]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [error,     setError]     = useState("");
  const [feed,      setFeed]      = useState([]);
  const [feedLoad,  setFeedLoad]  = useState(true);
  const [copyDone,  setCopyDone]  = useState(false);
  const [deleting,  setDeleting]  = useState(null);

  // Load prompt library from Supabase
  useEffect(() => {
    supabase
      .from("dh_prompt_library")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => { setFeed(data||[]); setFeedLoad(false); });
  }, []);

  const generatePrompt = async () => {
    if (!topic.trim()) return;
    setLoading(true); setGenerated(""); setError("");
    try {
      const data = await miniChat(
        `Generate a detailed, professional AI image generation prompt for:\n- Category: ${category}\n- Platform: ${platform}\n- Visual Style: ${style}\n- Topic/Subject: ${topic}\n${brand?`- Brand Name: ${brand}\n`:""}- Preferred Colours: ${colors||"Not specified"}\n\nThe prompt should be specific, detailed, and ready to use with DALL-E or Midjourney. Include: composition, colours, typography style, mood, lighting, and technical specs. Make it 4–6 sentences. Return ONLY the prompt text.`,
        "digihub",
        profile?.user_type || "business"
      );
      setGenerated(data?.reply || data?.message || "");
    } catch(e) {
      setError(e.message?.includes("401") ? "Session expired — please refresh." : "Unable to generate. Please try again.");
    }
    setLoading(false);
  };

  const saveToLibrary = async () => {
    if (!generated || !profile?.id) return;
    setSaving(true);
    const { data: saved_row } = await supabase
      .from("dh_prompt_library")
      .insert({
        user_id:     profile.id,
        user_name:   (profile?.full_name||"User").split(" ")[0],
        user_plan:   profile?.plan || "free",
        category,
        platform,
        style,
        topic:       topic.slice(0, 80),
        prompt_text: generated,
        is_public:   true,
        likes_count: 0,
      })
      .select().single();
    if (saved_row) {
      setFeed(f => [saved_row, ...f]);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  const deletePrompt = async (id) => {
    if (!confirm("Remove this prompt from the library?")) return;
    setDeleting(id);
    await supabase.from("dh_prompt_library").delete().eq("id", id);
    setFeed(f => f.filter(p => p.id !== id));
    setDeleting(null);
  };

  const likePrompt = async (id) => {
    await supabase.rpc("increment_prompt_likes", { p_id: id });
    setFeed(f => f.map(p => p.id===id ? { ...p, likes_count:(p.likes_count||0)+1 } : p));
  };

  const copyPrompt = (text) => {
    navigator.clipboard.writeText(text);
    setCopyDone(true);
    setTimeout(() => setCopyDone(false), 2000);
  };

  const S = {
    page:     { minHeight:"100vh", background:LIGHT, padding:"32px 40px", fontFamily:"'Plus Jakarta Sans',sans-serif" },
    card:     { background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:24, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" },
    label:    { fontSize:11, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6, display:"block" },
    sel:      { width:"100%", background:"#fafafa", border:`1px solid ${BORDER}`, borderRadius:8, padding:"9px 12px", color:TEXT, fontSize:13, marginBottom:16, fontFamily:"inherit", outline:"none", boxSizing:"border-box" },
    inp:      { width:"100%", background:"#fafafa", border:`1px solid ${BORDER}`, borderRadius:8, padding:"9px 12px", color:TEXT, fontSize:13, marginBottom:16, fontFamily:"inherit", outline:"none", boxSizing:"border-box" },
    ta:       { width:"100%", background:"#fafafa", border:`1px solid ${BORDER}`, borderRadius:8, padding:"9px 12px", color:TEXT, fontSize:13, marginBottom:16, fontFamily:"inherit", outline:"none", resize:"vertical", minHeight:80, boxSizing:"border-box" },
    tag:      { display:"inline-block", padding:"3px 8px", background:"#f3f4f6", border:`1px solid ${BORDER}`, borderRadius:5, fontSize:10, color:MUTED, fontWeight:600 },
    postCard: { background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, padding:18, marginBottom:14, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" },
  };

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontWeight:800, fontSize:22, color:TEXT, letterSpacing:"-0.04em", margin:0 }}>
          ✦ Prompt <span style={{ color:PINK }}>Space</span>
        </h1>
        <p style={{ color:MUTED, fontSize:13, marginTop:5 }}>
          Generate AI image prompts. Save them to the shared library for your team and community.
        </p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"400px 1fr", gap:24, maxWidth:1200 }}>
        {/* Generator */}
        <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
          <div style={S.card}>
            <div style={{ fontSize:14, fontWeight:700, color:TEXT, marginBottom:20 }}>Generate Prompt</div>

            <label style={S.label}>Category</label>
            <select value={category} onChange={e=>setCategory(e.target.value)} style={S.sel}>
              {CATEGORIES.map(c=><option key={c}>{c}</option>)}
            </select>
            <label style={S.label}>Platform</label>
            <select value={platform} onChange={e=>setPlatform(e.target.value)} style={S.sel}>
              {PLATFORMS.map(p=><option key={p}>{p}</option>)}
            </select>
            <label style={S.label}>Visual Style</label>
            <select value={style} onChange={e=>setStyle(e.target.value)} style={S.sel}>
              {STYLES.map(s=><option key={s}>{s}</option>)}
            </select>
            <label style={S.label}>Topic / Subject *</label>
            <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. Diwali sale, product launch, team culture…" style={S.inp}/>
            <label style={S.label}>Brand Name (optional)</label>
            <input value={brand} onChange={e=>setBrand(e.target.value)} placeholder="e.g. FreshBite, StyleHouse…" style={S.inp}/>
            <label style={S.label}>Preferred Colours (optional)</label>
            <input value={colors} onChange={e=>setColors(e.target.value)} placeholder="e.g. deep blue, gold, white…" style={S.inp}/>

            {error && <div style={{ padding:"9px 12px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, color:"#dc2626", fontSize:12, marginBottom:12 }}>{error}</div>}

            <button onClick={generatePrompt} disabled={!topic.trim()||loading}
              style={{ width:"100%", padding:"11px 0", background:loading?`${PINK}60`:PINK, color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:loading?"not-allowed":"pointer", fontFamily:"inherit" }}>
              {loading ? "Generating…" : "✦ Generate Prompt"}
            </button>
          </div>

          {/* Generated result */}
          {generated && (
            <div style={{ ...S.card, marginTop:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <div style={{ fontSize:13, fontWeight:700, color:TEXT }}>Generated Prompt</div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={()=>copyPrompt(generated)}
                    style={{ padding:"5px 12px", background:`${BLUE}10`, border:`1px solid ${BLUE}30`, borderRadius:7, color:BLUE, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                    {copyDone ? "✓ Copied!" : "Copy"}
                  </button>
                  <button onClick={saveToLibrary} disabled={saving||saved}
                    style={{ padding:"5px 12px", background:saved?"#f0fdf4":PINK, border:"none", borderRadius:7, color:"#fff", fontSize:11, fontWeight:700, cursor:saving?"not-allowed":"pointer", fontFamily:"inherit", transition:"background 0.2s" }}>
                    {saved ? "✓ Saved!" : saving ? "Saving…" : "💾 Save"}
                  </button>
                </div>
              </div>
              <p style={{ fontSize:13, color:TEXT, lineHeight:1.75, fontStyle:"italic", background:"#f8faff", border:`1px solid ${BORDER}`, borderRadius:8, padding:12, margin:0 }}>
                {generated}
              </p>
              <div style={{ display:"flex", gap:7, marginTop:10, flexWrap:"wrap" }}>
                {[category, platform, style].map(t=><span key={t} style={S.tag}>{t}</span>)}
              </div>
            </div>
          )}
        </div>

        {/* Prompt Library feed */}
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div style={{ fontSize:15, fontWeight:700, color:TEXT }}>
              Prompt Library
              <span style={{ fontSize:12, color:MUTED, fontWeight:400, marginLeft:8 }}>({feed.length} saved)</span>
            </div>
          </div>

          {feedLoad && <div style={{ color:MUTED, fontSize:13 }}>Loading prompts…</div>}

          {!feedLoad && feed.length===0 && (
            <div style={{ ...S.card, textAlign:"center", padding:"40px 24px" }}>
              <div style={{ fontSize:20, marginBottom:10 }}>✦</div>
              <div style={{ fontSize:14, fontWeight:700, color:TEXT, marginBottom:6 }}>Library is empty</div>
              <div style={{ fontSize:13, color:MUTED }}>Generate a prompt and save it — it will appear here for you and your team.</div>
            </div>
          )}

          {!feedLoad && feed.map(p => (
            <div key={p.id} style={S.postCard}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                  <div style={{ width:30, height:30, borderRadius:"50%", background:`${PINK}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:PINK, flexShrink:0 }}>
                    {(p.user_name||"?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:TEXT }}>{p.user_name||"User"}</div>
                    <div style={{ fontSize:10, color:MUTED }}>{new Date(p.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</div>
                  </div>
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  <button onClick={()=>copyPrompt(p.prompt_text)}
                    style={{ padding:"4px 10px", background:`${BLUE}10`, border:`1px solid ${BLUE}25`, borderRadius:6, color:BLUE, fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                    Copy
                  </button>
                  {p.user_id===profile?.id && (
                    <button onClick={()=>deletePrompt(p.id)} disabled={deleting===p.id}
                      style={{ padding:"4px 8px", background:"transparent", border:"1px solid #fecaca", borderRadius:6, color:"#ef4444", fontSize:10, cursor:"pointer", fontFamily:"inherit" }}>
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <p style={{ fontSize:12.5, color:TEXT, lineHeight:1.7, fontStyle:"italic", margin:"0 0 10px" }}>
                {p.prompt_text?.slice(0,200)}{p.prompt_text?.length>200?"…":""}
              </p>

              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
                {[p.category, p.platform, p.style].filter(Boolean).map(t=><span key={t} style={S.tag}>{t}</span>)}
              </div>

              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:10, borderTop:`1px solid ${BORDER}` }}>
                <button onClick={()=>likePrompt(p.id)}
                  style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, color:MUTED, fontFamily:"inherit", padding:0 }}>
                  ♥ {p.likes_count||0} Likes
                </button>
                <button onClick={()=>{ setTopic(p.topic||""); setCategory(p.category||category); setPlatform(p.platform||platform); setStyle(p.style||style); setGenerated(p.prompt_text); }}
                  style={{ background:"none", border:`1px solid ${BORDER}`, borderRadius:6, color:PINK, fontSize:10, fontWeight:700, cursor:"pointer", padding:"4px 10px", fontFamily:"inherit" }}>
                  Use this prompt →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}