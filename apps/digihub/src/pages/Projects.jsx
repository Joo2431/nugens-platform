import React, { useState } from "react";

const BLUE = "#0284c7";
const PINK = "#e8185d";
const B    = "#1a2030";

const STATUSES = ["All","Planning","Active","Review","Completed"];

const PROJECTS = [
  { id:1,  brand:"Zara Fitness",  name:"Brand Relaunch Q2",        status:"Active",    due:"Mar 20", pm:"Priya S.",  budget:"₹80K",  progress:65, tags:["Brand","Social","Content"], color:BLUE,      tasks:[{t:"Brand kit finalized",done:true},{t:"Content calendar built",done:true},{t:"Reels campaign live",done:false},{t:"Analytics report",done:false}] },
  { id:2,  brand:"ThinkBox",      name:"Social Media Setup",        status:"Review",    due:"Mar 15", pm:"Karthik R.",budget:"₹35K",  progress:90, tags:["Social","Strategy"],        color:"#d97706", tasks:[{t:"Audit complete",done:true},{t:"Platform setup",done:true},{t:"Content pillar doc",done:true},{t:"First month review",done:false}] },
  { id:3,  brand:"VedaKitchen",   name:"SEO & Blog Campaign",       status:"Active",    due:"Apr 2",  pm:"Divya M.",  budget:"₹45K",  progress:30, tags:["SEO","Content"],            color:"#16a34a", tasks:[{t:"Keyword research",done:true},{t:"10 articles written",done:false},{t:"On-page SEO",done:false},{t:"Backlink outreach",done:false}] },
  { id:4,  brand:"NovaTech",      name:"Performance Ads Launch",    status:"Planning",  due:"Apr 10", pm:"Arjun N.",  budget:"₹1.2L", progress:10, tags:["Ads","Google","Meta"],      color:PINK,      tasks:[{t:"Brief & strategy",done:true},{t:"Creative assets",done:false},{t:"Campaign setup",done:false},{t:"A/B test live",done:false}] },
  { id:5,  brand:"Zara Fitness",  name:"Ramadan Reels Campaign",    status:"Completed", due:"Mar 1",  pm:"Sneha I.",  budget:"₹25K",  progress:100,tags:["Reels","Instagram"],        color:BLUE,      tasks:[{t:"Script & storyboard",done:true},{t:"Production",done:true},{t:"Editing",done:true},{t:"Published & reported",done:true}] },
  { id:6,  brand:"VedaKitchen",   name:"YouTube Channel Setup",     status:"Planning",  due:"May 1",  pm:"Rahul K.",  budget:"₹60K",  progress:5,  tags:["YouTube","Video"],          color:"#16a34a", tasks:[{t:"Channel branding",done:false},{t:"Content plan",done:false},{t:"Pilot episode",done:false},{t:"10 uploads",done:false}] },
];

