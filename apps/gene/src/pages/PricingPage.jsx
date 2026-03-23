import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const PINK   = "#e8185d";
const B      = "#1e1e1e";
const API    = import.meta.env.VITE_GEN_E_API_URL || "https://nugens-platform.onrender.com";

const INDIVIDUAL_PLANS = [
  {
    id:"free", name:"Starter", price:"₹0", period:"free forever", badge:null, color:"#555",
    features:["20 career questions total","Career guidance & chat","Basic interview prep","Career readiness scoring"],
    locked:["Unlimited questions","ATS Resume Builder","Resume PDF download","Skill Gap Analyzer","Career Simulator","Job matching"],
  },
  {
    id:"monthly", name:"Pro Monthly", price:"₹99", period:"per month", badge:"Most Popular", color:PINK,
    razorpay:"monthly", amount:9900,
    features:["Unlimited AI questions","Full career guidance","ATS Resume Builder + PDF","Advanced interview prep","Career readiness scoring","Skill Gap Analyzer","Career Roadmap AI","Job Tracker"],
    locked:["Career Simulator","Job match analysis (Yearly)"],
  },
  {
    id:"yearly", name:"Pro Yearly", price:"₹699", period:"per year · save 41%", badge:"Best Value", color:"#7c3aed",
    razorpay:"yearly", amount:69900,
    features:["Everything in Monthly","Career Simulator","Job match analysis","Priority support","Early access to new features","Resume version history"],
    locked:[],
  },
];

const BUSINESS_PLANS = [
  {
    id:"biz_starter", name:"Business Starter", price:"₹499", period:"per month", badge:null, color:"#0284c7",
    razorpay:"biz_starter", amount:49900,
    features:["JD Generator","Interview Questions AI","Hiring Intelligence","Salary Benchmark","5 team members","Basic workforce insights"],
    locked:["Team Skill Mapping","Workforce Planner","Candidate Match (DigiHub)","Bulk exports"],
  },
  {
    id:"biz_pro", name:"Business Pro", price:"₹1,499", period:"per month", badge:"Most Popular", color:PINK,
    razorpay:"biz_pro", amount:149900,
    features:["Everything in Starter","Team Skill Mapping","Workforce Planning AI","Up to 25 team members","DigiHub candidate match","Priority support","Hiring roadmap export"],
    locked:["Enterprise SSO","Custom AI training"],
  },
  {
    id:"biz_enterprise", name:"Enterprise", price:"Custom", period:"contact us", badge:null, color:"#d97706",
    features:["Unlimited team members","Custom AI workflows","White-label options","Dedicated account manager","API access","SLA guarantee","Custom integrations"],
    locked:[],
  },
];

// Load Razorpay script dynamically — ensures window.Razorpay is ready before use
function loadRazorpay() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) { resolve(); return; }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload  = () => resolve();
    s.onerror = () => reject(new Error("Razorpay script failed to load"));
    document.head.appendChild(s);
  });
}

