import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const BLUE = "#0284c7";
const PINK = "#e8185d";
const B    = "#f0f0f0";

const INDIVIDUAL_PLANS = [
  {
    key:"starter", name:"Starter", price:0, yearlyPrice:0,
    desc:"For freelancers & personal brands",
    color:"#6b7280",
    features:["Brand Tools (basic, 5/mo)","Content Planner (10 posts)","2 AI caption generations/mo","Community access"],
    cta:"Get started free", popular:false,
  },
  {
    key:"premium", name:"Premium", price:299, yearlyPrice:2399,
    desc:"For creators and personal brand builders",
    color:BLUE,
    features:["Brand Tools — unlimited","Content Planner — unlimited","AI captions & copy — 100/mo","Analytics dashboard","Portfolio page","Priority support"],
    cta:"Start Premium", popular:true,
  },
  {
    key:"pro", name:"Pro", price:699, yearlyPrice:5599,
    desc:"For power users & agencies",
    color:"#7c3aed",
    features:["Everything in Premium","Talent Hub access","Unlimited AI generations","Custom brand kit","White-label reports","Dedicated account manager"],
    cta:"Go Pro", popular:false,
  },
];

const BUSINESS_PLANS = [
  {
    key:"starter", name:"Starter", price:499, yearlyPrice:3999,
    desc:"For small businesses",
    color:"#6b7280",
    features:["5 team seats","Brand Tools — unlimited","Content Planner","Talent Hub (view only)","Analytics — basic"],
    cta:"Start free trial", popular:false,
  },
  {
    key:"premium", name:"Premium", price:999, yearlyPrice:7999,
    desc:"For growing businesses",
    color:BLUE,
    features:["20 team seats","Full Brand & Content suite","Talent Hub — hire & message","Campaign analytics","AI content generator — unlimited","Priority support"],
    cta:"Start Premium", popular:true,
  },
  {
    key:"pro", name:"Pro", price:1999, yearlyPrice:15999,
    desc:"For agencies & enterprises",
    color:"#7c3aed",
    features:["Unlimited seats","Everything in Premium","Dedicated account manager","API access","White-label dashboard","Custom integrations","SLA guarantee"],
    cta:"Contact us", popular:false,
  },
];

