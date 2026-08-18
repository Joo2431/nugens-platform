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

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });
const app = express();
const allowedOrigins = [
  "https://gene.nugens.in",
  "https://www.gene.nugens.in",
  "https://nugens.in",
  "https://www.nugens.in",
  "https://hyperx.nugens.in",
  "https://digihub.nugens.in",
  "https://units.nugens.in",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
];
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith(".nugens.in")) {
      return callback(null, true);
    }
   callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: false,
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());
// Add this line (place it after app.use(express.json()))




/* ── ENV VALIDATION ── */
/* ── ENV CHECK — warn but never crash the server ── */
["OPENAI_API_KEY","SUPABASE_URL","SUPABASE_SERVICE_KEY"].forEach(k => {
  if (!process.env[k]) console.error("❌ CRITICAL missing env:", k);
});
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET)
  console.warn("⚠️  Razorpay keys missing — payment routes will return 503");

/* ── CLIENTS ── */
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;
/* Groq — free forever, Llama 3.3 70B, ~2× faster than GPT-4o-mini for chat */
const groq = process.env.GROQ_API_KEY
  ? new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" })
  : null;
/* Gemini Flash — free 15 req/min, used for job tips */
const GEMINI_KEY = process.env.GEMINI_API_KEY || null;
let supabase = null;
try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  } else {
    console.warn("⚠️ Supabase env vars missing — auth and DB routes will be disabled.");
  }
} catch (err) {
  console.warn("⚠️ Supabase init failed:", err.message);
}
const razorpay = (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
  ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
  : null;

/* ── UPLOAD DIR — always ensure it exists (Render ephemeral FS) ── */
const uploadDir = path.join(__dirname, "uploads");
function ensureUploadDir() {
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
}


app.use('/uploads', express.static(uploadDir));
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

/* ── Railway does not need keep-alive (always-on) — removed ── */

/* ── AUTH MIDDLEWARE ── */
async function requireAuth(req, res, next) {
  if (!supabase) return res.status(503).json({ error: "Auth service unavailable" });
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: "Invalid or expired token" });
  req.user = user;
  next();
}

async function optionalAuth(req, res, next) {
  if (!supabase) { next(); return; }
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
  if (!supabase) { req.profile = { plan: "free", questions_used: 0 }; return next(); }
  const { data: profile, error } = await supabase
    .from("profiles").select("plan, questions_used").eq("id", req.user.id).single();

  if (error || !profile) {
    // Check if a profile row already exists (might have been a transient fetch error)
    const { data: existing } = await supabase
      .from("profiles").select("plan, questions_used").eq("id", req.user.id).single();

    // NEVER overwrite admin plan — if existing is admin, keep it
    if (existing?.plan === "admin") {
      req.profile = existing;
      return next();
    }

    // Only upsert if truly no profile row exists
    if (!existing) {
      await supabase.from("profiles").upsert({
        id: req.user.id, email: req.user.email,
        full_name: req.user.user_metadata?.full_name || "",
        plan: "free", questions_used: 0,
      });
    }
    req.profile = existing || { plan: "free", questions_used: 0 };
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
  if (!supabase) return;
  await supabase.rpc("increment_questions_used", { user_id: userId });
}

async function logChat({ userId, sessionId, role, message, mode }) {
  if (!userId || !supabase) return;
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
/* Server-side source of truth for Units booking prices — must mirror
   the SERVICES array in apps/units/src/pages/BookServices.jsx exactly.
   Never trust a client-sent amount for payments. */
const UNITS_SERVICE_CATALOG = {
  "video-editing": {
    title: "Video Editing & Post-Production",
    packages: { "Basic Edit": 8000, "Full Production": 18000, "Premium Post": 35000 },
  },
  "content-strategy": {
    title: "Content Strategy",
    packages: { "Strategy Session": 5000, "Monthly Strategy": 15000, "Brand Strategy Pack": 35000 },
  },
  "graphic-design": {
    title: "Graphic Design & Brand Identity",
    packages: { "Social Pack": 6000, "Brand Kit": 18000, "Full Identity": 45000 },
  },
  "website": {
    title: "Website Building",
    packages: { "Landing Page": 12000, "Business Site": 28000, "E-commerce": 65000 },
  },
  "marketing": {
    title: "Marketing Campaigns",
    packages: { "Campaign Setup": 10000, "Growth Package": 25000, "Full Marketing": 60000 },
  },
  "scripting": {
    title: "Content Creation & Scripting",
    packages: { "Script Pack": 4000, "Content Bundle": 12000, "Creative Direction": 30000 },
  },
};

const PLAN_CONFIG = {
  // ── Gen-E plans ───────────────────────────────────────────────────
  // FIXED: Gen-E Pro was priced far below the rest of the platform's
  // own paid-tier floor (₹99/mo doing MORE — unlimited AI, ATS resume,
  // roadmap, job tracker, interview prep — than HyperX Premium or
  // DigiHub's own ₹299/mo entry tiers do). Standardized to ₹299/mo,
  // matching what every other Nugens product already charges for its
  // entry paid tier. Yearly = 10x monthly ("2 months free").
  monthly:      { amount: 29900,   currency: "INR", label: "Gen-E Pro Monthly",  durationDays: 30,  profilePlan: "gene_monthly" },
  yearly:       { amount: 299000,  currency: "INR", label: "Gen-E Pro Yearly",   durationDays: 365, profilePlan: "gene_yearly"  },
  gene_monthly: { amount: 29900,   currency: "INR", label: "Gen-E Pro Monthly",  durationDays: 30,  profilePlan: "gene_monthly" },
  gene_yearly:  { amount: 299000,  currency: "INR", label: "Gen-E Pro Yearly",   durationDays: 365, profilePlan: "gene_yearly"  },

  // ── NuGens Suite — Individual ─────────────────────────────────────
  // Pro is set exactly ₹1,000/yr above Premium per direct pricing
  // instruction. Still meaningfully above Gen-E's own ₹299/mo standalone
  // price, and still real savings vs buying Gen-E + HyperX Pro separately.
  individual_starter_monthly: { amount: 9900,    currency: "INR", label: "Suite Starter Monthly",  durationDays: 30,  profilePlan: "ng_ind_starter" },
  individual_starter_yearly:  { amount: 79900,   currency: "INR", label: "Suite Starter Yearly",   durationDays: 365, profilePlan: "ng_ind_starter" },
  individual_premium_monthly: { amount: 44900,   currency: "INR", label: "Suite Premium Monthly",  durationDays: 30,  profilePlan: "ng_ind_premium" },
  individual_premium_yearly:  { amount: 449000,  currency: "INR", label: "Suite Premium Yearly",   durationDays: 365, profilePlan: "ng_ind_premium" },
  individual_pro_monthly:     { amount: 54900,   currency: "INR", label: "Suite Pro Monthly",      durationDays: 30,  profilePlan: "ng_ind_pro"     },
  individual_pro_yearly:      { amount: 549000,  currency: "INR", label: "Suite Pro Yearly",       durationDays: 365, profilePlan: "ng_ind_pro"     },

  // ── NuGens Suite — Business ───────────────────────────────────────
  business_starter_monthly: { amount: 49900,   currency: "INR", label: "Suite Biz Starter Monthly",  durationDays: 30,  profilePlan: "ng_biz_starter" },
  business_starter_yearly:  { amount: 399900,  currency: "INR", label: "Suite Biz Starter Yearly",   durationDays: 365, profilePlan: "ng_biz_starter" },
  business_premium_monthly: { amount: 99900,   currency: "INR", label: "Suite Biz Premium Monthly",  durationDays: 30,  profilePlan: "ng_biz_premium" },
  business_premium_yearly:  { amount: 799900,  currency: "INR", label: "Suite Biz Premium Yearly",   durationDays: 365, profilePlan: "ng_biz_premium" },
  business_pro_monthly:     { amount: 199900,  currency: "INR", label: "Suite Biz Pro Monthly",      durationDays: 30,  profilePlan: "ng_biz_pro"     },
  business_pro_yearly:      { amount: 1499900, currency: "INR", label: "Suite Biz Pro Yearly",       durationDays: 365, profilePlan: "ng_biz_pro"     },

  // ── HyperX plans ─────────────────────────────────────────────────
  // FIXED: hx_ind_yearly was ₹2,999/yr against a ₹799/mo Pro Monthly
  // (₹9,588/yr equivalent) — a 69% "discount" that made Pro Monthly
  // pointless (anyone could buy Yearly for less than 4 months of
  // Monthly). Re-priced to the standard "2 months free" annual
  // discount (yearly = 10x monthly). Same fix applied to hx_biz_yearly.
  hx_ind_premium_monthly: { amount: 29900,  currency: "INR", label: "HyperX Premium Monthly",      durationDays: 30,  profilePlan: "hx_ind_premium" },
  hx_ind_pro_monthly:     { amount: 79900,  currency: "INR", label: "HyperX Pro Monthly",          durationDays: 30,  profilePlan: "hx_ind_pro"     },
  hx_ind_yearly:          { amount: 799000, currency: "INR", label: "HyperX Pro Yearly",           durationDays: 365, profilePlan: "hx_ind_yearly"  },
  hx_biz_starter_monthly: { amount: 29900,  currency: "INR", label: "HyperX Biz Starter Monthly",  durationDays: 30,  profilePlan: "hx_biz_starter" },
  hx_biz_premium_monthly: { amount: 69900,  currency: "INR", label: "HyperX Biz Premium Monthly",  durationDays: 30,  profilePlan: "hx_biz_premium" },
  hx_biz_pro_monthly:     { amount: 159900, currency: "INR", label: "HyperX Biz Pro Monthly",      durationDays: 30,  profilePlan: "hx_biz_pro"     },
  hx_biz_yearly:          { amount: 1599000,currency: "INR", label: "HyperX Biz Yearly",           durationDays: 365, profilePlan: "hx_biz_yearly"  },

  // ── DigiHub plans ─────────────────────────────────────────────────
  // FIXED: dh_pro_yearly was ₹5,999/yr with NO monthly option, sitting
  // BELOW Premium's ₹2,599/mo (₹31,188/yr) despite being the top tier
  // (unlimited image gen, 10 seats, API access, dedicated manager) —
  // the best plan cost 80% less than a worse one. Added a real monthly
  // price above Premium, and re-priced yearly to 10x monthly ("2 months
  // free"). dh_yearly_yearly (individual) had the same pattern at a
  // smaller scale (44% off vs the 15-25% standard) — tightened to match.
  dh_starter_monthly:  { amount: 99900,   currency: "INR", label: "DigiHub Starter Monthly",  durationDays: 30,  profilePlan: "dh_starter"  },
  dh_starter_yearly:   { amount: 999000,  currency: "INR", label: "DigiHub Starter Yearly",   durationDays: 365, profilePlan: "dh_starter"  },
  dh_premium_monthly:  { amount: 259900,  currency: "INR", label: "DigiHub Premium Monthly",  durationDays: 30,  profilePlan: "dh_premium"  },
  dh_premium_yearly:   { amount: 2599000, currency: "INR", label: "DigiHub Premium Yearly",   durationDays: 365, profilePlan: "dh_premium"  },
  dh_pro_monthly:      { amount: 499900,  currency: "INR", label: "DigiHub Pro Monthly",      durationDays: 30,  profilePlan: "dh_pro"      },
  dh_pro_yearly:       { amount: 4999000, currency: "INR", label: "DigiHub Pro Yearly",       durationDays: 365, profilePlan: "dh_pro"      },
  // Individual DigiHub plans
  dh_monthly_monthly:  { amount: 29900,   currency: "INR", label: "DigiHub Individual Monthly", durationDays: 30,  profilePlan: "dh_monthly"  },
  dh_yearly_yearly:    { amount: 299000,  currency: "INR", label: "DigiHub Individual Yearly",  durationDays: 365, profilePlan: "dh_yearly"   },

  // ── Gen-E Business plans ──────────────────────────────────────────
  biz_starter:          { amount: 49900,   currency: "INR", label: "Gen-E Business Starter Monthly", durationDays: 30,  profilePlan: "gene_biz_starter" },
  biz_pro:              { amount: 149900,  currency: "INR", label: "Gen-E Business Pro Monthly",     durationDays: 30,  profilePlan: "gene_biz_pro"     },
  gene_biz_starter:     { amount: 49900,   currency: "INR", label: "Gen-E Business Starter Monthly", durationDays: 30,  profilePlan: "gene_biz_starter" },
  gene_biz_pro:         { amount: 149900,  currency: "INR", label: "Gen-E Business Pro Monthly",     durationDays: 30,  profilePlan: "gene_biz_pro"     },

  // ── Units plans ───────────────────────────────────────────────────
  // NOTE: units_starter_monthly/yearly and units_pro_monthly/yearly were
  // removed here — they were leftover config from an earlier design.
  // Units' actual pricing model is per-project booking (see
  // UNITS_SERVICE_CATALOG and /api/units/bookings/create-order), not a
  // recurring subscription, and nothing in the Units frontend has ever
  // referenced these plan keys. units_consult (the one real Units item
  // in this table) is unaffected.
  units_consult:         { amount: 99900,  currency: "INR", label: "Units Premium Consultation",  durationDays: 1,   profilePlan: "units_consult"  },
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

OUTPUT FORMAT — CRITICAL, FOLLOW EXACTLY:
- When you output the final resume, output ONLY the resume itself, starting
  directly with the first ## section header. This output is exported
  and downloaded as-is by the user — it must be ready to send to an
  employer with zero editing.
- Do NOT include any introductory sentence ("Here's your resume:",
  "Thanks for sharing your details..."), and do NOT include any closing
  remark ("Let me know if...", "I hope this helps...") in the same message
  as the resume content. If you want to say something conversational,
  say it in a separate follow-up message, never inside the resume block.

ATS-OPTIMIZATION RULES — apply these to every resume you generate:
- Use standard section names only: PROFESSIONAL SUMMARY, CORE SKILLS,
  PROFESSIONAL EXPERIENCE, EDUCATION, CERTIFICATIONS, PROJECTS. Never
  invent creative alternatives — ATS parsers match against these exact terms.
- Reverse-chronological order for experience and education (most recent first).
- Consistent date format throughout: MM/YYYY – MM/YYYY (or "Present").
- Plain bullet points only (- or •) — no tables, no columns, no special symbols.
- Quantify achievements wherever possible (%, ₹, time saved, scale).
- Keep contact info (name, email, phone, location) in the main body content,
  never implied to belong in a page header/footer.
- Always remind them the PDF download button will appear automatically after generation.
- NEVER say you cannot create or deliver a resume PDF.`,

  ROADMAP: `
The user is in CAREER ROADMAP mode.
- FIRST: If you don't know the user's current role/situation, target goal, and preferred timeline, ask 2-3 clarifying questions before generating the roadmap. Never generate a roadmap without understanding where the user is now and where they want to go.
- Once you have enough context, create a clear, phase-by-phase career roadmap.
- Break it into 3-4 phases with realistic timelines.
- For each phase include: key skills to learn, recommended actions/projects, and milestones.
- Make it realistic and actionable based on their current situation and target goal.
- Use markdown with clear headings like ## PHASE 1, ## PHASE 2, etc.`,

  INTERVIEW: `
The user is in INTERVIEW PREP mode.
- FIRST: If you don't know the user's target role, years of experience, and key skill areas, ask 2-3 clarifying questions before generating interview questions.
- Scale questions to the user's stated experience level:
  • 0-2 years (fresher/junior): foundational concepts, basic scenarios, STAR-format behavioral questions about academic projects or internships.
  • 3-6 years (mid-level): system design at component level, cross-team collaboration, debugging and optimization scenarios, leadership potential questions.
  • 7+ years (senior/lead): architecture decisions, scaling, mentoring, stakeholder management, strategic thinking.
- Provide: 5 HR/behavioral questions (STAR format), 5 technical/domain questions calibrated to the level above, a weak-area assessment, and a 1-week prep plan.
- Never give a generic fixed set — every output must reflect the specific role and experience band.`,

  SCORING: `
The user wants a CAREER READINESS SCORE.
- Ask about skills, experience, and target role if not already provided.
- Score them 0–100 with: Strength Areas, Skill Gaps, Risk Factors, and a 30-Day Action Plan.`,

  CAREER: "",

  BUSINESS: `
You are GEN-E Business Intelligence AI — a workforce and hiring intelligence assistant for founders, HR managers, and team leads.
You MUST help with ALL of these business tasks immediately and thoroughly:

BUSINESS TOOLS YOU SUPPORT (NEVER REFUSE THESE):
[TOOL:jd]         — Generate complete job descriptions with responsibilities, requirements, salary range, and 8-10 interview questions.
[TOOL:hiring]     — Full hiring intelligence: required skills by category, salary ranges by experience tier, red flags to screen for, sourcing channels, evaluation framework.
[TOOL:team]       — Team skill mapping: analyse team composition, identify collective gaps vs company goals, flag redundancies, prioritise training roadmap.
[TOOL:workforce]  — Workforce planning roadmap: phase-by-phase hiring plan, budget estimates, org structure options, build-vs-hire recommendations by quarter.
[TOOL:salary]     — Salary benchmarks: Indian market data by role, city, experience tier, variable pay norms, equity expectations, peer company comparison.
[TOOL:interview]  — Interview kit: screening questions, technical questions, STAR-format behavioural questions, case studies, and scoring rubric with evaluation criteria.

BEHAVIOUR RULES:
- Read the [TOOL:X] tag in the message to know exactly what to deliver.
- Be specific, comprehensive, and India-market-aware.
- Give structured professional output — use headers, bullet points, and clear sections.
- Ask 1-2 clarifying questions first if essential context is missing (role title, company stage, industry).
- NEVER say "I'm only for career guidance" or refuse. You are a business workforce tool.
- Keep the conversation focused on the business task at hand.`,
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
  if (m.includes("[mode:business]"))  return "BUSINESS";
  return "CAREER";
}

function cleanMessage(message) {
  return message
    .replace(/\[MODE:RESUME\]/gi, "")
    .replace(/\[MODE:INTERVIEW\]/gi, "")
    .replace(/\[MODE:SCORING\]/gi, "")
    .replace(/\[MODE:CAREER\]/gi, "")
    .replace(/\[MODE:BUSINESS\]/gi, "")
    .replace(/\[TOOL:[a-z_]+\]/gi, "")
    .trim();
}

function buildFallbackReply(message, context = "") {
  const raw = (message || "").toString().trim();
  const preview = raw.length > 140 ? raw.slice(0, 137) + "..." : raw || "your message";
  const extra = context ? " " : "";
  return `I’m here to help. You said: "${preview}".${extra}\n\nI can help with career guidance, resume review, interview prep, skill-building, marketing strategy, content planning, or platform support. Share a bit more detail and I’ll give you a concrete next step.`;
}

function withTimeout(promiseFactory, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Request timed out")), timeoutMs);
    promiseFactory()
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

async function callOpenAI(systemPrompt, history, maxTokens = 600) {
  if (!openai) throw new Error("OpenAI not configured");
  const response = await withTimeout(() => openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "system", content: systemPrompt }, ...history],
    max_tokens: maxTokens,
    temperature: 0.75,
  }), 20000);
  return safeExtract(response);
}

