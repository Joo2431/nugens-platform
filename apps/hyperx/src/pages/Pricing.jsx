import React, { useState } from "react";
import { apiPost } from "../lib/apiClient";

const PINK   = "#e8185d";
const TEXT   = "#111827";
const MUTED  = "#6b7280";
const LIGHT  = "#f8f9fb";
const CARD   = "#ffffff";
const BORDER = "#e8eaed";
const GREEN  = "#16a34a";

const IND_PLANS = [
  {
    id:"hx_ind_starter", name:"Starter", price:{ monthly:0, yearly:0 },
    tag:"Always Free", color:MUTED, popular:false, free:true,
    certLimit:0,
    features:["Access to all free courses","Individual courses only","Community access","Gen-E Mini AI support","No certifications"],
    cta:"Current Free Plan",
  },
  {
    id:"hx_ind_premium_monthly", name:"Premium", price:{ monthly:299, yearly:null },
    tag:"Monthly Plan", color:PINK, popular:false, free:false,
    certLimit:2,
    features:["All individual courses","2 certifications per year","Monthly exclusive course","Real-time AI guidance","Gen-E Mini support","Course progress tracking"],
    cta:"Get Premium — ₹299/mo",
  },
  {
    id:"hx_ind_pro_monthly", name:"Pro", price:{ monthly:1299, yearly:null },
    tag:"Serious Learners", color:"#7c3aed", popular:true, free:false,
    certLimit:6,
    features:["Everything in Premium","6 certifications per year","All exclusive courses","Priority AI guidance","Certificate with LinkedIn export","Early course access"],
    cta:"Go Pro — ₹1,299/mo",
  },
  {
    id:"hx_ind_yearly", name:"Yearly", price:{ monthly:null, yearly:2999 },
    tag:"Best Value", color:GREEN, popular:false, free:false,
    certLimit:999,
    features:["Everything in Pro","Unlimited certifications","All courses forever","Priority support","Save ₹12,589 vs monthly Pro","Yearly exclusive course pack"],
    cta:"Go Yearly — ₹2,999/yr",
  },
];

const BIZ_PLANS = [
  {
    id:"hx_biz_starter_monthly", name:"Starter", price:{ monthly:299, yearly:null },
    tag:"Teams starting out", color:MUTED, popular:false, free:false,
    certLimit:2,
    features:["Access to free courses only","Business + Individual courses","2 certifications per year","Community access","Gen-E Mini support"],
    cta:"Get Starter — ₹299/mo",
  },
  {
    id:"hx_biz_premium_monthly", name:"Premium", price:{ monthly:699, yearly:null },
    tag:"Growing Teams", color:PINK, popular:true, free:false,
    certLimit:2,
    features:["All business & individual courses","2 certifications per year","Monthly exclusive course","Real-time AI guidance","Team progress dashboard","Gen-E Mini support"],
    cta:"Get Premium — ₹699/mo",
  },
  {
    id:"hx_biz_pro_monthly", name:"Pro", price:{ monthly:1599, yearly:null },
    tag:"Scaling Businesses", color:"#7c3aed", popular:false, free:false,
    certLimit:6,
    features:["Everything in Premium","6 certifications per year","All exclusive courses","Priority AI & team guidance","Team certification tracker","Early course access"],
    cta:"Go Pro — ₹1,599/mo",
  },
  {
    id:"hx_biz_yearly", name:"Yearly Pro", price:{ monthly:null, yearly:3499 },
    tag:"Best Value", color:GREEN, popular:false, free:false,
    certLimit:999,
    features:["Everything in Business Pro","Unlimited certifications","Yearly exclusive business pack","Priority team support","Bulk seat discounts available","Save ₹15,689 vs monthly Pro"],
    cta:"Go Yearly — ₹3,499/yr",
  },
];

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

