/**
 * ProtectedRoute — Fixed version
 *
 * The old ProtectedRoute did its own getSession() call which:
 * 1. Showed "NuGens" while loading (wrong branding)
 * 2. Could hang forever (same cookie storage timing issue)
 * 3. Was redundant — App.jsx already checks auth before rendering
 *
 * Fix: App.jsx only renders children when `user` is set.
 * ProtectedRoute just passes children through immediately.
 * If somehow a user lands here unauthenticated, redirect to login.
 */
import { useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function ProtectedRoute({ children }) {
  // Auth is handled by App.jsx — if we're rendering here, user is logged in.
  // This effect just handles the edge case of session expiry mid-session.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) {
        // Session expired — redirect to login
        const returnUrl = encodeURIComponent(window.location.href);
        window.location.href = `https://nugens.in.net/auth?redirect=${returnUrl}`;
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // No loading spinner — App.jsx already waited for auth before rendering this
  return children;
}