/* Groq (Llama 3.3 70B) — free fallback, 2× faster on simple queries */
async function callGroq(systemPrompt, history, maxTokens = 600) {
  if (!groq) throw new Error("Groq not configured");
  const response = await withTimeout(() => groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "system", content: systemPrompt }, ...history],
    max_tokens: maxTokens,
    temperature: 0.75,
  }), 20000);
  return safeExtract(response);
}

/* Smart caller: GPT-4o-mini first, auto-falls back to Groq on rate limit */
async function callAI(systemPrompt, history, maxTokens = 600) {
  try {
    return await callOpenAI(systemPrompt, history, maxTokens);
  } catch (err) {
    if (groq && (err.status === 429 || err.status === 503 || err.code === "ECONNRESET")) {
      try {
        console.log("⚡ GPT rate-limited — switching to Groq");
        return await callGroq(systemPrompt, history, maxTokens);
      } catch (gErr) {
        console.warn("Groq fallback failed:", gErr.message || gErr);
      }
    }
    if (GEMINI_KEY) {
      try {
        const prompt = `${systemPrompt}\n\nConversation:\n${(history || []).map(h => `${h.role}: ${h.content}`).join("\n")}`;
        const geminiReply = await callGemini(prompt);
        if (geminiReply) return geminiReply;
      } catch (gErr) {
        console.warn("Gemini fallback failed:", gErr.message || gErr);
      }
    }
    const lastUser = (history || []).slice().reverse().find(h => h.role === "user")?.content || "";
    return buildFallbackReply(lastUser, systemPrompt);
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
/* Renders one line of text into a PDFKit doc, treating **bold** segments as
   actual bold runs instead of printing the literal asterisk characters.
   Used by the generate_resume PDF path, which previously just called
   doc.text(t) on raw markdown and printed "**Developer**" verbatim. */
function renderBoldAwareLine(doc, text, opts = {}) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(p => p !== "");
  if (parts.length === 0) return;
  parts.forEach((part, idx) => {
    const isBold = /^\*\*[^*]+\*\*$/.test(part);
    const clean = isBold ? part.slice(2, -2) : part;
    doc.font(isBold ? "Helvetica-Bold" : "Helvetica").fillColor(isBold ? "#111" : "#222");
    const isLast = idx === parts.length - 1;
    const callOpts = idx === 0 ? Object.assign({}, opts, isLast ? {} : { continued: true }) : (isLast ? {} : { continued: true });
    doc.text(clean, callOpts);
  });
}

// Strips chat narration ("Thanks for sharing...", "Here's your resume:",
// "Let me know if...") from raw AI output so the exported PDF contains
// ONLY the resume — nothing the user has to manually delete before sending
// it to an employer. Mirrors the same logic used in the frontend HTML export.
function extractResumeOnly(raw) {
  const firstHeaderIdx = raw.search(/##\s+/);
  let body = firstHeaderIdx === -1 ? raw : raw.slice(firstHeaderIdx);

  const closingPatterns = /\n\s*(let me know|feel free|would you like|i hope|does this|this resume|hope this helps|want me to|should i|happy to)/i;
  const closingMatch = body.search(closingPatterns);
  if (closingMatch !== -1) body = body.slice(0, closingMatch);

  return body.trim();
}

function generateResumePDF(content, userName = "User") {
  const cleanContent = extractResumeOnly(content);
  const fileName = `resume-${Date.now()}.pdf`;
  const filePath = path.join(__dirname, fileName);
  const doc = new PDFDocument({
    margin: 50,
    size: "A4",
    // Hidden watermark: embedded PDF Info metadata only, invisible on the
    // page and not read by ATS parsers or visual inspection — replaces the
    // old visible banner per bug report 4-07-2026.
    info: {
      Title: `${userName} — Resume`,
      Author: userName,
      Creator: "Gen-E AI",
      Producer: "Gen-E AI — Nugens (gene.nugens.in)",
      Keywords: "Generated via Gen-E AI",
    },
  });
  doc.pipe(fs.createWriteStream(filePath));

  // Header with user's real name — no visible branding, clean for ATS + recruiters
  doc.fontSize(18).font("Helvetica-Bold").fillColor("#111")
     .text(userName.toUpperCase(), { align: "center" });
  doc.moveDown(0.8);

  const lines = cleanContent.split("\n");
  lines.forEach(line => {
    const clean = line.replace(/##\s?/g, "").replace(/\*\*/g, "").trim();
    if (!clean) { doc.moveDown(0.3); return; }

    if (line.startsWith("## ")) {
      doc.moveDown(0.5)
         .fontSize(11).font("Helvetica-Bold").fillColor("#e8185d")
         .text(clean.toUpperCase());
      doc.moveDown(0.1)
         .moveTo(50, doc.y).lineTo(545, doc.y)
         .strokeColor("#f0d0d8").lineWidth(0.5).stroke();
      doc.moveDown(0.15);
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

/* ── ROADMAP PDF — roadmap-appropriate layout, NOT resume section headers.
      Fixes: "Save as PDF generates as resume instead of roadmap" ── */
function generateRoadmapPDF(content, title = "Career Roadmap", userName = "") {
  const fileName = `roadmap-${Date.now()}.pdf`;
  const filePath = path.join(__dirname, fileName);
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(20).font("Helvetica-Bold").fillColor("#111")
     .text(title, { align: "left" });
  if (userName) {
    doc.fontSize(10).font("Helvetica").fillColor("#666")
       .text(`Prepared for ${userName} · ${new Date().toLocaleDateString("en-IN")}`);
  }
  doc.moveDown(0.8);

  let phaseNo = 0;
  content.split("\n").forEach(line => {
    const clean = line.replace(/##\s?/g, "").replace(/\*\*/g, "").trim();
    if (!clean) { doc.moveDown(0.25); return; }

    if (line.startsWith("## ")) {
      phaseNo += 1;
      doc.moveDown(0.6);
      // Phase banner — numbered block, visually distinct from resume headers
      const y = doc.y;
      doc.rect(50, y - 2, 495, 22).fill("#fdeef4");
      doc.fillColor("#e8185d").fontSize(12).font("Helvetica-Bold")
         .text(clean.toUpperCase(), 58, y + 2, { width: 480 });
      doc.moveDown(0.5);
      doc.x = 50;
    } else if (/^(\s*)([-•]|\d+\.)\s/.test(line)) {
      doc.fontSize(10).font("Helvetica").fillColor("#333")
         .text("›  " + clean.replace(/^([-•]|\d+\.)\s*/, ""), { indent: 14, lineGap: 2 });
    } else if (/^(milestone|timeline|goal|outcome)s?\s*[:\-]/i.test(clean)) {
      doc.fontSize(10.5).font("Helvetica-Bold").fillColor("#111").text(clean, { lineGap: 2 });
    } else {
      doc.fontSize(10).font("Helvetica").fillColor("#444").text(clean, { lineGap: 2 });
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
app.post("/api/chat", optionalAuth, checkUsage, async (req, res) => {
  const { message, history = [], session_id, mode: clientMode, lang = "en" } = req.body;
  if (!message || typeof message !== "string") return res.status(400).json({ error: "Invalid message" });

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  let clientGone = false;

  req.on("aborted", () => {
    clientGone = true;
  });

  const send = (obj) => {
    if (clientGone) return;
    try {
      res.write("data: " + JSON.stringify(obj) + "\n\n");
      if (typeof res.flush === "function") res.flush();
    } catch (e) { clientGone = true; }
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
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    const send = (obj) => res.write("data: " + JSON.stringify(obj) + "\n\n");
    send({ gate: "resume_builder" });
    send({ done: true });
    res.end();
    return;
  }

  // Advanced Interview Prep → Pro only (monthly + yearly)
  if (mode === "INTERVIEW" && plan === "free") {
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    const send = (obj) => res.write("data: " + JSON.stringify(obj) + "\n\n");
    send({ gate: "interview_advanced" });
    send({ done: true });
    res.end();
    return;
  }

  // Job Match Analysis — open to yearly, gene_yearly, ng_* suite plans, and admin
  const PAID_JOB_PLANS = new Set(["yearly","gene_yearly","admin",
    "ng_ind_starter","ng_ind_premium","ng_ind_pro",
    "ng_biz_starter","ng_biz_premium","ng_biz_pro"]);
  const isJobQuery = detectJobIntent(clean);
  if (isJobQuery && !PAID_JOB_PLANS.has(plan)) {
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
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

  // BUSINESS mode: use ONLY the business prompt — never mix with the individual career prompt
  // (individual prompt explicitly refuses non-career topics which would block business tools)
  const fullSystem = mode === "BUSINESS"
    ? MODE_ADDENDUM.BUSINESS + langNote
    : SYSTEM_PROMPT + (modeExtra ? "\n\n---\nCURRENT MODE:\n" + modeExtra : "") + langNote;

  const convHistory = [...history.slice(-12), { role: "user", content: clean }];
  const maxTokens  = mode === "BUSINESS" ? 1800
    : ["RESUME", "SCORING", "INTERVIEW"].includes(mode) ? 1600 : 600;

  logChat({ userId: req.user?.id, sessionId: session_id, role: "user", message: clean, mode });

  if (!openai) {
    const fallback = buildFallbackReply(clean, fullSystem);
    send({ chunk: fallback });
    send({ done: true });
    res.end();
    return;
  }

  /* Job intent — fetch in PARALLEL with stream (already gated above for non-yearly) */
  let jobsPromise = null;
  if (isJobQuery) {
    const { query, location, remote } = extractJobParams(clean, req.profile || {});
    console.log("Job intent:", query, "in", location || "any", remote ? "(remote)" : "");
    jobsPromise = fetchLiveJobs(query, location, remote).catch(e => {
      console.warn("Job fetch err:", e.message); return [];
    });
  }

  let fullText = "";

  try {
    const stream = await withTimeout(() =>
      openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: fullSystem }, ...convHistory],
        max_tokens: maxTokens,
        temperature: 0.75,
        stream: true,
      }),
      20000
    );

    try {
      for await (const chunk of stream) {
        if (clientGone) {
          stream.controller?.abort?.();
          break;
        }

        const delta = chunk.choices?.[0]?.delta?.content || "";

        if (delta) {
          fullText += delta;
          send({ chunk: delta });
        }
      }
    } catch (streamErr) {
      console.error("Mini stream failed:", streamErr.message);
    }

    if (clientGone) {
      try {
        res.end();
      } catch {}
      return;
    }

   let pdfPath = null;

if (
  mode === "RESUME" &&
  fullText.length > 500 &&
  fullText.includes("##") &&
  req.profile?.plan !== "free"
) {
  try {
    const userName = req.profile?.full_name || req.user?.user_metadata?.full_name || "User";
    pdfPath = "/download/" + generateResumePDF(fullText, userName);
  } catch (e) {
    console.warn("PDF generation failed:", e.message);
  }
}

   
    if (jobsPromise) {
      const liveJobs = await jobsPromise;
      if (liveJobs.length > 0) {
        send({ jobs: liveJobs });
      } else {
        // Critical fix: previously no jobs returned silently — user saw "will be
        // displayed here" as a placeholder. Now we tell the client explicitly.
        send({ jobs: [], jobs_empty: true });
        send({ chunk: "\n\nI searched multiple job boards but couldn't find live openings matching those exact criteria right now. Try broadening the role title or changing the location." });
      }
    }

    send({ done: true, pdf: pdfPath });

    try {
      res.end();
    } catch {}

    logChat({
      userId: req.user?.id,
      sessionId: session_id,
      role: "assistant",
      message: fullText,
      mode
    });

    if (req.user && req.profile?.plan === "free") {
      incrementUsage(req.user.id);
    }

  } catch (err) {
    const isRealClientDisconnect =
      clientGone ||
      err.code === "ECONNRESET" ||
      err.message?.includes("Premature close");

    console.error("Chat stream error:", err.message);

    if (isRealClientDisconnect) {
      try {
        res.end();
      } catch {}
      return;
    }

    const fallback = buildFallbackReply(clean, fullSystem);

    send({
      chunk: fallback,
      error: true
    });

    send({ done: true });

    try {
      res.end();
    } catch {}
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

  // NEVER downgrade an admin account via subscription verify
  const { data: currentProfile } = await supabase
    .from("profiles").select("plan").eq("id", req.user.id).single();
  if (currentProfile?.plan === "admin") {
    return res.json({ success: true, plan: "admin", message: "Admin account — no change needed." });
  }

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

/* ═══════════════════════════════════════════════════════════
   FEATURE: UNITS SERVICE BOOKINGS
   Fixes a critical bug: BookServices.jsx was sending plan keys
   like "units_video-editing_Full Production" to the generic
   subscription endpoints above, which only match fixed plan IDs
   — every booking payment failed with "Unknown plan". These
   dedicated endpoints validate against UNITS_SERVICE_CATALOG and
   actually persist what was booked (previously discarded after
   payment — the business had no record of what was paid for).
   ═══════════════════════════════════════════════════════════ */

/* POST /api/units/bookings/create-order */
app.post("/api/units/bookings/create-order", requireAuth, async (req, res) => {
  const { serviceId, packageName } = req.body;
  const service = UNITS_SERVICE_CATALOG[serviceId];
  const amount  = service?.packages?.[packageName];

  if (!service || !amount) {
    return res.status(400).json({ error: `Unknown service/package: "${serviceId}" / "${packageName}"` });
  }
  if (!razorpay) {
    return res.status(503).json({ error: "Payment service unavailable.", details: "RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set." });
  }

  try {
    const order = await razorpay.orders.create({
      amount: amount * 100, // rupees → paise
      currency: "INR",
      receipt: `unit_${Date.now()}`.slice(0, 40),
    });
    res.json({ order, amount: amount * 100 });
  } catch (err) {
    console.error("[Units booking] order error:", err.message);
    res.status(500).json({ error: "Failed to create payment order." });
  }
});

/* POST /api/units/bookings/verify */
app.post("/api/units/bookings/verify", requireAuth, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, serviceId, packageName, name, email, phone, company, note } = req.body;

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(body).digest("hex");
  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ success: false, error: "Payment signature mismatch." });
  }

  const service = UNITS_SERVICE_CATALOG[serviceId];
  const amount  = service?.packages?.[packageName];
  if (!service || !amount) return res.status(400).json({ error: "Unknown service/package." });

  const { data: booking, error } = await supabase.from("units_bookings").insert({
    user_id: req.user.id,
    service_id: serviceId,
    service_title: service.title,
    package_name: packageName,
    amount: amount * 100,
    name, email, phone: phone || null, company: company || null, note: note || null,
    razorpay_payment_id,
  }).select().single();

  if (error) {
    console.error("[Units booking] save error:", error.message);
    // Payment already succeeded — don't fail the user's flow even if the DB write fails;
    // but log loudly since this is the failure mode that silently loses a paid booking.
    console.error(`⚠️  PAID BOOKING NOT SAVED — payment_id=${razorpay_payment_id} service=${serviceId}/${packageName} user=${req.user.email}`);
  }

  // Notify admin so the booking doesn't go unnoticed
  if (process.env.RESEND_API_KEY) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Units Bookings <noreply@nugens.in>",
          to: [process.env.ADMIN_EMAIL || "jeromjoseph31@gmail.com"],
          subject: `New Units booking: ${service.title} — ${packageName}`,
          html: `
            <div style="font-family:sans-serif;max-width:520px;">
              <h2 style="color:#d4a843;">New paid booking</h2>
              <p><b>Service:</b> ${service.title} — ${packageName} (₹${amount.toLocaleString()})</p>
              <p><b>Client:</b> ${name} · ${email} ${phone ? "· " + phone : ""}</p>
              ${company ? `<p><b>Company:</b> ${company}</p>` : ""}
              ${note ? `<p><b>Notes:</b> ${note}</p>` : ""}
              <p style="color:#888;font-size:12px;">Payment ID: ${razorpay_payment_id}</p>
            </div>`,
        }),
      });
    } catch (e) {
      console.error("[Units booking] admin email failed:", e.message);
    }
  }

  console.log(`✅ Units booking: ${email} → ${serviceId}/${packageName} (₹${amount})`);
  res.json({ success: true, booking });
});

/* GET /api/units/bookings/mine — client's own bookings, for the Project Tracker */
app.get("/api/units/bookings/mine", requireAuth, async (req, res) => {
  const { data, error } = await supabase.from("units_bookings")
    .select("*").eq("user_id", req.user.id).order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: "Failed to fetch your bookings" });
  res.json({ bookings: data || [] });
});

