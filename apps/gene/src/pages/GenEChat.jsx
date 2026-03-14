import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

const API   = import.meta.env.VITE_GEN_E_API_URL || "https://nugens-platform.onrender.com";
const PINK  = "#e8185d";
const LIMIT = 20;

/* ── Languages ── */
const LANGUAGES = {
  en:{name:"English",native:"English",flag:"🇬🇧"},hi:{name:"Hindi",native:"हिंदी",flag:"🇮🇳"},
  es:{name:"Spanish",native:"Español",flag:"🇪🇸"},fr:{name:"French",native:"Français",flag:"🇫🇷"},
  ar:{name:"Arabic",native:"العربية",flag:"🇸🇦"},pt:{name:"Portuguese",native:"Português",flag:"🇧🇷"},
  de:{name:"German",native:"Deutsch",flag:"🇩🇪"},zh:{name:"Chinese",native:"中文",flag:"🇨🇳"},
  ja:{name:"Japanese",native:"日本語",flag:"🇯🇵"},ko:{name:"Korean",native:"한국어",flag:"🇰🇷"},
  ru:{name:"Russian",native:"Русский",flag:"🇷🇺"},id:{name:"Indonesian",native:"Bahasa Indonesia",flag:"🇮🇩"},
  tr:{name:"Turkish",native:"Türkçe",flag:"🇹🇷"},bn:{name:"Bengali",native:"বাংলা",flag:"🇧🇩"},
  ta:{name:"Tamil",native:"தமிழ்",flag:"🇮🇳"},te:{name:"Telugu",native:"తెలుగు",flag:"🇮🇳"},
  vi:{name:"Vietnamese",native:"Tiếng Việt",flag:"🇻🇳"},it:{name:"Italian",native:"Italiano",flag:"🇮🇹"},
  sw:{name:"Swahili",native:"Kiswahili",flag:"🇰🇪"},nl:{name:"Dutch",native:"Nederlands",flag:"🇳🇱"},
};

/* ── Chat modes ── */
const MODES = [
  { id:"CAREER",    label:"Career",    long:"Career Guidance", icon:"◎" },
  { id:"RESUME",    label:"Resume",    long:"ATS Resume",      icon:"▤" },
  { id:"INTERVIEW", label:"Interview", long:"Interview Prep",  icon:"◷" },
  { id:"SCORING",   label:"Score",     long:"Readiness Score", icon:"◈" },
];

/* ── ALL INDIVIDUAL FEATURE CARDS shown in welcome screen ── */
const INDIVIDUAL_FEATURES = [
  { key:"career",    icon:"◎", color:"#e8185d", bg:"#fff0f4", label:"Career AI",       desc:"Guidance, planning & career clarity",              mode:"CAREER",    body:"I need career guidance. Tell me about yourself and your current situation." },
  { key:"resume",    icon:"▤", color:"#7c3aed", bg:"#f5f3ff", label:"ATS Resume",      desc:"Build & optimise your resume for ATS",             mode:"RESUME",    body:"Help me build an ATS-optimised resume. Let's start — tell me your target role.", pro:true },
  { key:"skill_gap", icon:"◈", color:"#0284c7", bg:"#eff6ff", label:"Skill Gap",       desc:"Find the gap between you and your target role",    mode:"CAREER",    body:"Do a comprehensive skill gap analysis for me. Start by asking my current role, target role, and existing skills." },
  { key:"simulate",  icon:"⬡", color:"#d97706", bg:"#fff7ed", label:"Career Simulate", desc:"Model salary, timeline & risks of any career move",mode:"CAREER",    body:"I want to simulate a career transition. Ask me my current role and where I want to go — then model out realistic outcomes, salary impact, and timeline." },
  { key:"roadmap",   icon:"→", color:"#16a34a", bg:"#f0fdf4", label:"Roadmap",         desc:"Phase-by-phase career plan for your goal",         mode:"CAREER",    body:"Build a detailed career roadmap for me. Ask my goal, current situation, and preferred timeline to generate a phase-by-phase action plan." },
  { key:"interview", icon:"◷", color:"#e8185d", bg:"#fff0f4", label:"Interview Prep",  desc:"Mock interviews & preparation strategy",           mode:"INTERVIEW", body:"Let's do interview prep. Ask me what role I'm targeting and at which company.", pro:true },
  { key:"score",     icon:"◉", color:"#7c3aed", bg:"#f5f3ff", label:"Readiness Score", desc:"Score your career readiness with a 30-day plan",   mode:"SCORING",   body:"Score my career readiness. Ask me about my target role, current skills, and experience to give a detailed score with a 30-day improvement plan." },
  { key:"job_match", icon:"🔎", color:"#0284c7", bg:"#eff6ff", label:"Job Match",       desc:"Find real job openings matched to your profile",   mode:"CAREER",    body:"Find the best job roles matching my profile and search for live openings. Ask me about my background, skills, and target role.", yearly:true },
];

/* ── ALL BUSINESS FEATURE CARDS shown in welcome screen ── */
const BUSINESS_FEATURES = [
  { key:"jd",        icon:"▤", color:"#7c3aed", bg:"#f5f3ff", label:"JD Generator",     desc:"Full job descriptions + interview questions",       mode:"CAREER",    body:"Generate a comprehensive job description. Start by asking me: role title, company type, and experience level required." },
  { key:"hiring",    icon:"◎", color:"#e8185d", bg:"#fff0f4", label:"Hiring AI",         desc:"Skills, salary & full hiring strategy for any role",mode:"CAREER",    body:"Give me hiring intelligence for a role I'm filling. Ask me the role title, industry, and company stage to provide required skills, salary ranges, red flags, and hiring strategy." },
  { key:"team",      icon:"◈", color:"#0284c7", bg:"#eff6ff", label:"Team Skill Map",    desc:"Analyse team skills, find gaps, plan training",     mode:"CAREER",    body:"Map my team's skills and identify gaps. I'll describe my team members — you identify strengths, gaps, and prioritised training recommendations." },
  { key:"workforce", icon:"⬡", color:"#d97706", bg:"#fff7ed", label:"Workforce Plan",    desc:"Hiring roadmap based on your company stage & goals",mode:"CAREER",    body:"Create a workforce planning roadmap. Ask me: company stage, current team composition, and 12-month growth goals." },
  { key:"salary",    icon:"₹", color:"#16a34a", bg:"#f0fdf4", label:"Salary Benchmark",  desc:"Real Indian market salary data by experience tier", mode:"CAREER",    body:"Provide salary benchmarks. Ask me: role, experience level, city, and industry — then give comprehensive compensation ranges with percentiles." },
  { key:"interview", icon:"◷", color:"#0284c7", bg:"#eff6ff", label:"Interview AI",      desc:"Role-specific questions + evaluation rubric",        mode:"CAREER",    body:"Generate interview questions and an evaluation rubric. Ask me: role, experience level, and company type to create a complete interview kit." },
];

/* ── TOOL AUTO-TRIGGER MAP (URL param t= → auto-starts tool) ── */
const TOOL_AUTO = {
  skill_gap:  { mode:"CAREER",    label:"Skill Gap Analysis",  body:"Do a comprehensive skill gap analysis for me. Start by asking my current role, target role, and existing skills — then produce a clear gap analysis with a prioritised learning plan." },
  simulate:   { mode:"CAREER",    label:"Career Simulator",    body:"I want to simulate a career transition. Ask me my current role and where I want to go — model out realistic outcomes, salary impact, timeline, required skills, and success probability." },
  roadmap:    { mode:"CAREER",    label:"Career Roadmap",      body:"Build a detailed career roadmap for me. Ask me: career goal, current situation, and preferred timeline — then create a phase-by-phase action plan with milestones." },
  jd:         { mode:"CAREER",    label:"JD Generator",        body:"Generate a comprehensive job description. Ask me: role title, company type (startup/enterprise/etc), experience level, and any specific requirements — then produce a full JD with responsibilities, skills, salary range, and 10 interview questions." },
  hiring:     { mode:"CAREER",    label:"Hiring Intelligence", body:"Give me full hiring intelligence for a role. Ask me the role, industry, and company stage — then provide: required skills breakdown, salary ranges by experience, red flag behaviours to screen for, and complete hiring strategy." },
  team:       { mode:"CAREER",    label:"Team Skill Map",      body:"Map my team's skills. I'll provide each team member's name, role, and skills in any format. Analyse: individual strengths, collective gaps vs company goals, skill overlaps, and a prioritised training roadmap." },
  workforce:  { mode:"CAREER",    label:"Workforce Planning",  body:"Create a workforce planning roadmap. Ask me: company stage, current team (roles + headcount), and 12-month growth goals — then produce a phase-by-phase hiring plan with role priorities, budget guidance, and org structure recommendations." },
  salary:     { mode:"CAREER",    label:"Salary Benchmark",    body:"Provide salary benchmarks. Ask me: role, experience level (fresher/junior/mid/senior/lead), city, and industry — then give comprehensive compensation ranges with percentiles, variable pay, equity norms, and negotiation tips." },
  interview:  { mode:"CAREER",    label:"Interview AI",        body:"Generate a role-specific interview kit. Ask me: role, experience level, and company type — then produce: 5 screening questions, 8 technical/functional questions, 5 behavioral questions, 3 case/scenario questions, and an evaluation rubric with scoring criteria." },
};

