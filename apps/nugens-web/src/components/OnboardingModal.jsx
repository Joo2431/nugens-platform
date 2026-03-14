import React, { useState } from "react";
import { supabase } from "../lib/supabase";

const PINK = "#e8185d";
const B    = "#1e1e1e";

const INDIVIDUAL_STEPS = [
  {
    key: "user_type",
    title: "How are you using NuGens?",
    subtitle: "This helps us personalize your experience",
    type: "cards",
    options: [
      { value:"individual", icon:"👤", label:"For Myself", sub:"Career growth, learning, personal projects" },
      { value:"business",   icon:"🏢", label:"For My Business", sub:"Team training, marketing, hiring, production" },
    ],
  },
  {
    key: "situation",
    title: "What's your current situation?",
    subtitle: "We'll tailor your resources and recommendations",
    type: "cards",
    options: [
      { value:"student",      icon:"🎓", label:"Student / Fresh Graduate", sub:"Starting out, first job search" },
      { value:"employed",     icon:"💼", label:"Currently Employed",       sub:"Growing in current role" },
      { value:"job_seeking",  icon:"🔍", label:"Looking for a Job",        sub:"Active job search" },
      { value:"freelancer",   icon:"⚡", label:"Freelancer / Self-employed",sub:"Building my own career" },
    ],
  },
  {
    key: "goal",
    title: "What's your primary goal?",
    subtitle: "Pick the one that matters most right now",
    type: "cards",
    options: [
      { value:"get_promoted",    icon:"📈", label:"Get Promoted",         sub:"Move up in current company" },
      { value:"switch_career",   icon:"🔄", label:"Switch Career",        sub:"Change field or industry" },
      { value:"learn_skills",    icon:"📚", label:"Learn New Skills",     sub:"Build expertise and knowledge" },
      { value:"get_first_job",   icon:"🚀", label:"Land First Job",       sub:"Start my professional journey" },
      { value:"grow_income",     icon:"💰", label:"Grow My Income",       sub:"Salary increase or freelance" },
      { value:"build_brand",     icon:"🌟", label:"Build Personal Brand", sub:"LinkedIn, visibility, network" },
    ],
  },
  {
    key: "industry",
    title: "What industry are you in?",
    subtitle: "For relevant course and job recommendations",
    type: "pills",
    options: ["Technology","Marketing","Design","Finance","Healthcare","Education","Sales","Operations","HR & Recruiting","Content & Media","Engineering","Other"],
  },
];

const BUSINESS_STEPS = [
  {
    key: "user_type",
    title: "How are you using NuGens?",
    subtitle: "This helps us personalize your experience",
    type: "cards",
    options: [
      { value:"individual", icon:"👤", label:"For Myself", sub:"Career growth, learning, personal projects" },
      { value:"business",   icon:"🏢", label:"For My Business", sub:"Team training, marketing, hiring, production" },
    ],
  },
  {
    key: "company_size",
    title: "How big is your team?",
    subtitle: "We'll recommend the right plan and tools",
    type: "cards",
    options: [
      { value:"1-5",    icon:"👥", label:"1–5 people",   sub:"Solo or micro team" },
      { value:"6-20",   icon:"🏘️", label:"6–20 people",  sub:"Small team" },
      { value:"21-100", icon:"🏢", label:"21–100 people", sub:"Growing company" },
      { value:"100+",   icon:"🏛️", label:"100+ people",  sub:"Enterprise" },
    ],
  },
  {
    key: "business_need",
    title: "What do you need most?",
    subtitle: "We'll surface the right NuGens products",
    type: "cards",
    options: [
      { value:"train_team",       icon:"📚", label:"Train My Team",        sub:"HyperX courses for employees" },
      { value:"hire_talent",      icon:"🤝", label:"Hire Skilled Talent",  sub:"DigiHub talent network" },
      { value:"digital_marketing",icon:"📣", label:"Digital Marketing",    sub:"Brand growth, content, SEO" },
      { value:"content_production",icon:"🎬",label:"Content & Production", sub:"Photography, video, creative" },
    ],
  },
  {
    key: "industry",
    title: "What industry is your business in?",
    subtitle: "For relevant tools and content",
    type: "pills",
    options: ["Technology","Retail & E-commerce","Healthcare","Education","Real Estate","Hospitality","Finance","Media & Entertainment","Manufacturing","Other"],
  },
];

const PRODUCT_MAP = {
  individual: {
    get_promoted:    ["hyperx","gene"],
    switch_career:   ["gene","hyperx"],
    learn_skills:    ["hyperx","gene"],
    get_first_job:   ["gene","hyperx"],
    grow_income:     ["gene","hyperx"],
    build_brand:     ["digihub","gene"],
  },
  business: {
    train_team:          ["hyperx","digihub"],
    hire_talent:         ["digihub","gene"],
    digital_marketing:   ["digihub"],
    content_production:  ["units","digihub"],
  },
};

