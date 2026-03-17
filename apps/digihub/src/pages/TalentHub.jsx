import React, { useState } from "react";

const BLUE = "#0284c7";
const PINK = "#e8185d";
const B    = "#1a2030";

const SKILLS = ["All","Social Media","SEO","Performance Ads","Content Writing","Video Editing","Brand Design","Email Marketing"];

const TALENT = [
  { id:1, name:"Priya Sharma",    skill:"Social Media",     exp:"Fresher",    location:"Chennai",   match:94, status:"Available", bio:"Gen-E + HyperX grad. Managed 3 brand accounts during internship. Strong reels and story strategy.", tags:["Instagram","Reels","Content Calendar"], score:87 },
  { id:2, name:"Karthik Rajan",   skill:"SEO",              exp:"6 months",   location:"Bangalore", match:88, status:"Available", bio:"Certified in Google Analytics & SEMrush. Grew organic traffic 40% for a local e-commerce brand.", tags:["SEO","SEM","Analytics","Blogging"], score:82 },
  { id:3, name:"Divya Menon",     skill:"Performance Ads",  exp:"1 year",     location:"Kochi",     match:91, status:"Placed",    bio:"Managed ₹2L/month ad budgets. Specializes in Meta Ads with proven 3× ROAS on beauty brand.", tags:["Meta Ads","Google Ads","Funnels"], score:90 },
  { id:4, name:"Arjun Nair",      skill:"Content Writing",  exp:"Fresher",    location:"Coimbatore",match:79, status:"Available", bio:"Strong writer with niche in tech, fitness, and finance. Built personal blog to 5K monthly readers.", tags:["Copywriting","Blogging","LinkedIn"], score:75 },
  { id:5, name:"Sneha Iyer",      skill:"Video Editing",    exp:"8 months",   location:"Mumbai",    match:85, status:"Available", bio:"Edited 100+ reels and YouTube videos. Proficient in Premiere Pro, CapCut, and After Effects.", tags:["Reels","YouTube","After Effects"], score:80 },
  { id:6, name:"Rahul Krishnan",  skill:"Brand Design",     exp:"1 year",     location:"Hyderabad", match:92, status:"Interview", bio:"Figma-first designer. Created brand kits for 5 SMBs. Strong in social templates and pitch decks.", tags:["Figma","Canva","Brand Kits"], score:88 },
  { id:7, name:"Meera Pillai",    skill:"Email Marketing",  exp:"Fresher",    location:"Pune",      match:76, status:"Available", bio:"Klaviyo certified. Built email flows for a D2C skincare brand with 28% open rate.", tags:["Klaviyo","Mailchimp","Automation"], score:72 },
  { id:8, name:"Vikram Suresh",   skill:"Social Media",     exp:"2 years",    location:"Chennai",   match:89, status:"Available", bio:"Managed social for 8 brands across F&B, fitness, and tech. Strong community management.", tags:["Community","Analytics","Campaigns"], score:84 },
];

