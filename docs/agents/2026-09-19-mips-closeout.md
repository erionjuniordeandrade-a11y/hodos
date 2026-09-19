# MIPS corridor exercise release

## Outcome and ownership

Published **One target, two corridors** at https://hodosatlas.com/mips. The user accepted the proposed Orient, Compare, Explain exercise. Owner: Erion de Andrade. Workflow: `hodos:mips-corridors`, repository change in `hodos`, branch `main`, baseline `b10a7ba`.

The implemented outcome is one educational exercise with a shared fictional target, two labelled access volumes, two illustrative widths, three named camera views, free rotation, reasoning prompts and a session-only note download. Links are present on the landing page and Case Conference. Existing 14 lessons remain separate.

## Sources and clinical bounds

- Live atlas producer, bundle metadata, case marker support, export allowlist and shared design tokens were inspected before implementation. The code graph had no registered repository, so targeted source reads were used.
- Lavrador et al., *Cancers* 2026, https://doi.org/10.3390/cancers18081241 and PMID 42073565: five-point target-trajectory framework. In this source, outer radial corridor refers to cortical/sulcal entry, inner radial corridor to the white-matter path/cannulation axis. The framework has no external outcome validation. No borrowed diagrams or prose passages were used.
- Pradilla et al., ENRICH, https://doi.org/10.1056/NEJMoa2308440: selected acute ICH, with benefit appearing attributable to lobar cases. The page explicitly avoids transferring that benefit to tumour surgery.
- Authored coordinates in `mips_content.js` are illustrative atlas-space points, not identified sulci, validated approaches or measurements of patient anatomy. Widths are geometric examples, not device specifications or tissue-strain simulations.
- Published status is **educational draft awaiting independent clinical review**. No clinical validation, learner benefit or real-world surgical outcome was observed or claimed.

## Changes and verification

- Pure validated corridor geometry and an injected-Three overlay are integrated lazily into the existing renderer. The ordinary atlas creates no corridor overlay. Replacement and teardown dispose owned resources.
- Dedicated page/controller/CSS, strict URL display choices, no note data in URLs or browser storage, text download, error/retry state, page-exit and bfcache handling.
- Build allowlist, extensionless preview route, sitemap and exact matching import-map CSP are updated. New executable inline scripts are not admitted.
- Focused pure tests were written before implementation. `npm test`: **76 passed**. `git diff --check`: passed.
- `node tests/perf/mips.mjs`: passed locally and on the final public build. Verified common endpoints, A/B/both selection, width without axis drift, camera views, keyboard/pointer rotation, Explain/download, unchanged storage, reload/history, navigation away/back, 320/390/768-pixel layouts, both entry links and unavailable-renderer fallback. Zero unexpected browser errors.
- Actual screenshots were inspected for desktop, phone, lateral, superior and anterior views. Native Chrome independently showed the live anatomy and both corridors. Controls were moved beneath the brain so phone users can see the effect of toggling; pathway colours have a visible key.
- Publication gate on the final site: **146 asset hashes, 14 lessons, 2 atlas layouts, zero errors**. Landing checks include six widths. The ordinary atlas was explicitly checked for absence of optional corridor DOM.
- Existing preview gate: **3 desktop previews, 3 mobile dialogs, 4 navigation fallbacks passed**.
- CI on code commit `9232b28`: **success**, https://github.com/erionjuniordeandrade-a11y/hodos/actions/runs/35456855260. Includes the unit suite, fresh build, publication gate, preview gate and MIPS browser gate.

## Findings resolved during verification

1. A camera test asserted the active-view indicator before its animation-frame callback. Both local CI and live reproduction identified the same assertion. The test now waits for the rendered indicator as well as scene state; no assertion was removed.
2. Native Chrome initially paired the new exercise with an older cached atlas renderer, producing `scene.setCorridors is not a function`. The exercise now requests a versioned renderer URL; failed initialization disposes and clears any assigned scene. Subsequent native reload and final public checks succeeded.
3. Lifecycle review identified missing teardown. Non-bfcache exits now dispose; bfcache returns retain the interactive scene. Async initialization also checks whether the page has already left.

## Release and recovery

- Feature commit: `fb5af54`; renderer/request and browser-check fix: `9232b28`.
- Final reviewed export: `dist/mips-20260919-v4`, 148 files including release receipt.
- Immutable production deployment: https://b058b11f.hodos-atlas.pages.dev
- Public runtime: https://hodosatlas.com/mips
- Evidence: ignored `output/mips-20260919/`, especially `public-final/report.json` and `publication-final/`.
- Baseline rollback deployment: https://930ecf1c.hodos-atlas.pages.dev. Restore that deployment or revert the two scoped code commits after checking current concurrent work.
- No dependencies, credentials, paid jobs, patient data or durable personal-memory updates. Existing exports and diagnostic evidence are preserved. No unrelated files changed.
- Temporary local preview servers were stopped. The final public exercise tab is retained in Chrome for review.
- Next product step requires clinical/editorial review if the educational-draft status is to change; it is outside the completed implementation scope.