/* ═══════════════════════════════════════════════════════════
   FEATURE: IDEA VALIDATION — real consultation requests
   BUG FIX: "Book Premium Consultation — ₹999" previously just flipped
   a local boolean and showed "Our team will reach out within 24 hours"
   with NO record created anywhere — nobody could ever actually reach
   out. This endpoint makes the request real.
   ═══════════════════════════════════════════════════════════ */
app.post("/api/units/consultation-requests", requireAuth, async (req, res) => {
  const { ideaSummary, score, contactNote } = req.body;
  if (!ideaSummary?.trim()) return res.status(400).json({ error: "Idea summary is required" });

  const { data, error } = await supabase.from("units_consultation_requests").insert({
    user_id: req.user.id,
    idea_summary: ideaSummary.trim().slice(0, 2000),
    score: Number.isFinite(score) ? score : null,
    contact_note: (contactNote || "").slice(0, 500),
  }).select().maybeSingle();

  if (error) { console.error("[Idea Validation] consultation request error:", error.message); return res.status(500).json({ error: "Failed to submit your request. Please try again." }); }
  res.json({ request: data });
});

/* GET /api/units/bookings/all — admin-only, for the Projects board.
   ROUTE-ORDER FIX: this MUST be registered before "/:id" — Express matches
   top-down, so with "/:id" first, GET /all resolved req.params.id = "all"
   and always returned 404 "Booking not found" (admin Projects board broken). */
app.get("/api/units/bookings/all", requireAuth, async (req, res) => {
  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", req.user.id).maybeSingle();
  if (profile?.plan !== "admin") return res.status(403).json({ error: "Admin access required" });

  const { data, error } = await supabase.from("units_bookings").select("*").order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: "Failed to fetch bookings" });
  res.json({ bookings: data || [] });
});

/* GET /api/units/bookings/:id — single booking (owner or admin), for the receipt/confirmation page */
app.get("/api/units/bookings/:id", requireAuth, async (req, res) => {
  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", req.user.id).maybeSingle();
  const isAdmin = profile?.plan === "admin";

  let q = supabase.from("units_bookings").select("*").eq("id", req.params.id);
  if (!isAdmin) q = q.eq("user_id", req.user.id);
  const { data, error } = await q.maybeSingle();
  if (error || !data) return res.status(404).json({ error: "Booking not found" });
  res.json({ booking: data });
});

/* PATCH /api/units/bookings/:id/status — admin-only, move a booking through its lifecycle */
app.patch("/api/units/bookings/:id/status", requireAuth, async (req, res) => {
  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", req.user.id).maybeSingle();
  if (profile?.plan !== "admin") return res.status(403).json({ error: "Admin access required" });

  const { status } = req.body;
  const allowed = ["paid", "in_progress", "delivered", "refunded"];
  if (!allowed.includes(status)) return res.status(400).json({ error: `status must be one of: ${allowed.join(", ")}` });

  const { data, error } = await supabase.from("units_bookings").update({ status }).eq("id", req.params.id).select().single();
  if (error || !data) return res.status(404).json({ error: "Booking not found" });
  res.json({ booking: data });
});

/* POST /api/units/bookings/:id/reschedule-request — client asks to change date/scope; emails admin */
app.post("/api/units/bookings/:id/reschedule-request", requireAuth, async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: "Please describe what you'd like to change." });

  const { data: booking, error } = await supabase.from("units_bookings")
    .select("*").eq("id", req.params.id).eq("user_id", req.user.id).maybeSingle();
  if (error || !booking) return res.status(404).json({ error: "Booking not found" });

  await supabase.from("units_bookings").update({
    reschedule_note: message.slice(0, 1000),
  }).eq("id", req.params.id);

  if (process.env.RESEND_API_KEY) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Units Bookings <noreply@nugens.in>",
          to: [process.env.ADMIN_EMAIL || "jeromjoseph31@gmail.com"],
          subject: `Reschedule request: ${booking.service_title} — ${booking.package_name}`,
          html: `
            <div style="font-family:sans-serif;max-width:520px;">
              <h2 style="color:#d4a843;">Reschedule / change request</h2>
              <p><b>Booking:</b> ${booking.service_title} — ${booking.package_name}</p>
              <p><b>Client:</b> ${booking.name} · ${booking.email}</p>
              <p><b>Request:</b> ${message}</p>
              <p style="color:#888;font-size:12px;">Booking ID: ${booking.id} · Payment ID: ${booking.razorpay_payment_id}</p>
            </div>`,
        }),
      });
    } catch (e) {
      console.error("[Units booking] reschedule email failed:", e.message);
    }
  }

  res.json({ success: true });
});

/* ═══════════════════════════════════════════════════════════
   FEATURE: UNITS EVENT & SHOOT QUOTE REQUESTS
   Separate from the fixed-price service bookings above — events
   and live shoots are priced per-project (duration/location/crew),
   so this captures a request and notifies the team rather than
   taking payment up front.
   ═══════════════════════════════════════════════════════════ */
app.post("/api/units/event-requests", requireAuth, async (req, res) => {
  const { eventType, eventDate, venue, guestCount, name, email, phone, notes } = req.body;
  if (!eventType || !name || !email) return res.status(400).json({ error: "Event type, name, and email are required." });

  const { data, error } = await supabase.from("units_event_requests").insert({
    user_id: req.user.id,
    event_type: eventType,
    event_date: eventDate || null,
    venue: venue || null,
    guest_count: guestCount || null,
    name, email, phone: phone || null,
    notes: (notes || "").slice(0, 1500),
  }).select().single();

  if (error) { console.error("[Units events] insert error:", error.message); return res.status(500).json({ error: "Couldn't submit your request. Please try again." }); }

  if (process.env.RESEND_API_KEY) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Units Bookings <noreply@nugens.in>",
          to: [process.env.ADMIN_EMAIL || "jeromjoseph31@gmail.com"],
          subject: `New quote request: ${eventType}`,
          html: `
            <div style="font-family:sans-serif;max-width:520px;">
              <h2 style="color:#d4a843;">New event/shoot quote request</h2>
              <p><b>Type:</b> ${eventType}</p>
              ${eventDate ? `<p><b>Date:</b> ${eventDate}</p>` : ""}
              ${venue ? `<p><b>Venue:</b> ${venue}</p>` : ""}
              ${guestCount ? `<p><b>Guests:</b> ${guestCount}</p>` : ""}
              <p><b>Contact:</b> ${name} · ${email} ${phone ? "· " + phone : ""}</p>
              ${notes ? `<p><b>Notes:</b> ${notes}</p>` : ""}
            </div>`,
        }),
      });
    } catch (e) {
      console.error("[Units events] admin email failed:", e.message);
    }
  }

  res.json({ success: true, request: data });
});

/* GET /api/units/event-requests/mine */
app.get("/api/units/event-requests/mine", requireAuth, async (req, res) => {
  const { data, error } = await supabase.from("units_event_requests").select("*").eq("user_id", req.user.id).order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: "Failed to fetch your requests" });
  res.json({ requests: data || [] });
});


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
  // SECURITY: only serve generated PDF artifacts. Without this check, ANY file
  // in the backend directory was downloadable — including .env (all API keys,
  // the Supabase service-role key, and the Razorpay secret) and server.js.
  if (!/^(resume|roadmap)-\d+\.pdf$/.test(safeFileName)) {
    return res.status(403).json({ error: "Not allowed" });
  }
  const filePath = path.join(__dirname, safeFileName);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File not found" });
  res.download(filePath);
});

