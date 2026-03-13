import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

const PURPLE = "#7c3aed";
const PINK   = "#e8185d";

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.from || "/";

  const [tab,           setTab]           = useState("login");
  const [form,          setForm]          = useState({ name:"", email:"", password:"", confirm:"" });
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error,         setError]         = useState("");
  const [success,       setSuccess]       = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate(returnTo, { replace: true });
    });
  }, []); // eslint-disable-line

  const handleChange = (e) => { setForm(f => ({ ...f, [e.target.name]: e.target.value })); setError(""); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      if (tab === "signup") {
        if (!form.name.trim())              { setError("Please enter your full name.");        setLoading(false); return; }
        if (form.password !== form.confirm) { setError("Passwords do not match.");             setLoading(false); return; }
        if (form.password.length < 6)       { setError("Password must be at least 6 chars."); setLoading(false); return; }
        const { data, error: e2 } = await supabase.auth.signUp({ email: form.email, password: form.password, options: { data: { full_name: form.name } } });
        if (e2) throw e2;
        if (data.user) await supabase.from("profiles").upsert({ id: data.user.id, email: form.email, full_name: form.name, plan: "free", questions_used: 0 }, { onConflict: "id", ignoreDuplicates: true });
        if (data.session) { navigate(returnTo, { replace: true }); return; }
        setSuccess("Account created! Check your email to confirm, then sign in.");
        setTab("login");
      } else {
        const { data, error: e2 } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (e2) throw e2;
        if (!data.session) { setError("Please confirm your email before signing in. Check your inbox."); setLoading(false); return; }
        navigate(returnTo, { replace: true });
      }
    } catch (err) { setError(err.message || "Something went wrong."); }
    finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true); setError("");
    const { error: e2 } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/` } });
    if (e2) { setError(e2.message); setGoogleLoading(false); }
  };

  const inp = { width:"100%", padding:"10px 13px", border:"1px solid #1e1e2e", borderRadius:9, fontSize:13.5, color:"#fff", fontFamily:"inherit", background:"#080814" };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        html, body, #root { height:100%; font-family:'Plus Jakarta Sans',sans-serif; background:#080814; }
        input:focus { outline:none; border-color:${PURPLE}!important; }
      `}</style>
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#080814", padding:20, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-100, left:"50%", transform:"translateX(-50%)", width:600, height:400, borderRadius:"50%", background:PURPLE, filter:"blur(160px)", opacity:0.05, pointerEvents:"none" }} />
        <div style={{ width:"100%", maxWidth:400 }}>
          <div style={{ textAlign:"center", marginBottom:32 }}>
            <a href="https://nugens.in.net" style={{ textDecoration:"none", display:"inline-flex", alignItems:"center", gap:8 }}>
              <img src="/ng-logo.jpg" alt="NuGens" style={{ width:32, height:32, borderRadius:7, objectFit:"cover" }} />
            </a>
            <div style={{ fontWeight:800, fontSize:28, color:"#fff", letterSpacing:"-0.04em", marginTop:8 }}>Hyper<span style={{ color:PURPLE }}>X</span></div>
            <div style={{ fontSize:12.5, color:"#444", marginTop:4 }}>Professional Learning Platform by NuGens</div>
          </div>

          <div style={{ background:"#0d0d1a", border:"1px solid #1e1e2e", borderRadius:18, padding:"28px 28px 24px", boxShadow:"0 8px 40px rgba(0,0,0,0.4)" }}>
            <div style={{ display:"flex", background:"#080814", borderRadius:10, padding:3, marginBottom:24 }}>
              {[["login","Sign In"],["signup","Create Account"]].map(([t,l]) => (
                <button key={t} onClick={() => { setTab(t); setError(""); setSuccess(""); }} style={{ flex:1, padding:"8px 0", border:"none", borderRadius:8, background:tab===t?"#1a1a2a":"transparent", boxShadow:tab===t?"0 1px 6px rgba(0,0,0,0.3)":"none", fontFamily:"inherit", fontWeight:700, fontSize:12.5, color:tab===t?PURPLE:"#444", cursor:"pointer" }}>{l}</button>
              ))}
            </div>

            <button onClick={handleGoogle} disabled={googleLoading} style={{ width:"100%", padding:"10px 0", background:"#080814", border:"1px solid #1e1e2e", borderRadius:10, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, fontSize:13.5, fontFamily:"inherit", fontWeight:500, color:"#aaa", marginBottom:18 }}>
              <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              {googleLoading ? "Connecting…" : "Continue with Google"}
            </button>

            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
              <div style={{ flex:1, height:1, background:"#1a1a2a" }}/><span style={{ fontSize:11, color:"#333" }}>or</span><div style={{ flex:1, height:1, background:"#1a1a2a" }}/>
            </div>

            <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:13 }}>
              {tab === "signup" && <div><label style={{ fontSize:11.5, fontWeight:600, color:"#555", display:"block", marginBottom:5 }}>Full Name</label><input name="name" value={form.name} onChange={handleChange} placeholder="Aarav Kumar" required style={inp} /></div>}
              <div><label style={{ fontSize:11.5, fontWeight:600, color:"#555", display:"block", marginBottom:5 }}>Email</label><input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@email.com" required style={inp} /></div>
              <div><label style={{ fontSize:11.5, fontWeight:600, color:"#555", display:"block", marginBottom:5 }}>Password</label><input name="password" type="password" value={form.password} onChange={handleChange} placeholder="••••••••" required style={inp} /></div>
              {tab === "signup" && <div><label style={{ fontSize:11.5, fontWeight:600, color:"#555", display:"block", marginBottom:5 }}>Confirm Password</label><input name="confirm" type="password" value={form.confirm} onChange={handleChange} placeholder="••••••••" required style={inp} /></div>}
              {error   && <div style={{ background:PINK+"15", border:`1px solid ${PINK}30`, borderRadius:8, padding:"9px 12px", fontSize:12.5, color:PINK }}>⚠️ {error}</div>}
              {success && <div style={{ background:"#16a34a18", border:"1px solid #16a34a30", borderRadius:8, padding:"9px 12px", fontSize:12.5, color:"#16a34a" }}>✅ {success}</div>}
              <button type="submit" disabled={loading} style={{ width:"100%", padding:"11px 0", background:loading?"#1a1a2a":PURPLE, border:"none", borderRadius:10, fontFamily:"inherit", fontWeight:700, fontSize:13, color:loading?"#333":"#fff", cursor:loading?"not-allowed":"pointer" }}>
                {loading ? "Please wait…" : tab === "login" ? "Sign In →" : "Create Account →"}
              </button>
            </form>
            {tab === "login" && <div style={{ textAlign:"center", marginTop:14, fontSize:12, color:"#444" }}>No account? <button onClick={() => setTab("signup")} style={{ background:"none", border:"none", color:PURPLE, fontWeight:600, cursor:"pointer", fontSize:12 }}>Sign up free</button></div>}
          </div>
          <div style={{ textAlign:"center", marginTop:16, fontSize:11.5, color:"#333" }}>Part of the <a href="https://nugens.in.net" style={{ color:"#555", textDecoration:"none" }}>NuGens ecosystem</a></div>
        </div>
      </div>
    </>
  );
}
