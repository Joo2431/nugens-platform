/**
 * Units — Business Production Package Comparison Tool
 * Interactive checklist: tick what you want → see which package includes it.
 * Route: /compare
 */
import React, { useState } from "react";

const GOLD    = "#d4a843";
const BG_DARK = "#0a0805";
const BORDER  = "#1c1a14";
const TEXT    = "#e8e0c8";
const MUTED   = "#8a7a50";

const FEATURES = [
  { id:"brand-film",   label:"Brand Film (3–5 min)",    icon:"🎬", essential:true  },
  { id:"reels",        label:"Social Reels (4 per mo)",  icon:"⚡", essential:false },
  { id:"product",      label:"Product Photography",      icon:"📸", essential:true  },
  { id:"identity",     label:"Brand Identity Design",    icon:"🎨", essential:true  },
  { id:"strategy",     label:"Content Strategy",         icon:"📋", essential:false },
  { id:"drone",        label:"Drone / Aerial Shots",     icon:"🚁", essential:false },
  { id:"printing",     label:"Print Collateral Design",  icon:"🖨️", essential:false },
];

const PACKAGES = [
  {
    name:"Starter",
    price:"₹35,000",
    desc:"Perfect for new brands getting off the ground",
    color:GOLD,
    included:["brand-film","product","identity"],
  },
  {
    name:"Growth",
    price:"₹65,000",
    desc:"For brands ready to scale their content game",
    color:"#a0c878",
    included:["brand-film","reels","product","identity","strategy"],
  },
  {
    name:"Premium",
    price:"₹1,20,000",
    desc:"Full production partnership for serious brands",
    color:"#c8a0e0",
    included:["brand-film","reels","product","identity","strategy","drone","printing"],
  },
];

export default function PackageComparison() {
  const [selected, setSelected] = useState(new Set());
  const toggle = (id) => setSelected(s => {
    const ns = new Set(s);
    ns.has(id) ? ns.delete(id) : ns.add(id);
    return ns;
  });

  const bestMatch = () => {
    if (selected.size === 0) return null;
    return PACKAGES.find(p => [...selected].every(f => p.included.includes(f))) || PACKAGES[PACKAGES.length - 1];
  };
  const match = bestMatch();

  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", padding:"32px 28px 80px", background:BG_DARK, minHeight:"100vh", color:TEXT }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      <div style={{ textAlign:"center", marginBottom:32 }}>
        <div style={{ fontSize:11, fontWeight:800, letterSpacing:"0.12em", color:GOLD, textTransform:"uppercase", marginBottom:8 }}>Find Your Perfect Package</div>
        <h1 style={{ fontWeight:800, fontSize:"clamp(22px,3vw,32px)", letterSpacing:"-0.03em", lineHeight:1.25, marginBottom:8 }}>
          What do you need for your brand?
        </h1>
        <p style={{ fontSize:13, color:MUTED }}>Tick everything you want → see which package fits you best.</p>
      </div>

      <div style={{ display:"flex", justifyContent:"center", marginBottom:28 }}>
        <div style={{ maxWidth:420, width:"100%" }}>
          <div style={{ fontSize:12, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12 }}>What matters to you?</div>
          {FEATURES.map(f => (
            <label key={f.id} onClick={()=>toggle(f.id)} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderRadius:10, border:`1px solid ${selected.has(f.id) ? GOLD+"40" : BORDER}`, background:selected.has(f.id) ? "#150f04" : "transparent", marginBottom:8, cursor:"pointer", transition:"all 0.15s" }}>
              <div style={{ width:22, height:22, borderRadius:6, border:`2px solid ${selected.has(f.id) ? GOLD : MUTED}`, background:selected.has(f.id) ? GOLD : "transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"#fff", flexShrink:0 }}>{selected.has(f.id) ? "✓" : ""}</div>
              <span style={{ fontSize:14, fontWeight:600 }}>{f.icon} {f.label}</span>
              {f.essential && <span style={{ marginLeft:"auto", fontSize:9, fontWeight:700, background:GOLD+"20", color:GOLD, padding:"2px 8px", borderRadius:5 }}>Popular</span>}
            </label>
          ))}
        </div>
      </div>

      {/* Packages */}
      <div style={{ display:"flex", gap:16, justifyContent:"center", flexWrap:"wrap" }}>
        {PACKAGES.map(pkg => {
          const isMatch = match?.name === pkg.name;
          return (
            <div key={pkg.name} style={{ width:260, background:isMatch ? "#150f04" : "#0f0c08", border:`1.5px solid ${isMatch ? pkg.color : BORDER}`, borderRadius:16, padding:"24px 22px", position:"relative", transition:"all 0.2s" }}>
              {isMatch && <div style={{ position:"absolute", top:-10, right:16, background:pkg.color, color:"#fff", fontSize:10, fontWeight:800, padding:"3px 10px", borderRadius:6 }}>BEST MATCH</div>}
              <div style={{ fontSize:11, fontWeight:800, color:pkg.color, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>{pkg.name}</div>
              <div style={{ fontSize:28, fontWeight:900, letterSpacing:"-0.03em", marginBottom:4 }}>{pkg.price}</div>
              <div style={{ fontSize:12, color:MUTED, marginBottom:16 }}>{pkg.desc}</div>
              {FEATURES.map(f => {
                const has = pkg.included.includes(f.id);
                return (
                  <div key={f.id} style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:has ? TEXT : MUTED+"60", marginBottom:5 }}>
                    <span style={{ color:has ? "#16a34a" : "#dc2626", fontSize:11 }}>{has ? "✓" : "✗"}</span>
                    {f.label}
                  </div>
                );
              })}
              <a href="/book" style={{ display:"block", textAlign:"center", marginTop:16, padding:"10px 0", background:isMatch ? pkg.color : "transparent", border:`1px solid ${pkg.color}`, color:isMatch ? "#fff" : pkg.color, borderRadius:9, fontSize:12, fontWeight:700, textDecoration:"none" }}>
                {isMatch ? `Book ${pkg.name} →` : "View Details"}
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
