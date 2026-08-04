/**
 * Units — Proof of Work (client showcase gallery)
 * Public route — no auth required (see App.jsx: <Route path="/work"
 * element={<ProofOfWork />} /> lives OUTSIDE <ProtectedRoute>).
 *
 * Structure: Hero -> Websites -> Content Creation (Reels, horizontal
 * carousel) -> Client Testimonial (split video/quote) -> Posters &
 * Brand Design (horizontal carousel) -> CTA band.
 *
 * Videos are click-to-play: Cloudflare's iframe embed only loads once a
 * card is clicked, instead of loading 16 iframes on page load. This is
 * both faster and more reliable — if your Cloudflare Stream account has
 * "require signed URLs" enabled, the public /iframe embed will fail
 * silently; check Stream settings if a clicked video doesn't play.
 */
import React, { useState, useRef, useEffect } from "react";

/* FIX — fonts: the previous version loaded Fraunces from Google's servers
   (first via CSS @import, then via a <link> tag — neither actually fixes
   this). The real issue: browsers with strict privacy shields (Brave's
   "Aggressive" fingerprinting protection, uBlock Origin with certain
   filter lists, some corporate networks) block requests to
   fonts.googleapis.com / fonts.gstatic.com at the network level — no
   amount of changing *how* you ask for the font fixes that, since the
   request itself never leaves the browser.
   The actual fix: self-host the font files so there's no external
   request at all. This uses the @fontsource npm package, which bundles
   the real font files into your own build — same font, zero network
   dependency, works identically for every visitor regardless of their
   browser/privacy settings.
   REQUIRED — run this before building:
     npm install @fontsource/fraunces @fontsource/plus-jakarta-sans
*/
import "@fontsource/fraunces/500.css";
import "@fontsource/fraunces/500-italic.css";
import "@fontsource/fraunces/600.css";
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/plus-jakarta-sans/800.css";

import poster1      from "../assets/units samples/posters/1.jpg";
import posterG1     from "../assets/units samples/posters/g1.jpg";
import posterG2     from "../assets/units samples/posters/g2.jpg";
import posterG3     from "../assets/units samples/posters/g3.jpg";
import posterShoe   from "../assets/units samples/posters/PsFiles_Shoe.jpg";
import posterCutout from "../assets/units samples/posters/Gemini_Generated_Image_e59524e59524e595-removebg-preview.png";

const BG        = "#0a0805";
const CARD      = "#161009";
const CARD_HOVER= "#1c150c";
const GOLD      = "#d4a843";
const GOLD_SOFT = "#d4a84322";
const GOLD_LINE = "#d4a84340";
const CREAM     = "#f2ead9";
const MUTED     = "#a08f68";
const MUTED_DIM = "#6b5f45";

// Your Cloudflare Stream customer subdomain — find it in the dashboard's
// Stream section (looks like "customer-abc123.cloudflarestream.com").
const CLOUDFLARE_STREAM_DOMAIN = "customer-6qz8gcj18239c7sh.cloudflarestream.com";

/* ── DATA — split into the sections they actually belong to ── */

const WEBSITES = [
  {
    tag: "Website — D2C Launch", title: "Product Launch Landing Page",
    desc: "Full-funnel landing page built for a product drop — hero, story section, and checkout handoff in one build.",
    placeholder: true, // no real screenshot uploaded yet — swap for a real <img> when ready
  },
];

