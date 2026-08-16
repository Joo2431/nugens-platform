import React from "react";

const PINK = "#e8185d";

export default function CookiePolicy() {
  return (
    <div style={{ maxWidth:760, margin:"0 auto", padding:"64px 24px 80px", fontFamily:"'Plus Jakarta Sans',sans-serif", color:"#1f2937" }}>
      <p style={{ fontSize:11, fontWeight:700, color:PINK, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:8 }}>Legal</p>
      <h1 style={{ fontSize:32, fontWeight:800, letterSpacing:"-0.03em", marginBottom:8 }}>Cookie Policy</h1>
      <p style={{ fontSize:13, color:"#9ca3af", marginBottom:36 }}>Last updated: June 2026</p>

      <div style={{ fontSize:14.5, lineHeight:1.8, color:"#374151" }}>
        <p style={{ marginBottom:20 }}>
          This Cookie Policy explains how Nugens uses cookies across nugens.in and its
          connected subdomains (gene, hyperx, digihub, units).
        </p>

        <h3 style={{ fontSize:17, fontWeight:700, marginTop:32, marginBottom:10 }}>1. What Are Cookies</h3>
        <p style={{ marginBottom:16 }}>
          Cookies are small text files stored on your device that help websites remember information
          about your visit, like whether you're signed in.
        </p>

        <h3 style={{ fontSize:17, fontWeight:700, marginTop:32, marginBottom:10 }}>2. Cookies We Use</h3>
        <table style={{ width:"100%", borderCollapse:"collapse", marginBottom:16, fontSize:13.5 }}>
          <thead>
            <tr style={{ background:"#fafafa" }}>
              <th style={{ textAlign:"left", padding:"8px 10px", border:"1px solid #e5e7eb" }}>Cookie</th>
              <th style={{ textAlign:"left", padding:"8px 10px", border:"1px solid #e5e7eb" }}>Purpose</th>
              <th style={{ textAlign:"left", padding:"8px 10px", border:"1px solid #e5e7eb" }}>Duration</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding:"8px 10px", border:"1px solid #e5e7eb" }}>sb-access-token</td>
              <td style={{ padding:"8px 10px", border:"1px solid #e5e7eb" }}>Keeps you signed in across all Nugens products (SSO)</td>
              <td style={{ padding:"8px 10px", border:"1px solid #e5e7eb" }}>Session / 7 days</td>
            </tr>
            <tr>
              <td style={{ padding:"8px 10px", border:"1px solid #e5e7eb" }}>sb-refresh-token</td>
              <td style={{ padding:"8px 10px", border:"1px solid #e5e7eb" }}>Renews your session without re-entering your password</td>
              <td style={{ padding:"8px 10px", border:"1px solid #e5e7eb" }}>30 days</td>
            </tr>
            <tr>
              <td style={{ padding:"8px 10px", border:"1px solid #e5e7eb" }}>gene-lang</td>
              <td style={{ padding:"8px 10px", border:"1px solid #e5e7eb" }}>Remembers your preferred chat language in Gen-E AI</td>
              <td style={{ padding:"8px 10px", border:"1px solid #e5e7eb" }}>Persistent (localStorage)</td>
            </tr>
          </tbody>
        </table>

        <h3 style={{ fontSize:17, fontWeight:700, marginTop:32, marginBottom:10 }}>3. Essential Only</h3>
        <p style={{ marginBottom:16 }}>
          We do not currently use third-party advertising or tracking cookies. All cookies listed
          above are strictly necessary for the Platform to function (authentication and preferences).
        </p>

        <h3 style={{ fontSize:17, fontWeight:700, marginTop:32, marginBottom:10 }}>4. Managing Cookies</h3>
        <p style={{ marginBottom:16 }}>
          You can clear cookies via your browser settings at any time. Note that doing so will sign
          you out of all Nugens products.
        </p>

        <h3 style={{ fontSize:17, fontWeight:700, marginTop:32, marginBottom:10 }}>5. Contact</h3>
        <p style={{ marginBottom:16 }}>
          Questions? Email <a href="mailto:support@nugens.in" style={{ color:PINK }}>support@nugens.in</a>.
        </p>
      </div>
    </div>
  );
}