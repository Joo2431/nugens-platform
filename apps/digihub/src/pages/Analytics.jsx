import React, { useState } from "react";

const BLUE = "#0284c7";
const BG   = "#06101a";
const CARD = "#0a1628";
const B    = "#1a2030";

const PLATFORMS = ["All","Instagram","LinkedIn","Twitter/X","Facebook","YouTube"];

const MOCK_DATA = {
  overview: [
    { label:"Total Reach",       value:"48,320", change:"+12.4%", up:true },
    { label:"Impressions",       value:"1,24,800", change:"+8.1%", up:true },
    { label:"Engagements",       value:"3,240", change:"+21.3%", up:true },
    { label:"Follower Growth",   value:"+384", change:"+5.2%", up:true },
    { label:"Link Clicks",       value:"892", change:"-3.1%", up:false },
    { label:"Scheduled Posts",   value:"14", change:"+7 this week", up:true },
  ],
  topPosts: [
    { platform:"Instagram", caption:"Summer collection drop 🌊 Limited pieces available!", reach:8240, eng:642, rate:"7.8%", type:"Post" },
    { platform:"LinkedIn",  caption:"Thrilled to share our Series A funding milestone!", reach:14200, eng:1120, rate:"7.9%", type:"Post" },
    { platform:"Instagram", caption:"Behind the scenes of our new product shoot 📸",      reach:5180, eng:389, rate:"7.5%", type:"Reel" },
    { platform:"Facebook",  caption:"Big sale this weekend! Up to 40% off on all items",  reach:3920, eng:214, rate:"5.5%", type:"Post" },
  ],
  weeklyEngagement: [
    { day:"Mon", value:320 },{ day:"Tue", value:480 },{ day:"Wed", value:390 },
    { day:"Thu", value:620 },{ day:"Fri", value:540 },{ day:"Sat", value:280 },{ day:"Sun", value:210 },
  ],
  platformBreakdown: [
    { name:"Instagram", reach:"22,400", engagement:"1,820", color:"#e8185d",   percent:46 },
    { name:"LinkedIn",  reach:"14,200", engagement:"1,120", color:BLUE,        percent:29 },
    { name:"Facebook",  reach:"7,840",  engagement:"214",   color:"#3b82f6",   percent:16 },
    { name:"YouTube",   reach:"3,880",  engagement:"86",    color:"#ef4444",   percent:9  },
  ],
};

