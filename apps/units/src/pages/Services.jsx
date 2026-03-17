import React, { useState } from "react";
import { Link } from "react-router-dom";

const GOLD = "#d4a843";
const PINK = "#e8185d";
const B    = "#1c1a14";

const SERVICES = [
  {
    id:"wedding-film",
    icon:"◎",
    category:"Videography",
    title:"Wedding Film",
    tagline:"Cinematic storytelling for your most important day",
    color:GOLD,
    packages:[
      { name:"Essential",  price:"₹45,000",  duration:"8 hrs",   includes:["1 cinematographer","Raw footage","5-min highlights","Ceremony coverage"] },
      { name:"Premium",    price:"₹85,000",  duration:"12 hrs",  includes:["2 cinematographers","Drone shots","10-min feature film","Getting ready + ceremony + reception","Same-day edit teaser"] },
      { name:"Signature",  price:"₹1,40,000",duration:"Full day",includes:["3-person crew","Drone + gimbal","Full documentary film","2 highlight reels","Pre-wedding short included"] },
    ]
  },
  {
    id:"photography",
    icon:"◇",
    category:"Photography",
    title:"Wedding Photography",
    tagline:"Timeless frames that capture every stolen glance",
    color:"#a0c878",
    packages:[
      { name:"Classic",    price:"₹35,000",  duration:"8 hrs",   includes:["1 photographer","300+ edited photos","Online gallery","Print-ready files"] },
      { name:"Deluxe",     price:"₹65,000",  duration:"12 hrs",  includes:["2 photographers","600+ edited photos","Drone shots","Premium album included"] },
      { name:"Elite",      price:"₹1,10,000",duration:"Full day",includes:["2 photographers + assistant","800+ edits","Drone + candid","2 premium albums","Pre-wedding session included"] },
    ]
  },
  {
    id:"pre-wedding",
    icon:"◑",
    category:"Photography + Video",
    title:"Pre-Wedding Shoot",
    tagline:"Tell your love story before the big day",
    color:"#c8a0e0",
    packages:[
      { name:"Story",      price:"₹18,000",  duration:"3 hrs",   includes:["1 location","50 edited photos","1-min reel","2-person crew"] },
      { name:"Cinematic",  price:"₹35,000",  duration:"6 hrs",   includes:["2 locations","100+ edited photos","3-min film","Drone + gimbal"] },
      { name:"Destination",price:"₹75,000",  duration:"2 days",  includes:["Multiple locations","Unlimited edits","Full short film","Travel included"] },
    ]
  },
  {
    id:"corporate",
    icon:"⬡",
    category:"Brand Video",
    title:"Corporate & Events",
    tagline:"Brand videos, product launches, company events",
    color:PINK,
    packages:[
      { name:"Event",      price:"₹25,000",  duration:"5 hrs",   includes:["1 videographer","Highlights reel","3-min recap video","Color graded"] },
      { name:"Brand Film",  price:"₹60,000", duration:"Full day",includes:["2-person crew","Scriptwriting support","3–5 min brand film","4K delivery"] },
      { name:"Campaign",   price:"₹1,20,000",duration:"2 days",  includes:["Full production team","Director + DP","Multiple deliverables","Social cuts included"] },
    ]
  },
  {
    id:"editing",
    icon:"⬟",
    category:"Post Production",
    title:"Editing & Color Grade",
    tagline:"Bring your raw footage to life",
    color:"#70b8d0",
    packages:[
      { name:"Basic Edit",    price:"₹8,000",  duration:"3-5 days",  includes:["Up to 2 hrs footage","Cuts + music sync","Basic color grade","1 round of revisions"] },
      { name:"Full Grade",    price:"₹18,000", duration:"5-7 days",  includes:["Up to 5 hrs footage","Full color grading","Sound mix","2 revisions"] },
      { name:"Premium Post",  price:"₹35,000", duration:"10-14 days",includes:["Unlimited footage","Cinematic LUTs","VFX if needed","3 revisions + DCP export"] },
    ]
  },
];

