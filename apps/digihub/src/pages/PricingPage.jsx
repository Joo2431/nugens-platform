import React, { useState } from "react";

const BLUE = "#0284c7";
const BG   = "#06101a";
const CARD = "#0a1628";
const B    = "#1a2030";
const API  = "https://nugens-platform.onrender.com";

const BIZ_PLANS = [
  {
    name:"Starter",
    price:{ monthly:999, yearly:9990 },
    tag:"For small businesses",
    color:BLUE,
    features:["Prompt Space (100 generations/mo)","AI Image Generator (30 posters/mo)","Content Planner (AI-assisted)","Content Scheduler (up to 30 posts)","Community access","1 team member","Basic analytics"],
    cta:"Get Started",
    popular:false,
  },
  {
    name:"Premium",
    price:{ monthly:2599, yearly:25990 },
    tag:"Most Popular",
    color:"#e8185d",
    features:["Prompt Space (unlimited)","AI Image Generator (100 posters/mo)","Content Planner (full AI suite)","Content Scheduler (unlimited)","Community — priority visibility","5 team members","Advanced analytics","Hiring post promotion","Custom brand kit tools"],
    cta:"Go Premium",
    popular:true,
  },
  {
    name:"Pro",
    price:{ monthly:null, yearly:5999 },
    tag:"Annual only · Best value",
    color:"#22c55e",
    features:["Everything in Premium","AI Image Generator (unlimited)","10 team members","White-label reports","API access","Dedicated account manager","Priority support (SLA)","Early feature access","Community verified badge"],
    cta:"Go Pro",
    popular:false,
  },
];

const IND_PLANS = [
  {
    name:"Starter",
    price:{ monthly:0, yearly:0 },
    tag:"Always free",
    color:"#445",
    features:["Prompt Space (10/month)","AI Image Generator (5/month)","Content Planner (manual only)","Content Scheduler (10 posts)","Community access","Job Board (view only)"],
    cta:"Current Plan",
    popular:false,
    free:true,
  },
  {
    name:"Monthly",
    price:{ monthly:299, yearly:null },
    tag:"Flexible monthly",
    color:BLUE,
    features:["Prompt Space (50/month)","AI Image Generator (25/month)","Content Planner (AI-assisted)","Content Scheduler (60 posts)","Community — post & interact","Job Board (apply to jobs)","Portfolio showcase"],
    cta:"Subscribe Monthly",
    popular:false,
  },
  {
    name:"Yearly",
    price:{ monthly:null, yearly:1999 },
    tag:"Save ₹1589 vs monthly",
    color:"#22c55e",
    features:["Prompt Space (unlimited)","AI Image Generator (100/month)","Content Planner (full AI)","Content Scheduler (unlimited)","Community — verified badge","Job Board (featured profile)","Portfolio showcase","Priority support"],
    cta:"Go Yearly",
    popular:true,
  },
];

