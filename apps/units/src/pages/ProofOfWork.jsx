/**
 * Units — Proof of Work (client showcase gallery)
 * A shareable portfolio page: websites, reels, and posters.
 * Route suggestion: /work or /showcase (public — no auth required,
 * since the whole point is sending this link to prospective clients).
 *
 * NOTE: The mockup frames below (browser-chrome, phone-frame, poster
 * composition) are placeholders built to show the *shape* of real work —
 * swap the WORK array's content for your actual project screenshots,
 * video thumbnails, and poster designs before sharing with clients.
 */
import React, { useState } from "react";

// Real sample work — swap/add files in src/assets/units samples/ and update
// these imports. Posters and the testimonial video below are real uploaded
// samples; reel videos are still pending (see reels/MANIFEST.md).
import poster1     from "../assets/units samples/posters/1.jpg";
import posterG1    from "../assets/units samples/posters/g1.jpg";
import posterG2    from "../assets/units samples/posters/g2.jpg";
import posterG3    from "../assets/units samples/posters/g3.jpg";
import posterShoe  from "../assets/units samples/posters/PsFiles_Shoe.jpg";
import posterCutout from "../assets/units samples/posters/Gemini_Generated_Image_e59524e59524e595-removebg-preview.png";
// Videos moved to Cloudflare Stream — see the WORK array below, where each
// video is now referenced by its Cloudflare Stream video ID instead of a
// local file import. This is what fixed the "files too large for GitHub"
// error: no video binaries live in this repo anymore.
//
// To get a video ID: Cloudflare dashboard → Stream → upload the file →
// copy the ID shown after processing completes (looks like a long hex
// string, e.g. "31c9291a1d2e...").

const BG        = "#0a0805";
const CARD      = "#161009";
const GOLD      = "#d4a843";
const GOLD_SOFT = "#d4a84322";
const GOLD_LINE = "#d4a84340";
const CREAM     = "#f2ead9";
const MUTED     = "#a08f68";
const MUTED_DIM = "#6b5f45";

const FILTERS = [
  { key: "all",    label: "All Work" },
  { key: "web",    label: "Websites" },
  { key: "reel",   label: "Reels & Video" },
  { key: "poster", label: "Posters & Brand Design" },
];

