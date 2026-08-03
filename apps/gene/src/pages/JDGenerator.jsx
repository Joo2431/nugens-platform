import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useGeneTool } from "../lib/useGeneTool";
import ToolOutput from "../components/ToolOutput";

const PINK = "#e8185d";
const B    = "#1e1e1e";

export default function JDGenerator() {
  const [token, setToken] = useState("");
  const [role,  setRole]  = useState("");
  const [type,  setType]  = useState("tech startup");
  const [exp,   setExp]   = useState("2-4 years");
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
          <span style={{fontSize:10,fontWeight:700,color:PINK,textTransform:"uppercase",letterSpacing:"0.08em"}}>▤ JD Generator</span>
        </div>
        <h1 style={{fontWeight:800,fontSize:"clamp(20px,2.5vw,26px)",color:"#fff",letterSpacing:"-0.03em",marginBottom:6}}>Job Description Generator</h1>
        <p style={{fontSize:13.5,color:"#555"}}>Generate a complete JD with responsibilities, skills, salary range and 10 interview questions — instantly.</p>
      </div>

      {!output ? (
        <div style={{background:"#111",border:`1px solid ${B}`,borderRadius:14,padding:28,maxWidth:540}}>
          <div style={{display:"flex",flexDirection:"column",gap:15}}>
            <div>
              <label style={{fontSize:11.5,fontWeight:600,color:"#555",display:"block",marginBottom:5}}>Role you're hiring for *</label>
              <input style={inp} value={role} onChange={e=>setRole(e.target.value)} placeholder="e.g. Senior React Developer, Growth Marketer, UI/UX Designer"/>
            </div>
            <div>
              <label style={{fontSize:11.5,fontWeight:600,color:"#555",display:"block",marginBottom:5}}>Company Type</label>
              <select style={inp} value={type} onChange={e=>setType(e.target.value)}>
                {["tech startup","Series A/B company","enterprise","agency","e-commerce","healthcare","fintech","edtech"].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:11.5,fontWeight:600,color:"#555",display:"block",marginBottom:5}}>Experience Level</label>
              <select style={inp} value={exp} onChange={e=>setExp(e.target.value)}>
                {["0-1 years (fresher)","1-2 years","2-4 years","4-7 years","7-10 years","10+ years (senior leadership)"].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <button onClick={()=>run("jd_generator",{role,companyType:type,experience:exp},token)} disabled={loading||!role}
              style={{padding:"12px 0",borderRadius:10,border:"none",background:PINK,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginTop:4}}>
              Generate JD + Interview Questions →
            </button>
          </div>
        </div>
      ) : (
        <ToolOutput output={output} loading={loading} error={error} onReset={reset}/>
      )}
    </div>
  );
}
