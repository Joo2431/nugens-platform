import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { NG_LOGO } from "../lib/logo";

const PINK = "#e8185d";

const INDIVIDUAL_NAV = [
  { path:"/chat",    query:"",          icon:"◎", label:"Career AI"       },
  { path:"/resumes", query:"",          icon:"▤", label:"Resume Vault"    },
  { path:"/jobs",    query:"",          icon:"◑", label:"Job Tracker"     },
  { path:"/chat",    query:"skill_gap", icon:"◈", label:"Skill Gap"       },
  { path:"/chat",    query:"simulate",  icon:"⬡", label:"Career Simulate" },
  { path:"/chat",    query:"roadmap",   icon:"→", label:"Roadmap"         },
  { path:"/chat",    query:"interview", icon:"◷", label:"Interview Prep"  },
  { path:"/pricing", query:"",          icon:"↑", label:"Upgrade"         },
];

const BUSINESS_NAV = [
  { path:"/business", query:"",          icon:"⊞", label:"Dashboard"        },
  { path:"/chat",     query:"jd",        icon:"▤", label:"JD Generator"     },
  { path:"/chat",     query:"hiring",    icon:"◎", label:"Hiring AI"        },
  { path:"/chat",     query:"team",      icon:"◈", label:"Team Skill Map"   },
  { path:"/chat",     query:"workforce", icon:"⬡", label:"Workforce Plan"   },
  { path:"/chat",     query:"salary",    icon:"₹", label:"Salary Benchmark" },
  { path:"/chat",     query:"interview", icon:"◷", label:"Interview AI"     },
  { path:"/pricing",  query:"",          icon:"↑", label:"Upgrade"          },
];

const PLAN_LABELS = {
  free:    "Free",
  monthly: "Pro Monthly",
  yearly:  "Pro Yearly",
  admin:   "Admin",
};

