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



// Get display name: DB profile first, then fresh JWT metadata, then email prefix.
// Writes back to DB once so future loads are fast.
async function resolveProfile(prof, userId) {
  // Get fresh user object — user_metadata is in the JWT, always available
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
  const meta = user?.user_metadata || {};
  const name = prof?.full_name?.trim()
    || meta.full_name || meta.name
    || user?.email?.split("@")[0] || "";

  if (!name) return prof || null;

  // Patch DB once if it was empty (fire-and-forget)
  if ((!prof?.full_name?.trim()) && userId) {
    supabase.from("profiles").update({ full_name: name })
      .eq("id", userId)
      .then(({ error: e }) => { if (e) console.warn("[profile] name patch:", e.message); });
  }

  return prof ? { ...prof, full_name: name } : null;
}

function AppShell() {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [ready,   setReady]   = useState(false);

  useEffect(() => {
    let settled = false;
    const hardTimeout = setTimeout(() => {
      if (!settled) { settled = true; setReady(true); }
    }, 6000);

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
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { finish(null, null); return; }
        let prof = await Promise.race([
          supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle()
            .then(({ data }) => data || null).catch(() => null),
          new Promise(r => setTimeout(() => r(null), 4000)),
        ]);
        prof = await resolveProfile(prof, session.user.id);
        finish(session.user, prof);
      } catch(err) {
        console.error("[DigiHub] init:", err.message);
        finish(null, null);
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        let { data: prof } = await supabase.from("profiles").select("*")
          .eq("id", session.user.id).maybeSingle().catch(() => ({ data: null }));
        prof = await resolveProfile(prof, session.user.id);
        setUser(session.user);
        setProfile(prof || null);
        if (!settled) finish(session.user, prof);
      } else {
        setUser(null); setProfile(null);
        if (!settled) finish(null, null);
      }
    });

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
      <Sidebar profile={profile} user={user} onSignOut={signOut} />
      <div style={{ flex:1, overflow:"auto", minWidth:0 }}>
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/auth"      element={<AuthPage />} />
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