import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const PINK = "#e8185d";
const API = import.meta.env.VITE_GEN_E_API_URL || "https://nugens-platform-production.up.railway.app";

/* ── Clean ATS-friendly Resume Preview ── */
function ResumePreview({ content }) {
  if (!content) return null;

  const lines = content.split("\n");
  let currentSection = "";

  return (
    <div style={{ fontSize: "14px", lineHeight: "1.75", color: "#222", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {lines.map((line, index) => {
        const trimmed = line.trim();

        // Section headers
        if (trimmed.startsWith("## ")) {
          currentSection = trimmed.replace("## ", "").trim();
          return (
            <div
              key={index}
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: PINK,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginTop: index === 0 ? 0 : 22,
                marginBottom: 8,
                paddingBottom: 4,
                borderBottom: "1px solid #fce7ef",
              }}
            >
              {currentSection}
            </div>
          );
        }

        // Bullet points
        if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
          return (
            <div key={index} style={{ paddingLeft: 16, marginBottom: 4, color: "#444" }}>
              • {trimmed.replace(/^[-•]\s*/, "")}
            </div>
          );
        }

        // Empty line
        if (!trimmed) {
          return <div key={index} style={{ height: 8 }} />;
        }

        // Regular text
        return (
          <div key={index} style={{ marginBottom: 4, color: "#333" }}>
            {trimmed}
          </div>
        );
      })}
    </div>
  );
}

