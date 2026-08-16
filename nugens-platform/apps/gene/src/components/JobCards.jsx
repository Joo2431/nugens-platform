/**
 * JobCards.jsx — Renders live job listing cards below AI messages in GenEChat
 * Drop into: apps/gene/src/components/JobCards.jsx
 * Usage in GenEChat message render:
 *   {m.jobs && m.jobs.length > 0 && <JobCards jobs={m.jobs} />}
 */
import React, { useState } from "react";

const PINK = "#e8185d";
const BLUE = "#0284c7";
const BG   = "#f8f9fb";
const BORD = "#e8eaed";
const TEXT = "#111827";
const MUTED = "#6b7280";

export default function JobCards({ jobs }) {
  const [expanded, setExpanded] = useState(false);
  if (!jobs || jobs.length === 0) return null;

  const visible = expanded ? jobs : jobs.slice(0, 4);

  return (
    <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:8, maxWidth:680 }}>
      <div style={{ fontSize:11, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:2 }}>
        🔎 {jobs.length} live openings found
      </div>

      {visible.map((job, i) => (
        <a key={job.id || i} href={job.url} target="_blank" rel="noopener noreferrer"
          style={{ display:"block", textDecoration:"none",
            background:"#fff", border:`1px solid ${BORD}`,
            borderRadius:12, padding:"12px 16px",
            boxShadow:"0 1px 3px rgba(0,0,0,0.04)",
            transition:"all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = `${PINK}50`; e.currentTarget.style.boxShadow = `0 4px 16px rgba(232,24,93,0.08)`; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = BORD; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; }}>

          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10 }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:14, fontWeight:700, color:TEXT, marginBottom:2,
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {job.title}
              </div>
              <div style={{ fontSize:12, color:MUTED, marginBottom:6 }}>
                {job.company}
                {job.location && <span style={{ marginLeft:6, color:"#9ca3af" }}>· {job.location}</span>}
                {job.remote && <span style={{ marginLeft:6, fontSize:10, fontWeight:700, color:"#16a34a", background:"#f0fdf4", padding:"1px 6px", borderRadius:10 }}>Remote</span>}
              </div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
                {job.salary && (
                  <span style={{ fontSize:11, fontWeight:700, color:"#16a34a", background:"#f0fdf4", padding:"2px 8px", borderRadius:10, border:"1px solid #bbf7d0" }}>
                    {job.salary}
                  </span>
                )}
                {(job.tags || []).slice(0, 3).map((tag, ti) => (
                  <span key={ti} style={{ fontSize:10, color:MUTED, background:BG, padding:"2px 7px", borderRadius:8, border:`1px solid ${BORD}` }}>
                    {tag}
                  </span>
                ))}
                <span style={{ fontSize:10, color:"#9ca3af", marginLeft:"auto" }}>
                  via {job.source}
                </span>
              </div>
            </div>

            <div style={{ flexShrink:0 }}>
              <div style={{ padding:"6px 14px", background:`${PINK}10`, border:`1px solid ${PINK}30`,
                borderRadius:8, fontSize:11, fontWeight:700, color:PINK, whiteSpace:"nowrap" }}>
                Apply →
              </div>
            </div>
          </div>
        </a>
      ))}

      {jobs.length > 4 && (
        <button onClick={() => setExpanded(e => !e)}
          style={{ alignSelf:"flex-start", background:"none", border:`1px solid ${BORD}`,
            borderRadius:8, padding:"6px 14px", fontSize:12, fontWeight:600,
            color:BLUE, cursor:"pointer", fontFamily:"inherit",
            transition:"all 0.13s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = BLUE; e.currentTarget.style.background = `${BLUE}08`; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = BORD; e.currentTarget.style.background = "none"; }}>
          {expanded ? `▲ Show fewer` : `▼ Show all ${jobs.length} jobs`}
        </button>
      )}
    </div>
  );
}