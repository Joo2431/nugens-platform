import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useGeneTool } from "../lib/useGeneTool";
import ToolOutput from "../components/ToolOutput";

const PINK = "#e8185d";
const B    = "#1e1e1e";

const POPULAR = [
  { from:"Software Engineer", to:"Product Manager" },
  { from:"Marketing Executive", to:"Digital Marketing Head" },
  { from:"Support Engineer", to:"UX Designer" },
  { from:"Data Analyst", to:"Data Scientist" },
  { from:"HR Executive", to:"HR Business Partner" },
  { from:"Sales Executive", to:"Startup Founder" },
];

export default function CareerSimulator() {
  const [token, setToken] = useState("");
  const [form,  setForm]  = useState({ fromRole:"", toRole:"" });
  const { output, loading, error, run, reset } = useGeneTool();

  useEffect(() => {
    supabase.auth.getSession().then(({ data:{ session } }) => setToken(session?.access_token || ""));
  }, []);

  const inp = { width:"100%", padding:"10px 13px", background:"#111", border:`1px solid ${B}`, borderRadius:9, color:"#e8e8e8", fontSize:13.5, fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none" };

  return (
    <div style={{padding:"32px 28px 80px",background:"#09090a",minHeight:"100vh",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'); input:focus{border-color:${PINK}60!important}`}</style>

      <div style={{marginBottom:28}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"3px 10px",borderRadius:5,background:`${PINK}10`,border:`1px solid ${PINK}30`,marginBottom:12}}>
          <span style={{fontSize:10,fontWeight:700,color:PINK,textTransform:"uppercase",letterSpacing:"0.08em"}}>⬡ Career Simulator</span>
        </div>
        <h1 style={{fontWeight:800,fontSize:"clamp(20px,2.5vw,28px)",color:"#fff",letterSpacing:"-0.03em",marginBottom:6}}>Simulate Your Career Move</h1>
        <p style={{fontSize:13.5,color:"#555"}}>What happens if you switch careers? See salary impact, skills needed, timeline, and risks.</p>
      </div>

      {!output ? (
        <>
          {/* Popular simulations */}
          <div style={{marginBottom:20}}>
            <div style={{fontSize:11.5,fontWeight:600,color:"#444",marginBottom:10}}>POPULAR TRANSITIONS</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {POPULAR.map(p=>(
                <button key={p.from+p.to} onClick={()=>setForm({fromRole:p.from,toRole:p.to})}
                  style={{padding:"6px 12px",background:"#111",border:`1px solid ${B}`,borderRadius:7,fontSize:12,color:"#666",cursor:"pointer",fontFamily:"inherit",transition:"all 0.13s"}}
                  onMouseOver={e=>{e.currentTarget.style.borderColor=PINK+"50";e.currentTarget.style.color="#ccc"}}
                  onMouseOut={e=>{e.currentTarget.style.borderColor=B;e.currentTarget.style.color="#666"}}>
                  {p.from} → {p.to}
                </button>
              ))}
            </div>
          </div>

          <div style={{background:"#111",border:`1px solid ${B}`,borderRadius:14,padding:28,maxWidth:580}}>
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <div>
                <label style={{fontSize:11.5,fontWeight:600,color:"#555",display:"block",marginBottom:5}}>Current Role</label>
                <input style={inp} value={form.fromRole} onChange={e=>setForm(p=>({...p,fromRole:e.target.value}))} placeholder="e.g. Software Engineer, 3 years"/>
              </div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
                <div style={{fontSize:20,color:PINK}}>↓</div>
              </div>
              <div>
                <label style={{fontSize:11.5,fontWeight:600,color:"#555",display:"block",marginBottom:5}}>Target Role</label>
                <input style={inp} value={form.toRole} onChange={e=>setForm(p=>({...p,toRole:e.target.value}))} placeholder="e.g. Product Manager"/>
              </div>
              <button onClick={()=>run("career_simulate", form, token)} disabled={loading||!form.fromRole||!form.toRole}
                style={{padding:"12px 0",borderRadius:10,border:"none",background:PINK,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                Run Career Simulation →
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