export default function Pricing({ profile }) {
  const [tab,     setTab]     = useState(profile?.user_type === "individual" ? "individual" : "business");
  const [loading, setLoading] = useState(null);
  const [success, setSuccess] = useState(null);
  const [error,   setError]   = useState(null);

  const plans = tab === "individual" ? IND_PLANS : BIZ_PLANS;

  const pay = async (plan) => {
    if (plan.free) return;
    const amount = plan.price.yearly || plan.price.monthly;
    if (!amount) return;
    setLoading(plan.id);
    setError(null);

    try {
      // apiPost (from apiClient.js) auto-attaches the Supabase Bearer token — fixes 401
      const { order } = await apiPost("/api/subscription/create-order", {
        plan: plan.id,
      });

      if (!order?.id) throw new Error("Order creation failed — no order ID returned.");

      await loadRazorpay();

      const rzp = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_SM1s5O14Mm50mV",
        amount: order.amount,
        currency: "INR",
        order_id: order.id,
        name: "HyperX by NuGens",
        description: `HyperX ${plan.name} — ${plan.price.yearly ? "Yearly" : "Monthly"}`,
        theme: { color: PINK },
        prefill: { name: profile?.full_name || "", email: profile?.email || "" },
        handler: async (r) => {
          await apiPost("/api/subscription/verify", {
            ...r,
            plan: plan.id,
            userId: profile?.id,
          });
          setSuccess(plan.name);
          setLoading(null);
        },
        modal: { ondismiss: () => setLoading(null) },
      });
      rzp.open();
    } catch (e) {
      console.error("[HyperX] Payment error:", e);
      setError(e.message || "Payment failed. Please try again.");
      setLoading(null);
    }
  };

  const S = {
    page:  { minHeight:"100vh", background:LIGHT, padding:"48px 44px", fontFamily:"'Plus Jakarta Sans',sans-serif" },
    card:  (featured) => ({ background:CARD, border:`1px solid ${featured ? "#e8185d40" : BORDER}`, borderRadius:18, padding:30, position:"relative", display:"flex", flexDirection:"column", boxShadow:featured ? "0 8px 32px rgba(232,24,93,0.12)" : "0 1px 3px rgba(0,0,0,0.04)" }),
    btn:   (c) => ({ width:"100%", padding:"13px 0", background:c, color:"#fff", border:"none", borderRadius:10, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", marginTop:"auto" }),
    check: { fontSize:13, color:MUTED, display:"flex", gap:8, marginBottom:9, alignItems:"flex-start" },
  };

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      <div style={{ textAlign:"center", marginBottom:40 }}>
        <div style={{ fontSize:32, fontWeight:800, color:TEXT, letterSpacing:"-0.05em", marginBottom:8 }}>HyperX Learning Plans</div>
        <div style={{ fontSize:14, color:MUTED }}>Certifications, exclusive courses, and real-time AI guidance — built for your career.</div>
      </div>

      {/* Show toggle only when user_type is not locked */}
      {!profile?.user_type || profile.user_type === "unknown" ? (
        <div style={{ display:"flex", justifyContent:"center", marginBottom:40 }}>
          <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, padding:4, display:"flex", gap:4 }}>
            {["individual","business"].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding:"9px 28px", background:tab===t?PINK:"none", color:tab===t?"#fff":MUTED, border:"none", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s" }}>
                {t === "individual" ? "👤 Individual" : "🏢 Business"}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display:"flex", justifyContent:"center", marginBottom:40 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"9px 24px",
            background:CARD, border:`1px solid ${BORDER}`, borderRadius:12 }}>
            <span style={{ fontSize:14 }}>{tab==="business" ? "🏢" : "👤"}</span>
            <span style={{ fontSize:13, fontWeight:700, color:PINK }}>
              {tab==="business" ? "Business Plans" : "Individual Plans"}
            </span>
          </div>
        </div>
      )}

      {success && (
        <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:12, padding:"14px 24px", maxWidth:500, margin:"0 auto 28px", textAlign:"center", color:GREEN, fontWeight:700 }}>
          ✓ {success} plan activated! Refresh to see your new access.
        </div>
      )}

      {error && (
        <div style={{ background:"#fff1f2", border:"1px solid #fecdd3", borderRadius:12, padding:"14px 24px", maxWidth:500, margin:"0 auto 28px", textAlign:"center", color:"#be123c", fontWeight:600 }}>
          ⚠ {error}
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:`repeat(${plans.length},1fr)`, gap:16, maxWidth:1100, margin:"0 auto" }}>
        {plans.map(plan => (
          <div key={plan.id} style={S.card(plan.popular)}>
            {plan.popular && (
              <div style={{ position:"absolute", top:-13, left:"50%", transform:"translateX(-50%)", background:plan.color, color:"#fff", fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.08em", padding:"4px 16px", borderRadius:20, whiteSpace:"nowrap" }}>
                Most Popular
              </div>
            )}
            <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:plan.color, marginBottom:6 }}>{plan.tag}</div>
            <div style={{ fontSize:18, fontWeight:800, color:TEXT, marginBottom:4 }}>{plan.name}</div>

            <div style={{ marginBottom:20 }}>
              {plan.free ? (
                <div style={{ fontSize:30, fontWeight:800, color:TEXT }}>Free</div>
              ) : plan.price.yearly ? (
                <>
                  <div style={{ fontSize:30, fontWeight:800, color:TEXT }}>₹{plan.price.yearly.toLocaleString()}</div>
                  <div style={{ fontSize:11, color:MUTED }}>per year · + GST</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize:30, fontWeight:800, color:TEXT }}>₹{plan.price.monthly?.toLocaleString()}</div>
                  <div style={{ fontSize:11, color:MUTED }}>per month · + GST</div>
                </>
              )}
            </div>

            <div style={{ background:`${plan.color}10`, border:`1px solid ${plan.color}30`, borderRadius:8, padding:"8px 12px", marginBottom:16, textAlign:"center" }}>
              <div style={{ fontSize:11, fontWeight:700, color:plan.color }}>
                {plan.certLimit === 999 ? "∞ Unlimited Certifications" : plan.certLimit === 0 ? "No Certifications" : `${plan.certLimit} Certification${plan.certLimit > 1 ? "s" : ""} / year`}
              </div>
            </div>

            <div style={{ flex:1, marginBottom:20 }}>
              {plan.features.map((f, i) => (
                <div key={i} style={S.check}>
                  <span style={{ color:plan.color, flexShrink:0 }}>✓</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>

            {plan.free ? (
              <div style={{ width:"100%", padding:"12px 0", background:"#f8f9fb", border:`1px solid ${BORDER}`, borderRadius:10, textAlign:"center", fontSize:13, color:MUTED }}>Current Plan</div>
            ) : (
              <button onClick={() => pay(plan)} disabled={loading === plan.id} style={{ ...S.btn(plan.color), opacity:loading === plan.id ? 0.6 : 1 }}>
                {loading === plan.id ? "Processing..." : plan.cta}
              </button>
            )}
          </div>
        ))}
      </div>

      <div style={{ textAlign:"center", marginTop:32, fontSize:12, color:MUTED }}>
        {tab === "business" ? "Business plans include both individual and business courses." : "Individual plans only include individual courses."}
        {" "}All plans include Gen-E Mini AI support.
      </div>

      <div style={{ maxWidth:680, margin:"44px auto 0" }}>
        <div style={{ fontSize:20, fontWeight:800, color:TEXT, textAlign:"center", marginBottom:24 }}>Questions</div>
        {[
          { q:"What are certifications?", a:"After completing a course, you can generate a verified certificate of completion. The number of certificates you can earn per year depends on your plan. Yearly plans have unlimited certs." },
          { q:"What are exclusive courses?", a:"Every month, we release a new exclusive course available only to subscribers. These are not available on the free plan and are released only for that calendar month." },
          { q:"Can business users access individual courses?", a:"Yes. All business plans include access to both individual and business courses. Individual plans only include individual courses." },
          { q:"How does Razorpay billing work?", a:"All payments are one-time (monthly or yearly). There is no auto-renewal currently. You'll need to manually renew when your plan expires." },
        ].map((f, i) => (
          <div key={i} style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:10, padding:"16px 20px", marginBottom:10 }}>
            <div style={{ fontSize:13, fontWeight:700, color:TEXT, marginBottom:6 }}>{f.q}</div>
            <div style={{ fontSize:13, color:MUTED, lineHeight:1.65 }}>{f.a}</div>
          </div>
        ))}
      </div>
    </div>
  );
}