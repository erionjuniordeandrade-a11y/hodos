# hodosatlas.com — site analysis, 2026-09-19

Read-only analysis of the live site at `main` 939a1bf. Nothing was changed, built into the
repo, or deployed. Four parallel auditors (performance, SEO, first-visitor UX, repo state)
plus an external Hermes audit supplied leads; every item below is tagged by who verified it.

- **V** = re-verified by the orchestrating session with a different tool than the auditor used.
- **A** = auditor-reported, not independently re-checked.
- **U** = not established; needs the check named.

Evidence (scripts, Lighthouse JSON, screenshots) sits in the session scratchpad
`/private/tmp/claude-501/-Users-eriondeandrade/e60da4f2-bba0-460f-a21c-7d9a7dc5982e/scratchpad/hodos/{vet,perf,seo,ux,state}`.
That directory is temporary; the commands below reproduce each finding.

## Verdict

The product is sound and production equals `main`. The site's two real problems are that
nobody can find it and that the phone experience of the atlas has one broken control and a
heavy load. The content gate (owner anatomical review) is unchanged and is still the only
thing that removes the "draft" banners. No new features are needed for any of this.

## Ranked findings

### 1. The 14 lessons are invisible to search, and the site is not indexed (V)

- `/atlas`, `/atlas?lesson=motor-cst` and `/atlas?lesson=brainstem-corridors` return
  byte-identical HTML (same sha256), title "Hodos · The atlas and lessons", canonical
  `https://hodosatlas.com/atlas`. The sitemap lists 19 URLs; 14 of them are this one document.
  Reproduce: `curl -s <url> | shasum -a 256` on each.
- Lesson teaching text exists only in JS. Raw HTML of a lesson URL is navigation plus
  "Loading the reference atlas…" (A, 312 words).
- The landing JSON-LD declares 14 `LearningResource` URLs that do not exist as documents (A).
- Web search for `site:hodosatlas.com`, the brand name and descriptive queries returned nothing
  from the domain six days after launch (A; a web-search null, not Search Console data). The
  brand word collides with several unrelated "Hodos" products.
- `/atlas`, `/case-conference` and `/mips` carry no JSON-LD; `/mips` has no twitter card (A).

Smallest fix: emit one static HTML page per lesson at build time (title, description, H1,
the opening question, the relationship titles, sources, a "Open in the atlas" link), self-canonical,
and point the sitemap and JSON-LD at those. The memory note of 2026-09-14 records
"per-lesson canonical pages" as an owner product call that was deferred; this is that call.

### 2. Phone: three of seven anatomical views cannot be reached (V)

Reported by Hermes, reproduced on the live site at 320, 390 and 430 px, in the library and
inside the motor lesson. Opening `details.atlas-view-menu` places Right, Anterior and
Inferior entirely past the right edge (x = 408–485 at 390 px); `elementFromPoint` at their
centres does not hit them. The other column (Left, Superior, Posterior, Left medial) is
partly clipped (x = 307–404). Desktop is fine (A). The page clips horizontal overflow, so
`scrollWidth > innerWidth` stays false and the existing landing/overflow gates cannot see
this class of defect.

Fix: anchor the menu to the right edge of its trigger (or the viewport) on narrow screens.
Gate: at 320/390/430, every `.views button` rect inside the viewport and hit-testable, and
clicking each changes the view label.

### 3. The landing promises ten minutes; the lessons say 8 to 22 (V)

`viewer/index.html:67` "About ten minutes each" and `:122` "Ten minutes on the live atlas".
Lesson metadata (`lesson.minutes`, loaded from `viewer/lesson_content.js`): 210 minutes over
14 lessons, mean 15; only the two 8-minute foundation lessons are at or under ten. The primary
CTA opens `motor-cst`: 20 minutes, 10 relationships. Only these two strings are hard-coded;
the JSON-LD carries no duration. Fix: generate the landing copy from `lesson.minutes`, or
scope the promise to "one relationship". The estimates themselves have never been timed
with a learner (U).

### 4. Atlas on a phone: Lighthouse 65, 6.45 MB (A for scores, V for the cause)

- `/atlas` mobile median of 3: performance 65, LCP 6.2 s, 74 requests, 6.45 MB. Desktop 91.
  `/` 92/100, `/case-conference` 92/99, `/atlas-sources` 92/100, `/mips` 84/99 (A).
