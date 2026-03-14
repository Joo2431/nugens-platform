import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useProfile } from "../lib/useProfile";
import { NG_LOGO } from "../lib/logo";

const PURPLE = "#7c3aed";
const B      = "#1e1e2e";

const NAV = [
  { to: "/",            icon: "◎", label: "Dashboard"    },
  { to: "/courses",     icon: "⬡", label: "Courses"      },
  { to: "/paths",       icon: "◈", label: "Learning Paths"},
  { to: "/certificates",icon: "◇", label: "Certificates" },
  { to: "/community",   icon: "⬟", label: "Community"    },
  { to: "/assistant",   icon: "✦", label: "AI Assistant" },
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
        .hx-nav { display:flex; align-items:center; gap:11px; padding:9px 14px; border-radius:9px; font-size:13.5px; font-weight:500; color:#888; text-decoration:none; transition:all 0.15s; white-space:nowrap; overflow:hidden; }
        .hx-nav:hover { background:#1a1a2a; color:#fff; }
        .hx-nav.active { background:#1a1a2a; color:#fff; }
        .hx-nav.active .hx-ico { color:${PURPLE}; }
        .hx-ico { font-size:16px; flex-shrink:0; width:20px; text-align:center; }
      `}</style>
      <div style={{ width:collapsed?64:220, minHeight:"100vh", background:"#0d0d1a", borderRight:`1px solid ${B}`, display:"flex", flexDirection:"column", padding:"20px 12px", transition:"width 0.2s ease", position:"sticky", top:0, flexShrink:0, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
        
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28, paddingLeft:4 }}>
          {!collapsed && (
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <img src={NG_LOGO} style={{ width:26, height:26, borderRadius:6, objectFit:"cover" }} alt="NG" />
              <span style={{ fontWeight:800, fontSize:16, color:"#fff", letterSpacing:"-0.03em" }}>Hyper<span style={{ color:PURPLE }}>X</span></span>
            </div>
          )}
          <button onClick={() => setCollapsed(c=>!c)} style={{ background:"none", border:"none", cursor:"pointer", color:"#444", fontSize:15, padding:4, flexShrink:0 }}>{collapsed?"▶":"◀"}</button>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, display:"flex", flexDirection:"column", gap:2 }}>
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.to==="/"} className={({isActive})=>`hx-nav${isActive?" active":""}`}>
              <span className="hx-ico">{n.icon}</span>
              {!collapsed && n.label}
            </NavLink>
          ))}
        </nav>

        {/* Plan badge */}
        {!collapsed && plan === "free" && (
          <div style={{ background:"#1a1a2a", border:`1px solid ${B}`, borderRadius:9, padding:"10px 12px", marginBottom:12 }}>
            <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#444", marginBottom:4 }}>Free Plan</div>
            <a href="https://nugens.in.net/pricing" style={{ fontSize:11.5, color:"#e8185d", fontWeight:600, textDecoration:"none" }}>Upgrade →</a>
          </div>
        )}

        {/* Profile */}
        <div style={{ display:"flex", alignItems:"center", gap:9, padding:"10px 8px", borderTop:`1px solid ${B}`, marginTop:4 }}>
          <div style={{ width:32, height:32, borderRadius:"50%", flexShrink:0, overflow:"hidden", background:`${PURPLE}20`, border:`1.5px solid ${PURPLE}40`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            {avatar
              ? <img src={avatar} style={{ width:32, height:32, objectFit:"cover" }} alt={firstName} />
              : <span style={{ fontSize:12, fontWeight:700, color:PURPLE }}>{initials}</span>
            }
          </div>
          {!collapsed && (
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12.5, fontWeight:600, color:"#ccc", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{firstName}</div>
              <button onClick={signOut} style={{ background:"none", border:"none", fontSize:11, color:"#555", cursor:"pointer", padding:0, fontFamily:"inherit" }}>Sign out</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
