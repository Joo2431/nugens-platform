import React, { useState } from "react";

const PURPLE = "#7c3aed";
const PINK   = "#e8185d";
const B      = "#1e1e2e";

const POSTS = [
  { id: 1, author: "Priya S.", role: "Product Manager · 2 yrs exp", avatar: PINK, time: "2h ago", tag: "Career Advice", title: "Got promoted in 8 months — here's the exact framework I used", likes: 84, replies: 22, pinned: true },
  { id: 2, author: "Karthik R.", role: "Software Engineer · Fresher", avatar: "#0284c7", time: "5h ago", tag: "Interview Prep", title: "First interview tomorrow at TCS — what should I expect in the HR round?", likes: 12, replies: 18, pinned: false },
  { id: 3, author: "Meera J.", role: "Marketing Executive · 1 yr", avatar: PURPLE, time: "1d ago", tag: "Salary", title: "How to negotiate salary when they say 'the budget is fixed'", likes: 67, replies: 31, pinned: false },
  { id: 4, author: "Arjun M.", role: "Business Analyst · 3 yrs", avatar: "#d97706", time: "1d ago", tag: "Office Culture", title: "My manager takes credit for my work. How do I handle this professionally?", likes: 103, replies: 45, pinned: false },
  { id: 5, author: "Divya K.", role: "UX Designer · Fresher", avatar: "#16a34a", time: "2d ago", tag: "Personal Brand", title: "I rewrote my LinkedIn summary using the HyperX framework — 3x profile views", likes: 56, replies: 14, pinned: false },
];

const TAGS = ["All", "Career Advice", "Interview Prep", "Salary", "Office Culture", "Personal Brand", "Communication"];

export default function Community({ profile }) {
  const [activeTag, setActiveTag] = useState("All");
  const filtered = POSTS.filter(p => activeTag === "All" || p.tag === activeTag);

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", padding: "32px 28px 80px", background: "#080814", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .post-card { background: #0d0d1a; border: 1px solid ${B}; border-radius: 12px; padding: 18px 20px; cursor: pointer; transition: all 0.15s; }
        .post-card:hover { border-color: #2a2a3e; transform: translateY(-1px); }
        .tag-pill { padding: 5px 13px; border-radius: 7px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid ${B}; background: transparent; color: #555; transition: all 0.13s; white-space: nowrap; }
        .tag-pill.on, .tag-pill:hover { background: #1a1a2a; color: #fff; border-color: #2a2a3e; }
        @media (max-width: 700px) { .comm-layout { flex-direction: column !important; } .comm-side { width: 100% !important; } }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: "clamp(20px,2.5vw,26px)", letterSpacing: "-0.03em", color: "#fff", marginBottom: 4 }}>Community</h1>
          <p style={{ fontSize: 13.5, color: "#555" }}>Real questions. Real answers. From people actually in the workplace.</p>
        </div>
        <button style={{ padding: "9px 20px", background: PURPLE, border: "none", borderRadius: 9, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          + Post a question
        </button>
      </div>

      <div className="comm-layout" style={{ display: "flex", gap: 20 }}>
        {/* Main feed */}
        <div style={{ flex: 1 }}>
          {/* Tags */}
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 20 }}>
            {TAGS.map(tag => (
              <button key={tag} className={`tag-pill ${activeTag === tag ? "on" : ""}`} onClick={() => setActiveTag(tag)}>{tag}</button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(post => (
              <div key={post.id} className="post-card">
                {post.pinned && (
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "#d97706", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>📌 Pinned</div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: post.avatar + "30", border: `1px solid ${post.avatar}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: post.avatar, flexShrink: 0 }}>
                    {post.author[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#ccc" }}>{post.author}</div>
                    <div style={{ fontSize: 11, color: "#444" }}>{post.role}</div>
                  </div>
                  <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: PURPLE, background: PURPLE + "18", padding: "2px 8px", borderRadius: 5 }}>{post.tag}</span>
                    <span style={{ fontSize: 11, color: "#444" }}>{post.time}</span>
                  </div>
                </div>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: "#fff", lineHeight: 1.45, marginBottom: 14 }}>{post.title}</div>
                <div style={{ display: "flex", gap: 16 }}>
                  <button style={{ background: "none", border: "none", cursor: "pointer", color: "#555", fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
                    <span>♥</span> <span>{post.likes}</span>
                  </button>
                  <button style={{ background: "none", border: "none", cursor: "pointer", color: "#555", fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
                    <span>◎</span> <span>{post.replies} replies</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="comm-side" style={{ width: 240, flexShrink: 0 }}>
          {/* Community stats */}
          <div style={{ background: "#0d0d1a", border: `1px solid ${B}`, borderRadius: 12, padding: "18px", marginBottom: 14 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#444", marginBottom: 14 }}>Community</div>
            {[
              { label: "Members",        value: "2,400+" },
              { label: "Posts this week", value: "142" },
              { label: "Questions answered", value: "94%" },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid #0f0f20`, fontSize: 12.5 }}>
                <span style={{ color: "#666" }}>{s.label}</span>
                <span style={{ color: "#fff", fontWeight: 700 }}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Top contributors */}
          <div style={{ background: "#0d0d1a", border: `1px solid ${B}`, borderRadius: 12, padding: "18px" }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#444", marginBottom: 14 }}>Top Contributors</div>
            {[
              { name: "Arjun M.", posts: 48, color: "#d97706" },
              { name: "Meera J.", posts: 36, color: PURPLE },
              { name: "Priya S.", posts: 29, color: PINK },
              { name: "Karthik R.", posts: 22, color: "#0284c7" },
            ].map(c => (
              <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 0", borderBottom: `1px solid #0f0f20` }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: c.color + "25", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: c.color, flexShrink: 0 }}>{c.name[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, color: "#ccc", fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: "#444" }}>{c.posts} posts</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
