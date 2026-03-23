import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";

const PINK = "#e8185d";
const B = "#f0f0f0";

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
    <div ref={ref} style={{
      opacity: v ? 1 : 0,
      transform: v ? "none" : "translateY(16px)",
      transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
      ...style
    }}>{children}</div>
  );
}

// Location → currency config
const CURRENCY_MAP = {
  IN: { code: "INR", symbol: "₹", multiplier: 1 },
  US: { code: "USD", symbol: "$", multiplier: 0.012 },
  GB: { code: "GBP", symbol: "£", multiplier: 0.0094 },
  EU: { code: "EUR", symbol: "€", multiplier: 0.011 },
  AE: { code: "AED", symbol: "AED ", multiplier: 0.044 },
  SG: { code: "SGD", symbol: "S$", multiplier: 0.016 },
  AU: { code: "AUD", symbol: "A$", multiplier: 0.018 },
  CA: { code: "CAD", symbol: "C$", multiplier: 0.016 },
};

// Base prices in INR
// Real prices in INR (paise for Razorpay = amount * 100)
const BASE_PRICES = {
  individual: { starter: 0,   premium: 99,  pro: 699  },   // monthly
  business:   { starter: 499, premium: 999, pro: 1999 },
};
const YEARLY_PRICES = {
  individual: { starter: 0,    premium: 799,  pro: 4999  },
  business:   { starter: 3999, premium: 7999, pro: 14999 },
};
// Razorpay plan IDs — replace with your actual plan IDs from Razorpay dashboard
const RAZORPAY_PLAN_IDS = {
  individual: {
    premium_monthly: "plan_individual_premium_mo",
    premium_yearly:  "plan_individual_premium_yr",
    pro_monthly:     "plan_individual_pro_mo",
    pro_yearly:      "plan_individual_pro_yr",
  },
  business: {
    starter_monthly: "plan_business_starter_mo",
    starter_yearly:  "plan_business_starter_yr",
    premium_monthly: "plan_business_premium_mo",
    premium_yearly:  "plan_business_premium_yr",
    pro_monthly:     "plan_business_pro_mo",
    pro_yearly:      "plan_business_pro_yr",
  },
};

function formatPrice(inrAmount, currency, isYearly) {
  const amount = inrAmount * currency.multiplier * (isYearly ? 10 : 1); // 2 months free on yearly
  if (currency.code === "INR") return currency.symbol + Math.round(amount);
  if (amount < 1) return currency.symbol + amount.toFixed(2);
  return currency.symbol + Math.round(amount);
}

async function detectCurrency() {
  try {
    const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(4000) });
    const data = await res.json();
    const countryCode = data.country_code;
    // EU countries
    const EU = ["DE","FR","IT","ES","NL","BE","AT","PT","FI","IE","GR","SK","SI","EE","LV","LT","LU","MT","CY"];
    if (EU.includes(countryCode)) return CURRENCY_MAP["EU"];
    return CURRENCY_MAP[countryCode] || CURRENCY_MAP["IN"];
  } catch {
    return CURRENCY_MAP["IN"];
  }
}

const INDIVIDUAL_PLANS = [
  {
    key: "starter",
    name: "Starter",
    desc: "Perfect for exploring Nugens",
    color: "#6b7280",
    features: [
      "GEN-E AI — 20 free questions/month",
      "Resume analysis (basic)",
      "Job search access",
      "Career roadmap",
      "Community access",
    ],
    cta: "Get started free",
    popular: false,
  },
  {
    key: "premium",
    name: "Premium",
    desc: "For serious career growth",
    color: PINK,
    features: [
      "GEN-E AI — unlimited questions",
      "ATS resume builder + PDF export",
      "Interview prep (unlimited)",
      "Skill gap analysis",
      "Job tracker (unlimited)",
      "HyperX — 5 courses/month",
      "Priority support",
    ],
    cta: "Start Premium",
    popular: true,
  },
  {
    key: "pro",
    name: "Pro",
    desc: "Everything, for power users",
    color: "#7c3aed",
    features: [
      "Everything in Premium",
      "Live job matching (AI-powered)",
      "HyperX — all courses unlimited",
      "DigiHub — early access",
      "GEN-E Mini on all products",
      "1-on-1 career coaching session",
      "Custom career roadmap",
      "White-glove onboarding",
    ],
    cta: "Go Pro",
    popular: false,
  },
];

