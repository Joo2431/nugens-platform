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

// Fetch profile by ID, with email fallback for OAuth ID mismatches
async function fetchProfile(userId, userEmail) {
  try {
    // Try by ID first
    const { data: byId } = await supabase
      .from("profiles").select("*").eq("id", userId).maybeSingle();
    if (byId) return byId;

    // Fallback: try by email (OAuth can create mismatched IDs)
    if (userEmail) {
      const { data: byEmail } = await supabase
        .from("profiles").select("*").eq("email", userEmail).maybeSingle();
      if (byEmail) {
        // Fix the ID so future queries work
        await supabase.from("profiles").update({ id: userId }).eq("email", userEmail);
        return { ...byEmail, id: userId };
      }
    }
    return null;
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

    // CRITICAL: 5s hard timeout — prevents infinite spinner on Cloudflare cold start
    const hardTimeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        console.warn("HyperX: forced ready after 5s timeout");
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

        // Race profile fetch vs 4s timeout
        const prof = await Promise.race([
          fetchProfile(session.user.id, session.user.email),
          new Promise(r => setTimeout(() => r(null), 4000)),
        ]);
        finish(session.user, prof);
      } catch (err) {
        console.error("HyperX init error:", err.message);
        finish(null, null);
      }
    }

    // onAuthStateChange fires reliably even when getSession() hangs
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

  // Course player — fullscreen, no sidebar
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
      {/* Sidebar always renders when ready — even if profile is null (shows defaults) */}
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