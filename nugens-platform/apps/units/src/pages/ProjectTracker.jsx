import React, { useState, useEffect } from "react";
import { apiGet, apiPost } from "../lib/apiClient";

const PINK   = "#e8185d";
const TEXT   = "#111827";
const MUTED  = "#6b7280";
const FAINT  = "#9ca3af";
const LIGHT  = "#f8f9fb";
const CARD   = "#ffffff";
const BORDER = "#e8eaed";

const STAGES = [
  { key: "paid",        label: "Booked & Paid" },
  { key: "in_progress", label: "In Progress" },
  { key: "delivered",   label: "Delivered" },
];

function StatusTimeline({ status }) {
  if (status === "refunded") {
    return <div style={{ fontSize: 12, fontWeight: 700, color: "#dc2626" }}>● Refunded</div>;
  }
  const idx = STAGES.findIndex(s => s.key === status);
  return (
    <div style={{ display: "flex", alignItems: "center", marginTop: 10 }}>
      {STAGES.map((s, i) => (
        <React.Fragment key={s.key}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 90 }}>
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              background: i <= idx ? PINK : "#fff",
              border: `2px solid ${i <= idx ? PINK : BORDER}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, color: "#fff", fontWeight: 700,
            }}>{i < idx ? "✓" : ""}</div>
            <div style={{ fontSize: 10.5, color: i <= idx ? TEXT : FAINT, fontWeight: i === idx ? 700 : 500, marginTop: 6, textAlign: "center" }}>{s.label}</div>
          </div>
          {i < STAGES.length - 1 && (
            <div style={{ flex: 1, height: 2, background: i < idx ? PINK : BORDER, marginTop: -16 }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function ProjectTracker({ profile }) {
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [openId,   setOpenId]   = useState(null);
  const [note,     setNote]     = useState("");
  const [sending,  setSending]  = useState(false);
  const [sentId,   setSentId]   = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { bookings: data } = await apiGet("/api/units/bookings/mine");
      setBookings(data || []);
    } catch (e) {
      setError(e.message || "Couldn't load your bookings.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const sendReschedule = async (id) => {
    if (!note.trim()) return;
    setSending(true);
    try {
      await apiPost(`/api/units/bookings/${id}/reschedule-request`, { message: note });
      setSentId(id);
      setNote("");
    } catch (e) {
      setError(e.message || "Couldn't send your request.");
    } finally {
      setSending(false);
    }
  };

  const S = {
    page: { minHeight: "100vh", background: LIGHT, padding: "32px 36px", fontFamily: "'Plus Jakarta Sans',sans-serif" },
    h1: { fontSize: 26, fontWeight: 800, color: TEXT, letterSpacing: "-0.04em", marginBottom: 4 },
    sub: { fontSize: 13, color: MUTED, marginBottom: 28 },
    card: { background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 22, marginBottom: 14 },
    btn: { padding: "9px 18px", background: PINK, color: "#fff", border: "none", borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  };

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>
      <div style={S.h1}>◈ Project Tracker</div>
      <div style={S.sub}>Track the status of every shoot, edit, or project you've booked with Units</div>

      {error && (
        <div style={{ background: "#dc262610", border: "1px solid #dc262630", borderRadius: 10, padding: "12px 16px", marginBottom: 16, color: "#dc2626", fontSize: 13 }}>{error}</div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: FAINT, fontSize: 13 }}>Loading…</div>
      ) : bookings.length === 0 ? (
        <div style={{ ...S.card, textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.25 }}>◈</div>
          <div style={{ fontSize: 14, color: FAINT, marginBottom: 16 }}>You haven't booked any projects yet.</div>
          <a href="/book" style={{ ...S.btn, textDecoration: "none", display: "inline-block" }}>Book a Service</a>
        </div>
      ) : (
        bookings.map(b => (
          <div key={b.id} style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>{b.service_title}</div>
                <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>{b.package_name} · ₹{(b.amount / 100).toLocaleString()}</div>
                <div style={{ fontSize: 11, color: FAINT, marginTop: 4 }}>Booked {new Date(b.created_at).toLocaleDateString()}</div>
              </div>
              <button onClick={() => setOpenId(openId === b.id ? null : b.id)} style={{ background: "none", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 7, padding: "6px 12px", fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                {openId === b.id ? "Close" : "Request change"}
              </button>
            </div>

            <StatusTimeline status={b.status} />

            {b.reschedule_note && (
              <div style={{ marginTop: 14, background: LIGHT, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 14px", fontSize: 12.5, color: MUTED }}>
                <b style={{ color: TEXT }}>Your last request:</b> {b.reschedule_note}
              </div>
            )}

            {openId === b.id && (
              <div style={{ marginTop: 14, borderTop: `1px solid ${BORDER}`, paddingTop: 14 }}>
                {sentId === b.id ? (
                  <div style={{ fontSize: 13, color: "#16a34a", fontWeight: 600 }}>✓ Request sent — we'll be in touch shortly.</div>
                ) : (
                  <>
                    <textarea value={note} onChange={e => setNote(e.target.value.slice(0, 1000))} placeholder="Tell us what you'd like to change — a new date, scope, or anything else."
                      style={{ width: "100%", background: LIGHT, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 10, color: TEXT, fontSize: 13, fontFamily: "inherit", minHeight: 70, resize: "vertical", outline: "none", boxSizing: "border-box", marginBottom: 10 }} />
                    <button onClick={() => sendReschedule(b.id)} disabled={sending || !note.trim()} style={{ ...S.btn, opacity: sending || !note.trim() ? 0.5 : 1 }}>
                      {sending ? "Sending…" : "Send Request"}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