/* POST /api/jobs/search — called internally by /api/chat when job intent detected */
async function fetchLiveJobs(query, location, remote) {
  const results = [];
  const q = (query || "software engineer").trim();
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

  // Relevance scoring — location and query-term matching, so results are
  // actually ranked by fit instead of just "whatever came back from each
  // source in whatever order". A job in the wrong city no longer sits above
  // a well-matched one just because it came from an earlier-checked source.
  const qWords = q.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  results.forEach(j => {
    let score = 0;
    const titleLower = (j.title || "").toLowerCase();
    qWords.forEach(w => { if (titleLower.includes(w)) score += 3; });

    if (location) {
      const jobLoc = (j.location || "").toLowerCase();
      if (jobLoc.includes(location.toLowerCase())) score += 5;
      else if (j.remote) score += 1; // still somewhat relevant if remote
      else score -= 3; // likely wrong city — deprioritize, don't necessarily hide
    }
    if (remote) {
      score += j.remote ? 4 : -5;
    }
    j._score = score;
  });
  results.sort((a, b) => b._score - a._score);

  // Deduplicate by title+company
  const seen = new Set();
  const deduped = results.filter(j => {
    const key = (j.title + j.company).toLowerCase().replace(/\s/g, "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // If a location or remote preference was given and we have enough strong
  // matches, drop the clearly-irrelevant ones rather than padding the list
  // with jobs in the wrong city just to hit a round number.
  const strong = deduped.filter(j => j._score >= 0);
  const finalList = (location || remote) && strong.length >= 4 ? strong : deduped;

  return finalList.slice(0, 10).map(({ _score, ...j }) => j);
}


/* Detect job search intent from a user message.
   PREVIOUSLY: matched on broad industry nouns (career, role, developer,
   engineer, manager, position, software...) — which meant almost any career
   coaching message ("what skills does a developer role need", "tips for a
   manager position") triggered a job search and showed job cards under a
   message that never asked for jobs. Job cards should only appear when the
   person is actually asking to find/see open roles.
   NOW: requires an explicit job-seeking phrase — a search/find verb next to
   "job(s)"/"opening(s)"/"vacancy", or a direct phrase like "who's hiring",
   "current openings", "job vacancies", "job board", "job match", etc. */
function detectJobIntent(message) {
  const m = message.toLowerCase().trim();

  const explicitPhrases = [
    /\b(find|show|search|get|looking\s+for|need)\s+(me\s+)?(a\s+|some\s+|any\s+)?jobs?\b/,
    /\bjob\s*(s)?\s+(openings?|vacanc(y|ies)|listings?|search|match|board)\b/,
    /\b(open|current|live|new|latest)\s+(job\s+)?(positions?|vacanc(y|ies)|openings?)\b/,
    /\bwho'?s?\s+(is\s+)?hiring\b/,
    /\bhiring\s+(for|near|in|right\s+now)\b/,
    /\bapply\s+(for|to)\s+(a\s+)?jobs?\b/,
    /\bvacanc(y|ies)\s+(in|near|for|available)\b/,
    /\bany\s+openings?\b/,
    /\bjob\s+alerts?\b/,
    /\bopenings?\s+(in|near|at|for)\b/,
  ];

  return explicitPhrases.some(re => re.test(m));
}
/* Extract search params from natural language, falling back to the user's
   own profile (target_role, location, skills) when the message itself
   doesn't specify them — e.g. "show me some jobs" from a user whose profile
   says target_role="Product Manager", location="Bangalore" should search
   for Product Manager roles in Bangalore, not a generic "software engineer"
   search with no location filter at all. */
function extractJobParams(message, profile = {}) {
  const remote = /remote/i.test(message);

  const locationMatch = message.match(/\bin\s+([A-Za-z\s]+)$/i);
  let location = locationMatch ? locationMatch[1].trim() : "";
  if (!location && profile.location) location = profile.location;

  let query = message
    .replace(/\bin\s+[A-Za-z\s]+$/i, "")
    .replace(/\b(find|search|show|get|jobs?|job|openings?|vacancies?|hiring|role|position|work|career|any|new|current|live|latest|who'?s?|me|some|a|looking|for|need)\b/gi, "")
    .trim();

  // Fall back to the user's own target role / top skill instead of a
  // one-size-fits-all "software engineer" default — much more relevant
  // when the message was something generic like "any openings?".
  if (!query) {
    if (profile.target_role) query = profile.target_role;
    else if (profile.skills) query = String(profile.skills).split(",")[0].trim();
    else query = "software engineer";
  }

  return { query, location, remote };
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
   FEATURE: HYPERX LEARNING PATH ENROLLMENT
   ═══════════════════════════════════════════════════════════ */

/* GET /api/hyperx/path-enrollments — this user's enrolled paths */
app.get("/api/hyperx/path-enrollments", requireAuth, async (req, res) => {
  const { data, error } = await supabase.from("hyperx_path_enrollments").select("*").eq("user_id", req.user.id);
  if (error) return res.status(500).json({ error: "Failed to fetch enrollments" });
  res.json({ enrollments: data || [] });
});

/* POST /api/hyperx/path-enrollments — enroll in a path */
app.post("/api/hyperx/path-enrollments", requireAuth, async (req, res) => {
  const { pathId } = req.body;
  if (!pathId) return res.status(400).json({ error: "pathId is required" });
  const { data, error } = await supabase.from("hyperx_path_enrollments")
    .insert({ user_id: req.user.id, path_id: pathId }).select().single();
  if (error) {
    if (error.code === "23505") return res.json({ success: true, alreadyEnrolled: true });
    return res.status(500).json({ error: "Failed to enroll" });
  }
  res.json({ success: true, enrollment: data });
});

/* ═══════════════════════════════════════════════════════════
   FEATURE: HYPERX COMMUNITY
   ═══════════════════════════════════════════════════════════ */

/* GET /api/hyperx/community/posts */
app.get("/api/hyperx/community/posts", requireAuth, async (req, res) => {
  // NOTE: previously used an implicit PostgREST embed (`.select("*, profiles(full_name)")`),
  // which throws a hard error if the FK relationship isn't detectable at query time
  // (e.g. schema cache not refreshed after migration) — this is the most likely
  // cause of "Failed to fetch posts". Replaced with a manual two-step fetch + join,
  // which has no dependency on relationship auto-detection and can't fail that way.
  const { data, error } = await supabase.from("hyperx_community_posts")
    .select("*").order("pinned", { ascending: false }).order("created_at", { ascending: false });
  if (error) { console.error("[HyperX community] fetch error:", error.message); return res.status(500).json({ error: "Failed to fetch posts" }); }

  const userIds = [...new Set((data || []).map(p => p.user_id).filter(Boolean))];
  let namesById = {};
  if (userIds.length) {
    const { data: profiles, error: profErr } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
    if (profErr) console.warn("[HyperX community] profile lookup warning:", profErr.message);
    (profiles || []).forEach(p => { namesById[p.id] = p.full_name; });
  }

  const { data: likes } = await supabase.from("hyperx_community_likes").select("post_id, user_id");
  const { data: replies } = await supabase.from("hyperx_community_replies").select("post_id");

  const likeCounts = {}; const myLikes = new Set();
  (likes || []).forEach(l => { likeCounts[l.post_id] = (likeCounts[l.post_id]||0)+1; if (l.user_id === req.user.id) myLikes.add(l.post_id); });
  const replyCounts = {};
  (replies || []).forEach(r => { replyCounts[r.post_id] = (replyCounts[r.post_id]||0)+1; });

  const posts = (data || []).map(p => ({
    ...p,
    author: namesById[p.user_id] || "Anonymous",
    likes: likeCounts[p.id] || 0,
    replies: replyCounts[p.id] || 0,
    liked: myLikes.has(p.id),
  }));
  res.json({ posts });
});

/* POST /api/hyperx/community/posts */
app.post("/api/hyperx/community/posts", requireAuth, async (req, res) => {
  const { tag, title, body } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: "title is required" });
  const { data, error } = await supabase.from("hyperx_community_posts").insert({
    user_id: req.user.id, tag: tag || "Career Advice", title: String(title).slice(0,200), body: String(body||"").slice(0,2000),
  }).select().single();
  if (error) return res.status(500).json({ error: "Failed to create post" });
  res.json({ post: data });
});

/* POST/DELETE /api/hyperx/community/posts/:id/like */
app.post("/api/hyperx/community/posts/:id/like", requireAuth, async (req, res) => {
  const { error } = await supabase.from("hyperx_community_likes").insert({ post_id: req.params.id, user_id: req.user.id });
  if (error && error.code !== "23505") return res.status(500).json({ error: "Failed to like post" });
  res.json({ success: true });
});
app.delete("/api/hyperx/community/posts/:id/like", requireAuth, async (req, res) => {
  const { error } = await supabase.from("hyperx_community_likes").delete().eq("post_id", req.params.id).eq("user_id", req.user.id);
  if (error) return res.status(500).json({ error: "Failed to unlike post" });
  res.json({ success: true });
});

/* POST /api/hyperx/community/posts/:id/reply */
app.post("/api/hyperx/community/posts/:id/reply", requireAuth, async (req, res) => {
  const { body } = req.body;
  if (!body?.trim()) return res.status(400).json({ error: "reply body is required" });
  const { data, error } = await supabase.from("hyperx_community_replies").insert({
    post_id: req.params.id, user_id: req.user.id, body: String(body).slice(0,1000),
  }).select().single();
  if (error) return res.status(500).json({ error: "Failed to post reply" });
  res.json({ reply: data });
});

/* GET /api/hyperx/community/posts/:id/replies */
app.get("/api/hyperx/community/posts/:id/replies", requireAuth, async (req, res) => {
  const { data, error } = await supabase.from("hyperx_community_replies")
    .select("*").eq("post_id", req.params.id).order("created_at", { ascending: true });
  if (error) return res.status(500).json({ error: "Failed to fetch replies" });

  const userIds = [...new Set((data || []).map(r => r.user_id).filter(Boolean))];
  let namesById = {};
  if (userIds.length) {
    const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
    (profiles || []).forEach(p => { namesById[p.id] = p.full_name; });
  }
  res.json({ replies: (data||[]).map(r => ({ ...r, author: namesById[r.user_id] || "Anonymous" })) });
});

/* ═══════════════════════════════════════════════════════════
   FEATURE: DIGIHUB COMMUNITY
   Mirrors the HyperX Community pattern above. Previously this
   page used entirely hardcoded mock posts with no persistence.
   ═══════════════════════════════════════════════════════════ */

app.get("/api/digihub/community/posts", requireAuth, async (req, res) => {
  // Same fix as HyperX's community endpoint: an implicit PostgREST embed
  // (`.select("*, profiles(...)")`) throws a hard error whenever the FK
  // relationship isn't in the schema cache — the most likely cause of
  // "Failed to fetch posts". Manual two-step fetch instead.
  const { data, error } = await supabase.from("digihub_community_posts")
    .select("*").order("created_at", { ascending: false });
  if (error) { console.error("[DigiHub community] fetch error:", error.message); return res.status(500).json({ error: "Failed to fetch posts" }); }

  const userIds = [...new Set((data || []).map(p => p.user_id).filter(Boolean))];
  let profileById = {};
  if (userIds.length) {
    const { data: profiles, error: profErr } = await supabase.from("profiles").select("id, full_name, plan").in("id", userIds);
    if (profErr) console.warn("[DigiHub community] profile lookup warning:", profErr.message);
    (profiles || []).forEach(p => { profileById[p.id] = p; });
  }

  const { data: likes } = await supabase.from("digihub_community_likes").select("post_id, user_id");
  const likeCounts = {}; const myLikes = new Set();
  (likes || []).forEach(l => { likeCounts[l.post_id] = (likeCounts[l.post_id]||0)+1; if (l.user_id === req.user.id) myLikes.add(l.post_id); });

  const posts = (data || []).map(p => ({
    ...p,
    author: profileById[p.user_id]?.full_name || "Anonymous",
    plan: profileById[p.user_id]?.plan || "free",
    likes: likeCounts[p.id] || 0,
    liked: myLikes.has(p.id),
  }));
  res.json({ posts });
});

app.post("/api/digihub/community/posts", requireAuth, async (req, res) => {
  const { content, postType, tags } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: "content is required" });
  const { data, error } = await supabase.from("digihub_community_posts").insert({
    user_id: req.user.id,
    post_type: postType || "General Update",
    content: String(content).slice(0, 2000),
    tags: Array.isArray(tags) ? tags.slice(0, 6) : [],
  }).select().single();
  if (error) { console.error("[DigiHub community] insert error:", error.message); return res.status(500).json({ error: "Failed to create post" }); }
  res.json({ post: data });
});

app.post("/api/digihub/community/posts/:id/like", requireAuth, async (req, res) => {
  const { error } = await supabase.from("digihub_community_likes").insert({ post_id: req.params.id, user_id: req.user.id });
  if (error && error.code !== "23505") return res.status(500).json({ error: "Failed to like post" });
  res.json({ success: true });
});
app.delete("/api/digihub/community/posts/:id/like", requireAuth, async (req, res) => {
  const { error } = await supabase.from("digihub_community_likes").delete().eq("post_id", req.params.id).eq("user_id", req.user.id);
  if (error) return res.status(500).json({ error: "Failed to unlike post" });
  res.json({ success: true });
});

/* ═══════════════════════════════════════════════════════════
   FEATURE: DIGIHUB JOB BOARD
   ═══════════════════════════════════════════════════════════ */

/* GET /api/digihub/jobs — list open postings, optional ?search= & ?type= */
app.get("/api/digihub/jobs", requireAuth, async (req, res) => {
  const { search, type } = req.query;
  let q = supabase.from("digihub_jobs").select("*").eq("status", "open").order("created_at", { ascending: false });
  if (type && type !== "All") q = q.or(`type.eq.${type},location.eq.${type}`);
  const { data, error } = await q;
  if (error) { console.error("[DigiHub jobs] fetch error:", error.message); return res.status(500).json({ error: "Failed to fetch jobs" }); }

  let jobs = (data || []).map(j => ({ ...j, source: "digihub" }));
  if (search) {
    const s = search.toLowerCase();
    jobs = jobs.filter(j =>
      j.role.toLowerCase().includes(s) ||
      j.company.toLowerCase().includes(s) ||
      (j.skills || []).some(sk => sk.toLowerCase().includes(s)));
  }

  // Attach a live applicant count per job
  const jobIds = jobs.map(j => j.id);
  if (jobIds.length) {
    const { data: apps } = await supabase.from("digihub_job_applications").select("job_id").in("job_id", jobIds);
    const counts = {};
    (apps || []).forEach(a => { counts[a.job_id] = (counts[a.job_id] || 0) + 1; });
    jobs = jobs.map(j => ({ ...j, applicants: counts[j.id] || 0 }));
  }

  // Fill in with live listings from partner job boards (same aggregator
  // Gen-E's Job Match uses) so the board is never staring at "0 jobs
  // found" while real DigiHub-business postings build up. Clearly
  // labeled source:"partner" so it's never confused with a real DigiHub
  // posting, and skipped once there are already several real postings
  // matching the search.
  if (jobs.length < 6) {
    try {
      const liveQuery = search || `${type && type !== "All" ? type + " " : ""}digital marketing`;
      const liveLocation = (type && !["Full-time","Part-time","Contract","Remote"].includes(type)) ? type : "";
      const live = await fetchLiveJobs(liveQuery, liveLocation, type === "Remote");
      const liveMapped = live.slice(0, 8 - jobs.length).map((j, i) => ({
        id: `live-${i}-${Date.now()}`,
        company: j.company || "Partner listing",
        role: j.title,
        location: j.location || "Not specified",
        type: j.remote ? "Remote" : "Full-time",
        salary: j.salary || "",
        skills: [],
        description: j.description || "",
        url: j.url || "",
        urgent: false,
        applicants: 0,
        source: "partner",
        created_at: new Date().toISOString(),
      }));
      jobs = [...jobs, ...liveMapped];
    } catch (e) {
      console.warn("[DigiHub jobs] live fallback failed:", e.message);
    }
  }

  res.json({ jobs });
});

/* POST /api/digihub/jobs — create a posting (business accounts only) */
app.post("/api/digihub/jobs", requireAuth, async (req, res) => {
  const { data: profile } = await supabase.from("profiles").select("user_type").eq("id", req.user.id).maybeSingle();
  if (!profile || profile.user_type !== "business") {
    return res.status(403).json({ error: "Only business accounts can post jobs." });
  }

  const { company, role, location, type, salary, skills, description, urgent } = req.body;
  if (!company || !role) return res.status(400).json({ error: "company and role are required" });

  const { data, error } = await supabase.from("digihub_jobs").insert({
    business_id: req.user.id,
    company:     String(company).slice(0, 120),
    role:        String(role).slice(0, 120),
    location:    location || "Remote",
    type:        type || "Full-time",
    salary:      salary || null,
    skills:      Array.isArray(skills) ? skills.slice(0, 12) : [],
    description: String(description || "").slice(0, 2000),
    urgent:      !!urgent,
  }).select().single();

  if (error) { console.error("[DigiHub jobs] insert error:", error.message); return res.status(500).json({ error: "Failed to create job posting" }); }
  res.json({ job: data });
});

/* PATCH /api/digihub/jobs/:id — edit or close a posting (owner only) */
app.patch("/api/digihub/jobs/:id", requireAuth, async (req, res) => {
  const allowed = ["company", "role", "location", "type", "salary", "skills", "description", "urgent", "status"];
  const updates = {};
  for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k];

  const { data, error } = await supabase.from("digihub_jobs")
    .update(updates).eq("id", req.params.id).eq("business_id", req.user.id).select().single();
  if (error || !data) return res.status(404).json({ error: "Job not found or not yours to edit" });
  res.json({ job: data });
});

/* DELETE /api/digihub/jobs/:id — owner only */
app.delete("/api/digihub/jobs/:id", requireAuth, async (req, res) => {
  const { error } = await supabase.from("digihub_jobs").delete().eq("id", req.params.id).eq("business_id", req.user.id);
  if (error) return res.status(500).json({ error: "Delete failed" });
  res.json({ success: true });
});

/* POST /api/digihub/jobs/:id/apply */
app.post("/api/digihub/jobs/:id/apply", requireAuth, async (req, res) => {
  // Real gating — the pricing page promises free tier is "view only" and
  // paid tiers can "apply to jobs," but nothing previously checked this;
  // any signed-in user could apply regardless of plan.
  const { data: profileRow } = await supabase.from("profiles").select("plan").eq("id", req.user.id).maybeSingle();
  const plan = profileRow?.plan || "free";
  if (plan === "free") {
    return res.status(403).json({ error: "Applying to jobs requires a paid DigiHub plan. Upgrade to apply.", limitReached: true, upgradeRequired: true });
  }

  const { cover_letter } = req.body;
  const { data, error } = await supabase.from("digihub_job_applications").insert({
    job_id: req.params.id,
    applicant_id: req.user.id,
    cover_letter: String(cover_letter || "").slice(0, 2000),
  }).select().single();

  if (error) {
    if (error.code === "23505") return res.status(409).json({ error: "You've already applied to this job." });
    console.error("[DigiHub jobs] apply error:", error.message);
    return res.status(500).json({ error: "Failed to submit application" });
  }
  res.json({ application: data });
});

/* GET /api/digihub/jobs/applied — job IDs the current user has applied to */
app.get("/api/digihub/jobs/applied", requireAuth, async (req, res) => {
  const { data, error } = await supabase.from("digihub_job_applications").select("job_id").eq("applicant_id", req.user.id);
  if (error) return res.status(500).json({ error: "Failed to fetch applications" });
  res.json({ jobIds: (data || []).map(d => d.job_id) });
});

/* POST /api/digihub/jobs/:id/save and DELETE — bookmark toggle */
app.post("/api/digihub/jobs/:id/save", requireAuth, async (req, res) => {
  const { error } = await supabase.from("digihub_saved_jobs").insert({ user_id: req.user.id, job_id: req.params.id });
  if (error && error.code !== "23505") return res.status(500).json({ error: "Failed to save job" });
  res.json({ success: true });
});
app.delete("/api/digihub/jobs/:id/save", requireAuth, async (req, res) => {
  const { error } = await supabase.from("digihub_saved_jobs").delete().eq("user_id", req.user.id).eq("job_id", req.params.id);
  if (error) return res.status(500).json({ error: "Failed to unsave job" });
  res.json({ success: true });
});

/* GET /api/digihub/jobs/saved — job IDs the current user has bookmarked */
app.get("/api/digihub/jobs/saved", requireAuth, async (req, res) => {
  const { data, error } = await supabase.from("digihub_saved_jobs").select("job_id").eq("user_id", req.user.id);
  if (error) return res.status(500).json({ error: "Failed to fetch saved jobs" });
  res.json({ jobIds: (data || []).map(d => d.job_id) });
});

/* GET /api/digihub/jobs/mine — postings created by the current business account */
app.get("/api/digihub/jobs/mine", requireAuth, async (req, res) => {
  const { data, error } = await supabase.from("digihub_jobs").select("*").eq("business_id", req.user.id).order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: "Failed to fetch your postings" });
  res.json({ jobs: data || [] });
});

