import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { apiGet, apiPost } from "../lib/apiClient";

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
  const [issued,  setIssued]  = useState({}); // course_id -> certificate record
  const [issueErr, setIssueErr] = useState("");

  const plan      = profile?.plan || "free";
  const certLimit = PLAN_CERT_LIMITS[plan] ?? 0;

  useEffect(() => {
    apiGet("/api/hyperx/certificates/mine").then(d => {
      const map = {};
      (d.certificates || []).forEach(c => { map[c.course_id] = c; });
      setIssued(map);
    }).catch(() => {});
  }, []);

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
    setIssueErr("");
    try {
      const { certificate } = await apiPost("/api/hyperx/certificates", {
        courseId: course.id, courseTitle: course.title, courseCategory: course.category, courseLevel: course.level,
      });
      setIssued(prev => ({ ...prev, [course.id]: certificate }));
    } catch (e) {
      setIssueErr(e.message || "Couldn't issue your certificate. Please try again.");
    } finally {
      setIssuing(null);
    }
  };

  const S = {
    page: { minHeight:"100vh", background:LIGHT, padding:"36px 44px", fontFamily:"'Plus Jakarta Sans',sans-serif" },
    card: { background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:24, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" },
  };

  const certUsed = Object.keys(issued).length;

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'); .hx-cert-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px} @media(max-width:640px){.hx-cert-grid{grid-template-columns:1fr!important}}`}</style>

      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:22, fontWeight:800, color:TEXT, letterSpacing:"-0.04em", marginBottom:4 }}>◇ Certificates</div>
        <div style={{ fontSize:13, color:MUTED }}>Complete courses to earn verified certificates of completion</div>
      </div>

      {issueErr && (
        <div style={{ background:"#dc262610", border:"1px solid #dc262630", borderRadius:10, padding:"12px 16px", marginBottom:20, color:"#dc2626", fontSize:13 }}>{issueErr}</div>
      )}

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
          <div className="hx-cert-grid">
            {completedCourses.map((course, i) => {
              const color = CERT_COLORS[i % CERT_COLORS.length];
              const canIssue = certLimit === 999 || certUsed < certLimit;
              return (
                <div key={course.id} style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:16, overflow:"hidden", boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
                  {/* Certificate preview — corner flourishes + filled seal badge to match the printed certificate design */}
                  <div style={{ background:`linear-gradient(135deg,${color}12,#f8f9fb)`, padding:"28px 28px 20px", borderBottom:`1px solid ${BORDER}`, position:"relative" }}>
                    <div style={{ position:"absolute", top:8, left:8, width:20, height:20, borderTop:`2px solid ${color}50`, borderLeft:`2px solid ${color}50` }} />
                    <div style={{ position:"absolute", bottom:8, left:8, width:20, height:20, borderBottom:`2px solid ${color}50`, borderLeft:`2px solid ${color}50` }} />
                    <div style={{ position:"absolute", top:12, right:16, width:48, height:48, borderRadius:"50%", background:`linear-gradient(135deg,${color},${color}bb)`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 4px 12px ${color}40` }}>
                      <span style={{ fontSize:20, color:"#fff" }}>◈</span>
                    </div>
                    <div style={{ paddingRight: 60 }}>
                      <div style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", color, marginBottom:10 }}>Certificate of Completion</div>
                      <div style={{ fontSize:17, fontWeight:800, color:TEXT, letterSpacing:"-0.02em", lineHeight:1.3, marginBottom:6 }}>{course.title}</div>
                      <div style={{ fontSize:10, color:MUTED }}>Nugens · HyperX Learning</div>
                      <div style={{ fontSize:10, color:MUTED, marginTop:4 }}>Issued {course.completedAt}</div>
                    </div>
                  </div>

                  <div style={{ padding:"14px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
                    <div>
                      <div style={{ fontSize:11, color:MUTED }}>{course.category} · {course.level}</div>
                      {course.course_type === "business" && (
                        <span style={{ fontSize:9, fontWeight:700, color:"#0284c7", background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:4, padding:"1px 6px", display:"inline-block", marginTop:3 }}>BUSINESS</span>
                      )}
                    </div>
                    {issued[course.id] ? (
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                        <span style={{ fontSize:10.5, fontWeight:700, color:"#16a34a" }}>✓ Issued · {issued[course.id].cert_number}</span>
                        <button onClick={() => {
                          // Open a styled certificate print view with the user's name.
                          // Redesigned for a more premium look: landscape layout, ornamental
                          // border with corner flourishes, a seal/ribbon badge, script-style
                          // "authorized by" signature line, subtle background texture, and a
                          // verification ID footer — versus the earlier plain bordered box.
                          const cert = issued[course.id];
                          const userName = profile?.full_name || "Student";
                          const issuedDate = new Date(cert.created_at || cert.issued_at).toLocaleDateString("en-IN", {day:"numeric",month:"long",year:"numeric"});
                          const w = window.open("", "_blank", "width=1100,height=780");
                          w.document.write(`<!DOCTYPE html><html><head><title>Certificate — ${course.title}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Great+Vibes&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#e9e4d8;font-family:'Plus Jakarta Sans',sans-serif;padding:20px}
.cert{
  width:1000px;aspect-ratio:1.42/1;background:
    radial-gradient(circle at 8% 12%, ${color}0c 0%, transparent 40%),
    radial-gradient(circle at 94% 88%, ${color}0c 0%, transparent 40%),
    #fffdf8;
  position:relative;overflow:hidden;
  border:2px solid ${color};
  padding:34px;
}
.cert::before{content:'';position:absolute;inset:10px;border:1.5px solid ${color}55;pointer-events:none}
.cert::after{content:'';position:absolute;inset:15px;border:1px solid ${color}25;pointer-events:none}
.corner{position:absolute;width:64px;height:64px;border:${color} solid;opacity:0.55}
.corner.tl{top:22px;left:22px;border-width:3px 0 0 3px}
.corner.tr{top:22px;right:22px;border-width:3px 3px 0 0}
.corner.bl{bottom:22px;left:22px;border-width:0 0 3px 3px}
.corner.br{bottom:22px;right:22px;border-width:0 3px 3px 0}
.inner{position:relative;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 60px}
.brand{position:absolute;top:0;left:0;font-size:12px;font-weight:800;letter-spacing:0.08em;color:#222}
.brand span{color:${color}}
.badge{position:absolute;top:8px;right:8px;width:74px;height:74px;border-radius:50%;background:linear-gradient(135deg,${color},${color}bb);display:flex;align-items:center;justify-content:center;box-shadow:0 6px 16px ${color}55}
.badge span{color:#fff;font-size:26px}
h4{font-size:12px;letter-spacing:0.28em;color:${color};text-transform:uppercase;margin-bottom:22px;font-weight:700}
.sub{font-size:13px;color:#6b6455;margin-bottom:6px;letter-spacing:0.02em}
h1{font-family:'Great Vibes',cursive;font-size:56px;font-weight:400;color:#1a1a1a;margin:6px 0 18px;line-height:1}
.divider{width:70px;height:2px;background:${color};margin:0 auto 22px;opacity:0.6}
.sub2{font-size:12.5px;color:#6b6455;margin-bottom:8px}
h2{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:27px;font-weight:600;color:#1a1a1a;margin-bottom:10px;max-width:640px}
.course-meta{font-size:11.5px;color:#8a8574;letter-spacing:0.04em;margin-bottom:28px}
.footer{position:absolute;bottom:36px;left:60px;right:60px;display:flex;justify-content:space-between;align-items:flex-end}
.sig{text-align:left}
.sig-name{font-family:'Great Vibes',cursive;font-size:26px;color:#1a1a1a;margin-bottom:2px}
.sig-line{width:150px;border-top:1px solid #999;margin-top:4px;padding-top:5px;font-size:9.5px;color:#8a8574;letter-spacing:0.05em;text-transform:uppercase}
.verify{text-align:right;font-size:9.5px;color:#8a8574;letter-spacing:0.03em}
.verify b{color:#4a4636;font-size:10.5px}
@media print{
  body{background:#fff;padding:0}
  .cert{box-shadow:none;width:100%;aspect-ratio:auto;height:100vh}
  @page{size:landscape;margin:0}
}
</style></head><body><div class="cert">
<div class="corner tl"></div><div class="corner tr"></div><div class="corner bl"></div><div class="corner br"></div>
<div class="brand">NU<span>GENS</span> · HYPERX</div>
<div class="badge"><span>◈</span></div>
<div class="inner">
<h4>Certificate of Completion</h4>
<div class="sub">This certifies that</div>
<h1>${userName}</h1>
<div class="divider"></div>
<div class="sub2">has successfully completed the course</div>
<h2>"${course.title}"</h2>
<div class="course-meta">${(course.category || "Professional Skills").toUpperCase()} · ${(course.level || "All Levels").toUpperCase()} · ${course.total_lessons || ""} LESSONS</div>
</div>
<div class="footer">
  <div class="sig">
    <div class="sig-name">HyperX Learning</div>
    <div class="sig-line">Authorized Signatory</div>
  </div>
  <div class="verify">
    <div>Issued ${issuedDate}</div>
    <div><b>Certificate No. ${cert.cert_number}</b></div>
  </div>
</div>
</div></body></html>`);
                          w.document.close();
                          setTimeout(() => w.print(), 500);
                        }} style={{ padding:"5px 12px", background:"none", border:`1px solid ${BORDER}`, color:MUTED, borderRadius:7, fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>
                          Print / Save PDF
                        </button>
                      </div>
                    ) : canIssue ? (
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
