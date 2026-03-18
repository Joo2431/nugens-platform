import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { hasAppAccess } from "../lib/platformAccess";

const APP = "gene";
const ACCENT = "#7c3aed";
const APP_LABEL = "Gen-E AI";

/**
 * ProtectedRoute — SSO-aware, plan-gated
 *
 * 1. If not logged in → redirect to nugens.in.net/auth with ?redirect= param
 * 2. If logged in but plan doesn't include Gen-E AI → show Access Denied
 * 3. If logged in and has access → render children
 *
 * Auth state is also watched via onAuthStateChange for session expiry.
 */
export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState("loading"); // loading | ok | no-auth | no-access
  const [plan,   setPlan]   = useState(null);

  useEffect(() => {
    let settled = false;

    async function check(session) {
      if (!session?.user) {
        setStatus("no-auth");
        return;
      }
      // Fetch plan from profiles
      try {
        const { data } = await supabase
          .from("profiles").select("plan").eq("id", session.user.id).maybeSingle();
        const p = data?.plan || "free";
        setPlan(p);
        setStatus(hasAppAccess(p, APP) ? "ok" : "no-access");
      } catch {
        setStatus("ok"); // On error, don't block
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) {
        setStatus("no-auth");
      } else if (settled) {
        check(session);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (settled) return;
      settled = true;
      await check(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (status === "loading") return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh" }}>
      <div style={{ fontWeight:800, fontSize:22, color:ACCENT, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
        {APP_LABEL}
      </div>
    </div>
  );

  if (status === "no-auth") {
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `https://nugens.in.net/auth?redirect=${returnUrl}`;
    return null;
  }

  if (status === "no-access") return (
    <div style={{
      display:"flex", alignItems:"center", justifyContent:"center",
      height:"100vh", background:"#fff", fontFamily:"'Plus Jakarta Sans',sans-serif",
    }}>
      <div style={{ maxWidth:420, textAlign:"center", padding:"40px 24px" }}>
        <div style={{ fontSize:40, marginBottom:16 }}>🔒</div>
        <div style={{ fontWeight:800, fontSize:22, color:"#111", marginBottom:8 }}>
          Access Restricted
        </div>
        <div style={{ fontSize:14, color:"#6b7280", lineHeight:1.7, marginBottom:24 }}>
          Your current plan (<strong>{plan}</strong>) doesn't include {APP_LABEL}.
          Subscribe to a NuGens suite plan or a {APP_LABEL}-specific plan to get access.
        </div>
        <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
          <a href="https://nugens.in.net/pricing"
            style={{ padding:"10px 22px", background:ACCENT, color:"#fff", borderRadius:9,
              textDecoration:"none", fontWeight:700, fontSize:13 }}>
            View Plans →
          </a>
          <a href="https://nugens.in.net/dashboard"
            style={{ padding:"10px 22px", background:"#f3f4f6", color:"#374151", borderRadius:9,
              textDecoration:"none", fontWeight:700, fontSize:13 }}>
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );

  return children;
}
