/**
 * Units — Wedding Package Comparison Tool
 * Interactive checklist: tick what you want → see which package includes it.
 * Add to Units App routes at /compare
 */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const GOLD  = "#d97706";
const BG    = "#0a0805";
const CARD  = "#120f08";
const B     = "#2a2010";
const TEXT  = "#f0e8d0";
const MUTED = "#8a7a60";

const ITEMS = [
  { id:"photo",      label:"Photography",            icon:"📸", essential:true, premium:true, grand:true },
  { id:"film",       label:"Cinematic Wedding Film", icon:"🎬", essential:true, premium:true, grand:true },
  { id:"teaser",     label:"Wedding Teaser (1 min)", icon:"⚡", essential:false,premium:true, grand:true },
  { id:"drone",      label:"Drone / Aerial Shots",   icon:"🚁", essential:false,premium:true, grand:true },
  { id:"prewed",     label:"Pre-Wedding Shoot",      icon:"💑", essential:false,premium:false,grand:true },
  { id:"candid",     label:"Candid Photography",     icon:"🌟", essential:false,premium:true, grand:true },
  { id:"album",      label:"Printed Photo Album",    icon:"📖", essential:false,premium:false,grand:true },
  { id:"reel",       label:"Instagram Reels (3)",    icon:"📱", essential:false,premium:true, grand:true },
  { id:"second",     label:"Second Shooter",         icon:"👤", essential:false,premium:false,grand:true },
  { id:"highlight",  label:"Highlights Film (5 min)",icon:"✨", essential:false,premium:true, grand:true },
  { id:"ceremony",   label:"Full Ceremony Coverage", icon:"💍", essential:true, premium:true, grand:true },
  { id:"reception",  label:"Reception Coverage",     icon:"🎊", essential:true, premium:true, grand:true },
  { id:"nextday",    label:"Next-Day Edit",          icon:"⏰", essential:false,premium:false,grand:true },
  { id:"rawfiles",   label:"Raw Files Delivered",    icon:"💾", essential:false,premium:false,grand:true },
];

const PACKAGES = {
  essential: {
    name:"Essential",
    price:"₹45,000",
    desc:"Perfect for intimate weddings",
    color:"#9ca3af",
    deliveryDays:21,
    photos:300,
    filmDuration:"5–8 min",
    coverage:"6 hours",
  },
  premium: {
    name:"Premium",
    price:"₹85,000",
    desc:"Our most popular package",
    color:GOLD,
    deliveryDays:28,
    photos:600,
    filmDuration:"10–15 min",
    coverage:"Full day (12 hrs)",
    popular:true,
  },
  grand: {
    name:"Grand",
    price:"₹1,40,000",
    desc:"The complete cinematic experience",
    color:"#e8185d",
    deliveryDays:45,
    photos:1200,
    filmDuration:"20–25 min",
    coverage:"2 days",
  },
};

