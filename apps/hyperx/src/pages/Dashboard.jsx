import React from "react";
import { Link } from "react-router-dom";

const PURPLE = "#7c3aed";
const PINK   = "#e8185d";
const B      = "#1e1e2e";

const FEATURED_COURSES = [
  { id: "wc-001", title: "Workplace Communication Mastery", tag: "Communication", lessons: 12, duration: "4h 20m", progress: 65, color: PINK },
  { id: "sn-001", title: "Salary Negotiation That Actually Works", tag: "Career Strategy", lessons: 8, duration: "2h 45m", progress: 0, color: "#0284c7" },
  { id: "li-001", title: "LinkedIn Profile & Personal Brand", tag: "Personal Brand", lessons: 10, duration: "3h 10m", progress: 30, color: PURPLE },
  { id: "op-001", title: "Office Politics — Navigate Without Losing", tag: "Professional Mindset", lessons: 9, duration: "3h 00m", progress: 0, color: "#d97706" },
];

const LEARNING_PATHS = [
  { id: "path-001", title: "Fresher to Pro", tag: "Career Launch", courses: 5, duration: "18h", color: PINK, enrolled: true },
  { id: "path-002", title: "Communication Excellence", tag: "Soft Skills", courses: 4, duration: "14h", color: "#0284c7", enrolled: false },
  { id: "path-003", title: "Career Growth Accelerator", tag: "Growth", courses: 6, duration: "22h", color: PURPLE, enrolled: false },
];

export default function HXDashboard({ profile }) {
  const plan = profile?.plan || "free";
  const firstName = (profile?.full_name || "").split(" ")[0] || "there";

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", padding: "32px 28px 80px", background: "#080814", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .hx-card { background: #0d0d1a; border: 1px solid ${B}; border-radius: 12px; padding: 20px; transition: border-color 0.18s; }
        .hx-card:hover { border-color: #2a2a3e; }
        .progress-bar { height: 4px; background: #1a1a2a; border-radius: 99px; overflow: hidden; margin-top: 10px; }
        .progress-fill { height: 100%; border-radius: 99px; }
        .hx-tag { display: inline-block; padding: 2px 9px; border-radius: 5px; font-size: 10.5px; font-weight: 600; letter-spacing: 0.04em; }
        .stat { background: #0d0d1a; border: 1px solid ${B}; border-radius: 10px; padding: 16px 18px; }
        @media (max-width: 700px) { .courses-grid { grid-template-columns: 1fr !important; } .stats-row { grid-template-columns: 1fr 1fr !important; } }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontWeight: 800, fontSize: "clamp(20px,2.5vw,26px)", letterSpacing: "-0.03em", color: "#fff", marginBottom: 4 }}>
          Hey {firstName} 👋
        </h1>
        <p style={{ fontSize: 13.5, color: "#555" }}>Keep learning — your career is being built one lesson at a time.</p>
      </div>

      {/* Stats */}
      <div className="stats-row" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 36 }}>
        {[
          { label: "Courses started",  value: "3",   sub: "In progress",    color: PURPLE },
          { label: "Hours learned",    value: "8.4", sub: "This month",     color: PINK },
          { label: "Lessons done",     value: "24",  sub: "Total",          color: "#0284c7" },
          { label: "Certificates",     value: plan === "free" ? "—" : "1", sub: plan === "free" ? "Upgrade to earn" : "Earned", color: "#d97706" },
        ].map(s => (
          <div key={s.label} className="stat">
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#444", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.04em", color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11.5, color: "#444", marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Continue learning */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#444" }}>Continue learning</div>
          <Link to="/courses" style={{ fontSize: 12, color: PURPLE, textDecoration: "none", fontWeight: 600 }}>All courses →</Link>
        </div>
        <div className="courses-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
          {FEATURED_COURSES.filter(c => c.progress > 0).map(course => (
            <Link key={course.id} to={`/courses/${course.id}`} style={{ textDecoration: "none" }}>
              <div className="hx-card">
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                  <span className="hx-tag" style={{ background: course.color + "20", color: course.color }}>{course.tag}</span>
                  <span style={{ fontSize: 11, color: "#444" }}>{course.lessons} lessons</span>
                </div>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: "#fff", lineHeight: 1.4, marginBottom: 6 }}>{course.title}</div>
                <div style={{ fontSize: 11.5, color: "#555" }}>{course.duration}</div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${course.progress}%`, background: course.color }} />
                </div>
                <div style={{ fontSize: 11, color: "#444", marginTop: 5 }}>{course.progress}% complete</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recommended */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#444", marginBottom: 16 }}>Recommended for you</div>
        <div className="courses-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
          {FEATURED_COURSES.filter(c => c.progress === 0).map(course => (
            <Link key={course.id} to={`/courses/${course.id}`} style={{ textDecoration: "none" }}>
              <div className="hx-card" style={{ position: "relative" }}>
                {plan === "free" && (
                  <div style={{
                    position: "absolute", top: 12, right: 12,
                    background: "#1a1a2a", border: `1px solid ${B}`,
                    borderRadius: 5, padding: "2px 8px",
                    fontSize: 10, fontWeight: 600, color: "#555",
                  }}>🔒 Premium</div>
                )}
                <div style={{ marginBottom: 10 }}>
                  <span className="hx-tag" style={{ background: course.color + "20", color: course.color }}>{course.tag}</span>
                </div>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: "#fff", lineHeight: 1.4, marginBottom: 6 }}>{course.title}</div>
                <div style={{ display: "flex", gap: 12, fontSize: 11.5, color: "#555" }}>
                  <span>{course.lessons} lessons</span>
                  <span>{course.duration}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Learning Paths */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#444" }}>Learning paths</div>
          <Link to="/paths" style={{ fontSize: 12, color: PURPLE, textDecoration: "none", fontWeight: 600 }}>View all →</Link>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {LEARNING_PATHS.map(path => (
            <Link key={path.id} to={`/paths/${path.id}`} style={{ textDecoration: "none" }}>
              <div className="hx-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: path.color + "20", border: `1px solid ${path.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: path.color, flexShrink: 0 }}>◈</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 3 }}>{path.title}</div>
                    <div style={{ fontSize: 12, color: "#555" }}>{path.courses} courses · {path.duration}</div>
                  </div>
                </div>
                <div>
                  {path.enrolled ? (
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#16a34a", background: "#16a34a18", padding: "3px 9px", borderRadius: 5 }}>Enrolled</span>
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 600, color: path.color, background: path.color + "18", padding: "3px 9px", borderRadius: 5 }}>Start →</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
