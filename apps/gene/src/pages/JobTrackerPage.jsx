import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const PINK = "#e8185d";
const API  = import.meta.env.VITE_GEN_E_API_URL || "https://gene-backend-al5h.onrender.com";

const COLUMNS = [
  { id:"applied",   label:"Applied",   emoji:"📤", color:"#3b82f6", bg:"#eff6ff", border:"#bfdbfe" },
  { id:"interview", label:"Interview", emoji:"🎯", color:"#8b5cf6", bg:"#f5f3ff", border:"#ddd6fe" },
  { id:"offer",     label:"Offer",     emoji:"🎉", color:"#10b981", bg:"#f0fdf4", border:"#bbf7d0" },
  { id:"rejected",  label:"Rejected",  emoji:"❌", color:"#ef4444", bg:"#fff5f5", border:"#fecaca" },
];

const STATUS_OPTIONS = COLUMNS.map(c => ({ value:c.id, label:`${c.emoji} ${c.label}` }));

function AddJobModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    company:"", role:"", url:"", status:"applied",
    notes:"", applied_date: new Date().toISOString().split("T")[0]
  });
  const [loading, setLoading] = useState(false);
  const [urlParsed, setUrlParsed] = useState(false);

  const parseUrl = (url) => {
    try {
      const host = new URL(url).hostname.replace(/^www\./, "");
      const brand = host.split(".")[0];
      const company = brand.charAt(0).toUpperCase() + brand.slice(1);
      setForm(f => ({ ...f, company: f.company || company }));
      setUrlParsed(true);
    } catch {}
  };

  const handleSave = async () => {
    if (!form.company || !form.role) return;
    setLoading(true);
    await onAdd(form);
    setLoading(false);
  };

  const inp = {
    width:"100%", padding:"9px 12px", border:"1.5px solid #e5e7eb",
    borderRadius:8, fontSize:13, outline:"none", fontFamily:"inherit",
    boxSizing:"border-box", transition:"border 0.15s",
  };
  const focus = e => e.target.style.borderColor = PINK;
  const blur  = e => e.target.style.borderColor = "#e5e7eb";

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:900,
      display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:"#fff",borderRadius:16,padding:"28px 24px",
        maxWidth:400,width:"100%",boxShadow:"0 24px 80px rgba(0,0,0,0.18)" }}>
        <div style={{ fontWeight:800,fontSize:17,color:"#111",marginBottom:20 }}>
          ➕ Add Application
        </div>

        <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
          <div>
            <label style={{ fontSize:11.5,fontWeight:600,color:"#555",display:"block",marginBottom:4 }}>
              Job URL (optional — auto-fills company)
            </label>
            <input value={form.url}
              onChange={e=>{ setForm(f=>({...f,url:e.target.value})); parseUrl(e.target.value); }}
              placeholder="https://careers.company.com/role"
              style={inp} onFocus={focus} onBlur={blur} />
            {urlParsed && <div style={{fontSize:11,color:"#10b981",marginTop:3}}>✓ Company auto-filled from URL</div>}
          </div>

          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
            <div>
              <label style={{ fontSize:11.5,fontWeight:600,color:"#555",display:"block",marginBottom:4 }}>
                Company *
              </label>
              <input value={form.company} onChange={e=>setForm(f=>({...f,company:e.target.value}))}
                placeholder="e.g. Google" style={inp} onFocus={focus} onBlur={blur} />
            </div>
            <div>
              <label style={{ fontSize:11.5,fontWeight:600,color:"#555",display:"block",marginBottom:4 }}>
                Role *
              </label>
              <input value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}
                placeholder="e.g. SWE Intern" style={inp} onFocus={focus} onBlur={blur} />
            </div>
          </div>

          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
            <div>
              <label style={{ fontSize:11.5,fontWeight:600,color:"#555",display:"block",marginBottom:4 }}>
                Status
              </label>
              <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}
                style={{...inp, cursor:"pointer", background:"#fff"}}>
                {STATUS_OPTIONS.map(o=>(
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11.5,fontWeight:600,color:"#555",display:"block",marginBottom:4 }}>
                Applied Date
              </label>
              <input type="date" value={form.applied_date}
                onChange={e=>setForm(f=>({...f,applied_date:e.target.value}))}
                style={inp} onFocus={focus} onBlur={blur} />
            </div>
          </div>

          <div>
            <label style={{ fontSize:11.5,fontWeight:600,color:"#555",display:"block",marginBottom:4 }}>
              Notes (optional)
            </label>
            <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}
              placeholder="Referral, interview date, contact name…"
              rows={2}
              style={{...inp, resize:"vertical", lineHeight:1.6}} onFocus={focus} onBlur={blur} />
          </div>
        </div>

        <div style={{ display:"flex",gap:10,marginTop:20 }}>
          <button onClick={onClose}
            style={{ flex:1,padding:"10px",background:"#f5f5f5",border:"none",
              borderRadius:9,fontWeight:600,fontSize:13,color:"#888",cursor:"pointer" }}>
            Cancel
          </button>
          <button onClick={handleSave}
            disabled={!form.company || !form.role || loading}
            style={{ flex:2,padding:"10px",background:PINK,border:"none",
              borderRadius:9,fontWeight:700,fontSize:13,color:"#fff",
              cursor: (!form.company || !form.role) ? "not-allowed" : "pointer",
              opacity: (!form.company || !form.role) ? 0.5 : 1 }}>
            {loading ? "Adding…" : "Add Application →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function JobCard({ job, col, onStatusChange, onDelete, onEdit }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const fmt = (iso) => new Date(iso).toLocaleDateString("en-IN",{ day:"numeric",month:"short" });

  return (
    <div style={{ background:"#fff", borderRadius:10, padding:"12px 14px",
      border:"1.5px solid #f0f0f0", position:"relative",
      boxShadow:"0 1px 4px rgba(0,0,0,0.04)", transition:"all 0.12s" }}
      onMouseEnter={e=>{ e.currentTarget.style.borderColor=col.border; e.currentTarget.style.boxShadow=`0 4px 14px ${col.color}12`; }}
      onMouseLeave={e=>{ e.currentTarget.style.borderColor="#f0f0f0"; e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.04)"; }}>

      {/* Company + Role */}
      <div style={{ fontWeight:700,fontSize:13,color:"#111",marginBottom:2,
        paddingRight:24,lineHeight:1.3 }}>
        {job.company}
      </div>
      <div style={{ fontSize:12,color:"#666",marginBottom:8 }}>{job.role}</div>

      {/* Meta */}
      <div style={{ display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:8 }}>
        {job.url && (
          <a href={job.url} target="_blank" rel="noreferrer"
            style={{ fontSize:10.5,color:"#3b82f6",textDecoration:"none",
              background:"#eff6ff",padding:"2px 7px",borderRadius:4 }}>
            🔗 View Job
          </a>
        )}
        <span style={{ fontSize:10.5,color:"#aaa" }}>
          {fmt(job.applied_date || job.created_at)}
        </span>
      </div>

      {/* Notes */}
      {job.notes && (
        <div style={{ fontSize:11.5,color:"#888",background:"#f9f9f9",
          borderRadius:6,padding:"5px 8px",lineHeight:1.5 }}>
          {job.notes.length > 80 ? job.notes.slice(0,80) + "…" : job.notes}
        </div>
      )}

      {/* Move to status buttons */}
      <div style={{ display:"flex",gap:4,marginTop:10,flexWrap:"wrap" }}>
        {COLUMNS.filter(c=>c.id !== job.status).map(c => (
          <button key={c.id}
            onClick={() => onStatusChange(job.id, c.id)}
            style={{ fontSize:10,padding:"2px 7px",borderRadius:4,
              border:`1px solid ${c.border}`,background:c.bg,
              color:c.color,cursor:"pointer",fontWeight:600,transition:"all 0.1s" }}
            title={`Move to ${c.label}`}>
            → {c.label}
          </button>
        ))}
      </div>

      {/* Menu button */}
      <button onClick={e=>{ e.stopPropagation(); setMenuOpen(o=>!o); }}
        style={{ position:"absolute",top:10,right:10,background:"none",border:"none",
          cursor:"pointer",fontSize:14,color:"#ccc",padding:"2px 4px",borderRadius:4,
          lineHeight:1 }}>
        ⋮
      </button>

      {menuOpen && (
        <>
          <div onClick={()=>setMenuOpen(false)}
            style={{ position:"fixed",inset:0,zIndex:98 }} />
          <div style={{ position:"absolute",top:28,right:8,background:"#fff",
            border:"1px solid #f0f0f0",borderRadius:9,boxShadow:"0 8px 24px rgba(0,0,0,0.12)",
            zIndex:99,overflow:"hidden",minWidth:120 }}>
            <button onClick={()=>{ onEdit(job); setMenuOpen(false); }}
              style={{ width:"100%",padding:"9px 14px",background:"none",border:"none",
                textAlign:"left",fontSize:12.5,cursor:"pointer",color:"#333",fontWeight:500 }}
              onMouseEnter={e=>e.target.style.background="#f9f9f9"}
              onMouseLeave={e=>e.target.style.background="none"}>
              ✎ Edit
            </button>
            <button onClick={()=>{ onDelete(job.id); setMenuOpen(false); }}
              style={{ width:"100%",padding:"9px 14px",background:"none",border:"none",
                textAlign:"left",fontSize:12.5,cursor:"pointer",color:"#ef4444",fontWeight:500 }}
              onMouseEnter={e=>e.target.style.background="#fff5f5"}
              onMouseLeave={e=>e.target.style.background="none"}>
              🗑 Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function JobTrackerPage() {
  const nav = useNavigate();
  const [jobs,      setJobs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [adding,    setAdding]    = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [error,     setError]     = useState("");

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  };

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    const token = await getToken();
    if (!token) { nav("/auth"); return; }
    try {
      const res  = await fetch(`${API}/api/jobs`, { headers:{ Authorization:`Bearer ${token}` } });
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch { setError("Failed to load jobs."); }
    finally  { setLoading(false); }
  }, [nav]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { nav("/auth"); return; }
      fetchJobs();
    });
  }, [nav, fetchJobs]);

  const addJob = async (form) => {
    const token = await getToken();
    const res = await fetch(`${API}/api/jobs`, {
      method:"POST",
      headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
      body: JSON.stringify(form),
    });
    if (res.ok) { setAdding(false); fetchJobs(); }
    else { const d = await res.json(); setError((d.detail || d.error || "Failed to add job") + (d.code ? ` [${d.code}]` : "")); }
  };

  const updateStatus = async (id, status) => {
    const token = await getToken();
    await fetch(`${API}/api/jobs/${id}`, {
      method:"PATCH",
      headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    setJobs(prev => prev.map(j => j.id === id ? {...j, status} : j));
  };

  const deleteJob = async (id) => {
    const token = await getToken();
    await fetch(`${API}/api/jobs/${id}`, {
      method:"DELETE", headers:{ Authorization:`Bearer ${token}` },
    });
    setJobs(prev => prev.filter(j => j.id !== id));
  };

  const saveEdit = async (form) => {
    const token = await getToken();
    await fetch(`${API}/api/jobs/${form.id}`, {
      method:"PATCH",
      headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
      body: JSON.stringify(form),
    });
    setEditing(null);
    fetchJobs();
  };

  const byStatus = (status) => jobs.filter(j => j.status === status);

  const stats = {
    total:     jobs.length,
    interview: byStatus("interview").length,
    offer:     byStatus("offer").length,
    rate:      jobs.length ? Math.round((byStatus("offer").length / jobs.length) * 100) : 0,
  };

  if (loading) return (
    <div style={{ minHeight:"100vh",display:"flex",alignItems:"center",
      justifyContent:"center",fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:28,marginBottom:8 }}>📊</div>
        <div style={{ color:"#aaa",fontSize:13 }}>Loading Job Tracker…</div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'DM Sans',sans-serif; background:#f9fafb; }
        .col-scroll { max-height:calc(100vh - 260px); overflow-y:auto; padding-bottom:16px; }
        .col-scroll::-webkit-scrollbar { width:4px; }
        .col-scroll::-webkit-scrollbar-thumb { background:#e5e7eb; border-radius:4px; }
      `}</style>

      {adding && <AddJobModal onClose={()=>setAdding(false)} onAdd={addJob} />}
      {editing && <AddJobModal
        onClose={()=>setEditing(null)}
        onAdd={data=>saveEdit({...data, id:editing.id})}
      />}

      <div style={{ minHeight:"100vh",background:"#f9fafb" }}>

        {/* ── Nav ── */}
        <div style={{ background:"#fff",borderBottom:"1px solid #f0f0f0",
          padding:"14px 24px",display:"flex",alignItems:"center",
          justifyContent:"space-between",position:"sticky",top:0,zIndex:50 }}>
          <div style={{ display:"flex",alignItems:"center",gap:12 }}>
            <button onClick={()=>nav("/gen-e")}
              style={{ background:"none",border:"none",cursor:"pointer",
                fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,
                fontSize:15,color:PINK,letterSpacing:"-0.03em" }}>
              ← GEN-E
            </button>
            <span style={{ color:"#e5e7eb" }}>|</span>
            <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,
              fontSize:15,color:"#111" }}>📊 Job Tracker</span>
          </div>
          <button onClick={()=>setAdding(true)}
            style={{ background:PINK,color:"#fff",border:"none",borderRadius:8,
              padding:"7px 14px",fontSize:12,fontWeight:700,cursor:"pointer" }}>
            + Add Application
          </button>
        </div>

        <div style={{ maxWidth:1200,margin:"0 auto",padding:"20px" }}>

          {error && (
            <div style={{ background:"#fff5f8",border:"1px solid #fcc",borderRadius:8,
              padding:"10px 14px",fontSize:13,color:PINK,marginBottom:16 }}>
              ⚠️ {error}
            </div>
          )}

          {/* ── Stats Bar ── */}
          {jobs.length > 0 && (
            <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20 }}>
              {[
                { label:"Total Applied",    value:stats.total,     color:"#3b82f6", bg:"#eff6ff" },
                { label:"Interviews",       value:stats.interview, color:"#8b5cf6", bg:"#f5f3ff" },
                { label:"Offers",           value:stats.offer,     color:"#10b981", bg:"#f0fdf4" },
                { label:"Success Rate",     value:`${stats.rate}%`, color:"#f59e0b", bg:"#fffbeb" },
              ].map(s => (
                <div key={s.label} style={{ background:s.bg,borderRadius:10,padding:"14px 16px",
                  border:`1px solid ${s.color}22` }}>
                  <div style={{ fontSize:22,fontWeight:800,color:s.color }}>{s.value}</div>
                  <div style={{ fontSize:11.5,color:"#888",marginTop:2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── Kanban Board ── */}
          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14 }}>
            {COLUMNS.map(col => {
              const colJobs = byStatus(col.id);
              return (
                <div key={col.id}>
                  {/* Column header */}
                  <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",
                    marginBottom:10,padding:"0 2px" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                      <span style={{ fontSize:14 }}>{col.emoji}</span>
                      <span style={{ fontWeight:700,fontSize:13,color:"#111" }}>{col.label}</span>
                    </div>
                    <span style={{ background:col.bg,color:col.color,fontWeight:700,
                      fontSize:11,padding:"2px 8px",borderRadius:20,border:`1px solid ${col.border}` }}>
                      {colJobs.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="col-scroll" style={{ display:"flex",flexDirection:"column",gap:8 }}>
                    {colJobs.length === 0 ? (
                      <div style={{ borderRadius:10,border:`2px dashed ${col.border}`,
                        padding:"24px 16px",textAlign:"center",background:col.bg }}>
                        <div style={{ fontSize:20,marginBottom:6 }}>{col.emoji}</div>
                        <div style={{ fontSize:11.5,color:"#aaa" }}>No {col.label.toLowerCase()} yet</div>
                      </div>
                    ) : colJobs.map(job => (
                      <JobCard key={job.id} job={job} col={col}
                        onStatusChange={updateStatus}
                        onDelete={deleteJob}
                        onEdit={setEditing} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Empty state ── */}
          {jobs.length === 0 && (
            <div style={{ gridColumn:"1/-1",textAlign:"center",padding:"60px 0" }}>
              <div style={{ fontSize:48,marginBottom:16 }}>📋</div>
              <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,
                fontSize:20,color:"#111",marginBottom:8 }}>
                Start tracking your applications
              </div>
              <div style={{ fontSize:14,color:"#888",marginBottom:24,maxWidth:380,margin:"0 auto 24px" }}>
                Add every job you apply for. Move cards across columns as your status updates.
              </div>
              <button onClick={()=>setAdding(true)}
                style={{ background:PINK,color:"#fff",border:"none",borderRadius:10,
                  padding:"12px 24px",fontSize:14,fontWeight:700,cursor:"pointer" }}>
                + Add First Application
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
