/**
 * HyperX — Learning Streak Tracker
 * Tracks daily learning streaks, shows progress, sends nudges.
 * Saves streak data to localStorage (no DB schema changes needed).
 */
import React, { useState, useEffect } from "react";

const PINK = "#e8185d";
const KEY  = "hx-streak";

function getToday() { return new Date().toISOString().slice(0,10); }

export function recordLesson() {
  const today = getToday();
  const data  = JSON.parse(localStorage.getItem(KEY) || "{}");
  if (data.lastDate === today) return; // already recorded today

  const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1);
  const yStr = yesterday.toISOString().slice(0,10);

  const wasYesterday = data.lastDate === yStr;
  const current = wasYesterday ? (data.current||0)+1 : 1;
  const longest  = Math.max(data.longest||0, current);

  localStorage.setItem(KEY, JSON.stringify({
    lastDate: today,
    current,
    longest,
    total:  (data.total||0)+1,
    history:[...(data.history||[]).slice(-29), today],
  }));
}

export function getStreakData() {
  const data = JSON.parse(localStorage.getItem(KEY) || "{}");
  const today = getToday();
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1);
  const yStr = yesterday.toISOString().slice(0,10);
  const isActiveToday = data.lastDate === today;
  const activeLast2   = data.lastDate === today || data.lastDate === yStr;
  // Streak is broken if last lesson was before yesterday
  const current = activeLast2 ? (data.current||0) : 0;
  return { ...data, current, isActiveToday };
}

export default function StreakBadge({ compact = false }) {
  const [streak, setStreak] = useState({ current:0, longest:0, total:0, isActiveToday:false });

  useEffect(() => { setStreak(getStreakData()); }, []);

  const { current, longest, total, isActiveToday } = streak;
  const fire = current >= 7 ? "🔥" : current >= 3 ? "⚡" : "📚";

  if (compact) {
    return (
      <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"5px 12px",
        background: isActiveToday ? `${PINK}12` : "#f5f7fa",
        border:`1px solid ${isActiveToday?PINK+"30":"#edf0f3"}`,
        borderRadius:20, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
        <span style={{ fontSize:14 }}>{fire}</span>
        <span style={{ fontSize:12, fontWeight:700, color:isActiveToday?PINK:"#9ca3af" }}>
          {current} day streak
        </span>
      </div>
    );
  }

  const last7 = Array.from({length:7}).map((_,i)=>{
    const d = new Date(); d.setDate(d.getDate()-6+i);
    const ds = d.toISOString().slice(0,10);
    const active = (streak.history||[]).includes(ds);
    const isToday = ds === getToday();
    return { ds, active, isToday, label:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()] };
  });

  return (
    <div style={{ background:"#fff", border:"1.5px solid #f0f2f5", borderRadius:14, padding:"18px 20px", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>

      {/* Streak header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:28 }}>{fire}</span>
            <div>
              <div style={{ fontSize:24, fontWeight:800, color:PINK, lineHeight:1 }}>{current}</div>
              <div style={{ fontSize:11, color:"#9ca3af", fontWeight:500 }}>day streak</div>
            </div>
          </div>
        </div>
        <div style={{ display:"flex", gap:16 }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:16, fontWeight:700, color:"#374151" }}>{longest}</div>
            <div style={{ fontSize:10, color:"#9ca3af" }}>Best</div>
          </div>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:16, fontWeight:700, color:"#374151" }}>{total}</div>
            <div style={{ fontSize:10, color:"#9ca3af" }}>Total</div>
          </div>
        </div>
      </div>

      {/* 7-day view */}
      <div style={{ display:"flex", gap:6, justifyContent:"space-between" }}>
        {last7.map(day => (
          <div key={day.ds} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
            <div style={{ fontSize:9, color:"#9ca3af", fontWeight:600, textTransform:"uppercase" }}>{day.label}</div>
            <div style={{
              width:28, height:28, borderRadius:"50%",
              background: day.active ? PINK : day.isToday ? `${PINK}15` : "#f3f4f6",
              border: day.isToday && !day.active ? `2px dashed ${PINK}` : "2px solid transparent",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:12,
            }}>
              {day.active ? <span style={{ color:"#fff", fontSize:12 }}>✓</span> : day.isToday ? <span style={{ color:PINK, fontSize:10 }}>·</span> : null}
            </div>
          </div>
        ))}
      </div>

      {/* Status message */}
      <div style={{ marginTop:12, padding:"8px 12px", background:isActiveToday?"#f0fdf4":"#fff8f0", borderRadius:8 }}>
        <div style={{ fontSize:11.5, color:isActiveToday?"#15803d":"#92400e", fontWeight:500 }}>
          {isActiveToday
            ? `✅ You learned today! Keep it up${current>=7?" — you're on fire 🔥":""}!`
            : current > 0
              ? `⚡ ${current}-day streak. Study today to keep it going!`
              : "📚 Start learning today to begin your streak!"}
        </div>
      </div>
    </div>
  );
}
