import React, { useState, useEffect } from "react";
import { apiGet, apiPatch } from "../lib/apiClient";

const PINK   = "#e8185d";
const TEXT   = "#111827";
const MUTED  = "#6b7280";
const FAINT  = "#9ca3af";
const LIGHT  = "#f8f9fb";
const CARD   = "#ffffff";
const BORDER = "#e8eaed";

const STATUS_COLOR = { paid: "#0284c7", in_progress: "#d97706", delivered: "#16a34a", refunded: "#dc2626" };
const STATUS_LABEL = { paid: "Booked & Paid", in_progress: "In Progress", delivered: "Delivered", refunded: "Refunded" };
const NEXT_STATUS  = { paid: "in_progress", in_progress: "delivered", delivered: "delivered", refunded: "refunded" };

export default function Projects({ profile }) {
  const isAdmin = profile?.plan === "admin";

  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [filter,   setFilter]   = useState("all");
  const [updating, setUpdating] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { bookings: data } = await apiGet("/api/units/bookings/all");
      setBookings(data || []);
    } catch (e) {
      setError(e.message || "Couldn't load projects.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const advance = async (id, current) => {
    const next = NEXT_STATUS[current];
    setUpdating(id);
    setBookings(bs => bs.map(b => b.id === id ? { ...b, status: next } : b)); // optimistic
    try {
      await apiPatch(`/api/units/bookings/${id}/status`, { status: next });
    } catch {
      load();
    } finally {
      setUpdating(null);
    }
  };

  const filtered = filter === "all" ? bookings : bookings.filter(b => b.status === filter);
  const counts = {
    all: bookings.length,
    paid: bookings.filter(b => b.status === "paid").length,
    in_progress: bookings.filter(b => b.status === "in_progress").length,
    delivered: bookings.filter(b => b.status === "delivered").length,
  };

  const S = {
    page: { minHeight: "100vh", background: LIGHT, padding: "32px 36px", fontFamily: "'Plus Jakarta Sans',sans-serif" },
    h1: { fontSize: 26, fontWeight: 800, color: TEXT, letterSpacing: "-0.04em", marginBottom: 4 },
    sub: { fontSize: 13, color: MUTED, marginBottom: 28 },
    card: { background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18, marginBottom: 10 },
    pill: { padding: "5px 13px", borderRadius: 20, fontSize: 11.5, fontWeight: 600, cursor: "pointer", border: "none", fontFamily: "inherit" },
  };

  if (!isAdmin) {
    return (
      <div style={S.page}>
        <div style={{ ...S.card, maxWidth: 460, margin: "80px auto", textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 32, marginBottom: 14, opacity: 0.3 }}>◈</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: TEXT, marginBottom: 8 }}>Admin access required</div>
          <div style={{ fontSize: 13, color: MUTED }}>This project board is for the Nugens / Units team. If you're looking for your own bookings, head to Project Tracker instead.</div>
          <a href="/tracker" style={{ display: "inline-block", marginTop: 18, padding: "9px 20px", background: PINK, color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Go to My Bookings</a>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>
      <div style={S.h1}>⊞ Projects</div>
      <div style={S.sub}>All Units bookings — move each project through its lifecycle</div>

      <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>
        {[
          { key: "all", label: `All (${counts.all})` },
          { key: "paid", label: `Booked (${counts.paid})` },
          { key: "in_progress", label: `In Progress (${counts.in_progress})` },
          { key: "delivered", label: `Delivered (${counts.delivered})` },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{ ...S.pill, background: filter === f.key ? TEXT : CARD, color: filter === f.key ? "#fff" : MUTED, border: filter === f.key ? "none" : `1px solid ${BORDER}` }}>{f.label}</button>
        ))}
      </div>

      {error && <div style={{ background: "#dc262610", border: "1px solid #dc262630", borderRadius: 10, padding: "12px 16px", marginBottom: 16, color: "#dc2626", fontSize: 13 }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: FAINT, fontSize: 13 }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ ...S.card, textAlign: "center", padding: 48, color: FAINT }}>No projects in this filter yet.</div>
      ) : (
        filtered.map(b => (
          <div key={b.id} style={{ ...S.card, display: "grid", gridTemplateColumns: "1fr auto auto", gap: 16, alignItems: "center" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: STATUS_COLOR[b.status], display: "inline-block" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLOR[b.status] }}>{STATUS_LABEL[b.status]}</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>{b.service_title} — {b.package_name}</div>
              <div style={{ fontSize: 12.5, color: MUTED, marginTop: 2 }}>{b.name} · {b.email} {b.phone ? `· ${b.phone}` : ""}</div>
              {b.note && <div style={{ fontSize: 12, color: FAINT, marginTop: 4 }}>Note: {b.note}</div>}
              {b.reschedule_note && <div style={{ fontSize: 12, color: "#d97706", marginTop: 4 }}>⚠ Reschedule request: {b.reschedule_note}</div>}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, whiteSpace: "nowrap" }}>₹{(b.amount / 100).toLocaleString()}</div>
            <button
              onClick={() => advance(b.id, b.status)}
              disabled={b.status === "delivered" || b.status === "refunded" || updating === b.id}
              style={{ padding: "8px 16px", background: b.status === "delivered" ? BORDER : PINK, color: b.status === "delivered" ? FAINT : "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: b.status === "delivered" ? "default" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
            >
              {updating === b.id ? "..." : b.status === "paid" ? "Start →" : b.status === "in_progress" ? "Mark Delivered →" : "Delivered ✓"}
            </button>
          </div>
        ))
      )}
    </div>
  );
}
