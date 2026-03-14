import React, { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { supabase } from "./lib/supabase";
import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";

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
      <div style={{ fontWeight:800, fontSize:22, color:"#7c3aed" }}>HyperX</div>
    </div>
  );
}

function AppShell() {
  const location = useLocation();
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const isCoursePlayer = location.pathname.match(/^\/courses\/.+/);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) supabase.from("profiles").select("*").eq("id", session.user.id).single().then(({ data }) => setProfile(data));
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) supabase.from("profiles").select("*").eq("id", session.user.id).single().then(({ data }) => setProfile(data));
      else setProfile(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (isCoursePlayer) return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/courses/:id" element={<ProtectedRoute><CoursePlayer profile={profile} /></ProtectedRoute>} />
      </Routes>
    </Suspense>
  );

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#080814" }}>
      {user && <Sidebar />}
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
  return <BrowserRouter><AppShell /></BrowserRouter>;
}