// Replace each entry's mock content with real project assets.
// type: "web" | "reel" | "testimonial" | "poster"
const WORK = [
  {
    type: "web", tag: "Website — D2C Launch", title: "Product Launch Landing Page",
    desc: "Full-funnel landing page built for a product drop — hero, story section, and checkout handoff in one build.",
    placeholder: true, // no real website screenshot uploaded yet — swap for a real <img> when ready
  },
  {
    type: "poster", tag: "Poster — Product", title: "Shoe Product Poster",
    desc: "Product-focused poster design.",
    img: posterShoe,
  },
  {
    type: "testimonial", tag: "Reel — Client Testimonial", title: "Client Testimonial Reel",
    desc: "Real client testimonial — vertical reel, ~50 seconds.",
    streamId: "fd542e7900fad11618568ca25aeca19a",
  },
  {
    type: "poster", tag: "Poster — Design 1", title: "Poster Design 1",
    desc: "Sample poster design.",
    img: posterG1,
  },
  {
    type: "poster", tag: "Poster — Design 2", title: "Poster Design 2",
    desc: "Sample poster design.",
    img: posterG2,
  },
  {
    type: "poster", tag: "Poster — Design 3", title: "Poster Design 3",
    desc: "Sample poster design.",
    img: posterG3,
  },
  {
    type: "poster", tag: "Poster — Product Cutout", title: "AI-Enhanced Product Cutout",
    desc: "Background-removed product asset, ready to drop into any campaign layout.",
    img: posterCutout, contain: true,
  },
  {
    type: "poster", tag: "Poster — Design", title: "Poster Design",
    desc: "Sample poster design.",
    img: poster1,
  },
  // Reels — all 15 wired to real files. These will render as soon as you
  // drop the matching .mp4 files into src/assets/units samples/reels/
  // (same filenames as your J:\ drive folder). Until the files actually
  // exist there, the build will fail on these imports — see note below.
  // Each streamId is a placeholder — replace with the real ID Cloudflare
  // gives you after uploading that file to Stream. Filenames kept in the
  // comment so you know which upload maps to which card.
  { type: "testimonial", tag: "Reel", title: "Reel 1", desc: "Sample reel.", streamId: "dda5272cb5c98af54b40994e2a6120fa" /* 1.mp4 */ },
  { type: "testimonial", tag: "Reel", title: "Reel 2", desc: "Sample reel.", streamId: "4f540b17b3d495916725dae8a4f97491" /* 2.mp4 */ },
  { type: "testimonial", tag: "Reel", title: "Aura Sangam", desc: "Client/brand reel.", streamId: "56b79fbaf53641f139419d807ee341b1" /* AURA SANGAM1 2.mp4 */ },
  { type: "testimonial", tag: "Reel", title: "Reel — br2", desc: "Sample reel.", streamId: "900bf100d911ef9d59bfa57e58554ed9" /* br2.mp4 */ },
  { type: "testimonial", tag: "Reel", title: "Reel — bs3", desc: "Sample reel.", streamId: "56c8caa1effdea7f35d51c9f60f9533f" /* bs3.mp4 */ },
  { type: "testimonial", tag: "Reel — Promo", title: "Offer Reel (2)", desc: "Promotional/offer reel.", streamId: "8ec0e04d3fbd05eeb57284c0356dbe82" /* offer (2).mp4 */ },
  { type: "testimonial", tag: "Reel — Promo", title: "Offer Reel", desc: "Promotional/offer reel.", streamId: "d5209e205ef1aad2862e8464fdd0e0e7" /* offer.mp4 */ },
  { type: "testimonial", tag: "Reel — Testimonial", title: "Prince & Princess Testimonial", desc: "Client testimonial reel.", streamId: "534c81621771d427e2b4b06cc8877f94" /* prince n pricess testimonial 2.mp4 */ },
  { type: "testimonial", tag: "Reel — Seasonal", title: "Raksha Bandhan", desc: "Seasonal campaign reel.", streamId: "20855977be19f0847ac4ee451ec5834f" /* Raksha bandan.mp4 */ },
  { type: "testimonial", tag: "Reel — Brand", title: "Reel 1 — Nugens", desc: "Nugens brand reel.", streamId: "58ef6a24c5b49e77c530d450044060e4" /* reel 1 nugens.mp4 */ },
  { type: "testimonial", tag: "Reel", title: "Reel 3-1", desc: "Sample reel.", streamId: "37b972c60790b5d4ef7e0f3a9ca8b463" /* reel 3-1.mp4 */ },
  { type: "testimonial", tag: "Reel", title: "Reel 4-1", desc: "Sample reel.", streamId: "bcfc846425fcf88f3eb7141a67a927f5" /* reel 4-1.mp4 */ },
  { type: "testimonial", tag: "Reel — Location", title: "RS Puram", desc: "Location/client shoot reel.", streamId: "d155048c3c01af5729a81dbf368d8ed8" /* rs puram.mp4 */ },
  { type: "testimonial", tag: "Reel — Showreel", title: "Show Reel", desc: "General show reel / demo reel.", streamId: "6df278ec5b571cb9d838336f6c0170c8" /* show reel.mp4 */ },
  { type: "testimonial", tag: "Reel — Brand", title: "Vismaya 2", desc: "Client/brand reel.", streamId: "11ca6e9d6586c6a1144eb5f9730ae1d7" /* vismaya 2.mp4 */ },
];

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

function PosterFrame({ eyebrow, word, foot, mark, accentA, accentB, img, contain }) {
  if (img) {
    return (
      <div style={{ aspectRatio: "4/5", position: "relative", background: "#0d0a06", overflow: "hidden" }}>
        <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: contain ? "contain" : "cover", display: "block" }} />
      </div>
    );
  }
  return (
    <div style={{
      aspectRatio: "4/5", position: "relative", display: "flex", flexDirection: "column",
      justifyContent: "space-between", padding: 22, overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", inset: 0, opacity: 0.5, pointerEvents: "none",
        background: `radial-gradient(circle at 30% 20%, ${accentA} 0%, transparent 45%), radial-gradient(circle at 80% 85%, ${accentB} 0%, transparent 50%)`,
      }} />
      <div style={{ position: "relative", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: CREAM, opacity: 0.75 }}>{eyebrow}</div>
      <div style={{ position: "relative", fontFamily: "'Fraunces',serif", fontWeight: 600, lineHeight: 0.96, color: CREAM, fontSize: 32, whiteSpace: "pre-line" }}>{word}</div>
      <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <span style={{ fontSize: 9.5, color: CREAM, opacity: 0.7 }}>{foot}</span>
        <div style={{ width: 26, height: 26, borderRadius: "50%", border: `1.5px solid ${CREAM}`, opacity: 0.8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: CREAM }}>{mark}</div>
      </div>
    </div>
  );
}

