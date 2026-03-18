import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { NG_LOGO } from "../lib/logo";
import { PLATFORM_LINKS } from "../lib/platformAccess";

const PINK   = "#e8185d";
const TEXT   = "#111827";
const MUTED  = "#9ca3af";
const BORDER = "#e8eaed";

const OTHER_APPS = PLATFORM_LINKS.filter(a => !a.url.includes("digihub"));

const BUSINESS_NAV = [
  { to:"/",          icon:"◎",  label:"Dashboard"       },
  { to:"/prompts",   icon:"✦",  label:"Prompt Space"    },
  { to:"/imagegen",  icon:"⬡",  label:"Image Generator" },
  { to:"/planner",   icon:"◈",  label:"Content Planner" },
  { to:"/scheduler", icon:"⊞",  label:"Scheduler"       },
  { to:"/community", icon:"◉",  label:"Community"       },
  { to:"/analytics", icon:"⬟",  label:"Analytics"       },
  { to:"/pricing",   icon:"↑",  label:"Upgrade"         },
];

const INDIVIDUAL_NAV = [
  { to:"/",          icon:"◎",  label:"Dashboard"       },
  { to:"/prompts",   icon:"✦",  label:"Prompt Space"    },
  { to:"/imagegen",  icon:"⬡",  label:"Image Generator" },
  { to:"/planner",   icon:"◈",  label:"Content Planner" },
  { to:"/scheduler", icon:"⊞",  label:"Scheduler"       },
  { to:"/jobs",      icon:"◇",  label:"Job Board"       },
  { to:"/community", icon:"◉",  label:"Community"       },
  { to:"/pricing",   icon:"↑",  label:"Upgrade"         },
];

