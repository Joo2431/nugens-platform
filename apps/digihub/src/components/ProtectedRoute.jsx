import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState("loading"); // loading | ok | redirect

  useEffect(() => {
    let settled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!settled) {
        settled = true;
        setStatus(session ? "ok" : "redirect");
      } else {
        setStatus(session ? "ok" : "redirect");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!settled) {
        settled = true;
        setStatus(session ? "ok" : "redirect");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (status === "loading") return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"inherit" }}>
      <div style={{ fontWeight:800, fontSize:22, color:"#e8185d", letterSpacing:"-0.04em", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>NuGens</div>
    </div>
  );

  if (status === "redirect") {
    // Redirect to central NuGens login with current URL as return destination
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `https://nugens.in.net/auth?redirect=${returnUrl}`;
    return null;
  }

  return children;
}
