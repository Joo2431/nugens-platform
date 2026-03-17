/**
 * DigiHub — Image Generator
 * Fixed:
 *  1. Uses consistent NuGens color palette (matches Gen-E / HyperX / Units)
 *  2. Enhance prompt routes through backend /api/digihub/enhance-prompt
 *  3. Image generation uses free Pollinations AI (no key, no cost)
 *  4. Error handling improved
 */
import React, { useState } from "react";
import { supabase } from "../lib/supabase";

const PINK   = "#e8185d";
const TEXT   = "#111827";
const MUTED  = "#6b7280";
const LIGHT  = "#f8f9fb";
const CARD   = "#ffffff";
const BORDER = "#e8eaed";
const API    = import.meta.env.VITE_GEN_E_API_URL || "https://nugens-platform.onrender.com";

const SIZES = [
  { label: "1:1 Square (1024×1024)",      w: 1024, h: 1024 },
  { label: "16:9 Landscape (1792×1024)",  w: 1792, h: 1024 },
  { label: "9:16 Portrait (1024×1792)",   w: 1024, h: 1792 },
  { label: "4:3 Standard (1344×1024)",    w: 1344, h: 1024 },
];

const STYLES   = ["Digital Art","Photorealistic","3D Render","Flat Illustration","Watercolor","Minimal & Clean","Dark & Dramatic","Retro/Vintage","Corporate Professional","Cyberpunk/Neon"];
const PURPOSES = ["Social Media Post","Marketing Poster","Product Showcase","Brand Banner","Event Promo","Hiring Post","Business Offer","Store Announcement","Logo Concept","Infographic"];

function buildPollinationsUrl(prompt, w, h) {
  const full = `${prompt}. High quality, professional design, sharp details.`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(full)}?width=${w}&height=${h}&model=flux&nologo=true&enhance=true&seed=${Math.floor(Math.random() * 99999)}`;
}

async function callEnhance(prompt, style, purpose) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const res = await fetch(`${API}/api/digihub/enhance-prompt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ prompt, style, purpose }),
    });
    if (!res.ok) throw new Error("Enhance failed");
    const d = await res.json();
    return (d?.enhanced || prompt).trim();
  } catch {
    return prompt;
  }
}

