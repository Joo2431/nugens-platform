import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import multer from "multer";
import unzipper from "unzipper";
import mammoth from "mammoth";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { createClient } from "@supabase/supabase-js";
import Razorpay from "razorpay";
import crypto from "crypto";

// pdf-parse: CommonJS package, load via createRequire
const _require = createRequire(import.meta.url);
let pdfParse;
try {
  pdfParse = _require("pdf-parse/lib/pdf-parse.js");
} catch(e) {
  try { pdfParse = _require("pdf-parse"); } catch(e2) {
    console.warn("pdf-parse unavailable:", e2.message);
  }
}

import { exec as _exec } from "child_process";
import { promisify } from "util";
const execAsync = promisify(_exec);

dotenv.config();
const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

/* ── ENV VALIDATION ── */
/* ── ENV CHECK — warn but never crash the server ── */
["OPENAI_API_KEY","SUPABASE_URL","SUPABASE_SERVICE_KEY"].forEach(k => {
  if (!process.env[k]) console.error("❌ CRITICAL missing env:", k);
});
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET)
  console.warn("⚠️  Razorpay keys missing — payment routes will return 503");

/* ── CLIENTS ── */
const openai   = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
/* Groq — free forever, Llama 3.3 70B, ~2× faster than GPT-4o-mini for chat */
const groq = process.env.GROQ_API_KEY
  ? new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" })
  : null;
/* Gemini Flash — free 15 req/min, used for job tips */
const GEMINI_KEY = process.env.GEMINI_API_KEY || null;
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const razorpay = (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
  ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
  : null;

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

/* ── UPLOAD DIR — always ensure it exists (Render ephemeral FS) ── */
const uploadDir = path.join(__dirname, "uploads");
function ensureUploadDir() {
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
}
ensureUploadDir();

const upload = multer({ dest: uploadDir, limits: { fileSize: 15 * 1024 * 1024 } });

const FREE_LIMIT = 20;

/* ── LANGUAGE NAMES (for system prompt injection) ── */
const LANG_NAMES = {
  en:"English", hi:"Hindi", es:"Spanish", fr:"French", ar:"Arabic",
  pt:"Portuguese", de:"German", zh:"Chinese (Simplified)", ja:"Japanese",
  ko:"Korean", ru:"Russian", id:"Indonesian (Bahasa)", tr:"Turkish",
  bn:"Bengali", ta:"Tamil", te:"Telugu", vi:"Vietnamese",
  it:"Italian", sw:"Swahili", nl:"Dutch",
};

/* ── KEEP-ALIVE PING (prevents Render free tier cold starts) ── */
const SELF_URL =
  process.env.RENDER_EXTERNAL_URL ||
  (process.env.RENDER_EXTERNAL_HOSTNAME ? "https://" + process.env.RENDER_EXTERNAL_HOSTNAME : "");
const startKeepAlive = (url) => {
  console.log("🏓 Keep-alive →", url);
  setInterval(async () => {
    try { await fetch(url + "/health", { signal: AbortSignal.timeout(12000) }); }
    catch (e) { console.warn("Keep-alive failed:", e.message); }
  }, 10 * 60 * 1000);
};
if (SELF_URL) startKeepAlive(SELF_URL);
else setTimeout(() => startKeepAlive("http://localhost:" + (process.env.PORT || 10000)), 8000);

/* ── AUTH MIDDLEWARE ── */
async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: "Invalid or expired token" });
  req.user = user;
  next();
}

async function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) { next(); return; }
  try {
    const { data: { user } } = await supabase.auth.getUser(token);
    if (user) req.user = user;
  } catch {}
  next();
}

/* ── USAGE MIDDLEWARE ── */
async function checkUsage(req, res, next) {
  if (!req.user) { next(); return; }
  const { data: profile, error } = await supabase
    .from("profiles").select("plan, questions_used").eq("id", req.user.id).single();

  if (error || !profile) {
    await supabase.from("profiles").upsert({
      id: req.user.id, email: req.user.email,
      full_name: req.user.user_metadata?.full_name || "",
      plan: "free", questions_used: 0,
    });
    req.profile = { plan: "free", questions_used: 0 };
    return next();
  }

  // Admin bypasses all usage limits
  if (profile.plan === "admin") { req.profile = profile; return next(); }

  if (profile.plan === "free" && (profile.questions_used || 0) >= FREE_LIMIT) {
    return res.status(403).json({
      error: "limit_reached",
      message: `You've used all ${FREE_LIMIT} free questions. Upgrade to Pro to continue.`,
    });
  }
  req.profile = profile;
  next();
}

async function incrementUsage(userId) {
  await supabase.rpc("increment_questions_used", { user_id: userId });
}

async function logChat({ userId, sessionId, role, message, mode }) {
  if (!userId) return;
  try {
    await supabase.from("chat_logs").insert({
      user_id: userId, session_id: sessionId || "unknown",
      role, message: message?.slice(0, 8000) || "", mode: mode || "CAREER",
    });
  } catch (e) { console.warn("logChat error:", e.message); }
}

/* ── PLAN CONFIG ── */
// Covers all plans from all platforms (NuGens Web, Gen-E, HyperX, DigiHub, Units)
// amount = paise (INR × 100). profilePlan = value written to profiles.plan column.
const PLAN_CONFIG = {
  // ── Gen-E plans ───────────────────────────────────────────────────
  monthly:      { amount: 9900,    currency: "INR", label: "Gen-E Pro Monthly",  durationDays: 30,  profilePlan: "gene_monthly" },
  yearly:       { amount: 69900,   currency: "INR", label: "Gen-E Pro Yearly",   durationDays: 365, profilePlan: "gene_yearly"  },
  gene_monthly: { amount: 9900,    currency: "INR", label: "Gen-E Pro Monthly",  durationDays: 30,  profilePlan: "gene_monthly" },
  gene_yearly:  { amount: 69900,   currency: "INR", label: "Gen-E Pro Yearly",   durationDays: 365, profilePlan: "gene_yearly"  },

  // ── NuGens Suite — Individual ─────────────────────────────────────
  individual_starter_monthly: { amount: 9900,    currency: "INR", label: "Suite Starter Monthly",  durationDays: 30,  profilePlan: "ng_ind_starter" },
  individual_starter_yearly:  { amount: 79900,   currency: "INR", label: "Suite Starter Yearly",   durationDays: 365, profilePlan: "ng_ind_starter" },
  individual_premium_monthly: { amount: 19900,   currency: "INR", label: "Suite Premium Monthly",  durationDays: 30,  profilePlan: "ng_ind_premium" },
  individual_premium_yearly:  { amount: 149900,  currency: "INR", label: "Suite Premium Yearly",   durationDays: 365, profilePlan: "ng_ind_premium" },
  individual_pro_monthly:     { amount: 29900,   currency: "INR", label: "Suite Pro Monthly",      durationDays: 30,  profilePlan: "ng_ind_pro"     },
  individual_pro_yearly:      { amount: 249900,  currency: "INR", label: "Suite Pro Yearly",       durationDays: 365, profilePlan: "ng_ind_pro"     },

  // ── NuGens Suite — Business ───────────────────────────────────────
  business_starter_monthly: { amount: 49900,   currency: "INR", label: "Suite Biz Starter Monthly",  durationDays: 30,  profilePlan: "ng_biz_starter" },
  business_starter_yearly:  { amount: 399900,  currency: "INR", label: "Suite Biz Starter Yearly",   durationDays: 365, profilePlan: "ng_biz_starter" },
  business_premium_monthly: { amount: 99900,   currency: "INR", label: "Suite Biz Premium Monthly",  durationDays: 30,  profilePlan: "ng_biz_premium" },
  business_premium_yearly:  { amount: 799900,  currency: "INR", label: "Suite Biz Premium Yearly",   durationDays: 365, profilePlan: "ng_biz_premium" },
  business_pro_monthly:     { amount: 199900,  currency: "INR", label: "Suite Biz Pro Monthly",      durationDays: 30,  profilePlan: "ng_biz_pro"     },
  business_pro_yearly:      { amount: 1499900, currency: "INR", label: "Suite Biz Pro Yearly",       durationDays: 365, profilePlan: "ng_biz_pro"     },

  // ── HyperX plans ─────────────────────────────────────────────────
  hx_ind_premium_monthly: { amount: 29900,  currency: "INR", label: "HyperX Premium Monthly",      durationDays: 30,  profilePlan: "hx_ind_premium" },
  hx_ind_pro_monthly:     { amount: 79900,  currency: "INR", label: "HyperX Pro Monthly",          durationDays: 30,  profilePlan: "hx_ind_pro"     },
  hx_ind_yearly:          { amount: 299900, currency: "INR", label: "HyperX Pro Yearly",           durationDays: 365, profilePlan: "hx_ind_yearly"  },
  hx_biz_starter_monthly: { amount: 29900,  currency: "INR", label: "HyperX Biz Starter Monthly",  durationDays: 30,  profilePlan: "hx_biz_starter" },
  hx_biz_premium_monthly: { amount: 69900,  currency: "INR", label: "HyperX Biz Premium Monthly",  durationDays: 30,  profilePlan: "hx_biz_premium" },
  hx_biz_pro_monthly:     { amount: 159900, currency: "INR", label: "HyperX Biz Pro Monthly",      durationDays: 30,  profilePlan: "hx_biz_pro"     },
  hx_biz_yearly:          { amount: 349900, currency: "INR", label: "HyperX Biz Yearly",           durationDays: 365, profilePlan: "hx_biz_yearly"  },

  // ── DigiHub plans ─────────────────────────────────────────────────
  dh_starter_monthly:  { amount: 99900,   currency: "INR", label: "DigiHub Starter Monthly",  durationDays: 30,  profilePlan: "dh_starter"  },
  dh_starter_yearly:   { amount: 999000,  currency: "INR", label: "DigiHub Starter Yearly",   durationDays: 365, profilePlan: "dh_starter"  },
  dh_premium_monthly:  { amount: 259900,  currency: "INR", label: "DigiHub Premium Monthly",  durationDays: 30,  profilePlan: "dh_premium"  },
  dh_premium_yearly:   { amount: 2599000, currency: "INR", label: "DigiHub Premium Yearly",   durationDays: 365, profilePlan: "dh_premium"  },
  dh_pro_monthly:      { amount: 599900,  currency: "INR", label: "DigiHub Pro Yearly",       durationDays: 365, profilePlan: "dh_pro"      },
  // Individual DigiHub plans
  dh_monthly_monthly:  { amount: 29900,   currency: "INR", label: "DigiHub Individual Monthly", durationDays: 30,  profilePlan: "dh_monthly"  },
  dh_yearly_yearly:    { amount: 199900,  currency: "INR", label: "DigiHub Individual Yearly",  durationDays: 365, profilePlan: "dh_yearly"   },

  // ── Gen-E Business plans ──────────────────────────────────────────
  biz_starter:          { amount: 49900,   currency: "INR", label: "Gen-E Business Starter Monthly", durationDays: 30,  profilePlan: "gene_biz_starter" },
  biz_pro:              { amount: 149900,  currency: "INR", label: "Gen-E Business Pro Monthly",     durationDays: 30,  profilePlan: "gene_biz_pro"     },
  gene_biz_starter:     { amount: 49900,   currency: "INR", label: "Gen-E Business Starter Monthly", durationDays: 30,  profilePlan: "gene_biz_starter" },
  gene_biz_pro:         { amount: 149900,  currency: "INR", label: "Gen-E Business Pro Monthly",     durationDays: 30,  profilePlan: "gene_biz_pro"     },

  // ── Units plans ───────────────────────────────────────────────────
  units_consult:         { amount: 99900,  currency: "INR", label: "Units Premium Consultation",  durationDays: 1,   profilePlan: "units_consult"  },
  units_starter_monthly: { amount: 9900,   currency: "INR", label: "Units Starter Monthly",       durationDays: 30,  profilePlan: "units_starter"  },
  units_starter_yearly:  { amount: 79900,  currency: "INR", label: "Units Starter Yearly",        durationDays: 365, profilePlan: "units_starter"  },
  units_pro_monthly:     { amount: 19900,  currency: "INR", label: "Units Pro Monthly",           durationDays: 30,  profilePlan: "units_pro"      },
  units_pro_yearly:      { amount: 149900, currency: "INR", label: "Units Pro Yearly",            durationDays: 365, profilePlan: "units_pro"      },
};

