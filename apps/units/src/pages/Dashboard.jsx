import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const PINK  = "#e8185d";
const TEXT  = "#111827";
const MUTED = "#6b7280";
const LIGHT = "#f8f9fb";
const CARD  = "#ffffff";
const BORDER= "#e8eaed";

const BIZ_FEATURES = [
  { icon:"◉", label:"Content Feed",      desc:"Showcase your brand content to the community", to:"/feed",     color:PINK,      bg:"#fef2f2" },
  { icon:"✦", label:"AI Guidance",       desc:"AI-powered content creation strategies",        to:"/guidance", color:"#7c3aed", bg:"#f5f3ff" },
  { icon:"◈", label:"Book Our Services", desc:"Hire NuGens for content, design & more",        to:"/book",     color:"#0284c7", bg:"#eff6ff" },
  { icon:"⊞", label:"Compare Packages",  desc:"Find the right package for your project",       to:"/compare",  color:"#16a34a", bg:"#f0fdf4" },
];

const IND_FEATURES = [
  { icon:"⬡", label:"Live Experience",    desc:"Work on real brands — chat-based live sessions", to:"/live",     color:PINK,      bg:"#fef2f2" },
  { icon:"◇", label:"Entrepreneur Guide", desc:"Free guidance to build your business",            to:"/guide",    color:"#16a34a", bg:"#f0fdf4" },
  { icon:"◑", label:"Idea Validation",    desc:"Submit your idea — we validate & advise",         to:"/validate", color:"#7c3aed", bg:"#f5f3ff" },
  { icon:"◈", label:"Book Consultation",  desc:"Premium 1-on-1 with our expert team",             to:"/book",     color:"#0284c7", bg:"#eff6ff" },
];

