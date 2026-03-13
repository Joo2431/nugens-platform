import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const BLUE = "#0284c7";
const B    = "#1a2030";

export default function AuthPage() {
  const [mode, setMode]       = useState("login");
  const [email, setEmail]     = useState("");
  const [password, setPass]   = useState("");
  const [name, setName]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const navigate = useNavigate();

  const handle = async () => {
    setError(""); setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({ email, password, options:{ data:{ full_name:name } } });
        if (error) throw error;
        navigate("/");
      }
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", minHeight:"100vh", background:"#06101a", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .auth-input { width:100%; padding:11px 14px; background:#080f1a; border:1px solid ${B}; border-radius:9px; color:#ddd; font-size:14px; font-family:'Plus Jakarta Sans',sans-serif; outline:none; }
        .auth-input:focus { border-color:${BLUE}60; }
        .auth-input::placeholder { color:#334; }
        .auth-btn { width:100%; padding:12px; background:${BLUE}; color:#fff; border:none; border-radius:9px; font-size:15px; font-weight:700; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; transition:opacity 0.15s; }
        .auth-btn:hover { opacity:0.88; }
        .auth-btn:disabled { opacity:0.4; cursor:not-allowed; }
      `}</style>

      {/* Background glow */}
      <div style={{ position:"fixed", top:"20%", left:"50%", transform:"translateX(-50%)", width:500, height:300, background:BLUE, filter:"blur(140px)", opacity:0.06, pointerEvents:"none" }} />

      <div style={{ width:"100%", maxWidth:420, position:"relative", zIndex:2 }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ fontWeight:800, fontSize:28, color:"#fff", letterSpacing:"-0.04em", marginBottom:6 }}>
            Digi<span style={{ color:BLUE }}>Hub</span>
          </div>
          <div style={{ fontSize:13.5, color:"#445" }}>Digital marketing platform by NuGens</div>
        </div>

        <div style={{ background:"#080f1a", border:`1px solid ${B}`, borderRadius:16, padding:32 }}>
          {/* Tab */}
          <div style={{ display:"flex", background:"#06101a", borderRadius:10, padding:3, gap:2, marginBottom:28 }}>
            {["login","signup"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }} style={{ flex:1, padding:"8px 0", borderRadius:8, border:"none", fontSize:13.5, fontWeight:600, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", background:mode===m?"#080f1a":  "transparent", color:mode===m?"#fff":"#445", boxShadow:mode===m?"0 1px 6px rgba(0,0,0,0.3)":"none", transition:"all 0.14s" }}>
                {m === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {mode === "signup" && (
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:"#445", display:"block", marginBottom:5 }}>Full name</label>
                <input className="auth-input" value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name" />
              </div>
            )}
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#445", display:"block", marginBottom:5 }}>Email</label>
              <input className="auth-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com" />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#445", display:"block", marginBottom:5 }}>Password</label>
              <input className="auth-input" type="password" value={password} onChange={e=>setPass(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&handle()} />
            </div>

            {error && <div style={{ fontSize:12.5, color:"#f87171", background:"#2d0a0a", border:"1px solid #4d1515", borderRadius:8, padding:"10px 12px" }}>{error}</div>}

            <button className="auth-btn" onClick={handle} disabled={loading || !email || !password}>
              {loading ? "Please wait..." : mode === "login" ? "Sign in →" : "Create account →"}
            </button>
          </div>

          <p style={{ fontSize:12, color:"#334", textAlign:"center", marginTop:20 }}>
            By continuing, you agree to NuGens{" "}
            <a href="/terms" style={{ color:BLUE, textDecoration:"none" }}>Terms</a> and{" "}
            <a href="/privacy" style={{ color:BLUE, textDecoration:"none" }}>Privacy Policy</a>
          </p>
        </div>

        <p style={{ textAlign:"center", marginTop:20, fontSize:13, color:"#334" }}>
          Part of the <a href="https://nugens.in.net" style={{ color:BLUE, textDecoration:"none", fontWeight:600 }}>NuGens</a> ecosystem
        </p>
      </div>
    </div>
  );
}
