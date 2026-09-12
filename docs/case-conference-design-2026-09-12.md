# Hodos Case Conference — additive pilot design

Status: consolidated design draft for owner review, not implemented. Owner: Dr. Erion de Andrade. Baseline repository HEAD: `482c555`. Design scope was developed using Superpowers brainstorming; existing `design.md` remains the visual contract.

## 1. Product promise

Help a senior neurosurgical resident rehearse an anatomical interpretation for a glioma case conference: explain relevant relationships, reconsider them when information changes, and state what remains uncertain.

This is a hypothesis to test with trainees, not a claim of improved clinical performance or future popularity. A reference atlas can support the reasoning exercise without representing a particular patient's anatomy.

## 2. Non-negotiable preservation

Case Conference is an additional destination. Keep the atlas, current lesson library, all existing relationships, Explore, Study, Present, sources, progress, branding and navigation destinations functional. Do not move existing users into cases by default. Do not replace a lesson, renumber it, change an existing lesson ID, or reset prior progress.

Add one visible Case Conference entry using the current design system. Keep the new case catalogue separate from the existing lesson catalogue. Case progress and case completion must never mark an existing lesson as reviewed. Returning from an atlas reference must not silently alter the learner's original atlas or lesson session.

## 3. Audience and release order

Primary: senior neurosurgical residents preparing for case conferences. Secondary phases, after pilot evidence: independent study using the same case material, then attending-led rounds. The first pilot contains three fictional glioma/intra-axial teaching cases:

| Case | Reasoning objective to develop and clinically review |
|---|---|
| Medial frontal | Explain competing interpretations of motor-related findings using relevant anatomical relationships. |
| Insular | Integrate cortical, tract, deep nuclear and vascular considerations, while identifying unavailable evidence. |
| Temporoparietal | Explain language and visual-pathway relationships without equating atlas parcels with individual function. |

Finish the medial frontal case through content and usability review first; then complete the other two using the tested pattern. This sequences the agreed three-case pilot rather than deleting two cases from scope. The table is an authoring brief, not a finished clinical answer key.

## 4. The resident experience

Approximately ten minutes is a design target, not a forced timeout. Residents may pause, revisit released information, or leave without losing accessible progress.

1. **Read the case.** A brief fictional vignette and clearly labelled schematic lesion establish the question. Show which information is available and which is intentionally absent.
2. **State an interpretation.** Capture a short initial explanation and one uncertainty before opening the expert debrief.
3. **Explore relationships.** Link to a small number of relevant existing atlas views and lessons. The task identifies what to compare; the learner controls the view.
4. **Consider a new finding.** Reveal one internally consistent finding that matters to the reasoning. Ask what it changes and what it does not change. A defensible reaffirmation is as acceptable as a revision; do not reward changing an answer merely because a new stage appeared.
5. **Prepare the conference response.** The learner chooses speech or writing and explains the interpretation, key relationships, effect of the new finding, and remaining uncertainty. Sixty seconds is a spoken-response guide; written responses have an equivalent concise prompt without speed penalties.
6. **Compare with expert reasoning.** Show the learner's own response alongside a reviewed debrief with alternatives, evidence boundaries and a self-assessment rubric. End with one relationship worth revisiting in the existing lesson library.

Offer an explicit "Review only" path for an attending or a resident who wants the debrief without recording a response. Distinguish review-only use from completion of the practice exercise; do not gate knowledge behind a recording permission or a forced answer.

## 5. Spoken and written responses

Both choices receive the same prompt, rubric and access to feedback. Modality may be changed without losing an existing typed draft. No automated grading, accent/fluency assessment, or mandatory transcription.

- Written: a normal text field, user-controlled editing, optional local save and export.
- Spoken: an explicit record/stop control, local playback, re-record, discard and optional download. Request microphone access only after the user selects recording. Never upload audio automatically.
- If recording is unavailable or permission is denied, keep writing available and allow unrecorded verbal practice. Clearly state when no replayable response has been saved; do not call this a recording success.
- OS dictation is optional and outside the app's offline guarantee; it must not be the required spoken path.
- Recordings remain in memory by default and are discarded when the session closes; the interface explains this before recording. A future persistent-audio option requires its own explicit design. Text persistence is opt-in, separately namespaced and removable.
- Stop microphone tracks on stop, cancel, route leave, error and session cleanup. Leaving while recording requires an accessible stop/discard decision, not silent continued capture.

## 6. Expert debrief and rubric

The debrief is authored teaching material, not an LLM-generated verdict. Use four dimensions with case-specific examples: anatomical relationships, competing mechanisms, additional evidence needed, and uncertainty communicated. Each dimension allows "addressed", "partly addressed", and "revisit"; no arbitrary aggregate competence score or pass/fail certification.

The expert explanation should say why a particular finding matters, what alternative remains plausible, and what cannot be inferred. Sources attach to individual teaching claims, with study design and limits. Expert review must check internal consistency across all stages and whether more than one response can be defensible.

## 7. Schematic and evidence boundaries

Every case is visibly labelled fictional. Every invented lesion is labelled schematic at the point of use. If a lesion is shown against reference geometry, describe it as an illustrative placement; do not show millimetre margins, patient tract displacement, infiltration probabilities or implied surgical clearance. Do not simulate missing vascular or nuclear detail as if it were installed atlas data.

