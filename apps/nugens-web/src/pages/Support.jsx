import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

const PINK = "#e8185d";
const B    = "#f0f0f0";

function useInView(t = 0.1) {
  const ref = useRef(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold: t });
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, [t]);
  return [ref, v];
}
function Reveal({ children, delay = 0, style = {} }) {
  const [ref, v] = useInView();
  return (
    <div ref={ref} style={{ opacity:v?1:0, transform:v?"none":"translateY(16px)",
      transition:`opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`, ...style }}>
      {children}
    </div>
  );
}

const FAQS = [
  {
    cat: "Account & Login",
    items: [
      { q:"How do I sign in to Nugens?",
        a:"Go to nugens.in.net/auth to sign in with Google or email. One account gives you access to all Nugens products — Gen-E AI, HyperX, DigiHub and Units." },
      { q:"I forgot my password. How do I reset it?",
        a:"On the sign-in page, click 'Forgot password?' and enter your email. You'll receive a reset link within 2 minutes. Check your spam folder if it doesn't arrive." },
      { q:"Can I use one account across all products?",
        a:"Yes — that's exactly how Nugens works. One login at nugens.in.net gives you access to every product. Your plan and subscription are shared across all apps." },
      { q:"How do I change my email or profile details?",
        a:"Go to your Dashboard at nugens.in.net/dashboard and click your profile. You can update your name and preferences there." },
    ]
  },
  {
    cat: "Billing & Subscriptions",
    items: [
      { q:"What payment methods do you accept?",
        a:"We accept all major credit/debit cards, UPI, net banking, and wallets via Razorpay. International cards are supported." },
      { q:"Will my subscription work across all Nugens products?",
        a:"Yes. A subscription taken from Nugens is automatically active on Gen-E AI, HyperX, DigiHub and Units — no separate subscriptions needed." },
      { q:"How do I cancel my subscription?",
        a:"Go to Dashboard → Manage Plan → Cancel subscription. You'll keep access until the end of your billing period. No partial refunds for mid-cycle cancellations." },
      { q:"I was charged but my plan didn't upgrade. What do I do?",
        a:"This is rare but can happen. Email support@nugens.in with your payment ID from Razorpay and we'll resolve it within 24 hours." },
      { q:"Do you offer refunds?",
        a:"Yes — if you contact us within 7 days of a charge and haven't used the premium features, we'll issue a full refund. Contact support@nugens.in." },
    ]
  },
  {
    cat: "Gen-E AI",
    items: [
      { q:"Why can't I send more messages on the free plan?",
        a:"Free accounts get 20 questions/month. Upgrade to Pro for unlimited questions. Your count resets on the 1st of every month." },
      { q:"Can Gen-E AI generate and download my resume as PDF?",
        a:"Yes — Pro and above users can download AI-generated resumes as PDF. Free users see the resume text but can't download." },
      { q:"My chat history disappeared. What happened?",
        a:"Chat sessions are saved to your account when you're signed in. If you were browsing in incognito or logged out, sessions aren't saved. Sign in to preserve your history." },
    ]
  },
  {
    cat: "HyperX",
    items: [
      { q:"How do I access courses?",
        a:"Visit hyperx.nugens.in.net, sign in, and go to Courses. Free users get access to 3 free courses. Pro users unlock the full library." },
      { q:"Why is the video not playing?",
        a:"Try refreshing the page. If it persists, check your internet connection. Video issues are usually resolved within minutes — if not, contact support." },
      { q:"How do I earn a certificate?",
        a:"Complete all lessons in a course and pass the final quiz. Your certificate appears in your profile and can be downloaded as a PDF." },
    ]
  },
  {
    cat: "DigiHub & Units",
    items: [
      { q:"What services does DigiHub offer?",
        a:"DigiHub offers brand tools, content planning, AI-generated marketing content, and a talent marketplace for businesses. Access it at digihub.nugens.in.net." },
      { q:"How do I book a shoot or event with Units?",
        a:"Visit units.nugens.in.net, browse our packages, and use the booking form. Our team will confirm within 24 hours." },
      { q:"Can I get a custom quote for large events?",
        a:"Yes — fill out the contact form on the Units page or email hello@nugens.in with details about your event for a custom quote." },
    ]
  },
];

