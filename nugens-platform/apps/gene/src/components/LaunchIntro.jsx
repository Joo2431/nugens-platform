import React, { useState, useEffect } from "react";

const PINK = "#e8185d";

/**
 * Brief branded splash animation shown once when the app first loads.
 * Auto-dismisses after ~1.2s and never blocks interaction once faded.
 */
export default function LaunchIntro() {
  const [visible, setVisible] = useState(true);
  const [fading,  setFading]  = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 850);
    const t2 = setTimeout(() => setVisible(false), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999999,
      background: "#ffffff",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", gap: 16,
      opacity: fading ? 0 : 1,
      transition: "opacity 0.35s ease",
      pointerEvents: fading ? "none" : "auto",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');
        @keyframes li-pop   { 0%{opacity:0;transform:scale(.6) rotate(-8deg)} 60%{opacity:1;transform:scale(1.08) rotate(2deg)} 100%{transform:scale(1) rotate(0)} }
        @keyframes li-tag   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes li-ring  { 0%{transform:scale(0.9);opacity:0.5} 100%{transform:scale(1.55);opacity:0} }
      `}</style>

      <div style={{ position:"relative", width:72, height:72, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ position:"absolute", inset:0, borderRadius:20, border:`2px solid ${PINK}`, animation:"li-ring 1.1s ease-out infinite" }} />
        <div style={{
          width:64, height:64, borderRadius:18,
          background:`linear-gradient(135deg,${PINK},#c4134e)`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontWeight:900, fontSize:22, color:"#fff", letterSpacing:"-0.03em",
          boxShadow:`0 14px 38px ${PINK}45`,
          fontFamily:"'Plus Jakarta Sans',sans-serif",
          animation:"li-pop 0.6s cubic-bezier(.34,1.56,.64,1)",
        }}>GE</div>
      </div>

      <div style={{
        fontSize:13, color:"#9ca3af", fontWeight:600, letterSpacing:"0.02em",
        fontFamily:"'Plus Jakarta Sans',sans-serif",
        animation:"li-tag 0.5s ease 0.3s both",
      }}>
        Gen-E AI · Career Intelligence
      </div>
    </div>
  );
}
