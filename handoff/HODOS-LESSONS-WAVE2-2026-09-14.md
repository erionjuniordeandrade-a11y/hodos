# Hodos lessons, wave 2: four new Regional lessons (2026-09-14)

Branch `feat/lessons-wave2` (worktree `~/hodos-wt-lessons`) off main a3cbf61. Owner asked for all four, then "wait for the reworks then deploy all fourteen".

## Team and process
- Authoring: four Codex sessions (`gpt-5.6-luna`, effort xhigh), one lesson each in an isolated worktree, sources restricted to a
  literature packet per lesson (8 references each, every PMID verified live against NCBI esummary by a Claude agent; guessed ids
  that failed the title match were dropped and are listed in the agents' reports).
- QA: four Grok sessions, read-only, one report per lesson (`~/hodos-wt-lesson-*/output/qa-*.md`): sources, scene vocabulary,
  copy rules, pedagogy, anatomy flags.
- Supervision: Astra (`gpt-6-astra`) adversarial anatomy review across all four (`scratchpad/lessons/astra-review.md`), then
  re-authoring by the original sessions with both review lists, then Astra's focused re-check of the two re-authored lessons.
- Integration (Fable): one static import per module in `lesson_content.js`, factories exported once from `resident-anatomy.js`,
  shared papers deduplicated (K3 = Fernández-Miranda 2008, K8 = Yeh 2018, declared once in `corpus-callosum.js`; installed
  geometry cited as the existing D2 = Yeh 2022 per Astra), region cards merged, `CURRICULUM` order
  motor-cst, internal-capsule, fat-language, corpus-callosum, optic-radiation, ventral-stream, interoception, brainstem-corridors;
  every hard-coded "10 lessons / 58 steps" raised to 14 / 85 (tests, build sitemap check, export test, landing gate); landing
  list rows and JSON-LD `Course.hasPart` extended.

## Lessons
| id | title | steps | words | packet |
|---|---|---|---|---|
| internal-capsule | Internal capsule & thalamic radiations | 7 | ~2.2k | sources-internal-capsule.json |
| corpus-callosum | Corpus callosum & the interhemispheric corridor | 7 | ~2.2k | sources-corpus-callosum.json |
| ventral-stream | Ventral stream & the temporal stem | 6 | ~2.0k | sources-ventral-stream.json |
| brainstem-corridors | Brainstem & cranial nerve corridors | 7 | ~2.0k | sources-brainstem.json |

All carry `reviewStatus:'draft'` and the site's "anatomical review pending" wording. The owner's own anatomical review is still
the gate that removes that wording; nothing here counts as that review.

## Evidence
- `npm test` 69/69 (14 lessons, 85 steps, every scene target resolves in both hemispheres).
- Publication gate on the export: 134 assets, 14 lessons walked, 0 errors. Landing gate green at 320 to 1440.
- Playwright walk of all 27 new steps at `?test=1`: every step ready, bundles exactly as declared, 0 console errors;
  screenshots in `scratchpad/lessons/shots2/`.

## Known limits
- No new dissection plates; the four lessons use bundles, parcels and deep structures only.
- The brainstem has no mesh or nuclei in the atlas; the lesson says so where it matters.
- Sandbox limits: Codex and Grok cannot run browsers or reach the network; every browser gate and PMID check ran outside them.