/* ── SYSTEM PROMPT ── */
const SYSTEM_PROMPT = `You are GEN-E, a sharp and empathetic AI Career Intelligence Assistant.

CRITICAL CAPABILITY - PDF & DOCUMENT GENERATION:
- You CAN generate ATS-friendly resume PDFs directly — the GEN-E platform automatically converts your resume output into a downloadable PDF file.
- When a user asks for their resume in PDF or Word format, NEVER say you can't do it.
- Instead, generate the complete resume in your response. The system will automatically create a downloadable PDF for Pro users.
- For free users: generate the full resume text and inform them that PDF download is a Pro feature. They can upgrade at /pricing.
- Word format: generate the full resume text and tell them to copy it into Word/Google Docs for further customization.

YOUR CORE PHILOSOPHY:
- You are a career coach, not a content generator.
- NEVER dump long structured reports unless the user explicitly asks for them.
- Your default mode is CONVERSATION — ask, listen, then guide.
- You ask ONE focused question at a time to deeply understand the user's situation before advising.
- Only give structured output (resumes, full plans) when you have enough context OR the user asks directly.

STRICT SCOPE — ALWAYS HELP WITH THESE (never refuse):
- Career roadmaps for ANY role: "become a UX designer", "6-month plan to learn ML", etc.
- Career switches between any fields including non-tech to tech
- Job search, resume, LinkedIn, cover letters, salary negotiation
- Interview prep for ANY company or role
- Skill plans, certifications, learning paths for any profession
- Any role in any industry: tech, design, marketing, finance, healthcare, law, etc.

ONLY refuse if topic has ZERO career connection:
- e.g. cooking recipes, sports scores, movies, romantic relationships, jokes
- Say: "I'm only built for career guidance — I can't help with that, but happy to assist with anything career-related! 😊"
- When in doubt, help. Always.

JOB SEARCH IN CHAT:
- When a user asks to find or search jobs, live job listings will be shown automatically as cards in chat.
- Write a SHORT warm intro only (2-3 sentences): e.g. "Here are live openings for Data Analyst roles in Bangalore! Click any card to apply directly. Want me to tailor your resume for any of these?"
- NEVER suggest job portals like Naukri, LinkedIn, Indeed. GEN-E fetches live jobs directly.
- After showing jobs, offer resume tailoring or interview prep for those specific companies.

CONVERSATION STYLE:
- Keep responses SHORT (2–5 sentences max) unless doing a full resume/plan.
- Be warm, direct, and human — like a senior mentor giving advice.
- When a user shares a vague problem, ask ONE clarifying question.
- Use conversation history to avoid repeating questions.

DOCUMENT UPLOAD CAPABILITY:
- You CAN analyze resumes, CVs, job descriptions, and screenshots — users upload via the 📎 button.
- If a user mentions they have a resume or document, tell them: "You can upload it directly using the 📎 button next to the input box — I'll analyze it right away!"
- When a document IS uploaded and its text/content is provided to you, analyze it thoroughly and give specific feedback.

RESUME GENERATION RULES:
- When generating a resume, ALWAYS use this exact structure with ## headers:
## PROFESSIONAL SUMMARY
## CORE SKILLS
## PROFESSIONAL EXPERIENCE
## PROJECTS
## EDUCATION
## CERTIFICATIONS
- Make it ATS-friendly: use standard section names, bullet points, action verbs, quantifiable achievements.
- After generating, tell the user: "Your resume PDF is being prepared for download! 📄"

WHEN TO GIVE STRUCTURED OUTPUT:
- Resume request → gather details OR ask them to upload existing resume, then generate
- Interview prep → ask for role/company first, then give questions + strategy
- Career score → ask about skills/experience + target role first
- Career plan → gather role, experience, timeline before giving roadmap

RESPONSE LENGTH:
- Greeting / vague query → 2–3 lines + 1 question
- Follow-up with context → 3–5 lines of advice + optional question
- Full resume / plan / score → detailed structured output
`;

const MODE_ADDENDUM = {
  RESUME: `
The user is in RESUME / ATS RESUME mode.
- This is GEN-E's core feature. You MUST help build or optimize their resume.
- If no details provided: ask for current role, years of experience, target role, and key skills.
- Once you have enough info, generate a COMPLETE ATS-friendly resume using the ## header structure.
- Always remind them the PDF download button will appear automatically after generation.
- NEVER say you cannot create or deliver a resume PDF.`,
  INTERVIEW: `
The user is in INTERVIEW PREP mode.
- If you don't know the target role/company, ask first.
- Then provide: 5 HR questions, 5 technical questions, weak areas, and a 1-week prep plan.`,
  SCORING: `
The user wants a CAREER READINESS SCORE.
- Ask about skills, experience, and target role if not already provided.
- Score them 0–100 with: Strength Areas, Skill Gaps, Risk Factors, and a 30-Day Action Plan.`,
  CAREER: ""
};

/* ── UTILS ── */
function safeExtract(response) {
  return response?.choices?.[0]?.message?.content
    || "I'm here to help with your career. Could you tell me more about your situation?";
}

function isGreeting(message) {
  return /^(hi+|hello+|hey+|helo|sup|yo|howdy|hiya|hai)\s*[!.?]?\s*$/i.test(message.trim());
}

function detectMode(message) {
  const m = message.toLowerCase();
  if (m.includes("[mode:resume]"))    return "RESUME";
  if (m.includes("[mode:interview]")) return "INTERVIEW";
  if (m.includes("[mode:scoring]"))   return "SCORING";
  return "CAREER";
}

