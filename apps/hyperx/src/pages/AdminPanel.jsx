import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

/* ─── Constants ─────────────────────────────────────────────────────────── */
const PINK   = "#e8185d";
const TEXT   = "#111827";
const MUTED  = "#6b7280";
const LIGHT  = "#f8f9fb";
const CARD   = "#ffffff";
const BORDER = "#e8eaed";
const GREEN  = "#16a34a";
const RED    = "#dc2626";

const ALL_CATS = [
  "Communication","Career Strategy","Mindset","Interview Prep","Personal Brand",
  "Leadership","Productivity","English for Work","Soft Skills","Time Management",
  "Finance & Investing","Health & Wellness","Business Strategy","Marketing & Growth",
  "Sales","HR & People","Operations","Startup & Entrepreneurship","Management",
  "Digital Transformation","Legal Basics","Customer Success",
];
const LEVELS = ["Beginner","Intermediate","Advanced"];

const EMPTY_COURSE = {
  title:"", description:"", category:"Communication", course_type:"individual",
  level:"Beginner", is_free:false, price:0, offer_percent:0, is_published:false,
  is_exclusive:false, total_lessons:0, duration_mins:0, thumbnail_url:"",
};
const EMPTY_LESSON = {
  title:"", description:"", duration_mins:0, sort_order:0, is_free:false, video_url:"",
};

const ADMIN_EMAILS_LIST = ["jeromjoseph31@gmail.com", "jeromjoshep.23@gmail.com"];

/* ─── Fetch profile — NO DB updates (RLS blocks them) ──────────────────── */
async function fetchAdminProfile() {
  try {
    // getUser() = server-verified JWT, most reliable
    let authUser = null;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      authUser = user;
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) authUser = session.user;
    }

    if (!authUser) return { user: null, profile: null };

    // Try by ID first
    const { data: byId } = await supabase
      .from("profiles").select("*").eq("id", authUser.id).maybeSingle();
    if (byId) return { user: authUser, profile: byId };

    // Try by email — return as-is, no UPDATE (RLS would block it)
    if (authUser.email) {
      const { data: byEmail } = await supabase
        .from("profiles").select("*").eq("email", authUser.email).maybeSingle();
      if (byEmail) return { user: authUser, profile: byEmail };
    }

    // No DB row — build minimal profile from OAuth metadata
    const email = (authUser.email || "").toLowerCase().trim();
    const syntheticProfile = {
      id:        authUser.id,
      email,
      full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || email.split("@")[0] || "User",
      plan:      ADMIN_EMAILS_LIST.includes(email) ? "admin" : "free",
      user_type: "individual",
    };
    return { user: authUser, profile: syntheticProfile };
  } catch (e) {
    console.error("fetchAdminProfile:", e.message);
    return { user: null, profile: null };
  }
}

