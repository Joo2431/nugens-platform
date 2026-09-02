/**
 * Proof of Work — standalone showcase site.
 * REWORK: full visual identity change from Units' own gold/dark
 * production-house palette to the real Nugens brand — pink (#e8185d,
 * confirmed against Gen-E and every other product's actual PINK
 * constant), white background, bold sans-serif (no serif/italic), and
 * the real NG logo + favicon (copied from the platform's actual asset
 * files, not recreated from memory).
 */
import React, { useState, useRef, useEffect } from "react";

import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/plus-jakarta-sans/800.css";

import { NG_LOGO } from "../lib/logo";

import poster1      from "../assets/units samples/posters/1.jpg";
import posterG1     from "../assets/units samples/posters/g1.jpg";
import posterG2     from "../assets/units samples/posters/g2.jpg";
import posterG3     from "../assets/units samples/posters/g3.jpg";
import posterShoe   from "../assets/units samples/posters/PsFiles_Shoe.jpg";
import posterCutout from "../assets/units samples/posters/Gemini_Generated_Image_e59524e59524e595-removebg-preview.png";

// Real screenshots of the live sites — replaces the hand-built CSS
// mockups from the previous version with the actual thing.
import shotWedding from "../assets/site-screenshots/wedding-unit.jpg";
import shotSaree   from "../assets/site-screenshots/sd-styles.jpg";
import shotBilling from "../assets/site-screenshots/billing-suite.jpg";

const PINK      = "#e8185d";
const PINK_SOFT = "#e8185d10";
const PINK_LINE = "#e8185d26";
const INK       = "#0a0a0a";
const MUTED     = "#6b7280";
const MUTED_DIM = "#9ca3af";
const BORDER    = "#e8eaed";
const BG        = "#ffffff";
const CARD      = "#ffffff";
const SURFACE   = "#f8f9fb";

const CLOUDFLARE_STREAM_DOMAIN = "customer-6qz8gcj18239c7sh.cloudflarestream.com";

/* ── DATA ── */

// Real, live projects — content below pulled from actually fetching each
// URL, not invented. Each has its own mockup treatment reflecting its
// actual structure (see WeddingMockup / SareeMockup / BillingMockup below)
// instead of one generic frame reused three times.
const WEBSITES = [
  {
    kind: "wedding", thumb: shotWedding,
    tag: "Photography — Full Site", title: "The Wedding Unit",
    desc: "Wedding & event photography site — gallery, three-tier packages (₹25k–₹1.2L), testimonials, and a WhatsApp-connected booking form.",
    url: "https://theweddingunit.in.net/",
  },
  {
    kind: "saree", thumb: shotSaree,
    tag: "E-Commerce — Full Site", title: "SD Styles",
    desc: "Full storefront for a saree brand — product catalog, cart, wishlist, collections, and checkout. Built on Next.js.",
    url: "https://yesdeestyles.com/",
  },
  {
    kind: "billing", thumb: shotBilling,
    tag: "SaaS Demo — Internal Tool", title: "Nugens Billing Suite",
    desc: "Retail billing & invoicing tool — barcode-ready phone catalog with IMEI tracking, EMI calculator, and printable/WhatsApp-shareable bills.",
    url: "https://billing-demo.nugens.in/",
  },
];

