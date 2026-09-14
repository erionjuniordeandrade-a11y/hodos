# Hodos landing page and hodosatlas.com — closeout 2026-09-13

Worktree `~/hodos-landing-20260913`, branch `feat/landing-hodosatlas` off `main` 4bc44a5. Uncommitted, reviewable diff.

## What changed
- New `viewer/index.html` landing at the site root: hero copy + the silent 15 s hero film (`viewer/media/hodos-hero-{1080p,720p}-20260913.mp4`, poster), three moves, ten-lesson list with deep links (`./atlas?lesson=<id>`), provenance, Case Conference teaser (pilot notice kept), creator, shared footer colophon. `landing.css` consumes tokens.css/hodos.css; `landing.js` pauses the film under reduced motion and adds a Play/Pause toggle. No inline scripts (CSP unchanged).
- Atlas app moves to `/atlas` (`atlas.html`, served by Pages without the extension; the `atlas/` data directory still resolves, verified in `wrangler pages dev`). Brand links in atlas/sources/case pages go home to `/`.
- Canonical and Open Graph URLs on all pages now point at `https://hodosatlas.com/...`.
- `scripts/build-hodos.mjs`: exports index.html as the landing, rewrites `./atlas.html[?query]` → `./atlas`, allowlists landing.css/js and the three media files, adds a `/media/*` 30-day cache rule.
- `tests/js/hodos_export.test.js` and `tests/perf/hodos_publication.mjs` updated for the new routes; the gate now also checks the landing (hero film present, one link per lesson, no horizontal overflow at 1440 and 390).

## Evidence
- `npm test`: 66/66 pass.
- Export: `dist/hodos-landing-20260913` (112 files, contentVersion 2026-09-13.1).
- Publication gate against `wrangler pages dev` on that export: 110 assets byte-exact, 10 lessons walked at /atlas, 0 page errors, 2 layouts.
- Route probe in the Pages emulator: `/` 200 landing · `/atlas` 200 app · `/atlas/` and `/atlas.html` 308 → `/atlas` · `/atlas?lesson=motor-cst` 200 · `/atlas/manifest.json` 200 · `/media/*.mp4` 200 with 30-day cache · `/index.html` 308 → `/`.
- Screenshots reviewed at 1440 and 390: hero film plays (1080p on desktop, 720p on phone), CTAs legible, skip link hidden until focus.

## Deploy (owner-authorized only)
    cd ~/hodos && npx wrangler pages deploy /Users/eriondeandrade/hodos-landing-20260913/dist/hodos-landing-20260913 --project-name hodos-atlas --branch main
Then check `https://hodosatlas.com/`, `https://hodosatlas.com/atlas`, and `curl -sI https://hodosatlas.com/media/hodos-hero-720p-20260913.mp4 | grep -i cache-control`.
Recommended before deploy: commit this branch and merge to main so the public repo matches the public site (CI runs tests + build + gate on push).

## Not done
- Redirect from hodos-atlas.pages.dev to hodosatlas.com: not possible via `_redirects` host rules (known parser trap); canonical tags carry SEO. Leave the alias serving.
- Old deep links to `hodos-atlas.pages.dev/?lesson=...` now land on the landing, not the lesson. Add a `_redirects` line `/  /atlas  302` only if that matters; it would hide the landing.
