# Direction B implementation closeout

## Result and ownership

Implementation complete; acceptance is partial because the required Wrangler/publication and Lighthouse command-line gates could not run successfully in this sandbox. No commit, push, merge or deployment was performed.

Workflow `hodos:landing-b`; Codex implements, orchestrator reviews and owns publication. Root `/Users/eriondeandrade/hodos-wt-landing-b`, branch `feat/landing-b`, baseline HEAD `8f11de5`. The supplied isolated worktree was used. The approved artboard, locked design system, shared styles and user contract are the source of truth. See `LANDING-B-CONTRACT-2026-09-14.md` for the instruction chain and bounds.

## Files changed

- `viewer/index.html`: anatomy hero/picture, responsive preloads, four families, ten framed lesson rows, three moves, case band, creator/data and shared colophon. Required data attributes and ten unique lesson anchors emitted; original metadata and JSON-LD preserved. Script loading removed.
- `viewer/landing.css`: token-derived responsive layout and typography, one hero scrim, hairlines, 44 px CTAs, focus states and reduced-motion behavior.
- `viewer/landing.js`: replaced obsolete film behavior with a no-op comment; not loaded or exported.
- `viewer/media/landing/case-right-medial-frontal-20260914.jpg`: generated from the supplied synthetic PNG using `magick ... -resize 900x900 -quality 78 ...`; verified 900 x 900, 84,554 bytes. Original PNG retained. No supplied JPEG was recompressed or renamed.
- `scripts/build-hodos.mjs`: explicitly allowlists all 20 landing JPEG files (19 supplied plus the case derivative); removes the two MP4s, poster and landing.js from export.
- `tests/js/hodos_export.test.js`: checks anatomy landing/export, ten anchors, no inline styles or film/script, and expected media count.
- `tests/perf/hodos_publication.mjs`: verifies a loaded hero image and ten lesson links; captures viewport/full screenshots; verifies six viewport widths and actual clickable text line boxes.
- `design.md`: only the exact requested Landing macrostructure line added.
- This closeout, task contract and `output/landing-b/`: local review evidence.

`handoff/LANDING-B-ARTBOARD-2026-09-14.dc.html` and the 19 supplied JPEGs were already untracked when work began. `tests/perf/landing_gate.mjs` appeared during the task and was treated as orchestrator-owned concurrent work; it was read but never edited. Shared `tokens.css` and `hodos.css` are unchanged.

## Copy

All 571 words of visible artboard copy were carried over verbatim after normalizing HTML whitespace. No text was shortened. This includes “The brain, as pathways.”, all four family descriptions, the ten lesson titles/questions and hemisphere captions, “Ten lessons. Orient, compare, explain.”, the moves caption, Case Conference text/CTA/review notice, creator/data text and entire footer. The existing accessible skip link is additional. Real descriptive image alt text was added. Copy proof: `output/landing-b/copy-audit.json`.

## Verification and raw tails

Baseline npm test: 69 passed, 0 failed. The revised export test was first observed failing on the old heroFilm markup, before implementation.

Final `npm test`:

```text
ℹ tests 69
ℹ suites 0
ℹ pass 69
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1691.783334
```

Final `npm run build -- --out=dist/landing-b-3`:

```json
{
  "output": "/Users/eriondeandrade/hodos-wt-landing-b/dist/landing-b-3",
  "version": "2026-09-13.1",
  "files": 131,
  "bytes": 35446589,
  "atlasManifestSha256": "1d87cebf7c68a1101afa5adb62321d28a24174e41d48fb85f65d915541eef90f"
}
```

Each build used a fresh directory; builds 1 and 2 remain preserved. The final landing.css SHA-256 matches the exported bytes: `67e77c1d8accfaa92b0f6c246d2c8338be5ecd83b6591626ed0341252079c9e8`.

Requested `npx wrangler pages dev dist/landing-b-1 --port 8797 --compatibility-date 2026-09-01` did not reach Ready:

```text
npm error code ENOTFOUND
npm error network request to https://registry.npmjs.org/wrangler failed
```

The locally cached Wrangler executable was also tried without installing or changing configuration. It parsed all six header rules but exited with:

```text
Error: EMFILE: too many open files, watch
ERROR Failed to bind to 127.0.0.1:9229: permission denied.
This usually means a sandbox or security policy is preventing network access.
```

Requested publication command was attempted against build 1. Chromium failed before the page audit, so there is **no successful publication JSON and no errors:0 claim**:

```text
browserType.launch: Target page, context or browser has been closed
bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer.9772: Permission denied (1100)
```

The required Lighthouse command was attempted exactly. No Lighthouse JSON, performance score, LCP, CLS or total-byte result was produced:

```text
npm error code ENOTFOUND
npm error network request to https://registry.npmjs.org/lighthouse failed
```

The available Playwright browser service did independently render the source landing through the local static preview at `http://127.0.0.1:8798/`. It is supplemental evidence, not a substitute claim for Wrangler's routes, CSP delivery, release-byte checks or Lighthouse throttling:

