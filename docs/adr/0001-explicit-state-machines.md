# 1. Explicit state machines

Date: 2026-11-09. Status: accepted.

## Context

A survey of `viewer/` on 2026-11-09 found 25 state machines. Most stored a mode or a lifecycle in several flags and wrote it from many event handlers. The survey confirmed 15 defects. Each one is a combination that the flags allowed but the product did not mean. Examples: a stale-link notice that came back after Previous then Next, and a microphone button that read "Stop" after recognition had ended. Another was an arterial wash that stayed on during a Lesson without its label. The catalog is in `docs/state-machines.md`.

## Decision

Each state machine that drives what a learner sees is explicit:

1. One module names the closed set of states, as an exported frozen list.
2. Every transition goes through one pure function. Node tests call it without a browser.
3. The DOM only renders the state. Event handlers send events; they do not set flags.
4. One `data-*` attribute or one `__…Test` field names the current state, so an agent reads one value instead of inferring it from labels.
5. `docs/state-machines.md` lists each machine with its states, its module and its handle. Add a row when you add a machine.

## Consequences

- A new state or event is a change to one function and its table test.
- Browser gates keep reading the same ids and labels. Labels come from the same table that decides the transition.
- Small machines with one writer and no confirmed defect stay inline until they change. The catalog marks them.
