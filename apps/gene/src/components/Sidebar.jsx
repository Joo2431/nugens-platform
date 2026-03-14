import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { NG_LOGO } from "../lib/logo";

const PINK  = "#e8185d";
const LIGHT = "#f9f9f9";

const INDIVIDUAL_NAV = [
  { to:"/chat",      icon:"◎", label:"Career AI"       },
  { to:"/resumes",   icon:"▤", label:"Resume Builder"  },
  { to:"/jobs",      icon:"◑", label:"Job Tracker"     },
  { to:"/skill-gap", icon:"◈", label:"Skill Gap"       },
  { to:"/simulate",  icon:"⬡", label:"Career Simulate" },
  { to:"/roadmap",   icon:"→", label:"Roadmap"         },
  { to:"/pricing",   icon:"↑", label:"Upgrade"         },
];

const BUSINESS_NAV = [
  { to:"/business",            icon:"⊞", label:"Dashboard"        },
  { to:"/business/jd",         icon:"▤", label:"JD Generator"     },
  { to:"/business/hiring",     icon:"◎", label:"Hiring AI"        },
  { to:"/business/team",       icon:"◈", label:"Team Skill Map"   },
  { to:"/business/workforce",  icon:"⬡", label:"Workforce Plan"   },
  { to:"/business/salary",     icon:"₹", label:"Salary Benchmark" },
  { to:"/business/interview",  icon:"◷", label:"Interview AI"     },
  { to:"/pricing",             icon:"↑", label:"Upgrade"          },
];

