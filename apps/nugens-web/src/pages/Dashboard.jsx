import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../App";

const PINK = "#e8185d";
const B    = "#f0f0f0";

const PLAN_COLOR = { free:"#6b7280", pro:"#7c3aed", team:"#0284c7", enterprise:"#d97706" };
const PLAN_BG    = { free:"#f3f4f6", pro:"#ede9fe", team:"#eff6ff",  enterprise:"#fff7ed"  };

const PRODUCTS = [
  { icon:"◎", name:"Gen-E AI",         tag:"Career Intelligence",    desc:"Resume, jobs & AI career coach",  color:"#7c3aed", launch:"https://gene.nugens.in.net"    },
  { icon:"⬡", name:"HyperX",           tag:"Learning Platform",      desc:"Professional skills & courses",   color:PINK,      launch:"https://hyperx.nugens.in.net"  },
  { icon:"◈", name:"DigiHub",          tag:"Marketing + Community",  desc:"Brand tools & talent network",    color:"#0284c7", launch:"https://digihub.nugens.in.net" },
  { icon:"◇", name:"The Wedding Unit", tag:"Production Studio",      desc:"Photography & production",        color:"#d97706", launch:"https://units.nugens.in.net"   },
];

export default function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const firstName = (profile?.full_name || user?.user_metadata?.full_name || user?.email || "").split(" ")[0] || "there";
  const plan       = profile?.plan || "free";
  const planColor  = PLAN_COLOR[plan] ?? PLAN_COLOR.free;
  const planBg     = PLAN_BG[plan]    ?? PLAN_BG.free;
  const used       = profile?.questions_used || 0;

  const handleSignOut = async () => { await supabase.auth.signOut(); navigate("/"); };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'Plus Jakarta Sans',sans-serif; background:#fafafa; color:#0a0a0a; -webkit-font-smoothing:antialiased; }
        .d-stat { background:#fff; border:1px solid ${B}; border-radius:10px; padding:18px 20px; }
        .d-pcard {
          background:#fff; border:1px solid ${B}; border-radius:12px; padding:20px;
          text-decoration:none; display:block; transition:all 0.18s;
        }
        .d-pcard:hover { border-color:rgba(0,0,0,0.12); box-shadow:0 4px 20px rgba(0,0,0,0.07); transform:translateY(-2px); }
        .d-action {
          padding:9px 18px; border-radius:8px; font-size:13px; font-weight:600;
          text-decoration:none; transition:all 0.14s; white-space:nowrap;
          font-family:'Plus Jakarta Sans',sans-serif;
        }
        @media(max-width:700px){
          .d-4col { grid-template-columns:1fr 1fr!important; }
          .d-2col { grid-template-columns:1fr!important; }
        }
      `}</style>

      <div style={{ maxWidth:1060, margin:"0 auto", padding:"40px 24px 80px" }}>

        {/* ── header ── */}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:36,flexWrap:"wrap",gap:12 }}>
          <div>
            <div style={{ fontSize:"clamp(20px,2.5vw,26px)",fontWeight:800,letterSpacing:"-0.03em",color:"#0a0a0a" }}>
              Good {greeting}, {firstName} 👋
            </div>
            <div style={{ fontSize:13.5,color:"#9ca3af",marginTop:4 }}>Welcome back to your NuGens dashboard</div>
          </div>
          <div style={{ display:"flex",gap:8,alignItems:"center" }}>
            <span style={{ display:"inline-block",fontSize:11,fontWeight:700,letterSpacing:"0.06em",
              textTransform:"uppercase",color:planColor,background:planBg,padding:"4px 10px",borderRadius:6 }}>
              {plan} plan
            </span>
            <button onClick={handleSignOut}
              style={{ padding:"7px 14px",borderRadius:7,border:`1px solid ${B}`,
                background:"#fff",color:"#6b7280",fontSize:12.5,fontWeight:500,cursor:"pointer" }}>
              Sign out
            </button>
          </div>
        </div>

        {/* ── stats ── */}
        <div className="d-4col" style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:32 }}>
          {[
            { label:"Plan",         value:plan.charAt(0).toUpperCase()+plan.slice(1), sub:"Current plan",         color:planColor  },
            { label:"AI Questions", value:`${used}${plan==="free"?"/20":""}`,         sub:plan==="free"?"Month limit":"Unlimited",  color:"#7c3aed" },
            { label:"Products",     value:"4",                                         sub:"In your ecosystem",    color:"#0284c7"  },
            { label:"Member since", value:new Date(user.created_at).toLocaleDateString("en-IN",{month:"short",year:"numeric"}), sub:"Joined NuGens", color:"#d97706" },
          ].map(s => (
            <div key={s.label} className="d-stat">
              <div style={{ fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",color:"#9ca3af",marginBottom:8 }}>{s.label}</div>
              <div style={{ fontSize:22,fontWeight:800,letterSpacing:"-0.035em",color:s.color,lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:11.5,color:"#9ca3af",marginTop:4 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── upgrade banner (free only) ── */}
        {plan === "free" && (
          <div style={{ background:"#0a0a0a",borderRadius:12,padding:"20px 24px",
            display:"flex",alignItems:"center",justifyContent:"space-between",
            flexWrap:"wrap",gap:12,marginBottom:32 }}>
            <div>
              <div style={{ fontSize:14.5,fontWeight:700,color:"#fff",marginBottom:3 }}>Unlock the full NuGens ecosystem</div>
              <div style={{ fontSize:13,color:"#888" }}>Upgrade to Pro — unlimited AI, resume builder, HyperX courses & more</div>
            </div>
            <Link to="/pricing" style={{ padding:"9px 20px",borderRadius:8,background:PINK,
              color:"#fff",fontSize:13,fontWeight:700,textDecoration:"none",
              boxShadow:`0 2px 10px ${PINK}40`,whiteSpace:"nowrap" }}>View plans →</Link>
          </div>
        )}

        {/* ── products launcher ── */}
        <div style={{ marginBottom:32 }}>
          <div style={{ fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"#9ca3af",marginBottom:14 }}>
            Your products
          </div>
          <div className="d-4col" style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12 }}>
            {PRODUCTS.map(p => (
              <a key={p.name} href={p.launch} target="_blank" rel="noreferrer" className="d-pcard"
                style={{ borderColor:B }}>
                <div style={{ fontSize:22,color:p.color,marginBottom:10,lineHeight:1 }}>{p.icon}</div>
                <div style={{ fontSize:14,fontWeight:700,color:"#0a0a0a",marginBottom:3 }}>{p.name}</div>
                <div style={{ fontSize:10.5,fontWeight:600,color:p.color,textTransform:"uppercase",
                  letterSpacing:"0.06em",marginBottom:6 }}>{p.tag}</div>
                <div style={{ fontSize:12.5,color:"#9ca3af",lineHeight:1.55 }}>{p.desc}</div>
                <div style={{ marginTop:12,fontSize:12,fontWeight:600,color:p.color }}>Launch →</div>
              </a>
            ))}
          </div>
        </div>

        {/* ── quick actions ── */}
        <div>
          <div style={{ fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"#9ca3af",marginBottom:14 }}>
            Quick actions
          </div>
          <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
            <a href="https://gene.nugens.in.net" target="_blank" rel="noreferrer" className="d-action"
              style={{ background:PINK,color:"#fff",boxShadow:`0 2px 10px ${PINK}35` }}>
              Launch Gen-E AI →
            </a>
            <Link to="/pricing" className="d-action"
              style={{ background:"#fff",color:"#374151",border:`1px solid ${B}` }}>
              View pricing
            </Link>
            <Link to="/support" className="d-action"
              style={{ background:"#fff",color:"#374151",border:`1px solid ${B}` }}>
              Support
            </Link>
            <Link to="/contact" className="d-action"
              style={{ background:"#fff",color:"#374151",border:`1px solid ${B}` }}>
              Contact us
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
