import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { NG_LOGO } from "../lib/logo";

const API   = import.meta.env.VITE_GEN_E_API_URL || "https://nugens-platform.onrender.com";
const PINK  = "#e8185d";
const LIMIT = 20;

// ─── ALL plans that should be treated as "paid" (can chat freely) ───────────
const PAID_PLANS = new Set([
  "monthly","yearly","admin",
  "hx_ind_starter","hx_ind_premium","hx_ind_pro","hx_ind_yearly",
  "hx_biz_starter","hx_biz_premium","hx_biz_pro","hx_biz_yearly",
]);

// ─── Cross-app navigation items ─────────────────────────────────────────────
const APPS = [
  { key:"gene",    label:"Gen-E",   icon:"◎", color:"#7c3aed", url:"https://gene.nugens.in.net",    active:true  },
  { key:"hyperx",  label:"HyperX",  icon:"⬡", color:PINK,      url:"https://hyperx.nugens.in.net",  active:false },
  { key:"digihub", label:"DigiHub", icon:"◈", color:"#0284c7", url:"https://digihub.nugens.in.net", active:false },
  { key:"units",   label:"The Units",icon:"◇",color:"#d97706", url:"https://units.nugens.in.net",   active:false },
];

/* ── Languages ── */
const LANGUAGES = {
  en:{name:"English",native:"English",flag:"🇬🇧"},hi:{name:"Hindi",native:"हिंदी",flag:"🇮🇳"},
  es:{name:"Spanish",native:"Español",flag:"🇪🇸"},fr:{name:"French",native:"Français",flag:"🇫🇷"},
  ar:{name:"Arabic",native:"العربية",flag:"🇸🇦"},pt:{name:"Portuguese",native:"Português",flag:"🇧🇷"},
  de:{name:"German",native:"Deutsch",flag:"🇩🇪"},zh:{name:"Chinese",native:"中文",flag:"🇨🇳"},
  ta:{name:"Tamil",native:"தமிழ்",flag:"🇮🇳"},te:{name:"Telugu",native:"తెలుగు",flag:"🇮🇳"},
  bn:{name:"Bengali",native:"বাংলা",flag:"🇧🇩"},
};

const MODES = [
  { id:"CAREER",    label:"Career",    long:"Career Guidance", icon:"◎" },
  { id:"RESUME",    label:"Resume",    long:"ATS Resume",      icon:"▤" },
  { id:"INTERVIEW", label:"Interview", long:"Interview Prep",  icon:"◷" },
  { id:"SCORING",   label:"Score",     long:"Readiness Score", icon:"◈" },
];

const INDIVIDUAL_FEATURES = [
  { key:"career",    icon:"◎", color:PINK,      bg:"#fff0f4", label:"Career AI",       desc:"Guidance, planning & career clarity",            mode:"CAREER",    body:"I need career guidance. Tell me about yourself and your current situation." },
  { key:"resume",    icon:"▤", color:"#7c3aed", bg:"#f5f3ff", label:"ATS Resume",      desc:"Build & optimise your resume for ATS",           mode:"RESUME",    body:"Help me build an ATS-optimised resume. Let's start — tell me your target role.", pro:true },
  { key:"skill_gap", icon:"◈", color:"#0284c7", bg:"#eff6ff", label:"Skill Gap",       desc:"Find the gap between you and your target role",  mode:"CAREER",    body:"Do a comprehensive skill gap analysis for me. Start by asking my current role, target role, and existing skills." },
  { key:"simulate",  icon:"⬡", color:"#d97706", bg:"#fff7ed", label:"Career Simulate", desc:"Model salary, timeline & risks of any career move",mode:"CAREER",  body:"I want to simulate a career transition. Ask me my current role and where I want to go — then model out realistic outcomes, salary impact, and timeline." },
  { key:"roadmap",   icon:"→", color:"#16a34a", bg:"#f0fdf4", label:"Roadmap",         desc:"Phase-by-phase career plan for your goal",       mode:"CAREER",    body:"Build a detailed career roadmap for me. Ask my goal, current situation, and preferred timeline to generate a phase-by-phase action plan." },
  { key:"interview", icon:"◷", color:PINK,      bg:"#fff0f4", label:"Interview Prep",  desc:"Mock interviews & preparation strategy",         mode:"INTERVIEW", body:"Let's do interview prep. Ask me what role I'm targeting and at which company.", pro:true },
  { key:"score",     icon:"◉", color:"#7c3aed", bg:"#f5f3ff", label:"Readiness Score", desc:"Score your career readiness with a 30-day plan", mode:"SCORING",   body:"Score my career readiness. Ask me about my target role, current skills, and experience to give a detailed score with a 30-day improvement plan." },
  { key:"job_match", icon:"🔎",color:"#0284c7", bg:"#eff6ff", label:"Job Match",       desc:"Find real job openings matched to your profile", mode:"CAREER",    body:"Find the best job roles matching my profile and search for live openings. Ask me about my background, skills, and target role.", yearly:true },
];

const BUSINESS_FEATURES = [
  { key:"jd",        icon:"▤", color:"#7c3aed", bg:"#f5f3ff", label:"JD Generator",   desc:"Full job descriptions + interview questions",    mode:"CAREER",    body:"Generate a comprehensive job description. Start by asking me: role title, company type, and experience level required." },
  { key:"hiring",    icon:"◎", color:PINK,      bg:"#fff0f4", label:"Hiring AI",       desc:"Skills, salary & full hiring strategy",          mode:"CAREER",    body:"Give me hiring intelligence for a role I'm filling. Ask me the role title, industry, and company stage." },
  { key:"team",      icon:"◈", color:"#0284c7", bg:"#eff6ff", label:"Team Skill Map",  desc:"Analyse team skills, find gaps, plan training",  mode:"CAREER",    body:"Map my team's skills and identify gaps." },
  { key:"workforce", icon:"⬡", color:"#d97706", bg:"#fff7ed", label:"Workforce Plan",  desc:"Hiring roadmap based on your company stage",     mode:"CAREER",    body:"Create a workforce planning roadmap. Ask me: company stage, current team, and 12-month growth goals." },
  { key:"salary",    icon:"₹", color:"#16a34a", bg:"#f0fdf4", label:"Salary Benchmark",desc:"Real Indian market salary data by experience",   mode:"CAREER",    body:"Provide salary benchmarks. Ask me: role, experience level, city, and industry." },
  { key:"interview", icon:"◷", color:"#0284c7", bg:"#eff6ff", label:"Interview AI",    desc:"Role-specific questions + evaluation rubric",    mode:"CAREER",    body:"Generate interview questions and an evaluation rubric. Ask me: role, experience level, and company type." },
];

const TOOL_AUTO = {
  skill_gap:  { mode:"CAREER",    label:"Skill Gap Analysis",  body:"Do a comprehensive skill gap analysis for me. Ask my current role, target role, and existing skills." },
  simulate:   { mode:"CAREER",    label:"Career Simulator",    body:"Simulate a career transition for me. Ask my current role and target — model outcomes, salary impact, timeline." },
  roadmap:    { mode:"CAREER",    label:"Career Roadmap",      body:"Build a detailed career roadmap. Ask my goal, current situation, and preferred timeline." },
  jd:         { mode:"CAREER",    label:"JD Generator",        body:"Generate a comprehensive job description. Ask: role title, company type, experience level." },
  hiring:     { mode:"CAREER",    label:"Hiring Intelligence", body:"Give me full hiring intelligence for a role I need to fill." },
  team:       { mode:"CAREER",    label:"Team Skill Map",      body:"Map my team's skills and identify gaps." },
  workforce:  { mode:"CAREER",    label:"Workforce Planning",  body:"Create a workforce planning roadmap for my company." },
  salary:     { mode:"CAREER",    label:"Salary Benchmark",    body:"Provide salary benchmarks. Ask: role, experience level, city, and industry." },
  interview:  { mode:"CAREER",    label:"Interview AI",        body:"Generate a role-specific interview kit. Ask: role, experience level, and company type." },
};

