import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { apiGet } from "../lib/apiClient";

const PINK   = "#e8185d";
const TEXT   = "#111827";
const MUTED  = "#6b7280";
const FAINT  = "#9ca3af";
const LIGHT  = "#f8f9fb";
const CARD   = "#ffffff";
const BORDER = "#e8eaed";

const STATUS_LABEL = { paid: "Booked & Paid", in_progress: "In Progress", delivered: "Delivered", refunded: "Refunded" };

export default function BookingPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  useEffect(() => {
    apiGet(`/api/units/bookings/${id}`)
      .then(d => setBooking(d.booking))
      .catch(e => setError(e.message || "Booking not found."))
      .finally(() => setLoading(false));
  }, [id]);

  const S = {
    page: { minHeight: "100vh", background: LIGHT, padding: "48px 36px", fontFamily: "'Plus Jakarta Sans',sans-serif", display: "flex", justifyContent: "center" },
    card: { background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 36, maxWidth: 520, width: "100%" },
    row: { display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${BORDER}`, fontSize: 13.5 },
  };

  if (loading) return <div style={S.page}><div style={{ color: FAINT, fontSize: 13 }}>Loading receipt…</div></div>;

  if (error || !booking) {
    return (
      <div style={S.page}>
        <div style={{ ...S.card, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 14, opacity: 0.3 }}>◈</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: TEXT, marginBottom: 8 }}>Couldn't find this booking</div>
          <div style={{ fontSize: 13, color: MUTED, marginBottom: 18 }}>{error || "It may not belong to your account."}</div>
          <a href="/tracker" style={{ color: PINK, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Go to My Bookings →</a>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'); @media print { .no-print { display:none; } }`}</style>
      <div style={S.card}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>✓</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: TEXT }}>Booking Confirmed</div>
          <div style={{ fontSize: 12.5, color: MUTED, marginTop: 4 }}>Receipt #{booking.id.slice(0, 8).toUpperCase()}</div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={S.row}><span style={{ color: MUTED }}>Service</span><span style={{ fontWeight: 700, color: TEXT }}>{booking.service_title}</span></div>
          <div style={S.row}><span style={{ color: MUTED }}>Package</span><span style={{ fontWeight: 700, color: TEXT }}>{booking.package_name}</span></div>
          <div style={S.row}><span style={{ color: MUTED }}>Amount Paid</span><span style={{ fontWeight: 800, color: PINK }}>₹{(booking.amount / 100).toLocaleString()}</span></div>
          <div style={S.row}><span style={{ color: MUTED }}>Status</span><span style={{ fontWeight: 700, color: TEXT }}>{STATUS_LABEL[booking.status] || booking.status}</span></div>
          <div style={S.row}><span style={{ color: MUTED }}>Booked On</span><span style={{ color: TEXT }}>{new Date(booking.created_at).toLocaleString()}</span></div>
          <div style={{ ...S.row, borderBottom: "none" }}><span style={{ color: MUTED }}>Payment ID</span><span style={{ color: FAINT, fontSize: 12 }}>{booking.razorpay_payment_id}</span></div>
        </div>

        <div className="no-print" style={{ display: "flex", gap: 10 }}>
          <button onClick={() => window.print()} style={{ flex: 1, padding: "11px 0", background: "none", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Print / Save PDF</button>
          <a href="/tracker" style={{ flex: 1, textAlign: "center", padding: "11px 0", background: PINK, color: "#fff", borderRadius: 9, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Track Project →</a>
        </div>
      </div>
    </div>
  );
}