export default function PackageComparison({ profile }) {
  const nav = useNavigate();
  const [selected, setSelected] = useState(new Set(["photo","film","ceremony","reception"]));

  const toggle = (id) => setSelected(s => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const score = (pkg) => {
    let matches = 0, missing = 0;
    selected.forEach(id => {
      const item = ITEMS.find(i=>i.id===id);
      if (item && item[pkg]) matches++;
      else if (item && !item[pkg]) missing++;
    });
    return { matches, missing, total:selected.size };
  };

  const scores = { essential:score("essential"), premium:score("premium"), grand:score("grand") };
  const best   = Object.entries(scores).sort((a,b)=>b[1].matches-a[1].matches)[0]?.[0];

  const btnBase = { padding:"11px 0", borderRadius:9, border:"none", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", width:"100%", transition:"all 0.15s" };

  return (
    <div style={{ minHeight:"100vh", background:BG, padding:"32px 24px", fontFamily:"'Plus Jakarta Sans',sans-serif", color:TEXT }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      <div style={{ maxWidth:960, margin:"0 auto" }}>

        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ fontSize:11, fontWeight:700, color:GOLD, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:12 }}>Find Your Perfect Package</div>
          <h1 style={{ fontWeight:800, fontSize:"clamp(22px,3vw,32px)", letterSpacing:"-0.03em", marginBottom:10, lineHeight:1.2 }}>What do you want for your wedding?</h1>
          <p style={{ fontSize:14, color:MUTED }}>Tick everything you want → see which package fits you best.</p>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24, alignItems:"start" }}>

          {/* Checklist */}
          <div style={{ background:CARD, border:`1px solid ${B}`, borderRadius:16, padding:24 }}>
            <div style={{ fontWeight:700, fontSize:14, color:TEXT, marginBottom:16 }}>What matters to you?</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {ITEMS.map(item => {
                const active = selected.has(item.id);
                return (
                  <div key={item.id} onClick={()=>toggle(item.id)}
                    style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderRadius:10, cursor:"pointer",
                      background:active?"rgba(217,119,6,0.1)":"transparent",
                      border:`1.5px solid ${active?GOLD:B}`, transition:"all 0.13s" }}>
                    <div style={{ width:20, height:20, borderRadius:5, border:`2px solid ${active?GOLD:B}`, background:active?GOLD:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.13s" }}>
                      {active && <svg width="12" height="9" viewBox="0 0 12 9" fill="none"><path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <span style={{ fontSize:14 }}>{item.icon}</span>
                    <span style={{ fontSize:13, fontWeight:active?600:400, color:active?TEXT:MUTED }}>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Package results */}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {Object.entries(PACKAGES).map(([key, pkg]) => {
              const sc = scores[key];
              const isBest = key === best && selected.size > 0;
              const pct = selected.size ? Math.round((sc.matches/selected.size)*100) : 0;
              return (
                <div key={key} style={{ background:CARD, border:`2px solid ${isBest?pkg.color:B}`, borderRadius:14, padding:"20px",
                  boxShadow:isBest?`0 8px 32px ${pkg.color}20`:"none", position:"relative", transition:"all 0.2s" }}>
                  {isBest && (
                    <div style={{ position:"absolute", top:-11, left:"50%", transform:"translateX(-50%)", background:pkg.color, color:"#fff", fontSize:10, fontWeight:700, padding:"2px 12px", borderRadius:99, letterSpacing:"0.06em", textTransform:"uppercase", whiteSpace:"nowrap" }}>
                      Best Match ✦
                    </div>
                  )}
                  {pkg.popular && !isBest && (
                    <div style={{ position:"absolute", top:-11, right:16, background:"#374151", color:"#ccc", fontSize:10, fontWeight:700, padding:"2px 12px", borderRadius:99, textTransform:"uppercase" }}>Most Popular</div>
                  )}

                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, color:pkg.color, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:3 }}>{pkg.name}</div>
                      <div style={{ fontSize:22, fontWeight:800, color:TEXT, letterSpacing:"-0.03em" }}>{pkg.price}</div>
                      <div style={{ fontSize:11.5, color:MUTED, marginTop:2 }}>{pkg.desc}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:24, fontWeight:800, color:pct>=80?pkg.color:pct>=50?GOLD:MUTED }}>{pct}%</div>
                      <div style={{ fontSize:10, color:MUTED }}>match</div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ height:4, background:B, borderRadius:4, marginBottom:12, overflow:"hidden" }}>
                    <div style={{ height:4, borderRadius:4, background:pkg.color, width:`${pct}%`, transition:"width 0.4s ease" }}/>
                  </div>

                  {/* Stats */}
                  <div style={{ display:"flex", gap:12, marginBottom:14 }}>
                    {[
                      [pkg.coverage,"Coverage"],
                      [pkg.photos+"+ photos","Photos"],
                      [pkg.filmDuration,"Film"],
                    ].map(([v,l])=>(
                      <div key={l} style={{ flex:1, padding:"8px", background:B, borderRadius:8, textAlign:"center" }}>
                        <div style={{ fontSize:11.5, fontWeight:600, color:TEXT }}>{v}</div>
                        <div style={{ fontSize:10, color:MUTED, marginTop:2 }}>{l}</div>
                      </div>
                    ))}
                  </div>

                  {/* Missing items */}
                  {sc.missing > 0 && (
                    <div style={{ fontSize:11.5, color:MUTED, marginBottom:12 }}>
                      ✗ Missing {sc.missing} item{sc.missing>1?"s":""} you selected
                    </div>
                  )}

                  <button
                    onClick={()=>nav("/book")}
                    style={{ ...btnBase, background:isBest?pkg.color:B, color:isBest?"#fff":MUTED,
                      border:`1px solid ${isBest?pkg.color:B}` }}>
                    {isBest ? `Book ${pkg.name} →` : `Learn More`}
                  </button>
                </div>
              );
            })}

            <div style={{ fontSize:12, color:MUTED, textAlign:"center", lineHeight:1.6 }}>
              All packages include delivery on digital drives + cloud link.<br/>
              Delivery in {PACKAGES.essential.deliveryDays}–{PACKAGES.grand.deliveryDays} days. Travel outside Coimbatore extra.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
