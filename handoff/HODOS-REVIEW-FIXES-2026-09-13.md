# Hodos: review and fixes (2026-09-13)

Owner: Dr. Erion de Andrade. Implementer: Claude Fable 5.1 (orchestrator) with three
read-only review slices and one verification slice (Sonnet). Owner authorised the fixes
("fix the problems you found"); the closeout of the same day records the deployment.

## State found

- Live site served `dist/hodos-case-mri-20260913`, built from `codex/case-conference-pilot`
  (commits 9a71660, 64edec0, 4b2a4b4); `main` was at 482c555. Fast-forwarded main.
- Case Conference public with three fictional cases and three AI-generated FLAIR-style
  illustrations; the page banner still says the debriefs await clinical review. Not changed.
- All 42 PMIDs and 5 DOIs verified against NCBI and CrossRef; one title paraphrased.

## Fixed (commits 7547f7e, 4ce7359)

1. Continue-with chain derived from `CURRICULUM` order; loops removed, lesson 09 reachable.
2. Case sidebar sticky with its own scroll on desktop; schematic default one line; missing
   illustration renders a note instead of throwing.
3. `_headers`: Content-Security-Policy (import map by hash, `wasm-unsafe-eval`, blob workers
   and media), Permissions-Policy (`microphone=(self)`), vendor scripts revalidate, fonts and
   brand files carry `?v=<sha12>` keys enforced by the build. `atlas-theme.css` removed.
4. WebGL context loss pauses the loop and reports; restore redraws (tested with
   `WEBGL_lose_context`).
5. Cortex framed and drawn before the 3 MB pathway buffer arrives (first non-blank frame
   ~980 ms locally, uncached).
6. Case source title for PMID 34598138 verbatim. CONTENT_VERSION 2026-09-13.1.
7. `.github/workflows/ci.yml`: tests, export, publication gate. First run green.

## Evidence

- `npm test` 66/66. Build `dist/hodos-fixes-20260913` (100 assets).
- Against a header-applying preview: atlas_v1 (58 steps, 6 layouts), case_conference,
  atlas_dissection, hodos_publication all passed; CSP scan: zero violations across home,
  lesson, sources, case flow and the reference dialog iframe; fonts load with keys.
- Production: deployment https://8c20a8c0.hodos-atlas.pages.dev serves hodos-atlas.pages.dev;
  publication gate against the live host: 100 assets, 10 lessons, 0 errors; CSP and
  Permissions-Policy present; fonts cached 30 d under keys; JS revalidates.
- CI run https://github.com/erionjuniordeandrade-a11y/hodos/actions/runs/34775522129 success.

## Limits and open items (owner)

- `/atlas-theme.css` still answers 200 from the Cloudflare edge cache of the Sep 11 release
  (age ~2.4 d); nothing links to it and it will expire.
- Clinical review of the three case vignettes, debriefs and generated images is still yours;
  the debriefs teach epistemic caution more than the surgical next move.
- Not done, by design: shared DOM helpers refactor, lesson sampling-support rewrite, usage
  signal, the three sibling worktrees (launch video, cinematic, offline Apple).
- Rollback: previous immutable deployment in Pages (build `hodos-case-mri-20260913`).
