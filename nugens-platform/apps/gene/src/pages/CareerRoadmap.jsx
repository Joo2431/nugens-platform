import React, { useState } from "react";
import { supabase } from "../lib/supabase";

const PINK = "#e8185d";
const BG = "#f8f9fb";
const CARD = "#ffffff";
const BORDER = "#e8eaed";

export default function CareerRoadmap({ profile }) {
  const [step, setStep] = useState("clarify");
  const [form, setForm] = useState({
    currentRole: profile?.situation || "",
    targetRole: profile?.target_role || "",
    timeline: "12 months",
    skills: profile?.skills || "",
  });
  const [roadmap, setRoadmap] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");

  const updateField = (key, value) => setForm(p => ({ ...p, [key]: value }));

  const generateRoadmap = async () => {
    if (!form.targetRole || !form.currentRole) return alert("Please fill Current Role and Target Role");

    setLoading(true);
    setStep("generating");

    try {
      const token = (await supabase.auth.getSession()).data?.session?.access_token;

      const res = await fetch("https://nugens-platform-production.up.railway.app/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          message: `Create a detailed career roadmap from "${form.currentRole}" to "${form.targetRole}" in ${form.timeline}. Key skills: ${form.skills || "general"}`,
          mode: "ROADMAP",
          history: [],
        }),
      });

      const text = await res.text();
      const clean = text.replace(/data: /g, "").replace(/\n\n/g, "\n").slice(0, 6500);
      setRoadmap(clean || "Roadmap generated successfully.");

      if (profile?.id) {
        await supabase.from("saved_artifacts").insert({
          user_id: profile.id,
          type: "roadmap",
          title: `Roadmap: ${form.currentRole} → ${form.targetRole}`,
          content_md: clean,
        }).catch(() => {});
      }
      setStep("result");
    } catch (e) {
      alert("Generation failed: " + e.message);
      setStep("clarify");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setStep("clarify"); setRoadmap(""); };

  // Uses /api/gene/roadmap-pdf — a roadmap-specific layout (phase banners,
  // milestones) rather than the resume PDF generator, which was the bug
  // flagged earlier ("Save as PDF generates as resume instead of roadmap").
  const downloadPdf = async () => {
    setPdfLoading(true);
    setPdfError("");
    try {
      const token = (await supabase.auth.getSession()).data?.session?.access_token;
      const res = await fetch("https://nugens-platform-production.up.railway.app/api/gene/roadmap-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ content: roadmap, title: `Roadmap: ${form.currentRole} → ${form.targetRole}` }),
      });
      const data = await res.json();
      if (!res.ok || !data.pdf_url) throw new Error(data.error || "PDF generation failed");
      window.open(`https://nugens-platform-production.up.railway.app${data.pdf_url}`, "_blank");
    } catch (e) {
      setPdfError(e.message || "Couldn't generate PDF. Please try again.");
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, padding: "32px 40px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: PINK, letterSpacing: "0.08em" }}>GEN-E</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111", margin: "4px 0 6px" }}>Career Roadmap</h1>
          <p style={{ color: "#666", fontSize: 14 }}>Get a clear, phase-by-phase plan from where you are to where you want to be.</p>
        </div>

        {step === "clarify" && (
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 28, maxWidth: 620 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 18, color: "#111" }}>Tell us about your career move</div>
            <div style={{ display: "grid", gap: 16 }}>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>Current Role</label>
                <input value={form.currentRole} onChange={e => updateField("currentRole", e.target.value)} placeholder="e.g. Frontend Developer" style={{ width: "100%", padding: "11px 14px", border: `1.5px solid ${BORDER}`, borderRadius: 10, fontSize: 14 }} /></div>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>Target Role</label>
                <input value={form.targetRole} onChange={e => updateField("targetRole", e.target.value)} placeholder="e.g. Product Manager" style={{ width: "100%", padding: "11px 14px", border: `1.5px solid ${BORDER}`, borderRadius: 10, fontSize: 14 }} /></div>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>Timeline</label>
                <select value={form.timeline} onChange={e => updateField("timeline", e.target.value)} style={{ width: "100%", padding: "11px 14px", border: `1.5px solid ${BORDER}`, borderRadius: 10, fontSize: 14 }}>
                  {["3 months","6 months","12 months","18 months","2 years"].map(t => <option key={t}>{t}</option>)}
                </select></div>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>Key Skills (optional)</label>
                <input value={form.skills} onChange={e => updateField("skills", e.target.value)} placeholder="React, Leadership..." style={{ width: "100%", padding: "11px 14px", border: `1.5px solid ${BORDER}`, borderRadius: 10, fontSize: 14 }} /></div>
            </div>
            <button onClick={generateRoadmap} disabled={loading || !form.currentRole || !form.targetRole} style={{ marginTop: 24, width: "100%", padding: "14px 0", background: loading ? "#f0d0d8" : PINK, color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: loading || !form.currentRole || !form.targetRole ? "not-allowed" : "pointer" }}>
              {loading ? "Generating Roadmap..." : "Generate My Career Roadmap →"}
            </button>
          </div>
        )}

        {step === "generating" && <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 48, textAlign: "center" }}><div style={{ fontSize: 15, color: "#555" }}>Building your personalized roadmap...</div></div>}

        {step === "result" && roadmap && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
              <div><div style={{ fontSize: 13, fontWeight: 700, color: PINK }}>YOUR ROADMAP</div><div style={{ fontSize: 18, fontWeight: 700, color: "#111" }}>{form.currentRole} → {form.targetRole}</div></div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={downloadPdf} disabled={pdfLoading} style={{ padding: "9px 18px", background: pdfLoading ? "#f0d0d8" : PINK, color: "#fff", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: pdfLoading ? "not-allowed" : "pointer" }}>
                  {pdfLoading ? "Generating…" : "⬇ Download PDF"}
                </button>
                <button onClick={() => { setStep("clarify"); setRoadmap(""); }} style={{ padding: "9px 18px", background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Start Over</button>
              </div>
            </div>
            {pdfError && <div style={{ fontSize: 12, color: "#dc2626", marginBottom: 12 }}>{pdfError}</div>}
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 28, whiteSpace: "pre-wrap", lineHeight: 1.75, fontSize: 14.5, color: "#222" }}>{roadmap}</div>
            <div style={{ marginTop: 12, fontSize: 12, color: "#888", textAlign: "center" }}>Saved to Vault</div>
          </div>
        )}
      </div>
    </div>
  );
}
