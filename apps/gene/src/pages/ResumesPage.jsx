import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const PINK   = "#e8185d";
const API    = import.meta.env.VITE_GEN_E_API_URL || "https://nugens-platform.onrender.com";

/* ── Simple markdown → readable text renderer ── */
function ResumePreview({ content }) {
  const lines = (content || "").split("\n");
  return (
    <div style={{ fontSize:12.5, lineHeight:1.8, color:"#333" }}>
      {lines.map((line, i) => {
        const clean = line.replace(/\*\*/g, "").trim();
        if (!clean) return <div key={i} style={{ height:6 }} />;
        if (line.startsWith("## ")) return (
          <div key={i} style={{ fontWeight:800, fontSize:11, color:PINK,
            textTransform:"uppercase", letterSpacing:"0.07em", marginTop:12, marginBottom:2,
            paddingBottom:3, borderBottom:"1px solid #fce7ef" }}>
            {clean}
          </div>
        );
        if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) return (
          <div key={i} style={{ paddingLeft:12, color:"#555", fontSize:12 }}>
            • {clean.replace(/^[-•]\s*/, "")}
          </div>
        );
        return <div key={i} style={{ fontSize:12.5 }}>{clean}</div>;
      })}
    </div>
  );
}

export default function ResumesPage() {
  const nav = useNavigate();
  const [resumes,   setResumes]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState(null); // full resume object
  const [renaming,  setRenaming]  = useState(null); // { id, title }
  const [deleting,  setDeleting]  = useState(null); // id
  const [error,     setError]     = useState("");
  const [profile,   setProfile]   = useState(null);

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  };

  const fetchResumes = useCallback(async () => {
    setLoading(true);
    const token = await getToken();
    if (!token) { nav("/auth"); return; }
    try {
      const res  = await fetch(`${API}/api/resumes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setResumes(data.resumes || []);
    } catch { setError("Failed to load resumes."); }
    finally  { setLoading(false); }
  }, [nav]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { nav("/auth"); return; }
      const { data } = await supabase.from("profiles").select("plan,full_name").eq("id", session.user.id).single();
      setProfile(data);
      if (data?.plan === "free") { nav("/pricing"); return; }
      fetchResumes();
    });
  }, [nav, fetchResumes]);

  const openResume = async (id) => {
    const token = await getToken();
    const res   = await fetch(`${API}/api/resumes/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data  = await res.json();
    if (data.resume) setSelected(data.resume);
  };

  const renameResume = async () => {
    if (!renaming) return;
    const token = await getToken();
    await fetch(`${API}/api/resumes/${renaming.id}`, {
      method: "PATCH",
      headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
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
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `${resume.title}.md`; a.click();
    URL.revokeObjectURL(url);
  };

  const copyToChat = (resume) => {
    nav("/gen-e", { state: { prefillResume: resume.content_md } });
  };

  const fmt = (iso) => new Date(iso).toLocaleDateString("en-IN",
    { day:"numeric", month:"short", year:"numeric" });

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center",
      justifyContent:"center", fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:28, marginBottom:8 }}>📄</div>
        <div style={{ color:"#aaa", fontSize:13 }}>Loading your Resume Vault…</div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'DM Sans',sans-serif; background:#f9fafb; }
        .resume-card { background:#fff; border:1.5px solid #f0f0f0; border-radius:12px;
          padding:16px; cursor:pointer; transition:all 0.15s; }
        .resume-card:hover { border-color:${PINK}44; box-shadow:0 4px 16px ${PINK}10; transform:translateY(-2px); }
        .resume-card.active { border-color:${PINK}; box-shadow:0 4px 20px ${PINK}18; }
        .action-btn { padding:6px 12px; border-radius:7px; border:1px solid #f0f0f0;
          background:#fff; cursor:pointer; font-size:11.5px; font-weight:600;
          color:#555; transition:all 0.12s; font-family:'DM Sans',sans-serif; }
        .action-btn:hover { border-color:${PINK}; color:${PINK}; background:#fff5f8; }
        .action-btn.danger:hover { border-color:#ef4444; color:#ef4444; background:#fff5f5; }
      `}</style>

      {/* ── Confirm delete overlay ── */}
      {deleting && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:900,
          display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}
          onClick={e=>{ if(e.target===e.currentTarget) setDeleting(null); }}>
          <div style={{ background:"#fff",borderRadius:14,padding:"28px 24px",maxWidth:340,
            width:"100%",textAlign:"center",boxShadow:"0 24px 80px rgba(0,0,0,0.18)" }}>
            <div style={{ fontSize:28, marginBottom:8 }}>🗑️</div>
            <div style={{ fontWeight:800,fontSize:16,color:"#111",marginBottom:8 }}>Delete this resume?</div>
            <div style={{ fontSize:13,color:"#888",marginBottom:24 }}>This can't be undone.</div>
            <div style={{ display:"flex",gap:10 }}>
              <button onClick={()=>setDeleting(null)}
                style={{ flex:1,padding:"10px",background:"#f5f5f5",border:"none",
                  borderRadius:9,fontWeight:600,fontSize:13,color:"#888",cursor:"pointer" }}>
                Cancel
              </button>
              <button onClick={()=>deleteResume(deleting)}
                style={{ flex:1,padding:"10px",background:"#ef4444",border:"none",
                  borderRadius:9,fontWeight:700,fontSize:13,color:"#fff",cursor:"pointer" }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ minHeight:"100vh", background:"#f9fafb" }}>

        {/* ── Nav ── */}
        <div style={{ background:"#fff", borderBottom:"1px solid #f0f0f0",
          padding:"14px 24px", display:"flex", alignItems:"center",
          justifyContent:"space-between", position:"sticky", top:0, zIndex:50 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <button onClick={()=>nav("/gen-e")}
              style={{ background:"none",border:"none",cursor:"pointer",
                fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,
                fontSize:15,color:PINK,letterSpacing:"-0.03em" }}>
              ← GEN-E
            </button>
            <span style={{ color:"#e5e7eb" }}>|</span>
            <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,
              fontSize:15,color:"#111" }}>📄 Resume Vault</span>
          </div>
          <button onClick={()=>nav("/gen-e")}
            style={{ background:PINK,color:"#fff",border:"none",borderRadius:8,
              padding:"7px 14px",fontSize:12,fontWeight:700,cursor:"pointer" }}>
            + New Resume
          </button>
        </div>

        <div style={{ maxWidth:1100, margin:"0 auto", padding:"24px 20px",
          display:"grid", gridTemplateColumns: selected ? "300px 1fr" : "1fr",
          gap:20, alignItems:"start" }}>

          {/* ── Left: Resume List ── */}
          <div>
            {error && (
              <div style={{ background:"#fff5f8",border:"1px solid #fcc",borderRadius:8,
                padding:"10px 14px",fontSize:13,color:PINK,marginBottom:16 }}>
                ⚠️ {error}
              </div>
            )}

            {resumes.length === 0 ? (
              <div style={{ background:"#fff",borderRadius:12,padding:"40px 24px",
                textAlign:"center",border:"1.5px dashed #e5e7eb" }}>
                <div style={{ fontSize:36,marginBottom:12 }}>📭</div>
                <div style={{ fontWeight:700,fontSize:15,color:"#111",marginBottom:8 }}>
                  No resumes saved yet
                </div>
                <div style={{ fontSize:13,color:"#888",marginBottom:20 }}>
                  Generate a resume in chat, then click "💾 Save to Vault"
                </div>
                <button onClick={()=>nav("/gen-e")}
                  style={{ background:PINK,color:"#fff",border:"none",borderRadius:9,
                    padding:"10px 20px",fontSize:13,fontWeight:700,cursor:"pointer" }}>
                  Build a Resume →
                </button>
              </div>
            ) : (
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                <div style={{ fontSize:12,color:"#aaa",marginBottom:4 }}>
                  {resumes.length} resume{resumes.length !== 1 ? "s" : ""} saved
                </div>
                {resumes.map(r => (
                  <div key={r.id}
                    className={`resume-card ${selected?.id === r.id ? "active" : ""}`}
                    onClick={()=>openResume(r.id)}>

                    {renaming?.id === r.id ? (
                      <div onClick={e=>e.stopPropagation()}
                        style={{ display:"flex",gap:6,alignItems:"center" }}>
                        <input
                          value={renaming.title}
                          onChange={e=>setRenaming({...renaming, title:e.target.value})}
                          onKeyDown={e=>{ if(e.key==="Enter") renameResume(); if(e.key==="Escape") setRenaming(null); }}
                          autoFocus
                          style={{ flex:1,padding:"5px 8px",border:`1.5px solid ${PINK}`,
                            borderRadius:6,fontSize:12,outline:"none" }}
                        />
                        <button onClick={renameResume}
                          style={{ padding:"5px 10px",background:PINK,color:"#fff",
                            border:"none",borderRadius:6,fontSize:11,cursor:"pointer",fontWeight:700 }}>
                          Save
                        </button>
                        <button onClick={()=>setRenaming(null)}
                          style={{ padding:"5px 8px",background:"#f5f5f5",border:"none",
                            borderRadius:6,fontSize:11,cursor:"pointer" }}>
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontWeight:700,fontSize:13.5,color:"#111",
                          marginBottom:4,lineHeight:1.3 }}>
                          {r.title}
                        </div>
                        {(r.target_role || r.target_company) && (
                          <div style={{ fontSize:11.5,color:"#888",marginBottom:6 }}>
                            {[r.target_role, r.target_company].filter(Boolean).join(" @ ")}
                          </div>
                        )}
                        <div style={{ display:"flex",alignItems:"center",
                          justifyContent:"space-between",marginTop:8 }}>
                          <span style={{ fontSize:10.5,color:"#ccc" }}>
                            {fmt(r.updated_at)}
                            {r.word_count ? ` · ${r.word_count} words` : ""}
                          </span>
                          <div style={{ display:"flex",gap:4 }} onClick={e=>e.stopPropagation()}>
                            <button className="action-btn"
                              onClick={()=>setRenaming({id:r.id,title:r.title})}>
                              ✎
                            </button>
                            <button className="action-btn danger"
                              onClick={()=>setDeleting(r.id)}>
                              🗑
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: Preview Panel ── */}
          {selected && (
            <div style={{ background:"#fff",borderRadius:14,border:"1.5px solid #f0f0f0",
              overflow:"hidden",position:"sticky",top:80 }}>
              {/* Header */}
              <div style={{ padding:"16px 20px",borderBottom:"1px solid #f5f5f5",
                display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                <div>
                  <div style={{ fontWeight:700,fontSize:14,color:"#111" }}>{selected.title}</div>
                  {selected.target_role && (
                    <div style={{ fontSize:11.5,color:"#aaa",marginTop:2 }}>
                      {selected.target_role}{selected.target_company ? ` @ ${selected.target_company}` : ""}
                    </div>
                  )}
                </div>
                <button onClick={()=>setSelected(null)}
                  style={{ background:"none",border:"none",cursor:"pointer",
                    fontSize:16,color:"#ccc",padding:"4px" }}>✕</button>
              </div>

              {/* Action bar */}
              <div style={{ padding:"10px 20px",borderBottom:"1px solid #f5f5f5",
                display:"flex",gap:8,flexWrap:"wrap" }}>
                <button className="action-btn" onClick={()=>copyToChat(selected)}>
                  💬 Continue in Chat
                </button>
                <button className="action-btn" onClick={()=>downloadMd(selected)}>
                  ⬇ Download .md
                </button>
                {selected.pdf_path && (
                  <a href={`${API}${selected.pdf_path}`} target="_blank" rel="noreferrer">
                    <button className="action-btn">📄 Download PDF</button>
                  </a>
                )}
              </div>

              {/* Content */}
              <div style={{ padding:"20px",maxHeight:"70vh",overflowY:"auto" }}>
                <ResumePreview content={selected.content_md} />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
