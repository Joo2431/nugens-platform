import React, { useState, useRef } from "react";
import { supabase } from "../lib/supabase";

const PINK   = "#e8185d";
const TEXT   = "#111827";
const MUTED  = "#6b7280";
const LIGHT  = "#f8f9fb";
const CARD   = "#ffffff";
const BORDER = "#e8eaed";
const API    = import.meta.env.VITE_GEN_E_API_URL || "https://nugens-platform.onrender.com";

const SIZES = [
  { label: "1:1 Square (1024×1024)",     value: "1024x1024", w: 1024, h: 1024 },
  { label: "16:9 Landscape (1792×1024)", value: "1792x1024", w: 1792, h: 1024 },
  { label: "9:16 Portrait (1024×1792)",  value: "1024x1792", w: 1024, h: 1792 },
];

const STYLES   = ["Digital Art","Photorealistic","3D Render","Flat Illustration","Watercolor","Minimal & Clean","Dark & Dramatic","Retro/Vintage","Corporate Professional","Cyberpunk/Neon"];
const PURPOSES = ["Social Media Post","Marketing Poster","Product Showcase","Brand Banner","Event Promo","Hiring Post","Business Offer","Store Announcement","Logo Concept","Infographic"];

async function getToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

export default function ImageGenerator({ profile }) {
  const [prompt,    setPrompt]    = useState("");
  const [sizeIdx,   setSizeIdx]   = useState(0);
  const [style,     setStyle]     = useState("Digital Art");
  const [purpose,   setPurpose]   = useState("Social Media Post");
  const [loading,   setLoading]   = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [imgUrl,    setImgUrl]    = useState(null);
  const [error,     setError]     = useState(null);
  const [history,   setHistory]   = useState([]);
  const abortRef = useRef(null);

  const size = SIZES[sizeIdx];

  /* ── Enhance prompt via backend ── */
  const enhance = async () => {
    if (!prompt.trim()) return;
    setEnhancing(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/digihub/enhance-prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ prompt, style, purpose }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error("Enhance failed");
      const d = await res.json();
      if (d.enhanced) setPrompt(d.enhanced.trim());
    } catch (e) {
      console.warn("Enhance error:", e.message);
    } finally {
      setEnhancing(false);
    }
  };

  /* ── Generate image via backend DALL-E 3 ── */
  const generate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setImgUrl(null);
    setError(null);

    // Cancel any previous in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const token = await getToken();
      const fullPrompt = `${style} style. For ${purpose}. ${prompt}. High quality, professional design, sharp details.`;

      const res = await fetch(`${API}/api/digihub/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ prompt: fullPrompt, size: size.value, style }),
        signal: controller.signal,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || data.details || `Server error ${res.status}`);
      }

      if (!data.url) throw new Error("No image URL returned");

      setImgUrl(data.url);
      setHistory(h => [
        { url: data.url, prompt: prompt.slice(0, 60), style, size: size.label, ts: Date.now() },
        ...h,
      ].slice(0, 8));

    } catch (err) {
      if (err.name === "AbortError") return; // user navigated away, not an error
      console.error("Image gen error:", err.message);
      setError(err.message || "Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const Sel = ({ label: lbl, value, onChange, options }) => (
    <div>
      <label style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>{lbl}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ width: "100%", padding: "9px 12px", border: `1px solid ${BORDER}`, borderRadius: 9, fontSize: 13, color: TEXT, background: CARD, fontFamily: "'Plus Jakarta Sans',sans-serif", cursor: "pointer", outline: "none" }}
      >
        {options.map(o => <option key={typeof o === "string" ? o : o.label} value={typeof o === "string" ? o : o.label}>{typeof o === "string" ? o : o.label}</option>)}
      </select>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", padding: "28px 32px", background: LIGHT, minHeight: "100vh" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontWeight: 800, fontSize: 22, color: TEXT, letterSpacing: "-0.04em", margin: 0 }}>
          AI Image <span style={{ color: PINK }}>Generator</span>
        </h1>
        <p style={{ color: MUTED, fontSize: 13, marginTop: 5 }}>
          Create stunning marketing visuals powered by DALL-E 3.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, maxWidth: 1100 }}>

        {/* ── Left: Controls ── */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Prompt */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
              Describe your image
            </label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={5}
              placeholder="e.g. A vibrant Diwali sale poster with golden lights and festive colors for a fashion brand…"
              style={{ width: "100%", padding: "11px 14px", border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, color: TEXT, fontFamily: "'Plus Jakarta Sans',sans-serif", resize: "vertical", outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = PINK + "60"}
              onBlur={e => e.target.style.borderColor = BORDER}
              onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) generate(); }}
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
            style={{ padding: "13px", background: loading ? `${PINK}60` : PINK, color: "#fff", border: "none", borderRadius: 11, fontSize: 14, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", letterSpacing: "-0.01em", transition: "all 0.15s" }}
          >
            {loading ? "Generating… (15–30s)" : "Generate Image"}
          </button>

          <p style={{ fontSize: 11, color: MUTED, margin: 0, textAlign: "center" }}>
            Powered by DALL-E 3 · Ctrl+Enter to generate
          </p>
        </div>

        {/* ── Right: Preview ── */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: TEXT }}>Preview</div>

          <div style={{ flex: 1, background: LIGHT, borderRadius: 12, border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, position: "relative", overflow: "hidden" }}>

            {/* Loading state */}
            {loading && (
              <div style={{ textAlign: "center", padding: 24 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🎨</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: PINK, marginBottom: 6 }}>Creating your image…</div>
                <div style={{ fontSize: 11, color: MUTED }}>DALL-E 3 is working on it — usually 15–30 seconds</div>
                <div style={{ marginTop: 16, display: "flex", gap: 4, justifyContent: "center" }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: PINK, opacity: 0.6,
                      animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
                  ))}
                </div>
                <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-8px)}}`}</style>
              </div>
            )}

            {/* Error state */}
            {!loading && error && (
              <div style={{ textAlign: "center", padding: 24 }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>⚠️</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#dc2626", marginBottom: 8 }}>Generation Failed</div>
                <div style={{ fontSize: 11, color: MUTED, marginBottom: 16, maxWidth: 240, lineHeight: 1.5 }}>{error}</div>
                <button onClick={generate} disabled={!prompt.trim()}
                  style={{ padding: "8px 18px", background: PINK, color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  Try Again
                </button>
              </div>
            )}

            {/* Success state */}
            {!loading && imgUrl && !error && (
              <img
                src={imgUrl}
                alt="Generated"
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 11 }}
                onError={() => setError("Image failed to load. Try regenerating.")}
              />
            )}

            {/* Empty state */}
            {!loading && !imgUrl && !error && (
              <div style={{ textAlign: "center", color: MUTED }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>✦</div>
                <div style={{ fontSize: 12 }}>Your generated image appears here</div>
                <div style={{ fontSize: 11, marginTop: 4, opacity: 0.6 }}>Enter a prompt and click Generate</div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          {imgUrl && !error && !loading && (
            <div style={{ display: "flex", gap: 10 }}>
              <a
                href={imgUrl}
                target="_blank"
                rel="noreferrer"
                download="nugens-image.jpg"
                style={{ flex: 1, padding: "10px 0", background: `${PINK}10`, border: `1px solid ${PINK}30`, borderRadius: 9, fontSize: 13, fontWeight: 700, color: PINK, textDecoration: "none", textAlign: "center" }}
              >
                ↓ Download
              </a>
              <button
                onClick={generate}
                disabled={loading}
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
                onClick={() => { setImgUrl(h.url); setPrompt(h.prompt); setError(null); }}
                style={{ cursor: "pointer", borderRadius: 10, overflow: "hidden", border: `1px solid ${BORDER}`, width: 100, transition: "transform 0.12s" }}
                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04)"}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
              >
                <img src={h.url} alt="" style={{ width: "100%", height: 70, objectFit: "cover", display: "block" }} />
                <div style={{ padding: "4px 6px", fontSize: 9, color: MUTED, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{h.style}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}