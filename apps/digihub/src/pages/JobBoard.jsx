import React, { useState, useEffect } from "react";
import { apiGet, apiPost, apiPatch, apiDelete } from "../lib/apiClient";

const BLUE   = "#0284c7";
const PINK   = "#e8185d";
const BG     = "#f8f9fb";
const CARD   = "#ffffff";
const BORDER = "#e8eaed";
const TEXT   = "#0a0a0a";
const MUTED  = "#6b7280";
const FAINT  = "#9ca3af";

const FILTERS = ["All","Full-time","Part-time","Contract","Remote","Bangalore","Mumbai","Delhi"];
const TYPE_OPTIONS = ["Full-time","Part-time","Contract"];

export default function JobBoard({ profile }) {
  const isBusiness = profile?.user_type === "business";

  const [jobs,      setJobs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search,    setSearch]    = useState("");
  const [filter,    setFilter]    = useState("All");
  const [selected,  setSelected]  = useState(null);
  const [appliedIds,setApplied]   = useState([]);
  const [savedIds,  setSaved]     = useState([]);
  const [showApply, setShowApply] = useState(false);
  const [coverLetter,setCover]    = useState("");
  const [applying,  setApplying]  = useState(false);
  const [applyErr,  setApplyErr]  = useState("");

  const [showPost,  setShowPost]  = useState(false);
  const [posting,   setPosting]   = useState(false);
  const [postErr,   setPostErr]   = useState("");
  const [form, setForm] = useState({ role:"", company: profile?.company_name || "", location:"Remote", type:"Full-time", salary:"", skills:"", description:"", urgent:false });

  const loadJobs = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const { jobs: data } = await apiGet("/api/digihub/jobs", search ? { search } : {});
      setJobs(data || []);
    } catch (e) {
      setLoadError(e.message || "Couldn't load jobs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadJobs(); }, []); // eslint-disable-line
  useEffect(() => {
    const t = setTimeout(loadJobs, 350); // debounce search
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line

  useEffect(() => {
    apiGet("/api/digihub/jobs/applied").then(d => setApplied(d.jobIds || [])).catch(() => {});
    apiGet("/api/digihub/jobs/saved").then(d => setSaved(d.jobIds || [])).catch(() => {});
  }, []);

  const filtered = jobs.filter(j => {
    const matchFilter = filter === "All" || j.type === filter || j.location === filter;
    return matchFilter;
  });

  const apply = async (jobId) => {
    setApplying(true);
    setApplyErr("");
    try {
      await apiPost(`/api/digihub/jobs/${jobId}/apply`, { cover_letter: coverLetter });
      setApplied(a => [...a, jobId]);
      setShowApply(false);
      setCover("");
    } catch (e) {
      setApplyErr(e.message || "Couldn't submit application. Please try again.");
    } finally {
      setApplying(false);
    }
  };

  const toggleSave = async (jobId) => {
    const isSaved = savedIds.includes(jobId);
    setSaved(s => isSaved ? s.filter(x => x !== jobId) : [...s, jobId]); // optimistic
    try {
      if (isSaved) await apiDelete(`/api/digihub/jobs/${jobId}/save`);
      else await apiPost(`/api/digihub/jobs/${jobId}/save`);
    } catch {
      setSaved(s => isSaved ? [...s, jobId] : s.filter(x => x !== jobId)); // revert on failure
    }
  };

  const submitPosting = async () => {
    if (!form.role.trim() || !form.company.trim()) { setPostErr("Role and company are required."); return; }
    setPosting(true);
    setPostErr("");
    try {
      await apiPost("/api/digihub/jobs", {
        ...form,
        skills: form.skills.split(",").map(s => s.trim()).filter(Boolean),
      });
      setShowPost(false);
      setForm({ role:"", company: profile?.company_name || "", location:"Remote", type:"Full-time", salary:"", skills:"", description:"", urgent:false });
      loadJobs();
    } catch (e) {
      setPostErr(e.message || "Couldn't post the job. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  const S = {
    page: { minHeight:"100vh", background:BG, padding:"32px 40px", fontFamily:"'Plus Jakarta Sans',sans-serif" },
    h1: { fontSize:26, fontWeight:800, color:TEXT, letterSpacing:"-0.04em", marginBottom:4 },
    sub: { fontSize:13, color:MUTED, marginBottom:28 },
    layout: { display:"grid", gridTemplateColumns:"1fr 400px", gap:24 },
    card: { background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:20 },
    jobCard: (sel) => ({ background:CARD, border:`1px solid ${sel?BLUE:BORDER}`, borderRadius:12, padding:18, marginBottom:10, cursor:"pointer", transition:"border-color 0.15s", boxShadow: sel ? "0 2px 10px rgba(2,132,199,0.08)" : "none" }),
    btn: { padding:"10px 22px", background:BLUE, color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" },
    btnSm: { padding:"6px 14px", background:"none", color:BLUE, border:`1px solid ${BLUE}40`, borderRadius:7, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" },
    skill: { display:"inline-block", padding:"3px 8px", background:BG, border:`1px solid ${BORDER}`, borderRadius:5, fontSize:11, color:"#4b5563", marginRight:5, marginBottom:4 },
    pill: { padding:"5px 12px", borderRadius:20, fontSize:11, fontWeight:600, cursor:"pointer", border:"none", fontFamily:"inherit" },
    inp: { padding:"10px 14px", background:BG, border:`1px solid ${BORDER}`, borderRadius:9, color:TEXT, fontSize:13, fontFamily:"inherit", outline:"none", width:"100%", boxSizing:"border-box" },
  };

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'); .dh-jb-layout{display:grid;grid-template-columns:1fr 400px;gap:24px} @media(max-width:860px){.dh-jb-layout{grid-template-columns:1fr!important}}`}</style>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <div style={S.h1}>◇ Job Board</div>
          <div style={S.sub}>Jobs posted by DigiHub Business members — find your next opportunity</div>
        </div>
        {isBusiness && (
          <button onClick={() => setShowPost(true)} style={{ ...S.btn, flexShrink:0 }}>+ Post a Job</button>
        )}
      </div>

      {/* Search & filters */}
      <div style={{ marginBottom:20 }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search roles, skills, companies..." style={{ ...S.inp, marginBottom:12 }} />
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {FILTERS.map(f => (
            <button key={f} onClick={()=>setFilter(f)} style={{ ...S.pill, background:filter===f?BLUE:BG, color:filter===f?"#fff":MUTED, border:filter===f?"none":`1px solid ${BORDER}` }}>{f}</button>
          ))}
        </div>
      </div>

      {loadError && (
        <div style={{ background:"#dc262610", border:"1px solid #dc262630", borderRadius:10, padding:"12px 16px", marginBottom:16, color:"#dc2626", fontSize:13, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          {loadError}
          <button onClick={loadJobs} style={{ background:"none", border:"none", color:"#dc2626", fontWeight:700, cursor:"pointer", fontSize:13 }}>Retry</button>
        </div>
      )}

      <div className="dh-jb-layout">
        {/* Job List */}
        <div>
          <div style={{ fontSize:12, color:FAINT, marginBottom:14 }}>{loading ? "Loading…" : `${filtered.length} jobs found`}</div>

          {!loading && filtered.length === 0 && !loadError && (
            <div style={{ ...S.card, textAlign:"center", padding:48 }}>
              <div style={{ fontSize:32, marginBottom:12, opacity:0.25 }}>◇</div>
              <div style={{ fontSize:14, color:FAINT }}>No jobs match your search yet.</div>
            </div>
          )}

          {filtered.map(job => (
            <div key={job.id} style={S.jobCard(selected?.id===job.id)} onClick={()=>setSelected(job)}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
                    {job.urgent && <span style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.06em", color:"#dc2626", background:"#dc262612", border:"1px solid #dc262630", borderRadius:4, padding:"2px 6px" }}>Urgent</span>}
                    <span style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.06em", color: job.source==="partner" ? "#7c3aed" : "#16a34a", background: job.source==="partner" ? "#7c3aed12" : "#16a34a12", border:`1px solid ${job.source==="partner" ? "#7c3aed30" : "#16a34a30"}`, borderRadius:4, padding:"2px 6px" }}>
                      {job.source==="partner" ? "Partner Board" : "DigiHub Business"}
                    </span>
                    <span style={{ fontSize:12, color:FAINT }}>{new Date(job.created_at).toLocaleDateString()}</span>
                  </div>
                  <div style={{ fontSize:16, fontWeight:700, color:TEXT, marginBottom:2 }}>{job.role}</div>
                  <div style={{ fontSize:13, color:MUTED }}>{job.company}</div>
                </div>
                <button onClick={e=>{e.stopPropagation();toggleSave(job.id)}} style={{ background:"none", border:"none", cursor:"pointer", fontSize:16, color:savedIds.includes(job.id)?BLUE:FAINT }}>
                  {savedIds.includes(job.id)?"★":"☆"}
                </button>
              </div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:8 }}>
                <span style={{ fontSize:12, color:MUTED }}>📍 {job.location}</span>
                <span style={{ fontSize:12, color:MUTED }}>💼 {job.type}</span>
                {job.salary && <span style={{ fontSize:12, color:BLUE, fontWeight:600 }}>💰 {job.salary}</span>}
              </div>
              <div style={{ marginBottom:4 }}>
                {(job.skills||[]).slice(0,3).map(s=><span key={s} style={S.skill}>{s}</span>)}
                {(job.skills||[]).length>3 && <span style={{...S.skill,color:BLUE}}>+{job.skills.length-3}</span>}
              </div>
              <div style={{ fontSize:11, color:FAINT }}>{job.applicants||0} applicants</div>
            </div>
          ))}
        </div>

        {/* Job Detail */}
        <div>
          {selected ? (
            <div style={{ position:"sticky", top:24 }}>
              <div style={S.card}>
                <div style={{ marginBottom:16 }}>
                  {selected.urgent && <span style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.06em", color:"#dc2626", background:"#dc262612", border:"1px solid #dc262630", borderRadius:4, padding:"2px 6px", display:"inline-block", marginBottom:8 }}>Urgent Hire</span>}
                  <div style={{ fontSize:20, fontWeight:800, color:TEXT, letterSpacing:"-0.03em", marginBottom:4 }}>{selected.role}</div>
                  <div style={{ fontSize:14, color:MUTED, marginBottom:12 }}>{selected.company}</div>
                  <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                    <span style={{ fontSize:12, color:MUTED }}>📍 {selected.location}</span>
                    <span style={{ fontSize:12, color:MUTED }}>💼 {selected.type}</span>
                  </div>
                  {selected.salary && <div style={{ fontSize:16, fontWeight:700, color:BLUE, marginTop:8 }}>{selected.salary}</div>}
                </div>

                <div style={{ borderTop:`1px solid ${BORDER}`, paddingTop:16, marginBottom:16 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>About the Role</div>
                  <div style={{ fontSize:13, color:"#374151", lineHeight:1.75 }}>{selected.description}</div>
                </div>

                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Required Skills</div>
                  <div>{(selected.skills||[]).map(s=><span key={s} style={S.skill}>{s}</span>)}</div>
                </div>

                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:11, color:FAINT }}>{selected.applicants||0} people have applied · Posted {new Date(selected.created_at).toLocaleDateString()}</div>
                </div>

                {isBusiness && selected.business_id === profile?.id ? (
                  <div style={{ display:"flex", gap:10 }}>
                    <button onClick={async ()=>{ await apiPatch(`/api/digihub/jobs/${selected.id}`, { status: selected.status==="open"?"closed":"open" }); loadJobs(); setSelected(null); }} style={{ ...S.btn, flex:1, background: selected.status==="open" ? "#dc2626" : "#16a34a" }}>
                      {selected.status === "open" ? "Close Posting" : "Reopen Posting"}
                    </button>
                    <button onClick={async ()=>{ await apiDelete(`/api/digihub/jobs/${selected.id}`); loadJobs(); setSelected(null); }} style={{ ...S.btnSm }}>Delete</button>
                  </div>
                ) : selected.source === "partner" ? (
                  <a href={selected.url || "#"} target="_blank" rel="noopener noreferrer" style={{ ...S.btn, flex:1, display:"block", textAlign:"center", textDecoration:"none", boxSizing:"border-box" }}>
                    Apply on Partner Site ↗
                  </a>
                ) : appliedIds.includes(selected.id) ? (
                  <div style={{ background:"#16a34a10", border:"1px solid #16a34a30", borderRadius:9, padding:"12px 16px", textAlign:"center" }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#16a34a" }}>✓ Applied Successfully</div>
                    <div style={{ fontSize:11, color:"#16a34a90", marginTop:4 }}>The company will review your application</div>
                  </div>
                ) : (
                  <div style={{ display:"flex", gap:10 }}>
                    <button onClick={()=>setShowApply(true)} style={{ ...S.btn, flex:1 }}>Apply Now</button>
                    <button onClick={()=>toggleSave(selected.id)} style={{ ...S.btnSm }}>
                      {savedIds.includes(selected.id)?"★ Saved":"☆ Save"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ ...S.card, textAlign:"center", padding:48 }}>
              <div style={{ fontSize:32, marginBottom:12, opacity:0.2 }}>◇</div>
              <div style={{ fontSize:14, color:FAINT }}>Select a job to see details</div>
            </div>
          )}
        </div>
      </div>

      {/* Apply Modal */}
      {showApply && selected && (
        <div style={{ position:"fixed", inset:0, background:"rgba(10,10,10,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100 }}>
          <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:18, padding:32, width:500, boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize:16, fontWeight:800, color:TEXT, marginBottom:4 }}>Apply for {selected.role}</div>
            <div style={{ fontSize:13, color:FAINT, marginBottom:20 }}>at {selected.company}</div>

            <div style={{ fontSize:11, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>Cover Letter (optional)</div>
            <textarea
              value={coverLetter}
              onChange={e=>setCover(e.target.value.slice(0,2000))}
              maxLength={2000}
              placeholder="Introduce yourself and explain why you're a great fit for this role..."
              style={{ width:"100%", background:BG, border:`1px solid ${BORDER}`, borderRadius:8, padding:12, color:TEXT, fontSize:13, fontFamily:"inherit", minHeight:120, outline:"none", resize:"vertical", boxSizing:"border-box", marginBottom:6 }}
            />
            <div style={{ textAlign:"right", fontSize:11, color:FAINT, marginBottom:16 }}>{coverLetter.length}/2000</div>

            <div style={{ background:"#0284c708", border:`1px solid ${BLUE}20`, borderRadius:8, padding:"10px 14px", marginBottom:16 }}>
              <div style={{ fontSize:12, color:"#374151" }}>Your profile will be shared with the employer. Make sure your profile is up to date at <a href="https://gene.nugens.in.net" style={{color:BLUE}}>Gen-E</a>.</div>
            </div>

            {applyErr && <div style={{ fontSize:12, color:"#dc2626", marginBottom:14 }}>{applyErr}</div>}

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>apply(selected.id)} disabled={applying} style={{ ...S.btn, flex:1, opacity:applying?0.7:1 }}>{applying?"Submitting…":"Submit Application"}</button>
              <button onClick={()=>setShowApply(false)} style={{ flex:1, background:"none", border:`1px solid ${BORDER}`, color:MUTED, borderRadius:9, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Post a Job Modal (business only) */}
      {showPost && (
        <div style={{ position:"fixed", inset:0, background:"rgba(10,10,10,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:20 }}>
          <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:18, padding:32, width:540, maxHeight:"86vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize:16, fontWeight:800, color:TEXT, marginBottom:16 }}>Post a Job</div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
              <input placeholder="Role title *" value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))} style={S.inp} />
              <input placeholder="Company *" value={form.company} onChange={e=>setForm(f=>({...f,company:e.target.value}))} style={S.inp} />
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:12 }}>
              <input placeholder="Location" value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} style={S.inp} />
              <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} style={S.inp}>
                {TYPE_OPTIONS.map(t=><option key={t}>{t}</option>)}
              </select>
              <input placeholder="Salary (optional)" value={form.salary} onChange={e=>setForm(f=>({...f,salary:e.target.value}))} style={S.inp} />
            </div>
            <input placeholder="Skills, comma separated (e.g. React, SEO, Figma)" value={form.skills} onChange={e=>setForm(f=>({...f,skills:e.target.value}))} style={{...S.inp, marginBottom:12}} />
            <textarea placeholder="Job description" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value.slice(0,2000)}))} maxLength={2000} style={{...S.inp, minHeight:110, resize:"vertical", marginBottom:6}} />
            <div style={{ textAlign:"right", fontSize:11, color:FAINT, marginBottom:12 }}>{form.description.length}/2000</div>

            <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:MUTED, marginBottom:20, cursor:"pointer" }}>
              <input type="checkbox" checked={form.urgent} onChange={e=>setForm(f=>({...f,urgent:e.target.checked}))} />
              Mark as urgent hire
            </label>

            {postErr && <div style={{ fontSize:12, color:"#dc2626", marginBottom:14 }}>{postErr}</div>}

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={submitPosting} disabled={posting} style={{ ...S.btn, flex:1, opacity:posting?0.7:1 }}>{posting?"Posting…":"Post Job"}</button>
              <button onClick={()=>setShowPost(false)} style={{ flex:1, background:"none", border:`1px solid ${BORDER}`, color:MUTED, borderRadius:9, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
