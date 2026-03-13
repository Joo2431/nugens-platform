import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const GOLD = "#d4a843";
const PINK = "#e8185d";
const B    = "#1c1a14";

const NAV = [
  { to: "/",          icon: "◎", label: "Dashboard"    },
  { to: "/services",  icon: "⬡", label: "Services"     },
  { to: "/book",      icon: "◈", label: "Book a Shoot" },
  { to: "/projects",  icon: "◑", label: "Projects"     },
  { to: "/portfolio", icon: "◇", label: "Portfolio"    },
  { to: "/assistant", icon: "✦", label: "GEN-E Mini"   },
];

export default function Sidebar({ user, profile }) {
  const navigate  = useNavigate();
  const [col, setCol] = useState(false);
  const firstName = (profile?.full_name || user?.user_metadata?.full_name || user?.email || "").split(" ")[0];
  const plan = profile?.plan || "free";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .u-nav{display:flex;align-items:center;gap:11px;padding:9px 14px;border-radius:9px;font-size:13.5px;font-weight:500;color:#5a5240;text-decoration:none;transition:all 0.15s;white-space:nowrap;overflow:hidden;}
        .u-nav:hover{background:#130f07;color:#bfaa7a;}
        .u-nav.active{background:#130f07;color:#e8d5a0;}
        .u-nav.active .u-ico{color:${GOLD};}
        .u-ico{font-size:16px;flex-shrink:0;width:20px;text-align:center;}
      `}</style>
      <div style={{width:col?64:228,minHeight:"100vh",background:"#0c0a06",borderRight:`1px solid ${B}`,display:"flex",flexDirection:"column",padding:"20px 12px",transition:"width 0.2s ease",position:"sticky",top:0,flexShrink:0,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:32,paddingLeft:4}}>
          {!col&&(<div><div style={{fontWeight:800,fontSize:15,color:"#e8d5a0",letterSpacing:"-0.03em",lineHeight:1.1}}>The Wedding</div><div style={{fontWeight:800,fontSize:15,color:GOLD,letterSpacing:"-0.03em",lineHeight:1.1}}>Unit</div></div>)}
          <button onClick={()=>setCol(c=>!c)} style={{background:"none",border:"none",cursor:"pointer",color:"#3a3020",fontSize:15,padding:4,flexShrink:0}}>{col?"▶":"◀"}</button>
        </div>
        <nav style={{flex:1,display:"flex",flexDirection:"column",gap:2}}>
          {NAV.map(n=>(<NavLink key={n.to} to={n.to} end={n.to==="/"} className={({isActive})=>`u-nav${isActive?" active":""}`}><span className="u-ico">{n.icon}</span>{!col&&n.label}</NavLink>))}
        </nav>
        {!col&&(<div style={{marginBottom:12}}><div style={{background:plan==="free"?"#130f07":`${GOLD}15`,border:`1px solid ${plan==="free"?B:GOLD+"30"}`,borderRadius:9,padding:"10px 12px"}}><div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:plan==="free"?"#3a3020":GOLD,marginBottom:4}}>{plan==="free"?"Free Plan":`${plan} plan`}</div>{plan==="free"&&<a href="/pricing" style={{fontSize:11.5,color:PINK,fontWeight:600,textDecoration:"none"}}>Upgrade →</a>}</div></div>)}
        <div style={{display:"flex",alignItems:"center",gap:9,padding:"10px 8px",borderTop:`1px solid ${B}`,marginTop:4}}>
          <div style={{width:30,height:30,borderRadius:"50%",flexShrink:0,background:`${GOLD}20`,border:`1px solid ${GOLD}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:GOLD}}>{firstName?.[0]?.toUpperCase()||"U"}</div>
          {!col&&(<div style={{flex:1,minWidth:0}}><div style={{fontSize:12.5,fontWeight:600,color:"#a08850",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{firstName}</div><button onClick={async()=>{await supabase.auth.signOut();navigate("/auth");}} style={{background:"none",border:"none",fontSize:11,color:"#3a3020",cursor:"pointer",padding:0}}>Sign out</button></div>)}
        </div>
      </div>
    </>
  );
}
