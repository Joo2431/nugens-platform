import React, { useState } from "react";

const GOLD = "#d4a843";
const PINK = "#e8185d";
const B    = "#1c1a14";

const STAGES = ["Booked","Shoot Day","Selects","Editing","Color Grade","Client Review","Delivered"];

const PROJECTS = [
  {
    id:1, client:"Arya & Karthik",   type:"Wedding Film",      date:"Apr 5",  due:"Apr 26", stage:"Booked",
    notes:"Full day coverage, 3-person crew. Venue: Suguna Kalyana Mahal.",
    deliverables:["Feature film (10 min)","Ceremony highlights (3 min)","Drone reel","Raw footage backup"],
    color:GOLD,
  },
  {
    id:2, client:"Divya & Suresh",   type:"Wedding Film",      date:"Mar 2",  due:"Mar 20", stage:"Editing",
    notes:"2 cinematographers. Gimbal + drone used. 8 hrs footage raw.",
    deliverables:["Feature film (8 min)","Highlights reel","Same-day edit"],
    color:GOLD,
  },
  {
    id:3, client:"Raj & Meera",      type:"Wedding Highlights", date:"Feb 28", due:"Mar 16", stage:"Client Review",
    notes:"Quick turnaround requested. 3-min highlights only.",
    deliverables:["3-min highlights reel"],
    color:"#a0c878",
  },
  {
    id:4, client:"Kavya Nair",       type:"Corporate Event",   date:"Mar 8",  due:"Mar 22", stage:"Color Grade",
    notes:"Annual company event, 5 hrs coverage, brand video 3 min.",
    deliverables:["Event recap (5 min)","Brand film (3 min)"],
    color:PINK,
  },
  {
    id:5, client:"ThinkBox Co.",     type:"Brand Video",       date:"Apr 1",  due:"Apr 14", stage:"Booked",
    notes:"2-day shoot, scripted commercial for product launch.",
    deliverables:["90-sec brand film","Social cuts (15s, 30s)","BTS reel"],
    color:PINK,
  },
  {
    id:6, client:"Priya Sharma",     type:"Pre-Wedding",       date:"Mar 28", due:"Apr 5",  stage:"Booked",
    notes:"Outdoor shoot, 2 locations in Coimbatore. Drone + gimbal.",
    deliverables:["3-min cinematic short","100+ edited photos"],
    color:"#c8a0e0",
  },
];

