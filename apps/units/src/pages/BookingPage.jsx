import React, { useState } from "react";

const GOLD = "#d97706";
const PINK = "#e8185d";
const B    = "#1c1a14";

const SERVICES = ["Wedding Photography","Pre-Wedding Shoot","Wedding Videography","Corporate / Brand Shoot","Product Photography","Video Editing","Album Design","Full Wedding Package"];
const LOCATIONS = ["Chennai","Coimbatore","Bangalore","Hyderabad","Mumbai","Kochi","Other"];
const DURATIONS = ["2 hours","4 hours","6 hours","8 hours (Full day)","Multi-day"];

const STEPS = ["Service","Details","Schedule","Confirm"];

export default function BookingPage() {
  const [step, setStep]         = useState(0);
  const [service, setService]   = useState("");
  const [name, setName]         = useState("");
  const [phone, setPhone]       = useState("");
  const [email, setEmail]       = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate]         = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes]       = useState("");
  const [done, setDone]         = useState(false);

  const canNext = [
    !!service,
    name && phone && email,
    location && date && duration,
    true
  ];

  const submit = () => setDone(true);

  if (done) return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", minHeight:"100vh", background:"#0a0906", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ textAlign:"center", maxWidth:400 }}>
        <div style={{ fontSize:48, marginBottom:20 }}>✦</div>
        <h2 style={{ fontWeight:800, fontSize:24, color:"#e5c97e", letterSpacing:"-0.03em", marginBottom:10 }}>Booking Request Sent!</h2>
        <p style={{ fontSize:14, color:"#6b5a30", lineHeight:1.7, marginBottom:28 }}>Thank you, {name.split(" ")[0]}! We've received your booking request for <strong style={{ color:"#c8b060" }}>{service}</strong>. Our team will contact you within 24 hours to confirm.</p>
        <button onClick={() => { setDone(false); setStep(0); setService(""); setName(""); setPhone(""); setEmail(""); setDate(""); }} style={{ padding:"11px 28px", background:GOLD, color:"#fff", border:"none", borderRadius:10, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
          Book another →
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", padding:"32px 28px 80px", background:"#0a0906", minHeight:"100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .u-input { width:100%; padding:11px 14px; background:#0d0c09; border:1px solid ${B}; border-radius:9px; color:#c8b060; font-size:14px; font-family:'Plus Jakarta Sans',sans-serif; outline:none; }
        .u-input:focus { border-color:${GOLD}50; }
        .u-input::placeholder { color:#2a2618; }
        .svc-pick { padding:14px 18px; background:#0d0c09; border:1px solid ${B}; border-radius:10px; cursor:pointer; transition:all 0.15s; font-family:'Plus Jakarta Sans',sans-serif; text-align:left; width:100%; }
        .svc-pick:hover { border-color:#2a2618; }
        .svc-pick.sel { border-color:${GOLD}50; background:#1a1508; }
        .next-btn { padding:12px 32px; background:${GOLD}; color:#fff; border:none; border-radius:10px; font-size:14.5px; font-weight:700; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; transition:opacity 0.15s; }
        .next-btn:disabled { opacity:0.3; cursor:not-allowed; }
        .next-btn:not(:disabled):hover { opacity:0.88; }
        @media (max-width:600px) { .svc-g { grid-template-columns:1fr !important; } .two-g { grid-template-columns:1fr !important; } }
      `}</style>

      <div style={{ maxWidth:680, margin:"0 auto" }}>
        <div style={{ marginBottom:36 }}>
          <h1 style={{ fontWeight:800, fontSize:"clamp(20px,2.5vw,26px)", letterSpacing:"-0.03em", color:"#e5c97e", marginBottom:4 }}>Book a Shoot</h1>
          <p style={{ fontSize:13.5, color:"#4a4030" }}>Fill in the details below and we'll confirm your booking within 24 hours.</p>
        </div>

        {/* Step indicator */}
        <div style={{ display:"flex", gap:0, marginBottom:40 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
              <div style={{ display:"flex", alignItems:"center", width:"100%" }}>
                {i > 0 && <div style={{ flex:1, height:2, background: i <= step ? GOLD : B }} />}
                <div style={{ width:28, height:28, borderRadius:"50%", background: i < step ? GOLD : i === step ? `${GOLD}25` : "#0d0c09", border:`2px solid ${i <= step ? GOLD : B}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color: i <= step ? (i < step ? "#fff" : GOLD) : "#3a3020", flexShrink:0 }}>
                  {i < step ? "✓" : i + 1}
                </div>
                {i < STEPS.length - 1 && <div style={{ flex:1, height:2, background: i < step ? GOLD : B }} />}
              </div>
              <span style={{ fontSize:11, fontWeight:600, color: i === step ? GOLD : "#3a3020" }}>{s}</span>
            </div>
          ))}
        </div>

        {/* Step 0: Service */}
        {step === 0 && (
          <div>
            <h3 style={{ fontWeight:700, fontSize:16, color:"#c8b060", marginBottom:20, letterSpacing:"-0.02em" }}>What service do you need?</h3>
            <div className="svc-g" style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 }}>
              {SERVICES.map(s => (
                <button key={s} className={`svc-pick ${service===s?"sel":""}`} onClick={() => setService(s)}>
                  <div style={{ fontSize:13.5, fontWeight:600, color: service===s ? "#e5c97e" : "#6b5a30" }}>{s}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Contact details */}
        {step === 1 && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <h3 style={{ fontWeight:700, fontSize:16, color:"#c8b060", marginBottom:4, letterSpacing:"-0.02em" }}>Your contact details</h3>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#4a4030", display:"block", marginBottom:5 }}>Full name</label>
              <input className="u-input" value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name" />
            </div>
            <div className="two-g" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:"#4a4030", display:"block", marginBottom:5 }}>Phone number</label>
                <input className="u-input" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+91 98765 43210" />
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:"#4a4030", display:"block", marginBottom:5 }}>Email</label>
                <input className="u-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com" />
              </div>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#4a4030", display:"block", marginBottom:5 }}>Additional notes</label>
              <textarea className="u-input" rows={3} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Venue name, specific requirements, theme, references..." style={{ resize:"vertical" }} />
            </div>
          </div>
        )}

        {/* Step 2: Schedule */}
        {step === 2 && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <h3 style={{ fontWeight:700, fontSize:16, color:"#c8b060", marginBottom:4, letterSpacing:"-0.02em" }}>Shoot schedule & location</h3>
            <div className="two-g" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:"#4a4030", display:"block", marginBottom:5 }}>Shoot date</label>
                <input className="u-input" type="date" value={date} onChange={e=>setDate(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:"#4a4030", display:"block", marginBottom:5 }}>Duration</label>
                <select className="u-input" value={duration} onChange={e=>setDuration(e.target.value)} style={{ cursor:"pointer" }}>
                  <option value="">Select duration</option>
                  {DURATIONS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#4a4030", display:"block", marginBottom:5 }}>City / Location</label>
              <select className="u-input" value={location} onChange={e=>setLocation(e.target.value)} style={{ cursor:"pointer" }}>
                <option value="">Select city</option>
                {LOCATIONS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div style={{ background:"#0d0c09", border:`1px solid ${B}`, borderRadius:14, padding:28 }}>
            <h3 style={{ fontWeight:700, fontSize:16, color:"#e5c97e", marginBottom:20, letterSpacing:"-0.02em" }}>Confirm your booking</h3>
            {[
              { label:"Service",  value: service  },
              { label:"Name",     value: name     },
              { label:"Phone",    value: phone    },
              { label:"Email",    value: email    },
              { label:"Date",     value: date     },
              { label:"Duration", value: duration },
              { label:"Location", value: location },
              notes && { label:"Notes", value: notes },
            ].filter(Boolean).map(row => (
              <div key={row.label} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid #1a1508` }}>
                <span style={{ fontSize:13, color:"#4a4030", fontWeight:600 }}>{row.label}</span>
                <span style={{ fontSize:13, color:"#c8b060", fontWeight:600, textAlign:"right", maxWidth:260 }}>{row.value}</span>
              </div>
            ))}
            <p style={{ fontSize:12.5, color:"#4a4030", marginTop:20, lineHeight:1.65 }}>
              By submitting, our team will review your request and contact you within 24 hours to confirm the booking and discuss pricing.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:32 }}>
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)} style={{ padding:"11px 24px", background:"transparent", color:"#4a4030", border:`1px solid ${B}`, borderRadius:9, fontSize:14, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              ← Back
            </button>
          ) : <div />}
          {step < 3 ? (
            <button className="next-btn" onClick={() => setStep(s => s + 1)} disabled={!canNext[step]}>
              Continue →
            </button>
          ) : (
            <button className="next-btn" onClick={submit}>
              Confirm Booking ✓
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
