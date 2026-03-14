import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { NG_LOGO } from "../lib/logo";

const PINK    = "#e8185d";
const SIDEBAR = "#0f0f10";

const PRODUCTS = [
  {
    key: "gene", icon: "◎", name: "Gen-E AI", tag: "Career Intelligence",
    color: "#7c3aed", bg: "#13103a", border: "#2d1f6e",
    href: "https://gene.nugens.in.net",
    stats: [{ label: "Resume Score",  val: "94/100" }, { label: "Job Matches",   val: "12 new" }],
    tasks: ["Upload resume for ATS analysis", "Complete career roadmap", "Practice mock interview"],
    badge: "AI Powered",
  },
  {
    key: "hyperx", icon: "⬡", name: "HyperX", tag: "Learning Platform",
    color: PINK, bg: "#1a0810", border: "#4d1029",
    href: "https://hyperx.nugens.in.net",
    stats: [{ label: "Courses Active", val: "3" }, { label: "Progress", val: "67%" }],
    tasks: ["Continue Salary Negotiation module", "Take workplace culture quiz", "Join live session Fri 6PM"],
    badge: "3 Active",
  },
  {
    key: "digihub", icon: "◈", name: "DigiHub", tag: "Marketing + Community",
    color: "#0284c7", bg: "#06101a", border: "#0c2a3d",
    href: "https://digihub.nugens.in.net",
    stats: [{ label: "Brand Score", val: "78" }, { label: "Content Due", val: "2 today" }],
    tasks: ["Review content calendar", "Post LinkedIn article", "Check talent hub listings"],
    badge: "2 Due",
  },
  {
    key: "units", icon: "◇", name: "The Wedding Unit", tag: "Production Studio",
    color: "#d4a843", bg: "#110d04", border: "#3d2c0a",
    href: "https://units.nugens.in.net",
    stats: [{ label: "Projects",   val: "4 active" }, { label: "Next Shoot", val: "Mar 18" }],
    tasks: ["Confirm Mar 18 booking details", "Upload Sharma wedding gallery", "Send client quote #12"],
    badge: "Mar 18",
  },
];

const QUICK_ACTIONS = [
  { label: "AI Career Chat",    icon: "◎", color: "#7c3aed", href: "https://gene.nugens.in.net/chat"      },
  { label: "Resume Builder",    icon: "📄", color: "#7c3aed", href: "https://gene.nugens.in.net/resumes"   },
  { label: "Browse Courses",    icon: "⬡", color: PINK,      href: "https://hyperx.nugens.in.net/courses" },
  { label: "Content Planner",   icon: "◈", color: "#0284c7", href: "https://digihub.nugens.in.net/planner"},
  { label: "Book a Shoot",      icon: "◇", color: "#d4a843", href: "https://units.nugens.in.net/book"     },
  { label: "View Pricing",      icon: "↑",  color: "#6b7280", href: "/pricing"                            },
];

