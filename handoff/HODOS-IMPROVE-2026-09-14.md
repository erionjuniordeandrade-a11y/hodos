# Hodos improvement pass, 2026-09-14

Branch `feat/improve-2026-09-14` in worktree `~/hodos-landing-20260913`, off main a641bac. Staged, uncommitted.
Three audits (design against design.md and the Hallmark gates, Lighthouse, SEO/a11y) drove four bounded slices,
integrated and re-verified as one tree.

## What changed
- **One system sheet.** `viewer/atlas.html` and `atlas-sources.html` load only `tokens.css` + `hodos.css`; the four legacy
  sheets (`lesson_player.css`, `atlas.css`, `anatomy_workbench.css`, `atlas-design.css`) are deleted, their live rules ported
  and pruned (computed-style diff across 28 snapshots: only the two intended radius changes). Fixes: Sources link visible
  on every viewport (was hidden ≤1100 px by a dead rule), stage subhead wraps on phones instead of truncating, radius drift
  gone, Playfair @font-face lives in hodos.css, `body data-mode="library"` set in markup so the atlas footer no longer shifts.
- **Case Conference inside the system.** Shared header and Ft4 colophon, tokens only, one numbering system (stage labels
  without numerals, no serif digits on the case list), sticky sidebar offset fixed for the sticky header.
- **SEO / share.** Generated `sitemap.xml` (14 URLs) + `robots.txt` with Sitemap line; distinct titles ≤ 60 chars and
  descriptions 120–158 chars; case page gets canonical, OG/Twitter, theme-color and a static H1; JSON-LD (WebSite, Person,
  Course with 10 LearningResource; Person + BreadcrumbList on sources; no Medical* types); favicon.ico, apple-touch-icon,
  site.webmanifest; noscript on the atlas; middle dots ≤ 1 per line; landing "01/02/03" kickers removed.
- **Fonts and motion.** Metric-matched local fallbacks (`Playfair Display Fallback`, `Inter Fallback`, computed from the
  font files) and font preloads on all pages; the hero film plays only while on screen and not under data-saver or reduced
  motion; `--color-faint` lifted to 66 % L (≥ 5.2:1 on every paper token).
- Landing lesson rows: the lone "L"/"R" glyph is now "Left"/"Right" with a screen-reader suffix, pinned to the title row on phones.

## Evidence (merged export `dist/hodos-improve-20260914`, served with wrangler pages dev)
- `npm test` 66/66. Publication gate `{"assets":111,"lessons":10,"layouts":2,"errors":0}`.
- Lighthouse (local, mobile/desktop): `/` 95/100, CLS 0/0; `/atlas` 92/100 (live before: 39/85), CLS 0.000/0.000 (before 0.372/0.309);
  `/case-conference` 94/100, CLS 0.095/0.042 (before 0.878/0.027).
- Screenshots at 1440 and 390 for all five pages: no horizontal overflow, Sources link visible.
- Remaining debt: ~118 literal colours inside hodos.css (scientific pigment fallbacks and near-token values), width-breakpoint
  @media blocks not merged, Playfair still a full TTF (OFL reserved name), tracts.bin served uncompressed (20 % brotli win available).

## Deploy (owner-authorized only)
    cd ~/hodos && npx wrangler pages deploy /Users/eriondeandrade/hodos-landing-20260913/dist/hodos-improve-20260914 --project-name hodos-atlas --branch main
Owner dashboard step still open: Cloudflare Redirect Rule www → apex (see HODOS-SEO-2026-09-14.md).
