import React from "react";
import { useNavigate } from "react-router-dom";

const PINK  = "#e8185d";
const TEXT  = "#111827";
const MUTED = "#6b7280";
const LIGHT = "#f8f9fb";
const CARD  = "#ffffff";
const BORDER= "#e8eaed";

const BIZ_FEATURES = [
  { icon:"◉", label:"Content Feed",      desc:"Showcase your brand content to the community", to:"/feed",     color:PINK,     bg:"#fef2f2" },
  { icon:"✦", label:"AI Guidance",       desc:"AI-powered content creation strategies",        to:"/guidance", color:"#7c3aed", bg:"#f5f3ff" },
  { icon:"◈", label:"Book Our Services", desc:"Hire NuGens for content, design & more",        to:"/book",     color:"#0284c7", bg:"#eff6ff" },
];

const IND_FEATURES = [
  { icon:"⬡", label:"Live Experience",   desc:"Work on real brands — chat-based live sessions", to:"/live",     color:PINK,      bg:"#fef2f2" },
  { icon:"◇", label:"Entrepreneur Guide",desc:"Free guidance to build your business",            to:"/guide",    color:"#16a34a", bg:"#f0fdf4" },
  { icon:"◑", label:"Idea Validation",   desc:"Submit your idea — we validate & advise",         to:"/validate", color:"#7c3aed", bg:"#f5f3ff" },
  { icon:"◈", label:"Book Consultation", desc:"Premium 1-on-1 with our expert team",             to:"/book",     color:"#0284c7", bg:"#eff6ff" },
];

const BIZ_STATS = [
  { label:"Content Posts",    value:"12", sub:"3 this week",      color:PINK    },
  { label:"Community Reach",  value:"4.8k", sub:"+22% this month",color:"#7c3aed"},
  { label:"AI Sessions",      value:"8",   sub:"Last 30 days",    color:"#0284c7"},
  { label:"Active Bookings",  value:"2",   sub:"In progress",     color:"#16a34a"},
];

const IND_STATS = [
  { label:"Live Sessions",    value:"3",   sub:"2 completed",     color:PINK    },
  { label:"Ideas Validated",  value:"1",   sub:"Awaiting feedback",color:"#7c3aed"},
  { label:"Guide Chapters",   value:"5/12",sub:"Keep going!",     color:"#16a34a"},
  { label:"AI Chats",         value:"24",  sub:"This month",      color:"#0284c7"},
];

