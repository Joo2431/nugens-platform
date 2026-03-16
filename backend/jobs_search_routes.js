// ═══════════════════════════════════════════════════════════════════════════
// PASTE THIS ENTIRE BLOCK INTO backend/server.js
// REPLACE the existing /api/jobs/search route (around line 760)
// ═══════════════════════════════════════════════════════════════════════════
//
// Free job APIs used (no cost):
//   • Adzuna         — 250 req/day free. Covers IN, UK, US, SG, AE (Dubai region)
//   • Remotive       — Completely free, no key. Remote tech jobs worldwide.
//   • Jooble         — Free tier available. Covers IN, UK, MY, SG, AE, US.
//   • The Muse       — Free, no key. US-focused.
// 
// Register free keys at:
//   • Adzuna:  https://developer.adzuna.com (instant approval)
//   • Jooble:  https://jooble.org/api/about (instant approval)
// ───────────────────────────────────────────────────────────────────────────

/* Country code map for Adzuna */
const ADZUNA_COUNTRY = {
  india:     "in",
  uk:        "gb",
  "united kingdom": "gb",
  us:        "us",
  usa:       "us",
  "united states": "us",
  singapore: "sg",
  malaysia:  "my",
  dubai:     "ae",
  uae:       "ae",
};

/* Detect which country the user is asking about */
function detectJobCountry(text) {
  const lower = text.toLowerCase();
  for (const [keyword, code] of Object.entries(ADZUNA_COUNTRY)) {
    if (lower.includes(keyword)) return code;
  }
  return "in"; // default to India
}

/* Extract clean job keywords from the message */
function extractJobQuery(text) {
  return text
    .replace(/find|search|looking for|jobs|job|in\s+(india|uk|us|singapore|malaysia|dubai|uae|united\s*(states|kingdom))|openings|opportunities|hiring|work|career/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80) || "software engineer";
}

/* POST /api/jobs/search */
app.post("/api/jobs/search", async (req, res) => {
  const { query = "", country: countryHint = "" } = req.body;
  const jobQuery   = extractJobQuery(query);
  const countryCode = ADZUNA_COUNTRY[countryHint.toLowerCase()] || detectJobCountry(query);
  const results    = [];

  /* ── Source 1: Adzuna (250/day free, covers IN/UK/US/SG/MY/AE) ─────────── */
  try {
    if (process.env.ADZUNA_APP_ID && process.env.ADZUNA_API_KEY) {
      const adzUrl = `https://api.adzuna.com/v1/api/jobs/${countryCode}/search/1`
        + `?app_id=${process.env.ADZUNA_APP_ID}`
        + `&app_key=${process.env.ADZUNA_API_KEY}`
        + `&results_per_page=6`
        + `&what=${encodeURIComponent(jobQuery)}`
        + `&content-type=application/json`;

      const adzRes  = await fetch(adzUrl);
      const adzData = await adzRes.json();

      (adzData?.results || []).forEach(j => {
        results.push({
          id:          j.id,
          title:       j.title,
          company:     j.company?.display_name || "Company",
          location:    j.location?.display_name || j.location?.area?.[0] || countryCode.toUpperCase(),
          country:     countryCode.toUpperCase(),
          url:         j.redirect_url,
          salary:      j.salary_min ? `${j.salary_min.toLocaleString()} – ${j.salary_max?.toLocaleString() || ""}` : null,
          description: j.description?.slice(0, 200),
          source:      "Adzuna",
          posted:      j.created,
        });
      });
    }
  } catch (e) {
    console.warn("Adzuna error:", e.message);
  }

  /* ── Source 2: Remotive (free, no key, remote jobs worldwide) ────────────── */
  if (results.length < 8) {
    try {
      const remUrl = `https://remotive.com/api/remote-jobs?limit=6`
        + `&search=${encodeURIComponent(jobQuery)}`;

      const remRes  = await fetch(remUrl, { signal: AbortSignal.timeout(5000) });
      const remData = await remRes.json();

      (remData?.jobs || []).slice(0, 4).forEach(j => {
        results.push({
          id:          `rem-${j.id}`,
          title:       j.title,
          company:     j.company_name,
          location:    j.candidate_required_location || "Remote",
          country:     "REMOTE",
          url:         j.url,
          salary:      j.salary || null,
          description: j.description?.replace(/<[^>]+>/g,"").slice(0,200),
          source:      "Remotive",
          posted:      j.publication_date,
        });
      });
    } catch (e) {
      console.warn("Remotive error:", e.message);
    }
  }

  /* ── Source 3: Jooble (free tier, IN/UK/US/MY/SG/AE) ────────────────────── */
  if (results.length < 6 && process.env.JOOBLE_API_KEY) {
    try {
      const joobleCountry = { in:"India", gb:"United Kingdom", us:"United States", sg:"Singapore", my:"Malaysia", ae:"UAE" };
      const jooRes = await fetch(
        `https://jooble.org/api/${process.env.JOOBLE_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keywords: jobQuery, location: joobleCountry[countryCode] || "India", page: 1 }),
          signal: AbortSignal.timeout(5000),
        }
      );
      const jooData = await jooRes.json();

      (jooData?.jobs || []).slice(0, 4).forEach(j => {
        results.push({
          id:          `joo-${j.id}`,
          title:       j.title,
          company:     j.company || "Company",
          location:    j.location || joobleCountry[countryCode] || "India",
          country:     countryCode.toUpperCase(),
          url:         j.link,
          salary:      j.salary || null,
          description: j.snippet?.slice(0, 200),
          source:      "Jooble",
          posted:      j.updated,
        });
      });
    } catch (e) {
      console.warn("Jooble error:", e.message);
    }
  }

  /* ── Fallback: suggest LinkedIn search if all APIs fail ─────────────────── */
  if (results.length === 0) {
    const countryName = { in:"India", gb:"UK", us:"US", sg:"Singapore", my:"Malaysia", ae:"UAE" }[countryCode] || "India";
    return res.json({
      jobs:    [],
      message: `Couldn't fetch live jobs right now. Try searching directly on LinkedIn: https://linkedin.com/jobs/search/?keywords=${encodeURIComponent(jobQuery)}&location=${countryName}`,
      query:   jobQuery,
      country: countryCode,
    });
  }

  res.json({ jobs: results.slice(0, 10), query: jobQuery, country: countryCode });
});

/* ── Helper to detect job search intent in chat messages ──────────────────── */
// Already exists in server.js — no change needed. The chat handler
// automatically calls /api/jobs/search internally when it detects job intent.
