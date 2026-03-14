import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const PINK   = "#e8185d";
const TEXT   = "#111827";
const MUTED  = "#6b7280";
const LIGHT  = "#f8f9fb";
const CARD   = "#ffffff";
const BORDER = "#e8eaed";

const LEVEL_COLOR = { Beginner:"#16a34a", Intermediate:"#d97706", Advanced:PINK };

const PLAN_CERT_LIMITS = {
  free: 0,
  hx_ind_starter: 0,
  hx_ind_premium: 2,
  hx_ind_pro: 6,
  hx_ind_yearly: 999,
  hx_biz_starter: 2,
  hx_biz_premium: 2,
  hx_biz_pro: 6,
  hx_biz_yearly: 999,
};

export default function Dashboard({ profile }) {
  const nav = useNavigate();
  const [courses,     setCourses]     = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [progress,    setProgress]    = useState([]);
  const [loading,     setLoading]     = useState(true);

  const plan      = profile?.plan || "free";
  const isBiz     = profile?.user_type === "business";
  const firstName = (profile?.full_name || "").split(" ")[0] || "there";
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const certLimit = PLAN_CERT_LIMITS[plan] ?? 0;

  useEffect(() => {
    if (!profile?.id) { setLoading(false); return; }
    async function load() {
      // Load courses relevant to user type
      let query = supabase.from("hx_courses").select("*").eq("is_published", true);
      if (!isBiz) query = query.eq("course_type", "individual"); // business users see both
      const [{ data: c }, { data: e }, { data: p }] = await Promise.all([
        query.order("created_at", { ascending:false }).limit(12),
        supabase.from("hx_enrollments").select("*").eq("user_id", profile.id),
        supabase.from("hx_progress").select("*").eq("user_id", profile.id),
      ]);
      setCourses(c || []);
      setEnrollments(e || []);
      setProgress(p || []);
      setLoading(false);
    }
    load();
  }, [profile?.id, isBiz]);

  const enrolledIds  = new Set(enrollments.map(e => e.course_id));
  const enrolled     = courses.filter(c => enrolledIds.has(c.id));
  const recommended  = courses.filter(c => !enrolledIds.has(c.id));
  const exclusive    = courses.filter(c => c.is_exclusive);

  const getProgress = (courseId) => {
    const courseLessons = progress.filter(p => p.course_id === courseId);
    return courseLessons.length;
  };

  const S = {
    page:  { minHeight:"100vh", background:LIGHT, padding:"36px 44px", fontFamily:"'Plus Jakarta Sans',sans-serif" },
    card:  { background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" },
    stat:  { background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, padding:"18px 20px", boxShadow:"0 1px 3px rgba(0,0,0,0.04)" },
    btn:   { padding:"10px 22px", background:PINK, color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" },
    courseCard: { background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, overflow:"hidden", cursor:"pointer", transition:"all 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.04)" },
  };

  if (loading) return <div style={{ ...S.page, display:"flex", alignItems:"center", justifyContent:"center" }}><div style={{ color:PINK, fontWeight:700 }}>Loading...</div></div>;

  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .course-card:hover { box-shadow:0 4px 20px rgba(0,0,0,0.10) !important; transform:translateY(-2px); }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom:32 }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"#fef2f2", border:`1px solid ${PINK}20`, borderRadius:20, padding:"4px 14px", marginBottom:12 }}>
          <span style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", color:PINK }}>{isBiz ? "🏢 Business" : "👤 Individual"} · HyperX Learning</span>
        </div>
        <div style={{ fontSize:28, fontWeight:800, color:TEXT, letterSpacing:"-0.04em" }}>{greeting}, {firstName} 👋</div>
        <div style={{ fontSize:13, color:MUTED, marginTop:4 }}>
          {isBiz ? "Access individual and business courses — grow yourself and your team." : "Your learning journey — curated courses, certifications, and real-time guidance."}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:32 }}>
        {[
          { label:"Enrolled Courses",     value: enrolled.length,    sub:"In progress",              color:PINK     },
          { label:"Lessons Completed",    value: progress.length,    sub:"Keep going!",              color:"#7c3aed"},
          { label:"Certifications",       value: certLimit === 999 ? "∞" : certLimit, sub:"Available on your plan", color:"#16a34a"},
          { label:"Available Courses",    value: courses.length,     sub:isBiz?"Biz + Individual":"Individual only", color:"#0284c7"},
        ].map(s => (
          <div key={s.label} style={S.stat}>
            <div style={{ fontSize:26, fontWeight:800, color:s.color, letterSpacing:"-0.04em" }}>{s.value}</div>
            <div style={{ fontSize:12, color:TEXT, fontWeight:600, marginTop:4 }}>{s.label}</div>
            <div style={{ fontSize:11, color:MUTED, marginTop:2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Exclusive courses banner */}
      {exclusive.length > 0 && plan !== "free" && (
        <div style={{ background:`linear-gradient(135deg,${PINK}15,#7c3aed15)`, border:`1px solid ${PINK}20`, borderRadius:14, padding:"20px 24px", marginBottom:28, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.08em", color:PINK, marginBottom:4 }}>⭐ This Month's Exclusive Course</div>
            <div style={{ fontSize:16, fontWeight:700, color:TEXT }}>{exclusive[0]?.title || "New course dropping soon"}</div>
            <div style={{ fontSize:12, color:MUTED, marginTop:2 }}>Subscriber-only · Available this month</div>
          </div>
          <button onClick={()=>nav("/courses")} style={S.btn}>Watch Now →</button>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:24 }}>
        <div>
          {/* In-progress */}
          {enrolled.length > 0 && (
            <div style={{ marginBottom:28 }}>
              <div style={{ fontSize:14, fontWeight:700, color:TEXT, marginBottom:14 }}>Continue Learning</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12 }}>
                {enrolled.slice(0,4).map(course => (
                  <div key={course.id} className="course-card" style={S.courseCard} onClick={()=>nav(`/courses/${course.id}`)}>
                    <div style={{ height:90, background:`linear-gradient(135deg,${PINK}20,#0284c720)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28 }}>
                      {course.thumbnail_url ? <img src={course.thumbnail_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt={course.title}/> : "▶"}
                    </div>
                    <div style={{ padding:"12px 14px" }}>
                      <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:PINK, marginBottom:4 }}>{course.category}</div>
                      <div style={{ fontSize:13, fontWeight:700, color:TEXT, marginBottom:8, lineHeight:1.4 }}>{course.title}</div>
                      <div style={{ height:3, background:"#f3f4f6", borderRadius:2 }}>
                        <div style={{ height:"100%", width:"40%", background:PINK, borderRadius:2 }}/>
                      </div>
                      <div style={{ fontSize:10, color:MUTED, marginTop:4 }}>In progress</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended */}
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div style={{ fontSize:14, fontWeight:700, color:TEXT }}>
                {enrolled.length > 0 ? "More to Explore" : "Start Learning"}
              </div>
              <button onClick={()=>nav("/courses")} style={{ background:"none", border:`1px solid ${BORDER}`, borderRadius:8, padding:"6px 14px", fontSize:12, color:MUTED, cursor:"pointer", fontFamily:"inherit" }}>
                View all →
              </button>
            </div>
            {recommended.length === 0 && !loading && (
              <div style={{ ...S.card, padding:"32px 24px", textAlign:"center" }}>
                <div style={{ fontSize:13, color:MUTED }}>No courses loaded yet. Courses appear here once added by admin.</div>
              </div>
            )}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12 }}>
              {recommended.slice(0,6).map(course => (
                <div key={course.id} className="course-card" style={S.courseCard} onClick={()=>nav(`/courses/${course.id}`)}>
                  <div style={{ height:90, background:`${PINK}12`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, overflow:"hidden" }}>
                    {course.thumbnail_url ? <img src={course.thumbnail_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt={course.title}/> : "▶"}
                  </div>
                  <div style={{ padding:"12px 14px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:PINK }}>{course.category}</span>
                      {course.course_type === "business" && (
                        <span style={{ fontSize:9, fontWeight:700, color:"#0284c7", background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:4, padding:"1px 5px" }}>BIZ</span>
                      )}
                    </div>
                    <div style={{ fontSize:13, fontWeight:700, color:TEXT, lineHeight:1.4, marginBottom:6 }}>{course.title}</div>
                    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                      <span style={{ fontSize:10, color:LEVEL_COLOR[course.level]||MUTED, fontWeight:600 }}>{course.level}</span>
                      <span style={{ fontSize:10, color:MUTED }}>· {course.total_lessons} lessons</span>
                      {course.is_exclusive && <span style={{ fontSize:9, fontWeight:700, color:PINK, background:`${PINK}10`, borderRadius:4, padding:"1px 5px" }}>EXCLUSIVE</span>}
                      {course.is_free ? <span style={{ fontSize:10, fontWeight:700, color:"#16a34a" }}>Free</span> : <span style={{ fontSize:10, color:MUTED }}>Paid</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* Plan card */}
          <div style={{ ...S.card, padding:20, marginBottom:14 }}>
            <div style={{ fontSize:12, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>Your Plan</div>
            <div style={{ fontSize:18, fontWeight:800, color:plan==="free"?MUTED:PINK, textTransform:"capitalize", marginBottom:8 }}>{plan === "free" ? "Free" : plan.replace(/_/g," ").replace("hx","").trim()}</div>
            {certLimit === 0 && (
              <div style={{ fontSize:11, color:MUTED, marginBottom:12, lineHeight:1.5 }}>Upgrade to earn certifications and access premium courses.</div>
            )}
            {certLimit > 0 && certLimit < 999 && (
              <div style={{ fontSize:11, color:MUTED, marginBottom:12 }}>Up to <strong style={{color:PINK}}>{certLimit} certifications</strong> available</div>
            )}
            {certLimit === 999 && (
              <div style={{ fontSize:11, color:"#16a34a", fontWeight:600, marginBottom:12 }}>✓ Unlimited certifications</div>
            )}
            {plan === "free" && <button onClick={()=>nav("/pricing")} style={{ ...S.btn, width:"100%", fontSize:12 }}>Upgrade Now</button>}
          </div>

          {/* Category breakdown */}
          {isBiz && (
            <div style={{ ...S.card, padding:18, marginBottom:14 }}>
              <div style={{ fontSize:12, fontWeight:700, color:TEXT, marginBottom:12 }}>Course Access</div>
              <div style={{ display:"flex", gap:10 }}>
                {[{ label:"Individual", color:"#7c3aed", count:courses.filter(c=>c.course_type!=="business").length },
                  { label:"Business", color:"#0284c7", count:courses.filter(c=>c.course_type==="business").length }].map(ct=>(
                  <div key={ct.label} style={{ flex:1, background:`${ct.color}08`, border:`1px solid ${ct.color}20`, borderRadius:9, padding:"10px 12px", textAlign:"center" }}>
                    <div style={{ fontSize:20, fontWeight:800, color:ct.color }}>{ct.count}</div>
                    <div style={{ fontSize:10, color:MUTED }}>{ct.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick links */}
          <div style={{ ...S.card, padding:18 }}>
            <div style={{ fontSize:12, fontWeight:700, color:TEXT, marginBottom:12 }}>Quick Actions</div>
            {[
              { label:"Browse all courses", to:"/courses", icon:"▶" },
              { label:"View my certificates", to:"/certs", icon:"◇" },
              { label:"Change plan", to:"/pricing", icon:"↑" },
            ].map(l => (
              <button key={l.label} onClick={()=>nav(l.to)} style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"9px 0", background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", textAlign:"left", borderBottom:`1px solid #f3f4f6` }}>
                <span style={{ color:PINK, fontSize:12 }}>{l.icon}</span>
                <span style={{ fontSize:12, color:TEXT }}>{l.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