export default function Projects() {
  const [filter, setFilter]     = useState("All");
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew]   = useState(false);

  const shown = PROJECTS.filter(p => filter==="All" || p.status===filter);
  const statusColor = (s) => s==="Active"?BLUE:s==="Review"?"#d97706":s==="Completed"?"#16a34a":s==="Planning"?PINK:"#445";

  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", padding:"32px 28px 80px", background:"#06101a", minHeight:"100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .proj-card { background:#080f1a; border:1px solid ${B}; border-radius:12px; padding:20px; cursor:pointer; transition:all 0.18s; }
        .proj-card:hover { border-color:#243040; transform:translateY(-1px); }
        .proj-card.sel { border-color:${BLUE}60; background:#0a1628; }
        .filter-btn { padding:5px 14px; border-radius:7px; font-size:12px; font-weight:600; cursor:pointer; border:1px solid ${B}; font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.13s; }
        .filter-btn.on { background:${BLUE}; color:#fff; border-color:${BLUE}; }
        .filter-btn.off { background:transparent; color:#445; }
        .filter-btn.off:hover { color:#aaa; border-color:#243040; }
        .tag { display:inline-block; padding:2px 7px; border-radius:4px; font-size:10.5px; font-weight:600; background:#1a2030; color:#445; }
        .prog-bar { height:4px; background:#0d1624; border-radius:99px; overflow:hidden; }
        .dh-input { width:100%; padding:9px 12px; background:#0d1624; border:1px solid ${B}; border-radius:8px; color:#ddd; font-size:13px; font-family:'Plus Jakarta Sans',sans-serif; outline:none; }
        .dh-input:focus { border-color:${BLUE}60; }
        .dh-input::placeholder { color:#334; }
        @media (max-width:900px) { .proj-layout { grid-template-columns:1fr !important; } }
        @media (max-width:640px) { .proj-g { grid-template-columns:1fr !important; } }
      `}</style>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28, flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontWeight:800, fontSize:"clamp(20px,2.5vw,26px)", letterSpacing:"-0.03em", color:"#fff", marginBottom:4 }}>Projects</h1>
          <p style={{ fontSize:13.5, color:"#445" }}>Track all brand projects, tasks, and timelines in one place.</p>
        </div>
        <button onClick={() => setShowNew(true)} style={{ padding:"9px 18px", background:BLUE, color:"#fff", border:"none", borderRadius:9, fontSize:13.5, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
          + New project
        </button>
      </div>

      {/* Summary */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:24 }}>
        {STATUSES.slice(1).map(s => (
          <div key={s} style={{ background:"#080f1a", border:`1px solid ${B}`, borderRadius:10, padding:"14px 16px" }}>
            <div style={{ fontSize:22, fontWeight:800, letterSpacing:"-0.04em", color:statusColor(s) }}>{PROJECTS.filter(p=>p.status===s).length}</div>
            <div style={{ fontSize:11.5, color:"#445", marginTop:3 }}>{s}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:6, marginBottom:20, flexWrap:"wrap" }}>
        {STATUSES.map(s => (
          <button key={s} className={`filter-btn ${filter===s?"on":"off"}`} onClick={() => setFilter(s)}>{s}</button>
        ))}
      </div>

      <div className="proj-layout" style={{ display:"grid", gridTemplateColumns:"1fr 360px", gap:16, alignItems:"start" }}>
        {/* Project grid */}
        <div className="proj-g" style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 }}>
          {shown.map(p => (
            <div key={p.id} className={`proj-card${selected?.id===p.id?" sel":""}`} onClick={() => setSelected(p)}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                <div>
                  <div style={{ fontSize:11, color:"#445", marginBottom:3 }}>{p.brand}</div>
                  <div style={{ fontSize:14, fontWeight:700, color:"#ddd", lineHeight:1.35 }}>{p.name}</div>
                </div>
                <span style={{ display:"inline-block", padding:"2px 8px", borderRadius:5, fontSize:10.5, fontWeight:700, background:statusColor(p.status)+"18", color:statusColor(p.status), flexShrink:0, marginLeft:8 }}>{p.status}</span>
              </div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
                {p.tags.map(t => <span key={t} className="tag">{t}</span>)}
              </div>
              <div className="prog-bar" style={{ marginBottom:4 }}>
                <div style={{ width:`${p.progress}%`, height:"100%", background:p.color, borderRadius:99 }} />
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:11.5, color:"#445" }}>
                <span>{p.progress}% complete</span>
                <span>Due {p.due}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Detail panel */}
        {selected ? (
          <div style={{ background:"#080f1a", border:`1px solid ${B}`, borderRadius:14, padding:22, position:"sticky", top:20 }}>
            <div style={{ marginBottom:4 }}>
              <div style={{ fontSize:11.5, color:"#445", marginBottom:4 }}>{selected.brand}</div>
              <h2 style={{ fontWeight:800, fontSize:17, color:"#fff", letterSpacing:"-0.025em", marginBottom:6 }}>{selected.name}</h2>
              <span style={{ display:"inline-block", padding:"2px 10px", borderRadius:5, fontSize:11, fontWeight:700, background:statusColor(selected.status)+"18", color:statusColor(selected.status) }}>{selected.status}</span>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, margin:"16px 0" }}>
              {[
                { label:"Budget",  value:selected.budget  },
                { label:"Due",     value:selected.due     },
                { label:"PM",      value:selected.pm      },
                { label:"Progress",value:selected.progress+"%" },
              ].map(f => (
                <div key={f.label} style={{ background:"#0d1624", borderRadius:8, padding:"10px 12px" }}>
                  <div style={{ fontSize:11, color:"#445", marginBottom:2 }}>{f.label}</div>
                  <div style={{ fontSize:13.5, fontWeight:700, color:"#bbb" }}>{f.value}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom:8 }}>
              <div style={{ height:6, background:"#0d1624", borderRadius:99, overflow:"hidden" }}>
                <div style={{ width:`${selected.progress}%`, height:"100%", background:selected.color, borderRadius:99 }} />
              </div>
            </div>

            <div style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:"#445", marginBottom:12, marginTop:20 }}>Tasks</div>
            <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
              {selected.tasks.map((task,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", background:"#0d1624", borderRadius:8 }}>
                  <div style={{ width:16, height:16, borderRadius:4, background:task.done?selected.color+"30":"#1a2030", border:`1.5px solid ${task.done?selected.color:"#243040"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    {task.done && <span style={{ fontSize:9, color:selected.color, fontWeight:800 }}>✓</span>}
                  </div>
                  <span style={{ fontSize:12.5, color:task.done?"#667":"#aaa", textDecoration:task.done?"line-through":"none" }}>{task.t}</span>
                </div>
              ))}
            </div>

            <button style={{ width:"100%", marginTop:18, padding:"11px 0", background:BLUE, color:"#fff", border:"none", borderRadius:9, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              Open full project
            </button>
          </div>
        ) : (
          <div style={{ background:"#080f1a", border:`1px solid ${B}`, borderRadius:14, padding:40, textAlign:"center" }}>
            <div style={{ fontSize:28, marginBottom:12 }}>◑</div>
            <div style={{ fontSize:13.5, color:"#334" }}>Select a project to view details</div>
          </div>
        )}
      </div>

      {/* New project modal */}
      {showNew && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999, padding:20 }}>
          <div style={{ background:"#080f1a", border:`1px solid ${B}`, borderRadius:16, padding:28, width:"100%", maxWidth:480 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:22 }}>
              <h2 style={{ fontWeight:700, fontSize:17, color:"#fff" }}>New project</h2>
              <button onClick={()=>setShowNew(false)} style={{ background:"none", border:"none", color:"#445", fontSize:18, cursor:"pointer" }}>✕</button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {["Brand name","Project name","Budget","Due date","Project manager"].map(label => (
                <div key={label}>
                  <label style={{ fontSize:11.5, fontWeight:600, color:"#445", display:"block", marginBottom:5 }}>{label}</label>
                  <input className="dh-input" placeholder={label} />
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:10, marginTop:20 }}>
              <button style={{ flex:1, padding:"11px 0", background:BLUE, color:"#fff", border:"none", borderRadius:9, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }} onClick={()=>setShowNew(false)}>Create project</button>
              <button style={{ padding:"11px 18px", background:"transparent", color:"#556", border:`1px solid ${B}`, borderRadius:9, fontSize:14, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }} onClick={()=>setShowNew(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
