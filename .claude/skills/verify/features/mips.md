# MIPS two-corridor exercise

## Sub-features
- Orient: reference anatomy, target, pathways, no corridors.
- Compare corridors: corridors A and B drawn to one target; Only A, Only B, Both; narrow/wide width.

## How to get to it (user POV)
Open `/mips`, press "Compare corridors".

## Driving it with verify.mjs
`--only=mips`. Opens `/mips?test=1`, waits for `__mipsTest.ready` and no `error`, records `scene.frames`, clicks "Compare corridors", waits for two corridors and a new frame, expects labels `A`,`B`, checks the canvas is not blank.

## Gotchas
- Tract bundles arrive after `ready`; the frame wait covers that.
- Only/Both buttons, width select, storage and overflow are covered by `tests/perf/mips.mjs`.
