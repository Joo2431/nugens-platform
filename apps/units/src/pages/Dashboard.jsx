import React from "react";
import { Link } from "react-router-dom";

const GOLD = "#d4a843";
const PINK = "#e8185d";
const B    = "#1c1a14";

const BOOKINGS = [
  { client:"Arya & Karthik",   type:"Wedding Film",      date:"Apr 5",   status:"Confirmed", color:GOLD   },
  { client:"Priya Sharma",     type:"Pre-Wedding Shoot", date:"Mar 28",  status:"Confirmed", color:"#a0c878"},
  { client:"The Nairs",        type:"Reception Coverage",date:"Apr 12",  status:"Pending",   color:"#c8a0e0"},
  { client:"Meena & Rohan",    type:"Baby Shower",       date:"Apr 18",  status:"Confirmed", color:GOLD   },
];

const PROJECTS = [
  { client:"Divya & Suresh",  type:"Wedding Film",      status:"Editing",     progress:70, due:"Mar 20", color:GOLD    },
  { client:"Kavya Nair",      type:"Corporate Event",   status:"Color Grade", progress:45, due:"Mar 22", color:"#a0c878"},
  { client:"Raj & Meera",     type:"Wedding Highlights",status:"Review",      progress:90, due:"Mar 16", color:"#c8a0e0"},
  { client:"ThinkBox Co.",    type:"Brand Video",       status:"Shooting",    progress:20, due:"Apr 1",  color:PINK    },
];

export default function Dashboard({ profile }) {
  const firstName = (profile?.full_name || "").split(" ")[0] || "there";

  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", padding:"32px 28px 80px", background:"#0a0805", minHeight:"100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .u-card{background:#0f0c08;border:1px solid ${B};border-radius:12px;padding:20px;transition:border-color 0.18s;}
        .u-card:hover{border-color:#2a2416;}
        .stat{background:#0f0c08;border:1px solid ${B};border-radius:10px;padding:16px 18px;}
        .prog{height:4px;background:#1c1a14;border-radius:99px;overflow:hidden;margin-top:8px;}
        .tag{display:inline-block;padding:2px 8px;border-radius:5px;font-size:10.5px;font-weight:600;}
        @media(max-width:700px){.s4{grid-template-columns:1fr 1fr!important}.two{grid-template-columns:1fr!important}}
      `}</style>

      <div style={{ marginBottom:32 }}>
        <h1 style={{ fontWeight:800, fontSize:"clamp(20px,2.5vw,26px)", letterSpacing:"-0.03em", color:"#e8d5a0", marginBottom:4 }}>
          Welcome back, {firstName} ✦
        </h1>
        <p style={{ fontSize:13.5, color:"#4a4030" }}>Here's your production schedule and active projects.</p>
      </div>

      {/* Stats */}
      <div className="s4" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:32 }}>
        {[
          { label:"Bookings this month", value:"8",    sub:"3 weddings, 5 events", color:GOLD        },
          { label:"Active projects",     value:"4",    sub:"2 in edit",            color:"#a0c878"   },
          { label:"Hours logged",        value:"142h", sub:"This month",           color:"#c8a0e0"   },
          { label:"Deliveries due",      value:"3",    sub:"Next 7 days",          color:PINK        },
        ].map(s=>(
          <div key={s.label} className="stat">
            <div style={{ fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.07em", color:"#4a4030", marginBottom:6 }}>{s.label}</div>
            <div style={{ fontSize:24, fontWeight:800, letterSpacing:"-0.04em", color:s.color, lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:11.5, color:"#4a4030", marginTop:4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="two" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        {/* Upcoming bookings */}
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ fontSize:13, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:"#4a4030" }}>Upcoming bookings</div>
            <Link to="/book" style={{ fontSize:12, color:GOLD, textDecoration:"none", fontWeight:600 }}>+ New →</Link>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
            {BOOKINGS.map(b=>(
              <div key={b.client} className="u-card" style={{ display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:3, height:44, borderRadius:99, background:b.color, flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13.5, fontWeight:700, color:"#c8b87a" }}>{b.client}</div>
                  <div style={{ fontSize:12, color:"#4a4030" }}>{b.type}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:12, color:"#6a5a30", marginBottom:3 }}>{b.date}</div>
                  <span className="tag" style={{ background:b.status==="Confirmed"?GOLD+"18":"#2a2010", color:b.status==="Confirmed"?GOLD:"#6a5a30" }}>{b.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active projects */}
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ fontSize:13, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:"#4a4030" }}>Production pipeline</div>
            <Link to="/projects" style={{ fontSize:12, color:GOLD, textDecoration:"none", fontWeight:600 }}>View all →</Link>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
            {PROJECTS.map(p=>(
              <div key={p.client} className="u-card">
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                  <div>
                    <div style={{ fontSize:13.5, fontWeight:700, color:"#c8b87a" }}>{p.client}</div>
                    <div style={{ fontSize:12, color:"#4a4030" }}>{p.type}</div>
                  </div>
                  <span className="tag" style={{ background:p.color+"18", color:p.color, flexShrink:0, marginLeft:8 }}>{p.status}</span>
                </div>
                <div className="prog">
                  <div style={{ width:`${p.progress}%`, height:"100%", background:p.color, borderRadius:99 }} />
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#4a4030", marginTop:4 }}>
                  <span>{p.progress}%</span><span>Due {p.due}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ marginTop:28 }}>
        <div style={{ fontSize:13, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:"#4a4030", marginBottom:14 }}>Quick actions</div>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          {[
            { icon:"◈", label:"Book new shoot",       to:"/book",      color:GOLD      },
            { icon:"◇", label:"View portfolio",        to:"/portfolio", color:"#a0c878" },
            { icon:"✦", label:"Ask GEN-E Mini",        to:"/assistant", color:"#c8a0e0" },
            { icon:"⬡", label:"Explore services",      to:"/services",  color:PINK      },
          ].map(a=>(
            <Link key={a.label} to={a.to} style={{ display:"flex", alignItems:"center", gap:9, padding:"10px 18px", background:"#0f0c08", border:`1px solid ${B}`, borderRadius:10, textDecoration:"none", transition:"border-color 0.15s" }}
              onMouseOver={e=>e.currentTarget.style.borderColor=a.color+"40"}
              onMouseOut={e=>e.currentTarget.style.borderColor=B}
            >
              <span style={{ fontSize:16, color:a.color }}>{a.icon}</span>
              <span style={{ fontSize:13, fontWeight:600, color:"#8a7a50" }}>{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
