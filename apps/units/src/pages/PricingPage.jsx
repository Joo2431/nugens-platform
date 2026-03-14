import React, { useState, useEffect } from "react";

const GOLD = "#d4a843";
const PINK = "#e8185d";
const B    = "#f0f0f0";

const INDIVIDUAL_PLANS = [
  {
    key:"enquiry", name:"Enquiry", price:0,
    desc:"Get a custom quote", color:"#9ca3af",
    features:["Browse all packages","Free consultation call","Personalised quote","No commitment"],
    cta:"Get a free quote", popular:false,
  },
  {
    key:"wedding", name:"Wedding", price:45000,
    desc:"Photography or videography", color:GOLD,
    features:["Ceremony coverage","Edited deliverables","Online gallery","Print-ready files","Follow-up edits included"],
    cta:"Book this package", popular:true,
  },
  {
    key:"full", name:"Full Package", price:95000,
    desc:"Photography + Videography",
    color:PINK,
    features:["2-person crew","Full photo + film","Drone shots included","Premium album","Same-day edit teaser","Dedicated coordinator"],
    cta:"Book full package", popular:false,
  },
];

const BUSINESS_PLANS = [
  {
    key:"brand-video", name:"Brand Video", price:25000,
    desc:"For product and brand launches", color:"#9ca3af",
    features:["1-day shoot","Scripted or unscripted","3-min brand film","Social cuts (15s, 30s)","2 revision rounds"],
    cta:"Book now", popular:false,
  },
  {
    key:"campaign", name:"Campaign", price:60000,
    desc:"Multi-day brand production", color:GOLD,
    features:["2–3 day shoot","Full production crew","Multiple deliverables","Color grading included","BTS content","Priority editing (5 days)"],
    cta:"Book campaign", popular:true,
  },
  {
    key:"retainer", name:"Retainer", price:120000,
    desc:"Monthly content partnership", color:PINK,
    features:["4 shoot days/month","Unlimited content formats","Dedicated editor","DigiHub content strategy","Monthly performance report","Priority booking"],
    cta:"Enquire now", popular:false,
  },
];

function PlanCard({ plan, isYearly, onBuy }) {
  const displayPrice = plan.price === 0 ? "Free" : `₹${plan.price.toLocaleString("en-IN")}`;
  return (
    <div style={{
      position:"relative", borderRadius:16, padding:"28px 22px",
      background:plan.popular?"#0a0805":"#fff",
      border:`1.5px solid ${plan.popular?GOLD:B}`,
      boxShadow:plan.popular?`0 8px 40px ${GOLD}20`:"none",
      display:"flex", flexDirection:"column",
      fontFamily:"'Plus Jakarta Sans',sans-serif",
    }}>
      {plan.popular && (
        <div style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)",
          background:GOLD, color:"#0a0805", fontSize:10.5, fontWeight:800,
          padding:"3px 14px", borderRadius:99, letterSpacing:"0.06em",
          textTransform:"uppercase", whiteSpace:"nowrap" }}>Most Booked</div>
      )}
      <div style={{ marginBottom:18 }}>
        <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:plan.color, marginBottom:8 }}>{plan.name}</div>
        <div style={{ fontSize:30, fontWeight:800, letterSpacing:"-0.04em", color:plan.popular?"#e8d5a0":"#0a0a0a", lineHeight:1, marginBottom:4 }}>
          {displayPrice}
          {plan.price > 0 && <span style={{ fontSize:12, fontWeight:400, color:plan.popular?"#6a5a30":"#9ca3af" }}> onwards</span>}
        </div>
        <p style={{ fontSize:12.5, color:plan.popular?"#6a5a30":"#9ca3af", marginTop:6 }}>{plan.desc}</p>
      </div>
      <div style={{ flex:1, marginBottom:22 }}>
        {plan.features.map(f => (
          <div key={f} style={{ display:"flex", alignItems:"center", gap:9, padding:"6px 0",
            borderBottom:`1px solid ${plan.popular?"#1c1a14":"#f7f7f7"}`,
            fontSize:12.5, color:plan.popular?"#c8a870":"#4b5563" }}>
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
      <button onClick={() => onBuy(plan)} style={{
        width:"100%", padding:"12px 0", borderRadius:9, fontSize:13.5, fontWeight:700,
        border:"none", cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif",
        background:plan.popular?GOLD:"#f3f4f6",
        color:plan.popular?"#0a0805":"#0a0a0a",
        transition:"opacity 0.15s",
      }}
        onMouseOver={e=>e.currentTarget.style.opacity="0.85"}
        onMouseOut={e=>e.currentTarget.style.opacity="1"}
      >{plan.cta}</button>
    </div>
  );
}

export default function PricingPage({ profile }) {
  const [tab, setTab] = useState("individual");
  useEffect(() => { if (profile?.user_type==="business") setTab("business"); }, [profile]);
  const plans = tab === "individual" ? INDIVIDUAL_PLANS : BUSINESS_PLANS;

  const handleBuy = (plan) => {
    if (plan.price === 0) { window.location.href = "/book"; return; }
    window.location.href = `/book`;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'Plus Jakarta Sans',sans-serif; background:#0a0805; }
        .tab-pill { padding:7px 20px; border-radius:7px; font-size:13px; font-weight:600; cursor:pointer; border:none; transition:all 0.15s; font-family:'Plus Jakarta Sans',sans-serif; }
        @media(max-width:760px) { .plans-g { grid-template-columns:1fr !important; } }
      `}</style>

      {/* Hero */}
      <section style={{ padding:"64px 24px 48px", textAlign:"center", background:"#0a0805", borderBottom:"1px solid #1c1a14" }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 12px",
          borderRadius:6, border:"1px solid #1c1a14", fontSize:11.5, fontWeight:500, color:GOLD,
          background:"#0f0c08", marginBottom:16 }}>✦ Units Packages</div>
        <h1 style={{ fontWeight:800, fontSize:"clamp(26px,4vw,44px)", letterSpacing:"-0.035em",
          margin:"14px 0", lineHeight:1.15, color:"#e8d5a0" }}>
          Timeless visuals,<br /><span style={{ color:GOLD }}>honest pricing.</span>
        </h1>
        <p style={{ fontSize:15, color:"#6a5a30", maxWidth:400, margin:"0 auto 28px", lineHeight:1.7 }}>
          Every project is different. These are our starting packages — contact us for a personalised quote.
        </p>

        <div style={{ display:"flex", justifyContent:"center" }}>
          <div style={{ display:"flex", background:"#0f0c08", border:"1px solid #1c1a14", borderRadius:9, padding:3, gap:2 }}>
            {["individual","business"].map(t => (
              <button key={t} className="tab-pill" onClick={() => setTab(t)} style={{
                background:tab===t?"#1c1a14":"transparent",
                color:tab===t?GOLD:"#4a4030",
              }}>
                {t === "individual" ? "Weddings & Events" : "Brand & Business"}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding:"48px 24px 72px", background:"#0d0a07" }}>
        <div style={{ maxWidth:960, margin:"0 auto" }}>
          <div className="plans-g" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, alignItems:"start" }}>
            {plans.map(plan => <PlanCard key={plan.key} plan={plan} onBuy={handleBuy} />)}
          </div>
          <div style={{ textAlign:"center", marginTop:28, fontSize:13, color:"#4a4030" }}>
            All prices are starting rates. Final pricing depends on location, duration, and requirements.{" "}
            <a href="/book" style={{ color:GOLD, textDecoration:"none", fontWeight:600 }}>Get a custom quote →</a>
          </div>
        </div>
      </section>
    </>
  );
}
