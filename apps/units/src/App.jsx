import React, { useEffect, useState, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase }       from "./lib/supabase";
import Sidebar            from "./components/Sidebar";
import ProtectedRoute     from "./components/ProtectedRoute";
import AuthPage           from "./pages/AuthPage";
import GenEMiniPopup      from "./components/GenEMiniPopup";

const Dashboard         = lazy(() => import("./pages/Dashboard"));
const ContentFeed       = lazy(() => import("./pages/ContentFeed"));
const AIGuidance        = lazy(() => import("./pages/AIGuidance"));
const BookServices      = lazy(() => import("./pages/BookServices"));
const LiveExperience    = lazy(() => import("./pages/LiveExperience"));
const EntrepreneurGuide = lazy(() => import("./pages/EntrepreneurGuide"));
const IdeaValidation    = lazy(() => import("./pages/IdeaValidation"));
const PricingPage       = lazy(() => import("./pages/PricingPage"));

const PINK = "#e8185d";

function Spinner() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#fff" }}>
      <div style={{ fontWeight:800, fontSize:22, color:"#d97706", letterSpacing:"-0.04em", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
        The<span style={{color:"#111"}}>Units</span>
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
        let { data: profData } = await supabase.from("profiles").select("*")
          .eq("id", session.user.id).maybeSingle().catch(() => ({ data: null }));
        profData = await resolveProfile(profData, session.user.id);
        finish(session.user, profData || null);
      } catch(e) {
        console.error("[Units] init:", e.message);
        finish(null, null);
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, session) => {
      if (session?.user) {
        let { data: prof } = await supabase.from("profiles").select("*")
          .eq("id", session.user.id).maybeSingle().catch(() => ({ data: null }));
        prof = await resolveProfile(prof, session.user.id);
        setUser(session.user); setProfile(prof || null);
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
      <div style={{ flex:1, overflow:"auto" }}>
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/auth"     element={<AuthPage />} />
            <Route path="/"         element={<ProtectedRoute><Dashboard         profile={profile} /></ProtectedRoute>} />
            <Route path="/feed"     element={<ProtectedRoute><ContentFeed       profile={profile} /></ProtectedRoute>} />
            <Route path="/guidance" element={<ProtectedRoute><AIGuidance        profile={profile} /></ProtectedRoute>} />
            <Route path="/book"     element={<ProtectedRoute><BookServices      profile={profile} /></ProtectedRoute>} />
            <Route path="/live"     element={<ProtectedRoute><LiveExperience    profile={profile} /></ProtectedRoute>} />
            <Route path="/guide"    element={<ProtectedRoute><EntrepreneurGuide profile={profile} /></ProtectedRoute>} />
            <Route path="/validate" element={<ProtectedRoute><IdeaValidation    profile={profile} /></ProtectedRoute>} />
            <Route path="/pricing"  element={<PricingPage profile={profile} />} />
            <Route path="*"         element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
      <GenEMiniPopup product="units" />
    </div>
  );
}

export default function App() {
  return <BrowserRouter><AppShell /></BrowserRouter>;
}