/* ── Legacy quick tools ── */
const TOOLS = [
  { label:"ATS Resume",      mode:"RESUME",    body:"Build an ATS-optimised resume for me. Ask what I need first." },
  { label:"Career Roadmap",  mode:"CAREER",    body:"Create a detailed personalised career roadmap for my situation." },
  { label:"Readiness Score", mode:"SCORING",   body:"Give me a full career readiness score with strengths, gaps, and 30-day plan." },
  { label:"Mock Interview",  mode:"INTERVIEW", body:"Start a mock interview. Ask me the role I'm targeting first." },
  { label:"Optimise CV",     mode:"RESUME",    body:"Help me optimize my existing resume for ATS. I'll upload it." },
  { label:"Job Match",       mode:"CAREER",    body:"Analyse my profile and find the best matching job roles for me." },
  { label:"Skill Gap",       mode:"CAREER",    body:"Do a skill gap analysis based on my target role and current skills." },
  { label:"LinkedIn Tips",   mode:"CAREER",    body:"Help me optimize my LinkedIn profile to attract recruiters." },
];

const GREETINGS = [
  "Hey! I'm **GEN-E**, your AI career guide.\n\nWhat's your current situation — looking to grow, switch careers, or start fresh?",
  "Hi! Welcome to **GEN-E**.\n\nI help with career guidance, ATS resumes, interview prep, and career scoring. What's on your mind?",
  "Hello! I'm **GEN-E**.\n\nCareer clarity starts here. Are you exploring new opportunities, building your resume, or prepping for interviews?",
];

/* ── Utils ── */
const isGreeting = m => /^(hi+|hello+|hey+|sup|yo|howdy)\s*[!.]?\s*$/i.test(m.trim());
const isImgExt   = n => [".png",".jpg",".jpeg",".webp",".gif"].includes(n.slice(n.lastIndexOf(".")).toLowerCase());
const uid        = () => `c-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
const freshChat  = (mode="CAREER") => ({ id:uid(), title:"New Chat", mode, messages:[], history:[] });

/* ── Wake server ── */
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

/* ── html2canvas lazy load ── */
let _h2c = null;
async function getHtml2Canvas() {
  if (_h2c) return _h2c;
  return new Promise((res,rej) => {
    if (window.html2canvas){_h2c=window.html2canvas;res(window.html2canvas);return;}
    if (document.getElementById("h2c-script")){const iv=setInterval(()=>{if(window.html2canvas){clearInterval(iv);_h2c=window.html2canvas;res(window.html2canvas);}},50);return;}
    const s=document.createElement("script");s.id="h2c-script";
    s.src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    s.onload=()=>{_h2c=window.html2canvas;res(window.html2canvas);};
    s.onerror=()=>rej(new Error("html2canvas failed"));
    document.head.appendChild(s);
  });
}

/* ═══════════════════ SMALL COMPONENTS ═══════════════════ */

function PlanBadge({ plan }) {
  const map = { free:["Free","#aaa"], monthly:["Pro",PINK], yearly:["Pro ✦","#7c3aed"], admin:["Admin ✦","#7c3aed"] };
  const [label,color] = map[plan]||map.free;
  return <span style={{fontSize:10,fontWeight:700,color,letterSpacing:"0.04em"}}>{label}</span>;
}

function SaveResumeModal({ defaultText, saving, onClose, onSave }) {
  const [title,setTitle] = useState("My Resume");
  const [role,setRole]   = useState("");
  const [company,setCompany] = useState("");
  const inp = { width:"100%",padding:"9px 12px",border:"1.5px solid #e8ecf0",borderRadius:9,fontSize:13,outline:"none",fontFamily:"inherit",transition:"border 0.15s",boxSizing:"border-box",background:"#fafbfc" };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:900,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#fff",borderRadius:18,padding:"28px 24px",maxWidth:380,width:"100%",boxShadow:"0 32px 80px rgba(0,0,0,0.2)"}}>
        <div style={{fontWeight:800,fontSize:17,color:"#111",marginBottom:4}}>💾 Save to Resume Vault</div>
        <div style={{fontSize:12.5,color:"#aaa",marginBottom:20}}>Name this version so you can find it later.</div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {[["Resume Title *",title,setTitle,"e.g. Resume v1 — TCS"],["Target Role (optional)",role,setRole,"e.g. Software Engineer"],["Target Company (optional)",company,setCompany,"e.g. Google, TCS, any startup"]].map(([lbl,val,set,ph])=>(
            <div key={lbl}>
              <label style={{fontSize:11.5,fontWeight:600,color:"#555",display:"block",marginBottom:4}}>{lbl}</label>
              <input value={val} onChange={e=>set(e.target.value)} placeholder={ph} style={inp}
                onFocus={e=>e.target.style.borderColor=PINK} onBlur={e=>e.target.style.borderColor="#e8ecf0"}/>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:10,marginTop:20}}>
          <button onClick={onClose} style={{flex:1,padding:"10px 0",background:"#f5f7fa",border:"none",borderRadius:9,fontWeight:600,fontSize:13,color:"#888",cursor:"pointer"}}>Cancel</button>
          <button onClick={()=>onSave({title:title||"My Resume",target_role:role,target_company:company,content_md:defaultText})} disabled={saving||!title.trim()}
            style={{flex:2,padding:"10px 0",background:saving?"#f0f0f0":PINK,border:"none",borderRadius:9,fontWeight:700,fontSize:13,color:saving?"#aaa":"#fff",cursor:saving?"wait":"pointer"}}>
            {saving?"Saving…":"Save Resume →"}
          </button>
        </div>
      </div>
    </div>
  );
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
          <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,zIndex:201,background:"#fff",borderRadius:13,boxShadow:"0 8px 40px rgba(0,0,0,0.12)",border:"1px solid #f0f0f0",padding:"8px 6px",width:210,maxHeight:320,overflowY:"auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:2}}>
            <div style={{gridColumn:"1/-1",fontSize:10,fontWeight:700,color:"#bbb",letterSpacing:"0.08em",textTransform:"uppercase",padding:"2px 6px 6px"}}>Choose language</div>
            {Object.entries(LANGUAGES).map(([code,l])=>(
              <button key={code} onClick={()=>{localStorage.setItem("gene-lang",code);setLang(code);setOpen(false);}}
                style={{background:lang===code?"#fff0f4":"none",border:lang===code?"1px solid #fcc":"1px solid transparent",borderRadius:7,padding:"6px 8px",cursor:"pointer",display:"flex",alignItems:"center",gap:6,textAlign:"left"}}
                onMouseEnter={e=>{if(lang!==code)e.currentTarget.style.background="#f9f9f9";}}
                onMouseLeave={e=>{if(lang!==code)e.currentTarget.style.background="none";}}>
                <span style={{fontSize:14}}>{l.flag}</span>
                <div>
                  <div style={{fontSize:11.5,fontWeight:lang===code?700:500,color:lang===code?PINK:"#333"}}>{l.native}</div>
                  <div style={{fontSize:10,color:"#aaa"}}>{l.name}</div>
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
    limit:{icon:"⚡",title:"Free limit reached",plan:"Pro Monthly or Yearly",cta:"View Plans →",body:`You've used all ${LIMIT} free questions. Upgrade to Pro for unlimited career guidance.`},
    resume_builder:{icon:"📄",title:"Pro Feature — ATS Resume Builder",plan:"Pro Monthly (₹99/mo) or Yearly (₹699/yr)",cta:"Upgrade to Pro →",body:"Building an ATS-optimised resume is available on Pro plans."},
    resume_review:{icon:"🔍",title:"Pro Feature — Resume Review",plan:"Pro Monthly (₹99/mo) or Yearly (₹699/yr)",cta:"Upgrade to Pro →",body:"Uploading and analysing your resume is a Pro feature."},
    interview_advanced:{icon:"🎯",title:"Pro Feature — Advanced Interview Prep",plan:"Pro Monthly (₹99/mo) or Yearly (₹699/yr)",cta:"Upgrade to Pro →",body:"Full interview prep with role-specific questions is available on Pro plans."},
    job_search:{icon:"🔎",title:"Yearly Plan — Job Match",plan:"Pro Yearly only (₹699/yr)",cta:"Get Pro Yearly →",body:"Live job matching is exclusive to the Pro Yearly plan."},
  };
  const copy = COPY[feature]||COPY.limit;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:900,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#fff",borderRadius:22,padding:"36px 32px",maxWidth:380,width:"100%",textAlign:"center",boxShadow:"0 32px 80px rgba(0,0,0,0.2)"}}>
        <div style={{fontSize:36,marginBottom:12}}>{copy.icon}</div>
        <div style={{fontWeight:800,fontSize:19,color:"#111",marginBottom:8,letterSpacing:"-0.02em",lineHeight:1.3}}>{copy.title}</div>
        <div style={{fontSize:13.5,color:"#666",lineHeight:1.7,marginBottom:8}}>{copy.body}</div>
        <div style={{display:"inline-block",fontSize:11,fontWeight:700,color:PINK,background:"#fff0f4",padding:"4px 12px",borderRadius:20,marginBottom:24,border:"1px solid #fcc"}}>{copy.plan}</div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:"11px 0",background:"#f5f7fa",border:"none",borderRadius:11,fontWeight:600,fontSize:13,color:"#888",cursor:"pointer"}}>Not now</button>
          <button onClick={onUpgrade} style={{flex:2,padding:"11px 0",background:PINK,border:"none",borderRadius:11,fontWeight:700,fontSize:13,color:"#fff",cursor:"pointer"}}>{copy.cta}</button>
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

