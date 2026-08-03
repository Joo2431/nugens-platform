import React, { useState, useRef, useEffect } from "react";
import { NG_LOGO } from "../lib/logo";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";


const PINK = "#e8185d";
const B    = "#f0f0f0";

const PRODUCTS = [
  { to:"/gene",    label:"Gen-E AI",          sub:"AI career intelligence",        dot:"#7c3aed", icon:"◎",
    launch:"https://gene.nugens.in.net",    desc:"Resume analysis, job matching & your personalised career roadmap.", bg:"#ede9fe" },
  { to:"/hyperx",  label:"HyperX",             sub:"Professional learning platform", dot:PINK,      icon:"⬡",
    launch:"https://hyperx.nugens.in.net",  desc:"Workplace skills, salary negotiation & interview mastery.",         bg:"#fef2f5" },
  { to:"/digihub", label:"DigiHub",            sub:"Marketing agency & community",   dot:"#0284c7", icon:"◈",
    launch:"https://digihub.nugens.in.net", desc:"Brand growth, content, SEO & career placement network.",            bg:"#eff6ff" },
  { to:"/units",   label:"Units",   sub:"Wedding & event production",     dot:"#d97706", icon:"◇",
    launch:"https://units.nugens.in.net",   desc:"Cinematography, photography, editing & brand content studio.",      bg:"#fff7ed" },
];

const COMPANY = [
  { to:"/about",   label:"About Nugens",   sub:"Our story & mission"  },
  { to:"/careers", label:"Careers",         sub:"Join the team"         },
  { to:"/blog",    label:"Blog & Insights", sub:"Latest from Nugens"   },
];

const PLAN_COLOR = { free:"#6b7280", pro:"#7c3aed", team:"#0284c7", enterprise:"#d97706" };
const PLAN_BG    = { free:"#f3f4f6", pro:"#ede9fe", team:"#eff6ff",  enterprise:"#fff7ed"  };

function useOutsideClick(ref, cb) {
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) cb(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [ref, cb]);
}