/* ═══════════════════════════════════════════════════════════
   FEATURE: DIGIHUB CONTENT SCHEDULER
   NOTE: this stores and tracks scheduled posts. Actually publishing
   to Instagram/LinkedIn/etc. requires registering a developer app
   with each platform and storing per-business OAuth tokens — an
   infrastructure step that has to happen before the "publish" leg
   of this can go live. See migrations/digihub_content_scheduler.sql.
   ═══════════════════════════════════════════════════════════ */

/* GET /api/digihub/scheduled-posts */
app.get("/api/digihub/scheduled-posts", requireAuth, async (req, res) => {
  const { data, error } = await supabase.from("digihub_scheduled_posts")
    .select("*").eq("business_id", req.user.id).order("scheduled_for", { ascending: false });
  if (error) { console.error("[DigiHub scheduler] fetch error:", error.message); return res.status(500).json({ error: "Failed to fetch scheduled posts" }); }
  res.json({ posts: data || [] });
});

/* POST /api/digihub/scheduled-posts */
app.post("/api/digihub/scheduled-posts", requireAuth, async (req, res) => {
  const { platform, caption, hashtags, scheduled_for, status, image_url } = req.body;
  if (!platform || !caption || !scheduled_for) return res.status(400).json({ error: "platform, caption, and scheduled_for are required" });

  // Real quota enforcement — "10 posts", "60 posts", "unlimited" on the
  // pricing page was previously just copy; nothing checked it.
  const { data: profileRow } = await supabase.from("profiles").select("plan").eq("id", req.user.id).maybeSingle();
  const plan = profileRow?.plan || "free";
  if (plan !== "admin") {
    const limit = DH_POST_LIMITS[plan] ?? DH_POST_LIMITS.free;
    if (limit !== Infinity) {
      const { count } = await supabase.from("digihub_scheduled_posts")
        .select("id", { count: "exact", head: true })
        .eq("business_id", req.user.id).neq("status", "published");
      if ((count || 0) >= limit) {
        return res.status(403).json({ error: `You've reached your plan's limit of ${limit} active scheduled posts. Publish or delete some, or upgrade for more.`, limitReached: true });
      }
    }
  }

  const { data, error } = await supabase.from("digihub_scheduled_posts").insert({
    business_id: req.user.id,
    platform,
    caption: String(caption).slice(0, 2200),
    hashtags: (hashtags || "").slice(0, 300),
    image_url: image_url || null,
    scheduled_for,
    status: status === "draft" ? "draft" : "scheduled",
  }).select().single();

  if (error) { console.error("[DigiHub scheduler] insert error:", error.message); return res.status(500).json({ error: "Failed to schedule post" }); }
  res.json({ post: data });
});

/* PATCH /api/digihub/scheduled-posts/:id — edit or change status */
app.patch("/api/digihub/scheduled-posts/:id", requireAuth, async (req, res) => {
  const allowed = ["platform", "caption", "hashtags", "scheduled_for", "status", "image_url"];
  const updates = {};
  for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k];

  const { data, error } = await supabase.from("digihub_scheduled_posts")
    .update(updates).eq("id", req.params.id).eq("business_id", req.user.id).select().single();
  if (error || !data) return res.status(404).json({ error: "Post not found or not yours to edit" });
  res.json({ post: data });
});

/* DELETE /api/digihub/scheduled-posts/:id */
app.delete("/api/digihub/scheduled-posts/:id", requireAuth, async (req, res) => {
  const { error } = await supabase.from("digihub_scheduled_posts").delete().eq("id", req.params.id).eq("business_id", req.user.id);
  if (error) return res.status(500).json({ error: "Delete failed" });
  res.json({ success: true });
});

/* ═══════════════════════════════════════════════════════════
   DIGIHUB QUOTA ENFORCEMENT
   Previously every quota on the DigiHub pricing page (Prompt Space
   10/50/unlimited per month, Image Generator 5/25/100 per month,
   Scheduler post counts, Job Board apply-gating) was pure marketing
   copy — nothing anywhere checked or enforced them, so a free user
   could do all of it without limit. This section makes the ones that
   can be safely enforced without touching the shared cross-product
   /api/mini-chat endpoint actually real.
   ═══════════════════════════════════════════════════════════ */
const DH_IMAGE_LIMITS  = { free: 5, dh_monthly: 25, dh_yearly: 100, dh_starter: 30, dh_premium: 100, dh_pro: Infinity };
const DH_POST_LIMITS   = { free: 10, dh_monthly: 60, dh_yearly: Infinity, dh_starter: 30, dh_premium: Infinity, dh_pro: Infinity };
const DH_PROMPT_LIMITS = { free: 10, dh_monthly: 50, dh_yearly: Infinity, dh_starter: 100, dh_premium: Infinity, dh_pro: Infinity };

function currentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/* POST /api/digihub/usage/check — called by Prompt Space (and any future
   feature routed through the shared /api/mini-chat endpoint) BEFORE the
   actual AI call, purely to check and increment a quota counter. Kept
   completely separate from mini-chat itself so this never risks breaking
   the same endpoint used by Gen-E/HyperX/Units. */
app.post("/api/digihub/usage/check", requireAuth, async (req, res) => {
  const { feature } = req.body;
  if (feature !== "prompt_space") return res.status(400).json({ error: "Unknown feature" });

  const { data: profileRow } = await supabase.from("profiles").select("plan").eq("id", req.user.id).maybeSingle();
  const plan = profileRow?.plan || "free";
  if (plan === "admin") return res.json({ allowed: true, remaining: Infinity });

  const limit = DH_PROMPT_LIMITS[plan] ?? DH_PROMPT_LIMITS.free;
  const period = currentPeriod();

  const { data: existing } = await supabase.from("dh_feature_usage")
    .select("count").eq("user_id", req.user.id).eq("feature", feature).eq("period", period).maybeSingle();
  const currentCount = existing?.count || 0;

  if (limit !== Infinity && currentCount >= limit) {
    return res.status(403).json({ error: `You've used all ${limit} Prompt Space generations included in your plan this month. Upgrade for more.`, limitReached: true });
  }

  await supabase.from("dh_feature_usage").upsert(
    { user_id: req.user.id, feature, period, count: currentCount + 1, updated_at: new Date().toISOString() },
    { onConflict: "user_id,feature,period" }
  );
  res.json({ allowed: true, remaining: limit === Infinity ? Infinity : limit - currentCount - 1 });
});


/* ═══════════════════════════════════════════════════════════
   FEATURE: DIGIHUB BRAND VOICE — real server-side storage
   Previously stored almost entirely in the browser's localStorage
   (only `industry` reached the profiles table), which meant no
   backend tool could read it, so nothing could actually use it.
   Now it's a real row per business, and getBrandVoiceContext() below
   auto-injects it into every AI generation call for that user.
   ═══════════════════════════════════════════════════════════ */
app.get("/api/digihub/brand-voice", requireAuth, async (req, res) => {
  const { data, error } = await supabase.from("dh_brand_voice").select("*").eq("user_id", req.user.id).maybeSingle();
  if (error) return res.status(500).json({ error: "Failed to fetch brand voice" });
  res.json({ brandVoice: data || null });
});