export default function OnboardingModal({ user, onComplete }) {
  const [step,    setStep]    = useState(0);
  const [answers, setAnswers] = useState({});
  const [saving,  setSaving]  = useState(false);

  const isBusinessFlow = answers.user_type === "business";
  const steps = isBusinessFlow ? BUSINESS_STEPS : INDIVIDUAL_STEPS;
  const current = steps[step];
  const total   = steps.length;

  const pick = (key, value) => {
    setAnswers(p => ({ ...p, [key]: value }));
  };

  const next = async () => {
    if (step < total - 1) {
      // If user_type just answered, rebuild steps for next render
      setStep(s => s + 1);
    } else {
      await save();
    }
  };

  const save = async () => {
    setSaving(true);
    await supabase.from("profiles").update({
      ...answers,
      onboarding_done: true,
    }).eq("id", user.id);
    setSaving(false);
    onComplete(answers);
  };

  const canNext = answers[current?.key];

  return (
    <>
      <style>{`
        @keyframes ob-in{from{opacity:0;transform:scale(0.97)}to{opacity:1;transform:none}}
        .ob-card{background:#111;border:1.5px solid ${B};border-radius:12px;padding:16px 18px;cursor:pointer;transition:all 0.15s;text-align:left;font-family:'Plus Jakarta Sans',sans-serif;width:100%}
        .ob-card:hover{border-color:#333}
        .ob-card.sel{border-color:${PINK};background:${PINK}10}
        .ob-pill{padding:7px 16px;border-radius:8px;border:1.5px solid ${B};background:transparent;cursor:pointer;font-size:13px;font-weight:600;color:#666;transition:all 0.14s;font-family:'Plus Jakarta Sans',sans-serif}
        .ob-pill:hover{border-color:#333;color:#aaa}
        .ob-pill.sel{border-color:${PINK};background:${PINK}10;color:#fff}
      `}</style>

      {/* Overlay */}
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
        <div style={{width:"100%",maxWidth:520,background:"#0a0a0a",border:`1px solid ${B}`,borderRadius:20,padding:"36px 32px",animation:"ob-in 0.25s ease",position:"relative",maxHeight:"90vh",overflowY:"auto"}}>

          {/* Progress */}
          <div style={{display:"flex",gap:6,marginBottom:28}}>
            {steps.map((_,i)=>(
              <div key={i} style={{flex:1,height:3,borderRadius:99,background:i<=step?PINK:"#1e1e1e",transition:"background 0.2s"}}/>
            ))}
          </div>

          {/* Step content */}
          <div style={{marginBottom:28}}>
            <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:PINK,marginBottom:8}}>Step {step+1} of {total}</div>
            <h2 style={{fontWeight:800,fontSize:"clamp(18px,3vw,22px)",color:"#fff",letterSpacing:"-0.03em",marginBottom:6,lineHeight:1.3}}>{current.title}</h2>
            <p style={{fontSize:13.5,color:"#555"}}>{current.subtitle}</p>
          </div>

          {/* Options */}
          {current.type === "cards" && (
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:28}}>
              {current.options.map(o=>(
                <button key={o.value} className={`ob-card${answers[current.key]===o.value?" sel":""}`}
                  onClick={()=>pick(current.key, o.value)}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <span style={{fontSize:22,flexShrink:0}}>{o.icon}</span>
                    <div>
                      <div style={{fontSize:14,fontWeight:700,color:"#e8e8e8"}}>{o.label}</div>
                      <div style={{fontSize:12,color:"#555",marginTop:2}}>{o.sub}</div>
                    </div>
                    {answers[current.key]===o.value && <div style={{marginLeft:"auto",width:18,height:18,borderRadius:"50%",background:PINK,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",flexShrink:0}}>✓</div>}
                  </div>
                </button>
              ))}
            </div>
          )}

          {current.type === "pills" && (
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:28}}>
              {current.options.map(o=>(
                <button key={o} className={`ob-pill${answers[current.key]===o?" sel":""}`}
                  onClick={()=>pick(current.key, o)}>{o}</button>
              ))}
            </div>
          )}

          {/* Next button */}
          <button onClick={next} disabled={!canNext||saving}
            style={{width:"100%",padding:"13px 0",borderRadius:11,border:"none",
              background:canNext&&!saving?PINK:"#1a1a1a",
              color:canNext&&!saving?"#fff":"#444",
              fontSize:14,fontWeight:700,cursor:canNext&&!saving?"pointer":"not-allowed",
              fontFamily:"'Plus Jakarta Sans',sans-serif",transition:"all 0.14s"}}>
            {saving?"Setting up your workspace…":step===total-1?"Let's go →":"Continue →"}
          </button>

          {step > 0 && (
            <button onClick={()=>setStep(s=>s-1)} style={{width:"100%",padding:"10px 0",marginTop:8,borderRadius:11,border:"none",background:"transparent",color:"#444",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>← Back</button>
          )}
        </div>
      </div>
    </>
  );
}
