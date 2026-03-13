import React from "react";
import { Link } from "react-router-dom";

const PURPLE = "#7c3aed";
const PINK   = "#e8185d";
const B      = "#1e1e2e";

function CertCard({ title, course, date, color, issued }) {
  return (
    <div style={{
      background: "#0d0d1a", border: `1px solid ${issued ? color + "40" : B}`,
      borderRadius: 14, overflow: "hidden", opacity: issued ? 1 : 0.5,
    }}>
      {/* Cert preview */}
      <div style={{
        background: `linear-gradient(135deg, ${color}12, #080814 60%)`,
        borderBottom: `1px solid ${issued ? color + "25" : B}`,
        padding: "28px 24px", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: color + "08" }} />
        <div style={{ position: "absolute", bottom: -10, left: 60, width: 60, height: 60, borderRadius: "50%", background: color + "06" }} />

        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: color, marginBottom: 10 }}>Certificate of Completion</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.025em", lineHeight: 1.3, maxWidth: 220 }}>{title}</div>
        <div style={{ fontSize: 11, color: "#555", marginTop: 8 }}>NuGens · HyperX Learning</div>

        {/* Seal */}
        <div style={{ position: "absolute", right: 24, bottom: 24, width: 44, height: 44, borderRadius: "50%", border: `2px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 20, color: color + "60" }}>◈</div>
        </div>
      </div>

      <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "#888" }}>{course}</div>
          <div style={{ fontSize: 11.5, color: "#444", marginTop: 2 }}>{issued ? `Issued ${date}` : "Complete course to earn"}</div>
        </div>
        {issued ? (
          <button style={{ padding: "6px 14px", borderRadius: 7, background: color + "18", border: `1px solid ${color}30`, color: color, fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
            Download
          </button>
        ) : (
          <Link to="/courses" style={{ padding: "6px 14px", borderRadius: 7, background: "#1a1a2a", color: "#555", fontSize: 11.5, fontWeight: 600, textDecoration: "none" }}>
            Start →
          </Link>
        )}
      </div>
    </div>
  );
}

export default function Certificates({ profile }) {
  const plan = profile?.plan || "free";

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", padding: "32px 28px 80px", background: "#080814", minHeight: "100vh" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @media (max-width: 700px) { .cert-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontWeight: 800, fontSize: "clamp(20px,2.5vw,26px)", letterSpacing: "-0.03em", color: "#fff", marginBottom: 4 }}>Certificates</h1>
        <p style={{ fontSize: 13.5, color: "#555" }}>Earn verifiable proof of your professional skills.</p>
      </div>

      {plan === "free" ? (
        <div style={{ background: `${PURPLE}12`, border: `1px solid ${PURPLE}30`, borderRadius: 14, padding: "28px 24px", marginBottom: 28, textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>◇</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Unlock certificates with Premium</div>
          <div style={{ fontSize: 13.5, color: "#555", maxWidth: 380, margin: "0 auto 20px" }}>Complete courses and earn certificates you can add to your LinkedIn, resume, and portfolio.</div>
          <Link to="/pricing" style={{ display: "inline-block", padding: "10px 24px", background: PURPLE, color: "#fff", borderRadius: 9, fontWeight: 700, fontSize: 13.5, textDecoration: "none" }}>
            Upgrade to Premium →
          </Link>
        </div>
      ) : null}

      <div className="cert-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        <CertCard title="Professional Mindset Shift" course="PM-001" date="Mar 2026" color="#16a34a" issued={plan !== "free"} />
        <CertCard title="Workplace Communication Mastery" course="WC-001" date="" color={PINK} issued={false} />
        <CertCard title="Salary Negotiation" course="SN-001" date="" color="#0284c7" issued={false} />
        <CertCard title="Interview Mastery" course="IP-001" date="" color="#d97706" issued={false} />
      </div>

      {/* How it works */}
      <div style={{ marginTop: 48 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#444", marginBottom: 20 }}>How certificates work</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {[
            { n: "01", t: "Complete the course", d: "Watch all lessons and pass the end-of-course assessment with 70%+." },
            { n: "02", t: "Certificate generated", d: "Your certificate is automatically created with a unique verification ID." },
            { n: "03", t: "Share everywhere", d: "Download as PDF or share directly to LinkedIn with one click." },
          ].map(s => (
            <div key={s.n} style={{ background: "#0d0d1a", border: `1px solid ${B}`, borderRadius: 10, padding: "18px 18px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#333", marginBottom: 8 }}>{s.n}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{s.t}</div>
              <div style={{ fontSize: 12.5, color: "#555", lineHeight: 1.65 }}>{s.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