export default function Sidebar({ profile, onSignOut }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const isBiz     = profile?.user_type === "business";
  const nav       = isBiz ? BUSINESS_NAV : INDIVIDUAL_NAV;
  const firstName = (profile?.full_name || "").split(" ")[0] || "User";
  const plan      = profile?.plan || "free";
  const isPaid    = plan !== "free";

  const signOut = onSignOut || (async () => {
    await supabase.auth.signOut();
    window.location.href = "https://nugens.in.net/auth";
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .dh-nav { display:flex; align-items:center; gap:11px; padding:10px 14px; border-radius:10px;
          font-size:13px; font-weight:500; color:#6b7280; text-decoration:none;
          transition:all 0.15s; white-space:nowrap; overflow:hidden;
          border:none; background:none; width:100%; cursor:pointer; text-align:left;
          font-family:'Plus Jakarta Sans',sans-serif; }
        .dh-nav:hover { background:#fef2f2; color:${PINK}; }
        .dh-nav.active { background:#fef2f2; color:${PINK}; font-weight:700; }
        .dh-nav.active .dh-ico, .dh-nav:hover .dh-ico { color:${PINK}; }
        .dh-ico { font-size:14px; flex-shrink:0; width:18px; text-align:center; color:#d1d5db; }
        .dh-app-link {
          display:flex; align-items:center; gap:9px; padding:8px 12px; border-radius:9px;
          text-decoration:none; font-size:12px; font-weight:600; color:#6b7280;
          transition:all 0.14s; border:none; background:none; width:100%; cursor:pointer;
          font-family:'Plus Jakarta Sans',sans-serif; text-align:left;
        }
        .dh-app-link:hover { background:#f8f9fb; color:${TEXT}; }
        .dh-out { width:100%; padding:9px 13px; background:none; border:1px solid ${BORDER};
          border-radius:10px; cursor:pointer; font-size:12px; color:#9ca3af;
          font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.13s; text-align:left;
          display:flex; align-items:center; gap:8px; }
        .dh-out:hover { border-color:${PINK}40; color:${PINK}; background:#fef2f2; }
      `}</style>

      <div style={{
        width: collapsed ? 62 : 230,
        minHeight:"100vh", background:"#ffffff",
        borderRight:`1px solid ${BORDER}`,
        display:"flex", flexDirection:"column",
        padding:"20px 10px 24px",
        transition:"width 0.2s ease",
        position:"sticky", top:0, flexShrink:0,
        fontFamily:"'Plus Jakarta Sans',sans-serif",
        boxShadow:"1px 0 0 #f3f4f6",
        height:"100vh", overflowY:"auto",
      }}>

        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24, paddingLeft:4 }}>
          {!collapsed && (
            <a href="https://nugens.in.net" style={{ display:"flex", alignItems:"center", gap:9, textDecoration:"none" }}>
              <img src={NG_LOGO} style={{ width:28, height:28, borderRadius:7, objectFit:"cover" }} alt="NG" />
              <div>
                <div style={{ fontWeight:800, fontSize:14, color:TEXT, letterSpacing:"-0.03em", lineHeight:1.1 }}>
                  Digi<span style={{ color:PINK }}>Hub</span>
                </div>
                <div style={{ fontSize:9, color:MUTED, fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase" }}>by Nugens</div>
              </div>
            </a>
          )}
          <button onClick={()=>setCollapsed(c=>!c)}
            style={{ background:"none", border:`1px solid ${BORDER}`, borderRadius:7, cursor:"pointer", color:MUTED, fontSize:11, padding:"4px 7px", flexShrink:0 }}>
            {collapsed ? "▶" : "◀"}
          </button>
        </div>

        {/* Mode badge */}
        {!collapsed && (
          <div style={{ background:isBiz?"#fef2f2":"#f0fdf4", border:`1px solid ${isBiz?PINK+"30":"#bbf7d0"}`, borderRadius:9, padding:"7px 11px", marginBottom:16 }}>
            <div style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", color:isBiz?PINK:"#16a34a", marginBottom:2 }}>
              {isBiz ? "🏢 Business" : "👤 Individual"}
            </div>
            <div style={{ fontSize:10, color:MUTED }}>{isBiz ? "Brand tools & content" : "Portfolio & opportunities"}</div>
          </div>
        )}

        {/* User chip */}
        {!collapsed && (
          <div style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 10px", background:"#f8f9fb", borderRadius:9, marginBottom:16 }}>
            <div style={{ width:30, height:30, borderRadius:"50%", background:`${PINK}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:PINK, flexShrink:0 }}>
              {firstName.slice(0,2).toUpperCase()}
            </div>
            <div style={{ overflow:"hidden" }}>
              <div style={{ fontSize:12, fontWeight:700, color:TEXT, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{firstName}</div>
              <div style={{ fontSize:10, color:isPaid?PINK:MUTED, textTransform:"capitalize" }}>{plan}</div>
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

        {/* Divider */}
        {!collapsed && <div style={{ borderTop:`1px solid ${BORDER}`, margin:"10px 4px 10px" }}/>}

        {/* NuGens Suite */}
        {!collapsed && (
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:10, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em", padding:"0 10px", marginBottom:6 }}>
              Nugens Suite
            </div>
            {OTHER_APPS.map(app => (
              <a key={app.url} href={app.url} className="dh-app-link">
                <span style={{ fontSize:13, color:app.color, width:18, textAlign:"center", flexShrink:0 }}>{app.icon}</span>
                {app.label}
              </a>
            ))}
          </div>
        )}

        {/* Collapsed icons */}
        {collapsed && (
          <div style={{ display:"flex", flexDirection:"column", gap:6, alignItems:"center", marginBottom:12 }}>
            {OTHER_APPS.map(app => (
              <a key={app.url} href={app.url} title={app.label}
                style={{ width:32, height:32, borderRadius:8, background:`${app.color}12`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, color:app.color, textDecoration:"none" }}>
                {app.icon}
              </a>
            ))}
          </div>
        )}

        {/* Plan nudge */}
        {!collapsed && plan === "free" && (
          <div style={{ background:`${PINK}08`, border:`1px solid ${PINK}20`, borderRadius:10, padding:"12px 14px", marginBottom:12 }}>
            <div style={{ fontSize:10, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>Free Plan</div>
            <button onClick={()=>navigate("/pricing")} style={{ fontSize:12, color:PINK, fontWeight:700, background:"none", border:"none", cursor:"pointer", padding:0 }}>
              Upgrade →
            </button>
          </div>
        )}

        {/* Sign out */}
        {!collapsed && (
          <div style={{ borderTop:`1px solid ${BORDER}`, paddingTop:12, marginTop:4 }}>
            <button className="dh-out" onClick={signOut}>← Sign out</button>
          </div>
        )}
      </div>
    </>
  );
}