const BUSINESS_PLANS = [
  {
    key: "starter",
    name: "Starter",
    desc: "For small teams getting started",
    color: "#6b7280",
    features: [
      "5 team seats",
      "DigiHub marketing tools (basic)",
      "Content planner",
      "Community access",
      "GEN-E Mini assistant",
    ],
    cta: "Start free",
    popular: false,
  },
  {
    key: "premium",
    name: "Premium",
    desc: "For growing businesses",
    color: PINK,
    features: [
      "20 team seats",
      "DigiHub full marketing suite",
      "Poster & content generator",
      "Talent marketplace access",
      "Analytics dashboard",
      "Priority support",
      "HyperX team learning",
    ],
    cta: "Start Premium",
    popular: true,
  },
  {
    key: "pro",
    name: "Pro",
    desc: "For agencies and enterprises",
    color: "#7c3aed",
    features: [
      "Unlimited seats",
      "Everything in Premium",
      "Units production studio access",
      "Custom branding",
      "API access",
      "Dedicated account manager",
      "SLA guarantee",
      "Custom integrations",
    ],
    cta: "Contact us",
    popular: false,
  },
];

function PlanCard({ plan, prices, currency, isYearly, type, user, onBuy }) {
  const [ref, v] = useInView();
  const price = prices[type][plan.key];
  return (
    <div ref={ref} style={{
      opacity: v ? 1 : 0,
      transform: v ? "none" : "translateY(16px)",
      transition: "opacity 0.5s ease, transform 0.5s ease",
      position: "relative",
      background: plan.popular ? "#0a0a0a" : "#fff",
      border: plan.popular ? "none" : `1px solid ${B}`,
      borderRadius: 14,
      padding: "28px 24px",
      display: "flex",
      flexDirection: "column",
      boxShadow: plan.popular ? "0 8px 40px rgba(232,24,93,0.18)" : "none",
    }}>
      {plan.popular && (
        <div style={{
          position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
          background: PINK, color: "#fff", fontSize: 11, fontWeight: 700,
          padding: "3px 14px", borderRadius: 99, letterSpacing: "0.06em",
          textTransform: "uppercase", whiteSpace: "nowrap"
        }}>Most Popular</div>
      )}

      {/* Plan header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          display: "inline-block", fontSize: 11, fontWeight: 700,
          letterSpacing: "0.07em", textTransform: "uppercase",
          color: plan.popular ? plan.color : plan.color, marginBottom: 8
        }}>{plan.name}</div>
        <div style={{
          fontSize: "clamp(28px,3vw,36px)", fontWeight: 800,
          letterSpacing: "-0.04em", color: plan.popular ? "#fff" : "#0a0a0a",
          lineHeight: 1, marginBottom: 4
        }}>
          {formatPrice(price, currency, isYearly)}
          <span style={{ fontSize: 14, fontWeight: 400, color: plan.popular ? "#888" : "#9ca3af" }}>
            /{isYearly ? "yr" : "mo"}
          </span>
        </div>
        {isYearly && price > 0 && (
          <div style={{ fontSize: 11.5, color: plan.popular ? "#e8185d" : PINK, fontWeight: 600 }}>
            Save 2 months free
          </div>
        )}
        <p style={{ fontSize: 13, color: plan.popular ? "#888" : "#9ca3af", marginTop: 6 }}>{plan.desc}</p>
      </div>

      {/* Features */}
      <div style={{ flex: 1, marginBottom: 24 }}>
        {plan.features.map(f => (
          <div key={f} style={{
            display: "flex", alignItems: "center", gap: 9,
            padding: "7px 0", borderBottom: `1px solid ${plan.popular ? "#1a1a1a" : "#f7f7f7"}`,
            fontSize: 13, color: plan.popular ? "#ccc" : "#4b5563"
          }}>
            <div style={{
              width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
              background: `${plan.color}20`,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <svg width="8" height="7" viewBox="0 0 9 8" fill="none">
                <path d="M1.5 4L3.5 6L7.5 1.5" stroke={plan.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            {f}
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={() => onBuy(plan)}
        style={{
          display: "block", width: "100%", textAlign: "center", padding: "11px 0",
          borderRadius: 8, fontSize: 13.5, fontWeight: 600,
          border: "none", cursor: "pointer",
          background: plan.popular ? PINK : "#f3f4f6",
          color: plan.popular ? "#fff" : "#0a0a0a",
          transition: "opacity 0.14s, transform 0.12s",
          boxShadow: plan.popular ? `0 2px 10px ${PINK}40` : "none",
          fontFamily: "'Plus Jakarta Sans',sans-serif",
        }}
        onMouseOver={e => { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "translateY(-1px)"; }}
        onMouseOut={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "none"; }}
      >
        {plan.key === "pro" && type === "business" ? "Contact us →" : plan.key === "starter" ? (user ? "Current plan" : "Get started free") : plan.cta}
      </button>
    </div>
  );
}

async function initiateRazorpay({ planKey, type, isYearly, amount, currency, user }) {
  if (!user) { window.location.href = "/auth?mode=signup"; return; }
  if (amount === 0) return; // free plan - just redirect to dashboard

  try {
    const { data:{ session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const API = import.meta.env.VITE_GEN_E_API_URL || "https://nugens-platform.onrender.com";

    const orderRes = await fetch(`${API}/api/subscription/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization:`Bearer ${token}` } : {}) },
      body: JSON.stringify({
        // Must match a key in server.js PLAN_CONFIG exactly
        plan: `${type}_${planKey}_${isYearly ? "yearly" : "monthly"}`,
      }),
    });
    const resp = await orderRes.json();
    // Backend wraps in { order: {...} }
    const order = resp.order || resp;
    if (!order?.id) {
      // Show the real Razorpay error reason if available
      const msg = [resp.error, resp.details].filter(Boolean).join(" — ");
      throw new Error(msg || "Order creation failed");
    }

    const rzp = new window.Razorpay({
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      order_id: order.id,
      amount: order.amount,
      currency: "INR",
      name: "Nugens",
      description: `${type.charAt(0).toUpperCase()+type.slice(1)} ${planKey} ${isYearly?"Yearly":"Monthly"}`,
      prefill: { email: user.email, name: user.user_metadata?.full_name || "" },
      theme: { color: "#e8185d" },
      handler: async (response) => {
        try {
          const verifyRes = await fetch(`${API}/api/subscription/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(token ? { Authorization:`Bearer ${token}` } : {}) },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_signature:  response.razorpay_signature,
              plan: `${type}_${planKey}_${isYearly ? "yearly" : "monthly"}`,
            }),
          });
          const vData = await verifyRes.json();
          if (!vData.success) {
            alert("Payment received but activation failed. Contact support with your payment ID: " + response.razorpay_payment_id);
            return;
          }
        } catch (e) {
          // If verify fails due to network, still redirect — backend may have processed it
          console.warn("Verify call failed:", e.message);
        }
        // Redirect to dashboard — the ?subscribed=1 flag triggers a profile re-fetch
        window.location.href = "/dashboard?subscribed=1";
      },
    });
    rzp.open();
  } catch (err) {
    alert("Payment setup failed: " + (err.message || "Unknown error. Please try again."));
  }
}

