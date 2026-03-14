import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useGeneTool } from "../lib/useGeneTool";
import ToolOutput from "../components/ToolOutput";

const PINK = "#e8185d";
const B    = "#1e1e1e";

export default function WorkforcePlanning() {
  const [token, setToken] = useState("");
  const [form, setForm] = useState({ companyStage:"early-stage startup", currentTeam:"", goal:"" });
  const { output, loading, error, run, reset } = useGeneTool();
  const STAGES = ["pre-seed startup","early-stage startup","Series A startup","Series B scaleup","mid-size company","enterprise"];

  useEffect(() => {
    supabase.auth.getSession().then(({ data:{ session } }) => setToken(session?.access_token || ""));
  }, []);

  const inp = { width:"100%", padding:"10px 13px", background:"#111", border:`1px solid ${B}`, borderRadius:9, color:"#e8e8e8", fontSize:13.5, fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none" };

  return (
    <div style={{padding:"32px 28px 80px",background:"#09090a",minHeight:"100vh",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'); input:focus,textarea:focus,select:focus{border-color:${PINK}60!important;outline:none}`}</style>

      <div style={{marginBottom:28}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"3px 10px",borderRadius:5,background:`${PINK}10`,border:`1px solid ${PINK}30`,marginBottom:12}}>
          <span style={{fontSize:10,fontWeight:700,color:PINK,textTransform:"uppercase",letterSpacing:"0.08em"}}>⬡ Workforce Planner</span>
        </div>
        <h1 style={{fontWeight:800,fontSize:"clamp(20px,2.5vw,26px)",color:"#fff",letterSpacing:"-0.03em",marginBottom:6}}>Workforce Planning AI</h1>
        <p style={{fontSize:13.5,color:"#555"}}>Get a data-driven hiring roadmap for your company stage and goals.</p>
      </div>

      {!output ? (
        <div style={{background:"#111",border:`1px solid ${B}`,borderRadius:14,padding:28,maxWidth:560}}>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div>
              <label style={{fontSize:11.5,fontWeight:600,color:"#555",display:"block",marginBottom:5}}>Company Stage</label>
              <select style={inp} value={form.companyStage} onChange={e=>setForm(p=>({...p,companyStage:e.target.value}))}>
                {STAGES.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:11.5,fontWeight:600,color:"#555",display:"block",marginBottom:5}}>Current Team</label>
              <input style={inp} value={form.currentTeam} onChange={e=>setForm(p=>({...p,currentTeam:e.target.value}))} placeholder="e.g. 2 developers, 1 designer, 1 founder"/>
            </div>
            <div>
              <label style={{fontSize:11.5,fontWeight:600,color:"#555",display:"block",marginBottom:5}}>Growth Goal</label>
              <textarea style={{...inp,height:70,resize:"vertical"}} value={form.goal} onChange={e=>setForm(p=>({...p,goal:e.target.value}))} placeholder="e.g. Scale from 10 to 100 customers in 12 months, launch in 3 cities"/>
            </div>
            <button onClick={()=>run("workforce_planning", form, token)} disabled={loading||!form.currentTeam||!form.goal}
              style={{padding:"12px 0",borderRadius:10,border:"none",background:PINK,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              Build Workforce Plan →
            </button>
          </div>
        </div>
      ) : (
        <ToolOutput output={output} loading={loading} error={error} onReset={reset}/>
      )}
    </div>
  );
}
