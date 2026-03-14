import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const PINK = "#e8185d";

// AI Assistant is now the floating Gen-E Mini popup (✦ button, bottom right)
// This page redirects back to dashboard
export default function AIAssistant() {
  const navigate = useNavigate();
  useEffect(() => { navigate("/", { replace: true }); }, []);
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#09090a",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:32,marginBottom:12}}>✦</div>
        <div style={{fontSize:15,fontWeight:700,color:"#fff",marginBottom:6}}>GEN-E Mini is always available</div>
        <div style={{fontSize:13,color:"#555"}}>Look for the <span style={{color:PINK,fontWeight:700}}>✦</span> button in the bottom-right corner</div>
      </div>
    </div>
  );
}
