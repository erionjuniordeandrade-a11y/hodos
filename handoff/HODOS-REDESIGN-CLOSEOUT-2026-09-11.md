# Hodos: audit fixes and frontend redesign, closeout (2026-09-11)

Owner: Dr. Erion de Andrade. Implementer: Claude Fable 5.1, one agent, `~/hodos` claimed and
released. Nothing committed, nothing pushed, nothing deployed. The public site still serves
content 2026-09-11.1 with the pre-audit design.

## Scope delivered

1. Pre-production audit (31 findings): every code-level item fixed; owner decisions recorded.
2. Hallmark audit (`HALLMARK-AUDIT-2026-09-11.md`): 4 critical, 12 major, 6 minor; all
   critical and major items resolved except the two the owner kept (see Owner decisions).
3. Preserve-mode redesign under one locked system (`design.md`, `viewer/tokens.css`,
   `viewer/hodos.css`): home Index-First, lesson Workbench, sources Long Document; nav N9,
   footer Ft4; Playfair Display + vendored Inter; one 2 px radius; 4 pt spacing scale.

Hallmark preview (final):
- Macrostructure: Index-First / Workbench / Long Document
- Theme: custom, owner palette (paper oklch(18% 0.008 248), accent ice oklch(87% 0.073 213))
- Enrichment: none (the interactive three.js atlas is the content)
- Motion: hover lift, tab underline, focus ring; fibre animation user-started only
- Pre-emit critique: P4 H4 E4 S5 R4 V4
- Slop test: passes the universal gates checked in this run (1–7, 9–15, 20–27, 34, 37–38a,
  40–42, 46–51, 54–56). Gate 43 passes (Ft4). Gate 8 is not applicable (first run; log created).

## What changed (working tree, uncommitted)

New: `design.md`, `.hallmark/log.json`, `viewer/tokens.css`, `viewer/hodos.css`,
`viewer/brand/hodos-og.png`, `viewer/vendor/fonts/inter-latin-{regular,medium,semibold}.woff2`,
`viewer/vendor/fonts/Inter-OFL.txt`, `handoff/HALLMARK-AUDIT-2026-09-11.md`, this file.

Modified (27 tracked files): `viewer/atlas.html` (metadata, canonical, module preloads, N9
header, stage toolbar, intro, footer, Layers panel moved inside the workspace,
`atlas-theme.css` unlinked), `viewer/atlas-sources.html` (metadata, prose wrapper),
`viewer/atlas_app.js` (stale-link handling, search close and filter chip, Layers docking in
Explore, orientation wording, parcel readout with majority Yeo-7 label, sentence-case class
labels), `viewer/anatomy_lesson_player.js` (curriculum-ordered dropdown, CTA labels, Orient vs
Compare content, stale-link notice, hidden Previous on brief, draft line on brief only),
`viewer/lesson_state.js` (advisory `lessonVersion`), `viewer/anatomy_learning.js` (progress
survives a content version bump), `viewer/atlas_scene.js` (cache-busted asset fetches, staged
loading status, `parcelNetwork`), `viewer/atlas_glossary.js` + `atlas_catalog.js` (reading
names, publisher names searchable), `viewer/dissection_references.js` (versioned plate URLs),
`viewer/lessons/*.js` (consistent target labels, one question reworded), `lesson_content.js`
(CONTENT_VERSION 2026-09-11.2), the four older stylesheets (font floor 11 px, stacked layout),
`scripts/build-hodos.mjs` (cache headers, public link rewrites, font and image exports, plate
version check), `THIRD_PARTY_NOTICES.md` (Inter), and the tests listed below.

## Owner round after the first handover (same day)

- Footer rebuilt as a three-column colophon (brand and credit · reference data · use terms)
  spanning the page; the credit link never wraps.
- Credentials and training added from the practice site's own About page and physician schema
  (`~/drerion/src/pages/Sobre.tsx`, `PhysicianSchema.tsx`, `TrustLogos.tsx`): footer carries
  "Neurosurgeon, CRM-RS 41.263, RQE 44841", the Cleveland Clinic and Emory fellowships and the
  Santa Casa preceptorship; the sources page carries a full author block (current posts,
  four fellowships with years, residency and degrees, four societies). Nothing was written
  from memory.
