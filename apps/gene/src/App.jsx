import React, { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { supabase } from "./lib/supabase";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";

const GenEChat        = lazy(() => import("./pages/GenEChat"));
const ResumesPage     = lazy(() => import("./pages/ResumesPage"));
const JobTrackerPage  = lazy(() => import("./pages/JobTrackerPage"));
const PricingPage     = lazy(() => import("./pages/PricingPage"));
const SkillGap        = lazy(() => import("./pages/SkillGap"));
const CareerSimulator = lazy(() => import("./pages/CareerSimulator"));
const CareerRoadmap   = lazy(() => import("./pages/CareerRoadmap"));
const BusinessDashboard  = lazy(() => import("./pages/BusinessDashboard"));
const JDGenerator        = lazy(() => import("./pages/JDGenerator"));
const HiringIntelligence = lazy(() => import("./pages/HiringIntelligence"));
const TeamSkillMap       = lazy(() => import("./pages/TeamSkillMap"));
const WorkforcePlanning  = lazy(() => import("./pages/WorkforcePlanning"));
const SalaryBenchmark    = lazy(() => import("./pages/SalaryBenchmark"));
const InterviewAI        = lazy(() => import("./pages/InterviewAI"));

const PINK = "#e8185d";

function Spinner() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#fff" }}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
        <div style={{ width:40, height:40, borderRadius:12, background:PINK,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontWeight:900, fontSize:13, color:"#fff", letterSpacing:"-0.03em",
          fontFamily:"'Plus Jakarta Sans',sans-serif" }}>GE</div>
        <div style={{ color:"#ddd", fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Loading…</div>
      </div>
    </div>
  );
}

function AppShell() {
  const location = useLocation();
  const [user,        setUser]       = useState(null);
  const [profile,     setProfile]    = useState(null);
  const [ready,       setReady]      = useState(false);
  // modeOverride: ONLY set when user manually clicks switch in sidebar
  // Starts as null — always defer to DB on first load
  const [modeOverride, setModeOverride] = useState(null);

  const isFullscreen = ["/pricing", "/auth"].some(p => location.pathname.startsWith(p));

  const fetchProfile = async (uid) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .single();

    if (data) {
      setProfile(data);
      // Always clear any stale localStorage override — DB is the source of truth
      // Only keep override if user explicitly switched this session (modeOverride state is set)
      localStorage.removeItem("gene-mode-override");
    }
  };

  useEffect(() => {
    // Clear any stale localStorage from previous sessions on mount
    localStorage.removeItem("gene-mode-override");

    supabase.auth.getSession().then(({ data:{ session } }) => {
      setUser(session?.user ?? null);
      setReady(true);
      if (session?.user) fetchProfile(session.user.id);
    });

    const { data:{ subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setModeOverride(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Re-fetch profile on window focus (catches onboarding changes from nugens-web)
  useEffect(() => {
    const h = async () => {
      const { data:{ session } } = await supabase.auth.getSession();
      if (session?.user) fetchProfile(session.user.id);
    };
    window.addEventListener("focus", h);
    return () => window.removeEventListener("focus", h);
  }, []);

  if (!ready) return <Spinner />;

  const signOut = async () => {
    setModeOverride(null);
    localStorage.removeItem("gene-mode-override");
    await supabase.auth.signOut();
    window.location.href = "https://nugens.in.net/auth";
  };

  // Source of truth: modeOverride (manual session switch) → DB user_type → individual
  const dbUserType = profile?.user_type || "individual";
  const userType   = modeOverride ?? dbUserType;

  const handleSwitchMode = (newMode) => {
    setModeOverride(newMode);
    // Don't persist to localStorage — only valid for this browser session
  };

  if (isFullscreen) return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#f7f7f8" }}>
      {user && (
        <Sidebar
          userType={userType}
          dbUserType={dbUserType}
          profile={profile}
          onSignOut={signOut}
          onSwitchMode={handleSwitchMode}
        />
      )}
      <div style={{ flex:1, minWidth:0, overflowX:"hidden" }}>
        <Suspense fallback={<Spinner />}>
          <Routes>
            {/* ROOT — business users redirect to /business immediately */}
            <Route path="/" element={
              <ProtectedRoute>
                {userType === "business"
                  ? <Navigate to="/business" replace />
                  : <GenEChat />}
              </ProtectedRoute>
            } />

            {/* INDIVIDUAL */}
            <Route path="/chat"      element={<ProtectedRoute><GenEChat /></ProtectedRoute>} />
            <Route path="/resumes"   element={<ProtectedRoute><ResumesPage /></ProtectedRoute>} />
            <Route path="/jobs"      element={<ProtectedRoute><JobTrackerPage /></ProtectedRoute>} />
            <Route path="/skill-gap" element={<ProtectedRoute><SkillGap /></ProtectedRoute>} />
            <Route path="/simulate"  element={<ProtectedRoute><CareerSimulator /></ProtectedRoute>} />
            <Route path="/roadmap"   element={<ProtectedRoute><CareerRoadmap /></ProtectedRoute>} />

            {/* BUSINESS */}
            <Route path="/business"           element={<ProtectedRoute><BusinessDashboard profile={profile} /></ProtectedRoute>} />
            <Route path="/business/jd"        element={<ProtectedRoute><JDGenerator /></ProtectedRoute>} />
            <Route path="/business/hiring"    element={<ProtectedRoute><HiringIntelligence /></ProtectedRoute>} />
            <Route path="/business/team"      element={<ProtectedRoute><TeamSkillMap /></ProtectedRoute>} />
            <Route path="/business/workforce" element={<ProtectedRoute><WorkforcePlanning /></ProtectedRoute>} />
            <Route path="/business/salary"    element={<ProtectedRoute><SalaryBenchmark /></ProtectedRoute>} />
            <Route path="/business/interview" element={<ProtectedRoute><InterviewAI /></ProtectedRoute>} />

            {/* SHARED */}
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="*" element={<Navigate to={userType === "business" ? "/business" : "/chat"} replace />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}

export default function App() {
  return <BrowserRouter><AppShell /></BrowserRouter>;
}
