# Teach-back program: Hodos + TractLab improvement plan (2026-09-25)

Status: PLAN, not started. Nothing implemented. Owner decisions in §2 gate parts of it.
Source of the ideas: creative-reframing session 2026-09-25 (13 ideas, owner "liked").
Evidence base: read-only scan of `~/hodos` main `768755c`, `~/tractlab` main `165a234`,
`~/hodos-offline-apple-20260911` (uncommitted), re-checked by the orchestrator.
Pointer copy: `~/tractlab/docs/plans/2026-09-25-teach-back-program.md`.

## 1. Goal and the one metric

**Outcome:** a resident can explain a pathway in the context of an intra-axial case, and a
surgeon's TractLab review records whether it changed the plan.

**Binding constraint:** owner review hours (2–4 h/week). Every unit below states the owner
minutes it adds. A unit that adds owner review without adding outside eyes is last in line.

**North-star metric (Hodos):** completed teach-backs per week, and share of key relationships
named at day 7. **TractLab metric:** per reviewed case, did the review change approach, resection
limit, or nothing. Pilot language throughout (N<20 = pilot, never "validated").

### Hard constraints (active in every unit)

- The private 3T case never appears in Hodos, a figure, a paper, or an export. CC0 D0 only.
- TractLab QC stays fail-closed and owner-signed. Resident ratings are research data, never a signature.
- Population atlas is labelled population data everywhere; nothing reads as patient planning.
- No autonomous lesion segmentation. No model grades a resident.
- Every lesson/case keeps `reviewStatus:'draft'` until the owner reviews it (`lesson_content.js:117` enforces it).
- Resident-facing material: pt-BR, zero terminal (fellows rule). Resident contributions carry their full name.
- No PHI in any Hodos free-text store; the UI says so where residents type.

## 2. Owner decisions (answer before the gated phase starts)

Ruled 2026-09-26: the owner accepted every default below ("I agree with you").

| # | Decision | Gates | Ruling (default accepted 2026-09-26) |
|---|---|---|---|
| D1 | Teach-back language: residents speak English, pt-BR, or both? (lessons are English) | Phase 1A term lists | both; EN terms + pt-BR synonyms |
| D2 | Browser speech engine: Chrome's Web Speech sends audio to Google; accept with a disclosure, or typed-only on Chrome? | Phase 1A mic button | typed + mic, disclosure shown, Safari/on-device preferred |
| D3 | A backend (Cloudflare Worker + D1, anonymous cohort code, no names, privacy page, LGPD) | all of Phase 4 | NO backend; Phase 4 waits |
| D4 | Two named residents who commit to rating/teach-back for 30 days | Phases 2B, 4 rating | none → idea 1 dies (n=100 kill rule) |
| D5 | Protect the offline Apple worktree by committing its untracked `apple/` to a branch | Phase 5 | do nothing, Phase 5 waits |
| D6 | Does the technical note want a third, population-context figure? | Phase 3B | no → 3B dropped |

## 3. Phases and units

Phases 0 and 1 run in parallel. Everything in Phase 1 ships behind the existing "draft" banner.
Each unit: own worktree (`agent-claim.sh worktree`), own gate, one merge. Model per unit is named.

### Phase 0 — Owner review (idea 13, the no-build comparator). Owner: ~6–8 h over 3 weeks.

- 0.1 Review the 14 lessons and 4 cases; the agent pre-builds a one-page review sheet per
  lesson (claims + sources + steps) so review is reading, not hunting. Sonnet builds sheets.
- 0.2 Post kit 08/09 or V4 (already built, `~/Movies/Hodos/`). Owner action only.
- 0.3 Finish TractLab wave 3 from `docs/plans/2026-09-14-improvement-wave-1.md` (Codex luna,
  Sol review). Independent of this program; keep it moving.
- Exit: lessons that pass flip to a reviewed status (needs a small change to the draft guard,
  its own unit, after the first pass).

### Phase 1 — Local learning loop in Hodos, no backend

**1A Teach-back with checklist diff (idea 3). Pilot on motor-cst, then all 14.**
- Data: add `terms` to each takeaway in `viewer/lesson_briefings.js`
  (`point(step,text,{terms:[{id,label,en:[...],pt:[...]}]})`). The recap string at
  `anatomy_lesson_player.js:156` stays; the takeaways are already the "three relationships".
