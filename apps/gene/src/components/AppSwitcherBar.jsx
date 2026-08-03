/**
 * AppSwitcherBar.jsx
 * Cross-app navigation bar — sits at the top of GenEChat
 * Place at: apps/gene/src/components/AppSwitcherBar.jsx
 */
import React, { useState } from "react";
import { NG_LOGO } from "../lib/logo";

const PINK = "#e8185d";

const PAID_PLANS = new Set([
  "monthly","yearly","admin",
  "hx_ind_starter","hx_ind_premium","hx_ind_pro","hx_ind_yearly",
  "hx_biz_starter","hx_biz_premium","hx_biz_pro","hx_biz_yearly",
]);

const APPS = [
  { key:"gene",    label:"Gen-E",     icon:"◎", color:"#7c3aed", url:"https://gene.nugens.in.net",    active:true  },
  { key:"hyperx",  label:"HyperX",    icon:"⬡", color:PINK,      url:"https://hyperx.nugens.in.net",  active:false },
  { key:"digihub", label:"DigiHub",   icon:"◈", color:"#0284c7", url:"https://digihub.nugens.in.net", active:false },
  { key:"units",   label:"The Units", icon:"◇", color:"#d97706", url:"https://units.nugens.in.net",   active:false },
];

export default function AppSwitcherBar({ profile }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isPaid = PAID_PLANS.has(profile?.plan || "free");

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .asb-pill {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 20px;
          text-decoration: none;
          font-size: 11px;
          font-weight: 600;
          font-family: 'Plus Jakarta Sans', sans-serif;
          border: 1px solid transparent;
          white-space: nowrap;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
          color: #9ca3af;
          background: none;
          cursor: pointer;
        }
        .asb-pill.active {
          background: var(--app-bg);
          border-color: var(--app-border);
          color: var(--app-color);
        }
        .asb-pill:not(.active):hover {
          background: var(--app-bg);
          border-color: var(--app-border);
          color: var(--app-color);
        }
        .asb-link {
          font-size: 11px;
          font-weight: 600;
          color: #9ca3af;
          text-decoration: none;
          padding: 5px 10px;
          border: 1px solid #e8eaed;
          border-radius: 7px;
          transition: color 0.15s, border-color 0.15s;
          font-family: 'Plus Jakarta Sans', sans-serif;
          white-space: nowrap;
        }
        .asb-link:hover { color: ${PINK}; border-color: ${PINK}40; }

        /* Mobile dropdown — same horizontal pill row as desktop */
        .asb-mobile-menu {
          position: fixed;
          top: 44px;
          left: 0;
          right: 0;
          background: #fff;
          border-bottom: 1px solid #f0f0f0;
          padding: 10px 16px 12px;
          z-index: 100;
          box-shadow: 0 6px 24px rgba(0,0,0,0.08);
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 6px;
        }
        .asb-mobile-menu .asb-pill {
          font-size: 12px;
          padding: 6px 13px;
        }
        .asb-mobile-divider {
          width: 100%;
          height: 1px;
          background: #f0f0f0;
          margin: 4px 0;
        }
        .asb-mobile-dashboard {
          font-size: 11px;
          font-weight: 600;
          color: #6b7280;
          text-decoration: none;
          padding: 5px 14px;
          border: 1px solid #e8eaed;
          border-radius: 7px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          white-space: nowrap;
        }

        /* ≤520px: hide desktop pills, show hamburger */
        @media (max-width: 520px) {
          .asb-desktop-apps  { display: none !important; }
          .asb-hamburger     { display: flex !important; }
          .asb-dashboard-lnk { display: none !important; }
        }
        /* >520px: hide hamburger + mobile menu */
        @media (min-width: 521px) {
          .asb-hamburger   { display: none !important; }
          .asb-mobile-menu { display: none !important; }
        }
      `}</style>

      {/* ── Top bar ── */}
      <div style={{
        height: 44,
        background: "#fff",
        borderBottom: "1px solid #f0f0f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        flexShrink: 0,
        position: "relative",
        zIndex: 50,
        fontFamily: "'Plus Jakarta Sans',sans-serif",
      }}>

        {/* Left: Logo */}
        <a href="https://nugens.in.net" style={{ display:"flex", alignItems:"center", gap:7, textDecoration:"none", flexShrink:0 }}>
          <img src={NG_LOGO} style={{ width:22, height:22, borderRadius:5, objectFit:"cover" }} alt="NG" />
          <span style={{ fontWeight:800, fontSize:13, color:"#111", letterSpacing:"-0.03em" }}>Nugens</span>
        </a>

        {/* Center: app pills — desktop only */}
        <div className="asb-desktop-apps" style={{
          display: "flex",
          alignItems: "center",
          gap: 3,
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
        }}>
          {APPS.map(app => (
            <a
              key={app.key}
              href={app.url}
              className={`asb-pill${app.active ? " active" : ""}`}
              style={{
                "--app-color":  app.color,
                "--app-bg":     `${app.color}10`,
                "--app-border": `${app.color}30`,
              }}
            >
              <span style={{ fontSize:11 }}>{app.icon}</span>
              {app.label}
              {app.active && (
                <span style={{ width:5, height:5, borderRadius:"50%", background:app.color, display:"inline-block", flexShrink:0 }}/>
              )}
            </a>
          ))}
        </div>

        {/* Right: Dashboard + Upgrade + Hamburger */}
        <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
          <a href="https://nugens.in.net/dashboard" className="asb-link asb-dashboard-lnk">
            Dashboard
          </a>
          {!isPaid && (
            <a href="/pricing" style={{
              fontSize:11, fontWeight:700, color:"#fff",
              background:PINK, textDecoration:"none",
              padding:"5px 12px", borderRadius:7, whiteSpace:"nowrap",
            }}>
              Upgrade ↑
            </a>
          )}
          {/* Hamburger — mobile only */}
          <button
            className="asb-hamburger"
            onClick={() => setMenuOpen(o => !o)}
            style={{
              display: "none",
              alignItems: "center",
              justifyContent: "center",
              width: 32, height: 32,
              background: menuOpen ? "#f8f8f8" : "none",
              border: "1px solid #e8eaed",
              borderRadius: 7,
              cursor: "pointer",
              color: "#374151",
              fontSize: 15,
            }}
          >
            {menuOpen ? "✕" : "⊞"}
          </button>
        </div>
      </div>

      {/* ── Mobile dropdown — pill row identical to desktop ── */}
      {menuOpen && (
        <>
          {/* Backdrop closes menu */}
          <div
            onClick={() => setMenuOpen(false)}
            style={{ position:"fixed", inset:0, zIndex:49 }}
          />
          <div className="asb-mobile-menu">
            {APPS.map(app => (
              <a
                key={app.key}
                href={app.url}
                className={`asb-pill${app.active ? " active" : ""}`}
                style={{
                  "--app-color":  app.color,
                  "--app-bg":     `${app.color}10`,
                  "--app-border": `${app.color}30`,
                }}
              >
                <span style={{ fontSize:11 }}>{app.icon}</span>
                {app.label}
                {app.active && (
                  <span style={{ width:5, height:5, borderRadius:"50%", background:app.color, display:"inline-block", flexShrink:0 }}/>
                )}
              </a>
            ))}
            <div className="asb-mobile-divider" />
            <a href="https://nugens.in.net/dashboard" className="asb-mobile-dashboard">
              ⊞ Dashboard
            </a>
          </div>
        </>
      )}
    </>
  );
}