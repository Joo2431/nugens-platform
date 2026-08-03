import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";

const PINK = "#e8185d";
const BG = "#f8f9fb";
const CARD = "#ffffff";
const BORDER = "#e8eaed";

export default function Dashboard({ profile }) {
  const [stats, setStats] = useState({ resumes: 0, roadmaps: 0, interviews: 0, jobs: 0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    const fetchStats = async () => {
      setLoading(true);
      try {
        const { data: artifacts } = await supabase.from("saved_artifacts").select("type, created_at, title").eq("user_id", profile.id).order("created_at", { ascending: false });
        if (artifacts) {
          setStats({
            resumes: artifacts.filter(a => a.type === "resume").length,
            roadmaps: artifacts.filter(a => a.type === "roadmap").length,
            interviews: artifacts.filter(a => a.type === "interview").length,
            jobs: 0,
          });
          setRecent(artifacts.slice(0, 3));
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchStats();
  }, [profile?.id]);

  const readiness = Math.min(40 + (stats.resumes * 8) + (stats.roadmaps * 10) + (stats.interviews * 7), 95);

  return (
    <div style={{ minHeight: "100vh", background: BG, padding: "32px 40px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", padding: "4px 14px", borderRadius: 999, border: `1px solid ${BORDER}`, marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: PINK, letterSpacing: "0.5px" }}>GEN-E DASHBOARD</span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#111", margin: 0 }}>Welcome back, {profile?.full_name?.split(" ")[0] || "there"} 👋</h1>
          <p style={{ color: "#666", marginTop: 6, fontSize: 15 }}>Your AI career co-pilot. Everything in one place.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, marginBottom: 32 }}>
          {[{ label: "Resumes Saved", value: stats.resumes, color: PINK }, { label: "Roadmaps Active", value: stats.roadmaps, color: "#3b82f6" }, { label: "Interviews Done", value: stats.interviews, color: "#8b5cf6" }, { label: "Jobs Tracked", value: stats.jobs, color: "#10b981" }].map((stat, i) => (
            <div key={i} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "18px 20px" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "18px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><div style={{ fontSize: 13, color: "#666" }}>Career Readiness</div><div style={{ fontSize: 28, fontWeight: 800, color: "#16a34a" }}>{readiness}</div></div>
              <div style={{ width: 52, height: 52, borderRadius: 999, background: `conic-gradient(#16a34a ${readiness}%, #e5e7eb 0)` }} />
            </div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>Based on your activity</div>
          </div>
        </div>

        <div style={{ marginBottom: 14, fontSize: 13, fontWeight: 700, color: "#555" }}>Launch a Tool</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 36 }}>
          {[{ to: "/resume", icon: "📄", title: "Resume Builder", desc: "ATS-optimized resume with live preview" }, { to: "/roadmap", icon: "🗺️", title: "Career Roadmap", desc: "Visual timeline + PDF export" }, { to: "/interview", icon: "🎤", title: "Mock Interview", desc: "Timed practice with AI feedback" }, { to: "/jobs", icon: "💼", title: "Job Tracker", desc: "Applications, status & reminders" }, { to: "/vault", icon: "🗄️", title: "Vault", desc: "All saved artifacts in one place" }, { to: "/chat", icon: "💬", title: "Free Chat", desc: "Open-ended career conversation" }].map((tool, i) => (
            <Link key={i} to={tool.to} style={{ textDecoration: "none", color: "inherit" }}>
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "18px 20px", cursor: "pointer" }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>{tool.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>{tool.title}</div>
                <div style={{ fontSize: 13, color: "#666", marginTop: 3 }}>{tool.desc}</div>
              </div>
            </Link>
          ))}
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, color: "#555", marginBottom: 12 }}>Recent Activity</div>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
          {loading && <div style={{ padding: 24, color: "#888", fontSize: 14 }}>Loading...</div>}
          {!loading && recent.length === 0 && <div style={{ padding: 28, color: "#888", fontSize: 14, textAlign: "center" }}>No activity yet. Create your first resume or roadmap.</div>}
          {recent.map((item, index) => (
            <div key={index} style={{ padding: "14px 20px", borderBottom: index < recent.length - 1 ? `1px solid ${BORDER}` : "none", display: "flex", justifyContent: "space-between" }}>
              <div><div style={{ fontWeight: 600, color: "#111" }}>{item.title || "Untitled"}</div><div style={{ fontSize: 12, color: "#888" }}>{item.type}</div></div>
              <div style={{ fontSize: 12, color: "#999" }}>{new Date(item.created_at).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
