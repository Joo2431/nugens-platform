import React, { useState } from "react";

const BLUE = "#0284c7";
const BG   = "#06101a";
const CARD = "#0a1628";
const B    = "#1a2030";

const MOCK_JOBS = [
  { id:1, company:"TechNova Solutions", role:"Senior React Developer", location:"Remote", type:"Full-time", salary:"₹18-26 LPA", skills:["React","Node.js","PostgreSQL","AWS"], desc:"We're looking for a Senior React Developer to build scalable web applications. You'll work closely with our product team to deliver excellent user experiences. Strong proficiency in hooks, context API, and TypeScript preferred.", posted:"2 days ago", applicants:34, urgent:true },
  { id:2, company:"GreenLeaf Organics", role:"Social Media Manager", location:"Bangalore", type:"Full-time", salary:"₹5-8 LPA", skills:["Instagram","Content Writing","Canva","Analytics"], desc:"Manage and grow our social media presence across Instagram, LinkedIn, and YouTube. Create engaging content, run campaigns, and analyze performance. Prior experience with D2C brands preferred.", posted:"3 days ago", applicants:67, urgent:false },
  { id:3, company:"DesignCraft Studio", role:"UI/UX Designer", location:"Remote", type:"Contract", salary:"₹800-1200/hr", skills:["Figma","User Research","Prototyping","Webflow"], desc:"Join us as a freelance UI/UX designer for a 3-month project. You'll be designing mobile app interfaces for our fintech client. Strong portfolio required.", posted:"1 day ago", applicants:21, urgent:true },
  { id:4, company:"StartupXYZ", role:"Content Writer (B2B SaaS)", location:"Remote", type:"Part-time", salary:"₹25k-40k/month", skills:["B2B Writing","SEO","LinkedIn","Case Studies"], desc:"We need a skilled content writer specializing in B2B SaaS to create blog posts, case studies, and LinkedIn content. Strong research skills essential.", posted:"5 days ago", applicants:89, urgent:false },
  { id:5, company:"RetailRocket", role:"Digital Marketing Executive", location:"Mumbai", type:"Full-time", salary:"₹4-6 LPA", skills:["Google Ads","Meta Ads","SEO","Email Marketing"], desc:"Drive our performance marketing efforts across paid channels. Manage Google and Meta ad accounts, optimize campaigns, and report on ROI.", posted:"1 week ago", applicants:112, urgent:false },
  { id:6, company:"EdTech Ventures", role:"Video Editor & Content Creator", location:"Remote", type:"Full-time", salary:"₹3-5 LPA", skills:["Premiere Pro","After Effects","YouTube","Thumbnails"], desc:"Create and edit educational video content for our YouTube channel (500K subscribers). Ability to create engaging thumbnails and shorts is a plus.", posted:"4 days ago", applicants:56, urgent:false },
];

const FILTERS = ["All","Full-time","Part-time","Contract","Remote","Bangalore","Mumbai","Delhi"];