export default function Analytics({ profile }) {
  const [period, setPeriod] = useState("7d");
  const [platform, setPlatform] = useState("All");

  const maxVal = Math.max(...MOCK_DATA.weeklyEngagement.map(d=>d.value));

  const S = {
    page: { minHeight:"100vh", background:BG, padding:"32px 40px", fontFamily:"'Plus Jakarta Sans',sans-serif" },
    h1: { fontSize:26, fontWeight:800, color:"#fff", letterSpacing:"-0.04em", marginBottom:4 },
    sub: { fontSize:13, color:"#445", marginBottom:28 },
    card: { background:CARD, border:`1px solid ${B}`, borderRadius:14, padding:22 },
    stat: { background:CARD, border:`1px solid ${B}`, borderRadius:12, padding:18 },
    pill: { padding:"5px 14px", borderRadius:20, fontSize:11, fontWeight:600, cursor:"pointer", border:"none", fontFamily:"inherit" },
    label: { fontSize:11, fontWeight:700, color:"#445", textTransform:"uppercase", letterSpacing:"0.08em" },
  };

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28 }}>
        <div>
          <div style={S.h1}>⬟ Analytics</div>
          <div style={S.sub}>Track your content performance across all platforms</div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {["7d","30d","90d"].map(p=>(
            <button key={p} onClick={()=>setPeriod(p)} style={{ ...S.pill, background:period===p?BLUE:"#0d1624", color:period===p?"#fff":"#445", border:period===p?"none":`1px solid ${B}` }}>{p}</button>
          ))}
        </div>
      </div>

      {/* Overview stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:12, marginBottom:28 }}>
        {MOCK_DATA.overview.map(s=>(
          <div key={s.label} style={S.stat}>
            <div style={{ fontSize:20, fontWeight:800, color:"#fff", letterSpacing:"-0.03em" }}>{s.value}</div>
            <div style={{ fontSize:10, color:"#334", marginTop:3 }}>{s.label}</div>
            <div style={{ fontSize:11, fontWeight:600, color:s.up?"#22c55e":"#ef4444", marginTop:4 }}>{s.up?"↑":"↓"} {s.change}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:24, marginBottom:24 }}>
        {/* Engagement chart */}
        <div style={S.card}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#fff" }}>Daily Engagement — Last 7 Days</div>
          </div>
          <div style={{ display:"flex", alignItems:"flex-end", gap:10, height:140 }}>
            {MOCK_DATA.weeklyEngagement.map(d=>(
              <div key={d.day} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                <div style={{ fontSize:10, color:"#ccc", fontWeight:600 }}>{d.value}</div>
                <div style={{ width:"100%", height:`${(d.value/maxVal)*120}px`, background:`${BLUE}`, borderRadius:"4px 4px 0 0", minHeight:4 }}/>
                <div style={{ fontSize:10, color:"#334" }}>{d.day}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform breakdown */}
        <div style={S.card}>
          <div style={{ fontSize:13, fontWeight:700, color:"#fff", marginBottom:16 }}>Platform Breakdown</div>
          {MOCK_DATA.platformBreakdown.map(p=>(
            <div key={p.name} style={{ marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:p.color }}/>
                  <span style={{ fontSize:12, color:"#ccc" }}>{p.name}</span>
                </div>
                <span style={{ fontSize:12, color:"#445" }}>{p.percent}%</span>
              </div>
              <div style={{ height:5, background:"#0d1624", borderRadius:3, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${p.percent}%`, background:p.color, borderRadius:3 }}/>
              </div>
              <div style={{ display:"flex", gap:12, marginTop:4 }}>
                <span style={{ fontSize:10, color:"#334" }}>Reach: {p.reach}</span>
                <span style={{ fontSize:10, color:"#334" }}>Eng: {p.engagement}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top performing posts */}
      <div style={S.card}>
        <div style={{ fontSize:13, fontWeight:700, color:"#fff", marginBottom:16 }}>Top Performing Posts</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 100px 100px 80px 80px", gap:12, borderBottom:`1px solid ${B}`, paddingBottom:8, marginBottom:8 }}>
          {["Post","Reach","Engagements","Rate","Type"].map(h=>(
            <div key={h} style={{ fontSize:10, fontWeight:700, color:"#334", textTransform:"uppercase", letterSpacing:"0.06em" }}>{h}</div>
          ))}
        </div>
        {MOCK_DATA.topPosts.map((p,i)=>(
          <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 100px 100px 80px 80px", gap:12, alignItems:"center", paddingBottom:12, borderBottom:i<MOCK_DATA.topPosts.length-1?`1px solid ${B}`:"none", marginBottom:12 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:p.platform==="Instagram"?"#e8185d":p.platform==="LinkedIn"?BLUE:"#aaa", marginBottom:2 }}>{p.platform}</div>
              <div style={{ fontSize:12, color:"#aaa" }}>{p.caption.slice(0,55)}...</div>
            </div>
            <div style={{ fontSize:13, fontWeight:600, color:"#ccc" }}>{p.reach.toLocaleString()}</div>
            <div style={{ fontSize:13, fontWeight:600, color:"#ccc" }}>{p.eng.toLocaleString()}</div>
            <div style={{ fontSize:13, fontWeight:600, color:"#22c55e" }}>{p.rate}</div>
            <div style={{ fontSize:11, fontWeight:600, color:"#445", background:"#0d1624", border:`1px solid ${B}`, borderRadius:5, padding:"2px 8px", display:"inline-block" }}>{p.type}</div>
          </div>
        ))}
      </div>

      {/* Pro tip */}
      <div style={{ ...S.card, marginTop:20, border:`1px solid ${BLUE}20`, background:"#060e1a" }}>
        <div style={{ fontSize:12, color:"#445" }}>
          <span style={{ color:BLUE, fontWeight:700 }}>💡 Insight: </span>
          Your LinkedIn posts get {Math.round(1120/14200*100)}% engagement rate — significantly above the platform average of 2.5%. Focus more content efforts on LinkedIn for maximum ROI. Schedule posts on Tuesday–Thursday 9–11am for best reach.
        </div>
      </div>
    </div>
  );
}
