# GTAO lane handoff — 2026-09-27

## Verdict

**BLOCKED for visual/performance acceptance.** The source and export changes are reviewable, and Node checks pass. This sandbox denies the preview server socket and Chromium's macOS Mach port registration, so no new GTAO screenshots, GPU timings, or visual-baseline PASS lines were produced. Do not treat the new default as visually accepted or deploy it on this evidence.

## Changes

- `viewer/render_pipeline.js`: default GTAO mode using three 0.186.1's `GTAOShader` and `PoissonDenoiseShader`, a half-scale normal/depth pre-pass, half-scale AO/denoise targets, and the existing single HDR composite. The original eight-tap simple shader remains. `aoMode` accepts `gtao`, `simple`, or `off`; a missing WebGL2/`EXT_color_buffer_float` capability selects simple. The normal pass excludes lines/points and restores visibility and renderer state in `finally`. Owned targets, materials, and noise texture are disposed.
- `viewer/atlas_scene.js`, `viewer/mips.js`: `?ao=simple|off` selects the mode; MIPS interaction keeps the query setting. The existing `render.pipeline` diagnostics in `__atlasTest` and `__mipsTest` now include `aoMode` and `requestedAoMode`.
- `scripts/vendor-manifest.json`, `viewer/vendor/addons/shaders/{GTAOShader,PoissonDenoiseShader}.js`, `viewer/vendor/VENDOR.json`: two pinned three shader modules. The modules came from the locally cached `three@0.186.1` npm tarball; its SHA-512 matched the npm cache integrity entry before extraction. `node scripts/vendor-three.mjs --reuse-verified` regenerated the receipt without a network request.
- `scripts/build-hodos.mjs`, `tests/js/hodos_export.test.js`: explicit public export allowlist and receipt assertions for both shaders.
- No atlas asset or manifest hash changed. No visual baseline, including `tests/fixtures/visual/linux`, changed.

## Tuning pending visual review

The proposed settings are an 8 mm world radius, 10 mm thickness, 12 GTAO samples (three horizon slices with four steps each in the vendored shader), eight Poisson samples over three half-scale pixels, and a 0.7 AO composite mix. Half resolution bounds fill cost; the mix is intended to keep parcel tints identifiable. Sulcal contrast and the requested 8–12 directional budget have **not** been visually or GPU verified. The vendor shader's 12 samples cover three slice angles, so the directional requirement needs explicit integrator review.

## Exact checks and output

| Command | Observed output / verdict |
| --- | --- |
| `node scripts/vendor-three.mjs --reuse-verified` | `vendored 22 files from 3 packages into viewer/vendor`; `three@0.186.1`, `three-mesh-bvh@0.9.15`, `camera-controls@3.1.2` — **PASS** |
| `node scripts/vendor-three.mjs --check` | `vendor check PASS: 22 files, 3 packages` — **PASS** |
| `node --loader ./output/gtao/map-three.mjs output/gtao/pipeline-smoke.mjs` | `PASS gtao float=true -> gtao; passes=5`; `PASS gtao float=false -> simple; passes=3`; `PASS simple float=true -> simple; passes=3`; `PASS off float=true -> off; passes=2` — **PASS**. This is a renderer-call smoke check, not a WebGL draw. |
| `npm test` (final run) | `tests 120`, `pass 120`, `fail 0`, `duration_ms 2179.28575` — **PASS** |
| `npm run build -- --out=dist/gtao-review-2` | `files: 188`, `bytes: 32044498`, `atlasManifestSha256: 4d03204569136df62809aef15fa3778e5d631270005d6f2739afd3c475f2494d` — **PASS** |
| `git diff --check` | exit 0, no output — **PASS** |
| Independent Python walk of `dist/gtao-review-2` and arithmetic over `release.json` | 187 listed assets total 32,044,498 bytes; `release.json` itself is 30,747 bytes; filesystem contains 188 files totaling 32,075,245 bytes. Both shader files are present at 12,166 and 7,080 bytes — **PASS** for export completeness. |
| `python3 scripts/serve-hodos.py --directory dist/gtao-review --port 51083` | `PermissionError: [Errno 1] Operation not permitted` at `server_bind` — **BLOCKED**. An earlier server on 51081 started, but subsequent local requests failed with `Operation not permitted` / `ERR_CONNECTION_RESET`; it did not load an atlas scene. |
| `node tests/perf/visual_regression.mjs --url=http://127.0.0.1:51083 --out=output/visual --update` | exit 1: Chromium `mach_port_rendezvous_mac.cc` `Permission denied (1100)` during launch — **BLOCKED**; no baseline written. |
| `node tests/perf/visual_regression.mjs --url=http://127.0.0.1:51083 --out=output/visual` | exit 1: same Chromium Mach port failure — **BLOCKED**; zero scene verdicts. |
| `node output/gtao/verify.mjs perf` | exit 1: headed Chrome for Testing crashpad `Permission denied (1100)` / `Operation not permitted (1)` before a page opened — **BLOCKED**. |

The first build to `dist/gtao-review` succeeded with 188 files / 32,043,926 bytes before a later source edit. A repeat build to that immutable path exited 1 with `Hodos existing output differs; use a fresh --out directory`, so the final export is `dist/gtao-review-2` above. An initial server attempt used `--root` and correctly exited 2 because this script requires `--directory`.

## Evidence gaps and next checks

- `output/gtao/old-baselines/` holds copies of the four original Darwin PNGs made **before** the attempted `--update`. There are no `<scene>-simple.png`, `<scene>-gtao.png`, or insula/medial close-ups because browser startup failed.
- Simple-mode pixel agreement with the old Darwin baselines is **not measured**. No new Darwin baselines were installed; therefore the requested four post-update PASS lines do not exist.
- Headed real-GPU 60-frame draw times at 1280×800, 1× and 2× are **not measured**. The ≤2× simple and ≤8 ms at 1× budgets remain open.
- Compile/link, context restoration, reduced-motion and presenter visuals, and parcel tint identification need a real browser. The Node smoke confirms mode selection, pass counts, and object visibility restoration only.
- Linux CI baselines will be stale after the default look changes. The integrator will refresh them from the CI artifact after review. Do not touch `tests/fixtures/visual/linux/` in this lane.

The one-off scripts in ignored `output/gtao/` can help repeat the renderer-call and screenshot checks. For browser acceptance, use a surface that can bind the local preview server and launch Playwright Chromium. Run the default visual gate with `--update`, inspect all four Darwin images, then run it again without `--update` and require four PASS lines; also compare `?ao=simple` to `output/gtao/old-baselines/` before accepting the change.