app.post("/api/digihub/brand-voice", requireAuth, async (req, res) => {
  const { brandName, industry, usp, tone, audience, platforms, avoidWords, brandKeywords, emoji, postFreq } = req.body;
  if (!brandName?.trim()) return res.status(400).json({ error: "Brand name is required" });

  const row = {
    user_id: req.user.id,
    brand_name: brandName.trim(),
    industry: industry || "",
    usp: usp || "",
    tone: tone || "",
    audience: audience || "",
    platforms: Array.isArray(platforms) ? platforms : [],
    avoid_words: avoidWords || "",
    brand_keywords: brandKeywords || "",
    emoji_style: emoji || "",
    post_freq: postFreq || "",
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from("dh_brand_voice").upsert(row, { onConflict: "user_id" }).select().maybeSingle();
  if (error) { console.error("[Brand Voice] save error:", error.message); return res.status(500).json({ error: "Failed to save brand voice" }); }

  // Keep the legacy profiles.industry field in sync since other parts of
  // the app may still read it.
  await supabase.from("profiles").update({ industry: industry || "", updated_at: new Date().toISOString() }).eq("id", req.user.id);

  res.json({ brandVoice: data });
});

/* Builds the same style of context block BrandVoiceSetup.jsx's
   buildBrandContext() produces client-side, so every AI call gets
   identical formatting whether triggered from the frontend or here. */
async function getBrandVoiceContext(userId) {
  try {
    const { data } = await supabase.from("dh_brand_voice").select("*").eq("user_id", userId).maybeSingle();
    if (!data || !data.brand_name) return "";
    const lines = [
      data.brand_name && `Brand: ${data.brand_name}`,
      data.industry && `Industry: ${data.industry}`,
      data.tone && `Tone: ${data.tone}`,
      data.audience && `Target audience: ${data.audience}`,
      data.usp && `USP: ${data.usp}`,
      data.platforms?.length && `Active platforms: ${data.platforms.join(", ")}`,
      data.avoid_words && `Avoid these words/topics: ${data.avoid_words}`,
      data.brand_keywords && `Always mention: ${data.brand_keywords}`,
    ].filter(Boolean);
    return lines.length ? `\n\nBRAND VOICE (apply this to every output unless the user explicitly overrides it):\n${lines.join("\n")}` : "";
  } catch (e) {
    console.warn("[Brand Voice] context lookup failed:", e.message);
    return "";
  }
}

/* ═══════════════════════════════════════════════════════════
   FEATURE: DIGIHUB TALENT HUB (shortlist + intro requests)
   UPDATE: profiles are no longer a hardcoded fake showcase — see the
   real GET/POST/DELETE /api/digihub/talent endpoints and
   migrations/digihub_talent_profiles.sql below. Shortlist/request
   endpoints are unchanged; they already worked against a talent_id,
   which now refers to a real digihub_talent_profiles.user_id.
   ═══════════════════════════════════════════════════════════ */

app.get("/api/digihub/talent/shortlist", requireAuth, async (req, res) => {
  const { data, error } = await supabase.from("digihub_talent_shortlist").select("talent_id").eq("business_id", req.user.id);
  if (error) return res.status(500).json({ error: "Failed to fetch shortlist" });
  res.json({ talentIds: (data || []).map(d => d.talent_id) });
});

app.post("/api/digihub/talent/:id/shortlist", requireAuth, async (req, res) => {
  const { talentName } = req.body;
  const { error } = await supabase.from("digihub_talent_shortlist").insert({ business_id: req.user.id, talent_id: req.params.id, talent_name: talentName || "" });
  if (error && error.code !== "23505") return res.status(500).json({ error: "Failed to save to shortlist" });
  res.json({ success: true });
});

app.delete("/api/digihub/talent/:id/shortlist", requireAuth, async (req, res) => {
  const { error } = await supabase.from("digihub_talent_shortlist").delete().eq("business_id", req.user.id).eq("talent_id", req.params.id);
  if (error) return res.status(500).json({ error: "Failed to remove from shortlist" });
  res.json({ success: true });
});

app.post("/api/digihub/talent/:id/request", requireAuth, async (req, res) => {
  const { talentName, message } = req.body;
  const { data, error } = await supabase.from("digihub_talent_requests").insert({
    business_id: req.user.id, talent_id: req.params.id, talent_name: talentName || "", message: (message || "").slice(0, 1000),
  }).select().single();
  if (error) { console.error("[Talent Hub] request error:", error.message); return res.status(500).json({ error: "Failed to send introduction request" }); }
  res.json({ request: data });
});

/* GET /api/digihub/talent — real, opt-in candidate directory.
   Returns only profiles where is_listed = true. Empty array (not fake
   data) if nobody has opted in yet for a given filter. */
app.get("/api/digihub/talent", requireAuth, async (req, res) => {
  const { data, error } = await supabase.from("digihub_talent_profiles")
    .select("*").eq("is_listed", true).order("updated_at", { ascending: false });
  if (error) return res.status(500).json({ error: "Failed to fetch talent directory" });
  res.json({ talent: data || [] });
});

/* GET /api/digihub/talent/me — the caller's own listing, if any (used to
   pre-fill the opt-in form and show "you're listed" state). */
app.get("/api/digihub/talent/me", requireAuth, async (req, res) => {
  const { data, error } = await supabase.from("digihub_talent_profiles").select("*").eq("user_id", req.user.id).maybeSingle();
  if (error) return res.status(500).json({ error: "Failed to fetch your listing" });
  res.json({ profile: data || null });
});

/* POST /api/digihub/talent/me — create or update the caller's own listing */
app.post("/api/digihub/talent/me", requireAuth, async (req, res) => {
  const { fullName, skill, experience, location, bio, tags } = req.body;
  if (!fullName?.trim() || !skill?.trim()) return res.status(400).json({ error: "Name and skill category are required" });

  const row = {
    user_id: req.user.id,
    full_name: fullName.trim(),
    skill: skill.trim(),
    experience: experience || "Fresher",
    location: location || "",
    bio: (bio || "").slice(0, 500),
    tags: Array.isArray(tags) ? tags.slice(0, 10) : [],
    is_listed: true,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from("digihub_talent_profiles").upsert(row, { onConflict: "user_id" }).select().maybeSingle();
  if (error) { console.error("[Talent Hub] listing save error:", error.message); return res.status(500).json({ error: "Failed to save your listing" }); }
  res.json({ profile: data });
});

/* DELETE /api/digihub/talent/me — unlist (soft-delete, keeps history) */
app.delete("/api/digihub/talent/me", requireAuth, async (req, res) => {
  const { error } = await supabase.from("digihub_talent_profiles").update({ is_listed: false }).eq("user_id", req.user.id);
  if (error) return res.status(500).json({ error: "Failed to unlist" });
  res.json({ unlisted: true });
});

/* GET /api/digihub/analytics/overview — real counts derived from actual
   data (scheduled posts, job board activity). NOTE: reach/impressions/
   engagement-rate metrics are NOT included here because there is no
   real source for them yet — that requires posts to actually publish
   to connected social platforms (see digihub_content_scheduler.sql
   notes). Showing fabricated numbers for those would be misleading,
   so this only reports what's genuinely measurable today. */
app.get("/api/digihub/analytics/overview", requireAuth, async (req, res) => {
  try {
    const [postsRes, jobsRes] = await Promise.all([
      supabase.from("digihub_scheduled_posts").select("platform, status, scheduled_for").eq("business_id", req.user.id),
      supabase.from("digihub_jobs").select("id, status, created_at").eq("business_id", req.user.id),
    ]);

    const posts = postsRes.data || [];
    const jobs  = jobsRes.data || [];

    const byPlatform = {};
    posts.forEach(p => { byPlatform[p.platform] = (byPlatform[p.platform] || 0) + 1; });

    const jobIds = jobs.map(j => j.id);
    let applicantCount = 0;
    if (jobIds.length) {
      const { count } = await supabase.from("digihub_job_applications").select("id", { count: "exact", head: true }).in("job_id", jobIds);
      applicantCount = count || 0;
    }

    res.json({
      totals: {
        scheduledPosts: posts.filter(p => p.status === "scheduled").length,
        publishedPosts: posts.filter(p => p.status === "published").length,
        draftPosts:     posts.filter(p => p.status === "draft").length,
        openJobs:       jobs.filter(j => j.status === "open").length,
        totalApplicants: applicantCount,
      },
      byPlatform,
    });
  } catch (err) {
    console.error("[DigiHub analytics] error:", err.message);
    res.status(500).json({ error: "Failed to load analytics" });
  }
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
        from: "GEN-E Career AI <noreply@nugens.in>",
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
            <a href="https://gene.nugens.in" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#e8185d;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px;">
              Open GEN-E →
            </a>
            <hr style="margin:28px 0;border:none;border-top:1px solid #f0f0f0;">
            <p style="font-size:11px;color:#ccc;">You're receiving this because you signed up for GEN-E.
              <a href="https://gene.nugens.in" style="color:#ccc;">Unsubscribe</a></p>
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
app.post("/api/mini-chat", optionalAuth, async (req, res) => {
  const { message, history = [], product, userType, goal, businessNeed, max_tokens: reqMaxTokens, stream: wantStream } = req.body;
  if (!message) return res.status(400).json({ error: "Message required" });

  const PRODUCT_IDENTITY = {
    nugens: {
      name:  "Nugens AI",
      role:  "You are the Nugens AI assistant — the central assistant for the entire Nugens platform.",
      scope: `You help users navigate and get the most from all four Nugens products:\n- Gen-E AI: AI career intelligence, resume analysis, job matching, skill gap analysis, interview prep, career roadmaps, salary benchmarking\n- HyperX: Professional learning platform — workplace skills courses, certifications, business training programmes\n- DigiHub: Digital marketing suite — content planning, AI image generation, brand growth, job board, community, analytics\n- Units: Business production house — brand content production, entrepreneur guidance, startup idea validation, business events, booking production services\nAlso help with: account setup, plan selection, switching between products, general career/business questions.`,
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
      scope: `You specialise EXCLUSIVELY in:\n- Units production services for businesses: brand content videos, product shoots, launch content, corporate events\n- Booking consultations, understanding production packages, turnaround times, pricing\n- Entrepreneur guidance — starting a business, brand identity, content strategy for founders\n- Idea validation frameworks — testing business ideas before committing capital\n- Business events hosted through Units — workshops, founder meetups, brand-building sessions\n- Content creation for new businesses — what assets to prioritise\n- AI guidance tools inside Units for business planning\nUnits does NOT offer wedding or personal-event services — if asked, politely explain Units is a business production platform.\nMention DigiHub for ongoing marketing or HyperX for business skill courses when directly relevant.`,
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
    // The floating widget (stream:true) gets STRICT mini rules — it must feel
    // like a mini assistant, not the full AI (bug report 4-07-2026, repeated
    // in every product section). In-page tools (ContentPlanner, BrandTools,
    // PromptSpace…) call this endpoint non-streaming and need longer output.
    ...(wantStream ? [
      "RESPONSE STYLE — YOU ARE A MINI ASSISTANT, NOT THE FULL AI:",
      "- Respond in 2-3 short sentences MAXIMUM. Never write long multi-section answers.",
      "- No headers, no bullet lists, no multi-paragraph responses. One compact, useful answer.",
      "- If the user explicitly asks for more detail, you may go up to 5 sentences — never more.",
    ] : [
      "RESPONSE STYLE:",
      "- Be direct, specific, and practical.",
    ]),
    userType === "business"
      ? "- Use business language: ROI, team, scale, efficiency, growth"
      : "- Use personal career language: skills, opportunities, your career, your goals",
    "- End with ONE concrete next step, named specifically (a feature or page in this platform).",
    "",
    "CROSS-PRODUCT ROUTING RULE:",
    "- If the question belongs to a DIFFERENT Nugens product, do NOT answer it in full.",
    "- Instead say which product handles it and ASK the user if they'd like to switch — e.g. \"That's handled in DigiHub — want me to point you there?\" Never assume; wait for their confirmation.",
  ].join("\n");

  // Token budget: the floating widget is HARD-CAPPED at 350 regardless of what
  // the caller requests (it could previously request up to 4000, producing
  // full-length answers — the most repeated complaint in the bug report).
  // Non-streaming page tools keep a generous ceiling.
  const miniMaxTokens = wantStream
    ? Math.min(reqMaxTokens || 300, 350)
    : (reqMaxTokens && reqMaxTokens > 420 ? Math.min(reqMaxTokens, 4000) : 420);

  if (!openai) {
    const fallback = buildFallbackReply(message, systemPrompt);
    if (wantStream) {
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.write("data: " + JSON.stringify({ chunk: fallback, done: true, reply: fallback }) + "\n\n");
      res.end();
      return;
    }
    return res.json({ reply: fallback });
  }

  try {
    const messages = [
      ...history.slice(-8).map(m => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    if (!wantStream) {
      // Original behaviour — single JSON reply (used by ContentPlanner, PromptSpace, AIAssistant pages, etc.)
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        max_tokens: miniMaxTokens,
        temperature: 0.65,
      });
      const reply = response.choices[0]?.message?.content || "Sorry, I couldn't get a response.";
      return res.json({ reply });
    }

    // Streaming mode — used by the floating Gen-E Mini popup widget for instant perceived response
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    let clientGone = false;
    req.on("aborted", () => {
      clientGone = true;
    });

    const send = (obj) => {
      if (clientGone) return;
      try { res.write("data: " + JSON.stringify(obj) + "\n\n"); if (typeof res.flush === "function") res.flush(); } catch { clientGone = true; }
    };

    const stream = await withTimeout(() => openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      max_tokens: miniMaxTokens,
      temperature: 0.65,
      stream: true,
    }), 20000);

    let fullText = "";
    try {
      for await (const chunk of stream) {
        if (clientGone) {
          stream.controller?.abort?.();
          break;
        }

        const delta = chunk.choices[0]?.delta?.content || "";

        if (delta) {
          fullText += delta;
          send({ chunk: delta });
        }
      }
    } catch (streamErr) {
      console.error("Mini stream failed:", streamErr.message);
    }
    if (!clientGone) {
      const finalReply = fullText || buildFallbackReply(message, systemPrompt);
      if (!fullText) send({ chunk: finalReply });
      send({ done: true, reply: finalReply });
      res.end();
    }
  } catch (err) {
    const isDisconnect = err.message?.includes("Premature close") || err.message?.includes("aborted") || err.message?.includes("ERR_HTTP2_STREAM_CANCEL");
    if (isDisconnect) {
      return;
    }
    console.error("[Mini chat] error:", err.message);
    try {
      const fallback = await callAI(systemPrompt, [{ role:"user", content:message }], miniMaxTokens || 420);
      if (res.headersSent) {
        res.write("data: " + JSON.stringify({ chunk: fallback, done: true, reply: fallback }) + "\n\n");
        res.end();
      } else {
        res.json({ reply: fallback });
      }
    } catch(e2) {
      const finalFallback = buildFallbackReply(message, systemPrompt);
      if (res.headersSent) {
        res.write("data: " + JSON.stringify({ chunk: finalFallback, done: true, reply: finalFallback }) + "\n\n");
        res.end();
      } else {
        res.json({ reply: finalFallback });
      }
    }
  }
});


/* ── POST /api/business-chat ── Dedicated endpoint for BusinessChat UI ── */
app.post("/api/business-chat", optionalAuth, async (req, res) => {
  const { message, history = [], tool = "jd", session_id } = req.body;
  if (!message) return res.status(400).json({ error: "Message required" });

  const TOOL_PROMPTS = {
    jd:        "You are a JD Generator for Indian businesses. Generate complete, market-aligned job descriptions. Include: role overview, key responsibilities, required skills, nice-to-have skills, experience level, salary range in INR, and 8-10 role-specific interview questions. Always be thorough and specific.",
    hiring:    "You are a Hiring Intelligence AI for Indian businesses. Provide full hiring strategy: skill breakdown by category, salary ranges by experience tier in INR, red flags to screen for, best sourcing channels in India (Naukri, LinkedIn, AngelList, referrals), and a step-by-step evaluation framework.",
    team:      "You are a Team Skill Mapping AI. Analyse team composition, identify individual strengths, find collective skill gaps vs company goals, flag redundancies, and create a prioritised training roadmap with specific courses and resources.",
    workforce: "You are a Workforce Planning AI for Indian startups. Create phase-by-phase hiring roadmaps based on company stage and growth targets. Cover: priority hires by quarter, budget estimates in INR, org structure options, build-vs-hire recommendations.",
    salary:    "You are a Salary Benchmark AI for the Indian job market. Provide detailed salary data by role, city, experience tier, variable pay norms, equity expectations, and peer company benchmarks. Use INR. Cover major cities: Bangalore, Mumbai, Delhi, Hyderabad, Chennai, Pune, Coimbatore.",
    interview: "You are an Interview Kit AI for businesses. Generate complete interview kits: screening questions, technical questions, STAR-format behavioural questions, case study scenarios, and a scoring rubric. Tailor to the specific role and company type.",
  };

  const systemPrompt = (TOOL_PROMPTS[tool] || TOOL_PROMPTS.jd) + `

RULES:
- Be specific, comprehensive, and India-market-aware.
- Use structured output with headers and bullet points.
- If essential context (role title, company info) is missing, ask ONE focused question.
- ALWAYS provide substantive, actionable output — never refuse or say you cannot help.
- Respond as a professional business consultant.`;

  if (!openai) {
    const fallback = buildFallbackReply(message, systemPrompt);
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.write("data: " + JSON.stringify({ chunk: fallback, done: true, reply: fallback }) + "\n\n");
    res.end();
    return;
  }

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  let clientGone = false;
  req.on("aborted", () => {
    clientGone = true;
  });
  const send = (obj) => { if (clientGone) return; try { res.write("data: " + JSON.stringify(obj) + "\n\n"); } catch { clientGone = true; } };

  try {
    const stream = await withTimeout(() => openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...history.slice(-12),
        { role: "user", content: message },
      ],
      max_tokens: 1800,
      temperature: 0.7,
      stream: true,
    }), 20000);

    let fullText = "";
    try {
      for await (const chunk of stream) {
        if (clientGone) {
          stream.controller?.abort?.();
          break;
        }

        const delta = chunk.choices[0]?.delta?.content || "";

        if (delta) {
          fullText += delta;
          send({ chunk: delta });
        }
      }
    } catch (streamErr) {
      console.error("Mini stream failed:", streamErr.message);
    }
    if (!clientGone) {
      const finalReply = fullText || buildFallbackReply(message, systemPrompt);
      if (!fullText) send({ chunk: finalReply });
      send({ done: true, reply: finalReply });
      res.end();
    }
  } catch (err) {
    const isDisconnect = err.message?.includes("Premature close") || err.message?.includes("aborted");
    if (isDisconnect || clientGone) return;
    console.error("[Business chat] OpenAI error:", err.message);
    try {
      const fallback = await callAI(systemPrompt, [...history.slice(-6), { role: "user", content: message }], 1800);
      send({ chunk: fallback });
      send({ done: true });
      if (!clientGone) res.end();
    } catch (e2) {
      const finalFallback = buildFallbackReply(message, systemPrompt);
      send({ chunk: finalFallback });
      send({ done: true });
      if (!clientGone) res.end();
    }
  }
});
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

    // ─── INDIVIDUAL TOOLS ───
    // ... (existing tools)

    generate_resume: (i) => `You are an expert ATS resume writer and technical recruiter with 15 years of experience screening resumes for the exact role: "${i.targetRole}". Generate a detailed, highly ATS-friendly, recruiter-oriented resume that would pass both automated ATS keyword screening AND a 6-second human recruiter scan.

CRITICAL FORMATTING RULES (violating any of these breaks the output):
- Output PLAIN markdown body text ONLY. NEVER wrap the response in a code block or triple backticks (\`\`\`) — start directly with "## PROFESSIONAL SUMMARY" and nothing before it.
- NEVER restate the candidate's name, email, phone, or location anywhere in the body — the document header already shows these. Repeating them is a formatting bug, not a style choice.
- NEVER write bracketed placeholder text like "[List any relevant projects here]" or "[Add more details]". If there is genuinely nothing to put in a section, omit that section's header entirely rather than leave a placeholder.
- Use "**text**" for bold ONLY around job titles and company names directly under "## PROFESSIONAL EXPERIENCE" — nowhere else.
- Use these exact section headers, in this order, only including a section if there's real content for it:
## PROFESSIONAL SUMMARY
## CORE SKILLS
## PROFESSIONAL EXPERIENCE
## EDUCATION
## PROJECTS / CERTIFICATIONS

CONTENT QUALITY RULES — this is what actually improves ATS pass rate and recruiter response rate:
- Use ONLY the information provided below. Do NOT invent companies, dates, universities, numbers, or achievements that weren't given.
- Every single specific data point provided below — every metric, every named project, every quantified result — MUST appear somewhere in the resume, ideally as its own bullet under Professional Experience or Projects. Never let provided achievement data go unused.
- PROFESSIONAL SUMMARY: 2-3 sentences, written specifically for "${i.targetRole}" — name the role/domain, years of experience, and the single strongest quantified achievement provided. Never generic ("detail-oriented professional") without being anchored to the actual target role and real data.
- CORE SKILLS: prioritize skills and tools that would realistically appear in a real "${i.targetRole}" job description (i.e., ATS keyword-match the target role), pulling first from the candidate's own stated skills, then reasonable adjacent tools/terms a recruiter would expect for that title — never invent specific named technologies the candidate didn't mention, but standard-industry-term phrasing of what they DID mention is expected (e.g., if they said "built websites," it's fair to phrase that as "Web Development").
- PROFESSIONAL EXPERIENCE bullets: every bullet should follow "[Strong action verb] + [what was done] + [quantified outcome/impact]" — never a vague activity statement with no result attached. If the candidate gave a metric (%, number, scale), it MUST be the anchor of a bullet, not omitted in favor of generic filler bullets.
- Bullets should read the way a recruiter scanning for "${i.targetRole}" keywords would want: specific technologies/methods named, outcomes quantified, scope indicated (team size, user scale, timeframe) wherever the candidate provided that context.
- EDUCATION: expand beyond just the degree abbreviation if more context was given (field of study, institution, year) — never leave it as a bare "**Bachelor of Engineering (BE)**" with nothing else if more was provided.

FULL NAME: ${i.fullName}
TARGET ROLE: ${i.targetRole}
CURRENT ROLE: ${i.currentRole || "Not specified"}
EXPERIENCE LEVEL: ${i.experienceLevel || "Not specified"}
LOCATION: ${i.location || "Not specified"}
EMAIL: ${i.email || ""}
PHONE: ${i.phone || ""}
KEY SKILLS: ${i.skills || "Not specified"}
EDUCATION: ${i.education || "Not specified"}
WORK EXPERIENCE: ${i.experience || "Not specified"}
KEY ACHIEVEMENTS / PROJECTS: ${i.achievements || "Not specified"}

Generate the complete resume now, starting directly with "## PROFESSIONAL SUMMARY" — no preamble, no code fence, no restated contact info.`,

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

  //-- grok resume code

  const promptFn = TOOL_PROMPTS[tool];
