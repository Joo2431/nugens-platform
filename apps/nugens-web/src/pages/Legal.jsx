import React from "react";
import { Link } from "react-router-dom";

const PINK = "#e8185d";
const B    = "#f0f0f0";
const LAST_UPDATED = "June 19, 2026";

function LegalLayout({ title, children }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing:border-box; }
        .legal-body { font-family:'Plus Jakarta Sans',sans-serif; color:#0a0a0a; background:#fff; }
        .legal-body h2 { font-size:18px; font-weight:800; letter-spacing:-0.02em; margin:32px 0 12px; }
        .legal-body p, .legal-body li { font-size:14.5px; color:#4b5563; line-height:1.8; }
        .legal-body ul { margin:8px 0 0 20px; }
        .legal-body li { margin-bottom:6px; }
        .legal-body a { color:${PINK}; text-decoration:none; }
        .legal-body a:hover { text-decoration:underline; }
      `}</style>

      <section style={{ padding:"64px 24px 28px", borderBottom:`1px solid ${B}` }}>
        <div style={{ maxWidth:720, margin:"0 auto" }}>
          <Link to="/" style={{ fontSize:13, color:"#9ca3af", textDecoration:"none" }}>← Back to home</Link>
          <h1 style={{
            fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800,
            fontSize:"clamp(26px,4vw,40px)", letterSpacing:"-0.035em",
            color:"#0a0a0a", marginTop:18, marginBottom:8,
          }}>{title}</h1>
          <p style={{ fontSize:13, color:"#9ca3af", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            Last updated: {LAST_UPDATED}
          </p>
        </div>
      </section>

      <section className="legal-body" style={{ padding:"40px 24px 80px" }}>
        <div style={{ maxWidth:720, margin:"0 auto" }}>
          {children}
        </div>
      </section>
    </>
  );
}

export function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy">
      <p>
        Nugens ("we", "us", "our") operates a connected ecosystem of products — Gen-E AI, HyperX, DigiHub,
        The Units, and the Nugens Portal (collectively, the "Services"). This Privacy Policy explains what
        information we collect, how we use it, and the choices you have.
      </p>

      <h2>1. Information we collect</h2>
      <ul>
        <li>Account information: name, email address, and authentication details when you sign up or sign in (including via Google OAuth).</li>
        <li>Usage data: pages visited, features used, and chat interactions within Gen-E AI, HyperX, DigiHub and The Units.</li>
        <li>Content you provide: resumes, chat messages, uploaded files, and content created in DigiHub's tools.</li>
        <li>Payment information: processed securely by Razorpay. We do not store your full card or bank details.</li>
        <li>Device and log data: IP address, browser type, and approximate location for security and analytics.</li>
      </ul>

      <h2>2. How we use your information</h2>
      <ul>
        <li>To provide, maintain, and improve the Services across all Nugens products.</li>
        <li>To personalise career guidance, learning recommendations, and content suggestions.</li>
        <li>To process payments and manage subscriptions via Razorpay.</li>
        <li>To communicate with you about your account, support requests, and product updates.</li>
        <li>To detect, investigate, and prevent fraud, abuse, or security incidents.</li>
      </ul>

      <h2>3. How we share your information</h2>
      <p>
        We do not sell your personal information. We share data only with service providers that help us
        operate the platform — including our database and authentication provider (Supabase), payment
        processor (Razorpay), and email delivery provider — and only to the extent necessary for them to
        perform their function on our behalf.
      </p>

      <h2>4. Data retention</h2>
      <p>
        We retain account and usage data for as long as your account is active, or as needed to provide the
        Services, comply with legal obligations, and resolve disputes. You may request deletion of your
        account and associated data at any time.
      </p>

      <h2>5. Your rights and choices</h2>
      <ul>
        <li>Access, correct, or update your account information from your Dashboard.</li>
        <li>Request a copy of your data or deletion of your account by contacting us.</li>
        <li>Opt out of non-essential email communications at any time.</li>
      </ul>

      <h2>6. Security</h2>
      <p>
        We use industry-standard safeguards — including encrypted connections and access controls — to
        protect your data. No method of transmission or storage is 100% secure, so we cannot guarantee
        absolute security.
      </p>

      <h2>7. Children's privacy</h2>
      <p>
        Our Services are not directed to children under 13, and we do not knowingly collect personal
        information from children under 13.
      </p>

      <h2>8. Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Material changes will be reflected by updating
        the "Last updated" date above.
      </p>

      <h2>9. Contact us</h2>
      <p>
        Questions about this Privacy Policy can be sent to{" "}
        <a href="mailto:support@nugens.in.net">support@nugens.in.net</a>.
      </p>
    </LegalLayout>
  );
}

export function TermsOfUse() {
  return (
    <LegalLayout title="Terms of Use">
      <p>
        These Terms of Use ("Terms") govern your access to and use of Gen-E AI, HyperX, DigiHub, The Units,
        and the Nugens Portal (collectively, the "Services"), operated by Nugens. By creating an account or
        using any Nugens product, you agree to these Terms.
      </p>

      <h2>1. Using the Services</h2>
      <p>
        You must be at least 13 years old to use the Services. You're responsible for keeping your account
        credentials secure and for all activity that occurs under your account. One Nugens account provides
        access to all Nugens products according to your active subscription plan.
      </p>

      <h2>2. Subscriptions and payments</h2>
      <ul>
        <li>Paid plans are billed in advance and processed securely through Razorpay.</li>
        <li>Subscriptions renew automatically unless cancelled before the renewal date from your Dashboard.</li>
        <li>Refunds are issued at our discretion and according to the refund terms described on our Support page.</li>
      </ul>

      <h2>3. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Services for any unlawful purpose or to violate any applicable law.</li>
        <li>Upload content you don't have the right to share, or that infringes another party's rights.</li>
        <li>Attempt to disrupt, reverse-engineer, or gain unauthorised access to the Services.</li>
        <li>Use automated means to scrape or extract data from the Services without our written permission.</li>
        <li>Misuse AI features (Gen-E AI, DigiHub content tools) to generate harmful, abusive, or illegal content.</li>
      </ul>

      <h2>4. Content and ownership</h2>
      <p>
        You retain ownership of the content you upload or create using the Services (such as resumes, chat
        input, and DigiHub marketing content). You grant Nugens a limited licence to process and store this
        content solely to provide and improve the Services. Nugens retains all rights to the platform itself,
        including its design, code, and underlying technology.
      </p>

      <h2>5. AI-generated content</h2>
      <p>
        Gen-E AI and DigiHub use AI models to generate career guidance, resumes, and marketing content.
        AI-generated output may contain errors or inaccuracies. You're responsible for reviewing any
        AI-generated content before relying on or publishing it.
      </p>

      <h2>6. Termination</h2>
      <p>
        You may stop using the Services and close your account at any time. We may suspend or terminate
        access to the Services if you violate these Terms or misuse the platform.
      </p>

      <h2>7. Disclaimers and limitation of liability</h2>
      <p>
        The Services are provided "as is" without warranties of any kind. To the fullest extent permitted by
        law, Nugens is not liable for indirect, incidental, or consequential damages arising from your use of
        the Services.
      </p>

      <h2>8. Changes to these Terms</h2>
      <p>
        We may update these Terms from time to time. Continued use of the Services after changes take effect
        constitutes acceptance of the revised Terms.
      </p>

      <h2>9. Contact us</h2>
      <p>
        Questions about these Terms can be sent to{" "}
        <a href="mailto:support@nugens.in.net">support@nugens.in.net</a>.
      </p>
    </LegalLayout>
  );
}

export function CookiePolicy() {
  return (
    <LegalLayout title="Cookie Policy">
      <p>
        This Cookie Policy explains how Nugens uses cookies and similar technologies across Gen-E AI, HyperX,
        DigiHub, The Units, and the Nugens Portal.
      </p>

      <h2>1. What are cookies</h2>
      <p>
        Cookies are small text files stored on your device that help websites remember information about
        your visit, such as your login session and preferences.
      </p>

      <h2>2. How we use cookies</h2>
      <ul>
        <li><strong>Essential cookies:</strong> required for sign-in and to keep you authenticated across all Nugens products via single sign-on.</li>
        <li><strong>Preference cookies:</strong> remember settings such as your selected language or theme.</li>
        <li><strong>Analytics cookies:</strong> help us understand how the Services are used so we can improve them.</li>
      </ul>

      <h2>3. Cross-product sign-on</h2>
      <p>
        Because Gen-E AI, HyperX, DigiHub, and The Units share a single Nugens account, we use a
        cross-subdomain session cookie so that signing in once gives you access to every product you're
        subscribed to, without needing to sign in again on each one.
      </p>

      <h2>4. Managing cookies</h2>
      <p>
        Most browsers let you control or delete cookies through their settings. Note that blocking essential
        cookies may prevent sign-in and other core features from working correctly.
      </p>

      <h2>5. Changes to this policy</h2>
      <p>
        We may update this Cookie Policy from time to time. Material changes will be reflected by updating
        the "Last updated" date above.
      </p>

      <h2>6. Contact us</h2>
      <p>
        Questions about this Cookie Policy can be sent to{" "}
        <a href="mailto:support@nugens.in.net">support@nugens.in.net</a>.
      </p>
    </LegalLayout>
  );
}
