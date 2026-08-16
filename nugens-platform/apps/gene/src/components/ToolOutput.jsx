import React from "react";
import ReactMarkdown from "react-markdown";

const PINK = "#e8185d";

export default function ToolOutput({ output, loading, error, onReset }) {
  if (!output && !loading && !error) return null;

  return (
    <div style={{ background:"#0a0a0a", border:"1px solid #1e1e1e", borderRadius:14, overflow:"hidden", marginTop:20 }}>
      {/* Header */}
      <div style={{ background:"#111", borderBottom:"1px solid #1e1e1e", padding:"10px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:7, height:7, borderRadius:"50%", background:loading?"#d97706":error?"#ef4444":"#16a34a", animation:loading?"pulse 1s infinite":undefined }}/>
          <span style={{ fontSize:12, fontWeight:600, color:"#555" }}>{loading ? "Generating…" : error ? "Error" : "Complete"}</span>
        </div>
        {onReset && !loading && (
          <button onClick={onReset} style={{ background:"none", border:"1px solid #1e1e1e", borderRadius:6, padding:"3px 10px", fontSize:11, color:"#555", cursor:"pointer", fontFamily:"inherit" }}>New analysis</button>
        )}
      </div>

      {/* Content */}
      <div style={{ padding:"20px 22px", maxHeight:"70vh", overflowY:"auto" }}>
        {error && <div style={{ color:"#f87171", fontSize:13 }}>⚠️ {error}</div>}
        {output && (
          <div style={{ fontSize:13.5, lineHeight:1.8, color:"#ccc", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            <ReactMarkdown
              components={{
                h2: ({children}) => <div style={{ fontWeight:800, fontSize:12, color:PINK, textTransform:"uppercase", letterSpacing:"0.08em", marginTop:20, marginBottom:8, paddingBottom:6, borderBottom:"1px solid #1e1e1e" }}>{children}</div>,
                h3: ({children}) => <div style={{ fontWeight:700, fontSize:13.5, color:"#e8e8e8", marginTop:14, marginBottom:6 }}>{children}</div>,
                p:  ({children}) => <p style={{ marginBottom:8, color:"#aaa" }}>{children}</p>,
                li: ({children}) => <li style={{ marginBottom:4, color:"#aaa", marginLeft:16 }}>{children}</li>,
                strong: ({children}) => <strong style={{ color:"#e8e8e8", fontWeight:700 }}>{children}</strong>,
              }}
            >{output}</ReactMarkdown>
            {loading && <span style={{ display:"inline-block", width:6, height:14, background:PINK, marginLeft:2, animation:"blink 0.7s infinite" }}/>}
          </div>
        )}
      </div>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
}
