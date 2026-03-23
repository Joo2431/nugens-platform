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
  free:0, hx_ind_starter:0, hx_ind_premium:2, hx_ind_pro:6, hx_ind_yearly:999,
  hx_biz_starter:2, hx_biz_premium:2, hx_biz_pro:6, hx_biz_yearly:999, admin:999,
};

const CERT_COLORS = [PINK,"#7c3aed","#0284c7","#16a34a","#d97706","#db2777"];

export default function Certificates({ profile }) {
  const nav = useNavigate();
  const [completedCourses, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(null);

  const plan      = profile?.plan || "free";
  const certLimit = PLAN_CERT_LIMITS[plan] ?? 0;

  useEffect(() => {
    if (!profile?.id) { setLoading(false); return; }
    async function load() {
      // Get all lessons completed per course
      const { data: prog } = await supabase.from("hx_progress").select("course_id").eq("user_id", profile.id);
      if (!prog || prog.length === 0) { setLoading(false); return; }

      // Count lessons per course
      const courseCounts = {};
      prog.forEach(p => { if(p.course_id) courseCounts[p.course_id] = (courseCounts[p.course_id]||0)+1; });

      // Get course details
      const courseIds = Object.keys(courseCounts);
      if (courseIds.length === 0) { setLoading(false); return; }

      const { data: courses } = await supabase.from("hx_courses").select("id,title,category,total_lessons,level,course_type").in("id", courseIds);

      // Mark fully completed courses
      const completed = (courses||[]).filter(c => {
        const done = courseCounts[c.id] || 0;
        return c.total_lessons > 0 && done >= c.total_lessons;
      }).map(c => ({ ...c, completedAt: new Date().toLocaleDateString("en-IN", {day:"numeric",month:"long",year:"numeric"}) }));

      setCompleted(completed);
      setLoading(false);
    }
    load();
  }, [profile?.id]);

  const issueCert = async (course) => {
    if (certLimit === 0) { nav("/pricing"); return; }
    setIssuing(course.id);
    // In a real app: insert into hx_certificates table and generate PDF
    await new Promise(r => setTimeout(r, 1500)); // simulate
    setIssuing(null);
    alert(`Certificate issued for "${course.title}"! In production, this would generate a PDF.`);
  };

  const S = {
    page: { minHeight:"100vh", background:LIGHT, padding:"36px 44px", fontFamily:"'Plus Jakarta Sans',sans-serif" },
    card: { background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:24, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" },
  };

  const certUsed = Math.min(completedCourses.length, certLimit === 999 ? 0 : certLimit);

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:22, fontWeight:800, color:TEXT, letterSpacing:"-0.04em", marginBottom:4 }}>◇ Certificates</div>
        <div style={{ fontSize:13, color:MUTED }}>Complete courses to earn verified certificates of completion</div>
      </div>

      {/* Plan cert status */}
      <div style={{ ...S.card, marginBottom:28, background: certLimit===0?"#fef2f2":CARD, border:`1px solid ${certLimit===0?`${PINK}20`:BORDER}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:TEXT, marginBottom:4 }}>
              {certLimit===0 ? "Certifications not available on free plan" : certLimit===999 ? "Unlimited Certifications" : `${certLimit} Certifications Available`}
            </div>
            <div style={{ fontSize:12, color:MUTED }}>
              {certLimit===0 ? "Upgrade to earn certifications for your completed courses." : certLimit===999 ? "Complete any course to earn a certificate." : `You can earn up to ${certLimit} certificates per year on your current plan.`}
            </div>
          </div>
          {certLimit===0 && (
            <button onClick={()=>nav("/pricing")} style={{ padding:"10px 22px", background:PINK, color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", flexShrink:0 }}>
              Upgrade Plan
            </button>
          )}
          {certLimit > 0 && certLimit < 999 && (
            <div style={{ textAlign:"center", flexShrink:0 }}>
              <div style={{ fontSize:32, fontWeight:800, color:PINK }}>{certLimit-certUsed}</div>
              <div style={{ fontSize:11, color:MUTED }}>remaining</div>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign:"center", padding:"48px 0", color:MUTED }}>Loading your courses...</div>
      ) : completedCourses.length === 0 ? (
        <div style={{ ...S.card, textAlign:"center", padding:"60px 32px" }}>
          <div style={{ fontSize:40, marginBottom:16, opacity:0.2 }}>◇</div>
          <div style={{ fontSize:16, fontWeight:700, color:TEXT, marginBottom:8 }}>No completed courses yet</div>
          <div style={{ fontSize:13, color:MUTED, marginBottom:20 }}>Complete all lessons in a course to earn a certificate.</div>
          <button onClick={()=>nav("/courses")} style={{ padding:"10px 24px", background:PINK, color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
            Browse Courses →
          </button>
        </div>
      ) : (
        <>
          <div style={{ fontSize:14, fontWeight:700, color:TEXT, marginBottom:16 }}>Completed Courses ({completedCourses.length})</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:16 }}>
            {completedCourses.map((course, i) => {
              const color = CERT_COLORS[i % CERT_COLORS.length];
              const canIssue = certLimit === 999 || certUsed < certLimit;
              return (
                <div key={course.id} style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:16, overflow:"hidden", boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
                  {/* Certificate preview */}
                  <div style={{ background:`linear-gradient(135deg,${color}12,#f8f9fb)`, padding:"28px 28px 20px", borderBottom:`1px solid ${BORDER}`, position:"relative" }}>
                    <div style={{ position:"absolute", top:12, right:16, width:48, height:48, borderRadius:"50%", border:`2px solid ${color}30`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <span style={{ fontSize:20, color:`${color}60` }}>◈</span>
                    </div>
                    <div style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", color, marginBottom:10 }}>Certificate of Completion</div>
                    <div style={{ fontSize:17, fontWeight:800, color:TEXT, letterSpacing:"-0.02em", lineHeight:1.3, maxWidth:220, marginBottom:6 }}>{course.title}</div>
                    <div style={{ fontSize:10, color:MUTED }}>Nugens · HyperX Learning</div>
                    <div style={{ fontSize:10, color:MUTED, marginTop:4 }}>Issued {course.completedAt}</div>
                  </div>

                  <div style={{ padding:"14px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <div style={{ fontSize:11, color:MUTED }}>{course.category} · {course.level}</div>
                      {course.course_type === "business" && (
                        <span style={{ fontSize:9, fontWeight:700, color:"#0284c7", background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:4, padding:"1px 6px", display:"inline-block", marginTop:3 }}>BUSINESS</span>
                      )}
                    </div>
                    {canIssue ? (
                      <button onClick={()=>issueCert(course)} disabled={issuing===course.id} style={{ padding:"7px 16px", background:color+"18", border:`1px solid ${color}30`, color, borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", opacity:issuing===course.id?0.6:1 }}>
                        {issuing===course.id ? "Issuing..." : "⬇ Get Certificate"}
                      </button>
                    ) : (
                      <button onClick={()=>nav("/pricing")} style={{ padding:"7px 16px", background:"#f3f4f6", border:`1px solid ${BORDER}`, color:MUTED, borderRadius:8, fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>
                        Upgrade for cert
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Guidance section */}
      <div style={{ ...S.card, marginTop:28, background:"#eff6ff", border:"1px solid #bfdbfe" }}>
        <div style={{ fontSize:14, fontWeight:700, color:TEXT, marginBottom:6 }}>🎯 Real-Time Guidance</div>
        <div style={{ fontSize:13, color:MUTED, lineHeight:1.65, marginBottom:14 }}>
          Stuck on a course? Need career advice on how to apply what you're learning? Gen-E Mini is available 24/7 for learning support, career guidance, and course questions.
        </div>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          {["Ask about course content","Get career application tips","Request a study plan","Understand a concept better"].map(q=>(
            <span key={q} style={{ fontSize:11, color:"#2563eb", background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:20, padding:"5px 12px" }}>{q}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