/* ═══════════════════ FEATURE CARD (welcome screen) ═══════════════════ */
function FeatureCard({ f, plan, onTrigger }) {
  const isAdmin = plan === "admin";
  const locked  = !isAdmin && (
    (f.pro    && plan === "free") ||
    (f.yearly && plan !== "yearly")
  );
  return (
    <button onClick={() => locked ? null : onTrigger(f)}
      style={{
        padding:"14px 15px", borderRadius:13, border:"1.5px solid #edf0f3",
        background:"#fff", cursor:locked?"default":"pointer", textAlign:"left",
        transition:"all 0.16s", fontFamily:"'Plus Jakarta Sans',sans-serif",
        boxShadow:"0 1px 3px rgba(0,0,0,0.04)",
        opacity: locked ? 0.55 : 1,
      }}
      onMouseEnter={e=>{ if(!locked){ e.currentTarget.style.borderColor=f.color+"50"; e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow=`0 6px 20px ${f.color}12`; }}}
      onMouseLeave={e=>{ e.currentTarget.style.borderColor="#edf0f3"; e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="0 1px 3px rgba(0,0,0,0.04)"; }}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{width:32,height:32,borderRadius:9,background:f.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:f.color,flexShrink:0}}>{f.icon}</div>
        {locked && <span style={{fontSize:10,color:"#ccc"}}>🔒</span>}
        {f.pro    && !locked && <span style={{fontSize:9.5,fontWeight:700,color:f.color,background:f.bg,padding:"2px 7px",borderRadius:5,border:`1px solid ${f.color}30`}}>Pro</span>}
        {f.yearly && !locked && <span style={{fontSize:9.5,fontWeight:700,color:f.color,background:f.bg,padding:"2px 7px",borderRadius:5,border:`1px solid ${f.color}30`}}>Yearly</span>}
      </div>
      <div style={{fontSize:13,fontWeight:700,color:"#111",marginBottom:3}}>{f.label}</div>
      <div style={{fontSize:11.5,color:"#9ca3af",lineHeight:1.5}}>{f.desc}</div>
    </button>
  );
}

