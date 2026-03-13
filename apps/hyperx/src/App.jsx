import React, { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { supabase } from "./lib/supabase";
import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";

const AuthPage      = lazy(() => import("./pages/AuthPage"));
const Dashboard     = lazy(() => import("./pages/Dashboard"));
const CoursesPage   = lazy(() => import("./pages/Courses"));
const CoursePlayer  = lazy(() => import("./pages/CoursePlayer"));
const LearningPaths = lazy(() => import("./pages/LearningPaths"));
const Certificates  = lazy(() => import("./pages/Certificates"));
const Community     = lazy(() => import("./pages/Community"));
const AIAssistant   = lazy(() => import("./pages/AIAssistant"));

function Spinner() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#080814" }}>
      <div style={{ fontWeight:800, fontSize:22, color:"#7c3aed", letterSpacing:"-0.04em" }}>HyperX</div>
    </div>
  );
}

const FULL_SCREEN = ["/auth", "/login", "/signup"];

function AppShell({ user, profile }) {
  const location = useLocation();
  const isFullScreen = FULL_SCREEN.some(r => location.pathname.startsWith(r));
  const isCoursePlayer = location.pathname.match(/^\/courses\/.+/);

  if (isFullScreen) return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/auth"   element={<AuthPage />} />
        <Route path="/login"  element={<Navigate to="/auth" replace />} />
        <Route path="/signup" element={<Navigate to="/auth?mode=signup" replace />} />
      </Routes>
    </Suspense>
  );

  if (isCoursePlayer) return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/courses/:id" element={<ProtectedRoute><CoursePlayer profile={profile} /></ProtectedRoute>} />
      </Routes>
    </Suspense>
  );

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#080814" }}>
      {user && <Sidebar user={user} profile={profile} />}
      <div style={{ flex:1, minWidth:0, overflowX:"hidden" }}>
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/"             element={<ProtectedRoute><Dashboard profile={profile} /></ProtectedRoute>} />
            <Route path="/courses"      element={<ProtectedRoute><CoursesPage profile={profile} /></ProtectedRoute>} />
            <Route path="/paths"        element={<ProtectedRoute><LearningPaths profile={profile} /></ProtectedRoute>} />
            <Route path="/paths/:id"    element={<ProtectedRoute><LearningPaths profile={profile} /></ProtectedRoute>} />
            <Route path="/certificates" element={<ProtectedRoute><Certificates profile={profile} /></ProtectedRoute>} />
            <Route path="/community"    element={<ProtectedRoute><Community profile={profile} /></ProtectedRoute>} />
            <Route path="/assistant"    element={<ProtectedRoute><AIAssistant profile={profile} /></ProtectedRoute>} />
            <Route path="*"             element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}

export default function App() {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [ready,   setReady]   = useState(false);

  const fetchProfile = async (uid) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
    setProfile(data ?? null);
  };

  useEffect(() => {
    // Set ready IMMEDIATELY — don't block on fetchProfile
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setReady(true);
      if (session?.user) fetchProfile(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!ready) return <Spinner />;

  return <BrowserRouter><AppShell user={user} profile={profile} /></BrowserRouter>;
}
