import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useGeneTool } from "../lib/useGeneTool";
import ToolOutput from "../components/ToolOutput";

const PINK = "#e8185d";
const B    = "#1e1e1e";

export default function TeamSkillMap() {
  const [token, setToken] = useState("");
  const [goal,  setGoal]  = useState("");
  const [team,  setTeam]  = useState("Name: Rahul | Role: Frontend Dev | Skills: React, HTML, CSS\nName: Priya | Role: Designer | Skills: Figma, Adobe XD\nName: Karthik | Role: Backend Dev | Skills: Node.js, MongoDB");
  const { output, loading, error, run, reset } = useGeneTool();

  useEffect(() => {
    supabase.auth.getSession().then(({ data:{ session } }) => setToken(session?.access_token || ""));
  }, []);

  const inp = { width:"100%", padding:"10px 13px", background:"#111", border:`1px solid ${B}`, borderRadius:9, color:"#e8e8e8", fontSize:13.5, fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none" };

  return (
    <div style={{padding:"32px 28px 80px",background:"#09090a",minHeight:"100vh",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'); input:focus,textarea:focus{border-color:${PINK}60!important;outline:none}`}</style>

      <div style={{marginBottom:28}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"3px 10px",borderRadius:5,background:`${PINK}10`,border:`1px solid ${PINK}30`,marginBottom:12}}>
          <span style={{fontSize:10,fontWeight:700,color:PINK,textTransform:"uppercase",letterSpacing:"0.08em"}}>◈ Team Skill Map</span>
        </div>
        <h1 style={{fontWeight:800,fontSize:"clamp(20px,2.5vw,26px)",color:"#fff",letterSpacing:"-0.03em",marginBottom:6}}>Team Skill Mapping</h1>
        <p style={{fontSize:13.5,color:"#555"}}>Analyze your team's skills, find gaps, and get targeted training recommendations.</p>
      </div>

      {!output ? (
        <div style={{background:"#111",border:`1px solid ${B}`,borderRadius:14,padding:28,maxWidth:600}}>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div>
              <label style={{fontSize:11.5,fontWeight:600,color:"#555",display:"block",marginBottom:5}}>Company Goal</label>
              <input style={inp} value={goal} onChange={e=>setGoal(e.target.value)} placeholder="e.g. Launch mobile app in 6 months, scale to 50 customers"/>
            </div>
            <div>
              <label style={{fontSize:11.5,fontWeight:600,color:"#555",display:"block",marginBottom:5}}>Team Data (one member per line)</label>
              <div style={{fontSize:11,color:"#444",marginBottom:6}}>Format: Name | Role | Skills</div>
              <textarea style={{...inp,height:160,resize:"vertical",fontSize:12.5}} value={team} onChange={e=>setTeam(e.target.value)}/>
            </div>
            <button onClick={()=>run("team_skill_map", { teamData:team, goal }, token)} disabled={loading||!team||!goal}
              style={{padding:"12px 0",borderRadius:10,border:"none",background:PINK,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              Analyze Team Skills →
            </button>
          </div>
        </div>
      ) : (
        <ToolOutput output={output} loading={loading} error={error} onReset={reset}/>
      )}
    </div>
  );
}
