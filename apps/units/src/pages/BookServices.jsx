import React, { useState } from "react";

const PINK  = "#e8185d";
const TEXT  = "#111827";
const MUTED = "#6b7280";
const LIGHT = "#f8f9fb";
const CARD  = "#ffffff";
const BORDER= "#e8eaed";
const API   = "https://nugens-platform.onrender.com";

const SERVICES = [
  {
    id:"video-editing",
    icon:"🎬",
    title:"Video Editing & Post-Production",
    desc:"Professional video editing, colour grading, motion graphics, and delivery-ready output.",
    packages:[
      { name:"Basic Edit",      price:8000,  includes:["Raw footage editing","Basic colour grade","1 revision","Delivery in 5 days"] },
      { name:"Full Production", price:18000, includes:["Advanced colour grading","Motion graphics","Sound design","3 revisions","Delivery in 7 days"] },
      { name:"Premium Post",    price:35000, includes:["Full DI colour grade","Custom motion package","VFX integration","Unlimited revisions","Priority delivery 3 days"] },
    ]
  },
  {
    id:"content-strategy",
    icon:"📣",
    title:"Content Strategy",
    desc:"Data-driven content planning, audience mapping, platform strategy, and campaign roadmaps.",
    packages:[
      { name:"Strategy Session",   price:5000,  includes:["1-hour consultation","30-day content calendar","Platform recommendations"] },
      { name:"Monthly Strategy",   price:15000, includes:["Full audience analysis","3-month roadmap","Weekly check-ins","KPI dashboard setup"] },
      { name:"Brand Strategy Pack",price:35000, includes:["Complete brand content audit","6-month strategy","Content system design","Team training session"] },
    ]
  },
  {
    id:"graphic-design",
    icon:"🎨",
    title:"Graphic Design & Brand Identity",
    desc:"Logos, brand kits, social templates, ad creatives, and complete visual identity systems.",
    packages:[
      { name:"Social Pack",       price:6000,  includes:["10 social media templates","2 ad creatives","Source files included"] },
      { name:"Brand Kit",         price:18000, includes:["Logo design (3 concepts)","Complete brand guide","30 social templates","Business card & stationery"] },
      { name:"Full Identity",     price:45000, includes:["Full brand identity system","100+ asset library","Website UI design","Marketing collateral pack"] },
    ]
  },
  {
    id:"website",
    icon:"🌐",
    title:"Website Building",
    desc:"Landing pages, business websites, portfolios, and e-commerce stores built and deployed.",
    packages:[
      { name:"Landing Page",  price:12000, includes:["1-page website","Mobile responsive","Contact form","Deploy to domain"] },
      { name:"Business Site", price:28000, includes:["5-page website","CMS integration","SEO setup","3 months support"] },
      { name:"E-commerce",    price:65000, includes:["Full e-commerce store","Payment integration","Product management","6 months support"] },
    ]
  },
  {
    id:"marketing",
    icon:"📊",
    title:"Marketing Campaigns",
    desc:"Paid ads, organic campaigns, influencer coordination, and end-to-end marketing execution.",
    packages:[
      { name:"Campaign Setup",  price:10000, includes:["Ad account setup","1 campaign build","Audience targeting","7-day management"] },
      { name:"Growth Package",  price:25000, includes:["Multi-platform campaigns","A/B testing","Monthly reporting","30-day management"] },
      { name:"Full Marketing",  price:60000, includes:["Complete marketing strategy","All platforms","Influencer outreach","3-month management"] },
    ]
  },
  {
    id:"scripting",
    icon:"✍️",
    title:"Content Creation & Scripting",
    desc:"Brand video scripts, social media content, blog posts, ad copies, and creative direction.",
    packages:[
      { name:"Script Pack",       price:4000,  includes:["3 brand video scripts","Hook + CTA writing","Platform-specific adaptation"] },
      { name:"Content Bundle",    price:12000, includes:["10 scripts","30 social captions","5 blog outlines","Ad copy variations"] },
      { name:"Creative Direction",price:30000, includes:["Full content system","Ongoing script library","Monthly creative sessions","Team content workshops"] },
    ]
  },
];

const STEPS = ["Choose Service", "Select Package", "Your Details", "Confirm & Pay"];

function loadRazorpay() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) { resolve(); return; }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Razorpay failed to load"));
    document.head.appendChild(s);
  });
}