For the first implementation, a separate labelled schematic beside linked reference-atlas views is acceptable and reduces renderer coupling. A true 3D illustrative overlay is a separate implementation option that requires explicit coordinate, laterality and occlusion checks. The design does not authorize patient registration or importing actual patient scans.

Fictional clinical details must be authored and reviewed, not presented as a published case. Published findings supporting the teaching claims need verified primary references; figure reuse needs asset-specific provenance and permission. The new case schematics and scripts have not yet been authored or clinically approved.

## 8. Pilot evaluation and adoption hypothesis

Invite 6–10 senior residents through the owner as a formative usability pilot; no recruitment messages are authorized here. Observe the first completed case before polishing the remaining two. Ask how participants currently prepare for conference rather than assuming an unmet need.

Record completion without facilitator rescue, navigation interruptions, time to finish, reasons for abandonment, ability to explain what the new finding changes, and whether either response modality creates barriers. Use a short unfamiliar vignette assessed by a human reviewer with a case-specific rubric to probe transfer. Prefer anonymized and blinded responses where feasible; self-ratings alone do not establish learning.

After all three cases are available, check whether residents voluntarily return for another case during a 1–2 week observation window. Separate spontaneous return from research reminders. A small convenience sample cannot establish effectiveness, clinical competence or population-level adoption. Use manual/consented observation first; no hidden analytics, public ranking or new telemetry service.

Continue only if residents can complete the reasoning/debrief loop, the expert review identifies no misleading representation, and participants describe a concrete preparation use. If users only admire the 3D view but cannot explain the case, improve the task and debrief before expanding the catalogue.

## 9. Educational evidence informing the hypothesis

Repeated retrieval with feedback improved delayed recall compared with repeated study in a randomized trial involving paediatric and emergency medicine residents. This supports testing an active-response/debrief design, but does not validate Hodos, glioma reasoning or a ten-minute session: [Larsen, Butler and Roediger, 2009](https://pubmed.ncbi.nlm.nih.gov/19930508/).

A separate study of medical students found benefits of repeated retrieval for later simulated clinical application. Its setting and participants differ from senior neurosurgical trainees: [Larsen and colleagues, 2013](https://pubmed.ncbi.nlm.nih.gov/22618856/). These studies motivate evaluation; they do not justify efficacy claims for the proposed feature.

## 10. Scope boundaries and implementation acceptance

No existing-feature removal, new AI backend, automated scoring, patient upload, multiplayer mode, paid content service, streak system or new native-app rebuild in this pilot. Use the installed visual tokens, fonts and accessible interaction patterns.

Before implementation is accepted:

- All existing lesson URLs, phases, modes and stored progress behave as before.
- Case navigation is additive and can be removed without migrating existing lesson data.
- Each case opens, stages correctly, survives supported navigation, offers speech/writing and reaches the debrief. Denied storage and denied microphone paths remain usable and truthful.
- No recording or draft text appears in URLs, telemetry, build assets or public exports.
- Content version changes never silently combine an old response with an incompatible new case. Offer restart or a clearly identified previous response.
- Keyboard and touch controls, reduced motion, small layouts, labelled diagrams and non-visual equivalents receive direct checks. No timer automatically advances a case.
- Build export remains explicit; new files are added intentionally to the allowlist and original data integrity checks stay intact.
- Medical-content review, technical checks and resident evaluation are reported separately.

## 11. Integration evidence and recommendation

Use a dedicated `case-conference.html` destination and separate case catalogue/controller rather than adding fictional cases to `LESSONS` or introducing a fourth Orient/Compare/Explain phase. Reuse visual tokens and reference-atlas data. The initial reference interaction can be a deliberately isolated atlas view; the detailed integration must establish persistence isolation before it is called safe.

Observed at the inspected HEAD:

- `viewer/anatomy_learning.js:6` uses the shared `tractlab.anatomy.learning.v1` key. Its `visit()` writes both progress and `lastLesson` (lines 34–37). Opening an ordinary lesson in another same-origin tab is therefore not sufficient to preserve previous lesson persistence.
- `viewer/anatomy_lesson_player.js:23` constructs that progress store. A case reference must use an explicit read-only/in-memory progress adapter or a separate case viewer; do not clear, restore wholesale, or migrate the existing store as a workaround.
- `viewer/atlas_app.js:26` owns URL synchronization; transient case-response text and audio never belong there. Preserve existing query behavior.
- `scripts/build-hodos.mjs:7` enumerates exported modules and line 92 enumerates pages. A new page and its modules require intentional allowlist additions; copying the entire viewer tree would violate the existing export boundary.

Acceptance should snapshot the existing learning key before a case-reference round trip, exercise the reference controls and return, and assert unchanged stored bytes. Separately verify that the original running atlas view and the case stage are preserved. If a resident explicitly leaves Case Conference to study a normal lesson, ordinary lesson progress may update as before; that must be a clearly different action from consulting a case reference.

## 12. Decision status

Owner-confirmed: additive only; senior residents; glioma/intra-axial scope; three staged fictional cases; schematic lesions; spoken/written choice; expert self-assessment; conference preparation before other uses.

Recommended for this draft: separate Case Conference destination, private local response handling, review-only path, one complete case before scaling authoring to the other two, soft timing and formative evaluation. No application code is changed by this document. Owner review of the consolidated design precedes an implementation plan.
