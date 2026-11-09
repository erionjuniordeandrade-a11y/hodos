# State machines

Every place in `viewer/` that holds a mode or a lifecycle, and how to read it. The rule is in `docs/adr/0001-explicit-state-machines.md`. Survey date: 2026-11-09 (main f6bf4fb).

Status values:

- **Explicit**: one module names the states, and one pure function makes every transition. Node tests cover it.
- **Inline**: the state lives in one function or one closure and has no confirmed defect. Make it explicit when it next changes.
- **Follow-up**: a confirmed defect remains. The row names it.

## Atlas page (`atlas.html`)

| Machine | States | Module | Agent handle | Status |
|---|---|---|---|---|
| Reading (Lesson × Step × Lesson phase) | inactive; paused at (Step, brief / orient / compare / explain / recap) | `lesson_state.js`: `nextReading`, `previousReading`, `nextLabel`, `createLessonController` | `#lessonPanel[data-phase][data-step]`, `__atlasTest.lesson` | Explicit |
| Teach-back microphone | idle, listening, plus one status line | `teachback.js`: `micTransition` | `#teachbackMic[aria-pressed]`, `#teachbackMicStatus` | Explicit |
| Wash | none, network (all / focus), arterial (all / focus) | `cortex_wash.js`: `washOf`, `washLayers`, `washFromSearch`, `washReadout` | `body[data-wash]`, `__atlasTest.network` / `.arterial` | Explicit |
| History restore (popstate) | same Reading (fragment-only entry), changed Reading | `atlas_app.js` popstate handler; the Reading comparison uses `lessonStateFromSearch` | URL | Inline |
| Workspace mode | library, lesson, recap, explore; expanded; drawer open | `atlas_app.js` `setMode` | `body[data-mode]`, `body[data-expanded]` | Follow-up: in Explore the docked drawer's summary still closes it |
| Lesson scene ownership | free, lesson authored, inspecting a target, free inspection, lecture comparison, case marker | `atlas_app.js` `applyStep`, `inspectLessonTarget`, `compareLecture`, `pauseForExploration`, `restoreExploration` | `#lessonSceneStatus`, `#explorationStatus` | Inline |
| Cinematic view | off, on (Peel level, ghost) | `atlas_app.js` `setCinematic`, scene `setCinematic` | `#atlasCinematic[aria-pressed]`, `__atlasTest.cinematic` | Follow-up: fibre animation keeps running while the traces are hidden; a pathway chip changes the Layers surface level the Peel should own |
| Camera framing | auto-framed, user-moved, focus flight pending | `atlas_scene.js` | `__atlasTest.render.cameraFrame` | Follow-up: arrow keys during a focus flight do not cancel it, so the camera snaps back when bundles load |
| Slice panel | closed, open (axis, keep, crosshair); template idle / loading / ready / error | `atlas_slice_panel.js` | `__atlasTest.slicePanel` | Inline |
| Atlas loading | loading, ready, failed; context lost | `atlas_app.js`, `atlas_scene.js` | `__atlasTest.ready`, `#atlasLoading` | Inline |

## Case Conference (`case-conference.html`)

| Machine | States | Module | Agent handle | Status |
|---|---|---|---|---|
| Case progress | catalogue, practising Stage s (s ≤ maxStage), review only | `case_state.js`: `caseRoute`, `store.move` (the only position writer), `historyEntry` (one decision per history navigation) | `#caseMain[data-stage]` = `catalogue`, a Stage name or `review` | Explicit |
| Case audio | idle, requesting, recording, stopping, ready, error; after dispose it stays idle and `start()` throws | `case_audio.js`: `AUDIO_STATUSES`, `ACTIVE_STATUSES`, generation token | `#audioPanel[data-status]` | Explicit |
| Decision commit | unanswered, selected, committed (locked) | `case_conference.js`, `case_state.js` `decide` | `[aria-checked]` | Inline |
| Reference dialog | closed, open (returns focus to its trigger) | `case_conference.js` | `dialog[open]` | Inline |

## Lesion lab (`labs/lesion-lab.html`)

| Machine | States | Module | Agent handle | Status |
|---|---|---|---|---|
| Load lifecycle | booting, slow, failed, ready, switching, switch-failed, torn-down | `lesion_model.js`: `LOAD_STATUSES`, `loadStep`, `loadFlags` | `__lesionLabTest.load` (plus the derived `ready`, `loading`, `slow`, `error`) | Explicit |
| Corridor per id (A / B) | unplaced, inside the sphere, valid; no cache entry means stale | `lesion_model.js`: `CORRIDOR_STATES`, `classifyCorridors` | URL `a`, `b`, `cd` | Explicit |
| Pointer interaction | idle, hovering, placing armed, place pending, dragging | `lesion_lab.js` | `[data-lesion]` cursor | Follow-up: the cursor is derived four ways with different priorities |
| Evidence drawer | closed, open | `lesion_lab.js` `openDrawer` / `closeDrawer` | `aria-expanded` | Follow-up: Esc does not close it |
| Sheet | peek, expanded | `lesion_lab.js` `setSheet` | `[data-sheet]` | Inline |
| Bundle focus | none, hovered row, open row | `lesion_lab.js` | `uFocus` | Inline (suspected: focus can stick when a hovered row is removed) |

## Other pages

| Machine | States | Module | Agent handle | Status |
|---|---|---|---|---|
| MIPS Phase | orient, compare, explain (plus corridor and width choices) | `mips_content.js` `parseMipsState` | `[data-phase][aria-pressed]`, `__mipsTest` | Explicit |
| MIPS scene load | loading, ready, failed, disposed | `mips.js` | `__mipsTest` | Inline |
| Connections view | a named view, a found node's neighbourhood; inspector intro / node / link | `connections.js` | URL hash | Follow-up: a neighbourhood is not written to the hash, so a reload shows the previous view |
| Landing video | playing, paused by the user, off screen, ended | `landing.js` | `aria-pressed` | Inline |
| Lesson preview dialog | closed, open (opener, scroll) | `lesson_previews.js` | `body.has-lesson-preview` | Inline |
