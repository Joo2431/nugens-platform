import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

const PINK = "#e8185d";
const B    = "#1e1e1e";

export default function CoursePlayer({ profile }) {
  const { id } = useParams();
  const [course,       setCourse]       = useState(null);
  const [lessons,      setLessons]      = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [completed,    setCompleted]    = useState(new Set());
  const [loading,      setLoading]      = useState(true);
  const videoRef = useRef(null);
  const plan = profile?.plan || "free";

  useEffect(() => {
    async function load() {
      const [{ data: c }, { data: l }, { data: p }] = await Promise.all([
        supabase.from("hx_courses").select("*").eq("id", id).single(),
        supabase.from("hx_lessons").select("*").eq("course_id", id).order("sort_order"),
        supabase.from("hx_progress").select("lesson_id").eq("user_id", profile?.id || ""),
      ]);
      setCourse(c);
      setLessons(l || []);
      setCompleted(new Set((p||[]).map(x=>x.lesson_id)));
      if (l && l.length > 0) setActiveLesson(l[0]);
      setLoading(false);
    }
    load();
  }, [id, profile?.id]);

  const markComplete = async (lesson) => {
    if (completed.has(lesson.id) || !profile?.id) return;
    await supabase.from("hx_progress").upsert({ user_id: profile.id, lesson_id: lesson.id }, { onConflict: "user_id,lesson_id" });
    setCompleted(prev => new Set([...prev, lesson.id]));
  };

  const canAccess = (lesson) => lesson.is_free || plan !== "free";
  const doneCount = lessons.filter(l => completed.has(l.id)).length;
  const progress  = lessons.length > 0 ? Math.round(doneCount / lessons.length * 100) : 0;

  if (loading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#09090a",color:PINK,fontWeight:800,fontSize:22}}>HyperX</div>;
  if (!course)  return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#09090a",color:"#555"}}>Course not found. <Link to="/courses" style={{color:PINK,marginLeft:6}}>Back</Link></div>;

  return (
    <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",background:"#09090a",minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box}
        .lesson-row{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;cursor:pointer;transition:background 0.13s;border:none;background:none;width:100%;text-align:left;font-family:'Plus Jakarta Sans',sans-serif}
        .lesson-row:hover{background:#1a1a1a}
        .lesson-row.active{background:${PINK}15;border:1px solid ${PINK}25}
        video{width:100%;border-radius:12px;background:#000}
        video:focus{outline:none}
      `}</style>

      {/* Top bar */}
      <div style={{background:"#0a0a0a",borderBottom:`1px solid ${B}`,padding:"12px 24px",display:"flex",alignItems:"center",gap:16,position:"sticky",top:0,zIndex:10}}>
        <Link to="/courses" style={{color:"#555",textDecoration:"none",fontSize:13,flexShrink:0}}>← Back</Link>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:700,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{course.title}</div>
          <div style={{fontSize:11.5,color:"#555",marginTop:1}}>{doneCount}/{lessons.length} lessons complete</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          <div style={{width:120,height:4,background:"#1e1e1e",borderRadius:99,overflow:"hidden"}}>
            <div style={{width:`${progress}%`,height:"100%",background:PINK,borderRadius:99,transition:"width 0.3s"}}/>
          </div>
          <span style={{fontSize:11.5,color:PINK,fontWeight:600}}>{progress}%</span>
        </div>
      </div>

      <div style={{display:"flex",flex:1}}>
        {/* Video area */}
        <div style={{flex:1,padding:"28px 32px",minWidth:0}}>
          {activeLesson && canAccess(activeLesson) ? (
            <>
              {activeLesson.video_url ? (
                <video ref={videoRef} controls src={activeLesson.video_url}
                  style={{width:"100%",borderRadius:12,background:"#000",maxHeight:"60vh"}}
                  onEnded={() => markComplete(activeLesson)}
                />
              ) : (
                <div style={{width:"100%",aspectRatio:"16/9",background:"#111",border:`1px solid ${B}`,borderRadius:12,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                  <div style={{width:64,height:64,borderRadius:"50%",background:`${PINK}20`,border:`2px solid ${PINK}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,color:PINK}}>▶</div>
                  <div style={{fontSize:13,color:"#444",marginTop:14}}>Video will appear here once uploaded</div>
                </div>
              )}
              <div style={{marginTop:20}}>
                <h2 style={{fontWeight:800,fontSize:18,color:"#fff",letterSpacing:"-0.025em",marginBottom:6}}>{activeLesson.title}</h2>
                {activeLesson.description && <p style={{fontSize:13.5,color:"#666",lineHeight:1.7}}>{activeLesson.description}</p>}
                <div style={{display:"flex",gap:12,marginTop:16}}>
                  {!completed.has(activeLesson.id) && (
                    <button onClick={()=>markComplete(activeLesson)} style={{padding:"9px 20px",borderRadius:8,background:PINK,border:"none",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                      Mark Complete ✓
                    </button>
                  )}
                  {completed.has(activeLesson.id) && (
                    <span style={{padding:"9px 16px",borderRadius:8,background:"#16a34a18",border:"1px solid #16a34a40",color:"#16a34a",fontSize:13,fontWeight:600}}>✓ Completed</span>
                  )}
                  {/* Next lesson */}
                  {(() => {
                    const idx = lessons.findIndex(l=>l.id===activeLesson.id);
                    const next = lessons[idx+1];
                    return next ? (
                      <button onClick={()=>setActiveLesson(next)} style={{padding:"9px 20px",borderRadius:8,background:"#111",border:`1px solid ${B}`,color:"#aaa",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                        Next →
                      </button>
                    ) : null;
                  })()}
                </div>
              </div>
            </>
          ) : (
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"50vh",textAlign:"center"}}>
              <div style={{fontSize:40,marginBottom:16}}>🔒</div>
              <div style={{fontSize:17,fontWeight:700,color:"#fff",marginBottom:8}}>Pro lesson</div>
              <div style={{fontSize:13.5,color:"#555",marginBottom:20}}>Upgrade to access this lesson and the full course library.</div>
              <Link to="/pricing" style={{padding:"10px 24px",borderRadius:9,background:PINK,color:"#fff",fontSize:14,fontWeight:700,textDecoration:"none"}}>Upgrade to Pro →</Link>
            </div>
          )}
        </div>

        {/* Lesson list sidebar */}
        <div style={{width:320,borderLeft:`1px solid ${B}`,padding:"20px 12px",overflowY:"auto",flexShrink:0}}>
          <div style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"#444",padding:"0 8px",marginBottom:12}}>
            {lessons.length} Lessons
          </div>
          {lessons.map((lesson, idx) => {
            const isActive   = activeLesson?.id === lesson.id;
            const isDone     = completed.has(lesson.id);
            const isLocked   = !canAccess(lesson);
            return (
              <button key={lesson.id} className={`lesson-row${isActive?" active":""}`}
                onClick={() => !isLocked && setActiveLesson(lesson)}
                style={{opacity:isLocked?0.5:1}}>
                <div style={{width:24,height:24,borderRadius:"50%",border:`1.5px solid ${isDone?"#16a34a":isActive?PINK:"#333"}`,background:isDone?"#16a34a":isActive?PINK+"15":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:10,color:isDone?"#fff":isActive?PINK:"#444",fontWeight:700}}>
                  {isDone ? "✓" : isLocked ? "🔒" : idx+1}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12.5,fontWeight:600,color:isActive?"#fff":"#aaa",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{lesson.title}</div>
                  <div style={{fontSize:11,color:"#444",marginTop:1}}>{lesson.duration_mins}m {lesson.is_free&&<span style={{color:"#16a34a",fontWeight:600,marginLeft:4}}>FREE</span>}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
