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

async function fetchProfile(userId, userEmail) {
  try {
    const { data: byId, error: idErr } = await supabase
      .from("profiles").select("*").eq("id", userId).maybeSingle();
    if (idErr) console.error("[HyperX] fetchProfile by ID:", idErr.message);
    if (byId) return byId;

    if (!userEmail) return null;
    const { data: byEmail, error: emailErr } = await supabase
      .from("profiles").select("*").eq("email", userEmail).maybeSingle();
    if (emailErr) console.error("[HyperX] fetchProfile by email:", emailErr.message);
    return byEmail || null;
  } catch(e) {
    console.error("[HyperX] fetchProfile error:", e.message);
    return null;
  }
}

/** Enrich a profile row with auth metadata when full_name is missing */
function enrichProfile(prof, authUser) {
  if (!prof || prof.full_name) return prof;
  const meta = authUser?.user_metadata;
  const name = meta?.full_name || meta?.name || authUser?.email?.split("@")[0] || "";
  return name ? { ...prof, full_name: name } : prof;
}

function profileFromAuth(authUser) {
  const email = (authUser.email || "").toLowerCase().trim();
  return {
    id: authUser.id, email,
    full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || email.split("@")[0] || "User",
    plan: ADMIN_EMAILS.includes(email) ? "admin" : "free",
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
        const { data: { user: authUser }, error } = await supabase.auth.getUser();
        if (authUser && !error) {
          const prof = await Promise.race([
            fetchProfile(authUser.id, authUser.email),
            new Promise(r => setTimeout(() => r(null), 4000)),
          ]);
          finish(authUser, enrichProfile(prof, authUser) || profileFromAuth(authUser));
          return;
        }
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const prof = await Promise.race([
            fetchProfile(session.user.id, session.user.email),
            new Promise(r => setTimeout(() => r(null), 4000)),
          ]);
          finish(session.user, enrichProfile(prof, session.user) || profileFromAuth(session.user));
          return;
        }
        finish(null, null);
      } catch(e) {
        console.error("[HyperX] init:", e.message);
        finish(null, null);
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const prof = await fetchProfile(session.user.id, session.user.email);
        const finalProf = enrichProfile(prof, session.user) || profileFromAuth(session.user);
        setUser(session.user); setProfile(finalProf);
        if (!settled) finish(session.user, finalProf);
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
      <Sidebar profile={profile} />
      <div style={{ flex:1, minWidth:0, overflowX:"hidden" }}>
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/auth"    element={<AuthPage />} />
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
