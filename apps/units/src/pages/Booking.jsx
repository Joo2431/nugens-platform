import React, { useState } from "react";

const GOLD = "#d4a843";
const PINK = "#e8185d";
const B    = "#1c1a14";

const SERVICE_TYPES = ["Wedding Film","Wedding Photography","Pre-Wedding Shoot","Corporate Event","Brand Video","Editing / Post Production","Full Wedding Package (Photo + Video)"];
const PACKAGES_MAP  = {
  "Wedding Film":          ["Essential — ₹45,000","Premium — ₹85,000","Signature — ₹1,40,000"],
  "Wedding Photography":   ["Classic — ₹35,000","Deluxe — ₹65,000","Elite — ₹1,10,000"],
  "Pre-Wedding Shoot":     ["Story — ₹18,000","Cinematic — ₹35,000","Destination — ₹75,000"],
  "Corporate Event":       ["Event — ₹25,000","Brand Film — ₹60,000","Campaign — ₹1,20,000"],
  "Brand Video":           ["Event — ₹25,000","Brand Film — ₹60,000","Campaign — ₹1,20,000"],
  "Editing / Post Production":["Basic Edit — ₹8,000","Full Grade — ₹18,000","Premium Post — ₹35,000"],
  "Full Wedding Package (Photo + Video)":["Standard — ₹95,000","Premium — ₹1,60,000","Signature — ₹2,40,000"],
};
const LOCATIONS = ["Coimbatore","Chennai","Bangalore","Kochi","Hyderabad","Mumbai","Delhi","Destination / Custom"];

const STEPS = ["Service","Details","Date & Location","Review"];

