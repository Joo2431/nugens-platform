import React, { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { supabase } from "./lib/supabase";
import Sidebar from "./components/Sidebar";

const AuthPage     = lazy(() => import("./pages/AuthPage"));
const Dashboard    = lazy(() => import("./pages/Dashboard"));
const CoursesPage  = lazy(() => import("./pages/Courses"));
const CoursePlayer = lazy(() => import("./pages/CoursePlayer"));
const LearningPaths = lazy(() => import("./pages/LearningPaths"));
const Certificates = lazy(() => import("./pages/Certificates"));
const Community    = lazy(() => import("./pages/Community"));
const AIAssistant  = lazy(() => import("./pages/AIAssistant"));

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#080814" }}>
      <div style={{ fontWeight: 800, fontSize: 22, color: "#7c3aed", letterSpacing: "-0.04em", fontStyle: "italic" }}>HyperX</div>
    </div>
  );
}

// Pages that use the full-screen layout (no sidebar)
const FULL_SCREEN_ROUTES = ["/auth", "/login", "/signup"];

function AppShell() {
  const location = useLocation();
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const isFullScreen = FULL_SCREEN_ROUTES.some(r => location.pathname.startsWith(r));
  const isCoursePlayer = location.pathname.match(/^\/courses\/.+/);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        supabase.from("profiles").select("*").eq("id", session.user.id).single()
          .then(({ data }) => { setProfile(data); setLoading(false); });
      } else {
        setLoading(false);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, sess) => {
      setSession(sess);
      if (sess) {
        supabase.from("profiles").select("*").eq("id", sess.user.id).single()
          .then(({ data }) => setProfile(data));
      } else {
        setProfile(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <Spinner />;

  // Auth pages — no sidebar
  if (isFullScreen) {
    return (
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route path="/auth"   element={<AuthPage />} />
          <Route path="/login"  element={<Navigate to="/auth" replace />} />
          <Route path="/signup" element={<Navigate to="/auth?mode=signup" replace />} />
        </Routes>
      </Suspense>
    );
  }

  // Not logged in — redirect to auth
  if (!session) return <Navigate to="/auth" replace />;

  // Course player gets full screen layout (with own back button)
  if (isCoursePlayer) {
    return (
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route path="/courses/:id" element={<CoursePlayer profile={profile} />} />
        </Routes>
      </Suspense>
    );
  }

  // Main app — sidebar layout
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#080814" }}>
      <Sidebar user={session.user} profile={profile} />
      <div style={{ flex: 1, minWidth: 0, overflowX: "hidden" }}>
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/"              element={<Dashboard profile={profile} />} />
            <Route path="/courses"       element={<CoursesPage profile={profile} />} />
            <Route path="/paths"         element={<LearningPaths profile={profile} />} />
            <Route path="/paths/:id"     element={<LearningPaths profile={profile} />} />
            <Route path="/certificates"  element={<Certificates profile={profile} />} />
            <Route path="/community"     element={<Community profile={profile} />} />
            <Route path="/assistant"     element={<AIAssistant profile={profile} />} />
            <Route path="*"              element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
