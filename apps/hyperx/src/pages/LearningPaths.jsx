import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../lib/apiClient";
import { supabase } from "../lib/supabase";

const PURPLE = "#7c3aed";
const PINK   = "#e8185d";
const BG     = "#f8f9fb";
const CARD   = "#ffffff";
const BORDER = "#e8eaed";
const TEXT   = "#0a0a0a";
const MUTED  = "#6b7280";
const FAINT  = "#9ca3af";

const PALETTE = [PINK, "#0284c7", PURPLE, "#d97706", "#16a34a", "#dc2626", "#0891b2", "#c026d3"];

function slugify(s) {
  return "cat-" + String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/**
 * Learning Paths — previously a fixed list of 5 hand-written paths whose
 * module names referenced only a handful of soft-skill courses. Since
 * HyperX now posts courses across every category and for both individual
 * and business users, paths are built here directly from whatever is
 * actually published — one path per category, always current, and it
 * automatically covers every kind of course and every user type instead
 * of just the categories someone happened to write into a hardcoded list.
 */
export default function LearningPaths({ profile }) {
  const nav = useNavigate();
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollErr, setEnrollErr] = useState("");
  const plan  = profile?.plan || "free";
  const isBiz = profile?.user_type === "business";

  useEffect(() => {
    async function load() {
      let q = supabase.from("hx_courses").select("*").eq("is_published", true);
      if (!isBiz) q = q.eq("course_type", "individual");
      const { data } = await q.order("created_at", { ascending: true });
      setAllCourses(data || []);
      setLoading(false);
    }
    load();
    apiGet("/api/hyperx/path-enrollments").then(d => setEnrollments(d.enrollments || [])).catch(() => {});
  }, [isBiz]);

  // Group courses by category into paths — real data, always in sync with
  // whatever admin has actually published, across every category.
  const paths = React.useMemo(() => {
    const byCat = {};
    allCourses.forEach(c => {
      const cat = c.category || "General";
      if (!byCat[cat]) byCat[cat] = [];
      byCat[cat].push(c);
    });
    return Object.entries(byCat).map(([cat, courses], i) => {
      const totalMins = courses.reduce((sum, c) => sum + (c.duration_mins || 0), 0);
      const hasIndividual = courses.some(c => c.course_type === "individual");
      const hasBusiness   = courses.some(c => c.course_type === "business");
      const audience = hasIndividual && hasBusiness ? "All Users" : hasBusiness ? "Business" : "Individual";
      return {
        id: slugify(cat), title: cat, tag: audience,
        color: PALETTE[i % PALETTE.length],
        courseCount: courses.length,
        duration: totalMins >= 60 ? `${Math.round(totalMins / 60)}h` : `${totalMins}m`,
        courses: courses.sort((a, b) => (a.level || "").localeCompare(b.level || "")),
      };
    }).sort((a, b) => b.courseCount - a.courseCount);
  }, [allCourses]);

  const selected = paths.find(p => p.id === selectedCat) || paths[0];
  const myEnrollment = (pathId) => enrollments.find(e => e.path_id === pathId);
  const selEnrollment = selected ? myEnrollment(selected.id) : null;

  const enroll = async () => {
    if (!selected) return;
    setEnrolling(true);
    setEnrollErr("");
    try {
      await apiPost("/api/hyperx/path-enrollments", { pathId: selected.id });
      setEnrollments(e => [...e, { path_id: selected.id, progress: 0 }]);
    } catch (e) {
      setEnrollErr(e.message || "Couldn't enroll. Please try again.");
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Plus Jakarta Sans', sans-serif", color: MUTED }}>
        Loading learning paths…
      </div>
    );
  }

  if (paths.length === 0) {
    return (
      <div style={{ minHeight: "100vh", background: BG, padding: "32px 28px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <h1 style={{ fontWeight: 800, fontSize: 24, color: TEXT, marginBottom: 8 }}>Learning Paths</h1>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 40, textAlign: "center", color: MUTED }}>
          No published courses yet — paths will appear automatically as courses are added.
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", padding: "32px 28px 80px", background: BG, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .path-card { background: ${CARD}; border: 1px solid ${BORDER}; border-radius: 12px; padding: 18px 20px; cursor: pointer; transition: all 0.15s; }
        .path-card:hover { border-color: ${PURPLE}40; }
        .path-card.active { border-color: var(--path-color, ${PURPLE}); box-shadow: 0 0 0 1px var(--path-color, ${PURPLE}); }
        .module-row { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 1px solid ${BG}; font-size: 13px; color: #374151; cursor: pointer; }
        .module-row:hover { color: ${TEXT}; }
        .module-row:last-child { border-bottom: none; }
        .progress-bar { height: 4px; background: ${BORDER}; border-radius: 99px; overflow: hidden; margin-top: 8px; }
        @media (max-width: 800px) { .paths-layout { flex-direction: column !important; } .paths-sidebar { width: 100% !important; } }
      `}</style>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontWeight: 800, fontSize: "clamp(20px,2.5vw,26px)", letterSpacing: "-0.03em", color: TEXT, marginBottom: 4 }}>Learning Paths</h1>
        <p style={{ fontSize: 13.5, color: MUTED }}>Every path here is built from real, published courses — grouped by category so there's a path for whatever you're working on.</p>
      </div>

      <div className="paths-layout" style={{ display: "flex", gap: 20 }}>
        {/* Left: path list */}
        <div className="paths-sidebar" style={{ width: 280, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {paths.map(path => {
            const en = myEnrollment(path.id);
            return (
              <div key={path.id} className={`path-card ${selected?.id === path.id ? "active" : ""}`}
                style={{ "--path-color": path.color }}
                onClick={() => setSelectedCat(path.id)}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: path.color, background: path.color + "14", padding: "2px 8px", borderRadius: 5 }}>{path.tag}</span>
                  {en && <span style={{ fontSize: 10.5, fontWeight: 600, color: "#16a34a", background: "#16a34a14", padding: "2px 8px", borderRadius: 5 }}>Enrolled</span>}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 4 }}>{path.title}</div>
                <div style={{ fontSize: 12, color: MUTED }}>{path.courseCount} course{path.courseCount===1?"":"s"} · {path.duration}</div>
                {en && en.progress > 0 && (
                  <div className="progress-bar">
                    <div style={{ width: `${en.progress}%`, height: "100%", background: path.color, borderRadius: 99 }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right: path detail */}
        {selected && (
          <div style={{ flex: 1, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "28px 28px 32px" }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: selected.color, background: selected.color + "14", padding: "3px 10px", borderRadius: 5 }}>{selected.tag}</span>
              <h2 style={{ fontSize: "clamp(18px,2vw,24px)", fontWeight: 800, color: TEXT, letterSpacing: "-0.03em", marginTop: 12, marginBottom: 8 }}>{selected.title}</h2>
              <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.7, maxWidth: 480 }}>
                {selected.courseCount} course{selected.courseCount===1?"":"s"} covering {selected.title.toLowerCase()} — {selected.tag === "All Users" ? "open to both individual and business plans" : `built for ${selected.tag.toLowerCase()} users`}.
              </p>
            </div>

            {/* Stats row */}
            <div style={{ display: "flex", gap: 16, marginBottom: 28 }}>
              {[
                { label: "Courses",  value: selected.courseCount },
                { label: "Duration", value: selected.duration },
                { label: "Progress", value: selEnrollment ? `${selEnrollment.progress}%` : "Not started" },
              ].map(s => (
                <div key={s.label} style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 9, padding: "10px 16px" }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: TEXT, letterSpacing: "-0.03em" }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: FAINT, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Course modules — real courses, clickable straight into the course player */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: FAINT, marginBottom: 14 }}>Courses in this path</div>
              {selected.courses.map((course, i) => (
                <div key={course.id} className="module-row" onClick={() => nav(`/courses/${course.id}`)}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: selected.color + "14", border: `1px solid ${selected.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 700, color: selected.color, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    {course.title}
                    <span style={{ fontSize: 10, color: FAINT, marginLeft: 8 }}>{course.level} · {course.course_type}</span>
                  </div>
                  {plan === "free" && plan !== "admin" && !course.is_free && i > 1 && <span style={{ fontSize: 10, color: FAINT }}>🔒</span>}
                </div>
              ))}
            </div>

            {enrollErr && <div style={{ fontSize:12, color:"#dc2626", marginBottom:12 }}>{enrollErr}</div>}

            {/* CTA */}
            {selEnrollment ? (
              <button onClick={() => nav("/courses")} style={{ padding: "11px 26px", background: selected.color, color: "#fff", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 13.5, cursor: "pointer", fontFamily:"inherit" }}>
                Continue path →
              </button>
            ) : plan === "free" ? (
              <button onClick={() => nav("/pricing")} style={{ padding: "11px 26px", background: PURPLE, color: "#fff", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 13.5, cursor: "pointer", fontFamily:"inherit" }}>
                Upgrade to enroll →
              </button>
            ) : (
              <button onClick={enroll} disabled={enrolling} style={{ padding: "11px 26px", background: selected.color, color: "#fff", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 13.5, cursor: "pointer", fontFamily:"inherit", opacity: enrolling?0.7:1 }}>
                {enrolling ? "Enrolling…" : "Enroll in path →"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
