import React, { useState } from "react";
import { apiPost } from "../lib/apiClient";

const PINK   = "#e8185d";
const TEXT   = "#111827";
const MUTED  = "#6b7280";
const FAINT  = "#9ca3af";
const LIGHT  = "#f8f9fb";
const CARD   = "#ffffff";
const BORDER = "#e8eaed";

const EVENT_TYPES = ["Corporate Event", "Brand Shoot", "Product Launch", "Workshop", "Content Day", "Other"];

export default function Booking({ profile }) {
  const [step,   setStep]   = useState(0);
  const [form,   setForm]   = useState({
    eventType: "", eventDate: "", venue: "", guestCount: "",
    name: profile?.full_name || "", email: profile?.email || "", phone: "", notes: "",
  });
  const [sending, setSending] = useState(false);
  const [error,   setError]   = useState("");
  const [done,    setDone]    = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name.trim() || !form.email.trim()) { setError("Name and email are required."); return; }
    setSending(true);
    setError("");
    try {
      await apiPost("/api/units/event-requests", form);
      setDone(true);
    } catch (e) {
      setError(e.message || "Couldn't submit your request. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const S = {
    page: { minHeight: "100vh", background: LIGHT, padding: "32px 36px", fontFamily: "'Plus Jakarta Sans',sans-serif" },
    h1: { fontSize: 26, fontWeight: 800, color: TEXT, letterSpacing: "-0.04em", marginBottom: 4 },
    sub: { fontSize: 13, color: MUTED, marginBottom: 28 },
    card: { background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 32, maxWidth: 560 },
    inp: { width: "100%", background: LIGHT, border: `1px solid ${BORDER}`, borderRadius: 9, padding: "11px 14px", color: TEXT, fontSize: 13.5, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 14 },
    label: { fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6, display: "block" },
    btn: { padding: "12px 26px", background: PINK, color: "#fff", border: "none", borderRadius: 9, fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
    ghost: { padding: "12px 22px", background: "none", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 9, fontSize: 13.5, cursor: "pointer", fontFamily: "inherit" },
  };

  if (done) {
    return (
      <div style={S.page}>
        <div style={{ ...S.card, textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>✓</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 8 }}>Request received</div>
          <div style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.7, marginBottom: 20 }}>
            Events and live shoots are priced individually based on duration, location, and crew size — our team will follow up with a custom quote within 1 business day.
          </div>
          <a href="/" style={{ ...S.btn, textDecoration: "none", display: "inline-block" }}>Back to Dashboard</a>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>
      <div style={S.h1}>◈ Book an Event or Shoot</div>
      <div style={S.sub}>Brand shoots, corporate events, and content production days are quoted individually — tell us about it and we'll send a custom quote.</div>

      <div style={S.card}>
        {step === 0 && (
          <>
            <div style={{ fontSize: 15, fontWeight: 700, color: TEXT, marginBottom: 16 }}>What are we shooting?</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              {EVENT_TYPES.map(t => (
                <div key={t} onClick={() => set("eventType", t)}
                  style={{ padding: "14px 16px", borderRadius: 10, border: `1.5px solid ${form.eventType === t ? PINK : BORDER}`, background: form.eventType === t ? `${PINK}08` : LIGHT, cursor: "pointer", fontSize: 13.5, fontWeight: 600, color: form.eventType === t ? PINK : TEXT, transition: "all 0.15s" }}>
                  {t}
                </div>
              ))}
            </div>
            <button onClick={() => form.eventType && setStep(1)} disabled={!form.eventType} style={{ ...S.btn, opacity: form.eventType ? 1 : 0.4 }}>Continue →</button>
          </>
        )}

        {step === 1 && (
          <>
            <div style={{ fontSize: 15, fontWeight: 700, color: TEXT, marginBottom: 16 }}>Event details</div>
            <label style={S.label}>Event Date (if known)</label>
            <input type="date" value={form.eventDate} onChange={e => set("eventDate", e.target.value)} style={S.inp} />
            <label style={S.label}>Venue / Location</label>
            <input value={form.venue} onChange={e => set("venue", e.target.value)} placeholder="City, venue name, or 'flexible'" style={S.inp} />
            <label style={S.label}>Approximate Guest Count</label>
            <input value={form.guestCount} onChange={e => set("guestCount", e.target.value)} placeholder="e.g. 100-150" style={S.inp} />
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button onClick={() => setStep(0)} style={S.ghost}>← Back</button>
              <button onClick={() => setStep(2)} style={S.btn}>Continue →</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ fontSize: 15, fontWeight: 700, color: TEXT, marginBottom: 16 }}>Your contact details</div>
            <label style={S.label}>Full Name *</label>
            <input value={form.name} onChange={e => set("name", e.target.value)} style={S.inp} />
            <label style={S.label}>Email *</label>
            <input type="email" value={form.email} onChange={e => set("email", e.target.value)} style={S.inp} />
            <label style={S.label}>Phone / WhatsApp</label>
            <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+91 XXXXXXXXXX" style={S.inp} />
            <label style={S.label}>Anything else we should know?</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value.slice(0, 1500))} placeholder="Theme, timing, special requests, reference content..."
              style={{ ...S.inp, minHeight: 90, resize: "vertical" }} />

            {error && <div style={{ fontSize: 12.5, color: "#dc2626", marginBottom: 14 }}>{error}</div>}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep(1)} style={S.ghost}>← Back</button>
              <button onClick={submit} disabled={sending} style={{ ...S.btn, opacity: sending ? 0.6 : 1 }}>{sending ? "Sending…" : "Request a Quote →"}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
