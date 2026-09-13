# Case illustrations release — 2026-09-13

Complete: three labelled, original synthetic MRI-style illustrations added to the fictional Case Conference cases and published with user authorization. Existing schematic, atlas, lessons and case progress retained. Image generation and implementation performed by coordinator; no patient data used.

Source commit `64edec0` pushed to `origin/codex/case-conference-pilot`. Git main was not merged. Manual Pages production deployment uses the tested feature-branch build, as permitted by the existing release workflow.

Build: `dist/hodos-case-mri-20260913`, 102 files, 27,989,798 bytes, unchanged atlas manifest. Production URL: https://hodos-atlas.pages.dev/case-conference. Immutable deployment: https://6a97a46d.hodos-atlas.pages.dev. Previous production rollback target: `081a95de-ab82-4955-94c3-15b915cb9c17`.

Verification:
- `npm test`: 66 passed, zero failed. `git diff --check` clean.
- Case browser suite locally and against production: all three full journeys, matching decoded images, synthetic captions, microphone simulation/denial, storage isolation, draft reload, mobile image visibility and overflow checks passed. No page errors or external requests.
- Desktop screenshots of all three illustrated cases and expanded 390px mobile image inspected.
- `hodos_publication.mjs` against production with the exact local release receipt: 100 public asset hashes/byte counts matched; 10 lesson openings/phases and two layouts passed; zero errors. Nonpublic paths returned 404.
- Reports: `output/case-mri-20260913/`, including `publication/report.json` and `live-cases/report.json`.

Limits: broad image laterality/location inspected against written fictional cases, not independent anatomical validation. Images remain conceptual, unregistered illustrations; written vignettes define the findings. No inference about tracts, vessels or margins is supported by generated pixels. No native iOS/Safari device test or trainee-outcome validation was performed. No new dependencies or backend. Initial three-panel image candidate excluded.

Contract fulfilled; no further implementation required. Clinical draft review remains a content-governance task, explicitly labelled in the app. No durable memory update requested.