- Layers panel headers aligned (labels one line, controls bottom-aligned, "Clear pathways"
  as a text action); network label reads "Yeo-7 group labels".
- Sources page keeps its side gutter on phones.

## Evidence

- `npm test`: 52 passed, 0 failed (unit + export tests).
- `node tests/perf/atlas_v1.mjs --url=http://127.0.0.1:51040`: PASS. 58 relationships, all
  phases, targets, sources, cards, answers, recaps; 6 layouts (1440, 1157×601, 851, 390, 320,
  presenter); 0 page errors, 0 failed requests, 0 external requests.
  Report: `output/audit-20260911/full-v1i/` (rerun after the footer and author changes).
- `node tests/perf/atlas_dissection.mjs`: PASS (`output/audit-20260911/dissection-f/`).
- `npm run build -- --out=dist/hodos-redesign-20260911`: content 2026-09-11.2, atlas manifest d74e1686…; release.json SHA-256
  `faf5b9efd62c4bcd099f84d8666fd6a7c5b34ce2f432e4dc3c85f2fc103bf0bf` (90 files, 23,379,703 bytes).
- `node tests/perf/hodos_publication.mjs --url=http://127.0.0.1:51041 --release=dist/hodos-redesign-20260911/release.json`:
  PASS against that build (88 assets by hash, 10 lessons, 2 layouts, 0 errors).
  Report: `output/audit-20260911/publication-final/`.
- Renders reviewed at 1440, 1280, 768, 390, 320 (scratchpad `redesign-final/`, `redesign-r2/`).
  No horizontal scroll at 320–1920. Callout colours match the mesh. Views menu never clipped.

Not established: resident or projector rehearsal, anatomical review of content, real phone
hardware, slow-network timing, bundling (see Deferred).

## Audit items and their state

Fixed in code: 1, 2, 4, 5, 6, 7, 9, 10, 13 (display names), 15, 16, 17, 18, 19, 21, 23, 24,
26, 27 (Inter vendored, OFL without reserved name), 29 (30-day caching with hash-versioned
atlas and plate fetches), 31, plus the Hallmark punch list (nav, eyebrows, mono, separators,
cards, radii, split header, wrapped CTAs, Layers docking, sources typography).
Partly: 12 (grammar fixed; Reveal already showed the answer, the audit had read the surgical
block), 14 (majority Yeo-7 label per parcel shown; Glasser long names need a source table the
owner has not supplied), 22 (labels verified to match the mesh; not reproduced).
Owner decisions applied: footer trimmed to a credit line; draft badge once, on the brief.
Owner decision pending: 3 (whether "anatomical review pending" ships at all).
Deferred: 25 (leader crossings, cosmetic), 28 (bundling; module preloads added instead),
30 (Playfair subsetting blocked by its Reserved Font Name under the OFL).

## Deviations and limits

- The four older stylesheets remain and are re-pointed at the tokens through aliases; the
  light theme sheet is unlinked but not deleted. A full consolidation is a follow-up.
- Progress now survives a content version bump (structurally validated). Links with an old
  `lessonVersion` open the current content with a one-time notice.
- The stacked phone layout uses page scroll with a 36dvh sticky viewer (min 300 px); the
  tablet range (761–1100 px) keeps a fixed panel with its own scroll to fit the viewport.
- The dissection photographs (13.6 MB) dominate the release size; unchanged bytes.

## Rollback and next step

Rollback: `git checkout -- . && git clean -fd viewer design.md .hallmark` restores the
committed 99c0ab4/024561b tree. The live site is unaffected until deployed.

Deploy (owner-authorised action, not run):
```sh
npx wrangler whoami
npx wrangler pages deploy dist/hodos-redesign-20260911 --project-name hodos-atlas --branch main --commit-dirty=true
node tests/perf/hodos_publication.mjs --url=https://hodos-atlas.pages.dev --release=dist/hodos-redesign-20260911/release.json --out=output/hodos-redesign-public
```
Then commit the working tree (conventional message) and push.