const REELS = [
  { title: "Reel 1", tag: "Content", streamId: "dda5272cb5c98af54b40994e2a6120fa" /* 1.mp4 */ },
  { title: "Reel 2", tag: "Content", streamId: "4f540b17b3d495916725dae8a4f97491" /* 2.mp4 */ },
  { title: "Aura Sangam", tag: "Client / Brand", streamId: "56b79fbaf53641f139419d807ee341b1" /* AURA SANGAM1 2.mp4 */ },
  { title: "Reel — br2", tag: "Content", streamId: "900bf100d911ef9d59bfa57e58554ed9" /* br2.mp4 */ },
  { title: "Reel — bs3", tag: "Content", streamId: "56c8caa1effdea7f35d51c9f60f9533f" /* bs3.mp4 */ },
  { title: "Offer Reel (2)", tag: "Promo", streamId: "8ec0e04d3fbd05eeb57284c0356dbe82" /* offer (2).mp4 */ },
  { title: "Offer Reel", tag: "Promo", streamId: "d5209e205ef1aad2862e8464fdd0e0e7" /* offer.mp4 */ },
  { title: "Raksha Bandhan", tag: "Seasonal", streamId: "20855977be19f0847ac4ee451ec5834f" /* Raksha bandan.mp4 */ },
  { title: "Reel — Nugens", tag: "Brand", streamId: "58ef6a24c5b49e77c530d450044060e4" /* reel 1 nugens.mp4 */ },
  { title: "Reel 3-1", tag: "Content", streamId: "37b972c60790b5d4ef7e0f3a9ca8b463" /* reel 3-1.mp4 */ },
  { title: "Reel 4-1", tag: "Content", streamId: "bcfc846425fcf88f3eb7141a67a927f5" /* reel 4-1.mp4 */ },
  { title: "RS Puram", tag: "Location Shoot", streamId: "d155048c3c01af5729a81dbf368d8ed8" /* rs puram.mp4 */ },
  { title: "Show Reel", tag: "Demo Reel", streamId: "6df278ec5b571cb9d838336f6c0170c8" /* show reel.mp4 */ },
  { title: "Vismaya 2", tag: "Client / Brand", streamId: "11ca6e9d6586c6a1144eb5f9730ae1d7" /* vismaya 2.mp4 */ },
];

// TODO: replace this with the client's real words — kept generic here since
// I don't have the actual testimonial text, only the video itself.
const TESTIMONIAL = {
  streamId: "fd542e7900fad11618568ca25aeca19a", // 2.mp4 / "prince n pricess testimonial 2.mp4" — confirm which
  quote: "Working with The Units felt less like hiring an agency and more like adding a production team to ours. They understood the brief fast, and the turnaround was faster than anyone we'd worked with before.",
  name: "Client Name",
  role: "Founder — replace with real name/title",
};

const POSTERS = [
  { title: "Shoe Product Poster", tag: "Poster — Product", img: posterShoe },
  { title: "Poster Design 1", tag: "Poster — Design", img: posterG1 },
  { title: "Poster Design 2", tag: "Poster — Design", img: posterG2 },
  { title: "Poster Design 3", tag: "Poster — Design", img: posterG3 },
  { title: "AI-Enhanced Product Cutout", tag: "Poster — Cutout", img: posterCutout, contain: true },
  { title: "Poster Design", tag: "Poster — Design", img: poster1 },
];

/* ── Scroll-reveal hook — fades/slides a section up once it enters view ── */
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

/* ── Horizontal scroll-snap carousel with prev/next arrows ── */
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
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: GOLD, marginBottom: 10 }}>{eyebrow}</div>
        <h2 style={{ fontFamily: "'Fraunces',Georgia,'Times New Roman',serif", fontWeight: 600, fontSize: "clamp(24px,3vw,36px)", letterSpacing: "-0.02em", margin: 0, color: CREAM }}>{title}</h2>
        {sub && <p style={{ color: MUTED, fontSize: 14.5, marginTop: 10, maxWidth: 560, lineHeight: 1.6 }}>{sub}</p>}
      </div>
    </Reveal>
  );
}

