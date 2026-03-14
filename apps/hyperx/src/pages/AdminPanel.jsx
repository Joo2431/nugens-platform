import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

const PINK = "#e8185d";
const B    = "#1e1e1e";
const CATS = ["Communication","Career Strategy","Mindset","Interview Prep","Personal Brand","Leadership","Productivity","English for Work"];
const LEVELS = ["Beginner","Intermediate","Advanced"];

export default function AdminPanel() {
  const [tab,         setTab]         = useState("courses");
  const [courses,     setCourses]     = useState([]);
  const [selCourse,   setSelCourse]   = useState(null);
  const [lessons,     setLessons]     = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [msg,         setMsg]         = useState("");
  const [uploading,   setUploading]   = useState(false);
  const thumbRef = useRef();
  const videoRef = useRef();

  const [cf, setCf] = useState({ title:"",description:"",category:"Communication",level:"Beginner",is_free:false,is_published:false });
  const [lf, setLf] = useState({ title:"",description:"",duration_mins:0,sort_order:0,is_free:false });

  const notify = (m) => { setMsg(m); setTimeout(()=>setMsg(""),3000); };

  useEffect(() => {
    supabase.from("hx_courses").select("*").order("created_at",{ascending:false}).then(({data})=>setCourses(data||[]));
  }, []);

  const loadLessons = async (courseId) => {
    const { data } = await supabase.from("hx_lessons").select("*").eq("course_id",courseId).order("sort_order");
    setLessons(data||[]);
  };

  // Upload thumbnail to Supabase storage
  const uploadThumb = async (file) => {
    const ext  = file.name.split(".").pop();
    const path = `thumbnails/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("hx-videos").upload(path, file, { upsert:true });
    if (error) throw error;
    const { data } = supabase.storage.from("hx-videos").getPublicUrl(path);
    return data.publicUrl;
  };

  // Upload video to Supabase storage
  const uploadVideo = async (file, onProgress) => {
    const ext  = file.name.split(".").pop();
    const path = `videos/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("hx-videos").upload(path, file, {
      upsert: true,
      onUploadProgress: (p) => onProgress(Math.round(p.loaded/p.total*100)),
    });
    if (error) throw error;
    const { data } = supabase.storage.from("hx-videos").getPublicUrl(path);
    return data.publicUrl;
  };

  const createCourse = async () => {
    if (!cf.title.trim()) { notify("❌ Title required"); return; }
    setLoading(true);
    let thumbnail_url = null;
    if (thumbRef.current?.files?.[0]) {
      try { thumbnail_url = await uploadThumb(thumbRef.current.files[0]); }
      catch(e) { notify("❌ Thumbnail upload failed: "+e.message); setLoading(false); return; }
    }
    const { data, error } = await supabase.from("hx_courses").insert({ ...cf, thumbnail_url }).select().single();
    if (error) { notify("❌ "+error.message); }
    else { setCourses(p=>[data,...p]); setCf({title:"",description:"",category:"Communication",level:"Beginner",is_free:false,is_published:false}); notify("✅ Course created!"); }
    setLoading(false);
  };

  const togglePublish = async (course) => {
    const { data } = await supabase.from("hx_courses").update({is_published:!course.is_published}).eq("id",course.id).select().single();
    if (data) setCourses(p=>p.map(c=>c.id===data.id?data:c));
  };

  const deleteCourse = async (id) => {
    if (!confirm("Delete this course and all lessons?")) return;
    await supabase.from("hx_courses").delete().eq("id",id);
    setCourses(p=>p.filter(c=>c.id!==id));
    if (selCourse?.id===id) { setSelCourse(null); setLessons([]); }
    notify("✅ Deleted");
  };

  const addLesson = async () => {
    if (!selCourse) { notify("❌ Select a course first"); return; }
    if (!lf.title.trim()) { notify("❌ Lesson title required"); return; }
    setLoading(true);
    let video_url = null;
    if (videoRef.current?.files?.[0]) {
      setUploading(true);
      try {
        video_url = await uploadVideo(videoRef.current.files[0], (pct) => setMsg(`Uploading video… ${pct}%`));
        setUploading(false);
      } catch(e) { notify("❌ Video upload failed: "+e.message); setLoading(false); setUploading(false); return; }
    }
    const { data, error } = await supabase.from("hx_lessons").insert({...lf,course_id:selCourse.id,video_url}).select().single();
    if (error) { notify("❌ "+error.message); }
    else {
      setLessons(p=>[...p,data]);
      // Update course lesson count and duration
      await supabase.from("hx_courses").update({
        total_lessons: lessons.length+1,
        duration_mins: (lessons.reduce((a,l)=>a+l.duration_mins,0))+lf.duration_mins
      }).eq("id",selCourse.id);
      setLf({title:"",description:"",duration_mins:0,sort_order:lessons.length+1,is_free:false});
      notify("✅ Lesson added!");
    }
    setLoading(false);
  };

  const deleteLesson = async (id) => {
    await supabase.from("hx_lessons").delete().eq("id",id);
    setLessons(p=>p.filter(l=>l.id!==id));
    notify("✅ Lesson deleted");
  };

  const inp = {width:"100%",padding:"9px 12px",background:"#111",border:`1px solid ${B}`,borderRadius:8,color:"#fff",fontSize:13,fontFamily:"inherit",outline:"none"};
  const btn = (bg="#111",c="#aaa")=>({padding:"9px 18px",borderRadius:8,background:bg,border:`1px solid ${bg==="#111"?B:bg}`,color:c,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all 0.14s"});

  return (
    <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",padding:"28px",background:"#09090a",minHeight:"100vh",color:"#e8e8e8"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box}input:focus,textarea:focus,select:focus{border-color:${PINK}60!important;outline:none}`}</style>

      {/* Header */}
      <div style={{marginBottom:28}}>
        <h1 style={{fontWeight:800,fontSize:22,color:"#fff",letterSpacing:"-0.03em",marginBottom:4}}>⚙ Admin Panel</h1>
        <p style={{fontSize:13,color:"#555"}}>Manage HyperX courses and lessons</p>
      </div>

      {/* Msg toast */}
      {msg && <div style={{background:msg.startsWith("❌")?"#2d0a0a":"#0a2d0a",border:`1px solid ${msg.startsWith("❌")?"#4d1515":"#154d15"}`,borderRadius:9,padding:"10px 16px",marginBottom:16,fontSize:13,fontWeight:600,color:msg.startsWith("❌")?"#f87171":"#4ade80"}}>{msg}</div>}

      {/* Tabs */}
      <div style={{display:"flex",gap:8,marginBottom:24}}>
        {[["courses","Courses"],["lessons","Lessons"]].map(([id,lbl])=>(
          <button key={id} onClick={()=>setTab(id)} style={{...btn(tab===id?PINK:"#111",tab===id?"#fff":"#666"),border:`1px solid ${tab===id?PINK:B}`}}>{lbl}</button>
        ))}
      </div>

      {tab === "courses" && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1.4fr",gap:24,alignItems:"start"}}>
          {/* Create course form */}
          <div style={{background:"#111",border:`1px solid ${B}`,borderRadius:14,padding:24}}>
            <div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:18}}>Create New Course</div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div><label style={{fontSize:11.5,fontWeight:600,color:"#555",display:"block",marginBottom:4}}>Title *</label><input style={inp} value={cf.title} onChange={e=>setCf(p=>({...p,title:e.target.value}))} placeholder="Course title"/></div>
              <div><label style={{fontSize:11.5,fontWeight:600,color:"#555",display:"block",marginBottom:4}}>Description</label><textarea style={{...inp,height:72,resize:"vertical"}} value={cf.description} onChange={e=>setCf(p=>({...p,description:e.target.value}))} placeholder="What will students learn?"/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div><label style={{fontSize:11.5,fontWeight:600,color:"#555",display:"block",marginBottom:4}}>Category</label>
                  <select style={inp} value={cf.category} onChange={e=>setCf(p=>({...p,category:e.target.value}))}>
                    {CATS.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><label style={{fontSize:11.5,fontWeight:600,color:"#555",display:"block",marginBottom:4}}>Level</label>
                  <select style={inp} value={cf.level} onChange={e=>setCf(p=>({...p,level:e.target.value}))}>
                    {LEVELS.map(l=><option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div><label style={{fontSize:11.5,fontWeight:600,color:"#555",display:"block",marginBottom:4}}>Thumbnail Image</label><input ref={thumbRef} type="file" accept="image/*" style={{...inp,padding:"7px 12px",cursor:"pointer"}}/></div>
              <div style={{display:"flex",gap:16}}>
                <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:13,color:"#aaa"}}>
                  <input type="checkbox" checked={cf.is_free} onChange={e=>setCf(p=>({...p,is_free:e.target.checked}))} style={{accentColor:PINK}}/>Free course
                </label>
                <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:13,color:"#aaa"}}>
                  <input type="checkbox" checked={cf.is_published} onChange={e=>setCf(p=>({...p,is_published:e.target.checked}))} style={{accentColor:PINK}}/>Publish now
                </label>
              </div>
              <button onClick={createCourse} disabled={loading} style={{...btn(PINK,"#fff"),marginTop:4}}>{loading?"Creating…":"Create Course"}</button>
            </div>
          </div>

          {/* Course list */}
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"#444",marginBottom:4}}>{courses.length} Courses</div>
            {courses.length===0 && <div style={{background:"#111",border:`1px solid ${B}`,borderRadius:12,padding:24,textAlign:"center",color:"#444",fontSize:13}}>No courses yet. Create one!</div>}
            {courses.map(c=>(
              <div key={c.id} style={{background:"#111",border:`1px solid ${selCourse?.id===c.id?PINK+"40":B}`,borderRadius:12,padding:"14px 16px",display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}
                onClick={()=>{setSelCourse(c);loadLessons(c.id);setTab("lessons");}}>
                {c.thumbnail_url && <img src={c.thumbnail_url} style={{width:48,height:48,borderRadius:8,objectFit:"cover",flexShrink:0}} alt=""/>}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13.5,fontWeight:700,color:"#e8e8e8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.title}</div>
                  <div style={{fontSize:11.5,color:"#555",marginTop:2}}>{c.category} · {c.total_lessons} lessons · {c.level}</div>
                </div>
                <div style={{display:"flex",gap:6,flexShrink:0}}>
                  <button onClick={e=>{e.stopPropagation();togglePublish(c)}} style={{...btn(c.is_published?"#16a34a18":"#1a1a1a",c.is_published?"#4ade80":"#666"),padding:"4px 10px",fontSize:11,border:`1px solid ${c.is_published?"#16a34a30":B}`}}>{c.is_published?"Live":"Draft"}</button>
                  <button onClick={e=>{e.stopPropagation();deleteCourse(c.id)}} style={{...btn("#2d0a0a","#f87171"),padding:"4px 10px",fontSize:11,border:"1px solid #4d1515"}}>Del</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "lessons" && (
        <div>
          {!selCourse ? (
            <div style={{background:"#111",border:`1px solid ${B}`,borderRadius:12,padding:40,textAlign:"center"}}>
              <div style={{fontSize:22,marginBottom:10}}>◎</div>
              <div style={{fontSize:14,fontWeight:600,color:"#666"}}>Select a course first</div>
              <button onClick={()=>setTab("courses")} style={{...btn(PINK,"#fff"),marginTop:14}}>← Go to Courses</button>
            </div>
          ) : (
            <div style={{display:"grid",gridTemplateColumns:"1fr 1.4fr",gap:24,alignItems:"start"}}>
              {/* Add lesson form */}
              <div style={{background:"#111",border:`1px solid ${B}`,borderRadius:14,padding:24}}>
                <div style={{fontSize:13,fontWeight:600,color:"#555",marginBottom:4}}>Adding to:</div>
                <div style={{fontSize:15,fontWeight:800,color:"#fff",marginBottom:18}}>{selCourse.title}</div>
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  <div><label style={{fontSize:11.5,fontWeight:600,color:"#555",display:"block",marginBottom:4}}>Lesson Title *</label><input style={inp} value={lf.title} onChange={e=>setLf(p=>({...p,title:e.target.value}))} placeholder="Lesson title"/></div>
                  <div><label style={{fontSize:11.5,fontWeight:600,color:"#555",display:"block",marginBottom:4}}>Description</label><textarea style={{...inp,height:60,resize:"vertical"}} value={lf.description} onChange={e=>setLf(p=>({...p,description:e.target.value}))} placeholder="Optional description"/></div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <div><label style={{fontSize:11.5,fontWeight:600,color:"#555",display:"block",marginBottom:4}}>Duration (mins)</label><input type="number" style={inp} value={lf.duration_mins} onChange={e=>setLf(p=>({...p,duration_mins:+e.target.value}))}/></div>
                    <div><label style={{fontSize:11.5,fontWeight:600,color:"#555",display:"block",marginBottom:4}}>Order</label><input type="number" style={inp} value={lf.sort_order} onChange={e=>setLf(p=>({...p,sort_order:+e.target.value}))}/></div>
                  </div>
                  <div>
                    <label style={{fontSize:11.5,fontWeight:600,color:"#555",display:"block",marginBottom:4}}>Video File</label>
                    <input ref={videoRef} type="file" accept="video/*" style={{...inp,padding:"7px 12px",cursor:"pointer"}}/>
                    <div style={{fontSize:11,color:"#444",marginTop:4}}>MP4, MOV, WebM supported. Uploads to Supabase storage.</div>
                  </div>
                  <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:13,color:"#aaa"}}>
                    <input type="checkbox" checked={lf.is_free} onChange={e=>setLf(p=>({...p,is_free:e.target.checked}))} style={{accentColor:PINK}}/>Free lesson (accessible to all)
                  </label>
                  <button onClick={addLesson} disabled={loading||uploading} style={{...btn(PINK,"#fff"),marginTop:4}}>{uploading?msg||"Uploading…":loading?"Saving…":"Add Lesson"}</button>
                </div>
              </div>

              {/* Lesson list */}
              <div>
                <div style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"#444",marginBottom:12}}>{lessons.length} Lessons</div>
                {lessons.length===0 && <div style={{background:"#111",border:`1px solid ${B}`,borderRadius:12,padding:24,textAlign:"center",color:"#444",fontSize:13}}>No lessons yet. Add the first one!</div>}
                {lessons.map((l,i)=>(
                  <div key={l.id} style={{background:"#111",border:`1px solid ${B}`,borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
                    <div style={{width:28,height:28,borderRadius:7,background:`${PINK}15`,border:`1px solid ${PINK}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:PINK,flexShrink:0}}>{i+1}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:"#e8e8e8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.title}</div>
                      <div style={{fontSize:11.5,color:"#555",marginTop:1}}>{l.duration_mins}m {l.is_free&&<span style={{color:"#16a34a",fontWeight:600,marginLeft:4}}>FREE</span>} {l.video_url&&<span style={{color:PINK,marginLeft:4}}>• Video ✓</span>}</div>
                    </div>
                    <button onClick={()=>deleteLesson(l.id)} style={{...btn("#2d0a0a","#f87171"),padding:"4px 10px",fontSize:11,border:"1px solid #4d1515",flexShrink:0}}>Del</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
