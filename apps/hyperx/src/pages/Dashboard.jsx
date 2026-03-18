import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const PINK   = "#e8185d";
const TEXT   = "#111827";
const MUTED  = "#6b7280";
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

export default function Dashboard({ profile }) {
  const nav = useNavigate();

  const [courses,     setCourses]     = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [progress,    setProgress]    = useState([]);
  const [loading,     setLoading]     = useState(true);

  const plan      = profile?.plan      || "free";
  const isBiz     = profile?.user_type === "business";
  const firstName = (profile?.full_name || "").split(" ")[0] || "there";

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
          query.order("created_at", { ascending: false }).limit(12),
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

  const enrolledIds = new Set(enrollments.map((e) => e.course_id));
  const enrolled    = courses.filter((c) => enrolledIds.has(c.id));
  const recommended = courses.filter((c) => !enrolledIds.has(c.id));

  const getProgressPercent = (courseId) => {
    const lessons = progress.filter((p) => p.course_id === courseId);
    return Math.min(lessons.length * 10, 100);
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

  return (
    <div style={S.page}>
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
      </div>

      {/* Stats */}
      <div
        style={{
          display:             "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap:                 14,
          marginBottom:        32,
        }}
      >
        <div style={S.stat}>
          <div style={{ fontSize: 26, fontWeight: 800, color: PINK }}>
            {enrolled.length}
          </div>
          <div style={{ fontSize: 12, color: TEXT }}>Enrolled Courses</div>
        </div>

        <div style={S.stat}>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#7c3aed" }}>
            {progress.length}
          </div>
          <div style={{ fontSize: 12, color: TEXT }}>Lessons Completed</div>
        </div>

        <div style={S.stat}>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#16a34a" }}>
            {certLimit === 999 ? "∞" : certLimit}
          </div>
          <div style={{ fontSize: 12, color: TEXT }}>Certifications</div>
        </div>

        <div style={S.stat}>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#0284c7" }}>
            {courses.length}
          </div>
          <div style={{ fontSize: 12, color: TEXT }}>Available Courses</div>
        </div>
      </div>

      {/* Continue Learning */}
      {enrolled.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 14 }}>
            Continue Learning
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
            {enrolled.slice(0, 4).map((course) => {
              const percent = getProgressPercent(course.id);
              return (
                <div
                  key={course.id}
                  style={S.courseCard}
                  onClick={() => nav(`/courses/${course.id}`)}
                >
                  <div
                    style={{
                      height:         90,
                      background:     "#f3f4f6",
                      display:        "flex",
                      alignItems:     "center",
                      justifyContent: "center",
                    }}
                  >
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        alt={course.title}
                      />
                    ) : (
                      "▶"
                    )}
                  </div>
                  <div style={{ padding: 14 }}>
                    <div style={{ fontWeight: 700, color: TEXT }}>{course.title}</div>
                    <div
                      style={{
                        height:       4,
                        background:   "#eee",
                        marginTop:    8,
                        borderRadius: 4,
                      }}
                    >
                      <div
                        style={{
                          width:      `${percent}%`,
                          background: PINK,
                          height:     "100%",
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Start Learning / Recommended */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 14 }}>
          Start Learning
        </div>

        {recommended.length === 0 && (
          <div style={{ ...S.card, padding: 30, textAlign: "center" }}>
            <div style={{ color: MUTED }}>
              No courses available yet. Admin needs to add courses.
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
          {recommended.slice(0, 6).map((course) => (
            <div
              key={course.id}
              style={S.courseCard}
              onClick={() => nav(`/courses/${course.id}`)}
            >
              <div
                style={{
                  height:         90,
                  background:     "#f3f4f6",
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                }}
              >
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    alt={course.title}
                  />
                ) : (
                  "▶"
                )}
              </div>
              <div style={{ padding: 14 }}>
                <div style={{ fontWeight: 700, color: TEXT }}>{course.title}</div>
                <div style={{ fontSize: 11, color: MUTED }}>
                  {course.total_lessons} lessons
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}