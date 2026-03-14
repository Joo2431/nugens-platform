import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { NG_LOGO } from "../lib/logo";
import OnboardingModal from "../components/OnboardingModal";

const PINK = "#e8185d";
const B    = "#1e1e1e";

// Products relevant to each goal
const GOAL_PRODUCTS = {
  get_promoted:        [{ key:"hyperx", weight:1 },{ key:"gene", weight:2 }],
  switch_career:       [{ key:"gene", weight:1 },{ key:"hyperx", weight:2 }],
  learn_skills:        [{ key:"hyperx", weight:1 },{ key:"gene", weight:2 }],
  get_first_job:       [{ key:"gene", weight:1 },{ key:"hyperx", weight:2 }],
  grow_income:         [{ key:"gene", weight:1 },{ key:"hyperx", weight:2 }],
  build_brand:         [{ key:"digihub", weight:1 },{ key:"gene", weight:2 }],
  train_team:          [{ key:"hyperx", weight:1 },{ key:"digihub", weight:2 }],
  hire_talent:         [{ key:"digihub", weight:1 },{ key:"gene", weight:2 }],
  digital_marketing:   [{ key:"digihub", weight:1 },{ key:"units", weight:2 }],
  content_production:  [{ key:"units", weight:1 },{ key:"digihub", weight:2 }],
};

const ALL_PRODUCTS = {
  gene:   { icon:"◎", name:"Gen-E AI",         tag:"Career Intelligence",    color:"#7c3aed", bg:"#13103a", border:"#2d1f6e", href:"https://gene.nugens.in.net",    desc:"AI career coach, resume builder, job matching" },
  hyperx: { icon:"⬡", name:"HyperX",           tag:"Learning Platform",      color:PINK,      bg:"#1a0810", border:"#4d1029", href:"https://hyperx.nugens.in.net",  desc:"Professional courses, skill building, certificates" },
  digihub:{ icon:"◈", name:"DigiHub",          tag:"Marketing + Community",  color:"#0284c7", bg:"#06101a", border:"#0c2a3d", href:"https://digihub.nugens.in.net", desc:"Brand tools, content planner, talent network" },
  units:  { icon:"◇", name:"The Wedding Unit", tag:"Production Studio",      color:"#d4a843", bg:"#110d04", border:"#3d2c0a", href:"https://units.nugens.in.net",   desc:"Photography, videography, production management" },
};

const PLAN_LABELS = {
  individual: { monthly:"₹299/mo", yearly:"₹1,999/yr", tag:"Personal" },
  business:   { monthly:"₹999/mo", yearly:"₹7,999/yr", tag:"Business" },
};

const SITUATION_LABEL = { student:"Student", employed:"Employed", job_seeking:"Job Seeker", freelancer:"Freelancer" };
const GOAL_LABEL = { get_promoted:"Get Promoted", switch_career:"Switch Career", learn_skills:"Learn Skills", get_first_job:"First Job", grow_income:"Grow Income", build_brand:"Build Brand", train_team:"Train Team", hire_talent:"Hire Talent", digital_marketing:"Digital Marketing", content_production:"Content Production" };