export default function ImageGenerator({ profile }) {
  const [prompt,    setPrompt]    = useState("");
  const [sizeIdx,   setSizeIdx]   = useState(0);
  const [style,     setStyle]     = useState("Digital Art");
  const [purpose,   setPurpose]   = useState("Social Media Post");
  const [loading,   setLoading]   = useState(false);
  const [imgUrl,    setImgUrl]    = useState(null);
  const [imgFailed, setImgFailed] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [history,   setHistory]   = useState([]);

  const size = SIZES[sizeIdx];

  const enhance = async () => {
    if (!prompt.trim()) return;
    setEnhancing(true);
    const enhanced = await callEnhance(prompt, style, purpose);
    setPrompt(enhanced);
    setEnhancing(false);
  };

  const generate = () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setImgUrl(null);
    setImgFailed(false);

    const url = buildPollinationsUrl(`${style} style. ${purpose}. ${prompt}`, size.w, size.h);

    const img = new Image();
    img.onload = () => {
      setImgUrl(url);
      setHistory(h => [{ url, prompt: prompt.slice(0, 60), style, size: size.label, ts: Date.now() }, ...h].slice(0, 8));
      setLoading(false);
    };
    img.onerror = () => {
      setImgFailed(true);
      setLoading(false);
    };
    img.src = url;

    setTimeout(() => {
      if (loading) {
        setImgUrl(url);
        setLoading(false);
      }
    }, 20000);
  };

  const Sel = ({ label: lbl, value, onChange, options }) => (
    <div>
      <label style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>{lbl}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ width: "100%", padding: "9px 12px", border: `1px solid ${BORDER}`, borderRadius: 9, fontSize: 13, color: TEXT, background: CARD, fontFamily: "'Plus Jakarta Sans',sans-serif", cursor: "pointer", outline: "none" }}
      >
        {options.map(o => <option key={typeof o === "string" ? o : o.label}>{typeof o === "string" ? o : o.label}</option>)}
      </select>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", padding: "28px 32px", background: LIGHT, minHeight: "100vh" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontWeight: 800, fontSize: 22, color: TEXT, letterSpacing: "-0.04em", margin: 0 }}>
          AI Image <span style={{ color: PINK }}>Generator</span>
        </h1>
        <p style={{ color: MUTED, fontSize: 13, marginTop: 5 }}>Create stunning marketing visuals using free AI image generation.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, maxWidth: 1100 }}>
        {/* Left — Controls */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
              Describe your image
            </label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={4}
              placeholder="e.g. A vibrant Diwali sale poster with golden lights and festive colors for a fashion brand…"
              style={{ width: "100%", padding: "11px 14px", border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, color: TEXT, fontFamily: "'Plus Jakarta Sans',sans-serif", resize: "none", outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = PINK + "60"}
              onBlur={e => e.target.style.borderColor = BORDER}
            />
            <button
              onClick={enhance}
              disabled={!prompt.trim() || enhancing}
              style={{ marginTop: 8, padding: "7px 14px", background: `${PINK}10`, border: `1px solid ${PINK}30`, borderRadius: 8, fontSize: 12, fontWeight: 700, color: PINK, cursor: enhancing ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: enhancing ? 0.5 : 1 }}
            >
              {enhancing ? "Enhancing…" : "✦ Enhance with AI"}
            </button>
          </div>

          <Sel label="Size" value={size.label} onChange={v => setSizeIdx(SIZES.findIndex(s => s.label === v))} options={SIZES} />
          <Sel label="Visual Style" value={style} onChange={setStyle} options={STYLES} />
          <Sel label="Purpose" value={purpose} onChange={setPurpose} options={PURPOSES} />

          <button
            onClick={generate}
            disabled={!prompt.trim() || loading}
            style={{ padding: "13px", background: loading ? `${PINK}60` : PINK, color: "#fff", border: "none", borderRadius: 11, fontSize: 14, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", letterSpacing: "-0.01em" }}
          >
            {loading ? "Generating…" : "Generate Image"}
          </button>
        </div>

        {/* Right — Preview */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: TEXT }}>Preview</div>

          <div style={{ flex: 1, background: LIGHT, borderRadius: 12, border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 280, position: "relative", overflow: "hidden" }}>
            {loading && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>🎨</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: PINK }}>Creating your image…</div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>This may take 10–20 seconds</div>
              </div>
            )}
            {!loading && imgFailed && (
              <div style={{ textAlign: "center", padding: 20 }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>⚠️</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#dc2626", marginBottom: 6 }}>Generation failed</div>
                <div style={{ fontSize: 12, color: MUTED }}>Please try again or rephrase your prompt.</div>
              </div>
            )}
            {!loading && imgUrl && !imgFailed && (
              <img src={imgUrl} alt="Generated" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 11 }} />
            )}
            {!loading && !imgUrl && !imgFailed && (
              <div style={{ textAlign: "center", color: MUTED }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>⬡</div>
                <div style={{ fontSize: 12 }}>Your generated image appears here</div>
              </div>
            )}
          </div>

          {imgUrl && !imgFailed && (
            <div style={{ display: "flex", gap: 10 }}>
              <a
                href={imgUrl}
                download="nugens-image.jpg"
                target="_blank"
                rel="noreferrer"
                style={{ flex: 1, padding: "10px 0", background: `${PINK}10`, border: `1px solid ${PINK}30`, borderRadius: 9, fontSize: 13, fontWeight: 700, color: PINK, textDecoration: "none", textAlign: "center" }}
              >
                ↓ Download
              </a>
              <button
                onClick={generate}
                style={{ flex: 1, padding: "10px 0", background: LIGHT, border: `1px solid ${BORDER}`, borderRadius: 9, fontSize: 13, fontWeight: 700, color: TEXT, cursor: "pointer", fontFamily: "inherit" }}
              >
                ↺ Regenerate
              </button>
            </div>
          )}
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div style={{ marginTop: 32, maxWidth: 1100 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: TEXT, marginBottom: 14 }}>Recent Generations</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {history.map((h, i) => (
              <div
                key={i}
                onClick={() => { setImgUrl(h.url); setPrompt(h.prompt); }}
                style={{ cursor: "pointer", borderRadius: 10, overflow: "hidden", border: `1px solid ${BORDER}`, width: 90 }}
              >
                <img src={h.url} alt="" style={{ width: "100%", height: 60, objectFit: "cover", display: "block" }} />
                <div style={{ padding: "4px 6px", fontSize: 9, color: MUTED, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{h.style}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
