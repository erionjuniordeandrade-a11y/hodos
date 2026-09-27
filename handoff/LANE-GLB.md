# GLB lane handoff — 2026-09-27

## Verdict

**BLOCKED for release acceptance.** The 17 atlas GLBs are landed in the review diff and the export builds. The required Darwin fixture gate could not start its own Chromium process in this sandbox. An independent browser comparison of the old and new exports met the 0.5% pixel criterion for all four scenes, but it does not replace the named fixture gate.

## Changed files

- `viewer/atlas/{cortex-L,cortex-R,inferior-context}.glb` and all 14 `viewer/atlas/subcortex/*.glb`: meshopt GLBs, position quantization 14 bits.
- `viewer/atlas/manifest.json`: 17 new byte counts and hashes; original source hashes and terms retained; dated modification entry.
- `viewer/atlas_scene.js`: new manifest hash and expansion of normalized position attributes to float before applying the GLB world matrix. Without this conversion, `applyMatrix4()` clamped integer attributes and made the brain render tiny.
- `scripts/optimize-glb.mjs`: added `KHR_mesh_quantization` to I/O and compressed without glTF Transform's `meshopt()` reorder, which would break the external per-vertex cortical labels. Added `--position-bits=0|14|15|16`; 14 was used for every landed GLB.

The original two cortex GLBs used Draco. The other 15 GLBs were uncompressed; all 17 new GLBs declare `EXT_meshopt_compression` and `KHR_mesh_quantization`. `viewer/atlas.html` and `viewer/mips.html` have no direct Draco references. The existing Draco loader wiring and vendor files remain, as requested.

## Byte counts

Measured by comparing `viewer/atlas` with `/tmp/hodos-glb-base/viewer/atlas` using Python `Path.stat().st_size`; the latter was the detached HEAD worktree. Percent change is `(after / before - 1) × 100`.

| GLB | Before | After | Change |
|---|---:|---:|---:|
| cortex-L.glb | 83,940 | 305,608 | +264.08% |
| cortex-R.glb | 85,316 | 305,388 | +257.95% |
| inferior-context.glb | 1,447,108 | 400,236 | −72.34% |
| subcortex/AMY-lh.glb | 14,904 | 5,620 | −62.29% |
| subcortex/AMY-rh.glb | 14,900 | 5,656 | −62.04% |
| subcortex/CAU-lh.glb | 20,836 | 7,596 | −63.54% |
| subcortex/CAU-rh.glb | 20,828 | 7,440 | −64.28% |
| subcortex/GP-lh.glb | 11,300 | 4,456 | −60.57% |
| subcortex/GP-rh.glb | 11,300 | 4,408 | −60.99% |
| subcortex/HIP-lh.glb | 29,736 | 10,212 | −65.66% |
| subcortex/HIP-rh.glb | 29,736 | 10,336 | −65.24% |
| subcortex/NAc-lh.glb | 11,748 | 4,548 | −61.29% |
| subcortex/NAc-rh.glb | 11,744 | 4,608 | −60.76% |
| subcortex/PUT-lh.glb | 32,760 | 11,316 | −65.46% |
| subcortex/PUT-rh.glb | 32,760 | 11,264 | −65.62% |
| subcortex/THA-lh.glb | 34,200 | 11,640 | −65.96% |
| subcortex/THA-rh.glb | 34,200 | 11,524 | −66.30% |
| **Total** | **1,927,316** | **1,121,856** | **−41.79%; 805,460 bytes saved** |

The cortex files grew individually because Draco encoded them more compactly than order-preserving meshopt. Their meshopt decode nevertheless reduced the measured navigation-to-ready median below.

## Verification and exact output

