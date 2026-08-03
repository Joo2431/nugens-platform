import React, { useState, useEffect } from "react";
import { apiGet } from "../lib/apiClient";

const BLUE   = "#0284c7";
const PINK   = "#e8185d";
const BG     = "#f8f9fb";
const CARD   = "#ffffff";
const BORDER = "#e8eaed";
const TEXT   = "#0a0a0a";
const MUTED  = "#6b7280";
const FAINT  = "#9ca3af";

export default function Analytics({ profile }) {
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [loadError, setLoadError] = useState("");

  const load = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const d = await apiGet("/api/digihub/analytics/overview");
      setData(d);
    } catch (e) {
      setLoadError(e.message || "Couldn't load analytics.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const S = {
    page: { minHeight:"100vh", background:BG, padding:"32px 40px", fontFamily:"'Plus Jakarta Sans',sans-serif" },
    h1: { fontSize:26, fontWeight:800, color:TEXT, letterSpacing:"-0.04em", marginBottom:4 },
    sub: { fontSize:13, color:MUTED, marginBottom:28 },
    card: { background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:22 },
    stat: { background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, padding:18 },
    label: { fontSize:11, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em" },
  };

  const totals = data?.totals || {};
  const byPlatform = data?.byPlatform || {};
  const platformEntries = Object.entries(byPlatform);
  const maxPlatform = Math.max(1, ...platformEntries.map(([,v]) => v));

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      <div style={{ marginBottom:28 }}>
        <div style={S.h1}>⬟ Analytics</div>
        <div style={S.sub}>Real activity from your DigiHub account — job board and content scheduling</div>
      </div>

      {loadError && (
        <div style={{ background:"#dc262610", border:"1px solid #dc262630", borderRadius:10, padding:"12px 16px", marginBottom:20, color:"#dc2626", fontSize:13, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          {loadError}
          <button onClick={load} style={{ background:"none", border:"none", color:"#dc2626", fontWeight:700, cursor:"pointer", fontSize:13 }}>Retry</button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign:"center", padding:"80px 0", color:FAINT, fontSize:13 }}>Loading…</div>
      ) : (
        <>
          {/* Real overview stats */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:28 }}>
            {[
              { label:"Posts Scheduled", value: totals.scheduledPosts ?? 0, color:BLUE },
              { label:"Posts Published", value: totals.publishedPosts ?? 0, color:"#16a34a" },
              { label:"Drafts",          value: totals.draftPosts ?? 0,     color:MUTED },
              { label:"Open Job Posts",  value: totals.openJobs ?? 0,       color:PINK },
              { label:"Total Applicants", value: totals.totalApplicants ?? 0, color:"#7c3aed" },
            ].map(s=>(
              <div key={s.label} style={S.stat}>
                <div style={{ fontSize:24, fontWeight:800, color:s.color, letterSpacing:"-0.03em" }}>{s.value}</div>
                <div style={{ fontSize:11, color:FAINT, marginTop:4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24, marginBottom:24 }}>
            {/* Platform breakdown — real, from scheduled posts */}
            <div style={S.card}>
              <div style={{ fontSize:13, fontWeight:700, color:TEXT, marginBottom:16 }}>Posts by Platform</div>
              {platformEntries.length === 0 ? (
                <div style={{ fontSize:13, color:FAINT, textAlign:"center", padding:"24px 0" }}>
                  No posts scheduled yet — head to the Content Scheduler to create your first one.
                </div>
              ) : platformEntries.map(([name, count]) => (
                <div key={name} style={{ marginBottom:14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                    <span style={{ fontSize:12, color:"#374151" }}>{name}</span>
                    <span style={{ fontSize:12, color:MUTED }}>{count}</span>
                  </div>
                  <div style={{ height:6, background:BG, borderRadius:3, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${(count/maxPlatform)*100}%`, background:BLUE, borderRadius:3 }}/>
                  </div>
                </div>
              ))}
            </div>

            {/* Job board snapshot — real */}
            <div style={S.card}>
              <div style={{ fontSize:13, fontWeight:700, color:TEXT, marginBottom:16 }}>Job Board Snapshot</div>
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:13, color:"#374151" }}>Open postings</span>
                  <span style={{ fontSize:18, fontWeight:800, color:PINK }}>{totals.openJobs ?? 0}</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:13, color:"#374151" }}>Total applicants across all postings</span>
                  <span style={{ fontSize:18, fontWeight:800, color:"#7c3aed" }}>{totals.totalApplicants ?? 0}</span>
                </div>
                <a href="/jobs" style={{ fontSize:12, color:BLUE, fontWeight:600, textDecoration:"none" }}>Manage postings →</a>
              </div>
            </div>
          </div>

          {/* Honest empty state for reach/engagement */}
          <div style={{ ...S.card, border:`1px solid ${BLUE}20`, background:"#f0f9ff" }}>
            <div style={{ fontSize:12.5, color:"#374151", lineHeight:1.7 }}>
              <span style={{ color:BLUE, fontWeight:700 }}>ℹ️ About reach & engagement: </span>
              Real reach, impressions, and engagement-rate analytics will appear here once posts are actually publishing
              to connected social platforms. That requires registering developer apps with each platform (Meta, LinkedIn, X)
              — see the Content Scheduler for details. Until then, this page only shows activity that's genuinely tracked today.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
