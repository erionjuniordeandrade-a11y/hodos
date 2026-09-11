# Hodos

Interactive cortex and white-matter anatomy coursebook: ten lessons, 58 relationships,
a reference 3D atlas (HCP S1200 surface, HCP-MMP1 parcels, HCP1065 tractography), and
credited dissection photographs. Public at https://hodos-atlas.pages.dev/.

**Educational draft, not a clinical tool.** Reference geometry, tractography and
photographs do not establish individual anatomy, functional localization or surgical
safety. Keep the draft wording and every third-party credit intact.

Hodos is a separate product from TractLab (the single-case workstation in `~/tractlab`).
Never call the atlas TractLab, and never import TractLab cases, credentials or handoffs.

## Running & testing

- `npm ci` then `npm test` (Node 22+, `node --test tests/js/*.test.js`).
- `npm run build` exports an immutable release to `dist/hodos/`; for changed content
  pass `-- --out=dist/hodos-next`. The exporter enforces a file allowlist and asset hashes.
- Preview: `python3 -m http.server 51038 --bind 127.0.0.1 --directory dist/hodos`.
- Deploy is owner-authorized only: `npx wrangler pages deploy <dir> --project-name hodos-atlas --branch main`.

## Agent skills

### Issue tracker

Issues live in GitHub Issues on `erionjuniordeandrade-a11y/hodos` (public), via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical roles, each label string equal to its name. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` plus `docs/adr/` at the repo root, both created lazily. See `docs/agents/domain.md`.
