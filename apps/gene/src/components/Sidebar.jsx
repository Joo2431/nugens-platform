import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { NG_LOGO } from "../lib/logo";
import { PLATFORM_LINKS } from "../lib/platformAccess";

const PINK = "#e8185d";
const OTHER_APPS = PLATFORM_LINKS.filter(a => !a.url.includes("gene.nugens"));

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

const PLAN_LABELS = { free:"Free", monthly:"Pro Monthly", yearly:"Pro Yearly", admin:"Admin" };

/* ── NavItem — self-contained, gets all it needs via props ── */
function NavItem({ item, isCollapsed, onNavigate }) {
  const location = useLocation();

  const isActive = (() => {
    if (item.path === "/chat") {
      if (item.query) return location.pathname === "/chat" && location.search.includes(`t=${item.query}`);
      return location.pathname === "/chat" && !location.search.includes("t=");
    }
    return location.pathname === item.path;
  })();

  return (
    <button
      onClick={() => onNavigate(item.query ? `${item.path}?t=${item.query}` : item.path)}
      title={isCollapsed ? item.label : undefined}
      style={{
        display:"flex", alignItems:"center", gap:10,
        padding: isCollapsed ? "9px 0" : "9px 12px",
        justifyContent: isCollapsed ? "center" : "flex-start",
        borderRadius:9, fontSize:13,
        fontWeight: isActive ? 700 : 500,
        color: isActive ? PINK : "#888",
        background: isActive ? `${PINK}10` : "none",
        border:"none", cursor:"pointer", textAlign:"left", width:"100%",
        fontFamily:"'Plus Jakarta Sans',sans-serif",
        transition:"color 0.14s, background 0.14s",
      }}
      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background="#fff0f4"; e.currentTarget.style.color=PINK; }}}
      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background="none"; e.currentTarget.style.color="#888"; }}}
    >
      <span style={{ fontSize:13, flexShrink:0, color:isActive?PINK:"#ccc", width:16, textAlign:"center" }}>{item.icon}</span>
      {!isCollapsed && <span style={{ whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.label}</span>}
    </button>
  );
}

