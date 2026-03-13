import React, { useState } from "react";

const GOLD = "#d4a843";
const B    = "#1c1a14";

const CATEGORIES = ["All","Wedding Films","Photography","Pre-Wedding","Corporate"];

const WORKS = [
  { id:1,  title:"Arjun & Sneha",    cat:"Wedding Films",  loc:"Coimbatore",   year:"2024", tag:"Feature Film",   aspect:"landscape", desc:"A 10-minute cinematic feature capturing every tear, laugh, and quiet moment across a 2-day celebration.",     color:"#d4a843", thumb:"wedding-1" },
  { id:2,  title:"The Sharma Nuptials",cat:"Photography", loc:"Ooty",          year:"2024", tag:"800+ Photos",    aspect:"portrait",  desc:"Mist, mountains, and a love story — 800+ frames from a destination wedding in the Nilgiris.",                  color:"#a0c878", thumb:"photo-1"   },
  { id:3,  title:"Kavya & Dev",       cat:"Pre-Wedding",  loc:"Pondicherry",   year:"2024", tag:"Cinematic Short",aspect:"landscape", desc:"A 3-minute seaside pre-wedding with golden hour drone and underwater shots.",                                  color:"#c8a0e0", thumb:"pre-1"     },
  { id:4,  title:"Meera & Rohan",     cat:"Wedding Films",loc:"Chennai",        year:"2024", tag:"Highlights Reel",aspect:"landscape", desc:"Fast-cut 4-minute highlights from a temple wedding, set to a live-recorded carnatic score.",                   color:GOLD,      thumb:"wedding-2" },
  { id:5,  title:"ThinkBox Launch",   cat:"Corporate",    loc:"Bangalore",     year:"2024", tag:"Brand Film",     aspect:"portrait",  desc:"3-minute product launch film for a B2B SaaS company — scripted, directed, and edited in 5 days.",              color:"#e87070", thumb:"corp-1"    },
  { id:6,  title:"Raj & Priya",       cat:"Photography",  loc:"Kerala Backwaters",year:"2023",tag:"600 Edits",  aspect:"landscape", desc:"600 edited photos from a 2-day houseboat wedding on the Kerala backwaters.",                                   color:"#70b8d0", thumb:"photo-2"   },
  { id:7,  title:"Aisha & Farhan",    cat:"Pre-Wedding",  loc:"Kodaikanal",    year:"2023", tag:"Photo + Film",  aspect:"portrait",  desc:"Misty hills, rain, and genuine laughter — our most-shared pre-wedding of 2023.",                               color:"#c8a0e0", thumb:"pre-2"     },
  { id:8,  title:"NovaTech Event",    cat:"Corporate",    loc:"Hyderabad",     year:"2024", tag:"Event Coverage", aspect:"landscape", desc:"5-hour annual summit coverage — highlights reel + brand documentary delivered in 48 hours.",                   color:"#e87070", thumb:"corp-2"    },
  { id:9,  title:"Divya & Suresh",    cat:"Wedding Films",loc:"Madurai",       year:"2023", tag:"Full Documentary",aspect:"landscape",desc:"Our longest film — 18 minutes following a traditional Brahmin wedding across three days.",                    color:GOLD,      thumb:"wedding-3" },
];

const BG_COLORS = {
  "wedding-1":"#1a1208","photo-1":"#0e1a0a","pre-1":"#140e1a","wedding-2":"#1a1208",
  "corp-1":"#1a0a0a","photo-2":"#0a1218","pre-2":"#140e1a","corp-2":"#1a0a0a","wedding-3":"#1a1208"
};