/* ═══════════════════ MAIN COMPONENT ═══════════════════ */
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
  const [searchQ,    setSearchQ]    = useState("");
  const [upgrade,    setUpgrade]    = useState(false);
  const [lang,       setLang]       = useState(()=>localStorage.getItem("gene-lang")||"en");
  const [langOpen,   setLangOpen]   = useState(false);
  const [saveModal,  setSaveModal]  = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [ctx,        setCtx]        = useState(null);
  const [renaming,   setRenaming]   = useState(null);
  const [editIdx,    setEditIdx]    = useState(null);
  const [editText,   setEditText]   = useState("");

  const bottomRef   = useRef(null);
  const inputRef    = useRef(null);
  const saveTimer   = useRef(null);
  const pendingTool = useRef(null); // queued tool from URL param
  const active      = chats.find(c => c.id === activeId);
  const isBusinessUser = profile?.user_type === "business";

  /* ── Auth & load ── */
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
    // Capture tool param before clearing URL
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

  useEffect(()=>{const h=()=>{if(user)loadProfile(user.id);};window.addEventListener("focus",h);return()=>window.removeEventListener("focus",h);},[user]);
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[active?.messages,busy]);
  useEffect(()=>{const h=()=>setCtx(null);document.addEventListener("click",h);return()=>document.removeEventListener("click",h);},[]);

  /* ── Auto-trigger tool after loading completes ── */
  const isLoading = loading.profile || loading.chats;
  useEffect(() => {
    if (!isLoading && pendingTool.current) {
      const toolKey = pendingTool.current;
      pendingTool.current = null;
      const trigger = TOOL_AUTO[toolKey];
      if (!trigger) return;
      // Clear the URL param
      setSearchParams({}, { replace: true });
      // Create a new chat and auto-send
      const c = freshChat(trigger.mode);
      c.title = trigger.label;
      setChats(prev => [c, ...prev]);
      setActiveId(c.id);
      setMode(trigger.mode);
      setTimeout(() => send(trigger.body, c.id, trigger.mode, null), 200);
    }
  }, [isLoading]);

  /* ── Persistence ── */
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

  /* ── Chat actions ── */
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

  /* ── Helpers ── */
  const canSend = () => {
    if (!profile) return false;
    if (["admin","monthly","yearly"].includes(profile.plan)) return true;
    return (profile.questions_used||0) < LIMIT;
  };

  const getToken = async () => {
    const {data:{session}} = await supabase.auth.getSession();
    return session?.access_token||null;
  };

  const fetchWithTimeout = async (url,options={},ms=60000) => {
    const ctl = new AbortController();
    const t = setTimeout(()=>ctl.abort(),ms);
    try { const r=await fetch(url,{...options,signal:ctl.signal}); clearTimeout(t); return r; }
    catch(e){ clearTimeout(t); throw e; }
  };

  /* ── Download resume as image ── */
  const downloadResumeImage = async (txt) => {
    try {
      const h2c = await getHtml2Canvas();
      const wrap = document.createElement("div");
      wrap.style.cssText = "position:fixed;left:-9999px;top:0;width:800px;padding:52px 60px;background:#fff;font-family:Inter,sans-serif;color:#222;font-size:13px;line-height:1.75;";
      const html = txt
        .replace(/^## (.+)$/gm,'<h2 style="color:#e8185d;font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;margin:20px 0 5px;padding-bottom:5px;border-bottom:1.5px solid #ffe0e9">$1</h2>')
        .replace(/^### (.+)$/gm,'<h3 style="font-size:13px;font-weight:700;color:#111;margin:12px 0 3px">$1</h3>')
        .replace(/\*\*(.+?)\*\*/g,'<strong style="font-weight:700;color:#111">$1</strong>')
        .replace(/^[•\-] (.+)$/gm,'<div style="padding:1.5px 0 1.5px 16px;color:#333">&bull; $1</div>')
        .replace(/\n/g,"<br/>");
      wrap.innerHTML = '<div style="text-align:center;margin-bottom:32px;padding-bottom:20px;border-bottom:2px solid #f0f0f0"><div style="font-size:24px;font-weight:900;letter-spacing:-0.04em;color:#111">GEN<span style="color:#e8185d">-E</span></div><div style="font-size:10px;color:#aaa;margin-top:3px;letter-spacing:0.06em;text-transform:uppercase">AI-Generated Resume</div></div>'+html;
      document.body.appendChild(wrap);
      const canvas = await h2c(wrap,{scale:2,useCORS:true,backgroundColor:"#fff"});
      document.body.removeChild(wrap);
      const a=document.createElement("a"); a.download="resume-gene.png"; a.href=canvas.toDataURL("image/png"); a.click();
    } catch(e){alert("Image export failed: "+e.message);}
  };

  /* ── Save resume to vault ── */
  const saveResume = async ({title,target_role,target_company,content_md}) => {
    setSaving(true);
    try {
      const {data:{session}} = await supabase.auth.getSession();
      const res = await fetch(`${API}/api/resumes`,{method:"POST",headers:{"Content-Type":"application/json",...(session?{Authorization:`Bearer ${session.access_token}`}:{})},body:JSON.stringify({title,target_role,target_company,content_md})});
      const data = await res.json();
      if (res.status===403){setUpgrade("resume_builder");setSaveModal(null);return;}
      if (!res.ok) throw new Error(data.detail||data.error||"Save failed");
      setSaveModal(null); setSavedToast(true); setTimeout(()=>setSavedToast(false),3000);
    } catch(e){alert("Could not save: "+e.message);}
    finally{setSaving(false);}
  };

  /* ── Edit messages ── */
  const startEdit  = (i,t) => { setEditIdx(i); setEditText(t); };
  const cancelEdit = ()    => { setEditIdx(null); setEditText(""); };
  const saveEdit   = async (cid,i) => {
    const txt=editText.trim(); if(!txt) return;
    cancelEdit();
    patch(cid,c=>({...c,messages:c.messages.slice(0,i),history:c.history.slice(0,i)}));
    await send(txt,cid,mode,null);
  };

  const stageFile = file => {
    if(!file) return; setShowAttach(false);
    if((profile?.plan||"free")==="free"){setUpgrade("resume_review");return;}
    const s={file,name:file.name,size:file.size,previewUrl:null};
    if(isImgExt(file.name)){const r=new FileReader();r.onload=e=>setStaged({...s,previewUrl:e.target.result});r.readAsDataURL(file);}
    else setStaged(s);
    setTimeout(()=>inputRef.current?.focus(),80);
  };

  /* ═══════ CORE SEND ═══════ */
  const send = async (txt=input, chatId=activeId, chatMode=mode, stagedArg=staged) => {
    const msg=txt.trim();
    if((!msg&&!stagedArg)||busy) return;
    if(!canSend()){setUpgrade("limit");return;}
    setInput(""); setStaged(null);

    /* File upload */
    if(stagedArg){
      const userText=msg?`${isImgExt(stagedArg.name)?"🖼️":"📄"} **${stagedArg.name}**\n\n${msg}`:`${isImgExt(stagedArg.name)?"🖼️":"📄"} Uploaded: **${stagedArg.name}**`;
      patch(chatId,c=>({...c,messages:[...c.messages,{role:"user",text:userText,imagePreview:isImgExt(stagedArg.name)?stagedArg.previewUrl:null}]}));
      setBusy(true);
      try {
        const token=await getToken(); await wakeServer();
        const fd=new FormData(); fd.append("file",stagedArg.file); if(msg)fd.append("note",msg);
        const res=await fetchWithTimeout(`${API}/api/upload`,{method:"POST",body:fd,headers:token?{Authorization:`Bearer ${token}`}:{}},90000);
        let data; try{data=await res.json();}catch{data={reply:"Unexpected response. Try again."};}
        if(res.status===403&&data.gate){patch(chatId,c=>({...c,messages:c.messages.slice(0,-1)}));setUpgrade(data.gate);setBusy(false);return;}
        const replyText=data.reply||data.error||"Upload failed — try again.";
        patch(chatId,c=>({...c,messages:[...c.messages,{role:"assistant",text:replyText}],history:[...c.history,{role:"user",content:msg?`[FILE: ${stagedArg.name}] ${msg}`:`[FILE: ${stagedArg.name}]`},{role:"assistant",content:replyText}]}));
      } catch(err){
        const errMsg=err.name==="AbortError"?"⏳ Server is waking up. Wait 30 seconds and try again.":"Upload failed. Check your connection.";
        patch(chatId,c=>({...c,messages:[...c.messages,{role:"assistant",text:errMsg}]}));
      } finally{setBusy(false);}
      return;
    }

    /* Text path */
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
      if(res.status===403){const d=await res.json().catch(()=>({}));patch(chatId,c=>({...c,messages:c.messages.filter(m=>!m.streaming).slice(0,-1)}));if(d.error==="limit_reached"){setUpgrade(true);setBusy(false);return;}}
      if(!res.ok||!res.body) throw new Error("Server error "+res.status);
      const reader=res.body.getReader(); const decoder=new TextDecoder();
      let fullText="",pdfLink=null,jobCards=null,wasGated=false;
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
            if(p.done) pdfLink=p.pdf||null;
            if(p.error) fullText=p.error;
          }catch{}
        }
      }
      if(wasGated) return;
      patch(chatId,c=>({...c,messages:c.messages.map(m=>m.streaming?{role:"assistant",text:fullText||"No response. Try again.",pdf:pdfLink,jobs:jobCards}:m),history:[...c.history,{role:"assistant",content:fullText}]}));
      if(profile?.plan==="free") setProfile(p=>p?{...p,questions_used:(p.questions_used||0)+1}:p);
    } catch(err){
      patch(chatId,c=>({...c,messages:c.messages.filter(m=>!m.streaming).concat([{role:"assistant",text:"⚠️ Could not reach server. Please try again.\n\n*("+err.message+")*"}])}));
    } finally{setBusy(false);}
  };

  const sendTool = async tool => {
    if(!canSend()){setUpgrade("limit");return;}
    const p=profile?.plan||"free"; const isAdmin=p==="admin";
    if(!isAdmin&&tool.mode==="RESUME"&&p==="free"){setUpgrade("resume_builder");return;}
    if(!isAdmin&&tool.mode==="INTERVIEW"&&p==="free"){setUpgrade("interview_advanced");return;}
    if(!isAdmin&&tool.label==="Job Match"&&p!=="yearly"){setUpgrade("job_search");return;}
    const c=freshChat(tool.mode);
    setChats(prev=>[c,...prev]); setActiveId(c.id); setMode(tool.mode); setSidebarOpen(false);
    setTimeout(()=>send(tool.body,c.id,tool.mode,null),80);
  };

  /* Trigger a feature from welcome screen card */
  const triggerFeature = (f) => {
    const p = profile?.plan || "free"; const isAdmin = p === "admin";
    if (!isAdmin && f.pro    && p === "free")    { setUpgrade("resume_builder"); return; }
    if (!isAdmin && f.yearly && p !== "yearly")  { setUpgrade("job_search");    return; }
    const c = freshChat(f.mode);
    setChats(prev=>[c,...prev]); setActiveId(c.id); setMode(f.mode);
    setTimeout(()=>send(f.body,c.id,f.mode,null),80);
  };

  const handleSignOut = async () => {
    localStorage.removeItem("gene-mode-override");
    await supabase.auth.signOut();
    window.location.href = "https://nugens.in.net/auth";
  };

  /* ── Chat sidebar grouping ── */
  const groupedChats = (()=>{
    const now=new Date(),today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
    const yday=new Date(+today-864e5),w7=new Date(+today-6*864e5),m30=new Date(+today-29*864e5);
    const g={"Today":[],"Yesterday":[],"Last 7 days":[],"Last 30 days":[],"Older":[]};
    chats.filter(c=>c.title.toLowerCase().includes(searchQ.toLowerCase())).forEach(c=>{
      const d=new Date(parseInt(c.id.split("-")[1])||0);
      if(d>=today)g["Today"].push(c); else if(d>=yday)g["Yesterday"].push(c);
      else if(d>=w7)g["Last 7 days"].push(c); else if(d>=m30)g["Last 30 days"].push(c);
      else g["Older"].push(c);
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

  /* ── INTERNAL SIDEBAR (chat history) ── */
  const ChatSidebar = () => (
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:"#fff",borderRight:"1px solid #f0f0f0",overflow:"hidden"}}>

      {/* Header */}
      <div style={{padding:"14px 14px 10px",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <div style={{fontWeight:800,fontSize:16,color:"#111",letterSpacing:"-0.03em"}}>GEN<span style={{color:PINK}}>-E</span></div>
          <button onClick={newChat} title="New chat"
            style={{width:28,height:28,borderRadius:8,border:"1.5px solid #edf0f3",background:"#fff",cursor:"pointer",fontSize:16,color:"#ccc",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1,transition:"all 0.12s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=PINK;e.currentTarget.style.color=PINK;e.currentTarget.style.background="#fff0f4";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="#edf0f3";e.currentTarget.style.color="#ccc";e.currentTarget.style.background="#fff";}}>
            +
          </button>
        </div>
        <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search chats…"
          style={{width:"100%",padding:"7px 11px",background:"#f8fafb",border:"1px solid #edf0f3",borderRadius:9,fontSize:12.5,color:"#555",outline:"none"}}/>
      </div>

      {/* Chat list */}
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
                    <button onClick={e=>{e.stopPropagation();setCtx({x:e.clientX,y:e.clientY,id:chat.id});}}
                      style={{opacity:0,background:"none",border:"none",color:"#ccc",cursor:"pointer",fontSize:14,padding:"0 2px",flexShrink:0,borderRadius:4,lineHeight:1}} className="row-more">⋯</button>
                  </div>
                );
              })}
            </div>
          );
        })}
        {!Object.values(groupedChats).some(g=>g.length) && (
          <div style={{padding:"32px 12px",textAlign:"center",color:"#ddd",fontSize:12}}>
            No chats yet.<br/>
            <button onClick={newChat} style={{color:PINK,background:"none",border:"none",cursor:"pointer",fontSize:12,fontWeight:600,marginTop:4}}>Start one →</button>
          </div>
        )}
      </div>

      {/* Quick tools footer */}
      <div style={{padding:"10px 12px 6px",borderTop:"1px solid #f5f7fa",flexShrink:0}}>
        {/* Nav links */}
        <div style={{display:"flex",flexDirection:"column",gap:3,marginBottom:10}}>
          {[
            {icon:"📄",label:"Resume Vault",path:"/resumes",pro:true},
            {icon:"📊",label:"Job Tracker",path:"/jobs",pro:false},
          ].map(item=>{
            const locked=item.pro&&(profile?.plan||"free")==="free";
            return (
              <button key={item.path} onClick={()=>locked?setUpgrade("resume_builder"):nav(item.path)}
                style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:"none",border:"1.5px solid #edf0f3",borderRadius:9,cursor:"pointer",textAlign:"left",fontSize:12,color:locked?"#ccc":"#555",fontWeight:500,transition:"all 0.12s"}}
                onMouseEnter={e=>{if(!locked){e.currentTarget.style.background="#fff0f4";e.currentTarget.style.borderColor="#fcc";e.currentTarget.style.color=PINK;}}}
                onMouseLeave={e=>{if(!locked){e.currentTarget.style.background="none";e.currentTarget.style.borderColor="#edf0f3";e.currentTarget.style.color="#555";}}}>
                <span>{item.icon}</span><span>{item.label}</span>
                {locked&&<span style={{marginLeft:"auto",fontSize:10}}>🔒</span>}
              </button>
            );
          })}
        </div>

        <div style={{fontSize:10,fontWeight:700,color:"#d0d5dd",letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:6}}>Quick Tools</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
          {TOOLS.slice(0,6).map(t=>{
            const tp=profile?.plan||"free";
            const locked=((t.mode==="RESUME"||t.mode==="INTERVIEW")&&tp==="free")||(t.label==="Job Match"&&tp!=="yearly");
            return (
              <button key={t.label} onClick={()=>sendTool(t)}
                style={{padding:"7px 9px",borderRadius:8,border:"1.5px solid #edf0f3",background:"#fff",cursor:"pointer",textAlign:"left",fontSize:11.5,color:locked?"#ccc":"#555",fontWeight:500,transition:"all 0.12s"}}
                onMouseEnter={e=>{if(!locked){e.currentTarget.style.background="#fff0f4";e.currentTarget.style.borderColor="#fcc";e.currentTarget.style.color=PINK;}}}
                onMouseLeave={e=>{if(!locked){e.currentTarget.style.background="#fff";e.currentTarget.style.borderColor="#edf0f3";e.currentTarget.style.color="#555";}}}>
                {t.label}{locked?" 🔒":""}
              </button>
            );
          })}
        </div>
      </div>

      {/* User */}
      <div style={{padding:"10px 12px 14px",borderTop:"1px solid #f5f7fa",flexShrink:0}}>
        {profile?.plan==="free" && (
          <div style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10.5,color:"#d0d5dd",marginBottom:4}}>
              <span>{profile.questions_used||0} / {LIMIT} questions</span>
              <span style={{color:(profile.questions_used||0)>=18?PINK:"#d0d5dd"}}>{Math.max(0,LIMIT-(profile.questions_used||0))} left</span>
            </div>
            <div style={{height:3,background:"#f0f2f5",borderRadius:4}}>
              <div style={{height:3,borderRadius:4,background:`linear-gradient(90deg,${PINK},#c4134e)`,width:`${Math.min(100,((profile.questions_used||0)/LIMIT)*100)}%`,transition:"width 0.4s"}}/>
            </div>
            <button onClick={()=>nav("/pricing")} style={{marginTop:8,width:"100%",padding:"7px 0",background:`linear-gradient(135deg,${PINK},#c4134e)`,border:"none",borderRadius:9,fontSize:11.5,color:"#fff",cursor:"pointer",fontWeight:700,boxShadow:`0 4px 12px ${PINK}30`}}>
              Upgrade to Pro
            </button>
          </div>
        )}
        {(()=>{
          const displayName=profile?.full_name||user?.user_metadata?.full_name||user?.user_metadata?.name||user?.email?.split("@")[0]||"Me";
          const initial=displayName.charAt(0).toUpperCase();
          const planLabel=profile?.plan==="admin"?"Admin ✦":profile?.plan==="yearly"?"Pro ✦":profile?.plan==="monthly"?"Pro":"Free";
          const planColor=["admin","yearly"].includes(profile?.plan)?"#7c3aed":profile?.plan==="monthly"?PINK:"#bbb";
          return (
            <div style={{display:"flex",alignItems:"center",gap:9}}>
              <div style={{width:32,height:32,borderRadius:"50%",flexShrink:0,background:profile?.avatar_url?"transparent":`${PINK}15`,border:`2px solid ${PINK}25`,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}}>
                {profile?.avatar_url?<img src={profile.avatar_url} style={{width:32,height:32,objectFit:"cover"}} alt={displayName}/>:<span style={{fontSize:12,fontWeight:800,color:PINK}}>{initial}</span>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12.5,fontWeight:700,color:"#1a1a1a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{displayName}</div>
                <span style={{fontSize:10,fontWeight:700,color:planColor,letterSpacing:"0.03em"}}>{planLabel}</span>
              </div>
              <div style={{display:"flex",gap:4}}>
                {profile?.plan!=="free"&&profile?.plan!=="admin"&&(
                  <button onClick={()=>nav("/pricing")} title="Manage plan" style={{fontSize:11,color:"#ccc",background:"none",border:"none",cursor:"pointer",padding:"4px 6px",borderRadius:6}} onMouseEnter={e=>e.currentTarget.style.color=PINK} onMouseLeave={e=>e.currentTarget.style.color="#ccc"}>Plan</button>
                )}
                <button onClick={handleSignOut} title="Sign out" style={{fontSize:11,color:"#ccc",background:"none",border:"none",cursor:"pointer",padding:"4px 6px",borderRadius:6}} onMouseEnter={e=>e.currentTarget.style.color="#e55"} onMouseLeave={e=>e.currentTarget.style.color="#ccc"}>Out</button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );

  /* ═══════════════════ RENDER ═══════════════════ */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body,#root{height:100%;font-family:'Plus Jakarta Sans',sans-serif;background:#fff;color:#111}

        .sb-scroll::-webkit-scrollbar{width:0}
        .sb-scroll:hover::-webkit-scrollbar{width:3px}
        .sb-scroll::-webkit-scrollbar-thumb{background:#eee;border-radius:4px}
        .chat-scroll::-webkit-scrollbar{width:5px}
        .chat-scroll::-webkit-scrollbar-thumb{background:#f0f0f0;border-radius:4px}
        div:hover > span + .row-more { opacity: 1 !important; }

        .md-ai p{margin-bottom:9px;line-height:1.75;font-size:14px;color:#374151}
        .md-ai p:last-child{margin-bottom:0}
        .md-ai h2{font-size:11px;font-weight:700;color:${PINK};margin:16px 0 6px;text-transform:uppercase;letter-spacing:0.07em;padding-bottom:6px;border-bottom:1px solid ${PINK}18}
        .md-ai h3{font-size:13.5px;font-weight:700;color:#111;margin:13px 0 5px}
        .md-ai ul,.md-ai ol{padding-left:20px;margin-bottom:9px}
        .md-ai li{margin-bottom:5px;line-height:1.65;font-size:14px;color:#374151}
        .md-ai strong{color:#111;font-weight:700}
        .md-ai em{color:#6b7280}
        .md-ai code{background:#fef2f4;color:${PINK};padding:2px 6px;border-radius:5px;font-size:12.5px;font-family:monospace}
        .md-ai pre{background:#f9fafb;border:1px solid #f3f4f6;border-radius:9px;padding:12px 14px;overflow-x:auto;margin:8px 0}
        .md-ai pre code{background:none;padding:0;color:#374151}
        .md-ai hr{border:none;border-top:1px solid #f3f4f6;margin:14px 0}
        .md-ai table{width:100%;border-collapse:collapse;margin:10px 0;font-size:13px}
        .md-ai th{background:#fef2f4;color:${PINK};padding:8px 11px;text-align:left;font-weight:700;border:1px solid #fcd5de}
        .md-ai td{padding:7px 11px;border:1px solid #f3f4f6;color:#374151}
        .md-ai blockquote{border-left:3px solid ${PINK};padding:6px 13px;color:#6b7280;margin:9px 0;background:#fef9fb;border-radius:0 8px 8px 0}

        .md-user p{margin:0;line-height:1.65;font-size:14px}
        .md-user strong{color:#fff;font-weight:700}
        .md-user code{background:rgba(255,255,255,0.22);padding:1px 5px;border-radius:4px;font-size:12px}

        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .msg-in{animation:fadeUp 0.2s ease}
        @keyframes blink{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}
        .d1{animation:blink 1.2s infinite}
        .d2{animation:blink 1.2s 0.2s infinite}
        .d3{animation:blink 1.2s 0.4s infinite}
        @keyframes cur{0%,100%{opacity:1}50%{opacity:0}}
        .streaming-msg::after{content:"▋";color:${PINK};animation:cur 0.7s infinite;margin-left:2px;font-size:13px}
        .msg-wrap:hover .edit-btn{opacity:1!important}
        .edit-btn:hover{color:${PINK}!important}

        .desktop-sb{display:flex}
        .mob-btn{display:none!important}
        .sb-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.35);z-index:199;backdrop-filter:blur(2px)}
        .sb-overlay.open{display:block}
        .sb-drawer{position:fixed;top:0;left:0;height:100%;width:252px;z-index:200;transform:translateX(-100%);transition:transform 0.22s ease;box-shadow:4px 0 32px rgba(0,0,0,0.1)}
        .sb-drawer.open{transform:translateX(0)}
        @media(max-width:720px){.desktop-sb{display:none!important}.mob-btn{display:flex!important}}
      `}</style>

      {/* Modals & Toasts */}
      {upgrade && <UpgradeModal feature={upgrade} onClose={()=>setUpgrade(false)} onUpgrade={()=>{setUpgrade(false);nav("/pricing");}}/>}
      {saveModal && <SaveResumeModal defaultText={saveModal.text} saving={saving} onClose={()=>setSaveModal(null)} onSave={saveResume}/>}
      {savedToast && (
        <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:"#15803d",color:"#fff",padding:"10px 20px",borderRadius:11,fontSize:13,fontWeight:700,zIndex:999,boxShadow:"0 4px 20px rgba(21,128,61,0.3)",display:"flex",alignItems:"center",gap:8}}>
          ✅ Resume saved!
          <button onClick={()=>nav("/resumes")} style={{background:"none",border:"none",color:"#fff",textDecoration:"underline",cursor:"pointer",fontSize:13}}>View →</button>
        </div>
      )}
      {renaming && <RenameModal chat={chats.find(c=>c.id===renaming)} onSave={t=>renameChat(renaming,t)} onClose={()=>setRenaming(null)}/>}
      {ctx && <CtxMenu x={ctx.x} y={ctx.y} onRename={()=>setRenaming(ctx.id)} onDelete={()=>deleteChat(ctx.id)} onClose={()=>setCtx(null)}/>}

      <div style={{display:"flex",height:"100vh",overflow:"hidden"}}>

        {/* Desktop sidebar */}
        <aside className="desktop-sb" style={{width:252,flexShrink:0,flexDirection:"column",overflow:"hidden"}}>
          <ChatSidebar/>
        </aside>

        {/* Mobile drawer */}
        <div className={`sb-overlay ${sidebarOpen?"open":""}`} onClick={()=>setSidebarOpen(false)}/>
        <div className={`sb-drawer ${sidebarOpen?"open":""}`}><ChatSidebar/></div>

        {/* ─── MAIN AREA ─── */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>

          {/* Topbar */}
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"0 20px",height:54,borderBottom:"1px solid #f0f2f5",background:"rgba(255,255,255,0.95)",backdropFilter:"blur(8px)",flexShrink:0}}>
            <button className="mob-btn" onClick={()=>setSidebarOpen(true)}
              style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#bbb",padding:"4px",display:"none",alignItems:"center"}}>☰</button>
            <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0}}>
              <span style={{fontSize:12,fontWeight:700,color:PINK,background:`${PINK}0c`,padding:"3px 10px",borderRadius:20,border:`1px solid ${PINK}20`,flexShrink:0,letterSpacing:"0.01em"}}>
                {curMode?.long}
              </span>
              <span style={{fontSize:13,color:"#c0c6d0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{active?.title||"New Chat"}</span>
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
              {profile?.plan==="free"?(
                <button onClick={()=>nav("/pricing")} style={{padding:"4px 11px",background:`${PINK}0c`,border:`1px solid ${PINK}20`,borderRadius:20,fontSize:11,color:PINK,cursor:"pointer",fontWeight:700}}>
                  {Math.max(0,LIMIT-(profile.questions_used||0))} left
                </button>
              ):profile?.plan==="admin"?(
                <span style={{fontSize:10,fontWeight:800,color:"#7c3aed",letterSpacing:"0.04em",background:"#f5f3ff",padding:"3px 9px",borderRadius:20}}>Admin ✦</span>
              ):<PlanBadge plan={profile?.plan}/>}
              <LanguagePicker lang={lang} setLang={setLang} open={langOpen} setOpen={setLangOpen}/>
              <button onClick={newChat} title="New chat"
                style={{width:30,height:30,background:"#f8fafb",border:"1.5px solid #edf0f3",borderRadius:9,cursor:"pointer",color:"#bbb",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1,transition:"all 0.13s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=PINK;e.currentTarget.style.color=PINK;e.currentTarget.style.background="#fff0f4";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="#edf0f3";e.currentTarget.style.color="#bbb";e.currentTarget.style.background="#f8fafb";}}>+</button>
            </div>
          </div>

          {/* ─── Messages / Welcome ─── */}
          {(!active||!active.messages.length)&&!busy ? (
            <div className="chat-scroll" style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 24px 32px",gap:0,background:"linear-gradient(180deg,#fafbfc 0%,#fff 60%)"}}>

              {/* Hero */}
              <div style={{textAlign:"center",marginBottom:28}}>
                <div style={{fontWeight:800,fontSize:28,letterSpacing:"-0.05em",marginBottom:6,lineHeight:1}}>
                  GEN<span style={{color:PINK}}>-E</span>
                </div>
                <div style={{fontSize:14,fontWeight:500,color:"#9ca3af",marginBottom:8}}>
                  {isBusinessUser ? "Workforce Intelligence AI" : "AI Career Intelligence"}
                </div>
                {profile?.full_name && (
                  <div style={{fontSize:13.5,color:"#c0c6d0"}}>Hey {profile.full_name.split(" ")[0]}! What would you like to work on?</div>
                )}
              </div>

              {/* Feature grid */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(175px,1fr))",gap:10,width:"100%",maxWidth:620,marginBottom:20}}>
                {(isBusinessUser ? BUSINESS_FEATURES : INDIVIDUAL_FEATURES).map(f=>(
                  <FeatureCard key={f.key} f={f} plan={profile?.plan||"free"} onTrigger={triggerFeature}/>
                ))}
              </div>

              {/* Mode pills */}
              <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center"}}>
                {MODES.map(m=>(
                  <button key={m.id}
                    onClick={()=>{
                      if((m.id==="RESUME"||m.id==="INTERVIEW")&&(profile?.plan||"free")==="free"){
                        setUpgrade(m.id==="RESUME"?"resume_builder":"interview_advanced");
                      } else setMode(m.id);
                    }}
                    style={{padding:"5px 14px",borderRadius:20,cursor:"pointer",fontSize:12,fontWeight:600,
                      border:`1.5px solid ${mode===m.id?PINK:"#edf0f3"}`,
                      background:mode===m.id?`${PINK}0c`:"#fff",
                      color:mode===m.id?PINK:"#c0c6d0",
                      transition:"all 0.13s"}}>
                    {m.icon} {m.long}{(m.id==="RESUME"||m.id==="INTERVIEW")&&(profile?.plan||"free")==="free"?" 🔒":""}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="chat-scroll" style={{flex:1,overflowY:"auto",padding:"28px 20px 16px",background:"#fafbfc"}}>
              <div style={{maxWidth:720,margin:"0 auto",display:"flex",flexDirection:"column",gap:20}}>
                {active?.messages.map((msg,i)=>(
                  <div key={i} className="msg-in"
                    style={{display:"flex",justifyContent:msg.role==="user"?"flex-end":"flex-start",alignItems:"flex-start",gap:10}}>

                    {msg.role==="assistant" && (
                      <div style={{width:30,height:30,borderRadius:9,background:`linear-gradient(135deg,${PINK},#c4134e)`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:9,color:"#fff",marginTop:2,letterSpacing:"-0.03em",boxShadow:`0 4px 12px ${PINK}30`}}>GE</div>
                    )}

                    <div style={{maxWidth:"80%",display:"flex",flexDirection:"column",alignItems:msg.role==="user"?"flex-end":"flex-start",gap:5}}>
                      {msg.imagePreview && <img src={msg.imagePreview} alt="" style={{maxWidth:220,maxHeight:160,objectFit:"cover",borderRadius:11,border:"1px solid #f0f0f0"}}/>}
                      <div className="msg-wrap" style={{position:"relative"}}>
                        <div style={{padding:"12px 16px",borderRadius:16,fontSize:14,lineHeight:1.7,
                          ...(msg.role==="user"
                            ? {background:`linear-gradient(135deg,${PINK},#d01450)`,color:"#fff",borderBottomRightRadius:4,boxShadow:`0 4px 16px ${PINK}35`}
                            : {background:"#fff",color:"#111",border:"1px solid rgba(0,0,0,0.06)",borderBottomLeftRadius:4,boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}
                          )}}>

                          {msg.role==="user"&&editIdx===i?(
                            <div>
                              <textarea autoFocus value={editText} onChange={e=>setEditText(e.target.value)}
                                onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();saveEdit(activeId,i);}if(e.key==="Escape")cancelEdit();}}
                                style={{width:"100%",minHeight:60,background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.4)",borderRadius:9,padding:"7px 11px",color:"#fff",fontSize:14,lineHeight:1.55,fontFamily:"inherit",resize:"vertical",outline:"none"}}/>
                              <div style={{display:"flex",gap:6,marginTop:6,justifyContent:"flex-end"}}>
                                <button onClick={cancelEdit} style={{padding:"4px 10px",background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:7,color:"#fff",fontSize:11,cursor:"pointer"}}>Cancel</button>
                                <button onClick={()=>saveEdit(activeId,i)} style={{padding:"4px 10px",background:"#fff",border:"none",borderRadius:7,color:PINK,fontSize:11,fontWeight:700,cursor:"pointer"}}>Send ↑</button>
                              </div>
                            </div>
                          ):(
                            <div className={msg.role==="user"?"md-user":("md-ai"+(msg.streaming?" streaming-msg":""))}>
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                            </div>
                          )}

                          {/* PDF download */}
                          {msg.pdf&&profile?.plan!=="free"&&(
                            <a href={`${API}${msg.pdf}`} target="_blank" rel="noopener noreferrer"
                              style={{display:"inline-flex",alignItems:"center",gap:5,marginTop:12,padding:"6px 14px",background:"rgba(255,255,255,0.2)",color:"#fff",borderRadius:9,fontSize:12,fontWeight:700,textDecoration:"none",border:"1px solid rgba(255,255,255,0.3)"}}>
                              ↓ Download Resume PDF
                            </a>
                          )}
                          {msg.pdf&&profile?.plan==="free"&&(
                            <button onClick={()=>nav("/pricing")} style={{marginTop:10,padding:"6px 14px",background:"#f5f3ff",border:"1px solid #ddd6fe",color:"#7c3aed",borderRadius:9,fontSize:12,fontWeight:700,cursor:"pointer"}}>Upgrade to download PDF</button>
                          )}

                          {/* Resume action buttons */}
                          {msg.role==="assistant"&&msg.text?.includes("##")&&msg.text?.length>400&&!msg.streaming&&(
                            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:10}}>
                              <button onClick={()=>downloadResumeImage(msg.text)} style={{display:"inline-flex",alignItems:"center",gap:4,padding:"5px 12px",background:"#f0fdf4",border:"1px solid #86efac",color:"#15803d",borderRadius:8,fontSize:11.5,fontWeight:700,cursor:"pointer"}}>
                                🖼️ Download as Image
                              </button>
                              {profile?.plan!=="free"&&(
                                <button onClick={()=>setSaveModal({text:msg.text})} style={{display:"inline-flex",alignItems:"center",gap:4,padding:"5px 12px",background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:8,cursor:"pointer",fontSize:11.5,color:"#15803d",fontWeight:700}}>
                                  💾 Save to Vault
                                </button>
                              )}
                            </div>
                          )}

                          {/* Job cards */}
                          {msg.role==="assistant"&&msg.jobs?.length>0&&(
                            <div style={{marginTop:16,display:"flex",flexDirection:"column",gap:8}}>
                              <div style={{fontSize:10.5,fontWeight:700,color:"#9ca3af",letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:2}}>{msg.jobs.length} Live Opening{msg.jobs.length!==1?"s":""} Found</div>
                              {msg.jobs.map(j=>(
                                <a key={j.id} href={j.url} target="_blank" rel="noopener noreferrer"
                                  style={{display:"block",textDecoration:"none",background:"#fff",border:"1.5px solid #f0f2f5",borderRadius:12,padding:"12px 14px"}}
                                  onMouseEnter={e=>{e.currentTarget.style.borderColor="#fcc";e.currentTarget.style.boxShadow=`0 4px 16px ${PINK}10`;}}
                                  onMouseLeave={e=>{e.currentTarget.style.borderColor="#f0f2f5";e.currentTarget.style.boxShadow="none";}}>
                                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                                    <div style={{flex:1,minWidth:0}}>
                                      <div style={{fontSize:13,fontWeight:700,color:"#111",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{j.title}</div>
                                      <div style={{fontSize:11.5,color:"#666",marginTop:2}}>{j.company}&nbsp;·&nbsp;{j.location}</div>
                                    </div>
                                    <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3,flexShrink:0}}>
                                      {j.remote&&<span style={{fontSize:9.5,background:"#f0fdf4",color:"#15803d",padding:"2px 7px",borderRadius:20,fontWeight:600,border:"1px solid #86efac"}}>Remote</span>}
                                      <span style={{fontSize:9.5,background:"#f9fafb",color:"#bbb",padding:"2px 7px",borderRadius:20,border:"1px solid #f0f0f0"}}>{j.source}</span>
                                    </div>
                                  </div>
                                  {j.salary&&<div style={{fontSize:11.5,color:PINK,fontWeight:700,marginTop:5}}>{j.salary}</div>}
                                  {j.tags?.length>0&&<div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:6}}>{j.tags.slice(0,4).map(t=><span key={t} style={{fontSize:9.5,background:"#f5f5f5",color:"#666",padding:"2px 7px",borderRadius:20}}>{t}</span>)}</div>}
                                  <div style={{marginTop:8,fontSize:10.5,color:PINK,fontWeight:600}}>Apply → {j.source}</div>
                                </a>
                              ))}
                              <div style={{fontSize:10,color:"#d0d5dd",textAlign:"center",paddingTop:2}}>Live from Remotive · Arbeitnow · Adzuna</div>
                            </div>
                          )}
                        </div>

                        {/* Edit pencil */}
                        {msg.role==="user"&&editIdx!==i&&(
                          <button onClick={()=>startEdit(i,msg.text)} className="edit-btn" title="Edit message"
                            style={{position:"absolute",top:6,left:-30,width:22,height:22,opacity:0,background:"rgba(0,0,0,0.05)",border:"none",borderRadius:7,cursor:"pointer",color:"#999",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",transition:"opacity 0.15s"}}>
                            ✎
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
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

          {/* ─── INPUT ─── */}
          <div style={{padding:"10px 20px 18px",background:"#fff",flexShrink:0,borderTop:"1px solid #f0f2f5"}}>
            <div style={{maxWidth:720,margin:"0 auto"}}>

              {staged&&(
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,padding:"7px 13px",background:`${PINK}08`,borderRadius:11,border:`1px solid ${PINK}20`}}>
                  {staged.previewUrl?<img src={staged.previewUrl} alt="" style={{width:32,height:32,objectFit:"cover",borderRadius:7,flexShrink:0}}/>:<span style={{fontSize:18,flexShrink:0}}>📄</span>}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:600,color:"#333",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{staged.name}</div>
                    <div style={{fontSize:10.5,color:"#c0c6d0"}}>Add a message or send as-is</div>
                  </div>
                  <button onClick={()=>{setStaged(null);inputRef.current?.focus();}} style={{background:"none",border:"none",cursor:"pointer",color:"#ccc",fontSize:18,lineHeight:1,flexShrink:0}} onMouseEnter={e=>e.currentTarget.style.color=PINK} onMouseLeave={e=>e.currentTarget.style.color="#ccc"}>×</button>
                </div>
              )}

              <div style={{display:"flex",alignItems:"flex-end",gap:8,background:"#f8fafb",border:"1.5px solid #edf0f3",borderRadius:16,padding:"8px 8px 8px 14px",transition:"all 0.15s"}}
                onFocusCapture={e=>{e.currentTarget.style.borderColor=`${PINK}50`;e.currentTarget.style.background="#fff";e.currentTarget.style.boxShadow=`0 0 0 3px ${PINK}10`;}}
                onBlurCapture={e=>{e.currentTarget.style.borderColor="#edf0f3";e.currentTarget.style.background="#f8fafb";e.currentTarget.style.boxShadow="none";}}>

                <div style={{position:"relative",flexShrink:0}}>
                  <button onClick={()=>setShowAttach(v=>!v)} title="Attach file"
                    style={{width:32,height:32,background:"#fff",border:"1.5px solid #edf0f3",borderRadius:9,cursor:"pointer",color:staged?PINK:"#c0c6d0",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.13s"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=PINK;e.currentTarget.style.color=PINK;}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="#edf0f3";e.currentTarget.style.color=staged?PINK:"#c0c6d0";}}>📎</button>

                  {showAttach&&(
                    <div onClick={e=>e.stopPropagation()} style={{position:"absolute",bottom:40,left:0,background:"#fff",border:"1px solid #f0f2f5",borderRadius:13,padding:6,minWidth:214,zIndex:50,boxShadow:"0 8px 32px rgba(0,0,0,0.1)"}}>
                      <div style={{fontSize:10,fontWeight:700,color:"#d0d5dd",padding:"3px 8px 7px",letterSpacing:"0.06em",textTransform:"uppercase"}}>Attach file</div>
                      {[["Image / Screenshot",".png,.jpg,.jpeg,.webp,.gif"],["Resume / CV (PDF, DOCX)",".pdf,.doc,.docx,.txt"],["Job Description",".pdf,.docx,.txt"]].map(([lbl,acc])=>(
                        <label key={lbl} style={{display:"flex",alignItems:"center",padding:"8px 10px",fontSize:12.5,color:"#444",borderRadius:9,cursor:"pointer"}}
                          onMouseEnter={e=>e.currentTarget.style.background="#f8fafb"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                          {lbl}<input type="file" style={{display:"none"}} accept={acc} onChange={e=>{if(e.target.files[0])stageFile(e.target.files[0]);setShowAttach(false);}}/>
                        </label>
                      ))}
                      <div style={{margin:"4px 8px",borderTop:"1px solid #f5f7fa"}}/>
                      <div style={{padding:"3px 10px",fontSize:10.5,color:"#d0d5dd",lineHeight:1.5}}>Attach → type request → Send</div>
                    </div>
                  )}
                </div>

                <textarea ref={inputRef} value={input} rows={1}
                  onChange={e=>setInput(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
                  placeholder={staged?`Tell GEN-E what to do with "${staged.name.slice(0,28)}"…`:canSend()?`Ask anything… (${curMode?.long})`:"Upgrade to continue chatting"}
                  disabled={!canSend()&&!staged}
                  style={{flex:1,background:"transparent",border:"none",resize:"none",fontSize:14,lineHeight:1.6,color:"#111",outline:"none",maxHeight:130,overflowY:"auto",minHeight:22,paddingTop:5,fontFamily:"inherit"}}/>

                {!canSend()&&!staged?(
                  <button onClick={()=>nav("/pricing")} style={{height:34,padding:"0 16px",background:`linear-gradient(135deg,${PINK},#c4134e)`,border:"none",borderRadius:10,fontWeight:700,fontSize:12,color:"#fff",cursor:"pointer",flexShrink:0,boxShadow:`0 4px 12px ${PINK}30`}}>Upgrade</button>
                ):(
                  <button onClick={()=>send()} disabled={busy||(!input.trim()&&!staged)}
                    style={{height:34,padding:"0 16px",flexShrink:0,
                      background:(busy||(!input.trim()&&!staged))?"#f0f2f5":`linear-gradient(135deg,${PINK},#c4134e)`,
                      border:"none",borderRadius:10,fontWeight:700,fontSize:12,
                      color:(busy||(!input.trim()&&!staged))?"#c0c6d0":"#fff",
                      cursor:(busy||(!input.trim()&&!staged))?"not-allowed":"pointer",
                      transition:"all 0.15s",boxShadow:(busy||(!input.trim()&&!staged))?"none":`0 4px 12px ${PINK}30`}}>
                    {busy?"…":"Send"}
                  </button>
                )}
              </div>

              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:7,flexWrap:"wrap",gap:6}}>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {MODES.map(m=>(
                    <button key={m.id}
                      onClick={()=>{
                        if((m.id==="RESUME"||m.id==="INTERVIEW")&&(profile?.plan||"free")==="free"){setUpgrade(m.id==="RESUME"?"resume_builder":"interview_advanced");}
                        else setMode(m.id);
                      }}
                      style={{padding:"3px 11px",borderRadius:20,cursor:"pointer",fontSize:11.5,fontWeight:600,
                        border:`1.5px solid ${mode===m.id?PINK:"#edf0f3"}`,
                        background:mode===m.id?`${PINK}0c`:"transparent",
                        color:mode===m.id?PINK:"#c0c6d0",transition:"all 0.13s"}}>
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
    </>
  );
}
