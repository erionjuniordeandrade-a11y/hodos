---
name: verify
description: Prove a change to the Hodos neuroanatomy site (landing, lessons, 3D atlas, lesson player, MIPS exercise, connections graph) works by building it and driving the built site in headless Chromium like a visitor. Use after any edit to viewer/, scripts/ or lesson content, and before telling the owner a change is done.
---

# Verify Hodos

Surface: a static site (`viewer/` exported to `dist/hodos/`) with WebGL pages. Primary proof is a real browser on the built export, not unit tests alone. Feature list and per-feature detail: [features/README.md](features/README.md).

## Launch

```sh
npm ci            # once; node_modules may be a symlink to another checkout
npm run build     # immutable export to dist/hodos/; changed content: npm run build -- --out=dist/hodos-next
```

The driver starts its own preview server on a free port and stops it on exit. Nothing to launch by hand. Ready means `GET /release.json` returns 200, then each page waits for its own data (`__atlasTest.ready`, `__mipsTest.ready`).

Rebuilding over an existing `dist/hodos` worked when checked here. If the exporter ever refuses (the README calls build directories immutable), build to `--out=dist/hodos-next` and pass `--dist=dist/hodos-next`.

## Doctor

```sh
test -f dist/hodos/release.json && node -e "console.log(JSON.parse(require('fs').readFileSync('dist/hodos/release.json')).version)"
ls node_modules/playwright >/dev/null && ls ~/Library/Caches/ms-playwright | grep chromium
```

If `dist/hodos` predates your edit, rebuild before driving. Stale builds are the usual false pass.

## Drive

```sh
node .claude/skills/verify/verify.mjs                      # all features, exit 1 on any failure
node .claude/skills/verify/verify.mjs --only=atlas,mips    # subset (names: landing lessons atlas lessonPlayer mips connections pages)
node .claude/skills/verify/verify.mjs --dist=dist/hodos-next --keep-shots   # other build; failure PNGs to output/verify/
node .claude/skills/verify/verify.mjs --url=http://127.0.0.1:51038          # an already-running server or the live site
```

What each feature does is in `features/`. Rules the driver follows and you must keep when extending it:

- A page counts only if it returns 200, shows its content, and logs no `pageerror`, console `error` or failed request.
- "Ready" is not "drawn". WebGL features wait for data, then for a new frame (`__atlasTest.frames`, `__mipsTest.scene.frames`) after a user action, then check the canvas element's screenshot has more than a dozen distinct colours.
- Routes differ per feature. `goto()` to the same URL does not reload, so each feature opens its own URL in a fresh browser context.
- Use `?test=1` for the `window.__atlasTest` / `window.__mipsTest` hooks. They read state; actions go through real buttons, except `togglePathway('AF_L')`, which stands in for the collapsed bundle picker (the existing visual test does the same).
- `serve.py` in this directory wraps `scripts/serve-hodos.py` with a deeper listen backlog. The stock server resets connections under the atlas's parallel fetches ("Failed to fetch" on MIPS, aborted landing images). That is a preview-server limit, not a site bug.

Heavier existing gates, when the change touches what they cover: `npm test` (120 unit tests, no browser), `node tests/perf/hodos_publication.mjs --url=... --release=dist/hodos/release.json` (every asset hash, 14 lessons, layouts, no external requests), `npm run test:visual` (needs `pngjs` and `pixelmatch`, which `npm ci` installs; platform baselines in `tests/fixtures/visual/`).

## Evidence

Paste the driver's stdout (PASS/FAIL line per feature plus the totals) in your report. Add a failure screenshot only with `--keep-shots`; it goes to `output/verify/`, which is git-ignored. Do not commit PNGs. Proof of a change means the feature line that covers it passes after your edit and failed (or did not exist) before, for example by running the driver on the old build.

## Cleanup

The driver kills the server it started and closes its browser. If it is killed mid-run, stop only the server you started: `lsof -nP -iTCP -sTCP:LISTEN | grep python3`, check the port is yours, then `kill <pid>`. `output/verify/` holds evidence; leave it. Delete a scratch `dist/hodos-next` only if you created it.

## Limits

- Headless Chromium uses SwiftShader. Frame counts and speed are not performance data.
- The driver does not compare pixels. Visual regressions need `npm run test:visual` (see above).
- Clean-URL routes work through `serve.py`. Cloudflare-specific behaviour (`_headers`, 404 page) is only covered by `hodos_publication.mjs` against a real deployment.
- Many instances can run side by side: each picks its own port and fresh browser profile.