export default function Header() {
  // Own auth state — never depends on context timing
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [authReady, setAuthReady] = useState(false); // hide Sign In until resolved

  useEffect(() => {
    // onAuthStateChange fires FIRST for hash tokens (Google OAuth callback)
    // then getSession fires — so listen to both, mark ready after either resolves
    let resolved = false;
    const resolve = (session) => {
      setUser(session?.user ?? null);
      if (!resolved) { resolved = true; setAuthReady(true); }
      if (session?.user) {
        supabase.from("profiles").select("*").eq("id", session.user.id).single()
          .then(({ data }) => setProfile(data ?? null));
      } else {
        setProfile(null);
      }
    };

    // This catches hash token from Google OAuth redirect
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      resolve(session);
    });

    // Fallback for normal page loads with existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      resolve(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const [openMenu,       setOpenMenu]       = useState(null);
  const [mobileOpen,     setMobileOpen]     = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  /* close everything on route change */
  useEffect(() => { setOpenMenu(null); setMobileOpen(false); setMobileExpanded(null); }, [location]);
  useEffect(() => { document.body.style.overflow = mobileOpen ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [mobileOpen]);

  const firstName  = (profile?.full_name || user?.user_metadata?.full_name || user?.email || "").split(" ")[0] || "Account";
  const initials   = firstName.slice(0, 2).toUpperCase();
  const plan       = profile?.plan || "free";
  const planColor  = PLAN_COLOR[plan] ?? PLAN_COLOR.free;
  const planBg     = PLAN_BG[plan]    ?? PLAN_BG.free;

  const handleSignOut = async () => { await supabase.auth.signOut(); navigate("/"); };
  const toggleMenu  = (name) => setOpenMenu(p => p === name ? null : name);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        @keyframes hdr-drop    { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:none} }
        @keyframes hdr-slideIn { from{transform:translateX(100%)} to{transform:none} }
        @keyframes hdr-fadeOv  { from{opacity:0} to{opacity:1} }

        .hdr-btn {
          display:inline-flex;align-items:center;gap:5px;
          font-size:13.5px;font-weight:500;color:#374151;
          background:none;border:none;cursor:pointer;
          font-family:'Plus Jakarta Sans',sans-serif;
          padding:4px 2px;transition:color 0.13s;white-space:nowrap;
        }
        .hdr-btn:hover { color:#0a0a0a; }

        .hdr-drop {
          position:absolute;top:calc(100% + 10px);left:0;
          background:#fff;border:1px solid ${B};border-radius:12px;
          box-shadow:0 8px 40px rgba(0,0,0,0.09);padding:8px;
          min-width:220px;z-index:300;animation:hdr-drop 0.16s ease;
        }

        /* ── mega panel ── */
        .hdr-mega {
          position:fixed;top:62px;left:0;right:0;
          background:#fff;border-bottom:1px solid ${B};
          box-shadow:0 12px 48px rgba(0,0,0,0.07);
          z-index:299;animation:hdr-drop 0.18s ease;
        }
        .hdr-mega-inner {
          max-width:1100px;margin:0 auto;padding:28px 24px 24px;
          display:grid;grid-template-columns:repeat(4,1fr);gap:12px;
        }
        .mega-card {
          padding:16px;border-radius:10px;border:1px solid ${B};
          text-decoration:none;transition:border-color 0.15s,box-shadow 0.15s;
          display:flex;flex-direction:column;gap:6px;
        }
        .mega-card:hover { border-color:#d0d0d0;box-shadow:0 2px 16px rgba(0,0,0,0.05); }
        .mega-launch {
          display:inline-flex;align-items:center;gap:5px;
          padding:6px 12px;border-radius:7px;font-size:11.5px;font-weight:600;
          text-decoration:none;border:1px solid ${B};color:#374151;background:#fff;
          transition:all 0.13s;width:fit-content;
        }
        .mega-launch:hover { background:#0a0a0a;color:#fff;border-color:#0a0a0a; }

        /* ── account dropdown ── */
        .hdr-acct {
          position:absolute;top:calc(100% + 10px);right:0;
          background:#fff;border:1px solid ${B};border-radius:12px;
          box-shadow:0 8px 40px rgba(0,0,0,0.10);
          min-width:288px;z-index:300;animation:hdr-drop 0.16s ease;overflow:hidden;
        }
        .acct-row {
          display:flex;align-items:center;gap:10px;
          padding:9px 16px;text-decoration:none;
          transition:background 0.12s;cursor:pointer;
        }
        .acct-row:hover { background:#fafafa; }

        /* ── nav link ── */
        .hdr-link {
          font-size:13.5px;font-weight:500;color:#374151;text-decoration:none;
          padding:4px 2px;transition:color 0.13s;
          font-family:'Plus Jakarta Sans',sans-serif;white-space:nowrap;
        }
        .hdr-link:hover,.hdr-link.active { color:#0a0a0a; }

        .hdr-cta {
          padding:8px 18px;border-radius:8px;background:#0a0a0a;
          color:#fff;font-size:13px;font-weight:600;text-decoration:none;
          letter-spacing:-0.01em;transition:background 0.14s;white-space:nowrap;
          font-family:'Plus Jakarta Sans',sans-serif;
        }
        .hdr-cta:hover { background:#222; }

        .hdr-signin {
          padding:7px 16px;border-radius:8px;border:1px solid ${B};background:#fff;
          color:#374151;font-size:13px;font-weight:500;text-decoration:none;
          white-space:nowrap;transition:border-color 0.13s,color 0.13s;
          font-family:'Plus Jakarta Sans',sans-serif;
        }
        .hdr-signin:hover { border-color:#9ca3af;color:#0a0a0a; }

        .hdr-avatar {
          width:34px;height:34px;border-radius:50%;
          border:1.5px solid transparent;
          display:flex;align-items:center;justify-content:center;
          font-size:11px;font-weight:700;cursor:pointer;
          font-family:'Plus Jakarta Sans',sans-serif;flex-shrink:0;
          transition:border-color 0.13s;background:none;
        }

        /* desktop / mobile breakpoints */
        .hdr-desk { display:none;align-items:center;gap:22px; }
        .hdr-mob  { display:flex;align-items:center;gap:8px; }
        @media(min-width:960px){
          .hdr-desk { display:flex!important; }
          .hdr-mob  { display:none!important; }
        }

        /* mobile drawer */
        .mob-link {
          display:block;padding:13px 0;font-size:15px;font-weight:600;
          color:#0a0a0a;text-decoration:none;border-bottom:1px solid ${B};
          font-family:'Plus Jakarta Sans',sans-serif;
        }
        .mob-prow {
          display:flex;align-items:center;gap:11px;padding:11px 12px;
          border-radius:9px;text-decoration:none;transition:background 0.12s;
        }
        .mob-prow:hover { background:#fafafa; }

        .hdr-drawer {
          position:fixed;top:0;right:0;bottom:0;
          width:min(340px,90vw);z-index:400;background:#fff;
          overflow-y:auto;box-shadow:-8px 0 40px rgba(0,0,0,0.12);
          animation:hdr-slideIn 0.22s ease;display:flex;flex-direction:column;
        }
        .hdr-overlay {
          position:fixed;inset:0;z-index:300;background:rgba(0,0,0,0.35);
          animation:hdr-fadeOv 0.2s ease;
        }
      `}</style>

      {/* ════════════════ HEADER BAR ════════════════ */}
      <header style={{
        position:"sticky",top:0,zIndex:200,
        background:"rgba(255,255,255,0.97)",backdropFilter:"blur(12px)",
        borderBottom:`1px solid ${B}`,fontFamily:"'Plus Jakarta Sans',sans-serif",
      }}>
        <div style={{ maxWidth:1100,margin:"0 auto",padding:"0 20px",height:62,
          display:"flex",alignItems:"center",justifyContent:"space-between",gap:12 }}>

          {/* Logo */}
          <Link to="/" style={{ display:"flex",alignItems:"center",gap:10,textDecoration:"none",flexShrink:0 }}>
            <img src={NG_LOGO} alt="Nugens" style={{ width:36,height:36,borderRadius:8,objectFit:"cover" }} />
            <span style={{ fontWeight:800,fontSize:17,color:"#0a0a0a",letterSpacing:"-0.025em" }}>Nugens</span>
          </Link>

          {/* ── DESKTOP NAV ── */}
          <nav className="hdr-desk">
            {/* Products — mega panel */}
            <div style={{ position:"relative" }}>
              <button className="hdr-btn" onClick={() => toggleMenu("products")}>
                Products
                <ChevronIcon open={openMenu==="products"} />
              </button>
            </div>

            {/* Company dropdown */}
            <CompanyMenu isOpen={openMenu==="company"} onToggle={() => toggleMenu("company")} onClose={() => setOpenMenu(null)} />

            <NavLink to="/pricing" className={({isActive})=>`hdr-link${isActive?" active":""}`}>Pricing</NavLink>
            <NavLink to="/support" className={({isActive})=>`hdr-link${isActive?" active":""}`}>Support</NavLink>
            <a href="https://gene.nugens.in.net" target="_blank" rel="noreferrer"
              className="hdr-link"
              style={{ display:"flex",alignItems:"center",gap:5 }}>
              <span style={{ width:6,height:6,borderRadius:"50%",background:"#7c3aed",display:"inline-block" }}/>
              Gen-E AI ↗
            </a>

            {/* Auth area — hidden until auth resolves to avoid flash of Sign in */}
            {!authReady ? (
              <div style={{ width: 120 }} />
            ) : user ? (
              <AccountMenu
                initials={initials} firstName={firstName} email={user.email}
                plan={plan} planColor={planColor} planBg={planBg}
                isOpen={openMenu==="account"} onToggle={() => toggleMenu("account")}
                onClose={() => setOpenMenu(null)} onSignOut={handleSignOut}
              />
            ) : (
              <div style={{ display:"flex",gap:8,alignItems:"center" }}>
                <Link to="/auth"    className="hdr-signin">Sign in</Link>
                <Link to="/contact" className="hdr-cta">Get in touch</Link>
              </div>
            )}
          </nav>

          {/* ── MOBILE ── */}
          <div className="hdr-mob">
            {user
              ? <button className="hdr-avatar" onClick={() => setMobileOpen(true)}
                  style={{ background:`${planColor}18`,borderColor:`${planColor}40`,color:planColor }}>
                  {initials}
                </button>
              : <Link to="/auth" style={{ padding:"7px 14px",borderRadius:7,background:PINK,
                  color:"#fff",fontSize:12,fontWeight:600,textDecoration:"none" }}>Sign in</Link>
            }
            <button onClick={() => setMobileOpen(true)} aria-label="Open menu"
              style={{ width:38,height:38,borderRadius:8,background:"#fff",border:`1px solid ${B}`,
                display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                gap:5,cursor:"pointer",flexShrink:0 }}>
              {[18,14,18].map((w,i) => <span key={i} style={{ width:w,height:1.5,background:"#374151",borderRadius:2 }}/>)}
            </button>
          </div>
        </div>
      </header>

      {/* ════════════════ PRODUCTS MEGA PANEL ════════════════ */}
      {openMenu==="products" && (
        <>
          <div style={{ position:"fixed",inset:0,zIndex:298 }} onClick={() => setOpenMenu(null)} />
          <div className="hdr-mega">
            <div className="hdr-mega-inner">
              {PRODUCTS.map(p => (
                <div key={p.label} style={{ display:"flex",flexDirection:"column",gap:6 }}>
                  <Link to={p.to} className="mega-card" onClick={() => setOpenMenu(null)}>
                    <div style={{ display:"flex",alignItems:"center",gap:9,marginBottom:2 }}>
                      <div style={{ width:32,height:32,borderRadius:8,background:p.bg,
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:15,color:p.dot,flexShrink:0 }}>{p.icon}</div>
                      <div>
                        <div style={{ fontSize:13.5,fontWeight:700,color:"#0a0a0a",
                          fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{p.label}</div>
                        <div style={{ fontSize:11,color:"#9ca3af",
                          fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{p.sub}</div>
                      </div>
                    </div>
                    <p style={{ fontSize:12.5,color:"#6b7280",lineHeight:1.6,
                      fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{p.desc}</p>
                  </Link>
                  <a href={p.launch} target="_blank" rel="noreferrer"
                    className="mega-launch" onClick={() => setOpenMenu(null)}>
                    <span style={{ width:6,height:6,borderRadius:"50%",background:p.dot,flexShrink:0 }}/>
                    Launch app →
                  </a>
                </div>
              ))}
            </div>
            {/* bottom strip */}
            <div style={{ borderTop:`1px solid ${B}`,padding:"11px 24px",maxWidth:1100,margin:"0 auto",
              display:"flex",alignItems:"center",justifyContent:"space-between" }}>
              <span style={{ fontSize:12,color:"#9ca3af",fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                One Nugens account — access all products
              </span>
              <Link to="/pricing" onClick={() => setOpenMenu(null)}
                style={{ fontSize:12,fontWeight:600,color:PINK,textDecoration:"none",
                  fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                View pricing →
              </Link>
            </div>
          </div>
        </>
      )}

      {/* ════════════════ MOBILE DRAWER ════════════════ */}
      {mobileOpen && (
        <>
          <div className="hdr-overlay" onClick={() => setMobileOpen(false)} />
          <div className="hdr-drawer">
            {/* top bar */}
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",
              padding:"18px 20px",borderBottom:`1px solid ${B}`,flexShrink:0 }}>
              <Link to="/" onClick={() => setMobileOpen(false)}
                style={{ display:"flex",alignItems:"center",gap:9,textDecoration:"none" }}>
                <img src={NG_LOGO} alt="Nugens" style={{ width:32,height:32,borderRadius:7,objectFit:"cover" }}/>
                <span style={{ fontWeight:800,fontSize:16,color:"#0a0a0a",fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Nugens</span>
              </Link>
              <button onClick={() => setMobileOpen(false)} aria-label="Close"
                style={{ width:34,height:34,borderRadius:8,border:`1px solid ${B}`,background:"#fafafa",
                  cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1l12 12M13 1L1 13" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div style={{ padding:"16px 20px",flex:1,overflowY:"auto" }}>
              {/* logged-in user card */}
              {user && (
                <div style={{ padding:"14px 16px",borderRadius:10,background:"#fafafa",
                  border:`1px solid ${B}`,marginBottom:16 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                    <div style={{ width:38,height:38,borderRadius:"50%",flexShrink:0,
                      background:`${planColor}18`,border:`1.5px solid ${planColor}40`,
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:13,fontWeight:700,color:planColor }}>{initials}</div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:14,fontWeight:700,color:"#0a0a0a",fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{firstName}</div>
                      <div style={{ fontSize:11,color:"#9ca3af",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{user.email}</div>
                    </div>
                    <span style={{ fontSize:9.5,fontWeight:700,padding:"3px 8px",borderRadius:5,
                      background:planBg,color:planColor,textTransform:"uppercase",letterSpacing:"0.05em",
                      flexShrink:0,fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{plan}</span>
                  </div>
                  <div style={{ display:"flex",gap:8,marginTop:12 }}>
                    <Link to="/dashboard" onClick={() => setMobileOpen(false)}
                      style={{ flex:1,textAlign:"center",padding:"9px",borderRadius:8,background:"#0a0a0a",
                        color:"#fff",fontSize:12.5,fontWeight:600,textDecoration:"none",
                        fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Dashboard</Link>
                    <button onClick={() => { setMobileOpen(false); handleSignOut(); }}
                      style={{ flex:1,padding:"9px",borderRadius:8,border:`1px solid ${B}`,
                        background:"#fff",color:"#374151",fontSize:12.5,fontWeight:500,cursor:"pointer",
                        fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Sign out</button>
                  </div>
                </div>
              )}

              {/* Products accordion */}
              <MobAccordion label="Products" open={mobileExpanded==="products"}
                onToggle={() => setMobileExpanded(p => p==="products"?null:"products")}>
                {PRODUCTS.map(p => (
                  <div key={p.label}>
                    <Link to={p.to} className="mob-prow" onClick={() => setMobileOpen(false)}>
                      <div style={{ width:30,height:30,borderRadius:7,background:p.bg,flexShrink:0,
                        display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:p.dot }}>{p.icon}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13.5,fontWeight:600,color:"#0a0a0a",fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{p.label}</div>
                        <div style={{ fontSize:11.5,color:"#9ca3af",fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{p.sub}</div>
                      </div>
                      <a href={p.launch} target="_blank" rel="noreferrer"
                        onClick={e=>e.stopPropagation()}
                        style={{ fontSize:11,fontWeight:600,color:p.dot,textDecoration:"none",whiteSpace:"nowrap",
                          fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Launch →</a>
                    </Link>
                  </div>
                ))}
              </MobAccordion>

              {/* Company accordion */}
              <MobAccordion label="Company" open={mobileExpanded==="company"}
                onToggle={() => setMobileExpanded(p => p==="company"?null:"company")}>
                {COMPANY.map(c => (
                  <Link key={c.label} to={c.to} className="mob-prow" onClick={() => setMobileOpen(false)}>
                    <div>
                      <div style={{ fontSize:13.5,fontWeight:600,color:"#0a0a0a",fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{c.label}</div>
                      <div style={{ fontSize:11.5,color:"#9ca3af",fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{c.sub}</div>
                    </div>
                  </Link>
                ))}
              </MobAccordion>

              <Link to="/pricing"  className="mob-link" onClick={() => setMobileOpen(false)}>Pricing</Link>
              <Link to="/support"  className="mob-link" onClick={() => setMobileOpen(false)}>Support</Link>
              <Link to="/blog"     className="mob-link" onClick={() => setMobileOpen(false)}>Blog</Link>
              <Link to="/careers"  className="mob-link" onClick={() => setMobileOpen(false)}>Careers</Link>
            </div>

            {/* footer — sign in only when logged out */}
            {!user && (
              <div style={{ padding:"16px 20px",borderTop:`1px solid ${B}`,display:"flex",flexDirection:"column",gap:9,flexShrink:0 }}>
                <a href="https://gene.nugens.in.net" target="_blank" rel="noreferrer"
                  style={{ display:"block",textAlign:"center",padding:"13px",borderRadius:9,background:"#7c3aed",
                    color:"#fff",fontSize:14,fontWeight:700,textDecoration:"none",
                    boxShadow:"0 2px 12px rgba(124,58,237,0.25)",fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  Launch Gen-E AI →
                </a>
                <Link to="/auth" onClick={() => setMobileOpen(false)}
                  style={{ display:"block",textAlign:"center",padding:"13px",borderRadius:9,background:"#0a0a0a",
                    color:"#fff",fontSize:14,fontWeight:700,textDecoration:"none",
                    fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Sign in</Link>
                <Link to="/contact" onClick={() => setMobileOpen(false)}
                  style={{ display:"block",textAlign:"center",padding:"12px",borderRadius:9,background:"#fff",
                    color:"#374151",fontSize:13.5,fontWeight:500,textDecoration:"none",
                    border:`1px solid ${B}`,fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Get in touch</Link>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

/* ── sub-components ── */

function ChevronIcon({ open }) {
  return (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none"
      style={{ transform:open?"rotate(180deg)":"none",transition:"transform 0.18s",color:"#9ca3af" }}>
      <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function CompanyMenu({ isOpen, onToggle, onClose }) {
  const ref = useRef(null);
  useOutsideClick(ref, () => isOpen && onClose());
  return (
    <div ref={ref} style={{ position:"relative" }}>
      <button className="hdr-btn" onClick={onToggle}>
        Company <ChevronIcon open={isOpen}/>
      </button>
      {isOpen && (
        <div className="hdr-drop">
          {COMPANY.map(c => (
            <Link key={c.label} to={c.to} onClick={onClose}
              style={{ display:"flex",flexDirection:"column",padding:"10px 12px",borderRadius:8,
                textDecoration:"none",transition:"background 0.12s" }}
              onMouseOver={e=>e.currentTarget.style.background="#fafafa"}
              onMouseOut={e=>e.currentTarget.style.background="transparent"}>
              <span style={{ fontSize:13.5,fontWeight:600,color:"#0a0a0a",fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{c.label}</span>
              <span style={{ fontSize:11.5,color:"#9ca3af",marginTop:1,fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{c.sub}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function AccountMenu({ initials, firstName, email, plan, planColor, planBg, isOpen, onToggle, onClose, onSignOut }) {
  const ref = useRef(null);
  useOutsideClick(ref, () => isOpen && onClose());
  return (
    <div ref={ref} style={{ position:"relative" }}>
      <button className="hdr-avatar" onClick={onToggle}
        style={{ background:`${planColor}15`,borderColor:`${planColor}35`,color:planColor }}>
        {initials}
      </button>
      {isOpen && (
        <div className="hdr-acct">
          {/* user header */}
          <div style={{ padding:"16px",borderBottom:`1px solid #f0f0f0` }}>
            <div style={{ display:"flex",alignItems:"center",gap:10 }}>
              <div style={{ width:40,height:40,borderRadius:"50%",flexShrink:0,
                background:`${planColor}18`,border:`1.5px solid ${planColor}40`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:13,fontWeight:700,color:planColor }}>{initials}</div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:14,fontWeight:700,color:"#0a0a0a",fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{firstName}</div>
                <div style={{ fontSize:11.5,color:"#9ca3af",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{email}</div>
              </div>
              <span style={{ fontSize:9.5,fontWeight:700,padding:"3px 9px",borderRadius:5,flexShrink:0,
                background:planBg,color:planColor,textTransform:"uppercase",letterSpacing:"0.06em",
                fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{plan}</span>
            </div>
          </div>
          {/* quick links */}
          <div style={{ padding:"6px 0",borderBottom:`1px solid #f0f0f0` }}>
            {[
              { to:"/dashboard", icon:"◎", label:"My Dashboard"  },
              { to:"/pricing",   icon:"⬡", label:"Manage plan"   },
            ].map(r => (
              <Link key={r.label} to={r.to} onClick={onClose} className="acct-row">
                <span style={{ fontSize:14,color:"#9ca3af",width:18,textAlign:"center" }}>{r.icon}</span>
                <span style={{ fontSize:13,fontWeight:500,color:"#374151",fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{r.label}</span>
              </Link>
            ))}
          </div>
          {/* your products */}
          <div style={{ padding:"10px 0 6px" }}>
            <div style={{ fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",
              color:"#9ca3af",padding:"0 16px 8px",fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Your products</div>
            {PRODUCTS.map(p => (
              <a key={p.label} href={p.launch} target="_blank" rel="noreferrer"
                className="acct-row" onClick={onClose}>
                <div style={{ width:26,height:26,borderRadius:6,background:`${p.dot}15`,flexShrink:0,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:p.dot }}>{p.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13,fontWeight:600,color:"#0a0a0a",fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{p.label}</div>
                  <div style={{ fontSize:11,color:"#9ca3af",fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{p.sub}</div>
                </div>
                <span style={{ fontSize:12,color:"#d1d5db" }}>↗</span>
              </a>
            ))}
          </div>
          {/* sign out */}
          <div style={{ padding:"8px 16px 14px",borderTop:`1px solid #f0f0f0` }}>
            <button onClick={onSignOut}
              style={{ width:"100%",padding:"9px",borderRadius:8,border:"1px solid #f0f0f0",
                background:"#fff",color:"#374151",fontSize:13,fontWeight:500,cursor:"pointer",
                fontFamily:"'Plus Jakarta Sans',sans-serif",transition:"background 0.12s" }}
              onMouseOver={e=>e.currentTarget.style.background="#fafafa"}
              onMouseOut={e=>e.currentTarget.style.background="#fff"}>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MobAccordion({ label, open, onToggle, children }) {
  return (
    <div style={{ borderBottom:"1px solid #f0f0f0" }}>
      <button onClick={onToggle}
        style={{ width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"13px 0",background:"none",border:"none",cursor:"pointer",
          fontSize:15,fontWeight:600,color:"#0a0a0a",fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
        {label}
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none"
          style={{ transform:open?"rotate(180deg)":"none",transition:"transform 0.18s",color:"#9ca3af",flexShrink:0 }}>
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && <div style={{ paddingBottom:10 }}>{children}</div>}
    </div>
  );
}