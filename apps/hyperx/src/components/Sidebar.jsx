import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { NG_LOGO }  from "../lib/logo";

const PINK   = "#e8185d";
const TEXT   = "#111827";
const MUTED  = "#9ca3af";
const BORDER = "#e8eaed";

const ADMIN_EMAILS = ["jeromjoseph31@gmail.com", "jeromjoshep.23@gmail.com"];

const PLAN_LABELS = {
  free:"Free", admin:"Admin ✦",
  hx_ind_starter:"Starter",  hx_ind_premium:"Premium",
  hx_ind_pro:"Pro",          hx_ind_yearly:"Pro Yearly",
  hx_biz_starter:"Biz Starter", hx_biz_premium:"Biz Premium",
  hx_biz_pro:"Biz Pro",     hx_biz_yearly:"Biz Yearly",
};

const OTHER_APPS = [
  { label:"Gen-E AI",  icon:"◎", color:"#7c3aed", url:"https://gene.nugens.in.net"     },
  { label:"DigiHub",   icon:"◈", color:"#0284c7", url:"https://digihub.nugens.in.net"  },
  { label:"The Units", icon:"◇", color:"#d97706", url:"https://units.nugens.in.net"    },
  { label:"Dashboard", icon:"⊞", color:PINK,      url:"https://nugens.in.net/dashboard"},
];