export default function ResumesPage() {
  const nav = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [renaming, setRenaming] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  };

  const fetchResumes = useCallback(async () => {
    setLoading(true);
    const token = await getToken();
    if (!token) { nav("/auth"); return; }

    try {
      const res = await fetch(`${API}/api/resumes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setResumes(data.resumes || []);
    } catch {
      setError("Failed to load resumes.");
    } finally {
      setLoading(false);
    }
  }, [nav]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { nav("/auth"); return; }

      const { data } = await supabase
        .from("profiles")
        .select("plan, full_name")
        .eq("id", session.user.id)
        .single();

      setProfile(data);

      if (data?.plan === "free") {
        nav("/pricing");
        return;
      }
      fetchResumes();
    });
  }, [nav, fetchResumes]);

  const openResume = async (id) => {
    const token = await getToken();
    const res = await fetch(`${API}/api/resumes/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.resume) setSelected(data.resume);
  };

  const renameResume = async () => {
    if (!renaming) return;
    const token = await getToken();
    await fetch(`${API}/api/resumes/${renaming.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: renaming.title }),
    });
    setRenaming(null);
    fetchResumes();
  };

  const deleteResume = async (id) => {
    const token = await getToken();
    await fetch(`${API}/api/resumes/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setDeleting(null);
    if (selected?.id === id) setSelected(null);
    fetchResumes();
  };

  const downloadMd = (resume) => {
    const blob = new Blob([resume.content_md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${resume.title}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = (resume) => {
    if (!resume.pdf_path) return;
    window.open(`${API}${resume.pdf_path}`, "_blank");
  };

  const copyToChat = (resume) => {
    nav("/gen-e", { state: { prefillResume: resume.content_md } });
  };

  const fmt = (iso) =>
    new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
          <div style={{ color: "#aaa", fontSize: 13 }}>Loading your Resume Vault…</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        body { font-family: 'DM Sans', sans-serif; background: #f9fafb; }
        .resume-card { background: #fff; border: 1.5px solid #f0f0f0; border-radius: 12px; padding: 16px; cursor: pointer; transition: all 0.15s; }
        .resume-card:hover { border-color: #e8185d44; box-shadow: 0 4px 16px #e8185d10; transform: translateY(-2px); }
        .resume-card.active { border-color: #e8185d; box-shadow: 0 4px 20px #e8185d18; }
        .action-btn { padding: 6px 14px; border-radius: 8px; border: 1px solid #e5e7eb; background: #fff; cursor: pointer; font-size: 12px; font-weight: 600; color: #555; transition: all 0.1s; }
        .action-btn:hover { border-color: #e8185d; color: #e8185d; background: #fff5f8; }
        .action-btn.danger:hover { border-color: #ef4444; color: #ef4444; background: #fff5f5; }
      `}</style>

      {/* Delete Confirmation Modal */}
      {deleting && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 900, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeleting(null); }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: "28px 24px", maxWidth: 340, width: "100%", textAlign: "center", boxShadow: "0 24px 80px rgba(0,0,0,0.18)" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🗑️</div>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#111", marginBottom: 8 }}>Delete this resume?</div>
            <div style={{ fontSize: 13, color: "#888", marginBottom: 24 }}>This can’t be undone.</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleting(null)} style={{ flex: 1, padding: "10px", background: "#f5f5f5", border: "none", borderRadius: 9, fontWeight: 600, fontSize: 13, color: "#888", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={() => deleteResume(deleting)} style={{ flex: 1, padding: "10px", background: "#ef4444", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 13, color: "#fff", cursor: "pointer" }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
        {/* Top Navigation */}
        <div style={{ background: "#fff", borderBottom: "1px solid #f0f0f0", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => nav("/gen-e")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 15, color: PINK, letterSpacing: "-0.03em" }}>
              ← GEN-E
            </button>
            <span style={{ color: "#e5e7eb" }}>|</span>
            <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 15, color: "#111" }}>📄 Resume Vault</span>
          </div>
          <button onClick={() => nav("/gen-e")} style={{ background: PINK, color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            + New Resume
          </button>
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px", display: "grid", gridTemplateColumns: selected ? "300px 1fr" : "1fr", gap: 20, alignItems: "start" }}>
          
          {/* Left Sidebar - Resume List */}
          <div>
            {error && (
              <div style={{ background: "#fff5f8", border: "1px solid #fcc", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: PINK, marginBottom: 16 }}>
                ⚠️ {error}
              </div>
            )}

            {resumes.length === 0 ? (
              <div style={{ background: "#fff", borderRadius: 12, padding: "40px 24px", textAlign: "center", border: "1.5px dashed #e5e7eb" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#111", marginBottom: 8 }}>No resumes saved yet</div>
                <div style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>Generate a resume in the builder or chat, then save it to your vault.</div>
                <button onClick={() => nav("/gen-e")} style={{ background: PINK, color: "#fff", border: "none", borderRadius: 9, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Build a Resume →
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 12, color: "#aaa", marginBottom: 4 }}>{resumes.length} resume{resumes.length !== 1 ? "s" : ""} saved</div>
                {resumes.map((r) => (
                  <div key={r.id} className={`resume-card ${selected?.id === r.id ? "active" : ""}`} onClick={() => openResume(r.id)}>
                    {renaming?.id === r.id ? (
                      <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <input
                          value={renaming.title}
                          onChange={(e) => setRenaming({ ...renaming, title: e.target.value })}
                          onKeyDown={(e) => { if (e.key === "Enter") renameResume(); if (e.key === "Escape") setRenaming(null); }}
                          autoFocus
                          style={{ flex: 1, padding: "5px 8px", border: `1.5px solid ${PINK}`, borderRadius: 6, fontSize: 12, outline: "none" }}
                        />
                        <button onClick={renameResume} style={{ padding: "5px 10px", background: PINK, color: "#fff", border: "none", borderRadius: 6, fontSize: 11, cursor: "pointer", fontWeight: 700 }}>Save</button>
                        <button onClick={() => setRenaming(null)} style={{ padding: "5px 8px", background: "#f5f5f5", border: "none", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>✕</button>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontWeight: 700, fontSize: 13.5, color: "#111", marginBottom: 4, lineHeight: 1.3 }}>{r.title}</div>
                        {(r.target_role || r.target_company) && (
                          <div style={{ fontSize: 11.5, color: "#888", marginBottom: 6 }}>
                            {[r.target_role, r.target_company].filter(Boolean).join(" @ ")}
                          </div>
                        )}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                          <span style={{ fontSize: 10.5, color: "#ccc" }}>
                            {fmt(r.updated_at)} {r.word_count ? `· ${r.word_count} words` : ""}
                          </span>
                          <div style={{ display: "flex", gap: 4 }} onClick={(e) => e.stopPropagation()}>
                            <button className="action-btn" onClick={() => setRenaming({ id: r.id, title: r.title })}>✎</button>
                            <button className="action-btn danger" onClick={() => setDeleting(r.id)}>🗑</button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Panel - Preview */}
          {selected && (
            <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #f0f0f0", overflow: "hidden", position: "sticky", top: 80 }}>
              {/* Header */}
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f5f5f5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>{selected.title}</div>
                  {selected.target_role && (
                    <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                      {selected.target_role}{selected.target_company ? ` @ ${selected.target_company}` : ""}
                    </div>
                  )}
                </div>
                <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#ccc", padding: "4px" }}>✕</button>
              </div>

              {/* Action Bar */}
              <div style={{ padding: "12px 20px", borderBottom: "1px solid #f5f5f5", display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="action-btn" onClick={() => copyToChat(selected)}>
                  💬 Continue in Chat
                </button>

                {selected.pdf_path && (
                  <button className="action-btn" onClick={() => downloadPdf(selected)} style={{ background: PINK, color: "#fff", border: "none" }}>
                    📄 Download PDF
                  </button>
                )}

                <button className="action-btn" onClick={() => downloadMd(selected)}>
                  ⬇ Download .md
                </button>
              </div>

              {/* Resume Content */}
              <div style={{ padding: "24px 28px", maxHeight: "72vh", overflowY: "auto", background: "#fafafa" }}>
                <ResumePreview content={selected.content_md} />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}