export default function BookServices({ profile }) {
  const [step,     setStep]     = useState(0);
  const [service,  setService]  = useState(null);
  const [pkg,      setPkg]      = useState(null);
  const [form,     setForm]     = useState({ name:profile?.full_name||"", email:profile?.email||"", phone:"", company:"", note:"" });
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);

  const selected = SERVICES.find(s=>s.id===service);
  const selPkg   = selected?.packages.find(p=>p.name===pkg);

  const pay = async () => {
    if (!selPkg) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/subscription/create-order`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ amount:selPkg.price, currency:"INR", plan:`units_${service}_${pkg}` })
      });
      const order = await res.json();

      const rzp = new window.Razorpay({
        key:"rzp_live_SM1s5O14Mm50mV",
        amount: order.amount,
        currency:"INR",
        order_id: order.id,
        name:"The Units — Nugens",
        description:`${selected?.title} · ${pkg}`,
        theme:{ color:PINK },
        prefill:{ name:form.name, email:form.email, contact:form.phone },
        handler: async (response) => {
          await fetch(`${API}/api/subscription/verify`, {
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify({ ...response, plan:`units_${service}`, userId:profile?.id })
          });
          setSuccess(true);
          setLoading(false);
        },
        modal:{ ondismiss:()=>setLoading(false) }
      });
      rzp.open();
    } catch(e) {
      console.error(e);
      setLoading(false);
    }
  };

  const S = {
    page:   { minHeight:"100vh", background:LIGHT, padding:"36px 44px", fontFamily:"'Plus Jakarta Sans',sans-serif" },
    card:   { background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:24, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" },
    btn:    { padding:"12px 28px", background:PINK, color:"#fff", border:"none", borderRadius:10, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" },
    ghost:  { padding:"11px 24px", background:"#fff", color:MUTED, border:`1px solid ${BORDER}`, borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" },
    inp:    { width:"100%", border:`1px solid ${BORDER}`, borderRadius:9, padding:"10px 13px", fontSize:13, color:TEXT, fontFamily:"inherit", outline:"none", background:"#fafafa", boxSizing:"border-box", marginBottom:14 },
    check:  { fontSize:12, color:MUTED, display:"flex", gap:7, marginBottom:7 },
  };

  if (success) return (
    <div style={{ ...S.page, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ ...S.card, maxWidth:480, textAlign:"center", padding:48 }}>
        <div style={{ fontSize:56, marginBottom:20 }}>🎉</div>
        <div style={{ fontSize:22, fontWeight:800, color:TEXT, marginBottom:8 }}>Booking Confirmed!</div>
        <div style={{ fontSize:14, color:MUTED, lineHeight:1.7, marginBottom:28 }}>
          Your booking for <strong>{selected?.title} — {pkg}</strong> has been received.<br/>
          Our team will reach out within 24 hours to kick things off.
        </div>
        <button onClick={()=>{setSuccess(false);setStep(0);setService(null);setPkg(null);}} style={S.btn}>Book Another Service</button>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>
      <script src="https://checkout.razorpay.com/v1/checkout.js" />

      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:22, fontWeight:800, color:TEXT, letterSpacing:"-0.04em", marginBottom:4 }}>◈ Book Our Services</div>
        <div style={{ fontSize:13, color:MUTED }}>Professional content creation, design, web, and marketing — all under one roof</div>
      </div>

      {/* Stepper */}
      <div style={{ display:"flex", gap:0, marginBottom:32 }}>
        {STEPS.map((s,i)=>(
          <div key={s} style={{ display:"flex", alignItems:"center", gap:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:26, height:26, borderRadius:"50%", background:step>=i?PINK:"#e5e7eb", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:step>=i?"#fff":"#9ca3af" }}>{i+1}</div>
              <span style={{ fontSize:12, fontWeight:step===i?700:500, color:step===i?TEXT:MUTED }}>{s}</span>
            </div>
            {i<STEPS.length-1 && <div style={{ width:32, height:1, background:"#e5e7eb", margin:"0 8px" }}/>}
          </div>
        ))}
      </div>

      {/* Step 0 — Choose service */}
      {step===0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
          {SERVICES.map(s => (
            <div key={s.id} onClick={()=>{setService(s.id);setStep(1);}} style={{ ...S.card, cursor:"pointer", transition:"all 0.2s", border:`1px solid ${service===s.id?PINK:BORDER}` }}
              onMouseOver={e=>{e.currentTarget.style.borderColor=PINK+"60";e.currentTarget.style.boxShadow="0 4px 20px rgba(232,24,93,0.08)";}}
              onMouseOut={e=>{e.currentTarget.style.borderColor=BORDER;e.currentTarget.style.boxShadow="0 1px 3px rgba(0,0,0,0.04)";}}
            >
              <div style={{ fontSize:28, marginBottom:12 }}>{s.icon}</div>
              <div style={{ fontSize:15, fontWeight:700, color:TEXT, marginBottom:6 }}>{s.title}</div>
              <div style={{ fontSize:12, color:MUTED, lineHeight:1.6, marginBottom:14 }}>{s.desc}</div>
              <div style={{ fontSize:12, color:PINK, fontWeight:600 }}>From ₹{Math.min(...s.packages.map(p=>p.price)).toLocaleString()} →</div>
            </div>
          ))}
        </div>
      )}

      {/* Step 1 — Select package */}
      {step===1 && selected && (
        <div style={{ maxWidth:800 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:24 }}>
            <span style={{ fontSize:24 }}>{selected.icon}</span>
            <div style={{ fontSize:18, fontWeight:700, color:TEXT }}>{selected.title}</div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:24 }}>
            {selected.packages.map(p => (
              <div key={p.name} onClick={()=>{setPkg(p.name);}} style={{ ...S.card, cursor:"pointer", border:`1px solid ${pkg===p.name?PINK:BORDER}`, transition:"all 0.15s", position:"relative" }}>
                {pkg===p.name && <div style={{ position:"absolute", top:-10, left:"50%", transform:"translateX(-50%)", background:PINK, color:"#fff", fontSize:9, fontWeight:800, padding:"3px 12px", borderRadius:20, textTransform:"uppercase", letterSpacing:"0.06em" }}>Selected</div>}
                <div style={{ fontSize:16, fontWeight:800, color:TEXT, marginBottom:4 }}>{p.name}</div>
                <div style={{ fontSize:24, fontWeight:800, color:PINK, marginBottom:16 }}>₹{p.price.toLocaleString()}</div>
                {p.includes.map((inc,i)=>(
                  <div key={i} style={S.check}><span style={{color:PINK,flexShrink:0}}>✓</span>{inc}</div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:12 }}>
            <button onClick={()=>setStep(0)} style={S.ghost}>← Back</button>
            <button onClick={()=>pkg&&setStep(2)} disabled={!pkg} style={{ ...S.btn, opacity:pkg?1:0.4 }}>Continue →</button>
          </div>
        </div>
      )}

      {/* Step 2 — Details */}
      {step===2 && (
        <div style={{ maxWidth:520 }}>
          <div style={{ fontSize:16, fontWeight:700, color:TEXT, marginBottom:20 }}>Tell us about your project</div>
          {[
            { key:"name",    label:"Your Name",     type:"text",  ph:"Full name" },
            { key:"email",   label:"Email",          type:"email", ph:"your@email.com" },
            { key:"phone",   label:"Phone / WhatsApp",type:"tel",  ph:"+91 XXXXXXXXXX" },
            { key:"company", label:"Company / Brand",type:"text",  ph:"Your brand name" },
          ].map(f=>(
            <div key={f.key}>
              <div style={{ fontSize:11, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>{f.label}</div>
              <input type={f.type} value={form[f.key]} onChange={e=>setForm(v=>({...v,[f.key]:e.target.value}))} placeholder={f.ph} style={S.inp} />
            </div>
          ))}
          <div style={{ fontSize:11, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>Project Notes (optional)</div>
          <textarea value={form.note} onChange={e=>setForm(v=>({...v,note:e.target.value}))} placeholder="Any specific requirements, deadlines, or reference content?" style={{ ...S.inp, minHeight:80, resize:"vertical" }} />
          <div style={{ display:"flex", gap:12, marginTop:8 }}>
            <button onClick={()=>setStep(1)} style={S.ghost}>← Back</button>
            <button onClick={()=>form.name&&form.email&&setStep(3)} disabled={!form.name||!form.email} style={{ ...S.btn, opacity:form.name&&form.email?1:0.4 }}>Review Booking →</button>
          </div>
        </div>
      )}

      {/* Step 3 — Confirm */}
      {step===3 && (
        <div style={{ maxWidth:520 }}>
          <div style={{ ...S.card, marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:16 }}>Booking Summary</div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontSize:13, color:MUTED }}>Service</span>
              <span style={{ fontSize:13, fontWeight:600, color:TEXT }}>{selected?.title}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontSize:13, color:MUTED }}>Package</span>
              <span style={{ fontSize:13, fontWeight:600, color:TEXT }}>{pkg}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontSize:13, color:MUTED }}>Name</span>
              <span style={{ fontSize:13, fontWeight:600, color:TEXT }}>{form.name}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontSize:13, color:MUTED }}>Email</span>
              <span style={{ fontSize:13, fontWeight:600, color:TEXT }}>{form.email}</span>
            </div>
            <div style={{ height:1, background:"#f3f4f6", margin:"14px 0" }}/>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <span style={{ fontSize:15, fontWeight:700, color:TEXT }}>Total</span>
              <span style={{ fontSize:18, fontWeight:800, color:PINK }}>₹{selPkg?.price.toLocaleString()}</span>
            </div>
            <div style={{ fontSize:11, color:MUTED, marginTop:4, textAlign:"right" }}>+ GST applicable</div>
          </div>

          <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:10, padding:"12px 16px", marginBottom:20 }}>
            <div style={{ fontSize:12, color:"#1d4ed8", lineHeight:1.6 }}>
              ✓ After payment, our team will contact you within 24 hours to begin your project.
            </div>
          </div>

          <div style={{ display:"flex", gap:12 }}>
            <button onClick={()=>setStep(2)} style={S.ghost}>← Back</button>
            <button onClick={pay} disabled={loading} style={{ ...S.btn, flex:1, opacity:loading?0.6:1 }}>
              {loading ? "Processing..." : `Pay ₹${selPkg?.price.toLocaleString()} →`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}