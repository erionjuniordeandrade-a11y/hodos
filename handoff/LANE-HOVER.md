# Lane HOVER handoff

## Result

Implemented per-streamline hover over the atlas canvas. **Verification status: BLOCKED** for the required browser visual and pointer gates; the headless Chromium process could not start in this sandbox. No pixel percentage or successful hover assertion was measured.

## Changed files

- `viewer/atlas_scene.js`: records an `Int32Array` segment-to-streamline map and segment ranges during bundle construction; raycasts primary `LineSegments2` objects once per animation frame; renders and disposes a temporary bright overlay for the hovered streamline; exposes `{bundle,streamline}` in scene state and a vertex projection method for the browser test. Dragging/control interaction clears hover. Click picking remains parcel/deep-only.
- `viewer/atlas_app.js`: formats the existing tooltip with the bundle display name and one-based streamline count, and places it near the pointer. Exposes the projection method through `__atlasTest`.
- `viewer/atlas.html`: makes the existing tooltip an `aria-live="polite"` region.
- `tests/perf/visual_regression.mjs`: adds an AF_L projected-vertex pointer check, tooltip and leave assertions, and requires zero changed pixels in the four existing scenes.

No atlas assets, vendor files, dependencies, baselines, or Linux fixtures changed. The review diff is uncommitted.

## Commands and observed output

- `npm test` — **PASS**, 120 tests, 120 pass, 0 fail, 0 skipped; `duration_ms 1880.430166` on the final run.
- `node scripts/vendor-three.mjs --check` — **PASS**: `vendor check PASS: 20 files, 3 packages`.
- `node --check viewer/atlas_scene.js && node --check viewer/atlas_app.js && node --check tests/perf/visual_regression.mjs && git diff --check` — **PASS**, exit 0, no output.
- `npm run build -- --out=dist/hover-review-final` — **PASS**, exit 0; reported `files: 186`, `bytes: 32021867`, atlas manifest SHA-256 `4d03204569136df62809aef15fa3778e5d631270005d6f2739afd3c475f2494d`. An independent filesystem walk counted 186 files and 32,052,263 bytes; the difference is the generated `release.json`, which the build's byte report excludes. `cmp` confirmed exported `atlas_scene.js` and `atlas_app.js` match the source files.
- `npm run build -- --out=dist/hover-review` — **FAIL** on a rerun after edits because the immutable existing output differed: `Hodos existing output differs; use a fresh --out directory`. The fresh output above succeeded; no existing export was overwritten.
- `python3 scripts/serve-hodos.py --directory dist/hover-review-final --port 51074` — started: `Hodos preview: http://127.0.0.1:51074`.
- `node tests/perf/visual_regression.mjs --url=http://127.0.0.1:51074 --out=output/visual-hover-final` — **BLOCKED**, exit 1 before any scene ran. Chromium launch ended with `FATAL:base/apple/mach_port_rendezvous_mac.cc:159 ... Permission denied (1100)` and `browserType.launch: Target page, context or browser has been closed`. The earlier run against port 51073 failed at the same launch step. No baselines were updated.
- Chrome browser preview of the built site — **PARTIAL**: the original export loaded and displayed AF_L; the final export's first navigation raised `TypeError: Failed to fetch` at `atlas_scene.js:253`. After an `about:blank` round trip, the final page initialized and the AF_L control showed `Arcuate fasciculus · left ×`. This browser surface did not supply pointer-move automation, and the previous fetch error remained in its console history. It does not satisfy the visual or hover gate.

## Remaining verification

- Run the visual command above on a surface where Playwright can launch Chromium. Required verdict: all four scenes at **0.000%** changed, plus `hover.verdict: PASS`.
- Confirm the projected-vertex hover visibly brightens one streamline, the tooltip follows the pointer, and leaving the canvas clears both. This was **not measured** here.
- Reduced-motion and presenter-profile interaction remain **not independently verified**. The hover code does not change their animation/profile switches.

## Closeout lesson

The repeated failure was an environment-level Chromium IPC permission denial, not a scene assertion. The gate remains blocked until the runtime can launch its browser; do not infer a visual pass from the unit suite or the partial Chrome preview.