export default function Dashboard({ profile }) {
  const nav       = useNavigate();
  const isBiz     = profile?.user_type === "business";
  const features  = isBiz ? BIZ_FEATURES : IND_FEATURES;
  const stats     = isBiz ? BIZ_STATS    : IND_STATS;
  const firstName = (profile?.full_name || "").split(" ")[0] || "there";
  const plan      = profile?.plan || "free";
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div style={{ minHeight:"100vh", background:LIGHT, padding:"36px 44px", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'); .feat-card:hover{box-shadow:0 4px 20px rgba(0,0,0,0.08)!important;transform:translateY(-2px);}`}</style>

      {/* Header */}
      <div style={{ marginBottom:36 }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"#fef2f2", border:`1px solid ${PINK}20`, borderRadius:20, padding:"4px 14px", marginBottom:12 }}>
          <span style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", color:PINK }}>{isBiz ? "🏢 Business" : "👤 Individual"}</span>
        </div>
        <div style={{ fontSize:30, fontWeight:800, color:TEXT, letterSpacing:"-0.04em" }}>
          {greeting}, {firstName} 👋
        </div>
        <div style={{ fontSize:14, color:MUTED, marginTop:6 }}>
          {isBiz ? "Grow your brand with NuGens creative expertise" : "Your entrepreneurial journey starts here"}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:32 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:"18px 20px", boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize:26, fontWeight:800, color:s.color, letterSpacing:"-0.04em" }}>{s.value}</div>
            <div style={{ fontSize:12, color:TEXT, fontWeight:600, marginTop:4 }}>{s.label}</div>
            <div style={{ fontSize:11, color:MUTED, marginTop:2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:24 }}>
        <div>
          {/* Feature cards */}
          <div style={{ fontSize:13, fontWeight:700, color:TEXT, marginBottom:14, letterSpacing:"-0.01em" }}>Your Space</div>
          <div style={{ display:"grid", gridTemplateColumns: isBiz ? "repeat(3,1fr)" : "repeat(2,1fr)", gap:14, marginBottom:28 }}>
            {features.map(f => (
              <div key={f.to} className="feat-card" onClick={()=>nav(f.to)} style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:22, cursor:"pointer", transition:"all 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
                <div style={{ width:42, height:42, borderRadius:12, background:f.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, color:f.color, marginBottom:14 }}>{f.icon}</div>
                <div style={{ fontSize:14, fontWeight:700, color:TEXT, marginBottom:5 }}>{f.label}</div>
                <div style={{ fontSize:12, color:MUTED, lineHeight:1.55 }}>{f.desc}</div>
                <div style={{ marginTop:12, fontSize:12, color:f.color, fontWeight:600 }}>Open →</div>
              </div>
            ))}
          </div>

          {/* Activity feed */}
          <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:22, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize:13, fontWeight:700, color:TEXT, marginBottom:16 }}>Recent Activity</div>
            {(isBiz ? [
              { icon:"◉", text:"Posted a brand reel in Content Feed", time:"2h ago",    color:PINK    },
              { icon:"✦", text:"AI generated 5 content strategy ideas", time:"Yesterday",color:"#7c3aed"},
              { icon:"◈", text:"Booking confirmed — Website build project", time:"3 days ago",color:"#0284c7"},
            ] : [
              { icon:"⬡", text:"Completed a live brand session with mentor", time:"1h ago",  color:PINK    },
              { icon:"◑", text:"Idea submitted: SaaS for local kirana stores", time:"Yesterday",color:"#7c3aed"},
              { icon:"◇", text:"Read Chapter 3: Finding Product-Market Fit", time:"2 days ago",color:"#16a34a"},
            ]).map((a,i) => (
              <div key={i} style={{ display:"flex", gap:12, paddingBottom:14, borderBottom:i<2?`1px solid #f3f4f6`:"none", marginBottom:i<2?14:0 }}>
                <div style={{ width:34, height:34, borderRadius:10, background:a.color+"15", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, color:a.color, flexShrink:0 }}>{a.icon}</div>
                <div>
                  <div style={{ fontSize:13, color:TEXT }}>{a.text}</div>
                  <div style={{ fontSize:11, color:MUTED, marginTop:2 }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right sidebar */}
        <div>
          {/* Plan card */}
          <div style={{ background:CARD, border:`1px solid ${plan==="free"?BORDER:PINK+"30"}`, borderRadius:14, padding:20, marginBottom:16, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <div>
                <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:MUTED }}>Your Plan</div>
                <div style={{ fontSize:18, fontWeight:800, color:plan==="free"?TEXT:PINK, textTransform:"capitalize", marginTop:2 }}>{plan}</div>
              </div>
              {plan==="free" && (
                <button onClick={()=>nav("/pricing")} style={{ padding:"8px 16px", background:PINK, color:"#fff", border:"none", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                  Upgrade
                </button>
              )}
            </div>
            <div style={{ fontSize:12, color:MUTED, lineHeight:1.6 }}>
              {isBiz ? "Book our services or upgrade to get dedicated support, priority booking, and branded deliverables." : "All core features are free. Premium consultation upgrades are pay-per-session."}
            </div>
          </div>

          {/* What we offer */}
          <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:20, marginBottom:16, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize:13, fontWeight:700, color:TEXT, marginBottom:14 }}>{isBiz ? "Our Services" : "What You Get"}</div>
            {(isBiz ? [
              "🎬 Video editing & post-production",
              "📱 Content strategy & scripting",
              "🎨 Graphic design & brand identity",
              "🌐 Website building",
              "📣 Marketing campaigns",
              "💡 Creative direction",
            ] : [
              "🎯 Live brand-building sessions",
              "🧭 Step-by-step entrepreneur guide",
              "✅ AI-powered idea validation",
              "💬 Team consultation (premium)",
              "🤝 Mentor connect via Gen-E Mini",
              "📚 Free learning resources",
            ]).map((item,i) => (
              <div key={i} style={{ fontSize:12, color:MUTED, marginBottom:8, display:"flex", gap:6 }}>
                <span style={{ flexShrink:0 }}>{item.split(" ")[0]}</span>
                <span>{item.split(" ").slice(1).join(" ")}</span>
              </div>
            ))}
          </div>

          {/* Quick CTA */}
          <div style={{ background:`linear-gradient(135deg, ${PINK}15 0%, #7c3aed15 100%)`, border:`1px solid ${PINK}20`, borderRadius:14, padding:20 }}>
            <div style={{ fontSize:14, fontWeight:700, color:TEXT, marginBottom:6 }}>
              {isBiz ? "Ready to create?" : "Have a business idea?"}
            </div>
            <div style={{ fontSize:12, color:MUTED, marginBottom:14 }}>
              {isBiz ? "Book NuGens for your next content project. We handle everything." : "Drop it in Idea Validation — our AI + team will give you a detailed analysis."}
            </div>
            <button onClick={()=>nav(isBiz?"/book":"/validate")} style={{ width:"100%", padding:"10px 0", background:PINK, color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
              {isBiz ? "Book a service →" : "Validate my idea →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
