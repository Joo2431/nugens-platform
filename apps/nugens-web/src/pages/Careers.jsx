import React, { useState } from "react";
import { Link } from "react-router-dom";

const PINK = "#e8185d";
const B    = "#f0f0f0";

const JOBS = [
  {
    id: 1, title: "Website Developer", type: "Full-time / Freelance",
    team: "Engineering", color: "#7c3aed",
    description: "Build, maintain, and optimise websites and web apps for Nugens and our clients using modern frameworks.",
    responsibilities: [
      "Develop sites using React, HTML, CSS, JS, Shopify, WordPress",
      "Maintain Git repositories and code quality standards",
      "Ensure responsive, performant, and SEO-friendly builds",
      "Collaborate with designers and the marketing team",
    ],
    skills: ["HTML / CSS", "JavaScript", "React", "Git", "Shopify / WordPress"],
  },
  {
    id: 2, title: "Graphic Designer", type: "Full-time / Freelance",
    team: "Creative", color: PINK,
    description: "Create visually compelling designs for brands, ads, and digital platforms across the Nugens ecosystem.",
    responsibilities: [
      "Design social media creatives and marketing assets",
      "Build brand identity kits and visual systems",
      "Work closely with the content and strategy team",
      "Maintain visual consistency across platforms",
    ],
    skills: ["Photoshop", "Canva", "Figma", "Illustrator"],
  },
  {
    id: 3, title: "Video Editor", type: "Full-time / Freelance",
    team: "Production", color: "#d97706",
    description: "Edit high-quality videos for brands, wedding films, ads, and social media content for Units and DigiHub.",
    responsibilities: [
      "Edit reels, highlights, and long-form videos",
      "Add motion graphics, titles, and transitions",
      "Colour grade and master audio for final delivery",
      "Optimise content for different social platforms",
    ],
    skills: ["Premiere Pro", "After Effects", "DaVinci Resolve", "CapCut"],
  },
  {
    id: 4, title: "Content & Social Media Associate", type: "Full-time",
    team: "Marketing", color: "#0284c7",
    description: "Manage content strategy and social media presence for Nugens and its client brands under DigiHub.",
    responsibilities: [
      "Create ad creative and organic content briefs",
      "Manage social media accounts and community",
      "Plan content calendars and strategy decks",
      "Track performance and report insights",
    ],
    skills: ["Content Writing", "Social Media Strategy", "Analytics", "Canva"],
  },
  {
    id: 5, title: "HyperX Trainer / Facilitator", type: "Part-time / Contract",
    team: "Education", color: "#059669",
    description: "Deliver HyperX's professional skills curriculum to students — live sessions, mock interviews, and workplace scenario coaching.",
    responsibilities: [
      "Conduct live and recorded HyperX training sessions",
      "Run mock interviews and salary negotiation workshops",
      "Evaluate student progress and give structured feedback",
      "Improve and update module content quarterly",
    ],
    skills: ["Communication", "Facilitation", "HR or Workplace Expertise", "Coaching"],
  },
  {
    id: 6, title: "Office & Operations Associate", type: "Full-time",
    team: "Operations", color: "#6b7280",
    description: "Handle internal operations, client coordination, and day-to-day office administration for Nugens.",
    responsibilities: [
      "Client communication and scheduling",
      "Documentation, reports, and follow-ups",
      "Vendor and partner coordination",
      "Basic accounting and expense tracking",
    ],
    skills: ["English Communication", "MS Office", "Organisation", "Customer Service"],
  },
];

const TEAM_COLORS = { Engineering:"#7c3aed", Creative:PINK, Production:"#d97706", Marketing:"#0284c7", Education:"#059669", Operations:"#6b7280" };

function Reveal({ children }) {
  return <div>{children}</div>;
}