export default function Sidebar({ userType, dbUserType, profile, user, onSignOut, onSwitchMode, open, onClose }) {
  const [collapsed,  setCollapsed]  = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [isMobile,   setIsMobile]   = useState(() => window.innerWidth < 768);
  const navigate = useNavigate();

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const isBusiness = userType === "business";
  const nav        = isBusiness ? BUSINESS_NAV : INDIVIDUAL_NAV;
  const canSwitch  = dbUserType === "business" || profile?.plan === "admin";
  const plan       = profile?.plan || "free";
  const planLabel  = PLAN_LABELS[plan] || plan;

  const resolvedName =
    profile?.full_name?.trim() ||
    user?.user_metadata?.full_name?.trim() ||
    user?.user_metadata?.name?.trim() ||
    user?.email?.split("@")[0]?.trim() || "You";
  const firstName = resolvedName.split(" ")[0];
  const initials  = firstName.slice(0,2).toUpperCase();

  const handleSwitch = (mode) => {
    setSwitchOpen(false);
    onSwitchMode(mode);
    navigate(mode === "business" ? "/business" : "/chat");
    if (isMobile && onClose) onClose();
  };

  /* Navigate and always close mobile drawer */
  const handleNav = (dest) => {
    navigate(dest);
    if (isMobile && onClose) onClose();
  };

  /* On desktop the sidebar collapses; on mobile it never collapses (it slides in/out) */
  const showCollapsed = !isMobile && collapsed;

  const sidebarContent = (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .gn-mode-sw { width:100%; border:none; border-radius:9px; padding:7px 11px; display:flex; align-items:center; justify-content:space-between; gap:6px; font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.15s; cursor:pointer; }
        .gn-sw-item { display:flex; align-items:center; gap:9px; padding:9px 12px; border-radius:8px; cursor:pointer; font-size:12px; font-weight:500; color:#555; transition:background 0.12s, color 0.12s; border:none; background:none; width:100%; text-align:left; font-family:'Plus Jakarta Sans',sans-serif; }
        .gn-sw-item:hover { background:#fff0f4; color:${PINK}; }
        .gn-app-link { display:flex; align-items:center; gap:9px; padding:8px 12px; border-radius:9px; text-decoration:none; font-size:12px; font-weight:600; color:#6b7280; transition:all 0.14s; }
        .gn-app-link:hover { background:#f8f9fb; color:#111; }
        .gn-signout { width:100%; padding:8px 12px; background:none; border:1px solid #f0f0f0; border-radius:9px; cursor:pointer; font-size:12px; color:#bbb; font-weight:500; text-align:left; font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.13s; display:flex; align-items:center; gap:8px; }
        .gn-signout:hover { border-color:#fcc; color:${PINK}; }
      `}</style>

      <div style={{
        width: showCollapsed ? 52 : 200,
        height: "100vh",
        background: "#fff",
        borderRight: "1px solid #f0f0f0",
        display: "flex",
        flexDirection: "column",
        padding: "16px 8px 20px",
        transition: "width 0.2s ease",
        overflowY: "auto",
        overflowX: "hidden",
        flexShrink: 0,
        fontFamily: "'Plus Jakarta Sans',sans-serif",
        boxSizing: "border-box",
      }}>

        {/* Logo row */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:showCollapsed?"center":"space-between", marginBottom:16, paddingLeft:showCollapsed?0:4, flexShrink:0 }}>
          {!showCollapsed && (
            <a href="https://nugens.in.net" style={{ display:"flex", alignItems:"center", gap:8, textDecoration:"none" }}>
              <img src={NG_LOGO} style={{ width:26, height:26, borderRadius:7, objectFit:"cover" }} alt="Nugens" />
              <span style={{ fontWeight:800, fontSize:14, color:"#111", letterSpacing:"-0.03em" }}>Gen-<span style={{ color:PINK }}>E</span></span>
            </a>
          )}
          {/* Only show collapse toggle on desktop */}
          {!isMobile && (
            <button onClick={() => setCollapsed(c=>!c)}
              style={{ background:"none", border:"1px solid #f0f0f0", borderRadius:6, cursor:"pointer", color:"#ccc", fontSize:10, padding:"4px 6px", flexShrink:0, lineHeight:1 }}>
              {collapsed ? "▶" : "◀"}
            </button>
          )}
          {/* Show close (×) button on mobile */}
          {isMobile && (
            <button onClick={onClose}
              style={{ background:"none", border:"1px solid #f0f0f0", borderRadius:6, cursor:"pointer", color:"#888", fontSize:14, padding:"4px 8px", lineHeight:1, marginLeft:"auto" }}>
              ✕
            </button>
          )}
        </div>

        {/* Mode badge */}
        {!showCollapsed && (
          <div style={{ position:"relative", marginBottom:10, flexShrink:0 }}>
            <button className="gn-mode-sw" onClick={() => canSwitch && setSwitchOpen(o=>!o)}
              style={{ background:isBusiness?"#eff8ff":`${PINK}08`, outline:`1.5px solid ${isBusiness?"#bae6fd":PINK+"20"}`, cursor:canSwitch?"pointer":"default" }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ fontSize:12 }}>{isBusiness?"🏢":"👤"}</span>
                <span style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", color:isBusiness?"#0284c7":PINK }}>
                  {isBusiness?"Business":"Individual"}
                </span>
              </div>
              {canSwitch && <span style={{ fontSize:9, color:"#ccc" }}>{switchOpen?"▲":"▼"}</span>}
            </button>
            {switchOpen && canSwitch && (
              <>
                <div onClick={()=>setSwitchOpen(false)} style={{ position:"fixed", inset:0, zIndex:200 }}/>
                <div style={{ position:"absolute", top:"calc(100% + 5px)", left:0, right:0, zIndex:201, background:"#fff", border:"1px solid #f0f0f0", borderRadius:11, padding:6, boxShadow:`0 8px 32px ${PINK}18` }}>
                  <div style={{ fontSize:9, color:"#ccc", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", padding:"4px 8px 6px" }}>Switch view</div>
                  {isBusiness ? (
                    <button className="gn-sw-item" onClick={()=>handleSwitch("individual")}><span>👤</span><div><div style={{ fontWeight:600, fontSize:12 }}>Individual</div><div style={{ fontSize:10, color:"#bbb" }}>Career AI, Resume, Jobs</div></div></button>
                  ) : (
                    <button className="gn-sw-item" onClick={()=>handleSwitch("business")}><span>🏢</span><div><div style={{ fontWeight:600, fontSize:12 }}>Business</div><div style={{ fontSize:10, color:"#bbb" }}>Hiring AI, Workforce, Salary</div></div></button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* User chip */}
        {!showCollapsed && (
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 10px", background:"#fafafa", borderRadius:8, marginBottom:10, flexShrink:0 }}>
            <div style={{ width:24, height:24, borderRadius:"50%", background:`${PINK}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:800, color:PINK, flexShrink:0 }}>{initials}</div>
            <div style={{ overflow:"hidden", minWidth:0 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#111", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{firstName}</div>
              <div style={{ fontSize:9, color:"#bbb", textTransform:"capitalize" }}>{planLabel}</div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex:1, display:"flex", flexDirection:"column", gap:1 }}>
          {nav.map((n,i) => (
            <NavItem
              key={`${n.path}-${n.query||i}`}
              item={n}
              isCollapsed={showCollapsed}
              onNavigate={handleNav}
            />
          ))}
        </nav>

        {/* Divider */}
        {!showCollapsed && <div style={{ height:1, background:"#f3f4f6", margin:"10px 0 8px" }}/>}

        {/* Nugens Suite links */}
        {!showCollapsed && (
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:9, color:"#ccc", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", padding:"0 10px 6px" }}>Nugens Suite</div>
            {OTHER_APPS.map(app => (
              <a key={app.url} href={app.url} className="gn-app-link">
                <span style={{ fontSize:13, color:app.color, width:16, textAlign:"center", flexShrink:0 }}>{app.icon}</span>
                {app.label}
              </a>
            ))}
          </div>
        )}

        {/* Collapsed suite icons */}
        {showCollapsed && (
          <div style={{ display:"flex", flexDirection:"column", gap:5, alignItems:"center", marginBottom:8 }}>
            {OTHER_APPS.map(app => (
              <a key={app.url} href={app.url} title={app.label}
                style={{ width:30, height:30, borderRadius:8, background:`${app.color}12`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:app.color, textDecoration:"none" }}>
                {app.icon}
              </a>
            ))}
          </div>
        )}

        {/* Free plan nudge */}
        {!showCollapsed && plan === "free" && (
          <div style={{ background:"#fff5f7", border:"1px solid #fce", borderRadius:10, padding:"9px 11px", marginBottom:10, flexShrink:0 }}>
            <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#ddd", marginBottom:4 }}>Free Plan</div>
            <div style={{ fontSize:10, color:"#bbb", marginBottom:6 }}>20 questions included</div>
            <button onClick={() => handleNav("/pricing")} style={{ background:"none", border:"none", padding:0, fontSize:11, color:PINK, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
              Upgrade to Pro →
            </button>
          </div>
        )}

        {/* Sign out */}
        {!showCollapsed && (
          <button className="gn-signout" onClick={onSignOut}>← Sign out</button>
        )}
      </div>
    </>
  );

  /* ── Mobile: slide-in drawer ── */
  if (isMobile) {
    if (!open) return null;
    return (
      <>
        <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:999, backdropFilter:"blur(2px)" }}/>
        <div style={{ position:"fixed", top:0, left:0, zIndex:1000, height:"100vh", overflowY:"auto", boxShadow:"4px 0 32px rgba(0,0,0,0.2)" }}>
          {sidebarContent}
        </div>
      </>
    );
  }

  /* ── Desktop: sticky sidebar ── */
  return (
    <div style={{ position:"sticky", top:0, height:"100vh", flexShrink:0, alignSelf:"flex-start" }}>
      {sidebarContent}
    </div>
  );
}