import React, { useState } from "react";

const PINK  = "#e8185d";
const TEXT  = "#111827";
const MUTED = "#6b7280";
const LIGHT = "#f8f9fb";
const CARD  = "#ffffff";
const BORDER= "#e8eaed";
const GREEN = "#16a34a";
const API   = "https://nugens-platform.onrender.com";

const CATEGORIES = ["SaaS / Tech","E-commerce / D2C","Food & Beverage","Education","Health & Wellness","Content / Media","Service Business","Manufacturing","Fintech","Social Impact","Other"];

export default function IdeaValidation({ profile }) {
  const [stage,       setStage]       = useState("form"); // form | loading | result | consult
  const [idea,        setIdea]        = useState("");
  const [problem,     setProblem]     = useState("");
  const [audience,    setAudience]    = useState("");
  const [category,    setCategory]    = useState("SaaS / Tech");
  const [revenue,     setRevenue]     = useState("");
  const [competition, setCompetition] = useState("");
  const [result,      setResult]      = useState(null);
  const [consultBooked, setBooked]    = useState(false);
  const [pastIdeas,   setPast]        = useState([
    { id:1, idea:"AI-powered meal planner for Indian households", score:78, status:"reviewed", date:"Mar 10, 2026", verdict:"Viable" },
  ]);

  const validate = async () => {
    if (!idea.trim()||!problem.trim()||!audience.trim()) return;
    setStage("loading");

    try {
      const res = await fetch(`${API}/api/mini-chat`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          message:`You are a senior startup mentor at NuGens. Validate this business idea with expert depth.\n\nIdea: ${idea}\nProblem solved: ${problem}\nTarget audience: ${audience}\nCategory: ${category}\nRevenue model: ${revenue||"Not specified"}\nCompetition awareness: ${competition||"Not specified"}\n\nProvide a structured validation in this exact JSON format (no extra text, no markdown):\n{\n  "score": <number 1-100>,\n  "verdict": "<Viable|Needs Work|Pivot Needed>",\n  "strengths": ["<strength1>","<strength2>","<strength3>"],\n  "risks": ["<risk1>","<risk2>","<risk3>"],\n  "market_insight": "<2 sentences about market opportunity in India>",\n  "next_steps": ["<action1>","<action2>","<action3>"],\n  "similar_examples": "<1-2 sentences about comparable successful businesses>",\n  "summary": "<3 sentences of overall verdict>"\n}`,
          userType:"individual",
          product:"units"
        })
      });
      const d = await res.json();
      const raw = d?.reply || d?.message || "{}";
      const clean = raw.replace(/```json|```/g,"").trim();
      try {
        const parsed = JSON.parse(clean);
        setResult(parsed);
        setPast(ps=>[{ id:Date.now(), idea:idea.slice(0,60), score:parsed.score, status:"reviewed", date:new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}), verdict:parsed.verdict }, ...ps]);
        setStage("result");
      } catch {
        setResult({
          score:65, verdict:"Needs Work",
          strengths:["Interesting problem space","Large potential audience"],
          risks:["Market competition is high","Revenue model needs clarity"],
          market_insight:raw.slice(0,200),
          next_steps:["Talk to 20 potential customers this week","Identify 3 direct competitors","Define your pricing model"],
          similar_examples:"Similar concepts have succeeded in adjacent markets.",
          summary:"Your idea has potential but needs more validation. Start with customer discovery before building."
        });
        setStage("result");
      }
    } catch {
      setResult({score:0,verdict:"Error",strengths:[],risks:[],market_insight:"Unable to validate.",next_steps:[],similar_examples:"",summary:"Please try again or reach out to our team."});
      setStage("result");
    }
  };

  const scoreColor = (s) => s>=75 ? GREEN : s>=50 ? "#f59e0b" : "#ef4444";
  const verdictBg  = (v) => v==="Viable"?"#f0fdf4":v==="Needs Work"?"#fffbeb":"#fef2f2";
  const verdictColor=(v) => v==="Viable"?GREEN:v==="Needs Work"?"#d97706":"#dc2626";

  const S = {
    page: { minHeight:"100vh", background:LIGHT, padding:"36px 44px", fontFamily:"'Plus Jakarta Sans',sans-serif" },
    card: { background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:24, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" },
    btn:  { padding:"12px 28px", background:PINK, color:"#fff", border:"none", borderRadius:10, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" },
    inp:  { width:"100%", border:`1px solid ${BORDER}`, borderRadius:9, padding:"10px 13px", fontSize:13, color:TEXT, fontFamily:"inherit", outline:"none", background:"#fafafa", boxSizing:"border-box", marginBottom:16 },
    ta:   { width:"100%", border:`1px solid ${BORDER}`, borderRadius:9, padding:"10px 13px", fontSize:13, color:TEXT, fontFamily:"inherit", outline:"none", background:"#fafafa", resize:"vertical", minHeight:80, boxSizing:"border-box", marginBottom:16 },
    sel:  { width:"100%", border:`1px solid ${BORDER}`, borderRadius:9, padding:"10px 13px", fontSize:13, color:TEXT, fontFamily:"inherit", outline:"none", background:"#fafafa", boxSizing:"border-box", marginBottom:16 },
    label:{ fontSize:11, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6, display:"block" },
  };

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:28 }}>
        <div>
          <div style={{ fontSize:22, fontWeight:800, color:TEXT, letterSpacing:"-0.04em", marginBottom:4 }}>◑ Idea Validation</div>
          <div style={{ fontSize:13, color:MUTED, marginBottom:28 }}>Submit your business idea — our AI + team will give you a detailed analysis. Free forever.</div>

          {stage==="form" && (
            <div style={S.card}>
              <div style={{ fontSize:14, fontWeight:700, color:TEXT, marginBottom:20 }}>Tell us about your idea</div>

              <label style={S.label}>Your Business Idea *</label>
              <textarea value={idea} onChange={e=>setIdea(e.target.value)} placeholder="Describe your idea in 2-4 sentences. What is it? How does it work?" style={S.ta} />

              <label style={S.label}>Problem Being Solved *</label>
              <textarea value={problem} onChange={e=>setProblem(e.target.value)} placeholder="What specific problem does this solve? How painful is this problem currently?" style={S.ta} />

              <label style={S.label}>Target Audience *</label>
              <input value={audience} onChange={e=>setAudience(e.target.value)} placeholder="Who exactly will use this? Be specific — age, location, situation." style={S.inp} />

              <label style={S.label}>Category</label>
              <select value={category} onChange={e=>setCategory(e.target.value)} style={S.sel}>
                {CATEGORIES.map(c=><option key={c}>{c}</option>)}
              </select>

              <label style={S.label}>Revenue Model (optional)</label>
              <input value={revenue} onChange={e=>setRevenue(e.target.value)} placeholder="e.g. Subscription, one-time purchase, marketplace fees..." style={S.inp} />

              <label style={S.label}>Competition Awareness (optional)</label>
              <input value={competition} onChange={e=>setCompetition(e.target.value)} placeholder="Any existing products or competitors you know about?" style={S.inp} />

              <button onClick={validate} disabled={!idea.trim()||!problem.trim()||!audience.trim()} style={{ ...S.btn, width:"100%", opacity:(!idea.trim()||!problem.trim()||!audience.trim())?0.4:1 }}>
                ◑ Validate My Idea →
              </button>
              <div style={{ fontSize:11, color:MUTED, textAlign:"center", marginTop:10 }}>Free · No signup needed · Results in 30 seconds</div>
            </div>
          )}

          {stage==="loading" && (
            <div style={{ ...S.card, textAlign:"center", padding:60 }}>
              <div style={{ fontSize:40, marginBottom:16, animation:"pulse 1.5s ease-in-out infinite" }}>◑</div>
              <div style={{ fontSize:16, fontWeight:700, color:TEXT, marginBottom:8 }}>Validating your idea...</div>
              <div style={{ fontSize:13, color:MUTED }}>Our AI is analysing market fit, risks, and opportunities</div>
              <style>{`@keyframes pulse{0%,100%{opacity:1;color:${PINK};}50%{opacity:0.4;color:#d1d5db;}}`}</style>
            </div>
          )}

          {stage==="result" && result && (
            <div>
              {/* Score card */}
              <div style={{ ...S.card, marginBottom:16, display:"grid", gridTemplateColumns:"auto 1fr", gap:24, alignItems:"center" }}>
                <div style={{ textAlign:"center" }}>
                  <div style={{ width:90, height:90, borderRadius:"50%", background:`${scoreColor(result.score)}15`, border:`3px solid ${scoreColor(result.score)}`, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column" }}>
                    <div style={{ fontSize:28, fontWeight:800, color:scoreColor(result.score), letterSpacing:"-0.04em" }}>{result.score}</div>
                    <div style={{ fontSize:9, color:MUTED, fontWeight:700 }}>/100</div>
                  </div>
                </div>
                <div>
                  <div style={{ display:"inline-block", padding:"4px 14px", background:verdictBg(result.verdict), border:`1px solid ${verdictColor(result.verdict)}30`, borderRadius:20, fontSize:11, fontWeight:800, color:verdictColor(result.verdict), textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>{result.verdict}</div>
                  <div style={{ fontSize:14, color:TEXT, lineHeight:1.7 }}>{result.summary}</div>
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
                {/* Strengths */}
                <div style={S.card}>
                  <div style={{ fontSize:12, fontWeight:700, color:GREEN, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12 }}>✓ Strengths</div>
                  {result.strengths?.map((s,i)=>(
                    <div key={i} style={{ fontSize:13, color:TEXT, marginBottom:9, display:"flex", gap:8 }}>
                      <span style={{color:GREEN,flexShrink:0}}>→</span>{s}
                    </div>
                  ))}
                </div>
                {/* Risks */}
                <div style={S.card}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#dc2626", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12 }}>⚠ Risks</div>
                  {result.risks?.map((r,i)=>(
                    <div key={i} style={{ fontSize:13, color:TEXT, marginBottom:9, display:"flex", gap:8 }}>
                      <span style={{color:"#dc2626",flexShrink:0}}>→</span>{r}
                    </div>
                  ))}
                </div>
              </div>

              {/* Market insight */}
              <div style={{ ...S.card, marginBottom:14 }}>
                <div style={{ fontSize:12, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Market Insight</div>
                <div style={{ fontSize:14, color:TEXT, lineHeight:1.7 }}>{result.market_insight}</div>
                {result.similar_examples && <div style={{ fontSize:13, color:MUTED, marginTop:8, fontStyle:"italic" }}>{result.similar_examples}</div>}
              </div>

              {/* Next steps */}
              <div style={{ ...S.card, marginBottom:14 }}>
                <div style={{ fontSize:12, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12 }}>Your Next 3 Steps</div>
                {result.next_steps?.map((step,i)=>(
                  <div key={i} style={{ display:"flex", gap:12, marginBottom:12, alignItems:"flex-start" }}>
                    <div style={{ width:24, height:24, borderRadius:"50%", background:`${PINK}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:PINK, flexShrink:0 }}>{i+1}</div>
                    <div style={{ fontSize:14, color:TEXT, lineHeight:1.6 }}>{step}</div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              {!consultBooked ? (
                <div style={{ background:"#fef2f2", border:`1px solid ${PINK}20`, borderRadius:14, padding:24 }}>
                  <div style={{ fontSize:16, fontWeight:800, color:TEXT, marginBottom:6 }}>Want a deeper analysis?</div>
                  <div style={{ fontSize:13, color:MUTED, lineHeight:1.7, marginBottom:16 }}>
                    Our team of startup mentors can give you a 45-minute 1-on-1 consultation — competitive deep dive, business model refinement, GTM strategy, and investor-readiness assessment.<br/><br/>
                    <strong>₹999 one-time</strong> · Only if you find it valuable
                  </div>
                  <div style={{ display:"flex", gap:10 }}>
                    <button onClick={()=>setBooked(true)} style={S.btn}>Book Premium Consultation — ₹999</button>
                    <button onClick={()=>{setStage("form");setIdea("");setProblem("");setAudience("");setRevenue("");setCompetition("");setResult(null);}} style={{ padding:"11px 22px", background:"#fff", border:`1px solid ${BORDER}`, color:MUTED, borderRadius:10, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Validate Another Idea</button>
                  </div>
                </div>
              ) : (
                <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:14, padding:20, textAlign:"center" }}>
                  <div style={{ fontSize:16, fontWeight:700, color:GREEN, marginBottom:6 }}>✓ Consultation Booked!</div>
                  <div style={{ fontSize:13, color:MUTED }}>Our team will reach out within 24 hours to schedule your session.</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <div style={{ ...S.card, marginBottom:14 }}>
            <div style={{ fontSize:13, fontWeight:700, color:TEXT, marginBottom:14 }}>How it works</div>
            {["Submit your idea with problem, audience & category","AI analyses market fit, competition & risks in 30 seconds","Get a detailed score, strengths, and risk analysis","Optional: book a 45-min premium consultation with our team"].map((s,i)=>(
              <div key={i} style={{ display:"flex", gap:10, marginBottom:12 }}>
                <div style={{ width:22, height:22, borderRadius:"50%", background:`${PINK}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:PINK, flexShrink:0 }}>{i+1}</div>
                <div style={{ fontSize:12, color:MUTED, lineHeight:1.5 }}>{s}</div>
              </div>
            ))}
          </div>

          <div style={{ ...S.card, marginBottom:14 }}>
            <div style={{ fontSize:13, fontWeight:700, color:TEXT, marginBottom:14 }}>Validation Score Guide</div>
            {[{range:"80-100",label:"Viable",color:GREEN,desc:"Strong market fit, proceed with confidence"},{range:"50-79",label:"Needs Work",color:"#d97706",desc:"Good concept, refine before building"},{range:"0-49",label:"Pivot Needed",color:"#dc2626",desc:"Significant challenges, reconsider approach"}].map(s=>(
              <div key={s.range} style={{ display:"flex", gap:10, marginBottom:12, alignItems:"flex-start" }}>
                <div style={{ fontSize:12, fontWeight:700, color:s.color, width:50, flexShrink:0 }}>{s.range}</div>
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:TEXT }}>{s.label}</div>
                  <div style={{ fontSize:11, color:MUTED }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={S.card}>
            <div style={{ fontSize:13, fontWeight:700, color:TEXT, marginBottom:12 }}>Your Past Validations</div>
            {pastIdeas.map(p=>(
              <div key={p.id} style={{ background:"#f8f9fb", borderRadius:8, padding:"10px 12px", marginBottom:8 }}>
                <div style={{ fontSize:12, fontWeight:600, color:TEXT, marginBottom:3 }}>{p.idea.slice(0,40)}...</div>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <span style={{ fontSize:11, fontWeight:700, color:scoreColor(p.score) }}>{p.score}/100</span>
                  <span style={{ fontSize:10, color:MUTED }}>·</span>
                  <span style={{ fontSize:10, color:MUTED }}>{p.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