function cleanMessage(message) {
  return message
    .replace(/\[MODE:RESUME\]/gi, "")
    .replace(/\[MODE:INTERVIEW\]/gi, "")
    .replace(/\[MODE:SCORING\]/gi, "")
    .replace(/\[MODE:CAREER\]/gi, "")
    .trim();
}

async function callOpenAI(systemPrompt, history, maxTokens = 600) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "system", content: systemPrompt }, ...history],
    max_tokens: maxTokens,
    temperature: 0.75,
  });
  return safeExtract(response);
}

/* Groq (Llama 3.3 70B) — free fallback, 2× faster on simple queries */
async function callGroq(systemPrompt, history, maxTokens = 600) {
  if (!groq) throw new Error("Groq not configured");
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "system", content: systemPrompt }, ...history],
    max_tokens: maxTokens,
    temperature: 0.75,
  });
  return safeExtract(response);
}

/* Smart caller: GPT-4o-mini first, auto-falls back to Groq on rate limit */
async function callAI(systemPrompt, history, maxTokens = 600) {
  try {
    return await callOpenAI(systemPrompt, history, maxTokens);
  } catch (err) {
    if (groq && (err.status === 429 || err.status === 503 || err.code === "ECONNRESET")) {
      console.log("⚡ GPT rate-limited — switching to Groq");
      return await callGroq(systemPrompt, history, maxTokens);
    }
    throw err;
  }
}

/* Gemini Flash — free tier, used for lightweight tasks like job tips */
async function callGemini(prompt) {
  if (!GEMINI_KEY) return null;
  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + GEMINI_KEY,
      { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: AbortSignal.timeout(10000) }
    );
    const d = await res.json();
    return d?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch { return null; }
}

/* ── PDF GENERATION ── */
function generateResumePDF(content) {
  const fileName = `resume-${Date.now()}.pdf`;
  const filePath = path.join(__dirname, fileName);
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  doc.pipe(fs.createWriteStream(filePath));

  const lines = content.split("\n");
  lines.forEach(line => {
    const clean = line.replace(/##\s?/g, "").replace(/\*\*/g, "").trim();
    if (!clean) { doc.moveDown(0.3); return; }
    if (line.startsWith("## ")) {
      doc.moveDown(0.6)
         .fontSize(11).font("Helvetica-Bold").fillColor("#e8185d")
         .text(clean.toUpperCase(), { underline: false });
      doc.moveDown(0.15)
         .moveTo(50, doc.y).lineTo(545, doc.y)
         .strokeColor("#f0d0d8").lineWidth(0.5).stroke();
      doc.moveDown(0.2);
    } else if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
      doc.fontSize(10).font("Helvetica").fillColor("#333")
         .text("• " + clean.replace(/^[-•]\s*/, ""), { indent: 12, lineGap: 1.5 });
    } else if (line.startsWith("**")) {
      doc.fontSize(10.5).font("Helvetica-Bold").fillColor("#111").text(clean);
    } else {
      doc.fontSize(10).font("Helvetica").fillColor("#444").text(clean, { lineGap: 1.5 });
    }
  });

  doc.end();
  return fileName;
}

/* ── FILE TEXT EXTRACTION ── */
async function extractFileText(file) {
  const ext = path.extname(file.originalname || file.path).toLowerCase();
  try {
    if (ext === ".pdf") {
      if (!pdfParse) { console.warn("pdf-parse not loaded"); return null; }
      try {
        const data = fs.readFileSync(file.path);
        const parsed = await pdfParse(data);
        const text = parsed.text?.trim() || "";
        if (!text) return null;
        return text;
      } catch (e) {
        console.error("PDF parse error:", e.message);
        return null;
      }
    }
    if (ext === ".docx" || ext === ".doc") {
      const result = await mammoth.extractRawText({ path: file.path });
      return result.value?.trim() || "";
    }
    if (ext === ".txt") {
      return fs.readFileSync(file.path, "utf8").trim();
    }
    if ([".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(ext)) {
      return null; // Signal: use vision API
    }
    if (ext === ".zip") {
      let combined = "";
      const directory = await unzipper.Open.file(file.path);
      for (const entry of directory.files) {
        if (!entry.path.endsWith("/")) {
          combined += (await entry.buffer()).toString() + "\n\n";
        }
      }
      return combined.trim();
    }
  } catch (err) {
    console.error("File extraction error:", err);
    return null;
  }
  return "";
}

/* ── IMAGE TO BASE64 ── */
function fileToBase64(filePath, mimeType) {
  const data = fs.readFileSync(filePath);
  return `data:${mimeType};base64,${data.toString("base64")}`;
}

function getMimeType(ext) {
  const map = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif" };
  return map[ext] || "image/jpeg";
}

/* ═══ ROUTES ═══ */

/* ── POST /api/chat ── */
/* POST /api/chat — SSE streaming (text appears word-by-word instantly) */
app.post("/api/chat", requireAuth, checkUsage, async (req, res) => {
  const { message, history = [], session_id, mode: clientMode, lang = "en" } = req.body;
  if (!message || typeof message !== "string") return res.status(400).json({ error: "Invalid message" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const send = (obj) => {
    try {
      res.write("data: " + JSON.stringify(obj) + "\n\n");
      if (typeof res.flush === "function") res.flush();
    } catch (e) { /* client disconnected */ }
  };

  if (isGreeting(message) && history.length === 0) {
    const greeting = "Hey! I'm **GEN-E**, your AI career assistant.\n\nWhat's going on with your career right now — are you looking to grow, switch, or just figure out the next step?";
    logChat({ userId: req.user?.id, sessionId: session_id, role: "assistant", message: greeting, mode: clientMode || "CAREER" });
    send({ chunk: greeting });
    send({ done: true });
    res.end();
    return;
  }

  const mode      = detectMode(message);
  const clean     = cleanMessage(message);
  const plan      = req.profile?.plan || "free";

  /* ══ FEATURE GATES ══ */

  // ATS Resume Builder → Pro only (monthly + yearly)
  if (mode === "RESUME" && plan === "free") {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    const send = (obj) => res.write("data: " + JSON.stringify(obj) + "\n\n");
    send({ gate: "resume_builder" });
    send({ done: true });
    res.end();
    return;
  }

  // Advanced Interview Prep → Pro only (monthly + yearly)
  if (mode === "INTERVIEW" && plan === "free") {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    const send = (obj) => res.write("data: " + JSON.stringify(obj) + "\n\n");
    send({ gate: "interview_advanced" });
    send({ done: true });
    res.end();
    return;
  }

  // Job Match Analysis → Yearly only
  const isJobQuery = detectJobIntent(clean);
  if (isJobQuery && plan !== "yearly") {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    const sendG = (obj) => res.write("data: " + JSON.stringify(obj) + "\n\n");
    sendG({ gate: "job_search" });
    sendG({ done: true });
    res.end();
    return;
  }

  const modeExtra = MODE_ADDENDUM[mode] || "";
  const langName  = LANG_NAMES[lang] || "English";
  const langNote  = lang !== "en"
    ? `\n\n---\nLANGUAGE INSTRUCTION:\nYou MUST respond entirely in ${langName}. Every word of your reply must be in ${langName} — including labels, section headers, advice, and questions. Do not switch to English under any circumstance. Adapt career advice to be locally relevant (job market, companies, qualifications) where applicable.`
    : "";
  const fullSystem = SYSTEM_PROMPT + (modeExtra ? "\n\n---\nCURRENT MODE:\n" + modeExtra : "") + langNote;
  const convHistory = [...history.slice(-12), { role: "user", content: clean }];
  const maxTokens  = ["RESUME", "SCORING", "INTERVIEW"].includes(mode) ? 1600 : 600;

  logChat({ userId: req.user?.id, sessionId: session_id, role: "user", message: clean, mode });

  /* Job intent — fetch in PARALLEL with stream (already gated above for non-yearly) */
  let jobsPromise = null;
  if (isJobQuery) {
    const { query, location, remote } = extractJobParams(clean);
    console.log("Job intent:", query, "in", location || "any", remote ? "(remote)" : "");
    jobsPromise = fetchLiveJobs(query, location, remote).catch(e => {
      console.warn("Job fetch err:", e.message); return [];
    });
  }

  let fullText = "";

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: fullSystem }, ...convHistory],
      max_tokens: maxTokens, temperature: 0.75, stream: true,
    });

    for await (const chunk of stream) {
      if (res.destroyed) break;
      const delta = chunk.choices[0]?.delta?.content || "";
      if (delta) { fullText += delta; send({ chunk: delta }); }
    }

    let pdfPath = null;
    if (mode === "RESUME" && fullText.length > 500 && fullText.includes("##") && req.profile?.plan !== "free") {
      try { pdfPath = "/download/" + generateResumePDF(fullText); } catch {}
    }
    /* Send live job cards — await parallel job fetch, then send as SSE event */
    if (jobsPromise) {
      const liveJobs = await jobsPromise;
      if (liveJobs.length > 0) send({ jobs: liveJobs });
    }

    send({ done: true, pdf: pdfPath });
    res.end();

    logChat({ userId: req.user?.id, sessionId: session_id, role: "assistant", message: fullText, mode });
    if (req.user && req.profile?.plan === "free") incrementUsage(req.user.id);

  } catch (err) {
    console.error("Chat stream error:", err.message);
    if (!res.destroyed) { send({ error: "Something went wrong. Please try again." }); res.end(); }
  }
});

