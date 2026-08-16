import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useGeneTool } from "../lib/useGeneTool";
import ToolOutput from "../components/ToolOutput";

const PINK = "#e8185d";
const B    = "#1e1e1e";

export default function InterviewAI() {
  const [token, setToken] = useState("");
  const [role,  setRole]  = useState("");
  const [level, setLevel] = useState("mid-level");
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
          <span style={{fontSize:10,fontWeight:700,color:PINK,textTransform:"uppercase",letterSpacing:"0.08em"}}>◷ Interview AI</span>
        </div>
        <h1 style={{fontWeight:800,fontSize:"clamp(20px,2.5vw,26px)",color:"#fff",letterSpacing:"-0.03em",marginBottom:6}}>Interview Questions Generator</h1>
        <p style={{fontSize:13.5,color:"#555"}}>Get screening, technical, behavioral and case study questions — with evaluation rubric.</p>
      </div>

      {!output ? (
        <div style={{background:"#111",border:`1px solid ${B}`,borderRadius:14,padding:28,maxWidth:540}}>
          <div style={{display:"flex",flexDirection:"column",gap:15}}>
            <div>
              <label style={{fontSize:11.5,fontWeight:600,color:"#555",display:"block",marginBottom:5}}>Role to interview for *</label>
              <input style={inp} value={role} onChange={e=>setRole(e.target.value)} placeholder="e.g. Senior Product Manager, Full Stack Developer, Growth Marketer"/>
            </div>
            <div>
              <label style={{fontSize:11.5,fontWeight:600,color:"#555",display:"block",marginBottom:5}}>Experience Level</label>
              <select style={inp} value={level} onChange={e=>setLevel(e.target.value)}>
                {["fresher","junior (1-2 years)","mid-level (3-5 years)","senior (5-8 years)","lead/manager (8+ years)"].map(l=><option key={l}>{l}</option>)}
              </select>
            </div>
            <button onClick={()=>run("interview_questions",{role,level},token)} disabled={loading||!role}
              style={{padding:"12px 0",borderRadius:10,border:"none",background:PINK,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginTop:4}}>
              Generate Interview Kit →
            </button>
          </div>
        </div>
      ) : (
        <ToolOutput output={output} loading={loading} error={error} onReset={reset}/>
      )}
    </div>
  );
}
