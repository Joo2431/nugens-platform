import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { NG_LOGO } from "../lib/logo";

const BLUE = "#0284c7";
const B    = "#1a2030";

const BUSINESS_NAV = [
  { to:"/",          icon:"◎", label:"Dashboard"       },
  { to:"/prompts",   icon:"✦", label:"Prompt Space"    },
  { to:"/imagegen",  icon:"⬡", label:"Image Generator" },
  { to:"/planner",   icon:"◈", label:"Content Planner" },
  { to:"/scheduler", icon:"⊞", label:"Scheduler"       },
  { to:"/community", icon:"◉", label:"Community"       },
  { to:"/analytics", icon:"⬟", label:"Analytics"       },
  { to:"/pricing",   icon:"↑", label:"Upgrade"         },
];

const INDIVIDUAL_NAV = [
  { to:"/",          icon:"◎", label:"Dashboard"       },
  { to:"/prompts",   icon:"✦", label:"Prompt Space"    },
  { to:"/imagegen",  icon:"⬡", label:"Image Generator" },
  { to:"/planner",   icon:"◈", label:"Content Planner" },
  { to:"/scheduler", icon:"⊞", label:"Scheduler"       },
  { to:"/jobs",      icon:"◇", label:"Job Board"       },
  { to:"/community", icon:"◉", label:"Community"       },
  { to:"/pricing",   icon:"↑", label:"Upgrade"         },
];

export default function Sidebar({ profile, onSignOut }) {
  const [collapsed, setCollapsed] = useState(false);
  const isBusiness = profile?.user_type === "business";
  const nav        = isBusiness ? BUSINESS_NAV : INDIVIDUAL_NAV;
  const firstName  = (profile?.full_name || "").split(" ")[0] || "User";
  const plan       = profile?.plan || "free";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .dh-nav { display:flex; align-items:center; gap:11px; padding:9px 14px; border-radius:9px; font-size:13px; font-weight:500; color:#556; text-decoration:none; transition:all 0.15s; white-space:nowrap; overflow:hidden; border:none; background:none; width:100%; cursor:pointer; text-align:left; font-family:'Plus Jakarta Sans',sans-serif; }
        .dh-nav:hover { background:#0d1624; color:#aaa; }
        .dh-nav.active { background:#0d1624; color:#fff; }
        .dh-nav.active .dh-ico { color:${BLUE}; }
        .dh-ico { font-size:14px; flex-shrink:0; width:18px; text-align:center; color:#334; }
        .dh-signout { width:100%; padding:8px 12px; background:none; border:1px solid ${B}; border-radius:9px; cursor:pointer; font-size:12px; color:#445; font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.13s; text-align:left; }
        .dh-signout:hover { border-color:#0284c730; color:${BLUE}; }
      `}</style>
      <div style={{ width:collapsed?60:220, minHeight:"100vh", background:"#080f1a", borderRight:`1px solid ${B}`, display:"flex", flexDirection:"column", padding:"20px 10px 24px", transition:"width 0.2s ease", position:"sticky", top:0, flexShrink:0, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>

        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:22, paddingLeft:4 }}>
          {!collapsed && (
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <img src={NG_LOGO} style={{ width:26, height:26, borderRadius:6, objectFit:"cover" }} alt="NG" />
              <span style={{ fontWeight:800, fontSize:15, color:"#fff", letterSpacing:"-0.03em" }}>Digi<span style={{ color:BLUE }}>Hub</span></span>
            </div>
          )}
          <button onClick={() => setCollapsed(c=>!c)} style={{ background:"none", border:"none", cursor:"pointer", color:"#334", fontSize:12, padding:4, flexShrink:0 }}>{collapsed?"▶":"◀"}</button>
        </div>

        {/* Mode badge */}
        {!collapsed && (
          <div style={{ background:isBusiness?"#051018":"#06101a", border:`1px solid ${isBusiness?BLUE+"30":B}`, borderRadius:8, padding:"6px 10px", marginBottom:14 }}>
            <div style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", color:isBusiness?BLUE:"#334" }}>
              {isBusiness?"🏢 Business":"👤 Individual"}
            </div>
            <div style={{ fontSize:9.5, color:"#334", marginTop:1 }}>
              {isBusiness?"Grow & manage your brand":"Build your digital presence"}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex:1, display:"flex", flexDirection:"column", gap:2 }}>
          {nav.map(n => (
            <NavLink key={n.to} to={n.to} end={n.to==="/"} className={({isActive})=>`dh-nav${isActive?" active":""}`}>
              <span className="dh-ico">{n.icon}</span>
              {!collapsed && n.label}
            </NavLink>
          ))}
        </nav>

        {/* Plan */}
        {!collapsed && plan === "free" && (
          <div style={{ background:"#0d1624", border:`1px solid ${B}`, borderRadius:9, padding:"10px 12px", marginBottom:12 }}>
            <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#334", marginBottom:4 }}>Free Plan</div>
            <a href="/pricing" style={{ fontSize:11.5, color:"#e8185d", fontWeight:600, textDecoration:"none" }}>Upgrade →</a>
          </div>
        )}

        {/* Sign out */}
        {!collapsed && (
          <button className="dh-signout" onClick={onSignOut}>← Sign out</button>
        )}
      </div>
    </>
  );
}