function WebFrame({ light }) {
  return (
    <div style={{ aspectRatio: "16/10", background: "#0d0a06", borderBottom: `1px solid ${GOLD_LINE}` }}>
      <div style={{ height: 30, display: "flex", alignItems: "center", gap: 6, padding: "0 12px", background: "#1a140c", borderBottom: `1px solid ${GOLD_LINE}` }}>
        {[0, 1, 2].map(i => <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#3a301e" }} />)}
        <div style={{ flex: 1, height: 14, marginLeft: 8, borderRadius: 5, background: "#241b10" }} />
      </div>
      <div style={{ padding: 16, height: "calc(100% - 30px)", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ width: 56, height: 9, borderRadius: 3, background: light ? CREAM : GOLD, opacity: light ? 0.7 : 0.85 }} />
          <div style={{ display: "flex", gap: 8 }}>
            {[0, 1, 2].map(i => <span key={i} style={{ width: 26, height: 6, borderRadius: 3, background: "#3a301e" }} />)}
          </div>
        </div>
        <div style={{ flex: 1, borderRadius: 9, background: light ? "linear-gradient(135deg,#1a2418,#0d1108)" : "linear-gradient(135deg,#241b10,#171008)", display: "flex", flexDirection: "column", justifyContent: "center", gap: 8, padding: 18 }}>
          <div style={{ width: "62%", height: 12, borderRadius: 4, background: light ? CREAM : GOLD, opacity: light ? 0.8 : 0.9 }} />
          <div style={{ width: "80%", height: 7, borderRadius: 3, background: "#3a301e" }} />
          <div style={{ width: "45%", height: 7, borderRadius: 3, background: "#3a301e" }} />
          <div style={{ width: 74, height: 20, borderRadius: 6, background: light ? CREAM : GOLD, marginTop: 6 }} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[0, 1, 2].map(i => <div key={i} style={{ flex: 1, height: 26, borderRadius: 7, background: "#1e160d" }} />)}
        </div>
      </div>
    </div>
  );
}

/* Click-to-play reel card — shows a stylized play card first, only loads
   the real Cloudflare iframe once clicked. Fixes both the "looks broken"
   issue and the performance cost of loading 16 iframes at once. */
function PlayCard({ title, tag, streamId }) {
  const [playing, setPlaying] = useState(false);
  const ready = streamId && !streamId.startsWith("PASTE_STREAM_ID");
  // Cloudflare Stream auto-generates a thumbnail for every uploaded video —
  // no extra step needed, this URL just works. Using it as the card's
  // background so there's a real preview frame before clicking, not just
  // a bare play button on a flat gradient.
  const thumbUrl = ready ? `https://${CLOUDFLARE_STREAM_DOMAIN}/${streamId}/thumbnails/thumbnail.jpg?time=1s&height=480` : null;

  return (
    <div className="pow-piece" style={{
      flex: "0 0 240px", scrollSnapAlign: "start", border: `1px solid ${GOLD_LINE}`, borderRadius: 16,
      background: CARD, overflow: "hidden",
    }}>
      <div style={{
        aspectRatio: "9/16", position: "relative",
        background: thumbUrl ? `linear-gradient(180deg, rgba(10,8,5,0) 40%, rgba(10,8,5,0.85) 100%), url(${thumbUrl}) center/cover no-repeat, linear-gradient(200deg,#241b10,#0d0a06)` : "linear-gradient(200deg,#241b10,#0d0a06)",
      }}>
        {playing && ready ? (
          // FIX — video playback: removed the "?autoplay=true" param. Some
          // browsers/Cloudflare Stream configurations still block autoplay
          // even after a genuine click, which can look exactly like "the
          // video doesn't play." Without it, Cloudflare's own player loads
          // with its native play button visible — one guaranteed-reliable
          // extra click instead of a silent failure.
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
              width: 52, height: 52, borderRadius: "50%", background: ready ? GOLD : "transparent",
              border: ready ? "none" : `1.5px dashed ${GOLD_LINE}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {ready ? (
                <div style={{ width: 0, height: 0, borderStyle: "solid", borderWidth: "9px 0 9px 14px", borderColor: "transparent transparent transparent #0a0805", marginLeft: 3 }} />
              ) : (
                <span style={{ color: MUTED_DIM, fontSize: 18 }}>+</span>
              )}
            </div>
            <span style={{ fontSize: 11, color: ready ? MUTED : MUTED_DIM, textAlign: "center" }}>
              {ready ? "Tap to play" : "Video pending"}
            </span>
          </button>
        )}
      </div>
      <div style={{ padding: "13px 15px 15px" }}>
        <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: GOLD, display: "block", marginBottom: 4 }}>{tag}</span>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: CREAM, marginBottom: ready ? 6 : 0 }}>{title}</div>
        {/* Guaranteed fallback — always works even if the embedded iframe
            fails silently (e.g. Cloudflare "require signed URLs" enabled). */}
        {ready && (
          <a href={`https://${CLOUDFLARE_STREAM_DOMAIN}/${streamId}/watch`} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 10.5, color: MUTED_DIM, textDecoration: "none" }}>
            Not playing? Open directly ↗
          </a>
        )}
      </div>
    </div>
  );
}

function PosterCard({ title, tag, img, contain }) {
  return (
    <div className="pow-piece" style={{
      flex: "0 0 230px", scrollSnapAlign: "start", border: `1px solid ${GOLD_LINE}`, borderRadius: 16,
      background: CARD, overflow: "hidden",
    }}>
      <div style={{ aspectRatio: "4/5", background: "#0d0a06", overflow: "hidden" }}>
        <img src={img} alt={title} style={{ width: "100%", height: "100%", objectFit: contain ? "contain" : "cover", display: "block" }} />
      </div>
      <div style={{ padding: "13px 15px 15px" }}>
        <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: GOLD, display: "block", marginBottom: 4 }}>{tag}</span>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: CREAM }}>{title}</div>
      </div>
    </div>
  );
}

