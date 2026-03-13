import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";

const PURPLE = "#7c3aed";
const PINK   = "#e8185d";
const B      = "#1e1e2e";

const COURSE_DATA = {
  "wc-001": {
    title: "Workplace Communication Mastery",
    tag: "Communication", color: PINK,
    description: "Master professional communication across email, meetings, presentations, and difficult conversations. Built for real workplace scenarios.",
    lessons: [
      { id: 1, title: "Why communication makes or breaks careers",     duration: "18 min", free: true,  done: true  },
      { id: 2, title: "The 3 communication modes every pro must master",duration: "22 min", free: true,  done: true  },
      { id: 3, title: "Writing emails that get read and actioned",      duration: "25 min", free: true,  done: false },
      { id: 4, title: "Meeting participation — speak up, get noticed",  duration: "20 min", free: false, done: false },
      { id: 5, title: "Stakeholder communication frameworks",           duration: "28 min", free: false, done: false },
      { id: 6, title: "Handling feedback without getting defensive",     duration: "18 min", free: false, done: false },
      { id: 7, title: "Dealing with difficult colleagues",              duration: "24 min", free: false, done: false },
      { id: 8, title: "Presenting to leadership",                       duration: "30 min", free: false, done: false },
      { id: 9, title: "Negotiating deadlines and scope",                duration: "20 min", free: false, done: false },
      { id: 10, title: "Remote communication best practices",           duration: "22 min", free: false, done: false },
      { id: 11, title: "Building rapport across teams",                 duration: "18 min", free: false, done: false },
      { id: 12, title: "Your communication style — final assessment",   duration: "15 min", free: false, done: false },
    ]
  },
};

export default function CoursePlayer({ profile }) {
  const { id } = useParams();
  const course = COURSE_DATA[id] || COURSE_DATA["wc-001"];
  const plan = profile?.plan || "free";
  const [activeLesson, setActiveLesson] = useState(course.lessons[0]);

  const canAccess = (lesson) => lesson.free || plan !== "free";
  const doneCount = course.lessons.filter(l => l.done).length;
  const progress = Math.round((doneCount / course.lessons.length) * 100);

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#080814", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .lesson-row { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 8px; cursor: pointer; transition: background 0.13s; }
        .lesson-row:hover { background: #1a1a2a; }
        .lesson-row.active { background: ${PURPLE}20; border: 1px solid ${PURPLE}30; }
        .lesson-row.active .lesson-num { color: ${PURPLE}; }
      `}</style>

      {/* Top bar */}
      <div style={{ background: "#0d0d1a", borderBottom: `1px solid ${B}`, padding: "12px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <Link to="/courses" style={{ color: "#555", textDecoration: "none", fontSize: 13 }}>← Back</Link>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{course.title}</div>
          <div style={{ fontSize: 11.5, color: "#555", marginTop: 2 }}>{doneCount}/{course.lessons.length} lessons complete</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 100, height: 4, background: "#1a1a2a", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ width: `${progress}%`, height: "100%", background: course.color, borderRadius: 99 }} />
          </div>
          <span style={{ fontSize: 11.5, color: "#555" }}>{progress}%</span>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1 }}>
        {/* Video area */}
        <div style={{ flex: 1, padding: "28px 32px" }}>
          {canAccess(activeLesson) ? (
            <>
              {/* Video placeholder */}
              <div style={{
                width: "100%", aspectRatio: "16/9", background: "#0d0d1a",
                border: `1px solid ${B}`, borderRadius: 14,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                marginBottom: 24, position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 50%, ${course.color}08, transparent 70%)` }} />
                <div style={{ width: 60, height: 60, borderRadius: "50%", background: course.color + "20", border: `2px solid ${course.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, cursor: "pointer", zIndex: 1 }}>▶</div>
                <div style={{ fontSize: 13, color: "#444", marginTop: 12, zIndex: 1 }}>Lesson {activeLesson.id} · {activeLesson.duration}</div>
              </div>

              <h2 style={{ fontSize: "clamp(16px,2vw,20px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.025em", marginBottom: 12 }}>{activeLesson.title}</h2>
              <p style={{ fontSize: 14, color: "#555", lineHeight: 1.7, maxWidth: 600, marginBottom: 24 }}>
                This lesson covers practical, real-world techniques you can apply immediately at work. Take notes, pause, and replay any section as needed.
              </p>

              {/* Notes area */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#444", marginBottom: 10 }}>Your Notes</div>
                <textarea placeholder="Write your notes here…" style={{
                  width: "100%", minHeight: 120, background: "#0d0d1a", border: `1px solid ${B}`,
                  borderRadius: 10, padding: "12px 14px", color: "#ccc", fontSize: 13.5,
                  fontFamily: "'Plus Jakarta Sans', sans-serif", resize: "vertical",
                }} onFocus={e => e.target.style.borderColor = PURPLE} onBlur={e => e.target.style.borderColor = B} />
              </div>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Premium lesson</div>
              <div style={{ fontSize: 14, color: "#555", marginBottom: 24, maxWidth: 320 }}>Upgrade to access all {course.lessons.length} lessons in this course and the full HyperX library.</div>
              <Link to="/pricing" style={{ padding: "11px 28px", background: PURPLE, color: "#fff", borderRadius: 9, fontWeight: 700, textDecoration: "none", fontSize: 14 }}>Upgrade to Premium →</Link>
            </div>
          )}
        </div>

        {/* Lesson sidebar */}
        <div style={{ width: 300, background: "#0d0d1a", borderLeft: `1px solid ${B}`, padding: "20px 16px", overflowY: "auto", flexShrink: 0 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#444", marginBottom: 14 }}>
            {course.lessons.length} Lessons
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {course.lessons.map(lesson => (
              <div key={lesson.id}
                className={`lesson-row ${activeLesson.id === lesson.id ? "active" : ""}`}
                onClick={() => canAccess(lesson) && setActiveLesson(lesson)}
                style={{ opacity: canAccess(lesson) ? 1 : 0.45 }}
              >
                <div className="lesson-num" style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: lesson.done ? "#16a34a" : "#444", background: lesson.done ? "#16a34a18" : "#1a1a2a" }}>
                  {lesson.done ? "✓" : lesson.id}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: "#ccc", lineHeight: 1.35, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{lesson.title}</div>
                  <div style={{ fontSize: 11, color: "#444", marginTop: 2 }}>{lesson.duration}</div>
                </div>
                {!canAccess(lesson) && <span style={{ fontSize: 10, color: "#333" }}>🔒</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