export default function Dashboard() {
  const [user,       setUser]       = useState(null);
  const [profile,    setProfile]    = useState(null);
  const [activeTab,  setActiveTab]  = useState("overview");
  const [checkedTasks, setCheckedTasks] = useState({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = "/auth"; return; }
      setUser(session.user);
      supabase.from("profiles").select("*").eq("id", session.user.id).single()
        .then(({ data }) => setProfile(data));
    });
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); window.location.href = "/"; };
  const toggleTask = (k) => setCheckedTasks(p => ({ ...p, [k]: !p[k] }));

  const firstName = (profile?.full_name || user?.user_metadata?.full_name || user?.email || "").split(" ")[0] || "there";
  const plan      = profile?.plan || "free";
  const avatar    = profile?.avatar_url || user?.user_metadata?.avatar_url || null;
  const initials  = firstName.slice(0,2).toUpperCase();
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (!user) return (
    <div style={{ minHeight:"100vh", background:"#09090a", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ fontWeight:800, fontSize:24, color:PINK, fontFamily:"'Plus Jakarta Sans',sans-serif", letterSpacing:"-0.04em" }}>NuGens</div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body,#root{height:100%;font-family:'Plus Jakarta Sans',sans-serif;background:#09090a;color:#e8e8e8;-webkit-font-smoothing:antialiased}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#222;border-radius:99px}
        .dash-sidebar-link{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:8px;font-size:13px;font-weight:500;color:#555;text-decoration:none;transition:all 0.14s;cursor:pointer;border:none;background:none;width:100%;text-align:left;font-family:'Plus Jakarta Sans',sans-serif}
        .dash-sidebar-link:hover{background:#1a1a1a;color:#e8e8e8}
        .dash-sidebar-link.active{background:#1a1a1a;color:#e8e8e8}
        .pcard{background:#111;border:1px solid #1e1e1e;border-radius:14px;padding:20px;transition:all 0.18s;cursor:pointer;text-decoration:none;display:block}
        .pcard:hover{border-color:#333;transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,0.4)}
        .task-item{display:flex;align-items:flex-start;gap:10px;padding:9px 0;border-bottom:1px solid #1a1a1a;cursor:pointer}
        .task-item:last-child{border-bottom:none}
        .tab-btn{padding:7px 16px;border:none;border-radius:8px;font-family:'Plus Jakarta Sans',sans-serif;font-weight:600;font-size:12.5px;cursor:pointer;transition:all 0.13s}
        @keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        .slide-up{animation:slideUp 0.35s ease both}
        @media(max-width:900px){.dash-layout{flex-direction:column!important}.dash-sidebar{width:100%!important;min-height:auto!important;flex-direction:row!important;align-items:center!important;padding:12px 16px!important}.dash-sidebar-nav{display:flex!important;flex-direction:row!important;gap:4px!important}.dash-products-grid{grid-template-columns:1fr 1fr!important}}
      `}</style>

      <div className="dash-layout" style={{ display:"flex", minHeight:"100vh", background:"#09090a" }}>

        {/* ── SIDEBAR ── */}
        <div className="dash-sidebar" style={{ width:220, minHeight:"100vh", background:SIDEBAR, borderRight:"1px solid #1a1a1a", display:"flex", flexDirection:"column", padding:"20px 12px", position:"sticky", top:0, flexShrink:0 }}>

          {/* Logo */}
          <div style={{ display:"flex", alignItems:"center", gap:9, padding:"0 4px", marginBottom:28 }}>
            <img src={NG_LOGO} style={{ width:28, height:28, borderRadius:6, objectFit:"cover" }} alt="NG" />
            <span style={{ fontWeight:800, fontSize:15, color:"#fff", letterSpacing:"-0.025em" }}>NuGens</span>
          </div>

          {/* Workspace label */}
          <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"#333", padding:"0 10px", marginBottom:8 }}>Workspace</div>

          {/* Main nav */}
          <div className="dash-sidebar-nav" style={{ display:"flex", flexDirection:"column", gap:2, marginBottom:24 }}>
            {[
              { id:"overview",  icon:"⊞", label:"Overview"    },
              { id:"products",  icon:"◉", label:"My Products" },
              { id:"tasks",     icon:"✓", label:"Tasks"       },
              { id:"settings",  icon:"⚙", label:"Settings"    },
            ].map(item => (
              <button key={item.id} className={`dash-sidebar-link${activeTab===item.id?" active":""}`}
                onClick={() => setActiveTab(item.id)}>
                <span style={{ fontSize:14, width:18, textAlign:"center", flexShrink:0 }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          {/* Products */}
          <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"#333", padding:"0 10px", marginBottom:8 }}>Products</div>
          <div style={{ display:"flex", flexDirection:"column", gap:2, flex:1, marginBottom:16 }}>
            {PRODUCTS.map(p => (
              <a key={p.key} href={p.href} target="_blank" rel="noreferrer" className="dash-sidebar-link">
                <span style={{ fontSize:13, color:p.color, width:18, textAlign:"center", flexShrink:0 }}>{p.icon}</span>
                {p.name}
              </a>
            ))}
          </div>

          {/* Profile */}
          <div style={{ borderTop:"1px solid #1a1a1a", paddingTop:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 10px", borderRadius:9, background:"#1a1a1a" }}>
              <div style={{ width:30, height:30, borderRadius:"50%", flexShrink:0, overflow:"hidden", background:`${PINK}20`, border:`1.5px solid ${PINK}40`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                {avatar
                  ? <img src={avatar} style={{ width:30, height:30, objectFit:"cover" }} alt={firstName} />
                  : <span style={{ fontSize:11, fontWeight:700, color:PINK }}>{initials}</span>
                }
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12.5, fontWeight:600, color:"#e8e8e8", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{firstName}</div>
                <div style={{ fontSize:10.5, color:"#555", textTransform:"capitalize" }}>{plan} plan</div>
              </div>
              <button onClick={signOut} title="Sign out" style={{ background:"none", border:"none", cursor:"pointer", color:"#444", fontSize:14, padding:2, lineHeight:1 }}>⇥</button>
            </div>
          </div>
        </div>

        {/* ── MAIN ── */}
        <div style={{ flex:1, minWidth:0, overflowX:"hidden" }}>

          {/* Top bar */}
          <div style={{ borderBottom:"1px solid #1a1a1a", padding:"14px 28px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, background:SIDEBAR, position:"sticky", top:0, zIndex:10 }}>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:"#fff", letterSpacing:"-0.02em" }}>{greeting}, {firstName} 👋</div>
              <div style={{ fontSize:12, color:"#555", marginTop:1 }}>Here's what's happening across your products</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", padding:"3px 10px", borderRadius:5, background: plan==="free"?"#1a1a1a":"#1a0810", color: plan==="free"?"#555":PINK, border:`1px solid ${plan==="free"?"#222":"#4d1029"}` }}>{plan}</span>
              {plan === "free" && (
                <Link to="/pricing" style={{ fontSize:12, fontWeight:700, color:PINK, textDecoration:"none", padding:"5px 12px", border:`1px solid ${PINK}40`, borderRadius:7, background:`${PINK}10`, transition:"all 0.14s" }}>Upgrade ↑</Link>
              )}
            </div>
          </div>

          <div style={{ padding:"28px 28px 60px" }}>

            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="slide-up">
                {/* Stats strip */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:28 }}>
                  {[
                    { label:"Products",       val:"4",     sub:"accessible",    color:"#7c3aed" },
                    { label:"AI Questions",   val: plan==="free"?`${profile?.questions_used||0}/20`:"∞", sub:plan==="free"?"this month":"unlimited", color:PINK },
                    { label:"Plan",           val:plan.charAt(0).toUpperCase()+plan.slice(1), sub:"current tier", color:"#0284c7" },
                    { label:"Member since",   val:user?.created_at ? new Date(user.created_at).toLocaleDateString("en-IN",{month:"short",year:"numeric"}) : "—", sub:"joined", color:"#d4a843" },
                  ].map(s => (
                    <div key={s.label} style={{ background:"#111", border:"1px solid #1e1e1e", borderRadius:12, padding:"16px 18px" }}>
                      <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:"#444", marginBottom:6 }}>{s.label}</div>
                      <div style={{ fontSize:22, fontWeight:800, color:s.color, letterSpacing:"-0.03em", lineHeight:1 }}>{s.val}</div>
                      <div style={{ fontSize:11, color:"#444", marginTop:4 }}>{s.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Quick actions */}
                <div style={{ marginBottom:28 }}>
                  <div style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#444", marginBottom:14 }}>Quick Actions</div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {QUICK_ACTIONS.map(a => {
                      const Tag = a.href.startsWith("http") ? "a" : Link;
                      const props = a.href.startsWith("http") ? { href:a.href, target:"_blank", rel:"noreferrer" } : { to:a.href };
                      return (
                        <Tag key={a.label} {...props} style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"8px 14px", borderRadius:8, background:"#111", border:"1px solid #1e1e1e", fontSize:12.5, fontWeight:600, color:"#aaa", textDecoration:"none", transition:"all 0.14s" }}
                          onMouseOver={e => { e.currentTarget.style.borderColor=a.color+"60"; e.currentTarget.style.color="#fff"; }}
                          onMouseOut={e =>  { e.currentTarget.style.borderColor="#1e1e1e";   e.currentTarget.style.color="#aaa"; }}>
                          <span style={{ color:a.color, fontSize:13 }}>{a.icon}</span>{a.label}
                        </Tag>
                      );
                    })}
                  </div>
                </div>

                {/* Product cards grid */}
                <div style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#444", marginBottom:14 }}>Your Products</div>
                <div className="dash-products-grid" style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:14 }}>
                  {PRODUCTS.map((p, i) => (
                    <a key={p.key} href={p.href} target="_blank" rel="noreferrer" className="pcard"
                      style={{ background:p.bg, border:`1px solid ${p.border}`, animationDelay:`${i*60}ms` }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <div style={{ width:36, height:36, borderRadius:9, background:`${p.color}20`, border:`1px solid ${p.color}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, color:p.color }}>{p.icon}</div>
                          <div>
                            <div style={{ fontSize:14, fontWeight:700, color:"#e8e8e8" }}>{p.name}</div>
                            <div style={{ fontSize:11, fontWeight:600, color:p.color, textTransform:"uppercase", letterSpacing:"0.05em" }}>{p.tag}</div>
                          </div>
                        </div>
                        <span style={{ fontSize:10.5, fontWeight:700, padding:"3px 8px", borderRadius:5, background:`${p.color}15`, color:p.color, border:`1px solid ${p.color}25` }}>{p.badge}</span>
                      </div>

                      {/* Stats */}
                      <div style={{ display:"flex", gap:12, marginBottom:14 }}>
                        {p.stats.map(s => (
                          <div key={s.label} style={{ flex:1, background:"rgba(0,0,0,0.25)", borderRadius:8, padding:"8px 10px" }}>
                            <div style={{ fontSize:10, color:"#555", marginBottom:2 }}>{s.label}</div>
                            <div style={{ fontSize:14, fontWeight:700, color:"#d0d0d0" }}>{s.val}</div>
                          </div>
                        ))}
                      </div>

                      {/* Tasks */}
                      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                        {p.tasks.slice(0,2).map((t,j) => {
                          const tk = `${p.key}-${j}`;
                          return (
                            <div key={tk} onClick={e => { e.preventDefault(); toggleTask(tk); }} style={{ display:"flex", alignItems:"center", gap:8 }}>
                              <div style={{ width:14, height:14, borderRadius:4, border:`1.5px solid ${checkedTasks[tk]?p.color:"#333"}`, background:checkedTasks[tk]?p.color:"transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.14s" }}>
                                {checkedTasks[tk] && <span style={{ color:"#fff", fontSize:9, fontWeight:700 }}>✓</span>}
                              </div>
                              <span style={{ fontSize:12, color:checkedTasks[tk]?"#444":"#888", textDecoration:checkedTasks[tk]?"line-through":"none", transition:"all 0.14s" }}>{t}</span>
                            </div>
                          );
                        })}
                      </div>

                      <div style={{ marginTop:14, fontSize:12, fontWeight:600, color:p.color }}>Open {p.name} →</div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* PRODUCTS TAB */}
            {activeTab === "products" && (
              <div className="slide-up">
                <div style={{ fontSize:18, fontWeight:800, color:"#fff", letterSpacing:"-0.03em", marginBottom:6 }}>My Products</div>
                <div style={{ fontSize:13, color:"#555", marginBottom:24 }}>All NuGens products accessible with one account</div>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {PRODUCTS.map(p => (
                    <a key={p.key} href={p.href} target="_blank" rel="noreferrer" style={{ display:"flex", alignItems:"center", gap:16, padding:"18px 20px", background:p.bg, border:`1px solid ${p.border}`, borderRadius:14, textDecoration:"none", transition:"all 0.16s" }}
                      onMouseOver={e => e.currentTarget.style.borderColor=p.color+"60"}
                      onMouseOut={e => e.currentTarget.style.borderColor=p.border}>
                      <div style={{ width:44, height:44, borderRadius:11, background:`${p.color}20`, border:`1px solid ${p.color}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, color:p.color, flexShrink:0 }}>{p.icon}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:15, fontWeight:700, color:"#e8e8e8" }}>{p.name}</div>
                        <div style={{ fontSize:12, color:"#555", marginTop:2 }}>{p.tag} · {p.stats.map(s=>`${s.label}: ${s.val}`).join(" · ")}</div>
                      </div>
                      <div style={{ fontSize:12.5, fontWeight:600, color:p.color, flexShrink:0 }}>Launch →</div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* TASKS TAB */}
            {activeTab === "tasks" && (
              <div className="slide-up">
                <div style={{ fontSize:18, fontWeight:800, color:"#fff", letterSpacing:"-0.03em", marginBottom:6 }}>All Tasks</div>
                <div style={{ fontSize:13, color:"#555", marginBottom:24 }}>Tasks across all your products</div>
                {PRODUCTS.map(p => (
                  <div key={p.key} style={{ marginBottom:20 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                      <span style={{ fontSize:14, color:p.color }}>{p.icon}</span>
                      <span style={{ fontSize:13, fontWeight:700, color:"#aaa" }}>{p.name}</span>
                    </div>
                    <div style={{ background:p.bg, border:`1px solid ${p.border}`, borderRadius:12, padding:"4px 16px" }}>
                      {p.tasks.map((t,j) => {
                        const tk = `${p.key}-tasks-${j}`;
                        return (
                          <div key={tk} className="task-item" onClick={() => toggleTask(tk)}>
                            <div style={{ width:16, height:16, borderRadius:4, border:`1.5px solid ${checkedTasks[tk]?p.color:"#333"}`, background:checkedTasks[tk]?p.color:"transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", marginTop:1, transition:"all 0.14s" }}>
                              {checkedTasks[tk] && <span style={{ color:"#fff", fontSize:9, fontWeight:700 }}>✓</span>}
                            </div>
                            <span style={{ fontSize:13, color:checkedTasks[tk]?"#444":"#ccc", textDecoration:checkedTasks[tk]?"line-through":"none", transition:"all 0.14s" }}>{t}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === "settings" && (
              <div className="slide-up">
                <div style={{ fontSize:18, fontWeight:800, color:"#fff", letterSpacing:"-0.03em", marginBottom:24 }}>Account Settings</div>
                <div style={{ background:"#111", border:"1px solid #1e1e1e", borderRadius:14, padding:24, marginBottom:16 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
                    <div style={{ width:52, height:52, borderRadius:"50%", overflow:"hidden", background:`${PINK}20`, border:`2px solid ${PINK}40`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {avatar ? <img src={avatar} style={{ width:52, height:52, objectFit:"cover" }} alt={firstName} /> : <span style={{ fontSize:18, fontWeight:700, color:PINK }}>{initials}</span>}
                    </div>
                    <div>
                      <div style={{ fontSize:16, fontWeight:700, color:"#e8e8e8" }}>{profile?.full_name || firstName}</div>
                      <div style={{ fontSize:12.5, color:"#555" }}>{user?.email}</div>
                    </div>
                  </div>
                  {[
                    { label:"Plan",       val: plan.charAt(0).toUpperCase()+plan.slice(1) },
                    { label:"Joined",     val: user?.created_at ? new Date(user.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"}) : "—" },
                    { label:"Auth method",val: user?.app_metadata?.provider || "email" },
                  ].map(r => (
                    <div key={r.label} style={{ display:"flex", justifyContent:"space-between", padding:"11px 0", borderBottom:"1px solid #1a1a1a" }}>
                      <span style={{ fontSize:13, color:"#555" }}>{r.label}</span>
                      <span style={{ fontSize:13, fontWeight:600, color:"#aaa", textTransform:"capitalize" }}>{r.val}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", gap:10 }}>
                  <Link to="/pricing" style={{ padding:"9px 18px", borderRadius:8, background:PINK, color:"#fff", fontSize:13, fontWeight:700, textDecoration:"none" }}>Upgrade Plan</Link>
                  <button onClick={signOut} style={{ padding:"9px 18px", borderRadius:8, background:"#111", border:"1px solid #1e1e1e", color:"#666", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Sign Out</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