export default function Sidebar({ userType, dbUserType, profile, onSignOut, onSwitchMode }) {
  const [collapsed,  setCollapsed]  = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const navigate = useNavigate();

  const isBusiness = userType === "business";
  const nav        = isBusiness ? BUSINESS_NAV : INDIVIDUAL_NAV;
  const firstName  = (profile?.full_name || profile?.email || "").split(" ")[0].split("@")[0] || "User";
  const initials   = firstName.slice(0,2).toUpperCase();
  const plan       = profile?.plan || "free";
  const avatar     = profile?.avatar_url || null;

  const canSwitch = dbUserType === "business" || plan === "admin";

  const handleSwitch = (mode) => {
    setSwitchOpen(false);
    onSwitchMode(mode);
    navigate(mode === "business" ? "/business" : "/chat");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .gn-sb { font-family:'Plus Jakarta Sans',sans-serif; }

        .gn-nav {
          display:flex; align-items:center; gap:10px;
          padding:8px 12px; border-radius:9px;
          font-size:13px; font-weight:500;
          color:#888; text-decoration:none;
          transition:all 0.14s; white-space:nowrap;
          overflow:hidden; border:none; background:none;
          width:100%; cursor:pointer; text-align:left;
          font-family:'Plus Jakarta Sans',sans-serif;
        }
        .gn-nav:hover { background:#fff0f4; color:${PINK}; }
        .gn-nav:hover .gn-ico { color:${PINK}; }
        .gn-nav.active { background:${PINK}15; color:${PINK}; font-weight:700; }
        .gn-nav.active .gn-ico { color:${PINK}; }
        .gn-ico { font-size:13px; flex-shrink:0; width:16px; text-align:center; color:#bbb; }

        .gn-badge-btn {
          width:100%; border:none; border-radius:9px; padding:8px 11px;
          display:flex; align-items:center; justify-content:space-between; gap:6px;
          cursor:pointer; transition:all 0.15s; font-family:'Plus Jakarta Sans',sans-serif;
        }
        .gn-badge-btn:hover { filter:brightness(0.97); }

        .gn-sw-item {
          display:flex; align-items:center; gap:9px;
          padding:9px 12px; border-radius:8px;
          cursor:pointer; font-size:12.5px; font-weight:500;
          transition:all 0.12s; border:none; background:none;
          width:100%; text-align:left;
          font-family:'Plus Jakarta Sans',sans-serif;
          color:#555;
        }
        .gn-sw-item:hover { background:#fff0f4; color:${PINK}; }

        .gn-plan-bar {
          background:#fff5f7; border:1px solid #fce;
          border-radius:10px; padding:10px 13px; margin-bottom:12px;
        }
      `}</style>

      <div
        className="gn-sb"
        style={{
          width: collapsed ? 58 : 212,
          minHeight: "100vh",
          background: "#ffffff",
          borderRight: "1px solid #f0f0f0",
          display: "flex",
          flexDirection: "column",
          padding: "18px 10px",
          transition: "width 0.2s ease",
          position: "sticky",
          top: 0,
          flexShrink: 0,
          boxShadow: "2px 0 12px rgba(0,0,0,0.04)",
        }}>

        {/* ── Logo row ── */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24, padding:"0 4px" }}>
          {!collapsed && (
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <img src={NG_LOGO} style={{ width:26, height:26, borderRadius:7, objectFit:"cover" }} alt="NG" />
              <span style={{ fontWeight:800, fontSize:15, color:PINK, letterSpacing:"-0.025em", fontStyle:"italic" }}>GEN-E</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            style={{ background:"none", border:"none", cursor:"pointer", color:"#ccc", fontSize:12, padding:4, lineHeight:1, flexShrink:0 }}>
            {collapsed ? "▶" : "◀"}
          </button>
        </div>

        {/* ── Mode badge ── */}
        {!collapsed && (
          <div style={{ position:"relative", marginBottom:14 }}>
            <button
              className="gn-badge-btn"
              onClick={() => canSwitch && setSwitchOpen(o => !o)}
              style={{
                background: isBusiness ? "#eff8ff" : "#fff0f4",
                border: `1.5px solid ${isBusiness ? "#bae6fd" : "#fce"}`,
                cursor: canSwitch ? "pointer" : "default",
              }}>
              <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                <span style={{ fontSize:13 }}>{isBusiness ? "🏢" : "👤"}</span>
                <div style={{ textAlign:"left" }}>
                  <div style={{ fontSize:9.5, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", color: isBusiness ? "#0284c7" : PINK }}>
                    {isBusiness ? "Business" : "Individual"}
                  </div>
                  <div style={{ fontSize:9, color:"#bbb", fontWeight:500 }}>
                    {isBusiness ? "Workforce tools" : "Career tools"}
                  </div>
                </div>
              </div>
              {canSwitch && (
                <span style={{ fontSize:9, color:"#ccc" }}>{switchOpen ? "▲" : "▼"}</span>
              )}
            </button>

            {/* Switch dropdown */}
            {switchOpen && canSwitch && (
              <>
                <div onClick={() => setSwitchOpen(false)} style={{ position:"fixed", inset:0, zIndex:200 }} />
                <div style={{
                  position:"absolute", top:"calc(100% + 5px)", left:0, right:0, zIndex:201,
                  background:"#fff", border:"1px solid #f0f0f0",
                  borderRadius:11, padding:6,
                  boxShadow:"0 8px 32px rgba(232,24,93,0.1)",
                }}>
                  <div style={{ fontSize:9, color:"#ccc", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", padding:"4px 8px 6px" }}>
                    Switch view
                  </div>
                  {isBusiness && (
                    <button className="gn-sw-item" onClick={() => handleSwitch("individual")}>
                      <span>👤</span>
                      <div>
                        <div style={{ fontWeight:600, fontSize:12.5 }}>Individual Mode</div>
                        <div style={{ fontSize:10.5, color:"#bbb" }}>Career AI, Resume, Jobs</div>
                      </div>
                    </button>
                  )}
                  {!isBusiness && (
                    <button className="gn-sw-item" onClick={() => handleSwitch("business")}>
                      <span>🏢</span>
                      <div>
                        <div style={{ fontWeight:600, fontSize:12.5 }}>Business Mode</div>
                        <div style={{ fontSize:10.5, color:"#bbb" }}>Hiring AI, Team Map, Salary</div>
                      </div>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Nav links ── */}
        <nav style={{ flex:1, display:"flex", flexDirection:"column", gap:2 }}>
          {nav.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/chat" || (n.to === "/business" && isBusiness)}
              className={({ isActive }) => `gn-nav${isActive ? " active" : ""}`}>
              <span className="gn-ico">{n.icon}</span>
              {!collapsed && n.label}
            </NavLink>
          ))}
        </nav>

        {/* ── Plan banner ── */}
        {!collapsed && plan === "free" && (
          <div className="gn-plan-bar">
            <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#ddd", marginBottom:5 }}>
              Free Plan
            </div>
            <NavLink to="/pricing" style={{ fontSize:12, color:PINK, fontWeight:700, textDecoration:"none" }}>
              Upgrade to Pro →
            </NavLink>
          </div>
        )}

        {/* ── Profile ── */}
        <div style={{
          display:"flex", alignItems:"center", gap:9,
          padding:"10px 8px", borderTop:"1px solid #f5f5f5", marginTop:4,
        }}>
          <div style={{
            width:32, height:32, borderRadius:"50%", flexShrink:0, overflow:"hidden",
            background:`${PINK}15`, border:`2px solid ${PINK}30`,
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            {avatar
              ? <img src={avatar} style={{ width:32, height:32, objectFit:"cover" }} alt={firstName} />
              : <span style={{ fontSize:11.5, fontWeight:800, color:PINK }}>{initials}</span>}
          </div>
          {!collapsed && (
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12.5, fontWeight:700, color:"#222", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {firstName}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <span style={{
                  fontSize:9.5, fontWeight:700,
                  color: plan === "free" ? "#bbb" : PINK,
                  textTransform:"uppercase", letterSpacing:"0.05em",
                }}>
                  {plan === "free" ? "Free" : plan === "yearly" ? "Pro ✦" : "Pro"}
                </span>
                <button onClick={onSignOut} style={{ background:"none", border:"none", fontSize:10.5, color:"#ccc", cursor:"pointer", padding:0, fontFamily:"inherit" }}>
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
