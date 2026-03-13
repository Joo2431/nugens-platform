import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function ProtectedRoute({ children }) {
  const [session, setSession] = useState(undefined); // undefined = still loading
  const location = useLocation();

  useEffect(() => {
    let resolved = false;

    // onAuthStateChange fires first for OAuth hash tokens
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s ?? null);
      resolved = true;
    });

    // Fallback for regular sessions (no hash token)
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!resolved) setSession(s ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"inherit" }}>
      <div style={{ fontWeight:800, fontSize:22, color:"#e8185d", letterSpacing:"-0.04em", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>NuGens</div>
    </div>
  );

  if (!session) return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  return children;
}
