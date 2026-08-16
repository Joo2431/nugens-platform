import React, { useState, useEffect } from "react";
import StreakBadge from "../components/StreakTracker";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { apiGet, apiPost } from "../lib/apiClient";

const PINK   = "#e8185d";
const PURPLE = "#7c3aed";
const TEXT   = "#111827";
const MUTED  = "#6b7280";
const FAINT  = "#9ca3af";
const LIGHT  = "#f8f9fb";
const CARD   = "#ffffff";
const BORDER = "#e8eaed";

const PLAN_CERT_LIMITS = {
  free:            0,
  hx_ind_starter:  0,
  hx_ind_premium:  2,
  hx_ind_pro:      6,
  hx_ind_yearly:   999,
  hx_biz_starter:  2,
  hx_biz_premium:  2,
  hx_biz_pro:      6,
  hx_biz_yearly:   999,
};

const CAT_COLORS = [PINK, "#0284c7", PURPLE, "#d97706", "#16a34a", "#dc2626", "#0891b2", "#c026d3"];
function colorForCategory(name, categoryList) {
  const i = Math.max(0, categoryList.indexOf(name));
  return CAT_COLORS[i % CAT_COLORS.length];
}
function catSlug(name) {
  return "hx-cat-" + String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function Dashboard({ profile, user }) {
  const nav = useNavigate();

  const [courses,     setCourses]     = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [progress,    setProgress]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showEval,    setShowEval]    = useState(false);
  const [evalScores,  setEvalScores]  = useState({});
  const [lastEval,    setLastEval]    = useState(null);
  const [evalSaving,  setEvalSaving]  = useState(false);

  const plan      = profile?.plan      || "free";
  const isBiz     = profile?.user_type === "business";
  const firstName = (profile?.full_name?.trim() || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "").split(" ")[0] || "there";

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const certLimit = PLAN_CERT_LIMITS[plan] ?? 0;

  useEffect(() => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    async function loadDashboard() {
      try {
        let query = supabase
          .from("hx_courses")
          .select("*")
          .eq("is_published", true);

        if (!isBiz) {
          query = query.eq("course_type", "individual");
        }

        const [
          { data: coursesData,     error: coursesError  },
          { data: enrollmentsData, error: enrollError   },
          { data: progressData,    error: progressError },
        ] = await Promise.all([
          // Raised well past the old 12/60 limits — the Dashboard now groups
          // courses by category into separate rows, so it needs the *whole*
          // published catalog, not just the most recent handful, or most
          // categories would show up empty even though courses exist for them.
          query.order("created_at", { ascending: false }).limit(300),
          supabase.from("hx_enrollments").select("*").eq("user_id", profile.id),
          supabase.from("hx_progress").select("*").eq("user_id", profile.id),
        ]);

        if (coursesError || enrollError || progressError) {
          console.error(
            "[HyperX] Dashboard loading error:",
            coursesError,
            enrollError,
            progressError
          );
        }

        setCourses(coursesData     || []);
        setEnrollments(enrollmentsData || []);
        setProgress(progressData   || []);
      } catch (err) {
        console.error("[HyperX] Dashboard crash:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [profile?.id, isBiz]);

  useEffect(() => {
    if (!profile?.id) return;
    apiGet("/api/hyperx/self-evaluation").then(d => setLastEval(d.evaluation || null)).catch(() => {});
  }, [profile?.id]);

  const enrolledIds = new Set(enrollments.map((e) => e.course_id));
  const enrolled    = courses.filter((c) => enrolledIds.has(c.id));
  const allRecommended = courses.filter((c) => !enrolledIds.has(c.id));

  // Categories derived straight from the loaded catalog — always in sync
  // with whatever admin has actually published, no separate fetch needed.
  const categoryList = Array.from(new Set(allRecommended.map(c => c.category).filter(Boolean))).sort();

  // Group every non-enrolled course under its category — this is the literal
  // "each course visible under its category" structure, instead of a single
  // flat grid behind a filter pill you had to click first.
  const byCategory = categoryList.map(cat => ({
    name: cat,
    color: colorForCategory(cat, categoryList),
    courses: allRecommended.filter(c => c.category === cat),
  }));

  // "Suggested for you" — a lightweight recommendation row:
  // prioritizes categories the student is already enrolled in (so it's not
  // random), and falls back to the newest published courses for a student
  // with no enrollments yet.
  const enrolledCategories = new Set(enrolled.map(c => c.category).filter(Boolean));
  let suggested;
  if (enrolledCategories.size > 0) {
    const inSameCategories = allRecommended.filter(c => enrolledCategories.has(c.category));
    const rest = allRecommended.filter(c => !enrolledCategories.has(c.category));
    suggested = [...inSameCategories, ...rest].slice(0, 8);
  } else {
    suggested = allRecommended.slice(0, 8);
  }

  const getProgressPercent = (courseId) => {
    const lessons = progress.filter((p) => p.course_id === courseId);
    return Math.min(lessons.length * 10, 100);
  };

  const scrollToCategory = (cat) => {
    const el = document.getElementById(catSlug(cat));
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const S = {
    page: {
      minHeight:  "100vh",
      background: LIGHT,
      padding:    "36px 44px",
      fontFamily: "'Plus Jakarta Sans',sans-serif",
    },
    stat: {
      background:   CARD,
      border:       `1px solid ${BORDER}`,
      borderRadius: 12,
      padding:      "18px 20px",
    },
    card: {
      background:   CARD,
      border:       `1px solid ${BORDER}`,
      borderRadius: 14,
    },
    courseCard: {
      background:   CARD,
      border:       `1px solid ${BORDER}`,
      borderRadius: 12,
      overflow:     "hidden",
      cursor:       "pointer",
    },
    btn: {
      padding:      "10px 22px",
      background:   PINK,
      color:        "#fff",
      border:       "none",
      borderRadius: 9,
      fontSize:     13,
      fontWeight:   700,
      cursor:       "pointer",
    },
  };

  if (loading) {
    return (
      <div
        style={{
          ...S.page,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
        }}
      >
        <div style={{ color: PINK, fontWeight: 700 }}>Loading...</div>
      </div>
    );
  }

  // Reusable course card — used by Continue Learning, Suggested, and every
  // category row, so the visual language stays identical everywhere.
  const CourseCard = ({ course, showProgress }) => {
    const percent = showProgress ? getProgressPercent(course.id) : null;
    return (
      <div
        className="hx-course-card"
        style={S.courseCard}
        onClick={() => nav(`/courses/${course.id}`)}
      >
        <div className="hx-course-thumb">
          {course.thumbnail_url ? (
            <img src={course.thumbnail_url} alt={course.title} />
          ) : (
            "▶"
          )}
        </div>
        <div style={{ padding: 14 }}>
          <div className="hx-course-title">{course.title}</div>
          <div style={{ fontSize: 11, color: MUTED, display: "flex", gap: 6, alignItems: "center", marginTop: 3, flexWrap: "wrap" }}>
            {course.category && (
              <span style={{ fontSize: 9.5, fontWeight: 700, color: colorForCategory(course.category, categoryList), background: `${colorForCategory(course.category, categoryList)}12`, padding: "1px 7px", borderRadius: 4 }}>{course.category}</span>
            )}
            <span>{course.total_lessons} lessons</span>
            {course.level && <span>· {course.level}</span>}
          </div>
          {showProgress && (
            <div style={{ height: 4, background: "#eee", marginTop: 8, borderRadius: 4 }}>
              <div style={{ width: `${percent}%`, background: PINK, height: "100%", borderRadius: 4 }} />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="hx-page-pad" style={S.page}>
      <style>{`
        .hx-course-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        .hx-course-row {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding-bottom: 6px;
          scroll-snap-type: x proximity;
        }
        .hx-course-row .hx-course-card {
          flex: 0 0 300px;
          scroll-snap-align: start;
        }
        .hx-course-card {
          display: grid;
          grid-template-columns: minmax(128px, 176px) minmax(0, 1fr);
          min-height: 104px;
          transition: box-shadow 0.15s, border-color 0.15s;
        }
        .hx-course-card:hover {
          border-color: #d1d5db;
          box-shadow: 0 4px 14px rgba(0,0,0,0.06);
        }
        .hx-course-row .hx-course-card {
          grid-template-columns: 108px minmax(0, 1fr);
        }
        .hx-course-thumb {
          height: 100%;
          min-height: 104px;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .hx-course-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .hx-course-title {
          font-weight: 700;
          color: ${TEXT};
          line-height: 1.35;
          overflow-wrap: anywhere;
        }
        .hx-jump-chip {
          padding: 5px 13px; border-radius: 7px; font-size: 11.5px; font-weight: 600;
          cursor: pointer; border: 1px solid ${BORDER}; background: ${CARD}; color: ${MUTED};
          white-space: nowrap;
        }
        .hx-jump-chip:hover { border-color: ${PINK}50; color: ${PINK}; }
        .hx-stat {
          display: flex; align-items: center; gap: 12px;
        }
        .hx-stat-icon {
          width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center;
          font-size: 17px; flex-shrink: 0;
        }
        @media (max-width: 900px) {
          .hx-course-grid { grid-template-columns: 1fr; }
          .hx-stats-grid { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media (max-width: 560px) {
          .hx-page-pad { padding: 20px 16px !important; }
        }
        @media (max-width: 520px) {
          .hx-course-card { grid-template-columns: 112px minmax(0, 1fr); min-height: 92px; }
          .hx-course-thumb { min-height: 92px; }
          .hx-course-row .hx-course-card { flex-basis: 260px; }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: TEXT }}>
          {greeting}, {firstName} 👋
        </div>
        <div style={{ fontSize: 13, color: MUTED }}>
          {isBiz
            ? "Access individual and business courses."
            : "Your learning journey starts here."}
        </div>
        <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <StreakBadge />
          {/* Quick actions — a small professional touch: one-click jumps to the
              other places students actually go from the Dashboard. */}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => nav("/courses")} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: `1px solid ${BORDER}`, background: CARD, color: TEXT, cursor: "pointer" }}>
              Browse All Courses
            </button>
            <button onClick={() => nav("/paths")} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: `1px solid ${BORDER}`, background: CARD, color: TEXT, cursor: "pointer" }}>
              Learning Paths
            </button>
            <button onClick={() => nav("/certs")} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: `1px solid ${BORDER}`, background: CARD, color: TEXT, cursor: "pointer" }}>
              Certificates
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="hx-stats-grid"
        style={{
          display:             "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap:                 14,
          marginBottom:        32,
        }}
      >
        <div style={S.stat}>
          <div className="hx-stat">
            <div className="hx-stat-icon" style={{ background: `${PINK}14`, color: PINK }}>◎</div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: PINK, letterSpacing: "-0.03em" }}>{enrolled.length}</div>
              <div style={{ fontSize: 11.5, color: MUTED }}>Enrolled Courses</div>
            </div>
          </div>
        </div>

        <div style={S.stat}>
          <div className="hx-stat">
            <div className="hx-stat-icon" style={{ background: `${PURPLE}14`, color: PURPLE }}>✓</div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: PURPLE, letterSpacing: "-0.03em" }}>{progress.length}</div>
              <div style={{ fontSize: 11.5, color: MUTED }}>Lessons Completed</div>
            </div>
          </div>
        </div>

        <div style={S.stat}>
          <div className="hx-stat">
            <div className="hx-stat-icon" style={{ background: "#16a34a14", color: "#16a34a" }}>◈</div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#16a34a", letterSpacing: "-0.03em" }}>{certLimit === 999 ? "∞" : certLimit}</div>
              <div style={{ fontSize: 11.5, color: MUTED }}>Certifications</div>
            </div>
          </div>
        </div>

        <div style={S.stat}>
          <div className="hx-stat">
            <div className="hx-stat-icon" style={{ background: "#0284c714", color: "#0284c7" }}>▤</div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#0284c7", letterSpacing: "-0.03em" }}>{courses.length}</div>
              <div style={{ fontSize: 11.5, color: MUTED }}>Available Courses</div>
            </div>
          </div>
        </div>
      </div>

      {/* Continue Learning */}
      {enrolled.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 14 }}>
            Continue Learning
          </div>
          <div className="hx-course-grid">
            {enrolled.slice(0, 4).map((course) => (
              <CourseCard key={course.id} course={course} showProgress />
            ))}
          </div>
        </div>
      )}

      {/* Self-Evaluation */}
      <div style={{ ...S.card, padding: "18px 22px", marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 3 }}>📊 Self-Evaluation</div>
          <div style={{ fontSize: 12, color: MUTED }}>
            {lastEval
              ? `Last checked in on ${new Date(lastEval.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} — see how you rate yourself, then track it over time.`
              : "Rate your own proficiency across a few skill areas — takes under a minute."}
          </div>
        </div>
        <button onClick={() => { setEvalScores(lastEval?.scores || {}); setShowEval(true); }} style={{ ...S.btn, flexShrink: 0 }}>
          {lastEval ? "Re-evaluate" : "Start Self-Evaluation"}
        </button>
      </div>

      {/* Suggested For You */}
      {suggested.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 3 }}>
            ✦ Suggested For You
          </div>
          <div style={{ fontSize: 12, color: MUTED, marginBottom: 14 }}>
            {enrolledCategories.size > 0
              ? "Based on the courses you're already taking."
              : "Popular starting points — this gets more personal once you enroll in something."}
          </div>
          <div className="hx-course-row">
            {suggested.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      )}

      {/* Browse by Category — quick-jump chips */}
      {categoryList.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 10 }}>
            Browse by Category
          </div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {byCategory.map(({ name }) => (
              <button key={name} className="hx-jump-chip" onClick={() => scrollToCategory(name)}>
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Each category as its own section — courses are grouped under their
          category rather than hidden behind a single filter, per feedback
          that courses should be "visible under the categories". */}
      {byCategory.length === 0 && allRecommended.length === 0 && enrolled.length === 0 && (
        <div style={{ ...S.card, padding: 30, textAlign: "center" }}>
          <div style={{ color: MUTED }}>No courses available yet. Admin needs to add courses.</div>
        </div>
      )}

      {byCategory.map(({ name, color, courses: catCourses }) => (
        <div key={name} id={catSlug(name)} style={{ marginBottom: 32, scrollMarginTop: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{name}</div>
            <div style={{ fontSize: 11.5, color: FAINT }}>{catCourses.length} course{catCourses.length === 1 ? "" : "s"}</div>
          </div>
          <div className="hx-course-row">
            {catCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      ))}

      {/* Self-Evaluation modal */}
      {showEval && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,10,10,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}>
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 32, width: 480, maxWidth: "100%", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: TEXT, marginBottom: 4 }}>Self-Evaluation</div>
            <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 20 }}>Rate yourself honestly — 1 (just starting) to 5 (very confident). This is just for you.</div>

            {["Communication","Leadership","Career Strategy","Time Management","Interview Skills","Personal Branding"].map((skill) => (
              <div key={skill} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: TEXT, marginBottom: 7 }}>{skill}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => setEvalScores((s) => ({ ...s, [skill]: n }))} style={{
                      flex: 1, padding: "8px 0", borderRadius: 8, cursor: "pointer", fontSize: 12.5, fontWeight: 700,
                      border: `1px solid ${evalScores[skill] === n ? PINK : BORDER}`,
                      background: evalScores[skill] === n ? PINK : LIGHT,
                      color: evalScores[skill] === n ? "#fff" : MUTED,
                    }}>{n}</button>
                  ))}
                </div>
              </div>
            ))}

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                disabled={evalSaving || Object.keys(evalScores).length === 0}
                onClick={async () => {
                  setEvalSaving(true);
                  try {
                    const { evaluation } = await apiPost("/api/hyperx/self-evaluation", { scores: evalScores });
                    setLastEval(evaluation);
                    setShowEval(false);
                  } catch (e) {
                    console.error("Self-evaluation save failed:", e.message);
                  } finally {
                    setEvalSaving(false);
                  }
                }}
                style={{ ...S.btn, flex: 1, opacity: evalSaving ? 0.7 : 1 }}
              >
                {evalSaving ? "Saving…" : "Save Evaluation"}
              </button>
              <button onClick={() => setShowEval(false)} style={{ flex: 1, background: "none", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 9, fontSize: 13, cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
