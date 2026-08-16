import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

/**
 * ProtectedRoute for nugens-web
 * Uses internal /auth route (nugens-web has its own auth page — it IS the SSO hub).
 */
export default function ProtectedRoute({ children }) {
  const [session, setSession] = useState(undefined);
  const location = useLocation();

  useEffect(() => {
    let resolved = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s ?? null); resolved = true;
    });
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!resolved) setSession(s ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"inherit" }}>
      <div style={{ fontWeight:800, fontSize:22, color:"#e8185d", letterSpacing:"-0.04em", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Nugens</div>
    </div>
  );

  if (!session) return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  return children;
}