const GREETINGS = [
  "Hey! I'm **GEN-E**, your AI career guide.\n\nWhat's your current situation — looking to grow, switch careers, or start fresh?",
  "Hi! Welcome to **GEN-E**.\n\nI help with career guidance, ATS resumes, interview prep, and career scoring. What's on your mind?",
  "Hello! I'm **GEN-E**.\n\nCareer clarity starts here. Are you exploring new opportunities, building your resume, or prepping for interviews?",
];

const isGreeting = m => /^(hi+|hello+|hey+|sup|yo|howdy)\s*[!.]?\s*$/i.test(m.trim());
const isImgExt   = n => [".png",".jpg",".jpeg",".webp",".gif"].includes(n.slice(n.lastIndexOf(".")).toLowerCase());
const uid        = () => `c-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
const freshChat  = (mode="CAREER") => ({ id:uid(), title:"New Chat", mode, messages:[], history:[] });

let _serverWarmedUp = false, _wakePromise = null;
async function wakeServer() {
  if (_serverWarmedUp) return;
  if (_wakePromise) return _wakePromise;
  _wakePromise = (async () => {
    const deadline = Date.now() + 90000;
    while (Date.now() < deadline) {
      try { const r = await fetch(`${API}/health`,{signal:AbortSignal.timeout(8000)}); if(r.ok){_serverWarmedUp=true;_wakePromise=null;return;} } catch {}
      await new Promise(r=>setTimeout(r,4000));
    }
    _wakePromise = null;
  })();
  return _wakePromise;
}
wakeServer().catch(()=>{});

// ─── APP SWITCHER BAR ─────────────────────────────────────────────────────
function AppSwitcherBar({ profile }) {
  const [open, setOpen] = useState(false);
  const plan  = profile?.plan || "free";
  const isPaid = PAID_PLANS.has(plan);

  return (
    <div style={{
      height:44, background:"#fff", borderBottom:"1px solid #f0f0f0",
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"0 20px", flexShrink:0, position:"relative", zIndex:20,
      boxShadow:"0 1px 0 #f3f4f6",
    }}>
      {/* Left: NuGens logo */}
      <a href="https://nugens.in.net" style={{ display:"flex", alignItems:"center", gap:7, textDecoration:"none" }}>
        <img src={NG_LOGO} style={{ width:22, height:22, borderRadius:5, objectFit:"cover" }} alt="NG" />
        <span style={{ fontWeight:800, fontSize:13, color:"#111", letterSpacing:"-0.03em" }}>
          Nu<span style={{color:PINK}}>Gens</span>
        </span>
      </a>

      {/* Center: App pills */}
      <div style={{ display:"flex", alignItems:"center", gap:4 }}>
        {APPS.map(app => (
          <a key={app.key} href={app.url}
            style={{
              display:"flex", alignItems:"center", gap:5, padding:"5px 12px",
              borderRadius:20, textDecoration:"none", fontSize:12, fontWeight:600,
              background: app.active ? `${app.color}10` : "none",
              color:       app.active ? app.color : "#9ca3af",
              border:      `1px solid ${app.active ? app.color+"30" : "transparent"}`,
              transition:"all 0.15s",
            }}
            onMouseEnter={e=>{ e.currentTarget.style.background=`${app.color}10`; e.currentTarget.style.color=app.color; e.currentTarget.style.borderColor=`${app.color}30`; }}
            onMouseLeave={e=>{ if(!app.active){e.currentTarget.style.background="none"; e.currentTarget.style.color="#9ca3af"; e.currentTarget.style.borderColor="transparent";} }}
          >
            <span style={{ fontSize:11 }}>{app.icon}</span>
            {app.label}
            {app.active && <span style={{ width:5, height:5, borderRadius:"50%", background:app.color, display:"inline-block" }}/>}
          </a>
        ))}
      </div>

      {/* Right: Plan + Dashboard */}
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <a href="https://nugens.in.net/dashboard"
          style={{ fontSize:11, fontWeight:600, color:"#9ca3af", textDecoration:"none", padding:"4px 10px", border:"1px solid #e8eaed", borderRadius:7, transition:"all 0.15s" }}
          onMouseEnter={e=>{ e.currentTarget.style.color=PINK; e.currentTarget.style.borderColor=`${PINK}40`; }}
          onMouseLeave={e=>{ e.currentTarget.style.color="#9ca3af"; e.currentTarget.style.borderColor="#e8eaed"; }}
        >
          Dashboard
        </a>
        {!isPaid && (
          <a href="/pricing" style={{ fontSize:11, fontWeight:700, color:"#fff", background:PINK, textDecoration:"none", padding:"5px 12px", borderRadius:7 }}>
            Upgrade ↑
          </a>
        )}
      </div>
    </div>
  );
}

function PlanBadge({ plan }) {
  const isPaid = PAID_PLANS.has(plan);
  if (plan === "admin")  return <span style={{fontSize:10,fontWeight:700,color:"#7c3aed",letterSpacing:"0.04em"}}>Admin ✦</span>;
  if (plan === "yearly") return <span style={{fontSize:10,fontWeight:700,color:"#7c3aed",letterSpacing:"0.04em"}}>Pro ✦</span>;
  if (isPaid)            return <span style={{fontSize:10,fontWeight:700,color:PINK,letterSpacing:"0.04em"}}>Pro</span>;
  return                        <span style={{fontSize:10,fontWeight:700,color:"#aaa",letterSpacing:"0.04em"}}>Free</span>;
}

function LanguagePicker({ lang, setLang, open, setOpen }) {
  const cur = LANGUAGES[lang]||LANGUAGES.en;
  return (
    <div style={{position:"relative"}}>
      <button onClick={()=>setOpen(o=>!o)}
        style={{background:"none",border:"1.5px solid #edf0f3",borderRadius:8,padding:"4px 9px",cursor:"pointer",display:"flex",alignItems:"center",gap:5,fontSize:12,color:"#666",fontWeight:600,transition:"all 0.12s"}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor=PINK;e.currentTarget.style.color=PINK;}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor="#edf0f3";e.currentTarget.style.color="#666";}}>
        <span style={{fontSize:14}}>{cur.flag}</span><span>{cur.name}</span><span style={{fontSize:9,opacity:0.5}}>{open?"▲":"▼"}</span>
      </button>
      {open && (
        <>
          <div onClick={()=>setOpen(false)} style={{position:"fixed",inset:0,zIndex:200}}/>
          <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,zIndex:201,background:"#fff",borderRadius:13,boxShadow:"0 8px 40px rgba(0,0,0,0.12)",border:"1px solid #f0f0f0",padding:"8px 6px",width:200,maxHeight:300,overflowY:"auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:2}}>
            {Object.entries(LANGUAGES).map(([code,l])=>(
              <button key={code} onClick={()=>{localStorage.setItem("gene-lang",code);setLang(code);setOpen(false);}}
                style={{background:lang===code?"#fff0f4":"none",border:lang===code?"1px solid #fcc":"1px solid transparent",borderRadius:7,padding:"6px 8px",cursor:"pointer",display:"flex",alignItems:"center",gap:6,textAlign:"left"}}>
                <span style={{fontSize:14}}>{l.flag}</span>
                <div>
                  <div style={{fontSize:11,fontWeight:lang===code?700:500,color:lang===code?PINK:"#333"}}>{l.native}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function UpgradeModal({ feature, onClose, onUpgrade }) {
  const COPY = {
    limit:{icon:"⚡",title:"Free limit reached",body:`You've used all ${LIMIT} free questions. Upgrade for unlimited career guidance.`},
    resume_builder:{icon:"📄",title:"Pro Feature — ATS Resume Builder",body:"Build an ATS-optimised resume with a Pro plan."},
    resume_review:{icon:"🔍",title:"Pro Feature — Resume Review",body:"Uploading and analysing your resume requires a Pro plan."},
    interview_advanced:{icon:"🎯",title:"Pro Feature — Interview Prep",body:"Full interview prep is available on Pro plans."},
    job_search:{icon:"🔎",title:"Yearly Plan — Job Match",body:"Live job matching is exclusive to the Pro Yearly plan."},
  };
  const copy = COPY[feature]||COPY.limit;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:900,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#fff",borderRadius:22,padding:"36px 32px",maxWidth:360,width:"100%",textAlign:"center",boxShadow:"0 32px 80px rgba(0,0,0,0.2)"}}>
        <div style={{fontSize:36,marginBottom:12}}>{copy.icon}</div>
        <div style={{fontWeight:800,fontSize:18,color:"#111",marginBottom:8}}>{copy.title}</div>
        <div style={{fontSize:13,color:"#666",lineHeight:1.7,marginBottom:24}}>{copy.body}</div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:"11px 0",background:"#f5f7fa",border:"none",borderRadius:11,fontWeight:600,fontSize:13,color:"#888",cursor:"pointer"}}>Not now</button>
          <button onClick={onUpgrade} style={{flex:2,padding:"11px 0",background:PINK,border:"none",borderRadius:11,fontWeight:700,fontSize:13,color:"#fff",cursor:"pointer"}}>View Plans →</button>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ f, plan, onTrigger }) {
  const isAdmin = plan === "admin";
  const isPaidPlan = PAID_PLANS.has(plan);
  const locked = !isAdmin && !isPaidPlan && (f.pro || f.yearly);
  return (
    <button onClick={() => locked ? null : onTrigger(f)}
      style={{padding:"14px 15px",borderRadius:13,border:"1.5px solid #edf0f3",background:"#fff",cursor:locked?"default":"pointer",textAlign:"left",transition:"all 0.16s",fontFamily:"'Plus Jakarta Sans',sans-serif",boxShadow:"0 1px 3px rgba(0,0,0,0.04)",opacity:locked?0.55:1}}
      onMouseEnter={e=>{ if(!locked){ e.currentTarget.style.borderColor=f.color+"50"; e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow=`0 6px 20px ${f.color}12`; }}}
      onMouseLeave={e=>{ e.currentTarget.style.borderColor="#edf0f3"; e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="0 1px 3px rgba(0,0,0,0.04)"; }}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{width:32,height:32,borderRadius:9,background:f.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:f.color,flexShrink:0}}>{f.icon}</div>
        {locked && <span style={{fontSize:10,color:"#ccc"}}>🔒</span>}
        {f.pro    && !locked && <span style={{fontSize:9,fontWeight:700,color:f.color,background:f.bg,padding:"2px 7px",borderRadius:5,border:`1px solid ${f.color}30`}}>Pro</span>}
        {f.yearly && !locked && <span style={{fontSize:9,fontWeight:700,color:f.color,background:f.bg,padding:"2px 7px",borderRadius:5,border:`1px solid ${f.color}30`}}>Yearly</span>}
      </div>
      <div style={{fontSize:13,fontWeight:700,color:"#111",marginBottom:3}}>{f.label}</div>
      <div style={{fontSize:11.5,color:"#9ca3af",lineHeight:1.5}}>{f.desc}</div>
    </button>
  );
}