// CLOUDFLARE_ACCOUNT: your Cloudflare account's "customer subdomain" for
// Stream — find it in the dashboard's Stream section, it looks like
// "customer-abc123xyz.cloudflarestream.com". Set it once here.
const CLOUDFLARE_STREAM_DOMAIN = "customer-6qz8gcj18239c7sh.cloudflarestream.com";

function VideoFrame({ streamId }) {
  const ready = streamId && !streamId.startsWith("PASTE_STREAM_ID");
  return (
    <div style={{ aspectRatio: "9/16", position: "relative", background: "#0d0a06" }}>
      {ready ? (
        <iframe
          src={`https://${CLOUDFLARE_STREAM_DOMAIN}/${streamId}/iframe`}
          style={{ width: "100%", height: "100%", border: "none", display: "block" }}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen
        />
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: MUTED_DIM, fontSize: 11, textAlign: "center", padding: 16 }}>
          Paste a real Cloudflare Stream ID for this card
        </div>
      )}
    </div>
  );
}

function PendingFrame({ label }) {
  return (
    <div style={{ aspectRatio: "9/13", position: "relative", background: "#0d0a06", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, borderBottom: `1px solid ${GOLD_LINE}` }}>
      <div style={{ width: 40, height: 40, borderRadius: "50%", border: `1.5px dashed ${GOLD_LINE}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: MUTED_DIM }}>+</div>
      <div style={{ fontSize: 11, color: MUTED_DIM, textAlign: "center", padding: "0 16px" }}>Reel pending —<br/>"{label}"</div>
    </div>
  );
}



export default function ProofOfWork() {
  const [filter, setFilter] = useState("all");
  const visible = filter === "all" ? WORK : WORK.filter(w => (filter === "reel" ? (w.type === "reel" || w.type === "testimonial") : w.type === filter));

  return (
    <div style={{ background: BG, color: CREAM, fontFamily: "'Plus Jakarta Sans', sans-serif", minHeight: "100vh", position: "relative", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,500;9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .pow-piece{ transition: transform 0.25s, border-color 0.25s, box-shadow 0.25s; }
        .pow-piece:hover{ transform: translateY(-4px); border-color: ${GOLD}; box-shadow: 0 16px 40px rgba(212,168,67,0.08); }
        .pow-pill:hover{ color:${CREAM}; border-color:${GOLD}; }
        .pow-cta:hover{ background:#e8bd5a; transform:translateY(-1px); }
        .pow-ghost:hover{ border-color:${GOLD}; background:${GOLD_SOFT}; }
        @media(max-width:980px){ .pow-web{ grid-column: span 12 !important; } .pow-poster,.pow-reel{ grid-column: span 6 !important; } }
        @media(max-width:620px){ .pow-web,.pow-poster,.pow-reel{ grid-column: span 12 !important; } }
      `}</style>

      {/* Ambient backdrop */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse 900px 500px at 15% -10%, ${GOLD}14, transparent 60%), radial-gradient(ellipse 700px 600px at 110% 20%, ${GOLD}0d, transparent 60%)`,
      }} />

      {/* Top bar — remove if this page renders inside Units' existing app
          shell/Sidebar layout; keep if it's a standalone public route. */}
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
        <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: "clamp(40px,6.4vw,84px)", fontWeight: 600, lineHeight: 1.02, letterSpacing: "-0.02em", maxWidth: "14ch", margin: 0 }}>
          Work that <em style={{ fontStyle: "italic", fontWeight: 500, color: GOLD }}>looks</em> like a full production team.
        </h1>
        <p style={{ marginTop: 26, maxWidth: 540, fontSize: 16.5, lineHeight: 1.7, color: MUTED }}>
          A sample of what we build for brands — websites, reels, and posters — across product launches,
          social campaigns, and full brand identities. Every piece here reflects the caliber of craft
          your project gets, start to finish.
        </p>
        <div style={{ display: "flex", gap: 14, marginTop: 38, flexWrap: "wrap" }}>
          <a href="/book" className="pow-cta" style={{ padding: "14px 28px", background: GOLD, color: "#0a0805", textDecoration: "none", borderRadius: 9, fontSize: 14, fontWeight: 700 }}>Book a Project</a>
          <a href="#gallery" className="pow-ghost" style={{ padding: "14px 26px", border: `1px solid ${GOLD_LINE}`, color: CREAM, textDecoration: "none", borderRadius: 9, fontSize: 14, fontWeight: 600 }}>View the Work ↓</a>
        </div>
        <div style={{ display: "flex", gap: "clamp(28px,5vw,56px)", marginTop: 64, flexWrap: "wrap", paddingTop: 32, borderTop: `1px solid ${GOLD_LINE}` }}>
          {[["3", "Formats — web, video, design"], ["4–12k", "Per project, no vague quotes"], ["1", "Dashboard tracking every stage"]].map(([n, l]) => (
            <div key={l}>
              <b style={{ display: "block", fontFamily: "'Fraunces',serif", fontSize: 30, fontWeight: 600, color: GOLD }}>{n}</b>
              <span style={{ fontSize: 12, color: MUTED_DIM }}>{l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Filter bar */}
      <div id="gallery" style={{ position: "relative", zIndex: 1, maxWidth: 1180, margin: "0 auto", padding: "0 clamp(20px,5vw,64px)", display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 40 }}>
        {FILTERS.map(f => (
          <button key={f.key} className="pow-pill" onClick={() => setFilter(f.key)} style={{
            padding: "9px 20px", borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: "pointer",
            border: `1px solid ${GOLD_LINE}`, background: filter === f.key ? GOLD : "transparent",
            color: filter === f.key ? "#0a0805" : MUTED, fontFamily: "inherit", whiteSpace: "nowrap",
          }}>{f.label}</button>
        ))}
      </div>

      {/* Gallery grid */}
      <div style={{ position: "relative", zIndex: 1, maxWidth: 1180, margin: "0 auto", padding: "0 clamp(20px,5vw,64px) 40px", display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 20 }}>
        {visible.map((w, i) => (
          <div key={i} className={`pow-piece pow-${w.type === "testimonial" ? "reel" : w.type}`} style={{
            gridColumn: `span ${w.type === "web" ? 6 : 4}`,
            border: `1px solid ${GOLD_LINE}`, borderRadius: 16, background: CARD, overflow: "hidden", display: "flex", flexDirection: "column",
          }}>
            {w.type === "web" && <WebFrame light={w.light} />}
            {w.type === "poster" && <PosterFrame {...w} />}
            {w.type === "testimonial" && <VideoFrame streamId={w.streamId} />}
            {w.type === "reel" && <PendingFrame label={w.title} />}
            <div style={{ padding: "16px 18px 18px" }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: GOLD, marginBottom: 6, display: "block" }}>{w.tag}</span>
              <div style={{ fontSize: 15.5, fontWeight: 700, color: CREAM, marginBottom: 4, letterSpacing: "-0.01em" }}>{w.title}</div>
              <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.55 }}>{w.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA band */}
      <div style={{
        position: "relative", zIndex: 1, margin: "60px clamp(20px,5vw,64px) 0", padding: "clamp(48px,7vw,72px) clamp(28px,6vw,64px)",
        background: "linear-gradient(135deg,#1c1508,#100c06)", border: `1px solid ${GOLD_LINE}`, borderRadius: 24,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32, flexWrap: "wrap",
      }}>
        <div>
          <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 600, fontSize: "clamp(26px,3.4vw,40px)", maxWidth: "16ch", lineHeight: 1.1, letterSpacing: "-0.02em", margin: 0 }}>
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

      <footer style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "40px 20px 48px", color: MUTED_DIM, fontSize: 12 }}>
        Made by <b style={{ color: GOLD }}>The Units</b> — Nugens Production Studio
      </footer>
    </div>
  );
}
