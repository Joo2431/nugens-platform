import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useProfile } from "../lib/useProfile";
import { NG_LOGO } from "../lib/logo";

const BLUE = "#0284c7";
const B    = "#1a2030";

const NAV = [
  { to: "/",          icon: "◎", label: "Dashboard"      },
  { to: "/tools",     icon: "⬡", label: "Brand Tools"    },
  { to: "/planner",   icon: "◈", label: "Content Planner"},
  { to: "/talent",    icon: "◇", label: "Talent Hub"     },
  { to: "/analytics", icon: "⬟", label: "Analytics"      },
  { to: "/projects",  icon: "◑", label: "Projects"       },
  { to: "/assistant", icon: "✦", label: "AI Assistant"   },
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
        .dh-nav { display:flex; align-items:center; gap:11px; padding:9px 14px; border-radius:9px; font-size:13.5px; font-weight:500; color:#6b7280; text-decoration:none; transition:all 0.15s; white-space:nowrap; overflow:hidden; }
        .dh-nav:hover { background:#0d1624; color:#fff; }
        .dh-nav.active { background:#0d1624; color:#fff; }
        .dh-nav.active .dh-ico { color:${BLUE}; }
        .dh-ico { font-size:16px; flex-shrink:0; width:20px; text-align:center; }
      `}</style>
      <div style={{ width:collapsed?64:224, minHeight:"100vh", background:"#080f1a", borderRight:`1px solid ${B}`, display:"flex", flexDirection:"column", padding:"20px 12px", transition:"width 0.2s ease", position:"sticky", top:0, flexShrink:0, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28, paddingLeft:4 }}>
          {!collapsed && (
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <img src={NG_LOGO} style={{ width:26, height:26, borderRadius:6, objectFit:"cover" }} alt="NG" />
              <span style={{ fontWeight:800, fontSize:16, color:"#fff", letterSpacing:"-0.03em" }}>Digi<span style={{ color:BLUE }}>Hub</span></span>
            </div>
          )}
          <button onClick={() => setCollapsed(c=>!c)} style={{ background:"none", border:"none", cursor:"pointer", color:"#444", fontSize:15, padding:4, flexShrink:0 }}>{collapsed?"▶":"◀"}</button>
        </div>

        <nav style={{ flex:1, display:"flex", flexDirection:"column", gap:2 }}>
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.to==="/"} className={({isActive})=>`dh-nav${isActive?" active":""}`}>
              <span className="dh-ico">{n.icon}</span>
              {!collapsed && n.label}
            </NavLink>
          ))}
        </nav>

        {!collapsed && plan === "free" && (
          <div style={{ background:"#0d1624", border:`1px solid ${B}`, borderRadius:9, padding:"10px 12px", marginBottom:12 }}>
            <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#334", marginBottom:4 }}>Free Plan</div>
            <a href="https://nugens.in.net/pricing" style={{ fontSize:11.5, color:"#e8185d", fontWeight:600, textDecoration:"none" }}>Upgrade →</a>
          </div>
        )}

        <div style={{ display:"flex", alignItems:"center", gap:9, padding:"10px 8px", borderTop:`1px solid ${B}`, marginTop:4 }}>
          <div style={{ width:32, height:32, borderRadius:"50%", flexShrink:0, overflow:"hidden", background:`${BLUE}20`, border:`1.5px solid ${BLUE}40`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            {avatar
              ? <img src={avatar} style={{ width:32, height:32, objectFit:"cover" }} alt={firstName} />
              : <span style={{ fontSize:12, fontWeight:700, color:BLUE }}>{initials}</span>
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
