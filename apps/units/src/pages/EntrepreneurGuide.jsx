import React, { useState } from "react";

const PINK  = "#e8185d";
const TEXT  = "#111827";
const MUTED = "#6b7280";
const LIGHT = "#f8f9fb";
const CARD  = "#ffffff";
const BORDER= "#e8eaed";
const API   = "https://nugens-platform.onrender.com";

const CHAPTERS = [
  {
    id:1, title:"Finding Your Idea", emoji:"💡", time:"20 min", free:true,
    sections:[
      { h:"What makes a great business idea?", body:"A great idea solves a real problem, has a market willing to pay for it, and you have an unfair advantage to execute it. The trick is not to start with an idea but with a problem you deeply understand." },
      { h:"The Problem-First Framework", body:"Step 1: List 10 problems you've personally faced.\nStep 2: Identify which ones others also face.\nStep 3: Ask: are people already paying to solve this?\nStep 4: Find your unique angle on an existing solution." },
      { h:"Validating before you build", body:"The biggest mistake early entrepreneurs make is building before validating. Your goal in the first month: talk to 20 potential customers. Not sell — just listen. 80% of great pivots come from customer conversations, not whiteboard sessions." },
    ]
  },
  {
    id:2, title:"Understanding Your Market", emoji:"🎯", time:"25 min", free:true,
    sections:[
      { h:"TAM, SAM, SOM — what they mean", body:"Total Addressable Market (TAM) is everyone who could theoretically buy your product. Serviceable Addressable Market (SAM) is the segment you can realistically reach. Serviceable Obtainable Market (SOM) is what you can actually capture in your first 1-3 years. Investors care most about SAM and SOM." },
      { h:"Who is your ICP?", body:"Ideal Customer Profile (ICP) is the most specific description of your best customer. Not 'young people' — but 'first-generation college graduates aged 22-28 in Tier 1 Indian cities who earn ₹4-8L and are frustrated with their first job'. The more specific, the better your marketing." },
      { h:"Competitive analysis", body:"Find your top 5 competitors. For each: What do they do well? What do customers complain about? Where's the gap? Your positioning should live in that gap. Don't try to beat them — out-niche them." },
    ]
  },
  {
    id:3, title:"Building Your Brand", emoji:"✨", time:"30 min", free:true,
    sections:[
      { h:"Brand is not a logo", body:"Brand is the feeling people get when they think about your business. It's the words they use to describe you to a friend. Before you design anything, write a one-paragraph brand story: what you stand for, who you're for, and what makes you different." },
      { h:"The 3 pillars of brand identity", body:"Visual: Colors, typography, photography style — everything should feel consistent and intentional.\n\nVerbal: Your tone of voice, word choices, how you write captions and emails.\n\nExperiential: What it feels like to buy from you, receive your product, reach your support." },
      { h:"Content as brand-building", body:"For early-stage brands, content is the best distribution channel. Share your journey — the behind-the-scenes, the failures, the learning. People invest in founders before they invest in products. Start with a weekly Instagram post and one LinkedIn article per month." },
    ]
  },
  {
    id:4, title:"Your First ₹1 Lakh", emoji:"💰", time:"35 min", free:true,
    sections:[
      { h:"Revenue before funding", body:"Most Indian startups don't need VC money to start. Your goal: get to ₹1 lakh in revenue before you think about fundraising. This proves your idea works and gives you leverage in any investor conversation. Bootstrap as long as humanly possible." },
      { h:"Pricing strategy for beginners", body:"The most common mistake: pricing too low. Low prices don't attract customers — they attract the wrong customers. Price based on value delivered, not cost. If your product saves someone ₹10,000 a month, charge ₹2,000-3,000 a month, not ₹500." },
      { h:"Getting your first 10 customers", body:"Your first 10 customers should come from direct outreach, not paid ads. Go to where your ICP hangs out. LinkedIn DMs, Reddit threads, WhatsApp groups, local communities, warm introductions. Offer to serve them personally and over-deliver. These 10 will become your 100." },
    ]
  },
  {
    id:5, title:"Operations & Legal Basics", emoji:"📋", time:"20 min", free:true,
    sections:[
      { h:"When to register your business", body:"You can sell without a company registration in India up to a certain limit. For serious business: register a Private Limited Company or LLP. A PLC gives you credibility, enables fundraising, and has limited liability. Use a CA — don't DIY." },
      { h:"GST, invoicing, and basics", body:"If your turnover crosses ₹20 lakh (₹10 lakh in some states), GST registration is mandatory. Even before that, get a simple invoicing system — Zoho Books, Vyapar, or even a Google Sheet. Track every rupee in and out from day 1." },
      { h:"Basics of contracts", body:"For any service engagement above ₹10,000 — get a written agreement. It doesn't need to be a 20-page legal document. A clear email stating: scope, timeline, payment terms, and revision policy is enough to avoid 90% of disputes." },
    ]
  },
  {
    id:6, title:"Growth & Scale", emoji:"📈", time:"40 min", free:true,
    sections:[
      { h:"The growth flywheel", body:"Sustainable growth comes from a flywheel: great product → happy customers → word of mouth → more customers → better product. Find what turns your flywheel fastest. For most consumer brands: referrals. For B2B: case studies and LinkedIn." },
      { h:"Hiring your first person", body:"First hire should be someone who does what you can't do or hate to do. Don't hire for ambition — hire for specific skills you need now. Start with a 1-month paid trial project. Culture fit matters more than resume at early stage." },
      { h:"Knowing when to pivot", body:"A pivot is not failure — it's using what you've learned to go in a better direction. Signs you should pivot: no organic growth after 6 months, customers consistently want something different, your churn rate is above 10%/month. Talk to your churned customers — they'll tell you everything." },
    ]
  },
];

