# Proof of Work — status: videos fully wired to Cloudflare Stream

All 16 videos (testimonial + 15 reels) now stream from Cloudflare — no video
files, no size limits, no git problems. `ProofOfWork.jsx` has zero local video
imports left.

## What's done

- `CLOUDFLARE_STREAM_DOMAIN` is set to your real subdomain
  (`customer-6qz8gcj18239c7sh.cloudflarestream.com`)
- Every reel and the testimonial has its real Cloudflare Video ID wired into
  the `WORK` array — each one still carries its original filename as a
  trailing comment (e.g. `/* Raksha bandan.mp4 */`) so you can always trace
  a card back to the source file
- 7 poster images stay as local files in `apps/units/src/assets/units
  samples/posters/` — small, no git issue, no change needed there
- The `reels/` and `testimonials/` folders are no longer needed in this repo
  at all (that's what you said you'd do) — I removed the manifest and
  thumbnail placeholder that were in them

## What you still need to do

**Delete the local folders** (if you haven't already, per your plan):
```
apps/units/src/assets/units samples/reels/
apps/units/src/assets/units samples/testimonials/
```
Nothing in the code references them anymore — safe to remove entirely.

**Add the gitignore rule anyway** — cheap insurance in case anyone drops a
video back into those folders later:
```
apps/units/src/assets/units samples/reels/*.mp4
apps/units/src/assets/units samples/testimonials/*.mp4
```

**Route + nav** — still generic since I don't have your `App.jsx`/`Sidebar.jsx`:
```jsx
const ProofOfWork = lazy(() => import("./pages/ProofOfWork"));
```
```jsx
<Route path="/work" element={<ProofOfWork />} />
```
```jsx
{ to:"/work", icon:"◇", label:"Proof of Work" },
```

## One thing worth knowing about Cloudflare Stream + free/basic plans

The video cards render via Cloudflare's iframe embed
(`https://.../<id>/iframe`), which handles adaptive streaming automatically —
no extra library needed. If your Stream plan has viewer limits or requires
signed URLs for playback (some paid tiers restrict embedding to specific
domains), you may need to add your production domain to Cloudflare's allowed
referrers list under Stream settings, or switch to signed tokens — check
your dashboard if videos don't play once this goes live on your real domain.
