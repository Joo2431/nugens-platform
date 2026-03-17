import React, { useState } from "react";

const GOLD = "#d97706";
const PINK = "#e8185d";
const B    = "#1c1a14";

const STAGES = ["Booked","Pre-shoot","Production","Editing","Review","Delivered"];

const PROJECTS = [
  { id:1, name:"Arjun & Priya Wedding",     type:"Photography + Video", date:"Mar 22", stage:"Production", client:"Arjun Mehta",    phone:"+91 98765 43210", progress:60, color:GOLD,
    timeline:[{s:"Booked",done:true,date:"Feb 10"},{s:"Pre-shoot",done:true,date:"Mar 10"},{s:"Production",done:false,date:"Mar 22"},{s:"Editing",done:false,date:"Apr 1"},{s:"Review",done:false,date:"Apr 8"},{s:"Delivered",done:false,date:"Apr 10"}],
    notes:"Cathedral church ceremony. Drone shots for outdoor reception. Request warm tone grading." },
  { id:2, name:"Sneha & Rahul Pre-Wedding", type:"Photography",         date:"Apr 12", stage:"Editing",    client:"Sneha Kumar",    phone:"+91 87654 32109", progress:85, color:"#16a34a",
    timeline:[{s:"Booked",done:true,date:"Mar 1"},{s:"Pre-shoot",done:true,date:"Mar 25"},{s:"Production",done:true,date:"Apr 12"},{s:"Editing",done:false,date:"Apr 18"},{s:"Review",done:false,date:"Apr 22"},{s:"Delivered",done:false,date:"Apr 25"}],
    notes:"Beach location near ECR. Golden hour shoot. Requested film-style edit." },
  { id:3, name:"Corporate — ThinkBox",      type:"Brand Content",       date:"Apr 5",  stage:"Pre-shoot",  client:"Karthik Rajan",  phone:"+91 76543 21098", progress:20, color:PINK,
    timeline:[{s:"Booked",done:true,date:"Mar 15"},{s:"Pre-shoot",done:false,date:"Apr 2"},{s:"Production",done:false,date:"Apr 5"},{s:"Editing",done:false,date:"Apr 10"},{s:"Review",done:false,date:"Apr 12"},{s:"Delivered",done:false,date:"Apr 14"}],
    notes:"Office space shoot. Team headshots + workspace lifestyle. LinkedIn-ready formats." },
  { id:4, name:"Meera & Karthik Reception", type:"Photography",         date:"Mar 28", stage:"Booked",     client:"Meera Pillai",   phone:"+91 65432 10987", progress:10, color:"#a16207",
    timeline:[{s:"Booked",done:true,date:"Mar 20"},{s:"Pre-shoot",done:false,date:"Mar 26"},{s:"Production",done:false,date:"Mar 28"},{s:"Editing",done:false,date:"Apr 5"},{s:"Review",done:false,date:"Apr 8"},{s:"Delivered",done:false,date:"Apr 10"}],
    notes:"Evening reception. Indoor hall with chandeliers. Classic elegant style." },
];

