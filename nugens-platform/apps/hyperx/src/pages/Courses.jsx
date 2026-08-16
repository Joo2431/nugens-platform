import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const PINK = "#e8185d";
const TEXT = "#111827";
const MUTED = "#6b7280";
const LIGHT = "#f8f9fb";
const CARD = "#ffffff";
const BORDER = "#e8eaed";

const LEVEL_COLOR = {
  Beginner: "#16a34a",
  Intermediate: "#d97706",
  Advanced: PINK,
};

const PLAN_ACCESS = {
  free: { canAccess: (c) => c.is_free, certLimit: 0 },
  hx_ind_starter: { canAccess: (c) => c.is_free, certLimit: 0 },
  hx_ind_premium: { canAccess: (c) => c.course_type !== "business", certLimit: 2 },
  hx_ind_pro: { canAccess: (c) => c.course_type !== "business", certLimit: 6 },
  hx_ind_yearly: { canAccess: (c) => c.course_type !== "business", certLimit: 999 },
  hx_biz_starter: { canAccess: (c) => c.is_free, certLimit: 2 },
  hx_biz_premium: { canAccess: () => true, certLimit: 2 },
  hx_biz_pro: { canAccess: () => true, certLimit: 6 },
  hx_biz_yearly: { canAccess: () => true, certLimit: 999 },
  admin: { canAccess: () => true, certLimit: 999 },
};

