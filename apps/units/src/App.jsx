import React, { useEffect, useState, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase }       from "./lib/supabase";
import Sidebar            from "./components/Sidebar";
import ProtectedRoute     from "./components/ProtectedRoute";
import AuthPage           from "./pages/AuthPage";
import GenEMiniPopup      from "./components/GenEMiniPopup";
import { UnitsWhatsAppButton } from "./components/WhatsAppButton";

const Dashboard         = lazy(() => import("./pages/Dashboard"));
const ContentFeed       = lazy(() => import("./pages/ContentFeed"));
const AIGuidance        = lazy(() => import("./pages/AIGuidance"));
const BookServices      = lazy(() => import("./pages/BookServices"));
const LiveExperience    = lazy(() => import("./pages/LiveExperience"));
const EntrepreneurGuide = lazy(() => import("./pages/EntrepreneurGuide"));
const IdeaValidation    = lazy(() => import("./pages/IdeaValidation"));
const PricingPage       = lazy(() => import("./pages/PricingPage"));
const PackageComparison = lazy(() => import("./pages/PackageComparison"));

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
      {window.innerWidth < 768 || true ? (
        <div className="mobile-top-bar" style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 16px", background:"#fff", borderBottom:"1px solid #e8eaed", position:"sticky", top:0, zIndex:100, flexShrink:0 }}>
          <button onClick={()=>setMobileMenuOpen(true)}
            style={{ background:"none", border:"1px solid #e8eaed", borderRadius:8, padding:"6px 10px", cursor:"pointer", fontSize:18, color:"#d97706", lineHeight:1 }}>
            ☰
          </button>
          <span style={{ fontWeight:800, fontSize:15, color:"#111" }}>TheUnits</span>
        </div>
      ) : null}
      <style>{`@media(min-width:768px){.mobile-top-bar{display:none!important}}`}</style>
      <div style={{ display:"flex", flex:1 }}>
      <Sidebar profile={profile} user={user} onSignOut={signOut} open={mobileMenuOpen} onClose={()=>setMobileMenuOpen(false)} />
      <div style={{ flex:1, overflow:"auto" }}>
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
  return <BrowserRouter><AppShell /><UnitsWhatsAppButton /></BrowserRouter>;
}