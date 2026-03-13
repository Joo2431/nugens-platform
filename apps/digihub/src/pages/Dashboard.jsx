import React from "react";
import { Link } from "react-router-dom";

const BLUE = "#0284c7";
const PINK = "#e8185d";
const B    = "#1a2030";

const RECENT_PROJECTS = [
  { name: "Zara Fitness — Brand Relaunch",    status: "Active",    due: "Mar 20", color: BLUE,    progress: 65 },
  { name: "ThinkBox — Social Media Setup",    status: "Review",    due: "Mar 15", color: "#d97706", progress: 90 },
  { name: "VedaKitchen — SEO Campaign",       status: "Active",    due: "Apr 2",  color: "#16a34a", progress: 30 },
  { name: "NovaTech — Performance Ads",       status: "Planning",  due: "Apr 10", color: PINK,     progress: 10 },
];

const TALENT_RECENT = [
  { name: "Priya S.",   skill: "Social Media",    status: "Available",  match: 94 },
  { name: "Karthik R.", skill: "SEO & Content",   status: "Available",  match: 88 },
  { name: "Meera J.",   skill: "Performance Ads", status: "Placed",     match: 91 },
];

export default function Dashboard({ profile }) {
  const plan = profile?.plan || "free";
  const firstName = (profile?.full_name || "").split(" ")[0] || "there";

  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", padding:"32px 28px 80px", background:"#06101a", minHeight:"100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .dh-card { background:#080f1a; border:1px solid ${B}; border-radius:12px; padding:20px; transition:border-color 0.18s; }
        .dh-card:hover { border-color:#243040; }
        .stat { background:#080f1a; border:1px solid ${B}; border-radius:10px; padding:16px 18px; }
        .prog-bar { height:4px; background:#0d1624; border-radius:99px; overflow:hidden; margin-top:8px; }
        .tag { display:inline-block; padding:2px 8px; border-radius:5px; font-size:10.5px; font-weight:600; }
        @media (max-width:700px) { .stats-g { grid-template-columns:1fr 1fr !important; } .two-g { grid-template-columns:1fr !important; } }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom:32 }}>
        <h1 style={{ fontWeight:800, fontSize:"clamp(20px,2.5vw,26px)", letterSpacing:"-0.03em", color:"#fff", marginBottom:4 }}>
          Welcome back, {firstName} 👋
        </h1>
        <p style={{ fontSize:13.5, color:"#445" }}>Here's what's happening across your brands and talent network.</p>
      </div>

      {/* Stats */}
      <div className="stats-g" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:32 }}>
        {[
          { label:"Active projects",   value:"4",    sub:"2 due this week",    color:BLUE    },
          { label:"Talent pool",        value:"24",   sub:"8 available now",    color:"#16a34a"},
          { label:"Content scheduled", value:"18",   sub:"This month",         color:"#d97706"},
          { label:"Campaign ROI avg",  value:"2.4×", sub:"Last 30 days",       color:PINK    },
        ].map(s => (
          <div key={s.label} className="stat">
            <div style={{ fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.07em", color:"#445", marginBottom:6 }}>{s.label}</div>
            <div style={{ fontSize:24, fontWeight:800, letterSpacing:"-0.04em", color:s.color, lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:11.5, color:"#445", marginTop:4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Upgrade banner */}
      {plan === "free" && (
        <div style={{ background:"#0d1624", border:`1px solid ${BLUE}30`, borderRadius:12, padding:"18px 22px", marginBottom:32, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:"#fff", marginBottom:2 }}>Unlock DigiHub Premium</div>
            <div style={{ fontSize:12.5, color:"#556" }}>Full brand tools, analytics dashboard, poster generator + talent marketplace access</div>
          </div>
          <Link to="/pricing" style={{ padding:"8px 18px", borderRadius:8, background:BLUE, color:"#fff", fontSize:13, fontWeight:700, textDecoration:"none" }}>Upgrade →</Link>
        </div>
      )}

      <div className="two-g" style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:16 }}>
        {/* Projects */}
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ fontSize:13, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:"#445" }}>Active projects</div>
            <Link to="/projects" style={{ fontSize:12, color:BLUE, textDecoration:"none", fontWeight:600 }}>View all →</Link>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {RECENT_PROJECTS.map(p => (
              <div key={p.name} className="dh-card">
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                  <div style={{ fontSize:13.5, fontWeight:700, color:"#ddd", lineHeight:1.35, maxWidth:220 }}>{p.name}</div>
                  <span className="tag" style={{ background:p.status==="Active" ? BLUE+"20" : p.status==="Review" ? "#d97706"+"20" : "#1a2030", color:p.status==="Active" ? BLUE : p.status==="Review" ? "#d97706" : "#556", flexShrink:0, marginLeft:8 }}>{p.status}</span>
                </div>
                <div style={{ fontSize:12, color:"#445", marginBottom:6 }}>Due {p.due}</div>
                <div className="prog-bar">
                  <div style={{ width:`${p.progress}%`, height:"100%", background:p.color, borderRadius:99 }} />
                </div>
                <div style={{ fontSize:11, color:"#445", marginTop:4 }}>{p.progress}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {/* Talent */}
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div style={{ fontSize:13, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:"#445" }}>Top talent matches</div>
              <Link to="/talent" style={{ fontSize:12, color:BLUE, textDecoration:"none", fontWeight:600 }}>View all →</Link>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {TALENT_RECENT.map(t => (
                <div key={t.name} className="dh-card" style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:34, height:34, borderRadius:"50%", background:BLUE+"20", border:`1px solid ${BLUE}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:BLUE, flexShrink:0 }}>{t.name[0]}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#ccc" }}>{t.name}</div>
                    <div style={{ fontSize:11.5, color:"#445" }}>{t.skill}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:13, fontWeight:800, color:BLUE }}>{t.match}%</div>
                    <span className="tag" style={{ background: t.status==="Available" ? "#16a34a"+"18" : "#d97706"+"18", color: t.status==="Available" ? "#16a34a" : "#d97706" }}>{t.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div>
            <div style={{ fontSize:13, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:"#445", marginBottom:14 }}>Quick actions</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {[
                { icon:"◈", label:"Create content post",  to:"/planner",   color:BLUE    },
                { icon:"⬡", label:"Generate brand poster", to:"/tools",     color:"#d97706"},
                { icon:"◇", label:"Browse talent",         to:"/talent",    color:"#16a34a"},
                { icon:"⬟", label:"View analytics",        to:"/analytics", color:PINK    },
              ].map(a => (
                <Link key={a.label} to={a.to} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"#080f1a", border:`1px solid ${B}`, borderRadius:10, textDecoration:"none", transition:"all 0.15s" }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = a.color+"40"; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = B; }}
                >
                  <span style={{ fontSize:16, color:a.color }}>{a.icon}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:"#aaa" }}>{a.label}</span>
                  <span style={{ marginLeft:"auto", fontSize:12, color:"#445" }}>→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
