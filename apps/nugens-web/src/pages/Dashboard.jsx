import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const PINK = "#e8185d";
const B = "#f0f0f0";

const PRODUCTS = [
  { icon: "◎", name: "GEN-E AI", tag: "Career Intelligence", desc: "Resume, jobs, AI career coach", color: PINK, href: "https://gene.nugens.in.net", external: true },
  { icon: "⬡", name: "HyperX", tag: "Learning Platform", desc: "Professional skills & courses", color: "#7c3aed", to: "/hyperx" },
  { icon: "◈", name: "DigiHub", tag: "Marketing + Community", desc: "Brand tools & talent network", color: "#0284c7", to: "/digihub" },
  { icon: "◇", name: "The Wedding Unit", tag: "Production Studio", desc: "Photography & production", color: "#d97706", href: "https://theweddingunit.in", external: true },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/auth"); return; }
      setUser(session.user);
      // Load profile
      supabase.from("profiles").select("*").eq("id", session.user.id).single()
        .then(({ data }) => { setProfile(data); setLoading(false); });
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "80vh" }}>
      <div style={{ fontWeight: 800, fontSize: 22, color: PINK, fontStyle: "italic" }}>NuGens</div>
    </div>
  );

  const firstName = (profile?.full_name || user?.user_metadata?.full_name || user?.email || "").split(" ")[0] || "there";
  const plan = profile?.plan || "free";
  const questionsUsed = profile?.questions_used || 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: #fafafa; color: #0a0a0a; -webkit-font-smoothing: antialiased; }
        .chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 6px; border: 1px solid ${B}; font-size: 11.5px; font-weight: 500; color: #6b7280; background: #fff; }
        .pcard { background: #fff; border: 1px solid ${B}; border-radius: 12px; padding: 22px; transition: box-shadow 0.18s, border-color 0.18s; cursor: pointer; text-decoration: none; display: block; }
        .pcard:hover { border-color: #fcc8d6; box-shadow: 0 2px 18px rgba(232,24,93,0.07); transform: translateY(-1px); }
        .stat-card { background: #fff; border: 1px solid ${B}; border-radius: 10px; padding: 18px 20px; }
        @media (max-width: 700px) { .dash-grid { grid-template-columns: 1fr !important; } .products-grid { grid-template-columns: 1fr 1fr !important; } }
      `}</style>

      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 36, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: "clamp(20px,2.5vw,26px)", fontWeight: 800, letterSpacing: "-0.03em", color: "#0a0a0a" }}>
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {firstName} 👋
            </div>
            <div style={{ fontSize: 13.5, color: "#9ca3af", marginTop: 4 }}>
              Welcome back to your NuGens dashboard
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{
              display: "inline-block", fontSize: 11, fontWeight: 700,
              letterSpacing: "0.06em", textTransform: "uppercase",
              color: plan === "free" ? "#6b7280" : PINK,
              background: plan === "free" ? "#f3f4f6" : "#fef2f5",
              padding: "4px 10px", borderRadius: 6,
            }}>{plan === "free" ? "Free plan" : `${plan} plan`}</span>
            <button onClick={handleSignOut} style={{
              padding: "7px 14px", borderRadius: 7, border: `1px solid ${B}`,
              background: "#fff", color: "#6b7280", fontSize: 12.5, fontWeight: 500,
              cursor: "pointer", transition: "all 0.14s"
            }}>Sign out</button>
          </div>
        </div>

        {/* Stats row */}
        <div className="dash-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 36 }}>
          {[
            { label: "Plan", value: plan.charAt(0).toUpperCase() + plan.slice(1), sub: "Current plan", color: PINK },
            { label: "AI Questions", value: `${questionsUsed}${plan === "free" ? "/20" : ""}`, sub: plan === "free" ? "This month" : "Unlimited", color: "#7c3aed" },
            { label: "Products", value: "4", sub: "Available to you", color: "#0284c7" },
            { label: "Joined", value: new Date(user.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" }), sub: "Member since", color: "#d97706" },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9ca3af", marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.035em", color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 4 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Upgrade banner (free users only) */}
        {plan === "free" && (
          <div style={{
            background: "#0a0a0a", borderRadius: 12, padding: "20px 24px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 12, marginBottom: 36
          }}>
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: "#fff", marginBottom: 3 }}>Unlock the full NuGens ecosystem</div>
              <div style={{ fontSize: 13, color: "#888" }}>Upgrade to Premium — unlimited AI, resume builder, HyperX courses and more</div>
            </div>
            <Link to="/pricing" style={{
              padding: "9px 20px", borderRadius: 8, background: PINK,
              color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none",
              boxShadow: `0 2px 10px ${PINK}40`, whiteSpace: "nowrap"
            }}>View plans →</Link>
          </div>
        )}

        {/* Products launcher */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#9ca3af", marginBottom: 16 }}>Your products</div>
          <div className="products-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {PRODUCTS.map(p => {
              const Tag = p.external ? "a" : Link;
              const linkProps = p.external ? { href: p.href, target: "_blank", rel: "noreferrer" } : { to: p.to };
              return (
                <Tag key={p.name} {...linkProps} className="pcard" style={{
                  background: "#fff", border: `1px solid ${B}`, borderRadius: 12,
                  padding: "20px", textDecoration: "none", display: "block",
                  transition: "all 0.18s"
                }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = p.color + "55"; e.currentTarget.style.boxShadow = `0 2px 18px ${p.color}15`; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = B; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
                >
                  <div style={{ fontSize: 22, color: p.color, marginBottom: 10, lineHeight: 1 }}>{p.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0a0a0a", marginBottom: 3 }}>{p.name}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: p.color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{p.tag}</div>
                  <div style={{ fontSize: 12.5, color: "#9ca3af", lineHeight: 1.55 }}>{p.desc}</div>
                </Tag>
              );
            })}
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#9ca3af", marginBottom: 16 }}>Quick actions</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              { label: "→ Launch GEN-E AI", href: "https://gene.nugens.in.net", external: true, primary: true },
              { label: "→ View pricing", to: "/pricing" },
              { label: "→ Edit profile", to: "/profile" },
              { label: "→ Support", to: "/support" },
            ].map(a => {
              const Tag = a.external ? "a" : Link;
              const props = a.external ? { href: a.href, target: "_blank" } : { to: a.to };
              return (
                <Tag key={a.label} {...props} style={{
                  padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                  textDecoration: "none",
                  background: a.primary ? PINK : "#fff",
                  color: a.primary ? "#fff" : "#374151",
                  border: a.primary ? "none" : `1px solid ${B}`,
                  transition: "all 0.14s",
                  boxShadow: a.primary ? `0 2px 10px ${PINK}35` : "none",
                }}
                  onMouseOver={e => { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseOut={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "none"; }}
                >{a.label}</Tag>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