export default function Booking() {
  const [step, setStep]       = useState(0);
  const [service, setService] = useState("");
  const [pkg, setPkg]         = useState("");
  const [name, setName]       = useState("");
  const [phone, setPhone]     = useState("");
  const [email, setEmail]     = useState("");
  const [date, setDate]       = useState("");
  const [location, setLocation]   = useState("Coimbatore");
  const [notes, setNotes]         = useState("");
  const [submitted, setSubmitted] = useState(false);

  const pkgOptions = PACKAGES_MAP[service] || [];

  const canNext = () => {
    if (step===0) return !!service && !!pkg;
    if (step===1) return !!name && !!phone && !!email;
    if (step===2) return !!date && !!location;
    return true;
  };

  const submit = () => setSubmitted(true);

  if (submitted) return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", padding:"80px 28px", background:"#0a0805", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center", maxWidth:480 }}>
        <div style={{ fontSize:48, marginBottom:20 }}>✦</div>
        <h2 style={{ fontWeight:800, fontSize:28, color:"#e8d5a0", letterSpacing:"-0.03em", marginBottom:12 }}>Booking received!</h2>
        <p style={{ fontSize:14.5, color:"#6a5a30", lineHeight:1.7, marginBottom:28 }}>
          Thank you, {name}. We've received your enquiry for <strong style={{ color:GOLD }}>{service}</strong> on {date}. Our team will get back to you within 24 hours to confirm availability and share your personalised quote.
        </p>
        <button onClick={()=>{ setSubmitted(false); setStep(0); setService(""); setPkg(""); setName(""); setPhone(""); setEmail(""); setDate(""); setNotes(""); }} style={{ padding:"11px 28px", background:GOLD, color:"#0a0805", border:"none", borderRadius:9, fontSize:14, fontWeight:800, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
          Book another shoot →
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", padding:"32px 28px 80px", background:"#0a0805", minHeight:"100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .u-input{width:100%;padding:11px 14px;background:#0f0c08;border:1px solid ${B};border-radius:9px;color:#c8b87a;font-size:14px;font-family:'Plus Jakarta Sans',sans-serif;outline:none;transition:border-color 0.15s;}
        .u-input:focus{border-color:${GOLD}50;}
        .u-input::placeholder{color:#2a2010;}
        .svc-opt{padding:14px 16px;border:1px solid ${B};border-radius:10px;cursor:pointer;transition:all 0.15s;background:#0f0c08;}
        .svc-opt:hover{border-color:#2a2416;}
        .svc-opt.on{border-color:${GOLD}60;background:#150f04;}
        .step-btn{padding:11px 28px;border-radius:9px;font-size:14px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.15s;}
      `}</style>

      <div style={{ maxWidth:640, margin:"0 auto" }}>
        <div style={{ marginBottom:36 }}>
          <h1 style={{ fontWeight:800, fontSize:"clamp(20px,2.5vw,26px)", letterSpacing:"-0.03em", color:"#e8d5a0", marginBottom:4 }}>Book a Shoot</h1>
          <p style={{ fontSize:13.5, color:"#4a4030" }}>We'll get back within 24 hours to confirm your slot.</p>
        </div>

        {/* Step indicator */}
        <div style={{ display:"flex", gap:0, marginBottom:36 }}>
          {STEPS.map((s,i)=>(
            <div key={s} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", position:"relative" }}>
              {i>0 && <div style={{ position:"absolute", top:14, right:"50%", width:"100%", height:2, background:i<=step?GOLD:B, zIndex:0 }} />}
              <div style={{ width:28, height:28, borderRadius:"50%", background:i===step?GOLD:i<step?"#2a1f04":B, border:`2px solid ${i<=step?GOLD:B}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:i===step?"#0a0805":i<step?GOLD:"#3a3020", zIndex:1, position:"relative" }}>
                {i<step?"✓":i+1}
              </div>
              <div style={{ fontSize:11, fontWeight:600, color:i===step?GOLD:"#4a4030", marginTop:6, textAlign:"center" }}>{s}</div>
            </div>
          ))}
        </div>

        {/* Step 0 — Service */}
        {step===0 && (
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:"#6a5a30", marginBottom:16 }}>What are you looking for?</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:24 }}>
              {SERVICE_TYPES.map(s=>(
                <div key={s} className={`svc-opt${service===s?" on":""}`} onClick={()=>{ setService(s); setPkg(""); }}>
                  <div style={{ fontSize:13, fontWeight:600, color:service===s?"#c8b87a":"#5a5040", lineHeight:1.4 }}>{s}</div>
                </div>
              ))}
            </div>
            {service && pkgOptions.length > 0 && (
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:"#6a5a30", marginBottom:12 }}>Select a package</div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {pkgOptions.map(p=>(
                    <div key={p} className={`svc-opt${pkg===p?" on":""}`} onClick={()=>setPkg(p)}>
                      <div style={{ fontSize:13.5, fontWeight:600, color:pkg===p?GOLD:"#5a5040" }}>{p}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 1 — Details */}
        {step===1 && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#6a5a30", marginBottom:4 }}>Your details</div>
            {[
              { label:"Full name",    val:name,  set:setName,  ph:"Your name",        type:"text"  },
              { label:"Phone number", val:phone, set:setPhone, ph:"+91 98765 43210",   type:"tel"   },
              { label:"Email",        val:email, set:setEmail, ph:"you@email.com",     type:"email" },
            ].map(f=>(
              <div key={f.label}>
                <label style={{ fontSize:12, fontWeight:600, color:"#4a4030", display:"block", marginBottom:6 }}>{f.label}</label>
                <input className="u-input" type={f.type} value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph} />
              </div>
            ))}
          </div>
        )}

        {/* Step 2 — Date & Location */}
        {step===2 && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#6a5a30", marginBottom:4 }}>When & Where</div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#4a4030", display:"block", marginBottom:6 }}>Event date</label>
              <input className="u-input" type="date" value={date} onChange={e=>setDate(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#4a4030", display:"block", marginBottom:6 }}>Location</label>
              <select className="u-input" value={location} onChange={e=>setLocation(e.target.value)} style={{ cursor:"pointer" }}>
                {LOCATIONS.map(l=><option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#4a4030", display:"block", marginBottom:6 }}>Additional notes (optional)</label>
              <textarea className="u-input" rows={3} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Venue, timing, theme, special requests..." style={{ resize:"vertical" }} />
            </div>
          </div>
        )}

        {/* Step 3 — Review */}
        {step===3 && (
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:"#6a5a30", marginBottom:16 }}>Review your booking</div>
            <div style={{ background:"#0f0c08", border:`1px solid ${B}`, borderRadius:12, padding:22, display:"flex", flexDirection:"column", gap:12 }}>
              {[
                { label:"Service",   value:service  },
                { label:"Package",   value:pkg      },
                { label:"Name",      value:name     },
                { label:"Phone",     value:phone    },
                { label:"Email",     value:email    },
                { label:"Date",      value:date     },
                { label:"Location",  value:location },
                notes && { label:"Notes", value:notes },
              ].filter(Boolean).map(f=>(
                <div key={f.label} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${B}` }}>
                  <span style={{ fontSize:12.5, color:"#4a4030", fontWeight:600 }}>{f.label}</span>
                  <span style={{ fontSize:13, color:"#c8b87a", fontWeight:500, maxWidth:280, textAlign:"right" }}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display:"flex", gap:10, marginTop:32, justifyContent:"space-between" }}>
          {step>0
            ? <button className="step-btn" onClick={()=>setStep(s=>s-1)} style={{ background:"transparent", color:"#5a5040", border:`1px solid ${B}` }}>← Back</button>
            : <div />
          }
          {step<3
            ? <button className="step-btn" onClick={()=>setStep(s=>s+1)} disabled={!canNext()} style={{ background:canNext()?GOLD:"#2a1f04", color:canNext()?"#0a0805":"#4a4030", border:"none", opacity:canNext()?1:0.6 }}>Continue →</button>
            : <button className="step-btn" onClick={submit} style={{ background:GOLD, color:"#0a0805", border:"none" }}>Confirm booking ✦</button>
          }
        </div>
      </div>
    </div>
  );
}
