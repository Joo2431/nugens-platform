import React, { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { supabase } from "./lib/supabase";
import Sidebar        from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import GenEMiniPopup  from "./components/GenEMiniPopup";
import AuthPage       from "./pages/AuthPage";

const Dashboard    = lazy(() => import("./pages/Dashboard"));
const CoursesPage  = lazy(() => import("./pages/Courses"));
const CoursePlayer = lazy(() => import("./pages/CoursePlayer"));
const Certificates = lazy(() => import("./pages/Certificates"));
const Pricing      = lazy(() => import("./pages/Pricing"));
const AdminPanel   = lazy(() => import("./pages/AdminPanel"));

const PINK = "#e8185d";
const ADMIN_EMAILS = ["jeromjoseph31@gmail.com", "jeromjoshep.23@gmail.com"];

function Spinner() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
      height:"100vh", background:"#fff", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontWeight:800, fontSize:26, color:PINK, letterSpacing:"-0.04em", marginBottom:8 }}>
          Hyper<span style={{ color:"#111" }}>X</span>
        </div>
        <div style={{ width:32, height:3, background:PINK, borderRadius:2, margin:"0 auto", opacity:0.3 }}/>
      </div>
    </div>
  );
}

function profileFromAuth(authUser) {
  const meta  = authUser?.user_metadata || {};
  const email = (authUser?.email || "").toLowerCase().trim();
  return {
    id:        authUser.id,
    email,
    full_name: meta.full_name || meta.name || email.split("@")[0] || "",
    plan:      ADMIN_EMAILS.includes(email) ? "admin" : "free",
    user_type: "individual",
  };
}

function AppShell() {
  const location = useLocation();
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [ready,   setReady]   = useState(false);
  const isCoursePlayer = location.pathname.match(/^\/courses\/.+/);

  const fetchProfile = async (uid, authUser) => {
    try {
      const { data } = await supabase.from("profiles").select("*")
        .eq("id", uid).maybeSingle();
      const meta = authUser?.user_metadata || {};
      const name = data?.full_name?.trim()
        || meta.full_name || meta.name
        || authUser?.email?.split("@")[0] || "";
      setProfile(data ? { ...data, full_name: name } : profileFromAuth(authUser));
    } catch(e) {
      console.error("[HyperX] fetchProfile:", e.message);
      setProfile(profileFromAuth(authUser));
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setReady(true);
      if (session?.user) fetchProfile(session.user.id, session.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id, session.user);
      else setProfile(null);
    });

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
      <Sidebar profile={profile} user={user} />
      <div style={{ flex:1, minWidth:0, overflowX:"hidden" }}>
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/auth"    element={<AuthPage />} />
            <Route path="/"        element={<ProtectedRoute><Dashboard    profile={profile} user={user} /></ProtectedRoute>} />
            <Route path="/courses" element={<ProtectedRoute><CoursesPage  profile={profile} user={user} /></ProtectedRoute>} />
            <Route path="/certs"   element={<ProtectedRoute><Certificates profile={profile} user={user} /></ProtectedRoute>} />
            <Route path="/pricing" element={<Pricing profile={profile} />} />
            <Route path="/admin"   element={<ProtectedRoute><AdminPanel   profile={profile} user={user} /></ProtectedRoute>} />
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