export default function ProjectTracker() {
  const [selected, setSelected] = useState(PROJECTS[0]);

  const stageColor = (s) => s==="Delivered"?"#16a34a":s==="Editing"?"#d97706":s==="Production"?GOLD:s==="Review"?PINK:"#4a4030";

  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", padding:"32px 28px 80px", background:"#0a0906", minHeight:"100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .proj-row { background:#0d0c09; border:1px solid ${B}; border-radius:12px; padding:16px 18px; cursor:pointer; transition:all 0.15s; }
        .proj-row:hover { border-color:#2a2618; }
        .proj-row.sel { border-color:${GOLD}50; background:#1a1508; }
        .tag { display:inline-block; padding:2px 8px; border-radius:5px; font-size:10.5px; font-weight:600; }
        .prog { height:4px; background:#1c1a14; border-radius:99px; overflow:hidden; }
        @media (max-width:900px) { .pt-layout { grid-template-columns:1fr !important; } }
      `}</style>

      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontWeight:800, fontSize:"clamp(20px,2.5vw,26px)", letterSpacing:"-0.03em", color:"#e5c97e", marginBottom:4 }}>Project Tracker</h1>
        <p style={{ fontSize:13.5, color:"#4a4030" }}>Track every project from booking to delivery.</p>
      </div>

      <div className="pt-layout" style={{ display:"grid", gridTemplateColumns:"1fr 380px", gap:16, alignItems:"start" }}>
        {/* Project list */}
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {PROJECTS.map(p => (
            <div key={p.id} className={`proj-row${selected?.id===p.id?" sel":""}`} onClick={() => setSelected(p)}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:"#c8b060", marginBottom:2 }}>{p.name}</div>
                  <div style={{ fontSize:12, color:"#4a4030" }}>{p.type} · {p.date}</div>
                </div>
                <span className="tag" style={{ background:stageColor(p.stage)+"18", color:stageColor(p.stage), flexShrink:0, marginLeft:8 }}>{p.stage}</span>
              </div>
              <div className="prog">
                <div style={{ width:`${p.progress}%`, height:"100%", background:p.color, borderRadius:99 }} />
              </div>
              <div style={{ fontSize:11, color:"#4a4030", marginTop:4 }}>{p.progress}% complete</div>
            </div>
          ))}
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ background:"#0d0c09", border:`1px solid ${B}`, borderRadius:14, padding:24, position:"sticky", top:20 }}>
            <div style={{ marginBottom:18 }}>
              <div style={{ fontSize:11, color:"#4a4030", marginBottom:4 }}>{selected.type}</div>
              <h2 style={{ fontWeight:800, fontSize:17, color:"#e5c97e", letterSpacing:"-0.025em", marginBottom:6 }}>{selected.name}</h2>
              <span className="tag" style={{ background:stageColor(selected.stage)+"18", color:stageColor(selected.stage) }}>{selected.stage}</span>
            </div>

            {/* Client info */}
            <div style={{ background:"#1a1508", border:`1px solid #2a2618`, borderRadius:10, padding:"12px 14px", marginBottom:18 }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#4a4030", marginBottom:8 }}>Client</div>
              <div style={{ fontSize:13.5, fontWeight:700, color:"#c8b060", marginBottom:2 }}>{selected.client}</div>
              <div style={{ fontSize:12.5, color:"#4a4030" }}>{selected.phone}</div>
            </div>

            {/* Progress */}
            <div style={{ marginBottom:20 }}>
              <div style={{ height:6, background:"#1c1a14", borderRadius:99, overflow:"hidden", marginBottom:4 }}>
                <div style={{ width:`${selected.progress}%`, height:"100%", background:selected.color, borderRadius:99 }} />
              </div>
              <div style={{ fontSize:12, color:"#4a4030" }}>{selected.progress}% complete · {selected.date}</div>
            </div>

            {/* Timeline */}
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#4a4030", marginBottom:12 }}>Timeline</div>
              <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
                {selected.timeline.map((t, i) => (
                  <div key={t.s} style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
                      <div style={{ width:20, height:20, borderRadius:"50%", background:t.done?selected.color+"25":"#1c1a14", border:`2px solid ${t.done?selected.color:"#2a2618"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:t.done?selected.color:"#3a3020", fontWeight:800 }}>
                        {t.done ? "✓" : ""}
                      </div>
                      {i < selected.timeline.length - 1 && <div style={{ width:2, height:24, background: t.done?"#2a2618":"#1c1a14" }} />}
                    </div>
                    <div style={{ paddingBottom:16 }}>
                      <div style={{ fontSize:13, fontWeight:600, color: t.done ? "#c8b060" : "#3a3020" }}>{t.s}</div>
                      <div style={{ fontSize:11, color:"#3a3020" }}>{t.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div style={{ background:"#1a1508", border:`1px solid #2a2618`, borderRadius:10, padding:"12px 14px" }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#4a4030", marginBottom:6 }}>Notes</div>
              <p style={{ fontSize:12.5, color:"#6b5a30", lineHeight:1.65 }}>{selected.notes}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
