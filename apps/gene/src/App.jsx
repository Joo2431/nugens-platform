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
        <div style={{
          width:40, height:40, borderRadius:12,
          background:PINK, display:"flex", alignItems:"center", justifyContent:"center",
          fontWeight:900, fontSize:13, color:"#fff", letterSpacing:"-0.03em",
          fontFamily:"'Plus Jakarta Sans',sans-serif",
        }}>GE</div>
        <div style={{ color:"#e0e0e0", fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Loading…</div>
      </div>
    </div>
  );
}

function AppShell() {
  const location = useLocation();
  const [user,         setUser]        = useState(null);
  const [profile,      setProfile]     = useState(null);
  const [ready,        setReady]       = useState(false);
  // modeOverride: lets users manually switch individual <-> business without changing DB
  const [modeOverride, setModeOverride]= useState(() => {
    // Clear stale overrides on fresh load if stored too long (> 7 days)
    const stored = localStorage.getItem("gene-mode-override");
    const ts     = localStorage.getItem("gene-mode-override-ts");
    if (stored && ts && Date.now() - Number(ts) > 7 * 86400000) {
      localStorage.removeItem("gene-mode-override");
      localStorage.removeItem("gene-mode-override-ts");
      return null;
    }
    return stored || null;
  });

  const isFullscreen = ["/pricing", "/auth"].some(p => location.pathname.startsWith(p));

  const fetchProfile = async (uid) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
    if (data) setProfile(data);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data:{ session } }) => {
      setUser(session?.user ?? null);
      setReady(true);
      if (session?.user) fetchProfile(session.user.id);
    });
    const { data:{ subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else { setProfile(null); }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Re-fetch profile on window focus — catches plan/type changes from nugens-web onboarding
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
    localStorage.removeItem("gene-mode-override");
    localStorage.removeItem("gene-mode-override-ts");
    await supabase.auth.signOut();
    window.location.href = "https://nugens.in.net/auth";
  };

  // Effective user type: manual override > Supabase profile > individual default
  const dbUserType = profile?.user_type || "individual";
  const userType   = modeOverride ?? dbUserType;

  const handleSwitchMode = (newMode) => {
    setModeOverride(newMode);
    localStorage.setItem("gene-mode-override", newMode);
    localStorage.setItem("gene-mode-override-ts", String(Date.now()));
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
            {/* ROOT — send business users to /business automatically */}
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