/* ── POST /api/upload ── */
app.post("/api/upload", optionalAuth, (req, res, next) => {
  ensureUploadDir();
  next();
}, upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ reply: "No file received. Please try uploading again." });
  }

  /* Gate: Resume review & feedback → Pro only (monthly + yearly) */
  const uploaderPlan = req.profile?.plan || "free";
  if (uploaderPlan === "free") {
    try { fs.unlinkSync(req.file.path); } catch {}
    return res.status(403).json({
      gate: "resume_review",
      reply: "Resume review & feedback is a **Pro feature**. Upgrade to Pro to upload and analyze your resume.",
    });
  }

  const ext      = path.extname(req.file.originalname || "").toLowerCase();
  const isImage  = [".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(ext);
  const isPdf    = ext === ".pdf";
  const filePath = req.file.path;
  const userNote = req.body.note || "";

  const buildPrompt = (text) => userNote
    ? `The user uploaded a career document and said: "${userNote}"\n\nDocument:\n${text.slice(0, 5000)}\n\nRespond to their request using the document.`
    : `Analyze this career document and provide:\n\n## Quick Summary\n(2-3 sentences on their profile)\n\n## Strengths\n(specific, with examples)\n\n## Areas to Improve\n(concrete, actionable suggestions)\n\n## ATS Friendliness\n(score out of 10 + exact fixes needed)\n\n## Career Readiness Score\n(X/100 with reasoning)\n\nEnd with ONE focused question about what they need most.\n\nDocument:\n${text.slice(0, 5000)}`;

  // Vision: send an IMAGE file (PNG/JPEG) to GPT-4o
  const visionAnalyze = async (imgPath, mimeType = "image/png") => {
    const b64 = fileToBase64(imgPath, mimeType);
    const resp = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT + "\n\nThe user uploaded a document image. Analyze it as a career document and give detailed feedback." },
        { role: "user", content: [
          { type: "image_url", image_url: { url: b64, detail: "high" } },
          { type: "text", text: userNote ? `User said: "${userNote}" — analyze this document in that context.` : "Analyze this career document. Provide: Quick Summary, Strengths, Areas to Improve, ATS Friendliness (X/10), Career Readiness Score (X/100). End with one focused question." }
        ]}
      ],
      max_tokens: 1400,
    });
    return safeExtract(resp);
  };

  try {
    let output;

    if (isImage) {
      output = await visionAnalyze(filePath, getMimeType(ext));

    } else if (isPdf) {
      let pdfText = null;

      // Strategy 1: pdf-parse library
      if (pdfParse) {
        try {
          const buf = fs.readFileSync(filePath);
          const parsed = await pdfParse(buf);
          const t = parsed.text?.trim() || "";
          if (t.length >= 50) { pdfText = t; console.log("✅ pdf-parse: " + t.length + " chars"); }
          else console.warn("pdf-parse: text too short (" + t.length + " chars)");
        } catch (e) { console.warn("pdf-parse error:", e.message); }
      }

      // Strategy 2: pdftotext CLI (poppler-utils)
      if (!pdfText) {
        try {
          const { stdout } = await execAsync(`pdftotext -layout "${filePath}" -`, { timeout: 12000 });
          const t = stdout?.trim() || "";
          if (t.length >= 50) { pdfText = t; console.log("✅ pdftotext CLI: " + t.length + " chars"); }
          else console.warn("pdftotext: text too short");
        } catch (e) { console.warn("pdftotext CLI error:", e.message); }
      }

      if (pdfText) {
        output = await callAI(
          SYSTEM_PROMPT + "\n\n" + MODE_ADDENDUM.RESUME,
          [{ role: "user", content: buildPrompt(pdfText) }],
          1400
        );
      } else {
        // Strategy 3: Convert PDF page to PNG → GPT-4o vision
        console.log("📷 PDF text failed — converting to image for vision...");
        const outBase = filePath + "_pg";
        let imgPath = null;
        try {
          await execAsync(`pdftoppm -r 180 -png -f 1 -l 1 "${filePath}" "${outBase}"`, { timeout: 20000 });
          const candidates = [`${outBase}-1.png`, `${outBase}-01.png`, `${outBase}-001.png`];
          imgPath = candidates.find(p => fs.existsSync(p)) || null;
        } catch (e) { console.warn("pdftoppm error:", e.message); }

        if (imgPath) {
          console.log("✅ PDF→image success, sending to vision:", imgPath);
          output = await visionAnalyze(imgPath, "image/png");
          try { fs.unlinkSync(imgPath); } catch {}
        } else {
          output = "I wasn't able to read this PDF. It may be encrypted or password-protected.\n\n**Please try one of these:**\n- Convert to **DOCX** and upload again\n- Take a **screenshot** of your resume and upload that\n- **Paste your resume text** directly into the chat";
        }
      }

    } else {
      // DOCX / TXT
      const text = await extractFileText(req.file);
      if (!text || text.length < 50) {
        try { fs.unlinkSync(filePath); } catch {}
        return res.json({ reply: "I couldn't extract text from that file. Please upload as **PDF**, **DOCX**, or paste your resume text directly into the chat." });
      }
      output = await callAI(
        SYSTEM_PROMPT + "\n\n" + MODE_ADDENDUM.RESUME,
        [{ role: "user", content: buildPrompt(text) }],
        1400
      );
    }

    if (req.user) {
      const sid = `upload-${Date.now()}`;
      await logChat({ userId: req.user.id, sessionId: sid, role: "user", message: `[FILE: ${req.file.originalname}]${userNote ? " — " + userNote : ""}`, mode: "RESUME" });
      await logChat({ userId: req.user.id, sessionId: sid, role: "assistant", message: output, mode: "RESUME" });
    }

    try { fs.unlinkSync(filePath); } catch {}
    res.json({ reply: output });

  } catch (err) {
    console.error("Upload error:", err.message, err.stack);
    try { fs.unlinkSync(filePath); } catch {}
    // Always return 200 with reply key so frontend displays it properly
    res.json({
      reply: `I couldn't process that file right now.\n\n**Please try:**\n- Uploading as **DOCX** or **TXT**\n- Taking a **screenshot** of your resume and uploading that\n- **Pasting your resume text** directly into the chat\n\n*(Error: ${err.message})*`
    });
  }
});

/* ── POST /api/subscription/create-order ── */
app.post("/api/subscription/create-order", requireAuth, async (req, res) => {
  const { plan } = req.body;
  const planConfig = PLAN_CONFIG[plan];
  if (!planConfig) {
    return res.status(400).json({
      error: `Unknown plan: "${plan}". Check PLAN_CONFIG in server.js.`
    });
  }

  // Guard: Razorpay not initialised — env vars missing on server
  if (!razorpay) {
    return res.status(503).json({
      error: "Payment service unavailable.",
      details: "RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set in server environment variables."
    });
  }

  // Use server-side amount from PLAN_CONFIG — never trust client-sent amount
  const finalAmount   = planConfig.amount;
  const finalCurrency = planConfig.currency || "INR";

  try {
    const order = await razorpay.orders.create({
      amount:   finalAmount,
      currency: finalCurrency,
      // Razorpay receipt max 40 chars — keep it short
      receipt:  `ng-${req.user.id.slice(0,8)}-${Date.now().toString().slice(-8)}`,
      notes:    { user_id: req.user.id, user_email: req.user.email, plan },
    });
    res.json({ order });
  } catch (err) {
    // Log full error so it appears in Render logs
    console.error("Razorpay order error:", JSON.stringify(err?.error || err?.message || err));
    res.status(500).json({
      error:   "Failed to create payment order.",
      details: err?.error?.description || err?.error?.reason || err.message,
    });
  }
});

/* ── POST /api/subscription/verify ── */
app.post("/api/subscription/verify", requireAuth, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body).digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ success: false, error: "Payment signature mismatch." });
  }

  const planConfig = PLAN_CONFIG[plan];
  const now = new Date();
  const subscriptionEnd = new Date(now.getTime() + planConfig.durationDays * 24 * 60 * 60 * 1000);

  // Write the profilePlan value (e.g. "monthly", "yearly", "hx_ind_pro")
  // not the full plan key (e.g. "individual_premium_monthly")
  const profilePlanValue = planConfig.profilePlan || plan;

  const { error } = await supabase.from("profiles").update({
    plan: profilePlanValue,
    subscription_id: razorpay_payment_id,
    subscription_start: now.toISOString(),
    subscription_end: subscriptionEnd.toISOString(),
    questions_used: 0,
  }).eq("id", req.user.id);

  if (error) {
    console.error("Profile update error:", error);
    return res.status(500).json({ success: false, error: "Failed to activate subscription." });
  }

  await supabase.from("subscription_logs").insert({
    user_id: req.user.id, plan,
    razorpay_order_id, razorpay_payment_id,
    amount: planConfig.amount, currency: planConfig.currency, status: "active",
  });

  console.log(`✅ Subscription: ${req.user.email} → ${plan}`);
  res.json({ success: true, plan, subscription_end: subscriptionEnd.toISOString() });
});

