import React, { useState } from "react";

const BLUE = "#0284c7";
const PINK = "#e8185d";
const B    = "#1a2030";

const PERIODS = ["Last 7 days","Last 30 days","Last 90 days"];
const BRANDS  = ["All Brands","Zara Fitness","VedaKitchen","ThinkBox","NovaTech"];

const CAMPAIGNS = [
  { name:"Zara Fitness — Ramadan Reels",    platform:"Instagram", reach:"48.2K", clicks:"3,140", conv:"210", ctr:"6.5%", roas:"3.2×", spend:"₹18K",  brand:"Zara Fitness",  status:"Active"   },
  { name:"VedaKitchen — Recipe Series",     platform:"Facebook",  reach:"22.8K", clicks:"1,820", conv:"94",  ctr:"7.9%", roas:"2.8×", spend:"₹12K",  brand:"VedaKitchen",  status:"Active"   },
  { name:"ThinkBox — LinkedIn Thought Lead",platform:"LinkedIn",  reach:"14.1K", clicks:"890",   conv:"38",  ctr:"6.3%", roas:"4.1×", spend:"₹8K",   brand:"ThinkBox",     status:"Active"   },
  { name:"NovaTech — Google Search",        platform:"Google",    reach:"31.5K", clicks:"2,400", conv:"178", ctr:"7.6%", roas:"2.1×", spend:"₹24K",  brand:"NovaTech",     status:"Paused"   },
  { name:"Zara Fitness — Meta Retargeting", platform:"Meta",      reach:"19.3K", clicks:"2,100", conv:"156", ctr:"10.8%",roas:"4.8×", spend:"₹14K",  brand:"Zara Fitness",  status:"Active"   },
];

const BAR_DATA = [
  { label:"Mon", reach:4200, clicks:280 },
  { label:"Tue", reach:5100, clicks:340 },
  { label:"Wed", reach:3800, clicks:260 },
  { label:"Thu", reach:6200, clicks:420 },
  { label:"Fri", reach:7100, clicks:510 },
  { label:"Sat", reach:5400, clicks:370 },
  { label:"Sun", reach:4800, clicks:310 },
];
const maxReach = Math.max(...BAR_DATA.map(d=>d.reach));

