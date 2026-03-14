import React from "react";
import { useNavigate } from "react-router-dom";

const BLUE = "#0284c7";
const BG   = "#06101a";
const CARD = "#0a1628";
const B    = "#1a2030";

const BIZ_FEATURES = [
  { icon:"✦", label:"Prompt Space",    desc:"Generate design prompts for your brand",  to:"/prompts",   color:BLUE },
  { icon:"⬡", label:"Image Generator", desc:"AI-powered poster & banner creation",      to:"/imagegen",  color:"#8b5cf6" },
  { icon:"◈", label:"Content Planner", desc:"4-week AI content calendar",               to:"/planner",   color:"#22c55e" },
  { icon:"⊞", label:"Scheduler",       desc:"Schedule posts across all platforms",      to:"/scheduler", color:"#f59e0b" },
  { icon:"◉", label:"Community",       desc:"Business network — hiring, offers, news",  to:"/community", color:"#e8185d" },
  { icon:"⬟", label:"Analytics",       desc:"Track your content performance",           to:"/analytics", color:BLUE },
];

const IND_FEATURES = [
  { icon:"✦", label:"Prompt Space",    desc:"Generate design prompts for your work",    to:"/prompts",   color:BLUE },
  { icon:"⬡", label:"Image Generator", desc:"Create stunning portfolio visuals",         to:"/imagegen",  color:"#8b5cf6" },
  { icon:"◈", label:"Content Planner", desc:"Plan your personal brand content",          to:"/planner",   color:"#22c55e" },
  { icon:"⊞", label:"Scheduler",       desc:"Schedule posts consistently",               to:"/scheduler", color:"#f59e0b" },
  { icon:"◇", label:"Job Board",       desc:"Find jobs posted by DigiHub businesses",   to:"/jobs",      color:"#e8185d" },
  { icon:"◉", label:"Community",       desc:"Connect, showcase & collaborate",           to:"/community", color:BLUE },
];

const BIZ_TIPS = [
  "Post hiring updates in Community to attract DigiHub talent",
  "Use Image Generator for festive offer banners",
  "Schedule posts 3 days in advance for consistent reach",
  "Add hashtags from Prompt Space to boost discoverability",
];

const IND_TIPS = [
  "Complete your Gen-E profile to get noticed by businesses",
  "Share your portfolio in Community to get freelance inquiries",
  "Apply to urgent jobs first — they hire fast",
  "Use the Content Planner to build a strong personal brand",
];

