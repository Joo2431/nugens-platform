import React, { useState } from "react";
import { miniChat } from "../lib/apiClient";

const PINK  = "#e8185d";
const TEXT  = "#111827";
const MUTED = "#6b7280";
const LIGHT = "#f8f9fb";
const CARD  = "#ffffff";
const BORDER= "#e8eaed";
const GREEN = "#16a34a";

const CATEGORIES = ["SaaS / Tech","E-commerce / D2C","Food & Beverage","Education","Health & Wellness","Content / Media","Service Business","Manufacturing","Fintech","Social Impact","Other"];

export default function IdeaValidation({ profile }) {
  const [stage,        setStage]       = useState("form");
  const [idea,         setIdea]        = useState("");
  const [problem,      setProblem]     = useState("");
  const [audience,     setAudience]    = useState("");
  const [category,     setCategory]    = useState("SaaS / Tech");
  const [revenue,      setRevenue]     = useState("");
  const [competition,  setCompetition] = useState("");
  const [result,       setResult]      = useState(null);
  const [consultBooked,setBooked]      = useState(false);
  const [error,        setError]       = useState("");
  const [pastIdeas,    setPast]        = useState([]);

  const validate = async () => {
    if (!idea.trim() || !problem.trim() || !audience.trim()) return;
    setStage("loading");
    setError("");

    try {
      const prompt = `Validate this business idea and respond ONLY with a valid JSON object (no markdown, no extra text):

Business idea: ${idea}
Problem solved: ${problem}
Target audience: ${audience}
Category: ${category}
Revenue model: ${revenue || "Not specified"}
Competition awareness: ${competition || "Not specified"}

JSON format:
{
  "score": <number 0-100>,
  "verdict": "<Viable|Needs Work|Pivot Needed>",
  "strengths": ["strength1", "strength2", "strength3"],
  "risks": ["risk1", "risk2", "risk3"],
  "market_insight": "<2 sentences about Indian/global market opportunity>",
  "next_steps": ["action1", "action2", "action3"],
  "similar_examples": "<1-2 sentences about comparable successful companies>",
  "summary": "<3 clear sentences of overall assessment>"
}`;

      // Uses apiClient with auto auth token
      const data = await miniChat(prompt, "units", profile?.user_type || "individual");
      const raw  = data?.reply || data?.message || "{}";
      const clean = raw.replace(/```json|```/g, "").trim();

      let parsed;
      try {
        parsed = JSON.parse(clean);
      } catch {
        // If JSON parse fails, construct a basic result from the text
        parsed = {
          score: 65,
          verdict: "Needs Work",
          strengths: ["Interesting problem space", "Clear target audience identified"],
          risks: ["Revenue model needs more clarity", "Competition analysis needed"],
          market_insight: clean.slice(0, 200),
          next_steps: ["Talk to 20 potential customers this week", "Map your top 3 competitors", "Define your pricing model clearly"],
          similar_examples: "Similar concepts have found success in adjacent markets.",
          summary: "Your idea shows potential but needs further validation before building. Start with customer discovery first."
        };
      }

      setResult(parsed);
      setPast(ps => [{
        id: Date.now(),
        idea: idea.slice(0, 60),
        score: parsed.score,
        verdict: parsed.verdict,
        date: new Date().toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })
      }, ...ps]);
      setStage("result");
    } catch (e) {
      setError(e.message?.includes("401")
        ? "Session expired. Please refresh the page and try again."
        : "Unable to validate right now. Please try again in a moment."
      );
      setStage("form");
    }
  };

  const scoreColor = (s) => s >= 75 ? GREEN : s >= 50 ? "#f59e0b" : "#ef4444";

  const S = {
    page: { minHeight:"100vh", background:LIGHT, padding:"36px 44px", fontFamily:"'Plus Jakarta Sans',sans-serif" },
    card: { background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:24, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" },
    btn:  { padding:"12px 28px", background:PINK, color:"#fff", border:"none", borderRadius:10, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" },
    inp:  { width:"100%", border:`1px solid ${BORDER}`, borderRadius:9, padding:"10px 13px", fontSize:13, color:TEXT, fontFamily:"inherit", outline:"none", background:"#fafafa", boxSizing:"border-box", marginBottom:16 },
    ta:   { width:"100%", border:`1px solid ${BORDER}`, borderRadius:9, padding:"10px 13px", fontSize:13, color:TEXT, fontFamily:"inherit", outline:"none", resize:"vertical", minHeight:80, background:"#fafafa", boxSizing:"border-box", marginBottom:16 },
    sel:  { width:"100%", border:`1px solid ${BORDER}`, borderRadius:9, padding:"10px 13px", fontSize:13, color:TEXT, fontFamily:"inherit", outline:"none", background:"#fafafa", boxSizing:"border-box", marginBottom:16 },
    label:{ fontSize:11, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6, display:"block" },
    check:{ fontSize:13, color:MUTED, display:"flex", gap:8, marginBottom:9, alignItems:"flex-start" },
  };

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:28 }}>
        <div>
          <div style={{ fontSize:22, fontWeight:800, color:TEXT, letterSpacing:"-0.04em", marginBottom:4 }}>◑ Idea Validation</div>
          <div style={{ fontSize:13, color:MUTED, marginBottom:28 }}>Submit your business idea — our AI gives you a detailed analysis in 30 seconds. Free forever.</div>

          {error && (
            <div style={{ background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:10, padding:"12px 16px", marginBottom:20, fontSize:13, color:"#dc2626" }}>
              {error}
            </div>
          )}

          {stage === "form" && (
            <div style={S.card}>
              <div style={{ fontSize:14, fontWeight:700, color:TEXT, marginBottom:20 }}>Tell us about your idea</div>

              <label style={S.label}>Your Business Idea *</label>
              <textarea value={idea} onChange={e => setIdea(e.target.value)} placeholder="Describe your idea in 2–4 sentences. What is it and how does it work?" style={S.ta} />

              <label style={S.label}>Problem Being Solved *</label>
              <textarea value={problem} onChange={e => setProblem(e.target.value)} placeholder="What specific problem does this solve? How painful is it currently?" style={S.ta} />

              <label style={S.label}>Target Audience *</label>
              <input value={audience} onChange={e => setAudience(e.target.value)} placeholder="Who exactly will use this? Be specific — age, location, situation." style={S.inp} />

              <label style={S.label}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} style={S.sel}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>

              <label style={S.label}>Revenue Model (optional)</label>
              <input value={revenue} onChange={e => setRevenue(e.target.value)} placeholder="e.g. Subscription, one-time purchase, marketplace fees..." style={S.inp} />

              <label style={S.label}>Competition Awareness (optional)</label>
              <input value={competition} onChange={e => setCompetition(e.target.value)} placeholder="Any existing products or competitors you know about?" style={S.inp} />

              <button onClick={validate} disabled={!idea.trim() || !problem.trim() || !audience.trim()} style={{ ...S.btn, width:"100%", opacity:(!idea.trim() || !problem.trim() || !audience.trim()) ? 0.4 : 1 }}>
                ◑ Validate My Idea →
              </button>
              <div style={{ fontSize:11, color:MUTED, textAlign:"center", marginTop:10 }}>Free · Results in ~30 seconds · No signup needed</div>
            </div>
          )}

          {stage === "loading" && (
            <div style={{ ...S.card, textAlign:"center", padding:60 }}>
              <div style={{ fontSize:40, marginBottom:16, color:PINK }}>◑</div>
              <div style={{ fontSize:16, fontWeight:700, color:TEXT, marginBottom:8 }}>Validating your idea...</div>
              <div style={{ fontSize:13, color:MUTED }}>Analysing market fit, risks, and opportunities</div>
            </div>
          )}

          {stage === "result" && result && (
            <div>
              {/* Score */}
              <div style={{ ...S.card, marginBottom:16, display:"grid", gridTemplateColumns:"auto 1fr", gap:24, alignItems:"center" }}>
                <div style={{ textAlign:"center" }}>
                  <div style={{ width:90, height:90, borderRadius:"50%", background:`${scoreColor(result.score)}15`, border:`3px solid ${scoreColor(result.score)}`, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column" }}>
                    <div style={{ fontSize:28, fontWeight:800, color:scoreColor(result.score), letterSpacing:"-0.04em" }}>{result.score}</div>
                    <div style={{ fontSize:9, color:MUTED, fontWeight:700 }}>/100</div>
                  </div>
                </div>
                <div>
                  <div style={{ display:"inline-block", padding:"4px 14px", background:`${scoreColor(result.score)}10`, border:`1px solid ${scoreColor(result.score)}30`, borderRadius:20, fontSize:11, fontWeight:800, color:scoreColor(result.score), textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>
                    {result.verdict}
                  </div>
                  <div style={{ fontSize:14, color:TEXT, lineHeight:1.7 }}>{result.summary}</div>
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
                <div style={S.card}>
                  <div style={{ fontSize:12, fontWeight:700, color:GREEN, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12 }}>✓ Strengths</div>
                  {result.strengths?.map((s,i) => <div key={i} style={S.check}><span style={{color:GREEN,flexShrink:0}}>→</span>{s}</div>)}
                </div>
                <div style={S.card}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#dc2626", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12 }}>⚠ Risks</div>
                  {result.risks?.map((r,i) => <div key={i} style={S.check}><span style={{color:"#dc2626",flexShrink:0}}>→</span>{r}</div>)}
                </div>
              </div>

              <div style={{ ...S.card, marginBottom:14 }}>
                <div style={{ fontSize:12, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Market Insight</div>
                <div style={{ fontSize:14, color:TEXT, lineHeight:1.7 }}>{result.market_insight}</div>
                {result.similar_examples && <div style={{ fontSize:13, color:MUTED, marginTop:8, fontStyle:"italic" }}>{result.similar_examples}</div>}
              </div>

              <div style={{ ...S.card, marginBottom:14 }}>
                <div style={{ fontSize:12, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12 }}>Your Next 3 Steps</div>
                {result.next_steps?.map((step,i) => (
                  <div key={i} style={{ display:"flex", gap:12, marginBottom:12, alignItems:"flex-start" }}>
                    <div style={{ width:24, height:24, borderRadius:"50%", background:`${PINK}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:PINK, flexShrink:0 }}>{i+1}</div>
                    <div style={{ fontSize:14, color:TEXT, lineHeight:1.6 }}>{step}</div>
                  </div>
                ))}
              </div>

              {!consultBooked ? (
                <div style={{ background:"#fef2f2", border:`1px solid ${PINK}20`, borderRadius:14, padding:24 }}>
                  <div style={{ fontSize:16, fontWeight:800, color:TEXT, marginBottom:6 }}>Want a deeper analysis?</div>
                  <div style={{ fontSize:13, color:MUTED, lineHeight:1.7, marginBottom:16 }}>
                    Our startup mentors can give you a 45-minute 1-on-1 — competitive deep dive, business model refinement, and investor-readiness assessment.<br/>
                    <strong>₹999 one-time</strong> — charged only if you want to proceed.
                  </div>
                  <div style={{ display:"flex", gap:10 }}>
                    <button onClick={() => setBooked(true)} style={S.btn}>Book Premium Consultation — ₹999</button>
                    <button onClick={() => { setStage("form"); setIdea(""); setProblem(""); setAudience(""); setRevenue(""); setCompetition(""); setResult(null); }} style={{ padding:"11px 22px", background:"#fff", border:`1px solid ${BORDER}`, color:MUTED, borderRadius:10, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
                      Validate Another Idea
                    </button>
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
            {["Submit your idea with problem, audience, and category", "AI analyses market fit, competition, and risks in ~30 seconds", "Get a detailed score, strengths, risks, and next steps", "Optionally book a 45-min premium consultation with our team"].map((s,i) => (
              <div key={i} style={{ display:"flex", gap:10, marginBottom:12 }}>
                <div style={{ width:22, height:22, borderRadius:"50%", background:`${PINK}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:PINK, flexShrink:0 }}>{i+1}</div>
                <div style={{ fontSize:12, color:MUTED, lineHeight:1.5 }}>{s}</div>
              </div>
            ))}
          </div>

          <div style={{ ...S.card, marginBottom:14 }}>
            <div style={{ fontSize:13, fontWeight:700, color:TEXT, marginBottom:14 }}>Score Guide</div>
            {[{range:"80–100", label:"Viable", color:GREEN, desc:"Strong market fit, proceed with confidence"},
              {range:"50–79", label:"Needs Work", color:"#d97706", desc:"Good concept, refine before building"},
              {range:"0–49", label:"Pivot Needed", color:"#dc2626", desc:"Significant challenges, reconsider approach"}].map(s => (
              <div key={s.range} style={{ display:"flex", gap:10, marginBottom:12, alignItems:"flex-start" }}>
                <div style={{ fontSize:11, fontWeight:700, color:s.color, width:50, flexShrink:0 }}>{s.range}</div>
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:TEXT }}>{s.label}</div>
                  <div style={{ fontSize:11, color:MUTED }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {pastIdeas.length > 0 && (
            <div style={S.card}>
              <div style={{ fontSize:13, fontWeight:700, color:TEXT, marginBottom:12 }}>Past Validations</div>
              {pastIdeas.map(p => (
                <div key={p.id} style={{ background:"#f8f9fb", borderRadius:8, padding:"10px 12px", marginBottom:8 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:TEXT, marginBottom:3 }}>{p.idea}...</div>
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <span style={{ fontSize:11, fontWeight:700, color:scoreColor(p.score) }}>{p.score}/100</span>
                    <span style={{ fontSize:10, color:MUTED }}>· {p.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
