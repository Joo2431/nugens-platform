import React, { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { supabase } from "./lib/supabase";
import Sidebar        from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import GenEMiniPopup  from "./components/GenEMiniPopup";

const Dashboard    = lazy(() => import("./pages/Dashboard"));
const CoursesPage  = lazy(() => import("./pages/Courses"));
const CoursePlayer = lazy(() => import("./pages/CoursePlayer"));
const Certificates = lazy(() => import("./pages/Certificates"));
const Pricing      = lazy(() => import("./pages/Pricing"));
const AdminPanel   = lazy(() => import("./pages/AdminPanel"));

const PINK = "#e8185d";

function Spinner() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
      height:"100vh", background:"#fff", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontWeight:800, fontSize:26, color:PINK, letterSpacing:"-0.04em", marginBottom:8 }}>
          Hyper<span style={{color:"#111"}}>X</span>
        </div>
        <div style={{ width:32, height:3, background:PINK, borderRadius:2, margin:"0 auto", opacity:0.3 }}/>
      </div>
    </div>
  );
}

// Fetch profile by ID then email fallback — handles OAuth UUID mismatch
async function fetchProfile(userId, userEmail) {
  try {
    const { data: byId } = await supabase
      .from("profiles").select("*").eq("id", userId).maybeSingle();
    if (byId) return byId;

    if (!userEmail) return null;
    const { data: byEmail } = await supabase
      .from("profiles").select("*").eq("email", userEmail).maybeSingle();
    if (!byEmail) return null;

    // Fix ID mismatch silently so future queries work by ID
    await supabase.from("profiles").update({ id: userId }).eq("email", userEmail).catch(() => {});
    return { ...byEmail, id: userId };
  } catch { return null; }
}

function AppShell() {
  const location = useLocation();
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [ready,   setReady]   = useState(false);
  const isCoursePlayer = location.pathname.match(/^\/courses\/.+/);

  useEffect(() => {
    let settled = false;

    // Hard 6s timeout — app ALWAYS renders, never stays on spinner
    const hardTimeout = setTimeout(() => {
      if (!settled) { settled = true; setReady(true); }
    }, 6000);

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
        // Method 1: getUser() — server-verified JWT, never returns stale cookie
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const prof = await Promise.race([
            fetchProfile(authUser.id, authUser.email),
            new Promise(r => setTimeout(() => r(null), 4000)),
          ]);
          finish(authUser, prof);
          return;
        }

        // Method 2: getSession() fallback
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const prof = await Promise.race([
            fetchProfile(session.user.id, session.user.email),
            new Promise(r => setTimeout(() => r(null), 4000)),
          ]);
          finish(session.user, prof);
          return;
        }

        finish(null, null);
      } catch { finish(null, null); }
    }

    // onAuthStateChange fires even when getUser/getSession hangs
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const prof = await fetchProfile(session.user.id, session.user.email);
          setUser(session.user);
          setProfile(prof ?? null);
          if (!settled) finish(session.user, prof);
        } else {
          setUser(null); setProfile(null);
          if (!settled) finish(null, null);
        }
      }
    );

    init();
    return () => { clearTimeout(hardTimeout); subscription.unsubscribe(); };
  }, []);

  if (!ready) return <Spinner />;

  if (isCoursePlayer) return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/courses/:id"
          element={<ProtectedRoute><CoursePlayer profile={profile} /></ProtectedRoute>} />
      </Routes>
    </Suspense>
  );

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#f8f9fb" }}>
      <Sidebar profile={profile} />
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
      <GenEMiniPopup product="hyperx" />
    </div>
  );
}

export default function App() {
  return <BrowserRouter><AppShell /></BrowserRouter>;
}