import React, { useState } from "react";
import { Link } from "react-router-dom";

const PURPLE = "#7c3aed";
const PINK   = "#e8185d";
const B      = "#1e1e2e";

const ALL_COURSES = [
  { id: "wc-001", title: "Workplace Communication Mastery",        tag: "Communication",      lessons: 12, duration: "4h 20m", level: "Beginner",     color: PINK,     free: true  },
  { id: "sn-001", title: "Salary Negotiation That Actually Works", tag: "Career Strategy",    lessons: 8,  duration: "2h 45m", level: "Intermediate", color: "#0284c7", free: false },
  { id: "li-001", title: "LinkedIn Profile & Personal Brand",      tag: "Personal Brand",     lessons: 10, duration: "3h 10m", level: "Beginner",     color: PURPLE,   free: false },
  { id: "op-001", title: "Office Politics — Navigate Without Losing",tag: "Mindset",          lessons: 9,  duration: "3h 00m", level: "Intermediate", color: "#d97706", free: false },
  { id: "ip-001", title: "Interview Mastery: Any Role Any Company", tag: "Interview Prep",    lessons: 14, duration: "5h 15m", level: "Beginner",     color: PINK,     free: false },
  { id: "pm-001", title: "Professional Mindset Shift",             tag: "Mindset",            lessons: 7,  duration: "2h 30m", level: "Beginner",     color: "#16a34a", free: true  },
  { id: "en-001", title: "Business English for the Workplace",     tag: "Communication",      lessons: 11, duration: "4h 00m", level: "Beginner",     color: "#0284c7", free: false },
  { id: "lg-001", title: "Leadership Foundations",                 tag: "Leadership",         lessons: 10, duration: "3h 45m", level: "Advanced",     color: PURPLE,   free: false },
  { id: "tm-001", title: "Time Management at Work",                tag: "Productivity",       lessons: 8,  duration: "2h 20m", level: "Beginner",     color: "#d97706", free: true  },
  { id: "fb-001", title: "Giving & Receiving Feedback",            tag: "Communication",      lessons: 6,  duration: "1h 50m", level: "Intermediate", color: PINK,     free: false },
  { id: "pb-001", title: "Personal Branding Beyond LinkedIn",      tag: "Personal Brand",     lessons: 9,  duration: "3h 20m", level: "Intermediate", color: PURPLE,   free: false },
  { id: "rw-001", title: "Remote Work: Thrive Not Just Survive",   tag: "Productivity",       lessons: 7,  duration: "2h 40m", level: "Beginner",     color: "#16a34a", free: false },
];

const CATS = ["All", "Communication", "Career Strategy", "Mindset", "Interview Prep", "Personal Brand", "Leadership", "Productivity"];

export default function CoursesPage({ profile }) {
  const [activeTag, setActiveTag] = useState("All");
  const [search, setSearch] = useState("");
  const plan = profile?.plan || "free";

  const filtered = ALL_COURSES.filter(c => {
    const matchTag = activeTag === "All" || c.tag === activeTag;
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.tag.toLowerCase().includes(search.toLowerCase());
    return matchTag && matchSearch;
  });

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", padding: "32px 28px 80px", background: "#080814", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .hx-card { background: #0d0d1a; border: 1px solid ${B}; border-radius: 12px; padding: 20px; transition: all 0.18s; }
        .hx-card:hover { border-color: #2a2a3e; transform: translateY(-2px); }
        .hx-tag { display: inline-block; padding: 2px 9px; border-radius: 5px; font-size: 10.5px; font-weight: 600; letter-spacing: 0.04em; }
        .cat-pill { padding: 6px 14px; border-radius: 7px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid ${B}; background: transparent; color: #555; transition: all 0.13s; white-space: nowrap; }
        .cat-pill.on, .cat-pill:hover { background: #1a1a2a; color: #fff; border-color: #2a2a3e; }
        .search-input { width: 100%; padding: 10px 14px; background: #0d0d1a; border: 1px solid ${B}; border-radius: 9px; color: #fff; font-size: 13.5px; font-family: inherit; }
        .search-input:focus { outline: none; border-color: ${PURPLE}; }
        @media (max-width: 700px) { .grid3 { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontWeight: 800, fontSize: "clamp(20px,2.5vw,26px)", letterSpacing: "-0.03em", color: "#fff", marginBottom: 4 }}>Course Library</h1>
        <p style={{ fontSize: 13.5, color: "#555" }}>{ALL_COURSES.length} courses — real skills, no fluff.</p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 18 }}>
        <input className="search-input" placeholder="Search courses…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Category filters */}
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 28 }}>
        {CATS.map(cat => (
          <button key={cat} className={`cat-pill ${activeTag === cat ? "on" : ""}`} onClick={() => setActiveTag(cat)}>{cat}</button>
        ))}
      </div>

      {/* Upgrade banner for free users */}
      {plan === "free" && (
        <div style={{ background: `${PURPLE}15`, border: `1px solid ${PURPLE}30`, borderRadius: 12, padding: "16px 20px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff", marginBottom: 2 }}>Unlock all {ALL_COURSES.length} courses</div>
            <div style={{ fontSize: 12.5, color: "#666" }}>Free plan includes 3 courses. Upgrade to access everything.</div>
          </div>
          <Link to="/pricing" style={{ padding: "8px 18px", borderRadius: 8, background: PURPLE, color: "#fff", fontSize: 12.5, fontWeight: 700, textDecoration: "none" }}>Upgrade →</Link>
        </div>
      )}

      {/* Grid */}
      <div className="grid3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {filtered.map((course, i) => {
          const locked = plan === "free" && !course.free;
          return (
            <Link key={course.id} to={locked ? "/pricing" : `/courses/${course.id}`} style={{ textDecoration: "none" }}>
              <div className="hx-card" style={{ opacity: locked ? 0.6 : 1, position: "relative" }}>
                {locked && (
                  <div style={{ position: "absolute", top: 12, right: 12, background: "#1a1a2a", border: `1px solid ${B}`, borderRadius: 5, padding: "2px 8px", fontSize: 10, fontWeight: 600, color: "#555" }}>🔒</div>
                )}
                {course.free && (
                  <div style={{ position: "absolute", top: 12, right: 12, background: "#16a34a18", border: "1px solid #16a34a30", borderRadius: 5, padding: "2px 8px", fontSize: 10, fontWeight: 600, color: "#16a34a" }}>FREE</div>
                )}
                <div style={{ marginBottom: 12 }}>
                  <span className="hx-tag" style={{ background: course.color + "20", color: course.color }}>{course.tag}</span>
                </div>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: "#fff", lineHeight: 1.4, marginBottom: 10 }}>{course.title}</div>
                <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#555", flexWrap: "wrap" }}>
                  <span>{course.lessons} lessons</span>
                  <span>{course.duration}</span>
                  <span style={{ color: course.level === "Beginner" ? "#16a34a" : course.level === "Advanced" ? PINK : "#d97706" }}>{course.level}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#444" }}>
          <div style={{ fontSize: 22, marginBottom: 10 }}>◎</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#666" }}>No courses found</div>
          <div style={{ fontSize: 12.5, color: "#444", marginTop: 4 }}>Try a different search or category</div>
        </div>
      )}
    </div>
  );
}