function PlanCard({ plan, isYearly, isBusiness, onBuy }) {
  const price = isYearly ? plan.yearlyPrice : plan.price;
  return (
    <div style={{
      position:"relative", borderRadius:14, padding:"26px 22px",
      background:plan.popular?"#0a0a0a":"#fff",
      border:`1.5px solid ${plan.popular?BLUE:B}`,
      boxShadow:plan.popular?`0 8px 40px ${BLUE}25`:"none",
      display:"flex", flexDirection:"column",
    }}>
      {plan.popular && (
        <div style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)",
          background:BLUE, color:"#fff", fontSize:10.5, fontWeight:700,
          padding:"3px 14px", borderRadius:99, letterSpacing:"0.06em",
          textTransform:"uppercase", whiteSpace:"nowrap" }}>Most Popular</div>
      )}
      <div style={{ marginBottom:18 }}>
        <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:plan.color, marginBottom:8 }}>{plan.name}</div>
        <div style={{ fontSize:32, fontWeight:800, letterSpacing:"-0.04em", color:plan.popular?"#fff":"#0a0a0a", lineHeight:1, marginBottom:4 }}>
          {price === 0 ? "Free" : <>₹{price}<span style={{ fontSize:13, fontWeight:400, color:plan.popular?"#777":"#9ca3af" }}>/{isYearly?"yr":"mo"}</span></>}
        </div>
        {isYearly && price > 0 && <div style={{ fontSize:11, color:BLUE, fontWeight:600 }}>Save 2 months free</div>}
        <p style={{ fontSize:12.5, color:plan.popular?"#666":"#9ca3af", marginTop:6 }}>{plan.desc}</p>
      </div>
      <div style={{ flex:1, marginBottom:22 }}>
        {plan.features.map(f => (
          <div key={f} style={{ display:"flex", alignItems:"center", gap:9, padding:"6px 0",
            borderBottom:`1px solid ${plan.popular?"#1a1a1a":"#f7f7f7"}`,
            fontSize:12.5, color:plan.popular?"#ccc":"#4b5563" }}>
            <div style={{ width:14, height:14, borderRadius:"50%", flexShrink:0,
              background:`${plan.color}20`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="7" height="6" viewBox="0 0 9 8" fill="none">
                <path d="M1.5 4L3.5 6L7.5 1.5" stroke={plan.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            {f}
          </div>
        ))}
      </div>
      <button onClick={() => onBuy(plan, price)} style={{
        width:"100%", padding:"11px 0", borderRadius:8, fontSize:13.5, fontWeight:700,
        border:"none", cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif",
        background:plan.popular?BLUE:"#f3f4f6",
        color:plan.popular?"#fff":"#0a0a0a",
        transition:"opacity 0.14s",
      }}
        onMouseOver={e=>e.currentTarget.style.opacity="0.85"}
        onMouseOut={e=>e.currentTarget.style.opacity="1"}
      >{plan.cta}</button>
    </div>
  );
}

export default function PricingPage({ profile }) {
  const [tab, setTab]           = useState("individual");
  const [isYearly, setIsYearly] = useState(false);

  useEffect(() => {
    if (profile?.user_type === "business") setTab("business");
  }, [profile]);

  const plans = tab === "individual" ? INDIVIDUAL_PLANS : BUSINESS_PLANS;

  const handleBuy = (plan, price) => {
    if (price === 0) { window.location.href = "/"; return; }
    if (plan.key === "pro" && tab === "business") { window.location.href = "mailto:hello@nugens.in?subject=DigiHub Pro enquiry"; return; }
    window.location.href = `https://nugens.in.net/pricing`;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'Plus Jakarta Sans',sans-serif; background:#fff; color:#0a0a0a; }
        .chip { display:inline-flex; align-items:center; gap:6px; padding:4px 12px; border-radius:6px; border:1px solid ${B}; font-size:11.5px; font-weight:500; color:#6b7280; }
        .chip-blue { background:#eff6ff; border-color:#bae6fd; color:${BLUE}; }
        .tab-pill { padding:7px 20px; border-radius:7px; font-size:13px; font-weight:600; cursor:pointer; border:none; transition:all 0.15s; font-family:'Plus Jakarta Sans',sans-serif; }
        .toggle { position:relative; width:38px; height:21px; background:#e5e7eb; border-radius:99px; cursor:pointer; transition:background 0.2s; }
        .toggle.on { background:${BLUE}; }
        .toggle-thumb { position:absolute; top:3px; left:3px; width:15px; height:15px; border-radius:50%; background:#fff; transition:transform 0.2s; box-shadow:0 1px 3px rgba(0,0,0,0.2); }
        .toggle.on .toggle-thumb { transform:translateX(17px); }
        @media(max-width:760px) { .plans-g { grid-template-columns:1fr !important; } }
      `}</style>

      <section style={{ padding:"72px 24px 48px", textAlign:"center", borderBottom:`1px solid ${B}` }}>
        <span className="chip chip-blue" style={{ marginBottom:16 }}>DigiHub Pricing</span>
        <h1 style={{ fontWeight:800, fontSize:"clamp(26px,4vw,44px)", letterSpacing:"-0.035em", margin:"14px 0", lineHeight:1.15 }}>
          Grow your brand.<br /><span style={{ color:BLUE }}>Start free today.</span>
        </h1>
        <p style={{ fontSize:15, color:"#6b7280", maxWidth:400, margin:"0 auto 28px", lineHeight:1.7 }}>
          All plans include a free trial. One Nugens subscription activates across all products.
        </p>

        <div style={{ display:"flex", justifyContent:"center", marginBottom:20 }}>
          <div style={{ display:"flex", background:"#f3f4f6", borderRadius:9, padding:3, gap:2 }}>
            {["individual","business"].map(t => (
              <button key={t} className="tab-pill" onClick={() => setTab(t)} style={{
                background:tab===t?"#fff":"transparent", color:tab===t?"#0a0a0a":"#6b7280",
                boxShadow:tab===t?"0 1px 4px rgba(0,0,0,0.08)":"none",
              }}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
            ))}
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
          <span style={{ fontSize:13, color:isYearly?"#9ca3af":"#0a0a0a", fontWeight:500 }}>Monthly</span>
          <div className={`toggle${isYearly?" on":""}`} onClick={() => setIsYearly(v=>!v)}>
            <div className="toggle-thumb"/>
          </div>
          <span style={{ fontSize:13, color:isYearly?"#0a0a0a":"#9ca3af", fontWeight:500 }}>
            Yearly <span style={{ color:BLUE, fontWeight:700 }}>save 2 months</span>
          </span>
        </div>
      </section>

      <section style={{ padding:"48px 24px 72px", background:"#fafafa" }}>
        <div style={{ maxWidth:960, margin:"0 auto" }}>
          <div className="plans-g" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, alignItems:"start" }}>
            {plans.map(plan => (
              <PlanCard key={plan.key} plan={plan} isYearly={isYearly} isBusiness={tab==="business"} onBuy={handleBuy} />
            ))}
          </div>
          <div style={{ textAlign:"center", marginTop:28, fontSize:13, color:"#9ca3af" }}>
            💡 Subscriptions taken on Nugens.in.net are active across all products automatically.{" "}
            <a href="https://nugens.in.net/pricing" style={{ color:BLUE, textDecoration:"none", fontWeight:600 }}>View platform plans →</a>
          </div>
        </div>
      </section>
    </>
  );
}