/* ── GET /api/profile ── */
app.get("/api/profile", requireAuth, async (req, res) => {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", req.user.id).single();
  if (error) return res.status(404).json({ error: "Profile not found" });
  res.json({ profile: data });
});

/* ── GET /api/chat-history ── */
app.get("/api/chat-history", requireAuth, async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const { data, error } = await supabase.from("chat_logs").select("*")
    .eq("user_id", req.user.id).order("created_at", { ascending: false }).limit(limit);
  if (error) return res.status(500).json({ error: "Failed to fetch chat history" });
  res.json({ logs: data });
});

/* ── GET /download/:file ── */
app.get("/download/:file", (req, res) => {
  const safeFileName = path.basename(req.params.file);
  const filePath = path.join(__dirname, safeFileName);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File not found" });
  res.download(filePath);
});

/* POST /api/jobs/search — called internally by /api/chat when job intent detected */
async function fetchLiveJobs(query, location, remote) {
  const results = [];
  const q = query || "developer";
  const loc = (location || "").toLowerCase();

  /* ── Source 1: JSearch via RapidAPI (500 free/month, best India coverage) ── */
  if (process.env.JSEARCH_API_KEY) {
    try {
      const searchQ = q + (loc ? " in " + location : " in India");
      const url = "https://jsearch.p.rapidapi.com/search?query=" + encodeURIComponent(searchQ) +
        "&num_pages=1&page=1&date_posted=month";
      const r = await fetch(url, {
        headers: {
          "x-rapidapi-key": process.env.JSEARCH_API_KEY,
          "x-rapidapi-host": "jsearch.p.rapidapi.com",
        },
        signal: AbortSignal.timeout(8000),
      });
      const d = await r.json();
      (d.data || []).slice(0, 8).forEach(j => results.push({
        id: "js-" + j.job_id,
        title: j.job_title,
        company: j.employer_name,
        location: j.job_city ? j.job_city + ", " + j.job_country : (j.job_country || "India"),
        url: j.job_apply_link || j.job_google_link,
        salary: j.job_min_salary
          ? "₹" + Math.round(j.job_min_salary / 100000) + "–" + Math.round(j.job_max_salary / 100000) + "L/yr"
          : null,
        tags: [j.job_employment_type, j.job_required_experience].filter(Boolean).slice(0, 3),
        source: "JSearch",
        remote: j.job_is_remote || false,
      }));
      console.log("JSearch:", results.length, "results");
    } catch (e) { console.warn("JSearch:", e.message); }
  }

  /* ── Source 2: Remotive (remote jobs, worldwide, no key needed) ── */
  if (results.length < 5) {
    try {
      const url = "https://remotive.com/api/remote-jobs?limit=8" +
        (q ? "&search=" + encodeURIComponent(q) : "");
      const r = await fetch(url, { signal: AbortSignal.timeout(7000) });
      const d = await r.json();
      (d.jobs || []).forEach(j => results.push({
        id: "rem-" + j.id,
        title: j.title,
        company: j.company_name,
        location: j.candidate_required_location || "Remote (Worldwide)",
        url: j.url,
        salary: j.salary || null,
        tags: (j.tags || []).slice(0, 4),
        source: "Remotive",
        remote: true,
      }));
    } catch (e) { console.warn("Remotive:", e.message); }
  }

  /* ── Source 3: Arbeitnow (no key, broad search) ── */
  if (results.length < 5) {
    try {
      const r = await fetch("https://www.arbeitnow.com/api/job-board-api", {
        signal: AbortSignal.timeout(7000),
      });
      const d = await r.json();
      (d.data || [])
        .filter(j => {
          const mQ = !q || j.title.toLowerCase().includes(q.toLowerCase()) ||
            (j.description || "").toLowerCase().includes(q.toLowerCase());
          return mQ && (remote !== true || j.remote);
        })
        .slice(0, 6)
        .forEach(j => results.push({
          id: "arb-" + j.slug,
          title: j.title,
          company: j.company_name,
          location: j.location || (j.remote ? "Remote" : "Global"),
          url: j.url,
          salary: null,
          tags: (j.tags || []).slice(0, 4),
          source: "Arbeitnow",
          remote: j.remote,
        }));
    } catch (e) { console.warn("Arbeitnow:", e.message); }
  }

  /* ── Source 4: Adzuna India (250/day free, add ADZUNA keys in Render env) ── */
  if (process.env.ADZUNA_APP_ID && process.env.ADZUNA_API_KEY) {
    try {
      const url = "https://api.adzuna.com/v1/api/jobs/in/search/1" +
        "?app_id=" + process.env.ADZUNA_APP_ID +
        "&app_key=" + process.env.ADZUNA_API_KEY +
        "&results_per_page=8" +
        "&what=" + encodeURIComponent(q) +
        (loc ? "&where=" + encodeURIComponent(location) : "");
      const r = await fetch(url, { signal: AbortSignal.timeout(7000) });
      const d = await r.json();
      (d.results || []).forEach(j => results.push({
        id: "adz-" + j.id,
        title: j.title,
        company: j.company?.display_name || "Company",
        location: j.location?.display_name || location || "India",
        url: j.redirect_url,
        salary: j.salary_min
          ? "₹" + Math.round(j.salary_min / 100000) + "–" + Math.round(j.salary_max / 100000) + "L/yr"
          : null,
        tags: j.category ? [j.category.label] : [],
        source: "Adzuna",
        remote: false,
      }));
    } catch (e) { console.warn("Adzuna:", e.message); }
  }

  // Deduplicate by title+company
  const seen = new Set();
  return results.filter(j => {
    const key = (j.title + j.company).toLowerCase().replace(/\s/g, "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 10);
}


/* Detect job search intent from a user message */
function detectJobIntent(message) {
  const m = message.toLowerCase();
  const triggers = [
    "find job", "search job", "find me job", "job for me", "job openings",
    "job listing", "show job", "any job", "find opening", "job vacancies",
    "job in ", "jobs in ", "hiring", "find work", "job search",
    "look for job", "job near", "find position", "open position",
  ];
  return triggers.some(t => m.includes(t));
}

/* Extract search params from natural language */
function extractJobParams(message) {
  const m = message.toLowerCase();
  // Extract location — look for "in <city>" pattern
  const locMatch = message.match(/\bin\s+([A-Za-z\s]+?)(?:\s+jobs?|\s+role|\s+position|$|\?)/i);
  const location = locMatch ? locMatch[1].trim() : "";
  // Extract role — everything before "job" or "jobs" or "in"
  const roleMatch = message.match(/(?:find|search|show|get|look for)?\s*(?:me\s+)?([a-zA-Z\s]+?)\s+(?:job|jobs|role|position|opening|work)/i);
  const query = roleMatch ? roleMatch[1].replace(/\b(find|search|show|get|any|some|me|a|an|the)\b/gi, "").trim() : "";
  const remote = m.includes("remote");
  return { query: query || "", location, remote };
}

/* ═══════════════════════════════════════════════════════════
   FEATURE: RESUME VAULT
   ═══════════════════════════════════════════════════════════ */

/* GET /api/resumes — list all saved resumes for user */
app.get("/api/resumes", requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from("resumes")
    .select("id, title, target_role, target_company, word_count, created_at, updated_at")
    .eq("user_id", req.user.id)
    .order("updated_at", { ascending: false });
  if (error) { console.error("Resumes fetch error:", JSON.stringify(error)); return res.status(500).json({ error: "Failed to fetch resumes", detail: error.message }); }
  res.json({ resumes: data || [] });
});

/* GET /api/resumes/:id — get single resume with full content */
app.get("/api/resumes/:id", requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("id", req.params.id)
    .eq("user_id", req.user.id)
    .single();
  if (error || !data) return res.status(404).json({ error: "Resume not found" });
  res.json({ resume: data });
});

/* POST /api/resumes — save a new resume (Pro only) */
app.post("/api/resumes", requireAuth, checkUsage, async (req, res) => {
  if (req.profile?.plan === "free") {
    return res.status(403).json({ error: "pro_required", message: "Resume saving is a Pro feature. Upgrade to keep your resumes forever." });
  }
  const { title, content_md, target_role, target_company } = req.body;
  if (!content_md || content_md.length < 50) return res.status(400).json({ error: "Invalid resume content" });

  const word_count = content_md.trim().split(/\s+/).filter(Boolean).length;
  const { data, error } = await supabase.from("resumes").insert({
    user_id: req.user.id,
    title: (title || "My Resume").slice(0, 100),
    content_md,
    target_role: (target_role || "").slice(0, 100),
    target_company: (target_company || "").slice(0, 100),
    word_count,
  }).select().single();

  if (error) { console.error("Resume insert error:", JSON.stringify(error)); return res.status(500).json({ error: "Failed to save resume", detail: error.message, code: error.code }); }
  res.json({ resume: data });
});

/* PATCH /api/resumes/:id — rename / update resume */
app.patch("/api/resumes/:id", requireAuth, async (req, res) => {
  const { title, target_role, target_company, content_md } = req.body;
  const updates = {};
  if (title)          updates.title = title.slice(0, 100);
  if (target_role)    updates.target_role = target_role.slice(0, 100);
  if (target_company) updates.target_company = target_company.slice(0, 100);
  if (content_md)     updates.content_md = content_md;

  const { data, error } = await supabase.from("resumes")
    .update(updates)
    .eq("id", req.params.id)
    .eq("user_id", req.user.id)
    .select().single();
  if (error || !data) return res.status(404).json({ error: "Resume not found or update failed" });
  res.json({ resume: data });
});

/* DELETE /api/resumes/:id */
app.delete("/api/resumes/:id", requireAuth, async (req, res) => {
  const { error } = await supabase.from("resumes")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.user.id);
  if (error) return res.status(500).json({ error: "Delete failed" });
  res.json({ success: true });
});

