import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { supabase } from "./lib/supabase";
import Sidebar        from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard      from "./pages/Dashboard";
import BrandTools     from "./pages/BrandTools";
import ContentPlanner from "./pages/ContentPlanner";
import TalentHub      from "./pages/TalentHub";
import Analytics      from "./pages/Analytics";
import Projects       from "./pages/Projects";
import AIAssistant    from "./pages/AIAssistant";

function AppShell() {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) supabase.from("profiles").select("*").eq("id", session.user.id).single().then(({ data }) => setProfile(data));
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) supabase.from("profiles").select("*").eq("id", session.user.id).single().then(({ data }) => setProfile(data));
      else setProfile(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div style={{ display:"flex", minHeight:"100vh" }}>
      {user && <Sidebar />}
      <div style={{ flex:1, overflow:"auto" }}>
        <Routes>
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
  return <BrowserRouter><AppShell /></BrowserRouter>;
}
