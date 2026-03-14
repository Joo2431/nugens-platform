import React, { createContext, useContext, useEffect, useState, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./lib/supabase";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import GenEMiniPopup from "./components/GenEMiniPopup";

/* ── Auth context ── */
export const AuthContext = createContext({ user: null, profile: null, ready: false });
export const useAuth = () => useContext(AuthContext);

/* ── lazy pages ── */
const About       = lazy(() => import("./pages/About"));
const Blog        = lazy(() => import("./pages/Blog"));
const Careers     = lazy(() => import("./pages/Careers"));
const Contact     = lazy(() => import("./pages/Contact"));
const Support     = lazy(() => import("./pages/Support"));
const GenE        = lazy(() => import("./pages/GenE"));
const HyperX      = lazy(() => import("./pages/HyperX"));
const DigiHub     = lazy(() => import("./pages/DigiHub"));
const Units       = lazy(() => import("./pages/Units"));
const AuthPage    = lazy(() => import("./pages/AuthPage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const Dashboard   = lazy(() => import("./pages/Dashboard"));

function Spinner() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"60vh" }}>
      <div style={{ fontWeight:800, fontSize:24, color:"#e8185d", letterSpacing:"-0.04em",
        fontFamily:"'Plus Jakarta Sans',sans-serif" }}>NuGens</div>
    </div>
  );
}

function Layout({ children }) {
  return (<><Header /><main>{children}</main><Footer /></>);
}

export default function App() {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [ready,   setReady]   = useState(false);

  // Fetch profile silently — never blocks rendering
  const fetchProfile = async (uid) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
    setProfile(data ?? null);
  };

  useEffect(() => {
    // Initial session check — set user + ready IMMEDIATELY, don't wait for profile
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setReady(true); // <-- unblock render right away
      if (session?.user) fetchProfile(session.user.id);
    });

    // Auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null); // update header instantly
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Only block on very first load (ready = false means getSession hasn't returned yet)
  if (!ready) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#fff" }}>
      <div style={{ fontWeight:800, fontSize:26, color:"#e8185d", letterSpacing:"-0.04em",
        fontFamily:"'Plus Jakarta Sans',sans-serif" }}>NuGens</div>
    </div>
  );

  return (
    <BrowserRouter>
      <AuthContext.Provider value={{ user, profile, ready }}>
        <Suspense fallback={<Spinner />}>
          <Routes>
            {/* public */}
            <Route path="/"         element={<Layout><Home /></Layout>} />
            <Route path="/about"    element={<Layout><About /></Layout>} />
            <Route path="/blog"     element={<Layout><Blog /></Layout>} />
            <Route path="/blog/:id" element={<Layout><Blog /></Layout>} />
            <Route path="/careers"  element={<Layout><Careers /></Layout>} />
            <Route path="/contact"  element={<Layout><Contact /></Layout>} />
            <Route path="/support"  element={<Layout><Support /></Layout>} />
            <Route path="/gene"     element={<Layout><GenE /></Layout>} />
            <Route path="/hyperx"   element={<Layout><HyperX /></Layout>} />
            <Route path="/digihub"  element={<Layout><DigiHub /></Layout>} />
            <Route path="/units"    element={<Layout><Units /></Layout>} />
            <Route path="/pricing"  element={<Layout><PricingPage /></Layout>} />
            {/* auth */}
            <Route path="/auth"     element={<AuthPage />} />
            <Route path="/login"    element={<Navigate to="/auth" replace />} />
            <Route path="/signup"   element={<Navigate to="/auth?mode=signup" replace />} />
            {/* protected */}
            <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
            {/* fallback */}
            <Route path="*"         element={<Layout><Home /></Layout>} />
          </Routes>
        </Suspense>
        <GenEMiniPopup product="nugens" />
      </AuthContext.Provider>
    </BrowserRouter>
  );
}