/* ─── Main Component ────────────────────────────────────────────────────── */
export default function AdminPanel({ profile: profileProp }) {
  const [authState, setAuthState] = useState({ user: null, profile: null, checked: false });

  // Independent auth check — does NOT rely on profileProp timing
  useEffect(() => {
    async function check() {
      // Quick check: if profileProp already has admin email/plan, use it
      const propEmail = (profileProp?.email || "").toLowerCase().trim();
      if (ADMIN_EMAILS.includes(propEmail) || profileProp?.plan === "admin") {
        setAuthState({ user: null, profile: profileProp, checked: true });
        return;
      }

      // Otherwise do an independent fetch (handles null profileProp)
      const { user, profile } = await fetchAdminProfile();
      setAuthState({ user, profile, checked: true });
    }
    check();
  // Re-run if profileProp arrives late
  }, [profileProp?.email, profileProp?.plan]);

  const { profile, checked } = authState;
  const email    = (profile?.email || "").toLowerCase().trim();
  const isAdmin  = ADMIN_EMAILS_LIST.includes(email) || profile?.plan === "admin";
  const authEmail = email || "(checking…)";

  /* ── STATES ── */
  const [tab,        setTab]        = useState("courses");
  const [courses,    setCourses]    = useState([]);
  const [selCourse,  setSelCourse]  = useState(null);
  const [lessons,    setLessons]    = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [uploadPct,  setUploadPct]  = useState(0);
  const [msg,        setMsg]        = useState({ text:"", type:"" });
  const [cf,         setCf]         = useState(EMPTY_COURSE);
  const [lf,         setLf]         = useState(EMPTY_LESSON);
  const [editMode,   setEditMode]   = useState(false);
  const [search,     setSearch]     = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [analytics,  setAnalytics]  = useState({});
  const thumbRef = useRef();
  const videoRef = useRef();

  const notify = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text:"", type:"" }), 4000);
  };

  useEffect(() => { if (isAdmin && checked) loadCourses(); }, [isAdmin, checked]);

  const loadCourses = async () => {
    setLoading(true);
    const { data } = await supabase.from("hx_courses").select("*").order("created_at",{ascending:false});
    setCourses(data || []);

    // Load analytics counts
    const [{ count: enrolled }, { count: progress }, { count: certs }] = await Promise.all([
      supabase.from("hx_enrollments").select("*",{count:"exact",head:true}),
      supabase.from("hx_progress").select("*",{count:"exact",head:true}),
      supabase.from("hx_certificates").select("*",{count:"exact",head:true}),
    ]);
    setAnalytics({ enrolled: enrolled||0, progress: progress||0, certs: certs||0 });
    setLoading(false);
  };

  const loadLessons = async (courseId) => {
    const { data } = await supabase
      .from("hx_lessons").select("*").eq("course_id", courseId).order("sort_order");
    setLessons(data || []);
  };

  const selectCourse = (course) => {
    setSelCourse(course);
    setCf({ ...course });
    setEditMode(true);
    setTab("courses");
    loadLessons(course.id);
  };

  const newCourse = () => {
    setSelCourse(null);
    setCf({ ...EMPTY_COURSE });
    setEditMode(false);
    setLessons([]);
  };

  // Upload file to Supabase storage
  const uploadFile = async (file, folder) => {
    const ext  = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    setUploading(true); setUploadPct(10);
    const { error } = await supabase.storage.from("hx-videos").upload(path, file, { upsert:true });
    if (error) { setUploading(false); throw new Error(error.message); }
    setUploadPct(90);
    const { data } = supabase.storage.from("hx-videos").getPublicUrl(path);
    setUploading(false); setUploadPct(100);
    return data.publicUrl;
  };

  const saveCourse = async () => {
    if (!cf.title?.trim()) return notify("Course title is required", "error");
    setLoading(true);
    const payload = { ...cf };
    delete payload.id; delete payload.created_at; delete payload.updated_at;
    payload.price        = Number(payload.price || 0);
    payload.offer_percent= Number(payload.offer_percent || 0);
    payload.total_lessons= Number(payload.total_lessons || 0);
    payload.duration_mins= Number(payload.duration_mins || 0);

    try {
      if (editMode && selCourse?.id) {
        const { error } = await supabase.from("hx_courses").update(payload).eq("id", selCourse.id);
        if (error) throw error;
        notify("Course updated ✓");
      } else {
        const { data, error } = await supabase.from("hx_courses").insert([payload]).select().single();
        if (error) throw error;
        setSelCourse(data); setCf({ ...data }); setEditMode(true);
        notify("Course created ✓");
      }
      await loadCourses();
      if (selCourse?.id) loadLessons(selCourse.id);
    } catch (e) {
      notify(e.message || "Save failed", "error");
    }
    setLoading(false);
  };

  const deleteCourse = async (id) => {
    if (!window.confirm("Delete this course and ALL its lessons?")) return;
    await supabase.from("hx_lessons").delete().eq("course_id", id);
    await supabase.from("hx_courses").delete().eq("id", id);
    notify("Course deleted");
    newCourse();
    await loadCourses();
  };

  const togglePublish = async (course) => {
    await supabase.from("hx_courses").update({ is_published: !course.is_published }).eq("id", course.id);
    await loadCourses();
    if (selCourse?.id === course.id) setCf(c => ({ ...c, is_published: !c.is_published }));
    notify(course.is_published ? "Unpublished" : "Published ✓");
  };

  const saveLesson = async () => {
    if (!lf.title?.trim()) return notify("Lesson title is required", "error");
    if (!selCourse?.id)   return notify("Save the course first", "error");
    const payload = {
      ...lf,
      course_id:     selCourse.id,
      duration_mins: Number(lf.duration_mins || 0),
      sort_order:    Number(lf.sort_order    || lessons.length),
    };
    delete payload.id; delete payload.created_at;
    const { error } = await supabase.from("hx_lessons").insert([payload]);
    if (error) return notify(error.message, "error");
    notify("Lesson added ✓");
    setLf({ ...EMPTY_LESSON });
    await loadLessons(selCourse.id);
    // Update total_lessons count
    await supabase.from("hx_courses").update({ total_lessons: lessons.length + 1 }).eq("id", selCourse.id);
    setCf(c => ({ ...c, total_lessons: lessons.length + 1 }));
  };

  const deleteLesson = async (id) => {
    await supabase.from("hx_lessons").delete().eq("id", id);
    const remaining = lessons.filter(l => l.id !== id);
    setLessons(remaining);
    if (selCourse?.id) {
      await supabase.from("hx_courses").update({ total_lessons: remaining.length }).eq("id", selCourse.id);
      setCf(c => ({ ...c, total_lessons: remaining.length }));
    }
    notify("Lesson deleted");
  };

  /* ── Styles ── */
  const S = {
    page:   { minHeight:"100vh", background:LIGHT, fontFamily:"'Plus Jakarta Sans',sans-serif", padding:"28px 32px" },
    card:   { background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:24, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" },
    input:  { width:"100%", padding:"9px 12px", border:`1px solid ${BORDER}`, borderRadius:9, fontSize:13, fontFamily:"inherit", outline:"none", background:"#fafafa", boxSizing:"border-box", color:TEXT },
    btn:    { padding:"10px 22px", background:PINK, color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" },
    btnSm:  { padding:"7px 16px", background:PINK, color:"#fff", border:"none", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" },
    btnGray:{ padding:"10px 22px", background:CARD, color:MUTED, border:`1px solid ${BORDER}`, borderRadius:9, fontSize:13, cursor:"pointer", fontFamily:"inherit" },
    tab:    (a) => ({ padding:"8px 18px", border:"none", borderRadius:9, fontSize:13, fontWeight:a?700:500, cursor:"pointer", fontFamily:"inherit", background:a?PINK:"transparent", color:a?"#fff":MUTED }),
    label:  { fontSize:11, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.07em", display:"block", marginBottom:5 },
    row2:   { display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 },
    row3:   { display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:14 },
  };

  /* ── Loading state ── */
  if (!checked) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:LIGHT, flexDirection:"column", gap:12, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <div style={{ fontSize:24, color:PINK, animation:"spin 1s linear infinite", display:"inline-block" }}>⚙</div>
      <div style={{ fontSize:13, color:MUTED }}>Checking admin access…</div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  /* ── Access Denied ── */
  if (!isAdmin) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:LIGHT, fontFamily:"'Plus Jakarta Sans',sans-serif", padding:24 }}>
      <div style={{ ...S.card, maxWidth:480, width:"100%", textAlign:"center" }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🔒</div>
        <div style={{ fontSize:20, fontWeight:800, color:TEXT, marginBottom:8 }}>Admin Access Required</div>
        <div style={{ fontSize:13, color:MUTED, marginBottom:20 }}>
          Logged in as: <strong style={{color:TEXT}}>{authEmail || "unknown"}</strong>
        </div>
        <div style={{ background:"#fef2f2", border:`1px solid ${PINK}20`, borderRadius:10, padding:"14px 18px", marginBottom:20, textAlign:"left", fontFamily:"monospace", fontSize:12, lineHeight:2 }}>
          UPDATE profiles SET plan = 'admin'<br/>
          WHERE email = '{authEmail}';
        </div>
        <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
          <button style={S.btnGray} onClick={() => window.location.reload()}>↺ Retry</button>
          <button style={S.btn} onClick={async () => { await supabase.auth.signOut(); window.location.href = "https://nugens.in.net/auth"; }}>
            Sign Out & Back In →
          </button>
        </div>
      </div>
    </div>
  );

  const filteredCourses = courses.filter(c => {
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase());
    const matchType   = typeFilter === "all" || c.course_type === typeFilter;
    return matchSearch && matchType;
  });

  /* ── Admin Panel UI ── */
  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        input:focus, select:focus, textarea:focus { border-color:${PINK}!important; outline:none; }
        .course-row { padding:10px 12px; border-radius:9px; cursor:pointer; transition:all 0.14s; border:1px solid ${BORDER}; background:#f8f9fb; margin-bottom:6px; }
        .course-row:hover { background:#fef2f2; border-color:${PINK}30; }
        .course-row.selected { background:#fef2f2; border-color:${PINK}50; }
        .lesson-row { display:flex; align-items:center; gap:10px; padding:8px 12px; background:#f8f9fb; border:1px solid ${BORDER}; border-radius:9px; margin-bottom:6px; }
      `}</style>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
        <div>
          <div style={{ fontSize:22, fontWeight:800, color:TEXT, letterSpacing:"-0.04em" }}>⚙ HyperX Admin Panel</div>
          <div style={{ fontSize:12, color:MUTED, marginTop:2 }}>Logged in as {authEmail} · Admin</div>
        </div>
        <div style={{ display:"flex", gap:6, background:CARD, border:`1px solid ${BORDER}`, borderRadius:11, padding:4 }}>
          {["courses","lessons","analytics"].map(t => (
            <button key={t} style={S.tab(tab === t)} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Notification */}
      {msg.text && (
        <div style={{ background:msg.type==="error"?"#fef2f2":"#f0fdf4", border:`1px solid ${msg.type==="error"?PINK+"30":"#86efac"}`, borderRadius:9, padding:"10px 16px", marginBottom:18, fontSize:13, color:msg.type==="error"?RED:GREEN, fontWeight:600 }}>
          {msg.text}
        </div>
      )}

      {/* ── COURSES TAB ── */}
      {tab === "courses" && (
        <div style={{ display:"grid", gridTemplateColumns:"320px 1fr", gap:22 }}>

          {/* Left: course list */}
          <div style={S.card}>
            <div style={{ display:"flex", gap:8, marginBottom:14 }}>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search courses…" style={{ ...S.input, flex:1 }} />
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                style={{ ...S.input, width:"auto", flexShrink:0 }}>
                <option value="all">All</option>
                <option value="individual">Individual</option>
                <option value="business">Business</option>
              </select>
            </div>

            <div style={{ maxHeight:480, overflowY:"auto" }}>
              {filteredCourses.length === 0 ? (
                <div style={{ fontSize:12, color:MUTED, textAlign:"center", padding:24 }}>
                  {loading ? "Loading…" : "No courses yet. Click 'New Course' to start."}
                </div>
              ) : filteredCourses.map(c => (
                <div key={c.id}
                  className={`course-row${selCourse?.id === c.id ? " selected" : ""}`}
                  onClick={() => selectCourse(c)}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ fontSize:12, fontWeight:700, color:TEXT, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {c.title}
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); togglePublish(c); }}
                      style={{ fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:4, border:"none", cursor:"pointer",
                        background: c.is_published ? "#dcfce7" : "#f1f5f9",
                        color: c.is_published ? GREEN : MUTED }}>
                      {c.is_published ? "LIVE" : "DRAFT"}
                    </button>
                  </div>
                  <div style={{ fontSize:10, color:MUTED, marginTop:3 }}>
                    {c.course_type} · {c.level} · {c.is_free ? "Free" : `₹${c.price}`} · {c.total_lessons} lessons
                  </div>
                </div>
              ))}
            </div>

            <button style={{ ...S.btn, width:"100%", marginTop:14 }} onClick={newCourse}>
              + New Course
            </button>
          </div>

          {/* Right: course form */}
          <div style={S.card}>
            <div style={{ fontSize:15, fontWeight:800, color:TEXT, marginBottom:20 }}>
              {editMode ? `Editing: ${cf.title || "Untitled"}` : "Create New Course"}
            </div>

            {/* Basic info */}
            <div style={S.row2}>
              <div>
                <label style={S.label}>Course Title *</label>
                <input style={S.input} value={cf.title || ""} placeholder="e.g. Career Growth Masterclass"
                  onChange={e => setCf(c => ({ ...c, title: e.target.value }))} />
              </div>
              <div>
                <label style={S.label}>Course Type</label>
                <select style={S.input} value={cf.course_type || "individual"}
                  onChange={e => setCf(c => ({ ...c, course_type: e.target.value }))}>
                  <option value="individual">Individual</option>
                  <option value="business">Business</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={S.label}>Description</label>
              <textarea style={{ ...S.input, minHeight:80, resize:"vertical" }}
                value={cf.description || ""} placeholder="What will students learn?"
                onChange={e => setCf(c => ({ ...c, description: e.target.value }))} />
            </div>

            <div style={S.row3}>
              <div>
                <label style={S.label}>Category</label>
                <select style={S.input} value={cf.category || "Communication"}
                  onChange={e => setCf(c => ({ ...c, category: e.target.value }))}>
                  {ALL_CATS.map(cat => <option key={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Level</label>
                <select style={S.input} value={cf.level || "Beginner"}
                  onChange={e => setCf(c => ({ ...c, level: e.target.value }))}>
                  {LEVELS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Duration (mins total)</label>
                <input type="number" style={S.input} value={cf.duration_mins || 0}
                  onChange={e => setCf(c => ({ ...c, duration_mins: e.target.value }))} />
              </div>
            </div>

            <div style={S.row3}>
              <div>
                <label style={S.label}>Price (₹)</label>
                <input type="number" style={S.input} value={cf.price || 0}
                  onChange={e => setCf(c => ({ ...c, price: e.target.value }))} />
              </div>
              <div>
                <label style={S.label}>Offer % (0 = none)</label>
                <input type="number" min="0" max="99" style={S.input} value={cf.offer_percent || 0}
                  onChange={e => setCf(c => ({ ...c, offer_percent: e.target.value }))} />
              </div>
              <div style={{ display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
                <div style={{ fontSize:13, color:TEXT, fontWeight:600 }}>
                  {cf.offer_percent > 0 && cf.price > 0
                    ? `Final: ₹${Math.round(cf.price * (1 - cf.offer_percent/100))}`
                    : cf.price > 0 ? `Final: ₹${cf.price}` : "Free"}
                </div>
              </div>
            </div>

            {/* Checkboxes */}
            <div style={{ display:"flex", gap:24, marginBottom:16, flexWrap:"wrap" }}>
              {[
                ["is_free",      "Free course (no payment needed)"],
                ["is_published", "Published (visible to users)"],
                ["is_exclusive", "Exclusive (subscribers only)"],
              ].map(([k, lbl]) => (
                <label key={k} style={{ display:"flex", alignItems:"center", gap:7, fontSize:13, color:TEXT, cursor:"pointer" }}>
                  <input type="checkbox" checked={!!cf[k]}
                    onChange={e => setCf(c => ({ ...c, [k]: e.target.checked }))} />
                  {lbl}
                </label>
              ))}
            </div>

            {/* Thumbnail */}
            <div style={{ marginBottom:16 }}>
              <label style={S.label}>Thumbnail Image</label>
              {cf.thumbnail_url && (
                <img src={cf.thumbnail_url} alt="thumbnail"
                  style={{ height:64, borderRadius:8, marginBottom:8, display:"block", objectFit:"cover" }} />
              )}
              <input type="text" style={{ ...S.input, marginBottom:8 }}
                value={cf.thumbnail_url || ""} placeholder="Paste image URL or upload below"
                onChange={e => setCf(c => ({ ...c, thumbnail_url: e.target.value }))} />
              <input type="file" accept="image/*" ref={thumbRef} style={{ display:"none" }}
                onChange={async e => {
                  if (!e.target.files[0]) return;
                  try {
                    const url = await uploadFile(e.target.files[0], "thumbnails");
                    setCf(c => ({ ...c, thumbnail_url: url }));
                    notify("Thumbnail uploaded ✓");
                  } catch (err) { notify("Upload failed: " + err.message, "error"); }
                }} />
              <button style={{ ...S.btnSm, background:CARD, color:MUTED, border:`1px solid ${BORDER}` }}
                onClick={() => thumbRef.current?.click()}>
                {uploading ? `Uploading ${uploadPct}%…` : "Upload Image"}
              </button>
            </div>

            {/* Action buttons */}
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              <button style={{ ...S.btn, opacity: loading ? 0.6 : 1 }} onClick={saveCourse} disabled={loading}>
                {loading ? "Saving…" : editMode ? "Save Changes" : "Create Course"}
              </button>
              {editMode && (
                <button style={{ ...S.btnSm, background:"#fee2e2", color:RED, border:"none" }}
                  onClick={() => deleteCourse(selCourse.id)}>
                  Delete Course
                </button>
              )}
              {editMode && (
                <button style={{ ...S.btnSm, background:cf.is_published?"#fef2f2":"#f0fdf4", color:cf.is_published?RED:GREEN, border:"none" }}
                  onClick={() => togglePublish(cf)}>
                  {cf.is_published ? "Unpublish" : "Publish"}
                </button>
              )}
              <button style={{ ...S.btnSm, background:CARD, color:MUTED, border:`1px solid ${BORDER}` }}
                onClick={newCourse}>
                Clear
              </button>
            </div>

            {/* Lessons section — only when editing */}
            {editMode && selCourse && (
              <div style={{ marginTop:28, borderTop:`1px solid ${BORDER}`, paddingTop:24 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                  <div style={{ fontSize:14, fontWeight:800, color:TEXT }}>Lessons ({lessons.length})</div>
                  <button style={{ ...S.btnSm, background:CARD, color:PINK, border:`1px solid ${PINK}30` }}
                    onClick={() => setTab("lessons")}>
                    Manage Lessons →
                  </button>
                </div>
                {lessons.slice(0, 5).map((l, i) => (
                  <div key={l.id} className="lesson-row">
                    <div style={{ width:24, height:24, background:`${PINK}15`, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:PINK, fontWeight:700, flexShrink:0 }}>
                      {i + 1}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:TEXT, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{l.title}</div>
                      <div style={{ fontSize:10, color:MUTED }}>{l.duration_mins}m · {l.is_free ? "Free preview" : "Paid"}{l.video_url ? " · ▶ Video" : ""}</div>
                    </div>
                    <button onClick={() => deleteLesson(l.id)}
                      style={{ background:"none", border:"none", cursor:"pointer", color:"#d1d5db", fontSize:16, flexShrink:0 }}>✕</button>
                  </div>
                ))}
                {lessons.length > 5 && (
                  <div style={{ fontSize:12, color:MUTED, textAlign:"center", padding:"8px 0" }}>
                    +{lessons.length - 5} more — click "Manage Lessons"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── LESSONS TAB ── */}
      {tab === "lessons" && (
        <div style={{ display:"grid", gridTemplateColumns:"280px 1fr", gap:22 }}>
          {/* Left: course picker */}
          <div style={S.card}>
            <div style={{ fontSize:13, fontWeight:700, color:TEXT, marginBottom:14 }}>Select Course</div>
            <div style={{ maxHeight:520, overflowY:"auto" }}>
              {courses.map(c => (
                <div key={c.id}
                  className={`course-row${selCourse?.id === c.id ? " selected" : ""}`}
                  onClick={() => selectCourse(c)}>
                  <div style={{ fontSize:12, fontWeight:600, color:TEXT }}>{c.title}</div>
                  <div style={{ fontSize:10, color:MUTED }}>{c.total_lessons} lessons · {c.course_type}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: lesson manager */}
          <div style={S.card}>
            {!selCourse ? (
              <div style={{ textAlign:"center", padding:48, color:MUTED, fontSize:13 }}>
                ← Select a course to manage its lessons
              </div>
            ) : (
              <>
                <div style={{ fontSize:15, fontWeight:800, color:TEXT, marginBottom:4 }}>
                  {selCourse.title}
                </div>
                <div style={{ fontSize:12, color:MUTED, marginBottom:20 }}>
                  {lessons.length} lessons · {selCourse.course_type} · {selCourse.level}
                </div>

                {/* Existing lessons */}
                {lessons.map((l, i) => (
                  <div key={l.id} className="lesson-row">
                    <div style={{ width:28, height:28, background:`${PINK}12`, borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:PINK, fontWeight:800, flexShrink:0 }}>
                      {i + 1}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:TEXT }}>{l.title}</div>
                      <div style={{ fontSize:11, color:MUTED }}>
                        {l.duration_mins}m · {l.is_free ? "Free preview" : "Paid"}
                        {l.video_url ? (
                          <a href={l.video_url} target="_blank" rel="noreferrer"
                            style={{ color:PINK, textDecoration:"none", marginLeft:8 }}>▶ Watch</a>
                        ) : " · No video yet"}
                      </div>
                    </div>
                    <button onClick={() => deleteLesson(l.id)}
                      style={{ background:"#fee2e2", border:"none", borderRadius:7, cursor:"pointer", color:RED, fontSize:12, padding:"4px 10px" }}>
                      Delete
                    </button>
                  </div>
                ))}

                {/* Add lesson form */}
                <div style={{ background:"#fafafa", border:`1px dashed ${BORDER}`, borderRadius:12, padding:20, marginTop:16 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:TEXT, marginBottom:16 }}>Add New Lesson</div>

                  <div style={S.row2}>
                    <div>
                      <label style={S.label}>Lesson Title *</label>
                      <input style={S.input} value={lf.title || ""} placeholder="e.g. Introduction to the course"
                        onChange={e => setLf(l => ({ ...l, title: e.target.value }))} />
                    </div>
                    <div>
                      <label style={S.label}>Duration (minutes)</label>
                      <input type="number" style={S.input} value={lf.duration_mins || ""}
                        onChange={e => setLf(l => ({ ...l, duration_mins: e.target.value }))} />
                    </div>
                  </div>

                  <div style={{ marginBottom:14 }}>
                    <label style={S.label}>Description (optional)</label>
                    <textarea style={{ ...S.input, minHeight:60, resize:"vertical" }}
                      value={lf.description || ""} placeholder="What does this lesson cover?"
                      onChange={e => setLf(l => ({ ...l, description: e.target.value }))} />
                  </div>

                  <div style={{ marginBottom:14 }}>
                    <label style={S.label}>Video URL</label>
                    <input style={S.input} value={lf.video_url || ""} placeholder="https://… or upload below"
                      onChange={e => setLf(l => ({ ...l, video_url: e.target.value }))} />
                  </div>

                  <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
                    <input type="file" accept="video/*" ref={videoRef} style={{ display:"none" }}
                      onChange={async e => {
                        if (!e.target.files[0]) return;
                        try {
                          const url = await uploadFile(e.target.files[0], "videos");
                          setLf(l => ({ ...l, video_url: url }));
                          notify("Video uploaded ✓");
                        } catch (err) { notify("Video upload failed: " + err.message, "error"); }
                      }} />
                    <button style={{ ...S.btnSm, background:CARD, color:MUTED, border:`1px solid ${BORDER}` }}
                      onClick={() => videoRef.current?.click()}>
                      {uploading ? `Uploading ${uploadPct}%…` : "Upload Video"}
                    </button>
                    <label style={{ display:"flex", alignItems:"center", gap:7, fontSize:13, color:TEXT, cursor:"pointer" }}>
                      <input type="checkbox" checked={!!lf.is_free}
                        onChange={e => setLf(l => ({ ...l, is_free: e.target.checked }))} />
                      Free preview
                    </label>
                    <input type="number" style={{ ...S.input, width:100 }} value={lf.sort_order || ""}
                      placeholder="Order" onChange={e => setLf(l => ({ ...l, sort_order: e.target.value }))} />
                    <button style={{ ...S.btn, marginLeft:"auto" }} onClick={saveLesson}>
                      Add Lesson
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── ANALYTICS TAB ── */}
      {tab === "analytics" && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
            {[
              { label:"Total Courses",      val: courses.length,                                color:PINK      },
              { label:"Published",          val: courses.filter(c=>c.is_published).length,       color:GREEN     },
              { label:"Total Enrollments",  val: analytics.enrolled || 0,                        color:"#0284c7" },
              { label:"Certificates Issued",val: analytics.certs    || 0,                        color:"#d97706" },
              { label:"Individual Courses", val: courses.filter(c=>c.course_type==="individual").length, color:"#7c3aed" },
              { label:"Business Courses",   val: courses.filter(c=>c.course_type==="business").length,   color:"#0284c7" },
              { label:"Free Courses",       val: courses.filter(c=>c.is_free).length,            color:GREEN     },
              { label:"Exclusive",          val: courses.filter(c=>c.is_exclusive).length,       color:PINK      },
            ].map(s => (
              <div key={s.label} style={{ ...S.card, padding:"18px 20px" }}>
                <div style={{ fontSize:26, fontWeight:800, color:s.color, letterSpacing:"-0.04em" }}>{s.val}</div>
                <div style={{ fontSize:12, color:MUTED, marginTop:6 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Course table */}
          <div style={S.card}>
            <div style={{ fontSize:14, fontWeight:700, color:TEXT, marginBottom:16 }}>All Courses</div>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead>
                <tr style={{ background:"#f8f9fb", borderBottom:`2px solid ${BORDER}` }}>
                  {["Title","Type","Level","Price","Lessons","Status"].map(h => (
                    <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontWeight:700, color:MUTED, fontSize:11, textTransform:"uppercase", letterSpacing:"0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {courses.map(c => (
                  <tr key={c.id} style={{ borderBottom:`1px solid ${BORDER}`, cursor:"pointer" }}
                    onClick={() => { selectCourse(c); setTab("courses"); }}
                    onMouseEnter={e => e.currentTarget.style.background="#fef2f2"}
                    onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                    <td style={{ padding:"10px 12px", fontWeight:600, color:TEXT }}>{c.title}</td>
                    <td style={{ padding:"10px 12px", color:MUTED, textTransform:"capitalize" }}>{c.course_type}</td>
                    <td style={{ padding:"10px 12px", color:MUTED }}>{c.level}</td>
                    <td style={{ padding:"10px 12px", color:c.is_free?GREEN:TEXT }}>{c.is_free?"Free":`₹${c.price}${c.offer_percent>0?` (-${c.offer_percent}%)`:"" }`}</td>
                    <td style={{ padding:"10px 12px", color:MUTED }}>{c.total_lessons}</td>
                    <td style={{ padding:"10px 12px" }}>
                      <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:4,
                        background:c.is_published?"#dcfce7":"#f1f5f9",
                        color:c.is_published?GREEN:MUTED }}>
                        {c.is_published ? "LIVE" : "DRAFT"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}