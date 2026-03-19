import React, { useState } from "react";

const PINK  = "#e8185d";
const TEXT  = "#111827";
const MUTED = "#6b7280";
const LIGHT = "#f8f9fb";
const CARD  = "#ffffff";
const BORDER= "#e8eaed";
const API   = "https://nugens-platform.onrender.com";

const BIZ_SERVICES = [
  { icon:"🎬", title:"Video Editing",    from:8000,  tag:"Most Popular" },
  { icon:"📣", title:"Content Strategy", from:5000,  tag:"" },
  { icon:"🎨", title:"Graphic Design",   from:6000,  tag:"" },
  { icon:"🌐", title:"Website Building", from:12000, tag:"" },
  { icon:"📊", title:"Marketing",        from:10000, tag:"" },
  { icon:"✍️", title:"Scripting",        from:4000,  tag:"" },
];

const IND_PLANS = [
  {
    name:"Free",
    price:0,
    desc:"Everything to start your journey",
    color:MUTED,
    features:["Live brand experience sessions","Entrepreneur Guide (all 6 chapters)","Idea Validation (unlimited)","AI guidance & Q&A","Community access","Gen-E Mini support"],
    cta:"Current Plan",
    free:true,
  },
  {
    name:"Premium Consultation",
    price:999,
    desc:"One-on-one with our expert team",
    color:PINK,
    features:["Everything in Free","45-min 1-on-1 with senior mentor","Competitive analysis report","Business model refinement","GTM strategy walkthrough","Follow-up action plan","Email support for 7 days"],
    cta:"Book Consultation",
    free:false,
    oneTime:true,
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

export default function PricingPage({ profile }) {
  const [tab,     setTab]     = useState(profile?.user_type==="individual" ? "individual" : "business");
  const [loading, setLoading] = useState(null);
  const [success, setSuccess] = useState(false);

  const pay = async (amount, label) => {
    setLoading(label);
    try {
      const res = await fetch(`${API}/api/subscription/create-order`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ amount, currency:"INR", plan:`units_consult` })
      });
      const order = await res.json();
      await loadRazorpay();
      const rzp = new window.Razorpay({
        key:"rzp_live_SM1s5O14Mm50mV",
        amount:order.amount, currency:"INR", order_id:order.id,
        name:"The Units — NuGens",
        description:"Premium Consultation Session",
        theme:{ color:PINK },
        prefill:{ name:profile?.full_name||"", email:profile?.email||"" },
        handler:async (r)=>{ await fetch(`${API}/api/subscription/verify`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...r,plan:"units_consult",userId:profile?.id})}); setSuccess(true); setLoading(null); },
        modal:{ ondismiss:()=>setLoading(null) }
      });
      rzp.open();
    } catch(e){ setLoading(null); }
  };

  const S = {
    page: { minHeight:"100vh", background:LIGHT, padding:"48px 44px", fontFamily:"'Plus Jakarta Sans',sans-serif" },
    card: { background:CARD, border:`1px solid ${BORDER}`, borderRadius:18, padding:32, boxShadow:"0 1px 3px rgba(0,0,0,0.04)", display:"flex", flexDirection:"column" },
    btn: (c) => ({ width:"100%", padding:"13px 0", background:c, color:"#fff", border:"none", borderRadius:10, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", marginTop:"auto" }),
    check: { fontSize:13, color:MUTED, display:"flex", gap:8, marginBottom:9 },
  };

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>


      <div style={{ textAlign:"center", marginBottom:40 }}>
        <div style={{ fontSize:32, fontWeight:800, color:TEXT, letterSpacing:"-0.05em", marginBottom:8 }}>The Units — Pricing</div>
        <div style={{ fontSize:14, color:MUTED }}>Individual features are free. Services are pay-per-project. Consultation is pay-per-session.</div>
      </div>

      {/* Tab */}
      <div style={{ display:"flex", justifyContent:"center", marginBottom:40 }}>
        <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, padding:4, display:"flex", gap:4 }}>
          {["business","individual"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{ padding:"9px 28px", background:tab===t?PINK:"none", color:tab===t?"#fff":MUTED, border:"none", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s" }}>
              {t==="business"?"🏢 Business":"👤 Individual"}
            </button>
          ))}
        </div>
      </div>

      {/* Business services */}
      {tab==="business" && (
        <div>
          <div style={{ textAlign:"center", marginBottom:32 }}>
            <div style={{ fontSize:20, fontWeight:800, color:TEXT, marginBottom:8 }}>Pay-Per-Project Services</div>
            <div style={{ fontSize:13, color:MUTED }}>No subscription. Book any service, pay once, get exceptional work delivered.</div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, maxWidth:900, margin:"0 auto 48px" }}>
            {BIZ_SERVICES.map(s=>(
              <div key={s.title} style={{ ...S.card, padding:24 }}>
                {s.tag && <div style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.08em", color:PINK, marginBottom:8 }}>{s.tag}</div>}
                <div style={{ fontSize:28, marginBottom:10 }}>{s.icon}</div>
                <div style={{ fontSize:15, fontWeight:700, color:TEXT, marginBottom:4 }}>{s.title}</div>
                <div style={{ fontSize:20, fontWeight:800, color:PINK, marginBottom:16 }}>From ₹{s.from.toLocaleString()}</div>
                <a href="/book" style={{ ...S.btn(PINK), textDecoration:"none", textAlign:"center", display:"block" }}>Book Now →</a>
              </div>
            ))}
          </div>

          <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:16, padding:32, maxWidth:700, margin:"0 auto", textAlign:"center" }}>
            <div style={{ fontSize:18, fontWeight:800, color:TEXT, marginBottom:8 }}>Need a custom package?</div>
            <div style={{ fontSize:13, color:MUTED, marginBottom:20 }}>For ongoing partnerships, retainer arrangements, or bundled services — talk to us. We customise to your needs and budget.</div>
            <a href="mailto:hello@nugens.in" style={{ display:"inline-block", padding:"12px 28px", background:PINK, color:"#fff", borderRadius:10, textDecoration:"none", fontSize:14, fontWeight:700 }}>Contact Our Team →</a>
          </div>
        </div>
      )}

      {/* Individual plans */}
      {tab==="individual" && (
        <div>
          {success && (
            <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:12, padding:"16px 24px", textAlign:"center", maxWidth:500, margin:"0 auto 28px", color:GREEN }}>
              ✓ Consultation booked! Our team will be in touch within 24 hours.
            </div>
          )}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:20, maxWidth:700, margin:"0 auto" }}>
            {IND_PLANS.map(plan=>(
              <div key={plan.name} style={{ ...S.card, border:plan.free?`1px solid ${BORDER}`:`1px solid ${PINK}30` }}>
                <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:plan.color, marginBottom:8 }}>
                  {plan.name}
                </div>
                <div style={{ fontSize:11, color:MUTED, marginBottom:16 }}>{plan.desc}</div>
                <div style={{ fontSize:34, fontWeight:800, color:TEXT, letterSpacing:"-0.04em", marginBottom:4 }}>
                  {plan.price===0 ? "Free" : `₹${plan.price}`}
                </div>
                {plan.oneTime && <div style={{ fontSize:11, color:MUTED, marginBottom:20 }}>one-time · per session</div>}
                {plan.price===0 && <div style={{ marginBottom:20 }}/>}

                <div style={{ flex:1, marginBottom:24 }}>
                  {plan.features.map((f,i)=>(
                    <div key={i} style={S.check}>
                      <span style={{color:plan.color,flexShrink:0}}>✓</span>{f}
                    </div>
                  ))}
                </div>

                {plan.free ? (
                  <div style={{ width:"100%", padding:"13px 0", background:"#f8f9fb", color:MUTED, borderRadius:10, fontSize:13, fontWeight:600, textAlign:"center", border:`1px solid ${BORDER}` }}>
                    All features included
                  </div>
                ) : (
                  <button onClick={()=>pay(plan.price,plan.name)} disabled={loading===plan.name} style={{ ...S.btn(PINK), opacity:loading===plan.name?0.6:1 }}>
                    {loading===plan.name?"Processing...":plan.cta}
                  </button>
                )}
              </div>
            ))}
          </div>

          <div style={{ textAlign:"center", marginTop:36, fontSize:13, color:MUTED }}>
            All individual features are free. Premium consultation is only charged if you find it valuable.
            <br/>Questions? <a href="mailto:hello@nugens.in" style={{color:PINK}}>hello@nugens.in</a>
          </div>
        </div>
      )}

      {/* FAQ */}
      <div style={{ maxWidth:680, margin:"48px auto 0" }}>
        <div style={{ fontSize:20, fontWeight:800, color:TEXT, textAlign:"center", marginBottom:24 }}>Questions</div>
        {[
          { q:"Are individual features really free?", a:"Yes, completely. Live Experience, Entrepreneur Guide, and Idea Validation are free forever. We only charge for premium 1-on-1 consultations." },
          { q:"How does business service pricing work?", a:"Pay-per-project. No subscriptions. Choose a service, pick a package, pay, and our team delivers. Simple." },
          { q:"What if I'm not happy with the work?", a:"We include revisions in all packages. If the work doesn't meet your brief, we revise until it does. Your satisfaction is our reputation." },
          { q:"How quickly does the team respond?", a:"For consultations: within 24 hours on business days. For service bookings: within 2 hours. For AI guidance: instant." },
        ].map((f,i)=>(
          <div key={i} style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:10, padding:"16px 20px", marginBottom:10 }}>
            <div style={{ fontSize:13, fontWeight:700, color:TEXT, marginBottom:6 }}>{f.q}</div>
            <div style={{ fontSize:13, color:MUTED, lineHeight:1.65 }}>{f.a}</div>
          </div>
        ))}
      </div>
    </div>
  );
}