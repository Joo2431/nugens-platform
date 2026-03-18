import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { NG_LOGO } from "../lib/logo";

const PINK = "#e8185d";
const TEXT = "#111827";
const MUTED = "#9ca3af";
const BORDER = "#e8eaed";

const ADMIN_EMAILS = [
  "jeromjoseph31@gmail.com",
  "jeromjoshep.23@gmail.com"
];

const PLAN_LABELS = {
  free: "Free",
  admin: "Admin ✦",
  hx_ind_starter: "Starter",
  hx_ind_premium: "Premium",
  hx_ind_pro: "Pro",
  hx_ind_yearly: "Pro Yearly",
  hx_biz_starter: "Biz Starter",
  hx_biz_premium: "Biz Premium",
  hx_biz_pro: "Biz Pro",
  hx_biz_yearly: "Biz Yearly"
};

const OTHER_APPS = [
  { label: "Gen-E AI", icon: "◎", color: "#7c3aed", url: "https://gene.nugens.in.net" },
  { label: "DigiHub", icon: "◈", color: "#0284c7", url: "https://digihub.nugens.in.net" },
  { label: "The Units", icon: "◇", color: "#d97706", url: "https://units.nugens.in.net" },
  { label: "Dashboard", icon: "⊞", color: PINK, url: "https://nugens.in.net/dashboard" }
];

export default function Sidebar({ profile }) {

  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const plan = profile?.plan || "free";
  const userType = profile?.user_type || "individual";
  const isBiz = userType === "business";

  const email = (profile?.email || "").toLowerCase().trim();

  const firstName =
    profile?.full_name
      ? profile.full_name.split(" ")[0]
      : profile?.name
      ? profile.name.split(" ")[0]
      : profile?.email
      ? profile.email.split("@")[0]
      : "User";

  const planLabel = PLAN_LABELS[plan] || plan;

  const isPaid = plan !== "free";
  const isAdmin = plan === "admin" || ADMIN_EMAILS.includes(email);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = "https://nugens.in.net/auth";
    } catch (err) {
      console.error("Signout error:", err);
    }
  };

  const NAV = [
    { to: "/", icon: "⊞", label: "Dashboard" },
    { to: "/courses", icon: "▶", label: isBiz ? "All Courses" : "My Courses" },
    { to: "/certs", icon: "◇", label: "Certificates" },
    { to: "/pricing", icon: "↑", label: "Upgrade" }
  ];

  return (
    <>
      <style>{`

      .hx-nav{
        display:flex;
        align-items:center;
        gap:11px;
        padding:10px 14px;
        border-radius:10px;
        font-size:13px;
        font-weight:500;
        color:#6b7280;
        text-decoration:none;
        transition:all 0.15s;
        border:none;
        background:none;
        width:100%;
        cursor:pointer;
      }

      .hx-nav:hover{
        background:#fef2f2;
        color:${PINK};
      }

      .hx-nav.active{
        background:#fef2f2;
        color:${PINK};
        font-weight:700;
      }

      .hx-ico{
        font-size:14px;
        width:18px;
        text-align:center;
        color:#d1d5db;
      }

      .hx-signout-btn{
        width:100%;
        padding:9px 13px;
        background:none;
        border:1px solid ${BORDER};
        border-radius:10px;
        cursor:pointer;
        font-size:13px;
        color:#6b7280;
        display:flex;
        align-items:center;
        gap:8px;
      }

      .hx-signout-btn:hover{
        border-color:${PINK}40;
        color:${PINK};
        background:#fef2f2;
      }

      `}</style>

      <div
        style={{
          width: collapsed ? 62 : 232,
          minHeight: "100vh",
          background: "#fff",
          borderRight: `1px solid ${BORDER}`,
          display: "flex",
          flexDirection: "column",
          padding: "20px 10px",
          transition: "width 0.2s ease"
        }}
      >

        {/* Logo */}

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>

          {!collapsed && (

            <a
              href="https://nugens.in.net"
              style={{display:"flex",alignItems:"center",gap:9,textDecoration:"none"}}
            >

              <img
                src={NG_LOGO}
                style={{width:28,height:28,borderRadius:7}}
                alt="NG"
              />

              <div>

                <div style={{fontWeight:800,fontSize:15,color:TEXT}}>
                  Hyper<span style={{color:PINK}}>X</span>
                </div>

                <div style={{fontSize:9,color:MUTED,fontWeight:600}}>
                  by Nugens
                </div>

              </div>

            </a>

          )}

          <button
            onClick={() => setCollapsed(c => !c)}
            style={{
              background:"none",
              border:`1px solid ${BORDER}`,
              borderRadius:7,
              cursor:"pointer",
              fontSize:11
            }}
          >
            {collapsed ? "▶" : "◀"}
          </button>

        </div>

        {/* USER */}

        {!collapsed && (

          <div style={{
            display:"flex",
            alignItems:"center",
            gap:9,
            padding:"8px 10px",
            background:"#f8f9fb",
            borderRadius:9,
            marginBottom:14
          }}>

            <div style={{
              width:32,
              height:32,
              borderRadius:"50%",
              background:`${PINK}15`,
              display:"flex",
              alignItems:"center",
              justifyContent:"center",
              fontWeight:800,
              color:PINK
            }}>
              {firstName.slice(0,2).toUpperCase()}
            </div>

            <div>

              <div style={{fontSize:12,fontWeight:700}}>
                {firstName}
              </div>

              <div style={{
                fontSize:10,
                color:isPaid ? PINK : MUTED
              }}>
                {planLabel}
              </div>

            </div>

          </div>

        )}

        {/* NAV */}

        <nav style={{display:"flex",flexDirection:"column",gap:2}}>

          {NAV.map(n => (

            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
              className={({isActive}) =>
                `hx-nav ${isActive ? "active" : ""}`
              }
            >

              <span className="hx-ico">{n.icon}</span>

              {!collapsed && n.label}

            </NavLink>

          ))}

          {isAdmin && (

            <NavLink
              to="/admin"
              className={({isActive}) =>
                `hx-nav ${isActive ? "active" : ""}`
              }
            >
              <span className="hx-ico">⚙</span>
              {!collapsed && "Admin Panel"}
            </NavLink>

          )}

        </nav>

        <div style={{flex:1}} />

        {/* SIGNOUT */}

        {!collapsed && (

          <div style={{borderTop:`1px solid ${BORDER}`,paddingTop:12}}>

            <button
              className="hx-signout-btn"
              onClick={signOut}
            >
              ← Sign out
            </button>

          </div>

        )}

      </div>

    </>
  );
}