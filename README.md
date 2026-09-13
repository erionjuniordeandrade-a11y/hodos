# Hodos

[Open Hodos](https://hodos-atlas.pages.dev/) — an interactive cortex and white
matter anatomy coursebook, created by Dr. Erion de Andrade.

Ten lessons connect 58 anatomical relationships through Orient, Compare and
Explain phases. Five credited dissection photographs complement selected
language and optic-radiation relationships. Study and Present modes share a
reference 3D atlas. Learning progress stays in the browser.

Hodos is an educational draft. Reference geometry, tractography and photographs
do not establish individual anatomy, functional localization or surgical safety.
It is not a clinical planning or navigation tool.

## Run and build

Use Node.js 22 or later and Python 3 for the preview server:

```sh
npm ci
npm test
npm run build
python3 -m http.server 51038 --bind 127.0.0.1 --directory dist/hodos
```

Open http://127.0.0.1:51038. Runtime dependencies and fonts are vendored and
served locally. The exporter checks an explicit file allowlist and atlas/image
hashes. Build directories are immutable: for changed content, pass
`npm run build -- --out=dist/hodos-next`.

## Browser verification

```sh
npx playwright install chromium
node tests/perf/atlas_dissection.mjs --url=http://127.0.0.1:51038 --out=output/dissection
node tests/perf/atlas_v1.mjs --url=http://127.0.0.1:51038 --out=output/v1
node tests/perf/hodos_publication.mjs --url=http://127.0.0.1:51038 --release=dist/hodos/release.json --out=output/publication
```

GitHub Actions runs the unit tests, a fresh export and the publication gate against
that export on every push to `main` and on pull requests (`.github/workflows/ci.yml`).
The export ships a first-party Content-Security-Policy and a Permissions-Policy in
`_headers`; fonts and brand files are referenced with content-hash keys so long caches
never serve stale bytes.

## Publish

The existing Cloudflare Pages project is `hodos-atlas`, production branch `main`.
After verifying a fresh build and authenticating with Wrangler:

```sh
npx wrangler whoami
npx wrangler pages deploy dist/hodos --project-name hodos-atlas --branch main
node tests/perf/hodos_publication.mjs --url=https://hodos-atlas.pages.dev --release=dist/hodos/release.json --out=output/public
```

Deployment is a manual, authorized release; pushing alone does not deploy.
Prior immutable deployments remain available in Pages for rollback.

## License and attribution

Original Hodos software and documentation are licensed under the [MIT License](LICENSE).
**Third-party assets are excluded from that grant** and retain their respective
terms: atlas data, Rhoton photographs, Three.js/Draco and Playfair Display.
See [Third-party notices](THIRD_PARTY_NOTICES.md), the
[atlas provenance manifest](viewer/atlas/manifest.json) and the
[dissection reference terms](viewer/reference-plates/README.md).
Photograph watermarks and credits must remain intact; MIT does not grant
unrestricted reuse of those photographs.

This standalone repository was extracted from the TractLab teaching atlas.
It contains the public educational application and its tests, with fresh history.