const TOPICS = [
  { icon:"🔑", label:"Account & Login",       id:"account"  },
  { icon:"💳", label:"Billing & Plans",        id:"billing"  },
  { icon:"🤖", label:"Gen-E AI",               id:"gene"     },
  { icon:"📚", label:"HyperX Learning",        id:"hyperx"   },
  { icon:"🎯", label:"DigiHub & Units",         id:"units"    },
  { icon:"📝", label:"Submit a ticket",         id:"ticket"   },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom:`1px solid ${B}`, overflow:"hidden" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"16px 0", background:"none", border:"none", cursor:"pointer",
        textAlign:"left", fontFamily:"'Plus Jakarta Sans',sans-serif",
      }}>
        <span style={{ fontSize:14, fontWeight:600, color:"#0a0a0a", paddingRight:16 }}>{q}</span>
        <span style={{ fontSize:18, color:"#ccc", flexShrink:0, transition:"transform 0.2s",
          transform:open?"rotate(45deg)":"none" }}>+</span>
      </button>
      <div style={{ maxHeight:open?300:0, overflow:"hidden", transition:"max-height 0.3s ease" }}>
        <p style={{ fontSize:13.5, color:"#6b7280", lineHeight:1.75, paddingBottom:18 }}>{a}</p>
      </div>
    </div>
  );
}

