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

function AppShell() {
  const location       = useLocation();
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [ready,   setReady]   = useState(false);
  const isCoursePlayer = location.pathname.match(/^\/courses\/.+/);

  useEffect(() => {
    let settled = false;

    // Safety net: if nothing resolves in 6 seconds, force-show the app.
    // This prevents an infinite spinner if getSession() hangs.
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        console.warn("HyperX: auth timeout — forcing ready");
        setReady(true);
      }
    }, 6000);

    function finish(usr, prof) {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      setUser(usr);
      setProfile(prof);
      setReady(true);
    }

    async function init() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("getSession error:", error.message);
          finish(null, null);
          return;
        }

        if (!session?.user) {
          finish(null, null);
          return;
        }

        // We have a session — now fetch the profile
        try {
          const { data: prof } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();
          finish(session.user, prof || null);
        } catch (profileErr) {
          console.warn("Profile fetch failed:", profileErr.message);
          // Still finish — user is authenticated, profile just unavailable
          finish(session.user, null);
        }
      } catch (err) {
        console.error("Auth init error:", err.message);
        finish(null, null);
      }
    }

    // Also subscribe to auth state changes (handles token refresh, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          // Update profile on session change
          try {
            const { data: prof } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .single();
            setUser(session.user);
            setProfile(prof || null);
          } catch {
            setUser(session.user);
          }
          // If init() hasn't finished yet, this counts as finishing
          if (!settled) finish(session.user, null);
        } else {
          setUser(null);
          setProfile(null);
          if (!settled) finish(null, null);
        }
      }
    );

    init();

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
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