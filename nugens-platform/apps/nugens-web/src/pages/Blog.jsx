import React, { useState } from "react";
import { Link } from "react-router-dom";

const PINK = "#e8185d";
const B    = "#f0f0f0";

const POSTS = [
  {
    id: "ai-career-2025",
    cat: "AI & Careers", catColor: "#7c3aed",
    title: "How AI is transforming career opportunities in 2025",
    excerpt: "Artificial intelligence is reshaping how people learn, prepare, and get hired. Here's what every job seeker needs to know right now.",
    date: "Jan 2025", read: "5 min read",
    featured: true,
  },
  {
    id: "digital-presence",
    cat: "Digital Marketing", catColor: "#0284c7",
    title: "Why digital presence is no longer optional for brands",
    excerpt: "From startups to enterprises, a strong digital footprint decides who wins attention and trust in a crowded market.",
    date: "Dec 2024", read: "4 min read",
  },
  {
    id: "visual-storytelling",
    cat: "Creative", catColor: "#d97706",
    title: "The power of visual storytelling in brand building",
    excerpt: "Photography, video, and design are no longer aesthetics — they are strategy. Here's how to use them intentionally.",
    date: "Dec 2024", read: "6 min read",
  },
  {
    id: "skill-gap",
    cat: "Education", catColor: PINK,
    title: "Bridging the skill gap: learning beyond degrees",
    excerpt: "Why practical learning and mentorship matter more than traditional education alone — and what to do about it.",
    date: "Nov 2024", read: "5 min read",
  },
  {
    id: "salary-negotiation",
    cat: "Career Strategy", catColor: "#059669",
    title: "Salary negotiation: what to say, when to say it",
    excerpt: "Most freshers leave 20–30% on the table in their first offer. This is how you don't.",
    date: "Nov 2024", read: "4 min read",
  },
  {
    id: "workplace-culture",
    cat: "Workplace", catColor: "#6b7280",
    title: "Office politics: navigate without burning bridges",
    excerpt: "Nobody teaches you how to survive the first 90 days at a new company. We do.",
    date: "Oct 2024", read: "7 min read",
  },
];

const CATS = ["All", "AI & Careers", "Digital Marketing", "Creative", "Education", "Career Strategy", "Workplace"];