export default function JobBoard({ profile }) {
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("All");
  const [selected, setSelected] = useState(null);
  const [applied,  setApplied]  = useState([]);
  const [savedJobs,setSaved]    = useState([]);
  const [showApply,setShowApply]= useState(false);
  const [coverLetter,setCover]  = useState("");

  const filtered = MOCK_JOBS.filter(j => {
    const matchSearch = !search || j.role.toLowerCase().includes(search.toLowerCase()) || j.company.toLowerCase().includes(search.toLowerCase()) || j.skills.some(s=>s.toLowerCase().includes(search.toLowerCase()));
    const matchFilter = filter==="All" || j.type===filter || j.location===filter;
    return matchSearch && matchFilter;
  });

  const apply = (jobId) => {
    setApplied(a => [...a, jobId]);
    setShowApply(false);
    setCover("");
  };

  const toggleSave = (jobId) => setSaved(s => s.includes(jobId) ? s.filter(x=>x!==jobId) : [...s,jobId]);

  const S = {
    page: { minHeight:"100vh", background:BG, padding:"32px 40px", fontFamily:"'Plus Jakarta Sans',sans-serif" },
    h1: { fontSize:26, fontWeight:800, color:"#fff", letterSpacing:"-0.04em", marginBottom:4 },
    sub: { fontSize:13, color:"#445", marginBottom:28 },
    layout: { display:"grid", gridTemplateColumns:"1fr 400px", gap:24 },
    card: { background:CARD, border:`1px solid ${B}`, borderRadius:14, padding:20 },
    jobCard: (sel) => ({ background:CARD, border:`1px solid ${sel?BLUE:B}`, borderRadius:12, padding:18, marginBottom:10, cursor:"pointer", transition:"border-color 0.15s" }),
    btn: { padding:"10px 22px", background:BLUE, color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" },
    btnSm: { padding:"6px 14px", background:"none", color:BLUE, border:`1px solid ${BLUE}30`, borderRadius:7, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" },
    skill: { display:"inline-block", padding:"3px 8px", background:"#0d1624", border:`1px solid ${B}`, borderRadius:5, fontSize:11, color:"#556", marginRight:5, marginBottom:4 },
    pill: { padding:"5px 12px", borderRadius:20, fontSize:11, fontWeight:600, cursor:"pointer", border:"none", fontFamily:"inherit" },
    inp: { padding:"10px 14px", background:"#0d1624", border:`1px solid ${B}`, borderRadius:9, color:"#ccc", fontSize:13, fontFamily:"inherit", outline:"none", width:"100%", boxSizing:"border-box" },
  };

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>
      <div style={S.h1}>◇ Job Board</div>
      <div style={S.sub}>Jobs posted by DigiHub Business members — find your next opportunity</div>

      {/* Search & filters */}
      <div style={{ marginBottom:20 }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search roles, skills, companies..." style={{ ...S.inp, marginBottom:12 }} />
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {FILTERS.map(f => (
            <button key={f} onClick={()=>setFilter(f)} style={{ ...S.pill, background:filter===f?BLUE:"#0d1624", color:filter===f?"#fff":"#445", border:filter===f?"none":`1px solid ${B}` }}>{f}</button>
          ))}
        </div>
      </div>

      <div style={S.layout}>
        {/* Job List */}
        <div>
          <div style={{ fontSize:12, color:"#334", marginBottom:14 }}>{filtered.length} jobs found</div>
          {filtered.map(job => (
            <div key={job.id} style={S.jobCard(selected?.id===job.id)} onClick={()=>setSelected(job)}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
                    {job.urgent && <span style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.06em", color:"#ef4444", background:"#ef444415", border:"1px solid #ef444430", borderRadius:4, padding:"2px 6px" }}>Urgent</span>}
                    <span style={{ fontSize:12, color:"#334" }}>{job.posted}</span>
                  </div>
                  <div style={{ fontSize:16, fontWeight:700, color:"#fff", marginBottom:2 }}>{job.role}</div>
                  <div style={{ fontSize:13, color:"#556" }}>{job.company}</div>
                </div>
                <button onClick={e=>{e.stopPropagation();toggleSave(job.id)}} style={{ background:"none", border:"none", cursor:"pointer", fontSize:16, color:savedJobs.includes(job.id)?BLUE:"#334" }}>
                  {savedJobs.includes(job.id)?"★":"☆"}
                </button>
              </div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:8 }}>
                <span style={{ fontSize:12, color:"#445" }}>📍 {job.location}</span>
                <span style={{ fontSize:12, color:"#445" }}>💼 {job.type}</span>
                <span style={{ fontSize:12, color:BLUE, fontWeight:600 }}>💰 {job.salary}</span>
              </div>
              <div style={{ marginBottom:4 }}>
                {job.skills.slice(0,3).map(s=><span key={s} style={S.skill}>{s}</span>)}
                {job.skills.length>3 && <span style={{...S.skill,color:BLUE}}>+{job.skills.length-3}</span>}
              </div>
              <div style={{ fontSize:11, color:"#334" }}>{job.applicants} applicants</div>
            </div>
          ))}
        </div>

        {/* Job Detail */}
        <div>
          {selected ? (
            <div style={{ position:"sticky", top:24 }}>
              <div style={S.card}>
                <div style={{ marginBottom:16 }}>
                  {selected.urgent && <span style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.06em", color:"#ef4444", background:"#ef444415", border:"1px solid #ef444430", borderRadius:4, padding:"2px 6px", display:"inline-block", marginBottom:8 }}>Urgent Hire</span>}
                  <div style={{ fontSize:20, fontWeight:800, color:"#fff", letterSpacing:"-0.03em", marginBottom:4 }}>{selected.role}</div>
                  <div style={{ fontSize:14, color:"#556", marginBottom:12 }}>{selected.company}</div>
                  <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                    <span style={{ fontSize:12, color:"#445" }}>📍 {selected.location}</span>
                    <span style={{ fontSize:12, color:"#445" }}>💼 {selected.type}</span>
                  </div>
                  <div style={{ fontSize:16, fontWeight:700, color:BLUE, marginTop:8 }}>{selected.salary}</div>
                </div>

                <div style={{ borderTop:`1px solid ${B}`, paddingTop:16, marginBottom:16 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#445", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>About the Role</div>
                  <div style={{ fontSize:13, color:"#aaa", lineHeight:1.75 }}>{selected.desc}</div>
                </div>

                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#445", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Required Skills</div>
                  <div>{selected.skills.map(s=><span key={s} style={S.skill}>{s}</span>)}</div>
                </div>

                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:11, color:"#334" }}>{selected.applicants} people have applied · Posted {selected.posted}</div>
                </div>

                {applied.includes(selected.id) ? (
                  <div style={{ background:"#22c55e15", border:"1px solid #22c55e30", borderRadius:9, padding:"12px 16px", textAlign:"center" }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#22c55e" }}>✓ Applied Successfully</div>
                    <div style={{ fontSize:11, color:"#22c55e80", marginTop:4 }}>The company will review your application</div>
                  </div>
                ) : (
                  <div style={{ display:"flex", gap:10 }}>
                    <button onClick={()=>setShowApply(true)} style={{ ...S.btn, flex:1 }}>Apply Now</button>
                    <button onClick={()=>toggleSave(selected.id)} style={{ ...S.btnSm }}>
                      {savedJobs.includes(selected.id)?"★ Saved":"☆ Save"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ ...S.card, textAlign:"center", padding:48 }}>
              <div style={{ fontSize:32, marginBottom:12, opacity:0.2 }}>◇</div>
              <div style={{ fontSize:14, color:"#334" }}>Select a job to see details</div>
            </div>
          )}
        </div>
      </div>

      {/* Apply Modal */}
      {showApply && selected && (
        <div style={{ position:"fixed", inset:0, background:"#000b", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100 }}>
          <div style={{ background:"#0a1628", border:`1px solid ${B}`, borderRadius:18, padding:32, width:500 }}>
            <div style={{ fontSize:16, fontWeight:800, color:"#fff", marginBottom:4 }}>Apply for {selected.role}</div>
            <div style={{ fontSize:13, color:"#445", marginBottom:20 }}>at {selected.company}</div>

            <div style={{ fontSize:11, fontWeight:700, color:"#445", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>Cover Letter (optional)</div>
            <textarea
              value={coverLetter}
              onChange={e=>setCover(e.target.value)}
              placeholder="Introduce yourself and explain why you're a great fit for this role..."
              style={{ width:"100%", background:"#0d1624", border:`1px solid ${B}`, borderRadius:8, padding:12, color:"#ccc", fontSize:13, fontFamily:"inherit", minHeight:120, outline:"none", resize:"vertical", boxSizing:"border-box", marginBottom:16 }}
            />

            <div style={{ background:"#051018", border:`1px solid ${BLUE}20`, borderRadius:8, padding:"10px 14px", marginBottom:20 }}>
              <div style={{ fontSize:12, color:"#ccc" }}>Your profile will be shared with the employer. Make sure your profile is up to date at <a href="https://gene.nugens.in.net" style={{color:BLUE}}>Gen-E</a>.</div>
            </div>

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>apply(selected.id)} style={{ ...S.btn, flex:1 }}>Submit Application</button>
              <button onClick={()=>setShowApply(false)} style={{ flex:1, background:"none", border:`1px solid ${B}`, color:"#556", borderRadius:9, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
