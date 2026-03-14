import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

const PINK = "#e8185d";
const B    = "#1e1e1e";

const LEVEL_COLOR = { Beginner:"#16a34a", Intermediate:"#d97706", Advanced:PINK };

export default function HXDashboard({ profile }) {
  const [courses,     setCourses]     = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [progress,    setProgress]    = useState([]);
  const [loading,     setLoading]     = useState(true);

  const plan      = profile?.plan || "free";
  const firstName = (profile?.full_name || "").split(" ")[0] || "there";
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    async function load() {
      const [{ data: c }, { data: e }, { data: p }] = await Promise.all([
        supabase.from("hx_courses").select("*").eq("is_published", true).limit(8),
        supabase.from("hx_enrollments").select("*").eq("user_id", profile?.id || ""),
        supabase.from("hx_progress").select("*").eq("user_id", profile?.id || ""),
      ]);
      setCourses(c || []);
      setEnrollments(e || []);
      setProgress(p || []);
      setLoading(false);
    }
    if (profile?.id) load();
    else setLoading(false);
  }, [profile?.id]);

  const enrolledIds = new Set(enrollments.map(e => e.course_id));
  const inProgress  = courses.filter(c => enrolledIds.has(c.id));
  const recommended = courses.filter(c => !enrolledIds.has(c.id)).slice(0, 4);

  const getCatColor = (cat) => {
    const map = { Communication:PINK, "Career Strategy":"#0284c7", Mindset:"#7c3aed", "Interview Prep":"#d97706", "Personal Brand":"#16a34a", Leadership:"#8b5cf6", Productivity:"#06b6d4" };
    return map[cat] || PINK;
  };

  return (
    <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",padding:"32px 28px 80px",background:"#09090a",minHeight:"100vh"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box}
        .hx-card{background:#111;border:1px solid ${B};border-radius:12px;padding:20px;transition:all 0.18s;cursor:pointer;text-decoration:none;display:block}
        .hx-card:hover{border-color:#333;transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,0.4)}
        .hx-tag{display:inline-block;padding:2px 9px;border-radius:5px;font-size:10.5px;font-weight:700;letter-spacing:0.04em}
        .prog-bar{height:3px;background:#1e1e1e;border-radius:99px;overflow:hidden;margin-top:10px}
        .prog-fill{height:100%;border-radius:99px;background:${PINK}}
        .stat-card{background:#111;border:1px solid ${B};border-radius:12px;padding:18px 20px}
        @media(max-width:700px){.stats-row{grid-template-columns:1fr 1fr!important}.courses-grid{grid-template-columns:1fr!important}}
      `}</style>

      {/* Header */}
      <div style={{marginBottom:32}}>
        <h1 style={{fontWeight:800,fontSize:"clamp(20px,2.5vw,26px)",letterSpacing:"-0.03em",color:"#fff",marginBottom:4}}>
          {greeting}, {firstName} 👋
        </h1>
        <p style={{fontSize:13.5,color:"#555"}}>Keep learning — your career is being built one lesson at a time.</p>
      </div>

      {/* Stats */}
      <div className="stats-row" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:36}}>
        {[
          {label:"Courses Enrolled",  val: enrollments.length || "0",   sub:"Active",           color:PINK},
          {label:"Lessons Done",       val: progress.length || "0",      sub:"Total",            color:"#fff"},
          {label:"Hours Learned",      val: Math.round((progress.length||0)*0.35*10)/10 || "0", sub:"This month", color:PINK},
          {label:"Certificates",       val: plan==="free"?"—": Math.floor((progress.length||0)/12)||"0", sub:plan==="free"?"Upgrade to earn":"Earned", color:"#fff"},
        ].map(s=>(
          <div key={s.label} className="stat-card">
            <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"#444",marginBottom:6}}>{s.label}</div>
            <div style={{fontSize:26,fontWeight:800,letterSpacing:"-0.04em",color:s.color,lineHeight:1}}>{s.val}</div>
            <div style={{fontSize:11.5,color:"#444",marginTop:4}}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Free upgrade banner */}
      {plan === "free" && (
        <div style={{background:`${PINK}10`,border:`1px solid ${PINK}30`,borderRadius:12,padding:"16px 20px",marginBottom:28,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:2}}>Unlock all HyperX courses</div>
            <div style={{fontSize:12.5,color:"#666"}}>Free plan gives you 3 courses. Upgrade for the full library + certificates.</div>
          </div>
          <Link to="/pricing" style={{padding:"9px 20px",borderRadius:8,background:PINK,color:"#fff",fontSize:13,fontWeight:700,textDecoration:"none",whiteSpace:"nowrap"}}>View plans →</Link>
        </div>
      )}

      {loading ? (
        <div style={{textAlign:"center",padding:"60px 0",color:"#444"}}>Loading courses…</div>
      ) : (
        <>
          {/* In progress */}
          {inProgress.length > 0 && (
            <div style={{marginBottom:36}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                <div style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"#444"}}>Continue Learning</div>
                <Link to="/courses" style={{fontSize:12,color:PINK,textDecoration:"none",fontWeight:600}}>All courses →</Link>
              </div>
              <div className="courses-grid" style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14}}>
                {inProgress.slice(0,4).map(c=>(
                  <Link key={c.id} to={`/courses/${c.id}`} className="hx-card">
                    {c.thumbnail_url && <img src={c.thumbnail_url} style={{width:"100%",height:120,objectFit:"cover",borderRadius:8,marginBottom:12}} alt={c.title}/>}
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                      <span className="hx-tag" style={{background:getCatColor(c.category)+"20",color:getCatColor(c.category)}}>{c.category}</span>
                      <span style={{fontSize:11,color:"#444"}}>{c.total_lessons} lessons</span>
                    </div>
                    <div style={{fontSize:14.5,fontWeight:700,color:"#fff",lineHeight:1.4,marginBottom:4}}>{c.title}</div>
                    <div style={{fontSize:11.5,color:"#555"}}>{Math.round(c.duration_mins/60*10)/10}h</div>
                    <div className="prog-bar"><div className="prog-fill" style={{width:"40%"}}/></div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* All courses / recommended */}
          <div style={{marginBottom:36}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <div style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"#444"}}>
                {inProgress.length > 0 ? "Recommended For You" : "Start Learning"}
              </div>
              <Link to="/courses" style={{fontSize:12,color:PINK,textDecoration:"none",fontWeight:600}}>Browse all →</Link>
            </div>
            {courses.length === 0 ? (
              <div style={{background:"#111",border:`1px solid ${B}`,borderRadius:12,padding:"40px",textAlign:"center"}}>
                <div style={{fontSize:32,marginBottom:12}}>📚</div>
                <div style={{fontSize:15,fontWeight:700,color:"#fff",marginBottom:6}}>Courses coming soon</div>
                <div style={{fontSize:13,color:"#555"}}>The admin is still uploading courses. Check back soon!</div>
              </div>
            ) : (
              <div className="courses-grid" style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14}}>
                {(inProgress.length>0 ? recommended : courses).slice(0,4).map(c=>{
                  const locked = plan==="free" && !c.is_free;
                  return (
                    <Link key={c.id} to={locked?"/pricing":`/courses/${c.id}`} className="hx-card" style={{opacity:locked?0.65:1,position:"relative"}}>
                      {locked && <div style={{position:"absolute",top:12,right:12,background:"#1e1e1e",border:`1px solid ${B}`,borderRadius:5,padding:"2px 8px",fontSize:10,fontWeight:600,color:"#555"}}>🔒 Pro</div>}
                      {c.is_free && !locked && <div style={{position:"absolute",top:12,right:12,background:"#16a34a18",border:"1px solid #16a34a30",borderRadius:5,padding:"2px 8px",fontSize:10,fontWeight:600,color:"#16a34a"}}>FREE</div>}
                      {c.thumbnail_url && <img src={c.thumbnail_url} style={{width:"100%",height:110,objectFit:"cover",borderRadius:8,marginBottom:12}} alt={c.title}/>}
                      <span className="hx-tag" style={{background:getCatColor(c.category)+"20",color:getCatColor(c.category),marginBottom:10,display:"inline-block"}}>{c.category}</span>
                      <div style={{fontSize:14.5,fontWeight:700,color:"#fff",lineHeight:1.4,marginBottom:8}}>{c.title}</div>
                      <div style={{display:"flex",gap:12,fontSize:12,color:"#555",flexWrap:"wrap"}}>
                        <span>{c.total_lessons} lessons</span>
                        <span>{Math.round(c.duration_mins/60*10)/10}h</span>
                        <span style={{color:LEVEL_COLOR[c.level]||"#fff"}}>{c.level}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
