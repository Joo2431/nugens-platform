import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const PINK   = "#e8185d";
const TEXT   = "#111827";
const MUTED  = "#6b7280";
const LIGHT  = "#f8f9fb";
const CARD   = "#ffffff";
const BORDER = "#e8eaed";

const BIZ_FEATURES = [
  { icon:"✦", label:"Prompt Space",    desc:"Generate AI design prompts for your brand",     to:"/prompts",   color:PINK      },
  { icon:"⬡", label:"Image Generator", desc:"AI-powered posters, banners and social visuals", to:"/imagegen",  color:"#7c3aed" },
  { icon:"◈", label:"Content Planner", desc:"4-week AI content calendar for any platform",    to:"/planner",   color:"#16a34a" },
  { icon:"⊞", label:"Scheduler",       desc:"Schedule posts across all platforms in advance", to:"/scheduler", color:"#d97706" },
  { icon:"◉", label:"Community",       desc:"Business network — hiring, offers, insights",    to:"/community", color:"#0284c7" },
  { icon:"⬟", label:"Analytics",       desc:"Track your content performance",                 to:"/analytics", color:PINK      },
];

const IND_FEATURES = [
  { icon:"✦", label:"Prompt Space",    desc:"Generate AI design prompts for your work",       to:"/prompts",   color:PINK      },
  { icon:"⬡", label:"Image Generator", desc:"Create stunning visuals for your portfolio",      to:"/imagegen",  color:"#7c3aed" },
  { icon:"◈", label:"Content Planner", desc:"Plan your personal brand content calendar",       to:"/planner",   color:"#16a34a" },
  { icon:"⊞", label:"Scheduler",       desc:"Schedule posts consistently across platforms",    to:"/scheduler", color:"#d97706" },
  { icon:"◇", label:"Job Board",       desc:"Find jobs posted by DigiHub businesses",          to:"/jobs",      color:"#0284c7" },
  { icon:"◉", label:"Community",       desc:"Connect, showcase your work and collaborate",     to:"/community", color:PINK      },
];

const TIPS_BIZ = [
  "Post hiring updates in Community to attract DigiHub talent",
  "Use Image Generator for festive offer banners — completely free",
  "Schedule posts 3 days ahead for consistent brand presence",
  "Generate platform-specific prompts in Prompt Space for Midjourney",
];
const TIPS_IND = [
  "Share your portfolio in Community to attract freelance inquiries",
  "Apply to urgent job listings first — they fill fast",
  "Use Content Planner to maintain a consistent personal brand",
  "Image Generator is free for everyone — create visuals daily",
];

// Quick stats from Supabase
async function loadStats(userId) {
  const [posts, scheduled] = await Promise.all([
    supabase.from("dh_posts").select("id", { count:"exact", head:true }).eq("user_id", userId),
    supabase.from("dh_scheduled_posts").select("id", { count:"exact", head:true }).eq("user_id", userId),
  ]);
  return {
    posts:     posts.count     || 0,
    scheduled: scheduled.count || 0,
  };
}

