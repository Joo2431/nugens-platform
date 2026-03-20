import React from "react";
import { useNavigate } from "react-router-dom";

const PINK = "#e8185d";
const B    = "#edf0f3";

const TOOLS = [
  { dest:"/chat?t=jd",        icon:"▤", label:"JD Generator",      desc:"Generate job descriptions + interview questions",    color:"#7c3aed", badge:"Most used" },
  { dest:"/chat?t=hiring",    icon:"◎", label:"Hiring AI",          desc:"Skills, salary & strategy for any role you're hiring",color:PINK,      badge:null },
  { dest:"/chat?t=team",      icon:"◈", label:"Team Skill Map",     desc:"Analyse your team, find skill gaps & training needs", color:"#0284c7", badge:null },
  { dest:"/chat?t=workforce", icon:"⬡", label:"Workforce Planner",  desc:"Hiring roadmap based on your company stage and goals",color:"#d97706", badge:null },
  { dest:"/chat?t=salary",    icon:"₹", label:"Salary Benchmark",   desc:"Real salary data for any role in the Indian market",  color:"#16a34a", badge:null },
  { dest:"/chat?t=interview", icon:"◷", label:"Interview AI",       desc:"Generate role-specific interview questions + rubric", color:"#0284c7", badge:null },
];

export default function BusinessDashboard({ profile }) {
  const navigate  = useNavigate();
  const firstName = (profile?.full_name || "").split(" ")[0] || "there";
  const plan      = profile?.plan || "free";
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div style={{ padding:"24px 20px 80px", background:"#f8f9fb", minHeight:"100vh", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .bt-card { background:#fff; border:1.5px solid #edf0f3; border-radius:14px; padding:20px; cursor:pointer; transition:all 0.18s; text-decoration:none; display:block; }
        .bt-card:hover { border-color:var(--card-color,#e8185d); transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,0.08); }
        @keyframes su{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        .su{animation:su 0.3s ease both}
        @media(max-width:600px){ .tools-grid{grid-template-columns:1fr!important} .stats-grid{grid-template-columns:1fr 1fr!important} }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom:28 }} className="su">
        <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"3px 10px", borderRadius:6, background:"#eff8ff", border:"1px solid #bae6fd", marginBottom:12 }}>
          <span style={{ fontSize:10, fontWeight:700, color:"#0284c7", textTransform:"uppercase", letterSpacing:"0.08em" }}>🏢 Business Mode</span>
        </div>
        <h1 style={{ fontWeight:800, fontSize:"clamp(20px,2.5vw,26px)", color:"#0a0a0a", letterSpacing:"-0.03em", marginBottom:4 }}>
          {greeting}, {firstName}
        </h1>
        <p style={{ fontSize:13.5, color:"#6b7280" }}>Workforce Intelligence AI — hire smarter, train better, plan ahead.</p>
      </div>

      {/* Stats */}
      <div className="stats-grid su" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:28 }}>
        {[
          { label:"AI Tools",     val:"7",    sub:"Available now",       color:PINK      },
          { label:"Plan",         val: plan.charAt(0).toUpperCase()+plan.slice(1), sub:"Current tier", color:"#0284c7" },
          { label:"Integrations", val:"3",    sub:"Gen-E · HyperX · Digi", color:"#d97706" },
        ].map(s => (
          <div key={s.label} style={{ background:"#fff", border:`1.5px solid ${B}`, borderRadius:12, padding:"16px 18px" }}>
            <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:"#9ca3af", marginBottom:6 }}>{s.label}</div>
            <div style={{ fontSize:22, fontWeight:800, color:s.color, letterSpacing:"-0.03em", lineHeight:1 }}>{s.val}</div>
            <div style={{ fontSize:11, color:"#9ca3af", marginTop:4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Upgrade banner */}
      {plan === "free" && (
        <div style={{ background:"#fff", border:`1.5px solid ${B}`, borderRadius:14, padding:"16px 20px", marginBottom:24, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }} className="su">
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:"#0a0a0a", marginBottom:3 }}>Unlock full Workforce Intelligence</div>
            <div style={{ fontSize:12.5, color:"#6b7280" }}>Team skill mapping and workforce planning require Business Pro.</div>
          </div>
          <button onClick={() => navigate("/pricing")}
            style={{ padding:"9px 20px", borderRadius:9, background:`linear-gradient(135deg,${PINK},#c4134e)`, color:"#fff", fontSize:13, fontWeight:700, border:"none", cursor:"pointer", boxShadow:`0 4px 12px ${PINK}30`, whiteSpace:"nowrap" }}>
            Upgrade →
          </button>
        </div>
      )}

      {/* Tools grid */}
      <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#9ca3af", marginBottom:12 }}>Workforce AI Tools</div>
      <div className="tools-grid su" style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:14 }}>
        {TOOLS.map((t, i) => (
          <button key={t.dest}
            onClick={() => navigate(t.dest)}
            style={{
              background:"#fff", border:`1.5px solid ${B}`, borderRadius:14, padding:"18px",
              cursor:"pointer", textAlign:"left", transition:"all 0.18s", animationDelay:`${i*50}ms`,
              fontFamily:"'Plus Jakarta Sans',sans-serif",
              "--card-color": t.color,
            }}
            className="bt-card su"
            onMouseEnter={e => { e.currentTarget.style.borderColor=t.color+"60"; e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow=`0 8px 24px ${t.color}15`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=B; e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="none"; }}
          >
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:12 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:`${t.color}12`, border:`1px solid ${t.color}25`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, color:t.color }}>{t.icon}</div>
              {t.badge && <span style={{ fontSize:9.5, fontWeight:700, padding:"2px 8px", borderRadius:5, background:`${t.color}12`, color:t.color, border:`1px solid ${t.color}25` }}>{t.badge}</span>}
            </div>
            <div style={{ fontSize:13.5, fontWeight:700, color:"#111", marginBottom:4 }}>{t.label}</div>
            <div style={{ fontSize:12, color:"#6b7280", lineHeight:1.5 }}>{t.desc}</div>
            <div style={{ fontSize:11.5, fontWeight:600, color:t.color, marginTop:10 }}>Open →</div>
          </button>
        ))}
      </div>
    </div>
  );
}