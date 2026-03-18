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

const ADMIN_EMAILS = ["jeromjoseph31@gmail.com", "jeromjoshep.23@gmail.com"];

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

// ── CRITICAL FIX ─────────────────────────────────────────────────────────────
// Problem: fetchProfile tries UPDATE profiles SET id=authId WHERE email=...
// This fails silently due to Supabase RLS — anon key can't update rows it doesn't own.
// Fix: Query by email, return profile AS-IS without modifying DB.
// The admin check uses email directly, so plan column doesn't matter for access.
async function fetchProfile(userId, userEmail) {
  try {
    // 1. Try by auth user ID (works if IDs already match)
    const { data: byId } = await supabase
      .from("profiles").select("*").eq("id", userId).maybeSingle();
    if (byId) return byId;

    // 2. Try by email (handles OAuth UUID mismatch)
    if (!userEmail) return null;
    const { data: byEmail } = await supabase
      .from("profiles").select("*").eq("email", userEmail).maybeSingle();

    // Return as-is — do NOT try to UPDATE the id (RLS blocks this)
    // Admin check uses email, so plan value from this row is also correct
    return byEmail || null;
  } catch (e) {
    console.error("fetchProfile error:", e.message);
    return null;
  }
}

// Build a minimal profile from auth metadata when DB row doesn't exist
function profileFromAuth(authUser) {
  const email = (authUser.email || "").toLowerCase().trim();
  return {
    id:        authUser.id,
    email,
    full_name: authUser.user_metadata?.full_name
               || authUser.user_metadata?.name
               || email.split("@")[0]
               || "User",
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

  useEffect(() => {
    let settled = false;

    // 6s hard timeout — app ALWAYS renders
    const hardTimeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        console.warn("HyperX: forced ready after timeout");
        setReady(true);
      }
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
        // getUser() = server-verified JWT, most reliable method
        const { data: { user: authUser }, error } = await supabase.auth.getUser();

        if (authUser && !error) {
          // Race profile fetch against 4s timeout
          const prof = await Promise.race([
            fetchProfile(authUser.id, authUser.email),
            new Promise(r => setTimeout(() => r(null), 4000)),
          ]);
          // If DB has no row, build one from Google OAuth metadata
          finish(authUser, prof || profileFromAuth(authUser));
          return;
        }

        // Fallback: getSession
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const prof = await Promise.race([
            fetchProfile(session.user.id, session.user.email),
            new Promise(r => setTimeout(() => r(null), 4000)),
          ]);
          finish(session.user, prof || profileFromAuth(session.user));
          return;
        }

        finish(null, null);
      } catch (e) {
        console.error("HyperX init:", e.message);
        finish(null, null);
      }
    }

    // onAuthStateChange fires even when getUser is slow
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const prof = await fetchProfile(session.user.id, session.user.email);
          const finalProf = prof || profileFromAuth(session.user);
          setUser(session.user);
          setProfile(finalProf);
          if (!settled) finish(session.user, finalProf);
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