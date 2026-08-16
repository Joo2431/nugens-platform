# Proof of Work — status update

## NEW REQUIRED STEP: install self-hosted fonts

The page no longer depends on Google's font servers at all — this fixes the
"fonts look bad" issue for every visitor, not just ones without an ad-blocker.
Before building, run this once in your project:

```powershell
cd apps/units
npm install @fontsource/fraunces @fontsource/plus-jakarta-sans
```

Then commit `package.json` / `package-lock.json` along with everything else.
Without this install, the build will fail on the new font imports at the top
of `ProofOfWork.jsx`.

## Why the fonts were actually breaking (both previous attempts didn't fix it)

Attempt 1 loaded Fraunces via a CSS `@import` inside a React-injected
`<style>` tag. Attempt 2 (which you saw fail in the screenshot) switched to
`<link>` tags — the "correct" way per web standards, but it still didn't
help, because the real cause wasn't *how* the font was requested, it was
*where from*: browsers with strict privacy settings (Brave's aggressive
Shields, some ad-blocker filter lists, some corporate networks) block
requests to `fonts.googleapis.com` / `fonts.gstatic.com` outright, at the
network level — no amount of changing the request method fixes that, since
the request never leaves the browser either way.

The actual fix is self-hosting: `@fontsource` bundles the real font files
into your own build, so the browser loads them from your own domain, same
as any other image or script. Zero external font requests, so it can't be
blocked by anything that isn't blocking your entire site.

## The "Reel 4-1" broken-image icon

I looked carefully at the component that renders every reel card
(`PlayCard`) — it does not contain an `<img>` tag anywhere. There's no code
path that could produce a broken-image icon for one specific card while
its neighbors render correctly with the same component. That strongly
points to a **stale cached build** — the same category of problem as the
route not showing up earlier — rather than an actual bug in this file.

**To confirm and fix:**
1. Hard refresh: `Ctrl+Shift+R`, or open the page in an Incognito window
2. Check your host's deployment timestamp against your latest push — if
   they don't line up, the new build hasn't gone live yet
3. If your host has a "clear cache and redeploy" option (Cloudflare Pages
   does, under the project's deployment settings), use it once to be sure

If it's still showing that broken-image icon after a confirmed fresh
deployment and a hard refresh, that would be new information — send me a
fresh screenshot and I'll look again.

## Public access — this already appears to be working

Your own screenshot shows `units.nugens.in.net/work` rendering the actual
page content directly — no login screen in the way. That matches what the
route code does: it lives outside `<ProtectedRoute>` in `App.jsx`, so it
was never gated behind login in the first place.

If you're seeing a login requirement somewhere, it's worth checking whether
that was tested in a browser where you're *already* signed in (which
wouldn't tell you anything about what a logged-out visitor sees) — test in
a fresh Incognito/Private window to be sure. If it still requires login
there, that's a real bug and I need to see it to fix it — a screenshot of
that specific situation would help.

## "Move it to the Units overview page" — need clarification

I want to make sure I build the right thing here rather than guess. A few
things this could mean:
- A link/button added to the Units app's own Dashboard, pointing at `/work`?
- A link from the public marketing site (`nugens.in.net`) that doesn't
  require going through the app at all?
- Something else — an actual separate public landing page for Units that
  isn't the authenticated Dashboard?

Let me know which one (or describe what you're picturing) and I'll build
exactly that.
