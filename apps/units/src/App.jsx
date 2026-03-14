import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./lib/supabase";
import Sidebar        from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard      from "./pages/Dashboard";
import Services       from "./pages/Services";
import Booking        from "./pages/Booking";
import Projects       from "./pages/Projects";
import Portfolio      from "./pages/Portfolio";
import PricingPage    from "./pages/PricingPage";
import GenEMiniPopup  from "./components/GenEMiniPopup";

const GOLD = "#d4a843";

function Spinner() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#0a0805" }}>
      <div style={{ fontWeight:800, fontSize:22, color:GOLD, letterSpacing:"-0.04em", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Units ✦</div>
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

  const signOut = async () => { await supabase.auth.signOut(); window.location.href = "https://nugens.in.net/auth"; };

  return (
    <div style={{ display:"flex", minHeight:"100vh" }}>
      {user && <Sidebar profile={profile} onSignOut={signOut} />}
      <div style={{ flex:1, overflow:"auto" }}>
        <Routes>
          <Route path="/"          element={<ProtectedRoute><Dashboard profile={profile} /></ProtectedRoute>} />
          <Route path="/services"  element={<ProtectedRoute><Services profile={profile} /></ProtectedRoute>} />
          <Route path="/book"      element={<ProtectedRoute><Booking profile={profile} /></ProtectedRoute>} />
          <Route path="/projects"  element={<ProtectedRoute><Projects profile={profile} /></ProtectedRoute>} />
          <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
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