export default function PricingPage() {
  const navigate  = useNavigate();
  const [tab,     setTab]     = useState("individual");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(null);
  const [error,   setError]   = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data:{ session } }) => {
      if (!session) return;
      supabase.from("profiles").select("*").eq("id", session.user.id).single().then(({ data }) => {
        setProfile(data);
        if (data?.user_type === "business") setTab("business");
      });
    });
  }, []);

  const handleUpgrade = async (plan) => {
    if (!plan.razorpay) return;
    if (!profile) { navigate("/auth"); return; }
    setLoading(plan.id); setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${API}/api/subscription/create-order`, {
        method:"POST", headers:{ "Content-Type":"application/json", "Authorization":`Bearer ${session.access_token}` },
        body: JSON.stringify({ plan: plan.razorpay }),
      });
      const { order } = await res.json();
      await loadRazorpay();
      const rz = new window.Razorpay({
        key: "rzp_live_SM1s5O14Mm50mV",
        order_id: order.id, amount: plan.amount, currency:"INR",
        name:"GEN-E by Nugens", description: plan.name,
        prefill:{ email: profile.email, name: profile.full_name },
        theme:{ color: PINK },
        handler: async (response) => {
          await fetch(`${API}/api/subscription/verify`, {
            method:"POST", headers:{ "Content-Type":"application/json", "Authorization":`Bearer ${session.access_token}` },
            body: JSON.stringify({ ...response, plan: plan.razorpay }),
          });
          window.location.href = "/";
        },
      });
      rz.open();
    } catch (e) { setError(e.message); }
    setLoading(null);
  };

  const plans = tab === "business" ? BUSINESS_PLANS : INDIVIDUAL_PLANS;
  const currentPlan = profile?.plan || "free";

  return (
    <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",minHeight:"100vh",background:"#09090a",padding:"40px 24px 80px",color:"#e8e8e8"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'); *{box-sizing:border-box}`}</style>

      {/* Header */}
      <div style={{textAlign:"center",maxWidth:560,margin:"0 auto 36px"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 12px",borderRadius:6,background:`${PINK}10`,border:`1px solid ${PINK}30`,marginBottom:16}}>
          <span style={{fontSize:11,fontWeight:700,color:PINK,letterSpacing:"0.06em",textTransform:"uppercase"}}>GEN-E Pricing</span>
        </div>
        <h1 style={{fontWeight:800,fontSize:"clamp(24px,3.5vw,36px)",color:"#fff",letterSpacing:"-0.04em",marginBottom:12}}>
          {tab==="business"?"Workforce AI for Your Business":"Invest in Your Career"}
        </h1>
        <p style={{fontSize:14,color:"#555",lineHeight:1.7}}>
          {tab==="business"?"Hire smarter, train better, plan ahead — with Gen-E Workforce Intelligence.":"Career AI, resume builder, skill analysis and job matching — all in one."}
        </p>
      </div>

      {/* Tab toggle — only show when user_type is not locked */}
      {!profile?.user_type || profile.user_type === "unknown" ? (
        <div style={{display:"flex",justifyContent:"center",marginBottom:36}}>
          <div style={{display:"flex",background:"#111",border:`1px solid ${B}`,borderRadius:10,padding:3}}>
            {[["individual","👤 Individual"],["business","🏢 Business"]].map(([id,lbl])=>(
              <button key={id} onClick={()=>setTab(id)}
                style={{padding:"8px 24px",borderRadius:8,border:"none",background:tab===id?PINK:"transparent",color:tab===id?"#fff":"#555",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all 0.14s"}}>
                {lbl}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{display:"flex",justifyContent:"center",marginBottom:36}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"8px 20px",
            background:"#111",border:`1px solid ${B}`,borderRadius:10}}>
            <span style={{fontSize:14}}>{tab==="business"?"🏢":"👤"}</span>
            <span style={{fontSize:13,fontWeight:600,color:PINK}}>
              {tab==="business"?"Business Plans":"Individual Plans"}
            </span>
          </div>
        </div>
      )}

      {/* Plans */}
      <div style={{display:"flex",gap:20,justifyContent:"center",flexWrap:"wrap",maxWidth:960,margin:"0 auto 40px"}}>
        {plans.map(p=>{
          const isCurrent = p.id===currentPlan || (p.id==="free"&&currentPlan==="free");
          return (
            <div key={p.id} style={{flex:1,minWidth:260,maxWidth:310,background:"#111",border:`1.5px solid ${p.badge?p.color:B}`,borderRadius:16,padding:"28px 24px",position:"relative"}}>
              {p.badge && <div style={{position:"absolute",top:-12,left:"50%",transform:"translateX(-50%)",background:p.color,color:"#fff",fontSize:10.5,fontWeight:700,padding:"3px 14px",borderRadius:20,whiteSpace:"nowrap"}}>{p.badge}</div>}
              <div style={{fontSize:14,fontWeight:700,color:"#e8e8e8",marginBottom:4}}>{p.name}</div>
              <div style={{fontSize:30,fontWeight:800,color:p.color,letterSpacing:"-0.04em",lineHeight:1,marginBottom:4}}>{p.price}</div>
              <div style={{fontSize:12,color:"#555",marginBottom:22}}>{p.period}</div>
              
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24}}>
                {p.features.map(f=>(
                  <div key={f} style={{display:"flex",alignItems:"flex-start",gap:7}}>
                    <span style={{color:PINK,fontSize:12,flexShrink:0,marginTop:1}}>✓</span>
                    <span style={{fontSize:12.5,color:"#aaa"}}>{f}</span>
                  </div>
                ))}
                {p.locked.map(f=>(
                  <div key={f} style={{display:"flex",alignItems:"flex-start",gap:7,opacity:0.35}}>
                    <span style={{color:"#555",fontSize:12,flexShrink:0,marginTop:1}}>✗</span>
                    <span style={{fontSize:12.5,color:"#555"}}>{f}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={()=>p.razorpay?handleUpgrade(p):p.price==="Custom"?window.location.href="mailto:contact@nugens.in":null}
                disabled={isCurrent||loading===p.id}
                style={{width:"100%",padding:"11px 0",borderRadius:10,border:"none",
                  background:isCurrent?"#1a1a1a":p.badge?p.color:"#fff",
                  color:isCurrent?"#444":p.badge?"#fff":"#0a0a0a",
                  fontSize:13.5,fontWeight:700,cursor:isCurrent?"default":"pointer",fontFamily:"inherit"}}>
                {isCurrent?"Current Plan":loading===p.id?"Processing…":p.price==="Custom"?"Contact Us →":"Get Started →"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Compare */}
      <div style={{textAlign:"center",maxWidth:560,margin:"0 auto"}}>
        <div style={{fontSize:12.5,color:"#444"}}>
          Prices in INR · Cancel anytime · Secure payments via Razorpay
        </div>
        {error && <div style={{color:"#f87171",marginTop:12,fontSize:13}}>{error}</div>}
      </div>
    </div>
  );
}