- Logic: new pure module `viewer/teachback.js`: normalise transcript (case, accents, hyphens),
  match synonyms, return `{named[], missing[]}`. No model, no score, no grade shown.
- UI: in the recap phase, "Explain it" → mic (Web Speech, `lang` from D1) or typed box →
  shows only the missing relationships, each linking back to its step scene.
- Storage: add `teachback:{at, missingIds[]}` under the existing `tractlab.anatomy.learning.v1`
  entry (`anatomy_learning.js:6`); transcript is NOT stored.
- Tests: unit tests for the matcher (EN + pt-BR, accents, plurals, a negative control that names
  nothing); Playwright gate with a mocked SpeechRecognition; CSP/Permissions-Policy still green
  (`scripts/build-hodos.mjs:186` already allows microphone=self).
- Model: Opus designs the term lists for motor-cst (judgment, anatomy); Codex luna implements
  module + UI; Sonnet runs gates; owner checks the motor-cst term list (~20 min).
- Pilot success: owner narrates motor-cst twice (once complete, once deliberately omitting two
  relationships) and the missing list is exactly right both times, in each language from D1.
- Stop: speech recognition misses anatomical terms in more than about a third of attempts in
  pt-BR → typed-only, and say so.

**1B Decision drills in Case Conference (idea 5), local only.**
- Today: 6 Socratic stages (`case_conference.js:9`), free text + self-rated rubric, no choice
  with consequences. Add an optional `decision` field per case in `case_content.js`:
  `{question, options:[{id,label,rationale,sourceIds}]}`, a new stage between Reconsider and
  Respond, choice stored in `hodos.caseConference.v1`.
- Shows the author's rationale for every option after the choice. The "split of prior choices"
  needs Phase 4; until then it is absent, not faked.
- Model: Opus drafts decisions for the 4 fictional cases (sources must be in the case's own
  source list, PMIDs NCBI-verified); Codex implements; owner reviews 4 decisions (~40 min).

**1C Post-op replay (idea 11).** A "Revisit after a case" prompt on each lesson's recap:
one local free-text box, "What did the operation confirm or contradict?", with the no-identifiers
warning. Local only. Codex, small. Owner: none beyond Phase 0.

**1D Resident-authored lessons (idea 2), no code.** A pt-BR DOCX template (scene, five steps,
question, answer, sources) plus an agent-run converter into the `lesson()` shape as a draft PR.
Owner reviews the converted draft, not the DOCX. Needs D4 (a willing resident). Sonnet builds
template + converter; converter tested on an existing lesson round-trip.

**1E No-lessons week (idea 4) → measure, don't hide.** Hiding lessons on a public site to learn
is too blunt. Instead read Cloudflare Web Analytics per path (`/atlas` vs `/lessons/*`) for 4 weeks.
Owner reads the dashboard (wrangler token lacks analytics scope). Revisit only if Phase 4 exists.

### Phase 2 — TractLab schema and instruments

**2A Plan-outcome field (idea 12, TractLab half).** Review record v3 in
`viewer/review_record.js` (today `SCHEMA_VERSION=2`, no outcome field): optional
`outcome:{effect:'approach'|'limit'|'none'|'not-recorded', note}`; v2 records restore unchanged
(fail-closed restore test, like wave-1 W2). Codex luna implements, Sol read-only review.
Owner fills it on real reviews; counts stay pilot language.

**2B Resident rating instrument (idea 1), CRF first.** Per the n=100 ruling, first artifact =
a one-page rating CRF + a 12-case calibration packet, delivered as a pt-BR DOCX paper kit.
Ratings live in separate files (`docs/qc/ratings/<rater>-<date>.md`); `approved_by` in
`fidelity.py:273` stays the single signing authority and is not touched. Needs D4.
Kill: no two committed raters in 30 days; or the 12-case κ is uninterpretable.

**2C Per-bundle evaluation strip (idea 7).** One row per displayed bank: evidence class
(Tract vs Atlas prior, ADR-0001), closest lesion distance (from `/api/profile`), fidelity status,
and "what would change the class" drawn from the existing `FidelityRefusal` reasons. No new
science, only existing, signed numbers. Opus designs (it must not read as a risk score);
Codex implements in `viewer/index.html` dock; Grok QA on the demo AND the 3T case locally
(case-map bug lesson). Owner acceptance ~30 min.