export default function Projects() {
  const [selected, setSelected] = useState(null);

  const stageIdx = (s) => STAGES.indexOf(s);

  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", padding:"32px 28px 80px", background:"#0a0805", minHeight:"100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .p-card{background:#0f0c08;border:1px solid ${B};border-radius:12px;padding:18px;cursor:pointer;transition:all 0.18s;}
        .p-card:hover{border-color:#2a2416;transform:translateY(-1px);}
        .p-card.sel{border-color:${GOLD}50;background:#120d04;}
        .tag{display:inline-block;padding:2px 8px;border-radius:5px;font-size:10.5px;font-weight:600;}
        .prog{height:5px;background:#1c1a14;border-radius:99px;overflow:hidden;}
        @media(max-width:900px){.p-layout{grid-template-columns:1fr!important}}
        @media(max-width:640px){.p-g{grid-template-columns:1fr!important}}
      `}</style>

      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontWeight:800, fontSize:"clamp(20px,2.5vw,26px)", letterSpacing:"-0.03em", color:"#e8d5a0", marginBottom:4 }}>Projects</h1>
        <p style={{ fontSize:13.5, color:"#4a4030" }}>Track every production from booking to delivery.</p>
      </div>

      {/* Pipeline stats */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:28 }}>
        {STAGES.map(s=>(
          <div key={s} style={{ background:"#0f0c08", border:`1px solid ${B}`, borderRadius:8, padding:"10px 14px" }}>
            <div style={{ fontSize:18, fontWeight:800, color:GOLD, letterSpacing:"-0.03em" }}>{PROJECTS.filter(p=>p.stage===s).length}</div>
            <div style={{ fontSize:11, color:"#4a4030", marginTop:2 }}>{s}</div>
          </div>
        ))}
      </div>

      <div className="p-layout" style={{ display:"grid", gridTemplateColumns:"1fr 380px", gap:16, alignItems:"start" }}>
        {/* Grid */}
        <div className="p-g" style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 }}>
          {PROJECTS.map(p=>{
            const pct = Math.round(((stageIdx(p.stage)+1)/STAGES.length)*100);
            return (
              <div key={p.id} className={`p-card${selected?.id===p.id?" sel":""}`} onClick={()=>setSelected(p)}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                  <div>
                    <div style={{ fontSize:11, color:"#4a4030", marginBottom:2 }}>{p.type}</div>
                    <div style={{ fontSize:14, fontWeight:700, color:"#c8b87a", lineHeight:1.3 }}>{p.client}</div>
                  </div>
                  <span className="tag" style={{ background:p.color+"18", color:p.color, flexShrink:0, marginLeft:8 }}>{p.stage}</span>
                </div>
                <div className="prog" style={{ marginBottom:4 }}>
                  <div style={{ width:`${pct}%`, height:"100%", background:p.color, borderRadius:99 }} />
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#4a4030" }}>
                  <span>{pct}%</span><span>Due {p.due}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail */}
        {selected ? (
          <div style={{ background:"#0f0c08", border:`1px solid ${B}`, borderRadius:14, padding:24, position:"sticky", top:20 }}>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, color:"#4a4030", marginBottom:4 }}>{selected.type}</div>
              <h2 style={{ fontWeight:800, fontSize:18, color:"#e8d5a0", letterSpacing:"-0.025em", marginBottom:6 }}>{selected.client}</h2>
              <span className="tag" style={{ background:selected.color+"18", color:selected.color }}>{selected.stage}</span>
            </div>

            {/* Stage pipeline */}
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#4a4030", marginBottom:10 }}>Progress</div>
              <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                {STAGES.map((s,i)=>{
                  const done = i <= stageIdx(selected.stage);
                  const current = s === selected.stage;
                  return (
                    <div key={s} style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:16, height:16, borderRadius:4, background:done?selected.color+"20":B, border:`1.5px solid ${done?selected.color:"#2a2010"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        {done && <span style={{ fontSize:8, color:selected.color, fontWeight:800 }}>✓</span>}
                      </div>
                      <span style={{ fontSize:12.5, fontWeight:current?700:400, color:current?"#e8d5a0":done?"#8a7a50":"#3a3020" }}>{s}</span>
                      {current && <span style={{ fontSize:10, color:selected.color, marginLeft:2 }}>← now</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
              {[{ label:"Shoot date", v:selected.date }, { label:"Due", v:selected.due }].map(f=>(
                <div key={f.label} style={{ background:"#0d0a06", borderRadius:8, padding:"10px 12px" }}>
                  <div style={{ fontSize:11, color:"#4a4030", marginBottom:2 }}>{f.label}</div>
                  <div style={{ fontSize:13.5, fontWeight:700, color:"#a08850" }}>{f.v}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#4a4030", marginBottom:8 }}>Notes</div>
              <p style={{ fontSize:12.5, color:"#6a5a30", lineHeight:1.65 }}>{selected.notes}</p>
            </div>

            <div>
              <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#4a4030", marginBottom:8 }}>Deliverables</div>
              {selected.deliverables.map((d,i)=>(
                <div key={i} style={{ display:"flex", gap:8, alignItems:"center", padding:"7px 0", borderBottom:`1px solid #150f04` }}>
                  <span style={{ fontSize:10, color:selected.color }}>✦</span>
                  <span style={{ fontSize:12.5, color:"#8a7a50" }}>{d}</span>
                </div>
              ))}
            </div>

            <button style={{ width:"100%", marginTop:20, padding:"11px 0", background:GOLD, color:"#0a0805", border:"none", borderRadius:9, fontSize:14, fontWeight:800, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              Mark next stage →
            </button>
          </div>
        ) : (
          <div style={{ background:"#0f0c08", border:`1px solid ${B}`, borderRadius:14, padding:40, textAlign:"center" }}>
            <div style={{ fontSize:28, marginBottom:12, color:"#2a2010" }}>◑</div>
            <div style={{ fontSize:13.5, color:"#3a3020" }}>Select a project to view details</div>
          </div>
        )}
      </div>
    </div>
  );
}