- A single mobile run of `/atlas?lesson=motor-cst` gave 54 with a 36 s LCP while other
  browser audits were running. Treat as unestablished until re-run on a quiet machine (U).
- Correction to the auditor: turning on compression is not the lever. `tracts.bin` is
  3,044,496 B served uncompressed, but brotli-9 only reaches 2,711,396 B and gzip-9
  2,717,700 B (about 11 %). The file has to be re-encoded (quantized positions, or split per
  bundle family and fetched per lesson). `inferior-context.glb` is 1.45 MB (A).
- `vendor/addons/libs/draco/gltf/draco_decoder.wasm` is `max-age=0` while sibling vendor JS
  is `max-age=14400` (V). One `_headers` rule.
- `three.core.js` / `three.module.js` ship unminified; Lighthouse estimates ~215 KiB (A).
- Five reference plates, 2.4–2.9 MB PNG each at 1608×1080, 13.6 MB total, referenced from
  `dissection_references.js` and the sources page (V for sizes). They are outside the
  6.45 MB initial load, so on-demand loading is inferred. WebP savings not measured (U).
- No console errors, failed requests or CSP violations on fresh loads of six routes (A).

### 5. Duplicate hostnames (V)

`https://www.hodosatlas.com/` and `https://hodos-atlas.pages.dev/` both answer 200 with no
redirect; pages.dev sends no `X-Robots-Tag`. Canonicals are correct, which mitigates but
does not fix it. Still the owner's open dashboard item (www→apex rule); pages.dev can be
handled with a `_headers` noindex or a Pages redirect.

### 6. No route back to the author, and no usage signal in hand

- The landing has no feedback, contact, share or "notify me" path; the only outbound link is
  the clinic site (V, from the landing HTML). For a pilot that needs resident feedback and a
  reviewer, this is the cheapest missing piece: a mailto or a short form.
- Usage could not be read: the local wrangler login has no analytics scope. Cloudflare Web
  Analytics was enabled on 2026-09-14; the numbers are in the dashboard only (U).
- The MIPS exercise shipped today is absent from the header on every page and reachable only
  through one inline sentence under Case Conference (V).

### 7. Phone lesson layout: friction, not breakage (V, from screenshots at a true 390×844)

- Landing first screen is good: headline, strapline and both CTAs without scrolling.
- In a lesson the canvas and the Previous/Next bar stay pinned while text scrolls, which
  works. But the first screen of each phase shows the step title and at most one and a half
  lines of body; in Explain the panel is visually empty until the learner scrolls.
- The lesson title is cut mid-word with no ellipsis ("Central region & motor pathwa").
- The landing "View anatomy" previews are static images in a dialog, not explorable 3D; on a
  phone their label chips are too small to read, and the dialog's last link sits 2 px below
  the viewport until scrolled.
- At the recap the pinned primary button is "All lessons"; "Continue with <next lesson>"
  exists but lives in the scrolled body. The auditor's "no next lesson" claim was wrong: its
  selector was stale, and the live recap shows the control.
- Keyboard: primary CTA at Tab 7 on the landing, lesson Next at Tab 26, visible focus ring,
  no unnamed buttons (A). axe-core was not available, so contrast was not checked (U).
- Resilience (A): reload keeps step and phase, a mid-lesson deep link opens correctly, a bad
  lesson id shows "That lesson is not installed." and the library; Back returns to the landing.
- 29 WebGL context-creation errors appeared only in the phone-emulated journeys that reused
  one software-GL browser across several navigations at 3× pixel ratio. Fresh loads never
  reproduced it, so it is most likely a harness artefact. One related fact (V):
  `viewer/atlas_scene.js:24` sets `setPixelRatio(Math.min(devicePixelRatio,3))`, so a 3× phone
  renders the full 3× buffer; a cap of 2 on narrow screens is a cheap memory and fill-rate
  saving worth testing. A real-phone check of reload and context loss closes this (U).

### 8. Content gate and repo hygiene

- All 14 lessons `reviewStatus:'draft'`, 85 relationships, 4 fictional cases, 80 citations,
  none without an identifier (A; identifiers not re-verified against NCBI in this pass).
  Banners are present and accurate. The owner's anatomical review remains the gate.
