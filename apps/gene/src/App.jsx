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
// Business pages
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
  const [user,     setUser]     = useState(null);
  const [profile,  setProfile]  = useState(null);
  const [ready,    setReady]    = useState(false);
  const isFullscreen = ["/pricing", "/auth"].some(p => location.pathname.startsWith(p));

  useEffect(() => {
    supabase.auth.getSession().then(({ data:{ session } }) => {
      setUser(session?.user ?? null);
      setReady(true);
      if (session?.user) {
        supabase.from("profiles").select("*").eq("id", session.user.id).single()
          .then(({ data }) => setProfile(data));
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

  if (!ready) return <Spinner />;

  const signOut = async () => { await supabase.auth.signOut(); window.location.href = "https://nugens.in.net/auth"; };
  const userType = profile?.user_type || "individual";

  // Fullscreen pages (no sidebar)
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
      {user && <Sidebar userType={userType} profile={profile} onSignOut={signOut} />}
      <div style={{ flex:1, minWidth:0, overflowX:"hidden" }}>
        <Suspense fallback={<Spinner />}>
          <Routes>
            {/* ── INDIVIDUAL ROUTES ── */}
            <Route path="/"          element={<ProtectedRoute><GenEChat /></ProtectedRoute>} />
            <Route path="/chat"      element={<ProtectedRoute><GenEChat /></ProtectedRoute>} />
            <Route path="/resumes"   element={<ProtectedRoute><ResumesPage /></ProtectedRoute>} />
            <Route path="/jobs"      element={<ProtectedRoute><JobTrackerPage /></ProtectedRoute>} />
            <Route path="/skill-gap" element={<ProtectedRoute><SkillGap /></ProtectedRoute>} />
            <Route path="/simulate"  element={<ProtectedRoute><CareerSimulator /></ProtectedRoute>} />
            <Route path="/roadmap"   element={<ProtectedRoute><CareerRoadmap /></ProtectedRoute>} />

            {/* ── BUSINESS ROUTES ── */}
            <Route path="/business"            element={<ProtectedRoute><BusinessDashboard profile={profile} /></ProtectedRoute>} />
            <Route path="/business/jd"         element={<ProtectedRoute><JDGenerator /></ProtectedRoute>} />
            <Route path="/business/hiring"     element={<ProtectedRoute><HiringIntelligence /></ProtectedRoute>} />
            <Route path="/business/team"       element={<ProtectedRoute><TeamSkillMap /></ProtectedRoute>} />
            <Route path="/business/workforce"  element={<ProtectedRoute><WorkforcePlanning /></ProtectedRoute>} />
            <Route path="/business/salary"     element={<ProtectedRoute><SalaryBenchmark /></ProtectedRoute>} />
            <Route path="/business/interview"  element={<ProtectedRoute><InterviewAI /></ProtectedRoute>} />

            {/* ── SHARED ── */}
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="*"        element={<Navigate to={userType==="business"?"/business":"/"} replace />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}

export default function App() {
  return <BrowserRouter><AppShell /></BrowserRouter>;
}
