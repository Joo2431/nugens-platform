import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useProfile } from "../lib/useProfile";
import { NG_LOGO } from "../lib/logo";

const GOLD = "#d4a843";
const B    = "#1c1a14";

const NAV = [
  { to: "/",          icon: "◎", label: "Dashboard"    },
  { to: "/services",  icon: "⬡", label: "Services"     },
  { to: "/book",      icon: "◈", label: "Book a Shoot" },
  { to: "/projects",  icon: "◑", label: "Projects"     },
  { to: "/portfolio", icon: "◇", label: "Portfolio"    },
  { to: "/assistant", icon: "✦", label: "AI Assistant" },
];

export default function Sidebar() {
  const { user, profile, signOut } = useProfile();
  const [collapsed, setCollapsed] = useState(false);
  const firstName = (profile?.full_name || user?.user_metadata?.full_name || user?.email || "").split(" ")[0] || "User";
  const initials  = firstName.slice(0,2).toUpperCase();
  const plan      = profile?.plan || "free";
  const avatar    = profile?.avatar_url || user?.user_metadata?.avatar_url || null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .u-nav { display:flex; align-items:center; gap:11px; padding:9px 14px; border-radius:9px; font-size:13.5px; font-weight:500; color:#5a5240; text-decoration:none; transition:all 0.15s; white-space:nowrap; overflow:hidden; }
        .u-nav:hover { background:#130f07; color:#bfaa7a; }
        .u-nav.active { background:#130f07; color:#e8d5a0; }
        .u-nav.active .u-ico { color:${GOLD}; }
        .u-ico { font-size:16px; flex-shrink:0; width:20px; text-align:center; }
      `}</style>
      <div style={{ width:collapsed?64:228, minHeight:"100vh", background:"#0c0a06", borderRight:`1px solid ${B}`, display:"flex", flexDirection:"column", padding:"20px 12px", transition:"width 0.2s ease", position:"sticky", top:0, flexShrink:0, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:32, paddingLeft:4 }}>
          {!collapsed && (
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <img src={NG_LOGO} style={{ width:26, height:26, borderRadius:6, objectFit:"cover" }} alt="NG" />
              <div><div style={{ fontWeight:800, fontSize:13, color:"#e8d5a0", letterSpacing:"-0.03em", lineHeight:1.1 }}>The Wedding</div><div style={{ fontWeight:800, fontSize:13, color:GOLD, letterSpacing:"-0.03em", lineHeight:1.1 }}>Unit</div></div>
            </div>
          )}
          <button onClick={() => setCollapsed(c=>!c)} style={{ background:"none", border:"none", cursor:"pointer", color:"#3a3020", fontSize:15, padding:4, flexShrink:0 }}>{collapsed?"▶":"◀"}</button>
        </div>

        <nav style={{ flex:1, display:"flex", flexDirection:"column", gap:2 }}>
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.to==="/"} className={({isActive})=>`u-nav${isActive?" active":""}`}>
              <span className="u-ico">{n.icon}</span>
              {!collapsed && n.label}
            </NavLink>
          ))}
        </nav>

        {!collapsed && plan === "free" && (
          <div style={{ background:"#130f07", border:`1px solid ${B}`, borderRadius:9, padding:"10px 12px", marginBottom:12 }}>
            <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#3a3020", marginBottom:4 }}>Free Plan</div>
            <a href="https://nugens.in.net/pricing" style={{ fontSize:11.5, color:"#e8185d", fontWeight:600, textDecoration:"none" }}>Upgrade →</a>
          </div>
        )}

        <div style={{ display:"flex", alignItems:"center", gap:9, padding:"10px 8px", borderTop:`1px solid ${B}`, marginTop:4 }}>
          <div style={{ width:32, height:32, borderRadius:"50%", flexShrink:0, overflow:"hidden", background:`${GOLD}20`, border:`1.5px solid ${GOLD}40`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            {avatar
              ? <img src={avatar} style={{ width:32, height:32, objectFit:"cover" }} alt={firstName} />
              : <span style={{ fontSize:12, fontWeight:700, color:GOLD }}>{initials}</span>
            }
          </div>
          {!collapsed && (
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12.5, fontWeight:600, color:"#a08850", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{firstName}</div>
              <button onClick={signOut} style={{ background:"none", border:"none", fontSize:11, color:"#3a3020", cursor:"pointer", padding:0, fontFamily:"inherit" }}>Sign out</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
