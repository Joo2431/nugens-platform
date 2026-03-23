/**
 * Gen-E — My Career Profile
 * Sticky user context that Gen-E pulls automatically every chat.
 * Saves to Supabase profiles table (goal, situation, industry columns).
 */
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const PINK = "#e8185d";
const API  = import.meta.env.VITE_GEN_E_API_URL || "https://nugens-platform.onrender.com";

const ROLES = [
  "Software Engineer","Product Manager","Data Scientist","UX Designer","Marketing Manager",
  "HR Executive","Sales Executive","Business Analyst","DevOps Engineer","Content Creator",
  "Digital Marketer","Graphic Designer","Finance Analyst","Project Manager","Other",
];
const EXP_LEVELS = ["Fresher (0–1 yr)","Junior (1–3 yrs)","Mid-level (3–5 yrs)","Senior (5–8 yrs)","Lead / Manager (8+ yrs)"];
const INDUSTRIES  = ["Technology","E-commerce","Fintech","Healthcare","EdTech","Marketing & Media","Manufacturing","Real Estate","Consulting","Other"];
const GOALS       = ["Get my first job","Switch careers","Get promoted","Start a business","Improve my skills","Find better-paying role","Build my personal brand","Other"];

const inp = {
  width:"100%", padding:"9px 12px", borderRadius:9,
  border:"1.5px solid #edf0f3", background:"#fafbfc",
  fontSize:13, color:"#111", fontFamily:"inherit", outline:"none",
  transition:"border 0.14s", boxSizing:"border-box",
};

