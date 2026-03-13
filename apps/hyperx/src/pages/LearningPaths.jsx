import React, { useState } from "react";
import { Link } from "react-router-dom";

const PURPLE = "#7c3aed";
const PINK   = "#e8185d";
const B      = "#1e1e2e";

const PATHS = [
  {
    id: "path-001", title: "Fresher to Pro", tag: "Career Launch",
    desc: "Everything a fresh graduate needs to survive and thrive in their first job — from day 1 to 90.",
    color: PINK, courses: 5, duration: "18h", enrolled: true, progress: 35,
    modules: ["Professional Mindset Shift", "Workplace Communication Mastery", "Time Management at Work", "Giving & Receiving Feedback", "Salary Negotiation That Actually Works"],
  },
  {
    id: "path-002", title: "Communication Excellence", tag: "Soft Skills",
    desc: "Become the person in every room who communicates with precision, confidence and clarity.",
    color: "#0284c7", courses: 4, duration: "14h", enrolled: false, progress: 0,
    modules: ["Workplace Communication Mastery", "Business English for the Workplace", "Presenting to Leadership", "Giving & Receiving Feedback"],
  },
  {
    id: "path-003", title: "Career Growth Accelerator", tag: "Growth",
    desc: "For mid-level professionals ready to move up faster — strategy, brand, and leadership.",
    color: PURPLE, courses: 6, duration: "22h", enrolled: false, progress: 0,
    modules: ["LinkedIn Profile & Personal Brand", "Salary Negotiation That Actually Works", "Office Politics", "Leadership Foundations", "Personal Branding Beyond LinkedIn", "Remote Work: Thrive Not Just Survive"],
  },
  {
    id: "path-004", title: "Interview Domination", tag: "Interview Prep",
    desc: "Crack any interview — from HR screening to final CXO rounds. With mock questions and scripts.",
    color: "#d97706", courses: 3, duration: "10h", enrolled: false, progress: 0,
    modules: ["Interview Mastery: Any Role Any Company", "Workplace Communication Mastery", "LinkedIn Profile & Personal Brand"],
  },
];

export default function LearningPaths({ profile }) {
  const [selected, setSelected] = useState(PATHS[0]);
  const plan = profile?.plan || "free";

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", padding: "32px 28px 80px", background: "#080814", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .path-card { background: #0d0d1a; border: 1px solid ${B}; border-radius: 12px; padding: 18px 20px; cursor: pointer; transition: all 0.15s; }
        .path-card:hover { border-color: #2a2a3e; }
        .path-card.active { border-color: var(--path-color, ${PURPLE}); background: #0f0f20; }
        .module-row { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 1px solid #0f0f20; font-size: 13px; color: #888; }
        .module-row:last-child { border-bottom: none; }
        .progress-bar { height: 4px; background: #1a1a2a; border-radius: 99px; overflow: hidden; margin-top: 8px; }
        @media (max-width: 800px) { .paths-layout { flex-direction: column !important; } .paths-sidebar { width: 100% !important; } }
      `}</style>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontWeight: 800, fontSize: "clamp(20px,2.5vw,26px)", letterSpacing: "-0.03em", color: "#fff", marginBottom: 4 }}>Learning Paths</h1>
        <p style={{ fontSize: 13.5, color: "#555" }}>Structured journeys. Each path builds on the last.</p>
      </div>

      <div className="paths-layout" style={{ display: "flex", gap: 20 }}>
        {/* Left: path list */}
        <div className="paths-sidebar" style={{ width: 280, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {PATHS.map(path => (
            <div key={path.id} className={`path-card ${selected.id === path.id ? "active" : ""}`}
              style={{ "--path-color": path.color }}
              onClick={() => setSelected(path)}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: path.color, background: path.color + "18", padding: "2px 8px", borderRadius: 5 }}>{path.tag}</span>
                {path.enrolled && <span style={{ fontSize: 10.5, fontWeight: 600, color: "#16a34a", background: "#16a34a18", padding: "2px 8px", borderRadius: 5 }}>Enrolled</span>}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{path.title}</div>
              <div style={{ fontSize: 12, color: "#555" }}>{path.courses} courses · {path.duration}</div>
              {path.progress > 0 && (
                <div className="progress-bar">
                  <div style={{ width: `${path.progress}%`, height: "100%", background: path.color, borderRadius: 99 }} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right: path detail */}
        <div style={{ flex: 1, background: "#0d0d1a", border: `1px solid ${B}`, borderRadius: 14, padding: "28px 28px 32px" }}>
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: selected.color, background: selected.color + "18", padding: "3px 10px", borderRadius: 5 }}>{selected.tag}</span>
            <h2 style={{ fontSize: "clamp(18px,2vw,24px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", marginTop: 12, marginBottom: 8 }}>{selected.title}</h2>
            <p style={{ fontSize: 14, color: "#666", lineHeight: 1.7, maxWidth: 480 }}>{selected.desc}</p>
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 16, marginBottom: 28 }}>
            {[
              { label: "Courses",  value: selected.courses },
              { label: "Duration", value: selected.duration },
              { label: "Progress", value: selected.progress > 0 ? `${selected.progress}%` : "Not started" },
            ].map(s => (
              <div key={s.label} style={{ background: "#080814", border: `1px solid ${B}`, borderRadius: 9, padding: "10px 16px" }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#444", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Course modules */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#444", marginBottom: 14 }}>Courses in this path</div>
            {selected.modules.map((mod, i) => (
              <div key={mod} className="module-row">
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: selected.color + "18", border: `1px solid ${selected.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 700, color: selected.color, flexShrink: 0 }}>{i + 1}</div>
                <div style={{ flex: 1 }}>{mod}</div>
                {i === 0 && selected.enrolled && <span style={{ fontSize: 10, color: "#16a34a", fontWeight: 600 }}>In progress</span>}
                {plan === "free" && i > 1 && <span style={{ fontSize: 10, color: "#333" }}>🔒</span>}
              </div>
            ))}
          </div>

          {/* CTA */}
          {selected.enrolled ? (
            <Link to={`/courses/wc-001`} style={{ display: "inline-block", padding: "11px 26px", background: selected.color, color: "#fff", borderRadius: 9, fontWeight: 700, fontSize: 13.5, textDecoration: "none" }}>
              Continue path →
            </Link>
          ) : plan === "free" ? (
            <Link to="/pricing" style={{ display: "inline-block", padding: "11px 26px", background: PURPLE, color: "#fff", borderRadius: 9, fontWeight: 700, fontSize: 13.5, textDecoration: "none" }}>
              Upgrade to enroll →
            </Link>
          ) : (
            <button style={{ padding: "11px 26px", background: selected.color, color: "#fff", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>
              Enroll in path →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
