/**
 * DigiHub — Brand Voice Setup
 * One-time brand configuration that personalises all AI content generation.
 * Saves to localStorage + Supabase profiles (industry field).
 */
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const BLUE   = "#0284c7";
const BG     = "#06101a";
const CARD   = "#0a1628";
const B      = "#1a2030";
const MUTED  = "#6b7280";
const TEXT   = "#e2e8f0";
const GREEN  = "#16a34a";

const INDUSTRIES = ["E-commerce / Retail","Restaurant / Food","Technology / SaaS","Fashion / Apparel","Real Estate","Healthcare / Wellness","Education / Coaching","Finance / Insurance","Travel / Hospitality","Manufacturing / Industrial","Creative / Agency","Personal Brand","Other"];
const TONES      = ["Professional & Authoritative","Friendly & Approachable","Bold & Energetic","Inspirational & Motivational","Casual & Conversational","Elegant & Premium","Playful & Fun","Educational & Informative"];
const AUDIENCES  = ["Young Adults (18–25)","Millennials (25–35)","Professionals (30–50)","Business Owners","Students","Parents","Seniors (50+)","Mixed / General"];
const PLATFORMS  = ["Instagram","LinkedIn","Facebook","Twitter/X","YouTube","Pinterest","WhatsApp Business","Google Business"];
const FREQ       = ["Daily","3–5 times/week","1–2 times/week","A few times a month"];

