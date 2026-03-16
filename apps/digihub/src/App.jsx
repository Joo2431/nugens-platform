import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase }       from "./lib/supabase";
import Sidebar            from "./components/Sidebar";
import ProtectedRoute     from "./components/ProtectedRoute";
import Dashboard          from "./pages/Dashboard";
import PromptSpace        from "./pages/PromptSpace";
import ImageGenerator     from "./pages/ImageGenerator";
import ContentPlanner     from "./pages/ContentPlanner";
import ContentScheduler   from "./pages/ContentScheduler";
import Community          from "./pages/Community";
import JobBoard           from "./pages/JobBoard";
import Analytics          from "./pages/Analytics";
import Projects           from "./pages/Projects";
import PricingPage        from "./pages/PricingPage";
import GenEMiniPopup      from "./components/GenEMiniPopup";

const PINK = "#e8185d";

function Spinner() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#fff" }}>
      <div style={{ fontWeight:800, fontSize:22, color:PINK, letterSpacing:"-0.04em", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
        Digi<span style={{color:"#111"}}>Hub</span>
      </div>
    </div>
  );
}

async function fetchProfile(uid) {
  const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
  return data || null;
}

function AppShell() {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [ready,   setReady]   = useState(false);

  useEffect(() => {
    let done = false;

    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        const p = await fetchProfile(session.user.id);
        if (!done) setProfile(p);
      }
      if (!done) { done = true; setReady(true); }
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const p = await fetchProfile(session.user.id);
        setProfile(p);
        if (!done) { done = true; setReady(true); }
      } else {
        setProfile(null);
        if (!done) { done = true; setReady(true); }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!ready) return <Spinner />;

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "https://nugens.in.net/auth";
  };

  return (
    // White background — matches HyperX and Units
    <div style={{ display:"flex", minHeight:"100vh", background:"#f8f9fb" }}>
      {user && <Sidebar profile={profile} onSignOut={signOut} />}
      <div style={{ flex:1, overflow:"auto" }}>
        <Routes>
          <Route path="/"           element={<ProtectedRoute><Dashboard       profile={profile} /></ProtectedRoute>} />
          <Route path="/prompts"    element={<ProtectedRoute><PromptSpace      profile={profile} /></ProtectedRoute>} />
          <Route path="/imagegen"   element={<ProtectedRoute><ImageGenerator   profile={profile} /></ProtectedRoute>} />
          <Route path="/planner"    element={<ProtectedRoute><ContentPlanner   profile={profile} /></ProtectedRoute>} />
          <Route path="/scheduler"  element={<ProtectedRoute><ContentScheduler profile={profile} /></ProtectedRoute>} />
          <Route path="/community"  element={<ProtectedRoute><Community        profile={profile} /></ProtectedRoute>} />
          <Route path="/jobs"       element={<ProtectedRoute><JobBoard         profile={profile} /></ProtectedRoute>} />
          <Route path="/analytics"  element={<ProtectedRoute><Analytics        profile={profile} /></ProtectedRoute>} />
          <Route path="/projects"   element={<ProtectedRoute><Projects         profile={profile} /></ProtectedRoute>} />
          <Route path="/pricing"    element={<PricingPage profile={profile} />} />
          <Route path="*"           element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <GenEMiniPopup product="digihub" />
    </div>
  );
}

export default function App() {
  return <BrowserRouter><AppShell /></BrowserRouter>;
}
