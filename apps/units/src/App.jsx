import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { supabase } from "./lib/supabase";
import Sidebar        from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthPage       from "./pages/AuthPage";
import Dashboard      from "./pages/Dashboard";
import Services       from "./pages/Services";
import Booking        from "./pages/Booking";
import Projects       from "./pages/Projects";
import Portfolio      from "./pages/Portfolio";
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
          <Route path="/services"  element={<ProtectedRoute><Services /></ProtectedRoute>} />
          <Route path="/book"      element={<ProtectedRoute><Booking /></ProtectedRoute>} />
          <Route path="/projects"  element={<ProtectedRoute><Projects /></ProtectedRoute>} />
          <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
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
    <div style={{ minHeight:"100vh", background:"#0a0805", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:6 }}>
      <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800, fontSize:13, letterSpacing:"0.14em", textTransform:"uppercase", color:"#4a4030" }}>The Wedding</div>
      <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800, fontSize:28, color:"#d4a843", letterSpacing:"-0.04em" }}>Unit</div>
    </div>
  );

  return <BrowserRouter><AppShell user={user} profile={profile} /></BrowserRouter>;
}