- `git worktree add /tmp/hodos-glb-base HEAD` → `HEAD is now at 4d1b238 ...`; the worktree supplied the original GLBs and source-page timing control. At closeout, `git worktree remove /tmp/hodos-glb-base` removed the checkout directory but exited 255 because this sandbox cannot delete `/Users/eriondeandrade/hodos/.git/worktrees/hodos-glb-base`. `git worktree prune --expire=now` reported the same permission error. Git still lists a **prunable stale worktree record**; the integrator must prune it from a writable owner checkout.
- `find /tmp/hodos-glb-base/viewer/atlas -name '*.glb' -print | sort | while IFS= read -r src; do dst="output/optimized/${src#/tmp/hodos-glb-base/viewer/atlas/}"; node scripts/optimize-glb.mjs "$src" "$dst" || exit 1; done` → exit 0 for 17 files, `positionBits: 14`. First cortex: 83,940 → 305,608 bytes; final THA-rh: 34,200 → 11,524 bytes.
- Python `hashlib.sha256` + `Path.stat()` verification against every manifest GLB record → 17/17 hashes and sizes matched; manifest SHA-256 `b8d41bf39598ca26306093a7e39779147ea09567a508c8fc3caf5fa889f9e5a5`. Independent GLB JSON inspection found both required extensions in all 17.
- NodeIO decode comparison with original worktree GLBs → 17 files; maximum vertex displacement **0.009315886565240655 mm**; **0** files over 0.1 mm; **0** non-cyclic changed triangles. This checks vertex index correspondence as well as geometry.
- `npm test` → **PASS**, 120 tests, 120 passed, 0 failed, 0 skipped, `duration_ms 969.691292` (final closeout run).
- `npm run build -- --out=dist/hodos-glb` → **PASS**, 186 files, 31,214,021 bytes, manifest SHA-256 `b8d41bf39598ca26306093a7e39779147ea09567a508c8fc3caf5fa889f9e5a5`. The unmodified base export was 32,018,869 bytes, so the exported release shrank by 804,848 bytes. The earlier rejected build at that path was preserved as `dist/hodos-glb-rejected-early` before this final build.
- `node scripts/vendor-three.mjs --check` → `vendor check PASS: 20 files, 3 packages`.
- `node tests/perf/visual_regression.mjs --url=http://127.0.0.1:51059 --out=output/visual-final-export` → **BLOCKED**, exit 1 before any scene comparison on the final `dist/hodos-glb` export. Chromium logged `FATAL:base/apple/mach_port_rendezvous_mac.cc:159 ... Permission denied (1100)`. The same gate failed on the known-positive old export at port 51047. Darwin baseline percentages from that gate: **not measured**.
- Separate Playwright MCP browser, 1280×800, reduced motion, wait for data and a rendered frame, `pixelmatch` threshold 0.1 against the old export captured on the same browser: atlas-default **0.000000%**, atlas-parcel **0.000195%**, atlas-bundle **0.000000%**, mips-default **0.000000%** changed. All are below 0.5%, but this is a cross-checkout comparison, not the Darwin fixture gate. Browser requests were serialized two at a time to avoid local proxy connection resets.
- Direct final-export browser check at `http://127.0.0.1:51060/atlas.html?test=1&profile=presenter` with reduced motion emulated → `{ready:true,profile:"presenter",reducedMotion:true,playing:false,vertices:[32492,32492],frames:4}`. This confirms the presenter profile and reduced-motion state reach a drawn atlas.
- Direct source-page timing with the same `python3 -m http.server` implementation on old worktree (`51056`) and new `viewer` (`51058`), three navigation-to-`__atlasTest.ready` runs each under the same two-request Playwright route: old **393.4, 275.2, 271.2 ms** (median **275.2 ms**); new **272.5, 229.9, 246.0 ms** (median **246.0 ms**). Median improvement **29.2 ms**, about **10.61%**. The route's request serialization limits production generalization.

## Open questions / not verified

- Run the repository visual gate in an environment where its own Chromium launch succeeds, against `tests/fixtures/visual/darwin`, before accepting the lane. No baseline files were changed.
- iPad/Safari load time and mobile GPU memory were not measured.
- The stale administrative worktree record remains because the common `.git` directory is outside this lane's writable roots.
- No commit, push, or deploy was made.