export default function Dashboard({ profile }) {
  const nav = useNavigate();
  const [stats,   setStats]   = useState({ posts:0, scheduled:0 });
  const [loading, setLoading] = useState(true);

  const isBiz      = profile?.user_type === "business";
  const features   = isBiz ? BIZ_FEATURES : IND_FEATURES;
  const tips       = isBiz ? TIPS_BIZ : TIPS_IND;
  const firstName  = (profile?.full_name || "").split(" ")[0] || "there";
  const plan       = profile?.plan || "free";
  const hour       = new Date().getHours();
  const greeting   = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    if (!profile?.id) { setLoading(false); return; }
    loadStats(profile.id)
      .then(s => { setStats(s); setLoading(false); })
      .catch(() => setLoading(false));
  }, [profile?.id]);

  const S = {
    page: { minHeight:"100vh", background:LIGHT, padding:"32px 40px", fontFamily:"'Plus Jakarta Sans',sans-serif" },
    card: { background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:22, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" },
    stat: { background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, padding:"18px 20px", boxShadow:"0 1px 3px rgba(0,0,0,0.04)" },
    btn:  { padding:"10px 22px", background:PINK, color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" },
  };

  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .dh-feat:hover { box-shadow:0 4px 20px rgba(0,0,0,0.08)!important; transform:translateY(-2px); }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"#fef2f2", border:`1px solid ${PINK}20`, borderRadius:20, padding:"4px 14px", marginBottom:12 }}>
          <span style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", color:PINK }}>
            {isBiz ? "🏢 Business" : "👤 Individual"} · DigiHub
          </span>
        </div>
        <div style={{ fontSize:28, fontWeight:800, color:TEXT, letterSpacing:"-0.04em" }}>
          {greeting}, {firstName} 👋
        </div>
        <div style={{ fontSize:13, color:MUTED, marginTop:4 }}>
          {isBiz ? "Grow your brand with AI-powered marketing tools." : "Build your digital presence and discover opportunities."}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:28 }}>
        {[
          { label:"Posts Created",   value: loading ? "…" : stats.posts,       sub:"This month",        color:PINK      },
          { label:"Scheduled Posts", value: loading ? "…" : stats.scheduled,   sub:"In queue",          color:"#7c3aed" },
          { label:"Plan",            value: plan === "free" ? "Free" : plan.replace(/_/g," "), sub:"Current tier", color:"#16a34a" },
          { label:"Tools Available", value: features.length,                   sub: isBiz ? "Business tools" : "Individual tools", color:"#0284c7" },
        ].map(s => (
          <div key={s.label} style={S.stat}>
            <div style={{ fontSize:24, fontWeight:800, color:s.color, letterSpacing:"-0.04em" }}>{s.value}</div>
            <div style={{ fontSize:12, color:TEXT, fontWeight:600, marginTop:4 }}>{s.label}</div>
            <div style={{ fontSize:11, color:MUTED, marginTop:2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:24 }}>
        <div>
          {/* Feature grid */}
          <div style={{ fontSize:13, fontWeight:700, color:TEXT, marginBottom:14 }}>Your Tools</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12, marginBottom:28 }}>
            {features.map(f => (
              <div key={f.to} className="dh-feat" onClick={() => nav(f.to)}
                style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, padding:18, cursor:"pointer", transition:"all 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
                <div style={{ width:36, height:36, borderRadius:10, background:`${f.color}12`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, color:f.color, marginBottom:12 }}>
                  {f.icon}
                </div>
                <div style={{ fontSize:13, fontWeight:700, color:TEXT, marginBottom:4 }}>{f.label}</div>
                <div style={{ fontSize:12, color:MUTED, lineHeight:1.5 }}>{f.desc}</div>
              </div>
            ))}
          </div>

          {/* Quick start */}
          <div style={S.card}>
            <div style={{ fontSize:13, fontWeight:700, color:TEXT, marginBottom:14 }}>Quick Start</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <button onClick={() => nav("/prompts")} style={{ ...S.btn, background:PINK }}>✦ Generate Prompt</button>
              <button onClick={() => nav("/imagegen")} style={{ ...S.btn, background:"#7c3aed" }}>⬡ Create Image</button>
              <button onClick={() => nav("/planner")} style={{ ...S.btn, background:"#16a34a" }}>◈ Plan Content</button>
              <button onClick={() => nav(isBiz ? "/community" : "/jobs")} style={{ ...S.btn, background:"#0284c7" }}>
                {isBiz ? "◉ Community" : "◇ Job Board"}
              </button>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div>
          {/* Plan card */}
          <div style={{ ...S.card, marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>Your Plan</div>
            <div style={{ fontSize:18, fontWeight:800, color:plan==="free"?MUTED:PINK, textTransform:"capitalize", marginBottom:8 }}>
              {plan === "free" ? "Free" : plan.replace(/_/g," ")}
            </div>
            {plan === "free" && (
              <>
                <div style={{ fontSize:11, color:MUTED, marginBottom:12, lineHeight:1.5 }}>
                  Upgrade to access unlimited AI generations, analytics, and more.
                </div>
                <button onClick={() => nav("/pricing")} style={{ ...S.btn, width:"100%", fontSize:12 }}>
                  Upgrade Now →
                </button>
              </>
            )}
          </div>

          {/* Tips */}
          <div style={S.card}>
            <div style={{ fontSize:12, fontWeight:700, color:TEXT, marginBottom:12 }}>💡 Tips for You</div>
            {tips.map((tip, i) => (
              <div key={i} style={{ display:"flex", gap:8, marginBottom:10, fontSize:12, color:MUTED, lineHeight:1.55 }}>
                <span style={{ color:PINK, flexShrink:0, fontSize:10, marginTop:2 }}>→</span>
                {tip}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}