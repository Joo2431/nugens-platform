  import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const PINK   = "#e8185d";
const TEXT   = "#111827";
const MUTED  = "#6b7280";
const CARD   = "#ffffff";
const BORDER = "#e8eaed";

const PLAN_ACCESS = {
  free:(l)=>l.is_free, hx_ind_starter:(l)=>l.is_free,
  hx_ind_premium:()=>true, hx_ind_pro:()=>true, hx_ind_yearly:()=>true,
  hx_biz_starter:(l)=>l.is_free,
  hx_biz_premium:()=>true, hx_biz_pro:()=>true, hx_biz_yearly:()=>true,
  admin:()=>true,
};

// hx-videos bucket is PUBLIC — return URL as-is.
// Ensure it uses the public object URL format (not signed).
function resolveVideoUrl(url) {
  if (!url) return Promise.resolve(null);
  // Convert any signed URL back to a public URL
  const publicUrl = url.replace(
    /\/storage\/v1\/object\/sign\/([^?]+).*/,
    "/storage/v1/object/public/$1"
  );
  return Promise.resolve(publicUrl);
}

export default function CoursePlayer({ profile }) {
  const { id } = useParams();
  const nav    = useNavigate();

  const [course,       setCourse]       = useState(null);
  const [lessons,      setLessons]      = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [videoSrc,     setVideoSrc]     = useState(null);
  const [completed,    setCompleted]    = useState(new Set());
  const [loading,      setLoading]      = useState(true);
  const [sideOpen,     setSideOpen]     = useState(true);
  const [notes,        setNotes]        = useState("");
  const [videoError,   setVideoError]   = useState(false);
  const videoRef = useRef(null);

  const plan      = profile?.plan || "free";
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

  // Resolve video URL whenever active lesson changes
  useEffect(() => {
    if (!activeLesson?.video_url) { setVideoSrc(null); return; }
    setVideoSrc(null);
    setVideoError(false);
    resolveVideoUrl(activeLesson.video_url).then(setVideoSrc);
  }, [activeLesson?.id]);

  const markComplete = async (lesson) => {
    if (completed.has(lesson.id) || !profile?.id) return;
    await supabase.from("hx_progress").upsert(
      { user_id:profile.id, lesson_id:lesson.id, course_id:id },
      { onConflict:"user_id,lesson_id" }
    );
    setCompleted(prev => new Set([...prev, lesson.id]));
  };

  const goNext = () => {
    const idx  = lessons.findIndex(l=>l.id===activeLesson?.id);
    const next = lessons[idx+1];
    if (next && canAccess(next)) { setActiveLesson(next); window.scrollTo(0,0); }
  };

  const progress = lessons.length > 0
    ? Math.round((completed.size / lessons.length) * 100) : 0;

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
      height:"100vh", background:"#fff", fontFamily:"'Plus Jakarta Sans',sans-serif", color:PINK, fontWeight:700 }}>
      Loading…
    </div>
  );
  if (!course) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh" }}>
      Course not found.
    </div>
  );

  // Group lessons by section
  const sections = [];
  let currentSection = null;
  lessons.forEach(l => {
    const sec = l.section || "";
    if (!currentSection || currentSection.name !== sec) {
      currentSection = { name: sec, lessons: [] };
      sections.push(currentSection);
    }
    currentSection.lessons.push(l);
  });

  return (
    <div style={{ display:"flex", flexDirection:"column", minHeight:"100vh",
      background:"#f8f9fb", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        .les-row { display:flex; align-items:center; gap:10px; padding:10px 14px;
          cursor:pointer; border-left:3px solid transparent; transition:all 0.14s; }
        .les-row:hover { background:${PINK}06; }
        .les-row.active { background:${PINK}08; border-left-color:${PINK}; }
        .les-row.locked { cursor:not-allowed; opacity:0.45; }
        /* Mobile: stack vertically */
        @media(max-width:768px) {
          .player-layout { flex-direction: column !important; }
          .lesson-sidebar { width:100% !important; min-width:0 !important; max-height:220px; border-right:none !important; border-bottom:1px solid ${BORDER}; }
          .lesson-sidebar.hidden { max-height:0 !important; overflow:hidden; }
          .player-main { padding: 16px !important; }
          .top-bar { flex-wrap: wrap; gap:8px !important; }
        }
      `}</style>

      {/* Top bar */}
      <div className="top-bar" style={{ background:CARD, borderBottom:`1px solid ${BORDER}`,
        padding:"11px 16px", display:"flex", alignItems:"center", gap:10, flexShrink:0, flexWrap:"wrap" }}>
        <button onClick={()=>nav("/")} style={{ background:"none", border:`1px solid ${BORDER}`,
          borderRadius:7, padding:"5px 12px", fontSize:12, color:MUTED, cursor:"pointer", fontFamily:"inherit" }}>
          ← Dashboard
        </button>
        <button onClick={()=>setSideOpen(s=>!s)} style={{ background:"none", border:`1px solid ${BORDER}`,
          borderRadius:7, padding:"5px 12px", fontSize:12, color:MUTED, cursor:"pointer", fontFamily:"inherit" }}>
          {sideOpen ? "Hide" : "Show"} Lessons
        </button>
        <div style={{ flex:1, minWidth:120 }}/>
        <div style={{ fontSize:12, fontWeight:700, color:TEXT, maxWidth:200,
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {course.title}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <div style={{ width:70, height:5, background:"#f3f4f6", borderRadius:2 }}>
            <div style={{ height:"100%", width:`${progress}%`, background:PINK, borderRadius:2 }}/>
          </div>
          <span style={{ fontSize:12, fontWeight:700, color:PINK }}>{progress}%</span>
        </div>
      </div>

      {/* Body */}
      <div className="player-layout" style={{ display:"flex", flex:1, overflow:"hidden" }}>

        {/* Sidebar */}
        <div className={`lesson-sidebar${sideOpen?"":" hidden"}`}
          style={{ width:280, minWidth:280, background:CARD, borderRight:`1px solid ${BORDER}`,
            display:"flex", flexDirection:"column", overflow:"hidden", flexShrink:0 }}>
          <div style={{ padding:"12px 14px", borderBottom:`1px solid ${BORDER}`, flexShrink:0 }}>
            <div style={{ fontSize:11, fontWeight:700, color:MUTED, textTransform:"uppercase",
              letterSpacing:"0.07em", marginBottom:4 }}>Course Content</div>
            <div style={{ fontSize:12, fontWeight:700, color:TEXT, lineHeight:1.35, marginBottom:8 }}>
              {course.title}
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
              <span style={{ fontSize:11, color:MUTED }}>{completed.size}/{lessons.length} lessons</span>
              <span style={{ fontSize:11, fontWeight:700, color:PINK }}>{progress}%</span>
            </div>
            <div style={{ height:4, background:"#f3f4f6", borderRadius:2 }}>
              <div style={{ height:"100%", width:`${progress}%`, background:PINK,
                borderRadius:2, transition:"width 0.3s" }}/>
            </div>
          </div>

          <div style={{ flex:1, overflowY:"auto" }}>
            {sections.map((sec, si) => (
              <div key={si}>
                {sec.name && (
                  <div style={{ padding:"8px 14px 4px", fontSize:10, fontWeight:800,
                    textTransform:"uppercase", letterSpacing:"0.08em", color:MUTED,
                    background:"#fafafa", borderBottom:`1px solid ${BORDER}` }}>
                    {sec.name}
                  </div>
                )}
                {sec.lessons.map((lesson, idx) => {
                  const globalIdx = lessons.findIndex(l=>l.id===lesson.id);
                  const isActive  = activeLesson?.id === lesson.id;
                  const isDone    = completed.has(lesson.id);
                  const locked    = !canAccess(lesson);
                  return (
                    <div key={lesson.id}
                      className={`les-row${isActive?" active":""}${locked?" locked":""}`}
                      onClick={()=>{ if(!locked) { setActiveLesson(lesson); } }}>
                      <div style={{ width:24, height:24, borderRadius:"50%", flexShrink:0,
                        background:isDone?"#16a34a15":isActive?`${PINK}15`:"#f3f4f6",
                        display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <span style={{ fontSize:10, fontWeight:700,
                          color:isDone?"#16a34a":isActive?PINK:MUTED }}>
                          {locked ? "🔒" : isDone ? "✓" : globalIdx+1}
                        </span>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:isActive?700:500,
                          color:isActive?PINK:TEXT, overflow:"hidden",
                          textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {lesson.title}
                        </div>
                        <div style={{ fontSize:10, color:MUTED }}>
                          {lesson.duration_mins||0} min{lesson.is_free?" · Free":""}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Main */}
        <div className="player-main" style={{ flex:1, overflowY:"auto", padding:"24px 32px" }}>
          {activeLesson ? (
            <>
              <div style={{ fontSize:18, fontWeight:800, color:TEXT, marginBottom:4 }}>
                {activeLesson.title}
              </div>
              <div style={{ fontSize:12, color:MUTED, marginBottom:18 }}>
                {course.title} · Lesson {lessons.findIndex(l=>l.id===activeLesson.id)+1} of {lessons.length}
              </div>

              {/* Video */}
              <div style={{ background:"#111", borderRadius:12, overflow:"hidden",
                marginBottom:18, aspectRatio:"16/9", position:"relative" }}>
                {videoError ? (
                  <div style={{ width:"100%", height:"100%", display:"flex",
                    alignItems:"center", justifyContent:"center", flexDirection:"column", gap:10 }}>
                    <div style={{ fontSize:32, opacity:0.3 }}>⚠</div>
                    <div style={{ fontSize:13, color:"#888", textAlign:"center", padding:"0 20px" }}>
                      Video failed to load. Try refreshing or contact support.
                    </div>
                    <button onClick={()=>{ setVideoError(false); resolveVideoUrl(activeLesson.video_url).then(setVideoSrc); }}
                      style={{ padding:"7px 16px", background:PINK, color:"#fff", border:"none",
                        borderRadius:8, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
                      Retry
                    </button>
                  </div>
                ) : videoSrc ? (
                  <video
                    ref={videoRef}
                    key={videoSrc}
                    src={videoSrc}
                    controls
                    playsInline
                    controlsList="nodownload"
                    style={{ width:"100%", height:"100%", objectFit:"contain", display:"block" }}
                    onEnded={()=>{ markComplete(activeLesson); }}
                    onError={()=>setVideoError(true)}
                  />
                ) : activeLesson.video_url ? (
                  <div style={{ width:"100%", height:"100%", display:"flex",
                    alignItems:"center", justifyContent:"center", color:"#666", fontSize:13 }}>
                    Loading video…
                  </div>
                ) : (
                  <div style={{ width:"100%", height:"100%", display:"flex",
                    alignItems:"center", justifyContent:"center", flexDirection:"column", gap:10 }}>
                    <div style={{ fontSize:40, opacity:0.2 }}>▶</div>
                    <div style={{ fontSize:13, color:"#666" }}>No video uploaded for this lesson</div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
                {!completed.has(activeLesson.id) ? (
                  <button onClick={()=>markComplete(activeLesson)}
                    style={{ padding:"10px 22px", background:PINK, color:"#fff", border:"none",
                      borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                    ✓ Mark as Complete
                  </button>
                ) : (
                  <div style={{ padding:"10px 22px", background:"#f0fdf4",
                    border:"1px solid #bbf7d0", borderRadius:9, fontSize:13, fontWeight:700, color:"#16a34a" }}>
                    ✓ Completed
                  </div>
                )}
                {(() => {
                  const idx  = lessons.findIndex(l=>l.id===activeLesson.id);
                  const next = lessons[idx+1];
                  return next && canAccess(next) ? (
                    <button onClick={goNext}
                      style={{ padding:"10px 22px", background:CARD, border:`1px solid ${BORDER}`,
                        borderRadius:9, fontSize:13, color:TEXT, cursor:"pointer", fontFamily:"inherit" }}>
                      Next →
                    </button>
                  ) : null;
                })()}
              </div>

              {/* Description */}
              {activeLesson.description && (
                <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:12,
                  padding:20, marginBottom:16 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:TEXT, marginBottom:8 }}>
                    About this lesson
                  </div>
                  <div style={{ fontSize:13, color:MUTED, lineHeight:1.75 }}>
                    {activeLesson.description}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, padding:20 }}>
                <div style={{ fontSize:13, fontWeight:700, color:TEXT, marginBottom:10 }}>My Notes</div>
                <textarea value={notes} onChange={e=>setNotes(e.target.value)}
                  placeholder="Take notes as you watch…"
                  style={{ width:"100%", border:`1px solid ${BORDER}`, borderRadius:8,
                    padding:"10px 12px", fontSize:13, color:TEXT, fontFamily:"inherit",
                    resize:"vertical", minHeight:80, outline:"none", background:"#fafafa" }}
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