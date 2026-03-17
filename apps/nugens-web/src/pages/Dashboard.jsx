import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { NG_LOGO } from "../lib/logo";
import OnboardingModal from "../components/OnboardingModal";

const PINK   = "#e8185d";
const TEXT   = "#111827";
const MUTED  = "#6b7280";
const LIGHT  = "#f8f9fb";
const CARD   = "#ffffff";
const BORDER = "#e8eaed";

const ALL_PRODUCTS = {
  gene:   { icon:"◎", name:"Gen-E AI",   tag:"Career Intelligence",   color:"#7c3aed", href:"https://gene.nugens.in.net",    desc:"AI career coach, resume builder, skill gap analyser, job matching" },
  hyperx: { icon:"⬡", name:"HyperX",    tag:"Learning Platform",     color:PINK,      href:"https://hyperx.nugens.in.net",  desc:"Professional courses, skill building, and industry certifications" },
  digihub:{ icon:"◈", name:"DigiHub",   tag:"Marketing & Community", color:"#0284c7", href:"https://digihub.nugens.in.net", desc:"Brand tools, AI content planner, community and job board" },
  units:  { icon:"◇", name:"The Units", tag:"Creative Studio",       color:"#d97706", href:"https://units.nugens.in.net",   desc:"Brand strategy, content production, and entrepreneur guidance" },
};

const GOAL_PRODUCTS = {
  get_promoted:       ["hyperx","gene","digihub","units"],
  switch_career:      ["gene","hyperx","digihub","units"],
  learn_skills:       ["hyperx","gene","digihub","units"],
  get_first_job:      ["gene","hyperx","digihub","units"],
  grow_income:        ["gene","hyperx","units","digihub"],
  build_brand:        ["digihub","units","gene","hyperx"],
  train_team:         ["hyperx","digihub","gene","units"],
  hire_talent:        ["digihub","gene","units","hyperx"],
  digital_marketing:  ["digihub","units","gene","hyperx"],
  content_production: ["units","digihub","gene","hyperx"],
};

// Human-readable plan names — sourced from DB profile.plan
const PLAN_LABELS = {
  free:             { label:"Free",             color:MUTED,     paid:false },
  monthly:          { label:"Pro Monthly",      color:"#7c3aed", paid:true  },
  yearly:           { label:"Pro Yearly",       color:"#7c3aed", paid:true  },
  admin:            { label:"Admin",            color:PINK,      paid:true  },
  hx_ind_starter:   { label:"HyperX Starter",  color:PINK,      paid:true  },
  hx_ind_premium:   { label:"HyperX Premium",  color:PINK,      paid:true  },
  hx_ind_pro:       { label:"HyperX Pro",       color:PINK,      paid:true  },
  hx_ind_yearly:    { label:"HyperX Yearly",    color:PINK,      paid:true  },
  hx_biz_starter:   { label:"Biz Starter",     color:"#0284c7", paid:true  },
  hx_biz_premium:   { label:"Biz Premium",     color:"#0284c7", paid:true  },
  hx_biz_pro:       { label:"Biz Pro",          color:"#0284c7", paid:true  },
  hx_biz_yearly:    { label:"Biz Yearly",       color:"#0284c7", paid:true  },
};

const GOAL_LABEL = {
  get_promoted:"Get Promoted", switch_career:"Switch Career", learn_skills:"Learn Skills",
  get_first_job:"First Job", grow_income:"Grow Income", build_brand:"Build Brand",
  train_team:"Train Team", hire_talent:"Hire Talent", digital_marketing:"Digital Marketing",
  content_production:"Content Production",
};