// FIXED: reel titles previously showed raw internal filenames (br2, bs3,
// "Reel 3-1", "Reel 4-1"). Renamed to real portfolio-style titles. Original
// filenames kept as trailing comments for your own reference — genuine
// proper nouns (client/brand/festival/location names) are kept since they
// add real credibility; internal file-numbering fragments are gone.
const REELS = [
  { title: "Motion Reel — Edit 01", tag: "Content", streamId: "dda5272cb5c98af54b40994e2a6120fa" /* 1.mp4 */ },
  { title: "Motion Reel — Edit 02", tag: "Content", streamId: "4f540b17b3d495916725dae8a4f97491" /* 2.mp4 */ },
  { title: "Brand Film — Aura Sangam", tag: "Client / Brand", streamId: "56b79fbaf53641f139419d807ee341b1" /* AURA SANGAM1 2.mp4 */ },
  { title: "Campaign Reel — Vol. 1", tag: "Content", streamId: "900bf100d911ef9d59bfa57e58554ed9" /* br2.mp4 */ },
  { title: "Campaign Reel — Vol. 2", tag: "Content", streamId: "56c8caa1effdea7f35d51c9f60f9533f" /* bs3.mp4 */ },
  { title: "Promotional Reel — Edit A", tag: "Promo", streamId: "8ec0e04d3fbd05eeb57284c0356dbe82" /* offer (2).mp4 */ },
  { title: "Promotional Reel — Edit B", tag: "Promo", streamId: "d5209e205ef1aad2862e8464fdd0e0e7" /* offer.mp4 */ },
  { title: "Seasonal Campaign — Raksha Bandhan", tag: "Seasonal", streamId: "20855977be19f0847ac4ee451ec5834f" /* Raksha bandan.mp4 */ },
  { title: "Brand Film — Nugens", tag: "Brand", streamId: "58ef6a24c5b49e77c530d450044060e4" /* reel 1 nugens.mp4 */ },
  { title: "Motion Reel — Edit 03", tag: "Content", streamId: "37b972c60790b5d4ef7e0f3a9ca8b463" /* reel 3-1.mp4 */ },
  { title: "Motion Reel — Edit 04", tag: "Content", streamId: "bcfc846425fcf88f3eb7141a67a927f5" /* reel 4-1.mp4 */ },
  { title: "Location Shoot — RS Puram", tag: "Location Shoot", streamId: "d155048c3c01af5729a81dbf368d8ed8" /* rs puram.mp4 */ },
  { title: "Studio Show Reel", tag: "Demo Reel", streamId: "6df278ec5b571cb9d838336f6c0170c8" /* show reel.mp4 */ },
  { title: "Brand Film — Vismaya", tag: "Client / Brand", streamId: "11ca6e9d6586c6a1144eb5f9730ae1d7" /* vismaya 2.mp4 */ },
  { title: "Client Testimonial — Prince & Princess", tag: "Client / Brand", streamId: "534c81621771d427e2b4b06cc8877f94" /* prince n pricess testimonial 2.mp4 */ },
];

const TESTIMONIAL = {
  streamId: "fd542e7900fad11618568ca25aeca19a",
  quote: "Working with The Units felt less like hiring an agency and more like adding a production team to ours. They understood the brief fast, and the turnaround was faster than anyone we'd worked with before.",
  name: "Vismaya",
  role: "Founder",
};

const POSTERS = [
  { title: "Shoe Product Poster", tag: "Poster — Product", img: posterShoe },
  { title: "Poster Design 1", tag: "Poster — Design", img: posterG1 },
  { title: "Poster Design 2", tag: "Poster — Design", img: posterG2 },
  { title: "Poster Design 3", tag: "Poster — Design", img: posterG3 },
  { title: "AI-Enhanced Product Cutout", tag: "Poster — Cutout", img: posterCutout, contain: true },
  { title: "Poster Design", tag: "Poster — Design", img: poster1 },
];

/* ── Scroll-reveal hook ── */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

function Reveal({ children, delay = 0 }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? "translateY(0)" : "translateY(28px)",
      transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

function Carousel({ children }) {
  const trackRef = useRef(null);
  const scrollBy = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: "smooth" });
  };
  return (
    <div style={{ position: "relative" }}>
      <div ref={trackRef} className="pow-carousel-track" style={{
        display: "flex", gap: 18, overflowX: "auto", scrollSnapType: "x mandatory",
        paddingBottom: 8, scrollbarWidth: "none",
      }}>
        {children}
      </div>
      <button aria-label="Scroll left" onClick={() => scrollBy(-1)} className="pow-arrow pow-arrow-left">‹</button>
      <button aria-label="Scroll right" onClick={() => scrollBy(1)} className="pow-arrow pow-arrow-right">›</button>
    </div>
  );
}