/* ═══════════════════════════════════════════════════════════
   FEATURE: JOB APPLICATION TRACKER
   ═══════════════════════════════════════════════════════════ */

/* GET /api/jobs — list all applications */
app.get("/api/jobs", requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from("job_applications")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });
  if (error) { console.error("Jobs fetch error:", JSON.stringify(error)); return res.status(500).json({ error: "Failed to fetch job applications", detail: error.message }); }
  res.json({ jobs: data || [] });
});

/* POST /api/jobs — add job application (with optional URL auto-parse) */
app.post("/api/jobs", requireAuth, async (req, res) => {
  const { company, role, url, status = "applied", notes, applied_date } = req.body;

  // Auto-extract company from URL if company not provided
  let resolvedCompany = company;
  let resolvedRole    = role;
  if (url && (!company || !role)) {
    try {
      const hostname = new URL(url).hostname.replace(/^www\./, "");
      const domainParts = hostname.split(".");
      const brand = domainParts[0];
      if (!resolvedCompany) resolvedCompany = brand.charAt(0).toUpperCase() + brand.slice(1);
      if (!resolvedRole)    resolvedRole    = "Role at " + resolvedCompany;
    } catch {}
  }

  if (!resolvedCompany || !resolvedRole) {
    return res.status(400).json({ error: "company and role are required" });
  }

  const { data, error } = await supabase.from("job_applications").insert({
    user_id:      req.user.id,
    company:      resolvedCompany.slice(0, 120),
    role:         resolvedRole.slice(0, 120),
    url:          url || null,
    status,
    notes:        (notes || "").slice(0, 1000),
    applied_date: applied_date || new Date().toISOString().split("T")[0],
  }).select().single();

  if (error) { console.error("Job insert error:", JSON.stringify(error)); return res.status(500).json({ error: "Failed to add job application", detail: error.message, code: error.code }); }
  res.json({ job: data });
});

/* PATCH /api/jobs/:id — update status or notes */
app.patch("/api/jobs/:id", requireAuth, async (req, res) => {
  const { status, notes, company, role, url, applied_date } = req.body;
  const updates = {};
  if (status)       updates.status       = status;
  if (notes  !== undefined) updates.notes = (notes || "").slice(0, 1000);
  if (company)      updates.company      = company.slice(0, 120);
  if (role)         updates.role         = role.slice(0, 120);
  if (url)          updates.url          = url;
  if (applied_date) updates.applied_date = applied_date;

  const { data, error } = await supabase.from("job_applications")
    .update(updates)
    .eq("id", req.params.id)
    .eq("user_id", req.user.id)
    .select().single();
  if (error || !data) return res.status(404).json({ error: "Job not found" });
  res.json({ job: data });
});

/* DELETE /api/jobs/:id */
app.delete("/api/jobs/:id", requireAuth, async (req, res) => {
  const { error } = await supabase.from("job_applications")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.user.id);
  if (error) return res.status(500).json({ error: "Delete failed" });
  res.json({ success: true });
});

/* ═══════════════════════════════════════════════════════════
   FEATURE: EMAIL NUDGES (via Resend, free 3k/month)
   Call this endpoint from a cron job (cron-job.org, free)
   URL: POST /api/nudge/send   Header: x-cron-secret: <CRON_SECRET>
   ═══════════════════════════════════════════════════════════ */

const NUDGE_TIPS = [
  { subject: "Quick tip: Make your resume verbs count 💪", body: "Start every bullet point with a strong action verb — Built, Led, Reduced, Increased, Deployed. Recruiters scan in 6 seconds. Strong verbs make you memorable." },
  { subject: "Are you LinkedIn-ready? 🔗", body: "Your LinkedIn headline shouldn't just be your job title. Try: [Role] | [Skill 1] & [Skill 2] | [What you're targeting]. E.g. 'Software Engineer | React & Node.js | Open to Product Roles'." },
  { subject: "The STAR method wins interviews ⭐", body: "For every interview answer: Situation → Task → Action → Result. Don't just say what you did — quantify it. 'Reduced load time by 40%' beats 'improved performance'." },
  { subject: "Your ATS score could be killing applications 📄", body: "Most companies use ATS software that scans for keywords. Mirror the exact words from the job description in your resume. GEN-E's ATS builder does this automatically." },
  { subject: "Salary negotiation tip most people miss 💰", body: "Never give the first number. When asked about salary, say: 'I'd like to understand the full scope of the role first — can you share the range you have budgeted?' This keeps you in control." },
  { subject: "Network before you need it 🤝", body: "Connect with 3 people this week who work at companies you're interested in. Don't ask for a job — ask for a 15-min call to learn about their role. Most people say yes." },
  { subject: "The 2-minute cover letter formula ✉️", body: "Para 1: Why this company specifically (not generic). Para 2: Your single biggest relevant achievement. Para 3: What you'd bring to this exact role. Keep it under 200 words." },
  { subject: "Upskilling hack: learn in public 📢", body: "Instead of just taking a course, document what you're learning on LinkedIn. Post one insight per week. This builds a portfolio of thinking that impresses recruiters far more than a certificate." },
];

async function sendNudgeEmail(toEmail, firstName, tip) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set — nudge email skipped");
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "GEN-E Career AI <nudge@gene.ai>",
        to:   [toEmail],
        subject: tip.subject,
        html: `
          <div style="font-family:'DM Sans',sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
            <div style="margin-bottom:24px;">
              <span style="font-weight:800;font-size:18px;color:#e8185d;letter-spacing:-0.03em;">GEN-E</span>
              <span style="font-size:12px;color:#aaa;margin-left:8px;">Career Intelligence</span>
            </div>
            <p style="font-size:15px;color:#333;margin-bottom:8px;">Hey ${firstName || "there"} 👋</p>
            <div style="background:#fff5f8;border-left:3px solid #e8185d;padding:16px 20px;border-radius:0 8px 8px 0;margin:16px 0;">
              <p style="font-size:14px;color:#333;line-height:1.7;margin:0;">${tip.body}</p>
            </div>
            <p style="font-size:13px;color:#888;margin-top:20px;">Keep building — your career is a long game.</p>
            <a href="https://hugens.in.net/gen-e" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#e8185d;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px;">
              Open GEN-E →
            </a>
            <hr style="margin:28px 0;border:none;border-top:1px solid #f0f0f0;">
            <p style="font-size:11px;color:#ccc;">You're receiving this because you signed up for GEN-E.
              <a href="https://hugens.in.net/gen-e" style="color:#ccc;">Unsubscribe</a></p>
          </div>
        `,
      }),
      signal: AbortSignal.timeout(10000),
    });
    return res.ok;
  } catch (e) {
    console.warn("Nudge email error:", e.message);
    return false;
  }
}

app.post("/api/nudge/send", async (req, res) => {
  // Verify cron secret
  const secret = req.headers["x-cron-secret"];
  if (!secret || secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

    // Find users who haven't been active in 7+ days and haven't been nudged in 7 days
    const { data: users, error } = await supabase
      .from("profiles")
      .select("id, full_name, plan, target_role")
      .eq("nudge_opt_out", false)
      .or(`last_active.lt.${cutoff},last_active.is.null`)
      .limit(50);

    if (error || !users?.length) {
      return res.json({ sent: 0, message: "No users to nudge" });
    }

    // Filter out users nudged recently
    const { data: recentNudges } = await supabase
      .from("nudge_log")
      .select("user_id")
      .in("user_id", users.map(u => u.id))
      .gte("sent_at", twoDaysAgo);

    const recentlyNudged = new Set((recentNudges || []).map(n => n.user_id));
    const toNudge = users.filter(u => !recentlyNudged.has(u.id));

    let sent = 0;
    for (const user of toNudge) {
      // Get email from auth.users (service key can access this)
      const { data: authUser } = await supabase.auth.admin.getUserById(user.id);
      const email = authUser?.user?.email;
      if (!email) continue;

      const tip = NUDGE_TIPS[Math.floor(Math.random() * NUDGE_TIPS.length)];
      const firstName = (user.full_name || "").split(" ")[0];
      const ok = await sendNudgeEmail(email, firstName, tip);

      if (ok) {
        await supabase.from("nudge_log").insert({ user_id: user.id, nudge_type: "weekly" });
        sent++;
      }
    }

    console.log(`✅ Nudge: sent ${sent} emails`);
    res.json({ sent, total_eligible: toNudge.length });
  } catch (err) {
    console.error("Nudge error:", err.message);
    res.status(500).json({ error: err.message });
  }
});


