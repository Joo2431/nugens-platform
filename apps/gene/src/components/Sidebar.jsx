import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { NG_LOGO } from "../lib/logo";

const PINK = "#e8185d";

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
  { to:"/business",           icon:"⊞", label:"Dashboard"        },
  { to:"/business/jd",        icon:"▤", label:"JD Generator"     },
  { to:"/business/hiring",    icon:"◎", label:"Hiring AI"        },
  { to:"/business/team",      icon:"◈", label:"Team Skill Map"   },
  { to:"/business/workforce", icon:"⬡", label:"Workforce Plan"   },
  { to:"/business/salary",    icon:"₹", label:"Salary Benchmark" },
  { to:"/business/interview", icon:"◷", label:"Interview AI"     },
  { to:"/pricing",            icon:"↑", label:"Upgrade"          },
];

export default function Sidebar({ userType, dbUserType, profile, onSignOut, onSwitchMode }) {
  const [collapsed,  setCollapsed]  = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const navigate = useNavigate();

  const isBusiness = userType === "business";
  const nav        = isBusiness ? BUSINESS_NAV : INDIVIDUAL_NAV;
  // canSwitch: business users can view individual tools and vice versa
  const canSwitch  = dbUserType === "business" || profile?.plan === "admin";

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
          font-size:13px; font-weight:500; color:#999;
          text-decoration:none; transition:all 0.14s;
          white-space:nowrap; overflow:hidden;
          border:none; background:none; width:100%;
          cursor:pointer; text-align:left;
          font-family:'Plus Jakarta Sans',sans-serif;
        }
        .gn-nav:hover { background:#fff0f4; color:${PINK}; }
        .gn-nav:hover .gn-ico { color:${PINK}; }
        .gn-nav.active { background:${PINK}12; color:${PINK}; font-weight:700; }
        .gn-nav.active .gn-ico { color:${PINK}; }
        .gn-ico { font-size:13px; flex-shrink:0; width:16px; text-align:center; color:#ccc; }
        .gn-sw-item {
          display:flex; align-items:center; gap:9px;
          padding:9px 12px; border-radius:8px; cursor:pointer;
          font-size:12.5px; font-weight:500; color:#555;
          transition:all 0.12s; border:none; background:none;
          width:100%; text-align:left;
          font-family:'Plus Jakarta Sans',sans-serif;
        }
        .gn-sw-item:hover { background:#fff0f4; color:${PINK}; }
      `}</style>

      <div className="gn-sb" style={{
        width: collapsed ? 56 : 210,
        minHeight: "100vh",
        background: "#fff",
        borderRight: "1px solid #f0f0f0",
        display: "flex",
        flexDirection: "column",
        padding: "18px 10px 24px",
        transition: "width 0.2s ease",
        position: "sticky",
        top: 0,
        flexShrink: 0,
        boxShadow: "2px 0 10px rgba(0,0,0,0.03)",
      }}>

        {/* ── Logo row ── */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:22, padding:"0 4px" }}>
          {!collapsed && (
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <img src={NG_LOGO} style={{ width:26, height:26, borderRadius:7, objectFit:"cover" }} alt="NG" />
              <span style={{ fontWeight:800, fontSize:15, color:PINK, letterSpacing:"-0.025em", fontStyle:"italic" }}>GEN-E</span>
            </div>
          )}
          <button onClick={() => setCollapsed(c => !c)}
            style={{ background:"none", border:"none", cursor:"pointer", color:"#ccc", fontSize:12, padding:4, lineHeight:1, flexShrink:0 }}>
            {collapsed ? "▶" : "◀"}
          </button>
        </div>

        {/* ── Mode badge ── */}
        {!collapsed && (
          <div style={{ position:"relative", marginBottom:14 }}>
            <button
              onClick={() => canSwitch && setSwitchOpen(o => !o)}
              style={{
                width:"100%", border:"none", borderRadius:9, padding:"8px 11px",
                display:"flex", alignItems:"center", justifyContent:"space-between", gap:6,
                cursor: canSwitch ? "pointer" : "default", transition:"all 0.15s",
                background: isBusiness ? "#eff8ff" : "#fff0f4",
                outline: `1.5px solid ${isBusiness ? "#bae6fd" : "#fce"}`,
                fontFamily:"'Plus Jakarta Sans',sans-serif",
              }}>
              <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                <span style={{ fontSize:14 }}>{isBusiness ? "🏢" : "👤"}</span>
                <div style={{ textAlign:"left" }}>
                  <div style={{ fontSize:9.5, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", color: isBusiness ? "#0284c7" : PINK }}>
                    {isBusiness ? "Business Mode" : "Individual Mode"}
                  </div>
                  <div style={{ fontSize:9, color:"#bbb", fontWeight:500 }}>
                    {isBusiness ? "Workforce tools active" : "Career tools active"}
                  </div>
                </div>
              </div>
              {canSwitch && <span style={{ fontSize:9, color:"#ccc" }}>{switchOpen ? "▲" : "▼"}</span>}
            </button>

            {switchOpen && canSwitch && (
              <>
                <div onClick={() => setSwitchOpen(false)} style={{ position:"fixed", inset:0, zIndex:200 }} />
                <div style={{
                  position:"absolute", top:"calc(100% + 5px)", left:0, right:0, zIndex:201,
                  background:"#fff", border:"1px solid #f0f0f0", borderRadius:11, padding:6,
                  boxShadow:"0 8px 32px rgba(232,24,93,0.1)",
                }}>
                  <div style={{ fontSize:9, color:"#ccc", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", padding:"4px 8px 6px" }}>
                    Switch view
                  </div>
                  {isBusiness ? (
                    <button className="gn-sw-item" onClick={() => handleSwitch("individual")}>
                      <span>👤</span>
                      <div>
                        <div style={{ fontWeight:600, fontSize:12.5 }}>Individual Mode</div>
                        <div style={{ fontSize:10.5, color:"#bbb" }}>Career AI, Resume, Jobs</div>
                      </div>
                    </button>
                  ) : (
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

        {/* ── Sign out — minimal, no user block ── */}
        {!collapsed && (
          <div style={{ marginTop:16, padding:"0 4px" }}>
            <button
              onClick={onSignOut}
              style={{
                width:"100%", padding:"8px 12px",
                background:"none", border:"1px solid #f0f0f0",
                borderRadius:9, cursor:"pointer", fontSize:12,
                color:"#bbb", fontWeight:500, textAlign:"left",
                fontFamily:"'Plus Jakarta Sans',sans-serif",
                transition:"all 0.13s", display:"flex", alignItems:"center", gap:8,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor="#fcc"; e.currentTarget.style.color=PINK; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor="#f0f0f0"; e.currentTarget.style.color="#bbb"; }}>
              ← Sign out
            </button>
          </div>
        )}
      </div>
    </>
  );
}
