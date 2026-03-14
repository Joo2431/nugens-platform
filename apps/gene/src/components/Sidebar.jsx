import React, { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { NG_LOGO } from "../lib/logo";

const PINK = "#e8185d";

const INDIVIDUAL_NAV = [
  { path:"/chat",             query:"",          icon:"◎", label:"Career AI",       isData:false },
  { path:"/resumes",          query:"",          icon:"▤", label:"Resume Vault",    isData:true  },
  { path:"/jobs",             query:"",          icon:"◑", label:"Job Tracker",     isData:true  },
  { path:"/chat",             query:"skill_gap", icon:"◈", label:"Skill Gap",       isData:false },
  { path:"/chat",             query:"simulate",  icon:"⬡", label:"Career Simulate", isData:false },
  { path:"/chat",             query:"roadmap",   icon:"→", label:"Roadmap",         isData:false },
  { path:"/pricing",          query:"",          icon:"↑", label:"Upgrade",         isData:false },
];

const BUSINESS_NAV = [
  { path:"/business",         query:"",          icon:"⊞", label:"Dashboard",       isData:false },
  { path:"/chat",             query:"jd",        icon:"▤", label:"JD Generator",    isData:false },
  { path:"/chat",             query:"hiring",    icon:"◎", label:"Hiring AI",       isData:false },
  { path:"/chat",             query:"team",      icon:"◈", label:"Team Skill Map",  isData:false },
  { path:"/chat",             query:"workforce", icon:"⬡", label:"Workforce Plan",  isData:false },
  { path:"/chat",             query:"salary",    icon:"₹", label:"Salary Benchmark",isData:false },
  { path:"/chat",             query:"interview", icon:"◷", label:"Interview AI",    isData:false },
  { path:"/pricing",          query:"",          icon:"↑", label:"Upgrade",         isData:false },
];

function NavItem({ item, collapsed, isBusiness }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const dest      = item.query ? `${item.path}?t=${item.query}` : item.path;
  const isActive  = location.pathname === item.path &&
    (item.query ? location.search.includes(`t=${item.query}`) : !location.search.includes("t=") || item.path !== "/chat");

  // Special case: /chat with no query = Career AI, active only when no ?t=
  const chatNoQuery = item.path === "/chat" && !item.query;
  const chatActive  = chatNoQuery
    ? location.pathname === "/chat" && !location.search
    : isActive;

  const active = item.path !== "/chat" ? location.pathname === item.path : (item.query ? isActive : chatActive);

  return (
    <button
      onClick={() => navigate(dest)}
      className={`gn-nav${active ? " active" : ""}`}
      style={{ border:"none", cursor:"pointer", textAlign:"left", width:"100%" }}
    >
      <span className="gn-ico">{item.icon}</span>
      {!collapsed && item.label}
    </button>
  );
}

export default function Sidebar({ userType, dbUserType, profile, onSignOut, onSwitchMode }) {
  const [collapsed,  setCollapsed]  = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const navigate = useNavigate();

  const isBusiness = userType === "business";
  const nav        = isBusiness ? BUSINESS_NAV : INDIVIDUAL_NAV;
  const canSwitch  = dbUserType === "business" || profile?.plan === "admin";
  const plan       = profile?.plan || "free";

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
          background:none; font-family:'Plus Jakarta Sans',sans-serif;
        }
        .gn-nav:hover { background:#fff0f4; color:${PINK}; }
        .gn-nav:hover .gn-ico { color:${PINK}; }
        .gn-nav.active { background:${PINK}12; color:${PINK}; font-weight:700; }
        .gn-nav.active .gn-ico { color:${PINK}; }
        .gn-ico { font-size:13px; flex-shrink:0; width:16px; text-align:center; color:#ddd; }
        .gn-sw-item {
          display:flex; align-items:center; gap:9px; padding:9px 12px; border-radius:8px;
          cursor:pointer; font-size:12.5px; font-weight:500; color:#555;
          transition:all 0.12s; border:none; background:none; width:100%; text-align:left;
          font-family:'Plus Jakarta Sans',sans-serif;
        }
        .gn-sw-item:hover { background:#fff0f4; color:${PINK}; }
      `}</style>

      <div className="gn-sb" style={{
        width: collapsed ? 56 : 210,
        minHeight: "100vh",
        background: "#fff",
        borderRight: "1px solid #f0f0f0",
        display: "flex", flexDirection: "column",
        padding: "18px 10px 24px",
        transition: "width 0.2s ease",
        position: "sticky", top: 0, flexShrink: 0,
        boxShadow: "2px 0 12px rgba(0,0,0,0.04)",
      }}>

        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, padding:"0 4px" }}>
          {!collapsed && (
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <img src={NG_LOGO} style={{ width:26, height:26, borderRadius:7, objectFit:"cover" }} alt="NG" />
              <span style={{ fontWeight:800, fontSize:15, color:PINK, letterSpacing:"-0.025em", fontStyle:"italic" }}>GEN-E</span>
            </div>
          )}
          <button onClick={() => setCollapsed(c => !c)}
            style={{ background:"none", border:"none", cursor:"pointer", color:"#ccc", fontSize:11, padding:4, lineHeight:1, flexShrink:0 }}>
            {collapsed ? "▶" : "◀"}
          </button>
        </div>

        {/* Mode badge */}
        {!collapsed && (
          <div style={{ position:"relative", marginBottom:12 }}>
            <button
              onClick={() => canSwitch && setSwitchOpen(o => !o)}
              style={{
                width:"100%", border:"none", borderRadius:9, padding:"7px 11px",
                display:"flex", alignItems:"center", justifyContent:"space-between", gap:6,
                cursor: canSwitch ? "pointer" : "default", transition:"all 0.15s",
                background: isBusiness ? "#eff8ff" : `${PINK}08`,
                outline: `1.5px solid ${isBusiness ? "#bae6fd" : PINK+"20"}`,
                fontFamily:"'Plus Jakarta Sans',sans-serif",
              }}>
              <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                <span style={{ fontSize:13 }}>{isBusiness ? "🏢" : "👤"}</span>
                <div>
                  <div style={{ fontSize:9.5, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", color: isBusiness ? "#0284c7" : PINK }}>
                    {isBusiness ? "Business Mode" : "Individual Mode"}
                  </div>
                  <div style={{ fontSize:9, color:"#ccc", fontWeight:500 }}>
                    {isBusiness ? "Workforce AI" : "Career AI"}
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
                  <div style={{ fontSize:9, color:"#ccc", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", padding:"4px 8px 6px" }}>Switch view</div>
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
                        <div style={{ fontSize:10.5, color:"#bbb" }}>Hiring AI, Workforce, Salary</div>
                      </div>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex:1, display:"flex", flexDirection:"column", gap:2 }}>
          {nav.map((n, i) => (
            <NavItem key={i} item={n} collapsed={collapsed} isBusiness={isBusiness} />
          ))}
        </nav>

        {/* Plan banner */}
        {!collapsed && plan === "free" && (
          <div style={{ background:"#fff5f7", border:"1px solid #fce", borderRadius:10, padding:"10px 12px", marginBottom:12 }}>
            <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#ddd", marginBottom:5 }}>Free Plan</div>
            <button onClick={() => navigate("/pricing")} style={{ background:"none", border:"none", padding:0, fontSize:12, color:PINK, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
              Upgrade to Pro →
            </button>
          </div>
        )}

        {/* Sign out */}
        {!collapsed && (
          <button onClick={onSignOut} style={{
            width:"100%", padding:"8px 12px", background:"none",
            border:"1px solid #f0f0f0", borderRadius:9, cursor:"pointer",
            fontSize:12, color:"#ccc", fontWeight:500, textAlign:"left",
            fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all 0.13s",
            display:"flex", alignItems:"center", gap:8,
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor="#fcc"; e.currentTarget.style.color=PINK; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor="#f0f0f0"; e.currentTarget.style.color="#ccc"; }}>
            ← Sign out
          </button>
        )}
      </div>
    </>
  );
}
