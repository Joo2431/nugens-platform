import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const PINK = "#e8185d";
const B    = "#1e1e1e";

const PLANS = [
  {
    id: "hyperx_monthly",
    label: "Monthly",
    price: "₹299",
    sub: "per month",
    badge: null,
    features: [
      "Full access to all courses",
      "All learning paths",
      "Downloadable certificates",
      "Community access",
      "AI Learning Assistant",
      "Cancel anytime",
    ],
  },
  {
    id: "hyperx_yearly",
    label: "Yearly",
    price: "₹1,999",
    sub: "per year — save 44%",
    badge: "Best Value",
    features: [
      "Everything in Monthly",
      "Priority support",
      "Early access to new courses",
      "Offline viewing (coming soon)",
      "Team learning dashboard",
      "2 months free",
    ],
  },
];

export default function HyperXPricing({ profile }) {
  const [loading, setLoading] = useState(null);
  const [error,   setError]   = useState("");
  const navigate = useNavigate();
  const plan = profile?.plan || "free";

  const handleUpgrade = async (planId) => {
    setLoading(planId); setError("");
    // For now redirect to nugens main pricing
    // Later: integrate Razorpay directly
    window.location.href = "https://nugens.in.net/pricing?product=hyperx&plan=" + planId;
  };

  return (
    <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",padding:"40px 28px 80px",background:"#09090a",minHeight:"100vh"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box}`}</style>

      {/* Header */}
      <div style={{textAlign:"center",maxWidth:520,margin:"0 auto 48px"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 12px",borderRadius:6,background:`${PINK}10`,border:`1px solid ${PINK}30`,marginBottom:16}}>
          <span style={{fontSize:11,fontWeight:700,color:PINK,letterSpacing:"0.06em",textTransform:"uppercase"}}>HyperX Pro</span>
        </div>
        <h1 style={{fontWeight:800,fontSize:"clamp(24px,3vw,36px)",color:"#fff",letterSpacing:"-0.035em",marginBottom:12}}>
          Invest in your career.<br/>One skill at a time.
        </h1>
        <p style={{fontSize:14,color:"#555",lineHeight:1.7}}>
          Get unlimited access to every HyperX course, learning path, certificate and AI assistant feature.
        </p>
      </div>

      {/* Current plan */}
      {plan !== "free" && (
        <div style={{maxWidth:480,margin:"0 auto 28px",background:`${PINK}10`,border:`1px solid ${PINK}30`,borderRadius:12,padding:"14px 20px",textAlign:"center"}}>
          <span style={{fontSize:13.5,fontWeight:600,color:"#fff"}}>✓ You're on </span>
          <span style={{fontSize:13.5,fontWeight:800,color:PINK,textTransform:"capitalize"}}>{plan} plan</span>
          <span style={{fontSize:13.5,fontWeight:600,color:"#fff"}}> — full access active</span>
        </div>
      )}

      {/* Plans */}
      <div style={{display:"flex",gap:20,justifyContent:"center",flexWrap:"wrap",maxWidth:780,margin:"0 auto 40px"}}>
        {PLANS.map(p=>(
          <div key={p.id} style={{
            flex:1, minWidth:300, maxWidth:360,
            background:"#111", border:`1.5px solid ${p.badge?PINK:B}`,
            borderRadius:16, padding:"28px 24px", position:"relative",
          }}>
            {p.badge && (
              <div style={{position:"absolute",top:-12,left:"50%",transform:"translateX(-50%)",background:PINK,color:"#fff",fontSize:11,fontWeight:700,padding:"3px 14px",borderRadius:20,whiteSpace:"nowrap"}}>{p.badge}</div>
            )}
            <div style={{fontSize:15,fontWeight:700,color:"#fff",marginBottom:4}}>{p.label}</div>
            <div style={{fontSize:32,fontWeight:800,color:p.badge?PINK:"#fff",letterSpacing:"-0.04em",lineHeight:1,marginBottom:4}}>{p.price}</div>
            <div style={{fontSize:12.5,color:"#555",marginBottom:24}}>{p.sub}</div>
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:28}}>
              {p.features.map(f=>(
                <div key={f} style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{color:PINK,fontSize:13,flexShrink:0}}>✓</span>
                  <span style={{fontSize:13,color:"#aaa"}}>{f}</span>
                </div>
              ))}
            </div>
            <button onClick={()=>handleUpgrade(p.id)} disabled={!!loading||plan!=="free"}
              style={{width:"100%",padding:"12px 0",borderRadius:10,border:"none",
                background:plan!=="free"?"#1a1a1a":p.badge?PINK:"#fff",
                color:plan!=="free"?"#444":p.badge?"#fff":"#0a0a0a",
                fontSize:14,fontWeight:700,cursor:plan!=="free"?"default":"pointer",fontFamily:"inherit"}}>
              {plan!=="free"?"Already subscribed":loading===p.id?"Redirecting…":"Get "+p.label+" →"}
            </button>
          </div>
        ))}
      </div>

      {/* Free features */}
      <div style={{maxWidth:640,margin:"0 auto",background:"#111",border:`1px solid ${B}`,borderRadius:14,padding:"24px 28px"}}>
        <div style={{fontSize:13,fontWeight:700,color:"#555",marginBottom:16}}>FREE PLAN INCLUDES</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {["3 free courses","1 learning path","Community access","AI Assistant (limited)"].map(f=>(
            <div key={f} style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{color:"#444",fontSize:13}}>◎</span>
              <span style={{fontSize:13,color:"#666"}}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {error && <div style={{textAlign:"center",marginTop:16,fontSize:13,color:"#f87171"}}>{error}</div>}
    </div>
  );
}