export default function TalentHub() {
  const [filter, setFilter]     = useState("All");
  const [search, setSearch]     = useState("");
  const [selected, setSelected] = useState(null);

  const filtered = TALENT.filter(t =>
    (filter==="All" || t.skill===filter) &&
    (t.name.toLowerCase().includes(search.toLowerCase()) || t.skill.toLowerCase().includes(search.toLowerCase()))
  );

  const statusColor = (s) => s==="Available"?"#16a34a":s==="Placed"?"#d97706":BLUE;

  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", padding:"32px 28px 80px", background:"#06101a", minHeight:"100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .talent-card { background:#080f1a; border:1px solid ${B}; border-radius:12px; padding:18px; cursor:pointer; transition:all 0.18s; }
        .talent-card:hover { border-color:#243040; transform:translateY(-1px); }
        .talent-card.sel { border-color:${BLUE}60; background:#0a1628; }
        .skill-chip { padding:3px 9px; border-radius:5px; font-size:10.5px; font-weight:600; background:#1a2030; color:#556; }
        .tag { display:inline-block; padding:2px 7px; border-radius:4px; font-size:10.5px; font-weight:600; background:#1a2030; color:#445; }
        .filter-btn { padding:5px 14px; border-radius:7px; font-size:12px; font-weight:600; cursor:pointer; border:1px solid ${B}; font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.13s; }
        .filter-btn.on { background:${BLUE}; color:#fff; border-color:${BLUE}; }
        .filter-btn.off { background:transparent; color:#445; }
        .filter-btn.off:hover { color:#aaa; border-color:#243040; }
        .dh-input { padding:9px 14px; background:#080f1a; border:1px solid ${B}; border-radius:8px; color:#ddd; font-size:13.5px; font-family:'Plus Jakarta Sans',sans-serif; outline:none; }
        .dh-input:focus { border-color:${BLUE}60; }
        .dh-input::placeholder { color:#334; }
        @media (max-width:900px) { .talent-layout { grid-template-columns:1fr !important; } }
        @media (max-width:700px) { .talent-g { grid-template-columns:1fr !important; } }
      `}</style>

      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontWeight:800, fontSize:"clamp(20px,2.5vw,26px)", letterSpacing:"-0.03em", color:"#fff", marginBottom:4 }}>Talent Hub</h1>
        <p style={{ fontSize:13.5, color:"#445" }}>Find and connect with Gen-E + HyperX trained digital marketing talent.</p>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:24 }}>
        {[
          { label:"Total talent",   value:TALENT.length,                                    color:BLUE     },
          { label:"Available now",  value:TALENT.filter(t=>t.status==="Available").length,   color:"#16a34a"},
          { label:"Placed",         value:TALENT.filter(t=>t.status==="Placed").length,      color:"#d97706"},
          { label:"In interview",   value:TALENT.filter(t=>t.status==="Interview").length,   color:PINK     },
        ].map(s => (
          <div key={s.label} style={{ background:"#080f1a", border:`1px solid ${B}`, borderRadius:10, padding:"14px 16px" }}>
            <div style={{ fontSize:22, fontWeight:800, color:s.color, letterSpacing:"-0.04em" }}>{s.value}</div>
            <div style={{ fontSize:11.5, color:"#445", marginTop:3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
        <input className="dh-input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or skill..." style={{ width:220 }} />
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {SKILLS.map(s => (
            <button key={s} className={`filter-btn ${filter===s?"on":"off"}`} onClick={() => setFilter(s)}>{s}</button>
          ))}
        </div>
      </div>

      <div className="talent-layout" style={{ display:"grid", gridTemplateColumns:"1fr 380px", gap:16, alignItems:"start" }}>
        {/* Grid */}
        <div className="talent-g" style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 }}>
          {filtered.map(t => (
            <div key={t.id} className={`talent-card${selected?.id===t.id?" sel":""}`} onClick={() => setSelected(t)}>
              <div style={{ display:"flex", gap:12, alignItems:"flex-start", marginBottom:12 }}>
                <div style={{ width:40, height:40, borderRadius:"50%", background:`${BLUE}20`, border:`1px solid ${BLUE}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:800, color:BLUE, flexShrink:0 }}>
                  {t.name.split(" ").map(w=>w[0]).join("")}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:"#ddd", marginBottom:1 }}>{t.name}</div>
                  <div style={{ fontSize:12, color:"#445" }}>{t.skill} · {t.location}</div>
                </div>
                <div style={{ fontSize:18, fontWeight:800, color:BLUE, letterSpacing:"-0.03em" }}>{t.match}%</div>
              </div>
              <div style={{ fontSize:12.5, color:"#556", lineHeight:1.6, marginBottom:10 }}>{t.bio}</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                <span className="tag" style={{ background:statusColor(t.status)+"18", color:statusColor(t.status) }}>{t.status}</span>
                <span className="tag">{t.exp}</span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn:"1/-1", textAlign:"center", padding:60, color:"#334" }}>No talent found matching your filter.</div>
          )}
        </div>

        {/* Profile panel */}
        {selected ? (
          <div style={{ background:"#080f1a", border:`1px solid ${B}`, borderRadius:14, padding:24, position:"sticky", top:20 }}>
            <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:20 }}>
              <div style={{ width:52, height:52, borderRadius:"50%", background:`${BLUE}20`, border:`1px solid ${BLUE}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:800, color:BLUE }}>
                {selected.name.split(" ").map(w=>w[0]).join("")}
              </div>
              <div>
                <div style={{ fontSize:16, fontWeight:800, color:"#fff", letterSpacing:"-0.02em" }}>{selected.name}</div>
                <div style={{ fontSize:12.5, color:"#445" }}>{selected.location} · {selected.exp}</div>
              </div>
            </div>

            <div style={{ marginBottom:18 }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#445", marginBottom:8 }}>Match score</div>
              <div style={{ height:8, background:"#0d1624", borderRadius:99, overflow:"hidden" }}>
                <div style={{ width:`${selected.match}%`, height:"100%", background:BLUE, borderRadius:99 }} />
              </div>
              <div style={{ fontSize:13, fontWeight:700, color:BLUE, marginTop:6 }}>{selected.match}% match</div>
            </div>

            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#445", marginBottom:8 }}>About</div>
              <p style={{ fontSize:13, color:"#aaa", lineHeight:1.7 }}>{selected.bio}</p>
            </div>

            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#445", marginBottom:8 }}>Skills</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {selected.tags.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#445", marginBottom:8 }}>Status</div>
              <span style={{ padding:"4px 12px", borderRadius:6, fontSize:12.5, fontWeight:700, background:statusColor(selected.status)+"18", color:statusColor(selected.status) }}>{selected.status}</span>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <button style={{ padding:"11px 0", background:BLUE, color:"#fff", border:"none", borderRadius:9, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                Request introduction
              </button>
              <button style={{ padding:"11px 0", background:"transparent", color:"#556", border:`1px solid ${B}`, borderRadius:9, fontSize:14, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                Save to shortlist
              </button>
            </div>
          </div>
        ) : (
          <div style={{ background:"#080f1a", border:`1px solid ${B}`, borderRadius:14, padding:40, textAlign:"center" }}>
            <div style={{ fontSize:28, marginBottom:12 }}>◇</div>
            <div style={{ fontSize:13.5, color:"#334" }}>Select a profile to view details</div>
          </div>
        )}
      </div>
    </div>
  );
}
