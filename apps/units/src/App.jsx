import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase }       from "./lib/supabase";
import Sidebar            from "./components/Sidebar";
import ProtectedRoute     from "./components/ProtectedRoute";
import Dashboard          from "./pages/Dashboard";
import ContentFeed        from "./pages/ContentFeed";
import AIGuidance         from "./pages/AIGuidance";
import BookServices       from "./pages/BookServices";
import LiveExperience     from "./pages/LiveExperience";
import EntrepreneurGuide  from "./pages/EntrepreneurGuide";
import IdeaValidation     from "./pages/IdeaValidation";
import PricingPage        from "./pages/PricingPage";
import GenEMiniPopup      from "./components/GenEMiniPopup";

const PINK = "#e8185d";

function Spinner() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#fff" }}>
      <div style={{ fontWeight:800, fontSize:22, color:PINK, letterSpacing:"-0.04em", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
        The<span style={{color:"#111"}}>Units</span>
      </div>
    </div>
  );
}

function AppShell() {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [ready,   setReady]   = useState(false);

  const fetchProfile = async (uid) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
    if (data) setProfile(data);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setReady(true);
      if (session?.user) fetchProfile(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!ready) return <Spinner />;

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "https://nugens.in.net/auth";
  };

  const isBusiness = profile?.user_type === "business";

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#f8f9fb" }}>
      {user && <Sidebar profile={profile} onSignOut={signOut} />}
      <div style={{ flex:1, overflow:"auto" }}>
        <Routes>
          <Route path="/"          element={<ProtectedRoute><Dashboard         profile={profile} /></ProtectedRoute>} />

          {/* Business routes */}
          <Route path="/feed"      element={<ProtectedRoute><ContentFeed       profile={profile} /></ProtectedRoute>} />
          <Route path="/guidance"  element={<ProtectedRoute><AIGuidance        profile={profile} /></ProtectedRoute>} />
          <Route path="/book"      element={<ProtectedRoute><BookServices       profile={profile} /></ProtectedRoute>} />

          {/* Individual routes */}
          <Route path="/live"      element={<ProtectedRoute><LiveExperience    profile={profile} /></ProtectedRoute>} />
          <Route path="/guide"     element={<ProtectedRoute><EntrepreneurGuide profile={profile} /></ProtectedRoute>} />
          <Route path="/validate"  element={<ProtectedRoute><IdeaValidation    profile={profile} /></ProtectedRoute>} />

          <Route path="/pricing"   element={<PricingPage profile={profile} />} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <GenEMiniPopup product="units" />
    </div>
  );
}

export default function App() {
  return <BrowserRouter><AppShell /></BrowserRouter>;
}
