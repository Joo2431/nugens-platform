import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useGeneTool } from "../lib/useGeneTool";
import ToolOutput from "../components/ToolOutput";

const PINK = "#e8185d";
const B    = "#1e1e1e";

const POPULAR_ROLES = ["React Developer","Product Manager","Data Scientist","DevOps Engineer","UI/UX Designer","Digital Marketing Manager","Sales Executive","HR Business Partner","Node.js Developer","Business Analyst"];

export default function SalaryBenchmark() {
  const [token,    setToken]    = useState("");
  const [role,     setRole]     = useState("");
  const [location, setLocation] = useState("Bangalore");
  const [industry, setIndustry] = useState("technology");
  const { output, loading, error, run, reset } = useGeneTool();

  useEffect(() => {
    supabase.auth.getSession().then(({ data:{ session } }) => setToken(session?.access_token || ""));
  }, []);

  const inp = { width:"100%", padding:"10px 13px", background:"#111", border:`1px solid ${B}`, borderRadius:9, color:"#e8e8e8", fontSize:13.5, fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none" };

  return (
    <div style={{padding:"32px 28px 80px",background:"#09090a",minHeight:"100vh",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'); input:focus,select:focus{border-color:${PINK}60!important;outline:none}`}</style>

      <div style={{marginBottom:28}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"3px 10px",borderRadius:5,background:`${PINK}10`,border:`1px solid ${PINK}30`,marginBottom:12}}>
          <span style={{fontSize:10,fontWeight:700,color:PINK,textTransform:"uppercase",letterSpacing:"0.08em"}}>₹ Salary Benchmark</span>
        </div>
        <h1 style={{fontWeight:800,fontSize:"clamp(20px,2.5vw,26px)",color:"#fff",letterSpacing:"-0.03em",marginBottom:6}}>Salary Benchmark AI</h1>
        <p style={{fontSize:13.5,color:"#555"}}>Real salary ranges for Indian market by experience tier. Know what to offer — or ask for.</p>
      </div>

      {!output ? (
        <>
          <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:20}}>
            <div style={{fontSize:11.5,fontWeight:600,color:"#444",width:"100%",marginBottom:2}}>Popular roles:</div>
            {POPULAR_ROLES.map(r=>(
              <button key={r} onClick={()=>setRole(r)}
                style={{padding:"5px 12px",background:role===r?`${PINK}15`:"#111",border:`1px solid ${role===r?PINK+"50":B}`,borderRadius:7,fontSize:12,color:role===r?PINK:"#666",cursor:"pointer",fontFamily:"inherit",transition:"all 0.13s"}}>
                {r}
              </button>
            ))}
          </div>

          <div style={{background:"#111",border:`1px solid ${B}`,borderRadius:14,padding:28,maxWidth:540}}>
            <div style={{display:"flex",flexDirection:"column",gap:15}}>
              <div>
                <label style={{fontSize:11.5,fontWeight:600,color:"#555",display:"block",marginBottom:5}}>Role *</label>
                <input style={inp} value={role} onChange={e=>setRole(e.target.value)} placeholder="e.g. React Developer, Product Manager"/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div>
                  <label style={{fontSize:11.5,fontWeight:600,color:"#555",display:"block",marginBottom:5}}>Location</label>
                  <select style={inp} value={location} onChange={e=>setLocation(e.target.value)}>
                    {["Bangalore","Mumbai","Delhi/NCR","Hyderabad","Chennai","Pune","Kolkata","Remote (India)","Tier 2 cities"].map(l=><option key={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{fontSize:11.5,fontWeight:600,color:"#555",display:"block",marginBottom:5}}>Industry</label>
                  <select style={inp} value={industry} onChange={e=>setIndustry(e.target.value)}>
                    {["technology","fintech","e-commerce","healthcare","edtech","startup","enterprise","agency"].map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={()=>run("salary_benchmark",{role,location,industry},token)} disabled={loading||!role}
                style={{padding:"12px 0",borderRadius:10,border:"none",background:PINK,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginTop:4}}>
                Get Salary Data →
              </button>
            </div>
          </div>
        </>
      ) : (
        <ToolOutput output={output} loading={loading} error={error} onReset={reset}/>
      )}
    </div>
  );
}
