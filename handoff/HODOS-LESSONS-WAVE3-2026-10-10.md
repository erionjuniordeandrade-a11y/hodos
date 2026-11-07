# Hodos lessons, wave 3: six lessons from the WM master deck (2026-10-10)

Branch `feat/lessons-wave3` (worktree `~/hodos-wt-wave3`), PR #12. The owner asked for more lesson content from the
White Matter Tracts & Connectome master deck ("more than the 12 lectures we have so far") and marked the harvest
items on the review page. Wave 3 builds the six lesson source packs; the 12 theory pages are wave 4.

## Team and process
- Authoring: one agent per lesson in an isolated worktree (`~/hodos-w3-<id>`, removed after integration),
  sources limited to a packet per lesson drawn from the deck's cited literature.
- Review: Astra adversarial anatomy review; its blocking items were applied by a fixer pass and then by Claude.
- Integration (Claude): counts 14/85 → 20/126 in tests, build sitemap check (28 locs), export test, landing gate,
  `lesson-pages.mjs`, landing list rows and JSON-LD; `CONTENT_VERSION` 2026-10-10.1.

## Lessons
| id | title | category | steps |
|---|---|---|---|
| limen-crossroads | The limen crossroads | Regional anatomy | 7 |
| insular-floor | The insular floor | Regional anatomy | 6 |
| medial-system | The medial system: fornix, cingulum and the Papez loop | Regional anatomy | 6 |
| motor-beyond-m1 | Motor beyond M1: SMA, initiation and the CST body map | Regional anatomy | 7 |
| control-network | The control network: SLF II and the frontoparietal system | Network lectures | 7 |
| reading-route | The reading route: VOF, MdLF and SLF III | Regional anatomy | 8 |

All carry `reviewStatus:'draft'`. The owner's anatomical review is the gate for go-live; nothing here counts as that review.

## Review fixes applied after authoring
- Learner text names authors instead of raw source ids (motor-beyond-m1).
- The SLF answer states the dorsoventral order of SLF I, II and III and the territory each branch links.
- Regional lessons set `network: null` so they leave the learner's network wash alone; control-network is a
  Network lecture and keeps its FPN wash.
- control-network's FPN claims were checked against `viewer/atlas/surface-labels.bin` (Yeo-7 label 6):
  IP2 182/190 vertices (95.8%), IP1 149/192 (77.6%), IPS1 0/133, LIPd 38/112.

## Evidence
- `npm test`: 168/168 pass. `hodos_publication.mjs` against a local `scripts/serve-hodos.py`: exit 0, 20 lessons.
- The 10 CI browser gates exit 0 locally (mips and tract_ranges need `serve-hodos.py`; they fail under wrangler pages dev).
- Playwright walk of all 41 new steps (title, observation and answer per step): 41/41, 0 console errors.
  Headless software WebGL is slow; advance with DOM clicks, not locator clicks.
- 19 cited PMIDs match their NCBI esummary records.
- CI on PR #12: pass.

## State
- Preview: https://feat-lessons-wave3.hodos-atlas.pages.dev (deploy 199985f4). Production still shows 14 lessons.
- On pages.dev the publication gate fails only on the Cloudflare analytics beacon that Pages injects.
- Owner verdicts per lesson and per step are collected on a review page (db "verdicts"); read them before merging.
- After approval: merge PR #12, build main, deploy `--branch main` (owner-authorized), run the gates against the live site.