export default function Support() {
  const [activeCat, setActiveCat]   = useState(0);
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [topic,   setTopic]   = useState("General");
  const [msg,     setMsg]     = useState("");
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");

  // Pre-fill email if logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data:{ session } }) => {
      if (session?.user) {
        setEmail(session.user.email || "");
        setName(session.user.user_metadata?.full_name || "");
      }
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !msg.trim()) { setError("Please fill in all required fields."); return; }
    setSending(true); setError("");
    try {
      // Log to Supabase support_requests table (create if needed)
      const { error: dbErr } = await supabase.from("support_requests").insert({
        name: name.trim(), email: email.trim(),
        topic, message: msg.trim(), status: "open",
      });
      if (dbErr) throw new Error(dbErr.message);
      setSent(true);
    } catch (err) {
      // Fallback: mailto if DB not set up yet
      window.location.href = `mailto:support@nugens.in?subject=Support: ${topic}&body=Name: ${name}%0AEmail: ${email}%0A%0A${msg}`;
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  const inStyle = {
    width:"100%", padding:"10px 14px", border:`1.5px solid ${B}`,
    borderRadius:9, fontSize:13.5, outline:"none", fontFamily:"'Plus Jakarta Sans',sans-serif",
    transition:"border-color 0.15s", background:"#fff", color:"#0a0a0a",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'Plus Jakarta Sans',sans-serif; background:#fff; color:#0a0a0a; -webkit-font-smoothing:antialiased; }
        .sup-topic {
          display:flex; flex-direction:column; align-items:center; gap:8px;
          padding:18px 12px; border-radius:12px; border:1.5px solid ${B};
          background:#fff; cursor:pointer; transition:all 0.15s; text-align:center;
          font-family:'Plus Jakarta Sans',sans-serif;
        }
        .sup-topic:hover { border-color:#fcc; background:#fff5f7; }
        .sup-topic.active { border-color:${PINK}; background:#fff0f4; }
        .chip { display:inline-flex; align-items:center; gap:6px; padding:4px 12px;
          border-radius:6px; border:1px solid ${B}; font-size:11.5px; font-weight:500;
          color:#6b7280; background:#fff; letter-spacing:0.01em; }
        .chip-pink { background:#fef2f5; border-color:#fcc8d6; color:${PINK}; }
        .cat-tab {
          padding:8px 16px; border-radius:7px; font-size:13px; font-weight:600;
          cursor:pointer; border:none; transition:all 0.15s; white-space:nowrap;
          font-family:'Plus Jakarta Sans',sans-serif;
        }
      `}</style>

      {/* Hero */}
      <section style={{ padding:"72px 24px 56px", textAlign:"center", borderBottom:`1px solid ${B}` }}>
        <Reveal>
          <span className="chip chip-pink" style={{ marginBottom:16 }}>Support</span>
          <h1 style={{ fontWeight:800, fontSize:"clamp(28px,4vw,46px)",
            letterSpacing:"-0.035em", color:"#0a0a0a", marginTop:14, marginBottom:14, lineHeight:1.15 }}>
            How can we help you?
          </h1>
          <p style={{ fontSize:15, color:"#6b7280", maxWidth:440, margin:"0 auto 32px", lineHeight:1.7 }}>
            Find answers in our FAQ or reach out directly. We typically respond within 24 hours.
          </p>

          {/* Search bar (visual) */}
          <div style={{ maxWidth:480, margin:"0 auto", position:"relative" }}>
            <input placeholder="Search for help…" style={{
              width:"100%", padding:"14px 20px 14px 48px", border:`1.5px solid ${B}`,
              borderRadius:12, fontSize:14, outline:"none", background:"#fff",
              fontFamily:"'Plus Jakarta Sans',sans-serif", color:"#0a0a0a",
            }}
            onFocus={e => e.target.style.borderColor = PINK}
            onBlur={e => e.target.style.borderColor = B}
            />
            <span style={{ position:"absolute", left:16, top:"50%", transform:"translateY(-50%)", fontSize:18, color:"#ccc" }}>🔍</span>
          </div>
        </Reveal>
      </section>

      {/* Topic shortcuts */}
      <section style={{ padding:"48px 24px 40px", borderBottom:`1px solid ${B}` }}>
        <div style={{ maxWidth:900, margin:"0 auto" }}>
          <Reveal>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:12 }}>
              {TOPICS.map((t, i) => (
                <button key={t.id} className={`sup-topic${activeCat === i ? " active" : ""}`}
                  onClick={() => { setActiveCat(i); if(t.id==="ticket") document.getElementById("ticket-form")?.scrollIntoView({behavior:"smooth"}); }}>
                  <span style={{ fontSize:22 }}>{t.icon}</span>
                  <span style={{ fontSize:12, fontWeight:600, color:"#374151" }}>{t.label}</span>
                </button>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding:"56px 24px 64px", background:"#fafafa", borderBottom:`1px solid ${B}` }}>
        <div style={{ maxWidth:760, margin:"0 auto" }}>
          <Reveal style={{ marginBottom:32, textAlign:"center" }}>
            <span className="chip" style={{ marginBottom:12 }}>FAQ</span>
            <h2 style={{ fontWeight:800, fontSize:"clamp(20px,3vw,30px)", letterSpacing:"-0.03em", marginTop:10 }}>
              Frequently asked questions
            </h2>
          </Reveal>

          {/* Category tabs */}
          <Reveal delay={80}>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:28, justifyContent:"center" }}>
              {FAQS.map((cat, i) => (
                <button key={cat.cat} className="cat-tab" onClick={() => setActiveCat(i)} style={{
                  background: activeCat === i ? "#0a0a0a" : "#fff",
                  color: activeCat === i ? "#fff" : "#6b7280",
                  border: `1px solid ${activeCat === i ? "#0a0a0a" : B}`,
                }}>
                  {cat.cat}
                </button>
              ))}
            </div>

            <div style={{ background:"#fff", borderRadius:14, border:`1px solid ${B}`, padding:"4px 24px" }}>
              {FAQS[activeCat < FAQS.length ? activeCat : 0].items.map(item => (
                <FAQItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Contact / Ticket form */}
      <section id="ticket-form" style={{ padding:"64px 24px 80px", background:"#fff" }}>
        <div style={{ maxWidth:640, margin:"0 auto" }}>
          <Reveal style={{ marginBottom:36, textAlign:"center" }}>
            <span className="chip" style={{ marginBottom:12 }}>Contact</span>
            <h2 style={{ fontWeight:800, fontSize:"clamp(20px,3vw,30px)", letterSpacing:"-0.03em", marginTop:10 }}>
              Still need help? Submit a ticket
            </h2>
            <p style={{ fontSize:14, color:"#6b7280", marginTop:10, lineHeight:1.7 }}>
              Our support team responds within 24 hours on weekdays.
            </p>
          </Reveal>

          {sent ? (
            <Reveal>
              <div style={{ textAlign:"center", padding:"48px 24px", background:"#f0fdf4",
                border:"1px solid #86efac", borderRadius:16 }}>
                <div style={{ fontSize:40, marginBottom:16 }}>✅</div>
                <h3 style={{ fontSize:20, fontWeight:700, color:"#15803d", marginBottom:8 }}>Message sent!</h3>
                <p style={{ fontSize:14, color:"#4b5563", lineHeight:1.7 }}>
                  We've received your ticket and will reply to <strong>{email}</strong> within 24 hours.
                </p>
                <button onClick={() => { setSent(false); setMsg(""); }} style={{
                  marginTop:20, padding:"10px 24px", borderRadius:8, background:PINK,
                  color:"#fff", border:"none", fontWeight:600, fontSize:13, cursor:"pointer",
                  fontFamily:"'Plus Jakarta Sans',sans-serif",
                }}>Submit another →</button>
              </div>
            </Reveal>
          ) : (
            <Reveal delay={60}>
              <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                  <div>
                    <label style={{ fontSize:12, fontWeight:600, color:"#555", display:"block", marginBottom:5 }}>Name *</label>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={inStyle}
                      onFocus={e => e.target.style.borderColor = PINK} onBlur={e => e.target.style.borderColor = B} />
                  </div>
                  <div>
                    <label style={{ fontSize:12, fontWeight:600, color:"#555", display:"block", marginBottom:5 }}>Email *</label>
                    <input value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" type="email" style={inStyle}
                      onFocus={e => e.target.style.borderColor = PINK} onBlur={e => e.target.style.borderColor = B} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:"#555", display:"block", marginBottom:5 }}>Topic</label>
                  <select value={topic} onChange={e => setTopic(e.target.value)} style={{ ...inStyle }}>
                    {["General","Account & Login","Billing & Subscription","Gen-E AI","HyperX","DigiHub","Units","Bug Report","Other"].map(t => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:"#555", display:"block", marginBottom:5 }}>Message *</label>
                  <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={5}
                    placeholder="Describe your issue in detail — the more context you give, the faster we can help."
                    style={{ ...inStyle, resize:"vertical", lineHeight:1.6 }}
                    onFocus={e => e.target.style.borderColor = PINK} onBlur={e => e.target.style.borderColor = B} />
                </div>

                {error && (
                  <div style={{ padding:"10px 14px", background:"#fff1f2", border:"1px solid #fecdd3",
                    borderRadius:8, fontSize:13, color:"#be123c" }}>{error}</div>
                )}

                <button type="submit" disabled={sending} style={{
                  padding:"13px 0", borderRadius:9, background:sending?"#f0f0f0":PINK,
                  color:sending?"#aaa":"#fff", border:"none", fontWeight:700, fontSize:14,
                  cursor:sending?"not-allowed":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif",
                  transition:"all 0.15s", boxShadow:sending?"none":`0 2px 12px ${PINK}30`,
                }}>
                  {sending ? "Sending…" : "Send message →"}
                </button>

                <p style={{ fontSize:12, color:"#bbb", textAlign:"center" }}>
                  Or email us directly at{" "}
                  <a href="mailto:support@nugens.in" style={{ color:PINK, textDecoration:"none" }}>support@nugens.in</a>
                </p>
              </form>
            </Reveal>
          )}
        </div>
      </section>
    </>
  );
}