export default function PricingPage() {
  const [tab, setTab] = useState("individual"); // individual | business
  const [isYearly, setIsYearly] = useState(false);
  const [currency, setCurrency] = useState(CURRENCY_MAP["IN"]);
  const [loadingCurrency, setLoadingCurrency] = useState(true);
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    detectCurrency().then(c => { setCurrency(c); setLoadingCurrency(false); });

    // Load Razorpay script
    if (!document.getElementById("razorpay-script")) {
      const s = document.createElement("script");
      s.id = "razorpay-script";
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onerror = () => console.error("Failed to load Razorpay script");
      document.head.appendChild(s);
    }

    // Get user + auto-set tab based on their user_type
    supabase.auth.getSession().then(({ data:{ session } }) => {
      if (session?.user) {
        setUser(session.user);
        supabase.from("profiles").select("*").eq("id", session.user.id).single()
          .then(({ data }) => {
            if (data) {
              setProfile(data);
              // Auto-switch to business tab if they're a business user
              if (data.user_type === "business") setTab("business");
            }
          });
      }
    });
  }, []);

  const plans  = tab === "individual" ? INDIVIDUAL_PLANS : BUSINESS_PLANS;
  const prices = isYearly ? YEARLY_PRICES : BASE_PRICES;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: #fff; color: #0a0a0a; -webkit-font-smoothing: antialiased; }
        .chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 6px; border: 1px solid ${B}; font-size: 11.5px; font-weight: 500; color: #6b7280; background: #fff; letter-spacing: 0.01em; }
        .chip-pink { background: #fef2f5; border-color: #fcc8d6; color: ${PINK}; }
        .tab-pill { padding: 7px 20px; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s; }
        .toggle-track { position: relative; width: 38px; height: 21px; background: #e5e7eb; border-radius: 99px; cursor: pointer; transition: background 0.2s; }
        .toggle-track.on { background: ${PINK}; }
        .toggle-thumb { position: absolute; top: 3px; left: 3px; width: 15px; height: 15px; border-radius: 50%; background: #fff; transition: transform 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
        .toggle-track.on .toggle-thumb { transform: translateX(17px); }
        @media (max-width: 760px) { .plans-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* Hero */}
      <section style={{ padding: "80px 24px 56px", textAlign: "center", borderBottom: `1px solid ${B}` }}>
        <Reveal>
          <span className="chip chip-pink" style={{ marginBottom: 16 }}>Pricing</span>
          <h1 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800,
            fontSize: "clamp(28px,4vw,48px)", letterSpacing: "-0.035em",
            color: "#0a0a0a", marginTop: 14, marginBottom: 14, lineHeight: 1.15
          }}>
            Simple, honest pricing.<br />
            <span style={{ color: PINK }}>Start free, grow when ready.</span>
          </h1>
          <p style={{ fontSize: 15.5, color: "#6b7280", maxWidth: 420, margin: "0 auto 32px", lineHeight: 1.7 }}>
            {loadingCurrency ? "Detecting your location…" : `Prices shown in ${currency.code}. All plans include a free trial.`}
          </p>

          {/* Individual / Business toggle
              - Not logged in → show toggle (public marketing page)
              - Logged in, user_type known → lock to their type, hide toggle
              - Logged in, no user_type → show toggle  */}
          {user && profile?.user_type && profile.user_type !== "unknown" ? (
            /* Logged-in: show locked badge */
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8,
                padding: "7px 20px", background: "#f3f4f6", borderRadius: 9,
                fontSize: 13, fontWeight: 600, color: "#0a0a0a" }}>
                {tab === "business" ? "🏢" : "👤"}
                <span>{tab === "business" ? "Business Plans" : "Individual Plans"}</span>
                <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 400 }}>· based on your account</span>
              </div>
            </div>
          ) : (
            /* Not logged in OR no user_type: show full toggle */
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
              <div style={{ display: "flex", background: "#f3f4f6", borderRadius: 9, padding: 3, gap: 2 }}>
                {["individual", "business"].map(t => (
                  <button key={t} className="tab-pill" onClick={() => setTab(t)} style={{
                    background: tab === t ? "#fff" : "transparent",
                    color: tab === t ? "#0a0a0a" : "#6b7280",
                    boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  }}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Monthly / Yearly toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <span style={{ fontSize: 13, color: isYearly ? "#9ca3af" : "#0a0a0a", fontWeight: 500 }}>Monthly</span>
            <div className={`toggle-track ${isYearly ? "on" : ""}`} onClick={() => setIsYearly(!isYearly)}>
              <div className="toggle-thumb" />
            </div>
            <span style={{ fontSize: 13, color: isYearly ? "#0a0a0a" : "#9ca3af", fontWeight: 500 }}>
              Yearly <span style={{ color: PINK, fontWeight: 700 }}>save 2 months</span>
            </span>
          </div>
        </Reveal>
      </section>

      {/* Plans grid */}
      <section style={{ padding: "56px 24px 80px", background: "#fafafa", borderBottom: `1px solid ${B}` }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div className="plans-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
            alignItems: "start",
          }}>
            {plans.map((plan, i) => (
              <PlanCard
                key={plan.key}
                plan={plan}
                prices={prices}
                currency={currency}
                isYearly={isYearly}
                type={tab}
                user={user}
                onBuy={(plan) => {
                  if (plan.key === "pro" && tab === "business") {
                    window.location.href = "/contact";
                    return;
                  }
                  if (plan.key === "starter") {
                    window.location.href = user ? "/dashboard" : "/auth?mode=signup";
                    return;
                  }
                  const amount = (isYearly ? YEARLY_PRICES : BASE_PRICES)[tab][plan.key];
                  initiateRazorpay({ planKey: plan.key, type: tab, isYearly, amount, currency, user });
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Compare section */}
      <section style={{ padding: "72px 24px", background: "#fff", borderBottom: `1px solid ${B}` }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <Reveal style={{ marginBottom: 40, textAlign: "center" }}>
            <span className="chip" style={{ marginBottom: 12 }}>Compare</span>
            <h2 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700,
              fontSize: "clamp(20px,2.8vw,28px)", letterSpacing: "-0.03em", marginTop: 10
            }}>What's in each plan</h2>
          </Reveal>
          <Reveal delay={80}>
            <div style={{ border: `1px solid ${B}`, borderRadius: 12, overflow: "hidden" }}>
              {[
                ["Feature", "Starter", "Premium", "Pro", true],
                ["GEN-E AI questions", "20/mo", "Unlimited", "Unlimited", false],
                ["Resume builder + PDF", "—", "✓", "✓", false],
                ["ATS optimisation", "Basic", "Full", "Full", false],
                ["Interview prep", "—", "Unlimited", "Unlimited", false],
                ["Job tracker", "10 apps", "Unlimited", "Unlimited", false],
                ["Skill gap analysis", "—", "✓", "✓", false],
                ["HyperX courses", "—", "5/mo", "Unlimited", false],
                ["DigiHub tools", "—", "—", "Early access", false],
                ["Career coaching", "—", "—", "1 session/mo", false],
              ].map(([feat, s, p, pro, isHeader], i) => (
                <div key={feat} style={{
                  display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr",
                  borderBottom: i < 9 ? `1px solid ${B}` : "none",
                  background: isHeader ? "#f9f9f9" : i % 2 === 0 ? "#fff" : "#fafafa",
                }}>
                  {[feat, s, p, pro].map((cell, ci) => (
                    <div key={ci} style={{
                      padding: "12px 16px",
                      fontSize: isHeader ? 11 : 13,
                      fontWeight: isHeader ? 700 : ci === 0 ? 500 : 400,
                      color: isHeader ? "#9ca3af" : ci === 0 ? "#374151" : cell === "—" ? "#d1d5db" : cell.includes("✓") || (!isHeader && ci === 3) ? "#7c3aed" : ci === 2 ? PINK : "#4b5563",
                      textTransform: isHeader ? "uppercase" : "none",
                      letterSpacing: isHeader ? "0.06em" : "normal",
                      textAlign: ci === 0 ? "left" : "center",
                      borderRight: ci < 3 ? `1px solid ${B}` : "none",
                    }}>
                      {cell}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "72px 24px 80px", background: "#fafafa" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <Reveal style={{ marginBottom: 40, textAlign: "center" }}>
            <span className="chip" style={{ marginBottom: 12 }}>FAQ</span>
            <h2 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700,
              fontSize: "clamp(20px,2.8vw,28px)", letterSpacing: "-0.03em", marginTop: 10
            }}>Common questions</h2>
          </Reveal>
          {[
            { q: "Can I start for free?", a: "Yes — the Starter plan is completely free. No credit card required. Upgrade when you're ready." },
            { q: "How does location-based pricing work?", a: "We detect your country and show prices in your local currency. All plans are the same quality worldwide — pricing adjusts to be fair for every market." },
            { q: "Can I switch plans anytime?", a: "Yes. Upgrade or downgrade at any time. Unused days are credited to your next billing cycle." },
            { q: "What payment methods do you accept?", a: "We accept all major cards, UPI, net banking (India), and international payment methods via Razorpay." },
            { q: "Is there a team plan?", a: "Yes — Business plans include team seats and collaboration tools across all Nugens products. Sign up or log in with a business account to see business pricing." },
          ].map(({ q, a }, i) => (
            <Reveal key={q} delay={i * 60}>
              <div style={{ padding: "20px 0", borderBottom: `1px solid ${B}` }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: "#0a0a0a", marginBottom: 7 }}>{q}</div>
                <p style={{ fontSize: 13.5, color: "#6b7280", lineHeight: 1.7 }}>{a}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}