function SectionHeading({ eyebrow, title, sub }) {
  return (
    <Reveal>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11.5, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: PINK, marginBottom: 12 }}>
          <span style={{ width: 16, height: 2, background: PINK, display: "inline-block" }} />
          {eyebrow}
        </div>
        <h2 style={{ fontWeight: 800, fontSize: "clamp(26px,3.4vw,40px)", letterSpacing: "-0.03em", margin: 0, color: INK, lineHeight: 1.1 }}>{title}</h2>
        {sub && <p style={{ color: MUTED, fontSize: 15, marginTop: 12, maxWidth: 560, lineHeight: 1.65 }}>{sub}</p>}
      </div>
    </Reveal>
  );
}

/* ── Small inline icons — no icon library dependency, just real SVG ── */
function IconCamera({ color = "#fff" }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M4 8h3l2-2h6l2 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="14" r="3.4" stroke={color} strokeWidth="1.8" />
    </svg>
  );
}
function IconBag({ color = "#fff" }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M6 9h12l1 12H5L6 9Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 9V7a3 3 0 0 1 6 0v2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconReceipt({ color = "#fff" }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M6 3h12v18l-2.5-1.5L13 21l-1-1.5-1 1.5-2.5-1.5L6 21V3Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 8h6M9 12h6M9 16h3" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const SITE_META = {
  wedding: { icon: IconCamera, chip: "#1a1614", accent: "#d4a843" },
  saree:   { icon: IconBag,    chip: PINK,      accent: PINK },
  billing: { icon: IconReceipt, chip: "#0f172a", accent: "#38bdf8" },
};

/* Real screenshot, not a hand-drawn mockup — the whole point of this
   section is showing actual delivered work. */
function SiteMockup({ thumb, title }) {
  return (
    <img src={thumb} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} />
  );
}

function WebsiteCard({ kind, tag, title, desc, url, thumb, index = 0 }) {
  const meta = SITE_META[kind];
  const Icon = meta.icon;
  const [tilted, setTilted] = useState(true);
  // Staggered "card fan" resting rotation — a nod to the layered-card
  // technique from the PeachWeb reference, applied to real content instead
  // of generic filler. Straightens fully on hover along with the existing
  // 3D perspective tilt.
  const fanDeg = [-2.5, 1.5, -1.5][index % 3];
  return (
    <div
      className="pow-piece"
      onMouseEnter={() => setTilted(false)}
      onMouseLeave={() => setTilted(true)}
      style={{ border: `1px solid ${BORDER}`, borderRadius: 16, background: CARD, overflow: "hidden", perspective: "1200px" }}
    >
      <div style={{ padding: "20px 20px 0" }}>
        <div style={{
          aspectRatio: "16/10", borderRadius: 12, overflow: "hidden", boxShadow: "0 20px 40px -12px rgba(0,0,0,0.25)",
          transform: tilted ? `rotateY(-7deg) rotateX(3deg) rotate(${fanDeg}deg) scale(0.97)` : "rotateY(0) rotateX(0) rotate(0) scale(1)",
          transition: "transform 0.5s cubic-bezier(.2,.8,.2,1)", transformStyle: "preserve-3d",
          border: `1px solid ${BORDER}`,
        }}>
          <div style={{ height: 26, display: "flex", alignItems: "center", gap: 6, padding: "0 10px", background: meta.chip }}>
            {[0,1,2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.35)" }} />)}
            <div style={{ flex: 1, height: 12, marginLeft: 6, borderRadius: 4, background: "rgba(255,255,255,0.14)", display: "flex", alignItems: "center", paddingLeft: 6 }}>
              <span style={{ fontSize: 7.5, color: "rgba(255,255,255,0.7)", fontFamily: "monospace" }}>{url.replace("https://", "")}</span>
            </div>
          </div>
          <div style={{ height: "calc(100% - 26px)" }}>
            <SiteMockup thumb={thumb} title={title} />
          </div>
        </div>
      </div>
      <div style={{ padding: "16px 20px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ width: 22, height: 22, borderRadius: 6, background: meta.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon />
          </span>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.09em", textTransform: "uppercase", color: PINK }}>{tag}</span>
        </div>
        <div data-testid="website-title" style={{ fontSize: 16, fontWeight: 800, color: INK, marginBottom: 5 }}>{title}</div>
        <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.55, marginBottom: 14 }}>{desc}</div>
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, fontWeight: 700, color: PINK, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}>
          Visit Live Site ↗
        </a>
      </div>
    </div>
  );
}

