import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

const PINK = "#e8185d";
const B    = "#1e1e1e";
const LEVEL_COLOR = { Beginner:"#16a34a", Intermediate:"#d97706", Advanced:PINK };

const getCatColor = (cat) => {
  const map = { Communication:PINK,"Career Strategy":"#0284c7",Mindset:"#7c3aed","Interview Prep":"#d97706","Personal Brand":"#16a34a",Leadership:"#8b5cf6",Productivity:"#06b6d4" };
  return map[cat] || PINK;
};

export default function CoursesPage({ profile }) {
  const [courses,  setCourses]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [cats,     setCats]     = useState(["All"]);
  const [activeTag,setActiveTag]= useState("All");
  const [search,   setSearch]   = useState("");
  const plan = profile?.plan || "free";

  useEffect(() => {
    supabase.from("hx_courses").select("*").eq("is_published", true).order("created_at", { ascending: false })
      .then(({ data }) => {
        const c = data || [];
        setCourses(c);
        const unique = ["All", ...new Set(c.map(x => x.category))];
        setCats(unique);
        setLoading(false);
      });
  }, []);

  const filtered = courses.filter(c => {
    const matchTag    = activeTag === "All" || c.category === activeTag;
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase());
    return matchTag && matchSearch;
  });

  return (
    <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",padding:"32px 28px 80px",background:"#09090a",minHeight:"100vh"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box}
        .hx-card{background:#111;border:1px solid ${B};border-radius:12px;padding:20px;transition:all 0.18s;text-decoration:none;display:block;position:relative}
        .hx-card:hover{border-color:#333;transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,0.4)}
        .hx-tag{display:inline-block;padding:2px 9px;border-radius:5px;font-size:10.5px;font-weight:700;letter-spacing:0.04em}
        .cat-pill{padding:6px 14px;border-radius:7px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid ${B};background:transparent;color:#555;transition:all 0.13s;white-space:nowrap;font-family:'Plus Jakarta Sans',sans-serif}
        .cat-pill.on,.cat-pill:hover{background:${PINK}15;color:#fff;border-color:${PINK}40}
        .search-in{width:100%;padding:10px 16px;background:#111;border:1px solid ${B};border-radius:10px;color:#fff;font-size:13.5px;font-family:inherit;outline:none}
        .search-in:focus{border-color:${PINK}60}
        @media(max-width:700px){.grid3{grid-template-columns:1fr!important}}
      `}</style>

      <div style={{marginBottom:28}}>
        <h1 style={{fontWeight:800,fontSize:"clamp(20px,2.5vw,26px)",letterSpacing:"-0.03em",color:"#fff",marginBottom:4}}>Course Library</h1>
        <p style={{fontSize:13.5,color:"#555"}}>{courses.length} courses — real skills, no fluff.</p>
      </div>

      <input className="search-in" placeholder="🔍  Search courses…" value={search} onChange={e=>setSearch(e.target.value)} style={{marginBottom:16}}/>

      <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:24}}>
        {cats.map(cat=>(
          <button key={cat} className={`cat-pill${activeTag===cat?" on":""}`} onClick={()=>setActiveTag(cat)}>{cat}</button>
        ))}
      </div>

      {plan === "free" && (
        <div style={{background:`${PINK}10`,border:`1px solid ${PINK}30`,borderRadius:12,padding:"16px 20px",marginBottom:24,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
          <div>
            <div style={{fontSize:13.5,fontWeight:700,color:"#fff",marginBottom:2}}>Unlock all {courses.length} courses</div>
            <div style={{fontSize:12.5,color:"#666"}}>Free plan includes 3 courses. Upgrade for the full library + certificates.</div>
          </div>
          <Link to="/pricing" style={{padding:"8px 18px",borderRadius:8,background:PINK,color:"#fff",fontSize:12.5,fontWeight:700,textDecoration:"none"}}>Upgrade →</Link>
        </div>
      )}

      {loading ? (
        <div style={{textAlign:"center",padding:"80px 0",color:"#444"}}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{textAlign:"center",padding:"80px 0"}}>
          <div style={{fontSize:28,marginBottom:12}}>◎</div>
          <div style={{fontSize:15,fontWeight:600,color:"#666"}}>No courses found</div>
          <div style={{fontSize:12.5,color:"#444",marginTop:4}}>Try a different search or category</div>
        </div>
      ) : (
        <div className="grid3" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
          {filtered.map(c=>{
            const locked = plan==="free" && !c.is_free;
            return (
              <Link key={c.id} to={locked?"/pricing":`/courses/${c.id}`} className="hx-card" style={{opacity:locked?0.65:1}}>
                {locked && <div style={{position:"absolute",top:12,right:12,background:"#1a1a1a",border:`1px solid ${B}`,borderRadius:5,padding:"2px 8px",fontSize:10,fontWeight:600,color:"#555"}}>🔒 Pro</div>}
                {c.is_free && !locked && <div style={{position:"absolute",top:12,right:12,background:"#16a34a18",border:"1px solid #16a34a30",borderRadius:5,padding:"2px 8px",fontSize:10,fontWeight:600,color:"#16a34a"}}>FREE</div>}
                {c.thumbnail_url
                  ? <img src={c.thumbnail_url} style={{width:"100%",height:130,objectFit:"cover",borderRadius:9,marginBottom:14}} alt={c.title}/>
                  : <div style={{width:"100%",height:100,borderRadius:9,background:`${getCatColor(c.category)}15`,border:`1px solid ${getCatColor(c.category)}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,marginBottom:14}}>▶</div>
                }
                <span className="hx-tag" style={{background:getCatColor(c.category)+"20",color:getCatColor(c.category),marginBottom:10}}>{c.category}</span>
                <div style={{fontSize:14.5,fontWeight:700,color:"#fff",lineHeight:1.4,marginBottom:10,marginTop:6}}>{c.title}</div>
                <div style={{display:"flex",gap:10,fontSize:12,color:"#555",flexWrap:"wrap"}}>
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
  );
}
