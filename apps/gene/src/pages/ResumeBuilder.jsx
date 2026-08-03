import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { supabase } from "../lib/supabase";

const PINK = "#e8185d";
const BG = "#f8f9fb";
const CARD = "#ffffff";
const BORDER = "#e8eaed";

// ✅ API constant added
const API = import.meta.env.VITE_GEN_E_API_URL || "https://nugens-platform-production.up.railway.app";

export default function ResumeBuilder({ profile }) {
  const [form, setForm] = useState({
    fullName: profile?.full_name || "",
    email: profile?.email || "",
    phone: "",
    location: "",
    targetRole: profile?.target_role || "",
    currentRole: profile?.situation || "",
    experienceLevel: profile?.experience || "",
    skills: profile?.skills || "",
    education: "",
    experience: "",
    achievements: "",
  });

  const [preview, setPreview] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const updateField = (key, value) => setForm(p => ({ ...p, [key]: value }));

  const generateResume = async () => {
    if (!form.targetRole || !form.fullName) {
      alert("Full Name and Target Role are required");
      return;
    }

    setLoading(true);
    setPreview("");
    setPdfUrl("");

    try {
      const token = (await supabase.auth.getSession()).data?.session?.access_token;

      const res = await fetch(`${API}/api/gene/tool`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          tool: "generate_resume",
          inputs: form,
          userType: "individual",
        }),
      });

      if (!res.ok) throw new Error("Failed to generate resume");

      const data = await res.json();

      if (data.content_md) setPreview(data.content_md);
      if (data.pdf_url) setPdfUrl(data.pdf_url);

    } catch (e) {
      alert("Generation error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!pdfUrl) return;
    window.open(pdfUrl, "_blank");
  };

  const downloadMarkdown = () => {
    if (!preview) return;
    const blob = new Blob([preview], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form.fullName.replace(/\s+/g, "_")}_Resume.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, padding: "32px 40px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: PINK, letterSpacing: "0.08em" }}>GEN-E</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111", margin: "4px 0 6px" }}>ATS Resume Builder</h1>
          <p style={{ color: "#666", fontSize: 14 }}>Live preview • ATS-optimized • Professional PDF download</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 24 }}>
          {/* Form Side */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: "#111" }}>Your Details</div>

            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>Full Name *</label>
                <input value={form.fullName} onChange={e => updateField("fullName", e.target.value)} placeholder="John Doe" style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${BORDER}`, borderRadius: 9, fontSize: 14 }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>Email</label>
                  <input value={form.email} onChange={e => updateField("email", e.target.value)} placeholder="you@email.com" style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${BORDER}`, borderRadius: 9, fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>Phone</label>
                  <input value={form.phone} onChange={e => updateField("phone", e.target.value)} placeholder="+91 98765 43210" style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${BORDER}`, borderRadius: 9, fontSize: 14 }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>Location</label>
                <input value={form.location} onChange={e => updateField("location", e.target.value)} placeholder="Bangalore, India" style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${BORDER}`, borderRadius: 9, fontSize: 14 }} />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>Target Role *</label>
                <input value={form.targetRole} onChange={e => updateField("targetRole", e.target.value)} placeholder="Senior Product Manager" style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${BORDER}`, borderRadius: 9, fontSize: 14 }} />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>Current Role</label>
                <input value={form.currentRole} onChange={e => updateField("currentRole", e.target.value)} placeholder="Frontend Developer" style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${BORDER}`, borderRadius: 9, fontSize: 14 }} />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>Experience Level</label>
                <input value={form.experienceLevel} onChange={e => updateField("experienceLevel", e.target.value)} placeholder="4 years" style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${BORDER}`, borderRadius: 9, fontSize: 14 }} />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>Key Skills</label>
                <input value={form.skills} onChange={e => updateField("skills", e.target.value)} placeholder="React, TypeScript, Node.js" style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${BORDER}`, borderRadius: 9, fontSize: 14 }} />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>Education</label>
                <input value={form.education} onChange={e => updateField("education", e.target.value)} placeholder="B.Tech CSE, XYZ University (2020)" style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${BORDER}`, borderRadius: 9, fontSize: 14 }} />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>Work Experience</label>
                <textarea value={form.experience} onChange={e => updateField("experience", e.target.value)} rows={3} placeholder="Frontend Developer at ABC Corp (2022-Present)&#10;- Built dashboard used by 50k+ users" style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${BORDER}`, borderRadius: 9, fontSize: 13, resize: "vertical" }} />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>Key Achievements / Projects</label>
                <textarea value={form.achievements} onChange={e => updateField("achievements", e.target.value)} rows={2} placeholder="Increased conversion by 34%&#10;Launched 3 major features" style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${BORDER}`, borderRadius: 9, fontSize: 13, resize: "vertical" }} />
              </div>
            </div>

            <button 
              onClick={generateResume} 
              disabled={loading || !form.targetRole || !form.fullName}
              style={{ 
                marginTop: 20, width: "100%", padding: "14px 0", 
                background: loading ? "#f0d0d8" : PINK, color: "#fff", border: "none", 
                borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: loading || !form.targetRole || !form.fullName ? "not-allowed" : "pointer" 
              }}
            >
              {loading ? "Generating ATS Resume..." : "⚡ Generate Resume & Preview →"}
            </button>

            {preview && (
              <button 
                onClick={pdfUrl ? downloadPDF : downloadMarkdown}
                style={{ 
                  marginTop: 12, width: "100%", padding: "12px 0", 
                  background: "#fff", color: PINK, border: `1.5px solid ${PINK}`, 
                  borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer" 
                }}
              >
                ⬇ {pdfUrl ? "Download Resume (PDF)" : "Download Resume (Markdown)"}
              </button>
            )}

            <div style={{ fontSize: 11, color: "#888", marginTop: 10, textAlign: "center" }}>
              Auto-saved to Vault • Professional ATS PDF available
            </div>
          </div>

          {/* Live ATS Preview */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, minHeight: 520 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: "#111" }}>Live ATS Preview</div>

            {!preview && !loading && (
              <div style={{ 
                height: 420, display: "flex", alignItems: "center", justifyContent: "center", 
                color: "#aaa", fontSize: 14, textAlign: "center", border: `2px dashed ${BORDER}`, borderRadius: 12 
              }}>
                Your ATS-optimized resume will appear here.<br />Fill the form and generate.
              </div>
            )}

            {loading && <div style={{ padding: 40, textAlign: "center", color: "#666" }}>Building your professional resume…</div>}

            {preview && (
              <div style={{ 
                background: "#fafafa", border: `1px solid ${BORDER}`, borderRadius: 10, 
                padding: 24, fontSize: 14, lineHeight: 1.75, color: "#222", 
                maxHeight: 620, overflow: "auto",
                fontFamily: "system-ui, -apple-system, sans-serif"
              }}>
                {/* BUG FIX: this used to render {preview} as raw text, so the
                    AI's markdown syntax ("## CORE SKILLS", "**Developer**")
                    showed up as literal characters instead of being rendered
                    as headers/bold. Now actually parsed and styled. */}
                <ReactMarkdown components={{
                  h2: ({children}) => <div style={{ fontSize:13, fontWeight:800, color:PINK, textTransform:"uppercase", letterSpacing:"0.04em", marginTop:20, marginBottom:8, borderBottom:`1px solid ${PINK}30`, paddingBottom:4 }}>{children}</div>,
                  strong: ({children}) => <strong style={{ color:"#111", fontWeight:700 }}>{children}</strong>,
                  ul: ({children}) => <ul style={{ margin:"4px 0 12px", paddingLeft:20 }}>{children}</ul>,
                  li: ({children}) => <li style={{ marginBottom:6 }}>{children}</li>,
                  p: ({children}) => <p style={{ margin:"0 0 10px" }}>{children}</p>,
                }}>{preview}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}