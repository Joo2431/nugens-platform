import React, { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./lib/supabase";
import Sidebar       from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import GenEMiniPopup  from "./components/GenEMiniPopup";

// Lazy load all pages so Suspense handles individual page loading
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

const PINK = "#e8185d";

// White spinner — matches platform theme, says DigiHub not NuGens
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
  const [profile, setProfile] = useState(null);
  const [ready,   setReady]   = useState(false);

  useEffect(() => {
    let settled = false;

    // Hard 5-second timeout — prevents infinite spinner on Cloudflare cold start
    const hardTimeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        console.warn("DigiHub: auth timeout — forcing ready");
        setReady(true);
      }
    }, 5000);

    function finish(usr, prof) {
      if (settled) return;
      settled = true;
      clearTimeout(hardTimeout);
      setUser(usr ?? null);
      setProfile(prof ?? null);
      setReady(true);
    }

    async function init() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session?.user) { finish(null, null); return; }

        // Race profile fetch against 4s timeout — never block the app for profile
        const prof = await Promise.race([
          supabase.from("profiles").select("*")
            .eq("id", session.user.id).single()
            .then(({ data }) => data || null)
            .catch(() => null),
          new Promise(r => setTimeout(() => r(null), 4000)),
        ]);

        finish(session.user, prof);
      } catch (err) {
        console.error("DigiHub init error:", err.message);
        finish(null, null);
      }
    }

    // Subscribe so profile updates on token refresh / plan change
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const { data: prof } = await supabase
            .from("profiles").select("*").eq("id", session.user.id).single()
            .catch(() => ({ data: null }));
          setUser(session.user);
          setProfile(prof || null);
          if (!settled) finish(session.user, prof);
        } else {
          setUser(null);
          setProfile(null);
          if (!settled) finish(null, null);
        }
      }
    );

    init();
    return () => { clearTimeout(hardTimeout); subscription.unsubscribe(); };
  }, []);

  if (!ready) return <Spinner />;

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "https://nugens.in.net/auth";
  };

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#f8f9fb" }}>
      {user && <Sidebar profile={profile} onSignOut={signOut} />}
      <div style={{ flex:1, overflow:"auto", minWidth:0 }}>
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/"          element={<ProtectedRoute><Dashboard       profile={profile} /></ProtectedRoute>} />
            <Route path="/prompts"   element={<ProtectedRoute><PromptSpace      profile={profile} /></ProtectedRoute>} />
            <Route path="/imagegen"  element={<ProtectedRoute><ImageGenerator   profile={profile} /></ProtectedRoute>} />
            <Route path="/planner"   element={<ProtectedRoute><ContentPlanner   profile={profile} /></ProtectedRoute>} />
            <Route path="/scheduler" element={<ProtectedRoute><ContentScheduler profile={profile} /></ProtectedRoute>} />
            <Route path="/community" element={<ProtectedRoute><Community        profile={profile} /></ProtectedRoute>} />
            <Route path="/jobs"      element={<ProtectedRoute><JobBoard         profile={profile} /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics        profile={profile} /></ProtectedRoute>} />
            <Route path="/projects"  element={<ProtectedRoute><Projects         profile={profile} /></ProtectedRoute>} />
            <Route path="/pricing"   element={<PricingPage profile={profile} />} />
            <Route path="*"          element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
      <GenEMiniPopup product="digihub" />
    </div>
  );
}

export default function App() {
  return <BrowserRouter><AppShell /></BrowserRouter>;
}