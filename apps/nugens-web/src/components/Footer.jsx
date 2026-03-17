import React from "react";
import { Link } from "react-router-dom";

const PINK = "#e8185d";
const B    = "#1e1e1e";

const PRODUCTS = [
  { label: "Gen-E AI",  sub: "Career intelligence",   href: "https://gene.nugens.in.net",    dot: "#7c3aed" },
  { label: "HyperX",   sub: "Learning platform",      href: "https://hyperx.nugens.in.net",  dot: PINK },
  { label: "DigiHub",  sub: "Digital marketing",      href: "https://digihub.nugens.in.net", dot: "#0284c7" },
  { label: "Units",    sub: "Event production",        href: "https://units.nugens.in.net",   dot: "#d97706" },
];

const COMPANY = [
  { label: "About Us",    to: "/about"   },
  { label: "Careers",     to: "/careers" },
  { label: "Blog",        to: "/blog"    },
  { label: "Contact Us",  to: "/contact" },
];

const RESOURCES = [
  { label: "Pricing",         to: "/pricing"  },
  { label: "Support & FAQ",   to: "/support"  },
  { label: "Dashboard",       to: "/dashboard"},
  { label: "Sign In",         to: "/auth"     },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={{ background:"#0a0a0a", color:"#fff", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .ft-link {
          color:#666; text-decoration:none; font-size:13px;
          transition:color 0.15s; line-height:2.1; display:block;
          font-family:'Plus Jakarta Sans',sans-serif;
        }
        .ft-link:hover { color:#fff; }
        .ft-col-title {
          font-size:10.5px; font-weight:700; letter-spacing:0.1em;
          text-transform:uppercase; color:#444; margin-bottom:14px;
          font-family:'Plus Jakarta Sans',sans-serif;
        }
        .ft-social {
          width:34px; height:34px; border:1px solid #222; border-radius:8px;
          display:flex; align-items:center; justify-content:center;
          color:#555; font-size:11px; font-weight:700; text-decoration:none;
          transition:all 0.15s; font-family:'Plus Jakarta Sans',sans-serif;
        }
        .ft-social:hover { border-color:${PINK}; color:${PINK}; background:rgba(232,24,93,0.06); }
        .ft-bottom-link { color:#444; font-size:11.5px; text-decoration:none; transition:color 0.15s; }
        .ft-bottom-link:hover { color:#888; }
        .ft-prod-row {
          display:flex; align-items:center; gap:10px; padding:9px 0;
          text-decoration:none; border-bottom:1px solid #141414;
          transition:opacity 0.15s;
        }
        .ft-prod-row:hover { opacity:0.8; }
        @media(max-width:768px) { .ft-grid { grid-template-columns:1fr 1fr !important; } .ft-brand { grid-column:span 2; } }
        @media(max-width:480px) { .ft-grid { grid-template-columns:1fr !important; } .ft-brand { grid-column:span 1; } }
      `}</style>

      {/* Pink top line */}
      <div style={{ height:2, background:`linear-gradient(90deg, transparent, ${PINK} 30%, #ff8abf 70%, transparent)` }} />

      <div style={{ maxWidth:1200, margin:"0 auto", padding:"52px 24px 44px" }}>
        <div className="ft-grid" style={{ display:"grid", gridTemplateColumns:"1.8fr 1fr 1fr 1fr", gap:"40px 32px", alignItems:"start" }}>

          {/* ── BRAND ── */}
          <div className="ft-brand">
            <div style={{ marginBottom:14 }}>
              <span style={{
                fontWeight:800, fontSize:22, fontStyle:"italic",
                background:`linear-gradient(90deg, ${PINK}, #ff8abf)`,
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                letterSpacing:"-0.03em", fontFamily:"'Plus Jakarta Sans',sans-serif",
              }}>NUGENS</span>
            </div>
            <p style={{ fontSize:13, color:"#555", lineHeight:1.75, maxWidth:240, marginBottom:20 }}>
              AI-powered career, learning, and business growth — all under one account.
            </p>

            {/* Products quick links */}
            <div style={{ marginBottom:20 }}>
              {PRODUCTS.map(p => (
                <a key={p.label} href={p.href} target="_blank" rel="noreferrer" className="ft-prod-row">
                  <div style={{ width:7, height:7, borderRadius:"50%", background:p.dot, flexShrink:0 }} />
                  <div>
                    <span style={{ fontSize:12.5, fontWeight:600, color:"#ccc", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{p.label}</span>
                    <span style={{ fontSize:11, color:"#444", marginLeft:8 }}>{p.sub}</span>
                  </div>
                  <span style={{ marginLeft:"auto", fontSize:11, color:"#333" }}>↗</span>
                </a>
              ))}
            </div>

            {/* Socials */}
            <div style={{ display:"flex", gap:7 }}>
              {[
                { l:"𝕏",  h:"https://x.com/nugens"       },
                { l:"in", h:"https://linkedin.com/company/nugens" },
                { l:"IG", h:"https://instagram.com/nugens" },
                { l:"YT", h:"https://youtube.com/@nugens" },
              ].map(s => (
                <a key={s.l} href={s.h} target="_blank" rel="noreferrer" className="ft-social">{s.l}</a>
              ))}
            </div>
          </div>

          {/* ── COMPANY ── */}
          <div>
            <div className="ft-col-title">Company</div>
            {COMPANY.map(item => (
              <Link key={item.label} to={item.to} className="ft-link">{item.label}</Link>
            ))}
          </div>

          {/* ── RESOURCES ── */}
          <div>
            <div className="ft-col-title">Resources</div>
            {RESOURCES.map(item => (
              <Link key={item.label} to={item.to} className="ft-link">{item.label}</Link>
            ))}
          </div>

          {/* ── CONTACT ── */}
          <div>
            <div className="ft-col-title">Get in touch</div>
            <a href="mailto:hello@nugens.in" className="ft-link" style={{ display:"flex", alignItems:"center", gap:7, color:"#888" }}>
              <span style={{ fontSize:14 }}>✉</span> hello@nugens.in
            </a>
            <a href="mailto:support@nugens.in" className="ft-link" style={{ display:"flex", alignItems:"center", gap:7, marginTop:4 }}>
              <span style={{ fontSize:14 }}>💬</span> support@nugens.in
            </a>
            <a href="mailto:careers@nugens.in" className="ft-link" style={{ display:"flex", alignItems:"center", gap:7, marginTop:4 }}>
              <span style={{ fontSize:14 }}>🎯</span> careers@nugens.in
            </a>

            <div style={{ marginTop:22, display:"inline-flex", alignItems:"center", gap:7,
              padding:"7px 12px", border:"1px solid #1e1e1e", borderRadius:20, background:"#111" }}>
              <span style={{ fontSize:13 }}>🔒</span>
              <span style={{ fontSize:11, color:"#555" }}>SSL Secured · Razorpay</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop:"1px solid #141414" }}>
        <div style={{ maxWidth:1200, margin:"0 auto", padding:"16px 24px",
          display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
          <p style={{ fontSize:12, color:"#333", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            © {year} Nugens. All rights reserved.
          </p>
          <div style={{ display:"flex", gap:18, flexWrap:"wrap" }}>
            {[
              { l:"Privacy Policy",  h:"#" },
              { l:"Terms of Use",    h:"#" },
              { l:"Cookie Policy",   h:"#" },
            ].map(item => (
              <a key={item.l} href={item.h} className="ft-bottom-link">{item.l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
