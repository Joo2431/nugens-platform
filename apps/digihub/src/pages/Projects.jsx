import React, { useState } from "react";

const BLUE = "#0284c7";
const BG   = "#06101a";
const CARD = "#0a1628";
const B    = "#1a2030";

const STATUS_COLORS = { active:"#22c55e", completed:BLUE, paused:"#f59e0b", draft:"#445" };

const MOCK_PROJECTS = [
  { id:1, name:"Diwali Campaign 2026", platform:"Instagram + Facebook", status:"active", tasks:8, done:5, deadline:"Oct 20, 2026", desc:"Full social media campaign for Diwali — creatives, captions, hashtags and scheduling." },
  { id:2, name:"Brand Refresh Q2",     platform:"All Platforms",        status:"active", tasks:12, done:3, deadline:"May 30, 2026", desc:"Complete brand identity refresh — new color palette, fonts, and visual guidelines." },
  { id:3, name:"Product Launch — V2",  platform:"LinkedIn + Instagram", status:"paused", tasks:6, done:6, deadline:"Mar 28, 2026", desc:"Launch campaign for Version 2.0 of the product. On hold pending product readiness." },
  { id:4, name:"January Content Pack", platform:"Instagram",            status:"completed", tasks:20, done:20, deadline:"Jan 31, 2026", desc:"Monthly content creation and scheduling for January 2026." },
];

export default function Projects({ profile }) {
  const [projects, setProjects] = useState(MOCK_PROJECTS);
  const [showNew, setShowNew]   = useState(false);
  const [filter, setFilter]     = useState("all");
  const [newP, setNewP]         = useState({ name:"", platform:"", status:"active", deadline:"", desc:"" });

  const filtered = filter === "all" ? projects : projects.filter(p=>p.status===filter);

  const save = () => {
    if (!newP.name.trim()) return;
    setProjects(ps=>[{ ...newP, id:Date.now(), tasks:0, done:0 }, ...ps]);
    setNewP({ name:"", platform:"", status:"active", deadline:"", desc:"" });
    setShowNew(false);
  };

  const S = {
    page: { minHeight:"100vh", background:BG, padding:"32px 40px", fontFamily:"'Plus Jakarta Sans',sans-serif" },
    h1: { fontSize:26, fontWeight:800, color:"#fff", letterSpacing:"-0.04em", marginBottom:4 },
    card: { background:CARD, border:`1px solid ${B}`, borderRadius:14, padding:22 },
    btn: { padding:"10px 22px", background:BLUE, color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" },
    inp: { width:"100%", background:"#0d1624", border:`1px solid ${B}`, borderRadius:8, padding:"9px 12px", color:"#ccc", fontSize:13, marginBottom:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box" },
    sel: { width:"100%", background:"#0d1624", border:`1px solid ${B}`, borderRadius:8, padding:"9px 12px", color:"#ccc", fontSize:13, marginBottom:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box" },
    pill: { padding:"5px 12px", borderRadius:20, fontSize:11, fontWeight:600, cursor:"pointer", border:"none", fontFamily:"inherit" },
  };

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28 }}>
        <div>
          <div style={S.h1}>◑ Projects</div>
          <div style={{ fontSize:13, color:"#445" }}>Manage your brand campaigns and content projects</div>
        </div>
        <button onClick={()=>setShowNew(true)} style={S.btn}>+ New Project</button>
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:8, marginBottom:24 }}>
        {["all","active","paused","completed","draft"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{ ...S.pill, background:filter===f?BLUE:"#0d1624", color:filter===f?"#fff":"#445", border:filter===f?"none":`1px solid ${B}` }}>
            {f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
      </div>

      {/* Projects grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:16 }}>
        {filtered.map(p=>{
          const pct = p.tasks > 0 ? Math.round((p.done/p.tasks)*100) : 0;
          return (
            <div key={p.id} style={S.card}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:15, fontWeight:700, color:"#fff", marginBottom:3 }}>{p.name}</div>
                  <div style={{ fontSize:12, color:"#445" }}>{p.platform}</div>
                </div>
                <span style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:STATUS_COLORS[p.status], background:`${STATUS_COLORS[p.status]}15`, border:`1px solid ${STATUS_COLORS[p.status]}30`, borderRadius:5, padding:"3px 8px" }}>{p.status}</span>
              </div>
              <div style={{ fontSize:12, color:"#445", lineHeight:1.6, marginBottom:16 }}>{p.desc}</div>
              <div style={{ marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ fontSize:11, color:"#334" }}>Progress</span>
                  <span style={{ fontSize:11, fontWeight:700, color:pct===100?"#22c55e":BLUE }}>{pct}% · {p.done}/{p.tasks} tasks</span>
                </div>
                <div style={{ height:5, background:"#0d1624", borderRadius:3, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${pct}%`, background:pct===100?"#22c55e":BLUE, borderRadius:3, transition:"width 0.3s" }}/>
                </div>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:11, color:"#334" }}>📅 {p.deadline}</span>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={()=>setProjects(ps=>ps.map(x=>x.id===p.id?{...x,done:Math.min(x.tasks,x.done+1)}:x))} style={{ fontSize:11, color:BLUE, background:"none", border:`1px solid ${BLUE}30`, borderRadius:5, padding:"3px 8px", cursor:"pointer", fontFamily:"inherit" }}>
                    +Task Done
                  </button>
                  <button onClick={()=>setProjects(ps=>ps.filter(x=>x.id!==p.id))} style={{ fontSize:11, color:"#445", background:"none", border:`1px solid ${B}`, borderRadius:5, padding:"3px 8px", cursor:"pointer", fontFamily:"inherit" }}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New project modal */}
      {showNew && (
        <div style={{ position:"fixed", inset:0, background:"#000b", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100 }}>
          <div style={{ background:"#0a1628", border:`1px solid ${B}`, borderRadius:18, padding:32, width:460 }}>
            <div style={{ fontSize:16, fontWeight:800, color:"#fff", marginBottom:20 }}>New Project</div>
            <label style={{ fontSize:11, fontWeight:700, color:"#445", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6, display:"block" }}>Project Name *</label>
            <input value={newP.name} onChange={e=>setNewP(p=>({...p,name:e.target.value}))} placeholder="e.g. Summer Campaign 2026" style={S.inp} />
            <label style={{ fontSize:11, fontWeight:700, color:"#445", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6, display:"block" }}>Platform(s)</label>
            <input value={newP.platform} onChange={e=>setNewP(p=>({...p,platform:e.target.value}))} placeholder="e.g. Instagram + LinkedIn" style={S.inp} />
            <label style={{ fontSize:11, fontWeight:700, color:"#445", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6, display:"block" }}>Description</label>
            <input value={newP.desc} onChange={e=>setNewP(p=>({...p,desc:e.target.value}))} placeholder="Brief description..." style={S.inp} />
            <label style={{ fontSize:11, fontWeight:700, color:"#445", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6, display:"block" }}>Deadline</label>
            <input type="date" value={newP.deadline} onChange={e=>setNewP(p=>({...p,deadline:e.target.value}))} style={S.inp} />
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={save} style={{ ...S.btn, flex:1 }}>Create Project</button>
              <button onClick={()=>setShowNew(false)} style={{ flex:1, background:"none", border:`1px solid ${B}`, color:"#556", borderRadius:9, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
