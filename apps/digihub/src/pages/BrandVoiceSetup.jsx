/**
 * DigiHub — Brand Voice Setup (Full Page)
 * Saves brand configuration to localStorage + Supabase.
 * Used by all AI tools to generate on-brand content.
 */
import React, { useState } from "react";
import { supabase } from "../lib/supabase";

const PINK   = "#e8185d";
const BLUE   = "#0284c7";
const GREEN  = "#16a34a";
const BG     = "#f8f9fb";
const CARD   = "#ffffff";
const BORDER = "#e8eaed";
const TEXT   = "#111827";
const MUTED  = "#6b7280";

const INDUSTRIES = ["E-commerce / Retail","Restaurant / Food","Technology / SaaS","Fashion / Apparel","Real Estate","Healthcare / Wellness","Education / Coaching","Finance / Insurance","Travel / Hospitality","Manufacturing / Industrial","Creative / Agency","Personal Brand","Other"];
const TONES      = ["Professional & Authoritative","Friendly & Approachable","Bold & Energetic","Inspirational & Motivational","Casual & Conversational","Elegant & Premium","Playful & Fun","Educational & Informative"];
const AUDIENCES  = ["Young Adults (18–25)","Millennials (25–35)","Professionals (30–50)","Business Owners","Students","Parents","Seniors (50+)","Mixed / General"];
const PLATFORMS  = ["Instagram","LinkedIn","Facebook","Twitter/X","YouTube","Pinterest","WhatsApp Business","Google Business"];
const FREQ       = ["Daily","3–5 times/week","1–2 times/week","A few times a month"];

const KEY = "digihub-brand-voice";

export function loadBrandVoice() {
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; }
}

export function buildBrandContext(voice) {
  if (!voice?.brandName) return "";
  const parts = [
    voice.brandName         && `Brand: ${voice.brandName}`,
    voice.industry          && `Industry: ${voice.industry}`,
    voice.tone              && `Tone: ${voice.tone}`,
    voice.audience          && `Target audience: ${voice.audience}`,
    voice.usp               && `USP: ${voice.usp}`,
    voice.platforms?.length && `Active platforms: ${voice.platforms.join(", ")}`,
    voice.avoidWords        && `Avoid these words/topics: ${voice.avoidWords}`,
    voice.brandKeywords     && `Always mention: ${voice.brandKeywords}`,
  ].filter(Boolean);
  return parts.length ? `[BRAND CONTEXT: ${parts.join(" | ")}]` : "";
}

function Section({ title, icon, children }) {
  return (
    <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:14,padding:24,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
      <div style={{fontWeight:700,fontSize:13,color:BLUE,marginBottom:18,display:"flex",alignItems:"center",gap:7}}>
        <span style={{fontSize:15}}>{icon}</span> {title}
      </div>
      {children}
    </div>
  );
}

function Label({ children }) {
  return <label style={{fontSize:11,fontWeight:700,color:MUTED,textTransform:"uppercase",letterSpacing:"0.07em",display:"block",marginBottom:7}}>{children}</label>;
}

function Pill({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      style={{padding:"7px 14px",borderRadius:20,fontSize:12.5,fontWeight:600,cursor:"pointer",fontFamily:"inherit",
        border:`1px solid ${active?BLUE:BORDER}`,
        background:active?`${BLUE}12`:"transparent",
        color:active?BLUE:MUTED,transition:"all 0.13s"}}>
      {children}
    </button>
  );
}

const defaultVoice = (profile) => ({
  brandName:"", industry:profile?.industry||"", tone:"", audience:"",
  usp:"", platforms:[], postFreq:"", brandKeywords:"", avoidWords:"", emoji:"moderate",
});

