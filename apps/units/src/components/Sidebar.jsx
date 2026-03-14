import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { NG_LOGO } from "../lib/logo";

const GOLD = "#d4a843";
const B    = "#1c1a14";

// Individual: clients browsing/booking
const INDIVIDUAL_NAV = [
  { to:"/",          icon:"◎", label:"Dashboard"  },
  { to:"/services",  icon:"◇", label:"Services"   },
  { to:"/book",      icon:"◑", label:"Book Now"   },
  { to:"/portfolio", icon:"⬡", label:"Portfolio"  },
  { to:"/pricing",   icon:"↑", label:"Packages"   },
];

// Business: brands booking content/production
const BUSINESS_NAV = [
  { to:"/",          icon:"◎", label:"Dashboard"    },
  { to:"/services",  icon:"◇", label:"Services"     },
  { to:"/book",      icon:"◑", label:"Book a Shoot" },
  { to:"/projects",  icon:"⬟", label:"Projects"     },
  { to:"/portfolio", icon:"⬡", label:"Portfolio"    },
  { to:"/pricing",   icon:"↑", label:"Packages"     },
];

export default function Sidebar({ profile, onSignOut }) {
  const [collapsed, setCollapsed] = useState(false);
  const isBusiness = profile?.user_type === "business";
  const nav        = isBusiness ? BUSINESS_NAV : INDIVIDUAL_NAV;
  const firstName  = (profile?.full_name || "").split(" ")[0] || "User";
  const initials   = firstName.slice(0,2).toUpperCase();
  const plan       = profile?.plan || "free";
  const avatar     = profile?.avatar_url || null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .u-nav { display:flex; align-items:center; gap:11px; padding:9px 14px; border-radius:9px; font-size:13px; font-weight:500; color:#4a4030; text-decoration:none; transition:all 0.15s; white-space:nowrap; overflow:hidden; border:none; background:none; width:100%; cursor:pointer; text-align:left; font-family:'Plus Jakarta Sans',sans-serif; }
        .u-nav:hover { background:#130f08; color:#c8a870; }
        .u-nav.active { background:#130f08; color:#e8d5a0; }
        .u-nav.active .u-ico { color:${GOLD}; }
        .u-ico { font-size:14px; flex-shrink:0; width:18px; text-align:center; color:#3a3020; }
        .u-signout { width:100%; padding:8px 12px; background:none; border:1px solid ${B}; border-radius:9px; cursor:pointer; font-size:12px; color:#4a4030; font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.13s; text-align:left; }
        .u-signout:hover { border-color:${GOLD}50; color:${GOLD}; }
      `}</style>
      <div style={{ width:collapsed?60:220, minHeight:"100vh", background:"#0a0805", borderRight:`1px solid ${B}`, display:"flex", flexDirection:"column", padding:"20px 10px 24px", transition:"width 0.2s ease", position:"sticky", top:0, flexShrink:0, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>

        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:22, paddingLeft:4 }}>
          {!collapsed && (
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <img src={NG_LOGO} style={{ width:26, height:26, borderRadius:6, objectFit:"cover" }} alt="NG" />
              <span style={{ fontWeight:800, fontSize:15, letterSpacing:"-0.025em" }}>
                <span style={{ color:GOLD }}>Units</span>
                <span style={{ color:"#3a3020", fontSize:13 }}> ✦</span>
              </span>
            </div>
          )}
          <button onClick={() => setCollapsed(c=>!c)} style={{ background:"none", border:"none", cursor:"pointer", color:"#3a3020", fontSize:12, padding:4, flexShrink:0 }}>{collapsed?"▶":"◀"}</button>
        </div>

        {/* Mode badge */}
        {!collapsed && (
          <div style={{ background:isBusiness?"#1a1208":"#0f0c08", border:`1px solid ${isBusiness?GOLD+"30":B}`, borderRadius:8, padding:"6px 10px", marginBottom:14 }}>
            <div style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", color:isBusiness?GOLD:"#4a4030" }}>
              {isBusiness?"🏢 Business Client":"👤 Individual"}
            </div>
            <div style={{ fontSize:9.5, color:"#3a3020", marginTop:1 }}>
              {isBusiness?"Brand videos & production":"Weddings & events"}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex:1, display:"flex", flexDirection:"column", gap:2 }}>
          {nav.map(n => (
            <NavLink key={n.to} to={n.to} end={n.to==="/"} className={({isActive})=>`u-nav${isActive?" active":""}`}>
              <span className="u-ico">{n.icon}</span>
              {!collapsed && n.label}
            </NavLink>
          ))}
        </nav>

        {/* Plan */}
        {!collapsed && plan === "free" && (
          <div style={{ background:"#0f0c08", border:`1px solid ${B}`, borderRadius:9, padding:"10px 12px", marginBottom:12 }}>
            <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#3a3020", marginBottom:4 }}>Free Access</div>
            <a href="https://nugens.in.net/pricing" style={{ fontSize:11.5, color:"#e8185d", fontWeight:600, textDecoration:"none" }}>Upgrade →</a>
          </div>
        )}

        {/* Sign out */}
        {!collapsed && (
          <button className="u-signout" onClick={onSignOut}>← Sign out</button>
        )}
      </div>
    </>
  );
}