export default function Dashboard({ profile }) {
  const nav = useNavigate();
  const isBusiness = profile?.user_type === "business";
  const features = isBusiness ? BIZ_FEATURES : IND_FEATURES;
  const tips = isBusiness ? BIZ_TIPS : IND_TIPS;
  const firstName = (profile?.full_name || "").split(" ")[0] || "there";
  const plan = profile?.plan || "free";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const S = {
    page: { minHeight:"100vh", background:BG, padding:"32px 40px", fontFamily:"'Plus Jakarta Sans',sans-serif" },
    card: { background:CARD, border:`1px solid ${B}`, borderRadius:14, padding:22 },
    featureCard: { background:CARD, border:`1px solid ${B}`, borderRadius:12, padding:18, cursor:"pointer", transition:"border-color 0.15s, transform 0.15s" },
    stat: { background:CARD, border:`1px solid ${B}`, borderRadius:11, padding:16 },
    btn: { padding:"10px 22px", background:BLUE, color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" },
  };

  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .feat-card:hover { border-color: #0284c740 !important; transform: translateY(-2px); }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom:32 }}>
        <div style={{ fontSize:11, fontWeight:700, color:"#334", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>
          {isBusiness ? "🏢 Business Dashboard" : "👤 Personal Dashboard"}
        </div>
        <div style={{ fontSize:28, fontWeight:800, color:"#fff", letterSpacing:"-0.04em" }}>
          {greeting}, {firstName} 👋
        </div>
        <div style={{ fontSize:13, color:"#445", marginTop:4 }}>
          {isBusiness ? "Grow your brand with AI-powered tools" : "Build your digital presence and discover opportunities"}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:28 }}>
        {(isBusiness ? [
          { label:"Prompts Used", value:"24", change:"+8 this week" },
          { label:"Posts Scheduled", value:"12", change:"Next: Tomorrow" },
          { label:"Images Generated", value:"7", change:"3 remaining" },
          { label:"Community Posts", value:"5", change:"+2 this week" },
        ] : [
          { label:"Prompts Used", value:"8", change:"42 remaining" },
          { label:"Jobs Applied", value:"3", change:"2 pending" },
          { label:"Posts Scheduled", value:"6", change:"Next: Today" },
          { label:"Profile Views", value:"47", change:"+12 this week" },
        ]).map(s => (
          <div key={s.label} style={S.stat}>
            <div style={{ fontSize:24, fontWeight:800, color:"#fff", letterSpacing:"-0.04em" }}>{s.value}</div>
            <div style={{ fontSize:11, color:"#334", marginTop:2 }}>{s.label}</div>
            <div style={{ fontSize:11, color:BLUE, marginTop:4 }}>{s.change}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:24 }}>
        <div>
          {/* Features */}
          <div style={{ fontSize:14, fontWeight:700, color:"#fff", marginBottom:14 }}>Your Tools</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:28 }}>
            {features.map(f => (
              <div key={f.to} className="feat-card" style={S.featureCard} onClick={()=>nav(f.to)}>
                <div style={{ fontSize:20, color:f.color, marginBottom:8 }}>{f.icon}</div>
                <div style={{ fontSize:13, fontWeight:700, color:"#fff", marginBottom:4 }}>{f.label}</div>
                <div style={{ fontSize:12, color:"#445", lineHeight:1.5 }}>{f.desc}</div>
              </div>
            ))}
          </div>

          {/* Recent activity */}
          <div style={S.card}>
            <div style={{ fontSize:13, fontWeight:700, color:"#fff", marginBottom:14 }}>Recent Activity</div>
            {[
              { icon:"✦", text:`Generated 3 design prompts for ${isBusiness?"your Instagram campaign":"your portfolio content"}`, time:"2h ago" },
              { icon:"⊞", text:`Scheduled ${isBusiness?"a hiring post on LinkedIn":"a portfolio post on Instagram"}`, time:"Yesterday" },
              { icon:"◉", text:`${isBusiness?"Your offer post got 23 likes":"Your career update got 18 likes"} in Community`, time:"2 days ago" },
            ].map((a,i) => (
              <div key={i} style={{ display:"flex", gap:12, paddingBottom:12, borderBottom:i<2?`1px solid ${B}`:"none", marginBottom:i<2?12:0 }}>
                <div style={{ fontSize:16, color:BLUE, flexShrink:0 }}>{a.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, color:"#aaa" }}>{a.text}</div>
                  <div style={{ fontSize:11, color:"#334", marginTop:3 }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* Plan card */}
          <div style={{ ...S.card, marginBottom:16, border:`1px solid ${plan==="free"?B:BLUE+"40"}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:"#334", textTransform:"uppercase", letterSpacing:"0.08em" }}>Current Plan</div>
                <div style={{ fontSize:18, fontWeight:800, color:plan==="free"?"#ccc":BLUE, textTransform:"capitalize", marginTop:2 }}>{plan}</div>
              </div>
              {plan === "free" && <button onClick={()=>nav("/pricing")} style={S.btn}>Upgrade</button>}
            </div>
            {plan === "free" && (
              <div style={{ fontSize:12, color:"#445", lineHeight:1.5 }}>
                {isBusiness ? "Upgrade to unlock unlimited prompts, more image generations, and team features." : "Upgrade to apply for jobs, get unlimited prompts, and a verified community badge."}
              </div>
            )}
          </div>

          {/* Tips */}
          <div style={S.card}>
            <div style={{ fontSize:13, fontWeight:700, color:"#fff", marginBottom:14 }}>💡 Quick Tips</div>
            {tips.map((t,i) => (
              <div key={i} style={{ fontSize:12, color:"#445", marginBottom:10, display:"flex", gap:7, lineHeight:1.5 }}>
                <span style={{ color:BLUE, flexShrink:0, marginTop:1 }}>→</span>{t}
              </div>
            ))}
          </div>

          {/* Quick links */}
          <div style={{ ...S.card, marginTop:14 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#fff", marginBottom:12 }}>Quick Links</div>
            {[
              { label:"Gen-E AI Career Tools", url:"https://gene.nugens.in.net" },
              { label:"HyperX Learning Platform", url:"https://hyperx.nugens.in.net" },
              { label:"NuGens Dashboard", url:"https://nugens.in.net" },
            ].map(l => (
              <a key={l.label} href={l.url} style={{ display:"block", fontSize:12, color:BLUE, textDecoration:"none", marginBottom:8 }}>→ {l.label}</a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