- Production == `main` 939a1bf: 135 of 147 live files are byte-identical to `HEAD:viewer/`;
  the 6 that differ are the five HTML pages and `hodos.css`, which the build rewrites with
  `?v=` keys; the rest are generated files (V). The auditor's full rebuild matched 147/147 (A).
- Today's two CI failures were test races, each fixed by the next commit (A). Nine further
  failed runs on Sep 14–15 were not examined.
- `~/hodos-offline-apple-20260911` holds uncommitted edits to `viewer/anatomy_lesson_player.js`,
  `viewer/atlas_scene.js` and `README.md` (V). The two launch worktrees hold ~3 GB of
  untracked video (A). Deleting any of them loses work.
- Repo `CLAUDE.md` still says "ten lessons, 58 relationships" (A); actual is 14 and 85.

## What the Hermes audit got right and wrong

Right, and confirmed here: the Views menu defect (same coordinates), the time-promise
conflict, that review is the substantive gap rather than more disclaimers, and that resume,
staged loading, source limits and keyboard help already exist. Not covered by Hermes and
larger in consequence: findings 1, 5 and 6 (discoverability and the missing feedback path).

## Recommended next work package

1. Fix the phone Views menu and add the hit-test gate (finding 2). Small, reproduced, user-facing.
2. Generate landing durations from lesson metadata (finding 3).
3. Per-lesson static pages + sitemap/JSON-LD alignment, pages.dev noindex, and the www→apex
   rule (findings 1 and 5). This is the one item that changes whether the site gets found.
4. A feedback link and MIPS in the header (finding 6).
5. `draco_decoder.wasm` cache rule; then decide on re-encoding `tracts.bin` (finding 4).

Owner-only: the anatomical review, the www→apex dashboard rule, reading Web Analytics, and a
real-phone pass through one lesson including reload.

## Fix record, 2026-09-19 (main 381c6b2, live, CI green)

Five worktree lanes (Codex Luna Max: lesson pages, tract ranges; Grok: plates; Sonnet: html, ux),
each diff read and re-gated by the orchestrator before merge. Verified on production unless marked.

| Finding | State | Evidence |
|---|---|---|
| 1 Lessons unindexable | Fixed | `/lessons` + 14 `/lessons/<id>` pages, 14 distinct bodies, self-canonical, JSON-LD; sitemap lists them, no `?lesson=` URLs; JSON-LD on /atlas, /case-conference, /mips |
| 2 Phone Views menu | Fixed | `tests/perf/views_menu.mjs` failed on the old site, passes on live (56 checks, 320 to 430 px); Escape and outside tap close it |
| 3 Ten-minute promise | Fixed | Landing states 8 to 22 minutes and the CTA lesson's 20; pinned by `tests/js/landing_copy.test.js` |
| 4 Phone atlas weight | Fixed in part | Pathways load by HTTP range: first pathway scene 36,960 B instead of 3,044,496 B, `tracts.bin` byte-identical, per-bundle sha256; plates 13.6 MB PNG to 1.4 MB WebP (PSNR > 40 dB); Draco wasm cacheable; 2x pixel cap under 700 px. Not done: three.js still unminified; no new Lighthouse run |
| 5 Duplicate hosts | Mitigated | www and pages.dev answer `X-Robots-Tag: noindex`. The www to apex redirect is still an owner dashboard rule |
| 6 Feedback, MIPS | Fixed | Footer "Report an error" link (GitHub Issues), MIPS in headers, footers and a landing section. Analytics still dashboard-only |
| 7 Phone lesson friction | Fixed except one | Title ellipsis, recap primary continues to the next lesson, each phase opens with its text visible. The preview-dialog 2 px item did not reproduce (36 to 45 px clear on old and new builds) |
| 8 Hygiene | Fixed | Repo CLAUDE.md counts; stale gates aligned |

Left as found: `tests/perf/atlas_v1.mjs` and the reference-dialog step of `tests/perf/case_conference.mjs`
were already stale on 939a1bf (old page title, removed `#phase-compare`); neither runs in CI. The
reference dialog was probed directly instead: three 206 range responses, pathways drawn, no errors.
One of 28 local runs of the range gate stalled on a click with load average 12 and no page error.
Unkeyed `/hodos.css` and old `.png` plate URLs may answer from edge cache until they expire; no page links them.

Owner-only: anatomical review, www to apex rule, Web Analytics, a real-phone pass, and whether
feedback should go to an email address instead of GitHub Issues.