export default function BrandVoiceSetup({ profile }) {
  const [voice,   setVoice]  = useState(() => loadBrandVoice() || defaultVoice(profile));
  const [saving,  setSaving] = useState(false);
  const [saved,   setSaved]  = useState(false);
  const [cleared, setCleared]= useState(false);

  const set = (k, v) => setVoice(f => ({ ...f, [k]: v }));
  const togglePlatform = (p) => setVoice(f => ({
    ...f, platforms: f.platforms.includes(p) ? f.platforms.filter(x=>x!==p) : [...f.platforms, p],
  }));

  const save = async () => {
    setSaving(true);
    localStorage.setItem(KEY, JSON.stringify(voice));
    try {
      const { data:{ session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from("profiles")
          .update({ industry: voice.industry, updated_at: new Date().toISOString() })
          .eq("id", session.user.id);
      }
    } catch(e) { console.error("Supabase save:", e.message); }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const clear = () => {
    if (!window.confirm("Clear all brand voice settings?")) return;
    localStorage.removeItem(KEY);
    setVoice(defaultVoice(profile));
    setCleared(true);
    setTimeout(() => setCleared(false), 2000);
  };

  const inp = {
    width:"100%", padding:"10px 13px", background:BG, border:`1.5px solid ${BORDER}`,
    borderRadius:9, color:TEXT, fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box",
  };

  return (
    <div style={{minHeight:"100vh",background:BG,padding:"32px 36px",fontFamily:"'Plus Jakarta Sans',sans-serif",color:TEXT}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'); input:focus,select:focus,textarea:focus{border-color:${BLUE}!important;outline:none}`}</style>

      {/* Header */}
      <div style={{marginBottom:28,display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
        <div>
          <h1 style={{fontWeight:800,fontSize:22,color:TEXT,letterSpacing:"-0.04em",margin:0}}>✦ Brand Voice</h1>
          <p style={{color:MUTED,fontSize:13,marginTop:5}}>Set up your brand identity — all AI tools will use this to generate on-brand content.</p>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          {(saved||cleared) && (
            <span style={{fontSize:12,fontWeight:700,color:saved?GREEN:"#d97706",background:saved?"#f0fdf4":"#fffbeb",padding:"6px 14px",borderRadius:8,border:`1px solid ${saved?"#bbf7d0":"#fde68a"}`}}>
              {saved?"✓ Brand voice saved!":"✓ Cleared"}
            </span>
          )}
          <button onClick={clear}
            style={{padding:"9px 18px",background:"none",border:`1px solid ${BORDER}`,borderRadius:9,color:MUTED,fontSize:12.5,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
            🗑 Clear All
          </button>
          <button onClick={save} disabled={saving||!voice.brandName.trim()}
            style={{padding:"9px 22px",background:saving?`${PINK}60`:PINK,border:"none",borderRadius:9,color:"#fff",fontSize:13,fontWeight:700,cursor:saving||!voice.brandName.trim()?"not-allowed":"pointer",fontFamily:"inherit",transition:"background 0.15s"}}>
            {saving?"Saving…":"Save Brand Voice →"}
          </button>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,maxWidth:1100}}>

        {/* Left column */}
        <div style={{display:"flex",flexDirection:"column",gap:20}}>

          <Section title="Brand Identity" icon="🏢">
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div>
                <Label>Brand / Business Name *</Label>
                <input value={voice.brandName} onChange={e=>set("brandName",e.target.value)}
                  placeholder="e.g. Nugens, StyleHouse, FreshBite" style={inp}/>
              </div>
              <div>
                <Label>Industry</Label>
                <select value={voice.industry} onChange={e=>set("industry",e.target.value)}
                  style={{...inp,cursor:"pointer"}}>
                  <option value="">— Select industry —</option>
                  {INDUSTRIES.map(i=><option key={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <Label>Your Unique Selling Point</Label>
                <input value={voice.usp} onChange={e=>set("usp",e.target.value)}
                  placeholder="What makes you different in one sentence" style={inp}/>
              </div>
            </div>
          </Section>

          <Section title="Content Rules" icon="📝">
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div>
                <Label>Always Mention (keywords, brand phrases)</Label>
                <input value={voice.brandKeywords} onChange={e=>set("brandKeywords",e.target.value)}
                  placeholder="e.g. premium quality, handcrafted, 10-year warranty" style={inp}/>
              </div>
              <div>
                <Label>Avoid These Words / Topics</Label>
                <input value={voice.avoidWords} onChange={e=>set("avoidWords",e.target.value)}
                  placeholder="e.g. cheap, discount, competitor names" style={inp}/>
              </div>
            </div>
          </Section>

        </div>

        {/* Right column */}
        <div style={{display:"flex",flexDirection:"column",gap:20}}>

          <Section title="Voice & Audience" icon="🎯">
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div>
                <Label>Brand Tone</Label>
                <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                  {TONES.map(t=><Pill key={t} active={voice.tone===t} onClick={()=>set("tone",t)}>{t}</Pill>)}
                </div>
              </div>
              <div>
                <Label>Target Audience</Label>
                <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                  {AUDIENCES.map(a=><Pill key={a} active={voice.audience===a} onClick={()=>set("audience",a)}>{a}</Pill>)}
                </div>
              </div>
              <div>
                <Label>Emoji Usage</Label>
                <div style={{display:"flex",gap:7}}>
                  {[["none","None"],["light","Light"],["moderate","Moderate"],["heavy","Heavy 🎉"]].map(([v,l])=>(
                    <Pill key={v} active={voice.emoji===v} onClick={()=>set("emoji",v)}>{l}</Pill>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          <Section title="Platforms & Frequency" icon="📱">
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div>
                <Label>Active Platforms</Label>
                <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                  {PLATFORMS.map(p=><Pill key={p} active={voice.platforms.includes(p)} onClick={()=>togglePlatform(p)}>{p}</Pill>)}
                </div>
              </div>
              <div>
                <Label>Posting Frequency</Label>
                <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                  {FREQ.map(f=><Pill key={f} active={voice.postFreq===f} onClick={()=>set("postFreq",f)}>{f}</Pill>)}
                </div>
              </div>
            </div>
          </Section>

        </div>
      </div>

      {/* Bottom save bar */}
      <div style={{marginTop:28,padding:"16px 24px",background:CARD,border:`1px solid ${BORDER}`,borderRadius:14,display:"flex",justifyContent:"space-between",alignItems:"center",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:TEXT}}>
            {voice.brandName ? `✓ ${voice.brandName} — ${voice.tone||"No tone set"} · ${voice.audience||"No audience set"}` : "Fill in your brand details above to get started"}
          </div>
          <div style={{fontSize:11,color:MUTED,marginTop:2}}>
            All DigiHub AI tools (Hashtag Gen, Bulk Generator, Content Planner) will use this brand context automatically.
          </div>
        </div>
        <button onClick={save} disabled={saving||!voice.brandName.trim()}
          style={{padding:"11px 28px",background:saving?`${PINK}60`:PINK,border:"none",borderRadius:10,color:"#fff",fontSize:13,fontWeight:700,cursor:saving||!voice.brandName.trim()?"not-allowed":"pointer",fontFamily:"inherit",whiteSpace:"nowrap",flexShrink:0,marginLeft:20}}>
          {saving?"Saving…":"Save Brand Voice →"}
        </button>
      </div>
    </div>
  );
}