function RenameModal({chat,onSave,onClose}){
  const [v,setV]=useState(chat?.title||"");
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.3)",zIndex:900,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"#fff",borderRadius:14,padding:24,width:320,boxShadow:"0 12px 40px rgba(0,0,0,0.14)"}}>
        <div style={{fontSize:14,fontWeight:700,color:"#111",marginBottom:12}}>Rename chat</div>
        <input autoFocus value={v} onChange={e=>setV(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")onSave(v);if(e.key==="Escape")onClose();}}
          style={{width:"100%",padding:"9px 12px",border:"1.5px solid #e8ecf0",borderRadius:9,fontSize:13,outline:"none",marginBottom:12}}/>
        <div style={{display:"flex",gap:8}}>
          <button onClick={onClose} style={{flex:1,padding:"9px 0",background:"#f5f7fa",border:"none",borderRadius:8,fontSize:12.5,color:"#888",cursor:"pointer"}}>Cancel</button>
          <button onClick={()=>onSave(v.trim()||chat?.title)} style={{flex:1,padding:"9px 0",background:PINK,border:"none",borderRadius:8,fontSize:12.5,color:"#fff",fontWeight:700,cursor:"pointer"}}>Save</button>
        </div>
      </div>
    </div>
  );
}

function CtxMenu({x,y,onRename,onDelete,onClose}){
  const ref=useRef();
  useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target))onClose();};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[onClose]);
  return(
    <div ref={ref} style={{position:"fixed",top:y,left:x,zIndex:800,background:"#fff",borderRadius:11,padding:4,boxShadow:"0 8px 32px rgba(0,0,0,0.12)",border:"1px solid #f0f0f0",minWidth:140}}>
      {[["Rename",onRename,false],["Delete",onDelete,true]].map(([lbl,fn,danger])=>(
        <button key={lbl} onClick={()=>{fn();onClose();}} style={{display:"block",width:"100%",padding:"8px 12px",border:"none",background:"none",textAlign:"left",fontSize:12.5,cursor:"pointer",color:danger?"#e55":"#333",borderRadius:7}}
          onMouseEnter={e=>e.currentTarget.style.background=danger?"#fff5f5":"#f9f9f9"}
          onMouseLeave={e=>e.currentTarget.style.background="none"}>{lbl}</button>
      ))}
    </div>
  );
}

