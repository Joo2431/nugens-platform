import React from "react";

const PINK = "#e8185d";

export default function PrivacyPolicy() {
  return (
    <div style={{ maxWidth:760, margin:"0 auto", padding:"64px 24px 80px", fontFamily:"'Plus Jakarta Sans',sans-serif", color:"#1f2937" }}>
      <p style={{ fontSize:11, fontWeight:700, color:PINK, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:8 }}>Legal</p>
      <h1 style={{ fontSize:32, fontWeight:800, letterSpacing:"-0.03em", marginBottom:8 }}>Privacy Policy</h1>
      <p style={{ fontSize:13, color:"#9ca3af", marginBottom:36 }}>Last updated: June 2026</p>

      <div style={{ fontSize:14.5, lineHeight:1.8, color:"#374151" }}>
        <p style={{ marginBottom:20 }}>
          Nugens ("we", "us", "our") operates the Gen-E AI, HyperX, DigiHub, and Units products
          (collectively, the "Platform"). This Privacy Policy explains what information we collect,
          how we use it, and the choices you have.
        </p>

        <h3 style={{ fontSize:17, fontWeight:700, marginTop:32, marginBottom:10 }}>1. Information We Collect</h3>
        <p style={{ marginBottom:12 }}>We collect information you provide directly, including:</p>
        <ul style={{ paddingLeft:20, marginBottom:16 }}>
          <li>Account details — name, email address, password (encrypted)</li>
          <li>Profile information — resume content, career goals, business details</li>
          <li>Payment information — processed securely via Razorpay; we do not store card details</li>
          <li>Content you create — chat conversations, generated resumes, marketing content, bookings</li>
        </ul>

        <h3 style={{ fontSize:17, fontWeight:700, marginTop:32, marginBottom:10 }}>2. How We Use Your Information</h3>
        <ul style={{ paddingLeft:20, marginBottom:16 }}>
          <li>To provide and improve our AI-powered career, learning, and marketing tools</li>
          <li>To process payments and manage subscriptions</li>
          <li>To send service updates, security alerts, and (if opted in) product news</li>
          <li>To detect and prevent fraud or abuse of the Platform</li>
        </ul>

        <h3 style={{ fontSize:17, fontWeight:700, marginTop:32, marginBottom:10 }}>3. Data Sharing</h3>
        <p style={{ marginBottom:16 }}>
          We do not sell your personal data. We share data only with service providers necessary
          to operate the Platform — including Supabase (database & authentication), OpenAI and Groq
          (AI processing), Razorpay (payments), and Resend (email delivery) — each bound by their
          own data protection obligations.
        </p>

        <h3 style={{ fontSize:17, fontWeight:700, marginTop:32, marginBottom:10 }}>4. Data Security</h3>
        <p style={{ marginBottom:16 }}>
          We use industry-standard encryption (SSL/TLS) for data in transit and rely on Supabase's
          row-level security to restrict access to your data. Despite these measures, no system is
          100% secure, and we cannot guarantee absolute security.
        </p>

        <h3 style={{ fontSize:17, fontWeight:700, marginTop:32, marginBottom:10 }}>5. Your Rights</h3>
        <p style={{ marginBottom:16 }}>
          You may access, update, or delete your account data at any time from your Dashboard.
          To request full account deletion, email{" "}
          <a href="mailto:support@nugens.in" style={{ color:PINK }}>support@nugens.in</a>.
        </p>

        <h3 style={{ fontSize:17, fontWeight:700, marginTop:32, marginBottom:10 }}>6. Cookies</h3>
        <p style={{ marginBottom:16 }}>
          We use essential cookies to keep you signed in across our products. See our{" "}
          <a href="/cookie-policy" style={{ color:PINK }}>Cookie Policy</a> for details.
        </p>

        <h3 style={{ fontSize:17, fontWeight:700, marginTop:32, marginBottom:10 }}>7. Contact</h3>
        <p style={{ marginBottom:16 }}>
          Questions about this policy? Email{" "}
          <a href="mailto:support@nugens.in" style={{ color:PINK }}>support@nugens.in</a>.
        </p>
      </div>
    </div>
  );
}