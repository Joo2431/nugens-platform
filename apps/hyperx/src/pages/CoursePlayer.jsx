import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const PINK   = "#e8185d";
const TEXT   = "#111827";
const MUTED  = "#6b7280";
const CARD   = "#ffffff";
const BORDER = "#e8eaed";

const PLAN_ACCESS = {
  free: (l)=>l.is_free, hx_ind_starter:(l)=>l.is_free,
  hx_ind_premium:()=>true, hx_ind_pro:()=>true, hx_ind_yearly:()=>true,
  hx_biz_starter:(l)=>l.is_free,
  hx_biz_premium:()=>true, hx_biz_pro:()=>true, hx_biz_yearly:()=>true,
  admin:()=>true,
};

export default function CoursePlayer({ profile }) {
  const { id } = useParams();
  const nav = useNavigate();
  const [course,       setCourse]       = useState(null);
  const [lessons,      setLessons]      = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [completed,    setCompleted]    = useState(new Set());
  const [loading,      setLoading]      = useState(true);
  const [sideOpen,     setSideOpen]     = useState(true);
  const [notes,        setNotes]        = useState("");
  const videoRef = useRef(null);

  const plan   = profile?.plan || "free";
  const canAccess = PLAN_ACCESS[plan] || PLAN_ACCESS.free;

  useEffect(() => {
    async function load() {
      const [{ data:c }, { data:l }, { data:p }] = await Promise.all([
        supabase.from("hx_courses").select("*").eq("id", id).single(),
        supabase.from("hx_lessons").select("*").eq("course_id", id).order("sort_order"),
        supabase.from("hx_progress").select("lesson_id").eq("user_id", profile?.id || ""),
      ]);
      setCourse(c);
      setLessons(l || []);
      setCompleted(new Set((p||[]).map(x=>x.lesson_id)));
      if (l?.length > 0) setActiveLesson(l[0]);
      setLoading(false);
    }
    load();
  }, [id, profile?.id]);

  const markComplete = async (lesson) => {
    if (completed.has(lesson.id) || !profile?.id) return;
    await supabase.from("hx_progress").upsert(
      { user_id:profile.id, lesson_id:lesson.id, course_id:id },
      { onConflict:"user_id,lesson_id" }
    );
    setCompleted(prev => new Set([...prev, lesson.id]));
  };

  const progress = lessons.length > 0 ? Math.round((completed.size / lessons.length) * 100) : 0;

  if (loading) return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#fff", fontFamily:"'Plus Jakarta Sans',sans-serif", color:PINK, fontWeight:700 }}>Loading...</div>;
  if (!course) return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh" }}>Course not found.</div>;

  const S = {
    wrap:   { display:"flex", height:"100vh", background:"#f8f9fb", fontFamily:"'Plus Jakarta Sans',sans-serif" },
    side:   { width: sideOpen ? 300 : 0, minWidth: sideOpen ? 300 : 0, background:CARD, borderRight:`1px solid ${BORDER}`, display:"flex", flexDirection:"column", overflow:"hidden", transition:"all 0.2s", flexShrink:0 },
    main:   { flex:1, display:"flex", flexDirection:"column", overflow:"hidden" },
    topBar: { background:CARD, borderBottom:`1px solid ${BORDER}`, padding:"12px 20px", display:"flex", alignItems:"center", gap:12, flexShrink:0 },
    lesRow: (active, locked) => ({ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", cursor:locked?"not-allowed":"pointer", background:active?`${PINK}08`:"transparent", borderLeft:active?`3px solid ${PINK}`:"3px solid transparent", opacity:locked?0.5:1 }),
  };

  return (
    <div style={S.wrap}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      {/* Lesson sidebar */}
      <div style={S.side}>
        <div style={{ padding:"16px 14px", borderBottom:`1px solid ${BORDER}` }}>
          <div style={{ fontSize:11, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4 }}>Course Content</div>
          <div style={{ fontSize:13, fontWeight:700, color:TEXT, lineHeight:1.35 }}>{course.title}</div>
          <div style={{ marginTop:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
              <span style={{ fontSize:11, color:MUTED }}>{completed.size}/{lessons.length} lessons</span>
              <span style={{ fontSize:11, fontWeight:700, color:PINK }}>{progress}%</span>
            </div>
            <div style={{ height:4, background:"#f3f4f6", borderRadius:2 }}>
              <div style={{ height:"100%", width:`${progress}%`, background:PINK, borderRadius:2, transition:"width 0.3s" }}/>
            </div>
          </div>
        </div>
        <div style={{ flex:1, overflowY:"auto" }}>
          {lessons.map((lesson, idx) => {
            const isActive = activeLesson?.id === lesson.id;
            const isDone   = completed.has(lesson.id);
            const locked   = !canAccess(lesson);
            return (
              <div key={lesson.id} style={S.lesRow(isActive, locked)} onClick={()=>{ if(!locked) setActiveLesson(lesson); }}>
                <div style={{ width:24, height:24, borderRadius:"50%", background:isDone?"#16a34a15":isActive?`${PINK}15`:"#f3f4f6", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <span style={{ fontSize:10, fontWeight:700, color:isDone?"#16a34a":isActive?PINK:MUTED }}>
                    {locked ? "🔒" : isDone ? "✓" : idx+1}
                  </span>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:isActive?700:500, color:isActive?PINK:TEXT, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{lesson.title}</div>
                  <div style={{ fontSize:10, color:MUTED }}>{lesson.duration_mins||0} min{lesson.is_free?" · Free":""}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div style={S.main}>
        {/* Top bar */}
        <div style={S.topBar}>
          <button onClick={()=>nav("/")} style={{ background:"none", border:`1px solid ${BORDER}`, borderRadius:7, padding:"5px 12px", fontSize:12, color:MUTED, cursor:"pointer", fontFamily:"inherit" }}>← Dashboard</button>
          <button onClick={()=>setSideOpen(s=>!s)} style={{ background:"none", border:`1px solid ${BORDER}`, borderRadius:7, padding:"5px 12px", fontSize:12, color:MUTED, cursor:"pointer", fontFamily:"inherit" }}>{sideOpen?"Hide":"Show"} Lessons</button>
          <div style={{ flex:1 }}/>
          <div style={{ fontSize:12, fontWeight:700, color:TEXT }}>{course.title}</div>
          <div style={{ width:80, height:5, background:"#f3f4f6", borderRadius:2 }}>
            <div style={{ height:"100%", width:`${progress}%`, background:PINK, borderRadius:2 }}/>
          </div>
          <span style={{ fontSize:12, fontWeight:700, color:PINK }}>{progress}%</span>
        </div>

        {/* Video area */}
        <div style={{ flex:1, overflowY:"auto", padding:"24px 36px" }}>
          {activeLesson ? (
            <>
              <div style={{ fontSize:18, fontWeight:800, color:TEXT, marginBottom:6 }}>{activeLesson.title}</div>
              <div style={{ fontSize:12, color:MUTED, marginBottom:20 }}>{course.title} · Lesson {lessons.findIndex(l=>l.id===activeLesson.id)+1} of {lessons.length}</div>

              {/* Video player */}
              <div style={{ background:"#111", borderRadius:12, overflow:"hidden", marginBottom:20, aspectRatio:"16/9" }}>
                {activeLesson.video_url ? (
                  <video
                    ref={videoRef}
                    key={activeLesson.id}
                    src={activeLesson.video_url}
                    controls
                    controlsList="nodownload"
                    style={{ width:"100%", height:"100%", objectFit:"contain" }}
                    onEnded={()=>markComplete(activeLesson)}
                  />
                ) : (
                  <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12 }}>
                    <div style={{ fontSize:48, opacity:0.2 }}>▶</div>
                    <div style={{ fontSize:13, color:"#666" }}>Video not yet uploaded</div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div style={{ display:"flex", gap:12, marginBottom:24 }}>
                {!completed.has(activeLesson.id) ? (
                  <button onClick={()=>markComplete(activeLesson)} style={{ padding:"10px 22px", background:PINK, color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                    ✓ Mark as Complete
                  </button>
                ) : (
                  <div style={{ padding:"10px 22px", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:9, fontSize:13, fontWeight:700, color:"#16a34a" }}>
                    ✓ Completed
                  </div>
                )}
                {/* Next lesson */}
                {(() => {
                  const idx = lessons.findIndex(l=>l.id===activeLesson.id);
                  const next = lessons[idx+1];
                  return next && !canAccess(next) ? null : next ? (
                    <button onClick={()=>setActiveLesson(next)} style={{ padding:"10px 22px", background:CARD, border:`1px solid ${BORDER}`, borderRadius:9, fontSize:13, color:TEXT, cursor:"pointer", fontFamily:"inherit" }}>
                      Next lesson →
                    </button>
                  ) : null;
                })()}
              </div>

              {/* Description */}
              {activeLesson.description && (
                <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, padding:20, marginBottom:20 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:TEXT, marginBottom:8 }}>Lesson Notes</div>
                  <div style={{ fontSize:13, color:MUTED, lineHeight:1.75 }}>{activeLesson.description}</div>
                </div>
              )}

              {/* My notes */}
              <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, padding:20 }}>
                <div style={{ fontSize:13, fontWeight:700, color:TEXT, marginBottom:10 }}>My Notes</div>
                <textarea
                  value={notes}
                  onChange={e=>setNotes(e.target.value)}
                  placeholder="Take notes as you watch..."
                  style={{ width:"100%", border:`1px solid ${BORDER}`, borderRadius:8, padding:"10px 12px", fontSize:13, color:TEXT, fontFamily:"inherit", resize:"vertical", minHeight:80, outline:"none", background:"#fafafa", boxSizing:"border-box" }}
                />
              </div>
            </>
          ) : (
            <div style={{ textAlign:"center", padding:"60px 0" }}>
              <div style={{ fontSize:32, marginBottom:12, opacity:0.2 }}>▶</div>
              <div style={{ fontSize:14, color:MUTED }}>Select a lesson to start watching</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
