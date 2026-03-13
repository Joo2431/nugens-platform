import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { supabase } from "./lib/supabase";
import Sidebar        from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthPage       from "./pages/AuthPage";
import Dashboard      from "./pages/Dashboard";
import BrandTools     from "./pages/BrandTools";
import ContentPlanner from "./pages/ContentPlanner";
import TalentHub      from "./pages/TalentHub";
import Analytics      from "./pages/Analytics";
import Projects       from "./pages/Projects";
import AIAssistant    from "./pages/AIAssistant";

function AppShell({ user, profile }) {
  const location = useLocation();
  if (location.pathname === "/auth") return <AuthPage />;
  return (
    <div style={{ display:"flex", minHeight:"100vh" }}>
      {user && <Sidebar user={user} profile={profile} />}
      <div style={{ flex:1, overflow:"auto" }}>
        <Routes>
          <Route path="/auth"      element={<AuthPage />} />
          <Route path="/"          element={<ProtectedRoute><Dashboard profile={profile} /></ProtectedRoute>} />
          <Route path="/tools"     element={<ProtectedRoute><BrandTools /></ProtectedRoute>} />
          <Route path="/planner"   element={<ProtectedRoute><ContentPlanner /></ProtectedRoute>} />
          <Route path="/talent"    element={<ProtectedRoute><TalentHub /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/projects"  element={<ProtectedRoute><Projects /></ProtectedRoute>} />
          <Route path="/assistant" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [ready,   setReady]   = useState(false);

  const fetchProfile = async (uid) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
    setProfile(data ?? null);
  };

  useEffect(() => {
    // Set ready IMMEDIATELY — don't wait for fetchProfile
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

  if (!ready) return (
    <div style={{ minHeight:"100vh", background:"#06101a", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", color:"#0284c7", fontSize:22, fontWeight:800, letterSpacing:"-0.04em" }}>Digi<span style={{ color:"#fff" }}>Hub</span></div>
    </div>
  );

  return <BrowserRouter><AppShell user={user} profile={profile} /></BrowserRouter>;
}