function NavItem({ item, collapsed }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dest     = item.query ? `${item.path}?t=${item.query}` : item.path;

  const isActive = (() => {
    if (item.path === "/chat") {
      if (item.query) {
        return location.pathname === "/chat" && location.search.includes(`t=${item.query}`);
      }
      return location.pathname === "/chat" && !location.search.includes("t=");
    }
    return location.pathname === item.path;
  })();

  return (
    <button
      onClick={() => navigate(dest)}
      title={collapsed ? item.label : undefined}
      aria-label={item.label}
      aria-current={isActive ? "page" : undefined}
      style={{
        display:"flex", alignItems:"center", gap:10,
        padding: collapsed ? "9px 0" : "9px 12px",
        justifyContent: collapsed ? "center" : "flex-start",
        borderRadius:9, fontSize:13,
        fontWeight: isActive ? 700 : 500,
        color: isActive ? PINK : "#888",
        background: isActive ? `${PINK}10` : "none",
        border:"none", cursor:"pointer", textAlign:"left", width:"100%",
        fontFamily:"'Plus Jakarta Sans',sans-serif",
        transition:"color 0.14s, background 0.14s",
      }}
      onMouseEnter={e => {
        if (!isActive) {
          e.currentTarget.style.background = "#fff0f4";
          e.currentTarget.style.color = PINK;
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          e.currentTarget.style.background = "none";
          e.currentTarget.style.color = "#888";
        }
      }}
    >
      <span style={{
        fontSize:13, flexShrink:0,
        color: isActive ? PINK : "#ccc",
        width:16, textAlign:"center",
        transition:"color 0.14s",
      }}>
        {item.icon}
      </span>
      {!collapsed && (
        <span style={{ whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
          {item.label}
        </span>
      )}
    </button>
  );
}

export default function Sidebar({ userType, dbUserType, profile, user, onSignOut, onSwitchMode }) {
  const [collapsed,  setCollapsed]  = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const navigate = useNavigate();

  const isBusiness = userType === "business";
  const nav        = isBusiness ? BUSINESS_NAV : INDIVIDUAL_NAV;
  const canSwitch  = dbUserType === "business" || profile?.plan === "admin";
  const plan       = profile?.plan || "free";
  const planLabel  = PLAN_LABELS[plan] || plan;

  // Name resolution — never shows "User":
  // 1. profile.full_name (saved at signup)
  // 2. OAuth metadata full_name (Google login)
  // 3. OAuth metadata name (other providers)
  // 4. email prefix (e.g. john from john@gmail.com)
  // 5. "You" as absolute last resort
  const resolvedName =
    profile?.full_name?.trim() ||
    user?.user_metadata?.full_name?.trim() ||
    user?.user_metadata?.name?.trim() ||
    user?.email?.split("@")[0]?.trim() ||
    "You";

  const firstName = resolvedName.split(" ")[0];
  const initials  = firstName.slice(0, 2).toUpperCase();

  const handleSwitch = (mode) => {
    setSwitchOpen(false);
    onSwitchMode(mode);
    navigate(mode === "business" ? "/business" : "/chat");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .gn-mode-sw {
          width:100%; border:none; border-radius:9px; padding:7px 11px;
          display:flex; align-items:center; justify-content:space-between; gap:6px;
          font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.15s; cursor:pointer;
        }
        .gn-sw-item {
          display:flex; align-items:center; gap:9px; padding:9px 12px;
          border-radius:8px; cursor:pointer; font-size:12px; font-weight:500; color:#555;
          transition:background 0.12s, color 0.12s; border:none; background:none;
          width:100%; text-align:left; font-family:'Plus Jakarta Sans',sans-serif;
        }
        .gn-sw-item:hover { background:#fff0f4; color:#e8185d; }
        .gn-signout {
          width:100%; padding:8px 12px; background:none; border:1px solid #f0f0f0;
          border-radius:9px; cursor:pointer; font-size:12px; color:#bbb; font-weight:500;
          text-align:left; font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.13s;
          display:flex; align-items:center; gap:8px;
        }
        .gn-signout:hover { border-color:#fcc; color:#e8185d; }
      `}</style>

      <div style={{
        width: collapsed ? 52 : 200,
        minHeight:"100vh",
        background:"#fff",
        borderRight:"1px solid #f0f0f0",
        display:"flex", flexDirection:"column",
        padding:"16px 8px 20px",
        transition:"width 0.2s ease",
        position:"sticky", top:0,
        height:"100vh", overflowY:"auto",
        flexShrink:0,
        fontFamily:"'Plus Jakarta Sans',sans-serif",
        boxShadow:"1px 0 0 #f9f9f9",
      }}>

        {/* Logo + collapse toggle */}
        <div style={{
          display:"flex", alignItems:"center",
          justifyContent: collapsed ? "center" : "space-between",
          marginBottom:16, paddingLeft: collapsed ? 0 : 4, flexShrink:0,
        }}>
          {!collapsed && (
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <img src={NG_LOGO} style={{ width:26, height:26, borderRadius:7, objectFit:"cover" }} alt="NuGens" />
              <span style={{ fontWeight:800, fontSize:14, color:"#111", letterSpacing:"-0.03em" }}>
                Gen-<span style={{ color:PINK }}>E</span>
              </span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            style={{
              background:"none", border:"1px solid #f0f0f0", borderRadius:6,
              cursor:"pointer", color:"#ccc", fontSize:10,
              padding:"4px 6px", flexShrink:0, lineHeight:1,
            }}
          >
            {collapsed ? "▶" : "◀"}
          </button>
        </div>

        {/* Mode switcher */}
        {!collapsed && (
          <div style={{ position:"relative", marginBottom:10, flexShrink:0 }}>
            <button
              className="gn-mode-sw"
              onClick={() => canSwitch && setSwitchOpen(o => !o)}
              aria-expanded={switchOpen}
              style={{
                background: isBusiness ? "#eff8ff" : `${PINK}08`,
                outline: `1.5px solid ${isBusiness ? "#bae6fd" : PINK + "20"}`,
                cursor: canSwitch ? "pointer" : "default",
              }}
            >
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ fontSize:12 }}>{isBusiness ? "🏢" : "👤"}</span>
                <span style={{
                  fontSize:9, fontWeight:800, textTransform:"uppercase",
                  letterSpacing:"0.1em",
                  color: isBusiness ? "#0284c7" : PINK,
                }}>
                  {isBusiness ? "Business" : "Individual"}
                </span>
              </div>
              {canSwitch && (
                <span style={{ fontSize:9, color:"#ccc" }}>{switchOpen ? "▲" : "▼"}</span>
              )}
            </button>

            {switchOpen && canSwitch && (
              <>
                <div onClick={() => setSwitchOpen(false)} style={{ position:"fixed", inset:0, zIndex:200 }} />
                <div style={{
                  position:"absolute", top:"calc(100% + 5px)", left:0, right:0, zIndex:201,
                  background:"#fff", border:"1px solid #f0f0f0", borderRadius:11, padding:6,
                  boxShadow:`0 8px 32px ${PINK}18`,
                }}>
                  <div style={{ fontSize:9, color:"#ccc", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", padding:"4px 8px 6px" }}>
                    Switch view
                  </div>
                  {isBusiness ? (
                    <button className="gn-sw-item" onClick={() => handleSwitch("individual")}>
                      <span>👤</span>
                      <div>
                        <div style={{ fontWeight:600, fontSize:12 }}>Individual</div>
                        <div style={{ fontSize:10, color:"#bbb" }}>Career AI, Resume, Jobs</div>
                      </div>
                    </button>
                  ) : (
                    <button className="gn-sw-item" onClick={() => handleSwitch("business")}>
                      <span>🏢</span>
                      <div>
                        <div style={{ fontWeight:600, fontSize:12 }}>Business</div>
                        <div style={{ fontSize:10, color:"#bbb" }}>Hiring AI, Workforce, Salary</div>
                      </div>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* User chip */}
        {!collapsed && (
          <div style={{
            display:"flex", alignItems:"center", gap:8,
            padding:"6px 10px", background:"#fafafa",
            borderRadius:8, marginBottom:10, flexShrink:0,
          }}>
            <div style={{
              width:24, height:24, borderRadius:"50%",
              background:`${PINK}15`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:9, fontWeight:800, color:PINK, flexShrink:0,
            }}>
              {initials}
            </div>
            <div style={{ overflow:"hidden", minWidth:0 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#111", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                {firstName}
              </div>
              <div style={{ fontSize:9, color:"#bbb", textTransform:"capitalize" }}>
                {planLabel}
              </div>
            </div>
          </div>
        )}

        {/* Navigation — single unified list */}
        <nav style={{ flex:1, display:"flex", flexDirection:"column", gap:1 }} aria-label="Main navigation">
          {nav.map((n, i) => (
            <NavItem key={`${n.path}-${n.query || i}`} item={n} collapsed={collapsed} />
          ))}
        </nav>

        {/* Free plan nudge */}
        {!collapsed && plan === "free" && (
          <div style={{
            background:"#fff5f7", border:"1px solid #fce",
            borderRadius:10, padding:"9px 11px",
            marginBottom:10, marginTop:8, flexShrink:0,
          }}>
            <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#ddd", marginBottom:4 }}>
              Free Plan
            </div>
            <div style={{ fontSize:10, color:"#bbb", marginBottom:6 }}>
              20 questions included
            </div>
            <button
              onClick={() => navigate("/pricing")}
              style={{ background:"none", border:"none", padding:0, fontSize:11, color:PINK, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}
            >
              Upgrade to Pro →
            </button>
          </div>
        )}

        {/* Sign out */}
        {!collapsed && (
          <button className="gn-signout" onClick={onSignOut}>
            ← Sign out
          </button>
        )}

      </div>
    </>
  );
}