export default function Careers() {
  const [activeJob, setActiveJob] = useState(null);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'Plus Jakarta Sans',sans-serif; }

        .job-card {
          background:#fff; border:1px solid ${B}; border-radius:12px;
          overflow:hidden; transition:border-color 0.18s;
        }
        .job-card:hover { border-color:#e0e0e0; }

        .job-header {
          display:flex; align-items:center; justify-content:space-between;
          padding:22px 24px; cursor:pointer; gap:12px;
        }

        .apply-btn {
          display:inline-flex; align-items:center; gap:7px;
          padding:10px 22px; border-radius:8px; background:${PINK};
          color:#fff; font-size:13px; font-weight:600; border:none;
          text-decoration:none; cursor:pointer; transition:opacity 0.14s;
          box-shadow:0 2px 10px rgba(232,24,93,0.25);
          font-family:'Plus Jakarta Sans',sans-serif;
        }
        .apply-btn:hover { opacity:0.88; }

        .skill-tag {
          display:inline-block; padding:4px 10px; border-radius:6px;
          background:#f3f4f6; color:#374151; font-size:11.5px; font-weight:500;
        }

        .value-card {
          padding:22px; border-radius:10px; border:1px solid ${B};
          background:#fff; transition:border-color 0.18s;
        }
        .value-card:hover { border-color:#fcc8d6; }

        @media(max-width:740px) {
          .careers-grid { grid-template-columns:1fr !important; }
          .job-header { flex-wrap:wrap; }
        }
      `}</style>

      {/* ── HERO ── */}
      <section style={{ padding:"80px 24px 64px", background:"#fff", borderBottom:`1px solid ${B}`,
        position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, pointerEvents:"none",
          backgroundImage:`linear-gradient(${B} 1px,transparent 1px),linear-gradient(90deg,${B} 1px,transparent 1px)`,
          backgroundSize:"52px 52px", opacity:0.35 }} />
        <div style={{ maxWidth:700, margin:"0 auto", textAlign:"center", position:"relative", zIndex:2 }}>
          <span style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 12px",
            borderRadius:6, border:`1px solid ${B}`, fontSize:11.5, fontWeight:500, color:"#6b7280",
            background:"#fff", marginBottom:18 }}>We're hiring</span>
          <h1 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800,
            fontSize:"clamp(26px,3.5vw,44px)", letterSpacing:"-0.035em", color:"#0a0a0a",
            lineHeight:1.15, marginBottom:16 }}>
            Build the future of careers<br /><span style={{ color:PINK }}>with Nugens</span>
          </h1>
          <p style={{ fontSize:15.5, color:"#6b7280", lineHeight:1.72, maxWidth:460, margin:"0 auto 28px" }}>
            We're a small team building AI, education, marketing, and production products that genuinely help people. If you care about real work, this is for you.
          </p>
          <div style={{ display:"flex", justifyContent:"center", gap:10, flexWrap:"wrap" }}>
            <a href="#openings" style={{ padding:"10px 22px", borderRadius:8, background:"#0a0a0a",
              color:"#fff", fontSize:13.5, fontWeight:600, textDecoration:"none" }}>
              See openings →
            </a>
            <Link to="/about" style={{ padding:"10px 22px", borderRadius:8, border:`1px solid ${B}`,
              background:"#fff", color:"#374151", fontSize:13.5, fontWeight:500, textDecoration:"none" }}>
              About us
            </Link>
          </div>
        </div>
      </section>

      {/* ── VALUES ── */}
      <section style={{ padding:"64px 24px", background:"#fafafa", borderBottom:`1px solid ${B}` }}>
        <div style={{ maxWidth:1060, margin:"0 auto" }}>
          <span style={{ display:"inline-flex", padding:"4px 12px", borderRadius:6, border:`1px solid ${B}`,
            fontSize:11.5, fontWeight:500, color:"#6b7280", background:"#fff", marginBottom:14 }}>
            Why Nugens
          </span>
          <h2 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700,
            fontSize:"clamp(20px,2.8vw,28px)", letterSpacing:"-0.03em", color:"#0a0a0a",
            marginBottom:32, marginTop:10 }}>What it's like to work here</h2>
          <div className="careers-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
            {[
              { icon:"◎", t:"Real ownership", d:"We're a small team. You will own things, not just assist on things." },
              { icon:"⬡", t:"Cross-functional", d:"Work across AI, design, production, and education — not siloed into one thing." },
              { icon:"◈", t:"Built in public", d:"You'll see the impact of your work in real products used by real people." },
              { icon:"◇", t:"Growth first", d:"Every role here is a learning role. We invest in the people who invest in their work." },
            ].map((v, i) => (
              <div key={v.t} className="value-card">
                <div style={{ fontSize:20, color:PINK, marginBottom:12, fontWeight:300, lineHeight:1 }}>{v.icon}</div>
                <h4 style={{ fontSize:13.5, fontWeight:600, color:"#0a0a0a", marginBottom:7, letterSpacing:"-0.01em" }}>{v.t}</h4>
                <p style={{ fontSize:13, color:"#9ca3af", lineHeight:1.65 }}>{v.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── JOB LISTINGS ── */}
      <section id="openings" style={{ padding:"64px 24px 80px", background:"#fff" }}>
        <div style={{ maxWidth:820, margin:"0 auto" }}>
          <span style={{ display:"inline-flex", padding:"4px 12px", borderRadius:6, border:`1px solid ${B}`,
            fontSize:11.5, fontWeight:500, color:"#6b7280", background:"#fff", marginBottom:14 }}>
            Open roles
          </span>
          <h2 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700,
            fontSize:"clamp(20px,2.8vw,28px)", letterSpacing:"-0.03em", color:"#0a0a0a",
            marginBottom:32, marginTop:10 }}>Current openings</h2>

          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {JOBS.map(job => (
              <div key={job.id} className="job-card">
                <div className="job-header" onClick={() => setActiveJob(activeJob === job.id ? null : job.id)}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:5 }}>
                      <h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700,
                        fontSize:16, color:"#0a0a0a", letterSpacing:"-0.02em" }}>{job.title}</h3>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                      <span style={{ fontSize:11, fontWeight:700, textTransform:"uppercase",
                        letterSpacing:"0.06em", color:job.color, padding:"2px 8px", borderRadius:5,
                        background:`${job.color}12` }}>{job.team}</span>
                      <span style={{ fontSize:12, color:"#9ca3af" }}>{job.type}</span>
                    </div>
                  </div>
                  <button style={{ background:"none", border:"none", cursor:"pointer",
                    fontSize:13, fontWeight:600, color:PINK, flexShrink:0,
                    fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                    {activeJob === job.id ? "Collapse ↑" : "View role ↓"}
                  </button>
                </div>

                {activeJob === job.id && (
                  <div style={{ padding:"0 24px 28px", borderTop:`1px solid ${B}` }}>
                    <p style={{ fontSize:14, color:"#374151", lineHeight:1.7, marginBottom:20, marginTop:20 }}>
                      {job.description}
                    </p>

                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24, marginBottom:24 }}>
                      <div>
                        <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase",
                          letterSpacing:"0.07em", color:"#9ca3af", marginBottom:12 }}>Responsibilities</div>
                        {job.responsibilities.map((r, i) => (
                          <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:9,
                            marginBottom:9, fontSize:13.5, color:"#374151", lineHeight:1.55 }}>
                            <span style={{ color:job.color, flexShrink:0, marginTop:1 }}>✓</span> {r}
                          </div>
                        ))}
                      </div>
                      <div>
                        <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase",
                          letterSpacing:"0.07em", color:"#9ca3af", marginBottom:12 }}>Skills & tools</div>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                          {job.skills.map(s => (
                            <span key={s} className="skill-tag">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <a href={`mailto:careers@nugens.in?subject=Application: ${job.title}`}
                      className="apply-btn">
                      Apply for this role →
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* general applications */}
          <div style={{ marginTop:32, padding:"24px", borderRadius:12, background:"#0a0a0a",
            display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
            <div>
              <div style={{ fontSize:14.5, fontWeight:700, color:"#fff", marginBottom:4 }}>
                Don't see your role?
              </div>
              <div style={{ fontSize:13, color:"#888" }}>
                We're always open to strong people. Send a general application.
              </div>
            </div>
            <a href="mailto:careers@nugens.in?subject=General Application"
              style={{ padding:"10px 20px", borderRadius:8, background:PINK, color:"#fff",
                fontSize:13, fontWeight:600, textDecoration:"none", whiteSpace:"nowrap",
                boxShadow:`0 2px 10px ${PINK}40` }}>
              Send application →
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
