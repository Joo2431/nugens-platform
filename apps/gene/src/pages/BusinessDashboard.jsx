import React from "react";
import { Link } from "react-router-dom";

const PINK = "#e8185d";
const B    = "#1e1e1e";

const TOOLS = [
  { to:"/business-chat?t=jd",        icon:"▤", label:"JD Generator",      desc:"Generate job descriptions + interview questions",   color:"#7c3aed", badge:"Most used" },
  { to:"/business-chat?t=hiring",    icon:"◎", label:"Hiring Intelligence",desc:"Skills, salary, strategy for any role you're hiring",color:PINK,      badge:null },
  { to:"/business-chat?t=team",      icon:"◈", label:"Team Skill Map",     desc:"Upload team data, find skill gaps and training needs",color:"#0284c7", badge:"Premium" },
  { to:"/business-chat?t=workforce", icon:"⬡", label:"Workforce Planner",  desc:"Hiring roadmap based on your company stage and goals",color:"#d97706", badge:null },
  { to:"/business-chat?t=salary",    icon:"₹", label:"Salary Benchmark",   desc:"Real salary data for any role in the Indian market",  color:"#16a34a", badge:null },
  { to:"/business-chat?t=interview", icon:"◷", label:"Interview AI",       desc:"Generate role-specific interview questions + rubric",  color:"#0284c7", badge:null },
];

export default function BusinessDashboard({ profile }) {
  const firstName  = (profile?.full_name || "").split(" ")[0] || "there";
  const plan       = profile?.plan || "free";
  const hour       = new Date().getHours();
  const greeting   = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div style={{padding:"32px 28px 80px",background:"#09090a",minHeight:"100vh",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'); .bt:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,0.5)!important} @keyframes su{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}} .su{animation:su 0.3s ease both}`}</style>

      {/* Header */}
      <div style={{marginBottom:32}} className="su">
        <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"3px 10px",borderRadius:5,background:"#0c2a3d",border:"1px solid #0c3a5d",marginBottom:14}}>
          <span style={{fontSize:10,fontWeight:700,color:"#0ea5e9",textTransform:"uppercase",letterSpacing:"0.08em"}}>🏢 Business Mode</span>
        </div>
        <h1 style={{fontWeight:800,fontSize:"clamp(20px,2.5vw,28px)",color:"#fff",letterSpacing:"-0.03em",marginBottom:6}}>{greeting}, {firstName}</h1>
        <p style={{fontSize:13.5,color:"#555"}}>Workforce Intelligence AI — hire smarter, train better, plan ahead.</p>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:32}} className="su">
        {[
          { label:"AI Tools",    val:"7",     sub:"Available",        color:PINK },
          { label:"Plan",        val:plan.charAt(0).toUpperCase()+plan.slice(1), sub:"Current tier", color:"#0ea5e9" },
          { label:"Integrations",val:"2",     sub:"DigiHub · HyperX", color:"#d97706" },
        ].map(s=>(
          <div key={s.label} style={{background:"#111",border:`1px solid ${B}`,borderRadius:12,padding:"16px 18px"}}>
            <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",color:"#444",marginBottom:6}}>{s.label}</div>
            <div style={{fontSize:22,fontWeight:800,color:s.color,letterSpacing:"-0.03em",lineHeight:1}}>{s.val}</div>
            <div style={{fontSize:11,color:"#444",marginTop:4}}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Upgrade banner */}
      {plan === "free" && (
        <div style={{background:"#0a0a0a",border:`1px solid ${B}`,borderRadius:14,padding:"18px 22px",marginBottom:28,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}} className="su">
          <div>
            <div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:3}}>Unlock Business Intelligence features</div>
            <div style={{fontSize:12.5,color:"#555"}}>Team skill mapping, workforce planning and candidate matching require Pro.</div>
          </div>
          <Link to="/pricing" style={{padding:"9px 20px",borderRadius:8,background:PINK,color:"#fff",fontSize:13,fontWeight:700,textDecoration:"none"}}>Upgrade →</Link>
        </div>
      )}

      {/* Tools grid */}
      <div style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"#444",marginBottom:14}}>Workforce AI Tools</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14}}>
        {TOOLS.map((t,i)=>(
          <Link key={t.to} to={t.to} style={{background:"#111",border:`1px solid ${B}`,borderRadius:14,padding:"20px",textDecoration:"none",display:"block",transition:"all 0.18s",animationDelay:`${i*50}ms`}} className="bt su">
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12}}>
              <div style={{width:36,height:36,borderRadius:9,background:`${t.color}18`,border:`1px solid ${t.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:t.color}}>{t.icon}</div>
              {t.badge && <span style={{fontSize:9.5,fontWeight:700,padding:"2px 7px",borderRadius:4,background:t.badge==="Premium"?`${PINK}15`:`${t.color}15`,color:t.badge==="Premium"?PINK:t.color,border:`1px solid ${t.badge==="Premium"?PINK+"30":t.color+"30"}`}}>{t.badge}</span>}
            </div>
            <div style={{fontSize:14,fontWeight:700,color:"#e8e8e8",marginBottom:4}}>{t.label}</div>
            <div style={{fontSize:12.5,color:"#555",lineHeight:1.5}}>{t.desc}</div>
            <div style={{fontSize:12,fontWeight:600,color:t.color,marginTop:12}}>Open →</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
