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

const PLAN_ACCESS = {
  free:            { canAccess:(c)=>c.is_free, certLimit:0 },
  hx_ind_starter:  { canAccess:(c)=>c.is_free, certLimit:0 },
  hx_ind_premium:  { canAccess:(c)=>c.course_type!=="business", certLimit:2 },
  hx_ind_pro:      { canAccess:(c)=>c.course_type!=="business", certLimit:6 },
  hx_ind_yearly:   { canAccess:(c)=>c.course_type!=="business", certLimit:999 },
  hx_biz_starter:  { canAccess:(c)=>c.is_free, certLimit:2 },
  hx_biz_premium:  { canAccess:()=>true, certLimit:2 },
  hx_biz_pro:      { canAccess:()=>true, certLimit:6 },
  hx_biz_yearly:   { canAccess:()=>true, certLimit:999 },
  admin:           { canAccess:()=>true, certLimit:999 },
};

export default function CoursesPage({ profile }) {
  const nav = useNavigate();
  const [courses,    setCourses]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [typeFilter, setTypeFilter] = useState("all"); // all | individual | business
  const [catFilter,  setCatFilter]  = useState("All");
  const [levelFilter,setLevelFilter]= useState("All");
  const [cats,       setCats]       = useState(["All"]);
  const [enrollments,setEnrollments]= useState(new Set());

  const plan   = profile?.plan || "free";
  const isBiz  = profile?.user_type === "business";
  const access = PLAN_ACCESS[plan] || PLAN_ACCESS.free;

  useEffect(() => {
    async function load() {
      let q = supabase.from("hx_courses").select("*").eq("is_published", true);
      if (!isBiz) q = q.neq("course_type", "business");
      const { data } = await q.order("created_at", { ascending:false });
      const c = data || [];
      setCourses(c);
      setCats(["All", ...new Set(c.map(x=>x.category).filter(Boolean))]);

      if (profile?.id) {
        const { data: e } = await supabase.from("hx_enrollments").select("course_id").eq("user_id", profile.id);
        setEnrollments(new Set((e||[]).map(x=>x.course_id)));
      }
      setLoading(false);
    }
    load();
  }, [profile?.id, isBiz]);

  const filtered = courses.filter(c => {
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || (c.category||"").toLowerCase().includes(search.toLowerCase());
    const matchType   = typeFilter === "all" || c.course_type === typeFilter;
    const matchCat    = catFilter === "All" || c.category === catFilter;
    const matchLevel  = levelFilter === "All" || c.level === levelFilter;
    return matchSearch && matchType && matchCat && matchLevel;
  });

  const enroll = async (course) => {
    if (!profile?.id) return;
    if (!access.canAccess(course)) { nav("/pricing"); return; }
    await supabase.from("hx_enrollments").upsert({ user_id:profile.id, course_id:course.id }, { onConflict:"user_id,course_id" });
    setEnrollments(s => new Set([...s, course.id]));
    nav(`/courses/${course.id}`);
  };

  const S = {
    page:  { minHeight:"100vh", background:LIGHT, padding:"36px 44px", fontFamily:"'Plus Jakarta Sans',sans-serif" },
    card:  { background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, overflow:"hidden", cursor:"pointer", transition:"all 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.04)" },
    pill:  { padding:"6px 14px", borderRadius:20, fontSize:11, fontWeight:600, cursor:"pointer", border:"none", fontFamily:"inherit" },
    inp:   { padding:"10px 14px", background:CARD, border:`1px solid ${BORDER}`, borderRadius:9, color:TEXT, fontSize:13, fontFamily:"inherit", outline:"none", width:"100%", boxSizing:"border-box" },
    lock:  { position:"absolute", inset:0, background:"rgba(255,255,255,0.85)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8 },
  };

  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .c-card:hover { box-shadow:0 6px 24px rgba(0,0,0,0.10) !important; transform:translateY(-2px); }
      `}</style>

      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:22, fontWeight:800, color:TEXT, letterSpacing:"-0.04em", marginBottom:4 }}>▶ Courses</div>
        <div style={{ fontSize:13, color:MUTED }}>
          {isBiz ? "Business and individual courses — grow across all dimensions" : "Individual courses — skills, career, and personal growth"}
        </div>
      </div>

      {/* Search + filters */}
      <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:"16px 20px", marginBottom:24, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search courses by title or category..." style={{ ...S.inp, marginBottom:14 }} />
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
          {/* Type filter — only for business */}
          {isBiz && (
            <div style={{ display:"flex", gap:6, marginRight:8 }}>
              {[["all","All"],["individual","Individual"],["business","Business"]].map(([v,l])=>(
                <button key={v} onClick={()=>setTypeFilter(v)} style={{ ...S.pill, background:typeFilter===v?PINK:"#f3f4f6", color:typeFilter===v?"#fff":MUTED, border:typeFilter===v?"none":`1px solid ${BORDER}` }}>{l}</button>
              ))}
            </div>
          )}
          {/* Category filter */}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {cats.slice(0,7).map(c=>(
              <button key={c} onClick={()=>setCatFilter(c)} style={{ ...S.pill, background:catFilter===c?"#111":CARD, color:catFilter===c?"#fff":MUTED, border:catFilter===c?"none":`1px solid ${BORDER}` }}>{c}</button>
            ))}
          </div>
          {/* Level filter */}
          <div style={{ display:"flex", gap:6, marginLeft:"auto" }}>
            {["All","Beginner","Intermediate","Advanced"].map(l=>(
              <button key={l} onClick={()=>setLevelFilter(l)} style={{ ...S.pill, background:levelFilter===l?"#111":CARD, color:levelFilter===l?"#fff":MUTED, border:levelFilter===l?"none":`1px solid ${BORDER}`, fontSize:10 }}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Results count */}
      <div style={{ fontSize:12, color:MUTED, marginBottom:16 }}>{filtered.length} course{filtered.length!==1?"s":""} found</div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign:"center", padding:"60px 0", color:MUTED }}>Loading courses...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:"60px 0", color:MUTED }}>
          <div style={{ fontSize:32, marginBottom:12, opacity:0.2 }}>▶</div>
          No courses found. {search ? "Try a different search." : "Check back soon!"}
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
          {filtered.map(course => {
            const canAccess = access.canAccess(course);
            const isEnrolled = enrollments.has(course.id);
            return (
              <div key={course.id} className="c-card" style={{ ...S.card, position:"relative" }} onClick={()=>enroll(course)}>
                {/* Thumbnail */}
                <div style={{ height:140, background:`linear-gradient(135deg,${PINK}15,#0284c715)`, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
                  {course.thumbnail_url
                    ? <img src={course.thumbnail_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt={course.title}/>
                    : <span style={{ fontSize:36, opacity:0.3 }}>▶</span>
                  }
                  {/* Badges */}
                  <div style={{ position:"absolute", top:10, left:10, display:"flex", gap:5 }}>
                    {course.is_exclusive && <span style={{ fontSize:9, fontWeight:800, background:PINK, color:"#fff", borderRadius:4, padding:"2px 7px" }}>EXCLUSIVE</span>}
                    {course.course_type==="business" && <span style={{ fontSize:9, fontWeight:800, background:"#0284c7", color:"#fff", borderRadius:4, padding:"2px 7px" }}>BIZ</span>}
                    {course.offer_percent>0 && <span style={{ fontSize:9, fontWeight:800, background:"#16a34a", color:"#fff", borderRadius:4, padding:"2px 7px" }}>{course.offer_percent}% OFF</span>}
                  </div>
                  {course.is_free && <span style={{ position:"absolute", top:10, right:10, fontSize:9, fontWeight:800, background:"#16a34a", color:"#fff", borderRadius:4, padding:"2px 7px" }}>FREE</span>}
                  {isEnrolled && <div style={{ position:"absolute", bottom:8, right:8, fontSize:10, fontWeight:700, background:PINK, color:"#fff", borderRadius:6, padding:"3px 8px" }}>▶ Continue</div>}
                </div>

                {/* Content */}
                <div style={{ padding:"14px 16px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                    <span style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:PINK }}>{course.category}</span>
                    <span style={{ fontSize:10, fontWeight:600, color:LEVEL_COLOR[course.level]||MUTED }}>{course.level}</span>
                  </div>
                  <div style={{ fontSize:14, fontWeight:700, color:TEXT, lineHeight:1.4, marginBottom:8 }}>{course.title}</div>
                  {course.description && <div style={{ fontSize:12, color:MUTED, lineHeight:1.5, marginBottom:10 }}>{course.description.slice(0,80)}...</div>}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ display:"flex", gap:8 }}>
                      <span style={{ fontSize:11, color:MUTED }}>📹 {course.total_lessons||0} lessons</span>
                      {course.duration_mins > 0 && <span style={{ fontSize:11, color:MUTED }}>⏱ {Math.round(course.duration_mins/60)}h</span>}
                    </div>
                    <div>
                      {course.is_free ? (
                        <span style={{ fontSize:12, fontWeight:700, color:"#16a34a" }}>Free</span>
                      ) : (
                        <div style={{ textAlign:"right" }}>
                          {course.offer_percent>0 && course.price>0 && (
                            <span style={{ fontSize:10, color:MUTED, textDecoration:"line-through", marginRight:4 }}>₹{course.price}</span>
                          )}
                          {course.price > 0 && (
                            <span style={{ fontSize:13, fontWeight:700, color:PINK }}>
                              ₹{course.offer_percent>0 ? Math.round(course.price*(1-course.offer_percent/100)) : course.price}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lock overlay */}
                {!canAccess && !isEnrolled && (
                  <div style={S.lock}>
                    <div style={{ fontSize:20 }}>🔒</div>
                    <div style={{ fontSize:12, fontWeight:700, color:TEXT }}>Premium Content</div>
                    <div style={{ fontSize:11, color:MUTED }}>Upgrade to access</div>
                    <button style={{ padding:"6px 16px", background:PINK, color:"#fff", border:"none", borderRadius:7, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Upgrade →</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
