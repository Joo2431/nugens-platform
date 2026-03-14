import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const GOLD  = "#d4a843";
const PINK  = "#e8185d";
const B     = "#f0f0f0";

function useInView(t = 0.1) {
  const ref = useRef(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold: t });
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, [t]);
  return [ref, v];
}

function Reveal({ children, delay = 0, style = {} }) {
  const [ref, v] = useInView();
  return (
    <div ref={ref} style={{
      opacity: v ? 1 : 0,
      transform: v ? "none" : "translateY(18px)",
      transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
      ...style
    }}>{children}</div>
  );
}

const SERVICES = [
  {
    cat: "Wedding Cinematography",
    color: GOLD,
    items: [
      "Full-day wedding film — ceremony to reception",
      "Cinematic storytelling with colour-graded edit",
      "Drone aerials for outdoor & destination weddings",
      "Same-day highlight reel delivery option",
    ]
  },
  {
    cat: "Pre-Wedding & Portraits",
    color: "#c8a0e0",
    items: [
      "Outdoor & studio pre-wedding shoots",
      "Engagement session photography & film",
      "Couple editorial for social & print",
      "Maternity & milestone portrait sessions",
    ]
  },
  {
    cat: "Event Coverage",
    color: "#a0c878",
    items: [
      "Mehendi, Sangeet & reception events",
      "Corporate events & brand launches",
      "Baby showers & first birthday celebrations",
      "Multi-day destination wedding packages",
    ]
  },
  {
    cat: "Post-Production",
    color: "#f4a261",
    items: [
      "Feature-length wedding film (30–60 min)",
      "Highlights film (5–8 min) for social sharing",
      "Photo album curation & print-ready exports",
      "Colour grading, motion graphics & titles",
    ]
  },
  {
    cat: "Brand & Commercial",
    color: "#0284c7",
    items: [
      "Brand identity photoshoots & product shoots",
      "Corporate profile video & talking-head reels",
      "Social media content packs (reels, stills)",
      "Event recap & documentary-style films",
    ]
  },
  {
    cat: "Studio & Equipment",
    color: PINK,
    items: [
      "In-house studio space for controlled shoots",
      "Sony Cinema & mirrorless camera lineup",
      "DJI Mavic drone for aerials",
      "Full audio, lighting & grip setup",
    ]
  },
];

const CONTRAST = [
  { them: "Multiple vendors for photo, video & edit", us: "One team handles everything end to end" },
  { them: "Generic packages, no storytelling focus", us: "Every film is crafted like a cinema production" },
  { them: "Delivery in weeks with no tracking", us: "Project dashboard so you see live progress" },
  { them: "No revisions after final delivery", us: "Unlimited feedback rounds until you love it" },
  { them: "Disconnected booking with no AI support", us: "GEN-E Mini assists you before & after your booking" },
];

