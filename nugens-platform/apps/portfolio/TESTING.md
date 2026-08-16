# Testing — Portfolio app

This app has a real, automated test suite (Vitest + React Testing Library) —
11 tests, all passing, actually executed against the real component.

## Running the tests

```powershell
cd apps/portfolio
npm install
npm test          # runs once and exits
npm run test:watch # re-runs on file changes, useful while editing
```

## What's covered

- The page renders without crashing
- All four sections are present (Websites, Content Creation, Testimonial, Posters)
- All 15 real reels render with their correct titles
- All 6 real posters render as actual `<img>` tags, not placeholder graphics
- No `<iframe>` loads until a video is actually clicked (confirms the
  click-to-play fix — loading 16 iframes on page load was the original bug)
- Clicking a reel's play button loads the correct Cloudflare Stream iframe
  for that specific video (checks the real stream ID, not just "an iframe
  appeared")
- External CTA links point at the real Units app
  (`https://units.nugens.in.net/book` and `/pricing`) — this test exists
  specifically because those links used to be relative paths that only
  worked by accident while this page lived inside the Units app itself

## A real bug this test suite already caught

While writing these tests, the reel count assertion failed — the `REELS`
array had 14 entries instead of the expected 15. One reel ("Prince &
Princess", stream ID `534c81621771d427e2b4b06cc8877f94`) had been silently
dropped during an earlier rewrite of this page. It's been restored, and the
test now locks in the correct count so this can't silently regress again.

## Adding a new reel or poster later

If you add a new video or poster to the `WORK`-equivalent arrays at the top
of `ProofOfWork.jsx`, update the count expectations in
`ProofOfWork.test.jsx` to match (`renders all 15 real reels` and `shows a
'tap to play' control for every video`) — otherwise the test suite will
correctly fail and tell you the count doesn't match what's actually in the
component, the same way it just did for the missing reel.
