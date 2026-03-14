import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { NG_LOGO } from "../lib/logo";

const PINK = "#e8185d";
const B    = "#1e1e1e";

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
  const [collapsed,    setCollapsed]    = useState(false);
  const [switchOpen,   setSwitchOpen]   = useState(false);
  const nav        = userType === "business" ? BUSINESS_NAV : INDIVIDUAL_NAV;
  const firstName  = (profile?.full_name || "").split(" ")[0] || "User";
  const initials   = firstName.slice(0,2).toUpperCase();
  const plan       = profile?.plan || "free";
  const avatar     = profile?.avatar_url || null;
  const navigate   = useNavigate();

  const isBusiness = userType === "business";
  // Show switch option if DB type is business OR they have access to both
  const canSwitchToIndividual = isBusiness;
  const canSwitchToBusiness   = !isBusiness && (dbUserType === "business" || plan !== "free");

  const handleSwitch = (mode) => {
    setSwitchOpen(false);
    onSwitchMode(mode);
    navigate(mode === "business" ? "/business" : "/chat");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .gn-nav{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;font-size:13px;font-weight:500;color:#555;text-decoration:none;transition:all 0.14s;white-space:nowrap;overflow:hidden;border:none;background:none;width:100%;cursor:pointer;text-align:left;font-family:'Plus Jakarta Sans',sans-serif}
        .gn-nav:hover{background:#1a1a1a;color:#e8e8e8}
        .gn-nav.active{background:${PINK}15;color:#fff}
        .gn-nav.active .gn-ico{color:${PINK}}
        .gn-ico{font-size:13px;flex-shrink:0;width:16px;text-align:center}
        .mode-badge-btn{cursor:pointer;transition:all 0.15s;}
        .mode-badge-btn:hover{opacity:0.85}
        .sw-item{display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:8px;cursor:pointer;font-size:12.5px;font-weight:500;transition:all 0.12s;border:none;background:none;width:100%;text-align:left;font-family:'Plus Jakarta Sans',sans-serif}
        .sw-item:hover{background:#1a1a1a}
      `}</style>
      <div style={{width:collapsed?56:210,minHeight:"100vh",background:"#0a0a0a",borderRight:`1px solid ${B}`,display:"flex",flexDirection:"column",padding:"18px 10px",transition:"width 0.2s ease",position:"sticky",top:0,flexShrink:0,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>

        {/* Logo row */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,padding:"0 4px"}}>
          {!collapsed && (
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <img src={NG_LOGO} style={{width:26,height:26,borderRadius:6,objectFit:"cover"}} alt="NG"/>
              <span style={{fontWeight:800,fontSize:15,color:PINK,letterSpacing:"-0.025em",fontStyle:"italic"}}>GEN-E</span>
            </div>
          )}
          <button onClick={()=>setCollapsed(c=>!c)} style={{background:"none",border:"none",cursor:"pointer",color:"#444",fontSize:13,padding:4,lineHeight:1,flexShrink:0}}>{collapsed?"▶":"◀"}</button>
        </div>

        {/* Mode badge — clickable to switch */}
        {!collapsed && (
          <div style={{position:"relative",marginBottom:16}}>
            <button
              className="mode-badge-btn"
              onClick={()=>(canSwitchToIndividual||canSwitchToBusiness)?setSwitchOpen(o=>!o):null}
              style={{
                width:"100%",
                background:isBusiness?"#0c2a3d":`${PINK}10`,
                border:`1px solid ${isBusiness?"#0c3a5d":PINK+"30"}`,
                borderRadius:7,padding:"5px 10px",
                display:"flex",alignItems:"center",justifyContent:"space-between",gap:6,
                cursor:(canSwitchToIndividual||canSwitchToBusiness)?"pointer":"default"
              }}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:8,lineHeight:1}}>{isBusiness?"🏢":"👤"}</span>
                <span style={{fontSize:9,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.1em",color:isBusiness?"#0ea5e9":PINK}}>
                  {isBusiness?"Business Mode":"Individual Mode"}
                </span>
              </div>
              {(canSwitchToIndividual||canSwitchToBusiness) && (
                <span style={{fontSize:9,color:"#444"}}>{switchOpen?"▲":"▼"}</span>
              )}
            </button>

            {/* Switch dropdown */}
            {switchOpen && (
              <>
                <div onClick={()=>setSwitchOpen(false)} style={{position:"fixed",inset:0,zIndex:200}}/>
                <div style={{
                  position:"absolute",top:"calc(100% + 4px)",left:0,right:0,zIndex:201,
                  background:"#111",border:`1px solid ${B}`,borderRadius:10,
                  padding:6,boxShadow:"0 8px 32px rgba(0,0,0,0.4)"
                }}>
                  <div style={{fontSize:9,color:"#444",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",padding:"4px 8px 6px"}}>
                    Switch mode
                  </div>
                  {canSwitchToIndividual && (
                    <button className="sw-item" onClick={()=>handleSwitch("individual")}>
                      <span style={{fontSize:12}}>👤</span>
                      <div>
                        <div style={{color:"#e8e8e8",fontSize:12.5,fontWeight:600}}>Individual Mode</div>
                        <div style={{color:"#555",fontSize:10.5}}>Career AI, Resume, Jobs</div>
                      </div>
                    </button>
                  )}
                  {canSwitchToBusiness && (
                    <button className="sw-item" onClick={()=>handleSwitch("business")}>
                      <span style={{fontSize:12}}>🏢</span>
                      <div>
                        <div style={{color:"#e8e8e8",fontSize:12.5,fontWeight:600}}>Business Mode</div>
                        <div style={{color:"#555",fontSize:10.5}}>Hiring AI, Team Map, Salary</div>
                      </div>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Nav */}
        <nav style={{flex:1,display:"flex",flexDirection:"column",gap:2}}>
          {nav.map(n=>(
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to==="/chat"||(n.to==="/business"&&isBusiness)}
              className={({isActive})=>`gn-nav${isActive?" active":""}`}
            >
              <span className="gn-ico">{n.icon}</span>
              {!collapsed && n.label}
            </NavLink>
          ))}
        </nav>

        {/* Plan banner */}
        {!collapsed && plan==="free" && (
          <div style={{background:"#111",border:`1px solid ${B}`,borderRadius:9,padding:"10px 12px",marginBottom:12}}>
            <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"#444",marginBottom:4}}>Free Plan</div>
            <NavLink to="/pricing" style={{fontSize:11.5,color:PINK,fontWeight:600,textDecoration:"none"}}>Upgrade →</NavLink>
          </div>
        )}

        {/* Profile */}
        <div style={{display:"flex",alignItems:"center",gap:9,padding:"10px 8px",borderTop:`1px solid ${B}`,marginTop:4}}>
          <div style={{width:30,height:30,borderRadius:"50%",flexShrink:0,overflow:"hidden",background:`${PINK}20`,border:`1.5px solid ${PINK}40`,display:"flex",alignItems:"center",justifyContent:"center"}}>
            {avatar
              ? <img src={avatar} style={{width:30,height:30,objectFit:"cover"}} alt={firstName}/>
              : <span style={{fontSize:11,fontWeight:700,color:PINK}}>{initials}</span>}
          </div>
          {!collapsed && (
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12.5,fontWeight:600,color:"#e8e8e8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{firstName}</div>
              <button onClick={onSignOut} style={{background:"none",border:"none",fontSize:11,color:"#555",cursor:"pointer",padding:0,fontFamily:"inherit"}}>Sign out</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