function PlayCard({ title, tag, streamId }) {
  const [playing, setPlaying] = useState(false);
  const ready = streamId && !streamId.startsWith("PASTE_STREAM_ID");
  const thumbUrl = ready ? `https://${CLOUDFLARE_STREAM_DOMAIN}/${streamId}/thumbnails/thumbnail.jpg?time=1s&height=480` : null;

  return (
    <div className="pow-piece" style={{
      flex: "0 0 240px", scrollSnapAlign: "start", border: `1px solid ${BORDER}`, borderRadius: 14,
      background: CARD, overflow: "hidden",
    }}>
      <div style={{
        aspectRatio: "9/16", position: "relative",
        background: thumbUrl
          ? `linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%), url(${thumbUrl}) center/cover no-repeat, ${SURFACE}`
          : SURFACE,
      }}>
        {playing && ready ? (
          <iframe
            src={`https://${CLOUDFLARE_STREAM_DOMAIN}/${streamId}/iframe`}
            style={{ width: "100%", height: "100%", border: "none", display: "block" }}
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowFullScreen
          />
        ) : (
          <button
            onClick={() => setPlaying(true)}
            disabled={!ready}
            style={{
              width: "100%", height: "100%", background: "none", border: "none", cursor: ready ? "pointer" : "default",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 20,
            }}
          >
            <div className="pow-play-btn" style={{
              width: 50, height: 50, borderRadius: "50%", background: ready ? PINK : "transparent",
              border: ready ? "none" : `1.5px dashed ${MUTED_DIM}`, boxShadow: ready ? "0 8px 20px rgba(232,24,93,0.35)" : "none",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {ready ? (
                <div style={{ width: 0, height: 0, borderStyle: "solid", borderWidth: "9px 0 9px 14px", borderColor: "transparent transparent transparent #fff", marginLeft: 3 }} />
              ) : (
                <span style={{ color: "#fff", fontSize: 18 }}>+</span>
              )}
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,0.4)", textAlign: "center" }}>
              {ready ? "Tap to play" : "Video pending"}
            </span>
          </button>
        )}
      </div>
      <div style={{ padding: "13px 15px 15px" }}>
        <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: PINK, display: "block", marginBottom: 4 }}>{tag}</span>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: INK }}>{title}</div>
      </div>
    </div>
  );
}

function PosterCard({ title, tag, img, contain }) {
  return (
    <div className="pow-piece" style={{
      flex: "0 0 230px", scrollSnapAlign: "start", border: `1px solid ${BORDER}`, borderRadius: 14,
      background: CARD, overflow: "hidden",
    }}>
      <div style={{ aspectRatio: "4/5", background: SURFACE, overflow: "hidden" }}>
        <img src={img} alt={title} style={{ width: "100%", height: "100%", objectFit: contain ? "contain" : "cover", display: "block" }} />
      </div>
      <div style={{ padding: "13px 15px 15px" }}>
        <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: PINK, display: "block", marginBottom: 4 }}>{tag}</span>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: INK }}>{title}</div>
      </div>
    </div>
  );
}

