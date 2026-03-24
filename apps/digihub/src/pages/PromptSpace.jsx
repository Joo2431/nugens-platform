import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const PINK   = "#e8185d";
const BLUE   = "#0284c7";
const BG     = "#f8f9fb";
const CARD   = "#ffffff";
const BORDER = "#e8eaed";
const TEXT   = "#111827";
const MUTED  = "#6b7280";
const API    = import.meta.env.VITE_GEN_E_API_URL || "https://nugens-platform.onrender.com";

const CATEGORIES = ["Social Media Post","Marketing Poster","Product Showcase","Brand Banner","Event Promo","Email Header","Website Hero","Ad Creative","Story/Reel","Infographic"];
const PLATFORMS  = ["Instagram","LinkedIn","Twitter/X","Facebook","Pinterest","General"];
const STYLES     = ["Modern & Minimal","Bold & Vibrant","Elegant & Luxury","Playful & Fun","Professional & Corporate","Dark & Dramatic","Pastel & Soft","Retro & Vintage"];

export default function PromptSpace({ profile }) {
  const [category,  setCategory]  = useState("Social Media Post");
  const [platform,  setPlatform]  = useState("Instagram");
  const [pStyle,    setPStyle]    = useState("Modern & Minimal");
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

  useEffect(() => {
    supabase.from("dh_prompt_library").select("*")
      .eq("is_public", true).order("created_at",{ascending:false}).limit(30)
      .then(({data})=>{ setFeed(data||[]); setFeedLoad(false); });
  }, []);

  const generatePrompt = async () => {
    if (!topic.trim()) return;
    setLoading(true); setGenerated(""); setError("");
    try {
      const { data:{ session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(`${API}/api/mini-chat`,{
        method:"POST",
        headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},
        body:JSON.stringify({
          message:`Generate a detailed professional AI image prompt for:\n- Category: ${category}\n- Platform: ${platform}\n- Visual Style: ${pStyle}\n- Topic: ${topic}\n${brand?`- Brand: ${brand}\n`:""}- Colours: ${colors||"Not specified"}\nInclude composition, colours, mood, lighting, technical specs. 4-6 sentences. Return ONLY the prompt text.`,
          product:"digihub", userType:profile?.user_type||"business", max_tokens:600,
        }),
      });
      const d = await res.json();
      if (!res.ok||d.error) throw new Error(d.error||"Failed");
      setGenerated(d?.reply||d?.message||"");
    } catch(e) { setError("Unable to generate. Try again."); }
    setLoading(false);
  };

  const saveToLibrary = async () => {
    if (!generated||!profile?.id) return;
    setSaving(true);
    const {data:row, error:saveErr} = await supabase.from("dh_prompt_library").insert({
      user_id:profile.id, user_name:(profile?.full_name||"User").split(" ")[0],
      user_plan:profile?.plan||"free", category, platform, style:pStyle,
      topic:topic.slice(0,80), prompt_text:generated, is_public:true, likes_count:0,
    }).select().single();
    if (saveErr) { console.error("Prompt save error:", saveErr); alert("Save failed: " + saveErr.message); setSaving(false); return; }
    if (row){ setFeed(f=>[row,...f]); setSaved(true); setTimeout(()=>setSaved(false),3000); }
    setSaving(false);
  };

  const deletePrompt = async (id) => {
    if (!confirm("Remove this prompt?")) return;
    setDeleting(id);
    await supabase.from("dh_prompt_library").delete().eq("id",id);
    setFeed(f=>f.filter(p=>p.id!==id)); setDeleting(null);
  };

  const likePrompt = async (id) => {
    await supabase.rpc("increment_prompt_likes",{p_id:id});
    setFeed(f=>f.map(p=>p.id===id?{...p,likes_count:(p.likes_count||0)+1}:p));
  };

  const copy = (text) => { navigator.clipboard.writeText(text); setCopyDone(true); setTimeout(()=>setCopyDone(false),2000); };

  const inp = { width:"100%", background:BG, border:`1.5px solid ${BORDER}`, borderRadius:8, padding:"9px 12px", color:TEXT, fontSize:13, marginBottom:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box" };
  const lbl = { fontSize:11, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6, display:"block" };
  const tag = { display:"inline-block", padding:"3px 8px", background:"#f3f4f6", border:`1px solid ${BORDER}`, borderRadius:5, fontSize:10, color:MUTED, fontWeight:600 };

  return (
    <div style={{minHeight:"100vh",background:BG,padding:"32px 36px",fontFamily:"'Plus Jakarta Sans',sans-serif",color:TEXT}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'); select:focus,input:focus{border-color:${PINK}!important;outline:none}`}</style>

      <div style={{marginBottom:28}}>
        <h1 style={{fontWeight:800,fontSize:22,color:TEXT,letterSpacing:"-0.04em",margin:0}}>
          ✦ Prompt <span style={{color:PINK}}>Space</span>
        </h1>
        <p style={{color:MUTED,fontSize:13,marginTop:5}}>Generate AI image prompts. Save to your team library.</p>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"340px 1fr",gap:24,maxWidth:1100,alignItems:"start"}}>

        {/* ── Left: Generator form ── */}
        <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:14,padding:24,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
          <div style={{fontWeight:700,fontSize:14,color:TEXT,marginBottom:18}}>Generate Prompt</div>
          <label style={lbl}>Category</label>
          <select value={category} onChange={e=>setCategory(e.target.value)} style={inp}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select>
          <label style={lbl}>Platform</label>
          <select value={platform} onChange={e=>setPlatform(e.target.value)} style={inp}>{PLATFORMS.map(p=><option key={p}>{p}</option>)}</select>
          <label style={lbl}>Visual Style</label>
          <select value={pStyle} onChange={e=>setPStyle(e.target.value)} style={inp}>{STYLES.map(s=><option key={s}>{s}</option>)}</select>
          <label style={lbl}>Topic / Subject *</label>
          <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. Diwali sale, product launch…" style={inp}/>
          <label style={lbl}>Brand Name (optional)</label>
          <input value={brand} onChange={e=>setBrand(e.target.value)} placeholder="e.g. FreshBite, StyleHouse" style={inp}/>
          <label style={lbl}>Preferred Colours (optional)</label>
          <input value={colors} onChange={e=>setColors(e.target.value)} placeholder="e.g. deep blue, gold, white" style={{...inp,marginBottom:16}}/>
          {error&&<div style={{padding:"8px 12px",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,color:"#dc2626",fontSize:12,marginBottom:12}}>{error}</div>}
          <button onClick={generatePrompt} disabled={!topic.trim()||loading}
            style={{width:"100%",padding:"11px 0",background:loading?`${PINK}60`:PINK,color:"#fff",border:"none",borderRadius:9,fontSize:13,fontWeight:700,cursor:loading?"not-allowed":"pointer",fontFamily:"inherit"}}>
            {loading?"Generating…":"✦ Generate Prompt"}
          </button>
        </div>

        {/* ── Right: Generated result + Library ── */}
        <div style={{display:"flex",flexDirection:"column",gap:20}}>

          {/* Generated prompt — right side */}
          {generated ? (
            <div style={{background:CARD,border:`2px solid ${PINK}30`,borderRadius:14,padding:24,boxShadow:`0 4px 20px ${PINK}08`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div style={{fontWeight:700,fontSize:14,color:TEXT}}>Generated Prompt</div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>copy(generated)}
                    style={{padding:"6px 14px",background:`${BLUE}10`,border:`1px solid ${BLUE}25`,borderRadius:7,color:BLUE,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                    {copyDone?"✓ Copied!":"Copy"}
                  </button>
                  <button onClick={saveToLibrary} disabled={saving||saved}
                    style={{padding:"6px 14px",background:saved?"#16a34a":PINK,border:"none",borderRadius:7,color:"#fff",fontSize:12,fontWeight:700,cursor:saving?"not-allowed":"pointer",fontFamily:"inherit"}}>
                    {saved?"✓ Saved!":saving?"Saving…":"💾 Save to Library"}
                  </button>
                </div>
              </div>
              <p style={{fontSize:13.5,color:TEXT,lineHeight:1.8,fontStyle:"italic",background:BG,border:`1px solid ${BORDER}`,borderRadius:10,padding:"14px 16px",margin:"0 0 12px"}}>
                {generated}
              </p>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {[category,platform,pStyle].map(t=><span key={t} style={tag}>{t}</span>)}
              </div>
            </div>
          ) : (
            <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:14,padding:"32px 24px",textAlign:"center",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
              <div style={{fontSize:24,marginBottom:10}}>✦</div>
              <div style={{fontSize:14,fontWeight:600,color:TEXT,marginBottom:6}}>Your prompt appears here</div>
              <div style={{fontSize:13,color:MUTED}}>Fill in the form and click Generate.</div>
            </div>
          )}

          {/* Prompt Library */}
          <div>
            <div style={{fontWeight:700,fontSize:15,color:TEXT,marginBottom:14}}>
              Prompt Library <span style={{fontSize:12,color:MUTED,fontWeight:400}}>({feed.length} saved)</span>
            </div>
            {feedLoad&&<div style={{color:MUTED,fontSize:13}}>Loading…</div>}
            {!feedLoad&&feed.length===0&&(
              <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:12,padding:"28px 24px",textAlign:"center",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                <div style={{fontSize:13,fontWeight:600,color:TEXT,marginBottom:4}}>Library is empty</div>
                <div style={{fontSize:12,color:MUTED}}>Generate a prompt and save it here.</div>
              </div>
            )}
            {!feedLoad&&feed.map(p=>(
              <div key={p.id} style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:12,padding:18,marginBottom:12,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:30,height:30,borderRadius:"50%",background:`${PINK}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:PINK}}>
                      {(p.user_name||"?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:TEXT}}>{p.user_name||"User"}</div>
                      <div style={{fontSize:10,color:MUTED}}>{new Date(p.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>copy(p.prompt_text)}
                      style={{padding:"4px 10px",background:`${BLUE}08`,border:`1px solid ${BLUE}20`,borderRadius:6,color:BLUE,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Copy</button>
                    {p.user_id===profile?.id&&(
                      <button onClick={()=>deletePrompt(p.id)} disabled={deleting===p.id}
                        style={{padding:"4px 8px",background:"transparent",border:"1px solid #fecaca",borderRadius:6,color:"#ef4444",fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>✕</button>
                    )}
                  </div>
                </div>
                <p style={{fontSize:12.5,color:TEXT,lineHeight:1.7,fontStyle:"italic",margin:"0 0 10px"}}>
                  {p.prompt_text?.slice(0,200)}{p.prompt_text?.length>200?"…":""}
                </p>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                  {[p.category,p.platform,p.style].filter(Boolean).map(t=><span key={t} style={tag}>{t}</span>)}
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:10,borderTop:`1px solid ${BORDER}`}}>
                  <button onClick={()=>likePrompt(p.id)}
                    style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:MUTED,fontFamily:"inherit",padding:0}}>♥ {p.likes_count||0} Likes</button>
                  <button onClick={()=>{setTopic(p.topic||"");setCategory(p.category||category);setPlatform(p.platform||platform);setPStyle(p.style||pStyle);setGenerated(p.prompt_text);}}
                    style={{background:"none",border:`1px solid ${BORDER}`,borderRadius:6,color:PINK,fontSize:10,fontWeight:700,cursor:"pointer",padding:"4px 10px",fontFamily:"inherit"}}>Use →</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}