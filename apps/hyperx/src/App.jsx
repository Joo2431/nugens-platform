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

function Spinner() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#fff" }}>
      <div style={{ fontWeight:800, fontSize:22, color:PINK, fontFamily:"'Plus Jakarta Sans',sans-serif", letterSpacing:"-0.04em" }}>
        Hyper<span style={{color:"#111"}}>X</span>
      </div>
    </div>
  );
}

async function fetchProfile(userId) {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data || null;
}

function AppShell() {
  const location       = useLocation();
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [ready,   setReady]   = useState(false);
  const isCoursePlayer = location.pathname.match(/^\/courses\/.+/);

  useEffect(() => {
    let finished = false;

    async function init() {
      // KEY FIX: wait for BOTH session AND profile before setting ready=true.
      // The old code did setReady(true) immediately after getSession(), before
      // the profile query finished. So AdminPanel always got profile=null.
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        const p = await fetchProfile(session.user.id);
        if (!finished) setProfile(p);
      }

      if (!finished) {
        finished = true;
        setReady(true);
      }
    }

    init();

    // Also subscribe so logout/token-refresh updates state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          const p = await fetchProfile(session.user.id);
          setProfile(p);
          if (!finished) { finished = true; setReady(true); }
        } else {
          setProfile(null);
          if (!finished) { finished = true; setReady(true); }
        }
      }
    );

    return () => subscription.unsubscribe();
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