# Nugens Platform — QA Test Plan

## Why this is a manual checklist, not automated tests

The **Portfolio app** (`apps/portfolio`) has real, automated, passing tests —
11 tests, actually executed, one of which caught and fixed a real bug (a
missing reel — see `TESTING.md` in that app for details). That was possible
because Portfolio is small and self-contained: no backend calls, no auth, no
third-party payment/AI integrations to fake.

The other five apps (Gen-E, HyperX, DigiHub, Units, nugens-web) are a
different situation: **zero test infrastructure currently exists in any of
them**, and their real functionality depends on live Supabase auth, a live
backend API, Razorpay payments, OpenAI/Groq calls, and Cloudflare Stream —
none of which I have credentials for in this environment. Writing "tests"
against these without being able to actually run them against something real
would mean handing you tests I've never seen pass, which isn't meaningfully
different from just claiming things work. That's not something I'm willing
to fake, especially after this conversation just caught a real bug specifically
*because* the tests were actually run.

What follows instead is a **systematic checklist** — organized the same way
real tests would be (Loading / Success / Error state, per feature) — that you
or a QA person can walk through against the live site. If you want real
automated coverage for a specific app, that's a legitimate next project (it
needs test-mode API keys for Razorpay/OpenAI and a way to seed a test
Supabase project), and I can help set that up — just flag which app matters
most first, since doing all five properly is a substantial undertaking on
its own.

---

## Gen-E

| Feature | Loading state | Success state | Error state |
|---|---|---|---|
| Sign up / Sign in | Spinner shown while checking session | Redirects to Dashboard | Wrong password shows inline error, not a blank screen |
| Career AI chat | Message shows a "thinking" indicator while streaming | Response streams in, job cards only appear when actually asked for jobs (see the job-intent fix from earlier) | Network failure shows a retry option, not a silently stuck spinner |
| Resume Builder | Shows a loading state while generating | PDF downloads, ATS-formatted, no watermark | Generation failure shows an error message, not a blank page |
| Career Roadmap | Asks clarifying questions before generating (per earlier fix) | Roadmap PDF downloads via roadmap-specific layout, not resume layout | — |
| Interview Prep | Scales question difficulty to stated experience level | — | — |
| Job Tracker | — | Can add/edit/delete tracked applications | — |
| Skill Gap / Career Simulator / standalone tool pages | Each routes to its own page (not funneled into chat — per earlier fix) | — | — |
| Pricing / checkout | — | Razorpay checkout opens, charges the correct amount (cross-check against `PLAN_CONFIG` in `backend/server.js`) | Payment failure shows a clear message |

## HyperX

| Feature | Loading state | Success state | Error state |
|---|---|---|---|
| Dashboard | — | Courses grouped by category, "Suggested For You" populated | If `hx_categories`/`hx_self_evaluations` migrations haven't run, confirm this fails gracefully, not with a blank page |
| Course enrollment | — | "My Courses" filter only shows enrolled courses | — |
| Certificates | — | Print/PDF shows a real certificate, not the whole app UI | — |
| Community | — | Posts load and can be created | Confirm "Failed to fetch posts" doesn't reappear (this was fixed earlier — the root cause was a backend join issue, not just a migration) |
| Admin Panel — Courses/Lessons/Categories | — | Lesson editing works in place (not duplicating) | — |
| Self-Evaluation | — | Scores save and "last checked in" date updates | — |

## DigiHub

| Feature | Loading state | Success state | Error state |
|---|---|---|---|
| Image Generator | Shows generating state | Image appears, Brand Voice indicator shows if one is set | If DALL-E fails, confirm it actually falls back to Pollinations instead of just erroring |
| Brand Voice | — | Saves to the real backend (not just localStorage — confirm by reloading in a different browser and seeing the same data) | — |
| Talent Hub | — | Shows real opted-in profiles, empty state if none | Confirm no fabricated/placeholder candidates ever appear |
| Job Board | — | Shows real + partner-sourced listings, clearly labeled which is which | Never shows a bare "0 jobs found" with no explanation |
| Content Scheduler | — | "Copy caption" and "Open on LinkedIn/Twitter" links work | Confirm the page is honest that it doesn't auto-publish |
| Bulk Generator / Content Planner / Hashtag suggestions | — | Output reflects Brand Voice automatically | — |

## Units

| Feature | Loading state | Success state | Error state |
|---|---|---|---|
| Idea Validation | — | Real score generated | If the AI response fails to parse, shows an honest retry message — never a fabricated fallback score |
| Book Consultation (from Idea Validation) | — | Creates a real record in `units_consultation_requests` | — |
| Booking / project tracker | — | Booking flow completes, Razorpay charges correct amount | — |
| Package Comparison | — | Correctly recommends a package based on selected features | — |
| Admin — Projects board | — | Shows all bookings across users (confirm the `/all` vs `/:id` route-order fix still holds) | — |

## nugens-web (public marketing site)

| Feature | Loading state | Success state | Error state |
|---|---|---|---|
| Units page | — | "View Our Work" links go to `portfolio.nugens.in.net` (not a dead `/work` path — this was just fixed) | — |
| Pricing page | — | Suite bundle pricing is internally consistent (Premium/Pro sit above what buying products separately would cost — this was a real bug fixed earlier, worth spot-checking it hasn't regressed) | — |

## Backend (`backend/server.js`)

| Area | What to check |
|---|---|
| `/api/subscription/create-order` | Confirm it still uses server-side `PLAN_CONFIG` amounts, never a client-sent amount (security-critical — this was the original design and must never regress) |
| `/download/:file` | Confirm still restricted to `resume-*.pdf` / `roadmap-*.pdf` pattern, not open to arbitrary files |
| Job search (`fetchLiveJobs`) | Confirm results are still relevance-ranked, not just concatenated from every source |

---

## Portfolio app — the one with real tests

See `apps/portfolio/TESTING.md` for how to run the actual automated suite.
