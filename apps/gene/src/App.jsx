import React, { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { supabase } from "./lib/supabase";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";

const GenEChat          = lazy(() => import("./pages/GenEChat"));
const ResumesPage       = lazy(() => import("./pages/ResumesPage"));
const JobTrackerPage    = lazy(() => import("./pages/JobTrackerPage"));
const PricingPage       = lazy(() => import("./pages/PricingPage"));
const BusinessDashboard = lazy(() => import("./pages/BusinessDashboard"));
const AuthPage          = lazy(() => import("./pages/AuthPage"));

const PINK = "#e8185d";

function Spinner() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#fff" }}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
        <div style={{
          width:42, height:42, borderRadius:13,
          background:`linear-gradient(135deg,${PINK},#c4134e)`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontWeight:900, fontSize:13, color:"#fff", letterSpacing:"-0.03em",
          boxShadow:`0 8px 24px ${PINK}40`,
          fontFamily:"'Plus Jakarta Sans',sans-serif",
        }}>GE</div>
        <div style={{ color:"#d0d0d0", fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Loading…</div>
      </div>
    </div>
  );
}

function AppShell() {
  const location = useLocation();

  const [user,          setUser]         = useState(null);
  const [profile,       setProfile]      = useState(null);
  const [ready,         setReady]        = useState(false);
  const [modeOverride,  setModeOverride] = useState(null);

  // Pages that take the full viewport — no sidebar
  const isFullscreen = ["/pricing", "/auth"].some(p => location.pathname.startsWith(p));

  const fetchProfile = async (uid) => {
    try {
      const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
      if (data) setProfile(data);
    } catch (e) {
      console.warn("fetchProfile error:", e.message);
    }
  };

  // ── Auth initialisation ──────────────────────────────────────────────────
  useEffect(() => {
    let settled = false;

    // Safety timeout — if Supabase hangs for 6 s, show the app anyway
    const timeout = setTimeout(() => {
      if (!settled) { settled = true; setReady(true); }
    }, 6000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      setUser(session?.user ?? null);
      setReady(true);
      if (session?.user) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else { setProfile(null); setModeOverride(null); }
    });

    return () => { subscription.unsubscribe(); clearTimeout(timeout); };
  }, []);

  // Re-fetch profile when tab regains focus (keeps plan/subscription fresh)
  useEffect(() => {
    const onFocus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) fetchProfile(session.user.id);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  if (!ready) return <Spinner />;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const signOut = async () => {
    setModeOverride(null);
    setProfile(null);
    await supabase.auth.signOut();
    window.location.href = "https://nugens.in.net/auth";
  };

  const dbUserType = profile?.user_type || "individual";
  const userType   = modeOverride ?? dbUserType;

  const handleSwitchMode = (newMode) => setModeOverride(newMode);

  // ── Fullscreen pages (no sidebar) ────────────────────────────────────────
  if (isFullscreen) {
    return (
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route path="/auth"    element={<AuthPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="*"        element={<Navigate to={user ? "/chat" : "/auth"} replace />} />
        </Routes>
      </Suspense>
    );
  }

  // ── Main app shell ────────────────────────────────────────────────────────
  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#f7f7f8" }}>

      {/* Sidebar — only shown when logged in */}
      {user && (
        <Sidebar
          userType={userType}
          dbUserType={dbUserType}
          profile={profile}
          user={user}
          onSignOut={signOut}
          onSwitchMode={handleSwitchMode}
        />
      )}

      <div style={{ flex:1, minWidth:0, overflowX:"hidden" }}>
        <Suspense fallback={<Spinner />}>
          <Routes>

            {/* ── ROOT — redirect based on user type ── */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  {userType === "business"
                    ? <Navigate to="/business" replace />
                    : <Navigate to="/chat" replace />}
                </ProtectedRoute>
              }
            />

            {/* ── AUTH ── */}
            <Route path="/auth" element={<AuthPage />} />

            {/* ── MAIN CHAT ── */}
            <Route path="/chat"     element={<ProtectedRoute><GenEChat profile={profile} /></ProtectedRoute>} />

            {/* ── DATA PAGES ── */}
            <Route path="/resumes"  element={<ProtectedRoute><ResumesPage profile={profile} /></ProtectedRoute>} />
            <Route path="/jobs"     element={<ProtectedRoute><JobTrackerPage profile={profile} /></ProtectedRoute>} />

            {/* ── BUSINESS DASHBOARD ── */}
            <Route path="/business" element={<ProtectedRoute><BusinessDashboard profile={profile} /></ProtectedRoute>} />

            {/* ── PRICING (accessible without login) ── */}
            <Route path="/pricing"  element={<PricingPage />} />

            {/* ── TOOL SHORTCUTS — all redirect into /chat?t=xxx ── */}
            <Route path="/skill-gap"          element={<Navigate to="/chat?t=skill_gap"  replace />} />
            <Route path="/simulate"           element={<Navigate to="/chat?t=simulate"   replace />} />
            <Route path="/roadmap"            element={<Navigate to="/chat?t=roadmap"    replace />} />
            <Route path="/interview"          element={<Navigate to="/chat?t=interview"  replace />} />
            <Route path="/score"              element={<Navigate to="/chat?t=score"      replace />} />
            <Route path="/job-match"          element={<Navigate to="/chat?t=job_match"  replace />} />

            {/* ── BUSINESS TOOL SHORTCUTS ── */}
            <Route path="/business/jd"        element={<Navigate to="/chat?t=jd"         replace />} />
            <Route path="/business/hiring"    element={<Navigate to="/chat?t=hiring"      replace />} />
            <Route path="/business/team"      element={<Navigate to="/chat?t=team"        replace />} />
            <Route path="/business/workforce" element={<Navigate to="/chat?t=workforce"   replace />} />
            <Route path="/business/salary"    element={<Navigate to="/chat?t=salary"      replace />} />
            <Route path="/business/interview" element={<Navigate to="/chat?t=interview"   replace />} />

            {/* ── 404 CATCH-ALL ── */}
            <Route
              path="*"
              element={
                <Navigate to={userType === "business" ? "/business" : "/chat"} replace />
              }
            />

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