// ── Sidebar receives profile as prop from App.jsx ──────────────────────────
// NO useProfile() hook here — that causes a second getSession() that hangs.
// App.jsx already resolved auth; we just display what it passes down.
export default function Sidebar({ profile }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  // Derive all display values from prop — show safe defaults when null
  const plan      = profile?.plan      || "free";
  const userType  = profile?.user_type || "individual";
  const isBiz     = userType === "business";
  const firstName = (profile?.full_name || "").split(" ")[0] || "User";
  const email     = (profile?.email    || "").toLowerCase().trim();
  const planLabel = PLAN_LABELS[plan]  || plan;
  const isPaid    = plan !== "free";
  const isAdmin   = plan === "admin" || ADMIN_EMAILS.includes(email);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "https://nugens.in.net/auth";
  };

  const NAV = [
    { to:"/",        icon:"⊞", label:"Dashboard"                     },
    { to:"/courses", icon:"▶", label: isBiz ? "All Courses" : "My Courses" },
    { to:"/certs",   icon:"◇", label:"Certificates"                  },
    { to:"/pricing", icon:"↑", label:"Upgrade"                       },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .hx-nav {
          display:flex; align-items:center; gap:11px; padding:10px 14px; border-radius:10px;
          font-size:13px; font-weight:500; color:#6b7280; text-decoration:none;
          transition:all 0.15s; border:none; background:none; width:100%;
          cursor:pointer; text-align:left; font-family:'Plus Jakarta Sans',sans-serif;
          white-space:nowrap; overflow:hidden;
        }
        .hx-nav:hover  { background:#fef2f2; color:${PINK}; }
        .hx-nav.active { background:#fef2f2; color:${PINK}; font-weight:700; }
        .hx-nav:hover .hx-ico, .hx-nav.active .hx-ico { color:${PINK}; }
        .hx-ico { font-size:14px; flex-shrink:0; width:18px; text-align:center; color:#d1d5db; }
        .hx-app-link {
          display:flex; align-items:center; gap:9px; padding:8px 12px; border-radius:9px;
          text-decoration:none; font-size:12px; font-weight:600; color:#6b7280;
          transition:all 0.14s; border:none; background:none; width:100%; cursor:pointer;
          font-family:'Plus Jakarta Sans',sans-serif; text-align:left;
        }
        .hx-app-link:hover { background:#f8f9fb; color:${TEXT}; }
        .hx-signout-btn {
          width:100%; padding:9px 13px; background:none; border:1px solid ${BORDER};
          border-radius:10px; cursor:pointer; font-size:13px; color:#6b7280;
          font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.13s; text-align:left;
          display:flex; align-items:center; gap:8px;
        }
        .hx-signout-btn:hover { border-color:${PINK}40; color:${PINK}; background:#fef2f2; }
      `}</style>

      <div style={{
        width: collapsed ? 62 : 232,
        minHeight: "100vh",
        background: "#fff",
        borderRight: `1px solid ${BORDER}`,
        display: "flex", flexDirection: "column",
        padding: "20px 10px 20px",
        transition: "width 0.2s ease",
        position: "sticky", top: 0, flexShrink: 0,
        fontFamily: "'Plus Jakarta Sans',sans-serif",
        boxShadow: "1px 0 0 #f3f4f6",
      }}>

        {/* ── LOGO ── */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, paddingLeft:4 }}>
          {!collapsed && (
            <a href="https://nugens.in.net" style={{ display:"flex", alignItems:"center", gap:9, textDecoration:"none" }}>
              <img src={NG_LOGO} style={{ width:28, height:28, borderRadius:7, objectFit:"cover" }} alt="NG" />
              <div>
                <div style={{ fontWeight:800, fontSize:15, color:TEXT, letterSpacing:"-0.035em", lineHeight:1.1 }}>
                  Hyper<span style={{ color:PINK }}>X</span>
                </div>
                <div style={{ fontSize:9, color:MUTED, fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase" }}>
                  by Nugens
                </div>
              </div>
            </a>
          )}
          <button onClick={() => setCollapsed(c => !c)}
            style={{ background:"none", border:`1px solid ${BORDER}`, borderRadius:7, cursor:"pointer", color:MUTED, fontSize:11, padding:"4px 7px", flexShrink:0 }}>
            {collapsed ? "▶" : "◀"}
          </button>
        </div>

        {/* ── USER TYPE BADGE ── */}
        {!collapsed && (
          <div style={{ background:isBiz?"#fef2f2":"#eff6ff", border:`1px solid ${isBiz?PINK+"30":"#bfdbfe"}`, borderRadius:9, padding:"7px 11px", marginBottom:14 }}>
            <div style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", color:isBiz?PINK:"#2563eb", marginBottom:2 }}>
              {isBiz ? "🏢 Business" : "👤 Individual"}
            </div>
            <div style={{ fontSize:10, color:MUTED }}>
              {isBiz ? "Business + Individual courses" : "Individual courses only"}
            </div>
          </div>
        )}

        {/* ── USER CHIP ── */}
        {!collapsed && (
          <div style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 10px", background:"#f8f9fb", borderRadius:9, marginBottom:14 }}>
            <div style={{ width:32, height:32, borderRadius:"50%", background:`${PINK}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:PINK, flexShrink:0 }}>
              {firstName.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ overflow:"hidden", flex:1 }}>
              <div style={{ fontSize:12, fontWeight:700, color:TEXT, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                {firstName}
              </div>
              <div style={{ fontSize:10, color:isPaid ? PINK : MUTED, fontWeight:600 }}>
                {planLabel}
              </div>
            </div>
          </div>
        )}

        {/* ── MAIN NAV ── */}
        <nav style={{ display:"flex", flexDirection:"column", gap:2, marginBottom:8 }}>
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.to === "/"} className={({ isActive }) => `hx-nav${isActive ? " active" : ""}`}>
              <span className="hx-ico">{n.icon}</span>
              {!collapsed && n.label}
            </NavLink>
          ))}
          {/* Admin Panel — shown when email matches or plan=admin */}
          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => `hx-nav${isActive ? " active" : ""}`}>
              <span className="hx-ico">⚙</span>
              {!collapsed && "Admin Panel"}
            </NavLink>
          )}
        </nav>

        {/* ── DIVIDER ── */}
        {!collapsed && <div style={{ borderTop:`1px solid ${BORDER}`, margin:"8px 4px 10px" }}/>}

        {/* ── OTHER PRODUCTS ── */}
        {!collapsed && (
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:10, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em", padding:"0 10px", marginBottom:6 }}>
              Other Products
            </div>
            {OTHER_APPS.map(app => (
              <a key={app.url} href={app.url} target="_blank" rel="noreferrer" className="hx-app-link">
                <span style={{ fontSize:13, color:app.color, width:18, textAlign:"center", flexShrink:0 }}>{app.icon}</span>
                {app.label}
              </a>
            ))}
          </div>
        )}

        {/* Collapsed: show product icons */}
        {collapsed && (
          <div style={{ display:"flex", flexDirection:"column", gap:6, alignItems:"center", marginBottom:12 }}>
            {OTHER_APPS.map(app => (
              <a key={app.url} href={app.url} target="_blank" rel="noreferrer" title={app.label}
                style={{ width:32, height:32, borderRadius:8, background:`${app.color}12`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, color:app.color, textDecoration:"none" }}>
                {app.icon}
              </a>
            ))}
          </div>
        )}

        <div style={{ flex:1 }}/>

        {/* ── UPGRADE NUDGE ── */}
        {!collapsed && plan === "free" && (
          <div style={{ background:`${PINK}08`, border:`1px solid ${PINK}20`, borderRadius:10, padding:"12px 14px", marginBottom:12 }}>
            <div style={{ fontSize:10, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>Free Plan</div>
            <div style={{ fontSize:11, color:"#6b7280", marginBottom:8 }}>Unlock courses & certifications</div>
            <button onClick={() => navigate("/pricing")}
              style={{ fontSize:12, color:PINK, fontWeight:700, background:"none", border:"none", cursor:"pointer", padding:0 }}>
              Upgrade →
            </button>
          </div>
        )}

       {/* Sign out */}
        {!collapsed && (
          <div style={{ borderTop:`1px solid ${BORDER}`, paddingTop:12, marginTop:4 }}>
            <button className="dh-out" onClick={onSignOut}>← Sign out</button>
          </div>
        )}
      </div>
    </>
  );
}