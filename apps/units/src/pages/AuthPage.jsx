import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const GOLD = "#d4a843";
const B    = "#1c1a14";

export default function AuthPage() {
  const [mode, setMode]   = useState("login");
  const [email, setEmail] = useState("");
  const [pass, setPass]   = useState("");
  const [name, setName]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handle = async () => {
    setError(""); setLoading(true);
    try {
      if (mode==="login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password:pass });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password:pass, options:{ data:{ full_name:name } } });
        if (error) throw error;
      }
      navigate("/");
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", minHeight:"100vh", background:"#0a0805", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .au-in{width:100%;padding:11px 14px;background:#0f0c08;border:1px solid ${B};border-radius:9px;color:#c8b87a;font-size:14px;font-family:'Plus Jakarta Sans',sans-serif;outline:none;}
        .au-in:focus{border-color:${GOLD}50;}
        .au-in::placeholder{color:#2a2010;}
        .au-btn{width:100%;padding:12px;background:${GOLD};color:#0a0805;border:none;border-radius:9px;font-size:15px;font-weight:800;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:opacity 0.15s;}
        .au-btn:hover{opacity:0.88;}
        .au-btn:disabled{opacity:0.4;cursor:not-allowed;}
      `}</style>

      <div style={{ position:"fixed", top:"25%", left:"50%", transform:"translateX(-50%)", width:500, height:300, background:GOLD, filter:"blur(150px)", opacity:0.04, pointerEvents:"none" }} />

      <div style={{ width:"100%", maxWidth:420, position:"relative", zIndex:2 }}>
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ fontWeight:800, fontSize:13, letterSpacing:"0.14em", textTransform:"uppercase", color:"#4a4030", marginBottom:8 }}>The Wedding</div>
          <div style={{ fontWeight:800, fontSize:30, color:GOLD, letterSpacing:"-0.04em", lineHeight:1 }}>Unit</div>
          <div style={{ fontSize:13, color:"#4a4030", marginTop:8 }}>Production platform by NuGens</div>
        </div>

        <div style={{ background:"#0f0c08", border:`1px solid ${B}`, borderRadius:16, padding:32 }}>
          <div style={{ display:"flex", background:"#0a0805", borderRadius:10, padding:3, gap:2, marginBottom:26 }}>
            {["login","signup"].map(m=>(
              <button key={m} onClick={()=>{setMode(m);setError("");}} style={{ flex:1, padding:"8px 0", borderRadius:8, border:"none", fontSize:13.5, fontWeight:600, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", background:mode===m?"#0f0c08":"transparent", color:mode===m?"#e8d5a0":"#4a4030", boxShadow:mode===m?"0 1px 6px rgba(0,0,0,0.4)":"none", transition:"all 0.14s" }}>
                {m==="login"?"Sign in":"Create account"}
              </button>
            ))}
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {mode==="signup"&&(
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:"#4a4030", display:"block", marginBottom:5 }}>Full name</label>
                <input className="au-in" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" />
              </div>
            )}
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#4a4030", display:"block", marginBottom:5 }}>Email</label>
              <input className="au-in" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com" />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#4a4030", display:"block", marginBottom:5 }}>Password</label>
              <input className="au-in" type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&handle()} />
            </div>
            {error&&<div style={{ fontSize:12.5, color:"#f87171", background:"#2d0a0a", border:"1px solid #4d1515", borderRadius:8, padding:"10px 12px" }}>{error}</div>}
            <button className="au-btn" onClick={handle} disabled={loading||!email||!pass}>
              {loading?"Please wait...":mode==="login"?"Sign in →":"Create account →"}
            </button>
          </div>

          <p style={{ fontSize:12, color:"#3a3020", textAlign:"center", marginTop:20 }}>
            By continuing you agree to NuGens <a href="/terms" style={{ color:GOLD, textDecoration:"none" }}>Terms</a> & <a href="/privacy" style={{ color:GOLD, textDecoration:"none" }}>Privacy</a>
          </p>
        </div>

        <p style={{ textAlign:"center", marginTop:20, fontSize:13, color:"#3a3020" }}>
          Part of the <a href="https://nugens.in.net" style={{ color:GOLD, textDecoration:"none", fontWeight:700 }}>NuGens</a> ecosystem
        </p>
      </div>
    </div>
  );
}
