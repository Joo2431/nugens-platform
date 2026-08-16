import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useGeneTool } from "../lib/useGeneTool";
import ToolOutput from "../components/ToolOutput";

const PINK = "#e8185d";
const B    = "#1e1e1e";

export default function SkillGap() {
  const [token,  setToken]  = useState("");
  const [form,   setForm]   = useState({ currentRole:"", targetRole:"", currentSkills:"" });
  const { output, loading, error, run, reset } = useGeneTool();

  useEffect(() => {
    supabase.auth.getSession().then(({ data:{ session } }) => setToken(session?.access_token || ""));
  }, []);

  const inp = { width:"100%", padding:"10px 13px", background:"#111", border:`1px solid ${B}`, borderRadius:9, color:"#e8e8e8", fontSize:13.5, fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none" };

  return (
    <div style={{padding:"32px 28px 80px",background:"#09090a",minHeight:"100vh",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'); input:focus,textarea:focus{border-color:${PINK}60!important}`}</style>

      <div style={{marginBottom:28}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"3px 10px",borderRadius:5,background:`${PINK}10`,border:`1px solid ${PINK}30`,marginBottom:12}}>
          <span style={{fontSize:10,fontWeight:700,color:PINK,textTransform:"uppercase",letterSpacing:"0.08em"}}>◈ Skill Gap Analyzer</span>
        </div>
        <h1 style={{fontWeight:800,fontSize:"clamp(20px,2.5vw,28px)",color:"#fff",letterSpacing:"-0.03em",marginBottom:6}}>Find Your Skill Gaps</h1>
        <p style={{fontSize:13.5,color:"#555"}}>Compare where you are vs where you want to be. Get a clear learning path.</p>
      </div>

      {!output ? (
        <div style={{background:"#111",border:`1px solid ${B}`,borderRadius:14,padding:28,maxWidth:580}}>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div>
              <label style={{fontSize:11.5,fontWeight:600,color:"#555",display:"block",marginBottom:5}}>Current Role / Level</label>
              <input style={inp} value={form.currentRole} onChange={e=>setForm(p=>({...p,currentRole:e.target.value}))} placeholder="e.g. Junior Software Engineer, 1 year experience"/>
            </div>
            <div>
              <label style={{fontSize:11.5,fontWeight:600,color:"#555",display:"block",marginBottom:5}}>Target Role</label>
              <input style={inp} value={form.targetRole} onChange={e=>setForm(p=>({...p,targetRole:e.target.value}))} placeholder="e.g. Product Manager at a Series B startup"/>
            </div>
            <div>
              <label style={{fontSize:11.5,fontWeight:600,color:"#555",display:"block",marginBottom:5}}>Current Skills (comma separated)</label>
              <textarea style={{...inp,height:80,resize:"vertical"}} value={form.currentSkills} onChange={e=>setForm(p=>({...p,currentSkills:e.target.value}))} placeholder="e.g. React, Node.js, SQL, communication, project management basics"/>
            </div>
            <button onClick={()=>run("skill_gap", form, token)} disabled={loading||!form.currentRole||!form.targetRole}
              style={{padding:"12px 0",borderRadius:10,border:"none",background:PINK,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              Analyze My Skill Gap →
            </button>
          </div>
        </div>
      ) : (
        <ToolOutput output={output} loading={loading} error={error} onReset={reset}/>
      )}
    </div>
  );
}