// ═══════════════════ MAIN COMPONENT ═══════════════════
export default function GenEChat() {
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [user,       setUser]       = useState(null);
  const [profile,    setProfile]    = useState(null);
  const [loading,    setLoading]    = useState({ profile:true, chats:true });
  const [chats,      setChats]      = useState([]);
  const [activeId,   setActiveId]   = useState(null);
  const [mode,       setMode]       = useState("CAREER");
  const [input,      setInput]      = useState("");
  const [busy,       setBusy]       = useState(false);
  const [staged,     setStaged]     = useState(null);
  const [showAttach, setShowAttach] = useState(false);
  const [sidebarOpen,setSidebarOpen]= useState(false);
  const [chatPickerOpen,setChatPickerOpen] = useState(false);
  const [searchQ,    setSearchQ]    = useState("");
  const [upgrade,    setUpgrade]    = useState(false);
  const [lang,       setLang]       = useState(()=>localStorage.getItem("gene-lang")||"en");
  const [langOpen,   setLangOpen]   = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [ctx,        setCtx]        = useState(null);
  const [renaming,   setRenaming]   = useState(null);
  const [editIdx,    setEditIdx]    = useState(null);
  const [editText,   setEditText]   = useState("");

  const bottomRef   = useRef(null);
  const inputRef    = useRef(null);
  const saveTimer   = useRef(null);
  const pendingTool = useRef(null);
  const active      = chats.find(c => c.id === activeId);
  const isBusinessUser = profile?.user_type === "business";

  // ─── FIXED canSend: accepts ALL paid plans, not just 3 ───────────────────
  const canSend = () => {
    if (!profile) return false;
    if (PAID_PLANS.has(profile.plan)) return true;          // any paid plan → unlimited
    return (profile.questions_used || 0) < LIMIT;           // free → up to 20
  };

  const loadProfile = async uid => {
    const { data } = await supabase.from("profiles").select("*").eq("id",uid).single();
    if (data) setProfile(data);
    setLoading(p=>({...p,profile:false}));
  };

  const loadChats = async uid => {
    const { data } = await supabase.from("chat_sessions").select("*").eq("user_id",uid).order("updated_at",{ascending:false});
    if (data?.length) {
      const parseArr = v => { if(Array.isArray(v))return v; if(typeof v==="string"){try{return JSON.parse(v);}catch{return[];}} return []; };
      const loaded = data.map(r=>({id:r.id,title:r.title,mode:r.mode,messages:parseArr(r.messages),history:parseArr(r.history)}));
      setChats(loaded); setActiveId(loaded[0].id);
    } else {
      const f = freshChat(); setChats([f]); setActiveId(f.id);
    }
    setLoading(p=>({...p,chats:false}));
  };

  useEffect(() => {
    const t = searchParams.get("t");
    if (t && TOOL_AUTO[t]) pendingTool.current = t;
    supabase.auth.getSession().then(async ({data:{session}})=>{
      if (!session) { nav("/auth"); return; }
      setUser(session.user);
      await Promise.all([loadProfile(session.user.id), loadChats(session.user.id)]);
    });
    const {data:{subscription}} = supabase.auth.onAuthStateChange(async(ev,session)=>{
      if (!session){nav("/auth");return;}
      if (ev==="TOKEN_REFRESHED"){setUser(session.user);loadProfile(session.user.id);}
    });
    return () => subscription.unsubscribe();
  }, [nav]);

  const isLoading = loading.profile || loading.chats;

  useEffect(() => {
    if (!isLoading && pendingTool.current) {
      const toolKey = pendingTool.current;
      pendingTool.current = null;
      const trigger = TOOL_AUTO[toolKey];
      if (!trigger) return;
      setSearchParams({}, { replace: true });
      const c = freshChat(trigger.mode);
      c.title = trigger.label;
      setChats(prev => [c, ...prev]);
      setActiveId(c.id);
      setMode(trigger.mode);
      setTimeout(() => send(trigger.body, c.id, trigger.mode, null), 200);
    }
  }, [isLoading]);

  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[active?.messages,busy]);
  useEffect(()=>{const h=()=>setCtx(null);document.addEventListener("click",h);return()=>document.removeEventListener("click",h);},[]);

  const save = useCallback((chat,uid) => {
    if (!uid||!chat) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async()=>{
      await supabase.from("chat_sessions").upsert({id:chat.id,user_id:uid,title:chat.title,mode:chat.mode,messages:chat.messages,history:chat.history},{onConflict:"id"});
    },800);
  },[]);

  const patch = useCallback((id,fn) => {
    setChats(prev=>{
      const next = prev.map(c=>c.id===id?fn(c):c);
      const u = next.find(c=>c.id===id);
      if(u&&user) save(u,user.id);
      return next;
    });
  },[user,save]);

  const newChat = () => {
    const c = freshChat(mode);
    setChats(p=>[c,...p]); setActiveId(c.id);
    setInput(""); setStaged(null); setSidebarOpen(false);
    setTimeout(()=>inputRef.current?.focus(),60);
  };

  const deleteChat = async id => {
    await supabase.from("chat_sessions").delete().eq("id",id);
    setChats(prev=>{
      const rest = prev.filter(c=>c.id!==id);
      if(!rest.length){const f=freshChat(mode);setActiveId(f.id);return[f];}
      if(id===activeId) setActiveId(rest[0].id);
      return rest;
    });
  };

  const renameChat = async (id,title) => {
    patch(id,c=>({...c,title})); setRenaming(null);
    await supabase.from("chat_sessions").update({title}).eq("id",id);
  };

  const getToken = async () => {
    const {data:{session}} = await supabase.auth.getSession();
    return session?.access_token||null;
  };

  const stageFile = file => {
    if(!file) return; setShowAttach(false);
    const plan = profile?.plan||"free";
    if(plan==="free"){ setUpgrade("resume_review"); return; }
    const s={file,name:file.name,size:file.size,previewUrl:null};
    if(isImgExt(file.name)){const r=new FileReader();r.onload=e=>setStaged({...s,previewUrl:e.target.result});r.readAsDataURL(file);}
    else setStaged(s);
    setTimeout(()=>inputRef.current?.focus(),80);
  };

  const triggerFeature = (f) => {
    const p = profile?.plan || "free";
    const isPaid = PAID_PLANS.has(p);
    if (!isPaid && f.pro)    { setUpgrade("resume_builder"); return; }
    if (!isPaid && f.yearly) { setUpgrade("job_search");     return; }
    const c = freshChat(f.mode);
    setChats(prev=>[c,...prev]); setActiveId(c.id); setMode(f.mode);
    setTimeout(()=>send(f.body,c.id,f.mode,null),80);
  };

  // ─── CORE SEND ────────────────────────────────────────────────────────────
  const send = async (txt=input, chatId=activeId, chatMode=mode, stagedArg=staged) => {
    const msg=txt.trim();
    if((!msg&&!stagedArg)||busy) return;
    if(!canSend()){setUpgrade("limit");return;}
    setInput(""); setStaged(null);

    if(stagedArg){
      const userText=msg?`${isImgExt(stagedArg.name)?"🖼️":"📄"} **${stagedArg.name}**\n\n${msg}`:`${isImgExt(stagedArg.name)?"🖼️":"📄"} Uploaded: **${stagedArg.name}**`;
      patch(chatId,c=>({...c,messages:[...c.messages,{role:"user",text:userText,imagePreview:isImgExt(stagedArg.name)?stagedArg.previewUrl:null}]}));
      setBusy(true);
      try {
        const token=await getToken(); await wakeServer();
        const fd=new FormData(); fd.append("file",stagedArg.file); if(msg)fd.append("note",msg);
        const res=await fetch(`${API}/api/upload`,{method:"POST",body:fd,headers:token?{Authorization:`Bearer ${token}`}:{}});
        let data; try{data=await res.json();}catch{data={reply:"Unexpected response. Try again."};}
        if(res.status===403&&data.gate){patch(chatId,c=>({...c,messages:c.messages.slice(0,-1)}));setUpgrade(data.gate);setBusy(false);return;}
        const replyText=data.reply||data.error||"Upload failed — try again.";
        patch(chatId,c=>({...c,messages:[...c.messages,{role:"assistant",text:replyText}],history:[...c.history,{role:"user",content:msg?`[FILE] ${msg}`:"[FILE]"},{role:"assistant",content:replyText}]}));
      } catch(err){
        const errMsg=err.name==="AbortError"?"⏳ Server waking up. Please try again in 30 seconds.":"Upload failed. Check your connection.";
        patch(chatId,c=>({...c,messages:[...c.messages,{role:"assistant",text:errMsg}]}));
      } finally{setBusy(false);}
      return;
    }

    const hist=chats.find(c=>c.id===chatId)?.history||[];
    const isFirst=!(chats.find(c=>c.id===chatId)?.messages||[]).some(m=>m.role==="user");
    if(isFirst) patch(chatId,c=>({...c,title:msg.slice(0,44)+(msg.length>44?"…":"")}));
    patch(chatId,c=>({...c,messages:[...c.messages,{role:"user",text:msg}],history:[...c.history,{role:"user",content:msg}]}));
    setBusy(true);

    if(isGreeting(msg)&&hist.length===0){
      const reply=GREETINGS[Math.floor(Math.random()*GREETINGS.length)];
      setTimeout(()=>{patch(chatId,c=>({...c,messages:[...c.messages,{role:"assistant",text:reply}],history:[...c.history,{role:"assistant",content:reply}]}));setBusy(false);},300);
      return;
    }

    try {
      const token=await getToken(); await wakeServer();
      patch(chatId,c=>({...c,messages:[...c.messages,{role:"assistant",text:"",streaming:true}]}));
      const res=await fetch(`${API}/api/chat`,{method:"POST",headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({message:`[MODE:${chatMode}] ${msg}`,history:hist,session_id:chatId,mode:chatMode,lang})});
      if(res.status===403){const d=await res.json().catch(()=>({}));patch(chatId,c=>({...c,messages:c.messages.filter(m=>!m.streaming).slice(0,-1)}));setUpgrade("limit");setBusy(false);return;}
      if(!res.ok||!res.body) throw new Error("Server error "+res.status);
      const reader=res.body.getReader(); const decoder=new TextDecoder();
      let fullText="",jobCards=null,wasGated=false;
      while(true){
        const {done,value}=await reader.read(); if(done) break;
        const lines=decoder.decode(value,{stream:true}).split("\n");
        for(const line of lines){
          if(!line.startsWith("data: ")) continue;
          try{
            const p=JSON.parse(line.slice(6));
            if(p.chunk){fullText+=p.chunk;patch(chatId,c=>({...c,messages:c.messages.map(m=>m.streaming?{...m,text:fullText}:m)}));}
            if(p.jobs) jobCards=p.jobs;
            if(p.gate){wasGated=true;patch(chatId,c=>({...c,messages:c.messages.filter(m=>!m.streaming)}));setUpgrade(p.gate);setBusy(false);}
            if(p.error) fullText=p.error;
          }catch{}
        }
      }
      if(wasGated) return;
      patch(chatId,c=>({...c,messages:c.messages.map(m=>m.streaming?{role:"assistant",text:fullText||"No response. Try again.",jobs:jobCards}:m),history:[...c.history,{role:"assistant",content:fullText}]}));
      if(!PAID_PLANS.has(profile?.plan||"free")) setProfile(p=>p?{...p,questions_used:(p.questions_used||0)+1}:p);
    } catch(err){
      patch(chatId,c=>({...c,messages:c.messages.filter(m=>!m.streaming).concat([{role:"assistant",text:"⚠️ Could not reach server. Please try again.\n\n*("+err.message+")*"}])}));
    } finally{setBusy(false);}
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "https://nugens.in.net/auth";
  };

  const groupedChats = (()=>{
    const now=new Date(),today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
    const yday=new Date(+today-864e5),w7=new Date(+today-6*864e5);
    const g={"Today":[],"Yesterday":[],"Last 7 days":[],"Older":[]};
    chats.filter(c=>c.title.toLowerCase().includes(searchQ.toLowerCase())).forEach(c=>{
      const d=new Date(parseInt(c.id.split("-")[1])||0);
      if(d>=today)g["Today"].push(c); else if(d>=yday)g["Yesterday"].push(c);
      else if(d>=w7)g["Last 7 days"].push(c); else g["Older"].push(c);
    });
    return g;
  })();

  const curMode = MODES.find(m=>m.id===mode);

  if (isLoading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#fff",flexDirection:"column",gap:12}}>
      <div style={{width:40,height:40,borderRadius:12,background:`linear-gradient(135deg,${PINK},#c4134e)`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:12,color:"#fff",boxShadow:`0 8px 24px ${PINK}35`}}>GE</div>
      <div style={{color:"#ddd",fontSize:13,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Loading…</div>
    </div>
  );

  const ChatSidebar = () => (
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:"#fff",borderRight:"1px solid #f0f0f0",overflow:"hidden"}}>
      <div style={{padding:"14px 14px 10px",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <div style={{fontWeight:800,fontSize:16,color:"#111",letterSpacing:"-0.03em"}}>GEN<span style={{color:PINK}}>-E</span></div>
          <button onClick={newChat} style={{width:28,height:28,borderRadius:8,border:"1.5px solid #edf0f3",background:"#fff",cursor:"pointer",fontSize:16,color:"#ccc",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1,transition:"all 0.12s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=PINK;e.currentTarget.style.color=PINK;e.currentTarget.style.background="#fff0f4";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="#edf0f3";e.currentTarget.style.color="#ccc";e.currentTarget.style.background="#fff";}}>+</button>
        </div>
        <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search chats…"
          style={{width:"100%",padding:"7px 11px",background:"#f8fafb",border:"1px solid #edf0f3",borderRadius:9,fontSize:12.5,color:"#555",outline:"none"}}/>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"0 8px"}} className="sb-scroll">
        {Object.entries(groupedChats).map(([grp,list])=>{
          if(!list.length) return null;
          return (
            <div key={grp} style={{marginBottom:12}}>
              <div style={{padding:"6px 6px 2px",fontSize:10,fontWeight:700,color:"#d0d5dd",letterSpacing:"0.06em",textTransform:"uppercase"}}>{grp}</div>
              {list.map(chat=>{
                const isAct=chat.id===activeId;
                return (
                  <div key={chat.id} onClick={()=>{setActiveId(chat.id);setSidebarOpen(false);}}
                    onContextMenu={e=>{e.preventDefault();e.stopPropagation();setCtx({x:e.clientX,y:e.clientY,id:chat.id});}}
                    style={{display:"flex",alignItems:"center",padding:"6px 8px",borderRadius:9,cursor:"pointer",marginBottom:1,background:isAct?`${PINK}08`:"transparent",userSelect:"none",transition:"background 0.12s"}}>
                    <span style={{flex:1,fontSize:12.5,color:isAct?PINK:"#555",fontWeight:isAct?600:400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{chat.title}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* User + quick actions */}
      <div style={{padding:"10px 12px 14px",borderTop:"1px solid #f5f7fa",flexShrink:0}}>
        {!PAID_PLANS.has(profile?.plan||"free") && (
          <div style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10.5,color:"#d0d5dd",marginBottom:4}}>
              <span>{profile?.questions_used||0} / {LIMIT} free questions used</span>
              <span style={{color:(profile?.questions_used||0)>=18?PINK:"#d0d5dd"}}>{Math.max(0,LIMIT-(profile?.questions_used||0))} left</span>
            </div>
            <div style={{height:3,background:"#f0f2f5",borderRadius:4}}>
              <div style={{height:3,borderRadius:4,background:`linear-gradient(90deg,${PINK},#c4134e)`,width:`${Math.min(100,((profile?.questions_used||0)/LIMIT)*100)}%`,transition:"width 0.4s"}}/>
            </div>
            <button onClick={()=>nav("/pricing")} style={{marginTop:8,width:"100%",padding:"7px 0",background:`linear-gradient(135deg,${PINK},#c4134e)`,border:"none",borderRadius:9,fontSize:11.5,color:"#fff",cursor:"pointer",fontWeight:700}}>
              Upgrade to Pro
            </button>
          </div>
        )}
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <div style={{width:32,height:32,borderRadius:"50%",flexShrink:0,background:`${PINK}15`,border:`2px solid ${PINK}25`,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}}>
            {profile?.avatar_url
              ? <img src={profile.avatar_url} style={{width:32,height:32,objectFit:"cover"}} alt=""/>
              : <span style={{fontSize:12,fontWeight:800,color:PINK}}>{(profile?.full_name||user?.email||"U").charAt(0).toUpperCase()}</span>
            }
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12.5,fontWeight:700,color:"#1a1a1a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{(profile?.full_name||user?.email||"").split(" ")[0]||"User"}</div>
            <PlanBadge plan={profile?.plan||"free"}/>
          </div>
          <button onClick={handleSignOut} style={{fontSize:11,color:"#ccc",background:"none",border:"none",cursor:"pointer",padding:"4px 6px",borderRadius:6}}
            onMouseEnter={e=>e.currentTarget.style.color="#e55"} onMouseLeave={e=>e.currentTarget.style.color="#ccc"}>Out</button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body,#root{height:100%;font-family:'Plus Jakarta Sans',sans-serif;background:#fff;color:#111}
        .sb-scroll::-webkit-scrollbar{width:0}.sb-scroll:hover::-webkit-scrollbar{width:3px}.sb-scroll::-webkit-scrollbar-thumb{background:#eee;border-radius:4px}
        .chat-scroll::-webkit-scrollbar{width:5px}.chat-scroll::-webkit-scrollbar-thumb{background:#f0f0f0;border-radius:4px}
        .md-ai p{margin-bottom:9px;line-height:1.75;font-size:14px;color:#374151}
        .md-ai p:last-child{margin-bottom:0}
        .md-ai h2{font-size:11px;font-weight:700;color:${PINK};margin:16px 0 6px;text-transform:uppercase;letter-spacing:0.07em;padding-bottom:6px;border-bottom:1px solid ${PINK}18}
        .md-ai h3{font-size:13.5px;font-weight:700;color:#111;margin:13px 0 5px}
        .md-ai ul,.md-ai ol{padding-left:20px;margin-bottom:9px}
        .md-ai li{margin-bottom:5px;line-height:1.65;font-size:14px;color:#374151}
        .md-ai strong{color:#111;font-weight:700}
        .md-ai code{background:#fef2f4;color:${PINK};padding:2px 6px;border-radius:5px;font-size:12.5px;font-family:monospace}
        .md-ai pre{background:#f9fafb;border:1px solid #f3f4f6;border-radius:9px;padding:12px 14px;overflow-x:auto;margin:8px 0}
        .md-ai table{width:100%;border-collapse:collapse;margin:10px 0;font-size:13px}
        .md-ai th{background:#fef2f4;color:${PINK};padding:8px 11px;text-align:left;font-weight:700;border:1px solid #fcd5de}
        .md-ai td{padding:7px 11px;border:1px solid #f3f4f6;color:#374151}
        .md-ai blockquote{border-left:3px solid ${PINK};padding:6px 13px;color:#6b7280;margin:9px 0;background:#fef9fb;border-radius:0 8px 8px 0}
        .md-user p{margin:0;line-height:1.65;font-size:14px}
        .md-user strong{color:#fff;font-weight:700}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .msg-in{animation:fadeUp 0.2s ease}
        @keyframes blink{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}
        .d1{animation:blink 1.2s infinite}.d2{animation:blink 1.2s 0.2s infinite}.d3{animation:blink 1.2s 0.4s infinite}
        @keyframes cur{0%,100%{opacity:1}50%{opacity:0}}
        .streaming-msg::after{content:"▋";color:${PINK};animation:cur 0.7s infinite;margin-left:2px;font-size:13px}
        .desktop-sb{display:flex!important}
        .mob-btn{display:none!important}
        .sb-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.35);z-index:199;backdrop-filter:blur(2px)}
        .sb-overlay.open{display:block}
        .sb-drawer{position:fixed;top:0;left:0;height:100%;width:252px;z-index:200;transform:translateX(-100%);transition:transform 0.22s ease;box-shadow:4px 0 32px rgba(0,0,0,0.1)}
        .sb-drawer.open{transform:translateX(0)}
        @media(max-width:720px){.mob-btn{display:flex!important}.desktop-sb{display:none!important}}
      `}</style>

      {upgrade && <UpgradeModal feature={upgrade} onClose={()=>setUpgrade(false)} onUpgrade={()=>{setUpgrade(false);nav("/pricing");}}/>}
      {renaming && <RenameModal chat={chats.find(c=>c.id===renaming)} onSave={t=>renameChat(renaming,t)} onClose={()=>setRenaming(null)}/>}
      {ctx && <CtxMenu x={ctx.x} y={ctx.y} onRename={()=>setRenaming(ctx.id)} onDelete={()=>deleteChat(ctx.id)} onClose={()=>setCtx(null)}/>}
      {savedToast && (
        <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:"#15803d",color:"#fff",padding:"10px 20px",borderRadius:11,fontSize:13,fontWeight:700,zIndex:999}}>
          ✅ Resume saved!
        </div>
      )}

      {/* ── Wrapper with top app bar ── */}
      <div style={{display:"flex",flexDirection:"column",height:"100vh",overflow:"hidden"}}>

        {/* ── Cross-app navigation bar ── */}
        <AppSwitcherBar profile={profile} />

        <div style={{display:"flex",flex:1,overflow:"hidden"}}>

          {/* Desktop sidebar */}
          <aside className="desktop-sb" style={{width:252,flexShrink:0,flexDirection:"column",overflow:"hidden"}}>
            <ChatSidebar/>
          </aside>

          {/* Mobile drawer */}
          <div className={`sb-overlay ${sidebarOpen?"open":""}`} onClick={()=>setSidebarOpen(false)}/>
          <div className={`sb-drawer ${sidebarOpen?"open":""}`}><ChatSidebar/></div>

          {/* ── MAIN AREA ── */}
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>

            {/* Topbar */}
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"0 16px",height:50,borderBottom:"1px solid #f0f2f5",background:"rgba(255,255,255,0.95)",backdropFilter:"blur(8px)",flexShrink:0}}>
              <button className="mob-btn" onClick={()=>setSidebarOpen(true)}
                style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#bbb",padding:"4px",display:"none",alignItems:"center"}}>☰</button>

              {/* Chat picker */}
              <div style={{position:"relative",flexShrink:0}}>
                <button onClick={()=>setChatPickerOpen(o=>!o)}
                  style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",background:"#f8fafb",border:"1.5px solid #edf0f3",borderRadius:9,cursor:"pointer",fontSize:12.5,color:"#555",fontWeight:500,maxWidth:190,transition:"all 0.13s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=PINK+"60";e.currentTarget.style.color=PINK;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="#edf0f3";e.currentTarget.style.color="#555";}}>
                  <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:130}}>{active?.title||"New Chat"}</span>
                  <span style={{fontSize:8,color:"#ccc",flexShrink:0}}>{chatPickerOpen?"▲":"▼"}</span>
                </button>
                {chatPickerOpen && (
                  <>
                    <div onClick={()=>{setChatPickerOpen(false);setSearchQ("");}} style={{position:"fixed",inset:0,zIndex:300}}/>
                    <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,zIndex:301,background:"#fff",border:"1px solid #f0f0f0",borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,0.1)",width:260,overflow:"hidden"}}>
                      <div style={{padding:"10px 12px 6px"}}>
                        <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search chats…" autoFocus
                          style={{width:"100%",padding:"7px 11px",background:"#f8fafb",border:"1px solid #edf0f3",borderRadius:8,fontSize:12,color:"#555",outline:"none",boxSizing:"border-box"}}/>
                      </div>
                      <div style={{maxHeight:240,overflowY:"auto",padding:"4px 8px 6px"}} className="sb-scroll">
                        {Object.entries(groupedChats).map(([grp,list])=>{
                          if(!list.length) return null;
                          return (
                            <div key={grp}>
                              <div style={{padding:"5px 6px 2px",fontSize:9,fontWeight:700,color:"#d0d5dd",letterSpacing:"0.06em",textTransform:"uppercase"}}>{grp}</div>
                              {list.map(chat=>{
                                const isAct=chat.id===activeId;
                                return (
                                  <div key={chat.id} onClick={()=>{setActiveId(chat.id);setChatPickerOpen(false);setSearchQ("");}}
                                    style={{padding:"7px 8px",borderRadius:8,cursor:"pointer",marginBottom:1,background:isAct?`${PINK}08`:"transparent",fontSize:12.5,color:isAct?PINK:"#555",fontWeight:isAct?600:400}}
                                    onMouseEnter={e=>{if(!isAct)e.currentTarget.style.background="#f8fafb";}}
                                    onMouseLeave={e=>{if(!isAct)e.currentTarget.style.background="transparent";}}>
                                    {chat.title}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                      <div style={{padding:"8px 12px",borderTop:"1px solid #f5f7fa"}}>
                        <button onClick={()=>{newChat();setChatPickerOpen(false);}}
                          style={{width:"100%",padding:"8px",background:`${PINK}08`,border:`1px solid ${PINK}20`,borderRadius:8,fontSize:12,color:PINK,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                          + New Chat
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <span style={{fontSize:12,fontWeight:700,color:PINK,background:`${PINK}0c`,padding:"3px 10px",borderRadius:20,border:`1px solid ${PINK}20`,flexShrink:0}}>
                {curMode?.long}
              </span>
              <div style={{flex:1}}/>
              <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
                {!PAID_PLANS.has(profile?.plan||"free") && (
                  <button onClick={()=>nav("/pricing")} style={{padding:"4px 11px",background:`${PINK}0c`,border:`1px solid ${PINK}20`,borderRadius:20,fontSize:11,color:PINK,cursor:"pointer",fontWeight:700}}>
                    {Math.max(0,LIMIT-(profile?.questions_used||0))} left
                  </button>
                )}
                <PlanBadge plan={profile?.plan||"free"}/>
                <LanguagePicker lang={lang} setLang={setLang} open={langOpen} setOpen={setLangOpen}/>
                <button onClick={newChat} style={{width:30,height:30,background:"#f8fafb",border:"1.5px solid #edf0f3",borderRadius:9,cursor:"pointer",color:"#bbb",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1,transition:"all 0.13s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=PINK;e.currentTarget.style.color=PINK;e.currentTarget.style.background="#fff0f4";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="#edf0f3";e.currentTarget.style.color="#bbb";e.currentTarget.style.background="#f8fafb";}}>+</button>
              </div>
            </div>

            {/* Messages / Welcome */}
            {(!active||!active.messages.length)&&!busy ? (
              <div className="chat-scroll" style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 24px 24px",background:"linear-gradient(180deg,#fafbfc 0%,#fff 60%)"}}>
                <div style={{textAlign:"center",marginBottom:24}}>
                  <div style={{fontWeight:800,fontSize:28,letterSpacing:"-0.05em",marginBottom:6}}>GEN<span style={{color:PINK}}>-E</span></div>
                  <div style={{fontSize:14,fontWeight:500,color:"#9ca3af",marginBottom:6}}>{isBusinessUser?"Workforce Intelligence AI":"AI Career Intelligence"}</div>
                  {profile?.full_name&&<div style={{fontSize:13.5,color:"#c0c6d0"}}>Hey {profile.full_name.split(" ")[0]}! What would you like to work on?</div>}
                </div>

                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(175px,1fr))",gap:10,width:"100%",maxWidth:620,marginBottom:20}}>
                  {(isBusinessUser?BUSINESS_FEATURES:INDIVIDUAL_FEATURES).map(f=>(
                    <FeatureCard key={f.key} f={f} plan={profile?.plan||"free"} onTrigger={triggerFeature}/>
                  ))}
                </div>

                <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center"}}>
                  {MODES.map(m=>(
                    <button key={m.id} onClick={()=>setMode(m.id)}
                      style={{padding:"5px 14px",borderRadius:20,cursor:"pointer",fontSize:12,fontWeight:600,border:`1.5px solid ${mode===m.id?PINK:"#edf0f3"}`,background:mode===m.id?`${PINK}0c`:"#fff",color:mode===m.id?PINK:"#c0c6d0",transition:"all 0.13s"}}>
                      {m.icon} {m.long}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="chat-scroll" style={{flex:1,overflowY:"auto",padding:"28px 20px 16px",background:"#fafbfc"}}>
                <div style={{maxWidth:720,margin:"0 auto",display:"flex",flexDirection:"column",gap:20}}>
                  {active?.messages.map((msg,i)=>(
                    <div key={i} className="msg-in" style={{display:"flex",justifyContent:msg.role==="user"?"flex-end":"flex-start",alignItems:"flex-start",gap:10}}>
                      {msg.role==="assistant"&&(
                        <div style={{width:30,height:30,borderRadius:9,background:`linear-gradient(135deg,${PINK},#c4134e)`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:9,color:"#fff",marginTop:2,letterSpacing:"-0.03em",boxShadow:`0 4px 12px ${PINK}30`}}>GE</div>
                      )}
                      <div style={{maxWidth:"80%",display:"flex",flexDirection:"column",alignItems:msg.role==="user"?"flex-end":"flex-start",gap:5}}>
                        {msg.imagePreview&&<img src={msg.imagePreview} alt="" style={{maxWidth:220,maxHeight:160,objectFit:"cover",borderRadius:11,border:"1px solid #f0f0f0"}}/>}
                        <div style={{padding:"12px 16px",borderRadius:16,fontSize:14,lineHeight:1.7,
                          ...(msg.role==="user"
                            ?{background:`linear-gradient(135deg,${PINK},#d01450)`,color:"#fff",borderBottomRightRadius:4,boxShadow:`0 4px 16px ${PINK}35`}
                            :{background:"#fff",color:"#111",border:"1px solid rgba(0,0,0,0.06)",borderBottomLeftRadius:4,boxShadow:"0 1px 4px rgba(0,0,0,0.05)"})
                        }}>
                          <div className={msg.role==="user"?"md-user":("md-ai"+(msg.streaming?" streaming-msg":""))}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                          </div>
                          {msg.role==="assistant"&&msg.jobs?.length>0&&(
                            <div style={{marginTop:16,display:"flex",flexDirection:"column",gap:8}}>
                              {msg.jobs.map(j=>(
                                <a key={j.id} href={j.url} target="_blank" rel="noopener noreferrer"
                                  style={{display:"block",textDecoration:"none",background:"#fff",border:"1.5px solid #f0f2f5",borderRadius:12,padding:"12px 14px"}}
                                  onMouseEnter={e=>{e.currentTarget.style.borderColor="#fcc";}}
                                  onMouseLeave={e=>{e.currentTarget.style.borderColor="#f0f2f5";}}>
                                  <div style={{fontSize:13,fontWeight:700,color:"#111"}}>{j.title}</div>
                                  <div style={{fontSize:11.5,color:"#666",marginTop:2}}>{j.company} · {j.location}</div>
                                  {j.salary&&<div style={{fontSize:11.5,color:PINK,fontWeight:700,marginTop:4}}>{j.salary}</div>}
                                  <div style={{marginTop:6,fontSize:10.5,color:PINK,fontWeight:600}}>Apply → {j.source}</div>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {busy&&!active?.messages?.some(m=>m.streaming)&&(
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:30,height:30,borderRadius:9,background:`linear-gradient(135deg,${PINK},#c4134e)`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:9,color:"#fff",boxShadow:`0 4px 12px ${PINK}30`}}>GE</div>
                      <div style={{padding:"11px 15px",background:"#fff",border:"1px solid rgba(0,0,0,0.06)",borderRadius:16,borderBottomLeftRadius:4,display:"flex",gap:5,alignItems:"center",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
                        {["d1","d2","d3"].map(c=><div key={c} className={c} style={{width:5,height:5,borderRadius:"50%",background:"#d1d5db"}}/>)}
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef}/>
                </div>
              </div>
            )}

            {/* Input */}
            <div style={{padding:"10px 20px 18px",background:"#fff",flexShrink:0,borderTop:"1px solid #f0f2f5"}}>
              <div style={{maxWidth:720,margin:"0 auto"}}>
                {staged&&(
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,padding:"7px 13px",background:`${PINK}08`,borderRadius:11,border:`1px solid ${PINK}20`}}>
                    {staged.previewUrl?<img src={staged.previewUrl} alt="" style={{width:32,height:32,objectFit:"cover",borderRadius:7,flexShrink:0}}/>:<span style={{fontSize:18,flexShrink:0}}>📄</span>}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:600,color:"#333",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{staged.name}</div>
                    </div>
                    <button onClick={()=>{setStaged(null);inputRef.current?.focus();}} style={{background:"none",border:"none",cursor:"pointer",color:"#ccc",fontSize:18,lineHeight:1,flexShrink:0}}>×</button>
                  </div>
                )}

                <div style={{display:"flex",alignItems:"flex-end",gap:8,background:"#f8fafb",border:"1.5px solid #edf0f3",borderRadius:16,padding:"8px 8px 8px 14px",transition:"all 0.15s"}}
                  onFocusCapture={e=>{e.currentTarget.style.borderColor=`${PINK}50`;e.currentTarget.style.background="#fff";e.currentTarget.style.boxShadow=`0 0 0 3px ${PINK}10`;}}
                  onBlurCapture={e=>{e.currentTarget.style.borderColor="#edf0f3";e.currentTarget.style.background="#f8fafb";e.currentTarget.style.boxShadow="none";}}>

                  <div style={{position:"relative",flexShrink:0}}>
                    <button onClick={()=>setShowAttach(v=>!v)}
                      style={{width:32,height:32,background:"#fff",border:"1.5px solid #edf0f3",borderRadius:9,cursor:"pointer",color:staged?PINK:"#c0c6d0",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.13s"}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=PINK;e.currentTarget.style.color=PINK;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor="#edf0f3";e.currentTarget.style.color=staged?PINK:"#c0c6d0";}}>📎</button>
                    {showAttach&&(
                      <div onClick={e=>e.stopPropagation()} style={{position:"absolute",bottom:40,left:0,background:"#fff",border:"1px solid #f0f2f5",borderRadius:13,padding:6,minWidth:200,zIndex:50,boxShadow:"0 8px 32px rgba(0,0,0,0.1)"}}>
                        {[["Resume / CV (PDF, DOCX)",".pdf,.doc,.docx"],["Job Description",".pdf,.docx,.txt"],["Image / Screenshot",".png,.jpg,.jpeg,.webp"]].map(([lbl,acc])=>(
                          <label key={lbl} style={{display:"flex",alignItems:"center",padding:"8px 10px",fontSize:12.5,color:"#444",borderRadius:9,cursor:"pointer"}}
                            onMouseEnter={e=>e.currentTarget.style.background="#f8fafb"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                            {lbl}<input type="file" style={{display:"none"}} accept={acc} onChange={e=>{if(e.target.files[0])stageFile(e.target.files[0]);setShowAttach(false);}}/>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <textarea ref={inputRef} value={input} rows={1}
                    onChange={e=>setInput(e.target.value)}
                    onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
                    placeholder={canSend()?`Ask anything… (${curMode?.long})`:"Upgrade to continue chatting"}
                    style={{flex:1,background:"transparent",border:"none",resize:"none",fontSize:14,lineHeight:1.6,color:"#111",outline:"none",maxHeight:130,overflowY:"auto",minHeight:22,paddingTop:5,fontFamily:"inherit"}}/>

                  {!canSend() ? (
                    <button onClick={()=>nav("/pricing")} style={{height:34,padding:"0 16px",background:`linear-gradient(135deg,${PINK},#c4134e)`,border:"none",borderRadius:10,fontWeight:700,fontSize:12,color:"#fff",cursor:"pointer",flexShrink:0}}>Upgrade</button>
                  ) : (
                    <button onClick={()=>send()} disabled={busy||(!input.trim()&&!staged)}
                      style={{height:34,padding:"0 16px",flexShrink:0,background:(busy||(!input.trim()&&!staged))?"#f0f2f5":`linear-gradient(135deg,${PINK},#c4134e)`,border:"none",borderRadius:10,fontWeight:700,fontSize:12,color:(busy||(!input.trim()&&!staged))?"#c0c6d0":"#fff",cursor:(busy||(!input.trim()&&!staged))?"not-allowed":"pointer",transition:"all 0.15s"}}>
                      {busy?"…":"Send"}
                    </button>
                  )}
                </div>

                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:7,flexWrap:"wrap",gap:6}}>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                    {MODES.map(m=>(
                      <button key={m.id} onClick={()=>setMode(m.id)}
                        style={{padding:"3px 11px",borderRadius:20,cursor:"pointer",fontSize:11.5,fontWeight:600,border:`1.5px solid ${mode===m.id?PINK:"#edf0f3"}`,background:mode===m.id?`${PINK}0c`:"transparent",color:mode===m.id?PINK:"#c0c6d0",transition:"all 0.13s"}}>
                        {m.long}
                      </button>
                    ))}
                  </div>
                  <div style={{fontSize:10.5,color:"#d0d5dd"}}>Enter to send · Shift+Enter new line</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}