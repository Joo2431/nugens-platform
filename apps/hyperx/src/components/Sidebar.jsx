import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useProfile } from "../lib/useProfile";
import { NG_LOGO } from "../lib/logo";

const PINK = "#e8185d";
const B    = "#1e1e1e";

const NAV = [
  { to:"/",            icon:"⊞", label:"Dashboard"    },
  { to:"/courses",     icon:"▶", label:"Courses"       },
  { to:"/paths",       icon:"◈", label:"Learning Paths"},
  { to:"/certificates",icon:"◇", label:"Certificates" },
  { to:"/community",   icon:"⬟", label:"Community"    },
  // Gen-E Mini is now floating popup
  { to:"/pricing",     icon:"↑", label:"Pricing"       },
];

export default function Sidebar() {
  const { user, profile, signOut } = useProfile();
  const [collapsed, setCollapsed] = useState(false);
  const firstName = (profile?.full_name || user?.user_metadata?.full_name || user?.email || "").split(" ")[0] || "User";
  const initials  = firstName.slice(0,2).toUpperCase();
  const plan      = profile?.plan || "free";
  const avatar    = profile?.avatar_url || user?.user_metadata?.avatar_url || null;
  const isAdmin   = profile?.plan === "admin";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .hx-nav{display:flex;align-items:center;gap:11px;padding:9px 12px;border-radius:8px;font-size:13px;font-weight:500;color:#666;text-decoration:none;transition:all 0.14s;white-space:nowrap;overflow:hidden;font-family:'Plus Jakarta Sans',sans-serif;border:none;background:none;width:100%;cursor:pointer;text-align:left}
        .hx-nav:hover{background:#1a1a1a;color:#fff}
        .hx-nav.active{background:#e8185d15;color:#fff}
        .hx-nav.active .hx-ico{color:${PINK}}
        .hx-ico{font-size:14px;flex-shrink:0;width:18px;text-align:center}
      `}</style>
      <div style={{width:collapsed?60:220,minHeight:"100vh",background:"#0a0a0a",borderRight:`1px solid ${B}`,display:"flex",flexDirection:"column",padding:"18px 10px",transition:"width 0.2s ease",position:"sticky",top:0,flexShrink:0,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>

        {/* Logo */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,padding:"0 4px"}}>
          {!collapsed && (
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <img src={NG_LOGO} style={{width:26,height:26,borderRadius:6,objectFit:"cover"}} alt="NG"/>
              <span style={{fontWeight:800,fontSize:15,color:"#fff",letterSpacing:"-0.025em"}}>Hyper<span style={{color:PINK}}>X</span></span>
            </div>
          )}
          <button onClick={()=>setCollapsed(c=>!c)} style={{background:"none",border:"none",cursor:"pointer",color:"#444",fontSize:14,padding:4,flexShrink:0,lineHeight:1}}>{collapsed?"▶":"◀"}</button>
        </div>

        {/* Nav */}
        <nav style={{flex:1,display:"flex",flexDirection:"column",gap:2}}>
          {NAV.map(n=>(
            <NavLink key={n.to} to={n.to} end={n.to==="/"} className={({isActive})=>`hx-nav${isActive?" active":""}`}>
              <span className="hx-ico">{n.icon}</span>
              {!collapsed && n.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink to="/admin" className={({isActive})=>`hx-nav${isActive?" active":""}`}>
              <span className="hx-ico">⚙</span>
              {!collapsed && "Admin Panel"}
            </NavLink>
          )}
        </nav>

        {/* Plan */}
        {!collapsed && plan !== "admin" && (
          <div style={{background:plan==="free"?"#111":`${PINK}10`,border:`1px solid ${plan==="free"?B:PINK+"30"}`,borderRadius:9,padding:"10px 12px",marginBottom:12}}>
            <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:plan==="free"?"#444":PINK,marginBottom:4}}>
              {plan==="free"?"Free Plan":"Pro Plan"}
            </div>
            {plan==="free" && <NavLink to="/pricing" style={{fontSize:11.5,color:PINK,fontWeight:600,textDecoration:"none"}}>Upgrade to Pro →</NavLink>}
          </div>
        )}

        {/* Profile */}
        <div style={{display:"flex",alignItems:"center",gap:9,padding:"10px 8px",borderTop:`1px solid ${B}`,marginTop:4}}>
          <div style={{width:30,height:30,borderRadius:"50%",flexShrink:0,overflow:"hidden",background:`${PINK}20`,border:`1.5px solid ${PINK}40`,display:"flex",alignItems:"center",justifyContent:"center"}}>
            {avatar ? <img src={avatar} style={{width:30,height:30,objectFit:"cover"}} alt={firstName}/> : <span style={{fontSize:11,fontWeight:700,color:PINK}}>{initials}</span>}
          </div>
          {!collapsed && (
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12.5,fontWeight:600,color:"#e8e8e8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{firstName}</div>
              <button onClick={signOut} style={{background:"none",border:"none",fontSize:11,color:"#555",cursor:"pointer",padding:0,fontFamily:"inherit"}}>Sign out</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
