import React, { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const PURPLE = "#7c3aed";
const PINK   = "#e8185d";
const B      = "#1e1e2e";

const NAV = [
  { to: "/",           icon: "◎", label: "Dashboard"   },
  { to: "/courses",    icon: "⬡", label: "Courses"      },
  { to: "/paths",      icon: "◈", label: "Learning Paths"},
  { to: "/certificates",icon:"◇", label: "Certificates" },
  { to: "/community",  icon: "⬟", label: "Community"    },
  { to: "/assistant",  icon: "✦", label: "AI Assistant" },
];

export default function Sidebar({ user, profile }) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const firstName = (profile?.full_name || user?.user_metadata?.full_name || user?.email || "").split(" ")[0];
  const plan = profile?.plan || "free";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .hx-nav-link {
          display: flex; align-items: center; gap: 11px;
          padding: 9px 14px; border-radius: 9px;
          font-size: 13.5px; font-weight: 500; color: #888;
          text-decoration: none; transition: all 0.15s;
          white-space: nowrap; overflow: hidden;
        }
        .hx-nav-link:hover { background: #1a1a2a; color: #fff; }
        .hx-nav-link.active { background: #1a1a2a; color: #fff; }
        .hx-nav-link.active .hx-nav-icon { color: ${PURPLE}; }
        .hx-nav-icon { font-size: 16px; flex-shrink: 0; width: 20px; text-align: center; }
      `}</style>

      <div style={{
        width: collapsed ? 64 : 220,
        minHeight: "100vh",
        background: "#0d0d1a",
        borderRight: `1px solid ${B}`,
        display: "flex", flexDirection: "column",
        padding: "20px 12px",
        transition: "width 0.2s ease",
        position: "sticky", top: 0, flexShrink: 0,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        {/* Logo + collapse */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, paddingLeft: 4 }}>
          {!collapsed && (
            <span style={{ fontWeight: 800, fontSize: 18, color: PURPLE, letterSpacing: "-0.04em", fontStyle: "italic" }}>
              Hyper<span style={{ color: PINK }}>X</span>
            </span>
          )}
          <button onClick={() => setCollapsed(c => !c)} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#555", fontSize: 16, padding: 4, flexShrink: 0,
          }}>
            {collapsed ? "▶" : "◀"}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.to === "/"} className={({ isActive }) => `hx-nav-link${isActive ? " active" : ""}`}>
              <span className="hx-nav-icon">{n.icon}</span>
              {!collapsed && n.label}
            </NavLink>
          ))}
        </nav>

        {/* Plan badge */}
        {!collapsed && (
          <div style={{ marginBottom: 12 }}>
            <div style={{
              background: plan === "free" ? "#1a1a2a" : `${PURPLE}20`,
              border: `1px solid ${plan === "free" ? B : PURPLE + "40"}`,
              borderRadius: 9, padding: "10px 12px",
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: plan === "free" ? "#555" : PURPLE, marginBottom: 4 }}>
                {plan === "free" ? "Free Plan" : `${plan} plan`}
              </div>
              {plan === "free" && (
                <Link to="/pricing" style={{ fontSize: 11.5, color: PINK, fontWeight: 600, textDecoration: "none" }}>
                  Upgrade for all courses →
                </Link>
              )}
            </div>
          </div>
        )}

        {/* User + signout */}
        <div style={{
          display: "flex", alignItems: "center", gap: 9,
          padding: "10px 8px", borderTop: `1px solid ${B}`, marginTop: 4,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
            background: PURPLE + "30", border: `1px solid ${PURPLE}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: PURPLE,
          }}>
            {firstName?.[0]?.toUpperCase() || "U"}
          </div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "#ddd", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{firstName}</div>
              <button onClick={handleSignOut} style={{ background: "none", border: "none", fontSize: 11, color: "#555", cursor: "pointer", padding: 0 }}>Sign out</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
