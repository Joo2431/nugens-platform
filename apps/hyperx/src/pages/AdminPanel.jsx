import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

const PINK   = "#e8185d";
const TEXT   = "#111827";
const MUTED  = "#6b7280";
const LIGHT  = "#f8f9fb";
const CARD   = "#ffffff";
const BORDER = "#e8eaed";
const GREEN  = "#16a34a";

const IND_CATS = ["Communication","Career Strategy","Mindset","Interview Prep","Personal Brand","Leadership","Productivity","English for Work","Soft Skills","Time Management","Finance & Investing","Health & Wellness"];
const BIZ_CATS = ["Business Strategy","Marketing & Growth","Sales","HR & People","Finance","Operations","Startup & Entrepreneurship","Management","B2B Skills","Digital Transformation","Legal Basics","Customer Success"];
const LEVELS   = ["Beginner","Intermediate","Advanced"];
const EMPTY_COURSE = { title:"", description:"", category:"Communication", course_type:"individual", level:"Beginner", is_free:false, price:0, offer_percent:0, is_published:false, is_exclusive:false, total_lessons:0, duration_mins:0, thumbnail_url:"" };
const EMPTY_LESSON = { title:"", description:"", duration_mins:0, sort_order:0, is_free:false, video_url:"" };

export default function AdminPanel({ profile: profileProp }) {
  // ── ADMIN CHECK ────────────────────────────────────────────────────────────
  // Uses the profile prop that App.jsx now guarantees is loaded before render.
  // Falls back to a direct Supabase query if the prop is still somehow null.
  const [adminStatus, setAdminStatus] = useState("loading");
  const [authEmail,   setAuthEmail]   = useState("");
  const [debugPlan,   setDebugPlan]   = useState("");
  const [retryCount,  setRetryCount]  = useState(0);

  useEffect(() => {
    async function check() {
      // Fast path: profile prop already has the plan (App.jsx waits for it)
      if (profileProp?.plan) {
        setAuthEmail(profileProp.email || "");
        setDebugPlan(profileProp.plan);
        setAdminStatus(profileProp.plan === "admin" ? "allowed" : "denied");
        return;
      }

      // Slow path: query directly (edge case where prop is still null)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setAdminStatus("denied");
        setAuthEmail("No active session — please sign in");
        return;
      }

      const email = session.user.email || "";
      setAuthEmail(email);

      const { data, error } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", session.user.id)
        .single();

      if (error || !data) {
        // Profile row missing — create it
        await supabase.from("profiles").upsert(
          { id: session.user.id, email, plan: "free" },
          { onConflict: "id" }
        );
        setDebugPlan("NO ROW — blank row created, run SQL to set plan=admin");
        setAdminStatus("denied");
        return;
      }

      setDebugPlan(data.plan || "null");
      setAdminStatus(data.plan === "admin" ? "allowed" : "denied");
    }

    check();
  }, [profileProp, retryCount]);

  // ── COMPONENT STATE ────────────────────────────────────────────────────────
  const [tab,       setTab]       = useState("courses");
  const [courses,   setCourses]   = useState([]);
  const [selCourse, setSelCourse] = useState(null);
  const [lessons,   setLessons]   = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [msg,       setMsg]       = useState({ text:"", type:"" });
  const [cf,        setCf]        = useState(EMPTY_COURSE);
  const [lf,        setLf]        = useState(EMPTY_LESSON);
  const [editMode,  setEditMode]  = useState(false);
  const [search,    setSearch]    = useState("");
  const [typeFilter,setTypeFilter]= useState("all");
  const thumbRef = useRef();
  const videoRef = useRef();

  const notify = (text, type="success") => { setMsg({text,type}); setTimeout(()=>setMsg({text:"",type:""}),4000); };
  const isAdmin   = adminStatus === "allowed";
  const isLoading = adminStatus === "loading";

  // ── LOADING SCREEN ─────────────────────────────────────────────────────────
  if (isLoading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:LIGHT, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:28, color:PINK, marginBottom:12 }}>⚙</div>
        <div style={{ fontSize:14, color:MUTED }}>Checking admin access...</div>
      </div>
    </div>
  );

  // ── ACCESS DENIED SCREEN ───────────────────────────────────────────────────
  if (!isAdmin) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:LIGHT, fontFamily:"'Plus Jakarta Sans',sans-serif", padding:24 }}>
      <div style={{ textAlign:"center", maxWidth:560 }}>
        <div style={{ fontSize:40, marginBottom:16 }}>🔒</div>
        <div style={{ fontSize:20, fontWeight:800, color:TEXT, marginBottom:20 }}>Admin Access Required</div>

        <div style={{ background:"#f8f9fb", border:"1px solid #e8eaed", borderRadius:10, padding:"14px 18px", marginBottom:20, textAlign:"left" }}>
          <div style={{ fontSize:11, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8 }}>Debug Info</div>
          <div style={{ fontSize:12, color:TEXT, fontFamily:"monospace", lineHeight:2 }}>
            email: <strong style={{color: authEmail ? TEXT : "#dc2626"}}>{authEmail || "not loaded"}</strong><br/>
            plan in DB: <strong style={{color: debugPlan === "admin" ? GREEN : "#dc2626"}}>{debugPlan || "not fetched"}</strong><br/>
            need: <strong style={{color:GREEN}}>admin</strong>
          </div>
        </div>

        <div style={{ fontSize:13, color:MUTED, lineHeight:1.75, marginBottom:14 }}>
          Run this SQL in <strong>Supabase → SQL Editor</strong>, then click Retry:
        </div>
        <div style={{ background:"#f3f4f6", border:"1px solid #e8eaed", borderRadius:8, padding:"14px 18px", fontFamily:"monospace", fontSize:12, color:TEXT, textAlign:"left", lineHeight:2, marginBottom:20 }}>
          UPDATE profiles<br/>
          SET plan = 'admin'<br/>
          WHERE email = '{authEmail || "your@email.com"}';
        </div>

        <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
          <button
            onClick={() => { setAdminStatus("loading"); setDebugPlan(""); setAuthEmail(""); setRetryCount(c=>c+1); }}
            style={{ padding:"11px 24px", background:CARD, color:TEXT, border:"1px solid #e8eaed", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}
          >
            ↻ Retry
          </button>
          <button
            onClick={async () => { await supabase.auth.signOut(); window.location.href = `https://nugens.in.net/auth?redirect=${encodeURIComponent(window.location.href)}`; }}
            style={{ padding:"11px 24px", background:PINK, color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}
          >
            Sign Out & Sign Back In →
          </button>
        </div>
      </div>
    </div>
  );

  // ── HELPER FUNCTIONS ───────────────────────────────────────────────────────
  const loadCourses = async () => {
    const { data } = await supabase.from("hx_courses").select("*").order("created_at",{ascending:false});
    setCourses(data||[]);
  };

  useEffect(() => { if (isAdmin) loadCourses(); }, [isAdmin]);

  const loadLessons = async (courseId) => {
    const { data } = await supabase.from("hx_lessons").select("*").eq("course_id",courseId).order("sort_order");
    setLessons(data||[]);
  };

  const selectCourse = (course) => {
    setSelCourse(course); setCf(course); setEditMode(false);
    setLf(EMPTY_LESSON); loadLessons(course.id); setTab("lessons");
  };

  const uploadFile = async (file, bucket, folder) => {
    const ext  = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    setUploading(true); setUploadPct(0);
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert:true });
    if (error) { setUploading(false); throw error; }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    setUploading(false); setUploadPct(100);
    return data.publicUrl;
  };

  const saveCourse = async () => {
    if (!cf.title.trim()) return notify("Title required","error");
    setLoading(true);
    const payload = { ...cf, total_lessons:Number(cf.total_lessons||0), duration_mins:Number(cf.duration_mins||0), price:Number(cf.price||0), offer_percent:Number(cf.offer_percent||0) };
    if (selCourse && editMode) {
      const { error } = await supabase.from("hx_courses").update(payload).eq("id",selCourse.id);
      error ? notify(error.message,"error") : (notify("Course updated ✓"), await loadCourses());
    } else {
      const { data, error } = await supabase.from("hx_courses").insert([payload]).select().single();
      if (error) notify(error.message,"error");
      else { notify("Course created ✓"); setSelCourse(data); setCf(data); setEditMode(false); await loadCourses(); loadLessons(data.id); setTab("lessons"); }
    }
    setLoading(false);
  };

  const deleteCourse = async (id) => {
    if (!window.confirm("Delete this course and all its lessons?")) return;
    await supabase.from("hx_courses").delete().eq("id",id);
    notify("Deleted"); await loadCourses();
    if (selCourse?.id===id) { setSelCourse(null); setLessons([]); setTab("courses"); }
  };

  const saveLesson = async () => {
    if (!lf.title.trim() || !selCourse) return notify("Lesson title required","error");
    setLoading(true);
    const payload = { ...lf, course_id:selCourse.id, duration_mins:Number(lf.duration_mins||0), sort_order:Number(lf.sort_order||0) };
    if (lf.id) {
      const { error } = await supabase.from("hx_lessons").update(payload).eq("id",lf.id);
      error ? notify(error.message,"error") : (notify("Lesson saved ✓"), await loadLessons(selCourse.id), setLf(EMPTY_LESSON));
    } else {
      const { error } = await supabase.from("hx_lessons").insert([payload]);
      if (error) notify(error.message,"error");
      else {
        await supabase.from("hx_courses").update({ total_lessons:(selCourse.total_lessons||0)+1 }).eq("id",selCourse.id);
        notify("Lesson added ✓"); await loadLessons(selCourse.id); await loadCourses(); setLf(EMPTY_LESSON);
      }
    }
    setLoading(false);
  };

  const deleteLesson = async (id) => {
    await supabase.from("hx_lessons").delete().eq("id",id);
    await supabase.from("hx_courses").update({ total_lessons:Math.max(0,(selCourse.total_lessons||1)-1) }).eq("id",selCourse.id);
    await loadLessons(selCourse.id); await loadCourses(); notify("Lesson deleted");
  };

  const togglePublish = async (course) => {
    await supabase.from("hx_courses").update({ is_published:!course.is_published }).eq("id",course.id);
    await loadCourses(); notify(course.is_published?"Unpublished":"Published ✓");
  };

  const handleThumb = async (e) => {
    const file = e.target.files?.[0]; if(!file) return;
    try { const url = await uploadFile(file,"hx-videos","thumbnails"); setCf(c=>({...c,thumbnail_url:url})); notify("Thumbnail uploaded ✓"); } catch(err){ notify(err.message,"error"); }
  };

  const handleVideo = async (e) => {
    const file = e.target.files?.[0]; if(!file) return;
    try { const url = await uploadFile(file,"hx-videos","lessons"); setLf(l=>({...l,video_url:url})); notify("Video uploaded ✓"); } catch(err){ notify(err.message,"error"); }
  };

  const filtered = courses.filter(c => {
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase());
    const matchType   = typeFilter==="all" || c.course_type===typeFilter;
    return matchSearch && matchType;
  });

  const courseCats = cf.course_type === "business" ? BIZ_CATS : IND_CATS;

  // ── STYLES ─────────────────────────────────────────────────────────────────
  const S = {
    page:  { minHeight:"100vh", background:LIGHT, fontFamily:"'Plus Jakarta Sans',sans-serif", display:"flex" },
    aside: { width:310, minHeight:"100vh", background:CARD, borderRight:`1px solid ${BORDER}`, display:"flex", flexDirection:"column", flexShrink:0 },
    main:  { flex:1, padding:"28px 36px", overflowY:"auto" },
    card:  { background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, padding:20, marginBottom:16, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" },
    label: { fontSize:11, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6, display:"block" },
    inp:   { width:"100%", border:`1px solid ${BORDER}`, borderRadius:8, padding:"9px 12px", fontSize:13, color:TEXT, fontFamily:"inherit", outline:"none", background:"#fafafa", boxSizing:"border-box", marginBottom:14 },
    sel:   { width:"100%", border:`1px solid ${BORDER}`, borderRadius:8, padding:"9px 12px", fontSize:13, color:TEXT, fontFamily:"inherit", outline:"none", background:"#fafafa", boxSizing:"border-box", marginBottom:14 },
    ta:    { width:"100%", border:`1px solid ${BORDER}`, borderRadius:8, padding:"9px 12px", fontSize:13, color:TEXT, fontFamily:"inherit", outline:"none", resize:"vertical", minHeight:72, background:"#fafafa", boxSizing:"border-box", marginBottom:14 },
    btn:   { padding:"10px 22px", background:PINK, color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" },
    ghost: { padding:"9px 18px", background:"#fff", color:MUTED, border:`1px solid ${BORDER}`, borderRadius:9, fontSize:12, cursor:"pointer", fontFamily:"inherit" },
    toggle:(on)=>({ width:40, height:22, borderRadius:11, background:on?PINK:"#d1d5db", position:"relative", cursor:"pointer", border:"none", flexShrink:0, outline:"none" }),
    uploadBtn: { padding:"8px 16px", background:"#f3f4f6", border:`1px solid ${BORDER}`, borderRadius:8, fontSize:12, color:TEXT, cursor:"pointer", fontFamily:"inherit" },
  };

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      {/* LEFT: course list */}
      <div style={S.aside}>
        <div style={{ padding:"20px 16px 14px", borderBottom:`1px solid ${BORDER}` }}>
          <div style={{ fontSize:16, fontWeight:800, color:TEXT, marginBottom:12 }}>⚙ Admin Panel</div>
          <div style={{ display:"flex", gap:6, marginBottom:10 }}>
            {[["all","All"],["individual","Individual"],["business","Business"]].map(([v,l])=>(
              <button key={v} onClick={()=>setTypeFilter(v)} style={{ flex:1, padding:"5px 0", background:typeFilter===v?PINK:"#f3f4f6", color:typeFilter===v?"#fff":MUTED, border:"none", borderRadius:6, fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{l}</button>
            ))}
          </div>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search courses..." style={{ ...S.inp, marginBottom:0, fontSize:12 }} />
        </div>

        <div style={{ padding:"10px 12px", borderBottom:`1px solid ${BORDER}` }}>
          <button onClick={()=>{ setSelCourse(null); setCf(EMPTY_COURSE); setLessons([]); setEditMode(false); setTab("courses"); }} style={{ ...S.btn, width:"100%", fontSize:12 }}>+ New Course</button>
        </div>

        <div style={{ flex:1, overflowY:"auto" }}>
          {filtered.map(c=>(
            <div key={c.id} onClick={()=>selectCourse(c)} style={{ padding:"12px 14px", borderBottom:`1px solid ${BORDER}`, cursor:"pointer", background:selCourse?.id===c.id?`${PINK}08`:"transparent", borderLeft:selCourse?.id===c.id?`3px solid ${PINK}`:"3px solid transparent" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:TEXT, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.title}</div>
                  <div style={{ display:"flex", gap:5, marginTop:3, flexWrap:"wrap" }}>
                    <span style={{ fontSize:9, fontWeight:700, color:c.course_type==="business"?"#0284c7":PINK, background:c.course_type==="business"?"#eff6ff":"#fef2f2", borderRadius:3, padding:"1px 5px" }}>{c.course_type}</span>
                    <span style={{ fontSize:9, color:MUTED }}>{c.category}</span>
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:3, alignItems:"flex-end", flexShrink:0, marginLeft:8 }}>
                  <span style={{ fontSize:9, fontWeight:700, color:c.is_published?GREEN:MUTED }}>{c.is_published?"LIVE":"DRAFT"}</span>
                  <span style={{ fontSize:9, color:MUTED }}>{c.total_lessons} lessons</span>
                </div>
              </div>
            </div>
          ))}
          {filtered.length===0 && <div style={{ padding:24, textAlign:"center", fontSize:12, color:MUTED }}>No courses yet. Click + New Course.</div>}
        </div>

        <div style={{ padding:"12px 14px", borderTop:`1px solid ${BORDER}`, background:"#f8f9fb" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, textAlign:"center" }}>
            <div><div style={{ fontSize:16, fontWeight:800, color:TEXT }}>{courses.length}</div><div style={{ fontSize:9, color:MUTED }}>Total</div></div>
            <div><div style={{ fontSize:16, fontWeight:800, color:GREEN }}>{courses.filter(c=>c.is_published).length}</div><div style={{ fontSize:9, color:MUTED }}>Live</div></div>
            <div><div style={{ fontSize:16, fontWeight:800, color:PINK }}>{courses.filter(c=>c.course_type==="business").length}</div><div style={{ fontSize:9, color:MUTED }}>Biz</div></div>
          </div>
        </div>
      </div>

      {/* MAIN PANEL */}
      <div style={S.main}>
        {msg.text && (
          <div style={{ position:"fixed", top:20, right:24, background:msg.type==="error"?"#fef2f2":CARD, border:`1px solid ${msg.type==="error"?"#fca5a5":BORDER}`, borderRadius:9, padding:"12px 18px", fontSize:13, fontWeight:600, color:msg.type==="error"?"#dc2626":GREEN, boxShadow:"0 4px 16px rgba(0,0,0,0.1)", zIndex:1000 }}>
            {msg.text}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display:"flex", gap:6, marginBottom:24 }}>
          {[["courses","📋 Course Info"],["lessons","📹 Lessons"],["offers","🏷 Pricing & Offers"],["analytics","📊 Analytics"]].map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} style={{ padding:"8px 18px", background:tab===t?PINK:"#fff", color:tab===t?"#fff":MUTED, border:`1px solid ${tab===t?PINK:BORDER}`, borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{l}</button>
          ))}
        </div>

        {/* ── COURSE INFO ── */}
        {tab==="courses" && (
          <div style={{ maxWidth:680 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div style={{ fontSize:18, fontWeight:800, color:TEXT }}>{selCourse && !editMode ? selCourse.title : selCourse ? "Edit Course" : "New Course"}</div>
              {selCourse && !editMode && (
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={()=>setEditMode(true)} style={S.ghost}>Edit</button>
                  <button onClick={()=>togglePublish(selCourse)} style={{ ...S.ghost, color:selCourse.is_published?"#dc2626":GREEN }}>{selCourse.is_published?"Unpublish":"Publish"}</button>
                  <button onClick={()=>deleteCourse(selCourse.id)} style={{ ...S.ghost, color:"#dc2626" }}>Delete</button>
                </div>
              )}
            </div>

            {(!selCourse || editMode) && (
              <div style={S.card}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                  <div>
                    <label style={S.label}>Course Type *</label>
                    <select value={cf.course_type} onChange={e=>setCf(c=>({...c,course_type:e.target.value,category:e.target.value==="business"?BIZ_CATS[0]:IND_CATS[0]}))} style={S.sel}>
                      <option value="individual">Individual</option>
                      <option value="business">Business</option>
                    </select>
                  </div>
                  <div>
                    <label style={S.label}>Category *</label>
                    <select value={cf.category} onChange={e=>setCf(c=>({...c,category:e.target.value}))} style={S.sel}>
                      {courseCats.map(c=><option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <label style={S.label}>Course Title *</label>
                <input value={cf.title} onChange={e=>setCf(c=>({...c,title:e.target.value}))} placeholder="e.g. Communication Mastery for Professionals" style={S.inp} />
                <label style={S.label}>Description</label>
                <textarea value={cf.description||""} onChange={e=>setCf(c=>({...c,description:e.target.value}))} placeholder="What will students learn?" style={S.ta}/>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
                  <div><label style={S.label}>Level</label><select value={cf.level} onChange={e=>setCf(c=>({...c,level:e.target.value}))} style={S.sel}>{LEVELS.map(l=><option key={l}>{l}</option>)}</select></div>
                  <div><label style={S.label}>Total Lessons</label><input type="number" value={cf.total_lessons||0} onChange={e=>setCf(c=>({...c,total_lessons:e.target.value}))} style={S.inp}/></div>
                  <div><label style={S.label}>Duration (mins)</label><input type="number" value={cf.duration_mins||0} onChange={e=>setCf(c=>({...c,duration_mins:e.target.value}))} style={S.inp}/></div>
                </div>
                <label style={S.label}>Thumbnail</label>
                <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:14 }}>
                  {cf.thumbnail_url && <img src={cf.thumbnail_url} style={{ width:80, height:52, borderRadius:6, objectFit:"cover", border:`1px solid ${BORDER}` }} alt="thumb"/>}
                  <button onClick={()=>thumbRef.current.click()} style={S.uploadBtn}>{uploading?"Uploading...":"Upload Thumbnail"}</button>
                  <input ref={thumbRef} type="file" accept="image/*" onChange={handleThumb} style={{ display:"none" }}/>
                </div>
                <div style={{ display:"flex", gap:20, flexWrap:"wrap", marginBottom:14 }}>
                  {[["is_free","Free Course"],["is_published","Published"],["is_exclusive","Monthly Exclusive"]].map(([key,label])=>(
                    <label key={key} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
                      <button type="button" onClick={()=>setCf(c=>({...c,[key]:!c[key]}))} style={{ ...S.toggle(cf[key]) }}>
                        <div style={{ position:"absolute", width:18, height:18, borderRadius:9, background:"#fff", top:2, left:cf[key]?20:2, transition:"left 0.15s", boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }}/>
                      </button>
                      <span style={{ fontSize:12, color:TEXT }}>{label}</span>
                    </label>
                  ))}
                </div>
                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={saveCourse} disabled={loading} style={{ ...S.btn, opacity:loading?0.5:1 }}>{loading?"Saving...":(selCourse&&editMode?"Update Course":"Create Course")}</button>
                  {editMode && <button onClick={()=>{setEditMode(false);setCf(selCourse);}} style={S.ghost}>Cancel</button>}
                </div>
              </div>
            )}

            {selCourse && !editMode && (
              <div style={S.card}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                  {[["Type",selCourse.course_type],["Category",selCourse.category],["Level",selCourse.level],["Lessons",selCourse.total_lessons],["Price",selCourse.is_free?"Free":"₹"+selCourse.price],["Offer",`${selCourse.offer_percent||0}% off`]].map(([k,v])=>(
                    <div key={k}><div style={{ fontSize:11, color:MUTED, marginBottom:2 }}>{k}</div><div style={{ fontSize:13, fontWeight:600, color:TEXT }}>{v}</div></div>
                  ))}
                </div>
                {selCourse.description && <div style={{ marginTop:14, fontSize:13, color:MUTED, lineHeight:1.65 }}>{selCourse.description}</div>}
              </div>
            )}
          </div>
        )}

        {/* ── LESSONS ── */}
        {tab==="lessons" && (
          <div style={{ maxWidth:780 }}>
            {!selCourse ? (
              <div style={{ textAlign:"center", padding:"48px 0", color:MUTED }}>Select a course first to manage its lessons.</div>
            ) : (
              <>
                <div style={{ fontSize:16, fontWeight:800, color:TEXT, marginBottom:4 }}>Lessons — {selCourse.title}</div>
                <div style={{ fontSize:12, color:MUTED, marginBottom:20 }}>{lessons.length} lessons added</div>
                {lessons.map((l,i)=>(
                  <div key={l.id} style={{ ...S.card, padding:16, display:"grid", gridTemplateColumns:"auto 1fr auto", gap:14, alignItems:"center" }}>
                    <div style={{ width:32, height:32, borderRadius:8, background:`${PINK}10`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:PINK }}>{i+1}</div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:TEXT }}>{l.title}</div>
                      <div style={{ display:"flex", gap:10, marginTop:3 }}>
                        <span style={{ fontSize:11, color:MUTED }}>⏱ {l.duration_mins} min</span>
                        {l.is_free && <span style={{ fontSize:10, color:GREEN, fontWeight:600 }}>Free preview</span>}
                        {l.video_url ? <span style={{ fontSize:10, color:PINK, fontWeight:600 }}>▶ Has video</span> : <span style={{ fontSize:10, color:"#e5e7eb" }}>No video yet</span>}
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:6 }}>
                      <button onClick={()=>setLf({...l})} style={{ ...S.ghost, fontSize:11, padding:"5px 10px" }}>Edit</button>
                      <button onClick={()=>deleteLesson(l.id)} style={{ ...S.ghost, fontSize:11, padding:"5px 10px", color:"#dc2626" }}>Del</button>
                    </div>
                  </div>
                ))}

                <div style={{ ...S.card, border:`1px solid ${PINK}30` }}>
                  <div style={{ fontSize:13, fontWeight:700, color:TEXT, marginBottom:16 }}>{lf.id?"Edit Lesson":"+ Add Lesson"}</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                    <div><label style={S.label}>Lesson Title *</label><input value={lf.title} onChange={e=>setLf(l=>({...l,title:e.target.value}))} placeholder="e.g. Introduction" style={S.inp}/></div>
                    <div><label style={S.label}>Duration (minutes)</label><input type="number" value={lf.duration_mins||0} onChange={e=>setLf(l=>({...l,duration_mins:e.target.value}))} style={S.inp}/></div>
                  </div>
                  <label style={S.label}>Description / Notes</label>
                  <textarea value={lf.description||""} onChange={e=>setLf(l=>({...l,description:e.target.value}))} placeholder="Key takeaways..." style={S.ta}/>

                  {/* ── VIDEO UPLOAD SECTION ── */}
                  <label style={S.label}>Video</label>
                  <div style={{ background:"#f8f9fb", border:`1px solid ${BORDER}`, borderRadius:10, padding:"14px 16px", marginBottom:14 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:TEXT, marginBottom:10 }}>📹 How to add a video</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      <div style={{ fontSize:12, color:MUTED }}>
                        <strong>Option A — Upload directly</strong> (requires hx-videos Supabase bucket):
                      </div>
                      <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                        <button onClick={()=>videoRef.current?.click()} style={{ ...S.uploadBtn, background:uploading?"#fef2f2":undefined }}>
                          {uploading ? `Uploading ${uploadPct}%...` : "📁 Upload Video"}
                        </button>
                        <input ref={videoRef} type="file" accept="video/*" onChange={handleVideo} style={{ display:"none" }}/>
                        {lf.video_url && <span style={{ fontSize:11, color:GREEN }}>✓ Video uploaded</span>}
                      </div>
                      {uploading && <div style={{ height:4, background:"#f3f4f6", borderRadius:2 }}><div style={{ height:"100%", width:`${uploadPct}%`, background:PINK, borderRadius:2, transition:"width 0.3s" }}/></div>}
                      <div style={{ fontSize:12, color:MUTED, marginTop:4 }}>
                        <strong>Option B — Paste URL</strong> (YouTube embed, Vimeo, or any direct .mp4 URL):
                      </div>
                      <input value={lf.video_url||""} onChange={e=>setLf(l=>({...l,video_url:e.target.value}))} placeholder="https://... (Supabase CDN / YouTube / Vimeo / .mp4)" style={{ ...S.inp, marginBottom:0 }}/>
                    </div>
                  </div>

                  <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                    <label style={{ display:"flex", alignItems:"center", gap:7, cursor:"pointer" }}>
                      <button type="button" onClick={()=>setLf(l=>({...l,is_free:!l.is_free}))} style={{ ...S.toggle(lf.is_free) }}>
                        <div style={{ position:"absolute", width:18, height:18, borderRadius:9, background:"#fff", top:2, left:lf.is_free?20:2, transition:"left 0.15s", boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }}/>
                      </button>
                      <span style={{ fontSize:12, color:TEXT }}>Free Preview Lesson</span>
                    </label>
                    <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
                      {lf.id && <button onClick={()=>setLf(EMPTY_LESSON)} style={S.ghost}>Cancel</button>}
                      <button onClick={saveLesson} disabled={loading} style={{ ...S.btn, opacity:loading?0.5:1 }}>{loading?"Saving...":(lf.id?"Update":"Add Lesson")}</button>
                    </div>
                  </div>
                </div>

                {/* Supabase video guide */}
                <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:12, padding:18, marginTop:16 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:TEXT, marginBottom:10 }}>📖 Setting Up Supabase Video Storage</div>
                  {[
                    "Go to supabase.com → your project → Storage",
                    "Click 'New bucket' → Name: hx-videos → Toggle Public ON → Create",
                    "Go to Storage → hx-videos → Policies → Add policy → Allow all operations for authenticated users",
                    "Videos uploaded via the button above go to the 'lessons/' folder inside this bucket",
                    "The public CDN URL is auto-filled and saved to the lesson record",
                    "Tip: For videos over 50MB, use Option B and host on YouTube (unlisted) or Vimeo for better streaming",
                  ].map((step,i)=>(
                    <div key={i} style={{ display:"flex", gap:10, marginBottom:8 }}>
                      <div style={{ width:20, height:20, borderRadius:"50%", background:"#2563eb15", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:"#2563eb", flexShrink:0 }}>{i+1}</div>
                      <div style={{ fontSize:12, color:"#374151", lineHeight:1.5 }}>{step}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── OFFERS & PRICING ── */}
        {tab==="offers" && (
          <div style={{ maxWidth:560 }}>
            {!selCourse ? (
              <div style={{ textAlign:"center", padding:"48px 0", color:MUTED }}>Select a course to manage its pricing.</div>
            ) : (
              <>
                <div style={{ fontSize:16, fontWeight:800, color:TEXT, marginBottom:4 }}>Pricing — {selCourse.title}</div>
                <div style={{ fontSize:12, color:MUTED, marginBottom:20 }}>Set price, discount offers, and access rules</div>
                <div style={S.card}>
                  {/* Free toggle */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, paddingBottom:16, borderBottom:`1px solid ${BORDER}` }}>
                    <div><div style={{ fontSize:13, fontWeight:700, color:TEXT }}>Free Course</div><div style={{ fontSize:11, color:MUTED }}>Accessible to all users including free plan</div></div>
                    <button type="button" onClick={()=>setCf(c=>({...c,is_free:!c.is_free}))} style={{ ...S.toggle(cf.is_free) }}><div style={{ position:"absolute", width:18, height:18, borderRadius:9, background:"#fff", top:2, left:cf.is_free?20:2, transition:"left 0.15s", boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }}/></button>
                  </div>
                  {!cf.is_free && (
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
                      <div><label style={S.label}>Original Price (₹)</label><input type="number" value={cf.price||0} onChange={e=>setCf(c=>({...c,price:e.target.value}))} style={S.inp}/></div>
                      <div><label style={S.label}>Discount % (0 = none)</label><input type="number" min="0" max="90" value={cf.offer_percent||0} onChange={e=>setCf(c=>({...c,offer_percent:e.target.value}))} style={S.inp}/></div>
                    </div>
                  )}
                  {!cf.is_free && cf.price > 0 && cf.offer_percent > 0 && (
                    <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:9, padding:"12px 16px", marginBottom:16 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:GREEN }}>Effective Price: ₹{Math.round(cf.price*(1-cf.offer_percent/100))} <span style={{ fontSize:11, color:MUTED }}>(was ₹{cf.price})</span></div>
                    </div>
                  )}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, paddingBottom:16, borderBottom:`1px solid ${BORDER}` }}>
                    <div><div style={{ fontSize:13, fontWeight:700, color:TEXT }}>Monthly Exclusive</div><div style={{ fontSize:11, color:MUTED }}>Subscribers-only this month</div></div>
                    <button type="button" onClick={()=>setCf(c=>({...c,is_exclusive:!c.is_exclusive}))} style={{ ...S.toggle(cf.is_exclusive) }}><div style={{ position:"absolute", width:18, height:18, borderRadius:9, background:"#fff", top:2, left:cf.is_exclusive?20:2, transition:"left 0.15s", boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }}/></button>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                    <div><div style={{ fontSize:13, fontWeight:700, color:TEXT }}>Published</div><div style={{ fontSize:11, color:MUTED }}>Visible to students</div></div>
                    <button type="button" onClick={()=>setCf(c=>({...c,is_published:!c.is_published}))} style={{ ...S.toggle(cf.is_published) }}><div style={{ position:"absolute", width:18, height:18, borderRadius:9, background:"#fff", top:2, left:cf.is_published?20:2, transition:"left 0.15s", boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }}/></button>
                  </div>
                  <button onClick={async()=>{ setLoading(true); await supabase.from("hx_courses").update({ is_free:cf.is_free, price:Number(cf.price||0), offer_percent:Number(cf.offer_percent||0), is_exclusive:cf.is_exclusive, is_published:cf.is_published }).eq("id",selCourse.id); await loadCourses(); notify("Pricing saved ✓"); setLoading(false); }} disabled={loading} style={{ ...S.btn, width:"100%", opacity:loading?0.5:1 }}>
                    {loading?"Saving...":"Save Pricing & Offers"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── ANALYTICS ── */}
        {tab==="analytics" && (
          <div style={{ maxWidth:700 }}>
            <div style={{ fontSize:16, fontWeight:800, color:TEXT, marginBottom:24 }}>📊 Platform Analytics</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:24 }}>
              {[
                { label:"Total Courses",     value:courses.length,                                      color:PINK    },
                { label:"Published",         value:courses.filter(c=>c.is_published).length,             color:GREEN   },
                { label:"Business Courses",  value:courses.filter(c=>c.course_type==="business").length, color:"#0284c7"},
                { label:"Individual",        value:courses.filter(c=>c.course_type!=="business").length, color:"#7c3aed"},
                { label:"Free Courses",      value:courses.filter(c=>c.is_free).length,                  color:"#16a34a"},
                { label:"Exclusive",         value:courses.filter(c=>c.is_exclusive).length,             color:"#d97706"},
              ].map(s=>(
                <div key={s.label} style={{ ...S.card, marginBottom:0 }}>
                  <div style={{ fontSize:24, fontWeight:800, color:s.color }}>{s.value}</div>
                  <div style={{ fontSize:11, color:MUTED, marginTop:2 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, overflow:"hidden" }}>
              <div style={{ padding:"14px 18px", borderBottom:`1px solid ${BORDER}`, display:"grid", gridTemplateColumns:"1fr 80px 70px 70px 60px", gap:12 }}>
                {["Course","Type","Lessons","Status","Price"].map(h=>(
                  <div key={h} style={{ fontSize:10, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.06em" }}>{h}</div>
                ))}
              </div>
              {courses.slice(0,20).map(c=>(
                <div key={c.id} style={{ padding:"12px 18px", borderBottom:`1px solid #f3f4f6`, display:"grid", gridTemplateColumns:"1fr 80px 70px 70px 60px", gap:12, alignItems:"center" }}>
                  <div style={{ fontSize:12, fontWeight:600, color:TEXT, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.title}</div>
                  <span style={{ fontSize:10, fontWeight:700, color:c.course_type==="business"?"#0284c7":PINK }}>{c.course_type}</span>
                  <span style={{ fontSize:11, color:TEXT }}>{c.total_lessons||0}</span>
                  <span style={{ fontSize:10, fontWeight:700, color:c.is_published?GREEN:MUTED }}>{c.is_published?"Live":"Draft"}</span>
                  <span style={{ fontSize:12, fontWeight:600, color:c.is_free?GREEN:PINK }}>{c.is_free?"Free":"₹"+c.price}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
