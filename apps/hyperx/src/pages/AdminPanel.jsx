export default function AdminPanel({ profile: profileProp }) {
  // ── ADMIN CHECK ─────────────────────────────────────────────────────────
  // Uses email match (most reliable) + plan check.
  // Never calls getSession() directly — it hangs on Cloudflare.
  // Profile comes from App.jsx which already resolved auth with email fallback.

  const ADMIN_EMAILS = ["jeromjoseph31@gmail.com", "jeromjoshep.23@gmail.com"];

  const propEmail = (profileProp?.email || "").toLowerCase().trim();
  const isAdminByEmail = ADMIN_EMAILS.includes(propEmail);
  const isAdminByPlan  = profileProp?.plan === "admin";

  // Wait up to 8 retries (8 seconds) for profile prop to arrive
  const [retryCount, setRetryCount] = useState(0);
  useEffect(() => {
    if (!profileProp && retryCount < 8) {
      const t = setTimeout(() => setRetryCount(c => c + 1), 1000);
      return () => clearTimeout(t);
    }
  }, [profileProp, retryCount]);

  const checking = !profileProp && retryCount < 8;
  const isAdmin  = isAdminByEmail || isAdminByPlan;
  const authEmail = propEmail;
  const debugPlan = profileProp?.plan || "not loaded";

  export default function AdminPanel({ profile: profileProp }) {
  // ─── ADMIN CHECK ──────────────────────────────────────────────────────────
  // IMPORTANT: Uses onAuthStateChange (same as App.jsx) + getSession fallback.
  // Do NOT use getSession() alone at mount — with custom cookie storage the
  // session is not yet parsed when the component first renders.
  const [adminStatus, setAdminStatus] = useState("loading");
  const [authEmail,   setAuthEmail]   = useState("");
  const [debugPlan,   setDebugPlan]   = useState("");
  const [retryCount,  setRetryCount]  = useState(0);

  useEffect(() => {
    let resolved = false;

    async function queryPlan(userId, email) {
      if (resolved) return;
      setAuthEmail(email);

      const { data, error } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", userId)
        .single();

      if (resolved) return;
      resolved = true;

      if (error) {
        // Row missing — upsert blank row so the SQL fix will work
        setDebugPlan("NO ROW — upserted blank, run SQL now");
        await supabase.from("profiles").upsert(
          { id: userId, email, plan: "free" },
          { onConflict: "id" }
        );
        setAdminStatus("denied");
        return;
      }

      setDebugPlan(data?.plan || "null");
      setAdminStatus(data?.plan === "admin" ? "allowed" : "denied");
    }

    // Pattern 1: listen for auth state (fires immediately if session exists)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          await queryPlan(session.user.id, session.user.email || "");
        } else if (!resolved) {
          resolved = true;
          setAdminStatus("denied");
          setAuthEmail("no session");
        }
      }
    );

    // Pattern 2: also call getSession() as a parallel fallback
    // (sometimes onAuthStateChange fires after a short delay)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !resolved) {
        queryPlan(session.user.id, session.user.email || "");
      }
    });

    // Pattern 3: if profileProp was passed and has a plan already, use it directly
    if (profileProp?.plan) {
      resolved = true;
      setAuthEmail(profileProp.email || "from prop");
      setDebugPlan(profileProp.plan);
      setAdminStatus(profileProp.plan === "admin" ? "allowed" : "denied");
    }

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryCount]);

  // ─── STATES ───────────────────────────────────────────────────────────────
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

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    const { data } = await supabase.from("hx_courses").select("*").order("created_at",{ascending:false});
    setCourses(data||[]);
  };

  const loadLessons = async (courseId) => {
    const { data } = await supabase.from("hx_lessons").select("*").eq("course_id",courseId).order("sort_order");
    setLessons(data||[]);
  };

  const selectCourse = (course) => {
    setSelCourse(course);
    setCf(course);
    setEditMode(false);
    setLf(EMPTY_LESSON);
    loadLessons(course.id);
    setTab("lessons");
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
      if (error) notify(error.message,"error"); else { notify("Course updated ✓"); await loadCourses(); }
    } else {
      const { data, error } = await supabase.from("hx_courses").insert([payload]).select().single();
      if (error) notify(error.message,"error"); else { notify("Course created ✓"); setSelCourse(data); setCf(data); setEditMode(false); await loadCourses(); loadLessons(data.id); setTab("lessons"); }
    }
    setLoading(false);
  };

  const deleteCourse = async (id) => {
    if (!window.confirm("Delete this course and all lessons?")) return;
    await supabase.from("hx_courses").delete().eq("id",id);
    notify("Course deleted"); await loadCourses();
    if (selCourse?.id===id) { setSelCourse(null); setLessons([]); setTab("courses"); }
  };

  const saveLesson = async () => {
    if (!lf.title.trim() || !selCourse) return notify("Lesson title required","error");
    setLoading(true);
    const payload = { ...lf, course_id:selCourse.id, duration_mins:Number(lf.duration_mins||0), sort_order:Number(lf.sort_order||0) };
    if (lf.id) {
      const { error } = await supabase.from("hx_lessons").update(payload).eq("id",lf.id);
      if (error) notify(error.message,"error"); else { notify("Lesson saved ✓"); await loadLessons(selCourse.id); setLf(EMPTY_LESSON); }
    } else {
      const { error } = await supabase.from("hx_lessons").insert([payload]);
      if (error) notify(error.message,"error"); else {
        notify("Lesson added ✓");
        // Update total_lessons count
        await supabase.from("hx_courses").update({ total_lessons:(selCourse.total_lessons||0)+1 }).eq("id",selCourse.id);
        await loadLessons(selCourse.id); await loadCourses();
        setLf(EMPTY_LESSON);
      }
    }
    setLoading(false);
  };

  const deleteLesson = async (lessonId) => {
    await supabase.from("hx_lessons").delete().eq("id",lessonId);
    await supabase.from("hx_courses").update({ total_lessons:Math.max(0,(selCourse.total_lessons||1)-1) }).eq("id",selCourse.id);
    await loadLessons(selCourse.id); await loadCourses();
    notify("Lesson deleted");
  };

  const handleThumb = async (e) => {
    const file = e.target.files?.[0]; if(!file) return;
    try { const url = await uploadFile(file,"hx-videos","thumbnails"); setCf(c=>({...c,thumbnail_url:url})); notify("Thumbnail uploaded ✓"); } catch(err) { notify(err.message,"error"); }
  };

  const handleVideo = async (e) => {
    const file = e.target.files?.[0]; if(!file) return;
    try { const url = await uploadFile(file,"hx-videos","lessons"); setLf(l=>({...l,video_url:url})); notify("Video uploaded ✓"); } catch(err) { notify(err.message,"error"); }
  };

  const togglePublish = async (course) => {
    await supabase.from("hx_courses").update({ is_published:!course.is_published }).eq("id",course.id);
    await loadCourses();
    notify(course.is_published?"Course unpublished":"Course published ✓");
  };

  const filtered = courses.filter(c => {
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter==="all" || c.course_type===typeFilter;
    return matchSearch && matchType;
  });

  const S = {
    page:  { minHeight:"100vh", background:LIGHT, fontFamily:"'Plus Jakarta Sans',sans-serif", display:"flex" },
    aside: { width:320, minHeight:"100vh", background:CARD, borderRight:`1px solid ${BORDER}`, display:"flex", flexDirection:"column", flexShrink:0 },
    main:  { flex:1, padding:"28px 36px", overflowY:"auto" },
    card:  { background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, padding:20, marginBottom:16, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" },
    label: { fontSize:11, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6, display:"block" },
    inp:   { width:"100%", border:`1px solid ${BORDER}`, borderRadius:8, padding:"9px 12px", fontSize:13, color:TEXT, fontFamily:"inherit", outline:"none", background:"#fafafa", boxSizing:"border-box", marginBottom:14 },
    sel:   { width:"100%", border:`1px solid ${BORDER}`, borderRadius:8, padding:"9px 12px", fontSize:13, color:TEXT, fontFamily:"inherit", outline:"none", background:"#fafafa", boxSizing:"border-box", marginBottom:14 },
    ta:    { width:"100%", border:`1px solid ${BORDER}`, borderRadius:8, padding:"9px 12px", fontSize:13, color:TEXT, fontFamily:"inherit", outline:"none", resize:"vertical", minHeight:72, background:"#fafafa", boxSizing:"border-box", marginBottom:14 },
    btn:   { padding:"10px 22px", background:PINK, color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" },
    ghost: { padding:"9px 18px", background:"#fff", color:MUTED, border:`1px solid ${BORDER}`, borderRadius:9, fontSize:12, cursor:"pointer", fontFamily:"inherit" },
    toggle:(on)=>({ width:40, height:22, borderRadius:11, background:on?PINK:"#d1d5db", position:"relative", cursor:"pointer", border:"none", flexShrink:0 }),
    uploadBtn: { padding:"8px 16px", background:"#f3f4f6", border:`1px solid ${BORDER}`, borderRadius:8, fontSize:12, color:TEXT, cursor:"pointer", fontFamily:"inherit" },
  };

  if (isLoading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:LIGHT, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:28, color:PINK, marginBottom:12, animation:"spin 1.5s linear infinite" }}>⚙</div>
        <div style={{ fontSize:14, color:MUTED }}>Checking admin access...</div>
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  if (!isAdmin) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:LIGHT, fontFamily:"'Plus Jakarta Sans',sans-serif", padding:24 }}>
      <div style={{ textAlign:"center", maxWidth:560 }}>
        <div style={{ fontSize:40, marginBottom:16 }}>🔒</div>
        <div style={{ fontSize:20, fontWeight:800, color:TEXT, marginBottom:20 }}>Admin Access Required</div>

        {/* Debug info */}
        <div style={{ background:"#f8f9fb", border:"1px solid #e8eaed", borderRadius:10, padding:"14px 18px", marginBottom:20, textAlign:"left" }}>
          <div style={{ fontSize:11, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8 }}>Live Debug</div>
          <div style={{ fontSize:12, color:TEXT, fontFamily:"monospace", lineHeight:2 }}>
            auth email: <strong style={{color: authEmail && authEmail !== "no session" ? GREEN : "#DC2626"}}>{authEmail || "not resolved yet"}</strong><br/>
            plan in DB: <strong style={{color: debugPlan === "admin" ? GREEN : "#DC2626"}}>{debugPlan || "not fetched yet"}</strong><br/>
            need: <strong style={{color:GREEN}}>admin</strong>
          </div>
        </div>

        {/* If email resolved but plan is wrong */}
        {authEmail && authEmail !== "no session" && debugPlan !== "" && (
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:13, color:MUTED, lineHeight:1.75, marginBottom:14 }}>
              Run this SQL in Supabase to grant admin access, then click Retry:
            </div>
            <div style={{ background:"#f3f4f6", border:"1px solid #e8eaed", borderRadius:8, padding:"14px 18px", fontFamily:"monospace", fontSize:12, color:TEXT, textAlign:"left", lineHeight:2 }}>
              UPDATE profiles<br/>
              SET plan = 'admin'<br/>
              WHERE email = '{authEmail}';
            </div>
          </div>
        )}

        {/* If email not resolved yet */}
        {(!authEmail || authEmail === "no session") && (
          <div style={{ fontSize:13, color:MUTED, marginBottom:20, lineHeight:1.75 }}>
            Session not detected. Try clicking Retry — if that fails, sign out and back in.
          </div>
        )}

        <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
          {/* Retry — re-runs the useEffect */}
          <button
            onClick={() => { setAdminStatus("loading"); setDebugPlan(""); setAuthEmail(""); setRetryCount(c => c + 1); }}
            style={{ padding:"11px 24px", background:CARD, color:TEXT, border:"1px solid #e8eaed", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}
          >
            ↻ Retry Check
          </button>

          {/* Sign out and back in */}
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "https://nugens.in.net/auth?redirect=" + encodeURIComponent(window.location.href);
            }}
            style={{ padding:"11px 24px", background:PINK, color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}
          >
            Sign Out & Sign Back In →
          </button>
        </div>
      </div>
    </div>
  );

  const courseCats = cf.course_type === "business" ? BIZ_CATS : IND_CATS;

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      {/* LEFT: Course list */}
      <div style={S.aside}>
        {/* Header */}
        <div style={{ padding:"20px 16px 14px", borderBottom:`1px solid ${BORDER}` }}>
          <div style={{ fontSize:16, fontWeight:800, color:TEXT, marginBottom:12 }}>⚙ Admin Panel</div>
          <div style={{ display:"flex", gap:6 }}>
            {[["all","All"],["individual","Individual"],["business","Business"]].map(([v,l])=>(
              <button key={v} onClick={()=>setTypeFilter(v)} style={{ flex:1, padding:"5px 0", background:typeFilter===v?PINK:"#f3f4f6", color:typeFilter===v?"#fff":MUTED, border:"none", borderRadius:6, fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{l}</button>
            ))}
          </div>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search courses..." style={{ ...S.inp, marginBottom:0, marginTop:10, fontSize:12 }} />
        </div>

        {/* New course btn */}
        <div style={{ padding:"10px 12px", borderBottom:`1px solid ${BORDER}` }}>
          <button onClick={()=>{ setSelCourse(null); setCf(EMPTY_COURSE); setLessons([]); setEditMode(false); setTab("courses"); }} style={{ ...S.btn, width:"100%", fontSize:12 }}>+ New Course</button>
        </div>

        {/* Course list */}
        <div style={{ flex:1, overflowY:"auto" }}>
          {filtered.map(c => (
            <div key={c.id} onClick={()=>selectCourse(c)} style={{ padding:"12px 14px", borderBottom:`1px solid ${BORDER}`, cursor:"pointer", background:selCourse?.id===c.id?`${PINK}08`:"transparent", borderLeft:selCourse?.id===c.id?`3px solid ${PINK}`:"3px solid transparent" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:TEXT, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.title}</div>
                  <div style={{ display:"flex", gap:5, marginTop:3, flexWrap:"wrap" }}>
                    <span style={{ fontSize:9, fontWeight:700, color:c.course_type==="business"?"#0284c7":PINK, background:c.course_type==="business"?"#eff6ff":"#fef2f2", borderRadius:3, padding:"1px 5px" }}>{c.course_type}</span>
                    <span style={{ fontSize:9, color:MUTED }}>{c.category}</span>
                    {c.is_exclusive && <span style={{ fontSize:9, fontWeight:700, color:"#d97706", background:"#fffbeb", borderRadius:3, padding:"1px 5px" }}>EXCL</span>}
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:3, alignItems:"flex-end", flexShrink:0, marginLeft:8 }}>
                  <span style={{ fontSize:9, fontWeight:700, color:c.is_published?GREEN:"#9ca3af", background:c.is_published?"#f0fdf4":"#f9fafb", borderRadius:3, padding:"2px 5px" }}>
                    {c.is_published?"LIVE":"DRAFT"}
                  </span>
                  <span style={{ fontSize:9, color:MUTED }}>{c.total_lessons} lessons</span>
                </div>
              </div>
            </div>
          ))}
          {filtered.length===0 && <div style={{ padding:24, textAlign:"center", fontSize:12, color:MUTED }}>No courses. Create one →</div>}
        </div>

        {/* Stats */}
        <div style={{ padding:"12px 14px", borderTop:`1px solid ${BORDER}`, background:"#f8f9fb" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, textAlign:"center" }}>
            <div><div style={{ fontSize:16, fontWeight:800, color:TEXT }}>{courses.length}</div><div style={{ fontSize:9, color:MUTED }}>Total</div></div>
            <div><div style={{ fontSize:16, fontWeight:800, color:GREEN }}>{courses.filter(c=>c.is_published).length}</div><div style={{ fontSize:9, color:MUTED }}>Live</div></div>
            <div><div style={{ fontSize:16, fontWeight:800, color:PINK }}>{courses.filter(c=>c.course_type==="business").length}</div><div style={{ fontSize:9, color:MUTED }}>Biz</div></div>
          </div>
        </div>
      </div>

      {/* MAIN panel */}
      <div style={S.main}>
        {/* Toast */}
        {msg.text && (
          <div style={{ position:"fixed", top:20, right:24, background:msg.type==="error"?"#fef2f2":CARD, border:`1px solid ${msg.type==="error"?"#fca5a5":BORDER}`, borderRadius:9, padding:"12px 18px", fontSize:13, fontWeight:600, color:msg.type==="error"?"#dc2626":GREEN, boxShadow:"0 4px 16px rgba(0,0,0,0.1)", zIndex:1000 }}>
            {msg.text}
          </div>
        )}

        {/* Tab switcher */}
        <div style={{ display:"flex", gap:6, marginBottom:24 }}>
          {[["courses","📋 Course Info"],["lessons","📹 Lessons"],["offers","🏷 Offers & Pricing"],["analytics","📊 Analytics"]].map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} style={{ padding:"8px 18px", background:tab===t?PINK:"#fff", color:tab===t?"#fff":MUTED, border:`1px solid ${tab===t?PINK:BORDER}`, borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{l}</button>
          ))}
        </div>

        {/* ─── COURSE INFO TAB ─── */}
        {tab==="courses" && (
          <div style={{ maxWidth:700 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div style={{ fontSize:18, fontWeight:800, color:TEXT }}>{selCourse && !editMode ? selCourse.title : selCourse ? "Edit Course" : "New Course"}</div>
              <div style={{ display:"flex", gap:8 }}>
                {selCourse && !editMode && (
                  <>
                    <button onClick={()=>setEditMode(true)} style={S.ghost}>Edit</button>
                    <button onClick={()=>togglePublish(selCourse)} style={{ ...S.ghost, color:selCourse.is_published?"#dc2626":GREEN, borderColor:selCourse.is_published?"#fca5a5":"#bbf7d0" }}>
                      {selCourse.is_published?"Unpublish":"Publish"}
                    </button>
                    <button onClick={()=>deleteCourse(selCourse.id)} style={{ ...S.ghost, color:"#dc2626", borderColor:"#fca5a5" }}>Delete</button>
                  </>
                )}
              </div>
            </div>

            {(!selCourse || editMode) && (
              <div style={S.card}>
                {/* Type */}
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
                <textarea value={cf.description||""} onChange={e=>setCf(c=>({...c,description:e.target.value}))} placeholder="What will students learn in this course?" style={S.ta}/>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
                  <div>
                    <label style={S.label}>Level</label>
                    <select value={cf.level} onChange={e=>setCf(c=>({...c,level:e.target.value}))} style={S.sel}>
                      {LEVELS.map(l=><option key={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={S.label}>Total Lessons</label>
                    <input type="number" value={cf.total_lessons||0} onChange={e=>setCf(c=>({...c,total_lessons:e.target.value}))} style={S.inp}/>
                  </div>
                  <div>
                    <label style={S.label}>Duration (mins)</label>
                    <input type="number" value={cf.duration_mins||0} onChange={e=>setCf(c=>({...c,duration_mins:e.target.value}))} style={S.inp}/>
                  </div>
                </div>

                {/* Thumbnail */}
                <label style={S.label}>Thumbnail</label>
                <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:14 }}>
                  {cf.thumbnail_url && <img src={cf.thumbnail_url} style={{ width:80, height:52, borderRadius:6, objectFit:"cover", border:`1px solid ${BORDER}` }}/>}
                  <button onClick={()=>thumbRef.current.click()} style={S.uploadBtn}>{uploading?"Uploading...":"Upload Thumbnail"}</button>
                  <input ref={thumbRef} type="file" accept="image/*" onChange={handleThumb} style={{ display:"none" }}/>
                  {cf.thumbnail_url && <input value={cf.thumbnail_url} onChange={e=>setCf(c=>({...c,thumbnail_url:e.target.value}))} placeholder="or paste URL" style={{ ...S.inp, marginBottom:0, flex:1 }}/>}
                </div>

                {/* Toggles */}
                <div style={{ display:"flex", gap:20, flexWrap:"wrap", marginBottom:14 }}>
                  {[["is_free","Free Course"],["is_published","Published"],["is_exclusive","Monthly Exclusive"]].map(([key,label])=>(
                    <label key={key} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
                      <button type="button" onClick={()=>setCf(c=>({...c,[key]:!c[key]}))} style={{ ...S.toggle(cf[key]), outline:"none" }}>
                        <div style={{ position:"absolute", width:18, height:18, borderRadius:9, background:"#fff", top:2, left:cf[key]?20:2, transition:"left 0.15s", boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }}/>
                      </button>
                      <span style={{ fontSize:12, color:TEXT, fontWeight:500 }}>{label}</span>
                    </label>
                  ))}
                </div>

                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={saveCourse} disabled={loading} style={{ ...S.btn, opacity:loading?0.5:1 }}>
                    {loading?"Saving...":(selCourse&&editMode?"Update Course":"Create Course")}
                  </button>
                  {editMode && <button onClick={()=>{setEditMode(false);setCf(selCourse);}} style={S.ghost}>Cancel</button>}
                </div>
              </div>
            )}

            {selCourse && !editMode && (
              <div style={S.card}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                  <div><div style={{ fontSize:11, color:MUTED, marginBottom:2 }}>Type</div><div style={{ fontSize:13, fontWeight:600, color:TEXT }}>{selCourse.course_type}</div></div>
                  <div><div style={{ fontSize:11, color:MUTED, marginBottom:2 }}>Category</div><div style={{ fontSize:13, fontWeight:600, color:TEXT }}>{selCourse.category}</div></div>
                  <div><div style={{ fontSize:11, color:MUTED, marginBottom:2 }}>Level</div><div style={{ fontSize:13, fontWeight:600, color:TEXT }}>{selCourse.level}</div></div>
                  <div><div style={{ fontSize:11, color:MUTED, marginBottom:2 }}>Lessons</div><div style={{ fontSize:13, fontWeight:600, color:TEXT }}>{selCourse.total_lessons}</div></div>
                  <div><div style={{ fontSize:11, color:MUTED, marginBottom:2 }}>Price</div><div style={{ fontSize:13, fontWeight:600, color:TEXT }}>{selCourse.is_free?"Free":"₹"+selCourse.price}</div></div>
                  <div><div style={{ fontSize:11, color:MUTED, marginBottom:2 }}>Offer</div><div style={{ fontSize:13, fontWeight:600, color:TEXT }}>{selCourse.offer_percent||0}% off</div></div>
                </div>
                {selCourse.description && <div style={{ marginTop:14, fontSize:13, color:MUTED, lineHeight:1.65 }}>{selCourse.description}</div>}
              </div>
            )}
          </div>
        )}

        {/* ─── LESSONS TAB ─── */}
        {tab==="lessons" && (
          <div style={{ maxWidth:800 }}>
            {!selCourse ? (
              <div style={{ textAlign:"center", padding:"48px 0", color:MUTED }}>Select a course first to manage its lessons.</div>
            ) : (
              <>
                <div style={{ fontSize:16, fontWeight:800, color:TEXT, marginBottom:4 }}>Lessons — {selCourse.title}</div>
                <div style={{ fontSize:12, color:MUTED, marginBottom:24 }}>{lessons.length} lessons · Drag to reorder (coming soon)</div>

                {/* Existing lessons */}
                {lessons.map((l,i)=>(
                  <div key={l.id} style={{ ...S.card, padding:16, marginBottom:10, display:"grid", gridTemplateColumns:"auto 1fr auto", gap:14, alignItems:"center" }}>
                    <div style={{ width:32, height:32, borderRadius:8, background:`${PINK}10`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:PINK }}>{i+1}</div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:TEXT }}>{l.title}</div>
                      <div style={{ display:"flex", gap:10, marginTop:3 }}>
                        <span style={{ fontSize:11, color:MUTED }}>⏱ {l.duration_mins} min</span>
                        {l.is_free && <span style={{ fontSize:10, color:GREEN, fontWeight:600 }}>Free preview</span>}
                        {l.video_url ? <span style={{ fontSize:10, color:PINK, fontWeight:600 }}>▶ Has video</span> : <span style={{ fontSize:10, color:MUTED }}>No video yet</span>}
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:6 }}>
                      <button onClick={()=>setLf({...l})} style={{ ...S.ghost, fontSize:11, padding:"5px 10px" }}>Edit</button>
                      <button onClick={()=>deleteLesson(l.id)} style={{ ...S.ghost, fontSize:11, padding:"5px 10px", color:"#dc2626", borderColor:"#fca5a5" }}>Del</button>
                    </div>
                  </div>
                ))}

                {/* Add/Edit lesson form */}
                <div style={{ ...S.card, border:`1px solid ${PINK}30` }}>
                  <div style={{ fontSize:13, fontWeight:700, color:TEXT, marginBottom:16 }}>{lf.id?"Edit Lesson":"+ Add New Lesson"}</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                    <div>
                      <label style={S.label}>Lesson Title *</label>
                      <input value={lf.title} onChange={e=>setLf(l=>({...l,title:e.target.value}))} placeholder="e.g. Introduction to Communication" style={S.inp}/>
                    </div>
                    <div>
                      <label style={S.label}>Duration (minutes)</label>
                      <input type="number" value={lf.duration_mins||0} onChange={e=>setLf(l=>({...l,duration_mins:e.target.value}))} style={S.inp}/>
                    </div>
                  </div>

                  <label style={S.label}>Description / Notes</label>
                  <textarea value={lf.description||""} onChange={e=>setLf(l=>({...l,description:e.target.value}))} placeholder="Key takeaways and lesson notes..." style={S.ta}/>

                  {/* Video upload */}
                  <label style={S.label}>Video</label>
                  <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:14 }}>
                    <button onClick={()=>videoRef.current.click()} style={{ ...S.uploadBtn, background:uploading?"#fef2f2":undefined }}>
                      {uploading ? `Uploading ${uploadPct}%...` : "Upload Video"}
                    </button>
                    <input ref={videoRef} type="file" accept="video/*" onChange={handleVideo} style={{ display:"none" }}/>
                    <input value={lf.video_url||""} onChange={e=>setLf(l=>({...l,video_url:e.target.value}))} placeholder="or paste Supabase/S3/CDN URL" style={{ ...S.inp, marginBottom:0, flex:1 }}/>
                  </div>
                  {uploading && <div style={{ height:4, background:"#f3f4f6", borderRadius:2, marginBottom:14 }}><div style={{ height:"100%", width:`${uploadPct}%`, background:PINK, borderRadius:2, transition:"width 0.3s" }}/></div>}

                  <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                    <label style={{ display:"flex", alignItems:"center", gap:7, cursor:"pointer" }}>
                      <button type="button" onClick={()=>setLf(l=>({...l,is_free:!l.is_free}))} style={{ ...S.toggle(lf.is_free), outline:"none" }}>
                        <div style={{ position:"absolute", width:18, height:18, borderRadius:9, background:"#fff", top:2, left:lf.is_free?20:2, transition:"left 0.15s", boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }}/>
                      </button>
                      <span style={{ fontSize:12, color:TEXT }}>Free Preview Lesson</span>
                    </label>

                    <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
                      {lf.id && <button onClick={()=>setLf(EMPTY_LESSON)} style={S.ghost}>Cancel</button>}
                      <button onClick={saveLesson} disabled={loading} style={{ ...S.btn, opacity:loading?0.5:1 }}>
                        {loading?"Saving...":(lf.id?"Update Lesson":"Add Lesson")}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── OFFERS & PRICING TAB ─── */}
        {tab==="offers" && (
          <div style={{ maxWidth:600 }}>
            {!selCourse ? (
              <div style={{ textAlign:"center", padding:"48px 0", color:MUTED }}>Select a course to manage its pricing.</div>
            ) : (
              <>
                <div style={{ fontSize:16, fontWeight:800, color:TEXT, marginBottom:4 }}>Offers & Pricing — {selCourse.title}</div>
                <div style={{ fontSize:12, color:MUTED, marginBottom:24 }}>Set course price, discount offers, and access type</div>

                <div style={S.card}>
                  {/* Free toggle */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, paddingBottom:16, borderBottom:`1px solid ${BORDER}` }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:TEXT }}>Free Course</div>
                      <div style={{ fontSize:11, color:MUTED }}>Accessible to all users including free plan</div>
                    </div>
                    <button type="button" onClick={()=>setCf(c=>({...c,is_free:!c.is_free}))} style={{ ...S.toggle(cf.is_free), outline:"none" }}>
                      <div style={{ position:"absolute", width:18, height:18, borderRadius:9, background:"#fff", top:2, left:cf.is_free?20:2, transition:"left 0.15s", boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }}/>
                    </button>
                  </div>

                  {!cf.is_free && (
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
                      <div>
                        <label style={S.label}>Original Price (₹)</label>
                        <input type="number" value={cf.price||0} onChange={e=>setCf(c=>({...c,price:e.target.value}))} style={S.inp}/>
                      </div>
                      <div>
                        <label style={S.label}>Discount % (0 = no offer)</label>
                        <input type="number" min="0" max="90" value={cf.offer_percent||0} onChange={e=>setCf(c=>({...c,offer_percent:e.target.value}))} style={S.inp}/>
                      </div>
                    </div>
                  )}

                  {!cf.is_free && cf.price > 0 && cf.offer_percent > 0 && (
                    <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:9, padding:"12px 16px", marginBottom:16 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:GREEN }}>
                        Effective Price: ₹{Math.round(cf.price*(1-cf.offer_percent/100))} <span style={{ fontSize:11, color:MUTED, fontWeight:400 }}>(was ₹{cf.price})</span>
                      </div>
                    </div>
                  )}

                  {/* Exclusive toggle */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, paddingBottom:16, borderBottom:`1px solid ${BORDER}` }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:TEXT }}>Monthly Exclusive</div>
                      <div style={{ fontSize:11, color:MUTED }}>Only subscribers can access this course this month</div>
                    </div>
                    <button type="button" onClick={()=>setCf(c=>({...c,is_exclusive:!c.is_exclusive}))} style={{ ...S.toggle(cf.is_exclusive), outline:"none" }}>
                      <div style={{ position:"absolute", width:18, height:18, borderRadius:9, background:"#fff", top:2, left:cf.is_exclusive?20:2, transition:"left 0.15s", boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }}/>
                    </button>
                  </div>

                  {/* Published toggle */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:TEXT }}>Published</div>
                      <div style={{ fontSize:11, color:MUTED }}>Visible to students on the platform</div>
                    </div>
                    <button type="button" onClick={()=>setCf(c=>({...c,is_published:!c.is_published}))} style={{ ...S.toggle(cf.is_published), outline:"none" }}>
                      <div style={{ position:"absolute", width:18, height:18, borderRadius:9, background:"#fff", top:2, left:cf.is_published?20:2, transition:"left 0.15s", boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }}/>
                    </button>
                  </div>

                  <button onClick={async()=>{ setLoading(true); await supabase.from("hx_courses").update({ is_free:cf.is_free, price:Number(cf.price||0), offer_percent:Number(cf.offer_percent||0), is_exclusive:cf.is_exclusive, is_published:cf.is_published }).eq("id",selCourse.id); await loadCourses(); notify("Pricing saved ✓"); setLoading(false); }} disabled={loading} style={{ ...S.btn, width:"100%", opacity:loading?0.5:1 }}>
                    {loading?"Saving...":"Save Pricing & Offers"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── ANALYTICS TAB ─── */}
        {tab==="analytics" && (
          <div style={{ maxWidth:700 }}>
            <div style={{ fontSize:16, fontWeight:800, color:TEXT, marginBottom:24 }}>📊 Platform Analytics</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:24 }}>
              {[
                { label:"Total Courses",      value:courses.length,                                  color:PINK    },
                { label:"Published",          value:courses.filter(c=>c.is_published).length,         color:GREEN   },
                { label:"Business Courses",   value:courses.filter(c=>c.course_type==="business").length, color:"#0284c7"},
                { label:"Individual Courses", value:courses.filter(c=>c.course_type==="individual").length, color:"#7c3aed"},
                { label:"Free Courses",       value:courses.filter(c=>c.is_free).length,              color:"#16a34a"},
                { label:"Monthly Exclusives", value:courses.filter(c=>c.is_exclusive).length,         color:"#d97706"},
              ].map(s=>(
                <div key={s.label} style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, padding:"16px 18px" }}>
                  <div style={{ fontSize:24, fontWeight:800, color:s.color }}>{s.value}</div>
                  <div style={{ fontSize:11, color:MUTED, marginTop:2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Course breakdown table */}
            <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, overflow:"hidden" }}>
              <div style={{ padding:"14px 18px", borderBottom:`1px solid ${BORDER}`, display:"grid", gridTemplateColumns:"1fr 80px 70px 70px 70px 60px", gap:12 }}>
                {["Course","Type","Level","Lessons","Status","Price"].map(h=>(
                  <div key={h} style={{ fontSize:10, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.06em" }}>{h}</div>
                ))}
              </div>
              {courses.slice(0,15).map(c=>(
                <div key={c.id} style={{ padding:"12px 18px", borderBottom:`1px solid #f3f4f6`, display:"grid", gridTemplateColumns:"1fr 80px 70px 70px 70px 60px", gap:12, alignItems:"center" }}>
                  <div style={{ fontSize:12, fontWeight:600, color:TEXT, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.title}</div>
                  <span style={{ fontSize:10, fontWeight:700, color:c.course_type==="business"?"#0284c7":PINK }}>{c.course_type}</span>
                  <span style={{ fontSize:11, color:MUTED }}>{c.level}</span>
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