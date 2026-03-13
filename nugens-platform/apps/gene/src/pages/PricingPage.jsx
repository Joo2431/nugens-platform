import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
const PINK   = "#e8185d";
const PURPLE = "#6d28d9";
const API_URL = import.meta.env.VITE_GEN_E_API_URL || "https://gene-backend-al5h.onrender.com";

const PLANS = [
  {
    id: "free",
    name: "Starter",
    price: "₹0",
    period: "free forever",
    badge: null,
    accentColor: "#999",
    borderColor: "#e8e8e8",
    bg: "#fafafa",
    features: [
      { text: "20 career questions total",   ok: true  },
      { text: "Career guidance & roadmaps",  ok: true  },
      { text: "Interview prep (in chat)",    ok: true  },
      { text: "Career readiness scoring",    ok: true  },
      { text: "Resume PDF download",         ok: false },
      { text: "Unlimited questions",         ok: false },
      { text: "ATS resume builder",          ok: false },
      { text: "Resume review & feedback",    ok: false },
      { text: "Job match analysis",          ok: false },
    ],
    razorpay_plan: null,
  },
  {
    id: "monthly",
    name: "Pro Monthly",
    price: "₹99",
    period: "per month",
    badge: "Most Popular",
    accentColor: PINK,
    borderColor: PINK,
    bg: "#fff",
    features: [
      { text: "Unlimited questions",         ok: true  },
      { text: "Full career guidance",        ok: true  },
      { text: "Advanced interview prep",     ok: true  },
      { text: "Career readiness scoring",    ok: true  },
      { text: "Resume PDF download",         ok: true  },
      { text: "ATS resume builder",          ok: true  },
      { text: "Resume review & feedback",    ok: true  },
      { text: "Job match analysis",          ok: false, note: "Yearly plan only" },
    ],
    razorpay_plan: "monthly",
    amount: 9900,
  },
  {
    id: "yearly",
    name: "Pro Yearly",
    price: "₹699",
    period: "per year",
    badge: "Best Value",
    accentColor: PURPLE,
    borderColor: PURPLE,
    bg: "#fff",
    features: [
      { text: "Unlimited questions",         ok: true },
      { text: "Full career guidance",        ok: true },
      { text: "Advanced interview prep",     ok: true },
      { text: "Career readiness scoring",    ok: true },
      { text: "Resume PDF download",         ok: true },
      { text: "ATS resume builder",          ok: true },
      { text: "Resume review & feedback",    ok: true },
      { text: "Job match analysis",          ok: true },
    ],
    razorpay_plan: "yearly",
    amount: 69900,
  },
];