export default function Dashboard() {
  const [user,           setUser]           = useState(null);
  const [profile,        setProfile]        = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab,      setActiveTab]      = useState("overview");
  const [checkedTasks,   setCheckedTasks]   = useState({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data:{ session } }) => {
      if (!session) return;
      setUser(session.user);
      supabase.from("profiles").select("*").eq("id", session.user.id).single()
        .then(({ data }) => {
          setProfile(data);
          setLoading(false);
          if (data && !data.onboarding_done) setShowOnboarding(true);
        });
    });
    const { data:{ subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); window.location.href = "/"; };
  const toggleTask = (k) => setCheckedTasks(p=>({ ...p, [k]:!p[k] }));

  const onOnboardingDone = (answers) => {
    setProfile(p => ({ ...p, ...answers, onboarding_done:true }));
    setShowOnboarding(false);
  };

  if (loading) return (
    <div style={{minHeight:"100vh",background:"#09090a",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{fontWeight:800,fontSize:22,color:PINK,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>NuGens</div>
    </div>
  );

  const firstName    = (profile?.full_name || user?.user_metadata?.full_name || user?.email || "").split(" ")[0] || "there";
  const plan         = profile?.plan || "free";
  const userType     = profile?.user_type || "individual";
  const goal         = profile?.goal || profile?.business_need;
  const avatar       = profile?.avatar_url || user?.user_metadata?.avatar_url || null;
  const initials     = firstName.slice(0,2).toUpperCase();
  const hour         = new Date().getHours();
  const greeting     = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Personalized product order based on goal
  const priorityKeys = goal ? (GOAL_PRODUCTS[goal]||[]).map(p=>p.key) : ["gene","hyperx","digihub","units"];
  const allKeys      = ["gene","hyperx","digihub","units"];
  const orderedKeys  = [...priorityKeys, ...allKeys.filter(k=>!priorityKeys.includes(k))];
  const products     = orderedKeys.map(k=>ALL_PRODUCTS[k]).filter(Boolean);
  const topProduct   = products[0];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{font-family:'Plus Jakarta Sans',sans-serif;background:#09090a;color:#e8e8e8;-webkit-font-smoothing:antialiased}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#222;border-radius:99px}
        .sl{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:8px;font-size:13px;font-weight:500;color:#555;text-decoration:none;transition:all 0.14s;cursor:pointer;border:none;background:none;width:100%;text-align:left;font-family:'Plus Jakarta Sans',sans-serif}
        .sl:hover{background:#1a1a1a;color:#e8e8e8}
        .sl.active{background:#1a1a1a;color:#e8e8e8}
        .pcard{background:#111;border:1px solid ${B};border-radius:14px;padding:20px;transition:all 0.18s;cursor:pointer;text-decoration:none;display:block}
        .pcard:hover{border-color:#333;transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,0.4)}
        .tab{padding:7px 16px;border:none;border-radius:8px;font-family:'Plus Jakarta Sans',sans-serif;font-weight:600;font-size:12.5px;cursor:pointer;transition:all 0.13s}
        @keyframes su{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        .su{animation:su 0.3s ease both}
        @media(max-width:900px){.dl{flex-direction:column!important}.dsb{width:100%!important;min-height:auto!important}}
      `}</style>

      {showOnboarding && user && (
        <OnboardingModal user={user} onComplete={onOnboardingDone}/>
      )}

      <div className="dl" style={{display:"flex",minHeight:"100vh",background:"#09090a"}}>

        {/* Sidebar */}
        <div className="dsb" style={{width:220,minHeight:"100vh",background:"#0a0a0a",borderRight:`1px solid ${B}`,display:"flex",flexDirection:"column",padding:"20px 12px",position:"sticky",top:0,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:9,padding:"0 4px",marginBottom:24}}>
            <img src={NG_LOGO} style={{width:28,height:28,borderRadius:6,objectFit:"cover"}} alt="NG"/>
            <span style={{fontWeight:800,fontSize:15,color:"#fff",letterSpacing:"-0.025em"}}>NuGens</span>
          </div>

          <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:"#333",padding:"0 10px",marginBottom:8}}>Workspace</div>
          <div style={{display:"flex",flexDirection:"column",gap:2,marginBottom:20}}>
            {[["overview","⊞","Overview"],["products","◉","My Products"],["tasks","✓","Tasks"],["settings","⚙","Settings"]].map(([id,ic,lbl])=>(
              <button key={id} className={`sl${activeTab===id?" active":""}`} onClick={()=>setActiveTab(id)}>
                <span style={{fontSize:14,width:18,textAlign:"center",flexShrink:0}}>{ic}</span>{lbl}
              </button>
            ))}
          </div>

          <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:"#333",padding:"0 10px",marginBottom:8}}>Products</div>
          <div style={{display:"flex",flexDirection:"column",gap:2,flex:1,marginBottom:12}}>
            {orderedKeys.map(k=>{
              const p = ALL_PRODUCTS[k];
              return (
                <a key={k} href={p.href} target="_blank" rel="noreferrer" className="sl">
                  <span style={{fontSize:13,color:p.color,width:18,textAlign:"center",flexShrink:0}}>{p.icon}</span>{p.name}
                </a>
              );
            })}
          </div>

          {/* Profile */}
          <div style={{borderTop:`1px solid ${B}`,paddingTop:12}}>
            <div style={{display:"flex",alignItems:"center",gap:9,padding:"8px 10px",borderRadius:9,background:"#1a1a1a"}}>
              <div style={{width:30,height:30,borderRadius:"50%",flexShrink:0,overflow:"hidden",background:`${PINK}20`,border:`1.5px solid ${PINK}40`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                {avatar?<img src={avatar} style={{width:30,height:30,objectFit:"cover"}} alt={firstName}/>:<span style={{fontSize:11,fontWeight:700,color:PINK}}>{initials}</span>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12.5,fontWeight:600,color:"#e8e8e8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{firstName}</div>
                <div style={{fontSize:10.5,color:"#555",textTransform:"capitalize"}}>{userType} · {plan}</div>
              </div>
              <button onClick={signOut} title="Sign out" style={{background:"none",border:"none",cursor:"pointer",color:"#444",fontSize:14,padding:2}}>⇥</button>
            </div>
          </div>
        </div>

        {/* Main */}
        <div style={{flex:1,minWidth:0,overflowX:"hidden"}}>
          {/* Topbar */}
          <div style={{borderBottom:`1px solid ${B}`,padding:"14px 28px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,background:"#0a0a0a",position:"sticky",top:0,zIndex:10}}>
            <div>
              <div style={{fontSize:15,fontWeight:700,color:"#fff",letterSpacing:"-0.02em"}}>{greeting}, {firstName} 👋</div>
              <div style={{fontSize:12,color:"#555",marginTop:1}}>
                {profile?.onboarding_done
                  ? `${userType==="business"?"Business":"Personal"} workspace${goal?" · "+GOAL_LABEL[goal]:""}`
                  : "Welcome to NuGens"}
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              {/* User type badge */}
              <span style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",padding:"3px 10px",borderRadius:5,background:userType==="business"?"#0c2a3d":"#1a0810",color:userType==="business"?"#0ea5e9":PINK,border:`1px solid ${userType==="business"?"#0c3a5d":"#4d1029"}`}}>
                {userType==="business"?"Business":"Individual"}
              </span>
              {plan==="free" && (
                <Link to="/pricing" style={{fontSize:12,fontWeight:700,color:PINK,textDecoration:"none",padding:"5px 12px",border:`1px solid ${PINK}40`,borderRadius:7,background:`${PINK}10`}}>Upgrade ↑</Link>
              )}
            </div>
          </div>

          <div style={{padding:"28px 28px 60px"}}>

            {/* OVERVIEW */}
            {activeTab==="overview" && (
              <div className="su">

                {/* Personalized hero banner */}
                {profile?.onboarding_done && goal && topProduct && (
                  <div style={{background:topProduct.bg,border:`1px solid ${topProduct.border}`,borderRadius:14,padding:"20px 24px",marginBottom:24,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
                    <div>
                      <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",color:topProduct.color,marginBottom:6}}>Recommended for you</div>
                      <div style={{fontSize:16,fontWeight:800,color:"#fff",letterSpacing:"-0.025em",marginBottom:4}}>{topProduct.name} is your best starting point</div>
                      <div style={{fontSize:13,color:"rgba(255,255,255,0.4)"}}>{topProduct.desc}</div>
                    </div>
                    <a href={topProduct.href} target="_blank" rel="noreferrer" style={{padding:"10px 22px",borderRadius:9,background:topProduct.color,color:"#fff",fontSize:13,fontWeight:700,textDecoration:"none",whiteSpace:"nowrap"}}>Open {topProduct.name} →</a>
                  </div>
                )}

                {/* Stats */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:28}}>
                  {[
                    {label:"Products",     val:"4",   sub:"accessible",  color:"#7c3aed"},
                    {label:"Plan",         val:plan.charAt(0).toUpperCase()+plan.slice(1), sub:"current tier", color:PINK},
                    {label:"Type",         val:userType==="business"?"Business":"Individual", sub:"account type", color:"#0284c7"},
                    {label:"Member since", val:user?.created_at?new Date(user.created_at).toLocaleDateString("en-IN",{month:"short",year:"numeric"}):"—", sub:"joined", color:"#d4a843"},
                  ].map(s=>(
                    <div key={s.label} style={{background:"#111",border:`1px solid ${B}`,borderRadius:12,padding:"16px 18px"}}>
                      <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",color:"#444",marginBottom:6}}>{s.label}</div>
                      <div style={{fontSize:20,fontWeight:800,color:s.color,letterSpacing:"-0.03em",lineHeight:1}}>{s.val}</div>
                      <div style={{fontSize:11,color:"#444",marginTop:4}}>{s.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Subscription prompt based on user type */}
                {plan==="free" && (
                  <div style={{background:"#111",border:`1px solid ${B}`,borderRadius:14,padding:"20px 24px",marginBottom:28}}>
                    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:16}}>
                      <div>
                        <div style={{fontSize:15,fontWeight:800,color:"#fff",marginBottom:4}}>
                          {userType==="business"?"Grow your team with NuGens Business":"Unlock your full potential"}
                        </div>
                        <div style={{fontSize:13,color:"#555"}}>
                          {userType==="business"
                            ? "Team learning, hiring tools, content creation and more — all in one plan"
                            : "Unlimited AI, all courses, resume builder and career coaching included"}
                        </div>
                      </div>
                      <Link to="/pricing" style={{padding:"10px 22px",borderRadius:9,background:PINK,color:"#fff",fontSize:13,fontWeight:700,textDecoration:"none",whiteSpace:"nowrap"}}>View plans →</Link>
                    </div>
                    <div style={{display:"flex",gap:16}}>
                      <div style={{background:"#0a0a0a",border:`1px solid ${B}`,borderRadius:9,padding:"10px 16px",flex:1,textAlign:"center"}}>
                        <div style={{fontSize:18,fontWeight:800,color:PINK}}>{PLAN_LABELS[userType]?.monthly||"₹299/mo"}</div>
                        <div style={{fontSize:11,color:"#555",marginTop:2}}>Monthly</div>
                      </div>
                      <div style={{background:`${PINK}10`,border:`1px solid ${PINK}30`,borderRadius:9,padding:"10px 16px",flex:1,textAlign:"center",position:"relative"}}>
                        <div style={{position:"absolute",top:-8,left:"50%",transform:"translateX(-50%)",background:PINK,color:"#fff",fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:10,whiteSpace:"nowrap"}}>BEST VALUE</div>
                        <div style={{fontSize:18,fontWeight:800,color:PINK}}>{PLAN_LABELS[userType]?.yearly||"₹1,999/yr"}</div>
                        <div style={{fontSize:11,color:"#555",marginTop:2}}>Yearly · Save 44%</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Product cards — personalized order */}
                <div style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"#444",marginBottom:14}}>Your Products</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14}}>
                  {products.map((p,i)=>(
                    <a key={p.name} href={p.href} target="_blank" rel="noreferrer" className="pcard"
                      style={{background:p.bg,border:`1px solid ${i===0&&goal?p.color+"60":p.border}`,animationDelay:`${i*60}ms`}}>
                      {i===0&&goal && <div style={{fontSize:10,fontWeight:700,color:p.color,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>⭐ Top pick for you</div>}
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                        <div style={{width:36,height:36,borderRadius:9,background:`${p.color}20`,border:`1px solid ${p.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:p.color}}>{p.icon}</div>
                        <div>
                          <div style={{fontSize:14,fontWeight:700,color:"#e8e8e8"}}>{p.name}</div>
                          <div style={{fontSize:11,fontWeight:600,color:p.color,textTransform:"uppercase",letterSpacing:"0.05em"}}>{p.tag}</div>
                        </div>
                      </div>
                      <div style={{fontSize:12.5,color:"#555",lineHeight:1.5,marginBottom:12}}>{p.desc}</div>
                      <div style={{fontSize:12,fontWeight:600,color:p.color}}>Open {p.name} →</div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* PRODUCTS TAB */}
            {activeTab==="products" && (
              <div className="su">
                <div style={{fontSize:18,fontWeight:800,color:"#fff",letterSpacing:"-0.03em",marginBottom:20}}>My Products</div>
                {products.map((p,i)=>(
                  <a key={p.name} href={p.href} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",gap:16,padding:"18px 20px",background:p.bg,border:`1px solid ${p.border}`,borderRadius:14,textDecoration:"none",transition:"all 0.16s",marginBottom:10}}
                    onMouseOver={e=>e.currentTarget.style.borderColor=p.color+"60"}
                    onMouseOut={e=>e.currentTarget.style.borderColor=p.border}>
                    <div style={{width:44,height:44,borderRadius:11,background:`${p.color}20`,border:`1px solid ${p.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:p.color,flexShrink:0}}>{p.icon}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:15,fontWeight:700,color:"#e8e8e8"}}>{p.name}</div>
                      <div style={{fontSize:12,color:"#555",marginTop:2}}>{p.tag} {i===0&&goal?"· ⭐ Top pick for you":""}</div>
                    </div>
                    <div style={{fontSize:12.5,fontWeight:600,color:p.color,flexShrink:0}}>Launch →</div>
                  </a>
                ))}
              </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab==="settings" && (
              <div className="su">
                <div style={{fontSize:18,fontWeight:800,color:"#fff",letterSpacing:"-0.03em",marginBottom:24}}>Account Settings</div>
                <div style={{background:"#111",border:`1px solid ${B}`,borderRadius:14,padding:24,marginBottom:16}}>
                  <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20}}>
                    <div style={{width:52,height:52,borderRadius:"50%",overflow:"hidden",background:`${PINK}20`,border:`2px solid ${PINK}40`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {avatar?<img src={avatar} style={{width:52,height:52,objectFit:"cover"}} alt={firstName}/>:<span style={{fontSize:18,fontWeight:700,color:PINK}}>{initials}</span>}
                    </div>
                    <div>
                      <div style={{fontSize:16,fontWeight:700,color:"#e8e8e8"}}>{profile?.full_name||firstName}</div>
                      <div style={{fontSize:12.5,color:"#555"}}>{user?.email}</div>
                    </div>
                  </div>
                  {[
                    {label:"Account type", val:userType==="business"?"Business":"Individual"},
                    {label:"Plan",         val:plan.charAt(0).toUpperCase()+plan.slice(1)},
                    {label:"Goal",         val:goal?GOAL_LABEL[goal]:"Not set"},
                    {label:"Situation",    val:profile?.situation?SITUATION_LABEL[profile.situation]||profile.situation:"Not set"},
                    {label:"Industry",     val:profile?.industry||"Not set"},
                    {label:"Joined",       val:user?.created_at?new Date(user.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"}):"—"},
                  ].map(r=>(
                    <div key={r.label} style={{display:"flex",justifyContent:"space-between",padding:"11px 0",borderBottom:`1px solid ${B}`}}>
                      <span style={{fontSize:13,color:"#555"}}>{r.label}</span>
                      <span style={{fontSize:13,fontWeight:600,color:"#aaa"}}>{r.val}</span>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                  <Link to="/pricing" style={{padding:"9px 18px",borderRadius:8,background:PINK,color:"#fff",fontSize:13,fontWeight:700,textDecoration:"none"}}>Upgrade Plan</Link>
                  <button onClick={()=>{setShowOnboarding(true);}} style={{padding:"9px 18px",borderRadius:8,background:"#111",border:`1px solid ${B}`,color:"#666",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Redo Onboarding</button>
                  <button onClick={signOut} style={{padding:"9px 18px",borderRadius:8,background:"#111",border:`1px solid ${B}`,color:"#666",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Sign Out</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
