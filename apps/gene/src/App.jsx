import React, { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { supabase } from "./lib/supabase";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import AuthPage from "./pages/AuthPage";

const GenEChat          = lazy(() => import("./pages/GenEChat"));
const ResumesPage       = lazy(() => import("./pages/ResumesPage"));
const JobTrackerPage    = lazy(() => import("./pages/JobTrackerPage"));
const PricingPage       = lazy(() => import("./pages/PricingPage"));
const BusinessDashboard = lazy(() => import("./pages/BusinessDashboard"));

const PINK = "#e8185d";

function Spinner() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#fff" }}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
        <div style={{ width:42, height:42, borderRadius:13, background:`linear-gradient(135deg,${PINK},#c4134e)`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:13, color:"#fff", letterSpacing:"-0.03em", boxShadow:`0 8px 24px ${PINK}40`, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>GE</div>
        <div style={{ color:"#d0d0d0", fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Loading…</div>
      </div>
    </div>
  );
}

function AppShell() {
  const location = useLocation();
  const [user,         setUser]        = useState(null);
  const [profile,      setProfile]     = useState(null);
  const [ready,        setReady]       = useState(false);
  const [modeOverride, setModeOverride]= useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isChatRoute  = location.pathname === "/" || location.pathname.startsWith("/chat");
  const isFullscreen = ["/pricing", "/auth"].some(p => location.pathname.startsWith(p));

  const fetchProfile = async (uid) => {
    try {
      const { data } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
      if (data) {
        if (!data.full_name) {
          const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
          const meta = session?.user?.user_metadata;
          const name = meta?.full_name || meta?.name || session?.user?.email?.split("@")[0] || "";
          setProfile(name ? { ...data, full_name: name } : data);
        } else {
          setProfile(data);
        }
      }
    } catch(e) { console.error("[Gen-E] fetchProfile:", e.message); }
  };

  useEffect(() => {
    let settled = false;
    const hardTimeout = setTimeout(() => {
      if (!settled) { settled = true; setReady(true); }
    }, 6000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (settled) return;
      settled = true;
      clearTimeout(hardTimeout);
      setUser(session?.user ?? null);
      setReady(true);
      if (session?.user) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else { setProfile(null); setModeOverride(null); }
    });

    return () => { clearTimeout(hardTimeout); subscription.unsubscribe(); };
  }, []);

  // Re-fetch profile on window focus (catches plan upgrades done in other tabs)
  useEffect(() => {
    const h = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) fetchProfile(session.user.id);
    };
    window.addEventListener("focus", h);
    return () => window.removeEventListener("focus", h);
  }, []);

  if (!ready) return <Spinner />;

  const signOut = async () => {
    setModeOverride(null);
    await supabase.auth.signOut();
    window.location.href = "https://nugens.in.net/auth";
  };

  const dbUserType = profile?.user_type || "individual";
  const userType   = modeOverride ?? dbUserType;

  // Fullscreen routes
  if (isFullscreen) return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/auth"    element={<AuthPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="*"        element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );

  // Chat routes — GenEChat manages its own sidebar + AppSwitcherBar
  if (isChatRoute) return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/" element={
          <ProtectedRoute>
            {userType === "business"
              ? <Navigate to="/business" replace />
              : <GenEChat profile={profile} />}
          </ProtectedRoute>
        } />
        <Route path="/chat" element={<ProtectedRoute><GenEChat profile={profile} /></ProtectedRoute>} />
        <Route path="*"     element={<Navigate to="/chat" replace />} />
      </Routes>
    </Suspense>
  );

  // Other routes: outer Sidebar
  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#f8f9fb", flexDirection:"column" }}>
      {/* Mobile header for non-chat pages (resumes, jobs, business dashboard) */}
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:"#fff", borderBottom:"1px solid #f0f0f0", position:"sticky", top:0, zIndex:100, flexShrink:0 }}>
        <button onClick={()=>setMobileMenuOpen(true)}
          style={{ background:"none", border:"1px solid #edf0f3", borderRadius:8, padding:"6px 10px", cursor:"pointer", fontSize:18, color:"#e8185d", lineHeight:1 }}>
          ☰
        </button>
        <span style={{ fontWeight:800, fontSize:15, color:"#0a0a0a", letterSpacing:"-0.025em" }}>
          Gen-<span style={{color:"#e8185d"}}>E</span>
        </span>
        <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
          {["HyperX","DigiHub","Units"].map((a,i) => {
            const urls = ["https://hyperx.nugens.in.net","https://digihub.nugens.in.net","https://units.nugens.in.net"];
            const colors = ["#e8185d","#0284c7","#d97706"];
            return <a key={a} href={urls[i]} style={{ fontSize:10, fontWeight:700, color:colors[i], textDecoration:"none", padding:"3px 8px", borderRadius:20, border:`1px solid ${colors[i]}25`, background:`${colors[i]}08` }}>{a}</a>;
          })}
        </div>
      </div>
      <div style={{ display:"flex", flex:1 }}>
      <Sidebar
        userType={userType}
        dbUserType={dbUserType}
        profile={profile}
        user={user}
        onSignOut={signOut}
        onSwitchMode={(m) => setModeOverride(m)}
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <div style={{ flex:1, minWidth:0, overflowX:"hidden", overflow:"auto" }}>
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/resumes"  element={<ProtectedRoute><ResumesPage /></ProtectedRoute>} />
            <Route path="/jobs"     element={<ProtectedRoute><JobTrackerPage /></ProtectedRoute>} />
            <Route path="/business" element={<ProtectedRoute><BusinessDashboard profile={profile} /></ProtectedRoute>} />

            <Route path="/skill-gap"          element={<Navigate to="/chat?t=skill_gap" replace />} />
            <Route path="/simulate"           element={<Navigate to="/chat?t=simulate"  replace />} />
            <Route path="/roadmap"            element={<Navigate to="/chat?t=roadmap"   replace />} />
            <Route path="/business/jd"        element={<Navigate to="/chat?t=jd"        replace />} />
            <Route path="/business/hiring"    element={<Navigate to="/chat?t=hiring"    replace />} />
            <Route path="/business/team"      element={<Navigate to="/chat?t=team"      replace />} />
            <Route path="/business/workforce" element={<Navigate to="/chat?t=workforce" replace />} />
            <Route path="/business/salary"    element={<Navigate to="/chat?t=salary"    replace />} />
            <Route path="/business/interview" element={<Navigate to="/chat?t=interview" replace />} />

            <Route path="/pricing" element={<PricingPage />} />
            <Route path="*" element={<Navigate to={userType === "business" ? "/business" : "/chat"} replace />} />
          </Routes>
        </Suspense>
      </div>
      </div>
    </div>
  );
}

export default function App() {
  return <BrowserRouter><AppShell /></BrowserRouter>;
}