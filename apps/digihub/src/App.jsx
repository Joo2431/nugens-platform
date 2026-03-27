import React, { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./lib/supabase";
import Sidebar        from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import GenEMiniPopup  from "./components/GenEMiniPopup";
import AuthPage       from "./pages/AuthPage";

const Dashboard        = lazy(() => import("./pages/Dashboard"));
const PromptSpace      = lazy(() => import("./pages/PromptSpace"));
const ImageGenerator   = lazy(() => import("./pages/ImageGenerator"));
const ContentPlanner   = lazy(() => import("./pages/ContentPlanner"));
const ContentScheduler = lazy(() => import("./pages/ContentScheduler"));
const Community        = lazy(() => import("./pages/Community"));
const JobBoard         = lazy(() => import("./pages/JobBoard"));
const Analytics        = lazy(() => import("./pages/Analytics"));
const Projects         = lazy(() => import("./pages/Projects"));
const PricingPage      = lazy(() => import("./pages/PricingPage"));
const HashtagGenerator  = lazy(() => import("./pages/HashtagGenerator"));
const BulkGenerator     = lazy(() => import("./pages/BulkContentGenerator"));
const BrandVoice        = lazy(() => import("./pages/BrandVoiceSetup"));

const PINK = "#e8185d";

function Spinner() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
      height:"100vh", background:"#ffffff", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontWeight:800, fontSize:26, color:PINK, letterSpacing:"-0.04em", marginBottom:8 }}>
          Digi<span style={{color:"#111"}}>Hub</span>
        </div>
        <div style={{ width:32, height:3, background:PINK, borderRadius:2, margin:"0 auto", opacity:0.3 }}/>
      </div>
    </div>
  );
}

function AppShell() {
  const [user,    setUser]    = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [ready,   setReady]   = useState(false);

  // Same pattern as nugens-web — one fetchProfile called from both paths
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
      console.error("[DigiHub] fetchProfile:", e.message);
    }
  };

  useEffect(() => {
    // Set ready immediately after getSession — never block render on profile
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
      {window.innerWidth < 768 || true ? (
        <div className="mobile-top-bar" style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 16px", background:"#fff", borderBottom:"1px solid #e8eaed", position:"sticky", top:0, zIndex:100, flexShrink:0 }}>
          <button onClick={()=>setMobileMenuOpen(true)}
            style={{ background:"none", border:"1px solid #e8eaed", borderRadius:8, padding:"6px 10px", cursor:"pointer", fontSize:18, color:"#e8185d", lineHeight:1 }}>
            ☰
          </button>
          <span style={{ fontWeight:800, fontSize:15, color:"#111" }}>DigiHub</span>
        </div>
      ) : null}
      <style>{`@media(min-width:768px){.mobile-top-bar{display:none!important}}`}</style>
      <div style={{ display:"flex", flex:1 }}>
      <Sidebar profile={profile} user={user} onSignOut={signOut} open={mobileMenuOpen} onClose={()=>setMobileMenuOpen(false)} />
      <div style={{ flex:1, overflow:"auto", minWidth:0 }}>
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/auth"      element={<AuthPage />} />
            <Route path="/"          element={<ProtectedRoute><Dashboard       profile={profile} user={user} /></ProtectedRoute>} />
            <Route path="/prompts"   element={<ProtectedRoute><PromptSpace      profile={profile} user={user} /></ProtectedRoute>} />
            <Route path="/imagegen"  element={<ProtectedRoute><ImageGenerator   profile={profile} user={user} /></ProtectedRoute>} />
            <Route path="/planner"   element={<ProtectedRoute><ContentPlanner   profile={profile} user={user} /></ProtectedRoute>} />
            <Route path="/scheduler" element={<ProtectedRoute><ContentScheduler profile={profile} user={user} /></ProtectedRoute>} />
            <Route path="/community" element={<ProtectedRoute><Community        profile={profile} user={user} /></ProtectedRoute>} />
            <Route path="/jobs"      element={<ProtectedRoute><JobBoard         profile={profile} user={user} /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics        profile={profile} user={user} /></ProtectedRoute>} />
            <Route path="/projects"  element={<ProtectedRoute><Projects         profile={profile} user={user} /></ProtectedRoute>} />
            <Route path="/pricing"   element={<PricingPage profile={profile} />} />
            <Route path="/hashtags"  element={<ProtectedRoute><HashtagGenerator profile={profile} user={user} /></ProtectedRoute>} />
            <Route path="/bulk"      element={<ProtectedRoute><BulkGenerator    profile={profile} user={user} /></ProtectedRoute>} />
            <Route path="/brand"     element={<ProtectedRoute><BrandVoice       profile={profile} /></ProtectedRoute>} />
            <Route path="*"          element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
      </div>
      <GenEMiniPopup product="digihub" />
    </div>
  );
}

export default function App() {
  return <BrowserRouter><AppShell /></BrowserRouter>;
}