export default function Units() {
  const [on, setOn] = useState(false);
  const [activeService, setActiveService] = useState(0);
  useEffect(() => { setTimeout(() => setOn(true), 50); }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; }

        .u-chip {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 12px; border-radius: 6px; border: 1px solid ${B};
          font-size: 11.5px; font-weight: 500; color: #6b7280; background: #fff;
        }
        .u-chip-gold { background: #fdf8ec; border-color: #e8d5a0; color: #a07830; }

        .u-btn-dark {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 11px 24px; border-radius: 8px; background: #0a0a0a;
          color: #fff; font-size: 13.5px; font-weight: 600; border: none;
          text-decoration: none; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif;
          transition: background 0.14s, transform 0.12s; letter-spacing: -0.01em;
        }
        .u-btn-dark:hover { background: #222; transform: translateY(-1px); }

        .u-btn-gold {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 11px 24px; border-radius: 8px; background: ${GOLD};
          color: #fff; font-size: 13.5px; font-weight: 600; border: none;
          text-decoration: none; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif;
          transition: opacity 0.14s, transform 0.12s; letter-spacing: -0.01em;
          box-shadow: 0 2px 10px rgba(212,168,67,0.3);
        }
        .u-btn-gold:hover { opacity: 0.88; transform: translateY(-1px); }

        .u-btn-ghost {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 11px 24px; border-radius: 8px; background: #fff;
          color: #374151; font-size: 13.5px; font-weight: 500;
          border: 1px solid ${B}; text-decoration: none; cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: border-color 0.14s, color 0.14s, transform 0.12s;
        }
        .u-btn-ghost:hover { border-color: #9ca3af; color: #0a0a0a; transform: translateY(-1px); }

        .svc-tab {
          padding: 9px 16px; border-radius: 7px; font-size: 12.5px; font-weight: 500;
          color: #6b7280; background: transparent; border: 1px solid transparent;
          cursor: pointer; transition: all 0.13s; font-family: 'Plus Jakarta Sans', sans-serif;
          text-align: left;
        }
        .svc-tab.on { background: #fff; border-color: ${B}; color: #0a0a0a; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
        .svc-tab:hover:not(.on) { color: #0a0a0a; background: #f9f9f9; }

        .contrast-row {
          display: grid; grid-template-columns: 1fr 1fr; gap: 0;
          border-bottom: 1px solid ${B};
        }
        .contrast-row:last-child { border-bottom: none; }
        .contrast-cell {
          padding: 14px 18px; font-size: 13.5px; line-height: 1.55;
        }

        .u-card {
          padding: 22px; border-radius: 10px; border: 1px solid ${B};
          background: #fff; transition: border-color 0.18s, box-shadow 0.18s;
        }
        .u-card:hover { border-color: #e8d5a0; box-shadow: 0 2px 18px rgba(212,168,67,0.08); }

        @media (max-width: 740px) {
          .u-two   { grid-template-columns: 1fr !important; }
          .contrast-row  { grid-template-columns: 1fr !important; }
          .contrast-cell:first-child { border-bottom: 1px solid ${B}; }
          .svc-panel { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── HERO ── */}
      <section style={{
        padding: "88px 24px 72px", background: "#fff",
        borderBottom: `1px solid ${B}`, position: "relative", overflow: "hidden"
      }}>
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: `linear-gradient(${B} 1px,transparent 1px),linear-gradient(90deg,${B} 1px,transparent 1px)`,
          backgroundSize: "52px 52px", opacity: 0.4
        }} />
        <div style={{ position: "absolute", top: -80, right: -60, width: 420, height: 420,
          borderRadius: "50%", background: GOLD, filter: "blur(130px)", opacity: 0.05, pointerEvents: "none" }} />

        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 2 }}>
          <div style={{ opacity: on ? 1 : 0, transform: on ? "none" : "translateY(10px)", transition: "all 0.4s ease 0.04s", marginBottom: 22 }}>
            <span className="u-chip u-chip-gold">Wedding & Event Production · The Wedding Unit</span>
          </div>

          <h1 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 800,
            lineHeight: 1.15, letterSpacing: "-0.035em", color: "#0a0a0a",
            marginBottom: 20,
            opacity: on ? 1 : 0, transform: on ? "none" : "translateY(14px)",
            transition: "all 0.46s ease 0.14s"
          }}>
            Every frame of your story,<br />
            <span style={{ color: GOLD }}>told like cinema</span>
          </h1>

          <p style={{
            fontSize: 16, color: "#6b7280", lineHeight: 1.72,
            maxWidth: 520, margin: "0 auto 32px", fontWeight: 400,
            opacity: on ? 1 : 0, transform: on ? "none" : "translateY(10px)",
            transition: "all 0.46s ease 0.24s"
          }}>
            The Wedding Unit is a full-service production house for weddings, events, and brand work. Photography, cinematography, editing — one team, one vision, no compromises.
          </p>

          <div style={{
            display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap",
            opacity: on ? 1 : 0, transform: on ? "none" : "translateY(8px)",
            transition: "all 0.46s ease 0.34s", marginBottom: 48
          }}>
            <a href="https://units.nugens.in.net" className="u-btn-gold">Book Your Date →</a>
            <Link to="/contact" className="u-btn-ghost">Talk to us first</Link>
          </div>

          {/* stats strip */}
          <div style={{
            display: "flex", justifyContent: "center", flexWrap: "wrap",
            borderTop: `1px solid ${B}`, borderBottom: `1px solid ${B}`, padding: "18px 0",
            opacity: on ? 1 : 0, transition: "opacity 0.46s ease 0.44s"
          }}>
            {[["300+", "Weddings filmed"], ["6", "Production services"], ["48h", "Highlight turnaround"], ["100%", "Client satisfaction"]].map(([n, l], i, arr) => (
              <div key={l} style={{
                padding: "0 28px", textAlign: "center",
                borderRight: i < arr.length - 1 ? `1px solid ${B}` : "none"
              }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#0a0a0a", letterSpacing: "-0.025em" }}>{n}</div>
                <div style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE PROBLEM ── */}
      <section style={{ padding: "72px 24px", background: "#fafafa", borderBottom: `1px solid ${B}` }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <Reveal>
            <span className="u-chip" style={{ marginBottom: 12 }}>Why most couples regret their vendor choices</span>
            <h2 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700,
              fontSize: "clamp(20px,2.8vw,28px)", letterSpacing: "-0.03em",
              color: "#0a0a0a", marginTop: 10, marginBottom: 14, maxWidth: 560
            }}>
              You only get one chance.<br />Most production houses know that — and bank on it.
            </h2>
            <p style={{ fontSize: 14.5, color: "#6b7280", lineHeight: 1.72, maxWidth: 560, marginBottom: 40 }}>
              Fragmented vendors. No communication after booking. Footage delivered months later with zero feedback window. The day passes — and what's left is a hard drive of disappointment. The Wedding Unit was built to be the opposite of that.
            </p>
          </Reveal>

          {/* contrast table */}
          <Reveal delay={80}>
            <div style={{ border: `1px solid ${B}`, borderRadius: 12, overflow: "hidden" }}>
              <div className="contrast-row" style={{ background: "#0a0a0a" }}>
                <div className="contrast-cell" style={{ color: "#9ca3af", fontWeight: 600, fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  The typical wedding vendor experience
                </div>
                <div className="contrast-cell" style={{ color: GOLD, fontWeight: 600, fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", borderLeft: "1px solid #1f1f1f" }}>
                  The Wedding Unit difference
                </div>
              </div>
              {CONTRAST.map((row, i) => (
                <div key={i} className="contrast-row" style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <div className="contrast-cell" style={{ color: "#9ca3af", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ color: "#d1d5db", fontSize: 14 }}>✕</span> {row.them}
                  </div>
                  <div className="contrast-cell" style={{ color: "#0a0a0a", fontWeight: 500, display: "flex", alignItems: "center", gap: 10, borderLeft: `1px solid ${B}` }}>
                    <span style={{ color: "#059669", fontSize: 14 }}>✓</span> {row.us}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section style={{ padding: "72px 24px", background: "#fff", borderBottom: `1px solid ${B}` }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <Reveal style={{ marginBottom: 36 }}>
            <span className="u-chip" style={{ marginBottom: 10 }}>Services</span>
            <h2 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700,
              fontSize: "clamp(20px,2.8vw,28px)", letterSpacing: "-0.03em",
              color: "#0a0a0a", marginTop: 10
            }}>
              Everything your day demands
            </h2>
            <p style={{ fontSize: 14, color: "#9ca3af", lineHeight: 1.7, maxWidth: 420, marginTop: 8 }}>
              Six production services under one roof — so your entire story stays with one creative team from booking to delivery.
            </p>
          </Reveal>

          <div className="svc-panel" style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 0, border: `1px solid ${B}`, borderRadius: 12, overflow: "hidden" }}>
            {/* sidebar */}
            <div style={{ padding: "16px 12px", background: "#fafafa", borderRight: `1px solid ${B}` }}>
              {SERVICES.map((s, i) => (
                <button key={s.cat} className={`svc-tab ${activeService === i ? "on" : ""}`}
                  onClick={() => setActiveService(i)}
                  style={{ display: "block", width: "100%", marginBottom: 4 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: activeService === i ? s.color : "#d1d5db", flexShrink: 0, transition: "background 0.15s" }} />
                    {s.cat}
                  </span>
                </button>
              ))}
            </div>

            {/* content */}
            <div style={{ padding: "32px 32px 36px", background: "#fff" }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: SERVICES[activeService].color }}>
                Service {activeService + 1} of {SERVICES.length}
              </span>
              <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 22, letterSpacing: "-0.025em", color: "#0a0a0a", marginTop: 10, marginBottom: 20 }}>
                {SERVICES[activeService].cat}
              </h3>
              {SERVICES[activeService].items.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "11px 0", borderBottom: i < SERVICES[activeService].items.length - 1 ? `1px solid #f7f7f7` : "none" }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                    background: `${SERVICES[activeService].color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="8" height="7" viewBox="0 0 9 8" fill="none">
                      <path d="M1.5 4L3.5 6L7.5 1.5" stroke={SERVICES[activeService].color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span style={{ fontSize: 14, color: "#374151", lineHeight: 1.6 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: "72px 24px", background: "#fafafa", borderBottom: `1px solid ${B}` }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <Reveal style={{ marginBottom: 40 }}>
            <span className="u-chip" style={{ marginBottom: 10 }}>Process</span>
            <h2 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700,
              fontSize: "clamp(20px,2.8vw,28px)", letterSpacing: "-0.03em",
              color: "#0a0a0a", marginTop: 10
            }}>
              From booking to your film
            </h2>
          </Reveal>

          <div className="u-two" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            {[
              { n: "01", t: "Book your date", d: "Check availability, pick your package, and lock in your date with a simple confirmation — all online." },
              { n: "02", t: "Pre-shoot consultation", d: "We meet to understand your story, the look you want, locations, timelines, and any special requests." },
              { n: "03", t: "On-the-day coverage", d: "Our crew arrives ahead of time. We stay invisible and capture everything — candid, cinematic, real." },
              { n: "04", t: "Delivery & revisions", d: "Your film lands in your dashboard. Review it, share feedback, and we revise until it's exactly right." },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 60}>
                <div className="u-card" style={{ height: "100%" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#d1d5db", marginBottom: 16 }}>{s.n}</div>
                  <h4 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 14, color: "#0a0a0a", marginBottom: 8, letterSpacing: "-0.01em", lineHeight: 1.4 }}>{s.t}</h4>
                  <p style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.65 }}>{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── ECOSYSTEM CONNECTION ── */}
      <section style={{ padding: "72px 24px", background: "#fff", borderBottom: `1px solid ${B}` }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <Reveal style={{ marginBottom: 36 }}>
            <span className="u-chip" style={{ marginBottom: 10 }}>Nugens Ecosystem</span>
            <h2 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700,
              fontSize: "clamp(20px,2.8vw,28px)", letterSpacing: "-0.03em",
              color: "#0a0a0a", marginTop: 10
            }}>
              Units is powered by the full Nugens stack
            </h2>
            <p style={{ fontSize: 14, color: "#9ca3af", lineHeight: 1.7, maxWidth: 440, marginTop: 8 }}>
              Your production experience is seamlessly connected to AI support, project tracking, and brand services across the platform.
            </p>
          </Reveal>

          <div className="u-two" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
            {[
              {
                label: "Gen-E AI guides your booking",
                color: "#7c3aed",
                desc: "Not sure what package you need? Gen-E AI asks the right questions and recommends exactly what fits your event, budget, and style.",
                link: "/gene", cta: "Ask Gen-E AI"
              },
              {
                label: "Units manages your production",
                color: GOLD,
                desc: "Book, track, review and approve your film all in one dashboard. See exactly where your project is — from shooting day to final delivery.",
                link: null, cta: "◎ You are here"
              },
              {
                label: "DigiHub amplifies your brand",
                color: "#0284c7",
                desc: "Businesses that shoot with Units can take their content further via DigiHub — professional distribution, social strategy, and brand growth.",
                link: "/digihub", cta: "Explore DigiHub"
              },
            ].map((c, i) => (
              <Reveal key={c.label} delay={i * 70}>
                <div style={{ padding: "26px", borderRadius: 10, border: `1px solid ${B}`, background: i === 1 ? "#0a0a0a" : "#fff", height: "100%" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: c.color, marginBottom: 18 }} />
                  <h4 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 14, letterSpacing: "-0.01em", lineHeight: 1.4, marginBottom: 10, color: i === 1 ? "#fff" : "#0a0a0a" }}>{c.label}</h4>
                  <p style={{ fontSize: 13, lineHeight: 1.65, color: i === 1 ? "#9ca3af" : "#6b7280", marginBottom: 20 }}>{c.desc}</p>
                  {c.link
                    ? <Link to={c.link} style={{ fontSize: 12.5, fontWeight: 600, color: c.color, textDecoration: "none" }}>{c.cta} →</Link>
                    : <span style={{ fontSize: 12.5, fontWeight: 600, color: c.color }}>{c.cta}</span>
                  }
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PACKAGES TEASER ── */}
      <section style={{ padding: "72px 24px", background: "#fafafa", borderBottom: `1px solid ${B}` }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <Reveal style={{ marginBottom: 40 }}>
            <span className="u-chip" style={{ marginBottom: 10 }}>Packages</span>
            <h2 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700,
              fontSize: "clamp(20px,2.8vw,28px)", letterSpacing: "-0.03em",
              color: "#0a0a0a", marginTop: 10
            }}>
              Simple packages. No hidden surprises.
            </h2>
            <p style={{ fontSize: 14, color: "#9ca3af", lineHeight: 1.7, maxWidth: 440, marginTop: 8 }}>
              Three tiers for every kind of celebration — from intimate events to multi-day destination weddings.
            </p>
          </Reveal>

          <div className="u-two" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {[
              {
                tier: "Essential",
                desc: "Perfect for intimate ceremonies and small events",
                features: ["Full-day photo coverage", "500+ edited photographs", "Online gallery delivery", "1 photographer"],
                cta: "Book Essential",
                highlight: false,
              },
              {
                tier: "Signature",
                desc: "Our most popular — photo + film for complete coverage",
                features: ["Full-day photo + cinematography", "Feature film + highlights reel", "Drone aerials included", "2 photographers, 2 videographers"],
                cta: "Book Signature",
                highlight: true,
              },
              {
                tier: "Prestige",
                desc: "Destination weddings and multi-day celebrations",
                features: ["Multi-day full production", "Extended feature film (60 min)", "Brand & social content pack", "Dedicated project manager"],
                cta: "Book Prestige",
                highlight: false,
              },
            ].map((p, i) => (
              <Reveal key={p.tier} delay={i * 70}>
                <div style={{
                  padding: "28px", borderRadius: 12,
                  border: p.highlight ? `1.5px solid ${GOLD}` : `1px solid ${B}`,
                  background: p.highlight ? "#0a0a0a" : "#fff",
                  position: "relative", height: "100%",
                  boxShadow: p.highlight ? `0 4px 28px rgba(212,168,67,0.14)` : "none"
                }}>
                  {p.highlight && (
                    <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: GOLD, color: "#fff", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 5 }}>
                      Most Popular
                    </div>
                  )}
                  <div style={{ fontSize: 17, fontWeight: 700, color: p.highlight ? "#e8d5a0" : "#0a0a0a", letterSpacing: "-0.025em", marginBottom: 6 }}>{p.tier}</div>
                  <p style={{ fontSize: 13, color: p.highlight ? "#9ca3af" : "#6b7280", marginBottom: 20, lineHeight: 1.6 }}>{p.desc}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                    {p.features.map((f, fi) => (
                      <div key={fi} style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                        <span style={{ color: p.highlight ? GOLD : "#059669", fontSize: 13, flexShrink: 0, marginTop: 1 }}>✓</span>
                        <span style={{ fontSize: 13, color: p.highlight ? "#a08850" : "#374151", lineHeight: 1.5 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <a href="https://units.nugens.in.net/book" style={{
                    display: "block", textAlign: "center", padding: "10px 20px", borderRadius: 8,
                    background: p.highlight ? GOLD : "transparent",
                    border: p.highlight ? "none" : `1px solid ${B}`,
                    color: p.highlight ? "#fff" : "#374151",
                    fontSize: 13, fontWeight: 600, textDecoration: "none",
                    transition: "opacity 0.13s"
                  }}>{p.cta} →</a>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "80px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 580, margin: "0 auto", textAlign: "center" }}>
          <Reveal>
            <span className="u-chip u-chip-gold" style={{ marginBottom: 18 }}>Your date is waiting</span>
            <h2 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700,
              fontSize: "clamp(20px,3vw,32px)", letterSpacing: "-0.03em",
              color: "#0a0a0a", marginTop: 14, marginBottom: 14, lineHeight: 1.25
            }}>
              Don't let your story<br />be told by the wrong hands.
            </h2>
            <p style={{ fontSize: 14.5, color: "#9ca3af", lineHeight: 1.72, maxWidth: 380, margin: "0 auto 28px" }}>
              Book The Wedding Unit and get a production team that cares about your story as much as you do — from the first frame to the final cut.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
              <a href="https://units.nugens.in.net" className="u-btn-gold">Book Your Date →</a>
              <Link to="/contact" className="u-btn-ghost">Ask us anything</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
