# Featured lesson anatomy previews

## Goal and workflow

Hodos visitors can inspect three enlarged anatomy plates, understand the relationship shown, and open that exact authored lesson scene.

- Workflow: `hodos:lesson-previews`; owner: Erion de Andrade; medium repo change.
- Root: `/Users/eriondeandrade/hodos`, `main`; baseline `d0ae63c`, clean.
- Authority: user requested efficient-codex implementation after the three-card proposal; implementation, verification, commit, push and deployment are authorized by the operating contract.
- Sources: `viewer/index.html`, `design.md`, `lesson_content.js`, `anatomy_learning.js`, `lesson_state.js`, existing export/publication checks.
- Instructions: supplied home AGENTS contract and efficient-codex skill; no repository AGENTS file. Repository claimed through agent-claim.sh. Code-review graph reports no registered repositories, so targeted source reads apply.

## Design

- Visual thesis: dark editorial anatomy plates with generous specimen space, short captions, and existing bone/ice typography.
- Content: enhance the three featured lesson frames; enlarged specimen, relationship title, one observation, evidence limit, then Explore this view.
- Interaction: subtle existing hover feedback; native modal preview; existing authored camera transition after entry. Respect reduced motion and preserve the established page composition.
- Reuse the current motor, frontal-aslant and default-mode lessons. Capture reference atlas geometry, not generated anatomy or third-party artwork.

## Scope and ownership

- Parent: HTML, CSS, atlas capture assets/provenance, explicit export list, relevant export/publication contracts, integration, browser verification and release.
- One implementer: `viewer/lesson_previews.js` and `tests/perf/lesson_previews.mjs` only.
- No new curriculum, clinical claims, viewer renderer changes, dependencies, credentials, or global configuration changes.

## Acceptance

- Three cards open distinct labelled previews, with legible images and correct explanations at desktop and mobile sizes.
- Explore opens the authored left-hemisphere relationship at step 0, Orient phase; reloading preserves the scene selection.
- Escape, Close, outside click, keyboard focus containment and focus return work; links remain usable without JavaScript and with modifier-click.
- Large plates load only on demand; no atlas payload is added to landing-page startup.
- `npm test`, fresh allowlisted export, focused browser gate, and publication verification pass on the combined output. Inspect screenshots, not only DOM assertions.
- Verify deployed release identity and the public interaction after release.

## Risk, recovery and stop conditions

- Landing presentation and public export only; existing routes, progress and anatomical sources retained.
- Rollback: revert the bounded feature commit or restore the preceding immutable Pages deployment.
- Stop for concurrent ownership conflict, new paid access, credential changes, unrecoverable verification failure or material scope growth.
- Save technical evidence under ignored `output/lesson-previews-20260919/`, publish only allowlisted product files, and write a repository closeout. No private data or transcripts persisted.
- No persistent automation beyond the relevant existing CI verification step.