export default function ProofOfWork() {
  const [testimonialPlaying, setTestimonialPlaying] = useState(false);
  const testReady = TESTIMONIAL.streamId && !TESTIMONIAL.streamId.startsWith("PASTE_STREAM_ID");

  return (
    <div style={{ background: BG, color: CREAM, fontFamily: "'Plus Jakarta Sans',-apple-system,'Segoe UI',sans-serif", minHeight: "100vh", position: "relative", overflowX: "hidden" }}>
      <style>{`
        .pow-piece{ transition: transform 0.25s, border-color 0.25s, box-shadow 0.25s; }
        .pow-piece:hover{ transform: translateY(-4px); border-color: ${GOLD}; box-shadow: 0 16px 40px rgba(212,168,67,0.08); }
        .pow-play-btn{ transition: transform 0.2s; }
        .pow-piece:hover .pow-play-btn{ transform: scale(1.08); }
        .pow-pill:hover{ color:${CREAM}; border-color:${GOLD}; }
        .pow-cta:hover{ background:#e8bd5a; transform:translateY(-1px); }
        .pow-ghost:hover{ border-color:${GOLD}; background:${GOLD_SOFT}; }
        .pow-carousel-track::-webkit-scrollbar{ display:none; }
        .pow-arrow{
          position:absolute; top:50%; transform:translateY(-50%); width:38px; height:38px; border-radius:50%;
          background:${BG}; border:1px solid ${GOLD_LINE}; color:${CREAM}; font-size:20px; cursor:pointer;
          display:flex; align-items:center; justify-content:center; opacity:0.9; transition:all 0.2s; z-index:5;
        }
        .pow-arrow:hover{ border-color:${GOLD}; color:${GOLD}; opacity:1; }
        .pow-arrow-left{ left:-8px; }
        .pow-arrow-right{ right:-8px; }
        @media(max-width:700px){ .pow-arrow{ display:none; } }
        .pow-testimonial-grid{ display:grid; grid-template-columns: 340px 1fr; gap:40px; align-items:center; }
        @media(max-width:760px){ .pow-testimonial-grid{ grid-template-columns:1fr; } }
      `}</style>

      {/* Ambient backdrop */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse 900px 500px at 15% -10%, ${GOLD}14, transparent 60%), radial-gradient(ellipse 700px 600px at 110% 20%, ${GOLD}0d, transparent 60%)`,
      }} />

      {/* Top bar */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px clamp(20px,5vw,64px)", background: "rgba(10,8,5,0.86)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${GOLD_LINE}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: GOLD }} />
          <div>
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em" }}>The<b style={{ color: GOLD, fontWeight: 800 }}>Units</b></span>
            <small style={{ display: "block", fontSize: 9, color: MUTED_DIM, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 1 }}>By Nugens</small>
          </div>
        </div>
        <a href="/book" className="pow-cta" style={{ padding: "10px 22px", background: GOLD, color: "#0a0805", textDecoration: "none", borderRadius: 8, fontSize: 13, fontWeight: 700 }}>Book a Project →</a>
      </div>

      {/* Hero */}
      <section style={{ position: "relative", zIndex: 1, padding: "clamp(64px,12vh,120px) clamp(20px,5vw,64px) clamp(48px,8vh,88px)", maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11.5, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: GOLD, border: `1px solid ${GOLD_LINE}`, background: GOLD_SOFT, padding: "6px 14px", borderRadius: 99, marginBottom: 28 }}>
          ● Proof of Work
        </div>
        <h1 style={{ fontFamily: "'Fraunces',Georgia,'Times New Roman',serif", fontSize: "clamp(40px,6.4vw,84px)", fontWeight: 600, lineHeight: 1.02, letterSpacing: "-0.02em", maxWidth: "14ch", margin: 0 }}>
          Work that <em style={{ fontStyle: "italic", fontWeight: 500, color: GOLD }}>looks</em> like a full production team.
        </h1>
        <p style={{ marginTop: 26, maxWidth: 540, fontSize: 16.5, lineHeight: 1.7, color: MUTED }}>
          A sample of what we build for brands — websites, reels, and posters — across product launches,
          social campaigns, and full brand identities. Every piece here reflects the caliber of craft
          your project gets, start to finish.
        </p>
        <div style={{ display: "flex", gap: 14, marginTop: 38, flexWrap: "wrap" }}>
          <a href="/book" className="pow-cta" style={{ padding: "14px 28px", background: GOLD, color: "#0a0805", textDecoration: "none", borderRadius: 9, fontSize: 14, fontWeight: 700 }}>Book a Project</a>
          <a href="#websites" className="pow-ghost" style={{ padding: "14px 26px", border: `1px solid ${GOLD_LINE}`, color: CREAM, textDecoration: "none", borderRadius: 9, fontSize: 14, fontWeight: 600 }}>View the Work ↓</a>
        </div>
        <div style={{ display: "flex", gap: "clamp(28px,5vw,56px)", marginTop: 64, flexWrap: "wrap", paddingTop: 32, borderTop: `1px solid ${GOLD_LINE}` }}>
          {[["3", "Formats — web, video, design"], ["4–12k", "Per project, no vague quotes"], ["1", "Dashboard tracking every stage"]].map(([n, l]) => (
            <div key={l}>
              <b style={{ display: "block", fontFamily: "'Fraunces',Georgia,'Times New Roman',serif", fontSize: 30, fontWeight: 600, color: GOLD }}>{n}</b>
              <span style={{ fontSize: 12, color: MUTED_DIM }}>{l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION: Websites */}
      <section id="websites" style={{ position: "relative", zIndex: 1, maxWidth: 1180, margin: "0 auto", padding: "48px clamp(20px,5vw,64px)" }}>
        <SectionHeading eyebrow="Websites" title="Full builds, ready to convert" sub="Landing pages and brand sites — from first pixel to checkout handoff." />
        <Reveal delay={100}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
            {WEBSITES.map((w, i) => (
              <div key={i} className="pow-piece" style={{ border: `1px solid ${GOLD_LINE}`, borderRadius: 16, background: CARD, overflow: "hidden" }}>
                <WebFrame light={w.light} />
                <div style={{ padding: "16px 18px 18px" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: GOLD, marginBottom: 6, display: "block" }}>{w.tag}</span>
                  <div style={{ fontSize: 15.5, fontWeight: 700, color: CREAM, marginBottom: 4 }}>{w.title}</div>
                  <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.55 }}>{w.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* SECTION: Content Creation — Reels (horizontal carousel) */}
      <section id="reels" style={{ position: "relative", zIndex: 1, maxWidth: 1180, margin: "0 auto", padding: "24px clamp(20px,5vw,64px) 48px" }}>
        <SectionHeading eyebrow="Content Creation" title="Reels that get watched to the end" sub="Vertical short-form content — client work, brand reels, and seasonal campaigns. Tap any card to play." />
        <Reveal delay={100}>
          <Carousel>
            {REELS.map((r, i) => <PlayCard key={i} {...r} />)}
          </Carousel>
        </Reveal>
      </section>

      {/* SECTION: Client Testimonial — split video/quote */}
      <section style={{ position: "relative", zIndex: 1, maxWidth: 1180, margin: "0 auto", padding: "24px clamp(20px,5vw,64px) 48px" }}>
        <SectionHeading eyebrow="Client Testimonial" title="Straight from the people we've built for" />
        <Reveal delay={100}>
          <div className="pow-testimonial-grid" style={{ background: CARD, border: `1px solid ${GOLD_LINE}`, borderRadius: 20, padding: 28, overflow: "hidden" }}>
            <div style={{
              aspectRatio: "9/16", maxHeight: 480, borderRadius: 14, overflow: "hidden", margin: "0 auto", width: "100%",
              background: testReady
                ? `linear-gradient(180deg, rgba(10,8,5,0) 40%, rgba(10,8,5,0.85) 100%), url(https://${CLOUDFLARE_STREAM_DOMAIN}/${TESTIMONIAL.streamId}/thumbnails/thumbnail.jpg?time=1s&height=480) center/cover no-repeat, linear-gradient(200deg,#241b10,#0d0a06)`
                : "linear-gradient(200deg,#241b10,#0d0a06)",
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
                  <div className="pow-play-btn" style={{ width: 60, height: 60, borderRadius: "50%", background: testReady ? GOLD : "transparent", border: testReady ? "none" : `1.5px dashed ${GOLD_LINE}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {testReady ? <div style={{ width: 0, height: 0, borderStyle: "solid", borderWidth: "10px 0 10px 16px", borderColor: "transparent transparent transparent #0a0805", marginLeft: 3 }} /> : <span style={{ color: MUTED_DIM, fontSize: 20 }}>+</span>}
                  </div>
                  <span style={{ fontSize: 12, color: testReady ? MUTED : MUTED_DIM }}>{testReady ? "Tap to play" : "Video pending"}</span>
                </button>
              )}
            </div>
            {testReady && (
              <a href={`https://${CLOUDFLARE_STREAM_DOMAIN}/${TESTIMONIAL.streamId}/watch`} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 10.5, color: MUTED_DIM, textDecoration: "none", display: "block", textAlign: "center", marginTop: 8 }}>
                Not playing? Open directly ↗
              </a>
            )}
            <div>
              <div style={{ fontSize: 32, fontFamily: "'Fraunces',Georgia,'Times New Roman',serif", color: GOLD, lineHeight: 1, marginBottom: 10 }}>"</div>
              <p style={{ fontFamily: "'Fraunces',Georgia,'Times New Roman',serif", fontWeight: 500, fontSize: "clamp(19px,2.2vw,26px)", lineHeight: 1.5, color: CREAM, fontStyle: "italic", marginBottom: 22 }}>
                {TESTIMONIAL.quote}
              </p>
              <div style={{ fontSize: 14, fontWeight: 700, color: CREAM }}>{TESTIMONIAL.name}</div>
              <div style={{ fontSize: 12.5, color: MUTED_DIM }}>{TESTIMONIAL.role}</div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* SECTION: Posters & Brand Design (horizontal carousel) */}
      <section style={{ position: "relative", zIndex: 1, maxWidth: 1180, margin: "0 auto", padding: "24px clamp(20px,5vw,64px) 48px" }}>
        <SectionHeading eyebrow="Posters & Brand Design" title="Static work that stops the scroll" sub="Campaign posters, product creative, and brand assets — real client output." />
        <Reveal delay={100}>
          <Carousel>
            {POSTERS.map((p, i) => <PosterCard key={i} {...p} />)}
          </Carousel>
        </Reveal>
      </section>

      {/* Bottom CTA band */}
      <Reveal>
        <div style={{
          position: "relative", zIndex: 1, margin: "24px clamp(20px,5vw,64px) 0", padding: "clamp(48px,7vw,72px) clamp(28px,6vw,64px)",
          background: "linear-gradient(135deg,#1c1508,#100c06)", border: `1px solid ${GOLD_LINE}`, borderRadius: 24,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32, flexWrap: "wrap",
        }}>
          <div>
            <h2 style={{ fontFamily: "'Fraunces',Georgia,'Times New Roman',serif", fontWeight: 600, fontSize: "clamp(26px,3.4vw,40px)", maxWidth: "16ch", lineHeight: 1.1, letterSpacing: "-0.02em", margin: 0 }}>
              Like what you see? <em style={{ color: GOLD, fontStyle: "italic" }}>Let's build yours.</em>
            </h2>
            <div style={{ color: MUTED, fontSize: 14, marginTop: 10, maxWidth: "40ch" }}>
              Tell us what you're launching — we'll match it to a package and get you a straight quote, no back-and-forth.
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
            <a href="/book" className="pow-cta" style={{ padding: "14px 28px", background: GOLD, color: "#0a0805", textDecoration: "none", borderRadius: 9, fontSize: 14, fontWeight: 700 }}>Book a Project →</a>
            <a href="/pricing" className="pow-ghost" style={{ padding: "14px 26px", border: `1px solid ${GOLD_LINE}`, color: CREAM, textDecoration: "none", borderRadius: 9, fontSize: 14, fontWeight: 600 }}>View Pricing</a>
          </div>
        </div>
      </Reveal>

      <footer style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "40px 20px 48px", color: MUTED_DIM, fontSize: 12 }}>
        Made by <b style={{ color: GOLD }}>The Units</b> — Nugens Production Studio
      </footer>
    </div>
  );
}