if (!promptFn) return res.status(400).json({ error: "Unknown tool: " + tool });

// ─────────────────────────────────────────────────────────────
// SPECIAL HANDLING: Resume Generation + PDF (Individual + Business)
// ─────────────────────────────────────────────────────────────
if (tool === "generate_resume") {
  try {
    const systemPrompt = promptFn(inputs);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Generate the resume now." }
      ],
      max_tokens: 2000,
      temperature: 0.35,
    });

    let content_md = completion.choices[0]?.message?.content?.trim();
    if (!content_md) {
      return res.status(500).json({ error: "Failed to generate resume content" });
    }

    // BUG FIX: the AI occasionally wraps its response in a code fence
    // (```...```) despite being told not to — a well-known LLM habit.
    // Previously this sailed straight through into both the PDF and the
    // frontend's Live Preview as literal "```" text. Strip any fence
    // lines and leading/trailing backticks defensively.
    content_md = content_md
      .replace(/^```[a-z]*\n?/i, "")
      .replace(/\n?```\s*$/i, "")
      .split("\n")
      .filter(line => line.trim() !== "```")
      .join("\n")
      .trim();

    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const safeName = (inputs.fullName || "resume").replace(/[^a-zA-Z0-9]/g, "_");
    const pdfFileName = `resume_${safeName}_${Date.now()}.pdf`;
    const pdfPath = path.join(uploadDir, pdfFileName);

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 45, bottom: 45, left: 50, right: 50 },
    });

    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    // Header
    doc.fontSize(20).font("Helvetica-Bold").fillColor("#111").text(inputs.fullName || "Resume", { align: "center" });
    doc.moveDown(0.3);

    const contact = [inputs.email, inputs.phone, inputs.location].filter(Boolean).join("   •   ");
    if (contact) {
      doc.fontSize(10).font("Helvetica").fillColor("#444").text(contact, { align: "center" });
    }
    doc.moveDown(0.6);

    // Content
    const sections = content_md.split("## ").filter(Boolean);
    sections.forEach((section) => {
      const [rawTitle, ...body] = section.split("\n");
      const title = rawTitle.trim().toUpperCase();
      if (!title) return;

      doc.fontSize(11).font("Helvetica-Bold").fillColor("#e8185d").text(title);
      doc.moveDown(0.2);
      doc.fontSize(10).font("Helvetica").fillColor("#222");

      body.forEach((line) => {
        const t = line.trim();
        if (!t || t === "```") return; // BUG FIX: stray code-fence lines were printing as literal backticks
        if (t.startsWith("- ") || t.startsWith("• ")) {
          const bulletText = t.replace(/^[-•]\s*/, "");
          renderBoldAwareLine(doc, "• " + bulletText, { indent: 12 });
        } else {
          renderBoldAwareLine(doc, t, {});
        }
      });
      doc.moveDown(0.5);
    });

    doc.end();

    await new Promise((resolve, reject) => {
      stream.on("finish", resolve);
      stream.on("error", (err) => {
        console.error("PDF stream error:", err);
        reject(err);
      });
    });

    const pdfRelativePath = `/uploads/${pdfFileName}`;

    // Save to Vault
    if (req.user?.id && supabase) {
      await supabase.from("saved_artifacts").insert({
        user_id: req.user.id,
        type: "resume",
        title: `Resume - ${inputs.targetRole || "Untitled"}`,
        content_md,
        pdf_path: pdfRelativePath,
      });
    }

    if (req.user && req.profile?.plan === "free") {
      incrementUsage(req.user.id);
    }

    return res.json({
      success: true,
      content_md,
      pdf_url: `https://nugens-platform-production.up.railway.app${pdfRelativePath}`,
    });

  } catch (err) {
    console.error("generate_resume error:", err.message);
    return res.status(500).json({ error: "Resume generation failed", details: err.message });
  }
}
//grok code ends


  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  let clientGone = false;
  req.on("aborted", () => {
    clientGone = true;
  });

  const send = (obj) => {
    if (clientGone) return;
    try { res.write("data: " + JSON.stringify(obj) + "\n\n"); if (typeof res.flush === "function") res.flush(); } catch { clientGone = true; }
  };

  let fullText = "";

  try {
    const systemPrompt = promptFn(inputs);

    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Generate the analysis now." }
      ],
      max_tokens: 1200,
      temperature: 0.7,
      stream: true,
    });

    try {
      for await (const chunk of stream) {
        if (clientGone) {
          stream.controller?.abort?.();
          break;
        }

        const delta = chunk.choices[0]?.delta?.content || "";

        if (delta) {
          fullText += delta;
          send({ chunk: delta });
        }
      }
    } catch (streamErr) {
      console.error("Mini stream failed:", streamErr.message);
    }

    if (!clientGone) {
      send({ done: true });
      res.end();

      if (req.user && req.profile?.plan === "free") {
        incrementUsage(req.user.id);
      }
    }

  } catch (err) {
    console.error("Gene tool error:", err.message);

    const realDisconnect =
      req.aborted ||
      err.code === "ECONNRESET";

    if (realDisconnect) {
      try { res.end(); } catch {}
      return;
    }

    send({ chunk: "Connection interrupted. Please try again." });
    send({ done: true });

    try {
      res.end();
    } catch {}
  }
});


// ============================================================
// ADD THESE ROUTES TO backend/server.js
// DigiHub - Image Generation + Community endpoints
// ============================================================

// ─── Imports to add at top of server.js ───
// (openai is already imported)