export default function CoursesPage({ profile }) {
  const nav = useNavigate();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [myOnly, setMyOnly] = useState(false);
  const [catFilter, setCatFilter] = useState("All");
  const [levelFilter, setLevelFilter] = useState("All");
  const [cats, setCats] = useState(["All"]);
  const [enrollments, setEnrollments] = useState(new Set());

  const plan = profile?.plan || "free";
  const isBiz = profile?.user_type === "business";
  const access = PLAN_ACCESS[plan] || PLAN_ACCESS.free;

  useEffect(() => {
    async function load() {
      let q = supabase
        .from("hx_courses")
        .select("*")
        .eq("is_published", true);

      if (!isBiz) q = q.neq("course_type", "business");

      const { data } = await q.order("created_at", { ascending: false });

      const courseData = data || [];
      setCourses(courseData);
      setCats(["All", ...new Set(courseData.map((x) => x.category).filter(Boolean))]);

      if (profile?.id) {
        const { data: e } = await supabase
          .from("hx_enrollments")
          .select("course_id")
          .eq("user_id", profile.id);

        setEnrollments(new Set((e || []).map((x) => x.course_id)));
      }

      setLoading(false);
    }

    load();
  }, [profile?.id, isBiz]);

  const filtered = courses.filter((c) => {
    const matchSearch =
      !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.category || "").toLowerCase().includes(search.toLowerCase());

    const matchType = typeFilter === "all" || c.course_type === typeFilter;
    const matchCat = catFilter === "All" || c.category === catFilter;
    const matchLevel = levelFilter === "All" || c.level === levelFilter;
    const matchEnroll = !myOnly || enrollments.has(c.id);

    return matchSearch && matchType && matchCat && matchLevel && matchEnroll;
  });

  const enroll = async (course) => {
    if (!profile?.id) return;

    if (!access.canAccess(course)) {
      nav("/pricing");
      return;
    }

    await supabase
      .from("hx_enrollments")
      .upsert(
        { user_id: profile.id, course_id: course.id },
        { onConflict: "user_id,course_id" }
      );

    setEnrollments((s) => new Set([...s, course.id]));
    nav(`/courses/${course.id}`);
  };

  const S = {
    page: {
      minHeight: "100vh",
      background: LIGHT,
      padding: "36px 44px",
      fontFamily: "'Plus Jakarta Sans',sans-serif",
    },
    card: {
      background: CARD,
      border: `1px solid ${BORDER}`,
      borderRadius: 14,
      overflow: "hidden",
      cursor: "pointer",
      transition: "all 0.2s",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    },
    pill: {
      padding: "6px 14px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      cursor: "pointer",
      border: "none",
      fontFamily: "inherit",
    },
    inp: {
      padding: "10px 14px",
      background: CARD,
      border: `1px solid ${BORDER}`,
      borderRadius: 9,
      color: TEXT,
      fontSize: 13,
      width: "100%",
      boxSizing: "border-box",
    },
    lock: {
      position: "absolute",
      inset: 0,
      background: "rgba(255,255,255,0.85)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
  };

  return (
    <div className="c-page" style={S.page}>
      <style>{`
        .c-card:hover {
          box-shadow: 0 6px 24px rgba(0,0,0,0.10) !important;
          transform: translateY(-2px);
        }

        @media (max-width: 1024px) {
          .c-grid {
            grid-template-columns: repeat(2,1fr) !important;
          }
        }

        @media (max-width: 768px) {
          .c-page {
            padding: 16px 12px !important;
          }

          .c-grid {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }

          .c-filters {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }

          .c-filters > div {
            width: 100% !important;
            flex-wrap: wrap !important;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: TEXT }}>
          ▶ Courses
        </div>
        <div style={{ fontSize: 13, color: MUTED }}>
          {isBiz
            ? "Business and individual courses"
            : "Individual courses only"}
        </div>
      </div>

      {/* My Courses / All Courses toggle */}
      <div style={{ display:"flex", gap:8, marginBottom:14 }}>
        {[{label:"All Courses",v:false},{label:"My Courses",v:true}].map(({label,v})=>(
          <button key={label} onClick={()=>setMyOnly(v)} style={{
            padding:"8px 20px", borderRadius:9, border:`1px solid ${BORDER}`,
            background: myOnly===v ? "#111" : CARD, color: myOnly===v ? "#fff" : MUTED,
            fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
          }}>{label}</button>
        ))}
      </div>

      {/* Search + Filters */}
      <div
        style={{
          background: CARD,
          border: `1px solid ${BORDER}`,
          borderRadius: 14,
          padding: "16px 20px",
          marginBottom: 24,
        }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search courses..."
          style={{ ...S.inp, marginBottom: 14 }}
        />

        <div className="c-filters" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {cats.slice(0, 7).map((c) => (
              <button
                key={c}
                onClick={() => setCatFilter(c)}
                style={{
                  ...S.pill,
                  background: catFilter === c ? "#111" : CARD,
                  color: catFilter === c ? "#fff" : MUTED,
                  border: `1px solid ${BORDER}`,
                }}
              >
                {c}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["All", "Beginner", "Intermediate", "Advanced"].map((l) => (
              <button
                key={l}
                onClick={() => setLevelFilter(l)}
                style={{
                  ...S.pill,
                  background: levelFilter === l ? "#111" : CARD,
                  color: levelFilter === l ? "#fff" : MUTED,
                  border: `1px solid ${BORDER}`,
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div
        className="c-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
          gap: 16,
        }}
      >
        {filtered.map((course) => {
          const canAccess = access.canAccess(course);
          const isEnrolled = enrollments.has(course.id);

          return (
            <div
              key={course.id}
              className="c-card"
              style={{ ...S.card, position: "relative" }}
              onClick={() => enroll(course)}
            >
              <div
                style={{
                  height: "clamp(140px,25vw,180px)",
                  background: `linear-gradient(135deg,${PINK}15,#0284c715)`,
                }}
              >
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : null}
              </div>

              <div style={{ padding: "14px 16px" }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: TEXT,
                    marginBottom: 8,
                  }}
                >
                  {course.title}
                </div>

                <div style={{ fontSize: 12, color: MUTED }}>
                  {course.description?.slice(0, 80)}...
                </div>
              </div>

              {!canAccess && !isEnrolled && (
                <div style={S.lock}>
                  <div>🔒 Premium Content</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