export default function Services() {
  const [open, setOpen] = useState("wedding-film");
  const active = SERVICES.find(s=>s.id===open);

  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", padding:"32px 28px 80px", background:"#0a0805", minHeight:"100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .svc-tab{padding:10px 18px;border-radius:10px;cursor:pointer;border:1px solid ${B};transition:all 0.15s;font-family:'Plus Jakarta Sans',sans-serif;}
        .svc-tab:hover{border-color:#2a2416;}
        .svc-tab.on{border-color:${GOLD}40;background:#150f04;}
        .pkg-card{background:#0f0c08;border:1px solid ${B};border-radius:12px;padding:22px;flex:1;min-width:200px;transition:border-color 0.18s;}
        .pkg-card:hover{border-color:#2a2416;}
        .check{display:flex;align-items:flex-start;gap:8px;font-size:12.5px;color:#8a7a50;line-height:1.5;margin-bottom:6px;}
        @media(max-width:700px){.pkg-row{flex-direction:column!important}}
      `}</style>

      <div style={{ marginBottom:32 }}>
        <h1 style={{ fontWeight:800, fontSize:"clamp(20px,2.5vw,26px)", letterSpacing:"-0.03em", color:"#e8d5a0", marginBottom:4 }}>Services</h1>
        <p style={{ fontSize:13.5, color:"#4a4030" }}>Every package is crafted for real moments — not just photos and videos.</p>
      </div>

      {/* Service tabs */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:32 }}>
        {SERVICES.map(s=>(
          <button key={s.id} className={`svc-tab${open===s.id?" on":""}`} onClick={()=>setOpen(s.id)}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:15, color:open===s.id?s.color:"#4a4030" }}>{s.icon}</span>
              <span style={{ fontSize:13, fontWeight:600, color:open===s.id?"#c8b87a":"#5a5040" }}>{s.title}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Active service */}
      {active && (
        <div>
          {/* Header */}
          <div style={{ marginBottom:28 }}>
            <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:active.color, marginBottom:8 }}>{active.category}</div>
            <h2 style={{ fontWeight:800, fontSize:"clamp(22px,3vw,32px)", letterSpacing:"-0.035em", color:"#e8d5a0", marginBottom:8 }}>{active.title}</h2>
            <p style={{ fontSize:14.5, color:"#6a5a30" }}>{active.tagline}</p>
          </div>

          {/* Packages */}
          <div className="pkg-row" style={{ display:"flex", gap:14, alignItems:"stretch" }}>
            {active.packages.map((pkg, i)=>(
              <div key={pkg.name} className="pkg-card" style={{ borderColor: i===1 ? active.color+"40" : B, position:"relative" }}>
                {i===1 && <div style={{ position:"absolute", top:-10, left:"50%", transform:"translateX(-50%)", background:active.color, color:"#0a0805", fontSize:10, fontWeight:800, padding:"2px 10px", borderRadius:99, letterSpacing:"0.06em", textTransform:"uppercase", whiteSpace:"nowrap" }}>Most popular</div>}
                <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#4a4030", marginBottom:10 }}>{pkg.name}</div>
                <div style={{ fontSize:26, fontWeight:800, color:i===1?active.color:"#c8b87a", letterSpacing:"-0.04em", marginBottom:4 }}>{pkg.price}</div>
                <div style={{ fontSize:12, color:"#4a4030", marginBottom:20 }}>{pkg.duration}</div>
                <div style={{ flex:1, marginBottom:24 }}>
                  {pkg.includes.map((item,j)=>(
                    <div key={j} className="check">
                      <span style={{ color:active.color, fontSize:10, marginTop:3, flexShrink:0 }}>✦</span>
                      {item}
                    </div>
                  ))}
                </div>
                <Link to="/book" style={{ display:"block", textAlign:"center", padding:"10px 0", borderRadius:9, background:i===1?active.color:"transparent", color:i===1?"#0a0805":"#8a7a50", border:`1px solid ${i===1?"transparent":B}`, fontSize:13.5, fontWeight:700, textDecoration:"none", transition:"all 0.15s" }}>
                  Book this package →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom note */}
      <div style={{ marginTop:40, background:"#0f0c08", border:`1px solid ${B}`, borderRadius:12, padding:"22px 24px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 }}>
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:"#c8b87a", marginBottom:4 }}>Need something custom?</div>
          <div style={{ fontSize:13, color:"#4a4030" }}>We work with every budget. Tell us your vision and we'll put together a package for you.</div>
        </div>
        <Link to="/book" style={{ padding:"10px 22px", background:GOLD, color:"#0a0805", borderRadius:9, fontSize:13.5, fontWeight:800, textDecoration:"none" }}>Get a custom quote →</Link>
      </div>
    </div>
  );
}