export default function Analytics() {
  const [period, setPeriod] = useState("Last 30 days");
  const [brand, setBrand]   = useState("All Brands");

  const shown = CAMPAIGNS.filter(c => brand==="All Brands" || c.brand===brand);

  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", padding:"32px 28px 80px", background:"#06101a", minHeight:"100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .an-card { background:#080f1a; border:1px solid ${B}; border-radius:12px; padding:20px; }
        .select-pill { padding:7px 14px; background:#080f1a; border:1px solid ${B}; border-radius:8px; color:#aaa; font-size:13px; font-family:'Plus Jakarta Sans',sans-serif; outline:none; cursor:pointer; }
        .select-pill:focus { border-color:${BLUE}50; }
        .tag { display:inline-block; padding:2px 7px; border-radius:4px; font-size:10.5px; font-weight:600; }
        @media (max-width:700px) { .stats-g { grid-template-columns:1fr 1fr !important; } .an-two { grid-template-columns:1fr !important; } }
      `}</style>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28, flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontWeight:800, fontSize:"clamp(20px,2.5vw,26px)", letterSpacing:"-0.03em", color:"#fff", marginBottom:4 }}>Analytics</h1>
          <p style={{ fontSize:13.5, color:"#445" }}>Campaign performance across all brands and platforms.</p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <select className="select-pill" value={period} onChange={e=>setPeriod(e.target.value)}>
            {PERIODS.map(p => <option key={p}>{p}</option>)}
          </select>
          <select className="select-pill" value={brand} onChange={e=>setBrand(e.target.value)}>
            {BRANDS.map(b => <option key={b}>{b}</option>)}
          </select>
        </div>
      </div>

      {/* KPI stats */}
      <div className="stats-g" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:28 }}>
        {[
          { label:"Total reach",       value:"136K",   delta:"+18%", color:BLUE     },
          { label:"Total clicks",      value:"10,350", delta:"+24%", color:"#16a34a"},
          { label:"Avg CTR",           value:"7.8%",   delta:"+1.2%",color:"#d97706"},
          { label:"Avg ROAS",          value:"3.4×",   delta:"+0.6×",color:PINK     },
        ].map(s => (
          <div key={s.label} className="an-card">
            <div style={{ fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.07em", color:"#445", marginBottom:8 }}>{s.label}</div>
            <div style={{ fontSize:26, fontWeight:800, color:s.color, letterSpacing:"-0.04em", lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:11.5, color:"#16a34a", marginTop:6 }}>{s.delta} vs prev period</div>
          </div>
        ))}
      </div>

      {/* Chart + platform breakdown */}
      <div className="an-two" style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr", gap:16, marginBottom:28 }}>
        {/* Bar chart */}
        <div className="an-card">
          <div style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:"#445", marginBottom:20 }}>Reach this week</div>
          <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:140 }}>
            {BAR_DATA.map(d => (
              <div key={d.label} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:3, alignItems:"center" }}>
                  <div style={{ fontSize:10, color:BLUE, fontWeight:600 }}>{(d.reach/1000).toFixed(1)}K</div>
                  <div style={{ width:"100%", background:BLUE+"20", borderRadius:"4px 4px 0 0", overflow:"hidden" }}>
                    <div style={{ width:"100%", height: Math.round((d.reach/maxReach)*100)+"px", background:BLUE, borderRadius:"4px 4px 0 0", minHeight:8 }} />
                  </div>
                </div>
                <div style={{ fontSize:10.5, color:"#445" }}>{d.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform breakdown */}
        <div className="an-card">
          <div style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:"#445", marginBottom:20 }}>Platform mix</div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {[
              { name:"Instagram", pct:38, color:PINK      },
              { name:"Facebook",  pct:24, color:BLUE      },
              { name:"Google",    pct:20, color:"#d97706" },
              { name:"LinkedIn",  pct:12, color:"#0a66c2" },
              { name:"Other",     pct:6,  color:"#445"    },
            ].map(p => (
              <div key={p.name}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                  <span style={{ fontSize:12.5, fontWeight:600, color:"#aaa" }}>{p.name}</span>
                  <span style={{ fontSize:12.5, fontWeight:700, color:p.color }}>{p.pct}%</span>
                </div>
                <div style={{ height:5, background:"#0d1624", borderRadius:99 }}>
                  <div style={{ width:`${p.pct}%`, height:"100%", background:p.color, borderRadius:99 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Campaign table */}
      <div className="an-card">
        <div style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:"#445", marginBottom:20 }}>Campaign performance</div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr>
                {["Campaign","Platform","Reach","Clicks","CTR","ROAS","Spend","Status"].map(h => (
                  <th key={h} style={{ textAlign:"left", padding:"8px 12px", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:"#334", borderBottom:`1px solid ${B}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((c,i) => (
                <tr key={c.name} style={{ borderBottom:`1px solid ${i<shown.length-1?B:"transparent"}` }}>
                  <td style={{ padding:"12px", fontSize:13, fontWeight:600, color:"#ccc", maxWidth:200 }}>{c.name}</td>
                  <td style={{ padding:"12px", fontSize:12.5, color:"#445" }}>{c.platform}</td>
                  <td style={{ padding:"12px", fontSize:13, fontWeight:600, color:"#aaa" }}>{c.reach}</td>
                  <td style={{ padding:"12px", fontSize:13, fontWeight:600, color:"#aaa" }}>{c.clicks}</td>
                  <td style={{ padding:"12px", fontSize:13, fontWeight:700, color:BLUE }}>{c.ctr}</td>
                  <td style={{ padding:"12px", fontSize:13, fontWeight:700, color:"#16a34a" }}>{c.roas}</td>
                  <td style={{ padding:"12px", fontSize:13, color:"#aaa" }}>{c.spend}</td>
                  <td style={{ padding:"12px" }}>
                    <span className="tag" style={{ background:c.status==="Active"?BLUE+"18":"#d97706"+"18", color:c.status==="Active"?BLUE:"#d97706" }}>{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
