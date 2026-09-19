# Featured lesson previews closeout

## Result and goal

Complete. Published three enlarged, captioned anatomy previews on the existing featured lesson cards. Each opens the matching left-hemisphere, first-relationship Orient scene. Both complete public browser gates and final CI pass.

## Workflow identity and source of truth

- Workflow: `hodos:lesson-previews`; owner: Erion de Andrade; repository change.
- Root: `/Users/eriondeandrade/hodos`, `main`; clean starting commit `d0ae63c`.
- Authority: user requested implementation with efficient-codex after the bounded three-card proposal; operating contract authorizes verification and release.
- Sources: `design.md`, landing markup, authored lesson and scene modules, explicit public export, existing publication checks, and live Hodos.
- Instructions: supplied AGENTS contract, efficient-codex and frontend-skill. One implementer owned only the controller and focused browser gate; parent integrated, inspected and released.
- Prior context: bounded enrichment preference from memory, checked against the current 14 lessons and 85 relationships. No curriculum or clinical claim expansion.

## Changes

- Existing featured cards now open native dialogs with atlas captures, observation prompts, evidence limits, source links and exact scene links.
- Large preview images load only on opening. The landing does not load the atlas application or atlas data before exploration.
- Keyboard containment, focus/scroll restoration, Escape, close button, backdrop close, reduced motion and ordinary-link fallbacks are retained or verified.
- Three original reference-atlas captures and capture provenance are shipped through the existing explicit export allowlist. No generated anatomy or third-party gallery artwork was copied.
- Added a repeatable capture script and a focused browser gate; CI now serves extensionless production routes through `scripts/serve-hodos.py`.
- Atlas module-preload tags have a custom attribute to prevent Cloudflare Pages from promoting them into HTTP `Link` headers before the document import map. Document preloading remains enabled.

## Release

- Feature commit: `9d327bd`; test corrections: `50b62fb`, `859f38e`; preload-order fix: `793695d`.
- Reviewed export: `dist/hodos-previews-20260919-v3`, 142 files, 39,362,783 bytes.
- Public URL: https://hodosatlas.com/#curriculumTitle
- Immutable deployment: https://930ecf1c.hodos-atlas.pages.dev
- Anatomical content version remains `2026-09-13.1`; atlas manifest SHA-256 remains `1d87cebf7c68a1101afa5adb62321d28a24174e41d48fb85f65d915541eef90f`.

## Verification

- `npm test`: 69/69 pass after final product change. The preload export assertion was first observed failing, then passing.
- `npm run build -- --out=dist/hodos-previews-20260919-v3`: pass; allowlisted export and manifest checks pass.
- `node tests/perf/lesson_previews.mjs --url=https://hodosatlas.com --out=output/lesson-previews-20260919/live-previews-v3`: pass, three desktop previews, three phone previews, four navigation fallbacks, zero page/console errors. Real scene entry and reload are both checked.
- `node tests/perf/hodos_publication.mjs --url=https://hodosatlas.com --release=dist/hodos-previews-20260919-v3/release.json --out=output/lesson-previews-20260919/live-publication-v3`: pass, 140 exact public assets, all 14 lesson journeys, two atlas layouts and six landing widths, zero errors or failed requests, only configured analytics traffic.
- CI for product commit `793695d`: success, including 69 unit tests, export, full publication gate and focused preview gate: https://github.com/erionjuniordeandrade-a11y/hodos/actions/runs/35450756193. The closeout-only commit does not change tested product bytes and skips a redundant CI rerun.
- Captured anatomy, all desktop dialogs, phone layouts and action visibility were visually inspected. Final public phone screenshot was inspected again. Native Chrome also opened the public preview and entered its scene; the public tab is retained for review.
- Live GET of the final atlas returns 26 document-only preload markers and no generated `Link` header.
- `git diff --check`: pass before product commit.

## Failures resolved and deviations

- Initial live byte checks exposed nine stale pre-existing landing images in the custom-domain CDN. Refreshed exactly those nine URLs through the existing Cloudflare dashboard; subsequent full asset verification matched the reviewed export.
- Initial public preview checks repeatedly failed with unresolved `three` imports after reload. Waiting for initial scene completion alone did not fix it. Live GET showed Cloudflare-generated module-preload headers. The custom-attribute fix removed those headers and the complete public preview/reload gate then passed. Cloudflare documents this opt-out at https://developers.cloudflare.com/pages/configuration/early-hints/.
- Fixed the test's Playwright timeout argument and separated actual scene readiness from URL commitment. The modifier test now observes whether the application cancels the event while suppressing the synthetic native action, avoiding Mac-specific behavior navigating the Linux CI tab.
- The publication test now recognizes the exact Cloudflare analytics script/beacon endpoints already permitted by the existing build CSP; every observed external URL remains in the report and other external requests still fail.
- Existing CI's simple directory server served `/atlas` as a directory; the new helper reproduces the deployed extensionless route. The previous main-branch CI failure was confirmed to be this route mismatch.
- These delivery/test repairs were required to verify the requested public interaction. No new credentials, paid service, dependency, rendering algorithm or global configuration was introduced.

## Limits, approval and real-world outcome

Observed public interaction and automated behavior are verified. This does not establish independent anatomical validation or trainee learning outcomes. The atlas remains an educational reference. Native iOS/Safari devices and a full Case Conference recording/persistence matrix were not retested because those paths were unchanged; existing unit coverage remained green.

Release was authorized by the user and operating contract. No patient information was used. Product changes are committed and pushed; generated diagnostics/screenshots remain in ignored `output/lesson-previews-20260919/`. This repository note records technical closeout; no durable personal-memory update was requested or made.

## Pruning, rollback and next task

No user files were deleted. Prior exports and failed-check evidence are preserved; temporary export test servers were stopped. Restore the preceding immutable deployment `https://5308a67c.hodos-atlas.pages.dev` for a complete rollback, or revert only the bounded feature/fix commits after checking concurrent work. Next task: none required for this release.
