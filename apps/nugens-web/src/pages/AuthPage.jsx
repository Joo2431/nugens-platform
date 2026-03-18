import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { NG_LOGO } from "../lib/logo";

const PINK = "#e8185d";
const PRODUCTS = [
  { icon:"◎", label:"Gen-E AI",         sub:"Career intelligence & resume AI",  color:"#7c3aed" },
  { icon:"⬡", label:"HyperX",           sub:"Professional skills training",     color:PINK      },
  { icon:"◈", label:"DigiHub",          sub:"Marketing agency & community",     color:"#0284c7" },
  { icon:"◇", label:"Units", sub:"Wedding & event production",       color:"#d97706" },
];

export default function AuthPage() {
  const navigate = useNavigate();

  // Use a ref so goAfterLogin always reads the LATEST redirect value
  // even inside stale closures from onAuthStateChange
  const redirectRef = useRef("/dashboard");
  useEffect(() => {
    // Read redirect from URL param OR sessionStorage (set before Google OAuth)
    const params = new URLSearchParams(window.location.search);
    const fromUrl  = params.get("redirect");
    const fromStorage = (() => { try { return sessionStorage.getItem("ng_redirect"); } catch(e) { return null; } })();
    redirectRef.current = fromUrl || fromStorage || "/dashboard";
  }, []);

  const [tab,           setTab]           = useState("login");
  const [form,          setForm]          = useState({ name:"", email:"", password:"", confirm:"" });
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error,         setError]         = useState("");
  const [success,       setSuccess]       = useState("");

  const goAfterLogin = () => {
    const dest = redirectRef.current;
    // Clear sessionStorage redirect now that we're using it
    try { sessionStorage.removeItem("ng_redirect"); } catch(e) {}
    // Delay lets cookie write complete before navigating to subdomain
    setTimeout(() => {
      if (dest.startsWith("http")) {
        window.location.href = dest;
      } else {
        navigate(dest, { replace: true });
      }
    }, 600);
  };

  useEffect(() => {
    let redirected = false;

    const doRedirect = (session) => {
      if (redirected || !session) return;
      redirected = true;

      // Upsert profile — always update full_name so it's never empty
      const fullName =
        session.user.user_metadata?.full_name ||
        session.user.user_metadata?.name ||
        session.user.email?.split("@")[0] || "";

      supabase.from("profiles").upsert({
        id:             session.user.id,
        email:          session.user.email,
        full_name:      fullName,
        avatar_url:     session.user.user_metadata?.avatar_url || "",
        plan:           "free",
        questions_used: 0,
      }, {
        onConflict:      "id",
        ignoreDuplicates: false,   // MUST be false — always write full_name
      }).then(({ error }) => {
        if (error) console.warn("[Auth] profile upsert:", error.message);
      });

      goAfterLogin();
    };

    // PRIMARY: onAuthStateChange catches ALL login events reliably —
    // email/password, Google OAuth (both implicit hash AND PKCE code flow)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => { doRedirect(session); }
    );

    // FALLBACK: already-logged-in users landing on /auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      doRedirect(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleChange = (e) => { setForm(f => ({ ...f, [e.target.name]: e.target.value })); setError(""); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      if (tab === "signup") {
        if (!form.name.trim())              { setError("Please enter your full name.");        setLoading(false); return; }
        if (form.password !== form.confirm) { setError("Passwords do not match.");             setLoading(false); return; }
        if (form.password.length < 6)       { setError("Password must be at least 6 chars."); setLoading(false); return; }
        const { data, error: e2 } = await supabase.auth.signUp({
          email: form.email, password: form.password, options: { data: { full_name: form.name } }
        });
        if (e2) throw e2;
        if (data.user) {
          await supabase.from("profiles").upsert({
            id: data.user.id, email: form.email, full_name: form.name, plan: "free", questions_used: 0
          }, { onConflict: "id", ignoreDuplicates: true });
        }
        if (data.session) { goAfterLogin(); return; }
        setSuccess("Account created! Check your email to confirm, then sign in.");
        setTab("login");
      } else {
        const { data, error: e2 } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (e2) throw e2;
        if (!data.session) {
          setError("Please confirm your email first. Check your inbox.");
          setLoading(false); return;
        }
        goAfterLogin();
      }
    } catch (err) { setError(err.message || "Something went wrong."); }
    finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true); setError("");
    const dest = redirectRef.current;
    // Save destination in sessionStorage before OAuth redirect
    // so it survives the full page reload without being in the URL
    try { sessionStorage.setItem("ng_redirect", dest); } catch(e) {}
    const { error: e2 } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: "https://nugens.in.net/auth" }
    });
    if (e2) { setError(e2.message); setGoogleLoading(false); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body,#root{height:100%;font-family:'Plus Jakarta Sans',sans-serif;background:#fff}
        input:focus{outline:none}
        .ai{width:100%;padding:10px 13px;font-size:13.5px;color:#0a0a0a;font-family:'Plus Jakarta Sans',sans-serif;background:#fafafa;border:1.5px solid #ececec;border-radius:9px;transition:border-color 0.15s}
        .ai:focus{border-color:#0a0a0a;background:#fff}
        .at{flex:1;padding:8px 0;border:none;border-radius:8px;font-family:'Plus Jakarta Sans',sans-serif;font-weight:600;font-size:12.5px;cursor:pointer;transition:all 0.13s}
        .gb{width:100%;padding:10px 0;background:#fff;border:1.5px solid #e8e8e8;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;font-size:13.5px;font-family:'Plus Jakarta Sans',sans-serif;font-weight:500;color:#374151;transition:all 0.15s}
        .gb:hover{border-color:#9ca3af;box-shadow:0 2px 8px rgba(0,0,0,0.05)}
        .pr{display:flex;align-items:center;gap:12px;padding:13px 20px;border-bottom:1px solid rgba(255,255,255,0.06)}
        .pr:last-child{border-bottom:none}
        @keyframes fu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        .fu{animation:fu 0.4s ease both}
        .al{display:none}
        @media(min-width:860px){.al{display:flex!important}}
      `}</style>
      <div style={{ minHeight:"100vh", display:"flex" }}>
        {/* LEFT */}
        <div className="al" style={{ width:"42%", flexShrink:0, background:"#0a0a0a", flexDirection:"column", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", inset:0, backgroundImage:`linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)`, backgroundSize:"44px 44px", pointerEvents:"none" }} />
          <div style={{ position:"absolute", top:-80, left:-80, width:320, height:320, borderRadius:"50%", background:PINK, filter:"blur(120px)", opacity:0.08, pointerEvents:"none" }} />
          <div style={{ position:"absolute", bottom:-60, right:-60, width:260, height:260, borderRadius:"50%", background:"#7c3aed", filter:"blur(100px)", opacity:0.07, pointerEvents:"none" }} />
          <div style={{ position:"relative", zIndex:2, display:"flex", flexDirection:"column", height:"100%", padding:"48px 36px" }}>
            <Link to="/" style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none", marginBottom:"auto" }}>
              <img src={NG_LOGO} alt="Nugens" style={{ width:38, height:38, borderRadius:9, objectFit:"cover" }} />
              <span style={{ fontWeight:800, fontSize:18, color:"#fff", letterSpacing:"-0.025em" }}>Nugens</span>
            </Link>
            <div style={{ marginBottom:36 }} className="fu">
              <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 10px", border:"1px solid rgba(232,24,93,0.3)", borderRadius:6, background:"rgba(232,24,93,0.08)", marginBottom:18 }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:PINK }} />
                <span style={{ fontSize:11, fontWeight:600, color:PINK, letterSpacing:"0.06em", textTransform:"uppercase" }}>One account · All products</span>
              </div>
              <h1 style={{ fontSize:"clamp(22px,2.8vw,30px)", fontWeight:800, color:"#fff", lineHeight:1.2, letterSpacing:"-0.03em", marginBottom:12 }}>One login.<br />Every Nugens product.</h1>
              <p style={{ fontSize:13.5, color:"rgba(255,255,255,0.4)", lineHeight:1.72, maxWidth:280 }}>Sign in once — access Gen-E, HyperX, DigiHub and Units without logging in again.</p>
            </div>
            <div style={{ border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, overflow:"hidden", background:"rgba(255,255,255,0.02)", marginBottom:28 }} className="fu">
              {PRODUCTS.map(p => (
                <div key={p.label} className="pr">
                  <div style={{ width:32, height:32, borderRadius:7, background:`${p.color}18`, border:`1px solid ${p.color}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, color:p.color, flexShrink:0 }}>{p.icon}</div>
                  <div><div style={{ fontSize:13, fontWeight:700, color:"#e8e8e8" }}>{p.label}</div><div style={{ fontSize:11.5, color:"rgba(255,255,255,0.3)" }}>{p.sub}</div></div>
                </div>
              ))}
            </div>
            <p style={{ fontSize:11.5, color:"rgba(255,255,255,0.2)", lineHeight:1.6 }}>Free plan · No credit card needed · Upgrade anytime</p>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"32px 24px", background:"#fff", minWidth:0 }}>
          <div style={{ width:"100%", maxWidth:400 }} className="fu">
            <div style={{ marginBottom:28, textAlign:"center" }}>
              <Link to="/" style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", gap:9, textDecoration:"none" }}>
                <img src={NG_LOGO} alt="Nugens" style={{ width:34, height:34, borderRadius:8, objectFit:"cover" }} />
                <span style={{ fontWeight:800, fontSize:17, color:"#0a0a0a", letterSpacing:"-0.025em" }}>Nugens</span>
              </Link>
              <div style={{ fontSize:13, color:"#9ca3af", marginTop:8 }}>{tab==="login"?"Welcome back":"Create your free account"}</div>
            </div>
            <div style={{ background:"#fff", border:"1.5px solid #f0f0f0", borderRadius:16, padding:"28px 28px 24px", boxShadow:"0 4px 32px rgba(0,0,0,0.05)" }}>
              <div style={{ display:"flex", background:"#f3f4f6", borderRadius:10, padding:3, marginBottom:22 }}>
                {[["login","Sign In"],["signup","Create Account"]].map(([t,l]) => (
                  <button key={t} className="at" onClick={() => { setTab(t); setError(""); setSuccess(""); }} style={{ background:tab===t?"#fff":"transparent", boxShadow:tab===t?"0 1px 6px rgba(0,0,0,0.08)":"none", color:tab===t?"#0a0a0a":"#9ca3af" }}>{l}</button>
                ))}
              </div>
              <button className="gb" onClick={handleGoogle} disabled={googleLoading}>
                <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                {googleLoading ? "Connecting…" : "Continue with Google"}
              </button>
              <div style={{ display:"flex", alignItems:"center", gap:10, margin:"16px 0" }}>
                <div style={{ flex:1, height:1, background:"#f0f0f0" }}/><span style={{ fontSize:11, color:"#d1d5db" }}>or</span><div style={{ flex:1, height:1, background:"#f0f0f0" }}/>
              </div>
              <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
                {tab==="signup" && <div><label style={{ fontSize:11.5, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>Full Name</label><input className="ai" name="name" value={form.name} onChange={handleChange} placeholder="Aarav Kumar" required /></div>}
                <div><label style={{ fontSize:11.5, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>Email Address</label><input className="ai" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@email.com" required /></div>
                <div><label style={{ fontSize:11.5, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>Password</label><input className="ai" name="password" type="password" value={form.password} onChange={handleChange} placeholder="••••••••" required /></div>
                {tab==="signup" && <div><label style={{ fontSize:11.5, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>Confirm Password</label><input className="ai" name="confirm" type="password" value={form.confirm} onChange={handleChange} placeholder="••••••••" required /></div>}
                {error   && <div style={{ background:"#fff5f8", border:"1px solid #ffd0de", borderRadius:8, padding:"10px 13px", fontSize:12.5, color:PINK, lineHeight:1.5 }}>⚠️ {error}</div>}
                {success && <div style={{ background:"#f0fff4", border:"1px solid #b2f5c8", borderRadius:8, padding:"10px 13px", fontSize:12.5, color:"#1a7a3c", lineHeight:1.5 }}>✅ {success}</div>}
                <button type="submit" disabled={loading} style={{ width:"100%", padding:"11px 0", background:loading?"#f3f4f6":"#0a0a0a", border:"none", borderRadius:10, fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:13.5, color:loading?"#9ca3af":"#fff", cursor:loading?"not-allowed":"pointer" }}>
                  {loading?"Please wait…":tab==="login"?"Sign In →":"Create Account →"}
                </button>
              </form>
              {tab==="login" && (
                <div style={{ textAlign:"center", marginTop:14, fontSize:12.5, color:"#9ca3af" }}>
                  New to Nugens?{" "}
                  <button onClick={() => setTab("signup")} style={{ background:"none", border:"none", color:PINK, fontWeight:700, cursor:"pointer", fontSize:12.5, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Create a free account</button>
                </div>
              )}
            </div>
            <div style={{ textAlign:"center", marginTop:16, fontSize:11.5, color:"#c0c0c0" }}>Free plan · 20 queries · Upgrade from ₹99/mo</div>
          </div>
        </div>
      </div>
    </>
  );
}