export default function EntrepreneurGuide({ profile }) {
  const [activeChapter, setActive]    = useState(1);
  const [activeSection, setSection]   = useState(0);
  const [completed,     setCompleted] = useState([]);
  const [aiQuestion,    setAiQ]       = useState("");
  const [aiAnswer,      setAiA]       = useState("");
  const [aiLoading,     setAiL]       = useState(false);
  const [showAI,        setShowAI]    = useState(false);

  const chapter = CHAPTERS.find(c=>c.id===activeChapter);
  const section = chapter?.sections[activeSection];
  const progress = completed.length;

  const markDone = (chId, secIdx) => {
    const key = `${chId}-${secIdx}`;
    if (!completed.includes(key)) setCompleted(c=>[...c,key]);
  };

  const askAI = async () => {
    if (!aiQuestion.trim()) return;
    setAiL(true);
    setAiA("");
    try {
      const res = await fetch(`${API}/api/mini-chat`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          message:`You are a startup mentor at NuGens. Answer this question from an aspiring entrepreneur in India in a practical, encouraging, and specific way. Topic: ${chapter?.title}. Question: ${aiQuestion}`,
          userType:"individual",
          product:"units"
        })
      });
      const d = await res.json();
      setAiA(d?.reply||d?.message||"Let me connect you with a mentor.");
    } catch(e){ setAiA("Trouble getting an answer — our team can help. Click 'Book Consultation'."); }
    setAiL(false);
  };

  const S = {
    page: { minHeight:"100vh", background:LIGHT, display:"flex", fontFamily:"'Plus Jakarta Sans',sans-serif" },
    btn:  { padding:"10px 22px", background:PINK, color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" },
  };

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      {/* Chapter list sidebar */}
      <div style={{ width:260, minHeight:"100vh", background:CARD, borderRight:`1px solid ${BORDER}`, padding:"28px 16px", flexShrink:0 }}>
        <div style={{ fontSize:15, fontWeight:800, color:TEXT, marginBottom:4 }}>◇ Entrepreneur Guide</div>
        <div style={{ fontSize:11, color:MUTED, marginBottom:20 }}>6 chapters · Free forever</div>

        <div style={{ background:"#f8f9fb", borderRadius:10, padding:"10px 14px", marginBottom:20 }}>
          <div style={{ fontSize:11, color:MUTED, marginBottom:4 }}>Your progress</div>
          <div style={{ fontSize:16, fontWeight:700, color:TEXT }}>{Math.round((progress/(CHAPTERS.length*3))*100)}%</div>
          <div style={{ height:4, background:"#e8eaed", borderRadius:2, marginTop:6 }}>
            <div style={{ height:"100%", width:`${Math.round((progress/(CHAPTERS.length*3))*100)}%`, background:PINK, borderRadius:2 }}/>
          </div>
        </div>

        {CHAPTERS.map(c=>(
          <button key={c.id} onClick={()=>{setActive(c.id);setSection(0);}} style={{ width:"100%", padding:"10px 12px", background:activeChapter===c.id?"#fef2f2":"none", border:activeChapter===c.id?`1px solid ${PINK}20`:"none", borderRadius:10, cursor:"pointer", textAlign:"left", fontFamily:"inherit", marginBottom:4, display:"flex", gap:10, alignItems:"center" }}>
            <span style={{ fontSize:16 }}>{c.emoji}</span>
            <div>
              <div style={{ fontSize:12, fontWeight:activeChapter===c.id?700:500, color:activeChapter===c.id?PINK:TEXT }}>{c.title}</div>
              <div style={{ fontSize:10, color:MUTED }}>{c.time}</div>
            </div>
            {completed.filter(k=>k.startsWith(`${c.id}-`)).length===3 && <span style={{ marginLeft:"auto", fontSize:12, color:"#22c55e" }}>✓</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex:1, padding:"36px 44px", overflowY:"auto" }}>
        {chapter && section && (
          <>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:28 }}>
              <span style={{ fontSize:28 }}>{chapter.emoji}</span>
              <div>
                <div style={{ fontSize:10, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em" }}>Chapter {chapter.id}</div>
                <div style={{ fontSize:22, fontWeight:800, color:TEXT }}>{chapter.title}</div>
              </div>
            </div>

            {/* Section tabs */}
            <div style={{ display:"flex", gap:8, marginBottom:28 }}>
              {chapter.sections.map((s,i)=>(
                <button key={i} onClick={()=>setSection(i)} style={{ padding:"8px 16px", background:activeSection===i?PINK:"#fff", color:activeSection===i?"#fff":MUTED, border:`1px solid ${activeSection===i?PINK:BORDER}`, borderRadius:20, fontSize:12, fontWeight:activeSection===i?700:500, cursor:"pointer", fontFamily:"inherit" }}>
                  {completed.includes(`${chapter.id}-${i}`)?"✓ ":""}{s.h.split(":")[0].slice(0,24)}{s.h.length>24?"...":""}
                </button>
              ))}
            </div>

            {/* Content card */}
            <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:16, padding:36, maxWidth:700, boxShadow:"0 1px 3px rgba(0,0,0,0.04)", marginBottom:20 }}>
              <div style={{ fontSize:18, fontWeight:800, color:TEXT, marginBottom:20 }}>{section.h}</div>
              <div style={{ fontSize:15, color:"#374151", lineHeight:1.85, whiteSpace:"pre-line", marginBottom:28 }}>{section.body}</div>

              <div style={{ display:"flex", gap:12 }}>
                {activeSection > 0 && <button onClick={()=>setSection(s=>s-1)} style={{ padding:"9px 20px", background:"#fff", border:`1px solid ${BORDER}`, color:MUTED, borderRadius:9, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>← Previous</button>}
                {activeSection < chapter.sections.length-1 ? (
                  <button onClick={()=>{ markDone(chapter.id,activeSection); setSection(s=>s+1); }} style={S.btn}>Mark done & continue →</button>
                ) : (
                  <button onClick={()=>{ markDone(chapter.id,activeSection); if(chapter.id<CHAPTERS.length){setActive(chapter.id+1);setSection(0);}}} style={S.btn}>
                    {chapter.id<CHAPTERS.length?"Complete chapter →":"Finish guide ✓"}
                  </button>
                )}
              </div>
            </div>

            {/* AI Q&A */}
            <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:24, maxWidth:700 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <div style={{ fontSize:13, fontWeight:700, color:TEXT }}>✦ Ask a question about this chapter</div>
                <button onClick={()=>setShowAI(v=>!v)} style={{ background:"none", border:"none", color:MUTED, cursor:"pointer", fontSize:12, fontFamily:"inherit" }}>{showAI?"Hide":"Show"}</button>
              </div>
              {showAI && (
                <>
                  <div style={{ display:"flex", gap:10, marginBottom:aiAnswer?12:0 }}>
                    <input value={aiQuestion} onChange={e=>setAiQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&askAI()} placeholder={`Ask anything about "${chapter.title}"...`} style={{ flex:1, border:`1px solid ${BORDER}`, borderRadius:9, padding:"10px 13px", fontSize:13, color:TEXT, fontFamily:"inherit", outline:"none", background:"#fafafa" }} />
                    <button onClick={askAI} disabled={aiLoading||!aiQuestion.trim()} style={{ ...S.btn, opacity:(aiLoading||!aiQuestion.trim())?0.4:1 }}>Ask</button>
                  </div>
                  {aiAnswer && (
                    <div style={{ background:"#f8f9fb", borderRadius:10, padding:"14px 16px", fontSize:14, color:TEXT, lineHeight:1.75, whiteSpace:"pre-wrap" }}>
                      <span style={{ color:PINK, fontWeight:700 }}>✦ </span>{aiAnswer}
                    </div>
                  )}
                  {aiLoading && <div style={{ fontSize:13, color:MUTED, marginTop:8 }}>✦ Thinking...</div>}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
