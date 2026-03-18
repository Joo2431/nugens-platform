import { useEffect } from "react";

/**
 * AuthPage — Sub-app redirect
 * All authentication is centralised at nugens.in.net/auth.
 * This page redirects there immediately, passing current origin as ?redirect=
 * so the user is returned here after login.
 */
export default function AuthPage() {
  useEffect(() => {
    const returnUrl = encodeURIComponent(window.location.origin);
    window.location.replace(`https://nugens.in.net/auth?redirect=${returnUrl}`);
  }, []);

  return (
    <div style={{
      display:"flex", alignItems:"center", justifyContent:"center",
      height:"100vh", background:"#fff",
      fontFamily:"'Plus Jakarta Sans',sans-serif",
    }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontWeight:800, fontSize:22, color:"#e8185d", marginBottom:8 }}>
          Redirecting to Nugens login…
        </div>
        <div style={{ fontSize:13, color:"#9ca3af" }}>
          All NuGens apps share one account
        </div>
      </div>
    </div>
  );
}
