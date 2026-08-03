import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const PINK = "#e8185d";
const BG = "#f8f9fb";
const CARD = "#ffffff";
const BORDER = "#e8eaed";

export default function InterviewRoom({ profile }) {
  const [role, setRole] = useState(profile?.target_role || "");
  const [experience, setExperience] = useState(profile?.experience || "");
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  const startInterview = async () => {
    if (!role) return alert("Please enter a target role");
    setLoading(true);
    setQuestions([]); setCurrentQ(0); setFeedback(""); setAnswer("");

    try {
      const token = (await supabase.auth.getSession()).data?.session?.access_token;
      const prompt = `Generate exactly 8 realistic mock interview questions for the role of ${role}. 4 behavioral (STAR style) and 4 technical/role-specific. Scale difficulty to ${experience || "mid-level"} experience. Return ONLY a JSON array of strings.`;

      const res = await fetch("https://nugens-platform-production.up.railway.app/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ message: prompt, mode: "INTERVIEW", history: [] }),
      });

      const text = await res.text();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      let qs = [];
      if (jsonMatch) { try { qs = JSON.parse(jsonMatch[0]); } catch {} }
      if (!qs.length) qs = ["Tell me about yourself.", "Why this role?", "Describe a challenging project.", "How do you handle conflict?", "Technical question 1", "Technical question 2", "Where do you see yourself in 5 years?", "Any questions for us?"];

      setQuestions(qs);
      setCurrentQ(0);
    } catch (e) { alert("Failed to start interview: " + e.message); }
    finally { setLoading(false); }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) return;
    const q = questions[currentQ];
    setLoading(true);

    try {
      const token = (await supabase.auth.getSession()).data?.session?.access_token;
      const prompt = `Give detailed mock interview feedback for role ${role}. Question: "${q}". Candidate answer: "${answer}". Experience: ${experience || "mid-level"}.
Provide: 1. Overall assessment 2. What was good 3. What to improve + specific suggestion 4. One actionable tip. Be professional and encouraging.`;

      const res = await fetch("https://nugens-platform-production.up.railway.app/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ message: prompt, mode: "INTERVIEW", history: [] }),
      });

      const text = await res.text();
      const clean = text.replace(/data: /g, "").slice(0, 900);
      setFeedback(clean || "Good attempt. Try adding specific examples and metrics.");

      if (profile?.id) {
        await supabase.from("saved_artifacts").insert({
          user_id: profile.id,
          type: "interview",
          title: `Interview Q${currentQ + 1} - ${role}`,
          content_md: `Q: ${q}\n\nAnswer: ${answer}\n\nFeedback: ${clean}`,
        }).catch(() => {});
      }
    } catch (e) {
      setFeedback("Thanks for your answer. Try adding a specific example next time.");
    } finally {
      setLoading(false);
      setAnswer("");
    }
  };

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1); setFeedback(""); setAnswer(""); setTimer(0); setTimerRunning(false);
    } else {
      alert("Interview complete! All answers and feedback saved to Vault.");
    }
  };

  useEffect(() => {
    let interval;
    if (timerRunning && timer < 90) interval = setInterval(() => setTimer(t => t + 1), 1000);
    else if (timer >= 90) setTimerRunning(false);
    return () => clearInterval(interval);
  }, [timerRunning, timer]);

  const toggleTimer = () => setTimerRunning(!timerRunning);

  return (
    <div style={{ minHeight: "100vh", background: BG, padding: "32px 40px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: PINK, letterSpacing: "0.08em" }}>GEN-E</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111", margin: "4px 0 8px" }}>Mock Interview Room</h1>
          <p style={{ color: "#666", fontSize: 14 }}>Realistic questions • Timer • Detailed AI feedback • Auto-saved to Vault</p>
        </div>

        {!questions.length && (
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 28, maxWidth: 520 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: "#111" }}>Start a new mock interview</div>
            <input value={role} onChange={e => setRole(e.target.value)} placeholder="Target role (e.g. Senior Product Manager)" style={{ width: "100%", padding: "12px 14px", border: `1.5px solid ${BORDER}`, borderRadius: 10, fontSize: 15, marginBottom: 12 }} />
            <input value={experience} onChange={e => setExperience(e.target.value)} placeholder="Your experience level (e.g. 4 years)" style={{ width: "100%", padding: "12px 14px", border: `1.5px solid ${BORDER}`, borderRadius: 10, fontSize: 15, marginBottom: 20 }} />
            <button onClick={startInterview} disabled={loading || !role} style={{ width: "100%", padding: "14px 0", background: loading ? "#fce7f3" : PINK, color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: loading || !role ? "not-allowed" : "pointer" }}>
              {loading ? "Preparing questions..." : "🎤 Start Interview →"}
            </button>
          </div>
        )}

        {questions.length > 0 && (
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: PINK }}>QUESTION {currentQ + 1} / {questions.length}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#111", marginTop: 6, lineHeight: 1.35 }}>{questions[currentQ]}</div>
              </div>
              <button onClick={toggleTimer} style={{ padding: "7px 16px", background: timerRunning ? "#fee2e2" : "#f0fdf4", color: timerRunning ? "#dc2626" : "#16a34a", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                {timerRunning ? "⏸ Pause" : "▶ Start"} Timer ({timer}s / 90)
              </button>
            </div>

            <textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Type your answer here... (Use STAR method)" rows={5} style={{ width: "100%", padding: "14px 16px", border: `1.5px solid ${BORDER}`, borderRadius: 12, fontSize: 15, resize: "vertical", marginBottom: 14 }} />

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={submitAnswer} disabled={loading || !answer.trim()} style={{ flex: 1, padding: "13px 0", background: loading ? "#fce7f3" : PINK, color: "#fff", border: "none", borderRadius: 11, fontSize: 15, fontWeight: 700, cursor: loading || !answer.trim() ? "not-allowed" : "pointer" }}>
                {loading ? "Getting detailed feedback..." : "Submit Answer & Get Feedback"}
              </button>
              {feedback && <button onClick={nextQuestion} style={{ padding: "13px 22px", background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 11, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Next Question →</button>}
            </div>

            {feedback && (
              <div style={{ marginTop: 18, padding: "18px 20px", background: "#fefce8", border: `1px solid #fde047`, borderRadius: 12, fontSize: 14.5, color: "#713f12", lineHeight: 1.7 }}>
                <div style={{ fontWeight: 700, marginBottom: 6, color: "#854d0e" }}>Detailed Feedback</div>{feedback}
              </div>
            )}
            <div style={{ marginTop: 22, fontSize: 12, color: "#888", textAlign: "center" }}>Answers + feedback saved to <strong>Vault → Interview</strong></div>
          </div>
        )}
      </div>
    </div>
  );
}
