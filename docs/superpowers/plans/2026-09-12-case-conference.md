# Case Conference Implementation Plan

**Goal:** Add three fictional senior-level glioma conference exercises without removing features or changing existing progress.
**Spec:** `docs/case-conference-design-2026-09-12.md`.
**Architecture:** Separate page, content/state/controller modules and local audio. An explicit reference query opts the existing lesson player into session-only storage. Existing defaults remain identical.
**Stack:** Existing ES modules, CSS tokens, Node tests and Playwright. No new dependencies.

## Contract

Owner approved implementation. Root `/Users/eriondeandrade/hodos`, claimed branch `codex/case-conference-pilot`. Preserve prior untracked design docs. No patient uploads, grading, cloud transcription, removal, commit/push or deployment. Clinical debriefs are drafts requiring owner review. Audio lane owns only its two files; coordinator integrates everything else.

## Tasks

- [x] Model: create `case_content.js`, `case_state.js` and `tests/js/case_conference.test.js`. Test three cases, installed lesson references, opt-in storage, version mismatch, denial, deletion and existing learning-key preservation. Establish missing-module failure first. Export `CASES`, `CASE_VERSION`, `CASE_KEY`, `createCaseStore(storage)` with get/update/remember/clear/clearSaved/persistent methods.
- [x] Audio: Luna owns `case_audio.js` and tests. Export createCaseAudio with async start/stop, discard/dispose and status/blob/error. No storage/network. Test late permission cancellation and stopped tracks.
- [x] Page: create `case-conference.html`, `case_conference.css`, `case_conference.js`. Catalogue and six stages; labelled schematic; initial/revised/final responses; review-only; source-linked draft debrief and four rubric dimensions. Use textContent for all dynamic prose and user input. Only installed case/stage IDs in URL. Soft time guidance only.
- [x] Integration: add one link to atlas.html; pass readOnlyProgress for caseReference=1 to lesson mount; preserve the flag on internal reference links. Lazy reference dialog with focus return and iframe disposal. Explicitly export new assets/page from build-hodos.mjs.
- [x] Verify: `npm test`, immutable build to `dist/hodos-case-conference-20260912`; Playwright all cases, microphone denial/fake recording, storage denial, draft preservation, reference-storage isolation, desktop/mobile screenshots, keyboard/Escape, and existing atlas suite. Fix observed issues and rerun relevant checks.
- [x] Closeout: record source verification and content-review limits separately from technical checks; preserve old work, supply localhost preview and release claim. No deployment.

Example persistence contract: `store.update(id,{response:'draft'}); assert.equal(storage.getItem(CASE_KEY),null); store.remember(id,true); assert.match(storage.getItem(CASE_KEY),/draft/);` Never write the existing learning key. Version-incompatible records remain untouched until explicit reset. Response content and recordings never enter URLs or exported public build assets.

Build/import tests must keep existing allowlists and manifest checks. Browser round trip snapshots original lesson storage, opens a case reference, interacts and closes it, then asserts byte equality. Media cleanup must stop tracks on stop/error/discard/pagehide and late permission resolution. Typed draft survives mode changes; recordings stay in memory with optional explicit download.
