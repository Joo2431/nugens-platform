import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { NG_LOGO } from "../lib/logo";
import { PLATFORM_LINKS } from "../lib/platformAccess";

const PINK   = "#e8185d";
const AMBER  = "#d97706";
const TEXT   = "#111827";
const MUTED  = "#9ca3af";
const BORDER = "#e8eaed";

const OTHER_APPS = PLATFORM_LINKS.filter(a => !a.url.includes("units.nugens"));

const BUSINESS_NAV = [
  { to:"/",         icon:"◎",  label:"Dashboard"        },
  { to:"/feed",     icon:"◉",  label:"Content Feed"     },
  { to:"/guidance", icon:"✦",  label:"AI Guidance"      },
  { to:"/book",     icon:"◈",  label:"Book Our Services"},
  { to:"/pricing",  icon:"↑",  label:"Pricing"          },
];

const INDIVIDUAL_NAV = [
  { to:"/",         icon:"◎",  label:"Dashboard"         },
  { to:"/live",     icon:"⬡",  label:"Live Experience"   },
  { to:"/guide",    icon:"◇",  label:"Entrepreneur Guide"},
  { to:"/validate", icon:"◑",  label:"Idea Validation"   },
  { to:"/book",     icon:"◈",  label:"Book Consultation" },
  { to:"/pricing",  icon:"↑",  label:"Pricing"           },
];

export default function Sidebar({ profile, onSignOut }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const isBusiness = profile?.user_type === "business";
  const nav        = isBusiness ? BUSINESS_NAV : INDIVIDUAL_NAV;
  const plan       = profile?.plan || "free";
  const firstName  = (profile?.full_name || "").split(" ")[0] || "User";
  const isPaid     = plan !== "free";

  const signOut = onSignOut || (async () => {
    await supabase.auth.signOut();
    window.location.href = "https://nugens.in.net/auth";
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .u-nav {
          display:flex; align-items:center; gap:11px; padding:10px 14px; border-radius:10px;
          font-size:13px; font-weight:500; color:#6b7280; text-decoration:none;
          transition:all 0.15s; white-space:nowrap; overflow:hidden;
          border:none; background:none; width:100%; cursor:pointer; text-align:left;
          font-family:'Plus Jakarta Sans',sans-serif;
        }
        .u-nav:hover { background:#fff7ed; color:${AMBER}; }
        .u-nav.active { background:#fff7ed; color:${AMBER}; font-weight:700; }
        .u-nav.active .u-ico { color:${AMBER}; }
        .u-ico { font-size:14px; flex-shrink:0; width:18px; text-align:center; color:#d1d5db; }
        .u-nav:hover .u-ico { color:${AMBER}; }
        .u-app-link {
          display:flex; align-items:center; gap:9px; padding:8px 12px; border-radius:9px;
          text-decoration:none; font-size:12px; font-weight:600; color:#6b7280;
          transition:all 0.14s; border:none; background:none; width:100%; cursor:pointer;
          font-family:'Plus Jakarta Sans',sans-serif; text-align:left;
        }
        .u-app-link:hover { background:#f8f9fb; color:${TEXT}; }
        .u-signout { width:100%; padding:9px 13px; background:none; border:1px solid ${BORDER};
          border-radius:10px; cursor:pointer; font-size:12px; color:#9ca3af;
          font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.13s; text-align:left;
          display:flex; align-items:center; gap:8px; }
        .u-signout:hover { border-color:${AMBER}40; color:${AMBER}; background:#fff7ed; }
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
                <div style={{ fontWeight:800, fontSize:14, color:"#111", letterSpacing:"-0.03em", lineHeight:1.1 }}>
                  The<span style={{ color:AMBER }}>Units</span>
                </div>
                <div style={{ fontSize:9, color:MUTED, fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase" }}>by Nugens</div>
              </div>
            </a>
          )}
          <button onClick={()=>setCollapsed(c=>!c)}
            style={{ background:"none", border:"1px solid #e8eaed", borderRadius:7, cursor:"pointer", color:MUTED, fontSize:11, padding:"4px 7px", flexShrink:0 }}>
            {collapsed ? "▶" : "◀"}
          </button>
        </div>

        {/* Mode badge */}
        {!collapsed && (
          <div style={{ background:isBusiness?"#fff7ed":"#f0fdf4", border:`1px solid ${isBusiness?AMBER+"40":"#bbf7d0"}`, borderRadius:9, padding:"7px 11px", marginBottom:16 }}>
            <div style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", color:isBusiness?AMBER:"#16a34a", marginBottom:2 }}>
              {isBusiness ? "🏢 Business" : "👤 Individual"}
            </div>
            <div style={{ fontSize:10, color:"#9ca3af" }}>
              {isBusiness ? "Content creation & branding" : "Build your entrepreneurial journey"}
            </div>
          </div>
        )}

        {/* User chip */}
        {!collapsed && (
          <div style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 10px", background:"#f8f9fb", borderRadius:9, marginBottom:16 }}>
            <div style={{ width:30, height:30, borderRadius:"50%", background:AMBER+"15", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:AMBER, flexShrink:0 }}>
              {(profile?.full_name||"U").slice(0,2).toUpperCase()}
            </div>
            <div style={{ overflow:"hidden" }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#111", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{firstName}</div>
              <div style={{ fontSize:10, color:isPaid?AMBER:MUTED, textTransform:"capitalize" }}>{plan} plan</div>
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

        {/* Divider */}
        {!collapsed && <div style={{ borderTop:`1px solid ${BORDER}`, margin:"10px 4px 10px" }}/>}

        {/* NuGens Suite */}
        {!collapsed && (
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:10, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em", padding:"0 10px", marginBottom:6 }}>
              Nugens Suite
            </div>
            {OTHER_APPS.map(app => (
              <a key={app.url} href={app.url} className="u-app-link">
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
          <div style={{ background:`${AMBER}08`, border:`1px solid ${AMBER}20`, borderRadius:10, padding:"12px 14px", marginBottom:12 }}>
            <div style={{ fontSize:10, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>Free Plan</div>
            <button onClick={()=>navigate("/pricing")} style={{ fontSize:12, color:AMBER, fontWeight:700, background:"none", border:"none", cursor:"pointer", padding:0 }}>
              Upgrade →
            </button>
          </div>
        )}

        {/* Sign out */}
        {!collapsed && (
          <div style={{ borderTop:`1px solid ${BORDER}`, paddingTop:12, marginTop:4 }}>
            <button className="u-signout" onClick={signOut}>← Sign out</button>
          </div>
        )}
      </div>
    </>
  );
}