/* ── POST /api/mini-chat ── GEN-E Mini for all platforms ── */
app.post("/api/mini-chat", requireAuth, async (req, res) => {
  const { message, history = [], product, userType, goal, businessNeed } = req.body;
  if (!message) return res.status(400).json({ error: "Message required" });

  const PRODUCT_IDENTITY = {
    nugens: {
      name:  "Nugens AI",
      role:  "You are the Nugens AI assistant — the central assistant for the entire Nugens platform.",
      scope: `You help users navigate and get the most from all four Nugens products:\n- Gen-E AI: AI career intelligence, resume analysis, job matching, skill gap analysis, interview prep, career roadmaps, salary benchmarking\n- HyperX: Professional learning platform — workplace skills courses, certifications, business training programmes\n- DigiHub: Digital marketing suite — content planning, AI image generation, brand growth, job board, community, analytics\n- Units: Creative production studio — wedding/event cinematography, brand content, entrepreneur guidance, idea validation, booking services\nAlso help with: account setup, plan selection, switching between products, general career/business questions.`,
    },
    gene: {
      name:  "Gen-E Mini",
      role:  "You are Gen-E Mini, the AI career assistant embedded inside Gen-E AI.",
      scope: `You specialise EXCLUSIVELY in:\n- Resume writing, optimisation, ATS analysis, tailoring for specific roles\n- Career roadmap planning, skill gap identification, upskilling pathways\n- Job search strategies, job description analysis, application tips\n- Interview preparation, common questions, STAR method coaching\n- Salary benchmarking and negotiation tactics\n- Career transitions — identifying transferable skills, rebranding professionally\n- Workplace promotion strategies, performance review prep\n- LinkedIn and personal brand building through Gen-E and DigiHub\nMention HyperX courses or DigiHub tools ONLY when directly relevant to the career topic asked.`,
    },
    hyperx: {
      name:  "HyperX AI",
      role:  "You are the HyperX AI assistant embedded inside HyperX, the professional learning platform.",
      scope: `You specialise EXCLUSIVELY in:\n- Recommending the right HyperX courses for a user's career stage and goals\n- Explaining course content, learning paths, and difficulty levels\n- Certification guidance — which certs are available, how to earn them, their career value\n- Study strategies, learning schedules, completing courses efficiently\n- Skill development for workplace advancement, promotions, salary growth\n- Unlocking business/team training features for Business account holders\n- Upgrade paths: Free → Starter → Premium → Pro → Yearly plans\nMention Gen-E for career planning or DigiHub for marketing skills ONLY when directly relevant.`,
    },
    digihub: {
      name:  "DigiHub AI",
      role:  "You are the DigiHub AI assistant embedded inside DigiHub, the digital marketing platform.",
      scope: `You specialise EXCLUSIVELY in:\n- Content strategy: what to post, when, how often, on which platforms\n- AI content planning — using DigiHub's Content Planner and Scheduler features\n- AI image generation prompts and tips using DigiHub's Image Generator\n- Personal brand building for individuals (freelancers, job seekers, creators)\n- Business brand growth for SMEs — social media strategy, organic reach, engagement\n- Community networking, talent discovery, and the DigiHub Job Board\n- Analytics interpretation — what metrics matter, how to improve them\n- Campaign ideation, caption writing, hashtag strategy\nMention HyperX for skill courses or Units for production services when directly relevant.`,
    },
    units: {
      name:  "Units AI",
      role:  "You are the Units AI assistant embedded inside Units, the creative production platform.",
      scope: `You specialise EXCLUSIVELY in:\n- Units production services: wedding cinematography, event photography, brand content videos\n- Booking consultations, understanding packages, turnaround times, pricing\n- Entrepreneur guidance — starting a business, brand identity, content strategy for founders\n- Idea validation frameworks — testing business ideas before committing capital\n- Live experience events and what to expect when attending/booking\n- Content creation for new businesses — what assets to prioritise\n- AI guidance tools inside Units for business planning\nMention DigiHub for ongoing marketing or HyperX for business skill courses when directly relevant.`,
    },
  };

  const pid   = PRODUCT_IDENTITY[product] || PRODUCT_IDENTITY.nugens;
  const uType = userType === "business" ? "Business" : "Individual";

  const individualCtx = {
    get_promoted:  "User wants a workplace promotion — focus on skill gaps, course recs, promotion strategy.",
    switch_career: "User is changing careers — focus on transferable skills, rebranding, relevant courses.",
    learn_skills:  "User wants to learn new skills — suggest specific HyperX learning paths.",
    get_first_job: "User is entering the workforce — focus on CV, interview prep, entry-level strategy.",
    grow_income:   "User wants higher income — focus on upskilling, salary negotiation, freelancing.",
    build_brand:   "User wants personal brand growth — focus on DigiHub tools, LinkedIn, content strategy.",
  };
  const businessCtx = {
    train_team:         "Business wants to train employees — focus on HyperX team plans and course bundles.",
    hire_talent:        "Business is hiring — focus on DigiHub talent network and Gen-E hiring tools.",
    digital_marketing:  "Business needs marketing — focus on DigiHub strategy, content planning, brand growth.",
    content_production: "Business needs content — focus on Units production services and brand content packages.",
  };

  const ctxLine = userType === "business"
    ? (businessCtx[businessNeed] || "Business user — focus on team growth, brand, and operational efficiency.")
    : (individualCtx[goal]       || "Individual user — focus on personal career and professional development.");

  const offTopicReply = `I'm ${pid.name} — I only help with ${product === "nugens" ? "Nugens products and career/business topics" : `${pid.name.replace(" AI","").replace(" Mini","")} and career topics`}. What can I help you with today?`;

  const systemPrompt = [
    pid.role,
    "",
    "YOUR SCOPE:",
    pid.scope,
    "",
    "USER CONTEXT:",
    `- Account type: ${uType}`,
    `- ${ctxLine}`,
    "",
    "STRICT OFF-TOPIC RULE:",
    "If asked about cooking, sports, politics, entertainment, relationships, or anything unrelated to careers, business, professional skills, or Nugens products, respond EXACTLY:",
    `"${offTopicReply}"`,
    "",
    "RESPONSE STYLE:",
    "- Be direct, specific, and practical — max 4-5 sentences unless listing actionable steps",
    userType === "business"
      ? "- Use business language: ROI, team, scale, efficiency, growth"
      : "- Use personal career language: skills, opportunities, your career, your goals",
    "- Always give a concrete next step the user can take right now",
    "- If recommending a product feature, name it specifically",
  ].join("\n");

  try {
    const messages = [
      ...history.slice(-8).map(m => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      max_tokens: 420,
      temperature: 0.65,
    });

    const reply = response.choices[0]?.message?.content || "Sorry, I couldn't get a response.";
    res.json({ reply });
  } catch (err) {
    console.error("[Mini chat] error:", err.message);
    try {
      const fallback = await callGroq(systemPrompt, [{ role:"user", content:message }], 420);
      res.json({ reply: fallback });
    } catch(e2) {
      res.status(500).json({ error: "Something went wrong. Please try again." });
    }
  }
});