export default function Portfolio() {
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null);

  const shown = WORKS.filter(w => filter==="All" || w.cat===filter);

  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", padding:"32px 28px 80px", background:"#0a0805", minHeight:"100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .filter-btn{padding:6px 16px;border-radius:8px;font-size:12.5px;font-weight:600;cursor:pointer;border:1px solid ${B};font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.14s;}
        .filter-btn.on{background:${GOLD};color:#0a0805;border-color:${GOLD};}
        .filter-btn.off{background:transparent;color:#5a5040;}
        .filter-btn.off:hover{color:#a09060;border-color:#2a2416;}
        .work-card{border:1px solid ${B};border-radius:14px;overflow:hidden;cursor:pointer;transition:all 0.2s;}
        .work-card:hover{border-color:#2a2416;transform:translateY(-2px);}
        .work-card.sel{border-color:${GOLD}60;}
        @media(max-width:700px){.port-g{grid-template-columns:1fr!important}}
      `}</style>

      <div style={{ marginBottom:32 }}>
        <h1 style={{ fontWeight:800, fontSize:"clamp(20px,2.5vw,26px)", letterSpacing:"-0.03em", color:"#e8d5a0", marginBottom:4 }}>Portfolio</h1>
        <p style={{ fontSize:13.5, color:"#4a4030" }}>Every frame tells a story. Here are some of ours.</p>
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:28 }}>
        {CATEGORIES.map(c=>(
          <button key={c} className={`filter-btn ${filter===c?"on":"off"}`} onClick={()=>setFilter(c)}>{c}</button>
        ))}
      </div>

      {/* Grid */}
      <div className="port-g" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
        {shown.map(w=>(
          <div key={w.id} className={`work-card${selected?.id===w.id?" sel":""}`} onClick={()=>setSelected(w)}>
            {/* Simulated thumbnail */}
            <div style={{
              height: w.aspect==="portrait" ? 260 : 180,
              background: BG_COLORS[w.thumb] || "#150f04",
              display:"flex", alignItems:"center", justifyContent:"center",
              position:"relative", overflow:"hidden"
            }}>
              <div style={{ position:"absolute", inset:0, background:`radial-gradient(circle at 40% 50%, ${w.color}18 0%, transparent 65%)` }} />
              <div style={{ textAlign:"center", zIndex:1, padding:16 }}>
                <div style={{ fontSize:28, color:w.color+"50", marginBottom:8 }}>◎</div>
                <div style={{ fontSize:11, fontWeight:700, color:w.color+"70", textTransform:"uppercase", letterSpacing:"0.1em" }}>{w.tag}</div>
              </div>
              <div style={{ position:"absolute", bottom:10, right:12, fontSize:10, fontWeight:600, color:"#ffffff30", letterSpacing:"0.06em" }}>{w.year}</div>
            </div>
            <div style={{ padding:"14px 16px", background:"#0f0c08" }}>
              <div style={{ fontSize:14, fontWeight:700, color:"#c8b87a", marginBottom:3, letterSpacing:"-0.01em" }}>{w.title}</div>
              <div style={{ fontSize:12, color:"#4a4030" }}>{w.loc} · {w.cat}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selected && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999, padding:20 }} onClick={()=>setSelected(null)}>
          <div style={{ background:"#0f0c08", border:`1px solid ${B}`, borderRadius:18, maxWidth:560, width:"100%", overflow:"hidden" }} onClick={e=>e.stopPropagation()}>
            <div style={{ height:220, background:BG_COLORS[selected.thumb]||"#150f04", display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
              <div style={{ position:"absolute", inset:0, background:`radial-gradient(circle at 40% 50%, ${selected.color}25 0%, transparent 65%)` }} />
              <div style={{ textAlign:"center", zIndex:1 }}>
                <div style={{ fontSize:48, color:selected.color+"40" }}>◎</div>
                <div style={{ fontSize:12, fontWeight:700, color:selected.color+"80", textTransform:"uppercase", letterSpacing:"0.1em", marginTop:10 }}>{selected.tag}</div>
              </div>
              <button onClick={()=>setSelected(null)} style={{ position:"absolute", top:14, right:14, background:"rgba(0,0,0,0.5)", border:"none", color:"#fff", fontSize:16, cursor:"pointer", width:30, height:30, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
            </div>
            <div style={{ padding:28 }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:selected.color, marginBottom:8 }}>{selected.cat} · {selected.year}</div>
              <h2 style={{ fontWeight:800, fontSize:22, color:"#e8d5a0", letterSpacing:"-0.03em", marginBottom:6 }}>{selected.title}</h2>
              <div style={{ fontSize:12.5, color:"#4a4030", marginBottom:14 }}>📍 {selected.loc}</div>
              <p style={{ fontSize:14, color:"#8a7a50", lineHeight:1.72, marginBottom:24 }}>{selected.desc}</p>
              <div style={{ display:"flex", gap:10 }}>
                <button style={{ flex:1, padding:"11px 0", background:GOLD, color:"#0a0805", border:"none", borderRadius:9, fontSize:13.5, fontWeight:800, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  Book similar shoot →
                </button>
                <button onClick={()=>setSelected(null)} style={{ padding:"11px 18px", background:"transparent", color:"#5a5040", border:`1px solid ${B}`, borderRadius:9, fontSize:13, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
