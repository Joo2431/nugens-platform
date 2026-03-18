import React, { Suspense, lazy, useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { supabase } from "./lib/supabase";
import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import GenEMiniPopup from "./components/GenEMiniPopup";

const Dashboard    = lazy(() => import("./pages/Dashboard"));
const CoursesPage  = lazy(() => import("./pages/Courses"));
const CoursePlayer = lazy(() => import("./pages/CoursePlayer"));
const Certificates = lazy(() => import("./pages/Certificates"));
const Pricing      = lazy(() => import("./pages/Pricing"));
const AdminPanel   = lazy(() => import("./pages/AdminPanel"));

const PINK = "#e8185d";
const ADMIN_EMAILS = ["jeromjoseph31@gmail.com", "jeromjoshep.23@gmail.com"];

function Spinner() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#fff",
        fontFamily: "'Plus Jakarta Sans',sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontWeight: 800,
            fontSize: 26,
            color: PINK,
            letterSpacing: "-0.04em",
            marginBottom: 8,
          }}
        >
          Hyper<span style={{ color: "#111" }}>X</span>
        </div>
        <div
          style={{
            width: 32,
            height: 3,
            background: PINK,
            borderRadius: 2,
            margin: "0 auto",
            opacity: 0.3,
          }}
        />
      </div>
    </div>
  );
}

// ── PROFILE FETCHER ───────────────────────────────────────────────────────────
// FIX 3: Added explicit error logging on both query paths so failures are
// visible in the console instead of silently returning null. This makes it
// immediately obvious if the issue is RLS, a missing row, or an ID mismatch.
//
// The UPDATE attempt has been removed entirely — anon key cannot UPDATE a row
// it doesn't own (RLS blocks it). Email-based lookup returns the row as-is;
// admin checks use email directly so the plan column value is still correct.
async function fetchProfile(userId, userEmail) {
  try {
    // 1. Try by auth user ID (works when IDs already match)
    const { data: byId, error: idErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (idErr) {
      console.error("[HyperX] fetchProfile by ID failed:", idErr.message, idErr);
    }
    if (byId) return byId;

    // 2. Fallback: try by email (handles OAuth UUID mismatch)
    if (!userEmail) return null;

    const { data: byEmail, error: emailErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", userEmail)
      .maybeSingle();

    if (emailErr) {
      console.error(
        "[HyperX] fetchProfile by email failed:",
        emailErr.message,
        emailErr
      );
    }

    // Return as-is — do NOT try to UPDATE the id (RLS blocks this with anon key)
    return byEmail || null;
  } catch (e) {
    console.error("[HyperX] fetchProfile unexpected error:", e.message);
    return null;
  }
}

// Build a minimal profile from auth metadata when the DB row doesn't exist.
// Used as a last-resort fallback — once Bug 1 (detectSessionInUrl) is fixed
// the profile fetch should succeed for all users and this path should rarely fire.
function profileFromAuth(authUser) {
  const email = (authUser.email || "").toLowerCase().trim();
  return {
    id: authUser.id,
    email,
    full_name:
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      email.split("@")[0] ||
      "User",
    // Admin emails get admin plan even without a DB row
    plan: ADMIN_EMAILS.includes(email) ? "admin" : "free",
    user_type: "individual",
  };
}

function AppShell() {
  const location = useLocation();
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [ready, setReady]     = useState(false);
  const isCoursePlayer = location.pathname.match(/^\/courses\/.+/);

  useEffect(() => {
    let settled = false;

    // 6s hard timeout — app ALWAYS renders regardless of auth state
    const hardTimeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        console.warn("[HyperX] forced ready after timeout");
        setReady(true);
      }
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
        // getUser() = server-verified JWT, most reliable method
        const {
          data: { user: authUser },
          error,
        } = await supabase.auth.getUser();

        if (authUser && !error) {
          // Race profile fetch against 4s timeout
          const prof = await Promise.race([
            fetchProfile(authUser.id, authUser.email),
            new Promise((r) => setTimeout(() => r(null), 4000)),
          ]);
          finish(authUser, prof || profileFromAuth(authUser));
          return;
        }

        // Fallback: getSession
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          const prof = await Promise.race([
            fetchProfile(session.user.id, session.user.email),
            new Promise((r) => setTimeout(() => r(null), 4000)),
          ]);
          finish(session.user, prof || profileFromAuth(session.user));
          return;
        }

        finish(null, null);
      } catch (e) {
        console.error("[HyperX] init error:", e.message);
        finish(null, null);
      }
    }

    // onAuthStateChange fires even when getUser is slow
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const prof = await fetchProfile(session.user.id, session.user.email);
        const finalProf = prof || profileFromAuth(session.user);
        setUser(session.user);
        setProfile(finalProf);
        if (!settled) finish(session.user, finalProf);
      } else {
        setUser(null);
        setProfile(null);
        if (!settled) finish(null, null);
      }
    });

    init();
    return () => {
      clearTimeout(hardTimeout);
      subscription.unsubscribe();
    };
  }, []);

  if (!ready) return <Spinner />;

  if (isCoursePlayer)
    return (
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route
            path="/courses/:id"
            element={
              <ProtectedRoute>
                <CoursePlayer profile={profile} />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8f9fb" }}>
      <Sidebar profile={profile} />
      <div style={{ flex: 1, minWidth: 0, overflowX: "hidden" }}>
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard profile={profile} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses"
              element={
                <ProtectedRoute>
                  <CoursesPage profile={profile} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/certs"
              element={
                <ProtectedRoute>
                  <Certificates profile={profile} />
                </ProtectedRoute>
              }
            />
            <Route path="/pricing" element={<Pricing profile={profile} />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminPanel profile={profile} />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
      <GenEMiniPopup product="hyperx" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}