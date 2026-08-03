import React, { useState, useEffect } from "react";

const GOLD = "#d4a843";

export default function LaunchIntro() {
  const [visible, setVisible] = useState(true);
  const [fading,  setFading]  = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 950);
    const t2 = setTimeout(() => setVisible(false), 1350);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999999,
      background: "#0a0a0a",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", gap: 18,
      opacity: fading ? 0 : 1,
      transition: "opacity 0.45s ease",
      pointerEvents: fading ? "none" : "auto",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Plus+Jakarta+Sans:wght@500;600&display=swap');
        @keyframes li-draw  { from{ stroke-dashoffset: 220; opacity:0 } to{ stroke-dashoffset: 0; opacity:1 } }
        @keyframes li-glow  { 0%,100%{opacity:0.55} 50%{opacity:1} }
        @keyframes li-tag   { from{opacity:0;letter-spacing:0.3em} to{opacity:1;letter-spacing:0.18em} }
      `}</style>

      <div style={{ position:"relative", width:84, height:84, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:`1px solid ${GOLD}55`, animation:"li-glow 1.6s ease-in-out infinite" }} />
        <svg width="84" height="84" viewBox="0 0 84 84" fill="none">
          <circle cx="42" cy="42" r="34" stroke={GOLD} strokeWidth="1.4"
            strokeDasharray="220" style={{ animation:"li-draw 1.1s ease-out forwards" }} />
          <text x="42" y="51" textAnchor="middle" fontFamily="'Cormorant Garamond',serif" fontSize="30" fill={GOLD} fontWeight="600">U</text>
        </svg>
      </div>

      <div style={{
        fontSize:11.5, color:GOLD, fontWeight:600, textTransform:"uppercase",
        fontFamily:"'Plus Jakarta Sans',sans-serif",
        animation:"li-tag 0.7s ease 0.25s both",
      }}>
        Units · Production Studio
      </div>
    </div>
  );
}
