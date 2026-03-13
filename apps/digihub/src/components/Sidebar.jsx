import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const BLUE = "#0284c7";
const PINK = "#e8185d";
const B    = "#1a2030";

const NAV = [
  { to: "/",           icon: "◎", label: "Dashboard"     },
  { to: "/tools",      icon: "⬡", label: "Brand Tools"   },
  { to: "/planner",    icon: "◈", label: "Content Planner"},
  { to: "/talent",     icon: "◇", label: "Talent Hub"    },
  { to: "/analytics",  icon: "⬟", label: "Analytics"     },
  { to: "/projects",   icon: "◑", label: "Projects"      },
  { to: "/assistant",  icon: "✦", label: "AI Assistant"  },
];

export default function Sidebar({ user, profile }) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const firstName = (profile?.full_name || user?.user_metadata?.full_name || user?.email || "").split(" ")[0];
  const plan = profile?.plan || "free";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .dh-nav { display:flex; align-items:center; gap:11px; padding:9px 14px; border-radius:9px; font-size:13.5px; font-weight:500; color:#6b7280; text-decoration:none; transition:all 0.15s; white-space:nowrap; overflow:hidden; }
        .dh-nav:hover { background:#0d1624; color:#fff; }
        .dh-nav.active { background:#0d1624; color:#fff; }
        .dh-nav.active .dh-icon { color:${BLUE}; }
        .dh-icon { font-size:16px; flex-shrink:0; width:20px; text-align:center; }
      `}</style>

      <div style={{
        width: collapsed ? 64 : 224, minHeight: "100vh",
        background: "#080f1a", borderRight: `1px solid ${B}`,
        display: "flex", flexDirection: "column",
        padding: "20px 12px", transition: "width 0.2s ease",
        position: "sticky", top: 0, flexShrink: 0,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28, paddingLeft:4 }}>
          {!collapsed && (
            <span style={{ fontWeight:800, fontSize:18, color:"#fff", letterSpacing:"-0.04em" }}>
              Digi<span style={{ color:BLUE }}>Hub</span>
            </span>
          )}
          <button onClick={() => setCollapsed(c => !c)} style={{ background:"none", border:"none", cursor:"pointer", color:"#444", fontSize:16, padding:4, flexShrink:0 }}>
            {collapsed ? "▶" : "◀"}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, display:"flex", flexDirection:"column", gap:2 }}>
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.to==="/"} className={({ isActive }) => `dh-nav${isActive ? " active" : ""}`}>
              <span className="dh-icon">{n.icon}</span>
              {!collapsed && n.label}
            </NavLink>
          ))}
        </nav>

        {/* Plan badge */}
        {!collapsed && (
          <div style={{ marginBottom:12 }}>
            <div style={{ background: plan==="free" ? "#0d1624" : `${BLUE}15`, border:`1px solid ${plan==="free" ? B : BLUE+"30"}`, borderRadius:9, padding:"10px 12px" }}>
              <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color: plan==="free" ? "#444" : BLUE, marginBottom:4 }}>
                {plan==="free" ? "Free Plan" : `${plan} plan`}
              </div>
              {plan==="free" && <a href="/pricing" style={{ fontSize:11.5, color:PINK, fontWeight:600, textDecoration:"none" }}>Upgrade →</a>}
            </div>
          </div>
        )}

        {/* User */}
        <div style={{ display:"flex", alignItems:"center", gap:9, padding:"10px 8px", borderTop:`1px solid ${B}`, marginTop:4 }}>
          <div style={{ width:30, height:30, borderRadius:"50%", flexShrink:0, background:BLUE+"25", border:`1px solid ${BLUE}35`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:BLUE }}>
            {firstName?.[0]?.toUpperCase() || "U"}
          </div>
          {!collapsed && (
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12.5, fontWeight:600, color:"#bbb", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{firstName}</div>
              <button onClick={async () => { await supabase.auth.signOut(); navigate("/auth"); }} style={{ background:"none", border:"none", fontSize:11, color:"#444", cursor:"pointer", padding:0 }}>Sign out</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
