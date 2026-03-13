import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

const PINK = "#e8185d";

export default function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("login"); // "login" | "signup"
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Redirect if already logged in OR when Google OAuth session arrives
  useEffect(() => {
    // Check existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard", { replace: true });
    });

    // Listen for auth state changes — this catches Google OAuth callback
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        // Ensure profile row exists for Google OAuth users
        await supabase.from("profiles").upsert({
          id: session.user.id,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "",
          avatar_url: session.user.user_metadata?.avatar_url || "",
          plan: "free",
          questions_used: 0,
        }, { onConflict: "id", ignoreDuplicates: true });

        navigate("/dashboard", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  };

  /* ── EMAIL / PASSWORD ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (tab === "signup") {
        if (!form.name.trim()) { setError("Please enter your full name."); setLoading(false); return; }
        if (form.password !== form.confirm) { setError("Passwords do not match."); setLoading(false); return; }
        if (form.password.length < 6) { setError("Password must be at least 6 characters."); setLoading(false); return; }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { full_name: form.name } }
        });
        if (signUpError) throw signUpError;

        // Create profile row
        if (data.user) {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            email: form.email,
            full_name: form.name,
            plan: "free",
            questions_used: 0
          });
        }
        setSuccess("Account created! Check your email to confirm, then login.");
        setTab("login");
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password
        });
        if (loginError) throw loginError;
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  /* ── GOOGLE OAUTH ── */
  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` }
    });
    if (error) { setError(error.message); setGoogleLoading(false); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; font-family: 'DM Sans', sans-serif; background: #fff; }
        input:focus { outline: none; }
      `}</style>

      <div style={{ minHeight: "100vh", display: "flex", background: "#fff" }}>
        {/* Left panel - branding */}
        <div style={{
          flex: 1, display: "none", flexDirection: "column", alignItems: "center", justifyContent: "center",
          background: "linear-gradient(135deg, #fff 0%, #fff5f8 60%, #ffd0de 100%)",
          padding: 48, position: "relative", overflow: "hidden"
        }} className="auth-left">
          <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "rgba(232,24,93,0.06)", top: -100, right: -100 }} />
          <div style={{ position: "absolute", width: 250, height: 250, borderRadius: "50%", background: "rgba(232,24,93,0.04)", bottom: 50, left: -80 }} />
          <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 52, fontStyle: "italic", color: PINK, letterSpacing: "-0.04em", marginBottom: 8 }}>GEN-E</div>
            <div style={{ fontSize: 13, color: "#999", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 32 }}>Career AI by Nugens</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#222", lineHeight: 1.6, maxWidth: 320, marginBottom: 24 }}>
              Your AI-powered career intelligence assistant
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, textAlign: "left" }}>
              {["🎯 Personalized career roadmaps", "📄 ATS-optimized resume builder", "🎤 Interview prep & mock practice", "📊 Career readiness scoring"].map(f => (
                <div key={f} style={{ fontSize: 13.5, color: "#555", display: "flex", alignItems: "center", gap: 8 }}>
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel - form */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px", minWidth: 0 }}>
          <div style={{ width: "100%", maxWidth: 400 }}>
            {/* Logo */}
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <Link to="/" style={{ textDecoration: "none" }}>
                <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 32, fontStyle: "italic", color: PINK, letterSpacing: "-0.04em" }}>GEN-E</span>
              </Link>
              <div style={{ fontSize: 13, color: "#aaa", marginTop: 4 }}>Career AI Assistant</div>
            </div>

            {/* Card */}
            <div style={{ background: "#fff", border: "1.5px solid #f0f0f0", borderRadius: 18, padding: "28px 28px 24px", boxShadow: "0 4px 32px rgba(0,0,0,0.06)" }}>
              {/* Tabs */}
              <div style={{ display: "flex", background: "#fafafa", borderRadius: 10, padding: 3, marginBottom: 24 }}>
                {["login", "signup"].map(t => (
                  <button key={t} onClick={() => { setTab(t); setError(""); setSuccess(""); }}
                    style={{
                      flex: 1, padding: "8px 0", border: "none", borderRadius: 8,
                      background: tab === t ? "#fff" : "transparent",
                      boxShadow: tab === t ? "0 1px 6px rgba(0,0,0,0.08)" : "none",
                      fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12.5,
                      color: tab === t ? PINK : "#aaa", cursor: "pointer",
                      textTransform: "capitalize", letterSpacing: "0.03em"
                    }}>{t === "login" ? "Sign In" : "Create Account"}</button>
                ))}
              </div>

              {/* Google button */}
              <button onClick={handleGoogle} disabled={googleLoading}
                style={{
                  width: "100%", padding: "10px 0", background: "#fff",
                  border: "1.5px solid #e8e8e8", borderRadius: 10, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  fontSize: 13.5, fontFamily: "'DM Sans',sans-serif", fontWeight: 500, color: "#333",
                  marginBottom: 18, transition: "border-color 0.15s"
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#ffd0de"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#e8e8e8"}
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {googleLoading ? "Connecting…" : "Continue with Google"}
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <div style={{ flex: 1, height: 1, background: "#f0f0f0" }} />
                <span style={{ fontSize: 11, color: "#ccc" }}>or</span>
                <div style={{ flex: 1, height: 1, background: "#f0f0f0" }} />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                {tab === "signup" && (
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 600, color: "#666", display: "block", marginBottom: 5, fontFamily: "'Syne',sans-serif" }}>Full Name</label>
                    <input name="name" value={form.name} onChange={handleChange} placeholder="Aarav Kumar" required
                      style={{ width: "100%", padding: "10px 13px", border: "1.5px solid #ececec", borderRadius: 9, fontSize: 13.5, color: "#222", fontFamily: "'DM Sans',sans-serif", background: "#fafafa" }}
                      onFocus={e => e.target.style.borderColor = PINK}
                      onBlur={e => e.target.style.borderColor = "#ececec"}
                    />
                  </div>
                )}

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: "#666", display: "block", marginBottom: 5, fontFamily: "'Syne',sans-serif" }}>Email Address</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@email.com" required
                    style={{ width: "100%", padding: "10px 13px", border: "1.5px solid #ececec", borderRadius: 9, fontSize: 13.5, color: "#222", fontFamily: "'DM Sans',sans-serif", background: "#fafafa" }}
                    onFocus={e => e.target.style.borderColor = PINK}
                    onBlur={e => e.target.style.borderColor = "#ececec"}
                  />
                </div>

                <div style={{ marginBottom: tab === "signup" ? 14 : 20 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: "#666", display: "block", marginBottom: 5, fontFamily: "'Syne',sans-serif" }}>Password</label>
                  <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="••••••••" required
                    style={{ width: "100%", padding: "10px 13px", border: "1.5px solid #ececec", borderRadius: 9, fontSize: 13.5, color: "#222", fontFamily: "'DM Sans',sans-serif", background: "#fafafa" }}
                    onFocus={e => e.target.style.borderColor = PINK}
                    onBlur={e => e.target.style.borderColor = "#ececec"}
                  />
                </div>

                {tab === "signup" && (
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 600, color: "#666", display: "block", marginBottom: 5, fontFamily: "'Syne',sans-serif" }}>Confirm Password</label>
                    <input name="confirm" type="password" value={form.confirm} onChange={handleChange} placeholder="••••••••" required
                      style={{ width: "100%", padding: "10px 13px", border: "1.5px solid #ececec", borderRadius: 9, fontSize: 13.5, color: "#222", fontFamily: "'DM Sans',sans-serif", background: "#fafafa" }}
                      onFocus={e => e.target.style.borderColor = PINK}
                      onBlur={e => e.target.style.borderColor = "#ececec"}
                    />
                  </div>
                )}

                {error && (
                  <div style={{ background: "#fff5f8", border: "1px solid #ffd0de", borderRadius: 8, padding: "9px 12px", marginBottom: 14, fontSize: 12.5, color: PINK }}>
                    ⚠️ {error}
                  </div>
                )}
                {success && (
                  <div style={{ background: "#f0fff4", border: "1px solid #b2f5c8", borderRadius: 8, padding: "9px 12px", marginBottom: 14, fontSize: 12.5, color: "#1a7a3c" }}>
                    ✅ {success}
                  </div>
                )}

                <button type="submit" disabled={loading}
                  style={{
                    width: "100%", padding: "11px 0",
                    background: loading ? "#f0f0f0" : PINK,
                    border: "none", borderRadius: 10,
                    fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13,
                    color: loading ? "#ccc" : "#fff", cursor: loading ? "not-allowed" : "pointer",
                    letterSpacing: "0.04em"
                  }}
                >
                  {loading ? "Please wait…" : tab === "login" ? "Sign In →" : "Create Account →"}
                </button>
              </form>

              {tab === "login" && (
                <div style={{ textAlign: "center", marginTop: 14, fontSize: 12, color: "#aaa" }}>
                  Don't have an account?{" "}
                  <button onClick={() => setTab("signup")} style={{ background: "none", border: "none", color: PINK, fontWeight: 600, cursor: "pointer", fontSize: 12 }}>
                    Sign up free
                  </button>
                </div>
              )}
            </div>

            {/* Plan teaser */}
            <div style={{ textAlign: "center", marginTop: 16, fontSize: 11.5, color: "#bbb" }}>
              🎯 Start free with 20 questions · Upgrade anytime from ₹99/mo
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .auth-left { display: flex !important; }
        }
      `}</style>
    </>
  );
}