export default function MyCareerProfile({ profile, onClose, onSaved }) {
  const [form,  setForm]  = useState({
    full_name:   profile?.full_name   || "",
    current_role: profile?.situation  || "",
    experience:  "",
    industry:    profile?.industry    || "",
    goal:        profile?.goal        || "",
    target_role: "",
    skills:      "",
    location:    "",
  });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  // Load extra fields from localStorage for skills/target (not in DB schema yet)
  useEffect(() => {
    const extra = JSON.parse(localStorage.getItem("gene-profile-extra") || "{}");
    setForm(f => ({ ...f, ...extra }));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Save core fields to Supabase
      await supabase.from("profiles").update({
        full_name:  form.full_name,
        situation:  form.current_role,
        industry:   form.industry,
        goal:       form.goal,
      }).eq("id", session.user.id);

      // Save extended fields to localStorage (target_role, skills, experience, location)
      localStorage.setItem("gene-profile-extra", JSON.stringify({
        target_role: form.target_role,
        skills:      form.skills,
        experience:  form.experience,
        location:    form.location,
      }));

      setSaved(true);
      setTimeout(() => { setSaved(false); onSaved?.(); }, 1500);
    } catch(e) {
      console.error("Profile save error:", e);
    } finally {
      setSaving(false);
    }
  };

  const Sel = ({ label, field, options }) => (
    <div>
      <label style={{ fontSize:11.5, fontWeight:600, color:"#666", display:"block", marginBottom:4 }}>{label}</label>
      <select value={form[field]} onChange={e => set(field, e.target.value)}
        style={{ ...inp, cursor:"pointer" }}
        onFocus={e => e.target.style.borderColor = PINK}
        onBlur={e  => e.target.style.borderColor = "#edf0f3"}>
        <option value="">— Select —</option>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );

  const Field = ({ label, field, placeholder, textarea }) => (
    <div>
      <label style={{ fontSize:11.5, fontWeight:600, color:"#666", display:"block", marginBottom:4 }}>{label}</label>
      {textarea
        ? <textarea value={form[field]} onChange={e => set(field, e.target.value)} placeholder={placeholder} rows={3}
            style={{ ...inp, resize:"vertical" }}
            onFocus={e => e.target.style.borderColor = PINK}
            onBlur={e  => e.target.style.borderColor = "#edf0f3"} />
        : <input value={form[field]} onChange={e => set(field, e.target.value)} placeholder={placeholder}
            style={inp}
            onFocus={e => e.target.style.borderColor = PINK}
            onBlur={e  => e.target.style.borderColor = "#edf0f3"} />
      }
    </div>
  );

  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:950,
      display:"flex", alignItems:"center", justifyContent:"center", padding:20,
    }} onClick={e => { if(e.target===e.currentTarget) onClose(); }}>

      <div style={{
        background:"#fff", borderRadius:20, width:"100%", maxWidth:480,
        maxHeight:"90vh", overflowY:"auto", boxShadow:"0 32px 80px rgba(0,0,0,0.2)",
        fontFamily:"'Plus Jakarta Sans',sans-serif",
      }}>
        {/* Header */}
        <div style={{ padding:"20px 24px 16px", borderBottom:"1px solid #f0f2f5", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontWeight:800, fontSize:16, color:"#111" }}>My Career Profile</div>
            <div style={{ fontSize:12, color:"#aaa", marginTop:2 }}>
              Gen-E reads this automatically — no need to re-explain yourself every chat.
            </div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:"#ccc", lineHeight:1 }}>×</button>
        </div>

        {/* Form */}
        <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:14 }}>

          <Field label="Your Name" field="full_name" placeholder="e.g. Priya Sharma" />
          <Sel   label="Current Role" field="current_role" options={ROLES} />
          <Sel   label="Experience Level" field="experience" options={EXP_LEVELS} />
          <Sel   label="Industry" field="industry" options={INDUSTRIES} />
          <Field label="Location" field="location" placeholder="e.g. Bangalore, Chennai, Remote" />

          <div style={{ height:1, background:"#f0f2f5" }} />

          <Field label="Target Role (What you're working toward)" field="target_role" placeholder="e.g. Product Manager at a startup" />
          <Sel   label="Primary Career Goal" field="goal" options={GOALS} />
          <Field label="Key Skills (comma-separated)" field="skills" placeholder="e.g. React, Python, Figma, SQL" textarea />

        </div>

        {/* Footer */}
        <div style={{ padding:"16px 24px 20px", borderTop:"1px solid #f0f2f5", display:"flex", gap:10 }}>
          <button onClick={onClose}
            style={{ flex:1, padding:"10px 0", background:"#f5f7fa", border:"none", borderRadius:9, fontSize:13, fontWeight:600, color:"#888", cursor:"pointer" }}>
            Cancel
          </button>
          <button onClick={save} disabled={saving}
            style={{ flex:2, padding:"10px 0", background:saved?"#16a34a":PINK, border:"none", borderRadius:9, fontSize:13, fontWeight:700, color:"#fff", cursor:saving?"wait":"pointer", transition:"background 0.2s" }}>
            {saved ? "✓ Saved!" : saving ? "Saving…" : "Save Profile →"}
          </button>
        </div>

        {/* Info note */}
        <div style={{ margin:"0 24px 20px", padding:"10px 12px", background:"#fff8f0", borderRadius:9, border:"1px solid #fed7aa" }}>
          <div style={{ fontSize:11.5, color:"#92400e", lineHeight:1.6 }}>
            💡 <strong>How it works:</strong> Gen-E reads your profile at the start of every conversation so it can give you personalised advice without you repeating yourself. Update it anytime as your situation changes.
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Builds a context string from saved profile to prepend to AI messages.
 * Call this from GenEChat before sending to backend.
 */
export function buildContextString(profile) {
  const extra = JSON.parse(localStorage.getItem("gene-profile-extra") || "{}");
  const parts = [];
  if (profile?.full_name)   parts.push(`Name: ${profile.full_name}`);
  if (profile?.situation)   parts.push(`Current role: ${profile.situation}`);
  if (extra.experience)     parts.push(`Experience: ${extra.experience}`);
  if (profile?.industry)    parts.push(`Industry: ${profile.industry}`);
  if (extra.location)       parts.push(`Location: ${extra.location}`);
  if (extra.target_role)    parts.push(`Target role: ${extra.target_role}`);
  if (profile?.goal)        parts.push(`Career goal: ${profile.goal}`);
  if (extra.skills)         parts.push(`Skills: ${extra.skills}`);
  if (!parts.length) return "";
  return `[USER CONTEXT — use this to personalise every response:\n${parts.join(" | ")}\n]\n\n`;
}