export default function PricingPage() {
  const navigate = useNavigate();
  const [user,           setUser]           = useState(null);
  const [profile,        setProfile]        = useState(null);
  const [loadingPlan,    setLoadingPlan]    = useState(null);
  const [error,          setError]          = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [successPlan,    setSuccessPlan]    = useState(null);

  useEffect(() => {
    const load = async (session) => {
      if (!session) { setProfileLoading(false); return; }
      setUser(session.user);
      const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
      if (data) setProfile(data);
      setProfileLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => load(session));

    // Re-fetch on window focus (catches post-payment redirect)
    const handler = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
      if (data) setProfile(data);
      setProfileLoading(false);
    };
    window.addEventListener("focus", handler);
    return () => window.removeEventListener("focus", handler);
  }, []);

  const loadRazorpay = () => new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

  const handleSubscribe = async (plan) => {
    if (!user) { navigate("/auth"); return; }
    if (!plan.razorpay_plan) return;
    setLoadingPlan(plan.id);
    setError("");
    try {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Razorpay SDK failed to load.");

      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${API_URL}/api/subscription/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ plan: plan.razorpay_plan }),
      });
      const { order, error: orderError } = await res.json();
      if (orderError) throw new Error(orderError);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount, currency: order.currency,
        name: "GEN-E Career AI",
        description: `${plan.name} Subscription`,
        order_id: order.id,
        prefill: { name: profile?.full_name || "", email: user.email || "" },
        theme: { color: plan.accentColor },
        handler: async (response) => {
          const verifyRes = await fetch(`${API_URL}/api/subscription/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              plan: plan.razorpay_plan,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
            if (data) setProfile(data);
            setSuccessPlan(plan.name);
            setLoadingPlan(null);
          } else {
            setError("Payment verification failed. Please contact support.");
            setLoadingPlan(null);
          }
        },
        modal: { ondismiss: () => setLoadingPlan(null) },
      };
      new window.Razorpay(options).open();
    } catch (err) {
      setError(err.message || "Payment failed. Please try again.");
      setLoadingPlan(null);
    }
  };

  const currentPlan = profile?.plan || "free";

  const getCtaLabel = (plan) => {
    if (loadingPlan === plan.id) return "Processing…";
    if (plan.id === currentPlan)  return "✓ Current Plan";
    if (plan.id === "free")       return "Free Plan";
    if (plan.id === "monthly")    return "Get Pro Monthly";
    return "Get Pro Yearly";
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { font-family: 'DM Sans', sans-serif; background: #fff; color: #111; }

        .pricing-card {
          border-radius: 16px; padding: 28px 24px; position: relative;
          transition: transform 0.18s, box-shadow 0.18s;
        }
        .pricing-card:not(.active-card):hover { transform: translateY(-5px); }

        .plan-feature {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 6px 0; font-size: 13px; color: #444;
          border-bottom: 1px solid #f5f5f5;
        }
        .plan-feature:last-child { border-bottom: none; }

        .plan-cta {
          width: 100%; padding: 11px 0; border: none; border-radius: 9px;
          font-family: 'DM Sans', sans-serif; font-weight: 700; font-size: 13px;
          cursor: pointer; transition: opacity 0.15s, transform 0.1s; letter-spacing: 0.01em;
        }
        .plan-cta:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .plan-cta:disabled { cursor: default; }

        .feature-note {
          font-size: 10px; color: #aaa; margin-left: auto; white-space: nowrap;
          background: #f5f5f5; padding: 1px 6px; border-radius: 4px;
        }

        @media (max-width: 760px) {
          .pricing-grid { grid-template-columns: 1fr !important; max-width: 400px !important; margin: 0 auto !important; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#fff" }}>

        {/* ── Nav ── */}
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "18px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1px solid #f2f2f2" }}>
          <button onClick={() => navigate("/gen-e")}
            style={{ background: "none", border: "none", cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800,
              fontSize: 15, color: PINK, letterSpacing: "-0.03em", display: "flex", alignItems: "center", gap: 6 }}>
            ← GEN-E
          </button>
          {user && <span style={{ fontSize: 12, color: "#aaa" }}>{user.email}</span>}
        </div>

        {/* ── Header ── */}
        <div style={{ textAlign: "center", padding: "44px 24px 32px", maxWidth: 520, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6,
            background: "#fff5f8", border: "1px solid #ffd0de", borderRadius: 20,
            padding: "3px 14px", fontSize: 11, fontWeight: 700, color: PINK,
            letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 18 }}>
            Simple Pricing
          </div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800,
            fontSize: 28, color: "#0a0a0a", lineHeight: 1.25, letterSpacing: "-0.025em", marginBottom: 14 }}>
            Start free. Upgrade when you're ready.
          </h1>
          <p style={{ fontSize: 14, color: "#888", lineHeight: 1.75, maxWidth: 420, margin: "0 auto" }}>
            AI-powered career coaching, ATS resumes, and personalised roadmaps — built for freshers and professionals.
          </p>
        </div>

        {/* ── Success banner ── */}
        {successPlan && (
          <div style={{ maxWidth: 1000, margin: "0 auto 16px", padding: "0 24px" }}>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10,
              padding: "12px 16px", display: "flex", alignItems: "center", gap: 10,
              fontSize: 13, color: "#15803d", fontWeight: 600 }}>
              <span>🎉</span>
              <span>Welcome to <strong>{successPlan}</strong>! All Pro features are now unlocked.</span>
              <button onClick={() => navigate("/gen-e")}
                style={{ marginLeft: "auto", background: "#15803d", color: "#fff", border: "none",
                  borderRadius: 6, padding: "4px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                Start using →
              </button>
            </div>
          </div>
        )}

        {/* ── Current plan banner ── */}
        {!profileLoading && !successPlan && currentPlan !== "free" && (
          <div style={{ maxWidth: 1000, margin: "0 auto 16px", padding: "0 24px" }}>
            <div style={{
              background: currentPlan === "yearly" ? "#f5f3ff" : "#fff0f4",
              border: `1px solid ${currentPlan === "yearly" ? "#ddd6fe" : "#ffd0de"}`,
              borderRadius: 10, padding: "10px 16px",
              display: "flex", alignItems: "center", gap: 8,
              fontSize: 13, color: currentPlan === "yearly" ? PURPLE : PINK, fontWeight: 600 }}>
              <span>✓</span>
              <span>
                You're on <strong>{currentPlan === "yearly" ? "Pro Yearly" : "Pro Monthly"}</strong>
                {profile?.subscription_end && (
                  <span style={{ fontWeight: 400, color: "#aaa", marginLeft: 8 }}>
                    · Renews {new Date(profile.subscription_end).toLocaleDateString("en-IN",
                      { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                )}
              </span>
              <button onClick={() => navigate("/gen-e")}
                style={{ marginLeft: "auto", background: "none", border: "none",
                  color: currentPlan === "yearly" ? PURPLE : PINK,
                  fontSize: 12, cursor: "pointer", fontWeight: 600, textDecoration: "underline" }}>
                Back to chat →
              </button>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div style={{ maxWidth: 440, margin: "0 auto 20px",
            background: "#fff5f8", border: "1px solid #ffd0de",
            borderRadius: 8, padding: "10px 14px", fontSize: 12.5, color: PINK, textAlign: "center" }}>
            ⚠️ {error}
          </div>
        )}

        {/* ── Plan cards ── */}
        <div className="pricing-grid" style={{ maxWidth: 1000, margin: "0 auto",
          padding: "0 24px 60px", display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)", gap: 18, alignItems: "start" }}>

          {PLANS.map((plan) => {
            const isActive  = currentPlan === plan.id;
            const isLoading = loadingPlan === plan.id;

            return (
              <div key={plan.id}
                className={`pricing-card ${isActive ? "active-card" : ""}`}
                style={{
                  background: isActive ? (plan.id === "free" ? "#fafafa" : plan.bg) : "#fff",
                  border: isActive
                    ? `2px solid ${plan.accentColor}`
                    : `1.5px solid ${plan.id === "free" ? "#e8e8e8" : plan.borderColor}`,
                  boxShadow: isActive
                    ? `0 6px 28px ${plan.accentColor}20`
                    : plan.id === "free" ? "none" : "0 2px 20px rgba(0,0,0,0.06)",
                }}>

                {/* Badge */}
                {plan.badge && (
                  <div style={{ position: "absolute", top: -12, left: "50%",
                    transform: "translateX(-50%)",
                    background: plan.accentColor, color: "#fff",
                    fontSize: 10, fontWeight: 700, padding: "3px 12px",
                    borderRadius: 20, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                    {plan.badge}
                  </div>
                )}

                {/* Active badge */}
                {isActive && (
                  <div style={{ position: "absolute", top: 12, right: 12,
                    background: plan.accentColor, color: "#fff",
                    fontSize: 9, fontWeight: 800, padding: "2px 8px",
                    borderRadius: 20, letterSpacing: "0.08em" }}>
                    ACTIVE
                  </div>
                )}

                {/* Plan name */}
                <div style={{ fontSize: 11, fontWeight: 700, color: plan.accentColor,
                  letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 10 }}>
                  {plan.name}
                </div>

                {/* Price */}
                <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginBottom: 4 }}>
                  <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800,
                    fontSize: 30, color: "#0a0a0a", letterSpacing: "-0.02em" }}>
                    {plan.price}
                  </span>
                  <span style={{ fontSize: 12, color: "#aaa" }}>{plan.period}</span>
                </div>

                {plan.id === "yearly" ? (
                  <div style={{ fontSize: 11, color: PURPLE, fontWeight: 700, marginBottom: 16,
                    background: "#f5f3ff", display: "inline-block", padding: "2px 8px", borderRadius: 5 }}>
                    Save ₹489 vs monthly
                  </div>
                ) : (
                  <div style={{ marginBottom: 16 }} />
                )}

                <div style={{ height: 1, background: "#f0f0f0", marginBottom: 16 }} />

                {/* Features */}
                <div style={{ marginBottom: 22 }}>
                  {plan.features.map((f, i) => (
                    <div key={i} className="plan-feature" style={{ color: f.ok ? "#333" : "#ccc" }}>
                      <span style={{ width: 16, height: 16, borderRadius: "50%",
                        background: f.ok ? `${plan.accentColor}18` : "#f5f5f5",
                        color: f.ok ? plan.accentColor : "#ccc",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 8, fontWeight: 800, flexShrink: 0, marginTop: 1 }}>
                        {f.ok ? "✓" : "✕"}
                      </span>
                      <span>{f.text}</span>
                      {f.note && <span className="feature-note">{f.note}</span>}
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button
                  className="plan-cta"
                  onClick={() => { if (plan.razorpay_plan && !isActive) handleSubscribe(plan); }}
                  disabled={isActive || isLoading || !plan.razorpay_plan}
                  style={{
                    background: isActive
                      ? `${plan.accentColor}15`
                      : plan.razorpay_plan ? plan.accentColor : "#f0f0f0",
                    color: isActive
                      ? plan.accentColor
                      : plan.razorpay_plan ? "#fff" : "#bbb",
                    border: isActive ? `1.5px solid ${plan.accentColor}40` : "none",
                  }}>
                  {getCtaLabel(plan)}
                </button>

                {/* Upgrade nudge for active monthly */}
                {isActive && plan.id === "monthly" && (
                  <div style={{ textAlign: "center", marginTop: 10, fontSize: 11.5 }}>
                    <button onClick={() => handleSubscribe(PLANS[2])}
                      style={{ background: "none", border: "none", color: PURPLE,
                        cursor: "pointer", fontSize: 11.5, fontWeight: 600, textDecoration: "underline" }}>
                      ↑ Switch to Yearly & save ₹489
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Footer trust ── */}
        <div style={{ textAlign: "center", paddingBottom: 40, fontSize: 12, color: "#bbb",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>🔒</span>
            <span>Secure payments via Razorpay · Cancel anytime · No hidden charges</span>
          </div>
          <div style={{ fontSize: 11 }}>Questions? Email us at support@gene.ai</div>
        </div>
      </div>
    </>
  );
}