export default function Dashboard({ profile, user }) {
  const nav       = useNavigate();
  const isBiz     = profile?.user_type === "business";
  const features  = isBiz ? BIZ_FEATURES : IND_FEATURES;
  const firstName = (profile?.full_name?.trim() || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "").split(" ")[0] || "there";
  const plan      = profile?.plan || "free";
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // ── Real stats from Supabase ──────────────────────────────────────────────
  const [stats,    setStats]    = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!profile?.id) { setLoading(false); return; }
    loadRealStats(profile.id, isBiz);
  }, [profile?.id, isBiz]);

  const loadRealStats = async (userId, bizMode) => {
    try {
      const weekAgo  = new Date(Date.now() - 7  * 24*60*60*1000).toISOString();
      const monthAgo = new Date(Date.now() - 30 * 24*60*60*1000).toISOString();

      // Run all queries in parallel
      const [
        bookingsRes,
        bookingsActiveRes,
        recentBookingsRes,
      ] = await Promise.all([
        // Total bookings for this user
        supabase.from("units_bookings").select("*", { count:"exact", head:true }).eq("user_id", userId),
        // Active bookings (confirmed or in_progress)
        supabase.from("units_bookings").select("*", { count:"exact", head:true })
          .eq("user_id", userId).in("status", ["confirmed","in_progress"]),
        // Most recent 3 bookings for activity feed
        supabase.from("units_bookings").select("service_type,package_name,status,created_at,updated_at")
          .eq("user_id", userId).order("created_at", { ascending:false }).limit(3),
      ]);

      if (bizMode) {
        setStats([
          { label:"Total Bookings",  value: String(bookingsRes.count      || 0),  sub:"All time",        color:PINK          },
          { label:"Active Projects", value: String(bookingsActiveRes.count || 0),  sub:"In progress",     color:"#7c3aed"     },
          { label:"AI Sessions",     value: "—",                                   sub:"Via AI Guidance", color:"#0284c7"     },
          { label:"Services Used",   value: String(new Set((recentBookingsRes.data||[]).map(b=>b.service_type).filter(Boolean)).size || 0), sub:"Different services", color:"#16a34a" },
        ]);
      } else {
        setStats([
          { label:"Enquiries Made",  value: String(bookingsRes.count      || 0),  sub:"Consultations booked", color:PINK      },
          { label:"Active Projects", value: String(bookingsActiveRes.count || 0),  sub:"In progress",          color:"#7c3aed" },
          { label:"AI Chats",        value: "—",                                   sub:"Via AI Guidance",       color:"#16a34a" },
          { label:"Ideas Submitted", value: "—",                                   sub:"Idea Validation",       color:"#0284c7" },
        ]);
      }

      // Build activity feed from real bookings
      const activityItems = (recentBookingsRes.data || []).map(b => {
        const statusIcons  = { enquiry:"◈", confirmed:"✓", in_progress:"◉", delivered:"★", cancelled:"✕" };
        const statusColors = { enquiry:"#0284c7", confirmed:"#16a34a", in_progress:PINK, delivered:"#7c3aed", cancelled:MUTED };
        const svc = b.service_type?.replace(/-/g," ") || "service";
        const pkg = b.package_name ? ` — ${b.package_name}` : "";
        const timeAgo = getTimeAgo(b.created_at);
        return {
          icon:  statusIcons[b.status]  || "◈",
          color: statusColors[b.status] || MUTED,
          text:  `Booking: ${svc}${pkg} (${b.status})`,
          time:  timeAgo,
        };
      });
      setActivity(activityItems);
    } catch(e) {
      console.error("Units dashboard stats error:", e.message);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (ts) => {
    const secs = Math.floor((Date.now() - new Date(ts)) / 1000);
    if (secs < 3600)  return `${Math.floor(secs/60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs/3600)}h ago`;
    return `${Math.floor(secs/86400)}d ago`;
  };

  // Fallback static activity when no real bookings yet
  const defaultActivity = isBiz ? [
    { icon:"◉", text:"Welcome to Units! Post your first brand update in Content Feed.",  time:"Now",        color:PINK     },
    { icon:"✦", text:"Try AI Guidance for content strategy ideas.",                      time:"Get started", color:"#7c3aed"},
    { icon:"◈", text:"Book our services — video, design, website and more.",              time:"Explore →",  color:"#0284c7"},
  ] : [
    { icon:"⬡", text:"Start with a Live Experience — work on a real brand session.",     time:"Get started", color:PINK     },
    { icon:"◑", text:"Have a business idea? Submit it for AI + team validation.",         time:"Try it →",   color:"#7c3aed"},
    { icon:"◇", text:"Read the Entrepreneur Guide — step-by-step business frameworks.",   time:"Free →",     color:"#16a34a"},
  ];

  const displayActivity = activity.length > 0 ? activity : defaultActivity;

  // Stats to render — real if loaded, skeleton if loading
  const displayStats = stats || (isBiz ? [
    { label:"Total Bookings",  value: loading ? "…" : "0", sub:"All time",        color:PINK      },
    { label:"Active Projects", value: loading ? "…" : "0", sub:"In progress",     color:"#7c3aed" },
    { label:"AI Sessions",     value: "—",                  sub:"Via AI Guidance", color:"#0284c7" },
    { label:"Services Used",   value: loading ? "…" : "0", sub:"Different services", color:"#16a34a"},
  ] : [
    { label:"Enquiries Made",  value: loading ? "…" : "0", sub:"Consultations booked", color:PINK      },
    { label:"Active Projects", value: loading ? "…" : "0", sub:"In progress",          color:"#7c3aed" },
    { label:"AI Chats",        value: "—",                  sub:"Via AI Guidance",      color:"#16a34a" },
    { label:"Ideas Submitted", value: "—",                  sub:"Idea Validation",      color:"#0284c7" },
  ]);

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

      {/* Stats — real from Supabase */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12, marginBottom:24 }}>
        {displayStats.map(s => (
          <div key={s.label} style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:"18px 20px", boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize:26, fontWeight:800, color:s.color, letterSpacing:"-0.04em", opacity:loading?0.5:1 }}>{s.value}</div>
            <div style={{ fontSize:12, color:TEXT, fontWeight:600, marginTop:4 }}>{s.label}</div>
            <div style={{ fontSize:11, color:MUTED, marginTop:2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:20 }}>
        <div>
          {/* Feature cards */}
          <div style={{ fontSize:13, fontWeight:700, color:TEXT, marginBottom:14, letterSpacing:"-0.01em" }}>Your Space</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:14, marginBottom:28 }}>
            {features.map(f => (
              <div key={f.to} className="feat-card" onClick={()=>nav(f.to)}
                style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:22, cursor:"pointer", transition:"all 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
                <div style={{ width:42, height:42, borderRadius:12, background:f.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, color:f.color, marginBottom:14 }}>{f.icon}</div>
                <div style={{ fontSize:14, fontWeight:700, color:TEXT, marginBottom:5 }}>{f.label}</div>
                <div style={{ fontSize:12, color:MUTED, lineHeight:1.55 }}>{f.desc}</div>
                <div style={{ marginTop:12, fontSize:12, color:f.color, fontWeight:600 }}>Open →</div>
              </div>
            ))}
          </div>

          {/* Activity feed — real data */}
          <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:22, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:700, color:TEXT }}>
                {activity.length > 0 ? "Recent Bookings" : "Getting Started"}
              </div>
              {activity.length > 0 && (
                <button onClick={()=>nav("/book")} style={{ fontSize:12, color:PINK, fontWeight:700, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit" }}>
                  View all →
                </button>
              )}
            </div>
            {displayActivity.map((a,i) => (
              <div key={i} style={{ display:"flex", gap:12, paddingBottom:14, borderBottom:i<displayActivity.length-1?`1px solid #f3f4f6`:"none", marginBottom:i<displayActivity.length-1?14:0 }}>
                <div style={{ width:34, height:34, borderRadius:10, background:a.color+"15", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, color:a.color, flexShrink:0 }}>{a.icon}</div>
                <div>
                  <div style={{ fontSize:13, color:TEXT, textTransform:"capitalize" }}>{a.text}</div>
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

          {/* Services offered */}
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

          {/* CTA */}
          <div style={{ background:`linear-gradient(135deg, ${PINK}15 0%, #7c3aed15 100%)`, border:`1px solid ${PINK}20`, borderRadius:14, padding:20 }}>
            <div style={{ fontSize:14, fontWeight:700, color:TEXT, marginBottom:6 }}>
              {isBiz ? "Ready to create?" : "Have a business idea?"}
            </div>
            <div style={{ fontSize:12, color:MUTED, marginBottom:14 }}>
              {isBiz ? "Book NuGens for your next content project. We handle everything." : "Drop it in Idea Validation — our AI + team will give you a detailed analysis."}
            </div>
            <button onClick={()=>nav(isBiz?"/book":"/validate")}
              style={{ width:"100%", padding:"10px 0", background:PINK, color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
              {isBiz ? "Book a service →" : "Validate my idea →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}