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
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#09090a" }}>
      <div style={{ fontWeight:800, fontSize:28, fontStyle:"italic", color:PINK, letterSpacing:"-0.04em", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>GEN-E</div>
    </div>
  );
}

function AppShell() {
  const location = useLocation();
  const [user,         setUser]        = useState(null);
  const [profile,      setProfile]     = useState(null);
  const [ready,        setReady]       = useState(false);
  const [modeOverride, setModeOverride]= useState(() => localStorage.getItem("gene-mode-override") || null);

  const isFullscreen = ["/pricing", "/auth"].some(p => location.pathname.startsWith(p));

  useEffect(() => {
    supabase.auth.getSession().then(({ data:{ session } }) => {
      setUser(session?.user ?? null);
      setReady(true);
      if (session?.user) {
        supabase.from("profiles").select("*").eq("id", session.user.id).single()
          .then(({ data }) => {
            setProfile(data);
            // Auto-apply DB user_type if no manual override
            if (!localStorage.getItem("gene-mode-override") && data?.user_type) {
              // clear any stale override if DB type changed
            }
          });
      }
    });
    const { data:{ subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from("profiles").select("*").eq("id", session.user.id).single()
          .then(({ data }) => setProfile(data));
      } else setProfile(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Refresh profile on window focus (catches plan upgrades in other tabs)
  useEffect(() => {
    const h = async () => {
      const { data:{ session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        if (data) setProfile(data);
      }
    };
    window.addEventListener("focus", h);
    return () => window.removeEventListener("focus", h);
  }, []);

  if (!ready) return <Spinner />;

  const signOut = async () => {
    localStorage.removeItem("gene-mode-override");
    await supabase.auth.signOut();
    window.location.href = "https://nugens.in.net/auth";
  };

  // modeOverride lets users manually toggle — clears when they sign out
  const dbUserType = profile?.user_type || "individual";
  const userType   = modeOverride ?? dbUserType;

  const handleSwitchMode = (newMode) => {
    setModeOverride(newMode);
    localStorage.setItem("gene-mode-override", newMode);
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
    <div style={{ display:"flex", minHeight:"100vh", background:"#09090a" }}>
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
            {/* ROOT — business users land on /business */}
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
            <Route path="*" element={<Navigate to={userType === "business" ? "/business" : "/"} replace />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}

export default function App() {
  return <BrowserRouter><AppShell /></BrowserRouter>;
}
