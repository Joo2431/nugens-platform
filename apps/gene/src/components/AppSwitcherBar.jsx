/**
 * AppSwitcherBar.jsx
 * Cross-app navigation bar — sits at the top of GenEChat
 * Place at: apps/gene/src/components/AppSwitcherBar.jsx
 * Import in GenEChat.jsx instead of the inline AppSwitcherBar function
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
  { key:"gene",    label:"Gen-E",    icon:"◎", color:"#7c3aed", url:"https://gene.nugens.in.net",    active:true  },
  { key:"hyperx",  label:"HyperX",   icon:"⬡", color:PINK,      url:"https://hyperx.nugens.in.net",  active:false },
  { key:"digihub", label:"DigiHub",  icon:"◈", color:"#0284c7", url:"https://digihub.nugens.in.net", active:false },
  { key:"units",   label:"The Units",icon:"◇", color:"#d97706", url:"https://units.nugens.in.net",   active:false },
];

export default function AppSwitcherBar({ profile }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isPaid = PAID_PLANS.has(profile?.plan || "free");

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .asb-app { display:flex; align-items:center; gap:5px; padding:5px 12px; border-radius:20px; text-decoration:none; font-size:12px; font-weight:600; transition:all 0.15s; font-family:'Plus Jakarta Sans',sans-serif; border:1px solid transparent; }
        .asb-app:hover { border-color: var(--app-color,${PINK})30 !important; }
        .asb-link { font-size:11px; font-weight:600; color:#9ca3af; text-decoration:none; padding:5px 10px; border:1px solid #e8eaed; border-radius:7px; transition:all 0.15s; font-family:'Plus Jakarta Sans',sans-serif; }
        .asb-link:hover { color:${PINK}; border-color:${PINK}40; }

        /* Mobile app menu */
        .asb-mobile-menu { position:fixed; top:44px; left:0; right:0; background:#fff; border-bottom:1px solid #f0f0f0; padding:12px 16px; z-index:100; box-shadow:0 4px 20px rgba(0,0,0,0.08); display:grid; grid-template-columns:1fr 1fr; gap:8px; }
        .asb-mobile-app { display:flex; align-items:center; gap:8px; padding:10px 12px; border-radius:10px; text-decoration:none; font-size:12px; font-weight:600; border:1px solid #f0f0f0; font-family:'Plus Jakarta Sans',sans-serif; color:#374151; transition:all 0.15s; }
        .asb-mobile-app:hover { border-color:var(--app-color)30; }
        .asb-mobile-app.active { background:var(--app-bg); border-color:var(--app-color)30; color:var(--app-color); }

        @media (max-width:640px) {
          .asb-desktop-apps { display:none !important; }
          .asb-hamburger { display:flex !important; }
          .asb-dashboard-lnk { display:none !important; }
        }
        @media (min-width:641px) {
          .asb-hamburger { display:none !important; }
          .asb-mobile-menu { display:none !important; }
        }
      `}</style>

      <div style={{
        height:44, background:"#fff", borderBottom:"1px solid #f0f0f0",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 16px", flexShrink:0, position:"relative", zIndex:50,
        fontFamily:"'Plus Jakarta Sans',sans-serif",
      }}>

        {/* Left: Nugens logo — NOTE: "Nugens" lowercase g */}
        <a href="https://nugens.in.net" style={{ display:"flex", alignItems:"center", gap:7, textDecoration:"none", flexShrink:0 }}>
          <img src={NG_LOGO} style={{ width:22, height:22, borderRadius:5, objectFit:"cover" }} alt="NG" />
          <span style={{ fontWeight:800, fontSize:13, color:"#111", letterSpacing:"-0.03em" }}>
            Nugens
          </span>
        </a>

        {/* Center: App pills — desktop only */}
        <div className="asb-desktop-apps" style={{ display:"flex", alignItems:"center", gap:3, position:"absolute", left:"50%", transform:"translateX(-50%)" }}>
          {APPS.map(app => (
            <a
              key={app.key}
              href={app.url}
              className="asb-app"
              style={{
                "--app-color": app.color,
                background:    app.active ? `${app.color}10` : "none",
                color:         app.active ? app.color : "#9ca3af",
                borderColor:   app.active ? `${app.color}30` : "transparent",
              }}
              onMouseEnter={e => {
                if (!app.active) {
                  e.currentTarget.style.background = `${app.color}10`;
                  e.currentTarget.style.color = app.color;
                  e.currentTarget.style.borderColor = `${app.color}30`;
                }
              }}
              onMouseLeave={e => {
                if (!app.active) {
                  e.currentTarget.style.background = "none";
                  e.currentTarget.style.color = "#9ca3af";
                  e.currentTarget.style.borderColor = "transparent";
                }
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

        {/* Right: Dashboard link + Upgrade */}
        <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
          <a href="https://nugens.in.net/dashboard" className="asb-link asb-dashboard-lnk">
            Dashboard
          </a>
          {!isPaid && (
            <a href="/pricing" style={{ fontSize:11, fontWeight:700, color:"#fff", background:PINK, textDecoration:"none", padding:"5px 12px", borderRadius:7, whiteSpace:"nowrap" }}>
              Upgrade ↑
            </a>
          )}
          {/* Mobile hamburger for app switcher */}
          <button
            className="asb-hamburger"
            onClick={() => setMenuOpen(o => !o)}
            style={{ display:"none", alignItems:"center", justifyContent:"center", width:32, height:32, background:"none", border:"1px solid #e8eaed", borderRadius:7, cursor:"pointer", color:"#6b7280", fontSize:16 }}
          >
            {menuOpen ? "✕" : "⊞"}
          </button>
        </div>
      </div>

      {/* Mobile app menu dropdown */}
      {menuOpen && (
        <>
          <div onClick={() => setMenuOpen(false)} style={{ position:"fixed", inset:0, zIndex:49 }}/>
          <div className="asb-mobile-menu">
            {APPS.map(app => (
              <a
                key={app.key}
                href={app.url}
                className={`asb-mobile-app${app.active ? " active" : ""}`}
                style={{ "--app-color": app.color, "--app-bg": `${app.color}10` }}
              >
                <span style={{ fontSize:16, color:app.color }}>{app.icon}</span>
                <div>
                  <div style={{ fontSize:12, fontWeight:700 }}>{app.label}</div>
                  {app.active && <div style={{ fontSize:9, color:app.color, fontWeight:600 }}>Current app</div>}
                </div>
              </a>
            ))}
            <a href="https://nugens.in.net/dashboard" className="asb-mobile-app" style={{ gridColumn:"1/-1", justifyContent:"center", color:"#374151" }}>
              ⊞ Back to Nugens Dashboard
            </a>
          </div>
        </>
      )}
    </>
  );
}
