import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useGeneTool } from "../lib/useGeneTool";
import ToolOutput from "../components/ToolOutput";

const PINK = "#e8185d";
const B    = "#1e1e1e";

export default function CareerRoadmap() {
  const [token, setToken] = useState("");
  const [form,  setForm]  = useState({ goal:"", current:"", timeline:"12 months" });
  const { output, loading, error, run, reset } = useGeneTool();

  useEffect(() => {
    supabase.auth.getSession().then(({ data:{ session } }) => setToken(session?.access_token || ""));
  }, []);

  const inp = { width:"100%", padding:"10px 13px", background:"#111", border:`1px solid ${B}`, borderRadius:9, color:"#e8e8e8", fontSize:13.5, fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none" };

  return (
    <div style={{padding:"32px 28px 80px",background:"#09090a",minHeight:"100vh",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'); input:focus,textarea:focus,select:focus{border-color:${PINK}60!important;outline:none}`}</style>

      <div style={{marginBottom:28}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"3px 10px",borderRadius:5,background:`${PINK}10`,border:`1px solid ${PINK}30`,marginBottom:12}}>
          <span style={{fontSize:10,fontWeight:700,color:PINK,textTransform:"uppercase",letterSpacing:"0.08em"}}>→ Career Roadmap</span>
        </div>
        <h1 style={{fontWeight:800,fontSize:"clamp(20px,2.5vw,28px)",color:"#fff",letterSpacing:"-0.03em",marginBottom:6}}>Your Personal Career Roadmap</h1>
        <p style={{fontSize:13.5,color:"#555"}}>Get a phase-by-phase plan tailored to your goal and timeline.</p>
      </div>

      {!output ? (
        <div style={{background:"#111",border:`1px solid ${B}`,borderRadius:14,padding:28,maxWidth:580}}>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div>
              <label style={{fontSize:11.5,fontWeight:600,color:"#555",display:"block",marginBottom:5}}>Your Career Goal</label>
              <input style={inp} value={form.goal} onChange={e=>setForm(p=>({...p,goal:e.target.value}))} placeholder="e.g. Become a UX Designer at a product company"/>
            </div>
            <div>
              <label style={{fontSize:11.5,fontWeight:600,color:"#555",display:"block",marginBottom:5}}>Current Situation</label>
              <textarea style={{...inp,height:70,resize:"vertical"}} value={form.current} onChange={e=>setForm(p=>({...p,current:e.target.value}))} placeholder="e.g. Frontend developer with 2 years experience, some design exposure"/>
            </div>
            <div>
              <label style={{fontSize:11.5,fontWeight:600,color:"#555",display:"block",marginBottom:5}}>Timeline</label>
              <select style={inp} value={form.timeline} onChange={e=>setForm(p=>({...p,timeline:e.target.value}))}>
                {["3 months","6 months","12 months","18 months","2 years"].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <button onClick={()=>run("career_roadmap", form, token)} disabled={loading||!form.goal||!form.current}
              style={{padding:"12px 0",borderRadius:10,border:"none",background:PINK,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              Generate My Roadmap →
            </button>
          </div>
        </div>
      ) : (
        <ToolOutput output={output} loading={loading} error={error} onReset={reset}/>
      )}
    </div>
  );
}
