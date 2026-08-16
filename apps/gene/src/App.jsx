import React, { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { supabase } from "./lib/supabase";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import LaunchIntro from "./components/LaunchIntro";
import GenEMiniPopup from "./components/GenEMiniPopup";
import AuthPage from "./pages/AuthPage";
import { useMetaPixel } from "./hooks/useMetaPixel";

// Core pages
const GenEChat          = lazy(() => import("./pages/GenEChat"));
const Dashboard         = lazy(() => import("./pages/Dashboard"));
const ResumeBuilder     = lazy(() => import("./pages/ResumeBuilder"));
const CareerRoadmap     = lazy(() => import("./pages/CareerRoadmap"));
const InterviewRoom     = lazy(() => import("./pages/InterviewRoom"));
const VaultPage         = lazy(() => import("./pages/VaultPage"));

// Individual tools — previously built but never routed; Sidebar sent these
// into /chat?t=... (a generic chat message) instead of their real pages.
const SkillGap          = lazy(() => import("./pages/SkillGap"));
const CareerSimulator   = lazy(() => import("./pages/CareerSimulator"));

// Business tools — same issue as above, all six routed into business-chat
// with a query param instead of their own dedicated pages.
const JDGenerator         = lazy(() => import("./pages/JDGenerator"));
const HiringIntelligence  = lazy(() => import("./pages/HiringIntelligence"));
const TeamSkillMap        = lazy(() => import("./pages/TeamSkillMap"));
const WorkforcePlanning   = lazy(() => import("./pages/WorkforcePlanning"));
const SalaryBenchmark     = lazy(() => import("./pages/SalaryBenchmark"));
const InterviewAI         = lazy(() => import("./pages/InterviewAI"));

// Existing pages
const ResumesPage       = lazy(() => import("./pages/ResumesPage"));
const JobTrackerPage    = lazy(() => import("./pages/JobTrackerPage"));
const PricingPage       = lazy(() => import("./pages/PricingPage"));
const BusinessDashboard = lazy(() => import("./pages/BusinessDashboard"));
const BusinessChat      = lazy(() => import("./pages/BusinessChat"));

const PINK = "#e8185d";

function Spinner() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#fff" }}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
        <div style={{ width:42, height:42, borderRadius:13, background:`linear-gradient(135deg,${PINK},#c4134e)`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:13, color:"#fff", letterSpacing:"-0.03em", boxShadow:`0 8px 24px ${PINK}40`, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>GE</div>
        <div style={{ color:"#d0d0d0", fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Loading…</div>
      </div>
    </div>
  );
}

function AppShell() {
  const location = useLocation();
  useMetaPixel();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [ready, setReady] = useState(false);
  const [modeOverride, setModeOverride] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isPureChatRoute = location.pathname === "/chat" || location.pathname === "/business-chat";
  const isFullscreen = ["/pricing", "/auth"].some(p => location.pathname.startsWith(p));

  const fetchProfile = async (uid) => {
    try {
      const { data } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
      if (data) {
        if (!data.full_name) {
          const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
          const meta = session?.user?.user_metadata;
          const name = meta?.full_name || meta?.name || session?.user?.email?.split("@")[0] || "";
          setProfile(name ? { ...data, full_name: name } : data);
        } else {
          setProfile(data);
        }
      }
    } catch(e) { console.error("[Gen-E] fetchProfile:", e.message); }
  };

  useEffect(() => {
    let settled = false;
    const hardTimeout = setTimeout(() => {
      if (!settled) { settled = true; setReady(true); }
    }, 6000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (settled) return;
      settled = true;
      clearTimeout(hardTimeout);
      setUser(session?.user ?? null);
      setReady(true);
      if (session?.user) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else { setProfile(null); setModeOverride(null); }
    });

    return () => { clearTimeout(hardTimeout); subscription.unsubscribe(); };
  }, []);

  // Re-fetch profile on window focus
  useEffect(() => {
    const h = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) fetchProfile(session.user.id);
    };
    window.addEventListener("focus", h);
    return () => window.removeEventListener("focus", h);
  }, []);

  if (!ready) return <Spinner />;

  const signOut = async () => {
    setModeOverride(null);
    await supabase.auth.signOut();
    window.location.href = "https://nugens.in/auth";
  };

  const dbUserType = profile?.user_type || "individual";
  const userType   = modeOverride ?? dbUserType;

  // Fullscreen routes (no sidebar)
  if (isFullscreen) return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/auth"    element={<AuthPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="*"        element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );

  // Pure chat routes (they manage their own layout)
  if (isPureChatRoute) return (
    <>
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route path="/chat" element={
            <ProtectedRoute>
              {userType === "business" 
                ? <Navigate to="/business-chat" replace /> 
                : <GenEChat profile={profile} />}
            </ProtectedRoute>
          } />
          <Route path="/business-chat" element={<ProtectedRoute><BusinessChat /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/chat" replace />} />
        </Routes>
      </Suspense>
      <GenEMiniPopup product="gene" />
    </>
  );

  // Main layout with outer Sidebar
  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#f8f9fb", flexDirection:"column" }}>
      {/* Mobile top bar */}
      <div className="mobile-top-bar" style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 16px", background:"#fff", borderBottom:"1px solid #f0f0f0", position:"sticky", top:0, zIndex:100, flexShrink:0 }}>
        <button onClick={() => setMobileMenuOpen(true)}
          style={{ background:"none", border:"1px solid #f0f0f0", borderRadius:8, padding:"6px 10px", cursor:"pointer", fontSize:18, color:"#e8185d", lineHeight:1 }}>
          ☰
        </button>
        <span style={{ fontWeight:800, fontSize:15, color:"#111" }}>Gen-<span style={{color:"#e8185d"}}>E</span></span>
      </div>
      <style>{`@media(min-width:768px){.mobile-top-bar{display:none!important}}`}</style>

      <div style={{ display:"flex", flex:1 }}>
        <Sidebar
          userType={userType}
          dbUserType={dbUserType}
          profile={profile}
          user={user}
          onSignOut={signOut}
          onSwitchMode={(m) => setModeOverride(m)}
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />

        <div style={{ flex:1, minWidth:0, overflowX:"hidden", overflow:"auto" }}>
          <Suspense fallback={<Spinner />}>
            <Routes>
              {/* New default landing */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Dashboard profile={profile} />
                </ProtectedRoute>
              } />

              {/* New standalone tools */}
              <Route path="/resume"    element={<ProtectedRoute><ResumeBuilder profile={profile} /></ProtectedRoute>} />
              <Route path="/roadmap"   element={<ProtectedRoute><CareerRoadmap profile={profile} /></ProtectedRoute>} />
              <Route path="/interview" element={<ProtectedRoute><InterviewRoom profile={profile} /></ProtectedRoute>} />
              <Route path="/vault"     element={<ProtectedRoute><VaultPage profile={profile} /></ProtectedRoute>} />

              {/* Individual tools — now routed to their real pages instead of
                  falling through to a generic chat message */}
              <Route path="/skill-gap" element={<ProtectedRoute><SkillGap profile={profile} /></ProtectedRoute>} />
              <Route path="/simulate"  element={<ProtectedRoute><CareerSimulator profile={profile} /></ProtectedRoute>} />

              {/* Business tools — same fix, each gets its own page */}
              <Route path="/jd"        element={<ProtectedRoute><JDGenerator profile={profile} /></ProtectedRoute>} />
              <Route path="/hiring"    element={<ProtectedRoute><HiringIntelligence profile={profile} /></ProtectedRoute>} />
              <Route path="/team-skills" element={<ProtectedRoute><TeamSkillMap profile={profile} /></ProtectedRoute>} />
              <Route path="/workforce" element={<ProtectedRoute><WorkforcePlanning profile={profile} /></ProtectedRoute>} />
              <Route path="/salary"    element={<ProtectedRoute><SalaryBenchmark profile={profile} /></ProtectedRoute>} />
              <Route path="/interview-ai" element={<ProtectedRoute><InterviewAI profile={profile} /></ProtectedRoute>} />

              {/* Existing routes */}
              <Route path="/chat"     element={<Navigate to="/" replace />} />
              <Route path="/resumes"  element={<ProtectedRoute><ResumesPage /></ProtectedRoute>} />
              <Route path="/jobs"     element={<ProtectedRoute><JobTrackerPage /></ProtectedRoute>} />
              <Route path="/business" element={<ProtectedRoute><BusinessDashboard profile={profile} /></ProtectedRoute>} />

              {/* Old deep links → now point at the real dedicated pages
                  instead of dropping the user into a chat message */}
              <Route path="/skill_gap"          element={<Navigate to="/skill-gap" replace />} />
              <Route path="/business/jd"        element={<Navigate to="/jd"          replace />} />
              <Route path="/business/hiring"    element={<Navigate to="/hiring"      replace />} />
              <Route path="/business/team"      element={<Navigate to="/team-skills" replace />} />
              <Route path="/business/workforce" element={<Navigate to="/workforce"   replace />} />
              <Route path="/business/salary"    element={<Navigate to="/salary"      replace />} />
              <Route path="/business/interview" element={<Navigate to="/interview-ai" replace />} />

              <Route path="/pricing" element={<PricingPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </div>

      <GenEMiniPopup product="gene" />
    </div>
  );
}

export default function App() {
  return <BrowserRouter><LaunchIntro /><AppShell /></BrowserRouter>;
}