export default function Dashboard() {
  const [user,           setUser]           = useState(null);
  const [profile,        setProfile]        = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab,      setActiveTab]      = useState("overview");

  // Fetch full profile including plan from DB — never rely on session token claims
  const fetchProfile = async (uid) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .single();
    if (data) {
      setProfile(data);
      if (!data.onboarding_done) setShowOnboarding(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    let done = false;

    const timeout = setTimeout(() => {
      if (!done) { done = true; setLoading(false); }
    }, 6000);

    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (e) {
        console.error("Dashboard init:", e.message);
        setLoading(false);
      }
      if (!done) { done = true; clearTimeout(timeout); }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
        if (!done) { done = true; clearTimeout(timeout); }
      } else {
        setProfile(null);
        setLoading(false);
        if (!done) { done = true; clearTimeout(timeout); }
      }
    });

    // After Razorpay redirect — force fresh profile fetch
    const params = new URLSearchParams(window.location.search);
    if (params.get("subscribed") === "1") {
      window.history.replaceState({}, "", window.location.pathname);
      setTimeout(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) await fetchProfile(session.user.id);
      }, 1500);
    }

    init();
    return () => { clearTimeout(timeout); subscription.unsubscribe(); };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const onOnboardingDone = (answers) => {
    setProfile(p => ({ ...p, ...answers, onboarding_done: true }));
    setShowOnboarding(false);
  };

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#fff", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ fontWeight:800, fontSize:22, color:PINK, fontFamily:"'Plus Jakarta Sans',sans-serif", letterSpacing:"-0.04em" }}>
        Nu<span style={{color:"#111"}}>Gens</span>
      </div>
    </div>
  );

  // ── Derived values ──────────────────────────────────────────────────────
  const firstName = (profile?.full_name || user?.user_metadata?.full_name || user?.email || "").split(" ")[0] || "there";
  const initials  = firstName.slice(0, 2).toUpperCase();
  const avatar    = profile?.avatar_url || user?.user_metadata?.avatar_url || null;

  // Plan ALWAYS read from DB profile — never from session/JWT
  const planKey   = profile?.plan || "free";
  const planInfo  = PLAN_LABELS[planKey] || { label: planKey, color: MUTED, paid: false };
  const isPaid    = planInfo.paid;

  const userType  = profile?.user_type || "individual";
  const isBiz     = userType === "business";
  const goal      = profile?.goal || profile?.business_need;

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Personalise product order by goal
  const orderedKeys = goal && GOAL_PRODUCTS[goal]
    ? GOAL_PRODUCTS[goal]
    : ["gene", "hyperx", "digihub", "units"];
  const products  = orderedKeys.map(k => ALL_PRODUCTS[k]);
  const topProd   = products[0];

  const S = {
    page:  { minHeight:"100vh", background:LIGHT, fontFamily:"'Plus Jakarta Sans',sans-serif" },
    aside: { width:220, minHeight:"100vh", background:CARD, borderRight:`1px solid ${BORDER}`, display:"flex", flexDirection:"column", padding:"20px 12px", position:"sticky", top:0, flexShrink:0 },
    main:  { flex:1, minWidth:0, overflowX:"hidden" },
    topbar:{ background:CARD, borderBottom:`1px solid ${BORDER}`, padding:"14px 32px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:10 },
    nav:   (active) => ({
      display:"flex", alignItems:"center", gap:9, padding:"9px 11px", borderRadius:9,
      fontSize:13, fontWeight:active?700:500, color:active?PINK:MUTED,
      background:active?`${PINK}08`:"none", border:"none", cursor:"pointer",
      textAlign:"left", width:"100%", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all 0.14s",
    }),
    statCard: { background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, padding:"18px 20px", boxShadow:"0 1px 3px rgba(0,0,0,0.04)" },
    pcard: { background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:20, textDecoration:"none", display:"block", transition:"all 0.18s", boxShadow:"0 1px 3px rgba(0,0,0,0.04)" },
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{font-family:'Plus Jakarta Sans',sans-serif;background:#f8f9fb;-webkit-font-smoothing:antialiased}
        .pcard:hover{box-shadow:0 6px 24px rgba(0,0,0,0.09)!important;transform:translateY(-2px)}
        .nav-link:hover{background:#fef2f2!important;color:${PINK}!important}
        .prod-link:hover{border-color:${PINK}30!important}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        .fadein{animation:fadeUp 0.25s ease both}
        @media(max-width:860px){.dl{flex-direction:column!important}.aside{display:none!important}}
      `}</style>

      {showOnboarding && user && (
        <OnboardingModal user={user} onComplete={onOnboardingDone} />
      )}

      <div className="dl" style={{ display:"flex", minHeight:"100vh" }}>

        {/* ── SIDEBAR ── */}
        <div className="aside" style={S.aside}>
          {/* Logo */}
          <div style={{ display:"flex", alignItems:"center", gap:9, padding:"0 4px", marginBottom:28 }}>
            <img src={NG_LOGO} style={{ width:28, height:28, borderRadius:7, objectFit:"cover" }} alt="NG" />
            <span style={{ fontWeight:800, fontSize:15, color:TEXT, letterSpacing:"-0.03em" }}>
              Nu<span style={{color:PINK}}>Gens</span>
            </span>
          </div>

          {/* Nav */}
          <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"#d1d5db", padding:"0 10px", marginBottom:8 }}>Workspace</div>
          <div style={{ display:"flex", flexDirection:"column", gap:2, marginBottom:24 }}>
            {[
              ["overview","⊞","Overview"],
              ["products","◉","My Products"],
              ["settings","⚙","Settings"],
            ].map(([id, ic, lbl]) => (
              <button key={id} style={S.nav(activeTab===id)} className="nav-link" onClick={() => setActiveTab(id)}>
                <span style={{ fontSize:14, width:18, textAlign:"center", flexShrink:0, color:activeTab===id?PINK:"#d1d5db" }}>{ic}</span>
                {lbl}
              </button>
            ))}
          </div>

          <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"#d1d5db", padding:"0 10px", marginBottom:8 }}>Products</div>
          <div style={{ display:"flex", flexDirection:"column", gap:2, flex:1 }}>
            {orderedKeys.map(k => {
              const p = ALL_PRODUCTS[k];
              return (
                <a key={k} href={p.href} target="_blank" rel="noreferrer" className="nav-link"
                  style={{ display:"flex", alignItems:"center", gap:9, padding:"9px 11px", borderRadius:9, fontSize:13, fontWeight:500, color:MUTED, textDecoration:"none", transition:"all 0.14s" }}>
                  <span style={{ fontSize:13, color:p.color, width:18, textAlign:"center", flexShrink:0 }}>{p.icon}</span>
                  {p.name}
                </a>
              );
            })}
          </div>

          {/* Plan badge */}
          <div style={{ background:isPaid?`${planInfo.color}08`:"#f8f9fb", border:`1px solid ${isPaid?planInfo.color+"20":BORDER}`, borderRadius:10, padding:"10px 12px", marginBottom:12 }}>
            <div style={{ fontSize:10, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:3 }}>Current Plan</div>
            <div style={{ fontSize:13, fontWeight:800, color:planInfo.color }}>{planInfo.label}</div>
            {!isPaid && <Link to="/pricing" style={{ fontSize:11, color:PINK, fontWeight:600, textDecoration:"none" }}>Upgrade →</Link>}
          </div>

          {/* Profile chip */}
          <div style={{ borderTop:`1px solid ${BORDER}`, paddingTop:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 10px", background:"#f8f9fb", borderRadius:9 }}>
              <div style={{ width:30, height:30, borderRadius:"50%", flexShrink:0, overflow:"hidden", background:`${PINK}15`, border:`1.5px solid ${PINK}30`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                {avatar
                  ? <img src={avatar} style={{ width:30, height:30, objectFit:"cover" }} alt={firstName} />
                  : <span style={{ fontSize:11, fontWeight:700, color:PINK }}>{initials}</span>
                }
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:700, color:TEXT, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{firstName}</div>
                <div style={{ fontSize:10, color:MUTED, textTransform:"capitalize" }}>{userType}</div>
              </div>
              <button onClick={signOut} title="Sign out" style={{ background:"none", border:"none", cursor:"pointer", color:MUTED, fontSize:14, padding:2 }}>⇥</button>
            </div>
          </div>
        </div>

        {/* ── MAIN ── */}
        <div style={S.main}>

          {/* Topbar */}
          <div style={S.topbar}>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:TEXT, letterSpacing:"-0.02em" }}>{greeting}, {firstName} 👋</div>
              <div style={{ fontSize:12, color:MUTED, marginTop:1 }}>
                {isBiz ? "Business workspace" : "Personal workspace"}
                {goal ? ` · ${GOAL_LABEL[goal] || goal}` : ""}
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", padding:"4px 12px", borderRadius:20, background:isBiz?`#eff6ff`:`#fef2f2`, color:isBiz?"#0284c7":PINK, border:`1px solid ${isBiz?"#bfdbfe":PINK+"30"}` }}>
                {isBiz ? "🏢 Business" : "👤 Individual"}
              </span>
              {!isPaid && (
                <Link to="/pricing" style={{ fontSize:12, fontWeight:700, color:PINK, textDecoration:"none", padding:"6px 14px", border:`1px solid ${PINK}30`, borderRadius:8, background:`${PINK}08` }}>
                  Upgrade ↑
                </Link>
              )}
            </div>
          </div>

          <div style={{ padding:"28px 32px 60px" }}>

            {/* ── OVERVIEW TAB ── */}
            {activeTab === "overview" && (
              <div className="fadein">

                {/* Personalised hero */}
                {profile?.onboarding_done && goal && topProd && (
                  <div style={{ background:`${topProd.color}08`, border:`1px solid ${topProd.color}20`, borderRadius:14, padding:"20px 24px", marginBottom:24, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:topProd.color, marginBottom:6 }}>Recommended for your goal</div>
                      <div style={{ fontSize:16, fontWeight:800, color:TEXT, letterSpacing:"-0.03em", marginBottom:4 }}>{topProd.name} is your best starting point</div>
                      <div style={{ fontSize:13, color:MUTED }}>{topProd.desc}</div>
                    </div>
                    <a href={topProd.href} target="_blank" rel="noreferrer"
                      style={{ padding:"11px 22px", borderRadius:9, background:topProd.color, color:"#fff", fontSize:13, fontWeight:700, textDecoration:"none", whiteSpace:"nowrap" }}>
                      Open {topProd.name} →
                    </a>
                  </div>
                )}

                {/* Stats */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:28 }}>
                  {[
                    { label:"Products",    value:"4",              sub:"accessible",      color:"#7c3aed" },
                    { label:"Plan",        value:planInfo.label,   sub:"from database",   color:planInfo.color },
                    { label:"Account",     value:isBiz?"Business":"Individual", sub:"type", color:"#0284c7" },
                    { label:"Member since",value:user?.created_at ? new Date(user.created_at).toLocaleDateString("en-IN",{month:"short",year:"numeric"}) : "—", sub:"joined", color:"#d97706" },
                  ].map(s => (
                    <div key={s.label} style={S.statCard}>
                      <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:MUTED, marginBottom:6 }}>{s.label}</div>
                      <div style={{ fontSize:18, fontWeight:800, color:s.color, letterSpacing:"-0.03em", lineHeight:1.1 }}>{s.value}</div>
                      <div style={{ fontSize:11, color:MUTED, marginTop:4 }}>{s.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Upgrade prompt — only for free plan */}
                {!isPaid && (
                  <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:"20px 24px", marginBottom:28, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
                    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:16 }}>
                      <div>
                        <div style={{ fontSize:15, fontWeight:800, color:TEXT, marginBottom:4 }}>
                          {isBiz ? "Unlock NuGens for your team" : "Unlock your full potential"}
                        </div>
                        <div style={{ fontSize:13, color:MUTED }}>
                          {isBiz
                            ? "Team learning, hiring tools, content creation — all in one plan"
                            : "Unlimited AI, all courses, resume builder and career coaching"}
                        </div>
                      </div>
                      <Link to="/pricing" style={{ padding:"10px 22px", borderRadius:9, background:PINK, color:"#fff", fontSize:13, fontWeight:700, textDecoration:"none", whiteSpace:"nowrap" }}>
                        View plans →
                      </Link>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, maxWidth:400 }}>
                      {[
                        { label:"Monthly", price: isBiz?"₹999/mo":"₹299/mo", best:false },
                        { label:"Yearly · Save 44%", price: isBiz?"₹7,999/yr":"₹1,999/yr", best:true },
                      ].map(opt => (
                        <div key={opt.label} style={{ background:opt.best?`${PINK}08`:"#f8f9fb", border:`1px solid ${opt.best?PINK+"30":BORDER}`, borderRadius:10, padding:"12px 16px", position:"relative" }}>
                          {opt.best && (
                            <div style={{ position:"absolute", top:-8, left:"50%", transform:"translateX(-50%)", background:PINK, color:"#fff", fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:10, whiteSpace:"nowrap" }}>BEST VALUE</div>
                          )}
                          <div style={{ fontSize:18, fontWeight:800, color:opt.best?PINK:TEXT }}>{opt.price}</div>
                          <div style={{ fontSize:11, color:MUTED, marginTop:2 }}>{opt.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Product grid */}
                <div style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:MUTED, marginBottom:14 }}>Your Products</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:14 }}>
                  {products.map((p, i) => (
                    <a key={p.name} href={p.href} target="_blank" rel="noreferrer" className="pcard" style={S.pcard}>
                      {i === 0 && goal && (
                        <div style={{ fontSize:10, fontWeight:700, color:p.color, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>⭐ Top pick for you</div>
                      )}
                      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                        <div style={{ width:38, height:38, borderRadius:10, background:`${p.color}12`, border:`1px solid ${p.color}25`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, color:p.color }}>
                          {p.icon}
                        </div>
                        <div>
                          <div style={{ fontSize:14, fontWeight:700, color:TEXT }}>{p.name}</div>
                          <div style={{ fontSize:10, fontWeight:700, color:p.color, textTransform:"uppercase", letterSpacing:"0.06em" }}>{p.tag}</div>
                        </div>
                      </div>
                      <div style={{ fontSize:13, color:MUTED, lineHeight:1.6, marginBottom:12 }}>{p.desc}</div>
                      <div style={{ fontSize:12, fontWeight:700, color:p.color }}>Open {p.name} →</div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* ── PRODUCTS TAB ── */}
            {activeTab === "products" && (
              <div className="fadein">
                <div style={{ fontSize:20, fontWeight:800, color:TEXT, letterSpacing:"-0.04em", marginBottom:20 }}>My Products</div>
                {products.map((p, i) => (
                  <a key={p.name} href={p.href} target="_blank" rel="noreferrer" className="prod-link"
                    style={{ display:"flex", alignItems:"center", gap:16, padding:"18px 22px", background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, textDecoration:"none", marginBottom:10, boxShadow:"0 1px 3px rgba(0,0,0,0.04)", transition:"all 0.15s" }}>
                    <div style={{ width:46, height:46, borderRadius:12, background:`${p.color}12`, border:`1px solid ${p.color}25`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, color:p.color, flexShrink:0 }}>
                      {p.icon}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:15, fontWeight:700, color:TEXT }}>{p.name}</div>
                      <div style={{ fontSize:12, color:MUTED, marginTop:2 }}>
                        {p.tag}{i === 0 && goal ? " · ⭐ Top pick for your goal" : ""}
                      </div>
                    </div>
                    <div style={{ fontSize:12, fontWeight:700, color:p.color, flexShrink:0 }}>Launch →</div>
                  </a>
                ))}
              </div>
            )}

            {/* ── SETTINGS TAB ── */}
            {activeTab === "settings" && (
              <div className="fadein">
                <div style={{ fontSize:20, fontWeight:800, color:TEXT, letterSpacing:"-0.04em", marginBottom:24 }}>Account Settings</div>

                {/* Profile card */}
                <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:24, marginBottom:16, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
                    <div style={{ width:52, height:52, borderRadius:"50%", overflow:"hidden", background:`${PINK}15`, border:`2px solid ${PINK}30`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {avatar
                        ? <img src={avatar} style={{ width:52, height:52, objectFit:"cover" }} alt={firstName} />
                        : <span style={{ fontSize:18, fontWeight:700, color:PINK }}>{initials}</span>
                      }
                    </div>
                    <div>
                      <div style={{ fontSize:16, fontWeight:700, color:TEXT }}>{profile?.full_name || firstName}</div>
                      <div style={{ fontSize:12, color:MUTED }}>{user?.email}</div>
                    </div>
                  </div>

                  {/* Subscription status — always from DB */}
                  <div style={{ background:isPaid?`${planInfo.color}08`:"#f8f9fb", border:`1px solid ${isPaid?planInfo.color+"25":BORDER}`, borderRadius:10, padding:"12px 16px", marginBottom:16 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>
                      Subscription (live from database)
                    </div>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <div>
                        <div style={{ fontSize:16, fontWeight:800, color:planInfo.color }}>{planInfo.label}</div>
                        <div style={{ fontSize:11, color:MUTED, marginTop:2 }}>
                          {isPaid ? "Active subscription ✓" : "Free plan — limited access"}
                        </div>
                      </div>
                      {!isPaid && (
                        <Link to="/pricing" style={{ padding:"8px 18px", background:PINK, color:"#fff", borderRadius:8, textDecoration:"none", fontSize:12, fontWeight:700 }}>
                          Upgrade
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Details rows */}
                  {[
                    { label:"Account type",  value: isBiz ? "Business" : "Individual" },
                    { label:"Plan (DB)",      value: planKey },
                    { label:"Goal",           value: goal ? (GOAL_LABEL[goal] || goal) : "Not set" },
                    { label:"Industry",       value: profile?.industry || "Not set" },
                    { label:"Joined",         value: user?.created_at ? new Date(user.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"}) : "—" },
                  ].map(r => (
                    <div key={r.label} style={{ display:"flex", justifyContent:"space-between", padding:"11px 0", borderBottom:`1px solid ${BORDER}` }}>
                      <span style={{ fontSize:13, color:MUTED }}>{r.label}</span>
                      <span style={{ fontSize:13, fontWeight:600, color:TEXT }}>{r.value}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                  <Link to="/pricing" style={{ padding:"9px 18px", borderRadius:9, background:PINK, color:"#fff", fontSize:13, fontWeight:700, textDecoration:"none" }}>
                    {isPaid ? "Manage Plan" : "Upgrade Plan"}
                  </Link>
                  <button onClick={() => setShowOnboarding(true)} style={{ padding:"9px 18px", borderRadius:9, background:CARD, border:`1px solid ${BORDER}`, color:MUTED, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                    Redo Onboarding
                  </button>
                  <button onClick={signOut} style={{ padding:"9px 18px", borderRadius:9, background:CARD, border:`1px solid ${BORDER}`, color:MUTED, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                    Sign Out
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}