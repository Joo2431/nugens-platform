import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { NG_LOGO } from "../lib/logo";
import { supabase } from "../lib/supabase";
import { useProfile } from "../lib/useProfile";

const PINK   = "#e8185d";
const BORDER = "#e8eaed";
const MUTED  = "#9ca3af";
const TEXT   = "#111827";

const INDIVIDUAL_NAV = [
  { to:"/",        icon:"⊞", label:"Dashboard"    },
  { to:"/courses", icon:"▶", label:"My Courses"    },
  { to:"/certs",   icon:"◇", label:"Certificates" },
  { to:"/pricing", icon:"↑", label:"Upgrade"       },
];

const BUSINESS_NAV = [
  { to:"/",        icon:"⊞", label:"Dashboard"    },
  { to:"/courses", icon:"▶", label:"All Courses"  },
  { to:"/certs",   icon:"◇", label:"Certificates" },
  { to:"/pricing", icon:"↑", label:"Upgrade"       },
];

const PLAN_LABELS = {
  free:"Free",
  hx_ind_starter:"Starter",
  hx_ind_premium:"Premium",
  hx_ind_pro:"Pro",
  hx_ind_yearly:"Pro Yearly",
  hx_biz_starter:"Biz Starter",
  hx_biz_premium:"Biz Premium",
  hx_biz_pro:"Biz Pro",
  hx_biz_yearly:"Biz Yearly",
  admin:"Admin",
};

export default function Sidebar({ profile: profileProp }) {
  // Fetch profile independently — don't rely on prop timing for admin check
  const { profile: ownProfile } = useProfile();
  const profile = ownProfile || profileProp;

  const [collapsed, setCollapsed] = useState(false);

  const isBiz     = profile?.user_type === "business";
  const isAdmin   = profile?.plan === "admin";
  const nav       = isBiz ? BUSINESS_NAV : INDIVIDUAL_NAV;
  const plan      = profile?.plan || "free";
  const firstName = (profile?.full_name || "").split(" ")[0] || "User";

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "https://nugens.in.net/auth";
  };

  const planColor = plan === "free" ? MUTED : PINK;
  const planLabel = PLAN_LABELS[plan] || plan;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .hx-nav { display:flex; align-items:center; gap:11px; padding:10px 14px; border-radius:10px; font-size:13px; font-weight:500; color:#6b7280; text-decoration:none; transition:all 0.15s; white-space:nowrap; overflow:hidden; border:none; background:none; width:100%; cursor:pointer; text-align:left; font-family:'Plus Jakarta Sans',sans-serif; }
        .hx-nav:hover { background:#fef2f2; color:${PINK}; }
        .hx-nav.active { background:#fef2f2; color:${PINK}; font-weight:700; }
        .hx-nav.active .hx-ico { color:${PINK}; }
        .hx-nav:hover .hx-ico { color:${PINK}; }
        .hx-ico { font-size:14px; flex-shrink:0; width:18px; text-align:center; color:#d1d5db; }
        .hx-signout { background:none; border:none; font-size:11px; color:#9ca3af; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; padding:0; }
        .hx-signout:hover { color:${PINK}; }
      `}</style>
      <div style={{
        width: collapsed ? 62 : 232,
        minHeight: "100vh",
        background: "#fff",
        borderRight: `1px solid ${BORDER}`,
        display: "flex",
        flexDirection: "column",
        padding: "20px 10px 24px",
        transition: "width 0.2s ease",
        position: "sticky",
        top: 0,
        flexShrink: 0,
        fontFamily: "'Plus Jakarta Sans',sans-serif",
        boxShadow: "1px 0 0 #f3f4f6",
      }}>

        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24, paddingLeft:4 }}>
          {!collapsed && (
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <img src={NG_LOGO} style={{ width:28, height:28, borderRadius:7, objectFit:"cover" }} alt="NG" />
              <div>
                <div style={{ fontWeight:800, fontSize:15, color:TEXT, letterSpacing:"-0.035em", lineHeight:1.1 }}>
                  Hyper<span style={{ color:PINK }}>X</span>
                </div>
                <div style={{ fontSize:9, color:MUTED, fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase" }}>by Nugens</div>
              </div>
            </div>
          )}
          <button onClick={()=>setCollapsed(c=>!c)} style={{ background:"none", border:`1px solid ${BORDER}`, borderRadius:7, cursor:"pointer", color:MUTED, fontSize:11, padding:"4px 7px", flexShrink:0 }}>
            {collapsed ? "▶" : "◀"}
          </button>
        </div>

        {/* User type badge */}
        {!collapsed && (
          <div style={{ background: isBiz ? "#fef2f2" : "#eff6ff", border:`1px solid ${isBiz ? PINK+"30" : "#bfdbfe"}`, borderRadius:9, padding:"7px 11px", marginBottom:16 }}>
            <div style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", color: isBiz ? PINK : "#2563eb", marginBottom:2 }}>
              {isBiz ? "🏢 Business" : "👤 Individual"}
            </div>
            <div style={{ fontSize:10, color:MUTED }}>{isBiz ? "Business + Individual courses" : "Individual courses only"}</div>
          </div>
        )}

        {/* User chip */}
        {!collapsed && (
          <div style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 10px", background:"#f8f9fb", borderRadius:9, marginBottom:16 }}>
            <div style={{ width:30, height:30, borderRadius:"50%", background:PINK+"15", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:PINK, flexShrink:0 }}>
              {firstName.slice(0,2).toUpperCase()}
            </div>
            <div style={{ overflow:"hidden" }}>
              <div style={{ fontSize:12, fontWeight:700, color:TEXT, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{firstName}</div>
              <div style={{ fontSize:10, color:planColor, fontWeight:600 }}>{planLabel}</div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex:1, display:"flex", flexDirection:"column", gap:2 }}>
          {nav.map(n => (
            <NavLink key={n.to} to={n.to} end={n.to==="/"} className={({isActive})=>`hx-nav${isActive?" active":""}`}>
              <span className="hx-ico">{n.icon}</span>
              {!collapsed && n.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink to="/admin" className={({isActive})=>`hx-nav${isActive?" active":""}`}>
              <span className="hx-ico">⚙</span>
              {!collapsed && "Admin Panel"}
            </NavLink>
          )}
        </nav>

        {/* Plan card */}
        {!collapsed && plan === "free" && (
          <div style={{ background:`${PINK}08`, border:`1px solid ${PINK}20`, borderRadius:10, padding:"12px 14px", marginBottom:12 }}>
            <div style={{ fontSize:10, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>Free Plan</div>
            <div style={{ fontSize:11, color:"#6b7280", marginBottom:8 }}>Unlock courses & certifications</div>
            <a href="/pricing" style={{ fontSize:12, color:PINK, fontWeight:700, textDecoration:"none" }}>Upgrade →</a>
          </div>
        )}

        {/* Sign out */}
        {!collapsed && (
          <div style={{ borderTop:`1px solid ${BORDER}`, paddingTop:12, marginTop:4, paddingLeft:6 }}>
            <button className="hx-signout" onClick={signOut}>← Sign out</button>
          </div>
        )}
      </div>
    </>
  );
}