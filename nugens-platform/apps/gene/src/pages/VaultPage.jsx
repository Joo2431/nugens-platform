import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const PINK = "#e8185d";
const BG = "#f8f9fb";
const CARD = "#ffffff";
const BORDER = "#e8eaed";

export default function VaultPage({ profile }) {
  const [activeTab, setActiveTab] = useState("all");
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const tabs = [
    { key: "all", label: "All" },
    { key: "resume", label: "Resumes" },
    { key: "roadmap", label: "Roadmaps" },
    { key: "interview", label: "Interviews" },
    { key: "other", label: "Other" },
  ];

  const loadArtifacts = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const token = (await supabase.auth.getSession()).data?.session?.access_token;
      const url = activeTab === "all" 
        ? "https://nugens-platform-production.up.railway.app/api/artifacts" 
        : `https://nugens-platform-production.up.railway.app/api/artifacts?type=${activeTab}`;
      
      const res = await fetch(url, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const data = await res.json();
      setArtifacts(data.artifacts || []);
    } catch (e) {
      // Fallback to old resumes table for resume type
      if (activeTab === "resume" || activeTab === "all") {
        const { data } = await supabase.from("resumes").select("*").eq("user_id", profile.id).order("created_at", { ascending: false });
        setArtifacts(data || []);
      } else {
        setArtifacts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadArtifacts(); }, [activeTab, profile?.id]);

  const deleteArtifact = async (id) => {
    if (!confirm("Delete this item permanently?")) return;
    try {
      const token = (await supabase.auth.getSession()).data?.session?.access_token;
      await fetch(`https://nugens-platform-production.up.railway.app/api/artifacts/${id}`, {
        method: "DELETE",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
    } catch {}
    loadArtifacts();
    if (selected?.id === id) setSelected(null);
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, padding: "32px 40px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: PINK, letterSpacing: "0.08em" }}>GEN-E</div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111", margin: "4px 0 6px" }}>My Vault</h1>
            <p style={{ color: "#666", fontSize: 14 }}>All your saved work — resumes, roadmaps, interview transcripts. Unified & searchable.</p>
          </div>
          <button onClick={loadArtifacts} style={{ padding: "8px 16px", background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>⟳ Refresh</button>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              padding: "8px 18px", borderRadius: 999, fontSize: 13, fontWeight: 600,
              background: activeTab === t.key ? PINK : "#fff",
              color: activeTab === t.key ? "#fff" : "#555",
              border: activeTab === t.key ? "none" : `1px solid ${BORDER}`,
              cursor: "pointer"
            }}>{t.label}</button>
          ))}
        </div>

        {loading && <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Loading your vault…</div>}

        {!loading && artifacts.length === 0 && (
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 48, textAlign: "center", color: "#888" }}>
            No items yet in this folder.<br />Generate a resume, roadmap, or complete an interview to see them here.
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 380px" : "1fr", gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {artifacts.map((a, idx) => (
              <div key={idx} onClick={() => setSelected(a)} style={{
                background: CARD, border: `1px solid ${selected?.id === a.id ? PINK : BORDER}`, borderRadius: 14, padding: 18, cursor: "pointer",
                boxShadow: selected?.id === a.id ? `0 0 0 3px ${PINK}15` : "none"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>{a.title || a.role || "Untitled"}</div>
                    <div style={{ fontSize: 12, color: "#888", marginTop: 3 }}>{new Date(a.created_at || a.createdAt).toLocaleDateString()} · {a.type || "resume"}</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteArtifact(a.id); }} style={{ background: "none", border: "none", color: "#dc2626", fontSize: 18, cursor: "pointer" }}>×</button>
                </div>
              </div>
            ))}
          </div>

          {selected && (
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, position: "sticky", top: 24, maxHeight: "calc(100vh - 80px)", overflow: "auto" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: PINK, marginBottom: 6 }}>{selected.type?.toUpperCase() || "ARTIFACT"}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#111", marginBottom: 12 }}>{selected.title || "Details"}</div>
              <div style={{ fontSize: 13, color: "#555", whiteSpace: "pre-wrap", lineHeight: 1.7, background: "#fafafa", padding: 16, borderRadius: 10, border: `1px solid ${BORDER}` }}>
                {selected.content_md || selected.content || JSON.stringify(selected, null, 2).slice(0, 1200)}
              </div>
              <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                <button onClick={() => setSelected(null)} style={{ flex: 1, padding: "10px 0", background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 9, fontSize: 14, fontWeight: 600 }}>Close</button>
                <button onClick={() => deleteArtifact(selected.id)} style={{ flex: 1, padding: "10px 0", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 600 }}>Delete</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
