import React, { useState, useEffect } from "react";
import { apiGet, apiPost, apiDelete } from "../lib/apiClient";

const BLUE = "#0284c7";
const PINK = "#e8185d";
const B    = "#e8eaed";

const SKILLS = ["All","Social Media","SEO","Performance Ads","Content Writing","Video Editing","Brand Design","Email Marketing"];
const EXPERIENCE_OPTS = ["Fresher","6 months","8 months","1 year","2 years","3+ years"];

/**
 * DigiHub Talent Hub — previously showed 8 hardcoded fictional people
 * (fake names, fake bios, fabricated "match scores") presented as if
 * they were real candidates. Now it's a real, opt-in directory: only
 * people who explicitly list themselves via the form below appear here,
 * and there's an honest empty state instead of fake data when nobody has.
 */
export default function TalentHub({ profile }) {
  const [filter, setFilter]     = useState("All");
  const [search, setSearch]     = useState("");
  const [selected, setSelected] = useState(null);
  const [shortlisted, setShortlisted] = useState([]);
  const [showRequest, setShowRequest] = useState(false);
  const [requestMsg,  setRequestMsg]  = useState("");
  const [sending,     setSending]     = useState(false);
  const [sent,        setSent]        = useState(false);
  const [actionErr,   setActionErr]   = useState("");

  const [talent, setTalent]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showOptIn, setShowOptIn] = useState(false);
  const [myListing, setMyListing] = useState(null);
  const [optForm, setOptForm]     = useState({ fullName: profile?.full_name || "", skill: "Social Media", experience: "Fresher", location: "", bio: "", tags: "" });
  const [optSaving, setOptSaving] = useState(false);
  const [optErr, setOptErr]       = useState("");

  useEffect(() => {
    apiGet("/api/digihub/talent/shortlist").then(d => setShortlisted(d.talentIds || [])).catch(() => {});
    apiGet("/api/digihub/talent").then(d => setTalent(d.talent || [])).catch(() => {}).finally(() => setLoading(false));
    apiGet("/api/digihub/talent/me").then(d => {
      if (d.profile) {
        setMyListing(d.profile);
        setOptForm({ fullName: d.profile.full_name, skill: d.profile.skill, experience: d.profile.experience, location: d.profile.location || "", bio: d.profile.bio || "", tags: (d.profile.tags || []).join(", ") });
      }
    }).catch(() => {});
  }, []);

  const toggleShortlist = async (t) => {
    const id = String(t.user_id);
    const isIn = shortlisted.includes(id);
    setShortlisted(s => isIn ? s.filter(x => x !== id) : [...s, id]); // optimistic
    try {
      if (isIn) await apiDelete(`/api/digihub/talent/${id}/shortlist`);
      else await apiPost(`/api/digihub/talent/${id}/shortlist`, { talentName: t.full_name });
    } catch {
      setShortlisted(s => isIn ? [...s, id] : s.filter(x => x !== id)); // revert
      setActionErr("Couldn't update shortlist. Please try again.");
    }
  };

  const sendRequest = async () => {
    if (!selected) return;
    setSending(true);
    setActionErr("");
    try {
      await apiPost(`/api/digihub/talent/${selected.user_id}/request`, { talentName: selected.full_name, message: requestMsg });
      setSent(true);
      setRequestMsg("");
    } catch (e) {
      setActionErr(e.message || "Couldn't send the request. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const saveListing = async () => {
    if (!optForm.fullName.trim()) { setOptErr("Name is required"); return; }
    setOptSaving(true);
    setOptErr("");
    try {
      const { profile: saved } = await apiPost("/api/digihub/talent/me", {
        fullName: optForm.fullName, skill: optForm.skill, experience: optForm.experience,
        location: optForm.location, bio: optForm.bio,
        tags: optForm.tags.split(",").map(t => t.trim()).filter(Boolean),
      });
      setMyListing(saved);
      setShowOptIn(false);
      // Refresh directory so the new/updated listing shows immediately
      apiGet("/api/digihub/talent").then(d => setTalent(d.talent || [])).catch(() => {});
    } catch (e) {
      setOptErr(e.message || "Couldn't save your listing. Please try again.");
    } finally {
      setOptSaving(false);
    }
  };

  const [unlisting, setUnlisting] = useState(false);
  const unlist = async () => {
    if (!window.confirm("Remove your listing from Talent Hub? Businesses will no longer see your profile.")) return;
    setUnlisting(true);
    try {
      await apiDelete("/api/digihub/talent/me");
      setMyListing(null);
      setShowOptIn(false);
      apiGet("/api/digihub/talent").then(d => setTalent(d.talent || [])).catch(() => {});
    } catch (e) {
      setOptErr(e.message || "Couldn't unlist. Please try again.");
    } finally {
      setUnlisting(false);
    }
  };

  const filtered = talent.filter(t =>
    (filter==="All" || t.skill===filter) &&
    (t.full_name.toLowerCase().includes(search.toLowerCase()) || t.skill.toLowerCase().includes(search.toLowerCase()))
  );

  const statusColor = (s) => s==="Available"?"#16a34a":s==="Placed"?"#d97706":BLUE;

  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", padding:"32px 28px 80px", background:"#f8f9fb", minHeight:"100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .talent-card { background:#ffffff; border:1px solid ${B}; border-radius:12px; padding:18px; cursor:pointer; transition:all 0.18s; }
        .talent-card:hover { border-color:#243040; transform:translateY(-1px); }
        .talent-card.sel { border-color:${BLUE}60; background:#f0f9ff; }
        .skill-chip { padding:3px 9px; border-radius:5px; font-size:10.5px; font-weight:600; background:#f3f4f6; color:#6b7280; }
        .tag { display:inline-block; padding:2px 7px; border-radius:4px; font-size:10.5px; font-weight:600; background:#f3f4f6; color:#374151; }
        .filter-btn { padding:5px 14px; border-radius:7px; font-size:12px; font-weight:600; cursor:pointer; border:1px solid ${B}; font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.13s; }
        .filter-btn.on { background:${BLUE}; color:#fff; border-color:${BLUE}; }
        .filter-btn.off { background:transparent; color:#6b7280; }
        .filter-btn.off:hover { color:#0a0a0a; border-color:#c8ccd2; }
        .dh-input { padding:9px 14px; background:#ffffff; border:1px solid ${B}; border-radius:8px; color:#0a0a0a; font-size:13.5px; font-family:'Plus Jakarta Sans',sans-serif; outline:none; }
        .dh-input:focus { border-color:${BLUE}60; }
        .dh-input::placeholder { color:#9ca3af; }
        @media (max-width:900px) { .talent-layout { grid-template-columns:1fr !important; } }
        @media (max-width:700px) { .talent-g { grid-template-columns:1fr !important; } }
      `}</style>

      <div style={{ marginBottom:28, display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:14 }}>
        <div>
          <h1 style={{ fontWeight:800, fontSize:"clamp(20px,2.5vw,26px)", letterSpacing:"-0.03em", color:"#0a0a0a", marginBottom:4 }}>Talent Hub</h1>
          <p style={{ fontSize:13.5, color:"#6b7280" }}>A real, opt-in directory — only people who list themselves below appear here.</p>
        </div>
        <button onClick={() => setShowOptIn(true)} style={{ padding:"10px 20px", background: myListing ? "#fff" : BLUE, color: myListing ? BLUE : "#fff", border:`1px solid ${BLUE}`, borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
          {myListing ? "✓ You're Listed — Edit" : "+ List Yourself as Talent"}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:24 }}>
        {[
          { label:"Total talent",   value:talent.length,                                    color:BLUE     },
          { label:"Available now",  value:talent.filter(t=>t.status==="Available").length,   color:"#16a34a"},
          { label:"Placed",         value:talent.filter(t=>t.status==="Placed").length,      color:"#d97706"},
          { label:"In interview",   value:talent.filter(t=>t.status==="Interview").length,   color:PINK     },
        ].map(s => (
          <div key={s.label} style={{ background:"#ffffff", border:`1px solid ${B}`, borderRadius:10, padding:"14px 16px" }}>
            <div style={{ fontSize:22, fontWeight:800, color:s.color, letterSpacing:"-0.04em" }}>{s.value}</div>
            <div style={{ fontSize:11.5, color:"#6b7280", marginTop:3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
        <input className="dh-input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or skill..." style={{ width:220 }} />
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {SKILLS.map(s => (
            <button key={s} className={`filter-btn ${filter===s?"on":"off"}`} onClick={() => setFilter(s)}>{s}</button>
          ))}
        </div>
      </div>

      <div className="talent-layout" style={{ display:"grid", gridTemplateColumns:"1fr 380px", gap:16, alignItems:"start" }}>
        {/* Grid */}
        {loading ? (
          <div style={{ padding:60, textAlign:"center", color:"#9ca3af" }}>Loading talent directory…</div>
        ) : (
          <div className="talent-g" style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 }}>
            {filtered.map(t => (
              <div key={t.user_id} className={`talent-card${selected?.user_id===t.user_id?" sel":""}`} onClick={() => setSelected(t)}>
                <div style={{ display:"flex", gap:12, alignItems:"flex-start", marginBottom:12 }}>
                  <div style={{ width:40, height:40, borderRadius:"50%", background:`${BLUE}20`, border:`1px solid ${BLUE}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:800, color:BLUE, flexShrink:0 }}>
                    {t.full_name.split(" ").map(w=>w[0]).join("")}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:"#0a0a0a", marginBottom:1 }}>{t.full_name}</div>
                    <div style={{ fontSize:12, color:"#6b7280" }}>{t.skill} · {t.location || "Location not set"}</div>
                  </div>
                </div>
                <div style={{ fontSize:12.5, color:"#6b7280", lineHeight:1.6, marginBottom:10 }}>{t.bio || "No bio provided yet."}</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  <span className="tag" style={{ background:statusColor(t.status)+"18", color:statusColor(t.status) }}>{t.status}</span>
                  <span className="tag">{t.experience}</span>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ gridColumn:"1/-1", textAlign:"center", padding:60, color:"#9ca3af", background:"#fff", border:`1px solid ${B}`, borderRadius:12 }}>
                {talent.length === 0
                  ? <>Nobody has listed themselves yet. <a href="#" onClick={(e)=>{e.preventDefault();setShowOptIn(true);}} style={{color:BLUE,fontWeight:600}}>Be the first →</a></>
                  : "No talent found matching your filter."}
              </div>
            )}
          </div>
        )}

        {/* Profile panel */}
        {selected ? (
          <div style={{ background:"#ffffff", border:`1px solid ${B}`, borderRadius:14, padding:24, position:"sticky", top:20 }}>
            <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:20 }}>
              <div style={{ width:52, height:52, borderRadius:"50%", background:`${BLUE}20`, border:`1px solid ${BLUE}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:800, color:BLUE }}>
                {selected.full_name.split(" ").map(w=>w[0]).join("")}
              </div>
              <div>
                <div style={{ fontSize:16, fontWeight:800, color:"#0a0a0a", letterSpacing:"-0.02em" }}>{selected.full_name}</div>
                <div style={{ fontSize:12.5, color:"#6b7280" }}>{selected.location || "Location not set"} · {selected.experience}</div>
              </div>
            </div>

            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#6b7280", marginBottom:8 }}>About</div>
              <p style={{ fontSize:13, color:"#374151", lineHeight:1.7 }}>{selected.bio || "No bio provided yet."}</p>
            </div>

            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#6b7280", marginBottom:8 }}>Skills</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {(selected.tags || []).length ? selected.tags.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                )) : <span style={{ fontSize:12.5, color:"#9ca3af" }}>No tags added</span>}
              </div>
            </div>

            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#6b7280", marginBottom:8 }}>Status</div>
              <span style={{ padding:"4px 12px", borderRadius:6, fontSize:12.5, fontWeight:700, background:statusColor(selected.status)+"18", color:statusColor(selected.status) }}>{selected.status}</span>
            </div>

            {actionErr && <div style={{ fontSize:12, color:"#dc2626", marginBottom:12 }}>{actionErr}</div>}

            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <button onClick={() => { setShowRequest(true); setSent(false); }} style={{ padding:"11px 0", background:BLUE, color:"#fff", border:"none", borderRadius:9, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                Request introduction
              </button>
              <button onClick={() => toggleShortlist(selected)} style={{ padding:"11px 0", background: shortlisted.includes(String(selected.user_id)) ? "#f0f9ff" : "transparent", color: shortlisted.includes(String(selected.user_id)) ? BLUE : "#6b7280", border:`1px solid ${shortlisted.includes(String(selected.user_id)) ? BLUE+"60" : B}`, borderRadius:9, fontSize:14, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                {shortlisted.includes(String(selected.user_id)) ? "★ Shortlisted" : "☆ Save to shortlist"}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ background:"#ffffff", border:`1px solid ${B}`, borderRadius:14, padding:40, textAlign:"center" }}>
            <div style={{ fontSize:28, marginBottom:12 }}>◇</div>
            <div style={{ fontSize:13.5, color:"#9ca3af" }}>Select a profile to view details</div>
          </div>
        )}
      </div>

      {/* Request introduction modal */}
      {showRequest && selected && (
        <div style={{ position:"fixed", inset:0, background:"rgba(10,10,10,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100 }}>
          <div style={{ background:"#ffffff", border:`1px solid ${B}`, borderRadius:18, padding:32, width:440, boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
            {sent ? (
              <div style={{ textAlign:"center", padding:"12px 0" }}>
                <div style={{ fontSize:32, marginBottom:12 }}>✓</div>
                <div style={{ fontSize:15, fontWeight:700, color:"#0a0a0a", marginBottom:6 }}>Request sent</div>
                <div style={{ fontSize:13, color:"#6b7280", marginBottom:20 }}>We'll notify {selected.full_name.split(" ")[0]} and follow up with you.</div>
                <button onClick={() => setShowRequest(false)} style={{ padding:"10px 24px", background:BLUE, color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Done</button>
              </div>
            ) : (
              <>
                <div style={{ fontSize:16, fontWeight:800, color:"#0a0a0a", marginBottom:4 }}>Request introduction</div>
                <div style={{ fontSize:13, color:"#9ca3af", marginBottom:18 }}>to {selected.full_name} — {selected.skill}</div>
                <textarea
                  value={requestMsg}
                  onChange={e=>setRequestMsg(e.target.value.slice(0,1000))}
                  placeholder="Tell them a bit about the role or project you have in mind..."
                  style={{ width:"100%", background:"#f8f9fb", border:`1px solid ${B}`, borderRadius:8, padding:12, color:"#0a0a0a", fontSize:13, fontFamily:"inherit", minHeight:100, outline:"none", resize:"vertical", boxSizing:"border-box", marginBottom:6 }}
                />
                <div style={{ textAlign:"right", fontSize:11, color:"#9ca3af", marginBottom:16 }}>{requestMsg.length}/1000</div>
                {actionErr && <div style={{ fontSize:12, color:"#dc2626", marginBottom:14 }}>{actionErr}</div>}
                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={sendRequest} disabled={sending} style={{ flex:1, padding:"10px 0", background:BLUE, color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", opacity:sending?0.7:1 }}>{sending?"Sending…":"Send request"}</button>
                  <button onClick={()=>setShowRequest(false)} style={{ flex:1, background:"none", border:`1px solid ${B}`, color:"#6b7280", borderRadius:9, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Opt-in / edit listing modal */}
      {showOptIn && (
        <div style={{ position:"fixed", inset:0, background:"rgba(10,10,10,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:20 }}>
          <div style={{ background:"#ffffff", border:`1px solid ${B}`, borderRadius:18, padding:32, width:480, maxWidth:"100%", maxHeight:"85vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize:16, fontWeight:800, color:"#0a0a0a", marginBottom:4 }}>{myListing ? "Edit your listing" : "List yourself as talent"}</div>
            <div style={{ fontSize:13, color:"#9ca3af", marginBottom:18 }}>Businesses browsing Talent Hub will see this. You can unlist anytime.</div>

            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Full name</label>
              <input className="dh-input" style={{ width:"100%", boxSizing:"border-box" }} value={optForm.fullName} onChange={e=>setOptForm(f=>({...f, fullName:e.target.value}))} />
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Skill category</label>
                <select className="dh-input" style={{ width:"100%", boxSizing:"border-box" }} value={optForm.skill} onChange={e=>setOptForm(f=>({...f, skill:e.target.value}))}>
                  {SKILLS.filter(s=>s!=="All").map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Experience</label>
                <select className="dh-input" style={{ width:"100%", boxSizing:"border-box" }} value={optForm.experience} onChange={e=>setOptForm(f=>({...f, experience:e.target.value}))}>
                  {EXPERIENCE_OPTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Location</label>
              <input className="dh-input" style={{ width:"100%", boxSizing:"border-box" }} value={optForm.location} onChange={e=>setOptForm(f=>({...f, location:e.target.value}))} placeholder="e.g. Chennai" />
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Short bio</label>
              <textarea className="dh-input" style={{ width:"100%", boxSizing:"border-box", minHeight:80, resize:"vertical" }} value={optForm.bio} onChange={e=>setOptForm(f=>({...f, bio:e.target.value.slice(0,500)}))} placeholder="What you've worked on, tools you know..." />
            </div>

            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Tags (comma-separated)</label>
              <input className="dh-input" style={{ width:"100%", boxSizing:"border-box" }} value={optForm.tags} onChange={e=>setOptForm(f=>({...f, tags:e.target.value}))} placeholder="Instagram, Reels, Analytics" />
            </div>

            {optErr && <div style={{ fontSize:12, color:"#dc2626", marginBottom:14 }}>{optErr}</div>}

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={saveListing} disabled={optSaving} style={{ flex:1, padding:"10px 0", background:BLUE, color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", opacity:optSaving?0.7:1 }}>
                {optSaving ? "Saving…" : myListing ? "Save Changes" : "List Me"}
              </button>
              <button onClick={()=>setShowOptIn(false)} style={{ padding:"10px 20px", background:"none", border:`1px solid ${B}`, color:"#6b7280", borderRadius:9, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
              {myListing && (
                <button onClick={unlist} disabled={unlisting} style={{ padding:"10px 16px", background:"#fef2f2", border:"1px solid #fecaca", color:"#dc2626", borderRadius:9, fontSize:13, cursor:"pointer", fontFamily:"inherit", opacity:unlisting?0.7:1 }}>
                  {unlisting ? "Removing…" : "Unlist"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