// ─── DigiHub: AI Image Generation ───────────────────────────
app.post('/api/digihub/generate-image', requireAuth, async (req, res) => {
  const { prompt, size: sizeStr, style } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt required' });

  // Real quota enforcement — previously "5/month", "25/month", "100/month"
  // on the pricing page was unbacked; anyone could generate unlimited
  // images regardless of plan. Counts actual rows this calendar month.
  // NOTE: requireAuth alone doesn't populate req.profile (only checkUsage
  // does) — fetch the plan directly rather than assume it's already set.
  const { data: profileRow } = await supabase.from("profiles").select("plan").eq("id", req.user.id).maybeSingle();
  const plan = profileRow?.plan || "free";
  if (plan !== "admin") {
    const limit = DH_IMAGE_LIMITS[plan] ?? DH_IMAGE_LIMITS.free;
    if (limit !== Infinity) {
      const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
      const { count } = await supabase.from("dh_generated_images")
        .select("id", { count: "exact", head: true })
        .eq("user_id", req.user.id).gte("created_at", monthStart.toISOString());
      if ((count || 0) >= limit) {
        return res.status(403).json({ error: `You've used all ${limit} images included in your plan this month. Upgrade for more.`, limitReached: true });
      }
    }
  }

  // Parse size string to DALL-E format
  let size = '1024x1024';
  if (sizeStr?.includes('1792x1024') || sizeStr?.includes('16:9')) size = '1792x1024';
  if (sizeStr?.includes('1024x1792') || sizeStr?.includes('9:16')) size = '1024x1792';

  // Auto-inject Brand Voice — this is the fix that makes DigiHub's image
  // tool actually different from opening ChatGPT/Gemini directly: it
  // knows the business's brand without the user re-typing it every time.
  const brandContext = await getBrandVoiceContext(req.user.id);

  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: `${prompt}. Style: ${style || 'Digital Art'}. High quality, professional design.${brandContext}`,
      n: 1,
      size,
      quality: 'standard',
    });
    res.json({ url: response.data[0].url, brandVoiceApplied: !!brandContext });
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


/* ── POST /api/digihub-generate ── DigiHub JSON content generation ── */
app.post("/api/digihub-generate", requireAuth, async (req, res) => {
  const { message, max_tokens = 2000 } = req.body;
  if (!message) return res.status(400).json({ error: "Message required" });

  // Auto-inject Brand Voice so every tool that routes through this shared
  // endpoint (Bulk Generator, Content Planner, Hashtag suggestions) gets
  // on-brand output without each frontend having to remember to ask for it.
  const brandContext = await getBrandVoiceContext(req.user.id);

  const systemPrompt = `You are a professional content generation AI for DigiHub, a digital marketing platform.
Your ONLY job is to generate the JSON output exactly as requested in the prompt.
CRITICAL RULES:
- Output ONLY valid JSON — no preamble, no explanation, no markdown fences
- Follow the exact JSON structure specified in the prompt
- Generate complete, high-quality, India-relevant content
- Never truncate or cut off the JSON output
- All text content should be practical and ready to post${brandContext}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: message },
      ],
      max_tokens: Math.min(max_tokens, 3000),
      temperature: 0.75,
      response_format: { type: "json_object" },
    });
    const text = response.choices[0]?.message?.content || "{}";
    res.json({ reply: text, brandVoiceApplied: !!brandContext });
  } catch (err) {
    console.error("[DigiHub generate] OpenAI error:", err.message);
    // Groq fallback (no json_object mode, but still works)
    try {
      const fb = await callGroq(
        systemPrompt,
        [{ role:"user", content: message }],
        Math.min(max_tokens, 3000)
      );
      res.json({ reply: fb, brandVoiceApplied: !!brandContext });
    } catch(e2) {
      res.status(500).json({ error: "Generation failed. Please try again." });
    }
  }
});
/* ═══════════════════════════════════════════════════════════
   FEATURE: NUGENS PORTAL CONTACT FORM
   Fixes a critical bug: the Contact page's submit handler was
   `await new Promise(r => setTimeout(r, 1400))` — purely cosmetic,
   never sent anywhere. This is the platform's main lead-capture
   form (general inquiries, partnerships, and the "Talk to us" /
   "Book a discovery call" CTAs across the whole site funnel here).
   No auth required — visitors aren't necessarily signed in.
   ═══════════════════════════════════════════════════════════ */
app.post("/api/contact", async (req, res) => {
  const { name, email, phone, reason, message } = req.body;
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ error: "Name, email, and message are required." });
  }

  const { data, error } = await supabase.from("contact_submissions").insert({
    name: String(name).slice(0, 120),
    email: String(email).slice(0, 200),
    phone: phone ? String(phone).slice(0, 30) : null,
    reason: reason || null,
    message: String(message).slice(0, 2000),
  }).select().single();

  if (error) {
    console.error("[Contact] insert error:", error.message);
    // Still try to email even if the DB write fails — losing the
    // notification AND the record would mean the inquiry vanishes.
  }

  if (process.env.RESEND_API_KEY) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Nugens Contact <noreply@nugens.in>",
          to: [process.env.ADMIN_EMAIL || "jeromjoseph31@gmail.com"],
          reply_to: email,
          subject: `New contact form submission${reason ? ` — ${reason}` : ""}`,
          html: `
            <div style="font-family:sans-serif;max-width:520px;">
              <h2 style="color:#e8185d;">New message from nugens.in/contact</h2>
              <p><b>From:</b> ${name} · ${email} ${phone ? "· " + phone : ""}</p>
              ${reason ? `<p><b>Reason:</b> ${reason}</p>` : ""}
              <div style="background:#fff5f8;border-left:3px solid #e8185d;padding:14px 18px;border-radius:0 8px 8px 0;margin:14px 0;">
                <p style="white-space:pre-wrap;margin:0;">${message}</p>
              </div>
            </div>`,
        }),
      });
    } catch (e) {
      console.error("[Contact] admin email failed:", e.message);
    }
  } else {
    console.warn("[Contact] RESEND_API_KEY not set — submission saved to DB only, no email sent");
  }

  console.log(`✅ Contact form: ${email} (${reason || "general"})`);
  res.json({ success: true, submission: data });
});

/* GET /api/units/guide-progress — Entrepreneur Guide chapter completion */
app.get("/api/units/guide-progress", requireAuth, async (req, res) => {
  const { data } = await supabase.from("units_guide_progress").select("completed").eq("user_id", req.user.id).maybeSingle();
  res.json({ completed: data?.completed || [] });
});

app.post("/api/units/guide-progress", requireAuth, async (req, res) => {
  const { completed } = req.body;
  if (!Array.isArray(completed)) return res.status(400).json({ error: "completed must be an array" });
  const { error } = await supabase.from("units_guide_progress")
    .upsert({ user_id: req.user.id, completed, updated_at: new Date().toISOString() });
  if (error) return res.status(500).json({ error: "Failed to save progress" });
  res.json({ success: true });
});

/* ═══════════════════════════════════════════════════════════
   FEATURE: HYPERX CERTIFICATES
   Fixes a fully fake feature — issueCert() previously just
   simulated a delay and showed an alert(); nothing was ever
   saved. Plan limits are re-checked here server-side since the
   frontend check is trivial to bypass by calling the API directly.
   ═══════════════════════════════════════════════════════════ */
const HX_CERT_LIMITS = {
  free:0, hx_ind_starter:0, hx_ind_premium:2, hx_ind_pro:6, hx_ind_yearly:999,
  hx_biz_starter:2, hx_biz_premium:2, hx_biz_pro:6, hx_biz_yearly:999, admin:999,
};

app.get("/api/hyperx/certificates/mine", requireAuth, async (req, res) => {
  const { data, error } = await supabase.from("hx_certificates").select("*").eq("user_id", req.user.id).order("issued_at", { ascending: false });
  if (error) return res.status(500).json({ error: "Failed to fetch certificates" });
  res.json({ certificates: data || [] });
});

app.post("/api/hyperx/certificates", requireAuth, async (req, res) => {
  const { courseId, courseTitle, courseCategory, courseLevel } = req.body;
  if (!courseId || !courseTitle) return res.status(400).json({ error: "courseId and courseTitle are required" });

  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", req.user.id).maybeSingle();
  const limit = HX_CERT_LIMITS[profile?.plan] ?? 0;
  if (limit === 0) return res.status(403).json({ error: "Certifications aren't available on your current plan." });

  if (limit < 999) {
    const { count } = await supabase.from("hx_certificates").select("id", { count: "exact", head: true }).eq("user_id", req.user.id);
    if ((count || 0) >= limit) return res.status(403).json({ error: `You've used all ${limit} certificates available on your plan this year.` });
  }

  const certNumber = `HX-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const { data, error } = await supabase.from("hx_certificates").insert({
    user_id: req.user.id, course_id: courseId, course_title: courseTitle,
    course_category: courseCategory || null, course_level: courseLevel || null,
    cert_number: certNumber,
  }).select().single();

  if (error) {
    if (error.code === "23505") return res.status(409).json({ error: "A certificate for this course has already been issued." });
    console.error("[HyperX certificates] insert error:", error.message);
    return res.status(500).json({ error: "Failed to issue certificate" });
  }

  console.log(`✅ Certificate issued: ${req.user.email} → ${courseTitle} (${certNumber})`);
  res.json({ certificate: data });
});

/* ═══════════════════════════════════════════════════════════
   FEATURE: VAULT — saved_artifacts CRUD
   Fixes: Vault was resume-only. Now supports multi-type storage
   (resume, roadmap, interview, other) with folder-style filtering.
   ═══════════════════════════════════════════════════════════ */
app.get("/api/artifacts", requireAuth, async (req, res) => {
  const type = req.query.type; // optional: resume | roadmap | interview | other
  let q = supabase.from("saved_artifacts").select("*").eq("user_id", req.user.id);
  if (type) q = q.eq("type", type);
  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: "Failed to fetch artifacts" });
  res.json({ artifacts: data || [] });
});

app.delete("/api/artifacts/:id", requireAuth, async (req, res) => {
  const { error } = await supabase.from("saved_artifacts").delete()
    .eq("id", req.params.id).eq("user_id", req.user.id);
  if (error) return res.status(500).json({ error: "Delete failed" });
  res.json({ deleted: true });
});

/* ── POST /api/gene/roadmap-pdf — generates a roadmap-formatted PDF (not resume layout) ── */
app.post("/api/gene/roadmap-pdf", requireAuth, async (req, res) => {
  const { content, title } = req.body;
  if (!content) return res.status(400).json({ error: "Content required" });
  try {
    const userName = req.profile?.full_name || "";
    const pdfFile = generateRoadmapPDF(content, title || "Career Roadmap", userName);
    res.json({ pdf_url: `/download/${pdfFile}` });
  } catch (err) {
    console.error("Roadmap PDF error:", err.message);
    res.status(500).json({ error: "PDF generation failed" });
  }
});

/* ── PATCH /api/hyperx/lessons/:id — update an existing lesson ──
   Field list corrected to match the actual hx_lessons schema used by
   AdminPanel's lesson form (title/description/section/duration_mins/
   sort_order/is_free/video_url) — the previous version referenced a
   "content" field that doesn't exist on this table. ── */
app.patch("/api/hyperx/lessons/:id", requireAuth, async (req, res) => {
  // Admin-only
  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", req.user.id).maybeSingle();
  if (profile?.plan !== "admin") return res.status(403).json({ error: "Admin access required" });

  const { title, description, section, duration_mins, sort_order, is_free, video_url } = req.body;
  const updates = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (section !== undefined) updates.section = section;
  if (duration_mins !== undefined) updates.duration_mins = Number(duration_mins);
  if (sort_order !== undefined) updates.sort_order = Number(sort_order);
  if (is_free !== undefined) updates.is_free = !!is_free;
  if (video_url !== undefined) updates.video_url = video_url;

  const { data, error } = await supabase.from("hx_lessons").update(updates).eq("id", req.params.id).select().maybeSingle();
  if (error) return res.status(500).json({ error: "Lesson update failed" });
  res.json({ lesson: data });
});

/* ═══════════════════════════════════════════════════════════
   HYPERX CATEGORIES — admin-managed, replaces the hardcoded
   ALL_CATS array so categories can be added/removed without a
   redeploy, and so the Dashboard can group courses by category.
   ═══════════════════════════════════════════════════════════ */
app.get("/api/hyperx/categories", requireAuth, async (req, res) => {
  const { data, error } = await supabase.from("hx_categories").select("*").order("sort_order");
  if (error) return res.status(500).json({ error: "Failed to fetch categories" });
  res.json({ categories: data || [] });
});

app.post("/api/hyperx/categories", requireAuth, async (req, res) => {
  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", req.user.id).maybeSingle();
  if (profile?.plan !== "admin") return res.status(403).json({ error: "Admin access required" });

  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Category name is required" });
  const { count } = await supabase.from("hx_categories").select("*", { count: "exact", head: true });
  const { data, error } = await supabase.from("hx_categories")
    .insert({ name: name.trim(), sort_order: count || 0 }).select().maybeSingle();
  if (error) {
    if (error.code === "23505") return res.status(409).json({ error: "That category already exists" });
    return res.status(500).json({ error: "Failed to create category" });
  }
  res.json({ category: data });
});

app.delete("/api/hyperx/categories/:id", requireAuth, async (req, res) => {
  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", req.user.id).maybeSingle();
  if (profile?.plan !== "admin") return res.status(403).json({ error: "Admin access required" });

  const { error } = await supabase.from("hx_categories").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: "Failed to delete category" });
  res.json({ deleted: true });
});

/* ═══════════════════════════════════════════════════════════
   HYPERX SELF-EVALUATION — lets students rate their own
   proficiency across skill areas so they can track growth
   over time on the Dashboard.
   ═══════════════════════════════════════════════════════════ */
app.get("/api/hyperx/self-evaluation", requireAuth, async (req, res) => {
  const { data, error } = await supabase.from("hx_self_evaluations")
    .select("*").eq("user_id", req.user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) return res.status(500).json({ error: "Failed to fetch self-evaluation" });
  res.json({ evaluation: data || null });
});

app.post("/api/hyperx/self-evaluation", requireAuth, async (req, res) => {
  const { scores } = req.body; // { "Communication": 3, "Leadership": 2, ... } — 1-5 scale
  if (!scores || typeof scores !== "object" || Array.isArray(scores)) {
    return res.status(400).json({ error: "scores object is required" });
  }
  const clean = {};
  for (const [k, v] of Object.entries(scores)) {
    const n = Number(v);
    if (String(k).trim() && n >= 1 && n <= 5) clean[String(k).trim().slice(0, 60)] = n;
  }
  if (Object.keys(clean).length === 0) return res.status(400).json({ error: "No valid scores provided" });

  const { data, error } = await supabase.from("hx_self_evaluations")
    .insert({ user_id: req.user.id, scores: clean }).select().maybeSingle();
  if (error) return res.status(500).json({ error: "Failed to save self-evaluation" });
  res.json({ evaluation: data });
});

app.get("/health", (req, res) =>
  res.json({ status: "ok", version: "GEN-E V6 — Streaming + Jobs + Multi-AI" })
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Gen-E running on port ${PORT}`));