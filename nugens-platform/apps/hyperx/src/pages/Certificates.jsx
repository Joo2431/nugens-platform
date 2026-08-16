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
                          const dark = "#8f0f38";
                          const w = window.open("", "_blank", "width=1100,height=780");
                          w.document.write(`<!DOCTYPE html><html><head><title>Certificate — ${course.title}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Great+Vibes&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#e9e4d8;font-family:'Plus Jakarta Sans',sans-serif;padding:20px}
.cert{
  width:1000px;aspect-ratio:1.42/1;background:#fffdf8;
  position:relative;overflow:hidden;
  border:2px solid ${color};
  padding:34px;
}
.cert::before{content:'';position:absolute;inset:10px;border:1.5px solid ${color}55;pointer-events:none;z-index:3}
.cert::after{content:'';position:absolute;inset:15px;border:1px solid ${color}25;pointer-events:none;z-index:3}

/* Wave background texture, echoing the reference's subtle wavy lines */
.waves{position:absolute;inset:0;opacity:0.5;pointer-events:none;z-index:0}

/* Folded-ribbon corner wedges — top-left and bottom-right, each with a
   darker inner "fold shadow" triangle for a 3D paper-fold look */
.wedge{position:absolute;width:110px;height:110px;z-index:2}
.wedge.tl{top:-2px;left:-2px;background:linear-gradient(135deg,${color},${dark});clip-path:polygon(0 0,100% 0,0 100%);box-shadow:2px 2px 8px rgba(0,0,0,0.18)}
.wedge.tl .fold{position:absolute;top:0;left:0;width:100%;height:100%;background:${dark};clip-path:polygon(0 58%,42% 100%,0 100%)}
.wedge.br{bottom:-2px;right:-2px;background:linear-gradient(-45deg,${color},${dark});clip-path:polygon(100% 100%,100% 0,0 100%);box-shadow:-2px -2px 8px rgba(0,0,0,0.18)}
.wedge.br .fold{position:absolute;bottom:0;right:0;width:100%;height:100%;background:${dark};clip-path:polygon(100% 42%,58% 0,100% 0)}

.dots{position:absolute;bottom:26px;right:110px;width:70px;height:70px;z-index:1;
  background-image:radial-gradient(${color}45 1.6px, transparent 1.6px);background-size:11px 11px;opacity:0.55}

.inner{position:relative;z-index:2;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 60px}
.brand{position:absolute;top:4px;left:26px;font-size:12px;font-weight:800;letter-spacing:0.08em;color:#222;z-index:3}
.brand span{color:${color}}

/* Top-right medallion with an outer ring and a ribbon tail hanging behind it */
.medallion{position:absolute;top:14px;right:34px;z-index:2;width:78px;height:130px}
.medallion .tail{position:absolute;top:30px;left:50%;transform:translateX(-50%);width:34px;height:90px;background:linear-gradient(${color},${dark});clip-path:polygon(0 0,100% 0,100% 82%,50% 100%,0 82%)}
.medallion .ring{position:absolute;top:0;left:50%;transform:translateX(-50%);width:70px;height:70px;border-radius:50%;border:2.5px solid ${color}90;background:#fffdf8;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(0,0,0,0.15)}
.medallion .ring .core{width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,${color},${dark});display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 2px rgba(255,255,255,0.25)}
.medallion .ring .core span{color:#fff;font-size:19px}

.title-row{display:flex;align-items:center;gap:14px;margin-bottom:20px}
.title-row .dia{color:${color};font-size:11px;opacity:0.7}
.title-row .dline{width:80px;height:1px;background:${color}70}
h4{font-size:12px;letter-spacing:0.28em;color:${color};text-transform:uppercase;font-weight:700;white-space:nowrap}
.sub{font-size:13px;color:#6b6455;margin-bottom:6px;letter-spacing:0.02em}
h1{font-family:'Great Vibes',cursive;font-size:56px;font-weight:400;color:#1a1a1a;margin:6px 0 10px;line-height:1}
.divider-row{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:20px}
.divider-row .dline{width:60px;height:1.5px;background:${color};opacity:0.6}
.divider-row .dia{color:${color};font-size:10px;opacity:0.8}
.sub2{font-size:12.5px;color:#6b6455;margin-bottom:8px}
h2{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:27px;font-weight:600;color:#1a1a1a;margin-bottom:14px;max-width:640px}
.meta-row{display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:6px}
.meta-row svg{opacity:0.75;flex-shrink:0}
.course-meta{font-size:11.5px;color:#8a8574;letter-spacing:0.04em;white-space:nowrap}

.footer{position:absolute;bottom:36px;left:60px;right:60px;display:flex;justify-content:space-between;align-items:flex-end;z-index:2}
.sig{text-align:left}
.sig-name{font-family:'Great Vibes',cursive;font-size:26px;color:#1a1a1a;margin-bottom:2px}
.sig-line{width:150px;border-top:1px solid #999;margin-top:4px;padding-top:5px;font-size:9.5px;color:#8a8574;letter-spacing:0.05em;text-transform:uppercase}
.verify{text-align:right;font-size:9.5px;color:#8a8574;letter-spacing:0.03em}
.verify b{color:${color};font-size:10.5px}

/* Bottom award-medal seal, with two angled ribbon tails */
.seal-wrap{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);width:120px;height:118px;z-index:1}
.seal-wrap .strap{position:absolute;top:40px;width:26px;height:70px;background:${color}}
.seal-wrap .strap.l{left:24px;transform:rotate(14deg);clip-path:polygon(0 0,100% 0,100% 82%,50% 100%,0 82%)}
.seal-wrap .strap.r{right:24px;transform:rotate(-14deg);clip-path:polygon(0 0,100% 0,100% 82%,50% 100%,0 82%)}
.seal-wrap .medal{position:absolute;top:0;left:50%;transform:translateX(-50%);width:82px;height:82px;border-radius:50%;
  background:radial-gradient(circle at 35% 30%,#d4af37,#8a6d1f 70%);
  display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(0,0,0,0.25);border:2px solid #b8901f}
.seal-wrap .medal-inner{width:66px;height:66px;border-radius:50%;background:#151515;display:flex;flex-direction:column;align-items:center;justify-content:center;border:1.5px dashed #c9a132}
.seal-wrap .medal-inner .star{color:#d4af37;font-size:11px;margin-bottom:2px}
.seal-wrap .medal-inner span{color:#e8d9a8;font-size:8px;font-weight:700;letter-spacing:0.06em;line-height:1.3;text-align:center}

@media print{
  body{background:#fff;padding:0}
  .cert{box-shadow:none;width:100%;aspect-ratio:auto;height:100vh}
  @page{size:landscape;margin:0}
}
</style></head><body><div class="cert">
<svg class="waves" viewBox="0 0 1000 700" preserveAspectRatio="none">
  <path d="M0,80 Q150,20 300,90 T600,70 T1000,100" fill="none" stroke="${color}" stroke-width="1" opacity="0.12"/>
  <path d="M0,620 Q200,560 420,630 T900,610 T1000,630" fill="none" stroke="${color}" stroke-width="1" opacity="0.12"/>
  <path d="M700,0 Q800,90 950,60 T1000,180" fill="none" stroke="${color}" stroke-width="1" opacity="0.1"/>
</svg>
<div class="wedge tl"><div class="fold"></div></div>
<div class="wedge br"><div class="fold"></div></div>
<div class="dots"></div>
<div class="brand">NU<span>GENS</span> · HYPERX</div>
<div class="medallion">
  <div class="tail"></div>
  <div class="ring"><div class="core"><span>◈</span></div></div>
</div>
<div class="inner">
<div class="title-row"><span class="dline"></span><span class="dia">◆</span><h4>Certificate of Completion</h4><span class="dia">◆</span><span class="dline"></span></div>
<div class="sub">This certifies that</div>
<h1>${userName}</h1>
<div class="divider-row"><span class="dline"></span><span class="dia">◆</span><span class="dline"></span></div>
<div class="sub2">has successfully completed the course</div>
<h2>\u201C${course.title}\u201D</h2>
<div class="meta-row">
  <svg width="26" height="14" viewBox="0 0 26 14"><path d="M13 13 C6 10, 2 6, 4 1 C7 3, 9 6, 13 7 Z" fill="${color}" opacity="0.55"/></svg>
  <span class="course-meta">${(course.category || "Professional Skills").toUpperCase()} · ${(course.level || "All Levels").toUpperCase()} · ${course.total_lessons || ""} LESSONS</span>
  <svg width="26" height="14" viewBox="0 0 26 14"><path d="M13 13 C20 10, 24 6, 22 1 C19 3, 17 6, 13 7 Z" fill="${color}" opacity="0.55"/></svg>
</div>
</div>
<div class="seal-wrap">
  <div class="strap l"></div>
  <div class="strap r"></div>
  <div class="medal"><div class="medal-inner"><span class="star">\u2605</span><span>HYPERX<br/>LEARNING</span></div></div>
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