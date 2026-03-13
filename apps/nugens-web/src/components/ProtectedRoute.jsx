import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function ProtectedRoute({ children }) {
  const [state, setState] = useState("loading");
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(session ? "auth" : "unauth");
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setState(session ? "auth" : "unauth");
    });
    return () => subscription.unsubscribe();
  }, []);

  if (state === "loading") return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontWeight: 800, fontSize: 22, color: "#e8185d", letterSpacing: "-0.04em" }}>NuGens</div>
    </div>
  );

  if (state === "unauth") return (
    <Navigate to="/auth" state={{ from: location.pathname }} replace />
  );

  return children;
}