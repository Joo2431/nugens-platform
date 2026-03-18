import React, { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { supabase }      from "./lib/supabase";
import Sidebar           from "./components/Sidebar";
import ProtectedRoute    from "./components/ProtectedRoute";
import GenEMiniPopup     from "./components/GenEMiniPopup";

const Dashboard    = lazy(() => import("./pages/Dashboard"));
const CoursesPage  = lazy(() => import("./pages/Courses"));
const CoursePlayer = lazy(() => import("./pages/CoursePlayer"));
const Certificates = lazy(() => import("./pages/Certificates"));
const Pricing      = lazy(() => import("./pages/Pricing"));
const AdminPanel   = lazy(() => import("./pages/AdminPanel"));

const PINK = "#e8185d";

// Says "HyperX" — never "NuGens"
function Spinner() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
      height:"100vh", background:"#ffffff", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontWeight:800, fontSize:26, color:PINK, letterSpacing:"-0.04em", marginBottom:8 }}>
          Hyper<span style={{color:"#111"}}>X</span>
        </div>
        <div style={{ width:32, height:3, background:PINK, borderRadius:2, margin:"0 auto", opacity:0.3 }}/>
      </div>
    </div>
  );
}

function AppShell() {
  const location = useLocation();
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [ready,   setReady]   = useState(false);
  const isCoursePlayer = location.pathname.match(/^\/courses\/.+/);

  useEffect(() => {
    let settled = false;

    // Hard 5-second timeout — app always renders regardless of auth timing
    const hardTimeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        console.warn("HyperX: forced ready (timeout)");
        setReady(true);
      }
    }, 5000);

    function finish(usr, prof) {
      if (settled) return;
      settled = true;
      clearTimeout(hardTimeout);
      setUser(usr ?? null);
      setProfile(prof ?? null);
      setReady(true);
    }

    async function init() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session?.user) { finish(null, null); return; }

        // Race profile fetch vs 4-second timeout
        const prof = await Promise.race([
          supabase.from("profiles").select("*")
            .eq("id", session.user.id).single()
            .then(({ data }) => data || null)
            .catch(() => null),
          new Promise(r => setTimeout(() => r(null), 4000)),
        ]);
        finish(session.user, prof);
      } catch (err) {
        console.error("HyperX init:", err.message);
        finish(null, null);
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, session) => {
      if (session?.user) {
        const { data: prof } = await supabase
          .from("profiles").select("*").eq("id", session.user.id).single()
          .catch(() => ({ data: null }));
        setUser(session.user);
        setProfile(prof || null);
        if (!settled) finish(session.user, prof);
      } else {
        setUser(null); setProfile(null);
        if (!settled) finish(null, null);
      }
    });

    init();
    return () => { clearTimeout(hardTimeout); subscription.unsubscribe(); };
  }, []);

  if (!ready) return <Spinner />;

  if (isCoursePlayer) return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/courses/:id" element={<ProtectedRoute><CoursePlayer profile={profile} /></ProtectedRoute>} />
      </Routes>
    </Suspense>
  );

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#f8f9fb" }}>
      {user && <Sidebar profile={profile} />}
      <div style={{ flex:1, minWidth:0, overflowX:"hidden" }}>
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/"        element={<ProtectedRoute><Dashboard    profile={profile} /></ProtectedRoute>} />
            <Route path="/courses" element={<ProtectedRoute><CoursesPage  profile={profile} /></ProtectedRoute>} />
            <Route path="/certs"   element={<ProtectedRoute><Certificates profile={profile} /></ProtectedRoute>} />
            <Route path="/pricing" element={<Pricing profile={profile} />} />
            <Route path="/admin"   element={<ProtectedRoute><AdminPanel   profile={profile} /></ProtectedRoute>} />
            <Route path="*"        element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
      {user && <GenEMiniPopup product="hyperx" />}
    </div>
  );
}

export default function App() {
  return <BrowserRouter><AppShell /></BrowserRouter>;
}