```text
width:          320  375  414  768  1024  1440
scrollWidth:    320  375  414  768  1024  1440
wrapped links:    0    0    0    0     0     0
wrapped text:     0    0    0    0     0     0
```

The wrap checks also cover all lesson anchors. A further 390 px capture/check passed. Every image decoded; hero uses the 1200 file at mobile widths and 1920 at desktop widths; required structure counts, full-hero scrim coverage, image attributes and first-viewport h1 visibility passed. No page/console errors; reduced-motion animations: 0. Raw local browser observations at 375 px: CLS 0, hero-image LCP 36 ms, initial encoded subresources 906,484 bytes (excludes the HTML document and is not Lighthouse total byte weight). The measurements are local/unthrottled and must not be reported as the mobile Lighthouse gate.

`git diff --check`, JavaScript syntax check, metadata/JSON-LD preservation, exactly one landing gradient and no newly added inline styles/scripts also passed. The original JSON-LD remains the sole inline script block, as explicitly required, and the exporter retains its CSP hash.

## Screenshots and visual review

Under `output/landing-b/`:

- `hodos-landing-1440-viewport.png` and `hodos-landing-1440.png`: final desktop viewport/full page.
- `hodos-landing-390-viewport.png` and `hodos-landing-390.png`: final phone viewport/full page.
- `mobile-case-detail.png` and `mobile-footer-detail.png`: readable lower-page inspection.
- `mockup-reference-full.png`: approved artboard rendered with the supplied stand-ins and local fonts for comparison, without modifying the artboard.
- `browser-checks.json`, `static-checks.json`, `copy-audit.json` and command logs: raw evidence.

All four final screenshots and the detail views were visually inspected. Early `*-first.png` images are superseded.

## Deviations and reasons

1. Locked type tokens take precedence over off-scale artboard numbers: desktop h1 is 64 px instead of 88; section h2 36 instead of 48/39; lesson/family titles 20 instead of 22/20; body 16 instead of 15/18; small text 14 instead of 12.8/13. At <=360 px lesson titles use the existing 16 px token to retain unbroken clickable titles. Shared wordmark/footer typography stays inherited. No new type tokens were introduced.
2. Token-derived dimensions round the desktop hero to 816 px instead of 820, copy max width to 672 instead of 680, gaps to the named scale, and move frames retain the supplied aspect ratio. Desktop composition stays full bleed with bottom-left copy, four equal family cells, 420/860-style lesson columns, 200/140-style lesson frames and a 520 px case band.
3. Responsive layouts were absent from the fixed 1440 px artboard: families become two columns and curriculum unsticks/stacks below 1100 px; lesson rows, case and creator/data stack below 700 px; header nav and hero action note reflow without wrapping link text.
4. Narrow hero crops use 55% plate opacity onto the solid stage so bright fibres do not obscure nav/body text. The single hero gradient still fades paper to transparent.
5. Case Conference uses a solid split band instead of the artboard's second gradient. Its secondary CTA sizes to its text rather than stretching the entire column. Both follow the hard gradient/CTA contract.
6. The shared brand mark and footer styling are retained instead of duplicating the artboard's slightly different mark and footer spacing. Visible copy is identical.
7. Alt text, semantic section/list/headings, real destinations, image loading attributes and the existing skip link replace mockup-only spans/empty alts. No copy was omitted.
8. CLI publication/Lighthouse evidence is incomplete due the documented runtime restrictions. Source-browser screenshots and supplemental checks are explicitly identified above.

## Open questions and exact next task

The orchestrator-owned `tests/perf/landing_gate.mjs` rejects any clickable with `offsetHeight > 2.1 * fontSize`. The browser reproduced five false positives at each width: one-rectangle, single-line 40/44 px nav/CTA controls are classified as two-line. The required primary CTA is 44 px high with 16 px text, so 44 > 33.6 despite one text line. The gate's structure/image/LCP/CLS checks otherwise passed in the browser service. Keep the controls; have the gate owner measure actual text line boxes (as the publication test does).

Next task: orchestrator reviews the typography/layout adaptations and replaces the 19 stand-ins, then uses a runtime with working npm, Wrangler loopback/watch access and Chromium launch permission to run publication and Lighthouse against a fresh export. Preserve the 44 px controls while resolving the independent gate's height heuristic. Final image captures require another performance/visual pass. No clinical or production outcome was observed.

## Approval, cleanup and rollback

Local changes only, ready for orchestrator review with the incomplete gates clearly identified. No persistent configuration or personal memory was changed. Wrangler attempts exited unsuccessfully. The auxiliary preview was stopped through its originating terminal session, which returned “Keyboard interrupt received, exiting.” and exit code 0; the sandbox denied a separate shell kill. The final listener check for ports 8797/8798 is saved in `output/landing-b/preview-listeners-after.txt`. No supplied media or prior build was removed. Playwright's temporary observations were preserved under `output/landing-b/mcp-observations/`. Rollback is reversal of this task's reviewed tracked diff plus omission of the new case derivative/contract/closeout; preserve the supplied artboard/assets and concurrent gate. No recurring automation remains.