app.get("/health", (req, res) =>
  res.json({ status: "ok", version: "GEN-E V6 \u2014 Streaming + Jobs + Multi-AI" })
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Gen-E V4 running on port ${PORT}`));
/* ═══════════════════════════════════════════════════════════
   GEN-E TOOL ENDPOINTS — Individual + Business
   ═══════════════════════════════════════════════════════════ */

/* POST /api/gene/tool — unified tool endpoint */
app.post("/api/gene/tool", requireAuth, checkUsage, async (req, res) => {
  const { tool, inputs, userType, profile: userProfile } = req.body;

  const TOOL_PROMPTS = {
    // ─── INDIVIDUAL TOOLS ───
    skill_gap: (i) => `You are Gen-E Skill Gap Analyzer. The user's current role is "${i.currentRole}" and target role is "${i.targetRole}". Their current skills: ${i.currentSkills}. 
Provide:
## SKILL GAP ANALYSIS
## CRITICAL MISSING SKILLS (top 5, each with priority level)
## RECOMMENDED LEARNING PATH (step by step, with timeline)
## HYPERX COURSES TO TAKE (suggest based on skill gaps)
## 90-DAY ACTION PLAN
Be specific, actionable, structured.`,

    career_simulate: (i) => `You are Gen-E Career Simulator. Simulate the career transition from "${i.fromRole}" to "${i.toRole}".
Provide:
## TRANSITION FEASIBILITY SCORE (X/10 with reasoning)
## SKILLS YOU ALREADY HAVE (transferable)
## SKILLS YOU NEED TO ACQUIRE
## SALARY IMPACT (current estimate vs target)
## REALISTIC TIMELINE
## STEP-BY-STEP TRANSITION ROADMAP
## RISKS & HOW TO MITIGATE
## VERDICT
Make it feel like a real simulation with data.`,

    career_roadmap: (i) => `You are Gen-E Career Advisor. Create a detailed career roadmap for: Goal: "${i.goal}", Current situation: "${i.current}", Timeline: "${i.timeline || '12 months'}".
Provide:
## YOUR CAREER ROADMAP
## PHASE 1: FOUNDATION (Month 1-3)
## PHASE 2: SKILL BUILD (Month 4-6)  
## PHASE 3: LAUNCH (Month 7-9)
## PHASE 4: GROWTH (Month 10-12)
## KEY MILESTONES
## RECOMMENDED RESOURCES
## SUCCESS METRICS`,

    job_match: (i) => `You are Gen-E Job Match AI. Based on: Skills: "${i.skills}", Experience: "${i.experience}", Target: "${i.target}".
Provide:
## TOP MATCHING JOB ROLES (5 roles with match %)
## BEST FIT COMPANIES (types and names)
## YOUR COMPETITIVE ADVANTAGES
## PROFILE GAPS TO FIX
## RESUME KEYWORDS TO ADD
## APPLICATION STRATEGY`,

    // ─── BUSINESS TOOLS ───
    jd_generator: (i) => `You are Gen-E JD Generator for businesses. Generate a complete job description for: Role: "${i.role}", Company type: "${i.companyType || 'tech startup'}", Experience: "${i.experience || '2-4 years'}".
Provide:
## JOB TITLE
## ABOUT THE ROLE (2 paragraphs)
## KEY RESPONSIBILITIES (8-10 bullet points)
## REQUIRED SKILLS & QUALIFICATIONS
## NICE TO HAVE
## WHAT WE OFFER
## SALARY RANGE (Indian market)
Also provide:
## TOP 10 INTERVIEW QUESTIONS
## EVALUATION CRITERIA`,

    hiring_intelligence: (i) => `You are Gen-E Hiring Intelligence AI. The company wants to hire: "${i.role}". Industry: "${i.industry || 'technology'}".
Provide:
## HIRING STRATEGY REPORT
## REQUIRED CORE SKILLS (with proficiency levels)
## EXPERIENCE & BACKGROUND PROFILE
## RED FLAGS TO WATCH
## SALARY RANGE (India, by experience tier: 0-2yr, 2-5yr, 5+ yr)
## WHERE TO FIND THIS TALENT
## INTERVIEW PROCESS RECOMMENDATION
## ONBOARDING CHECKLIST`,

    team_skill_map: (i) => `You are Gen-E Workforce Intelligence AI. Analyze this team data: ${i.teamData}. Company goal: "${i.goal || 'scale the product'}".
Provide:
## TEAM SKILL ASSESSMENT
## SKILL STRENGTHS (what the team does well)
## CRITICAL SKILL GAPS
## RISK AREAS (gaps that could hurt growth)
## RECOMMENDED TRAINING PLAN (per role/person)
## HYPERX COURSES TO ASSIGN
## HIRING RECOMMENDATIONS (roles to fill)
## 6-MONTH WORKFORCE ROADMAP`,

    salary_benchmark: (i) => `You are Gen-E Salary Intelligence AI. Provide salary benchmarking for: Role: "${i.role}", Location: "${i.location || 'India'}", Industry: "${i.industry || 'technology'}".
Provide:
## SALARY BENCHMARK REPORT
## FRESHER (0-1 yr): Range + median
## JUNIOR (1-3 yr): Range + median  
## MID-LEVEL (3-6 yr): Range + median
## SENIOR (6-10 yr): Range + median
## LEAD/MANAGER (10+ yr): Range + median
## TOP COMPANIES PAYING ABOVE MARKET
## FACTORS THAT INCREASE SALARY
## NEGOTIATION TIPS
## EQUITY/BENEFITS TO CONSIDER
Data based on 2024-2025 Indian job market.`,

    interview_questions: (i) => `You are Gen-E Interview AI. Generate interview questions for: Role: "${i.role}", Level: "${i.level || 'mid-level'}".
Provide:
## SCREENING QUESTIONS (5 - for HR round)
## TECHNICAL QUESTIONS (8 - role-specific)
## BEHAVIORAL QUESTIONS (5 - STAR method)
## CULTURE FIT QUESTIONS (3)
## CASE STUDY / SCENARIO (1 detailed case)
## EVALUATION RUBRIC (what good answers look like)`,

    workforce_planning: (i) => `You are Gen-E Workforce Planner. Company: "${i.companyStage || 'early-stage startup'}", Current team: "${i.currentTeam}", Goal: "${i.goal}".
Provide:
## WORKFORCE PLANNING REPORT
## CURRENT STATE ANALYSIS
## HIRING PRIORITY MATRIX (immediate/3mo/6mo/1yr)
## RECOMMENDED ROLES TO HIRE (with rationale)
## BUILD VS BUY ANALYSIS (hire vs train vs outsource)
## BUDGET ESTIMATE (Indian market rates)
## ORGANIZATIONAL STRUCTURE RECOMMENDATION
## 12-MONTH HIRING ROADMAP`,
  };

  const promptFn = TOOL_PROMPTS[tool];
  if (!promptFn) return res.status(400).json({ error: "Unknown tool: " + tool });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const send = (obj) => {
    try { res.write("data: " + JSON.stringify(obj) + "\n\n"); if (typeof res.flush === "function") res.flush(); } catch {}
  };

  try {
    const systemPrompt = promptFn(inputs);
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: "Generate the analysis now." }],
      max_tokens: 1200,
      temperature: 0.7,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || "";
      if (delta) send({ chunk: delta });
    }

    send({ done: true });
    res.end();
    if (req.user && req.profile?.plan === "free") incrementUsage(req.user.id);
  } catch (err) {
    console.error("Gene tool error:", err.message);
    send({ error: "Something went wrong." });
    res.end();
  }
});


// ============================================================
// ADD THESE ROUTES TO backend/server.js
// DigiHub - Image Generation + Community endpoints
// ============================================================

// ─── Imports to add at top of server.js ───
// (openai is already imported)

// ─── DigiHub: AI Image Generation ───────────────────────────
app.post('/api/digihub/generate-image', async (req, res) => {
  const { prompt, size: sizeStr, style } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt required' });

  // Parse size string to DALL-E format
  let size = '1024x1024';
  if (sizeStr?.includes('1792x1024') || sizeStr?.includes('16:9')) size = '1792x1024';
  if (sizeStr?.includes('1024x1792') || sizeStr?.includes('9:16')) size = '1024x1792';

  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: `${prompt}. Style: ${style || 'Digital Art'}. High quality, professional design.`,
      n: 1,
      size,
      quality: 'standard',
    });
    res.json({ url: response.data[0].url });
  } catch (err) {
    console.error('Image gen error:', err.message);
    res.status(500).json({ error: 'Image generation failed', details: err.message });
  }
});

// ─── DigiHub: AI Content Ideas ───────────────────────────────
app.post('/api/digihub/content-ideas', async (req, res) => {
  const { platform, tone, industry, topic, count = 5 } = req.body;
  if (!topic) return res.status(400).json({ error: 'Topic required' });

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'system',
        content: 'You are a social media content strategist specializing in Indian markets. Generate practical, engaging content ideas. Return JSON only.'
      }, {
        role: 'user',
        content: [
          'Generate',
          count,
          'content ideas for',
          platform,
          'for a',
          industry,
          'brand.',
          'Tone:',
          tone,
          '.',
          'Theme:',
          topic,
          '.',
          'Return JSON array: [{"type":"string","caption":"string","hashtags":"string","tip":"string"}]'
        ].join(' ')
      }],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    res.json(parsed.ideas || parsed);
  } catch (err) {
    console.error('Content ideas error:', err.message);
    res.status(500).json({ error: 'Content generation failed' });
  }
});

// ─── DigiHub: Prompt Enhancement ─────────────────────────────
app.post('/api/digihub/enhance-prompt', async (req, res) => {
  const { prompt, style, purpose } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt required' });

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'system',
        content: 'You are an expert AI image prompt engineer. Enhance prompts to be highly detailed and effective for DALL-E 3 or Midjourney. Return ONLY the enhanced prompt, no explanations.'
      }, {
        role: 'user',
        content: [
          'Enhance this prompt for AI image generation.',
          'Style:',
          style || 'Digital Art',
          '.',
          'Purpose:',
          purpose || 'Social Media',
          '.',
          'Original prompt:',
          prompt
        ].join(' ')
      }],
      temperature: 0.7,
    });

    res.json({ enhanced: completion.choices[0].message.content.trim() });
  } catch (err) {
    console.error('Prompt enhance error:', err.message);
    res.status(500).json({ error: 'Enhancement failed' });
  }
});