export default function Blog() {
  const [active, setActive] = useState("All");
  const filtered = active === "All" ? POSTS : POSTS.filter(p => p.cat === active);
  const featured = POSTS.find(p => p.featured);
  const rest     = filtered.filter(p => !p.featured || active !== "All");

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'Plus Jakarta Sans',sans-serif; }

        .blog-cat-btn {
          padding:6px 14px; border-radius:6px; font-size:12.5px; font-weight:500;
          color:#6b7280; background:transparent; border:1px solid transparent;
          cursor:pointer; transition:all 0.13s; font-family:'Plus Jakarta Sans',sans-serif;
          white-space:nowrap;
        }
        .blog-cat-btn.on { background:#fff; border-color:${B}; color:#0a0a0a; box-shadow:0 1px 4px rgba(0,0,0,0.06); }
        .blog-cat-btn:hover:not(.on) { color:#0a0a0a; }

        .blog-card {
          background:#fff; border:1px solid ${B}; border-radius:12px; padding:24px;
          text-decoration:none; display:flex; flex-direction:column;
          transition:border-color 0.18s, box-shadow 0.18s;
        }
        .blog-card:hover { border-color:#e0e0e0; box-shadow:0 4px 24px rgba(0,0,0,0.06); }

        @media(max-width:740px) {
          .blog-featured { grid-template-columns:1fr !important; }
          .blog-grid { grid-template-columns:1fr !important; }
        }
      `}</style>

      {/* ── HERO ── */}
      <section style={{ padding:"72px 24px 48px", background:"#fff", borderBottom:`1px solid ${B}` }}>
        <div style={{ maxWidth:1060, margin:"0 auto" }}>
          <span style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 12px",
            borderRadius:6, border:`1px solid ${B}`, fontSize:11.5, fontWeight:500, color:"#6b7280",
            background:"#fff", marginBottom:16 }}>Blog & Insights</span>
          <h1 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800,
            fontSize:"clamp(26px,3.5vw,40px)", letterSpacing:"-0.035em", color:"#0a0a0a",
            marginBottom:12, lineHeight:1.2 }}>
            Thinking out loud<br /><span style={{ color:PINK }}>on careers, brands & work</span>
          </h1>
          <p style={{ fontSize:15, color:"#6b7280", lineHeight:1.7, maxWidth:440 }}>
            Ideas, strategies, and honest takes on AI, professional growth, digital marketing, and the future of work.
          </p>
        </div>
      </section>

      {/* ── FILTER ── */}
      <div style={{ background:"#fafafa", borderBottom:`1px solid ${B}`, padding:"14px 24px", overflowX:"auto" }}>
        <div style={{ maxWidth:1060, margin:"0 auto", display:"flex", gap:6 }}>
          {CATS.map(c => (
            <button key={c} className={`blog-cat-btn ${active===c?"on":""}`} onClick={() => setActive(c)}>{c}</button>
          ))}
        </div>
      </div>

      <div style={{ background:"#fff", padding:"48px 24px 80px" }}>
        <div style={{ maxWidth:1060, margin:"0 auto" }}>

          {/* ── FEATURED (All tab only) ── */}
          {active === "All" && featured && (
            <div style={{ marginBottom:40 }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em",
                color:"#9ca3af", marginBottom:16 }}>Featured</div>
              <Link to={`/blog/${featured.id}`}
                style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:0,
                  background:"#0a0a0a", borderRadius:14, overflow:"hidden", textDecoration:"none" }}
                className="blog-featured">
                <div style={{ padding:"40px 40px 44px" }}>
                  <span style={{ display:"inline-block", fontSize:11, fontWeight:700,
                    textTransform:"uppercase", letterSpacing:"0.07em", color:featured.catColor,
                    marginBottom:16 }}>{featured.cat}</span>
                  <h2 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700,
                    fontSize:"clamp(18px,2.2vw,24px)", letterSpacing:"-0.025em", color:"#fff",
                    lineHeight:1.3, marginBottom:14 }}>{featured.title}</h2>
                  <p style={{ fontSize:13.5, color:"#888", lineHeight:1.7, marginBottom:28 }}>{featured.excerpt}</p>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <span style={{ fontSize:12, color:"#555" }}>{featured.date}</span>
                    <span style={{ width:3, height:3, borderRadius:"50%", background:"#333" }} />
                    <span style={{ fontSize:12, color:"#555" }}>{featured.read}</span>
                    <span style={{ marginLeft:"auto", fontSize:13, fontWeight:600, color:PINK }}>Read →</span>
                  </div>
                </div>
                <div style={{ background:"#111", display:"flex", alignItems:"center", justifyContent:"center", minHeight:200 }}>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:52, marginBottom:8 }}>🤖</div>
                    <div style={{ fontSize:12, color:"#555" }}>AI & Careers</div>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* ── GRID ── */}
          <div className="blog-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
            {rest.map(p => (
              <Link key={p.id} to={`/blog/${p.id}`} className="blog-card">
                <span style={{ display:"inline-block", fontSize:11, fontWeight:700,
                  textTransform:"uppercase", letterSpacing:"0.07em", color:p.catColor, marginBottom:14 }}>
                  {p.cat}
                </span>
                <h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700,
                  fontSize:15.5, letterSpacing:"-0.02em", color:"#0a0a0a", lineHeight:1.4,
                  marginBottom:10, flex:1 }}>{p.title}</h3>
                <p style={{ fontSize:13, color:"#6b7280", lineHeight:1.65, marginBottom:20 }}>{p.excerpt}</p>
                <div style={{ display:"flex", alignItems:"center", gap:10, paddingTop:14,
                  borderTop:`1px solid #f7f7f7`, marginTop:"auto" }}>
                  <span style={{ fontSize:12, color:"#9ca3af" }}>{p.date}</span>
                  <span style={{ width:3, height:3, borderRadius:"50%", background:"#e0e0e0" }} />
                  <span style={{ fontSize:12, color:"#9ca3af" }}>{p.read}</span>
                  <span style={{ marginLeft:"auto", fontSize:12.5, fontWeight:600, color:PINK }}>Read →</span>
                </div>
              </Link>
            ))}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign:"center", padding:"60px 0", color:"#9ca3af", fontSize:14 }}>
              No posts in this category yet.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
