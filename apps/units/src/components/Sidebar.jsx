import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { NG_LOGO } from "../lib/logo";

const PINK = "#e8185d";
const BORDER = "#e8eaed";
const TEXT  = "#111827";
const MUTED = "#9ca3af";

const BUSINESS_NAV = [
  { to:"/",         icon:"◎",  label:"Dashboard"        },
  { to:"/feed",     icon:"◉",  label:"Content Feed"     },
  { to:"/guidance", icon:"✦",  label:"AI Guidance"      },
  { to:"/book",     icon:"◈",  label:"Book Our Services"},
  { to:"/pricing",  icon:"↑",  label:"Pricing"          },
];

const INDIVIDUAL_NAV = [
  { to:"/",         icon:"◎",  label:"Dashboard"        },
  { to:"/live",     icon:"⬡",  label:"Live Experience"  },
  { to:"/guide",    icon:"◇",  label:"Entrepreneur Guide"},
  { to:"/validate", icon:"◑",  label:"Idea Validation"  },
  { to:"/book",     icon:"◈",  label:"Book Consultation"},
  { to:"/pricing",  icon:"↑",  label:"Pricing"          },
];

export default function Sidebar({ profile, onSignOut }) {
  const [collapsed, setCollapsed] = useState(false);
  const isBusiness = profile?.user_type === "business";
  const nav        = isBusiness ? BUSINESS_NAV : INDIVIDUAL_NAV;
  const plan       = profile?.plan || "free";
  const firstName  = (profile?.full_name || "").split(" ")[0] || "User";

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
        .u-nav:hover { background:#fef2f2; color:${PINK}; }
        .u-nav.active { background:#fef2f2; color:${PINK}; font-weight:700; }
        .u-nav.active .u-ico { color:${PINK}; }
        .u-ico { font-size:14px; flex-shrink:0; width:18px; text-align:center; color:#d1d5db; }
        .u-nav:hover .u-ico { color:${PINK}; }
        .u-signout { width:100%; padding:9px 13px; background:none; border:1px solid #e8eaed; border-radius:10px; cursor:pointer; font-size:12px; color:#9ca3af; font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.13s; text-align:left; }
        .u-signout:hover { border-color:${PINK}40; color:${PINK}; }
      `}</style>
      <div style={{
        width: collapsed ? 62 : 230,
        minHeight: "100vh",
        background: "#ffffff",
        borderRight: `1px solid ${BORDER}`,
        display: "flex",
        flexDirection: "column",
        padding: "20px 10px 24px",
        transition: "width 0.2s ease",
        position: "sticky",
        top: 0,
        flexShrink: 0,
        fontFamily: "'Plus Jakarta Sans',sans-serif",
        boxShadow: "1px 0 0 #f3f4f6"
      }}>

        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24, paddingLeft:4 }}>
          {!collapsed && (
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <img src={NG_LOGO} style={{ width:28, height:28, borderRadius:7, objectFit:"cover" }} alt="NG" />
              <div>
                <div style={{ fontWeight:800, fontSize:14, color:"#111", letterSpacing:"-0.03em", lineHeight:1.1 }}>
                  The<span style={{ color:PINK }}>Units</span>
                </div>
                <div style={{ fontSize:9, color:MUTED, fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase" }}>by NuGens</div>
              </div>
            </div>
          )}
          <button onClick={()=>setCollapsed(c=>!c)} style={{ background:"none", border:"1px solid #e8eaed", borderRadius:7, cursor:"pointer", color:MUTED, fontSize:11, padding:"4px 7px", flexShrink:0 }}>
            {collapsed ? "▶" : "◀"}
          </button>
        </div>

        {/* Mode badge */}
        {!collapsed && (
          <div style={{ background: isBusiness ? "#fef2f2" : "#f0fdf4", border:`1px solid ${isBusiness ? PINK+"30" : "#bbf7d0"}`, borderRadius:9, padding:"7px 11px", marginBottom:16 }}>
            <div style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", color: isBusiness ? PINK : "#16a34a", marginBottom:2 }}>
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
            <div style={{ width:30, height:30, borderRadius:"50%", background:PINK+"15", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:PINK, flexShrink:0 }}>
              {(profile?.full_name||"U").slice(0,2).toUpperCase()}
            </div>
            <div style={{ overflow:"hidden" }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#111", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{firstName}</div>
              <div style={{ fontSize:10, color:MUTED, textTransform:"capitalize" }}>{plan} plan</div>
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
        {!collapsed && <div style={{ height:1, background:"#f3f4f6", margin:"12px 0" }} />}

        {/* Bottom links */}
        {!collapsed && (
          <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:12 }}>
            {[
              { label:"Gen-E AI", url:"https://gene.nugens.in.net" },
              { label:"DigiHub", url:"https://digihub.nugens.in.net" },
              { label:"NuGens Home", url:"https://nugens.in.net" },
            ].map(l => (
              <a key={l.label} href={l.url} target="_blank" rel="noreferrer" style={{ fontSize:11, color:MUTED, textDecoration:"none", padding:"4px 14px", display:"block" }}>
                ↗ {l.label}
              </a>
            ))}
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