export default function PricingPage({ profile }) {
  const [tab,        setTab]        = useState(profile?.user_type === "individual" ? "individual" : "business");
  const [billing,    setBilling]    = useState("monthly");
  const [loading,    setLoading]    = useState(null);
  const [success,    setSuccess]    = useState(null);

  const plans = tab === "business" ? BIZ_PLANS : IND_PLANS;

  const initPayment = async (plan) => {
    if (plan.free) return;
    const amount = billing === "yearly" && plan.price.yearly ? plan.price.yearly : plan.price.monthly;
    if (!amount) return;

    setLoading(plan.name);
    try {
      const res = await fetch(`${API}/api/subscription/create-order`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          amount,
          currency:"INR",
          plan: `digihub_${tab}_${plan.name.toLowerCase()}`,
          billing,
        })
      });
      const order = await res.json();
      if (!order?.id) throw new Error("Order creation failed");

      const rzp = new window.Razorpay({
        key:"OKbq5A210M1EEWP4Wl213DOU",
        amount: order.amount,
        currency:"INR",
        order_id: order.id,
        name:"DigiHub",
        description:`DigiHub ${plan.name} Plan — ${billing === "yearly" ? "Yearly" : "Monthly"}`,
        theme:{ color:BLUE },
        prefill:{
          name: profile?.full_name || "",
          email: profile?.email || "",
        },
        handler: async (response) => {
          await fetch(`${API}/api/subscription/verify`, {
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_signature:  response.razorpay_signature,
              plan: `digihub_${tab}_${plan.name.toLowerCase()}`,
              userId: profile?.id,
            })
          });
          setSuccess(plan.name);
          setLoading(null);
        },
        modal:{ ondismiss:()=>setLoading(null) }
      });
      rzp.open();
    } catch(e) {
      console.error(e);
      setLoading(null);
    }
  };

  const getPrice = (plan) => {
    if (plan.free) return "Free";
    if (billing === "yearly" && plan.price.yearly) return `₹${plan.price.yearly.toLocaleString()}/yr`;
    if (plan.price.monthly) return `₹${plan.price.monthly.toLocaleString()}/mo`;
    return "Annual only";
  };

  const S = {
    page: { minHeight:"100vh", background:BG, padding:"48px 40px", fontFamily:"'Plus Jakarta Sans',sans-serif" },
    h1: { fontSize:32, fontWeight:800, color:"#fff", letterSpacing:"-0.05em", marginBottom:8, textAlign:"center" },
    sub: { fontSize:14, color:"#445", marginBottom:36, textAlign:"center" },
    card: (featured) => ({ background:CARD, border:`1px solid ${featured?"#e8185d40":B}`, borderRadius:18, padding:32, position:"relative", display:"flex", flexDirection:"column" }),
    btn: (color) => ({ width:"100%", padding:"13px 0", background:color, color:"#fff", border:"none", borderRadius:10, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", marginTop:"auto" }),
    check: { fontSize:13, color:"#aaa", display:"flex", gap:8, marginBottom:9 },
  };

  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        ${BLUE && ''}
      `}</style>
      <script src="https://checkout.razorpay.com/v1/checkout.js" />

      <div style={S.h1}>DigiHub Pricing</div>
      <div style={S.sub}>Choose the right plan for your digital goals</div>

      {/* Tab switcher */}
      <div style={{ display:"flex", justifyContent:"center", gap:0, marginBottom:32 }}>
        <div style={{ background:"#0a1628", border:`1px solid ${B}`, borderRadius:12, padding:4, display:"flex", gap:4 }}>
          {["business","individual"].map(t => (
            <button key={t} onClick={()=>setTab(t)} style={{ padding:"8px 24px", background:tab===t?BLUE:"none", color:tab===t?"#fff":"#445", border:"none", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s" }}>
              {t==="business" ? "🏢 Business" : "👤 Individual"}
            </button>
          ))}
        </div>
      </div>

      {/* Billing toggle (only for non-free, where applicable) */}
      {tab === "business" && (
        <div style={{ display:"flex", justifyContent:"center", gap:0, marginBottom:36 }}>
          <div style={{ background:"#0a1628", border:`1px solid ${B}`, borderRadius:10, padding:3, display:"flex" }}>
            {["monthly","yearly"].map(b => (
              <button key={b} onClick={()=>setBilling(b)} style={{ padding:"7px 20px", background:billing===b?"#1a2030":"none", color:billing===b?"#fff":"#445", border:"none", borderRadius:7, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                {b==="yearly" ? "Yearly (save 20%)" : "Monthly"}
              </button>
            ))}
          </div>
        </div>
      )}

      {success && (
        <div style={{ background:"#22c55e15", border:"1px solid #22c55e30", borderRadius:12, padding:"16px 24px", textAlign:"center", maxWidth:500, margin:"0 auto 32px", color:"#22c55e" }}>
          ✓ Payment successful! Your {success} plan is now active. Refresh to see your new features.
        </div>
      )}

      {/* Plans grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20, maxWidth:1000, margin:"0 auto" }}>
        {plans.map(plan => (
          <div key={plan.name} style={S.card(plan.popular)}>
            {plan.popular && (
              <div style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)", background:"#e8185d", color:"#fff", fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.08em", padding:"4px 14px", borderRadius:20 }}>
                {plan.tag}
              </div>
            )}

            <div style={{ marginBottom:8 }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:plan.color, marginBottom:6 }}>
                {plan.name}
              </div>
              {!plan.popular && <div style={{ fontSize:11, color:"#334", marginBottom:6 }}>{plan.tag}</div>}
            </div>

            <div style={{ marginBottom:24 }}>
              <div style={{ fontSize:32, fontWeight:800, color:"#fff", letterSpacing:"-0.04em" }}>{getPrice(plan)}</div>
              {!plan.free && <div style={{ fontSize:11, color:"#334", marginTop:2 }}>+ GST applicable</div>}
            </div>

            <div style={{ flex:1, marginBottom:24 }}>
              {plan.features.map((f,i) => (
                <div key={i} style={S.check}>
                  <span style={{ color:plan.color, flexShrink:0 }}>✓</span>
                  {f}
                </div>
              ))}
            </div>

            <button
              onClick={()=>initPayment(plan)}
              disabled={plan.free || loading===plan.name}
              style={{ ...S.btn(plan.popular?"#e8185d":plan.free?"#1a2030":plan.color), opacity:loading===plan.name?0.7:1, cursor:plan.free?"default":"pointer" }}
            >
              {loading===plan.name ? "Processing..." : plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div style={{ maxWidth:700, margin:"48px auto 0" }}>
        <div style={{ fontSize:20, fontWeight:800, color:"#fff", textAlign:"center", marginBottom:24 }}>Frequently Asked Questions</div>
        {[
          { q:"Can I switch plans?", a:"Yes, you can upgrade or downgrade your plan anytime. Changes take effect immediately." },
          { q:"Is there a refund policy?", a:"We offer a 7-day refund for yearly plans if you're not satisfied. Monthly plans are non-refundable." },
          { q:"What payment methods are supported?", a:"We accept all UPI apps, credit/debit cards, net banking, and wallets via Razorpay." },
          { q:"Can I add team members?", a:"Business plans include team member seats. Starter includes 1, Premium includes 5, and Pro includes 10 seats." },
        ].map((f,i) => (
          <div key={i} style={{ background:CARD, border:`1px solid ${B}`, borderRadius:10, padding:"16px 20px", marginBottom:10 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#ccc", marginBottom:6 }}>{f.q}</div>
            <div style={{ fontSize:13, color:"#445", lineHeight:1.6 }}>{f.a}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
