import React, { useEffect, useState, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase }       from "./lib/supabase";
import Sidebar            from "./components/Sidebar";
import ProtectedRoute     from "./components/ProtectedRoute";
import AuthPage           from "./pages/AuthPage";
import GenEMiniPopup      from "./components/GenEMiniPopup";
import LaunchIntro        from "./components/LaunchIntro";
import { UnitsWhatsAppButton } from "./components/WhatsAppButton";
import { useMetaPixel } from "./hooks/useMetaPixel";

const Dashboard         = lazy(() => import("./pages/Dashboard"));
const ContentFeed       = lazy(() => import("./pages/ContentFeed"));
const AIGuidance        = lazy(() => import("./pages/AIGuidance"));
const BookServices      = lazy(() => import("./pages/BookServices"));
const LiveExperience    = lazy(() => import("./pages/LiveExperience"));
const EntrepreneurGuide = lazy(() => import("./pages/EntrepreneurGuide"));
const IdeaValidation    = lazy(() => import("./pages/IdeaValidation"));
const PricingPage       = lazy(() => import("./pages/PricingPage"));
const PackageComparison = lazy(() => import("./pages/PackageComparison"));
const ProjectTracker    = lazy(() => import("./pages/ProjectTracker"));
const Projects          = lazy(() => import("./pages/Projects"));
const Portfolio         = lazy(() => import("./pages/Portfolio"));
const Booking           = lazy(() => import("./pages/Booking"));
const BookingPage       = lazy(() => import("./pages/BookingPage"));

const AMBER = "#d97706";

function Spinner() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#fff" }}>
      <div style={{ fontWeight:800, fontSize:22, color:AMBER, letterSpacing:"-0.04em", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
        The<span style={{color:"#111"}}>Units</span>
      </div>
    </div>
  );
}

function AppShell() {
  useMetaPixel();
  const [user,    setUser]    = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [ready,   setReady]   = useState(false);

  const fetchProfile = async (uid, authUser) => {
    try {
      const { data } = await supabase.from("profiles").select("*")
        .eq("id", uid).maybeSingle();
      const meta = authUser?.user_metadata || {};
      const name = data?.full_name?.trim()
        || meta.full_name || meta.name
        || authUser?.email?.split("@")[0] || "";
      setProfile(data ? { ...data, full_name: name } : null);
    } catch(e) {
      console.error("[Units] fetchProfile:", e.message);
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

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "https://nugens.in.net/auth";
  };

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#f8f9fb", flexDirection:"column" }}>
      {/* Mobile top bar — hidden on desktop via inline responsive logic */}
      <div className="mobile-top-bar" style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 16px", background:"#fff", borderBottom:"1px solid #e8eaed", position:"sticky", top:0, zIndex:100, flexShrink:0 }}>
          <button onClick={()=>setMobileMenuOpen(true)}
            style={{ background:"none", border:"1px solid #e8eaed", borderRadius:8, padding:"6px 10px", cursor:"pointer", fontSize:18, color:"#d97706", lineHeight:1 }}>
            ☰
          </button>
          <span style={{ fontWeight:800, fontSize:15, color:"#111" }}>TheUnits</span>
        </div>
      <style>{`
        @media(min-width:768px){.mobile-top-bar{display:none!important}}
        @media(max-width:767px){
          html,body,#root{max-width:100%;overflow-x:hidden}
          .app-main-content{width:100%;max-width:100vw;min-width:0;overflow-x:hidden!important}
          .app-main-content>*{max-width:100%;box-sizing:border-box}
          .app-main-content [style*="grid-template-columns"]{grid-template-columns:1fr!important}
          .app-main-content [style*="display: grid"]{grid-template-columns:1fr!important}
          .app-main-content [style*="grid-template-columns: repeat"]{grid-template-columns:1fr!important}
          .app-main-content [style*="width: 260px"]{width:100%!important;min-height:auto!important;height:auto!important;border-right:0!important;border-bottom:1px solid #e8eaed!important}
          .app-main-content [style*="width:260"]{width:100%!important;min-height:auto!important;height:auto!important;border-right:0!important;border-bottom:1px solid #e8eaed!important}
          .app-main-content [style*="padding: 36px"],.app-main-content [style*="padding:32px"],.app-main-content [style*="padding: 32px"],.app-main-content [style*="padding: 28px"]{padding:20px!important}
          .app-main-content [style*="min-height: 100vh"]{min-height:auto!important}
          .app-main-content button,.app-main-content input,.app-main-content select,.app-main-content textarea{max-width:100%}
        }
      `}</style>
      <div style={{ display:"flex", flex:1 }}>
      <Sidebar profile={profile} user={user} onSignOut={signOut} open={mobileMenuOpen} onClose={()=>setMobileMenuOpen(false)} />
      <div className="app-main-content" style={{ flex:1, minWidth:0, overflow:"auto", overflowX:"hidden" }}>
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/auth"     element={<AuthPage />} />
            <Route path="/"         element={<ProtectedRoute><Dashboard         profile={profile} user={user} /></ProtectedRoute>} />
            <Route path="/feed"     element={<ProtectedRoute><ContentFeed       profile={profile} user={user} /></ProtectedRoute>} />
            <Route path="/guidance" element={<ProtectedRoute><AIGuidance        profile={profile} user={user} /></ProtectedRoute>} />
            <Route path="/book"     element={<ProtectedRoute><BookServices      profile={profile} user={user} /></ProtectedRoute>} />
            <Route path="/live"     element={<ProtectedRoute><LiveExperience    profile={profile} user={user} /></ProtectedRoute>} />
            <Route path="/guide"    element={<ProtectedRoute><EntrepreneurGuide profile={profile} user={user} /></ProtectedRoute>} />
            <Route path="/validate" element={<ProtectedRoute><IdeaValidation    profile={profile} user={user} /></ProtectedRoute>} />
            <Route path="/pricing"  element={<PricingPage profile={profile} />} />
            <Route path="/compare"  element={<ProtectedRoute><PackageComparison profile={profile} user={user} /></ProtectedRoute>} />
            <Route path="/tracker"  element={<ProtectedRoute><ProjectTracker    profile={profile} user={user} /></ProtectedRoute>} />
            <Route path="/admin/projects" element={<ProtectedRoute><Projects   profile={profile} user={user} /></ProtectedRoute>} />
            <Route path="/portfolio" element={<ProtectedRoute><Portfolio       profile={profile} user={user} /></ProtectedRoute>} />
            <Route path="/quote"    element={<ProtectedRoute><Booking          profile={profile} user={user} /></ProtectedRoute>} />
            <Route path="/receipt/:id" element={<ProtectedRoute><BookingPage   profile={profile} user={user} /></ProtectedRoute>} />
            <Route path="*"         element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
      </div>
      <GenEMiniPopup product="units" />
    </div>
  );
}

export default function App() {
  return <BrowserRouter><LaunchIntro /><AppShell /><UnitsWhatsAppButton /></BrowserRouter>;
}