const S = {
  page:  { minHeight:"100vh", background:BG, padding:"32px 36px", fontFamily:"'Plus Jakarta Sans',sans-serif", color:TEXT },
  card:  { background:CARD, border:`1px solid ${B}`, borderRadius:14, padding:"24px" },
  label: { fontSize:11.5, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 },
  inp:   { width:"100%", padding:"10px 13px", background:"#0d1f35", border:`1.5px solid ${B}`, borderRadius:9, color:TEXT, fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none", boxSizing:"border-box", transition:"border 0.14s" },
  sel:   { width:"100%", padding:"10px 13px", background:"#0d1f35", border:`1.5px solid ${B}`, borderRadius:9, color:TEXT, fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none", cursor:"pointer" },
  pill:  (active) => ({ padding:"7px 14px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer", border:`1px solid ${active?BLUE:B}`, background:active?`${BLUE}20`:"transparent", color:active?BLUE:MUTED, fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all 0.13s" }),
};

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

export default function BrandVoiceSetup({ profile, onClose, onSaved }) {
  const [voice, setVoice] = useState(() => {
    const saved = loadBrandVoice();
    return saved || {
      brandName:    "",
      industry:     profile?.industry || "",
      tone:         "",
      audience:     "",
      usp:          "",
      platforms:    [],
      postFreq:     "",
      brandKeywords:"",
      avoidWords:   "",
      emoji:        "moderate",
    };
  });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const set = (k, v) => setVoice(f => ({ ...f, [k]: v }));
  const togglePlatform = (p) => setVoice(f => ({
    ...f,
    platforms: f.platforms.includes(p) ? f.platforms.filter(x=>x!==p) : [...f.platforms, p],
  }));

  const save = async () => {
    setSaving(true);
    localStorage.setItem(KEY, JSON.stringify(voice));
    // Also save industry to Supabase
    try {
      const { data:{ session } } = await supabase.auth.getSession();
      if (session && voice.industry) {
        await supabase.from("profiles").update({ industry: voice.industry }).eq("id", session.user.id);
      }
    } catch(e) {}
    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); onSaved?.(); }, 1500);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:950, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
      onClick={e => { if(e.target===e.currentTarget) onClose?.(); }}>

      <div style={{ background:CARD, borderRadius:20, width:"100%", maxWidth:560, maxHeight:"90vh", overflowY:"auto", border:`1px solid ${B}`, boxShadow:"0 32px 80px rgba(0,0,0,0.5)", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>

        {/* Header */}
        <div style={{ padding:"20px 24px 16px", borderBottom:`1px solid ${B}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontWeight:800, fontSize:16, color:TEXT }}>Brand Voice Setup</div>
            <div style={{ fontSize:12, color:MUTED, marginTop:2 }}>All AI tools will use this to generate on-brand content.</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:MUTED, lineHeight:1 }}>×</button>
        </div>

        <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:18 }}>

          {/* Brand basics */}
          <div style={S.card}>
            <div style={{ fontWeight:700, fontSize:13, color:BLUE, marginBottom:14 }}>Brand Identity</div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div>
                <label style={S.label}>Brand / Business Name</label>
                <input value={voice.brandName} onChange={e=>set("brandName",e.target.value)} placeholder="e.g. Nugens, StyleHouse, FreshBite" style={S.inp}
                  onFocus={e=>e.target.style.borderColor=BLUE} onBlur={e=>e.target.style.borderColor=B}/>
              </div>
              <div>
                <label style={S.label}>Industry</label>
                <select value={voice.industry} onChange={e=>set("industry",e.target.value)} style={S.sel}>
                  <option value="">— Select industry —</option>
                  {INDUSTRIES.map(i=><option key={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Your Unique Selling Point</label>
                <input value={voice.usp} onChange={e=>set("usp",e.target.value)} placeholder="What makes you different in one sentence" style={S.inp}
                  onFocus={e=>e.target.style.borderColor=BLUE} onBlur={e=>e.target.style.borderColor=B}/>
              </div>
            </div>
          </div>

          {/* Voice & Audience */}
          <div style={S.card}>
            <div style={{ fontWeight:700, fontSize:13, color:BLUE, marginBottom:14 }}>Voice & Audience</div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div>
                <label style={S.label}>Brand Tone</label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                  {TONES.map(t => (
                    <button key={t} onClick={()=>set("tone",t)} style={S.pill(voice.tone===t)}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={S.label}>Target Audience</label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                  {AUDIENCES.map(a => (
                    <button key={a} onClick={()=>set("audience",a)} style={S.pill(voice.audience===a)}>{a}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={S.label}>Emoji Usage</label>
                <div style={{ display:"flex", gap:7 }}>
                  {[["none","None"],["light","Light"],["moderate","Moderate"],["heavy","Heavy 🎉"]].map(([v,l])=>(
                    <button key={v} onClick={()=>set("emoji",v)} style={S.pill(voice.emoji===v)}>{l}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Platforms */}
          <div style={S.card}>
            <div style={{ fontWeight:700, fontSize:13, color:BLUE, marginBottom:14 }}>Active Platforms</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginBottom:12 }}>
              {PLATFORMS.map(p => (
                <button key={p} onClick={()=>togglePlatform(p)} style={S.pill(voice.platforms.includes(p))}>{p}</button>
              ))}
            </div>
            <div>
              <label style={S.label}>Posting Frequency</label>
              <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                {FREQ.map(f => (
                  <button key={f} onClick={()=>set("postFreq",f)} style={S.pill(voice.postFreq===f)}>{f}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Keywords */}
          <div style={S.card}>
            <div style={{ fontWeight:700, fontSize:13, color:BLUE, marginBottom:14 }}>Content Rules</div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div>
                <label style={S.label}>Always Mention (keywords, brand phrases)</label>
                <input value={voice.brandKeywords} onChange={e=>set("brandKeywords",e.target.value)} placeholder="e.g. premium quality, handcrafted, 10-year warranty" style={S.inp}
                  onFocus={e=>e.target.style.borderColor=BLUE} onBlur={e=>e.target.style.borderColor=B}/>
              </div>
              <div>
                <label style={S.label}>Avoid These Words / Topics</label>
                <input value={voice.avoidWords} onChange={e=>set("avoidWords",e.target.value)} placeholder="e.g. cheap, discount, competitor names" style={S.inp}
                  onFocus={e=>e.target.style.borderColor=BLUE} onBlur={e=>e.target.style.borderColor=B}/>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{ padding:"16px 24px 20px", borderTop:`1px solid ${B}`, display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:"10px 0", background:"transparent", border:`1px solid ${B}`, borderRadius:9, fontSize:13, fontWeight:600, color:MUTED, cursor:"pointer", fontFamily:"inherit" }}>
            Cancel
          </button>
          <button onClick={save} disabled={saving || !voice.brandName.trim()}
            style={{ flex:2, padding:"10px 0", background:saved?GREEN:BLUE, border:"none", borderRadius:9, fontSize:13, fontWeight:700, color:"#fff", cursor:saving?"wait":"pointer", transition:"background 0.2s", fontFamily:"inherit" }}>
            {saved ? "✓ Brand Voice Saved!" : saving ? "Saving…" : "Save Brand Voice →"}
          </button>
        </div>
      </div>
    </div>
  );
}
