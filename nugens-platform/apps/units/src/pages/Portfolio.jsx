import React, { useState } from "react";

const PINK   = "#e8185d";
const TEXT   = "#111827";
const MUTED  = "#6b7280";
const FAINT  = "#9ca3af";
const LIGHT  = "#f8f9fb";
const CARD   = "#ffffff";
const BORDER = "#e8eaed";

const CATEGORIES = ["All", "Video Editing", "Brand Identity", "Content Strategy", "Web", "Marketing"];

const WORK = [
  { title: "Launch film for a D2C skincare brand", cat: "Video Editing", tag: "Full Production", desc: "60-second hero film + 6 social cutdowns for a product launch, delivered in 7 days." },
  { title: "Complete rebrand for a fintech startup", cat: "Brand Identity", tag: "Full Identity", desc: "Logo, brand guide, and 100+ asset library used across product, deck, and socials." },
  { title: "3-month growth roadmap for a B2B SaaS", cat: "Content Strategy", tag: "Brand Strategy Pack", desc: "Audience mapping, content system, and a working content calendar the team still uses." },
  { title: "Festival campaign for a food delivery app", cat: "Marketing", tag: "Growth Package", desc: "Multi-platform paid campaign with A/B tested creatives across the festive season." },
  { title: "E-commerce storefront for a jewellery label", cat: "Web", tag: "E-commerce", desc: "Full store build with payment integration and product catalog, live in under 3 weeks." },
  { title: "Founder interview series for a logistics startup", cat: "Video Editing", tag: "Premium Post", desc: "6-part interview series with custom motion graphics and VFX titles." },
];

export default function Portfolio({ profile }) {
  const [active, setActive] = useState("All");
  const filtered = active === "All" ? WORK : WORK.filter(w => w.cat === active);

  const S = {
    page: { minHeight: "100vh", background: LIGHT, padding: "32px 36px 60px", fontFamily: "'Plus Jakarta Sans',sans-serif" },
    h1: { fontSize: 26, fontWeight: 800, color: TEXT, letterSpacing: "-0.04em", marginBottom: 4 },
    sub: { fontSize: 13, color: MUTED, marginBottom: 24 },
    pill: { padding: "6px 15px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none", fontFamily: "inherit" },
    card: { background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 22, marginBottom: 14 },
  };

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>
      <div style={S.h1}>◇ Our Work</div>
      <div style={S.sub}>A look at recent projects across video, design, strategy, and growth — book the same team for yours</div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setActive(c)} style={{ ...S.pill, background: active === c ? PINK : CARD, color: active === c ? "#fff" : MUTED, border: active === c ? "none" : `1px solid ${BORDER}` }}>{c}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        {filtered.map((w, i) => (
          <div key={i} style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: PINK, background: `${PINK}10`, border: `1px solid ${PINK}25`, borderRadius: 5, padding: "3px 8px" }}>{w.cat}</span>
              <span style={{ fontSize: 11, color: FAINT }}>{w.tag}</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: TEXT, marginBottom: 8, lineHeight: 1.4 }}>{w.title}</div>
            <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.7 }}>{w.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ ...S.card, textAlign: "center", marginTop: 24, padding: 32 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: TEXT, marginBottom: 8 }}>Want something like this for your brand?</div>
        <div style={{ fontSize: 13, color: MUTED, marginBottom: 18 }}>Every project above started with the same booking flow you'd use today.</div>
        <a href="/book" style={{ display: "inline-block", padding: "11px 26px", background: PINK, color: "#fff", borderRadius: 9, fontSize: 13.5, fontWeight: 700, textDecoration: "none" }}>Book a Service →</a>
      </div>
    </div>
  );
}
