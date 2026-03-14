import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { NG_LOGO } from "../lib/logo";

const PINK = "#e8185d";
const B    = "#1e1e1e";

const INDIVIDUAL_NAV = [
  { to:"/",          icon:"◎", label:"Career AI"       },
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

export default function Sidebar({ userType, profile, onSignOut }) {
  const [collapsed, setCollapsed] = useState(false);
  const nav        = userType === "business" ? BUSINESS_NAV : INDIVIDUAL_NAV;
  const firstName  = (profile?.full_name || "").split(" ")[0] || "User";
  const initials   = firstName.slice(0,2).toUpperCase();
  const plan       = profile?.plan || "free";
  const avatar     = profile?.avatar_url || null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .gn-nav{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;font-size:13px;font-weight:500;color:#555;text-decoration:none;transition:all 0.14s;white-space:nowrap;overflow:hidden;border:none;background:none;width:100%;cursor:pointer;text-align:left;font-family:'Plus Jakarta Sans',sans-serif}
        .gn-nav:hover{background:#1a1a1a;color:#e8e8e8}
        .gn-nav.active{background:${PINK}15;color:#fff}
        .gn-nav.active .gn-ico{color:${PINK}}
        .gn-ico{font-size:13px;flex-shrink:0;width:16px;text-align:center}
      `}</style>
      <div style={{width:collapsed?56:210,minHeight:"100vh",background:"#0a0a0a",borderRight:`1px solid ${B}`,display:"flex",flexDirection:"column",padding:"18px 10px",transition:"width 0.2s ease",position:"sticky",top:0,flexShrink:0,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>

        {/* Logo */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,padding:"0 4px"}}>
          {!collapsed && (
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <img src={NG_LOGO} style={{width:26,height:26,borderRadius:6,objectFit:"cover"}} alt="NG"/>
              <span style={{fontWeight:800,fontSize:15,color:PINK,letterSpacing:"-0.025em",fontStyle:"italic"}}>GEN-E</span>
            </div>
          )}
          <button onClick={()=>setCollapsed(c=>!c)} style={{background:"none",border:"none",cursor:"pointer",color:"#444",fontSize:13,padding:4,lineHeight:1,flexShrink:0}}>{collapsed?"▶":"◀"}</button>
        </div>

        {/* Mode badge */}
        {!collapsed && (
          <div style={{background:userType==="business"?`#0c2a3d`:`${PINK}10`,border:`1px solid ${userType==="business"?"#0c3a5d":PINK+"30"}`,borderRadius:7,padding:"5px 10px",marginBottom:16,display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:9,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.1em",color:userType==="business"?"#0ea5e9":PINK}}>{userType==="business"?"Business Mode":"Individual Mode"}</span>
          </div>
        )}

        {/* Nav */}
        <nav style={{flex:1,display:"flex",flexDirection:"column",gap:2}}>
          {nav.map(n=>(
            <NavLink key={n.to} to={n.to} end={n.to==="/"||(n.to==="/business"&&userType==="business")} className={({isActive})=>`gn-nav${isActive?" active":""}`}>
              <span className="gn-ico">{n.icon}</span>
              {!collapsed && n.label}
            </NavLink>
          ))}
        </nav>

        {/* Plan */}
        {!collapsed && plan==="free" && (
          <div style={{background:"#111",border:`1px solid ${B}`,borderRadius:9,padding:"10px 12px",marginBottom:12}}>
            <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"#444",marginBottom:4}}>Free Plan</div>
            <NavLink to="/pricing" style={{fontSize:11.5,color:PINK,fontWeight:600,textDecoration:"none"}}>Upgrade →</NavLink>
          </div>
        )}

        {/* Profile */}
        <div style={{display:"flex",alignItems:"center",gap:9,padding:"10px 8px",borderTop:`1px solid ${B}`,marginTop:4}}>
          <div style={{width:30,height:30,borderRadius:"50%",flexShrink:0,overflow:"hidden",background:`${PINK}20`,border:`1.5px solid ${PINK}40`,display:"flex",alignItems:"center",justifyContent:"center"}}>
            {avatar?<img src={avatar} style={{width:30,height:30,objectFit:"cover"}} alt={firstName}/>:<span style={{fontSize:11,fontWeight:700,color:PINK}}>{initials}</span>}
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