export default function ProofOfWork() {
  const [testimonialPlaying, setTestimonialPlaying] = useState(false);
  const testReady = TESTIMONIAL.streamId && !TESTIMONIAL.streamId.startsWith("PASTE_STREAM_ID");

  return (
    <div style={{ background: BG, color: INK, fontFamily: "'Plus Jakarta Sans', sans-serif", minHeight: "100vh", position: "relative", overflowX: "hidden" }}>
      <style>{`
        .pow-piece{ transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s; }
        .pow-piece:hover{ transform: translateY(-4px); border-color: ${PINK}50; box-shadow: 0 16px 32px rgba(232,24,93,0.1); }
        .pow-play-btn{ transition: transform 0.2s; }
        .pow-piece:hover .pow-play-btn{ transform: scale(1.08); }
        .pow-pill:hover{ color:${INK}; border-color:${PINK}; }
        .pow-cta:hover{ background:#c8134e; transform:translateY(-1px); }
        .pow-ghost:hover{ border-color:${PINK}; background:${PINK_SOFT}; color:${PINK}; }
        .pow-carousel-track::-webkit-scrollbar{ display:none; }
        .pow-arrow{
          position:absolute; top:50%; transform:translateY(-50%); width:38px; height:38px; border-radius:50%;
          background:#fff; border:1px solid ${BORDER}; color:${INK}; font-size:20px; cursor:pointer;
          display:flex; align-items:center; justify-content:center; box-shadow: 0 4px 12px rgba(0,0,0,0.08); transition:all 0.2s; z-index:5;
        }
        .pow-arrow:hover{ border-color:${PINK}; color:${PINK}; }
        .pow-arrow-left{ left:-8px; }
        .pow-arrow-right{ right:-8px; }
        @media(max-width:700px){ .pow-arrow{ display:none; } }
        .pow-testimonial-grid{ display:grid; grid-template-columns: 340px 1fr; gap:44px; align-items:center; }
        @media(max-width:760px){ .pow-testimonial-grid{ grid-template-columns:1fr; } }
        @keyframes pow-grid-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pow-orb-drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-16px, 22px) scale(1.05); }
        }
        .pow-orb { animation: pow-orb-drift 14s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .pow-orb { animation: none; } }
      `}</style>

      {/* Techno-grid base layer */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: `radial-gradient(${BORDER} 1px, transparent 1px)`,
        backgroundSize: "28px 28px",
        maskImage: "linear-gradient(180deg, rgba(0,0,0,0.5), transparent 700px)",
        animation: "pow-grid-fade 1s ease",
      }} />

      {/* Floating gradient orbs — the "3D" energy from the PeachWeb
          reference, done with blurred gradient blobs instead of actual 3D
          renders (no 3D asset pipeline here) — same visual effect of
          depth and color behind the hero copy, drifting slowly. */}
      <div aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: 780, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div className="pow-orb" style={{ position: "absolute", top: -140, right: "8%", width: 420, height: 420, borderRadius: "50%", background: `radial-gradient(circle at 35% 35%, ${PINK}, #ff8fb0 60%, transparent 75%)`, opacity: 0.35, filter: "blur(10px)", animationDelay: "0s" }} />
        <div className="pow-orb" style={{ position: "absolute", top: 180, left: "2%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle at 40% 40%, #7c5cff, #a78bfa 60%, transparent 75%)", opacity: 0.28, filter: "blur(10px)", animationDelay: "-4s" }} />
        <div className="pow-orb" style={{ position: "absolute", top: 60, left: "42%", width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle at 40% 40%, #38bdf8, #7dd3fc 60%, transparent 75%)", opacity: 0.22, filter: "blur(10px)", animationDelay: "-8s" }} />
      </div>

      {/* Top bar — real Nugens NG logo, not a text wordmark */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px clamp(20px,5vw,64px)", background: "rgba(255,255,255,0.85)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${BORDER}` }}>
        <a href="https://nugens.in" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img src={NG_LOGO} alt="Nugens" style={{ width: 30, height: 30, borderRadius: 7, objectFit: "cover" }} />
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: INK, letterSpacing: "-0.02em", lineHeight: 1 }}>Nugens</div>
            <div style={{ fontSize: 9.5, color: MUTED_DIM, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>Units — Production</div>
          </div>
        </a>
        <a href="https://units.nugens.in/book" className="pow-cta" style={{ padding: "10px 22px", background: PINK, color: "#fff", textDecoration: "none", borderRadius: 8, fontSize: 13, fontWeight: 700 }}>Book a Project →</a>
      </div>

      {/* Hero — bold sans headline, gradient badge, stat grid */}
      <section style={{ position: "relative", zIndex: 1, padding: "clamp(56px,10vh,100px) clamp(20px,5vw,64px) clamp(40px,7vh,72px)", maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11.5, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: PINK, border: `1px solid ${PINK_LINE}`, background: PINK_SOFT, padding: "7px 16px", borderRadius: 99, marginBottom: 26 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: PINK }} />
          Proof of Work
        </div>
        <h1 style={{ fontWeight: 800, fontSize: "clamp(38px,6vw,76px)", lineHeight: 1.03, letterSpacing: "-0.04em", maxWidth: "15ch", margin: 0, color: INK }}>
          Work that looks like a{" "}
          <span style={{ background: `linear-gradient(90deg, ${PINK}, #ff5c8a)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            full production team
          </span>.
        </h1>
        <p style={{ marginTop: 24, maxWidth: 540, fontSize: 16.5, lineHeight: 1.7, color: MUTED }}>
          A sample of what The Units builds for brands — websites, reels, and posters — across product launches,
          social campaigns, and full brand identities. Every piece here reflects the caliber of craft
          your project gets, start to finish.
        </p>
        <div style={{ display: "flex", gap: 14, marginTop: 34, flexWrap: "wrap" }}>
          <a href="https://units.nugens.in/book" className="pow-cta" style={{ padding: "14px 28px", background: PINK, color: "#fff", textDecoration: "none", borderRadius: 9, fontSize: 14, fontWeight: 700 }}>Book a Project</a>
          <a href="#websites" className="pow-ghost" style={{ padding: "14px 26px", border: `1px solid ${BORDER}`, color: INK, textDecoration: "none", borderRadius: 9, fontSize: 14, fontWeight: 600 }}>View the Work ↓</a>
        </div>
        <div style={{ display: "flex", gap: "clamp(28px,5vw,56px)", marginTop: 56, flexWrap: "wrap", paddingTop: 30, borderTop: `1px solid ${BORDER}` }}>
          {[["3", "Formats — web, video, design"], ["4–12k", "Per project, no vague quotes"], ["1", "Dashboard tracking every stage"]].map(([n, l]) => (
            <div key={l}>
              <b style={{ display: "block", fontSize: 30, fontWeight: 800, color: PINK, letterSpacing: "-0.03em" }}>{n}</b>
              <span style={{ fontSize: 12, color: MUTED_DIM }}>{l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION: Websites */}
      <section id="websites" style={{ position: "relative", zIndex: 1, maxWidth: 1180, margin: "0 auto", padding: "44px clamp(20px,5vw,64px)" }}>
        <SectionHeading eyebrow="Websites" title="Full builds, ready to convert" sub="Real, live projects — hover any card to straighten it out, or click through to the actual site." />
        <Reveal delay={100}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
            {WEBSITES.map((w, i) => <WebsiteCard key={i} {...w} index={i} />)}
          </div>
        </Reveal>
      </section>

      {/* SECTION: Content Creation — Reels */}
      <section id="reels" style={{ position: "relative", zIndex: 1, maxWidth: 1180, margin: "0 auto", padding: "20px clamp(20px,5vw,64px) 44px" }}>
        <SectionHeading eyebrow="Content Creation" title="Reels that get watched to the end" sub="Vertical short-form content — client work, brand reels, and seasonal campaigns. Tap any card to play." />
        <Reveal delay={100}>
          <Carousel>
            {REELS.map((r, i) => <PlayCard key={i} {...r} />)}
          </Carousel>
        </Reveal>
      </section>

      {/* SECTION: Client Testimonial */}
      <section style={{ position: "relative", zIndex: 1, maxWidth: 1180, margin: "0 auto", padding: "20px clamp(20px,5vw,64px) 44px" }}>
        <SectionHeading eyebrow="Client Testimonial" title="Straight from the people we've built for" />
        <Reveal delay={100}>
          <div className="pow-testimonial-grid" style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 30, overflow: "hidden" }}>
            <div style={{
              aspectRatio: "9/16", maxHeight: 480, borderRadius: 14, overflow: "hidden", margin: "0 auto", width: "100%",
              background: testReady
                ? `linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%), url(https://${CLOUDFLARE_STREAM_DOMAIN}/${TESTIMONIAL.streamId}/thumbnails/thumbnail.jpg?time=1s&height=480) center/cover no-repeat, #fff`
                : "#fff",
              border: `1px solid ${BORDER}`,
            }}>
              {testimonialPlaying && testReady ? (
                <iframe
                  src={`https://${CLOUDFLARE_STREAM_DOMAIN}/${TESTIMONIAL.streamId}/iframe`}
                  style={{ width: "100%", height: "100%", border: "none", display: "block" }}
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                  allowFullScreen
                />
              ) : (
                <button
                  onClick={() => setTestimonialPlaying(true)}
                  disabled={!testReady}
                  style={{ width: "100%", height: "100%", background: "none", border: "none", cursor: testReady ? "pointer" : "default", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}
                >
                  <div className="pow-play-btn" style={{ width: 58, height: 58, borderRadius: "50%", background: testReady ? PINK : "transparent", border: testReady ? "none" : `1.5px dashed ${MUTED_DIM}`, boxShadow: testReady ? "0 8px 24px rgba(232,24,93,0.35)" : "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {testReady ? <div style={{ width: 0, height: 0, borderStyle: "solid", borderWidth: "10px 0 10px 16px", borderColor: "transparent transparent transparent #fff", marginLeft: 3 }} /> : <span style={{ color: "#fff", fontSize: 20 }}>+</span>}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>{testReady ? "Tap to play" : "Video pending"}</span>
                </button>
              )}
            </div>
            <div>
              <div style={{ fontSize: 44, color: PINK, lineHeight: 0.6, marginBottom: 16, fontWeight: 800 }}>"</div>
              <p style={{ fontWeight: 600, fontSize: "clamp(18px,2vw,23px)", lineHeight: 1.5, color: INK, marginBottom: 22, letterSpacing: "-0.01em" }}>
                {TESTIMONIAL.quote}
              </p>
              <div style={{ fontSize: 14, fontWeight: 700, color: INK }}>{TESTIMONIAL.name}</div>
              <div style={{ fontSize: 12.5, color: MUTED_DIM }}>{TESTIMONIAL.role}</div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* SECTION: Posters & Brand Design */}
      <section style={{ position: "relative", zIndex: 1, maxWidth: 1180, margin: "0 auto", padding: "20px clamp(20px,5vw,64px) 44px" }}>
        <SectionHeading eyebrow="Posters & Brand Design" title="Static work that stops the scroll" sub="Campaign posters, product creative, and brand assets — real client output." />
        <Reveal delay={100}>
          <Carousel>
            {POSTERS.map((p, i) => <PosterCard key={i} {...p} />)}
          </Carousel>
        </Reveal>
      </section>

      {/* Bottom CTA band — pink gradient instead of gold/dark */}
      <Reveal>
        <div style={{
          position: "relative", zIndex: 1, margin: "24px clamp(20px,5vw,64px) 0", padding: "clamp(44px,7vw,68px) clamp(28px,6vw,64px)",
          background: `linear-gradient(120deg, ${PINK}, #ff5c8a)`, borderRadius: 24,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32, flexWrap: "wrap",
        }}>
          <div>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(24px,3.2vw,38px)", maxWidth: "16ch", lineHeight: 1.12, letterSpacing: "-0.03em", margin: 0, color: "#fff" }}>
              Like what you see? Let's build yours.
            </h2>
            <div style={{ color: "#ffffffcc", fontSize: 14, marginTop: 10, maxWidth: "40ch" }}>
              Tell us what you're launching — we'll match it to a package and get you a straight quote, no back-and-forth.
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
            <a href="https://units.nugens.in/book" style={{ padding: "14px 28px", background: "#fff", color: PINK, textDecoration: "none", borderRadius: 9, fontSize: 14, fontWeight: 800 }}>Book a Project →</a>
            <a href="https://units.nugens.in/pricing" style={{ padding: "14px 26px", border: "1px solid rgba(255,255,255,0.5)", color: "#fff", textDecoration: "none", borderRadius: 9, fontSize: 14, fontWeight: 600 }}>View Pricing</a>
          </div>
        </div>
      </Reveal>

      <footer style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "40px 20px 48px", color: MUTED_DIM, fontSize: 12 }}>
        Made by <b style={{ color: PINK }}>The Units</b> — Nugens Production Studio
      </footer>
    </div>
  );
}