### Phase 3 — Bridges between the products

**3A TractLab → Hodos case export (idea 8).** Both use MNI RAS mm (`case_lesions.js:2`,
`atlas_prep.py` ANTs warps). Export D0 (CC0, `demo-leipzig-sub-010005`) bank samples warped to
MNI into a Hodos asset with its own sha256 in `atlas/manifest.json` (today the loader accepts only
`tracts.bin` + ranges, `atlas_scene.js:203-264`, so the loader needs a per-case asset slot).
Label on screen: "one healthy open-data subject; lesion is illustrative". Never the 3T case: the
exporter refuses any case root other than D0 by manifest id, with a test.
Model: Opus for the loader design, Codex for exporter + loader, Sol review. Owner ~30 min.

**3B Hodos as figure engine for the note (idea 9).** Only if D6 = yes. Render with the existing
capture scripts; add the figure to `docs/manuscript/figures/figure_provenance.json` with its hash
so `build_docx.py` enforces it. Sonnet.

### Phase 4 — Shared state (only if D3 = yes)

Cloudflare Worker + D1 under `/api/`, anonymous cohort code, no names, no free text stored,
privacy page in pt-BR + EN, CSP `connect-src` updated. Enables:
- 4A anonymous split of decision-drill choices (idea 5 completion);
- 4B spaced retrieval (idea 6): opt-in email with one question per takeaway at day 2/7/30,
  via Cloudflare Email Service; unsubscribe in every message;
- 4C metrics (idea 12, Hodos half): teach-backs/week, day-7 recall, from 1A + 4B events;
- 4D online version of the 2B rating task (after the paper kit works).
Model: Opus designs data model + privacy page; Codex builds; Sol security review; Sonnet gates.
Owner: approve privacy text, create D1/email bindings (credential step is the owner's).

### Phase 5 — Offline iPad pre-incision briefing (idea 10), speculative

- Found: a SwiftUI + WKWebView shell (`apple/`, XcodeGen, Mac + iPad targets) built and run on a
  simulator, but UNTRACKED and based on `024561b` (10 lessons); two tiny web hooks
  (`hodosNativeProgress`, `hodosNativeSHA256`) are uncommitted edits.
- 5.1 (D5) Commit that worktree's work to its own branch as-is. Never delete it blind.
- 5.2 Rebase hooks onto main; regenerate the bundled site (14 lessons, 4 cases).
- 5.3 "Briefing" mode = corridor scene + teach-back (1A) offline; iPadOS on-device speech.
  Every screen carries the population-atlas label; no case data enters the app.
- Owner gate before any OR-adjacent use: this is teaching, not planning.
- Model: Codex (Swift) + Opus review; Mac build/sim run by the orchestrator (Codex sandbox limits).

## 4. Order and dependencies

```
Phase 0 (owner review) ─────────────────────────────────────────────► flips drafts
Phase 1A pilot (motor-cst) → 1A all lessons ─┐
Phase 1B, 1C (parallel, no shared files with 1A except lesson_briefings.js → 1C after 1A)
Phase 2A, 2C (TractLab, parallel with Phase 1)
D4 yes → 1D, 2B          D3 yes → Phase 4 (needs 1A, 1B events)
3A after 2C (shared understanding of bank export)   D6 yes → 3B
D5 yes → Phase 5 (needs 1A)
```

Shared-file risk: `lesson_briefings.js` (1A, 1C), `case_content.js` (1B), `viewer/index.html`
(2C, wave 3). Serialize units that share a file; never two worktrees on the same file at once.

## 5. First sprint (what the next session does)

1. 1A pilot on motor-cst: term list (Opus) → matcher + UI (Codex) → gates (Sonnet) → owner test.
2. 2A review record v3 (Codex + Sol) in parallel.
3. D1–D6 ruled 2026-09-26 (defaults). Start Phase 0 with motor-cst's review sheet.

## 6. Unknowns

- Web Speech accuracy for pt-BR anatomical terms; the 1A pilot measures it.
- Whether residents use Hodos at all (no signal today; Web Analytics exists, unread).
- Whether D0 banks warp to MNI cleanly enough for 3A; check one bank visually before building the loader.
- Whether "Stimulation site" (a glossary class from the 2026-08-17 grill, not in any ADR file) should appear in 2C; it is not implemented in code.
